const ReportGenerator = require('../report-generator');
const DailyDashboard = require('../daily-dashboard');
const AnalyticsEngine = require('../analytics-engine');
const fs = require('fs');
const path = require('path');

describe('ReportGenerator', () => {
    let reportGen;
    let dashboard;
    let analytics;
    let reportsDir;

    beforeAll(() => {
        reportsDir = path.join(__dirname, 'test-reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
    });

    beforeEach(() => {
        const testDataFile = path.join(__dirname, 'test-dashboard-data.json');
        dashboard = new DailyDashboard(testDataFile);
        // Clear any existing data to ensure clean state
        dashboard.data = {
            goals: [],
            achievedGoals: [],
            nextGoalId: 1,
            goalStreaks: {},
            goalTemplates: dashboard.data.goalTemplates
        };
        // Clear tracker data to ensure clean state
        if (dashboard.mentalHealth) {
            dashboard.mentalHealth.data = { moodLogs: [], journalEntries: [] };
        }
        if (dashboard.sleep) {
            dashboard.sleep.data = { sleepLogs: [] };
        }
        if (dashboard.exercise) {
            dashboard.exercise.data = { exercises: [] };
        }
        if (dashboard.medication) {
            dashboard.medication.data = { medications: [], logs: [] };
        }
        analytics = new AnalyticsEngine(dashboard);
        reportGen = new ReportGenerator(dashboard, analytics, reportsDir);
    });

    afterAll(() => {
        if (fs.existsSync(reportsDir)) {
            fs.rmSync(reportsDir, { recursive: true, force: true });
        }
        const testDataFile = path.join(__dirname, 'test-dashboard-data.json');
        if (fs.existsSync(testDataFile)) {
            fs.unlinkSync(testDataFile);
        }
    });

    describe('Constructor', () => {
        test('creates reports directory if it does not exist', () => {
            const customDir = path.join(__dirname, 'custom-reports');
            const gen = new ReportGenerator(dashboard, analytics, customDir);
            expect(fs.existsSync(customDir)).toBe(true);
            fs.rmSync(customDir, { recursive: true, force: true });
        });

        test('works without analytics', () => {
            const gen = new ReportGenerator(dashboard, null, reportsDir);
            expect(gen.analytics).toBeNull();
        });

        test('uses default reports directory', () => {
            const gen = new ReportGenerator(dashboard);
            expect(gen.reportsDir).toBe('./data/reports');
        });

        test('stores dashboard reference', () => {
            expect(reportGen.dashboard).toBe(dashboard);
        });

        test('stores analytics reference', () => {
            expect(reportGen.analytics).toBe(analytics);
        });
    });

    describe('Helper Methods', () => {
        describe('formatDate', () => {
            test('formats dates correctly', () => {
                const date = new Date('2025-01-15');
                const formatted = reportGen.formatDate(date);
                expect(formatted).toMatch(/Jan 15, 2025/);
            });

            test('handles Date objects', () => {
                const date = new Date('2024-12-25');
                const formatted = reportGen.formatDate(date);
                expect(formatted).toBeTruthy();
                expect(typeof formatted).toBe('string');
            });

            test('handles different months', () => {
                const dates = [
                    new Date('2025-01-01'),
                    new Date('2025-06-15'),
                    new Date('2025-12-31')
                ];
                dates.forEach(date => {
                    const formatted = reportGen.formatDate(date);
                    expect(formatted).toBeTruthy();
                    expect(formatted).toMatch(/\w{3} \d{1,2}, \d{4}/);
                });
            });
        });

        describe('getCorrelationEmoji', () => {
            test('returns strong emoji for high correlation', () => {
                const emoji = reportGen.getCorrelationEmoji(0.8);
                expect(emoji).toBe('💪');
            });

            test('returns moderate emoji for medium correlation', () => {
                const emoji = reportGen.getCorrelationEmoji(0.5);
                expect(emoji).toBe('👍');
            });

            test('returns weak emoji for low correlation', () => {
                const emoji = reportGen.getCorrelationEmoji(0.3);
                expect(emoji).toBe('👌');
            });

            test('returns neutral emoji for very low correlation', () => {
                const emoji = reportGen.getCorrelationEmoji(0.1);
                expect(emoji).toBe('➖');
            });

            test('handles negative correlations', () => {
                expect(reportGen.getCorrelationEmoji(-0.8)).toBe('💪');
                expect(reportGen.getCorrelationEmoji(-0.5)).toBe('👍');
                expect(reportGen.getCorrelationEmoji(-0.3)).toBe('👌');
                expect(reportGen.getCorrelationEmoji(-0.1)).toBe('➖');
            });

            test('handles zero correlation', () => {
                const emoji = reportGen.getCorrelationEmoji(0);
                expect(emoji).toBe('➖');
            });

            test('handles boundary values', () => {
                expect(reportGen.getCorrelationEmoji(0.7)).toBe('💪');
                expect(reportGen.getCorrelationEmoji(0.69)).toBe('👍');
                expect(reportGen.getCorrelationEmoji(0.4)).toBe('👍');
                expect(reportGen.getCorrelationEmoji(0.39)).toBe('👌');
                expect(reportGen.getCorrelationEmoji(0.2)).toBe('👌');
                expect(reportGen.getCorrelationEmoji(0.19)).toBe('➖');
            });
        });

        describe('getFileSize', () => {
            test('returns size for existing file', () => {
                const testFile = path.join(reportsDir, 'test-file.txt');
                fs.writeFileSync(testFile, 'test content');
                const size = reportGen.getFileSize(testFile);
                expect(size).toMatch(/\d+\.\d+ (KB|MB)/);
                fs.unlinkSync(testFile);
            });

            test('returns Unknown for non-existent file', () => {
                const size = reportGen.getFileSize('/nonexistent/file.pdf');
                expect(size).toBe('Unknown');
            });

            test('formats KB correctly', () => {
                const testFile = path.join(reportsDir, 'small-file.txt');
                fs.writeFileSync(testFile, 'a'.repeat(500)); // 500 bytes
                const size = reportGen.getFileSize(testFile);
                expect(size).toContain('KB');
                fs.unlinkSync(testFile);
            });

            test('formats MB correctly for large files', () => {
                const testFile = path.join(reportsDir, 'large-file.txt');
                fs.writeFileSync(testFile, 'a'.repeat(2 * 1024 * 1024)); // 2 MB
                const size = reportGen.getFileSize(testFile);
                expect(size).toContain('MB');
                fs.unlinkSync(testFile);
            });
        });
    });

    describe('listReports', () => {
        test('returns empty array when no reports exist', () => {
            const reports = reportGen.listReports();
            expect(Array.isArray(reports)).toBe(true);
            expect(reports.length).toBe(0);
        });

        test('lists PDF files only', () => {
            // Create test files
            fs.writeFileSync(path.join(reportsDir, 'report1.pdf'), 'pdf content');
            fs.writeFileSync(path.join(reportsDir, 'report2.pdf'), 'pdf content');
            fs.writeFileSync(path.join(reportsDir, 'other.txt'), 'text content');

            const reports = reportGen.listReports();
            expect(reports.length).toBe(2);
            expect(reports.every(r => r.filename.endsWith('.pdf'))).toBe(true);

            // Cleanup
            fs.unlinkSync(path.join(reportsDir, 'report1.pdf'));
            fs.unlinkSync(path.join(reportsDir, 'report2.pdf'));
            fs.unlinkSync(path.join(reportsDir, 'other.txt'));
        });

        test('includes file metadata', () => {
            fs.writeFileSync(path.join(reportsDir, 'test-report.pdf'), 'content');

            const reports = reportGen.listReports();
            expect(reports.length).toBe(1);
            expect(reports[0]).toHaveProperty('filename');
            expect(reports[0]).toHaveProperty('path');
            expect(reports[0]).toHaveProperty('created');
            expect(reports[0]).toHaveProperty('size');

            fs.unlinkSync(path.join(reportsDir, 'test-report.pdf'));
        });

        test('sorts reports by creation date descending', () => {
            // Create files with delays to ensure different timestamps
            fs.writeFileSync(path.join(reportsDir, 'old-report.pdf'), 'old');
            const oldTime = Date.now() - 10000;
            fs.utimesSync(path.join(reportsDir, 'old-report.pdf'), oldTime / 1000, oldTime / 1000);

            fs.writeFileSync(path.join(reportsDir, 'new-report.pdf'), 'new');

            const reports = reportGen.listReports();
            expect(reports.length).toBe(2);
            expect(reports[0].filename).toBe('new-report.pdf');
            expect(reports[1].filename).toBe('old-report.pdf');

            // Cleanup
            fs.unlinkSync(path.join(reportsDir, 'old-report.pdf'));
            fs.unlinkSync(path.join(reportsDir, 'new-report.pdf'));
        });

        test('handles empty directory', () => {
            const reports = reportGen.listReports();
            expect(reports).toEqual([]);
        });

        test('handles directory with no PDF files', () => {
            fs.writeFileSync(path.join(reportsDir, 'file1.txt'), 'content');
            fs.writeFileSync(path.join(reportsDir, 'file2.json'), 'content');

            const reports = reportGen.listReports();
            expect(reports).toEqual([]);

            fs.unlinkSync(path.join(reportsDir, 'file1.txt'));
            fs.unlinkSync(path.join(reportsDir, 'file2.json'));
        });
    });

    describe('calculateOverviewStats', () => {
        test('handles empty entries', () => {
            const stats = reportGen.calculateOverviewStats([]);
            expect(stats).toHaveProperty('totalEntries', 0);
            expect(stats).toHaveProperty('avgMood', 'N/A');
            expect(stats).toHaveProperty('avgSleep', 'N/A');
            expect(stats).toHaveProperty('totalExercise', 0);
        });

        test('calculates stats with valid data', () => {
            const entries = [
                { date: '2025-01-01', mood: 8, sleep_hours: 7, exercise_minutes: 30 },
                { date: '2025-01-02', mood: 7, sleep_hours: 8, exercise_minutes: 45 },
                { date: '2025-01-03', mood: 9, sleep_hours: 7.5, exercise_minutes: 60 }
            ];
            const stats = reportGen.calculateOverviewStats(entries);
            expect(stats.totalEntries).toBe(3);
            expect(stats.avgMood).toBe('8.0');
            expect(stats.avgSleep).toBe('7.5');
            expect(stats.totalExercise).toBe(135);
        });

        test('handles partial data', () => {
            const entries = [
                { date: '2025-01-01', mood: 8 },
                { date: '2025-01-02', sleep_hours: 7 },
                { date: '2025-01-03', exercise_minutes: 30 }
            ];
            const stats = reportGen.calculateOverviewStats(entries);
            expect(stats.totalEntries).toBe(3);
            expect(stats.avgMood).toBe('8.0');
            expect(stats.avgSleep).toBe('7.0');
            expect(stats.totalExercise).toBe(30);
        });
    });

    describe('generateRecommendations', () => {
        test('returns start tracking message for empty data', () => {
            const recs = reportGen.generateRecommendations(30);
            expect(Array.isArray(recs)).toBe(true);
            expect(recs.length).toBe(1);
            expect(recs[0].title).toBe('Start Tracking');
        });

        test('recommends sleep improvement for low sleep', () => {
            // Add low sleep entries
            for (let i = 0; i < 7; i++) {
                dashboard.addEntry({
                    date: `2025-01-${String(i + 1).padStart(2, '0')}`,
                    sleep_hours: 5
                });
            }

            const recs = reportGen.generateRecommendations(30);
            expect(recs.some(r => r.title.includes('Sleep'))).toBe(true);
        });

        test('praises good sleep habits', () => {
            // Add good sleep entries
            for (let i = 0; i < 7; i++) {
                dashboard.addEntry({
                    date: `2025-01-${String(i + 1).padStart(2, '0')}`,
                    sleep_hours: 8
                });
            }

            const recs = reportGen.generateRecommendations(30);
            expect(recs.some(r => r.title.includes('Sleep') && r.color === '#27ae60')).toBe(true);
        });

        test('recommends more exercise for low activity', () => {
            // Add low exercise entries
            for (let i = 0; i < 7; i++) {
                dashboard.addEntry({
                    date: `2025-01-${String(i + 1).padStart(2, '0')}`,
                    exercise_minutes: 10
                });
            }

            const recs = reportGen.generateRecommendations(30);
            expect(recs.some(r => r.title.includes('Activity'))).toBe(true);
        });

        test('praises high activity level', () => {
            // Add high exercise entries
            for (let i = 0; i < 7; i++) {
                dashboard.addEntry({
                    date: `2025-01-${String(i + 1).padStart(2, '0')}`,
                    exercise_minutes: 45
                });
            }

            const recs = reportGen.generateRecommendations(30);
            expect(recs.some(r => r.title.includes('Activity') && r.color === '#27ae60')).toBe(true);
        });

        test('recommends tracking consistency', () => {
            // Add only 1 entry in 30 days (low consistency)
            dashboard.addEntry({
                date: '2025-01-01',
                mood: 7
            });

            const recs = reportGen.generateRecommendations(30);
            expect(recs.some(r => r.title.includes('Consistency'))).toBe(true);
        });
    });
});
