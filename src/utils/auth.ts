import { setAuthData, getAuthData, deleteAuthData } from './db';

const AUTH_PIN_KEY = 'auth.pin';
const AUTH_CREDENTIAL_KEY = 'auth.credential';
const AUTH_SETUP_DONE_KEY = 'auth.setupDone';
const FAILED_ATTEMPTS_KEY = 'auth.failedAttempts';
const LOCKOUT_UNTIL_KEY = 'auth.lockoutUntil';

export async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPIN(pin: string, hashedPIN: string): Promise<boolean> {
  const hashedInput = await hashPIN(pin);
  return hashedInput === hashedPIN;
}

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    return (
      window.PublicKeyCredential !== undefined &&
      (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

export async function registerBiometric(): Promise<boolean> {
  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'VioletCare' },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'violet',
          displayName: 'Violet',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: { authenticatorAttachment: 'platform' },
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    const credentialId = btoa(
      String.fromCharCode(...new Uint8Array(credential.rawId))
    );
    await setAuthData(AUTH_CREDENTIAL_KEY, credentialId);
    return true;
  } catch (error) {
    console.error('Biometric registration failed:', error);
    return false;
  }
}

export async function verifyBiometric(): Promise<boolean> {
  try {
    const storedCredentialId = await getAuthData(AUTH_CREDENTIAL_KEY);
    if (!storedCredentialId) return false;

    const credId = Uint8Array.from(atob(storedCredentialId), (c) =>
      c.charCodeAt(0)
    );

    await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: credId, type: 'public-key' }],
        timeout: 60000,
      },
    });

    await resetFailedAttempts();
    return true;
  } catch (error) {
    console.error('Biometric verification failed:', error);
    await incrementFailedAttempts();
    return false;
  }
}

export async function setupPIN(pin: string): Promise<void> {
  const hashedPIN = await hashPIN(pin);
  console.log('[Auth] Storing PIN hash:', hashedPIN.substring(0, 16) + '...');
  await setAuthData(AUTH_PIN_KEY, hashedPIN);
  // Verify it was stored
  const verify = await getAuthData(AUTH_PIN_KEY);
  console.log('[Auth] PIN stored successfully:', !!verify);
}

export async function verifyLoginPIN(pin: string): Promise<boolean> {
  const storedHashedPIN = await getAuthData(AUTH_PIN_KEY);
  console.log('[Auth] Login - Stored PIN exists:', !!storedHashedPIN);
  if (!storedHashedPIN) return false;

  const isValid = await verifyPIN(pin, storedHashedPIN);
  console.log('[Auth] Login - PIN valid:', isValid);
  if (isValid) {
    await resetFailedAttempts();
  } else {
    await incrementFailedAttempts();
  }
  return isValid;
}

export async function isSetupComplete(): Promise<boolean> {
  const setupDone = await getAuthData(AUTH_SETUP_DONE_KEY);
  console.log('[Auth] isSetupComplete check - stored value:', setupDone);
  return setupDone === 'true';
}

export async function markSetupComplete(): Promise<void> {
  await setAuthData(AUTH_SETUP_DONE_KEY, 'true');
}

export async function hasBiometricCredential(): Promise<boolean> {
  const credential = await getAuthData(AUTH_CREDENTIAL_KEY);
  return credential !== undefined;
}

export async function incrementFailedAttempts(): Promise<void> {
  const current = await getAuthData(FAILED_ATTEMPTS_KEY);
  const attempts = current ? parseInt(current, 10) + 1 : 1;
  await setAuthData(FAILED_ATTEMPTS_KEY, attempts.toString());

  if (attempts >= 3) {
    const lockoutUntil = Date.now() + 30000;
    await setAuthData(LOCKOUT_UNTIL_KEY, lockoutUntil.toString());
  }
}

export async function resetFailedAttempts(): Promise<void> {
  await deleteAuthData(FAILED_ATTEMPTS_KEY);
  await deleteAuthData(LOCKOUT_UNTIL_KEY);
}

export async function getFailedAttempts(): Promise<number> {
  const current = await getAuthData(FAILED_ATTEMPTS_KEY);
  return current ? parseInt(current, 10) : 0;
}

export async function isLockedOut(): Promise<boolean> {
  const lockoutUntil = await getAuthData(LOCKOUT_UNTIL_KEY);
  if (!lockoutUntil) return false;

  const lockoutTime = parseInt(lockoutUntil, 10);
  if (Date.now() > lockoutTime) {
    await resetFailedAttempts();
    return false;
  }

  return true;
}

export async function getLockoutRemainingTime(): Promise<number> {
  const lockoutUntil = await getAuthData(LOCKOUT_UNTIL_KEY);
  if (!lockoutUntil) return 0;

  const lockoutTime = parseInt(lockoutUntil, 10);
  const remaining = lockoutTime - Date.now();
  return remaining > 0 ? remaining : 0;
}

export async function logout(): Promise<void> {
  await resetFailedAttempts();
}

export async function clearAuth(): Promise<void> {
  await deleteAuthData(AUTH_PIN_KEY);
  await deleteAuthData(AUTH_CREDENTIAL_KEY);
  await deleteAuthData(AUTH_SETUP_DONE_KEY);
  await resetFailedAttempts();
}
