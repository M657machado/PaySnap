import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import {
  ExpenseCaptureModal,
  type AnalyzedExpenseResult,
} from './components/ExpenseCaptureModal';
import { ExpenseResultModal } from './components/ExpenseResultModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PaywallModal } from './components/PaywallModal';
import { StoriesModal } from './components/StoriesModal';
import {
  computeBudgetMetrics,
  detectBrowserLanguage,
  type ExpenseRecord,
  type Language,
  type UserProfile,
} from './lib/finance';
import {
  auth,
  createFirebaseExpense,
  deleteFirebaseExpense,
  ensureFirebaseUserProfile,
  fetchFirebaseExpenses,
  signInWithGooglePopup,
  signOutFirebase,
  updateFirebaseBudget,
  upgradeFirebaseUserToPro,
} from './lib/firebase';
import { COPY } from './lib/i18n';
import {
  addUserExpense,
  deleteUserExpense,
  getActiveUser,
  loadStoredLanguage,
  loadUserExpenses,
  saveStoredLanguage,
  signInWithDemo,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  updateUserBudget,
  upgradeLocalUserToPro,
} from './lib/storage';
import {
  shouldBlockExpenseCreation,
  type SubscriptionPlanId,
} from './lib/subscription';

type AuthSessionMode = 'firebase' | 'local';

export default function App() {
  const [lang, setLang] = useState<Language>(
    () => loadStoredLanguage() ?? detectBrowserLanguage()
  );

  const [authMode, setAuthMode] = useState<AuthSessionMode>('local');
  const [user, setUser] = useState<UserProfile | null>(() => getActiveUser());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const active = getActiveUser();
    return active ? loadUserExpenses(active.id) : [];
  });

  const [captureOpen, setCaptureOpen] = useState(false);
  const [paywallState, setPaywallState] = useState<{
    open: boolean;
    reason: 'limit_reached' | 'upgrade';
  }>({ open: false, reason: 'limit_reached' });
  const [recentResult, setRecentResult] = useState<ExpenseRecord | null>(null);
  const [storiesState, setStoriesState] = useState<{
    open: boolean;
    roast: string;
  }>({ open: false, roast: '' });

  useEffect(() => {
    document.documentElement.lang = lang;
    saveStoredLanguage(lang);
  }, [lang]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        return;
      }
      try {
        const [profile, remoteExpenses] = await Promise.all([
          ensureFirebaseUserProfile(firebaseUser),
          fetchFirebaseExpenses(firebaseUser.uid),
        ]);
        setAuthMode('firebase');
        setUser(profile);
        setExpenses(remoteExpenses);
      } catch (err) {
        console.error('Failed to load Firebase session:', err);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !user) {
      const demo = signInWithDemo(lang);
      setAuthMode('local');
      setUser(demo.user);
      setExpenses(demo.expenses);
    }
  }, [lang, user]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'pt-BR' ? 'en-US' : 'pt-BR'));
  };

  const handleGoogleSignIn = async (): Promise<string | null> => {
    try {
      const firebaseUser = await signInWithGooglePopup();
      const [profile, remoteExpenses] = await Promise.all([
        ensureFirebaseUserProfile(firebaseUser),
        fetchFirebaseExpenses(firebaseUser.uid),
      ]);
      setAuthMode('firebase');
      setUser(profile);
      setExpenses(remoteExpenses);
      return null;
    } catch {
      return COPY[lang].authErrors.googleFailed;
    }
  };

  const handleSignInEmail = (email: string, password: string): string | null => {
    const res = signInWithEmail({ email, password });
    if (!res.ok) {
      return COPY[lang].authErrors[res.errorKey];
    }
    setAuthMode('local');
    setUser(res.user);
    setExpenses(loadUserExpenses(res.user.id));
    return null;
  };

  const handleSignUpEmail = (
    name: string,
    email: string,
    password: string
  ): string | null => {
    const res = signUpWithEmail({ name, email, password });
    if (!res.ok) {
      return COPY[lang].authErrors[res.errorKey];
    }
    setAuthMode('local');
    setUser(res.user);
    setExpenses([]);
    return null;
  };

  const handleDemoSignIn = () => {
    const demo = signInWithDemo(lang);
    setAuthMode('local');
    setUser(demo.user);
    setExpenses(demo.expenses);
  };

  const handleSignOut = async () => {
    if (authMode === 'firebase') {
      await signOutFirebase().catch(() => {});
    }
    signOutUser();
    setAuthMode('local');
    setUser(null);
    setExpenses([]);
    setCaptureOpen(false);
    setPaywallState({ open: false, reason: 'limit_reached' });
    setRecentResult(null);
    setStoriesState({ open: false, roast: '' });
  };

  const handleUpdateBudget = async (newBudget: number) => {
    if (!user) return;
    if (authMode === 'firebase') {
      await updateFirebaseBudget(user.id, newBudget);
      setUser((prev) => (prev ? { ...prev, monthly_budget: newBudget } : prev));
      return;
    }
    const updated = updateUserBudget(user.id, newBudget);
    if (updated) {
      setUser(updated);
    }
  };

  const handleAttemptOpenCapture = () => {
    if (!user) return;
    if (shouldBlockExpenseCreation(user, expenses.length)) {
      setPaywallState({ open: true, reason: 'limit_reached' });
      return;
    }
    setCaptureOpen(true);
  };

  const handleExpenseCreated = async (analyzed: AnalyzedExpenseResult) => {
    if (!user) return;
    if (shouldBlockExpenseCreation(user, expenses.length)) {
      setCaptureOpen(false);
      setPaywallState({ open: true, reason: 'limit_reached' });
      return;
    }

    if (authMode === 'firebase') {
      const created = await createFirebaseExpense(user.id, analyzed);
      setExpenses((prev) => [created, ...prev]);
      setCaptureOpen(false);
      setRecentResult(created);
      return;
    }

    const newRecord: ExpenseRecord = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: user.id,
      amount: analyzed.amount,
      merchant: analyzed.merchant,
      category: analyzed.category,
      ai_roast: analyzed.ai_roast,
      created_at: new Date().toISOString(),
    };
    const nextList = addUserExpense(newRecord);
    setExpenses(nextList);
    setCaptureOpen(false);
    setRecentResult(newRecord);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) return;
    if (authMode === 'firebase') {
      await deleteFirebaseExpense(expenseId);
      setExpenses((prev) => prev.filter((item) => item.id !== expenseId));
      return;
    }
    setExpenses(deleteUserExpense(user.id, expenseId));
  };

  const handleSimulateApprovedPayment = async (planId: SubscriptionPlanId) => {
    if (!user) return;
    if (authMode === 'firebase') {
      await upgradeFirebaseUserToPro(user.id, planId);
      setUser((prev) =>
        prev ? { ...prev, is_pro: true, plan_type: planId } : prev
      );
      return;
    }
    const updated = upgradeLocalUserToPro(user.id, planId);
    if (updated) {
      setUser(updated);
    } else {
      setUser((prev) =>
        prev ? { ...prev, is_pro: true, plan_type: planId } : prev
      );
    }
  };

  const metrics = user
    ? computeBudgetMetrics(user.monthly_budget, expenses)
    : null;

  return (
    <>
      {user ? (
        <Dashboard
          user={user}
          expenses={expenses}
          lang={lang}
          onToggleLanguage={toggleLanguage}
          onSignOut={handleSignOut}
          onUpdateBudget={handleUpdateBudget}
          onOpenCapture={handleAttemptOpenCapture}
          onOpenPaywall={() =>
            setPaywallState({ open: true, reason: 'upgrade' })
          }
          onOpenStories={(roast) => setStoriesState({ open: true, roast })}
          onDeleteExpense={handleDeleteExpense}
        />
      ) : (
        <AuthScreen
          lang={lang}
          onToggleLanguage={toggleLanguage}
          onGoogleSignIn={handleGoogleSignIn}
          onSignInEmail={handleSignInEmail}
          onSignUpEmail={handleSignUpEmail}
          onDemoSignIn={handleDemoSignIn}
        />
      )}

      <ExpenseCaptureModal
        isOpen={captureOpen}
        lang={lang}
        onClose={() => setCaptureOpen(false)}
        onExpenseCreated={handleExpenseCreated}
      />

      <PaywallModal
        isOpen={paywallState.open}
        reason={paywallState.reason}
        lang={lang}
        onClose={() => setPaywallState({ open: false, reason: 'limit_reached' })}
        onSimulateApprovedPayment={handleSimulateApprovedPayment}
        onContinueToCapture={() => setCaptureOpen(true)}
      />

      <ExpenseResultModal
        expense={recentResult}
        lang={lang}
        onClose={() => setRecentResult(null)}
        onShareStories={(exp) => {
          setRecentResult(null);
          setStoriesState({ open: true, roast: exp.ai_roast });
        }}
      />

      <StoriesModal
        isOpen={storiesState.open}
        lang={lang}
        latestRoast={storiesState.roast}
        availableBalance={metrics?.availableBalance ?? 0}
        isOnBudget={metrics?.isOnBudget ?? true}
        onClose={() => setStoriesState({ open: false, roast: '' })}
      />

      <OfflineIndicator lang={lang} />
    </>
  );
}
