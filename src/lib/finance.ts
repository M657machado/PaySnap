export type Language = 'pt-BR' | 'en-US';

export type ExpenseCategory = 'food' | 'transport' | 'leisure' | 'bills' | 'other';

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'food',
  'transport',
  'leisure',
  'bills',
  'other',
] as const;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  monthly_budget: number;
  ai_persona: 'sarcastic';
  is_pro: boolean;
  plan_type?: 'free' | 'monthly' | 'annual';
  created_at: string;
}

export interface ExpenseRecord {
  id: string;
  user_id: string;
  amount: number;
  merchant: string;
  category: ExpenseCategory;
  ai_roast: string;
  created_at: string;
}

export interface BudgetMetrics {
  totalSpent: number;
  availableBalance: number;
  spentPercent: number;
  rawPercent: number;
  isOnBudget: boolean;
  daysRemainingInMonth: number;
  safeDailyLimit: number;
  weeklySavingsGoal: number;
}

export function detectBrowserLanguage(navigatorLang?: string): Language {
  const source =
    navigatorLang ??
    (typeof navigator !== 'undefined' ? navigator.language : 'pt-BR');
  return source.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-US';
}

export function formatCurrency(amount: number, lang: Language): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: lang === 'pt-BR' ? 'BRL' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

export function formatShortDate(isoDate: string, lang: Language): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(lang, {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function getDaysRemainingInMonth(now: Date = new Date()): number {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  return Math.max(1, lastDayOfMonth - currentDay + 1);
}

export function computeBudgetMetrics(
  monthlyBudget: number,
  expenses: ExpenseRecord[],
  now: Date = new Date()
): BudgetMetrics {
  const safeBudget = Number.isFinite(monthlyBudget) && monthlyBudget > 0 ? monthlyBudget : 0;
  const totalSpent = expenses.reduce(
    (sum, item) => sum + (Number.isFinite(item.amount) ? Math.max(0, item.amount) : 0),
    0
  );
  const availableBalance = safeBudget - totalSpent;
  const rawPercent = safeBudget > 0 ? (totalSpent / safeBudget) * 100 : totalSpent > 0 ? 100 : 0;
  const spentPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));
  const isOnBudget = availableBalance >= 0;
  const daysRemainingInMonth = getDaysRemainingInMonth(now);
  const safeDailyLimit =
    availableBalance > 0 ? availableBalance / daysRemainingInMonth : 0;
  const weeksRemaining = Math.max(1, Math.ceil(daysRemainingInMonth / 7));
  const weeklySavingsGoal =
    availableBalance > 0 ? (availableBalance * 0.2) / weeksRemaining : 0;

  return {
    totalSpent,
    availableBalance,
    spentPercent,
    rawPercent,
    isOnBudget,
    daysRemainingInMonth,
    safeDailyLimit,
    weeklySavingsGoal,
  };
}

export function sortExpensesNewestFirst(
  expenses: ExpenseRecord[]
): ExpenseRecord[] {
  return [...expenses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function normalizeCategory(raw: string): ExpenseCategory {
  const clean = raw.trim().toLowerCase();
  if ((EXPENSE_CATEGORIES as readonly string[]).includes(clean)) {
    return clean as ExpenseCategory;
  }
  return 'other';
}

export function clampAiRoast(text: string, maxLength = 110): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function validateBudgetInput(rawValue: string): {
  valid: boolean;
  value?: number;
  errorKey?: 'invalid_budget';
} {
  const normalized = rawValue.replace(/\s+/g, '').replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 10_000_000) {
    return { valid: false, errorKey: 'invalid_budget' };
  }
  return { valid: true, value: Math.round(parsed * 100) / 100 };
}
