# StepSyncAI Architecture Documentation

## Overview

StepSyncAI is a modular health and wellness platform built with a service-oriented architecture. The system consists of 6 independent applications that integrate through a unified dashboard API.

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      StepSyncAI Platform                          │
│                  Production-Grade Health Platform                 │
└──────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │   User CLI   │
                         └──────┬───────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌─────────▼────────┐    ┌───────▼────────┐
│  Mental Health │    │   Medication     │    │  Sleep Tracker │
│    Tracker     │    │     Tracker      │    │                │
│                │    │                  │    │                │
│ • Mood logging │    │ • Med scheduling │    │ • Duration     │
│ • Symptoms     │    │ • Adherence      │    │ • Quality      │
│ • Insights     │    │ • Drug warnings  │    │ • Patterns     │
│ • Correlations │    │ • Reminders      │    │ • Analysis     │
└────────┬───────┘    └────────┬─────────┘    └────────┬───────┘
         │                     │                       │
         │         ┌───────────▼────────────┐          │
         └─────────►   Daily Dashboard API  ◄──────────┘
                   │                        │
                   │ • Data Aggregation     │
                   │ • Wellness Scoring     │
                   │ • Correlation Engine   │
                   │ • Trend Analysis       │
                   │ • Smart Recommendations│
                   │ • Export System        │
                   └───────────┬────────────┘
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐   ┌────────▼────────┐   ┌──────▼─────┐
│    Exercise     │   │  AWS Learning   │   │  Reminder  │
│    Tracker      │   │      Guide      │   │  Service   │
│                 │   │                 │   │            │
│ • Activity log  │   │ • Lessons       │   │ • Cron     │
│ • Goals         │   │ • Quizzes       │   │ • Notifs   │
│ • Intensity     │   │ • Progress      │   │ • Alerts   │
└─────────────────┘   └─────────────────┘   └────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         Data Layer                                │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  JSON Files │  │   Backups   │  │   Exports   │             │
│  │             │  │             │  │             │             │
│  │ • Local     │  │ • Timestamped│ │ • CSV/JSON  │             │
│  │ • Private   │  │ • Versioned  │ │ • PDF       │             │
│  │ • Encrypted │  │ • Restorable │ │ • Reports   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      CI/CD & Quality                              │
│                                                                   │
│  GitHub Actions → Tests (1,927) → Coverage (82%) → Deploy        │
│                                                                   │
│  • Multi-version testing (Node 18.x, 20.x)                       │
│  • Automated security audits                                     │
│  • Quality gates enforcement                                     │
└──────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Mental Health Tracker
**Purpose**: Comprehensive PTSD/trauma recovery support

**Features**:
- Mood tracking with 1-10 scale
- Symptom monitoring (11 types)
- Trigger identification
- Coping strategy management
- Journal entries (4 types)
- Correlation analysis

**Data**: `mental-health-data.json`

**Lines of Code**: ~92,000

### 2. Medication Tracker
**Purpose**: Medication management and adherence

**Features**:
- Medication scheduling
- Adherence tracking
- Drug interaction warnings (65+ interactions)
- Reminder system
- History tracking

**Data**: `medications.json`

**Lines of Code**: ~55,000

### 3. Sleep Tracker
**Purpose**: Sleep pattern monitoring

**Features**:
- Bedtime/wake time logging
- Quality ratings (1-10)
- Duration calculation
- Sleep debt tracking
- Weekly insights

**Data**: `sleep-data.json`

**Lines of Code**: ~19,000

### 4. Exercise Tracker
**Purpose**: Physical activity monitoring

**Features**:
- Activity logging
- Intensity levels (low/moderate/high)
- Goal tracking (30 min/day)
- Exercise history
- Statistics

**Data**: `exercise-data.json`

**Lines of Code**: ~10,000

### 5. Daily Dashboard (Central Hub)
**Purpose**: Unified wellness overview and data aggregation

**Features**:
- Wellness scoring (0-100)
- Data aggregation from all trackers
- Correlation analysis (sleep/exercise/medication → mood)
- Trend analysis (8-week visualization)
- Goal setting & tracking
- Smart recommendations
- Export system (CSV/JSON/PDF)

**Data**: `dashboard-goals.json`

**Lines of Code**: ~192,000

### 6. AWS Study Guide
**Purpose**: Cloud certification preparation

**Features**:
- 20+ AWS concepts explained
- Practice quizzes
- Progress tracking
- Exam readiness scoring

**Data**: `aws-learning-progress.json`

**Lines of Code**: ~85,000

### 7. Reminder Service (Shared)
**Purpose**: Cross-app notification system

**Features**:
- Cron-based scheduling
- Desktop notifications
- Medication reminders
- Study reminders
- Journal prompts

**Test Coverage**: 100% 🎯

**Lines of Code**: ~9,600

## Data Flow

### 1. Data Collection
```
User Input → CLI → Tracker → JSON File → Validation → Storage
```

### 2. Data Aggregation
```
All Trackers → Dashboard API → Aggregation Engine → Unified View
```

### 3. Correlation Analysis
```
Historical Data → Statistical Engine → Pearson Correlation → Insights
```

### 4. Export Pipeline
```
Dashboard Data → Export Manager → Format Converter → CSV/JSON/PDF
```

## API Design

### Mental Health Tracker API
```javascript
// Mood logging
tracker.logMood(rating, notes)

// Symptom tracking
tracker.logSymptom(type, severity, notes)

// Get insights
tracker.getInsights(days)

// Correlations
tracker.analyzeCorrelations(days)
```

### Medication Tracker API
```javascript
// Add medication
tracker.addMedication(name, dosage, frequency, times)

// Mark as taken
tracker.takeMedication(id, notes)

// Check interactions
tracker.checkInteractions()

// Get adherence
tracker.getAdherence(days)
```

### Dashboard API
```javascript
// Get wellness score
dashboard.calculateWellnessScore(date)

// Get correlations
dashboard.analyzeCorrelations(days)

// Get trends
dashboard.getTrends(weeks)

// Export data
dashboard.export(format, days)
```

## Testing Architecture

### Test Coverage
```
Total Tests: 1,927
Test Suites: 37
Coverage: 82.55% statements, 90.56% functions
```

### Test Types
1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Multi-component workflows
3. **Error Handling Tests**: Edge cases and failures
4. **Performance Tests**: Response time benchmarks

### CI/CD Pipeline
```
Push → GitHub Actions → Install → Lint → Test → Coverage → Security Audit
```

## Data Models

### Mood Entry
```json
{
  "timestamp": "2025-12-08T12:00:00",
  "mood": 8,
  "notes": "Feeling great today",
  "triggers": [],
  "symptoms": []
}
```

### Medication
```json
{
  "id": 1234567890,
  "name": "Aspirin",
  "dosage": "100mg",
  "frequency": "daily",
  "times": ["08:00"],
  "active": true
}
```

### Sleep Log
```json
{
  "date": "2025-12-08",
  "bedtime": "23:00",
  "wakeTime": "07:00",
  "duration": 8.0,
  "quality": 9,
  "notes": "Slept well"
}
```

### Exercise Session
```json
{
  "date": "2025-12-08",
  "type": "Running",
  "duration": 30,
  "intensity": "high",
  "notes": "Morning jog"
}
```

## Security Considerations

### Data Privacy
- **Local Storage**: All data stored locally (no cloud)
- **No External APIs**: No data sent to third parties
- **File Permissions**: Data files have restricted access
- **Backup Encryption**: Optional encryption for backups

### Input Validation
- Type checking on all inputs
- Range validation (e.g., mood 1-10)
- SQL injection prevention (N/A - no SQL)
- XSS prevention for future web version

## Performance Optimization

### Caching Strategy
- **Performance Cache**: 100 entries, 5-minute TTL
- **Query Results**: Cached for repeated requests
- **Correlation Calculations**: Memoized results

### Data Limits
- **Max History**: 10,000 entries per tracker
- **Max Export**: 365 days
- **Max Backup Size**: 100MB

## Scalability Plan

### Current: Local-First (Phase 0)
- Single user
- Local JSON storage
- CLI interface

### Phase 1: AWS Serverless
```
Lambda Functions → API Gateway → DynamoDB → CloudFront
```

### Phase 2: Multi-User Web App
```
React Frontend → REST API → PostgreSQL → Redis Cache
```

### Phase 3: Mobile & IoT
```
React Native App → GraphQL API → Microservices → Kafka
```

## Dependencies

### Core Dependencies
- **Node.js**: 18.x or 20.x
- **chalk**: ^4.1.2 (CLI colors)
- **cli-table3**: ^0.6.5 (Tables)
- **node-cron**: ^4.2.1 (Scheduling)
- **node-notifier**: ^10.0.1 (Notifications)
- **pdfkit**: ^0.17.2 (PDF export)
- **asciichart**: ^1.5.25 (Charts)

### Dev Dependencies
- **jest**: ^30.2.0 (Testing framework)

## Deployment Guide

### Current (Local)
```bash
npm install
npm test
npm run mental  # or other apps
```

### Future (AWS)
```bash
# Convert to Lambda
serverless deploy

# Setup DynamoDB
aws dynamodb create-table --table-name wellness-data

# Deploy API Gateway
aws apigateway create-rest-api --name StepSyncAI
```

## Monitoring & Logging

### Current
- Console logs
- Test output
- Error tracking via try/catch

### Planned
- CloudWatch logs
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- User analytics (Mixpanel)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Development setup
- Coding standards
- Testing requirements
- PR process

## License

MIT License - See [LICENSE](../LICENSE)

---

**Last Updated**: December 2025
**Version**: 3.12.0
**Maintainer**: [Isaloum](https://github.com/Isaloum)
