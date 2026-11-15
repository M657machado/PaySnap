import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  clampAiRoast,
  normalizeCategory,
  type ExpenseCategory,
  type ExpenseRecord,
  type UserProfile,
} from './finance';
import type { SubscriptionPlanId } from './subscription';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

function toIsoTimestamp(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return new Date().toISOString();
}

export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export async function ensureFirebaseUserProfile(
  firebaseUser: FirebaseUser
): Promise<UserProfile> {
  const userPath = `users/${firebaseUser.uid}`;
  const userRef = doc(db, 'users', firebaseUser.uid);

  let snapshot;
  try {
    snapshot = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      id: firebaseUser.uid,
      email: String(data.email ?? firebaseUser.email ?? ''),
      name: String(data.name ?? firebaseUser.displayName ?? 'PaySnap'),
      monthly_budget:
        typeof data.monthly_budget === 'number' && data.monthly_budget > 0
          ? data.monthly_budget
          : 4500.0,
      ai_persona: 'sarcastic',
      is_pro: Boolean(data.is_pro),
      plan_type:
        data.plan_type === 'monthly' || data.plan_type === 'annual'
          ? data.plan_type
          : 'free',
      created_at: toIsoTimestamp(data.created_at),
    };
  }

  const safeName = (
    firebaseUser.displayName?.trim() ||
    firebaseUser.email?.split('@')[0] ||
    'PaySnap User'
  ).slice(0, 100);
  const safeEmail = (firebaseUser.email ?? 'user@paysnap.app').slice(0, 254);

  try {
    await setDoc(userRef, {
      id: firebaseUser.uid,
      email: safeEmail,
      name: safeName,
      monthly_budget: 4500.0,
      ai_persona: 'sarcastic',
      is_pro: false,
      plan_type: 'free',
      created_at: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }

  return {
    id: firebaseUser.uid,
    email: safeEmail,
    name: safeName,
    monthly_budget: 4500.0,
    ai_persona: 'sarcastic',
    is_pro: false,
    plan_type: 'free',
    created_at: new Date().toISOString(),
  };
}

export async function fetchFirebaseExpenses(
  uid: string
): Promise<ExpenseRecord[]> {
  const expensesPath = 'expenses';
  try {
    const q = query(
      collection(db, expensesPath),
      where('user_id', '==', uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        user_id: String(data.user_id ?? uid),
        amount: typeof data.amount === 'number' ? data.amount : 0,
        merchant: String(data.merchant ?? 'Merchant'),
        category: normalizeCategory(String(data.category ?? 'other')),
        ai_roast: String(data.ai_roast ?? ''),
        created_at: toIsoTimestamp(data.created_at),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, expensesPath);
  }
}

export async function createFirebaseExpense(
  uid: string,
  payload: {
    amount: number;
    merchant: string;
    category: ExpenseCategory;
    ai_roast: string;
  }
): Promise<ExpenseRecord> {
  const expenseId = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const docPath = `expenses/${expenseId}`;

  const safeAmount = Math.min(
    10_000_000,
    Math.max(0.01, Math.round(payload.amount * 100) / 100)
  );
  const safeMerchant = payload.merchant.trim().slice(0, 64) || 'Merchant';
  const safeCategory = normalizeCategory(payload.category);
  const safeRoast = clampAiRoast(payload.ai_roast, 110) || 'Ouch.';

  try {
    await setDoc(doc(db, 'expenses', expenseId), {
      user_id: uid,
      amount: safeAmount,
      merchant: safeMerchant,
      category: safeCategory,
      ai_roast: safeRoast,
      created_at: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }

  return {
    id: expenseId,
    user_id: uid,
    amount: safeAmount,
    merchant: safeMerchant,
    category: safeCategory,
    ai_roast: safeRoast,
    created_at: new Date().toISOString(),
  };
}

export async function deleteFirebaseExpense(expenseId: string): Promise<void> {
  const docPath = `expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function updateFirebaseBudget(
  uid: string,
  monthlyBudget: number
): Promise<void> {
  const userPath = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      monthly_budget: monthlyBudget,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function upgradeFirebaseUserToPro(
  uid: string,
  planType: SubscriptionPlanId
): Promise<void> {
  const userPath = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      is_pro: true,
      plan_type: planType,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}
