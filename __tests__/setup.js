/**
 * Jest Setup File
 * Global mocks for all tests
 * @jest-environment node
 */

// Prevent Jest from treating this as a test suite
if (typeof describe === 'undefined') {
  global.describe = () => {};
}

// Note: bumpie-meds is mocked via manual mock in __mocks__/bumpie-meds.js
// Jest will automatically use the manual mock for this module

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
