const fs = require('fs');
const path = require('path');

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
        // Validate inputs
        if (!type || type.trim() === '') {
            console.error('❌ Error: Exercise type is required');
            return false;
        }

        const durationNum = parseFloat(duration);
        if (isNaN(durationNum) || durationNum <= 0) {
            console.error('❌ Error: Duration must be a positive number (in minutes)');
            return false;
        }

        const validIntensities = ['low', 'moderate', 'high'];
        const intensityLower = intensity.toLowerCase();
        if (!validIntensities.includes(intensityLower)) {
            console.error('❌ Error: Intensity must be low, moderate, or high');
            return false;
        }

        const exercise = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            type: type.trim(),
            duration: durationNum,
            intensity: intensityLower,
            notes: notes.trim()
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

        const totalMinutes = recentExercises.reduce((sum, ex) => sum + ex.duration, 0);
        const avgMinutes = totalMinutes / recentExercises.length;
        const daysWithExercise = new Set(recentExercises.map(ex => ex.date)).size;

        // Count by intensity
        const intensityCounts = {
            low: recentExercises.filter(ex => ex.intensity === 'low').length,
            moderate: recentExercises.filter(ex => ex.intensity === 'moderate').length,
            high: recentExercises.filter(ex => ex.intensity === 'high').length
        };

        // Most common exercise type
        const typeCounts = {};
        recentExercises.forEach(ex => {
            typeCounts[ex.type] = (typeCounts[ex.type] || 0) + 1;
        });
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

    // Backup and Restore
    createBackup(backupDir = './backups') {
        try {
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            if (!fs.existsSync(this.dataFile)) {
                console.log('\n⚠️  No data file found to backup.');
                return false;
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const backupFilename = `exercise-backup-${timestamp}.json`;
            const backupPath = path.join(backupDir, backupFilename);

            const data = fs.readFileSync(this.dataFile);
            fs.writeFileSync(backupPath, data);

            console.log(`\n✓ Backup created successfully!`);
            console.log(`  Location: ${backupPath}`);
            console.log(`  Time: ${new Date().toLocaleString()}`);
            return true;
        } catch (error) {
            console.error('Error creating backup:', error.message);
            return false;
        }
    }

    listBackups(backupDir = './backups') {
        try {
            if (!fs.existsSync(backupDir)) {
                console.log('\n📁 No backups directory found.');
                return;
            }

            const files = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('exercise-backup-') && f.endsWith('.json'))
                .sort()
                .reverse();

            if (files.length === 0) {
                console.log('\n📁 No backups found.');
                return;
            }

            console.log('\n📁 Available Exercise Backups:');
            console.log('═'.repeat(60));
            files.forEach((file, index) => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                const size = (stats.size / 1024).toFixed(2);
                const date = stats.mtime.toLocaleString();
                console.log(`${index + 1}. ${file}`);
                console.log(`   Created: ${date}`);
                console.log(`   Size: ${size} KB`);
            });
        } catch (error) {
            console.error('Error listing backups:', error.message);
        }
    }

    restoreFromBackup(backupFile, backupDir = './backups') {
        try {
            const backupPath = path.join(backupDir, backupFile);

            if (!fs.existsSync(backupPath)) {
                console.log('\n❌ Backup file not found.');
                return false;
            }

            // Safety backup of current data
            if (fs.existsSync(this.dataFile)) {
                const preRestoreBackup = `exercise-pre-restore-${Date.now()}.json`;
                fs.copyFileSync(this.dataFile, path.join(backupDir, preRestoreBackup));
                console.log(`\n💾 Current data backed up to: ${preRestoreBackup}`);
            }

            const backupData = fs.readFileSync(backupPath);
            fs.writeFileSync(this.dataFile, backupData);
            this.data = this.loadData();

            console.log(`\n✓ Data restored successfully from backup!`);
            console.log(`  Source: ${backupFile}`);
            console.log(`  Time: ${new Date().toLocaleString()}`);
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error.message);
            return false;
        }
    }

    // Data Export
    exportToCSV(outputDir = './exports') {
        try {
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `exercise-export-${timestamp}.csv`;

            if (this.data.exercises.length === 0) {
                console.log('\n⚠️  No exercise data to export.');
                return false;
            }

            const csvContent = this.generateExerciseCSV();
            fs.writeFileSync(path.join(outputDir, filename), csvContent);

            console.log(`\n✓ Exercise data exported successfully!`);
            console.log(`  Location: ${outputDir}/${filename}`);
            console.log(`  Entries: ${this.data.exercises.length}`);
            return true;
        } catch (error) {
            console.error('Error exporting data:', error.message);
            return false;
        }
    }

    generateExerciseCSV() {
        const headers = 'Date,Type,Duration (minutes),Intensity,Notes,Timestamp\n';
        const rows = this.data.exercises.map(ex => {
            const type = (ex.type || '').replace(/"/g, '""');
            const notes = (ex.notes || '').replace(/"/g, '""');
            const date = ex.date || new Date(ex.timestamp).toISOString().split('T')[0];
            return `"${date}","${type}",${ex.duration},"${ex.intensity}","${notes}","${ex.timestamp}"`;
        }).join('\n');
        return headers + rows;
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
            const days = args[1] ? parseInt(args[1]) : 7;
            tracker.getHistory(days);
            break;

        case 'stats':
            const statsDays = args[1] ? parseInt(args[1]) : 30;
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

        case 'backup':
            tracker.createBackup();
            break;

        case 'list-backups':
            tracker.listBackups();
            break;

        case 'restore':
            const backupFile = args[1];
            if (!backupFile) {
                console.log('\n❌ Error: Please specify a backup file to restore.');
                console.log('Usage: node exercise-tracker.js restore <backup-filename>');
                console.log('Use "list-backups" to see available backups.');
            } else {
                tracker.restoreFromBackup(backupFile);
            }
            break;

        case 'export':
        case 'export-csv':
            tracker.exportToCSV();
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

  backup
      Create a backup of your exercise data
      Example: node exercise-tracker.js backup

  list-backups
      List all available backups
      Example: node exercise-tracker.js list-backups

  restore <backup-filename>
      Restore data from a backup
      Example: node exercise-tracker.js restore exercise-backup-2024-11-19T10-30-00.json

  export / export-csv
      Export exercise data to CSV format
      Example: node exercise-tracker.js export

  help
      Show this help message

EXAMPLES:
  node exercise-tracker.js log "Yoga" 45 low "Evening session"
  node exercise-tracker.js log "Cycling" 60 moderate
  node exercise-tracker.js history
  node exercise-tracker.js stats
  node exercise-tracker.js backup
  node exercise-tracker.js export
            `);
            break;
    }
}

module.exports = ExerciseTracker;
