#!/usr/bin/env node

const DailyDashboard = require('./daily-dashboard');
const AnalyticsEngine = require('./analytics-engine');

function showHelp() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           StepSyncAI Advanced Analytics                       ║
╚═══════════════════════════════════════════════════════════════╝

COMMANDS:
  dashboard [days]           Show comprehensive analytics dashboard
  correlations [days]        Analyze correlations between metrics
  trends [days]              Analyze wellness trends and predictions
  sleep-exercise [days]      Sleep quality vs exercise correlation
  mood-sleep [days]          Mood vs sleep quality correlation
  mood-exercise [days]       Mood vs exercise correlation
  predict [days] [ahead]     Predict future wellness trends
  anomalies [days]           Detect unusual patterns in data
  report [days]              Generate comprehensive report

EXAMPLES:
  node analytics-cli.js dashboard 30
  node analytics-cli.js correlations 60
  node analytics-cli.js predict 30 7
  node analytics-cli.js sleep-exercise 90

DEFAULT:
  Days defaults to 30 if not specified
`);
}

async function runCommand(command, args) {
    const days = parseInt(args[0]) || 30;
    const dashboard = new DailyDashboard();
    const analytics = new AnalyticsEngine(dashboard);

    switch (command) {
        case 'dashboard': {
            analytics.displayDashboard(days);
            break;
        }

        case 'correlations': {
            console.log('\n📊 Correlation Analysis\n');
            console.log('═'.repeat(65));

            const sleepExercise = analytics.analyzeSleepExerciseCorrelation(days);
            console.log('\n🏃 Sleep Quality & Exercise');
            if (sleepExercise.correlation !== null) {
                console.log(`   Correlation: ${sleepExercise.correlation.toFixed(3)} (${sleepExercise.strength})`);
                console.log(`   ${sleepExercise.insight}`);
            } else {
                console.log(`   ${sleepExercise.message}`);
            }

            const moodSleep = analytics.analyzeMoodSleepCorrelation(days);
            console.log('\n😊 Mood & Sleep Quality');
            if (moodSleep.correlation !== null) {
                console.log(`   Correlation: ${moodSleep.correlation.toFixed(3)} (${moodSleep.strength})`);
                console.log(`   ${moodSleep.insight}`);
            } else {
                console.log(`   ${moodSleep.message}`);
            }

            const moodExercise = analytics.analyzeMoodExerciseCorrelation(days);
            console.log('\n💪 Mood & Exercise');
            if (moodExercise.correlation !== null) {
                console.log(`   Correlation: ${moodExercise.correlation.toFixed(3)} (${moodExercise.strength})`);
                console.log(`   ${moodExercise.insight}`);
            } else {
                console.log(`   ${moodExercise.message}`);
            }

            console.log('\n' + '═'.repeat(65));
            break;
        }

        case 'trends': {
            console.log('\n📈 Wellness Trends\n');
            console.log('═'.repeat(65));

            const trends = analytics.analyzeWellnessTrends(days);

            if (trends.message) {
                console.log(`\n${trends.message}`);
            } else {
                console.log(`\nCurrent Wellness: ${trends.current?.toFixed(1)}%`);
                console.log(`Average Wellness: ${trends.average?.toFixed(1)}%`);
                console.log(`Trend: ${trends.trend}`);
                console.log(`Moving Average: ${trends.movingAverage?.toFixed(1)}%`);

                if (trends.prediction) {
                    console.log('\n7-Day Forecast:');
                    trends.prediction.forEach((pred, i) => {
                        console.log(`   Day ${i + 1}: ${pred.toFixed(1)}%`);
                    });
                }

                if (trends.anomalies > 0) {
                    console.log(`\n⚠️  Detected ${trends.anomalies} anomalous days`);
                    trends.anomalyDetails.slice(0, 3).forEach(anomaly => {
                        console.log(`   - Day ${anomaly.index + 1}: ${anomaly.value.toFixed(1)}% (${anomaly.type})`);
                    });
                }
            }

            console.log('\n' + '═'.repeat(65));
            break;
        }

        case 'sleep-exercise': {
            const result = analytics.analyzeSleepExerciseCorrelation(days);
            console.log('\n🏃 Sleep Quality & Exercise Correlation\n');
            console.log('═'.repeat(65));

            if (result.correlation !== null) {
                console.log(`\nCorrelation Coefficient: ${result.correlation.toFixed(3)}`);
                console.log(`Strength: ${result.strength}`);
                console.log(`Sample Size: ${result.sampleSize} days`);
                console.log(`\n${result.insight}`);
                console.log(`\n💡 ${analytics.generateActionableInsight('Sleep & Exercise', result.correlation)}`);
            } else {
                console.log(`\n${result.message}`);
            }

            console.log('\n' + '═'.repeat(65));
            break;
        }

        case 'mood-sleep': {
            const result = analytics.analyzeMoodSleepCorrelation(days);
            console.log('\n😊 Mood & Sleep Quality Correlation\n');
            console.log('═'.repeat(65));

            if (result.correlation !== null) {
                console.log(`\nCorrelation Coefficient: ${result.correlation.toFixed(3)}`);
                console.log(`Strength: ${result.strength}`);
                console.log(`Sample Size: ${result.sampleSize} days`);
                console.log(`\n${result.insight}`);
                console.log(`\n💡 ${analytics.generateActionableInsight('Mood & Sleep', result.correlation)}`);
            } else {
                console.log(`\n${result.message}`);
            }

            console.log('\n' + '═'.repeat(65));
            break;
        }

        case 'mood-exercise': {
            const result = analytics.analyzeMoodExerciseCorrelation(days);
            console.log('\n💪 Mood & Exercise Correlation\n');
            console.log('═'.repeat(65));

            if (result.correlation !== null) {
                console.log(`\nCorrelation Coefficient: ${result.correlation.toFixed(3)}`);
                console.log(`Strength: ${result.strength}`);
                console.log(`Sample Size: ${result.sampleSize} days`);
                console.log(`\n${result.insight}`);
                console.log(`\n💡 ${analytics.generateActionableInsight('Mood & Exercise', result.correlation)}`);
            } else {
                console.log(`\n${result.message}`);
            }

            console.log('\n' + '═'.repeat(65));
            break;
        }

        case 'predict': {
            const daysAhead = parseInt(args[1]) || 7;
            const trends = analytics.analyzeWellnessTrends(days);

            console.log('\n🔮 Wellness Predictions\n');
            console.log('═'.repeat(65));

            if (trends.message) {
                console.log(`\n${trends.message}`);
            } else if (trends.prediction) {
                console.log(`\nBased on ${days}-day trend, predicting next ${daysAhead} days:`);
                console.log(`\nCurrent: ${trends.current?.toFixed(1)}%`);
                console.log(`Trend: ${trends.trend}\n`);

                trends.prediction.slice(0, daysAhead).forEach((pred, i) => {
                    const arrow = pred > trends.current ? '↗️ ' : pred < trends.current ? '↘️ ' : '→ ';
                    console.log(`   ${arrow} Day ${i + 1}: ${pred.toFixed(1)}%`);
                });

                console.log(`\n💡 ${analytics.generateTrendInsight(trends)}`);
            }

            console.log('\n' + '═'.repeat(65));
            break;
        }

        case 'anomalies': {
            const trends = analytics.analyzeWellnessTrends(days);

            console.log('\n⚠️  Anomaly Detection\n');
            console.log('═'.repeat(65));

            if (trends.message) {
                console.log(`\n${trends.message}`);
            } else if (trends.anomalies === 0) {
                console.log('\n✅ No anomalies detected - your wellness data is consistent!');
            } else {
                console.log(`\nDetected ${trends.anomalies} anomalous day(s) in ${days}-day period:\n`);

                trends.anomalyDetails.forEach(anomaly => {
                    const icon = anomaly.type.includes('high') ? '⬆️ ' : '⬇️ ';
                    console.log(`${icon} Day ${anomaly.index + 1}:`);
                    console.log(`   Value: ${anomaly.value.toFixed(1)}%`);
                    console.log(`   Type: ${anomaly.type}`);
                    console.log(`   Z-Score: ${anomaly.zScore.toFixed(2)}`);
                    console.log('');
                });

                console.log('💡 Review these days to identify what caused the deviation.');
            }

            console.log('═'.repeat(65));
            break;
        }

        case 'report': {
            const report = analytics.generateReport(days);

            console.log('\n📊 Comprehensive Analytics Report\n');
            console.log('═'.repeat(65));
            console.log(`Period: ${report.period}`);
            console.log(`Generated: ${new Date(report.generated).toLocaleString()}\n`);

            // Show all correlations
            console.log('Correlations:');
            Object.entries(report.correlations).forEach(([key, data]) => {
                if (data.correlation !== null) {
                    console.log(`  ${key}: ${data.correlation.toFixed(3)} (${data.strength})`);
                }
            });

            // Show trends
            if (report.trends.wellness && !report.trends.wellness.message) {
                console.log(`\nWellness Trend: ${report.trends.wellness.trend}`);
                console.log(`Current: ${report.trends.wellness.current?.toFixed(1)}%`);
                console.log(`Average: ${report.trends.wellness.average?.toFixed(1)}%`);
            }

            // Show insights
            if (report.insights.length > 0) {
                console.log(`\n${report.insights.length} Key Insights:`);
                report.insights.forEach((insight, i) => {
                    console.log(`\n${i + 1}. ${insight.title}`);
                    console.log(`   ${insight.description}`);
                    console.log(`   💡 ${insight.actionable}`);
                });
            }

            console.log('\n' + '═'.repeat(65));

            // Offer to save report
            console.log('\n💾 Report generated. You can save it using the backup system.');
            break;
        }

        case 'help':
        case '--help':
        case '-h':
        default:
            showHelp();
            break;
    }
}

async function main() {
    const command = process.argv[2];
    const args = process.argv.slice(3);
    await runCommand(command, args);
}

// Export for testing
module.exports = { runCommand, showHelp };

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}
