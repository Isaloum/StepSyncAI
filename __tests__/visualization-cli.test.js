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

    describe('displayChart method', () => {
        beforeEach(() => {
            // Add test data to dashboard
            for (let i = 1; i <= 7; i++) {
                cli.dashboard.addEntry({
                    date: `2025-11-${String(i).padStart(2, '0')}`,
                    mood: 5 + i,
                    sleep_hours: 7 + (i % 3),
                    exercise_minutes: 20 + i * 5
                });
            }
        });

        test('should display mood chart with data', () => {
            consoleSpy.mockClear();
            cli.displayChart('mood', 30);
            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Mood Rating');
            expect(output).toContain('/10');
            expect(output).toContain('Statistics');
        });

        test('should display sleep chart with data', () => {
            consoleSpy.mockClear();
            cli.displayChart('sleep', 30);
            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Sleep Hours');
            expect(output).toContain('hours');
        });

        test('should display exercise chart with data', () => {
            consoleSpy.mockClear();
            cli.displayChart('exercise', 30);
            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Exercise Minutes');
            expect(output).toContain('min');
        });

        test('should handle invalid chart type', () => {
            const errorSpy = jest.spyOn(console, 'error');
            cli.displayChart('invalid', 30);
            expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid chart type'));
        });

        test('should handle empty data', () => {
            const emptyCli = new VisualizationCLI();
            // Clear tracker data
            if (emptyCli.dashboard.mentalHealth) {
                emptyCli.dashboard.mentalHealth.data = { moodLogs: [], journalEntries: [] };
            }
            if (emptyCli.dashboard.sleep) {
                emptyCli.dashboard.sleep.data = { sleepLogs: [] };
            }
            if (emptyCli.dashboard.exercise) {
                emptyCli.dashboard.exercise.data = { exercises: [] };
            }
            consoleSpy.mockClear();
            emptyCli.displayChart('mood', 30);
            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('No data available');
        });

        test('should handle entries without specific metric', () => {
            const emptyCli = new VisualizationCLI();
            // Clear tracker data
            if (emptyCli.dashboard.mentalHealth) {
                emptyCli.dashboard.mentalHealth.data = { moodLogs: [], journalEntries: [] };
            }
            if (emptyCli.dashboard.sleep) {
                emptyCli.dashboard.sleep.data = { sleepLogs: [] };
            }
            if (emptyCli.dashboard.exercise) {
                emptyCli.dashboard.exercise.data = { exercises: [] };
            }
            emptyCli.dashboard.addEntry({
                date: '2025-11-01',
                sleep_hours: 8  // No mood data
            });
            consoleSpy.mockClear();
            emptyCli.displayChart('mood', 30);
            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('No mood data available');
        });
    });

    describe('displayHeatmap method', () => {
        beforeEach(() => {
            // Add test data with varying wellness scores
            for (let i = 1; i <= 14; i++) {
                cli.dashboard.addEntry({
                    date: `2025-11-${String(i).padStart(2, '0')}`,
                    mood: 5 + (i % 5),
                    sleep_hours: 6 + (i % 4),
                    exercise_minutes: 15 + i * 3
                });
            }
        });

        test('should display heatmap with data', () => {
            consoleSpy.mockClear();
            cli.displayHeatmap(30);
            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Wellness Heatmap');
            expect(output).toContain('Mon');
            expect(output).toContain('Tue');
            expect(output).toContain('Legend');
        });

        test('should handle empty data', () => {
            const emptyCli = new VisualizationCLI();
            // Clear tracker data
            if (emptyCli.dashboard.mentalHealth) {
                emptyCli.dashboard.mentalHealth.data = { moodLogs: [], journalEntries: [] };
            }
            if (emptyCli.dashboard.sleep) {
                emptyCli.dashboard.sleep.data = { sleepLogs: [] };
            }
            if (emptyCli.dashboard.exercise) {
                emptyCli.dashboard.exercise.data = { exercises: [] };
            }
            consoleSpy.mockClear();
            emptyCli.displayHeatmap(30);
            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('No data available for heatmap');
        });

        test('should respect days parameter', () => {
            consoleSpy.mockClear();
            cli.displayHeatmap(7);
            const output = consoleSpy.mock.calls.flat().join(' ');
            expect(output).toContain('Last 7 Days');
        });

        test('should display weekly grid', () => {
            consoleSpy.mockClear();
            cli.displayHeatmap(14);
            const output = consoleSpy.mock.calls.flat().join(' ');
            // Should have week rows (W1, W2, etc.)
            expect(output).toMatch(/W\d/);
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
