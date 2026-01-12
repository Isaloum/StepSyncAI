/**
 * Medication Database Wrapper
 * Smart medication database with RxNorm API integration, local fallback, and audit logging
 * Created: 2026-01-12 03:36:30 UTC
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

/**
 * MedicationDatabase Class
 * Manages medication lookups with intelligent fallback and comprehensive logging
 */
class MedicationDatabase extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      rxnormApiUrl: options.rxnormApiUrl || 'https://rxnav.nlm.nih.gov/REST',
      localDbPath: options.localDbPath || path.join(__dirname, 'data', 'medications.json'),
      auditLogPath: options.auditLogPath || path.join(__dirname, 'logs', 'medication-audit.log'),
      cacheSize: options.cacheSize || 500,
      cacheTTL: options.cacheTTL || 3600000, // 1 hour
      enableAuditLog: options.enableAuditLog !== false,
      timeout: options.timeout || 5000,
      retryAttempts: options.retryAttempts || 3,
    };

    this.cache = new Map();
    this.localDatabase = new Map();
    this.auditLog = [];
    this.initialized = false;

    this.registerEventListeners();
  }

  /**
   * Initialize the medication database
   */
  async initialize() {
    try {
      await this.loadLocalDatabase();
      this.initialized = true;
      this.logAudit('INIT', 'Database initialized successfully', { status: 'success' });
      this.emit('initialized');
      return true;
    } catch (error) {
      this.logAudit('INIT_ERROR', 'Failed to initialize database', { error: error.message });
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Load local medication database from file
   */
  async loadLocalDatabase() {
    try {
      const data = await fs.readFile(this.options.localDbPath, 'utf8');
      const medications = JSON.parse(data);
      
      medications.forEach(med => {
        this.localDatabase.set(med.rxcui?.toString().toLowerCase(), med);
        if (med.name) {
          this.localDatabase.set(med.name.toLowerCase(), med);
        }
      });

      this.logAudit('LOAD_LOCAL_DB', 'Local database loaded', {
        medicationCount: medications.length,
      });
    } catch (error) {
      // Local database file might not exist, which is acceptable
      this.logAudit('LOAD_LOCAL_DB', 'Local database file not found or invalid', {
        path: this.options.localDbPath,
      });
    }
  }

  /**
   * Parse medication name and dosage
   * @param {string} medicationString - Medication name and dosage (e.g., "Metformin 500mg")
   * @returns {object} Parsed medication details
   */
  parseMedicationString(medicationString) {
    if (!medicationString || typeof medicationString !== 'string') {
      return null;
    }

    const cleanString = medicationString.trim();
    
    // Extract dosage pattern: number + unit (mg, mcg, ml, %, g, etc.)
    const dosagePattern = /(\d+(?:\.\d+)?)\s*(mg|mcg|µg|ml|l|%|g|gr|cc|unit|units|mm|meq|mmol)?/i;
    const dosageMatch = cleanString.match(dosagePattern);

    // Extract frequency pattern: e.g., "twice daily", "3x per day"
    const frequencyPattern = /(\d+\s*x|once|twice|thrice|daily|bid|tid|qid|every\s+\d+\s+hours)/i;
    const frequencyMatch = cleanString.match(frequencyPattern);

    // Extract route pattern: oral, IV, IM, topical, etc.
    const routePattern = /\b(oral|po|iv|im|sc|sublingual|sl|topical|transdermal|inhaled|intranasal|rectal|pr)\b/i;
    const routeMatch = cleanString.match(routePattern);

    // Extract medication name (remove dosage and other modifiers)
    let medName = cleanString;
    if (dosageMatch) medName = medName.replace(dosageMatch[0], '').trim();
    if (frequencyMatch) medName = medName.replace(frequencyMatch[0], '').trim();
    if (routeMatch) medName = medName.replace(routeMatch[0], '').trim();

    return {
      originalString: medicationString,
      name: medName || cleanString,
      dosage: dosageMatch ? {
        value: parseFloat(dosageMatch[1]),
        unit: (dosageMatch[2] || 'mg').toLowerCase(),
      } : null,
      frequency: frequencyMatch ? frequencyMatch[0].toLowerCase() : null,
      route: routeMatch ? routeMatch[1].toLowerCase() : 'oral',
      parsed: true,
    };
  }

  /**
   * Query RxNorm API for medication information
   * @param {string} query - Medication name or search term
   * @returns {object} RxNorm API response
   */
  async queryRxNormAPI(query) {
    try {
      const response = await axios.get(
        `${this.options.rxnormApiUrl}/drugs.json`,
        {
          params: { name: query },
          timeout: this.options.timeout,
        }
      );

      return response.data;
    } catch (error) {
      this.logAudit('RXNORM_API_ERROR', 'RxNorm API query failed', {
        query,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get RxNorm properties for a medication
   * @param {string} rxcui - RxNorm CUUI identifier
   * @returns {object} Medication properties
   */
  async getRxNormProperties(rxcui) {
    try {
      const response = await axios.get(
        `${this.options.rxnormApiUrl}/rxcui/${rxcui}/properties.json`,
        { timeout: this.options.timeout }
      );

      return response.data;
    } catch (error) {
      this.logAudit('RXNORM_PROPS_ERROR', 'Failed to fetch RxNorm properties', {
        rxcui,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Search for medication with retry logic
   * @param {string} medicationName - Medication name to search
   * @param {object} options - Search options
   * @returns {object} Medication information
   */
  async searchMedication(medicationName, options = {}) {
    if (!medicationName) {
      return null;
    }

    const searchKey = medicationName.toLowerCase();
    const startTime = Date.now();

    // Check cache first
    if (this.cache.has(searchKey)) {
      const cached = this.cache.get(searchKey);
      if (Date.now() - cached.timestamp < this.options.cacheTTL) {
        this.logAudit('CACHE_HIT', 'Medication found in cache', {
          medication: medicationName,
          responseTime: Date.now() - startTime,
        });
        return cached.data;
      }
    }

    // Try local database
    if (this.localDatabase.has(searchKey)) {
      const localResult = this.localDatabase.get(searchKey);
      this.cacheMedication(searchKey, localResult);
      this.logAudit('LOCAL_DB_HIT', 'Medication found in local database', {
        medication: medicationName,
        responseTime: Date.now() - startTime,
      });
      return localResult;
    }

    // Try RxNorm API with retry logic
    let lastError;
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        const result = await this.queryRxNormAPI(medicationName);
        
        if (result && result.drugGroup && result.drugGroup.conceptGroup) {
          const medication = this.formatRxNormResult(result);
          this.cacheMedication(searchKey, medication);
          
          this.logAudit('API_HIT', 'Medication found via RxNorm API', {
            medication: medicationName,
            responseTime: Date.now() - startTime,
            attempt,
          });

          return medication;
        }
      } catch (error) {
        lastError = error;
        if (attempt < this.options.retryAttempts) {
          await this.delay(Math.pow(2, attempt - 1) * 100); // Exponential backoff
        }
      }
    }

    // All methods failed
    this.logAudit('SEARCH_FAILED', 'Medication not found in any source', {
      medication: medicationName,
      responseTime: Date.now() - startTime,
      lastError: lastError?.message,
    });

    return null;
  }

  /**
   * Format RxNorm API result
   * @param {object} apiResult - Raw API response
   * @returns {object} Formatted medication object
   */
  formatRxNormResult(apiResult) {
    const conceptGroup = apiResult.drugGroup.conceptGroup[0];
    const concepts = conceptGroup.conceptProperties || [];
    
    if (concepts.length === 0) {
      return null;
    }

    const primary = concepts[0];

    return {
      rxcui: primary.rxcui,
      name: primary.name,
      tty: primary.tty,
      source: 'rxnorm',
      allConcepts: concepts.map(c => ({
        rxcui: c.rxcui,
        name: c.name,
        tty: c.tty,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed medication information
   * @param {string} medication - Medication identifier or name
   * @returns {object} Detailed medication information
   */
  async getMedicationDetails(medication) {
    const startTime = Date.now();

    // Parse the medication string if provided
    const parsed = this.parseMedicationString(medication);
    const medName = parsed ? parsed.name : medication;

    try {
      let medicationData = await this.searchMedication(medName);

      if (!medicationData) {
        this.logAudit('DETAILS_NOT_FOUND', 'Medication details not found', {
          medication: medName,
          responseTime: Date.now() - startTime,
        });
        return null;
      }

      // Enhance with parsed information if available
      if (parsed && parsed.dosage) {
        medicationData.parsedDosage = parsed.dosage;
        medicationData.parsedFrequency = parsed.frequency;
        medicationData.parsedRoute = parsed.route;
      }

      this.logAudit('DETAILS_RETRIEVED', 'Medication details retrieved', {
        medication: medName,
        rxcui: medicationData.rxcui,
        responseTime: Date.now() - startTime,
      });

      return medicationData;
    } catch (error) {
      this.logAudit('DETAILS_ERROR', 'Error retrieving medication details', {
        medication: medName,
        error: error.message,
        responseTime: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Validate medication
   * @param {string} medicationName - Medication to validate
   * @returns {boolean} Whether medication is valid
   */
  async validateMedication(medicationName) {
    try {
      const result = await this.searchMedication(medicationName);
      const isValid = result !== null;

      this.logAudit('VALIDATION', 'Medication validation completed', {
        medication: medicationName,
        valid: isValid,
      });

      return isValid;
    } catch (error) {
      this.logAudit('VALIDATION_ERROR', 'Error validating medication', {
        medication: medicationName,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Batch search medications
   * @param {array} medications - Array of medication names
   * @returns {array} Array of medication results
   */
  async batchSearchMedications(medications) {
    if (!Array.isArray(medications)) {
      return [];
    }

    const startTime = Date.now();
    const results = [];

    for (const med of medications) {
      try {
        const result = await this.searchMedication(med);
        results.push({
          input: med,
          found: result !== null,
          data: result,
        });
      } catch (error) {
        results.push({
          input: med,
          found: false,
          error: error.message,
        });
      }
    }

    this.logAudit('BATCH_SEARCH', 'Batch medication search completed', {
      totalRequested: medications.length,
      found: results.filter(r => r.found).length,
      responseTime: Date.now() - startTime,
    });

    return results;
  }

  /**
   * Cache a medication result
   * @param {string} key - Cache key
   * @param {object} data - Medication data
   */
  cacheMedication(key, data) {
    if (this.cache.size >= this.options.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear the medication cache
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    this.logAudit('CACHE_CLEARED', 'Cache cleared', { itemsCleared: size });
  }

  /**
   * Log audit entry
   * @param {string} action - Action type
   * @param {string} description - Description
   * @param {object} metadata - Additional metadata
   */
  logAudit(action, description, metadata = {}) {
    if (!this.options.enableAuditLog) {
      return;
    }

    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      description,
      userId: metadata.userId || 'system',
      metadata,
      hash: this.generateAuditHash(action, description, metadata),
    };

    this.auditLog.push(auditEntry);
    this.emit('audit', auditEntry);

    // Keep audit log in memory limited
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  /**
   * Generate audit hash for integrity verification
   * @param {string} action - Action type
   * @param {string} description - Description
   * @param {object} metadata - Metadata
   * @returns {string} Hash
   */
  generateAuditHash(action, description, metadata) {
    const data = `${action}:${description}:${JSON.stringify(metadata)}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get audit log entries
   * @param {object} filters - Filter options
   * @returns {array} Filtered audit log
   */
  getAuditLog(filters = {}) {
    let log = this.auditLog;

    if (filters.action) {
      log = log.filter(entry => entry.action === filters.action);
    }

    if (filters.startDate) {
      log = log.filter(entry => new Date(entry.timestamp) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      log = log.filter(entry => new Date(entry.timestamp) <= new Date(filters.endDate));
    }

    if (filters.limit) {
      log = log.slice(-filters.limit);
    }

    return log;
  }

  /**
   * Export audit log to file
   * @returns {boolean} Success status
   */
  async exportAuditLog() {
    try {
      const dir = path.dirname(this.options.auditLogPath);
      await fs.mkdir(dir, { recursive: true });

      const logContent = this.auditLog
        .map(entry => JSON.stringify(entry))
        .join('\n');

      await fs.writeFile(this.options.auditLogPath, logContent, 'utf8');
      this.logAudit('AUDIT_EXPORTED', 'Audit log exported to file', {
        filePath: this.options.auditLogPath,
        entries: this.auditLog.length,
      });

      return true;
    } catch (error) {
      console.error('Failed to export audit log:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.options.cacheSize,
      utilization: `${Math.round((this.cache.size / this.options.cacheSize) * 100)}%`,
      ttl: this.options.cacheTTL,
    };
  }

  /**
   * Get database statistics
   * @returns {object} Database stats
   */
  getStats() {
    return {
      initialized: this.initialized,
      cache: this.getCacheStats(),
      localDatabase: {
        medicationCount: this.localDatabase.size,
      },
      auditLog: {
        entries: this.auditLog.length,
        enabled: this.options.enableAuditLog,
      },
    };
  }

  /**
   * Register event listeners
   */
  registerEventListeners() {
    this.on('audit', (entry) => {
      // Emit specific action events
      this.emit(`audit:${entry.action}`, entry);
    });
  }

  /**
   * Helper: Delay function for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {promise} Resolved promise after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Shutdown the database
   */
  async shutdown() {
    try {
      await this.exportAuditLog();
      this.cache.clear();
      this.localDatabase.clear();
      this.logAudit('SHUTDOWN', 'Database shutdown successfully', {});
      this.removeAllListeners();
      this.initialized = false;
      return true;
    } catch (error) {
      console.error('Error during shutdown:', error);
      return false;
    }
  }
}

/**
 * Factory function to create medication database instance
 * @param {object} options - Configuration options
 * @returns {MedicationDatabase} Database instance
 */
async function createMedicationDatabase(options = {}) {
  const db = new MedicationDatabase(options);
  await db.initialize();
  return db;
}

// Export
module.exports = MedicationDatabase;
module.exports.createMedicationDatabase = createMedicationDatabase;
