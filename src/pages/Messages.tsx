import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Heart, Lock, Sparkles, X } from 'lucide-react';
import { messages } from '../data/messages';
import { track } from '../utils/track';
import { getSetting, setSetting } from '../utils/db';

const REVEALED_KEY = 'messages.revealed';
const DAILY_INDEX_KEY = 'messages.dailyIndex';
const DAILY_DATE_KEY = 'messages.dailyDate';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

const Messages = () => {
  const [revealed, setRevealed] = useState<number[]>([]);
  const [dailyIdx, setDailyIdx] = useState<number>(0);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [activeMsg, setActiveMsg] = useState<number | null>(null);
  const [boost, setBoost] = useState<string | null>(null);
  const [petals, setPetals] = useState(false);

  useEffect(() => {
    track('Messages', 'opened');
    (async () => {
      const r = await getSetting(REVEALED_KEY);
      const list: number[] = r?.value ? JSON.parse(String(r.value)) : [];
      setRevealed(list);

      const todayKey = todayStr();
      const dateRec = await getSetting(DAILY_DATE_KEY);
      const idxRec = await getSetting(DAILY_INDEX_KEY);

      if (dateRec?.value === todayKey && typeof idxRec?.value !== 'undefined') {
        setDailyIdx(Number(idxRec.value));
      } else {
        const idx = Math.floor(Math.random() * messages.length);
        setDailyIdx(idx);
        await setSetting(DAILY_DATE_KEY, todayKey);
        await setSetting(DAILY_INDEX_KEY, idx);
      }
    })();
  }, []);

  const persistRevealed = async (next: number[]) => {
    setRevealed(next);
    await setSetting(REVEALED_KEY, JSON.stringify(next));
  };

  const reveal = (i: number) => {
    track('Messages', 'message_revealed');
    setActiveMsg(i);
    if (!revealed.includes(i)) persistRevealed([...revealed, i]);
    setPetals(true);
    setTimeout(() => setPetals(false), 1800);
  };

  const openDaily = () => {
    setDailyOpen(true);
    if (!revealed.includes(dailyIdx)) persistRevealed([...revealed, dailyIdx]);
    track('Messages', 'daily_card_opened');
    setPetals(true);
    setTimeout(() => setPetals(false), 1800);
  };

  const giveBoost = () => {
    const idx = Math.floor(Math.random() * messages.length);
    setBoost(messages[idx]);
    track('Messages', 'boost_requested');
  };

  const revealedCount = revealed.length;

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
            Messages
          </h1>
          <p className="text-white/60 text-sm font-dm-sans">
            Little notes, just for you 💜
          </p>
        </div>
      </motion.div>

      {/* Daily card */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={openDaily}
        className="w-full text-left rounded-3xl p-6 mb-5 bg-gradient-to-br from-violet-500/30 via-rose-400/20 to-violet-700/30 border border-white/15 backdrop-blur-xl shadow-[0_8px_40px_rgba(139,92,246,0.35)] relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-rose-300/30 blur-3xl" />
        <p className="text-white/70 text-xs uppercase tracking-widest">Today's card</p>
        <h2 className="text-white font-playfair text-2xl mt-2 leading-snug">
          A message is waiting for you
        </h2>
        <p className="text-white/70 text-sm mt-2">Tap to reveal 💌</p>
      </motion.button>

      {/* Boost button */}
      <button
        onClick={giveBoost}
        className="w-full mb-6 py-4 rounded-2xl bg-white/5 border border-white/15 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/10"
      >
        <Sparkles size={18} className="text-rose-300" />
        I Need A Boost 💜
      </button>

      {/* Library */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/70 text-xs uppercase tracking-widest">Library</h3>
        <span className="text-white/40 text-xs">
          {revealedCount}/{messages.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {messages.map((m, i) => {
          const isOpen = revealed.includes(i);
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={() => reveal(i)}
              className={`relative aspect-[3/4] rounded-2xl p-4 text-left overflow-hidden border ${
                isOpen
                  ? 'bg-gradient-to-br from-violet-500/30 to-rose-300/20 border-violet-300/40'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {isOpen ? (
                <p className="text-white/90 text-xs italic font-playfair leading-snug line-clamp-[8]">
                  "{m.length > 110 ? m.slice(0, 110) + '…' : m}"
                </p>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                  <Lock size={20} />
                  <span className="text-xs mt-2">Tap to open</span>
                </div>
              )}
              <Heart
                size={14}
                className="absolute bottom-3 right-3 text-rose-300"
                fill="currentColor"
              />
            </motion.button>
          );
        })}
      </div>

      {/* Daily modal */}
      <AnimatePresence>
        {dailyOpen && (
          <MessageModal
            onClose={() => setDailyOpen(false)}
            title="Today's card"
            message={messages[dailyIdx]}
          />
        )}
        {activeMsg !== null && (
          <MessageModal
            onClose={() => setActiveMsg(null)}
            title="A message for you"
            message={messages[activeMsg]}
          />
        )}
        {boost && (
          <MessageModal
            onClose={() => setBoost(null)}
            title="Here's your boost 💜"
            message={boost}
          />
        )}
      </AnimatePresence>

      {/* Petals */}
      <AnimatePresence>
        {petals && (
          <div className="fixed inset-0 pointer-events-none z-[60]">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 1, rotate: 0 }}
                animate={{
                  y: window.innerHeight + 40,
                  rotate: 360,
                  opacity: 0,
                }}
                transition={{ duration: 1.6 + Math.random(), ease: 'easeIn' }}
                className="absolute w-3 h-3 rounded-full bg-rose-300"
                style={{
                  boxShadow: '0 0 10px rgba(251,113,133,0.6)',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function MessageModal({
  onClose,
  title,
  message,
}: {
  onClose: () => void;
  title: string;
  message: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, rotateY: -90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl p-7 bg-gradient-to-br from-violet-700/80 via-violet-500/40 to-rose-400/40 border border-white/20 backdrop-blur-2xl shadow-[0_20px_60px_rgba(139,92,246,0.5)] relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white"
        >
          <X size={16} />
        </button>
        <p className="text-white/70 text-xs uppercase tracking-widest">{title}</p>
        <p className="text-white font-playfair italic text-2xl leading-snug mt-4">
          "{message}"
        </p>
        <Heart
          size={20}
          className="text-rose-300 mt-6"
          fill="currentColor"
        />
      </motion.div>
    </motion.div>
  );
}

export default Messages;
