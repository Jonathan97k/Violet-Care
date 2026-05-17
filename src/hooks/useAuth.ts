import { useState, useEffect, useCallback } from 'react';
import {
  isSetupComplete,
  hasBiometricCredential,
  verifyLoginPIN,
  verifyBiometric,
  isLockedOut,
  getFailedAttempts,
  getLockoutRemainingTime,
  logout,
} from '../utils/auth';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isSetupComplete: boolean;
  hasBiometric: boolean;
  error: string | null;
  failedAttempts: number;
  lockoutRemaining: number;
}

export function useAuth(): AuthState & {
  loginWithPIN: (pin: string) => Promise<boolean>;
  loginWithBiometric: () => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    isSetupComplete: false,
    hasBiometric: false,
    error: null,
    failedAttempts: 0,
    lockoutRemaining: 0,
  });

  const refresh = useCallback(async () => {
    try {
      const [setupComplete, biometric, _locked, attempts, lockoutTime] =
        await Promise.all([
          isSetupComplete(),
          hasBiometricCredential(),
          isLockedOut(),
          getFailedAttempts(),
          getLockoutRemainingTime(),
        ]);

      setState((prev) => ({
        ...prev,
        isSetupComplete: setupComplete,
        hasBiometric: biometric,
        isAuthenticated: !setupComplete ? false : prev.isAuthenticated,
        failedAttempts: attempts,
        lockoutRemaining: lockoutTime,
        isLoading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (state.lockoutRemaining > 0) {
      const interval = setInterval(() => {
        getLockoutRemainingTime().then((remaining) => {
          setState((prev) => ({ ...prev, lockoutRemaining: remaining }));
          if (remaining === 0) {
            refresh();
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.lockoutRemaining, refresh]);

  const loginWithPIN = useCallback(async (pin: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, error: null }));

    if (await isLockedOut()) {
      const lockoutTime = await getLockoutRemainingTime();
      setState((prev) => ({
        ...prev,
        error: 'Too many failed attempts. Please wait.',
        lockoutRemaining: lockoutTime,
      }));
      return false;
    }

    if (pin.length !== 6) {
      setState((prev) => ({ ...prev, error: 'PIN must be 6 digits' }));
      return false;
    }

    const success = await verifyLoginPIN(pin);
    const attempts = await getFailedAttempts();

    if (success) {
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        error: null,
        failedAttempts: 0,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        error: attempts >= 3 ? 'Too many failed attempts. Please wait.' : 'Incorrect PIN',
        failedAttempts: attempts,
      }));

      if (attempts >= 3) {
        const lockoutTime = await getLockoutRemainingTime();
        setState((prev) => ({ ...prev, lockoutRemaining: lockoutTime }));
      }
    }

    return success;
  }, []);

  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, error: null }));

    const success = await verifyBiometric();

    if (success) {
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        error: null,
        failedAttempts: 0,
      }));
    } else {
      const attempts = await getFailedAttempts();
      setState((prev) => ({
        ...prev,
        error: 'Biometric verification failed. Please use your PIN.',
        failedAttempts: attempts,
      }));
    }

    return success;
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
      error: null,
    }));
  }, []);

  return {
    ...state,
    loginWithPIN,
    loginWithBiometric,
    logout: handleLogout,
    refresh,
  };
}
