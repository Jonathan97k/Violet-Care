# VioletCare Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Firebase project created
- [ ] Admin email confirmed: `kaphirij9@gmail.com`

### Step 1: Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting
# - Storage
```

### Step 2: Configure Firebase

1. **Get Firebase Config**
   - Go to Firebase Console → Project Settings
   - Under "Your apps", click Web app
   - Copy configuration values

2. **Create .env file**
   ```bash
   cp .env.example .env
   ```

3. **Fill in .env with your Firebase values**
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456:web:abc123
   ```

### Step 3: Enable Firebase Services

**In Firebase Console:**

1. **Authentication**
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - (Optional) Enable "Email link (passwordless sign-in)"

2. **Firestore Database**
   - Go to Firestore Database
   - Create database (start in production mode)
   - Deploy rules: `firebase deploy --only firestore:rules`

3. **Cloud Storage**
   - Go to Storage
   - Get started
   - Deploy rules: `firebase deploy --only storage`

4. **Cloud Messaging (for notifications)**
   - Go to Project Settings → Cloud Messaging
   - Generate new key pair for Web Push certificates
   - Save the key

### Step 4: Deploy Cloud Functions

```bash
# Install function dependencies
cd functions
npm install

# Deploy functions
firebase deploy --only functions

# Verify deployment
firebase functions:list
```

Expected functions:
- `onUserCreate`
- `onUserDelete`
- `adminGetAllUsers`
- `adminDisableUser`
- `adminEnableUser`
- `adminSendNotification`
- `adminGetUserActivity`
- `updateLastLogin`
- `markDeviceInstalled`
- `registerFCMToken`
- `syncUserData`
- `verifyUserStatus`
- `cleanupOldActivityLogs`
- `adminBroadcastNotification`

### Step 5: Build and Deploy Frontend

```bash
# Return to project root
cd ..

# Install dependencies (if not done)
npm install

# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Get your app URL
firebase hosting:channel:list
```

Your app will be live at: `https://your-project-id.web.app`

## 🧪 Testing Checklist

### Local Testing

```bash
# Start local emulators (optional but recommended)
firebase emulators:start

# In another terminal, run dev server
npm run dev

# Visit http://localhost:5173
```

### Test 1: User Signup Flow

- [ ] Open app in browser
- [ ] Should show email authentication page
- [ ] Try signing up with a test email (not admin email)
- [ ] Verify redirected to install prompt
- [ ] Check Firebase Auth Console - user should appear
- [ ] Check Firestore Console - user profile should exist with `isAdmin: false`

### Test 2: Installation Flow

- [ ] On install prompt page, click "Install VioletCare"
- [ ] For mobile: Follow device-specific instructions
- [ ] For desktop: Click install button in address bar
- [ ] Verify app installs and opens in standalone mode
- [ ] Check URL bar is hidden (true standalone mode)
- [ ] Verify redirected to onboarding after installation

### Test 3: Admin Access

- [ ] In a new browser (or incognito), visit the app
- [ ] Sign up with admin email: `kaphirij9@gmail.com`
- [ ] Complete installation if required
- [ ] On login screen, tap the 💜 emoji 7 times
- [ ] Should be redirected to admin login
- [ ] Enter admin PIN (default: `000000`)
- [ ] Should see admin dashboard
- [ ] Check Firestore - admin user should have `isAdmin: true`

### Test 4: Admin User Management

- [ ] From admin dashboard, click "View Users"
- [ ] Should see list of all registered users
- [ ] Try disabling the test user account
- [ ] Switch to test user browser/device
- [ ] Test user should be logged out or prevented from accessing
- [ ] Re-enable user from admin panel
- [ ] Test user should be able to access again

### Test 5: Offline Functionality

- [ ] With app installed, open it
- [ ] Open Developer Tools → Network tab
- [ ] Set to "Offline" mode
- [ ] Navigate between pages
- [ ] Add a note or shift
- [ ] Verify app still works
- [ ] Verify "Offline" indicator appears
- [ ] Turn network back online
- [ ] Verify data syncs

### Test 6: Photo Upload

- [ ] Go to Moments or Admin → Photos
- [ ] Click "Take Photo" or "Choose File"
- [ ] Grant camera/file permissions if requested
- [ ] Select or capture a photo
- [ ] Add caption and save
- [ ] Verify photo appears in gallery
- [ ] Check IndexedDB (DevTools → Application → IndexedDB)
- [ ] Photo should be stored as base64

### Test 7: Push Notifications (if FCM configured)

- [ ] From admin panel, try sending notification to a user
- [ ] If user has granted notification permission, they should receive it
- [ ] Notification should appear even if app is closed
- [ ] Clicking notification should open the app

### Test 8: Admin Controls

- [ ] Test changing admin PIN
- [ ] Test resetting user PIN
- [ ] Test adding/removing photos
- [ ] Test viewing usage analytics
- [ ] Test export/import data functionality

## 🔍 Troubleshooting

### Issue: "Permission Denied" errors in console

**Solution:**
```bash
# Redeploy Firestore rules
firebase deploy --only firestore:rules

# Check rules in Firebase Console
```

### Issue: Functions not callable / CORS errors

**Solution:**
```bash
# Ensure functions are deployed
firebase deploy --only functions

# Check function logs
firebase functions:log

# Verify function region matches your app region
```

### Issue: Install prompt not showing

**Causes:**
- App must be served over HTTPS
- User may have already dismissed
- Browser may not support PWA install
- Manifest.json may have errors

**Solution:**
```bash
# Check manifest
curl https://your-app.web.app/manifest.webmanifest

# Check service worker
curl https://your-app.web.app/service-worker.js

# Try in different browser
# Clear site data and try again
```

### Issue: Photos not uploading

**Solution:**
- Check browser storage quota
- Verify IndexedDB is accessible (not in private mode)
- Check for console errors
- Try smaller image size

### Issue: Admin cannot access user management

**Solution:**
1. Verify admin email in Firestore users collection
2. Check `isAdmin: true` is set
3. Redeploy functions if recently changed
4. Check Firebase console for function errors

### Issue: User disabled but still has access

**Solution:**
```bash
# Check Firestore rules are deployed
firebase deploy --only firestore:rules

# Verify disabled function executed
firebase functions:log --only adminDisableUser

# Check user document in Firestore
# Should have isActive: false
```

## 📊 Monitoring

### Firebase Console Checks

1. **Authentication**
   - Monitor user signups
   - Check for suspicious activity
   - Review sign-in methods

2. **Firestore Usage**
   - Monitor read/write operations
   - Check quota usage
   - Review security rule matches

3. **Cloud Functions**
   - Check execution counts
   - Monitor errors
   - Review logs for issues

4. **Hosting**
   - Monitor bandwidth usage
   - Check for 404s
   - Review analytics

### Add Firebase Analytics (Optional)

```javascript
// In src/main.tsx
import { getAnalytics } from 'firebase/analytics';

const analytics = getAnalytics(firebaseApp);
```

## 🔐 Security Best Practices

### 1. Change Default Admin PIN

```javascript
// First login as admin, then:
// Admin Panel → Change Admin PIN
// Use a strong 6-digit PIN
```

### 2. Enable Email Verification

In Firebase Console:
- Authentication → Templates → Email verification
- Customize template
- Enable verification requirement in code

### 3. Set Up Rate Limiting

Add to functions:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### 4. Regular Backups

```bash
# Export Firestore data
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)

# Schedule regular exports
# Set up in Google Cloud Console
```

### 5. Monitor Auth Activity

Set up alerts in Firebase Console:
- Unusual login patterns
- Multiple failed attempts
- New user signups

## 📈 Performance Optimization

### 1. Image Optimization

Consider adding image compression:
```bash
npm install browser-image-compression
```

### 2. Lazy Loading

Already implemented for admin pages. Consider adding for:
- Photo galleries
- Large lists
- Charts/analytics

### 3. IndexedDB Cleanup

Schedule periodic cleanup of old data:
```javascript
// In src/utils/db.ts
export async function cleanupOldData() {
  // Remove data older than 1 year
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  // Implement cleanup logic
}
```

### 4. Service Worker Optimization

Update caching strategy if needed in `vite.config.ts`

## 🚀 Production Checklist

Before going live:

- [ ] Firebase project in production mode
- [ ] All environment variables set correctly
- [ ] Firestore rules deployed and tested
- [ ] Storage rules deployed and tested
- [ ] Functions deployed and tested
- [ ] Admin PIN changed from default
- [ ] Email verification enabled (optional)
- [ ] Analytics configured
- [ ] Error monitoring set up
- [ ] Backup strategy implemented
- [ ] SSL certificate valid (automatic with Firebase)
- [ ] Custom domain configured (if applicable)
- [ ] Terms of service added
- [ ] Privacy policy added
- [ ] Contact information for support
- [ ] Tested on multiple devices/browsers

## 🎯 Post-Deployment

### Monitor First Week

1. **Check Error Logs Daily**
   ```bash
   firebase functions:log --limit 100
   ```

2. **Monitor User Signups**
   - Check Firebase Auth console
   - Verify user profiles created correctly

3. **Test Admin Controls**
   - Ensure all admin functions work
   - Test user management features

4. **Verify Data Sync**
   - Check Firestore for user data
   - Verify background sync working

5. **Performance**
   - Check page load times
   - Monitor bandwidth usage
   - Review user feedback

### Regular Maintenance

- **Weekly:** Review error logs
- **Monthly:** Check quota usage and costs
- **Quarterly:** Review and update dependencies
- **As needed:** Deploy new features/fixes

## 🆘 Emergency Procedures

### If App Goes Down

1. Check Firebase Status: https://status.firebase.google.com/
2. Check function logs: `firebase functions:log`
3. Verify hosting is up: `curl https://your-app.web.app`
4. Check Firestore rules aren't blocking
5. Review recent deployments

### If Security Issue Detected

1. Immediately disable affected user: Firebase Auth Console
2. Review Firestore security rules
3. Check function logs for suspicious activity
4. Update rules if needed: `firebase deploy --only firestore:rules`
5. Notify affected users

### If Costs Spike

1. Check Firebase usage dashboard
2. Review Firestore queries (may need indexing)
3. Check for runaway functions
4. Implement rate limiting
5. Consider caching strategies

## 📝 Support

For help:
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support
- Stack Overflow: Tag [firebase]
- PWA Documentation: https://web.dev/progressive-web-apps/

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Users can sign up and login
- ✅ Installation prompt works on all devices
- ✅ App works offline
- ✅ Admin can manage users
- ✅ Photos can be uploaded
- ✅ No errors in console
- ✅ All pages load quickly
- ✅ Data persists across sessions

---

**Made with 💜 for Violet**

Last updated: May 21, 2026
