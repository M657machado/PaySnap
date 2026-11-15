import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FREE_EXPENSE_LIMIT,
  SUBSCRIPTION_PLANS,
  canCreateExpense,
  getPlanDisplayPrice,
  getRemainingFreeExpenses,
  shouldBlockExpenseCreation,
} from './subscription';

test('FREE_EXPENSE_LIMIT is strictly 3 expenses', () => {
  assert.equal(FREE_EXPENSE_LIMIT, 3);
});

test('free user can register up to 3 expenses and is blocked on the 4th attempt', () => {
  const freeUser = { is_pro: false };

  assert.equal(canCreateExpense(freeUser, 0), true);
  assert.equal(canCreateExpense(freeUser, 1), true);
  assert.equal(canCreateExpense(freeUser, 2), true);
  assert.equal(shouldBlockExpenseCreation(freeUser, 2), false);

  assert.equal(canCreateExpense(freeUser, 3), false);
  assert.equal(shouldBlockExpenseCreation(freeUser, 3), true);
  assert.equal(shouldBlockExpenseCreation(freeUser, 5), true);
});

test('pro user is never blocked regardless of expense count', () => {
  const proUser = { is_pro: true };

  assert.equal(canCreateExpense(proUser, 0), true);
  assert.equal(canCreateExpense(proUser, 3), true);
  assert.equal(canCreateExpense(proUser, 100), true);
  assert.equal(shouldBlockExpenseCreation(proUser, 3), false);
  assert.equal(getRemainingFreeExpenses(proUser, 10), Number.POSITIVE_INFINITY);
});

test('getRemainingFreeExpenses counts down cleanly to zero', () => {
  const freeUser = { is_pro: false };
  assert.equal(getRemainingFreeExpenses(freeUser, 0), 3);
  assert.equal(getRemainingFreeExpenses(freeUser, 2), 1);
  assert.equal(getRemainingFreeExpenses(freeUser, 3), 0);
  assert.equal(getRemainingFreeExpenses(freeUser, 8), 0);
});

test('subscription plans include bilingual monthly and popular annual pricing', () => {
  assert.equal(SUBSCRIPTION_PLANS.length, 2);
  const annual = SUBSCRIPTION_PLANS.find((p) => p.id === 'annual');
  assert.equal(annual?.isPopular, true);

  assert.equal(getPlanDisplayPrice('monthly', 'pt-BR'), 'R$ 19,90/mês');
  assert.equal(getPlanDisplayPrice('monthly', 'en-US'), '$ 7.99/mo');
  assert.equal(getPlanDisplayPrice('annual', 'pt-BR'), 'R$ 119,90/ano');
  assert.equal(getPlanDisplayPrice('annual', 'en-US'), '$ 49.99/yr');
});
