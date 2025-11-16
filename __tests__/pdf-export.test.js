const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const MentalHealthTracker = require('../mental-health-tracker');
const MedicationTracker = require('../medication-tracker');
const AWSForKids = require('../aws-for-kids');

// Mock dependencies
jest.mock('fs');
jest.mock('pdfkit');
jest.mock('node-cron');
jest.mock('node-notifier');

describe('PDF Export - Mental Health Tracker', () => {
    let tracker;
    let mockDoc;
    let mockStream;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock PDFDocument
        mockDoc = {
            fontSize: jest.fn().mockReturnThis(),
            fillColor: jest.fn().mockReturnThis(),
            text: jest.fn().mockReturnThis(),
            moveDown: jest.fn().mockReturnThis(),
            strokeColor: jest.fn().mockReturnThis(),
            lineWidth: jest.fn().mockReturnThis(),
            moveTo: jest.fn().mockReturnThis(),
            lineTo: jest.fn().mockReturnThis(),
            stroke: jest.fn().mockReturnThis(),
            circle: jest.fn().mockReturnThis(),
            fill: jest.fn().mockReturnThis(),
            rect: jest.fn().mockReturnThis(),
            pipe: jest.fn(),
            end: jest.fn(),
            y: 100,
            page: { height: 800 }
        };

        PDFDocument.mockImplementation(() => mockDoc);

        // Mock write stream
        mockStream = {
            on: jest.fn((event, callback) => {
                if (event === 'finish') {
                    // Store callback to call it later
                    mockStream.finishCallback = callback;
                }
                return mockStream;
            }),
            finishCallback: null
        };

        fs.createWriteStream = jest.fn(() => mockStream);
        fs.existsSync = jest.fn(() => false);
        fs.mkdirSync = jest.fn();
        fs.readFileSync = jest.fn(() => JSON.stringify({
            profile: {},
            moodEntries: [],
            journalEntries: [],
            symptoms: [],
            triggers: [],
            copingStrategies: [],
            emergencyContacts: [],
            goals: []
        }));
        fs.writeFileSync = jest.fn();

        // Suppress console output
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});

        tracker = new MentalHealthTracker('test-mental-health.json');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('exportToPDF', () => {
        test('creates export directory if it does not exist', async () => {
            fs.existsSync.mockReturnValue(false);

            const exportPromise = tracker.exportToPDF('./test-exports');
            mockStream.finishCallback(); // Trigger finish event
            await exportPromise;

            expect(fs.mkdirSync).toHaveBeenCalledWith('./test-exports', { recursive: true });
        });

        test('does not create directory if it already exists', async () => {
            fs.existsSync.mockReturnValue(true);

            const exportPromise = tracker.exportToPDF('./test-exports');
            mockStream.finishCallback();
            await exportPromise;

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        test('generates PDF with correct filename format', async () => {
            const exportPromise = tracker.exportToPDF('./exports');
            mockStream.finishCallback();
            const filepath = await exportPromise;

            expect(filepath).toMatch(/exports\/mental-health-report-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.pdf/);
        });

        test('creates PDFDocument with correct options', async () => {
            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(PDFDocument).toHaveBeenCalledWith({ margin: 50 });
        });

        test('adds header to PDF', async () => {
            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.fontSize).toHaveBeenCalledWith(24);
            expect(mockDoc.text).toHaveBeenCalledWith('Mental Health Report', expect.any(Object));
        });

        test('adds summary section to PDF', async () => {
            tracker.data.moodEntries = [
                { rating: 7, timestamp: new Date().toISOString() },
                { rating: 8, timestamp: new Date().toISOString() }
            ];

            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith('📊 Summary Statistics');
        });

        test('adds mood trend chart when mood data exists', async () => {
            tracker.data.moodEntries = [
                { rating: 7, timestamp: new Date().toISOString() },
                { rating: 8, timestamp: new Date().toISOString() }
            ];

            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith('📈 Mood Trend (Last 30 Days)');
        });

        test('skips mood charts when no mood data exists', async () => {
            tracker.data.moodEntries = [];

            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            const calls = mockDoc.text.mock.calls.map(call => call[0]);
            expect(calls).not.toContain('📈 Mood Trend (Last 30 Days)');
            expect(calls).not.toContain('📊 Mood Distribution');
        });

        test('adds journal section when entries exist', async () => {
            tracker.data.journalEntries = [
                { content: 'Test entry', type: 'general', timestamp: new Date().toISOString() }
            ];

            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith('📝 Recent Journal Entries');
        });

        test('adds goals section when goals exist', async () => {
            tracker.data.goals = [
                { description: 'Test goal', completed: false, targetDate: '2025-12-31' }
            ];

            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith('🎯 Active Goals');
        });

        test('adds coping strategies section when strategies exist', async () => {
            tracker.data.copingStrategies = [
                { name: 'Deep breathing', description: 'Test', timesUsed: 5, effectiveness: 8 }
            ];

            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith('💪 Top Coping Strategies');
        });

        test('adds footer to PDF', async () => {
            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith(
                'Generated by StepSync Mental Health Tracker',
                50,
                750,
                { align: 'center' }
            );
        });

        test('pipes document to write stream', async () => {
            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.pipe).toHaveBeenCalledWith(mockStream);
        });

        test('ends document after adding content', async () => {
            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.end).toHaveBeenCalled();
        });

        test('logs success message on completion', async () => {
            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('PDF report generated successfully'));
        });

        test('handles write stream errors', async () => {
            mockStream.on = jest.fn((event, callback) => {
                if (event === 'error') {
                    callback(new Error('Write failed'));
                }
                return mockStream;
            });

            await expect(tracker.exportToPDF()).rejects.toThrow('Write failed');
        });

        test('handles PDF generation errors', async () => {
            PDFDocument.mockImplementation(() => {
                throw new Error('PDF creation failed');
            });

            await expect(tracker.exportToPDF()).rejects.toThrow('PDF creation failed');
            expect(console.error).toHaveBeenCalledWith('Error generating PDF:', 'PDF creation failed');
        });
    });

    describe('addSummarySection', () => {
        test('displays correct statistics', () => {
            tracker.data.moodEntries = [
                { rating: 7, timestamp: new Date().toISOString() },
                { rating: 9, timestamp: new Date().toISOString() }
            ];
            tracker.data.journalEntries = [
                { content: 'Test', type: 'general', timestamp: new Date().toISOString() }
            ];
            tracker.data.goals = [
                { description: 'Goal 1', completed: false },
                { description: 'Goal 2', completed: true }
            ];
            tracker.data.copingStrategies = [
                { name: 'Strategy 1' }
            ];

            tracker.addSummarySection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('Total Mood Entries: 2', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('Average Mood Rating: 8.0/10', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('Journal Entries: 1', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('Active Goals: 1', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('Completed Goals: 1', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('Coping Strategies: 1', expect.any(Object));
        });

        test('handles empty data gracefully', () => {
            tracker.data.moodEntries = [];
            tracker.data.journalEntries = [];
            tracker.data.goals = [];
            tracker.data.copingStrategies = [];

            tracker.addSummarySection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('Total Mood Entries: 0', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('Average Mood Rating: N/A/10', expect.any(Object));
        });
    });

    describe('addMoodTrendChart', () => {
        test('draws chart axes', () => {
            const now = new Date();
            tracker.data.moodEntries = [
                { rating: 7, timestamp: now.toISOString() },
                { rating: 8, timestamp: now.toISOString() }
            ];

            tracker.addMoodTrendChart(mockDoc);

            expect(mockDoc.moveTo).toHaveBeenCalled();
            expect(mockDoc.lineTo).toHaveBeenCalled();
            expect(mockDoc.stroke).toHaveBeenCalled();
        });

        test('draws Y-axis labels from 0 to 10', () => {
            const now = new Date();
            tracker.data.moodEntries = [
                { rating: 5, timestamp: now.toISOString() }
            ];

            tracker.addMoodTrendChart(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('0', expect.any(Number), expect.any(Number));
            expect(mockDoc.text).toHaveBeenCalledWith('2', expect.any(Number), expect.any(Number));
            expect(mockDoc.text).toHaveBeenCalledWith('4', expect.any(Number), expect.any(Number));
            expect(mockDoc.text).toHaveBeenCalledWith('6', expect.any(Number), expect.any(Number));
            expect(mockDoc.text).toHaveBeenCalledWith('8', expect.any(Number), expect.any(Number));
            expect(mockDoc.text).toHaveBeenCalledWith('10', expect.any(Number), expect.any(Number));
        });

        test('plots mood data points', () => {
            const now = new Date();
            tracker.data.moodEntries = [
                { rating: 7, timestamp: now.toISOString() },
                { rating: 8, timestamp: now.toISOString() }
            ];

            tracker.addMoodTrendChart(mockDoc);

            expect(mockDoc.circle).toHaveBeenCalledTimes(2);
        });

        test('draws lines between mood points', () => {
            const now = new Date();
            tracker.data.moodEntries = [
                { rating: 7, timestamp: now.toISOString() },
                { rating: 8, timestamp: now.toISOString() },
                { rating: 6, timestamp: now.toISOString() }
            ];

            tracker.addMoodTrendChart(mockDoc);

            // Should draw 2 lines for 3 points
            const strokeCalls = mockDoc.stroke.mock.calls.length;
            expect(strokeCalls).toBeGreaterThan(0);
        });

        test('filters to last 30 days only', () => {
            const now = new Date();
            const recent = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)); // 5 days ago
            const old = new Date(now.getTime() - (40 * 24 * 60 * 60 * 1000)); // 40 days ago

            tracker.data.moodEntries = [
                { rating: 5, timestamp: old.toISOString() },
                { rating: 7, timestamp: recent.toISOString() },
                { rating: 8, timestamp: now.toISOString() }
            ];

            tracker.addMoodTrendChart(mockDoc);

            // Should only plot the 2 recent moods (not the 40-day-old one)
            expect(mockDoc.circle).toHaveBeenCalledTimes(2);
        });

        test('shows message when no recent mood data', () => {
            const old = new Date();
            old.setDate(old.getDate() - 40);
            tracker.data.moodEntries = [
                { rating: 5, timestamp: old.toISOString() }
            ];

            tracker.addMoodTrendChart(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('No mood data in the last 30 days', expect.any(Object));
        });
    });

    describe('addMoodDistribution', () => {
        test('categorizes moods into correct ranges', () => {
            tracker.data.moodEntries = [
                { rating: 1, timestamp: new Date().toISOString() },
                { rating: 3, timestamp: new Date().toISOString() },
                { rating: 5, timestamp: new Date().toISOString() },
                { rating: 7, timestamp: new Date().toISOString() },
                { rating: 9, timestamp: new Date().toISOString() }
            ];

            tracker.addMoodDistribution(mockDoc);

            // Should draw 5 bars (one for each range)
            expect(mockDoc.rect).toHaveBeenCalledTimes(5);
        });

        test('uses correct colors for mood ranges', () => {
            tracker.data.moodEntries = [
                { rating: 1, timestamp: new Date().toISOString() }
            ];

            tracker.addMoodDistribution(mockDoc);

            // Should use red color for 1-2 range
            expect(mockDoc.fillColor).toHaveBeenCalledWith('#e74c3c');
        });

        test('displays percentages for each range', () => {
            tracker.data.moodEntries = [
                { rating: 7, timestamp: new Date().toISOString() },
                { rating: 8, timestamp: new Date().toISOString() }
            ];

            tracker.addMoodDistribution(mockDoc);

            // Should show 100% for the 7-8 range
            expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('100%'), expect.any(Number), expect.any(Number), expect.any(Object));
        });
    });

    describe('getMoodColor', () => {
        test('returns correct color for each mood range', () => {
            expect(tracker.getMoodColor('1-2')).toBe('#e74c3c');  // Red
            expect(tracker.getMoodColor('3-4')).toBe('#e67e22');  // Orange
            expect(tracker.getMoodColor('5-6')).toBe('#f39c12');  // Yellow
            expect(tracker.getMoodColor('7-8')).toBe('#2ecc71');  // Green
            expect(tracker.getMoodColor('9-10')).toBe('#27ae60'); // Dark Green
        });

        test('returns default color for invalid range', () => {
            expect(tracker.getMoodColor('invalid')).toBe('#95a5a6');
        });
    });

    describe('addJournalSection', () => {
        test('shows most recent 5 entries', () => {
            tracker.data.journalEntries = Array(10).fill(null).map((_, i) => ({
                content: `Entry ${i}`,
                type: 'general',
                timestamp: new Date().toISOString()
            }));

            tracker.addJournalSection(mockDoc);

            // Should only show 5 entries (each with date and content = 10 text calls minimum)
            const textCalls = mockDoc.text.mock.calls.filter(call =>
                call[0].includes('Entry') || call[0].includes('general')
            );
            expect(textCalls.length).toBeGreaterThanOrEqual(5);
        });

        test('truncates long journal entries', () => {
            const longContent = 'a'.repeat(200);
            tracker.data.journalEntries = [
                { content: longContent, type: 'general', timestamp: new Date().toISOString() }
            ];

            tracker.addJournalSection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith(
                expect.stringContaining('...'),
                expect.any(Object)
            );
        });

        test('does not truncate short entries', () => {
            const shortContent = 'Short entry';
            tracker.data.journalEntries = [
                { content: shortContent, type: 'general', timestamp: new Date().toISOString() }
            ];

            tracker.addJournalSection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith(shortContent, expect.any(Object));
        });
    });

    describe('addGoalsSection', () => {
        test('shows only active goals', () => {
            tracker.data.goals = [
                { description: 'Active goal', completed: false, targetDate: '2025-12-31' },
                { description: 'Completed goal', completed: true, targetDate: '2025-11-01' }
            ];

            tracker.addGoalsSection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('Active goal'), expect.any(Object));
            expect(mockDoc.text).not.toHaveBeenCalledWith(expect.stringContaining('Completed goal'), expect.any(Object));
        });

        test('limits to 5 goals', () => {
            tracker.data.goals = Array(10).fill(null).map((_, i) => ({
                description: `Goal ${i}`,
                completed: false
            }));

            tracker.addGoalsSection(mockDoc);

            // Count goal description calls (numbered 1-5, not including header)
            const goalCalls = mockDoc.text.mock.calls.filter(call =>
                typeof call[0] === 'string' && /^\d+\.\s+Goal/.test(call[0])
            );
            expect(goalCalls.length).toBe(5);
        });

        test('handles goals without target dates', () => {
            tracker.data.goals = [
                { description: 'Goal without date', completed: false }
            ];

            tracker.addGoalsSection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('No deadline'), expect.any(Object));
        });

        test('shows message when no active goals', () => {
            tracker.data.goals = [
                { description: 'Completed', completed: true }
            ];

            tracker.addGoalsSection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('No active goals', expect.any(Object));
        });
    });

    describe('addCopingSection', () => {
        test('sorts strategies by times used', () => {
            tracker.data.copingStrategies = [
                { name: 'Strategy A', timesUsed: 3 },
                { name: 'Strategy B', timesUsed: 10 },
                { name: 'Strategy C', timesUsed: 5 }
            ];

            tracker.addCopingSection(mockDoc);

            // Strategy B should be listed first (has most uses)
            const textCalls = mockDoc.text.mock.calls;
            const strategyBIndex = textCalls.findIndex(call => call[0].includes('Strategy B'));
            const strategyAIndex = textCalls.findIndex(call => call[0].includes('Strategy A'));

            expect(strategyBIndex).toBeLessThan(strategyAIndex);
        });

        test('limits to top 5 strategies', () => {
            tracker.data.copingStrategies = Array(10).fill(null).map((_, i) => ({
                name: `Strategy ${i}`,
                timesUsed: i
            }));

            tracker.addCopingSection(mockDoc);

            // Count strategy name calls
            const strategyCalls = mockDoc.text.mock.calls.filter(call =>
                typeof call[0] === 'string' && call[0].includes('Strategy')
            );
            expect(strategyCalls.length).toBeLessThanOrEqual(5);
        });

        test('displays effectiveness and usage count', () => {
            tracker.data.copingStrategies = [
                { name: 'Deep breathing', timesUsed: 5, effectiveness: 8 }
            ];

            tracker.addCopingSection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith(
                expect.stringContaining('Used: 5x'),
                expect.any(Object)
            );
            expect(mockDoc.text).toHaveBeenCalledWith(
                expect.stringContaining('Effectiveness: 8/10'),
                expect.any(Object)
            );
        });

        test('handles strategies without effectiveness rating', () => {
            tracker.data.copingStrategies = [
                { name: 'New strategy', timesUsed: 1 }
            ];

            tracker.addCopingSection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith(
                expect.stringContaining('Effectiveness: N/A'),
                expect.any(Object)
            );
        });

        test('includes strategy description if available', () => {
            tracker.data.copingStrategies = [
                { name: 'Breathing', description: 'Deep belly breathing', timesUsed: 5 }
            ];

            tracker.addCopingSection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith(
                expect.stringContaining('Deep belly breathing'),
                expect.any(Object)
            );
        });
    });
});

describe('PDF Export - Medication Tracker', () => {
    let tracker;
    let mockDoc;
    let mockStream;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock PDFDocument
        mockDoc = {
            fontSize: jest.fn().mockReturnThis(),
            fillColor: jest.fn().mockReturnThis(),
            text: jest.fn().mockReturnThis(),
            moveDown: jest.fn().mockReturnThis(),
            strokeColor: jest.fn().mockReturnThis(),
            lineWidth: jest.fn().mockReturnThis(),
            moveTo: jest.fn().mockReturnThis(),
            lineTo: jest.fn().mockReturnThis(),
            stroke: jest.fn().mockReturnThis(),
            arc: jest.fn().mockReturnThis(),
            fill: jest.fn().mockReturnThis(),
            pipe: jest.fn(),
            end: jest.fn(),
            y: 100,
            page: { height: 800 }
        };

        PDFDocument.mockImplementation(() => mockDoc);

        // Mock write stream
        mockStream = {
            on: jest.fn((event, callback) => {
                if (event === 'finish') {
                    mockStream.finishCallback = callback;
                }
                return mockStream;
            }),
            finishCallback: null
        };

        fs.createWriteStream = jest.fn(() => mockStream);
        fs.existsSync = jest.fn(() => false);
        fs.mkdirSync = jest.fn();
        fs.readFileSync = jest.fn(() => JSON.stringify({
            medications: [],
            history: []
        }));
        fs.writeFileSync = jest.fn();

        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});

        tracker = new MedicationTracker('test-medications.json');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('exportToPDF', () => {
        test('generates PDF with correct filename format', async () => {
            const exportPromise = tracker.exportToPDF('./exports');
            mockStream.finishCallback();
            const filepath = await exportPromise;

            expect(filepath).toMatch(/exports\/medication-report-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.pdf/);
        });

        test('adds header to PDF', async () => {
            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith('Medication Tracker Report', expect.any(Object));
        });

        test('adds summary section', async () => {
            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith('📊 Summary');
        });

        test('adds active medications section when medications exist', async () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', dosage: '100mg', frequency: 'daily', scheduledTime: '08:00', active: true }
            ];

            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith('💊 Active Medications');
        });

        test('skips active medications section when none exist', async () => {
            tracker.data.medications = [];

            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            const calls = mockDoc.text.mock.calls.map(call => call[0]);
            expect(calls).not.toContain('💊 Active Medications');
        });

        test('adds adherence chart when history exists', async () => {
            tracker.data.history = [
                { medicationId: 1, medicationName: 'Aspirin', timestamp: new Date().toISOString(), missed: false }
            ];

            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith('📈 Adherence Overview (Last 30 Days)');
        });

        test('adds today schedule section', async () => {
            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith("📅 Today's Schedule");
        });

        test('adds recent history when entries exist', async () => {
            tracker.data.history = [
                { medicationId: 1, medicationName: 'Aspirin', timestamp: new Date().toISOString(), missed: false }
            ];

            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith('📝 Recent History (Last 10 Entries)');
        });

        test('adds footer', async () => {
            const exportPromise = tracker.exportToPDF();
            mockStream.finishCallback();
            await exportPromise;

            expect(mockDoc.text).toHaveBeenCalledWith(
                'Generated by StepSync Medication Tracker',
                50,
                750,
                { align: 'center' }
            );
        });

        test('handles errors during PDF generation', async () => {
            PDFDocument.mockImplementation(() => {
                throw new Error('PDF error');
            });

            await expect(tracker.exportToPDF()).rejects.toThrow('PDF error');
        });
    });

    describe('addMedicationSummary', () => {
        test('displays correct medication statistics', () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', active: true },
                { id: 2, name: 'Vitamin D', active: true },
                { id: 3, name: 'Old Med', active: false }
            ];
            tracker.data.history = [
                { medicationId: 1, timestamp: new Date().toISOString(), missed: false },
                { medicationId: 1, timestamp: new Date().toISOString(), missed: false },
                { medicationId: 1, timestamp: new Date().toISOString(), missed: true }
            ];

            tracker.addMedicationSummary(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('Total Medications: 3', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('Active Medications: 2', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('Total Doses Tracked: 3', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('Adherence Rate: 66.7%', expect.any(Object));
        });

        test('handles empty data', () => {
            tracker.data.medications = [];
            tracker.data.history = [];

            tracker.addMedicationSummary(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('Total Medications: 0', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('Adherence Rate: 0%', expect.any(Object));
        });
    });

    describe('addActiveMedicationsSection', () => {
        test('lists all active medications with details', () => {
            tracker.data.medications = [
                { id: 1, name: 'Aspirin', dosage: '100mg', frequency: 'daily', scheduledTime: '08:00', active: true },
                { id: 2, name: 'Vitamin D', dosage: '1000 IU', frequency: 'daily', scheduledTime: '08:00', active: true }
            ];

            tracker.addActiveMedicationsSection(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('1. Aspirin', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('   Dosage: 100mg', expect.any(Object));
            expect(mockDoc.text).toHaveBeenCalledWith('2. Vitamin D', expect.any(Object));
        });

        test('excludes inactive medications', () => {
            tracker.data.medications = [
                { id: 1, name: 'Active Med', active: true, dosage: '100mg', frequency: 'daily', scheduledTime: '08:00' },
                { id: 2, name: 'Inactive Med', active: false, dosage: '50mg', frequency: 'daily', scheduledTime: '08:00' }
            ];

            tracker.addActiveMedicationsSection(mockDoc);

            const calls = mockDoc.text.mock.calls.map(call => call[0]);
            expect(calls.some(c => c.includes('Active Med'))).toBe(true);
            expect(calls.some(c => c.includes('Inactive Med'))).toBe(false);
        });
    });

    describe('addAdherenceChart', () => {
        test('draws pie chart for adherence data', () => {
            const now = new Date();
            tracker.data.history = [
                { medicationId: 1, timestamp: now.toISOString(), missed: false },
                { medicationId: 1, timestamp: now.toISOString(), missed: false },
                { medicationId: 1, timestamp: now.toISOString(), missed: true }
            ];

            tracker.addAdherenceChart(mockDoc);

            // Should draw arcs for pie chart
            expect(mockDoc.arc).toHaveBeenCalled();
        });

        test('shows legend with percentages', () => {
            const now = new Date();
            tracker.data.history = [
                { medicationId: 1, timestamp: now.toISOString(), missed: false },
                { medicationId: 1, timestamp: now.toISOString(), missed: true }
            ];

            tracker.addAdherenceChart(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('✓ Taken'), expect.any(Number), expect.any(Number));
            expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('✗ Missed'), expect.any(Number), expect.any(Number));
        });

        test('filters to last 30 days only', () => {
            const now = new Date();
            const old = new Date(now.getTime() - (40 * 24 * 60 * 60 * 1000));

            tracker.data.history = [
                { medicationId: 1, timestamp: old.toISOString(), missed: false },
                { medicationId: 1, timestamp: now.toISOString(), missed: false }
            ];

            tracker.addAdherenceChart(mockDoc);

            // Should only process recent data (1 taken, 0 missed)
            expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('Taken: 1'), expect.any(Number), expect.any(Number));
        });

        test('shows message when no recent data', () => {
            tracker.data.history = [];

            tracker.addAdherenceChart(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('No data in the last 30 days', expect.any(Object));
        });
    });

    describe('addTodaySchedule', () => {
        test('lists medications sorted by time', () => {
            tracker.data.medications = [
                { id: 1, name: 'Evening Med', dosage: '50mg', scheduledTime: '20:00', active: true },
                { id: 2, name: 'Morning Med', dosage: '100mg', scheduledTime: '08:00', active: true }
            ];

            tracker.addTodaySchedule(mockDoc);

            const calls = mockDoc.text.mock.calls.map(call => call[0]);
            const morningIndex = calls.findIndex(c => c && c.includes('08:00'));
            const eveningIndex = calls.findIndex(c => c && c.includes('20:00'));

            expect(morningIndex).toBeLessThan(eveningIndex);
        });

        test('shows message when no active medications', () => {
            tracker.data.medications = [];

            tracker.addTodaySchedule(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('No active medications', expect.any(Object));
        });
    });

    describe('addRecentHistory', () => {
        test('shows last 10 entries', () => {
            tracker.data.history = Array(15).fill(null).map((_, i) => ({
                medicationId: 1,
                medicationName: `Med ${i}`,
                timestamp: new Date().toISOString(),
                missed: false
            }));

            tracker.addRecentHistory(mockDoc);

            // Count medication name calls (should be exactly 10)
            const medCalls = mockDoc.text.mock.calls.filter(call =>
                call[0] && call[0].includes('Med ')
            );
            expect(medCalls.length).toBeLessThanOrEqual(10);
        });

        test('displays taken status with green check', () => {
            tracker.data.history = [
                { medicationId: 1, medicationName: 'Aspirin', timestamp: new Date().toISOString(), missed: false }
            ];

            tracker.addRecentHistory(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('✓ Taken', expect.any(Object));
            expect(mockDoc.fillColor).toHaveBeenCalledWith('#27ae60');
        });

        test('displays missed status with red X', () => {
            tracker.data.history = [
                { medicationId: 1, medicationName: 'Aspirin', timestamp: new Date().toISOString(), missed: true }
            ];

            tracker.addRecentHistory(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith('✗ Missed', expect.any(Object));
            expect(mockDoc.fillColor).toHaveBeenCalledWith('#e74c3c');
        });

        test('includes notes if provided', () => {
            tracker.data.history = [
                { medicationId: 1, medicationName: 'Aspirin', timestamp: new Date().toISOString(), missed: false, notes: 'With food' }
            ];

            tracker.addRecentHistory(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('With food'), expect.any(Object));
        });
    });
});
