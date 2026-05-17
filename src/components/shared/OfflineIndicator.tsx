import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [show, setShow] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    };
    const handleOffline = () => {
      setOnline(false);
      setShow(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -36, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[50] h-9 flex items-center justify-center gap-2 text-xs font-dm-sans"
          style={{
            background: 'rgba(139,92,246,0.3)',
            borderBottom: '1px solid rgba(167,139,250,0.3)',
          }}
        >
          {online ? (
            <>
              <Wifi size={14} className="text-violet-200" />
              <span className="text-violet-100">Back online 💜 Syncing your data...</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-violet-200" />
              <span className="text-violet-100">You're offline — your data is safe 💜</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
