/**
 * Medication Validator
 * Validates medication name/dosage combinations and provides safety checks
 */

const EnhancedMedicationManager = require('./enhanced-medication-manager');

class MedicationValidator {
    constructor() {
        this.medicationManager = new EnhancedMedicationManager();
    }

    /**
     * Validate a medication entry
     * @param {string} medicationName - Medication name
     * @param {string} dosage - Dosage value
     * @param {Object} options - Validation options
     * @returns {Object} Validation result with errors and warnings
     */
    validate(medicationName, dosage, options = {}) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            info: {},
            medication: null
        };

        // Validate medication name
        if (!medicationName || typeof medicationName !== 'string' || medicationName.trim() === '') {
            result.valid = false;
            result.errors.push('Medication name is required');
            return result;
        }

        // Check if medication exists in database
        const medication = this.medicationManager.getMedicationByName(medicationName.trim());
        
        if (!medication) {
            result.valid = false;
            result.errors.push(`Medication "${medicationName}" not found in database`);
            
            // Suggest similar medications
            const suggestions = this.medicationManager.searchMedications(medicationName.trim(), 5);
            if (suggestions.length > 0) {
                result.info.suggestions = suggestions.map(s => s.matchedName);
            }
            
            return result;
        }

        result.medication = medication;

        // Validate dosage
        if (!dosage || typeof dosage !== 'string' || dosage.trim() === '') {
            result.valid = false;
            result.errors.push('Dosage is required');
            return result;
        }

        const dosageTrim = dosage.trim();
        const validDosages = medication.dosages || [];

        if (!validDosages.includes(dosageTrim)) {
            result.valid = false;
            result.errors.push(`Invalid dosage "${dosageTrim}" for ${medication.name}`);
            result.info.validDosages = validDosages;
            return result;
        }

        // Check dosage warnings
        this.checkDosageWarnings(medication, dosageTrim, result);

        // Check pregnancy safety if requested
        if (options.checkPregnancy) {
            this.checkPregnancySafety(medication, result);
        }

        // Add medication info
        result.info.category = medication.category;
        result.info.manufacturer = medication.manufacturer;
        result.info.frequency = medication.frequency;
        result.info.forms = medication.forms;

        return result;
    }

    /**
     * Check dosage warnings
     * @param {Object} medication - Medication object
     * @param {string} dosage - Dosage value
     * @param {Object} result - Result object to update
     */
    checkDosageWarnings(medication, dosage, result) {
        if (!medication.maxDailyDose) {
            return;
        }

        // Extract numeric value from dosage
        const dosageNum = parseFloat(dosage);
        const maxNum = parseFloat(medication.maxDailyDose);

        if (isNaN(dosageNum) || isNaN(maxNum)) {
            return;
        }

        // Check if single dose exceeds maximum daily dose
        if (dosageNum > maxNum) {
            result.warnings.push({
                type: 'HIGH_DOSAGE',
                message: `⚠️ Warning: ${dosage} exceeds the maximum daily dose of ${medication.maxDailyDose}`,
                severity: 'HIGH'
            });
        }
        // Check if dosage is unusually high (> 80% of max daily dose)
        else if (dosageNum > (maxNum * 0.8)) {
            result.warnings.push({
                type: 'HIGH_DOSAGE',
                message: `⚠️ Note: ${dosage} is a high dosage (max daily: ${medication.maxDailyDose})`,
                severity: 'MEDIUM'
            });
        }

        // Check if dosage is unusually low (< 20% of typical lowest dosage)
        const lowestDosage = Math.min(...medication.dosages.map(d => parseFloat(d)).filter(n => !isNaN(n)));
        if (dosageNum < (lowestDosage * 0.5)) {
            result.warnings.push({
                type: 'LOW_DOSAGE',
                message: `ℹ️ Note: ${dosage} is a low dosage for ${medication.name}`,
                severity: 'LOW'
            });
        }
    }

    /**
     * Check pregnancy safety
     * @param {Object} medication - Medication object
     * @param {Object} result - Result object to update
     */
    checkPregnancySafety(medication, result) {
        if (!medication.pregnancyCategory) {
            return;
        }

        const category = medication.pregnancyCategory;
        const safetyInfo = this.medicationManager.getPregnancySafety(medication.name);

        if (category === 'D' || category === 'X') {
            result.warnings.push({
                type: 'PREGNANCY_RISK',
                message: `⚠️ PREGNANCY WARNING: Category ${category} - ${safetyInfo.warnings}`,
                severity: 'HIGH',
                category: category
            });
        } else if (category === 'C') {
            result.warnings.push({
                type: 'PREGNANCY_RISK',
                message: `⚠️ Pregnancy Category ${category} - ${safetyInfo.warnings}`,
                severity: 'MEDIUM',
                category: category
            });
        }

        // Lactation safety warnings
        if (medication.lactationSafety === 'Caution') {
            result.warnings.push({
                type: 'LACTATION_RISK',
                message: `ℹ️ Use with caution during lactation`,
                severity: 'MEDIUM'
            });
        } else if (medication.lactationSafety === 'Unknown') {
            result.warnings.push({
                type: 'LACTATION_RISK',
                message: `ℹ️ Lactation safety unknown - consult healthcare provider`,
                severity: 'LOW'
            });
        }
    }

    /**
     * Validate multiple medications (for duplicate checking)
     * @param {Array} medications - Array of medication objects {name, dosage}
     * @returns {Object} Validation result
     */
    validateMultiple(medications) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            duplicates: []
        };

        if (!Array.isArray(medications)) {
            result.valid = false;
            result.errors.push('Medications must be an array');
            return result;
        }

        // Check for duplicates
        const seen = new Map();
        
        medications.forEach((med, index) => {
            const key = `${med.name?.toLowerCase()}:${med.dosage?.toLowerCase()}`;
            
            if (seen.has(key)) {
                result.valid = false;
                result.duplicates.push({
                    medication: med.name,
                    dosage: med.dosage,
                    indices: [seen.get(key), index]
                });
                result.errors.push(`Duplicate medication: ${med.name} ${med.dosage}`);
            } else {
                seen.set(key, index);
            }
        });

        return result;
    }

    /**
     * Check for drug interactions
     * @param {string} newMedicationName - New medication to add
     * @param {Array} existingMedications - Array of existing medication names
     * @returns {Object} Interaction check result
     */
    checkInteractions(newMedicationName, existingMedications = []) {
        // This is a placeholder for interaction checking
        // In a full implementation, this would integrate with the medication-interactions.json
        const result = {
            hasInteractions: false,
            interactions: [],
            warnings: []
        };

        // Basic category-based warnings
        const newMed = this.medicationManager.getMedicationByName(newMedicationName);
        
        if (!newMed) {
            return result;
        }

        existingMedications.forEach(existingName => {
            const existing = this.medicationManager.getMedicationByName(existingName);
            
            if (!existing) {
                return;
            }

            // Warn about multiple medications from same category
            if (newMed.category === existing.category) {
                result.hasInteractions = true;
                result.warnings.push({
                    type: 'SAME_CATEGORY',
                    message: `⚠️ Both ${newMed.name} and ${existing.name} are ${newMed.category} medications. Consult your doctor.`,
                    severity: 'MEDIUM',
                    medications: [newMed.name, existing.name]
                });
            }

            // Special warnings for specific categories
            if (['Benzodiazepine', 'Opioid'].includes(newMed.category) && 
                ['Benzodiazepine', 'Opioid'].includes(existing.category)) {
                result.hasInteractions = true;
                result.warnings.push({
                    type: 'HIGH_RISK_COMBINATION',
                    message: `🔴 HIGH RISK: Combining ${newMed.category} with ${existing.category}. Consult doctor immediately.`,
                    severity: 'HIGH',
                    medications: [newMed.name, existing.name]
                });
            }
        });

        return result;
    }

    /**
     * Get validation summary
     * @param {Object} validationResult - Result from validate()
     * @returns {string} Human-readable summary
     */
    getSummary(validationResult) {
        if (!validationResult.valid) {
            return `❌ Validation failed: ${validationResult.errors.join(', ')}`;
        }

        const parts = ['✓ Valid medication/dosage combination'];

        if (validationResult.warnings.length > 0) {
            parts.push(`\n${validationResult.warnings.length} warning(s):`);
            validationResult.warnings.forEach(w => {
                parts.push(`  ${w.message}`);
            });
        }

        if (validationResult.medication) {
            parts.push(`\nMedication: ${validationResult.medication.name} (${validationResult.medication.genericName})`);
            parts.push(`Category: ${validationResult.medication.category}`);
        }

        return parts.join('\n');
    }
}

module.exports = MedicationValidator;
