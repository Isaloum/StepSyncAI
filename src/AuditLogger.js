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
}

module.exports = { AuditLogger };
