# Drug Interaction Checker for Bumpie_Meds

Complete drug interaction checking with **multi-tier fallback system**:
1. **DrugBank API** (primary) - 1.4M+ interactions, pharmaceutical-grade
2. **Local Database** (fallback) - 458 clinically significant interactions
3. **Pregnancy Warnings** - Enhanced warnings based on trimester

---

## 📁 Files to Copy to Bumpie_Meds

```
src/services/
  └── drug-interaction-checker.js       # Main module
  └── drug-interactions-database.json   # 458 interactions fallback
```

---

## 🚀 Quick Start

### 1. Get DrugBank API Key (Free)

**Sign up:** https://dev.drugbank.com/
- Free tier: 500 API calls/month
- No credit card required
- Approval usually within 24 hours

### 2. Set Environment Variable

```bash
export DRUGBANK_API_KEY="your_api_key_here"
```

### 3. Install & Use

```javascript
const DrugInteractionChecker = require('./services/drug-interaction-checker');

// Initialize
const checker = new DrugInteractionChecker({
  drugBankApiKey: process.env.DRUGBANK_API_KEY,  // Optional, falls back to local
  enablePregnancyWarnings: true
});

// Check interactions
const result = await checker.checkInteractions(
  ['Warfarin', 'Aspirin'],
  { weekOfPregnancy: 8 }  // Optional pregnancy context
);

console.log(result);
```

---

## 📊 Response Format

```javascript
{
  interactions: [
    {
      drug1: "Warfarin",
      drug2: "Aspirin",
      severity: "CRITICAL",  // Enhanced from SEVERE due to pregnancy
      description: "Significantly increases bleeding risk...",
      recommendation: "Avoid combination unless specifically prescribed...",
      pregnancyWarning: "🔴 CRITICAL: First trimester - organ development period...",
      source: "DrugBank"  // or "Local Database"
    }
  ],
  source: "drugbank",  // or "local"
  medicationCount: 2,
  checkedAt: "2026-01-15T13:30:00.000Z",
  pregnancyMode: true
}
```

---

## 🎯 API Reference

### Constructor Options

```javascript
new DrugInteractionChecker({
  drugBankApiKey: string,           // Optional: DrugBank API key
  localDbPath: string,              // Optional: Path to local JSON database
  enablePregnancyWarnings: boolean  // Default: true
})
```

### Methods

#### `checkInteractions(medications, options)`
Check multiple medications for interactions.

**Parameters:**
- `medications` (Array<string>) - Medication names
- `options.weekOfPregnancy` (number) - Optional: Pregnancy week (1-42)

**Returns:** Promise<Object>

#### `checkPairInteraction(drug1, drug2, options)`
Check single pair of drugs.

**Parameters:**
- `drug1` (string) - First medication name
- `drug2` (string) - Second medication name
- `options` (Object) - Same as checkInteractions

**Returns:** Promise<Object|null>

---

## 💊 Severity Levels

| Level | Description | Pregnancy Impact |
|-------|-------------|------------------|
| **CRITICAL** | Life-threatening, avoid | First trimester → CRITICAL |
| **SEVERE** | Serious risk, requires monitoring | All trimesters → HIGH RISK |
| **MODERATE** | Significant, use caution | First trimester → CAUTION |
| **MINOR** | Low risk, aware only | Standard warning |

---

## 🤰 Pregnancy-Specific Features

### Automatic Enhancement by Trimester

**First Trimester (Weeks 1-12):**
- SEVERE → **CRITICAL** with red warning
- MODERATE → **CAUTION** with immediate OB-GYN consult

**Second/Third Trimester (Weeks 13-40):**
- SEVERE → **HIGH RISK** with specialist recommendation
- Detailed pregnancy warnings added to all interactions

### Example with Pregnancy Context

```javascript
// Patient in week 10 of pregnancy
const result = await checker.checkInteractions(
  ['Lisinopril', 'Ibuprofen'],
  { weekOfPregnancy: 10 }
);

// Result includes:
// pregnancyWarning: "⚠️ CAUTION: First trimester - consult OB-GYN immediately."
```

---

## 🔄 Fallback Behavior

The system automatically falls back through these layers:

```
1. DrugBank API (if API key provided)
   ↓ (if fails or no key)
2. Local Database (458 interactions)
   ↓ (if no match)
3. No interactions found
```

**Graceful degradation ensures the system always works, even offline or without API access.**

---

## 📚 Local Database Coverage

The 458-interaction local database includes:

- ✅ **NSAIDs** - All combinations (ibuprofen, naproxen, aspirin, etc.)
- ✅ **Anticoagulants** - Warfarin, aspirin, clopidogrel
- ✅ **Blood Pressure** - ACE inhibitors, beta blockers, diuretics
- ✅ **SSRIs** - Sertraline, fluoxetine, escitalopram
- ✅ **Diabetes** - Metformin, insulin, sulfonylureas
- ✅ **Antibiotics** - Common combinations
- ✅ **Pain Management** - Opioids, NSAIDs, acetaminophen
- ✅ **Psychiatric** - Antidepressants, antipsychotics
- ✅ **Cardiovascular** - Statins, antiplatelet agents
- ✅ **Respiratory** - Inhalers, antihistamines

---

## 🧪 Testing

```javascript
const assert = require('assert');
const DrugInteractionChecker = require('./drug-interaction-checker');

async function test() {
  const checker = new DrugInteractionChecker();

  // Test 1: Known interaction
  const result1 = await checker.checkInteractions(['Warfarin', 'Aspirin']);
  assert(result1.interactions.length > 0, 'Should find Warfarin-Aspirin interaction');

  // Test 2: With pregnancy context
  const result2 = await checker.checkInteractions(
    ['Ibuprofen', 'Lisinopril'],
    { weekOfPregnancy: 8 }
  );
  assert(result2.pregnancyMode === true, 'Pregnancy mode should be enabled');

  // Test 3: No interactions
  const result3 = await checker.checkInteractions(['Vitamin D', 'Calcium']);
  assert(result3.interactions.length === 0, 'Should find no interactions');

  console.log('✅ All tests passed!');
}

test();
```

---

## 🏥 Integration with Bumpie_Meds

### PregnancySafetyEngine Integration

```javascript
const DrugInteractionChecker = require('./drug-interaction-checker');

class PregnancySafetyEngine {
  constructor() {
    this.interactionChecker = new DrugInteractionChecker({
      enablePregnancyWarnings: true
    });
  }

  async checkMedicationSafety(medicationName, weekOfPregnancy, currentMedications = []) {
    // Existing FDA category check...
    const fdaResult = this.checkFDACategory(medicationName);

    // Add interaction check
    const allMeds = [medicationName, ...currentMedications];
    const interactionResult = await this.interactionChecker.checkInteractions(
      allMeds,
      { weekOfPregnancy }
    );

    return {
      ...fdaResult,
      interactions: interactionResult.interactions,
      interactionCount: interactionResult.interactions.length,
      hasInteractions: interactionResult.interactions.length > 0
    };
  }
}
```

---

## 📈 Rate Limits & Caching

### DrugBank Free Tier
- **500 calls/month**
- **Rate limit:** ~16 calls/day
- **Recommended:** Cache results for 24 hours

### Caching Strategy

```javascript
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function checkWithCache(medications) {
  const key = medications.sort().join(',');
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const result = await checker.checkInteractions(medications);
  cache.set(key, { result, timestamp: Date.now() });
  return result;
}
```

---

## 🔐 Security & Privacy

- ✅ **No PHI transmitted** - Only generic medication names sent to API
- ✅ **Local fallback** - Works offline, no data leaves system
- ✅ **API key security** - Use environment variables, never commit keys
- ✅ **HIPAA considerations** - DrugBank is used by healthcare providers

---

## 🛠️ Troubleshooting

### "DrugBank API key not provided"
- Set `DRUGBANK_API_KEY` environment variable
- Or pass key to constructor
- **System still works** - falls back to local database

### "Failed to load local interaction database"
- Ensure `drug-interactions-database.json` is in same directory
- Check file permissions
- Verify JSON is valid

### "No interactions found but should exist"
- Check medication spelling
- Try generic name instead of brand name
- Local database uses partial matching (e.g., "ibuprofen" matches "Ibuprofen 200mg")

---

## 📦 Alternative APIs (If DrugBank doesn't work)

### OpenFDA (Free, Government)
```javascript
// No API key needed, unlimited
const url = `https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:"${drug1}"+AND+patient.drug.openfda.generic_name:"${drug2}"`;
```

### RxNorm (Free, but unreliable)
```javascript
// Included as reference, but not recommended as primary
const url = `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcui1}+${rxcui2}`;
```

---

## 📄 License

This module is **MIT licensed** and free to use in Bumpie_Meds or any project.

The local interaction database is compiled from public medical sources and FDA drug labels.

---

## 🤝 Support & Updates

**Questions?** Open an issue in the MindTrackAI repo.

**Database updates:** The local JSON can be regenerated from `medication-tracker.js` in MindTrackAI.

---

## ✅ Production Checklist

Before deploying to Bumpie_Meds:

- [ ] Get DrugBank API key
- [ ] Set environment variable
- [ ] Test with known interaction pairs
- [ ] Test pregnancy warnings at different weeks
- [ ] Test fallback when API is down
- [ ] Add caching layer for API calls
- [ ] Monitor API usage (stay under 500/month)
- [ ] Add logging for production debugging
- [ ] Include in Bumpie_Meds test suite
- [ ] Update Bumpie_Meds documentation

---

**Ready to integrate!** 🚀

Copy the files to Bumpie_Meds and start checking interactions in minutes.
