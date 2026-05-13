import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { setupPIN, markSetupComplete, isBiometricAvailable, registerBiometric } from '../utils/auth';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [_biometricRegistered, setBiometricRegistered] = useState(false);
  const [_showConfetti, setShowConfetti] = useState(false);

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };

  const handleStep1Next = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    setStep(2);
  };

  const handleStep2Next = () => {
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }
    if (confirmPin !== pin) {
      setError('PINs do not match');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleStep3Next = async (useBiometric: boolean) => {
    try {
      await setupPIN(pin);
      if (useBiometric && biometricAvailable) {
        const success = await registerBiometric();
        setBiometricRegistered(success);
      }
      await markSetupComplete();
      setStep(4);
      setShowConfetti(true);
    } catch (err) {
      setError('Failed to setup. Please try again.');
    }
  };

  const handleFinish = () => {
    navigate('/');
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-screen px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-8xl mb-6"
      >
        💜
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-playfair font-semibold text-white mb-4 text-center"
      >
        Hello, Violet 💜
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg font-dm-sans text-violet-200 mb-8 text-center max-w-md"
      >
        Welcome to your personal wellness companion. Let's set up your app to keep it private and secure.
      </motion.p>
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStep1Next}
        className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-dm-sans font-medium shadow-glow transition-all"
      >
        Let's Get Started
      </motion.button>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-screen px-6"
    >
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-playfair font-semibold text-white mb-6 text-center"
      >
        Create Your PIN
      </motion.h2>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-xs space-y-4"
      >
        <div>
          <label className="block text-violet-200 font-dm-sans mb-2 text-sm">
            Enter 6-digit PIN
          </label>
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
            placeholder="••••••"
          />
        </div>
        <div>
          <label className="block text-violet-200 font-dm-sans mb-2 text-sm">
            Confirm PIN
          </label>
          <input
            type="password"
            maxLength={6}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
            placeholder="••••••"
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
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStep2Next}
          className="w-full px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-dm-sans font-medium shadow-glow transition-all"
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-screen px-6"
    >
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-playfair font-semibold text-white mb-4 text-center"
      >
        Biometric Login?
      </motion.h2>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-lg font-dm-sans text-violet-200 mb-8 text-center max-w-md"
      >
        {biometricAvailable
          ? 'Would you like to use fingerprint or Face ID for quick access?'
          : 'Your device doesn\'t support biometric login. You can still use your PIN.'}
      </motion.p>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-xs space-y-4"
      >
        {biometricAvailable ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStep3Next(true)}
              className="w-full px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-dm-sans font-medium shadow-glow transition-all"
            >
              Yes, Use Biometric
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStep3Next(false)}
              className="w-full px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-dm-sans font-medium transition-all"
            >
              Skip, PIN Only
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStep3Next(false)}
            className="w-full px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-dm-sans font-medium shadow-glow transition-all"
          >
            Continue with PIN
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      key="step4"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-screen px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-8xl mb-6"
      >
        ✨
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-playfair font-semibold text-white mb-4 text-center"
      >
        You're All Set 💜
      </motion.h2>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg font-dm-sans text-violet-200 mb-8 text-center max-w-md"
      >
        Your app is ready. Welcome to your personal wellness space, Violet.
      </motion.p>
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleFinish}
        className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-dm-sans font-medium shadow-glow transition-all"
      >
        Enter VioletCare
      </motion.button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-violet relative overflow-hidden">
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
      <AnimatePresence mode="wait">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
