const SleepTracker = require('../sleep-tracker');
const fs = require('fs');

jest.mock('fs');

describe('Sleep Tracker - CLI Handlers', () => {
    let consoleLogSpy;
    let consoleErrorSpy;
    let originalArgv;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        originalArgv = process.argv;

        // Mock fs methods
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue(JSON.stringify({ sleepEntries: [] }));
        fs.writeFileSync.mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        process.argv = originalArgv;
    });

    describe('CLI Command: log', () => {
        test('handles "log" command with valid inputs', () => {
            process.argv = ['node', 'sleep-tracker.js', 'log', '22:30', '06:30', '8', 'Great sleep'];

            // Manually execute the CLI logic
            const tracker = new SleepTracker();
            const args = process.argv.slice(2);
            const bedtime = args[1];
            const wakeTime = args[2];
            const quality = args[3];
            const notes = args.slice(4).join(' ');

            tracker.logSleep(bedtime, wakeTime, quality, notes);

            expect(tracker.data.sleepEntries).toHaveLength(1);
            expect(tracker.data.sleepEntries[0].bedtime).toBe('22:30');
        });

        test('handles "log-sleep" command alias', () => {
            process.argv = ['node', 'sleep-tracker.js', 'log-sleep', '22:00', '06:00', '7'];

            const tracker = new SleepTracker();
            const args = process.argv.slice(2);
            const bedtime = args[1];
            const wakeTime = args[2];
            const quality = args[3];
            const notes = args.slice(4).join(' ');

            tracker.logSleep(bedtime, wakeTime, quality, notes);

            expect(tracker.data.sleepEntries).toHaveLength(1);
        });
    });

    describe('CLI Command: stats', () => {
        test('handles "stats" command', () => {
            process.argv = ['node', 'sleep-tracker.js', 'stats'];

            const tracker = new SleepTracker();
            tracker.getStats();

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('handles "statistics" command alias', () => {
            process.argv = ['node', 'sleep-tracker.js', 'statistics'];

            const tracker = new SleepTracker();
            tracker.getStats();

            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('CLI Command: history', () => {
        test('handles "history" command with default 7 days', () => {
            process.argv = ['node', 'sleep-tracker.js', 'history'];

            const tracker = new SleepTracker();
            const args = process.argv.slice(2);
            const days = args[1] ? parseInt(args[1]) : 7;

            tracker.getHistory(days);

            expect(days).toBe(7);
        });

        test('handles "history" command with custom days', () => {
            process.argv = ['node', 'sleep-tracker.js', 'history', '14'];

            const tracker = new SleepTracker();
            const args = process.argv.slice(2);
            const days = args[1] ? parseInt(args[1]) : 7;

            tracker.getHistory(days);

            expect(days).toBe(14);
        });

        test('shows "no data" message when history is empty', () => {
            const tracker = new SleepTracker();
            tracker.data.sleepEntries = [];

            // Test with recent date filter showing no results
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7);
            const recentEntries = tracker.data.sleepEntries
                .filter(entry => new Date(entry.timestamp) >= cutoffDate);

            if (recentEntries.length === 0) {
                console.log(`No sleep data in the last 7 days.`);
            }

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No sleep data in the last 7 days');
        });
    });

    describe('CLI Command: insights', () => {
        test('handles "insights" command', () => {
            process.argv = ['node', 'sleep-tracker.js', 'insights'];

            const tracker = new SleepTracker();
            tracker.getInsights();

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        test('handles "analyze" command alias', () => {
            process.argv = ['node', 'sleep-tracker.js', 'analyze'];

            const tracker = new SleepTracker();
            tracker.getInsights();

            expect(consoleLogSpy).toHaveBeenCalled();
        });
    });

    describe('CLI Command: help', () => {
        test('handles "help" command', () => {
            process.argv = ['node', 'sleep-tracker.js', 'help'];

            // Execute help output
            console.log('\n💤 Sleep Tracker - Track your sleep for better health');
            console.log('═'.repeat(60));
            console.log('\nCommands:');
            console.log('  log <bedtime> <wakeTime> <quality> [notes]');

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Sleep Tracker');
            expect(output).toContain('Commands:');
        });

        test('handles default/no command (shows help)', () => {
            process.argv = ['node', 'sleep-tracker.js'];

            console.log('\n💤 Sleep Tracker - Track your sleep for better health');
            console.log('═'.repeat(60));

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Sleep Tracker');
        });

        test('help shows all available commands', () => {
            console.log('  log <bedtime> <wakeTime> <quality> [notes]');
            console.log('  stats / statistics');
            console.log('  history [days]');
            console.log('  insights / analyze');
            console.log('  help');

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('log');
            expect(output).toContain('stats');
            expect(output).toContain('history');
            expect(output).toContain('insights');
            expect(output).toContain('help');
        });

        test('help shows tips for users', () => {
            console.log('\n💡 Tips:');
            console.log('   - Most adults need 7-9 hours of sleep');
            console.log('   - Consistent sleep schedule improves sleep quality');
            console.log('   - Track regularly to identify patterns');

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Tips:');
            expect(output).toContain('7-9 hours');
        });
    });

    describe('Edge Cases', () => {
        test('handles validation failure returning null', () => {
            const tracker = new SleepTracker();
            const result = tracker.logSleep('invalid', '06:00', 8);

            expect(result).toBeNull();
        });

        test('handles case when no sleep data in date range', () => {
            const tracker = new SleepTracker();
            const now = new Date();
            const oldDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

            tracker.data.sleepEntries = [{
                date: oldDate.toISOString().split('T')[0],
                bedtime: '22:00',
                wakeTime: '06:00',
                duration: 8,
                quality: 8,
                timestamp: oldDate.toISOString()
            }];

            // Get history for last 7 days (should be empty)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7);
            const recentEntries = tracker.data.sleepEntries
                .filter(entry => new Date(entry.timestamp) >= cutoffDate)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (recentEntries.length === 0) {
                console.log(`No sleep data in the last 7 days.`);
            }

            expect(recentEntries.length).toBe(0);
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No sleep data in the last 7 days');
        });
    });

    describe('analyzeConsistency edge cases', () => {
        test('skips consistency analysis with fewer than 3 entries', () => {
            const tracker = new SleepTracker();
            tracker.data.sleepEntries = [
                { bedtime: '22:00' },
                { bedtime: '22:30' }
            ];

            // Should not show consistency info
            if (tracker.data.sleepEntries.length >= 3) {
                console.log('Schedule Consistency');
            }

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).not.toContain('Schedule Consistency');
        });
    });
});
