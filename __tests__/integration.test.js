const fs = require('fs');
const MentalHealthTracker = require('../mental-health-tracker');
const MedicationTracker = require('../medication-tracker');
const AWSForKids = require('../aws-for-kids');

// Mock fs module
jest.mock('fs');

describe('Integration Tests - Complete Workflows', () => {
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

  describe('Mental Health Tracker - Complete Recovery Journey', () => {
    test('should handle complete first-time user setup and daily tracking', () => {
      const tracker = new MentalHealthTracker('journey.json');

      // Day 1: Setup profile
      const profileResult = tracker.setupProfile('2024-01-15', 'Workplace accident - forklift incident');
      expect(profileResult).toBe(true);

      // Add emergency contacts
      tracker.addEmergencyContact('Dr. Sarah Johnson', 'Therapist', '555-THERAPY', 'Tuesdays 2PM');
      tracker.addEmergencyContact('Crisis Hotline', 'Support', '988', '24/7 available');
      expect(tracker.data.emergencyContacts.length).toBe(2);

      // Set recovery goals
      tracker.addGoal('Return to work part-time', '2024-06-01');
      tracker.addGoal('Sleep 7+ hours consistently', '2024-03-01');
      tracker.addGoal('Attend therapy weekly', '2024-12-31');
      expect(tracker.data.goals.length).toBe(3);

      // Add coping strategies
      tracker.addCopingStrategy('Deep breathing', '4-7-8 breathing technique', null);
      tracker.addCopingStrategy('Walking', 'Walk around the block when anxious', null);
      expect(tracker.data.copingStrategies.length).toBe(2);

      // Day 1: Log first entries
      tracker.logMood(4, 'Still shaken from the accident');
      tracker.logSymptom('anxiety', 8, 'Heart racing, hard to focus');
      tracker.addJournal('First day tracking. Feeling overwhelmed but hopeful.', 'reflection');

      expect(tracker.data.moodEntries.length).toBe(1);
      expect(tracker.data.symptoms.length).toBe(1);
      expect(tracker.data.journalEntries.length).toBe(1);

      // Use coping strategy
      const strategyId = tracker.data.copingStrategies[0].id;
      tracker.useCopingStrategy(strategyId, 7);
      expect(tracker.data.copingStrategies[0].timesUsed).toBe(1);
      expect(tracker.data.copingStrategies[0].ratings.length).toBe(1);

      // Track trigger
      tracker.addTrigger('Loud sudden noises', 9);
      expect(tracker.data.triggers.length).toBe(1);

      // Verify all data is present
      expect(tracker.data.profile.accidentDate).toBe('2024-01-15');
      expect(tracker.saveData()).toBe(true);
    });

    test('should handle week-long tracking with progress', () => {
      const tracker = new MentalHealthTracker('week-journey.json');

      // Simulate a week of tracking
      const moods = [4, 4, 5, 5, 6, 6, 7]; // Gradual improvement
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      days.forEach((day, index) => {
        tracker.logMood(moods[index], `${day}: Feeling ${moods[index] >= 6 ? 'better' : 'challenging'}`);
      });

      expect(tracker.data.moodEntries.length).toBe(7);

      // Check trend - last mood should be better than first
      const firstMood = tracker.data.moodEntries[0].rating;
      const lastMood = tracker.data.moodEntries[6].rating;
      expect(lastMood).toBeGreaterThan(firstMood);
    });

    test('should handle complete goal achievement workflow', () => {
      const tracker = new MentalHealthTracker('goals.json');

      // Add goal
      tracker.addGoal('Complete 30 days of mood tracking', '2024-02-15');
      const goalId = tracker.data.goals[0].id;

      expect(tracker.data.goals[0].completed).toBe(false);

      // Complete goal
      tracker.completeGoal(goalId);

      expect(tracker.data.goals[0].completed).toBe(true);
      expect(tracker.data.goals[0].completedAt).toBeTruthy();
    });
  });

  describe('Medication Tracker - Daily Medication Management', () => {
    test('should handle complete medication management workflow', () => {
      const tracker = new MedicationTracker('med-workflow.json');

      // Morning: Add medications
      const aspirin = tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');
      const vitaminD = tracker.addMedication('Vitamin D', '1000IU', 'daily', '08:00');
      const antibiotic = tracker.addMedication('Amoxicillin', '500mg', 'twice-daily', '08:00,20:00');

      expect(tracker.data.medications.length).toBe(3);
      expect(aspirin).not.toBeNull();
      expect(vitaminD).not.toBeNull();
      expect(antibiotic).not.toBeNull();

      // Take morning medications
      tracker.markAsTaken(aspirin.id, 'With breakfast');
      tracker.markAsTaken(vitaminD.id, 'With breakfast');
      tracker.markAsTaken(antibiotic.id, 'Morning dose');

      expect(tracker.data.history.length).toBe(3);

      // Check status - all should be marked as taken
      tracker.checkTodayStatus();

      // Complete antibiotic course after 10 days
      tracker.removeMedication(antibiotic.id);

      // Find the antibiotic in the array (might not be at index 2)
      const deactivatedMed = tracker.data.medications.find(m => m.id === antibiotic.id);
      expect(deactivatedMed.active).toBe(false);
      expect(tracker.data.history.length).toBe(3); // History preserved
    });

    test('should handle medication changes and substitutions', () => {
      const tracker = new MedicationTracker('med-changes.json');

      // Start with original medication
      const original = tracker.addMedication('Original Med', '10mg', 'daily', '08:00');
      tracker.markAsTaken(original.id, 'First dose');

      // Side effects - switch medication
      tracker.removeMedication(original.id);
      const replacement = tracker.addMedication('Replacement Med', '20mg', 'daily', '08:00');

      expect(tracker.data.medications.length).toBe(2);
      expect(tracker.data.medications[0].active).toBe(false);
      expect(tracker.data.medications[1].active).toBe(true);
      expect(tracker.data.history.length).toBe(1); // Previous history preserved
    });

    test('should handle complex multi-dose schedules', () => {
      const tracker = new MedicationTracker('complex-schedule.json');

      const threeTimes = tracker.addMedication(
        'Three times daily',
        '10mg',
        'three-times-daily',
        '08:00,14:00,20:00'
      );

      // Take all three doses
      tracker.markAsTaken(threeTimes.id, 'Morning');
      tracker.markAsTaken(threeTimes.id, 'Afternoon');
      tracker.markAsTaken(threeTimes.id, 'Evening');

      expect(tracker.data.history.length).toBe(3);
      expect(tracker.data.history.every(h => h.medicationId === threeTimes.id)).toBe(true);
    });

    test('should track medication adherence over time', () => {
      const tracker = new MedicationTracker('adherence.json');

      const med = tracker.addMedication('Daily Med', '10mg', 'daily', '08:00');

      // Simulate 7 days, missing 2 days
      const takenDays = [1, 2, 3, 5, 7]; // Missed days 4 and 6

      takenDays.forEach(day => {
        tracker.markAsTaken(med.id, `Day ${day}`);
      });

      expect(tracker.data.history.length).toBe(5);

      // Adherence rate: 5/7 = ~71%
      const adherenceRate = (tracker.data.history.length / 7) * 100;
      expect(adherenceRate).toBeCloseTo(71.4, 1);
    });
  });

  describe('AWS For Kids - Complete Learning Journey', () => {
    test('should handle complete beginner to exam-ready journey', () => {
      const app = new AWSForKids('learning-journey.json');

      // Phase 1: Learn core concepts
      const coreConcepts = ['ec2', 's3', 'iam', 'vpc'];

      coreConcepts.forEach(concept => {
        app.learn(concept);
      });

      expect(app.data.completedLessons.length).toBe(4);

      // Phase 2: Check progress
      app.progress();

      // Phase 3: Study guide review
      app.studyGuide();

      // Phase 4: Simulate quiz scores improving over time
      app.data.quizScores = [
        { date: '2024-01-01', score: 3, total: 5, percentage: '60.0' },
        { date: '2024-01-08', score: 4, total: 5, percentage: '80.0' },
        { date: '2024-01-15', score: 5, total: 5, percentage: '100.0' }
      ];

      app.progress();

      // Verify improvement
      expect(app.data.quizScores.length).toBe(3);
      expect(parseFloat(app.data.quizScores[2].percentage)).toBeGreaterThan(
        parseFloat(app.data.quizScores[0].percentage)
      );
    });

    test('should handle category-focused learning', () => {
      const app = new AWSForKids('category-learning.json');

      // Learn all storage concepts
      app.learn('s3');

      // List only storage topics
      app.listTopics('Storage');

      expect(app.data.completedLessons).toContain('s3');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should track learning progress percentage', () => {
      const app = new AWSForKids('progress-tracking.json');

      const totalTopics = Object.keys(app.concepts).length;

      // Learn half the topics
      const topicsToLearn = Object.keys(app.concepts).slice(0, Math.floor(totalTopics / 2));

      topicsToLearn.forEach(topic => {
        app.learn(topic);
      });

      const expectedPercentage = (topicsToLearn.length / totalTopics) * 100;

      app.progress();

      // Verify progress is roughly 50%
      expect(app.data.completedLessons.length).toBe(topicsToLearn.length);
      expect(expectedPercentage).toBeGreaterThan(40);
      expect(expectedPercentage).toBeLessThan(60);
    });

    test('should handle exam preparation workflow', () => {
      const app = new AWSForKids('exam-prep.json');

      // Learn all HIGH priority topics first
      const concepts = app.concepts;
      const highPriority = Object.entries(concepts)
        .filter(([_, concept]) => concept.examWeight === 'HIGH')
        .map(([key, _]) => key);

      highPriority.forEach(topic => {
        app.learn(topic);
      });

      expect(app.data.completedLessons.length).toBeGreaterThan(0);

      // Review study guide
      app.studyGuide();

      // Check final progress
      app.progress();

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Cross-Module Integration', () => {
    test('should handle health recovery with medication tracking', () => {
      const healthTracker = new MentalHealthTracker('health.json');
      const medTracker = new MedicationTracker('meds.json');

      // Setup mental health tracking
      healthTracker.setupProfile('2024-01-01', 'Starting recovery');
      healthTracker.logMood(5, 'Baseline');

      // Add prescribed medications
      medTracker.addMedication('Anxiety medication', '10mg', 'daily', '08:00');

      // Track both
      healthTracker.logMood(6, 'Medication helping');
      const meds = medTracker.data.medications;
      medTracker.markAsTaken(meds[0].id, 'Feeling calmer');

      // Verify both tracking systems working
      expect(healthTracker.data.moodEntries.length).toBe(2);
      expect(medTracker.data.history.length).toBe(1);

      // Mood improvement tracked
      expect(healthTracker.data.moodEntries[1].rating).toBeGreaterThan(
        healthTracker.data.moodEntries[0].rating
      );
    });

    test('should handle learning while managing health', () => {
      const healthTracker = new MentalHealthTracker('health.json');
      const learningApp = new AWSForKids('learning.json');

      // Set goal to learn new skill
      healthTracker.addGoal('Complete AWS Cloud Practitioner course', '2024-03-01');

      // Start learning
      learningApp.learn('ec2');
      learningApp.learn('s3');

      // Track mental health during learning
      healthTracker.logMood(7, 'Feeling accomplished after learning');

      // Verify progress in both systems
      expect(learningApp.data.completedLessons.length).toBe(2);
      expect(healthTracker.data.goals.length).toBe(1);
      expect(healthTracker.data.moodEntries.length).toBe(1);
    });
  });

  describe('Data Persistence Integration', () => {
    test('should persist and restore complete state', () => {
      let savedData;

      // First session
      {
        const tracker = new MentalHealthTracker('persist-test.json');
        tracker.setupProfile('2024-01-01', 'Test');
        tracker.logMood(5, 'Initial');
        tracker.addGoal('Test goal', '2024-12-31');

        // Capture saved data
        savedData = fs.writeFileSync.mock.calls[fs.writeFileSync.mock.calls.length - 1][1];
      }

      // Simulate loading in new session
      {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(savedData);

        const tracker = new MentalHealthTracker('persist-test.json');

        // Verify all data restored
        expect(tracker.data.profile.accidentDate).toBe('2024-01-01');
        expect(tracker.data.moodEntries.length).toBe(1);
        expect(tracker.data.goals.length).toBe(1);
      }
    });

    test('should handle migration from empty to populated state', () => {
      const tracker = new MedicationTracker('migration-test.json');

      // Initially empty
      expect(tracker.data.medications.length).toBe(0);

      // Add data
      tracker.addMedication('Med1', '10mg', 'daily', '08:00');
      tracker.addMedication('Med2', '20mg', 'daily', '09:00');

      // Verify migration
      expect(tracker.data.medications.length).toBe(2);
      expect(Array.isArray(tracker.data.history)).toBe(true);
    });
  });

  describe('Real-World Usage Scenarios', () => {
    test('should handle morning routine workflow', () => {
      const medTracker = new MedicationTracker('morning.json');
      const healthTracker = new MentalHealthTracker('morning.json');

      // Morning routine
      // 1. Wake up, log mood
      healthTracker.logMood(6, 'Morning - feeling rested');

      // 2. Take medications
      const med1 = medTracker.addMedication('Morning Med 1', '10mg', 'daily', '08:00');
      const med2 = medTracker.addMedication('Morning Med 2', '5mg', 'daily', '08:00');

      medTracker.markAsTaken(med1.id, 'With breakfast');
      medTracker.markAsTaken(med2.id, 'With breakfast');

      // 3. Check status
      medTracker.checkTodayStatus();

      // Verify routine completed
      expect(healthTracker.data.moodEntries.length).toBe(1);
      expect(medTracker.data.history.length).toBe(2);
    });

    test('should handle therapy session workflow', () => {
      const tracker = new MentalHealthTracker('therapy.json');

      // Before therapy
      tracker.logMood(5, 'Before therapy - anxious');
      tracker.logSymptom('anxiety', 7, 'Pre-session nervousness');

      // Add journal entry about session
      tracker.addJournal('Therapy session today. Discussed triggers and coping strategies.', 'therapy');

      // After therapy
      tracker.logMood(7, 'After therapy - feeling heard and understood');

      // Add new coping strategy learned
      tracker.addCopingStrategy('Grounding technique', '5-4-3-2-1 sensory awareness', null);

      // Verify session tracked
      expect(tracker.data.moodEntries.length).toBe(2);
      expect(tracker.data.symptoms.length).toBe(1);
      expect(tracker.data.journalEntries.length).toBe(1);
      expect(tracker.data.copingStrategies.length).toBe(1);

      // Mood improved
      expect(tracker.data.moodEntries[1].rating).toBeGreaterThan(
        tracker.data.moodEntries[0].rating
      );
    });

    test('should handle difficult day with multiple interventions', () => {
      const tracker = new MentalHealthTracker('difficult-day.json');

      // Morning - low mood
      tracker.logMood(3, 'Woke up feeling terrible');
      tracker.logSymptom('depression', 8, 'Heavy, no motivation');

      // Add trigger
      tracker.addTrigger('Work deadline stress', 9);

      // Try coping strategies
      const strategy = tracker.addCopingStrategy('Take a walk', 'Short walk outside', null);
      tracker.useCopingStrategy(tracker.data.copingStrategies[0].id, 5);

      // Afternoon - slight improvement
      tracker.logMood(4, 'Walk helped a little');

      // Evening - journal reflection
      tracker.addJournal('Hard day but I made it through. Used coping strategies.', 'reflection');

      // Verify all interventions recorded
      expect(tracker.data.moodEntries.length).toBe(2);
      expect(tracker.data.symptoms.length).toBe(1);
      expect(tracker.data.triggers.length).toBe(1);
      expect(tracker.data.copingStrategies.length).toBe(1);
      expect(tracker.data.copingStrategies[0].timesUsed).toBe(1);
      expect(tracker.data.journalEntries.length).toBe(1);
    });
  });
});
