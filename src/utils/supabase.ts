// Supabase Configuration and Utilities
// Complete replacement for Firebase backend

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UserProfile {
  uid: string;
  email: string;
  display_name?: string;
  is_active: boolean;
  is_admin: boolean;
  device_installed: boolean;
  created_at: string;
  last_login_at: string;
  disabled_at?: string;
  disabled_by?: string;
  fcm_token?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const ADMIN_EMAIL = 'kaphirij9@gmail.com';

// Debug logging on module load
console.log('[Supabase Init] URL configured:', !!SUPABASE_URL);
console.log('[Supabase Init] Key configured:', !!SUPABASE_ANON_KEY);
if (SUPABASE_URL) {
  console.log('[Supabase Init] URL value:', SUPABASE_URL);
}

// Initialize Supabase client at module load time (eager initialization)
// This ensures it's ready before any component tries to use it
let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    console.log('[Supabase] Client initialized successfully on module load');
  } catch (err) {
    console.error('[Supabase] Failed to initialize:', err);
  }
} else {
  console.error(
    '[Supabase] CRITICAL: Missing environment variables!\n' +
    '  VITE_SUPABASE_URL: ' + (SUPABASE_URL ? 'set' : 'MISSING') + '\n' +
    '  VITE_SUPABASE_ANON_KEY: ' + (SUPABASE_ANON_KEY ? 'set' : 'MISSING') + '\n' +
    'Make sure these are set in Vercel Environment Variables and you have redeployed.'
  );
}

export function initSupabase() {
  // Already initialized at module load. This is just a noop for backward compatibility.
  return supabase;
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
      'environment variables are set in Vercel and the app has been redeployed.'
    );
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// ==================== Authentication ====================

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ user: UserProfile; requiresInstall: boolean }> {
  const sb = getSupabase();

  // Sign up the user
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: email.split('@')[0],
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Failed to create user');
  }

  // Create user profile in profiles table
  const isAdmin = email === ADMIN_EMAIL;
  const profile: Partial<UserProfile> = {
    uid: data.user.id,
    email: data.user.email!,
    display_name: email.split('@')[0],
    is_active: true,
    is_admin: isAdmin,
    device_installed: false,
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  const { error: profileError } = await sb.from('profiles').insert(profile);

  if (profileError) {
    console.error('[Supabase] Failed to create profile:', profileError);
    // Profile may be created via trigger, so don't fail
  }

  const userProfile: UserProfile = {
    uid: data.user.id,
    email: data.user.email!,
    display_name: email.split('@')[0],
    is_active: true,
    is_admin: isAdmin,
    device_installed: false,
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  return { user: userProfile, requiresInstall: !isAppInstalled() };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: UserProfile; requiresInstall: boolean }> {
  const sb = getSupabase();

  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Failed to sign in');
  }

  // Get user profile
  const { data: profile, error: profileError } = await sb
    .from('profiles')
    .select('*')
    .eq('uid', data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  // Check if account is active
  if (!profile.is_active) {
    await sb.auth.signOut();
    throw new Error('Your account has been disabled. Please contact support.');
  }

  // Update last login
  await sb
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('uid', data.user.id);

  return { user: profile as UserProfile, requiresInstall: !isAppInstalled() };
}

export async function signOutUser(): Promise<void> {
  const sb = getSupabase();
  await sb.auth.signOut();
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) return null;

    const { data: profile, error } = await sb
      .from('profiles')
      .select('*')
      .eq('uid', user.id)
      .single();

    if (error || !profile) {
      console.error('[Supabase] Failed to get profile:', error);
      return null;
    }

    return profile as UserProfile;
  } catch (error) {
    console.error('[Supabase] getCurrentUser error:', error);
    return null;
  }
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return;

  const { error } = await sb
    .from('profiles')
    .update(updates)
    .eq('uid', user.id);

  if (error) {
    console.error('[Supabase] Failed to update profile:', error);
    throw error;
  }
}

// ==================== Installation Detection ====================

export function isAppInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export async function markDeviceAsInstalled(): Promise<void> {
  await updateUserProfile({ device_installed: true });
}

export function isAdminEmail(email: string): boolean {
  return email === ADMIN_EMAIL;
}

// ==================== Admin Functions ====================

export async function adminGetAllUsers(): Promise<UserProfile[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to get users:', error);
    throw error;
  }

  return (data as UserProfile[]) || [];
}

export async function adminDisableUser(uid: string, adminUid: string): Promise<void> {
  const sb = getSupabase();

  const { error } = await sb
    .from('profiles')
    .update({
      is_active: false,
      disabled_at: new Date().toISOString(),
      disabled_by: adminUid,
    })
    .eq('uid', uid);

  if (error) {
    console.error('[Supabase] Failed to disable user:', error);
    throw error;
  }

  // Optionally call edge function to invalidate user sessions
  try {
    await sb.functions.invoke('disable-user-auth', {
      body: { uid },
    });
  } catch (err) {
    console.warn('[Supabase] Edge function not available:', err);
  }
}

export async function adminEnableUser(uid: string): Promise<void> {
  const sb = getSupabase();

  const { error } = await sb
    .from('profiles')
    .update({
      is_active: true,
      disabled_at: null,
      disabled_by: null,
    })
    .eq('uid', uid);

  if (error) {
    console.error('[Supabase] Failed to enable user:', error);
    throw error;
  }
}

export async function adminSendNotification(uid: string, message: string): Promise<void> {
  const sb = getSupabase();

  // Store notification in database
  const { error } = await sb.from('notifications').insert({
    user_id: uid,
    message,
    created_at: new Date().toISOString(),
    seen: false,
  });

  if (error) {
    console.error('[Supabase] Failed to send notification:', error);
    throw error;
  }

  // Optionally trigger edge function for push notification
  try {
    await sb.functions.invoke('send-push-notification', {
      body: { uid, message },
    });
  } catch (err) {
    console.warn('[Supabase] Push notification edge function not available:', err);
  }
}

export async function adminGetUserActivity(uid: string): Promise<any> {
  const sb = getSupabase();

  const { data, error } = await sb
    .from('user_activity')
    .select('*')
    .eq('user_id', uid)
    .order('timestamp', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Supabase] Failed to get user activity:', error);
    return { logins: [], actions: [] };
  }

  return { activities: data || [] };
}

// ==================== User Status Verification ====================

export async function verifyUserStatus(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    return user.is_active;
  } catch (error) {
    console.error('[Supabase] verifyUserStatus error:', error);
    return false;
  }
}

// ==================== Data Sync ====================

export async function syncUserDataToCloud(
  userId: string,
  dataType: string,
  items: any[]
): Promise<void> {
  const sb = getSupabase();

  const records = items.map((item) => ({
    user_id: userId,
    data_type: dataType,
    item_id: item.id,
    data: item,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await sb.from('user_data').upsert(records, {
    onConflict: 'user_id,data_type,item_id',
  });

  if (error) {
    console.error('[Supabase] Failed to sync data:', error);
    throw error;
  }
}

export async function getUserDataFromCloud(
  userId: string,
  dataType: string
): Promise<any[]> {
  const sb = getSupabase();

  const { data, error } = await sb
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .eq('data_type', dataType);

  if (error) {
    console.error('[Supabase] Failed to get user data:', error);
    return [];
  }

  return data?.map((row) => row.data) || [];
}

// ==================== Photo Storage ====================

export async function uploadPhotoToCloud(
  userId: string,
  photoId: string,
  file: File | Blob
): Promise<string> {
  const sb = getSupabase();

  const filePath = `${userId}/${photoId}`;

  const { error } = await sb.storage
    .from('photos')
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) {
    console.error('[Supabase] Failed to upload photo:', error);
    throw error;
  }

  const { data } = sb.storage.from('photos').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deletePhotoFromCloud(userId: string, photoId: string): Promise<void> {
  const sb = getSupabase();
  const filePath = `${userId}/${photoId}`;

  const { error } = await sb.storage.from('photos').remove([filePath]);

  if (error) {
    console.error('[Supabase] Failed to delete photo:', error);
  }
}

// ==================== Session Management ====================

export async function onAuthStateChange(callback: (user: UserProfile | null) => void): Promise<() => void> {
  const sb = getSupabase();

  const { data: { subscription } } = sb.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const profile = await getCurrentUser();
      callback(profile);
    } else {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
}

// ==================== Activity Logging ====================

export async function logUserActivity(
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) return;

    await sb.from('user_activity').insert({
      user_id: user.id,
      action,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[Supabase] Failed to log activity:', error);
  }
}

// ==================== Notifications for User ====================

export async function getUserNotifications(unreadOnly = false): Promise<any[]> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) return [];

  let query = sb
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('seen', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase] Failed to get notifications:', error);
    return [];
  }

  return data || [];
}

export async function markNotificationSeen(notificationId: string): Promise<void> {
  const sb = getSupabase();

  await sb
    .from('notifications')
    .update({ seen: true, seen_at: new Date().toISOString() })
    .eq('id', notificationId);
}
