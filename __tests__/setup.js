/**
 * Jest Setup File
 * Global mocks for all tests
 * @jest-environment node
 */

// Prevent Jest from treating this as a test suite
if (typeof describe === 'undefined') {
  global.describe = () => {};
}

// Mock Bumpie_Meds pregnancy modules globally
jest.mock('bumpie-meds', () => ({
  PregnancySafetyEngine: jest.fn().mockImplementation(() => ({
    checkMedicationSafety: jest.fn().mockResolvedValue({
      safe: true,
      fdaCategory: 'B',
      riskLevel: 'low',
      trimester: 2,
      riskScore: 25,
      warnings: [],
      recommendation: 'Safe to use',
      alternatives: []
    })
  })),
  PregnancyInteractionChecker: jest.fn().mockImplementation(() => ({
    checkPregnancyInteractions: jest.fn().mockResolvedValue({
      hasInteractions: false,
      interactions: []
    })
  })),
  PregnancyRiskCalculator: jest.fn().mockImplementation(() => ({
    calculateRisk: jest.fn().mockReturnValue({
      riskScore: 25,
      riskLevel: 'low'
    })
  })),
  PregnancyAuditLogger: jest.fn().mockImplementation(() => ({
    logSafetyCheck: jest.fn().mockResolvedValue({
      id: 'audit_123',
      type: 'safety_check',
      timestamp: new Date().toISOString()
    }),
    logInteractionCheck: jest.fn().mockResolvedValue({}),
    logRiskCalculation: jest.fn().mockResolvedValue({})
  }))
}));

// Mock EnhancedMedicationManager globally
jest.mock('../enhanced-medication-manager', () => {
  return jest.fn().mockImplementation(() => ({
    searchMedications: jest.fn().mockReturnValue([]),
    getMedicationInfo: jest.fn().mockReturnValue(null),
    getValidDosages: jest.fn().mockReturnValue([]),
    getMedicationDetails: jest.fn().mockReturnValue(null),
    getMedicationsByCategory: jest.fn().mockReturnValue([]),
    getAllMedicationNames: jest.fn().mockReturnValue([]),
    getStatistics: jest.fn().mockReturnValue({
      totalMedications: 0,
      totalCategories: 0,
      categories: {}
    }),
    calculateMatchScore: jest.fn().mockReturnValue(0)
  }));
});

// Mock MedicationValidator globally
jest.mock('../medication-validator', () => {
  return jest.fn().mockImplementation(() => ({
    validate: jest.fn((name, dosage) => ({ 
      valid: true, 
      errors: [], 
      warnings: [],
      medication: {
        name: name,
        genericName: name,
        category: 'general',
        manufacturer: 'Generic'
      }
    })),
    validateMultiple: jest.fn((medications) => {
      if (!Array.isArray(medications)) {
        return { 
          valid: false, 
          errors: ['Input must be an array'],
          warnings: []
        };
      }
      return { 
        valid: true, 
        errors: [],
        warnings: []
      };
    }),
    checkInteractions: jest.fn((medication, currentMedications) => ({
      hasInteractions: false,
      warnings: [],
      severity: 'none'
    }))
  }));
});
