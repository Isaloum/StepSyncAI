const {
  getMedicationData,
  getMedicationsByPregnancyCategory,
  getMedicationsByLactationSafety,
  getContraindicatedMedications,
  getNDCCodes,
  getPregnancyAlternatives,
  getManufacturers,
  getFDAApprovalDate,
  getWarnings,
  getSafeMedicationsForPregnancyAndLactation,
  generatePregnancySafetyReport,
  searchMedications,
  getMedicationsByCategory,
} = require('../medication-enrichment');

describe('medication-enrichment', () => {
  test('getMedicationData finds by key and by bumpie code', () => {
    const byKey = getMedicationData('sertraline');
    expect(byKey).toBeTruthy();
    expect(byKey.name).toBe('Sertraline');

    const byCode = getMedicationData(byKey.bumpieIntegrationCode);
    expect(byCode).toBeTruthy();
    expect(byCode.name).toBe('Sertraline');
  });

  test('filters by pregnancy and lactation categories', () => {
    const categoryD = getMedicationsByPregnancyCategory('D');
    expect(Array.isArray(categoryD)).toBe(true);
    expect(categoryD.length).toBeGreaterThan(0);
    expect(categoryD.some(m => m.name === 'Paroxetine')).toBe(true);

    const compatible = getMedicationsByLactationSafety('COMPATIBLE');
    expect(Array.isArray(compatible)).toBe(true);
    expect(compatible.length).toBeGreaterThan(0);
    expect(compatible.some(m => typeof m.bumpieCode === 'string')).toBe(true);
  });

  test('contraindicated list includes D and X meds', () => {
    const contraindicated = getContraindicatedMedications();
    expect(Array.isArray(contraindicated)).toBe(true);
    expect(contraindicated.length).toBeGreaterThan(0);
    expect(
      contraindicated.every(m => {
        const cat = String(m.pregnancyCategory || '');
        return cat.includes('D') || cat.includes('X');
      })
    ).toBe(true);
  });

  test('lookup helpers return arrays/values with sane defaults', () => {
    expect(getNDCCodes('sertraline').length).toBeGreaterThan(0);
    expect(Array.isArray(getPregnancyAlternatives('paroxetine'))).toBe(true);
    expect(Array.isArray(getManufacturers('fluoxetine'))).toBe(true);
    expect(getFDAApprovalDate('citalopram')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Array.isArray(getWarnings('lithium'))).toBe(true);

    // Unknown meds should return safe defaults
    expect(getNDCCodes('does-not-exist')).toEqual([]);
    expect(getFDAApprovalDate('does-not-exist')).toBeNull();
  });

  test('safe pregnancy + lactation list and report generation', () => {
    const safe = getSafeMedicationsForPregnancyAndLactation();
    expect(Array.isArray(safe)).toBe(true);

    const report = generatePregnancySafetyReport('sertraline');
    expect(report).toBeTruthy();
    expect(report.bumpieIntegrationReady).toBe(true);
    expect(report.pregnancySafety).toHaveProperty('category');
    expect(report.lactationSafety).toHaveProperty('rating');
  });

  test('search and category grouping return structured results', () => {
    const results = searchMedications('ssri');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    const grouped = getMedicationsByCategory();
    expect(grouped).toBeTruthy();
    expect(typeof grouped).toBe('object');
    expect(Object.keys(grouped).length).toBeGreaterThan(0);
  });
});
