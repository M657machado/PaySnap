import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GEMINI_MODEL_FALLBACK_CHAIN,
  executeWithModelFallback,
  isRetryableGeminiError,
} from './geminiFallback';

test('primary model succeeds on first attempt without calling fallback', async () => {
  const called: string[] = [];
  const res = await executeWithModelFallback(
    GEMINI_MODEL_FALLBACK_CHAIN,
    async (model) => {
      called.push(model);
      return { ok: true, model };
    }
  );

  assert.deepEqual(called, ['gemini-3.1-flash-lite']);
  assert.equal(res.modelUsed, 'gemini-3.1-flash-lite');
  assert.equal(res.attempts, 1);
});

test('falls back to gemini-4-hydrogen when primary returns 503 high demand', async () => {
  const called: string[] = [];
  const fallbacks: Array<[string, string]> = [];

  const res = await executeWithModelFallback(
    GEMINI_MODEL_FALLBACK_CHAIN,
    async (model) => {
      called.push(model);
      if (model === 'gemini-3.1-flash-lite') {
        const err = new Error('503 Service Unavailable: model experiencing high demand');
        (err as Error & { status?: number }).status = 503;
        throw err;
      }
      return { amount: 42 };
    },
    (failed, next) => fallbacks.push([failed, next])
  );

  assert.deepEqual(called, ['gemini-3.1-flash-lite', 'gemini-4-hydrogen']);
  assert.deepEqual(fallbacks, [['gemini-3.1-flash-lite', 'gemini-4-hydrogen']]);
  assert.equal(res.modelUsed, 'gemini-4-hydrogen');
  assert.equal(res.attempts, 2);
  assert.deepEqual(res.result, { amount: 42 });
});

test('propagates error when all models in fallback chain fail temporarily', async () => {
  const called: string[] = [];

  await assert.rejects(
    executeWithModelFallback(GEMINI_MODEL_FALLBACK_CHAIN, async (model) => {
      called.push(model);
      throw new Error('ETIMEDOUT temporary network failure');
    }),
    /ETIMEDOUT/
  );

  assert.deepEqual(called, ['gemini-3.1-flash-lite', 'gemini-4-hydrogen']);
});

test('does not fall back on non-retryable API key or permission errors', async () => {
  const called: string[] = [];

  await assert.rejects(
    executeWithModelFallback(GEMINI_MODEL_FALLBACK_CHAIN, async (model) => {
      called.push(model);
      const err = new Error('403 PERMISSION_DENIED: API key not valid');
      (err as Error & { status?: number }).status = 403;
      throw err;
    }),
    /PERMISSION_DENIED/
  );

  assert.deepEqual(called, ['gemini-3.1-flash-lite']);
});

test('isRetryableGeminiError classifies transient vs auth errors accurately', () => {
  assert.equal(isRetryableGeminiError(new Error('503 UNAVAILABLE')), true);
  assert.equal(isRetryableGeminiError(new Error('Model is overloaded')), true);
  assert.equal(isRetryableGeminiError(new Error('429 RESOURCE_EXHAUSTED')), true);
  assert.equal(isRetryableGeminiError(new Error('403 PERMISSION_DENIED')), false);
  assert.equal(isRetryableGeminiError(new Error('API_KEY_INVALID')), false);
});
