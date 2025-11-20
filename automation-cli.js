#!/usr/bin/env node

const AutomationManager = require('./automation-manager');

/**
 * Automation CLI - Manage automated workflows and schedules
 *
 * Commands:
 * - start: Start automation system
 * - stop: Stop automation system
 * - status: Show automation status
 * - workflows: List all workflows
 * - summary: Show daily summary
 * - help: Show help
 */

class AutomationCLI {
    constructor() {
        this.automation = new AutomationManager();
    }

    /**
     * Show help message
     */
    showHelp() {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║     Automation & Workflows System - StepSyncAI            ║
╚════════════════════════════════════════════════════════════╝

COMMANDS:

  🤖 Automation Control:
     start                  Start automation system
     stop                   Stop automation system
     status                 Show automation status
     summary                Generate daily wellness summary

  ⚡ Workflow Management:
     workflows              List all automation workflows
     add-smart-reminder     Add smart conditional reminder

  📊 Scheduled Tasks:
     - Daily check-in reminder (8:00 PM)
     - Reminder checks (every 5 minutes)
     - Weekly wellness report (Sunday 9:00 AM)
     - Auto-update goals (midnight)

  ℹ️  Help:
     help                   Show this help message

FEATURES:

  🔄 Automated Workflows:
     • Low sleep alert (if < 6 hours for 3 days)
     • Goal at risk notification
     • Pattern-based smart reminders
     • Custom if-this-then-that rules

  📅 Scheduled Tasks:
     • Daily wellness check-in prompts
     • Automatic reminder notifications
     • Weekly PDF report generation
     • Goal progress auto-updates

  🧠 Smart Integrations:
     • Analytics-driven insights
     • Goal-based reminders
     • Pattern detection
     • Adaptive notifications

EXAMPLES:

  # Start the automation system
  node automation-cli.js start

  # View status
  node automation-cli.js status

  # Show daily summary
  node automation-cli.js summary

  # List workflows
  node automation-cli.js workflows

NOTE: The automation system runs scheduled tasks in the background.
      Keep the process running to maintain automations.

═══════════════════════════════════════════════════════════
`);
    }

    /**
     * Start automation
     */
    start() {
        try {
            this.automation.start();

            console.log('\n📅 Scheduled Tasks:');
            console.log('   • Daily check-in: 8:00 PM');
            console.log('   • Reminder checks: Every 5 minutes');
            console.log('   • Weekly report: Sunday 9:00 AM');
            console.log('   • Goal updates: Midnight');

            console.log('\n💡 Tip: Keep this process running to maintain automations');
            console.log('   Press Ctrl+C to stop\n');

            // Keep process alive
            setInterval(() => {
                // Execute workflows periodically
                this.automation.executeWorkflows();
            }, 60000); // Every minute

        } catch (error) {
            console.error('❌ Error starting automation:', error.message);
        }
    }

    /**
     * Stop automation
     */
    stop() {
        try {
            this.automation.stop();
        } catch (error) {
            console.error('❌ Error stopping automation:', error.message);
        }
    }

    /**
     * Show status
     */
    showStatus() {
        const status = this.automation.getStatus();

        console.log('\n🤖 Automation System Status\n');
        console.log('═'.repeat(60));

        console.log(`\n📊 Overview:`);
        console.log(`   Status: ${status.enabled ? '✅ Running' : '⏸️  Stopped'}`);
        console.log(`   Scheduled Tasks: ${status.scheduledTasks}`);
        console.log(`   Total Workflows: ${status.workflows}`);
        console.log(`   Active Workflows: ${status.activeWorkflows}`);

        console.log('\n' + '═'.repeat(60));
    }

    /**
     * List workflows
     */
    listWorkflows() {
        this.automation.listWorkflows();
    }

    /**
     * Show daily summary
     */
    showSummary() {
        this.automation.generateDailySummary();
    }

    /**
     * Add smart reminder
     */
    async addSmartReminder() {
        console.log('\n🧠 Add Smart Reminder\n');
        console.log('Available types:');
        console.log('  1. Low Sleep Alert');
        console.log('  2. Goal At Risk Alert');

        // For now, add both default workflows
        this.automation.addSmartReminder({ type: 'low_sleep' });
        this.automation.addSmartReminder({ type: 'goal_at_risk' });

        console.log('\n✅ Smart reminders configured!');
    }

    /**
     * Run the CLI
     */
    run() {
        const args = process.argv.slice(2);
        const command = args[0] || 'help';

        switch (command.toLowerCase()) {
            case 'start':
                this.start();
                break;

            case 'stop':
                this.stop();
                break;

            case 'status':
                this.showStatus();
                break;

            case 'workflows':
                this.listWorkflows();
                break;

            case 'summary':
                this.showSummary();
                break;

            case 'add-smart-reminder':
                this.addSmartReminder();
                break;

            case 'help':
            case '--help':
            case '-h':
            default:
                this.showHelp();
                break;
        }
    }
}

// Run the CLI if executed directly
if (require.main === module) {
    const cli = new AutomationCLI();
    cli.run();
}

module.exports = AutomationCLI;
