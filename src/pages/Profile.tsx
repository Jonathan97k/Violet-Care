import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Heart, Trash2, Info } from 'lucide-react';
import { track } from '../utils/track';
import { getSetting, setSetting, clearAllData } from '../utils/db';

const NOTIF_KEYS = [
  ['shiftReminders', 'Shift reminders'],
  ['medicationReminders', 'Medication reminders'],
  ['hydrationNudges', 'Hydration nudges'],
  ['dailyEncouragement', 'Daily encouragement'],
  ['wellnessCheckIn', 'Wellness check-in'],
] as const;

const Profile = () => {
  const [name, setName] = useState('Violet');
  const [photo, setPhoto] = useState<string>('');
  const [anniversary, setAnniversary] = useState('');
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    track('Profile', 'opened');
    (async () => {
      const n = await getSetting('profile.name');
      if (n?.value) setName(String(n.value));
      const p = await getSetting('profile.photo');
      if (p?.value) setPhoto(String(p.value));
      const a = await getSetting('app.anniversary');
      if (a?.value) setAnniversary(String(a.value));
      const next: Record<string, boolean> = {};
      for (const [key] of NOTIF_KEYS) {
        const r = await getSetting(`notif.${key}`);
        next[key] = r?.value === undefined ? true : Boolean(r.value);
      }
      setPrefs(next);
    })();
  }, []);

  const saveName = async () => {
    await setSetting('profile.name', name);
  };

  const onPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const data = String(reader.result);
      setPhoto(data);
      await setSetting('profile.photo', data);
    };
    reader.readAsDataURL(file);
  };

  const togglePref = async (key: string) => {
    const next = !prefs[key];
    setPrefs({ ...prefs, [key]: next });
    await setSetting(`notif.${key}`, next);
    if (next && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const saveAnniversary = async (v: string) => {
    setAnniversary(v);
    await setSetting('app.anniversary', v);
  };

  const doClear = async () => {
    await clearAllData();
    setConfirmClear(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-28">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
          <User size={22} className="text-violet-300" />
        </div>
        <div>
          <h1 className="text-3xl font-playfair font-semibold text-white leading-tight">
            Profile
          </h1>
          <p className="text-white/60 text-sm font-dm-sans">Make this app feel like yours</p>
        </div>
      </motion.div>

      {/* Profile card */}
      <div className="glass-card p-5 mb-5">
        <div className="flex items-center gap-4">
          <label className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-violet-400/50 cursor-pointer flex items-center justify-center bg-violet-500/20">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-violet-200" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && onPhoto(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
          <div className="flex-1">
            <p className="text-white/60 text-xs uppercase tracking-widest">Name</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              className="w-full mt-1 bg-transparent border-0 px-0 text-2xl font-playfair text-white"
            />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1 flex items-center gap-1">
            <Heart size={12} /> Anniversary
          </p>
          <input
            type="date"
            value={anniversary}
            onChange={(e) => saveAnniversary(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-5 mb-5">
        <p className="text-white/70 text-xs uppercase tracking-widest mb-4 flex items-center gap-1">
          <Bell size={12} /> Notifications
        </p>
        <div className="space-y-3">
          {NOTIF_KEYS.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between">
              <span className="text-white text-sm">{label}</span>
              <button
                onClick={() => togglePref(key)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  prefs[key] ? 'bg-violet-500' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                    prefs[key] ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Danger */}
      <div className="glass-card p-5 mb-5 border-rose-300/20">
        <p className="text-white/70 text-xs uppercase tracking-widest mb-3">Data</p>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/15 border border-rose-300/30 text-rose-200"
          >
            <Trash2 size={16} /> Clear all data
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-white/80 text-sm">
              This will permanently delete every shift, note, photo and entry.
              Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/15 text-white"
              >
                Cancel
              </button>
              <button
                onClick={doClear}
                className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-medium"
              >
                Yes, delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div className="glass-card p-5 text-center">
        <Info size={16} className="text-violet-300 mx-auto mb-2" />
        <p className="text-white/80 text-sm">
          Made with <span className="text-rose-300">💜</span> just for Violet
        </p>
        <p className="text-white/40 text-xs mt-1">VioletCare · v0.1.0</p>
      </div>
    </div>
  );
};

export default Profile;
