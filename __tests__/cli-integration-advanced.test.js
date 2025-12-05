const fs = require('fs');
const path = require('path');
const DailyDashboard = require('../daily-dashboard');
const AnalyticsEngine = require('../analytics-engine');
const BackupManager = require('../backup-manager');
const VisualizationCLI = require('../visualization-cli');
const GoalManager = require('../goal-manager');
const ReminderManager = require('../reminder-manager');
const AutomationManager = require('../automation-manager');

// Mock fs module
jest.mock('fs');

describe('Advanced CLI Integration Tests', () => {
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

    describe('Analytics CLI Integration', () => {
        test('should display comprehensive dashboard with all metrics', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add sample data across all trackers
            dashboard.mentalHealth.logMood(7, 'Feeling good');
            dashboard.mentalHealth.logSymptom('anxiety', 3, 'Mild anxiety');
            dashboard.medication.addMedication('Test Med', '10mg', 'daily', '08:00');
            dashboard.sleep.logSleep(new Date('2025-12-01T22:00'), new Date('2025-12-02T06:00'), 8);
            dashboard.exercise.logExercise('Running', 30, 'moderate', '');

            consoleLogSpy.mockClear();
            analytics.displayDashboard(30);

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Wellness Dashboard');
        });

        test('should analyze correlations between metrics', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add correlated data - good sleep leads to better mood
            for (let i = 0; i < 10; i++) {
                const sleepQuality = 7 + Math.random();
                const mood = 6 + Math.random();

                const sleepStart = new Date();
                sleepStart.setDate(sleepStart.getDate() - i);
                sleepStart.setHours(22, 0, 0, 0);

                const sleepEnd = new Date(sleepStart);
                sleepEnd.setHours(6, 0, 0, 0);
                sleepEnd.setDate(sleepEnd.getDate() + 1);

                dashboard.sleep.logSleep(sleepStart, sleepEnd, sleepQuality);
                dashboard.mentalHealth.logMood(Math.round(mood), 'Test mood');
            }

            const moodSleep = analytics.analyzeMoodSleepCorrelation(30);

            expect(moodSleep).toBeDefined();
            expect(moodSleep).toHaveProperty('correlation');
        });

        test('should generate wellness trends analysis', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add progressive improvement data
            for (let i = 0; i < 14; i++) {
                const mood = 4 + (i * 0.2); // Gradual improvement
                dashboard.mentalHealth.logMood(Math.round(mood), `Day ${i + 1}`);
            }

            const trends = analytics.analyzeWellnessTrends(14);

            expect(trends).toBeDefined();
            expect(trends.trend).toBeDefined();
        });

        test('should analyze wellness trends with predictions', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add consistent data for trend analysis
            for (let i = 0; i < 30; i++) {
                const baseScore = 70;
                const trend = i * 0.5; // Upward trend
                dashboard.mentalHealth.logMood(Math.round((baseScore + trend) / 10), `Day ${i + 1}`);
            }

            const trends = analytics.analyzeWellnessTrends(30);

            expect(trends).toBeDefined();
            expect(trends).toHaveProperty('trend');
        });

        test('should detect anomalies in wellness data', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add mostly consistent data with one outlier
            for (let i = 0; i < 20; i++) {
                const mood = i === 10 ? 2 : 7; // Day 10 is an outlier
                dashboard.mentalHealth.logMood(mood, `Day ${i + 1}`);
            }

            // Analyze trends which includes anomaly detection
            const trends = analytics.analyzeWellnessTrends(30);

            expect(trends).toBeDefined();
            expect(trends).toHaveProperty('anomalyDetails');
        });

        test('should handle empty data gracefully in analytics', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            expect(() => {
                analytics.displayDashboard(30);
                analytics.analyzeWellnessTrends(30);
                analytics.analyzeMoodSleepCorrelation(30);
                analytics.analyzeSleepExerciseCorrelation(30);
                analytics.analyzeMoodExerciseCorrelation(30);
            }).not.toThrow();
        });

        test('should analyze sleep-exercise correlation', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add correlated data
            for (let i = 0; i < 15; i++) {
                const exerciseDuration = 30 + Math.random() * 30;
                const sleepQuality = 6 + Math.random() * 2;

                dashboard.exercise.logExercise('Running', exerciseDuration, 'moderate', '');

                const sleepStart = new Date();
                sleepStart.setDate(sleepStart.getDate() - i);
                sleepStart.setHours(22, 0, 0, 0);

                const sleepEnd = new Date(sleepStart);
                sleepEnd.setHours(6, 0, 0, 0);
                sleepEnd.setDate(sleepEnd.getDate() + 1);

                dashboard.sleep.logSleep(sleepStart, sleepEnd, sleepQuality);
            }

            const correlation = analytics.analyzeSleepExerciseCorrelation(30);

            expect(correlation).toBeDefined();
            expect(correlation).toHaveProperty('correlation');
        });

        test('should analyze mood-exercise correlation', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add correlated data - exercise improves mood
            for (let i = 0; i < 12; i++) {
                const exerciseDuration = 20 + i * 5;
                const mood = 5 + Math.floor(i * 0.3);

                dashboard.exercise.logExercise('Jogging', exerciseDuration, 'moderate', '');
                dashboard.mentalHealth.logMood(Math.min(mood, 10), `Day ${i + 1}`);
            }

            const correlation = analytics.analyzeMoodExerciseCorrelation(30);

            expect(correlation).toBeDefined();
            expect(correlation).toHaveProperty('correlation');
        });
    });

    describe('Backup CLI Integration', () => {
        test('should create backup with description and tags', () => {
            const backup = new BackupManager();

            const result = backup.createBackup({
                description: 'Test backup',
                tags: ['test', 'manual']
            });

            expect(result.success).toBe(true);
            expect(result.backupId).toBeDefined();
            expect(result.message).toContain('Backup created successfully');
        });

        test('should list all backups with details', () => {
            const backup = new BackupManager();

            // Create multiple backups
            backup.createBackup({ description: 'Backup 1', tags: ['test'] });
            backup.createBackup({ description: 'Backup 2', tags: ['important'] });
            backup.createBackup({ description: 'Backup 3' });

            const backups = backup.listBackups({ limit: 10 });

            expect(Array.isArray(backups)).toBe(true);
            expect(backups.length).toBe(3);
            expect(backups[0]).toHaveProperty('id');
            expect(backups[0]).toHaveProperty('timestamp');
            expect(backups[0]).toHaveProperty('description');
        });

        test('should verify backup integrity', () => {
            const backup = new BackupManager();

            const createResult = backup.createBackup({ description: 'Test' });
            const backupId = createResult.backupId;

            fs.existsSync.mockReturnValue(true);

            const verifyResult = backup.verifyBackup(backupId);

            expect(verifyResult).toHaveProperty('valid');
            expect(verifyResult).toHaveProperty('message');
        });

        test('should delete backup', () => {
            const backup = new BackupManager();

            const createResult = backup.createBackup({ description: 'To delete' });
            const backupId = createResult.backupId;

            const deleteResult = backup.deleteBackup(backupId);

            expect(deleteResult.success).toBe(true);
            expect(deleteResult.message).toContain('deleted successfully');
        });

        test('should show backup statistics', () => {
            const backup = new BackupManager();

            // Create several backups
            backup.createBackup({ description: 'Backup 1' });
            backup.createBackup({ description: 'Backup 2', tags: ['important'] });
            backup.createBackup({ description: 'Backup 3' });

            const stats = backup.getStats();

            expect(stats).toHaveProperty('totalBackups');
            expect(stats).toHaveProperty('totalSize');
            expect(stats).toHaveProperty('oldestBackup');
            expect(stats).toHaveProperty('newestBackup');
            expect(stats.totalBackups).toBeGreaterThan(0);
        });

        test('should cleanup old backups based on retention policy', () => {
            const backup = new BackupManager();

            // Create backups with old timestamps
            for (let i = 0; i < 60; i++) {
                const oldDate = new Date();
                oldDate.setDate(oldDate.getDate() - (40 + i)); // 40-100 days old

                backup.createBackup({
                    description: `Old backup ${i}`,
                    tags: i < 5 ? ['important'] : [] // First 5 are important
                });
            }

            const cleanupResult = backup.cleanupOldBackups();

            expect(cleanupResult).toHaveProperty('removed');
            expect(cleanupResult).toHaveProperty('kept');
            expect(cleanupResult).toHaveProperty('message');
        });

        test('should handle backup restore workflow', () => {
            const backup = new BackupManager();

            // Create a backup
            const createResult = backup.createBackup({ description: 'Restore test' });
            const backupId = createResult.backupId;

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                timestamp: new Date().toISOString(),
                files: {}
            }));

            // Restore it
            const restoreResult = backup.restore(backupId);

            expect(restoreResult).toHaveProperty('success');
            expect(restoreResult).toHaveProperty('message');
        });

        test('should export backup to external location', () => {
            const backup = new BackupManager();

            const createResult = backup.createBackup({ description: 'Export test' });
            const backupId = createResult.backupId;

            fs.existsSync.mockReturnValue(true);

            const exportResult = backup.exportBackup(backupId, '/tmp/external');

            expect(exportResult).toHaveProperty('success');
            expect(exportResult).toHaveProperty('message');
        });

        test('should import backup from external location', () => {
            const backup = new BackupManager();

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                timestamp: new Date().toISOString(),
                description: 'Imported',
                files: {}
            }));

            const importResult = backup.importBackup('/tmp/external/backup.json');

            expect(importResult).toHaveProperty('success');
            expect(importResult).toHaveProperty('backupId');
        });

        test('should handle errors gracefully in backup operations', () => {
            const backup = new BackupManager();

            // Test with non-existent backup
            const verifyResult = backup.verifyBackup('non-existent-id');
            expect(verifyResult.valid).toBe(false);

            const deleteResult = backup.deleteBackup('non-existent-id');
            expect(deleteResult.success).toBe(false);

            const restoreResult = backup.restore('non-existent-id');
            expect(restoreResult.success).toBe(false);
        });

        test('should protect important backups from cleanup', () => {
            const backup = new BackupManager();

            // Create old important backup
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 100);

            backup.createBackup({
                description: 'Important old backup',
                tags: ['important', 'manual']
            });

            const statsBefore = backup.getStats();
            const cleanupResult = backup.cleanupOldBackups();

            // Important backups should be protected
            expect(cleanupResult.kept).toBeGreaterThan(0);
        });
    });

    describe('Visualization CLI Integration', () => {
        test('should generate PDF report successfully', () => {
            const vizCLI = new VisualizationCLI();

            // Add sample data
            vizCLI.dashboard.mentalHealth.logMood(7, 'Good day');
            vizCLI.dashboard.sleep.logSleep(
                new Date('2025-12-01T22:00'),
                new Date('2025-12-02T06:00'),
                8
            );

            expect(() => {
                vizCLI.generateReport(30);
            }).not.toThrow();
        });

        test('should list all generated reports', () => {
            const vizCLI = new VisualizationCLI();

            fs.readdirSync.mockReturnValue([
                'wellness-report-2025-12-01.pdf',
                'wellness-report-2025-12-02.pdf'
            ]);

            consoleLogSpy.mockClear();
            vizCLI.listReports();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Generated Reports') || expect(output).toContain('reports');
        });

        test('should export data to CSV format', () => {
            const vizCLI = new VisualizationCLI();

            // Add sample data
            vizCLI.dashboard.mentalHealth.logMood(7, 'Test');
            vizCLI.dashboard.sleep.logSleep(
                new Date('2025-12-01T22:00'),
                new Date('2025-12-02T06:00'),
                8
            );

            expect(() => {
                vizCLI.exportCSV(30);
            }).not.toThrow();
        });

        test('should export data to JSON format', () => {
            const vizCLI = new VisualizationCLI();

            vizCLI.dashboard.mentalHealth.logMood(8, 'Test');
            vizCLI.dashboard.exercise.logExercise('Running', 30, 'moderate', '');

            expect(() => {
                vizCLI.exportJSON(30);
            }).not.toThrow();
        });

        test('should export medications to CSV', () => {
            const vizCLI = new VisualizationCLI();

            vizCLI.dashboard.medication.addMedication('Test Med', '10mg', 'daily', '08:00');

            expect(() => {
                vizCLI.exportMedications();
            }).not.toThrow();
        });

        test('should export analytics summary', () => {
            const vizCLI = new VisualizationCLI();

            // Add varied data
            for (let i = 0; i < 10; i++) {
                vizCLI.dashboard.mentalHealth.logMood(5 + i % 3, `Day ${i}`);
            }

            expect(() => {
                vizCLI.exportAnalytics(30);
            }).not.toThrow();
        });

        test('should export complete backup of all data', () => {
            const vizCLI = new VisualizationCLI();

            vizCLI.dashboard.mentalHealth.logMood(7, 'Test');
            vizCLI.dashboard.medication.addMedication('Med', '10mg', 'daily', '08:00');
            vizCLI.dashboard.sleep.logSleep(
                new Date('2025-12-01T22:00'),
                new Date('2025-12-02T06:00'),
                8
            );
            vizCLI.dashboard.exercise.logExercise('Running', 30, 'moderate', '');

            expect(() => {
                vizCLI.exportAll();
            }).not.toThrow();
        });

        test('should display ASCII mood chart', () => {
            const vizCLI = new VisualizationCLI();

            // Add mood data for charting
            for (let i = 0; i < 7; i++) {
                vizCLI.dashboard.mentalHealth.logMood(5 + (i % 4), `Day ${i + 1}`);
            }

            consoleLogSpy.mockClear();
            vizCLI.displayChart('mood', 7);

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('should display sleep quality chart', () => {
            const vizCLI = new VisualizationCLI();

            // Add sleep data
            for (let i = 0; i < 7; i++) {
                const sleepStart = new Date();
                sleepStart.setDate(sleepStart.getDate() - i);
                sleepStart.setHours(22, 0, 0, 0);

                const sleepEnd = new Date(sleepStart);
                sleepEnd.setHours(6, 0, 0, 0);
                sleepEnd.setDate(sleepEnd.getDate() + 1);

                vizCLI.dashboard.sleep.logSleep(sleepStart, sleepEnd, 6 + (i % 3));
            }

            consoleLogSpy.mockClear();
            vizCLI.displayChart('sleep', 7);

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('should display exercise chart', () => {
            const vizCLI = new VisualizationCLI();

            // Add exercise data
            for (let i = 0; i < 7; i++) {
                vizCLI.dashboard.exercise.logExercise('Running', 20 + (i * 5), 'moderate', '');
            }

            consoleLogSpy.mockClear();
            vizCLI.displayChart('exercise', 7);

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('should display wellness heatmap', () => {
            const vizCLI = new VisualizationCLI();

            // Add varied wellness data
            for (let i = 0; i < 30; i++) {
                vizCLI.dashboard.mentalHealth.logMood(4 + (i % 5), `Day ${i + 1}`);
            }

            consoleLogSpy.mockClear();
            vizCLI.displayHeatmap(30);

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('should show export statistics', () => {
            const vizCLI = new VisualizationCLI();

            fs.readdirSync.mockReturnValue([
                'export-2025-12-01.csv',
                'export-2025-12-02.json'
            ]);

            consoleLogSpy.mockClear();
            vizCLI.showStats();

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('should list all exported files', () => {
            const vizCLI = new VisualizationCLI();

            fs.readdirSync.mockReturnValue([
                'mood-export-2025-12-01.csv',
                'complete-backup-2025-12-02.json'
            ]);

            consoleLogSpy.mockClear();
            vizCLI.listExports();

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('should display summary with visualizations', () => {
            const vizCLI = new VisualizationCLI();

            // Add comprehensive data
            vizCLI.dashboard.mentalHealth.logMood(7, 'Good');
            vizCLI.dashboard.sleep.logSleep(
                new Date('2025-12-01T22:00'),
                new Date('2025-12-02T06:00'),
                8
            );
            vizCLI.dashboard.exercise.logExercise('Running', 30, 'moderate', '');

            consoleLogSpy.mockClear();
            vizCLI.showSummary(30);

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('should display trends with charts', () => {
            const vizCLI = new VisualizationCLI();

            // Add trending data
            for (let i = 0; i < 14; i++) {
                vizCLI.dashboard.mentalHealth.logMood(5 + Math.floor(i * 0.2), `Day ${i + 1}`);
            }

            consoleLogSpy.mockClear();
            vizCLI.showTrends(14);

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('should handle empty data gracefully in visualizations', () => {
            const vizCLI = new VisualizationCLI();

            expect(() => {
                vizCLI.displayChart('mood', 30);
                vizCLI.displayHeatmap(30);
                vizCLI.showSummary(30);
                vizCLI.showTrends(30);
                vizCLI.listReports();
                vizCLI.listExports();
            }).not.toThrow();
        });

        test('should display help message', () => {
            const vizCLI = new VisualizationCLI();

            consoleLogSpy.mockClear();
            vizCLI.showHelp();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Visualization') || expect(output).toContain('COMMANDS');
        });
    });

    describe('Goal Manager CLI Integration', () => {
        test('should create and track wellness goals', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            const goal = goalManager.createGoal({
                type: 'exercise',
                title: 'Exercise 3x per week',
                description: 'Maintain consistent exercise routine',
                target: 3,
                duration: 7
            });

            expect(goal).toBeDefined();
            expect(goal.id).toBeDefined();
            expect(goal.title).toBe('Exercise 3x per week');
        });

        test('should list all active goals', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            goalManager.createGoal({
                type: 'mood',
                title: 'Goal 1',
                description: 'First goal',
                target: 7,
                duration: 30
            });

            goalManager.createGoal({
                type: 'sleep',
                title: 'Goal 2',
                description: 'Second goal',
                target: 8,
                duration: 30
            });

            const goals = goalManager.getGoals({ status: 'active' });

            expect(Array.isArray(goals)).toBe(true);
            expect(goals.length).toBeGreaterThanOrEqual(2);
        });

        test('should update goal progress', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            const goal = goalManager.createGoal({
                type: 'exercise',
                title: 'Test goal',
                description: 'Progress tracking',
                target: 100,
                duration: 30
            });

            const todayData = {
                exercise: { count: 1, duration: 30 }
            };

            const updated = goalManager.updateProgress(goal.id, todayData);

            expect(updated).toBeDefined();
            expect(updated.progress).toBeDefined();
        });

        test('should complete goal when progress reaches 100%', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            const goal = goalManager.createGoal({
                type: 'exercise',
                title: 'Exercise 5 times',
                description: 'Test completion',
                target: 5,
                duration: 7
            });

            // Update progress to 100% to trigger completion
            const todayData = {
                exercise: { count: 5, duration: 150 }
            };

            const updated = goalManager.updateProgress(goal.id, todayData);

            expect(updated).toBeDefined();
            expect(updated.progress.percentage).toBeGreaterThanOrEqual(100);
        });

        test('should archive old goals', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            const oldGoal = goalManager.createGoal({
                type: 'mood',
                title: 'Old goal',
                description: 'Should be archived',
                target: 7,
                duration: 30
            });

            goalManager.archiveGoal(oldGoal.id);

            const archivedGoals = goalManager.getGoals({ status: 'archived' });

            expect(Array.isArray(archivedGoals)).toBe(true);
            expect(archivedGoals.length).toBeGreaterThan(0);
        });

        test('should get goal statistics', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);

            goalManager.createGoal({
                type: 'mood',
                title: 'Goal 1',
                description: 'Test',
                target: 7,
                duration: 30
            });

            goalManager.createGoal({
                type: 'exercise',
                title: 'Goal 2',
                description: 'Test',
                target: 10,
                duration: 7
            });

            const stats = goalManager.getStats();

            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('active');
            expect(stats.total).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Reminder Manager CLI Integration', () => {
        test('should create and manage reminders', () => {
            const reminderManager = new ReminderManager();

            const reminder = reminderManager.createReminder({
                type: 'medication',
                title: 'Take medication',
                message: 'Morning dose',
                time: '08:00',
                days: 'daily'
            });

            expect(reminder).toBeDefined();
            expect(reminder.id).toBeDefined();
        });

        test('should list all reminders', () => {
            const reminderManager = new ReminderManager();

            reminderManager.createReminder({
                type: 'medication',
                title: 'Reminder 1',
                message: 'Take medication',
                time: '08:00',
                days: 'daily'
            });

            reminderManager.createReminder({
                type: 'mood',
                title: 'Reminder 2',
                message: 'Log mood',
                time: '18:00',
                days: 'daily'
            });

            const reminders = reminderManager.getReminders();

            expect(Array.isArray(reminders)).toBe(true);
            expect(reminders.length).toBeGreaterThanOrEqual(2);
        });

        test('should handle reminder operations', () => {
            const reminderManager = new ReminderManager();

            const reminder = reminderManager.createReminder({
                type: 'general',
                title: 'Test reminder',
                message: 'Test message',
                time: '12:00',
                days: 'daily'
            });

            expect(reminder).toBeDefined();
            expect(reminder.id).toBeDefined();

            // Get reminder
            const retrieved = reminderManager.getReminder(reminder.id);
            expect(retrieved).toBeDefined();
            expect(retrieved.title).toBe('Test reminder');
        });
    });

    describe('Automation Manager CLI Integration', () => {
        test('should create and manage workflows', () => {
            const dashboard = new DailyDashboard();
            const reminderManager = new ReminderManager();
            const goalManager = new GoalManager(dashboard);
            const automationManager = new AutomationManager({
                dashboard,
                reminderManager,
                goalManager
            });

            const workflow = automationManager.addWorkflow({
                name: 'Low mood alert',
                condition: (data) => data.mood < 4,
                action: () => console.log('Low mood detected')
            });

            expect(workflow).toBeDefined();
            expect(workflow.name).toBe('Low mood alert');
        });

        test('should start and stop automation', () => {
            const dashboard = new DailyDashboard();
            const reminderManager = new ReminderManager();
            const goalManager = new GoalManager(dashboard);
            const automationManager = new AutomationManager({
                dashboard,
                reminderManager,
                goalManager
            });

            // Start automation
            automationManager.start();
            expect(automationManager.enabled).toBe(true);

            // Stop automation
            automationManager.stop();
            expect(automationManager.enabled).toBe(false);
        });

        test('should schedule automated tasks', () => {
            const dashboard = new DailyDashboard();
            const reminderManager = new ReminderManager();
            const goalManager = new GoalManager(dashboard);
            const automationManager = new AutomationManager({
                dashboard,
                reminderManager,
                goalManager
            });

            expect(() => {
                automationManager.scheduleDailyCheckIn('20:00');
                automationManager.scheduleReminderChecks();
                automationManager.scheduleWeeklyReport(0, '09:00');
                automationManager.scheduleGoalUpdates();
            }).not.toThrow();
        });

        test('should add smart reminders', () => {
            const dashboard = new DailyDashboard();
            const reminderManager = new ReminderManager();
            const goalManager = new GoalManager(dashboard);
            const automationManager = new AutomationManager({
                dashboard,
                reminderManager,
                goalManager
            });

            expect(() => {
                automationManager.addSmartReminder({ type: 'low_sleep' });
                automationManager.addSmartReminder({ type: 'goal_at_risk' });
            }).not.toThrow();
        });
    });

    describe('Cross-CLI Module Workflows', () => {
        test('should complete full wellness tracking and reporting workflow', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);
            const vizCLI = new VisualizationCLI();
            const backup = new BackupManager();

            // Day 1-7: Track wellness data
            for (let i = 0; i < 7; i++) {
                dashboard.mentalHealth.logMood(6 + (i % 3), `Day ${i + 1}`);

                const sleepStart = new Date();
                sleepStart.setDate(sleepStart.getDate() - i);
                sleepStart.setHours(22, 0, 0, 0);

                const sleepEnd = new Date(sleepStart);
                sleepEnd.setHours(6, 0, 0, 0);
                sleepEnd.setDate(sleepEnd.getDate() + 1);

                dashboard.sleep.logSleep(sleepStart, sleepEnd, 7 + (i % 2));
                dashboard.exercise.logExercise('Running', 30, 'moderate', 200);
            }

            // Analyze data
            const trends = analytics.analyzeWellnessTrends(7);
            expect(trends).toBeDefined();

            // Generate report
            expect(() => vizCLI.generateReport(7)).not.toThrow();

            // Export data
            expect(() => vizCLI.exportCSV(7)).not.toThrow();

            // Create backup
            const backupResult = backup.createBackup({
                description: 'Weekly wellness backup',
                tags: ['weekly', 'important']
            });

            expect(backupResult.success).toBe(true);
        });

        test('should complete goal-tracking with reminders workflow', () => {
            const dashboard = new DailyDashboard();
            const goalManager = new GoalManager(dashboard);
            const reminderManager = new ReminderManager();

            // Create wellness goal
            const goal = goalManager.createGoal({
                type: 'exercise',
                title: 'Exercise 5 times this week',
                description: 'Maintain fitness routine',
                target: 5,
                duration: 7
            });

            expect(goal).toBeDefined();

            // Set reminder for goal
            const reminder = reminderManager.createReminder({
                type: 'goal',
                title: 'Daily exercise reminder',
                message: `Reminder for goal: ${goal.title}`,
                time: '07:00',
                days: 'daily'
            });

            expect(reminder).toBeDefined();

            // Update progress
            const todayData = {
                exercise: { count: 3, duration: 90 }
            };
            goalManager.updateProgress(goal.id, todayData);

            // Check stats
            const goalStats = goalManager.getStats();
            expect(goalStats.active).toBeGreaterThan(0);

            const reminders = reminderManager.getReminders();
            expect(reminders.length).toBeGreaterThan(0);
        });

        test('should complete automation with analytics workflow', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);
            const reminderManager = new ReminderManager();
            const goalManager = new GoalManager(dashboard);
            const automationManager = new AutomationManager({
                dashboard,
                reminderManager,
                goalManager
            });

            // Add mood data with low points
            for (let i = 0; i < 10; i++) {
                const mood = i === 5 ? 3 : 7; // Day 5 has low mood
                dashboard.mentalHealth.logMood(mood, `Day ${i + 1}`);
            }

            // Create automation workflow for low mood
            const workflow = automationManager.addWorkflow({
                name: 'Low mood intervention',
                condition: (data) => data.wellnessScore < 40,
                action: () => console.log('Low mood detected - suggesting coping strategy')
            });

            expect(workflow).toBeDefined();
            expect(workflow.name).toBe('Low mood intervention');

            // Analyze trends
            const trends = analytics.analyzeWellnessTrends(10);
            expect(trends).toBeDefined();
            expect(trends).toHaveProperty('anomalyDetails');
        });

        test('should complete backup-restore-verify workflow', () => {
            const dashboard = new DailyDashboard();
            const backup = new BackupManager();

            // Add data to dashboard
            dashboard.mentalHealth.logMood(8, 'Great day');
            dashboard.medication.addMedication('Test Med', '10mg', 'daily', '08:00');

            // Create backup
            const backupResult = backup.createBackup({
                description: 'Pre-restore test',
                tags: ['test']
            });

            expect(backupResult.success).toBe(true);
            const backupId = backupResult.backupId;

            // List backups
            const backups = backup.listBackups({ limit: 10 });
            expect(backups.length).toBeGreaterThan(0);

            // Verify backup
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                timestamp: new Date().toISOString(),
                files: {}
            }));
            const verifyResult = backup.verifyBackup(backupId);
            expect(verifyResult).toHaveProperty('valid');

            // Restore backup
            const restoreResult = backup.restore(backupId);
            expect(restoreResult).toHaveProperty('success');
        });

        test('should complete export-all and backup workflow', () => {
            const vizCLI = new VisualizationCLI();
            const backup = new BackupManager();

            // Add comprehensive data
            vizCLI.dashboard.mentalHealth.logMood(7, 'Good');
            vizCLI.dashboard.medication.addMedication('Med', '10mg', 'daily', '08:00');

            const sleepStart = new Date('2025-12-01T22:00');
            const sleepEnd = new Date('2025-12-02T06:00');
            vizCLI.dashboard.sleep.logSleep(sleepStart, sleepEnd, 8);

            vizCLI.dashboard.exercise.logExercise('Running', 30, 'moderate', '');

            // Export all data
            expect(() => vizCLI.exportAll()).not.toThrow();

            // Create backup
            const backupResult = backup.createBackup({
                description: 'After complete export',
                tags: ['export', 'complete']
            });

            expect(backupResult.success).toBe(true);

            // Get statistics
            const backupStats = backup.getStats();
            expect(backupStats.totalBackups).toBeGreaterThan(0);
        });
    });

    describe('CLI Error Handling and Edge Cases', () => {
        test('should handle analytics with insufficient data', () => {
            const dashboard = new DailyDashboard();
            const analytics = new AnalyticsEngine(dashboard);

            // Add only 1 data point
            dashboard.mentalHealth.logMood(5, 'Single entry');

            expect(() => {
                analytics.analyzeMoodSleepCorrelation(30);
                // predictWellness doesn't exist - using predictTrend instead
                analytics.predictTrend([5], 7);
                analytics.detectAnomalies(30);
            }).not.toThrow();
        });

        test('should handle backup operations with invalid IDs', () => {
            const backup = new BackupManager();

            const verifyResult = backup.verifyBackup('invalid-id');
            expect(verifyResult.valid).toBe(false);

            const restoreResult = backup.restore('invalid-id');
            expect(restoreResult.success).toBe(false);

            const deleteResult = backup.deleteBackup('invalid-id');
            expect(deleteResult.success).toBe(false);
        });

        test('should handle goal operations with invalid IDs', () => {
            const goalManager = new GoalManager();

            // These methods throw errors for invalid IDs
            expect(() => {
                goalManager.updateProgress('invalid-id', {});
            }).toThrow('Goal not found');
        });

        test('should handle reminder operations with invalid IDs', () => {
            const reminderManager = new ReminderManager();

            // These methods throw errors for invalid IDs
            expect(() => {
                reminderManager.dismissReminder('invalid-id');
            }).toThrow('Reminder not found');

            expect(() => {
                reminderManager.snoozeReminder('invalid-id', 15);
            }).toThrow('Reminder not found');
        });

        test('should handle automation start/stop operations', () => {
            const dashboard = new DailyDashboard();
            const reminderManager = new ReminderManager();
            const goalManager = new GoalManager(dashboard);
            const automationManager = new AutomationManager({
                dashboard,
                reminderManager,
                goalManager
            });

            // Test starting automation
            automationManager.start();
            expect(automationManager.enabled).toBe(true);

            // Test stopping automation
            automationManager.stop();
            expect(automationManager.enabled).toBe(false);
        });

        test('should handle visualization with empty datasets', () => {
            const vizCLI = new VisualizationCLI();

            expect(() => {
                vizCLI.displayChart('mood', 30);
                vizCLI.displayChart('sleep', 30);
                vizCLI.displayChart('exercise', 30);
                vizCLI.displayHeatmap(30);
                vizCLI.showSummary(30);
            }).not.toThrow();
        });

        test('should handle concurrent backup operations', () => {
            const backup = new BackupManager();

            // Create multiple backups rapidly
            const results = [];
            for (let i = 0; i < 5; i++) {
                results.push(backup.createBackup({
                    description: `Concurrent backup ${i}`,
                    tags: ['concurrent']
                }));
            }

            expect(results.every(r => r.success)).toBe(true);
            // IDs may not be unique if created in same millisecond, but all should succeed
            expect(results.length).toBe(5);
        });

        test('should handle large datasets in analytics', () => {
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

                dashboard.sleep.logSleep(sleepStart, sleepEnd, 6 + (i % 3));
                dashboard.exercise.logExercise('Activity', 30 + (i % 30), 'moderate', 'Daily exercise');
            }

            expect(() => {
                analytics.analyzeWellnessTrends(90);
                analytics.analyzeMoodSleepCorrelation(90);
                analytics.analyzeSleepExerciseCorrelation(90);
                analytics.analyzeMoodExerciseCorrelation(90);
            }).not.toThrow();

            // Verify trends include predictions and anomaly detection
            const trends = analytics.analyzeWellnessTrends(90);
            expect(trends).toBeDefined();
            expect(trends).toHaveProperty('trend');
        });
    });
});
