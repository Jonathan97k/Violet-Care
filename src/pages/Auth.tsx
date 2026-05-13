import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { clearAuth } from '../utils/auth';

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasBiometric, loginWithPIN, loginWithBiometric, error, lockoutRemaining, isLoading } = useAuth();
  const [pin, setPin] = useState('');
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const attemptBiometric = async () => {
      if (hasBiometric && !isLoading) {
        setIsBiometricLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        const success = await loginWithBiometric();
        setIsBiometricLoading(false);
        if (success) {
          navigate('/');
        }
      }
    };

    attemptBiometric();
  }, [hasBiometric, isLoading, loginWithBiometric, navigate]);

  const handlePINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;

    const success = await loginWithPIN(pin);
    if (success) {
      navigate('/');
    }
  };

  const handleReset = async () => {
    await clearAuth();
    window.location.href = '/onboarding';
  };

  const formatLockoutTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-violet relative overflow-hidden flex flex-col items-center justify-center px-6">
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
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
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">💜</div>
          <h1 className="text-3xl font-playfair font-semibold text-white mb-2">
            Welcome back, Violet
          </h1>
          <p className="text-violet-200 font-dm-sans">
            Enter your PIN to access your app
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8"
        >
          <form onSubmit={handlePINSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                disabled={lockoutRemaining > 0}
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white text-center text-3xl tracking-[0.5em] focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            {lockoutRemaining > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <p className="text-violet-200 font-dm-sans mb-2">
                  Too many attempts. Please wait:
                </p>
                <p className="text-2xl font-playfair font-semibold text-white">
                  {formatLockoutTime(lockoutRemaining)}
                </p>
              </motion.div>
            )}

            {hasBiometric && !isBiometricLoading && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => loginWithBiometric()}
                disabled={lockoutRemaining > 0}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-dm-sans font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use Biometric Instead
              </motion.button>
            )}

            {isBiometricLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-3"
              >
                <div className="inline-block animate-spin text-3xl">🔐</div>
                <p className="text-violet-200 font-dm-sans mt-2 text-sm">
                  Verifying biometric...
                </p>
              </motion.div>
            )}
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-violet-300 font-dm-sans text-sm"
        >
          Forgot your PIN? Contact the person who set this up for you 💜
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          type="button"
          onClick={handleReset}
          className="text-center mt-4 text-violet-400 font-dm-sans text-xs underline"
        >
          Reset App & Start Over
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Auth;
