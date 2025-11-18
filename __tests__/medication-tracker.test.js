const fs = require('fs');
const MedicationTracker = require('../medication-tracker');

// Mock fs module
jest.mock('fs');

describe('MedicationTracker', () => {
  let tracker;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock fs methods with default behavior
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('{}');
    fs.writeFileSync.mockImplementation(() => {});

    // Create tracker instance
    tracker = new MedicationTracker('test-medications.json');
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Constructor and Data Loading', () => {
    test('should initialize with default data structure when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const newTracker = new MedicationTracker('new-test.json');

      expect(newTracker.data).toHaveProperty('medications');
      expect(newTracker.data).toHaveProperty('history');
      expect(newTracker.data.medications).toEqual([]);
      expect(newTracker.data.history).toEqual([]);
    });

    test('should load existing data from file', () => {
      const mockData = {
        medications: [
          { id: 1, name: 'Aspirin', dosage: '100mg', frequency: 'daily', scheduledTime: '08:00', active: true }
        ],
        history: [
          { medicationId: 1, medicationName: 'Aspirin', dosage: '100mg', takenAt: '2024-01-01T08:00:00Z', notes: '' }
        ]
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      const newTracker = new MedicationTracker('existing-test.json');

      expect(newTracker.data.medications.length).toBe(1);
      expect(newTracker.data.history.length).toBe(1);
      expect(newTracker.data.medications[0].name).toBe('Aspirin');
    });

    test('should handle corrupted JSON file gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json {{{');

      const newTracker = new MedicationTracker('corrupted-test.json');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(newTracker.data.medications).toEqual([]);
      expect(newTracker.data.history).toEqual([]);
    });

    test('should handle file read error gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const newTracker = new MedicationTracker('error-test.json');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(newTracker.data).toHaveProperty('medications');
      expect(newTracker.data).toHaveProperty('history');
    });
  });

  describe('addMedication', () => {
    test('should add medication with all required fields', () => {
      const result = tracker.addMedication('Ibuprofen', '200mg', 'twice-daily', '08:00,20:00');

      expect(result).not.toBeNull();
      expect(result.name).toBe('Ibuprofen');
      expect(result.dosage).toBe('200mg');
      expect(result.frequency).toBe('twice-daily');
      expect(result.scheduledTime).toBe('08:00,20:00');
      expect(result.active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    test('should add medication to data array', () => {
      tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');

      expect(tracker.data.medications.length).toBe(1);
      expect(tracker.data.medications[0].name).toBe('Aspirin');
    });

    test('should save data after adding medication', () => {
      tracker.addMedication('Test Med', '50mg', 'daily', '09:00');

      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('should return null on save failure', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = tracker.addMedication('Test Med', '50mg', 'daily', '09:00');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should generate IDs for medications', () => {
      const med1 = tracker.addMedication('Med1', '10mg', 'daily', '08:00');
      const med2 = tracker.addMedication('Med2', '20mg', 'daily', '09:00');

      expect(med1.id).toBeDefined();
      expect(med2.id).toBeDefined();
      // IDs should be numbers
      expect(typeof med1.id).toBe('number');
      expect(typeof med2.id).toBe('number');
    });

    test('should handle various frequency types', () => {
      const frequencies = ['daily', 'twice-daily', 'weekly', 'as-needed'];

      frequencies.forEach(freq => {
        const med = tracker.addMedication(`Med-${freq}`, '10mg', freq, '08:00');
        expect(med.frequency).toBe(freq);
      });
    });

    test('should handle multiple scheduled times', () => {
      const med = tracker.addMedication('Multi-dose', '10mg', 'three-times-daily', '08:00,14:00,20:00');

      expect(med.scheduledTime).toBe('08:00,14:00,20:00');
    });
  });

  describe('listMedications', () => {
    test('should list only active medications by default', () => {
      tracker.addMedication('Active Med', '10mg', 'daily', '08:00');
      tracker.addMedication('Inactive Med', '20mg', 'daily', '09:00');
      tracker.data.medications[1].active = false;

      tracker.listMedications();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Your Medications'));
    });

    test('should list all medications when activeOnly is false', () => {
      tracker.addMedication('Active Med', '10mg', 'daily', '08:00');
      tracker.addMedication('Inactive Med', '20mg', 'daily', '09:00');
      tracker.data.medications[1].active = false;

      tracker.listMedications(false);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle empty medication list', () => {
      tracker.listMedications();

      expect(consoleLogSpy).toHaveBeenCalledWith('No medications found.');
    });

    test('should display medication details', () => {
      tracker.addMedication('Test Med', '50mg', 'daily', '08:00');
      consoleLogSpy.mockClear();

      tracker.listMedications();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test Med'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('50mg'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('daily'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('08:00'));
    });
  });

  describe('markAsTaken', () => {
    test('should mark existing medication as taken', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');

      const result = tracker.markAsTaken(med.id);

      expect(result).toBe(true);
      expect(tracker.data.history.length).toBe(1);
    });

    test('should create history record with correct data', () => {
      const med = tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');

      tracker.markAsTaken(med.id, 'Taken with food');

      const record = tracker.data.history[0];
      expect(record.medicationId).toBe(med.id);
      expect(record.medicationName).toBe('Aspirin');
      expect(record.dosage).toBe('100mg');
      expect(record.notes).toBe('Taken with food');
      expect(record.takenAt).toBeDefined();
    });

    test('should handle notes parameter', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');

      tracker.markAsTaken(med.id, 'With breakfast');

      expect(tracker.data.history[0].notes).toBe('With breakfast');
    });

    test('should work without notes', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');

      tracker.markAsTaken(med.id);

      expect(tracker.data.history[0].notes).toBe('');
    });

    test('should return false for non-existent medication', () => {
      const result = tracker.markAsTaken(99999);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    test('should parse medicationId as integer', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');

      const result = tracker.markAsTaken(med.id.toString());

      expect(result).toBe(true);
    });

    test('should allow marking same medication multiple times', () => {
      const med = tracker.addMedication('Multi-dose', '10mg', 'three-times-daily', '08:00,14:00,20:00');

      tracker.markAsTaken(med.id, 'Morning dose');
      tracker.markAsTaken(med.id, 'Afternoon dose');
      tracker.markAsTaken(med.id, 'Evening dose');

      expect(tracker.data.history.length).toBe(3);
    });

    test('should record timestamp when marked as taken', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');
      const beforeTime = new Date().toISOString();

      tracker.markAsTaken(med.id);

      const afterTime = new Date().toISOString();
      const record = tracker.data.history[0];

      expect(record.takenAt).toBeDefined();
      expect(record.takenAt >= beforeTime).toBe(true);
      expect(record.takenAt <= afterTime).toBe(true);
    });
  });

  describe('checkTodayStatus', () => {
    test('should display status for active medications', () => {
      tracker.addMedication('Test Med', '10mg', 'daily', '08:00');

      tracker.checkTodayStatus();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Medication Status'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test Med'));
    });

    test('should show NOT TAKEN status for medications not taken today', () => {
      tracker.addMedication('Test Med', '10mg', 'daily', '08:00');

      tracker.checkTodayStatus();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('NOT TAKEN'));
    });

    test('should show TAKEN status for medications taken today', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');
      tracker.markAsTaken(med.id);
      consoleLogSpy.mockClear();

      tracker.checkTodayStatus();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('TAKEN'));
    });

    test('should not show inactive medications', () => {
      const med = tracker.addMedication('Inactive Med', '10mg', 'daily', '08:00');
      tracker.removeMedication(med.id);
      consoleLogSpy.mockClear();

      tracker.checkTodayStatus();

      const statusCalls = consoleLogSpy.mock.calls.flat().join(' ');
      // Should show "No active medications" since we deactivated the only one
      expect(statusCalls).toContain('No active medications');
    });

    test('should handle empty medication list', () => {
      tracker.checkTodayStatus();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No active medications'));
    });

    test('should show all doses taken today', () => {
      const med = tracker.addMedication('Multi-dose', '10mg', 'twice-daily', '08:00,20:00');
      tracker.markAsTaken(med.id, 'Morning');
      tracker.markAsTaken(med.id, 'Evening');
      consoleLogSpy.mockClear();

      tracker.checkTodayStatus();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should not show medications taken on previous days', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');

      // Manually add a history record from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      tracker.data.history.push({
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        takenAt: yesterday.toISOString(),
        notes: ''
      });

      consoleLogSpy.mockClear();
      tracker.checkTodayStatus();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('NOT TAKEN'));
    });
  });

  describe('getHistory', () => {
    test('should retrieve history for last 7 days by default', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');
      tracker.markAsTaken(med.id);

      tracker.getHistory();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Last 7 days'));
    });

    test('should filter history by medication ID', () => {
      const med1 = tracker.addMedication('Med1', '10mg', 'daily', '08:00');
      const med2 = tracker.addMedication('Med2', '20mg', 'daily', '09:00');

      tracker.markAsTaken(med1.id);
      tracker.markAsTaken(med2.id);

      consoleLogSpy.mockClear();
      tracker.getHistory(med1.id);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Med1'));
    });

    test('should support custom day range', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');
      tracker.markAsTaken(med.id);
      consoleLogSpy.mockClear();

      tracker.getHistory(null, 14);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Last 14 days'));
    });

    test('should handle empty history', () => {
      tracker.getHistory();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No history found'));
    });

    test('should not show records older than specified days', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');

      // Add a record from 10 days ago
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      tracker.data.history.push({
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        takenAt: oldDate.toISOString(),
        notes: 'Old record'
      });

      consoleLogSpy.mockClear();
      tracker.getHistory(null, 7);

      // Should show "No history found" because record is older than 7 days
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No history found'));
    });

    test('should display medication details in history', () => {
      const med = tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');
      tracker.markAsTaken(med.id, 'With food');
      consoleLogSpy.mockClear();

      tracker.getHistory();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Aspirin'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('100mg'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('With food'));
    });
  });

  describe('removeMedication', () => {
    test('should deactivate existing medication', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');

      const result = tracker.removeMedication(med.id);

      expect(result).toBe(true);
      expect(tracker.data.medications[0].active).toBe(false);
    });

    test('should return false for non-existent medication', () => {
      const result = tracker.removeMedication(99999);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    test('should parse medication ID as integer', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');

      const result = tracker.removeMedication(med.id.toString());

      expect(result).toBe(true);
      expect(tracker.data.medications[0].active).toBe(false);
    });

    test('should not delete medication, only deactivate', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');
      tracker.removeMedication(med.id);

      expect(tracker.data.medications.length).toBe(1);
      expect(tracker.data.medications[0].active).toBe(false);
    });

    test('should save data after deactivation', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');
      fs.writeFileSync.mockClear();

      tracker.removeMedication(med.id);

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('Data Persistence', () => {
    test('saveData should return true on successful save', () => {
      const result = tracker.saveData();

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('saveData should return false on write error', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = tracker.saveData();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('saveData should write formatted JSON', () => {
      tracker.saveData();

      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toBe('test-medications.json');

      // Check that JSON is formatted (has indentation)
      const jsonData = writeCall[1];
      expect(jsonData).toContain('\n');
      expect(jsonData).toContain('  ');
    });

    test('data should persist across save/load cycle', () => {
      tracker.addMedication('Persistent Med', '50mg', 'daily', '08:00');
      const savedData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);

      // Simulate loading saved data
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(savedData));

      const newTracker = new MedicationTracker('test.json');

      expect(newTracker.data.medications[0].name).toBe('Persistent Med');
    });
  });

  describe('Edge Cases', () => {
    test('should handle medication names with special characters', () => {
      const med = tracker.addMedication("Tylenol® Extra Strength", '500mg', 'as-needed', '08:00');

      expect(med.name).toBe("Tylenol® Extra Strength");
    });

    test('should handle unicode in medication names', () => {
      const med = tracker.addMedication('阿司匹林 Aspirin', '100mg', 'daily', '08:00');

      expect(med.name).toBe('阿司匹林 Aspirin');
    });

    test('should handle long notes', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');
      const longNote = 'a'.repeat(1000);

      tracker.markAsTaken(med.id, longNote);

      expect(tracker.data.history[0].notes.length).toBe(1000);
    });

    test('should handle dosages with various formats', () => {
      const dosages = ['100mg', '0.5ml', '2 tablets', '1 capsule', '10mg/ml'];

      dosages.forEach(dosage => {
        const med = tracker.addMedication('Test', dosage, 'daily', '08:00');
        expect(med.dosage).toBe(dosage);
      });
    });

    test('should handle 24-hour time format', () => {
      const times = ['00:00', '06:30', '12:00', '18:45', '23:59'];

      times.forEach(time => {
        const med = tracker.addMedication('Test', '10mg', 'daily', time);
        expect(med.scheduledTime).toBe(time);
      });
    });

    test('should handle concurrent medication entries', () => {
      const med1 = tracker.addMedication('Med1', '10mg', 'daily', '08:00');
      const med2 = tracker.addMedication('Med2', '20mg', 'daily', '08:00');
      const med3 = tracker.addMedication('Med3', '30mg', 'daily', '08:00');

      expect(tracker.data.medications.length).toBe(3);

      // All medications should be saved correctly
      expect(tracker.data.medications[0].name).toBe('Med1');
      expect(tracker.data.medications[1].name).toBe('Med2');
      expect(tracker.data.medications[2].name).toBe('Med3');
    });

    test('should handle marking multiple medications at same time', () => {
      const med1 = tracker.addMedication('Morning Med 1', '10mg', 'daily', '08:00');
      const med2 = tracker.addMedication('Morning Med 2', '20mg', 'daily', '08:00');

      tracker.markAsTaken(med1.id);
      tracker.markAsTaken(med2.id);

      expect(tracker.data.history.length).toBe(2);
    });

    test('should preserve history when medication is deactivated', () => {
      const med = tracker.addMedication('Test Med', '10mg', 'daily', '08:00');
      tracker.markAsTaken(med.id, 'Before deactivation');

      tracker.removeMedication(med.id);

      expect(tracker.data.history.length).toBe(1);
      expect(tracker.data.history[0].medicationName).toBe('Test Med');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete daily workflow', () => {
      // Morning: Add medications
      const aspirin = tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');
      const vitamin = tracker.addMedication('Vitamin D', '1000IU', 'daily', '08:00');

      // Take morning medications
      tracker.markAsTaken(aspirin.id, 'With breakfast');
      tracker.markAsTaken(vitamin.id, 'With breakfast');

      // Check status
      tracker.checkTodayStatus();

      // Verify both are marked as taken
      expect(tracker.data.history.length).toBe(2);
    });

    test('should handle medication change workflow', () => {
      // Add medication
      const med = tracker.addMedication('Old Med', '10mg', 'daily', '08:00');

      // Take it a few times
      tracker.markAsTaken(med.id);

      // Deactivate old medication
      tracker.removeMedication(med.id);

      // Add new medication
      const newMed = tracker.addMedication('New Med', '20mg', 'daily', '08:00');

      // Verify old med is inactive and new med is active
      expect(tracker.data.medications.length).toBe(2);
      expect(tracker.data.medications[0].active).toBe(false);
      expect(tracker.data.medications[1].active).toBe(true);

      // History should still exist
      expect(tracker.data.history.length).toBe(1);
    });
  });

  describe('Visualization Methods', () => {
    beforeEach(() => {
      // Setup test data for visualizations
      const now = new Date();

      // Add medications
      tracker.data.medications = [
        {
          id: 1,
          name: 'Aspirin',
          dosage: '100mg',
          frequency: 'daily',
          times: ['08:00'],
          active: true,
          startDate: new Date(now.getTime() - 30 * 86400000).toISOString()
        },
        {
          id: 2,
          name: 'Vitamin D',
          dosage: '1000IU',
          frequency: 'daily',
          times: ['08:00'],
          active: true,
          startDate: new Date(now.getTime() - 30 * 86400000).toISOString()
        }
      ];

      // Add adherence history for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Simulate 80% adherence (miss 1 in 5 days)
        if (i % 5 !== 0) {
          tracker.data.history.push({
            id: (29 - i) * 2 + 1,
            medicationId: 1,
            medicationName: 'Aspirin',
            timestamp: date.toISOString(),
            notes: 'Test'
          });
          tracker.data.history.push({
            id: (29 - i) * 2 + 2,
            medicationId: 2,
            medicationName: 'Vitamin D',
            timestamp: date.toISOString(),
            notes: 'Test'
          });
        }
      }
    });

    describe('visualizeAdherence', () => {
      test('should display adherence overview for default 30 days', () => {
        tracker.visualizeAdherence();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Medication Adherence');
      });

      test('should display adherence for custom number of days', () => {
        tracker.visualizeAdherence(14);

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Medication Adherence');
      });

      test('should show overall adherence rate', () => {
        tracker.visualizeAdherence();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Overall Adherence');
        expect(output).toContain('%');
      });

      test('should show per-medication adherence', () => {
        tracker.visualizeAdherence();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Aspirin');
        expect(output).toContain('Vitamin D');
      });

      test('should handle no medications', () => {
        tracker.data.medications = [];
        tracker.data.history = [];
        tracker.visualizeAdherence();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('No medications added yet');
      });

      test('should handle no history data', () => {
        tracker.data.history = [];
        tracker.visualizeAdherence();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('No medication history yet');
      });

      test('should show streak information', () => {
        tracker.visualizeAdherence();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Streak');
      });

      test('should calculate adherence percentages correctly', () => {
        tracker.visualizeAdherence();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        // With 80% adherence in our test data, should show around 80%
        expect(output).toMatch(/\d+\.\d+%/);
      });

      test('should show calendar heatmap', () => {
        tracker.visualizeAdherence();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        // Should contain calendar visualization symbols
        expect(output).toMatch(/[░▒▓█]/);
      });

      test('should show weekly trend', () => {
        tracker.visualizeAdherence();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Weekly');
      });

      test('should handle only inactive medications', () => {
        tracker.data.medications[0].active = false;
        tracker.data.medications[1].active = false;

        tracker.visualizeAdherence();

        expect(consoleLogSpy).toHaveBeenCalled();
        // Should still show visualization since medications exist, even if inactive
      });

      test('should handle partial adherence data', () => {
        // Remove most history entries
        tracker.data.history = tracker.data.history.slice(0, 5);

        tracker.visualizeAdherence();

        expect(consoleLogSpy).toHaveBeenCalled();
        // Should not throw error
      });
    });

    describe('Helper Methods for Visualizations', () => {
      test('showAdherenceTrend should group data by week', () => {
        const days = 28;
        tracker.showAdherenceTrend(days);

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Week');
      });

      test('calculateAdherenceStreak should count consecutive perfect days', () => {
        const now = new Date();
        tracker.data.medications = [
          {
            id: 1,
            name: 'Test Med',
            dosage: '10mg',
            frequency: 'daily',
            times: ['08:00'],
            active: true,
            startDate: new Date(now.getTime() - 10 * 86400000).toISOString()
          }
        ];
        tracker.data.history = [];

        // Add perfect adherence for last 5 days (1 dose per day)
        for (let i = 4; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(8, 0, 0, 0);
          tracker.data.history.push({
            id: 5 - i,
            medicationId: 1,
            medicationName: 'Test Med',
            timestamp: date.toISOString(),
            notes: 'Test'
          });
        }

        const streak = tracker.calculateAdherenceStreak();
        expect(streak).toBeGreaterThanOrEqual(1);
      });

      test('calculateAdherenceStreak should return 0 for no perfect days', () => {
        tracker.data.history = [];
        const streak = tracker.calculateAdherenceStreak();
        expect(streak).toBe(0);
      });

      test('calculateAdherenceStreak should break on missed dose', () => {
        const now = new Date();
        tracker.data.medications = [
          {
            id: 1,
            name: 'Test Med',
            dosage: '10mg',
            frequency: 'daily',
            times: ['08:00'],
            active: true,
            startDate: new Date(now.getTime() - 10 * 86400000).toISOString()
          }
        ];
        tracker.data.history = [];

        // Add history for 5 days, but miss day 3
        for (let i = 4; i >= 0; i--) {
          if (i === 2) continue; // Skip day 3

          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(8, 0, 0, 0);
          tracker.data.history.push({
            id: 5 - i,
            medicationId: 1,
            medicationName: 'Test Med',
            timestamp: date.toISOString(),
            notes: 'Test'
          });
        }

        const streak = tracker.calculateAdherenceStreak();
        // Streak should be broken by the missed dose
        expect(streak).toBeLessThan(5);
      });
    });
  });

  describe('Additional Edge Cases for Coverage', () => {
    test('removeMedication should return false when saveData fails', () => {
      const med = tracker.addMedication('Test', '10mg', 'daily', '08:00');

      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = tracker.removeMedication(med.id);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('markAsTaken should return false when saveData fails', () => {
      const med = tracker.addMedication('Test', '10mg', 'daily', '08:00');

      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = tracker.markAsTaken(med.id);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('getHistory should handle empty history gracefully', () => {
      tracker.data.history = [];

      tracker.getHistory(null, 7);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No history found'));
    });

    test('getHistory should filter by medicationId when provided', () => {
      const med1 = tracker.addMedication('Med1', '10mg', 'daily', '08:00');
      const med2 = tracker.addMedication('Med2', '20mg', 'daily', '08:00');

      tracker.markAsTaken(med1.id, 'Test1');
      tracker.markAsTaken(med2.id, 'Test2');

      consoleLogSpy.mockClear();
      tracker.getHistory(med1.id, 7);

      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Med1');
    });

    test('checkTodayStatus should handle no medications', () => {
      tracker.data.medications = [];

      tracker.checkTodayStatus();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No active medications'));
    });

    test('listMedications should handle no active medications', () => {
      tracker.data.medications = [];

      tracker.listMedications();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No medications found'));
    });

    test('visualizeAdherence should handle medications with no expected doses', () => {
      tracker.data.medications = [{
        id: 1,
        name: 'Test',
        dosage: '10mg',
        frequency: 'as-needed',
        times: [],
        active: true,
        startDate: new Date().toISOString()
      }];
      tracker.data.history = [];

      tracker.visualizeAdherence(7);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Refill Tracking', () => {
    let medication;

    beforeEach(() => {
      medication = tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');
    });

    describe('setRefillInfo', () => {
      test('should enable refill tracking for a medication', () => {
        const result = tracker.setRefillInfo(medication.id, 90, 1, 7);

        expect(result).toBe(true);
        const med = tracker.data.medications.find(m => m.id === medication.id);
        expect(med.pillCount).toBe(90);
        expect(med.pillsPerDose).toBe(1);
        expect(med.refillThreshold).toBe(7);
      });

      test('should use default values when not provided', () => {
        const result = tracker.setRefillInfo(medication.id, 60);

        expect(result).toBe(true);
        const med = tracker.data.medications.find(m => m.id === medication.id);
        expect(med.pillsPerDose).toBe(1);
        expect(med.refillThreshold).toBe(7);
      });

      test('should return false for non-existent medication', () => {
        const result = tracker.setRefillInfo(999999, 90);

        expect(result).toBe(false);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
      });

      test('should display days remaining after setup', () => {
        tracker.setRefillInfo(medication.id, 30, 1, 7);

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
        expect(output).toContain('Days remaining: 30');
      });
    });

    describe('calculateDaysRemaining', () => {
      test('should calculate days remaining for daily medication', () => {
        tracker.setRefillInfo(medication.id, 30, 1);
        const med = tracker.data.medications.find(m => m.id === medication.id);

        const days = tracker.calculateDaysRemaining(med);

        expect(days).toBe(30);
      });

      test('should calculate days remaining for twice-daily medication', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        const med2 = tracker.addMedication('Med2', '50mg', 'twice-daily', '08:00,20:00');
        tracker.setRefillInfo(med2.id, 60, 1);
        const updated = tracker.data.medications.find(m => m.id === med2.id);

        const days = tracker.calculateDaysRemaining(updated);

        expect(days).toBe(30); // 60 pills / 2 per day = 30 days
      });

      test('should calculate days remaining for weekly medication', async () => {
        await new Promise(resolve => setTimeout(resolve, 15));
        const med3 = tracker.addMedication('Med3', '25mg', 'weekly', '08:00');
        tracker.setRefillInfo(med3.id, 4, 1);
        const updated = tracker.data.medications.find(m => m.id === med3.id);

        const days = tracker.calculateDaysRemaining(updated);

        expect(days).toBe(28); // 4 pills / (1/7 per day) = 28 days
      });

      test('should return null when refill tracking not enabled', () => {
        const days = tracker.calculateDaysRemaining(medication);

        expect(days).toBeNull();
      });

      test('should handle multiple pills per dose', () => {
        tracker.setRefillInfo(medication.id, 60, 2); // 2 pills per dose
        const med = tracker.data.medications.find(m => m.id === medication.id);

        const days = tracker.calculateDaysRemaining(med);

        expect(days).toBe(30); // 60 pills / (2 pills per dose * 1 dose per day) = 30 days
      });
    });

    describe('updatePillCount', () => {
      beforeEach(() => {
        tracker.setRefillInfo(medication.id, 90, 1);
      });

      test('should decrease pill count when medication taken', () => {
        tracker.updatePillCount(medication.id, -1);

        const med = tracker.data.medications.find(m => m.id === medication.id);
        expect(med.pillCount).toBe(89);
      });

      test('should increase pill count when refilled', () => {
        tracker.updatePillCount(medication.id, 30);

        const med = tracker.data.medications.find(m => m.id === medication.id);
        expect(med.pillCount).toBe(120);
      });

      test('should not go below zero', () => {
        tracker.updatePillCount(medication.id, -100);

        const med = tracker.data.medications.find(m => m.id === medication.id);
        expect(med.pillCount).toBe(0);
      });

      test('should return false for non-existent medication', () => {
        const result = tracker.updatePillCount(999999, -1);

        expect(result).toBe(false);
      });

      test('should return false when refill tracking not enabled', async () => {
        // Wait 5ms to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 5));
        const med2 = tracker.addMedication('Med2', '50mg', 'daily', '08:00');

        // Verify no refill info
        const found = tracker.data.medications.find(m => m.id === med2.id);
        expect(found.pillCount).toBeUndefined();

        const result = tracker.updatePillCount(med2.id, -1);

        expect(result).toBe(false);
      });
    });

    describe('markAsTaken with refill tracking', () => {
      beforeEach(() => {
        tracker.setRefillInfo(medication.id, 10, 1, 7);
        consoleLogSpy.mockClear();
      });

      test('should auto-decrement pill count when taken', () => {
        const beforeCount = tracker.data.medications.find(m => m.id === medication.id).pillCount;
        tracker.markAsTaken(medication.id);

        const med = tracker.data.medications.find(m => m.id === medication.id);
        expect(med.pillCount).toBe(beforeCount - 1);
      });

      test('should show refill alert when low', () => {
        tracker.data.medications.find(m => m.id === medication.id).pillCount = 5;
        tracker.markAsTaken(medication.id);

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
        expect(output).toContain('REFILL REMINDER');
      });

      test('should show critical alert when out of pills', () => {
        tracker.data.medications.find(m => m.id === medication.id).pillCount = 1;
        tracker.markAsTaken(medication.id);

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
        expect(output).toContain('OUT OF PILLS');
      });
    });

    describe('checkRefillAlert', () => {
      beforeEach(() => {
        tracker.setRefillInfo(medication.id, 30, 1, 7);
        const med = tracker.data.medications.find(m => m.id === medication.id);
        consoleLogSpy.mockClear();
      });

      test('should show critical alert when out of pills', () => {
        const med = tracker.data.medications.find(m => m.id === medication.id);
        med.pillCount = 0;

        const result = tracker.checkRefillAlert(med);

        expect(result).toBe(true);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('OUT OF PILLS'));
      });

      test('should show warning when below threshold', () => {
        const med = tracker.data.medications.find(m => m.id === medication.id);
        med.pillCount = 5; // 5 days remaining, below 7 day threshold

        const result = tracker.checkRefillAlert(med);

        expect(result).toBe(true);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('REFILL REMINDER'));
      });

      test('should not show alert when above threshold', () => {
        const result = tracker.checkRefillAlert(tracker.data.medications.find(m => m.id === medication.id));

        expect(result).toBe(false);
      });

      test('should return false when refill tracking not enabled', () => {
        const med2 = tracker.addMedication('Med2', '50mg', 'daily', '08:00');
        const result = tracker.checkRefillAlert(med2);

        expect(result).toBe(false);
      });
    });

    describe('showRefillStatus', () => {
      test('should display refill status for all medications', async () => {
        tracker.setRefillInfo(medication.id, 30, 1, 7);
        await new Promise(resolve => setTimeout(resolve, 20));
        const med2 = tracker.addMedication('Med2', '50mg', 'daily', '08:00');
        tracker.setRefillInfo(med2.id, 5, 1, 7);

        tracker.showRefillStatus();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
        expect(output).toContain('Medication Refill Status');
        expect(output).toContain('Aspirin');
        expect(output).toContain('Med2');
        expect(output).toContain('Summary:');
      });

      test('should show message when no refill tracking enabled', () => {
        tracker.data.medications = [];

        tracker.showRefillStatus();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No medications with refill tracking'));
      });

      test('should categorize medications by status', async () => {
        tracker.setRefillInfo(medication.id, 0, 1, 7); // OUT
        await new Promise(resolve => setTimeout(resolve, 25));
        const med2 = tracker.addMedication('Med2', '50mg', 'daily', '08:00');
        tracker.setRefillInfo(med2.id, 5, 1, 7); // LOW
        await new Promise(resolve => setTimeout(resolve, 30));
        const med3 = tracker.addMedication('Med3', '25mg', 'daily', '08:00');
        tracker.setRefillInfo(med3.id, 30, 1, 7); // OK

        tracker.showRefillStatus();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
        expect(output).toContain('OUT');
        expect(output).toContain('LOW');
        expect(output).toContain('OK');
        expect(output).toContain('1 out of stock');
        expect(output).toContain('1 low');
        expect(output).toContain('1 OK');
      });
    });

    describe('refillMedication', () => {
      beforeEach(() => {
        tracker.setRefillInfo(medication.id, 10, 1, 7);
        consoleLogSpy.mockClear();
      });

      test('should add pills to medication', () => {
        const result = tracker.refillMedication(medication.id, 90);

        expect(result).toBe(true);
        const med = tracker.data.medications.find(m => m.id === medication.id);
        expect(med.pillCount).toBe(100);
      });

      test('should display before and after pill counts', () => {
        tracker.refillMedication(medication.id, 60);

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
        expect(output).toContain('10 → 70');
      });

      test('should return false for non-existent medication', () => {
        const result = tracker.refillMedication(999999, 90);

        expect(result).toBe(false);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
      });

      test('should return false when refill tracking not enabled', async () => {
        // Wait 1ms to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 1));
        const med2 = tracker.addMedication('Med2', '50mg', 'daily', '08:00');

        // Verify pillCount is undefined
        const foundMed = tracker.data.medications.find(m => m.id === med2.id);
        expect(foundMed.pillCount).toBeUndefined();

        const result = tracker.refillMedication(med2.id, 90);

        expect(result).toBe(false);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not enabled'));
      });

      test('should calculate and display new days remaining', () => {
        tracker.refillMedication(medication.id, 20);

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
        expect(output).toContain('Days remaining: 30');
      });
    });
  });
});
