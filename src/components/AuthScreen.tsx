import { useState, type FormEvent } from 'react';
import { Globe, Loader2, Sparkles } from 'lucide-react';
import type { Language } from '../lib/finance';
import { COPY } from '../lib/i18n';
import { PaySnapLogo } from './PaySnapLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface AuthScreenProps {
  lang: Language;
  onToggleLanguage: () => void;
  onGoogleSignIn: () => Promise<string | null>;
  onSignInEmail: (email: string, password: string) => string | null;
  onSignUpEmail: (name: string, email: string, password: string) => string | null;
  onDemoSignIn: () => void;
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthScreen({
  lang,
  onToggleLanguage,
  onGoogleSignIn,
  onSignInEmail,
  onSignUpEmail,
  onDemoSignIn,
}: AuthScreenProps) {
  const t = COPY[lang];
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const err = await onGoogleSignIn();
      if (err) {
        setError(err);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && !name.trim()) {
      setError(t.authErrors.missingName);
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError(t.authErrors.invalidEmail);
      return;
    }

    if (password.length < 6) {
      setError(t.authErrors.shortPassword);
      return;
    }

    const err =
      mode === 'signin'
        ? onSignInEmail(email, password)
        : onSignUpEmail(name, email, password);

    if (err) {
      setError(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col">
      {/* Top Bar */}
      <header className="w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <PaySnapLogo size="sm" />
          <div className="flex items-center gap-2">
            <PWAInstallButton lang={lang} />
            <button
              type="button"
              onClick={onToggleLanguage}
              aria-label={
                lang === 'pt-BR' ? 'Alternar para Inglês' : 'Switch to Portuguese'
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Globe className="h-3.5 w-3.5 text-[#1D4ED8]" />
              <span>{t.langButton}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Editorial Value Prop */}
          <div className="lg:col-span-6 space-y-4">
            <p className="text-sm font-semibold text-[#1D4ED8]">
              {t.appTagline}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
              {t.authTitle}
            </h1>
            <p className="text-base leading-relaxed text-slate-600 max-w-md">
              {t.authSubtitle}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
              <span>{lang === 'pt-BR' ? 'Foto de recibo & Pix' : 'Receipt & transfer snap'}</span>
              <span aria-hidden="true">·</span>
              <span>{lang === 'pt-BR' ? 'Registro por voz' : 'Voice logging'}</span>
              <span aria-hidden="true">·</span>
              <span>{lang === 'pt-BR' ? 'Stories 9:16' : '9:16 Stories'}</span>
            </div>
          </div>

          {/* Auth Card */}
          <section
            aria-label={mode === 'signin' ? t.signInTab : t.signUpTab}
            className="lg:col-span-6 rounded-[20px] bg-white p-6 sm:p-8 shadow-sm border border-slate-200/70"
          >
            {/* Primary Firebase Google Sign-In */}
            <button
              type="button"
              disabled={isGoogleLoading}
              onClick={handleGoogle}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-xs hover:bg-slate-50 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#1D4ED8]" />
                  <span>{t.googleSigningIn}</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>{t.googleSignInBtn}</span>
                </>
              )}
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">
                {t.orDivider}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Segmented Sign In / Sign Up */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="grid grid-cols-2 gap-1 rounded-xl bg-[#F4F6F9] p-1 mb-5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`min-h-[42px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.signInTab}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`min-h-[42px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.signUpTab}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    {t.nameLabel}
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-[#F4F6F9]/50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  {t.emailLabel}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-[#F4F6F9]/50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  {t.passwordLabel}
                </label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-[#F4F6F9]/50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/15"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-[#1D4ED8] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                {mode === 'signin' ? t.signInBtn : t.signUpBtn}
              </button>
            </form>

            <button
              type="button"
              onClick={onDemoSignIn}
              className="mt-3 w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-[#F4F6F9]/50 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#10B981]" />
              <span>{t.demoBtn}</span>
            </button>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              {t.firebaseReadyNote}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
