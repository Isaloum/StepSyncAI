const { PerformanceCache, DateUtils } = require('./performance-cache');

/**
 * Advanced Analytics Engine for StepSyncAI
 * Provides correlation analysis, predictive insights, and anomaly detection
 */
class AnalyticsEngine {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.cache = new PerformanceCache(50, 600000); // 10-minute cache
    }

    /**
     * Calculate correlation between two data series
     * Returns Pearson correlation coefficient (-1 to 1)
     */
    calculateCorrelation(series1, series2) {
        if (series1.length !== series2.length || series1.length === 0) {
            return null;
        }

        const n = series1.length;
        const mean1 = series1.reduce((sum, val) => sum + val, 0) / n;
        const mean2 = series2.reduce((sum, val) => sum + val, 0) / n;

        let numerator = 0;
        let sumSq1 = 0;
        let sumSq2 = 0;

        for (let i = 0; i < n; i++) {
            const diff1 = series1[i] - mean1;
            const diff2 = series2[i] - mean2;
            numerator += diff1 * diff2;
            sumSq1 += diff1 * diff1;
            sumSq2 += diff2 * diff2;
        }

        const denominator = Math.sqrt(sumSq1 * sumSq2);
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Analyze correlation between sleep quality and exercise
     */
    analyzeSleepExerciseCorrelation(days = 30) {
        const cacheKey = this.cache.generateKey('sleep-exercise-corr', days);
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const allData = this.dashboard.getAllWellnessData(days);

        if (!allData.sleep || !allData.exercise) {
            return { correlation: null, message: 'Insufficient data' };
        }

        // Get sleep data by date
        const sleepByDate = new Map();
        if (this.dashboard.sleepTracker && this.dashboard.sleepTracker.data.sleepEntries) {
            this.dashboard.sleepTracker.data.sleepEntries.forEach(entry => {
                const date = DateUtils.toDateKey(entry.timestamp);
                sleepByDate.set(date, entry.quality);
            });
        }

        // Get exercise duration by date
        const exerciseByDate = new Map();
        if (this.dashboard.exerciseTracker && this.dashboard.exerciseTracker.data.exercises) {
            this.dashboard.exerciseTracker.data.exercises.forEach(ex => {
                const date = DateUtils.toDateKey(ex.timestamp);
                const current = exerciseByDate.get(date) || 0;
                exerciseByDate.set(date, current + ex.duration);
            });
        }

        // Find common dates
        const commonDates = [...sleepByDate.keys()].filter(date => exerciseByDate.has(date));

        if (commonDates.length < 5) {
            return { correlation: null, message: 'Need at least 5 days of overlapping data' };
        }

        const sleepQuality = commonDates.map(date => sleepByDate.get(date));
        const exerciseDuration = commonDates.map(date => exerciseByDate.get(date));

        const correlation = this.calculateCorrelation(sleepQuality, exerciseDuration);

        const result = {
            correlation,
            strength: this.interpretCorrelation(correlation),
            sampleSize: commonDates.length,
            insight: this.generateCorrelationInsight('sleep quality', 'exercise', correlation)
        };

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Analyze correlation between mood and sleep
     */
    analyzeMoodSleepCorrelation(days = 30) {
        const cacheKey = this.cache.generateKey('mood-sleep-corr', days);
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Get mood data by date
        const moodByDate = new Map();
        if (this.dashboard.mentalHealth && this.dashboard.mentalHealth.data.moodLogs) {
            this.dashboard.mentalHealth.data.moodLogs.forEach(log => {
                const date = DateUtils.toDateKey(log.timestamp);
                moodByDate.set(date, log.mood);
            });
        }

        // Get sleep quality by date
        const sleepByDate = new Map();
        if (this.dashboard.sleepTracker && this.dashboard.sleepTracker.data.sleepEntries) {
            this.dashboard.sleepTracker.data.sleepEntries.forEach(entry => {
                const date = DateUtils.toDateKey(entry.timestamp);
                sleepByDate.set(date, entry.quality);
            });
        }

        const commonDates = [...moodByDate.keys()].filter(date => sleepByDate.has(date));

        if (commonDates.length < 5) {
            return { correlation: null, message: 'Need at least 5 days of overlapping data' };
        }

        const mood = commonDates.map(date => moodByDate.get(date));
        const sleep = commonDates.map(date => sleepByDate.get(date));

        const correlation = this.calculateCorrelation(mood, sleep);

        const result = {
            correlation,
            strength: this.interpretCorrelation(correlation),
            sampleSize: commonDates.length,
            insight: this.generateCorrelationInsight('mood', 'sleep quality', correlation)
        };

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Analyze correlation between mood and exercise
     */
    analyzeMoodExerciseCorrelation(days = 30) {
        const cacheKey = this.cache.generateKey('mood-exercise-corr', days);
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Get mood data by date
        const moodByDate = new Map();
        if (this.dashboard.mentalHealth && this.dashboard.mentalHealth.data.moodLogs) {
            this.dashboard.mentalHealth.data.moodLogs.forEach(log => {
                const date = DateUtils.toDateKey(log.timestamp);
                moodByDate.set(date, log.mood);
            });
        }

        // Get exercise duration by date
        const exerciseByDate = new Map();
        if (this.dashboard.exerciseTracker && this.dashboard.exerciseTracker.data.exercises) {
            this.dashboard.exerciseTracker.data.exercises.forEach(ex => {
                const date = DateUtils.toDateKey(ex.timestamp);
                const current = exerciseByDate.get(date) || 0;
                exerciseByDate.set(date, current + ex.duration);
            });
        }

        const commonDates = [...moodByDate.keys()].filter(date => exerciseByDate.has(date));

        if (commonDates.length < 5) {
            return { correlation: null, message: 'Need at least 5 days of overlapping data' };
        }

        const mood = commonDates.map(date => moodByDate.get(date));
        const exercise = commonDates.map(date => exerciseByDate.get(date));

        const correlation = this.calculateCorrelation(mood, exercise);

        const result = {
            correlation,
            strength: this.interpretCorrelation(correlation),
            sampleSize: commonDates.length,
            insight: this.generateCorrelationInsight('mood', 'exercise', correlation)
        };

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Interpret correlation strength
     */
    interpretCorrelation(r) {
        if (r === null) return 'Unknown';
        const absR = Math.abs(r);
        if (absR >= 0.7) return 'Strong';
        if (absR >= 0.4) return 'Moderate';
        if (absR >= 0.2) return 'Weak';
        return 'Very Weak';
    }

    /**
     * Generate insight from correlation
     */
    generateCorrelationInsight(metric1, metric2, correlation) {
        if (correlation === null) return 'Not enough data for analysis';

        const absR = Math.abs(correlation);
        const direction = correlation > 0 ? 'positively' : 'negatively';

        if (absR >= 0.7) {
            return `Strong ${direction} correlated: ${metric1} and ${metric2} move together significantly.`;
        } else if (absR >= 0.4) {
            return `Moderately ${direction} correlated: ${metric1} tends to ${correlation > 0 ? 'improve' : 'worsen'} with ${metric2}.`;
        } else if (absR >= 0.2) {
            return `Weakly ${direction} correlated: ${metric1} shows some relationship with ${metric2}.`;
        } else {
            return `Little to no correlation: ${metric1} and ${metric2} appear independent.`;
        }
    }

    /**
     * Predict future trend using linear regression
     */
    predictTrend(data, daysAhead = 7) {
        if (data.length < 2) return null;

        // Simple linear regression: y = mx + b
        const n = data.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = data;

        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Predict future values
        const predictions = [];
        for (let i = 0; i < daysAhead; i++) {
            const futureX = n + i;
            const prediction = slope * futureX + intercept;
            predictions.push(Math.max(0, prediction)); // No negative predictions
        }

        return {
            slope,
            intercept,
            predictions,
            trend: slope > 0.1 ? 'improving' : slope < -0.1 ? 'declining' : 'stable'
        };
    }

    /**
     * Detect anomalies using Z-score
     */
    detectAnomalies(data, threshold = 2.5) {
        if (data.length < 3) return [];

        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);

        const anomalies = [];
        data.forEach((value, index) => {
            const zScore = stdDev === 0 ? 0 : (value - mean) / stdDev;
            if (Math.abs(zScore) > threshold) {
                anomalies.push({
                    index,
                    value,
                    zScore,
                    type: zScore > 0 ? 'unusually high' : 'unusually low'
                });
            }
        });

        return anomalies;
    }

    /**
     * Analyze wellness score trends
     */
    analyzeWellnessTrends(days = 30) {
        const cacheKey = this.cache.generateKey('wellness-trends', days);
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const scores = [];
        const cutoffDate = DateUtils.getCutoffDate(days);

        // Get daily wellness scores
        for (let i = 0; i < days; i++) {
            const date = new Date(cutoffDate);
            date.setDate(date.getDate() + i);

            // Calculate score for this day (simplified - you may want to use actual historical data)
            const dayData = this.dashboard.getAllWellnessData(1);
            if (dayData.mood || dayData.sleep || dayData.exercise) {
                const score = this.dashboard.calculateWellnessScore(1);
                scores.push(score.percentage);
            }
        }

        if (scores.length < 7) {
            return { message: 'Need at least 7 days of data for trend analysis' };
        }

        // Predict future trend
        const prediction = this.predictTrend(scores, 7);

        // Detect anomalies
        const anomalies = this.detectAnomalies(scores);

        // Calculate moving average
        const movingAvg = this.calculateMovingAverage(scores, 7);

        const result = {
            current: scores[scores.length - 1],
            average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
            trend: prediction?.trend,
            prediction: prediction?.predictions,
            anomalies: anomalies.length,
            anomalyDetails: anomalies,
            movingAverage: movingAvg[movingAvg.length - 1]
        };

        this.cache.set(cacheKey, result);
        return result;
    }

    /**
     * Calculate moving average
     */
    calculateMovingAverage(data, window = 7) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            const start = Math.max(0, i - window + 1);
            const windowData = data.slice(start, i + 1);
            const avg = windowData.reduce((sum, val) => sum + val, 0) / windowData.length;
            result.push(avg);
        }
        return result;
    }

    /**
     * Generate comprehensive analytics report
     */
    generateReport(days = 30) {
        const report = {
            period: `${days} days`,
            generated: new Date().toISOString(),
            correlations: {},
            trends: {},
            insights: []
        };

        // Correlation analysis
        report.correlations.sleepExercise = this.analyzeSleepExerciseCorrelation(days);
        report.correlations.moodSleep = this.analyzeMoodSleepCorrelation(days);
        report.correlations.moodExercise = this.analyzeMoodExerciseCorrelation(days);

        // Trend analysis
        report.trends.wellness = this.analyzeWellnessTrends(days);

        // Generate insights
        const correlations = [
            { name: 'Sleep & Exercise', data: report.correlations.sleepExercise },
            { name: 'Mood & Sleep', data: report.correlations.moodSleep },
            { name: 'Mood & Exercise', data: report.correlations.moodExercise }
        ];

        correlations.forEach(({ name, data }) => {
            if (data.correlation !== null && Math.abs(data.correlation) >= 0.4) {
                report.insights.push({
                    type: 'correlation',
                    title: `${name} Correlation`,
                    description: data.insight,
                    strength: data.strength,
                    actionable: this.generateActionableInsight(name, data.correlation)
                });
            }
        });

        // Trend insights
        if (report.trends.wellness.trend) {
            report.insights.push({
                type: 'trend',
                title: 'Wellness Trend',
                description: `Your wellness is ${report.trends.wellness.trend}`,
                actionable: this.generateTrendInsight(report.trends.wellness)
            });
        }

        // Anomaly insights
        if (report.trends.wellness.anomalies > 0) {
            report.insights.push({
                type: 'anomaly',
                title: 'Unusual Patterns Detected',
                description: `Found ${report.trends.wellness.anomalies} unusual day(s) in your wellness data`,
                actionable: 'Review these days to identify what caused the deviation'
            });
        }

        return report;
    }

    /**
     * Generate actionable insight from correlation
     */
    generateActionableInsight(correlationName, r) {
        if (correlationName.includes('Sleep & Exercise')) {
            return r > 0
                ? 'Increase exercise to potentially improve sleep quality'
                : 'Monitor how exercise timing affects your sleep';
        } else if (correlationName.includes('Mood & Sleep')) {
            return r > 0
                ? 'Prioritize good sleep to maintain positive mood'
                : 'Consider factors beyond sleep affecting your mood';
        } else if (correlationName.includes('Mood & Exercise')) {
            return r > 0
                ? 'Regular exercise may help improve your mood'
                : 'Exercise effects on mood may vary - track patterns';
        }
        return 'Continue tracking to refine insights';
    }

    /**
     * Generate trend insight
     */
    generateTrendInsight(trendData) {
        if (trendData.trend === 'improving') {
            return 'Keep up the great work! Your wellness is on an upward trajectory.';
        } else if (trendData.trend === 'declining') {
            return 'Consider reviewing your recent habits and making adjustments.';
        } else {
            return 'Your wellness is stable. Set new goals to reach the next level.';
        }
    }

    /**
     * Display analytics dashboard
     */
    displayDashboard(days = 30) {
        const report = this.generateReport(days);

        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║              Advanced Analytics Dashboard                     ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
        console.log(`\nAnalysis Period: ${report.period}`);
        console.log(`Generated: ${new Date(report.generated).toLocaleString()}\n`);

        // Correlations
        console.log('═'.repeat(65));
        console.log('📊 CORRELATION ANALYSIS');
        console.log('═'.repeat(65));

        const corrData = [
            { name: 'Sleep Quality & Exercise', ...report.correlations.sleepExercise },
            { name: 'Mood & Sleep Quality', ...report.correlations.moodSleep },
            { name: 'Mood & Exercise', ...report.correlations.moodExercise }
        ];

        corrData.forEach(corr => {
            const icon = corr.correlation === null ? '⚠️ ' :
                        Math.abs(corr.correlation) >= 0.7 ? '🔥' :
                        Math.abs(corr.correlation) >= 0.4 ? '📈' : '📉';

            console.log(`\n${icon} ${corr.name}`);
            if (corr.correlation !== null) {
                console.log(`   Correlation: ${corr.correlation.toFixed(3)} (${corr.strength})`);
                console.log(`   Sample Size: ${corr.sampleSize} days`);
                console.log(`   ${corr.insight}`);
            } else {
                console.log(`   ${corr.message}`);
            }
        });

        // Trends
        console.log('\n' + '═'.repeat(65));
        console.log('📈 WELLNESS TRENDS');
        console.log('═'.repeat(65));

        if (report.trends.wellness.message) {
            console.log(`\n⚠️  ${report.trends.wellness.message}`);
        } else {
            console.log(`\nCurrent: ${report.trends.wellness.current?.toFixed(1)}%`);
            console.log(`Average: ${report.trends.wellness.average?.toFixed(1)}%`);
            console.log(`Trend: ${report.trends.wellness.trend}`);

            if (report.trends.wellness.prediction) {
                console.log(`\n7-Day Forecast:`);
                report.trends.wellness.prediction.slice(0, 3).forEach((pred, i) => {
                    console.log(`   Day ${i + 1}: ${pred.toFixed(1)}%`);
                });
            }

            if (report.trends.wellness.anomalies > 0) {
                console.log(`\n⚠️  Detected ${report.trends.wellness.anomalies} anomalous day(s)`);
            }
        }

        // Key Insights
        console.log('\n' + '═'.repeat(65));
        console.log('💡 KEY INSIGHTS & RECOMMENDATIONS');
        console.log('═'.repeat(65));

        if (report.insights.length === 0) {
            console.log('\n📭 Not enough data yet. Keep tracking to unlock insights!');
        } else {
            report.insights.forEach((insight, index) => {
                const icon = insight.type === 'correlation' ? '🔗' :
                            insight.type === 'trend' ? '📈' : '⚠️ ';
                console.log(`\n${index + 1}. ${icon} ${insight.title}`);
                console.log(`   ${insight.description}`);
                console.log(`   💡 ${insight.actionable}`);
            });
        }

        console.log('\n' + '═'.repeat(65));
    }
}

module.exports = AnalyticsEngine;
