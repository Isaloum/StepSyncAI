# Security & Privacy 🔒

Your data belongs to you. Here's how StepSyncAI protects your privacy and security.

---

## Privacy-First Design

### Core Principle
**100% of your health data stays on YOUR device.**

We believe your mental health, medication, and personal wellness data is yours alone. StepSyncAI is designed from the ground up to never collect, transmit, or store your data on external servers.

---

## Data Storage

### Where Your Data Lives
- ✅ **Browser localStorage**: All data stored in your browser
- ✅ **Your device only**: Never transmitted to servers
- ✅ **Origin-isolated**: Only accessible by StepSyncAI (same-origin policy)
- ✅ **User-controlled**: Delete anytime with "Sign Out" button

### What We Store
```
Local Storage (Browser):
├─ stepsync_moods         → Your mood entries
├─ stepsync_medications   → Your medication list
├─ stepsync_sleeps        → Your sleep logs
├─ stepsync_exercises     → Your exercise activities
├─ stepsync_userName      → Your name (if provided)
├─ stepsync_theme         → Your theme preference
└─ stepsync_hasSeenOnboarding → Onboarding status
```

### What We DON'T Store
- ❌ Email addresses
- ❌ Phone numbers
- ❌ IP addresses
- ❌ Location data
- ❌ Device identifiers
- ❌ Biometric data
- ❌ Payment information
- ❌ Any personally identifiable information (PII)

---

## Data Transmission

### Network Activity
StepSyncAI makes **ZERO network requests** except:

1. **Initial page load**: Download HTML/CSS/JS from GitHub Pages
2. **Chart.js CDN**: Load visualization library (once, then cached)
3. **Service Worker**: Cache updates for offline functionality

### No Analytics
- ❌ No Google Analytics
- ❌ No Facebook Pixel
- ❌ No tracking scripts
- ❌ No telemetry
- ❌ No error reporting services
- ❌ No A/B testing tools

**We literally cannot see how you use the app.**

### No Cookies
StepSyncAI does **not use cookies**. All preferences are stored in localStorage.

---

## Security Measures

### 1. HTTPS Only
- ✅ All traffic encrypted via HTTPS (GitHub Pages)
- ✅ No mixed content (all assets served over HTTPS)
- ✅ Prevents man-in-the-middle attacks

### 2. Same-Origin Policy
- ✅ localStorage isolated to `isaloum.github.io` origin
- ✅ Other websites cannot access your data
- ✅ Browser enforces this automatically

### 3. No Server-Side Code
- ✅ No backend = no server breaches
- ✅ No database = no database leaks
- ✅ No authentication = no password hacks
- ✅ Pure client-side JavaScript

### 4. Open Source
- ✅ **Full code transparency**: [View on GitHub](https://github.com/Isaloum/StepSyncAI)
- ✅ **Community audited**: Anyone can review the code
- ✅ **No obfuscation**: All code is readable
- ✅ **0 dependencies** (except Chart.js CDN)

### 5. Subresource Integrity (Planned)
```html
<!-- Future implementation -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"
        integrity="sha384-..." 
        crossorigin="anonymous"></script>
```

This ensures the Chart.js library hasn't been tampered with.

### 6. Content Security Policy (Planned)
```http
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://cdn.jsdelivr.net; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data:;
```

This prevents XSS attacks by restricting script sources.

---

## Medication Data Safety

### Dosage Validation
StepSyncAI includes a **built-in medication safety system**:

- **150+ medications** with known safe dosage ranges
- **Universal safety checks**:
  - >50,000mg = 🔴 **CRITICAL** (blocked)
  - >10,000mg = 🟡 **DANGER** (warning)
- **Unit normalization**: Converts µg, IU, g to standard units

### Drug Interactions
- **65+ dangerous interaction pairs** detected
- **Severity levels**:
  - 🔴 DANGER: Do not take together
  - 🟡 CAUTION: Consult doctor
  - 🟢 SAFE: No known interactions

**Important**: This is NOT medical advice. Always consult your doctor.

---

## Medical Disclaimer

### ⚠️ Critical Information

**StepSyncAI is NOT a medical device.**

- ❌ **Not FDA approved** for medical use
- ❌ **Not a substitute** for professional medical advice
- ❌ **Not intended to diagnose** or treat any condition
- ❌ **Not for critical reminders** (use your pharmacy's system)

### ✅ Appropriate Uses
- Personal wellness tracking
- Identifying patterns in mood/sleep/exercise
- Supplementing (not replacing) medical care
- Sharing data with your healthcare provider

### ❌ Inappropriate Uses
- Diagnosing mental health conditions
- Deciding to start/stop medications
- Replacing doctor-prescribed medication reminders
- Emergency medical situations

**If you're experiencing a medical emergency, call 911 or your local emergency number.**

---

## Data Portability

### Export Your Data
You can export all your data at any time:

1. Go to **📊 Dashboard**
2. Click **💾 Export Data**
3. Downloads `stepsync-export-YYYY-MM-DD.json`

**What's included**:
```json
{
  "metadata": {
    "version": "3.12.0",
    "exportDate": "2026-01-09T14:30:00.000Z"
  },
  "moods": [ /* all mood entries */ ],
  "medications": [ /* all medications */ ],
  "sleeps": [ /* all sleep logs */ ],
  "exercises": [ /* all exercise logs */ ]
}
```

### Use Your Export
- 📊 **Analyze** in Excel/Google Sheets
- 📈 **Visualize** with custom tools
- 🏥 **Share** with healthcare providers
- 💾 **Backup** to cloud storage (your choice)
- 🔄 **Import** to other health apps (if they support JSON)

### Import Data (Coming Soon)
Upload your export file to restore data on a new device.

---

## Data Retention

### How Long Is Data Kept?
- **Forever** (or until you delete it)
- No automatic deletion
- No expiration dates
- **You control retention**

### Deleting Your Data

#### Option 1: Sign Out (Full Wipe)
1. Dashboard → **🚪 Sign Out**
2. Confirm deletion
3. All data permanently erased

**WARNING**: This cannot be undone. Export your data first if needed.

#### Option 2: Browser Clear Data
1. Browser Settings → Privacy
2. Clear browsing data → localStorage
3. Select time range
4. Confirm

#### Option 3: Selective Deletion
- Delete individual mood/sleep/exercise entries (coming soon)
- Remove specific medications (click 🗑️ button)
- Edit entries (coming soon)

---

## Third-Party Services

### Chart.js CDN
- **Purpose**: Data visualization library
- **Source**: https://cdn.jsdelivr.net
- **Data shared**: NONE (your data stays local)
- **Privacy policy**: [jsDelivr Privacy](https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-net)

**What they see**:
- Your IP address (standard HTTP request)
- Browser user agent
- Referrer (isaloum.github.io)

**What they DON'T see**:
- Your health data
- Your name
- Anything you enter in StepSyncAI

### GitHub Pages (Hosting)
- **Purpose**: Host the StepSyncAI website
- **Source**: https://pages.github.com
- **Data shared**: NONE (pure static site)
- **Privacy policy**: [GitHub Privacy](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)

**What they see**:
- Your IP address (standard HTTP request)
- Browser user agent
- Page visits (but not page contents)

**What they DON'T see**:
- Your health data
- localStorage contents
- Form submissions (all client-side)

---

## GDPR Compliance

### Right to Access
✅ You can export all your data anytime (JSON format)

### Right to Rectification
✅ You can edit/delete data in the app (full control)

### Right to Erasure ("Right to be Forgotten")
✅ Sign Out button permanently deletes all data

### Right to Data Portability
✅ Export feature provides machine-readable JSON

### Right to Object
✅ No data processing = nothing to object to

### Data Protection by Design
✅ Privacy-first architecture (no data collection)

**Note**: GDPR primarily applies to EU residents. StepSyncAI exceeds GDPR requirements globally.

---

## HIPAA Compliance

### Is StepSyncAI HIPAA Compliant?
**No** - and it doesn't need to be.

**Why?**
- HIPAA applies to "covered entities" (healthcare providers, insurers)
- StepSyncAI is a personal wellness tool, not a healthcare provider
- Your data is never shared with healthcare entities
- You control if/when to share exported data

**If you share data with your doctor**:
- Export to JSON
- Send via secure email (not plain text)
- Or print and bring to appointment
- Doctor's office must handle it per HIPAA

---

## Security Best Practices for Users

### 🔒 Protect Your Device
- **Lock screen** when away
- **Strong password/PIN** on device
- **Biometric login** (fingerprint, Face ID)
- **Full disk encryption** (FileVault, BitLocker)

### 🌐 Browser Security
- **Keep browser updated** (latest Chrome, Edge, Firefox, Safari)
- **Don't use public computers** for personal health data
- **Private browsing mode** auto-deletes data on close (intentional)
- **Browser extensions**: Be cautious (they can access localStorage)

### 💾 Backup Your Data
- **Export monthly** to external drive
- **Cloud backup** (optional): Upload exports to Google Drive, Dropbox, etc.
- **Encrypt exports** before cloud upload (7-Zip, GPG)

### 🚫 What NOT to Do
- ❌ Share screenshots with sensitive info publicly
- ❌ Use StepSyncAI on shared/work computers
- ❌ Grant browser extensions access to health data
- ❌ Disable HTTPS (always use https://)

---

## Reporting Security Issues

### Responsible Disclosure
If you find a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. **Email** security concerns to: [via GitHub private vulnerability reporting](https://github.com/Isaloum/StepSyncAI/security/advisories/new)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - (Optional) Suggested fix

### What We'll Do
- Acknowledge within 48 hours
- Investigate and confirm
- Develop a fix
- Release a patch
- Credit you (if desired) in security advisory

### Security Hall of Fame
No security vulnerabilities reported yet. Be the first to help us stay secure!

---

## Transparency Report

### Data Requests (Government/Legal)
- **Requests received**: 0
- **Data provided**: 0 (we have no data to provide)

### Breaches/Incidents
- **Security breaches**: 0
- **Data leaks**: 0
- **Downtime incidents**: 0

**Last updated**: January 9, 2026

---

## Future Security Enhancements

### Planned (Next 6 Months)
- ✅ Subresource Integrity (SRI) for Chart.js
- ✅ Content Security Policy (CSP) headers
- ✅ Security audit by third-party firm
- ✅ Bug bounty program

### Under Consideration
- 🔄 End-to-end encrypted cloud sync (optional)
- 🔄 Client-side encryption for exports
- 🔄 Passphrase protection for localStorage
- 🔄 Biometric authentication (WebAuthn API)

---

## Questions?

- 📖 **[Read the FAQ](FAQ)** - Common questions
- 💬 **[Join Discussions](https://github.com/Isaloum/StepSyncAI/discussions)** - Ask the community
- 🐛 **[Report Security Issues](https://github.com/Isaloum/StepSyncAI/security/advisories/new)** - Private disclosure

---

**Privacy is not just a feature—it's our foundation.**

We built StepSyncAI to prove that powerful health tracking doesn't require sacrificing privacy. Your mental health, medications, and wellness data is too important to trust to cloud servers.

Keep it local. Keep it yours. 🔒

