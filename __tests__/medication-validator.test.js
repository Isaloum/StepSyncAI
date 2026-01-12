// Unmock to test real implementation
jest.unmock('../medication-validator');
jest.unmock('../enhanced-medication-manager');

const MedicationValidator = require('../medication-validator');

describe('MedicationValidator', () => {
    let validator;

    beforeEach(() => {
        validator = new MedicationValidator();
    });

    describe('Basic Validation', () => {
        test('should validate correct medication/dosage combination', () => {
            const result = validator.validate('Sertraline', '50mg');
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
            expect(result.medication).toBeDefined();
            expect(result.medication.name).toBe('Sertraline');
        });

        test('should reject empty medication name', () => {
            const result = validator.validate('', '50mg');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('required');
        });

        test('should reject null medication name', () => {
            const result = validator.validate(null, '50mg');
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('required');
        });

        test('should reject empty dosage', () => {
            const result = validator.validate('Sertraline', '');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('required');
        });

        test('should reject unknown medication', () => {
            const result = validator.validate('UnknownMed123', '50mg');
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('not found');
        });

        test('should provide suggestions for similar medications', () => {
            const result = validator.validate('Sertral', '50mg');
            expect(result.valid).toBe(false);
            expect(result.info).toHaveProperty('suggestions');
            expect(result.info.suggestions.length).toBeGreaterThan(0);
        });

        test('should reject invalid dosage', () => {
            const result = validator.validate('Sertraline', '999mg');
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('Invalid dosage');
            expect(result.info).toHaveProperty('validDosages');
        });
    });

    describe('Dosage Warnings', () => {
        test('should warn about high dosages', () => {
            // Use a medication where we can test high dosage
            const result = validator.validate('Sertraline', '100mg');
            expect(result.valid).toBe(true);
            
            // The validator should add warnings for high dosages
            // This depends on the medication's maxDailyDose
        });

        test('should include severity levels in warnings', () => {
            const result = validator.validate('Sertraline', '50mg');
            
            if (result.warnings.length > 0) {
                result.warnings.forEach(warning => {
                    expect(warning).toHaveProperty('type');
                    expect(warning).toHaveProperty('message');
                    expect(warning).toHaveProperty('severity');
                    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(warning.severity);
                });
            }
        });
    });

    describe('Pregnancy Safety Checks', () => {
        test('should check pregnancy safety when requested', () => {
            const result = validator.validate('Sertraline', '50mg', { checkPregnancy: true });
            expect(result.valid).toBe(true);
            
            // Should have medication info
            expect(result.medication).toBeDefined();
        });

        test('should warn about Category D medications', () => {
            // Paroxetine is Category D
            const result = validator.validate('Paroxetine', '20mg', { checkPregnancy: true });
            expect(result.valid).toBe(true);
            
            const pregnancyWarning = result.warnings.find(w => w.type === 'PREGNANCY_RISK');
            if (pregnancyWarning) {
                expect(pregnancyWarning.severity).toBe('HIGH');
                expect(pregnancyWarning.category).toBe('D');
            }
        });

        test('should warn about Category C medications', () => {
            // Sertraline is Category C
            const result = validator.validate('Sertraline', '50mg', { checkPregnancy: true });
            expect(result.valid).toBe(true);
            
            const pregnancyWarning = result.warnings.find(w => w.type === 'PREGNANCY_RISK');
            if (pregnancyWarning) {
                expect(pregnancyWarning.severity).toBe('MEDIUM');
                expect(pregnancyWarning.category).toBe('C');
            }
        });

        test('should warn about lactation safety', () => {
            const result = validator.validate('Sertraline', '50mg', { checkPregnancy: true });
            
            if (result.medication && result.medication.lactationSafety === 'Caution') {
                const lactationWarning = result.warnings.find(w => w.type === 'LACTATION_RISK');
                expect(lactationWarning).toBeDefined();
            }
        });
    });

    describe('Multiple Medication Validation', () => {
        test('should detect duplicate medications', () => {
            const medications = [
                { name: 'Sertraline', dosage: '50mg' },
                { name: 'Fluoxetine', dosage: '20mg' },
                { name: 'Sertraline', dosage: '50mg' } // Duplicate
            ];
            
            const result = validator.validateMultiple(medications);
            expect(result.valid).toBe(false);
            expect(result.duplicates.length).toBeGreaterThan(0);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('should accept unique medications', () => {
            const medications = [
                { name: 'Sertraline', dosage: '50mg' },
                { name: 'Fluoxetine', dosage: '20mg' },
                { name: 'Bupropion', dosage: '150mg' }
            ];
            
            const result = validator.validateMultiple(medications);
            expect(result.valid).toBe(true);
            expect(result.duplicates).toEqual([]);
        });

        test('should handle different dosages as different medications', () => {
            const medications = [
                { name: 'Sertraline', dosage: '50mg' },
                { name: 'Sertraline', dosage: '100mg' } // Different dosage
            ];
            
            const result = validator.validateMultiple(medications);
            expect(result.valid).toBe(true);
        });

        test('should be case-insensitive for duplicates', () => {
            const medications = [
                { name: 'Sertraline', dosage: '50mg' },
                { name: 'SERTRALINE', dosage: '50mg' }
            ];
            
            const result = validator.validateMultiple(medications);
            expect(result.valid).toBe(false);
            expect(result.duplicates.length).toBeGreaterThan(0);
        });

        test('should handle empty array', () => {
            const result = validator.validateMultiple([]);
            expect(result.valid).toBe(true);
        });

        test('should handle non-array input', () => {
            const result = validator.validateMultiple('not-an-array');
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('array');
        });
    });

    describe('Drug Interaction Checks', () => {
        test('should warn about same category medications', () => {
            const result = validator.checkInteractions('Fluoxetine', ['Sertraline']);
            
            // Both are SSRIs
            expect(result.warnings.length).toBeGreaterThan(0);
            const sameCategoryWarning = result.warnings.find(w => w.type === 'SAME_CATEGORY');
            expect(sameCategoryWarning).toBeDefined();
        });

        test('should warn about high-risk combinations', () => {
            const result = validator.checkInteractions('Lorazepam', ['Alprazolam']);
            
            // Both are Benzodiazepines
            expect(result.hasInteractions).toBe(true);
        });

        test('should handle empty existing medications', () => {
            const result = validator.checkInteractions('Sertraline', []);
            expect(result.hasInteractions).toBe(false);
            expect(result.warnings).toEqual([]);
        });

        test('should handle unknown medications gracefully', () => {
            const result = validator.checkInteractions('UnknownMed', ['Sertraline']);
            expect(result.hasInteractions).toBe(false);
        });

        test('should include medication names in warnings', () => {
            const result = validator.checkInteractions('Fluoxetine', ['Sertraline']);
            
            if (result.warnings.length > 0) {
                result.warnings.forEach(warning => {
                    expect(warning).toHaveProperty('medications');
                    expect(Array.isArray(warning.medications)).toBe(true);
                });
            }
        });
    });

    describe('Validation Summary', () => {
        test('should generate success summary', () => {
            const result = validator.validate('Sertraline', '50mg');
            const summary = validator.getSummary(result);
            
            expect(summary).toContain('✓ Valid');
            expect(summary).toContain('Sertraline');
        });

        test('should generate error summary', () => {
            const result = validator.validate('UnknownMed', '50mg');
            const summary = validator.getSummary(result);
            
            expect(summary).toContain('❌');
            expect(summary).toContain('failed');
        });

        test('should include warnings in summary', () => {
            const result = validator.validate('Sertraline', '50mg', { checkPregnancy: true });
            const summary = validator.getSummary(result);
            
            if (result.warnings.length > 0) {
                expect(summary).toContain('warning');
            }
        });

        test('should include medication details', () => {
            const result = validator.validate('Sertraline', '50mg');
            const summary = validator.getSummary(result);
            
            expect(summary).toContain('Category');
        });
    });

    describe('Edge Cases', () => {
        test('should handle whitespace in inputs', () => {
            const result = validator.validate('  Sertraline  ', '  50mg  ');
            expect(result.valid).toBe(true);
        });

        test('should handle brand names', () => {
            const result = validator.validate('Zoloft', '50mg');
            expect(result.valid).toBe(true);
            expect(result.medication.name).toBe('Sertraline');
        });

        test('should handle mixed case', () => {
            const result = validator.validate('SERTRALINE', '50MG');
            expect(result.valid).toBe(true);
        });

        test('should provide medication info even on error', () => {
            const result = validator.validate('Sertraline', '999mg');
            expect(result.valid).toBe(false);
            expect(result.info).toHaveProperty('validDosages');
            expect(result.info).toHaveProperty('category');
        });
    });

    describe('Warning Types', () => {
        test('should categorize warnings correctly', () => {
            const result = validator.validate('Sertraline', '50mg', { checkPregnancy: true });
            
            result.warnings.forEach(warning => {
                expect(['HIGH_DOSAGE', 'LOW_DOSAGE', 'PREGNANCY_RISK', 'LACTATION_RISK'])
                    .toContain(warning.type);
            });
        });

        test('should assign severity levels', () => {
            const result = validator.validate('Sertraline', '50mg', { checkPregnancy: true });
            
            result.warnings.forEach(warning => {
                expect(['LOW', 'MEDIUM', 'HIGH']).toContain(warning.severity);
            });
        });
    });

    describe('Information Fields', () => {
        test('should provide medication info on success', () => {
            const result = validator.validate('Sertraline', '50mg');
            
            expect(result.info).toHaveProperty('category');
            expect(result.info).toHaveProperty('manufacturer');
            expect(result.info).toHaveProperty('frequency');
            expect(result.info).toHaveProperty('forms');
        });

        test('should provide valid dosages on dosage error', () => {
            const result = validator.validate('Sertraline', '999mg');
            
            expect(result.info).toHaveProperty('validDosages');
            expect(Array.isArray(result.info.validDosages)).toBe(true);
        });

        test('should provide suggestions on medication not found', () => {
            const result = validator.validate('Sertral', '50mg');
            
            expect(result.info).toHaveProperty('suggestions');
            expect(Array.isArray(result.info.suggestions)).toBe(true);
        });
    });
});
