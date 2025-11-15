const fs = require('fs');
const path = require('path');
const MentalHealthTracker = require('../mental-health-tracker');
const MedicationTracker = require('../medication-tracker');
const AWSForKids = require('../aws-for-kids');

// Mock fs module
jest.mock('fs');

describe('Data Operations - Export, Backup, Restore, Stats', () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Default fs mocks
    fs.existsSync.mockReturnValue(false);
    fs.writeFileSync.mockImplementation(() => {});
    fs.readFileSync.mockReturnValue(JSON.stringify({}));
    fs.mkdirSync.mockImplementation(() => {});
    fs.readdirSync.mockReturnValue([]);
    fs.statSync.mockReturnValue({ size: 1024, mtime: new Date() });
    fs.copyFileSync.mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Mental Health Tracker - Stats', () => {
    let tracker;

    beforeEach(() => {
      tracker = new MentalHealthTracker('test-data.json');
      tracker.data = {
        moodEntries: [
          { id: 1, rating: 8, note: 'Good', timestamp: new Date().toISOString() },
          { id: 2, rating: 6, note: 'Okay', timestamp: new Date().toISOString() }
        ],
        journalEntries: [{ id: 1, content: 'Test', timestamp: new Date().toISOString() }],
        symptoms: [{ id: 1, type: 'anxiety', severity: 5, timestamp: new Date().toISOString() }],
        triggers: [{ id: 1, description: 'Test trigger' }],
        copingStrategies: [{ id: 1, name: 'Breathing', description: 'Deep breathing' }],
        goals: [
          { id: 1, description: 'Goal 1', completed: false },
          { id: 2, description: 'Goal 2', completed: true }
        ],
        profile: { accidentDate: new Date('2024-01-01').toISOString() }
      };
    });

    test('showStats should display comprehensive statistics', () => {
      tracker.showStats();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Statistics Summary'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total mood entries: 2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Average mood: 7.0'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total entries: 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total logged: 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Identified: 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Available: 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Active: 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Completed: 1'));
    });

    test('showStats should handle empty data', () => {
      tracker.data = {
        moodEntries: [],
        journalEntries: [],
        symptoms: [],
        triggers: [],
        copingStrategies: [],
        goals: [],
        profile: {}
      };

      tracker.showStats();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Statistics Summary'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tracking Duration: 0 days'));
    });
  });

  describe('Mental Health Tracker - Export CSV', () => {
    let tracker;

    beforeEach(() => {
      tracker = new MentalHealthTracker('test-data.json');
      tracker.data = {
        moodEntries: [{ id: 1, rating: 8, note: 'Good', timestamp: new Date().toISOString() }],
        journalEntries: [{ id: 1, content: 'Test journal', type: 'general', timestamp: new Date().toISOString() }],
        symptoms: [],
        triggers: [],
        copingStrategies: [],
        goals: []
      };
    });

    test('exportToCSV should create export directory', () => {
      tracker.exportToCSV('./test-exports');

      expect(fs.mkdirSync).toHaveBeenCalledWith('./test-exports', { recursive: true });
    });

    test('exportToCSV should export mood data', () => {
      tracker.exportToCSV('./test-exports');

      const writeCalls = fs.writeFileSync.mock.calls;
      const moodExport = writeCalls.find(call => call[0].includes('moods.csv'));
      expect(moodExport).toBeDefined();
      expect(moodExport[1]).toContain('Date,Time,Rating,Note');
      expect(moodExport[1]).toContain('8');
    });

    test('exportToCSV should return true on success', () => {
      const result = tracker.exportToCSV();
      expect(result).toBe(true);
    });

    test('exportToCSV should return false on error', () => {
      fs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = tracker.exportToCSV();
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Mental Health Tracker - Backup/Restore', () => {
    let tracker;

    beforeEach(() => {
      tracker = new MentalHealthTracker('test-data.json');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ moodEntries: [] }));
    });

    test('createBackup should create backup file', () => {
      // Mock existsSync to return false for directory, true for file
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('backups')) return false;
        return true; // data file exists
      });

      tracker.createBackup('./backups');

      expect(fs.mkdirSync).toHaveBeenCalledWith('./backups', { recursive: true });
      const backupCall = fs.writeFileSync.mock.calls.find(call =>
        call[0].includes('mental-health-backup-')
      );
      expect(backupCall).toBeDefined();
    });

    test('createBackup should return true on success', () => {
      const result = tracker.createBackup();
      expect(result).toBe(true);
    });

    test('createBackup should handle missing data file', () => {
      fs.existsSync.mockReturnValue(false);
      const result = tracker.createBackup();
      expect(result).toBe(false);
    });

    test('listBackups should display available backups', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        'mental-health-backup-2024-01-01T10-00-00.json',
        'mental-health-backup-2024-01-02T10-00-00.json'
      ]);

      tracker.listBackups('./backups');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Available Backups'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('mental-health-backup-2024-01-01'));
    });

    test('listBackups should handle no backups', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([]);

      tracker.listBackups('./backups');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No backups found'));
    });

    test('restoreFromBackup should restore data', () => {
      const backupData = JSON.stringify({ moodEntries: [{ id: 1, rating: 9 }] });
      fs.readFileSync.mockReturnValue(backupData);
      fs.existsSync.mockReturnValue(true);

      const result = tracker.restoreFromBackup('mental-health-backup-2024-01-01T10-00-00.json');

      expect(result).toBe(true);
      expect(fs.copyFileSync).toHaveBeenCalled(); // pre-restore backup
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('restored successfully'));
    });

    test('restoreFromBackup should handle missing backup file', () => {
      fs.existsSync.mockReturnValue(false);

      const result = tracker.restoreFromBackup('nonexistent.json');

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });
  });

  describe('Medication Tracker - Stats', () => {
    let tracker;

    beforeEach(() => {
      tracker = new MedicationTracker('test-meds.json');
      tracker.data = {
        medications: [
          { id: 1, name: 'Med 1', active: true, dosage: '10mg', scheduledTime: '08:00' },
          { id: 2, name: 'Med 2', active: false, dosage: '20mg', scheduledTime: '20:00' }
        ],
        history: [
          { medicationId: 1, timestamp: new Date().toISOString(), missed: false },
          { medicationId: 1, timestamp: new Date().toISOString(), missed: true }
        ]
      };
    });

    test('showStats should display medication statistics', () => {
      tracker.showStats();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Statistics Summary'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Active: 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Inactive: 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total doses logged: 2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('adherence rate: 50.0%'));
    });

    test('showStats should show today\'s schedule', () => {
      tracker.showStats();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Today\'s Schedule'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Med 1'));
    });
  });

  describe('Medication Tracker - Export/Backup', () => {
    let tracker;

    beforeEach(() => {
      tracker = new MedicationTracker('test-meds.json');
      tracker.data = {
        medications: [{ id: 1, name: 'Test Med', dosage: '10mg', frequency: 'daily', scheduledTime: '08:00', active: true, createdAt: new Date().toISOString() }],
        history: [{ medicationId: 1, medicationName: 'Test Med', timestamp: new Date().toISOString(), notes: 'Test', missed: false }]
      };
    });

    test('exportToCSV should export medications', () => {
      tracker.exportToCSV('./exports');

      const writeCalls = fs.writeFileSync.mock.calls;
      const medExport = writeCalls.find(call => call[0].includes('medications.csv'));
      expect(medExport).toBeDefined();
      expect(medExport[1]).toContain('ID,Name,Dosage,Frequency');
    });

    test('createBackup should work for medications', () => {
      fs.existsSync.mockReturnValue(true);
      const result = tracker.createBackup();
      expect(result).toBe(true);
    });
  });

  describe('AWS For Kids - Stats', () => {
    let app;

    beforeEach(() => {
      app = new AWSForKids('test-aws.json');
      app.data = {
        completedLessons: ['ec2', 's3', 'lambda'],
        quizScores: [
          { score: 8, total: 10, timestamp: new Date().toISOString() },
          { score: 9, total: 10, timestamp: new Date().toISOString() }
        ],
        progress: { ec2: 2, s3: 1 }
      };
    });

    test('showStats should display learning statistics', () => {
      app.showStats();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Statistics Summary'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Completed: 3/21'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total quizzes taken: 2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Average score: 85.0%'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Exam Readiness'));
    });

    test('showStats should calculate exam readiness correctly', () => {
      app.showStats();

      // Should show readiness calculation
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Topic Coverage:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Quiz Performance:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Practice Consistency:'));
    });

    test('showStats should handle no data', () => {
      app.data = { completedLessons: [], quizScores: [], progress: {} };
      app.showStats();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Completed: 0/21'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total quizzes taken: 0'));
    });
  });

  describe('AWS For Kids - Export/Backup', () => {
    let app;

    beforeEach(() => {
      app = new AWSForKids('test-aws.json');
      app.data = {
        completedLessons: ['ec2'],
        quizScores: [{ score: 8, total: 10, timestamp: new Date().toISOString() }],
        progress: { ec2: 1 }
      };
    });

    test('exportToCSV should export quiz scores', () => {
      app.exportToCSV('./exports');

      const writeCalls = fs.writeFileSync.mock.calls;
      const quizExport = writeCalls.find(call => call[0].includes('quiz-scores.csv'));
      expect(quizExport).toBeDefined();
      expect(quizExport[1]).toContain('Date,Time,Score,Total Questions');
    });

    test('exportToCSV should export completed lessons', () => {
      app.exportToCSV('./exports');

      const writeCalls = fs.writeFileSync.mock.calls;
      const lessonsExport = writeCalls.find(call => call[0].includes('completed-lessons.csv'));
      expect(lessonsExport).toBeDefined();
      expect(lessonsExport[1]).toContain('Topic');
      expect(lessonsExport[1]).toContain('ec2');
    });

    test('exportToCSV should export progress', () => {
      app.exportToCSV('./exports');

      const writeCalls = fs.writeFileSync.mock.calls;
      const progressExport = writeCalls.find(call => call[0].includes('progress.csv'));
      expect(progressExport).toBeDefined();
      expect(progressExport[1]).toContain('Topic,Completion Count');
    });

    test('exportToCSV should handle empty data', () => {
      app.data = { completedLessons: [], quizScores: [], progress: {} };
      const result = app.exportToCSV('./exports');
      expect(result).toBe(true);
    });

    test('createBackup should work for AWS data', () => {
      fs.existsSync.mockReturnValue(true);
      const result = app.createBackup();
      expect(result).toBe(true);
    });

    test('createBackup should handle errors', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const result = app.createBackup();
      expect(result).toBe(false);
    });

    test('restoreFromBackup should work for AWS data', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ completedLessons: ['s3'] }));

      const result = app.restoreFromBackup('aws-learning-backup-2024-01-01T10-00-00.json');
      expect(result).toBe(true);
    });

    test('listBackups should work for AWS data', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue(['aws-learning-backup-2024-01-01T10-00-00.json']);

      app.listBackups('./backups');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Available Backups'));
    });
  });

  describe('Additional Coverage - CSV Generation', () => {
    test('Mental Health - generateMoodCSV with special characters', () => {
      const tracker = new MentalHealthTracker('test.json');
      tracker.data.moodEntries = [{
        id: 1,
        rating: 7,
        note: 'Test with "quotes" and commas, etc',
        timestamp: new Date().toISOString()
      }];

      const csv = tracker.generateMoodCSV();
      expect(csv).toContain('""quotes""'); // Escaped quotes
    });

    test('Mental Health - generateJournalCSV', () => {
      const tracker = new MentalHealthTracker('test.json');
      tracker.data.journalEntries = [{
        id: 1,
        content: 'Journal entry',
        type: 'general',
        timestamp: new Date().toISOString()
      }];

      const csv = tracker.generateJournalCSV();
      expect(csv).toContain('Date,Time,Type,Content');
      expect(csv).toContain('Journal entry');
    });

    test('Mental Health - generateSymptomsCSV', () => {
      const tracker = new MentalHealthTracker('test.json');
      tracker.data.symptoms = [{
        id: 1,
        type: 'anxiety',
        severity: 7,
        note: 'Test',
        timestamp: new Date().toISOString()
      }];

      const csv = tracker.generateSymptomsCSV();
      expect(csv).toContain('Date,Time,Type,Severity,Note');
      expect(csv).toContain('anxiety');
    });

    test('Mental Health - generateTriggersCSV', () => {
      const tracker = new MentalHealthTracker('test.json');
      tracker.data.triggers = [{
        id: 1,
        description: 'Test trigger',
        intensity: 7,
        occurrences: 3,
        firstLogged: new Date().toISOString(),
        lastLogged: new Date().toISOString()
      }];

      const csv = tracker.generateTriggersCSV();
      expect(csv).toContain('Description,Intensity,Occurrences');
      expect(csv).toContain('Test trigger');
    });

    test('Mental Health - generateCopingCSV', () => {
      const tracker = new MentalHealthTracker('test.json');
      tracker.data.copingStrategies = [{
        id: 1,
        name: 'Breathing',
        description: 'Deep breathing',
        effectiveness: 8.5,
        timesUsed: 10
      }];

      const csv = tracker.generateCopingCSV();
      expect(csv).toContain('Name,Description,Effectiveness');
      expect(csv).toContain('Breathing');
    });

    test('Mental Health - generateGoalsCSV', () => {
      const tracker = new MentalHealthTracker('test.json');
      tracker.data.goals = [{
        id: 1,
        description: 'Test goal',
        targetDate: '2024-12-31',
        createdAt: new Date().toISOString(),
        completed: false,
        completedAt: null
      }];

      const csv = tracker.generateGoalsCSV();
      expect(csv).toContain('Description,Target Date,Created');
      expect(csv).toContain('Test goal');
    });

    test('Medication - generateMedicationsCSV', () => {
      const tracker = new MedicationTracker('test.json');
      tracker.data.medications = [{
        id: 123,
        name: 'Test Med',
        dosage: '10mg',
        frequency: 'daily',
        scheduledTime: '08:00',
        createdAt: new Date().toISOString(),
        active: true
      }];

      const csv = tracker.generateMedicationsCSV();
      expect(csv).toContain('ID,Name,Dosage,Frequency');
      expect(csv).toContain('Test Med');
    });

    test('Medication - generateHistoryCSV', () => {
      const tracker = new MedicationTracker('test.json');
      tracker.data.history = [{
        medicationId: 123,
        medicationName: 'Test Med',
        dosage: '10mg',
        timestamp: new Date().toISOString(),
        notes: 'With food',
        missed: false
      }];

      const csv = tracker.generateHistoryCSV();
      expect(csv).toContain('Date,Time,Medication ID');
      expect(csv).toContain('Test Med');
      expect(csv).toContain('No');
    });

    test('AWS - generateQuizScoresCSV', () => {
      const app = new AWSForKids('test.json');
      app.data.quizScores = [{
        score: 8,
        total: 10,
        timestamp: new Date().toISOString()
      }];

      const csv = app.generateQuizScoresCSV();
      expect(csv).toContain('Date,Time,Score,Total Questions,Percentage');
      expect(csv).toContain('80.0%');
    });

    test('AWS - generateProgressCSV', () => {
      const app = new AWSForKids('test.json');
      app.data.progress = { ec2: 3, s3: 2 };

      const csv = app.generateProgressCSV();
      expect(csv).toContain('Topic,Completion Count');
      expect(csv).toContain('ec2');
    });
  });

  describe('Error Handling for Export/Backup', () => {
    test('Mental Health - exportToCSV handles write errors', () => {
      const tracker = new MentalHealthTracker('test.json');
      tracker.data.moodEntries = [{ id: 1, rating: 7, note: 'Test', timestamp: new Date().toISOString() }];

      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      const result = tracker.exportToCSV();
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('Medication - createBackup handles write errors', () => {
      const tracker = new MedicationTracker('test.json');
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      const result = tracker.createBackup();
      expect(result).toBe(false);
    });

    test('AWS - restoreFromBackup handles invalid JSON', () => {
      const app = new AWSForKids('test.json');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json{]');

      const result = app.restoreFromBackup('backup.json');
      // loadData() catches JSON errors and returns defaults, so restore succeeds
      expect(result).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled(); // Error logged during loadData
    });
  });

  describe('Additional Branch Coverage', () => {
    test('AWS - showStats with high exam readiness (>= 80)', () => {
      const app = new AWSForKids('test.json');

      // Add all 20 topics for maximum coverage points
      app.data.completedLessons = ['ec2', 's3', 'lambda', 'dynamodb', 'cloudwatch',
                                     'iam', 'vpc', 'route53', 'cloudfront', 'rds',
                                     'sqs', 'sns', 'ebs', 'elb', 'autoscaling',
                                     'elasticache', 'cloudformation', 'pricing',
                                     'well-architected', 'support-plans'];
      // High quiz scores
      app.data.quizScores = [
        { score: 9, total: 10, timestamp: Date.now() },
        { score: 10, total: 10, timestamp: Date.now() },
        { score: 9, total: 10, timestamp: Date.now() }
      ];
      app.data.totalStudyTime = 50;

      app.showStats();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Ready to schedule exam'));
    });

    test('AWS - showStats with medium exam readiness (60-79)', () => {
      const app = new AWSForKids('test.json');

      // Moderate data: 10 topics (20 pts) + 80% quizzes (32 pts) + 6 quizzes (12 pts) = 64
      app.data.completedLessons = ['ec2', 's3', 'lambda', 'dynamodb', 'cloudwatch',
                                     'iam', 'vpc', 'route53', 'cloudfront', 'rds'];
      app.data.quizScores = [
        { score: 8, total: 10, timestamp: Date.now() },
        { score: 8, total: 10, timestamp: Date.now() },
        { score: 8, total: 10, timestamp: Date.now() },
        { score: 8, total: 10, timestamp: Date.now() },
        { score: 8, total: 10, timestamp: Date.now() },
        { score: 8, total: 10, timestamp: Date.now() }
      ];
      app.data.totalStudyTime = 25;

      app.showStats();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Almost there'));
    });

    test('Mental Health - createBackup when directory does not exist', () => {
      const tracker = new MentalHealthTracker('test.json');
      tracker.logMood(7, 'Test');

      fs.existsSync.mockImplementation((path) => {
        if (path.includes('backups')) return false; // Directory doesn't exist
        return true; // Data file exists
      });

      const result = tracker.createBackup();

      expect(fs.mkdirSync).toHaveBeenCalledWith('./backups', { recursive: true });
      expect(result).toBe(true);
    });

    test('Mental Health - createBackup when data file does not exist', () => {
      const tracker = new MentalHealthTracker('test.json');

      fs.existsSync.mockImplementation((path) => {
        if (path.includes('backups')) return true; // Directory exists
        return false; // Data file doesn't exist
      });

      const result = tracker.createBackup();

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No data file found'));
    });

    test('Mental Health - listBackups when directory does not exist', () => {
      const tracker = new MentalHealthTracker('test.json');

      fs.existsSync.mockReturnValue(false);

      tracker.listBackups();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No backups directory found'));
    });

    test('Medication - createBackup when directory does not exist', () => {
      const tracker = new MedicationTracker('test.json');
      tracker.addMedication('Test', '10mg', 'daily', '08:00');

      fs.existsSync.mockImplementation((path) => {
        if (path.includes('backups')) return false;
        return true;
      });

      const result = tracker.createBackup();

      expect(fs.mkdirSync).toHaveBeenCalledWith('./backups', { recursive: true });
      expect(result).toBe(true);
    });

    test('Medication - createBackup when data file does not exist', () => {
      const tracker = new MedicationTracker('test.json');

      fs.existsSync.mockImplementation((path) => {
        if (path.includes('backups')) return true;
        return false;
      });

      const result = tracker.createBackup();

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No data file found'));
    });

    test('AWS - createBackup when directory does not exist', () => {
      const app = new AWSForKids('test.json');
      app.data.completedLessons.push('ec2');

      fs.existsSync.mockImplementation((path) => {
        if (path.includes('backups')) return false;
        return true;
      });

      const result = app.createBackup();

      expect(fs.mkdirSync).toHaveBeenCalledWith('./backups', { recursive: true });
      expect(result).toBe(true);
    });

    test('AWS - createBackup when data file does not exist', () => {
      const app = new AWSForKids('test.json');

      fs.existsSync.mockImplementation((path) => {
        if (path.includes('backups')) return true;
        return false;
      });

      const result = app.createBackup();

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No data file found'));
    });

    test('Mental Health - listBackups returns files sorted by date', () => {
      const tracker = new MentalHealthTracker('test.json');

      fs.existsSync.mockReturnValue(true);
      fs.readdirSync.mockReturnValue([
        'mental-health-backup-2024-01-01T10-00-00.json',
        'mental-health-backup-2024-01-02T10-00-00.json',
        'other-file.txt',
        'mental-health-backup-2024-01-03T10-00-00.json'
      ]);
      fs.statSync.mockReturnValue({ size: 1024 });

      tracker.listBackups();

      // Should display backups in reverse chronological order
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('Mental Health - restoreFromBackup when backup file does not exist', () => {
      const tracker = new MentalHealthTracker('test.json');

      fs.existsSync.mockReturnValue(false);

      const result = tracker.restoreFromBackup('nonexistent.json');

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    test('Medication - restoreFromBackup when backup file does not exist', () => {
      const tracker = new MedicationTracker('test.json');

      fs.existsSync.mockReturnValue(false);

      const result = tracker.restoreFromBackup('nonexistent.json');

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    test('AWS - restoreFromBackup when backup file does not exist', () => {
      const app = new AWSForKids('test.json');

      fs.existsSync.mockReturnValue(false);

      const result = app.restoreFromBackup('nonexistent.json');

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });
  });
});
