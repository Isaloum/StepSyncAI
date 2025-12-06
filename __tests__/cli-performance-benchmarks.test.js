const fs = require('fs');
const DailyDashboard = require('../daily-dashboard');
const AnalyticsEngine = require('../analytics-engine');
const BackupManager = require('../backup-manager');
const GoalManager = require('../goal-manager');
const ReminderManager = require('../reminder-manager');
const ExportManager = require('../export-manager');

// Mock fs module
jest.mock('fs');

// Increase timeout for performance tests
jest.setTimeout(30000);

/**
 * Performance Benchmarks for CLI Operations
 *
 * These tests measure performance characteristics to:
 * - Establish baseline metrics
 * - Detect performance regressions
 * - Identify bottlenecks
 * - Validate scalability
 */
describe('CLI Performance Benchmarks', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue(JSON.stringify({}));
        fs.writeFileSync.mockImplementation(() => {});
        fs.readdirSync.mockReturnValue([]);
        fs.mkdirSync.mockImplementation(() => {});
        fs.statSync.mockReturnValue({ size: 1024, mtime: new Date() });

        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Analytics Performance', () => {
        test('should analyze trends with small dataset (30 days) in < 100ms', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add 30 days of data
            for (let i = 0; i < 30; i++) {
                dashboard.mentalHealth.logMood(5 + (i % 5), `Day ${i + 1}`);
            }

            const startTime = performance.now();
            const trends = analytics.analyzeWellnessTrends(30);
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(trends).toBeDefined();
            expect(duration).toBeLessThan(100); // Should complete in < 100ms
        });

        test('should analyze trends with medium dataset (90 days) in < 300ms', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add 90 days of data
            for (let i = 0; i < 90; i++) {
                dashboard.mentalHealth.logMood(5 + (i % 5), `Day ${i + 1}`);

                const sleepStart = new Date();
                sleepStart.setDate(sleepStart.getDate() - i);
                sleepStart.setHours(22, 0, 0, 0);

                const sleepEnd = new Date(sleepStart);
                sleepEnd.setHours(6, 0, 0, 0);
                sleepEnd.setDate(sleepEnd.getDate() + 1);

                dashboard.sleep.logSleep(sleepStart, sleepEnd, 7 + (i % 2));
                dashboard.exercise.logExercise('Running', 30, 'moderate', 'Daily run');
            }

            const startTime = performance.now();
            const trends = analytics.analyzeWellnessTrends(90);
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(trends).toBeDefined();
            expect(duration).toBeLessThan(300); // Should complete in < 300ms
        });

        test('should calculate correlations with 60 data points in < 50ms', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add correlated data
            for (let i = 0; i < 60; i++) {
                dashboard.mentalHealth.logMood(6 + (i % 4), `Day ${i + 1}`);

                const sleepStart = new Date();
                sleepStart.setDate(sleepStart.getDate() - i);
                sleepStart.setHours(22, 0, 0, 0);

                const sleepEnd = new Date(sleepStart);
                sleepEnd.setHours(6, 0, 0, 0);
                sleepEnd.setDate(sleepEnd.getDate() + 1);

                dashboard.sleep.logSleep(sleepStart, sleepEnd, 7 + (i % 2));
            }

            const startTime = performance.now();
            const correlation = analytics.analyzeMoodSleepCorrelation(60);
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(correlation).toBeDefined();
            expect(duration).toBeLessThan(50); // Should complete in < 50ms
        });

        test('should generate dashboard display for 30 days in < 200ms', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add comprehensive data
            for (let i = 0; i < 30; i++) {
                dashboard.mentalHealth.logMood(6, 'Good');
                dashboard.medication.addMedication(`Med${i}`, '10mg', 'daily', '08:00');

                const sleepStart = new Date();
                sleepStart.setDate(sleepStart.getDate() - i);
                sleepStart.setHours(22, 0, 0, 0);

                const sleepEnd = new Date(sleepStart);
                sleepEnd.setHours(6, 0, 0, 0);
                sleepEnd.setDate(sleepEnd.getDate() + 1);

                dashboard.sleep.logSleep(sleepStart, sleepEnd, 7);
                dashboard.exercise.logExercise('Running', 30, 'moderate', 'Run');
            }

            const startTime = performance.now();
            analytics.displayDashboard(30);
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(200); // Should complete in < 200ms
        });
    });

    describe('Backup Performance', () => {
        test('should create backup in < 100ms', () => {
            const backup = new BackupManager();

            const startTime = performance.now();
            const result = backup.createBackup({
                description: 'Performance test backup',
                tags: ['performance']
            });
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(result.success).toBe(true);
            expect(duration).toBeLessThan(100); // Should complete in < 100ms
        });

        test('should list 50 backups in < 50ms', () => {
            const backup = new BackupManager();

            // Create 50 backups
            for (let i = 0; i < 50; i++) {
                backup.createBackup({
                    description: `Backup ${i}`,
                    tags: ['test']
                });
            }

            const startTime = performance.now();
            const backups = backup.listBackups({ limit: 50 });
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(backups.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(50); // Should complete in < 50ms
        });

        test('should verify backup integrity in < 100ms', () => {
            const backup = new BackupManager();

            const createResult = backup.createBackup({
                description: 'Test backup',
                tags: ['test']
            });

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                timestamp: new Date().toISOString(),
                files: {}
            }));

            const startTime = performance.now();
            const verifyResult = backup.verifyBackup(createResult.backupId);
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(verifyResult).toHaveProperty('valid');
            expect(duration).toBeLessThan(100); // Should complete in < 100ms
        });

        test('should cleanup old backups in < 200ms', () => {
            const backup = new BackupManager();

            // Create multiple old backups
            for (let i = 0; i < 20; i++) {
                backup.createBackup({
                    description: `Old backup ${i}`,
                    tags: []
                });
            }

            const startTime = performance.now();
            const result = backup.cleanupOldBackups();
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(result).toBeDefined();
            expect(duration).toBeLessThan(200); // Should complete in < 200ms
        });
    });

    describe('Goal Manager Performance', () => {
        test('should create goal in < 10ms', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            const startTime = performance.now();
            const goal = goalManager.createGoal({
                type: 'exercise',
                title: 'Performance test goal',
                description: 'Test',
                target: 100,
                duration: 30
            });
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(goal).toBeDefined();
            expect(duration).toBeLessThan(10); // Should complete in < 10ms
        });

        test('should update progress for 100 goals in < 500ms', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            // Create 100 goals
            const goals = [];
            for (let i = 0; i < 100; i++) {
                goals.push(goalManager.createGoal({
                    type: 'exercise',
                    title: `Goal ${i}`,
                    description: 'Test',
                    target: 10,
                    duration: 7
                }));
            }

            const todayData = {
                exercise: { count: 1, duration: 30 }
            };

            const startTime = performance.now();
            goals.forEach(goal => {
                goalManager.updateProgress(goal.id, todayData);
            });
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(500); // Should complete in < 500ms
            expect(duration / 100).toBeLessThan(5); // Average < 5ms per goal
        });

        test('should get statistics for 200 goals in < 50ms', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            // Create 200 goals
            for (let i = 0; i < 200; i++) {
                goalManager.createGoal({
                    type: i % 2 === 0 ? 'exercise' : 'mood',
                    title: `Goal ${i}`,
                    description: 'Test',
                    target: 10,
                    duration: 7
                });
            }

            const startTime = performance.now();
            const stats = goalManager.getStats();
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(stats).toBeDefined();
            expect(stats.total).toBe(200);
            expect(duration).toBeLessThan(50); // Should complete in < 50ms
        });
    });

    describe('Reminder Manager Performance', () => {
        test('should create reminder in < 10ms', () => {
            const reminderManager = new ReminderManager();

            const startTime = performance.now();
            const reminder = reminderManager.createReminder({
                type: 'medication',
                title: 'Performance test',
                message: 'Test message',
                time: '08:00',
                days: 'daily'
            });
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(reminder).toBeDefined();
            expect(duration).toBeLessThan(10); // Should complete in < 10ms
        });

        test('should list 500 reminders in < 50ms', () => {
            const reminderManager = new ReminderManager();

            // Create 500 reminders
            for (let i = 0; i < 500; i++) {
                reminderManager.createReminder({
                    type: 'medication',
                    title: `Reminder ${i}`,
                    message: 'Test',
                    time: '08:00',
                    days: 'daily'
                });
            }

            const startTime = performance.now();
            const reminders = reminderManager.getReminders();
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(reminders.length).toBe(500);
            expect(duration).toBeLessThan(50); // Should complete in < 50ms
        });

        test('should check due reminders for 1000 reminders in < 100ms', () => {
            const reminderManager = new ReminderManager();

            // Create 1000 reminders
            for (let i = 0; i < 1000; i++) {
                reminderManager.createReminder({
                    type: 'medication',
                    title: `Reminder ${i}`,
                    message: 'Test',
                    time: '08:00',
                    days: 'daily'
                });
            }

            const startTime = performance.now();
            const dueReminders = reminderManager.getDueReminders();
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(Array.isArray(dueReminders)).toBe(true);
            expect(duration).toBeLessThan(100); // Should complete in < 100ms
        });
    });

    describe('Export Performance', () => {
        test('should export 30 days of data to CSV in < 200ms', () => {
            const dashboard = new DailyDashboard();
            const exportManager = new ExportManager(dashboard);

            // Add 30 days of data
            for (let i = 0; i < 30; i++) {
                dashboard.mentalHealth.logMood(6, 'Good');
                const sleepStart = new Date();
                sleepStart.setDate(sleepStart.getDate() - i);
                sleepStart.setHours(22, 0, 0, 0);

                const sleepEnd = new Date(sleepStart);
                sleepEnd.setHours(6, 0, 0, 0);
                sleepEnd.setDate(sleepEnd.getDate() + 1);

                dashboard.sleep.logSleep(sleepStart, sleepEnd, 7);
                dashboard.exercise.logExercise('Running', 30, 'moderate', 'Run');
            }

            const startTime = performance.now();
            exportManager.exportToCSV(30);
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(200); // Should complete in < 200ms
        });

        test('should export complete backup in < 300ms', () => {
            const dashboard = new DailyDashboard();
            const exportManager = new ExportManager(dashboard);

            // Add comprehensive data
            for (let i = 0; i < 30; i++) {
                dashboard.mentalHealth.logMood(6, 'Good');
                dashboard.medication.addMedication(`Med${i}`, '10mg', 'daily', '08:00');
            }

            const startTime = performance.now();
            exportManager.exportCompleteBackup();
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(300); // Should complete in < 300ms
        });
    });

    describe('Batch Operations Performance', () => {
        test('should process 100 mood entries in < 100ms', () => {
            const dashboard = new DailyDashboard();

            const startTime = performance.now();
            for (let i = 0; i < 100; i++) {
                dashboard.mentalHealth.logMood(5 + (i % 5), `Mood ${i}`);
            }
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(dashboard.mentalHealth.data.moodLogs.length).toBe(100);
            expect(duration).toBeLessThan(100); // Should complete in < 100ms
            expect(duration / 100).toBeLessThan(1); // Average < 1ms per entry
        });

        test('should process 50 sleep entries in < 100ms', () => {
            const dashboard = new DailyDashboard();

            const startTime = performance.now();
            for (let i = 0; i < 50; i++) {
                const sleepStart = new Date();
                sleepStart.setDate(sleepStart.getDate() - i);
                sleepStart.setHours(22, 0, 0, 0);

                const sleepEnd = new Date(sleepStart);
                sleepEnd.setHours(6, 0, 0, 0);
                sleepEnd.setDate(sleepEnd.getDate() + 1);

                dashboard.sleep.logSleep(sleepStart, sleepEnd, 7 + (i % 2));
            }
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(dashboard.sleep.data.sleepEntries.length).toBe(50);
            expect(duration).toBeLessThan(100); // Should complete in < 100ms
        });

        test('should process 200 exercise entries in < 200ms', () => {
            const dashboard = new DailyDashboard();

            const startTime = performance.now();
            for (let i = 0; i < 200; i++) {
                dashboard.exercise.logExercise('Running', 30 + (i % 30), 'moderate', 'Run');
            }
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(dashboard.exercise.data.exercises.length).toBe(200);
            expect(duration).toBeLessThan(200); // Should complete in < 200ms
            expect(duration / 200).toBeLessThan(1); // Average < 1ms per entry
        });
    });

    describe('Memory Efficiency', () => {
        test('should handle 365 days of comprehensive data efficiently', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add 1 year of data
            for (let i = 0; i < 365; i++) {
                dashboard.mentalHealth.logMood(5 + (i % 5), `Day ${i + 1}`);

                const sleepStart = new Date();
                sleepStart.setDate(sleepStart.getDate() - i);
                sleepStart.setHours(22, 0, 0, 0);

                const sleepEnd = new Date(sleepStart);
                sleepEnd.setHours(6, 0, 0, 0);
                sleepEnd.setDate(sleepEnd.getDate() + 1);

                dashboard.sleep.logSleep(sleepStart, sleepEnd, 7 + (i % 2));
                dashboard.exercise.logExercise('Activity', 30 + (i % 30), 'moderate', 'Daily');
            }

            // Verify data integrity
            expect(dashboard.mentalHealth.data.moodLogs.length).toBe(365);
            expect(dashboard.sleep.data.sleepEntries.length).toBe(365);
            expect(dashboard.exercise.data.exercises.length).toBe(365);

            // Analytics should still be fast
            const startTime = performance.now();
            const trends = analytics.analyzeWellnessTrends(365);
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(trends).toBeDefined();
            expect(duration).toBeLessThan(500); // Should complete in < 500ms even with 1 year
        });

        test('should handle 1000 goals without performance degradation', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            const startTime = performance.now();
            goalManager.beginBatch(); // Use batch mode for bulk operations
            for (let i = 0; i < 1000; i++) {
                goalManager.createGoal({
                    type: i % 2 === 0 ? 'exercise' : 'mood',
                    title: `Goal ${i}`,
                    description: 'Test',
                    target: 10,
                    duration: 7
                });
            }
            goalManager.endBatch(); // Commit all changes at once
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(goalManager.goals.length).toBe(1000);
            expect(duration).toBeLessThan(1000); // Should complete in < 1s
            expect(duration / 1000).toBeLessThan(1); // Average < 1ms per goal
        });
    });

    describe('Scalability Benchmarks', () => {
        test('should maintain linear performance scaling for analytics', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            const datasetSizes = [10, 30, 60, 90];
            const timings = [];

            datasetSizes.forEach(size => {
                // Clear previous data
                dashboard.mentalHealth.data.moodLogs = [];

                // Add data
                for (let i = 0; i < size; i++) {
                    dashboard.mentalHealth.logMood(5 + (i % 5), `Day ${i + 1}`);
                }

                // Measure
                const startTime = performance.now();
                analytics.analyzeWellnessTrends(size);
                const endTime = performance.now();
                timings.push(endTime - startTime);
            });

            // Verify roughly linear scaling (90 days shouldn't take 9x longer than 10 days)
            const ratio = timings[3] / timings[0]; // 90 days / 10 days
            expect(ratio).toBeLessThan(15); // Should be less than 15x slower
        });

        test('should maintain constant-time goal lookup', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            // Create varying numbers of goals
            const goalCounts = [10, 100, 500, 1000];
            const timings = [];

            goalCounts.forEach(count => {
                // Create goals
                const goals = [];
                for (let i = 0; i < count; i++) {
                    goals.push(goalManager.createGoal({
                        type: 'exercise',
                        title: `Goal ${i}`,
                        description: 'Test',
                        target: 10,
                        duration: 7
                    }));
                }

                // Measure lookup time
                const targetGoal = goals[Math.floor(count / 2)];
                const startTime = performance.now();
                const found = goalManager.getGoal(targetGoal.id);
                const endTime = performance.now();
                timings.push(endTime - startTime);

                expect(found).toBeDefined();
            });

            // Lookup time should be roughly constant regardless of goal count
            const maxTiming = Math.max(...timings);
            const minTiming = Math.min(...timings);
            expect(maxTiming / minTiming).toBeLessThan(10); // Within 10x variance
        });
    });
});
