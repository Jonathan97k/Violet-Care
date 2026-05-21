import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Download, Smartphone, Check, X, AlertCircle } from 'lucide-react';
import { markDeviceAsInstalled, isAppInstalled, getCurrentUser, signOutUser } from '../utils/firebase';
import { haptics } from '../utils/haptics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check if already installed
    if (isAppInstalled()) {
      navigate('/onboarding');
      return;
    }

    // Get user email
    getCurrentUser().then(user => {
      if (user) {
        setUserEmail(user.email);
      } else {
        // No user logged in, redirect to auth
        navigate('/email-auth');
      }
    });

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
      console.log('[Install] beforeinstallprompt event captured');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      handleInstallSuccess();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [navigate]);

  const handleInstallSuccess = async () => {
    await markDeviceAsInstalled();
    haptics.success();
    navigate('/onboarding');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowManualInstructions(true);
      return;
    }

    setIsInstalling(true);
    haptics.light();

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's response
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[Install] User accepted the install prompt');
        await handleInstallSuccess();
      } else {
        console.log('[Install] User dismissed the install prompt');
        haptics.error();
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setCanInstall(false);
    } catch (error) {
      console.error('[Install] Error showing install prompt:', error);
      setShowManualInstructions(true);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleSkipForNow = () => {
    haptics.light();
    // Show warning that app won't work without installation
  };

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/email-auth');
  };

  const getDeviceInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) {
      return {
        device: 'Android',
        steps: [
          'Tap the menu button (⋮) in your browser',
          'Select "Add to Home screen" or "Install app"',
          'Follow the prompts to complete installation',
        ],
      };
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        device: 'iOS',
        steps: [
          'Tap the Share button (□↑) at the bottom of Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the top-right corner',
        ],
      };
    } else {
      return {
        device: 'Desktop',
        steps: [
          'Click the install icon in your browser\'s address bar',
          'Or open your browser menu and look for "Install VioletCare"',
          'Follow the prompts to complete installation',
        ],
      };
    }
  };

  const instructions = getDeviceInstructions();

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
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-7xl mb-4"
          >
            📲
          </motion.div>
          <h1 className="text-3xl font-playfair font-semibold text-white mb-2">
            Install VioletCare
          </h1>
          <p className="text-violet-200 font-dm-sans text-sm">
            For the best experience, install VioletCare as an app on your device
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 mb-4"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-violet-500/20 border border-violet-400/40 rounded-xl">
              <AlertCircle size={20} className="text-violet-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">Installation Required</p>
                <p className="text-white/70 text-xs font-dm-sans">
                  VioletCare works best as an installed app. This allows offline access, notifications, and a seamless experience.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-white font-playfair text-lg flex items-center gap-2">
                <Check className="text-violet-400" size={18} />
                Why Install?
              </h3>
              <ul className="space-y-2 text-white/80 text-sm font-dm-sans">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span>Works offline - access your data anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span>Faster loading and smoother performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span>Push notifications for reminders and updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span>Easy access from your home screen</span>
                </li>
              </ul>
            </div>

            {!showManualInstructions ? (
              <motion.button
                onClick={handleInstallClick}
                disabled={isInstalling}
                whileHover={{ scale: isInstalling ? 1 : 1.02 }}
                whileTap={{ scale: isInstalling ? 1 : 0.98 }}
                className="w-full py-4 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-white rounded-xl font-dm-sans font-medium transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-3"
              >
                {isInstalling ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Download size={20} />
                    Install VioletCare
                  </>
                )}
              </motion.button>
            ) : (
              <div className="space-y-4">
                <h3 className="text-white font-playfair text-lg flex items-center gap-2">
                  <Smartphone size={18} className="text-violet-400" />
                  Installation Instructions ({instructions.device})
                </h3>
                <ol className="space-y-3">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-violet-500/30 border border-violet-400/40 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-white/80 text-sm font-dm-sans pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
                <button
                  onClick={() => setShowManualInstructions(false)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-dm-sans text-sm transition-all"
                >
                  Try Automatic Install Again
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="text-center space-y-3">
          <p className="text-white/60 text-xs font-dm-sans">
            Signed in as <span className="text-white">{userEmail}</span>
          </p>
          <button
            onClick={handleSignOut}
            className="text-white/50 hover:text-white text-xs font-dm-sans underline transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Check for standalone mode periodically */}
        {!isAppInstalled() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6"
          >
            <button
              onClick={() => {
                if (isAppInstalled()) {
                  handleInstallSuccess();
                }
              }}
              className="w-full py-2 text-white/40 hover:text-white/60 text-xs font-dm-sans transition-colors"
            >
              Already installed? Click here
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default InstallPrompt;
