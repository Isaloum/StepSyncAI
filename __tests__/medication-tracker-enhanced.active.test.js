const {
  EnhancedMedicationTracker,
  InMemoryAuditStore,
} = require('../medication-tracker-enhanced');

describe('EnhancedMedicationTracker (current API)', () => {
  test('parseMedicationInput parses name + dosage', () => {
    const tracker = new EnhancedMedicationTracker({ enableAuditLog: false });
    const parsed = tracker.parseMedicationInput('Lisinopril 10mg');

    expect(parsed).toMatchObject({
      name: 'Lisinopril',
      dosage: 10,
      unit: 'mg',
      parsed: true,
    });
    expect(parsed.confidence).toBeGreaterThan(0.5);
  });

  test('parseMedicationInput warns when dosage missing', () => {
    const tracker = new EnhancedMedicationTracker({ enableAuditLog: false });
    const parsed = tracker.parseMedicationInput('Aspirin');

    expect(parsed.name).toBe('Aspirin');
    expect(parsed.parsed).toBe(false);
    expect(Array.isArray(parsed.warnings)).toBe(true);
    expect(parsed.warnings.join(' ')).toMatch(/dosage/i);
  });

  test('addMedication validates and stores meds', () => {
    const tracker = new EnhancedMedicationTracker({ enableAuditLog: true });

    const result = tracker.addMedication({
      name: 'Lisinopril',
      dosage: 10,
      unit: 'mg',
      frequency: 'once daily',
      prescriber: 'Dr. Test',
    });

    expect(result.success).toBe(true);
    expect(typeof result.medicationId).toBe('string');

    const stored = tracker.getMedication(result.medicationId);
    expect(stored).toBeTruthy();
    expect(stored.name).toBe('Lisinopril');
  });

  test('addMedication returns validationErrors when required fields missing', () => {
    const tracker = new EnhancedMedicationTracker({ enableAuditLog: false });

    const result = tracker.addMedication({
      name: 'TestMed',
      dosage: 10,
      // unit missing
      frequency: 'once daily',
    });

    expect(result.success).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(0);
  });

  test('logIntake tracks intake for existing medication', () => {
    const tracker = new EnhancedMedicationTracker({ enableAuditLog: false });

    const add = tracker.addMedication({
      name: 'Metformin',
      dosage: 500,
      unit: 'mg',
      frequency: 'twice daily',
    });

    const intake = tracker.logIntake(add.medicationId, { notes: 'after meal' });
    expect(intake.success).toBe(true);
    expect(intake.data).toHaveProperty('dosage', '500mg');

    const stored = tracker.getMedication(add.medicationId);
    expect(stored.intakeLog.length).toBe(1);
  });
});

describe('InMemoryAuditStore', () => {
  test('records logs and returns statistics', () => {
    const store = new InMemoryAuditStore();

    store.store({ action: 'A', userId: 'u1', timestamp: '2026-01-01T00:00:00.000Z' });
    store.store({ action: 'A', userId: 'u2', timestamp: '2026-01-02T00:00:00.000Z' });
    store.store({ action: 'B', userId: 'u1', timestamp: '2026-01-03T00:00:00.000Z' });

    const stats = store.getStatistics();
    expect(stats.totalEntries).toBe(3);
    expect(stats.actionCounts).toEqual({ A: 2, B: 1 });
    expect(stats.userCounts).toEqual({ u1: 2, u2: 1 });

    expect(store.clear()).toBe(3);
    expect(store.getAll()).toEqual([]);
  });
});
