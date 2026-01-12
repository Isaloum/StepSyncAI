/**
 * Enhanced Medication Tracker
 * Implements smart medication tracking with name/dosage separation, 
 * validation, audit logging, and FDA compliance features
 * 
 * @version 2.0.0
 * @author MindTrackAI
 * @date 2026-01-12
 */

class EnhancedMedicationTracker {
  /**
   * Initialize the Enhanced Medication Tracker
   * @param {Object} config - Configuration object
   * @param {String} config.userId - User identifier for audit logging
   * @param {Boolean} config.enableAuditLog - Enable audit logging (default: true)
   * @param {Boolean} config.enableFDACompliance - Enable FDA compliance checks (default: true)
   * @param {Object} config.auditStorage - Storage backend for audit logs (default: memory)
   */
  constructor(config = {}) {
    this.userId = config.userId || 'system';
    this.enableAuditLog = config.enableAuditLog !== false;
    this.enableFDACompliance = config.enableFDACompliance !== false;
    this.auditStorage = config.auditStorage || new InMemoryAuditStore();
    
    // Medication storage
    this.medications = new Map();
    this.medicationHistory = new Map();
    
    // FDA approved dosage database (simplified)
    this.fdaDatabase = new FDADatabaseManager();
    
    // Validation rules
    this.validationRules = this._initializeValidationRules();
    
    // Initialize audit log
    if (this.enableAuditLog) {
      this._logAudit('SYSTEM_INIT', {
        userId: this.userId,
        timestamp: new Date().toISOString(),
        fdaComplianceEnabled: this.enableFDACompliance
      });
    }
  }

  /**
   * Initialize validation rules for medications
   * @private
   */
  _initializeValidationRules() {
    return {
      nameValidation: {
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9\s\-()]+$/,
        allowedCharacters: 'alphanumeric, spaces, hyphens, parentheses'
      },
      dosageValidation: {
        numericPattern: /^(\d+\.?\d*)\s*([a-zA-Z%\/]+)$/,
        minValue: 0.001,
        maxValue: 10000,
        allowedUnits: ['mg', 'g', 'mcg', 'ml', 'l', 'units', 'IU', '%']
      },
      frequencyValidation: {
        allowedFrequencies: ['once daily', 'twice daily', 'three times daily', 'four times daily', 
                            'every 4 hours', 'every 6 hours', 'every 8 hours', 'every 12 hours',
                            'as needed', 'weekly', 'bi-weekly', 'monthly'],
        pattern: /^(once|twice|three times|four times|every \d+ hours|as needed|weekly|bi-weekly|monthly) (daily|hours)?$/i
      }
    };
  }

  /**
   * Parse and separate medication name from dosage
   * Intelligently extracts medication name and dosage from combined input
   * 
   * @param {String} medicationInput - Raw medication input (e.g., "Lisinopril 10mg")
   * @returns {Object} Parsed medication object with name and dosage
   */
  parseMedicationInput(medicationInput) {
    if (!medicationInput || typeof medicationInput !== 'string') {
      throw new Error('Invalid medication input: must be a non-empty string');
    }

    const input = medicationInput.trim();
    const parsed = {
      original: input,
      name: '',
      dosage: null,
      unit: '',
      parsed: false,
      confidence: 0,
      warnings: []
    };

    // Pattern to match dosage at the end: number + unit
    const dosagePattern = /(\d+\.?\d*)\s*([a-zA-Z%\/]+)(?:\s|$)/i;
    const match = input.match(dosagePattern);

    if (match) {
      const dosageValue = parseFloat(match[1]);
      const unit = match[2].toLowerCase();

      // Validate unit
      if (!this.validationRules.dosageValidation.allowedUnits.includes(unit)) {
        parsed.warnings.push(`Unit "${unit}" may not be standard. Consider using: ${this.validationRules.dosageValidation.allowedUnits.join(', ')}`);
      }

      // Validate dosage value range
      if (dosageValue < this.validationRules.dosageValidation.minValue) {
        parsed.warnings.push(`Dosage value ${dosageValue} is below recommended minimum (${this.validationRules.dosageValidation.minValue})`);
      }
      if (dosageValue > this.validationRules.dosageValidation.maxValue) {
        parsed.warnings.push(`Dosage value ${dosageValue} exceeds recommended maximum (${this.validationRules.dosageValidation.maxValue})`);
      }

      // Extract medication name (everything before the dosage)
      parsed.name = input.substring(0, match.index).trim();
      parsed.dosage = dosageValue;
      parsed.unit = unit;
      parsed.parsed = true;
      parsed.confidence = 0.95;
    } else {
      // No dosage found, assume entire input is medication name
      parsed.name = input;
      parsed.parsed = false;
      parsed.confidence = 0;
      parsed.warnings.push('No dosage information detected. Please provide dosage with unit (e.g., "10mg")');
    }

    // Validate name
    const nameValidation = this._validateMedicationName(parsed.name);
    if (!nameValidation.valid) {
      parsed.warnings.push(...nameValidation.messages);
    }

    return parsed;
  }

  /**
   * Validate medication name
   * @private
   */
  _validateMedicationName(name) {
    const result = {
      valid: true,
      messages: []
    };

    if (name.length < this.validationRules.nameValidation.minLength) {
      result.valid = false;
      result.messages.push(`Medication name too short (minimum ${this.validationRules.nameValidation.minLength} characters)`);
    }

    if (name.length > this.validationRules.nameValidation.maxLength) {
      result.valid = false;
      result.messages.push(`Medication name too long (maximum ${this.validationRules.nameValidation.maxLength} characters)`);
    }

    if (!this.validationRules.nameValidation.pattern.test(name)) {
      result.valid = false;
      result.messages.push(`Medication name contains invalid characters. Allowed: ${this.validationRules.nameValidation.allowedCharacters}`);
    }

    return result;
  }

  /**
   * Add medication with comprehensive validation and audit logging
   * 
   * @param {Object} medicationData - Medication data
   * @param {String} medicationData.name - Medication name
   * @param {Number} medicationData.dosage - Dosage amount
   * @param {String} medicationData.unit - Dosage unit
   * @param {String} medicationData.frequency - Frequency of administration
   * @param {String} [medicationData.prescriber] - Prescribing physician
   * @param {String} [medicationData.reason] - Reason for medication
   * @param {Date} [medicationData.startDate] - Start date
   * @returns {Object} Result of medication addition
   */
  addMedication(medicationData) {
    const result = {
      success: false,
      medicationId: null,
      data: null,
      validationErrors: [],
      warnings: [],
      fdaCompliance: null
    };

    // Validate required fields
    if (!medicationData.name) {
      result.validationErrors.push('Medication name is required');
    }
    if (!medicationData.dosage || medicationData.dosage <= 0) {
      result.validationErrors.push('Valid dosage is required');
    }
    if (!medicationData.unit) {
      result.validationErrors.push('Dosage unit is required');
    }
    if (!medicationData.frequency) {
      result.validationErrors.push('Frequency is required');
    }

    if (result.validationErrors.length > 0) {
      this._logAudit('MEDICATION_ADD_FAILED', {
        data: medicationData,
        errors: result.validationErrors
      });
      return result;
    }

    // Validate frequency
    const frequencyValid = this._validateFrequency(medicationData.frequency);
    if (!frequencyValid.valid) {
      result.validationErrors.push(...frequencyValid.messages);
      this._logAudit('MEDICATION_ADD_FAILED', {
        data: medicationData,
        errors: result.validationErrors
      });
      return result;
    }

    // FDA Compliance Check
    if (this.enableFDACompliance) {
      result.fdaCompliance = this.fdaDatabase.checkCompliance({
        name: medicationData.name,
        dosage: medicationData.dosage,
        unit: medicationData.unit,
        frequency: medicationData.frequency
      });

      if (!result.fdaCompliance.approved) {
        result.warnings.push(`FDA Compliance Warning: ${result.fdaCompliance.message}`);
      }
    }

    // Generate medication ID
    const medicationId = this._generateMedicationId();

    // Create medication object
    const medication = {
      id: medicationId,
      name: medicationData.name,
      dosage: medicationData.dosage,
      unit: medicationData.unit,
      frequency: medicationData.frequency,
      prescriber: medicationData.prescriber || 'Unknown',
      reason: medicationData.reason || 'Not specified',
      startDate: medicationData.startDate || new Date(),
      createdAt: new Date().toISOString(),
      status: 'active',
      intakeLog: []
    };

    // Store medication
    this.medications.set(medicationId, medication);
    if (!this.medicationHistory.has(medicationId)) {
      this.medicationHistory.set(medicationId, []);
    }

    // Log to history
    this.medicationHistory.get(medicationId).push({
      ...medication,
      action: 'CREATED',
      timestamp: new Date().toISOString()
    });

    result.success = true;
    result.medicationId = medicationId;
    result.data = medication;

    // Audit log
    this._logAudit('MEDICATION_ADDED', {
      medicationId,
      name: medication.name,
      dosage: `${medication.dosage}${medication.unit}`,
      frequency: medication.frequency,
      prescriber: medication.prescriber
    });

    return result;
  }

  /**
   * Log medication intake
   * 
   * @param {String} medicationId - Medication ID
   * @param {Object} [intakeData] - Additional intake information
   * @returns {Object} Result of intake logging
   */
  logIntake(medicationId, intakeData = {}) {
    const result = {
      success: false,
      message: '',
      data: null
    };

    if (!this.medications.has(medicationId)) {
      result.message = `Medication ID "${medicationId}" not found`;
      this._logAudit('MEDICATION_INTAKE_FAILED', {
        medicationId,
        reason: result.message
      });
      return result;
    }

    const medication = this.medications.get(medicationId);
    const intake = {
      timestamp: new Date().toISOString(),
      medicationId,
      medicationName: medication.name,
      dosage: `${medication.dosage}${medication.unit}`,
      taken: true,
      notes: intakeData.notes || '',
      sideEffects: intakeData.sideEffects || [],
      missedDose: intakeData.missedDose || false
    };

    medication.intakeLog.push(intake);
    result.success = true;
    result.data = intake;

    this._logAudit('MEDICATION_INTAKE_LOGGED', {
      medicationId,
      medicationName: medication.name,
      dosage: intake.dosage,
      timestamp: intake.timestamp,
      sideEffects: intake.sideEffects.length > 0 ? intake.sideEffects : 'none'
    });

    return result;
  }

  /**
   * Get medication by ID
   * 
   * @param {String} medicationId - Medication ID
   * @returns {Object|null} Medication object or null if not found
   */
  getMedication(medicationId) {
    return this.medications.get(medicationId) || null;
  }

  /**
   * Get all active medications
   * 
   * @returns {Array} Array of active medications
   */
  getAllMedications() {
    return Array.from(this.medications.values()).filter(med => med.status === 'active');
  }

  /**
   * Get medication history
   * 
   * @param {String} medicationId - Medication ID
   * @returns {Array} History of medication changes
   */
  getMedicationHistory(medicationId) {
    return this.medicationHistory.get(medicationId) || [];
  }

  /**
   * Update medication
   * 
   * @param {String} medicationId - Medication ID
   * @param {Object} updateData - Fields to update
   * @returns {Object} Update result
   */
  updateMedication(medicationId, updateData) {
    const result = {
      success: false,
      message: '',
      data: null
    };

    if (!this.medications.has(medicationId)) {
      result.message = `Medication ID "${medicationId}" not found`;
      return result;
    }

    const medication = this.medications.get(medicationId);
    const originalData = { ...medication };

    // Update allowed fields
    const allowedUpdates = ['dosage', 'unit', 'frequency', 'reason', 'status', 'prescriber'];
    let updated = false;

    for (const field of allowedUpdates) {
      if (field in updateData && updateData[field] !== undefined) {
        medication[field] = updateData[field];
        updated = true;
      }
    }

    if (!updated) {
      result.message = 'No valid fields to update';
      return result;
    }

    // Log to history
    this.medicationHistory.get(medicationId).push({
      ...medication,
      action: 'UPDATED',
      timestamp: new Date().toISOString(),
      previousData: originalData
    });

    result.success = true;
    result.data = medication;

    this._logAudit('MEDICATION_UPDATED', {
      medicationId,
      changes: updateData,
      timestamp: new Date().toISOString()
    });

    return result;
  }

  /**
   * Discontinue medication
   * 
   * @param {String} medicationId - Medication ID
   * @param {String} reason - Reason for discontinuation
   * @returns {Object} Discontinuation result
   */
  discontinueMedication(medicationId, reason = 'User requested') {
    const result = {
      success: false,
      message: '',
      data: null
    };

    if (!this.medications.has(medicationId)) {
      result.message = `Medication ID "${medicationId}" not found`;
      return result;
    }

    const medication = this.medications.get(medicationId);
    medication.status = 'discontinued';
    medication.discontinuedAt = new Date().toISOString();
    medication.discontinuationReason = reason;

    // Log to history
    this.medicationHistory.get(medicationId).push({
      ...medication,
      action: 'DISCONTINUED',
      timestamp: new Date().toISOString()
    });

    result.success = true;
    result.data = medication;

    this._logAudit('MEDICATION_DISCONTINUED', {
      medicationId,
      medicationName: medication.name,
      reason,
      timestamp: new Date().toISOString()
    });

    return result;
  }

  /**
   * Get intake compliance report
   * 
   * @param {String} [medicationId] - Optional medication ID for specific medication
   * @param {Number} [days] - Number of days to analyze (default: 30)
   * @returns {Object} Compliance report
   */
  getComplianceReport(medicationId = null, days = 30) {
    const report = {
      generatedAt: new Date().toISOString(),
      period: `${days} days`,
      medications: []
    };

    const medications = medicationId 
      ? [this.medications.get(medicationId)].filter(m => m)
      : this.getAllMedications();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const med of medications) {
      const recentIntakes = med.intakeLog.filter(intake => 
        new Date(intake.timestamp) > cutoffDate
      );

      const expectedDoses = this._calculateExpectedDoses(med.frequency, days);
      const actualDoses = recentIntakes.length;
      const missedDoses = recentIntakes.filter(i => i.missedDose).length;
      const complianceRate = expectedDoses > 0 ? (actualDoses / expectedDoses * 100).toFixed(2) : 0;

      report.medications.push({
        medicationId: med.id,
        name: med.name,
        dosage: `${med.dosage}${med.unit}`,
        frequency: med.frequency,
        expectedDoses,
        actualDoses,
        missedDoses,
        complianceRate: `${complianceRate}%`,
        sideEffectsReported: this._aggregateSideEffects(recentIntakes)
      });
    }

    return report;
  }

  /**
   * Get audit log
   * 
   * @param {Object} [filters] - Filter options
   * @returns {Array} Audit log entries
   */
  getAuditLog(filters = {}) {
    return this.auditStorage.query(filters);
  }

  /**
   * Validate frequency format
   * @private
   */
  _validateFrequency(frequency) {
    const result = {
      valid: false,
      messages: []
    };

    if (!frequency || typeof frequency !== 'string') {
      result.messages.push('Frequency must be a non-empty string');
      return result;
    }

    const normalizedFrequency = frequency.toLowerCase().trim();
    
    if (this.validationRules.frequencyValidation.allowedFrequencies.includes(normalizedFrequency)) {
      result.valid = true;
    } else {
      result.messages.push(
        `Invalid frequency. Allowed values: ${this.validationRules.frequencyValidation.allowedFrequencies.join(', ')}`
      );
    }

    return result;
  }

  /**
   * Generate unique medication ID
   * @private
   */
  _generateMedicationId() {
    return `MED_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Calculate expected doses based on frequency and days
   * @private
   */
  _calculateExpectedDoses(frequency, days) {
    const frequencyMap = {
      'once daily': 1,
      'twice daily': 2,
      'three times daily': 3,
      'four times daily': 4,
      'every 4 hours': 6,
      'every 6 hours': 4,
      'every 8 hours': 3,
      'every 12 hours': 2,
      'as needed': 0,
      'weekly': 1 / 7,
      'bi-weekly': 1 / 14,
      'monthly': 1 / 30
    };

    const normalizedFreq = frequency.toLowerCase();
    const dailyFreq = frequencyMap[normalizedFreq] || 0;
    return Math.floor(dailyFreq * days);
  }

  /**
   * Aggregate side effects from intake logs
   * @private
   */
  _aggregateSideEffects(intakes) {
    const sideEffects = {};
    
    for (const intake of intakes) {
      for (const effect of intake.sideEffects) {
        sideEffects[effect] = (sideEffects[effect] || 0) + 1;
      }
    }

    return Object.entries(sideEffects).map(([effect, count]) => ({
      effect,
      occurrences: count
    }));
  }

  /**
   * Log audit event
   * @private
   */
  _logAudit(action, details) {
    if (!this.enableAuditLog) return;

    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId: this.userId,
      details,
      version: '2.0.0'
    };

    this.auditStorage.store(auditEntry);
  }

  /**
   * Export audit logs
   * 
   * @returns {Array} Complete audit log
   */
  exportAuditLogs() {
    return this.auditStorage.getAll();
  }

  /**
   * Clear audit logs (requires confirmation)
   * 
   * @param {Boolean} confirmed - Confirmation flag
   * @returns {Object} Clear result
   */
  clearAuditLogs(confirmed = false) {
    if (!confirmed) {
      return {
        success: false,
        message: 'Audit log clearing requires explicit confirmation'
      };
    }

    const result = this.auditStorage.clear();
    
    this._logAudit('AUDIT_LOG_CLEARED', {
      timestamp: new Date().toISOString(),
      action: 'Manual clear by user'
    });

    return {
      success: true,
      message: 'Audit logs cleared',
      entriesCleared: result
    };
  }
}

/**
 * FDA Database Manager
 * Manages FDA approved medications and dosage limits
 */
class FDADatabaseManager {
  constructor() {
    this.approvedMedications = new Map();
    this._initializeFDADatabase();
  }

  /**
   * Initialize FDA database with common medications
   * @private
   */
  _initializeFDADatabase() {
    // Sample FDA approved medications with dosage ranges
    const medications = [
      { name: 'Lisinopril', minDosage: 10, maxDosage: 80, unit: 'mg', frequency: 'once daily' },
      { name: 'Metformin', minDosage: 500, maxDosage: 2550, unit: 'mg', frequency: 'daily' },
      { name: 'Atorvastatin', minDosage: 10, maxDosage: 80, unit: 'mg', frequency: 'once daily' },
      { name: 'Omeprazole', minDosage: 20, maxDosage: 40, unit: 'mg', frequency: 'once daily' },
      { name: 'Ibuprofen', minDosage: 200, maxDosage: 800, unit: 'mg', frequency: 'every 4-6 hours' },
      { name: 'Amoxicillin', minDosage: 250, maxDosage: 500, unit: 'mg', frequency: 'three times daily' },
      { name: 'Vitamin D3', minDosage: 1000, maxDosage: 4000, unit: 'IU', frequency: 'daily' }
    ];

    for (const med of medications) {
      this.approvedMedications.set(med.name.toLowerCase(), med);
    }
  }

  /**
   * Check FDA compliance for a medication
   * 
   * @param {Object} medicationInfo - Medication information
   * @returns {Object} Compliance check result
   */
  checkCompliance(medicationInfo) {
    const { name, dosage, unit } = medicationInfo;
    const normalizedName = name.toLowerCase();

    const result = {
      compliant: true,
      approved: true,
      message: 'Medication approved by FDA with dosage within recommended range',
      medication: null,
      warnings: []
    };

    const fdaMed = this.approvedMedications.get(normalizedName);

    if (!fdaMed) {
      result.approved = false;
      result.compliant = false;
      result.message = `Medication "${name}" not found in FDA database. Please verify with healthcare provider.`;
      return result;
    }

    result.medication = fdaMed;

    // Check unit compatibility
    if (fdaMed.unit.toLowerCase() !== unit.toLowerCase()) {
      result.warnings.push(
        `Unit mismatch: Expected ${fdaMed.unit}, but ${unit} provided. Conversion may be required.`
      );
      result.compliant = false;
    }

    // Check dosage range
    if (dosage < fdaMed.minDosage) {
      result.warnings.push(
        `Dosage ${dosage}${unit} is below recommended minimum of ${fdaMed.minDosage}${fdaMed.unit}`
      );
      result.compliant = false;
    }

    if (dosage > fdaMed.maxDosage) {
      result.warnings.push(
        `Dosage ${dosage}${unit} exceeds recommended maximum of ${fdaMed.maxDosage}${fdaMed.unit}`
      );
      result.compliant = false;
    }

    return result;
  }

  /**
   * Add new medication to FDA database
   * 
   * @param {Object} medicationData - Medication data
   */
  addMedication(medicationData) {
    this.approvedMedications.set(
      medicationData.name.toLowerCase(),
      medicationData
    );
  }

  /**
   * Get all approved medications
   * 
   * @returns {Array} List of approved medications
   */
  getAllApprovedMedications() {
    return Array.from(this.approvedMedications.values());
  }
}

/**
 * In-Memory Audit Store
 * Simple in-memory storage for audit logs
 */
class InMemoryAuditStore {
  constructor() {
    this.logs = [];
  }

  /**
   * Store audit entry
   * 
   * @param {Object} entry - Audit entry
   */
  store(entry) {
    this.logs.push(entry);
  }

  /**
   * Query audit logs
   * 
   * @param {Object} filters - Query filters
   * @returns {Array} Filtered logs
   */
  query(filters = {}) {
    let results = [...this.logs];

    if (filters.action) {
      results = results.filter(log => log.action === filters.action);
    }

    if (filters.userId) {
      results = results.filter(log => log.userId === filters.userId);
    }

    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      results = results.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
    }

    if (filters.limit) {
      results = results.slice(-filters.limit);
    }

    return results;
  }

  /**
   * Get all audit logs
   * 
   * @returns {Array} All logs
   */
  getAll() {
    return [...this.logs];
  }

  /**
   * Clear all audit logs
   * 
   * @returns {Number} Number of cleared entries
   */
  clear() {
    const count = this.logs.length;
    this.logs = [];
    return count;
  }

  /**
   * Get audit log statistics
   * 
   * @returns {Object} Statistics
   */
  getStatistics() {
    const stats = {
      totalEntries: this.logs.length,
      actionCounts: {},
      userCounts: {},
      dateRange: null
    };

    for (const log of this.logs) {
      stats.actionCounts[log.action] = (stats.actionCounts[log.action] || 0) + 1;
      stats.userCounts[log.userId] = (stats.userCounts[log.userId] || 0) + 1;
    }

    if (this.logs.length > 0) {
      stats.dateRange = {
        earliest: this.logs[0].timestamp,
        latest: this.logs[this.logs.length - 1].timestamp
      };
    }

    return stats;
  }
}

// Export for use in Node.js or browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedMedicationTracker;
  module.exports.EnhancedMedicationTracker = EnhancedMedicationTracker;
  module.exports.FDADatabaseManager = FDADatabaseManager;
  module.exports.InMemoryAuditStore = InMemoryAuditStore;
}
