import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Key,
  Image as ImageIcon,
  BarChart3,
  Wrench,
  Trash2,
  Plus,
  Upload,
  Download,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Save,
  Mail,
  Calendar,
  Bell,
  Shield,
  Users,
} from 'lucide-react';
import {
  getAllPhotos, deletePhoto, addPhoto, getQueuedUsageEvents, getSetting, setSetting,
  getAllLetters, addLetter, deleteLetter,
  getAllMonthlyLetters, addMonthlyLetter, deleteMonthlyLetter,
  getAllPings, addPing, deletePing,
  getAllLostModeData, addLostModeData, deleteLostModeData,
} from '../utils/db';
import type { Photo, UsageEvent, Letter, MonthlyLetter, Ping, LostModeData } from '../types';
import {
  isAdminSession,
  clearAdminSession,
  resetVioletPIN,
  changeAdminPIN,
  exportAllData,
  importAllData,
  getSessionExpiry,
} from '../utils/adminAuth';
import { flushQueuedEvents } from '../utils/track';

const ADMIN_SHEET_URL_KEY = 'admin.sheetUrl';

const Admin = () => {
  const navigate = useNavigate();
  const [expiryMs, setExpiryMs] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdminSession()) {
      navigate('/admin-login');
      return;
    }

    const updateExpiry = () => {
      const expiry = getSessionExpiry();
      if (!expiry) {
        clearAdminSession();
        navigate('/admin-login');
        return;
      }
      const remaining = expiry - Date.now();
      if (remaining <= 0) {
        clearAdminSession();
        navigate('/admin-login');
        return;
      }
      setExpiryMs(remaining);
    };

    updateExpiry();
    const interval = setInterval(updateExpiry, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [navigate]);

  const handleExit = () => {
    clearAdminSession();
    navigate('/auth');
  };

  const formatSessionTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isSessionExpiringSoon = expiryMs && expiryMs < 5 * 60 * 1000; // Less than 5 minutes

  return (
    <div className="min-h-screen px-4 pt-8 pb-28">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-playfair font-semibold text-white">VioletCare Admin</h1>
          <p className="text-white/50 text-xs font-dm-sans mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
          {expiryMs && (
            <p className={`${isSessionExpiringSoon ? 'text-amber-400' : 'text-violet-300'} text-xs font-dm-sans mt-0.5 flex items-center gap-1`}>
              <Shield size={10} /> Session expires in {formatSessionTime(expiryMs)}
            </p>
          )}
        </div>
        <button
          onClick={handleExit}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm flex items-center gap-1 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={14} /> Exit Admin
        </button>
      </motion.div>

      <div className="space-y-5">
        <UserManagementLink />
        <PinManagement />
        <LostModePanel />
        <LetterManager />
        <MonthlyLetterManager />
        <PingManager />
        <PhotoGallery />
        <UsageAnalytics />
        <Maintenance />
      </div>
    </div>
  );
};

/* ========================= USER MANAGEMENT LINK ========================= */

function UserManagementLink() {
  const navigate = useNavigate();

  return (
    <section className="glass-card p-5 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-400/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-violet-500/20 border border-violet-400/40 rounded-xl flex items-center justify-center">
            <Users size={24} className="text-violet-300" />
          </div>
          <div>
            <h2 className="text-white font-playfair text-lg">User Management</h2>
            <p className="text-white/60 text-xs font-dm-sans mt-0.5">
              Manage all app users and their access
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/users')}
          className="px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-violet-500/30"
        >
          <Users size={16} />
          View Users
        </button>
      </div>
    </section>
  );
}

/* ========================= PIN MANAGEMENT ========================= */

function PinManagement() {
  const [showReset, setShowReset] = useState(false);
  const [showAdminChange, setShowAdminChange] = useState(false);
  const [newPin1, setNewPin1] = useState('');
  const [newPin2, setNewPin2] = useState('');
  const [currentAdminPin, setCurrentAdminPin] = useState('');
  const [message, setMessage] = useState('');

  const resetViolet = async () => {
    if (newPin1.length !== 6 || newPin1 !== newPin2) {
      setMessage('PINs must match and be 6 digits');
      return;
    }
    await resetVioletPIN(newPin1);
    setMessage('PIN updated successfully 💜');
    setNewPin1('');
    setNewPin2('');
    setTimeout(() => setShowReset(false), 800);
  };

  const changeAdmin = async () => {
    if (newPin1.length !== 6 || newPin1 !== newPin2) {
      setMessage('New PINs must match and be 6 digits');
      return;
    }
    const ok = await changeAdminPIN(currentAdminPin, newPin1);
    if (ok) {
      setMessage('Admin PIN changed successfully');
      setCurrentAdminPin('');
      setNewPin1('');
      setNewPin2('');
      setTimeout(() => setShowAdminChange(false), 800);
    } else {
      setMessage('Current admin PIN is incorrect');
    }
  };

  const closeModal = () => {
    setShowReset(false);
    setShowAdminChange(false);
    setNewPin1('');
    setNewPin2('');
    setCurrentAdminPin('');
    setMessage('');
  };

  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Key size={18} className="text-violet-300" />
        <h2 className="text-white font-playfair text-lg">Violet's PIN</h2>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => { setShowReset(true); setMessage(''); }}
          className="px-4 py-2.5 rounded-xl bg-violet-500/20 border border-violet-400/40 text-white text-sm flex items-center gap-2 hover:bg-violet-500/30 transition-colors"
        >
          <RefreshCw size={14} /> Reset Violet's PIN
        </button>
        <button
          onClick={() => { setShowAdminChange(true); setMessage(''); }}
          className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm flex items-center gap-2 hover:bg-white/20 transition-colors"
        >
          <Key size={14} /> Change Admin PIN
        </button>
      </div>

      <AnimatePresence>
        {(showReset || showAdminChange) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              {showAdminChange && (
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Current admin PIN"
                  value={currentAdminPin}
                  onChange={(e) => setCurrentAdminPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full"
                />
              )}
              <input
                type="password"
                maxLength={6}
                placeholder="New 6-digit PIN"
                value={newPin1}
                onChange={(e) => setNewPin1(e.target.value.replace(/\D/g, ''))}
                className="w-full"
              />
              <input
                type="password"
                maxLength={6}
                placeholder="Confirm new PIN"
                value={newPin2}
                onChange={(e) => setNewPin2(e.target.value.replace(/\D/g, ''))}
                className="w-full"
              />
              {message && (
                <p className={`text-sm font-dm-sans ${message.includes('success') ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {message}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={showReset ? resetViolet : changeAdmin}
                  className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ========================= PHOTO GALLERY ========================= */

function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ caption: '', date: new Date().toISOString().split('T')[0], data: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const all = await getAllPhotos();
    setPhotos(all.sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, data: String(reader.result) }));
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
    setConfirmDelete(null);
    refresh();
  };

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-violet-300" />
          <h2 className="text-white font-playfair text-lg">Memory Photos</h2>
        </div>
        <span className="text-white/50 text-xs font-dm-sans">{photos.length} memories saved</span>
      </div>

      <button
        onClick={() => setAdding(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/20 border border-violet-400/40 text-white text-sm hover:bg-violet-500/30 transition-colors"
      >
        <Plus size={14} /> Add Photo
      </button>

      {photos.length === 0 ? (
        <div className="text-center p-6">
          <p className="text-white/60 italic text-sm">No photos yet 💜</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative rounded-xl overflow-hidden border border-white/10 aspect-square group">
              <img src={p.data} alt={p.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                {p.caption && <p className="text-white text-[10px] text-center truncate w-full">{p.caption}</p>}
                <p className="text-white/60 text-[10px]">{new Date(p.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                <button
                  onClick={() => setConfirmDelete(p.id)}
                  className="mt-1 p-1 text-rose-300 hover:text-rose-200"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && onFile(e.target.files[0])}
                className="w-full text-white/70 text-sm"
              />
              {form.data && (
                <img src={form.data} alt="" className="w-full h-32 object-cover rounded-xl" />
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
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={!form.data}
                  className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setAdding(false); setForm({ caption: '', date: new Date().toISOString().split('T')[0], data: '' }); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm p-5 rounded-2xl bg-[#1a0533] border border-white/15"
            >
              <p className="text-white text-sm mb-1">Remove this memory?</p>
              <p className="text-white/50 text-xs mb-4">This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => remove(confirmDelete)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ========================= USAGE ANALYTICS ========================= */

function UsageAnalytics() {
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [sheetUrl, setSheetUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');

  useEffect(() => {
    (async () => {
      const all = await getQueuedUsageEvents();
      setEvents(all);
      const urlSetting = await getSetting(ADMIN_SHEET_URL_KEY);
      if (urlSetting?.value) {
        setSheetUrl(String(urlSetting.value));
        setSavedUrl(String(urlSetting.value));
      }
    })();
  }, []);

  const summary = (() => {
    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.feature] = (counts[e.feature] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { counts, sorted, total: events.length, mostUsed: sorted[0]?.[0] || '—' };
  })();

  const lastActive = events.length > 0
    ? new Date(events[events.length - 1].timestamp).toLocaleString()
    : '—';

  const saveUrl = async () => {
    await setSetting(ADMIN_SHEET_URL_KEY, sheetUrl);
    setSavedUrl(sheetUrl);
  };

  const openSheet = () => {
    if (savedUrl) window.open(savedUrl, '_blank');
  };

  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-violet-300" />
        <h2 className="text-white font-playfair text-lg">App Usage</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/50 text-[10px] uppercase tracking-wider">Most used</p>
          <p className="text-white font-medium text-sm mt-1">{summary.mostUsed}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/50 text-[10px] uppercase tracking-wider">Total events</p>
          <p className="text-white font-medium text-sm mt-1">{summary.total}</p>
        </div>
        <div className="col-span-2 p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/50 text-[10px] uppercase tracking-wider">Last active</p>
          <p className="text-white font-medium text-sm mt-1">{lastActive}</p>
        </div>
      </div>

      {summary.sorted.length > 0 && (
        <div className="mb-4">
          <p className="text-white/70 text-xs uppercase tracking-widest mb-2">Top features</p>
          <div className="space-y-1.5">
            {summary.sorted.slice(0, 5).map(([feature, count]) => (
              <div key={feature} className="flex items-center justify-between text-sm">
                <span className="text-white/80">{feature}</span>
                <span className="text-white/50 text-xs">{count} {count === 1 ? 'event' : 'events'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          placeholder="Google Sheet URL"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          className="flex-1 text-sm"
        />
        <button onClick={saveUrl} className="p-2 rounded-xl bg-violet-500/20 border border-violet-400/40 text-white hover:bg-violet-500/30 transition-colors">
          <Save size={16} />
        </button>
        <button
          onClick={openSheet}
          disabled={!savedUrl}
          className="p-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-40 transition-colors"
        >
          <ExternalLink size={16} />
        </button>
      </div>
    </section>
  );
}

/* ========================= MAINTENANCE ========================= */

function Maintenance() {
  const [syncMsg, setSyncMsg] = useState('');
  const [version] = useState('0.1.0');
  const [confirmImport, setConfirmImport] = useState(false);
  const [importData, setImportData] = useState<Record<string, unknown[]> | null>(null);

  const handleSync = async () => {
    setSyncMsg('Syncing...');
    try {
      await flushQueuedEvents();
      const remaining = await getQueuedUsageEvents();
      const synced = remaining.length === 0 ? 'All events synced 💜' : `${remaining.length} events remain`;
      setSyncMsg(synced);
    } catch {
      setSyncMsg('Sync failed');
    }
  };

  const handleClearCache = () => {
    if (!window.confirm('This will reload the app. Continue?')) return;
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) caches.delete(name);
      });
    }
    window.location.reload();
  };

  const handleExport = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violetcare-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        setImportData(data);
        setConfirmImport(true);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    if (!importData) return;
    await importAllData(importData);
    setConfirmImport(false);
    setImportData(null);
    alert('Data imported successfully. Reloading...');
    window.location.reload();
  };

  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wrench size={18} className="text-violet-300" />
        <h2 className="text-white font-playfair text-lg">Maintenance</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleSync}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-violet-500/20 border border-violet-400/40 text-white text-sm hover:bg-violet-500/30 transition-colors"
        >
          <RefreshCw size={18} />
          <span>Force Sync</span>
        </button>
        <button
          onClick={handleClearCache}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
        >
          <Trash2 size={18} />
          <span>Clear Cache</span>
        </button>
        <button
          onClick={handleExport}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
        >
          <Download size={18} />
          <span>Export Data</span>
        </button>
        <label className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors cursor-pointer">
          <Upload size={18} />
          <span>Import Data</span>
          <input
            type="file"
            accept=".json"
            onChange={(e) => e.target.files && onImportFile(e.target.files[0])}
            className="hidden"
          />
        </label>
      </div>

      {syncMsg && (
        <p className="mt-3 text-center text-sm text-violet-200 font-dm-sans">{syncMsg}</p>
      )}

      <div className="mt-4 pt-4 border-t border-white/10 text-center">
        <p className="text-white/40 text-xs">VioletCare · v{version}</p>
      </div>

      <AnimatePresence>
        {confirmImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm p-5 rounded-2xl bg-[#1a0533] border border-white/15"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-amber-300" />
                <p className="text-white font-medium text-sm">Overwrite all data?</p>
              </div>
              <p className="text-white/50 text-xs mb-4">This will replace every shift, note, photo and entry with the imported backup.</p>
              <div className="flex gap-2">
                <button
                  onClick={doImport}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
                >
                  Yes, overwrite
                </button>
                <button
                  onClick={() => { setConfirmImport(false); setImportData(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ========================= LOST MODE PANEL ========================= */

function LostModePanel() {
  const [contacts, setContacts] = useState<LostModeData[]>([]);
  const [form, setForm] = useState({ key: '', value: '' });
  const [adding, setAdding] = useState(false);

  const refresh = async () => {
    const all = await getAllLostModeData();
    setContacts(all);
  };

  useEffect(() => {
    refresh();
     
  }, []);

  const save = async () => {
    if (!form.key || !form.value) return;
    await addLostModeData({ key: form.key, value: form.value });
    setForm({ key: '', value: '' });
    setAdding(false);
    refresh();
  };

  const remove = async (key: string) => {
    await deleteLostModeData(key);
    refresh();
  };

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-violet-300" />
          <h2 className="text-white font-playfair text-lg">Lost Mode Contacts</h2>
        </div>
        <span className="text-white/50 text-xs font-dm-sans">{contacts.length} entries</span>
      </div>

      <div className="space-y-2 mb-3">
        {contacts.map((c) => (
          <div key={c.key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-white text-sm font-medium">{c.key}</p>
              <p className="text-white/60 text-xs">{c.value}</p>
            </div>
            <button onClick={() => remove(c.key)} className="p-1.5 text-rose-300 hover:text-rose-200">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setAdding(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/20 border border-violet-400/40 text-white text-sm hover:bg-violet-500/30 transition-colors"
      >
        <Plus size={14} /> Add Contact
      </button>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <input placeholder="Label (e.g. Home)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className="w-full" />
              <input placeholder="Phone or email" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full" />
              <div className="flex gap-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors">Save</button>
                <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ========================= LETTER MANAGER ========================= */

function LetterManager() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [form, setForm] = useState({ title: '', content: '', unlockDate: '' });
  const [adding, setAdding] = useState(false);

  const refresh = async () => {
    const all = await getAllLetters();
    setLetters(all.sort((a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime()));
  };

  useEffect(() => {
    refresh();
     
  }, []);

  const save = async () => {
    if (!form.title || !form.content || !form.unlockDate) return;
    await addLetter({
      id: crypto.randomUUID(),
      title: form.title,
      content: form.content,
      unlockDate: form.unlockDate,
      isRevealed: false,
    });
    setForm({ title: '', content: '', unlockDate: '' });
    setAdding(false);
    refresh();
  };

  const remove = async (id: string) => {
    await deleteLetter(id);
    refresh();
  };

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-violet-300" />
          <h2 className="text-white font-playfair text-lg">Letters</h2>
        </div>
        <span className="text-white/50 text-xs font-dm-sans">{letters.length} letters</span>
      </div>

      <div className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
        {letters.map((l) => (
          <div key={l.id} className="flex items-start justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-white text-sm font-medium">{l.title}</p>
              <p className="text-white/60 text-xs">Unlocks {new Date(l.unlockDate).toLocaleDateString()}</p>
              {l.isRevealed && <span className="text-rose-300 text-[10px]">💜 Read</span>}
            </div>
            <button onClick={() => remove(l.id)} className="p-1.5 text-rose-300 hover:text-rose-200 mt-0.5">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setAdding(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/20 border border-violet-400/40 text-white text-sm hover:bg-violet-500/30 transition-colors"
      >
        <Plus size={14} /> Add Letter
      </button>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full" />
              <textarea placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full h-24 bg-white/5 border border-white/15 rounded-xl p-3 text-white text-sm resize-none" />
              <div>
                <p className="text-white/60 text-xs mb-1">Unlock date</p>
                <input type="date" value={form.unlockDate} onChange={(e) => setForm({ ...form, unlockDate: e.target.value })} className="w-full" />
              </div>
              <div className="flex gap-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors">Save</button>
                <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ========================= MONTHLY LETTER MANAGER ========================= */

function MonthlyLetterManager() {
  const [letters, setLetters] = useState<MonthlyLetter[]>([]);
  const [form, setForm] = useState({ content: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [adding, setAdding] = useState(false);

  const refresh = async () => {
    const all = await getAllMonthlyLetters();
    setLetters(all.sort((a, b) => b.year - a.year || b.month - a.month));
  };

  useEffect(() => {
    refresh();
     
  }, []);

  const save = async () => {
    if (!form.content) return;
    await addMonthlyLetter({
      id: crypto.randomUUID(),
      month: Number(form.month),
      year: Number(form.year),
      content: form.content,
      isRead: false,
    });
    setForm({ content: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    setAdding(false);
    refresh();
  };

  const remove = async (id: string) => {
    await deleteMonthlyLetter(id);
    refresh();
  };

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-violet-300" />
          <h2 className="text-white font-playfair text-lg">Monthly Letters</h2>
        </div>
        <span className="text-white/50 text-xs font-dm-sans">{letters.length} entries</span>
      </div>

      <div className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
        {letters.map((l) => (
          <div key={l.id} className="flex items-start justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-white text-sm font-medium">{new Date(l.year, l.month - 1).toLocaleString('en-US', { month: 'long' })} {l.year}</p>
              <p className="text-white/60 text-xs line-clamp-2">{l.content}</p>
            </div>
            <button onClick={() => remove(l.id)} className="p-1.5 text-rose-300 hover:text-rose-200 mt-0.5">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setAdding(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/20 border border-violet-400/40 text-white text-sm hover:bg-violet-500/30 transition-colors"
      >
        <Plus size={14} /> Add Monthly Letter
      </button>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex gap-2">
                <select
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl p-2 text-white text-sm"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl p-2 text-white text-sm"
                />
              </div>
              <textarea placeholder="Write the monthly letter..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full h-24 bg-white/5 border border-white/15 rounded-xl p-3 text-white text-sm resize-none" />
              <div className="flex gap-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors">Save</button>
                <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ========================= PING MANAGER ========================= */

function PingManager() {
  const [pings, setPings] = useState<Ping[]>([]);
  const [form, setForm] = useState({ message: '' });
  const [adding, setAdding] = useState(false);

  const refresh = async () => {
    const all = await getAllPings();
    setPings(all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  useEffect(() => {
    refresh();
     
  }, []);

  const save = async () => {
    if (!form.message) return;
    await addPing({
      id: crypto.randomUUID(),
      message: form.message,
      seen: false,
      timestamp: new Date().toISOString(),
    });
    setForm({ message: '' });
    setAdding(false);
    refresh();
  };

  const remove = async (id: string) => {
    await deletePing(id);
    refresh();
  };

  return (
    <section className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-violet-300" />
          <h2 className="text-white font-playfair text-lg">Thinking of You Pings</h2>
        </div>
        <span className="text-white/50 text-xs font-dm-sans">{pings.length} pings</span>
      </div>

      <div className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
        {pings.map((p) => (
          <div key={p.id} className="flex items-start justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-white text-sm">{p.message}</p>
              <p className="text-white/40 text-[10px]">{new Date(p.timestamp).toLocaleDateString()}</p>
            </div>
            <button onClick={() => remove(p.id)} className="p-1.5 text-rose-300 hover:text-rose-200 mt-0.5">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setAdding(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/20 border border-violet-400/40 text-white text-sm hover:bg-violet-500/30 transition-colors"
      >
        <Plus size={14} /> Send Ping
      </button>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <textarea placeholder="Write a sweet ping..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full h-20 bg-white/5 border border-white/15 rounded-xl p-3 text-white text-sm resize-none" />
              <div className="flex gap-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors">Send</button>
                <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default Admin;
