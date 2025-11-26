#!/usr/bin/env node

const BackupManager = require('./backup-manager');

function showHelp() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           StepSyncAI Backup & Recovery Manager                ║
╚═══════════════════════════════════════════════════════════════╝

COMMANDS:
  create [description]     Create a new backup
  list [limit]             List available backups (default: 10)
  restore <backup-id>      Restore from a backup
  verify <backup-id>       Verify backup integrity
  delete <backup-id>       Delete a specific backup
  export <backup-id> <path> Export backup to external location
  import <path>            Import backup from external location
  stats                    Show backup statistics
  schedule <cron>          Schedule automated backups
  cleanup                  Remove old backups per retention policy

EXAMPLES:
  node backup-cli.js create "Before major update"
  node backup-cli.js list 20
  node backup-cli.js restore backup-2025-11-19T10-30-00-000Z
  node backup-cli.js verify backup-2025-11-19T10-30-00-000Z
  node backup-cli.js schedule "0 2 * * *"  # Daily at 2 AM
  node backup-cli.js export backup-2025-11-19T10-30-00-000Z ./external-drive
  node backup-cli.js stats

BACKUP TAGS:
  Add tags with --tag flag:
  node backup-cli.js create "Important" --tag important --tag manual

RETENTION:
  Default: 30 days, max 50 backups
  Backups tagged 'important' or 'manual' are protected from auto-cleanup
`);
}

function parseArgs(args) {
    const options = {
        description: '',
        tags: []
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--tag' && args[i + 1]) {
            options.tags.push(args[i + 1]);
            i++;
        } else if (!args[i].startsWith('--')) {
            options.description = args[i];
        }
    }

    return options;
}

function runCommand(command, args, backupManager) {
    const backup = backupManager || new BackupManager();

    switch (command) {
        case 'create': {
            const options = parseArgs(args);
            const result = backup.createBackup(options);
            return result.success ? 0 : 1;
        }

        case 'list': {
            const limit = parseInt(args[0]) || 10;
            const backups = backup.listBackups({ limit });

            if (backups.length === 0) {
                console.log('\n📭 No backups found.');
                return 0;
            }

            console.log('\n📦 Available Backups:\n');
            console.log('═'.repeat(80));

            backups.forEach((b, index) => {
                const date = new Date(b.timestamp).toLocaleString();
                const size = backup.formatBytes(b.totalSize);
                const tags = b.tags && b.tags.length > 0 ? ` [${b.tags.join(', ')}]` : '';

                console.log(`${index + 1}. ${b.id}`);
                console.log(`   Created: ${date}${tags}`);
                console.log(`   Files: ${b.filesCount} | Size: ${size}`);
                if (b.description) {
                    console.log(`   Description: ${b.description}`);
                }
                console.log('');
            });

            console.log('═'.repeat(80));
            return 0;
        }

        case 'restore': {
            if (!args[0]) {
                console.error('❌ Error: Backup ID required');
                console.log('Usage: node backup-cli.js restore <backup-id>');
                return 1;
            }

            const result = backup.restore(args[0]);
            return result.success ? 0 : 1;
        }

        case 'verify': {
            if (!args[0]) {
                console.error('❌ Error: Backup ID required');
                console.log('Usage: node backup-cli.js verify <backup-id>');
                return 1;
            }

            const result = backup.verifyBackup(args[0]);

            if (result.valid) {
                console.log('\n✅ Backup verification passed!');
                console.log(`   Backup ID: ${result.backupId}`);
                console.log(`   Files checked: ${result.filesChecked}`);
            } else {
                console.log('\n❌ Backup verification failed!');
                console.log('   Errors:');
                result.errors.forEach(err => console.log(`   - ${err}`));
            }

            return result.valid ? 0 : 1;
        }

        case 'delete': {
            if (!args[0]) {
                console.error('❌ Error: Backup ID required');
                console.log('Usage: node backup-cli.js delete <backup-id>');
                return 1;
            }

            const result = backup.deleteBackup(args[0]);
            return result.success ? 0 : 1;
        }

        case 'export': {
            if (!args[0] || !args[1]) {
                console.error('❌ Error: Backup ID and destination path required');
                console.log('Usage: node backup-cli.js export <backup-id> <destination-path>');
                return 1;
            }

            const result = backup.exportBackup(args[0], args[1]);
            return result.success ? 0 : 1;
        }

        case 'import': {
            if (!args[0]) {
                console.error('❌ Error: Source path required');
                console.log('Usage: node backup-cli.js import <source-path>');
                return 1;
            }

            const result = backup.importBackup(args[0]);
            return result.success ? 0 : 1;
        }

        case 'stats': {
            const stats = backup.getStats();

            console.log('\n📊 Backup Statistics\n');
            console.log('═'.repeat(60));
            console.log(`Total backups:     ${stats.totalBackups}`);
            console.log(`Total size:        ${stats.totalSize}`);
            console.log(`Retention period:  ${stats.retentionDays} days`);
            console.log(`Max backups:       ${stats.maxBackups}`);
            if (stats.oldestBackup) {
                console.log(`Oldest backup:     ${new Date(stats.oldestBackup).toLocaleString()}`);
            }
            if (stats.newestBackup) {
                console.log(`Newest backup:     ${new Date(stats.newestBackup).toLocaleString()}`);
            }
            console.log('═'.repeat(60));
            return 0;
        }

        case 'schedule': {
            if (!args[0]) {
                console.error('❌ Error: Cron schedule required');
                console.log('Usage: node backup-cli.js schedule <cron-expression>');
                console.log('Example: node backup-cli.js schedule "0 2 * * *"  # Daily at 2 AM');
                return 1;
            }

            backup.scheduleBackups(args[0]);
            console.log('⏰ Backup scheduler is running. Press Ctrl+C to stop.');

            // Keep process alive
            process.on('SIGINT', () => {
                backup.stopScheduledBackups();
                console.log('\n👋 Scheduler stopped.');
                process.exit(0);
            });
            return 0;
        }

        case 'cleanup': {
            backup.cleanupOldBackups();
            return 0;
        }

        case 'help':
        case '--help':
        case '-h':
        default:
            showHelp();
            return 0;
    }
}

async function main() {
    const command = process.argv[2];
    const args = process.argv.slice(3);
    const exitCode = runCommand(command, args);
    process.exit(exitCode);
}

// Export for testing
module.exports = { runCommand, showHelp, parseArgs };

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
    });
}
