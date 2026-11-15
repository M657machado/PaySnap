import { useEffect } from 'react';
import { CheckCircle2, Share2, X } from 'lucide-react';
import {
  formatCurrency,
  type ExpenseRecord,
  type Language,
} from '../lib/finance';
import { COPY } from '../lib/i18n';

interface ExpenseResultModalProps {
  expense: ExpenseRecord | null;
  lang: Language;
  onClose: () => void;
  onShareStories: (expense: ExpenseRecord) => void;
}

export function ExpenseResultModal({
  expense,
  lang,
  onClose,
  onShareStories,
}: ExpenseResultModalProps) {
  useEffect(() => {
    if (!expense) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expense, onClose]);

  if (!expense) return null;
  const t = COPY[lang];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.resultTitle}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm rounded-[20px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-[#10B981]">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-semibold">{t.resultTitle}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.doneBtn}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <p className="font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(expense.amount, lang)}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {expense.merchant} · {t.categories[expense.category]}
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-[#F4F6F9] p-4">
          <p className="text-sm font-medium leading-relaxed text-slate-800">
            “{expense.ai_roast}”
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onShareStories(expense)}
            className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span>{t.shareStoriesBtn}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {t.doneBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
