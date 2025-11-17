const fs = require('fs');
const ExerciseTracker = require('../exercise-tracker');

jest.mock('fs');

describe('Exercise Tracker', () => {
    let tracker;

    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
        tracker = new ExerciseTracker();
    });

    describe('Data Loading and Saving', () => {
        test('creates new data file if it does not exist', () => {
            expect(tracker.data).toEqual({ exercises: [] });
        });

        test('loads existing data from file', () => {
            const mockData = {
                exercises: [
                    { id: 1, type: 'Running', duration: 30, intensity: 'moderate' }
                ]
            };

            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

            const newTracker = new ExerciseTracker();
            expect(newTracker.data.exercises).toHaveLength(1);
            expect(newTracker.data.exercises[0].type).toBe('Running');
        });

        test('handles corrupted data file gracefully', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json');

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const newTracker = new ExerciseTracker();

            expect(newTracker.data).toEqual({ exercises: [] });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('saves data successfully', () => {
            fs.writeFileSync.mockReturnValue(undefined);
            const result = tracker.saveData();
            expect(result).toBe(true);
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        test('handles save errors', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write error');
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const result = tracker.saveData();

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('logExercise', () => {
        test('logs exercise successfully with valid inputs', () => {
            fs.writeFileSync.mockReturnValue(undefined);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = tracker.logExercise('Running', 30, 'moderate', 'Morning jog');

            expect(result).toBe(true);
            expect(tracker.data.exercises).toHaveLength(1);
            expect(tracker.data.exercises[0].type).toBe('Running');
            expect(tracker.data.exercises[0].duration).toBe(30);
            expect(tracker.data.exercises[0].intensity).toBe('moderate');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('rejects missing exercise type', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const result = tracker.logExercise('', 30);
            expect(result).toBe(false);
            expect(tracker.data.exercises).toHaveLength(0);
            consoleSpy.mockRestore();
        });

        test('rejects invalid duration - non-numeric', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const result = tracker.logExercise('Running', 'invalid');
            expect(result).toBe(false);
            consoleSpy.mockRestore();
        });

        test('rejects invalid duration - negative', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const result = tracker.logExercise('Running', -10);
            expect(result).toBe(false);
            consoleSpy.mockRestore();
        });

        test('rejects invalid intensity', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const result = tracker.logExercise('Running', 30, 'invalid');
            expect(result).toBe(false);
            consoleSpy.mockRestore();
        });

        test('accepts valid intensity values', () => {
            fs.writeFileSync.mockReturnValue(undefined);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            tracker.logExercise('Walk', 20, 'low');
            tracker.logExercise('Jog', 30, 'moderate');
            tracker.logExercise('Sprint', 15, 'high');

            expect(tracker.data.exercises).toHaveLength(3);
            consoleSpy.mockRestore();
        });

        test('works without notes parameter', () => {
            fs.writeFileSync.mockReturnValue(undefined);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const result = tracker.logExercise('Cycling', 45, 'moderate');

            expect(result).toBe(true);
            expect(tracker.data.exercises[0].notes).toBe('');
            consoleSpy.mockRestore();
        });

        test('provides feedback for meeting 30-minute goal', () => {
            fs.writeFileSync.mockReturnValue(undefined);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            tracker.logExercise('Running', 30);

            const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('30 minutes');
            consoleSpy.mockRestore();
        });

        test('provides feedback for not meeting goal', () => {
            fs.writeFileSync.mockReturnValue(undefined);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            tracker.logExercise('Walking', 15);

            const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('15 more minutes');
            consoleSpy.mockRestore();
        });
    });

    describe('getHistory', () => {
        test('shows message when no data exists', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            tracker.getHistory();
            const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No exercise data yet');
            consoleSpy.mockRestore();
        });

        test('shows recent exercises from last 7 days by default', () => {
            const today = new Date();
            tracker.data.exercises = [
                {
                    id: 1,
                    date: today.toISOString().split('T')[0],
                    timestamp: today.toISOString(),
                    type: 'Running',
                    duration: 30,
                    intensity: 'moderate',
                    notes: ''
                }
            ];

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            tracker.getHistory(7);
            const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Running');
            consoleSpy.mockRestore();
        });

        test('accepts custom number of days', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            tracker.getHistory(14);
            consoleSpy.mockRestore();
        });

        test('shows most recent entries first', () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            tracker.data.exercises = [
                {
                    id: 1,
                    date: yesterday.toISOString().split('T')[0],
                    timestamp: yesterday.toISOString(),
                    type: 'Walking',
                    duration: 20,
                    intensity: 'low',
                    notes: ''
                },
                {
                    id: 2,
                    date: today.toISOString().split('T')[0],
                    timestamp: today.toISOString(),
                    type: 'Running',
                    duration: 30,
                    intensity: 'moderate',
                    notes: ''
                }
            ];

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            tracker.getHistory(7);
            const calls = consoleSpy.mock.calls.map(call => call[0]).join('\n');
            const runningIndex = calls.indexOf('Running');
            const walkingIndex = calls.indexOf('Walking');
            expect(runningIndex).toBeLessThan(walkingIndex);
            consoleSpy.mockRestore();
        });
    });

    describe('getIntensityEmoji', () => {
        test('returns correct emoji for low intensity', () => {
            expect(tracker.getIntensityEmoji('low')).toBe('🚶');
        });

        test('returns correct emoji for moderate intensity', () => {
            expect(tracker.getIntensityEmoji('moderate')).toBe('🏃');
        });

        test('returns correct emoji for high intensity', () => {
            expect(tracker.getIntensityEmoji('high')).toBe('💨');
        });

        test('returns default emoji for unknown intensity', () => {
            expect(tracker.getIntensityEmoji('unknown')).toBe('🏃');
        });
    });

    describe('getStats', () => {
        test('shows message when no data exists', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const result = tracker.getStats();
            expect(result).toBeNull();
            consoleSpy.mockRestore();
        });

        test('calculates statistics correctly', () => {
            const today = new Date();
            tracker.data.exercises = [
                {
                    id: 1,
                    date: today.toISOString().split('T')[0],
                    timestamp: today.toISOString(),
                    type: 'Running',
                    duration: 30,
                    intensity: 'high',
                    notes: ''
                },
                {
                    id: 2,
                    date: today.toISOString().split('T')[0],
                    timestamp: today.toISOString(),
                    type: 'Walking',
                    duration: 20,
                    intensity: 'low',
                    notes: ''
                }
            ];

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const stats = tracker.getStats(30);

            expect(stats.totalWorkouts).toBe(2);
            expect(stats.totalMinutes).toBe(50);
            expect(stats.avgMinutes).toBe(25);
            expect(stats.daysWithExercise).toBe(1);
            consoleSpy.mockRestore();
        });
    });

    describe('getTodayMinutes', () => {
        test('returns 0 when no exercises today', () => {
            const minutes = tracker.getTodayMinutes();
            expect(minutes).toBe(0);
        });

        test('calculates total minutes for today correctly', () => {
            const today = new Date().toISOString().split('T')[0];
            tracker.data.exercises = [
                { id: 1, date: today, duration: 20, timestamp: new Date().toISOString() },
                { id: 2, date: today, duration: 15, timestamp: new Date().toISOString() }
            ];

            const minutes = tracker.getTodayMinutes();
            expect(minutes).toBe(35);
        });
    });

    describe('getExerciseDataForDashboard', () => {
        test('returns correct data structure for dashboard', () => {
            const today = new Date();
            const todayDate = today.toISOString().split('T')[0];
            tracker.data.exercises = [
                {
                    id: 1,
                    date: todayDate,
                    timestamp: today.toISOString(),
                    type: 'Running',
                    duration: 30,
                    intensity: 'moderate',
                    notes: ''
                }
            ];

            const data = tracker.getExerciseDataForDashboard(7);

            expect(data).toHaveProperty('totalMinutes');
            expect(data).toHaveProperty('avgMinutes');
            expect(data).toHaveProperty('daysActive');
            expect(data).toHaveProperty('todayMinutes');
            expect(data).toHaveProperty('workoutCount');

            expect(data.totalMinutes).toBe(30);
            expect(data.todayMinutes).toBe(30);
            expect(data.workoutCount).toBe(1);
        });
    });
});
