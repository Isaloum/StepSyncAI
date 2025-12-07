const ValidationUtils = require('../validation-utils');
const fs = require('fs');
const path = require('path');

describe('ValidationUtils', () => {
    let consoleErrorSpy;
    let consoleLogSpy;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    });

    describe('parseInteger', () => {
        test('parses valid integer', () => {
            const result = ValidationUtils.parseInteger('42', { fieldName: 'test' });
            expect(result).toBe(42);
        });

        test('parses negative integer', () => {
            const result = ValidationUtils.parseInteger('-10', { min: -100, fieldName: 'test' });
            expect(result).toBe(-10);
        });

        test('returns null for invalid input', () => {
            const result = ValidationUtils.parseInteger('abc', { fieldName: 'test' });
            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid test: "abc" is not a valid number');
        });

        test('returns default value for empty string', () => {
            const result = ValidationUtils.parseInteger('', { default: 5, fieldName: 'test' });
            expect(result).toBe(5);
        });

        test('rejects value below minimum', () => {
            const result = ValidationUtils.parseInteger('5', { min: 10, fieldName: 'test' });
            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid test: 5 is below minimum allowed value (10)');
        });

        test('rejects value above maximum', () => {
            const result = ValidationUtils.parseInteger('100', { max: 50, fieldName: 'test' });
            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid test: 100 exceeds maximum allowed value (50)');
        });

        test('accepts value at boundary', () => {
            const result = ValidationUtils.parseInteger('10', { min: 10, max: 10, fieldName: 'test' });
            expect(result).toBe(10);
        });
    });

    describe('parseFloat', () => {
        test('parses valid float', () => {
            const result = ValidationUtils.parseFloat('3.14', { fieldName: 'test' });
            expect(result).toBe(3.14);
        });

        test('parses integer as float', () => {
            const result = ValidationUtils.parseFloat('42', { fieldName: 'test' });
            expect(result).toBe(42);
        });

        test('returns null for invalid input', () => {
            const result = ValidationUtils.parseFloat('not-a-number', { fieldName: 'test' });
            expect(result).toBeNull();
        });

        test('validates min and max bounds', () => {
            const result1 = ValidationUtils.parseFloat('5.5', { min: 0, max: 10, fieldName: 'test' });
            expect(result1).toBe(5.5);

            const result2 = ValidationUtils.parseFloat('-1', { min: 0, fieldName: 'test' });
            expect(result2).toBeNull();
        });

        test('returns default value for null input', () => {
            const result = ValidationUtils.parseFloat(null, { default: 7.5, fieldName: 'test' });
            expect(result).toBe(7.5);
        });
    });

    describe('validateTime', () => {
        test('accepts valid time format', () => {
            expect(ValidationUtils.validateTime('09:30', 'test')).toBe(true);
            expect(ValidationUtils.validateTime('14:45', 'test')).toBe(true);
            expect(ValidationUtils.validateTime('00:00', 'test')).toBe(true);
            expect(ValidationUtils.validateTime('23:59', 'test')).toBe(true);
        });

        test('accepts single-digit hours', () => {
            expect(ValidationUtils.validateTime('9:30', 'test')).toBe(true);
        });

        test('rejects invalid time format', () => {
            expect(ValidationUtils.validateTime('25:00', 'test')).toBe(false);
            expect(ValidationUtils.validateTime('12:60', 'test')).toBe(false);
            expect(ValidationUtils.validateTime('9:5', 'test')).toBe(false);
            expect(ValidationUtils.validateTime('abc', 'test')).toBe(false);
        });

        test('rejects empty string', () => {
            expect(ValidationUtils.validateTime('', 'test')).toBe(false);
        });

        test('rejects null', () => {
            expect(ValidationUtils.validateTime(null, 'test')).toBe(false);
        });
    });

    describe('validateString', () => {
        test('validates and trims valid string', () => {
            const result = ValidationUtils.validateString('  hello  ', { fieldName: 'test' });
            expect(result).toBe('hello');
        });

        test('rejects empty string', () => {
            const result = ValidationUtils.validateString('', { fieldName: 'test' });
            expect(result).toBeNull();
        });

        test('rejects string with only whitespace', () => {
            const result = ValidationUtils.validateString('   ', { fieldName: 'test' });
            expect(result).toBeNull();
        });

        test('validates minimum length', () => {
            const result = ValidationUtils.validateString('ab', { minLength: 3, fieldName: 'test' });
            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Invalid test: Must be at least 3 character(s)');
        });

        test('validates maximum length', () => {
            const longString = 'a'.repeat(101);
            const result = ValidationUtils.validateString(longString, { maxLength: 100, fieldName: 'test' });
            expect(result).toBeNull();
        });

        test('accepts string at boundary lengths', () => {
            const result = ValidationUtils.validateString('abc', { minLength: 3, maxLength: 3, fieldName: 'test' });
            expect(result).toBe('abc');
        });

        test('converts non-string to string', () => {
            const result = ValidationUtils.validateString(123, { fieldName: 'test' });
            expect(result).toBe('123');
        });
    });

    describe('readJSONFile', () => {
        const testFile = path.join(__dirname, 'validation-utils-test-read.json');

        beforeEach(() => {
            // Clean up test file if it exists
            if (fs.existsSync(testFile)) {
                fs.unlinkSync(testFile);
            }
        });

        afterEach(() => {
            // Clean up test file
            if (fs.existsSync(testFile)) {
                fs.unlinkSync(testFile);
            }
        });

        test('reads valid JSON file', () => {
            const testData = { test: 'data', number: 42 };
            fs.writeFileSync(testFile, JSON.stringify(testData));

            const result = ValidationUtils.readJSONFile(testFile);
            expect(result).toEqual(testData);
        });

        test('returns null for non-existent file', () => {
            const result = ValidationUtils.readJSONFile('non-existent-file.json');
            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('returns null for invalid JSON', () => {
            fs.writeFileSync(testFile, '{ invalid json }');

            const result = ValidationUtils.readJSONFile(testFile);
            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        test('returns null for empty filename', () => {
            const result = ValidationUtils.readJSONFile('');
            expect(result).toBeNull();
        });

        test('returns null for null filename', () => {
            const result = ValidationUtils.readJSONFile(null);
            expect(result).toBeNull();
        });
    });

    describe('writeJSONFile', () => {
        const testFile = path.join(__dirname, 'test-write.json');

        beforeEach(() => {
            if (fs.existsSync(testFile)) {
                fs.unlinkSync(testFile);
            }
        });

        afterEach(() => {
            if (fs.existsSync(testFile)) {
                fs.unlinkSync(testFile);
            }
        });

        test('writes valid JSON file', () => {
            const testData = { test: 'data', number: 42 };
            const result = ValidationUtils.writeJSONFile(testFile, testData);

            expect(result).toBe(true);
            expect(fs.existsSync(testFile)).toBe(true);

            const content = JSON.parse(fs.readFileSync(testFile, 'utf8'));
            expect(content).toEqual(testData);
        });

        test('returns false for invalid filename', () => {
            const result = ValidationUtils.writeJSONFile('', { test: 'data' });
            expect(result).toBe(false);
        });

        test('returns false for invalid data', () => {
            const result = ValidationUtils.writeJSONFile(testFile, null);
            expect(result).toBe(false);
        });
    });

    describe('validateImportedData', () => {
        test('validates correct data structure', () => {
            const validData = {
                exportInfo: {
                    version: '1.0',
                    timestamp: new Date().toISOString()
                },
                dailyRecords: [
                    { date: '2025-11-19', mood: { timestamp: new Date().toISOString() } }
                ]
            };

            const result = ValidationUtils.validateImportedData(validData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        test('rejects null data', () => {
            const result = ValidationUtils.validateImportedData(null);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Data must be a valid object');
        });

        test('rejects missing exportInfo', () => {
            const invalidData = {
                dailyRecords: []
            };

            const result = ValidationUtils.validateImportedData(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing required field: exportInfo');
        });

        test('rejects missing dailyRecords', () => {
            const invalidData = {
                exportInfo: {
                    version: '1.0',
                    timestamp: new Date().toISOString()
                }
            };

            const result = ValidationUtils.validateImportedData(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing or invalid dailyRecords array');
        });

        test('rejects missing version', () => {
            const invalidData = {
                exportInfo: {
                    timestamp: new Date().toISOString()
                },
                dailyRecords: []
            };

            const result = ValidationUtils.validateImportedData(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Missing exportInfo.version');
        });

        test('validates record timestamps', () => {
            const invalidData = {
                exportInfo: {
                    version: '1.0',
                    timestamp: new Date().toISOString()
                },
                dailyRecords: [
                    { date: '2025-11-19', mood: { timestamp: 'invalid-timestamp' } }
                ]
            };

            const result = ValidationUtils.validateImportedData(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(err => err.includes('Invalid mood timestamp'))).toBe(true);
        });
    });

    describe('parseDate', () => {
        test('parses valid date string', () => {
            const result = ValidationUtils.parseDate('2025-11-19');
            expect(result).toBeInstanceOf(Date);
            expect(result.getFullYear()).toBe(2025);
        });

        test('returns null for invalid date string', () => {
            const result = ValidationUtils.parseDate('invalid-date');
            expect(result).toBeNull();
        });

        test('returns null for empty string', () => {
            const result = ValidationUtils.parseDate('');
            expect(result).toBeNull();
        });

        test('rejects future dates by default', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const result = ValidationUtils.parseDate(futureDate.toISOString());
            expect(result).toBeNull();
        });

        test('rejects dates before minimum', () => {
            const result = ValidationUtils.parseDate('2019-01-01');
            expect(result).toBeNull();
        });

        test('accepts dates within valid range', () => {
            const result = ValidationUtils.parseDate('2023-06-15');
            expect(result).toBeInstanceOf(Date);
        });
    });
});
