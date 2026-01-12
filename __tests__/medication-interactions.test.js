const MedicationTracker = require('../medication-tracker');
const fs = require('fs');

jest.mock('fs');

// Mock EnhancedMedicationManager
jest.mock('../enhanced-medication-manager', () => {
  return jest.fn().mockImplementation(() => ({
    searchMedications: jest.fn().mockReturnValue([]),
    getMedicationInfo: jest.fn().mockReturnValue(null)
  }));
});

// Mock MedicationValidator
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
    validateMultiple: jest.fn().mockReturnValue({ 
      valid: true, 
      errors: [] 
    })
  }));
});

// Mock Bumpie_Meds pregnancy modules
jest.mock('bumpie-meds', () => ({
  PregnancySafetyEngine: jest.fn().mockImplementation(() => ({
    checkMedicationSafety: jest.fn().mockResolvedValue({
      safe: true,
      fdaCategory: 'B',
      riskLevel: 'low',
      recommendation: 'Safe to use'
    })
  })),
  PregnancyInteractionChecker: jest.fn().mockImplementation(() => ({
    checkPregnancyInteractions: jest.fn().mockResolvedValue({
      hasInteractions: false
    })
  })),
  PregnancyRiskCalculator: jest.fn().mockImplementation(() => ({})),
  PregnancyAuditLogger: jest.fn().mockImplementation(() => ({
    logSafetyCheck: jest.fn().mockResolvedValue({})
  }))
}));

describe('Medication Interaction Checking', () => {
    let tracker;
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock fs methods
        fs.existsSync.mockImplementation((path) => {
            if (path.includes('medication-interactions.json')) {
                return true;
            }
            return false;
        });
        fs.readFileSync.mockImplementation((path) => {
            if (path.includes('medication-interactions.json')) {
                // Return a subset of real interactions for testing
                return JSON.stringify({
                    interactions: [
                        {
                            drug1: 'Aspirin',
                            drug2: 'Ibuprofen',
                            severity: 'MODERATE',
                            description: 'Taking together may increase risk of stomach bleeding',
                            recommendation: 'Take ibuprofen at least 8 hours before or 30 minutes after aspirin'
                        },
                        {
                            drug1: 'Aspirin',
                            drug2: 'Warfarin',
                            severity: 'SEVERE',
                            description: 'Significantly increases bleeding risk',
                            recommendation: 'Avoid combination unless specifically prescribed by doctor'
                        },
                        {
                            drug1: 'Sertraline',
                            drug2: 'Tramadol',
                            severity: 'SEVERE',
                            description: 'Risk of serotonin syndrome',
                            recommendation: 'Avoid if possible'
                        },
                        {
                            drug1: 'Metformin',
                            drug2: 'Lisinopril',
                            severity: 'MINOR',
                            description: 'Lisinopril may enhance blood sugar lowering effect',
                            recommendation: 'Monitor blood glucose'
                        },
                        {
                            drug1: 'Ibuprofen',
                            drug2: 'Lisinopril',
                            severity: 'MODERATE',
                            description: 'May reduce blood pressure control',
                            recommendation: 'Use lowest effective ibuprofen dose'
                        }
                    ]
                });
            }
            return '{"medications":[],"history":[]}';
        });
        fs.writeFileSync.mockImplementation(() => {});

        tracker = new MedicationTracker('test-meds.json');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Database Loading', () => {
        test('loads interactions database successfully', () => {
            expect(tracker.interactions).toBeDefined();
            expect(tracker.interactions.length).toBe(5);
        });

        test('handles missing interactions file gracefully', () => {
            fs.existsSync.mockReturnValue(false);
            const newTracker = new MedicationTracker('test2.json');

            expect(newTracker.interactions).toEqual([]);
        });

        test('handles corrupted interactions file', () => {
            fs.readFileSync.mockImplementation((path) => {
                if (path.includes('medication-interactions.json')) {
                    return 'invalid json{]';
                }
                return '{"medications":[],"history":[]}';
            });

            const newTracker = new MedicationTracker('test3.json');
            expect(newTracker.interactions).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('Drug Name Normalization', () => {
        test('normalizes drug names to lowercase', () => {
            expect(tracker.normalizeDrugName('Aspirin')).toBe('aspirin');
            expect(tracker.normalizeDrugName('IBUPROFEN')).toBe('ibuprofen');
        });

        test('removes common medication suffixes', () => {
            expect(tracker.normalizeDrugName('Aspirin tablet')).toBe('aspirin');
            expect(tracker.normalizeDrugName('Ibuprofen 200mg')).toBe('ibuprofen');
            expect(tracker.normalizeDrugName('Vitamin D capsules')).toBe('vitamin d');
        });

        test('handles medications with multiple suffixes', () => {
            expect(tracker.normalizeDrugName('Metformin 500mg tablet')).toBe('metformin');
        });

        test('trims whitespace', () => {
            expect(tracker.normalizeDrugName('  Aspirin  ')).toBe('aspirin');
        });
    });

    describe('Interaction Detection', () => {
        beforeEach(() => {
            // Add some medications
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', dosage: '81mg', active: true },
                { id: 2, name: 'Metformin', dosage: '500mg', active: true }
            ];
        });

        test('verifies interactions database is loaded', () => {
            // Debug test to ensure database loaded properly
            expect(tracker.interactions).toBeDefined();
            expect(tracker.interactions.length).toBeGreaterThan(0);
        });

        test('detects moderate severity interaction', () => {
            const interactions = tracker.checkInteractions('Ibuprofen', false);

            expect(interactions).toHaveLength(1);
            expect(interactions[0].interaction.severity).toBe('MODERATE');
            expect(interactions[0].interaction.drug1).toBe('Aspirin');
            expect(interactions[0].interaction.drug2).toBe('Ibuprofen');
        });

        test('detects severe severity interaction', () => {
            const interactions = tracker.checkInteractions('Warfarin', false);

            expect(interactions).toHaveLength(1);
            expect(interactions[0].interaction.severity).toBe('SEVERE');
        });

        test('detects minor severity interaction', () => {
            const interactions = tracker.checkInteractions('Lisinopril', false);

            expect(interactions).toHaveLength(1);
            expect(interactions[0].interaction.severity).toBe('MINOR');
            expect(interactions[0].med1).toBe('Metformin');
            expect(interactions[0].med2).toBe('Lisinopril');
        });

        test('detects multiple interactions for same drug', () => {
            tracker.data.medications.push(
                { id: 3, name: 'Lisinopril', dosage: '10mg', active: true }
            );

            const interactions = tracker.checkInteractions('Ibuprofen', false);

            // Should find Aspirin-Ibuprofen, Metformin-Lisinopril, AND Lisinopril-Ibuprofen
            expect(interactions).toHaveLength(3);
            expect(interactions.some(i => i.interaction.severity === 'MODERATE')).toBe(true);
        });

        test('returns empty array when no interactions found', () => {
            tracker.data.medications = [
                { id: 1, name: 'Vitamin C', dosage: '500mg', active: true }
            ];

            const interactions = tracker.checkInteractions('Vitamin D', false);
            expect(interactions).toHaveLength(0);
        });

        test('ignores inactive medications', () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', dosage: '81mg', active: false },
                { id: 2, name: 'Metformin', dosage: '500mg', active: true }
            ];

            const interactions = tracker.checkInteractions('Ibuprofen', false);

            // Should not find Aspirin-Ibuprofen because Aspirin is inactive
            expect(interactions).toHaveLength(0);
        });

        test('handles case-insensitive drug name matching', () => {
            const interactions1 = tracker.checkInteractions('ibuprofen', false);
            const interactions2 = tracker.checkInteractions('IBUPROFEN', false);
            const interactions3 = tracker.checkInteractions('Ibuprofen', false);

            expect(interactions1).toHaveLength(1);
            expect(interactions2).toHaveLength(1);
            expect(interactions3).toHaveLength(1);
        });

        test('matches drug interactions in both directions', () => {
            // Database has Aspirin-Ibuprofen, should also match Ibuprofen-Aspirin
            tracker.data.medications = [
                { id: 1, name: 'Ibuprofen', dosage: '200mg', active: true }
            ];

            const interactions = tracker.checkInteractions('Aspirin', false);
            expect(interactions).toHaveLength(1);
        });
    });

    describe('Interaction Display', () => {
        beforeEach(() => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', dosage: '81mg', active: true }
            ];
        });

        test('displays warnings when interactions found', () => {
            tracker.checkInteractions('Warfarin', true);

            const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(logCalls).toContain('MEDICATION INTERACTION WARNINGS');
            expect(logCalls).toContain('SEVERE');
            expect(logCalls).toContain('Aspirin');
            expect(logCalls).toContain('Warfarin');
            expect(logCalls).toContain('consult your doctor');
        });

        test('does not display when displayWarnings is false', () => {
            tracker.checkInteractions('Warfarin', false);

            const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(logCalls).not.toContain('MEDICATION INTERACTION WARNINGS');
        });

        test('displays severity icons correctly', () => {
            tracker.data.medications.push(
                { id: 2, name: 'Metformin', dosage: '500mg', active: true }
            );

            // Add Warfarin (SEVERE with Aspirin)
            tracker.checkInteractions('Warfarin', true);
            let logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
            expect(logCalls).toContain('🔴'); // Red for SEVERE

            consoleLogSpy.mockClear();

            // Add Ibuprofen (MODERATE with Aspirin)
            tracker.checkInteractions('Ibuprofen', true);
            logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
            expect(logCalls).toContain('🟡'); // Yellow for MODERATE

            consoleLogSpy.mockClear();

            // Add Lisinopril (MINOR with Metformin)
            tracker.checkInteractions('Lisinopril', true);
            logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
            expect(logCalls).toContain('🟢'); // Green for MINOR
        });

        test('displays medication recommendations', () => {
            tracker.checkInteractions('Ibuprofen', true);

            const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(logCalls).toContain('💡');
            expect(logCalls).toContain('Take ibuprofen at least 8 hours');
        });
    });

    describe('Integration with addMedication', () => {
        test('warns about interactions when adding new medication', () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', dosage: '81mg', active: true }
            ];

            tracker.addMedication('Warfarin', '5mg', 'daily', '18:00');

            const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(logCalls).toContain('SEVERE INTERACTION WARNING');
            expect(logCalls).toContain('Aspirin');
            expect(logCalls).toContain('Warfarin');
        });

        test('displays multiple interaction warnings when adding medication', () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', dosage: '81mg', active: true },
                { id: 2, name: 'Lisinopril', dosage: '10mg', active: true }
            ];

            tracker.addMedication('Ibuprofen', '200mg', 'as-needed', '12:00');

            const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            // Should warn about both Aspirin-Ibuprofen AND Lisinopril-Ibuprofen
            expect((logCalls.match(/INTERACTION WARNING/g) || []).length).toBeGreaterThanOrEqual(2);
        });

        test('adds medication successfully even with interactions', () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', dosage: '81mg', active: true }
            ];

            const result = tracker.addMedication('Warfarin', '5mg', 'daily', '18:00');

            expect(result).not.toBeNull();
            expect(result.name).toBe('Warfarin');
            expect(tracker.data.medications).toHaveLength(2);
        });

        test('shows no warnings when adding medication with no interactions', () => {
            tracker.data.medications = [
                { id: 1, name: 'Vitamin C', dosage: '500mg', active: true }
            ];

            tracker.addMedication('Vitamin D', '1000IU', 'daily', '08:00');

            const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(logCalls).not.toContain('INTERACTION WARNING');
        });
    });

    describe('checkInteractions CLI Command', () => {
        test('checks all current medications for interactions', () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', dosage: '81mg', active: true },
                { id: 2, name: 'Ibuprofen', dosage: '200mg', active: true },
                { id: 3, name: 'Metformin', dosage: '500mg', active: true },
                { id: 4, name: 'Lisinopril', dosage: '10mg', active: true }
            ];

            const interactions = tracker.checkInteractions(null, true);

            // Should find: Aspirin-Ibuprofen, Metformin-Lisinopril, Ibuprofen-Lisinopril
            expect(interactions.length).toBeGreaterThanOrEqual(2);
        });

        test('displays message when no medications added yet', () => {
            tracker.data.medications = [];

            const interactions = tracker.checkInteractions();

            expect(interactions).toHaveLength(0);
        });

        test('displays message when only one medication exists', () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', dosage: '81mg', active: true }
            ];

            const interactions = tracker.checkInteractions();

            expect(interactions).toHaveLength(0);
        });
    });

    describe('Real-world Scenarios', () => {
        test('detects common pain medication interaction (Aspirin + Ibuprofen)', () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin 81mg', dosage: '81mg', active: true }
            ];

            const interactions = tracker.checkInteractions('Ibuprofen 200mg', false);

            expect(interactions).toHaveLength(1);
            expect(interactions[0].interaction.severity).toBe('MODERATE');
        });

        test('detects dangerous SSRI + pain medication interaction', () => {
            tracker.data.medications = [
                { id: 1, name: 'Sertraline', dosage: '50mg', active: true }
            ];

            const interactions = tracker.checkInteractions('Tramadol', false);

            expect(interactions).toHaveLength(1);
            expect(interactions[0].interaction.severity).toBe('SEVERE');
            expect(interactions[0].interaction.description).toContain('serotonin syndrome');
        });

        test('handles medication names with dosages in the name', () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin 81mg tablet', dosage: '81mg', active: true }
            ];

            const interactions = tracker.checkInteractions('Ibuprofen 200mg capsule', false);

            expect(interactions).toHaveLength(1);
        });
    });
});
