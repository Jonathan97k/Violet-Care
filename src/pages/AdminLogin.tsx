import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { verifyAdminPIN, setAdminSession, ensureAdminPinSetup } from '../utils/adminAuth';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10 * 60 * 1000; // 10 minutes in ms

function getAttemptData() {
  const raw = sessionStorage.getItem('admin_attempts');
  if (!raw) return { count: 0, lockedUntil: null };
  return JSON.parse(raw);
}

function recordFailedAttempt() {
  const data = getAttemptData();
  const newCount = data.count + 1;
  const lockedUntil = newCount >= MAX_ATTEMPTS
    ? Date.now() + LOCKOUT_DURATION
    : null;
  sessionStorage.setItem('admin_attempts', JSON.stringify({
    count: newCount,
    lockedUntil
  }));
  return newCount;
}

function resetAttempts() {
  sessionStorage.removeItem('admin_attempts');
}

function isLockedOut(): { locked: boolean; remainingMs: number } {
  const data = getAttemptData();
  if (!data.lockedUntil) return { locked: false, remainingMs: 0 };
  const remaining = data.lockedUntil - Date.now();
  if (remaining <= 0) {
    resetAttempts();
    return { locked: false, remainingMs: 0 };
  }
  return { locked: true, remainingMs: remaining };
}

const AdminLogin = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [_attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS);

  useEffect(() => {
    ensureAdminPinSetup();
    const { locked: isLocked, remainingMs } = isLockedOut();
    setLocked(isLocked);
    setLockoutRemaining(remainingMs);
    if (!isLocked) {
      const data = getAttemptData();
      setAttemptsRemaining(MAX_ATTEMPTS - data.count);
    }
     
  }, []);

  useEffect(() => {
    if (locked && lockoutRemaining > 0) {
      const timer = setInterval(() => {
        const { locked: isLocked, remainingMs } = isLockedOut();
        setLocked(isLocked);
        setLockoutRemaining(remainingMs);
        if (!isLocked) {
          clearInterval(timer);
          const data = getAttemptData();
          setAttemptsRemaining(MAX_ATTEMPTS - data.count);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [locked, lockoutRemaining]);

  const formatLockoutTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;
    setLoading(true);
    setError('');

    const ok = await verifyAdminPIN(pin);
    setLoading(false);

    if (ok) {
      resetAttempts();
      setAdminSession();
      navigate('/admin');
    } else {
      const attemptsLeft = recordFailedAttempt();
      setAttemptsRemaining(MAX_ATTEMPTS - attemptsLeft);
      if (attemptsLeft >= MAX_ATTEMPTS) {
        const { locked: isLocked, remainingMs } = isLockedOut();
        setLocked(isLocked);
        setLockoutRemaining(remainingMs);
        setError('Too many attempts. Please wait.');
      } else {
        setError(`${attemptsLeft} attempts remaining`);
      }
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-violet relative overflow-hidden flex flex-col items-center justify-center px-6">
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(124, 58, 237, 0.3) 0%, transparent 50%)',
          backgroundSize: '200% 200%',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <button
          onClick={() => navigate('/auth')}
          className="flex items-center gap-1 text-violet-300 text-sm mb-6 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-playfair font-semibold text-white mb-1">
            Admin Access
          </h1>
          <p className="text-violet-200 font-dm-sans text-sm">
            Enter your admin PIN
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass-card p-8 ${locked ? 'border-rose-500/50 shadow-lg shadow-rose-500/20' : ''}`}
        >
          <AnimatePresence mode="wait">
            {locked ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-playfair font-semibold text-rose-400 mb-2">
                  Too many attempts
                </h2>
                <p className="text-violet-200 font-dm-sans text-sm mb-4">
                  Try again in {formatLockoutTime(lockoutRemaining)}
                </p>
                <div className="text-4xl font-dm-sans font-bold text-white">
                  {formatLockoutTime(lockoutRemaining)}
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white text-center text-3xl tracking-[0.5em] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                    placeholder="••••••"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-rose-400 text-sm text-center font-dm-sans"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={pin.length !== 6 || loading}
                  className="w-full py-3 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-xl font-dm-sans font-medium transition-all"
                >
                  {loading ? 'Verifying...' : 'Unlock'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
