import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Camera,
  Car,
  CheckCircle2,
  Crown,
  Film,
  Globe,
  Lock,
  LogOut,
  Mic,
  Pencil,
  Receipt,
  Sparkles,
  Tag,
  Trash2,
  Utensils,
} from 'lucide-react';
import {
  computeBudgetMetrics,
  formatCurrency,
  formatShortDate,
  sortExpensesNewestFirst,
  validateBudgetInput,
  type ExpenseCategory,
  type ExpenseRecord,
  type Language,
  type UserProfile,
} from '../lib/finance';
import { COPY } from '../lib/i18n';
import {
  FREE_EXPENSE_LIMIT,
  shouldBlockExpenseCreation,
} from '../lib/subscription';
import { PaySnapLogo } from './PaySnapLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface DashboardProps {
  user: UserProfile;
  expenses: ExpenseRecord[];
  lang: Language;
  onToggleLanguage: () => void;
  onSignOut: () => void;
  onUpdateBudget: (newBudget: number) => void;
  onOpenCapture: () => void;
  onOpenPaywall: () => void;
  onOpenStories: (roast: string) => void;
  onDeleteExpense: (id: string) => void;
}

function CategoryIcon({ category }: { category: ExpenseCategory }) {
  const base =
    'h-10 w-10 rounded-xl flex items-center justify-center shrink-0';
  switch (category) {
    case 'food':
      return (
        <div className={`${base} bg-amber-50 text-amber-600`}>
          <Utensils className="h-5 w-5" />
        </div>
      );
    case 'transport':
      return (
        <div className={`${base} bg-blue-50 text-[#1D4ED8]`}>
          <Car className="h-5 w-5" />
        </div>
      );
    case 'leisure':
      return (
        <div className={`${base} bg-emerald-50 text-[#10B981]`}>
          <Film className="h-5 w-5" />
        </div>
      );
    case 'bills':
      return (
        <div className={`${base} bg-slate-100 text-slate-700`}>
          <Receipt className="h-5 w-5" />
        </div>
      );
    default:
      return (
        <div className={`${base} bg-slate-100 text-slate-600`}>
          <Tag className="h-5 w-5" />
        </div>
      );
  }
}

export function Dashboard({
  user,
  expenses,
  lang,
  onToggleLanguage,
  onSignOut,
  onUpdateBudget,
  onOpenCapture,
  onOpenPaywall,
  onOpenStories,
  onDeleteExpense,
}: DashboardProps) {
  const t = COPY[lang];
  const sortedExpenses = sortExpensesNewestFirst(expenses);
  const metrics = computeBudgetMetrics(user.monthly_budget, sortedExpenses);
  const latestRoast = sortedExpenses[0]?.ai_roast ?? '';
  const isLimitReached = shouldBlockExpenseCreation(user, sortedExpenses.length);

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(
    String(user.monthly_budget.toFixed(2))
  );
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditingBudget) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsEditingBudget(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditingBudget]);

  const openBudgetEditor = () => {
    setBudgetDraft(String(user.monthly_budget.toFixed(2)));
    setBudgetError(null);
    setIsEditingBudget(true);
  };

  const handleSaveBudget = (e: FormEvent) => {
    e.preventDefault();
    const result = validateBudgetInput(budgetDraft);
    if (!result.valid || !result.value) {
      setBudgetError(t.invalidBudget);
      return;
    }
    onUpdateBudget(result.value);
    setIsEditingBudget(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <PaySnapLogo size="sm" />

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton lang={lang} />

            <button
              type="button"
              onClick={onToggleLanguage}
              aria-label={
                lang === 'pt-BR' ? 'Alternar para Inglês' : 'Switch to Portuguese'
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-[#1D4ED8]" />
              <span>{t.langButton}</span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              aria-label={t.signOut}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">{t.signOut}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Main */}
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        {/* Main Balance Card */}
        <section
          aria-label={t.availableBalanceTitle}
          className="rounded-[20px] bg-white p-5 sm:p-6 shadow-xs border border-slate-200/60"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-sm font-medium text-slate-500">
              {t.availableBalanceTitle}
            </h1>

            <div
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                metrics.isOnBudget ? 'text-[#10B981]' : 'text-rose-600'
              }`}
            >
              {metrics.isOnBudget ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>
                {metrics.isOnBudget ? t.onBudgetTag : t.overBudgetTag}
              </span>
            </div>
          </div>

          <p
            data-testid="available-balance"
            className="mt-2 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums"
          >
            {formatCurrency(metrics.availableBalance, lang)}
          </p>

          {/* Royal Blue Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={metrics.spentPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t.spentLabel}
            className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                metrics.isOnBudget ? 'bg-[#1D4ED8]' : 'bg-rose-600'
              }`}
              style={{ width: `${metrics.spentPercent}%` }}
            />
          </div>

          {/* Spent & Clickable Budget */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
            <span className="font-medium text-slate-600 tabular-nums">
              {t.spentLabel}:{' '}
              <strong className="font-semibold text-slate-900">
                {formatCurrency(metrics.totalSpent, lang)}
              </strong>
            </span>

            <button
              type="button"
              onClick={openBudgetEditor}
              aria-label={t.editBudgetTitle}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-medium text-slate-600 hover:bg-[#F4F6F9] hover:text-[#1D4ED8] transition-colors tabular-nums cursor-pointer"
            >
              <span>
                {t.budgetLabel}:{' '}
                <strong className="font-semibold text-slate-900">
                  {formatCurrency(user.monthly_budget, lang)}
                </strong>
              </span>
              <Pencil className="h-3.5 w-3.5 text-[#1D4ED8]" />
            </button>
          </div>
        </section>

        {/* Two Side-by-Side Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Left Card: Safe Daily Limit */}
          <section
            aria-label={t.safeDailyTitle}
            className="rounded-[20px] bg-white p-4 sm:p-5 shadow-xs border border-slate-200/60 flex flex-col justify-between"
          >
            <h2 className="text-xs sm:text-sm font-medium text-slate-500">
              {t.safeDailyTitle}
            </h2>
            <p
              data-testid="safe-daily-limit"
              className="mt-2 font-mono text-xl sm:text-2xl font-bold tracking-tight text-slate-900 tabular-nums"
            >
              {formatCurrency(metrics.safeDailyLimit, lang)}
            </p>
            <p className="mt-2 text-[11px] sm:text-xs text-slate-400">
              {t.daysLeftSuffix(metrics.daysRemainingInMonth)}
            </p>
          </section>

          {/* Right Card: Weekly Goal & Generate Stories 9:16 */}
          <button
            type="button"
            onClick={() => onOpenStories(latestRoast)}
            className="rounded-[20px] bg-white p-4 sm:p-5 shadow-xs border border-slate-200/60 text-left hover:border-[#1D4ED8]/40 hover:bg-blue-50/20 transition-colors flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xs sm:text-sm font-medium text-slate-500">
                {t.weeklyGoalTitle}
              </h2>
              <Sparkles className="h-4 w-4 text-[#10B981] shrink-0" />
            </div>

            <p className="mt-2 font-mono text-xl sm:text-2xl font-bold tracking-tight text-[#10B981] tabular-nums">
              {formatCurrency(metrics.weeklySavingsGoal, lang)}
            </p>

            <span className="mt-2 inline-flex items-center text-xs font-semibold text-[#1D4ED8]">
              {t.weeklyGoalAction} →
            </span>
          </button>
        </div>

        {/* Subscription Status Line (Unboxed) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          {user.is_pro ? (
            <span
              data-testid="plan-status"
              className="inline-flex items-center gap-1.5 font-semibold text-[#10B981]"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>{t.proPlanStatus}</span>
            </span>
          ) : (
            <>
              <span
                data-testid="plan-status"
                className="font-medium text-slate-600 tabular-nums"
              >
                {t.freePlanStatus(sortedExpenses.length, FREE_EXPENSE_LIMIT)}
              </span>
              <button
                type="button"
                onClick={onOpenPaywall}
                className="font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                {t.upgradeLink} →
              </button>
            </>
          )}
        </div>

        {/* Primary Action CTA */}
        <button
          type="button"
          onClick={onOpenCapture}
          className={`w-full min-h-[54px] flex items-center justify-center gap-3 rounded-[20px] px-5 py-3.5 text-sm sm:text-base font-semibold text-white shadow-sm active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
            isLimitReached
              ? 'bg-slate-900 hover:bg-slate-800'
              : 'bg-[#1D4ED8] hover:bg-blue-800'
          }`}
        >
          {isLimitReached ? (
            <>
              <Lock className="h-5 w-5 text-[#10B981]" />
              <span>{t.quickLogCta}</span>
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              <span>{t.quickLogCta}</span>
              <Camera className="h-5 w-5" />
            </>
          )}
        </button>

        {/* Recent Transactions List */}
        <section
          aria-label={t.recentTitle}
          className="rounded-[20px] bg-white p-5 sm:p-6 shadow-xs border border-slate-200/60"
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
              {t.recentTitle}
            </h2>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {sortedExpenses.length}
            </span>
          </div>

          {sortedExpenses.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-800">
                {t.recentEmptyTitle}
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                {t.recentEmptyBody}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sortedExpenses.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-4 first:pt-3 last:pb-1"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <CategoryIcon category={item.category} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {item.merchant}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                        {item.ai_roast}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(item.amount, lang)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
                        {formatShortDate(item.created_at, lang)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteExpense(item.id)}
                      aria-label={t.deleteExpenseLabel(item.merchant)}
                      className="min-h-[40px] min-w-[40px] -mr-2 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Edit Budget Modal */}
      {isEditingBudget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.editBudgetTitle}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
        >
          <form
            onSubmit={handleSaveBudget}
            className="w-full max-w-sm rounded-[20px] bg-white p-6 shadow-2xl"
          >
            <h2 className="font-display text-lg font-bold text-slate-900">
              {t.editBudgetTitle}
            </h2>
            <div className="mt-4">
              <label
                htmlFor="monthly-budget-input"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                {t.budgetLabel} ({lang === 'pt-BR' ? 'R$' : '$'})
              </label>
              <input
                id="monthly-budget-input"
                type="text"
                inputMode="decimal"
                autoFocus
                value={budgetDraft}
                onChange={(e) => {
                  setBudgetDraft(e.target.value);
                  if (budgetError) setBudgetError(null);
                }}
                className="w-full min-h-[48px] rounded-xl border border-slate-200 bg-[#F4F6F9]/50 px-3.5 font-mono text-base font-semibold text-slate-900 tabular-nums focus:border-[#1D4ED8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15"
              />
              {budgetError && (
                <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
                  {budgetError}
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="min-h-[44px] flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="min-h-[44px] flex-1 rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-blue-800 cursor-pointer"
              >
                {t.saveBudget}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
