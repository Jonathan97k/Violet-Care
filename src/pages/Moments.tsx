import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Heart, Trash2, Image as ImageIcon, Calendar, X } from 'lucide-react';
import { track } from '../utils/track';
import {
  addMoment,
  deleteMoment,
  getAllMoments,
  addCountdown,
  deleteCountdown,
  getAllCountdowns,
  addPhoto,
  deletePhoto,
  getAllPhotos,
  getSetting,
  setSetting,
  addMilestone,
  deleteMilestone,
  getAllMilestones,
} from '../utils/db';
import type { Moment as MomentType, Countdown, Photo, Milestone } from '../types';

const ANNIVERSARY_KEY = 'app.anniversary';

const Moments = () => {
  const [tab, setTab] = useState<'timeline' | 'countdowns' | 'photos' | 'milestones'>('timeline');
  const [nextDate, setNextDate] = useState<{ name: string; date: string } | null>(null);
  const [anniversary, setAnniversary] = useState<string>('');
  const [editingAnn, setEditingAnn] = useState(false);
  const [annDraft, setAnnDraft] = useState('');

  useEffect(() => {
    track('Special Moments', 'opened');
    getSetting(ANNIVERSARY_KEY).then((s) => {
      if (s?.value) {
        setAnniversary(String(s.value));
        setAnnDraft(String(s.value));
      }
    });
    getSetting('nextDate').then((s) => {
      if (s?.value) {
        try {
          const parsed = JSON.parse(String(s.value));
          if (parsed.name && parsed.date) setNextDate(parsed);
        } catch { /* ignore */ }
      }
    });
  }, []);

  const saveAnniversary = async () => {
    if (!annDraft) return;
    await setSetting(ANNIVERSARY_KEY, annDraft);
    setAnniversary(annDraft);
    setEditingAnn(false);
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-28">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-300/20 border border-amber-200/30 flex items-center justify-center">
          <Sparkles size={22} className="text-amber-200" />
        </div>
        <div>
          <h1 className="text-3xl font-playfair font-semibold text-white leading-tight">
            Special Moments
          </h1>
          <p className="text-white/60 text-sm font-dm-sans">A timeline of what matters</p>
        </div>
      </motion.div>

      {/* Next Date Countdown */}
      {nextDate && <NextDateCountdown data={nextDate} />}

      {/* Anniversary hero */}
      {anniversary && !editingAnn ? (
        <AnniversaryHero date={anniversary} onEdit={() => setEditingAnn(true)} />
      ) : (
        <div className="glass-card p-5 mb-5 bg-gradient-to-br from-rose-300/15 to-violet-500/15 border-rose-200/20">
          <p className="text-white/70 text-xs uppercase tracking-widest">Anniversary</p>
          <p className="text-white/80 text-sm mt-1 mb-3">
            Set the day your story together began.
          </p>
          <div className="flex gap-2">
            <input
              type="date"
              value={annDraft}
              onChange={(e) => setAnnDraft(e.target.value)}
              className="flex-1"
            />
            <button
              onClick={saveAnniversary}
              className="px-4 rounded-xl bg-rose-400 hover:bg-rose-500 text-white text-sm font-medium"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          ['timeline', 'Timeline'],
          ['countdowns', 'Countdowns'],
          ['photos', 'Photos'],
          ['milestones', 'Milestones'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2 rounded-full text-sm font-medium border transition-all ${
              tab === id
                ? 'bg-violet-500/30 border-violet-400/60 text-white'
                : 'bg-white/5 border-white/10 text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'timeline' && <Timeline />}
          {tab === 'countdowns' && <Countdowns />}
          {tab === 'photos' && <Photos />}
          {tab === 'milestones' && <Milestones />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

function NextDateCountdown({ data }: { data: { name: string; date: string } }) {
  const [days, setDays] = useState(0);

  useEffect(() => {
    const calc = () => {
      const target = new Date(data.date);
      const now = new Date();
      target.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      setDays(Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    };
    calc();
    const t = setInterval(calc, 1000 * 60 * 60);
    return () => clearInterval(t);
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-3xl p-6 mb-5 bg-gradient-to-br from-rose-400/30 via-violet-500/30 to-rose-300/30 border border-white/15 backdrop-blur-xl shadow-[0_8px_40px_rgba(251,113,133,0.25)] overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-rose-300/30 blur-3xl" />
      <p className="text-white/70 text-xs uppercase tracking-widest">{days <= 0 ? 'Today is the day! 💜' : `${days} day${days === 1 ? '' : 's'} until`}</p>
      <p className="text-white font-playfair text-3xl mt-2">{data.name}</p>
    </motion.div>
  );
}

function AnniversaryHero({ date, onEdit }: { date: string; onEdit: () => void }) {
  const start = new Date(date);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLast = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLast;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return (
    <div className="relative rounded-3xl p-6 mb-5 bg-gradient-to-br from-rose-400/30 via-violet-500/30 to-violet-700/30 border border-white/15 backdrop-blur-xl shadow-[0_8px_40px_rgba(251,113,133,0.25)] overflow-hidden">
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-rose-300/30 blur-3xl" />
      <div className="flex items-center justify-between">
        <p className="text-white/70 text-xs uppercase tracking-widest">Together since</p>
        <button
          onClick={onEdit}
          className="text-white/60 text-xs underline underline-offset-2"
        >
          Edit
        </button>
      </div>
      <p className="text-white font-playfair text-3xl mt-2">
        {start.toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>
      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          ['Years', years],
          ['Months', months],
          ['Days', days],
        ].map(([label, n]) => (
          <div key={String(label)} className="text-center bg-white/10 rounded-2xl py-3">
            <p className="text-3xl font-playfair text-white">{n}</p>
            <p className="text-white/60 text-[10px] uppercase tracking-widest mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>
      <Heart size={18} className="text-rose-200 mt-5" fill="currentColor" />
    </div>
  );
}

/* ------------------------------- Timeline ------------------------------- */

function Timeline() {
  const [items, setItems] = useState<MomentType[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    emoji: '',
  });

  const refresh = async () => {
    const all = await getAllMoments();
    setItems(all.sort((a, b) => b.date.localeCompare(a.date)));
  };

  useEffect(() => {
    refresh();
     
  }, []);

  const save = async () => {
    if (!form.title.trim()) return;
    const m: MomentType = {
      id: crypto.randomUUID(),
      date: form.date,
      title: form.title.trim(),
      description: form.description.trim(),
      emoji: form.emoji.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await addMoment(m);
    setForm({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      emoji: '',
    });
    setOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    await deleteMoment(id);
    refresh();
  };

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-500/20 border border-violet-400/40 text-white"
      >
        <Plus size={16} /> Add a moment
      </button>

      {items.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <p className="text-white/60 italic">Your story is just beginning ✨</p>
        </div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-violet-400/60 via-rose-300/40 to-transparent" />
          {items.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative mb-4"
            >
              <div className="absolute -left-[18px] top-3 w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.7)]" />
              <div className="glass-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-xs">
                      {new Date(m.date).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-white font-medium mt-1">
                      {m.emoji && <span className="mr-2">{m.emoji}</span>}
                      {m.title}
                    </p>
                    {m.description && (
                      <p className="text-white/70 text-sm mt-1 whitespace-pre-wrap">
                        {m.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(m.id)}
                    className="p-2 text-white/40 hover:text-rose-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <BottomSheet onClose={() => setOpen(false)} title="New moment">
            <div className="space-y-3">
              <input
                placeholder="Title (e.g. Our first trip)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="col-span-2"
                />
                <input
                  placeholder="✨"
                  maxLength={2}
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className="text-center text-xl"
                />
              </div>
              <textarea
                rows={4}
                placeholder="What made it special?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none"
              />
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

/* ------------------------------- Countdowns ----------------------------- */

function Countdowns() {
  const [items, setItems] = useState<Countdown[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', targetDate: '' });

  const refresh = async () => {
    const all = await getAllCountdowns();
    setItems(all.sort((a, b) => a.targetDate.localeCompare(b.targetDate)));
  };

  useEffect(() => {
    refresh();
     
  }, []);

  const save = async () => {
    if (!form.name.trim() || !form.targetDate) return;
    await addCountdown({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      targetDate: form.targetDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setForm({ name: '', targetDate: '' });
    setOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    await deleteCountdown(id);
    refresh();
  };

  const daysUntil = (d: string) => {
    const target = new Date(d);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-500/20 border border-violet-400/40 text-white"
      >
        <Plus size={16} /> Add countdown
      </button>

      {items.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <p className="text-white/60 italic">Nothing to count down to — yet ✨</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((c) => {
            const days = daysUntil(c.targetDate);
            const past = days < 0;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl p-4 bg-gradient-to-br from-violet-500/30 to-rose-300/20 border border-white/15 backdrop-blur-xl"
              >
                <button
                  onClick={() => remove(c.id)}
                  className="absolute top-2 right-2 p-1 text-white/40 hover:text-rose-300"
                >
                  <Trash2 size={12} />
                </button>
                <Calendar size={16} className="text-violet-300 mb-2" />
                <p className="text-white font-medium text-sm truncate pr-4">{c.name}</p>
                <p className="text-white/50 text-[10px] mt-1">
                  {new Date(c.targetDate).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="mt-3 font-playfair text-3xl text-white">
                  {past ? Math.abs(days) : days}
                </p>
                <p className="text-white/60 text-xs">
                  {past ? 'days ago' : days === 0 ? 'today!' : 'days to go'}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <BottomSheet onClose={() => setOpen(false)} title="New countdown">
            <div className="space-y-3">
              <input
                placeholder="What's the occasion?"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full"
              />
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full"
              />
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

/* --------------------------------- Photos -------------------------------- */

function Photos() {
  const [items, setItems] = useState<Photo[]>([]);
  const [active, setActive] = useState<Photo | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ caption: '', date: new Date().toISOString().split('T')[0], data: '' });

  const refresh = async () => {
    const all = await getAllPhotos();
    setItems(all.sort((a, b) => b.date.localeCompare(a.date)));
  };

  useEffect(() => {
    refresh();
     
  }, []);

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, data: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.data) return;
    await addPhoto({
      id: crypto.randomUUID(),
      data: form.data,
      caption: form.caption.trim(),
      date: form.date,
      createdAt: new Date().toISOString(),
    });
    setForm({ caption: '', date: new Date().toISOString().split('T')[0], data: '' });
    setAdding(false);
    refresh();
  };

  const remove = async (id: string) => {
    await deletePhoto(id);
    setActive(null);
    refresh();
  };

  return (
    <div>
      <button
        onClick={() => setAdding(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-500/20 border border-violet-400/40 text-white"
      >
        <Plus size={16} /> Add a memory
      </button>

      {items.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <ImageIcon size={28} className="text-white/40 mx-auto mb-2" />
          <p className="text-white/60 italic">Add a memory worth keeping 💜</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p)}
              className="relative rounded-2xl overflow-hidden border border-white/10 aspect-square"
            >
              <img src={p.data} alt={p.caption} className="w-full h-full object-cover" />
              {p.caption && (
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-xs truncate">{p.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {adding && (
          <BottomSheet onClose={() => setAdding(false)} title="Add memory">
            <div className="space-y-3">
              <label className="block">
                <span className="text-white/70 text-xs uppercase tracking-wider">Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && onFile(e.target.files[0])}
                  className="mt-1 w-full text-white/70 text-sm"
                />
              </label>
              {form.data && (
                <img
                  src={form.data}
                  alt=""
                  className="w-full h-48 object-cover rounded-xl"
                />
              )}
              <input
                placeholder="Caption (optional)"
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                className="w-full"
              />
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full"
              />
              <button
                onClick={save}
                disabled={!form.data}
                className="w-full py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </BottomSheet>
        )}

        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full"
            >
              <button
                onClick={() => setActive(null)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white z-10"
              >
                <X size={16} />
              </button>
              <img
                src={active.data}
                alt={active.caption}
                className="w-full rounded-2xl"
              />
              {active.caption && (
                <p className="text-white text-center mt-3 italic font-playfair">
                  {active.caption}
                </p>
              )}
              <p className="text-white/50 text-xs text-center mt-1">
                {new Date(active.date).toLocaleDateString()}
              </p>
              <button
                onClick={() => remove(active.id)}
                className="w-full mt-4 py-2 rounded-xl bg-rose-500/20 border border-rose-300/30 text-rose-200 text-sm"
              >
                Delete photo
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- Milestones ----------------------------- */

function Milestones() {
  const [items, setItems] = useState<Milestone[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], description: '', emoji: '' });

  const refresh = async () => {
    const all = await getAllMilestones();
    setItems(all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  useEffect(() => {
    refresh();
     
  }, []);

  const save = async () => {
    if (!form.title.trim()) return;
    const m: Milestone = {
      id: crypto.randomUUID(),
      date: form.date,
      title: form.title.trim(),
      description: form.description.trim(),
      emoji: form.emoji.trim() || '💜',
      addedBy: 'violet',
      createdAt: new Date().toISOString(),
    };
    await addMilestone(m);
    setForm({ title: '', date: new Date().toISOString().split('T')[0], description: '', emoji: '' });
    setOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    await deleteMilestone(id);
    refresh();
  };

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-500/20 border border-violet-400/40 text-white"
      >
        <Plus size={16} /> Add milestone
      </button>

      {items.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <p className="text-white/60 italic">Your journey together is just beginning 💜</p>
        </div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-violet-400/60 via-rose-300/40 to-transparent" />
          {items.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`relative mb-4 ${i % 2 === 0 ? '' : 'ml-4'}`}
            >
              <div className="absolute -left-[18px] top-3 w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.7)]" />
              <div className="glass-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-lg">{m.emoji}</span>
                      {m.addedBy === 'admin' ? (
                        <span className="text-[10px] text-rose-300">💜</span>
                      ) : (
                        <span className="text-[10px] text-violet-300">✨</span>
                      )}
                    </div>
                    <p className="text-white/50 text-xs">
                      {new Date(m.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-white font-medium mt-1">{m.title}</p>
                    {m.description && <p className="text-white/70 text-sm mt-1">{m.description}</p>}
                  </div>
                  <button onClick={() => remove(m.id)} className="p-2 text-white/40 hover:text-rose-300">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <BottomSheet onClose={() => setOpen(false)} title="New milestone">
            <div className="space-y-3">
              <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full" />
              <div className="grid grid-cols-3 gap-3">
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="col-span-2" />
                <input placeholder="💜" maxLength={2} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="text-center text-xl" />
              </div>
              <textarea rows={3} placeholder="What made it special?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full resize-none" />
              <button onClick={save} className="w-full py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-medium">Save</button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- BottomSheet ------------------------------ */

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
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
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

export default Moments;
