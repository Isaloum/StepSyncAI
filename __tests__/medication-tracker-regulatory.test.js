
const { EnhancedMedicationTracker, FDADatabaseManager, HealthCanadaDatabaseManager, InMemoryAuditStore } = require('../medication-tracker-enhanced');

describe('Medication Tracker - Regulatory Compliance', () => {
  let tracker;
  let mockAuditLogger;

  beforeEach(() => {
    mockAuditLogger = {
      log: jest.fn(),
      getLogs: jest.fn().mockReturnValue([]),
      clear: jest.fn(),
    };
  });

  describe('US Region (FDA)', () => {
    beforeEach(() => {
        tracker = new EnhancedMedicationTracker({
            region: 'US',
            auditLogger: mockAuditLogger
        });
    });

    test('should validate against FDA database', async () => {
        // Lisinopril is in FDA mock
        const result = await tracker.addMedicationWithFDAVerification({
            name: 'Lisinopril',
            dosage: '10mg'
        });
        expect(result.fdaCompliance).toBeDefined();
        expect(result.fdaCompliance.approved).toBe(true);
        expect(result.healthCanadaCompliance).toBeNull();
    });

    test('should warn if medication not FDA approved', async () => {
        // UnknownDrug triggers fake error in addMedicationWithFDAVerification but let's try a safe unknown
        const result = await tracker.addMedicationWithFDAVerification({
            name: 'UnknownMeds',
            dosage: '10mg'
        });
        
        expect(result.warnings.some(w => w.includes('FDA'))).toBe(true);
    });
  });

  describe('Canada Region (Health Canada)', () => {
    beforeEach(() => {
        tracker = new EnhancedMedicationTracker({
            region: 'CA',
            auditLogger: mockAuditLogger
        });
    });

    test('should validate against Health Canada database', async () => {
        // Acetaminophen is in Health Canada mock but not FDA mock
        const result = await tracker.addMedicationWithFDAVerification({
            name: 'Acetaminophen',
            dosage: '500mg',
            unit: 'mg'
        });
        
        expect(result.healthCanadaCompliance).toBeDefined();
        expect(result.healthCanadaCompliance.approved).toBe(true);
        expect(result.fdaCompliance).toBeNull();
    });

    test('should validate dosage limits specific to Canada', async () => {
        // Acetaminophen max in HC mock is 4000
        const result = await tracker.addMedicationWithFDAVerification({
            name: 'Acetaminophen',
            dosage: '5000mg', // Over limit
            unit: 'mg'
        });
        
        expect(result.warnings.some(w => w.includes('Health Canada maximum'))).toBe(true);
    });
    
    test('should warn if medication not Health Canada approved', async () => {
        const result = await tracker.addMedicationWithFDAVerification({
            name: 'RandomDrug',
            dosage: '10mg'
        });
        
        expect(result.warnings.some(w => w.includes('Health Canada'))).toBe(true);
    });
  });

  describe('Multi-Region (BOTH)', () => {
    beforeEach(() => {
        tracker = new EnhancedMedicationTracker({
            region: 'BOTH',
            auditLogger: mockAuditLogger
        });
    });

    test('should validate against both databases', async () => {
        // Lisinopril is in both (assuming default lists)
        const result = await tracker.addMedicationWithFDAVerification({
            name: 'Lisinopril',
            dosage: '10mg'
        });
        
        expect(result.fdaCompliance).toBeDefined();
        expect(result.healthCanadaCompliance).toBeDefined();
    });
  });
});
