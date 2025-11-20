#!/usr/bin/env node

const DailyDashboard = require('./daily-dashboard');
const GoalManager = require('./goal-manager');
const readline = require('readline');

/**
 * Goal CLI - Interactive interface for Goal Setting & Achievements
 *
 * Commands:
 * - list: Show all goals
 * - create: Create a new goal
 * - progress: Update goal progress
 * - stats: View goal statistics
 * - achievements: Display achievements
 * - delete <id>: Delete a goal
 * - archive <id>: Archive a goal
 * - help: Show help
 */

class GoalCLI {
    constructor() {
        this.dashboard = new DailyDashboard();
        this.goalManager = new GoalManager(this.dashboard);
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
║     Goal Setting & Achievement System - StepSyncAI        ║
╚════════════════════════════════════════════════════════════╝

COMMANDS:

  🎯 Managing Goals:
     list                   Show all goals
     create                 Create a new SMART goal
     progress              Update goal progress
     delete <id>            Delete a goal
     archive <id>           Archive a goal

  📊 Statistics & Achievements:
     stats                  View goal statistics
     achievements           Display unlocked achievements
     leaderboard            Show streak leaderboard

  ℹ️  Help:
     help                   Show this help message

GOAL TYPES:

  😴 Sleep Goals          - Target hours of sleep per night
  🏃 Exercise Goals       - Target minutes of exercise per day
  😊 Mood Goals           - Minimum mood rating to maintain
  💊 Medication Goals     - Medication compliance goals
  🎯 Custom Goals         - Any custom wellness metric

EXAMPLES:

  # Create a sleep goal
  node goal-cli.js create

  # View all goals
  node goal-cli.js list

  # Update progress for today
  node goal-cli.js progress

  # View achievements
  node goal-cli.js achievements

  # Delete a goal
  node goal-cli.js delete abc-123

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
     * Create a new goal interactively
     */
    async createGoal() {
        console.log('\n🎯 Create New SMART Goal\n');
        console.log('═'.repeat(60));

        console.log('\nGoal Types:');
        console.log('  1. 😴 Sleep Goal');
        console.log('  2. 🏃 Exercise Goal');
        console.log('  3. 😊 Mood Goal');
        console.log('  4. 💊 Medication Goal');
        console.log('  5. 🎯 Custom Goal');

        const typeChoice = await this.prompt('\nSelect goal type (1-5): ');
        const typeMap = {
            '1': 'sleep',
            '2': 'exercise',
            '3': 'mood',
            '4': 'medication',
            '5': 'custom'
        };

        const type = typeMap[typeChoice];
        if (!type) {
            console.log('❌ Invalid goal type');
            return;
        }

        const title = await this.prompt('\nGoal title (e.g., "Sleep 8 hours daily"): ');
        if (!title) {
            console.log('❌ Title is required');
            return;
        }

        const description = await this.prompt('Description (optional): ');

        let target;
        switch (type) {
            case 'sleep':
                target = await this.prompt('Target hours per night (e.g., 8): ');
                break;
            case 'exercise':
                target = await this.prompt('Target minutes per day (e.g., 30): ');
                break;
            case 'mood':
                target = await this.prompt('Minimum mood rating (1-10): ');
                break;
            case 'medication':
                target = 1; // Binary: compliance or not
                break;
            case 'custom':
                target = await this.prompt('Target value: ');
                break;
        }

        target = parseFloat(target);
        if (isNaN(target)) {
            console.log('❌ Invalid target value');
            return;
        }

        const duration = await this.prompt('Duration in days (e.g., 21, 30): ');
        const durationNum = parseInt(duration);
        if (isNaN(durationNum) || durationNum < 1) {
            console.log('❌ Invalid duration');
            return;
        }

        const startDate = await this.prompt('Start date (YYYY-MM-DD, or press Enter for today): ');

        try {
            const goalData = {
                type,
                title,
                description: description || title,
                target,
                duration: durationNum
            };

            if (startDate) {
                goalData.startDate = startDate;
            }

            this.goalManager.createGoal(goalData);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * List all goals
     */
    listGoals() {
        this.goalManager.displayGoals();
    }

    /**
     * Update goal progress with today's data
     */
    async updateProgress() {
        const activeGoals = this.goalManager.getGoals({ status: 'active' });

        if (activeGoals.length === 0) {
            console.log('\n📭 No active goals to update.');
            return;
        }

        console.log('\n📊 Update Goal Progress\n');
        console.log('═'.repeat(60));

        // Get today's data from dashboard
        const today = new Date().toISOString().split('T')[0];
        let todayData = this.dashboard.getEntry(today);

        if (!todayData) {
            console.log('\nNo data logged for today yet.');
            const logNow = await this.prompt('Would you like to log today\'s data? (y/n): ');

            if (logNow.toLowerCase() === 'y') {
                todayData = await this.logTodayData();
            } else {
                return;
            }
        }

        // Update all goals
        console.log('\n🔄 Updating goal progress...\n');
        const results = this.goalManager.updateAllGoals(todayData);

        results.forEach(result => {
            if (result.success) {
                const goal = result.goal;
                console.log(`${this.goalManager.getGoalEmoji(goal.type)} ${goal.title}`);
                console.log(`   Progress: ${goal.progress.percentage}% | Streak: ${goal.progress.streak} days 🔥`);
            } else {
                console.log(`❌ ${result.goal.title}: ${result.error}`);
            }
        });
    }

    /**
     * Log today's data interactively
     */
    async logTodayData() {
        const data = {
            date: new Date().toISOString().split('T')[0]
        };

        const mood = await this.prompt('\nMood (1-10): ');
        if (mood) data.mood = parseInt(mood);

        const sleep = await this.prompt('Sleep hours: ');
        if (sleep) data.sleep_hours = parseFloat(sleep);

        const exercise = await this.prompt('Exercise minutes: ');
        if (exercise) data.exercise_minutes = parseInt(exercise);

        // Add entry to dashboard
        this.dashboard.addEntry(data);

        console.log('\n✅ Today\'s data logged!');
        return data;
    }

    /**
     * Show goal statistics
     */
    showStats() {
        const stats = this.goalManager.getGoalStats();

        console.log('\n📊 Goal Statistics\n');
        console.log('═'.repeat(60));

        console.log(`\n📋 Overview:`);
        console.log(`   Total Goals: ${stats.total}`);
        console.log(`   Active: ${stats.active}`);
        console.log(`   Completed: ${stats.completed}`);
        console.log(`   Archived: ${stats.archived}`);
        console.log(`   Average Completion: ${stats.averageCompletion}%`);

        console.log(`\n🔥 Streaks:`);
        console.log(`   Longest Streak: ${stats.longestStreak} days`);
        console.log(`   Total Active Streaks: ${stats.totalStreak} days`);

        if (Object.keys(stats.byType).length > 0) {
            console.log(`\n📊 By Type:`);
            Object.entries(stats.byType).forEach(([type, count]) => {
                const emoji = this.goalManager.getGoalEmoji(type);
                console.log(`   ${emoji} ${type}: ${count} goal(s)`);
            });
        }

        console.log('\n' + '═'.repeat(60));
    }

    /**
     * Display achievements
     */
    showAchievements() {
        this.goalManager.displayAchievements();
    }

    /**
     * Show streak leaderboard
     */
    showLeaderboard() {
        const goals = this.goalManager.getGoals();

        if (goals.length === 0) {
            console.log('\n🏆 No goals to display in leaderboard.');
            return;
        }

        // Sort by max streak
        const sorted = [...goals].sort((a, b) => b.progress.maxStreak - a.progress.maxStreak);

        console.log('\n🏆 Streak Leaderboard\n');
        console.log('═'.repeat(60));

        sorted.slice(0, 10).forEach((goal, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
            console.log(`\n${medal} ${index + 1}. ${goal.title}`);
            console.log(`   Max Streak: ${goal.progress.maxStreak} days 🔥`);
            console.log(`   Current Streak: ${goal.progress.streak} days`);
            console.log(`   Status: ${goal.status}`);
        });

        console.log('\n' + '═'.repeat(60));
    }

    /**
     * Delete a goal
     */
    deleteGoal(id) {
        try {
            this.goalManager.deleteGoal(id);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Archive a goal
     */
    archiveGoal(id) {
        try {
            this.goalManager.archiveGoal(id);
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Run the CLI
     */
    async run() {
        const args = process.argv.slice(2);
        const command = args[0] || 'help';

        switch (command.toLowerCase()) {
            case 'list':
                this.listGoals();
                this.rl.close();
                break;

            case 'create':
                await this.createGoal();
                this.rl.close();
                break;

            case 'progress':
            case 'update':
                await this.updateProgress();
                this.rl.close();
                break;

            case 'stats':
            case 'statistics':
                this.showStats();
                this.rl.close();
                break;

            case 'achievements':
            case 'badges':
                this.showAchievements();
                this.rl.close();
                break;

            case 'leaderboard':
            case 'streaks':
                this.showLeaderboard();
                this.rl.close();
                break;

            case 'delete':
            case 'remove':
                if (!args[1]) {
                    console.log('❌ Usage: delete <goal-id>');
                } else {
                    this.deleteGoal(args[1]);
                }
                this.rl.close();
                break;

            case 'archive':
                if (!args[1]) {
                    console.log('❌ Usage: archive <goal-id>');
                } else {
                    this.archiveGoal(args[1]);
                }
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
    const cli = new GoalCLI();
    cli.run().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = GoalCLI;
