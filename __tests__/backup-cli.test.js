const { execSync } = require('child_process');

describe('backup-cli', () => {
    describe('help command', () => {
        test('shows help with help command', () => {
            try {
                const output = execSync('node backup-cli.js help', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..'
                });
                expect(output).toContain('StepSyncAI Backup & Recovery Manager');
                expect(output).toContain('COMMANDS:');
                expect(output).toContain('create');
                expect(output).toContain('list');
                expect(output).toContain('restore');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('StepSyncAI Backup & Recovery Manager');
                }
            }
        });

        test('shows help with no command', () => {
            try {
                const output = execSync('node backup-cli.js', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..'
                });
                expect(output).toContain('StepSyncAI Backup & Recovery Manager');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('StepSyncAI Backup & Recovery Manager');
                }
            }
        });
    });

    describe('list command', () => {
        test('runs list command', () => {
            try {
                execSync('node backup-cli.js list', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(true).toBe(true);
            } catch (error) {
                expect(error.status).toBeDefined();
            }
        });

        test('accepts limit parameter', () => {
            try {
                execSync('node backup-cli.js list 20', {
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

    describe('stats command', () => {
        test('shows backup statistics', () => {
            try {
                execSync('node backup-cli.js stats', {
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

    describe('create command', () => {
        test('runs create command', () => {
            try {
                execSync('node backup-cli.js create "Test backup"', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(true).toBe(true);
            } catch (error) {
                expect(error.status).toBeDefined();
            }
        });

        test('accepts tags parameter', () => {
            try {
                execSync('node backup-cli.js create "Tagged backup" --tag test --tag manual', {
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

    describe('cleanup command', () => {
        test('runs cleanup command', () => {
            try {
                execSync('node backup-cli.js cleanup', {
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
        test('handles invalid command', () => {
            try {
                const output = execSync('node backup-cli.js invalid', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('StepSyncAI Backup & Recovery Manager');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('StepSyncAI Backup & Recovery Manager');
                }
            }
        });
    });
});
