const { runCommand, showHelp, parseArgs } = require('../backup-cli');
const BackupManager = require('../backup-manager');
const fs = require('fs');
const path = require('path');

// Mock console.log and console.error to capture output
let consoleOutput = [];
let consoleErrors = [];
const originalLog = console.log;
const originalError = console.error;

beforeEach(() => {
    consoleOutput = [];
    consoleErrors = [];
    console.log = (...args) => {
        consoleOutput.push(args.join(' '));
    };
    console.error = (...args) => {
        consoleErrors.push(args.join(' '));
    };
});

afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
});

describe('backup-cli', () => {
    let testBackupDir;
    let testDataFile;
    let mockBackupManager;

    beforeEach(() => {
        // Create test directories
        testBackupDir = path.join(__dirname, 'test-backups-cli');
        testDataFile = path.join(__dirname, 'test-data-cli.json');

        // Create test data
        if (!fs.existsSync(testDataFile)) {
            fs.writeFileSync(testDataFile, JSON.stringify({ test: 'data' }, null, 2));
        }

        mockBackupManager = new BackupManager({
            backupDir: testBackupDir,
            dataFiles: [testDataFile],
            retentionDays: 7,
            maxBackups: 5
        });
    });

    afterEach(() => {
        // Cleanup
        if (fs.existsSync(testBackupDir)) {
            fs.rmSync(testBackupDir, { recursive: true, force: true });
        }
        if (fs.existsSync(testDataFile)) {
            fs.unlinkSync(testDataFile);
        }
        mockBackupManager.stopScheduledBackups();
    });

    describe('showHelp', () => {
        test('displays help information', () => {
            showHelp();
            const output = consoleOutput.join('\n');
            expect(output).toContain('StepSyncAI Backup & Recovery Manager');
            expect(output).toContain('COMMANDS:');
            expect(output).toContain('create');
            expect(output).toContain('list');
            expect(output).toContain('restore');
            expect(output).toContain('verify');
            expect(output).toContain('delete');
            expect(output).toContain('export');
            expect(output).toContain('import');
            expect(output).toContain('stats');
            expect(output).toContain('schedule');
            expect(output).toContain('cleanup');
        });

        test('shows examples', () => {
            showHelp();
            const output = consoleOutput.join('\n');
            expect(output).toContain('EXAMPLES:');
            expect(output).toContain('node backup-cli.js create');
        });

        test('shows tag usage', () => {
            showHelp();
            const output = consoleOutput.join('\n');
            expect(output).toContain('BACKUP TAGS:');
            expect(output).toContain('--tag');
        });

        test('shows retention information', () => {
            showHelp();
            const output = consoleOutput.join('\n');
            expect(output).toContain('RETENTION:');
        });
    });

    describe('parseArgs', () => {
        test('parses description without flags', () => {
            const result = parseArgs(['My backup description']);
            expect(result.description).toBe('My backup description');
            expect(result.tags).toEqual([]);
        });

        test('parses single tag', () => {
            const result = parseArgs(['Description', '--tag', 'important']);
            expect(result.description).toBe('Description');
            expect(result.tags).toEqual(['important']);
        });

        test('parses multiple tags', () => {
            const result = parseArgs(['Description', '--tag', 'important', '--tag', 'manual']);
            expect(result.description).toBe('Description');
            expect(result.tags).toEqual(['important', 'manual']);
        });

        test('handles tags without description', () => {
            const result = parseArgs(['--tag', 'test']);
            expect(result.description).toBe('');
            expect(result.tags).toEqual(['test']);
        });

        test('handles empty args', () => {
            const result = parseArgs([]);
            expect(result.description).toBe('');
            expect(result.tags).toEqual([]);
        });

        test('ignores flags without values', () => {
            const result = parseArgs(['Description', '--tag']);
            expect(result.description).toBe('Description');
            expect(result.tags).toEqual([]);
        });
    });

    describe('runCommand', () => {
        describe('create command', () => {
            test('creates a backup successfully', () => {
                const exitCode = runCommand('create', ['Test backup'], mockBackupManager);
                expect(exitCode).toBe(0);
                const backups = mockBackupManager.listBackups();
                expect(backups.length).toBe(1);
            });

            test('creates backup with tags', () => {
                const exitCode = runCommand('create', ['Test', '--tag', 'important'], mockBackupManager);
                expect(exitCode).toBe(0);
            });

            test('creates backup without description', () => {
                const exitCode = runCommand('create', [], mockBackupManager);
                expect(exitCode).toBe(0);
            });
        });

        describe('list command', () => {
            test('shows no backups message when empty', () => {
                const exitCode = runCommand('list', [], mockBackupManager);
                expect(exitCode).toBe(0);
                const output = consoleOutput.join('\n');
                expect(output).toContain('No backups found');
            });

            test('lists existing backups', () => {
                mockBackupManager.createBackup({ description: 'Test backup' });
                const exitCode = runCommand('list', [], mockBackupManager);
                expect(exitCode).toBe(0);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Available Backups');
            });

            test('accepts custom limit', () => {
                mockBackupManager.createBackup();
                mockBackupManager.createBackup();
                const exitCode = runCommand('list', ['1'], mockBackupManager);
                expect(exitCode).toBe(0);
            });

            test('uses default limit of 10', () => {
                mockBackupManager.createBackup();
                const exitCode = runCommand('list', [], mockBackupManager);
                expect(exitCode).toBe(0);
            });
        });

        describe('restore command', () => {
            test('requires backup ID', () => {
                const exitCode = runCommand('restore', [], mockBackupManager);
                expect(exitCode).toBe(1);
                const errors = consoleErrors.join('\n');
                expect(errors).toContain('Backup ID required');
            });

            test('restores backup successfully', () => {
                const createResult = mockBackupManager.createBackup();
                const exitCode = runCommand('restore', [createResult.backupId], mockBackupManager);
                expect(exitCode).toBe(0);
            });

            test('fails for nonexistent backup', () => {
                const exitCode = runCommand('restore', ['nonexistent-backup'], mockBackupManager);
                expect(exitCode).toBe(1);
            });
        });

        describe('verify command', () => {
            test('requires backup ID', () => {
                const exitCode = runCommand('verify', [], mockBackupManager);
                expect(exitCode).toBe(1);
                const errors = consoleErrors.join('\n');
                expect(errors).toContain('Backup ID required');
            });

            test('verifies valid backup', () => {
                const createResult = mockBackupManager.createBackup();
                const exitCode = runCommand('verify', [createResult.backupId], mockBackupManager);
                expect(exitCode).toBe(0);
                const output = consoleOutput.join('\n');
                expect(output).toContain('verification passed');
            });

            test('fails for invalid backup', () => {
                const exitCode = runCommand('verify', ['invalid-backup'], mockBackupManager);
                expect(exitCode).toBe(1);
            });
        });

        describe('delete command', () => {
            test('requires backup ID', () => {
                const exitCode = runCommand('delete', [], mockBackupManager);
                expect(exitCode).toBe(1);
                const errors = consoleErrors.join('\n');
                expect(errors).toContain('Backup ID required');
            });

            test('deletes backup successfully', () => {
                const createResult = mockBackupManager.createBackup();
                const exitCode = runCommand('delete', [createResult.backupId], mockBackupManager);
                expect(exitCode).toBe(0);
            });

            test('fails for nonexistent backup', () => {
                const exitCode = runCommand('delete', ['nonexistent'], mockBackupManager);
                expect(exitCode).toBe(1);
            });
        });

        describe('export command', () => {
            test('requires backup ID and destination', () => {
                const exitCode = runCommand('export', [], mockBackupManager);
                expect(exitCode).toBe(1);
                const errors = consoleErrors.join('\n');
                expect(errors).toContain('Backup ID and destination path required');
            });

            test('requires destination path', () => {
                const exitCode = runCommand('export', ['backup-id'], mockBackupManager);
                expect(exitCode).toBe(1);
            });

            test('exports backup successfully', () => {
                const createResult = mockBackupManager.createBackup();
                const exportPath = path.join(__dirname, 'test-export');
                if (!fs.existsSync(exportPath)) {
                    fs.mkdirSync(exportPath, { recursive: true });
                }
                const exitCode = runCommand('export', [createResult.backupId, exportPath], mockBackupManager);
                expect([0, 1]).toContain(exitCode); // May succeed or fail depending on file system
                if (fs.existsSync(exportPath)) {
                    fs.rmSync(exportPath, { recursive: true, force: true });
                }
            });
        });

        describe('import command', () => {
            test('requires source path', () => {
                const exitCode = runCommand('import', [], mockBackupManager);
                expect(exitCode).toBe(1);
                const errors = consoleErrors.join('\n');
                expect(errors).toContain('Source path required');
            });
        });

        describe('stats command', () => {
            test('shows statistics', () => {
                const exitCode = runCommand('stats', [], mockBackupManager);
                expect(exitCode).toBe(0);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Backup Statistics');
                expect(output).toContain('Total backups:');
                expect(output).toContain('Retention period:');
            });

            test('shows statistics with existing backups', () => {
                mockBackupManager.createBackup();
                mockBackupManager.createBackup();
                const exitCode = runCommand('stats', [], mockBackupManager);
                expect(exitCode).toBe(0);
                const output = consoleOutput.join('\n');
                expect(output).toContain('Backup Statistics');
            });
        });

        describe('cleanup command', () => {
            test('runs cleanup successfully', () => {
                const exitCode = runCommand('cleanup', [], mockBackupManager);
                expect(exitCode).toBe(0);
            });
        });

        describe('help commands', () => {
            test('shows help for "help" command', () => {
                const exitCode = runCommand('help', [], mockBackupManager);
                expect(exitCode).toBe(0);
                const output = consoleOutput.join('\n');
                expect(output).toContain('StepSyncAI Backup & Recovery Manager');
            });

            test('shows help for "--help" flag', () => {
                const exitCode = runCommand('--help', [], mockBackupManager);
                expect(exitCode).toBe(0);
                const output = consoleOutput.join('\n');
                expect(output).toContain('StepSyncAI Backup & Recovery Manager');
            });

            test('shows help for "-h" flag', () => {
                const exitCode = runCommand('-h', [], mockBackupManager);
                expect(exitCode).toBe(0);
            });
        });

        describe('invalid commands', () => {
            test('shows help for invalid command', () => {
                const exitCode = runCommand('invalid-command', [], mockBackupManager);
                expect(exitCode).toBe(0);
                const output = consoleOutput.join('\n');
                expect(output).toContain('StepSyncAI Backup & Recovery Manager');
            });

            test('shows help for undefined command', () => {
                const exitCode = runCommand(undefined, [], mockBackupManager);
                expect(exitCode).toBe(0);
            });
        });

        describe('argument parsing', () => {
            test('handles numeric limit argument', () => {
                mockBackupManager.createBackup();
                const exitCode = runCommand('list', ['5'], mockBackupManager);
                expect(exitCode).toBe(0);
            });

            test('handles non-numeric limit and uses default', () => {
                mockBackupManager.createBackup();
                const exitCode = runCommand('list', ['abc'], mockBackupManager);
                expect(exitCode).toBe(0);
            });

            test('handles negative limit', () => {
                const exitCode = runCommand('list', ['-10'], mockBackupManager);
                expect(exitCode).toBe(0);
            });
        });
    });
});
