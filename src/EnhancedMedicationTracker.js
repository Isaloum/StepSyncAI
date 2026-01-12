/**
 * Enhanced Medication Tracking System for MindTrackAI
 * Comprehensive medication management with scheduling, adherence tracking, and analysis
 */

// Medication class representing individual medications
class Medication {
    constructor({
        id,
        name,
        genericName,
        dosage,
        unit,
        frequency,
        route,
        prescribedBy,
        startDate,
        endDate = null,
        instructions = '',
        sideEffects = [],
        contraindications = [],
        interactions = []
    }) {
        this.id = id || this.generateId();
        this.name = name;
        this.genericName = genericName;
        this.dosage = dosage;
        this.unit = unit; // mg, ml, pills, etc.
        this.frequency = frequency; // times per day
        this.route = route; // oral, injection, topical, etc.
        this.prescribedBy = prescribedBy;
        this.startDate = new Date(startDate);
        this.endDate = endDate ? new Date(endDate) : null;
        this.instructions = instructions;
        this.sideEffects = sideEffects;
        this.contraindications = contraindications;
        this.interactions = interactions;
        this.isActive = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    generateId() {
        return 'med_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    update(updates) {
        Object.keys(updates).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = updates[key];
            }
        });
        this.updatedAt = new Date();
    }

    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    getDailyDosage() {
        return this.dosage * this.frequency;
    }

    isCurrentlyPrescribed() {
        const now = new Date();
        return this.isActive && 
               this.startDate <= now && 
               (!this.endDate || this.endDate >= now);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            genericName: this.genericName,
            dosage: this.dosage,
            unit: this.unit,
            frequency: this.frequency,
            route: this.route,
            prescribedBy: this.prescribedBy,
            startDate: this.startDate,
            endDate: this.endDate,
            instructions: this.instructions,
            sideEffects: this.sideEffects,
            contraindications: this.contraindications,
            interactions: this.interactions,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

// Medication schedule for tracking doses
class MedicationSchedule {
    constructor(medicationId, times = []) {
        this.medicationId = medicationId;
        this.times = times; // Array of time strings like ["08:00", "20:00"]
        this.scheduledDoses = [];
        this.completedDoses = [];
        this.missedDoses = [];
    }

    addScheduledTime(time) {
        if (!this.times.includes(time)) {
            this.times.push(time);
            this.times.sort();
        }
    }

    removeScheduledTime(time) {
        this.times = this.times.filter(t => t !== time);
    }

    generateDailySchedule(date = new Date()) {
        const dateStr = date.toDateString();
        this.times.forEach(time => {
            const [hours, minutes] = time.split(':');
            const scheduledTime = new Date(date);
            scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const dose = {
                id: this.generateDoseId(),
                medicationId: this.medicationId,
                scheduledTime: scheduledTime,
                actualTime: null,
                status: 'scheduled', // scheduled, taken, missed, skipped
                notes: '',
                sideEffectsReported: []
            };
            
            this.scheduledDoses.push(dose);
        });
    }

    generateDoseId() {
        return 'dose_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    markDoseTaken(doseId, actualTime = new Date(), notes = '', sideEffects = []) {
        const dose = this.scheduledDoses.find(d => d.id === doseId);
        if (dose) {
            dose.status = 'taken';
            dose.actualTime = actualTime;
            dose.notes = notes;
            dose.sideEffectsReported = sideEffects;
            this.completedDoses.push(dose);
        }
    }

    markDoseMissed(doseId, reason = '') {
        const dose = this.scheduledDoses.find(d => d.id === doseId);
        if (dose) {
            dose.status = 'missed';
            dose.notes = reason;
            this.missedDoses.push(dose);
        }
    }

    getUpcomingDoses(hours = 24) {
        const now = new Date();
        const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
        
        return this.scheduledDoses.filter(dose => 
            dose.status === 'scheduled' && 
            dose.scheduledTime > now && 
            dose.scheduledTime <= futureTime
        );
    }

    getOverdueDoses() {
        const now = new Date();
        return this.scheduledDoses.filter(dose => 
            dose.status === 'scheduled' && 
            dose.scheduledTime < now
        );
    }
}

// Side effect tracking
class SideEffectTracker {
    constructor() {
        this.reports = [];
        this.commonSideEffects = new Map();
    }

    reportSideEffect({
        medicationId,
        effect,
        severity, // 1-10 scale
        duration,
        timestamp = new Date(),
        notes = ''
    }) {
        const report = {
            id: this.generateReportId(),
            medicationId,
            effect,
            severity,
            duration,
            timestamp,
            notes
        };

        this.reports.push(report);
        this.updateCommonSideEffects(effect);
        return report.id;
    }

    generateReportId() {
        return 'side_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    updateCommonSideEffects(effect) {
        if (this.commonSideEffects.has(effect)) {
            this.commonSideEffects.set(effect, this.commonSideEffects.get(effect) + 1);
        } else {
            this.commonSideEffects.set(effect, 1);
        }
    }

    getSideEffectsForMedication(medicationId) {
        return this.reports.filter(report => report.medicationId === medicationId);
    }

    getSevereSideEffects(minSeverity = 7) {
        return this.reports.filter(report => report.severity >= minSeverity);
    }

    getRecentSideEffects(hours = 24) {
        const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
        return this.reports.filter(report => report.timestamp > cutoff);
    }

    getMostCommonSideEffects(limit = 10) {
        return Array.from(this.commonSideEffects.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
    }
}

// Adherence analysis
class AdherenceAnalyzer {
    constructor() {
        this.adherenceHistory = [];
    }

    calculateAdherenceRate(medicationId, days = 30) {
        const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
        
        // This would integrate with MedicationSchedule to get actual data
        // For now, we'll simulate the calculation structure
        const totalScheduledDoses = this.getTotalScheduledDoses(medicationId, cutoff);
        const takenDoses = this.getTakenDoses(medicationId, cutoff);
        
        if (totalScheduledDoses === 0) return 100;
        
        return (takenDoses / totalScheduledDoses) * 100;
    }

    getTotalScheduledDoses(medicationId, since) {
        // Implementation would query actual scheduled doses
        return 0;
    }

    getTakenDoses(medicationId, since) {
        // Implementation would query actual taken doses
        return 0;
    }

    getAdherencePattern(medicationId, days = 30) {
        // Returns daily adherence pattern
        const pattern = [];
        const now = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dayAdherence = this.calculateDayAdherence(medicationId, date);
            pattern.unshift({
                date: date.toDateString(),
                adherence: dayAdherence,
                status: dayAdherence >= 80 ? 'good' : dayAdherence >= 60 ? 'fair' : 'poor'
            });
        }
        
        return pattern;
    }

    calculateDayAdherence(medicationId, date) {
        // Calculate adherence for specific day
        return Math.random() * 100; // Placeholder
    }

    identifyAdherenceIssues(medicationId) {
        const issues = [];
        const adherenceRate = this.calculateAdherenceRate(medicationId);
        
        if (adherenceRate < 80) {
            issues.push({
                type: 'low_adherence',
                severity: adherenceRate < 50 ? 'high' : 'medium',
                description: `Adherence rate is ${adherenceRate.toFixed(1)}%`,
                recommendations: this.getAdherenceRecommendations(adherenceRate)
            });
        }
        
        return issues;
    }

    getAdherenceRecommendations(rate) {
        if (rate < 50) {
            return [
                'Consider setting more frequent reminders',
                'Discuss dosing schedule with healthcare provider',
                'Use a pill organizer',
                'Identify and address barriers to taking medication'
            ];
        } else if (rate < 80) {
            return [
                'Set consistent daily reminders',
                'Link medication taking to daily routines',
                'Track progress with a medication diary'
            ];
        }
        return ['Continue current adherence practices'];
    }
}

// Drug interaction checker
class InteractionChecker {
    constructor() {
        this.knownInteractions = new Map();
        this.initializeInteractionDatabase();
    }

    initializeInteractionDatabase() {
        // Initialize with common drug interactions
        // This would typically be loaded from a comprehensive drug database
        this.knownInteractions.set('warfarin', [
            'aspirin', 'ibuprofen', 'naproxen', 'cimetidine'
        ]);
        this.knownInteractions.set('lithium', [
            'hydrochlorothiazide', 'lisinopril', 'ibuprofen'
        ]);
        // Add more interactions...
    }

    checkInteractions(medications) {
        const interactions = [];
        const medicationNames = medications.map(med => 
            med.genericName ? med.genericName.toLowerCase() : med.name.toLowerCase()
        );

        for (let i = 0; i < medicationNames.length; i++) {
            for (let j = i + 1; j < medicationNames.length; j++) {
                const interaction = this.findInteraction(medicationNames[i], medicationNames[j]);
                if (interaction) {
                    interactions.push(interaction);
                }
            }
        }

        return interactions;
    }

    findInteraction(drug1, drug2) {
        if (this.knownInteractions.has(drug1) && 
            this.knownInteractions.get(drug1).includes(drug2)) {
            return {
                drug1,
                drug2,
                severity: 'moderate', // would be determined by actual interaction
                description: `Potential interaction between ${drug1} and ${drug2}`,
                recommendation: 'Consult healthcare provider'
            };
        }
        
        if (this.knownInteractions.has(drug2) && 
            this.knownInteractions.get(drug2).includes(drug1)) {
            return {
                drug1: drug2,
                drug2: drug1,
                severity: 'moderate',
                description: `Potential interaction between ${drug2} and ${drug1}`,
                recommendation: 'Consult healthcare provider'
            };
        }

        return null;
    }

    addInteraction(drug1, drug2, details) {
        if (!this.knownInteractions.has(drug1)) {
            this.knownInteractions.set(drug1, []);
        }
        this.knownInteractions.get(drug1).push(drug2);
    }
}

// Main Enhanced Medication Tracker class
class EnhancedMedicationTracker {
    constructor() {
        this.medications = new Map();
        this.schedules = new Map();
        this.sideEffectTracker = new SideEffectTracker();
        this.adherenceAnalyzer = new AdherenceAnalyzer();
        this.interactionChecker = new InteractionChecker();
        this.reminders = [];
        this.notifications = [];
    }

    // Medication management
    addMedication(medicationData) {
        const medication = new Medication(medicationData);
        this.medications.set(medication.id, medication);
        
        // Check for interactions with existing medications
        this.checkNewMedicationInteractions(medication);
        
        return medication.id;
    }

    updateMedication(medicationId, updates) {
        const medication = this.medications.get(medicationId);
        if (medication) {
            medication.update(updates);
            return true;
        }
        return false;
    }

    removeMedication(medicationId) {
        const medication = this.medications.get(medicationId);
        if (medication) {
            medication.deactivate();
            return true;
        }
        return false;
    }

    getMedication(medicationId) {
        return this.medications.get(medicationId);
    }

    getAllMedications() {
        return Array.from(this.medications.values());
    }

    getActiveMedications() {
        return Array.from(this.medications.values())
            .filter(med => med.isCurrentlyPrescribed());
    }

    // Schedule management
    createSchedule(medicationId, times) {
        const schedule = new MedicationSchedule(medicationId, times);
        this.schedules.set(medicationId, schedule);
        return schedule;
    }

    updateSchedule(medicationId, times) {
        const schedule = this.schedules.get(medicationId);
        if (schedule) {
            schedule.times = times;
            return true;
        }
        return false;
    }

    recordDoseTaken(medicationId, doseId, actualTime, notes, sideEffects) {
        const schedule = this.schedules.get(medicationId);
        if (schedule) {
            schedule.markDoseTaken(doseId, actualTime, notes, sideEffects);
            
            // Record side effects if any
            if (sideEffects && sideEffects.length > 0) {
                sideEffects.forEach(effect => {
                    this.sideEffectTracker.reportSideEffect({
                        medicationId,
                        effect: effect.name,
                        severity: effect.severity,
                        duration: effect.duration,
                        notes: effect.notes
                    });
                });
            }
            
            return true;
        }
        return false;
    }

    recordDoseMissed(medicationId, doseId, reason) {
        const schedule = this.schedules.get(medicationId);
        if (schedule) {
            schedule.markDoseMissed(doseId, reason);
            return true;
        }
        return false;
    }

    // Analysis and reporting
    getAdherenceReport(medicationId, days = 30) {
        return {
            medicationId,
            adherenceRate: this.adherenceAnalyzer.calculateAdherenceRate(medicationId, days),
            pattern: this.adherenceAnalyzer.getAdherencePattern(medicationId, days),
            issues: this.adherenceAnalyzer.identifyAdherenceIssues(medicationId)
        };
    }

    getSideEffectReport(medicationId) {
        return {
            medicationId,
            allSideEffects: this.sideEffectTracker.getSideEffectsForMedication(medicationId),
            severeSideEffects: this.sideEffectTracker.getSevereSideEffects(),
            recentSideEffects: this.sideEffectTracker.getRecentSideEffects(),
            commonSideEffects: this.sideEffectTracker.getMostCommonSideEffects()
        };
    }

    getInteractionReport() {
        const activeMedications = this.getActiveMedications();
        return this.interactionChecker.checkInteractions(activeMedications);
    }

    // Notifications and reminders
    getUpcomingDoses(hours = 24) {
        const upcomingDoses = [];
        
        this.schedules.forEach((schedule, medicationId) => {
            const medication = this.medications.get(medicationId);
            if (medication && medication.isCurrentlyPrescribed()) {
                const doses = schedule.getUpcomingDoses(hours);
                doses.forEach(dose => {
                    upcomingDoses.push({
                        ...dose,
                        medicationName: medication.name,
                        dosage: medication.dosage,
                        unit: medication.unit
                    });
                });
            }
        });

        return upcomingDoses.sort((a, b) => a.scheduledTime - b.scheduledTime);
    }

    getOverdueDoses() {
        const overdueDoses = [];
        
        this.schedules.forEach((schedule, medicationId) => {
            const medication = this.medications.get(medicationId);
            if (medication && medication.isCurrentlyPrescribed()) {
                const doses = schedule.getOverdueDoses();
                doses.forEach(dose => {
                    overdueDoses.push({
                        ...dose,
                        medicationName: medication.name,
                        dosage: medication.dosage,
                        unit: medication.unit
                    });
                });
            }
        });

        return overdueDoses.sort((a, b) => b.scheduledTime - a.scheduledTime);
    }

    // Utility methods
    checkNewMedicationInteractions(newMedication) {
        const activeMedications = this.getActiveMedications();
        activeMedications.push(newMedication);
        
        const interactions = this.interactionChecker.checkInteractions(activeMedications);
        
        if (interactions.length > 0) {
            this.notifications.push({
                type: 'interaction_warning',
                message: `Potential interactions detected with ${newMedication.name}`,
                interactions,
                timestamp: new Date(),
                priority: 'high'
            });
        }
    }

    exportData() {
        return {
            medications: Array.from(this.medications.values()).map(med => med.toJSON()),
            schedules: Array.from(this.schedules.entries()),
            sideEffects: this.sideEffectTracker.reports,
            notifications: this.notifications,
            exportedAt: new Date()
        };
    }

    importData(data) {
        // Import medications
        if (data.medications) {
            data.medications.forEach(medData => {
                const medication = new Medication(medData);
                this.medications.set(medication.id, medication);
            });
        }

        // Import schedules
        if (data.schedules) {
            data.schedules.forEach(([medicationId, scheduleData]) => {
                const schedule = new MedicationSchedule(medicationId, scheduleData.times);
                Object.assign(schedule, scheduleData);
                this.schedules.set(medicationId, schedule);
            });
        }

        // Import side effects
        if (data.sideEffects) {
            this.sideEffectTracker.reports = data.sideEffects;
        }

        return true;
    }

    // Health insights
    getHealthInsights() {
        const activeMedications = this.getActiveMedications();
        const insights = [];

        // Adherence insights
        activeMedications.forEach(med => {
            const adherenceRate = this.adherenceAnalyzer.calculateAdherenceRate(med.id);
            if (adherenceRate < 80) {
                insights.push({
                    type: 'adherence_concern',
                    medication: med.name,
                    value: adherenceRate,
                    message: `Adherence for ${med.name} is ${adherenceRate.toFixed(1)}%`
                });
            }
        });

        // Side effect insights
        const recentSideEffects = this.sideEffectTracker.getRecentSideEffects(48);
        if (recentSideEffects.length > 0) {
            insights.push({
                type: 'recent_side_effects',
                count: recentSideEffects.length,
                message: `${recentSideEffects.length} side effects reported in last 48 hours`
            });
        }

        // Interaction insights
        const interactions = this.getInteractionReport();
        if (interactions.length > 0) {
            insights.push({
                type: 'drug_interactions',
                count: interactions.length,
                message: `${interactions.length} potential drug interactions detected`
            });
        }

        return insights;
    }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EnhancedMedicationTracker,
        Medication,
        MedicationSchedule,
        SideEffectTracker,
        AdherenceAnalyzer,
        InteractionChecker
    };
}

// For browser environments
if (typeof window !== 'undefined') {
    window.EnhancedMedicationTracker = EnhancedMedicationTracker;
    window.Medication = Medication;
    window.MedicationSchedule = MedicationSchedule;
    window.SideEffectTracker = SideEffectTracker;
    window.AdherenceAnalyzer = AdherenceAnalyzer;
    window.InteractionChecker = InteractionChecker;
}