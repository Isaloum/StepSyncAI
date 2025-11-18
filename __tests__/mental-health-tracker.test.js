const fs = require('fs');
const MentalHealthTracker = require('../mental-health-tracker');

// Mock fs module
jest.mock('fs');

describe('MentalHealthTracker', () => {
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
    tracker = new MentalHealthTracker('test-data.json');
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Constructor and Data Loading', () => {
    test('should initialize with default data structure when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const newTracker = new MentalHealthTracker('new-test.json');

      expect(newTracker.data).toHaveProperty('profile');
      expect(newTracker.data).toHaveProperty('moodEntries');
      expect(newTracker.data).toHaveProperty('journalEntries');
      expect(newTracker.data).toHaveProperty('symptoms');
      expect(newTracker.data).toHaveProperty('triggers');
      expect(newTracker.data).toHaveProperty('copingStrategies');
      expect(newTracker.data).toHaveProperty('emergencyContacts');
      expect(newTracker.data).toHaveProperty('goals');
      expect(newTracker.data.moodEntries).toEqual([]);
    });

    test('should load existing data from file', () => {
      const mockData = {
        profile: { accidentDate: '2024-01-01', accidentDescription: 'Test accident' },
        moodEntries: [{ id: 1, rating: 5, note: 'Test', timestamp: '2024-01-01' }],
        journalEntries: [],
        symptoms: [],
        triggers: [],
        copingStrategies: [],
        emergencyContacts: [],
        goals: []
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      const newTracker = new MentalHealthTracker('existing-test.json');

      expect(newTracker.data.profile.accidentDate).toBe('2024-01-01');
      expect(newTracker.data.moodEntries.length).toBe(1);
    });

    test('should handle corrupted JSON file gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json {{{');

      const newTracker = new MentalHealthTracker('corrupted-test.json');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(newTracker.data.moodEntries).toEqual([]);
    });

    test('should handle file read error gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const newTracker = new MentalHealthTracker('error-test.json');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(newTracker.data).toHaveProperty('moodEntries');
    });
  });

  describe('Profile Management', () => {
    test('setupProfile should save accident information', () => {
      const result = tracker.setupProfile('2024-01-15', 'Workplace accident');

      expect(tracker.data.profile.accidentDate).toBe('2024-01-15');
      expect(tracker.data.profile.accidentDescription).toBe('Workplace accident');
      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('setupProfile should return false on save error', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = tracker.setupProfile('2024-01-15', 'Test');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('viewProfile should display profile information', () => {
      tracker.data.profile.accidentDate = '2024-01-15';
      tracker.data.profile.accidentDescription = 'Test accident';

      tracker.viewProfile();

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Your Profile'));
    });

    test('viewProfile should handle missing profile data', () => {
      tracker.viewProfile();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Not set'));
    });
  });

  describe('Mood Tracking', () => {
    test('logMood should accept valid rating (1-10)', () => {
      const result = tracker.logMood(7, 'Feeling better today');

      expect(result).toBe(true);
      expect(tracker.data.moodEntries.length).toBe(1);
      expect(tracker.data.moodEntries[0].rating).toBe(7);
      expect(tracker.data.moodEntries[0].note).toBe('Feeling better today');
    });

    test('logMood should reject rating below 1', () => {
      const result = tracker.logMood(0, 'Invalid');

      expect(result).toBe(false);
      expect(tracker.data.moodEntries.length).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('must be between 1 and 10'));
    });

    test('logMood should reject rating above 10', () => {
      const result = tracker.logMood(11, 'Invalid');

      expect(result).toBe(false);
      expect(tracker.data.moodEntries.length).toBe(0);
    });

    test('logMood should work without note', () => {
      const result = tracker.logMood(5);

      expect(result).toBe(true);
      expect(tracker.data.moodEntries[0].note).toBe('');
    });

    test('logMood should create entry with timestamp', () => {
      const beforeTime = Date.now();
      tracker.logMood(5, 'Test');
      const afterTime = Date.now();

      const entry = tracker.data.moodEntries[0];
      expect(entry.timestamp).toBeDefined();
      expect(entry.id).toBeGreaterThanOrEqual(beforeTime);
      expect(entry.id).toBeLessThanOrEqual(afterTime);
    });

    test('logMood should parse rating as integer', () => {
      tracker.logMood('7', 'Test');

      expect(tracker.data.moodEntries[0].rating).toBe(7);
      expect(typeof tracker.data.moodEntries[0].rating).toBe('number');
    });

    test('getMoodEmoji should return correct emoji for rating', () => {
      expect(tracker.getMoodEmoji(1)).toBe('😢');
      expect(tracker.getMoodEmoji(2)).toBe('😢');
      expect(tracker.getMoodEmoji(3)).toBe('😔');
      expect(tracker.getMoodEmoji(4)).toBe('😔');
      expect(tracker.getMoodEmoji(5)).toBe('😐');
      expect(tracker.getMoodEmoji(6)).toBe('😐');
      expect(tracker.getMoodEmoji(7)).toBe('🙂');
      expect(tracker.getMoodEmoji(8)).toBe('🙂');
      expect(tracker.getMoodEmoji(9)).toBe('😊');
      expect(tracker.getMoodEmoji(10)).toBe('😊');
    });

    test('viewMoodHistory should handle empty mood entries', () => {
      tracker.viewMoodHistory();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('viewMoodHistory with days parameter should display entries', () => {
      // Add 5 mood entries
      for (let i = 1; i <= 5; i++) {
        tracker.logMood(i, `Entry ${i}`);
      }

      consoleLogSpy.mockClear();
      tracker.viewMoodHistory(3);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Symptom Tracking', () => {
    test('logSymptom should add symptom entry', () => {
      const result = tracker.logSymptom('anxiety', 7, 'Before presentation');

      expect(result).toBe(true);
      expect(tracker.data.symptoms.length).toBe(1);
      expect(tracker.data.symptoms[0].type).toBe('anxiety');
      expect(tracker.data.symptoms[0].severity).toBe(7);
      expect(tracker.data.symptoms[0].note).toBe('Before presentation');
    });

    test('logSymptom should work without note', () => {
      tracker.logSymptom('depression', 5);

      expect(tracker.data.symptoms[0].note).toBe('');
    });

    test('logSymptom should validate symptom type', () => {
      const result = tracker.logSymptom('invalid-type', 5);

      expect(result).toBe(false);
      expect(tracker.data.symptoms.length).toBe(0);
    });

    test('logSymptom should validate severity range', () => {
      const result = tracker.logSymptom('anxiety', 15);

      expect(result).toBe(false);
      expect(tracker.data.symptoms.length).toBe(0);
    });

    test('viewSymptoms should handle empty symptoms', () => {
      tracker.viewSymptoms();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('viewSymptoms should display symptoms', () => {
      tracker.logSymptom('Anxiety', 8);
      consoleLogSpy.mockClear();

      tracker.viewSymptoms();

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Journal Entries', () => {
    test('addJournal should create entry', () => {
      const result = tracker.addJournal('Today was a good day', 'positive');

      expect(result).toBe(true);
      expect(tracker.data.journalEntries.length).toBe(1);
      expect(tracker.data.journalEntries[0].content).toBe('Today was a good day');
      expect(tracker.data.journalEntries[0].type).toBe('positive');
    });

    test('addJournal should work with default type', () => {
      tracker.addJournal('Simple entry');

      expect(tracker.data.journalEntries[0].type).toBe('general');
    });

    test('viewJournal should handle empty journal', () => {
      tracker.viewJournal();

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Trigger Tracking', () => {
    test('addTrigger should create trigger entry', () => {
      const result = tracker.addTrigger('Loud noises', 8);

      expect(result).toBe(true);
      expect(tracker.data.triggers.length).toBe(1);
      expect(tracker.data.triggers[0].description).toBe('Loud noises');
      expect(tracker.data.triggers[0].intensity).toBe(8);
      expect(tracker.data.triggers[0].occurrences).toBe(1);
    });

    test('addTrigger should use default intensity', () => {
      tracker.addTrigger('Test trigger');

      expect(tracker.data.triggers[0].intensity).toBe(5);
    });

    test('logTriggerOccurrence should record trigger event', () => {
      tracker.addTrigger('Test trigger');
      const triggerId = tracker.data.triggers[0].id;
      const initialOccurrences = tracker.data.triggers[0].occurrences;

      const result = tracker.logTriggerOccurrence(triggerId);

      expect(result).toBe(true);
      expect(tracker.data.triggers[0].occurrences).toBe(initialOccurrences + 1);
    });

    test('logTriggerOccurrence should handle invalid trigger ID', () => {
      const result = tracker.logTriggerOccurrence(99999);

      expect(result).toBe(false);
    });

    test('listTriggers should handle empty triggers', () => {
      tracker.listTriggers();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('listTriggers should display triggers', () => {
      tracker.addTrigger('Test trigger', 7);
      consoleLogSpy.mockClear();

      tracker.listTriggers();

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Coping Strategies', () => {
    test('addCopingStrategy should create strategy', () => {
      const result = tracker.addCopingStrategy('Deep breathing', 'Breathe deeply for 5 minutes', 8);

      expect(result).toBe(true);
      expect(tracker.data.copingStrategies.length).toBe(1);
      expect(tracker.data.copingStrategies[0].name).toBe('Deep breathing');
      expect(tracker.data.copingStrategies[0].description).toBe('Breathe deeply for 5 minutes');
      expect(tracker.data.copingStrategies[0].effectiveness).toBe(8);
    });

    test('addCopingStrategy should work without effectiveness rating', () => {
      tracker.addCopingStrategy('Test strategy', 'Test description');

      expect(tracker.data.copingStrategies[0].effectiveness).toBeNull();
    });

    test('useCopingStrategy should record strategy usage', () => {
      tracker.addCopingStrategy('Test', 'Test description');
      const strategyId = tracker.data.copingStrategies[0].id;

      const result = tracker.useCopingStrategy(strategyId, 8);

      expect(result).toBe(true);
      expect(tracker.data.copingStrategies[0].timesUsed).toBe(1);
      expect(tracker.data.copingStrategies[0].ratings.length).toBe(1);
      expect(tracker.data.copingStrategies[0].ratings[0].rating).toBe(8);
    });

    test('useCopingStrategy should handle invalid strategy ID', () => {
      const result = tracker.useCopingStrategy(99999, 8);

      expect(result).toBe(false);
    });

    test('listCopingStrategies should handle empty strategies', () => {
      tracker.listCopingStrategies();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('listCopingStrategies should display strategies', () => {
      tracker.addCopingStrategy('Test', 'Description');
      consoleLogSpy.mockClear();

      tracker.listCopingStrategies();

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Emergency Contacts', () => {
    test('addEmergencyContact should create contact', () => {
      const result = tracker.addEmergencyContact('Dr. Smith', 'Therapist', '555-1234', 'Available 24/7');

      expect(result).toBe(true);
      expect(tracker.data.emergencyContacts.length).toBe(1);
      expect(tracker.data.emergencyContacts[0].name).toBe('Dr. Smith');
      expect(tracker.data.emergencyContacts[0].relationship).toBe('Therapist');
      expect(tracker.data.emergencyContacts[0].phone).toBe('555-1234');
      expect(tracker.data.emergencyContacts[0].notes).toBe('Available 24/7');
    });

    test('addEmergencyContact should work without notes', () => {
      tracker.addEmergencyContact('Test', 'Friend', '555-0000');

      expect(tracker.data.emergencyContacts[0].notes).toBe('');
    });

    test('listEmergencyContacts should handle empty contacts', () => {
      tracker.listEmergencyContacts();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('listEmergencyContacts should display contacts', () => {
      tracker.addEmergencyContact('Test', 'Friend', '555-0000');
      consoleLogSpy.mockClear();

      tracker.listEmergencyContacts();

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Goal Tracking', () => {
    test('addGoal should create goal', () => {
      const result = tracker.addGoal('Return to work', '2024-12-31');

      expect(result).toBe(true);
      expect(tracker.data.goals.length).toBe(1);
      expect(tracker.data.goals[0].description).toBe('Return to work');
      expect(tracker.data.goals[0].targetDate).toBe('2024-12-31');
      expect(tracker.data.goals[0].completed).toBe(false);
    });

    test('addGoal should work without target date', () => {
      tracker.addGoal('Test goal');

      expect(tracker.data.goals[0].targetDate).toBeNull();
    });

    test('completeGoal should mark goal as completed', () => {
      tracker.addGoal('Test goal', '2024-12-31');
      const goalId = tracker.data.goals[0].id;

      const result = tracker.completeGoal(goalId);

      expect(result).toBe(true);
      expect(tracker.data.goals[0].completed).toBe(true);
      expect(tracker.data.goals[0].completedAt).toBeTruthy();
    });

    test('completeGoal should handle invalid goal ID', () => {
      const result = tracker.completeGoal(99999);

      expect(result).toBe(false);
    });

    test('listGoals should handle empty goals', () => {
      tracker.listGoals();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('listGoals should display only active goals by default', () => {
      tracker.addGoal('Active goal', '2024-12-31');
      tracker.addGoal('Completed goal', '2024-12-31');
      tracker.completeGoal(tracker.data.goals[1].id);

      consoleLogSpy.mockClear();
      tracker.listGoals();

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('listGoals should display all goals when showCompleted is true', () => {
      tracker.addGoal('Test goal', '2024-12-31');
      tracker.completeGoal(tracker.data.goals[0].id);

      consoleLogSpy.mockClear();
      tracker.listGoals(true);

      expect(consoleLogSpy).toHaveBeenCalled();
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
      expect(writeCall[0]).toBe('test-data.json');

      // Check that JSON is formatted (has indentation)
      const jsonData = writeCall[1];
      expect(jsonData).toContain('\n');
      expect(jsonData).toContain('  ');
    });
  });

  describe('Edge Cases', () => {
    test('should handle unicode characters in notes', () => {
      tracker.logMood(5, 'Feeling 😊 today with some 中文');

      expect(tracker.data.moodEntries[0].note).toBe('Feeling 😊 today with some 中文');
    });

    test('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      tracker.addJournal(longString);

      expect(tracker.data.journalEntries[0].content.length).toBe(10000);
    });

    test('should handle special characters in names', () => {
      tracker.addEmergencyContact("O'Brien", "Friend's doctor", '555-1234');

      expect(tracker.data.emergencyContacts[0].name).toBe("O'Brien");
    });

    test('should handle concurrent mood entries', () => {
      // Simulate rapid entries
      tracker.logMood(5, 'Entry 1');
      tracker.logMood(6, 'Entry 2');
      tracker.logMood(7, 'Entry 3');

      expect(tracker.data.moodEntries.length).toBe(3);
      // Entries should all exist with their ratings
      expect(tracker.data.moodEntries[0].rating).toBe(5);
      expect(tracker.data.moodEntries[1].rating).toBe(6);
      expect(tracker.data.moodEntries[2].rating).toBe(7);
    });
  });

  describe('Visualization Methods', () => {
    beforeEach(() => {
      // Setup test data for visualizations
      const now = new Date();

      // Set up profile
      tracker.data.profile = {
        accidentDate: new Date(now.getTime() - 90 * 86400000).toISOString(), // 90 days ago
        accidentDescription: 'Test accident'
      };

      // Add mood entries for last 14 days
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        tracker.data.moodEntries.push({
          id: 14 - i,
          rating: 5 + Math.floor(Math.random() * 3),
          note: `Test mood ${i}`,
          timestamp: date.toISOString()
        });
      }

      // Add some symptoms
      tracker.data.symptoms = [
        { id: 1, type: 'anxiety', severity: 7, note: 'Test', timestamp: now.toISOString() },
        { id: 2, type: 'anxiety', severity: 6, note: 'Test', timestamp: new Date(now.getTime() - 86400000).toISOString() },
        { id: 3, type: 'flashback', severity: 8, note: 'Test', timestamp: now.toISOString() }
      ];

      // Add goals
      tracker.data.goals = [
        { id: 1, description: 'Exercise daily', targetDate: '2024-12-31', completed: false, progress: 50 },
        { id: 2, description: 'Meditation', targetDate: '2024-12-31', completed: true, progress: 100 }
      ];

      // Add coping strategies with effectiveness
      tracker.data.copingStrategies = [
        { id: 1, name: 'Deep breathing', description: 'Test', timesUsed: 10, effectiveness: 8 },
        { id: 2, name: 'Walking', description: 'Test', timesUsed: 5, effectiveness: 7 }
      ];
    });

    describe('visualizeMoodTrends', () => {
      test('should display mood trends for default 14 days', () => {
        tracker.visualizeMoodTrends();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Mood Trend');
        expect(output).toContain('Average');
      });

      test('should display mood trends for custom number of days', () => {
        tracker.visualizeMoodTrends(7);

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Mood Trends');
      });

      test('should handle no mood data', () => {
        tracker.data.moodEntries = [];
        tracker.visualizeMoodTrends();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('No mood data');
      });

      test('should calculate and display statistics', () => {
        tracker.visualizeMoodTrends();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Average Mood');
        expect(output).toContain('Highest');
        expect(output).toContain('Lowest');
      });

      test('should show trend direction', () => {
        tracker.visualizeMoodTrends();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        // Should show some trend indicator
        expect(output).toMatch(/Improving|Stable|Declining/);
      });
    });

    describe('visualizeSymptomPatterns', () => {
      test('should display symptom patterns for default 30 days', () => {
        tracker.visualizeSymptomPatterns();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Symptom Patterns');
      });

      test('should display symptom patterns for custom number of days', () => {
        tracker.visualizeSymptomPatterns(14);

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('14 Days');
      });

      test('should handle no symptom data', () => {
        tracker.data.symptoms = [];
        tracker.visualizeSymptomPatterns();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('No symptom data');
      });

      test('should show symptom frequency', () => {
        tracker.visualizeSymptomPatterns();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('anxiety');
        expect(output).toContain('flashback');
      });

      test('should show average severity', () => {
        tracker.visualizeSymptomPatterns();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Average Severity');
      });
    });

    describe('visualizeRecoveryProgress', () => {
      test('should display comprehensive recovery dashboard', () => {
        tracker.visualizeRecoveryProgress();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Recovery Progress Visualization');
      });

      test('should show goals progress', () => {
        tracker.visualizeRecoveryProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Goals Progress');
        expect(output).toContain('50.0% Complete'); // 1 of 2 goals completed
      });

      test('should handle no goals', () => {
        tracker.data.goals = [];
        tracker.visualizeRecoveryProgress();

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        // Should still show visualization, just without goals section
        expect(output).toContain('Recovery Progress Visualization');
        expect(output).not.toContain('Goals Progress');
      });

      test('should show mood improvement', () => {
        tracker.visualizeRecoveryProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Mood Improvement');
      });

      test('should show coping strategies effectiveness', () => {
        tracker.visualizeRecoveryProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Coping Strategies');
        expect(output).toContain('Average effectiveness');
      });

      test('should show journaling consistency', () => {
        tracker.data.journalEntries = [
          { id: 1, content: 'Test', timestamp: new Date().toISOString() },
          { id: 2, content: 'Test', timestamp: new Date().toISOString() }
        ];

        tracker.visualizeRecoveryProgress();

        const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

        expect(output).toContain('Journal');
      });

      test('should handle missing mood data gracefully', () => {
        tracker.data.moodEntries = [];
        tracker.visualizeRecoveryProgress();

        expect(consoleLogSpy).toHaveBeenCalled();
        // Should not throw error
      });
    });

    describe('Helper Methods for Visualizations', () => {
      test('calculateTrend should identify improving trend', () => {
        const data = [
          { value: 3 },
          { value: 4 },
          { value: 5 },
          { value: 6 }
        ];

        const trend = tracker.calculateTrend(data);
        expect(trend).toContain('Improving');
      });

      test('calculateTrend should identify declining trend', () => {
        const data = [
          { value: 8 },
          { value: 6 },
          { value: 5 },
          { value: 3 }
        ];

        const trend = tracker.calculateTrend(data);
        expect(trend).toContain('Declining');
      });

      test('calculateTrend should identify stable trend', () => {
        const data = [
          { value: 5 },
          { value: 5 },
          { value: 5 },
          { value: 5 }
        ];

        const trend = tracker.calculateTrend(data);
        expect(trend).toContain('Stable');
      });

      test('calculateMoodStreak should count consecutive days', () => {
        const now = new Date();
        tracker.data.moodEntries = [];

        // Add entries for last 5 consecutive days
        for (let i = 4; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          tracker.data.moodEntries.push({
            id: 5 - i,
            rating: 5,
            note: 'Test',
            timestamp: date.toISOString()
          });
        }

        const streak = tracker.calculateMoodStreak();
        expect(streak).toBeGreaterThanOrEqual(1);
      });

      test('calculateMoodStreak should return 0 for no entries', () => {
        tracker.data.moodEntries = [];
        const streak = tracker.calculateMoodStreak();
        expect(streak).toBe(0);
      });

      test('calculateMoodStreak should return 0 when today has no entry', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 2);

        tracker.data.moodEntries = [{
          id: 1,
          rating: 7,
          note: 'Test',
          timestamp: yesterday.toISOString()
        }];

        const streak = tracker.calculateMoodStreak();
        expect(streak).toBe(0);
      });
    });
  });

  describe('Empty Data Edge Cases', () => {
    test('viewSymptoms should handle no symptoms gracefully', () => {
      tracker.data.symptoms = [];

      tracker.viewSymptoms(7);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No symptoms'));
    });

    test('visualizeSymptomPatterns should handle no symptoms', () => {
      tracker.data.symptoms = [];

      tracker.visualizeSymptomPatterns(30);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No symptom data'));
    });

    test('listCopingStrategies should handle empty list', () => {
      tracker.data.copingStrategies = [];

      tracker.listCopingStrategies();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No coping strategies'));
    });

    test('listTriggers should handle empty triggers', () => {
      tracker.data.triggers = [];

      tracker.listTriggers();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No triggers'));
    });
  });

  describe('SaveData Failure Paths', () => {
    beforeEach(() => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk write error');
      });
    });

    test('addJournal should return false when saveData fails', () => {
      const result = tracker.addJournal('Test entry', 'general');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('logSymptom should return false when saveData fails', () => {
      const result = tracker.logSymptom('anxiety', 5, 'Test note');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('addTrigger should return false when saveData fails', () => {
      const result = tracker.addTrigger('Test trigger', 7);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('addCopingStrategy should return false when saveData fails', () => {
      const result = tracker.addCopingStrategy('Deep breathing', 'Breathe slowly');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('addGoal should return false when saveData fails', () => {
      const result = tracker.addGoal('Test goal', '2024-12-31');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('logTriggerOccurrence should return false when saveData fails', () => {
      // First add a trigger successfully
      fs.writeFileSync.mockImplementationOnce(() => {});
      tracker.addTrigger('Test trigger', 5);
      const triggerId = tracker.data.triggers[0].id;

      // Now make saveData fail
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = tracker.logTriggerOccurrence(triggerId);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('useCopingStrategy should return false when saveData fails', () => {
      // First add a strategy successfully
      fs.writeFileSync.mockImplementationOnce(() => {});
      tracker.addCopingStrategy('Test', 'Description');
      const strategyId = tracker.data.copingStrategies[0].id;

      // Now make saveData fail
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const result = tracker.useCopingStrategy(strategyId, 8);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Therapy Session Manager', () => {
    beforeEach(() => {
      tracker.data.therapists = [];
      tracker.data.therapySessions = [];
    });

    describe('addTherapist', () => {
      test('should add therapist successfully', () => {
        const therapist = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234', 'dr.smith@example.com');

        expect(therapist).toBeTruthy();
        expect(therapist.name).toBe('Dr. Smith');
        expect(therapist.specialty).toBe('CBT');
        expect(therapist.phone).toBe('555-1234');
        expect(therapist.email).toBe('dr.smith@example.com');
        expect(therapist.id).toBeTruthy();
        expect(therapist.addedAt).toBeTruthy();
        expect(tracker.data.therapists).toHaveLength(1);
      });

      test('should add therapist without email', () => {
        const therapist = tracker.addTherapist('Dr. Jones', 'EMDR', '555-5678');

        expect(therapist).toBeTruthy();
        expect(therapist.name).toBe('Dr. Jones');
        expect(therapist.email).toBeUndefined();
      });

      test('should return null when saveData fails', () => {
        fs.writeFileSync.mockImplementation(() => {
          throw new Error('Write error');
        });

        const therapist = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234');

        expect(therapist).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      test('should log success message with email', () => {
        tracker.addTherapist('Dr. Smith', 'CBT', '555-1234', 'test@example.com');

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Therapist added successfully'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Email:'));
      });
    });

    describe('scheduleSession', () => {
      let therapist;

      beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        therapist = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234');
      });

      test('should schedule session successfully', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        const session = tracker.scheduleSession(therapist.id, '2024-12-25', '14:00', 'intake');

        expect(session).toBeTruthy();
        expect(session.therapistId).toBe(therapist.id);
        expect(session.therapistName).toBe('Dr. Smith');
        expect(session.date).toBe('2024-12-25');
        expect(session.time).toBe('14:00');
        expect(session.type).toBe('intake');
        expect(session.status).toBe('scheduled');
        expect(session.preSessionMood).toBeNull();
        expect(session.postSessionMood).toBeNull();
        expect(session.id).toBeTruthy();
        expect(tracker.data.therapySessions).toHaveLength(1);
      });

      test('should use default type "regular"', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        const session = tracker.scheduleSession(therapist.id, '2024-12-25', '14:00');

        expect(session.type).toBe('regular');
      });

      test('should return false for non-existent therapist', () => {
        const result = tracker.scheduleSession(99999, '2024-12-25', '14:00');

        expect(result).toBe(false);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Therapist not found'));
      });

      test('should return null when saveData fails', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        fs.writeFileSync.mockImplementation(() => {
          throw new Error('Write error');
        });

        const session = tracker.scheduleSession(therapist.id, '2024-12-25', '14:00');

        expect(session).toBeNull();
      });

      test('should log session details on success', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        tracker.scheduleSession(therapist.id, '2024-12-25', '14:00', 'followup');

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Therapy session scheduled'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('followup'));
      });
    });

    describe('listTherapists', () => {
      test('should show message when no therapists', () => {
        tracker.listTherapists();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No therapists added yet'));
      });

      test('should list all therapists', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        tracker.addTherapist('Dr. Smith', 'CBT', '555-1234', 'smith@example.com');
        await new Promise(resolve => setTimeout(resolve, 5));
        tracker.addTherapist('Dr. Jones', 'EMDR', '555-5678');

        tracker.listTherapists();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Your Therapists'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Dr. Smith'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Dr. Jones'));
      });
    });

    describe('listSessions', () => {
      test('should show message when no sessions', () => {
        tracker.listSessions();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No therapy sessions found'));
      });

      test('should list upcoming sessions only', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        const therapist = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234');
        await new Promise(resolve => setTimeout(resolve, 5));
        const session1 = tracker.scheduleSession(therapist.id, '2024-12-25', '14:00');
        await new Promise(resolve => setTimeout(resolve, 5));
        const session2 = tracker.scheduleSession(therapist.id, '2024-12-26', '15:00');

        // Mark one as completed
        tracker.data.therapySessions[0].status = 'completed';

        tracker.listSessions(true);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upcoming Therapy Sessions'));
      });

      test('should list all sessions when upcoming=false', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        const therapist = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234');
        await new Promise(resolve => setTimeout(resolve, 5));
        tracker.scheduleSession(therapist.id, '2024-12-25', '14:00');

        tracker.listSessions(false);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('All Therapy Sessions'));
      });
    });

    describe('preSessionPrep', () => {
      let session;

      beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        const therapist = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234');
        await new Promise(resolve => setTimeout(resolve, 5));
        session = tracker.scheduleSession(therapist.id, '2024-12-25', '14:00');
      });

      test('should save pre-session prep successfully', () => {
        const result = tracker.preSessionPrep(session.id, 5, 'Feeling anxious about work');

        expect(result).toBe(true);
        const updated = tracker.data.therapySessions.find(s => s.id === session.id);
        expect(updated.preSessionMood).toBe(5);
        expect(updated.preSessionNotes).toBe('Feeling anxious about work');
      });

      test('should return false for non-existent session', () => {
        const result = tracker.preSessionPrep(99999, 5, 'Notes');

        expect(result).toBe(false);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Session not found'));
      });

      test('should show average mood when mood entries exist', () => {
        tracker.data.moodEntries = [
          { rating: 6 }, { rating: 7 }, { rating: 5 }
        ];

        tracker.preSessionPrep(session.id, 5, 'Notes');

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('average mood'));
      });

      test('should return false when saveData fails', () => {
        fs.writeFileSync.mockImplementation(() => {
          throw new Error('Write error');
        });

        const result = tracker.preSessionPrep(session.id, 5, 'Notes');

        expect(result).toBe(false);
      });
    });

    describe('completeSession', () => {
      let session;

      beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        const therapist = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234');
        await new Promise(resolve => setTimeout(resolve, 5));
        session = tracker.scheduleSession(therapist.id, '2024-12-25', '14:00');
      });

      test('should mark session as complete', () => {
        const result = tracker.completeSession(session.id, 7, 'Session went well', 9);

        expect(result).toBe(true);
        const updated = tracker.data.therapySessions.find(s => s.id === session.id);
        expect(updated.status).toBe('completed');
        expect(updated.postSessionMood).toBe(7);
        expect(updated.postSessionNotes).toBe('Session went well');
        expect(updated.effectiveness).toBe(9);
        expect(updated.completedAt).toBeTruthy();
      });

      test('should show mood improvement when pre-session mood exists', () => {
        tracker.data.therapySessions.find(s => s.id === session.id).preSessionMood = 4;

        tracker.completeSession(session.id, 7, 'Better now', 8);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mood improved by 3'));
      });

      test('should show mood decrease', () => {
        tracker.data.therapySessions.find(s => s.id === session.id).preSessionMood = 8;

        tracker.completeSession(session.id, 5, 'Difficult session', 7);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mood decreased by 3'));
      });

      test('should show mood stayed same', () => {
        tracker.data.therapySessions.find(s => s.id === session.id).preSessionMood = 6;

        tracker.completeSession(session.id, 6, 'Same mood', 7);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mood stayed the same'));
      });

      test('should return false for non-existent session', () => {
        const result = tracker.completeSession(99999, 7, 'Notes', 8);

        expect(result).toBe(false);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Session not found'));
      });

      test('should return false when saveData fails', () => {
        fs.writeFileSync.mockImplementation(() => {
          throw new Error('Write error');
        });

        const result = tracker.completeSession(session.id, 7, 'Notes', 8);

        expect(result).toBe(false);
      });
    });

    describe('therapyAnalytics', () => {
      test('should show message when no completed sessions', () => {
        tracker.therapyAnalytics();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No completed therapy sessions'));
      });

      test('should display analytics for completed sessions', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        const therapist = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234');
        await new Promise(resolve => setTimeout(resolve, 5));
        const session1 = tracker.scheduleSession(therapist.id, '2024-12-20', '14:00');
        await new Promise(resolve => setTimeout(resolve, 5));
        const session2 = tracker.scheduleSession(therapist.id, '2024-12-21', '14:00');

        // Complete sessions
        tracker.completeSession(session1.id, 7, 'Good', 8);
        tracker.completeSession(session2.id, 8, 'Great', 9);

        tracker.therapyAnalytics();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Therapy Session Analytics'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Sessions: 2'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Completed: 2'));
      });

      test('should calculate average effectiveness', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        const therapist = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234');
        await new Promise(resolve => setTimeout(resolve, 5));
        const session = tracker.scheduleSession(therapist.id, '2024-12-20', '14:00');

        tracker.completeSession(session.id, 7, 'Good', 8);

        tracker.therapyAnalytics();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Average Effectiveness: 8.0/10'));
      });

      test('should show mood impact when pre and post mood exist', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        const therapist = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234');
        await new Promise(resolve => setTimeout(resolve, 5));
        const session = tracker.scheduleSession(therapist.id, '2024-12-20', '14:00');

        tracker.preSessionPrep(session.id, 4, 'Anxious');
        tracker.completeSession(session.id, 7, 'Better', 8);

        tracker.therapyAnalytics();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mood Impact'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Average mood change'));
      });

      test('should show stats by therapist', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        const therapist1 = tracker.addTherapist('Dr. Smith', 'CBT', '555-1234');
        await new Promise(resolve => setTimeout(resolve, 5));
        const therapist2 = tracker.addTherapist('Dr. Jones', 'EMDR', '555-5678');

        await new Promise(resolve => setTimeout(resolve, 5));
        const session1 = tracker.scheduleSession(therapist1.id, '2024-12-20', '14:00');
        await new Promise(resolve => setTimeout(resolve, 5));
        const session2 = tracker.scheduleSession(therapist2.id, '2024-12-21', '14:00');

        tracker.completeSession(session1.id, 7, 'Good', 8);
        tracker.completeSession(session2.id, 8, 'Great', 9);

        tracker.therapyAnalytics();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('By Therapist'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Dr. Smith'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Dr. Jones'));
      });
    });
  });
});
