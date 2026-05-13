import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  Calculator,
  Droplet,
  Pill,
  NotebookPen,
  BookOpen,
  Timer as TimerIcon,
  Plus,
  Trash2,
  Search,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { track } from '../utils/track';
import {
  addMedication,
  deleteMedication,
  getAllMedications,
  addPatientNote,
  deletePatientNote,
  getAllPatientNotes,
  addClinicalReference,
  getAllClinicalReferences,
} from '../utils/db';
import { clinicalReferences as referenceSeed } from '../data/references';
import type { Medication, PatientNote, ClinicalReference } from '../types';

type ToolTab = 'bmi' | 'iv' | 'meds' | 'notes' | 'reference' | 'timer';

const tabs: { id: ToolTab; label: string; icon: React.ReactNode }[] = [
  { id: 'bmi', label: 'BMI', icon: <Calculator size={18} /> },
  { id: 'iv', label: 'IV Drip', icon: <Droplet size={18} /> },
  { id: 'meds', label: 'Meds', icon: <Pill size={18} /> },
  { id: 'notes', label: 'Quick Notes', icon: <NotebookPen size={18} /> },
  { id: 'reference', label: 'Reference', icon: <BookOpen size={18} /> },
  { id: 'timer', label: 'Timer', icon: <TimerIcon size={18} /> },
];

const Tools = () => {
  const [tab, setTab] = useState<ToolTab>('bmi');

  useEffect(() => {
    track('Nurse Tools', 'opened');
  }, []);

  return (
    <div className="min-h-screen px-4 pt-12 pb-28">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
          <Stethoscope size={22} className="text-violet-300" />
        </div>
        <div>
          <h1 className="text-3xl font-playfair font-semibold text-white leading-tight">
            Nurse Tools
          </h1>
          <p className="text-white/60 text-sm font-dm-sans">
            Calculations, references and quick aids
          </p>
        </div>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1 no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              track('Nurse Tools', t.id);
            }}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              tab === t.id
                ? 'bg-violet-500/30 border-violet-400/60 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {tab === 'bmi' && <BMICalculator />}
          {tab === 'iv' && <IVCalculator />}
          {tab === 'meds' && <MedicationScheduler />}
          {tab === 'notes' && <PatientQuickNotes />}
          {tab === 'reference' && <ClinicalReferenceLibrary />}
          {tab === 'timer' && <TimerStopwatch />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ----------------------------- BMI Calculator ---------------------------- */

function BMICalculator() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const w = parseFloat(weight);
  const h = parseFloat(height) / 100;
  const bmi = w > 0 && h > 0 ? w / (h * h) : 0;

  const category =
    bmi === 0
      ? ''
      : bmi < 18.5
      ? 'Underweight'
      : bmi < 25
      ? 'Normal'
      : bmi < 30
      ? 'Overweight'
      : 'Obese';

  const colorFor = (c: string) =>
    c === 'Normal'
      ? 'text-emerald-300'
      : c === 'Underweight'
      ? 'text-sky-300'
      : c === 'Overweight'
      ? 'text-amber-300'
      : 'text-rose-300';

  // Map BMI to gauge angle (15 → -90deg, 40 → +90deg)
  const angle = Math.max(-90, Math.min(90, ((bmi - 27.5) / 12.5) * 90));

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <h3 className="text-white font-playfair text-xl mb-4">BMI Calculator</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-white/70 text-xs uppercase tracking-wider font-dm-sans">
            Weight (kg)
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="65"
              className="mt-1 w-full"
            />
          </label>
          <label className="text-white/70 text-xs uppercase tracking-wider font-dm-sans">
            Height (cm)
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="170"
              className="mt-1 w-full"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="relative w-48 h-24 overflow-hidden">
            <div
              className="absolute inset-x-0 top-0 h-48 rounded-full"
              style={{
                background:
                  'conic-gradient(from 270deg, #38bdf8, #34d399, #fbbf24, #fb7185)',
                clipPath: 'inset(0 0 50% 0)',
                opacity: 0.6,
              }}
            />
            <div className="absolute left-1/2 bottom-0 w-1 h-20 origin-bottom bg-white rounded-full"
              style={{
                transform: `translateX(-50%) rotate(${angle}deg)`,
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 10px rgba(255,255,255,0.6)',
              }}
            />
            <div className="absolute left-1/2 bottom-0 w-3 h-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-white" />
          </div>

          <p className="mt-6 text-5xl font-playfair text-white">
            {bmi > 0 ? bmi.toFixed(1) : '—'}
          </p>
          {category && (
            <p className={`mt-2 text-lg font-medium ${colorFor(category)}`}>
              {category}
            </p>
          )}
          {bmi === 0 && (
            <p className="text-white/40 text-sm mt-2">
              Enter weight and height to calculate
            </p>
          )}
        </div>

        <button
          onClick={() => track('BMI Calculator', 'calculated')}
          className="hidden"
          aria-hidden
        />
      </div>
    </div>
  );
}

/* ------------------------ IV Drip Rate Calculator ------------------------ */

function IVCalculator() {
  const [volume, setVolume] = useState('');
  const [hours, setHours] = useState('');
  const [drop, setDrop] = useState<10 | 15 | 20 | 60>(20);

  const v = parseFloat(volume);
  const t = parseFloat(hours);
  const dpm = v > 0 && t > 0 ? (v * drop) / (t * 60) : 0;

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <h3 className="text-white font-playfair text-xl mb-4">IV Drip Rate</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-white/70 text-xs uppercase tracking-wider font-dm-sans">
            Volume (mL)
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="1000"
              className="mt-1 w-full"
            />
          </label>
          <label className="text-white/70 text-xs uppercase tracking-wider font-dm-sans">
            Time (hours)
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="8"
              className="mt-1 w-full"
            />
          </label>
        </div>

        <div className="mt-4">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-2">
            Drop factor (gtts/mL)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[10, 15, 20, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDrop(d as 10 | 15 | 20 | 60)}
                className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                  drop === d
                    ? 'bg-violet-500/30 border-violet-400/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/70'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-xs uppercase tracking-widest">
            Drops per minute
          </p>
          <p className="text-5xl font-playfair text-white mt-2">
            {dpm > 0 ? Math.round(dpm) : '—'}
          </p>
          {dpm > 0 && (
            <p className="text-white/50 text-xs mt-3 font-mono">
              ({v} × {drop}) ÷ ({t} × 60) = {dpm.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Medication Reminder ----------------------------- */

function MedicationScheduler() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', dose: '', frequency: 'Daily', time: '08:00' });

  useEffect(() => {
    getAllMedications().then(setMeds);
  }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    const med: Medication = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      dose: form.dose.trim(),
      frequency: form.frequency,
      time: form.time,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await addMedication(med);
    setMeds(await getAllMedications());
    setForm({ name: '', dose: '', frequency: 'Daily', time: '08:00' });
    setOpen(false);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const remove = async (id: string) => {
    await deleteMedication(id);
    setMeds(await getAllMedications());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-playfair text-xl">Medications</h3>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-full bg-violet-500/30 border border-violet-400/40 text-white text-sm"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {meds.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <p className="text-white/60 italic">No medications yet — add your first reminder</p>
        </div>
      ) : (
        <div className="space-y-2">
          {meds.map((m) => (
            <div key={m.id} className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-400/20 flex items-center justify-center">
                <Pill size={18} className="text-rose-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{m.name}</p>
                <p className="text-white/60 text-xs">
                  {m.dose && `${m.dose} · `}
                  {m.frequency} · {m.time}
                </p>
              </div>
              <button
                onClick={() => remove(m.id)}
                className="p-2 text-white/40 hover:text-rose-300"
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <BottomSheet onClose={() => setOpen(false)} title="Add Medication">
            <div className="space-y-3">
              <input
                placeholder="Name (e.g. Vitamin D)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full"
              />
              <input
                placeholder="Dose (e.g. 1000 IU)"
                value={form.dose}
                onChange={(e) => setForm({ ...form, dose: e.target.value })}
                className="w-full"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full"
                >
                  <option className="bg-violet-900">Daily</option>
                  <option className="bg-violet-900">Twice Daily</option>
                  <option className="bg-violet-900">Weekly</option>
                  <option className="bg-violet-900">As Needed</option>
                </select>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full"
                />
              </div>
              <button
                onClick={save}
                className="w-full py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium"
              >
                Save
              </button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------- Patient Quick Notes ----------------------------- */

function PatientQuickNotes() {
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [text, setText] = useState('');
  const [tag, setTag] = useState('');

  useEffect(() => {
    getAllPatientNotes().then((n) =>
      setNotes(n.sort((a, b) => b.timestamp.localeCompare(a.timestamp)))
    );
  }, []);

  const add = async () => {
    if (!text.trim()) return;
    const note: PatientNote = {
      id: crypto.randomUUID(),
      content: text.trim(),
      tag: tag.trim() || undefined,
      timestamp: new Date().toISOString(),
    };
    await addPatientNote(note);
    const all = await getAllPatientNotes();
    setNotes(all.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    setText('');
    setTag('');
  };

  const remove = async (id: string) => {
    await deletePatientNote(id);
    const all = await getAllPatientNotes();
    setNotes(all.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <textarea
          rows={3}
          placeholder="Quick patient note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full resize-none"
        />
        <div className="flex gap-2 mt-2">
          <input
            placeholder="Tag (optional)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="flex-1"
          />
          <button
            onClick={add}
            className="px-5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium"
          >
            Save
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <p className="text-white/60 italic">A blank page, full of possibility</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="glass-card p-4 flex gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white whitespace-pre-wrap break-words">{n.content}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                  <span>{new Date(n.timestamp).toLocaleString()}</span>
                  {n.tag && (
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200">
                      {n.tag}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => remove(n.id)}
                className="self-start p-2 text-white/40 hover:text-rose-300"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------- Clinical Reference ----------------------------- */

function ClinicalReferenceLibrary() {
  const [refs, setRefs] = useState<ClinicalReference[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Custom', content: '' });

  useEffect(() => {
    (async () => {
      let all = await getAllClinicalReferences();
      if (all.length === 0) {
        // Seed
        for (const r of referenceSeed) {
          await addClinicalReference({
            id: r.id,
            title: r.title,
            category: r.category,
            content: r.content,
            isCustom: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        all = await getAllClinicalReferences();
      }
      setRefs(all);
    })();
  }, []);

  const filtered = refs.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.content.toLowerCase().includes(query.toLowerCase()) ||
      r.category.toLowerCase().includes(query.toLowerCase())
  );

  const saveCustom = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    await addClinicalReference({
      id: crypto.randomUUID(),
      title: form.title.trim(),
      category: form.category.trim() || 'Custom',
      content: form.content.trim(),
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setRefs(await getAllClinicalReferences());
    setForm({ title: '', category: 'Custom', content: '' });
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          placeholder="Search references..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-2">
        {filtered.map((r) => (
          <button
            key={r.id}
            onClick={() => setOpen(open === r.id ? null : r.id)}
            className="text-left glass-card p-4 hover:border-violet-400/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <p className="text-white font-medium">{r.title}</p>
              <span className="text-[10px] uppercase tracking-widest text-violet-300">
                {r.category}
              </span>
            </div>
            {open === r.id && (
              <pre className="mt-3 text-white/80 text-sm whitespace-pre-wrap font-dm-sans">
                {r.content}
              </pre>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => setAdding(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
      >
        <Plus size={16} /> Add custom reference
      </button>

      <AnimatePresence>
        {adding && (
          <BottomSheet onClose={() => setAdding(false)} title="New Reference">
            <div className="space-y-3">
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full"
              />
              <input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full"
              />
              <textarea
                rows={5}
                placeholder="Content..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full resize-none"
              />
              <button
                onClick={saveCustom}
                className="w-full py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium"
              >
                Save
              </button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------- Timer + Stopwatch ----------------------------- */

function TimerStopwatch() {
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['timer', 'stopwatch'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`py-2 rounded-xl text-sm font-medium border transition-all ${
              mode === m
                ? 'bg-violet-500/30 border-violet-400/60 text-white'
                : 'bg-white/5 border-white/10 text-white/70'
            }`}
          >
            {m === 'timer' ? 'Countdown' : 'Stopwatch'}
          </button>
        ))}
      </div>

      {mode === 'timer' ? <Countdown /> : <Stopwatch />}
    </div>
  );
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return { m, s, cs };
}

function Countdown() {
  const [target, setTarget] = useState(5 * 60 * 1000);
  const [remaining, setRemaining] = useState(5 * 60 * 1000);
  const [running, setRunning] = useState(false);
  const [custom, setCustom] = useState('');
  const start = useRef<number | null>(null);
  const initial = useRef(5 * 60 * 1000);

  useEffect(() => {
    if (!running) return;
    start.current = performance.now();
    initial.current = remaining;
    const id = setInterval(() => {
      const elapsed = performance.now() - (start.current ?? 0);
      const left = Math.max(0, initial.current - elapsed);
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('VioletCare', { body: 'Your timer is up 💜' });
          }
        } catch {
          /* noop */
        }
      }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const setPreset = (mins: number) => {
    setRunning(false);
    const ms = mins * 60 * 1000;
    setTarget(ms);
    setRemaining(ms);
  };

  const setCustomTime = () => {
    const mins = parseInt(custom, 10);
    if (mins > 0) {
      setPreset(mins);
      setCustom('');
    }
  };

  const { m, s } = formatMs(remaining);
  const progress = target > 0 ? 1 - remaining / target : 0;

  return (
    <div className="glass-card p-6">
      <div className="relative w-56 h-56 mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 54}
            strokeDashoffset={2 * Math.PI * 54 * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-playfair text-white">
            {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-6">
        {[5, 10, 15, 30].map((mins) => (
          <button
            key={mins}
            onClick={() => setPreset(mins)}
            className="py-2 rounded-xl text-sm bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
          >
            {mins}m
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <input
          type="number"
          placeholder="Custom mins"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="flex-1"
        />
        <button
          onClick={setCustomTime}
          className="px-4 rounded-xl bg-white/10 border border-white/15 text-white"
        >
          Set
        </button>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex-1 py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium flex items-center justify-center gap-2"
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setRemaining(target);
          }}
          className="px-4 rounded-2xl bg-white/10 border border-white/15 text-white"
          aria-label="Reset"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const start = useRef<number | null>(null);
  const base = useRef(0);

  useEffect(() => {
    if (!running) return;
    start.current = performance.now();
    const id = setInterval(() => {
      setElapsed(base.current + (performance.now() - (start.current ?? 0)));
    }, 30);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (running) {
      base.current = elapsed;
      setRunning(false);
    } else {
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    base.current = 0;
    setLaps([]);
  };

  const lap = () => {
    if (running) setLaps((l) => [elapsed, ...l]);
  };

  const { m, s, cs } = formatMs(elapsed);

  return (
    <div className="glass-card p-6">
      <div className="text-center">
        <span className="text-6xl font-playfair text-white">
          {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          <span className="text-3xl text-white/60">.{String(cs).padStart(2, '0')}</span>
        </span>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={toggle}
          className="flex-1 py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium flex items-center justify-center gap-2"
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={lap}
          disabled={!running}
          className="px-4 rounded-2xl bg-white/10 border border-white/15 text-white disabled:opacity-40"
        >
          Lap
        </button>
        <button
          onClick={reset}
          className="px-4 rounded-2xl bg-white/10 border border-white/15 text-white"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {laps.length > 0 && (
        <div className="mt-5 max-h-40 overflow-y-auto">
          {laps.map((l, i) => {
            const t = formatMs(l);
            return (
              <div
                key={i}
                className="flex justify-between text-sm py-1 border-b border-white/5 text-white/80"
              >
                <span>Lap {laps.length - i}</span>
                <span className="font-mono">
                  {String(t.m).padStart(2, '0')}:{String(t.s).padStart(2, '0')}.
                  {String(t.cs).padStart(2, '0')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------- Reusable BottomSheet --------------------------- */

function BottomSheet({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end justify-center"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-[#1a0533]/95 backdrop-blur-xl border-t border-x border-white/15 p-5 pb-8"
      >
        <div className="w-12 h-1.5 mx-auto rounded-full bg-white/20 mb-4" />
        <h3 className="text-white font-playfair text-xl mb-4">{title}</h3>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default Tools;
