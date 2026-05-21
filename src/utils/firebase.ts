// Firebase Configuration and Utilities
// This file will be initialized when Firebase is added to the project

import { getAuthData, setAuthData, deleteAuthData } from './db';

// Firebase will be imported here when installed
// import { initializeApp } from 'firebase/app';
// import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
// import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
// import { getFunctions, httpsCallable } from 'firebase/functions';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  isActive: boolean;
  isAdmin: boolean;
  deviceInstalled: boolean;
  createdAt: string;
  lastLoginAt: string;
  disabledAt?: string;
  disabledBy?: string;
}

// Firebase configuration (to be set via environment variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const ADMIN_EMAIL = 'kaphirij9@gmail.com';
const USER_DATA_KEY = 'firebase.user';
const AUTH_TOKEN_KEY = 'firebase.token';

// Initialize Firebase (placeholder for now)
let firebaseApp: any = null;
let auth: any = null;
let db: any = null;
let functions: any = null;

export function initFirebase() {
  // This will be implemented when Firebase SDK is available
  // firebaseApp = initializeApp(firebaseConfig);
  // auth = getAuth(firebaseApp);
  // db = getFirestore(firebaseApp);
  // functions = getFunctions(firebaseApp);
  
  console.log('[Firebase] Initialization placeholder - will be enabled when deployed');
}

// Mock authentication for development
export async function signUpWithEmail(email: string, password: string): Promise<{ user: UserProfile; requiresInstall: boolean }> {
  // In production, this will use Firebase Auth
  // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // const user = userCredential.user;
  
  // For now, create a mock user
  const mockUser: UserProfile = {
    uid: crypto.randomUUID(),
    email,
    displayName: email.split('@')[0],
    isActive: true,
    isAdmin: email === ADMIN_EMAIL,
    deviceInstalled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  
  await setAuthData(USER_DATA_KEY, JSON.stringify(mockUser));
  
  return { user: mockUser, requiresInstall: !isAppInstalled() };
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: UserProfile; requiresInstall: boolean }> {
  // In production, this will use Firebase Auth
  // const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // For now, check if user exists locally
  const stored = await getAuthData(USER_DATA_KEY);
  
  if (!stored) {
    throw new Error('No account found. Please sign up first.');
  }
  
  const user: UserProfile = JSON.parse(stored);
  
  // Check if user is disabled by admin
  if (!user.isActive) {
    throw new Error('Your account has been disabled. Please contact support.');
  }
  
  // Update last login
  user.lastLoginAt = new Date().toISOString();
  await setAuthData(USER_DATA_KEY, JSON.stringify(user));
  
  return { user, requiresInstall: !isAppInstalled() };
}

export async function signOutUser(): Promise<void> {
  // In production: await signOut(auth);
  await deleteAuthData(USER_DATA_KEY);
  await deleteAuthData(AUTH_TOKEN_KEY);
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const stored = await getAuthData(USER_DATA_KEY);
  return stored ? JSON.parse(stored) : null;
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
  const stored = await getAuthData(USER_DATA_KEY);
  if (!stored) return;
  
  const user: UserProfile = JSON.parse(stored);
  const updated = { ...user, ...updates };
  await setAuthData(USER_DATA_KEY, JSON.stringify(updated));
  
  // In production, sync to Firestore:
  // await updateDoc(doc(db, 'users', user.uid), updates);
}

export function isAppInstalled(): boolean {
  // Check if running in standalone mode (installed PWA)
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
}

export async function markDeviceAsInstalled(): Promise<void> {
  await updateUserProfile({ deviceInstalled: true });
}

export function isAdminEmail(email: string): boolean {
  return email === ADMIN_EMAIL;
}

// Admin Functions (will use Cloud Functions in production)
export async function adminGetAllUsers(): Promise<UserProfile[]> {
  // In production: const callable = httpsCallable(functions, 'adminGetAllUsers');
  // const result = await callable();
  // return result.data as UserProfile[];
  
  // Mock for development
  const stored = await getAuthData(USER_DATA_KEY);
  return stored ? [JSON.parse(stored)] : [];
}

export async function adminDisableUser(uid: string, adminUid: string): Promise<void> {
  // In production: const callable = httpsCallable(functions, 'adminDisableUser');
  // await callable({ uid, adminUid });
  
  // Mock for development
  const stored = await getAuthData(USER_DATA_KEY);
  if (stored) {
    const user: UserProfile = JSON.parse(stored);
    if (user.uid === uid) {
      user.isActive = false;
      user.disabledAt = new Date().toISOString();
      user.disabledBy = adminUid;
      await setAuthData(USER_DATA_KEY, JSON.stringify(user));
    }
  }
}

export async function adminEnableUser(uid: string): Promise<void> {
  // In production: const callable = httpsCallable(functions, 'adminEnableUser');
  // await callable({ uid });
  
  // Mock for development
  const stored = await getAuthData(USER_DATA_KEY);
  if (stored) {
    const user: UserProfile = JSON.parse(stored);
    if (user.uid === uid) {
      user.isActive = true;
      delete user.disabledAt;
      delete user.disabledBy;
      await setAuthData(USER_DATA_KEY, JSON.stringify(user));
    }
  }
}

export async function adminSendNotification(uid: string, message: string): Promise<void> {
  // In production: const callable = httpsCallable(functions, 'adminSendNotification');
  // await callable({ uid, message });
  
  console.log(`[Admin] Send notification to ${uid}: ${message}`);
}

export async function adminGetUserActivity(uid: string): Promise<any> {
  // In production: fetch user activity from Firestore
  console.log(`[Admin] Get activity for ${uid}`);
  return { logins: [], actions: [] };
}

// Sync local data to cloud
export async function syncUserDataToCloud(userId: string): Promise<void> {
  // This will sync IndexedDB data to Firestore for backup
  // In production, implement batch upload of shifts, notes, photos, etc.
  console.log(`[Sync] Syncing data for user ${userId} to cloud`);
}

// Check if user account is still active (called on app launch)
export async function verifyUserStatus(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // In production, check with Firestore
  // const userDoc = await getDoc(doc(db, 'users', user.uid));
  // const userData = userDoc.data();
  // if (!userData?.isActive) {
  //   await signOutUser();
  //   return false;
  // }
  
  return user.isActive;
}

// Installation state management
const INSTALL_PROMPTED_KEY = 'app.installPrompted';
const INSTALL_DECLINED_KEY = 'app.installDeclined';

export async function hasBeenPromptedToInstall(): Promise<boolean> {
  const prompted = await getAuthData(INSTALL_PROMPTED_KEY);
  return prompted === 'true';
}

export async function markInstallPrompted(): Promise<void> {
  await setAuthData(INSTALL_PROMPTED_KEY, 'true');
}

export async function hasDeclinedInstall(): Promise<boolean> {
  const declined = await getAuthData(INSTALL_DECLINED_KEY);
  return declined === 'true';
}

export async function markInstallDeclined(): Promise<void> {
  await setAuthData(INSTALL_DECLINED_KEY, 'true');
}

export async function resetInstallPrompt(): Promise<void> {
  await deleteAuthData(INSTALL_PROMPTED_KEY);
  await deleteAuthData(INSTALL_DECLINED_KEY);
}
