const fs = require('fs');
const path = require('path');

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
