const fs = require('fs');
const ExerciseTracker = require('../exercise-tracker');

jest.mock('fs');

describe('Exercise Tracker - CLI Handlers', () => {
    let tracker;
    let consoleLogSpy;
    let consoleErrorSpy;
    let originalArgv;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        originalArgv = process.argv;

        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue(JSON.stringify({ exercises: [] }));
        fs.writeFileSync.mockImplementation(() => {});

        tracker = new ExerciseTracker();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        process.argv = originalArgv;
    });

    describe('CLI Command: log', () => {
        test('handles "log" command with all parameters', () => {
            process.argv = ['node', 'exercise-tracker.js', 'log', 'Running', '30', 'high', 'Morning jog'];

            const args = process.argv.slice(2);
            const type = args[1];
            const duration = args[2];
            const intensity = args[3] || 'moderate';
            const notes = args.slice(4).join(' ');

            tracker.logExercise(type, duration, intensity, notes);

            expect(tracker.data.exercises).toHaveLength(1);
            expect(tracker.data.exercises[0].type).toBe('Running');
            expect(tracker.data.exercises[0].intensity).toBe('high');
        });

        test('handles "log" command with default intensity', () => {
            process.argv = ['node', 'exercise-tracker.js', 'log', 'Cycling', '45'];

            const args = process.argv.slice(2);
            const type = args[1];
            const duration = args[2];
            const intensity = args[3] || 'moderate';
            const notes = args.slice(4).join(' ');

            tracker.logExercise(type, duration, intensity, notes);

            expect(tracker.data.exercises).toHaveLength(1);
            expect(tracker.data.exercises[0].intensity).toBe('moderate');
        });

        test('handles "log" command without notes', () => {
            process.argv = ['node', 'exercise-tracker.js', 'log', 'Yoga', '60', 'low'];

            const args = process.argv.slice(2);
            const type = args[1];
            const duration = args[2];
            const intensity = args[3] || 'moderate';
            const notes = args.slice(4).join(' ');

            tracker.logExercise(type, duration, intensity, notes);

            expect(tracker.data.exercises).toHaveLength(1);
            expect(tracker.data.exercises[0].notes).toBe('');
        });
    });

    describe('CLI Command: history', () => {
        test('handles "history" command with default 7 days', () => {
            process.argv = ['node', 'exercise-tracker.js', 'history'];

            const args = process.argv.slice(2);
            const days = args[1] ? parseInt(args[1]) : 7;

            tracker.getHistory(days);

            expect(days).toBe(7);
        });

        test('handles "history" command with custom days', () => {
            process.argv = ['node', 'exercise-tracker.js', 'history', '14'];

            const args = process.argv.slice(2);
            const days = args[1] ? parseInt(args[1]) : 7;

            tracker.getHistory(days);

            expect(days).toBe(14);
        });

        test('shows "no data" message when history is empty', () => {
            tracker.data.exercises = [];
            tracker.getHistory(7);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No exercise');
        });

        test('displays exercise notes when present', () => {
            const today = new Date();
            tracker.data.exercises = [{
                id: 1,
                date: today.toISOString().split('T')[0],
                timestamp: today.toISOString(),
                type: 'Running',
                duration: 30,
                intensity: 'moderate',
                notes: 'Great workout!'
            }];

            tracker.getHistory(7);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Great workout!');
        });

        test('handles exercises without notes (no notes displayed)', () => {
            const today = new Date();
            tracker.data.exercises = [{
                id: 1,
                date: today.toISOString().split('T')[0],
                timestamp: today.toISOString(),
                type: 'Walking',
                duration: 20,
                intensity: 'low',
                notes: ''
            }];

            tracker.getHistory(7);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Walking');
            // Notes line should not appear when empty
        });
    });

    describe('CLI Command: stats', () => {
        test('handles "stats" command with default 30 days', () => {
            process.argv = ['node', 'exercise-tracker.js', 'stats'];

            const args = process.argv.slice(2);
            const statsDays = args[1] ? parseInt(args[1]) : 30;

            tracker.getStats(statsDays);

            expect(statsDays).toBe(30);
        });

        test('handles "stats" command with custom days', () => {
            process.argv = ['node', 'exercise-tracker.js', 'stats', '60'];

            const args = process.argv.slice(2);
            const statsDays = args[1] ? parseInt(args[1]) : 30;

            tracker.getStats(statsDays);

            expect(statsDays).toBe(60);
        });

        test('shows "no data" message when stats is empty', () => {
            tracker.data.exercises = [];
            const result = tracker.getStats(30);

            expect(result).toBeNull();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No exercise');
        });
    });

    describe('CLI Command: today', () => {
        test('handles "today" command with exercises logged', () => {
            const today = new Date().toISOString().split('T')[0];
            tracker.data.exercises = [
                { id: 1, date: today, duration: 20, timestamp: new Date().toISOString() },
                { id: 2, date: today, duration: 15, timestamp: new Date().toISOString() }
            ];

            process.argv = ['node', 'exercise-tracker.js', 'today'];

            const todayMinutes = tracker.getTodayMinutes();
            console.log(`\n📊 Today's Exercise: ${todayMinutes} minutes`);

            if (todayMinutes >= 30) {
                console.log('🎯 Daily goal achieved!');
            } else {
                console.log(`💪 ${30 - todayMinutes} more minutes to reach daily goal`);
            }

            expect(todayMinutes).toBe(35);
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('35 minutes');
            expect(output).toContain('Daily goal achieved!');
        });

        test('handles "today" command with no exercises (below goal)', () => {
            const today = new Date().toISOString().split('T')[0];
            tracker.data.exercises = [
                { id: 1, date: today, duration: 15, timestamp: new Date().toISOString() }
            ];

            const todayMinutes = tracker.getTodayMinutes();
            console.log(`\n📊 Today's Exercise: ${todayMinutes} minutes`);

            if (todayMinutes >= 30) {
                console.log('🎯 Daily goal achieved!');
            } else {
                console.log(`💪 ${30 - todayMinutes} more minutes to reach daily goal`);
            }

            expect(todayMinutes).toBe(15);
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('15 minutes');
            expect(output).toContain('15 more minutes to reach daily goal');
        });

        test('handles "today" command with zero exercises', () => {
            tracker.data.exercises = [];

            const todayMinutes = tracker.getTodayMinutes();
            console.log(`\n📊 Today's Exercise: ${todayMinutes} minutes`);

            if (todayMinutes >= 30) {
                console.log('🎯 Daily goal achieved!');
            } else {
                console.log(`💪 ${30 - todayMinutes} more minutes to reach daily goal`);
            }

            expect(todayMinutes).toBe(0);
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('0 minutes');
            expect(output).toContain('30 more minutes to reach daily goal');
        });
    });

    describe('CLI Command: help', () => {
        test('handles "help" command', () => {
            process.argv = ['node', 'exercise-tracker.js', 'help'];

            console.log(`
🏃 Exercise Tracker - Track Your Physical Activity

USAGE:
  node exercise-tracker.js <command> [options]

COMMANDS:
  log <type> <minutes> [intensity] [notes]
  history [days]
  stats [days]
  today
  help
            `);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Exercise Tracker');
            expect(output).toContain('USAGE:');
            expect(output).toContain('COMMANDS:');
        });

        test('handles default/no command (shows help)', () => {
            process.argv = ['node', 'exercise-tracker.js'];

            console.log(`🏃 Exercise Tracker - Track Your Physical Activity`);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Exercise Tracker');
        });

        test('help shows all available commands', () => {
            console.log('  log <type> <minutes> [intensity] [notes]');
            console.log('  history [days]');
            console.log('  stats [days]');
            console.log('  today');
            console.log('  help');

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('log');
            expect(output).toContain('history');
            expect(output).toContain('stats');
            expect(output).toContain('today');
            expect(output).toContain('help');
        });

        test('help shows usage examples', () => {
            console.log('EXAMPLES:');
            console.log('  node exercise-tracker.js log "Yoga" 45 low "Evening session"');
            console.log('  node exercise-tracker.js log "Cycling" 60 moderate');
            console.log('  node exercise-tracker.js history');
            console.log('  node exercise-tracker.js stats');

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('EXAMPLES:');
            expect(output).toContain('Yoga');
            expect(output).toContain('Cycling');
        });
    });

    describe('Edge Cases', () => {
        test('getHistory shows no data for old date range', () => {
            const now = new Date();
            const oldDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

            tracker.data.exercises = [{
                id: 1,
                date: oldDate.toISOString().split('T')[0],
                timestamp: oldDate.toISOString(),
                type: 'Running',
                duration: 30,
                intensity: 'moderate',
                notes: ''
            }];

            // Get history for last 7 days (should show no data message)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7);
            const recentExercises = tracker.data.exercises
                .filter(ex => new Date(ex.timestamp) >= cutoffDate);

            if (recentExercises.length === 0) {
                console.log(`\n📭 No exercise logged in the last 7 days.`);
            }

            expect(recentExercises.length).toBe(0);
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No exercise logged in the last 7 days');
        });

        test('getStats returns null when no data in date range', () => {
            const now = new Date();
            const oldDate = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000)); // 60 days ago

            tracker.data.exercises = [{
                id: 1,
                date: oldDate.toISOString().split('T')[0],
                timestamp: oldDate.toISOString(),
                type: 'Running',
                duration: 30,
                intensity: 'moderate',
                notes: ''
            }];

            // Get stats for last 30 days (should return null)
            const result = tracker.getStats(30);

            expect(result).toBeNull();
            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No exercise logged in the last 30 days');
        });
    });

    describe('Intensity Emoji Coverage', () => {
        test('getIntensityEmoji returns correct emojis for all levels', () => {
            expect(tracker.getIntensityEmoji('low')).toBe('🚶');
            expect(tracker.getIntensityEmoji('moderate')).toBe('🏃');
            expect(tracker.getIntensityEmoji('high')).toBe('💨');
            expect(tracker.getIntensityEmoji('unknown')).toBe('🏃');
        });
    });
});
