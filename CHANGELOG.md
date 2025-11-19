# Changelog

All notable changes to StepSyncAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Backup and restore functionality for Sleep Tracker
- CSV export for Sleep Tracker
- Backup and restore functionality for Exercise Tracker
- CSV export for Exercise Tracker
- CHANGELOG.md file for version tracking

## [3.11.0] - 2024-11-19

### Added
- **Comprehensive Test Coverage** (87 new tests)
  - 40 tests for AWS Gamification System
  - 30 tests for Therapy Session Manager
  - 20 tests for Medication Refill Tracking
- Improved coverage from 79.46% to 82.99%
- Updated coverage thresholds (82% statements, 95% functions, 66% branches)

### Changed
- Updated CI workflow with new coverage stats
- Updated README badges (1,063 tests passing)

## [3.10.0] - 2024-11-18

### Added
- **Medication Refill Tracking System**
  - Pill count management and auto-decrement
  - Days remaining calculations for all frequencies
  - Refill alerts (low stock and out of stock)
  - Refill status dashboard
  - Refill medication command
- **AWS Gamification System**
  - Points and level progression
  - Study streak tracking
  - Badge system for topic completion
  - Achievement system (15+ achievements)
  - Gamification stats display
- **Therapy Session Manager**
  - Therapist contact management
  - Session scheduling (intake, regular, followup, crisis)
  - Pre-session mood tracking and notes
  - Post-session completion with effectiveness ratings
  - Mood impact analysis
  - Therapy analytics by therapist

### Changed
- Adjusted coverage thresholds for new features
- Updated CI workflow stats

### Fixed
- Test timing issues in medication tracker
- Coverage calculation adjustments

## [3.9.0] - 2024-11-17

### Added
- **Professional PDF Export** to Daily Dashboard
  - Multi-page wellness reports
  - Charts and visualizations using PDFKit
  - Comprehensive health data summary
  - 7-day wellness trends
  - Component scores breakdown

### Fixed
- Security vulnerabilities in glob and js-yaml dependencies
- CI workflow file checks

## [3.8.0] - 2024-11-16

### Added
- **Data Visualization Suite** to Daily Dashboard
  - Interactive HTML exports with Chart.js
  - Line charts for wellness trends
  - Bar charts for component scores
  - Visual progress indicators
  - Responsive chart design
- **Enhanced Dashboard UI**
  - ASCII charts for wellness trends
  - Visual progress bars
  - Color-coded scores
  - Sparklines for quick insights

### Changed
- Updated README with visualization documentation
- Enhanced dashboard display with better formatting

## [3.7.0] - 2024-11-15

### Added
- **Export & Reporting Features** to Daily Dashboard
  - JSON export (complete data dump)
  - CSV export (Excel-compatible daily records)
  - Text report generation
  - Customizable export periods
- **Wellness Insights**
  - Pattern detection (day-of-week analysis)
  - Streak tracking
  - Predictive wellness scores
  - Personalized recommendations
- **Goal Setting & Milestones**
  - SMART goal framework
  - Progress tracking with percentages
  - Milestone rewards and celebration
  - On-track analysis

### Changed
- Updated test badge (945 passing tests)

## [3.6.0] - 2024-11-14

### Added
- **Wellness Trends & Progress Tracking**
  - 8-week wellness trend visualization
  - Historical score comparison
  - Improvement/decline detection
  - ASCII line charts
- **Correlation Analysis**
  - Sleep → Mood correlation
  - Exercise → Mood correlation
  - Medication adherence → Mood correlation
  - Statistical relationship detection

### Changed
- Enhanced daily summary with more insights
- Improved wellness score calculation

## [3.5.0] - 2024-11-13

### Added
- **Daily Dashboard**
  - Unified wellness overview
  - Wellness score calculation (0-100)
  - Component scores (mood, sleep, exercise, medication)
  - Daily and weekly summaries
  - Smart recommendations (3 priority levels)
  - Data aggregation from all trackers

## [3.4.0] - 2024-11-12

### Added
- **Sleep Tracker**
  - Sleep logging (bedtime, wake time, quality)
  - Duration calculation with overnight handling
  - Sleep statistics (averages, best/worst nights)
  - Sleep debt calculation
  - Schedule consistency analysis
  - Insights and pattern detection
  - Day-of-week sleep patterns
  - Integration with Daily Dashboard
- **Exercise Tracker**
  - Exercise logging (type, duration, intensity)
  - 3 intensity levels (low, moderate, high)
  - 30-minute daily goal tracking
  - Exercise history and statistics
  - Activity breakdown by intensity
  - Smart feedback system
  - Integration with Daily Dashboard

### Changed
- Updated README with new tracker documentation
- Enhanced wellness suite integration

## [3.3.0] - 2024-11-10

### Added
- **Drug Interaction Warnings** to Medication Tracker
  - 65+ drug interactions in database
  - 3 severity levels (Minor, Moderate, Severe)
  - Automatic interaction checks
  - Color-coded warnings
  - Safety recommendations

## [3.2.0] - 2024-11-08

### Added
- **Insights & Correlation Analysis** to Mental Health Tracker
  - Trigger-mood impact analysis
  - Symptom pattern detection
  - Temporal insights (best/worst days)
  - Coping strategy effectiveness ranking
  - Symptom clustering analysis

## [3.1.0] - 2024-11-06

### Added
- **Data Visualization** to Mental Health Tracker
  - Mood trends with charts and sparklines
  - Symptom pattern heatmaps
  - Recovery progress dashboard
  - Statistics summaries
- **CSV Export** for Mental Health Tracker
  - Mood entries export
  - Journal entries export
  - Symptoms export
  - Triggers export
  - Coping strategies export
  - Emergency contacts export

## [3.0.0] - 2024-11-04

### Added
- **Medication Tracker**
  - Medication management (add, edit, deactivate)
  - Dosage and schedule tracking
  - Mark doses as taken
  - Daily status check
  - Adherence tracking
  - Reminder notifications
  - History view
  - Statistics and insights
  - CSV export
  - Backup/restore functionality

### Changed
- Major version bump for complete medication management system

## [2.5.0] - 2024-11-02

### Added
- **AWS For Kids** - Interactive AWS Cloud Practitioner exam preparation
  - 21 AWS concepts with kid-friendly explanations
  - Practice quizzes with customizable question counts
  - Progress tracking by topic
  - Study guide with all concepts
  - Category filtering (Compute, Storage, Database, etc.)
  - Learning dashboard with exam readiness
  - CSV export for progress
  - Backup/restore functionality

## [2.0.0] - 2024-10-30

### Added
- **Mental Health Tracker**
  - Profile setup with accident tracking
  - Mood logging (1-10 scale)
  - Journal entries (4 types)
  - Symptom tracking (11 types)
  - Trigger identification
  - Coping strategies with effectiveness rating
  - Recovery goals
  - Emergency contacts
  - Daily check-ins
  - Backup/restore functionality
  - Comprehensive help system

### Changed
- Major version bump for first production-ready release
- Established project structure and CI/CD pipeline

## [1.0.0] - 2024-10-25

### Added
- Initial project setup
- Basic file structure
- Jest testing framework
- GitHub Actions CI/CD
- ESLint configuration
- README documentation
- MIT License

### Changed
- Established development workflow

---

## Version Numbering

StepSyncAI follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0): Incompatible API changes or major new apps
- **MINOR** version (0.X.0): New features in a backwards-compatible manner
- **PATCH** version (0.0.X): Backwards-compatible bug fixes

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Create git tag: `git tag -a v3.11.0 -m "Version 3.11.0"`
4. Push tag: `git push origin v3.11.0`
5. Create GitHub Release with changelog

## Links

- [Repository](https://github.com/Isaloum/StepSyncAI)
- [Issues](https://github.com/Isaloum/StepSyncAI/issues)
- [Pull Requests](https://github.com/Isaloum/StepSyncAI/pulls)
