const fs = require('fs');
const path = require('path');
const ChartUtils = require('./chart-utils');
const PDFDocument = require('pdfkit');
const ReminderService = require('./reminder-service');
const ValidationUtils = require('./validation-utils');

class MedicationTracker {
    constructor(dataFile = 'medications.json') {
        this.dataFile = dataFile;
        this.data = this.loadData();
        this.reminderService = new ReminderService();
        this.interactions = this.loadInteractions();
        this.idCounter = Date.now();
    }

    generateId() {
        return ++this.idCounter;
    }

    loadInteractions() {
        try {
            const interactionsFile = path.join(__dirname, 'medication-interactions.json');
            if (fs.existsSync(interactionsFile)) {
                const rawData = fs.readFileSync(interactionsFile, 'utf8');
                return JSON.parse(rawData).interactions;
            }
        } catch (error) {
            console.error('Warning: Could not load medication interactions database:', error.message);
        }
        return [];
    }

    normalizeDrugName(name) {
        // Normalize drug name for matching (remove common form suffixes, convert to lowercase)
        return name.toLowerCase()
            .replace(/\s*\d+\s*(mg|mcg|g|ml|iu|units?)\s*/gi, ' ') // Remove dosages
            .replace(/\s+(tablet|capsule|pill|cream|ointment|syrup|solution)s?$/i, '') // Remove forms
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
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

    // Statistics Summary
    showStats() {
        const totalMeds = this.data.medications.length;
        const activeMeds = this.data.medications.filter(m => m.active).length;
        const inactiveMeds = totalMeds - activeMeds;
        const totalHistory = this.data.history.length;

        // Calculate overall adherence
        let adherenceRate = 0;
        let currentStreak = 0;
        if (totalHistory > 0) {
            const takenDoses = this.data.history.filter(h => !h.missed).length;
            adherenceRate = ((takenDoses / totalHistory) * 100).toFixed(1);
            currentStreak = this.calculateAdherenceStreak();
        }

        // Calculate days tracking
        let daysTracking = 0;
        if (totalHistory > 0) {
            const firstEntry = new Date(this.data.history[0].timestamp);
            daysTracking = Math.ceil((new Date() - firstEntry) / (1000 * 60 * 60 * 24));
        }

        console.log('\n📊 Medication Tracker - Statistics Summary');
        console.log('═'.repeat(60));
        console.log(`\n📅 Tracking Duration: ${daysTracking} days`);

        console.log('\n💊 Medications:');
        console.log(`   Active: ${activeMeds}`);
        console.log(`   Inactive: ${inactiveMeds}`);
        console.log(`   Total: ${totalMeds}`);

        console.log('\n📈 Adherence:');
        console.log(`   Total doses logged: ${totalHistory}`);
        if (totalHistory > 0) {
            console.log(`   Overall adherence rate: ${adherenceRate}%`);
            console.log(`   Current streak: ${currentStreak} days`);
        }

        if (activeMeds > 0) {
            console.log('\n🕐 Today\'s Schedule:');
            const today = new Date().toDateString();
            const activeMedsList = this.data.medications.filter(m => m.active);
            activeMedsList.forEach(med => {
                const takenToday = this.data.history.some(h =>
                    h.medicationId === med.id &&
                    new Date(h.timestamp).toDateString() === today
                );
                const status = takenToday ? '✓' : '○';
                console.log(`   ${status} ${med.name} - ${med.dosage} at ${med.scheduledTime}`);
            });
        }

        console.log('\n═'.repeat(60));
    }

    // Medication Interaction Checking
    checkInteractions(newMedName = null, displayWarnings = true) {
        const activeMeds = this.data.medications.filter(m => m.active);
        const foundInteractions = [];

        // If checking for a new medication, include it in the check
        const medsToCheck = newMedName
            ? [...activeMeds.map(m => m.name), newMedName]
            : activeMeds.map(m => m.name);

        // PERFORMANCE: Build interaction lookup Map for O(1) access instead of O(n) find()
        // This reduces overall complexity from O(n³) to O(n²)
        const interactionMap = new Map();
        this.interactions.forEach(inter => {
            const drug1 = this.normalizeDrugName(inter.drug1);
            const drug2 = this.normalizeDrugName(inter.drug2);

            // Store both directions for bidirectional lookup
            const key1 = `${drug1}::${drug2}`;
            const key2 = `${drug2}::${drug1}`;
            interactionMap.set(key1, inter);
            interactionMap.set(key2, inter);
        });

        // Check all pairs of medications
        for (let i = 0; i < medsToCheck.length; i++) {
            for (let j = i + 1; j < medsToCheck.length; j++) {
                const med1 = this.normalizeDrugName(medsToCheck[i]);
                const med2 = this.normalizeDrugName(medsToCheck[j]);

                // PERFORMANCE: O(1) Map lookup instead of O(n) find()
                const lookupKey = `${med1}::${med2}`;
                const interaction = interactionMap.get(lookupKey);

                if (interaction) {
                    foundInteractions.push({
                        med1: medsToCheck[i],
                        med2: medsToCheck[j],
                        interaction: interaction
                    });
                }
            }
        }

        if (displayWarnings && foundInteractions.length > 0) {
            console.log('\n⚠️  MEDICATION INTERACTION WARNINGS');
            console.log('═'.repeat(70));
            foundInteractions.forEach((found, index) => {
                const { med1, med2, interaction } = found;
                const severityIcon = {
                    'SEVERE': '🔴',
                    'MODERATE': '🟡',
                    'MINOR': '🟢'
                };

                console.log(`\n${index + 1}. ${severityIcon[interaction.severity]} ${interaction.severity} - ${med1} + ${med2}`);
                console.log(`   ${interaction.description}`);
                console.log(`   💡 ${interaction.recommendation}`);
            });
            console.log('\n' + '═'.repeat(70));
            console.log('⚕️  Always consult your doctor or pharmacist about drug interactions.');
            console.log('═'.repeat(70));
        }

        return foundInteractions;
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
            const backupFilename = `medication-backup-${timestamp}.json`;
            const backupPath = path.join(backupDir, backupFilename);

            const data = fs.readFileSync(this.dataFile);
            fs.writeFileSync(backupPath, data);

            console.log('\n✓ Backup created successfully!');
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
                .filter(f => f.startsWith('medication-backup-') && f.endsWith('.json'))
                .sort()
                .reverse();

            if (files.length === 0) {
                console.log('\n📁 No backups found.');
                return;
            }

            console.log('\n📁 Available Backups:');
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

            if (fs.existsSync(this.dataFile)) {
                const preRestoreBackup = `medication-pre-restore-${Date.now()}.json`;
                fs.copyFileSync(this.dataFile, path.join(backupDir, preRestoreBackup));
                console.log(`\n💾 Current data backed up to: ${preRestoreBackup}`);
            }

            const backupData = fs.readFileSync(backupPath);
            fs.writeFileSync(this.dataFile, backupData);
            this.data = this.loadData();

            console.log('\n✓ Data restored successfully from backup!');
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

    // PDF Export with Charts
    exportToPDF(outputDir = './exports') {
        return new Promise((resolve, reject) => {
            try {
                // Create exports directory if it doesn't exist
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const filename = `medication-report-${timestamp}.pdf`;
                const filepath = path.join(outputDir, filename);

                // Create PDF document
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Header
                doc.fontSize(24).fillColor('#2c3e50').text('Medication Tracker Report', { align: 'center' });
                doc.moveDown(0.5);
                doc.fontSize(12).fillColor('#7f8c8d').text(new Date().toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                }), { align: 'center' });
                doc.moveDown(2);

                // Summary Statistics
                this.addMedicationSummary(doc);
                doc.moveDown(1.5);

                // Active Medications
                if (this.data.medications.filter(m => m.active).length > 0) {
                    this.addActiveMedicationsSection(doc);
                    doc.moveDown(1.5);
                }

                // Adherence Chart
                if (this.data.history.length > 0) {
                    this.addAdherenceChart(doc);
                    doc.moveDown(1.5);
                }

                // Today's Schedule
                this.addTodaySchedule(doc);
                doc.moveDown(1.5);

                // Recent History
                if (this.data.history.length > 0) {
                    this.addRecentHistory(doc);
                }

                // Footer
                doc.fontSize(8).fillColor('#95a5a6').text(
                    'Generated by StepSync Medication Tracker',
                    50,
                    doc.page.height - 50,
                    { align: 'center' }
                );

                doc.end();

                stream.on('finish', () => {
                    console.log('\n✓ PDF report generated successfully!');
                    console.log(`  Location: ${filepath}`);
                    resolve(filepath);
                });

                stream.on('error', (error) => {
                    console.error('Error writing PDF:', error.message);
                    reject(error);
                });

            } catch (error) {
                console.error('Error generating PDF:', error.message);
                reject(error);
            }
        });
    }

    addMedicationSummary(doc) {
        doc.fontSize(16).fillColor('#34495e').text('📊 Summary');
        doc.moveDown(0.5);

        const totalMeds = this.data.medications.length;
        const activeMeds = this.data.medications.filter(m => m.active).length;
        const totalHistory = this.data.history.length;

        let adherenceRate = 0;
        let currentStreak = 0;
        if (totalHistory > 0) {
            const takenDoses = this.data.history.filter(h => !h.missed).length;
            adherenceRate = ((takenDoses / totalHistory) * 100).toFixed(1);
            currentStreak = this.calculateAdherenceStreak();
        }

        doc.fontSize(11).fillColor('#2c3e50');
        doc.text(`Total Medications: ${totalMeds}`, { indent: 20 });
        doc.text(`Active Medications: ${activeMeds}`, { indent: 20 });
        doc.text(`Total Doses Tracked: ${totalHistory}`, { indent: 20 });
        doc.text(`Adherence Rate: ${adherenceRate}%`, { indent: 20 });
        doc.text(`Current Streak: ${currentStreak} days`, { indent: 20 });
    }

    addActiveMedicationsSection(doc) {
        doc.fontSize(16).fillColor('#34495e').text('💊 Active Medications');
        doc.moveDown(0.5);

        const activeMeds = this.data.medications.filter(m => m.active);

        activeMeds.forEach((med, index) => {
            doc.fontSize(11).fillColor('#2c3e50').text(`${index + 1}. ${med.name}`, { indent: 20 });
            doc.fontSize(10).fillColor('#7f8c8d').text(`   Dosage: ${med.dosage}`, { indent: 40 });
            doc.text(`   Frequency: ${med.frequency}`, { indent: 40 });
            doc.text(`   Scheduled Time: ${med.scheduledTime}`, { indent: 40 });
            if (index < activeMeds.length - 1) doc.moveDown(0.5);
        });
    }

    addAdherenceChart(doc) {
        doc.fontSize(16).fillColor('#34495e').text('📈 Adherence Overview (Last 30 Days)');
        doc.moveDown(0.5);

        // Get last 30 days of history
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const recentHistory = this.data.history
            .filter(h => new Date(h.timestamp) >= thirtyDaysAgo)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (recentHistory.length === 0) {
            doc.fontSize(11).fillColor('#7f8c8d').text('No data in the last 30 days', { indent: 20 });
            return;
        }

        // Calculate daily adherence
        const dailyAdherence = {};
        recentHistory.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            if (!dailyAdherence[date]) {
                dailyAdherence[date] = { taken: 0, missed: 0 };
            }
            if (entry.missed) {
                dailyAdherence[date].missed++;
            } else {
                dailyAdherence[date].taken++;
            }
        });

        // Draw pie chart
        const centerX = 300;
        const centerY = doc.y + 80;
        const radius = 60;

        const totalTaken = recentHistory.filter(h => !h.missed).length;
        const totalMissed = recentHistory.filter(h => h.missed).length;
        const total = totalTaken + totalMissed;

        // Taken slice (green)
        if (totalTaken > 0) {
            const takenAngle = (totalTaken / total) * 360;
            doc.fillColor('#27ae60').moveTo(centerX, centerY)
                .arc(centerX, centerY, radius, 0, takenAngle, false)
                .fill();
        }

        // Missed slice (red)
        if (totalMissed > 0) {
            const takenAngle = (totalTaken / total) * 360;
            const missedAngle = (totalMissed / total) * 360;
            doc.fillColor('#e74c3c').moveTo(centerX, centerY)
                .arc(centerX, centerY, radius, takenAngle, takenAngle + missedAngle, false)
                .fill();
        }

        // Legend
        doc.fontSize(10).fillColor('#27ae60');
        doc.text(`✓ Taken: ${totalTaken} (${((totalTaken/total)*100).toFixed(1)}%)`, centerX - radius - 100, centerY + radius + 20);
        doc.fillColor('#e74c3c');
        doc.text(`✗ Missed: ${totalMissed} (${((totalMissed/total)*100).toFixed(1)}%)`, centerX + 50, centerY + radius + 20);

        doc.y = centerY + radius + 50;
    }

    addTodaySchedule(doc) {
        doc.fontSize(16).fillColor('#34495e').text('📅 Today\'s Schedule');
        doc.moveDown(0.5);

        const activeMeds = this.data.medications.filter(m => m.active);

        if (activeMeds.length === 0) {
            doc.fontSize(11).fillColor('#7f8c8d').text('No active medications', { indent: 20 });
            return;
        }

        // Sort by scheduled time
        const sorted = activeMeds.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

        sorted.forEach((med, index) => {
            doc.fontSize(11).fillColor('#2c3e50').text(
                `${med.scheduledTime} - ${med.name} (${med.dosage})`,
                { indent: 20 }
            );
            if (index < sorted.length - 1) doc.moveDown(0.3);
        });
    }

    addRecentHistory(doc) {
        doc.fontSize(16).fillColor('#34495e').text('📝 Recent History (Last 10 Entries)');
        doc.moveDown(0.5);

        const recent = this.data.history
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        recent.forEach((entry, index) => {
            const date = new Date(entry.timestamp).toLocaleString();
            const status = entry.missed ? '✗ Missed' : '✓ Taken';
            const statusColor = entry.missed ? '#e74c3c' : '#27ae60';

            doc.fontSize(10).fillColor('#2c3e50').text(
                `${date} - ${entry.medicationName}`,
                { indent: 20 }
            );
            doc.fillColor(statusColor).text(status, { indent: 40 });
            if (entry.notes) {
                doc.fontSize(9).fillColor('#7f8c8d').text(`   Note: ${entry.notes}`, { indent: 40 });
            }
            if (index < recent.length - 1) doc.moveDown(0.3);
        });
    }

    addMedication(name, dosage, frequency, time) {
        // Check for interactions with current medications BEFORE adding
        const interactions = this.checkInteractions(name, false); // Don't display yet

        const medication = {
            id: this.generateId(),
            name: name,
            dosage: dosage,
            frequency: frequency, // e.g., 'daily', 'twice-daily', 'weekly'
            scheduledTime: time, // e.g., '08:00', '20:00'
            createdAt: new Date().toISOString(),
            active: true
        };

        this.data.medications.push(medication);

        if (this.saveData()) {
            console.log('✓ Medication added successfully!');
            console.log(`  Name: ${name}`);
            console.log(`  Dosage: ${dosage}`);
            console.log(`  Frequency: ${frequency}`);
            console.log(`  Time: ${time}`);

            // Now display interaction warnings if any were found
            if (interactions.length > 0) {
                console.log('');
                interactions.forEach((found, index) => {
                    const { med1, med2, interaction } = found;
                    const severityIcon = {
                        'SEVERE': '🔴',
                        'MODERATE': '🟡',
                        'MINOR': '🟢'
                    };

                    console.log(`${severityIcon[interaction.severity]} ${interaction.severity} INTERACTION WARNING:`);
                    console.log(`   ${med1} + ${med2}`);
                    console.log(`   ${interaction.description}`);
                    console.log(`   💡 ${interaction.recommendation}`);
                    if (index < interactions.length - 1) console.log('');
                });
                console.log('\n⚕️  Please consult your doctor or pharmacist about these interactions.');
            }

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

        // Auto-update pill count if refill tracking is enabled
        if (medication.pillCount !== undefined && medication.pillsPerDose) {
            this.updatePillCount(medication.id, -medication.pillsPerDose);
        }

        if (this.saveData()) {
            console.log(`✓ Marked "${medication.name}" as taken!`);
            console.log(`  Time: ${new Date().toLocaleString()}`);
            if (notes) console.log(`  Notes: ${notes}`);

            // Show refill alert if needed
            if (medication.pillCount !== undefined) {
                const updated = this.data.medications.find(m => m.id === medication.id);
                this.checkRefillAlert(updated);
            }

            return true;
        }
        return false;
    }

    // ==================== REFILL TRACKING SYSTEM ====================

    setRefillInfo(medicationId, pillCount, pillsPerDose = 1, refillThreshold = 7) {
        // Validate medication ID
        const medId = ValidationUtils.parseInteger(medicationId, {
            min: 1,
            fieldName: 'medication ID'
        });

        if (medId === null) {
            return false;
        }

        const medication = this.data.medications.find(m => m.id === medId);

        if (!medication) {
            console.log('❌ Medication not found!');
            return false;
        }

        // Validate pill count
        const validatedPillCount = ValidationUtils.parseInteger(pillCount, {
            min: 0,
            max: 10000,
            fieldName: 'pill count'
        });

        // Validate pills per dose
        const validatedPillsPerDose = ValidationUtils.parseInteger(pillsPerDose, {
            min: 1,
            max: 100,
            default: 1,
            fieldName: 'pills per dose'
        });

        // Validate refill threshold
        const validatedRefillThreshold = ValidationUtils.parseInteger(refillThreshold, {
            min: 1,
            max: 365,
            default: 7,
            fieldName: 'refill threshold'
        });

        if (validatedPillCount === null || validatedPillsPerDose === null || validatedRefillThreshold === null) {
            return false;
        }

        medication.pillCount = validatedPillCount;
        medication.pillsPerDose = validatedPillsPerDose;
        medication.refillThreshold = validatedRefillThreshold; // Days of supply threshold

        if (this.saveData()) {
            console.log(`✅ Refill tracking enabled for "${medication.name}"`);
            console.log(`   💊 Current pills: ${medication.pillCount}`);
            console.log(`   📊 Pills per dose: ${medication.pillsPerDose}`);
            console.log(`   ⚠️  Refill alert when ≤ ${medication.refillThreshold} days remaining`);

            const daysRemaining = this.calculateDaysRemaining(medication);
            if (daysRemaining !== null) {
                console.log(`   📅 Days remaining: ${daysRemaining}`);
                this.checkRefillAlert(medication);
            }

            return true;
        }
        return false;
    }

    updatePillCount(medicationId, change) {
        const medication = this.data.medications.find(m => m.id === parseInt(medicationId));

        if (!medication) {
            return false;
        }

        if (medication.pillCount === undefined) {
            return false; // Refill tracking not enabled
        }

        medication.pillCount = Math.max(0, medication.pillCount + change);
        return this.saveData();
    }

    calculateDaysRemaining(medication) {
        if (medication.pillCount === undefined || !medication.pillsPerDose) {
            return null;
        }

        // Calculate daily dose based on frequency
        let dosesPerDay = 1;
        if (medication.frequency === 'twice-daily') dosesPerDay = 2;
        else if (medication.frequency === 'three-times-daily') dosesPerDay = 3;
        else if (medication.frequency === 'four-times-daily') dosesPerDay = 4;
        else if (medication.frequency === 'weekly') dosesPerDay = 1/7;
        else if (medication.frequency === 'every-other-day') dosesPerDay = 0.5;

        const pillsPerDay = dosesPerDay * medication.pillsPerDose;
        const daysRemaining = Math.floor(medication.pillCount / pillsPerDay);

        return daysRemaining;
    }

    checkRefillAlert(medication) {
        const daysRemaining = this.calculateDaysRemaining(medication);

        if (daysRemaining === null) {
            return false;
        }

        const threshold = medication.refillThreshold || 7;

        if (daysRemaining === 0) {
            console.log(`\n🔴 CRITICAL: "${medication.name}" is OUT OF PILLS!`);
            console.log('   ⚕️  Refill immediately!');
            return true;
        } else if (daysRemaining <= threshold) {
            console.log(`\n🟡 REFILL REMINDER: "${medication.name}"`);
            console.log(`   💊 ${medication.pillCount} pills remaining`);
            console.log(`   📅 ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} of supply left`);
            console.log('   ⚕️  Time to refill!');
            return true;
        }

        return false;
    }

    showRefillStatus() {
        const medsWithRefill = this.data.medications.filter(m =>
            m.active && m.pillCount !== undefined
        );

        console.log('\n💊 Medication Refill Status');
        console.log('═'.repeat(60));

        if (medsWithRefill.length === 0) {
            console.log('\nNo medications with refill tracking enabled.');
            console.log('Use: node medication-tracker.js set-refill <id> <pills> [pills-per-dose] [threshold]');
            return;
        }

        medsWithRefill.forEach(med => {
            const daysRemaining = this.calculateDaysRemaining(med);
            const status = daysRemaining === 0 ? '🔴 OUT' :
                          daysRemaining <= (med.refillThreshold || 7) ? '🟡 LOW' : '🟢 OK';

            console.log(`\n${status} ${med.name} (${med.dosage})`);
            console.log(`   💊 Pills: ${med.pillCount}`);
            console.log(`   📊 Per dose: ${med.pillsPerDose}`);
            console.log(`   📅 Days remaining: ${daysRemaining}`);

            if (daysRemaining === 0) {
                console.log('   ⚠️  OUT OF PILLS - Refill immediately!');
            } else if (daysRemaining <= (med.refillThreshold || 7)) {
                console.log('   ⚠️  Low supply - Time to refill!');
            }
        });

        // Summary
        const outOfStock = medsWithRefill.filter(m => this.calculateDaysRemaining(m) === 0).length;
        const lowStock = medsWithRefill.filter(m => {
            const days = this.calculateDaysRemaining(m);
            return days > 0 && days <= (m.refillThreshold || 7);
        }).length;
        const okStock = medsWithRefill.length - outOfStock - lowStock;

        console.log('\n' + '─'.repeat(60));
        console.log(`Summary: ${outOfStock} out of stock | ${lowStock} low | ${okStock} OK`);
    }

    refillMedication(medicationId, pillsAdded) {
        const medication = this.data.medications.find(m => m.id === parseInt(medicationId));

        if (!medication) {
            console.log('❌ Medication not found!');
            return false;
        }

        if (medication.pillCount === undefined || medication.pillCount === null) {
            console.log('❌ Refill tracking not enabled for this medication!');
            console.log('Use: node medication-tracker.js set-refill <id> <pills>');
            return false;
        }

        const oldCount = medication.pillCount;
        medication.pillCount += parseInt(pillsAdded);

        if (this.saveData()) {
            console.log(`✅ Refilled "${medication.name}"`);
            console.log(`   💊 Pills: ${oldCount} → ${medication.pillCount}`);

            const daysRemaining = this.calculateDaysRemaining(medication);
            if (daysRemaining !== null) {
                console.log(`   📅 Days remaining: ${daysRemaining}`);
            }

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

    // Reminder Management
    enableReminders() {
        const activeMeds = this.data.medications.filter(m => m.active);

        if (activeMeds.length === 0) {
            console.log('\n⚠️  No active medications to set reminders for');
            console.log('   Add medications first using: add <name> <dosage> <frequency> <time>');
            return false;
        }

        this.reminderService.enableMedicationReminders(activeMeds);
        return true;
    }

    disableReminders() {
        this.reminderService.disableMedicationReminders();
        return true;
    }

    showReminderStatus() {
        this.reminderService.showStatus();
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

  stats (or statistics)
      Display overall statistics and summary

  check-interactions (or interactions)
      Check for potential drug interactions between your medications
      Displays severity level, description, and recommendations
      🔴 SEVERE: Dangerous combinations - consult doctor immediately
      🟡 MODERATE: May cause problems - discuss with doctor
      🟢 MINOR: Low risk - be aware of potential effects

  history [medicationId] [days]
      View medication history
      Example: node medication-tracker.js history 1234567890 7

  remove <id>
      Deactivate a medication

  adherence [days]
      Visualize medication adherence with charts (default: 30 days)

  set-refill <id> <pill-count> [pills-per-dose] [refill-threshold-days]
      Enable refill tracking for a medication
      Auto-decrements pills when taken, alerts when low
      Example: node medication-tracker.js set-refill 1234567890 90 1 7
      Default: 1 pill per dose, 7 day threshold

  refill-status (or refills)
      Check refill status for all medications
      Shows pills remaining, days of supply, and alerts
      🔴 OUT: No pills remaining - refill immediately
      🟡 LOW: Running low - time to refill
      🟢 OK: Sufficient supply

  refill <id> <pills-added>
      Record a refill for a medication
      Example: node medication-tracker.js refill 1234567890 90

  export [directory]
      Export all data to CSV files (default: ./exports)
      Creates separate CSV files for medications and history
      Perfect for sharing with healthcare providers or backup

  export-pdf [directory]
      Generate comprehensive PDF report with charts and visualizations
      Includes adherence chart, medication schedule, and statistics
      Perfect for professional meetings or comprehensive review

  backup [directory]
      Create a timestamped backup of your data (default: ./backups)

  list-backups [directory]
      View all available backups with creation dates and sizes

  restore <backup-filename> [directory]
      Restore data from a backup file
      Current data is automatically backed up before restore

  reminders-on (or enable-reminders)
      Enable daily medication reminders at scheduled times
      Sends notifications when it's time to take your medications
      Reminders will be set for all active medications

  reminders-off (or disable-reminders)
      Disable medication reminders

  reminders (or reminders-status)
      View current reminder status and settings

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

        case 'stats':
        case 'statistics':
            tracker.showStats();
            break;

        case 'check-interactions':
        case 'interactions':
            tracker.checkInteractions();
            break;

        case 'history':
            const medId = args[1] || null;
            const days = ValidationUtils.parseInteger(args[2], {
                min: 1,
                max: 365,
                default: 7,
                fieldName: 'days'
            });
            tracker.getHistory(medId, days);
            break;

        case 'remove':
            if (args.length < 2) {
                console.log('❌ Usage: remove <medication-id>');
                break;
            }
            tracker.removeMedication(args[1]);
            break;

        case 'adherence':
            const adherenceDays = ValidationUtils.parseInteger(args[1], {
                min: 1,
                max: 365,
                default: 30,
                fieldName: 'days'
            });
            tracker.visualizeAdherence(adherenceDays);
            break;

        case 'export':
            const exportDir = args[1] || './exports';
            tracker.exportToCSV(exportDir);
            break;

        case 'export-pdf':
            const pdfDir = args[1] || './exports';
            tracker.exportToPDF(pdfDir).catch(err => {
                console.error('Failed to generate PDF:', err.message);
            });
            break;

        case 'backup':
            const backupDir = args[1] || './backups';
            tracker.createBackup(backupDir);
            break;

        case 'list-backups':
            const listDir = args[1] || './backups';
            tracker.listBackups(listDir);
            break;

        case 'restore':
            if (!args[1]) {
                console.log('Usage: restore <backup-filename> [backup-directory]');
                break;
            }
            const restoreDir = args[2] || './backups';
            tracker.restoreFromBackup(args[1], restoreDir);
            break;

        case 'reminders-on':
        case 'enable-reminders':
            tracker.enableReminders();
            break;

        case 'reminders-off':
        case 'disable-reminders':
            tracker.disableReminders();
            break;

        case 'reminders-status':
        case 'reminders':
            tracker.showReminderStatus();
            break;

        case 'set-refill':
            if (!args[1] || !args[2]) {
                console.log('Usage: node medication-tracker.js set-refill <medication-id> <pill-count> [pills-per-dose] [refill-threshold-days]');
                console.log('Example: node medication-tracker.js set-refill 1234567890 90 1 7');
            } else {
                // setRefillInfo now handles validation internally
                const pillsPerDose = args[3] || 1;
                const threshold = args[4] || 7;
                tracker.setRefillInfo(args[1], args[2], pillsPerDose, threshold);
            }
            break;

        case 'refill-status':
        case 'refills':
            tracker.showRefillStatus();
            break;

        case 'refill':
            if (!args[1] || !args[2]) {
                console.log('Usage: node medication-tracker.js refill <medication-id> <pills-added>');
                console.log('Example: node medication-tracker.js refill 1234567890 90');
            } else {
                tracker.refillMedication(args[1], args[2]);
            }
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
