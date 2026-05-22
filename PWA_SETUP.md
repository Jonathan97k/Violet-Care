# VioletCare PWA Setup Guide

## 🎯 Overview

VioletCare is now a complete Progressive Web App (PWA) with:
- Email-based authentication
- Required app installation for access
- Admin control portal
- Offline functionality
- Photo/media upload capabilities
- Full app-like experience

## 📋 Prerequisites

1. **Firebase Project Setup**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use existing)
   - Enable Authentication with Email/Password provider
   - Create Firestore database
   - Get your Firebase config credentials

2. **Admin Email**
   - The admin email is hardcoded as: `kaphirij9@gmail.com`
   - This email will have special admin privileges

## 🚀 Installation

### 1. Install Dependencies

```bash
npm install firebase
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore Security Rules

Add these security rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Allow users to read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow admins to read/write all users
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      
      // Allow user creation during signup
      allow create: if request.auth != null;
      
      // Allow users to update their own profile (limited fields)
      allow update: if request.auth != null && 
        request.auth.uid == userId &&
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['isAdmin', 'isActive']);
    }
    
    // User data collections (shifts, notes, photos, etc.)
    match /userData/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Firebase Cloud Functions (Optional but Recommended)

For production, implement these Cloud Functions for admin controls:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Admin: Get all users
exports.adminGetAllUsers = functions.https.onCall(async (data, context) => {
  // Verify admin
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const adminDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  if (!adminDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be admin');
  }
  
  const usersSnapshot = await admin.firestore().collection('users').get();
  return usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
});

// Admin: Disable user
exports.adminDisableUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const adminDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  if (!adminDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be admin');
  }
  
  const { uid } = data;
  await admin.auth().updateUser(uid, { disabled: true });
  await admin.firestore().doc(`users/${uid}`).update({
    isActive: false,
    disabledAt: admin.firestore.FieldValue.serverTimestamp(),
    disabledBy: context.auth.uid
  });
  
  return { success: true };
});

// Admin: Enable user
exports.adminEnableUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const adminDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  if (!adminDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be admin');
  }
  
  const { uid } = data;
  await admin.auth().updateUser(uid, { disabled: false });
  await admin.firestore().doc(`users/${uid}`).update({
    isActive: true,
    disabledAt: admin.firestore.FieldValue.delete(),
    disabledBy: admin.firestore.FieldValue.delete()
  });
  
  return { success: true };
});

// Admin: Send notification
exports.adminSendNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const adminDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  if (!adminDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be admin');
  }
  
  const { uid, message } = data;
  
  // Get user's FCM token and send notification
  const userDoc = await admin.firestore().doc(`users/${uid}`).get();
  const fcmToken = userDoc.data()?.fcmToken;
  
  if (fcmToken) {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Message from Admin',
        body: message
      },
      webpush: {
        fcmOptions: {
          link: '/'
        }
      }
    });
  }
  
  return { success: true };
});

// On user creation, set up profile
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const isAdmin = user.email === 'kaphirij9@gmail.com';
  
  await admin.firestore().doc(`users/${user.uid}`).set({
    email: user.email,
    displayName: user.email?.split('@')[0] || 'User',
    isActive: true,
    isAdmin,
    deviceInstalled: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

Deploy functions:
```bash
cd functions
npm install
firebase deploy --only functions
```

## 🎨 Features

### User Flow

1. **Email Signup/Login** (`/email-auth`)
   - User signs up with email and password
   - Admin email automatically gets admin privileges
   - After authentication, user is redirected to install prompt

2. **Install Prompt** (`/install-prompt`)
   - User MUST install the app to continue
   - Shows device-specific installation instructions
   - Detects when app is installed and proceeds

3. **Onboarding** (`/onboarding`)
   - User sets up their 6-digit PIN
   - Can optionally enable biometric authentication
   - Sets up preferences

4. **Main App** (Dashboard, Tools, etc.)
   - Full PWA experience with offline support
   - Photo upload capabilities across the app
   - Background sync for data

### Admin Portal

The admin can access special features:

1. **User Management** (`/admin/users`)
   - View all registered users
   - See user status (active/disabled/installed)
   - Disable/enable user accounts
   - Send push notifications to users
   - View user activity

2. **Original Admin Features** (`/admin`)
   - Reset Violet's PIN
   - Manage photos, letters, pings
   - View usage analytics
   - Data import/export

### Admin Access

To access admin portal:
1. Tap the 💜 logo 7 times on the login screen
2. Enter admin PIN (default: `000000`, should be changed immediately)
3. Access admin dashboard and user management

## 📱 PWA Capabilities

### Installation

The app includes:
- Automatic install prompt handling
- Manual installation instructions for all devices
- Standalone display mode (looks like a native app)
- Custom app icons and splash screen

### Offline Support

- Full offline functionality using IndexedDB
- Service worker caches all assets
- Background sync for data when online
- Offline indicator shown when disconnected

### Photo/Media Upload

- Camera access for taking photos
- Gallery access for selecting existing photos
- Image compression before storage
- Offline storage with sync when online
- Used in:
  - Moments page
  - Admin photo gallery
  - Profile pictures
  - Any future features

### Sharing & File Handling

The app can:
- Receive shared photos from other apps
- Open image files directly
- Handle custom protocol (`web+violetcare://`)

## 🔒 Security

1. **Authentication**
   - Firebase Authentication handles all auth
   - Email verification can be enabled
   - Session management with timeout

2. **Authorization**
   - Admin-only routes protected
   - User data isolated by UID
   - Firestore security rules enforce access

3. **Data Protection**
   - Sensitive data obfuscated in IndexedDB
   - HTTPS only in production
   - CSP headers configured

## 🚀 Deployment

### Option 1: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase in project
firebase init hosting

# Build the app
npm run build

# Deploy
firebase deploy --only hosting
```

### Option 2: Vercel (Already configured)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 3: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

## 🧪 Testing

### Test PWA Features

1. **Installation**
   - Visit app in browser
   - Check for install prompt
   - Install and verify standalone mode

2. **Offline Mode**
   - Install app
   - Turn off network
   - Verify app still works
   - Check offline indicator appears

3. **Admin Controls**
   - Create test user account
   - Login as admin
   - Disable/enable test user
   - Verify user cannot access when disabled

4. **Photo Upload**
   - Go to Moments page
   - Try camera capture
   - Try file selection
   - Verify photos save and display

## 📱 Device Support

- ✅ Android (Chrome, Edge)
- ✅ iOS/iPadOS (Safari 16.4+)
- ✅ Desktop (Chrome, Edge, Safari)
- ⚠️ iOS requires Safari - other browsers use Safari engine

## 🐛 Troubleshooting

### Install Prompt Not Showing

- Ensure HTTPS is enabled
- Check manifest.json is accessible
- Verify service worker registered
- User may have previously dismissed

### Firebase Not Connecting

- Check environment variables are set
- Verify Firebase config in console
- Check browser console for errors
- Ensure Firestore rules are configured

### Photos Not Uploading

- Check storage quota (browser storage limits)
- Verify IndexedDB is accessible
- Try smaller image sizes
- Check for console errors

### Admin Cannot Control Users

- Verify admin email matches code
- Check Firestore security rules
- Ensure Cloud Functions are deployed
- Check admin authentication

## 📚 Additional Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Workbox (Service Worker)](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://web.dev/add-manifest/)

## 🆘 Support

For issues or questions:
1. Check browser console for errors
2. Verify all environment variables are set
3. Review Firebase console for auth/firestore issues
4. Check network tab for failed requests

## 📝 Notes

- Default admin PIN is `000000` - **CHANGE IMMEDIATELY**
- Admin email is hardcoded - update in `src/utils/firebase.ts` if needed
- Photo storage uses IndexedDB - has browser limits (typically ~100MB+)
- For production, implement proper backup/sync to Firestore
- Consider adding email verification for additional security
- Implement rate limiting on Cloud Functions for production use

## 🎯 Next Steps

1. **Set up Firebase project**
2. **Configure environment variables**
3. **Deploy Cloud Functions** (for production admin controls)
4. **Test signup and installation flow**
5. **Change default admin PIN**
6. **Deploy to hosting platform**
7. **Test on real devices**
8. **Enable email verification** (optional)
9. **Set up monitoring/analytics**
10. **Create backup strategy for user data**

---

Made with 💜 for Violet
