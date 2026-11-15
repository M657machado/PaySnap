import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Crown,
  ExternalLink,
  Loader2,
  MessageSquareQuote,
  Smartphone,
  X,
} from 'lucide-react';
import type { Language } from '../lib/finance';
import { COPY } from '../lib/i18n';
import {
  PAYMENT_CHECKOUT_URL,
  SUBSCRIPTION_PLANS,
  getPlanDisplayPrice,
  type SubscriptionPlanId,
} from '../lib/subscription';

interface PaywallModalProps {
  isOpen: boolean;
  reason: 'limit_reached' | 'upgrade';
  lang: Language;
  onClose: () => void;
  onSimulateApprovedPayment: (planId: SubscriptionPlanId) => Promise<void>;
  onContinueToCapture: () => void;
}

type ModalStep = 'plans' | 'checkout' | 'success';

export function PaywallModal({
  isOpen,
  reason,
  lang,
  onClose,
  onSimulateApprovedPayment,
  onContinueToCapture,
}: PaywallModalProps) {
  const t = COPY[lang].paywall;
  const cancelLabel = COPY[lang].cancel;

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>('annual');
  const [step, setStep] = useState<ModalStep>('plans');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('plans');
      setSelectedPlan('annual');
      setIsProcessing(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const selectedPlanLabel =
    selectedPlan === 'annual' ? t.annualName : t.monthlyName;
  const selectedPlanPrice = getPlanDisplayPrice(selectedPlan, lang);

  const handleSimulatePayment = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      await onSimulateApprovedPayment(selectedPlan);
      setStep('success');
    } catch {
      setError(t.updateError);
    } finally {
      setIsProcessing(false);
    }
  };

  const benefitIcons = [Camera, MessageSquareQuote, Smartphone] as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[24px] sm:rounded-[24px] bg-white p-6 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />

        {step === 'plans' && (
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-[#1D4ED8]">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8]">
                  <Crown className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold tracking-wide text-[#1D4ED8]">
                  {t.kicker}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={cancelLabel}
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reason === 'limit_reached' && (
              <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200/80 px-3.5 py-2 text-xs font-semibold text-amber-900">
                {t.limitBanner}
              </p>
            )}

            <h2 className="mt-4 font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 text-balance leading-snug">
              {t.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {t.subtitle}
            </p>

            {/* Benefits */}
            <ul className="mt-5 space-y-2.5">
              {t.benefits.map((benefit, index) => {
                const Icon = benefitIcons[index];
                return (
                  <li key={benefit} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#10B981]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {benefit}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Selectable Plans */}
            <div className="mt-6 space-y-3" role="radiogroup" aria-label={t.kicker}>
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const planTitle =
                  plan.id === 'annual' ? t.annualName : t.monthlyName;
                const price = lang === 'pt-BR' ? plan.priceBrl : plan.priceUsd;
                const period = lang === 'pt-BR' ? plan.periodBrl : plan.periodUsd;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full rounded-[16px] border p-4 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                      isSelected
                        ? 'border-[#1D4ED8] bg-blue-50/40 ring-2 ring-[#1D4ED8]/15'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="mb-2">
                        <span className="inline-block rounded-md bg-[#10B981] px-2.5 py-0.5 text-[11px] font-bold text-white">
                          {t.popularTag}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                            isSelected
                              ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {planTitle}
                        </span>
                      </div>

                      <div className="text-right font-mono tabular-nums">
                        <span className="text-base font-bold text-slate-900">
                          {price}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {period}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Subscribe CTA */}
            <button
              type="button"
              onClick={() => setStep('checkout')}
              className="mt-6 min-h-[50px] w-full rounded-xl bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              {t.subscribeNowBtn}
            </button>
          </div>
        )}

        {step === 'checkout' && (
          <div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setStep('plans')}
                aria-label={t.backToPlansBtn}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t.backToPlansBtn}</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={onClose}
                aria-label={cancelLabel}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="mt-3 font-display text-xl font-bold text-slate-900">
              {t.checkoutTitle}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {t.checkoutSubtitle}
            </p>

            {/* Summary Box */}
            <div className="mt-5 rounded-[16px] bg-[#F4F6F9] p-4 space-y-2">
              <p className="text-xs font-medium text-slate-500">
                {t.selectedPlanLabel}
              </p>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base font-bold text-slate-900">
                  {selectedPlanLabel}
                </p>
                <p className="font-mono text-lg font-bold text-[#1D4ED8] tabular-nums">
                  {selectedPlanPrice}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              {t.testNotice}
            </p>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
              >
                {error}
              </p>
            )}

            <div className="mt-6 space-y-2.5">
              {PAYMENT_CHECKOUT_URL && (
                <a
                  href={PAYMENT_CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <span>{t.externalCheckoutBtn}</span>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </a>
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSimulatePayment}
                className="min-h-[50px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#10B981] px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.simulatingBtn}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t.simulateApprovedBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#10B981]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="mt-4 font-display text-xl font-bold text-slate-900">
              {t.successTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {t.successSubtitle}
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onContinueToCapture();
                }}
                className="min-h-[50px] w-full rounded-xl bg-[#1D4ED8] px-5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer"
              >
                {t.continueCaptureBtn}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t.backDashboardBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
