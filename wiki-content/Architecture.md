# Architecture 🏗️

Technical overview of StepSyncAI's architecture, design decisions, and implementation details.

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │              StepSyncAI PWA                        │ │
│  │                                                    │ │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────┐ │ │
│  │  │   UI Layer   │  │  Logic Layer │  │  Storage │ │ │
│  │  │   (HTML/CSS) │→│  (JavaScript)│→│ (localStorage)│ │
│  │  └──────────────┘  └─────────────┘  └──────────┘ │ │
│  │                                                    │ │
│  │  ┌──────────────┐  ┌─────────────┐               │ │
│  │  │  Chart.js    │  │   Service   │               │ │
│  │  │ Visualization│  │   Worker    │               │ │
│  │  └──────────────┘  └─────────────┘               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
           │                      │
           │                      │
           ▼                      ▼
    ┌─────────────┐      ┌──────────────┐
    │   CDN       │      │   GitHub     │
    │ (Chart.js)  │      │   Pages      │
    └─────────────┘      └──────────────┘
```

---

## Technology Stack

### Frontend
- **Language**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with CSS Variables
- **Visualization**: Chart.js 4.4.1
- **Icons**: Emoji (no icon library dependencies)

### Storage
- **Client-Side**: Browser localStorage API
- **Data Format**: JSON
- **Capacity**: 5-10MB (browser dependent)
- **Persistence**: Permanent (until user clears)

### Progressive Web App (PWA)
- **Service Worker**: Custom v4 implementation
- **Caching Strategy**: Cache-first with network fallback
- **Manifest**: Web App Manifest for installability
- **Offline Support**: Full offline functionality

### Testing & CI/CD
- **Test Framework**: Jest-compatible test suite
- **Coverage**: 82.55% (1,927 tests)
- **CI**: GitHub Actions (Node 18.x, 20.x)
- **Linting**: ESLint (planned)

### Hosting
- **Platform**: GitHub Pages
- **CDN**: GitHub's global CDN
- **SSL**: Automatic HTTPS
- **Domain**: https://isaloum.github.io/StepSyncAI

---

## Architecture Patterns

### 1. Monolithic Single-Page Application (SPA)
**Current Implementation**: All code in `docs/index.html` (1,800+ lines)

**Rationale**:
- ✅ **Zero dependencies** except Chart.js CDN
- ✅ **Instant loading** (single HTTP request)
- ✅ **Simple deployment** (no build process)
- ✅ **Easy auditing** (all code in one file)

**Future Improvement**:
- 🔄 Modular architecture with separate JS/CSS files
- 🔄 Component-based structure
- 🔄 Next.js migration (already prototyped in `pages/index.jsx`)

### 2. Client-Side Only Architecture
**Design Decision**: No backend server

**Benefits**:
- 🔒 **Privacy**: Data never leaves user's device
- 💰 **Zero cost**: No server hosting fees
- ⚡ **Speed**: No network latency
- 🌍 **Works everywhere**: No geo-restrictions

**Tradeoffs**:
- ❌ No cross-device sync
- ❌ No cloud backup
- ❌ Limited to localStorage capacity (5-10MB)

**Planned Enhancement**:
- Optional user-controlled sync (IndexedDB + WebRTC or IPFS)
- Client-side encryption for export files

### 3. Progressive Enhancement
**Strategy**: Works without JavaScript, enhanced with JS

**Levels**:
1. **Base HTML**: Semantic structure (accessible)
2. **CSS**: Dark/light theme, responsive layout
3. **JavaScript**: Interactivity, data persistence
4. **PWA**: Offline support, installability

---

## Data Architecture

### localStorage Schema

All data is stored in browser localStorage with the `stepsync_` prefix:

```javascript
// Data Collections (Arrays)
stepsync_moods        → [ { date, mood, symptoms, notes }, ... ]
stepsync_medications  → [ { id, name, dosage, time, taken }, ... ]
stepsync_sleeps       → [ { date, bedtime, wake, hours, quality }, ... ]
stepsync_exercises    → [ { date, type, duration, intensity, calories }, ... ]

// Singleton Values
stepsync_userName     → "John Doe"
stepsync_theme        → "dark" | "light"
stepsync_hasSeenOnboarding → true | false
```

### Data Models

#### Mood Entry
```javascript
{
  date: "2026-01-09T14:30:00.000Z",        // ISO 8601 timestamp
  mood: 7,                                  // 1-10 scale
  symptoms: ["anxiety", "stress"],          // Array of symptom IDs
  notes: "Had a productive meeting today"   // Optional text
}
```

#### Medication Entry
```javascript
{
  id: 1736438400000,                       // Unix timestamp (unique)
  name: "Vitamin D",                       // Medication name
  dosage: "1000 IU",                       // Dosage string
  time: "morning",                         // "morning" | "afternoon" | "evening" | "night"
  taken: false                             // Boolean flag (daily reset)
}
```

#### Sleep Entry
```javascript
{
  date: "2026-01-09T06:00:00.000Z",        // Wake time timestamp
  bedtime: "22:00",                        // HH:MM format
  wake: "06:00",                           // HH:MM format
  hours: 8,                                // Calculated duration
  quality: 7                               // 1-10 scale
}
```

#### Exercise Entry
```javascript
{
  date: "2026-01-09T18:00:00.000Z",        // Activity timestamp
  type: "running",                         // Activity type
  duration: 30,                            // Minutes
  intensity: "moderate",                   // "light" | "moderate" | "intense"
  calories: 250                            // Estimated calories (optional)
}
```

---

## Core Components

### 1. Database Abstraction Layer
```javascript
const DB = {
  get: (key) => JSON.parse(localStorage.getItem('stepsync_' + key) || '[]'),
  set: (key, data) => localStorage.setItem('stepsync_' + key, JSON.stringify(data)),
  getOne: (key) => JSON.parse(localStorage.getItem('stepsync_' + key) || 'null'),
  setOne: (key, data) => localStorage.setItem('stepsync_' + key, JSON.stringify(data))
};
```

**Features**:
- Automatic JSON serialization/deserialization
- Namespacing with `stepsync_` prefix
- Type-safe with default values
- Simple API (get, set, getOne, setOne)

### 2. Tab Navigation System
```javascript
// Desktop + Mobile unified navigation
function switchTab(tabName) {
  // Update both desktop and mobile nav states
  // Show corresponding app section
  // Scroll to top on mobile
}
```

**Features**:
- Unified desktop/mobile navigation
- Keyboard accessible (Enter, Space)
- ARIA labels and aria-current
- Mobile bottom bar for better UX

### 3. Medication Validation Engine
```javascript
// 150+ medications with dosage thresholds
function validateDosage(name, dosage) {
  // Parse dosage (amount + unit)
  // Normalize units (µg → mcg)
  // Check universal safety thresholds:
  //   - >50,000mg = CRITICAL (block)
  //   - >10,000mg = DANGER (warn)
  // Check specific drug limits
  // Return { valid, level, message }
}
```

**Features**:
- Universal safety checks (all medications)
- Specific drug validation (Vitamin D, B12, etc.)
- Unit normalization (mg, mcg, IU, g)
- Three severity levels (safe, warning, critical)

### 4. Drug Interaction Checker
```javascript
// 65+ dangerous interaction pairs
function checkInteractions() {
  // Get all active medications
  // Check against interaction database
  // Display warnings with severity levels
}
```

**Examples**:
- Warfarin + Aspirin → 🔴 DANGER
- SSRI + St. John's Wort → 🔴 DANGER
- ACE Inhibitors + NSAIDs → 🟡 CAUTION

### 5. Wellness Score Calculator
```javascript
function calculateWellnessScore() {
  // Mood: 0-25 points (mood/10 * 25)
  // Sleep: 0-25 points (hours/8 * 25)
  // Exercise: 0-25 points (minutes/30 * 25)
  // Medication: 0-25 points (taken/total * 25)
  // Total: 0-100 score
}
```

**Categories**:
- 70-100: 🟢 Good (green circle)
- 40-69: 🟡 Medium (yellow circle)
- 0-39: 🔴 Low (red circle)

### 6. Chart.js Visualization
```javascript
function createWellnessTrendChart() {
  // Fetch last 7 days of data
  // Create multi-line chart (mood, sleep, exercise, medication)
  // Responsive with dark/light theme support
  // Interactive tooltips
}
```

**Data Normalization**:
- Mood: 0-10 (native scale)
- Sleep: 0-10 (hours capped at 10)
- Exercise: 0-10 (minutes/6 for scale)
- Medication: 0-10 (adherence % / 10)

---

## Service Worker Strategy

### Cache Version
```javascript
const CACHE_VERSION = 'stepsync-v4-premium-ui-redesign';
```

### Caching Strategy
```javascript
// Install: Pre-cache static assets
self.addEventListener('install', (event) => {
  caches.open(CACHE_VERSION).then((cache) => {
    cache.addAll(['/', '/index.html']);
  });
});

// Fetch: Cache-first with network fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**Future Enhancements**:
- Dynamic caching for CDN assets
- Network-first for API calls (if added)
- Background sync for export files
- Push notifications for medication reminders

---

## Accessibility Architecture

### WCAG 2.1 Compliance Strategy

#### Level A (Current)
- ✅ Semantic HTML
- ✅ ARIA labels on all buttons
- ✅ Keyboard navigation
- ✅ Focus states (2px outline)
- ✅ Skip to content link

#### Level AA (Target)
- 🔄 Color contrast ratios ≥4.5:1
- 🔄 Resizable text (200% zoom)
- 🔄 Form error messages
- 🔄 Focus visible on all elements

#### Level AAA (Future)
- 🔄 Color contrast ratios ≥7:1
- 🔄 Sign language videos
- 🔄 Extended audio descriptions

---

## Performance Optimization

### Load Time
- **First Contentful Paint (FCP)**: <1.5s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Time to Interactive (TTI)**: <3.0s

**Techniques**:
- Inline critical CSS
- Defer non-critical JavaScript
- Lazy load Chart.js only on dashboard
- Service worker caching

### Bundle Size
- **HTML/CSS/JS**: ~60KB (minified)
- **Chart.js CDN**: ~200KB (cached)
- **Total First Load**: ~260KB
- **Subsequent Loads**: <5KB (cached)

---

## Security Model

### Threat Model
- **Attack Surface**: Client-side only (no server)
- **Data Storage**: Browser localStorage (origin-isolated)
- **Network**: HTTPS only (GitHub Pages)
- **Dependencies**: Chart.js CDN (SRI planned)

### Mitigations
- ✅ No server = no server breaches
- ✅ localStorage isolated by origin
- ✅ HTTPS prevents MITM attacks
- ✅ No cookies = no cookie theft
- 🔄 Subresource Integrity (SRI) for CDN (planned)
- 🔄 Content Security Policy (CSP) headers (planned)

Read more: **[Security & Privacy](Security-and-Privacy)**

---

## Future Architecture Plans

### Short-Term (Next 3 Months)
1. **Modular Refactor**: Split monolithic HTML into components
2. **IndexedDB Migration**: Replace localStorage for better performance
3. **TypeScript**: Gradual migration for type safety
4. **Vitest Tests**: Replace current test infrastructure

### Medium-Term (6-12 Months)
1. **Next.js Migration**: Use existing `pages/index.jsx` prototype
2. **Component Library**: Reusable UI components
3. **Backend Sync** (Optional): User-controlled cloud backup
4. **Mobile Apps**: React Native wrapper

### Long-Term (1+ Years)
1. **AI-Powered Insights**: Machine learning for predictions
2. **Wearable Integration**: Apple Health, Google Fit, Fitbit
3. **Multi-User**: Family/household tracking
4. **Telemedicine**: Share data with providers securely

---

## Development Workflow

### Git Workflow
```
main (production)
  ↑
  │ PR #84 (reviewed)
  │
feature/premium-ui-complete (current)
  ↑
  │ Quick commits
  │
feature/your-feature (your work)
```

### Release Process
1. Create feature branch
2. Implement changes
3. Write/update tests
4. Create pull request
5. Code review
6. Merge to main
7. Auto-deploy to GitHub Pages

### Testing Pyramid
```
      /\         100 E2E Tests
     /  \        (planned)
    /    \
   /      \      500 Integration Tests
  /        \     (current: ~400)
 /          \
/____________\   1,427 Unit Tests
               (current)
```

---

## API Reference

See **[API Reference](API-Reference)** for:
- localStorage data schema
- Service Worker API
- Export/import data format
- PWA manifest structure

---

## Performance Monitoring

### Metrics to Track
- Lighthouse scores (performance, accessibility, SEO, PWA)
- Bundle size (HTML, CSS, JS)
- Test coverage (current: 82.55%)
- Load time (FCP, LCP, TTI)

### Tools
- **Lighthouse**: Chrome DevTools
- **WebPageTest**: https://webpagetest.org
- **Bundle Analyzer**: (planned with modular refactor)

---

**Questions about the architecture?**

- 💬 [Ask in Discussions](https://github.com/Isaloum/StepSyncAI/discussions)
- 🐛 [Report Architecture Issues](https://github.com/Isaloum/StepSyncAI/issues)
- 📖 [Read Contributing Guide](Contributing)

