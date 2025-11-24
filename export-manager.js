const fs = require('fs');
const path = require('path');

/**
 * ExportManager - Export wellness data to various formats
 *
 * Features:
 * - Export to CSV format
 * - Export to JSON format
 * - Custom date range exports
 * - Filtered exports by metric type
 * - Batch export all data
 */
class ExportManager {
    constructor(dashboard, exportsDir = './data/exports') {
        this.dashboard = dashboard;
        this.exportsDir = exportsDir;

        // Ensure exports directory exists
        if (!fs.existsSync(this.exportsDir)) {
            fs.mkdirSync(this.exportsDir, { recursive: true });
        }
    }

    /**
     * Export data to CSV format
     *
     * @param {Object} options - Export options
     * @returns {string} Path to exported CSV file
     */
    exportToCSV(options = {}) {
        const {
            days = 30,
            filename = null,
            includeNotes = true
        } = options;

        const entries = this.dashboard.getAllEntries().slice(-days);

        if (entries.length === 0) {
            throw new Error('No data to export');
        }

        // Generate CSV content
        let csv = this.generateCSVHeader(includeNotes);

        entries.forEach(entry => {
            csv += this.entryToCSVRow(entry, includeNotes);
        });

        // Save to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const csvFilename = filename || `wellness-data-${timestamp}.csv`;
        const filepath = path.join(this.exportsDir, csvFilename);

        fs.writeFileSync(filepath, csv, 'utf-8');

        console.log('\n✅ Data exported to CSV successfully!');
        console.log(`   Location: ${filepath}`);
        console.log(`   Entries: ${entries.length}`);
        console.log(`   File size: ${this.getFileSize(filepath)}`);

        return filepath;
    }

    /**
     * Generate CSV header
     */
    generateCSVHeader(includeNotes) {
        const headers = [
            'Date',
            'Mood',
            'Sleep Hours',
            'Sleep Quality',
            'Exercise Minutes',
            'Exercise Type',
            'Stress Level',
            'Energy Level',
            'Anxiety Level'
        ];

        if (includeNotes) {
            headers.push('Notes');
        }

        return headers.join(',') + '\n';
    }

    /**
     * Convert entry to CSV row
     */
    entryToCSVRow(entry, includeNotes) {
        const row = [
            entry.date || '',
            entry.mood || '',
            entry.sleep_hours || '',
            entry.sleep_quality || '',
            entry.exercise_minutes || '',
            entry.exercise_type || '',
            entry.stress_level || '',
            entry.energy_level || '',
            entry.anxiety_level || ''
        ];

        if (includeNotes) {
            // Escape and quote notes to handle commas and newlines
            const notes = entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : '';
            row.push(notes);
        }

        return row.join(',') + '\n';
    }

    /**
     * Export data to JSON format
     *
     * @param {Object} options - Export options
     * @returns {string} Path to exported JSON file
     */
    exportToJSON(options = {}) {
        const {
            days = 30,
            filename = null,
            pretty = true
        } = options;

        const entries = this.dashboard.getAllEntries().slice(-days);

        if (entries.length === 0) {
            throw new Error('No data to export');
        }

        // Create export object with metadata
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalEntries: entries.length,
                dateRange: {
                    start: entries[0].date,
                    end: entries[entries.length - 1].date
                },
                version: '1.0.0'
            },
            entries: entries
        };

        // Save to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonFilename = filename || `wellness-data-${timestamp}.json`;
        const filepath = path.join(this.exportsDir, jsonFilename);

        const jsonContent = pretty
            ? JSON.stringify(exportData, null, 2)
            : JSON.stringify(exportData);

        fs.writeFileSync(filepath, jsonContent, 'utf-8');

        console.log('\n✅ Data exported to JSON successfully!');
        console.log(`   Location: ${filepath}`);
        console.log(`   Entries: ${entries.length}`);
        console.log(`   File size: ${this.getFileSize(filepath)}`);

        return filepath;
    }

    /**
     * Export medication data to CSV
     */
    exportMedicationsToCSV(options = {}) {
        const { filename = null } = options;

        const medications = this.dashboard.getAllMedications();

        if (medications.length === 0) {
            throw new Error('No medication data to export');
        }

        // Generate CSV content
        let csv = 'Name,Dosage,Frequency,Start Date,End Date,Active,Notes\n';

        medications.forEach(med => {
            const row = [
                med.name || '',
                med.dosage || '',
                med.frequency || '',
                med.start_date || '',
                med.end_date || '',
                med.active ? 'Yes' : 'No',
                med.notes ? `"${med.notes.replace(/"/g, '""')}"` : ''
            ];
            csv += row.join(',') + '\n';
        });

        // Save to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const csvFilename = filename || `medications-${timestamp}.csv`;
        const filepath = path.join(this.exportsDir, csvFilename);

        fs.writeFileSync(filepath, csv, 'utf-8');

        console.log('\n✅ Medication data exported to CSV successfully!');
        console.log(`   Location: ${filepath}`);
        console.log(`   Medications: ${medications.length}`);

        return filepath;
    }

    /**
     * Export analytics summary
     */
    exportAnalyticsSummary(analytics, options = {}) {
        const { days = 30, filename = null } = options;

        if (!analytics) {
            throw new Error('Analytics engine not provided');
        }

        const report = analytics.generateComprehensiveReport(days);

        const summary = {
            metadata: {
                exportDate: new Date().toISOString(),
                period: `${days} days`,
                version: '1.0.0'
            },
            correlations: report.correlations,
            trends: report.trends,
            insights: report.insights,
            summary: report.summary
        };

        // Save to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonFilename = filename || `analytics-summary-${timestamp}.json`;
        const filepath = path.join(this.exportsDir, jsonFilename);

        fs.writeFileSync(filepath, JSON.stringify(summary, null, 2), 'utf-8');

        console.log('\n✅ Analytics summary exported successfully!');
        console.log(`   Location: ${filepath}`);
        console.log(`   Insights: ${report.insights.length}`);

        return filepath;
    }

    /**
     * Export complete backup (all data)
     */
    exportCompleteBackup(options = {}) {
        const { filename = null } = options;

        const backup = {
            metadata: {
                exportDate: new Date().toISOString(),
                type: 'complete_backup',
                version: '1.0.0'
            },
            entries: this.dashboard.getAllEntries(),
            medications: this.dashboard.getAllMedications(),
            settings: {
                dataFile: this.dashboard.dataFile
            }
        };

        // Save to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonFilename = filename || `complete-backup-${timestamp}.json`;
        const filepath = path.join(this.exportsDir, jsonFilename);

        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');

        console.log('\n✅ Complete backup exported successfully!');
        console.log(`   Location: ${filepath}`);
        console.log(`   Total entries: ${backup.entries.length}`);
        console.log(`   Total medications: ${backup.medications.length}`);
        console.log(`   File size: ${this.getFileSize(filepath)}`);

        return filepath;
    }

    /**
     * Import data from JSON backup
     */
    importFromJSON(filepath) {
        if (!fs.existsSync(filepath)) {
            throw new Error(`File not found: ${filepath}`);
        }

        const content = fs.readFileSync(filepath, 'utf-8');
        const data = JSON.parse(content);

        // Validate structure
        if (!data.entries || !Array.isArray(data.entries)) {
            throw new Error('Invalid backup file format');
        }

        console.log(`\n📥 Importing data from ${filepath}...`);
        console.log(`   Entries to import: ${data.entries.length}`);

        // Import entries
        let imported = 0;
        data.entries.forEach(entry => {
            try {
                // Check if entry already exists
                const existing = this.dashboard.getEntry(entry.date);
                if (!existing) {
                    this.dashboard.addEntry(entry);
                    imported++;
                }
            } catch (_error) {
                console.warn(`   Warning: Could not import entry for ${entry.date}`);
            }
        });

        console.log('\n✅ Import completed!');
        console.log(`   Entries imported: ${imported}`);
        console.log(`   Entries skipped (duplicates): ${data.entries.length - imported}`);

        return { imported, total: data.entries.length };
    }

    /**
     * List all exported files
     */
    listExports() {
        try {
            const files = fs.readdirSync(this.exportsDir)
                .map(file => ({
                    filename: file,
                    path: path.join(this.exportsDir, file),
                    created: fs.statSync(path.join(this.exportsDir, file)).mtime,
                    size: this.getFileSize(path.join(this.exportsDir, file)),
                    type: path.extname(file).substring(1).toUpperCase()
                }))
                .sort((a, b) => b.created - a.created);

            return files;
        } catch (error) {
            console.error('Error listing exports:', error.message);
            return [];
        }
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
        } catch (_error) {
            return 'Unknown';
        }
    }

    /**
     * Delete an export file
     */
    deleteExport(filename) {
        const filepath = path.join(this.exportsDir, filename);

        if (!fs.existsSync(filepath)) {
            throw new Error(`Export file not found: ${filename}`);
        }

        fs.unlinkSync(filepath);
        console.log(`✅ Export deleted: ${filename}`);
        return true;
    }

    /**
     * Get export statistics
     */
    getExportStats() {
        const files = this.listExports();

        const stats = {
            totalFiles: files.length,
            totalSize: 0,
            byType: {},
            oldest: null,
            newest: null
        };

        files.forEach(file => {
            // Count by type
            stats.byType[file.type] = (stats.byType[file.type] || 0) + 1;

            // Calculate total size (rough estimate)
            const sizeMatch = file.size.match(/(\d+\.?\d*)/);
            if (sizeMatch) {
                const size = parseFloat(sizeMatch[1]);
                stats.totalSize += file.size.includes('MB') ? size * 1024 : size;
            }

            // Track oldest and newest
            if (!stats.oldest || file.created < stats.oldest) {
                stats.oldest = file.created;
            }
            if (!stats.newest || file.created > stats.newest) {
                stats.newest = file.created;
            }
        });

        stats.totalSize = stats.totalSize < 1024
            ? `${stats.totalSize.toFixed(2)} KB`
            : `${(stats.totalSize / 1024).toFixed(2)} MB`;

        return stats;
    }
}

module.exports = ExportManager;
