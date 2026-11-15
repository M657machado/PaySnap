import type { ExpenseRecord, Language, UserProfile } from './finance';
import type { SubscriptionPlanId } from './subscription';

const USERS_KEY = 'paysnap_users_v1';
const EXPENSES_KEY = 'paysnap_expenses_v1';
const SESSION_KEY = 'paysnap_session_uid_v1';
const LANG_KEY = 'paysnap_lang_v1';

interface StoredUser extends UserProfile {
  passwordHash: string;
}

const DEMO_USER_ID = 'demo-user-paysnap';

function normalizeUserProfile(stored: StoredUser): UserProfile {
  const { passwordHash: _ignored, ...rest } = stored;
  return {
    ...rest,
    is_pro: Boolean(rest.is_pro),
    plan_type:
      rest.plan_type === 'monthly' || rest.plan_type === 'annual'
        ? rest.plan_type
        : 'free',
  };
}

function createSeedExpenses(lang: Language): ExpenseRecord[] {
  const now = Date.now();
  if (lang === 'pt-BR') {
    return [
      {
        id: 'exp-seed-1',
        user_id: DEMO_USER_ID,
        amount: 68.9,
        merchant: 'iFood · Burger Lab',
        category: 'food',
        ai_roast: 'Mais um delivery? Sua cozinha já está cobrando aluguel.',
        created_at: new Date(now - 2 * 3600_000).toISOString(),
      },
      {
        id: 'exp-seed-2',
        user_id: DEMO_USER_ID,
        amount: 34.5,
        merchant: 'Uber Centro',
        category: 'transport',
        ai_roast: 'Três quarteirões de carro? Suas pernas mandaram lembranças.',
        created_at: new Date(now - 26 * 3600_000).toISOString(),
      },
    ];
  }

  return [
    {
      id: 'exp-seed-1',
      user_id: DEMO_USER_ID,
      amount: 44.8,
      merchant: 'DoorDash · Ramen',
      category: 'food',
      ai_roast: 'Another delivery? Your stove is filing for abandonment.',
      created_at: new Date(now - 2 * 3600_000).toISOString(),
    },
    {
      id: 'exp-seed-2',
      user_id: DEMO_USER_ID,
      amount: 21.4,
      merchant: 'Uber Downtown',
      category: 'transport',
      ai_roast: 'Three blocks by car? Your sneakers feel deeply betrayed.',
      created_at: new Date(now - 26 * 3600_000).toISOString(),
    },
  ];
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadStoredLanguage(): Language | null {
  try {
    const val = window.localStorage.getItem(LANG_KEY);
    if (val === 'pt-BR' || val === 'en-US') return val;
    return null;
  } catch {
    return null;
  }
}

export function saveStoredLanguage(lang: Language): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Ignore
  }
}

export function getActiveUser(): UserProfile | null {
  try {
    const uid = window.localStorage.getItem(SESSION_KEY);
    if (!uid) return null;
    const users = readJson<StoredUser[]>(USERS_KEY, []);
    const found = users.find((u) => u.id === uid);
    if (!found) return null;
    return normalizeUserProfile(found);
  } catch {
    return null;
  }
}

export function signOutUser(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore
  }
}

export function signInWithDemo(lang: Language): {
  user: UserProfile;
  expenses: ExpenseRecord[];
} {
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  let demo = users.find((u) => u.id === DEMO_USER_ID);
  if (!demo) {
    demo = {
      id: DEMO_USER_ID,
      email: 'demo@paysnap.app',
      name: 'Demo PaySnap',
      monthly_budget: 4500.0,
      ai_persona: 'sarcastic',
      is_pro: false,
      plan_type: 'free',
      created_at: new Date().toISOString(),
      passwordHash: 'demo',
    };
    writeJson(USERS_KEY, [...users, demo]);
  }

  const allExpenses = readJson<ExpenseRecord[]>(EXPENSES_KEY, []);
  const demoExpenses = allExpenses.filter((e) => e.user_id === DEMO_USER_ID);
  if (demoExpenses.length === 0) {
    const seeded = createSeedExpenses(lang);
    writeJson(EXPENSES_KEY, [...seeded, ...allExpenses]);
  }

  try {
    window.localStorage.setItem(SESSION_KEY, DEMO_USER_ID);
  } catch {
    // Ignore
  }

  return {
    user: normalizeUserProfile(demo),
    expenses: loadUserExpenses(DEMO_USER_ID),
  };
}

export function signUpWithEmail(params: {
  name: string;
  email: string;
  password: string;
}): { ok: true; user: UserProfile } | { ok: false; errorKey: 'emailTaken' } {
  const normalizedEmail = params.email.trim().toLowerCase();
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { ok: false, errorKey: 'emailTaken' };
  }

  const newUser: StoredUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email: normalizedEmail,
    name: params.name.trim(),
    monthly_budget: 4500.0,
    ai_persona: 'sarcastic',
    is_pro: false,
    plan_type: 'free',
    created_at: new Date().toISOString(),
    passwordHash: params.password,
  };

  writeJson(USERS_KEY, [...users, newUser]);
  try {
    window.localStorage.setItem(SESSION_KEY, newUser.id);
  } catch {
    // Ignore
  }

  return { ok: true, user: normalizeUserProfile(newUser) };
}

export function signInWithEmail(params: {
  email: string;
  password: string;
}):
  | { ok: true; user: UserProfile }
  | { ok: false; errorKey: 'wrongCredentials' } {
  const normalizedEmail = params.email.trim().toLowerCase();
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  const found = users.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail &&
      u.passwordHash === params.password
  );
  if (!found) {
    return { ok: false, errorKey: 'wrongCredentials' };
  }

  try {
    window.localStorage.setItem(SESSION_KEY, found.id);
  } catch {
    // Ignore
  }

  return { ok: true, user: normalizeUserProfile(found) };
}

export function updateUserBudget(userId: string, monthlyBudget: number): UserProfile | null {
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  let updatedProfile: UserProfile | null = null;
  const nextUsers = users.map((u) => {
    if (u.id !== userId) return u;
    const updated: StoredUser = { ...u, monthly_budget: monthlyBudget };
    updatedProfile = normalizeUserProfile(updated);
    return updated;
  });
  writeJson(USERS_KEY, nextUsers);
  return updatedProfile;
}

export function upgradeLocalUserToPro(
  userId: string,
  planType: SubscriptionPlanId
): UserProfile | null {
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  let updatedProfile: UserProfile | null = null;
  const nextUsers = users.map((u) => {
    if (u.id !== userId) return u;
    const updated: StoredUser = {
      ...u,
      is_pro: true,
      plan_type: planType,
    };
    updatedProfile = normalizeUserProfile(updated);
    return updated;
  });
  writeJson(USERS_KEY, nextUsers);
  return updatedProfile;
}

export function loadUserExpenses(userId: string): ExpenseRecord[] {
  const all = readJson<ExpenseRecord[]>(EXPENSES_KEY, []);
  return all.filter((item) => item.user_id === userId);
}

export function addUserExpense(expense: ExpenseRecord): ExpenseRecord[] {
  const all = readJson<ExpenseRecord[]>(EXPENSES_KEY, []);
  const next = [expense, ...all];
  writeJson(EXPENSES_KEY, next);
  return next.filter((item) => item.user_id === expense.user_id);
}

export function deleteUserExpense(userId: string, expenseId: string): ExpenseRecord[] {
  const all = readJson<ExpenseRecord[]>(EXPENSES_KEY, []);
  const next = all.filter((item) => !(item.user_id === userId && item.id === expenseId));
  writeJson(EXPENSES_KEY, next);
  return next.filter((item) => item.user_id === userId);
}
