/**
 * Mock for pregnancy-safety-engine
 */
class PregnancySafetyEngine {
  async checkMedicationSafety() {
    return {
      safe: true,
      fdaCategory: 'B',
      riskLevel: 'low',
      trimester: 2,
      riskScore: 25,
      warnings: [],
      recommendation: 'Safe to use',
      alternatives: []
    };
  }
}

module.exports = PregnancySafetyEngine;
