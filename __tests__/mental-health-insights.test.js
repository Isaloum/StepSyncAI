const MentalHealthTracker = require('../mental-health-tracker');
const fs = require('fs');

jest.mock('fs');

describe('Mental Health Insights & Correlations', () => {
    let tracker;
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('{}');
        fs.writeFileSync.mockImplementation(() => {});

        tracker = new MentalHealthTracker('test-mh.json');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('analyzeInsights - Entry Point', () => {
        test('shows message when not enough data', () => {
            tracker.data.moodEntries = [
                { id: 1, rating: 5, timestamp: new Date().toISOString() },
                { id: 2, rating: 6, timestamp: new Date().toISOString() }
            ];

            tracker.analyzeInsights();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Not enough data yet');
            expect(output).toContain('at least 5 mood entries');
        });

        test('runs all analysis methods with enough data', () => {
            // Add enough data
            for (let i = 0; i < 10; i++) {
                tracker.data.moodEntries.push({
                    id: i,
                    rating: 5 + Math.floor(Math.random() * 5),
                    timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
                });
            }

            tracker.analyzeInsights();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Mental Health Insights & Correlations');
            expect(output).toContain('patterns, not certainties');
        });
    });

    describe('analyzeTriggerMoodCorrelation', () => {
        beforeEach(() => {
            // Create baseline mood entries
            const baseDate = new Date('2024-01-01');
            for (let i = 0; i < 10; i++) {
                tracker.data.moodEntries.push({
                    id: i,
                    rating: 7,
                    timestamp: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString()
                });
            }
        });

        test('detects negative trigger impact on mood', () => {
            // Add a trigger
            const triggerDate = new Date('2024-01-05T10:00:00');
            tracker.data.triggers.push({
                id: 1,
                description: 'Work stress',
                intensity: 8,
                occurrences: 1,
                lastOccurred: triggerDate.toISOString()
            });

            // Add lower mood after trigger
            tracker.data.moodEntries.push({
                id: 100,
                rating: 3,
                timestamp: new Date(triggerDate.getTime() + 2 * 60 * 60 * 1000).toISOString() // 2 hours after
            });

            tracker.analyzeTriggerMoodCorrelation();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Trigger → Mood Impact');
            expect(output).toContain('Work stress');
            expect(output).toContain('lower');
        });

        test('shows no correlations message when no triggers', () => {
            tracker.data.triggers = [];

            tracker.analyzeTriggerMoodCorrelation();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).not.toContain('Trigger → Mood Impact');
        });

        test('handles triggers with no mood data nearby', () => {
            tracker.data.triggers.push({
                id: 1,
                description: 'Test trigger',
                intensity: 5,
                occurrences: 1,
                lastOccurred: new Date('2023-01-01').toISOString() // Long before mood entries
            });

            tracker.analyzeTriggerMoodCorrelation();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No clear trigger-mood correlations');
        });

        test('uses severity icons based on impact level', () => {
            const triggerDate = new Date('2024-01-05T10:00:00');

            // High impact trigger (> 1.5 points drop)
            tracker.data.triggers.push({
                id: 1,
                description: 'Severe trigger',
                intensity: 9,
                occurrences: 1,
                lastOccurred: triggerDate.toISOString()
            });

            tracker.data.moodEntries.push({
                id: 100,
                rating: 2, // Much lower than average of 7
                timestamp: new Date(triggerDate.getTime() + 1 * 60 * 60 * 1000).toISOString()
            });

            tracker.analyzeTriggerMoodCorrelation();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('🔴'); // Red icon for severe impact
        });
    });

    describe('analyzeSymptomMoodCorrelation', () => {
        beforeEach(() => {
            // Create baseline mood entries
            for (let i = 0; i < 10; i++) {
                tracker.data.moodEntries.push({
                    id: i,
                    rating: 7,
                    timestamp: new Date(2024, 0, i + 1, 12, 0).toISOString()
                });
            }
        });

        test('detects symptom-mood correlation', () => {
            // Add anxiety symptoms with corresponding lower mood
            const symptomDate = new Date(2024, 0, 5, 10, 0);

            tracker.data.symptoms.push({
                id: 1,
                symptomType: 'anxiety',
                severity: 8,
                timestamp: symptomDate.toISOString()
            });

            // Add low mood on same day
            tracker.data.moodEntries.push({
                id: 100,
                rating: 3,
                timestamp: new Date(2024, 0, 5, 14, 0).toISOString() // Same day
            });

            tracker.analyzeSymptomMoodCorrelation();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Symptom → Mood Impact');
            expect(output).toContain('Anxiety');
            expect(output).toContain('lower');
        });

        test('calculates average severity', () => {
            tracker.data.symptoms.push(
                {
                    id: 1,
                    symptomType: 'anxiety',
                    severity: 8,
                    timestamp: new Date(2024, 0, 5).toISOString()
                },
                {
                    id: 2,
                    symptomType: 'anxiety',
                    severity: 6,
                    timestamp: new Date(2024, 0, 6).toISOString()
                }
            );

            tracker.data.moodEntries.push({
                id: 100,
                rating: 4,
                timestamp: new Date(2024, 0, 5, 14, 0).toISOString()
            });

            tracker.analyzeSymptomMoodCorrelation();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('avg severity: 7.0/10');
        });

        test('shows message when no symptoms logged', () => {
            tracker.data.symptoms = [];

            tracker.analyzeSymptomMoodCorrelation();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).not.toContain('Symptom → Mood Impact');
        });
    });

    describe('analyzeTemporalPatterns', () => {
        test('identifies best and worst days of week', () => {
            // Add mood entries for different days with pattern
            // Mondays are bad (rating 3), Fridays are good (rating 9)
            for (let week = 0; week < 2; week++) {
                // Monday (bad)
                tracker.data.moodEntries.push({
                    id: week * 7 + 1,
                    rating: 3,
                    timestamp: new Date(2024, 0, 1 + week * 7, 12, 0).toISOString() // Jan 1 & 8 (Mondays)
                });

                // Friday (good)
                tracker.data.moodEntries.push({
                    id: week * 7 + 5,
                    rating: 9,
                    timestamp: new Date(2024, 0, 5 + week * 7, 12, 0).toISOString() // Jan 5 & 12 (Fridays)
                });
            }

            // Add some other days
            for (let i = 0; i < 5; i++) {
                tracker.data.moodEntries.push({
                    id: 20 + i,
                    rating: 6,
                    timestamp: new Date(2024, 0, 10 + i, 12, 0).toISOString()
                });
            }

            tracker.analyzeTemporalPatterns();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Temporal Patterns');
            expect(output).toContain('Best day');
            expect(output).toContain('Challenging day');
            expect(output).toContain('Friday');
            expect(output).toContain('Monday');
        });

        test('requires at least 7 mood entries', () => {
            tracker.data.moodEntries = [
                { id: 1, rating: 5, timestamp: new Date().toISOString() },
                { id: 2, rating: 6, timestamp: new Date().toISOString() }
            ];

            tracker.analyzeTemporalPatterns();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).not.toContain('Temporal Patterns');
        });
    });

    describe('analyzeCopingEffectiveness', () => {
        test('shows top effective coping strategies', () => {
            tracker.data.copingStrategies = [
                {
                    id: 1,
                    name: 'Meditation',
                    effectiveness: '8.5',
                    timesUsed: 10,
                    ratings: [{ rating: 8 }, { rating: 9 }]
                },
                {
                    id: 2,
                    name: 'Exercise',
                    effectiveness: '9.2',
                    timesUsed: 15,
                    ratings: [{ rating: 9 }, { rating: 9 }, { rating: 10 }]
                },
                {
                    id: 3,
                    name: 'Breathing',
                    effectiveness: '7.0',
                    timesUsed: 5,
                    ratings: [{ rating: 7 }]
                }
            ];

            tracker.analyzeCopingEffectiveness();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Most Effective Coping Strategies');
            expect(output).toContain('Exercise - 9.2/10');
            expect(output).toContain('Meditation - 8.5/10');
            expect(output).toContain('⭐'); // High effectiveness icon
        });

        test('uses different icons for effectiveness levels', () => {
            tracker.data.copingStrategies = [
                {
                    id: 1,
                    name: 'High',
                    effectiveness: '9.0',
                    timesUsed: 5,
                    ratings: [{ rating: 9 }]
                },
                {
                    id: 2,
                    name: 'Medium',
                    effectiveness: '6.5',
                    timesUsed: 5,
                    ratings: [{ rating: 6 }, { rating: 7 }]
                },
                {
                    id: 3,
                    name: 'Low',
                    effectiveness: '4.0',
                    timesUsed: 3,
                    ratings: [{ rating: 4 }]
                }
            ];

            tracker.analyzeCopingEffectiveness();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('⭐'); // >= 8
            expect(output).toContain('✓'); // >= 6
        });

        test('shows nothing when no strategies have ratings', () => {
            tracker.data.copingStrategies = [
                {
                    id: 1,
                    name: 'Unrated',
                    timesUsed: 5,
                    ratings: []
                }
            ];

            tracker.analyzeCopingEffectiveness();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).not.toContain('Most Effective Coping Strategies');
        });
    });

    describe('analyzeSymptomClusters', () => {
        test('detects symptoms that occur together', () => {
            const day1 = new Date(2024, 0, 1);
            const day2 = new Date(2024, 0, 2);
            const day3 = new Date(2024, 0, 3);

            // Anxiety + Depression together on 3 days
            tracker.data.symptoms = [
                { id: 1, symptomType: 'anxiety', severity: 7, timestamp: day1.toISOString() },
                { id: 2, symptomType: 'depression', severity: 6, timestamp: day1.toISOString() },

                { id: 3, symptomType: 'anxiety', severity: 8, timestamp: day2.toISOString() },
                { id: 4, symptomType: 'depression', severity: 7, timestamp: day2.toISOString() },

                { id: 5, symptomType: 'anxiety', severity: 6, timestamp: day3.toISOString() },
                { id: 6, symptomType: 'depression', severity: 5, timestamp: day3.toISOString() },

                // Add more symptoms to reach 10+ requirement
                { id: 7, symptomType: 'insomnia', severity: 5, timestamp: day1.toISOString() },
                { id: 8, symptomType: 'insomnia', severity: 6, timestamp: day2.toISOString() },
                { id: 9, symptomType: 'panic', severity: 8, timestamp: day3.toISOString() },
                { id: 10, symptomType: 'flashback', severity: 7, timestamp: day1.toISOString() }
            ];

            tracker.analyzeSymptomClusters();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('Symptom Co-occurrence Patterns');
            expect(output).toContain('anxiety + depression');
            expect(output).toContain('occurred together 3 times');
        });

        test('requires at least 10 symptoms', () => {
            tracker.data.symptoms = [
                { id: 1, symptomType: 'anxiety', severity: 7, timestamp: new Date().toISOString() },
                { id: 2, symptomType: 'depression', severity: 6, timestamp: new Date().toISOString() }
            ];

            tracker.analyzeSymptomClusters();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).not.toContain('Symptom Co-occurrence Patterns');
        });

        test('handles days with single symptoms (no clustering)', () => {
            // Each symptom on different days
            for (let i = 0; i < 10; i++) {
                tracker.data.symptoms.push({
                    id: i,
                    symptomType: 'anxiety',
                    severity: 5,
                    timestamp: new Date(2024, 0, i + 1).toISOString()
                });
            }

            tracker.analyzeSymptomClusters();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            expect(output).toContain('No significant symptom clustering');
        });

        test('sorts clusters by frequency', () => {
            const day1 = new Date(2024, 0, 1);
            const day2 = new Date(2024, 0, 2);
            const day3 = new Date(2024, 0, 3);

            tracker.data.symptoms = [
                // Anxiety + Depression (3 times)
                { id: 1, symptomType: 'anxiety', timestamp: day1.toISOString() },
                { id: 2, symptomType: 'depression', timestamp: day1.toISOString() },
                { id: 3, symptomType: 'anxiety', timestamp: day2.toISOString() },
                { id: 4, symptomType: 'depression', timestamp: day2.toISOString() },
                { id: 5, symptomType: 'anxiety', timestamp: day3.toISOString() },
                { id: 6, symptomType: 'depression', timestamp: day3.toISOString() },

                // Insomnia + Panic (2 times)
                { id: 7, symptomType: 'insomnia', timestamp: new Date(2024, 0, 4).toISOString() },
                { id: 8, symptomType: 'panic', timestamp: new Date(2024, 0, 4).toISOString() },
                { id: 9, symptomType: 'insomnia', timestamp: new Date(2024, 0, 5).toISOString() },
                { id: 10, symptomType: 'panic', timestamp: new Date(2024, 0, 5).toISOString() }
            ];

            tracker.analyzeSymptomClusters();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
            const lines = output.split('\n');

            // First cluster mentioned should be the most frequent
            const firstCluster = lines.find(line => line.includes('occurred together'));
            expect(firstCluster).toContain('3 times');
        });
    });

    describe('Integration Tests', () => {
        test('full insights analysis with rich dataset', () => {
            // Create a rich dataset
            const baseDate = new Date(2024, 0, 1);

            // Moods (varied by day of week)
            for (let i = 0; i < 30; i++) {
                const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
                const dayOfWeek = date.getDay();
                const rating = dayOfWeek === 1 ? 4 : dayOfWeek === 5 ? 8 : 6; // Monday low, Friday high

                tracker.data.moodEntries.push({
                    id: i,
                    rating: rating,
                    timestamp: date.toISOString()
                });
            }

            // Triggers
            tracker.data.triggers.push({
                id: 1,
                description: 'Work deadline',
                intensity: 8,
                occurrences: 3,
                lastOccurred: new Date(2024, 0, 15).toISOString()
            });

            // Symptoms
            for (let i = 0; i < 15; i++) {
                tracker.data.symptoms.push({
                    id: i,
                    symptomType: i % 2 === 0 ? 'anxiety' : 'insomnia',
                    severity: 7,
                    timestamp: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString()
                });
            }

            // Coping strategies
            tracker.data.copingStrategies.push({
                id: 1,
                name: 'Meditation',
                effectiveness: '8.5',
                timesUsed: 20,
                ratings: [{ rating: 8 }, { rating: 9 }]
            });

            tracker.analyzeInsights();

            const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

            // Verify all sections appear
            expect(output).toContain('Mental Health Insights & Correlations');
            expect(output).toContain('Trigger → Mood Impact');
            expect(output).toContain('Symptom → Mood Impact');
            expect(output).toContain('Temporal Patterns');
            expect(output).toContain('Most Effective Coping Strategies');
            expect(output).toContain('Symptom Co-occurrence Patterns');
            expect(output).toContain('patterns, not certainties');
        });
    });
});
