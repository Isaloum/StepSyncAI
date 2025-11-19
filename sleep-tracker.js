const fs = require('fs');
const path = require('path');
const ValidationUtils = require('./validation-utils');

class SleepTracker {
    constructor(dataFile = 'sleep-data.json') {
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
            console.error('Error loading sleep data:', error.message);
        }
        return {
            sleepEntries: []
        };
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving sleep data:', error.message);
            return false;
        }
    }

    calculateDuration(bedtime, wakeTime) {
        // Parse times in HH:MM format
        const [bedHour, bedMin] = bedtime.split(':').map(Number);
        const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);

        // Convert to minutes from midnight
        let bedMinutes = bedHour * 60 + bedMin;
        let wakeMinutes = wakeHour * 60 + wakeMin;

        // Handle overnight sleep (bedtime is before midnight, wake time is after)
        if (wakeMinutes < bedMinutes) {
            wakeMinutes += 24 * 60; // Add 24 hours in minutes
        }

        const durationMinutes = wakeMinutes - bedMinutes;
        return (durationMinutes / 60).toFixed(1); // Return hours with 1 decimal
    }

    logSleep(bedtime, wakeTime, quality, notes = '') {
        // Validate inputs
        if (!bedtime || !wakeTime) {
            console.error('\n❌ Error: Bedtime and wake time are required');
            console.log('💡 Usage: node sleep-tracker.js log <bedtime> <wakeTime> <quality> [notes]\n');
            return null;
        }

        // Validate time format using ValidationUtils
        if (!ValidationUtils.validateTime(bedtime, 'bedtime') || !ValidationUtils.validateTime(wakeTime, 'wake time')) {
            console.log('💡 Example: node sleep-tracker.js log 22:30 06:30 8 "Good sleep"\n');
            return null;
        }

        // Validate quality using ValidationUtils
        const qualityNum = ValidationUtils.parseInteger(quality, {
            min: 1,
            max: 10,
            fieldName: 'sleep quality'
        });

        if (qualityNum === null) {
            console.log('💡 Quality should be a number from 1 (terrible) to 10 (perfect)\n');
            return null;
        }

        const duration = parseFloat(this.calculateDuration(bedtime, wakeTime));
        const entry = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            bedtime: bedtime,
            wakeTime: wakeTime,
            duration: duration,
            quality: qualityNum,
            notes: notes,
            timestamp: new Date().toISOString()
        };

        this.data.sleepEntries.push(entry);

        if (this.saveData()) {
            console.log('\n✓ Sleep entry logged successfully!');
            console.log(`  Date: ${entry.date}`);
            console.log(`  Bedtime: ${bedtime} → Wake: ${wakeTime}`);
            console.log(`  Duration: ${duration} hours`);
            console.log(`  Quality: ${quality}/10`);
            if (notes) {
                console.log(`  Notes: ${notes}`);
            }

            // Provide feedback
            this.provideFeedback(duration, qualityNum);

            return entry;
        }

        return null;
    }

    provideFeedback(duration, quality) {
        console.log();

        // Duration feedback
        if (duration < 6) {
            console.log('⚠️  You got less than 6 hours of sleep. Most adults need 7-9 hours.');
        } else if (duration >= 7 && duration <= 9) {
            console.log('✓ Great sleep duration! You\'re in the recommended 7-9 hour range.');
        } else if (duration > 9) {
            console.log('💡 You slept over 9 hours. Oversleeping can sometimes indicate stress or health issues.');
        }

        // Quality feedback
        if (quality >= 8) {
            console.log('😊 Excellent sleep quality!');
        } else if (quality >= 6) {
            console.log('👍 Good sleep quality.');
        } else if (quality >= 4) {
            console.log('😐 Moderate sleep quality. Consider your sleep environment and habits.');
        } else {
            console.log('😔 Poor sleep quality. May be worth discussing with a healthcare provider.');
        }
    }

    getStats() {
        if (this.data.sleepEntries.length === 0) {
            console.log('\n📊 Sleep Statistics');
            console.log('═'.repeat(60));
            console.log('No sleep data yet. Start logging your sleep with: sleep log');
            return;
        }

        const entries = this.data.sleepEntries;
        const totalEntries = entries.length;

        // PERFORMANCE: Single-pass statistics calculation (5 iterations → 1)
        const targetHours = 8;
        let totalDuration = 0;
        let totalQuality = 0;
        let totalSleepDebt = 0;
        let bestNight = entries[0];
        let worstNight = entries[0];

        entries.forEach(e => {
            totalDuration += e.duration;
            totalQuality += e.quality;

            // Calculate sleep debt
            const deficit = targetHours - e.duration;
            if (deficit > 0) {
                totalSleepDebt += deficit;
            }

            // Track best and worst nights
            if (e.quality > bestNight.quality) bestNight = e;
            if (e.quality < worstNight.quality) worstNight = e;
        });

        const avgDuration = (totalDuration / totalEntries).toFixed(1);
        const avgQuality = (totalQuality / totalEntries).toFixed(1);

        // Last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentEntries = entries.filter(e => new Date(e.timestamp) > sevenDaysAgo);
        const avgRecentDuration = recentEntries.length > 0
            ? (recentEntries.reduce((sum, e) => sum + e.duration, 0) / recentEntries.length).toFixed(1)
            : 'N/A';

        console.log('\n📊 Sleep Statistics');
        console.log('═'.repeat(60));
        console.log(`\nTotal Nights Tracked: ${totalEntries}`);
        console.log(`\n⏰ Duration:`);
        console.log(`   Average: ${avgDuration} hours`);
        console.log(`   Last 7 Days: ${avgRecentDuration} hours`);
        console.log(`   Target: 7-9 hours`);

        console.log(`\n💤 Quality:`);
        console.log(`   Average: ${avgQuality}/10`);

        console.log(`\n📈 Best Night: ${bestNight.date}`);
        console.log(`   Quality: ${bestNight.quality}/10, Duration: ${bestNight.duration}h`);

        console.log(`\n📉 Most Restless Night: ${worstNight.date}`);
        console.log(`   Quality: ${worstNight.quality}/10, Duration: ${worstNight.duration}h`);

        console.log(`\n😴 Sleep Debt:`);
        console.log(`   Total accumulated: ${totalSleepDebt.toFixed(1)} hours`);
        console.log(`   (Based on ${targetHours}h/night target)`);

        // Sleep schedule consistency
        this.analyzeConsistency();

        console.log('\n═'.repeat(60));
    }

    analyzeConsistency() {
        if (this.data.sleepEntries.length < 3) {
            return;
        }

        const entries = this.data.sleepEntries;

        // Convert bedtimes to minutes for consistency calculation
        const bedtimeMinutes = entries.map(e => {
            const [hour, min] = e.bedtime.split(':').map(Number);
            return hour * 60 + min;
        });

        // Calculate standard deviation
        const mean = bedtimeMinutes.reduce((sum, val) => sum + val, 0) / bedtimeMinutes.length;
        const variance = bedtimeMinutes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / bedtimeMinutes.length;
        const stdDev = Math.sqrt(variance);

        console.log(`\n🕐 Schedule Consistency:`);
        if (stdDev < 30) {
            console.log(`   ✓ Excellent! Your bedtime varies by less than 30 minutes.`);
        } else if (stdDev < 60) {
            console.log(`   👍 Good! Your bedtime varies by about ${Math.floor(stdDev)} minutes.`);
        } else {
            console.log(`   ⚠️  Inconsistent. Your bedtime varies by ${Math.floor(stdDev)} minutes.`);
            console.log(`   💡 Try to maintain a consistent sleep schedule for better sleep quality.`);
        }
    }

    getHistory(days = 7) {
        if (this.data.sleepEntries.length === 0) {
            console.log('\n📅 Sleep History');
            console.log('═'.repeat(60));
            console.log('No sleep data yet.');
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentEntries = this.data.sleepEntries
            .filter(e => new Date(e.timestamp) > cutoffDate)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        console.log(`\n📅 Sleep History (Last ${days} Days)`);
        console.log('═'.repeat(60));

        if (recentEntries.length === 0) {
            console.log(`No sleep data in the last ${days} days.`);
            return;
        }

        recentEntries.forEach((entry, index) => {
            console.log(`\n${index + 1}. ${entry.date}`);
            console.log(`   🛏️  ${entry.bedtime} → 🌅 ${entry.wakeTime} (${entry.duration}h)`);
            console.log(`   Quality: ${this.getQualityEmoji(entry.quality)} ${entry.quality}/10`);
            if (entry.notes) {
                console.log(`   Notes: ${entry.notes}`);
            }
        });

        console.log('\n═'.repeat(60));
    }

    getQualityEmoji(quality) {
        if (quality >= 8) return '😊';
        if (quality >= 6) return '🙂';
        if (quality >= 4) return '😐';
        return '😔';
    }

    getInsights() {
        if (this.data.sleepEntries.length < 5) {
            console.log('\n🔍 Sleep Insights');
            console.log('═'.repeat(60));
            console.log('\n📊 Not enough data yet for meaningful insights.');
            console.log('   Log at least 5 nights of sleep to see patterns!');
            return;
        }

        console.log('\n🔍 Sleep Insights & Patterns');
        console.log('═'.repeat(60));

        this.analyzeDurationPatterns();
        this.analyzeQualityPatterns();
        this.analyzeWeekdayPatterns();

        console.log('\n💡 Remember: Quality sleep is essential for mental and physical health.');
        console.log('   If you have persistent sleep issues, consult a healthcare provider.');
        console.log('\n═'.repeat(60));
    }

    analyzeDurationPatterns() {
        const entries = this.data.sleepEntries;

        // PERFORMANCE: Single-pass duration categorization (3 iterations → 1)
        let shortSleep = 0;
        let optimalSleep = 0;
        let longSleep = 0;

        entries.forEach(e => {
            if (e.duration < 6) {
                shortSleep++;
            } else if (e.duration >= 7 && e.duration <= 9) {
                optimalSleep++;
            } else if (e.duration > 9) {
                longSleep++;
            }
        });

        console.log('\n⏰ Sleep Duration Patterns:');
        const total = entries.length;
        console.log(`   Short (<6h): ${shortSleep} nights (${((shortSleep/total)*100).toFixed(0)}%)`);
        console.log(`   Optimal (7-9h): ${optimalSleep} nights (${((optimalSleep/total)*100).toFixed(0)}%)`);
        console.log(`   Long (>9h): ${longSleep} nights (${((longSleep/total)*100).toFixed(0)}%)`);

        if (optimalSleep / total >= 0.7) {
            console.log('   ✓ Great! You\'re consistently getting optimal sleep duration.');
        } else if (shortSleep / total > 0.5) {
            console.log('   ⚠️  You\'re frequently sleep deprived. Prioritize getting 7-9 hours.');
        }
    }

    analyzeQualityPatterns() {
        const entries = this.data.sleepEntries;

        // Correlation between duration and quality
        let correlation = 0;
        if (entries.length >= 5) {
            const avgDuration = entries.reduce((sum, e) => sum + e.duration, 0) / entries.length;
            const avgQuality = entries.reduce((sum, e) => sum + e.quality, 0) / entries.length;

            let numerator = 0;
            let denomDuration = 0;
            let denomQuality = 0;

            entries.forEach(e => {
                const durDiff = e.duration - avgDuration;
                const qualDiff = e.quality - avgQuality;
                numerator += durDiff * qualDiff;
                denomDuration += durDiff * durDiff;
                denomQuality += qualDiff * qualDiff;
            });

            if (denomDuration > 0 && denomQuality > 0) {
                correlation = numerator / Math.sqrt(denomDuration * denomQuality);
            }
        }

        console.log('\n💤 Sleep Quality Insights:');
        if (correlation > 0.5) {
            console.log('   📊 Strong correlation: Longer sleep → Better quality for you');
        } else if (correlation < -0.5) {
            console.log('   📊 Interesting: You sleep better with shorter durations');
            console.log('   💡 Quality over quantity might be your pattern');
        } else {
            console.log('   📊 Your sleep quality doesn\'t strongly depend on duration alone');
            console.log('   💡 Consider other factors like consistency, environment, stress');
        }

        // Find quality trends
        const avgQuality = entries.reduce((sum, e) => sum + e.quality, 0) / entries.length;
        const poorNights = entries.filter(e => e.quality < 5);

        if (poorNights.length > 0) {
            const avgPoorDuration = poorNights.reduce((sum, e) => sum + e.duration, 0) / poorNights.length;
            console.log(`\n   On nights with poor sleep (quality <5):`);
            console.log(`   Average duration: ${avgPoorDuration.toFixed(1)}h`);
        }
    }

    analyzeWeekdayPatterns() {
        if (this.data.sleepEntries.length < 7) {
            return;
        }

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayData = Array(7).fill(null).map(() => ({ durations: [], qualities: [] }));

        this.data.sleepEntries.forEach(entry => {
            const day = new Date(entry.timestamp).getDay();
            dayData[day].durations.push(entry.duration);
            dayData[day].qualities.push(entry.quality);
        });

        // Find best and worst days
        const dayAverages = dayData.map((data, day) => {
            if (data.durations.length === 0) return null;
            return {
                day: dayNames[day],
                avgDuration: data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length,
                avgQuality: data.qualities.reduce((sum, q) => sum + q, 0) / data.qualities.length,
                count: data.durations.length
            };
        }).filter(d => d !== null && d.count >= 2); // Only include days with 2+ data points

        if (dayAverages.length >= 3) {
            const bestDay = dayAverages.reduce((best, d) =>
                d.avgQuality > best.avgQuality ? d : best
            );
            const worstDay = dayAverages.reduce((worst, d) =>
                d.avgQuality < worst.avgQuality ? d : worst
            );

            console.log('\n📅 Day-of-Week Patterns:');
            console.log(`   📈 Best sleep: ${bestDay.day}s`);
            console.log(`      Avg quality: ${bestDay.avgQuality.toFixed(1)}/10, Duration: ${bestDay.avgDuration.toFixed(1)}h`);
            console.log(`   📉 Most restless: ${worstDay.day}s`);
            console.log(`      Avg quality: ${worstDay.avgQuality.toFixed(1)}/10, Duration: ${worstDay.avgDuration.toFixed(1)}h`);
        }
    }

    // Export method for integration with mental health tracker
    getSleepDataForCorrelation() {
        return this.data.sleepEntries.map(entry => ({
            date: entry.date,
            duration: entry.duration,
            quality: entry.quality,
            timestamp: entry.timestamp
        }));
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    const tracker = new SleepTracker();

    switch (command) {
        case 'log':
        case 'log-sleep':
            const bedtime = args[1];
            const wakeTime = args[2];
            const quality = args[3];
            const notes = args.slice(4).join(' ');
            tracker.logSleep(bedtime, wakeTime, quality, notes);
            break;

        case 'stats':
        case 'statistics':
            tracker.getStats();
            break;

        case 'history':
            const days = ValidationUtils.parseInteger(args[1], {
                min: 1,
                max: 365,
                default: 7,
                fieldName: 'days'
            });
            tracker.getHistory(days);
            break;

        case 'insights':
        case 'analyze':
            tracker.getInsights();
            break;

        case 'help':
        default:
            console.log('\n💤 Sleep Tracker - Track your sleep for better health');
            console.log('═'.repeat(60));
            console.log('\nCommands:');
            console.log('  log <bedtime> <wakeTime> <quality> [notes]');
            console.log('      Log a sleep entry');
            console.log('      Example: node sleep-tracker.js log 22:30 06:30 8 "Felt great"');
            console.log('      - Bedtime & wake time in HH:MM format (24-hour)');
            console.log('      - Quality: 1-10 (1=terrible, 10=perfect)');
            console.log('');
            console.log('  stats / statistics');
            console.log('      View sleep statistics and insights');
            console.log('');
            console.log('  history [days]');
            console.log('      View sleep history (default: last 7 days)');
            console.log('      Example: node sleep-tracker.js history 14');
            console.log('');
            console.log('  insights / analyze');
            console.log('      Discover patterns in your sleep data');
            console.log('');
            console.log('  help');
            console.log('      Show this help message');
            console.log('\n💡 Tips:');
            console.log('   - Most adults need 7-9 hours of sleep');
            console.log('   - Consistent sleep schedule improves sleep quality');
            console.log('   - Track regularly to identify patterns');
            console.log('═'.repeat(60));
            break;
    }
}

module.exports = SleepTracker;
