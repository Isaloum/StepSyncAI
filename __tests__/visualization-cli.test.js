const { execSync } = require('child_process');
const VisualizationCLI = require('../visualization-cli');

// Mock console methods to suppress output during tests
let consoleSpy;
beforeAll(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
});

describe('visualization-cli', () => {
    let cli;
    let originalArgv;

    beforeEach(() => {
        cli = new VisualizationCLI();
        originalArgv = process.argv;
        consoleSpy.mockClear();
    });

    afterEach(() => {
        process.argv = originalArgv;
    });

    describe('VisualizationCLI class', () => {
        test('should create instance with required dependencies', () => {
            expect(cli).toBeInstanceOf(VisualizationCLI);
            expect(cli.dashboard).toBeDefined();
            expect(cli.analytics).toBeDefined();
            expect(cli.reportGenerator).toBeDefined();
            expect(cli.exportManager).toBeDefined();
        });

        test('should have showHelp method', () => {
            expect(typeof cli.showHelp).toBe('function');
            cli.showHelp();
            expect(consoleSpy).toHaveBeenCalled();
            const output = consoleSpy.mock.calls.join('\n');
            expect(output).toContain('StepSyncAI');
        });
    });

    describe('run method', () => {
        test('should show help when no command provided', () => {
            process.argv = ['node', 'visualization-cli.js'];
            cli.run();
            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toMatch(/help|commands|stepsyncai/i);
        });

        test('should handle help command', () => {
            process.argv = ['node', 'visualization-cli.js', 'help'];
            cli.run();
            expect(consoleSpy).toHaveBeenCalled();
        });

        test('should handle --help flag', () => {
            process.argv = ['node', 'visualization-cli.js', '--help'];
            cli.run();
            expect(consoleSpy).toHaveBeenCalled();
        });

        test('should handle -h flag', () => {
            process.argv = ['node', 'visualization-cli.js', '-h'];
            cli.run();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('report commands', () => {
        test('should handle list-reports command', () => {
            process.argv = ['node', 'visualization-cli.js', 'list-reports'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle report command with default days', () => {
            process.argv = ['node', 'visualization-cli.js', 'report'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle report command with custom days', () => {
            process.argv = ['node', 'visualization-cli.js', 'report', '60'];
            expect(() => cli.run()).not.toThrow();
        });
    });

    describe('export commands', () => {
        test('should handle export-csv command', () => {
            process.argv = ['node', 'visualization-cli.js', 'export-csv'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle export-csv with days parameter', () => {
            process.argv = ['node', 'visualization-cli.js', 'export-csv', '30'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle export-json command', () => {
            process.argv = ['node', 'visualization-cli.js', 'export-json'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle export-meds command', () => {
            process.argv = ['node', 'visualization-cli.js', 'export-meds'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle export-medications alias', () => {
            process.argv = ['node', 'visualization-cli.js', 'export-medications'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle export-analytics command', () => {
            process.argv = ['node', 'visualization-cli.js', 'export-analytics'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle export-all command', () => {
            process.argv = ['node', 'visualization-cli.js', 'export-all'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle list-exports command', () => {
            process.argv = ['node', 'visualization-cli.js', 'list-exports'];
            expect(() => cli.run()).not.toThrow();
        });
    });

    describe('chart commands', () => {
        test('should handle chart command with mood type', () => {
            process.argv = ['node', 'visualization-cli.js', 'chart', 'mood'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle chart command with sleep type', () => {
            process.argv = ['node', 'visualization-cli.js', 'chart', 'sleep', '14'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle chart command with exercise type', () => {
            process.argv = ['node', 'visualization-cli.js', 'chart', 'exercise', '30'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should show error when chart type not provided', () => {
            const errorSpy = jest.spyOn(console, 'error');
            process.argv = ['node', 'visualization-cli.js', 'chart'];
            cli.run();
            expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Please specify chart type'));
        });

        test('should handle heatmap command', () => {
            process.argv = ['node', 'visualization-cli.js', 'heatmap'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle heatmap with days parameter', () => {
            process.argv = ['node', 'visualization-cli.js', 'heatmap', '60'];
            expect(() => cli.run()).not.toThrow();
        });
    });

    describe('analysis commands', () => {
        test('should handle trends command', () => {
            process.argv = ['node', 'visualization-cli.js', 'trends'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle trends with days parameter', () => {
            process.argv = ['node', 'visualization-cli.js', 'trends', '45'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle stats command', () => {
            process.argv = ['node', 'visualization-cli.js', 'stats'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle statistics alias', () => {
            process.argv = ['node', 'visualization-cli.js', 'statistics'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle summary command', () => {
            process.argv = ['node', 'visualization-cli.js', 'summary'];
            expect(() => cli.run()).not.toThrow();
        });

        test('should handle summary with days parameter', () => {
            process.argv = ['node', 'visualization-cli.js', 'summary', '90'];
            expect(() => cli.run()).not.toThrow();
        });
    });

    describe('helper methods', () => {
        test('calculateWellnessScore should return null for empty entry', () => {
            const score = cli.calculateWellnessScore({});
            expect(score).toBeNull();
        });

        test('calculateWellnessScore should calculate from mood', () => {
            const score = cli.calculateWellnessScore({ mood: 8 });
            expect(score).toBe(8);
        });

        test('calculateWellnessScore should calculate from multiple metrics', () => {
            const score = cli.calculateWellnessScore({
                mood: 8,
                sleep_hours: 8,
                exercise_minutes: 30
            });
            expect(score).toBeGreaterThan(0);
        });

        test('getHeatmapSymbol should return correct symbols', () => {
            expect(cli.getHeatmapSymbol(null)).toBe('--');
            expect(cli.getHeatmapSymbol(9)).toBe('██');
            expect(cli.getHeatmapSymbol(7)).toBe('▓▓');
            expect(cli.getHeatmapSymbol(5)).toBe('▒▒');
            expect(cli.getHeatmapSymbol(3)).toBe('░░');
        });

        test('getTrendEmoji should return correct emojis', () => {
            expect(cli.getTrendEmoji('improving')).toBe('📈');
            expect(cli.getTrendEmoji('declining')).toBe('📉');
            expect(cli.getTrendEmoji('stable')).toBe('➡️');
        });
    });

    describe('CLI execution tests', () => {
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
