/**
 * Enhanced Medication Tracker Class
 * Provides comprehensive medication management functionality for mental health tracking
 * 
 * @author MindTrackAI Team
 * @version 2.0.0
 * @created 2026-01-12
 */

class EnhancedMedicationTracker {
    constructor(options = {}) {
        this.medications = new Map();
        this.schedules = new Map();
        this.adherenceHistory = new Map();
        this.sideEffectsLog = new Map();
        this.interactions = new Set();
        this.reminders = new Map();
        this.analytics = {
            adherenceRates: {},
            sideEffectTrends: {},
            effectivenessScores: {}
        };
        
        // Configuration options
        this.config = {
            reminderOffset: options.reminderOffset || 30, // minutes before dose
            adherenceThreshold: options.adherenceThreshold || 0.8, // 80%
            maxMissedDoses: options.maxMissedDoses || 3,
            enableNotifications: options.enableNotifications !== false,
            autoBackup: options.autoBackup !== false,
            ...options
        };
        
        // Event handlers
        this.eventHandlers = new Map();
        
        // Initialize storage and load existing data
        this.initializeStorage();
        this.loadData();
        
        console.log('EnhancedMedicationTracker initialized successfully');
    }

    /**
     * Initialize local storage for data persistence
     */
    initializeStorage() {
        if (typeof localStorage !== 'undefined') {
            this.storageKey = 'mindtrack_medications';
            this.backupKey = 'mindtrack_medications_backup';
        }
    }

    /**
     * Add a new medication to the tracking system
     */
    addMedication(medicationData) {
        try {
            const medication = {
                id: medicationData.id || this.generateId(),
                name: medicationData.name,
                genericName: medicationData.genericName,
                dosage: medicationData.dosage,
                unit: medicationData.unit || 'mg',
                form: medicationData.form || 'tablet', // tablet, capsule, liquid, etc.
                frequency: medicationData.frequency, // times per day
                schedule: medicationData.schedule || [], // specific times
                startDate: new Date(medicationData.startDate),
                endDate: medicationData.endDate ? new Date(medicationData.endDate) : null,
                prescribedBy: medicationData.prescribedBy,
                purpose: medicationData.purpose,
                instructions: medicationData.instructions || '',
                sideEffects: medicationData.knownSideEffects || [],
                contraindications: medicationData.contraindications || [],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Validate medication data
            this.validateMedicationData(medication);
            
            // Check for potential interactions
            this.checkInteractions(medication);
            
            // Store medication
            this.medications.set(medication.id, medication);
            
            // Set up schedule
            this.setupMedicationSchedule(medication);
            
            // Initialize adherence tracking
            this.adherenceHistory.set(medication.id, {
                doses: [],
                missed: [],
                totalScheduled: 0,
                totalTaken: 0,
                adherenceRate: 0
            });
            
            // Initialize side effects log
            this.sideEffectsLog.set(medication.id, []);
            
            // Save to storage
            this.saveData();
            
            // Emit event
            this.emit('medicationAdded', medication);
            
            console.log(`Medication "${medication.name}" added successfully`);
            return medication;
            
        } catch (error) {
            console.error('Error adding medication:', error);
            throw new Error(`Failed to add medication: ${error.message}`);
        }
    }

    /**
     * Update an existing medication
     */
    updateMedication(medicationId, updates) {
        try {
            const medication = this.medications.get(medicationId);
            if (!medication) {
                throw new Error(`Medication with ID ${medicationId} not found`);
            }

            // Create updated medication object
            const updatedMedication = {
                ...medication,
                ...updates,
                id: medicationId, // Ensure ID doesn't change
                updatedAt: new Date()
            };

            // Validate updated data
            this.validateMedicationData(updatedMedication);
            
            // Check for new interactions if medication changed
            if (updates.name || updates.genericName) {
                this.checkInteractions(updatedMedication);
            }
            
            // Update schedule if timing changed
            if (updates.schedule || updates.frequency) {
                this.updateMedicationSchedule(medicationId, updatedMedication);
            }
            
            // Store updated medication
            this.medications.set(medicationId, updatedMedication);
            
            // Save to storage
            this.saveData();
            
            // Emit event
            this.emit('medicationUpdated', updatedMedication);
            
            console.log(`Medication "${updatedMedication.name}" updated successfully`);
            return updatedMedication;
            
        } catch (error) {
            console.error('Error updating medication:', error);
            throw new Error(`Failed to update medication: ${error.message}`);
        }
    }

    /**
     * Remove a medication from tracking
     */
    removeMedication(medicationId, reason = 'User requested') {
        try {
            const medication = this.medications.get(medicationId);
            if (!medication) {
                throw new Error(`Medication with ID ${medicationId} not found`);
            }

            // Mark as inactive instead of deleting (for historical data)
            medication.isActive = false;
            medication.discontinuedAt = new Date();
            medication.discontinuationReason = reason;
            
            // Clear active reminders
            this.clearReminders(medicationId);
            
            // Update storage
            this.saveData();
            
            // Emit event
            this.emit('medicationRemoved', { medication, reason });
            
            console.log(`Medication "${medication.name}" removed: ${reason}`);
            return true;
            
        } catch (error) {
            console.error('Error removing medication:', error);
            throw new Error(`Failed to remove medication: ${error.message}`);
        }
    }

    /**
     * Record taking a dose
     */
    recordDose(medicationId, timestamp = new Date(), notes = '') {
        try {
            const medication = this.medications.get(medicationId);
            if (!medication) {
                throw new Error(`Medication with ID ${medicationId} not found`);
            }

            const doseRecord = {
                id: this.generateId(),
                medicationId,
                timestamp: new Date(timestamp),
                notes,
                wasScheduled: this.wasScheduledDose(medicationId, timestamp),
                createdAt: new Date()
            };

            // Update adherence history
            const adherence = this.adherenceHistory.get(medicationId);
            adherence.doses.push(doseRecord);
            adherence.totalTaken++;
            
            // Recalculate adherence rate
            this.updateAdherenceRate(medicationId);
            
            // Clear any active reminders for this dose
            this.clearDoseReminder(medicationId, timestamp);
            
            // Save to storage
            this.saveData();
            
            // Emit event
            this.emit('doseRecorded', doseRecord);
            
            console.log(`Dose recorded for "${medication.name}" at ${timestamp}`);
            return doseRecord;
            
        } catch (error) {
            console.error('Error recording dose:', error);
            throw new Error(`Failed to record dose: ${error.message}`);
        }
    }

    /**
     * Record a missed dose
     */
    recordMissedDose(medicationId, scheduledTime, reason = '') {
        try {
            const medication = this.medications.get(medicationId);
            if (!medication) {
                throw new Error(`Medication with ID ${medicationId} not found`);
            }

            const missedRecord = {
                id: this.generateId(),
                medicationId,
                scheduledTime: new Date(scheduledTime),
                missedAt: new Date(),
                reason,
                createdAt: new Date()
            };

            // Update adherence history
            const adherence = this.adherenceHistory.get(medicationId);
            adherence.missed.push(missedRecord);
            
            // Update total scheduled doses
            adherence.totalScheduled++;
            
            // Recalculate adherence rate
            this.updateAdherenceRate(medicationId);
            
            // Check if this triggers any alerts
            this.checkMissedDoseAlerts(medicationId);
            
            // Save to storage
            this.saveData();
            
            // Emit event
            this.emit('doseMissed', missedRecord);
            
            console.log(`Missed dose recorded for "${medication.name}"`);
            return missedRecord;
            
        } catch (error) {
            console.error('Error recording missed dose:', error);
            throw new Error(`Failed to record missed dose: ${error.message}`);
        }
    }

    /**
     * Record side effects
     */
    recordSideEffect(medicationId, sideEffectData) {
        try {
            const medication = this.medications.get(medicationId);
            if (!medication) {
                throw new Error(`Medication with ID ${medicationId} not found`);
            }

            const sideEffectRecord = {
                id: this.generateId(),
                medicationId,
                effect: sideEffectData.effect,
                severity: sideEffectData.severity, // mild, moderate, severe
                onset: new Date(sideEffectData.onset || Date.now()),
                duration: sideEffectData.duration, // minutes
                notes: sideEffectData.notes || '',
                reportedAt: new Date()
            };

            // Add to side effects log
            const log = this.sideEffectsLog.get(medicationId);
            log.push(sideEffectRecord);
            
            // Update analytics
            this.updateSideEffectTrends(medicationId, sideEffectRecord);
            
            // Check if this requires immediate attention
            if (sideEffectRecord.severity === 'severe') {
                this.emit('severeSideEffect', sideEffectRecord);
            }
            
            // Save to storage
            this.saveData();
            
            // Emit event
            this.emit('sideEffectRecorded', sideEffectRecord);
            
            console.log(`Side effect recorded for "${medication.name}": ${sideEffectData.effect}`);
            return sideEffectRecord;
            
        } catch (error) {
            console.error('Error recording side effect:', error);
            throw new Error(`Failed to record side effect: ${error.message}`);
        }
    }

    /**
     * Get comprehensive medication report
     */
    getMedicationReport(medicationId) {
        try {
            const medication = this.medications.get(medicationId);
            if (!medication) {
                throw new Error(`Medication with ID ${medicationId} not found`);
            }

            const adherence = this.adherenceHistory.get(medicationId);
            const sideEffects = this.sideEffectsLog.get(medicationId);
            const schedule = this.schedules.get(medicationId);

            return {
                medication,
                adherence: {
                    ...adherence,
                    recentDoses: adherence.doses.slice(-10), // Last 10 doses
                    recentMissed: adherence.missed.slice(-5) // Last 5 missed doses
                },
                sideEffects: {
                    total: sideEffects.length,
                    recent: sideEffects.filter(se => 
                        (Date.now() - se.reportedAt.getTime()) < (7 * 24 * 60 * 60 * 1000) // Last 7 days
                    ),
                    bySeverity: this.groupSideEffectsBySeverity(sideEffects)
                },
                schedule: schedule,
                upcomingDoses: this.getUpcomingDoses(medicationId, 3), // Next 3 doses
                analytics: this.getMedicationAnalytics(medicationId),
                interactions: this.getMedicationInteractions(medicationId)
            };
            
        } catch (error) {
            console.error('Error generating medication report:', error);
            throw new Error(`Failed to generate report: ${error.message}`);
        }
    }

    /**
     * Get overall tracking summary
     */
    getTrackingSummary() {
        const activeMedications = Array.from(this.medications.values()).filter(med => med.isActive);
        const totalAdherence = this.calculateOverallAdherence();
        const recentSideEffects = this.getRecentSideEffects(7); // Last 7 days
        const upcomingDoses = this.getAllUpcomingDoses(24); // Next 24 hours
        
        return {
            activeMedications: activeMedications.length,
            totalMedications: this.medications.size,
            overallAdherenceRate: totalAdherence,
            recentSideEffects: recentSideEffects.length,
            upcomingDoses: upcomingDoses.length,
            activeInteractions: this.interactions.size,
            summary: {
                medications: activeMedications.map(med => ({
                    id: med.id,
                    name: med.name,
                    dosage: med.dosage,
                    unit: med.unit,
                    adherenceRate: this.adherenceHistory.get(med.id)?.adherenceRate || 0
                })),
                nextDose: upcomingDoses[0] || null,
                alerts: this.getActiveAlerts()
            }
        };
    }

    /**
     * Setup medication schedule and reminders
     */
    setupMedicationSchedule(medication) {
        const schedule = {
            medicationId: medication.id,
            times: medication.schedule,
            frequency: medication.frequency,
            reminders: [],
            nextDose: null
        };

        // Calculate next dose time
        schedule.nextDose = this.calculateNextDose(medication);
        
        // Set up reminders if enabled
        if (this.config.enableNotifications) {
            this.setupReminders(medication.id, schedule);
        }
        
        this.schedules.set(medication.id, schedule);
    }

    /**
     * Check for drug interactions
     */
    checkInteractions(newMedication) {
        const activeMedications = Array.from(this.medications.values())
            .filter(med => med.isActive && med.id !== newMedication.id);
            
        for (const medication of activeMedications) {
            const interaction = this.detectInteraction(newMedication, medication);
            if (interaction) {
                this.interactions.add(interaction);
                this.emit('interactionDetected', interaction);
            }
        }
    }

    /**
     * Calculate adherence rate for a medication
     */
    updateAdherenceRate(medicationId) {
        const adherence = this.adherenceHistory.get(medicationId);
        if (!adherence) return 0;
        
        const totalScheduled = adherence.totalScheduled;
        const totalTaken = adherence.totalTaken;
        
        if (totalScheduled === 0) {
            adherence.adherenceRate = 0;
        } else {
            adherence.adherenceRate = Math.round((totalTaken / totalScheduled) * 100) / 100;
        }
        
        return adherence.adherenceRate;
    }

    /**
     * Export tracking data
     */
    exportData(format = 'json') {
        const data = {
            medications: Array.from(this.medications.entries()),
            adherenceHistory: Array.from(this.adherenceHistory.entries()),
            sideEffectsLog: Array.from(this.sideEffectsLog.entries()),
            schedules: Array.from(this.schedules.entries()),
            interactions: Array.from(this.interactions),
            analytics: this.analytics,
            exportedAt: new Date(),
            version: '2.0.0'
        };

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Import tracking data
     */
    importData(data, options = {}) {
        try {
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            
            if (options.merge) {
                // Merge with existing data
                this.mergeImportedData(parsedData);
            } else {
                // Replace existing data
                this.replaceWithImportedData(parsedData);
            }
            
            this.saveData();
            this.emit('dataImported', { recordCount: this.medications.size });
            
        } catch (error) {
            console.error('Error importing data:', error);
            throw new Error(`Failed to import data: ${error.message}`);
        }
    }

    /**
     * Event handling system
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    emit(event, data) {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }

    /**
     * Data persistence methods
     */
    saveData() {
        if (typeof localStorage !== 'undefined') {
            try {
                const data = {
                    medications: Array.from(this.medications.entries()),
                    adherenceHistory: Array.from(this.adherenceHistory.entries()),
                    sideEffectsLog: Array.from(this.sideEffectsLog.entries()),
                    schedules: Array.from(this.schedules.entries()),
                    interactions: Array.from(this.interactions),
                    analytics: this.analytics,
                    savedAt: new Date()
                };
                
                localStorage.setItem(this.storageKey, JSON.stringify(data));
                
                // Create backup if auto-backup is enabled
                if (this.config.autoBackup) {
                    localStorage.setItem(this.backupKey, JSON.stringify(data));
                }
                
            } catch (error) {
                console.error('Error saving data:', error);
            }
        }
    }

    loadData() {
        if (typeof localStorage !== 'undefined') {
            try {
                const savedData = localStorage.getItem(this.storageKey);
                if (savedData) {
                    const data = JSON.parse(savedData);
                    
                    this.medications = new Map(data.medications || []);
                    this.adherenceHistory = new Map(data.adherenceHistory || []);
                    this.sideEffectsLog = new Map(data.sideEffectsLog || []);
                    this.schedules = new Map(data.schedules || []);
                    this.interactions = new Set(data.interactions || []);
                    this.analytics = data.analytics || this.analytics;
                    
                    // Restore reminders for active medications
                    this.restoreReminders();
                }
            } catch (error) {
                console.error('Error loading data:', error);
                this.loadBackupData();
            }
        }
    }

    // Utility methods
    generateId() {
        return 'med_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    validateMedicationData(medication) {
        const required = ['name', 'dosage', 'frequency'];
        for (const field of required) {
            if (!medication[field]) {
                throw new Error(`Required field missing: ${field}`);
            }
        }
        
        if (medication.frequency <= 0) {
            throw new Error('Frequency must be greater than 0');
        }
        
        if (medication.dosage <= 0) {
            throw new Error('Dosage must be greater than 0');
        }
    }

    calculateNextDose(medication) {
        if (!medication.schedule || medication.schedule.length === 0) {
            return null;
        }
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Find next scheduled time today or tomorrow
        for (const timeStr of medication.schedule) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const scheduleTime = new Date(today);
            scheduleTime.setHours(hours, minutes, 0, 0);
            
            if (scheduleTime > now) {
                return scheduleTime;
            }
        }
        
        // No more doses today, get first dose tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [hours, minutes] = medication.schedule[0].split(':').map(Number);
        tomorrow.setHours(hours, minutes, 0, 0);
        
        return tomorrow;
    }

    wasScheduledDose(medicationId, timestamp) {
        const schedule = this.schedules.get(medicationId);
        if (!schedule) return false;
        
        const doseTime = new Date(timestamp);
        const timeStr = `${doseTime.getHours()}:${doseTime.getMinutes().toString().padStart(2, '0')}`;
        
        return schedule.times.includes(timeStr);
    }

    setupReminders(medicationId, schedule) {
        // Implementation for setting up medication reminders
        // This would integrate with the system's notification API
        console.log(`Setting up reminders for medication ${medicationId}`);
    }

    clearReminders(medicationId) {
        // Implementation for clearing medication reminders
        console.log(`Clearing reminders for medication ${medicationId}`);
    }

    detectInteraction(med1, med2) {
        // Simplified interaction detection
        // In a real implementation, this would check against a comprehensive drug interaction database
        const commonInteractions = [
            { drugs: ['warfarin', 'aspirin'], severity: 'major', description: 'Increased bleeding risk' },
            { drugs: ['lithium', 'ibuprofen'], severity: 'moderate', description: 'Increased lithium levels' }
        ];
        
        for (const interaction of commonInteractions) {
            if (interaction.drugs.includes(med1.name.toLowerCase()) && 
                interaction.drugs.includes(med2.name.toLowerCase())) {
                return {
                    id: this.generateId(),
                    medication1: med1.id,
                    medication2: med2.id,
                    severity: interaction.severity,
                    description: interaction.description,
                    detectedAt: new Date()
                };
            }
        }
        
        return null;
    }

    getActiveAlerts() {
        const alerts = [];
        
        // Check for missed doses
        for (const [medId, adherence] of this.adherenceHistory) {
            if (adherence.missed.length > this.config.maxMissedDoses) {
                alerts.push({
                    type: 'adherence',
                    severity: 'warning',
                    message: `Multiple missed doses for ${this.medications.get(medId)?.name}`,
                    medicationId: medId
                });
            }
        }
        
        // Check for severe side effects
        for (const [medId, sideEffects] of this.sideEffectsLog) {
            const recentSevere = sideEffects.filter(se => 
                se.severity === 'severe' && 
                (Date.now() - se.reportedAt.getTime()) < (24 * 60 * 60 * 1000)
            );
            
            if (recentSevere.length > 0) {
                alerts.push({
                    type: 'sideEffect',
                    severity: 'critical',
                    message: `Severe side effects reported for ${this.medications.get(medId)?.name}`,
                    medicationId: medId
                });
            }
        }
        
        // Check for interactions
        if (this.interactions.size > 0) {
            alerts.push({
                type: 'interaction',
                severity: 'warning',
                message: `${this.interactions.size} potential drug interactions detected`,
                count: this.interactions.size
            });
        }
        
        return alerts;
    }

    // Additional helper methods would be implemented here...
    calculateOverallAdherence() {
        const rates = Array.from(this.adherenceHistory.values())
            .map(ah => ah.adherenceRate)
            .filter(rate => rate > 0);
            
        if (rates.length === 0) return 0;
        
        return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    }

    getRecentSideEffects(days) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const recent = [];
        
        for (const sideEffects of this.sideEffectsLog.values()) {
            recent.push(...sideEffects.filter(se => se.reportedAt.getTime() > cutoff));
        }
        
        return recent;
    }

    getAllUpcomingDoses(hours) {
        const upcoming = [];
        const cutoff = Date.now() + (hours * 60 * 60 * 1000);
        
        for (const [medId, schedule] of this.schedules) {
            if (schedule.nextDose && schedule.nextDose.getTime() <= cutoff) {
                const medication = this.medications.get(medId);
                upcoming.push({
                    medicationId: medId,
                    medicationName: medication?.name,
                    scheduledTime: schedule.nextDose,
                    dosage: medication?.dosage,
                    unit: medication?.unit
                });
            }
        }
        
        return upcoming.sort((a, b) => a.scheduledTime - b.scheduledTime);
    }
}

export default EnhancedMedicationTracker;