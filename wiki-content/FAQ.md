# Frequently Asked Questions (FAQ) ❓

Common questions about StepSyncAI answered.

---

## Getting Started

### Q: Do I need to create an account?
**A:** No! StepSyncAI works without any account, login, or personal information. Just visit the site and start tracking.

### Q: Is it free?
**A:** Yes, completely free. No premium tiers, no subscriptions, no ads. Open source and always will be.

### Q: Can I use it on my phone?
**A:** Absolutely! StepSyncAI is mobile-optimized and installable as a PWA (Progressive Web App) on iOS and Android.

### Q: Does it work offline?
**A:** Yes! After the first visit, the service worker caches the app so you can track data even without internet.

---

## Privacy & Security

### Q: Where is my data stored?
**A:** 100% in your browser's localStorage on YOUR device. It never leaves your device or gets sent to any server.

### Q: Can you see my health data?
**A:** No. We literally cannot access your data. There's no backend server collecting anything. It's all local.

### Q: What happens if I use private browsing mode?
**A:** Your data will be deleted when you close the browser tab/window. Use normal browsing mode for persistent data.

### Q: Is my data encrypted?
**A:** localStorage is automatically encrypted by your browser if your device has full-disk encryption (FileVault on Mac, BitLocker on Windows). For extra security, we recommend enabling device encryption.

### Q: What if someone steals my phone?
**A:** If your device is locked with a password/PIN/biometric, they can't access your browser data. Use a strong lock screen password.

---

## Features

### Q: Can I sync data across devices?
**A:** Not yet. Currently data is local only. Cloud sync is planned as an optional feature you can enable.

### Q: Can I import data from other apps?
**A:** Not yet, but we're working on JSON import. You can manually export from other apps and import to StepSyncAI (coming soon).

### Q: How accurate is the medication safety checker?
**A:** Our database includes 150+ medications and 65+ dangerous interaction pairs, validated against medical literature. However, it's not a substitute for professional medical advice. Always consult your doctor or pharmacist.

### Q: Can I track multiple people (family members)?
**A:** Not currently. StepSyncAI is designed for individual use. Multi-user support is on the roadmap.

### Q: Does it integrate with Apple Health / Google Fit / Fitbit?
**A:** Not yet. Wearable integration is planned for future releases.

---

## Data Management

### Q: How do I backup my data?
**A:** 
1. Go to Dashboard
2. Click "Export Data"
3. Save the JSON file to your computer/cloud storage
4. Re-import later (feature coming soon)

### Q: How do I delete all my data?
**A:**
1. Go to Dashboard
2. Click "Sign Out"
3. Confirm deletion
4. All data is permanently erased

**WARNING**: This cannot be undone. Export your data first if you need a backup.

### Q: Can I recover deleted data?
**A:** No. Once deleted (via Sign Out), data cannot be recovered. That's by design—privacy means true deletion.

### Q: How much data can I store?
**A:** Browser localStorage typically allows 5-10MB. That's enough for years of daily tracking for most users.

### Q: What happens when storage is full?
**A:** You'll get an error when trying to save new data. You can:
- Delete old entries manually
- Export and clear data
- Upgrade to IndexedDB (planned) for unlimited storage

---

## Technical

### Q: What browsers are supported?
**A:** StepSyncAI works on:
- ✅ Chrome 90+ (recommended)
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+
- ✅ Brave (Chromium-based)

Basically any modern browser with localStorage and service worker support.

### Q: Does it work on iOS?
**A:** Yes! Safari on iOS 14+ is fully supported. Install it as a PWA via Share → Add to Home Screen.

### Q: Does it work on Android?
**A:** Yes! Chrome on Android is fully supported. Install via the "Add to Home screen" prompt.

### Q: Why is Chart.js loaded from a CDN?
**A:** To keep the app lightweight and leverage browser caching. The CDN (jsDelivr) is one of the most reliable in the world.

### Q: Can I self-host StepSyncAI?
**A:** Absolutely! It's open source. Clone the repo and host it anywhere:
```bash
git clone https://github.com/Isaloum/StepSyncAI.git
cd StepSyncAI
# Serve docs/ folder with any web server
python -m http.server 8000  # Python
# OR
npx http-server docs/       # Node.js
```

### Q: How do I update to the latest version?
**A:** The app auto-updates when you reload. The service worker checks for new versions. Or:
1. Clear browser cache
2. Reload the page
3. Latest version will load

### Q: What's the file size?
**A:** Initial load: ~260KB (HTML/CSS/JS + Chart.js). Subsequent loads: <5KB (cached).

---

## Medication Tracking

### Q: How does dosage validation work?
**A:** The app parses your dosage (e.g., "1000 IU") and checks:
1. Universal limits (>50,000mg is dangerous for any medication)
2. Specific drug limits (e.g., Vitamin D >10,000 IU needs doctor approval)
3. Unit normalization (converts µg to mcg, etc.)

### Q: What if my medication isn't in the database?
**A:** You can still add it! The app will use universal safety checks (>50,000mg = critical). For specific validation, [request addition](https://github.com/Isaloum/StepSyncAI/issues/new) with medical sources.

### Q: Can I set medication reminders?
**A:** Not yet. This feature requires push notifications, which are planned but not yet implemented.

### Q: How do I mark a medication as taken?
**A:** 
1. Go to Medication tab
2. Find your medication card
3. Click "Mark Taken"
4. Button turns green (✅ Taken)

### Q: Do medication statuses reset daily?
**A:** No, they don't auto-reset yet. You need to manually unmark them or add new instances. Auto-reset is planned.

---

## Wellness Score

### Q: How is the wellness score calculated?
**A:**
- 25% from **Mood** (mood/10 × 25)
- 25% from **Sleep** (hours/8 × 25, capped at 10 hours)
- 25% from **Exercise** (minutes/30 × 25, capped at 60 minutes)
- 25% from **Medication Adherence** (taken/total × 25)

Total: 0-100 score

### Q: Why is my score low even though I feel good?
**A:** The score requires data in all four categories. If you're not tracking exercise or medications, those contribute 0 points. Focus on the categories that matter most to you.

### Q: Can I customize the score weights?
**A:** Not yet, but it's on the roadmap. We want to let users prioritize what matters most to them.

---

## Charts & Insights

### Q: Why is my chart empty?
**A:** You need at least 2 days of data to see trends. Keep logging for a few days and the chart will populate.

### Q: Can I customize the chart date range?
**A:** Not yet. Currently shows the last 7 days. Customizable ranges (30 days, 90 days, all-time) are planned.

### Q: What do the chart colors mean?
**A:** 
- 🔵 Blue: Mood
- 🟣 Purple: Sleep
- 🟢 Green: Exercise
- 🟡 Orange: Medication Adherence

### Q: Can I export charts as images?
**A:** Not yet, but you can screenshot. Chart image export is planned.

---

## Mobile Experience

### Q: Why is the navigation at the bottom on mobile?
**A:** Research shows bottom navigation is easier to reach with thumbs on large phones. It's a UX best practice for mobile-first apps.

### Q: Can I use swipe gestures to navigate?
**A:** Not yet, but swipe navigation is planned for the next version.

### Q: Why does the app scroll to top when I switch tabs on mobile?
**A:** To ensure you see the full content of each tab. This prevents confusion when switching from a long scrolled section.

---

## Contributing & Support

### Q: Can I contribute code?
**A:** Yes! StepSyncAI is open source. Read the [Contributing Guide](Contributing) to get started.

### Q: I found a bug. How do I report it?
**A:** [Open an issue on GitHub](https://github.com/Isaloum/StepSyncAI/issues/new) with:
- Bug description
- Steps to reproduce
- Browser and OS
- Screenshots (if applicable)

### Q: Can I request a feature?
**A:** Absolutely! [Open a feature request](https://github.com/Isaloum/StepSyncAI/issues/new) or join [Discussions](https://github.com/Isaloum/StepSyncAI/discussions).

### Q: How can I support the project?
**A:**
- ⭐ [Star the repo](https://github.com/Isaloum/StepSyncAI)
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Contribute code
- 📣 Share with friends/family
- 💬 Answer questions in Discussions

---

## Medical & Health

### Q: Is StepSyncAI a medical device?
**A:** No. It's a personal wellness tracking tool, not a medical device. It's not FDA approved or intended to diagnose, treat, or prevent any medical condition.

### Q: Can I use it to diagnose depression/anxiety?
**A:** No. Only a licensed healthcare professional can diagnose mental health conditions. StepSyncAI can help you track patterns to discuss with your doctor.

### Q: Should I stop taking my medications if the app says the dose is too high?
**A:** **Absolutely not!** Never change medications without consulting your doctor. The app's warnings are informational only.

### Q: Can I share my data with my doctor?
**A:** Yes! Export your data (JSON format) and:
- Email it (use secure email)
- Print it out
- Show graphs during appointment
- Upload to patient portal (if supported)

### Q: What if I'm in a mental health crisis?
**A:** StepSyncAI is NOT for emergencies. If you're in crisis:
- 🇺🇸 **US**: Call 988 (Suicide & Crisis Lifeline)
- 🆘 **Emergency**: Call 911 or your local emergency number
- 🌍 **International**: [Find crisis resources](https://findahelpline.com/)

---

## Troubleshooting

### Q: The app won't load. What do I do?
**A:**
1. Check internet connection (required for first load)
2. Try a different browser
3. Clear browser cache and reload
4. Disable browser extensions
5. Check browser console for errors (F12 → Console)

### Q: My data disappeared. Can I recover it?
**A:**
- If you exported recently: Import the JSON file (when feature is ready)
- If you didn't export: Data is likely unrecoverable
- Check if you're in the same browser (Chrome vs Firefox have separate localStorage)
- Check if you're in private browsing mode (data auto-deletes)

### Q: The wellness score isn't updating.
**A:**
1. Refresh the page
2. Log new data in all four categories
3. Check browser console for errors
4. Try clearing cache and reloading

### Q: Charts aren't showing.
**A:**
1. Ensure you have Chart.js loaded (check for CDN errors)
2. Log at least 2 days of data
3. Refresh the page
4. Check browser console for errors
5. Try disabling ad blockers (they might block CDN)

---

## Miscellaneous

### Q: Why is it called StepSyncAI?
**A:** "Step" refers to steps toward better health, "Sync" refers to synchronizing mind and body wellness, and "AI" is planned for future machine learning insights (not yet implemented).

### Q: Is there a dark mode?
**A:** Yes! Dark mode is the default. Click the 🌙/☀️ button in the top-right to toggle.

### Q: Can I change the language?
**A:** Not yet. Currently English only. Internationalization (i18n) is on the roadmap.

### Q: Will it always be free?
**A:** Yes. StepSyncAI is open source (MIT License) and will always have a free, full-featured version. No ads, no premium tiers.

---

## Still Have Questions?

- 💬 **[Ask in Discussions](https://github.com/Isaloum/StepSyncAI/discussions)** - Community support
- 📖 **[Read the Wiki](Home)** - Full documentation
- 🐛 **[Report an Issue](https://github.com/Isaloum/StepSyncAI/issues)** - Bugs or feature requests

