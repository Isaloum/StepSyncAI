const cron = require('node-cron');
const DailyDashboard = require('./daily-dashboard');
const AnalyticsEngine = require('./analytics-engine');
const ReminderManager = require('./reminder-manager');
const GoalManager = require('./goal-manager');
const ReportGenerator = require('./report-generator');

/**
 * AutomationManager - Intelligent Automation & Workflow System
 *
 * Features:
 * - Scheduled tasks (daily check-ins, weekly reports)
 * - Workflow engine (if-this-then-that rules)
 * - Smart reminders based on patterns
 * - Auto-update goals from daily data
 * - Conditional notifications
 * - Integration between all systems
 */
class AutomationManager {
    constructor(options = {}) {
        this.dashboard = options.dashboard || new DailyDashboard();
        this.analytics = options.analytics || new AnalyticsEngine(this.dashboard);
        this.reminderManager = options.reminderManager || new ReminderManager(this.dashboard);
        this.goalManager = options.goalManager || new GoalManager(this.dashboard);
        this.reportGenerator = options.reportGenerator || new ReportGenerator(this.dashboard, this.analytics);

        this.scheduledTasks = [];
        this.workflows = [];
        this.enabled = false;
    }

    /**
     * Start automation system
     */
    start() {
        if (this.enabled) {
            console.log('⚠️  Automation already running');
            return;
        }

        console.log('🤖 Starting Automation System...\n');

        // Schedule default tasks
        this.scheduleDailyCheckIn();
        this.scheduleReminderChecks();
        this.scheduleWeeklyReport();
        this.scheduleGoalUpdates();

        this.enabled = true;
        console.log('✅ Automation system started!');
        console.log(`   Active tasks: ${this.scheduledTasks.length}`);
    }

    /**
     * Stop automation system
     */
    stop() {
        if (!this.enabled) {
            console.log('⚠️  Automation not running');
            return;
        }

        console.log('🛑 Stopping Automation System...');

        // Stop all scheduled tasks
        this.scheduledTasks.forEach(task => {
            if (task.stop) {
                task.stop();
            }
        });

        this.scheduledTasks = [];
        this.enabled = false;

        console.log('✅ Automation system stopped');
    }

    /**
     * Schedule daily wellness check-in
     */
    scheduleDailyCheckIn(time = '20:00') {
        const task = cron.schedule(`0 ${time.split(':')[1]} ${time.split(':')[0]} * * *`, () => {
            console.log('\n📋 Daily Check-In Reminder');
            console.log('Time to log your wellness data for today!');
            console.log('Run: npm run mental');
        });

        this.scheduledTasks.push(task);
        console.log(`📋 Scheduled daily check-in at ${time}`);
        return task;
    }

    /**
     * Schedule reminder checks (every 5 minutes)
     */
    scheduleReminderChecks() {
        const task = cron.schedule('*/5 * * * *', () => {
            const dueReminders = this.reminderManager.getDueReminders();

            if (dueReminders.length > 0) {
                console.log(`\n🔔 ${dueReminders.length} Reminder(s) Due!\n`);

                dueReminders.forEach(reminder => {
                    console.log(`  ${this.reminderManager.getGoalEmoji(reminder.type)} ${reminder.title}`);
                    console.log(`     ${reminder.message}`);
                    this.reminderManager.markAsShown(reminder.id);
                });

                console.log('\nRun: npm run reminders:list to view all reminders');
            }
        });

        this.scheduledTasks.push(task);
        console.log('🔔 Scheduled reminder checks (every 5 minutes)');
        return task;
    }

    /**
     * Schedule weekly wellness report
     */
    scheduleWeeklyReport(day = 0, time = '09:00') {
        // day: 0 = Sunday, 1 = Monday, etc.
        const task = cron.schedule(`0 ${time.split(':')[1]} ${time.split(':')[0]} * * ${day}`, () => {
            console.log('\n📊 Generating Weekly Wellness Report...');

            try {
                const reportPath = this.reportGenerator.generatePDFReport({
                    days: 7,
                    title: 'Weekly Wellness Report'
                });

                console.log('✅ Weekly report generated!');
                console.log(`   Check: ${reportPath}`);
            } catch (error) {
                console.error('❌ Error generating report:', error.message);
            }
        });

        this.scheduledTasks.push(task);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        console.log(`📊 Scheduled weekly report on ${dayNames[day]} at ${time}`);
        return task;
    }

    /**
     * Schedule goal progress updates (daily at midnight)
     */
    scheduleGoalUpdates() {
        const task = cron.schedule('0 0 * * *', () => {
            console.log('\n🎯 Auto-updating goal progress...');

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const yesterdayData = this.dashboard.getEntry(yesterdayStr);

            if (yesterdayData) {
                const results = this.goalManager.updateAllGoals(yesterdayData);
                const updated = results.filter(r => r.success).length;

                console.log(`✅ Updated ${updated} goal(s) with yesterday's data`);
            } else {
                console.log('⚠️  No data from yesterday to update goals');
            }
        });

        this.scheduledTasks.push(task);
        console.log('🎯 Scheduled daily goal updates (midnight)');
        return task;
    }

    /**
     * Add custom workflow rule
     *
     * @param {Object} workflow - Workflow configuration
     * @returns {string} Workflow ID
     */
    addWorkflow(workflow) {
        const {
            name,
            condition,
            action,
            enabled = true
        } = workflow;

        if (!name || !condition || !action) {
            throw new Error('Workflow must have name, condition, and action');
        }

        const workflowId = `wf-${Date.now()}`;
        const newWorkflow = {
            id: workflowId,
            name,
            condition,
            action,
            enabled,
            createdAt: new Date().toISOString(),
            lastTriggered: null,
            triggerCount: 0
        };
        this.workflows.push(newWorkflow);

        console.log(`✅ Workflow added: ${name} (${workflowId})`);
        return newWorkflow;
    }

    /**
     * Execute workflows based on conditions
     */
    executeWorkflows() {
        if (!this.enabled) {
            return;
        }

        const enabledWorkflows = this.workflows.filter(w => w.enabled);

        enabledWorkflows.forEach(workflow => {
            try {
                // Evaluate condition
                const context = {
                    dashboard: this.dashboard,
                    analytics: this.analytics,
                    goals: this.goalManager,
                    reminders: this.reminderManager
                };

                const shouldTrigger = workflow.condition(context);

                if (shouldTrigger) {
                    console.log(`\n⚡ Workflow triggered: ${workflow.name}`);

                    // Execute action
                    workflow.action(context);

                    // Update workflow stats
                    workflow.lastTriggered = new Date().toISOString();
                    workflow.triggerCount++;
                }
            } catch (error) {
                console.error(`❌ Workflow error (${workflow.name}):`, error.message);
            }
        });
    }

    /**
     * Add smart reminder based on patterns
     */
    addSmartReminder(options = {}) {
        const { type, threshold, message } = options;

        // Example: Add reminder if sleep is consistently low
        if (type === 'low_sleep') {
            this.addWorkflow({
                name: 'Low Sleep Alert',
                condition: (context) => {
                    const recentEntries = context.dashboard.getAllEntries().slice(-3);
                    const sleepHours = recentEntries
                        .filter(e => e.sleep_hours)
                        .map(e => e.sleep_hours);

                    const avgSleep = sleepHours.length > 0
                        ? sleepHours.reduce((sum, h) => sum + h, 0) / sleepHours.length
                        : 0;

                    return avgSleep < (threshold || 6);
                },
                action: (context) => {
                    console.log('⚠️  Low sleep detected for 3 consecutive days!');
                    console.log(message || '   Consider setting an earlier bedtime.');

                    // Could create a reminder here
                    // context.reminders.createReminder(...)
                }
            });
        }

        // Example: Motivational reminder for goal progress
        if (type === 'goal_at_risk') {
            this.addWorkflow({
                name: 'Goal At Risk Alert',
                condition: (context) => {
                    const activeGoals = context.goals.getGoals({ status: 'active' });
                    return activeGoals.some(goal => {
                        const daysLeft = Math.ceil(
                            (new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24)
                        );
                        const progressRate = goal.progress.percentage / goal.duration;
                        const requiredRate = 100 / goal.duration;

                        return daysLeft > 0 && progressRate < requiredRate * 0.7;
                    });
                },
                action: (context) => {
                    console.log('⚠️  One or more goals are falling behind!');
                    console.log(message || '   You can do it! Small steps lead to big changes.');
                }
            });
        }
    }

    /**
     * Generate daily summary
     */
    generateDailySummary() {
        const today = new Date().toISOString().split('T')[0];
        const todayData = this.dashboard.getEntry(today);

        console.log('\n📊 Daily Summary\n');
        console.log('═'.repeat(60));

        if (!todayData) {
            console.log('\n⚠️  No data logged for today yet.');
            console.log('   Run: npm run mental to log your wellness data');
            return;
        }

        // Wellness data
        if (todayData.mood) {
            console.log(`\n😊 Mood: ${todayData.mood}/10`);
        }
        if (todayData.sleep_hours) {
            console.log(`😴 Sleep: ${todayData.sleep_hours} hours`);
        }
        if (todayData.exercise_minutes) {
            console.log(`🏃 Exercise: ${todayData.exercise_minutes} minutes`);
        }

        // Goal progress
        const activeGoals = this.goalManager.getGoals({ status: 'active' });
        if (activeGoals.length > 0) {
            console.log('\n🎯 Goal Progress:');
            activeGoals.forEach(goal => {
                console.log(`   ${goal.title}: ${goal.progress.percentage}% | Streak: ${goal.progress.streak} 🔥`);
            });
        }

        // Upcoming reminders
        const upcomingReminders = this.reminderManager.getReminders({ enabled: true });
        if (upcomingReminders.length > 0) {
            console.log('\n🔔 Active Reminders:');
            upcomingReminders.slice(0, 3).forEach(reminder => {
                console.log(`   ${reminder.time} - ${reminder.title}`);
            });
        }

        console.log('\n' + '═'.repeat(60));
    }

    /**
     * Get automation status
     */
    getStatus() {
        return {
            enabled: this.enabled,
            scheduledTasks: this.scheduledTasks.length,
            workflows: this.workflows.length,
            activeWorkflows: this.workflows.filter(w => w.enabled).length
        };
    }

    /**
     * List all workflows
     */
    listWorkflows() {
        if (this.workflows.length === 0) {
            console.log('\n📭 No workflows configured yet.');
            return;
        }

        console.log('\n⚡ Automation Workflows\n');
        console.log('═'.repeat(60));

        this.workflows.forEach((workflow, index) => {
            const status = workflow.enabled ? '✅' : '⏸️';
            console.log(`\n${index + 1}. ${status} ${workflow.name}`);
            console.log(`   ID: ${workflow.id}`);
            console.log(`   Triggered: ${workflow.triggerCount} times`);
            if (workflow.lastTriggered) {
                console.log(`   Last: ${new Date(workflow.lastTriggered).toLocaleString()}`);
            }
        });

        console.log('\n' + '═'.repeat(60));
    }
}

module.exports = AutomationManager;
