import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Droplets,
  Smile,
  Moon,
  Wind,
  BookHeart,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { track } from '../utils/track';
import {
  incrementHydration,
  getHydration,
  setHydration,
  setMood,
  getMood,
  getRecentMoods,
  setSleep,
  getSleep,
  getRecentSleep,
  setStress,
  getStress,
  setJournal,
  getJournal,
  getAllJournalEntries,
} from '../utils/db';
import type { JournalEntry, MoodEntry, SleepEntry } from '../types';

type Section = 'hydration' | 'mood' | 'sleep' | 'stress' | 'breathing' | 'journal' | 'insights';

const today = () => new Date().toISOString().split('T')[0];

const Wellness = () => {
  const [section, setSection] = useState<Section>('hydration');

  useEffect(() => {
    track('Wellness', 'opened');
  }, []);

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'hydration', label: 'Hydration', icon: <Droplets size={18} /> },
    { id: 'mood', label: 'Mood', icon: <Smile size={18} /> },
    { id: 'sleep', label: 'Sleep', icon: <Moon size={18} /> },
    { id: 'stress', label: 'Stress', icon: <Gauge size={18} /> },
    { id: 'breathing', label: 'Breathe', icon: <Wind size={18} /> },
    { id: 'journal', label: 'Journal', icon: <BookHeart size={18} /> },
    { id: 'insights', label: 'Insights', icon: <Sparkles size={18} /> },
  ];

  return (
    <div className="min-h-screen px-4 pt-12 pb-28">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-400/20 border border-rose-300/30 flex items-center justify-center">
          <Heart size={22} className="text-rose-300" />
        </div>
        <div>
          <h1 className="text-3xl font-playfair font-semibold text-white leading-tight">
            Wellness Center
          </h1>
          <p className="text-white/60 text-sm font-dm-sans">
            Your space to breathe, reflect and recharge
          </p>
        </div>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1 no-scrollbar">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              section === s.id
                ? 'bg-rose-400/20 border-rose-300/50 text-white'
                : 'bg-white/5 border-white/10 text-white/70'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {section === 'hydration' && <Hydration />}
          {section === 'mood' && <Mood />}
          {section === 'sleep' && <Sleep />}
          {section === 'stress' && <Stress />}
          {section === 'breathing' && <Breathing />}
          {section === 'journal' && <Journal />}
          {section === 'insights' && <Insights />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------- Hydration ------------------------------- */

function Hydration() {
  const [glasses, setGlasses] = useState(0);
  const goal = 8;

  useEffect(() => {
    getHydration(today()).then((h) => setGlasses(h?.glasses ?? 0));
  }, []);

  const add = async () => {
    if (glasses >= goal) return;
    const updated = await incrementHydration(today());
    setGlasses(updated.glasses);
    track('Wellness', 'hydration_logged');
  };

  const removeOne = async () => {
    const next = Math.max(0, glasses - 1);
    setGlasses(next);
    await setHydration({
      date: today(),
      glasses: next,
      lastUpdated: new Date().toISOString(),
    });
  };

  const progress = glasses / goal;

  return (
    <div className="space-y-4">
      <div className="glass-card p-6">
        <div className="relative w-56 h-56 mx-auto">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="url(#hyd)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54 * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <defs>
              <linearGradient id="hyd" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets size={28} className="text-sky-300" />
            <p className="text-5xl font-playfair text-white mt-2">{glasses}</p>
            <p className="text-white/50 text-xs uppercase tracking-widest">of {goal} glasses</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={removeOne}
            className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white"
          >
            − Remove
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={add}
            className="flex-[2] py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium"
          >
            + Add a glass
          </motion.button>
        </div>

        {glasses >= goal && (
          <p className="text-center text-emerald-300 text-sm mt-4">
            You hit your hydration goal 💜
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- Mood --------------------------------- */

const moodEmojis = ['😔', '😕', '😐', '🙂', '😊'] as const;
const moodLabels = ['Low', 'Off', 'Okay', 'Good', 'Great'];

function Mood() {
  const [today_, setToday] = useState<MoodEntry | null>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [note, setNote] = useState('');

  const refresh = async () => {
    const t = await getMood(today());
    setToday(t ?? null);
    setNote(t?.note ?? '');
    setHistory(await getRecentMoods(7));
  };

  useEffect(() => {
    refresh();
  }, []);

  const log = async (level: 1 | 2 | 3 | 4 | 5) => {
    const entry: MoodEntry = {
      date: today(),
      mood: level,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await setMood(entry);
    track('Wellness', 'mood_logged');
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <h3 className="text-white font-playfair text-xl mb-4">How are you feeling?</h3>
        <div className="grid grid-cols-5 gap-2">
          {moodEmojis.map((e, i) => {
            const level = (i + 1) as 1 | 2 | 3 | 4 | 5;
            const active = today_?.mood === level;
            return (
              <button
                key={e}
                onClick={() => log(level)}
                className={`aspect-square rounded-2xl text-3xl border transition-all ${
                  active
                    ? 'bg-violet-500/30 border-violet-400/60 scale-105 shadow-[0_0_25px_rgba(139,92,246,0.4)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {e}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-5 gap-2 mt-1">
          {moodLabels.map((l) => (
            <p key={l} className="text-center text-[10px] text-white/40 uppercase tracking-wider">
              {l}
            </p>
          ))}
        </div>

        <textarea
          rows={2}
          placeholder="A note for today (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => today_ && log(today_.mood)}
          className="w-full mt-4 resize-none"
        />
      </div>

      <div className="glass-card p-5">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-3">Last 7 days</p>
        <div className="flex items-end justify-between gap-1 h-24">
          {Array.from({ length: 7 }).map((_, idx) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - idx));
            const ds = d.toISOString().split('T')[0];
            const m = history.find((h) => h.date === ds);
            const h = m ? (m.mood / 5) * 100 : 0;
            return (
              <div key={ds} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-rose-300"
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/40">
                  {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Sleep -------------------------------- */

function Sleep() {
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWake] = useState('06:30');
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [todayE, setTodayE] = useState<SleepEntry | null>(null);
  const [history, setHistory] = useState<SleepEntry[]>([]);

  const refresh = async () => {
    const t = await getSleep(today());
    if (t) {
      setTodayE(t);
      setBedtime(t.bedtime);
      setWake(t.wakeTime);
      setQuality(t.quality);
    }
    setHistory(await getRecentSleep(7));
  };

  useEffect(() => {
    refresh();
  }, []);

  const calcHours = () => {
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = wakeTime.split(':').map(Number);
    let mins = wh * 60 + wm - (bh * 60 + bm);
    if (mins <= 0) mins += 24 * 60;
    return mins / 60;
  };

  const hours = calcHours();

  const save = async () => {
    const entry: SleepEntry = {
      date: today(),
      bedtime,
      wakeTime,
      hours: Number(hours.toFixed(1)),
      quality,
      createdAt: todayE?.createdAt ?? new Date().toISOString(),
    };
    await setSleep(entry);
    track('Wellness', 'sleep_logged');
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <h3 className="text-white font-playfair text-xl mb-4">Sleep last night</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-white/70 text-xs uppercase tracking-wider">
            Bedtime
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="mt-1 w-full"
            />
          </label>
          <label className="text-white/70 text-xs uppercase tracking-wider">
            Wake time
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWake(e.target.value)}
              className="mt-1 w-full"
            />
          </label>
        </div>

        <p className="text-center mt-5 text-4xl font-playfair text-white">
          {hours.toFixed(1)} <span className="text-base text-white/50">hours</span>
        </p>

        <p className="text-white/60 text-xs uppercase tracking-widest mt-5 mb-2">Quality</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setQuality(n as 1 | 2 | 3 | 4 | 5)}
              className={`flex-1 py-3 rounded-xl border text-lg ${
                quality >= n
                  ? 'bg-violet-500/30 border-violet-400/60 text-white'
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <button
          onClick={save}
          className="w-full mt-5 py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium"
        >
          Save
        </button>
      </div>

      <div className="glass-card p-5">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-3">Last 7 nights</p>
        <div className="flex items-end justify-between gap-1 h-24">
          {Array.from({ length: 7 }).map((_, idx) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - idx));
            const ds = d.toISOString().split('T')[0];
            const e = history.find((h) => h.date === ds);
            const h = e ? Math.min(100, (e.hours / 10) * 100) : 0;
            return (
              <div key={ds} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-400"
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/40">
                  {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Stress ------------------------------- */

function Stress() {
  const [level, setLevel] = useState(5);
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStress(today()).then((s) => {
      if (s) {
        setLevel(s.level);
        setReflection(s.reflection ?? '');
      }
    });
  }, []);

  const save = async () => {
    await setStress({
      date: today(),
      level,
      reflection: reflection.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    track('Wellness', 'stress_logged');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const colorAt = (l: number) =>
    l <= 3 ? '#34d399' : l <= 6 ? '#fbbf24' : '#fb7185';

  return (
    <div className="glass-card p-5">
      <h3 className="text-white font-playfair text-xl mb-4">Stress check</h3>

      <div className="text-center">
        <p className="text-6xl font-playfair" style={{ color: colorAt(level) }}>
          {level}
        </p>
        <p className="text-white/50 text-xs uppercase tracking-widest mt-1">
          {level <= 3 ? 'Calm' : level <= 6 ? 'Manageable' : 'High stress'}
        </p>
      </div>

      <input
        type="range"
        min={1}
        max={10}
        value={level}
        onChange={(e) => setLevel(parseInt(e.target.value, 10))}
        className="w-full mt-4 accent-violet-500"
      />

      <textarea
        rows={4}
        placeholder="What's weighing on you?"
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        className="w-full mt-4 resize-none"
      />

      <button
        onClick={save}
        className="w-full mt-4 py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium"
      >
        {saved ? 'Saved 💜' : 'Save'}
      </button>
    </div>
  );
}

/* -------------------------------- Breathing ------------------------------ */

function Breathing() {
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);
  const totalCycles = 4;

  useEffect(() => {
    if (phase === 'idle' || done) return;
    const durations = { inhale: 4000, hold: 7000, exhale: 8000 };
    const order: ('inhale' | 'hold' | 'exhale')[] = ['inhale', 'hold', 'exhale'];

    const t = setTimeout(() => {
      const idx = order.indexOf(phase as 'inhale' | 'hold' | 'exhale');
      const next = order[(idx + 1) % 3];
      if (next === 'inhale') {
        const nextCycle = cycle + 1;
        if (nextCycle >= totalCycles) {
          setPhase('idle');
          setDone(true);
          track('Wellness', 'breathing_completed');
          return;
        }
        setCycle(nextCycle);
      }
      setPhase(next);
    }, durations[phase as 'inhale' | 'hold' | 'exhale']);

    return () => clearTimeout(t);
  }, [phase, cycle, done]);

  const start = () => {
    setDone(false);
    setCycle(0);
    setPhase('inhale');
  };

  const stop = () => {
    setPhase('idle');
    setCycle(0);
  };

  const scale =
    phase === 'inhale' ? 1.4 : phase === 'hold' ? 1.4 : phase === 'exhale' ? 0.7 : 1;
  const duration = phase === 'inhale' ? 4 : phase === 'hold' ? 0 : phase === 'exhale' ? 8 : 0.4;

  const label =
    phase === 'inhale'
      ? 'Breathe in'
      : phase === 'hold'
      ? 'Hold'
      : phase === 'exhale'
      ? 'Breathe out'
      : done
      ? 'Beautifully done 💜'
      : 'Ready when you are';

  return (
    <div className="glass-card p-6">
      <h3 className="text-white font-playfair text-xl text-center mb-2">4-7-8 Breathing</h3>
      <p className="text-white/50 text-xs text-center uppercase tracking-widest mb-8">
        {totalCycles} cycles · ~80 seconds
      </p>

      <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
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

      <p className="text-center text-white/50 text-sm mt-6">
        Cycle {Math.min(cycle + 1, totalCycles)} of {totalCycles}
      </p>

      <div className="mt-5">
        {phase === 'idle' ? (
          <button
            onClick={start}
            className="w-full py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium"
          >
            {done ? 'Start again' : 'Begin'}
          </button>
        ) : (
          <button
            onClick={stop}
            className="w-full py-3 rounded-2xl bg-white/10 border border-white/15 text-white"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Journal -------------------------------- */

function Journal() {
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const t = await getJournal(today());
      if (t) setContent(t.content);
      setEntries(await getAllJournalEntries());
    })();
  }, []);

  const save = async (text: string) => {
    if (!text.trim()) return;
    const existing = await getJournal(today());
    await setJournal({
      date: today(),
      content: text,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    setEntries(await getAllJournalEntries());
  };

  const onChange = (v: string) => {
    setContent(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => save(v), 1500);
  };

  const days = entries.map((e) => e.date);

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-playfair text-xl">Today's reflection</h3>
          <span className="text-xs text-white/40">{saved ? 'Saved' : 'Auto-saves'}</span>
        </div>
        <textarea
          rows={9}
          placeholder="How are you feeling today? This is your space."
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => save(content)}
          className="w-full resize-none"
        />
      </div>

      <div className="glass-card p-5">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-3">Last 14 days</p>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 14 }).map((_, idx) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - idx));
            const ds = d.toISOString().split('T')[0];
            const has = days.includes(ds);
            return (
              <div
                key={ds}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs ${
                  has
                    ? 'bg-violet-500/30 border border-violet-400/50 text-white'
                    : 'bg-white/5 border border-white/10 text-white/40'
                }`}
              >
                <span className="text-[9px] uppercase">
                  {d.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                <span className="font-medium">{d.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Insights ------------------------------- */

function Insights() {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [sleep, setSleepData] = useState<SleepEntry[]>([]);
  const [hydToday, setHydToday] = useState(0);

  useEffect(() => {
    (async () => {
      setMoods(await getRecentMoods(7));
      setSleepData(await getRecentSleep(7));
      const h = await getHydration(today());
      setHydToday(h?.glasses ?? 0);
    })();
  }, []);

  const avgSleep =
    sleep.length > 0 ? sleep.reduce((s, e) => s + e.hours, 0) / sleep.length : 0;
  const moodCount = moods.length;

  return (
    <div className="space-y-3">
      <div className="glass-card p-5">
        <p className="text-white/60 text-xs uppercase tracking-widest">This week</p>
        <p className="mt-2 text-white text-lg">
          You logged your mood{' '}
          <span className="font-playfair text-2xl">{moodCount}</span>/7 days
        </p>
      </div>
      <div className="glass-card p-5">
        <p className="text-white/60 text-xs uppercase tracking-widest">Average sleep</p>
        <p className="mt-2 text-white text-lg">
          <span className="font-playfair text-2xl">{avgSleep.toFixed(1)}</span> hours per night
        </p>
      </div>
      <div className="glass-card p-5">
        <p className="text-white/60 text-xs uppercase tracking-widest">Today's hydration</p>
        <p className="mt-2 text-white text-lg">
          <span className="font-playfair text-2xl">{hydToday}</span>/8 glasses
        </p>
      </div>
      <div className="glass-card p-5 bg-gradient-to-br from-violet-500/20 to-rose-300/20 border-violet-400/30">
        <p className="text-white/90 italic font-playfair text-lg leading-snug">
          {avgSleep >= 7
            ? "You've been resting well — your body is thanking you."
            : moodCount >= 4
            ? 'Showing up for yourself, day after day. That matters.'
            : 'Be gentle with yourself this week. You are doing enough. 💜'}
        </p>
      </div>
    </div>
  );
}

export default Wellness;
