import { useState, useEffect } from 'react';
import { checkAdminSession, getSessionExpiry, clearAdminSession } from '../utils/adminAuth';

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expiryMs, setExpiryMs] = useState<number | null>(null);

  useEffect(() => {
    const checkSession = () => {
      const authenticated = checkAdminSession();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const expiry = getSessionExpiry();
        setExpiryMs(expiry ? expiry - Date.now() : null);
      } else {
        setExpiryMs(null);
      }
    };

    checkSession();

    // Update expiry every minute
    const interval = setInterval(() => {
      checkSession();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    clearAdminSession();
    setIsAuthenticated(false);
    setExpiryMs(null);
  };

  return {
    isAuthenticated,
    expiryMs,
    logout,
  };
}
