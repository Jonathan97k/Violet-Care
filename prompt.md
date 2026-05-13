# VioletCare — Full Build Prompt

Build a **premium installable Progressive Web App (PWA)** called **VioletCare**.

This is a private personal healthcare productivity and wellness app built
as a gift for one person: a nurse named Violet. It must feel handcrafted,
warm, and beautiful — like a premium App Store app made specifically for her.

---

## TECH STACK

- **React** + **TypeScript**
- **Tailwind CSS** for styling
- **Vite** with `vite-plugin-pwa` for PWA support
- **Firebase Authentication** for biometric/WebAuthn login
- **IndexedDB** (via `idb` library) for ALL local data storage
- **Google Apps Script Webhook** for usage tracking (details below)
- **Framer Motion** for animations
- **React Router v6** for navigation
- Deploy target: **Vercel**

---

## DESIGN SYSTEM

This app is built around **violet** — her favourite colour. Every visual
decision should radiate warmth, elegance, and care.

### Color Palette (CSS Variables)
```css
--violet-50:  #f5f3ff
--violet-100: #ede9fe
--violet-200: #ddd6fe
--violet-400: #a78bfa
--violet-500: #8b5cf6
--violet-600: #7c3aed
--violet-700: #6d28d9
--violet-900: #2e1065

--rose-300:   #fda4af   /* warm accent */
--rose-400:   #fb7185

--surface-glass: rgba(255, 255, 255, 0.12)
--surface-card:  rgba(255, 255, 255, 0.08)
```

### Visual Style
- Dark deep violet gradient background: `from-[#1a0533] via-[#2e1065] to-[#1e0a3c]`
- Glassmorphism cards: `backdrop-blur-xl bg-white/10 border border-white/20`
- Soft glowing shadows: `shadow-[0_8px_32px_rgba(139,92,246,0.3)]`
- Rounded corners everywhere: `rounded-2xl` or `rounded-3xl`
- Typography: Use **`Playfair Display`** for headings (Google Fonts) and
  **`DM Sans`** for body text
- Subtle animated gradient mesh in the background (CSS keyframe animation)
- Every interactive element must have a soft violet glow on hover/focus
- Never use harsh whites or flat colors — everything slightly translucent

### Tone
Warm. Elegant. Intimate. Like someone who loves her built this for her.
Never clinical. Never cold. Never generic.

---

## PWA CONFIGURATION

Configure `vite-plugin-pwa` with:

```js
manifest: {
  name: "VioletCare",
  short_name: "VioletCare",
  description: "Your personal wellness companion",
  theme_color: "#6d28d9",
  background_color: "#1a0533",
  display: "standalone",
  orientation: "portrait",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
}
```

- Service worker with offline fallback page
- Background sync for usage events when offline
- Cache-first strategy for static assets
- Show custom "Install VioletCare" prompt modal when `beforeinstallprompt` fires

---

## USAGE TRACKING SYSTEM

This is a private analytics system so the developer (her partner) can see
which features Violet uses most and improve the app over time.

### How it works
Every time Violet opens a section or completes an action, fire a tracking
event silently in the background:

```ts
// utils/track.ts
export async function track(feature: string, action: string) {
  const event = {
    feature,
    action,
    timestamp: new Date().toISOString(),
    timeOfDay: getTimeOfDay(), // "morning" | "afternoon" | "night"
  };

  // Queue in IndexedDB if offline, flush when online
  await queueOrSend(event);
}

async function send(event) {
  await fetch("YOUR_GOOGLE_APPS_SCRIPT_WEBHOOK_URL", {
    method: "POST",
    body: JSON.stringify(event),
  });
}
```

### Events to track
Call `track(feature, action)` for:
- `track("Dashboard", "opened")`
- `track("BMI Calculator", "calculated")`
- `track("Shift Planner", "shift_added")`
- `track("Wellness", "hydration_logged")`
- `track("Wellness", "breathing_completed")`
- `track("Wellness", "mood_logged")`
- `track("Notes", "note_created")`
- `track("Messages", "message_revealed")`
- `track("Special Moments", "opened")`
- `track("Nurse Tools", section_name)`

Tracking must be **silent** — no UI, no loading indicators. Fire and forget.
Never block the UI for tracking.

---

## AUTHENTICATION — BIOMETRIC + PIN (No Backend, No Firebase)

There is no server, no accounts, no sign-up. Everything lives on her device.

### First Launch Flow
1. Splash screen (2 seconds)
2. Welcome screen: "Hello, Violet 💜" with a brief warm description
3. "Set Up Your App" button
4. Ask her to create a **6-digit PIN** (entered twice to confirm)
5. Hash the PIN with **SHA-256** and store it in IndexedDB under key `auth.pin`
6. Attempt to register **biometric** (WebAuthn) — if device supports it:
   - Prompt: "Would you like to use fingerprint / Face ID?"
   - On success: store credential ID in IndexedDB under `auth.credential`
7. Redirect to Dashboard

### Return Visit Flow
1. Splash screen
2. "Welcome back, Violet 💜"
3. If biometric credential exists → trigger fingerprint/Face ID prompt automatically
4. On biometric success → enter app
5. If biometric fails or not set up → show PIN entry screen
6. Hash entered PIN → compare to stored hash → on match, enter app

### Implementation (no external libraries needed)

```ts
// utils/auth.ts

// Hash PIN using built-in browser crypto
export async function hashPIN(pin: string): Promise {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Register biometric
export async function registerBiometric(): Promise {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "VioletCare" },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: "violet",
          displayName: "Violet"
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: { authenticatorAttachment: "platform" },
        timeout: 60000,
      }
    }) as PublicKeyCredential;

    // Store credential ID locally
    await saveToIndexedDB("auth", {
      key: "credential",
      id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
    });
    return true;
  } catch {
    return false; // Device doesn't support it — fall back to PIN only
  }
}

// Verify biometric
export async function verifyBiometric(storedCredentialId: string): Promise {
  try {
    const credId = Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0));
    await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: credId, type: "public-key" }],
        timeout: 60000,
      }
    });
    return true;
  } catch {
    return false;
  }
}
```

### Auth State (stored entirely in IndexedDB)
```ts
// IndexedDB "auth" store keys:
// auth.pin        → SHA-256 hashed PIN string
// auth.credential → base64 WebAuthn credential ID
// auth.setupDone  → boolean, true after first launch complete
```

### Graceful Fallbacks
- Device has no biometric support → PIN only, no mention of biometrics
- Wrong PIN → "Incorrect PIN. Try again." (no lockout on first 3 attempts, then 30s cooldown)
- Forgot PIN → Show message: "Contact the person who set this up for you 💜"
  (since there's no backend reset — this is intentional for privacy)

---

## APP STRUCTURE & NAVIGATION

Fixed bottom navigation bar with smooth active state transitions:

| Icon | Label | Route |
|------|-------|-------|
| 🏠 | Home | `/` |
| 📅 | Planner | `/planner` |
| 🩺 | Tools | `/tools` |
| 💜 | Wellness | `/wellness` |
| 💌 | Messages | `/messages` |
| ✨ | Moments | `/moments` |
| 👤 | Profile | `/profile` |

Bottom nav style:
- Glassmorphism background
- Active tab has violet glow + scale animation
- Smooth page transitions with Framer Motion `AnimatePresence`

---

## SCREEN 1 — SPLASH SCREEN

- Deep violet background with animated gradient mesh
- VioletCare logo center screen (stylized V with a small heart or flower)
- Soft pulse animation on the logo
- "VioletCare" in Playfair Display
- Tagline: *"Made with love, just for you"*
- Fade out after 2 seconds → Auth screen

---

## SCREEN 2 — DASHBOARD HOME

### Header
- Dynamic greeting (Good Morning / Good Afternoon / Good Evening)
- "Violet 💜" in Playfair Display, large and warm
- Current date formatted beautifully: "Wednesday, 14 May"
- Live clock updating every second

### Daily Quote Card
- Rotating nursing/wellness quotes
- Soft violet glassmorphism card
- New quote each day (array of 30+ quotes hardcoded)

### Wellness Ring
- Circular progress ring showing today's wellness score
- Score calculated from: hydration % + mood logged + sleep logged
- Animated on mount

### Quick Access Grid (2x3)
Beautiful tap cards for:
- 📅 My Shifts
- 🩺 Nurse Tools
- 💧 Wellness
- 📝 Notes
- 💌 Messages
- ✨ Moments

Each card: glassmorphism, violet glow on tap, icon + label + subtle stat

### Upcoming Reminders Strip
- Horizontal scroll
- Shows next shift, medication reminders, hydration nudge

---

## SCREEN 3 — SHIFT PLANNER

Full working shift scheduler.

### Calendar View
- Monthly calendar with shift indicators (colored dots)
- Tap a day to see/add shifts
- Swipe left/right to change month (Framer Motion)

### Shift Card
Each shift shows:
- Date + Day
- Start time → End time
- Ward/Unit (optional label)
- Shift type: Day / Night / On-Call
- Color coded: violet = day, deep indigo = night, rose = on-call

### Add/Edit Shift Modal
- Beautiful bottom sheet (slides up)
- Fields: Date, Start Time, End Time, Ward, Type, Notes
- Save to IndexedDB

### Stats Strip
- This week: X shifts, X hours
- This month: X shifts, X hours
- Average shift length

---

## SCREEN 4 — NURSE TOOLS

Clean tool grid with categories.

### BMI Calculator
- Input: Weight (kg) + Height (cm)
- Output: BMI value + category (Underweight / Normal / Overweight / Obese)
- Visual gauge/arc showing result
- Real formula: `BMI = weight / (height_in_m²)`

### IV Drip Rate Calculator
- Inputs: Volume (mL), Time (hours), Drop factor (10/15/20 drops/mL)
- Output: Drops per minute
- Formula: `(Volume × Drop factor) / (Time × 60)`
- Show step-by-step calculation

### Medication Reminder Scheduler
- Add medication: name, dose, frequency, time
- Stored in IndexedDB
- Triggers browser Notification API at set times
- List view with edit/delete

### Patient Quick Notes
- Fast note entry: tap + type + save
- Each note: timestamp, content, optional tag
- Swipe to delete
- Stored in IndexedDB

### Clinical Reference Notes
- Searchable saved notes (normal vitals ranges, common drug doses, etc.)
- Preloaded with 10 useful nursing reference cards
- User can add custom ones

### Countdown Timer + Stopwatch
- Clean circular timer UI
- Preset buttons: 5m, 10m, 15m, 30m
- Custom input
- Stopwatch with lap

---

## SCREEN 5 — WELLNESS CENTER

Her personal wellness space. This should feel like a spa, not a hospital.

### Hydration Tracker
- Daily goal: 8 glasses (2L)
- Tap water drop button to log each glass
- Animated fill ring showing progress
- Persists per day in IndexedDB
- Resets at midnight

### Mood Tracker
- 5 emoji mood scale: 😔 😕 😐 🙂 😊
- One check-in per day
- 7-day mood history chart (simple bar chart)

### Sleep Tracker
- Log: Bedtime + Wake time
- Auto-calculate hours slept
- Quality rating: 1–5 stars
- 7-day sleep chart

### Stress Check
- Slider 1–10
- Brief reflection text field
- History saved

### Guided Breathing
- 4-7-8 breathing technique
- Animated expanding/contracting circle
- Phases: Inhale 4s → Hold 7s → Exhale 8s
- Session: 4 cycles
- Mark complete → fires `track("Wellness", "breathing_completed")`

### Reflection Journal
- Daily journal entry
- One entry per day (edit if same day)
- Beautiful text area, auto-save on blur
- Calendar dot indicators for days with entries

### Wellness Insights
- Weekly summary card
- "You logged your mood X/7 days this week"
- "Average sleep: X hours"
- Gentle encouragement message

---

## SCREEN 6 — MESSAGES (Encouragement Center)

A private space filled with love and encouragement.

This section contains pre-written cards from her partner.

### Daily Card
- One card revealed per day
- Beautiful animated card flip/reveal
- Message in elegant typography
- After reading: soft confetti or petal animation

### Message Library
- Grid of locked cards
- Tap to reveal one at a time
- Each card: warm background gradient, italic quote, small heart
- 20 pre-written messages covering:
  - Hard shift encouragement
  - General love notes
  - Affirmations about her strength as a nurse
  - Pride messages
  - Rest and self-care reminders

Sample messages (write 20 total in this tone):
> *"You carry so much, yet you never let it break you. That quiet strength — I see it every single day."*

> *"Every patient who leaves feeling a little better — that's you. That's your hands, your voice, your care."*

> *"On the days it feels like too much, remember: you were made for this. And I'm so proud of you."*

### Random Encouragement Button
- "I Need A Boost 💜" button
- Pulls a random affirmation from a pool of 40
- Slide-up animated card

---

## SCREEN 7 — SPECIAL MOMENTS

A private emotional timeline of things that matter.

### Milestone Timeline
- Vertical scroll timeline
- Each entry: date, title, description, optional emoji
- Beautiful card design, alternating left/right layout

### Countdowns
- Add an upcoming special date: Anniversary, Birthday, Event
- Each shows: event name + days remaining
- Animated countdown cards

### Anniversary Tracker
- Preloaded with their relationship anniversary (she sets it on first launch)
- Always visible at the top of Moments
- Shows: time together in years/months/days
- Beautiful hero card

### Photo Memories
- Simple photo gallery (stored in IndexedDB as base64)
- Add photo + caption + date
- Masonry grid layout
- Tap to open fullscreen

---

## SCREEN 8 — NOTES HUB

### Features
- Create / Edit / Delete notes
- Categories: Work, Personal, Clinical, Ideas
- Pin important notes (pinned always show first)
- Search by title or content
- Sort by: Recent / Pinned / Category

### Note Editor
- Clean full-screen editor
- Title + body
- Category tag selector
- Auto-save every 3 seconds
- Character count

---

## SCREEN 9 — PROFILE & SETTINGS

### Profile Section
- Display name: Violet
- Profile photo (stored locally)
- Relationship anniversary date (shows in Moments)
- Change PIN

### Notification Preferences
- Toggle notifications per category:
  - Shift reminders
  - Medication reminders
  - Hydration nudges
  - Daily encouragement card
  - Wellness check-in

### App Settings
- Dark mode toggle (default: dark — the deep violet theme)
- Clear all data (with confirmation)

### About
- "Made with 💜 by [his name]"
- App version

---

## ANIMATIONS (Framer Motion)

Use these consistently:

```ts
// Page transition
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20 }
};

// Card hover
const cardHover = {
  scale: 1.02,
  boxShadow: "0 12px 40px rgba(139,92,246,0.4)"
};

// Staggered list
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } }
};
```

- Cards float in with stagger on page load
- Bottom sheet modals slide up with spring physics
- Progress rings animate from 0 on mount
- Breathing circle pulses smoothly with keyframes
- Number counters animate up

---

## INDEXEDDB SCHEMA

Use the `idb` npm library.

```ts
// db.ts
const db = await openDB("violetcare", 1, {
  upgrade(db) {
    db.createObjectStore("shifts",       { keyPath: "id" });
    db.createObjectStore("notes",        { keyPath: "id" });
    db.createObjectStore("medications",  { keyPath: "id" });
    db.createObjectStore("hydration",    { keyPath: "date" }); // key = YYYY-MM-DD
    db.createObjectStore("mood",         { keyPath: "date" });
    db.createObjectStore("sleep",        { keyPath: "date" });
    db.createObjectStore("journal",      { keyPath: "date" });
    db.createObjectStore("moments",      { keyPath: "id" });
    db.createObjectStore("photos",       { keyPath: "id" });
    db.createObjectStore("countdowns",   { keyPath: "id" });
    db.createObjectStore("usage_queue",  { keyPath: "id", autoIncrement: true });
    db.createObjectStore("settings",     { keyPath: "key" });
    db.createObjectStore("auth",         { keyPath: "key" });
  }
});
```

---

## FOLDER STRUCTURE

```
src/
├── components/
│   ├── ui/           # Reusable: Button, Card, Modal, BottomSheet, Input
│   ├── layout/       # BottomNav, PageWrapper, Header
│   └── shared/       # WellnessRing, QuoteCard, TrackWrapper
├── pages/
│   ├── Splash.tsx
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Planner.tsx
│   ├── Tools.tsx
│   ├── Wellness.tsx
│   ├── Messages.tsx
│   ├── Moments.tsx
│   ├── Notes.tsx
│   └── Profile.tsx
├── utils/
│   ├── db.ts         # IndexedDB helpers
│   ├── track.ts      # Usage tracking
│   ├── notifications.ts
│   └── calculations.ts # BMI, IV rate
├── hooks/
│   ├── useDB.ts
│   ├── useAuth.ts
│   └── useNotifications.ts
├── data/
│   ├── quotes.ts     # 30 daily quotes
│   ├── messages.ts   # 40 encouragement messages
│   └── references.ts # Clinical reference cards
├── firebase.ts
└── main.tsx
```

---

## GOOGLE SHEETS TRACKING SETUP

In `track.ts`, POST to a Google Apps Script web app URL:

```ts
const WEBHOOK_URL = import.meta.env.VITE_TRACKING_WEBHOOK;

export async function track(feature: string, action: string) {
  const payload = {
    feature,
    action,
    timestamp: new Date().toISOString(),
    timeOfDay: getTimeOfDay(),
    date: new Date().toLocaleDateString(),
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Queue for later if offline
    await queueEvent(payload);
  }
}
```

The Google Apps Script (separate setup):
```js
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([data.date, data.timestamp, data.feature, data.action, data.timeOfDay]);
  return ContentService.createTextOutput("ok");
}
```

---

## FINAL QUALITY CHECKLIST

Before considering any section complete:

- [ ] Does it look beautiful on a phone screen (375px wide)?
- [ ] Do all animations feel smooth, never janky?
- [ ] Is the violet color palette consistent everywhere?
- [ ] Does all data actually persist in IndexedDB?
- [ ] Is tracking firing on every key action?
- [ ] Do glassmorphism cards look premium, not muddy?
- [ ] Is the typography hierarchy clear and elegant?
- [ ] Do loading states exist for async operations?
- [ ] Are empty states beautiful, not just "No data found"?
- [ ] Does the whole app feel like it was made with love?

---

## EMPTY STATE MESSAGES (use throughout)

Instead of generic "No items yet", use warm copy:

- Shifts: *"Your schedule is clear — enjoy the rest, Violet 💜"*
- Notes: *"A blank page, full of possibility"*
- Journal: *"How are you feeling today? This is your space."*
- Moments: *"Your story is just beginning ✨"*
- Photos: *"Add a memory worth keeping 💜"*

---

Build this section by section. Start with:
1. Project setup (Vite + React + TS + Tailwind + PWA plugin)
2. Design system (CSS variables, base components, fonts)
3. Splash screen + Auth flow
4. Dashboard

Then proceed through each section in order.