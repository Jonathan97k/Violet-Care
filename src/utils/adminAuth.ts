import { hashPIN, verifyPIN } from './auth';
import { getAuthData, setAuthData, deleteAuthData, getDB } from './db';

const ADMIN_PIN_KEY = 'admin.pin';
const ADMIN_SESSION_KEY = 'admin_session';
const ADMIN_PIN_DEFAULT = '000000';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours

export async function ensureAdminPinSetup(): Promise<void> {
  const existing = await getAuthData(ADMIN_PIN_KEY);
  if (!existing) {
    const hashed = await hashPIN(ADMIN_PIN_DEFAULT);
    await setAuthData(ADMIN_PIN_KEY, hashed);
  }
}

export async function verifyAdminPIN(pin: string): Promise<boolean> {
  await ensureAdminPinSetup();
  const stored = await getAuthData(ADMIN_PIN_KEY);
  if (!stored) return false;
  return verifyPIN(pin, stored);
}

export async function changeAdminPIN(current: string, next: string): Promise<boolean> {
  const ok = await verifyAdminPIN(current);
  if (!ok) return false;
  const hashed = await hashPIN(next);
  await setAuthData(ADMIN_PIN_KEY, hashed);
  return true;
}

export function setAdminSession(): void {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION
  }));
}

export function checkAdminSession(): boolean {
  const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return false;
  const session = JSON.parse(raw);
  if (Date.now() > session.expiresAt) {
    clearAdminSession();
    return false;
  }
  return session.authenticated === true;
}

export function isAdminSession(): boolean {
  return checkAdminSession();
}

export function getSessionExpiry(): number | null {
  const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;
  const session = JSON.parse(raw);
  return session.expiresAt;
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export async function resetVioletPIN(newPin: string): Promise<void> {
  const hashed = await hashPIN(newPin);
  await setAuthData('auth.pin', hashed);
  await setAuthData('auth.setupDone', 'true');
  await deleteAuthData('auth.failedAttempts');
  await deleteAuthData('auth.lockoutUntil');
}

export async function getLastPinChangeDate(): Promise<string | null> {
  // Approximate from IndexedDB auth store timestamp — we don't store it explicitly,
  // so we use the auth.pin value as a proxy and just show that it's managed.
  // For a real date we'd need metadata. We'll return null for now.
  return null;
}

export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const db = await getDB();
  const stores = Array.from(db.objectStoreNames);
  const result: Record<string, unknown[]> = {};
  for (const name of stores) {
    result[name] = await db.getAll(name as never);
  }
  return result;
}

export async function importAllData(data: Record<string, unknown[]>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(Array.from(db.objectStoreNames), 'readwrite');
  for (const name of db.objectStoreNames) {
    const store = tx.objectStore(name as never);
    await store.clear();
    const items = data[name] || [];
    for (const item of items) {
      await store.put(item as never);
    }
  }
}
