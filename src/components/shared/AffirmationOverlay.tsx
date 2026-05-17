import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { affirmations } from '../../data/affirmations';

interface AffirmationOverlayProps {
  onComplete: () => void;
  duration?: number;
}

const AffirmationOverlay = ({ onComplete, duration = 2500 }: AffirmationOverlayProps) => {
  const [text] = useState(() => affirmations[Math.floor(Math.random() * affirmations.length)]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration - 400);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: 'linear-gradient(180deg, #1a0533 0%, #2e1065 50%, #1a0533 100%)' }}
        >
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center text-white text-2xl font-playfair leading-relaxed animate-pulse-soft"
          >
            {text}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AffirmationOverlay;
