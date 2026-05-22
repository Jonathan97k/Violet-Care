import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, getCurrentUser, isAppInstalled } from '../utils/supabase';
import { haptics } from '../utils/haptics';

const EmailAuth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        if (isAppInstalled()) {
          navigate('/onboarding'); // Or dashboard if onboarding is complete
        } else {
          navigate('/install-prompt');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      haptics.error();
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      haptics.error();
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      haptics.error();
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUpWithEmail(email, password);
        haptics.success();
      } else {
        result = await signInWithEmail(email, password);
        haptics.success();
      }

      // After successful authentication, check if app is installed
      if (result.requiresInstall) {
        navigate('/install-prompt');
      } else {
        // App is already installed, proceed to onboarding or dashboard
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

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
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">💜</div>
          <h1 className="text-3xl font-playfair font-semibold text-white mb-2">
            Welcome to VioletCare
          </h1>
          <p className="text-violet-200 font-dm-sans text-sm">
            Your personal wellness companion, designed just for you
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8"
        >
          <div className="flex mb-6 bg-white/5 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
                haptics.light();
              }}
              className={`flex-1 py-2.5 rounded-lg font-dm-sans text-sm transition-all ${
                !isSignUp
                  ? 'bg-violet-500 text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError('');
                haptics.light();
              }}
              className={`flex-1 py-2.5 rounded-lg font-dm-sans text-sm transition-all ${
                isSignUp
                  ? 'bg-violet-500 text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-dm-sans mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                  placeholder="violet@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-dm-sans mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                  placeholder="••••••••"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-white/50 text-xs mt-1 font-dm-sans">
                Minimum 6 characters
              </p>
            </div>

            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-white/80 text-sm font-dm-sans mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl"
              >
                <AlertCircle size={18} className="text-rose-300 flex-shrink-0 mt-0.5" />
                <p className="text-rose-200 text-sm font-dm-sans">{error}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3.5 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 disabled:cursor-not-allowed text-white rounded-xl font-dm-sans font-medium transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {!isSignUp && (
            <p className="text-center text-white/50 text-xs mt-4 font-dm-sans">
              Forgot your password? Contact your administrator
            </p>
          )}
        </motion.div>

        {isSignUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 glass-card p-4"
          >
            <p className="text-white/70 text-xs font-dm-sans text-center">
              After signing up, you'll be prompted to install VioletCare as an app on your device for the best experience 💜
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default EmailAuth;
