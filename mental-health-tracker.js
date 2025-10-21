const fs = require('fs');
const path = require('path');

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

  help
      Show this help message

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
