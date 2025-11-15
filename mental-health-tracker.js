const fs = require('fs');
const path = require('path');
const ChartUtils = require('./chart-utils');

class MentalHealthTracker {
    constructor(dataFile = 'mental-health-data.json') {
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
            profile: {
                accidentDate: null,
                accidentDescription: null,
                createdAt: new Date().toISOString()
            },
            moodEntries: [],
            journalEntries: [],
            symptoms: [],
            triggers: [],
            copingStrategies: [],
            emergencyContacts: [],
            goals: []
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
            id: Date.now(),
            rating: parseInt(rating),
            note: note,
            timestamp: new Date().toISOString()
        };

        this.data.moodEntries.push(entry);

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

        const recentMoods = this.data.moodEntries.filter(entry => {
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
            const emoji = this.getMoodEmoji(entry.rating);
            console.log(`${emoji} ${entry.rating}/10 - ${date}`);
            if (entry.note) console.log(`   "${entry.note}"`);
            console.log('─'.repeat(60));
        });

        // Calculate average
        const avg = (recentMoods.reduce((sum, e) => sum + e.rating, 0) / recentMoods.length).toFixed(1);
        console.log(`Average Mood: ${avg}/10`);
        console.log('═'.repeat(60));
    }

    // Journal Entries
    addJournal(content, type = 'general') {
        const entry = {
            id: Date.now(),
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
            console.log(`\nNo journal entries found.`);
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
            id: Date.now(),
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
            id: Date.now(),
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
            id: Date.now(),
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
            id: Date.now(),
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
            id: Date.now(),
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
        let goals = showCompleted
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

BACKUP & RESTORE:
  backup [directory]
      Create a timestamped backup of your data (default: ./backups)

  list-backups [directory]
      View all available backups with creation dates and sizes

  restore <backup-filename> [directory]
      Restore data from a backup file
      Current data is automatically backed up before restore

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
