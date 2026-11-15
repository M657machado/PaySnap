export const GEMINI_MODEL_FALLBACK_CHAIN = [
  'gemini-3.1-flash-lite',
  'gemini-4-hydrogen',
] as const;

export interface FallbackExecutionResult<T> {
  result: T;
  modelUsed: string;
  attempts: number;
}

const NON_RETRYABLE_PATTERNS = [
  'api_key_invalid',
  'api key not valid',
  'permission_denied',
  'invalid_argument',
];

const RETRYABLE_STATUS_CODES = new Set([404, 408, 429, 500, 502, 503, 504]);

const RETRYABLE_MESSAGE_PATTERNS = [
  '503',
  'unavailable',
  'high demand',
  'overloaded',
  'service unavailable',
  'temporarily',
  '429',
  'resource_exhausted',
  'deadline_exceeded',
  'timeout',
  'timed out',
  'econnreset',
  'etimedout',
  'enotfound',
  'fetch failed',
  'network',
  'internal',
  'not_found',
  '404',
];

function extractStatusCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const record = error as Record<string, unknown>;
  const candidates = [record.status, record.statusCode, record.code];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === 'string' && /^\d{3}$/.test(candidate)) {
      return Number(candidate);
    }
  }
  return null;
}

export function isRetryableGeminiError(error: unknown): boolean {
  const status = extractStatusCode(error);
  const message = (
    error instanceof Error ? error.message : String(error ?? '')
  ).toLowerCase();

  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    NON_RETRYABLE_PATTERNS.some((pattern) => message.includes(pattern))
  ) {
    return false;
  }

  if (status !== null && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  return RETRYABLE_MESSAGE_PATTERNS.some((pattern) =>
    message.includes(pattern)
  );
}

export async function executeWithModelFallback<T>(
  models: readonly string[],
  runWithModel: (model: string) => Promise<T>,
  onFallback?: (failedModel: string, nextModel: string, error: unknown) => void
): Promise<FallbackExecutionResult<T>> {
  if (models.length === 0) {
    throw new Error('At least one Gemini model must be provided.');
  }

  let lastError: unknown;

  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];
    try {
      const result = await runWithModel(model);
      return {
        result,
        modelUsed: model,
        attempts: i + 1,
      };
    } catch (error) {
      lastError = error;
      const hasNextModel = i < models.length - 1;
      if (!hasNextModel || !isRetryableGeminiError(error)) {
        throw error;
      }
      onFallback?.(model, models[i + 1], error);
    }
  }

  throw lastError;
}
