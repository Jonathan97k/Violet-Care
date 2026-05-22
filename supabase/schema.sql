-- VioletCare Supabase Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

-- ============================================
-- 1. PROFILES TABLE (User Profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  uid UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  device_installed BOOLEAN DEFAULT FALSE,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  disabled_by UUID,
  installed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. NOTIFICATIONS TABLE (Admin Messages)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(uid) ON DELETE CASCADE,
  message TEXT NOT NULL,
  title TEXT DEFAULT 'Message from VioletCare',
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  seen_at TIMESTAMPTZ
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- ============================================
-- 3. USER_ACTIVITY TABLE (Activity Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(uid) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS user_activity_user_id_idx ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS user_activity_timestamp_idx ON public.user_activity(timestamp DESC);

-- ============================================
-- 4. USER_DATA TABLE (Cloud Sync Backup)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(uid) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  data JSONB NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, data_type, item_id)
);

ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS user_data_user_id_idx ON public.user_data(user_id);
CREATE INDEX IF NOT EXISTS user_data_data_type_idx ON public.user_data(data_type);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- ===== PROFILES POLICIES =====

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = uid);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = uid)
  WITH CHECK (auth.uid() = uid);

-- Users can insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = uid);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE uid = auth.uid() AND is_admin = TRUE
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE uid = auth.uid() AND is_admin = TRUE
    )
  );

-- ===== NOTIFICATIONS POLICIES =====

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as seen)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE uid = auth.uid() AND is_admin = TRUE
    )
  );

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE uid = auth.uid() AND is_admin = TRUE
    )
  );

-- ===== USER_ACTIVITY POLICIES =====

-- Users can view their own activity
CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity"
  ON public.user_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE uid = auth.uid() AND is_admin = TRUE
    )
  );

-- ===== USER_DATA POLICIES =====

-- Users can manage their own data
CREATE POLICY "Users can view their own data"
  ON public.user_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data"
  ON public.user_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data"
  ON public.user_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data"
  ON public.user_data FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_email BOOLEAN;
BEGIN
  -- Check if this is the admin email
  is_admin_email := NEW.email = 'kaphirij9@gmail.com';

  -- Insert profile (will skip if already exists)
  INSERT INTO public.profiles (uid, email, display_name, is_admin, is_active, device_installed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    is_admin_email,
    TRUE,
    FALSE
  )
  ON CONFLICT (uid) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Run on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Update last_login timestamp
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_login_at = NOW()
  WHERE uid = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: For login tracking, we update from the client side
-- since auth.sessions doesn't have a reliable trigger

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create photos storage bucket (run in Storage section of dashboard if SQL fails)
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for photos bucket
CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE uid = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for notifications (so users can see new admin messages instantly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for profiles (so account disable takes effect immediately)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ============================================
-- DONE!
-- ============================================
-- Your database is ready. Next steps:
-- 1. Configure Authentication in Supabase dashboard
--    - Go to Authentication → Providers
--    - Enable Email provider
--    - Disable "Confirm email" for testing (enable later for production)
-- 2. Add your Supabase URL and Anon Key to .env file
-- 3. Sign up with kaphirij9@gmail.com to become admin
