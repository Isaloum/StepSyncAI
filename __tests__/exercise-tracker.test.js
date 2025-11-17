const ExerciseTracker = require('../exercise-tracker');
const fs = require('fs');

jest.mock('fs');

describe('Exercise Tracker', () => {
    let tracker;
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock fs methods
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue(JSON.stringify({ activities: [], goals: { weeklyMinutes: 150, weeklyDays: 3 } }));
        fs.writeFileSync.mockImplementation(() => {});

        tracker = new ExerciseTracker('test-exercise.json');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Data Loading and Saving', () => {
        test('creates new data file if it does not exist', () => {
            expect(tracker.data).toEqual({
                activities: [],
                goals: {
                    weeklyMinutes: 150,
                    weeklyDays: 3
                }
            });
        });

        test('loads existing data from file', () => {
            const existingData = {
                activities: [
                    { id: 1, type: 'Running', duration: 30, intensity: 7, date: '2025-11-16' }
                ],
                goals: { weeklyMinutes: 200, weeklyDays: 5 }
            };
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(existingData));

            const newTracker = new ExerciseTracker('existing.json');
            expect(newTracker.data.activities).toHaveLength(1);
            expect(newTracker.data.goals.weeklyMinutes).toBe(200);
        });

        test('handles corrupted data file gracefully', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json{');

            const newTracker = new ExerciseTracker('corrupted.json');
            expect(newTracker.data).toEqual({ activities: [], goals: { weeklyMinutes: 150, weeklyDays: 3 } });
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('saves data successfully', () => {
            const result = tracker.saveData();
            expect(result).toBe(true);
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        test('handles save errors', () => {
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Write failed');
            });

            const result = tracker.saveData();
            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('logActivity', () => {
        test('logs activity successfully with valid inputs', () => {
            const activity = tracker.logActivity('Running', 30, 7, 'Morning run');

            expect(activity).not.toBeNull();
            expect(activity.type).toBe('Running');
            expect(activity.duration).toBe(30);
            expect(activity.intensity).toBe(7);
            expect(activity.notes).toBe('Morning run');
            expect(activity.date).toBeDefined();
            expect(activity.timestamp).toBeDefined();
        });

        test('adds activity to data array', () => {
            tracker.logActivity('Yoga', 45, 4);

            expect(tracker.data.activities).toHaveLength(1);
        });

        test('rejects missing type', () => {
            const activity = tracker.logActivity(null, 30, 7);

            expect(activity).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Activity type and duration are required');
        });

        test('rejects missing duration', () => {
            const activity = tracker.logActivity('Running', null, 7);

            expect(activity).toBeNull();
        });

        test('rejects invalid duration - negative', () => {
            const activity = tracker.logActivity('Running', -10, 7);

            expect(activity).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Duration must be a positive number (in minutes)');
        });

        test('rejects invalid duration - zero', () => {
            const activity = tracker.logActivity('Running', 0, 7);

            expect(activity).toBeNull();
        });

        test('rejects invalid duration - non-numeric', () => {
            const activity = tracker.logActivity('Running', 'thirty', 7);

            expect(activity).toBeNull();
        });

        test('validates intensity - rejects value below 1', () => {
            const activity = tracker.logActivity('Running', 30, 0);

            expect(activity).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Intensity must be between 1-10');
        });

        test('validates intensity - rejects value above 10', () => {
            const activity = tracker.logActivity('Running', 30, 11);

            expect(activity).toBeNull();
        });

        test('validates intensity - rejects non-numeric value', () => {
            const activity = tracker.logActivity('Running', 30, 'hard');

            expect(activity).toBeNull();
        });

        test('accepts intensity as string that can be parsed', () => {
            const activity = tracker.logActivity('Running', 30, '7');

            expect(activity).not.toBeNull();
            expect(activity.intensity).toBe(7);
        });

        test('works without notes parameter', () => {
            const activity = tracker.logActivity('Walking', 20, 3);

            expect(activity).not.toBeNull();
            expect(activity.notes).toBe('');
        });

        test('provides feedback for 30+ minute activity', () => {
            tracker.logActivity('Running', 35, 7);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('30-minute activity recommendation');
        });

        test('provides feedback for high intensity', () => {
            tracker.logActivity('Running', 30, 9);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('High intensity');
        });

        test('provides feedback for moderate intensity', () => {
            tracker.logActivity('Yoga', 30, 5);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Moderate intensity');
        });

        test('provides feedback for light activity', () => {
            tracker.logActivity('Walking', 20, 2);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Light activity');
        });
    });

    describe('getStats', () => {
        test('shows message when no data exists', () => {
            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No activity data yet');
        });

        test('calculates total activities correctly', () => {
            tracker.data.activities = [
                { type: 'Running', duration: 30, intensity: 7, timestamp: new Date().toISOString() },
                { type: 'Yoga', duration: 45, intensity: 5, timestamp: new Date().toISOString() }
            ];

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Total Activities Logged: 2');
        });

        test('calculates total time correctly', () => {
            tracker.data.activities = [
                { duration: 30, intensity: 7, timestamp: new Date().toISOString() },
                { duration: 45, intensity: 5, timestamp: new Date().toISOString() }
            ];

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Total Time: 75 minutes');
        });

        test('calculates average duration correctly', () => {
            tracker.data.activities = [
                { duration: 30, intensity: 7, timestamp: new Date().toISOString() },
                { duration: 60, intensity: 5, timestamp: new Date().toISOString() }
            ];

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Duration: 45.0 minutes');
        });

        test('calculates weekly goal progress', () => {
            const now = new Date();
            tracker.data.activities = [
                { duration: 60, intensity: 7, date: now.toISOString().split('T')[0], timestamp: now.toISOString() },
                { duration: 90, intensity: 5, date: now.toISOString().split('T')[0], timestamp: now.toISOString() }
            ];
            tracker.data.goals.weeklyMinutes = 150;

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('This Week: 150 minutes (100%)');
            expect(output).toContain('Goal achieved!');
        });

        test('identifies most common activity', () => {
            tracker.data.activities = [
                { type: 'Running', duration: 30, intensity: 7, timestamp: new Date().toISOString() },
                { type: 'Running', duration: 30, intensity: 7, timestamp: new Date().toISOString() },
                { type: 'Yoga', duration: 45, intensity: 5, timestamp: new Date().toISOString() }
            ];

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Most Common Activity: Running (2 times)');
        });
    });

    describe('analyzeStreaks', () => {
        test('calculates consecutive day streak', () => {
            const baseDate = new Date('2025-11-10');
            tracker.data.activities = [
                { date: '2025-11-10', timestamp: new Date('2025-11-10').toISOString() },
                { date: '2025-11-11', timestamp: new Date('2025-11-11').toISOString() },
                { date: '2025-11-12', timestamp: new Date('2025-11-12').toISOString() }
            ];

            tracker.analyzeStreaks();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Best Streak: 3 consecutive days');
        });

        test('handles non-consecutive days', () => {
            tracker.data.activities = [
                { date: '2025-11-10', timestamp: new Date('2025-11-10').toISOString() },
                { date: '2025-11-12', timestamp: new Date('2025-11-12').toISOString() },
                { date: '2025-11-14', timestamp: new Date('2025-11-14').toISOString() }
            ];

            tracker.analyzeStreaks();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Best Streak: 1 consecutive days');
        });
    });

    describe('setGoals', () => {
        test('sets weekly minutes goal', () => {
            const result = tracker.setGoals(200, null);

            expect(result).toBe(true);
            expect(tracker.data.goals.weeklyMinutes).toBe(200);
        });

        test('sets weekly days goal', () => {
            const result = tracker.setGoals(null, 5);

            expect(result).toBe(true);
            expect(tracker.data.goals.weeklyDays).toBe(5);
        });

        test('sets both goals', () => {
            tracker.setGoals(180, 4);

            expect(tracker.data.goals.weeklyMinutes).toBe(180);
            expect(tracker.data.goals.weeklyDays).toBe(4);
        });
    });

    describe('getActivityEmoji', () => {
        test('returns correct emoji for running', () => {
            expect(tracker.getActivityEmoji('Running')).toBe('🏃');
            expect(tracker.getActivityEmoji('Jogging')).toBe('🏃');
        });

        test('returns correct emoji for walking', () => {
            expect(tracker.getActivityEmoji('Walking')).toBe('🚶');
        });

        test('returns correct emoji for cycling', () => {
            expect(tracker.getActivityEmoji('Cycling')).toBe('🚴');
            expect(tracker.getActivityEmoji('Bike')).toBe('🚴');
        });

        test('returns correct emoji for swimming', () => {
            expect(tracker.getActivityEmoji('Swimming')).toBe('🏊');
        });

        test('returns correct emoji for yoga', () => {
            expect(tracker.getActivityEmoji('Yoga')).toBe('🧘');
            expect(tracker.getActivityEmoji('Stretching')).toBe('🧘');
        });

        test('returns default emoji for unknown activity', () => {
            expect(tracker.getActivityEmoji('Unknown Activity')).toBe('💪');
        });
    });

    describe('getActivityDataForCorrelation', () => {
        test('returns activity data in correct format', () => {
            tracker.data.activities = [
                {
                    id: 1,
                    type: 'Running',
                    duration: 30,
                    intensity: 7,
                    notes: 'Morning run',
                    date: '2025-11-16',
                    timestamp: '2025-11-16T07:00:00Z'
                }
            ];

            const data = tracker.getActivityDataForCorrelation();

            expect(data).toHaveLength(1);
            expect(data[0]).toEqual({
                date: '2025-11-16',
                type: 'Running',
                duration: 30,
                intensity: 7,
                timestamp: '2025-11-16T07:00:00Z'
            });
            expect(data[0].notes).toBeUndefined();
            expect(data[0].id).toBeUndefined();
        });

        test('returns empty array when no activities', () => {
            const data = tracker.getActivityDataForCorrelation();
            expect(data).toEqual([]);
        });
    });

    describe('getInsights', () => {
        test('shows message when less than 5 activities', () => {
            tracker.data.activities = [
                { type: 'Running', duration: 30, intensity: 7 },
                { type: 'Yoga', duration: 45, intensity: 5 }
            ];

            tracker.getInsights();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Not enough data yet');
            expect(output).toContain('at least 5 activities');
        });

        test('runs all analysis methods with sufficient data', () => {
            tracker.data.activities = Array(7).fill(null).map((_, i) => ({
                type: 'Running',
                duration: 30 + Math.random() * 20,
                intensity: 5 + Math.floor(Math.random() * 4),
                timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
            }));

            tracker.getInsights();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Exercise Insights');
        });
    });

    describe('analyzeIntensityPatterns', () => {
        test('categorizes intensities correctly', () => {
            tracker.data.activities = [
                { intensity: 2 }, // light
                { intensity: 3 }, // light
                { intensity: 5 }, // moderate
                { intensity: 6 }, // moderate
                { intensity: 8 }, // vigorous
                { intensity: 9 }  // vigorous
            ];

            tracker.analyzeIntensityPatterns();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Light (1-3): 2 activities (33%)');
            expect(output).toContain('Moderate (4-6): 2 activities (33%)');
            expect(output).toContain('Vigorous (7-10): 2 activities (33%)');
        });

        test('provides feedback for balanced intensity', () => {
            tracker.data.activities = [
                { intensity: 5 },
                { intensity: 5 },
                { intensity: 6 },
                { intensity: 5 }
            ];

            tracker.analyzeIntensityPatterns();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Good balance');
        });
    });
});
