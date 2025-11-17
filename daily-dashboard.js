const fs = require('fs');
const MentalHealthTracker = require('./mental-health-tracker');
const MedicationTracker = require('./medication-tracker');
const SleepTracker = require('./sleep-tracker');
const ExerciseTracker = require('./exercise-tracker');

class DailyDashboard {
    constructor() {
        this.mentalHealth = null;
        this.medication = null;
        this.sleep = null;
        this.exercise = null;
        this.loadTrackers();
    }

    loadTrackers() {
        try {
            this.mentalHealth = new MentalHealthTracker();
        } catch (error) {
            console.log('⚠️  Mental Health Tracker not available');
        }

        try {
            this.medication = new MedicationTracker();
        } catch (error) {
            console.log('⚠️  Medication Tracker not available');
        }

        try {
            this.sleep = new SleepTracker();
        } catch (error) {
            console.log('⚠️  Sleep Tracker not available');
        }

        try {
            this.exercise = new ExerciseTracker();
        } catch (error) {
            console.log('⚠️  Exercise Tracker not available');
        }
    }

    getMoodData(days = 7) {
        if (!this.mentalHealth || !this.mentalHealth.data.moodLogs) {
            return null;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        const recentMoods = this.mentalHealth.data.moodLogs
            .filter(log => new Date(log.timestamp) >= cutoffDate);

        if (recentMoods.length === 0) {
            return null;
        }

        const avgMood = recentMoods.reduce((sum, log) => sum + log.rating, 0) / recentMoods.length;
        const latestMood = recentMoods[recentMoods.length - 1];
        const todayMoods = recentMoods.filter(log => {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            return logDate === today;
        });

        return {
            avgMood,
            latestMood: latestMood.rating,
            todayMood: todayMoods.length > 0 ? todayMoods[todayMoods.length - 1].rating : null,
            entryCount: recentMoods.length
        };
    }

    getSleepData(days = 7) {
        if (!this.sleep || !this.sleep.data.sleepEntries) {
            return null;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        const recentSleep = this.sleep.data.sleepEntries
            .filter(entry => new Date(entry.timestamp) >= cutoffDate);

        if (recentSleep.length === 0) {
            return null;
        }

        const avgDuration = recentSleep.reduce((sum, entry) => sum + parseFloat(entry.duration), 0) / recentSleep.length;
        const avgQuality = recentSleep.reduce((sum, entry) => sum + entry.quality, 0) / recentSleep.length;
        const latestSleep = recentSleep[recentSleep.length - 1];

        return {
            avgDuration,
            avgQuality,
            latestDuration: parseFloat(latestSleep.duration),
            latestQuality: latestSleep.quality,
            entryCount: recentSleep.length
        };
    }

    getExerciseData(days = 7) {
        if (!this.exercise) {
            return null;
        }

        return this.exercise.getExerciseDataForDashboard(days);
    }

    getMedicationData(days = 7) {
        if (!this.medication || !this.medication.data.medications) {
            return null;
        }

        const activeMeds = this.medication.data.medications.filter(med => med.active);

        if (activeMeds.length === 0) {
            return null;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        // Calculate adherence from history
        const recentHistory = this.medication.data.history
            .filter(h => new Date(h.timestamp) >= cutoffDate);

        const totalDoses = days * activeMeds.length; // Assuming 1 dose per day per med
        const takenDoses = recentHistory.length;
        const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

        return {
            activeMedications: activeMeds.length,
            adherenceRate,
            dosesTaken: takenDoses,
            entryCount: recentHistory.length
        };
    }

    calculateWellnessScore(days = 7) {
        let totalScore = 0;
        let maxScore = 0;
        const breakdown = {};

        // Mood Score (0-25 points)
        const moodData = this.getMoodData(days);
        if (moodData) {
            const moodScore = (moodData.avgMood / 10) * 25;
            breakdown.mood = {
                score: parseFloat(moodScore.toFixed(1)),
                max: 25,
                data: moodData
            };
            totalScore += moodScore;
            maxScore += 25;
        }

        // Sleep Score (0-25 points)
        const sleepData = this.getSleepData(days);
        if (sleepData) {
            // Quality worth 15 points, duration worth 10 points
            const qualityScore = (sleepData.avgQuality / 10) * 15;
            // Optimal duration is 7-9 hours
            let durationScore = 0;
            if (sleepData.avgDuration >= 7 && sleepData.avgDuration <= 9) {
                durationScore = 10;
            } else if (sleepData.avgDuration >= 6 && sleepData.avgDuration <= 10) {
                durationScore = 7;
            } else if (sleepData.avgDuration >= 5 && sleepData.avgDuration <= 11) {
                durationScore = 4;
            }

            const sleepScore = qualityScore + durationScore;
            breakdown.sleep = {
                score: parseFloat(sleepScore.toFixed(1)),
                max: 25,
                data: sleepData
            };
            totalScore += sleepScore;
            maxScore += 25;
        }

        // Exercise Score (0-25 points)
        const exerciseData = this.getExerciseData(days);
        if (exerciseData) {
            // Goal is 30 min per day on average
            const avgDailyMinutes = exerciseData.avgMinutes;
            let exerciseScore = 0;
            if (avgDailyMinutes >= 30) {
                exerciseScore = 25;
            } else {
                exerciseScore = (avgDailyMinutes / 30) * 25;
            }

            breakdown.exercise = {
                score: parseFloat(exerciseScore.toFixed(1)),
                max: 25,
                data: exerciseData
            };
            totalScore += exerciseScore;
            maxScore += 25;
        }

        // Medication Score (0-25 points)
        const medData = this.getMedicationData(days);
        if (medData) {
            const medScore = (medData.adherenceRate / 100) * 25;
            breakdown.medication = {
                score: parseFloat(medScore.toFixed(1)),
                max: 25,
                data: medData
            };
            totalScore += medScore;
            maxScore += 25;
        }

        return {
            totalScore: parseFloat(totalScore.toFixed(1)),
            maxScore,
            percentage: maxScore > 0 ? parseFloat(((totalScore / maxScore) * 100).toFixed(1)) : 0,
            breakdown
        };
    }

    getScoreEmoji(percentage) {
        if (percentage >= 90) return '🌟';
        if (percentage >= 80) return '😊';
        if (percentage >= 70) return '🙂';
        if (percentage >= 60) return '😐';
        if (percentage >= 50) return '😕';
        return '😟';
    }

    getScoreLabel(percentage) {
        if (percentage >= 90) return 'Excellent';
        if (percentage >= 80) return 'Great';
        if (percentage >= 70) return 'Good';
        if (percentage >= 60) return 'Fair';
        if (percentage >= 50) return 'Needs Attention';
        return 'Needs Improvement';
    }

    generateRecommendations(wellnessScore) {
        const recommendations = [];
        const { breakdown } = wellnessScore;

        // Mood recommendations
        if (breakdown.mood) {
            const moodPercentage = (breakdown.mood.score / breakdown.mood.max) * 100;
            if (moodPercentage < 60) {
                recommendations.push({
                    category: 'Mood',
                    priority: 'high',
                    message: 'Your mood has been lower than usual. Consider journaling, talking to your therapist, or practicing coping strategies.',
                    emoji: '🧠'
                });
            } else if (moodPercentage >= 80) {
                recommendations.push({
                    category: 'Mood',
                    priority: 'positive',
                    message: 'Your mood is looking great! Keep up the good work with your coping strategies.',
                    emoji: '🌟'
                });
            }
        }

        // Sleep recommendations
        if (breakdown.sleep) {
            const sleepPercentage = (breakdown.sleep.score / breakdown.sleep.max) * 100;
            const avgDuration = breakdown.sleep.data.avgDuration;

            if (sleepPercentage < 60) {
                if (avgDuration < 6) {
                    recommendations.push({
                        category: 'Sleep',
                        priority: 'high',
                        message: `You're averaging ${avgDuration.toFixed(1)}h of sleep. Aim for 7-9 hours for better recovery.`,
                        emoji: '😴'
                    });
                } else if (breakdown.sleep.data.avgQuality < 6) {
                    recommendations.push({
                        category: 'Sleep',
                        priority: 'medium',
                        message: 'Your sleep quality could improve. Try establishing a consistent bedtime routine.',
                        emoji: '😴'
                    });
                }
            }
        }

        // Exercise recommendations
        if (breakdown.exercise) {
            const exercisePercentage = (breakdown.exercise.score / breakdown.exercise.max) * 100;
            const avgMinutes = breakdown.exercise.data.avgMinutes;

            if (exercisePercentage < 60) {
                recommendations.push({
                    category: 'Exercise',
                    priority: 'medium',
                    message: `You're averaging ${avgMinutes.toFixed(0)} min/day. Try to reach 30 minutes of daily activity.`,
                    emoji: '🏃'
                });
            } else if (exercisePercentage >= 80) {
                recommendations.push({
                    category: 'Exercise',
                    priority: 'positive',
                    message: 'Great job staying active! Regular exercise supports both physical and mental health.',
                    emoji: '💪'
                });
            }
        }

        // Medication recommendations
        if (breakdown.medication) {
            const medPercentage = (breakdown.medication.score / breakdown.medication.max) * 100;

            if (medPercentage < 80) {
                recommendations.push({
                    category: 'Medication',
                    priority: 'high',
                    message: `Medication adherence is at ${breakdown.medication.data.adherenceRate.toFixed(0)}%. Consistency is key for effectiveness.`,
                    emoji: '💊'
                });
            } else if (medPercentage >= 95) {
                recommendations.push({
                    category: 'Medication',
                    priority: 'positive',
                    message: 'Excellent medication adherence! You\'re staying on track.',
                    emoji: '✅'
                });
            }
        }

        // Overall wellness recommendation
        if (wellnessScore.percentage >= 85) {
            recommendations.push({
                category: 'Overall',
                priority: 'positive',
                message: 'You\'re doing an excellent job managing your wellness across all areas!',
                emoji: '🎉'
            });
        } else if (wellnessScore.percentage < 60) {
            recommendations.push({
                category: 'Overall',
                priority: 'high',
                message: 'Focus on one area at a time. Small, consistent improvements add up!',
                emoji: '🎯'
            });
        }

        return recommendations;
    }

    showDailyDashboard() {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║           📊 DAILY WELLNESS DASHBOARD                      ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        const todayDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        console.log(`📅 ${todayDate}\n`);

        const wellnessScore = this.calculateWellnessScore(1); // Today only

        if (wellnessScore.maxScore === 0) {
            console.log('📭 No wellness data available yet. Start tracking to see your dashboard!\n');
            console.log('Quick start:');
            console.log('  • Log your mood: node mental-health-tracker.js mood 7');
            console.log('  • Log sleep: node sleep-tracker.js log 23:00 07:00 8');
            console.log('  • Log exercise: node exercise-tracker.js log "Walking" 30');
            console.log('  • Take medication: node medication-tracker.js take <med-id>\n');
            return;
        }

        // Overall Wellness Score
        const emoji = this.getScoreEmoji(wellnessScore.percentage);
        const label = this.getScoreLabel(wellnessScore.percentage);

        console.log('┌─────────────────────────────────────────────────────────┐');
        console.log(`│  ${emoji}  OVERALL WELLNESS: ${wellnessScore.totalScore}/${wellnessScore.maxScore} (${wellnessScore.percentage}%) - ${label}`);
        console.log('└─────────────────────────────────────────────────────────┘\n');

        // Score Breakdown
        console.log('📊 Score Breakdown:\n');

        if (wellnessScore.breakdown.mood) {
            const mb = wellnessScore.breakdown.mood;
            const bar = this.createProgressBar(mb.score, mb.max);
            console.log(`  🧠 Mood:        ${bar} ${mb.score}/${mb.max}`);
            console.log(`     Current: ${mb.data.todayMood !== null ? mb.data.todayMood + '/10' : 'Not logged today'}\n`);
        }

        if (wellnessScore.breakdown.sleep) {
            const sb = wellnessScore.breakdown.sleep;
            const bar = this.createProgressBar(sb.score, sb.max);
            console.log(`  😴 Sleep:       ${bar} ${sb.score}/${sb.max}`);
            console.log(`     Last: ${sb.data.latestDuration.toFixed(1)}h, Quality: ${sb.data.latestQuality}/10\n`);
        }

        if (wellnessScore.breakdown.exercise) {
            const eb = wellnessScore.breakdown.exercise;
            const bar = this.createProgressBar(eb.score, eb.max);
            console.log(`  🏃 Exercise:    ${bar} ${eb.score}/${eb.max}`);
            console.log(`     Today: ${eb.data.todayMinutes} min (Goal: 30 min)\n`);
        }

        if (wellnessScore.breakdown.medication) {
            const medb = wellnessScore.breakdown.medication;
            const bar = this.createProgressBar(medb.score, medb.max);
            console.log(`  💊 Medication:  ${bar} ${medb.score}/${medb.max}`);
            console.log(`     Adherence: ${medb.data.adherenceRate.toFixed(0)}%\n`);
        }

        // Recommendations
        const recommendations = this.generateRecommendations(wellnessScore);
        if (recommendations.length > 0) {
            console.log('💡 Today\'s Recommendations:\n');
            recommendations.forEach(rec => {
                const prioritySymbol = rec.priority === 'high' ? '🔴' :
                                      rec.priority === 'medium' ? '🟡' : '✅';
                console.log(`  ${prioritySymbol} ${rec.emoji} ${rec.message}`);
            });
            console.log('');
        }
    }

    showWeeklySummary() {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║         📊 WEEKLY WELLNESS SUMMARY                         ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        const wellnessScore = this.calculateWellnessScore(7);

        if (wellnessScore.maxScore === 0) {
            console.log('📭 No wellness data available yet. Start tracking to see your summary!\n');
            return;
        }

        // Overall Score
        const emoji = this.getScoreEmoji(wellnessScore.percentage);
        const label = this.getScoreLabel(wellnessScore.percentage);

        console.log('┌─────────────────────────────────────────────────────────┐');
        console.log(`│  ${emoji}  WEEKLY WELLNESS: ${wellnessScore.totalScore}/${wellnessScore.maxScore} (${wellnessScore.percentage}%) - ${label}`);
        console.log('└─────────────────────────────────────────────────────────┘\n');

        // Detailed Breakdown
        console.log('📊 7-Day Averages:\n');

        if (wellnessScore.breakdown.mood) {
            const mb = wellnessScore.breakdown.mood;
            console.log(`  🧠 Mood:`);
            console.log(`     Score: ${mb.score}/${mb.max}`);
            console.log(`     Average: ${mb.data.avgMood.toFixed(1)}/10`);
            console.log(`     Entries: ${mb.data.entryCount}\n`);
        }

        if (wellnessScore.breakdown.sleep) {
            const sb = wellnessScore.breakdown.sleep;
            console.log(`  😴 Sleep:`);
            console.log(`     Score: ${sb.score}/${sb.max}`);
            console.log(`     Duration: ${sb.data.avgDuration.toFixed(1)}h/night`);
            console.log(`     Quality: ${sb.data.avgQuality.toFixed(1)}/10`);
            console.log(`     Entries: ${sb.data.entryCount}\n`);
        }

        if (wellnessScore.breakdown.exercise) {
            const eb = wellnessScore.breakdown.exercise;
            console.log(`  🏃 Exercise:`);
            console.log(`     Score: ${eb.score}/${eb.max}`);
            console.log(`     Avg: ${eb.data.avgMinutes.toFixed(0)} min/day`);
            console.log(`     Total: ${eb.data.totalMinutes} min`);
            console.log(`     Days Active: ${eb.data.daysActive}/7\n`);
        }

        if (wellnessScore.breakdown.medication) {
            const medb = wellnessScore.breakdown.medication;
            console.log(`  💊 Medication:`);
            console.log(`     Score: ${medb.score}/${medb.max}`);
            console.log(`     Adherence: ${medb.data.adherenceRate.toFixed(1)}%`);
            console.log(`     Active Meds: ${medb.data.activeMedications}\n`);
        }

        // Recommendations
        const recommendations = this.generateRecommendations(wellnessScore);
        if (recommendations.length > 0) {
            console.log('💡 Weekly Insights:\n');
            recommendations.forEach(rec => {
                const prioritySymbol = rec.priority === 'high' ? '🔴' :
                                      rec.priority === 'medium' ? '🟡' : '✅';
                console.log(`  ${prioritySymbol} ${rec.emoji} ${rec.message}`);
            });
            console.log('');
        }
    }

    // Correlation Analysis Methods
    calculateCorrelation(dataX, dataY) {
        // Pearson correlation coefficient
        if (dataX.length !== dataY.length || dataX.length < 3) {
            return null;
        }

        const n = dataX.length;
        const sumX = dataX.reduce((a, b) => a + b, 0);
        const sumY = dataY.reduce((a, b) => a + b, 0);
        const sumXY = dataX.reduce((sum, x, i) => sum + x * dataY[i], 0);
        const sumX2 = dataX.reduce((sum, x) => sum + x * x, 0);
        const sumY2 = dataY.reduce((sum, y) => sum + y * y, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        if (denominator === 0) return null;

        return numerator / denominator;
    }

    analyzeSleepMoodCorrelation(days = 30) {
        if (!this.mentalHealth || !this.sleep) {
            return null;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        // Get mood and sleep data
        const moodLogs = this.mentalHealth.data.moodLogs || [];
        const sleepEntries = this.sleep.data.sleepEntries || [];

        // Match sleep and mood by date
        const matchedData = [];
        sleepEntries.forEach(sleep => {
            const sleepDate = new Date(sleep.timestamp).toISOString().split('T')[0];

            // Find mood logs on the same day (after waking up)
            const dayMoods = moodLogs.filter(mood => {
                const moodDate = new Date(mood.timestamp).toISOString().split('T')[0];
                return moodDate === sleepDate && new Date(mood.timestamp) >= cutoffDate;
            });

            if (dayMoods.length > 0) {
                const avgMood = dayMoods.reduce((sum, m) => sum + m.rating, 0) / dayMoods.length;
                matchedData.push({
                    date: sleepDate,
                    sleepDuration: parseFloat(sleep.duration),
                    sleepQuality: sleep.quality,
                    mood: avgMood
                });
            }
        });

        if (matchedData.length < 3) {
            return { insufficient: true, count: matchedData.length };
        }

        const durationCorr = this.calculateCorrelation(
            matchedData.map(d => d.sleepDuration),
            matchedData.map(d => d.mood)
        );

        const qualityCorr = this.calculateCorrelation(
            matchedData.map(d => d.sleepQuality),
            matchedData.map(d => d.mood)
        );

        return {
            durationCorrelation: durationCorr,
            qualityCorrelation: qualityCorr,
            sampleSize: matchedData.length,
            avgSleepDuration: matchedData.reduce((sum, d) => sum + d.sleepDuration, 0) / matchedData.length,
            avgSleepQuality: matchedData.reduce((sum, d) => sum + d.sleepQuality, 0) / matchedData.length,
            avgMood: matchedData.reduce((sum, d) => sum + d.mood, 0) / matchedData.length
        };
    }

    analyzeExerciseMoodCorrelation(days = 30) {
        if (!this.mentalHealth || !this.exercise) {
            return null;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        const moodLogs = this.mentalHealth.data.moodLogs || [];
        const exercises = this.exercise.data.exercises || [];

        // Match exercise and mood by date
        const matchedData = [];

        // Get unique dates from mood logs
        const moodDates = new Set(moodLogs.map(m => new Date(m.timestamp).toISOString().split('T')[0]));

        moodDates.forEach(date => {
            if (new Date(date) < cutoffDate) return;

            const dayMoods = moodLogs.filter(m => {
                return new Date(m.timestamp).toISOString().split('T')[0] === date;
            });

            const dayExercises = exercises.filter(ex => ex.date === date);

            if (dayMoods.length > 0) {
                const avgMood = dayMoods.reduce((sum, m) => sum + m.rating, 0) / dayMoods.length;
                const totalMinutes = dayExercises.reduce((sum, ex) => sum + ex.duration, 0);

                matchedData.push({
                    date,
                    exerciseMinutes: totalMinutes,
                    mood: avgMood
                });
            }
        });

        if (matchedData.length < 3) {
            return { insufficient: true, count: matchedData.length };
        }

        const correlation = this.calculateCorrelation(
            matchedData.map(d => d.exerciseMinutes),
            matchedData.map(d => d.mood)
        );

        const daysWithExercise = matchedData.filter(d => d.exerciseMinutes > 0).length;
        const daysWithoutExercise = matchedData.filter(d => d.exerciseMinutes === 0).length;

        const avgMoodWithExercise = daysWithExercise > 0
            ? matchedData.filter(d => d.exerciseMinutes > 0)
                .reduce((sum, d) => sum + d.mood, 0) / daysWithExercise
            : null;

        const avgMoodWithoutExercise = daysWithoutExercise > 0
            ? matchedData.filter(d => d.exerciseMinutes === 0)
                .reduce((sum, d) => sum + d.mood, 0) / daysWithoutExercise
            : null;

        return {
            correlation,
            sampleSize: matchedData.length,
            daysWithExercise,
            daysWithoutExercise,
            avgMoodWithExercise,
            avgMoodWithoutExercise,
            moodDifference: avgMoodWithExercise && avgMoodWithoutExercise
                ? avgMoodWithExercise - avgMoodWithoutExercise
                : null
        };
    }

    analyzeMedicationMoodCorrelation(days = 30) {
        if (!this.mentalHealth || !this.medication) {
            return null;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        const moodLogs = this.mentalHealth.data.moodLogs || [];
        const medicationHistory = this.medication.data.history || [];
        const activeMeds = this.medication.data.medications?.filter(m => m.active) || [];

        if (activeMeds.length === 0) {
            return null;
        }

        // Match medication adherence and mood by date
        const matchedData = [];

        const moodDates = new Set(moodLogs.map(m => new Date(m.timestamp).toISOString().split('T')[0]));

        moodDates.forEach(date => {
            if (new Date(date) < cutoffDate) return;

            const dayMoods = moodLogs.filter(m => {
                return new Date(m.timestamp).toISOString().split('T')[0] === date;
            });

            const dayMedsTaken = medicationHistory.filter(h => {
                return new Date(h.timestamp).toISOString().split('T')[0] === date;
            }).length;

            if (dayMoods.length > 0) {
                const avgMood = dayMoods.reduce((sum, m) => sum + m.rating, 0) / dayMoods.length;
                const adherence = (dayMedsTaken / activeMeds.length) * 100;

                matchedData.push({
                    date,
                    adherence,
                    medsTaken: dayMedsTaken,
                    mood: avgMood
                });
            }
        });

        if (matchedData.length < 3) {
            return { insufficient: true, count: matchedData.length };
        }

        const correlation = this.calculateCorrelation(
            matchedData.map(d => d.adherence),
            matchedData.map(d => d.mood)
        );

        const daysFullAdherence = matchedData.filter(d => d.adherence >= 100).length;
        const daysPartialAdherence = matchedData.filter(d => d.adherence > 0 && d.adherence < 100).length;
        const daysNoAdherence = matchedData.filter(d => d.adherence === 0).length;

        const avgMoodFullAdherence = daysFullAdherence > 0
            ? matchedData.filter(d => d.adherence >= 100)
                .reduce((sum, d) => sum + d.mood, 0) / daysFullAdherence
            : null;

        const avgMoodNoAdherence = daysNoAdherence > 0
            ? matchedData.filter(d => d.adherence === 0)
                .reduce((sum, d) => sum + d.mood, 0) / daysNoAdherence
            : null;

        return {
            correlation,
            sampleSize: matchedData.length,
            daysFullAdherence,
            daysPartialAdherence,
            daysNoAdherence,
            avgMoodFullAdherence,
            avgMoodNoAdherence,
            moodDifference: avgMoodFullAdherence && avgMoodNoAdherence
                ? avgMoodFullAdherence - avgMoodNoAdherence
                : null
        };
    }

    showCorrelations(days = 30) {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║         🔗 WELLNESS CORRELATIONS ANALYSIS                  ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        console.log(`📊 Analyzing patterns over the last ${days} days...\n`);

        let hasAnyData = false;

        // Sleep-Mood Correlation
        const sleepMood = this.analyzeSleepMoodCorrelation(days);
        if (sleepMood && !sleepMood.insufficient) {
            hasAnyData = true;
            console.log('😴 Sleep → Mood Correlation\n');
            console.log(`   Sample Size: ${sleepMood.sampleSize} days with both sleep and mood data\n`);

            // Duration correlation
            if (sleepMood.durationCorrelation !== null) {
                const strength = this.getCorrelationStrength(sleepMood.durationCorrelation);
                const emoji = this.getCorrelationEmoji(sleepMood.durationCorrelation);
                console.log(`   ${emoji} Sleep Duration ↔ Mood: ${strength}`);
                console.log(`      Correlation: ${sleepMood.durationCorrelation.toFixed(3)}`);
                console.log(`      ${this.interpretSleepDurationCorrelation(sleepMood.durationCorrelation)}\n`);
            }

            // Quality correlation
            if (sleepMood.qualityCorrelation !== null) {
                const strength = this.getCorrelationStrength(sleepMood.qualityCorrelation);
                const emoji = this.getCorrelationEmoji(sleepMood.qualityCorrelation);
                console.log(`   ${emoji} Sleep Quality ↔ Mood: ${strength}`);
                console.log(`      Correlation: ${sleepMood.qualityCorrelation.toFixed(3)}`);
                console.log(`      ${this.interpretSleepQualityCorrelation(sleepMood.qualityCorrelation)}\n`);
            }
        } else if (sleepMood && sleepMood.insufficient) {
            console.log(`😴 Sleep → Mood: Insufficient data (${sleepMood.count} days, need 3+)\n`);
        }

        // Exercise-Mood Correlation
        const exerciseMood = this.analyzeExerciseMoodCorrelation(days);
        if (exerciseMood && !exerciseMood.insufficient) {
            hasAnyData = true;
            console.log('🏃 Exercise → Mood Correlation\n');
            console.log(`   Sample Size: ${exerciseMood.sampleSize} days with mood data\n`);

            if (exerciseMood.correlation !== null) {
                const strength = this.getCorrelationStrength(exerciseMood.correlation);
                const emoji = this.getCorrelationEmoji(exerciseMood.correlation);
                console.log(`   ${emoji} Exercise Minutes ↔ Mood: ${strength}`);
                console.log(`      Correlation: ${exerciseMood.correlation.toFixed(3)}\n`);
            }

            // Compare days with vs without exercise
            if (exerciseMood.avgMoodWithExercise !== null && exerciseMood.avgMoodWithoutExercise !== null) {
                console.log(`   📊 Mood Comparison:`);
                console.log(`      With Exercise (${exerciseMood.daysWithExercise} days): ${exerciseMood.avgMoodWithExercise.toFixed(1)}/10`);
                console.log(`      Without Exercise (${exerciseMood.daysWithoutExercise} days): ${exerciseMood.avgMoodWithoutExercise.toFixed(1)}/10`);

                if (exerciseMood.moodDifference > 0) {
                    console.log(`      💚 You feel ${exerciseMood.moodDifference.toFixed(1)} points better on days you exercise!\n`);
                } else if (exerciseMood.moodDifference < 0) {
                    console.log(`      ⚠️  Your mood is ${Math.abs(exerciseMood.moodDifference).toFixed(1)} points lower on exercise days.\n`);
                } else {
                    console.log(`      ➡️  Exercise doesn't show a clear mood impact yet.\n`);
                }
            }
        } else if (exerciseMood && exerciseMood.insufficient) {
            console.log(`🏃 Exercise → Mood: Insufficient data (${exerciseMood.count} days, need 3+)\n`);
        }

        // Medication-Mood Correlation
        const medicationMood = this.analyzeMedicationMoodCorrelation(days);
        if (medicationMood && !medicationMood.insufficient) {
            hasAnyData = true;
            console.log('💊 Medication Adherence → Mood Correlation\n');
            console.log(`   Sample Size: ${medicationMood.sampleSize} days with mood data\n`);

            if (medicationMood.correlation !== null) {
                const strength = this.getCorrelationStrength(medicationMood.correlation);
                const emoji = this.getCorrelationEmoji(medicationMood.correlation);
                console.log(`   ${emoji} Medication Adherence ↔ Mood: ${strength}`);
                console.log(`      Correlation: ${medicationMood.correlation.toFixed(3)}\n`);
            }

            // Compare full adherence vs no adherence
            if (medicationMood.avgMoodFullAdherence !== null && medicationMood.avgMoodNoAdherence !== null) {
                console.log(`   📊 Mood Comparison:`);
                console.log(`      Full Adherence (${medicationMood.daysFullAdherence} days): ${medicationMood.avgMoodFullAdherence.toFixed(1)}/10`);
                console.log(`      No Adherence (${medicationMood.daysNoAdherence} days): ${medicationMood.avgMoodNoAdherence.toFixed(1)}/10`);

                if (medicationMood.moodDifference > 0) {
                    console.log(`      💚 You feel ${medicationMood.moodDifference.toFixed(1)} points better with full medication adherence!\n`);
                } else if (medicationMood.moodDifference < 0) {
                    console.log(`      ⚠️  Your mood is ${Math.abs(medicationMood.moodDifference).toFixed(1)} points lower with full adherence.\n`);
                } else {
                    console.log(`      ➡️  Medication adherence doesn't show a clear mood impact yet.\n`);
                }
            }
        } else if (medicationMood && medicationMood.insufficient) {
            console.log(`💊 Medication → Mood: Insufficient data (${medicationMood.count} days, need 3+)\n`);
        }

        if (!hasAnyData) {
            console.log('📭 Not enough data yet for correlation analysis.\n');
            console.log('Keep tracking your wellness data to discover patterns!\n');
            console.log('Required: At least 3 days with matching data for each tracker.\n');
        } else {
            console.log('─'.repeat(60));
            console.log('\n💡 Understanding Correlations:\n');
            console.log('   • Strong positive (0.7+): These factors move together');
            console.log('   • Moderate positive (0.3-0.7): Some relationship exists');
            console.log('   • Weak (0-0.3): Little to no relationship');
            console.log('   • Negative: Inverse relationship\n');
            console.log('   Keep logging data to strengthen these insights!\n');
        }
    }

    getCorrelationStrength(correlation) {
        const abs = Math.abs(correlation);
        if (abs >= 0.7) return 'Strong';
        if (abs >= 0.5) return 'Moderate to Strong';
        if (abs >= 0.3) return 'Moderate';
        if (abs >= 0.1) return 'Weak';
        return 'Very Weak';
    }

    getCorrelationEmoji(correlation) {
        if (correlation >= 0.5) return '💚';
        if (correlation >= 0.3) return '🟢';
        if (correlation >= 0.1) return '🟡';
        if (correlation >= -0.1) return '⚪';
        if (correlation >= -0.3) return '🟠';
        return '🔴';
    }

    interpretSleepDurationCorrelation(correlation) {
        if (correlation >= 0.5) {
            return 'Getting more sleep strongly improves your mood! 🌟';
        } else if (correlation >= 0.3) {
            return 'More sleep tends to improve your mood.';
        } else if (correlation >= 0.1) {
            return 'Sleep duration shows slight mood improvement.';
        } else if (correlation >= -0.1) {
            return 'Sleep duration doesn\'t clearly affect your mood.';
        } else {
            return 'Interestingly, more sleep correlates with lower mood. Consider sleep quality.';
        }
    }

    interpretSleepQualityCorrelation(correlation) {
        if (correlation >= 0.5) {
            return 'Better sleep quality strongly boosts your mood! 🌟';
        } else if (correlation >= 0.3) {
            return 'Better sleep quality improves your mood.';
        } else if (correlation >= 0.1) {
            return 'Sleep quality shows slight mood improvement.';
        } else if (correlation >= -0.1) {
            return 'Sleep quality doesn\'t clearly affect your mood yet.';
        } else {
            return 'Better sleep quality correlates with lower mood. This is unusual - check your data.';
        }
    }

    // Trends & Progress Tracking Methods
    getTrendsData(weeks = 8) {
        const trendsData = [];
        const today = new Date();

        // Get weekly scores going back in time
        for (let i = 0; i < weeks; i++) {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() - (i * 7));

            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 6);

            // Calculate wellness score for this week
            const weekData = this.calculateWeeklyScore(weekStart, weekEnd);

            trendsData.unshift({
                weekNumber: i + 1,
                weekStart: weekStart.toISOString().split('T')[0],
                weekEnd: weekEnd.toISOString().split('T')[0],
                ...weekData
            });
        }

        return trendsData;
    }

    calculateWeeklyScore(startDate, endDate) {
        // Get all data within date range
        const scores = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];

            // Calculate score for this specific day
            const dayScore = this.calculateDayScore(dateStr);
            if (dayScore.maxScore > 0) {
                scores.push(dayScore);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (scores.length === 0) {
            return {
                score: 0,
                maxScore: 0,
                percentage: 0,
                daysWithData: 0,
                breakdown: {}
            };
        }

        // Average the scores
        const avgScore = scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length;
        const avgMaxScore = scores.reduce((sum, s) => sum + s.maxScore, 0) / scores.length;
        const percentage = avgMaxScore > 0 ? (avgScore / avgMaxScore) * 100 : 0;

        // Aggregate breakdown
        const breakdown = {};
        const categories = ['mood', 'sleep', 'exercise', 'medication'];

        categories.forEach(cat => {
            const catScores = scores
                .filter(s => s.breakdown[cat])
                .map(s => s.breakdown[cat]);

            if (catScores.length > 0) {
                const avgCatScore = catScores.reduce((sum, c) => sum + c.score, 0) / catScores.length;
                breakdown[cat] = {
                    score: parseFloat(avgCatScore.toFixed(1)),
                    max: 25
                };
            }
        });

        return {
            score: parseFloat(avgScore.toFixed(1)),
            maxScore: parseFloat(avgMaxScore.toFixed(1)),
            percentage: parseFloat(percentage.toFixed(1)),
            daysWithData: scores.length,
            breakdown
        };
    }

    calculateDayScore(dateStr) {
        // Similar to calculateWellnessScore but for a specific date
        let totalScore = 0;
        let maxScore = 0;
        const breakdown = {};

        // Mood Score for specific date
        const moodData = this.getMoodDataForDate(dateStr);
        if (moodData) {
            const moodScore = (moodData.avgMood / 10) * 25;
            breakdown.mood = {
                score: parseFloat(moodScore.toFixed(1)),
                max: 25
            };
            totalScore += moodScore;
            maxScore += 25;
        }

        // Sleep Score for specific date
        const sleepData = this.getSleepDataForDate(dateStr);
        if (sleepData) {
            const qualityScore = (sleepData.quality / 10) * 15;
            let durationScore = 0;
            if (sleepData.duration >= 7 && sleepData.duration <= 9) {
                durationScore = 10;
            } else if (sleepData.duration >= 6 && sleepData.duration <= 10) {
                durationScore = 7;
            } else if (sleepData.duration >= 5 && sleepData.duration <= 11) {
                durationScore = 4;
            }

            const sleepScore = qualityScore + durationScore;
            breakdown.sleep = {
                score: parseFloat(sleepScore.toFixed(1)),
                max: 25
            };
            totalScore += sleepScore;
            maxScore += 25;
        }

        // Exercise Score for specific date
        const exerciseData = this.getExerciseDataForDate(dateStr);
        if (exerciseData !== null) {
            let exerciseScore = 0;
            if (exerciseData >= 30) {
                exerciseScore = 25;
            } else {
                exerciseScore = (exerciseData / 30) * 25;
            }

            breakdown.exercise = {
                score: parseFloat(exerciseScore.toFixed(1)),
                max: 25
            };
            totalScore += exerciseScore;
            maxScore += 25;
        }

        // Medication Score for specific date
        const medData = this.getMedicationDataForDate(dateStr);
        if (medData !== null) {
            const medScore = (medData / 100) * 25;
            breakdown.medication = {
                score: parseFloat(medScore.toFixed(1)),
                max: 25
            };
            totalScore += medScore;
            maxScore += 25;
        }

        return {
            totalScore: parseFloat(totalScore.toFixed(1)),
            maxScore,
            percentage: maxScore > 0 ? parseFloat(((totalScore / maxScore) * 100).toFixed(1)) : 0,
            breakdown
        };
    }

    getMoodDataForDate(dateStr) {
        if (!this.mentalHealth || !this.mentalHealth.data.moodLogs) {
            return null;
        }

        const dayMoods = this.mentalHealth.data.moodLogs.filter(log => {
            return new Date(log.timestamp).toISOString().split('T')[0] === dateStr;
        });

        if (dayMoods.length === 0) return null;

        const avgMood = dayMoods.reduce((sum, log) => sum + log.rating, 0) / dayMoods.length;
        return { avgMood };
    }

    getSleepDataForDate(dateStr) {
        if (!this.sleep || !this.sleep.data.sleepEntries) {
            return null;
        }

        const daySleep = this.sleep.data.sleepEntries.find(entry => {
            return new Date(entry.timestamp).toISOString().split('T')[0] === dateStr;
        });

        if (!daySleep) return null;

        return {
            duration: parseFloat(daySleep.duration),
            quality: daySleep.quality
        };
    }

    getExerciseDataForDate(dateStr) {
        if (!this.exercise || !this.exercise.data.exercises) {
            return null;
        }

        const dayExercises = this.exercise.data.exercises.filter(ex => ex.date === dateStr);
        const totalMinutes = dayExercises.reduce((sum, ex) => sum + ex.duration, 0);

        return totalMinutes;
    }

    getMedicationDataForDate(dateStr) {
        if (!this.medication || !this.medication.data.medications) {
            return null;
        }

        const activeMeds = this.medication.data.medications.filter(med => med.active);
        if (activeMeds.length === 0) return null;

        const dayMedsTaken = this.medication.data.history.filter(h => {
            return new Date(h.timestamp).toISOString().split('T')[0] === dateStr;
        }).length;

        const adherence = (dayMedsTaken / activeMeds.length) * 100;
        return adherence;
    }

    analyzeWellnessTrend(trendsData) {
        if (trendsData.length < 2) {
            return { trend: 'insufficient', message: 'Need at least 2 weeks of data' };
        }

        // Get scores that have data
        const validScores = trendsData.filter(w => w.daysWithData > 0);
        if (validScores.length < 2) {
            return { trend: 'insufficient', message: 'Need at least 2 weeks with data' };
        }

        // Calculate trend using linear regression
        const recentWeeks = validScores.slice(-4); // Last 4 weeks
        const scores = recentWeeks.map(w => w.percentage);

        // Simple moving average comparison
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        const change = secondAvg - firstAvg;
        const changePercent = ((change / firstAvg) * 100).toFixed(1);

        let trend, emoji, message;

        if (change > 5) {
            trend = 'improving';
            emoji = '⬆️';
            message = `Your wellness is improving! Up ${changePercent}% recently.`;
        } else if (change < -5) {
            trend = 'declining';
            emoji = '⬇️';
            message = `Your wellness has declined ${Math.abs(changePercent)}% recently.`;
        } else {
            trend = 'stable';
            emoji = '➡️';
            message = 'Your wellness is stable.';
        }

        return {
            trend,
            emoji,
            message,
            change: parseFloat(change.toFixed(1)),
            changePercent: parseFloat(changePercent)
        };
    }

    generateTrendChart(trendsData, height = 10, width = 60) {
        const validWeeks = trendsData.filter(w => w.daysWithData > 0);
        if (validWeeks.length === 0) {
            return ['No data available for chart'];
        }

        const scores = validWeeks.map(w => w.percentage);
        const maxScore = Math.max(...scores, 100);
        const minScore = Math.min(...scores, 0);
        const range = maxScore - minScore || 1;

        const lines = [];

        // Y-axis and chart
        for (let y = height; y >= 0; y--) {
            const value = minScore + (range * y / height);
            let line = `${value.toFixed(0).padStart(3)} │ `;

            for (let x = 0; x < validWeeks.length; x++) {
                const score = scores[x];
                const normalizedScore = ((score - minScore) / range) * height;

                if (Math.abs(normalizedScore - y) < 0.5) {
                    line += '●';
                } else if (y === 0) {
                    line += '─';
                } else {
                    line += ' ';
                }

                // Add spacing between points
                if (x < validWeeks.length - 1) {
                    // Draw line to next point
                    const nextScore = scores[x + 1];
                    const nextNormalized = ((nextScore - minScore) / range) * height;

                    if (Math.abs((normalizedScore + nextNormalized) / 2 - y) < 0.5) {
                        line += '─';
                    } else {
                        line += ' ';
                    }
                }
            }

            lines.push(line);
        }

        // X-axis
        const xAxis = '    └' + '─'.repeat(validWeeks.length * 2);
        lines.push(xAxis);

        // Week labels
        let labels = '     ';
        validWeeks.forEach((week, i) => {
            labels += `W${week.weekNumber} `;
        });
        lines.push(labels);

        return lines;
    }

    showTrends(weeks = 8) {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║         📈 WELLNESS TRENDS & PROGRESS                      ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        const trendsData = this.getTrendsData(weeks);
        const validWeeks = trendsData.filter(w => w.daysWithData > 0);

        if (validWeeks.length === 0) {
            console.log('📭 No wellness data available yet.\n');
            console.log('Start tracking your wellness to see trends over time!\n');
            return;
        }

        // Overall Trend Analysis
        const trendAnalysis = this.analyzeWellnessTrend(trendsData);
        console.log('📊 Overall Trend:\n');
        console.log(`   ${trendAnalysis.emoji} ${trendAnalysis.message}\n`);

        if (trendAnalysis.trend !== 'insufficient') {
            // Current vs Previous comparison
            const currentWeek = validWeeks[validWeeks.length - 1];
            const previousWeek = validWeeks.length > 1 ? validWeeks[validWeeks.length - 2] : null;

            console.log('📅 Current Status:\n');
            console.log(`   This Week: ${currentWeek.percentage}% (${currentWeek.score}/${currentWeek.maxScore})`);

            if (previousWeek) {
                const weekChange = currentWeek.percentage - previousWeek.percentage;
                const changeEmoji = weekChange > 0 ? '⬆️' : weekChange < 0 ? '⬇️' : '➡️';
                console.log(`   Last Week: ${previousWeek.percentage}% (${changeEmoji} ${Math.abs(weekChange).toFixed(1)}%)\n`);
            } else {
                console.log('');
            }

            // Trend Chart
            console.log('📈 Wellness Score Over Time:\n');
            const chart = this.generateTrendChart(trendsData, 8, 60);
            chart.forEach(line => console.log(line));
            console.log('');

            // Component Trends
            console.log('📊 Component Trends:\n');
            const components = [
                { key: 'mood', name: '🧠 Mood', emoji: '🧠' },
                { key: 'sleep', name: '😴 Sleep', emoji: '😴' },
                { key: 'exercise', name: '🏃 Exercise', emoji: '🏃' },
                { key: 'medication', name: '💊 Medication', emoji: '💊' }
            ];

            components.forEach(comp => {
                const compScores = validWeeks
                    .filter(w => w.breakdown[comp.key])
                    .map(w => w.breakdown[comp.key].score);

                if (compScores.length >= 2) {
                    const firstScore = compScores[0];
                    const lastScore = compScores[compScores.length - 1];
                    const change = lastScore - firstScore;
                    const changePercent = ((change / firstScore) * 100).toFixed(1);
                    const trendEmoji = change > 1 ? '⬆️' : change < -1 ? '⬇️' : '➡️';

                    console.log(`   ${comp.emoji} ${comp.key.charAt(0).toUpperCase() + comp.key.slice(1)}: ${lastScore.toFixed(1)}/25 ${trendEmoji} (${changePercent > 0 ? '+' : ''}${changePercent}%)`);
                }
            });

            console.log('');

            // Best & Worst Weeks
            const sortedByScore = [...validWeeks].sort((a, b) => b.percentage - a.percentage);
            const bestWeek = sortedByScore[0];
            const worstWeek = sortedByScore[sortedByScore.length - 1];

            console.log('🏆 Performance Highlights:\n');
            console.log(`   Best Week: Week ending ${bestWeek.weekEnd} (${bestWeek.percentage}%)`);
            console.log(`   Needs Focus: Week ending ${worstWeek.weekEnd} (${worstWeek.percentage}%)\n`);

            // Recommendations based on trend
            console.log('💡 Recommendations:\n');
            if (trendAnalysis.trend === 'improving') {
                console.log('   ✅ Keep up the great work! Your wellness is on an upward trend.');
                console.log('   ✅ Identify what\'s working and maintain those habits.');
            } else if (trendAnalysis.trend === 'declining') {
                console.log('   🔴 Your wellness has declined recently. Time to refocus.');
                console.log('   🔴 Review your correlations to see what might help.');
                console.log(`   🔴 Consider: ${this.generateDeclineSuggestions(trendsData)}`);
            } else {
                console.log('   ➡️  Consistency is good, but there\'s room for growth.');
                console.log('   💡 Try setting small goals to push your score higher.');
            }
            console.log('');
        }
    }

    generateDeclineSuggestions(trendsData) {
        const validWeeks = trendsData.filter(w => w.daysWithData > 0);
        if (validWeeks.length < 2) return 'Focus on consistent tracking';

        const recent = validWeeks.slice(-2);
        const suggestions = [];

        // Check which components declined most
        const components = ['mood', 'sleep', 'exercise', 'medication'];
        let maxDecline = 0;
        let weakestComponent = null;

        components.forEach(comp => {
            if (recent[0].breakdown[comp] && recent[1].breakdown[comp]) {
                const decline = recent[1].breakdown[comp].score - recent[0].breakdown[comp].score;
                if (decline < maxDecline) {
                    maxDecline = decline;
                    weakestComponent = comp;
                }
            }
        });

        if (weakestComponent) {
            const tips = {
                mood: 'Log your mood daily and use coping strategies',
                sleep: 'Prioritize 7-9 hours of quality sleep',
                exercise: 'Aim for 30 minutes of activity daily',
                medication: 'Stay consistent with your medication schedule'
            };
            return tips[weakestComponent];
        }

        return 'Focus on tracking all wellness areas consistently';
    }

    createProgressBar(score, max, width = 20) {
        const percentage = (score / max);
        const filled = Math.round(percentage * width);
        const empty = width - filled;

        let color = '';
        if (percentage >= 0.8) color = '█'; // Green
        else if (percentage >= 0.6) color = '▓'; // Yellow
        else color = '░'; // Red

        return `[${color.repeat(filled)}${'░'.repeat(empty)}]`;
    }
}

// CLI Interface
if (require.main === module) {
    const dashboard = new DailyDashboard();
    const args = process.argv.slice(2);
    const command = args[0];

    switch(command) {
        case 'daily':
        case 'today':
            dashboard.showDailyDashboard();
            break;

        case 'weekly':
        case 'week':
            dashboard.showWeeklySummary();
            break;

        case 'correlations':
        case 'corr':
        case 'patterns':
            const days = args[1] ? parseInt(args[1]) : 30;
            dashboard.showCorrelations(days);
            break;

        case 'trends':
        case 'trend':
        case 'progress':
            const weeks = args[1] ? parseInt(args[1]) : 8;
            dashboard.showTrends(weeks);
            break;

        case 'help':
        default:
            console.log(`
📊 Daily Dashboard - Unified Wellness Overview

USAGE:
  node daily-dashboard.js <command> [options]

COMMANDS:
  daily, today
      Show today's wellness dashboard with current scores

  weekly, week
      Show 7-day wellness summary with averages

  correlations, corr, patterns [days]
      Analyze correlations between wellness factors (default: 30 days)
      Shows how sleep, exercise, and medication affect your mood

  trends, trend, progress [weeks]
      Show wellness trends and progress over time (default: 8 weeks)
      Displays ASCII chart, component trends, and recommendations

  help
      Show this help message

ABOUT:
  The Daily Dashboard aggregates data from all your health trackers:
  • Mental Health (Mood tracking)
  • Sleep Quality & Duration
  • Exercise & Physical Activity
  • Medication Adherence

  WELLNESS SCORE (0-100):
  • Mood: 0-25 points (based on mood rating)
  • Sleep: 0-25 points (quality + optimal duration)
  • Exercise: 0-25 points (toward 30 min/day goal)
  • Medication: 0-25 points (adherence rate)

EXAMPLES:
  node daily-dashboard.js daily
  node daily-dashboard.js weekly
  node daily-dashboard.js correlations
  node daily-dashboard.js correlations 60  # Analyze last 60 days
  node daily-dashboard.js trends
  node daily-dashboard.js trends 12        # Show 12 weeks of trends
            `);
            break;
    }
}

module.exports = DailyDashboard;
