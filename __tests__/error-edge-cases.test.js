const fs = require('fs');
const path = require('path');
const MentalHealthTracker = require('../mental-health-tracker');
const MedicationTracker = require('../medication-tracker');
const AWSForKids = require('../aws-for-kids');

jest.mock('fs');
jest.mock('node-cron');
jest.mock('node-notifier');

describe('Error Handling - Backup/Restore/Export', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Mental Health Tracker - Error Paths', () => {
        let tracker;

        beforeEach(() => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                profile: {},
                moodEntries: [],
                journalEntries: [],
                symptoms: [],
                triggers: [],
                copingStrategies: [],
                emergencyContacts: [],
                goals: []
            }));
            fs.writeFileSync.mockImplementation(() => {});

            tracker = new MentalHealthTracker('test-data.json');
        });

        describe('createBackup - error handling', () => {
            test('handles read error during backup', () => {
                fs.existsSync.mockReturnValue(true);
                fs.mkdirSync.mockImplementation(() => {});
                fs.readFileSync.mockImplementation(() => {
                    throw new Error('Read permission denied');
                });

                const result = tracker.createBackup();

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating backup:', 'Read permission denied');
            });

            test('handles write error during backup', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockReturnValue('test data');
                fs.writeFileSync.mockImplementation(() => {
                    throw new Error('Write permission denied');
                });

                const result = tracker.createBackup();

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating backup:', 'Write permission denied');
            });

            test('handles mkdir error during backup', () => {
                fs.existsSync.mockImplementation((path) => {
                    // data file exists, backup dir doesn't
                    return path.includes('test-data.json');
                });
                fs.mkdirSync.mockImplementation(() => {
                    throw new Error('Cannot create directory');
                });

                const result = tracker.createBackup();

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating backup:', 'Cannot create directory');
            });
        });

        describe('listBackups - error handling', () => {
            test('handles read directory error', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readdirSync.mockImplementation(() => {
                    throw new Error('Cannot read directory');
                });

                tracker.listBackups();

                expect(consoleErrorSpy).toHaveBeenCalledWith('Error listing backups:', 'Cannot read directory');
            });

            test('handles stat error for backup files', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readdirSync.mockReturnValue(['mental-health-backup-2025-01-01.json']);
                fs.statSync.mockImplementation(() => {
                    throw new Error('Cannot stat file');
                });

                tracker.listBackups();

                expect(consoleErrorSpy).toHaveBeenCalledWith('Error listing backups:', 'Cannot stat file');
            });
        });

        describe('restoreFromBackup - error handling', () => {
            test('handles read error during restore', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockImplementation((file) => {
                    if (file.includes('backup')) {
                        throw new Error('Cannot read backup file');
                    }
                    return JSON.stringify({});
                });

                const result = tracker.restoreFromBackup('backup-file.json');

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error restoring backup:', 'Cannot read backup file');
            });

            test('handles write error during restore', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockReturnValue('backup data');
                fs.writeFileSync.mockImplementation(() => {
                    throw new Error('Cannot write to data file');
                });

                const result = tracker.restoreFromBackup('backup-file.json');

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error restoring backup:', 'Cannot write to data file');
            });

            test('handles copy error during pre-restore backup', () => {
                fs.existsSync.mockReturnValue(true);
                fs.copyFileSync.mockImplementation(() => {
                    throw new Error('Cannot copy file');
                });

                const result = tracker.restoreFromBackup('backup-file.json');

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error restoring backup:', 'Cannot copy file');
            });
        });

        describe('exportToCSV - error handling', () => {
            test('handles write error during CSV export', () => {
                tracker.data.moodEntries = [
                    { rating: 7, note: 'Good', timestamp: new Date().toISOString() }
                ];
                fs.existsSync.mockReturnValue(true);
                fs.writeFileSync.mockImplementation(() => {
                    throw new Error('Cannot write CSV file');
                });

                const result = tracker.exportToCSV();

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error exporting data:', 'Cannot write CSV file');
            });

            test('handles mkdir error during CSV export', () => {
                tracker.data.moodEntries = [
                    { rating: 7, note: 'Good', timestamp: new Date().toISOString() }
                ];
                fs.existsSync.mockReturnValue(false);
                fs.mkdirSync.mockImplementation(() => {
                    throw new Error('Cannot create export directory');
                });

                const result = tracker.exportToCSV();

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error exporting data:', 'Cannot create export directory');
            });
        });

        describe('exportToCSV - conditional exports', () => {
            beforeEach(() => {
                fs.existsSync.mockReturnValue(true);
                fs.mkdirSync.mockImplementation(() => {});
                fs.writeFileSync.mockImplementation(() => {});
            });

            test('exports symptoms CSV when symptoms data exists', () => {
                tracker.data.symptoms = [
                    { id: 1, name: 'Headache', severity: 5, timestamp: new Date().toISOString() }
                ];

                const result = tracker.exportToCSV();

                expect(result).toBe(true);
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    expect.stringContaining('symptoms.csv'),
                    expect.any(String)
                );
            });

            test('exports triggers CSV when triggers data exists', () => {
                tracker.data.triggers = [
                    { id: 1, name: 'Stress', description: 'Work stress', timestamp: new Date().toISOString() }
                ];

                const result = tracker.exportToCSV();

                expect(result).toBe(true);
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    expect.stringContaining('triggers.csv'),
                    expect.any(String)
                );
            });

            test('exports coping strategies CSV when data exists', () => {
                tracker.data.copingStrategies = [
                    { id: 1, name: 'Deep breathing', description: 'Breathe slowly', effectiveness: 8 }
                ];

                const result = tracker.exportToCSV();

                expect(result).toBe(true);
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    expect.stringContaining('coping.csv'),
                    expect.any(String)
                );
            });

            test('exports goals CSV when goals data exists', () => {
                tracker.data.goals = [
                    { id: 1, title: 'Exercise daily', description: 'Walk 30 min', progress: 50, status: 'in_progress' }
                ];

                const result = tracker.exportToCSV();

                expect(result).toBe(true);
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    expect.stringContaining('goals.csv'),
                    expect.any(String)
                );
            });

            test('exports all conditional CSVs when all data exists', () => {
                tracker.data.symptoms = [
                    { id: 1, name: 'Headache', severity: 5, timestamp: new Date().toISOString() }
                ];
                tracker.data.triggers = [
                    { id: 1, name: 'Stress', description: 'Work stress', timestamp: new Date().toISOString() }
                ];
                tracker.data.copingStrategies = [
                    { id: 1, name: 'Deep breathing', description: 'Breathe slowly', effectiveness: 8 }
                ];
                tracker.data.goals = [
                    { id: 1, title: 'Exercise daily', description: 'Walk 30 min', progress: 50, status: 'in_progress' }
                ];

                const result = tracker.exportToCSV();

                expect(result).toBe(true);
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    expect.stringContaining('symptoms.csv'),
                    expect.any(String)
                );
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    expect.stringContaining('triggers.csv'),
                    expect.any(String)
                );
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    expect.stringContaining('coping.csv'),
                    expect.any(String)
                );
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                    expect.stringContaining('goals.csv'),
                    expect.any(String)
                );
            });
        });

        describe('exportToPDF - error handling', () => {
            test('handles mkdir error during PDF export', async () => {
                fs.existsSync.mockReturnValue(false);
                fs.mkdirSync.mockImplementation(() => {
                    throw new Error('Cannot create PDF directory');
                });

                await expect(tracker.exportToPDF()).rejects.toThrow('Cannot create PDF directory');
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating PDF:', 'Cannot create PDF directory');
            });
        });

        describe('saveData failures', () => {
            test('handles save error when adding emergency contact', () => {
                fs.writeFileSync.mockImplementation(() => {
                    throw new Error('Write failed');
                });

                const result = tracker.addEmergencyContact('John Doe', 'Friend', '555-1234', 'Test');

                expect(result).toBe(false);
            });

            test('handles save error when completing goal', () => {
                tracker.data.goals = [
                    { id: 1, description: 'Test goal', completed: false }
                ];
                fs.writeFileSync.mockImplementation(() => {
                    throw new Error('Write failed');
                });

                const result = tracker.completeGoal(1);

                expect(result).toBe(false);
            });
        });
    });

    describe('Medication Tracker - Error Paths', () => {
        let tracker;

        beforeEach(() => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                medications: [],
                history: []
            }));
            fs.writeFileSync.mockImplementation(() => {});

            tracker = new MedicationTracker('test-meds.json');
        });

        describe('backup/restore errors', () => {
            test('handles backup read error', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockImplementation(() => {
                    throw new Error('Read failed');
                });

                const result = tracker.createBackup();

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            test('handles restore write error', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockReturnValue('backup data');
                fs.writeFileSync.mockImplementation(() => {
                    throw new Error('Write failed');
                });

                const result = tracker.restoreFromBackup('backup.json');

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            test('successfully lists backups with file details', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readdirSync.mockReturnValue(['medication-backup-2025-01-01.json', 'medication-backup-2025-01-02.json']);
                fs.statSync.mockReturnValue({
                    size: 2048,
                    mtime: new Date('2025-01-01')
                });

                tracker.listBackups();

                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Available Backups'));
            });

            test('handles no backups directory', () => {
                fs.existsSync.mockReturnValue(false);

                tracker.listBackups();

                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No backups directory found'));
            });

            test('handles empty backups directory', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readdirSync.mockReturnValue([]);

                tracker.listBackups();

                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No backups found'));
            });

            test('successfully restores from backup', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockReturnValue(JSON.stringify({
                    medications: [{ id: 1, name: 'Test Med' }],
                    history: []
                }));
                fs.writeFileSync.mockImplementation(() => {});
                fs.copyFileSync.mockImplementation(() => {});

                const result = tracker.restoreFromBackup('backup.json');

                expect(result).toBe(true);
                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Data restored successfully'));
            });
        });

        describe('export errors', () => {
            test('handles CSV export error', () => {
                tracker.data.medications = [
                    { id: 1, name: 'Aspirin', active: true, dosage: '100mg', frequency: 'daily', scheduledTime: '08:00' }
                ];
                fs.writeFileSync.mockImplementation(() => {
                    throw new Error('Export failed');
                });

                const result = tracker.exportToCSV();

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            test('handles PDF export directory creation error', async () => {
                fs.existsSync.mockReturnValue(false);
                fs.mkdirSync.mockImplementation(() => {
                    throw new Error('Directory creation failed');
                });

                await expect(tracker.exportToPDF()).rejects.toThrow('Directory creation failed');
            });
        });

        describe('adherence tracking - edge cases', () => {
            test('handles empty medication history', () => {
                tracker.data.medications = [
                    { id: 1, name: 'Aspirin', active: true, dosage: '100mg', frequency: 'daily', scheduledTime: '08:00' }
                ];
                tracker.data.history = [];

                tracker.visualizeAdherence(30);

                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No medication history yet'));
            });

            test('handles no recent medication history', () => {
                const veryOld = new Date('2020-01-01');
                tracker.data.medications = [
                    { id: 1, name: 'Aspirin', active: true, dosage: '100mg', frequency: 'daily', scheduledTime: '08:00' }
                ];
                tracker.data.history = [
                    { medicationId: 1, medicationName: 'Aspirin', timestamp: veryOld.toISOString(), missed: false }
                ];

                tracker.visualizeAdherence(30);

                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/No medication history in the last \d+ days/));
            });

            test('handles medication history with missed doses', () => {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const twoDaysAgo = new Date(today);
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

                tracker.data.medications = [
                    { id: 1, name: 'Aspirin', active: true, dosage: '100mg', frequency: 'daily', scheduledTime: '08:00' }
                ];
                tracker.data.history = [
                    { medicationId: 1, medicationName: 'Aspirin', timestamp: twoDaysAgo.toISOString(), missed: false },
                    { medicationId: 1, medicationName: 'Aspirin', timestamp: yesterday.toISOString(), missed: true },
                    { medicationId: 1, medicationName: 'Aspirin', timestamp: today.toISOString(), missed: false }
                ];

                tracker.visualizeAdherence(7);

                expect(consoleLogSpy).toHaveBeenCalled();
            });
        });
    });

    describe('AWS Learning Tracker - Error Paths', () => {
        let tracker;

        beforeEach(() => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                completedLessons: [],
                quizScores: []
            }));
            fs.writeFileSync.mockImplementation(() => {});

            tracker = new AWSForKids('test-aws.json');
        });

        describe('backup/restore errors', () => {
            test('handles backup creation error', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockImplementation(() => {
                    throw new Error('Backup read failed');
                });

                const result = tracker.createBackup();

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            test('handles restore error', () => {
                fs.existsSync.mockReturnValue(true);
                fs.copyFileSync.mockImplementation(() => {
                    throw new Error('Restore copy failed');
                });

                const result = tracker.restoreFromBackup('backup.json');

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            test('handles missing backups directory when listing', () => {
                fs.existsSync.mockReturnValue(false);

                tracker.listBackups();

                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No backups directory found'));
            });

            test('handles empty backups directory', () => {
                fs.existsSync.mockReturnValue(true);
                fs.readdirSync.mockReturnValue([]);

                tracker.listBackups();

                expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No backups found'));
            });
        });

        describe('export errors', () => {
            test('handles CSV export write error', () => {
                tracker.data.quizScores = [
                    { score: 8, total: 10, timestamp: new Date().toISOString() }
                ];
                fs.writeFileSync.mockImplementation(() => {
                    throw new Error('CSV write failed');
                });

                const result = tracker.exportToCSV();

                expect(result).toBe(false);
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            test('handles PDF export error', async () => {
                fs.existsSync.mockReturnValue(false);
                fs.mkdirSync.mockImplementation(() => {
                    throw new Error('PDF directory error');
                });

                await expect(tracker.exportToPDF()).rejects.toThrow('PDF directory error');
            });
        });
    });

    describe('Edge Cases - Data Validation', () => {
        test('Mental Health: handles corrupted JSON gracefully', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{ invalid json }');
            fs.writeFileSync.mockImplementation(() => {});

            const tracker = new MentalHealthTracker('test.json');

            // Should initialize with default data structure
            expect(tracker.data).toBeDefined();
        });

        test('Medication: handles empty medication list', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                medications: [],
                history: []
            }));

            const tracker = new MedicationTracker('test.json');

            const result = tracker.enableReminders();

            expect(result).toBe(false);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No active medications'));
        });

        test('AWS: handles quiz with zero total questions', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                completedLessons: [],
                quizScores: []
            }));

            const tracker = new AWSForKids('test.json');
            tracker.data.quizScores = [
                { score: 0, total: 0, timestamp: new Date().toISOString() }
            ];

            // Should not crash when calculating percentages
            const mockDoc = {
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
                arc: jest.fn().mockReturnThis(),
                y: 100,
                page: { height: 800 }
            };

            tracker.addExamReadinessSummary(mockDoc);

            expect(mockDoc.text).toHaveBeenCalled();
        });
    });

    describe('Edge Cases - Boundary Conditions', () => {
        test('Mental Health: handles future timestamps', () => {
            fs.existsSync.mockReturnValue(true);
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            fs.readFileSync.mockReturnValue(JSON.stringify({
                profile: {},
                moodEntries: [
                    { rating: 7, note: 'Future mood', timestamp: futureDate.toISOString() }
                ],
                journalEntries: [],
                symptoms: [],
                triggers: [],
                copingStrategies: [],
                emergencyContacts: [],
                goals: []
            }));

            const tracker = new MentalHealthTracker('test.json');

            expect(tracker.data.moodEntries.length).toBe(1);
            expect(tracker.data.moodEntries[0].rating).toBe(7);
        });

        test('Mental Health: handles coping strategies with effectiveness ratings', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                profile: {},
                moodEntries: [],
                journalEntries: [],
                symptoms: [],
                triggers: [],
                copingStrategies: [
                    { id: 1, name: 'Deep breathing', description: 'Breathe', timesUsed: 5, effectiveness: 8 },
                    { id: 2, name: 'Walking', description: 'Walk', timesUsed: 3, effectiveness: 6 },
                    { id: 3, name: 'Music', description: 'Listen', timesUsed: 2 }
                ],
                emergencyContacts: [],
                goals: []
            }));

            const tracker = new MentalHealthTracker('test.json');
            tracker.listCopingStrategies();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Effectiveness: 8/10'));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Effectiveness: 6/10'));
        });

        test('Mental Health: handles quick check-in with effective coping strategies', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                profile: {},
                moodEntries: [],
                journalEntries: [],
                symptoms: [],
                triggers: [],
                copingStrategies: [
                    { id: 1, name: 'Deep breathing', description: 'Breathe', timesUsed: 5, effectiveness: 9 },
                    { id: 2, name: 'Walking', description: 'Walk', timesUsed: 3, effectiveness: 6 }
                ],
                emergencyContacts: [],
                goals: []
            }));

            const tracker = new MentalHealthTracker('test.json');
            tracker.quickCheckIn();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deep breathing'));
        });

        test('Mental Health: handles no recent mood data in visualization', () => {
            fs.existsSync.mockReturnValue(true);
            const veryOld = new Date('2020-01-01');
            fs.readFileSync.mockReturnValue(JSON.stringify({
                profile: {},
                moodEntries: [
                    { rating: 7, note: 'Old mood', timestamp: veryOld.toISOString() }
                ],
                journalEntries: [],
                symptoms: [],
                triggers: [],
                copingStrategies: [],
                emergencyContacts: [],
                goals: []
            }));

            const tracker = new MentalHealthTracker('test.json');
            tracker.visualizeMoodTrends(14);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/No mood data in the last \d+ days/));
        });

        test('Mental Health: handles no recent symptoms in visualization', () => {
            fs.existsSync.mockReturnValue(true);
            const veryOld = new Date('2020-01-01');
            fs.readFileSync.mockReturnValue(JSON.stringify({
                profile: {},
                moodEntries: [],
                journalEntries: [],
                symptoms: [
                    { id: 1, name: 'Headache', severity: 5, timestamp: veryOld.toISOString() }
                ],
                triggers: [],
                copingStrategies: [],
                emergencyContacts: [],
                goals: []
            }));

            const tracker = new MentalHealthTracker('test.json');
            tracker.visualizeSymptomPatterns(14);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/No symptoms logged in the last \d+ days/));
        });

        test('Mental Health: handles recovery progress with no profile set', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                profile: {},
                moodEntries: [],
                journalEntries: [],
                symptoms: [],
                triggers: [],
                copingStrategies: [],
                emergencyContacts: [],
                goals: []
            }));

            const tracker = new MentalHealthTracker('test.json');
            tracker.visualizeRecoveryProgress();

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Set up your profile first'));
        });

        test('Mental Health: handles mood streak with non-consecutive dates', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                profile: {},
                moodEntries: [
                    { rating: 7, timestamp: '2025-01-01T12:00:00Z' },
                    { rating: 8, timestamp: '2025-01-02T12:00:00Z' },
                    { rating: 6, timestamp: '2025-01-05T12:00:00Z' },
                    { rating: 7, timestamp: '2025-01-06T12:00:00Z' }
                ],
                journalEntries: [],
                symptoms: [],
                triggers: [],
                copingStrategies: [],
                emergencyContacts: [],
                goals: []
            }));

            const tracker = new MentalHealthTracker('test.json');
            const streak = tracker.getLongestMoodStreak();

            expect(streak).toBe(2);
        });

        test('Medication: handles very old history entries', () => {
            fs.existsSync.mockReturnValue(true);
            const veryOld = new Date('2020-01-01');

            fs.readFileSync.mockReturnValue(JSON.stringify({
                medications: [],
                history: [
                    { medicationId: 1, medicationName: 'Old Med', timestamp: veryOld.toISOString(), missed: false }
                ]
            }));

            const tracker = new MedicationTracker('test.json');

            expect(tracker.data.history.length).toBe(1);
        });

        test('AWS: handles all topics completed', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                completedLessons: [],
                quizScores: []
            }));

            const tracker = new AWSForKids('test.json');
            tracker.data.completedLessons = Object.keys(tracker.concepts);

            const mockDoc = {
                fontSize: jest.fn().mockReturnThis(),
                fillColor: jest.fn().mockReturnThis(),
                text: jest.fn().mockReturnThis(),
                moveDown: jest.fn().mockReturnThis(),
                y: 100
            };

            tracker.addLearningPath(mockDoc);

            expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('Congratulations'), expect.any(Object));
        });

        test('AWS: handles study streak with no recent activity', () => {
            fs.existsSync.mockReturnValue(true);
            const veryOld = new Date('2020-01-01');
            fs.readFileSync.mockReturnValue(JSON.stringify({
                completedLessons: [],
                quizScores: [
                    { date: veryOld.toISOString(), score: 8, total: 10 }
                ]
            }));

            const tracker = new AWSForKids('test.json');
            const streak = tracker.calculateStudyStreak();

            expect(streak).toBe(0);
        });

        test('AWS: handles longest study streak with non-consecutive dates', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify({
                completedLessons: [],
                quizScores: [
                    { date: '2025-01-01T12:00:00Z', score: 8, total: 10 },
                    { date: '2025-01-02T12:00:00Z', score: 9, total: 10 },
                    { date: '2025-01-05T12:00:00Z', score: 7, total: 10 },
                    { date: '2025-01-06T12:00:00Z', score: 8, total: 10 }
                ]
            }));

            const tracker = new AWSForKids('test.json');
            const streak = tracker.getLongestStudyStreak();

            expect(streak).toBe(2);
        });
    });
});
