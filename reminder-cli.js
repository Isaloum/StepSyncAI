#!/usr/bin/env node

const ReminderManager = require('./reminder-manager');
const readline = require('readline');

/**
 * Reminder CLI - Interactive interface for Smart Notifications & Reminders
 *
 * Commands:
 * - list: Show all reminders
 * - check: Check for due reminders now
 * - create: Create a new reminder interactively
 * - medication: Create medication reminder
 * - exercise: Create exercise reminder
 * - sleep: Create sleep reminder
 * - custom: Create custom reminder
 * - toggle <id>: Enable/disable a reminder
 * - delete <id>: Delete a reminder
 * - snooze <id> [minutes]: Snooze a reminder
 * - stats: View compliance statistics
 * - help: Show help
 */

class ReminderCLI {
    constructor() {
        this.manager = new ReminderManager();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Show help message
     */
    showHelp() {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║     Smart Notifications & Reminders - StepSyncAI          ║
╚════════════════════════════════════════════════════════════╝

COMMANDS:

  📋 Managing Reminders:
     list                   Show all reminders
     check                  Check for due reminders now
     toggle <id>            Enable/disable a reminder
     delete <id>            Delete a reminder
     stats                  View compliance statistics

  ➕ Creating Reminders:
     create                 Create a reminder interactively
     medication             Create medication reminder
     exercise               Create exercise reminder
     sleep                  Create sleep reminder
     custom                 Create custom reminder

  🔔 Reminder Actions:
     snooze <id> [mins]     Snooze a reminder (default: 15 min)
     dismiss <id>           Dismiss a reminder

  ℹ️  Help:
     help                   Show this help message

EXAMPLES:

  node reminder-cli.js list
  node reminder-cli.js create
  node reminder-cli.js medication
  node reminder-cli.js exercise
  node reminder-cli.js sleep
  node reminder-cli.js check
  node reminder-cli.js toggle abc-123
  node reminder-cli.js snooze abc-123 30
  node reminder-cli.js stats

═══════════════════════════════════════════════════════════
`);
    }

    /**
     * Prompt user for input
     */
    prompt(question) {
        return new Promise(resolve => {
            this.rl.question(question, answer => {
                resolve(answer.trim());
            });
        });
    }

    /**
     * Create a reminder interactively
     */
    async createInteractive() {
        console.log('\n🔔 Create New Reminder\n');
        console.log('═'.repeat(60));

        const type = await this.prompt('\nReminder type (medication/exercise/sleep/custom): ');
        if (!['medication', 'exercise', 'sleep', 'custom'].includes(type)) {
            console.log('❌ Invalid reminder type');
            return;
        }

        const title = await this.prompt('Title: ');
        if (!title) {
            console.log('❌ Title is required');
            return;
        }

        const message = await this.prompt('Message (optional, press Enter to use title): ');
        const time = await this.prompt('Time (HH:mm format, e.g., 08:30): ');

        if (!/^\d{2}:\d{2}$/.test(time)) {
            console.log('❌ Invalid time format. Use HH:mm (e.g., 08:30)');
            return;
        }

        const daysInput = await this.prompt('Days (daily or comma-separated: monday,wednesday,friday): ');
        let days = 'daily';
        if (daysInput && daysInput.toLowerCase() !== 'daily') {
            days = daysInput.split(',').map(d => d.trim().toLowerCase());
        }

        try {
            this.manager.createReminder({
                type,
                title,
                message: message || title,
                time,
                days
            });
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Create medication reminder
     */
    async createMedicationReminder() {
        console.log('\n💊 Create Medication Reminder\n');
        console.log('═'.repeat(60));

        const name = await this.prompt('\nMedication name: ');
        if (!name) {
            console.log('❌ Medication name is required');
            return;
        }

        const dosage = await this.prompt('Dosage (e.g., 500mg): ');
        const time = await this.prompt('Time (HH:mm format, e.g., 08:00): ');

        if (!/^\d{2}:\d{2}$/.test(time)) {
            console.log('❌ Invalid time format. Use HH:mm');
            return;
        }

        const frequency = await this.prompt('Frequency (e.g., daily, 3 times per week): ');

        try {
            this.manager.createMedicationReminder({
                name,
                dosage,
                frequency: frequency || 'daily',
                time
            });
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Create exercise reminder
     */
    async createExerciseReminder() {
        console.log('\n🏃 Create Exercise Reminder\n');
        console.log('═'.repeat(60));

        const title = await this.prompt('\nReminder title (default: Exercise Time): ');
        const time = await this.prompt('Time (HH:mm format, default: 18:00): ');

        const timeToUse = time || '18:00';
        if (!/^\d{2}:\d{2}$/.test(timeToUse)) {
            console.log('❌ Invalid time format. Use HH:mm');
            return;
        }

        const daysInput = await this.prompt('Days (daily or comma-separated days): ');
        let days = 'daily';
        if (daysInput && daysInput.toLowerCase() !== 'daily') {
            days = daysInput.split(',').map(d => d.trim().toLowerCase());
        }

        try {
            this.manager.createExerciseReminder({
                title: title || 'Exercise Time',
                time: timeToUse,
                days
            });
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Create sleep reminder
     */
    async createSleepReminder() {
        console.log('\n😴 Create Sleep Reminder\n');
        console.log('═'.repeat(60));

        const bedtime = await this.prompt('\nBedtime (HH:mm format, default: 22:00): ');
        const wakeup = await this.prompt('Wake-up time (HH:mm format, default: 06:00): ');

        const bedtimeToUse = bedtime || '22:00';
        const wakeupToUse = wakeup || '06:00';

        if (!/^\d{2}:\d{2}$/.test(bedtimeToUse) || !/^\d{2}:\d{2}$/.test(wakeupToUse)) {
            console.log('❌ Invalid time format. Use HH:mm');
            return;
        }

        try {
            this.manager.createSleepReminder({
                bedtime: bedtimeToUse,
                wakeup: wakeupToUse
            });
            console.log('   Created 2 reminders: Bedtime and Wake-up');
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Check for due reminders
     */
    checkDueReminders() {
        const dueReminders = this.manager.getDueReminders();

        if (dueReminders.length === 0) {
            console.log('\n✅ No reminders due right now');
            return;
        }

        console.log(`\n🔔 ${dueReminders.length} Reminder(s) Due Now!\n`);
        console.log('═'.repeat(60));

        dueReminders.forEach((reminder, index) => {
            console.log(`\n${index + 1}. ${reminder.title}`);
            console.log(`   ${reminder.message}`);
            console.log(`   Type: ${reminder.type} | Time: ${reminder.time}`);
            console.log(`   ID: ${reminder.id}`);

            // Mark as shown
            this.manager.markAsShown(reminder.id);
        });

        console.log('\n' + '═'.repeat(60));
        console.log('Use "snooze <id> [minutes]" or "dismiss <id>" to manage');
    }

    /**
     * Toggle reminder
     */
    toggleReminder(id) {
        try {
            this.manager.toggleReminder(id);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Delete reminder
     */
    deleteReminder(id) {
        try {
            this.manager.deleteReminder(id);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Snooze reminder
     */
    snoozeReminder(id, minutes = 15) {
        try {
            this.manager.snoozeReminder(id, minutes);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Dismiss reminder
     */
    dismissReminder(id) {
        try {
            this.manager.dismissReminder(id);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Show compliance statistics
     */
    showStats() {
        const stats = this.manager.getComplianceStats();

        console.log('\n📊 Reminder Compliance Statistics\n');
        console.log('═'.repeat(60));

        console.log('\n📋 Overview:');
        console.log(`   Total reminders: ${stats.total}`);
        console.log(`   Enabled: ${stats.enabled}`);
        console.log(`   Disabled: ${stats.total - stats.enabled}`);

        console.log('\n📊 By Type:');
        Object.entries(stats.byType).forEach(([type, count]) => {
            const emoji = {
                medication: '💊',
                exercise: '🏃',
                sleep: '😴',
                custom: '⚡'
            }[type] || '📌';
            console.log(`   ${emoji} ${type}: ${count}`);
        });

        const complianceEntries = Object.entries(stats.compliance);
        if (complianceEntries.length > 0) {
            console.log('\n✅ Compliance Rates:');
            complianceEntries.forEach(([id, data]) => {
                const emoji = {
                    medication: '💊',
                    exercise: '🏃',
                    sleep: '😴',
                    custom: '⚡'
                }[data.type] || '📌';

                console.log(`\n   ${emoji} ${data.title}`);
                console.log(`      Shown: ${data.shown} times`);
                console.log(`      Responded: ${data.dismissed + data.snoozed} times`);
                console.log(`      Compliance: ${data.complianceRate}%`);
            });
        } else {
            console.log('\n   No compliance data yet. Reminders need to be shown first.');
        }

        console.log('\n' + '═'.repeat(60));
    }

    /**
     * Run the CLI
     */
    async run() {
        const args = process.argv.slice(2);
        const command = args[0] || 'help';

        switch (command.toLowerCase()) {
            case 'list':
                this.manager.displayReminders();
                this.rl.close();
                break;

            case 'check':
                this.checkDueReminders();
                this.rl.close();
                break;

            case 'create':
                await this.createInteractive();
                this.rl.close();
                break;

            case 'medication':
            case 'med':
                await this.createMedicationReminder();
                this.rl.close();
                break;

            case 'exercise':
            case 'ex':
                await this.createExerciseReminder();
                this.rl.close();
                break;

            case 'sleep':
                await this.createSleepReminder();
                this.rl.close();
                break;

            case 'custom':
                await this.createInteractive();
                this.rl.close();
                break;

            case 'toggle':
                if (!args[1]) {
                    console.log('❌ Usage: toggle <reminder-id>');
                } else {
                    this.toggleReminder(args[1]);
                }
                this.rl.close();
                break;

            case 'delete':
            case 'remove':
                if (!args[1]) {
                    console.log('❌ Usage: delete <reminder-id>');
                } else {
                    this.deleteReminder(args[1]);
                }
                this.rl.close();
                break;

            case 'snooze':
                if (!args[1]) {
                    console.log('❌ Usage: snooze <reminder-id> [minutes]');
                } else {
                    const minutes = args[2] ? parseInt(args[2]) : 15;
                    this.snoozeReminder(args[1], minutes);
                }
                this.rl.close();
                break;

            case 'dismiss':
                if (!args[1]) {
                    console.log('❌ Usage: dismiss <reminder-id>');
                } else {
                    this.dismissReminder(args[1]);
                }
                this.rl.close();
                break;

            case 'stats':
            case 'statistics':
                this.showStats();
                this.rl.close();
                break;

            case 'help':
            case '--help':
            case '-h':
            default:
                this.showHelp();
                this.rl.close();
                break;
        }
    }
}

// Run the CLI if executed directly
if (require.main === module) {
    const cli = new ReminderCLI();
    cli.run().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = ReminderCLI;
