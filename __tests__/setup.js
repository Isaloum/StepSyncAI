/**
 * Jest Setup File
 * Global mocks for all tests
 */

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
