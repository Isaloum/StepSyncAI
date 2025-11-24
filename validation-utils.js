/**
 * Validation Utilities Module
 * Centralized input validation and error handling for StepSyncAI
 */

const fs = require('fs');

class ValidationUtils {
    /**
     * Validates and parses an integer with bounds checking
     * @param {string|number} value - The value to parse
     * @param {Object} options - Validation options
     * @param {number} options.min - Minimum allowed value (inclusive)
     * @param {number} options.max - Maximum allowed value (inclusive)
     * @param {number} options.default - Default value if parsing fails
     * @param {string} options.fieldName - Field name for error messages
     * @returns {number|null} Parsed integer or null if invalid
     */
    static parseInteger(value, options = {}) {
        const { min = -Infinity, max = Infinity, default: defaultValue = null, fieldName = 'value' } = options;

        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }

        const parsed = parseInt(value, 10);

        if (isNaN(parsed)) {
            console.error(`❌ Invalid ${fieldName}: "${value}" is not a valid number`);
            return defaultValue;
        }

        if (parsed < min) {
            console.error(`❌ Invalid ${fieldName}: ${parsed} is below minimum allowed value (${min})`);
            return defaultValue;
        }

        if (parsed > max) {
            console.error(`❌ Invalid ${fieldName}: ${parsed} exceeds maximum allowed value (${max})`);
            return defaultValue;
        }

        return parsed;
    }

    /**
     * Validates and parses a float with bounds checking
     * @param {string|number} value - The value to parse
     * @param {Object} options - Validation options
     * @returns {number|null} Parsed float or null if invalid
     */
    static parseFloat(value, options = {}) {
        const { min = -Infinity, max = Infinity, default: defaultValue = null, fieldName = 'value' } = options;

        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }

        const parsed = parseFloat(value);

        if (isNaN(parsed)) {
            console.error(`❌ Invalid ${fieldName}: "${value}" is not a valid number`);
            return defaultValue;
        }

        if (parsed < min) {
            console.error(`❌ Invalid ${fieldName}: ${parsed} is below minimum allowed value (${min})`);
            return defaultValue;
        }

        if (parsed > max) {
            console.error(`❌ Invalid ${fieldName}: ${parsed} exceeds maximum allowed value (${max})`);
            return defaultValue;
        }

        return parsed;
    }

    /**
     * Validates a date string and returns a Date object
     * @param {string} dateString - Date string to validate
     * @param {Object} options - Validation options
     * @param {Date} options.minDate - Minimum allowed date
     * @param {Date} options.maxDate - Maximum allowed date (default: today)
     * @param {string} options.fieldName - Field name for error messages
     * @returns {Date|null} Valid Date object or null
     */
    static parseDate(dateString, options = {}) {
        const { minDate = new Date('2020-01-01'), maxDate = new Date(), fieldName = 'date' } = options;

        if (!dateString || typeof dateString !== 'string') {
            console.error(`❌ Invalid ${fieldName}: Date string is required`);
            return null;
        }

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            console.error(`❌ Invalid ${fieldName}: "${dateString}" is not a valid date format`);
            return null;
        }

        if (date < minDate) {
            console.error(`❌ Invalid ${fieldName}: ${dateString} is before ${minDate.toISOString().split('T')[0]}`);
            return null;
        }

        if (date > maxDate) {
            console.error(`❌ Invalid ${fieldName}: ${dateString} is in the future`);
            return null;
        }

        return date;
    }

    /**
     * Validates a time string in HH:MM format
     * @param {string} timeString - Time string to validate
     * @param {string} fieldName - Field name for error messages
     * @returns {boolean} True if valid, false otherwise
     */
    static validateTime(timeString, fieldName = 'time') {
        if (!timeString || typeof timeString !== 'string') {
            console.error(`❌ Invalid ${fieldName}: Time string is required`);
            return false;
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;

        if (!timeRegex.test(timeString)) {
            console.error(`❌ Invalid ${fieldName}: "${timeString}" must be in HH:MM format (e.g., 09:30 or 14:45)`);
            return false;
        }

        return true;
    }

    /**
     * Validates a non-empty string
     * @param {string} value - String to validate
     * @param {Object} options - Validation options
     * @param {number} options.minLength - Minimum length
     * @param {number} options.maxLength - Maximum length
     * @param {string} options.fieldName - Field name for error messages
     * @returns {string|null} Trimmed string or null if invalid
     */
    static validateString(value, options = {}) {
        const { minLength = 1, maxLength = 10000, fieldName = 'input' } = options;

        if (value === undefined || value === null) {
            console.error(`❌ Invalid ${fieldName}: Value is required`);
            return null;
        }

        if (typeof value !== 'string') {
            value = String(value);
        }

        const trimmed = value.trim();

        if (trimmed.length < minLength) {
            console.error(`❌ Invalid ${fieldName}: Must be at least ${minLength} character(s)`);
            return null;
        }

        if (trimmed.length > maxLength) {
            console.error(`❌ Invalid ${fieldName}: Must not exceed ${maxLength} characters`);
            return null;
        }

        return trimmed;
    }

    /**
     * Safely reads a JSON file with error handling
     * @param {string} filename - Path to JSON file
     * @param {Object} options - Options
     * @param {number} options.maxSizeMB - Maximum file size in MB
     * @returns {Object|null} Parsed JSON or null if error
     */
    static readJSONFile(filename, options = {}) {
        const { maxSizeMB = 10 } = options;

        if (!filename || typeof filename !== 'string') {
            console.error('\n❌ Invalid filename: Path is required\n');
            return null;
        }

        // Check if file exists
        if (!fs.existsSync(filename)) {
            console.error(`\n❌ File not found: ${filename}\n`);
            console.log('💡 Tip: Check the file path and try again\n');
            return null;
        }

        try {
            // Check file size
            const stats = fs.statSync(filename);
            const fileSizeMB = stats.size / (1024 * 1024);

            if (fileSizeMB > maxSizeMB) {
                console.error(`\n❌ File too large: ${fileSizeMB.toFixed(2)}MB (max: ${maxSizeMB}MB)\n`);
                return null;
            }

            // Read file
            const rawData = fs.readFileSync(filename, 'utf8');

            // Parse JSON
            const data = JSON.parse(rawData);

            return data;

        } catch (error) {
            if (error.code === 'EACCES') {
                console.error(`\n❌ Permission denied: Cannot read ${filename}\n`);
                console.log('💡 Tip: Check file permissions\n');
            } else if (error instanceof SyntaxError) {
                console.error(`\n❌ Invalid JSON format in ${filename}\n`);
                console.log('💡 Tip: Validate your JSON file at jsonlint.com\n');
            } else if (error.code === 'ENOENT') {
                console.error(`\n❌ File not found: ${filename}\n`);
            } else {
                console.error(`\n❌ Error reading file: ${error.message}\n`);
            }
            return null;
        }
    }

    /**
     * Safely writes a JSON file with error handling
     * @param {string} filename - Path to JSON file
     * @param {Object} data - Data to write
     * @returns {boolean} True if successful, false otherwise
     */
    static writeJSONFile(filename, data) {
        if (!filename || typeof filename !== 'string') {
            console.error('\n❌ Invalid filename: Path is required\n');
            return false;
        }

        if (!data || typeof data !== 'object') {
            console.error('\n❌ Invalid data: Object is required\n');
            return false;
        }

        try {
            const jsonString = JSON.stringify(data, null, 2);
            fs.writeFileSync(filename, jsonString, 'utf8');
            return true;

        } catch (error) {
            if (error.code === 'EACCES') {
                console.error(`\n❌ Permission denied: Cannot write to ${filename}\n`);
                console.log('💡 Tip: Check file and directory permissions\n');
            } else if (error.code === 'ENOSPC') {
                console.error(`\n❌ Disk full: Not enough space to write ${filename}\n`);
                console.log('💡 Tip: Free up disk space and try again\n');
            } else {
                console.error(`\n❌ Error writing file: ${error.message}\n`);
            }
            return false;
        }
    }

    /**
     * Validates imported wellness data structure
     * @param {Object} data - Imported data to validate
     * @returns {Object} Validation result with isValid and errors array
     */
    static validateImportedData(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            errors.push('Data must be a valid object');
            return { isValid: false, errors };
        }

        // Check required top-level properties
        if (!data.exportInfo) {
            errors.push('Missing required field: exportInfo');
        } else {
            if (!data.exportInfo.version) {
                errors.push('Missing exportInfo.version');
            }
            if (!data.exportInfo.timestamp) {
                errors.push('Missing exportInfo.timestamp');
            }
        }

        if (!data.dailyRecords || !Array.isArray(data.dailyRecords)) {
            errors.push('Missing or invalid dailyRecords array');
        } else {
            // Validate sample of records (check first 5)
            const sampleSize = Math.min(5, data.dailyRecords.length);
            for (let i = 0; i < sampleSize; i++) {
                const record = data.dailyRecords[i];

                if (!record.date) {
                    errors.push(`Record ${i}: Missing date field`);
                }

                // Validate timestamps if present
                if (record.mood?.timestamp) {
                    const date = new Date(record.mood.timestamp);
                    if (isNaN(date.getTime())) {
                        errors.push(`Record ${i}: Invalid mood timestamp`);
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ValidationUtils;
