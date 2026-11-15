import type { Language, UserProfile } from './finance';

export const FREE_EXPENSE_LIMIT = 3;

export type SubscriptionPlanId = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  priceBrl: string;
  periodBrl: string;
  priceUsd: string;
  periodUsd: string;
  isPopular: boolean;
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: 'monthly',
    priceBrl: 'R$ 19,90',
    periodBrl: '/mês',
    priceUsd: '$ 7.99',
    periodUsd: '/mo',
    isPopular: false,
  },
  {
    id: 'annual',
    priceBrl: 'R$ 119,90',
    periodBrl: '/ano',
    priceUsd: '$ 49.99',
    periodUsd: '/yr',
    isPopular: true,
  },
] as const;

export const PAYMENT_CHECKOUT_URL: string = (() => {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    return (meta?.env?.VITE_PAYMENT_CHECKOUT_URL ?? '').trim();
  } catch {
    return '';
  }
})();

export function canCreateExpense(
  user: Pick<UserProfile, 'is_pro'> | null | undefined,
  currentExpenseCount: number
): boolean {
  if (!user) return false;
  if (user.is_pro === true) return true;
  const safeCount = Number.isFinite(currentExpenseCount)
    ? Math.max(0, currentExpenseCount)
    : 0;
  return safeCount < FREE_EXPENSE_LIMIT;
}

export function shouldBlockExpenseCreation(
  user: Pick<UserProfile, 'is_pro'> | null | undefined,
  currentExpenseCount: number
): boolean {
  if (!user) return false;
  return !canCreateExpense(user, currentExpenseCount);
}

export function getRemainingFreeExpenses(
  user: Pick<UserProfile, 'is_pro'> | null | undefined,
  currentExpenseCount: number
): number {
  if (user?.is_pro === true) return Number.POSITIVE_INFINITY;
  const safeCount = Number.isFinite(currentExpenseCount)
    ? Math.max(0, currentExpenseCount)
    : 0;
  return Math.max(0, FREE_EXPENSE_LIMIT - safeCount);
}

export function getPlanDisplayPrice(
  planId: SubscriptionPlanId,
  lang: Language
): string {
  const plan =
    SUBSCRIPTION_PLANS.find((item) => item.id === planId) ?? SUBSCRIPTION_PLANS[1];
  return lang === 'pt-BR'
    ? `${plan.priceBrl}${plan.periodBrl}`
    : `${plan.priceUsd}${plan.periodUsd}`;
}
