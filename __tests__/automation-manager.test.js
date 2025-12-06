const AutomationManager = require('../automation-manager');
const cron = require('node-cron');

// Mock node-cron
jest.mock('node-cron');

// Mock console methods to suppress output
let consoleSpy;
beforeAll(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('AutomationManager', () => {
    let automationManager;
    let mockDashboard;
    let mockAnalytics;
    let mockReminderManager;
    let mockGoalManager;
    let mockReportGenerator;
    let mockCronTask;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        consoleSpy.mockClear();

        // Mock cron task
        mockCronTask = {
            stop: jest.fn(),
            start: jest.fn()
        };

        cron.schedule.mockReturnValue(mockCronTask);

        // Mock dependencies
        mockDashboard = {
            getAllEntries: jest.fn(() => []),
            getEntry: jest.fn(() => null)
        };

        mockAnalytics = {
            generateReport: jest.fn(() => ({}))
        };

        mockReminderManager = {
            getDueReminders: jest.fn(() => []),
            markAsShown: jest.fn(),
            getGoalEmoji: jest.fn(() => '💊'),
            getReminders: jest.fn(() => [])
        };

        mockGoalManager = {
            updateAllGoals: jest.fn(() => []),
            getGoals: jest.fn(() => [])
        };

        mockReportGenerator = {
            generatePDFReport: jest.fn(() => '/path/to/report.pdf')
        };

        // Create instance with mocked dependencies
        automationManager = new AutomationManager({
            dashboard: mockDashboard,
            analytics: mockAnalytics,
            reminderManager: mockReminderManager,
            goalManager: mockGoalManager,
            reportGenerator: mockReportGenerator
        });
    });

    describe('constructor', () => {
        test('should create instance with provided dependencies', () => {
            expect(automationManager).toBeDefined();
            expect(automationManager.dashboard).toBe(mockDashboard);
            expect(automationManager.analytics).toBe(mockAnalytics);
            expect(automationManager.reminderManager).toBe(mockReminderManager);
            expect(automationManager.goalManager).toBe(mockGoalManager);
            expect(automationManager.reportGenerator).toBe(mockReportGenerator);
        });

        test('should initialize with default values', () => {
            expect(automationManager.scheduledTasks).toEqual([]);
            expect(automationManager.workflows).toEqual([]);
            expect(automationManager.enabled).toBe(false);
        });

        test('should accept and use provided dependencies', () => {
            // Verify that provided dependencies are used
            const am = new AutomationManager({
                dashboard: mockDashboard,
                analytics: mockAnalytics,
                reminderManager: mockReminderManager,
                goalManager: mockGoalManager,
                reportGenerator: mockReportGenerator
            });
            expect(am.dashboard).toBe(mockDashboard);
            expect(am.analytics).toBe(mockAnalytics);
            expect(am.reminderManager).toBe(mockReminderManager);
            expect(am.goalManager).toBe(mockGoalManager);
            expect(am.reportGenerator).toBe(mockReportGenerator);
        });
    });

    describe('start and stop', () => {
        test('should start automation system', () => {
            automationManager.start();

            expect(automationManager.enabled).toBe(true);
            expect(automationManager.scheduledTasks.length).toBeGreaterThan(0);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Starting Automation System'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('started'));
        });

        test('should not start if already running', () => {
            automationManager.enabled = true;

            automationManager.start();

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already running'));
        });

        test('should stop automation system', () => {
            automationManager.start();
            expect(automationManager.enabled).toBe(true);

            automationManager.stop();

            expect(automationManager.enabled).toBe(false);
            expect(automationManager.scheduledTasks).toEqual([]);
            expect(mockCronTask.stop).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('stopped'));
        });

        test('should not stop if not running', () => {
            automationManager.stop();

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not running'));
        });
    });

    describe('scheduleDailyCheckIn', () => {
        test('should schedule daily check-in at default time', () => {
            const task = automationManager.scheduleDailyCheckIn();

            expect(cron.schedule).toHaveBeenCalled();
            expect(task).toBe(mockCronTask);
            expect(automationManager.scheduledTasks).toContain(task);
        });

        test('should schedule daily check-in at custom time', () => {
            automationManager.scheduleDailyCheckIn('18:30');

            const cronCall = cron.schedule.mock.calls[0];
            expect(cronCall[0]).toContain('30'); // minutes
            expect(cronCall[0]).toContain('18'); // hours
        });

        test('should execute daily check-in callback', () => {
            automationManager.scheduleDailyCheckIn();

            const callback = cron.schedule.mock.calls[0][1];
            callback();

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Daily Check-In'));
        });
    });

    describe('scheduleReminderChecks', () => {
        test('should schedule reminder checks every 5 minutes', () => {
            automationManager.scheduleReminderChecks();

            expect(cron.schedule).toHaveBeenCalledWith(
                '*/5 * * * *',
                expect.any(Function)
            );
        });

        test('should check for due reminders when executed', () => {
            automationManager.scheduleReminderChecks();

            const callback = cron.schedule.mock.calls[0][1];
            callback();

            expect(mockReminderManager.getDueReminders).toHaveBeenCalled();
        });

        test('should display due reminders', () => {
            const dueReminders = [
                { id: '1', type: 'medication', title: 'Take meds', message: 'Time for medication' },
                { id: '2', type: 'exercise', title: 'Exercise', message: 'Time to exercise' }
            ];

            mockReminderManager.getDueReminders.mockReturnValue(dueReminders);

            automationManager.scheduleReminderChecks();
            const callback = cron.schedule.mock.calls[0][1];
            callback();

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2 Reminder(s)'));
            expect(mockReminderManager.markAsShown).toHaveBeenCalledWith('1');
            expect(mockReminderManager.markAsShown).toHaveBeenCalledWith('2');
        });

        test('should not display anything when no reminders due', () => {
            mockReminderManager.getDueReminders.mockReturnValue([]);

            automationManager.scheduleReminderChecks();
            const callback = cron.schedule.mock.calls[0][1];

            consoleSpy.mockClear();
            callback();

            expect(mockReminderManager.getDueReminders).toHaveBeenCalled();
            // Should not log reminder messages
            expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Reminder(s)'));
        });
    });

    describe('scheduleWeeklyReport', () => {
        test('should schedule weekly report on default day and time', () => {
            automationManager.scheduleWeeklyReport();

            const cronCall = cron.schedule.mock.calls[0];
            expect(cronCall[0]).toContain('0'); // Sunday
        });

        test('should schedule weekly report on custom day and time', () => {
            automationManager.scheduleWeeklyReport(1, '10:30'); // Monday at 10:30

            const cronCall = cron.schedule.mock.calls[0];
            expect(cronCall[0]).toContain('1'); // Monday
            expect(cronCall[0]).toContain('30'); // minutes
            expect(cronCall[0]).toContain('10'); // hours
        });

        test('should generate report when executed', () => {
            automationManager.scheduleWeeklyReport();

            const callback = cron.schedule.mock.calls[0][1];
            callback();

            expect(mockReportGenerator.generatePDFReport).toHaveBeenCalledWith({
                days: 7,
                title: 'Weekly Wellness Report'
            });
        });

        test('should handle report generation errors', () => {
            mockReportGenerator.generatePDFReport.mockImplementation(() => {
                throw new Error('PDF generation failed');
            });

            automationManager.scheduleWeeklyReport();
            const callback = cron.schedule.mock.calls[0][1];

            const errorSpy = jest.spyOn(console, 'error');
            callback();

            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error generating report'),
                expect.any(String)
            );
        });
    });

    describe('scheduleGoalUpdates', () => {
        test('should schedule goal updates at midnight', () => {
            automationManager.scheduleGoalUpdates();

            expect(cron.schedule).toHaveBeenCalledWith(
                '0 0 * * *',
                expect.any(Function)
            );
        });

        test('should update goals with yesterday\'s data', () => {
            const yesterdayData = {
                date: '2025-01-01',
                mood: 8,
                sleep_hours: 7
            };

            mockDashboard.getEntry.mockReturnValue(yesterdayData);
            mockGoalManager.updateAllGoals.mockReturnValue([
                { success: true },
                { success: true }
            ]);

            automationManager.scheduleGoalUpdates();
            const callback = cron.schedule.mock.calls[0][1];
            callback();

            expect(mockDashboard.getEntry).toHaveBeenCalled();
            expect(mockGoalManager.updateAllGoals).toHaveBeenCalledWith(yesterdayData);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Updated 2 goal'));
        });

        test('should handle no data from yesterday', () => {
            mockDashboard.getEntry.mockReturnValue(null);

            automationManager.scheduleGoalUpdates();
            const callback = cron.schedule.mock.calls[0][1];
            callback();

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No data from yesterday'));
        });
    });

    describe('addWorkflow', () => {
        test('should add valid workflow', () => {
            const workflow = {
                name: 'Low Mood Alert',
                condition: (data) => data.mood < 5,
                action: (data) => console.log('Alert: Low mood detected')
            };

            const result = automationManager.addWorkflow(workflow);

            expect(result).toBeDefined();
            expect(result.id).toMatch(/^wf-/);
            expect(result.name).toBe('Low Mood Alert');
            expect(automationManager.workflows).toHaveLength(1);
            expect(automationManager.workflows[0].name).toBe('Low Mood Alert');
            expect(automationManager.workflows[0].enabled).toBe(true);
        });

        test('should throw error for missing name', () => {
            expect(() => {
                automationManager.addWorkflow({
                    condition: () => true,
                    action: () => {}
                });
            }).toThrow('Workflow must have name, condition, and action');
        });

        test('should throw error for missing condition', () => {
            expect(() => {
                automationManager.addWorkflow({
                    name: 'Test',
                    action: () => {}
                });
            }).toThrow('Workflow must have name, condition, and action');
        });

        test('should throw error for missing action', () => {
            expect(() => {
                automationManager.addWorkflow({
                    name: 'Test',
                    condition: () => true
                });
            }).toThrow('Workflow must have name, condition, and action');
        });

        test('should allow disabled workflows', () => {
            const workflow = {
                name: 'Test',
                condition: () => true,
                action: () => {},
                enabled: false
            };

            automationManager.addWorkflow(workflow);

            expect(automationManager.workflows[0].enabled).toBe(false);
        });
    });

    describe('executeWorkflows', () => {
        beforeEach(() => {
            mockDashboard.getAllEntries.mockReturnValue([
                { date: '2025-01-01', mood: 3, sleep_hours: 8 },
                { date: '2025-01-02', mood: 8, sleep_hours: 6 }
            ]);
            automationManager.enabled = true; // Must be enabled to execute
        });

        test('should not execute workflows if system disabled', () => {
            automationManager.enabled = false;
            const actionSpy = jest.fn();

            automationManager.addWorkflow({
                name: 'Test',
                condition: () => true,
                action: actionSpy
            });

            automationManager.executeWorkflows();

            expect(actionSpy).not.toHaveBeenCalled();
        });

        test('should execute workflow when condition is true', () => {
            const actionSpy = jest.fn();

            automationManager.addWorkflow({
                name: 'Test Workflow',
                condition: (context) => {
                    expect(context.dashboard).toBe(mockDashboard);
                    expect(context.analytics).toBe(mockAnalytics);
                    return true;
                },
                action: actionSpy
            });

            automationManager.executeWorkflows();

            expect(actionSpy).toHaveBeenCalledTimes(1);
            expect(actionSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    dashboard: mockDashboard,
                    analytics: mockAnalytics
                })
            );
        });

        test('should not execute workflow when condition is false', () => {
            const actionSpy = jest.fn();

            automationManager.addWorkflow({
                name: 'Test',
                condition: () => false,
                action: actionSpy
            });

            automationManager.executeWorkflows();

            expect(actionSpy).not.toHaveBeenCalled();
        });

        test('should not execute disabled workflows', () => {
            const actionSpy = jest.fn();

            automationManager.addWorkflow({
                name: 'Test',
                condition: () => true,
                action: actionSpy,
                enabled: false
            });

            automationManager.executeWorkflows();

            expect(actionSpy).not.toHaveBeenCalled();
        });

        test('should update lastTriggered and triggerCount', () => {
            automationManager.addWorkflow({
                name: 'Test',
                condition: () => true,
                action: () => {}
            });

            const beforeTime = new Date().toISOString();
            automationManager.executeWorkflows();
            const afterTime = new Date().toISOString();

            const workflow = automationManager.workflows[0];
            expect(workflow.lastTriggered).toBeDefined();
            expect(workflow.lastTriggered >= beforeTime).toBe(true);
            expect(workflow.lastTriggered <= afterTime).toBe(true);
            expect(workflow.triggerCount).toBe(1);
        });

        test('should handle workflow errors gracefully', () => {
            automationManager.addWorkflow({
                name: 'Error Workflow',
                condition: () => true,
                action: () => { throw new Error('Action failed'); }
            });

            const errorSpy = jest.spyOn(console, 'error');

            expect(() => {
                automationManager.executeWorkflows();
            }).not.toThrow();

            expect(errorSpy).toHaveBeenCalled();
        });

        test('should execute multiple workflows', () => {
            const action1 = jest.fn();
            const action2 = jest.fn();

            automationManager.addWorkflow({
                name: 'Workflow 1',
                condition: () => true,
                action: action1
            });

            automationManager.addWorkflow({
                name: 'Workflow 2',
                condition: () => true,
                action: action2
            });

            automationManager.executeWorkflows();

            expect(action1).toHaveBeenCalledTimes(1);
            expect(action2).toHaveBeenCalledTimes(1);
        });
    });

    describe('getStatus', () => {
        test('should return current automation status', () => {
            automationManager.enabled = true;
            automationManager.scheduledTasks = [mockCronTask, mockCronTask];
            automationManager.workflows = [
                { id: 'wf-1', enabled: true },
                { id: 'wf-2', enabled: false }
            ];

            const status = automationManager.getStatus();

            expect(status.enabled).toBe(true);
            expect(status.scheduledTasks).toBe(2);
            expect(status.workflows).toBe(2);
            expect(status.activeWorkflows).toBe(1);
        });

        test('should show disabled status', () => {
            const status = automationManager.getStatus();

            expect(status.enabled).toBe(false);
            expect(status.scheduledTasks).toBe(0);
            expect(status.workflows).toBe(0);
            expect(status.activeWorkflows).toBe(0);
        });
    });

    describe('listWorkflows', () => {
        test('should display all workflows', () => {
            automationManager.addWorkflow({
                name: 'Workflow 1',
                condition: () => true,
                action: () => {}
            });

            automationManager.addWorkflow({
                name: 'Workflow 2',
                condition: () => false,
                action: () => {}
            });

            consoleSpy.mockClear();
            automationManager.listWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Automation Workflows');
            expect(output).toContain('Workflow 1');
            expect(output).toContain('Workflow 2');
        });

        test('should display message when no workflows', () => {
            consoleSpy.mockClear();
            automationManager.listWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('No workflows configured');
        });

        test('should show enabled status correctly', () => {
            automationManager.addWorkflow({
                name: 'Enabled Flow',
                condition: () => true,
                action: () => {},
                enabled: true
            });

            automationManager.addWorkflow({
                name: 'Disabled Flow',
                condition: () => true,
                action: () => {},
                enabled: false
            });

            consoleSpy.mockClear();
            automationManager.listWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('✅ Enabled Flow');
            expect(output).toContain('⏸️ Disabled Flow');
        });

        test('should display trigger count and last triggered time', () => {
            automationManager.enabled = true;
            automationManager.addWorkflow({
                name: 'Test',
                condition: () => true,
                action: () => {}
            });

            automationManager.executeWorkflows();

            consoleSpy.mockClear();
            automationManager.listWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Triggered: 1 times');
            expect(output).toContain('Last:');
        });
    });

    describe('addSmartReminder', () => {
        test('should add low_sleep workflow with default threshold', () => {
            automationManager.addSmartReminder({
                type: 'low_sleep'
            });

            expect(automationManager.workflows.length).toBe(1);
            expect(automationManager.workflows[0].name).toBe('Low Sleep Alert');
        });

        test('should add low_sleep workflow with custom threshold', () => {
            automationManager.addSmartReminder({
                type: 'low_sleep',
                threshold: 5,
                message: 'Sleep more!'
            });

            expect(automationManager.workflows.length).toBe(1);
            expect(automationManager.workflows[0].name).toBe('Low Sleep Alert');
        });

        test('should trigger low_sleep alert when sleep is low', () => {
            mockDashboard.getAllEntries.mockReturnValue([
                { date: '2025-01-01', sleep_hours: 4 },
                { date: '2025-01-02', sleep_hours: 5 },
                { date: '2025-01-03', sleep_hours: 4 }
            ]);

            automationManager.enabled = true;
            automationManager.addSmartReminder({
                type: 'low_sleep',
                threshold: 6
            });

            consoleSpy.mockClear();
            automationManager.executeWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Low sleep detected');
        });

        test('should not trigger low_sleep alert when sleep is sufficient', () => {
            mockDashboard.getAllEntries.mockReturnValue([
                { date: '2025-01-01', sleep_hours: 8 },
                { date: '2025-01-02', sleep_hours: 7 },
                { date: '2025-01-03', sleep_hours: 8 }
            ]);

            automationManager.enabled = true;
            automationManager.addSmartReminder({
                type: 'low_sleep',
                threshold: 6
            });

            consoleSpy.mockClear();
            automationManager.executeWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).not.toContain('Low sleep detected');
        });

        test('should use custom message for low_sleep', () => {
            mockDashboard.getAllEntries.mockReturnValue([
                { date: '2025-01-01', sleep_hours: 4 },
                { date: '2025-01-02', sleep_hours: 4 },
                { date: '2025-01-03', sleep_hours: 4 }
            ]);

            automationManager.enabled = true;
            automationManager.addSmartReminder({
                type: 'low_sleep',
                threshold: 6,
                message: 'Custom sleep message'
            });

            consoleSpy.mockClear();
            automationManager.executeWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Custom sleep message');
        });

        test('should handle entries without sleep data', () => {
            mockDashboard.getAllEntries.mockReturnValue([
                { date: '2025-01-01', mood: 7 },
                { date: '2025-01-02', mood: 8 },
                { date: '2025-01-03', exercise_minutes: 30 }
            ]);

            automationManager.enabled = true;
            automationManager.addSmartReminder({
                type: 'low_sleep',
                threshold: 6
            });

            consoleSpy.mockClear();
            automationManager.executeWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Low sleep detected'); // avg = 0 < threshold
        });

        test('should add goal_at_risk workflow', () => {
            automationManager.addSmartReminder({
                type: 'goal_at_risk'
            });

            expect(automationManager.workflows.length).toBe(1);
            expect(automationManager.workflows[0].name).toBe('Goal At Risk Alert');
        });

        test('should trigger goal_at_risk alert when goal is behind', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 10);

            mockGoalManager.getGoals.mockReturnValue([
                {
                    endDate: tomorrow.toISOString(),
                    duration: 30,
                    progress: {
                        percentage: 10
                    }
                }
            ]);

            automationManager.enabled = true;
            automationManager.addSmartReminder({
                type: 'goal_at_risk'
            });

            consoleSpy.mockClear();
            automationManager.executeWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('goals are falling behind');
        });

        test('should not trigger goal_at_risk when goals on track', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 10);

            mockGoalManager.getGoals.mockReturnValue([
                {
                    endDate: tomorrow.toISOString(),
                    duration: 10,
                    progress: {
                        percentage: 90
                    }
                }
            ]);

            automationManager.enabled = true;
            automationManager.addSmartReminder({
                type: 'goal_at_risk'
            });

            consoleSpy.mockClear();
            automationManager.executeWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).not.toContain('goals are falling behind');
        });

        test('should use custom message for goal_at_risk', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 10);

            mockGoalManager.getGoals.mockReturnValue([
                {
                    endDate: tomorrow.toISOString(),
                    duration: 30,
                    progress: {
                        percentage: 10
                    }
                }
            ]);

            automationManager.enabled = true;
            automationManager.addSmartReminder({
                type: 'goal_at_risk',
                message: 'Custom motivation message'
            });

            consoleSpy.mockClear();
            automationManager.executeWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Custom motivation message');
        });

        test('should not trigger goal_at_risk when no active goals', () => {
            mockGoalManager.getGoals.mockReturnValue([]);

            automationManager.enabled = true;
            automationManager.addSmartReminder({
                type: 'goal_at_risk'
            });

            consoleSpy.mockClear();
            automationManager.executeWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).not.toContain('goals are falling behind');
        });

        test('should handle goals with past end dates', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            mockGoalManager.getGoals.mockReturnValue([
                {
                    endDate: yesterday.toISOString(),
                    duration: 30,
                    progress: {
                        percentage: 50
                    }
                }
            ]);

            automationManager.enabled = true;
            automationManager.addSmartReminder({
                type: 'goal_at_risk'
            });

            consoleSpy.mockClear();
            automationManager.executeWorkflows();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).not.toContain('goals are falling behind'); // daysLeft <= 0
        });
    });

    describe('generateDailySummary', () => {
        test('should show warning when no data for today', () => {
            mockDashboard.getEntry.mockReturnValue(null);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Daily Summary');
            expect(output).toContain('No data logged for today yet');
        });

        test('should display mood when present', () => {
            mockDashboard.getEntry.mockReturnValue({ mood: 8 });
            mockGoalManager.getGoals.mockReturnValue([]);
            mockReminderManager.getReminders.mockReturnValue([]);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Mood: 8/10');
        });

        test('should display sleep when present', () => {
            mockDashboard.getEntry.mockReturnValue({ sleep_hours: 7.5 });
            mockGoalManager.getGoals.mockReturnValue([]);
            mockReminderManager.getReminders.mockReturnValue([]);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Sleep: 7.5 hours');
        });

        test('should display exercise when present', () => {
            mockDashboard.getEntry.mockReturnValue({ exercise_minutes: 30 });
            mockGoalManager.getGoals.mockReturnValue([]);
            mockReminderManager.getReminders.mockReturnValue([]);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Exercise: 30 minutes');
        });

        test('should display all wellness data when present', () => {
            mockDashboard.getEntry.mockReturnValue({
                mood: 9,
                sleep_hours: 8,
                exercise_minutes: 45
            });
            mockGoalManager.getGoals.mockReturnValue([]);
            mockReminderManager.getReminders.mockReturnValue([]);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Mood: 9/10');
            expect(output).toContain('Sleep: 8 hours');
            expect(output).toContain('Exercise: 45 minutes');
        });

        test('should display active goals when present', () => {
            mockDashboard.getEntry.mockReturnValue({ mood: 8 });
            mockGoalManager.getGoals.mockReturnValue([
                {
                    title: 'Test Goal',
                    progress: {
                        percentage: 75,
                        streak: 5
                    }
                }
            ]);
            mockReminderManager.getReminders.mockReturnValue([]);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Goal Progress:');
            expect(output).toContain('Test Goal');
            expect(output).toContain('75%');
            expect(output).toContain('Streak: 5');
        });

        test('should not display goal section when no active goals', () => {
            mockDashboard.getEntry.mockReturnValue({ mood: 8 });
            mockGoalManager.getGoals.mockReturnValue([]);
            mockReminderManager.getReminders.mockReturnValue([]);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).not.toContain('Goal Progress:');
        });

        test('should display active reminders when present', () => {
            mockDashboard.getEntry.mockReturnValue({ mood: 8 });
            mockGoalManager.getGoals.mockReturnValue([]);
            mockReminderManager.getReminders.mockReturnValue([
                { time: '09:00', title: 'Morning reminder' },
                { time: '14:00', title: 'Afternoon reminder' }
            ]);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Active Reminders:');
            expect(output).toContain('Morning reminder');
            expect(output).toContain('Afternoon reminder');
        });

        test('should limit reminders display to 3', () => {
            mockDashboard.getEntry.mockReturnValue({ mood: 8 });
            mockGoalManager.getGoals.mockReturnValue([]);
            mockReminderManager.getReminders.mockReturnValue([
                { time: '09:00', title: 'Reminder 1' },
                { time: '10:00', title: 'Reminder 2' },
                { time: '11:00', title: 'Reminder 3' },
                { time: '12:00', title: 'Reminder 4' },
                { time: '13:00', title: 'Reminder 5' }
            ]);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Reminder 1');
            expect(output).toContain('Reminder 2');
            expect(output).toContain('Reminder 3');
            expect(output).not.toContain('Reminder 4');
            expect(output).not.toContain('Reminder 5');
        });

        test('should not display reminders section when no reminders', () => {
            mockDashboard.getEntry.mockReturnValue({ mood: 8 });
            mockGoalManager.getGoals.mockReturnValue([]);
            mockReminderManager.getReminders.mockReturnValue([]);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).not.toContain('Active Reminders:');
        });

        test('should display complete summary with all sections', () => {
            mockDashboard.getEntry.mockReturnValue({
                mood: 8,
                sleep_hours: 7,
                exercise_minutes: 30
            });
            mockGoalManager.getGoals.mockReturnValue([
                { title: 'Goal 1', progress: { percentage: 50, streak: 3 } }
            ]);
            mockReminderManager.getReminders.mockReturnValue([
                { time: '09:00', title: 'Reminder 1' }
            ]);

            consoleSpy.mockClear();
            automationManager.generateDailySummary();

            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Daily Summary');
            expect(output).toContain('Mood: 8/10');
            expect(output).toContain('Sleep: 7 hours');
            expect(output).toContain('Exercise: 30 minutes');
            expect(output).toContain('Goal Progress:');
            expect(output).toContain('Active Reminders:');
        });
    });
});
