const DailyDashboard = require('../daily-dashboard');
const fs = require('fs');

jest.mock('fs');
jest.mock('../mental-health-tracker');
jest.mock('../sleep-tracker');
jest.mock('../exercise-tracker');
jest.mock('../medication-tracker');

const MentalHealthTracker = require('../mental-health-tracker');
const SleepTracker = require('../sleep-tracker');
const ExerciseTracker = require('../exercise-tracker');
const MedicationTracker = require('../medication-tracker');

describe('Daily Dashboard', () => {
    let dashboard;
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        // Mock each tracker
        MentalHealthTracker.mockImplementation(() => ({
            data: {
                moodEntries: [],
                journalEntries: [],
                symptoms: []
            }
        }));

        SleepTracker.mockImplementation(() => ({
            data: {
                sleepEntries: []
            }
        }));

        ExerciseTracker.mockImplementation(() => ({
            data: {
                activities: []
            }
        }));

        MedicationTracker.mockImplementation(() => ({
            data: {
                medications: [],
                history: []
            }
        }));

        dashboard = new DailyDashboard();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('Tracker Loading', () => {
        test('loads all trackers successfully', () => {
            expect(dashboard.mentalHealth).toBeDefined();
            expect(dashboard.sleep).toBeDefined();
            expect(dashboard.exercise).toBeDefined();
            expect(dashboard.medication).toBeDefined();
        });

        test('handles missing trackers gracefully', () => {
            MentalHealthTracker.mockImplementation(() => {
                throw new Error('Data not found');
            });

            const newDashboard = new DailyDashboard();
            expect(newDashboard.mentalHealth).toBeNull();
        });
    });

    describe('getTodayData', () => {
        test('extracts mood data for today', () => {
            const today = new Date().toISOString().split('T')[0];
            dashboard.mentalHealth.data.moodEntries = [
                { rating: 7, timestamp: `${today}T10:00:00Z` },
                { rating: 8, timestamp: `${today}T15:00:00Z` }
            ];

            const data = dashboard.getTodayData(today);

            expect(data.mood).toBe(7.5);
            expect(data.moodCount).toBe(2);
        });

        test('returns null when no mood data for today', () => {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            dashboard.mentalHealth.data.moodEntries = [
                { rating: 7, timestamp: `${yesterday}T10:00:00Z` }
            ];

            const data = dashboard.getTodayData(today);

            expect(data.mood).toBeNull();
            expect(data.moodCount).toBe(0);
        });

        test('extracts sleep data for today', () => {
            const today = new Date().toISOString().split('T')[0];
            dashboard.sleep.data.sleepEntries = [
                { date: today, quality: 8, duration: 7.5 }
            ];

            const data = dashboard.getTodayData(today);

            expect(data.sleepQuality).toBe(8);
            expect(data.sleepDuration).toBe(7.5);
        });

        test('extracts exercise data for today', () => {
            const today = new Date().toISOString().split('T')[0];
            dashboard.exercise.data.activities = [
                { date: today, duration: 30, intensity: 7 },
                { date: today, duration: 20, intensity: 5 }
            ];

            const data = dashboard.getTodayData(today);

            expect(data.exerciseMinutes).toBe(50);
            expect(data.exerciseCount).toBe(2);
            expect(data.exerciseIntensity).toBe(6);
        });

        test('extracts medication data for today', () => {
            const today = new Date().toISOString().split('T')[0];
            dashboard.medication.data.medications = [
                { id: 1, active: true },
                { id: 2, active: true },
                { id: 3, active: false }
            ];
            dashboard.medication.data.history = [
                { medicationId: 1, timestamp: `${today}T08:00:00Z`, missed: false },
                { medicationId: 2, timestamp: `${today}T08:00:00Z`, missed: true }
            ];

            const data = dashboard.getTodayData(today);

            expect(data.medicationsTotal).toBe(2);
            expect(data.medicationsTaken).toBe(1);
            expect(data.medicationsMissed).toBe(1);
        });
    });

    describe('calculateWellnessScore', () => {
        test('calculates score with all components', () => {
            const data = {
                mood: 8,
                sleepQuality: 8,
                sleepDuration: 7.5,
                exerciseMinutes: 30,
                medicationsTotal: 2,
                medicationsTaken: 2
            };

            const score = dashboard.calculateWellnessScore(data);

            expect(score.total).toBeGreaterThan(80);
            expect(score.total).toBeLessThanOrEqual(100);
            expect(score.components.mood).toBeDefined();
            expect(score.components.sleep).toBeDefined();
            expect(score.components.exercise).toBeDefined();
            expect(score.components.medication).toBeDefined();
        });

        test('calculates score with partial data', () => {
            const data = {
                mood: 7,
                sleepQuality: null,
                sleepDuration: null,
                exerciseMinutes: 0,
                medicationsTotal: 0
            };

            const score = dashboard.calculateWellnessScore(data);

            expect(score.total).toBeGreaterThan(0);
            expect(score.components.mood).toBeDefined();
            expect(score.components.sleep).toBeUndefined();
        });

        test('gives high score for optimal data', () => {
            const data = {
                mood: 9,
                sleepQuality: 9,
                sleepDuration: 8,
                exerciseMinutes: 40,
                medicationsTotal: 2,
                medicationsTaken: 2
            };

            const score = dashboard.calculateWellnessScore(data);

            expect(score.total).toBeGreaterThan(90);
        });

        test('gives low score for poor data', () => {
            const data = {
                mood: 3,
                sleepQuality: 3,
                sleepDuration: 4,
                exerciseMinutes: 0,
                medicationsTotal: 2,
                medicationsTaken: 0
            };

            const score = dashboard.calculateWellnessScore(data);

            expect(score.total).toBeLessThan(40);
        });
    });

    describe('showDailyDashboard', () => {
        test('displays dashboard with all sections', () => {
            const today = new Date().toISOString().split('T')[0];
            dashboard.mentalHealth.data.moodEntries = [
                { rating: 7, timestamp: `${today}T10:00:00Z` }
            ];
            dashboard.sleep.data.sleepEntries = [
                { date: today, quality: 8, duration: 7.5 }
            ];

            dashboard.showDailyDashboard();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('DAILY WELLNESS DASHBOARD');
            expect(output).toContain('WELLNESS SCORE');
            expect(output).toContain('MENTAL HEALTH');
            expect(output).toContain('SLEEP');
            expect(output).toContain('EXERCISE');
            expect(output).toContain('MEDICATIONS');
        });

        test('shows recommendations section', () => {
            dashboard.showDailyDashboard();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('RECOMMENDATIONS');
        });
    });

    describe('showWeeklySummary', () => {
        test('displays weekly summary with data', () => {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            dashboard.mentalHealth.data.moodEntries = [
                { rating: 7, timestamp: today.toISOString() },
                { rating: 8, timestamp: today.toISOString() }
            ];

            dashboard.sleep.data.sleepEntries = [
                { date: todayStr, quality: 8, duration: 7.5, timestamp: today.toISOString() }
            ];

            dashboard.showWeeklySummary();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('WEEKLY WELLNESS SUMMARY');
            expect(output).toContain('Average Mood');
            expect(output).toContain('Average Quality');
        });
    });

    describe('getMoodEmoji', () => {
        test('returns correct emoji for mood levels', () => {
            expect(dashboard.getMoodEmoji(10)).toBe('😄');
            expect(dashboard.getMoodEmoji(8)).toBe('😊');
            expect(dashboard.getMoodEmoji(6)).toBe('🙂');
            expect(dashboard.getMoodEmoji(4)).toBe('😐');
            expect(dashboard.getMoodEmoji(2)).toBe('😔');
        });
    });

    describe('getQualityEmoji', () => {
        test('returns correct emoji for quality levels', () => {
            expect(dashboard.getQualityEmoji(9)).toBe('😊');
            expect(dashboard.getQualityEmoji(7)).toBe('🙂');
            expect(dashboard.getQualityEmoji(5)).toBe('😐');
            expect(dashboard.getQualityEmoji(3)).toBe('😔');
        });
    });

    describe('getIntensityLabel', () => {
        test('returns correct label for intensity levels', () => {
            expect(dashboard.getIntensityLabel(9)).toBe('🔥 High');
            expect(dashboard.getIntensityLabel(5)).toBe('😊 Moderate');
            expect(dashboard.getIntensityLabel(2)).toBe('🚶 Light');
        });
    });
});
