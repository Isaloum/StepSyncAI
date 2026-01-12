/**
 * Enhanced Medication Manager
 * Manages medication database operations with support for separate name/dosage selection
 * Integrates with medications-db.json for comprehensive medication information
 */

const fs = require('fs');
const path = require('path');

class EnhancedMedicationManager {
    constructor(dbPath = 'medications-db.json') {
        this.dbPath = path.join(__dirname, dbPath);
        this.medications = [];
        this.medicationsMap = new Map();
        this.categoriesMap = new Map();
        this.loadDatabase();
    }

    /**
     * Check if running in test environment
     * @returns {boolean} True if in test environment
     */
    isTestEnvironment() {
        return process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test';
    }

    /**
     * Load medication database from JSON file
     */
    loadDatabase() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const rawData = fs.readFileSync(this.dbPath, 'utf8');
                const data = JSON.parse(rawData);
                this.medications = data.medications || [];
                
                // Build index maps for faster lookups
                this.buildIndexes();
                
                return true;
            } else {
                // Don't log error in test environment
                if (!this.isTestEnvironment()) {
                    console.error(`Medication database not found at: ${this.dbPath}`);
                }
                // Initialize with empty data instead of failing
                this.medications = [];
                this.buildIndexes();
                return false;
            }
        } catch (error) {
            // Don't log error in test environment
            if (!this.isTestEnvironment()) {
                console.error('Error loading medication database:', error.message);
            }
            // Initialize with empty data on error
            this.medications = [];
            this.buildIndexes();
            return false;
        }
    }

    /**
     * Build index maps for efficient lookups
     */
    buildIndexes() {
        this.medicationsMap.clear();
        this.categoriesMap.clear();

        // Handle empty medications array safely
        if (this.medications.length === 0) {
            return;
        }

        this.medications.forEach(med => {
            // Index by name (case-insensitive)
            const nameLower = med.name.toLowerCase();
            this.medicationsMap.set(nameLower, med);

            // Index by brand names
            if (med.brandNames && Array.isArray(med.brandNames)) {
                med.brandNames.forEach(brand => {
                    this.medicationsMap.set(brand.toLowerCase(), med);
                });
            }

            // Group by category
            if (med.category) {
                if (!this.categoriesMap.has(med.category)) {
                    this.categoriesMap.set(med.category, []);
                }
                this.categoriesMap.get(med.category).push(med);
            }
        });
    }

    /**
     * Get all medication names (sorted alphabetically)
     * @returns {Array} Array of medication name objects
     */
    getAllMedicationNames() {
        const names = [];
        const seen = new Set();

        this.medications.forEach(med => {
            // Add generic name
            if (!seen.has(med.name.toLowerCase())) {
                names.push({
                    name: med.name,
                    genericName: med.genericName,
                    category: med.category,
                    id: med.id
                });
                seen.add(med.name.toLowerCase());
            }

            // Add brand names
            if (med.brandNames && Array.isArray(med.brandNames)) {
                med.brandNames.forEach(brand => {
                    if (!seen.has(brand.toLowerCase())) {
                        names.push({
                            name: brand,
                            genericName: med.genericName,
                            category: med.category,
                            id: med.id,
                            isBrandName: true
                        });
                        seen.add(brand.toLowerCase());
                    }
                });
            }
        });

        return names.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }

    /**
     * Search medications by name (fuzzy matching)
     * @param {string} query - Search query
     * @param {number} limit - Maximum number of results
     * @returns {Array} Array of matching medications
     */
    searchMedications(query, limit = 10) {
        if (!query || typeof query !== 'string') {
            return [];
        }

        const queryLower = query.toLowerCase().trim();
        const results = [];

        // Exact matches first
        this.medications.forEach(med => {
            const nameLower = med.name.toLowerCase();
            const score = this.calculateMatchScore(queryLower, nameLower);

            if (score > 0) {
                results.push({
                    ...med,
                    matchScore: score,
                    matchedName: med.name
                });
            }

            // Check brand names
            if (med.brandNames && Array.isArray(med.brandNames)) {
                med.brandNames.forEach(brand => {
                    const brandLower = brand.toLowerCase();
                    const brandScore = this.calculateMatchScore(queryLower, brandLower);
                    
                    if (brandScore > 0) {
                        results.push({
                            ...med,
                            matchScore: brandScore,
                            matchedName: brand,
                            isBrandName: true
                        });
                    }
                });
            }
        });

        // Sort by match score (descending) and return top results
        return results
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit);
    }

    /**
     * Calculate match score for fuzzy matching
     * @param {string} query - Search query
     * @param {string} target - Target string
     * @returns {number} Match score (higher is better)
     */
    calculateMatchScore(query, target) {
        if (target === query) return 100; // Exact match
        if (target.startsWith(query)) return 90; // Starts with
        if (target.includes(query)) return 70; // Contains

        // Fuzzy matching (check if all query chars appear in order)
        let qIndex = 0;
        for (let i = 0; i < target.length && qIndex < query.length; i++) {
            if (target[i] === query[qIndex]) {
                qIndex++;
            }
        }
        
        if (qIndex === query.length) {
            return 50; // All chars found in order
        }

        return 0; // No match
    }

    /**
     * Get medication by name (exact or brand name)
     * @param {string} name - Medication name
     * @returns {Object|null} Medication object or null
     */
    getMedicationByName(name) {
        if (!name || typeof name !== 'string') {
            return null;
        }

        const nameLower = name.toLowerCase().trim();
        return this.medicationsMap.get(nameLower) || null;
    }

    /**
     * Get valid dosages for a medication
     * @param {string} medicationName - Medication name
     * @returns {Array} Array of valid dosages
     */
    getValidDosages(medicationName) {
        const medication = this.getMedicationByName(medicationName);
        
        if (!medication || !medication.dosages) {
            return [];
        }

        return medication.dosages.map(dosage => ({
            value: dosage,
            label: dosage
        }));
    }

    /**
     * Validate medication name and dosage combination
     * @param {string} medicationName - Medication name
     * @param {string} dosage - Dosage value
     * @returns {Object} Validation result
     */
    validateMedicationDosage(medicationName, dosage) {
        const medication = this.getMedicationByName(medicationName);

        if (!medication) {
            return {
                valid: false,
                error: 'Medication not found in database',
                medication: null
            };
        }

        if (!dosage || typeof dosage !== 'string') {
            return {
                valid: false,
                error: 'Dosage is required',
                medication: medication
            };
        }

        const dosageTrim = dosage.trim();
        const validDosages = medication.dosages || [];

        if (!validDosages.includes(dosageTrim)) {
            return {
                valid: false,
                error: `Invalid dosage. Valid dosages for ${medication.name}: ${validDosages.join(', ')}`,
                medication: medication,
                validDosages: validDosages
            };
        }

        // Check if dosage exceeds maximum daily dose
        const warnings = [];
        if (medication.maxDailyDose) {
            const dosageNum = parseFloat(dosageTrim);
            const maxNum = parseFloat(medication.maxDailyDose);
            
            if (!isNaN(dosageNum) && !isNaN(maxNum) && dosageNum > maxNum) {
                warnings.push(`Warning: This dosage exceeds the maximum daily dose of ${medication.maxDailyDose}`);
            }
        }

        return {
            valid: true,
            medication: medication,
            dosage: dosageTrim,
            warnings: warnings
        };
    }

    /**
     * Get medications by category
     * @param {string} category - Category name
     * @returns {Array} Array of medications in category
     */
    getMedicationsByCategory(category) {
        return this.categoriesMap.get(category) || [];
    }

    /**
     * Get all categories
     * @returns {Array} Array of category names
     */
    getAllCategories() {
        return Array.from(this.categoriesMap.keys()).sort();
    }

    /**
     * Get complete medication information
     * @param {string} medicationName - Medication name
     * @returns {Object|null} Complete medication details
     */
    getMedicationDetails(medicationName) {
        const medication = this.getMedicationByName(medicationName);
        
        if (!medication) {
            return null;
        }

        return {
            id: medication.id,
            name: medication.name,
            genericName: medication.genericName,
            brandNames: medication.brandNames || [],
            manufacturer: medication.manufacturer,
            category: medication.category,
            dosages: medication.dosages || [],
            forms: medication.forms || [],
            frequency: medication.frequency,
            maxDailyDose: medication.maxDailyDose,
            fdaApprovalDate: medication.fdaApprovalDate,
            pregnancyCategory: medication.pregnancyCategory,
            lactationSafety: medication.lactationSafety,
            rxnormId: medication.rxnormId,
            ndcCodes: medication.ndcCodes || []
        };
    }

    /**
     * Get pregnancy safety information
     * @param {string} medicationName - Medication name
     * @returns {Object|null} Pregnancy safety information
     */
    getPregnancySafety(medicationName) {
        const medication = this.getMedicationByName(medicationName);
        
        if (!medication) {
            return null;
        }

        return {
            medicationName: medication.name,
            pregnancyCategory: medication.pregnancyCategory,
            lactationSafety: medication.lactationSafety,
            warnings: this.getPregnancyWarnings(medication.pregnancyCategory)
        };
    }

    /**
     * Get pregnancy category warnings
     * @param {string} category - Pregnancy category (A, B, C, D, X)
     * @returns {string} Warning message
     */
    getPregnancyWarnings(category) {
        const warnings = {
            'A': 'No risk in controlled human studies.',
            'B': 'No risk in animal studies; human studies inadequate.',
            'C': 'Risk cannot be ruled out. Animal studies show adverse effects.',
            'D': 'Positive evidence of risk. Use only if benefits outweigh risks.',
            'X': 'Contraindicated in pregnancy. Risks clearly outweigh benefits.'
        };

        return warnings[category] || 'Pregnancy safety information not available.';
    }

    /**
     * Get database statistics
     * @returns {Object} Database statistics
     */
    getStatistics() {
        return {
            totalMedications: this.medications.length,
            totalCategories: this.categoriesMap.size,
            categories: Object.fromEntries(
                Array.from(this.categoriesMap.entries()).map(([cat, meds]) => [cat, meds.length])
            )
        };
    }
}

module.exports = EnhancedMedicationManager;
