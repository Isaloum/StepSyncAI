# PWA Updates & Service Worker FAQ

**Keep StepSyncAI Fresh: Understanding Automatic Updates**

---

## 🔄 How Updates Work

StepSyncAI is a **Progressive Web App (PWA)**, which means it works like a native app with offline support and lightning-fast loading. Here's how updates happen behind the scenes:

### Automatic Update Detection
- **Every 60 seconds**, the app quietly checks if a new version is available
- When we deploy updates (new features, bug fixes, improvements), the app detects them automatically
- **No manual action needed** - it just works! ✨

### The Update Notification
When a new version is ready, you'll see a friendly notification in the bottom-right corner:

```
✨ Update Available
A new version of StepSyncAI is ready!

[Reload] [×]
```

**What to do:**
- Click **"Reload"** to instantly update to the latest version (takes 1 second)
- Click **"×"** to dismiss and update later (notification auto-hides after 30 seconds)

That's it! No app store, no downloads, no waiting. 🚀

---

## ⏰ When Do I Get Updates?

### While Browsing
- **Connected to WiFi/mobile data?** You'll get the latest code on your next visit automatically
- **Tab open in background?** The notification appears as soon as new code is detected (within 60 seconds)
- **Actively using the app?** Notification pops up when ready - finish what you're doing, then click "Reload"

### Timing
- **Updates deploy** → Within 60 seconds, your app knows about it
- **You click "Reload"** → Instant update (less than 1 second)
- **You're offline?** No problem - update waits until you're back online

### What Gets Updated
✅ New features and improvements  
✅ Bug fixes and performance enhancements  
✅ Security patches  
✅ UI/design changes  
✅ All app functionality  

---

## 🛠️ Troubleshooting

### Issue: Blank or Unstyled Page

**Symptoms**: Page loads but looks broken, no styles, plain white background

**Quick Fix** (try these in order):
1. **Simple reload**: Press `F5` or click the reload button
2. **Close and reopen**: Close the tab/window and open StepSyncAI again
3. **Clear service worker** (advanced):
   - Open browser Developer Tools (`F12` or `Right-click → Inspect`)
   - Go to **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
   - Click **Service Workers** in left sidebar
   - Click **"Unregister"** next to `service-worker.js`
   - Close DevTools and reload the page

**Why this happens**: Very rare, but can occur if an update is interrupted mid-download. The new service worker fixes this permanently!

---

### Issue: Update Notification Doesn't Appear

**If you think there's an update but don't see the notification:**

1. **Check console logs**:
   - Open DevTools (`F12`)
   - Go to **Console** tab
   - Look for messages like `[SW] Activating new service worker version: stepsync-v5-quick-wins`
   - If you see a new version number, just reload the page

2. **Force update check**:
   - DevTools → **Application** tab → **Service Workers**
   - Click **"Update"** button
   - Wait 5 seconds, then reload

3. **Still stuck?** See [Get Help](#-get-help) below

---

### Issue: App Won't Load Offline

**Expected behavior**: 
- ✅ App should load and work offline (read existing data, view charts)
- ❌ New data won't sync until you're back online (this is normal)

**If app won't load at all offline**:
1. **First visit must be online**: Service worker needs to cache assets initially
2. **Try visiting online first**, then go offline and test again
3. **Check storage**: Some browsers limit storage in Private/Incognito mode

---

## 📶 Offline Support

### What Works Offline
✅ **View your data**: All mood logs, medications, sleep, exercise  
✅ **View charts**: Wellness trends and historical data  
✅ **Use the app**: Full UI and navigation  
✅ **Add new entries**: Mood, sleep, exercise (saves locally)  

### What Requires Internet
❌ **First-time load**: Initial visit must be online  
❌ **External resources**: Chart.js library (cached after first load)  
❌ **Updates**: New versions require internet to download  

### How It Works
- **First visit (online)**: App caches core files (HTML, CSS, JS)
- **Subsequent visits (online or offline)**: Loads from cache instantly
- **Going offline**: Continue using with cached data
- **Back online**: Automatic sync (future feature - currently all data is local)

---

## ❓ Frequently Asked Questions

### Q: Why do I sometimes see an update notification?

**A:** That means we've shipped exciting new features, bug fixes, or improvements! We're constantly making StepSyncAI better. Clicking "Reload" takes 1 second and gives you the newest version with all the latest goodies. 🎁

---

### Q: Can I use StepSyncAI without internet?

**A:** Yes! After your first visit (which must be online), you can use the app completely offline. All your data is stored locally on your device, so mood tracking, medication management, charts, and insights work perfectly without internet.

**Note**: You'll need internet to get app updates or if we add cloud sync features in the future.

---

### Q: The UI is broken or won't load!

**A:** This is very rare with our new service worker (updated January 2026). If it happens:

1. **First try**: Simple reload (`F5` or `Cmd+R`)
2. **Still broken?** Hard refresh (`Shift+F5` or `Cmd+Shift+R`)
3. **Nuclear option**: Clear service worker (see [Troubleshooting](#-troubleshooting) above)

**Pro tip**: If you see the update notification, always click "Reload" - it prevents any potential issues!

---

### Q: How do I know what version I'm running?

**A:** Open browser DevTools (`F12`) → **Console** tab. Look for a message like:

```
[App] Service Worker registered
[SW] Installing new service worker version: stepsync-v5-quick-wins
```

The version name tells you what release you're on. We increment this with every deployment.

**Current version**: `stepsync-v5-quick-wins` (as of January 2026)

---

### Q: Will I lose my data when updating?

**A:** **Never!** Updates only refresh the app code (HTML, CSS, JavaScript). Your personal data (mood logs, medications, sleep, exercise) is stored separately in your browser's local storage and is **100% preserved** across all updates.

---

### Q: Do I need to install anything?

**A:** Nope! StepSyncAI is a web app that runs in your browser. No App Store, no downloads, no permissions.

**Optional**: You can "install" it to your home screen for a native app experience:
- **Desktop**: Look for the install icon in your browser's address bar
- **Mobile**: Tap "Share" → "Add to Home Screen"

This is purely cosmetic - the app works the same in-browser or installed.

---

### Q: What's a "service worker" anyway?

**A:** Think of it as a helpful robot 🤖 that lives in your browser. Its jobs:

1. **Cache files** so the app loads instantly
2. **Check for updates** every 60 seconds
3. **Enable offline mode** by serving cached files when you have no internet
4. **Notify you** when new versions are available

You never see it working - it just makes everything faster and smoother!

---

### Q: Why network-first for some files and cache-first for others?

**A:** (For the technically curious)

- **Network-first (HTML/CSS/JS)**: Always try to get the latest code from the server. This prevents stale UI bugs and ensures you get updates quickly. Only falls back to cache if you're offline.

- **Cache-first (images/fonts)**: These rarely change, so loading from cache is faster. Saves bandwidth and improves performance.

**Result**: You get fresh app code instantly + lightning-fast performance. Best of both worlds! ⚡

---

## 👨‍💻 For Developers

### Service Worker Architecture

**File**: [`docs/service-worker.js`](https://github.com/Isaloum/StepSyncAI/blob/main/docs/service-worker.js)

**Current version**: `stepsync-v5-quick-wins`

**Caching strategy**:
```javascript
// Network-first (always fresh)
- HTML files (index.html, etc.)
- CSS stylesheets  
- JavaScript files

// Cache-first (performance)
- Images (png, jpg, svg, etc.)
- Fonts (woff, woff2, ttf, etc.)
- Other static assets
```

**Lifecycle**:
1. **Install**: Cache core assets, call `skipWaiting()` for immediate activation
2. **Activate**: Delete old cache versions, call `clients.claim()` to take control
3. **Fetch**: Serve requests using strategy based on file type
4. **Update check**: Runs every 60 seconds via `setInterval()` in `index.html`

**Message passing**:
```javascript
// Service worker → App
navigator.serviceWorker.postMessage({
  type: 'SW_UPDATED',
  version: 'stepsync-v5-quick-wins'
});

// App → User
showUpdateNotification(); // Displays "Update Available" toast
```

**Cache versioning**:
- Increment `CACHE_VERSION` on every deploy
- Old caches automatically deleted in `activate` event
- Format: `stepsync-v{number}-{description}`
- Example: `stepsync-v5-quick-wins` → `stepsync-v6-bug-fixes`

**Debugging**:
```javascript
// Console logs at each stage
[SW] Installing new service worker version: stepsync-v5-quick-wins
[SW] Caching core assets
[SW] Skipping waiting - activating immediately
[SW] Activating new service worker version: stepsync-v5-quick-wins
[SW] Deleting old cache: stepsync-v4-premium-ui-redesign
[SW] Claiming all clients
[App] Service Worker registered
[App] New version available: stepsync-v5-quick-wins
```

**Testing updates locally**:
```bash
# 1. Make changes to code
# 2. Increment CACHE_VERSION in service-worker.js
# 3. In DevTools Application tab:
#    - Check "Update on reload"
#    - Reload page
#    - Verify new version in console
#    - Test update notification appears
```

**Performance metrics**:
- **Update detection**: < 60 seconds
- **Update download**: < 1 second (typical)
- **Cache cleanup**: Automatic on activation
- **Offline fallback**: Instant (from cache)

---

## 🆘 Get Help

### Reporting Issues

If you experience persistent problems with updates or offline mode:

1. **Check existing issues**: [GitHub Issues](https://github.com/Isaloum/StepSyncAI/issues)
2. **Open a new issue**: Include:
   - Browser name and version
   - Operating system
   - Steps to reproduce
   - Console logs (DevTools → Console tab)
   - Service worker status (DevTools → Application → Service Workers)

### Community Support

- **GitHub Discussions**: [Ask questions](https://github.com/Isaloum/StepSyncAI/discussions)
- **Discord** (coming soon): Real-time help from the community
- **Email**: [Create an issue](https://github.com/Isaloum/StepSyncAI/issues/new) for private matters

### Quick Debug Info to Include

When reporting update-related issues, please provide:

```
Browser: Chrome 120.0.6099.129 (example)
OS: macOS 14.2 (example)
Service Worker Status: Activated and running
Cache Version: stepsync-v5-quick-wins
Error: [paste error message from console]
```

**How to find this**:
1. Open DevTools (`F12`)
2. **Console tab**: Copy any error messages
3. **Application tab** → Service Workers: Screenshot the status
4. **Console tab**: Look for `[SW] Activating new service worker version: ...`

---

## 📚 Related Documentation

- **[Quick Start Guide](Quick-Start)** - Get started with StepSyncAI
- **[Architecture](Architecture)** - Technical details and system design
- **[Security & Privacy](Security-and-Privacy)** - Your data is safe and local
- **[FAQ](FAQ)** - General questions about features and usage

---

## 🎉 You're All Set!

Updates are automatic, fast, and hassle-free. Just click "Reload" when the notification appears, and you're always on the latest version!

**Questions?** Open an issue on [GitHub](https://github.com/Isaloum/StepSyncAI/issues) or check the [main FAQ](FAQ).

---

**Last Updated**: January 9, 2026  
**Service Worker Version**: v5-quick-wins  
**Update Strategy**: Network-first for app code, cache-first for static assets
