jest.mock('../automation-manager');

const AutomationCLI = require('../automation-cli');
const AutomationManager = require('../automation-manager');

describe('AutomationCLI', () => {
    let cli;
    let mockAutomation;
    let consoleLogSpy;
    let consoleErrorSpy;
    let originalArgv;

    beforeEach(() => {
        // Save original argv
        originalArgv = process.argv;

        // Create mock automation manager
        mockAutomation = {
            start: jest.fn(),
            stop: jest.fn(),
            getStatus: jest.fn().mockReturnValue({
                enabled: true,
                scheduledTasks: 4,
                workflows: 5,
                activeWorkflows: 3
            }),
            listWorkflows: jest.fn(),
            generateDailySummary: jest.fn(),
            addSmartReminder: jest.fn(),
            executeWorkflows: jest.fn()
        };

        AutomationManager.mockImplementation(() => mockAutomation);

        // Spy on console methods
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Clear any timers
        jest.clearAllTimers();
        jest.useFakeTimers();

        // Create new CLI instance
        cli = new AutomationCLI();
    });

    afterEach(() => {
        // Restore original argv
        process.argv = originalArgv;

        // Restore console
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();

        // Clear timers
        jest.clearAllTimers();
        jest.useRealTimers();

        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('creates AutomationManager instance', () => {
            expect(AutomationManager).toHaveBeenCalled();
            expect(cli.automation).toBe(mockAutomation);
        });
    });

    describe('showHelp', () => {
        test('displays help information', () => {
            cli.showHelp();

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Automation & Workflows System');
            expect(output).toContain('COMMANDS:');
            expect(output).toContain('start');
            expect(output).toContain('status');
            expect(output).toContain('workflows');
            expect(output).toContain('summary');
        });
    });

    describe('start', () => {
        test('starts automation system', () => {
            cli.start();

            expect(mockAutomation.start).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalled();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Scheduled Tasks');
            expect(output).toContain('Daily check-in');
            expect(output).toContain('Weekly report');
        });

        test('sets up workflow execution interval', () => {
            const setIntervalSpy = jest.spyOn(global, 'setInterval');

            cli.start();

            expect(setIntervalSpy).toHaveBeenCalled();
            expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

            setIntervalSpy.mockRestore();
        });

        test('executes workflows on interval', () => {
            cli.start();

            // Initially not called
            expect(mockAutomation.executeWorkflows).not.toHaveBeenCalled();

            // Fast-forward 60 seconds
            jest.advanceTimersByTime(60000);
            expect(mockAutomation.executeWorkflows).toHaveBeenCalledTimes(1);

            // Fast-forward another 60 seconds
            jest.advanceTimersByTime(60000);
            expect(mockAutomation.executeWorkflows).toHaveBeenCalledTimes(2);
        });

        test('handles errors gracefully', () => {
            mockAutomation.start.mockImplementation(() => {
                throw new Error('Start failed');
            });

            cli.start();

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error starting automation');
        });
    });

    describe('stop', () => {
        test('stops automation system', () => {
            cli.stop();

            expect(mockAutomation.stop).toHaveBeenCalled();
        });

        test('handles errors gracefully', () => {
            mockAutomation.stop.mockImplementation(() => {
                throw new Error('Stop failed');
            });

            cli.stop();

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error stopping automation');
        });
    });

    describe('showStatus', () => {
        test('displays status when running', () => {
            cli.showStatus();

            expect(mockAutomation.getStatus).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalled();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Automation System Status');
            expect(output).toContain('✅ Running');
            expect(output).toContain('Scheduled Tasks: 4');
            expect(output).toContain('Total Workflows: 5');
            expect(output).toContain('Active Workflows: 3');
        });

        test('displays status when stopped', () => {
            mockAutomation.getStatus.mockReturnValue({
                enabled: false,
                scheduledTasks: 0,
                workflows: 5,
                activeWorkflows: 0
            });

            cli.showStatus();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('⏸️  Stopped');
            expect(output).toContain('Scheduled Tasks: 0');
        });
    });

    describe('listWorkflows', () => {
        test('calls automation.listWorkflows', () => {
            cli.listWorkflows();

            expect(mockAutomation.listWorkflows).toHaveBeenCalled();
        });
    });

    describe('showSummary', () => {
        test('calls automation.generateDailySummary', () => {
            cli.showSummary();

            expect(mockAutomation.generateDailySummary).toHaveBeenCalled();
        });
    });

    describe('addSmartReminder', () => {
        test('adds both default smart reminders', async () => {
            await cli.addSmartReminder();

            expect(mockAutomation.addSmartReminder).toHaveBeenCalledTimes(2);
            expect(mockAutomation.addSmartReminder).toHaveBeenCalledWith({ type: 'low_sleep' });
            expect(mockAutomation.addSmartReminder).toHaveBeenCalledWith({ type: 'goal_at_risk' });

            expect(consoleLogSpy).toHaveBeenCalled();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Add Smart Reminder');
            expect(output).toContain('Smart reminders configured');
        });
    });

    describe('run', () => {
        test('runs help command by default', () => {
            process.argv = ['node', 'automation-cli.js'];
            cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Automation & Workflows System');
        });

        test('runs start command', () => {
            process.argv = ['node', 'automation-cli.js', 'start'];
            cli.run();

            expect(mockAutomation.start).toHaveBeenCalled();
        });

        test('runs stop command', () => {
            process.argv = ['node', 'automation-cli.js', 'stop'];
            cli.run();

            expect(mockAutomation.stop).toHaveBeenCalled();
        });

        test('runs status command', () => {
            process.argv = ['node', 'automation-cli.js', 'status'];
            cli.run();

            expect(mockAutomation.getStatus).toHaveBeenCalled();
        });

        test('runs workflows command', () => {
            process.argv = ['node', 'automation-cli.js', 'workflows'];
            cli.run();

            expect(mockAutomation.listWorkflows).toHaveBeenCalled();
        });

        test('runs summary command', () => {
            process.argv = ['node', 'automation-cli.js', 'summary'];
            cli.run();

            expect(mockAutomation.generateDailySummary).toHaveBeenCalled();
        });

        test('runs add-smart-reminder command', () => {
            process.argv = ['node', 'automation-cli.js', 'add-smart-reminder'];
            cli.run();

            // addSmartReminder is called synchronously even though it's async
            expect(mockAutomation.addSmartReminder).toHaveBeenCalled();
        });

        test('runs help command with "help" argument', () => {
            process.argv = ['node', 'automation-cli.js', 'help'];
            cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Automation & Workflows System');
        });

        test('runs help command with "--help" flag', () => {
            process.argv = ['node', 'automation-cli.js', '--help'];
            cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Automation & Workflows System');
        });

        test('runs help command with "-h" flag', () => {
            process.argv = ['node', 'automation-cli.js', '-h'];
            cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Automation & Workflows System');
        });

        test('runs help for unknown command', () => {
            process.argv = ['node', 'automation-cli.js', 'unknown'];
            cli.run();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Automation & Workflows System');
        });

        test('handles uppercase commands', () => {
            process.argv = ['node', 'automation-cli.js', 'STATUS'];
            cli.run();

            expect(mockAutomation.getStatus).toHaveBeenCalled();
        });

        test('handles mixed case commands', () => {
            process.argv = ['node', 'automation-cli.js', 'Start'];
            cli.run();

            expect(mockAutomation.start).toHaveBeenCalled();
        });
    });

    describe('module export', () => {
        test('exports AutomationCLI class', () => {
            expect(AutomationCLI).toBeDefined();
            expect(typeof AutomationCLI).toBe('function');
        });

        test('can create multiple instances', () => {
            // Reset mock to create new instances
            AutomationManager.mockImplementation(() => ({
                start: jest.fn(),
                stop: jest.fn(),
                getStatus: jest.fn(),
                listWorkflows: jest.fn(),
                generateDailySummary: jest.fn(),
                addSmartReminder: jest.fn(),
                executeWorkflows: jest.fn()
            }));

            const cli1 = new AutomationCLI();
            const cli2 = new AutomationCLI();

            expect(cli1).not.toBe(cli2);
            expect(cli1.automation).not.toBe(cli2.automation);
        });
    });
});
