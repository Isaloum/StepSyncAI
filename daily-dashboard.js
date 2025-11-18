const fs = require('fs');
const MentalHealthTracker = require('./mental-health-tracker');
const MedicationTracker = require('./medication-tracker');
const SleepTracker = require('./sleep-tracker');
const ExerciseTracker = require('./exercise-tracker');
const asciichart = require('asciichart');
const chalk = require('chalk');
const Table = require('cli-table3');

class DailyDashboard {
    constructor(dataFile = 'dashboard-goals.json') {
        this.dataFile = dataFile;
        this.data = this.loadData();
        this.mentalHealth = null;
        this.medication = null;
        this.sleep = null;
        this.exercise = null;
        this.loadTrackers();
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const rawData = fs.readFileSync(this.dataFile, 'utf8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error.message);
        }
        return {
            goals: [],
            achievedGoals: [],
            nextGoalId: 1
        };
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving dashboard data:', error.message);
            return false;
        }
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
        console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║         🔗 WELLNESS CORRELATIONS ANALYSIS                  ║'));
        console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝\n'));

        console.log(chalk.bold(`📊 Analyzing patterns over the last ${days} days...\n`));

        let hasAnyData = false;

        // Sleep-Mood Correlation
        const sleepMood = this.analyzeSleepMoodCorrelation(days);
        if (sleepMood && !sleepMood.insufficient) {
            hasAnyData = true;
            console.log('😴 Sleep → Mood Correlation\n');
            console.log(`   Sample Size: ${sleepMood.sampleSize} days with both sleep and mood data\n`);

            // Duration correlation
            if (sleepMood.durationCorrelation !== null) {
                console.log(chalk.bold('\n   Sleep Duration ↔ Mood:'));
                this.visualizeCorrelationStrength(sleepMood.durationCorrelation, 'Duration vs Mood');
                console.log(chalk.gray(`      ${this.interpretSleepDurationCorrelation(sleepMood.durationCorrelation)}\n`));
            }

            // Quality correlation
            if (sleepMood.qualityCorrelation !== null) {
                console.log(chalk.bold('   Sleep Quality ↔ Mood:'));
                this.visualizeCorrelationStrength(sleepMood.qualityCorrelation, 'Quality vs Mood');
                console.log(chalk.gray(`      ${this.interpretSleepQualityCorrelation(sleepMood.qualityCorrelation)}\n`));
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
                console.log(chalk.bold('\n   Exercise Minutes ↔ Mood:'));
                this.visualizeCorrelationStrength(exerciseMood.correlation, 'Exercise vs Mood');
                console.log('');
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
                console.log(chalk.bold('\n   Medication Adherence ↔ Mood:'));
                this.visualizeCorrelationStrength(medicationMood.correlation, 'Medication vs Mood');
                console.log('');
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

        // Use asciichart for better visualization
        const config = {
            height: height,
            colors: [
                asciichart.green
            ],
            format: (x) => `${x.toFixed(1)}%`.padStart(7)
        };

        const chart = asciichart.plot(scores, config);
        const lines = chart.split('\n');

        // Add week labels
        let labels = '        ';
        validWeeks.forEach((week, i) => {
            if (i % 2 === 0 || validWeeks.length < 10) {
                labels += `W${week.weekNumber}`.padEnd(scores.length > 10 ? 3 : 4);
            }
        });
        lines.push(labels);

        return lines;
    }

    /**
     * Visualize correlation strength with a colored bar
     */
    visualizeCorrelationStrength(correlation, label, width = 40) {
        const absCorr = Math.abs(correlation);
        const filled = Math.round(absCorr * width);
        const empty = width - filled;

        let color = chalk.gray;
        let arrow = '➡️';

        if (absCorr >= 0.7) {
            color = chalk.green;
            arrow = correlation > 0 ? '⬆️' : '⬇️';
        } else if (absCorr >= 0.4) {
            color = chalk.yellow;
            arrow = correlation > 0 ? '↗️' : '↘️';
        } else if (absCorr >= 0.2) {
            color = chalk.blue;
        }

        const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
        const sign = correlation >= 0 ? '+' : '';
        const corrText = `${sign}${correlation.toFixed(3)}`;

        console.log(`   ${arrow} ${label.padEnd(30)} ${bar} ${color(corrText)}`);
    }

    /**
     * Create a mini heatmap for day-of-week patterns
     */
    generateDayOfWeekHeatmap(weekdayData) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const table = new Table({
            head: days.map(d => chalk.cyan(d)),
            chars: {
                'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
                'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
                'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
                'right': '║', 'right-mid': '╢', 'middle': '│'
            }
        });

        // Create score row
        const scoreRow = days.map(day => {
            const data = weekdayData.find(d => d.dayOfWeek === day);
            if (!data || data.count === 0) return chalk.gray('--');

            const score = data.avgScore;
            let color = chalk.gray;
            let block = '░';

            if (score >= 75) {
                color = chalk.green;
                block = '█';
            } else if (score >= 60) {
                color = chalk.yellow;
                block = '▓';
            } else if (score >= 40) {
                color = chalk.blue;
                block = '▒';
            }

            return color(`${block} ${score.toFixed(0)}`);
        });

        table.push(scoreRow);

        // Create count row
        const countRow = days.map(day => {
            const data = weekdayData.find(d => d.dayOfWeek === day);
            if (!data || data.count === 0) return chalk.gray('(0)');
            return chalk.gray(`(${data.count})`);
        });

        table.push(countRow);

        return table.toString();
    }

    /**
     * Create a visual progress bar for goals
     */
    visualizeGoalProgress(current, target, width = 40) {
        const percentage = Math.min((current / target) * 100, 100);
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;

        let color = chalk.gray;
        let emoji = '🎯';

        if (percentage >= 100) {
            color = chalk.green;
            emoji = '🎉';
        } else if (percentage >= 75) {
            color = chalk.green;
            emoji = '🌟';
        } else if (percentage >= 50) {
            color = chalk.yellow;
            emoji = '💪';
        } else if (percentage >= 25) {
            color = chalk.blue;
            emoji = '🎯';
        }

        const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
        const percText = `${percentage.toFixed(1)}%`;

        console.log(`   ${emoji} [${bar}] ${color(percText)}`);
    }

    showTrends(weeks = 8) {
        console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║         📈 WELLNESS TRENDS & PROGRESS                      ║'));
        console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝\n'));

        const trendsData = this.getTrendsData(weeks);
        const validWeeks = trendsData.filter(w => w.daysWithData > 0);

        if (validWeeks.length === 0) {
            console.log(chalk.yellow('📭 No wellness data available yet.\n'));
            console.log('Start tracking your wellness to see trends over time!\n');
            return;
        }

        // Overall Trend Analysis
        const trendAnalysis = this.analyzeWellnessTrend(trendsData);
        console.log(chalk.bold('📊 Overall Trend:\n'));

        const trendColor = trendAnalysis.trend === 'improving' ? chalk.green :
                           trendAnalysis.trend === 'declining' ? chalk.red : chalk.yellow;
        console.log(`   ${trendColor(trendAnalysis.emoji + ' ' + trendAnalysis.message)}\n`);

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

    // ==================== GOAL SETTING & MILESTONES ====================

    setGoal(type, target, targetDate, description = '') {
        // Validate goal type
        const validTypes = ['wellness', 'mood', 'sleep-duration', 'sleep-quality', 'exercise', 'medication'];
        if (!validTypes.includes(type)) {
            console.error('❌ Invalid goal type. Must be one of: wellness, mood, sleep-duration, sleep-quality, exercise, medication');
            return null;
        }

        // Validate target
        const targetNum = parseFloat(target);
        if (isNaN(targetNum) || targetNum <= 0) {
            console.error('❌ Target must be a positive number');
            return null;
        }

        // Validate target ranges
        if (type === 'wellness' && (targetNum < 0 || targetNum > 100)) {
            console.error('❌ Wellness target must be between 0-100');
            return null;
        }
        if (type === 'mood' && (targetNum < 1 || targetNum > 10)) {
            console.error('❌ Mood target must be between 1-10');
            return null;
        }
        if ((type === 'sleep-quality') && (targetNum < 1 || targetNum > 10)) {
            console.error('❌ Sleep quality target must be between 1-10');
            return null;
        }
        if (type === 'medication' && (targetNum < 0 || targetNum > 100)) {
            console.error('❌ Medication adherence target must be between 0-100%');
            return null;
        }

        // Validate target date
        const targetDateObj = new Date(targetDate);
        if (isNaN(targetDateObj.getTime())) {
            console.error('❌ Invalid target date format. Use YYYY-MM-DD');
            return null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (targetDateObj <= today) {
            console.error('❌ Target date must be in the future');
            return null;
        }

        const goal = {
            id: this.data.nextGoalId++,
            type,
            target: targetNum,
            targetDate: targetDateObj.toISOString().split('T')[0],
            description: description || this.getDefaultGoalDescription(type, targetNum),
            createdDate: new Date().toISOString().split('T')[0],
            status: 'active',
            milestones: {
                '25': false,
                '50': false,
                '75': false,
                '100': false
            }
        };

        this.data.goals.push(goal);
        this.saveData();

        console.log(`✅ Goal created successfully! (ID: ${goal.id})`);
        console.log(`   ${goal.description}`);
        console.log(`   Target: ${this.formatGoalTarget(type, targetNum)} by ${goal.targetDate}`);

        return goal;
    }

    getDefaultGoalDescription(type, target) {
        const descriptions = {
            'wellness': `Reach ${target}% overall wellness score`,
            'mood': `Maintain average mood of ${target}/10`,
            'sleep-duration': `Average ${target} hours of sleep per night`,
            'sleep-quality': `Achieve ${target}/10 sleep quality`,
            'exercise': `Exercise ${target} minutes per day`,
            'medication': `Maintain ${target}% medication adherence`
        };
        return descriptions[type] || 'Custom wellness goal';
    }

    formatGoalTarget(type, target) {
        const formats = {
            'wellness': `${target}%`,
            'mood': `${target}/10`,
            'sleep-duration': `${target}h`,
            'sleep-quality': `${target}/10`,
            'exercise': `${target} min/day`,
            'medication': `${target}%`
        };
        return formats[type] || target.toString();
    }

    getActiveGoals() {
        return this.data.goals.filter(goal => goal.status === 'active');
    }

    getAllGoals() {
        return this.data.goals;
    }

    getGoalById(id) {
        return this.data.goals.find(goal => goal.id === id);
    }

    checkGoalProgress(goalId) {
        const goal = this.getGoalById(goalId);
        if (!goal) {
            console.error(`❌ Goal with ID ${goalId} not found`);
            return null;
        }

        // Calculate current value based on goal type
        let current = 0;
        let max = goal.target;

        switch (goal.type) {
            case 'wellness':
                const wellnessScore = this.calculateWellnessScore(7);
                current = wellnessScore.percentage;
                break;
            case 'mood':
                const moodData = this.getMoodData(7);
                current = moodData ? moodData.avgMood : 0;
                max = 10;
                break;
            case 'sleep-duration':
                const sleepData = this.getSleepData(7);
                current = sleepData ? sleepData.avgDuration : 0;
                break;
            case 'sleep-quality':
                const sleepQData = this.getSleepData(7);
                current = sleepQData ? sleepQData.avgQuality : 0;
                max = 10;
                break;
            case 'exercise':
                const exerciseData = this.getExerciseData(7);
                current = exerciseData ? exerciseData.avgMinutes : 0;
                break;
            case 'medication':
                const medData = this.getMedicationData(7);
                current = medData ? medData.adherenceRate : 0;
                break;
        }

        // Calculate progress percentage
        const progressPercentage = Math.min((current / goal.target) * 100, 100);

        // Calculate days remaining
        const today = new Date();
        const targetDate = new Date(goal.targetDate);
        const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

        // Estimate completion based on trends
        const onTrack = this.isGoalOnTrack(goal, current, daysRemaining);

        return {
            goal,
            current,
            target: goal.target,
            progressPercentage,
            daysRemaining,
            onTrack,
            achieved: progressPercentage >= 100,
            daysElapsed: this.getDaysElapsed(goal.createdDate)
        };
    }

    isGoalOnTrack(goal, current, daysRemaining) {
        if (daysRemaining <= 0) return false;

        // If already achieved, definitely on track
        if (current >= goal.target) return true;

        // Get trend data to see if we're improving
        const trendsData = this.getTrendsData(4); // Last 4 weeks
        if (trendsData.length < 2) return null; // Not enough data

        const trendAnalysis = this.analyzeWellnessTrend(trendsData);

        // If improving, likely on track
        if (trendAnalysis.trend === 'improving') return true;

        // If declining, not on track
        if (trendAnalysis.trend === 'declining') return false;

        // For stable trend, check if current value is close enough to target
        const progressNeeded = goal.target - current;
        const progressRate = progressNeeded / daysRemaining;

        // Simple heuristic: if we need less than 2% improvement per day, we're on track
        return progressRate < 2;
    }

    getDaysElapsed(startDate) {
        const start = new Date(startDate);
        const today = new Date();
        return Math.floor((today - start) / (1000 * 60 * 60 * 24));
    }

    updateGoalStatus() {
        let updated = false;

        this.data.goals.forEach(goal => {
            if (goal.status !== 'active') return;

            const progress = this.checkGoalProgress(goal.id);
            if (!progress) return;

            // Check if goal achieved
            if (progress.achieved && goal.status === 'active') {
                goal.status = 'achieved';
                goal.achievedDate = new Date().toISOString().split('T')[0];
                this.data.achievedGoals.push(goal);
                console.log(`🎉 Goal achieved! ${goal.description}`);
                updated = true;
            }

            // Check if goal expired
            if (progress.daysRemaining < 0 && goal.status === 'active' && !progress.achieved) {
                goal.status = 'expired';
                goal.expiredDate = new Date().toISOString().split('T')[0];
                console.log(`⏰ Goal expired: ${goal.description}`);
                updated = true;
            }

            // Check milestones
            ['25', '50', '75', '100'].forEach(milestone => {
                if (progress.progressPercentage >= parseInt(milestone) && !goal.milestones[milestone]) {
                    goal.milestones[milestone] = true;
                    if (milestone !== '100') {
                        console.log(`🎯 Milestone ${milestone}% reached for: ${goal.description}`);
                        updated = true;
                    }
                }
            });
        });

        if (updated) {
            this.saveData();
        }

        return updated;
    }

    deleteGoal(goalId) {
        const goalIndex = this.data.goals.findIndex(goal => goal.id === goalId);
        if (goalIndex === -1) {
            console.error(`❌ Goal with ID ${goalId} not found`);
            return false;
        }

        const goal = this.data.goals[goalIndex];
        this.data.goals.splice(goalIndex, 1);
        this.saveData();

        console.log(`✅ Goal deleted: ${goal.description}`);
        return true;
    }

    showGoals() {
        // Update goal statuses first
        this.updateGoalStatus();

        const activeGoals = this.getActiveGoals();
        const achievedGoals = this.data.achievedGoals || [];

        console.log(`
╔════════════════════════════════════════════════════════════╗
║              🏆 WELLNESS GOALS & MILESTONES                ║
╚════════════════════════════════════════════════════════════╝
`);

        if (activeGoals.length === 0 && achievedGoals.length === 0) {
            console.log(`
📋 No goals set yet!

Get started by setting a wellness goal:
  node daily-dashboard.js set-goal wellness 80 2025-12-31
  node daily-dashboard.js set-goal exercise 30 2025-06-30

Goal types: wellness, mood, sleep-duration, sleep-quality, exercise, medication
`);
            return;
        }

        // Display active goals
        if (activeGoals.length > 0) {
            console.log(chalk.bold('🎯 Active Goals:\n'));

            activeGoals.forEach((goal, index) => {
                const progress = this.checkGoalProgress(goal.id);
                if (!progress) return;

                const daysText = progress.daysRemaining === 1 ? 'day' : 'days';
                const statusEmoji = progress.achieved ? '✅' :
                                   progress.onTrack === true ? '🟢' :
                                   progress.onTrack === false ? '🔴' : '🟡';

                console.log(chalk.bold(`${index + 1}. ${statusEmoji} ${goal.description}`) + chalk.gray(` (ID: ${goal.id})`));
                this.visualizeGoalProgress(progress.current, progress.target);
                console.log(`   ${chalk.cyan('Current:')} ${this.formatGoalTarget(goal.type, progress.current.toFixed(1))} ${chalk.gray('/')} ${chalk.green('Target:')} ${this.formatGoalTarget(goal.type, progress.target)}`);
                console.log(`   ${chalk.gray(`${progress.daysRemaining} ${daysText} remaining (${progress.daysElapsed} days elapsed)`)}`);

                // Show milestone progress
                const milestones = Object.entries(goal.milestones)
                    .filter(([_, achieved]) => achieved)
                    .map(([pct]) => `${pct}%`)
                    .join(', ');
                if (milestones) {
                    console.log(`   🎯 Milestones reached: ${milestones}`);
                }

                // Show on-track status
                if (progress.onTrack === true) {
                    console.log(`   ✅ On track to achieve!`);
                } else if (progress.onTrack === false) {
                    console.log(`   ⚠️  Behind schedule - increase effort!`);
                }

                console.log('');
            });
        }

        // Display recently achieved goals
        if (achievedGoals.length > 0) {
            console.log('\n🏆 Recently Achieved Goals:\n');

            const recentAchievements = achievedGoals.slice(-5).reverse();
            recentAchievements.forEach((goal, index) => {
                console.log(`${index + 1}. ✅ ${goal.description}`);
                console.log(`   Achieved: ${goal.achievedDate}`);
                console.log('');
            });
        }

        console.log('────────────────────────────────────────────────────────────');
        console.log(`\n📊 Summary: ${activeGoals.length} active, ${achievedGoals.length} achieved\n`);
    }

    // ==================== WELLNESS INSIGHTS ====================

    detectWeeklyPatterns(days = 30) {
        // Analyze patterns by day of week
        const dayStats = {
            0: { name: 'Sunday', moods: [], scores: [], exercises: [] },
            1: { name: 'Monday', moods: [], scores: [], exercises: [] },
            2: { name: 'Tuesday', moods: [], scores: [], exercises: [] },
            3: { name: 'Wednesday', moods: [], scores: [], exercises: [] },
            4: { name: 'Thursday', moods: [], scores: [], exercises: [] },
            5: { name: 'Friday', moods: [], scores: [], exercises: [] },
            6: { name: 'Saturday', moods: [], scores: [], exercises: [] }
        };

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Collect mood data by day of week
        if (this.mentalHealth && this.mentalHealth.data.moodLogs) {
            this.mentalHealth.data.moodLogs
                .filter(log => new Date(log.timestamp) >= cutoffDate)
                .forEach(log => {
                    const dayOfWeek = new Date(log.timestamp).getDay();
                    dayStats[dayOfWeek].moods.push(log.rating);
                });
        }

        // Collect wellness scores by day of week
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();

            const dayScore = this.calculateDayScore(dateStr);
            if (dayScore.totalScore > 0 || dayScore.maxScore > 0) {
                dayStats[dayOfWeek].scores.push(dayScore.percentage);
            }
        }

        // Collect exercise data by day of week
        if (this.exercise && this.exercise.data.exercises) {
            this.exercise.data.exercises
                .filter(ex => new Date(ex.timestamp) >= cutoffDate)
                .forEach(ex => {
                    const dayOfWeek = new Date(ex.timestamp).getDay();
                    dayStats[dayOfWeek].exercises.push(ex.duration);
                });
        }

        // Calculate averages
        const patterns = {};
        Object.keys(dayStats).forEach(day => {
            const stats = dayStats[day];
            patterns[day] = {
                name: stats.name,
                avgMood: stats.moods.length > 0 ?
                    stats.moods.reduce((a, b) => a + b, 0) / stats.moods.length : null,
                avgScore: stats.scores.length > 0 ?
                    stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length : null,
                avgExercise: stats.exercises.length > 0 ?
                    stats.exercises.reduce((a, b) => a + b, 0) / stats.exercises.length : null,
                dataPoints: Math.max(stats.moods.length, stats.scores.length, stats.exercises.length)
            };
        });

        return patterns;
    }

    findBestWorstDays(patterns) {
        const daysWithData = Object.values(patterns).filter(p => p.avgScore !== null);
        if (daysWithData.length === 0) return null;

        const bestDay = daysWithData.reduce((best, current) =>
            current.avgScore > best.avgScore ? current : best
        );

        const worstDay = daysWithData.reduce((worst, current) =>
            current.avgScore < worst.avgScore ? current : worst
        );

        return { bestDay, worstDay };
    }

    detectConsistencyPattern(days = 30) {
        // Check how consistently user logs data
        const today = new Date();
        let daysWithMoodLog = 0;
        let daysWithSleepLog = 0;
        let daysWithExerciseLog = 0;

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Check mood
            if (this.getMoodDataForDate(dateStr)) daysWithMoodLog++;

            // Check sleep
            if (this.getSleepDataForDate(dateStr)) daysWithSleepLog++;

            // Check exercise
            if (this.getExerciseDataForDate(dateStr) > 0) daysWithExerciseLog++;
        }

        return {
            moodConsistency: (daysWithMoodLog / days) * 100,
            sleepConsistency: (daysWithSleepLog / days) * 100,
            exerciseConsistency: (daysWithExerciseLog / days) * 100,
            overallConsistency: ((daysWithMoodLog + daysWithSleepLog + daysWithExerciseLog) / (days * 3)) * 100
        };
    }

    detectStreaks(days = 30) {
        // Find current streaks for each tracker
        const today = new Date();
        const streaks = {
            mood: 0,
            sleep: 0,
            exercise: 0
        };

        // Check mood streak
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            if (this.getMoodDataForDate(dateStr)) {
                streaks.mood++;
            } else {
                break;
            }
        }

        // Check sleep streak
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            if (this.getSleepDataForDate(dateStr)) {
                streaks.sleep++;
            } else {
                break;
            }
        }

        // Check exercise streak
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            if (this.getExerciseDataForDate(dateStr) > 0) {
                streaks.exercise++;
            } else {
                break;
            }
        }

        return streaks;
    }

    generatePredictiveSuggestions(patterns, consistency, trends) {
        const suggestions = [];

        // Day-based suggestions
        const bestWorst = this.findBestWorstDays(patterns);
        if (bestWorst) {
            if (bestWorst.worstDay.avgScore < 50) {
                suggestions.push({
                    type: 'temporal',
                    priority: 'high',
                    message: `${bestWorst.worstDay.name}s tend to be challenging (${bestWorst.worstDay.avgScore.toFixed(1)}% wellness). Plan extra self-care on ${bestWorst.worstDay.name}s.`
                });
            }

            if (bestWorst.bestDay.avgScore > 70) {
                suggestions.push({
                    type: 'temporal',
                    priority: 'positive',
                    message: `${bestWorst.bestDay.name}s are your best days (${bestWorst.bestDay.avgScore.toFixed(1)}% wellness)! What makes ${bestWorst.bestDay.name}s great? Replicate that.`
                });
            }
        }

        // Consistency suggestions
        if (consistency.moodConsistency < 50) {
            suggestions.push({
                type: 'consistency',
                priority: 'medium',
                message: `You're logging mood only ${consistency.moodConsistency.toFixed(0)}% of days. Daily tracking reveals better patterns.`
            });
        }

        if (consistency.exerciseConsistency < 30) {
            suggestions.push({
                type: 'consistency',
                priority: 'medium',
                message: `Exercise logged only ${consistency.exerciseConsistency.toFixed(0)}% of days. Even 10 minutes counts!`
            });
        }

        // Trend-based suggestions
        if (trends && trends.trend === 'declining') {
            suggestions.push({
                type: 'trend',
                priority: 'high',
                message: `Wellness declining by ${Math.abs(trends.change).toFixed(1)}%. ${trends.suggestion || 'Focus on consistent tracking'}`
            });
        }

        if (trends && trends.trend === 'improving') {
            suggestions.push({
                type: 'trend',
                priority: 'positive',
                message: `Wellness improving by ${trends.change.toFixed(1)}%! Keep up the momentum!`
            });
        }

        return suggestions;
    }

    generateWeeklyInsights(days = 30) {
        const patterns = this.detectWeeklyPatterns(days);
        const consistency = this.detectConsistencyPattern(days);
        const streaks = this.detectStreaks(days);
        const trendsData = this.getTrendsData(4);
        const trendAnalysis = this.analyzeWellnessTrend(trendsData);
        const suggestions = this.generatePredictiveSuggestions(patterns, consistency, trendAnalysis);

        // Get current wellness score
        const currentScore = this.calculateWellnessScore(7);

        // Calculate improvement from last week
        let weeklyChange = null;
        if (trendsData.length >= 2) {
            const thisWeek = trendsData[trendsData.length - 1];
            const lastWeek = trendsData[trendsData.length - 2];
            weeklyChange = thisWeek.percentage - lastWeek.percentage;
        }

        return {
            period: `Last ${days} days`,
            currentScore,
            weeklyChange,
            patterns,
            consistency,
            streaks,
            trendAnalysis,
            suggestions,
            generatedAt: new Date().toISOString()
        };
    }

    showInsights(days = 30) {
        const insights = this.generateWeeklyInsights(days);

        console.log(`
╔════════════════════════════════════════════════════════════╗
║              💡 WELLNESS INSIGHTS & PATTERNS               ║
╚════════════════════════════════════════════════════════════╝

📊 Analysis Period: ${insights.period}
`);

        // Current status
        const statusEmoji = this.getScoreEmoji(insights.currentScore.percentage);
        console.log(`Current Wellness: ${statusEmoji} ${insights.currentScore.percentage.toFixed(1)}% - ${this.getScoreLabel(insights.currentScore.percentage)}`);

        if (insights.weeklyChange !== null) {
            const changeEmoji = insights.weeklyChange > 0 ? '⬆️' : insights.weeklyChange < 0 ? '⬇️' : '➡️';
            const changeStr = insights.weeklyChange > 0 ? `+${insights.weeklyChange.toFixed(1)}%` : `${insights.weeklyChange.toFixed(1)}%`;
            console.log(`Weekly Change: ${changeEmoji} ${changeStr}\n`);
        }

        console.log('────────────────────────────────────────────────────────────\n');

        // Weekly patterns
        const bestWorst = this.findBestWorstDays(insights.patterns);
        if (bestWorst) {
            console.log(chalk.bold('📅 Day of Week Patterns:\n'));
            console.log(`   ${chalk.green('🌟 Best Day:')} ${bestWorst.bestDay.name} (${bestWorst.bestDay.avgScore.toFixed(1)}% avg wellness)`);
            console.log(`   ${chalk.yellow('😞 Challenging Day:')} ${bestWorst.worstDay.name} (${bestWorst.worstDay.avgScore.toFixed(1)}% avg wellness)\n`);

            // Convert patterns to heatmap format
            const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
            const heatmapData = Object.entries(insights.patterns).map(([dayNum, data]) => ({
                dayOfWeek: dayMap[dayNum],
                avgScore: data.avgScore || 0,
                count: data.dataPoints || 0
            }));

            // Reorder to start from Monday
            const reordered = [
                heatmapData[1], // Mon
                heatmapData[2], // Tue
                heatmapData[3], // Wed
                heatmapData[4], // Thu
                heatmapData[5], // Fri
                heatmapData[6], // Sat
                heatmapData[0]  // Sun
            ];

            console.log(chalk.bold('   Weekly Wellness Heatmap:\n'));
            console.log(this.generateDayOfWeekHeatmap(reordered));
            console.log(chalk.gray('   Legend: █ = Excellent (75+) | ▓ = Good (60+) | ▒ = Fair (40+) | ░ = Needs Work (<40)\n'));

            console.log('────────────────────────────────────────────────────────────\n');
        }

        // Consistency tracking
        console.log('📈 Tracking Consistency:\n');
        const moodBar = this.createProgressBar(insights.consistency.moodConsistency, 100, 20);
        const sleepBar = this.createProgressBar(insights.consistency.sleepConsistency, 100, 20);
        const exerciseBar = this.createProgressBar(insights.consistency.exerciseConsistency, 100, 20);

        console.log(`   Mood Logging:     ${moodBar} ${insights.consistency.moodConsistency.toFixed(0)}%`);
        console.log(`   Sleep Logging:    ${sleepBar} ${insights.consistency.sleepConsistency.toFixed(0)}%`);
        console.log(`   Exercise Logging: ${exerciseBar} ${insights.consistency.exerciseConsistency.toFixed(0)}%`);
        console.log(`   Overall:          ${insights.consistency.overallConsistency.toFixed(0)}% of data logged`);

        console.log('\n────────────────────────────────────────────────────────────\n');

        // Streaks
        const maxStreak = Math.max(insights.streaks.mood, insights.streaks.sleep, insights.streaks.exercise);
        if (maxStreak > 0) {
            console.log('🔥 Current Streaks:\n');
            if (insights.streaks.mood > 0) {
                console.log(`   🧠 Mood: ${insights.streaks.mood} day${insights.streaks.mood > 1 ? 's' : ''} ${insights.streaks.mood >= 7 ? '🌟' : ''}`);
            }
            if (insights.streaks.sleep > 0) {
                console.log(`   😴 Sleep: ${insights.streaks.sleep} day${insights.streaks.sleep > 1 ? 's' : ''} ${insights.streaks.sleep >= 7 ? '🌟' : ''}`);
            }
            if (insights.streaks.exercise > 0) {
                console.log(`   🏃 Exercise: ${insights.streaks.exercise} day${insights.streaks.exercise > 1 ? 's' : ''} ${insights.streaks.exercise >= 7 ? '🌟' : ''}`);
            }

            if (maxStreak >= 7) {
                console.log('\n   🎉 Week-long streak! Consistency is key to wellness!');
            }

            console.log('\n────────────────────────────────────────────────────────────\n');
        }

        // Suggestions
        if (insights.suggestions.length > 0) {
            console.log('💡 Personalized Insights:\n');

            const highPriority = insights.suggestions.filter(s => s.priority === 'high');
            const mediumPriority = insights.suggestions.filter(s => s.priority === 'medium');
            const positive = insights.suggestions.filter(s => s.priority === 'positive');

            highPriority.forEach(s => {
                console.log(`   🔴 ${s.message}`);
            });

            mediumPriority.forEach(s => {
                console.log(`   🟡 ${s.message}`);
            });

            positive.forEach(s => {
                console.log(`   ✅ ${s.message}`);
            });

            console.log('\n────────────────────────────────────────────────────────────\n');
        }

        // Trending insight
        if (insights.trendAnalysis && insights.trendAnalysis.trend !== 'insufficient') {
            console.log(`📊 Trend: ${insights.trendAnalysis.emoji} ${insights.trendAnalysis.trend.charAt(0).toUpperCase() + insights.trendAnalysis.trend.slice(1)}`);
            if (insights.trendAnalysis.change) {
                console.log(`   Recent weeks ${Math.abs(insights.trendAnalysis.change).toFixed(1)}% ${insights.trendAnalysis.change > 0 ? 'higher' : 'lower'} than earlier weeks`);
            }
            console.log('');
        }
    }

    // ========================================
    // Export & Reporting
    // ========================================

    /**
     * Gather trends data for export
     */
    gatherTrendsForExport(weeks = 8) {
        const trendsData = this.getTrendsData(weeks);
        const validWeeks = trendsData.filter(w => w.daysWithData > 0);

        if (validWeeks.length === 0) {
            return { trend: 'insufficient', message: 'No data available' };
        }

        const trendAnalysis = this.analyzeWellnessTrend(trendsData);

        // Component trends
        const componentTrends = {};
        const components = ['mood', 'sleep', 'exercise', 'medication'];

        components.forEach(comp => {
            const compData = validWeeks.map(w => w[comp]).filter(v => v !== null);
            if (compData.length >= 2) {
                const recent = compData.slice(-Math.ceil(compData.length / 2));
                const earlier = compData.slice(0, Math.ceil(compData.length / 2));

                const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

                const change = recentAvg - earlierAvg;
                let trend = 'stable';
                let emoji = '➡️';

                if (change > 2) {
                    trend = 'improving';
                    emoji = '📈';
                } else if (change < -2) {
                    trend = 'declining';
                    emoji = '📉';
                }

                componentTrends[comp] = { trend, emoji, change: change.toFixed(1) };
            }
        });

        return {
            ...trendAnalysis,
            componentTrends,
            weeklyData: validWeeks
        };
    }

    /**
     * Gather correlations data for export
     */
    gatherCorrelationsForExport(days = 30) {
        const findings = [];

        // Sleep-Mood Correlation
        const sleepMood = this.analyzeSleepMoodCorrelation(days);
        if (sleepMood && !sleepMood.insufficient) {
            if (sleepMood.durationCorrelation !== null) {
                findings.push({
                    factor: 'Sleep Duration',
                    correlation: sleepMood.durationCorrelation,
                    strength: this.getCorrelationStrength(sleepMood.durationCorrelation),
                    description: this.interpretSleepDurationCorrelation(sleepMood.durationCorrelation)
                });
            }
            if (sleepMood.qualityCorrelation !== null) {
                findings.push({
                    factor: 'Sleep Quality',
                    correlation: sleepMood.qualityCorrelation,
                    strength: this.getCorrelationStrength(sleepMood.qualityCorrelation),
                    description: this.interpretSleepQualityCorrelation(sleepMood.qualityCorrelation)
                });
            }
        }

        // Exercise-Mood Correlation
        const exerciseMood = this.analyzeExerciseMoodCorrelation(days);
        if (exerciseMood && !exerciseMood.insufficient && exerciseMood.correlation !== null) {
            let description = 'Exercise and mood show some correlation.';
            if (exerciseMood.avgMoodWithExercise && exerciseMood.avgMoodWithoutExercise) {
                const diff = exerciseMood.moodDifference;
                if (diff > 0) {
                    description = `Mood is ${diff.toFixed(1)} points higher on days with exercise`;
                } else if (diff < 0) {
                    description = `Mood is ${Math.abs(diff).toFixed(1)} points lower on days with exercise`;
                }
            }

            findings.push({
                factor: 'Exercise',
                correlation: exerciseMood.correlation,
                strength: this.getCorrelationStrength(exerciseMood.correlation),
                description
            });
        }

        // Medication-Mood Correlation
        const medicationMood = this.analyzeMedicationMoodCorrelation(days);
        if (medicationMood && !medicationMood.insufficient && medicationMood.correlation !== null) {
            let description = 'Medication adherence and mood show some correlation.';
            if (medicationMood.avgMoodFullAdherence && medicationMood.avgMoodNoAdherence) {
                const diff = medicationMood.moodDifference;
                if (diff > 0) {
                    description = `Mood is ${diff.toFixed(1)} points higher with full medication adherence`;
                } else if (diff < 0) {
                    description = `Mood is ${Math.abs(diff).toFixed(1)} points lower with full adherence`;
                }
            }

            findings.push({
                factor: 'Medication Adherence',
                correlation: medicationMood.correlation,
                strength: this.getCorrelationStrength(medicationMood.correlation),
                description
            });
        }

        return {
            findings,
            daysAnalyzed: days,
            hasData: findings.length > 0
        };
    }

    /**
     * Gather all wellness data for export
     */
    gatherExportData(days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const data = {
            exportInfo: {
                generatedAt: new Date().toISOString(),
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                daysIncluded: days
            },
            summary: this.calculateWellnessSummary(days),
            dailyRecords: [],
            goals: this.data.goals || [],
            achievedGoals: this.data.achievedGoals || [],
            insights: this.generateWeeklyInsights(days),
            trends: this.gatherTrendsForExport(Math.ceil(days / 7)),
            correlations: this.gatherCorrelationsForExport(days)
        };

        // Gather daily records
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dailyData = {
                date: dateStr,
                dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
                mood: null,
                sleep: null,
                exercise: null,
                medication: null,
                wellnessScore: null
            };

            // Mood data
            if (this.mentalHealth?.data?.moodLogs) {
                const moodLog = this.mentalHealth.data.moodLogs.find(log => {
                    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                    return logDate === dateStr;
                });
                if (moodLog) {
                    dailyData.mood = {
                        rating: moodLog.rating,
                        notes: moodLog.notes || ''
                    };
                }
            }

            // Sleep data
            if (this.sleep?.data?.sleepEntries) {
                const sleepLog = this.sleep.data.sleepEntries.find(log => {
                    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                    return logDate === dateStr;
                });
                if (sleepLog) {
                    dailyData.sleep = {
                        duration: parseFloat(sleepLog.duration),
                        quality: sleepLog.quality,
                        notes: sleepLog.notes || ''
                    };
                }
            }

            // Exercise data
            if (this.exercise?.data?.exercises) {
                const exercises = this.exercise.data.exercises.filter(act => {
                    const actDate = new Date(act.timestamp).toISOString().split('T')[0];
                    return actDate === dateStr;
                });
                if (exercises.length > 0) {
                    const totalMinutes = exercises.reduce((sum, ex) => sum + ex.duration, 0);
                    dailyData.exercise = {
                        totalMinutes,
                        activities: exercises.map(ex => ({
                            type: ex.type,
                            duration: ex.duration,
                            intensity: ex.intensity || 'moderate'
                        }))
                    };
                }
            }

            // Medication data
            if (this.medication?.data?.medications && this.medication?.data?.doses) {
                const dayDoses = this.medication.data.doses.filter(dose =>
                    dose.date.split('T')[0] === dateStr
                );
                if (dayDoses.length > 0) {
                    dailyData.medication = {
                        taken: dayDoses.filter(d => d.taken).length,
                        scheduled: dayDoses.length,
                        adherence: (dayDoses.filter(d => d.taken).length / dayDoses.length * 100).toFixed(1)
                    };
                }
            }

            // Calculate wellness score for this day
            const scoreComponents = this.calculateDayScore(dateStr);
            if (scoreComponents.totalScore > 0) {
                dailyData.wellnessScore = scoreComponents.totalScore;
            }

            data.dailyRecords.push(dailyData);
        }

        return data;
    }

    /**
     * Calculate summary statistics
     */
    calculateWellnessSummary(days = 30) {
        const summary = {
            totalDays: days,
            averageWellnessScore: 0,
            moodStats: { average: 0, logs: 0 },
            sleepStats: { averageDuration: 0, averageQuality: 0, logs: 0 },
            exerciseStats: { averageMinutes: 0, totalMinutes: 0, activeDays: 0 },
            medicationStats: { adherenceRate: 0, doses: 0 }
        };

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        let totalScore = 0;
        let scoreDays = 0;

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const scores = this.calculateDayScore(dateStr);
            if (scores.totalScore > 0) {
                totalScore += scores.totalScore;
                scoreDays++;
            }

            // Mood
            if (this.mentalHealth?.data?.moodLogs) {
                const log = this.mentalHealth.data.moodLogs.find(l => {
                    const logDate = new Date(l.timestamp).toISOString().split('T')[0];
                    return logDate === dateStr;
                });
                if (log) {
                    summary.moodStats.average += log.rating;
                    summary.moodStats.logs++;
                }
            }

            // Sleep
            if (this.sleep?.data?.sleepEntries) {
                const log = this.sleep.data.sleepEntries.find(l => {
                    const logDate = new Date(l.timestamp).toISOString().split('T')[0];
                    return logDate === dateStr;
                });
                if (log) {
                    summary.sleepStats.averageDuration += parseFloat(log.duration);
                    summary.sleepStats.averageQuality += log.quality;
                    summary.sleepStats.logs++;
                }
            }

            // Exercise
            if (this.exercise?.data?.exercises) {
                const exercises = this.exercise.data.exercises.filter(a => {
                    const actDate = new Date(a.timestamp).toISOString().split('T')[0];
                    return actDate === dateStr;
                });
                if (exercises.length > 0) {
                    const dayMinutes = exercises.reduce((sum, a) => sum + a.duration, 0);
                    summary.exerciseStats.totalMinutes += dayMinutes;
                    summary.exerciseStats.activeDays++;
                }
            }
        }

        // Calculate averages
        if (scoreDays > 0) summary.averageWellnessScore = (totalScore / scoreDays).toFixed(1);
        if (summary.moodStats.logs > 0) summary.moodStats.average = (summary.moodStats.average / summary.moodStats.logs).toFixed(1);
        if (summary.sleepStats.logs > 0) {
            summary.sleepStats.averageDuration = (summary.sleepStats.averageDuration / summary.sleepStats.logs).toFixed(1);
            summary.sleepStats.averageQuality = (summary.sleepStats.averageQuality / summary.sleepStats.logs).toFixed(1);
        }
        if (summary.exerciseStats.activeDays > 0) {
            summary.exerciseStats.averageMinutes = (summary.exerciseStats.totalMinutes / summary.exerciseStats.activeDays).toFixed(1);
        }

        // Medication adherence
        if (this.medication?.data?.doses) {
            const relevantDoses = this.medication.data.doses.filter(d => {
                const doseDate = new Date(d.date);
                return doseDate >= startDate && doseDate <= endDate;
            });
            if (relevantDoses.length > 0) {
                const takenDoses = relevantDoses.filter(d => d.taken).length;
                summary.medicationStats.adherenceRate = (takenDoses / relevantDoses.length * 100).toFixed(1);
                summary.medicationStats.doses = relevantDoses.length;
            }
        }

        return summary;
    }

    /**
     * Export data to JSON file
     */
    exportToJSON(days = 30, filename = null) {
        const data = this.gatherExportData(days);

        if (!filename) {
            filename = `wellness-export-${new Date().toISOString().split('T')[0]}.json`;
        }

        try {
            fs.writeFileSync(filename, JSON.stringify(data, null, 2));
            console.log(`\n✅ Data exported successfully to: ${filename}`);
            console.log(`   Period: ${data.exportInfo.startDate} to ${data.exportInfo.endDate}`);
            console.log(`   Daily records: ${data.dailyRecords.length}`);
            console.log(`   Goals: ${data.goals.length} active, ${data.achievedGoals.length} achieved\n`);
            return true;
        } catch (error) {
            console.error(`\n❌ Export failed: ${error.message}\n`);
            return false;
        }
    }

    /**
     * Export data to CSV file
     */
    exportToCSV(days = 30, filename = null) {
        const data = this.gatherExportData(days);

        if (!filename) {
            filename = `wellness-export-${new Date().toISOString().split('T')[0]}.csv`;
        }

        try {
            // CSV header
            const headers = [
                'Date',
                'Day of Week',
                'Wellness Score',
                'Mood Rating',
                'Mood Notes',
                'Sleep Duration (hrs)',
                'Sleep Quality',
                'Sleep Notes',
                'Exercise Minutes',
                'Exercise Types',
                'Medication Taken',
                'Medication Scheduled',
                'Medication Adherence %'
            ];

            const rows = [headers.join(',')];

            // Add data rows
            data.dailyRecords.forEach(record => {
                const row = [
                    record.date,
                    record.dayOfWeek,
                    record.wellnessScore || '',
                    record.mood?.rating || '',
                    `"${(record.mood?.notes || '').replace(/"/g, '""')}"`,
                    record.sleep?.duration || '',
                    record.sleep?.quality || '',
                    `"${(record.sleep?.notes || '').replace(/"/g, '""')}"`,
                    record.exercise?.totalMinutes || '',
                    `"${record.exercise?.activities.map(a => a.type).join(', ') || ''}"`,
                    record.medication?.taken || '',
                    record.medication?.scheduled || '',
                    record.medication?.adherence || ''
                ];
                rows.push(row.join(','));
            });

            fs.writeFileSync(filename, rows.join('\n'));
            console.log(`\n✅ CSV exported successfully to: ${filename}`);
            console.log(`   Period: ${data.exportInfo.startDate} to ${data.exportInfo.endDate}`);
            console.log(`   Records: ${data.dailyRecords.length} days\n`);
            return true;
        } catch (error) {
            console.error(`\n❌ CSV export failed: ${error.message}\n`);
            return false;
        }
    }

    /**
     * Generate comprehensive text report
     */
    generateReport(days = 30, filename = null) {
        const data = this.gatherExportData(days);

        if (!filename) {
            filename = `wellness-report-${new Date().toISOString().split('T')[0]}.txt`;
        }

        try {
            const lines = [];

            // Header
            lines.push('═══════════════════════════════════════════════════════════');
            lines.push('              WELLNESS REPORT');
            lines.push('═══════════════════════════════════════════════════════════');
            lines.push('');
            lines.push(`Report Generated: ${new Date().toLocaleString()}`);
            lines.push(`Period: ${data.exportInfo.startDate} to ${data.exportInfo.endDate}`);
            lines.push(`Days Analyzed: ${data.exportInfo.daysIncluded}`);
            lines.push('');

            // Executive Summary
            lines.push('───────────────────────────────────────────────────────────');
            lines.push('EXECUTIVE SUMMARY');
            lines.push('───────────────────────────────────────────────────────────');
            lines.push('');
            lines.push(`Average Wellness Score: ${data.summary.averageWellnessScore}/100`);
            lines.push(`Mood Average: ${data.summary.moodStats.average}/10 (${data.summary.moodStats.logs} entries)`);
            lines.push(`Sleep Duration: ${data.summary.sleepStats.averageDuration} hours avg (${data.summary.sleepStats.logs} nights)`);
            lines.push(`Sleep Quality: ${data.summary.sleepStats.averageQuality}/10`);
            lines.push(`Exercise: ${data.summary.exerciseStats.averageMinutes} min/day avg (${data.summary.exerciseStats.activeDays} active days)`);
            lines.push(`Medication Adherence: ${data.summary.medicationStats.adherenceRate}%`);
            lines.push('');

            // Goals Status
            if (data.goals.length > 0 || data.achievedGoals.length > 0) {
                lines.push('───────────────────────────────────────────────────────────');
                lines.push('GOALS & MILESTONES');
                lines.push('───────────────────────────────────────────────────────────');
                lines.push('');

                lines.push(`Active Goals: ${data.goals.length}`);
                data.goals.forEach(goal => {
                    const progress = this.checkGoalProgress(goal.id);
                    if (progress) {
                        lines.push(`  • ${goal.description}`);
                        lines.push(`    Progress: ${progress.progressPercentage.toFixed(1)}% (${progress.current.toFixed(1)}/${progress.target})`);
                        lines.push(`    Target Date: ${goal.targetDate}`);
                        lines.push(`    Status: ${progress.onTrack === true ? '✅ On Track' : progress.onTrack === false ? '❌ Behind' : '🟡 Uncertain'}`);
                    }
                });
                lines.push('');

                if (data.achievedGoals.length > 0) {
                    lines.push(`Achieved Goals: ${data.achievedGoals.length}`);
                    data.achievedGoals.forEach(goal => {
                        lines.push(`  ✅ ${goal.description}`);
                        if (goal.achievedDate) {
                            lines.push(`     Achieved: ${goal.achievedDate}`);
                        }
                    });
                    lines.push('');
                }
            }

            // Insights & Patterns
            if (data.insights) {
                lines.push('───────────────────────────────────────────────────────────');
                lines.push('WELLNESS INSIGHTS & PATTERNS');
                lines.push('───────────────────────────────────────────────────────────');
                lines.push('');

                if (data.insights.bestDay || data.insights.worstDay) {
                    lines.push('Day-of-Week Patterns:');
                    if (data.insights.bestDay) {
                        lines.push(`  Best Day: ${data.insights.bestDay} (avg score: ${data.insights.patterns[data.insights.bestDay]?.avgScore?.toFixed(1) || 'N/A'})`);
                    }
                    if (data.insights.worstDay) {
                        lines.push(`  Worst Day: ${data.insights.worstDay} (avg score: ${data.insights.patterns[data.insights.worstDay]?.avgScore?.toFixed(1) || 'N/A'})`);
                    }
                    lines.push('');
                }

                if (data.insights.consistency) {
                    lines.push('Logging Consistency:');
                    lines.push(`  Mood: ${data.insights.consistency.moodConsistency.toFixed(1)}%`);
                    lines.push(`  Sleep: ${data.insights.consistency.sleepConsistency.toFixed(1)}%`);
                    lines.push(`  Exercise: ${data.insights.consistency.exerciseConsistency.toFixed(1)}%`);
                    lines.push(`  Overall: ${data.insights.consistency.overallConsistency.toFixed(1)}%`);
                    lines.push('');
                }

                if (data.insights.streaks) {
                    const hasStreaks = data.insights.streaks.moodStreak > 0 ||
                                      data.insights.streaks.sleepStreak > 0 ||
                                      data.insights.streaks.exerciseStreak > 0;
                    if (hasStreaks) {
                        lines.push('Current Streaks:');
                        if (data.insights.streaks.moodStreak > 0) {
                            lines.push(`  🎯 Mood tracking: ${data.insights.streaks.moodStreak} days`);
                        }
                        if (data.insights.streaks.sleepStreak > 0) {
                            lines.push(`  😴 Sleep logging: ${data.insights.streaks.sleepStreak} days`);
                        }
                        if (data.insights.streaks.exerciseStreak > 0) {
                            lines.push(`  💪 Exercise: ${data.insights.streaks.exerciseStreak} days`);
                        }
                        lines.push('');
                    }
                }

                if (data.insights.suggestions && data.insights.suggestions.length > 0) {
                    lines.push('AI Suggestions:');
                    const high = data.insights.suggestions.filter(s => s.priority === 'high');
                    const medium = data.insights.suggestions.filter(s => s.priority === 'medium');
                    const positive = data.insights.suggestions.filter(s => s.priority === 'positive');

                    if (high.length > 0) {
                        lines.push('  High Priority:');
                        high.forEach(s => lines.push(`    🔴 ${s.message}`));
                    }
                    if (medium.length > 0) {
                        lines.push('  Medium Priority:');
                        medium.forEach(s => lines.push(`    🟡 ${s.message}`));
                    }
                    if (positive.length > 0) {
                        lines.push('  Positive Trends:');
                        positive.forEach(s => lines.push(`    ✅ ${s.message}`));
                    }
                    lines.push('');
                }
            }

            // Correlations
            if (data.correlations && data.correlations.findings.length > 0) {
                lines.push('───────────────────────────────────────────────────────────');
                lines.push('CORRELATION ANALYSIS');
                lines.push('───────────────────────────────────────────────────────────');
                lines.push('');
                data.correlations.findings.forEach(finding => {
                    lines.push(`• ${finding.factor}: ${finding.description}`);
                    lines.push(`  Correlation: ${finding.correlation.toFixed(3)} (${finding.strength})`);
                });
                lines.push('');
            }

            // Trends
            if (data.trends && data.trends.trend !== 'insufficient') {
                lines.push('───────────────────────────────────────────────────────────');
                lines.push('WELLNESS TRENDS');
                lines.push('───────────────────────────────────────────────────────────');
                lines.push('');
                lines.push(`Overall Trend: ${data.trends.emoji} ${data.trends.trend.toUpperCase()}`);
                if (data.trends.change) {
                    lines.push(`Weekly Change: ${data.trends.change > 0 ? '+' : ''}${data.trends.change.toFixed(1)}%`);
                }
                lines.push('');

                if (data.trends.componentTrends) {
                    lines.push('Component Trends:');
                    Object.entries(data.trends.componentTrends).forEach(([component, trend]) => {
                        lines.push(`  ${component}: ${trend.emoji} ${trend.trend}`);
                    });
                    lines.push('');
                }
            }

            // Footer
            lines.push('═══════════════════════════════════════════════════════════');
            lines.push('End of Report');
            lines.push('═══════════════════════════════════════════════════════════');

            fs.writeFileSync(filename, lines.join('\n'));
            console.log(`\n✅ Report generated successfully: ${filename}`);
            console.log(`   Period: ${data.exportInfo.startDate} to ${data.exportInfo.endDate}`);
            console.log(`   ${lines.length} lines written\n`);
            return true;
        } catch (error) {
            console.error(`\n❌ Report generation failed: ${error.message}\n`);
            return false;
        }
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

        case 'goals':
        case 'goal':
            dashboard.showGoals();
            break;

        case 'set-goal':
            if (args.length < 4) {
                console.error('❌ Usage: node daily-dashboard.js set-goal <type> <target> <date> [description]');
                console.error('   Types: wellness, mood, sleep-duration, sleep-quality, exercise, medication');
                console.error('   Example: node daily-dashboard.js set-goal wellness 80 2025-12-31 "Get healthier"');
                process.exit(1);
            }
            dashboard.setGoal(args[1], args[2], args[3], args[4] || '');
            break;

        case 'delete-goal':
            if (args.length < 2) {
                console.error('❌ Usage: node daily-dashboard.js delete-goal <goal-id>');
                process.exit(1);
            }
            dashboard.deleteGoal(parseInt(args[1]));
            break;

        case 'goal-progress':
            if (args.length < 2) {
                console.error('❌ Usage: node daily-dashboard.js goal-progress <goal-id>');
                process.exit(1);
            }
            const progress = dashboard.checkGoalProgress(parseInt(args[1]));
            if (progress) {
                const goal = progress.goal;
                console.log(`\n🎯 Goal Progress: ${goal.description}`);
                console.log(`   ID: ${goal.id}`);
                console.log(`   Type: ${goal.type}`);
                console.log(`   Current: ${dashboard.formatGoalTarget(goal.type, progress.current.toFixed(1))}`);
                console.log(`   Target: ${dashboard.formatGoalTarget(goal.type, progress.target)}`);
                console.log(`   Progress: ${progress.progressPercentage.toFixed(1)}%`);
                console.log(`   Days Remaining: ${progress.daysRemaining}`);
                console.log(`   Days Elapsed: ${progress.daysElapsed}`);
                console.log(`   On Track: ${progress.onTrack === true ? '✅ Yes' : progress.onTrack === false ? '❌ No' : '🟡 Uncertain'}`);
                console.log('');
            }
            break;

        case 'insights':
        case 'insight':
        case 'patterns':
            const insightDays = args[1] ? parseInt(args[1]) : 30;
            dashboard.showInsights(insightDays);
            break;

        case 'export-json':
        case 'export':
            const jsonDays = args[1] ? parseInt(args[1]) : 30;
            const jsonFile = args[2] || null;
            dashboard.exportToJSON(jsonDays, jsonFile);
            break;

        case 'export-csv':
            const csvDays = args[1] ? parseInt(args[1]) : 30;
            const csvFile = args[2] || null;
            dashboard.exportToCSV(csvDays, csvFile);
            break;

        case 'report':
        case 'generate-report':
            const reportDays = args[1] ? parseInt(args[1]) : 30;
            const reportFile = args[2] || null;
            dashboard.generateReport(reportDays, reportFile);
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

  goals, goal
      Show all wellness goals and their progress
      Displays active goals, milestones, and achievements

  set-goal <type> <target> <date> [description]
      Create a new wellness goal
      Types: wellness, mood, sleep-duration, sleep-quality, exercise, medication
      Example: set-goal wellness 80 2025-12-31

  goal-progress <id>
      Check detailed progress for a specific goal

  delete-goal <id>
      Delete a goal by its ID

  insights, insight, patterns [days]
      AI-like pattern detection and weekly insights (default: 30 days)
      Shows best/worst days, consistency tracking, streaks, and predictions

  export, export-json [days] [filename]
      Export wellness data to JSON format (default: 30 days)
      Includes all data, insights, trends, and correlations
      Example: export-json 60 my-data.json

  export-csv [days] [filename]
      Export wellness data to CSV format for Excel (default: 30 days)
      Daily records with all wellness metrics
      Example: export-csv 90 wellness.csv

  report, generate-report [days] [filename]
      Generate comprehensive wellness report (default: 30 days)
      Text format with executive summary, goals, insights, and trends
      Example: report 30 monthly-report.txt

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
  node daily-dashboard.js goals            # View all goals
  node daily-dashboard.js set-goal wellness 80 2025-12-31
  node daily-dashboard.js goal-progress 1  # Check goal #1
  node daily-dashboard.js insights         # Get weekly insights
  node daily-dashboard.js insights 60      # 60-day pattern analysis
  node daily-dashboard.js export-json      # Export last 30 days
  node daily-dashboard.js export-csv 90    # Export last 90 days to CSV
  node daily-dashboard.js report           # Generate wellness report
            `);
            break;
    }
}

module.exports = DailyDashboard;
