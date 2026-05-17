// Shift Types
export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  ward?: string;
  type: 'day' | 'night' | 'on-call' | 'training' | 'off';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completed?: boolean;
  completedAt?: string;
  remindersEnabled?: boolean;
}

// Note Types
export interface Note {
  id: string;
  title: string;
  content: string;
  category: 'work' | 'personal' | 'clinical' | 'ideas';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// Medication Types
export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  time: string; // HH:mm
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Hydration Types
export interface HydrationEntry {
  date: string; // YYYY-MM-DD
  glasses: number; // 0-8
  lastUpdated: string;
}

// Mood Types
export interface MoodEntry {
  date: string; // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5; // 1=😔, 2=😕, 3=😐, 4=🙂, 5=😊
  note?: string;
  createdAt: string;
}

// Sleep Types
export interface SleepEntry {
  date: string; // YYYY-MM-DD
  bedtime: string; // HH:mm
  wakeTime: string; // HH:mm
  hours: number;
  quality: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

// Journal Types
export interface JournalEntry {
  date: string; // YYYY-MM-DD
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Moments Types
export interface Moment {
  id: string;
  date: string;
  title: string;
  description: string;
  emoji?: string;
  createdAt: string;
  updatedAt: string;
}

// Photo Types
export interface Photo {
  id: string;
  data: string; // base64
  caption: string;
  date: string;
  createdAt: string;
}

// Countdown Types
export interface Countdown {
  id: string;
  name: string;
  targetDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

// Usage Tracking Types
export interface UsageEvent {
  id?: number;
  feature: string;
  action: string;
  timestamp: string;
  timeOfDay: 'morning' | 'afternoon' | 'night';
  date: string;
}

// Settings Types
export interface Settings {
  key: string;
  value: string | number | boolean;
}

export interface NotificationSettings {
  shiftReminders: boolean;
  medicationReminders: boolean;
  hydrationNudges: boolean;
  dailyEncouragement: boolean;
  wellnessCheckIn: boolean;
}

export interface AppSettings {
  notifications: NotificationSettings;
  anniversaryDate?: string; // YYYY-MM-DD
}

// Auth Types
export interface AuthData {
  key: string;
  value: string;
}

// Stress Check Types
export interface StressEntry {
  date: string;
  level: number; // 1-10
  reflection?: string;
  createdAt: string;
}

// Patient Quick Notes Types
export interface PatientNote {
  id: string;
  content: string;
  tag?: string;
  timestamp: string;
}

// Clinical Reference Types
export interface ClinicalReference {
  id: string;
  title: string;
  content: string;
  category: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

// BMI Calculator Types
export interface BMIResult {
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
}

// IV Drip Calculator Types
export interface IVResult {
  dropsPerMinute: number;
  calculation: string;
}

// Breathing Session Types
export interface BreathingSession {
  date: string;
  cycles: number;
  completedAt: string;
}

// Letter Box Types
export interface Letter {
  id: string;
  title: string;
  content: string;
  unlockDate: string; // YYYY-MM-DD
  isRevealed: boolean;
  revealedAt?: string;
}

// Monthly Letter Types
export interface MonthlyLetter {
  id: string;
  month: number; // 1-12
  year: number;
  content: string;
  isRead: boolean;
}

// Milestone Types
export interface Milestone {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
  emoji: string;
  addedBy: 'admin' | 'violet';
  createdAt: string;
}

// Ping Types
export interface Ping {
  id: string;
  message: string;
  timestamp: string;
  seen: boolean;
}

// Lost Mode Data Types
export interface LostModeData {
  key: string;
  value: string;
}
