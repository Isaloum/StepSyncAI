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
});
