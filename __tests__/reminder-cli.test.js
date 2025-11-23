jest.mock('../reminder-manager');

const ReminderCLI = require('../reminder-cli');
const ReminderManager = require('../reminder-manager');

describe('ReminderCLI', () => {
    let cli;
    let mockManager;
    let consoleLogSpy;
    let consoleErrorSpy;
    let originalArgv;

    beforeEach(() => {
        // Save original argv
        originalArgv = process.argv;

        // Create mock manager
        mockManager = {
            createReminder: jest.fn().mockReturnValue({
                id: 'reminder-1',
                title: 'Test Reminder',
                success: true
            }),
            createMedicationReminder: jest.fn().mockReturnValue({
                id: 'med-1',
                title: 'Take Medication',
                success: true
            }),
            createExerciseReminder: jest.fn().mockReturnValue({
                id: 'ex-1',
                title: 'Exercise Reminder',
                success: true
            }),
            createSleepReminder: jest.fn().mockReturnValue({
                id: 'sleep-1',
                title: 'Sleep Reminder',
                success: true
            }),
            getDueReminders: jest.fn().mockReturnValue([]),
            markAsShown: jest.fn(),
            toggleReminder: jest.fn(),
            deleteReminder: jest.fn(),
            snoozeReminder: jest.fn(),
            dismissReminder: jest.fn(),
            displayReminders: jest.fn(),
            getComplianceStats: jest.fn().mockReturnValue({
                total: 10,
                enabled: 7,
                byType: {
                    medication: 3,
                    exercise: 2,
                    sleep: 2,
                    custom: 3
                },
                compliance: {}
            })
        };

        ReminderManager.mockImplementation(() => mockManager);

        // Spy on console methods
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Create new CLI instance
        cli = new ReminderCLI();
    });

    afterEach(() => {
        // Close readline interface
        if (cli.rl) {
            cli.rl.close();
        }

        // Restore original argv
        process.argv = originalArgv;

        // Restore console
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();

        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('creates ReminderManager instance', () => {
            expect(ReminderManager).toHaveBeenCalled();
            expect(cli.manager).toBe(mockManager);
        });

        test('creates readline interface', () => {
            expect(cli.rl).toBeDefined();
            expect(cli.rl.close).toBeDefined();
        });
    });

    describe('showHelp', () => {
        test('displays help information', () => {
            cli.showHelp();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Smart Notifications & Reminders');
            expect(output).toContain('COMMANDS:');
            expect(output).toContain('list');
            expect(output).toContain('create');
            expect(output).toContain('check');
        });
    });

    describe('prompt', () => {
        test('returns user input as a promise', async () => {
            const mockQuestion = jest.fn((q, cb) => cb('  test input  '));
            cli.rl.question = mockQuestion;

            const result = await cli.prompt('Question: ');

            expect(result).toBe('test input');
            expect(mockQuestion).toHaveBeenCalledWith('Question: ', expect.any(Function));
        });

        test('trims whitespace from input', async () => {
            cli.rl.question = jest.fn((q, cb) => cb('\n  answer  \n'));

            const result = await cli.prompt('Q: ');

            expect(result).toBe('answer');
        });
    });

    describe('listReminders', () => {
        test('calls displayReminders', () => {
            cli.listReminders();

            expect(mockManager.displayReminders).toHaveBeenCalled();
        });
    });

    describe('checkReminders', () => {
        test('displays message when no due reminders', () => {
            cli.checkReminders();

            expect(mockManager.getDueReminders).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No due reminders');
        });

        test('displays due reminders and marks them', () => {
            mockManager.getDueReminders.mockReturnValue([
                { id: 'r1', title: 'Reminder 1', time: '09:00' },
                { id: 'r2', title: 'Reminder 2', time: '14:00' }
            ]);

            cli.checkReminders();

            expect(mockManager.getDueReminders).toHaveBeenCalled();
            expect(mockManager.markAsShown).toHaveBeenCalledWith('r1');
            expect(mockManager.markAsShown).toHaveBeenCalledWith('r2');
        });
    });

    describe('createReminder', () => {
        beforeEach(() => {
            cli.prompt = jest.fn()
                .mockResolvedValueOnce('Test Reminder')    // title
                .mockResolvedValueOnce('daily')            // frequency
                .mockResolvedValueOnce('09:00')            // time
                .mockResolvedValueOnce('Test notes');      // notes
        });

        test('creates reminder with prompts', async () => {
            await cli.createReminder();

            expect(cli.prompt).toHaveBeenCalled();
            expect(mockManager.createReminder).toHaveBeenCalled();
        });
    });

    describe('createMedicationReminder', () => {
        beforeEach(() => {
            cli.prompt = jest.fn()
                .mockResolvedValueOnce('Aspirin')        // medication name
                .mockResolvedValueOnce('09:00')          // time
                .mockResolvedValueOnce('daily')          // frequency
                .mockResolvedValueOnce('With food');     // notes
        });

        test('creates medication reminder', async () => {
            await cli.createMedicationReminder();

            expect(cli.prompt).toHaveBeenCalled();
            expect(mockManager.createMedicationReminder).toHaveBeenCalled();
        });
    });

    describe('createExerciseReminder', () => {
        beforeEach(() => {
            cli.prompt = jest.fn()
                .mockResolvedValueOnce('Morning Workout') // activity
                .mockResolvedValueOnce('07:00')           // time
                .mockResolvedValueOnce('daily')           // frequency
                .mockResolvedValueOnce('30 min cardio');  // notes
        });

        test('creates exercise reminder', async () => {
            await cli.createExerciseReminder();

            expect(cli.prompt).toHaveBeenCalled();
            expect(mockManager.createExerciseReminder).toHaveBeenCalled();
        });
    });

    describe('createSleepReminder', () => {
        beforeEach(() => {
            cli.prompt = jest.fn()
                .mockResolvedValueOnce('22:00')           // bedtime
                .mockResolvedValueOnce('daily')           // frequency
                .mockResolvedValueOnce('Wind down');      // notes
        });

        test('creates sleep reminder', async () => {
            await cli.createSleepReminder();

            expect(cli.prompt).toHaveBeenCalled();
            expect(mockManager.createSleepReminder).toHaveBeenCalled();
        });
    });

    describe('toggleReminder', () => {
        test('toggles reminder by id', () => {
            cli.toggleReminder('reminder-123');

            expect(mockManager.toggleReminder).toHaveBeenCalledWith('reminder-123');
        });

        test('handles errors gracefully', () => {
            mockManager.toggleReminder.mockImplementation(() => {
                throw new Error('Toggle failed');
            });

            cli.toggleReminder('reminder-123');

            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('deleteReminder', () => {
        test('deletes reminder by id', () => {
            cli.deleteReminder('reminder-456');

            expect(mockManager.deleteReminder).toHaveBeenCalledWith('reminder-456');
        });

        test('handles errors gracefully', () => {
            mockManager.deleteReminder.mockImplementation(() => {
                throw new Error('Delete failed');
            });

            cli.deleteReminder('reminder-456');

            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('snoozeReminder', () => {
        test('snoozes reminder with default minutes', () => {
            cli.snoozeReminder('reminder-789');

            expect(mockManager.snoozeReminder).toHaveBeenCalledWith('reminder-789', 15);
        });

        test('snoozes reminder with custom minutes', () => {
            cli.snoozeReminder('reminder-789', 30);

            expect(mockManager.snoozeReminder).toHaveBeenCalledWith('reminder-789', 30);
        });

        test('handles errors gracefully', () => {
            mockManager.snoozeReminder.mockImplementation(() => {
                throw new Error('Snooze failed');
            });

            cli.snoozeReminder('reminder-789');

            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('dismissReminder', () => {
        test('dismisses reminder by id', () => {
            cli.dismissReminder('reminder-999');

            expect(mockManager.dismissReminder).toHaveBeenCalledWith('reminder-999');
        });

        test('handles errors gracefully', () => {
            mockManager.dismissReminder.mockImplementation(() => {
                throw new Error('Dismiss failed');
            });

            cli.dismissReminder('reminder-999');

            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('showStats', () => {
        test('displays compliance statistics', () => {
            cli.showStats();

            expect(mockManager.getComplianceStats).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Compliance Statistics');
        });

        test('shows correct stats', () => {
            mockManager.getComplianceStats.mockReturnValue({
                total: 15,
                enabled: 12,
                byType: {
                    medication: 5,
                    exercise: 4,
                    sleep: 3,
                    custom: 3
                },
                compliance: {}
            });

            cli.showStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('15');
            expect(output).toContain('12');
        });
    });

    describe('run', () => {
        test('runs help by default', async () => {
            process.argv = ['node', 'reminder-cli.js'];
            await cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Smart Notifications & Reminders');
        });

        test('runs list command', async () => {
            process.argv = ['node', 'reminder-cli.js', 'list'];
            await cli.run();

            expect(mockManager.displayReminders).toHaveBeenCalled();
        });

        test('runs check command', async () => {
            process.argv = ['node', 'reminder-cli.js', 'check'];
            await cli.run();

            expect(mockManager.getDueReminders).toHaveBeenCalled();
        });

        test('runs create command', async () => {
            cli.prompt = jest.fn()
                .mockResolvedValueOnce('Title')
                .mockResolvedValueOnce('daily')
                .mockResolvedValueOnce('09:00')
                .mockResolvedValueOnce('Notes');

            process.argv = ['node', 'reminder-cli.js', 'create'];
            await cli.run();

            expect(cli.prompt).toHaveBeenCalled();
        });

        test('runs medication command', async () => {
            cli.prompt = jest.fn()
                .mockResolvedValueOnce('Med')
                .mockResolvedValueOnce('09:00')
                .mockResolvedValueOnce('daily')
                .mockResolvedValueOnce('Notes');

            process.argv = ['node', 'reminder-cli.js', 'medication'];
            await cli.run();

            expect(cli.prompt).toHaveBeenCalled();
        });

        test('runs toggle command', async () => {
            process.argv = ['node', 'reminder-cli.js', 'toggle', 'r-123'];
            await cli.run();

            expect(mockManager.toggleReminder).toHaveBeenCalledWith('r-123');
        });

        test('runs delete command', async () => {
            process.argv = ['node', 'reminder-cli.js', 'delete', 'r-456'];
            await cli.run();

            expect(mockManager.deleteReminder).toHaveBeenCalledWith('r-456');
        });

        test('runs snooze command with default minutes', async () => {
            process.argv = ['node', 'reminder-cli.js', 'snooze', 'r-789'];
            await cli.run();

            expect(mockManager.snoozeReminder).toHaveBeenCalledWith('r-789', 15);
        });

        test('runs snooze command with custom minutes', async () => {
            process.argv = ['node', 'reminder-cli.js', 'snooze', 'r-789', '30'];
            await cli.run();

            expect(mockManager.snoozeReminder).toHaveBeenCalledWith('r-789', 30);
        });

        test('runs stats command', async () => {
            process.argv = ['node', 'reminder-cli.js', 'stats'];
            await cli.run();

            expect(mockManager.getComplianceStats).toHaveBeenCalled();
        });

        test('runs help command', async () => {
            process.argv = ['node', 'reminder-cli.js', 'help'];
            await cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Smart Notifications & Reminders');
        });
    });

    describe('module export', () => {
        test('exports ReminderCLI class', () => {
            expect(ReminderCLI).toBeDefined();
            expect(typeof ReminderCLI).toBe('function');
        });
    });
});
