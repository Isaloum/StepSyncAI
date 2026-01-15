/**
 * Manual Mock for bumpie-meds package
 * This mock provides test implementations for pregnancy-related medication safety features
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

class PregnancyInteractionChecker {
  async checkPregnancyInteractions() {
    return {
      hasInteractions: false,
      interactions: []
    };
  }
}

class PregnancyRiskCalculator {
  calculateRisk() {
    return {
      riskScore: 25,
      riskLevel: 'low'
    };
  }
}

class PregnancyAuditLogger {
  async logSafetyCheck() {
    return {
      id: 'audit_123',
      type: 'safety_check',
      timestamp: new Date().toISOString()
    };
  }

  async logInteractionCheck() {
    return {
      id: 'audit_124',
      type: 'interaction_check',
      timestamp: new Date().toISOString()
    };
  }

  async logRiskCalculation() {
    return {
      id: 'audit_125',
      type: 'risk_calculation',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  PregnancySafetyEngine,
  PregnancyInteractionChecker,
  PregnancyRiskCalculator,
  PregnancyAuditLogger
};
