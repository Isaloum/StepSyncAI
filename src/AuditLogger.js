/**
 * Audit Logger
 * Provides audit logging functionality for tracking changes and actions
 * 
 * @version 1.0.0
 * @author MindTrackAI
 * @date 2026-01-12
 */

class AuditLogger {
  constructor() {
    this.logs = [];
  }
  
  log(entry) {
    this.logs.push({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString()
    });
  }
  
  getLogs() {
    return this.logs;
  }
  
  clear() {
    this.logs = [];
  }
 * Audit Logger - Stub for Testing
 * Logs actions for audit trail
 */

class AuditLogger {
    constructor() {
        this.logs = [];
    }

    /**
     * Log an action
     * @param {Object} entry - Log entry
     */
    log(entry) {
        this.logs.push({
            ...entry,
            timestamp: entry.timestamp || new Date().toISOString()
        });
    }

    /**
     * Get all logs
     * @returns {Array} All log entries
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
    }

    /**
     * Get logs for a specific action
     * @param {string} action - Action name
     * @returns {Array} Filtered logs
     */
    getLogsByAction(action) {
        return this.logs.filter(log => log.action === action);
    }
}

module.exports = { AuditLogger };
