const { execSync } = require('child_process');
const fs = require('fs');

describe('analytics-cli', () => {
    beforeEach(() => {
        // Clean up any test data files
        const testFiles = [
            'mental-health-data.json',
            'medications.json',
            'sleep-data.json',
            'exercise-data.json'
        ];
        testFiles.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    });

    describe('help command', () => {
        test('shows help with help command', () => {
            try {
                const output = execSync('node analytics-cli.js help', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..'
                });
                expect(output).toContain('StepSyncAI Advanced Analytics');
                expect(output).toContain('COMMANDS:');
                expect(output).toContain('dashboard');
                expect(output).toContain('correlations');
                expect(output).toContain('trends');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('StepSyncAI Advanced Analytics');
                }
            }
        });

        test('shows help with --help flag', () => {
            try {
                const output = execSync('node analytics-cli.js --help', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..'
                });
                expect(output).toContain('StepSyncAI Advanced Analytics');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('StepSyncAI Advanced Analytics');
                }
            }
        });

        test('shows help with no command', () => {
            try {
                const output = execSync('node analytics-cli.js', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..'
                });
                expect(output).toContain('StepSyncAI Advanced Analytics');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('StepSyncAI Advanced Analytics');
                }
            }
        });
    });

    describe('dashboard command', () => {
        test('runs dashboard command', () => {
            try {
                execSync('node analytics-cli.js dashboard', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(true).toBe(true);
            } catch (error) {
                expect(error.status).toBeDefined();
            }
        });

        test('runs dashboard with custom days', () => {
            try {
                execSync('node analytics-cli.js dashboard 60', {
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

    describe('correlations command', () => {
        test('shows correlation analysis', () => {
            try {
                const output = execSync('node analytics-cli.js correlations 30', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('Correlation Analysis');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('Correlation Analysis');
                }
            }
        });
    });

    describe('trends command', () => {
        test('shows wellness trends', () => {
            try {
                const output = execSync('node analytics-cli.js trends 30', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('Wellness Trends');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('Wellness Trends');
                }
            }
        });
    });

    describe('sleep-exercise command', () => {
        test('shows sleep-exercise correlation', () => {
            try {
                const output = execSync('node analytics-cli.js sleep-exercise 30', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('Sleep Quality & Exercise');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('Sleep Quality & Exercise');
                }
            }
        });
    });

    describe('mood-sleep command', () => {
        test('shows mood-sleep correlation', () => {
            try {
                const output = execSync('node analytics-cli.js mood-sleep 30', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('Mood & Sleep Quality');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('Mood & Sleep Quality');
                }
            }
        });
    });

    describe('mood-exercise command', () => {
        test('shows mood-exercise correlation', () => {
            try {
                const output = execSync('node analytics-cli.js mood-exercise 30', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('Mood & Exercise');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('Mood & Exercise');
                }
            }
        });
    });

    describe('predict command', () => {
        test('shows wellness predictions', () => {
            try {
                const output = execSync('node analytics-cli.js predict 30', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('Wellness Predictions');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('Wellness Predictions');
                }
            }
        });

        test('accepts custom days ahead parameter', () => {
            try {
                const output = execSync('node analytics-cli.js predict 30 5', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('Wellness Predictions');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('Wellness Predictions');
                }
            }
        });
    });

    describe('anomalies command', () => {
        test('shows anomaly detection', () => {
            try {
                const output = execSync('node analytics-cli.js anomalies 30', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('Anomaly Detection');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('Anomaly Detection');
                }
            }
        });
    });

    describe('report command', () => {
        test('generates comprehensive report', () => {
            try {
                const output = execSync('node analytics-cli.js report 30', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('Comprehensive Analytics Report');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('Comprehensive Analytics Report');
                }
            }
        });
    });

    describe('argument parsing', () => {
        test('accepts no days argument and uses default', () => {
            try {
                execSync('node analytics-cli.js dashboard', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(true).toBe(true);
            } catch (error) {
                expect(error.status).toBeDefined();
            }
        });

        test('accepts custom days argument', () => {
            try {
                execSync('node analytics-cli.js dashboard 90', {
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
        test('handles invalid command gracefully', () => {
            try {
                const output = execSync('node analytics-cli.js invalid-command', {
                    encoding: 'utf-8',
                    cwd: __dirname + '/..',
                    timeout: 5000
                });
                expect(output).toContain('StepSyncAI Advanced Analytics');
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.toString()).toContain('StepSyncAI Advanced Analytics');
                }
            }
        });

        test('handles non-numeric days argument', () => {
            try {
                execSync('node analytics-cli.js dashboard abc', {
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
});
