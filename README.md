# StepSyncAI - Health & Wellness Apps

[![Tests](https://img.shields.io/badge/tests-262%20passing-brightgreen)](https://github.com/Isaloum/StepSyncAI)
[![Coverage](https://img.shields.io/badge/coverage-68%25-yellow)](https://github.com/Isaloum/StepSyncAI)
[![Node](https://img.shields.io/badge/node-18.x%20%7C%2020.x-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A comprehensive collection of personal health management and learning tools designed to support recovery, wellness, daily health tracking, and professional development.

## 📦 Apps Included

1. **🧠 Mental Health Tracker** - Comprehensive PTSD/trauma recovery support tool
2. **💊 Medication Tracker** - Simple pill reminder and adherence tracking system
3. **☁️ AWS For Kids** - Interactive AWS Cloud Practitioner exam preparation

---

## 🧠 Mental Health Tracker

A comprehensive support tool designed specifically for managing mental health challenges following workplace accidents. Track symptoms, moods, triggers, coping strategies, and recovery progress.

### Features

- **Profile Setup**: Document your accident and recovery journey
- **Mood Tracking**: Log daily moods with notes (1-10 scale)
- **Symptom Monitoring**: Track PTSD, anxiety, depression, and other symptoms
- **Journaling**: Write entries categorized by type (general, incident, therapy, progress)
- **Trigger Identification**: Record and monitor triggers with occurrence tracking
- **Coping Strategies**: Save strategies and rate their effectiveness
- **Emergency Contacts**: Quick access to therapist, crisis hotlines, and support network
- **Recovery Goals**: Set and track recovery milestones
- **Daily Check-ins**: Quick summary of your progress

### Quick Start

```bash
# Setup your profile
node mental-health-tracker.js profile-setup "2024-06-15" "Brief accident description"

# Log your mood (1-10)
node mental-health-tracker.js mood 7 "Feeling better today"

# Log a symptom
node mental-health-tracker.js symptom anxiety 6 "During meeting"

# Add a journal entry
node mental-health-tracker.js journal "Today was challenging but I made progress" progress

# Quick daily check-in
node mental-health-tracker.js checkin

# View help
node mental-health-tracker.js help
```

### Common Commands

<details>
<summary><b>Profile & Overview</b></summary>

```bash
# Setup profile
node mental-health-tracker.js profile-setup <date> <description>

# View profile
node mental-health-tracker.js profile

# Daily check-in
node mental-health-tracker.js checkin
```
</details>

<details>
<summary><b>Mood & Emotions</b></summary>

```bash
# Log mood (1-10)
node mental-health-tracker.js mood <rating> [note]

# View mood history (default 7 days)
node mental-health-tracker.js mood-history [days]
```
</details>

<details>
<summary><b>Symptoms</b></summary>

```bash
# Log symptom (severity 1-10)
# Types: anxiety, panic, flashback, nightmare, depression, insomnia,
#        irritability, avoidance, hypervigilance, concentration, physical-pain
node mental-health-tracker.js symptom <type> <severity> [note]

# View symptoms
node mental-health-tracker.js view-symptoms [days] [type]
```
</details>

<details>
<summary><b>Journal</b></summary>

```bash
# Add entry (types: general, incident, therapy, progress)
node mental-health-tracker.js journal <content> [type]

# View journal
node mental-health-tracker.js view-journal [days] [type]
```
</details>

<details>
<summary><b>Triggers, Coping, Goals</b></summary>

```bash
# Add new trigger
node mental-health-tracker.js add-trigger <description> [intensity]

# Add coping strategy
node mental-health-tracker.js add-coping <name> <description>

# Add recovery goal
node mental-health-tracker.js add-goal <description> [target-date]

# View emergency contacts
node mental-health-tracker.js contacts
```
</details>

### 📊 Data Visualizations

<details>
<summary><b>View Your Progress with Charts!</b></summary>

```bash
# Visualize mood trends over time (default 14 days)
node mental-health-tracker.js mood-trends [days]
# Shows: line chart, sparkline, statistics, and streak tracking

# Analyze symptom patterns (default 30 days)
node mental-health-tracker.js symptom-patterns [days]
# Shows: frequency bar chart, calendar heatmap, severity analysis

# View comprehensive recovery dashboard
node mental-health-tracker.js recovery-progress
# Shows: goals progress, mood improvement, coping effectiveness
```

**Features:**
- 📈 Line charts showing mood trends over time
- 📅 Calendar heatmaps for symptom activity patterns
- 🔥 Streak tracking for consistent mood logging
- 📊 Statistics boxes with key metrics
- ⚡ Sparklines for quick visual summaries
</details>

### 📤 Data Export

<details>
<summary><b>Export Your Data to CSV</b></summary>

```bash
# Export all mental health data to CSV files
node mental-health-tracker.js export [directory]

# Example: Export to custom directory
node mental-health-tracker.js export ./my-health-data
```

**Exported files include:**
- `moods.csv` - All mood ratings with dates and notes
- `journal.csv` - Journal entries by type
- `symptoms.csv` - Symptom logs with severity ratings
- `triggers.csv` - Identified triggers and occurrences
- `coping.csv` - Coping strategies and effectiveness
- `goals.csv` - Recovery goals and completion status

**Use cases:**
- 📋 Share with your therapist or healthcare provider
- 📊 Analyze trends in Excel/Google Sheets
- 💾 Backup your health data
- 📈 Track long-term recovery patterns
</details>

### Important Notes

- This is a **personal tracking tool** to support your recovery
- Always consult with mental health professionals for proper care
- In crisis, call **988** (Suicide & Crisis Lifeline) or text **HOME to 741741**
- Data stored in `mental-health-data.json` (created automatically)

---

## 💊 Medication Tracker

A simple, easy-to-use medication tracker app designed for people who need help remembering their medications.

### Features

- **Add Medications**: Track multiple medications with dosage, frequency, and scheduled times
- **Mark as Taken**: Quickly log when you take your medication
- **Daily Status Check**: See at a glance which medications you've taken today
- **History Tracking**: View your medication history over time
- **Adherence Tracking**: Monitor your medication compliance
- **Notes Support**: Add notes when taking medications (e.g., "taken with food")

### Quick Start

```bash
# Add a medication
node medication-tracker.js add "Aspirin" "100mg" "daily" "08:00"

# Check today's status
node medication-tracker.js status

# Mark a medication as taken
node medication-tracker.js take <medication-id> "taken with breakfast"

# List all medications
node medication-tracker.js list

# View medication history
node medication-tracker.js history
```

### Example Workflow

1. **Add your medications:**
   ```bash
   node medication-tracker.js add "Aspirin" "100mg" "daily" "08:00"
   node medication-tracker.js add "Vitamin D" "1000 IU" "daily" "08:00"
   node medication-tracker.js add "Blood Pressure Med" "50mg" "twice-daily" "08:00,20:00"
   ```

2. **Morning routine:**
   ```bash
   node medication-tracker.js status
   node medication-tracker.js take 1234567890 "with breakfast"
   ```

3. **Track adherence:**
   ```bash
   node medication-tracker.js history        # Last 7 days
   node medication-tracker.js history 1234567890 30  # Specific med, 30 days
   ```

### 📊 Adherence Visualization

<details>
<summary><b>Track Your Medication Compliance!</b></summary>

```bash
# View comprehensive adherence dashboard (default 30 days)
node medication-tracker.js adherence [days]
```

**Shows:**
- 🎯 Overall adherence rate with progress bars
- 💊 Per-medication adherence percentages
- 📅 Calendar heatmap of daily medication activity
- 📈 Weekly adherence trend chart
- 🔥 Perfect adherence streak tracking
- 📊 Detailed statistics (doses taken/missed)

**Example Output:**
- Visual progress bars for each medication
- Sparklines showing adherence trends
- Streak displays (e.g., "7 days perfect adherence 🔥")
- Readiness scores and recommendations
</details>

### 📤 Data Export

<details>
<summary><b>Export Your Medication Data to CSV</b></summary>

```bash
# Export all medication data to CSV files
node medication-tracker.js export [directory]

# Example: Export to custom directory
node medication-tracker.js export ./my-med-data
```

**Exported files include:**
- `medications.csv` - All medications with dosage and schedule
- `history.csv` - Complete medication history with timestamps

**Use cases:**
- 📋 Share with your doctor or pharmacist
- 📊 Analyze adherence patterns in spreadsheet software
- 💾 Backup your medication records
- 🏥 Provide accurate history for medical appointments
</details>

---

## ☁️ AWS For Kids

An interactive learning app designed to help you pass the AWS Cloud Practitioner certification exam, explained in simple terms.

### Features

- **Interactive Learning**: 20+ AWS concepts explained like you're 5 years old
- **Practice Quizzes**: Test your knowledge with exam-style questions
- **Progress Tracking**: Track which concepts you've learned
- **Study Guide**: Comprehensive exam preparation guide
- **Category Filtering**: Focus on specific AWS service categories
- **Exam-Ready Content**: Real exam concepts with kid-friendly explanations

### AWS Concepts Covered

- **Compute**: EC2, Lambda, ECS
- **Storage**: S3, EBS, EFS
- **Networking**: VPC, Route 53, CloudFront
- **Security**: IAM, Security Groups, KMS
- **Databases**: RDS, DynamoDB
- **And more!**

### Quick Start

```bash
# List all available topics
node aws-for-kids.js list

# Learn a concept
node aws-for-kids.js learn ec2

# Take a practice quiz
node aws-for-kids.js quiz 10

# Check your progress
node aws-for-kids.js progress

# View study guide
node aws-for-kids.js guide
```

### Example Learning Path

1. **Start with core services:**
   ```bash
   node aws-for-kids.js learn ec2
   node aws-for-kids.js learn s3
   node aws-for-kids.js learn iam
   ```

2. **Take practice quizzes:**
   ```bash
   node aws-for-kids.js quiz 5
   ```

3. **Track your progress:**
   ```bash
   node aws-for-kids.js progress
   ```

4. **Review exam guide:**
   ```bash
   node aws-for-kids.js guide
   ```

### 📊 Learning Progress Dashboard

<details>
<summary><b>Visualize Your Exam Readiness!</b></summary>

```bash
# View comprehensive learning dashboard
node aws-for-kids.js dashboard
```

**Shows:**
- 📚 Topic mastery progress by category (Compute, Storage, Database, etc.)
- 🎯 Quiz performance trends with line charts
- ⚡ Sparklines for quick performance overview
- 🏆 Exam readiness assessment (0-100 score)
- 📈 Score distribution (Excellent/Good/Needs Work)
- 🔥 Study streak tracking
- 💡 Personalized recommendations

**Readiness Criteria:**
- Topic Coverage (40 points): % of topics completed
- Quiz Performance (40 points): Average quiz scores
- Practice Consistency (20 points): Number of quizzes taken

**Assessment Levels:**
- 80%+ Ready: Schedule your exam with confidence! 🎉
- 60-79% Almost there: A bit more practice needed ⚠️
- <60% Keep studying: You're making progress! 📚
</details>

### 📤 Data Export

<details>
<summary><b>Export Your Learning Progress to CSV</b></summary>

```bash
# Export all AWS learning data to CSV files
node aws-for-kids.js export [directory]

# Example: Export to custom directory
node aws-for-kids.js export ./my-aws-progress
```

**Exported files include:**
- `quiz-scores.csv` - All quiz attempts with scores and percentages
- `completed-lessons.csv` - Topics you've completed
- `progress.csv` - Study progress by topic

**Use cases:**
- 📋 Track your certification study progress
- 📊 Analyze quiz performance trends
- 💾 Backup your learning history
- 📈 Share progress with study partners or mentors
</details>

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18.x or 20.x
- npm (comes with Node.js)

### Install Dependencies

```bash
npm install
```

### Run Apps

```bash
# Mental Health Tracker
npm run mental

# Medication Tracker
npm run med

# AWS Learning
npm run aws
```

---

## 🧪 Testing

This project has comprehensive test coverage with **229 tests** covering all functionality.

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (re-runs on changes)
npm run test:watch

# Run specific test suite
npx jest __tests__/mental-health-tracker.test.js
```

### Test Coverage

| Module | Statements | Functions | Lines |
|--------|------------|-----------|-------|
| **Mental Health Tracker** | 55.63% | 63.63% | 55.18% |
| **Medication Tracker** | 76.22% | 90.9% 🌟 | 75% |
| **AWS For Kids** | 57.31% | 65% | 57.4% |
| **Overall** | **59.75%** | **70.1%** | **59.25%** |

### Test Documentation

- See [TESTING_README.md](TESTING_README.md) for complete testing guide
- See [TESTING_REPORT.md](TESTING_REPORT.md) for detailed coverage analysis

---

## 🔄 CI/CD

This project uses GitHub Actions for continuous integration:

- ✅ Automated testing on every push
- ✅ Multi-version testing (Node 18.x & 20.x)
- ✅ Coverage reports generated automatically
- ✅ Security audits
- ✅ Quality gates enforcement

Workflow file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

## 📁 Project Structure

```
StepSyncAI/
├── mental-health-tracker.js      # Mental health tracking app
├── medication-tracker.js         # Medication management app
├── aws-for-kids.js              # AWS learning app
├── index.js                      # Original step logger
├── __tests__/                    # Test suites
│   ├── mental-health-tracker.test.js  # 72 tests
│   ├── medication-tracker.test.js     # 56 tests
│   ├── aws-for-kids.test.js          # 50 tests
│   ├── integration.test.js           # 24 workflow tests
│   └── error-handling.test.js        # 27 error tests
├── .github/
│   └── workflows/
│       └── ci.yml                # CI/CD pipeline
├── package.json                  # Dependencies & scripts
├── TESTING_README.md            # Testing documentation
├── TESTING_REPORT.md            # Coverage analysis
└── README.md                     # This file
```

---

## 💾 Data Storage

Each app stores its data in JSON files:

- `mental-health-data.json` - Mental health tracking data
- `medications.json` - Medication records
- `aws-learning-progress.json` - Learning progress

**Privacy Note**: All data is stored locally on your machine. Nothing is sent to external servers.

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `npm test` (ensure all pass)
5. **Check coverage**: `npm run test:coverage`
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Development Guidelines

- Write tests for new features
- Maintain test coverage above 55%
- Follow existing code style
- Update documentation
- All tests must pass before merging

---

## 📊 Code Quality

### Testing Standards

- ✅ 229 comprehensive tests
- ✅ Unit tests for all core functions
- ✅ Integration tests for complete workflows
- ✅ Error handling tests
- ✅ Edge case coverage
- ✅ Fast execution (~2 seconds)

### Quality Gates

- Minimum 55% statement coverage
- Minimum 45% branch coverage
- Minimum 65% function coverage
- All tests passing
- No high-severity vulnerabilities

---

## 🛠️ NPM Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:old` | Run legacy demo scripts |
| `npm run mental` | Start mental health tracker |
| `npm run med` | Start medication tracker |
| `npm run aws` | Start AWS learning app |

---

## 📖 Documentation

- [TESTING_README.md](TESTING_README.md) - Complete testing guide
- [TESTING_REPORT.md](TESTING_REPORT.md) - Detailed coverage analysis
- [PR_DESCRIPTION.md](PR_DESCRIPTION.md) - Latest improvements summary

---

## 🔮 Future Enhancements

### Planned Features

- [ ] CLI interface tests (target: 70%+ coverage)
- [x] Data export functionality (CSV) ✓
- [ ] PDF export with charts and graphs
- [ ] Reminder notifications
- [ ] Data visualization (charts, graphs)
- [ ] Multi-user support
- [ ] Cloud sync option
- [ ] Mobile app version
- [ ] Integration with health devices

### Testing Improvements

- [ ] Increase branch coverage to 60%+
- [ ] Add performance benchmarks
- [ ] Snapshot testing for outputs
- [ ] Mutation testing

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🆘 Support & Resources

### Mental Health Resources

- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **SAMHSA National Helpline**: 1-800-662-4357

### Project Support

- Report bugs: [GitHub Issues](https://github.com/Isaloum/StepSyncAI/issues)
- Feature requests: [GitHub Discussions](https://github.com/Isaloum/StepSyncAI/discussions)

---

## 📈 Project Status

**Version**: 3.0.0
**Status**: ✅ Active Development
**Test Coverage**: 60%
**Tests**: 229 passing
**CI/CD**: ✅ Automated

---

## 🙏 Acknowledgments

Built with ❤️ to support personal health, wellness, and professional development.

**Remember**: These tools are meant to support your wellness journey, not replace professional medical care. Always consult healthcare professionals for medical advice.

---

<p align="center">
  <strong>Stay healthy, stay learning! 🌟</strong>
</p>
