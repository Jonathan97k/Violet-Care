import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, SkipForward, Music } from 'lucide-react';
import { track } from '../utils/track';
import { messages } from '../data/messages';
import { haptics } from '../utils/haptics';

const playlists = [
  { label: 'Calm Piano', emoji: '🎹' },
  { label: 'Rain Sounds', emoji: '🌧️' },
  { label: 'Lo-fi Beats', emoji: '🎧' },
  { label: 'Nature Sounds', emoji: '🌿' },
  { label: 'Soft Jazz', emoji: '🎷' },
];

function formatDuration(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h} hours${m > 0 ? ` ${m} minutes` : ''}`;
}

const Decompression = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shift = (location.state as { shift?: { date: string; startTime: string; endTime: string; type: string } } | null)?.shift;

  const [step, setStep] = useState(1);
  const [canAdvance, setCanAdvance] = useState(false);

  useEffect(() => {
    track('Decompression', 'opened');
    const t = setTimeout(() => setCanAdvance(true), 10000);
    return () => clearTimeout(t);
  }, []);

  const advance = () => {
    if (step < 3) {
      setStep(step + 1);
      setCanAdvance(false);
      if (step + 1 === 3) setCanAdvance(true);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-violet flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(251, 113, 133, 0.3) 0%, transparent 50%)',
          backgroundSize: '200% 200%',
        }}
      />

      <AnimatePresence mode="wait">
        {step === 1 && <Step1 key="s1" shift={shift} canAdvance={canAdvance} onAdvance={advance} />}
        {step === 2 && <Step2 key="s2" onComplete={advance} />}
        {step === 3 && <Step3 key="s3" onComplete={advance} />}
      </AnimatePresence>
    </div>
  );
};

/* Step 1 — Acknowledgement */
function Step1({
  shift,
  canAdvance,
  onAdvance,
}: {
  shift?: { date: string; startTime: string; endTime: string; type: string };
  canAdvance: boolean;
  onAdvance: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 text-center max-w-md"
    >
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-playfair text-white mb-4"
      >
        You did it, Violet. 💜
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-xl text-white/80 font-playfair mb-2"
      >
        Another shift complete.
      </motion.p>
      {shift && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-violet-300 text-lg mb-6"
        >
          {formatDuration(shift.startTime, shift.endTime)}
        </motion.p>
      )}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-white/60 text-sm mb-8"
      >
        Take a breath. You're home now.
      </motion.p>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: canAdvance ? 1 : 0.3 }}
        disabled={!canAdvance}
        onClick={onAdvance}
        className="px-8 py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 disabled:opacity-30 text-white font-medium transition-all"
      >
        Next
      </motion.button>
    </motion.div>
  );
}

/* Step 2 — Breathing */
function Step2({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);
  const totalCycles = 2;

  useEffect(() => {
    if (phase === 'idle' || done) return;
    const durations = { inhale: 4000, hold: 7000, exhale: 8000 };
    const order: ('inhale' | 'hold' | 'exhale')[] = ['inhale', 'hold', 'exhale'];

    const t = setTimeout(() => {
      const idx = order.indexOf(phase);
      const next = order[(idx + 1) % 3];
      if (next === 'inhale') {
        const nextCycle = cycle + 1;
        if (nextCycle >= totalCycles) {
          setPhase('idle');
          setDone(true);
          haptics.medium();
          track('Decompression', 'breathing_completed');
          return;
        }
        setCycle(nextCycle);
      }
      setPhase(next);
    }, durations[phase]);

    return () => clearTimeout(t);
  }, [phase, cycle, done]);

  const start = () => {
    setDone(false);
    setCycle(0);
    setPhase('inhale');
  };

  const scale = phase === 'inhale' ? 1.4 : phase === 'hold' ? 1.4 : phase === 'exhale' ? 0.7 : 1;
  const duration = phase === 'inhale' ? 4 : phase === 'hold' ? 0 : phase === 'exhale' ? 8 : 0.4;
  const label =
    phase === 'inhale' ? 'Breathe in' : phase === 'hold' ? 'Hold' : phase === 'exhale' ? 'Breathe out' : done ? 'Beautifully done 💜' : "Let's breathe together before you rest.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 text-center max-w-md w-full"
    >
      <p className="text-white/60 text-xs uppercase tracking-widest mb-6">
        {done ? 'Breathing complete' : `Cycle ${Math.min(cycle + 1, totalCycles)} of ${totalCycles}`}
      </p>

      <div className="relative w-64 h-64 mx-auto flex items-center justify-center mb-8">
        <motion.div
          animate={{ scale }}
          transition={{ duration, ease: 'easeInOut' }}
          className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-violet-400 to-rose-300"
          style={{ filter: 'blur(20px)', opacity: 0.6 }}
        />
        <motion.div
          animate={{ scale }}
          transition={{ duration, ease: 'easeInOut' }}
          className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-violet-500 to-rose-400 shadow-[0_0_60px_rgba(139,92,246,0.5)]"
        />
        <p className="relative z-10 text-white font-playfair text-2xl text-center px-4">{label}</p>
      </div>

      {phase === 'idle' ? (
        <div className="flex gap-3 justify-center">
          <button
            onClick={start}
            className="px-8 py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium"
          >
            {done ? 'Next' : 'Begin'}
          </button>
          {!done && (
            <button
              onClick={onComplete}
              className="px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-sm flex items-center gap-1"
            >
              <SkipForward size={14} /> Skip
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => { setPhase('idle'); setCycle(0); }}
          className="px-8 py-3 rounded-2xl bg-white/10 border border-white/20 text-white"
        >
          Stop
        </button>
      )}
    </motion.div>
  );
}

/* Step 3 — Message */
function Step3({ onComplete }: { onComplete: () => void }) {
  const [msg] = useState(() => messages[Math.floor(Math.random() * messages.length)]);
  const [copied, setCopied] = useState(false);

  const copyPlaylist = (name: string) => {
    navigator.clipboard.writeText(name).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 text-center max-w-md w-full px-4"
    >
      <motion.div
        initial={{ rotateY: -90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="glass-card p-8 mb-6 bg-gradient-to-br from-violet-500/30 via-rose-300/20 to-violet-700/30 border-white/20"
        style={{ perspective: 1000 }}
      >
        <p className="text-white/70 text-xs uppercase tracking-widest mb-4">A message for you</p>
        <p className="text-white font-playfair italic text-xl leading-relaxed">
          "{msg}"
        </p>
        <p className="text-rose-300 text-sm mt-4">— with love 💜</p>
        <Heart size={20} className="text-rose-300 mx-auto mt-4" fill="currentColor" />
      </motion.div>

      <div className="mb-6">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3 flex items-center justify-center gap-1">
          <Music size={12} /> Something to unwind to
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {playlists.map((p) => (
            <button
              key={p.label}
              onClick={() => copyPlaylist(`${p.label} ${p.emoji}`)}
              className="shrink-0 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
            >
              {p.label} {p.emoji}
            </button>
          ))}
        </div>
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-violet-300 text-xs mt-2"
          >
            Search this on Spotify or YouTube 💜
          </motion.p>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onComplete}
        className="px-8 py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium"
      >
        Go rest, Violet 💜
      </motion.button>
    </motion.div>
  );
}

export default Decompression;
