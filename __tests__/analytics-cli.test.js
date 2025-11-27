const { runCommand, showHelp } = require('../analytics-cli');
const DailyDashboard = require('../daily-dashboard');
const fs = require('fs');

// Mock console.log to capture output
let consoleOutput = [];
const originalLog = console.log;

beforeEach(() => {
    consoleOutput = [];
    console.log = (...args) => {
        consoleOutput.push(args.join(' '));
    };

    // Clean up any test data files
    const testFiles = [
        'mental-health-data.json',
        'medications.json',
        'sleep-data.json',
        'exercise-data.json',
        'wellness-dashboard.json'
    ];
    testFiles.forEach(file => {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (error) {
            // Ignore errors if file was already deleted
        }
    });
});

afterEach(() => {
    console.log = originalLog;
});

describe('analytics-cli', () => {
    describe('showHelp', () => {
        test('displays help information', () => {
            showHelp();
            const output = consoleOutput.join('\n');
            expect(output).toContain('StepSyncAI Advanced Analytics');
            expect(output).toContain('COMMANDS:');
            expect(output).toContain('dashboard');
            expect(output).toContain('correlations');
            expect(output).toContain('trends');
            expect(output).toContain('sleep-exercise');
            expect(output).toContain('mood-sleep');
            expect(output).toContain('mood-exercise');
            expect(output).toContain('predict');
            expect(output).toContain('anomalies');
            expect(output).toContain('report');
        });

        test('shows examples', () => {
            showHelp();
            const output = consoleOutput.join('\n');
            expect(output).toContain('EXAMPLES:');
            expect(output).toContain('node analytics-cli.js dashboard 30');
        });

        test('shows default behavior', () => {
            showHelp();
            const output = consoleOutput.join('\n');
            expect(output).toContain('DEFAULT:');
            expect(output).toContain('Days defaults to 30');
        });
    });

    describe('runCommand', () => {
        describe('dashboard command', () => {
            test('runs dashboard command', async () => {
                await runCommand('dashboard', []);
                expect(consoleOutput.length).toBeGreaterThan(0);
            });

            test('runs dashboard with custom days', async () => {
                await runCommand('dashboard', ['60']);
                expect(consoleOutput.length).toBeGreaterThan(0);
            });

            test('uses default days when not specified', async () => {
                await runCommand('dashboard', []);
                expect(consoleOutput.length).toBeGreaterThan(0);
            });
        });

        describe('correlations command', () => {
            test('shows correlation analysis', async () => {
                await runCommand('correlations', ['30']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Correlation Analysis');
                expect(output).toContain('Sleep Quality & Exercise');
                expect(output).toContain('Mood & Sleep Quality');
                expect(output).toContain('Mood & Exercise');
            });

            test('uses default days', async () => {
                await runCommand('correlations', []);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Correlation Analysis');
            });
        });

        describe('trends command', () => {
            test('shows wellness trends', async () => {
                await runCommand('trends', ['30']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Wellness Trends');
            });

            test('handles insufficient data', async () => {
                await runCommand('trends', []);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Wellness Trends');
            });
        });

        describe('sleep-exercise command', () => {
            test('shows sleep-exercise correlation', async () => {
                await runCommand('sleep-exercise', ['30']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Sleep Quality & Exercise');
            });
        });

        describe('mood-sleep command', () => {
            test('shows mood-sleep correlation', async () => {
                await runCommand('mood-sleep', ['30']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Mood & Sleep Quality');
            });
        });

        describe('mood-exercise command', () => {
            test('shows mood-exercise correlation', async () => {
                await runCommand('mood-exercise', ['30']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Mood & Exercise');
            });
        });

        describe('predict command', () => {
            test('shows wellness predictions', async () => {
                await runCommand('predict', ['30']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Wellness Predictions');
            });

            test('accepts custom days ahead parameter', async () => {
                await runCommand('predict', ['30', '5']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Wellness Predictions');
            });

            test('uses default days ahead when not specified', async () => {
                await runCommand('predict', ['30']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Wellness Predictions');
            });
        });

        describe('anomalies command', () => {
            test('shows anomaly detection', async () => {
                await runCommand('anomalies', ['30']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Anomaly Detection');
            });
        });

        describe('report command', () => {
            test('generates comprehensive report', async () => {
                await runCommand('report', ['30']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Comprehensive Analytics Report');
                expect(output).toContain('Correlations:');
            });
        });

        describe('help commands', () => {
            test('shows help for "help" command', async () => {
                await runCommand('help', []);
                const output = consoleOutput.join('\n');
                expect(output).toContain('StepSyncAI Advanced Analytics');
            });

            test('shows help for "--help" flag', async () => {
                await runCommand('--help', []);
                const output = consoleOutput.join('\n');
                expect(output).toContain('StepSyncAI Advanced Analytics');
            });

            test('shows help for "-h" flag', async () => {
                await runCommand('-h', []);
                const output = consoleOutput.join('\n');
                expect(output).toContain('StepSyncAI Advanced Analytics');
            });
        });

        describe('invalid commands', () => {
            test('shows help for invalid command', async () => {
                await runCommand('invalid-command', []);
                const output = consoleOutput.join('\n');
                expect(output).toContain('StepSyncAI Advanced Analytics');
            });

            test('shows help for undefined command', async () => {
                await runCommand(undefined, []);
                const output = consoleOutput.join('\n');
                expect(output).toContain('StepSyncAI Advanced Analytics');
            });
        });

        describe('argument parsing', () => {
            test('parses numeric days argument', async () => {
                await runCommand('dashboard', ['45']);
                expect(consoleOutput.length).toBeGreaterThan(0);
            });

            test('handles non-numeric days and uses default', async () => {
                await runCommand('dashboard', ['abc']);
                expect(consoleOutput.length).toBeGreaterThan(0);
            });

            test('handles negative days and uses default', async () => {
                await runCommand('dashboard', ['-10']);
                expect(consoleOutput.length).toBeGreaterThan(0);
            });

            test('handles zero days and uses default', async () => {
                await runCommand('dashboard', ['0']);
                expect(consoleOutput.length).toBeGreaterThan(0);
            });

            test('handles empty args array', async () => {
                await runCommand('dashboard', []);
                expect(consoleOutput.length).toBeGreaterThan(0);
            });

            test('handles multiple args', async () => {
                await runCommand('predict', ['30', '7', 'extra']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Wellness Predictions');
            });
        });

        describe('edge cases', () => {
            test('handles very large days value', async () => {
                await runCommand('dashboard', ['365']);
                expect(consoleOutput.length).toBeGreaterThan(0);
            });

            test('handles very large daysAhead value', async () => {
                await runCommand('predict', ['30', '30']);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Wellness Predictions');
            });

            test('handles decimal days value', async () => {
                await runCommand('dashboard', ['30.5']);
                expect(consoleOutput.length).toBeGreaterThan(0);
            });
        });
    });
});
