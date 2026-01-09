# 🏥 StepSyncAI - Personal Health & Wellness Platform

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-3b82f6?style=for-the-badge&logo=google-chrome)](https://isaloum.github.io/StepSyncAI)
[![GitHub](https://img.shields.io/badge/GitHub-View%20Source-181717?style=for-the-badge&logo=github)](https://github.com/Isaloum/StepSyncAI)


[![Tests](https://img.shields.io/badge/tests-1927%20passing-brightgreen)](https://github.com/Isaloum/StepSyncAI)
[![Coverage](https://img.shields.io/badge/coverage-82.55%25-green)](https://github.com/Isaloum/StepSyncAI)
[![Node](https://img.shields.io/badge/node-18.x%20%7C%2020.x-brightgreen)](https://nodejs.org/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-passing-brightgreen)](https://github.com/Isaloum/StepSyncAI/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**A production-grade health tracking platform with 6 integrated applications, 1,927 automated tests, and comprehensive CI/CD pipeline.**

🎯 **[Try it now → https://isaloum.github.io/StepSyncAI](https://isaloum.github.io/StepSyncAI)

[Architecture](#-architecture) • [Features](#-features) • [Tech Stack](#-tech-stack)

</div>

---

## 🎯 What Is This?

A full-stack health and wellness platform that integrates **6 specialized applications** into one unified system. Built with **test-driven development** (82% coverage, 1,927 tests), **CI/CD automation**, and **production-ready** code quality.

### 🚀 Quick Stats

```
📊 1,927 Automated Tests (100% passing)
🎯 82.55% Test Coverage
⚡ 37 Test Suites
🔒 0 Security Vulnerabilities
🤖 CI/CD with GitHub Actions (Node 18.x & 20.x)
📦 6 Integrated Applications
```

---

## ✨ Features At A Glance

| Application | Purpose | Key Features |
|------------|---------|--------------|
| 🧠 **Mental Health Tracker** | PTSD/trauma recovery support | Mood tracking, symptom monitoring, correlation analysis, insights |
| 💊 **Medication Tracker** | Medication management | Adherence tracking, drug interaction warnings (65+ interactions), reminders |
| 😴 **Sleep Tracker** | Sleep pattern analysis | Quality tracking, duration analysis, sleep debt calculation |
| 🏃 **Exercise Tracker** | Fitness monitoring | Activity logging, goal tracking, intensity levels |
| 📊 **Daily Dashboard** | Unified wellness overview | 0-100 wellness score, correlations, trends, smart recommendations |
| ☁️ **AWS Study Guide** | Cloud certification prep | 20+ concepts, practice quizzes, progress tracking |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    StepSyncAI Platform                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Mental Health │    │   Medication    │    │    Sleep     │
│     Tracker     │    │     Tracker     │    │   Tracker    │
│                 │    │                 │    │              │
│  • Mood logs    │    │  • Med schedule │    │  • Duration  │
│  • Symptoms     │    │  • Adherence    │    │  • Quality   │
│  • Insights     │    │  • Interactions │    │  • Patterns  │
└────────┬────────┘    └────────┬────────┘    └──────┬───────┘
         │                      │                     │
         └──────────────────────┼─────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   Daily Dashboard API   │
                    │                         │
                    │  • Data Aggregation     │
                    │  • Wellness Scoring     │
                    │  • Correlation Engine   │
                    │  • Trend Analysis       │
                    │  • Smart Recommendations│
                    └───────────┬─────────────┘
                                │
         ┌──────────────────────┼─────────────────────┐
         │                      │                     │
┌────────▼────────┐    ┌────────▼────────┐    ┌─────▼──────┐
│    Exercise     │    │   AWS Learning  │    │  Reminder  │
│    Tracker      │    │      Guide      │    │  Service   │
│                 │    │                 │    │            │
│  • Activities   │    │  • Lessons      │    │  • Cron    │
│  • Goals        │    │  • Quizzes      │    │  • Notifs  │
│  • Intensity    │    │  • Progress     │    │  • Alerts  │
└─────────────────┘    └─────────────────┘    └────────────┘

           ┌──────────────────────────────────┐
           │    Data Layer (JSON Storage)     │
           │                                  │
           │  • Local-first architecture      │
           │  • Privacy-preserving            │
           │  • Backup & restore support      │
           └──────────────────────────────────┘

           ┌──────────────────────────────────┐
           │      CI/CD Pipeline              │
           │                                  │
           │  • GitHub Actions                │
           │  • Multi-version testing         │
           │  • Security audits               │
           │  • Quality gates                 │
           └──────────────────────────────────┘
```

---

## 💻 Tech Stack

### **Backend & Core**
- ![Node.js](https://img.shields.io/badge/Node.js-18.x%20%7C%2020.x-green?logo=node.js) - Runtime environment
- ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript) - Modern JS features
- ![Jest](https://img.shields.io/badge/Jest-30.2.0-red?logo=jest) - Testing framework (1,927 tests!)

### **Testing & Quality**
- **Test Coverage**: 82.55% statements, 90.56% functions
- **Test Suites**: 37 comprehensive test files
- **Test Types**: Unit, integration, error handling, edge cases
- **CI/CD**: GitHub Actions with automated testing

### **Data & Storage**
- JSON-based local storage (privacy-first)
- Backup & restore system
- CSV/JSON/PDF export capabilities

### **Notifications & Scheduling**
- `node-cron` - Scheduled reminders
- `node-notifier` - Desktop notifications
- Cross-platform support (Windows, macOS, Linux)

### **CLI & Visualization**
- `chalk` - Colored terminal output
- `cli-table3` - Beautiful tables
- `asciichart` - ASCII charts & graphs
- `pdfkit` - Professional PDF reports

### **DevOps**
- GitHub Actions CI/CD
- Multi-version Node.js testing (18.x, 20.x)
- Automated security audits
- Quality gates enforcement

---

## 🎓 What I Learned

Building this project taught me:

### **Backend Development**
- ✅ RESTful API design patterns
- ✅ Data modeling and relationships
- ✅ File-based storage systems
- ✅ Error handling and validation

### **Test-Driven Development (TDD)**
- ✅ Writing comprehensive test suites (1,927 tests!)
- ✅ Achieving high test coverage (82%+)
- ✅ Unit vs integration testing strategies
- ✅ Mocking and test isolation

### **DevOps & CI/CD**
- ✅ GitHub Actions workflows
- ✅ Multi-environment testing
- ✅ Automated quality gates
- ✅ Security vulnerability scanning

### **Software Architecture**
- ✅ Modular design patterns
- ✅ Service integration
- ✅ Data aggregation & correlation
- ✅ Scalable architecture planning

### **Product Development**
- ✅ User-centric feature design
- ✅ Data privacy considerations
- ✅ Healthcare data handling
- ✅ Professional-grade documentation

---

## 🚀 Quick Start

### Prerequisites
```bash
node --version  # v18.x or v20.x required
npm --version
```

### Installation
```bash
# Clone the repository
git clone https://github.com/Isaloum/StepSyncAI.git
cd StepSyncAI

# Install dependencies
npm install

# Run tests to verify installation
npm test
```

### Usage
```bash
# Mental Health Tracker
npm run mental

# Medication Tracker
npm run med

# Daily Dashboard (unified view)
node daily-dashboard.js daily

# AWS Study Guide
npm run aws
```

---

## 📊 Testing

### Run Tests
```bash
# All tests (1,927 tests)
npm test

# With coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Coverage Breakdown

| Module | Statements | Functions | Lines |
|--------|------------|-----------|-------|
| **Mental Health** | 86.23% | 98.08% | 85.42% |
| **Medication** | 89.33% | 96.61% | 88.84% |
| **Sleep Tracker** | 88.23% | 98.18% | 87.66% |
| **Exercise** | 81.69% | 100% | 81.29% |
| **Dashboard** | 67.91% | 79.53% | 67.30% |
| **Reminder Service** | 100% 🎯 | 100% 🎯 | 100% 🎯 |
| **Overall** | **82.55%** | **90.56%** | **82.34%** |

---

## 🔄 CI/CD Pipeline

Automated quality checks on every commit:

✅ **Multi-Version Testing** - Node 18.x & 20.x
✅ **Automated Tests** - 1,927 tests run automatically
✅ **Security Audits** - Dependency vulnerability scanning
✅ **Quality Gates** - Coverage thresholds enforced
✅ **Lint Checks** - Code quality verification

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) for pipeline configuration.

---

## 📸 Screenshots

### Daily Dashboard
```
╔════════════════════════════════════════════════════════════╗
║           📊 DAILY WELLNESS DASHBOARD                      ║
╚════════════════════════════════════════════════════════════╝

📅 Monday, December 8, 2025

┌─────────────────────────────────────────────────────────┐
│  😊  OVERALL WELLNESS: 78.5/100 (78.5%) - Good          │
└─────────────────────────────────────────────────────────┘

📊 Score Breakdown:

  🧠 Mood:        [████████████████░░░░] 20/25
     Current: 8/10

  😴 Sleep:       [███████████████████░] 23.5/25
     Last: 8.0h, Quality: 9/10

  🏃 Exercise:    [████████████████░░░░] 20/25
     Today: 25 min (Goal: 30 min)

  💊 Medication:  [███████████████░░░░░] 15/25
     Adherence: 60%

💡 Today's Recommendations:
  ✅ 🌟 Your mood is looking great! Keep up the good work.
  🟡 🏃 You're averaging 25 min/day. Try to reach 30 minutes.
  🔴 💊 Medication adherence is at 60%. Consistency is key.
```

### Test Results
```
Test Suites: 37 passed, 37 total
Tests:       1927 passed, 1927 total
Snapshots:   0 total
Time:        8.5s

Coverage Summary:
  Statements   : 82.55% ( 3418/4140 )
  Branches     : 68.74% ( 968/1408 )
  Functions    : 90.56% ( 385/425 )
  Lines        : 82.34% ( 3354/4074 )
```

---

## 🏆 Key Achievements

### **Code Quality**
- 🎯 **1,927 Automated Tests** - Comprehensive test coverage
- ✅ **82.55% Coverage** - High code quality standards
- 🔒 **0 Vulnerabilities** - Security-first development
- 🤖 **CI/CD Pipeline** - Automated quality gates

### **Features**
- 📊 **6 Integrated Apps** - Mental health, medication, sleep, exercise, dashboard, AWS learning
- 🔗 **Correlation Engine** - Discover patterns in health data
- 📈 **Trend Analysis** - 8-week progress visualization
- 💡 **Smart Insights** - AI-like pattern detection
- ⚠️ **Drug Interactions** - 65+ dangerous interaction warnings

### **Architecture**
- 🏗️ **Modular Design** - Clean separation of concerns
- 📦 **Service Integration** - Unified dashboard API
- 🔄 **Backup System** - Data protection & recovery
- 📤 **Multi-Format Export** - CSV, JSON, PDF with charts

---

## 📦 Project Structure

```
StepSyncAI/
├── 📁 __tests__/               # 37 test suites, 1927 tests
│   ├── mental-health-tracker.test.js
│   ├── medication-tracker.test.js
│   ├── daily-dashboard.test.js
│   └── ... (34 more test files)
│
├── 🏥 Core Applications
│   ├── mental-health-tracker.js    # 92K lines - comprehensive tracker
│   ├── medication-tracker.js       # 55K lines - drug interaction system
│   ├── sleep-tracker.js           # 19K lines - sleep analysis
│   ├── exercise-tracker.js        # 10K lines - fitness tracking
│   ├── daily-dashboard.js         # 192K lines - unified platform
│   └── aws-for-kids.js           # 85K lines - AWS certification prep
│
├── 🔧 Services & Utils
│   ├── reminder-service.js        # 100% test coverage!
│   ├── backup-manager.js
│   ├── export-manager.js
│   ├── analytics-engine.js
│   └── validation-utils.js
│
├── ⚙️ Configuration
│   ├── .github/workflows/ci.yml  # CI/CD pipeline
│   ├── package.json
│   └── eslint.config.js
│
└── 📚 Documentation
    ├── README.md                 # This file
    ├── TESTING_README.md        # Testing guide
    └── CONTRIBUTING.md          # Contribution guidelines
```

---

## 🔮 Future Roadmap

### **Phase 1: AWS Deployment** (Next)
- [ ] Convert to serverless architecture (Lambda + DynamoDB)
- [ ] Deploy to AWS with API Gateway
- [ ] Add Cognito authentication
- [ ] Setup CloudWatch monitoring

### **Phase 2: Web Interface**
- [ ] React frontend
- [ ] Real-time data sync
- [ ] Responsive mobile design
- [ ] Progressive Web App (PWA)

### **Phase 3: Advanced Features**
- [ ] Multi-user support
- [ ] Machine learning insights
- [ ] Health device integration
- [ ] Telemedicine integration

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new features
4. Ensure tests pass (`npm test`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Quality Standards
- ✅ All tests must pass
- ✅ Maintain 80%+ test coverage
- ✅ Follow existing code style
- ✅ Update documentation

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with ❤️ to support personal health, wellness, and professional development.

**Technologies Used:**
- Node.js for runtime
- Jest for testing framework
- GitHub Actions for CI/CD
- Various NPM packages for functionality

**Special Thanks:**
- Mental health professionals who inspired this project
- Open source community for amazing tools
- Healthcare workers on the front lines

---

## 📞 Contact & Support

### Project Links
- **GitHub**: [Isaloum/StepSyncAI](https://github.com/Isaloum/StepSyncAI)
- **Issues**: [Report a Bug](https://github.com/Isaloum/StepSyncAI/issues)
- **Discussions**: [Feature Requests](https://github.com/Isaloum/StepSyncAI/discussions)

### Mental Health Resources
- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **SAMHSA National Helpline**: 1-800-662-4357

---

## 📈 Project Stats

![GitHub stars](https://img.shields.io/github/stars/Isaloum/StepSyncAI?style=social)
![GitHub forks](https://img.shields.io/github/forks/Isaloum/StepSyncAI?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/Isaloum/StepSyncAI?style=social)

**Version**: 3.12.0
**Status**: ✅ Active Development
**Last Updated**: December 2025
**Test Suite**: 1,927 tests passing
**Coverage**: 82.55%

---

<div align="center">

**⚠️ Important Note**

This tool is designed to support your wellness journey,
not replace professional medical care.
Always consult healthcare professionals for medical advice.

---


</div>
## 👨‍💻 Author

**Ihab Saloum**

[![GitHub](https://img.shields.io/badge/GitHub-Isaloum-181717?style=flat&logo=github)](https://github.com/Isaloum)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/ihab-saloum-170618ba/)
[![Portfolio](https://img.shields.io/badge/Portfolio-More%20Projects-3b82f6?style=flat)](https://github.com/Isaloum)

*Building production-grade applications • Test-Driven Development • AWS Cloud Solutions*

---

## ⭐ Support

If this project helped with your wellness journey or inspired your own projects:
- ⭐ [Star this repository](https://github.com/Isaloum/StepSyncAI)
- 🔀 Share it with others
- 📝 Provide feedback via issues
- 🤝 Contribute improvements

</div>
