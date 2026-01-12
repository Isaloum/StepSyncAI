/**
 * Enhanced Medication Tracker - Stub for Testing
 * Provides medication name/dosage parsing and validation
 */

class EnhancedMedicationTracker {
    constructor(options = {}) {
        this.auditLogger = options.auditLogger;
        this.fdaValidator = options.fdaValidator;
    }

    /**
     * Parse medication string into name and dosage components
     * @param {string} medicationString - Medication with dosage (e.g., "Lisinopril 10mg")
     * @returns {Object} Parsed medication object
     */
    parseMedication(medicationString) {
        if (!medicationString || typeof medicationString !== 'string') {
            throw new Error('Invalid medication string');
        }

        // Sanitize and normalize input
        const sanitized = medicationString.trim();

        // Extract dosage pattern - handles regular, range, and decimal dosages
        // Patterns: "10mg", "2.5mg", "200-400mg"
        const dosagePattern = /(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)\s*(mg|mcg|g|ml|iu|units?)$/i;
        const match = sanitized.match(dosagePattern);

        if (!match) {
            // No dosage found - return medication name normalized
            const normalizedName = sanitized.charAt(0).toUpperCase() + sanitized.slice(1).toLowerCase();
            return {
                name: normalizedName,
                dosage: null,
                unit: null,
                quantity: null
            };
        }

        // Extract dosage components
        const dosageValue = match[1];
        const unit = match[2].toLowerCase();
        const dosage = `${dosageValue}${unit}`;
        const name = sanitized.substring(0, match.index).trim();
        
        // Normalize medication name (capitalize first letter)
        const normalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

        // Parse quantity (for range dosages, use the first value)
        let quantity = null;
        if (dosageValue.includes('-')) {
            quantity = parseFloat(dosageValue.split('-')[0]);
        } else {
            quantity = parseFloat(dosageValue);
        }

        return {
            name: normalizedName,
            dosage,
            unit,
            quantity
        };
    }

    /**
     * Validate medication input
     * @param {Object} medication - Medication object
     * @returns {Object} Validation result
     */
    async validateMedication(medication) {
        const errors = [];
        const warnings = [];

        if (!medication.name || medication.name.trim() === '') {
            errors.push('Medication name is required');
        }

        if (!medication.dosage) {
            warnings.push('No dosage specified');
        }

        // Validate with FDA validator if provided
        if (this.fdaValidator && medication.name) {
            const fdaResult = await this.fdaValidator.validateMedication(medication.name);
            if (!fdaResult.valid) {
                errors.push('FDA validation failed');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Sanitize medication input
     * @param {string} input - Raw input string
     * @returns {string} Sanitized input
     */
    sanitize(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential XSS characters
            .replace(/\s+/g, ' '); // Normalize whitespace
    }

    /**
     * Check drug interactions
     * @param {Array} medications - List of medications
     * @returns {Promise<Array>} List of interactions
     */
    async checkDrugInteractions(medications) {
        if (!this.fdaValidator) {
            return [];
        }

        return await this.fdaValidator.checkDrugInteractions(medications);
    }

    /**
     * Log action to audit log
     * @param {string} action - Action performed
     * @param {Object} details - Action details
     */
    logAction(action, details = {}) {
        if (this.auditLogger) {
            this.auditLogger.log({
                action,
                details,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Add medication with validation
     * @param {Object} medication - Medication object with name and dosage
     * @returns {Object} Validated medication object
     * @throws {Error} If validation fails
     */
    addMedication(medication) {
        // Validate required fields
        if (!medication.name || typeof medication.name !== 'string' || medication.name.trim() === '') {
            const error = new Error('Medication name is required');
            this.logAction('VALIDATION_FAILED', { reason: error.message });
            throw error;
        }

        if (!medication.dosage) {
            const error = new Error('Dosage is required');
            this.logAction('VALIDATION_FAILED', { reason: error.message });
            throw error;
        }

        // Sanitize name (remove dangerous characters)
        const sanitizedName = this.sanitize(medication.name);
        
        // Validate name doesn't contain invalid characters
        if (/[@{}<>]/.test(sanitizedName)) {
            const error = new Error('Invalid medication name');
            this.logAction('VALIDATION_FAILED', { reason: error.message, name: medication.name });
            throw error;
        }

        // Validate dosage format
        const dosagePattern = /^-?\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?\s*(mg|mcg|g|ml|iu|units?)$/i;
        if (!dosagePattern.test(medication.dosage.trim())) {
            const error = new Error('Invalid dosage format');
            this.logAction('VALIDATION_FAILED', { reason: error.message, dosage: medication.dosage });
            throw error;
        }

        // Extract quantity
        const quantityMatch = medication.dosage.match(/^(-?\d+(?:\.\d+)?)/);
        const quantity = parseFloat(quantityMatch[1]);

        // Validate quantity is positive
        if (quantity <= 0) {
            const error = new Error('Dosage quantity must be positive');
            this.logAction('VALIDATION_FAILED', { reason: error.message, dosage: medication.dosage });
            throw error;
        }

        // Extract unit (case-insensitive)
        const unitMatch = medication.dosage.match(/(mg|mcg|g|ml|iu|units?)$/i);
        const unit = unitMatch ? unitMatch[1].toLowerCase() : null;

        const result = {
            name: sanitizedName,
            dosage: medication.dosage.trim(),
            unit,
            quantity,
            createdAt: new Date().toISOString()
        };

        this.logAction('MEDICATION_ADDED', { medication: result });
        return result;
    }
}

module.exports = EnhancedMedicationTracker;
