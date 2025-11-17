const fs = require('fs');
const MentalHealthTracker = require('./mental-health-tracker');
const SleepTracker = require('./sleep-tracker');
const ExerciseTracker = require('./exercise-tracker');
const MedicationTracker = require('./medication-tracker');

class DailyDashboard {
    constructor() {
        this.mentalHealth = null;
        this.sleep = null;
        this.exercise = null;
        this.medication = null;

        this.loadTrackers();
    }

    loadTrackers() {
        // Try to load each tracker, but don't fail if data doesn't exist
        try {
            this.mentalHealth = new MentalHealthTracker();
        } catch (error) {
            // Mental health data not available
        }

        try {
            this.sleep = new SleepTracker();
        } catch (error) {
            // Sleep data not available
        }

        try {
            this.exercise = new ExerciseTracker();
        } catch (error) {
            // Exercise data not available
        }

        try {
            this.medication = new MedicationTracker();
        } catch (error) {
            // Medication data not available
        }
    }

    showDailyDashboard() {
        const today = new Date().toISOString().split('T')[0];

        console.log('\n╔' + '═'.repeat(68) + '╗');
        console.log('║' + ' '.repeat(20) + '🌟 DAILY WELLNESS DASHBOARD' + ' '.repeat(20) + '║');
        console.log('║' + ' '.repeat(25) + new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }).padEnd(43) + '║');
        console.log('╚' + '═'.repeat(68) + '╝');

        // Today's data
        const todayData = this.getTodayData(today);

        // Wellness score
        const score = this.calculateWellnessScore(todayData);
        this.displayWellnessScore(score);

        // Individual tracker summaries
        this.displayMentalHealthSummary(todayData);
        this.displaySleepSummary(todayData);
        this.displayExerciseSummary(todayData);
        this.displayMedicationSummary(todayData);

        // Recommendations
        this.displayRecommendations(todayData, score);

        console.log('\n' + '─'.repeat(70));
    }

    getTodayData(today) {
        const data = {
            date: today,
            mood: null,
            moodCount: 0,
            journalCount: 0,
            symptomsCount: 0,
            sleepQuality: null,
            sleepDuration: null,
            exerciseMinutes: 0,
            exerciseCount: 0,
            exerciseIntensity: null,
            medicationsTaken: 0,
            medicationsTotal: 0,
            medicationsMissed: 0
        };

        // Mental Health data
        if (this.mentalHealth && this.mentalHealth.data) {
            const moods = this.mentalHealth.data.moodEntries.filter(m =>
                m.timestamp.startsWith(today)
            );
            if (moods.length > 0) {
                data.mood = moods.reduce((sum, m) => sum + m.rating, 0) / moods.length;
                data.moodCount = moods.length;
            }

            data.journalCount = this.mentalHealth.data.journalEntries.filter(j =>
                j.timestamp.startsWith(today)
            ).length;

            data.symptomsCount = this.mentalHealth.data.symptoms.filter(s =>
                s.timestamp.startsWith(today)
            ).length;
        }

        // Sleep data (last night's sleep)
        if (this.sleep && this.sleep.data) {
            const lastNight = this.sleep.data.sleepEntries.find(s => s.date === today);
            if (lastNight) {
                data.sleepQuality = lastNight.quality;
                data.sleepDuration = lastNight.duration;
            }
        }

        // Exercise data
        if (this.exercise && this.exercise.data) {
            const exercises = this.exercise.data.activities.filter(a => a.date === today);
            data.exerciseCount = exercises.length;
            if (exercises.length > 0) {
                data.exerciseMinutes = exercises.reduce((sum, e) => sum + e.duration, 0);
                data.exerciseIntensity = exercises.reduce((sum, e) => sum + e.intensity, 0) / exercises.length;
            }
        }

        // Medication data
        if (this.medication && this.medication.data) {
            const activeMeds = this.medication.data.medications.filter(m => m.active);
            data.medicationsTotal = activeMeds.length;

            const todayHistory = this.medication.data.history.filter(h =>
                h.timestamp.startsWith(today)
            );
            data.medicationsTaken = todayHistory.filter(h => !h.missed).length;
            data.medicationsMissed = todayHistory.filter(h => h.missed).length;
        }

        return data;
    }

    calculateWellnessScore(data) {
        let score = 0;
        let maxScore = 0;
        const components = {};

        // Mood (0-25 points)
        if (data.mood !== null) {
            maxScore += 25;
            const moodScore = (data.mood / 10) * 25;
            score += moodScore;
            components.mood = { score: moodScore, max: 25 };
        }

        // Sleep (0-25 points)
        if (data.sleepQuality !== null && data.sleepDuration !== null) {
            maxScore += 25;
            // Quality (15 points) + Duration (10 points)
            const qualityScore = (data.sleepQuality / 10) * 15;
            const durationScore = (data.sleepDuration >= 7 && data.sleepDuration <= 9) ? 10 :
                                 (data.sleepDuration >= 6 && data.sleepDuration <= 10) ? 7 : 4;
            const sleepScore = qualityScore + durationScore;
            score += sleepScore;
            components.sleep = { score: sleepScore, max: 25 };
        }

        // Exercise (0-25 points)
        if (data.exerciseMinutes > 0) {
            maxScore += 25;
            // WHO recommends 30 min/day moderate activity
            const exerciseScore = Math.min((data.exerciseMinutes / 30) * 25, 25);
            score += exerciseScore;
            components.exercise = { score: exerciseScore, max: 25 };
        }

        // Medication Adherence (0-25 points)
        if (data.medicationsTotal > 0) {
            maxScore += 25;
            const adherenceRate = data.medicationsTaken / data.medicationsTotal;
            const adherenceScore = adherenceRate * 25;
            score += adherenceScore;
            components.medication = { score: adherenceScore, max: 25 };
        }

        // Normalize to 100 if not all categories tracked
        if (maxScore > 0) {
            score = (score / maxScore) * 100;
        }

        return {
            total: Math.round(score),
            components: components,
            maxPossible: maxScore
        };
    }

    displayWellnessScore(score) {
        console.log('\n┌─ WELLNESS SCORE ─' + '─'.repeat(50) + '┐');

        const total = score.total;
        const barLength = 40;
        const filled = Math.round((total / 100) * barLength);
        const empty = barLength - filled;

        // Color coding
        let emoji = '🟢';
        let label = 'Excellent';
        if (total < 50) {
            emoji = '🔴';
            label = 'Needs Attention';
        } else if (total < 70) {
            emoji = '🟡';
            label = 'Fair';
        } else if (total < 85) {
            emoji = '🟢';
            label = 'Good';
        }

        console.log(`│`);
        console.log(`│  ${emoji} ${total}/100 - ${label}`);
        console.log(`│`);
        console.log(`│  [${'█'.repeat(filled)}${'░'.repeat(empty)}]`);
        console.log(`│`);

        // Component breakdown
        if (Object.keys(score.components).length > 0) {
            console.log(`│  Breakdown:`);
            if (score.components.mood) {
                const pct = Math.round((score.components.mood.score / score.components.mood.max) * 100);
                console.log(`│    😊 Mood: ${pct}%`);
            }
            if (score.components.sleep) {
                const pct = Math.round((score.components.sleep.score / score.components.sleep.max) * 100);
                console.log(`│    😴 Sleep: ${pct}%`);
            }
            if (score.components.exercise) {
                const pct = Math.round((score.components.exercise.score / score.components.exercise.max) * 100);
                console.log(`│    💪 Exercise: ${pct}%`);
            }
            if (score.components.medication) {
                const pct = Math.round((score.components.medication.score / score.components.medication.max) * 100);
                console.log(`│    💊 Medications: ${pct}%`);
            }
        }

        console.log('└' + '─'.repeat(69) + '┘');
    }

    displayMentalHealthSummary(data) {
        console.log('\n┌─ 🧠 MENTAL HEALTH ─' + '─'.repeat(48) + '┐');
        console.log('│');

        if (data.mood !== null) {
            const moodEmoji = this.getMoodEmoji(data.mood);
            console.log(`│  Mood: ${moodEmoji} ${data.mood.toFixed(1)}/10 ${data.moodCount > 1 ? `(${data.moodCount} entries)` : ''}`);
        } else {
            console.log(`│  Mood: Not logged today`);
        }

        if (data.journalCount > 0) {
            console.log(`│  Journal: ✓ ${data.journalCount} ${data.journalCount === 1 ? 'entry' : 'entries'}`);
        } else {
            console.log(`│  Journal: No entries today`);
        }

        if (data.symptomsCount > 0) {
            console.log(`│  Symptoms: ${data.symptomsCount} logged`);
        }

        console.log('└' + '─'.repeat(69) + '┘');
    }

    displaySleepSummary(data) {
        console.log('\n┌─ 😴 SLEEP ─' + '─'.repeat(57) + '┐');
        console.log('│');

        if (data.sleepQuality !== null) {
            const qualityEmoji = this.getQualityEmoji(data.sleepQuality);
            console.log(`│  Quality: ${qualityEmoji} ${data.sleepQuality}/10`);
            console.log(`│  Duration: ${data.sleepDuration.toFixed(1)} hours`);

            if (data.sleepDuration >= 7 && data.sleepDuration <= 9) {
                console.log(`│  ✓ Optimal sleep duration (7-9h)`);
            } else if (data.sleepDuration < 6) {
                console.log(`│  ⚠️  Sleep deprived (<6h)`);
            } else {
                console.log(`│  ⚠️  Long sleep (>9h)`);
            }
        } else {
            console.log(`│  Last night's sleep not logged`);
        }

        console.log('└' + '─'.repeat(69) + '┘');
    }

    displayExerciseSummary(data) {
        console.log('\n┌─ 💪 EXERCISE ─' + '─'.repeat(54) + '┐');
        console.log('│');

        if (data.exerciseMinutes > 0) {
            console.log(`│  Activity: ✓ ${data.exerciseCount} ${data.exerciseCount === 1 ? 'session' : 'sessions'}`);
            console.log(`│  Duration: ${data.exerciseMinutes} minutes`);
            console.log(`│  Intensity: ${this.getIntensityLabel(data.exerciseIntensity)} (${data.exerciseIntensity.toFixed(1)}/10)`);

            if (data.exerciseMinutes >= 30) {
                console.log(`│  ✓ Met daily activity goal (30+ min)`);
            }
        } else {
            console.log(`│  No exercise logged today`);
            console.log(`│  💡 Try for 30 minutes of moderate activity`);
        }

        console.log('└' + '─'.repeat(69) + '┘');
    }

    displayMedicationSummary(data) {
        console.log('\n┌─ 💊 MEDICATIONS ─' + '─'.repeat(51) + '┐');
        console.log('│');

        if (data.medicationsTotal > 0) {
            const adherenceRate = ((data.medicationsTaken / data.medicationsTotal) * 100).toFixed(0);
            console.log(`│  Adherence: ${data.medicationsTaken}/${data.medicationsTotal} taken (${adherenceRate}%)`);

            if (data.medicationsMissed > 0) {
                console.log(`│  ⚠️  Missed: ${data.medicationsMissed}`);
            } else if (data.medicationsTaken === data.medicationsTotal) {
                console.log(`│  ✓ All medications taken!`);
            }
        } else {
            console.log(`│  No active medications`);
        }

        console.log('└' + '─'.repeat(69) + '┘');
    }

    displayRecommendations(data, score) {
        const recommendations = [];

        // Mood-based recommendations
        if (data.mood !== null && data.mood < 5) {
            recommendations.push('😔 Low mood detected. Consider reaching out to your support network.');
        }

        // Sleep recommendations
        if (data.sleepQuality === null) {
            recommendations.push('😴 Remember to log your sleep tonight!');
        } else if (data.sleepQuality < 5) {
            recommendations.push('😴 Poor sleep quality. Try relaxation techniques before bed.');
        } else if (data.sleepDuration < 6) {
            recommendations.push('⏰ You\'re sleep deprived. Prioritize 7-9 hours tonight.');
        }

        // Exercise recommendations
        if (data.exerciseMinutes === 0) {
            recommendations.push('💪 No exercise today. Even a 10-minute walk helps!');
        } else if (data.exerciseMinutes >= 30) {
            recommendations.push('🎉 Great job meeting your activity goal!');
        }

        // Medication reminders
        if (data.medicationsMissed > 0) {
            recommendations.push('💊 Don\'t forget your missed medications!');
        }

        // Journaling reminder
        if (data.journalCount === 0) {
            recommendations.push('📝 Take a moment to journal about your day.');
        }

        // Positive reinforcement
        if (score.total >= 85) {
            recommendations.push('⭐ Excellent wellness today! Keep it up!');
        } else if (score.total >= 70) {
            recommendations.push('👍 Good wellness day! You\'re on the right track.');
        }

        if (recommendations.length > 0) {
            console.log('\n┌─ 💡 RECOMMENDATIONS ─' + '─'.repeat(46) + '┐');
            console.log('│');
            recommendations.forEach(rec => {
                console.log(`│  ${rec}`);
            });
            console.log('└' + '─'.repeat(69) + '┘');
        }
    }

    showWeeklySummary() {
        console.log('\n╔' + '═'.repeat(68) + '╗');
        console.log('║' + ' '.repeat(19) + '📊 WEEKLY WELLNESS SUMMARY' + ' '.repeat(22) + '║');
        console.log('╚' + '═'.repeat(68) + '╝');

        const weekData = this.getWeekData();

        console.log('\n📈 This Week\'s Overview:');
        console.log('─'.repeat(70));

        // Mental Health
        if (weekData.moods.length > 0) {
            const avgMood = weekData.moods.reduce((sum, m) => sum + m, 0) / weekData.moods.length;
            console.log(`\n🧠 Mental Health:`);
            console.log(`   Average Mood: ${avgMood.toFixed(1)}/10`);
            console.log(`   Entries: ${weekData.moods.length} mood logs, ${weekData.journals} journal entries`);
        }

        // Sleep
        if (weekData.sleepNights.length > 0) {
            const avgQuality = weekData.sleepNights.reduce((sum, s) => sum + s.quality, 0) / weekData.sleepNights.length;
            const avgDuration = weekData.sleepNights.reduce((sum, s) => sum + s.duration, 0) / weekData.sleepNights.length;
            console.log(`\n😴 Sleep:`);
            console.log(`   Average Quality: ${avgQuality.toFixed(1)}/10`);
            console.log(`   Average Duration: ${avgDuration.toFixed(1)} hours`);
            console.log(`   Nights Tracked: ${weekData.sleepNights.length}/7`);
        }

        // Exercise
        if (weekData.exerciseMinutes > 0) {
            console.log(`\n💪 Exercise:`);
            console.log(`   Total Time: ${weekData.exerciseMinutes} minutes`);
            console.log(`   Sessions: ${weekData.exerciseSessions}`);
            console.log(`   Days Active: ${weekData.activeDays}/7`);

            const goalMet = weekData.exerciseMinutes >= 150;
            console.log(`   WHO Goal (150 min): ${goalMet ? '✅' : '❌'} ${weekData.exerciseMinutes}/150`);
        }

        // Medications
        if (weekData.medicationDoses > 0) {
            const adherenceRate = ((weekData.medicationsTaken / weekData.medicationDoses) * 100).toFixed(0);
            console.log(`\n💊 Medications:`);
            console.log(`   Adherence: ${adherenceRate}% (${weekData.medicationsTaken}/${weekData.medicationDoses})`);
        }

        console.log('\n' + '─'.repeat(70));
    }

    getWeekData() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const data = {
            moods: [],
            journals: 0,
            sleepNights: [],
            exerciseMinutes: 0,
            exerciseSessions: 0,
            activeDays: 0,
            medicationDoses: 0,
            medicationsTaken: 0
        };

        // Mental Health
        if (this.mentalHealth && this.mentalHealth.data) {
            data.moods = this.mentalHealth.data.moodEntries
                .filter(m => new Date(m.timestamp) > weekAgo)
                .map(m => m.rating);

            data.journals = this.mentalHealth.data.journalEntries
                .filter(j => new Date(j.timestamp) > weekAgo).length;
        }

        // Sleep
        if (this.sleep && this.sleep.data) {
            data.sleepNights = this.sleep.data.sleepEntries
                .filter(s => new Date(s.timestamp) > weekAgo);
        }

        // Exercise
        if (this.exercise && this.exercise.data) {
            const exercises = this.exercise.data.activities
                .filter(a => new Date(a.timestamp) > weekAgo);

            data.exerciseMinutes = exercises.reduce((sum, e) => sum + e.duration, 0);
            data.exerciseSessions = exercises.length;
            data.activeDays = new Set(exercises.map(e => e.date)).size;
        }

        // Medications
        if (this.medication && this.medication.data) {
            const history = this.medication.data.history
                .filter(h => new Date(h.timestamp) > weekAgo);

            data.medicationDoses = history.length;
            data.medicationsTaken = history.filter(h => !h.missed).length;
        }

        return data;
    }

    getMoodEmoji(mood) {
        if (mood >= 9) return '😄';
        if (mood >= 7) return '😊';
        if (mood >= 5) return '🙂';
        if (mood >= 3) return '😐';
        return '😔';
    }

    getQualityEmoji(quality) {
        if (quality >= 8) return '😊';
        if (quality >= 6) return '🙂';
        if (quality >= 4) return '😐';
        return '😔';
    }

    getIntensityLabel(intensity) {
        if (intensity >= 7) return '🔥 High';
        if (intensity >= 4) return '😊 Moderate';
        return '🚶 Light';
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    const dashboard = new DailyDashboard();

    switch (command) {
        case 'weekly':
        case 'week':
            dashboard.showWeeklySummary();
            break;

        case 'today':
        case 'daily':
        case undefined:
        default:
            dashboard.showDailyDashboard();
            break;
    }
}

module.exports = DailyDashboard;
