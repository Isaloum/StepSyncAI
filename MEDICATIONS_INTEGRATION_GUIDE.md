# MindTrackAI Medications Integration Guide

**Document Version:** 1.0  
**Last Updated:** 2026-01-12  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Integration Setup](#integration-setup)
4. [Usage Examples](#usage-examples)
5. [FDA Compliance](#fda-compliance)
6. [Audit Logging](#audit-logging)
7. [API Reference](#api-reference)
8. [Error Handling](#error-handling)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The MindTrackAI Medications Integration module provides a comprehensive system for managing patient medications, tracking adherence, monitoring side effects, and maintaining regulatory compliance. This guide covers integration, implementation, and operational procedures.

### Key Features

- **Medication Management**: Add, update, and track patient medications
- **Adherence Monitoring**: Track medication compliance and refill schedules
- **Side Effect Reporting**: Document and monitor adverse reactions
- **Drug Interaction Checking**: Verify safe medication combinations
- **FDA Compliance**: Full compliance with FDA regulations and standards
- **Audit Trails**: Complete logging of all medication-related activities
- **HIPAA Compliance**: Encrypted data storage and transmission
- **Clinical Alerts**: Real-time notifications for critical medication events

### Supported Data Standards

- **RxNorm**: Standard drug nomenclature (NRLS)
- **NDC (National Drug Code)**: FDA standard drug identifier
- **SNOMED CT**: Clinical terminology
- **HL7 FHIR**: Healthcare data exchange standard
- **DICOM**: Medical imaging metadata (where applicable)

---

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MindTrackAI Platform                      │
├─────────────────────────────────────────────────────────────┤
│                  Medications Module                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Medication   │  │  Adherence   │  │  Side Effect │       │
│  │ Management   │  │  Tracking    │  │  Reporting   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Drug        │  │  Audit       │  │  FDA         │       │
│  │  Interaction │  │  Logging     │  │  Compliance  │       │
│  │  Checker     │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Medications  │  │   Audit      │  │  Compliance  │       │
│  │   Database   │  │     Logs     │  │   Records    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### Medications Table
```sql
CREATE TABLE medications (
    medication_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id),
    drug_name VARCHAR(255) NOT NULL,
    ndc_code VARCHAR(11) NOT NULL,
    rxnorm_id VARCHAR(50),
    dosage VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    prescriber_id UUID REFERENCES providers(provider_id),
    indication TEXT,
    contraindications TEXT,
    special_instructions TEXT,
    refill_count INTEGER,
    last_refill_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(user_id),
    updated_by UUID NOT NULL REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_medications_ndc ON medications(ndc_code);
CREATE INDEX idx_medications_active ON medications(is_active, end_date);
```

#### Medication Adherence Table
```sql
CREATE TABLE medication_adherence (
    adherence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(medication_id),
    patient_id UUID NOT NULL REFERENCES patients(patient_id),
    scheduled_date DATE NOT NULL,
    taken_date TIMESTAMP,
    doses_missed INTEGER DEFAULT 0,
    adherence_percentage DECIMAL(5, 2),
    reason_if_missed TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_adherence_medication ON medication_adherence(medication_id);
CREATE INDEX idx_adherence_patient ON medication_adherence(patient_id);
CREATE INDEX idx_adherence_date ON medication_adherence(scheduled_date);
```

#### Side Effects Table
```sql
CREATE TABLE side_effects (
    side_effect_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(medication_id),
    patient_id UUID NOT NULL REFERENCES patients(patient_id),
    side_effect_description TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe')),
    reported_date TIMESTAMP NOT NULL,
    onset_date DATE,
    resolution_date DATE,
    clinical_notes TEXT,
    requires_intervention BOOLEAN DEFAULT false,
    intervention_taken TEXT,
    reported_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_side_effects_medication ON side_effects(medication_id);
CREATE INDEX idx_side_effects_patient ON side_effects(patient_id);
CREATE INDEX idx_side_effects_severity ON side_effects(severity);
```

---

## Integration Setup

### Prerequisites

- MindTrackAI Core v2.0+
- PostgreSQL 12+ database
- Node.js 16+ or Python 3.8+
- Active FDA registration (for compliance features)
- HIPAA-compliant hosting infrastructure

### Installation Steps

#### 1. Environment Configuration

```bash
# Copy environment template
cp .env.medications.example .env.medications

# Edit configuration
nano .env.medications
```

**Required Environment Variables:**

```env
# Database Configuration
MEDICATIONS_DB_HOST=localhost
MEDICATIONS_DB_PORT=5432
MEDICATIONS_DB_NAME=medications_db
MEDICATIONS_DB_USER=medications_user
MEDICATIONS_DB_PASSWORD=secure_password
MEDICATIONS_DB_SSL=true

# FDA Compliance
FDA_SUBMISSION_ENABLED=true
FDA_NDA_NUMBER=NDA0XXXXXX
FDA_ESTABLISHMENT_NUMBER=XXXXXXXXX

# Audit Logging
AUDIT_LOG_RETENTION_DAYS=2555
AUDIT_LOG_ENCRYPTION=true
AUDIT_LOG_STORAGE=s3

# RxNorm Integration
RXNORM_API_ENDPOINT=https://rxnav.nlm.nih.gov/REST
RXNORM_API_KEY=your_api_key

# Security
ENCRYPTION_CIPHER=aes-256-gcm
ENCRYPTION_KEY=your_encryption_key
MEDICATION_DATA_ENCRYPTION=true

# Compliance
HIPAA_ENCRYPTION_ENABLED=true
AUDIT_TRAIL_ENABLED=true
GDPR_COMPLIANCE_MODE=true
```

#### 2. Database Initialization

```bash
# Run migrations
npm run migrate:medications
# or
python manage.py migrate medications

# Seed reference data (optional)
npm run seed:medications:reference-data
```

#### 3. Module Installation

**Node.js:**
```bash
npm install @mindtrackapi/medications
```

**Python:**
```bash
pip install mindtrackapi-medications
```

#### 4. Initialize Module

**JavaScript/Node.js:**
```javascript
const MedicationsModule = require('@mindtrackapi/medications');

const medications = new MedicationsModule({
  database: process.env.MEDICATIONS_DB_HOST,
  fdaCompliance: true,
  auditLogging: true,
  encryptionEnabled: true
});

medications.initialize();
```

**Python:**
```python
from mindtrackapi.medications import MedicationsModule

medications = MedicationsModule(
    database_host=os.getenv('MEDICATIONS_DB_HOST'),
    fda_compliance=True,
    audit_logging=True,
    encryption_enabled=True
)

medications.initialize()
```

---

## Usage Examples

### Example 1: Adding a Patient Medication

**JavaScript Implementation:**

```javascript
const medicationData = {
  patientId: '550e8400-e29b-41d4-a716-446655440000',
  drugName: 'Sertraline',
  ndcCode: '00093-7300-01',
  rxnormId: '36437',
  dosage: '50',
  unit: 'mg',
  frequency: 'once daily',
  route: 'oral',
  startDate: new Date('2026-01-12'),
  prescriberId: '550e8400-e29b-41d4-a716-446655440001',
  indication: 'Major Depressive Disorder',
  contraindications: 'MAOIs, NSAIDs',
  specialInstructions: 'Take with food to minimize GI upset',
  refillCount: 11,
  createdBy: '550e8400-e29b-41d4-a716-446655440002'
};

try {
  const result = await medications.addMedication(medicationData);
  console.log('Medication added:', result.medicationId);
  
  // Audit log is automatically created
} catch (error) {
  if (error.code === 'DRUG_INTERACTION_WARNING') {
    console.warn('Drug interaction detected:', error.interactions);
  } else if (error.code === 'CONTRAINDICATION_CONFLICT') {
    console.error('Contraindication conflict:', error.details);
  }
}
```

**Python Implementation:**

```python
from mindtrackapi.medications import MedicationsModule

medication_data = {
    'patient_id': '550e8400-e29b-41d4-a716-446655440000',
    'drug_name': 'Sertraline',
    'ndc_code': '00093-7300-01',
    'rxnorm_id': '36437',
    'dosage': '50',
    'unit': 'mg',
    'frequency': 'once daily',
    'route': 'oral',
    'start_date': '2026-01-12',
    'prescriber_id': '550e8400-e29b-41d4-a716-446655440001',
    'indication': 'Major Depressive Disorder',
    'contraindications': 'MAOIs, NSAIDs',
    'special_instructions': 'Take with food to minimize GI upset',
    'refill_count': 11,
    'created_by': '550e8400-e29b-41d4-a716-446655440002'
}

try:
    result = medications.add_medication(medication_data)
    print(f"Medication added: {result['medication_id']}")
    
except MedicationError as e:
    if e.code == 'DRUG_INTERACTION_WARNING':
        print(f"Drug interaction detected: {e.interactions}")
    elif e.code == 'CONTRAINDICATION_CONFLICT':
        print(f"Contraindication conflict: {e.details}")
```

### Example 2: Checking Drug Interactions

**JavaScript Implementation:**

```javascript
const medications = [
  { ndcCode: '00093-7300-01', rxnormId: '36437' }, // Sertraline
  { ndcCode: '00065-0050-30', rxnormId: '7496' }   // Ibuprofen
];

try {
  const interactions = await medications.checkDrugInteractions(medications);
  
  interactions.forEach(interaction => {
    console.log(`Severity: ${interaction.severity}`);
    console.log(`Description: ${interaction.description}`);
    console.log(`Recommendation: ${interaction.recommendation}`);
  });
  
} catch (error) {
  console.error('Error checking interactions:', error);
}
```

**Python Implementation:**

```python
medications_list = [
    {'ndc_code': '00093-7300-01', 'rxnorm_id': '36437'},  # Sertraline
    {'ndc_code': '00065-0050-30', 'rxnorm_id': '7496'}    # Ibuprofen
]

try:
    interactions = medications.check_drug_interactions(medications_list)
    
    for interaction in interactions:
        print(f"Severity: {interaction['severity']}")
        print(f"Description: {interaction['description']}")
        print(f"Recommendation: {interaction['recommendation']}")
        
except MedicationError as e:
    print(f"Error checking interactions: {e}")
```

### Example 3: Recording Medication Adherence

**JavaScript Implementation:**

```javascript
const adherenceData = {
  medicationId: '550e8400-e29b-41d4-a716-446655440000',
  patientId: '550e8400-e29b-41d4-a716-446655440000',
  scheduledDate: new Date('2026-01-12'),
  takenDate: new Date('2026-01-12T08:30:00Z'),
  dosesMissed: 0,
  reminderSent: true,
  reminderSentAt: new Date('2026-01-12T07:00:00Z'),
  recordedBy: '550e8400-e29b-41d4-a716-446655440002'
};

try {
  const adherence = await medications.recordAdherence(adherenceData);
  
  // Calculate adherence percentage
  const adherencePercentage = await medications.calculateAdherencePercentage(
    '550e8400-e29b-41d4-a716-446655440000',
    30  // Last 30 days
  );
  
  console.log(`Adherence %: ${adherencePercentage}%`);
  
  // Trigger alert if adherence drops below threshold
  if (adherencePercentage < 80) {
    await medications.sendAdherenceAlert(
      '550e8400-e29b-41d4-a716-446655440000',
      'Low medication adherence detected'
    );
  }
  
} catch (error) {
  console.error('Error recording adherence:', error);
}
```

**Python Implementation:**

```python
adherence_data = {
    'medication_id': '550e8400-e29b-41d4-a716-446655440000',
    'patient_id': '550e8400-e29b-41d4-a716-446655440000',
    'scheduled_date': '2026-01-12',
    'taken_date': '2026-01-12T08:30:00Z',
    'doses_missed': 0,
    'reminder_sent': True,
    'reminder_sent_at': '2026-01-12T07:00:00Z',
    'recorded_by': '550e8400-e29b-41d4-a716-446655440002'
}

try:
    adherence = medications.record_adherence(adherence_data)
    
    # Calculate adherence percentage
    adherence_percentage = medications.calculate_adherence_percentage(
        '550e8400-e29b-41d4-a716-446655440000',
        days=30
    )
    
    print(f"Adherence %: {adherence_percentage}%")
    
    # Trigger alert if adherence drops below threshold
    if adherence_percentage < 80:
        medications.send_adherence_alert(
            '550e8400-e29b-41d4-a716-446655440000',
            'Low medication adherence detected'
        )
        
except MedicationError as e:
    print(f"Error recording adherence: {e}")
```

### Example 4: Reporting Side Effects

**JavaScript Implementation:**

```javascript
const sideEffectReport = {
  medicationId: '550e8400-e29b-41d4-a716-446655440000',
  patientId: '550e8400-e29b-41d4-a716-446655440000',
  sideEffectDescription: 'Mild tremor in hands, worse in morning',
  severity: 'mild',  // mild | moderate | severe
  reportedDate: new Date(),
  onsetDate: new Date('2026-01-10'),
  resolutionDate: null,
  clinicalNotes: 'Patient reports onset 2 days after medication initiation. Manageable with current dosage.',
  requiresIntervention: false,
  reportedBy: '550e8400-e29b-41d4-a716-446655440002'
};

try {
  const report = await medications.reportSideEffect(sideEffectReport);
  console.log('Side effect report created:', report.sideEffectId);
  
  // If severe, automatically escalate
  if (sideEffectReport.severity === 'severe') {
    await medications.escalateSideEffectReport(report.sideEffectId, {
      escalatedTo: 'prescriber',
      notificationMethod: 'email_and_phone'
    });
  }
  
} catch (error) {
  console.error('Error reporting side effect:', error);
}
```

**Python Implementation:**

```python
side_effect_report = {
    'medication_id': '550e8400-e29b-41d4-a716-446655440000',
    'patient_id': '550e8400-e29b-41d4-a716-446655440000',
    'side_effect_description': 'Mild tremor in hands, worse in morning',
    'severity': 'mild',  # mild | moderate | severe
    'reported_date': datetime.now(),
    'onset_date': '2026-01-10',
    'resolution_date': None,
    'clinical_notes': 'Patient reports onset 2 days after medication initiation. Manageable with current dosage.',
    'requires_intervention': False,
    'reported_by': '550e8400-e29b-41d4-a716-446655440002'
}

try:
    report = medications.report_side_effect(side_effect_report)
    print(f"Side effect report created: {report['side_effect_id']}")
    
    # If severe, automatically escalate
    if side_effect_report['severity'] == 'severe':
        medications.escalate_side_effect_report(
            report['side_effect_id'],
            {
                'escalated_to': 'prescriber',
                'notification_method': 'email_and_phone'
            }
        )
        
except MedicationError as e:
    print(f"Error reporting side effect: {e}")
```

### Example 5: Generating Medication Summary

**JavaScript Implementation:**

```javascript
const summary = await medications.generatePatientMedicationSummary(
  '550e8400-e29b-41d4-a716-446655440000',
  {
    includeAdherence: true,
    includeSideEffects: true,
    includeInteractions: true,
    format: 'pdf'  // pdf | json | xml
  }
);

console.log(summary);
// Output includes:
// - Current medications
// - Adherence statistics
// - Reported side effects
// - Drug interactions
// - Refill information
```

**Python Implementation:**

```python
summary = medications.generate_patient_medication_summary(
    '550e8400-e29b-41d4-a716-446655440000',
    {
        'include_adherence': True,
        'include_side_effects': True,
        'include_interactions': True,
        'format': 'pdf'  # pdf | json | xml
    }
)

print(summary)
```

---

## FDA Compliance

### FDA Regulations Compliance

The Medications Integration module is designed to comply with the following FDA regulations:

#### 1. **21 CFR Part 11 - Electronic Records; Electronic Signatures**

**Compliance Features:**
- Digital signature support for all medication-related documents
- Audit trails for all system access and modifications
- Time-stamped entries with cryptographic verification
- User authentication and role-based access control

**Implementation:**
```javascript
// Electronic signature capture
const signatureData = {
  documentId: 'MED-2026-001234',
  signedBy: 'provider_id',
  timestamp: new Date(),
  signatureImage: base64EncodedSignature,
  intentToSign: 'Approval of medication prescription'
};

await medications.captureElectronicSignature(signatureData);
```

#### 2. **21 CFR Part 312 - Investigational New Drug Application (IND)**

**Compliance Features:**
- Support for investigational drug tracking
- Protocol compliance monitoring
- Safety reporting requirements
- Subject enrollment tracking

**Implementation:**
```javascript
const indMedication = {
  drugName: 'Investigational Drug XYZ',
  indNumber: 'IND 123456',
  protocol: 'PROTOCOL-2025-001',
  subjectId: 'SUBJECT-001',
  enrollmentDate: new Date('2026-01-01'),
  complianceRequired: true
};

await medications.trackInvestigationalDrug(indMedication);
```

#### 3. **21 CFR Part 320 - Bioavailability and Bioequivalence Requirements**

**Compliance Features:**
- Bioequivalence documentation support
- Generic/brand medication tracking
- Interchangeability status management

**Implementation:**
```javascript
const medicationRecord = {
  drugName: 'Sertraline',
  ndc: '00093-7300-01',
  manufacturer: 'Pfizer Inc',
  bioequivalenceStatus: 'AB-rated',
  genericEquivalent: true,
  interchangeableWith: ['00088-3124-03'] // Other NDC codes
};
```

#### 4. **21 CFR Part 201 - Labeling Requirements**

**Compliance Features:**
- Medication label compliance verification
- Warning and precaution documentation
- Indication verification
- Contraindication tracking

**Implementation:**
```javascript
const labelCompliance = await medications.verifyLabelCompliance({
  ndcCode: '00093-7300-01',
  indications: ['Major Depressive Disorder'],
  contraindications: ['MAOI use within 14 days'],
  warnings: ['Suicidal thoughts in young adults'],
  precautions: ['Serotonin syndrome risk']
});
```

### FDA Submission Support

**Device Master File (DMF) Integration:**
```javascript
await medications.submitDeviceMasterFile({
  dmfType: 'Type III (Process or Method)',
  submissionType: 'Original',
  manufacturerId: 'MFG-123456',
  drugProductList: medicationArray
});
```

**Electronic Submission Capabilities:**
```javascript
await medications.prepareFDAeSTAR({
  submissionType: 'Annual Report',
  year: 2026,
  documents: reportDocuments,
  signedBy: 'authorizedOfficer',
  encryptionMethod: 'AES-256'
});
```

### FDA Adverse Event Reporting (MedWatch)

```javascript
// Automatic MedWatch reporting for serious adverse events
const adverseEvent = {
  productType: 'Drug',
  ndcCode: '00093-7300-01',
  eventDescription: 'Severe allergic reaction',
  eventDate: new Date('2026-01-12'),
  patientAge: 45,
  patientSex: 'F',
  seriousness: 'Serious - Hospitalization',
  outcome: 'Recovered',
  reporterType: 'Health Professional'
};

const medwatchReport = await medications.generateMedWatchReport(adverseEvent);
await medications.submitToFDA(medwatchReport);
```

---

## Audit Logging

### Audit Log Architecture

All medication-related activities are logged with comprehensive tracking:

```sql
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id),
    user_role VARCHAR(100),
    ip_address INET,
    changes JSONB,
    old_values JSONB,
    new_values JSONB,
    status VARCHAR(50),
    result VARCHAR(500),
    error_message TEXT,
    duration_ms INTEGER,
    signature VARCHAR(512),
    signature_algorithm VARCHAR(50),
    encrypted BOOLEAN DEFAULT true,
    encryption_key_version INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

### Logged Actions

**Medication Management:**
- `medication_added` - New medication record created
- `medication_updated` - Medication details modified
- `medication_deleted` - Medication record deleted
- `medication_discontinued` - Medication discontinued
- `medication_refilled` - Refill recorded
- `medication_reinstated` - Previously discontinued medication reactivated

**Adherence Tracking:**
- `adherence_recorded` - Adherence entry created
- `adherence_updated` - Adherence modified
- `adherence_verified` - Manual verification performed
- `reminder_sent` - Adherence reminder delivered

**Clinical Events:**
- `side_effect_reported` - Adverse event documented
- `side_effect_resolved` - Side effect resolution recorded
- `interaction_detected` - Drug interaction identified
- `clinical_alert_triggered` - Alert generated
- `clinical_alert_acknowledged` - Alert reviewed by provider

**Compliance Activities:**
- `fda_submission` - FDA submission prepared
- `medwatch_report_submitted` - MedWatch report sent
- `compliance_audit` - Compliance review performed
- `audit_log_exported` - Logs extracted for review

### Audit Log Implementation

**JavaScript Example:**

```javascript
class MedicationAuditLogger {
  constructor(config) {
    this.config = config;
    this.encryptionKey = config.encryptionKey;
  }

  async logAction(action, entityType, entityId, userId, changes) {
    const logEntry = {
      timestamp: new Date(),
      action: action,
      entityType: entityType,
      entityId: entityId,
      userId: userId,
      userRole: await this.getUserRole(userId),
      ipAddress: this.getClientIp(),
      changes: changes,
      oldValues: changes.before,
      newValues: changes.after,
      status: changes.status || 'success',
      result: changes.result || null,
      duration_ms: changes.duration || 0
    };

    // Sign the log entry
    logEntry.signature = await this.signLogEntry(logEntry);
    logEntry.signature_algorithm = 'SHA-256-RSA';

    // Encrypt sensitive data
    if (this.config.encryptionEnabled) {
      logEntry.encrypted = true;
      logEntry.changes = await this.encryptData(logEntry.changes);
      logEntry.old_values = await this.encryptData(logEntry.oldValues);
      logEntry.new_values = await this.encryptData(logEntry.newValues);
    }

    // Store log
    await this.storeLog(logEntry);

    // Send to remote audit system if configured
    if (this.config.remoteAuditEnabled) {
      await this.sendRemoteAuditLog(logEntry);
    }

    return logEntry.log_id;
  }

  async signLogEntry(logEntry) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.encryptionKey);
    hmac.update(JSON.stringify(logEntry));
    return hmac.digest('hex');
  }

  async encryptData(data) {
    const crypto = require('crypto');
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.alloc(16, 0)
    );
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return {
      data: encrypted,
      iv: cipher.getAuthTag().toString('hex')
    };
  }
}

// Usage
const auditLogger = new MedicationAuditLogger({
  encryptionKey: process.env.ENCRYPTION_KEY,
  encryptionEnabled: true,
  remoteAuditEnabled: true
});

await auditLogger.logAction(
  'medication_added',
  'medication',
  medicationId,
  userId,
  {
    before: null,
    after: medicationData,
    status: 'success',
    duration: 145
  }
);
```

### Audit Trail Retrieval

```javascript
// Retrieve audit logs with filtering
const auditTrail = await medications.getAuditTrail({
  entityType: 'medication',
  entityId: medicationId,
  action: ['medication_added', 'medication_updated'],
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  userId: null,
  limit: 1000,
  decrypt: true
});

auditTrail.forEach(log => {
  console.log(`${log.timestamp}: ${log.action} by ${log.user_id}`);
  console.log(`Changes: ${JSON.stringify(log.changes)}`);
  console.log(`Signature Valid: ${log.signature_valid}`);
});
```

### Audit Log Retention Policy

**Retention Schedule:**
- Standard audit logs: 10 years (minimum FDA requirement)
- High-risk audit logs: 15 years
- FDA submission records: Indefinite
- Adverse event reports: 15+ years after last patient contact
- Compliance audit records: 7 years post-completion

**Archival Process:**
```javascript
await medications.archiveAuditLogs({
  retentionDays: 2555, // ~7 years for standard retention
  archiveLocation: 's3://audit-archive/',
  compressionEnabled: true,
  encryptionEnabled: true,
  retentionPolicy: 'immutable'
});
```

---

## API Reference

### Core Methods

#### `addMedication(medicationData)`

Adds a new medication record for a patient.

**Parameters:**
```javascript
{
  patientId: UUID,           // Required
  drugName: String,          // Required
  ndcCode: String,           // Required (11-digit NDC)
  rxnormId: String,          // Optional (RxNorm ID)
  dosage: String,            // Required
  unit: String,              // Required (mg, ml, etc.)
  frequency: String,         // Required (once daily, etc.)
  route: String,             // Required (oral, IV, etc.)
  startDate: Date,           // Required
  endDate: Date,             // Optional
  prescriberId: UUID,        // Optional
  indication: String,        // Optional
  contraindications: String, // Optional
  specialInstructions: String, // Optional
  refillCount: Integer,      // Optional
  createdBy: UUID            // Required
}
```

**Returns:** `Promise<{medicationId, audit_log_id}>`

**Throws:** `MedicationError`

---

#### `updateMedication(medicationId, updates)`

Updates an existing medication record.

**Parameters:**
```javascript
{
  dosage: String,            // Optional
  frequency: String,         // Optional
  refillCount: Integer,      // Optional
  specialInstructions: String, // Optional
  updatedBy: UUID            // Required
}
```

**Returns:** `Promise<{medicationId, previousValues, newValues}>`

---

#### `discontinueMedication(medicationId, reason, discontinuedBy)`

Marks a medication as discontinued.

**Parameters:**
- `medicationId` (UUID): Medication ID
- `reason` (String): Reason for discontinuation
- `discontinuedBy` (UUID): User ID

**Returns:** `Promise<{medicationId, discontinuedDate}>`

---

#### `checkDrugInteractions(medications)`

Checks for interactions between multiple medications.

**Parameters:**
```javascript
[
  { ndcCode: String, rxnormId: String },
  { ndcCode: String, rxnormId: String }
]
```

**Returns:**
```javascript
[
  {
    drugPair: [String, String],
    severity: 'contraindicated' | 'serious' | 'moderate' | 'minor',
    description: String,
    recommendation: String,
    references: [String]
  }
]
```

---

#### `recordAdherence(adherenceData)`

Records medication adherence for a scheduled dose.

**Parameters:**
```javascript
{
  medicationId: UUID,   // Required
  patientId: UUID,      // Required
  scheduledDate: Date,  // Required
  takenDate: Date,      // Optional (null if missed)
  dosesMissed: Integer, // Optional
  recordedBy: UUID      // Required
}
```

**Returns:** `Promise<{adherenceId}>`

---

#### `reportSideEffect(sideEffectData)`

Reports an adverse effect or side effect.

**Parameters:**
```javascript
{
  medicationId: UUID,            // Required
  patientId: UUID,               // Required
  sideEffectDescription: String, // Required
  severity: 'mild' | 'moderate' | 'severe', // Required
  reportedDate: Date,            // Required
  onsetDate: Date,               // Optional
  resolutionDate: Date,          // Optional
  clinicalNotes: String,         // Optional
  requiresIntervention: Boolean, // Optional
  reportedBy: UUID               // Required
}
```

**Returns:** `Promise<{sideEffectId, requiresEscalation}>`

---

#### `calculateAdherencePercentage(patientId, days)`

Calculates medication adherence percentage for a period.

**Parameters:**
- `patientId` (UUID): Patient ID
- `days` (Integer): Number of days to analyze (default: 30)

**Returns:** `Promise<Number>` (0-100)

---

#### `generatePatientMedicationSummary(patientId, options)`

Generates a comprehensive medication summary.

**Parameters:**
```javascript
{
  patientId: UUID,
  options: {
    includeAdherence: Boolean,
    includeSideEffects: Boolean,
    includeInteractions: Boolean,
    format: 'pdf' | 'json' | 'xml',
    signDocument: Boolean
  }
}
```

**Returns:** `Promise<Object | Buffer>`

---

### Administrative Methods

#### `getUserMedicationAuditTrail(patientId, options)`

Retrieves audit trail for a patient's medications.

**Parameters:**
```javascript
{
  patientId: UUID,
  options: {
    startDate: Date,
    endDate: Date,
    actionFilter: [String],
    userFilter: [UUID],
    decrypt: Boolean
  }
}
```

**Returns:** `Promise<Array<AuditLog>>`

---

#### `exportMedicationData(filtercriteria, format)`

Exports medication data for reporting/compliance.

**Parameters:**
```javascript
{
  filterCriteria: {
    patientIds: [UUID],
    startDate: Date,
    endDate: Date,
    medicationStatus: 'active' | 'discontinued' | 'all'
  },
  format: 'csv' | 'json' | 'xlsx' | 'hl7'
}
```

**Returns:** `Promise<Buffer>`

---

---

## Error Handling

### Error Types and Codes

**MedicationValidationError:**
```javascript
{
  code: 'INVALID_NDC_CODE',
  message: 'NDC code must be 11 digits',
  statusCode: 400
}

{
  code: 'DOSAGE_OUT_OF_RANGE',
  message: 'Dosage 50mg exceeds FDA maximum of 20mg',
  statusCode: 400
}

{
  code: 'INVALID_FREQUENCY',
  message: 'Frequency must be in standard format',
  statusCode: 400
}
```

**DrugInteractionError:**
```javascript
{
  code: 'CONTRAINDICATED_COMBINATION',
  message: 'MAOI cannot be combined with Sertraline',
  statusCode: 409,
  interactions: [
    {
      drugPair: ['MAOI', 'Sertraline'],
      severity: 'contraindicated'
    }
  ]
}
```

**ContraindicationError:**
```javascript
{
  code: 'CONTRAINDICATION_CONFLICT',
  message: 'Patient has documented contraindication to this medication',
  statusCode: 409,
  contraindications: ['Allergy to SSRIs']
}
```

**AuthorizationError:**
```javascript
{
  code: 'INSUFFICIENT_PERMISSIONS',
  message: 'User lacks permission to modify medications',
  statusCode: 403
}
```

### Error Handling Examples

**JavaScript:**
```javascript
try {
  await medications.addMedication(medicationData);
} catch (error) {
  if (error instanceof MedicationValidationError) {
    console.error('Validation failed:', error.message);
  } else if (error instanceof DrugInteractionError) {
    console.error('Drug interaction detected:');
    error.interactions.forEach(i => {
      if (i.severity === 'contraindicated') {
        throw error; // Prevent medication addition
      } else if (i.severity === 'serious') {
        // Require provider confirmation
        await requestProviderConfirmation(error.interactions);
      }
    });
  } else if (error instanceof ContraindicationError) {
    console.error('Contraindication conflict:', error.contraindications);
  } else if (error instanceof AuthorizationError) {
    console.error('Authorization failed');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

**Python:**
```python
try:
    medications.add_medication(medication_data)
except MedicationValidationError as e:
    logger.error(f"Validation failed: {e.message}")
except DrugInteractionError as e:
    logger.error(f"Drug interaction detected: {e.interactions}")
    for interaction in e.interactions:
        if interaction['severity'] == 'contraindicated':
            raise
except ContraindicationError as e:
    logger.error(f"Contraindication: {e.contraindications}")
except AuthorizationError as e:
    logger.error("Insufficient permissions")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
```

---

## Security Considerations

### Data Encryption

**At-Rest Encryption:**
```javascript
// All medication data encrypted in database
{
  algorithm: 'AES-256-GCM',
  keyDerivation: 'PBKDF2',
  iterations: 100000,
  encryptedFields: [
    'drug_name',
    'dosage',
    'special_instructions',
    'indication',
    'contraindications'
  ]
}
```

**In-Transit Encryption:**
```javascript
{
  protocol: 'TLS 1.3',
  cipherSuite: 'ECDHE-RSA-AES-256-GCM-SHA384',
  certificatePinning: true,
  certificateValidation: 'strict'
}
```

### Access Control

**Role-Based Access Control (RBAC):**
```javascript
const permissions = {
  'admin': ['*'],
  'prescriber': ['read', 'create', 'update', 'discontinue'],
  'nurse': ['read', 'record_adherence', 'report_side_effect'],
  'patient': ['read_own', 'report_side_effect_own'],
  'pharmacist': ['read', 'verify', 'update_refill']
};
```

**Field-Level Security:**
```javascript
{
  patientView: ['drug_name', 'dosage', 'frequency', 'special_instructions'],
  providerView: ['drug_name', 'dosage', 'frequency', 'indication', 'contraindications'],
  pharmacistView: ['all'],
  adminView: ['all']
}
```

### API Security

**Authentication:**
- OAuth 2.0 with JWT tokens
- Token expiration: 1 hour
- Refresh token rotation

**Rate Limiting:**
- 100 requests per minute per user
- 1000 requests per minute per API key
- Stricter limits for write operations: 10 per minute

**Input Validation:**
```javascript
const validator = {
  ndcCode: /^\d{5}-\d{3}-\d{2}$/,
  rxnormId: /^\d+$/,
  dosage: /^\d+(\.\d+)?$/,
  frequency: /^(once|twice|three times|four times|every \d+ hours) (daily|every day)$/i
};
```

### Compliance Security

**HIPAA Compliance:**
- PHI encryption (AES-256)
- Access logs for all PHI access
- Breach notification procedures
- Business Associate Agreements (BAAs)

**PCI-DSS (if payment processing):**
- PCI-DSS Level 1 compliance
- Credit card tokenization
- Secure payment gateway integration

---

## Troubleshooting

### Common Issues and Solutions

**Issue 1: Drug Interaction Warning on Valid Combination**

**Symptom:** System prevents addition of medications that should be compatible.

**Solution:**
```javascript
// Check interaction database version
const dbVersion = await medications.getDrugInteractionDatabaseVersion();
console.log('Database version:', dbVersion.version);
console.log('Last updated:', dbVersion.lastUpdated);

// Manually verify with provider
await medications.requestProviderOverride({
  medicationId: medId,
  reason: 'Provider verified safe combination',
  provider: providerId,
  signature: providerSignature
});
```

---

**Issue 2: Adherence Calculation Incorrect**

**Symptom:** Calculated adherence percentage doesn't match manual count.

**Solution:**
```javascript
// Check adherence records
const adherenceRecords = await medications.getAdherenceRecords({
  medicationId: medId,
  patientId: patientId,
  startDate: startDate,
  endDate: endDate
});

console.log('Total scheduled doses:', adherenceRecords.total);
console.log('Doses taken:', adherenceRecords.taken);
console.log('Doses missed:', adherenceRecords.missed);

// Recalculate
const percentage = (adherenceRecords.taken / adherenceRecords.total) * 100;
```

---

**Issue 3: Audit Log Encryption Key Mismatch**

**Symptom:** Cannot decrypt historical audit logs.

**Solution:**
```javascript
// Rotate encryption key and re-encrypt
await medications.rotateEncryptionKey({
  newKey: newEncryptionKey,
  oldKey: oldEncryptionKey,
  reencryptExisting: true,
  retryFailed: true
});
```

---

**Issue 4: FDA Submission Preparation Fails**

**Symptom:** FDA submission generation encounters errors.

**Solution:**
```javascript
// Validate submission data
const validation = await medications.validateFDASubmissionData({
  submissionType: 'Annual Report',
  year: 2026
});

if (!validation.isValid) {
  console.error('Validation errors:');
  validation.errors.forEach(err => {
    console.error(`- ${err.field}: ${err.message}`);
  });
}

// Generate submission with detailed logging
const submission = await medications.prepareFDASubmission({
  submissionType: 'Annual Report',
  year: 2026,
  verbose: true,
  validateBeforeSubmit: true
});
```

---

### Support Resources

- **Documentation:** https://docs.mindtrackapi.com/medications
- **API Reference:** https://api.mindtrackapi.com/docs/medications
- **Issue Tracker:** https://github.com/Isaloum/MindTrackAI/issues
- **Support Email:** medications-support@mindtrackapi.com
- **Community Forum:** https://community.mindtrackapi.com

---

## Appendix: Configuration Reference

### Full Environment Configuration

```env
# ====================
# MEDICATIONS MODULE
# ====================

# Database
MEDICATIONS_DB_HOST=localhost
MEDICATIONS_DB_PORT=5432
MEDICATIONS_DB_NAME=medications_db
MEDICATIONS_DB_USER=medications_user
MEDICATIONS_DB_PASSWORD=your_secure_password
MEDICATIONS_DB_SSL=true
MEDICATIONS_DB_POOL_SIZE=20
MEDICATIONS_DB_TIMEOUT=30000

# FDA Compliance
FDA_SUBMISSION_ENABLED=true
FDA_NDA_NUMBER=NDA000000XX
FDA_ESTABLISHMENT_NUMBER=0123456789
FDA_ANNUAL_REPORT_REQUIRED=true
FDA_MEDWATCH_AUTO_SUBMIT=true
FDA_MEDWATCH_THRESHOLD=severe

# Encryption & Security
ENCRYPTION_CIPHER=aes-256-gcm
ENCRYPTION_KEY=your_256_bit_encryption_key
ENCRYPTION_IV_SIZE=16
MEDICATION_DATA_ENCRYPTION=true
AUDIT_LOG_ENCRYPTION=true
KEY_ROTATION_DAYS=90

# Audit Logging
AUDIT_LOG_RETENTION_DAYS=3650
AUDIT_LOG_STORAGE=s3
AUDIT_LOG_COMPRESSION=true
AUDIT_LOG_REMOTE_ENABLED=true
AUDIT_LOG_SIGNING=true

# RxNorm Integration
RXNORM_API_ENDPOINT=https://rxnav.nlm.nih.gov/REST
RXNORM_API_KEY=your_rxnorm_api_key
RXNORM_CACHE_DURATION=86400
RXNORM_FALLBACK_ENABLED=true

# Drug Interaction Database
DRUG_INTERACTION_DB=micromedex
DRUG_INTERACTION_UPDATE_FREQUENCY=daily
DRUG_INTERACTION_THRESHOLD=serious

# HIPAA Compliance
HIPAA_ENCRYPTION_ENABLED=true
HIPAA_AUDIT_ENABLED=true
HIPAA_BREACH_NOTIFICATION=true
HIPAA_AUDIT_LOG_RETENTION_YEARS=6

# GDPR Compliance
GDPR_COMPLIANCE_MODE=true
GDPR_DATA_RETENTION_MONTHS=60
GDPR_RIGHT_TO_DELETION=true

# Alerting
ADHERENCE_ALERT_THRESHOLD=80
INTERACTION_ALERT_SEVERITY=serious
SIDE_EFFECT_ALERT_THRESHOLD=moderate
ALERT_NOTIFICATION_CHANNELS=email,sms,push

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_RETENTION_DAYS=30

# Performance
MEDICATIONS_CACHE_ENABLED=true
MEDICATIONS_CACHE_TTL=3600
BATCH_OPERATION_SIZE=1000
ASYNC_PROCESSING_ENABLED=true
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-12 | Initial release with FDA compliance, audit logging, and full API support |

---

**Document Classification:** OFFICIAL  
**Confidentiality Level:** INTERNAL USE ONLY  
**Last Reviewed:** 2026-01-12  
**Next Review Date:** 2026-07-12  

For questions or concerns, please contact the MindTrackAI Medications Team.
