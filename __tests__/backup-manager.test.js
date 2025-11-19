const fs = require('fs');
const path = require('path');
const BackupManager = require('../backup-manager');

describe('BackupManager', () => {
    let backup;
    let testBackupDir;
    let testDataFile;

    beforeEach(() => {
        // Create test directories
        testBackupDir = path.join(__dirname, 'test-backups');
        testDataFile = path.join(__dirname, 'test-data.json');

        // Create test data
        fs.writeFileSync(testDataFile, JSON.stringify({ test: 'data' }, null, 2));

        backup = new BackupManager({
            backupDir: testBackupDir,
            dataFiles: ['__tests__/test-data.json'],
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
        backup.stopScheduledBackups();
    });

    describe('Backup Creation', () => {
        test('should create a backup successfully', () => {
            const result = backup.createBackup({
                description: 'Test backup',
                tags: ['test']
            });

            expect(result.success).toBe(true);
            expect(result.backupId).toMatch(/^backup-\d{4}-\d{2}-\d{2}/);
            expect(fs.existsSync(result.path)).toBe(true);
        });

        test('should create backup with manifest', () => {
            const result = backup.createBackup({ description: 'Test' });
            const manifestPath = path.join(result.path, 'manifest.json');

            expect(fs.existsSync(manifestPath)).toBe(true);

            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            expect(manifest.id).toBe(result.backupId);
            expect(manifest.description).toBe('Test');
            expect(manifest.timestamp).toBeDefined();
        });

        test('should backup file with checksum', () => {
            const result = backup.createBackup();
            const manifestPath = path.join(result.path, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

            const fileData = manifest.files['__tests__/test-data.json'];
            expect(fileData.backedUp).toBe(true);
            expect(fileData.checksum).toBeDefined();
            expect(fileData.size).toBeGreaterThan(0);
        });

        test('should handle missing data files gracefully', () => {
            const backupMissingFiles = new BackupManager({
                backupDir: testBackupDir,
                dataFiles: ['nonexistent.json'],
                retentionDays: 7,
                maxBackups: 5
            });

            const result = backupMissingFiles.createBackup();

            expect(result.success).toBe(true);
            const manifest = JSON.parse(fs.readFileSync(path.join(result.path, 'manifest.json'), 'utf8'));
            expect(manifest.files['nonexistent.json'].backedUp).toBe(false);
        });
    });

    describe('Backup Listing', () => {
        test('should list backups', () => {
            backup.createBackup({ description: 'Backup 1' });
            backup.createBackup({ description: 'Backup 2' });

            const backups = backup.listBackups();

            expect(backups).toHaveLength(2);
            expect(backups[0].description).toBe('Backup 2'); // Newest first
            expect(backups[1].description).toBe('Backup 1');
        });

        test('should limit number of listed backups', () => {
            backup.createBackup();
            backup.createBackup();
            backup.createBackup();

            const backups = backup.listBackups({ limit: 2 });

            expect(backups).toHaveLength(2);
        });

        test('should filter backups by tags', () => {
            backup.createBackup({ tags: ['important'] });
            backup.createBackup({ tags: ['auto'] });
            backup.createBackup({ tags: ['important', 'manual'] });

            const backups = backup.listBackups({ tags: ['important'] });

            expect(backups).toHaveLength(2);
        });

        test('should return empty array when no backups exist', () => {
            const backups = backup.listBackups();

            expect(backups).toEqual([]);
        });
    });

    describe('Backup Verification', () => {
        test('should verify valid backup', () => {
            const result = backup.createBackup();
            const verification = backup.verifyBackup(result.backupId);

            expect(verification.valid).toBe(true);
            expect(verification.errors).toEqual([]);
            expect(verification.filesChecked).toBe(1);
        });

        test('should detect missing manifest', () => {
            const verification = backup.verifyBackup('nonexistent-backup');

            expect(verification.valid).toBe(false);
            expect(verification.errors).toContain('Manifest file not found');
        });

        test('should detect corrupted file', () => {
            const result = backup.createBackup();

            // Corrupt the backup file
            const backupFilePath = path.join(result.path, '__tests__/test-data.json');
            fs.writeFileSync(backupFilePath, '{ corrupted }');

            const verification = backup.verifyBackup(result.backupId);

            expect(verification.valid).toBe(false);
            expect(verification.errors.length).toBeGreaterThan(0);
        });

        test('should detect missing file', () => {
            const result = backup.createBackup();

            // Delete the backup file
            const backupFilePath = path.join(result.path, '__tests__/test-data.json');
            fs.unlinkSync(backupFilePath);

            const verification = backup.verifyBackup(result.backupId);

            expect(verification.valid).toBe(false);
            expect(verification.errors).toContain('Missing file: __tests__/test-data.json');
        });
    });

    describe('Backup Restoration', () => {
        test('should restore backup successfully', () => {
            const createResult = backup.createBackup();

            // Modify the original file
            fs.writeFileSync(testDataFile, JSON.stringify({ modified: 'data' }));

            // Restore
            const restoreResult = backup.restore(createResult.backupId, {
                createBackupFirst: false,
                verify: false
            });

            expect(restoreResult.success).toBe(true);
            expect(restoreResult.filesRestored).toContain('__tests__/test-data.json');

            // Verify file was restored
            const restoredData = JSON.parse(fs.readFileSync(testDataFile, 'utf8'));
            expect(restoredData.test).toBe('data');
        });

        test('should create safety backup before restore', () => {
            const createResult = backup.createBackup();
            const initialCount = backup.listBackups().length;

            backup.restore(createResult.backupId, { verify: false });

            const finalCount = backup.listBackups().length;
            expect(finalCount).toBe(initialCount + 1);
        });

        test('should fail restore for nonexistent backup', () => {
            const result = backup.restore('nonexistent-backup', {
                createBackupFirst: false
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Backup not found');
        });

        test('should fail restore if verification fails', () => {
            const createResult = backup.createBackup();

            // Corrupt the backup
            const backupFilePath = path.join(createResult.path, '__tests__/test-data.json');
            fs.writeFileSync(backupFilePath, 'corrupted');

            const restoreResult = backup.restore(createResult.backupId, {
                createBackupFirst: false,
                verify: true
            });

            expect(restoreResult.success).toBe(false);
            expect(restoreResult.error).toContain('verification failed');
        });
    });

    describe('Backup Deletion', () => {
        test('should delete backup successfully', () => {
            const createResult = backup.createBackup();

            expect(fs.existsSync(createResult.path)).toBe(true);

            const deleteResult = backup.deleteBackup(createResult.backupId);

            expect(deleteResult.success).toBe(true);
            expect(fs.existsSync(createResult.path)).toBe(false);
        });

        test('should fail to delete nonexistent backup', () => {
            const result = backup.deleteBackup('nonexistent-backup');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Backup not found');
        });
    });

    describe('Backup Cleanup', () => {
        test('should cleanup old backups', () => {
            // Create backups with old timestamps
            for (let i = 0; i < 3; i++) {
                backup.createBackup();
            }

            // Manually set retention to 0 days
            backup.retentionDays = 0;

            const beforeCount = backup.listBackups().length;
            backup.cleanupOldBackups();
            const afterCount = backup.listBackups().length;

            expect(afterCount).toBeLessThan(beforeCount);
        });

        test('should preserve protected backups', () => {
            backup.createBackup({ tags: ['important'] });
            backup.createBackup({ tags: ['manual'] });
            backup.createBackup({ tags: ['auto'] });

            backup.retentionDays = 0;
            backup.cleanupOldBackups();

            const backups = backup.listBackups();
            expect(backups.length).toBe(2); // important and manual preserved
        });

        test('should enforce max backups limit', () => {
            for (let i = 0; i < 10; i++) {
                backup.createBackup();
            }

            backup.cleanupOldBackups();

            const backups = backup.listBackups();
            expect(backups.length).toBeLessThanOrEqual(backup.maxBackups);
        });
    });

    describe('Export and Import', () => {
        test('should export backup successfully', () => {
            const createResult = backup.createBackup();
            const exportPath = path.join(__dirname, 'export-test');

            const exportResult = backup.exportBackup(createResult.backupId, exportPath);

            expect(exportResult.success).toBe(true);
            expect(fs.existsSync(exportResult.path)).toBe(true);

            // Cleanup
            fs.rmSync(exportPath, { recursive: true, force: true });
        });

        test('should import backup successfully', () => {
            const createResult = backup.createBackup();
            const exportPath = path.join(__dirname, 'export-test');

            backup.exportBackup(createResult.backupId, exportPath);

            // Delete original backup
            backup.deleteBackup(createResult.backupId);

            // Import
            const importResult = backup.importBackup(path.join(exportPath, createResult.backupId));

            expect(importResult.success).toBe(true);
            expect(importResult.backupId).toBe(createResult.backupId);

            // Verify backup exists
            const backups = backup.listBackups();
            expect(backups.some(b => b.id === createResult.backupId)).toBe(true);

            // Cleanup
            fs.rmSync(exportPath, { recursive: true, force: true });
        });

        test('should fail import without manifest', () => {
            const invalidPath = path.join(__dirname, 'invalid-backup');
            fs.mkdirSync(invalidPath, { recursive: true });

            const result = backup.importBackup(invalidPath);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid backup');

            // Cleanup
            fs.rmSync(invalidPath, { recursive: true, force: true });
        });
    });

    describe('Statistics', () => {
        test('should return backup statistics', () => {
            backup.createBackup();
            backup.createBackup();

            const stats = backup.getStats();

            expect(stats.totalBackups).toBe(2);
            expect(stats.retentionDays).toBe(7);
            expect(stats.maxBackups).toBe(5);
            expect(stats.newestBackup).toBeDefined();
            expect(stats.oldestBackup).toBeDefined();
        });

        test('should calculate total size', () => {
            backup.createBackup();

            const stats = backup.getStats();

            expect(stats.totalSize).toMatch(/\d+(\.\d+)?\s(Bytes|KB|MB|GB)/);
        });
    });

    describe('Scheduling', () => {
        test('should schedule backups', () => {
            const task = backup.scheduleBackups('* * * * *'); // Every minute for testing

            expect(task).toBeDefined();
            expect(backup.scheduledTask).toBeDefined();
        });

        test('should stop scheduled backups', () => {
            backup.scheduleBackups('* * * * *');
            expect(backup.scheduledTask).toBeDefined();

            backup.stopScheduledBackups();
            expect(backup.scheduledTask).toBeNull();
        });

        test('should replace existing schedule', () => {
            const task1 = backup.scheduleBackups('* * * * *');
            const task2 = backup.scheduleBackups('0 * * * *');

            expect(task2).toBeDefined();
            expect(task1).not.toBe(task2);
        });
    });

    describe('Utility Functions', () => {
        test('should calculate checksum correctly', () => {
            const content = 'test content';
            const checksum1 = backup.calculateChecksum(content);
            const checksum2 = backup.calculateChecksum(content);

            expect(checksum1).toBe(checksum2);
            expect(checksum1).toHaveLength(64); // SHA256 hex length
        });

        test('should format bytes correctly', () => {
            expect(backup.formatBytes(0)).toBe('0 Bytes');
            expect(backup.formatBytes(1024)).toBe('1 KB');
            expect(backup.formatBytes(1048576)).toBe('1 MB');
            expect(backup.formatBytes(1073741824)).toBe('1 GB');
        });
    });
});
