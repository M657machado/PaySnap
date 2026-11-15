import { useEffect, useState } from 'react';
import { Check, Download, X } from 'lucide-react';
import { formatCurrency, type Language } from '../lib/finance';
import { COPY } from '../lib/i18n';
import { PaySnapLogo } from './PaySnapLogo';

interface StoriesModalProps {
  isOpen: boolean;
  lang: Language;
  latestRoast: string;
  availableBalance: number;
  isOnBudget: boolean;
  onClose: () => void;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function renderStoriesPng(params: {
  roast: string;
  balanceLabel: string;
  balanceValue: string;
  roastLabel: string;
  statusLabel: string;
  isOnBudget: boolean;
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clean royal blue gradient backdrop
  const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
  grad.addColorStop(0, '#1E3A8A');
  grad.addColorStop(0.55, '#1D4ED8');
  grad.addColorStop(1, '#0F172A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Subtle decorative glow circles
  ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
  ctx.beginPath();
  ctx.arc(920, 260, 260, 0, Math.PI * 2);
  ctx.fill();

  // White card container
  const cardX = 88;
  const cardY = 260;
  const cardW = 904;
  const cardH = 1360;
  const radius = 56;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();

  // PaySnap icon mark inside card
  ctx.fillStyle = '#1D4ED8';
  ctx.beginPath();
  ctx.roundRect(160, 340, 88, 88, 24);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(184, 360, 40, 48, 8);
  ctx.fill();
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(240, 348, 13, 0, Math.PI * 2);
  ctx.fill();

  // Wordmark
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 54px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('PaySnap', 274, 402);

  // Status label
  ctx.fillStyle = params.isOnBudget ? '#10B981' : '#E11D48';
  ctx.font = '600 32px "DM Sans", system-ui, sans-serif';
  ctx.fillText(params.statusLabel, 160, 520);

  // Roast section label
  ctx.fillStyle = '#64748B';
  ctx.font = '600 30px "DM Sans", system-ui, sans-serif';
  ctx.fillText(params.roastLabel, 160, 620);

  // Quote box
  ctx.fillStyle = '#F4F6F9';
  ctx.beginPath();
  ctx.roundRect(160, 660, 760, 460, 36);
  ctx.fill();

  ctx.fillStyle = '#0F172A';
  ctx.font = '600 50px "Plus Jakarta Sans", system-ui, sans-serif';
  const lines = wrapLines(ctx, `“${params.roast}”`, 660);
  lines.slice(0, 5).forEach((line, idx) => {
    ctx.fillText(line, 208, 760 + idx * 72);
  });

  // Balance footer inside card
  ctx.fillStyle = '#64748B';
  ctx.font = '500 32px "DM Sans", system-ui, sans-serif';
  ctx.fillText(params.balanceLabel, 160, 1280);

  ctx.fillStyle = '#1D4ED8';
  ctx.font = '700 84px "JetBrains Mono", monospace';
  ctx.fillText(params.balanceValue, 160, 1390);

  // Footer watermark tag
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.font = '500 30px "DM Sans", system-ui, sans-serif';
  ctx.fillText('paysnap.app', 446, 1740);

  return canvas.toDataURL('image/png');
}

export function StoriesModal({
  isOpen,
  lang,
  latestRoast,
  availableBalance,
  isOnBudget,
  onClose,
}: StoriesModalProps) {
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const t = COPY[lang];
  const fallbackRoast =
    lang === 'pt-BR'
      ? 'Seu extrato está sob controle… por enquanto.'
      : 'Your spending is behaving… for now.';
  const displayRoast = latestRoast || fallbackRoast;
  const formattedBalance = formatCurrency(availableBalance, lang);

  const handleDownload = () => {
    const dataUrl = renderStoriesPng({
      roast: displayRoast,
      balanceLabel: t.storiesMonthlySaved,
      balanceValue: formattedBalance,
      roastLabel: t.storiesLatestRoast,
      statusLabel: isOnBudget ? t.onBudgetTag : t.overBudgetTag,
      isOnBudget,
    });

    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `paysnap-story-9x16-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.storiesTitle}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm rounded-[20px] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {t.storiesTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{t.storiesSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.cancel}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 9:16 Vertical Preview */}
        <div className="mx-auto mt-4 w-56 aspect-[9/16] rounded-[20px] bg-gradient-to-br from-blue-900 via-[#1D4ED8] to-slate-900 p-3.5 shadow-lg flex flex-col justify-between">
          <div className="flex-1 rounded-2xl bg-white p-4 flex flex-col justify-between">
            <div>
              <PaySnapLogo size="sm" />
              <p
                className={`mt-2.5 text-[11px] font-semibold ${
                  isOnBudget ? 'text-[#10B981]' : 'text-rose-600'
                }`}
              >
                {isOnBudget ? t.onBudgetTag : t.overBudgetTag}
              </p>
            </div>

            <div className="rounded-xl bg-[#F4F6F9] p-3">
              <p className="text-[10px] font-medium text-slate-500">
                {t.storiesLatestRoast}
              </p>
              <p className="mt-1 text-xs font-semibold leading-snug text-slate-900">
                “{displayRoast}”
              </p>
            </div>

            <div>
              <p className="text-[10px] font-medium text-slate-500">
                {t.storiesMonthlySaved}
              </p>
              <p className="mt-0.5 font-mono text-lg font-bold text-[#1D4ED8] tabular-nums">
                {formattedBalance}
              </p>
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] font-medium text-white/75">
            paysnap.app
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="mt-5 min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer"
        >
          {downloaded ? (
            <>
              <Check className="h-4 w-4" />
              <span>{t.storiesDownloaded}</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>{t.storiesDownloadBtn}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
