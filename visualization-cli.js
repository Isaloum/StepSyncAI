#!/usr/bin/env node

const DailyDashboard = require('./daily-dashboard');
const AnalyticsEngine = require('./analytics-engine');
const ReportGenerator = require('./report-generator');
const ExportManager = require('./export-manager');
const asciichart = require('asciichart');

/**
 * Visualization CLI - Interactive interface for reports and exports
 *
 * Commands:
 * - report: Generate PDF wellness report
 * - export-csv: Export data to CSV
 * - export-json: Export data to JSON
 * - export-all: Export complete backup
 * - list-exports: List all exported files
 * - list-reports: List all generated reports
 * - chart: Display ASCII charts
 * - heatmap: Display wellness heatmap
 * - stats: Show export statistics
 * - help: Show help message
 */

class VisualizationCLI {
    constructor() {
        this.dashboard = new DailyDashboard();
        this.analytics = new AnalyticsEngine(this.dashboard);
        this.reportGenerator = new ReportGenerator(this.dashboard, this.analytics);
        this.exportManager = new ExportManager(this.dashboard);
    }

    /**
     * Show help message
     */
    showHelp() {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║     Enhanced Visualization & Reports - StepSyncAI         ║
╚════════════════════════════════════════════════════════════╝

COMMANDS:

  📄 Reports:
     report [days]          Generate PDF wellness report (default: 30 days)
     list-reports           List all generated PDF reports

  💾 Exports:
     export-csv [days]      Export data to CSV format
     export-json [days]     Export data to JSON format
     export-meds            Export medications to CSV
     export-analytics       Export analytics summary
     export-all             Export complete backup (all data)
     list-exports           List all exported files

  📊 Visualizations:
     chart <type> [days]    Display ASCII chart (mood/sleep/exercise)
     heatmap [days]         Display wellness heatmap
     trends [days]          Show trend analysis with charts

  📈 Statistics:
     stats                  Show export statistics
     summary [days]         Show data summary with visualizations

  ℹ️  Help:
     help                   Show this help message

EXAMPLES:

  node visualization-cli.js report 30
  node visualization-cli.js export-csv 60
  node visualization-cli.js chart mood 14
  node visualization-cli.js heatmap 30
  node visualization-cli.js export-all

═══════════════════════════════════════════════════════════
`);
    }

    /**
     * Generate PDF report
     */
    generateReport(days = 30) {
        try {
            console.log(`\n📄 Generating wellness report for last ${days} days...`);
            this.reportGenerator.generatePDFReport({
                days,
                includeAnalytics: true,
                includeCharts: true
            });
        } catch (error) {
            console.error(`❌ Error generating report: ${error.message}`);
        }
    }

    /**
     * List all reports
     */
    listReports() {
        const reports = this.reportGenerator.listReports();

        if (reports.length === 0) {
            console.log('\n📭 No reports generated yet.');
            console.log('   Use "report" command to generate your first report!');
            return;
        }

        console.log(`\n📄 Generated Reports (${reports.length})\n`);
        console.log('═'.repeat(80));

        reports.forEach((report, index) => {
            console.log(`\n${index + 1}. ${report.filename}`);
            console.log(`   Created: ${report.created.toLocaleString()}`);
            console.log(`   Size: ${report.size}`);
            console.log(`   Path: ${report.path}`);
        });

        console.log('\n' + '═'.repeat(80));
    }

    /**
     * Export to CSV
     */
    exportCSV(days = 30) {
        try {
            console.log(`\n💾 Exporting last ${days} days to CSV...`);
            this.exportManager.exportToCSV({ days });
        } catch (error) {
            console.error(`❌ Error exporting to CSV: ${error.message}`);
        }
    }

    /**
     * Export to JSON
     */
    exportJSON(days = 30) {
        try {
            console.log(`\n💾 Exporting last ${days} days to JSON...`);
            this.exportManager.exportToJSON({ days });
        } catch (error) {
            console.error(`❌ Error exporting to JSON: ${error.message}`);
        }
    }

    /**
     * Export medications
     */
    exportMedications() {
        try {
            console.log(`\n💾 Exporting medications to CSV...`);
            this.exportManager.exportMedicationsToCSV();
        } catch (error) {
            console.error(`❌ Error exporting medications: ${error.message}`);
        }
    }

    /**
     * Export analytics summary
     */
    exportAnalytics(days = 30) {
        try {
            console.log(`\n💾 Exporting analytics summary...`);
            this.exportManager.exportAnalyticsSummary(this.analytics, { days });
        } catch (error) {
            console.error(`❌ Error exporting analytics: ${error.message}`);
        }
    }

    /**
     * Export complete backup
     */
    exportAll() {
        try {
            console.log(`\n💾 Creating complete backup...`);
            this.exportManager.exportCompleteBackup();
        } catch (error) {
            console.error(`❌ Error creating backup: ${error.message}`);
        }
    }

    /**
     * List all exports
     */
    listExports() {
        const exports = this.exportManager.listExports();

        if (exports.length === 0) {
            console.log('\n📭 No exports created yet.');
            console.log('   Use export commands to create your first export!');
            return;
        }

        console.log(`\n💾 Exported Files (${exports.length})\n`);
        console.log('═'.repeat(80));

        exports.forEach((exp, index) => {
            console.log(`\n${index + 1}. ${exp.filename}`);
            console.log(`   Type: ${exp.type}`);
            console.log(`   Created: ${exp.created.toLocaleString()}`);
            console.log(`   Size: ${exp.size}`);
        });

        console.log('\n' + '═'.repeat(80));
    }

    /**
     * Display ASCII chart
     */
    displayChart(type, days = 30) {
        const validTypes = ['mood', 'sleep', 'exercise'];

        if (!validTypes.includes(type)) {
            console.error(`❌ Invalid chart type. Use: ${validTypes.join(', ')}`);
            return;
        }

        const entries = this.dashboard.getAllEntries().slice(-days);

        if (entries.length === 0) {
            console.log('\n📭 No data available to chart.');
            return;
        }

        let data = [];
        let label = '';
        let unit = '';

        switch (type) {
            case 'mood':
                data = entries.filter(e => e.mood).map(e => e.mood);
                label = 'Mood Rating';
                unit = '/10';
                break;
            case 'sleep':
                data = entries.filter(e => e.sleep_hours).map(e => e.sleep_hours);
                label = 'Sleep Hours';
                unit = 'hours';
                break;
            case 'exercise':
                data = entries.filter(e => e.exercise_minutes).map(e => e.exercise_minutes);
                label = 'Exercise Minutes';
                unit = 'min';
                break;
        }

        if (data.length === 0) {
            console.log(`\n📭 No ${type} data available.`);
            return;
        }

        console.log(`\n📊 ${label} - Last ${Math.min(data.length, days)} Days\n`);

        // Configure chart
        const config = {
            height: 15,
            colors: [asciichart.blue]
        };

        // Display chart
        console.log(asciichart.plot(data.slice(-60), config));

        // Statistics
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        const min = Math.min(...data);
        const max = Math.max(...data);

        console.log(`\n📈 Statistics:`);
        console.log(`   Average: ${avg.toFixed(1)} ${unit}`);
        console.log(`   Range: ${min} - ${max} ${unit}`);
        console.log(`   Data points: ${data.length}`);
        console.log('');
    }

    /**
     * Display wellness heatmap
     */
    displayHeatmap(days = 30) {
        const entries = this.dashboard.getAllEntries().slice(-days);

        if (entries.length === 0) {
            console.log('\n📭 No data available for heatmap.');
            return;
        }

        console.log(`\n🗓️  Wellness Heatmap - Last ${days} Days\n`);
        console.log('═'.repeat(70));

        // Create weekly grid
        const weeks = Math.ceil(entries.length / 7);

        console.log('\n     Mon  Tue  Wed  Thu  Fri  Sat  Sun');
        console.log('   ' + '─'.repeat(36));

        for (let week = 0; week < weeks; week++) {
            const startIdx = week * 7;
            const weekEntries = entries.slice(startIdx, startIdx + 7);

            let weekRow = `W${week + 1}  `;

            weekEntries.forEach(entry => {
                const score = this.calculateWellnessScore(entry);
                const symbol = this.getHeatmapSymbol(score);
                weekRow += ` ${symbol}  `;
            });

            console.log(weekRow);
        }

        console.log('\n   Legend:');
        console.log('   ██ Excellent (8-10)  ▓▓ Good (6-8)  ▒▒ Fair (4-6)  ░░ Poor (0-4)  -- No data');
        console.log('\n' + '═'.repeat(70));
    }

    /**
     * Calculate overall wellness score for an entry
     */
    calculateWellnessScore(entry) {
        let score = 0;
        let count = 0;

        if (entry.mood) {
            score += entry.mood;
            count++;
        }

        if (entry.sleep_hours) {
            // Convert sleep hours to 0-10 scale (7-9 hours = 10)
            const sleepScore = entry.sleep_hours >= 7 && entry.sleep_hours <= 9
                ? 10
                : Math.max(0, 10 - Math.abs(8 - entry.sleep_hours) * 2);
            score += sleepScore;
            count++;
        }

        if (entry.exercise_minutes) {
            // Convert exercise to 0-10 scale (30+ min = 10)
            const exerciseScore = Math.min(10, (entry.exercise_minutes / 30) * 10);
            score += exerciseScore;
            count++;
        }

        return count > 0 ? score / count : null;
    }

    /**
     * Get heatmap symbol based on score
     */
    getHeatmapSymbol(score) {
        if (score === null) return '--';
        if (score >= 8) return '██';
        if (score >= 6) return '▓▓';
        if (score >= 4) return '▒▒';
        return '░░';
    }

    /**
     * Display trend analysis with charts
     */
    displayTrends(days = 30) {
        console.log(`\n📈 Trend Analysis - Last ${days} Days\n`);
        console.log('═'.repeat(70));

        const trends = this.analytics.analyzeWellnessTrends(days);

        if (!trends || Object.keys(trends).length === 0) {
            console.log('\n📭 Insufficient data for trend analysis.');
            return;
        }

        // Mood trends
        if (trends.mood) {
            console.log('\n😊 Mood Trends:');
            console.log(`   Trend: ${this.getTrendEmoji(trends.mood.trend)} ${trends.mood.trend}`);
            if (trends.mood.predictions && trends.mood.predictions.length > 0) {
                const nextWeek = trends.mood.predictions.slice(0, 7);
                console.log(`   7-day forecast: ${nextWeek.map(v => v.toFixed(1)).join(', ')}`);
            }
        }

        // Sleep trends
        if (trends.sleep) {
            console.log('\n😴 Sleep Trends:');
            console.log(`   Trend: ${this.getTrendEmoji(trends.sleep.trend)} ${trends.sleep.trend}`);
            if (trends.sleep.predictions && trends.sleep.predictions.length > 0) {
                const nextWeek = trends.sleep.predictions.slice(0, 7);
                console.log(`   7-day forecast: ${nextWeek.map(v => v.toFixed(1)).join(', ')} hours`);
            }
        }

        // Exercise trends
        if (trends.exercise) {
            console.log('\n🏃 Exercise Trends:');
            console.log(`   Trend: ${this.getTrendEmoji(trends.exercise.trend)} ${trends.exercise.trend}`);
            if (trends.exercise.predictions && trends.exercise.predictions.length > 0) {
                const nextWeek = trends.exercise.predictions.slice(0, 7);
                console.log(`   7-day forecast: ${nextWeek.map(v => v.toFixed(0)).join(', ')} minutes`);
            }
        }

        console.log('\n' + '═'.repeat(70));
    }

    /**
     * Get trend emoji
     */
    getTrendEmoji(trend) {
        if (trend === 'improving') return '📈';
        if (trend === 'declining') return '📉';
        return '➡️';
    }

    /**
     * Show export statistics
     */
    showStats() {
        const stats = this.exportManager.getExportStats();

        console.log('\n📊 Export Statistics\n');
        console.log('═'.repeat(60));

        console.log(`\n📁 Overview:`);
        console.log(`   Total files: ${stats.totalFiles}`);
        console.log(`   Total size: ${stats.totalSize}`);

        if (stats.oldest) {
            console.log(`   Oldest export: ${new Date(stats.oldest).toLocaleDateString()}`);
        }
        if (stats.newest) {
            console.log(`   Newest export: ${new Date(stats.newest).toLocaleDateString()}`);
        }

        if (Object.keys(stats.byType).length > 0) {
            console.log(`\n📋 By Type:`);
            Object.entries(stats.byType).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} file(s)`);
            });
        }

        console.log('\n' + '═'.repeat(60));
    }

    /**
     * Show data summary with visualizations
     */
    showSummary(days = 30) {
        const entries = this.dashboard.getAllEntries().slice(-days);

        if (entries.length === 0) {
            console.log('\n📭 No data available for summary.');
            return;
        }

        console.log(`\n📊 Data Summary - Last ${days} Days\n`);
        console.log('═'.repeat(70));

        // Overall statistics
        console.log(`\n📈 Overview:`);
        console.log(`   Total entries: ${entries.length}`);
        console.log(`   Date range: ${entries[0].date} to ${entries[entries.length - 1].date}`);
        console.log(`   Tracking consistency: ${((entries.length / days) * 100).toFixed(0)}%`);

        // Quick metrics
        const moodEntries = entries.filter(e => e.mood);
        const sleepEntries = entries.filter(e => e.sleep_hours);
        const exerciseEntries = entries.filter(e => e.exercise_minutes);

        if (moodEntries.length > 0) {
            const avgMood = moodEntries.reduce((sum, e) => sum + e.mood, 0) / moodEntries.length;
            console.log(`\n😊 Mood: ${avgMood.toFixed(1)}/10 average (${moodEntries.length} entries)`);
        }

        if (sleepEntries.length > 0) {
            const avgSleep = sleepEntries.reduce((sum, e) => sum + e.sleep_hours, 0) / sleepEntries.length;
            console.log(`😴 Sleep: ${avgSleep.toFixed(1)} hours average (${sleepEntries.length} nights)`);
        }

        if (exerciseEntries.length > 0) {
            const totalExercise = exerciseEntries.reduce((sum, e) => sum + e.exercise_minutes, 0);
            const avgExercise = totalExercise / exerciseEntries.length;
            console.log(`🏃 Exercise: ${totalExercise} total minutes, ${avgExercise.toFixed(0)} average/day`);
        }

        console.log('\n' + '═'.repeat(70));
    }

    /**
     * Run the CLI
     */
    run() {
        const args = process.argv.slice(2);
        const command = args[0] || 'help';
        const param1 = args[1] ? parseInt(args[1]) || args[1] : undefined;
        const param2 = args[2] ? parseInt(args[2]) : undefined;

        switch (command.toLowerCase()) {
            case 'report':
                this.generateReport(param1 || 30);
                break;

            case 'list-reports':
                this.listReports();
                break;

            case 'export-csv':
                this.exportCSV(param1 || 30);
                break;

            case 'export-json':
                this.exportJSON(param1 || 30);
                break;

            case 'export-meds':
            case 'export-medications':
                this.exportMedications();
                break;

            case 'export-analytics':
                this.exportAnalytics(param1 || 30);
                break;

            case 'export-all':
                this.exportAll();
                break;

            case 'list-exports':
                this.listExports();
                break;

            case 'chart':
                if (!param1) {
                    console.error('❌ Please specify chart type: mood, sleep, or exercise');
                } else {
                    this.displayChart(param1, param2 || 30);
                }
                break;

            case 'heatmap':
                this.displayHeatmap(param1 || 30);
                break;

            case 'trends':
                this.displayTrends(param1 || 30);
                break;

            case 'stats':
            case 'statistics':
                this.showStats();
                break;

            case 'summary':
                this.showSummary(param1 || 30);
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
    const cli = new VisualizationCLI();
    cli.run();
}

module.exports = VisualizationCLI;
