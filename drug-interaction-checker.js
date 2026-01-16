/**
 * Drug Interaction Checker for Bumpie_Meds
 *
 * Multi-tier approach:
 * 1. DrugBank API (primary, most comprehensive)
 * 2. Local database fallback (458 interactions)
 * 3. Pregnancy-specific warnings
 *
 * @module drug-interaction-checker
 */

const fs = require('fs');
const path = require('path');

class DrugInteractionChecker {
  constructor(options = {}) {
    this.drugBankApiKey = options.drugBankApiKey || process.env.DRUGBANK_API_KEY;
    this.localDbPath = options.localDbPath || path.join(__dirname, 'drug-interactions-database.json');
    this.enablePregnancyWarnings = options.enablePregnancyWarnings !== false;
    this.localDatabase = null;
    this.loadLocalDatabase();
  }

  /**
   * Load local interaction database
   */
  loadLocalDatabase() {
    try {
      const data = fs.readFileSync(this.localDbPath, 'utf8');
      this.localDatabase = JSON.parse(data);
      console.log(`✅ Loaded ${this.localDatabase.interactions.length} interactions from local database`);
    } catch (error) {
      console.error('❌ Failed to load local interaction database:', error.message);
      this.localDatabase = { interactions: [] };
    }
  }

  /**
   * Check interactions using DrugBank API
   * @param {Array<string>} medications - Array of medication names
   * @returns {Promise<Array>} Array of interactions
   */
  async checkWithDrugBank(medications) {
    if (!this.drugBankApiKey) {
      console.log('⚠️ DrugBank API key not provided, skipping API check');
      return null;
    }

    try {
      // DrugBank API v1 interaction check
      // Free tier: 500 calls/month
      const url = 'https://api.drugbank.com/v1/ddi';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.drugBankApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ drugs: medications })
      });

      if (!response.ok) {
        throw new Error(`DrugBank API returned ${response.status}`);
      }

      const data = await response.json();
      return this.formatDrugBankResults(data);
    } catch (error) {
      console.error('❌ DrugBank API error:', error.message);
      return null;
    }
  }

  /**
   * Format DrugBank API results
   */
  formatDrugBankResults(data) {
    if (!data.interactions) return [];

    return data.interactions.map(int => ({
      drug1: int.drug1.name,
      drug2: int.drug2.name,
      severity: int.severity.toUpperCase(),
      description: int.description,
      clinicalEffects: int.clinical_effects || [],
      mechanism: int.mechanism || '',
      source: 'DrugBank',
      extendedInfo: int.extended_description || ''
    }));
  }

  /**
   * Check interactions using local database
   * @param {Array<string>} medications - Array of medication names
   * @returns {Array} Array of interactions
   */
  checkWithLocalDatabase(medications) {
    if (!this.localDatabase || !this.localDatabase.interactions) {
      return [];
    }

    const found = [];
    const medsLower = medications.map(m => m.toLowerCase().trim());

    // Check all pairs
    for (let i = 0; i < medsLower.length; i++) {
      for (let j = i + 1; j < medsLower.length; j++) {
        const med1 = medsLower[i];
        const med2 = medsLower[j];

        // Search local database
        this.localDatabase.interactions.forEach(int => {
          const db1 = int.drug1.toLowerCase().trim();
          const db2 = int.drug2.toLowerCase().trim();

          // Check both directions
          const match = (med1.includes(db1) && med2.includes(db2)) ||
                        (med1.includes(db2) && med2.includes(db1));

          if (match) {
            found.push({
              drug1: medications[i],
              drug2: medications[j],
              severity: int.severity,
              description: int.description,
              recommendation: int.recommendation || '',
              source: 'Local Database'
            });
          }
        });
      }
    }

    return found;
  }

  /**
   * Add pregnancy-specific warnings
   * @param {Array} interactions - Existing interactions
   * @param {number} weekOfPregnancy - Current week of pregnancy
   * @returns {Array} Enhanced interactions with pregnancy warnings
   */
  addPregnancyWarnings(interactions, weekOfPregnancy) {
    if (!this.enablePregnancyWarnings) return interactions;

    return interactions.map(int => {
      const enhanced = { ...int };

      // First trimester (weeks 1-12) - most critical
      if (weekOfPregnancy <= 12) {
        if (int.severity === 'SEVERE' || int.severity === 'HIGH') {
          enhanced.pregnancyWarning = '🔴 CRITICAL: First trimester - organ development period. Avoid if possible.';
          enhanced.severity = 'CRITICAL';
        } else if (int.severity === 'MODERATE') {
          enhanced.pregnancyWarning = '⚠️ CAUTION: First trimester - consult OB-GYN immediately.';
        }
      }
      // Second/Third trimester (weeks 13-40)
      else if (weekOfPregnancy <= 40) {
        if (int.severity === 'SEVERE' || int.severity === 'HIGH') {
          enhanced.pregnancyWarning = '🟠 HIGH RISK: Discuss with maternal-fetal medicine specialist.';
        }
      }

      return enhanced;
    });
  }

  /**
   * Main method: Check interactions with multiple fallbacks
   * @param {Array<string>} medications - Array of medication names
   * @param {Object} options - Options (weekOfPregnancy, etc.)
   * @returns {Promise<Object>} Results with interactions and metadata
   */
  async checkInteractions(medications, options = {}) {
    if (!medications || medications.length < 2) {
      return {
        interactions: [],
        source: 'none',
        medicationCount: medications?.length || 0
      };
    }

    console.log(`🔍 Checking interactions for ${medications.length} medications:`, medications);

    let interactions = [];
    let source = 'local';

    // Try DrugBank API first
    const drugBankResults = await this.checkWithDrugBank(medications);
    if (drugBankResults && drugBankResults.length > 0) {
      interactions = drugBankResults;
      source = 'drugbank';
      console.log(`✅ Found ${interactions.length} interactions from DrugBank`);
    } else {
      // Fallback to local database
      interactions = this.checkWithLocalDatabase(medications);
      console.log(`✅ Found ${interactions.length} interactions from local database`);
    }

    // Add pregnancy warnings if applicable
    if (options.weekOfPregnancy) {
      interactions = this.addPregnancyWarnings(interactions, options.weekOfPregnancy);
    }

    return {
      interactions,
      source,
      medicationCount: medications.length,
      checkedAt: new Date().toISOString(),
      pregnancyMode: !!options.weekOfPregnancy
    };
  }

  /**
   * Get interaction between two specific drugs
   * @param {string} drug1 - First medication name
   * @param {string} drug2 - Second medication name
   * @returns {Promise<Object|null>} Interaction details or null
   */
  async checkPairInteraction(drug1, drug2, options = {}) {
    const result = await this.checkInteractions([drug1, drug2], options);
    return result.interactions.length > 0 ? result.interactions[0] : null;
  }
}

module.exports = DrugInteractionChecker;
