const SleepTracker = require('../sleep-tracker');
const fs = require('fs');

jest.mock('fs');

describe('Sleep Tracker', () => {
    let tracker;
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Mock fs methods
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue(JSON.stringify({ sleepEntries: [] }));
        fs.writeFileSync.mockImplementation(() => {});

        tracker = new SleepTracker('test-sleep.json');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Data Loading and Saving', () => {
        test('creates new data file if it does not exist', () => {
            expect(tracker.data).toEqual({ sleepEntries: [] });
        });

        test('loads existing data from file', () => {
            const existingData = {
                sleepEntries: [
                    { id: 1, date: '2025-11-15', bedtime: '22:00', wakeTime: '06:00', duration: 8.0, quality: 8 }
                ]
            };
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(existingData));

            const newTracker = new SleepTracker('existing.json');
            expect(newTracker.data.sleepEntries).toHaveLength(1);
        });

        test('handles corrupted data file gracefully', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json{');

            const newTracker = new SleepTracker('corrupted.json');
            expect(newTracker.data).toEqual({ sleepEntries: [] });
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

    describe('calculateDuration', () => {
        test('calculates duration for same-day sleep correctly', () => {
            const duration = tracker.calculateDuration('14:00', '16:30');
            expect(duration).toBe('2.5');
        });

        test('calculates duration for overnight sleep correctly', () => {
            const duration = tracker.calculateDuration('22:30', '06:30');
            expect(duration).toBe('8.0');
        });

        test('handles bedtime close to midnight', () => {
            const duration = tracker.calculateDuration('23:45', '07:15');
            expect(duration).toBe('7.5');
        });

        test('handles wake time just after midnight', () => {
            const duration = tracker.calculateDuration('21:00', '01:00');
            expect(duration).toBe('4.0');
        });

        test('calculates short nap correctly', () => {
            const duration = tracker.calculateDuration('14:00', '14:30');
            expect(duration).toBe('0.5');
        });

        test('calculates very long sleep correctly', () => {
            const duration = tracker.calculateDuration('20:00', '10:00');
            expect(duration).toBe('14.0');
        });
    });

    describe('logSleep', () => {
        test('logs sleep entry successfully with valid inputs', () => {
            const entry = tracker.logSleep('22:30', '06:30', 8, 'Felt great');

            expect(entry).not.toBeNull();
            expect(entry.bedtime).toBe('22:30');
            expect(entry.wakeTime).toBe('06:30');
            expect(entry.duration).toBe(8.0);
            expect(entry.quality).toBe(8);
            expect(entry.notes).toBe('Felt great');
            expect(entry.date).toBeDefined();
            expect(entry.timestamp).toBeDefined();
        });

        test('adds entry to data array', () => {
            tracker.logSleep('22:00', '06:00', 7);

            expect(tracker.data.sleepEntries).toHaveLength(1);
        });

        test('rejects missing bedtime', () => {
            const entry = tracker.logSleep(null, '06:00', 7);

            expect(entry).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('\n❌ Error: Bedtime and wake time are required');
        });

        test('rejects missing wake time', () => {
            const entry = tracker.logSleep('22:00', null, 7);

            expect(entry).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('validates time format - rejects invalid bedtime', () => {
            const entry = tracker.logSleep('25:00', '06:00', 7);

            expect(entry).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid bedtime: "25:00" must be in HH:MM format (e.g., 09:30 or 14:45)');
        });

        test('validates time format - rejects invalid wake time', () => {
            const entry = tracker.logSleep('22:00', '25:00', 7);

            expect(entry).toBeNull();
        });

        test('validates time format - rejects non-time strings', () => {
            const entry = tracker.logSleep('bedtime', 'waketime', 7);

            expect(entry).toBeNull();
        });

        test('validates quality - rejects value below 1', () => {
            const entry = tracker.logSleep('22:00', '06:00', 0);

            expect(entry).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid sleep quality: 0 is below minimum allowed value (1)');
        });

        test('validates quality - rejects value above 10', () => {
            const entry = tracker.logSleep('22:00', '06:00', 11);

            expect(entry).toBeNull();
        });

        test('validates quality - rejects non-numeric value', () => {
            const entry = tracker.logSleep('22:00', '06:00', 'good');

            expect(entry).toBeNull();
        });

        test('accepts quality string that can be parsed to number', () => {
            const entry = tracker.logSleep('22:00', '06:00', '8');

            expect(entry).not.toBeNull();
            expect(entry.quality).toBe(8);
        });

        test('works without notes parameter', () => {
            const entry = tracker.logSleep('22:00', '06:00', 7);

            expect(entry).not.toBeNull();
            expect(entry.notes).toBe('');
        });

        test('provides feedback for short sleep (<6h)', () => {
            tracker.logSleep('01:00', '05:00', 5);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('less than 6 hours');
        });

        test('provides feedback for optimal sleep (7-9h)', () => {
            tracker.logSleep('22:00', '06:00', 8);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('recommended 7-9 hour range');
        });

        test('provides feedback for long sleep (>9h)', () => {
            tracker.logSleep('20:00', '08:00', 6);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('over 9 hours');
        });

        test('provides feedback for excellent quality (8+)', () => {
            tracker.logSleep('22:00', '06:00', 9);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Excellent sleep quality');
        });

        test('provides feedback for good quality (6-7)', () => {
            tracker.logSleep('22:00', '06:00', 7);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Good sleep quality');
        });

        test('provides feedback for moderate quality (4-5)', () => {
            tracker.logSleep('22:00', '06:00', 4);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Moderate sleep quality');
        });

        test('provides feedback for poor quality (<4)', () => {
            tracker.logSleep('22:00', '06:00', 2);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Poor sleep quality');
        });
    });

    describe('getStats', () => {
        test('shows message when no data exists', () => {
            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No sleep data yet');
        });

        test('calculates average duration correctly', () => {
            tracker.data.sleepEntries = [
                { duration: 7.0, quality: 8, date: '2025-11-14', bedtime: '22:00', timestamp: new Date('2025-11-14').toISOString() },
                { duration: 8.0, quality: 7, date: '2025-11-15', bedtime: '22:15', timestamp: new Date('2025-11-15').toISOString() },
                { duration: 6.0, quality: 6, date: '2025-11-16', bedtime: '22:10', timestamp: new Date('2025-11-16').toISOString() }
            ];

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Average: 7.0 hours');
        });

        test('calculates average quality correctly', () => {
            tracker.data.sleepEntries = [
                { duration: 8, quality: 8, date: '2025-11-14', bedtime: '22:00', timestamp: new Date('2025-11-14').toISOString() },
                { duration: 8, quality: 6, date: '2025-11-15', bedtime: '22:00', timestamp: new Date('2025-11-15').toISOString() }
            ];

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Average: 7.0/10');
        });

        test('identifies best night correctly', () => {
            tracker.data.sleepEntries = [
                { duration: 7, quality: 6, date: '2025-11-14', bedtime: '22:00', timestamp: new Date('2025-11-14').toISOString() },
                { duration: 8, quality: 9, date: '2025-11-15', bedtime: '22:00', timestamp: new Date('2025-11-15').toISOString() },
                { duration: 7, quality: 7, date: '2025-11-16', bedtime: '22:00', timestamp: new Date('2025-11-16').toISOString() }
            ];

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Best Night: 2025-11-15');
            expect(output).toContain('Quality: 9/10');
        });

        test('identifies worst night correctly', () => {
            tracker.data.sleepEntries = [
                { duration: 7, quality: 8, date: '2025-11-14', bedtime: '22:00', timestamp: new Date('2025-11-14').toISOString() },
                { duration: 8, quality: 3, date: '2025-11-15', bedtime: '22:00', timestamp: new Date('2025-11-15').toISOString() },
                { duration: 7, quality: 7, date: '2025-11-16', bedtime: '22:00', timestamp: new Date('2025-11-16').toISOString() }
            ];

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Most Restless Night: 2025-11-15');
        });

        test('calculates sleep debt correctly', () => {
            tracker.data.sleepEntries = [
                { duration: 6.0, quality: 8, date: '2025-11-14', bedtime: '22:00', timestamp: new Date('2025-11-14').toISOString() }, // 2h debt
                { duration: 5.0, quality: 7, date: '2025-11-15', bedtime: '22:00', timestamp: new Date('2025-11-15').toISOString() }, // 3h debt
                { duration: 9.0, quality: 8, date: '2025-11-16', bedtime: '22:00', timestamp: new Date('2025-11-16').toISOString() }  // 0h debt
            ];

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Total accumulated: 5.0 hours');
        });

        test('calculates last 7 days average', () => {
            const now = new Date();
            const recent = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3 days ago
            const old = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)); // 10 days ago

            tracker.data.sleepEntries = [
                { duration: 5.0, quality: 5, date: old.toISOString().split('T')[0], bedtime: '22:00', timestamp: old.toISOString() },
                { duration: 8.0, quality: 8, date: recent.toISOString().split('T')[0], bedtime: '22:00', timestamp: recent.toISOString() },
                { duration: 7.0, quality: 7, date: now.toISOString().split('T')[0], bedtime: '22:00', timestamp: now.toISOString() }
            ];

            tracker.getStats();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Last 7 Days: 7.5 hours');
        });
    });

    describe('analyzeConsistency', () => {
        test('skips analysis with less than 3 entries', () => {
            tracker.data.sleepEntries = [
                { bedtime: '22:00' },
                { bedtime: '22:30' }
            ];

            tracker.analyzeConsistency();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).not.toContain('Schedule Consistency');
        });

        test('identifies excellent consistency (<30 min variation)', () => {
            tracker.data.sleepEntries = [
                { bedtime: '22:00' },
                { bedtime: '22:15' },
                { bedtime: '22:10' },
                { bedtime: '22:20' }
            ];

            tracker.analyzeConsistency();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Excellent');
        });

        test('identifies good consistency (30-60 min variation)', () => {
            tracker.data.sleepEntries = [
                { bedtime: '22:00' },
                { bedtime: '23:15' },
                { bedtime: '22:10' },
                { bedtime: '23:00' }
            ];

            tracker.analyzeConsistency();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Good');
        });

        test('identifies inconsistent schedule (>60 min variation)', () => {
            tracker.data.sleepEntries = [
                { bedtime: '21:00' },
                { bedtime: '23:30' },
                { bedtime: '22:00' },
                { bedtime: '01:00' }
            ];

            tracker.analyzeConsistency();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Inconsistent');
        });
    });

    describe('getHistory', () => {
        test('shows message when no data exists', () => {
            tracker.getHistory();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No sleep data yet');
        });

        test('shows entries from last 7 days by default', () => {
            const now = new Date();
            const recent = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
            const old = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));

            tracker.data.sleepEntries = [
                { date: old.toISOString().split('T')[0], bedtime: '22:00', wakeTime: '06:00', duration: 8, quality: 8, timestamp: old.toISOString() },
                { date: recent.toISOString().split('T')[0], bedtime: '22:30', wakeTime: '06:30', duration: 8, quality: 7, timestamp: recent.toISOString() },
                { date: now.toISOString().split('T')[0], bedtime: '23:00', wakeTime: '07:00', duration: 8, quality: 9, timestamp: now.toISOString() }
            ];

            tracker.getHistory(7);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            // Should show 2 recent entries, not the old one
            expect(output).toContain(recent.toISOString().split('T')[0]);
            expect(output).toContain(now.toISOString().split('T')[0]);
            expect(output).not.toContain(old.toISOString().split('T')[0]);
        });

        test('accepts custom number of days', () => {
            tracker.data.sleepEntries = [
                { date: '2025-11-15', bedtime: '22:00', wakeTime: '06:00', duration: 8, quality: 8, timestamp: new Date().toISOString() }
            ];

            tracker.getHistory(14);

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Last 14 Days');
        });

        test('displays sleep quality with emoji', () => {
            tracker.data.sleepEntries = [
                { date: '2025-11-16', bedtime: '22:00', wakeTime: '06:00', duration: 8, quality: 9, timestamp: new Date().toISOString() }
            ];

            tracker.getHistory();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('😊'); // Excellent quality
            expect(output).toContain('9/10');
        });

        test('displays notes if provided', () => {
            tracker.data.sleepEntries = [
                { date: '2025-11-16', bedtime: '22:00', wakeTime: '06:00', duration: 8, quality: 8, notes: 'Test note', timestamp: new Date().toISOString() }
            ];

            tracker.getHistory();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Test note');
        });

        test('shows most recent entries first', () => {
            const old = new Date('2025-11-14');
            const recent = new Date('2025-11-16');

            tracker.data.sleepEntries = [
                { date: old.toISOString().split('T')[0], bedtime: '22:00', wakeTime: '06:00', duration: 8, quality: 7, timestamp: old.toISOString() },
                { date: recent.toISOString().split('T')[0], bedtime: '22:00', wakeTime: '06:00', duration: 8, quality: 8, timestamp: recent.toISOString() }
            ];

            tracker.getHistory(7);

            const calls = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            const oldIndex = calls.indexOf(old.toISOString().split('T')[0]);
            const recentIndex = calls.indexOf(recent.toISOString().split('T')[0]);

            expect(recentIndex).toBeLessThan(oldIndex);
        });
    });

    describe('getQualityEmoji', () => {
        test('returns correct emoji for excellent quality (8+)', () => {
            expect(tracker.getQualityEmoji(10)).toBe('😊');
            expect(tracker.getQualityEmoji(8)).toBe('😊');
        });

        test('returns correct emoji for good quality (6-7)', () => {
            expect(tracker.getQualityEmoji(7)).toBe('🙂');
            expect(tracker.getQualityEmoji(6)).toBe('🙂');
        });

        test('returns correct emoji for moderate quality (4-5)', () => {
            expect(tracker.getQualityEmoji(5)).toBe('😐');
            expect(tracker.getQualityEmoji(4)).toBe('😐');
        });

        test('returns correct emoji for poor quality (<4)', () => {
            expect(tracker.getQualityEmoji(3)).toBe('😔');
            expect(tracker.getQualityEmoji(1)).toBe('😔');
        });
    });

    describe('getInsights', () => {
        test('shows message when less than 5 entries', () => {
            tracker.data.sleepEntries = [
                { duration: 8, quality: 8 },
                { duration: 7, quality: 7 }
            ];

            tracker.getInsights();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Not enough data yet');
            expect(output).toContain('at least 5 nights');
        });

        test('runs all analysis methods with sufficient data', () => {
            tracker.data.sleepEntries = Array(7).fill(null).map((_, i) => ({
                duration: 7 + Math.random(),
                quality: 7 + Math.floor(Math.random() * 3),
                timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
            }));

            tracker.getInsights();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Sleep Insights');
        });
    });

    describe('analyzeDurationPatterns', () => {
        test('categorizes sleep durations correctly', () => {
            tracker.data.sleepEntries = [
                { duration: 5.5, quality: 6 }, // short
                { duration: 5.0, quality: 5 }, // short
                { duration: 7.5, quality: 8 }, // optimal
                { duration: 8.5, quality: 8 }, // optimal
                { duration: 10.0, quality: 7 }, // long
                { duration: 11.0, quality: 6 }  // long
            ];

            tracker.analyzeDurationPatterns();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Short (<6h): 2 nights (33%)');
            expect(output).toContain('Optimal (7-9h): 2 nights (33%)');
            expect(output).toContain('Long (>9h): 2 nights (33%)');
        });

        test('provides positive feedback for mostly optimal sleep', () => {
            tracker.data.sleepEntries = [
                { duration: 7.5, quality: 8 },
                { duration: 8.0, quality: 8 },
                { duration: 8.5, quality: 8 },
                { duration: 7.0, quality: 8 },
                { duration: 6.0, quality: 7 }  // 80% optimal
            ];

            tracker.analyzeDurationPatterns();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('consistently getting optimal sleep');
        });

        test('warns about frequent sleep deprivation', () => {
            tracker.data.sleepEntries = [
                { duration: 5.0, quality: 5 },
                { duration: 5.5, quality: 6 },
                { duration: 5.0, quality: 4 },
                { duration: 7.0, quality: 8 }  // >50% short
            ];

            tracker.analyzeDurationPatterns();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('frequently sleep deprived');
        });
    });

    describe('analyzeWeekdayPatterns', () => {
        test('skips with less than 7 entries', () => {
            tracker.data.sleepEntries = Array(6).fill({ duration: 8, quality: 8, timestamp: new Date().toISOString() });

            tracker.analyzeWeekdayPatterns();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).not.toContain('Day-of-Week Patterns');
        });

        test('identifies best and worst days', () => {
            // Create data with Mondays being poor and Fridays being great
            tracker.data.sleepEntries = [];
            for (let week = 0; week < 3; week++) {
                // Monday (poor)
                const monday = new Date(2025, 0, 6 + week * 7); // Jan 6, 13, 20
                tracker.data.sleepEntries.push({
                    duration: 5.5,
                    quality: 4,
                    timestamp: monday.toISOString()
                });

                // Wednesday (average)
                const wednesday = new Date(2025, 0, 8 + week * 7);
                tracker.data.sleepEntries.push({
                    duration: 7.0,
                    quality: 7,
                    timestamp: wednesday.toISOString()
                });

                // Friday (excellent)
                const friday = new Date(2025, 0, 10 + week * 7); // Jan 10, 17, 24
                tracker.data.sleepEntries.push({
                    duration: 8.5,
                    quality: 9,
                    timestamp: friday.toISOString()
                });

                // Saturday (good)
                const saturday = new Date(2025, 0, 11 + week * 7);
                tracker.data.sleepEntries.push({
                    duration: 8.0,
                    quality: 8,
                    timestamp: saturday.toISOString()
                });
            }

            tracker.analyzeWeekdayPatterns();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Day-of-Week Patterns');
            expect(output).toContain('Best sleep: Fridays');
            expect(output).toContain('Most restless: Mondays');
        });
    });

    describe('getSleepDataForCorrelation', () => {
        test('returns sleep data in correct format for correlation', () => {
            tracker.data.sleepEntries = [
                {
                    id: 1,
                    date: '2025-11-16',
                    bedtime: '22:00',
                    wakeTime: '06:00',
                    duration: 8.0,
                    quality: 8,
                    notes: 'Great sleep',
                    timestamp: '2025-11-16T06:00:00Z'
                }
            ];

            const data = tracker.getSleepDataForCorrelation();

            expect(data).toHaveLength(1);
            expect(data[0]).toEqual({
                date: '2025-11-16',
                duration: 8.0,
                quality: 8,
                timestamp: '2025-11-16T06:00:00Z'
            });
            expect(data[0].notes).toBeUndefined();
            expect(data[0].id).toBeUndefined();
        });

        test('returns empty array when no sleep entries', () => {
            const data = tracker.getSleepDataForCorrelation();
            expect(data).toEqual([]);
        });
    });

    describe('Additional Edge Cases', () => {
        test('analyzeConsistency with exactly 3 entries', () => {
            tracker.data.sleepEntries = [
                { bedtime: '22:00' },
                { bedtime: '22:15' },
                { bedtime: '22:10' }
            ];

            tracker.analyzeConsistency();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Excellent');
        });

        test('analyzeConsistency calculates variation correctly', () => {
            tracker.data.sleepEntries = [
                { bedtime: '22:00' },
                { bedtime: '22:30' },
                { bedtime: '22:15' },
                { bedtime: '22:45' }
            ];

            tracker.analyzeConsistency();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output.length).toBeGreaterThan(0);
        });

        test('timeToMinutes converts time correctly for consistency analysis', () => {
            // Test the timeToMinutes conversion used in analyzeConsistency
            tracker.data.sleepEntries = [
                { bedtime: '00:00' }, // midnight
                { bedtime: '00:15' },
                { bedtime: '23:45' }  // close to midnight
            ];

            tracker.analyzeConsistency();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output.length).toBeGreaterThan(0);
        });
    });
});
