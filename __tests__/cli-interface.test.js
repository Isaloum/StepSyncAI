const fs = require('fs');
const MentalHealthTracker = require('../mental-health-tracker');

// Mock fs module
jest.mock('fs');

describe('CLI Interface - Mental Health Tracker', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue(JSON.stringify({}));
        fs.writeFileSync.mockImplementation(() => {});

        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('quickCheckIn', () => {
        test('should display daily summary with no data', () => {
            const tracker = new MentalHealthTracker();
            tracker.quickCheckIn();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Quick Mental Health Check-In'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mood entries: 0'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Symptoms logged: 0'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Journal entries: 0'));
        });

        test('should show average mood when moods are logged', () => {
            const tracker = new MentalHealthTracker();
            tracker.logMood(7, 'Good morning');
            tracker.logMood(8, 'Better afternoon');

            consoleLogSpy.mockClear();
            tracker.quickCheckIn();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Average mood: 7.5/10'));
        });

        test('should suggest logging mood if none logged today', () => {
            const tracker = new MentalHealthTracker();
            tracker.quickCheckIn();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Log your current mood'));
        });

        test('should suggest writing journal if none written today', () => {
            const tracker = new MentalHealthTracker();
            tracker.quickCheckIn();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Write a journal entry'));
        });

        test('should show best coping strategy if available', () => {
            const tracker = new MentalHealthTracker();
            tracker.addCopingStrategy('Deep Breathing', 'Breathe slowly for 5 minutes');
            tracker.useCopingStrategy(tracker.data.copingStrategies[0].id, 9);

            consoleLogSpy.mockClear();
            tracker.quickCheckIn();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('most effective coping strategy')
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Deep Breathing')
            );
        });

        test('should count symptoms logged today', () => {
            const tracker = new MentalHealthTracker();
            tracker.logSymptom('anxiety', 5, 'Morning anxiety');
            tracker.logSymptom('insomnia', 3, 'Trouble sleeping');

            consoleLogSpy.mockClear();
            tracker.quickCheckIn();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Symptoms logged: 2'));
        });

        test('should count journal entries for today', () => {
            const tracker = new MentalHealthTracker();
            tracker.addJournal('Morning thoughts', 'general');
            tracker.addJournal('Therapy session notes', 'therapy');

            consoleLogSpy.mockClear();
            tracker.quickCheckIn();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Journal entries: 2'));
        });

        test('should filter data by today only', () => {
            const tracker = new MentalHealthTracker();

            // Add old data (yesterday)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            tracker.data.moodEntries.push({
                id: 'old1',
                rating: 5,
                note: 'Yesterday',
                timestamp: yesterday.toISOString()
            });

            // Add today's data
            tracker.logMood(8, 'Today');

            consoleLogSpy.mockClear();
            tracker.quickCheckIn();

            // Should only count today's mood
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mood entries: 1'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Average mood: 8.0/10'));
        });

        test('should not crash with empty coping strategies', () => {
            const tracker = new MentalHealthTracker();
            tracker.data.copingStrategies = [];

            expect(() => tracker.quickCheckIn()).not.toThrow();
        });

        test('should handle coping strategies without effectiveness ratings', () => {
            const tracker = new MentalHealthTracker();
            tracker.addCopingStrategy('Meditation', 'Daily meditation');
            // Don't use it, so no effectiveness rating

            expect(() => tracker.quickCheckIn()).not.toThrow();
        });
    });

    describe('Display Methods', () => {
        test('viewProfile should display profile information', () => {
            const tracker = new MentalHealthTracker();
            tracker.setupProfile('2024-01-15', 'Workplace accident');

            consoleLogSpy.mockClear();
            tracker.viewProfile();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Your Profile'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('2024-01-15'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Workplace accident'));
        });

        test('viewProfile should show not set when no profile exists', () => {
            const tracker = new MentalHealthTracker();
            tracker.viewProfile();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Not set'));
        });

        test('viewMoodHistory should display mood trends', () => {
            const tracker = new MentalHealthTracker();
            tracker.logMood(7, 'Good day');
            tracker.logMood(6, 'Okay day');

            consoleLogSpy.mockClear();
            tracker.viewMoodHistory(7);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Mood History'));
        });

        test('viewJournal should display journal entries', () => {
            const tracker = new MentalHealthTracker();
            tracker.addJournal('Test entry', 'general');

            consoleLogSpy.mockClear();
            tracker.viewJournal(7);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Journal Entries'));
        });

        test('viewSymptoms should display symptom history', () => {
            const tracker = new MentalHealthTracker();
            tracker.logSymptom('anxiety', 5, 'Test');

            consoleLogSpy.mockClear();
            tracker.viewSymptoms(7);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Symptom History'));
        });

        test('listTriggers should display all triggers', () => {
            const tracker = new MentalHealthTracker();
            tracker.addTrigger('Loud noises', 7);

            consoleLogSpy.mockClear();
            tracker.listTriggers();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Triggers'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Loud noises'));
        });

        test('listCopingStrategies should display all strategies', () => {
            const tracker = new MentalHealthTracker();
            tracker.addCopingStrategy('Deep Breathing', 'Breathe slowly');

            consoleLogSpy.mockClear();
            tracker.listCopingStrategies();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Coping Strategies'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deep Breathing'));
        });

        test('listEmergencyContacts should display all contacts', () => {
            const tracker = new MentalHealthTracker();
            tracker.addEmergencyContact('Dr. Smith', 'Therapist', '555-1234', 'Weekly sessions');

            consoleLogSpy.mockClear();
            tracker.listEmergencyContacts();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Emergency Contacts'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Dr. Smith'));
        });

        test('listGoals should display active goals', () => {
            const tracker = new MentalHealthTracker();
            tracker.addGoal('Return to work', '2024-12-31');

            consoleLogSpy.mockClear();
            tracker.listGoals(false);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Your Goals'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Return to work'));
        });

        test('listGoals should display all goals including completed when showAll is true', () => {
            const tracker = new MentalHealthTracker();
            const goal = tracker.addGoal('First goal', '2024-12-31');
            tracker.completeGoal(goal.id);

            consoleLogSpy.mockClear();
            tracker.listGoals(true);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('First goal'));
        });
    });

    describe('Empty State Messages', () => {
        test('viewMoodHistory should handle empty mood data', () => {
            const tracker = new MentalHealthTracker();
            tracker.viewMoodHistory(7);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No mood entries'));
        });

        test('viewJournal should handle empty journal data', () => {
            const tracker = new MentalHealthTracker();
            tracker.viewJournal(7);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No journal entries'));
        });

        test('viewSymptoms should handle empty symptom data', () => {
            const tracker = new MentalHealthTracker();
            tracker.viewSymptoms(7);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No symptoms'));
        });

        test('listTriggers should handle empty trigger data', () => {
            const tracker = new MentalHealthTracker();
            tracker.listTriggers();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No triggers'));
        });

        test('listCopingStrategies should handle empty strategies', () => {
            const tracker = new MentalHealthTracker();
            tracker.listCopingStrategies();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No coping strategies'));
        });

        test('listEmergencyContacts should handle empty contacts', () => {
            const tracker = new MentalHealthTracker();
            tracker.listEmergencyContacts();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No emergency contacts'));
        });

        test('listGoals should handle empty goals', () => {
            const tracker = new MentalHealthTracker();
            tracker.listGoals(false);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No active goals'));
        });
    });

    describe('Mood Emoji Helper', () => {
        test('getMoodEmoji should return correct emojis for different ratings', () => {
            const tracker = new MentalHealthTracker();

            // Test various mood levels
            const emoji1 = tracker.getMoodEmoji(1);
            const emoji5 = tracker.getMoodEmoji(5);
            const emoji8 = tracker.getMoodEmoji(8);
            const emoji10 = tracker.getMoodEmoji(10);

            // Just verify they return something (emojis)
            expect(emoji1).toBeTruthy();
            expect(emoji5).toBeTruthy();
            expect(emoji8).toBeTruthy();
            expect(emoji10).toBeTruthy();
        });
    });

    describe('Date Filtering', () => {
        test('should filter mood history by days parameter', () => {
            const tracker = new MentalHealthTracker();

            // Add mood from 10 days ago
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 10);
            tracker.data.moodEntries.push({
                id: 'old',
                rating: 5,
                note: 'Old entry',
                timestamp: oldDate.toISOString()
            });

            // Add recent mood
            tracker.logMood(8, 'Recent entry');

            consoleLogSpy.mockClear();
            tracker.viewMoodHistory(7); // Last 7 days only

            // Should show recent but not old (10 days ago)
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Recent entry');
            expect(output).not.toContain('Old entry');
        });

        test('should filter journal by days and type', () => {
            const tracker = new MentalHealthTracker();
            tracker.addJournal('General entry', 'general');
            tracker.addJournal('Therapy notes', 'therapy');

            consoleLogSpy.mockClear();
            tracker.viewJournal(7, 'therapy');

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Therapy notes');
        });

        test('should filter symptoms by days and type', () => {
            const tracker = new MentalHealthTracker();
            tracker.logSymptom('anxiety', 5, 'Anxiety note');
            tracker.logSymptom('depression', 3, 'Depression note');

            consoleLogSpy.mockClear();
            tracker.viewSymptoms(7, 'anxiety');

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('ANXIETY'); // Display uses uppercase
        });
    });

    describe('Complex Scenarios', () => {
        test('should handle full recovery journey display', () => {
            const tracker = new MentalHealthTracker();

            // Setup complete profile
            tracker.setupProfile('2024-01-01', 'Workplace accident');
            tracker.logMood(4, 'Starting recovery');
            tracker.logSymptom('anxiety', 7, 'High anxiety');
            tracker.addJournal('First day of recovery', 'general');
            tracker.addTrigger('Loud noises', 8);
            tracker.addCopingStrategy('Deep breathing', 'Breathe slowly');
            tracker.addEmergencyContact('Dr. Smith', 'Therapist', '555-1234');
            tracker.addGoal('Return to work', '2024-12-31');

            // All display methods should work without errors
            expect(() => {
                tracker.viewProfile();
                tracker.viewMoodHistory(30);
                tracker.viewJournal(30);
                tracker.viewSymptoms(30);
                tracker.listTriggers();
                tracker.listCopingStrategies();
                tracker.listEmergencyContacts();
                tracker.listGoals(true);
                tracker.quickCheckIn();
            }).not.toThrow();
        });

        test('should calculate correct averages with multiple daily moods', () => {
            const tracker = new MentalHealthTracker();

            // Log multiple moods throughout the day
            tracker.logMood(5, 'Morning');
            tracker.logMood(6, 'Noon');
            tracker.logMood(7, 'Evening');
            tracker.logMood(8, 'Night');

            consoleLogSpy.mockClear();
            tracker.quickCheckIn();

            // Average should be 6.5
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Average mood: 6.5/10'));
        });
    });
});
