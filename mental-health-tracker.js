const fs = require('fs');
const path = require('path');
const ChartUtils = require('./chart-utils');
const PDFDocument = require('pdfkit');
const ReminderService = require('./reminder-service');

class MentalHealthTracker {
    constructor(dataFile = 'mental-health-data.json') {
        this.dataFile = dataFile;
        this.data = this.loadData();
        this.reminderService = new ReminderService();
        this.idCounter = Date.now();
    }

    generateId() {
        return ++this.idCounter;
    }

    normalizeData(raw) {
        const data = raw || {};

        // Ensure profile exists with expected fields
        if (!data.profile || typeof data.profile !== 'object') {
            data.profile = {
                accidentDate: null,
                accidentDescription: null,
                createdAt: new Date().toISOString()
            };
        }

        // Detect and alias legacy properties: moodLogs <-> moodEntries
        if (Array.isArray(data.moodLogs) && !Array.isArray(data.moodEntries)) {
            data.moodEntries = data.moodLogs;
        } else if (Array.isArray(data.moodEntries) && !Array.isArray(data.moodLogs)) {
            data.moodLogs = data.moodEntries;
        }

        // Detect and alias legacy properties: journalLogs <-> journalEntries
        if (Array.isArray(data.journalLogs) && !Array.isArray(data.journalEntries)) {
            data.journalEntries = data.journalLogs;
        } else if (Array.isArray(data.journalEntries) && !Array.isArray(data.journalLogs)) {
            data.journalLogs = data.journalEntries;
        }

        // List of all expected array properties
        const arrayProperties = [
            'moodEntries', 'moodLogs',
            'journalEntries', 'journalLogs',
            'symptoms', 'triggers', 'copingStrategies',
            'emergencyContacts', 'goals', 'therapists', 'therapySessions'
        ];

        // Coerce all expected list properties to arrays and filter out null/undefined elements
        for (const prop of arrayProperties) {
            if (!Array.isArray(data[prop])) {
                data[prop] = [];
            } else {
                data[prop] = data[prop].filter(item => item != null);
            }
        }

        // Keep aliases in sync after filtering
        data.moodLogs = data.moodEntries;
        data.journalLogs = data.journalEntries;

        return data;
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const rawData = fs.readFileSync(this.dataFile, 'utf8');
                try {
                    const parsed = JSON.parse(rawData);
                    return this.normalizeData(parsed);
                } catch (parseError) {
                    console.error('Error loading data:', parseError.message);
                    return this.normalizeData({});
                }
            }
        } catch (error) {
            console.error('Error loading data:', error.message);
        }
        return this.normalizeData({});
    }

    saveData() {
        try {
            // Synchronize aliases before writing (bidirectional)
            if (Array.isArray(this.data.moodEntries)) {
                this.data.moodLogs = this.data.moodEntries;
            } else if (Array.isArray(this.data.moodLogs)) {
                this.data.moodEntries = this.data.moodLogs;
            }
            if (Array.isArray(this.data.journalEntries)) {
                this.data.journalLogs = this.data.journalEntries;
            } else if (Array.isArray(this.data.journalLogs)) {
                this.data.journalEntries = this.data.journalLogs;
            }
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving data:', error.message);
            return false;
        }
    }

    // Statistics Summary
    showStats() {
        const totalMoods = this.data.moodEntries.length;
        const totalJournal = this.data.journalEntries.length;
        const totalSymptoms = this.data.symptoms.length;
        const totalTriggers = this.data.triggers.length;
        const totalCoping = this.data.copingStrategies.length;
        const totalGoals = this.data.goals.length;
        const completedGoals = this.data.goals.filter(g => g.completed).length;
        const activeGoals = totalGoals - completedGoals;

        // Calculate average mood if entries exist
        let avgMood = 0;
        if (totalMoods > 0) {
            avgMood = (this.data.moodEntries.reduce((sum, e) => sum + e.rating, 0) / totalMoods).toFixed(1);
        }

        // Calculate days tracking (from first entry to now)
        let daysTracking = 0;
        if (totalMoods > 0 || totalJournal > 0 || totalSymptoms > 0) {
            const allDates = [
                ...this.data.moodEntries.map(e => new Date(e.timestamp)),
                ...this.data.journalEntries.map(e => new Date(e.timestamp)),
                ...this.data.symptoms.map(e => new Date(e.timestamp))
            ];
            if (allDates.length > 0) {
                const firstDate = new Date(Math.min(...allDates));
                const daysDiff = Math.ceil((new Date() - firstDate) / (1000 * 60 * 60 * 24));
                daysTracking = daysDiff;
            }
        }

        console.log('\n📊 Mental Health Tracker - Statistics Summary');
        console.log('═'.repeat(60));
        console.log(`\n📅 Tracking Duration: ${daysTracking} days`);
        console.log('\n🎭 Mood & Emotions:');
        console.log(`   Total mood entries: ${totalMoods}`);
        if (totalMoods > 0) {
            console.log(`   Average mood: ${avgMood}/10 ${this.getMoodEmoji(Math.round(avgMood))}`);
        }

        console.log('\n📝 Journal:');
        console.log(`   Total entries: ${totalJournal}`);

        console.log('\n🩺 Symptoms:');
        console.log(`   Total logged: ${totalSymptoms}`);

        console.log('\n⚡ Triggers:');
        console.log(`   Identified: ${totalTriggers}`);

        console.log('\n💪 Coping Strategies:');
        console.log(`   Available: ${totalCoping}`);

        console.log('\n🎯 Recovery Goals:');
        console.log(`   Active: ${activeGoals}`);
        console.log(`   Completed: ${completedGoals}`);
        console.log(`   Total: ${totalGoals}`);

        if (this.data.profile && this.data.profile.accidentDate) {
            const accidentDate = new Date(this.data.profile.accidentDate);
            const daysSinceAccident = Math.ceil((new Date() - accidentDate) / (1000 * 60 * 60 * 24));
            console.log(`\n🕐 Days since accident: ${daysSinceAccident}`);
        }

        console.log('\n═'.repeat(60));
    }

    // ==================== THERAPY SESSION MANAGER ====================

    addTherapist(name, specialty, phone, email) {
        const therapist = {
            id: this.generateId(),
            name,
            specialty,
            phone,
            email,
            addedAt: new Date().toISOString()
        };

        this.data.therapists.push(therapist);

        if (this.saveData()) {
            console.log('\n✅ Therapist added successfully!');
            console.log(`   Name: ${name}`);
            console.log(`   Specialty: ${specialty}`);
            console.log(`   Phone: ${phone}`);
            if (email) console.log(`   Email: ${email}`);
            return therapist;
        }
        return null;
    }

    scheduleSession(therapistId, date, time, type = 'regular') {
        const therapist = this.data.therapists.find(t => t.id === parseInt(therapistId));

        if (!therapist) {
            console.log('❌ Therapist not found! Use list-therapists to see available therapists.');
            return false;
        }

        const session = {
            id: this.generateId(),
            therapistId: therapist.id,
            therapistName: therapist.name,
            date,
            time,
            type, // regular, intake, followup, crisis
            status: 'scheduled',
            preSessionMood: null,
            postSessionMood: null,
            preSessionNotes: null,
            postSessionNotes: null,
            effectiveness: null,
            createdAt: new Date().toISOString()
        };

        this.data.therapySessions.push(session);

        if (this.saveData()) {
            console.log('\n✅ Therapy session scheduled!');
            console.log(`   Therapist: ${therapist.name}`);
            console.log(`   Date: ${date} at ${time}`);
            console.log(`   Type: ${type}`);
            console.log(`   Session ID: ${session.id}`);
            return session;
        }
        return null;
    }

    listTherapists() {
        if (this.data.therapists.length === 0) {
            console.log('\n📋 No therapists added yet.');
            console.log('Use: node mental-health-tracker.js add-therapist <name> <specialty> <phone> [email]');
            return;
        }

        console.log('\n📋 Your Therapists');
        console.log('═'.repeat(60));

        this.data.therapists.forEach(therapist => {
            console.log(`\n👤 ${therapist.name} (ID: ${therapist.id})`);
            console.log(`   Specialty: ${therapist.specialty}`);
            console.log(`   Phone: ${therapist.phone}`);
            if (therapist.email) console.log(`   Email: ${therapist.email}`);
        });
    }

    listSessions(upcoming = true) {
        let sessions = this.data.therapySessions;

        if (upcoming) {
            sessions = sessions.filter(s => s.status === 'scheduled');
        }

        if (sessions.length === 0) {
            console.log('\n📅 No therapy sessions found.');
            return;
        }

        console.log(`\n📅 ${upcoming ? 'Upcoming' : 'All'} Therapy Sessions`);
        console.log('═'.repeat(60));

        sessions.forEach(session => {
            const statusIcon = {
                'scheduled': '📅',
                'completed': '✅',
                'cancelled': '❌',
                'missed': '⚠️'
            };

            console.log(`\n${statusIcon[session.status] || '📝'} Session ID: ${session.id}`);
            console.log(`   Therapist: ${session.therapistName}`);
            console.log(`   Date: ${session.date} at ${session.time}`);
            console.log(`   Type: ${session.type}`);
            console.log(`   Status: ${session.status}`);

            if (session.effectiveness) {
                console.log(`   Effectiveness: ${session.effectiveness}/10`);
            }
        });
    }

    preSessionPrep(sessionId, mood, notes) {
        const session = this.data.therapySessions.find(s => s.id === parseInt(sessionId));

        if (!session) {
            console.log('❌ Session not found!');
            return false;
        }

        session.preSessionMood = parseInt(mood);
        session.preSessionNotes = notes;

        if (this.saveData()) {
            console.log('\n✅ Pre-session prep saved!');
            console.log(`   Mood: ${mood}/10`);
            console.log(`   Notes: ${notes}`);

            // Show recent mood trends for context
            const recentMoods = this.data.moodEntries.slice(-7);
            if (recentMoods.length > 0) {
                const avg = (recentMoods.reduce((sum, m) => sum + m.rating, 0) / recentMoods.length).toFixed(1);
                console.log(`\n📊 Your average mood (last 7 entries): ${avg}/10`);
            }

            return true;
        }
        return false;
    }

    completeSession(sessionId, postMood, postNotes, effectiveness) {
        const session = this.data.therapySessions.find(s => s.id === parseInt(sessionId));

        if (!session) {
            console.log('❌ Session not found!');
            return false;
        }

        session.status = 'completed';
        session.postSessionMood = parseInt(postMood);
        session.postSessionNotes = postNotes;
        session.effectiveness = parseInt(effectiveness);
        session.completedAt = new Date().toISOString();

        if (this.saveData()) {
            console.log('\n✅ Session marked as complete!');
            console.log(`   Post-session mood: ${postMood}/10`);
            console.log(`   Effectiveness: ${effectiveness}/10`);

            if (session.preSessionMood) {
                const moodChange = session.postSessionMood - session.preSessionMood;
                if (moodChange > 0) {
                    console.log(`   📈 Mood improved by ${moodChange} points!`);
                } else if (moodChange < 0) {
                    console.log(`   📉 Mood decreased by ${Math.abs(moodChange)} points`);
                } else {
                    console.log('   ➡️  Mood stayed the same');
                }
            }

            return true;
        }
        return false;
    }

    therapyAnalytics() {
        const completed = this.data.therapySessions.filter(s => s.status === 'completed');

        if (completed.length === 0) {
            console.log('\n📊 No completed therapy sessions yet.');
            return;
        }

        console.log('\n📊 Therapy Session Analytics');
        console.log('═'.repeat(60));

        // Total sessions
        console.log(`\n📅 Total Sessions: ${this.data.therapySessions.length}`);
        console.log(`   Completed: ${completed.length}`);
        console.log(`   Scheduled: ${this.data.therapySessions.filter(s => s.status === 'scheduled').length}`);

        // Average effectiveness
        const avgEffectiveness = (completed.reduce((sum, s) => sum + (s.effectiveness || 0), 0) / completed.length).toFixed(1);
        console.log(`\n⭐ Average Effectiveness: ${avgEffectiveness}/10`);

        // Mood improvement
        const sessionsWithMood = completed.filter(s => s.preSessionMood && s.postSessionMood);
        if (sessionsWithMood.length > 0) {
            const totalImprovement = sessionsWithMood.reduce((sum, s) =>
                sum + (s.postSessionMood - s.preSessionMood), 0
            );
            const avgImprovement = (totalImprovement / sessionsWithMood.length).toFixed(1);

            console.log('\n📈 Mood Impact:');
            console.log(`   Average mood change per session: ${avgImprovement > 0 ? '+' : ''}${avgImprovement} points`);
            console.log(`   Sessions tracked: ${sessionsWithMood.length}`);
        }

        // By therapist
        const byTherapist = {};
        completed.forEach(s => {
            if (!byTherapist[s.therapistName]) {
                byTherapist[s.therapistName] = { count: 0, totalEff: 0 };
            }
            byTherapist[s.therapistName].count++;
            byTherapist[s.therapistName].totalEff += s.effectiveness || 0;
        });

        console.log('\n👥 By Therapist:');
        Object.keys(byTherapist).forEach(name => {
            const data = byTherapist[name];
            const avg = (data.totalEff / data.count).toFixed(1);
            console.log(`   ${name}: ${data.count} sessions, ${avg}/10 avg effectiveness`);
        });
    }

    // Backup and Restore
    createBackup(backupDir = './backups') {
        try {
            // Create backups directory if it doesn't exist
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Check if data file exists
            if (!fs.existsSync(this.dataFile)) {
                console.log('\n⚠️  No data file found to backup.');
                return false;
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const backupFilename = `mental-health-backup-${timestamp}.json`;
            const backupPath = path.join(backupDir, backupFilename);

            // Copy data file to backup
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
                .filter(f => f.startsWith('mental-health-backup-') && f.endsWith('.json'))
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

            // Create a backup of current data before restoring
            if (fs.existsSync(this.dataFile)) {
                const preRestoreBackup = `mental-health-pre-restore-${Date.now()}.json`;
                fs.copyFileSync(this.dataFile, path.join(backupDir, preRestoreBackup));
                console.log(`\n💾 Current data backed up to: ${preRestoreBackup}`);
            }

            // Restore from backup
            const backupData = fs.readFileSync(backupPath);
            fs.writeFileSync(this.dataFile, backupData);

            // Reload data
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
            const baseFilename = `mental-health-export-${timestamp}`;

            // Export mood entries
            if (this.data.moodEntries.length > 0) {
                const moodCSV = this.generateMoodCSV();
                fs.writeFileSync(path.join(outputDir, `${baseFilename}-moods.csv`), moodCSV);
            }

            // Export journal entries
            if (this.data.journalEntries.length > 0) {
                const journalCSV = this.generateJournalCSV();
                fs.writeFileSync(path.join(outputDir, `${baseFilename}-journal.csv`), journalCSV);
            }

            // Export symptoms
            if (this.data.symptoms.length > 0) {
                const symptomsCSV = this.generateSymptomsCSV();
                fs.writeFileSync(path.join(outputDir, `${baseFilename}-symptoms.csv`), symptomsCSV);
            }

            // Export triggers
            if (this.data.triggers.length > 0) {
                const triggersCSV = this.generateTriggersCSV();
                fs.writeFileSync(path.join(outputDir, `${baseFilename}-triggers.csv`), triggersCSV);
            }

            // Export coping strategies
            if (this.data.copingStrategies.length > 0) {
                const copingCSV = this.generateCopingCSV();
                fs.writeFileSync(path.join(outputDir, `${baseFilename}-coping.csv`), copingCSV);
            }

            // Export goals
            if (this.data.goals.length > 0) {
                const goalsCSV = this.generateGoalsCSV();
                fs.writeFileSync(path.join(outputDir, `${baseFilename}-goals.csv`), goalsCSV);
            }

            console.log(`\n✓ Data exported successfully to ${outputDir}/`);
            console.log(`  Base filename: ${baseFilename}`);
            return true;
        } catch (error) {
            console.error('Error exporting data:', error.message);
            return false;
        }
    }

    generateMoodCSV() {
        const headers = 'Date,Time,Rating,Note\n';
        const rows = this.data.moodEntries.map(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();
            const note = (entry.note || '').replace(/"/g, '""'); // Escape quotes
            return `"${dateStr}","${timeStr}",${entry.rating},"${note}"`;
        }).join('\n');
        return headers + rows;
    }

    generateJournalCSV() {
        const headers = 'Date,Time,Type,Content\n';
        const rows = this.data.journalEntries.map(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();
            const content = (entry.content || '').replace(/"/g, '""');
            return `"${dateStr}","${timeStr}","${entry.type}","${content}"`;
        }).join('\n');
        return headers + rows;
    }

    generateSymptomsCSV() {
        const headers = 'Date,Time,Type,Severity,Note\n';
        const rows = this.data.symptoms.map(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();
            const note = (entry.note || '').replace(/"/g, '""');
            return `"${dateStr}","${timeStr}","${entry.type}",${entry.severity},"${note}"`;
        }).join('\n');
        return headers + rows;
    }

    generateTriggersCSV() {
        const headers = 'Description,Intensity,Occurrences,First Logged,Last Logged\n';
        const rows = this.data.triggers.map(trigger => {
            const desc = (trigger.description || '').replace(/"/g, '""');
            const firstDate = new Date(trigger.firstLogged).toLocaleDateString();
            const lastDate = trigger.lastLogged ? new Date(trigger.lastLogged).toLocaleDateString() : 'N/A';
            return `"${desc}",${trigger.intensity},${trigger.occurrences},"${firstDate}","${lastDate}"`;
        }).join('\n');
        return headers + rows;
    }

    generateCopingCSV() {
        const headers = 'Name,Description,Effectiveness,Times Used\n';
        const rows = this.data.copingStrategies.map(strategy => {
            const name = (strategy.name || '').replace(/"/g, '""');
            const desc = (strategy.description || '').replace(/"/g, '""');
            const eff = strategy.effectiveness || 'N/A';
            const used = strategy.timesUsed || 0;
            return `"${name}","${desc}","${eff}",${used}`;
        }).join('\n');
        return headers + rows;
    }

    generateGoalsCSV() {
        const headers = 'Description,Target Date,Created,Completed,Status\n';
        const rows = this.data.goals.map(goal => {
            const desc = (goal.description || '').replace(/"/g, '""');
            const target = goal.targetDate || 'N/A';
            const created = new Date(goal.createdAt).toLocaleDateString();
            const completed = goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : 'N/A';
            const status = goal.completed ? 'Completed' : 'Active';
            return `"${desc}","${target}","${created}","${completed}","${status}"`;
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
                const filename = `mental-health-report-${timestamp}.pdf`;
                const filepath = path.join(outputDir, filename);

                // Create PDF document
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Header
                doc.fontSize(24).fillColor('#2c3e50').text('Mental Health Report', { align: 'center' });
                doc.moveDown(0.5);
                doc.fontSize(12).fillColor('#7f8c8d').text(new Date().toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                }), { align: 'center' });
                doc.moveDown(2);

                // Summary Statistics
                this.addSummarySection(doc);
                doc.moveDown(1.5);

                // Mood Trend Chart
                if (this.data.moodEntries.length > 0) {
                    this.addMoodTrendChart(doc);
                    doc.moveDown(1.5);
                }

                // Mood Distribution
                if (this.data.moodEntries.length > 0) {
                    this.addMoodDistribution(doc);
                    doc.moveDown(1.5);
                }

                // Recent Journal Entries
                if (this.data.journalEntries.length > 0) {
                    this.addJournalSection(doc);
                    doc.moveDown(1.5);
                }

                // Active Goals
                if (this.data.goals.length > 0) {
                    this.addGoalsSection(doc);
                    doc.moveDown(1.5);
                }

                // Top Coping Strategies
                if (this.data.copingStrategies.length > 0) {
                    this.addCopingSection(doc);
                }

                // Footer
                doc.fontSize(8).fillColor('#95a5a6').text(
                    'Generated by StepSync Mental Health Tracker',
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

    addSummarySection(doc) {
        doc.fontSize(16).fillColor('#34495e').text('📊 Summary Statistics');
        doc.moveDown(0.5);

        const totalMoods = this.data.moodEntries.length;
        const totalJournal = this.data.journalEntries.length;
        const avgMood = totalMoods > 0
            ? (this.data.moodEntries.reduce((sum, e) => sum + e.rating, 0) / totalMoods).toFixed(1)
            : 'N/A';

        const activeGoals = this.data.goals.filter(g => !g.completed).length;
        const completedGoals = this.data.goals.filter(g => g.completed).length;

        doc.fontSize(11).fillColor('#2c3e50');
        doc.text(`Total Mood Entries: ${totalMoods}`, { indent: 20 });
        doc.text(`Average Mood Rating: ${avgMood}/10`, { indent: 20 });
        doc.text(`Journal Entries: ${totalJournal}`, { indent: 20 });
        doc.text(`Active Goals: ${activeGoals}`, { indent: 20 });
        doc.text(`Completed Goals: ${completedGoals}`, { indent: 20 });
        doc.text(`Coping Strategies: ${this.data.copingStrategies.length}`, { indent: 20 });
    }

    addMoodTrendChart(doc) {
        doc.fontSize(16).fillColor('#34495e').text('📈 Mood Trend (Last 30 Days)');
        doc.moveDown(0.5);

        // Get last 30 days of mood entries
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const recentMoods = this.data.moodEntries
            .filter(e => new Date(e.timestamp) >= thirtyDaysAgo)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (recentMoods.length === 0) {
            doc.fontSize(11).fillColor('#7f8c8d').text('No mood data in the last 30 days', { indent: 20 });
            return;
        }

        // Chart dimensions
        const chartX = 70;
        const chartY = doc.y + 10;
        const chartWidth = 450;
        const chartHeight = 150;

        // Draw axes
        doc.strokeColor('#bdc3c7').lineWidth(1);
        doc.moveTo(chartX, chartY).lineTo(chartX, chartY + chartHeight).stroke(); // Y-axis
        doc.moveTo(chartX, chartY + chartHeight).lineTo(chartX + chartWidth, chartY + chartHeight).stroke(); // X-axis

        // Y-axis labels (0-10)
        doc.fontSize(8).fillColor('#7f8c8d');
        for (let i = 0; i <= 10; i += 2) {
            const y = chartY + chartHeight - (i * chartHeight / 10);
            doc.text(i.toString(), chartX - 20, y - 4);
            doc.strokeColor('#ecf0f1').moveTo(chartX, y).lineTo(chartX + chartWidth, y).stroke();
        }

        // Plot mood data
        if (recentMoods.length > 1) {
            doc.strokeColor('#3498db').lineWidth(2);
            for (let i = 0; i < recentMoods.length - 1; i++) {
                const x1 = chartX + (i * chartWidth / (recentMoods.length - 1));
                const y1 = chartY + chartHeight - (recentMoods[i].rating * chartHeight / 10);
                const x2 = chartX + ((i + 1) * chartWidth / (recentMoods.length - 1));
                const y2 = chartY + chartHeight - (recentMoods[i + 1].rating * chartHeight / 10);
                doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
            }

            // Draw data points
            doc.fillColor('#2980b9');
            recentMoods.forEach((mood, i) => {
                const x = chartX + (i * chartWidth / (recentMoods.length - 1));
                const y = chartY + chartHeight - (mood.rating * chartHeight / 10);
                doc.circle(x, y, 3).fill();
            });
        }

        doc.y = chartY + chartHeight + 20;
    }

    addMoodDistribution(doc) {
        doc.fontSize(16).fillColor('#34495e').text('📊 Mood Distribution');
        doc.moveDown(0.5);

        // Count mood ranges
        const distribution = { '1-2': 0, '3-4': 0, '5-6': 0, '7-8': 0, '9-10': 0 };
        this.data.moodEntries.forEach(entry => {
            if (entry.rating <= 2) distribution['1-2']++;
            else if (entry.rating <= 4) distribution['3-4']++;
            else if (entry.rating <= 6) distribution['5-6']++;
            else if (entry.rating <= 8) distribution['7-8']++;
            else distribution['9-10']++;
        });

        const total = this.data.moodEntries.length;
        const barWidth = 80;
        const maxBarHeight = 100;
        const startX = 70;
        const startY = doc.y + 10;

        Object.entries(distribution).forEach(([range, count], index) => {
            const x = startX + (index * 100);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const barHeight = (percentage / 100) * maxBarHeight;

            // Draw bar
            doc.fillColor(this.getMoodColor(range)).rect(x, startY + maxBarHeight - barHeight, barWidth, barHeight).fill();

            // Labels
            doc.fontSize(9).fillColor('#2c3e50');
            doc.text(range, x, startY + maxBarHeight + 5, { width: barWidth, align: 'center' });
            doc.text(`${count} (${percentage.toFixed(0)}%)`, x, startY + maxBarHeight + 20, { width: barWidth, align: 'center' });
        });

        doc.y = startY + maxBarHeight + 40;
    }

    getMoodColor(range) {
        const colors = {
            '1-2': '#e74c3c',   // Red
            '3-4': '#e67e22',   // Orange
            '5-6': '#f39c12',   // Yellow
            '7-8': '#2ecc71',   // Green
            '9-10': '#27ae60'   // Dark Green
        };
        return colors[range] || '#95a5a6';
    }

    addJournalSection(doc) {
        doc.fontSize(16).fillColor('#34495e').text('📝 Recent Journal Entries');
        doc.moveDown(0.5);

        const recent = this.data.journalEntries
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        recent.forEach((entry, index) => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            doc.fontSize(11).fillColor('#2c3e50').text(`${date} - ${entry.type}`, { indent: 20, continued: false });
            doc.fontSize(10).fillColor('#7f8c8d').text(
                entry.content.length > 150 ? entry.content.substring(0, 150) + '...' : entry.content,
                { indent: 40 }
            );
            if (index < recent.length - 1) doc.moveDown(0.5);
        });
    }

    addGoalsSection(doc) {
        doc.fontSize(16).fillColor('#34495e').text('🎯 Active Goals');
        doc.moveDown(0.5);

        const activeGoals = this.data.goals.filter(g => !g.completed).slice(0, 5);

        if (activeGoals.length === 0) {
            doc.fontSize(11).fillColor('#7f8c8d').text('No active goals', { indent: 20 });
            return;
        }

        activeGoals.forEach((goal, index) => {
            const targetDate = goal.targetDate || 'No deadline';
            doc.fontSize(11).fillColor('#2c3e50').text(`${index + 1}. ${goal.description}`, { indent: 20 });
            doc.fontSize(9).fillColor('#7f8c8d').text(`   Target: ${targetDate}`, { indent: 20 });
            if (index < activeGoals.length - 1) doc.moveDown(0.3);
        });
    }

    addCopingSection(doc) {
        doc.fontSize(16).fillColor('#34495e').text('💪 Top Coping Strategies');
        doc.moveDown(0.5);

        const topStrategies = this.data.copingStrategies
            .sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0))
            .slice(0, 5);

        topStrategies.forEach((strategy, index) => {
            const effectiveness = strategy.effectiveness || 'N/A';
            const timesUsed = strategy.timesUsed || 0;
            doc.fontSize(11).fillColor('#2c3e50').text(
                `${index + 1}. ${strategy.name} (Used: ${timesUsed}x, Effectiveness: ${effectiveness}/10)`,
                { indent: 20 }
            );
            if (strategy.description) {
                doc.fontSize(9).fillColor('#7f8c8d').text(`   ${strategy.description}`, { indent: 40 });
            }
            if (index < topStrategies.length - 1) doc.moveDown(0.3);
        });
    }

    // Profile Management
    setupProfile(accidentDate, description) {
        this.data.profile.accidentDate = accidentDate;
        this.data.profile.accidentDescription = description;

        if (this.saveData()) {
            console.log('\n✓ Profile setup complete!');
            console.log(`  Accident Date: ${accidentDate}`);
            console.log(`  Description: ${description}`);
            return true;
        }
        return false;
    }

    viewProfile() {
        const profile = this.data.profile;
        console.log('\n👤 Your Profile:');
        console.log('═'.repeat(60));
        console.log(`Accident Date: ${profile.accidentDate || 'Not set'}`);
        console.log(`Description: ${profile.accidentDescription || 'Not set'}`);
        console.log(`Profile Created: ${new Date(profile.createdAt).toLocaleDateString()}`);
        console.log('═'.repeat(60));
    }

    // Mood Tracking
    logMood(rating, note = '') {
        if (rating < 1 || rating > 10) {
            console.log('❌ Rating must be between 1 and 10');
            return false;
        }

        const entry = {
            id: this.generateId(),
            rating: parseInt(rating),
            note: note,
            timestamp: new Date().toISOString()
        };

        this.data.moodEntries.push(entry);
        // Keep moodLogs alias in sync
        this.data.moodLogs = this.data.moodEntries;

        if (this.saveData()) {
            const emoji = this.getMoodEmoji(rating);
            console.log(`\n✓ Mood logged: ${emoji} ${rating}/10`);
            if (note) console.log(`  Note: ${note}`);
            console.log(`  Time: ${new Date().toLocaleString()}`);
            return true;
        }
        return false;
    }

    getMoodEmoji(rating) {
        if (rating <= 2) return '😢';
        if (rating <= 4) return '😔';
        if (rating <= 6) return '😐';
        if (rating <= 8) return '🙂';
        return '😊';
    }

    viewMoodHistory(days = 7) {
        const now = new Date();
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

        // Defensive: ensure moodEntries is an array, filter out null entries and invalid entries
        const source = Array.isArray(this.data.moodEntries) ? this.data.moodEntries : [];
        const recentMoods = source.filter(entry => {
            if (!entry || typeof entry !== 'object') return false;
            if (!entry.timestamp) return false;
            return new Date(entry.timestamp) >= startDate;
        });

        if (recentMoods.length === 0) {
            console.log(`\nNo mood entries found in the last ${days} days.`);
            return;
        }

        console.log(`\n📊 Mood History (Last ${days} days):`);
        console.log('═'.repeat(60));

        recentMoods.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleString();
            const rating = typeof entry.rating === 'number' ? entry.rating : 0;
            const emoji = this.getMoodEmoji(rating);
            console.log(`${emoji} ${rating}/10 - ${date}`);
            if (entry.note) console.log(`   "${entry.note}"`);
            console.log('─'.repeat(60));
        });

        // Calculate average using only valid numeric ratings
        const validRatings = recentMoods.filter(e => typeof e.rating === 'number');
        if (validRatings.length > 0) {
            const avg = (validRatings.reduce((sum, e) => sum + e.rating, 0) / validRatings.length).toFixed(1);
            console.log(`Average Mood: ${avg}/10`);
        } else {
            console.log(`Average Mood: N/A`);
        }
        console.log('═'.repeat(60));
    }

    // Journal Entries
    addJournal(content, type = 'general') {
        const entry = {
            id: this.generateId(),
            type: type, // 'general', 'incident', 'therapy', 'progress'
            content: content,
            timestamp: new Date().toISOString()
        };

        this.data.journalEntries.push(entry);

        if (this.saveData()) {
            console.log('\n✓ Journal entry saved!');
            console.log(`  Type: ${type}`);
            console.log(`  Time: ${new Date().toLocaleString()}`);
            return true;
        }
        return false;
    }

    viewJournal(days = 7, type = null) {
        const now = new Date();
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

        let entries = this.data.journalEntries.filter(entry => {
            return new Date(entry.timestamp) >= startDate;
        });

        if (type) {
            entries = entries.filter(e => e.type === type);
        }

        if (entries.length === 0) {
            console.log('\nNo journal entries found.');
            return;
        }

        console.log(`\n📔 Journal Entries (Last ${days} days):`);
        console.log('═'.repeat(60));

        entries.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleString();
            console.log(`\n[${entry.type.toUpperCase()}] - ${date}`);
            console.log(entry.content);
            console.log('─'.repeat(60));
        });
    }

    // Symptom Tracking
    logSymptom(symptomType, severity, note = '') {
        const validSymptoms = [
            'anxiety', 'panic', 'flashback', 'nightmare',
            'depression', 'insomnia', 'irritability', 'avoidance',
            'hypervigilance', 'concentration', 'physical-pain', 'other'
        ];

        if (!validSymptoms.includes(symptomType)) {
            console.log(`❌ Invalid symptom type. Valid types: ${validSymptoms.join(', ')}`);
            return false;
        }

        if (severity < 1 || severity > 10) {
            console.log('❌ Severity must be between 1 and 10');
            return false;
        }

        const entry = {
            id: this.generateId(),
            type: symptomType,
            severity: parseInt(severity),
            note: note,
            timestamp: new Date().toISOString()
        };

        this.data.symptoms.push(entry);

        if (this.saveData()) {
            console.log(`\n✓ Symptom logged: ${symptomType} (severity: ${severity}/10)`);
            if (note) console.log(`  Note: ${note}`);
            return true;
        }
        return false;
    }

    viewSymptoms(days = 7, symptomType = null) {
        const now = new Date();
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

        let symptoms = this.data.symptoms.filter(entry => {
            return new Date(entry.timestamp) >= startDate;
        });

        if (symptomType) {
            symptoms = symptoms.filter(s => s.type === symptomType);
        }

        if (symptoms.length === 0) {
            console.log(`\nNo symptoms logged in the last ${days} days.`);
            return;
        }

        console.log(`\n⚕️  Symptom History (Last ${days} days):`);
        console.log('═'.repeat(60));

        // Group by type
        const grouped = {};
        symptoms.forEach(s => {
            if (!grouped[s.type]) grouped[s.type] = [];
            grouped[s.type].push(s);
        });

        Object.keys(grouped).forEach(type => {
            const typeSymptoms = grouped[type];
            const avg = (typeSymptoms.reduce((sum, s) => sum + s.severity, 0) / typeSymptoms.length).toFixed(1);

            console.log(`\n${type.toUpperCase()}: ${typeSymptoms.length} occurrences, avg severity: ${avg}/10`);
            typeSymptoms.forEach(s => {
                const date = new Date(s.timestamp).toLocaleString();
                console.log(`  • ${s.severity}/10 - ${date}`);
                if (s.note) console.log(`    "${s.note}"`);
            });
        });
        console.log('═'.repeat(60));
    }

    // Trigger Management
    addTrigger(description, intensity = 5) {
        const trigger = {
            id: this.generateId(),
            description: description,
            intensity: parseInt(intensity),
            occurrences: 1,
            lastOccurred: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        this.data.triggers.push(trigger);

        if (this.saveData()) {
            console.log(`\n✓ Trigger recorded: "${description}" (intensity: ${intensity}/10)`);
            return true;
        }
        return false;
    }

    logTriggerOccurrence(triggerId) {
        const trigger = this.data.triggers.find(t => t.id === parseInt(triggerId));

        if (!trigger) {
            console.log('❌ Trigger not found!');
            return false;
        }

        trigger.occurrences++;
        trigger.lastOccurred = new Date().toISOString();

        if (this.saveData()) {
            console.log(`\n✓ Trigger occurrence logged: "${trigger.description}"`);
            console.log(`  Total occurrences: ${trigger.occurrences}`);
            return true;
        }
        return false;
    }

    listTriggers() {
        if (this.data.triggers.length === 0) {
            console.log('\nNo triggers recorded.');
            return;
        }

        console.log('\n⚠️  Your Triggers:');
        console.log('═'.repeat(60));

        // Sort by occurrences
        const sorted = [...this.data.triggers].sort((a, b) => b.occurrences - a.occurrences);

        sorted.forEach(trigger => {
            const lastOccurred = new Date(trigger.lastOccurred).toLocaleDateString();
            console.log(`\nID: ${trigger.id}`);
            console.log(`  Description: ${trigger.description}`);
            console.log(`  Intensity: ${trigger.intensity}/10`);
            console.log(`  Occurrences: ${trigger.occurrences}`);
            console.log(`  Last Occurred: ${lastOccurred}`);
        });
        console.log('═'.repeat(60));
    }

    // Coping Strategies
    addCopingStrategy(name, description, effectiveness = null) {
        const strategy = {
            id: this.generateId(),
            name: name,
            description: description,
            effectiveness: effectiveness, // Will be rated over time
            timesUsed: 0,
            ratings: [],
            createdAt: new Date().toISOString()
        };

        this.data.copingStrategies.push(strategy);

        if (this.saveData()) {
            console.log(`\n✓ Coping strategy added: "${name}"`);
            console.log(`  Description: ${description}`);
            return true;
        }
        return false;
    }

    useCopingStrategy(strategyId, rating = null) {
        const strategy = this.data.copingStrategies.find(s => s.id === parseInt(strategyId));

        if (!strategy) {
            console.log('❌ Coping strategy not found!');
            return false;
        }

        strategy.timesUsed++;

        if (rating !== null) {
            const ratingNum = parseInt(rating);
            if (ratingNum >= 1 && ratingNum <= 10) {
                strategy.ratings.push({
                    rating: ratingNum,
                    timestamp: new Date().toISOString()
                });

                // Update average effectiveness
                const avg = strategy.ratings.reduce((sum, r) => sum + r.rating, 0) / strategy.ratings.length;
                strategy.effectiveness = avg.toFixed(1);
            }
        }

        if (this.saveData()) {
            console.log(`\n✓ Used coping strategy: "${strategy.name}"`);
            console.log(`  Times used: ${strategy.timesUsed}`);
            if (strategy.effectiveness) {
                console.log(`  Average effectiveness: ${strategy.effectiveness}/10`);
            }
            return true;
        }
        return false;
    }

    listCopingStrategies() {
        if (this.data.copingStrategies.length === 0) {
            console.log('\nNo coping strategies recorded. Add some to help manage difficult moments!');
            return;
        }

        console.log('\n💪 Your Coping Strategies:');
        console.log('═'.repeat(60));

        // Sort by effectiveness
        const sorted = [...this.data.copingStrategies].sort((a, b) => {
            const aEff = a.effectiveness || 0;
            const bEff = b.effectiveness || 0;
            return bEff - aEff;
        });

        sorted.forEach(strategy => {
            console.log(`\nID: ${strategy.id}`);
            console.log(`  Name: ${strategy.name}`);
            console.log(`  Description: ${strategy.description}`);
            console.log(`  Times Used: ${strategy.timesUsed}`);
            if (strategy.effectiveness) {
                console.log(`  Effectiveness: ${strategy.effectiveness}/10`);
            }
        });
        console.log('═'.repeat(60));
    }

    // Emergency Contacts
    addEmergencyContact(name, relationship, phone, notes = '') {
        const contact = {
            id: this.generateId(),
            name: name,
            relationship: relationship,
            phone: phone,
            notes: notes,
            createdAt: new Date().toISOString()
        };

        this.data.emergencyContacts.push(contact);

        if (this.saveData()) {
            console.log(`\n✓ Emergency contact added: ${name}`);
            console.log(`  Phone: ${phone}`);
            return true;
        }
        return false;
    }

    listEmergencyContacts() {
        if (this.data.emergencyContacts.length === 0) {
            console.log('\n📞 No emergency contacts saved.');
            console.log('\nRecommended contacts to add:');
            console.log('  • Therapist/Counselor');
            console.log('  • Crisis Hotline (e.g., 988 Suicide & Crisis Lifeline)');
            console.log('  • Trusted friend or family member');
            console.log('  • Doctor');
            return;
        }

        console.log('\n📞 Emergency Contacts:');
        console.log('═'.repeat(60));

        this.data.emergencyContacts.forEach(contact => {
            console.log(`\n${contact.name} (${contact.relationship})`);
            console.log(`  Phone: ${contact.phone}`);
            if (contact.notes) console.log(`  Notes: ${contact.notes}`);
        });
        console.log('═'.repeat(60));
    }

    // Goals and Progress
    addGoal(description, targetDate = null) {
        const goal = {
            id: this.generateId(),
            description: description,
            targetDate: targetDate,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.data.goals.push(goal);

        if (this.saveData()) {
            console.log(`\n✓ Goal added: "${description}"`);
            if (targetDate) console.log(`  Target Date: ${targetDate}`);
            return true;
        }
        return false;
    }

    completeGoal(goalId) {
        const goal = this.data.goals.find(g => g.id === parseInt(goalId));

        if (!goal) {
            console.log('❌ Goal not found!');
            return false;
        }

        goal.completed = true;
        goal.completedAt = new Date().toISOString();

        if (this.saveData()) {
            console.log(`\n🎉 Goal completed: "${goal.description}"`);
            console.log('Great job! Celebrate this achievement!');
            return true;
        }
        return false;
    }

    listGoals(showCompleted = false) {
        const goals = showCompleted
            ? this.data.goals
            : this.data.goals.filter(g => !g.completed);

        if (goals.length === 0) {
            console.log(showCompleted ? '\nNo goals found.' : '\nNo active goals. Set some recovery goals!');
            return;
        }

        console.log('\n🎯 Your Goals:');
        console.log('═'.repeat(60));

        goals.forEach(goal => {
            const status = goal.completed ? '✓ COMPLETED' : '○ In Progress';
            console.log(`\n[${status}] ${goal.description}`);
            console.log(`  ID: ${goal.id}`);
            if (goal.targetDate) console.log(`  Target: ${goal.targetDate}`);
            if (goal.completed) {
                console.log(`  Completed: ${new Date(goal.completedAt).toLocaleDateString()}`);
            }
        });
        console.log('═'.repeat(60));
    }

    // Quick Check-in
    quickCheckIn() {
        console.log('\n🌟 Quick Mental Health Check-In');
        console.log('═'.repeat(60));

        // Get today's data
        const today = new Date().toDateString();
        const todayMoods = this.data.moodEntries.filter(e =>
            new Date(e.timestamp).toDateString() === today
        );
        const todaySymptoms = this.data.symptoms.filter(s =>
            new Date(s.timestamp).toDateString() === today
        );
        const todayJournals = this.data.journalEntries.filter(j =>
            new Date(j.timestamp).toDateString() === today
        );

        console.log(`\nToday's Summary (${today}):`);
        console.log(`  Mood entries: ${todayMoods.length}`);
        if (todayMoods.length > 0) {
            const avg = (todayMoods.reduce((sum, m) => sum + m.rating, 0) / todayMoods.length).toFixed(1);
            console.log(`  Average mood: ${avg}/10 ${this.getMoodEmoji(avg)}`);
        }
        console.log(`  Symptoms logged: ${todaySymptoms.length}`);
        console.log(`  Journal entries: ${todayJournals.length}`);

        console.log('\n💡 Suggestions:');
        if (todayMoods.length === 0) {
            console.log('  • Log your current mood');
        }
        if (todayJournals.length === 0) {
            console.log('  • Write a journal entry about your day');
        }
        if (this.data.copingStrategies.length > 0) {
            const bestStrategy = [...this.data.copingStrategies]
                .filter(s => s.effectiveness)
                .sort((a, b) => b.effectiveness - a.effectiveness)[0];
            if (bestStrategy) {
                console.log(`  • Try your most effective coping strategy: "${bestStrategy.name}"`);
            }
        }
        console.log('═'.repeat(60));
    }

    // Mood Trends Visualization
    visualizeMoodTrends(days = 14) {
        console.log('\n📈 Mood Trends Visualization');
        console.log('═'.repeat(60));

        if (this.data.moodEntries.length === 0) {
            console.log('No mood data available yet. Start logging your moods!');
            return;
        }

        // Get data for the specified period
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentMoods = this.data.moodEntries
            .filter(entry => new Date(entry.timestamp) >= cutoffDate)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (recentMoods.length === 0) {
            console.log(`No mood data in the last ${days} days.`);
            return;
        }

        // Aggregate by day (average if multiple entries per day)
        const dailyMoods = new Map();
        recentMoods.forEach(mood => {
            const date = new Date(mood.timestamp).toLocaleDateString();
            if (!dailyMoods.has(date)) {
                dailyMoods.set(date, []);
            }
            dailyMoods.get(date).push(mood.rating);
        });

        const chartData = Array.from(dailyMoods.entries()).map(([date, ratings]) => {
            const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
            return {
                label: date,
                value: avg
            };
        });

        // Show line chart
        console.log(ChartUtils.lineChart(chartData, {
            title: `Mood Trend (Last ${days} Days)`,
            height: 10,
            min: 1,
            max: 10,
            showValues: chartData.length <= 7
        }));

        // Calculate and show statistics
        const allRatings = recentMoods.map(m => m.rating);
        const avgMood = (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1);
        const minMood = Math.min(...allRatings);
        const maxMood = Math.max(...allRatings);

        // Show sparkline for quick view
        console.log(`\nQuick View: ${ChartUtils.sparkline(chartData.map(d => d.value))}`);

        console.log(ChartUtils.statsBox({
            'Data Points': allRatings.length,
            'Average Mood': `${avgMood}/10 ${this.getMoodEmoji(avgMood)}`,
            'Lowest': `${minMood}/10`,
            'Highest': `${maxMood}/10`,
            'Trend': this.calculateTrend(chartData)
        }, `📊 Mood Statistics (${days} days)`));

        // Calculate streak
        const streak = this.calculateMoodStreak();
        if (streak > 0) {
            console.log(ChartUtils.streakDisplay(streak, this.getLongestMoodStreak()));
        }
    }

    // Symptom Patterns Visualization
    visualizeSymptomPatterns(days = 30) {
        console.log('\n🩺 Symptom Patterns Visualization');
        console.log('═'.repeat(60));

        if (this.data.symptoms.length === 0) {
            console.log('No symptom data available yet.');
            return;
        }

        // Get recent symptoms
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentSymptoms = this.data.symptoms
            .filter(s => new Date(s.timestamp) >= cutoffDate);

        if (recentSymptoms.length === 0) {
            console.log(`No symptoms logged in the last ${days} days. That's good! 🎉`);
            return;
        }

        // Count by type
        const symptomCounts = {};
        const symptomSeverity = {};

        recentSymptoms.forEach(symptom => {
            const type = symptom.type;
            symptomCounts[type] = (symptomCounts[type] || 0) + 1;

            if (!symptomSeverity[type]) {
                symptomSeverity[type] = [];
            }
            symptomSeverity[type].push(symptom.severity);
        });

        // Create bar chart of symptom frequency
        const chartData = Object.entries(symptomCounts)
            .map(([type, count]) => ({
                label: type.charAt(0).toUpperCase() + type.slice(1),
                value: count
            }))
            .sort((a, b) => b.value - a.value);

        console.log(ChartUtils.barChart(chartData, {
            title: `Symptom Frequency (Last ${days} Days)`,
            width: 30
        }));

        // Show average severity for each symptom
        console.log('\n📊 Average Severity by Symptom:');
        console.log('═'.repeat(60));
        Object.entries(symptomSeverity)
            .sort((a, b) => {
                const avgA = a[1].reduce((sum, s) => sum + s, 0) / a[1].length;
                const avgB = b[1].reduce((sum, s) => sum + s, 0) / b[1].length;
                return avgB - avgA;
            })
            .forEach(([type, severities]) => {
                const avg = (severities.reduce((sum, s) => sum + s, 0) / severities.length).toFixed(1);
                const bar = ChartUtils.progressBar(avg, 10, { width: 20, showPercentage: false });
                console.log(`  ${type.padEnd(20)}: ${bar}`);
            });

        // Calendar heatmap for symptom occurrences
        const dailySymptomCounts = new Map();
        recentSymptoms.forEach(symptom => {
            const date = new Date(symptom.timestamp).toDateString();
            dailySymptomCounts.set(date, (dailySymptomCounts.get(date) || 0) + 1);
        });

        const heatmapData = Array.from(dailySymptomCounts.entries()).map(([date, count]) => ({
            date: date,
            value: count
        }));

        console.log(ChartUtils.calendarHeatmap(heatmapData, {
            title: '\n📅 Symptom Activity Calendar',
            days: Math.min(days, 28)
        }));

        // Overall statistics
        console.log(ChartUtils.statsBox({
            'Total Symptoms': recentSymptoms.length,
            'Unique Types': Object.keys(symptomCounts).length,
            'Most Common': chartData[0].label,
            'Average per Day': (recentSymptoms.length / days).toFixed(1)
        }, `📊 Symptom Summary (${days} days)`));
    }

    // Recovery Progress Visualization
    visualizeRecoveryProgress() {
        console.log('\n🎯 Recovery Progress Visualization');
        console.log('═'.repeat(60));

        // Calculate various metrics
        const totalDays = this.data.profile.accidentDate
            ? Math.floor((new Date() - new Date(this.data.profile.accidentDate)) / (1000 * 60 * 60 * 24))
            : 0;

        if (totalDays === 0) {
            console.log('Set up your profile first to track recovery progress.');
            return;
        }

        console.log(`Days since accident: ${totalDays} days`);
        console.log('');

        // Goals progress
        const activeGoals = this.data.goals.filter(g => !g.completed).length;
        const completedGoals = this.data.goals.filter(g => g.completed).length;
        const totalGoals = this.data.goals.length;

        if (totalGoals > 0) {
            const completionRate = (completedGoals / totalGoals) * 100;
            console.log('📋 Goals Progress:');
            console.log(ChartUtils.progressBar(completedGoals, totalGoals, {
                width: 40
            }));
            console.log(`   ${ChartUtils.percentageWheel(completionRate, 'Complete')}`);
            console.log('');
        }

        // Mood improvement
        if (this.data.moodEntries.length >= 7) {
            const recent7 = this.data.moodEntries.slice(-7).map(m => m.rating);
            const first7 = this.data.moodEntries.slice(0, 7).map(m => m.rating);

            const recentAvg = recent7.reduce((sum, r) => sum + r, 0) / recent7.length;
            const initialAvg = first7.reduce((sum, r) => sum + r, 0) / first7.length;
            const improvement = recentAvg - initialAvg;

            console.log('😊 Mood Improvement:');
            console.log(`   Initial week average: ${initialAvg.toFixed(1)}/10`);
            console.log(`   Recent week average: ${recentAvg.toFixed(1)}/10`);
            console.log(`   Change: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)} ${improvement > 0 ? '📈' : '📉'}`);
            console.log('');
        }

        // Coping strategies effectiveness
        const strategiesWithRatings = this.data.copingStrategies.filter(s => s.effectiveness);
        if (strategiesWithRatings.length > 0) {
            const avgEffectiveness = strategiesWithRatings.reduce((sum, s) => sum + s.effectiveness, 0) / strategiesWithRatings.length;
            console.log('🛠️  Coping Strategies:');
            console.log(`   Average effectiveness: ${avgEffectiveness.toFixed(1)}/10`);
            console.log(ChartUtils.progressBar(avgEffectiveness, 10, {
                width: 40,
                showPercentage: false
            }));
            console.log('');
        }

        // Journal consistency
        if (this.data.journalEntries.length > 0) {
            const last30Days = 30;
            const recentJournals = this.data.journalEntries.filter(j => {
                const daysSince = (new Date() - new Date(j.timestamp)) / (1000 * 60 * 60 * 24);
                return daysSince <= last30Days;
            }).length;

            const consistency = (recentJournals / last30Days) * 100;
            console.log('📝 Journaling Consistency (Last 30 days):');
            console.log(`   ${ChartUtils.percentageWheel(consistency, `(${recentJournals} entries)`)}`);
            console.log('');
        }

        console.log('═'.repeat(60));
        console.log('💪 Keep going! Recovery is a journey, not a destination.');
    }

    // Helper: Calculate trend from data
    calculateTrend(data) {
        if (data.length < 2) return 'Not enough data';

        const recent = data.slice(-3).map(d => d.value);
        const older = data.slice(0, 3).map(d => d.value);

        const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
        const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;

        const diff = recentAvg - olderAvg;

        if (Math.abs(diff) < 0.5) return 'Stable →';
        return diff > 0 ? 'Improving ↗' : 'Declining ↘';
    }

    // Helper: Calculate current mood logging streak
    calculateMoodStreak() {
        if (this.data.moodEntries.length === 0) return 0;

        const sortedEntries = [...this.data.moodEntries]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const uniqueDates = new Set();
        sortedEntries.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            uniqueDates.add(date);
        });

        const today = new Date().toDateString();
        if (!uniqueDates.has(today)) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (!uniqueDates.has(yesterday.toDateString())) {
                return 0;
            }
        }

        let streak = 0;
        const checkDate = new Date();

        while (true) {
            const dateStr = checkDate.toDateString();
            if (uniqueDates.has(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    // Helper: Get longest mood logging streak
    getLongestMoodStreak() {
        if (this.data.moodEntries.length === 0) return 0;

        const uniqueDates = new Set();
        this.data.moodEntries.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            uniqueDates.add(date);
        });

        const sortedDates = Array.from(uniqueDates)
            .map(d => new Date(d))
            .sort((a, b) => a - b);

        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const dayDiff = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);

            if (dayDiff === 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    }

    // Correlation & Insights Analysis
    analyzeInsights() {
        console.log('\n🔍 Mental Health Insights & Correlations');
        console.log('═'.repeat(70));

        const hasEnoughData = this.data.moodEntries.length >= 5;

        if (!hasEnoughData) {
            console.log('\n📊 Not enough data yet for meaningful insights.');
            console.log('   Keep tracking your moods, symptoms, and triggers!');
            console.log('   Come back after at least 5 mood entries for personalized insights.');
            console.log('\n═'.repeat(70));
            return;
        }

        // Analyze each type of correlation
        this.analyzeTriggerMoodCorrelation();
        this.analyzeSymptomMoodCorrelation();
        this.analyzeTemporalPatterns();
        this.analyzeCopingEffectiveness();
        this.analyzeSymptomClusters();

        console.log('\n💡 Remember: These are patterns, not certainties. Use them as conversation');
        console.log('   starters with your therapist or healthcare provider.');
        console.log('═'.repeat(70));
    }

    analyzeTriggerMoodCorrelation() {
        if (this.data.triggers.length === 0 || this.data.moodEntries.length < 5) return;

        console.log('\n⚡ Trigger → Mood Impact:');
        console.log('─'.repeat(70));

        const triggerImpacts = [];

        this.data.triggers.forEach(trigger => {
            // Find mood entries within 24 hours after trigger occurrence
            const triggerDate = new Date(trigger.lastOccurred);
            const dayAfterTrigger = new Date(triggerDate.getTime() + 24 * 60 * 60 * 1000);

            const moodsAfterTrigger = this.data.moodEntries.filter(mood => {
                const moodDate = new Date(mood.timestamp);
                return moodDate >= triggerDate && moodDate <= dayAfterTrigger;
            });

            if (moodsAfterTrigger.length > 0) {
                const avgMoodAfter = moodsAfterTrigger.reduce((sum, m) => sum + m.rating, 0) / moodsAfterTrigger.length;
                const overallAvgMood = this.data.moodEntries.reduce((sum, m) => sum + m.rating, 0) / this.data.moodEntries.length;
                const impact = avgMoodAfter - overallAvgMood;

                triggerImpacts.push({
                    trigger: trigger.description,
                    avgMoodAfter: avgMoodAfter.toFixed(1),
                    impact: impact.toFixed(1),
                    occurrences: trigger.occurrences
                });
            }
        });

        if (triggerImpacts.length === 0) {
            console.log('   No clear trigger-mood correlations detected yet.');
            return;
        }

        // Sort by negative impact (most harmful first)
        triggerImpacts.sort((a, b) => parseFloat(a.impact) - parseFloat(b.impact));

        triggerImpacts.slice(0, 3).forEach((item, index) => {
            const impactNum = parseFloat(item.impact);
            const icon = impactNum < -1.5 ? '🔴' : impactNum < -0.5 ? '🟡' : '🟢';
            const direction = impactNum < 0 ? 'lower' : 'higher';

            console.log(`   ${icon} "${item.trigger}"`);
            console.log(`      Mood after trigger: ${item.avgMoodAfter}/10 (${Math.abs(impactNum).toFixed(1)} points ${direction})`);
            console.log(`      Occurrences: ${item.occurrences}`);
            if (index < 2) console.log('');
        });
    }

    analyzeSymptomMoodCorrelation() {
        if (this.data.symptoms.length === 0 || this.data.moodEntries.length < 5) return;

        console.log('\n🩺 Symptom → Mood Impact:');
        console.log('─'.repeat(70));

        // Group symptoms by type
        const symptomTypes = {};
        this.data.symptoms.forEach(symptom => {
            if (!symptomTypes[symptom.symptomType]) {
                symptomTypes[symptom.symptomType] = [];
            }
            symptomTypes[symptom.symptomType].push(symptom);
        });

        const symptomImpacts = [];

        Object.keys(symptomTypes).forEach(type => {
            const symptoms = symptomTypes[type];

            // Find mood entries on same day as symptoms
            const moodsOnSymptomDays = [];
            symptoms.forEach(symptom => {
                const symptomDate = new Date(symptom.timestamp).toDateString();
                const matchingMoods = this.data.moodEntries.filter(mood =>
                    new Date(mood.timestamp).toDateString() === symptomDate
                );
                moodsOnSymptomDays.push(...matchingMoods);
            });

            if (moodsOnSymptomDays.length > 0) {
                const avgMoodOnSymptomDays = moodsOnSymptomDays.reduce((sum, m) => sum + m.rating, 0) / moodsOnSymptomDays.length;
                const overallAvgMood = this.data.moodEntries.reduce((sum, m) => sum + m.rating, 0) / this.data.moodEntries.length;
                const impact = avgMoodOnSymptomDays - overallAvgMood;
                const avgSeverity = symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length;

                symptomImpacts.push({
                    type: type,
                    avgMood: avgMoodOnSymptomDays.toFixed(1),
                    impact: impact.toFixed(1),
                    avgSeverity: avgSeverity.toFixed(1),
                    count: symptoms.length
                });
            }
        });

        if (symptomImpacts.length === 0) {
            console.log('   No clear symptom-mood correlations detected yet.');
            return;
        }

        // Sort by negative impact
        symptomImpacts.sort((a, b) => parseFloat(a.impact) - parseFloat(b.impact));

        symptomImpacts.slice(0, 3).forEach((item, index) => {
            const impactNum = parseFloat(item.impact);
            const icon = impactNum < -1.5 ? '🔴' : impactNum < -0.5 ? '🟡' : '🟢';

            console.log(`   ${icon} ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`);
            console.log(`      Mood on symptom days: ${item.avgMood}/10 (${Math.abs(impactNum).toFixed(1)} points ${impactNum < 0 ? 'lower' : 'higher'})`);
            console.log(`      Logged ${item.count} times, avg severity: ${item.avgSeverity}/10`);
            if (index < 2) console.log('');
        });
    }

    analyzeTemporalPatterns() {
        if (this.data.moodEntries.length < 7) return;

        console.log('\n📅 Temporal Patterns:');
        console.log('─'.repeat(70));

        // Analyze by day of week
        const dayMoods = {
            0: [], // Sunday
            1: [], // Monday
            2: [], // Tuesday
            3: [], // Wednesday
            4: [], // Thursday
            5: [], // Friday
            6: []  // Saturday
        };

        this.data.moodEntries.forEach(entry => {
            const day = new Date(entry.timestamp).getDay();
            dayMoods[day].push(entry.rating);
        });

        const dayAverages = Object.keys(dayMoods).map(day => {
            const moods = dayMoods[day];
            if (moods.length === 0) return { day: parseInt(day), avg: null, count: 0 };
            const avg = moods.reduce((sum, m) => sum + m, 0) / moods.length;
            return { day: parseInt(day), avg: avg, count: moods.length };
        }).filter(d => d.avg !== null);

        if (dayAverages.length >= 3) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            dayAverages.sort((a, b) => b.avg - a.avg);

            const bestDay = dayAverages[0];
            const worstDay = dayAverages[dayAverages.length - 1];

            console.log(`   📈 Best day: ${dayNames[bestDay.day]} (avg mood: ${bestDay.avg.toFixed(1)}/10)`);
            console.log(`   📉 Challenging day: ${dayNames[worstDay.day]} (avg mood: ${worstDay.avg.toFixed(1)}/10)`);
        }
    }

    analyzeCopingEffectiveness() {
        if (this.data.copingStrategies.length === 0) return;

        const ratedStrategies = this.data.copingStrategies.filter(s => s.effectiveness);

        if (ratedStrategies.length === 0) return;

        console.log('\n💪 Most Effective Coping Strategies:');
        console.log('─'.repeat(70));

        // Sort by effectiveness
        const sorted = [...ratedStrategies].sort((a, b) =>
            parseFloat(b.effectiveness) - parseFloat(a.effectiveness)
        );

        sorted.slice(0, 3).forEach((strategy, index) => {
            const effectiveness = parseFloat(strategy.effectiveness);
            const icon = effectiveness >= 8 ? '⭐' : effectiveness >= 6 ? '✓' : '○';

            console.log(`   ${icon} ${strategy.name} - ${strategy.effectiveness}/10 effectiveness`);
            console.log(`      Used ${strategy.timesUsed} times, ${strategy.ratings.length} ratings`);
            if (index < 2) console.log('');
        });
    }

    analyzeSymptomClusters() {
        if (this.data.symptoms.length < 10) return;

        console.log('\n🔗 Symptom Co-occurrence Patterns:');
        console.log('─'.repeat(70));

        // Group symptoms by day
        const symptomsByDay = {};
        this.data.symptoms.forEach(symptom => {
            const day = new Date(symptom.timestamp).toDateString();
            if (!symptomsByDay[day]) {
                symptomsByDay[day] = [];
            }
            symptomsByDay[day].push(symptom.symptomType);
        });

        // Find days with multiple symptoms
        const coOccurrences = {};
        Object.values(symptomsByDay).forEach(symptoms => {
            if (symptoms.length >= 2) {
                // Count unique symptom pairs
                const uniqueSymptoms = [...new Set(symptoms)];
                for (let i = 0; i < uniqueSymptoms.length; i++) {
                    for (let j = i + 1; j < uniqueSymptoms.length; j++) {
                        const pair = [uniqueSymptoms[i], uniqueSymptoms[j]].sort().join(' + ');
                        coOccurrences[pair] = (coOccurrences[pair] || 0) + 1;
                    }
                }
            }
        });

        const pairs = Object.entries(coOccurrences)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (pairs.length > 0) {
            pairs.forEach(([ pair, count ], index) => {
                console.log(`   🔗 ${pair} - occurred together ${count} times`);
            });
        } else {
            console.log('   No significant symptom clustering detected yet.');
        }
    }

    // Reminder Management
    enableReminders(journalTime = '20:00', checkInTime = '09:00') {
        this.reminderService.enableMentalHealthReminders(journalTime, checkInTime);
        return true;
    }

    disableReminders() {
        this.reminderService.disableMentalHealthReminders();
        return true;
    }

    showReminderStatus() {
        this.reminderService.showStatus();
    }
}

// CLI Interface
function showHelp() {
    console.log(`
🧠 Mental Health Tracker - Help
═══════════════════════════════════════════════════════════
Designed for managing mental health after work accidents

PROFILE:
  profile-setup <accident-date> <description>
      Set up your profile with accident information

  profile
      View your profile

MOOD TRACKING:
  mood <rating> [note]
      Log your mood (1-10 scale)
      Example: node mental-health-tracker.js mood 7 "Feeling better today"

  mood-history [days]
      View mood history (default: 7 days)

JOURNALING:
  journal <content> [type]
      Add journal entry (types: general, incident, therapy, progress)
      Example: node mental-health-tracker.js journal "Had a tough day at therapy" therapy

  view-journal [days] [type]
      View journal entries

SYMPTOMS:
  symptom <type> <severity> [note]
      Log a symptom (severity 1-10)
      Types: anxiety, panic, flashback, nightmare, depression, insomnia,
             irritability, avoidance, hypervigilance, concentration,
             physical-pain, other
      Example: node mental-health-tracker.js symptom anxiety 6 "During meeting"

  view-symptoms [days] [type]
      View symptom history

TRIGGERS:
  add-trigger <description> [intensity]
      Record a new trigger (intensity 1-10)

  log-trigger <trigger-id>
      Log when a trigger occurs

  list-triggers
      View all triggers

COPING STRATEGIES:
  add-coping <name> <description>
      Add a coping strategy

  use-coping <strategy-id> [effectiveness-rating]
      Mark strategy as used and optionally rate effectiveness (1-10)

  list-coping
      View all coping strategies

EMERGENCY:
  add-contact <name> <relationship> <phone> [notes]
      Add emergency contact

  contacts
      View emergency contacts

GOALS:
  add-goal <description> [target-date]
      Set a recovery goal

  complete-goal <goal-id>
      Mark goal as completed

  list-goals [all]
      View goals (use 'all' to include completed)

QUICK ACTIONS:
  checkin
      Quick daily check-in summary

  stats (or statistics)
      Display overall statistics and summary of all tracked data

  insights (or correlations, analyze)
      Analyze patterns and correlations in your data
      🔍 Discover trigger-mood impacts, symptom patterns, best/worst days
      💡 Find most effective coping strategies, symptom clusters
      Requires at least 5 mood entries for meaningful insights

  help
      Show this help message

VISUALIZATIONS:
  mood-trends [days]
      Visualize mood trends with charts (default: 14 days)

  symptom-patterns [days]
      Visualize symptom patterns with heatmap (default: 30 days)

  recovery-progress
      View comprehensive recovery progress dashboard

DATA EXPORT:
  export [directory]
      Export all data to CSV files (default: ./exports)
      Creates separate CSV files for moods, journal, symptoms, triggers, etc.
      Perfect for sharing with healthcare providers or backup

  export-pdf [directory]
      Generate comprehensive PDF report with charts and visualizations
      Includes mood trends, distribution charts, statistics, and summaries
      Perfect for professional meetings or comprehensive review

BACKUP & RESTORE:
  backup [directory]
      Create a timestamped backup of your data (default: ./backups)

  list-backups [directory]
      View all available backups with creation dates and sizes

  restore <backup-filename> [directory]
      Restore data from a backup file
      Current data is automatically backed up before restore

  reminders-on [journal-time] [checkin-time]
      Enable daily reminders for journaling and check-ins
      Default times: journal at 20:00 (8 PM), check-in at 09:00 (9 AM)
      Example: node mental-health-tracker.js reminders-on 21:00 08:00

  reminders-off (or disable-reminders)
      Disable all mental health reminders

  reminders (or reminders-status)
      View current reminder status and settings

═══════════════════════════════════════════════════════════
Remember: This is a personal tracking tool. Always consult with
mental health professionals for proper care and treatment.

Crisis Resources:
  • 988 Suicide & Crisis Lifeline: Call/Text 988
  • Crisis Text Line: Text HOME to 741741
  • SAMHSA Helpline: 1-800-662-4357
═══════════════════════════════════════════════════════════
`);
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const tracker = new MentalHealthTracker();

    switch(command) {
        case 'profile-setup':
            if (args.length < 3) {
                console.log('❌ Usage: profile-setup <accident-date> <description>');
                break;
            }
            tracker.setupProfile(args[1], args.slice(2).join(' '));
            break;

        case 'profile':
            tracker.viewProfile();
            break;

        case 'mood':
            if (args.length < 2) {
                console.log('❌ Usage: mood <rating> [note]');
                break;
            }
            const moodNote = args.slice(2).join(' ');
            tracker.logMood(args[1], moodNote);
            break;

        case 'mood-history':
            const moodDays = args[1] || 7;
            tracker.viewMoodHistory(parseInt(moodDays));
            break;

        case 'journal':
            if (args.length < 2) {
                console.log('❌ Usage: journal <content> [type]');
                break;
            }
            // Last arg might be type if it matches valid types
            const validTypes = ['general', 'incident', 'therapy', 'progress'];
            const lastArg = args[args.length - 1];
            let journalType = 'general';
            let journalContent;

            if (validTypes.includes(lastArg)) {
                journalType = lastArg;
                journalContent = args.slice(1, -1).join(' ');
            } else {
                journalContent = args.slice(1).join(' ');
            }
            tracker.addJournal(journalContent, journalType);
            break;

        case 'view-journal':
            const journalDays = args[1] ? parseInt(args[1]) : 7;
            const journalType2 = args[2] || null;
            tracker.viewJournal(journalDays, journalType2);
            break;

        case 'symptom':
            if (args.length < 3) {
                console.log('❌ Usage: symptom <type> <severity> [note]');
                break;
            }
            const symptomNote = args.slice(3).join(' ');
            tracker.logSymptom(args[1], args[2], symptomNote);
            break;

        case 'view-symptoms':
            const symptomDays = args[1] ? parseInt(args[1]) : 7;
            const symptomType = args[2] || null;
            tracker.viewSymptoms(symptomDays, symptomType);
            break;

        case 'add-trigger':
            if (args.length < 2) {
                console.log('❌ Usage: add-trigger <description> [intensity]');
                break;
            }
            const intensity = args[args.length - 1];
            const isIntensity = !isNaN(intensity) && parseInt(intensity) >= 1 && parseInt(intensity) <= 10;

            if (isIntensity) {
                const triggerDesc = args.slice(1, -1).join(' ');
                tracker.addTrigger(triggerDesc, intensity);
            } else {
                const triggerDesc = args.slice(1).join(' ');
                tracker.addTrigger(triggerDesc);
            }
            break;

        case 'log-trigger':
            if (args.length < 2) {
                console.log('❌ Usage: log-trigger <trigger-id>');
                break;
            }
            tracker.logTriggerOccurrence(args[1]);
            break;

        case 'list-triggers':
            tracker.listTriggers();
            break;

        case 'add-coping':
            if (args.length < 3) {
                console.log('❌ Usage: add-coping <name> <description>');
                break;
            }
            // First word is name, rest is description
            tracker.addCopingStrategy(args[1], args.slice(2).join(' '));
            break;

        case 'use-coping':
            if (args.length < 2) {
                console.log('❌ Usage: use-coping <strategy-id> [effectiveness-rating]');
                break;
            }
            const rating = args[2] || null;
            tracker.useCopingStrategy(args[1], rating);
            break;

        case 'list-coping':
            tracker.listCopingStrategies();
            break;

        case 'add-contact':
            if (args.length < 4) {
                console.log('❌ Usage: add-contact <name> <relationship> <phone> [notes]');
                break;
            }
            const contactNotes = args.slice(4).join(' ');
            tracker.addEmergencyContact(args[1], args[2], args[3], contactNotes);
            break;

        case 'contacts':
            tracker.listEmergencyContacts();
            break;

        case 'add-goal':
            if (args.length < 2) {
                console.log('❌ Usage: add-goal <description> [target-date]');
                break;
            }
            const targetDate = args[args.length - 1];
            const isDate = targetDate.includes('-') || targetDate.includes('/');

            if (isDate && args.length > 2) {
                const goalDesc = args.slice(1, -1).join(' ');
                tracker.addGoal(goalDesc, targetDate);
            } else {
                const goalDesc = args.slice(1).join(' ');
                tracker.addGoal(goalDesc);
            }
            break;

        case 'complete-goal':
            if (args.length < 2) {
                console.log('❌ Usage: complete-goal <goal-id>');
                break;
            }
            tracker.completeGoal(args[1]);
            break;

        case 'list-goals':
            const showAll = args[1] === 'all';
            tracker.listGoals(showAll);
            break;

        case 'checkin':
            tracker.quickCheckIn();
            break;

        case 'stats':
        case 'statistics':
            tracker.showStats();
            break;

        case 'insights':
        case 'correlations':
        case 'analyze':
            tracker.analyzeInsights();
            break;

        case 'mood-trends':
            const trendDays = args[1] ? parseInt(args[1]) : 14;
            tracker.visualizeMoodTrends(trendDays);
            break;

        case 'symptom-patterns':
            const patternDays = args[1] ? parseInt(args[1]) : 30;
            tracker.visualizeSymptomPatterns(patternDays);
            break;

        case 'recovery-progress':
            tracker.visualizeRecoveryProgress();
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
            const journalTime = args[1] || '20:00';
            const checkInTime = args[2] || '09:00';
            tracker.enableReminders(journalTime, checkInTime);
            break;

        case 'reminders-off':
        case 'disable-reminders':
            tracker.disableReminders();
            break;

        case 'reminders-status':
        case 'reminders':
            tracker.showReminderStatus();
            break;

        case 'add-therapist':
            if (!args[1] || !args[2] || !args[3]) {
                console.log('Usage: node mental-health-tracker.js add-therapist <name> <specialty> <phone> [email]');
            } else {
                tracker.addTherapist(args[1], args[2], args[3], args[4]);
            }
            break;

        case 'list-therapists':
        case 'therapists':
            tracker.listTherapists();
            break;

        case 'schedule-session':
            if (!args[1] || !args[2] || !args[3]) {
                console.log('Usage: node mental-health-tracker.js schedule-session <therapist-id> <date> <time> [type]');
                console.log('Example: node mental-health-tracker.js schedule-session 1234567890 "2025-12-01" "14:00" regular');
            } else {
                tracker.scheduleSession(args[1], args[2], args[3], args[4] || 'regular');
            }
            break;

        case 'list-sessions':
        case 'sessions':
            tracker.listSessions(true);
            break;

        case 'all-sessions':
            tracker.listSessions(false);
            break;

        case 'pre-session':
            if (!args[1] || !args[2] || !args[3]) {
                console.log('Usage: node mental-health-tracker.js pre-session <session-id> <mood-1-10> "<notes>"');
            } else {
                tracker.preSessionPrep(args[1], args[2], args[3]);
            }
            break;

        case 'complete-session':
            if (!args[1] || !args[2] || !args[3] || !args[4]) {
                console.log('Usage: node mental-health-tracker.js complete-session <session-id> <post-mood> "<notes>" <effectiveness-1-10>');
            } else {
                tracker.completeSession(args[1], args[2], args[3], args[4]);
            }
            break;

        case 'therapy-analytics':
        case 'therapy-stats':
            tracker.therapyAnalytics();
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

module.exports = MentalHealthTracker;
