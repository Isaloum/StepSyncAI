const cron = require('node-cron');
const notifier = require('node-notifier');
const fs = require('fs');
const path = require('path');

class ReminderService {
    constructor(configFile = 'reminders-config.json') {
        this.configFile = configFile;
        this.config = this.loadConfig();
        this.scheduledJobs = new Map();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const rawData = fs.readFileSync(this.configFile, 'utf8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.error('Error loading reminder config:', error.message);
        }
        return {
            medication: {
                enabled: false,
                reminders: []
            },
            mentalHealth: {
                enabled: false,
                journalTime: '20:00',
                checkInTime: '09:00'
            },
            aws: {
                enabled: false,
                studyTime: '19:00'
            }
        };
    }

    saveConfig() {
        try {
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving reminder config:', error.message);
            return false;
        }
    }

    // Medication Reminders
    enableMedicationReminders(medications) {
        this.config.medication.enabled = true;
        this.config.medication.reminders = medications.map(med => ({
            id: med.id,
            name: med.name,
            dosage: med.dosage,
            time: med.scheduledTime,
            frequency: med.frequency
        }));
        this.saveConfig();
        this.scheduleMedicationReminders();
        console.log('\n✓ Medication reminders enabled!');
        console.log(`  ${medications.length} medication(s) will send reminders at scheduled times`);
        return true;
    }

    scheduleMedicationReminders() {
        // Clear existing medication reminders
        this.scheduledJobs.forEach((job, key) => {
            if (key.startsWith('med-')) {
                job.stop();
                this.scheduledJobs.delete(key);
            }
        });

        if (!this.config.medication.enabled) return;

        this.config.medication.reminders.forEach(reminder => {
            const [hour, minute] = reminder.time.split(':');
            const cronExpression = `${minute} ${hour} * * *`; // Daily at scheduled time

            const job = cron.schedule(cronExpression, () => {
                this.sendNotification(
                    'Medication Reminder',
                    `Time to take ${reminder.name} (${reminder.dosage})`
                );
                console.log(`\n💊 Medication Reminder: ${reminder.name} (${reminder.dosage})`);
                console.log(`   Scheduled time: ${reminder.time}`);
            });

            this.scheduledJobs.set(`med-${reminder.id}`, job);
        });

        console.log(`   Scheduled ${this.config.medication.reminders.length} medication reminder(s)`);
    }

    disableMedicationReminders() {
        this.config.medication.enabled = false;
        this.saveConfig();

        // Stop all medication reminder jobs
        this.scheduledJobs.forEach((job, key) => {
            if (key.startsWith('med-')) {
                job.stop();
                this.scheduledJobs.delete(key);
            }
        });

        console.log('\n✓ Medication reminders disabled');
        return true;
    }

    // Mental Health Reminders
    enableMentalHealthReminders(journalTime = '20:00', checkInTime = '09:00') {
        this.config.mentalHealth.enabled = true;
        this.config.mentalHealth.journalTime = journalTime;
        this.config.mentalHealth.checkInTime = checkInTime;
        this.saveConfig();
        this.scheduleMentalHealthReminders();
        console.log('\n✓ Mental health reminders enabled!');
        console.log(`  Journal prompt: ${journalTime}`);
        console.log(`  Daily check-in: ${checkInTime}`);
        return true;
    }

    scheduleMentalHealthReminders() {
        // Clear existing mental health reminders
        ['mh-journal', 'mh-checkin'].forEach(key => {
            if (this.scheduledJobs.has(key)) {
                this.scheduledJobs.get(key).stop();
                this.scheduledJobs.delete(key);
            }
        });

        if (!this.config.mentalHealth.enabled) return;

        // Journal reminder
        const [jHour, jMinute] = this.config.mentalHealth.journalTime.split(':');
        const journalJob = cron.schedule(`${jMinute} ${jHour} * * *`, () => {
            this.sendNotification(
                'Journal Reminder',
                'Take a moment to reflect on your day and write in your journal'
            );
            console.log('\n📝 Journal Reminder: Time to write in your journal');
        });
        this.scheduledJobs.set('mh-journal', journalJob);

        // Check-in reminder
        const [cHour, cMinute] = this.config.mentalHealth.checkInTime.split(':');
        const checkinJob = cron.schedule(`${cMinute} ${cHour} * * *`, () => {
            this.sendNotification(
                'Daily Check-in',
                'How are you feeling today? Log your mood and check in with yourself'
            );
            console.log('\n🧠 Daily Check-in: Time to log your mood and check in');
        });
        this.scheduledJobs.set('mh-checkin', checkinJob);
    }

    disableMentalHealthReminders() {
        this.config.mentalHealth.enabled = false;
        this.saveConfig();

        ['mh-journal', 'mh-checkin'].forEach(key => {
            if (this.scheduledJobs.has(key)) {
                this.scheduledJobs.get(key).stop();
                this.scheduledJobs.delete(key);
            }
        });

        console.log('\n✓ Mental health reminders disabled');
        return true;
    }

    // AWS Study Reminders
    enableAWSReminders(studyTime = '19:00') {
        this.config.aws.enabled = true;
        this.config.aws.studyTime = studyTime;
        this.saveConfig();
        this.scheduleAWSReminders();
        console.log('\n✓ AWS study reminders enabled!');
        console.log(`  Study time: ${studyTime} (daily)`);
        return true;
    }

    scheduleAWSReminders() {
        if (this.scheduledJobs.has('aws-study')) {
            this.scheduledJobs.get('aws-study').stop();
            this.scheduledJobs.delete('aws-study');
        }

        if (!this.config.aws.enabled) return;

        const [hour, minute] = this.config.aws.studyTime.split(':');
        const studyJob = cron.schedule(`${minute} ${hour} * * *`, () => {
            this.sendNotification(
                'AWS Study Time',
                'Time for your daily AWS Cloud Practitioner study session!'
            );
            console.log('\n☁️  AWS Study Reminder: Time for your daily study session');
        });
        this.scheduledJobs.set('aws-study', studyJob);
    }

    disableAWSReminders() {
        this.config.aws.enabled = false;
        this.saveConfig();

        if (this.scheduledJobs.has('aws-study')) {
            this.scheduledJobs.get('aws-study').stop();
            this.scheduledJobs.delete('aws-study');
        }

        console.log('\n✓ AWS study reminders disabled');
        return true;
    }

    // Send notification (cross-platform)
    sendNotification(title, message) {
        notifier.notify({
            title: title,
            message: message,
            sound: true,
            wait: false,
            timeout: 10
        });
    }

    // Show current reminder status
    showStatus() {
        console.log('\n📅 Reminder Status');
        console.log('═'.repeat(60));

        console.log('\n💊 Medication Reminders:');
        if (this.config.medication.enabled) {
            console.log('   Status: ✓ Enabled');
            console.log(`   Active reminders: ${this.config.medication.reminders.length}`);
            this.config.medication.reminders.forEach(r => {
                console.log(`   • ${r.name} at ${r.time}`);
            });
        } else {
            console.log('   Status: ✗ Disabled');
        }

        console.log('\n🧠 Mental Health Reminders:');
        if (this.config.mentalHealth.enabled) {
            console.log('   Status: ✓ Enabled');
            console.log(`   Journal prompt: ${this.config.mentalHealth.journalTime}`);
            console.log(`   Daily check-in: ${this.config.mentalHealth.checkInTime}`);
        } else {
            console.log('   Status: ✗ Disabled');
        }

        console.log('\n☁️  AWS Study Reminders:');
        if (this.config.aws.enabled) {
            console.log('   Status: ✓ Enabled');
            console.log(`   Study time: ${this.config.aws.studyTime}`);
        } else {
            console.log('   Status: ✗ Disabled');
        }

        console.log('\n═'.repeat(60));
    }

    // Start all enabled reminders
    startAll() {
        if (this.config.medication.enabled) {
            this.scheduleMedicationReminders();
        }
        if (this.config.mentalHealth.enabled) {
            this.scheduleMentalHealthReminders();
        }
        if (this.config.aws.enabled) {
            this.scheduleAWSReminders();
        }
        console.log('\n✓ All enabled reminders started');
    }

    // Stop all reminders
    stopAll() {
        this.scheduledJobs.forEach((job, key) => {
            job.stop();
        });
        this.scheduledJobs.clear();
        console.log('\n✓ All reminders stopped');
    }
}

module.exports = ReminderService;
