const fs = require('fs');
const path = require('path');
const ChartUtils = require('./chart-utils');

class MedicationTracker {
    constructor(dataFile = 'medications.json') {
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
            console.error('Error loading data:', error.message);
        }
        return {
            medications: [],
            history: []
        };
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving data:', error.message);
            return false;
        }
    }

    // Data Export
    exportToCSV(outputDir = './exports') {
        try {
            // Create exports directory if it doesn't exist
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const baseFilename = `medication-export-${timestamp}`;

            // Export medications list
            if (this.data.medications.length > 0) {
                const medsCSV = this.generateMedicationsCSV();
                fs.writeFileSync(path.join(outputDir, `${baseFilename}-medications.csv`), medsCSV);
            }

            // Export history
            if (this.data.history.length > 0) {
                const historyCSV = this.generateHistoryCSV();
                fs.writeFileSync(path.join(outputDir, `${baseFilename}-history.csv`), historyCSV);
            }

            console.log(`\n✓ Data exported successfully to ${outputDir}/`);
            console.log(`  Base filename: ${baseFilename}`);
            return true;
        } catch (error) {
            console.error('Error exporting data:', error.message);
            return false;
        }
    }

    generateMedicationsCSV() {
        const headers = 'ID,Name,Dosage,Frequency,Scheduled Time,Created,Status\n';
        const rows = this.data.medications.map(med => {
            const name = (med.name || '').replace(/"/g, '""');
            const dosage = (med.dosage || '').replace(/"/g, '""');
            const created = new Date(med.createdAt).toLocaleDateString();
            const status = med.active ? 'Active' : 'Inactive';
            return `${med.id},"${name}","${dosage}","${med.frequency}","${med.scheduledTime}","${created}","${status}"`;
        }).join('\n');
        return headers + rows;
    }

    generateHistoryCSV() {
        const headers = 'Date,Time,Medication ID,Medication Name,Dosage,Notes,Missed\n';
        const rows = this.data.history.map(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();
            const name = (entry.medicationName || '').replace(/"/g, '""');
            const dosage = (entry.dosage || '').replace(/"/g, '""');
            const notes = (entry.notes || '').replace(/"/g, '""');
            const missed = entry.missed ? 'Yes' : 'No';
            return `"${dateStr}","${timeStr}",${entry.medicationId},"${name}","${dosage}","${notes}","${missed}"`;
        }).join('\n');
        return headers + rows;
    }

    addMedication(name, dosage, frequency, time) {
        const medication = {
            id: Date.now(),
            name: name,
            dosage: dosage,
            frequency: frequency, // e.g., 'daily', 'twice-daily', 'weekly'
            scheduledTime: time, // e.g., '08:00', '20:00'
            createdAt: new Date().toISOString(),
            active: true
        };

        this.data.medications.push(medication);

        if (this.saveData()) {
            console.log(`✓ Medication added successfully!`);
            console.log(`  Name: ${name}`);
            console.log(`  Dosage: ${dosage}`);
            console.log(`  Frequency: ${frequency}`);
            console.log(`  Time: ${time}`);
            return medication;
        }
        return null;
    }

    listMedications(activeOnly = true) {
        const meds = activeOnly
            ? this.data.medications.filter(m => m.active)
            : this.data.medications;

        if (meds.length === 0) {
            console.log('No medications found.');
            return;
        }

        console.log('\n📋 Your Medications:');
        console.log('─'.repeat(60));
        meds.forEach(med => {
            console.log(`ID: ${med.id}`);
            console.log(`  Name: ${med.name}`);
            console.log(`  Dosage: ${med.dosage}`);
            console.log(`  Frequency: ${med.frequency}`);
            console.log(`  Time: ${med.scheduledTime}`);
            console.log(`  Status: ${med.active ? 'Active' : 'Inactive'}`);
            console.log('─'.repeat(60));
        });
    }

    markAsTaken(medicationId, notes = '') {
        const medication = this.data.medications.find(m => m.id === parseInt(medicationId));

        if (!medication) {
            console.log('❌ Medication not found!');
            return false;
        }

        const record = {
            medicationId: medication.id,
            medicationName: medication.name,
            dosage: medication.dosage,
            takenAt: new Date().toISOString(),
            notes: notes
        };

        this.data.history.push(record);

        if (this.saveData()) {
            console.log(`✓ Marked "${medication.name}" as taken!`);
            console.log(`  Time: ${new Date().toLocaleString()}`);
            if (notes) console.log(`  Notes: ${notes}`);
            return true;
        }
        return false;
    }

    checkTodayStatus() {
        const today = new Date().toDateString();
        const activeMeds = this.data.medications.filter(m => m.active);

        console.log(`\n📅 Medication Status for ${today}`);
        console.log('═'.repeat(60));

        if (activeMeds.length === 0) {
            console.log('No active medications.');
            return;
        }

        activeMeds.forEach(med => {
            const takenToday = this.data.history.filter(record => {
                const recordDate = new Date(record.takenAt).toDateString();
                return record.medicationId === med.id && recordDate === today;
            });

            const status = takenToday.length > 0 ? '✓ TAKEN' : '⚠ NOT TAKEN';
            const color = takenToday.length > 0 ? '' : '';

            console.log(`\n${med.name} (${med.dosage})`);
            console.log(`  Scheduled: ${med.scheduledTime}`);
            console.log(`  Status: ${status}`);

            if (takenToday.length > 0) {
                takenToday.forEach(record => {
                    const time = new Date(record.takenAt).toLocaleTimeString();
                    console.log(`    → Taken at ${time}`);
                    if (record.notes) console.log(`      Notes: ${record.notes}`);
                });
            }
        });
        console.log('═'.repeat(60));
    }

    getHistory(medicationId = null, days = 7) {
        const now = new Date();
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

        let history = this.data.history.filter(record => {
            const recordDate = new Date(record.takenAt);
            return recordDate >= startDate;
        });

        if (medicationId) {
            history = history.filter(r => r.medicationId === parseInt(medicationId));
        }

        if (history.length === 0) {
            console.log(`No history found for the last ${days} days.`);
            return;
        }

        console.log(`\n📊 Medication History (Last ${days} days):`);
        console.log('═'.repeat(60));

        history.forEach(record => {
            const date = new Date(record.takenAt).toLocaleString();
            console.log(`${record.medicationName} (${record.dosage})`);
            console.log(`  Taken: ${date}`);
            if (record.notes) console.log(`  Notes: ${record.notes}`);
            console.log('─'.repeat(60));
        });
    }

    removeMedication(medicationId) {
        const index = this.data.medications.findIndex(m => m.id === parseInt(medicationId));

        if (index === -1) {
            console.log('❌ Medication not found!');
            return false;
        }

        const med = this.data.medications[index];
        med.active = false;

        if (this.saveData()) {
            console.log(`✓ Medication "${med.name}" has been deactivated.`);
            return true;
        }
        return false;
    }

    // Adherence Visualization
    visualizeAdherence(days = 30) {
        console.log('\n📊 Medication Adherence Visualization');
        console.log('═'.repeat(60));

        if (this.data.medications.length === 0) {
            console.log('No medications added yet. Add medications to track adherence.');
            return;
        }

        if (this.data.history.length === 0) {
            console.log('No medication history yet. Start taking your medications to track adherence.');
            return;
        }

        // Get data for the specified period
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentHistory = this.data.history
            .filter(entry => new Date(entry.timestamp) >= cutoffDate)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (recentHistory.length === 0) {
            console.log(`No medication history in the last ${days} days.`);
            return;
        }

        // Calculate overall adherence
        const totalDoses = recentHistory.length;
        const takenDoses = recentHistory.filter(h => !h.missed).length;
        const missedDoses = recentHistory.filter(h => h.missed).length;
        const adherenceRate = ((takenDoses / totalDoses) * 100).toFixed(1);

        console.log('\n🎯 Overall Adherence:');
        console.log(ChartUtils.progressBar(takenDoses, totalDoses, {
            width: 40
        }));
        console.log(`   ${ChartUtils.percentageWheel(adherenceRate, 'Adherence Rate')}`);

        // Adherence by medication
        console.log('\n💊 Adherence by Medication:');
        console.log('═'.repeat(60));

        const medStats = {};
        recentHistory.forEach(entry => {
            const medId = entry.medicationId;
            if (!medStats[medId]) {
                const med = this.data.medications.find(m => m.id === medId);
                medStats[medId] = {
                    name: med ? med.name : 'Unknown',
                    taken: 0,
                    missed: 0
                };
            }

            if (entry.missed) {
                medStats[medId].missed++;
            } else {
                medStats[medId].taken++;
            }
        });

        const chartData = Object.entries(medStats)
            .map(([id, stats]) => ({
                label: stats.name,
                value: parseFloat(((stats.taken / (stats.taken + stats.missed)) * 100).toFixed(1))
            }))
            .sort((a, b) => b.value - a.value);

        console.log(ChartUtils.barChart(chartData, {
            title: 'Medication Adherence Rates',
            width: 30,
            showPercentage: true
        }));

        // Calendar heatmap for adherence
        const dailyAdherence = new Map();
        recentHistory.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            if (!dailyAdherence.has(date)) {
                dailyAdherence.set(date, { taken: 0, total: 0 });
            }

            const day = dailyAdherence.get(date);
            day.total++;
            if (!entry.missed) {
                day.taken++;
            }
        });

        const heatmapData = Array.from(dailyAdherence.entries()).map(([date, counts]) => ({
            date: date,
            value: counts.taken
        }));

        console.log(ChartUtils.calendarHeatmap(heatmapData, {
            title: '\n📅 Daily Medication Activity',
            days: Math.min(days, 28)
        }));

        // Calculate streak
        const streak = this.calculateAdherenceStreak();

        // Statistics box
        console.log(ChartUtils.statsBox({
            'Total Doses': totalDoses,
            'Doses Taken': `${takenDoses} ✓`,
            'Doses Missed': `${missedDoses} ✗`,
            'Adherence Rate': `${adherenceRate}%`,
            'Current Streak': `${streak} days`,
            'Active Medications': this.data.medications.filter(m => m.active).length
        }, `📊 Adherence Summary (${days} days)`));

        // Show streak
        if (streak > 0) {
            console.log(ChartUtils.streakDisplay(streak, this.getLongestAdherenceStreak()));
        }

        // Adherence trend
        this.showAdherenceTrend(days);
    }

    // Show adherence trend over time
    showAdherenceTrend(days) {
        console.log('\n📈 Adherence Trend:');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentHistory = this.data.history
            .filter(entry => new Date(entry.timestamp) >= cutoffDate)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Group by week
        const weeklyData = new Map();

        recentHistory.forEach(entry => {
            const date = new Date(entry.timestamp);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toLocaleDateString();

            if (!weeklyData.has(weekKey)) {
                weeklyData.set(weekKey, { taken: 0, total: 0 });
            }

            const week = weeklyData.get(weekKey);
            week.total++;
            if (!entry.missed) {
                week.taken++;
            }
        });

        const chartData = Array.from(weeklyData.entries()).map(([week, counts]) => ({
            label: week,
            value: parseFloat(((counts.taken / counts.total) * 100).toFixed(1))
        }));

        if (chartData.length > 1) {
            console.log(ChartUtils.lineChart(chartData, {
                title: 'Weekly Adherence Rate (%)',
                height: 8,
                min: 0,
                max: 100,
                showValues: false
            }));

            console.log(`Sparkline: ${ChartUtils.sparkline(chartData.map(d => d.value))}`);
        }
    }

    // Calculate current adherence streak (consecutive days with all doses taken)
    calculateAdherenceStreak() {
        if (this.data.history.length === 0) return 0;

        // Group by day
        const dailyData = new Map();

        this.data.history.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            if (!dailyData.has(date)) {
                dailyData.set(date, { taken: 0, missed: 0 });
            }

            const day = dailyData.get(date);
            if (entry.missed) {
                day.missed++;
            } else {
                day.taken++;
            }
        });

        // Sort dates
        const sortedDates = Array.from(dailyData.keys())
            .map(d => new Date(d))
            .sort((a, b) => b - a); // Most recent first

        let streak = 0;
        const today = new Date().toDateString();

        for (const date of sortedDates) {
            const dateStr = date.toDateString();
            const day = dailyData.get(dateStr);

            // Check if this is today or consecutive
            if (streak === 0 && dateStr !== today) {
                // Not starting from today, check if we should start from yesterday
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (dateStr !== yesterday.toDateString()) {
                    break; // Streak broken
                }
            }

            // Perfect day (no missed doses)
            if (day.taken > 0 && day.missed === 0) {
                streak++;
            } else if (day.missed > 0) {
                break; // Streak broken
            }
        }

        return streak;
    }

    // Get longest adherence streak
    getLongestAdherenceStreak() {
        if (this.data.history.length === 0) return 0;

        const dailyData = new Map();

        this.data.history.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            if (!dailyData.has(date)) {
                dailyData.set(date, { taken: 0, missed: 0 });
            }

            const day = dailyData.get(date);
            if (entry.missed) {
                day.missed++;
            } else {
                day.taken++;
            }
        });

        const sortedDates = Array.from(dailyData.keys())
            .map(d => new Date(d))
            .sort((a, b) => a - b);

        let maxStreak = 0;
        let currentStreak = 0;

        sortedDates.forEach(date => {
            const dateStr = date.toDateString();
            const day = dailyData.get(dateStr);

            if (day.taken > 0 && day.missed === 0) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else if (day.missed > 0) {
                currentStreak = 0;
            }
        });

        return maxStreak;
    }
}

// CLI Interface
function showHelp() {
    console.log(`
🏥 Medication Tracker - Help
═══════════════════════════════════════════════════════════

Usage: node medication-tracker.js <command> [options]

Commands:
  add <name> <dosage> <frequency> <time>
      Add a new medication
      Example: node medication-tracker.js add "Aspirin" "100mg" "daily" "08:00"

  list
      List all active medications

  take <id> [notes]
      Mark a medication as taken
      Example: node medication-tracker.js take 1234567890 "taken with food"

  status
      Check today's medication status

  history [medicationId] [days]
      View medication history
      Example: node medication-tracker.js history 1234567890 7

  remove <id>
      Deactivate a medication

  adherence [days]
      Visualize medication adherence with charts (default: 30 days)

  export [directory]
      Export all data to CSV files (default: ./exports)
      Creates separate CSV files for medications and history
      Perfect for sharing with healthcare providers or backup

  help
      Show this help message

═══════════════════════════════════════════════════════════
`);
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const tracker = new MedicationTracker();

    switch(command) {
        case 'add':
            if (args.length < 5) {
                console.log('❌ Usage: add <name> <dosage> <frequency> <time>');
                break;
            }
            tracker.addMedication(args[1], args[2], args[3], args[4]);
            break;

        case 'list':
            tracker.listMedications();
            break;

        case 'take':
            if (args.length < 2) {
                console.log('❌ Usage: take <medication-id> [notes]');
                break;
            }
            const notes = args.slice(2).join(' ');
            tracker.markAsTaken(args[1], notes);
            break;

        case 'status':
            tracker.checkTodayStatus();
            break;

        case 'history':
            const medId = args[1] || null;
            const days = args[2] || 7;
            tracker.getHistory(medId, parseInt(days));
            break;

        case 'remove':
            if (args.length < 2) {
                console.log('❌ Usage: remove <medication-id>');
                break;
            }
            tracker.removeMedication(args[1]);
            break;

        case 'adherence':
            const adherenceDays = args[1] ? parseInt(args[1]) : 30;
            tracker.visualizeAdherence(adherenceDays);
            break;

        case 'export':
            const exportDir = args[1] || './exports';
            tracker.exportToCSV(exportDir);
            break;

        case 'help':
        default:
            showHelp();
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = MedicationTracker;
