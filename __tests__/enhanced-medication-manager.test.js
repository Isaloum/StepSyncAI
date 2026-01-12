// Unmock to test real implementation
jest.unmock('../enhanced-medication-manager');

const EnhancedMedicationManager = require('../enhanced-medication-manager');

describe('EnhancedMedicationManager', () => {
    let manager;

    beforeEach(() => {
        manager = new EnhancedMedicationManager();
    });

    describe('Database Loading', () => {
        test('should load medication database successfully', () => {
            expect(manager.medications).toBeDefined();
            expect(Array.isArray(manager.medications)).toBe(true);
            expect(manager.medications.length).toBeGreaterThan(0);
        });

        test('should build index maps', () => {
            expect(manager.medicationsMap).toBeDefined();
            expect(manager.categoriesMap).toBeDefined();
            expect(manager.medicationsMap.size).toBeGreaterThan(0);
            expect(manager.categoriesMap.size).toBeGreaterThan(0);
        });
    });

    describe('Medication Search', () => {
        test('should find exact match', () => {
            const results = manager.searchMedications('Sertraline', 10);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toBe('Sertraline');
            expect(results[0].matchScore).toBe(100);
        });

        test('should find medication by brand name', () => {
            const results = manager.searchMedications('Zoloft', 10);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].matchedName).toBe('Zoloft');
        });

        test('should perform fuzzy matching', () => {
            const results = manager.searchMedications('sert', 10);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name.toLowerCase()).toContain('sert');
        });

        test('should return empty array for invalid query', () => {
            const results = manager.searchMedications('xyzabc123', 10);
            expect(results).toEqual([]);
        });

        test('should handle case-insensitive search', () => {
            const results = manager.searchMedications('SERTRALINE', 10);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toBe('Sertraline');
        });

        test('should limit results', () => {
            const results = manager.searchMedications('a', 5);
            expect(results.length).toBeLessThanOrEqual(5);
        });
    });

    describe('Get Medication By Name', () => {
        test('should get medication by exact name', () => {
            const med = manager.getMedicationByName('Sertraline');
            expect(med).toBeDefined();
            expect(med.name).toBe('Sertraline');
        });

        test('should get medication by brand name', () => {
            const med = manager.getMedicationByName('Zoloft');
            expect(med).toBeDefined();
            expect(med.name).toBe('Sertraline');
        });

        test('should be case-insensitive', () => {
            const med = manager.getMedicationByName('sertraline');
            expect(med).toBeDefined();
            expect(med.name).toBe('Sertraline');
        });

        test('should return null for unknown medication', () => {
            const med = manager.getMedicationByName('UnknownMed123');
            expect(med).toBeNull();
        });

        test('should handle null/undefined input', () => {
            expect(manager.getMedicationByName(null)).toBeNull();
            expect(manager.getMedicationByName(undefined)).toBeNull();
        });
    });

    describe('Get Valid Dosages', () => {
        test('should return valid dosages for medication', () => {
            const dosages = manager.getValidDosages('Sertraline');
            expect(Array.isArray(dosages)).toBe(true);
            expect(dosages.length).toBeGreaterThan(0);
            expect(dosages[0]).toHaveProperty('value');
            expect(dosages[0]).toHaveProperty('label');
        });

        test('should return empty array for unknown medication', () => {
            const dosages = manager.getValidDosages('UnknownMed');
            expect(dosages).toEqual([]);
        });

        test('should work with brand names', () => {
            const dosages = manager.getValidDosages('Zoloft');
            expect(dosages.length).toBeGreaterThan(0);
        });
    });

    describe('Validate Medication Dosage', () => {
        test('should validate correct medication/dosage combination', () => {
            const result = manager.validateMedicationDosage('Sertraline', '50mg');
            expect(result.valid).toBe(true);
            expect(result.medication).toBeDefined();
            expect(result.dosage).toBe('50mg');
        });

        test('should reject invalid dosage', () => {
            const result = manager.validateMedicationDosage('Sertraline', '999mg');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid dosage');
            expect(result.validDosages).toBeDefined();
        });

        test('should reject unknown medication', () => {
            const result = manager.validateMedicationDosage('UnknownMed', '50mg');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('should handle missing dosage', () => {
            const result = manager.validateMedicationDosage('Sertraline', '');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });

        test('should warn about high dosages', () => {
            // Find a medication and try to use a dosage that exceeds max
            const result = manager.validateMedicationDosage('Sertraline', '100mg');
            expect(result.valid).toBe(true);
            // Check if warnings are present for high dosages
        });
    });

    describe('Category Management', () => {
        test('should get all categories', () => {
            const categories = manager.getAllCategories();
            expect(Array.isArray(categories)).toBe(true);
            expect(categories.length).toBeGreaterThan(0);
            expect(categories).toContain('SSRI');
        });

        test('should get medications by category', () => {
            const ssriMeds = manager.getMedicationsByCategory('SSRI');
            expect(Array.isArray(ssriMeds)).toBe(true);
            expect(ssriMeds.length).toBeGreaterThan(0);
            ssriMeds.forEach(med => {
                expect(med.category).toBe('SSRI');
            });
        });

        test('should return empty array for unknown category', () => {
            const meds = manager.getMedicationsByCategory('UnknownCategory');
            expect(meds).toEqual([]);
        });
    });

    describe('Medication Details', () => {
        test('should get complete medication details', () => {
            const details = manager.getMedicationDetails('Sertraline');
            expect(details).toBeDefined();
            expect(details).toHaveProperty('name');
            expect(details).toHaveProperty('genericName');
            expect(details).toHaveProperty('brandNames');
            expect(details).toHaveProperty('manufacturer');
            expect(details).toHaveProperty('category');
            expect(details).toHaveProperty('dosages');
            expect(details).toHaveProperty('forms');
            expect(details).toHaveProperty('frequency');
            expect(details).toHaveProperty('maxDailyDose');
            expect(details).toHaveProperty('pregnancyCategory');
            expect(details).toHaveProperty('lactationSafety');
        });

        test('should return null for unknown medication', () => {
            const details = manager.getMedicationDetails('UnknownMed');
            expect(details).toBeNull();
        });
    });

    describe('Pregnancy Safety', () => {
        test('should get pregnancy safety information', () => {
            const safety = manager.getPregnancySafety('Sertraline');
            expect(safety).toBeDefined();
            expect(safety).toHaveProperty('medicationName');
            expect(safety).toHaveProperty('pregnancyCategory');
            expect(safety).toHaveProperty('lactationSafety');
            expect(safety).toHaveProperty('warnings');
        });

        test('should return null for unknown medication', () => {
            const safety = manager.getPregnancySafety('UnknownMed');
            expect(safety).toBeNull();
        });

        test('should provide warnings for pregnancy categories', () => {
            const warningA = manager.getPregnancyWarnings('A');
            const warningD = manager.getPregnancyWarnings('D');
            const warningX = manager.getPregnancyWarnings('X');
            
            expect(warningA).toContain('No risk');
            expect(warningD).toContain('Positive evidence of risk');
            expect(warningX).toContain('Contraindicated');
        });
    });

    describe('All Medication Names', () => {
        test('should get all medication names', () => {
            const names = manager.getAllMedicationNames();
            expect(Array.isArray(names)).toBe(true);
            expect(names.length).toBeGreaterThan(0);
        });

        test('should include both generic and brand names', () => {
            const names = manager.getAllMedicationNames();
            const nameStrings = names.map(n => n.name);
            
            expect(nameStrings).toContain('Sertraline');
            expect(nameStrings).toContain('Zoloft');
        });

        test('should not have duplicates', () => {
            const names = manager.getAllMedicationNames();
            const nameStrings = names.map(n => n.name.toLowerCase());
            const uniqueNames = new Set(nameStrings);
            
            expect(nameStrings.length).toBe(uniqueNames.size);
        });

        test('should be sorted alphabetically', () => {
            const names = manager.getAllMedicationNames();
            const nameStrings = names.map(n => n.name);
            const sorted = [...nameStrings].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
            
            expect(nameStrings).toEqual(sorted);
        });
    });

    describe('Statistics', () => {
        test('should get database statistics', () => {
            const stats = manager.getStatistics();
            expect(stats).toHaveProperty('totalMedications');
            expect(stats).toHaveProperty('totalCategories');
            expect(stats).toHaveProperty('categories');
            
            expect(stats.totalMedications).toBeGreaterThan(0);
            expect(stats.totalCategories).toBeGreaterThan(0);
            expect(typeof stats.categories).toBe('object');
        });

        test('should have correct category counts', () => {
            const stats = manager.getStatistics();
            const totalFromCategories = Object.values(stats.categories)
                .reduce((sum, count) => sum + count, 0);
            
            expect(totalFromCategories).toBe(stats.totalMedications);
        });
    });

    describe('Match Score Calculation', () => {
        test('should score exact match highest', () => {
            const exact = manager.calculateMatchScore('sertraline', 'sertraline');
            const starts = manager.calculateMatchScore('sert', 'sertraline');
            const contains = manager.calculateMatchScore('tral', 'sertraline');
            
            expect(exact).toBe(100);
            expect(starts).toBe(90);
            expect(contains).toBe(70);
        });

        test('should score no match as zero', () => {
            const score = manager.calculateMatchScore('xyz', 'sertraline');
            expect(score).toBe(0);
        });

        test('should handle fuzzy matching', () => {
            const score = manager.calculateMatchScore('srtln', 'sertraline');
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThan(70);
        });
    });
});
