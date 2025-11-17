const fs = require('fs');
const path = require('path');

class ExerciseTracker {
    constructor(dataFile = 'exercise-data.json') {
        this.dataFile = dataFile;
        this.data = this.loadData();

        // Common activity types
        this.activityTypes = {
            cardio: ['Running', 'Walking', 'Cycling', 'Swimming', 'Dancing', 'Hiking', 'Jogging'],
            strength: ['Weightlifting', 'Bodyweight', 'Resistance Training', 'CrossFit'],
            flexibility: ['Yoga', 'Stretching', 'Pilates', 'Tai Chi'],
            sports: ['Basketball', 'Soccer', 'Tennis', 'Volleyball', 'Golf'],
            other: ['Gardening', 'Cleaning', 'Playing with Kids', 'General Activity']
        };
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const rawData = fs.readFileSync(this.dataFile, 'utf8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.error('Error loading exercise data:', error.message);
        }
        return {
            activities: [],
            goals: {
                weeklyMinutes: 150, // WHO recommendation
                weeklyDays: 3
            }
        };
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving exercise data:', error.message);
            return false;
        }
    }

    logActivity(type, duration, intensity, notes = '') {
        // Validate inputs
        if (!type || !duration) {
            console.error('Error: Activity type and duration are required');
            return null;
        }

        // Validate duration (must be positive number)
        const durationNum = parseInt(duration);
        if (isNaN(durationNum) || durationNum <= 0) {
            console.error('Error: Duration must be a positive number (in minutes)');
            return null;
        }

        // Validate intensity (1-10)
        const intensityNum = parseInt(intensity);
        if (isNaN(intensityNum) || intensityNum < 1 || intensityNum > 10) {
            console.error('Error: Intensity must be between 1-10');
            return null;
        }

        const activity = {
            id: Date.now(),
            type: type,
            duration: durationNum,
            intensity: intensityNum,
            notes: notes,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };

        this.data.activities.push(activity);

        if (this.saveData()) {
            console.log('\n✓ Activity logged successfully!');
            console.log(`  Type: ${type}`);
            console.log(`  Duration: ${duration} minutes`);
            console.log(`  Intensity: ${intensity}/10`);
            if (notes) {
                console.log(`  Notes: ${notes}`);
            }

            // Provide feedback
            this.provideFeedback(durationNum, intensityNum);

            return activity;
        }

        return null;
    }

    provideFeedback(duration, intensity) {
        console.log();

        // Duration feedback
        if (duration >= 30) {
            console.log('✓ Great! You met the 30-minute activity recommendation.');
        } else if (duration >= 20) {
            console.log('👍 Good effort! Even 20 minutes makes a difference.');
        } else if (duration >= 10) {
            console.log('💪 Every minute counts! Consider extending next time.');
        }

        // Intensity feedback
        if (intensity >= 7) {
            console.log('🔥 High intensity! Great for cardiovascular health.');
            console.log('   Remember to include rest days for recovery.');
        } else if (intensity >= 4) {
            console.log('😊 Moderate intensity - perfect for sustainable fitness!');
        } else {
            console.log('🚶 Light activity is still beneficial, especially for mental health.');
        }

        // Mental health reminder
        console.log('💚 Exercise boosts mood and reduces anxiety/depression symptoms!');
    }

    getStats() {
        if (this.data.activities.length === 0) {
            console.log('\n📊 Exercise Statistics');
            console.log('═'.repeat(60));
            console.log('No activity data yet. Start logging with: exercise log');
            return;
        }

        const activities = this.data.activities;
        const totalActivities = activities.length;

        // Calculate totals
        const totalMinutes = activities.reduce((sum, a) => sum + a.duration, 0);
        const avgDuration = (totalMinutes / totalActivities).toFixed(1);
        const avgIntensity = (activities.reduce((sum, a) => sum + a.intensity, 0) / totalActivities).toFixed(1);

        // Last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentActivities = activities.filter(a => new Date(a.timestamp) > sevenDaysAgo);
        const recentMinutes = recentActivities.reduce((sum, a) => sum + a.duration, 0);

        // Activity type breakdown
        const typeBreakdown = {};
        activities.forEach(a => {
            typeBreakdown[a.type] = (typeBreakdown[a.type] || 0) + 1;
        });
        const favoriteType = Object.entries(typeBreakdown)
            .sort((a, b) => b[1] - a[1])[0];

        // Goal progress
        const weeklyGoal = this.data.goals.weeklyMinutes;
        const weeklyProgress = ((recentMinutes / weeklyGoal) * 100).toFixed(0);

        console.log('\n📊 Exercise Statistics');
        console.log('═'.repeat(60));
        console.log(`\nTotal Activities Logged: ${totalActivities}`);
        console.log(`Total Time: ${totalMinutes} minutes (${(totalMinutes / 60).toFixed(1)} hours)`);

        console.log(`\n⏱️  Average Session:`);
        console.log(`   Duration: ${avgDuration} minutes`);
        console.log(`   Intensity: ${avgIntensity}/10`);

        console.log(`\n📅 Last 7 Days:`);
        console.log(`   Activities: ${recentActivities.length}`);
        console.log(`   Total Time: ${recentMinutes} minutes`);
        console.log(`   Days Active: ${new Set(recentActivities.map(a => a.date)).size}/7`);

        console.log(`\n🎯 Weekly Goal Progress:`);
        console.log(`   Target: ${weeklyGoal} minutes/week`);
        console.log(`   This Week: ${recentMinutes} minutes (${weeklyProgress}%)`);
        if (recentMinutes >= weeklyGoal) {
            console.log(`   ✅ Goal achieved! Excellent work!`);
        } else {
            const remaining = weeklyGoal - recentMinutes;
            console.log(`   ${remaining} minutes to goal`);
        }

        if (favoriteType) {
            console.log(`\n⭐ Most Common Activity: ${favoriteType[0]} (${favoriteType[1]} times)`);
        }

        // Streaks
        this.analyzeStreaks();

        console.log('\n═'.repeat(60));
    }

    analyzeStreaks() {
        if (this.data.activities.length < 2) return;

        // Get unique active days, sorted
        const activeDays = [...new Set(this.data.activities.map(a => a.date))].sort();

        let currentStreak = 1;
        let maxStreak = 1;

        for (let i = 1; i < activeDays.length; i++) {
            const prevDate = new Date(activeDays[i - 1]);
            const currDate = new Date(activeDays[i]);
            const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        // Check if streak is still active (last activity was today or yesterday)
        const lastActivityDate = new Date(activeDays[activeDays.length - 1]);
        const today = new Date();
        const daysSinceLastActivity = Math.floor((today - lastActivityDate) / (1000 * 60 * 60 * 24));

        console.log(`\n🔥 Streaks:`);
        console.log(`   Best Streak: ${maxStreak} consecutive days`);
        if (daysSinceLastActivity <= 1) {
            console.log(`   Current Streak: ${currentStreak} days 🔥`);
        } else {
            console.log(`   Current Streak: 0 days (last activity: ${daysSinceLastActivity} days ago)`);
        }
    }

    getHistory(days = 7) {
        if (this.data.activities.length === 0) {
            console.log('\n📅 Activity History');
            console.log('═'.repeat(60));
            console.log('No activity data yet.');
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentActivities = this.data.activities
            .filter(a => new Date(a.timestamp) > cutoffDate)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        console.log(`\n📅 Activity History (Last ${days} Days)`);
        console.log('═'.repeat(60));

        if (recentActivities.length === 0) {
            console.log(`No activities in the last ${days} days.`);
            return;
        }

        recentActivities.forEach((activity, index) => {
            console.log(`\n${index + 1}. ${activity.date}`);
            console.log(`   ${this.getActivityEmoji(activity.type)} ${activity.type} - ${activity.duration} min`);
            console.log(`   Intensity: ${this.getIntensityBar(activity.intensity)} ${activity.intensity}/10`);
            if (activity.notes) {
                console.log(`   Notes: ${activity.notes}`);
            }
        });

        console.log('\n═'.repeat(60));
    }

    getActivityEmoji(type) {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('run') || lowerType.includes('jog')) return '🏃';
        if (lowerType.includes('walk')) return '🚶';
        if (lowerType.includes('cycl') || lowerType.includes('bike')) return '🚴';
        if (lowerType.includes('swim')) return '🏊';
        if (lowerType.includes('yoga') || lowerType.includes('stretch')) return '🧘';
        if (lowerType.includes('weight') || lowerType.includes('strength')) return '🏋️';
        if (lowerType.includes('danc')) return '💃';
        if (lowerType.includes('hik')) return '🥾';
        return '💪';
    }

    getIntensityBar(intensity) {
        const filled = Math.floor(intensity / 2);
        const empty = 5 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    getInsights() {
        if (this.data.activities.length < 5) {
            console.log('\n🔍 Exercise Insights');
            console.log('═'.repeat(60));
            console.log('\n📊 Not enough data yet for meaningful insights.');
            console.log('   Log at least 5 activities to see patterns!');
            return;
        }

        console.log('\n🔍 Exercise Insights & Patterns');
        console.log('═'.repeat(60));

        this.analyzeIntensityPatterns();
        this.analyzeTimingPatterns();
        this.analyzeActivityPreferences();

        console.log('\n💡 Remember: Regular physical activity is one of the most effective');
        console.log('   treatments for anxiety, depression, and PTSD symptoms.');
        console.log('\n═'.repeat(60));
    }

    analyzeIntensityPatterns() {
        const activities = this.data.activities;

        const lowIntensity = activities.filter(a => a.intensity < 4).length;
        const moderateIntensity = activities.filter(a => a.intensity >= 4 && a.intensity < 7).length;
        const highIntensity = activities.filter(a => a.intensity >= 7).length;

        console.log('\n🔥 Intensity Distribution:');
        const total = activities.length;
        console.log(`   Light (1-3): ${lowIntensity} activities (${((lowIntensity/total)*100).toFixed(0)}%)`);
        console.log(`   Moderate (4-6): ${moderateIntensity} activities (${((moderateIntensity/total)*100).toFixed(0)}%)`);
        console.log(`   Vigorous (7-10): ${highIntensity} activities (${((highIntensity/total)*100).toFixed(0)}%)`);

        // Recommendations
        if (moderateIntensity / total >= 0.6) {
            console.log('   ✓ Good balance! Moderate intensity is sustainable and effective.');
        } else if (highIntensity / total > 0.6) {
            console.log('   ⚠️  Mostly high intensity. Consider adding recovery days.');
        } else if (lowIntensity / total > 0.7) {
            console.log('   💡 Mostly light activity. Try gradually increasing intensity.');
        }
    }

    analyzeTimingPatterns() {
        if (this.data.activities.length < 7) return;

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayData = Array(7).fill(0).map(() => []);

        this.data.activities.forEach(activity => {
            const day = new Date(activity.timestamp).getDay();
            dayData[day].push(activity);
        });

        const dayCounts = dayData.map((activities, day) => ({
            day: dayNames[day],
            count: activities.length,
            totalMinutes: activities.reduce((sum, a) => sum + a.duration, 0)
        })).filter(d => d.count >= 2).sort((a, b) => b.count - a.count);

        if (dayCounts.length >= 2) {
            const mostActive = dayCounts[0];
            console.log(`\n📅 Most Active Day: ${mostActive.day}s`);
            console.log(`   ${mostActive.count} activities, ${mostActive.totalMinutes} total minutes`);
        }
    }

    analyzeActivityPreferences() {
        const typeStats = {};

        this.data.activities.forEach(activity => {
            if (!typeStats[activity.type]) {
                typeStats[activity.type] = {
                    count: 0,
                    totalMinutes: 0,
                    avgIntensity: 0,
                    intensities: []
                };
            }
            typeStats[activity.type].count++;
            typeStats[activity.type].totalMinutes += activity.duration;
            typeStats[activity.type].intensities.push(activity.intensity);
        });

        // Calculate averages
        Object.keys(typeStats).forEach(type => {
            const stat = typeStats[type];
            stat.avgIntensity = (stat.intensities.reduce((sum, i) => sum + i, 0) / stat.count).toFixed(1);
        });

        // Find most engaging (highest avg intensity)
        const mostEngaging = Object.entries(typeStats)
            .sort((a, b) => parseFloat(b[1].avgIntensity) - parseFloat(a[1].avgIntensity))[0];

        if (mostEngaging) {
            console.log(`\n💪 Most Intense Activity: ${mostEngaging[0]}`);
            console.log(`   Average intensity: ${mostEngaging[1].avgIntensity}/10`);
            console.log(`   Total time: ${mostEngaging[1].totalMinutes} minutes across ${mostEngaging[1].count} sessions`);
        }
    }

    setGoals(weeklyMinutes, weeklyDays) {
        if (weeklyMinutes) {
            this.data.goals.weeklyMinutes = parseInt(weeklyMinutes);
        }
        if (weeklyDays) {
            this.data.goals.weeklyDays = parseInt(weeklyDays);
        }

        if (this.saveData()) {
            console.log('\n🎯 Goals Updated!');
            console.log(`   Weekly Minutes: ${this.data.goals.weeklyMinutes}`);
            console.log(`   Weekly Days: ${this.data.goals.weeklyDays}`);
            return true;
        }
        return false;
    }

    // Export method for integration with mood/sleep trackers
    getActivityDataForCorrelation() {
        return this.data.activities.map(activity => ({
            date: activity.date,
            type: activity.type,
            duration: activity.duration,
            intensity: activity.intensity,
            timestamp: activity.timestamp
        }));
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    const tracker = new ExerciseTracker();

    switch (command) {
        case 'log':
        case 'add':
            const type = args[1];
            const duration = args[2];
            const intensity = args[3];
            const notes = args.slice(4).join(' ');
            tracker.logActivity(type, duration, intensity, notes);
            break;

        case 'stats':
        case 'statistics':
            tracker.getStats();
            break;

        case 'history':
            const days = args[1] ? parseInt(args[1]) : 7;
            tracker.getHistory(days);
            break;

        case 'insights':
        case 'analyze':
            tracker.getInsights();
            break;

        case 'goals':
        case 'set-goals':
            const weeklyMinutes = args[1];
            const weeklyDays = args[2];
            tracker.setGoals(weeklyMinutes, weeklyDays);
            break;

        case 'types':
        case 'activities':
            console.log('\n💪 Common Activity Types');
            console.log('═'.repeat(60));
            Object.entries(tracker.activityTypes).forEach(([category, types]) => {
                console.log(`\n${category.toUpperCase()}:`);
                types.forEach(type => console.log(`  - ${type}`));
            });
            console.log('\n💡 You can use any activity type you like!');
            console.log('═'.repeat(60));
            break;

        case 'help':
        default:
            console.log('\n💪 Exercise Tracker - Track physical activity for better health');
            console.log('═'.repeat(60));
            console.log('\nCommands:');
            console.log('  log <type> <duration> <intensity> [notes]');
            console.log('      Log an activity');
            console.log('      Example: node exercise-tracker.js log Running 30 7 "Morning run"');
            console.log('      - Type: Activity type (Running, Yoga, Walking, etc.)');
            console.log('      - Duration: Minutes');
            console.log('      - Intensity: 1-10 (1=very light, 10=maximum effort)');
            console.log('');
            console.log('  stats / statistics');
            console.log('      View exercise statistics and goal progress');
            console.log('');
            console.log('  history [days]');
            console.log('      View activity history (default: last 7 days)');
            console.log('      Example: node exercise-tracker.js history 14');
            console.log('');
            console.log('  insights / analyze');
            console.log('      Discover patterns in your exercise data');
            console.log('');
            console.log('  goals <weekly-minutes> [weekly-days]');
            console.log('      Set exercise goals');
            console.log('      Example: node exercise-tracker.js goals 150 5');
            console.log('');
            console.log('  types / activities');
            console.log('      Show common activity types');
            console.log('');
            console.log('  help');
            console.log('      Show this help message');
            console.log('\n💡 Tips:');
            console.log('   - WHO recommends 150 minutes/week of moderate activity');
            console.log('   - Exercise improves mood, sleep, and reduces anxiety');
            console.log('   - Even 10 minutes makes a difference!');
            console.log('   - Mix different types of activities for best results');
            console.log('═'.repeat(60));
            break;
    }
}

module.exports = ExerciseTracker;
