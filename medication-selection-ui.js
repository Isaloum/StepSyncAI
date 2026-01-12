/**
 * Medication Selection UI
 * Frontend logic for enhanced medication selection with autocomplete and dynamic dosage
 */

class MedicationSelectionUI {
    constructor(options = {}) {
        this.options = {
            medicationInputId: options.medicationInputId || 'medication-name',
            dosageSelectId: options.dosageSelectId || 'medication-dosage',
            categoryFilterId: options.categoryFilterId || 'medication-category',
            searchResultsId: options.searchResultsId || 'medication-search-results',
            validationMessageId: options.validationMessageId || 'medication-validation',
            onMedicationSelect: options.onMedicationSelect || null,
            onDosageSelect: options.onDosageSelect || null,
            debounceMs: options.debounceMs || 300
        };

        this.medicationManager = null;
        this.selectedMedication = null;
        this.debounceTimer = null;

        this.init();
    }

    /**
     * Initialize the UI components
     */
    init() {
        this.setupEventListeners();
        this.loadCategories();
    }

    /**
     * Set the medication manager (injected from backend)
     * @param {Object} manager - EnhancedMedicationManager instance
     */
    setMedicationManager(manager) {
        this.medicationManager = manager;
        this.loadCategories();
    }

    /**
     * Set medication data (for browser-only mode)
     * @param {Array} medications - Array of medication objects
     */
    setMedicationData(medications) {
        this.medications = medications || [];
        this.buildIndexes();
    }

    /**
     * Build indexes for browser-side search
     */
    buildIndexes() {
        this.medicationsMap = new Map();
        this.categoriesMap = new Map();

        this.medications.forEach(med => {
            const nameLower = med.name.toLowerCase();
            this.medicationsMap.set(nameLower, med);

            if (med.brandNames && Array.isArray(med.brandNames)) {
                med.brandNames.forEach(brand => {
                    this.medicationsMap.set(brand.toLowerCase(), med);
                });
            }

            if (med.category) {
                if (!this.categoriesMap.has(med.category)) {
                    this.categoriesMap.set(med.category, []);
                }
                this.categoriesMap.get(med.category).push(med);
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Medication name input - autocomplete
        const medInput = document.getElementById(this.options.medicationInputId);
        if (medInput) {
            medInput.addEventListener('input', (e) => this.handleMedicationInput(e));
            medInput.addEventListener('focus', (e) => this.handleMedicationFocus(e));
            medInput.addEventListener('blur', (e) => this.handleMedicationBlur(e));
        }

        // Dosage select
        const dosageSelect = document.getElementById(this.options.dosageSelectId);
        if (dosageSelect) {
            dosageSelect.addEventListener('change', (e) => this.handleDosageChange(e));
        }

        // Category filter
        const categoryFilter = document.getElementById(this.options.categoryFilterId);
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.handleCategoryFilter(e));
        }

        // Click outside to close search results
        document.addEventListener('click', (e) => {
            const searchResults = document.getElementById(this.options.searchResultsId);
            const medInput = document.getElementById(this.options.medicationInputId);
            
            if (searchResults && medInput && 
                !searchResults.contains(e.target) && 
                e.target !== medInput) {
                this.hideSearchResults();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }

    /**
     * Handle medication input (autocomplete)
     * @param {Event} event - Input event
     */
    handleMedicationInput(event) {
        const query = event.target.value.trim();

        // Clear previous debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Debounce search
        this.debounceTimer = setTimeout(() => {
            if (query.length >= 2) {
                this.searchMedications(query);
            } else {
                this.hideSearchResults();
            }
        }, this.options.debounceMs);
    }

    /**
     * Handle medication input focus
     * @param {Event} event - Focus event
     */
    handleMedicationFocus(event) {
        const query = event.target.value.trim();
        if (query.length >= 2) {
            this.searchMedications(query);
        }
    }

    /**
     * Handle medication input blur (delayed to allow click on results)
     * @param {Event} event - Blur event
     */
    handleMedicationBlur(event) {
        setTimeout(() => {
            // Only hide if not clicking on search results
            const activeElement = document.activeElement;
            const searchResults = document.getElementById(this.options.searchResultsId);
            
            if (!searchResults || !searchResults.contains(activeElement)) {
                this.hideSearchResults();
            }
        }, 200);
    }

    /**
     * Search medications
     * @param {string} query - Search query
     */
    searchMedications(query) {
        const results = this.performSearch(query);
        this.displaySearchResults(results);
    }

    /**
     * Perform medication search
     * @param {string} query - Search query
     * @returns {Array} Search results
     */
    performSearch(query) {
        if (!this.medications || this.medications.length === 0) {
            return [];
        }

        const queryLower = query.toLowerCase();
        const results = [];

        this.medications.forEach(med => {
            const nameLower = med.name.toLowerCase();
            let score = 0;

            // Exact match
            if (nameLower === queryLower) {
                score = 100;
            }
            // Starts with
            else if (nameLower.startsWith(queryLower)) {
                score = 90;
            }
            // Contains
            else if (nameLower.includes(queryLower)) {
                score = 70;
            }

            // Check brand names
            if (med.brandNames && Array.isArray(med.brandNames)) {
                med.brandNames.forEach(brand => {
                    const brandLower = brand.toLowerCase();
                    let brandScore = 0;

                    if (brandLower === queryLower) brandScore = 100;
                    else if (brandLower.startsWith(queryLower)) brandScore = 90;
                    else if (brandLower.includes(queryLower)) brandScore = 70;

                    if (brandScore > score) {
                        score = brandScore;
                    }
                });
            }

            if (score > 0) {
                results.push({ ...med, matchScore: score });
            }
        });

        return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
    }

    /**
     * Display search results
     * @param {Array} results - Search results
     */
    displaySearchResults(results) {
        const container = document.getElementById(this.options.searchResultsId);
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = '<div class="search-result-item no-results">No medications found</div>';
            container.style.display = 'block';
            return;
        }

        container.innerHTML = '';
        
        results.forEach(med => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.setAttribute('data-med-id', med.id);
            item.setAttribute('data-med-name', med.name);
            item.setAttribute('tabindex', '0');
            
            item.innerHTML = `
                <div class="med-name">${this.highlightMatch(med.name, this.getCurrentQuery())}</div>
                <div class="med-info">
                    <span class="med-category">${med.category}</span>
                    ${med.brandNames && med.brandNames.length > 0 ? 
                        `<span class="med-brands">${med.brandNames.join(', ')}</span>` : 
                        ''}
                </div>
            `;

            item.addEventListener('click', () => this.selectMedication(med));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.selectMedication(med);
                }
            });

            container.appendChild(item);
        });

        container.style.display = 'block';
    }

    /**
     * Highlight search match in text
     * @param {string} text - Text to highlight
     * @param {string} query - Search query
     * @returns {string} HTML with highlighted match
     */
    highlightMatch(text, query) {
        if (!query) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    /**
     * Get current search query
     * @returns {string} Current query
     */
    getCurrentQuery() {
        const medInput = document.getElementById(this.options.medicationInputId);
        return medInput ? medInput.value.trim() : '';
    }

    /**
     * Hide search results
     */
    hideSearchResults() {
        const container = document.getElementById(this.options.searchResultsId);
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    }

    /**
     * Select a medication
     * @param {Object} medication - Selected medication
     */
    selectMedication(medication) {
        this.selectedMedication = medication;

        // Update input field
        const medInput = document.getElementById(this.options.medicationInputId);
        if (medInput) {
            medInput.value = medication.name;
        }

        // Hide search results
        this.hideSearchResults();

        // Load dosages
        this.loadDosages(medication);

        // Call callback if provided
        if (typeof this.options.onMedicationSelect === 'function') {
            this.options.onMedicationSelect(medication);
        }

        // Clear validation messages
        this.clearValidation();
    }

    /**
     * Load dosages for selected medication
     * @param {Object} medication - Medication object
     */
    loadDosages(medication) {
        const dosageSelect = document.getElementById(this.options.dosageSelectId);
        if (!dosageSelect) return;

        // Clear existing options
        dosageSelect.innerHTML = '<option value="">Select dosage...</option>';

        // Add dosage options
        if (medication.dosages && Array.isArray(medication.dosages)) {
            medication.dosages.forEach(dosage => {
                const option = document.createElement('option');
                option.value = dosage;
                option.textContent = dosage;
                dosageSelect.appendChild(option);
            });

            // Enable select
            dosageSelect.disabled = false;
        } else {
            dosageSelect.disabled = true;
        }
    }

    /**
     * Handle dosage change
     * @param {Event} event - Change event
     */
    handleDosageChange(event) {
        const dosage = event.target.value;

        if (dosage && this.selectedMedication) {
            this.validateSelection(this.selectedMedication, dosage);

            // Call callback if provided
            if (typeof this.options.onDosageSelect === 'function') {
                this.options.onDosageSelect(dosage, this.selectedMedication);
            }
        }
    }

    /**
     * Validate medication and dosage selection
     * @param {Object} medication - Medication object
     * @param {string} dosage - Dosage value
     */
    validateSelection(medication, dosage) {
        // This would call the backend validator in a real implementation
        // For now, just basic validation
        const isValid = medication.dosages && medication.dosages.includes(dosage);

        if (isValid) {
            this.showValidation('success', `✓ Valid: ${medication.name} ${dosage}`);
        } else {
            this.showValidation('error', `✗ Invalid dosage for ${medication.name}`);
        }
    }

    /**
     * Show validation message
     * @param {string} type - Message type (success, error, warning)
     * @param {string} message - Message text
     */
    showValidation(type, message) {
        const container = document.getElementById(this.options.validationMessageId);
        if (!container) return;

        container.className = `validation-message ${type}`;
        container.textContent = message;
        container.style.display = 'block';
    }

    /**
     * Clear validation message
     */
    clearValidation() {
        const container = document.getElementById(this.options.validationMessageId);
        if (container) {
            container.style.display = 'none';
            container.textContent = '';
        }
    }

    /**
     * Handle category filter
     * @param {Event} event - Change event
     */
    handleCategoryFilter(event) {
        const category = event.target.value;

        if (category === '') {
            // Show all medications
            this.searchMedications('');
        } else {
            // Filter by category
            const filtered = this.medications.filter(m => m.category === category);
            this.displaySearchResults(filtered);
        }
    }

    /**
     * Load categories into filter dropdown
     */
    loadCategories() {
        const categoryFilter = document.getElementById(this.options.categoryFilterId);
        if (!categoryFilter || !this.medications) return;

        // Get unique categories
        const categories = new Set();
        this.medications.forEach(med => {
            if (med.category) {
                categories.add(med.category);
            }
        });

        // Clear existing options
        categoryFilter.innerHTML = '<option value="">All Categories</option>';

        // Add category options
        Array.from(categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    /**
     * Handle keyboard navigation
     * @param {Event} event - Keyboard event
     */
    handleKeyboardNavigation(event) {
        const searchResults = document.getElementById(this.options.searchResultsId);
        if (!searchResults || searchResults.style.display === 'none') return;

        const items = searchResults.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        const currentFocus = document.activeElement;
        let currentIndex = -1;

        items.forEach((item, index) => {
            if (item === currentFocus) {
                currentIndex = index;
            }
        });

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            items[nextIndex].focus();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            items[prevIndex].focus();
        } else if (event.key === 'Escape') {
            this.hideSearchResults();
            const medInput = document.getElementById(this.options.medicationInputId);
            if (medInput) medInput.focus();
        }
    }

    /**
     * Get selected medication and dosage
     * @returns {Object|null} Selected medication with dosage
     */
    getSelection() {
        const dosageSelect = document.getElementById(this.options.dosageSelectId);
        
        if (!this.selectedMedication || !dosageSelect || !dosageSelect.value) {
            return null;
        }

        return {
            medication: this.selectedMedication,
            dosage: dosageSelect.value
        };
    }

    /**
     * Reset the form
     */
    reset() {
        const medInput = document.getElementById(this.options.medicationInputId);
        const dosageSelect = document.getElementById(this.options.dosageSelectId);

        if (medInput) medInput.value = '';
        if (dosageSelect) {
            dosageSelect.innerHTML = '<option value="">Select dosage...</option>';
            dosageSelect.disabled = true;
        }

        this.selectedMedication = null;
        this.hideSearchResults();
        this.clearValidation();
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicationSelectionUI;
}
