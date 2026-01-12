/**
 * Comprehensive Test Suite for EnhancedMedicationTracker
 * 
 * Tests cover:
 * - Medication name and dosage separation
 * - Input validation and sanitization
 * - FDA compliance verification
 * - Audit logging and tracking
 * 
 * Generated: 2026-01-12 03:46:35 UTC
 */

const EnhancedMedicationTracker = require('../src/EnhancedMedicationTracker');
const { AuditLogger } = require('../src/AuditLogger');
const { FDAValidator } = require('../src/FDAValidator');

describe('EnhancedMedicationTracker', () => {
  let tracker;
  let mockAuditLogger;
  let mockFDAValidator;

  beforeEach(() => {
    // Initialize mocks
    mockAuditLogger = {
      log: jest.fn(),
      getLogs: jest.fn().mockReturnValue([]),
      clear: jest.fn(),
    };

    mockFDAValidator = {
      validateMedication: jest.fn().mockResolvedValue({ valid: true }),
      checkDrugInteractions: jest.fn().mockResolvedValue([]),
      getNDCCode: jest.fn().mockResolvedValue('1234567890'),
    };

    // Initialize tracker with mocks
    tracker = new EnhancedMedicationTracker({
      auditLogger: mockAuditLogger,
      fdaValidator: mockFDAValidator,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // MEDICATION NAME AND DOSAGE SEPARATION TESTS
  // ============================================================================

  describe('Medication Name and Dosage Separation', () => {
    test('should separate medication name from dosage correctly', () => {
      const medication = tracker.parseMedication('Lisinopril 10mg');
      
      expect(medication).toEqual({
        name: 'Lisinopril',
        dosage: '10mg',
        unit: 'mg',
        quantity: 10,
      });
    });

    test('should handle medications with complex dosage formats', () => {
      const testCases = [
        {
          input: 'Amoxicillin 500mg',
          expected: { name: 'Amoxicillin', dosage: '500mg', unit: 'mg', quantity: 500 },
        },
        {
          input: 'Metformin 1000mg',
          expected: { name: 'Metformin', dosage: '1000mg', unit: 'mg', quantity: 1000 },
        },
        {
          input: 'Atorvastatin 20mg',
          expected: { name: 'Atorvastatin', dosage: '20mg', unit: 'mg', quantity: 20 },
        },
        {
          input: 'Levothyroxine 75mcg',
          expected: { name: 'Levothyroxine', dosage: '75mcg', unit: 'mcg', quantity: 75 },
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = tracker.parseMedication(input);
        expect(result.name).toBe(expected.name);
        expect(result.dosage).toBe(expected.dosage);
        expect(result.unit).toBe(expected.unit);
        expect(result.quantity).toBe(expected.quantity);
      });
    });

    test('should handle medications with multiple-word names', () => {
      const medication = tracker.parseMedication('Extended Release Metoprolol 100mg');
      
      expect(medication.name).toBe('Extended Release Metoprolol');
      expect(medication.dosage).toBe('100mg');
    });

    test('should handle medications with fractions in dosage', () => {
      const medication = tracker.parseMedication('Warfarin 2.5mg');
      
      expect(medication.name).toBe('Warfarin');
      expect(medication.dosage).toBe('2.5mg');
      expect(medication.quantity).toBe(2.5);
    });

    test('should handle medications with range dosages', () => {
      const medication = tracker.parseMedication('Ibuprofen 200-400mg');
      
      expect(medication.name).toBe('Ibuprofen');
      expect(medication.dosage).toBe('200-400mg');
    });

    test('should normalize medication name to consistent format', () => {
      const medication = tracker.parseMedication('  lisinopril  10mg  ');
      
      expect(medication.name).toBe('Lisinopril');
      expect(medication.dosage).toBe('10mg');
    });

    test('should handle medications without explicit dosage', () => {
      const medication = tracker.parseMedication('Aspirin');
      
      expect(medication.name).toBe('Aspirin');
      expect(medication.dosage).toBeNull();
    });
  });

  // ============================================================================
  // INPUT VALIDATION TESTS
  // ============================================================================

  describe('Input Validation', () => {
    test('should validate required fields are present', () => {
      expect(() => tracker.addMedication({
        name: 'Lisinopril',
      })).toThrow('Dosage is required');
    });

    test('should reject medications with invalid characters in name', () => {
      const invalidNames = [
        'Lisinopril@123',
        'Med<script>alert()</script>',
        'Drug{malicious}',
      ];

      invalidNames.forEach(name => {
        expect(() => {
          tracker.addMedication({
            name,
            dosage: '10mg',
          });
        }).toThrow('Invalid medication name');
      });
    });

    test('should reject medications with invalid dosage format', () => {
      const invalidDosages = [
        '10',
        'mg10',
        'XXX mg',
        '!@#$%mg',
      ];

      invalidDosages.forEach(dosage => {
        expect(() => {
          tracker.addMedication({
            name: 'Lisinopril',
            dosage,
          });
        }).toThrow('Invalid dosage format');
      });
    });

    test('should accept valid dosage units', () => {
      const validUnits = ['mg', 'mcg', 'g', 'ml', 'units', 'IU'];

      validUnits.forEach(unit => {
        const medication = tracker.addMedication({
          name: 'TestMed',
          dosage: `10${unit}`,
        });

        expect(medication.unit).toBe(unit);
      });
    });

    test('should sanitize input strings to prevent injection attacks', () => {
      const medication = tracker.addMedication({
        name: 'Lisinopril<script>alert("xss")</script>',
        dosage: '10mg',
      });

      expect(medication.name).not.toContain('<script>');
      expect(medication.name).not.toContain('alert');
    });

    test('should validate dosage quantity is positive number', () => {
      expect(() => {
        tracker.addMedication({
          name: 'Lisinopril',
          dosage: '-10mg',
        });
      }).toThrow('Dosage quantity must be positive');

      expect(() => {
        tracker.addMedication({
          name: 'Lisinopril',
          dosage: '0mg',
        });
      }).toThrow('Dosage quantity must be positive');
    });

    test('should validate maximum dosage limits', () => {
      expect(() => {
        tracker.addMedication({
          name: 'Lisinopril',
          dosage: '99999mg',
        });
      }).toThrow('Dosage exceeds maximum safe limit');
    });

    test('should validate frequency format', () => {
      const validFrequencies = ['once daily', 'twice daily', 'every 8 hours', 'as needed'];

      validFrequencies.forEach(frequency => {
        const medication = tracker.addMedication({
          name: 'Lisinopril',
          dosage: '10mg',
          frequency,
        });

        expect(medication.frequency).toBe(frequency);
      });
    });

    test('should reject invalid frequency format', () => {
      expect(() => {
        tracker.addMedication({
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'whenever',
        });
      }).toThrow('Invalid frequency format');
    });
  });

  // ============================================================================
  // FDA COMPLIANCE TESTS
  // ============================================================================

  describe('FDA Compliance', () => {
    test('should verify medication against FDA database', async () => {
      await tracker.addMedicationWithFDAVerification({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      expect(mockFDAValidator.validateMedication).toHaveBeenCalledWith({
        name: 'Lisinopril',
        dosage: '10mg',
      });
    });

    test('should reject medications not in FDA approved list', async () => {
      mockFDAValidator.validateMedication.mockResolvedValueOnce({
        valid: false,
        reason: 'Not FDA approved',
      });

      await expect(
        tracker.addMedicationWithFDAVerification({
          name: 'UnknownDrug',
          dosage: '10mg',
        })
      ).rejects.toThrow('Not FDA approved');
    });

    test('should check for drug interactions with FDA database', async () => {
      const interactions = [
        {
          drug: 'Warfarin',
          severity: 'high',
          description: 'Increased bleeding risk',
        },
      ];

      mockFDAValidator.checkDrugInteractions.mockResolvedValueOnce(interactions);

      const result = await tracker.checkMedicationInteractions(
        'Lisinopril',
        ['Warfarin']
      );

      expect(result).toEqual(interactions);
      expect(mockFDAValidator.checkDrugInteractions).toHaveBeenCalledWith(
        'Lisinopril',
        ['Warfarin']
      );
    });

    test('should retrieve NDC code for medication', async () => {
      const ndcCode = await tracker.getNDCCode('Lisinopril', '10mg');

      expect(ndcCode).toBe('1234567890');
      expect(mockFDAValidator.getNDCCode).toHaveBeenCalledWith('Lisinopril', '10mg');
    });

    test('should validate medication dosage against FDA guidelines', async () => {
      const result = await tracker.validateDosageAgainstFDAGuidelines({
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'once daily',
        age: 45,
      });

      expect(mockFDAValidator.validateMedication).toHaveBeenCalled();
    });

    test('should flag medications requiring special FDA warnings', async () => {
      mockFDAValidator.validateMedication.mockResolvedValueOnce({
        valid: true,
        warnings: [
          'Increased risk of ACE inhibitor-related cough',
          'Monitor for hyperkalemia',
        ],
      });

      const medication = await tracker.addMedicationWithFDAVerification({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      expect(medication.warnings).toEqual([
        'Increased risk of ACE inhibitor-related cough',
        'Monitor for hyperkalemia',
      ]);
    });

    test('should validate medication for age-appropriate use', async () => {
      const result = await tracker.validateAgeAppropriate({
        name: 'Aspirin',
        dosage: '81mg',
        age: 16,
      });

      expect(mockFDAValidator.validateMedication).toHaveBeenCalled();
    });

    test('should check for pregnancy category warnings', async () => {
      mockFDAValidator.validateMedication.mockResolvedValueOnce({
        valid: true,
        pregnancyCategory: 'C',
        warning: 'Use only if benefits outweigh risks',
      });

      const medication = await tracker.addMedicationWithFDAVerification({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      expect(medication.pregnancyCategory).toBe('C');
    });
  });

  // ============================================================================
  // AUDIT LOGGING TESTS
  // ============================================================================

  describe('Audit Logging', () => {
    test('should log medication addition to audit trail', () => {
      tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_ADDED',
          medication: expect.objectContaining({
            name: 'Lisinopril',
            dosage: '10mg',
          }),
        })
      );
    });

    test('should include timestamp in audit logs', () => {
      tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      const logCall = mockAuditLogger.log.mock.calls[0][0];
      expect(logCall.timestamp).toBeDefined();
      expect(typeof logCall.timestamp).toBe('string');
    });

    test('should log medication modifications with before/after values', () => {
      const medication = tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      tracker.updateMedication(medication.id, {
        dosage: '20mg',
      });

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_UPDATED',
          changes: expect.objectContaining({
            before: expect.objectContaining({ dosage: '10mg' }),
            after: expect.objectContaining({ dosage: '20mg' }),
          }),
        })
      );
    });

    test('should log medication removal with reason', () => {
      const medication = tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      tracker.removeMedication(medication.id, 'Patient reported side effects');

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_REMOVED',
          reason: 'Patient reported side effects',
        })
      );
    });

    test('should track user identity in audit logs', () => {
      tracker.setCurrentUser('user123');
      
      tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      const logCall = mockAuditLogger.log.mock.calls[0][0];
      expect(logCall.userId).toBe('user123');
    });

    test('should maintain complete audit trail history', () => {
      const medication = tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      tracker.updateMedication(medication.id, { dosage: '20mg' });
      tracker.updateMedication(medication.id, { dosage: '30mg' });

      expect(mockAuditLogger.log).toHaveBeenCalledTimes(3);
    });

    test('should allow retrieval of audit trail for specific medication', () => {
      const medication = tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      mockAuditLogger.getLogs.mockReturnValueOnce([
        {
          action: 'MEDICATION_ADDED',
          medicationId: medication.id,
          timestamp: '2026-01-12T03:46:35Z',
        },
      ]);

      const logs = tracker.getMedicationAuditTrail(medication.id);

      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should include IP address in audit logs when available', () => {
      tracker.setAuditContext({ ipAddress: '192.168.1.1' });
      
      tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      const logCall = mockAuditLogger.log.mock.calls[0][0];
      expect(logCall.ipAddress).toBe('192.168.1.1');
    });

    test('should log failed validation attempts', () => {
      expect(() => {
        tracker.addMedication({
          name: 'Lisinopril',
          dosage: 'invalid',
        });
      }).toThrow();

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'VALIDATION_FAILED',
          reason: expect.any(String),
        })
      );
    });

    test('should log FDA compliance checks', async () => {
      await tracker.addMedicationWithFDAVerification({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'FDA_VERIFICATION_COMPLETED',
          fdaVerified: true,
        })
      );
    });

    test('should mark critical actions in audit trail', () => {
      tracker.removeMedication('med123', 'Critical interaction detected');

      const logCall = mockAuditLogger.log.mock.calls[0][0];
      expect(logCall.severity).toBe('CRITICAL');
    });

    test('should support audit log export in compliance format', () => {
      tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      mockAuditLogger.getLogs.mockReturnValueOnce([
        {
          timestamp: '2026-01-12T03:46:35Z',
          action: 'MEDICATION_ADDED',
          userId: 'user123',
          medicationId: 'med001',
          details: {},
        },
      ]);

      const exportedLogs = tracker.exportAuditLogs('HIPAA');

      expect(exportedLogs).toBeDefined();
      expect(Array.isArray(exportedLogs)).toBe(true);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    test('should handle complete medication lifecycle with full audit trail', async () => {
      // Add medication
      const medication = await tracker.addMedicationWithFDAVerification({
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'once daily',
      });

      expect(medication.id).toBeDefined();

      // Verify it was logged
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_ADDED',
        })
      );

      // Update medication
      tracker.updateMedication(medication.id, {
        frequency: 'twice daily',
      });

      // Verify update was logged
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_UPDATED',
        })
      );

      // Remove medication
      tracker.removeMedication(medication.id, 'Treatment completed');

      // Verify removal was logged
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_REMOVED',
        })
      );
    });

    test('should maintain data integrity across operations', async () => {
      const medication = tracker.addMedication({
        name: 'Lisinopril 10mg',
        dosage: '10mg',
      });

      const retrieved = tracker.getMedication(medication.id);

      expect(retrieved).toEqual(medication);
    });

    test('should prevent duplicate medication entries for same patient', () => {
      tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      expect(() => {
        tracker.addMedication({
          name: 'Lisinopril',
          dosage: '10mg',
        });
      }).toThrow('Duplicate medication entry');
    });

    test('should handle concurrent medication operations safely', async () => {
      const medications = await Promise.all([
        tracker.addMedicationWithFDAVerification({
          name: 'Lisinopril',
          dosage: '10mg',
        }),
        tracker.addMedicationWithFDAVerification({
          name: 'Metformin',
          dosage: '1000mg',
        }),
        tracker.addMedicationWithFDAVerification({
          name: 'Atorvastatin',
          dosage: '20mg',
        }),
      ]);

      expect(medications).toHaveLength(3);
      expect(new Set(medications.map(m => m.id)).size).toBe(3);
    });
  });

  // ============================================================================
  // ERROR HANDLING AND EDGE CASES
  // ============================================================================

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing medication gracefully', () => {
      expect(() => {
        tracker.getMedication('nonexistent-id');
      }).toThrow('Medication not found');
    });

    test('should handle FDA service unavailability', async () => {
      mockFDAValidator.validateMedication.mockRejectedValueOnce(
        new Error('FDA service unavailable')
      );

      await expect(
        tracker.addMedicationWithFDAVerification({
          name: 'Lisinopril',
          dosage: '10mg',
        })
      ).rejects.toThrow('FDA service unavailable');
    });

    test('should gracefully degrade when audit logging fails', () => {
      mockAuditLogger.log.mockImplementationOnce(() => {
        throw new Error('Audit log failed');
      });

      // Should not crash but should attempt retry or queue
      expect(() => {
        tracker.addMedication({
          name: 'Lisinopril',
          dosage: '10mg',
        });
      }).not.toThrow();
    });

    test('should handle very long medication names', () => {
      const longName = 'A'.repeat(500);
      
      const medication = tracker.addMedication({
        name: longName,
        dosage: '10mg',
      });

      expect(medication.name).toBeDefined();
    });

    test('should handle special characters in dosage unit', () => {
      const medication = tracker.parseMedication('Aspirin 500mg/ml');
      
      expect(medication).toBeDefined();
      expect(medication.dosage).toContain('mg');
    });

    test('should recover from partially failed operations', async () => {
      let callCount = 0;
      mockFDAValidator.validateMedication.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ valid: true });
      });

      // First attempt fails
      await expect(
        tracker.addMedicationWithFDAVerification({
          name: 'Lisinopril',
          dosage: '10mg',
        })
      ).rejects.toThrow();

      // Retry succeeds
      const medication = await tracker.addMedicationWithFDAVerification({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      expect(medication).toBeDefined();
    });
  });

  // ============================================================================
  // SECURITY AND COMPLIANCE TESTS
  // ============================================================================

  describe('Security and Compliance', () => {
    test('should enforce HIPAA data handling requirements', () => {
      const medication = tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      // Ensure sensitive data is not logged in plain text
      const logCall = mockAuditLogger.log.mock.calls[0][0];
      expect(JSON.stringify(logCall)).not.toContain('password');
      expect(JSON.stringify(logCall)).not.toContain('ssn');
    });

    test('should sanitize input to prevent SQL injection', () => {
      const maliciousInput = "'; DROP TABLE medications; --";
      
      const medication = tracker.addMedication({
        name: maliciousInput,
        dosage: '10mg',
      });

      expect(medication.name).not.toContain("DROP TABLE");
    });

    test('should prevent Cross-Site Scripting (XSS) attacks', () => {
      const xssPayload = '<img src=x onerror="alert(\'xss\')">';
      
      const medication = tracker.addMedication({
        name: xssPayload,
        dosage: '10mg',
      });

      expect(medication.name).not.toContain('onerror');
      expect(medication.name).not.toContain('<img');
    });

    test('should enforce role-based access control for modifications', () => {
      const medication = tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      tracker.setCurrentUser('user123', 'viewer');

      expect(() => {
        tracker.updateMedication(medication.id, { dosage: '20mg' });
      }).toThrow('Insufficient permissions');
    });

    test('should encrypt sensitive medication data at rest', () => {
      const medication = tracker.addMedication({
        name: 'Lisinopril',
        dosage: '10mg',
      });

      // Data should be encrypted when stored
      const stored = tracker.getEncryptedMedication(medication.id);
      expect(stored).not.toEqual(medication);
    });
  });
});
