import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type {
  Shift,
  Note,
  Medication,
  HydrationEntry,
  MoodEntry,
  SleepEntry,
  JournalEntry,
  Moment,
  Photo,
  Countdown,
  UsageEvent,
  Settings,
  AuthData,
  StressEntry,
  PatientNote,
  ClinicalReference,
  Letter,
  MonthlyLetter,
  Milestone,
  Ping,
  LostModeData,
} from '../types';

// Simple obfuscation for sensitive text fields
// Not cryptographic — just prevents casual reading
function obfuscate(text: string): string {
  return btoa(
    encodeURIComponent(text)
      .split('')
      .map((c, i) => String.fromCharCode(
        c.charCodeAt(0) ^ (7 + (i % 13))
      ))
      .join('')
  );
}

function deobfuscate(encoded: string): string {
  return decodeURIComponent(
    atob(encoded)
      .split('')
      .map((c, i) => String.fromCharCode(
        c.charCodeAt(0) ^ (7 + (i % 13))
      ))
      .join('')
  );
}

interface VioletCareDB extends DBSchema {
  shifts: {
    key: string;
    value: Shift;
    indexes: { 'by-date': string };
  };
  notes: {
    key: string;
    value: Note;
    indexes: { 'by-category': string; 'by-pinned': string };
  };
  medications: {
    key: string;
    value: Medication;
    indexes: { 'by-active': string };
  };
  hydration: {
    key: string;
    value: HydrationEntry;
  };
  mood: {
    key: string;
    value: MoodEntry;
  };
  sleep: {
    key: string;
    value: SleepEntry;
  };
  journal: {
    key: string;
    value: JournalEntry;
  };
  moments: {
    key: string;
    value: Moment;
    indexes: { 'by-date': string };
  };
  photos: {
    key: string;
    value: Photo;
    indexes: { 'by-date': string };
  };
  countdowns: {
    key: string;
    value: Countdown;
  };
  usage_queue: {
    key: number;
    value: UsageEvent;
    autoIncrement: true;
  };
  settings: {
    key: string;
    value: Settings;
  };
  auth: {
    key: string;
    value: AuthData;
  };
  stress: {
    key: string;
    value: StressEntry;
  };
  patient_notes: {
    key: string;
    value: PatientNote;
  };
  clinical_references: {
    key: string;
    value: ClinicalReference;
    indexes: { 'by-category': string };
  };
  letters: {
    key: string;
    value: Letter;
  };
  monthlyLetters: {
    key: string;
    value: MonthlyLetter;
  };
  milestones: {
    key: string;
    value: Milestone;
  };
  pings: {
    key: string;
    value: Ping;
  };
  lostModeData: {
    key: string;
    value: LostModeData;
  };
}

let db: IDBPDatabase<VioletCareDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<VioletCareDB>> {
  if (db) return db;

  db = await openDB<VioletCareDB>('violetcare', 2, {
    upgrade(db) {
      // Shifts store
      if (!db.objectStoreNames.contains('shifts')) {
        const shiftStore = db.createObjectStore('shifts', { keyPath: 'id' });
        shiftStore.createIndex('by-date', 'date');
      }

      // Notes store
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('by-category', 'category');
        noteStore.createIndex('by-pinned', 'isPinned');
      }

      // Medications store
      if (!db.objectStoreNames.contains('medications')) {
        const medStore = db.createObjectStore('medications', { keyPath: 'id' });
        medStore.createIndex('by-active', 'isActive');
      }

      // Hydration store
      if (!db.objectStoreNames.contains('hydration')) {
        db.createObjectStore('hydration', { keyPath: 'date' });
      }

      // Mood store
      if (!db.objectStoreNames.contains('mood')) {
        db.createObjectStore('mood', { keyPath: 'date' });
      }

      // Sleep store
      if (!db.objectStoreNames.contains('sleep')) {
        db.createObjectStore('sleep', { keyPath: 'date' });
      }

      // Journal store
      if (!db.objectStoreNames.contains('journal')) {
        db.createObjectStore('journal', { keyPath: 'date' });
      }

      // Moments store
      if (!db.objectStoreNames.contains('moments')) {
        const momentStore = db.createObjectStore('moments', { keyPath: 'id' });
        momentStore.createIndex('by-date', 'date');
      }

      // Photos store
      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('by-date', 'date');
      }

      // Countdowns store
      if (!db.objectStoreNames.contains('countdowns')) {
        db.createObjectStore('countdowns', { keyPath: 'id' });
      }

      // Usage queue store
      if (!db.objectStoreNames.contains('usage_queue')) {
        db.createObjectStore('usage_queue', { keyPath: 'id', autoIncrement: true });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Auth store
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth', { keyPath: 'key' });
      }

      // Stress store
      if (!db.objectStoreNames.contains('stress')) {
        db.createObjectStore('stress', { keyPath: 'date' });
      }

      // Patient notes store
      if (!db.objectStoreNames.contains('patient_notes')) {
        db.createObjectStore('patient_notes', { keyPath: 'id' });
      }

      // Clinical references store
      if (!db.objectStoreNames.contains('clinical_references')) {
        const refStore = db.createObjectStore('clinical_references', { keyPath: 'id' });
        refStore.createIndex('by-category', 'category');
      }

      // Letters store
      if (!db.objectStoreNames.contains('letters')) {
        db.createObjectStore('letters', { keyPath: 'id' });
      }

      // Monthly letters store
      if (!db.objectStoreNames.contains('monthlyLetters')) {
        db.createObjectStore('monthlyLetters', { keyPath: 'id' });
      }

      // Milestones store
      if (!db.objectStoreNames.contains('milestones')) {
        db.createObjectStore('milestones', { keyPath: 'id' });
      }

      // Pings store
      if (!db.objectStoreNames.contains('pings')) {
        db.createObjectStore('pings', { keyPath: 'id' });
      }

      // Lost mode data store
      if (!db.objectStoreNames.contains('lostModeData')) {
        db.createObjectStore('lostModeData', { keyPath: 'key' });
      }
    },
  });

  return db;
}

// Shift operations
export async function addShift(shift: Shift): Promise<void> {
  const db = await getDB();
  await db.add('shifts', shift);
}

export async function updateShift(shift: Shift): Promise<void> {
  const db = await getDB();
  await db.put('shifts', shift);
}

export async function deleteShift(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('shifts', id);
}

export async function getShift(id: string): Promise<Shift | undefined> {
  const db = await getDB();
  return db.get('shifts', id);
}

export async function getAllShifts(): Promise<Shift[]> {
  const db = await getDB();
  return db.getAll('shifts');
}

export async function getShiftsByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
  const db = await getDB();
  const shifts = await db.getAll('shifts');
  return shifts.filter(shift => shift.date >= startDate && shift.date <= endDate);
}

// Note operations
export async function addNote(note: Note): Promise<void> {
  const db = await getDB();
  const obfuscated = { ...note, content: obfuscate(note.content) };
  await db.add('notes', obfuscated);
}

export async function updateNote(note: Note): Promise<void> {
  const db = await getDB();
  const obfuscated = { ...note, content: obfuscate(note.content) };
  await db.put('notes', obfuscated);
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('notes', id);
}

export async function getNote(id: string): Promise<Note | undefined> {
  const db = await getDB();
  const result = await db.get('notes', id);
  if (result) {
    return { ...result, content: deobfuscate(result.content) };
  }
  return result;
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDB();
  const all = await db.getAll('notes');
  return all.map(n => ({ ...n, content: deobfuscate(n.content) }));
}

export async function getPinnedNotes(): Promise<Note[]> {
  const db = await getDB();
  const allNotes = await db.getAll('notes');
  return allNotes.filter(note => note.isPinned).map(n => ({ ...n, content: deobfuscate(n.content) }));
}

export async function getNotesByCategory(category: string): Promise<Note[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('notes', 'by-category', category);
  return all.map(n => ({ ...n, content: deobfuscate(n.content) }));
}

// Medication operations
export async function addMedication(medication: Medication): Promise<void> {
  const db = await getDB();
  await db.add('medications', medication);
}

export async function updateMedication(medication: Medication): Promise<void> {
  const db = await getDB();
  await db.put('medications', medication);
}

export async function deleteMedication(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('medications', id);
}

export async function getMedication(id: string): Promise<Medication | undefined> {
  const db = await getDB();
  return db.get('medications', id);
}

export async function getAllMedications(): Promise<Medication[]> {
  const db = await getDB();
  return db.getAll('medications');
}

export async function getActiveMedications(): Promise<Medication[]> {
  const db = await getDB();
  const allMeds = await db.getAll('medications');
  return allMeds.filter(med => med.isActive);
}

// Hydration operations
export async function setHydration(entry: HydrationEntry): Promise<void> {
  const db = await getDB();
  await db.put('hydration', entry);
}

export async function getHydration(date: string): Promise<HydrationEntry | undefined> {
  const db = await getDB();
  return db.get('hydration', date);
}

export async function incrementHydration(date: string): Promise<HydrationEntry> {
  const db = await getDB();
  const existing = await db.get('hydration', date);
  const glasses = existing ? Math.min(existing.glasses + 1, 8) : 1;
  const entry: HydrationEntry = {
    date,
    glasses,
    lastUpdated: new Date().toISOString(),
  };
  await db.put('hydration', entry);
  return entry;
}

// Mood operations
export async function setMood(entry: MoodEntry): Promise<void> {
  const db = await getDB();
  await db.put('mood', entry);
}

export async function getMood(date: string): Promise<MoodEntry | undefined> {
  const db = await getDB();
  return db.get('mood', date);
}

export async function getRecentMoods(days: number): Promise<MoodEntry[]> {
  const db = await getDB();
  const allMoods = await db.getAll('mood');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return allMoods
    .filter(mood => new Date(mood.date) >= cutoffDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Sleep operations
export async function setSleep(entry: SleepEntry): Promise<void> {
  const db = await getDB();
  await db.put('sleep', entry);
}

export async function getSleep(date: string): Promise<SleepEntry | undefined> {
  const db = await getDB();
  return db.get('sleep', date);
}

export async function getRecentSleep(days: number): Promise<SleepEntry[]> {
  const db = await getDB();
  const allSleep = await db.getAll('sleep');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return allSleep
    .filter(sleep => new Date(sleep.date) >= cutoffDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Journal operations
export async function setJournal(entry: JournalEntry): Promise<void> {
  const db = await getDB();
  const obfuscated = { ...entry, content: obfuscate(entry.content) };
  await db.put('journal', obfuscated);
}

export async function getJournal(date: string): Promise<JournalEntry | undefined> {
  const db = await getDB();
  const result = await db.get('journal', date);
  if (result) {
    return { ...result, content: deobfuscate(result.content) };
  }
  return result;
}

export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  const db = await getDB();
  const all = await db.getAll('journal');
  return all.map(j => ({ ...j, content: deobfuscate(j.content) }));
}

// Moment operations
export async function addMoment(moment: Moment): Promise<void> {
  const db = await getDB();
  await db.add('moments', moment);
}

export async function updateMoment(moment: Moment): Promise<void> {
  const db = await getDB();
  await db.put('moments', moment);
}

export async function deleteMoment(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('moments', id);
}

export async function getMoment(id: string): Promise<Moment | undefined> {
  const db = await getDB();
  return db.get('moments', id);
}

export async function getAllMoments(): Promise<Moment[]> {
  const db = await getDB();
  return db.getAll('moments');
}

// Photo operations
export async function addPhoto(photo: Photo): Promise<void> {
  const db = await getDB();
  await db.add('photos', photo);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('photos', id);
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  const db = await getDB();
  return db.get('photos', id);
}

export async function getAllPhotos(): Promise<Photo[]> {
  const db = await getDB();
  return db.getAll('photos');
}

// Countdown operations
export async function addCountdown(countdown: Countdown): Promise<void> {
  const db = await getDB();
  await db.add('countdowns', countdown);
}

export async function updateCountdown(countdown: Countdown): Promise<void> {
  const db = await getDB();
  await db.put('countdowns', countdown);
}

export async function deleteCountdown(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('countdowns', id);
}

export async function getCountdown(id: string): Promise<Countdown | undefined> {
  const db = await getDB();
  return db.get('countdowns', id);
}

export async function getAllCountdowns(): Promise<Countdown[]> {
  const db = await getDB();
  return db.getAll('countdowns');
}

// Usage queue operations
export async function queueUsageEvent(event: UsageEvent): Promise<number> {
  const db = await getDB();
  return db.add('usage_queue', event);
}

export async function getQueuedUsageEvents(): Promise<UsageEvent[]> {
  const db = await getDB();
  return db.getAll('usage_queue');
}

export async function deleteUsageEvent(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('usage_queue', id);
}

export async function clearUsageQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('usage_queue');
}

// Settings operations
export async function setSetting(key: string, value: string | number | boolean): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function getSetting(key: string): Promise<Settings | undefined> {
  const db = await getDB();
  return db.get('settings', key);
}

export async function getAllSettings(): Promise<Settings[]> {
  const db = await getDB();
  return db.getAll('settings');
}

// Auth operations
export async function setAuthData(key: string, value: string): Promise<void> {
  try {
    console.log('[DB] setAuthData:', key, '=', value.substring(0, 16) + '...');
    const db = await getDB();
    await db.put('auth', { key, value });
    console.log('[DB] setAuthData complete for:', key);
  } catch (err) {
    console.error('[DB] setAuthData ERROR:', err);
    throw err;
  }
}

export async function getAuthData(key: string): Promise<string | undefined> {
  try {
    const db = await getDB();
    const result = await db.get('auth', key);
    console.log('[DB] getAuthData:', key, '-> found:', !!result);
    return result?.value;
  } catch (err) {
    console.error('[DB] getAuthData ERROR:', err);
    return undefined;
  }
}

export async function deleteAuthData(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('auth', key);
}

// Stress operations
export async function setStress(entry: StressEntry): Promise<void> {
  const db = await getDB();
  await db.put('stress', entry);
}

export async function getStress(date: string): Promise<StressEntry | undefined> {
  const db = await getDB();
  return db.get('stress', date);
}

export async function getAllStressEntries(): Promise<StressEntry[]> {
  const db = await getDB();
  return db.getAll('stress');
}

// Patient notes operations
export async function addPatientNote(note: PatientNote): Promise<void> {
  const db = await getDB();
  await db.add('patient_notes', note);
}

export async function deletePatientNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('patient_notes', id);
}

export async function getAllPatientNotes(): Promise<PatientNote[]> {
  const db = await getDB();
  return db.getAll('patient_notes');
}

// Clinical references operations
export async function addClinicalReference(ref: ClinicalReference): Promise<void> {
  const db = await getDB();
  await db.add('clinical_references', ref);
}

export async function updateClinicalReference(ref: ClinicalReference): Promise<void> {
  const db = await getDB();
  await db.put('clinical_references', ref);
}

export async function deleteClinicalReference(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('clinical_references', id);
}

export async function getClinicalReference(id: string): Promise<ClinicalReference | undefined> {
  const db = await getDB();
  return db.get('clinical_references', id);
}

export async function getAllClinicalReferences(): Promise<ClinicalReference[]> {
  const db = await getDB();
  return db.getAll('clinical_references');
}

export async function getClinicalReferencesByCategory(category: string): Promise<ClinicalReference[]> {
  const db = await getDB();
  return db.getAllFromIndex('clinical_references', 'by-category', category);
}

// Letters operations
export async function addLetter(letter: Letter): Promise<void> {
  const db = await getDB();
  const obfuscated = { ...letter, content: obfuscate(letter.content) };
  await db.add('letters', obfuscated);
}

export async function updateLetter(letter: Letter): Promise<void> {
  const db = await getDB();
  const obfuscated = { ...letter, content: obfuscate(letter.content) };
  await db.put('letters', obfuscated);
}

export async function deleteLetter(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('letters', id);
}

export async function getLetter(id: string): Promise<Letter | undefined> {
  const db = await getDB();
  const result = await db.get('letters', id);
  if (result) {
    return { ...result, content: deobfuscate(result.content) };
  }
  return result;
}

export async function getAllLetters(): Promise<Letter[]> {
  const db = await getDB();
  const all = await db.getAll('letters');
  return all.map(l => ({ ...l, content: deobfuscate(l.content) }));
}

// Monthly letters operations
export async function addMonthlyLetter(letter: MonthlyLetter): Promise<void> {
  const db = await getDB();
  const obfuscated = { ...letter, content: obfuscate(letter.content) };
  await db.add('monthlyLetters', obfuscated);
}

export async function updateMonthlyLetter(letter: MonthlyLetter): Promise<void> {
  const db = await getDB();
  const obfuscated = { ...letter, content: obfuscate(letter.content) };
  await db.put('monthlyLetters', obfuscated);
}

export async function deleteMonthlyLetter(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('monthlyLetters', id);
}

export async function getMonthlyLetter(id: string): Promise<MonthlyLetter | undefined> {
  const db = await getDB();
  const result = await db.get('monthlyLetters', id);
  if (result) {
    return { ...result, content: deobfuscate(result.content) };
  }
  return result;
}

export async function getAllMonthlyLetters(): Promise<MonthlyLetter[]> {
  const db = await getDB();
  const all = await db.getAll('monthlyLetters');
  return all.map(l => ({ ...l, content: deobfuscate(l.content) }));
}

// Milestones operations
export async function addMilestone(milestone: Milestone): Promise<void> {
  const db = await getDB();
  const obfuscated = { ...milestone, description: obfuscate(milestone.description) };
  await db.add('milestones', obfuscated);
}

export async function deleteMilestone(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('milestones', id);
}

export async function getAllMilestones(): Promise<Milestone[]> {
  const db = await getDB();
  const all = await db.getAll('milestones');
  return all.map(m => ({ ...m, description: deobfuscate(m.description) }));
}

// Pings operations
export async function addPing(ping: Ping): Promise<void> {
  const db = await getDB();
  const obfuscated = { ...ping, message: obfuscate(ping.message) };
  await db.add('pings', obfuscated);
}

export async function updatePing(ping: Ping): Promise<void> {
  const db = await getDB();
  const obfuscated = { ...ping, message: obfuscate(ping.message) };
  await db.put('pings', obfuscated);
}

export async function deletePing(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pings', id);
}

export async function getAllPings(): Promise<Ping[]> {
  const db = await getDB();
  const all = await db.getAll('pings');
  return all.map(p => ({ ...p, message: deobfuscate(p.message) }));
}

// Lost mode data operations
export async function setLostModeData(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put('lostModeData', { key, value });
}

export async function getAllLostModeData(): Promise<LostModeData[]> {
  const db = await getDB();
  return db.getAll('lostModeData');
}

export async function addLostModeData(data: LostModeData): Promise<void> {
  const db = await getDB();
  await db.put('lostModeData', data);
}

export async function getLostModeData(key: string): Promise<string | undefined> {
  const db = await getDB();
  const result = await db.get('lostModeData', key);
  return result?.value;
}

export async function deleteLostModeData(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('lostModeData', key);
}

// Clear all data (for reset functionality)
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const storeNames = db.objectStoreNames;
  const transaction = db.transaction(storeNames, 'readwrite');
  
  for (const storeName of storeNames) {
    await transaction.objectStore(storeName).clear();
  }
}
