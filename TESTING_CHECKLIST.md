# VioletCare Testing Checklist

## 🎯 Pre-Deployment Testing

Use this checklist to ensure everything works before deploying to production.

---

## 1. Authentication Tests

### Email Signup
- [ ] Can navigate to `/email-auth`
- [ ] Can enter valid email and password
- [ ] Form validation works (min 6 chars password)
- [ ] Password toggle button works
- [ ] Signup creates user in Firebase Auth
- [ ] User profile created in Firestore
- [ ] Non-admin user has `isAdmin: false`
- [ ] Admin email has `isAdmin: true`
- [ ] Redirected to install prompt after signup

### Email Login
- [ ] Can switch to "Sign In" tab
- [ ] Can login with existing credentials
- [ ] Wrong password shows error message
- [ ] Account disabled shows appropriate message
- [ ] Successful login redirects correctly
- [ ] Last login timestamp updated

### Session Management
- [ ] User stays logged in after refresh
- [ ] Session persists in localStorage/sessionStorage
- [ ] User logged out after account disabled
- [ ] Timeout works correctly (if implemented)

---

## 2. Installation Tests

### Install Prompt Page
- [ ] Redirected to `/install-prompt` after auth
- [ ] Shows device-specific instructions
- [ ] Install button appears (on supported browsers)
- [ ] Camera/file selection works for testing
- [ ] Can sign out from install prompt

### Installation Process
- [ ] **Android Chrome:** Install prompt appears
- [ ] **Android Chrome:** "Add to Home Screen" works
- [ ] **iOS Safari:** Manual instructions shown
- [ ] **iOS Safari:** Can add to home screen via share menu
- [ ] **Desktop Chrome:** Install button works
- [ ] **Desktop Edge:** Install works

### Post-Installation
- [ ] App opens in standalone mode (no browser UI)
- [ ] Device marked as installed in Firestore
- [ ] Can access app from home screen
- [ ] App icon displays correctly
- [ ] Splash screen appears on launch
- [ ] Status bar color matches theme

---

## 3. PWA Functionality Tests

### Offline Mode
- [ ] Service worker registers successfully
- [ ] Assets cached on first load
- [ ] App loads when offline
- [ ] Can navigate between pages offline
- [ ] Offline indicator appears when disconnected
- [ ] Data operations queue when offline
- [ ] Queued operations sync when back online

### App Manifest
- [ ] Manifest loads at `/manifest.webmanifest`
- [ ] App name displays correctly
- [ ] Icons load (192x192 and 512x512)
- [ ] Theme color applies to status bar
- [ ] Display mode is "standalone"
- [ ] Orientation is "portrait"

### Service Worker
- [ ] Service worker registered in DevTools
- [ ] Cache storage populated
- [ ] Updates download in background
- [ ] New version prompts user (if implemented)
- [ ] No errors in console

---

## 4. Admin Access Tests

### Admin Login
- [ ] Can tap 💜 logo 7 times on auth screen
- [ ] Redirected to `/admin-login`
- [ ] Can enter admin PIN
- [ ] Wrong PIN shows error
- [ ] Correct PIN grants access
- [ ] Session timeout works
- [ ] Session expiry indicator shows

### Admin Dashboard
- [ ] Can view all admin sections
- [ ] User management link visible
- [ ] Can access original admin features
- [ ] Photo gallery works
- [ ] Usage analytics display
- [ ] Maintenance tools accessible

---

## 5. User Management Tests

### View Users
- [ ] Navigate to `/admin/users`
- [ ] All users listed
- [ ] User stats display correctly
- [ ] Active/disabled status shown
- [ ] Install status visible
- [ ] Last login displayed

### Disable User
- [ ] Can click disable button
- [ ] Confirmation modal appears
- [ ] User disabled in Firebase Auth
- [ ] User profile updated (isActive: false)
- [ ] Disabled user logged out immediately
- [ ] Disabled user cannot login

### Enable User
- [ ] Can re-enable disabled user
- [ ] User enabled in Firebase Auth
- [ ] User profile updated (isActive: true)
- [ ] User can login again
- [ ] All data preserved

### View User Details
- [ ] Can click "View" button
- [ ] User details modal opens
- [ ] All info displays correctly
- [ ] UID shown correctly
- [ ] Dates formatted properly
- [ ] Status badges display

### Send Notification
- [ ] Can click send notification
- [ ] Modal opens with text input
- [ ] Cannot send empty message
- [ ] Notification sent successfully
- [ ] User receives notification (if FCM configured)
- [ ] Notification opens app when clicked

---

## 6. Photo Upload Tests

### Camera Access
- [ ] "Take Photo" button works
- [ ] Browser requests camera permission
- [ ] Camera opens correctly
- [ ] Can capture photo
- [ ] Photo preview displays
- [ ] Captured photo quality acceptable

### File Selection
- [ ] "Choose File" button works
- [ ] File picker opens
- [ ] Can select image file
- [ ] Preview shows selected image
- [ ] Non-image files rejected
- [ ] File size limit enforced (10MB)

### Photo Upload
- [ ] Can add caption
- [ ] Can set date
- [ ] Upload button enabled when photo selected
- [ ] Upload progress shown (if implemented)
- [ ] Photo saved to IndexedDB
- [ ] Photo appears in gallery
- [ ] Photo persists after refresh

### Photo Management
- [ ] Photos display in grid
- [ ] Captions show on hover
- [ ] Dates display correctly
- [ ] Can delete photos
- [ ] Deletion confirmation works
- [ ] Deleted photos removed from IndexedDB

---

## 7. Data Persistence Tests

### Local Storage (IndexedDB)
- [ ] Open DevTools → Application → IndexedDB
- [ ] Database "violetcare" exists
- [ ] All stores created correctly
- [ ] Data saves correctly
- [ ] Data loads on page refresh
- [ ] No data corruption

### Cloud Sync (if implemented)
- [ ] Data syncs to Firestore
- [ ] Sync happens on network reconnect
- [ ] No duplicate data created
- [ ] Conflicts resolved correctly
- [ ] Sync status indicator works

### Data Export/Import
- [ ] Can export data from admin panel
- [ ] Export creates valid JSON
- [ ] Can import data from file
- [ ] Imported data displays correctly
- [ ] All collections restored

---

## 8. Navigation Tests

### Protected Routes
- [ ] Unauthenticated users redirected to `/email-auth`
- [ ] Non-installed users redirected to `/install-prompt`
- [ ] Non-admin users cannot access `/admin`
- [ ] Admin routes require admin session

### Bottom Navigation
- [ ] Bottom nav visible on main pages
- [ ] Bottom nav hidden on auth/install pages
- [ ] Active page highlighted
- [ ] Navigation works correctly
- [ ] Smooth page transitions

### Routing
- [ ] All routes load correctly
- [ ] 404s redirect to home
- [ ] Deep links work when installed
- [ ] Back button works correctly
- [ ] Browser history preserved

---

## 9. Security Tests

### Authentication Security
- [ ] Cannot access app without auth
- [ ] Session tokens secure
- [ ] Passwords not visible in console
- [ ] Auth state persistent but secure

### Firestore Rules
- [ ] Users cannot read other users' data
- [ ] Users cannot write to other users' data
- [ ] Admin can read all user data
- [ ] Cannot escalate privileges
- [ ] Rules deny by default

### Function Security
- [ ] Functions require authentication
- [ ] Admin functions verify admin status
- [ ] Rate limiting works (if implemented)
- [ ] Input validation works
- [ ] No sensitive data in logs

### Data Security
- [ ] Sensitive data obfuscated in IndexedDB
- [ ] No plain text passwords
- [ ] No API keys exposed in frontend
- [ ] HTTPS enforced
- [ ] CSP headers configured

---

## 10. Performance Tests

### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Subsequent loads < 1 second
- [ ] Images load progressively
- [ ] No layout shift during load

### Responsiveness
- [ ] App works on mobile (320px+)
- [ ] App works on tablet (768px+)
- [ ] App works on desktop (1024px+)
- [ ] Touch targets large enough (44x44px min)
- [ ] Text readable without zoom

### Memory Usage
- [ ] No memory leaks (check DevTools)
- [ ] IndexedDB usage reasonable
- [ ] Cache size within limits
- [ ] No performance degradation over time

---

## 11. Cross-Browser Testing

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] PWA install works
- [ ] Offline mode works
- [ ] No console errors

### Safari (iOS)
- [ ] All features work
- [ ] Can add to home screen
- [ ] Standalone mode works
- [ ] Camera access works
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Service worker works
- [ ] IndexedDB works
- [ ] No console errors

---

## 12. Device Testing

### Android
- [ ] Install via Chrome
- [ ] Standalone mode works
- [ ] Camera capture works
- [ ] Notifications work (if implemented)
- [ ] Back button behavior correct

### iOS
- [ ] Install via Safari
- [ ] Standalone mode works
- [ ] Camera capture works
- [ ] Status bar color correct
- [ ] No address bar in standalone

### Desktop
- [ ] Install works
- [ ] Responsive layout
- [ ] Keyboard navigation works
- [ ] Mouse interactions smooth

---

## 13. Error Handling Tests

### Network Errors
- [ ] Graceful degradation when offline
- [ ] Error messages user-friendly
- [ ] Retry logic works
- [ ] Queue system functional

### Auth Errors
- [ ] Invalid credentials show message
- [ ] Account disabled shows message
- [ ] Session expired handled
- [ ] Permission denied handled

### Function Errors
- [ ] Function failures show messages
- [ ] Timeout handled gracefully
- [ ] Rate limit handled
- [ ] Unknown errors logged

---

## 14. Accessibility Tests

### Keyboard Navigation
- [ ] Can tab through all interactive elements
- [ ] Focus visible on all elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals

### Screen Reader
- [ ] Images have alt text
- [ ] Buttons have labels
- [ ] Forms have labels
- [ ] Page titles descriptive

### Color Contrast
- [ ] Text readable (WCAG AA)
- [ ] Interactive elements visible
- [ ] Focus indicators clear
- [ ] Error messages readable

---

## 15. Production Readiness

### Configuration
- [ ] All environment variables set
- [ ] Firebase project in production mode
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate valid
- [ ] Analytics configured

### Documentation
- [ ] README updated
- [ ] Deployment guide complete
- [ ] API documentation available
- [ ] User guide created (if needed)

### Monitoring
- [ ] Error tracking configured
- [ ] Analytics tracking key events
- [ ] Function logs accessible
- [ ] Alerts set up

### Legal
- [ ] Terms of service added
- [ ] Privacy policy added
- [ ] Cookie notice (if applicable)
- [ ] Contact information visible

---

## 📊 Test Results Summary

Date: ________________
Tester: ________________

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Authentication | ☐ | ☐ | |
| Installation | ☐ | ☐ | |
| PWA Features | ☐ | ☐ | |
| Admin Access | ☐ | ☐ | |
| User Management | ☐ | ☐ | |
| Photo Upload | ☐ | ☐ | |
| Data Persistence | ☐ | ☐ | |
| Navigation | ☐ | ☐ | |
| Security | ☐ | ☐ | |
| Performance | ☐ | ☐ | |
| Cross-Browser | ☐ | ☐ | |
| Device Testing | ☐ | ☐ | |
| Error Handling | ☐ | ☐ | |
| Accessibility | ☐ | ☐ | |
| Production Ready | ☐ | ☐ | |

**Overall Status:** ☐ Ready for Production ☐ Needs Work

**Critical Issues Found:**
1. ________________________________
2. ________________________________
3. ________________________________

**Minor Issues Found:**
1. ________________________________
2. ________________________________
3. ________________________________

**Additional Notes:**
_________________________________________
_________________________________________
_________________________________________

---

**Tested By:** ________________
**Date:** ________________
**Version:** ________________

---

Made with 💜 for Violet
