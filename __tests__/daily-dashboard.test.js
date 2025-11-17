const fs = require('fs');
const DailyDashboard = require('../daily-dashboard');
const MentalHealthTracker = require('../mental-health-tracker');
const MedicationTracker = require('../medication-tracker');
const SleepTracker = require('../sleep-tracker');
const ExerciseTracker = require('../exercise-tracker');

// Mock file system
jest.mock('fs');

describe('Daily Dashboard', () => {
    let dashboard;

    beforeEach(() => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(false);
        dashboard = new DailyDashboard();
    });

    describe('Tracker Loading', () => {
        test('handles missing tracker data gracefully', () => {
            expect(dashboard.mentalHealth).toBeDefined();
            expect(dashboard.medication).toBeDefined();
            expect(dashboard.sleep).toBeDefined();
            expect(dashboard.exercise).toBeDefined();
        });

        test('loads all trackers successfully', () => {
            const dashboard2 = new DailyDashboard();
            expect(dashboard2.mentalHealth).toBeInstanceOf(MentalHealthTracker);
            expect(dashboard2.medication).toBeInstanceOf(MedicationTracker);
            expect(dashboard2.sleep).toBeInstanceOf(SleepTracker);
            expect(dashboard2.exercise).toBeInstanceOf(ExerciseTracker);
        });
    });

    describe('Data Extraction', () => {
        test('getMoodData returns null when no mood logs exist', () => {
            const moodData = dashboard.getMoodData(7);
            expect(moodData).toBeNull();
        });

        test('getMoodData extracts recent mood data correctly', () => {
            const today = new Date();
            dashboard.mentalHealth.data.moodLogs = [
                { rating: 7, timestamp: today.toISOString(), note: 'Good day' },
                { rating: 8, timestamp: today.toISOString(), note: 'Great day' }
            ];

            const moodData = dashboard.getMoodData(7);
            expect(moodData).not.toBeNull();
            expect(moodData.avgMood).toBe(7.5);
            expect(moodData.latestMood).toBe(8);
            expect(moodData.entryCount).toBe(2);
        });

        test('getSleepData returns null when no sleep entries exist', () => {
            const sleepData = dashboard.getSleepData(7);
            expect(sleepData).toBeNull();
        });

        test('getSleepData extracts recent sleep data correctly', () => {
            const today = new Date();
            dashboard.sleep.data.sleepEntries = [
                { duration: '7.5', quality: 8, timestamp: today.toISOString() },
                { duration: '8.0', quality: 9, timestamp: today.toISOString() }
            ];

            const sleepData = dashboard.getSleepData(7);
            expect(sleepData).not.toBeNull();
            expect(sleepData.avgDuration).toBe(7.75);
            expect(sleepData.avgQuality).toBe(8.5);
            expect(sleepData.entryCount).toBe(2);
        });

        test('getMedicationData returns null when no medications exist', () => {
            const medData = dashboard.getMedicationData(7);
            expect(medData).toBeNull();
        });

        test('getMedicationData calculates adherence correctly', () => {
            const today = new Date();
            dashboard.medication.data.medications = [
                { id: 1, name: 'Med1', active: true },
                { id: 2, name: 'Med2', active: true }
            ];
            dashboard.medication.data.history = [
                { medicationId: 1, timestamp: today.toISOString() },
                { medicationId: 2, timestamp: today.toISOString() },
                { medicationId: 1, timestamp: new Date(today - 86400000).toISOString() }
            ];

            const medData = dashboard.getMedicationData(7);
            expect(medData).not.toBeNull();
            expect(medData.activeMedications).toBe(2);
            expect(medData.dosesTaken).toBe(3);
        });
    });

    describe('Wellness Score Calculation', () => {
        test('returns zero score when no data exists', () => {
            const score = dashboard.calculateWellnessScore(7);
            expect(score.totalScore).toBe(0);
            // Exercise tracker exists by default, so max score is 25
            expect(score.maxScore).toBeGreaterThanOrEqual(0);
            expect(score.percentage).toBeGreaterThanOrEqual(0);
        });

        test('calculates mood score correctly', () => {
            const today = new Date();
            dashboard.mentalHealth.data.moodLogs = [
                { rating: 8, timestamp: today.toISOString() }
            ];

            const score = dashboard.calculateWellnessScore(7);
            expect(score.breakdown.mood).toBeDefined();
            expect(score.breakdown.mood.score).toBe(20); // (8/10) * 25
            expect(score.breakdown.mood.max).toBe(25);
        });

        test('calculates sleep score correctly for optimal duration', () => {
            const today = new Date();
            dashboard.sleep.data.sleepEntries = [
                { duration: '8.0', quality: 10, timestamp: today.toISOString() }
            ];

            const score = dashboard.calculateWellnessScore(7);
            expect(score.breakdown.sleep).toBeDefined();
            expect(score.breakdown.sleep.score).toBe(25); // 15 (quality) + 10 (optimal duration)
        });

        test('calculates exercise score correctly', () => {
            const today = new Date();
            const todayDate = today.toISOString().split('T')[0];
            dashboard.exercise.data.exercises = [
                { duration: 30, date: todayDate, timestamp: today.toISOString(), intensity: 'moderate', type: 'Running' }
            ];

            const score = dashboard.calculateWellnessScore(7);
            expect(score.breakdown.exercise).toBeDefined();
            // 30 min total / 7 days = 4.29 avg, (4.29/30)*25 = 3.57
            expect(score.breakdown.exercise.score).toBeCloseTo(3.6, 1);
        });

        test('calculates medication score correctly', () => {
            const today = new Date();
            dashboard.medication.data.medications = [
                { id: 1, name: 'Med1', active: true }
            ];
            dashboard.medication.data.history = [
                { medicationId: 1, timestamp: today.toISOString() },
                { medicationId: 1, timestamp: new Date(today - 86400000).toISOString() },
                { medicationId: 1, timestamp: new Date(today - 172800000).toISOString() },
                { medicationId: 1, timestamp: new Date(today - 259200000).toISOString() },
                { medicationId: 1, timestamp: new Date(today - 345600000).toISOString() },
                { medicationId: 1, timestamp: new Date(today - 432000000).toISOString() },
                { medicationId: 1, timestamp: new Date(today - 518400000).toISOString() }
            ];

            const score = dashboard.calculateWellnessScore(7);
            expect(score.breakdown.medication).toBeDefined();
            expect(score.breakdown.medication.score).toBe(25); // 100% adherence
        });

        test('calculates total wellness score correctly', () => {
            const today = new Date();
            const todayDate = today.toISOString().split('T')[0];

            // Mock all trackers with good data
            dashboard.mentalHealth.data.moodLogs = [
                { rating: 8, timestamp: today.toISOString() }
            ];
            dashboard.sleep.data.sleepEntries = [
                { duration: '8.0', quality: 8, timestamp: today.toISOString() }
            ];
            dashboard.exercise.data.exercises = [
                { duration: 30, date: todayDate, timestamp: today.toISOString(), intensity: 'moderate', type: 'Running' }
            ];
            dashboard.medication.data.medications = [
                { id: 1, name: 'Med1', active: true }
            ];
            dashboard.medication.data.history = Array(7).fill(null).map((_, i) => ({
                medicationId: 1,
                timestamp: new Date(today - i * 86400000).toISOString()
            }));

            const score = dashboard.calculateWellnessScore(7);
            expect(score.maxScore).toBe(100);
            expect(score.totalScore).toBeGreaterThan(0);
            expect(score.percentage).toBeGreaterThan(0);
        });
    });

    describe('Helper Functions', () => {
        test('getScoreEmoji returns correct emoji for different scores', () => {
            expect(dashboard.getScoreEmoji(95)).toBe('🌟');
            expect(dashboard.getScoreEmoji(85)).toBe('😊');
            expect(dashboard.getScoreEmoji(75)).toBe('🙂');
            expect(dashboard.getScoreEmoji(65)).toBe('😐');
            expect(dashboard.getScoreEmoji(55)).toBe('😕');
            expect(dashboard.getScoreEmoji(45)).toBe('😟');
        });

        test('getScoreLabel returns correct label for different scores', () => {
            expect(dashboard.getScoreLabel(95)).toBe('Excellent');
            expect(dashboard.getScoreLabel(85)).toBe('Great');
            expect(dashboard.getScoreLabel(75)).toBe('Good');
            expect(dashboard.getScoreLabel(65)).toBe('Fair');
            expect(dashboard.getScoreLabel(55)).toBe('Needs Attention');
            expect(dashboard.getScoreLabel(45)).toBe('Needs Improvement');
        });

        test('createProgressBar generates correct bar', () => {
            const bar20 = dashboard.createProgressBar(20, 25, 10);
            expect(bar20).toMatch(/\[.*\]/);

            const bar10 = dashboard.createProgressBar(10, 25, 10);
            expect(bar10).toMatch(/\[.*\]/);
        });
    });

    describe('Recommendations', () => {
        test('generates recommendations for low mood', () => {
            const wellnessScore = {
                percentage: 50,
                breakdown: {
                    mood: { score: 10, max: 25, data: { avgMood: 4 } }
                }
            };

            const recommendations = dashboard.generateRecommendations(wellnessScore);
            const moodRec = recommendations.find(r => r.category === 'Mood');
            expect(moodRec).toBeDefined();
            expect(moodRec.priority).toBe('high');
        });

        test('generates positive recommendations for high scores', () => {
            const wellnessScore = {
                percentage: 90,
                breakdown: {
                    mood: { score: 22, max: 25, data: { avgMood: 9 } }
                }
            };

            const recommendations = dashboard.generateRecommendations(wellnessScore);
            const moodRec = recommendations.find(r => r.category === 'Mood');
            expect(moodRec).toBeDefined();
            expect(moodRec.priority).toBe('positive');
        });

        test('generates sleep recommendations for poor sleep', () => {
            const wellnessScore = {
                percentage: 50,
                breakdown: {
                    sleep: { score: 8, max: 25, data: { avgDuration: 5, avgQuality: 4 } }
                }
            };

            const recommendations = dashboard.generateRecommendations(wellnessScore);
            const sleepRec = recommendations.find(r => r.category === 'Sleep');
            expect(sleepRec).toBeDefined();
            expect(sleepRec.priority).toBe('high');
        });

        test('generates exercise recommendations for low activity', () => {
            const wellnessScore = {
                percentage: 50,
                breakdown: {
                    exercise: { score: 10, max: 25, data: { avgMinutes: 12 } }
                }
            };

            const recommendations = dashboard.generateRecommendations(wellnessScore);
            const exerciseRec = recommendations.find(r => r.category === 'Exercise');
            expect(exerciseRec).toBeDefined();
            expect(exerciseRec.priority).toBe('medium');
        });

        test('generates medication recommendations for low adherence', () => {
            const wellnessScore = {
                percentage: 50,
                breakdown: {
                    medication: { score: 15, max: 25, data: { adherenceRate: 60 } }
                }
            };

            const recommendations = dashboard.generateRecommendations(wellnessScore);
            const medRec = recommendations.find(r => r.category === 'Medication');
            expect(medRec).toBeDefined();
            expect(medRec.priority).toBe('high');
        });
    });

    describe('Display Methods', () => {
        test('showDailyDashboard displays dashboard', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            dashboard.showDailyDashboard();
            expect(consoleSpy).toHaveBeenCalled();
            const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('DAILY WELLNESS DASHBOARD');
            consoleSpy.mockRestore();
        });

        test('showWeeklySummary displays summary', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            dashboard.showWeeklySummary();
            expect(consoleSpy).toHaveBeenCalled();
            const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('WEEKLY WELLNESS SUMMARY');
            consoleSpy.mockRestore();
        });
    });
});
