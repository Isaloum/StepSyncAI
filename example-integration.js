/**
 * Example Integration with Bumpie_Meds
 *
 * This shows how to integrate DrugInteractionChecker
 * with the existing PregnancySafetyEngine
 */

const DrugInteractionChecker = require('./drug-interaction-checker');

// Initialize the checker (do this once at app startup)
const interactionChecker = new DrugInteractionChecker({
  drugBankApiKey: process.env.DRUGBANK_API_KEY,
  enablePregnancyWarnings: true
});

// ============================================
// Example 1: Simple Two-Drug Check
// ============================================
async function example1() {
  console.log('\n=== Example 1: Simple Check ===');

  const result = await interactionChecker.checkInteractions(
    ['Warfarin', 'Aspirin']
  );

  console.log(`Found ${result.interactions.length} interactions`);
  console.log('Source:', result.source);

  if (result.interactions.length > 0) {
    const int = result.interactions[0];
    console.log(`\n${int.drug1} + ${int.drug2}`);
    console.log(`Severity: ${int.severity}`);
    console.log(`Description: ${int.description}`);
  }
}

// ============================================
// Example 2: With Pregnancy Context
// ============================================
async function example2() {
  console.log('\n=== Example 2: Pregnancy Context ===');

  // Patient in week 10 of pregnancy
  const result = await interactionChecker.checkInteractions(
    ['Ibuprofen', 'Lisinopril'],
    { weekOfPregnancy: 10 }
  );

  result.interactions.forEach(int => {
    console.log(`\n${int.drug1} + ${int.drug2}`);
    console.log(`Severity: ${int.severity}`);
    console.log(`Pregnancy Warning: ${int.pregnancyWarning || 'None'}`);
  });
}

// ============================================
// Example 3: Multiple Medications
// ============================================
async function example3() {
  console.log('\n=== Example 3: Multiple Medications ===');

  const medications = [
    'Metformin',
    'Lisinopril',
    'Aspirin',
    'Ibuprofen'
  ];

  const result = await interactionChecker.checkInteractions(
    medications,
    { weekOfPregnancy: 20 }
  );

  console.log(`Checking ${medications.length} medications`);
  console.log(`Found ${result.interactions.length} interactions:`);

  result.interactions.forEach((int, i) => {
    console.log(`\n${i + 1}. ${int.drug1} + ${int.drug2}`);
    console.log(`   Severity: ${int.severity}`);
    console.log(`   ${int.description.substring(0, 80)}...`);
  });
}

// ============================================
// Example 4: Integration with PregnancySafetyEngine
// ============================================
class EnhancedPregnancySafetyEngine {
  constructor() {
    this.interactionChecker = new DrugInteractionChecker({
      enablePregnancyWarnings: true
    });
  }

  /**
   * Enhanced safety check with interactions
   */
  async checkMedicationSafety(medicationName, weekOfPregnancy, currentMedications = []) {
    // Your existing FDA category check
    const fdaResult = {
      safe: true,
      fdaCategory: 'B',
      riskLevel: 'low',
      warnings: []
    };

    // Add interaction check
    const allMeds = [medicationName, ...currentMedications];
    let interactionResult = { interactions: [], source: 'none' };

    if (allMeds.length >= 2) {
      interactionResult = await this.interactionChecker.checkInteractions(
        allMeds,
        { weekOfPregnancy }
      );
    }

    // Combine results
    return {
      ...fdaResult,
      interactions: interactionResult.interactions,
      interactionCount: interactionResult.interactions.length,
      hasInteractions: interactionResult.interactions.length > 0,
      interactionSource: interactionResult.source,
      // Mark as unsafe if critical interactions found
      safe: fdaResult.safe && !interactionResult.interactions.some(i =>
        i.severity === 'CRITICAL' || i.severity === 'SEVERE'
      )
    };
  }
}

async function example4() {
  console.log('\n=== Example 4: Enhanced Safety Check ===');

  const engine = new EnhancedPregnancySafetyEngine();

  const result = await engine.checkMedicationSafety(
    'Ibuprofen',
    8, // Week 8 of pregnancy
    ['Lisinopril', 'Aspirin'] // Current medications
  );

  console.log('Safety Check Result:');
  console.log('Safe:', result.safe);
  console.log('FDA Category:', result.fdaCategory);
  console.log('Risk Level:', result.riskLevel);
  console.log('Interactions Found:', result.interactionCount);

  if (result.hasInteractions) {
    console.log('\nInteractions:');
    result.interactions.forEach(int => {
      console.log(`- ${int.drug1} + ${int.drug2}: ${int.severity}`);
      if (int.pregnancyWarning) {
        console.log(`  ${int.pregnancyWarning}`);
      }
    });
  }
}

// ============================================
// Example 5: Error Handling
// ============================================
async function example5() {
  console.log('\n=== Example 5: Error Handling ===');

  try {
    // This will try DrugBank first, then fall back to local DB
    const result = await interactionChecker.checkInteractions(
      ['Unknown Drug A', 'Unknown Drug B']
    );

    console.log('Source:', result.source);
    console.log('Interactions:', result.interactions.length);

    // Even with unknown drugs, system doesn't crash
    // It just returns empty array
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// Example 6: Caching for Production
// ============================================
class CachedInteractionChecker {
  constructor() {
    this.checker = new DrugInteractionChecker({
      enablePregnancyWarnings: true
    });
    this.cache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  }

  async checkInteractions(medications, options = {}) {
    // Create cache key
    const key = medications.sort().join(',') + JSON.stringify(options);

    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log('✅ Cache hit!');
      return cached.result;
    }

    // Fetch fresh data
    console.log('⏳ Cache miss, fetching...');
    const result = await this.checker.checkInteractions(medications, options);

    // Store in cache
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });

    return result;
  }
}

async function example6() {
  console.log('\n=== Example 6: Caching ===');

  const cachedChecker = new CachedInteractionChecker();

  // First call - cache miss
  await cachedChecker.checkInteractions(['Warfarin', 'Aspirin']);

  // Second call - cache hit
  await cachedChecker.checkInteractions(['Warfarin', 'Aspirin']);
}

// ============================================
// Run All Examples
// ============================================
async function runAll() {
  console.log('🧪 Drug Interaction Checker Examples\n');

  await example1();
  await example2();
  await example3();
  await example4();
  await example5();
  await example6();

  console.log('\n✅ All examples completed!');
}

// Run if called directly
if (require.main === module) {
  runAll().catch(console.error);
}

module.exports = {
  EnhancedPregnancySafetyEngine,
  CachedInteractionChecker
};
