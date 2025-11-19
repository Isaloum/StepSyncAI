const fs = require('fs');
const ValidationUtils = require('./validation-utils');

class ExerciseTracker {
    constructor(dataFile = 'exercise-data.json') {
        this.dataFile = dataFile;
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const rawData = fs.readFileSync(this.dataFile, 'utf8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.error('Error loading exercise data:', error.message);
        }
        return {
            exercises: []
        };
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving exercise data:', error.message);
            return false;
        }
    }

    logExercise(type, duration, intensity = 'moderate', notes = '') {
        // Validate exercise type using ValidationUtils
        const validatedType = ValidationUtils.validateString(type, {
            minLength: 1,
            maxLength: 100,
            fieldName: 'exercise type'
        });

        if (!validatedType) {
            console.log('💡 Example: node exercise-tracker.js log "Running" 30 high\n');
            return false;
        }

        // Validate duration using ValidationUtils
        const durationNum = ValidationUtils.parseFloat(duration, {
            min: 1,
            max: 600,
            fieldName: 'duration'
        });

        if (durationNum === null) {
            console.log('💡 Duration should be in minutes (e.g., 30 for 30 minutes)\n');
            return false;
        }

        // Validate intensity
        const validIntensities = ['low', 'moderate', 'high'];
        const intensityLower = intensity.toLowerCase();
        if (!validIntensities.includes(intensityLower)) {
            console.error('❌ Invalid intensity: Intensity must be low, moderate, or high');
            console.log('💡 Example: node exercise-tracker.js log "Yoga" 45 low\n');
            return false;
        }

        const exercise = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            type: validatedType,
            duration: durationNum,
            intensity: intensityLower,
            notes: notes ? notes.trim() : ''
        };

        this.data.exercises.push(exercise);
        this.saveData();

        console.log(`\n✅ Exercise logged successfully!`);
        console.log(`📝 ${type} for ${durationNum} minutes (${intensityLower} intensity)`);

        // Provide feedback
        if (durationNum >= 30) {
            console.log('🎯 Great! You hit the recommended 30 minutes of exercise!');
        } else {
            console.log(`💪 Good start! ${30 - durationNum} more minutes to reach the daily goal.`);
        }

        return true;
    }

    getHistory(days = 7) {
        if (this.data.exercises.length === 0) {
            console.log('\n📭 No exercise data yet. Start logging your workouts!');
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        const recentExercises = this.data.exercises
            .filter(ex => new Date(ex.timestamp) >= cutoffDate)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (recentExercises.length === 0) {
            console.log(`\n📭 No exercise logged in the last ${days} days.`);
            return;
        }

        console.log(`\n📊 Exercise History (Last ${days} Days)`);
        console.log('─'.repeat(60));

        recentExercises.forEach(ex => {
            const intensityEmoji = this.getIntensityEmoji(ex.intensity);
            console.log(`\n📅 ${ex.date}`);
            console.log(`   ${intensityEmoji} ${ex.type} - ${ex.duration} min (${ex.intensity})`);
            if (ex.notes) {
                console.log(`   💭 ${ex.notes}`);
            }
        });
    }

    getIntensityEmoji(intensity) {
        const emojis = {
            'low': '🚶',
            'moderate': '🏃',
            'high': '💨'
        };
        return emojis[intensity] || '🏃';
    }

    getStats(days = 30) {
        if (this.data.exercises.length === 0) {
            console.log('\n📭 No exercise data yet.');
            return null;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        const recentExercises = this.data.exercises
            .filter(ex => new Date(ex.timestamp) >= cutoffDate);

        if (recentExercises.length === 0) {
            console.log(`\n📭 No exercise logged in the last ${days} days.`);
            return null;
        }

        // PERFORMANCE: Single-pass statistics calculation (6+ iterations → 1)
        const uniqueDates = new Set();
        const intensityCounts = { low: 0, moderate: 0, high: 0 };
        const typeCounts = {};
        let totalMinutes = 0;

        recentExercises.forEach(ex => {
            totalMinutes += ex.duration;
            uniqueDates.add(ex.date);

            // Count intensity
            if (ex.intensity in intensityCounts) {
                intensityCounts[ex.intensity]++;
            }

            // Count exercise types
            typeCounts[ex.type] = (typeCounts[ex.type] || 0) + 1;
        });

        const avgMinutes = totalMinutes / recentExercises.length;
        const daysWithExercise = uniqueDates.size;
        const mostCommon = Object.entries(typeCounts)
            .sort(([,a], [,b]) => b - a)[0];

        const stats = {
            totalWorkouts: recentExercises.length,
            totalMinutes,
            avgMinutes,
            daysWithExercise,
            intensityCounts,
            mostCommonType: mostCommon ? mostCommon[0] : 'N/A'
        };

        console.log(`\n📊 Exercise Stats (Last ${days} Days)`);
        console.log('─'.repeat(60));
        console.log(`Total Workouts: ${stats.totalWorkouts}`);
        console.log(`Total Minutes: ${stats.totalMinutes} min`);
        console.log(`Average per Session: ${stats.avgMinutes.toFixed(1)} min`);
        console.log(`Days Active: ${stats.daysWithExercise} / ${days}`);
        console.log(`\nIntensity Breakdown:`);
        console.log(`  🚶 Low: ${intensityCounts.low}`);
        console.log(`  🏃 Moderate: ${intensityCounts.moderate}`);
        console.log(`  💨 High: ${intensityCounts.high}`);
        console.log(`\nMost Common: ${stats.mostCommonType}`);

        return stats;
    }

    getTodayMinutes() {
        const today = new Date().toISOString().split('T')[0];
        const todayExercises = this.data.exercises
            .filter(ex => ex.date === today);

        return todayExercises.reduce((sum, ex) => sum + ex.duration, 0);
    }

    getExerciseDataForDashboard(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        const recentExercises = this.data.exercises
            .filter(ex => new Date(ex.timestamp) >= cutoffDate);

        const totalMinutes = recentExercises.reduce((sum, ex) => sum + ex.duration, 0);
        const daysWithExercise = new Set(recentExercises.map(ex => ex.date)).size;
        const todayMinutes = this.getTodayMinutes();

        return {
            totalMinutes,
            avgMinutes: recentExercises.length > 0 ? totalMinutes / days : 0,
            daysActive: daysWithExercise,
            todayMinutes,
            workoutCount: recentExercises.length
        };
    }
}

// CLI Interface
if (require.main === module) {
    const tracker = new ExerciseTracker();
    const args = process.argv.slice(2);
    const command = args[0];

    switch(command) {
        case 'log':
            const type = args[1];
            const duration = args[2];
            const intensity = args[3] || 'moderate';
            const notes = args.slice(4).join(' ');
            tracker.logExercise(type, duration, intensity, notes);
            break;

        case 'history':
            const days = ValidationUtils.parseInteger(args[1], {
                min: 1,
                max: 365,
                default: 7,
                fieldName: 'days'
            });
            tracker.getHistory(days);
            break;

        case 'stats':
            const statsDays = ValidationUtils.parseInteger(args[1], {
                min: 1,
                max: 365,
                default: 30,
                fieldName: 'days'
            });
            tracker.getStats(statsDays);
            break;

        case 'today':
            const todayMinutes = tracker.getTodayMinutes();
            console.log(`\n📊 Today's Exercise: ${todayMinutes} minutes`);
            if (todayMinutes >= 30) {
                console.log('🎯 Daily goal achieved!');
            } else {
                console.log(`💪 ${30 - todayMinutes} more minutes to reach daily goal`);
            }
            break;

        case 'help':
        default:
            console.log(`
🏃 Exercise Tracker - Track Your Physical Activity

USAGE:
  node exercise-tracker.js <command> [options]

COMMANDS:
  log <type> <minutes> [intensity] [notes]
      Log an exercise session
      Intensity: low, moderate, high (default: moderate)
      Example: node exercise-tracker.js log "Running" 30 high "Morning jog"

  history [days]
      View exercise history (default: 7 days)
      Example: node exercise-tracker.js history 14

  stats [days]
      View exercise statistics (default: 30 days)
      Example: node exercise-tracker.js stats

  today
      View today's total exercise minutes
      Example: node exercise-tracker.js today

  help
      Show this help message

EXAMPLES:
  node exercise-tracker.js log "Yoga" 45 low "Evening session"
  node exercise-tracker.js log "Cycling" 60 moderate
  node exercise-tracker.js history
  node exercise-tracker.js stats
            `);
            break;
    }
}

module.exports = ExerciseTracker;
