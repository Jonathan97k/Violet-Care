# 🚀 VioletCare Supabase Setup Guide

Complete step-by-step guide to set up VioletCare with Supabase backend and deploy to Vercel.

**Total time: ~20 minutes** ⏱️

---

## 📋 What You'll Get

By following this guide, your VioletCare app will have:
- ✅ Email authentication (signup/login)
- ✅ Required PWA installation
- ✅ Admin portal with user management
- ✅ Remote enable/disable user accounts
- ✅ Photo upload from camera/gallery
- ✅ Full offline functionality
- ✅ Real-time updates
- ✅ Free hosting on Vercel + Supabase

---

## 🎯 Step 1: Create Supabase Project (5 minutes)

### 1.1 Sign Up for Supabase

1. Go to **[supabase.com](https://supabase.com)**
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

### 1.2 Create a New Project

1. Click **"New project"**
2. Fill in:
   - **Name:** `VioletCare`
   - **Database Password:** Click "Generate" and **SAVE THIS PASSWORD** somewhere safe
   - **Region:** Choose closest to you (e.g., "West Europe" if in Europe)
   - **Pricing Plan:** **Free** (no credit card needed)
3. Click **"Create new project"**
4. Wait ~2 minutes for it to set up ⏳

### 1.3 Get Your API Credentials

Once your project is ready:

1. Click the **⚙️ Settings** icon (bottom left)
2. Click **"API"** in the menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **Project API keys** → **anon public** key (long string starting with `eyJ...`)
4. **Keep this page open** - you'll need these in Step 3

---

## 🗄️ Step 2: Set Up Database (3 minutes)

### 2.1 Run the Schema SQL

1. In Supabase Dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from your project
4. **Copy all the contents** and paste into the SQL Editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see: ✅ "Success. No rows returned"

This creates:
- ✅ User profiles table
- ✅ Notifications table
- ✅ Activity logs table
- ✅ Cloud sync table
- ✅ Security policies (RLS)
- ✅ Auto-create profile on signup
- ✅ Photo storage bucket

### 2.2 Verify Database Setup

1. Click **"Table Editor"** in left sidebar
2. You should see these tables:
   - `profiles`
   - `notifications`
   - `user_activity`
   - `user_data`

✅ **Database is ready!**

---

## 🔐 Step 3: Configure Authentication (2 minutes)

### 3.1 Enable Email Authentication

1. Click **"Authentication"** in left sidebar
2. Click **"Providers"** tab
3. Find **"Email"** provider
4. Make sure it's **enabled** (toggle should be green)

### 3.2 Configure Email Settings

1. Click on **"Email"** provider to expand it
2. Settings to set:
   - ✅ **Enable Email provider** - ON
   - ✅ **Confirm email** - **TURN OFF** for now (turn ON for production)
   - ✅ **Secure email change** - ON
   - ✅ **Secure password change** - OFF

3. Click **"Save"**

### 3.3 Add Site URL

1. Still in Authentication, click **"URL Configuration"**
2. Add to **"Site URL"**: `http://localhost:5173`
3. Add to **"Redirect URLs"**:
   - `http://localhost:5173/*`
   - `https://your-app.vercel.app/*` (add this after deploying)
4. Click **"Save"**

✅ **Authentication is ready!**

---

## 💻 Step 4: Configure Your App (3 minutes)

### 4.1 Create .env File

In your VioletCare project folder:

```bash
# Copy the example file
cp .env.example .env
```

### 4.2 Add Your Supabase Credentials

Open `.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase
```

Use the values from **Step 1.3** above.

### 4.3 Install Dependencies

```bash
npm install
```

This will install `@supabase/supabase-js` and all other dependencies.

### 4.4 Test Locally

```bash
npm run dev
```

Visit **http://localhost:5173**

You should see the email signup page! 🎉

---

## 🧪 Step 5: Test the App (3 minutes)

### 5.1 Test User Signup

1. Click **"Sign Up"**
2. Enter a test email (e.g., `test@example.com`)
3. Enter a password (min 6 characters)
4. Click **"Create Account"**
5. Should redirect to install prompt page

### 5.2 Verify in Supabase

1. Go back to Supabase Dashboard
2. Click **"Authentication"** → **"Users"**
3. You should see your test user! ✅
4. Click **"Table Editor"** → **"profiles"**
5. You should see the user profile! ✅

### 5.3 Test Admin Account

1. In your app, sign out (or open incognito)
2. Sign up with: `kaphirij9@gmail.com`
3. This account automatically becomes admin
4. After installing app, tap the 💜 logo 7 times on auth screen
5. Enter PIN: `000000` (default)
6. You'll see the Admin Panel with user management!

---

## 🚀 Step 6: Deploy to Vercel (5 minutes)

### 6.1 Push to GitHub

If not already done:

```bash
git add .
git commit -m "Setup Supabase integration"
git push origin main
```

### 6.2 Deploy on Vercel

**Option A: Via Vercel Website (Easiest)**

1. Go to **[vercel.com](https://vercel.com)**
2. Sign up / Log in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Select your `Violet-Care` repository
5. Click **"Import"**
6. Configure project:
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
7. **IMPORTANT:** Add Environment Variables:
   - Click **"Environment Variables"**
   - Add `VITE_SUPABASE_URL` = your Supabase URL
   - Add `VITE_SUPABASE_ANON_KEY` = your anon key
8. Click **"Deploy"**
9. Wait ~2 minutes ⏳

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy: Yes
# - Which scope: (select your account)
# - Link to existing project: No
# - Project name: violet-care
# - In which directory: ./
# - Override settings: No

# Add environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# Deploy to production
vercel --prod
```

### 6.3 Update Supabase URLs

Once deployed, you'll get a URL like `https://violet-care.vercel.app`

1. Go to Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Update **"Site URL"** to your Vercel URL
4. Add to **"Redirect URLs"**: `https://your-app.vercel.app/*`
5. Click **"Save"**

✅ **Your app is LIVE!** 🎉

---

## 🎯 Step 7: Set Up Storage (Optional - 2 minutes)

For photo uploads to be backed up to cloud (in addition to local storage):

### 7.1 Verify Photos Bucket

1. In Supabase Dashboard, click **"Storage"**
2. You should see a `photos` bucket (created by schema)
3. If not, click **"New bucket"**:
   - Name: `photos`
   - Public: **No** (keep private)
   - Click **"Create"**

### 7.2 Verify Policies

Click on the `photos` bucket. The schema already created policies for:
- ✅ Users can upload to their own folder
- ✅ Users can view their own photos
- ✅ Users can delete their own photos
- ✅ Admins can view all photos

✅ **Storage is ready!**

---

## 👑 Step 8: Admin Tasks (Important!)

### 8.1 Change Default Admin PIN

The default admin PIN is `000000` - **CHANGE IT IMMEDIATELY!**

1. Sign in as admin (`kaphirij9@gmail.com`)
2. Tap 💜 logo 7 times on auth screen
3. Enter PIN: `000000`
4. Go to Admin Panel
5. Click **"Change Admin PIN"**
6. Enter current PIN: `000000`
7. Enter new 6-digit PIN
8. Save

### 8.2 Test User Management

1. From Admin Panel, click **"User Management"**
2. You should see all registered users
3. Try disabling a test user
4. The test user should be logged out immediately
5. Try re-enabling them

### 8.3 Send Test Notification

1. Click the send icon on a user
2. Type a test message
3. Click "Send"
4. Check the user's notifications table in Supabase

---

## 🔧 Troubleshooting

### "Missing environment variables" warning

**Solution:**
- Make sure `.env` file exists in project root
- Restart dev server: `npm run dev`
- For Vercel: Check environment variables are set

### "Failed to fetch" error on signup

**Solution:**
- Check Supabase URL is correct (should end with `.supabase.co`)
- Verify anon key is the **public** key, not service role
- Check browser console for specific error

### "Email already registered" but I never signed up

**Solution:**
- In Supabase Dashboard → Authentication → Users
- Find and delete the test user
- Try again

### Admin email not getting admin privileges

**Solution:**
1. Go to Supabase Dashboard → Table Editor → `profiles`
2. Find the row with `kaphirij9@gmail.com`
3. Set `is_admin` to `TRUE`
4. Save

### "Permission denied" errors

**Solution:**
- Re-run the SQL schema (it's safe to run multiple times)
- Check Authentication → Policies in Supabase Dashboard
- Make sure RLS policies are enabled

### App not installing as PWA

**Solution:**
- Must be served over HTTPS (Vercel does this automatically)
- Try in Chrome or Edge (best PWA support)
- Check browser console for errors
- Try clearing site data and re-visiting

---

## 📊 Monitoring Your App

### Supabase Dashboard

Monitor your app at:
- **Database:** Table Editor → profiles, notifications, etc.
- **Auth:** Authentication → Users (see signups)
- **Logs:** Logs → API logs (see all requests)
- **Storage:** Storage → photos (see uploaded photos)

### Vercel Dashboard

Monitor deployment at:
- **Deployments:** See all deployments
- **Analytics:** Page views, performance
- **Logs:** Server-side logs

---

## 🎓 Free Tier Limits

### Supabase Free Tier (per project)
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 2GB bandwidth/month
- ✅ 50,000 monthly active users
- ✅ 500MB egress per day
- ✅ Unlimited API requests
- ✅ Pauses after 1 week of inactivity (just visit to wake)

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ HTTPS included
- ✅ Custom domains

**For Violet's personal app, you'll likely never hit these limits!** 💜

---

## 🆘 Need Help?

### Common Issues

1. **Can't find environment variables in Vercel**
   - Project Settings → Environment Variables
   - Add for "Production", "Preview", and "Development"

2. **App works locally but not on Vercel**
   - Check environment variables are set
   - Redeploy after adding variables
   - Check build logs for errors

3. **Database changes not reflecting**
   - Try refreshing browser
   - Clear cache and reload
   - Check Supabase logs for errors

### Resources

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **VioletCare Issues:** Check console logs

---

## ✅ Final Checklist

Before going live:

- [ ] Supabase project created
- [ ] Database schema run successfully
- [ ] Email authentication enabled
- [ ] Site URLs configured in Supabase
- [ ] `.env` file created with credentials
- [ ] App tested locally
- [ ] Test user can sign up
- [ ] Admin email gets admin privileges
- [ ] App deployed to Vercel
- [ ] Vercel environment variables set
- [ ] Vercel URL added to Supabase Auth URLs
- [ ] Default admin PIN changed
- [ ] User management tested
- [ ] App can be installed as PWA

---

## 🎉 You're Done!

Your VioletCare app is now:
- ✅ Hosted on Vercel (frontend)
- ✅ Powered by Supabase (backend)
- ✅ Completely FREE
- ✅ Fully functional with all features
- ✅ Ready for Violet to use!

**Share the link with Violet:** `https://your-app.vercel.app`

She just needs to:
1. Visit the URL
2. Sign up with her email
3. Install the app when prompted
4. Use the app like a native app!

You as admin can:
- View all installations
- Disable/enable accounts
- Send notifications
- Monitor activity
- Manage everything remotely

**Made with 💜 for Violet**

---

**Last updated:** May 2026
**Stack:** React + Vite + Supabase + Vercel
**Cost:** $0/month (free tiers)
