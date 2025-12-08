const fs = require('fs');
const path = require('path');
const DailyDashboard = require('../daily-dashboard');
const AnalyticsEngine = require('../analytics-engine');
const ExportManager = require('../export-manager');

describe('ExportManager', () => {
    let dashboard;
    let analytics;
    let exportManager;
    const testDataDir = path.join(__dirname, 'test-export-data');
    const testExportsDir = path.join(testDataDir, 'exports');

    beforeEach(() => {
        // Clean up test directory first to ensure fresh start
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true, force: true });
        }

        // Clean up default tracker data files
        const trackerFiles = [
            'mental-health-data.json',
            'medications.json',  // MedicationTracker uses this filename
            'sleep-data.json',
            'exercise-data.json'
        ];
        trackerFiles.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });

        // Create test directory
        fs.mkdirSync(testDataDir, { recursive: true });

        const dataFile = path.join(testDataDir, 'test-dashboard.json');
        dashboard = new DailyDashboard(dataFile);
        analytics = new AnalyticsEngine(dashboard);

        // Clear any data that was loaded by the trackers
        if (dashboard.mentalHealth && dashboard.mentalHealth.data) {
            dashboard.mentalHealth.data.moodLogs = [];
            if (dashboard.mentalHealth.saveData) dashboard.mentalHealth.saveData();
        }
        if (dashboard.sleep && dashboard.sleep.data) {
            dashboard.sleep.data.sleepLogs = [];
            if (dashboard.sleep.saveData) dashboard.sleep.saveData();
        }
        if (dashboard.exercise && dashboard.exercise.data) {
            dashboard.exercise.data.exercises = [];
            if (dashboard.exercise.saveData) dashboard.exercise.saveData();
        }

        exportManager = new ExportManager(dashboard, testExportsDir);

        // Add some test data
        dashboard.addEntry({
            date: '2025-11-01',
            mood: 7,
            sleep_hours: 8,
            exercise_minutes: 30,
            notes: 'Good day'
        });

        dashboard.addEntry({
            date: '2025-11-02',
            mood: 6,
            sleep_hours: 7,
            exercise_minutes: 20,
            notes: 'Okay day'
        });

        dashboard.addEntry({
            date: '2025-11-03',
            mood: 8,
            sleep_hours: 9,
            exercise_minutes: 45,
            notes: 'Great day'
        });
    });

    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true, force: true });
        }

        // Clean up tracker data files
        const trackerFiles = [
            'mental-health-data.json',
            'medications.json',  // MedicationTracker uses this filename
            'sleep-data.json',
            'exercise-data.json'
        ];
        trackerFiles.forEach(file => {
            try {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            } catch (error) {
                // File may have been deleted by another test, ignore
            }
        });
    });

    describe('CSV Export', () => {
        test('should export data to CSV', () => {
            const filepath = exportManager.exportToCSV({ days: 30 });

            expect(fs.existsSync(filepath)).toBe(true);
            expect(filepath).toMatch(/\.csv$/);

            const content = fs.readFileSync(filepath, 'utf-8');
            expect(content).toContain('Date,Mood,Sleep Hours');
            expect(content).toContain('2025-11-01,7,8');
            expect(content).toContain('2025-11-02,6,7');
            expect(content).toContain('2025-11-03,8,9');
        });

        test('should include notes in CSV when requested', () => {
            const filepath = exportManager.exportToCSV({ days: 30, includeNotes: true });

            const content = fs.readFileSync(filepath, 'utf-8');
            expect(content).toContain('Notes');
            expect(content).toContain('"Good day"');
            expect(content).toContain('"Okay day"');
        });

        test('should exclude notes in CSV when not requested', () => {
            const filepath = exportManager.exportToCSV({ days: 30, includeNotes: false });

            const content = fs.readFileSync(filepath, 'utf-8');
            expect(content).not.toContain('Notes');
            expect(content).not.toContain('"Good day"');
        });

        test('should throw error when no data available', () => {
            // Clean up tracker files to ensure truly empty dashboard
            const trackerFiles = ['mental-health-data.json', 'medications.json', 'sleep-data.json', 'exercise-data.json'];
            trackerFiles.forEach(file => { if (fs.existsSync(file)) fs.unlinkSync(file); });

            // Create empty dashboard
            const emptyDataFile = path.join(testDataDir, 'empty-dashboard.json');
            const emptyDashboard = new DailyDashboard(emptyDataFile);
            const emptyExportsDir = path.join(testDataDir, 'empty-exports');
            const emptyExportManager = new ExportManager(emptyDashboard, emptyExportsDir);

            expect(() => {
                emptyExportManager.exportToCSV();
            }).toThrow('No data to export');
        });

        test('should limit export to specified days', () => {
            const filepath = exportManager.exportToCSV({ days: 2 });

            const content = fs.readFileSync(filepath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());

            // Header + 2 data rows
            expect(lines.length).toBe(3);
        });

        test('should use custom filename if provided', () => {
            const customFilename = 'custom-export.csv';
            const filepath = exportManager.exportToCSV({ filename: customFilename });

            expect(filepath).toContain(customFilename);
            expect(fs.existsSync(filepath)).toBe(true);
        });

        test('should handle entries with commas in notes', () => {
            dashboard.addEntry({
                date: '2025-11-04',
                mood: 7,
                notes: 'Good day, very productive'
            });

            const filepath = exportManager.exportToCSV({ days: 30 });
            const content = fs.readFileSync(filepath, 'utf-8');

            // Notes with commas should be quoted
            expect(content).toContain('"Good day, very productive"');
        });

        test('should handle entries with quotes in notes', () => {
            dashboard.addEntry({
                date: '2025-11-05',
                mood: 8,
                notes: 'Said "hello" today'
            });

            const filepath = exportManager.exportToCSV({ days: 30 });
            const content = fs.readFileSync(filepath, 'utf-8');

            // Quotes should be escaped
            expect(content).toContain('""hello""');
        });
    });

    describe('JSON Export', () => {
        test('should export data to JSON', () => {
            const filepath = exportManager.exportToJSON({ days: 30 });

            expect(fs.existsSync(filepath)).toBe(true);
            expect(filepath).toMatch(/\.json$/);

            const content = fs.readFileSync(filepath, 'utf-8');
            const data = JSON.parse(content);

            expect(data.metadata).toBeDefined();
            expect(data.entries).toBeDefined();
            expect(Array.isArray(data.entries)).toBe(true);
            expect(data.entries.length).toBe(3);
        });

        test('should include metadata in JSON export', () => {
            const filepath = exportManager.exportToJSON({ days: 30 });
            const content = fs.readFileSync(filepath, 'utf-8');
            const data = JSON.parse(content);

            expect(data.metadata.exportDate).toBeDefined();
            expect(data.metadata.totalEntries).toBe(3);
            expect(data.metadata.dateRange).toBeDefined();
            expect(data.metadata.dateRange.start).toBe('2025-11-01');
            expect(data.metadata.dateRange.end).toBe('2025-11-03');
        });

        test('should export pretty JSON by default', () => {
            const filepath = exportManager.exportToJSON({ days: 30 });
            const content = fs.readFileSync(filepath, 'utf-8');

            // Pretty JSON should have newlines and indentation
            expect(content).toContain('\n');
            expect(content).toContain('  ');
        });

        test('should export compact JSON when requested', () => {
            const filepath = exportManager.exportToJSON({ days: 30, pretty: false });
            const content = fs.readFileSync(filepath, 'utf-8');

            // Compact JSON should be single line
            const lines = content.split('\n');
            expect(lines.length).toBe(1);
        });

        test('should throw error when no data available', () => {
            // Clean up tracker files to ensure truly empty dashboard
            const trackerFiles = ['mental-health-data.json', 'medications.json', 'sleep-data.json', 'exercise-data.json'];
            trackerFiles.forEach(file => { if (fs.existsSync(file)) fs.unlinkSync(file); });

            const emptyDataFile = path.join(testDataDir, 'empty-json-dashboard.json');
            const emptyDashboard = new DailyDashboard(emptyDataFile);

            // Clear tracker data to ensure truly empty state
            if (emptyDashboard.mentalHealth) {
                emptyDashboard.mentalHealth.data = { moodLogs: [], journalEntries: [] };
            }
            if (emptyDashboard.sleep) {
                emptyDashboard.sleep.data = { sleepLogs: [] };
            }
            if (emptyDashboard.exercise) {
                emptyDashboard.exercise.data = { exercises: [] };
            }
            if (emptyDashboard.medication) {
                emptyDashboard.medication.data = { medications: [], logs: [] };
            }

            const emptyExportsDir = path.join(testDataDir, 'empty-json-exports');
            const emptyExportManager = new ExportManager(emptyDashboard, emptyExportsDir);

            expect(() => {
                emptyExportManager.exportToJSON();
            }).toThrow('No data to export');
        });
    });

    describe('Medication Export', () => {
        test('should export medications to CSV', () => {
            // Add medications
            dashboard.addMedication({
                name: 'Aspirin',
                dosage: '100mg',
                frequency: 'daily',
                start_date: '2025-11-01',
                active: true,
                notes: 'For headaches'
            });

            dashboard.addMedication({
                name: 'Vitamin D',
                dosage: '1000IU',
                frequency: 'daily',
                start_date: '2025-10-15',
                active: true
            });

            const filepath = exportManager.exportMedicationsToCSV();

            expect(fs.existsSync(filepath)).toBe(true);

            const content = fs.readFileSync(filepath, 'utf-8');
            expect(content).toContain('Name,Dosage,Frequency');
            expect(content).toContain('Aspirin,100mg,daily');
            expect(content).toContain('Vitamin D,1000IU,daily');
        });

        test('should throw error when no medications available', () => {
            // Clean up tracker files to ensure no medications
            const trackerFiles = ['mental-health-data.json', 'medications.json', 'sleep-data.json', 'exercise-data.json'];
            trackerFiles.forEach(file => { if (fs.existsSync(file)) fs.unlinkSync(file); });

            // Create fresh dashboard with no medications
            const emptyDataFile = path.join(testDataDir, 'no-meds-dashboard.json');
            const emptyDashboard = new DailyDashboard(emptyDataFile);
            const emptyExportsDir = path.join(testDataDir, 'no-meds-exports');
            const emptyExportManager = new ExportManager(emptyDashboard, emptyExportsDir);

            expect(() => {
                emptyExportManager.exportMedicationsToCSV();
            }).toThrow('No medication data to export');
        });

        test('should handle medications with notes containing commas', () => {
            dashboard.addMedication({
                name: 'Test Med',
                dosage: '50mg',
                frequency: 'daily',
                notes: 'Take with food, in the morning'
            });

            const filepath = exportManager.exportMedicationsToCSV();
            const content = fs.readFileSync(filepath, 'utf-8');

            expect(content).toContain('"Take with food, in the morning"');
        });
    });

    describe('Analytics Export', () => {
        test('should export analytics summary', () => {
            const filepath = exportManager.exportAnalyticsSummary(analytics, { days: 30 });

            expect(fs.existsSync(filepath)).toBe(true);
            expect(filepath).toMatch(/\.json$/);

            const content = fs.readFileSync(filepath, 'utf-8');
            const data = JSON.parse(content);

            expect(data.metadata).toBeDefined();
            expect(data.correlations).toBeDefined();
            expect(data.insights).toBeDefined();
        });

        test('should throw error when analytics not provided', () => {
            expect(() => {
                exportManager.exportAnalyticsSummary(null);
            }).toThrow('Analytics engine not provided');
        });
    });

    describe('Complete Backup', () => {
        test('should export complete backup', () => {
            dashboard.addMedication({
                name: 'Test Med',
                dosage: '50mg',
                frequency: 'daily'
            });

            const filepath = exportManager.exportCompleteBackup();

            expect(fs.existsSync(filepath)).toBe(true);

            const content = fs.readFileSync(filepath, 'utf-8');
            const backup = JSON.parse(content);

            expect(backup.metadata).toBeDefined();
            expect(backup.metadata.type).toBe('complete_backup');
            expect(backup.entries).toBeDefined();
            expect(backup.entries.length).toBe(3);
            expect(backup.medications).toBeDefined();
            expect(backup.medications.length).toBe(1);
        });

        test('should include metadata in complete backup', () => {
            const filepath = exportManager.exportCompleteBackup();
            const content = fs.readFileSync(filepath, 'utf-8');
            const backup = JSON.parse(content);

            expect(backup.metadata.exportDate).toBeDefined();
            expect(backup.metadata.version).toBe('1.0.0');
        });
    });

    describe('Import from JSON', () => {
        test('should import data from JSON file', () => {
            // First export data
            const exportPath = exportManager.exportToJSON({ days: 30 });

            // Create new isolated dashboard in separate directory
            const newTestDir = path.join(__dirname, 'test-import-isolated');
            if (fs.existsSync(newTestDir)) {
                fs.rmSync(newTestDir, { recursive: true, force: true });
            }
            fs.mkdirSync(newTestDir, { recursive: true });

            const newDataFile = path.join(newTestDir, 'import-test-dashboard.json');
            const newDashboard = new DailyDashboard(newDataFile);

            // Clear tracker data to ensure truly empty dashboard
            if (newDashboard.mentalHealth) {
                newDashboard.mentalHealth.data = { moodLogs: [], journalEntries: [] };
            }
            if (newDashboard.sleep) {
                newDashboard.sleep.data = { sleepLogs: [] };
            }
            if (newDashboard.exercise) {
                newDashboard.exercise.data = { exercises: [] };
            }
            if (newDashboard.medication) {
                newDashboard.medication.data = { medications: [], logs: [] };
            }

            const newExportsDir = path.join(newTestDir, 'exports');
            const newExportManager = new ExportManager(newDashboard, newExportsDir);

            // Import data
            const result = newExportManager.importFromJSON(exportPath);

            expect(result.imported).toBe(3);
            expect(result.total).toBe(3);

            const entries = newDashboard.getAllEntries();
            expect(entries.length).toBe(3);

            // Clean up
            if (fs.existsSync(newTestDir)) {
                fs.rmSync(newTestDir, { recursive: true, force: true });
            }
        });

        test('should skip duplicate entries on import', () => {
            const exportPath = exportManager.exportToJSON({ days: 30 });

            // Import to same dashboard (should skip all as duplicates)
            const result = exportManager.importFromJSON(exportPath);

            expect(result.imported).toBe(0);
            expect(result.total).toBe(3);
        });

        test('should throw error for non-existent file', () => {
            expect(() => {
                exportManager.importFromJSON('/path/to/nonexistent.json');
            }).toThrow('File not found');
        });

        test('should throw error for invalid JSON format', () => {
            const invalidPath = path.join(testDataDir, 'invalid.json');
            fs.writeFileSync(invalidPath, '{ "invalid": true }', 'utf-8');

            expect(() => {
                exportManager.importFromJSON(invalidPath);
            }).toThrow('Invalid backup file format');
        });
    });

    describe('List Exports', () => {
        test('should list all exported files', () => {
            exportManager.exportToCSV({ days: 30 });
            exportManager.exportToJSON({ days: 30 });

            const exports = exportManager.listExports();

            expect(Array.isArray(exports)).toBe(true);
            expect(exports.length).toBeGreaterThanOrEqual(2);
            expect(exports[0]).toHaveProperty('filename');
            expect(exports[0]).toHaveProperty('type');
            expect(exports[0]).toHaveProperty('size');
            expect(exports[0]).toHaveProperty('created');
        });

        test('should return empty array when no exports', () => {
            const emptyDataFile = path.join(testDataDir, 'empty-list-dashboard.json');
            const emptyDashboard = new DailyDashboard(emptyDataFile);
            const emptyExportsDir = path.join(testDataDir, 'empty-list-exports');
            const emptyExportManager = new ExportManager(emptyDashboard, emptyExportsDir);

            const exports = emptyExportManager.listExports();
            expect(exports.length).toBe(0);
        });

        test('should sort exports by creation date (newest first)', async () => {
            // Clean exports directory first to ensure only our files exist
            if (fs.existsSync(testExportsDir)) {
                const files = fs.readdirSync(testExportsDir);
                files.forEach(file => {
                    fs.unlinkSync(path.join(testExportsDir, file));
                });
            }

            exportManager.exportToCSV({ filename: 'first.csv' });

            // Wait to ensure different timestamps (increased for CI environments)
            await new Promise(resolve => setTimeout(resolve, 1100));
            exportManager.exportToJSON({ filename: 'second.json' });

            const exports = exportManager.listExports();

            // Should have exactly 2 files
            expect(exports.length).toBe(2);

            // Newest (second.json) should be first
            expect(exports[0].filename).toBe('second.json');
            expect(exports[1].filename).toBe('first.csv');

            // Verify timestamp ordering
            expect(exports[0].created >= exports[1].created).toBe(true);
        });
    });

    describe('Delete Export', () => {
        test('should delete export file', () => {
            const filepath = exportManager.exportToCSV({ filename: 'to-delete.csv' });
            expect(fs.existsSync(filepath)).toBe(true);

            exportManager.deleteExport('to-delete.csv');
            expect(fs.existsSync(filepath)).toBe(false);
        });

        test('should throw error when file does not exist', () => {
            expect(() => {
                exportManager.deleteExport('nonexistent.csv');
            }).toThrow('Export file not found');
        });
    });

    describe('Export Statistics', () => {
        test('should calculate export statistics', () => {
            exportManager.exportToCSV({ days: 30 });
            exportManager.exportToJSON({ days: 30 });

            const stats = exportManager.getExportStats();

            expect(stats.totalFiles).toBeGreaterThanOrEqual(2);
            expect(stats.byType).toBeDefined();
            expect(stats.byType.CSV).toBeGreaterThanOrEqual(1);
            expect(stats.byType.JSON).toBeGreaterThanOrEqual(1);
            expect(stats.totalSize).toBeDefined();
        });

        test('should return zero stats when no exports', () => {
            const emptyDataFile = path.join(testDataDir, 'empty-stats-dashboard.json');
            const emptyDashboard = new DailyDashboard(emptyDataFile);
            const emptyExportsDir = path.join(testDataDir, 'empty-stats-exports');
            const emptyExportManager = new ExportManager(emptyDashboard, emptyExportsDir);

            const stats = emptyExportManager.getExportStats();

            expect(stats.totalFiles).toBe(0);
            expect(Object.keys(stats.byType).length).toBe(0);
        });
    });

    describe('File Size Calculation', () => {
        test('should calculate file size correctly', () => {
            const filepath = exportManager.exportToJSON({ days: 30 });
            const size = exportManager.getFileSize(filepath);

            expect(size).toBeDefined();
            expect(size).toMatch(/KB|MB/);
        });

        test('should return "Unknown" for non-existent file', () => {
            const size = exportManager.getFileSize('/path/to/nonexistent.json');
            expect(size).toBe('Unknown');
        });
    });
});
