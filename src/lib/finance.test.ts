import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampAiRoast,
  computeBudgetMetrics,
  detectBrowserLanguage,
  formatCurrency,
  getDaysRemainingInMonth,
  normalizeCategory,
  sortExpensesNewestFirst,
  validateBudgetInput,
  type ExpenseRecord,
} from './finance';

test('detectBrowserLanguage selects pt-BR for Portuguese locales and en-US otherwise', () => {
  assert.equal(detectBrowserLanguage('pt-BR'), 'pt-BR');
  assert.equal(detectBrowserLanguage('pt'), 'pt-BR');
  assert.equal(detectBrowserLanguage('en-US'), 'en-US');
  assert.equal(detectBrowserLanguage('es-ES'), 'en-US');
});

test('formatCurrency displays R$ in pt-BR and $ in en-US', () => {
  const pt = formatCurrency(4500, 'pt-BR');
  const en = formatCurrency(4500, 'en-US');
  assert.ok(pt.includes('R$'));
  assert.ok(pt.includes('4.500,00'));
  assert.ok(en.includes('$4,500.00'));
});

test('getDaysRemainingInMonth includes today through end of month', () => {
  // Nov 15 -> 30 - 15 + 1 = 16 days remaining
  assert.equal(getDaysRemainingInMonth(new Date(2026, 10, 15)), 16);
  // Nov 30 -> 1 day remaining
  assert.equal(getDaysRemainingInMonth(new Date(2026, 10, 30)), 1);
});

test('computeBudgetMetrics calculates available balance, safe daily limit, and progress', () => {
  const expenses: ExpenseRecord[] = [
    {
      id: '1',
      user_id: 'u1',
      amount: 500,
      merchant: 'Mercado',
      category: 'food',
      ai_roast: 'Roast 1',
      created_at: '2026-11-15T10:00:00Z',
    },
    {
      id: '2',
      user_id: 'u1',
      amount: 400,
      merchant: 'Uber',
      category: 'transport',
      ai_roast: 'Roast 2',
      created_at: '2026-11-14T10:00:00Z',
    },
  ];
  const metrics = computeBudgetMetrics(4500, expenses, new Date(2026, 10, 15));
  assert.equal(metrics.totalSpent, 900);
  assert.equal(metrics.availableBalance, 3600);
  assert.equal(metrics.spentPercent, 20);
  assert.equal(metrics.isOnBudget, true);
  assert.equal(metrics.daysRemainingInMonth, 16);
  assert.equal(metrics.safeDailyLimit, 225);
});

test('computeBudgetMetrics handles over-budget state cleanly', () => {
  const expenses: ExpenseRecord[] = [
    {
      id: '1',
      user_id: 'u1',
      amount: 5000,
      merchant: 'Rent',
      category: 'bills',
      ai_roast: 'Ouch',
      created_at: '2026-11-15T10:00:00Z',
    },
  ];
  const metrics = computeBudgetMetrics(4500, expenses, new Date(2026, 10, 15));
  assert.equal(metrics.isOnBudget, false);
  assert.equal(metrics.availableBalance, -500);
  assert.equal(metrics.safeDailyLimit, 0);
  assert.equal(metrics.spentPercent, 100);
});

test('sortExpensesNewestFirst orders descending by created_at', () => {
  const sorted = sortExpensesNewestFirst([
    {
      id: 'old',
      user_id: 'u',
      amount: 10,
      merchant: 'A',
      category: 'other',
      ai_roast: '',
      created_at: '2026-11-10T00:00:00Z',
    },
    {
      id: 'new',
      user_id: 'u',
      amount: 20,
      merchant: 'B',
      category: 'food',
      ai_roast: '',
      created_at: '2026-11-15T00:00:00Z',
    },
  ]);
  assert.equal(sorted[0].id, 'new');
  assert.equal(sorted[1].id, 'old');
});

test('clampAiRoast enforces max 110 characters and normalizes whitespace', () => {
  const longText =
    'Mais um delivery caro hoje? Sua cozinha já está cobrando aluguel e pensando em pedir divórcio por abandono de fogão.';
  const clamped = clampAiRoast(longText, 110);
  assert.ok(clamped.length <= 110);
  assert.ok(clamped.endsWith('…'));
});

test('normalizeCategory and validateBudgetInput sanitize inputs', () => {
  assert.equal(normalizeCategory('FOOD'), 'food');
  assert.equal(normalizeCategory('unknown_cat'), 'other');
  assert.equal(validateBudgetInput('4500,50').value, 4500.5);
  assert.equal(validateBudgetInput('-100').valid, false);
});
