const fs = require('fs');
const MentalHealthTracker = require('../mental-health-tracker');
const MedicationTracker = require('../medication-tracker');
const AWSForKids = require('../aws-for-kids');

// Mock fs module
jest.mock('fs');

describe('Branch Coverage Improvements', () => {
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

    describe('Mental Health Tracker - Save Failures', () => {
        test('logMood should return false when saveData fails', () => {
            const tracker = new MentalHealthTracker('test.json');

            // Mock writeFileSync to throw error
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Disk full');
            });

            const result = tracker.logMood(7, 'Test note');

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('addJournal should return false when saveData fails', () => {
            const tracker = new MentalHealthTracker('test.json');
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            const result = tracker.addJournal('Test content', 'general');

            expect(result).toBe(false);
        });

        test('logSymptom should return false when saveData fails', () => {
            const tracker = new MentalHealthTracker('test.json');
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.logSymptom('anxiety', 5, 'Test');

            expect(result).toBe(false);
        });

        test('addTrigger should return false when saveData fails', () => {
            const tracker = new MentalHealthTracker('test.json');
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.addTrigger('Test trigger', 7);

            expect(result).toBe(false);
        });

        test('addCopingStrategy should return false when saveData fails', () => {
            const tracker = new MentalHealthTracker('test.json');
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.addCopingStrategy('Strategy', 'Description');

            expect(result).toBe(false);
        });

        test('addEmergencyContact should return false when saveData fails', () => {
            const tracker = new MentalHealthTracker('test.json');
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.addEmergencyContact('John', 'Friend', '555-0100');

            expect(result).toBe(false);
        });

        test('addGoal should return false when saveData fails', () => {
            const tracker = new MentalHealthTracker('test.json');
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.addGoal('Test goal');

            expect(result).toBe(false);
        });

        test('completeGoal should return false when saveData fails', () => {
            const tracker = new MentalHealthTracker('test.json');
            const goalId = tracker.addGoal('Test goal');

            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.completeGoal(goalId);

            expect(result).toBe(false);
        });

        test('useCopingStrategy should return false when saveData fails', () => {
            const tracker = new MentalHealthTracker('test.json');
            const strategyId = tracker.addCopingStrategy('Test', 'Description');

            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.useCopingStrategy(strategyId, 8);

            expect(result).toBe(false);
        });

        test('logTriggerOccurrence should return false when saveData fails', () => {
            const tracker = new MentalHealthTracker('test.json');
            const triggerId = tracker.addTrigger('Test trigger');

            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.logTriggerOccurrence(triggerId);

            expect(result).toBe(false);
        });
    });

    describe('Medication Tracker - Save Failures', () => {
        test('addMedication should handle save error gracefully', () => {
            const tracker = new MedicationTracker('test.json');
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');

            expect(result).toBe(null);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('markAsTaken should return false when saveData fails', () => {
            const tracker = new MedicationTracker('test.json');
            const medId = tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');

            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.markAsTaken(medId, 'Test note');

            expect(result).toBe(false);
        });

        test('removeMedication should return false when saveData fails', () => {
            const tracker = new MedicationTracker('test.json');
            const medId = tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');

            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const result = tracker.removeMedication(medId);

            expect(result).toBe(false);
        });
    });

    describe('AWS For Kids - Save Failures', () => {
        test('learn should handle saveData failure gracefully', () => {
            const aws = new AWSForKids('test.json');

            // First call succeeds to add topic to completedLessons
            aws.learn('ec2');

            // Clear previous calls
            consoleLogSpy.mockClear();
            consoleErrorSpy.mockClear();

            // Now make saveData fail
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            // Learn another topic
            aws.learn('s3');

            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('Mental Health Tracker - Edge Cases', () => {
        test('viewJournal should handle no entries', () => {
            const tracker = new MentalHealthTracker('test.json');
            tracker.viewJournal(7);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No journal entries'));
        });

        test('viewJournal should filter by type', () => {
            const tracker = new MentalHealthTracker('test.json');
            tracker.addJournal('Entry 1', 'general');
            tracker.addJournal('Entry 2', 'therapy');

            consoleLogSpy.mockClear();
            tracker.viewJournal(7, 'therapy');

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('viewSymptoms should handle no symptoms', () => {
            const tracker = new MentalHealthTracker('test.json');
            tracker.viewSymptoms(7);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No symptoms'));
        });

        test('viewSymptoms should filter by type', () => {
            const tracker = new MentalHealthTracker('test.json');
            tracker.logSymptom('anxiety', 5, 'Test 1');
            tracker.logSymptom('depression', 6, 'Test 2');

            consoleLogSpy.mockClear();
            tracker.viewSymptoms(7, 'anxiety');

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('listTriggers should handle no triggers', () => {
            const tracker = new MentalHealthTracker('test.json');
            tracker.listTriggers();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No triggers'));
        });

        test('listCopingStrategies should handle no strategies', () => {
            const tracker = new MentalHealthTracker('test.json');
            tracker.listCopingStrategies();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No coping'));
        });

        test('listGoals should show all goals including completed when requested', () => {
            const tracker = new MentalHealthTracker('test.json');
            const goalId = tracker.addGoal('Test goal');
            tracker.completeGoal(goalId);

            consoleLogSpy.mockClear();
            tracker.listGoals('all');

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('listEmergencyContacts should handle no contacts', () => {
            const tracker = new MentalHealthTracker('test.json');
            tracker.listEmergencyContacts();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No emergency'));
        });

        test('completeGoal should handle invalid ID', () => {
            const tracker = new MentalHealthTracker('test.json');
            const result = tracker.completeGoal('invalid-id');

            expect(result).toBe(false);
        });

        test('useCopingStrategy should handle invalid ID', () => {
            const tracker = new MentalHealthTracker('test.json');
            const result = tracker.useCopingStrategy('invalid-id', 5);

            expect(result).toBe(false);
        });

        test('logTriggerOccurrence should handle invalid ID', () => {
            const tracker = new MentalHealthTracker('test.json');
            const result = tracker.logTriggerOccurrence('invalid-id');

            expect(result).toBe(false);
        });
    });

    describe('Medication Tracker - Edge Cases', () => {
        test('listMedications should handle no medications', () => {
            const tracker = new MedicationTracker('test.json');
            tracker.listMedications();

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('checkTodayStatus should handle no medications', () => {
            const tracker = new MedicationTracker('test.json');
            tracker.checkTodayStatus();

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('getHistory should handle no history', () => {
            const tracker = new MedicationTracker('test.json');
            tracker.getHistory();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No history found'));
        });

        test('getHistory should filter by medication ID', () => {
            const tracker = new MedicationTracker('test.json');
            const medId1 = tracker.addMedication('Med1', '100mg', 'daily', '08:00');
            const medId2 = tracker.addMedication('Med2', '200mg', 'daily', '09:00');

            tracker.markAsTaken(medId1, 'Note 1');
            tracker.markAsTaken(medId2, 'Note 2');

            consoleLogSpy.mockClear();
            tracker.getHistory(medId1, 7);

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('markAsTaken should handle invalid ID', () => {
            const tracker = new MedicationTracker('test.json');
            const result = tracker.markAsTaken('invalid-id');

            expect(result).toBe(false);
        });

        test('removeMedication should handle invalid ID', () => {
            const tracker = new MedicationTracker('test.json');
            const result = tracker.removeMedication('invalid-id');

            expect(result).toBe(false);
        });
    });

    describe('AWS For Kids - Edge Cases', () => {
        test('learn should handle invalid topic', () => {
            const aws = new AWSForKids('test.json');
            aws.learn('invalid-topic');

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Topic not found'));
        });

        test('listTopics should filter by category', () => {
            const aws = new AWSForKids('test.json');

            consoleLogSpy.mockClear();
            aws.listTopics('compute');

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('listTopics should show all topics when no category filter', () => {
            const aws = new AWSForKids('test.json');

            consoleLogSpy.mockClear();
            aws.listTopics();

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('learn should track completed lessons', () => {
            const aws = new AWSForKids('test.json');

            expect(aws.data.completedLessons.length).toBe(0);

            aws.learn('ec2');

            expect(aws.data.completedLessons).toContain('ec2');
        });
    });

    describe('Mental Health Tracker - Data Operations', () => {
        test('createBackup should handle non-existent data file', () => {
            const tracker = new MentalHealthTracker('nonexistent.json');
            fs.existsSync.mockImplementation((path) => {
                if (path.includes('nonexistent.json')) return false;
                if (path.includes('backups')) return true;
                return false;
            });
            fs.mkdirSync.mockImplementation(() => {});

            const result = tracker.createBackup('./backups');

            expect(result).toBe(false);
        });

        test('listBackups should handle empty backup directory', () => {
            const tracker = new MentalHealthTracker('test.json');
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue([]);

            tracker.listBackups('./backups');

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No backups'));
        });

        test('restoreFromBackup should handle non-existent backup file', () => {
            const tracker = new MentalHealthTracker('test.json');
            fs.existsSync.mockImplementation((path) => {
                if (path.includes('backup.json')) return false;
                return true;
            });

            const result = tracker.restoreFromBackup('backup.json', './backups');

            expect(result).toBe(false);
        });

        test('exportToCSV should handle write errors', () => {
            const tracker = new MentalHealthTracker('test.json');
            tracker.logMood(7, 'Test');

            fs.mkdirSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            const result = tracker.exportToCSV('./exports');

            expect(result).toBe(false);
        });
    });

    describe('Medication Tracker - Data Operations', () => {
        test('createBackup should handle non-existent data file', () => {
            const tracker = new MedicationTracker('nonexistent.json');
            fs.existsSync.mockImplementation((path) => {
                if (path.includes('nonexistent.json')) return false;
                if (path.includes('backups')) return true;
                return false;
            });

            const result = tracker.createBackup('./backups');

            expect(result).toBe(false);
        });

        test('exportToCSV should handle empty data', () => {
            const tracker = new MedicationTracker('test.json');
            fs.mkdirSync.mockImplementation(() => {});

            const result = tracker.exportToCSV('./exports');

            expect(result).toBe(true);
        });

        test('exportToCSV should handle write errors', () => {
            const tracker = new MedicationTracker('test.json');
            tracker.addMedication('Test', '100mg', 'daily', '08:00');

            fs.mkdirSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            const result = tracker.exportToCSV('./exports');

            expect(result).toBe(false);
        });
    });

    describe('AWS For Kids - Data Operations', () => {
        test('createBackup should handle non-existent data file', () => {
            const aws = new AWSForKids('nonexistent.json');
            fs.existsSync.mockImplementation((path) => {
                if (path.includes('nonexistent.json')) return false;
                if (path.includes('backups')) return true;
                return false;
            });

            const result = aws.createBackup('./backups');

            expect(result).toBe(false);
        });

        test('exportToCSV should handle empty data', () => {
            const aws = new AWSForKids('test.json');
            fs.mkdirSync.mockImplementation(() => {});

            const result = aws.exportToCSV('./exports');

            expect(result).toBe(true);
        });
    });

    describe('Mental Health Tracker - Rating Distribution Coverage', () => {
        test('should correctly categorize all mood rating ranges', () => {
            const tracker = new MentalHealthTracker('test.json');

            // Test all rating ranges
            tracker.logMood(1, 'Very low');    // 1-2 range
            tracker.logMood(2, 'Low');         // 1-2 range
            tracker.logMood(3, 'Below avg');   // 3-4 range
            tracker.logMood(4, 'Slightly low'); // 3-4 range
            tracker.logMood(5, 'Average');     // 5-6 range
            tracker.logMood(6, 'OK');          // 5-6 range
            tracker.logMood(7, 'Good');        // 7-8 range
            tracker.logMood(8, 'Very good');   // 7-8 range
            tracker.logMood(9, 'Great');       // 9-10 range
            tracker.logMood(10, 'Excellent');  // 9-10 range

            expect(tracker.data.moodEntries.length).toBe(10);

            // Verify each rating was recorded
            expect(tracker.data.moodEntries.some(e => e.rating === 1)).toBe(true);
            expect(tracker.data.moodEntries.some(e => e.rating === 5)).toBe(true);
            expect(tracker.data.moodEntries.some(e => e.rating === 10)).toBe(true);
        });

        test('logMood should handle note parameter correctly', () => {
            const tracker = new MentalHealthTracker('test.json');

            // With note
            tracker.logMood(7, 'Feeling good');
            expect(tracker.data.moodEntries[0].note).toBe('Feeling good');

            // Without note (empty string)
            tracker.logMood(8);
            expect(tracker.data.moodEntries[1].note).toBe('');
        });
    });

    describe('Medication Tracker - Additional Coverage', () => {
        test('should handle multiple medications with different frequencies', () => {
            const tracker = new MedicationTracker('test.json');

            tracker.addMedication('Daily Med', '100mg', 'daily', '08:00');
            tracker.addMedication('Twice Daily Med', '200mg', 'twice-daily', '08:00,20:00');

            const medications = tracker.data.medications;
            expect(medications.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('AWS For Kids - Additional Coverage', () => {
        test('learn should not duplicate completedLessons', () => {
            const aws = new AWSForKids('test.json');

            aws.learn('ec2');
            expect(aws.data.completedLessons.length).toBe(1);

            // Learn same topic again
            aws.learn('ec2');
            expect(aws.data.completedLessons.length).toBe(1);
        });

        test('listTopics should handle case-insensitive category filter', () => {
            const aws = new AWSForKids('test.json');

            consoleLogSpy.mockClear();
            aws.listTopics('COMPUTE');

            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });
});
