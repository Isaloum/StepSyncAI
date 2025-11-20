const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * GoalManager - Goal Setting & Achievement System
 *
 * Features:
 * - SMART goal creation and tracking
 * - Progress monitoring with percentages
 * - Streak counters for consecutive days
 * - Achievement badges and milestones
 * - Goal-based reminders integration
 * - Success rate analytics
 * - Weekly/monthly goal summaries
 */
class GoalManager {
    constructor(dashboard, dataDir = './data') {
        this.dashboard = dashboard;
        this.dataDir = dataDir;
        this.goalsFile = path.join(dataDir, 'goals.json');
        this.achievementsFile = path.join(dataDir, 'achievements.json');
        this.goals = this.loadGoals();
        this.achievements = this.loadAchievements();
    }

    /**
     * Load goals from file
     */
    loadGoals() {
        try {
            if (fs.existsSync(this.goalsFile)) {
                const data = fs.readFileSync(this.goalsFile, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading goals:', error.message);
        }
        return [];
    }

    /**
     * Save goals to file
     */
    saveGoals() {
        try {
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }
            fs.writeFileSync(
                this.goalsFile,
                JSON.stringify(this.goals, null, 2),
                'utf-8'
            );
            return true;
        } catch (error) {
            console.error('Error saving goals:', error.message);
            return false;
        }
    }

    /**
     * Load achievements from file
     */
    loadAchievements() {
        try {
            if (fs.existsSync(this.achievementsFile)) {
                const data = fs.readFileSync(this.achievementsFile, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading achievements:', error.message);
        }
        return [];
    }

    /**
     * Save achievements to file
     */
    saveAchievements() {
        try {
            fs.writeFileSync(
                this.achievementsFile,
                JSON.stringify(this.achievements, null, 2),
                'utf-8'
            );
            return true;
        } catch (error) {
            console.error('Error saving achievements:', error.message);
            return false;
        }
    }

    /**
     * Create a new SMART goal
     *
     * @param {Object} goalData - Goal configuration
     * @returns {Object} Created goal
     */
    createGoal(goalData) {
        const {
            type,
            title,
            description,
            target,
            duration,
            startDate = new Date().toISOString().split('T')[0],
            metric = null,
            frequency = 'daily'
        } = goalData;

        // Validate required fields
        if (!type || !title || !target || !duration) {
            throw new Error('Missing required fields: type, title, target, duration');
        }

        // Validate goal type
        const validTypes = ['sleep', 'exercise', 'mood', 'medication', 'custom'];
        if (!validTypes.includes(type)) {
            throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
        }

        // Calculate end date
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + duration);

        const goal = {
            id: uuidv4(),
            type,
            title,
            description: description || title,
            target,
            duration,
            startDate,
            endDate: end.toISOString().split('T')[0],
            metric,
            frequency,
            status: 'active',
            progress: {
                current: 0,
                percentage: 0,
                streak: 0,
                maxStreak: 0,
                daysCompleted: 0,
                lastCompletedDate: null
            },
            milestones: this.generateMilestones(duration),
            createdAt: new Date().toISOString(),
            completedAt: null,
            history: []
        };

        this.goals.push(goal);
        this.saveGoals();

        console.log(`\n✅ Goal created successfully!`);
        console.log(`   ${this.getGoalEmoji(type)} ${title}`);
        console.log(`   Target: ${this.formatTarget(target, type)}`);
        console.log(`   Duration: ${duration} days`);
        console.log(`   Start: ${startDate} → End: ${goal.endDate}`);

        return goal;
    }

    /**
     * Generate milestones for a goal
     */
    generateMilestones(duration) {
        const milestones = [];
        const percentages = [25, 50, 75, 100];

        percentages.forEach(pct => {
            milestones.push({
                percentage: pct,
                days: Math.ceil((duration * pct) / 100),
                reached: false,
                reachedAt: null
            });
        });

        return milestones;
    }

    /**
     * Get all goals
     *
     * @param {Object} filters - Optional filters
     * @returns {Array} Filtered goals
     */
    getGoals(filters = {}) {
        let filtered = [...this.goals];

        if (filters.type) {
            filtered = filtered.filter(g => g.type === filters.type);
        }

        if (filters.status) {
            filtered = filtered.filter(g => g.status === filters.status);
        }

        if (filters.active !== undefined) {
            filtered = filtered.filter(g => {
                const isActive = g.status === 'active' && new Date(g.endDate) >= new Date();
                return filters.active ? isActive : !isActive;
            });
        }

        return filtered;
    }

    /**
     * Get specific goal by ID
     */
    getGoal(id) {
        return this.goals.find(g => g.id === id);
    }

    /**
     * Update goal progress
     *
     * @param {string} goalId - Goal ID
     * @param {Object} data - Today's data
     * @returns {Object} Updated goal
     */
    updateProgress(goalId, data) {
        const goal = this.getGoal(goalId);
        if (!goal) {
            throw new Error(`Goal not found: ${goalId}`);
        }

        if (goal.status !== 'active') {
            throw new Error(`Goal is not active: ${goal.status}`);
        }

        const today = data.date || new Date().toISOString().split('T')[0];
        const isCompleted = this.checkGoalCompletion(goal, data);

        // Update progress
        if (isCompleted) {
            goal.progress.daysCompleted++;

            // Update streak
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (goal.progress.lastCompletedDate === yesterdayStr) {
                // Continue streak
                goal.progress.streak++;
            } else if (goal.progress.lastCompletedDate !== today) {
                // Start new streak
                goal.progress.streak = 1;
            }

            // Update max streak
            if (goal.progress.streak > goal.progress.maxStreak) {
                goal.progress.maxStreak = goal.progress.streak;
            }

            goal.progress.lastCompletedDate = today;
        } else {
            // Reset streak if not completed today
            if (goal.progress.lastCompletedDate !== today) {
                goal.progress.streak = 0;
            }
        }

        // Calculate percentage
        goal.progress.percentage = Math.round((goal.progress.daysCompleted / goal.duration) * 100);

        // Check milestones
        this.checkMilestones(goal);

        // Check if goal is complete
        if (goal.progress.percentage >= 100) {
            goal.status = 'completed';
            goal.completedAt = new Date().toISOString();
            this.unlockAchievement(goal);
            console.log(`\n🎉 GOAL COMPLETED! ${goal.title}`);
        }

        // Add to history
        goal.history.push({
            date: today,
            completed: isCompleted,
            value: this.getValueFromData(goal, data),
            streak: goal.progress.streak
        });

        this.saveGoals();
        return goal;
    }

    /**
     * Check if goal is completed for given data
     */
    checkGoalCompletion(goal, data) {
        switch (goal.type) {
            case 'sleep':
                return data.sleep_hours && data.sleep_hours >= goal.target;
            case 'exercise':
                return data.exercise_minutes && data.exercise_minutes >= goal.target;
            case 'mood':
                return data.mood && data.mood >= goal.target;
            case 'medication':
                // Check if medication was taken (would need medication tracking data)
                return true; // Simplified for now
            case 'custom':
                return data[goal.metric] && data[goal.metric] >= goal.target;
            default:
                return false;
        }
    }

    /**
     * Get value from data for goal type
     */
    getValueFromData(goal, data) {
        switch (goal.type) {
            case 'sleep':
                return data.sleep_hours || 0;
            case 'exercise':
                return data.exercise_minutes || 0;
            case 'mood':
                return data.mood || 0;
            case 'custom':
                return data[goal.metric] || 0;
            default:
                return 0;
        }
    }

    /**
     * Check and update milestones
     */
    checkMilestones(goal) {
        goal.milestones.forEach(milestone => {
            if (!milestone.reached && goal.progress.daysCompleted >= milestone.days) {
                milestone.reached = true;
                milestone.reachedAt = new Date().toISOString();

                console.log(`\n🎯 Milestone Reached! ${milestone.percentage}% of "${goal.title}"`);
                console.log(`   ${goal.progress.daysCompleted}/${goal.duration} days completed!`);
            }
        });
    }

    /**
     * Unlock achievement for completed goal
     */
    unlockAchievement(goal) {
        const achievement = {
            id: uuidv4(),
            goalId: goal.id,
            title: `${goal.title} - Completed!`,
            description: goal.description,
            type: goal.type,
            earnedAt: new Date().toISOString(),
            badge: this.getBadge(goal),
            stats: {
                duration: goal.duration,
                daysCompleted: goal.progress.daysCompleted,
                maxStreak: goal.progress.maxStreak,
                successRate: Math.round((goal.progress.daysCompleted / goal.duration) * 100)
            }
        };

        this.achievements.push(achievement);
        this.saveAchievements();

        console.log(`\n🏆 Achievement Unlocked!`);
        console.log(`   ${achievement.badge} ${achievement.title}`);
        console.log(`   Max Streak: ${achievement.stats.maxStreak} days 🔥`);

        return achievement;
    }

    /**
     * Get badge emoji based on goal
     */
    getBadge(goal) {
        if (goal.progress.maxStreak >= 30) return '🥇'; // Gold
        if (goal.progress.maxStreak >= 14) return '🥈'; // Silver
        if (goal.progress.maxStreak >= 7) return '🥉'; // Bronze
        return '🏅'; // Participation
    }

    /**
     * Delete a goal
     */
    deleteGoal(id) {
        const index = this.goals.findIndex(g => g.id === id);
        if (index === -1) {
            throw new Error(`Goal not found: ${id}`);
        }

        const goal = this.goals[index];
        this.goals.splice(index, 1);
        this.saveGoals();

        console.log(`✅ Goal deleted: ${goal.title}`);
        return true;
    }

    /**
     * Archive a goal
     */
    archiveGoal(id) {
        const goal = this.getGoal(id);
        if (!goal) {
            throw new Error(`Goal not found: ${id}`);
        }

        goal.status = 'archived';
        goal.archivedAt = new Date().toISOString();
        this.saveGoals();

        console.log(`📦 Goal archived: ${goal.title}`);
        return goal;
    }

    /**
     * Get goal statistics
     */
    getGoalStats(goalId = null) {
        const goals = goalId
            ? [this.getGoal(goalId)].filter(Boolean)
            : this.goals;

        const stats = {
            total: goals.length,
            active: goals.filter(g => g.status === 'active').length,
            completed: goals.filter(g => g.status === 'completed').length,
            archived: goals.filter(g => g.status === 'archived').length,
            byType: {},
            averageCompletion: 0,
            totalStreak: 0,
            longestStreak: 0
        };

        let totalProgress = 0;

        goals.forEach(goal => {
            // Count by type
            stats.byType[goal.type] = (stats.byType[goal.type] || 0) + 1;

            // Calculate averages
            totalProgress += goal.progress.percentage;
            stats.totalStreak += goal.progress.streak;

            if (goal.progress.maxStreak > stats.longestStreak) {
                stats.longestStreak = goal.progress.maxStreak;
            }
        });

        stats.averageCompletion = goals.length > 0
            ? Math.round(totalProgress / goals.length)
            : 0;

        return stats;
    }

    /**
     * Get achievements
     */
    getAchievements(filters = {}) {
        let filtered = [...this.achievements];

        if (filters.type) {
            filtered = filtered.filter(a => a.type === filters.type);
        }

        // Sort by earned date (newest first)
        filtered.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));

        return filtered;
    }

    /**
     * Update all active goals with today's data
     */
    updateAllGoals(todayData) {
        const activeGoals = this.getGoals({ status: 'active' });
        const results = [];

        activeGoals.forEach(goal => {
            try {
                const updated = this.updateProgress(goal.id, todayData);
                results.push({
                    goal: updated,
                    success: true
                });
            } catch (error) {
                results.push({
                    goal,
                    success: false,
                    error: error.message
                });
            }
        });

        return results;
    }

    /**
     * Get goal emoji
     */
    getGoalEmoji(type) {
        const emojis = {
            sleep: '😴',
            exercise: '🏃',
            mood: '😊',
            medication: '💊',
            custom: '🎯'
        };
        return emojis[type] || '🎯';
    }

    /**
     * Format target for display
     */
    formatTarget(target, type) {
        switch (type) {
            case 'sleep':
                return `${target} hours/night`;
            case 'exercise':
                return `${target} minutes/day`;
            case 'mood':
                return `${target}/10 rating`;
            case 'medication':
                return 'Complete compliance';
            default:
                return target;
        }
    }

    /**
     * Display all goals
     */
    displayGoals() {
        if (this.goals.length === 0) {
            console.log('\n📭 No goals set yet.');
            console.log('   Use the CLI to create your first goal!');
            return;
        }

        console.log('\n🎯 Your Goals\n');
        console.log('═'.repeat(70));

        const byStatus = {
            active: this.goals.filter(g => g.status === 'active'),
            completed: this.goals.filter(g => g.status === 'completed'),
            archived: this.goals.filter(g => g.status === 'archived')
        };

        // Active goals
        if (byStatus.active.length > 0) {
            console.log('\n🔥 ACTIVE GOALS\n');

            byStatus.active.forEach(goal => {
                console.log(`  ${this.getGoalEmoji(goal.type)} ${goal.title}`);
                console.log(`     Progress: ${goal.progress.percentage}% (${goal.progress.daysCompleted}/${goal.duration} days)`);
                console.log(`     Streak: ${goal.progress.streak} days 🔥 (Max: ${goal.progress.maxStreak})`);
                console.log(`     Target: ${this.formatTarget(goal.target, goal.type)}`);
                console.log(`     Ends: ${goal.endDate}`);
                console.log(`     ID: ${goal.id}`);
                console.log('');
            });
        }

        // Completed goals
        if (byStatus.completed.length > 0) {
            console.log('\n✅ COMPLETED GOALS\n');

            byStatus.completed.forEach(goal => {
                console.log(`  ${this.getGoalEmoji(goal.type)} ${goal.title}`);
                console.log(`     Completed: ${new Date(goal.completedAt).toLocaleDateString()}`);
                console.log(`     Max Streak: ${goal.progress.maxStreak} days 🔥`);
                console.log('');
            });
        }

        console.log('═'.repeat(70));
        console.log(`Total: ${this.goals.length} goals (${byStatus.active.length} active, ${byStatus.completed.length} completed)`);
    }

    /**
     * Display achievements
     */
    displayAchievements() {
        if (this.achievements.length === 0) {
            console.log('\n🏆 No achievements yet.');
            console.log('   Complete goals to unlock achievements!');
            return;
        }

        console.log('\n🏆 Your Achievements\n');
        console.log('═'.repeat(70));

        this.achievements.forEach((achievement, index) => {
            console.log(`\n${index + 1}. ${achievement.badge} ${achievement.title}`);
            console.log(`   ${achievement.description}`);
            console.log(`   Earned: ${new Date(achievement.earnedAt).toLocaleDateString()}`);
            console.log(`   Max Streak: ${achievement.stats.maxStreak} days 🔥`);
            console.log(`   Success Rate: ${achievement.stats.successRate}%`);
        });

        console.log('\n' + '═'.repeat(70));
        console.log(`Total Achievements: ${this.achievements.length}`);
    }
}

module.exports = GoalManager;
