import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  score: number;
}

const WellnessRing = ({ score }: Props) => {
  const [displayScore, setDisplayScore] = useState(0);
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative"
      >
        <svg width="120" height="120" className="transform -rotate-90">
          <defs>
            <linearGradient id="violetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <circle
            cx="60"
            cy="60"
            r="60"
            fill="none"
            stroke="#ffffff20"
            strokeWidth="8"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="60"
            fill="none"
            stroke="url(#violetGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center"
          >
            <motion.span
              className="text-3xl font-playfair font-bold text-white"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {displayScore}
            </motion.span>
            <span className="text-lg font-playfair text-white/60">%</span>
          </motion.div>
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-4 text-white/60 font-dm-sans text-sm"
      >
        Your wellness today
      </motion.p>
    </div>
  );
};

export default WellnessRing;
