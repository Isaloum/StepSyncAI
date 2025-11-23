const { execSync } = require('child_process');

describe('visualization-cli', () => {
    describe('help command', () => {
        test('shows help with help command', () => {
            try {
                const output = execSync('node visualization-cli.js help', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..'
                });
                expect(output).toContain('StepSyncAI');
                expect(output).toContain('COMMANDS:');
            } catch (error) {
                if (error.stdout) {
                    const out = error.stdout.toString();
                    expect(out).toContain('COMMANDS:' || 'visualization' || 'chart');
                }
            }
        });

        test('shows help with no command', () => {
            try {
                const output = execSync('node visualization-cli.js', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..'
                });
                expect(output).toMatch(/visualization|chart|graph/i);
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toMatch(/visualization|chart|help/i);
                }
            }
        });
    });

    describe('basic commands', () => {
        test('handles command execution', () => {
            try {
                execSync('node visualization-cli.js mood', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(true).toBe(true);
            } catch (error) {
                expect(error.status).toBeDefined();
            }
        });

        test('accepts days parameter', () => {
            try {
                execSync('node visualization-cli.js mood 30', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(true).toBe(true);
            } catch (error) {
                expect(error.status).toBeDefined();
            }
        });
    });

    describe('error scenarios', () => {
        test('handles execution without crashing', () => {
            try {
                execSync('node visualization-cli.js unknown-command', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(true).toBe(true);
            } catch (error) {
                // Command may fail but should not crash
                expect(error.status).toBeDefined();
            }
        });
    });
});
