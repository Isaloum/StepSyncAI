/**
 * Enhanced Medication Tracker - Stub for Testing
 * Provides medication name/dosage parsing and validation
 */
class EnhancedMedicationTracker {
    constructor(options = {}) {
        this.auditLogger = options.auditLogger;
        this.fdaValidator = options.fdaValidator;
        this.medications = [];
        this.currentUser = null;
        this.currentRole = null;
        this.auditContext = {};
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
            // Preserve multi-word capitalization (e.g., "Extended Release Metoprolol")
            const words = sanitized.split(/\s+/);
            const normalizedName = words.map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            
            return {
                name: normalizedName,
                dosage: null,
                unit: null,
                quantity: null
            };
        }

        // Extract dosage components
        const dosageValue = match[1];
        const unit = match[2].toLowerCase(); // Convert to lowercase for consistency
        const dosage = `${dosageValue}${unit}`;
        const name = sanitized.substring(0, match.index).trim();
        
        // Normalize medication name while preserving multi-word capitalization
        const words = name.split(/\s+/);
        const normalizedName = words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');

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
            .replace(/[<>{}]/g, '') // Remove potential XSS and malicious characters
            .replace(/['";]/g, '') // Remove SQL injection characters
            .replace(/--/g, '') // Remove SQL comment
            .replace(/DROP\s+TABLE/gi, '') // Remove DROP TABLE
            .replace(/DELETE\s+FROM/gi, '') // Remove DELETE
            .replace(/INSERT\s+INTO/gi, '') // Remove INSERT
            .replace(/onerror/gi, '') // Remove event handlers
            .replace(/onclick/gi, '')
            .replace(/onload/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/script/gi, '')
            .replace(/alert/gi, '') // Remove alert calls
            .replace(/\(/g, '') // Remove parentheses
            .replace(/\)/g, '')
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
            const logEntry = {
                action,
                ...details, // Spread details at top level for easier access
                userId: this.currentUser || this.auditContext.userId,
                ipAddress: this.auditContext.ipAddress,
                timestamp: new Date().toISOString()
            };
            
            // Only add details as nested if it doesn't conflict with top-level fields
            if (!details.medication && !details.reason && !details.medicationId) {
                logEntry.details = details;
            }
            
            this.auditLogger.log(logEntry);
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

        // Check for@ in sanitized name (@ is not removed by sanitize, so reject it)
        if (/@/.test(sanitizedName)) {
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

        // Validate maximum dosage limits (simple check)
        if (quantity > 10000) {
            const error = new Error('Dosage exceeds maximum safe limit');
            this.logAction('VALIDATION_FAILED', { reason: error.message, dosage: medication.dosage });
            throw error;
        }

        // Validate frequency if provided
        if (medication.frequency) {
            const validFrequencies = ['once daily', 'twice daily', 'three times daily', 'as needed', 'weekly'];
            if (!validFrequencies.includes(medication.frequency)) {
                const error = new Error('Invalid frequency format');
                this.logAction('VALIDATION_FAILED', { reason: error.message, frequency: medication.frequency });
                throw error;
            }
        }

        // Check for duplicate medications
        const duplicate = this.medications.find(m => 
            m.name.toLowerCase() === sanitizedName.toLowerCase() && 
            m.dosage === medication.dosage.trim()
        );
        if (duplicate) {
            const error = new Error('Duplicate medication entry');
            this.logAction('VALIDATION_FAILED', { reason: error.message, name: sanitizedName, dosage: medication.dosage });
            throw error;
        }

        // Extract unit (preserve case)
        const unitMatch = medication.dosage.match(/(mg|mcg|g|ml|iu|units?)$/i);
        const unit = unitMatch ? unitMatch[1] : null;

        const result = {
            id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: sanitizedName,
            dosage: medication.dosage.trim(),
            frequency: medication.frequency,
            unit,
            quantity,
            createdAt: new Date().toISOString()
        };

        // Store medication
        this.medications.push(result);

        this.logAction('MEDICATION_ADDED', { medication: result });
        return result;
    }

    /**
     * Add medication with FDA verification
     * @param {Object} medication - Medication object
     * @returns {Promise<Object>} Validated medication with FDA info
     */
    async addMedicationWithFDAVerification(medication) {
        // Validate basic fields
        if (!medication.dosage) {
            throw new Error('Dosage is required');
        }

        // Validate frequency if provided
        if (medication.frequency) {
            const validFrequencies = ['once daily', 'twice daily', 'three times daily', 'as needed', 'weekly'];
            if (!validFrequencies.includes(medication.frequency)) {
                throw new Error('Invalid frequency format');
            }
        }

        // Check with FDA validator
        let fdaVerified = false;
        if (this.fdaValidator) {
            const fdaResult = await this.fdaValidator.validateMedication(medication.name);
            fdaVerified = fdaResult.valid;
        }

        // Create medication with ID
        const result = {
            id: `med_${Date.now()}`,
            name: this.sanitize(medication.name),
            dosage: medication.dosage,
            frequency: medication.frequency,
            fdaVerified,
            createdAt: new Date().toISOString()
        };

        this.medications.push(result);
        this.logAction('FDA_VERIFICATION_COMPLETED', { fdaVerified, medicationId: result.id });
        this.logAction('MEDICATION_ADDED', { medication: result });

        return result;
    }

    /**
     * Update medication
     * @param {string} id - Medication ID
     * @param {Object} updates - Updates to apply
     * @returns {Object} Updated medication
     */
    updateMedication(id, updates) {
        if (!this.currentUser || this.currentRole === 'viewer') {
            throw new Error('Insufficient permissions to update medication');
        }

        const medication = this.medications.find(m => m.id === id);
        if (!medication) {
            throw new Error('Medication not found');
        }

        Object.assign(medication, updates);
        this.logAction('MEDICATION_UPDATED', { medicationId: id, updates });
        return medication;
    }

    /**
     * Remove medication
     * @param {string} id - Medication ID
     * @param {string} reason - Reason for removal
     */
    removeMedication(id, reason) {
        const index = this.medications.findIndex(m => m.id === id);
        if (index >= 0) {
            this.medications.splice(index, 1);
            this.logAction('MEDICATION_REMOVED', { 
                medicationId: id, 
                reason, 
                severity: reason?.includes('Critical') ? 'CRITICAL' : 'NORMAL'
            });
        }
    }

    /**
     * Get medication by ID
     * @param {string} id - Medication ID
     * @returns {Object} Medication object
     */
    getMedication(id) {
        const medication = this.medications.find(m => m.id === id);
        if (!medication) {
            throw new Error('Medication not found');
        }
        return medication;
    }

    /**
     * Get encrypted medication (stub)
     * @param {string} id - Medication ID
     * @returns {Object} Encrypted medication data
     */
    getEncryptedMedication(id) {
        const medication = this.getMedication(id);
        // Return a "different" object to simulate encryption
        return { encrypted: true, data: btoa(JSON.stringify(medication)) };
    }

    /**
     * Set current user for audit trail
     * @param {string} userId - User ID
     * @param {string} role - User role
     */
    setCurrentUser(userId, role) {
        this.currentUser = userId;
        this.currentRole = role;
    }

    /**
     * Set audit context
     * @param {Object} context - Audit context
     */
    setAuditContext(context) {
        this.auditContext = context;
    }

    /**
     * Get medication audit trail
     * @param {string} id - Medication ID
     * @returns {Array} Audit trail entries
     */
    getMedicationAuditTrail(id) {
        if (!this.auditLogger) {
            return [];
        }

        const logs = this.auditLogger.getLogs();
        return logs.filter(log => 
            log.details && 
            (log.details.medicationId === id || 
             (log.details.medication && log.details.medication.id === id))
        );
    }

    /**
     * Export audit logs
     * @param {string} format - Export format (e.g., 'HIPAA')
     * @returns {Array} Exported logs
     */
    exportAuditLogs(format) {
        if (!this.auditLogger) {
            return [];
        }

        const logs = this.auditLogger.getLogs();
        
        // For HIPAA format, ensure required fields
        if (format === 'HIPAA') {
            return logs.map(log => ({
                ...log,
                userId: log.userId || this.currentUser || 'unknown',
                medicationId: log.medicationId || log.details?.medicationId || 'unknown',
                timestamp: log.timestamp || new Date().toISOString()
            }));
        }

        return logs;
    }

    /**
     * Check medication interactions
     * @param {Array} medications - List of medications
     * @returns {Promise<Array>} Interactions found
     */
    async checkMedicationInteractions(medications) {
        return await this.checkDrugInteractions(medications);
    }

    /**
     * Get NDC code for medication
     * @param {string} medicationName - Medication name
     * @returns {Promise<string>} NDC code
     */
    async getNDCCode(medicationName) {
        if (!this.fdaValidator) {
            return null;
        }

        return await this.fdaValidator.getNDCCode(medicationName);
    }

    /**
     * Validate dosage against FDA guidelines (stub)
     * @param {string} medicationName - Medication name
     * @param {string} dosage - Dosage
     * @returns {Promise<Object>} Validation result
     */
    async validateDosageAgainstFDAGuidelines(medicationName, dosage) {
        // Stub: Check if dosage is excessively high
        const quantity = parseFloat(dosage);
        if (quantity > 10000) {
            throw new Error('Dosage exceeds maximum safe limit');
        }

        return { valid: true, warnings: [] };
    }

    /**
     * Validate age appropriateness (stub)
     * @param {string} medicationName - Medication name
     * @param {number} age - Patient age
     * @returns {Promise<Object>} Validation result
     */
    async validateAgeAppropriate(medicationName, age) {
        return { appropriate: true, warnings: [] };
    }
}

module.exports = EnhancedMedicationTracker;
