const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * ReportGenerator - Create comprehensive PDF and visual reports
 *
 * Features:
 * - PDF wellness reports with charts and analytics
 * - Weekly/Monthly summary reports
 * - Export to CSV and JSON formats
 * - Visual trend analysis
 * - Goal progress tracking
 */
class ReportGenerator {
    constructor(dashboard, analytics = null, reportsDir = './data/reports') {
        this.dashboard = dashboard;
        this.analytics = analytics;
        this.reportsDir = reportsDir;

        // Ensure reports directory exists
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    /**
     * Generate comprehensive PDF report
     *
     * @param {Object} options - Report options
     * @returns {string} Path to generated PDF
     */
    generatePDFReport(options = {}) {
        const {
            days = 30,
            includeAnalytics = true,
            includeCharts = true,
            title = 'Wellness Report'
        } = options;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `wellness-report-${timestamp}.pdf`;
        const filepath = path.join(this.reportsDir, filename);

        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Pipe to file
        doc.pipe(fs.createWriteStream(filepath));

        // Add content
        this.addReportHeader(doc, title, days);
        this.addOverviewSection(doc, days);

        if (includeAnalytics && this.analytics) {
            this.addAnalyticsSection(doc, days);
        }

        this.addMoodSection(doc, days);
        this.addSleepSection(doc, days);
        this.addExerciseSection(doc, days);
        this.addRecommendations(doc, days);
        this.addFooter(doc);

        // Finalize PDF
        doc.end();

        console.log('\n✅ PDF Report generated successfully!');
        console.log(`   Location: ${filepath}`);
        console.log(`   File size: ${this.getFileSize(filepath)}`);

        return filepath;
    }

    /**
     * Add report header
     */
    addReportHeader(doc, title, days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const endDate = new Date();

        doc.fontSize(24)
           .fillColor('#2c3e50')
           .text(title, { align: 'center' })
           .moveDown(0.5);

        doc.fontSize(12)
           .fillColor('#7f8c8d')
           .text(`Period: ${this.formatDate(startDate)} - ${this.formatDate(endDate)}`, { align: 'center' })
           .text(`Generated: ${this.formatDate(new Date())}`, { align: 'center' })
           .moveDown(2);

        // Add separator line
        doc.strokeColor('#3498db')
           .lineWidth(2)
           .moveTo(50, doc.y)
           .lineTo(doc.page.width - 50, doc.y)
           .stroke()
           .moveDown(2);
    }

    /**
     * Add overview section
     */
    addOverviewSection(doc, days) {
        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text('Overview', { underline: true })
           .moveDown(1);

        const entries = this.dashboard.getAllEntries();
        const recentEntries = entries.slice(-days);

        // Calculate overview stats
        const stats = this.calculateOverviewStats(recentEntries);

        doc.fontSize(12)
           .fillColor('#34495e');

        const metrics = [
            { label: 'Total Check-ins', value: stats.totalEntries },
            { label: 'Average Mood', value: stats.avgMood },
            { label: 'Average Sleep (hours)', value: stats.avgSleep },
            { label: 'Total Exercise (minutes)', value: stats.totalExercise },
            { label: 'Best Day', value: stats.bestDay },
            { label: 'Compliance Rate', value: `${stats.complianceRate}%` }
        ];

        let y = doc.y;
        metrics.forEach((metric, index) => {
            if (index % 2 === 0) {
                y = doc.y;
                doc.text(`${metric.label}:`, 50, y, { continued: true, width: 200 });
                doc.fillColor('#3498db')
                   .text(` ${metric.value}`, { width: 200 });
                doc.fillColor('#34495e');
            } else {
                doc.text(`${metric.label}:`, 300, y, { continued: true, width: 200 });
                doc.fillColor('#3498db')
                   .text(` ${metric.value}`, { width: 200 });
                doc.fillColor('#34495e');
                doc.moveDown(0.5);
            }
        });

        doc.moveDown(2);
    }

    /**
     * Add analytics section
     */
    addAnalyticsSection(doc, days) {
        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text('Analytics & Insights', { underline: true })
           .moveDown(1);

        if (!this.analytics) {
            doc.fontSize(12)
               .fillColor('#7f8c8d')
               .text('Analytics not available')
               .moveDown(2);
            return;
        }

        // Get analytics data
        const report = this.analytics.generateComprehensiveReport(days);

        // Correlations
        doc.fontSize(14)
           .fillColor('#2c3e50')
           .text('Correlations', { underline: true })
           .moveDown(0.5);

        doc.fontSize(11)
           .fillColor('#34495e');

        const correlations = [
            { name: 'Sleep & Exercise', data: report.correlations.sleepExercise },
            { name: 'Mood & Sleep', data: report.correlations.moodSleep },
            { name: 'Mood & Exercise', data: report.correlations.moodExercise }
        ];

        correlations.forEach(corr => {
            if (corr.data && corr.data.correlation !== null) {
                const strength = this.getCorrelationEmoji(corr.data.correlation);
                doc.text(`• ${corr.name}: `, { continued: true });
                doc.fillColor('#3498db')
                   .text(`${corr.data.correlation.toFixed(2)} (${corr.data.strength}) ${strength}`)
                   .fillColor('#34495e');
            }
        });

        doc.moveDown(1.5);

        // Insights
        if (report.insights && report.insights.length > 0) {
            doc.fontSize(14)
               .fillColor('#2c3e50')
               .text('Key Insights', { underline: true })
               .moveDown(0.5);

            doc.fontSize(11)
               .fillColor('#34495e');

            report.insights.slice(0, 5).forEach(insight => {
                doc.text(`• ${insight.message}`, {
                    width: doc.page.width - 100,
                    align: 'left'
                });
                doc.moveDown(0.3);
            });
        }

        doc.moveDown(2);
    }

    /**
     * Add mood section
     */
    addMoodSection(doc, days) {
        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text('Mood Tracking', { underline: true })
           .moveDown(1);

        const entries = this.dashboard.getAllEntries().slice(-days);
        const moodData = entries
            .filter(e => e.mood)
            .map(e => ({ date: e.date, value: e.mood }));

        if (moodData.length === 0) {
            doc.fontSize(12)
               .fillColor('#7f8c8d')
               .text('No mood data available')
               .moveDown(2);
            return;
        }

        const avg = moodData.reduce((sum, d) => sum + d.value, 0) / moodData.length;
        const min = Math.min(...moodData.map(d => d.value));
        const max = Math.max(...moodData.map(d => d.value));

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Average Mood: ${avg.toFixed(1)}/10`)
           .text(`Range: ${min} - ${max}`)
           .text(`Total Entries: ${moodData.length}`)
           .moveDown(2);

        // Add simple visual bar chart
        this.addSimpleBarChart(doc, moodData.slice(-14), 'Mood (Last 14 Days)', 10);
    }

    /**
     * Add sleep section
     */
    addSleepSection(doc, days) {
        doc.addPage();

        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text('Sleep Tracking', { underline: true })
           .moveDown(1);

        const entries = this.dashboard.getAllEntries().slice(-days);
        const sleepData = entries
            .filter(e => e.sleep_hours)
            .map(e => ({ date: e.date, value: e.sleep_hours }));

        if (sleepData.length === 0) {
            doc.fontSize(12)
               .fillColor('#7f8c8d')
               .text('No sleep data available')
               .moveDown(2);
            return;
        }

        const avg = sleepData.reduce((sum, d) => sum + d.value, 0) / sleepData.length;
        const min = Math.min(...sleepData.map(d => d.value));
        const max = Math.max(...sleepData.map(d => d.value));

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Average Sleep: ${avg.toFixed(1)} hours`)
           .text(`Range: ${min} - ${max} hours`)
           .text(`Total Nights: ${sleepData.length}`)
           .moveDown(2);

        // Sleep quality assessment
        const quality = avg >= 7 ? 'Good' : avg >= 5 ? 'Fair' : 'Poor';
        const qualityColor = avg >= 7 ? '#27ae60' : avg >= 5 ? '#f39c12' : '#e74c3c';

        doc.text('Sleep Quality: ', { continued: true })
           .fillColor(qualityColor)
           .text(quality)
           .fillColor('#34495e')
           .moveDown(2);

        // Add simple visual bar chart
        this.addSimpleBarChart(doc, sleepData.slice(-14), 'Sleep Hours (Last 14 Days)', 12);
    }

    /**
     * Add exercise section
     */
    addExerciseSection(doc, days) {
        doc.addPage();

        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text('Exercise Tracking', { underline: true })
           .moveDown(1);

        const entries = this.dashboard.getAllEntries().slice(-days);
        const exerciseData = entries
            .filter(e => e.exercise_minutes)
            .map(e => ({ date: e.date, value: e.exercise_minutes }));

        if (exerciseData.length === 0) {
            doc.fontSize(12)
               .fillColor('#7f8c8d')
               .text('No exercise data available')
               .moveDown(2);
            return;
        }

        const total = exerciseData.reduce((sum, d) => sum + d.value, 0);
        const avg = total / exerciseData.length;
        const daysActive = exerciseData.filter(d => d.value > 0).length;

        doc.fontSize(12)
           .fillColor('#34495e')
           .text(`Total Exercise: ${total} minutes`)
           .text(`Average per Day: ${avg.toFixed(1)} minutes`)
           .text(`Active Days: ${daysActive}/${exerciseData.length}`)
           .text(`Activity Rate: ${((daysActive / exerciseData.length) * 100).toFixed(1)}%`)
           .moveDown(2);

        // Add simple visual bar chart
        this.addSimpleBarChart(doc, exerciseData.slice(-14), 'Exercise Minutes (Last 14 Days)', 60);
    }

    /**
     * Add recommendations section
     */
    addRecommendations(doc, days) {
        doc.addPage();

        doc.fontSize(18)
           .fillColor('#2c3e50')
           .text('Recommendations', { underline: true })
           .moveDown(1);

        const recommendations = this.generateRecommendations(days);

        doc.fontSize(12)
           .fillColor('#34495e');

        recommendations.forEach((rec, index) => {
            doc.fillColor(rec.color || '#34495e')
               .text(`${index + 1}. ${rec.title}`, { underline: true })
               .fillColor('#34495e')
               .text(`   ${rec.message}`)
               .moveDown(1);
        });
    }

    /**
     * Add footer
     */
    addFooter(doc) {
        const pages = doc.bufferedPageRange();

        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);

            doc.fontSize(10)
               .fillColor('#95a5a6')
               .text(
                   `StepSyncAI Wellness Report - Page ${i + 1} of ${pages.count}`,
                   50,
                   doc.page.height - 50,
                   { align: 'center', width: doc.page.width - 100 }
               );
        }
    }

    /**
     * Add simple bar chart to PDF
     */
    addSimpleBarChart(doc, data, title, maxValue) {
        const chartWidth = 450;
        const chartHeight = 120;
        const barWidth = chartWidth / Math.min(data.length, 14);
        const startX = 80;
        const startY = doc.y + 20;

        // Title
        doc.fontSize(11)
           .fillColor('#7f8c8d')
           .text(title, startX, startY - 15);

        // Draw axes
        doc.strokeColor('#bdc3c7')
           .lineWidth(1)
           .moveTo(startX, startY)
           .lineTo(startX, startY + chartHeight)
           .lineTo(startX + chartWidth, startY + chartHeight)
           .stroke();

        // Draw bars
        data.slice(-14).forEach((point, index) => {
            const barHeight = (point.value / maxValue) * chartHeight;
            const x = startX + (index * barWidth) + 2;
            const y = startY + chartHeight - barHeight;

            doc.rect(x, y, barWidth - 4, barHeight)
               .fillAndStroke('#3498db', '#2980b9');

            // Add value labels
            if (index % 2 === 0) {
                doc.fontSize(8)
                   .fillColor('#7f8c8d')
                   .text(point.value.toFixed(0), x, y - 12, {
                       width: barWidth - 4,
                       align: 'center'
                   });
            }
        });

        doc.moveDown(10);
    }

    /**
     * Calculate overview statistics
     */
    calculateOverviewStats(entries) {
        if (entries.length === 0) {
            return {
                totalEntries: 0,
                avgMood: 'N/A',
                avgSleep: 'N/A',
                totalExercise: 0,
                bestDay: 'N/A',
                complianceRate: 0
            };
        }

        const moods = entries.filter(e => e.mood).map(e => e.mood);
        const sleep = entries.filter(e => e.sleep_hours).map(e => e.sleep_hours);
        const exercise = entries.filter(e => e.exercise_minutes).map(e => e.exercise_minutes);

        const avgMood = moods.length > 0
            ? (moods.reduce((sum, m) => sum + m, 0) / moods.length).toFixed(1)
            : 'N/A';

        const avgSleep = sleep.length > 0
            ? (sleep.reduce((sum, s) => sum + s, 0) / sleep.length).toFixed(1)
            : 'N/A';

        const totalExercise = exercise.reduce((sum, e) => sum + e, 0);

        // Find best day (highest mood)
        let bestDay = 'N/A';
        if (moods.length > 0) {
            const bestEntry = entries.reduce((best, entry) => {
                return entry.mood > (best.mood || 0) ? entry : best;
            }, {});
            bestDay = bestEntry.date || 'N/A';
        }

        const complianceRate = ((entries.length / 30) * 100).toFixed(0);

        return {
            totalEntries: entries.length,
            avgMood,
            avgSleep,
            totalExercise,
            bestDay,
            complianceRate
        };
    }

    /**
     * Generate personalized recommendations
     */
    generateRecommendations(days) {
        const entries = this.dashboard.getAllEntries().slice(-days);
        const recommendations = [];

        if (entries.length === 0) {
            return [{
                title: 'Start Tracking',
                message: 'Begin tracking your wellness metrics to receive personalized recommendations.',
                color: '#3498db'
            }];
        }

        // Sleep recommendations
        const sleepData = entries.filter(e => e.sleep_hours);
        if (sleepData.length > 0) {
            const avgSleep = sleepData.reduce((sum, e) => sum + e.sleep_hours, 0) / sleepData.length;

            if (avgSleep < 6) {
                recommendations.push({
                    title: 'Improve Sleep Duration',
                    message: 'Your average sleep is below recommended levels. Try to get 7-9 hours per night for optimal health.',
                    color: '#e74c3c'
                });
            } else if (avgSleep >= 7 && avgSleep <= 9) {
                recommendations.push({
                    title: 'Great Sleep Habits',
                    message: 'You\'re maintaining healthy sleep patterns. Keep it up!',
                    color: '#27ae60'
                });
            }
        }

        // Exercise recommendations
        const exerciseData = entries.filter(e => e.exercise_minutes);
        if (exerciseData.length > 0) {
            const avgExercise = exerciseData.reduce((sum, e) => sum + e.exercise_minutes, 0) / exerciseData.length;

            if (avgExercise < 20) {
                recommendations.push({
                    title: 'Increase Physical Activity',
                    message: 'Try to get at least 30 minutes of exercise most days. Even a short walk helps!',
                    color: '#f39c12'
                });
            } else if (avgExercise >= 30) {
                recommendations.push({
                    title: 'Excellent Activity Level',
                    message: 'You\'re meeting recommended exercise guidelines. Great work!',
                    color: '#27ae60'
                });
            }
        }

        // Mood recommendations
        const moodData = entries.filter(e => e.mood);
        if (moodData.length > 0) {
            const avgMood = moodData.reduce((sum, e) => sum + e.mood, 0) / moodData.length;

            if (avgMood < 5) {
                recommendations.push({
                    title: 'Focus on Mental Wellness',
                    message: 'Consider talking to a mental health professional. You don\'t have to face challenges alone.',
                    color: '#e74c3c'
                });
            }
        }

        // Consistency recommendation
        const consistencyRate = (entries.length / days) * 100;
        if (consistencyRate < 50) {
            recommendations.push({
                title: 'Improve Tracking Consistency',
                message: 'Regular tracking helps identify patterns. Try to log daily for better insights.',
                color: '#3498db'
            });
        } else if (consistencyRate >= 80) {
            recommendations.push({
                title: 'Excellent Tracking Habits',
                message: 'Your consistent tracking is providing valuable insights. Keep it up!',
                color: '#27ae60'
            });
        }

        return recommendations.length > 0 ? recommendations : [{
            title: 'Keep Going',
            message: 'Continue tracking your wellness metrics to receive personalized recommendations.',
            color: '#3498db'
        }];
    }

    /**
     * Get correlation emoji for visual representation
     */
    getCorrelationEmoji(correlation) {
        const abs = Math.abs(correlation);
        if (abs >= 0.7) return '💪';
        if (abs >= 0.4) return '👍';
        if (abs >= 0.2) return '👌';
        return '➖';
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Get file size in human-readable format
     */
    getFileSize(filepath) {
        try {
            const stats = fs.statSync(filepath);
            const bytes = stats.size;
            const kb = bytes / 1024;
            return kb < 1024 ? `${kb.toFixed(2)} KB` : `${(kb / 1024).toFixed(2)} MB`;
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * List all generated reports
     */
    listReports() {
        try {
            const files = fs.readdirSync(this.reportsDir)
                .filter(file => file.endsWith('.pdf'))
                .map(file => ({
                    filename: file,
                    path: path.join(this.reportsDir, file),
                    created: fs.statSync(path.join(this.reportsDir, file)).mtime,
                    size: this.getFileSize(path.join(this.reportsDir, file))
                }))
                .sort((a, b) => b.created - a.created);

            return files;
        } catch (error) {
            console.error('Error listing reports:', error.message);
            return [];
        }
    }
}

module.exports = ReportGenerator;
