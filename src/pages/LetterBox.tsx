import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Heart, X } from 'lucide-react';
import { track } from '../utils/track';
import { getAllLetters, updateLetter } from '../utils/db';
import type { Letter } from '../types';
import { haptics } from '../utils/haptics';

const LetterBox = () => {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [active, setActive] = useState<Letter | null>(null);

  useEffect(() => {
    track('LetterBox', 'opened');
    (async () => {
      const all = await getAllLetters();
      setLetters(all.sort((a, b) => b.unlockDate.localeCompare(a.unlockDate)));
    })();
  }, []);

  const openLetter = async (letter: Letter) => {
    if (new Date(letter.unlockDate) > new Date()) return;
    haptics.success();
    track('LetterBox', 'letter_opened');
    const updated = { ...letter, isRevealed: true, revealedAt: new Date().toISOString() };
    await updateLetter(updated);
    setActive(updated);
    setLetters((prev) => prev.map((l) => (l.id === letter.id ? updated : l)));
  };

  const daysUntil = (date: string) => {
    const target = new Date(date);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-28">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-400/20 border border-rose-300/30 flex items-center justify-center">
          <Mail size={22} className="text-rose-300" />
        </div>
        <div>
          <h1 className="text-3xl font-playfair font-semibold text-white leading-tight">
            Letters for You 💜
          </h1>
          <p className="text-white/60 text-sm font-dm-sans">
            Sealed with love, waiting for the right moment
          </p>
        </div>
      </motion.div>

      {letters.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-white/60 italic">Your first letter is being written 💜</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {letters.map((letter) => {
            const unlocked = new Date(letter.unlockDate) <= new Date();
            const days = daysUntil(letter.unlockDate);
            return (
              <motion.button
                key={letter.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => openLetter(letter)}
                className={`relative aspect-[3/4] rounded-2xl p-4 text-left overflow-hidden border transition-all ${
                  unlocked
                    ? letter.isRevealed
                      ? 'bg-gradient-to-br from-violet-500/30 to-rose-300/20 border-violet-300/40'
                      : 'bg-gradient-to-br from-violet-500/40 to-rose-300/30 border-violet-300/50 shadow-[0_0_30px_rgba(139,92,246,0.3)]'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {unlocked ? (
                  <>
                    <Heart size={16} className="text-rose-300 mb-2" fill="currentColor" />
                    <p className="text-white text-sm font-medium">{letter.title}</p>
                    <p className="text-white/50 text-xs mt-1">
                      {letter.isRevealed ? 'Read' : 'A letter for you 💜'}
                    </p>
                  </>
                ) : (
                  <>
                    <Lock size={16} className="text-white/40 mb-2" />
                    <p className="text-white/60 text-sm font-medium">{letter.title}</p>
                    <p className="text-white/40 text-xs mt-1">
                      Opens {new Date(letter.unlockDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-white/30 text-[10px] mt-1">
                      {days <= 0 ? 'Today' : `In ${days} day${days > 1 ? 's' : ''}`}
                    </p>
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl p-8 bg-gradient-to-br from-violet-700/90 via-violet-500/50 to-rose-400/40 border border-white/20 backdrop-blur-2xl shadow-[0_20px_60px_rgba(139,92,246,0.5)] relative"
            >
              <button
                onClick={() => setActive(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white"
              >
                <X size={16} />
              </button>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-4">A letter for you</p>
              <p className="text-white font-playfair text-2xl mb-4">{active.title}</p>
              <p className="text-white/90 font-dm-sans italic text-lg leading-relaxed whitespace-pre-wrap">
                {active.content}
              </p>
              <p className="text-rose-300 text-sm mt-6">— with all my love 💜</p>
              <Heart size={18} className="text-rose-300 mt-4" fill="currentColor" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LetterBox;
