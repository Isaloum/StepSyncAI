const fs = require('fs');
const DailyDashboard = require('../daily-dashboard');
const AnalyticsEngine = require('../analytics-engine');
const BackupManager = require('../backup-manager');
const GoalManager = require('../goal-manager');
const ReminderManager = require('../reminder-manager');
const MentalHealthTracker = require('../mental-health-tracker');
const MedicationTracker = require('../medication-tracker');
const SleepTracker = require('../sleep-tracker');
const ExerciseTracker = require('../exercise-tracker');

// Mock fs module
jest.mock('fs');

/**
 * Expanded Error Scenario Testing
 *
 * Tests various failure modes and edge cases:
 * - Corrupted data handling
 * - Invalid inputs
 * - Resource exhaustion
 * - Concurrent operation conflicts
 * - Network/IO failures
 * - Data validation errors
 */
describe('CLI Error Scenarios', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue(JSON.stringify({}));
        fs.writeFileSync.mockImplementation(() => {});
        fs.readdirSync.mockReturnValue([]);
        fs.mkdirSync.mockImplementation(() => {});
        fs.unlinkSync.mockImplementation(() => {});
        fs.statSync.mockReturnValue({ size: 1024, mtime: new Date() });

        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Corrupted Data Handling', () => {
        test('should handle corrupted JSON gracefully', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{ invalid json }');

            expect(() => {
                const dashboard = new DailyDashboard();
            }).not.toThrow();

            // Should fall back to empty data
            const dashboard = new DailyDashboard();
            expect(dashboard.mentalHealth.data).toBeDefined();
        });

        test('should recover from missing required fields', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                moodLogs: [{ rating: 5 }] // Missing timestamp
            }));

            expect(() => {
                const tracker = new MentalHealthTracker();
                tracker.viewMoodHistory(7);
            }).not.toThrow();
        });

        test('should handle null values in data arrays', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                moodLogs: [null, { rating: 5, timestamp: new Date().toISOString() }, null]
            }));

            const tracker = new MentalHealthTracker();
            expect(() => {
                tracker.viewMoodHistory(7);
            }).not.toThrow();
        });

        test('should handle undefined properties gracefully', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Try to analyze with completely empty data
            expect(() => {
                analytics.analyzeWellnessTrends(30);
                analytics.analyzeMoodSleepCorrelation(30);
                analytics.analyzeSleepExerciseCorrelation(30);
            }).not.toThrow();
        });
    });

    describe('Invalid Input Validation', () => {
        test('should reject invalid mood ratings', () => {
            const tracker = new MentalHealthTracker();

            // Below 1 - returns false
            expect(tracker.logMood(0, 'Too low')).toBe(false);
            expect(tracker.data.moodEntries.length).toBe(0);

            // Above 10 - returns false
            expect(tracker.logMood(11, 'Too high')).toBe(false);
            expect(tracker.data.moodEntries.length).toBe(0);

            // Not a number - NaN becomes invalid after parseInt
            const result = tracker.logMood('seven', 'Not a number');
            expect(result).toBe(false);
            expect(tracker.data.moodEntries.length).toBe(0);
        });

        test('should reject invalid sleep quality ratings', () => {
            const tracker = new SleepTracker();

            const sleepStart = new Date('2025-12-01T22:00');
            const sleepEnd = new Date('2025-12-02T06:00');

            // Below 1 - returns null
            expect(tracker.logSleep(sleepStart, sleepEnd, 0)).toBe(null);

            // Above 10 - returns null
            expect(tracker.logSleep(sleepStart, sleepEnd, 11)).toBe(null);
        });

        test('should reject invalid sleep times', () => {
            const tracker = new SleepTracker();

            const sleepStart = new Date('2025-12-02T06:00');
            const sleepEnd = new Date('2025-12-01T22:00'); // End before start

            // Invalid time order - returns null due to validation
            const result = tracker.logSleep(sleepStart, sleepEnd, 7);
            expect(result).toBe(null);
        });

        test('should reject invalid exercise data', () => {
            const tracker = new ExerciseTracker();

            // Empty type - returns false
            expect(tracker.logExercise('', 30, 'moderate', 'Notes')).toBe(false);

            // Negative duration - returns false
            expect(tracker.logExercise('Running', -10, 'moderate', 'Notes')).toBe(false);

            // Invalid intensity - returns false
            expect(tracker.logExercise('Running', 30, 'invalid-intensity', 'Notes')).toBe(false);
        });

        test('should reject invalid medication data', () => {
            const tracker = new MedicationTracker();

            // Empty name - returns false
            expect(tracker.addMedication('', '10mg', 'daily', '08:00')).toBe(false);

            // Empty dosage - returns false
            expect(tracker.addMedication('Med', '', 'daily', '08:00')).toBe(false);

            // Invalid frequency - returns false
            expect(tracker.addMedication('Med', '10mg', 'invalid', '08:00')).toBe(false);
        });

        test('should reject invalid goal data', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            expect(() => {
                goalManager.createGoal({
                    type: 'invalid-type',
                    title: 'Test',
                    description: 'Test',
                    target: 10,
                    duration: 7
                });
            }).toThrow();

            expect(() => {
                goalManager.createGoal({
                    type: 'exercise',
                    title: '',
                    description: 'Test',
                    target: 10,
                    duration: 7
                });
            }).toThrow();

            expect(() => {
                goalManager.createGoal({
                    type: 'exercise',
                    title: 'Test',
                    description: 'Test',
                    target: -10,
                    duration: 7
                });
            }).toThrow();
        });
    });

    describe('Boundary Conditions', () => {
        test('should handle maximum string lengths', () => {
            const tracker = new MentalHealthTracker();
            const longString = 'a'.repeat(10000); // 10k characters

            expect(() => {
                tracker.logMood(5, longString);
            }).not.toThrow();
        });

        test('should handle very large datasets', () => {
            const dashboard = new DailyDashboard();

            // Add 1000 entries
            for (let i = 0; i < 1000; i++) {
                dashboard.mentalHealth.logMood(5 + (i % 5), `Entry ${i}`);
            }

            expect(dashboard.mentalHealth.data.moodLogs.length).toBe(1000);

            // Analytics should still work
            const analytics = new AnalyticsEngine(dashboard);
            expect(() => {
                analytics.analyzeWellnessTrends(1000);
            }).not.toThrow();
        });

        test('should handle date extremes', () => {
            const tracker = new SleepTracker();

            // Very old date
            const oldStart = new Date('2000-01-01T22:00');
            const oldEnd = new Date('2000-01-02T06:00');

            expect(() => {
                tracker.logSleep(oldStart, oldEnd, 7);
            }).not.toThrow();

            // Future date
            const futureStart = new Date('2099-12-31T22:00');
            const futureEnd = new Date('2100-01-01T06:00');

            expect(() => {
                tracker.logSleep(futureStart, futureEnd, 7);
            }).not.toThrow();
        });

        test('should handle empty strings', () => {
            const tracker = new ExerciseTracker();

            expect(() => {
                tracker.logExercise('Walking', 30, 'moderate', ''); // Empty notes OK
            }).not.toThrow();
        });

        test('should handle zero duration exercise', () => {
            const tracker = new ExerciseTracker();

            expect(() => {
                tracker.logExercise('Stretching', 0, 'light', 'Quick stretch');
            }).toThrow(); // Should reject zero duration
        });
    });

    describe('Concurrent Operations', () => {
        test('should handle simultaneous mood logging', () => {
            const tracker = new MentalHealthTracker();

            const operations = [];
            for (let i = 0; i < 10; i++) {
                operations.push(() => tracker.logMood(5 + (i % 5), `Concurrent ${i}`));
            }

            expect(() => {
                operations.forEach(op => op());
            }).not.toThrow();

            expect(tracker.data.moodLogs.length).toBe(10);
        });

        test('should handle simultaneous backup operations', () => {
            const backup = new BackupManager();

            const operations = [];
            for (let i = 0; i < 5; i++) {
                operations.push(() => backup.createBackup({
                    description: `Concurrent ${i}`,
                    tags: ['concurrent']
                }));
            }

            let results;
            expect(() => {
                results = operations.map(op => op());
            }).not.toThrow();

            expect(results.every(r => r.success)).toBe(true);
        });

        test('should handle simultaneous goal updates', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            const goal = goalManager.createGoal({
                type: 'exercise',
                title: 'Test',
                description: 'Test',
                target: 100,
                duration: 30
            });

            const todayData = { exercise: { count: 1, duration: 30 } };

            // Update same goal multiple times
            expect(() => {
                for (let i = 0; i < 10; i++) {
                    goalManager.updateProgress(goal.id, todayData);
                }
            }).not.toThrow();
        });
    });

    describe('Resource Exhaustion', () => {
        test('should handle file write failures', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('ENOSPC: no space left on device');
            });

            const tracker = new MentalHealthTracker();

            // Should catch error and return false
            const result = tracker.saveData();
            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('should handle file read failures', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => {
                throw new Error('EACCES: permission denied');
            });

            // Should fall back to empty data
            expect(() => {
                const tracker = new MentalHealthTracker();
            }).not.toThrow();
        });

        test('should handle directory creation failures', () => {
            fs.mkdirSync.mockImplementation(() => {
                throw new Error('EACCES: permission denied');
            });

            const backup = new BackupManager();

            // Should handle gracefully
            const result = backup.createBackup({
                description: 'Test',
                tags: []
            });

            // Might fail, but shouldn't crash
            expect(result).toHaveProperty('success');
        });
    });

    describe('Data Integrity', () => {
        test('should detect and reject duplicate IDs', () => {
            const tracker = new MedicationTracker();

            const med1 = tracker.addMedication('Med1', '10mg', 'daily', '08:00');
            const med2 = tracker.addMedication('Med2', '20mg', 'daily', '09:00');

            // IDs should be unique
            expect(med1.id).not.toBe(med2.id);
        });

        test('should maintain data consistency after errors', () => {
            const tracker = new MentalHealthTracker();

            // Add valid data
            tracker.logMood(7, 'Good');
            const initialCount = tracker.data.moodLogs.length;

            // Try to add invalid data
            try {
                tracker.logMood(15, 'Invalid'); // Should throw
            } catch (e) {
                // Expected
            }

            // Original data should be unchanged
            expect(tracker.data.moodLogs.length).toBe(initialCount);
        });

        test('should prevent data loss on save failure', () => {
            const tracker = new MentalHealthTracker();

            // Add data
            tracker.logMood(7, 'Test');
            const originalData = { ...tracker.data };

            // Simulate save failure
            fs.writeFileSync.mockImplementationOnce(() => {
                throw new Error('Write failed');
            });

            tracker.saveData();

            // Data should still be in memory
            expect(tracker.data.moodLogs.length).toBe(originalData.moodLogs.length);
        });
    });

    describe('Edge Cases in Analytics', () => {
        test('should handle single data point', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            dashboard.mentalHealth.logMood(7, 'Only one');

            expect(() => {
                analytics.analyzeWellnessTrends(30);
            }).not.toThrow();
        });

        test('should handle all identical values', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add 30 identical mood entries
            for (let i = 0; i < 30; i++) {
                dashboard.mentalHealth.logMood(7, 'Same every day');
            }

            const trends = analytics.analyzeWellnessTrends(30);
            expect(trends).toBeDefined();
        });

        test('should handle gaps in data', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add data with gaps (only even days)
            for (let i = 0; i < 30; i += 2) {
                dashboard.mentalHealth.logMood(6, `Day ${i}`);
            }

            expect(() => {
                analytics.analyzeWellnessTrends(30);
            }).not.toThrow();
        });

        test('should handle extreme outliers', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add mostly normal data with extreme outliers
            for (let i = 0; i < 27; i++) {
                dashboard.mentalHealth.logMood(7, 'Normal');
            }
            dashboard.mentalHealth.logMood(1, 'Very low');
            dashboard.mentalHealth.logMood(1, 'Very low');
            dashboard.mentalHealth.logMood(10, 'Very high');

            const trends = analytics.analyzeWellnessTrends(30);
            expect(trends).toBeDefined();
            expect(trends.anomalyDetails).toBeDefined();
        });
    });

    describe('Backup Error Scenarios', () => {
        test('should handle corrupted backup manifest', () => {
            const backup = new BackupManager();

            const result = backup.createBackup({ description: 'Test' });
            const backupId = result.backupId;

            // Corrupt the manifest
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{ corrupted }');

            const verifyResult = backup.verifyBackup(backupId);
            expect(verifyResult.valid).toBe(false);
        });

        test('should handle missing backup files', () => {
            const backup = new BackupManager();

            const result = backup.createBackup({ description: 'Test' });
            const backupId = result.backupId;

            // Simulate missing backup directory
            fs.existsSync.mockReturnValue(false);

            const verifyResult = backup.verifyBackup(backupId);
            expect(verifyResult.valid).toBe(false);
        });

        test('should handle restore of non-existent backup', () => {
            const backup = new BackupManager();

            fs.existsSync.mockReturnValue(false);

            const restoreResult = backup.restore('non-existent-backup-id');
            expect(restoreResult.success).toBe(false);
            expect(restoreResult.message).toContain('not found');
        });

        test('should handle cleanup with protected backups', () => {
            const backup = new BackupManager();

            // Create protected backups
            for (let i = 0; i < 10; i++) {
                backup.createBackup({
                    description: `Protected ${i}`,
                    tags: ['important']
                });
            }

            const cleanupResult = backup.cleanupOldBackups();

            // All should be protected and kept
            expect(cleanupResult.kept).toBeGreaterThan(0);
        });
    });

    describe('Goal Manager Error Scenarios', () => {
        test('should handle missing dashboard data', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            const goal = goalManager.createGoal({
                type: 'exercise',
                title: 'Test',
                description: 'Test',
                target: 10,
                duration: 7
            });

            // Update with empty/missing data
            expect(() => {
                goalManager.updateProgress(goal.id, {});
            }).not.toThrow();
        });

        test('should handle archived goal operations', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            const goal = goalManager.createGoal({
                type: 'exercise',
                title: 'Test',
                description: 'Test',
                target: 10,
                duration: 7
            });

            goalManager.archiveGoal(goal.id);

            // Try to update archived goal
            expect(() => {
                goalManager.updateProgress(goal.id, { exercise: { count: 1 } });
            }).toThrow();
        });

        test('should handle duplicate goal deletion', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            const goal = goalManager.createGoal({
                type: 'exercise',
                title: 'Test',
                description: 'Test',
                target: 10,
                duration: 7
            });

            // Delete once
            goalManager.deleteGoal(goal.id);

            // Try to delete again
            expect(() => {
                goalManager.deleteGoal(goal.id);
            }).toThrow();
        });
    });

    describe('Reminder Manager Error Scenarios', () => {
        test('should handle invalid time formats', () => {
            const reminderManager = new ReminderManager();

            expect(() => {
                reminderManager.createReminder({
                    type: 'medication',
                    title: 'Test',
                    message: 'Test',
                    time: '25:00', // Invalid hour
                    days: 'daily'
                });
            }).not.toThrow(); // Should handle gracefully
        });

        test('should handle duplicate reminder dismissal', () => {
            const reminderManager = new ReminderManager();

            const reminder = reminderManager.createReminder({
                type: 'medication',
                title: 'Test',
                message: 'Test',
                time: '08:00',
                days: 'daily'
            });

            // Dismiss once
            reminderManager.dismissReminder(reminder.id);

            // Try to dismiss again
            expect(() => {
                reminderManager.dismissReminder(reminder.id);
            }).toThrow('Reminder not found');
        });

        test('should handle excessive snooze duration', () => {
            const reminderManager = new ReminderManager();

            const reminder = reminderManager.createReminder({
                type: 'medication',
                title: 'Test',
                message: 'Test',
                time: '08:00',
                days: 'daily'
            });

            // Snooze for very long time
            expect(() => {
                reminderManager.snoozeReminder(reminder.id, 99999);
            }).not.toThrow();
        });
    });

    describe('Integration Error Scenarios', () => {
        test('should recover from cascading failures', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write failed');
            });

            const dashboard = new DailyDashboard();

            // Try multiple operations
            dashboard.mentalHealth.logMood(7, 'Test');
            dashboard.medication.addMedication('Med', '10mg', 'daily', '08:00');
            dashboard.sleep.logSleep(
                new Date('2025-12-01T22:00'),
                new Date('2025-12-02T06:00'),
                7
            );

            // Data should be in memory even if writes fail
            expect(dashboard.mentalHealth.data.moodLogs.length).toBeGreaterThan(0);
            expect(dashboard.medication.data.medications.length).toBeGreaterThan(0);
            expect(dashboard.sleep.data.sleepEntries.length).toBeGreaterThan(0);
        });

        test('should handle mixed valid and invalid operations', () => {
            const tracker = new MentalHealthTracker();

            let successCount = 0;
            let errorCount = 0;

            // Mix of valid and invalid operations
            const operations = [
                () => tracker.logMood(7, 'Valid'),
                () => tracker.logMood(15, 'Invalid'),
                () => tracker.logMood(5, 'Valid'),
                () => tracker.logMood(-1, 'Invalid'),
                () => tracker.logMood(8, 'Valid')
            ];

            operations.forEach(op => {
                try {
                    op();
                    successCount++;
                } catch (e) {
                    errorCount++;
                }
            });

            expect(successCount).toBe(3);
            expect(errorCount).toBe(2);
            expect(tracker.data.moodLogs.length).toBe(3);
        });
    });
});
