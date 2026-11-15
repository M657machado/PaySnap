import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  clampAiRoast,
  normalizeCategory,
  type Language,
} from './src/lib/finance.ts';
import {
  GEMINI_MODEL_FALLBACK_CHAIN,
  executeWithModelFallback,
} from './src/lib/geminiFallback.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function createGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(error: unknown): { status: number; message: string } {
  const rawMessage =
    error instanceof Error ? error.message : 'Expense analysis failed.';

  if (
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('403') ||
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('API key not valid')
  ) {
    return {
      status: 403,
      message:
        'Gemini API key could not access this model. Check GEMINI_API_KEY in Settings > Secrets.',
    };
  }

  if (rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('429')) {
    return {
      status: 429,
      message: 'Gemini quota reached. Please wait a moment and try again.',
    };
  }

  if (
    rawMessage.includes('503') ||
    rawMessage.toLowerCase().includes('unavailable') ||
    rawMessage.toLowerCase().includes('high demand') ||
    rawMessage.toLowerCase().includes('overloaded')
  ) {
    return {
      status: 503,
      message:
        'Gemini models are temporarily experiencing high demand. Please try again in a few seconds.',
    };
  }

  if (
    rawMessage.includes('404') ||
    rawMessage.includes('NOT_FOUND')
  ) {
    return {
      status: 404,
      message:
        'Selected Gemini model is unavailable right now. Please try again in a moment.',
    };
  }

  return {
    status: 500,
    message: rawMessage,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/expenses/analyze', async (req, res) => {
    const {
      mediaBase64,
      mimeType,
      textNote,
      lang = 'pt-BR',
    } = (req.body ?? {}) as {
      mediaBase64?: string;
      mimeType?: string;
      textNote?: string;
      lang?: Language;
    };

    const activeLang: Language = lang === 'en-US' ? 'en-US' : 'pt-BR';
    const hasMedia =
      typeof mediaBase64 === 'string' &&
      mediaBase64.length > 0 &&
      typeof mimeType === 'string' &&
      mimeType.length > 0;
    const cleanNote = typeof textNote === 'string' ? textNote.trim() : '';

    if (!hasMedia && !cleanNote) {
      return res.status(400).json({
        error:
          activeLang === 'pt-BR'
            ? 'Envie uma foto, grave um áudio ou descreva o gasto.'
            : 'Provide a photo, voice note, or short expense description.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(400).json({
        error:
          activeLang === 'pt-BR'
            ? 'Chave GEMINI_API_KEY não configurada. Adicione em Settings > Secrets para analisar fotos e áudios.'
            : 'GEMINI_API_KEY is not configured. Add it in Settings > Secrets to analyze receipts and voice.',
      });
    }

    const ai = createGeminiClient();
    const parts: Array<
      | { text: string }
      | { inlineData: { data: string; mimeType: string } }
    > = [];

    if (hasMedia && mediaBase64 && mimeType) {
      parts.push({
        inlineData: {
          data: mediaBase64,
          mimeType,
        },
      });
    }

    const languageInstruction =
      activeLang === 'pt-BR'
        ? 'Responda em Português do Brasil (PT-BR). Exemplo de ai_roast: "Mais um delivery? Sua cozinha já está cobrando aluguel."'
        : 'Respond in English (EN-US). Example ai_roast: "Another delivery? Your kitchen is about to charge you rent."';

    const userPrompt = cleanNote
      ? `Analyze this expense input ("${cleanNote}") and extract amount, merchant, category, and a short sarcastic ai_roast (max 110 characters). ${languageInstruction}`
      : `Analyze the attached receipt image, Pix screenshot, or voice audio and extract amount, merchant, category, and a short sarcastic ai_roast (max 110 characters). ${languageInstruction}`;

    parts.push({ text: userPrompt });

    try {
      const { result: response } = await executeWithModelFallback(
        GEMINI_MODEL_FALLBACK_CHAIN,
        (modelName) =>
          ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              systemInstruction:
                'You are PaySnap, a sharp, witty, sarcastic personal-finance AI assistant. Extract accurate expense fields from receipts, Pix screenshots, voice audio, or text notes. Return strictly JSON matching the schema. Always keep ai_roast playful, punchy, and strictly <= 110 characters.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  amount: {
                    type: Type.NUMBER,
                    description: 'Total numeric amount spent (positive number).',
                  },
                  merchant: {
                    type: Type.STRING,
                    description: 'Store, app, or recipient name (concise).',
                  },
                  category: {
                    type: Type.STRING,
                    description:
                      'One of: food, transport, leisure, bills, other.',
                  },
                  ai_roast: {
                    type: Type.STRING,
                    description:
                      'Short sarcastic humorous reaction, strictly max 110 characters.',
                  },
                },
                required: ['amount', 'merchant', 'category', 'ai_roast'],
              },
            },
          }),
        (failedModel, nextModel) => {
          console.info(
            `[PaySnap] Model "${failedModel}" unavailable temporarily, retrying with fallback "${nextModel}".`
          );
        }
      );

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
        amount?: number;
        merchant?: string;
        category?: string;
        ai_roast?: string;
      };

      const amount = Number(parsed.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(422).json({
          error:
            activeLang === 'pt-BR'
              ? 'Não foi possível identificar um valor válido. Tente outra foto ou áudio mais claro.'
              : 'Could not detect a valid expense amount. Try a clearer image or note.',
        });
      }

      const merchant =
        typeof parsed.merchant === 'string' && parsed.merchant.trim()
          ? parsed.merchant.trim().slice(0, 64)
          : activeLang === 'pt-BR'
            ? 'Estabelecimento'
            : 'Merchant';

      const category = normalizeCategory(String(parsed.category ?? 'other'));
      const defaultRoast =
        activeLang === 'pt-BR'
          ? 'Cartão passou liso, sua meta mensal nem tanto.'
          : 'Card went through smoothly; your budget felt that one.';
      const aiRoast =
        clampAiRoast(String(parsed.ai_roast ?? ''), 110) || defaultRoast;

      return res.json({
        expense: {
          amount: Math.round(amount * 100) / 100,
          merchant,
          category,
          ai_roast: aiRoast,
        },
      });
    } catch (error) {
      const formatted = formatGeminiError(error);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
        hmr: hmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PaySnap server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
