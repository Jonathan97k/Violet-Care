import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { verifyAdminPIN, setAdminSession, ensureAdminPinSetup } from '../utils/adminAuth';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureAdminPinSetup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;
    setLoading(true);
    setError('');

    const ok = await verifyAdminPIN(pin);
    setLoading(false);

    if (ok) {
      setAdminSession();
      navigate('/admin');
    } else {
      setError('Incorrect PIN');
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
          className="glass-card p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
