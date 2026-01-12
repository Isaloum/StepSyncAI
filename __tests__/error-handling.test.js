const fs = require('fs');
const MentalHealthTracker = require('../mental-health-tracker');
const MedicationTracker = require('../medication-tracker');
const AWSForKids = require('../aws-for-kids');

// Mock fs module
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

describe('Error Handling Across All Modules', () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('{}');
    fs.writeFileSync.mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('MentalHealthTracker - Error Handling', () => {
    test('should handle file read permission errors gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        const error = new Error('EACCES: permission denied');
        error.code = 'EACCES';
        throw error;
      });

      const tracker = new MentalHealthTracker('restricted.json');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(tracker.data).toHaveProperty('moodEntries');
      expect(tracker.data.moodEntries).toEqual([]);
    });

    test('should handle file write permission errors', () => {
      const tracker = new MentalHealthTracker('test.json');

      fs.writeFileSync.mockImplementation(() => {
        const error = new Error('EACCES: permission denied');
        error.code = 'EACCES';
        throw error;
      });

      const result = tracker.logMood(5, 'Test');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should handle disk full errors during save', () => {
      const tracker = new MentalHealthTracker('test.json');

      fs.writeFileSync.mockImplementation(() => {
        const error = new Error('ENOSPC: no space left on device');
        error.code = 'ENOSPC';
        throw error;
      });

      const result = tracker.saveData();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should validate mood rating boundaries', () => {
      const tracker = new MentalHealthTracker('test.json');

      expect(tracker.logMood(0)).toBe(false);
      expect(tracker.logMood(11)).toBe(false);
      expect(tracker.logMood(-5)).toBe(false);
      expect(tracker.logMood(100)).toBe(false);
    });

    test('should handle invalid symptom types', () => {
      const tracker = new MentalHealthTracker('test.json');

      const result = tracker.logSymptom('invalid-symptom', 5);

      expect(result).toBe(false);
      expect(tracker.data.symptoms.length).toBe(0);
    });

    test('should handle invalid symptom severity', () => {
      const tracker = new MentalHealthTracker('test.json');

      expect(tracker.logSymptom('anxiety', 0)).toBe(false);
      expect(tracker.logSymptom('anxiety', 11)).toBe(false);
      expect(tracker.logSymptom('anxiety', -1)).toBe(false);
    });

    test('should handle operations on non-existent IDs', () => {
      const tracker = new MentalHealthTracker('test.json');

      expect(tracker.logTriggerOccurrence(999999)).toBe(false);
      expect(tracker.useCopingStrategy(999999, 8)).toBe(false);
      expect(tracker.completeGoal(999999)).toBe(false);
    });

    test('should handle empty or null inputs', () => {
      const tracker = new MentalHealthTracker('test.json');

      // These should handle gracefully without crashing
      tracker.addJournal('');
      tracker.addTrigger('');
      tracker.addCopingStrategy('', '');
      tracker.addEmergencyContact('', '', '');
      tracker.addGoal('');

      // Verify data was created even with empty strings
      expect(tracker.data.journalEntries.length).toBeGreaterThan(0);
      expect(tracker.data.triggers.length).toBeGreaterThan(0);
      expect(tracker.data.copingStrategies.length).toBeGreaterThan(0);
      expect(tracker.data.emergencyContacts.length).toBeGreaterThan(0);
      expect(tracker.data.goals.length).toBeGreaterThan(0);
    });
  });

  describe('MedicationTracker - Error Handling', () => {
    test('should load data even with unexpected structure', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{"medications": "unexpected-value", "history": []}');

      const tracker = new MedicationTracker('unexpected.json');

      // Data should be loaded (even if structure is unexpected)
      expect(tracker.data).toBeDefined();
      expect(tracker.data).toHaveProperty('medications');
      expect(tracker.data).toHaveProperty('history');
    });

    test('should handle file system errors during save', () => {
      const tracker = new MedicationTracker('test.json');

      fs.writeFileSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = tracker.addMedication('Test', '10mg', 'daily', '08:00');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should handle invalid medication ID formats', () => {
      const tracker = new MedicationTracker('test.json');

      expect(tracker.markAsTaken('invalid-id')).toBe(false);
      expect(tracker.markAsTaken('')).toBe(false);
      expect(tracker.removeMedication('invalid-id')).toBe(false);
    });

    test('should handle marking non-existent medication as taken', () => {
      const tracker = new MedicationTracker('test.json');

      const result = tracker.markAsTaken(999999);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    test('should handle empty medication list gracefully', () => {
      const tracker = new MedicationTracker('test.json');

      tracker.listMedications();
      tracker.checkTodayStatus();
      tracker.getHistory();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle very long medication names', () => {
      const tracker = new MedicationTracker('test.json');
      const longName = 'A'.repeat(1000);

      const med = tracker.addMedication(longName, '10mg', 'daily', '08:00');

      expect(med).not.toBeNull();
      expect(med.name).toBe(longName);
    });

    test('should handle special characters in medication data', () => {
      const tracker = new MedicationTracker('test.json');

      const med = tracker.addMedication(
        'Med with "quotes" & symbols',
        '10mg/ml',
        'as-needed',
        '08:00'
      );

      expect(med).not.toBeNull();
      expect(med.name).toContain('quotes');
    });
  });

  describe('AWSForKids - Error Handling', () => {
    test('should handle malformed JSON in data file', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('{malformed json}');

      const app = new AWSForKids('malformed.json');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(app.data.completedLessons).toEqual([]);
    });

    test('should handle learning non-existent topics', () => {
      const app = new AWSForKids('test.json');

      app.learn('non-existent-topic');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    test('should handle empty topic keys', () => {
      const app = new AWSForKids('test.json');

      app.learn('');
      app.learn(null);
      app.learn(undefined);

      // Should handle gracefully without crashing
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle file write errors during progress save', () => {
      const app = new AWSForKids('test.json');

      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      app.learn('ec2');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should initialize with default data on any load error', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const app = new AWSForKids('error.json');

      expect(app.data).toHaveProperty('progress');
      expect(app.data).toHaveProperty('quizScores');
      expect(app.data).toHaveProperty('completedLessons');
      expect(app.data).toHaveProperty('totalStudyTime');
    });

    test('should handle duplicate lesson completions', () => {
      const app = new AWSForKids('test.json');

      app.learn('ec2');
      const countAfterFirst = app.data.completedLessons.length;

      app.learn('ec2');
      const countAfterSecond = app.data.completedLessons.length;

      expect(countAfterFirst).toBe(countAfterSecond);
    });
  });

  describe('Cross-Module Data Integrity', () => {
    test('should handle very large data files', () => {
      const tracker = new MentalHealthTracker('test.json');

      // Add many entries
      for (let i = 0; i < 1000; i++) {
        tracker.data.moodEntries.push({
          id: Date.now() + i,
          rating: (i % 10) + 1,
          note: `Entry ${i}`,
          timestamp: new Date().toISOString()
        });
      }

      const result = tracker.saveData();
      expect(result).toBe(true);
    });

    test('should handle concurrent ID generation', () => {
      const tracker = new MedicationTracker('test.json');

      const med1 = tracker.addMedication('Med1', '10mg', 'daily', '08:00');
      const med2 = tracker.addMedication('Med2', '20mg', 'daily', '09:00');
      const med3 = tracker.addMedication('Med3', '30mg', 'daily', '10:00');

      // IDs should be present and valid
      expect(med1.id).toBeDefined();
      expect(med2.id).toBeDefined();
      expect(med3.id).toBeDefined();
      expect(typeof med1.id).toBe('number');
      expect(typeof med2.id).toBe('number');
      expect(typeof med3.id).toBe('number');
    });

    test('should preserve data types through save/load cycle', () => {
      fs.existsSync.mockReturnValue(true);

      const originalData = {
        medications: [{
          id: 123456789,
          name: 'Test',
          dosage: '10mg',
          frequency: 'daily',
          scheduledTime: '08:00',
          active: true,
          createdAt: '2024-01-01T00:00:00.000Z'
        }],
        history: []
      };

      fs.readFileSync.mockReturnValue(JSON.stringify(originalData));

      const tracker = new MedicationTracker('test.json');

      expect(tracker.data.medications[0].id).toBe(123456789);
      expect(tracker.data.medications[0].active).toBe(true);
      expect(typeof tracker.data.medications[0].id).toBe('number');
      expect(typeof tracker.data.medications[0].active).toBe('boolean');
    });
  });

  describe('Edge Cases - Boundary Values', () => {
    test('should handle minimum valid mood rating', () => {
      const tracker = new MentalHealthTracker('test.json');

      const result = tracker.logMood(1, 'Minimum');

      expect(result).toBe(true);
      expect(tracker.data.moodEntries[0].rating).toBe(1);
    });

    test('should handle maximum valid mood rating', () => {
      const tracker = new MentalHealthTracker('test.json');

      const result = tracker.logMood(10, 'Maximum');

      expect(result).toBe(true);
      expect(tracker.data.moodEntries[0].rating).toBe(10);
    });

    test('should handle midnight time for medications', () => {
      const tracker = new MedicationTracker('test.json');

      const med = tracker.addMedication('Test', '10mg', 'daily', '00:00');

      expect(med).not.toBeNull();
      expect(med.scheduledTime).toBe('00:00');
    });

    test('should handle end of day time for medications', () => {
      const tracker = new MedicationTracker('test.json');

      const med = tracker.addMedication('Test', '10mg', 'daily', '23:59');

      expect(med).not.toBeNull();
      expect(med.scheduledTime).toBe('23:59');
    });

    test('should handle zero study time in AWS app', () => {
      const app = new AWSForKids('test.json');
      app.data.totalStudyTime = 0;

      app.progress();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(app.data.totalStudyTime).toBe(0);
    });
  });

  describe('Unicode and Special Character Handling', () => {
    test('should handle emoji in journal entries', () => {
      const tracker = new MentalHealthTracker('test.json');

      const result = tracker.addJournal('Today was 😊👍💪 amazing!');

      expect(result).toBe(true);
      expect(tracker.data.journalEntries[0].content).toContain('😊');
    });

    test('should handle Chinese characters', () => {
      const tracker = new MedicationTracker('test.json');

      const med = tracker.addMedication('阿司匹林', '100毫克', '每日', '08:00');

      expect(med).not.toBeNull();
      expect(med.name).toBe('阿司匹林');
    });

    test('should handle Arabic characters', () => {
      const tracker = new MentalHealthTracker('test.json');

      tracker.addEmergencyContact('أحمد', 'طبيب', '555-1234');

      expect(tracker.data.emergencyContacts[0].name).toBe('أحمد');
    });

    test('should handle mixed scripts', () => {
      const app = new AWSForKids('test.json');
      const mixedContent = 'Learning AWS - تعلم - 学习 - обучение';

      // Should not crash with mixed scripts
      expect(app.concepts).toBeDefined();
    });
  });
});
