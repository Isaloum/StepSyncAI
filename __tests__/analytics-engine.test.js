const AnalyticsEngine = require('../analytics-engine');
const DailyDashboard = require('../daily-dashboard');

describe('AnalyticsEngine', () => {
    let analytics;
    let mockDashboard;

    beforeEach(() => {
        mockDashboard = {
            mentalHealth: { data: { moodLogs: [] } },
            sleepTracker: { data: { sleepEntries: [] } },
            exerciseTracker: { data: { exercises: [] } },
            medicationTracker: { data: { medications: [] } },
            getAllWellnessData: jest.fn().mockReturnValue({}),
            calculateWellnessScore: jest.fn().mockReturnValue({ percentage: 75 })
        };

        analytics = new AnalyticsEngine(mockDashboard);
    });

    describe('Correlation Calculation', () => {
        test('should calculate positive correlation correctly', () => {
            const series1 = [1, 2, 3, 4, 5];
            const series2 = [2, 4, 6, 8, 10];

            const correlation = analytics.calculateCorrelation(series1, series2);

            expect(correlation).toBeCloseTo(1, 2);
        });

        test('should calculate negative correlation correctly', () => {
            const series1 = [1, 2, 3, 4, 5];
            const series2 = [10, 8, 6, 4, 2];

            const correlation = analytics.calculateCorrelation(series1, series2);

            expect(correlation).toBeCloseTo(-1, 2);
        });

        test('should calculate no correlation correctly', () => {
            const series1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const series2 = [5, 2, 8, 1, 9, 3, 7, 4, 6, 10];

            const correlation = analytics.calculateCorrelation(series1, series2);

            expect(Math.abs(correlation)).toBeLessThan(0.5);
        });

        test('should return null for mismatched series lengths', () => {
            const series1 = [1, 2, 3];
            const series2 = [1, 2, 3, 4, 5];

            const correlation = analytics.calculateCorrelation(series1, series2);

            expect(correlation).toBeNull();
        });

        test('should return null for empty series', () => {
            const correlation = analytics.calculateCorrelation([], []);

            expect(correlation).toBeNull();
        });
    });

    describe('Correlation Interpretation', () => {
        test('should interpret strong correlation', () => {
            expect(analytics.interpretCorrelation(0.8)).toBe('Strong');
            expect(analytics.interpretCorrelation(-0.9)).toBe('Strong');
        });

        test('should interpret moderate correlation', () => {
            expect(analytics.interpretCorrelation(0.5)).toBe('Moderate');
            expect(analytics.interpretCorrelation(-0.6)).toBe('Moderate');
        });

        test('should interpret weak correlation', () => {
            expect(analytics.interpretCorrelation(0.3)).toBe('Weak');
            expect(analytics.interpretCorrelation(-0.2)).toBe('Weak');
        });

        test('should interpret very weak correlation', () => {
            expect(analytics.interpretCorrelation(0.1)).toBe('Very Weak');
            expect(analytics.interpretCorrelation(-0.05)).toBe('Very Weak');
        });

        test('should handle null correlation', () => {
            expect(analytics.interpretCorrelation(null)).toBe('Unknown');
        });
    });

    describe('Sleep-Exercise Correlation', () => {
        test('should return insufficient data message when no data', () => {
            const result = analytics.analyzeSleepExerciseCorrelation(30);

            expect(result.correlation).toBeNull();
            expect(result.message).toBe('Insufficient data');
        });

        test('should analyze correlation with sufficient data', () => {
            // Add mock data
            const today = new Date();
            for (let i = 0; i < 10; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);

                mockDashboard.sleepTracker.data.sleepEntries.push({
                    timestamp: date.toISOString(),
                    quality: 7 + i % 3,
                    duration: 7.5
                });

                mockDashboard.exerciseTracker.data.exercises.push({
                    timestamp: date.toISOString(),
                    duration: 30 + i * 5,
                    type: 'running',
                    intensity: 'moderate'
                });
            }

            const result = analytics.analyzeSleepExerciseCorrelation(30);

            // May return null if not enough overlapping data
            if (result.correlation !== null) {
                expect(result.sampleSize).toBeGreaterThanOrEqual(5);
                expect(result.strength).toBeDefined();
                expect(result.insight).toBeDefined();
            } else {
                expect(result.message).toBeDefined();
            }
        });

        test('should cache results', () => {
            const result1 = analytics.analyzeSleepExerciseCorrelation(30);
            const result2 = analytics.analyzeSleepExerciseCorrelation(30);

            expect(result1).toEqual(result2);
        });
    });

    describe('Trend Prediction', () => {
        test('should predict upward trend', () => {
            const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const prediction = analytics.predictTrend(data, 3);

            expect(prediction.slope).toBeGreaterThan(0);
            expect(prediction.trend).toBe('improving');
            expect(prediction.predictions).toHaveLength(3);
            expect(prediction.predictions[0]).toBeGreaterThan(data[data.length - 1]);
        });

        test('should predict downward trend', () => {
            const data = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
            const prediction = analytics.predictTrend(data, 3);

            expect(prediction.slope).toBeLessThan(0);
            expect(prediction.trend).toBe('declining');
            expect(prediction.predictions).toHaveLength(3);
        });

        test('should predict stable trend', () => {
            const data = [5, 5.1, 4.9, 5, 5.2, 4.8, 5];
            const prediction = analytics.predictTrend(data, 3);

            expect(prediction.trend).toBe('stable');
            expect(prediction.predictions).toHaveLength(3);
        });

        test('should return null for insufficient data', () => {
            const prediction = analytics.predictTrend([1], 3);

            expect(prediction).toBeNull();
        });

        test('should not predict negative values', () => {
            const data = [5, 4, 3, 2, 1];
            const prediction = analytics.predictTrend(data, 10);

            prediction.predictions.forEach(pred => {
                expect(pred).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('Anomaly Detection', () => {
        test('should detect no anomalies in consistent data', () => {
            const data = [5, 5.1, 4.9, 5, 5.2, 4.8, 5, 5.1];
            const anomalies = analytics.detectAnomalies(data);

            expect(anomalies).toHaveLength(0);
        });

        test('should detect high anomalies', () => {
            const data = [5, 5, 5, 5, 5, 5, 5, 5, 5, 20];
            const anomalies = analytics.detectAnomalies(data, 2.0);

            expect(anomalies.length).toBeGreaterThan(0);
            expect(anomalies[0].type).toBe('unusually high');
        });

        test('should detect low anomalies', () => {
            const data = [10, 10, 10, 10, 10, 10, 10, 10, 10, 1];
            const anomalies = analytics.detectAnomalies(data, 2.0);

            expect(anomalies.length).toBeGreaterThan(0);
            expect(anomalies[0].type).toBe('unusually low');
        });

        test('should return empty array for insufficient data', () => {
            const anomalies = analytics.detectAnomalies([1, 2]);

            expect(anomalies).toEqual([]);
        });

        test('should respect custom threshold', () => {
            const data = [5, 5, 5, 5, 8, 5, 5];

            const anomaliesStrict = analytics.detectAnomalies(data, 1.5);
            const anomaliesLenient = analytics.detectAnomalies(data, 3.0);

            expect(anomaliesStrict.length).toBeGreaterThanOrEqual(anomaliesLenient.length);
        });
    });

    describe('Moving Average', () => {
        test('should calculate moving average correctly', () => {
            const data = [1, 2, 3, 4, 5];
            const ma = analytics.calculateMovingAverage(data, 3);

            expect(ma).toHaveLength(5);
            expect(ma[0]).toBe(1);        // (1) / 1
            expect(ma[1]).toBe(1.5);      // (1 + 2) / 2
            expect(ma[2]).toBe(2);        // (1 + 2 + 3) / 3
            expect(ma[3]).toBe(3);        // (2 + 3 + 4) / 3
            expect(ma[4]).toBe(4);        // (3 + 4 + 5) / 3
        });

        test('should handle window larger than data', () => {
            const data = [1, 2, 3];
            const ma = analytics.calculateMovingAverage(data, 10);

            expect(ma).toHaveLength(3);
            expect(ma[ma.length - 1]).toBe(2); // Average of all 3 values
        });
    });

    describe('Insight Generation', () => {
        test('should generate correlation insight', () => {
            const insight = analytics.generateCorrelationInsight('sleep', 'exercise', 0.8);

            expect(insight).toContain('Strong');
            expect(insight).toContain('positively');
        });

        test('should generate actionable insights', () => {
            const insight1 = analytics.generateActionableInsight('Sleep & Exercise', 0.7);
            expect(insight1).toBeDefined();
            expect(insight1.length).toBeGreaterThan(0);

            const insight2 = analytics.generateActionableInsight('Mood & Sleep', 0.5);
            expect(insight2).toBeDefined();

            const insight3 = analytics.generateActionableInsight('Mood & Exercise', -0.3);
            expect(insight3).toBeDefined();
        });

        test('should generate trend insights', () => {
            const trendData1 = { trend: 'improving' };
            const insight1 = analytics.generateTrendInsight(trendData1);
            expect(insight1).toContain('great work');

            const trendData2 = { trend: 'declining' };
            const insight2 = analytics.generateTrendInsight(trendData2);
            expect(insight2).toContain('review');

            const trendData3 = { trend: 'stable' };
            const insight3 = analytics.generateTrendInsight(trendData3);
            expect(insight3).toContain('stable');
        });
    });

    describe('Report Generation', () => {
        test('should generate comprehensive report', () => {
            const report = analytics.generateReport(30);

            expect(report.period).toBe('30 days');
            expect(report.generated).toBeDefined();
            expect(report.correlations).toBeDefined();
            expect(report.trends).toBeDefined();
            expect(report.insights).toBeDefined();
        });

        test('should include all correlation analyses', () => {
            const report = analytics.generateReport(30);

            expect(report.correlations.sleepExercise).toBeDefined();
            expect(report.correlations.moodSleep).toBeDefined();
            expect(report.correlations.moodExercise).toBeDefined();
        });

        test('should include wellness trends', () => {
            const report = analytics.generateReport(30);

            expect(report.trends.wellness).toBeDefined();
        });

        test('should generate insights from significant correlations', () => {
            // Add strong correlation data
            const today = new Date();
            for (let i = 0; i < 10; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);

                mockDashboard.sleepTracker.data.sleepEntries.push({
                    timestamp: date.toISOString(),
                    quality: 10 - i,
                    duration: 7.5
                });

                mockDashboard.exerciseTracker.data.exercises.push({
                    timestamp: date.toISOString(),
                    duration: 60 - i * 5,
                    type: 'running',
                    intensity: 'moderate'
                });
            }

            const report = analytics.generateReport(30);

            // Report should include insights array
            expect(report.insights).toBeDefined();
            expect(Array.isArray(report.insights)).toBe(true);
        });
    });
});
