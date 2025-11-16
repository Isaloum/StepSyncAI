# Contributing to StepSyncAI

Thank you for your interest in contributing to StepSyncAI! This document provides guidelines and instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)

---

## 🤝 Code of Conduct

This project is intended to support people's health and wellness. Please be respectful, empathetic, and constructive in all interactions.

### Our Pledge

- Be welcoming and inclusive
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy toward others

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or 20.x
- npm (comes with Node.js)
- Git
- A GitHub account

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/StepSyncAI.git
   cd StepSyncAI
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Isaloum/StepSyncAI.git
   ```

---

## 💻 Development Setup

### Install Dependencies

```bash
npm install
```

### Verify Setup

```bash
# Run all tests (579 tests should pass)
npm test

# Run with coverage (should show 85%+)
npm run test:coverage

# Watch mode for development
npm run test:watch
```

**Expected output:**
```
Test Suites: 10 passed, 10 total
Tests:       579 passed, 579 total
Coverage:    85%+
```

### Project Apps

Test each app to ensure they work:

```bash
# Mental Health Tracker
npm run mental help

# Medication Tracker
npm run med help

# AWS Learning
npm run aws list
```

---

## 🔧 Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `test/` - Test additions/improvements
- `refactor/` - Code refactoring

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Write Tests

**All new features must include tests!**

```bash
# Create test file
touch __tests__/your-feature.test.js

# Write tests following existing patterns
# See __tests__/mental-health-tracker.test.js for examples
```

Test structure example:
```javascript
const fs = require('fs');
const YourModule = require('../your-module');

jest.mock('fs');

describe('YourModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mocks
  });

  test('should do something specific', () => {
    // Arrange
    const module = new YourModule();

    // Act
    const result = module.yourMethod();

    // Assert
    expect(result).toBe(expected);
  });
});
```

---

## 🧪 Testing Requirements

### Before Submitting

**ALL tests must pass:**

```bash
npm test
```

### Coverage Requirements

**All contributions must meet or exceed these thresholds:**

```bash
npm run test:coverage
```

**Minimum thresholds (enforced by CI/CD):**

| Metric | Required | Current |
|--------|----------|---------|
| **Statements** | ≥82% | 85.54% ✅ |
| **Lines** | ≥82% | 85.11% ✅ |
| **Functions** | ≥90% | 92.57% ✅ |
| **Branches** | ≥65% | 68.44% ✅ |

**These thresholds are automatically enforced by CI/CD and will cause builds to fail if not met.**

### Test Types to Include

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test complete workflows
3. **Error Handling**: Test error scenarios
4. **Edge Cases**: Test boundary conditions

### Writing Good Tests

✅ **DO**:
- Test one thing per test
- Use descriptive test names
- Mock external dependencies
- Test both success and failure cases
- Include edge cases

❌ **DON'T**:
- Test implementation details
- Create interdependent tests
- Use real file system operations
- Leave console.log statements

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `style`: Code style changes (formatting)
- `chore`: Maintenance tasks

### Examples

```bash
# Good commit messages
git commit -m "feat: Add mood trend visualization"
git commit -m "fix: Correct medication time validation"
git commit -m "test: Add edge cases for mood logging"
git commit -m "docs: Update README with new features"

# Bad commit messages
git commit -m "fixed stuff"
git commit -m "updates"
git commit -m "WIP"
```

### Multi-line Commits

For complex changes:

```bash
git commit -m "feat: Add medication reminder notifications

- Implement notification system
- Add user preference settings
- Include snooze functionality
- Update documentation

Closes #123"
```

---

## 🎯 Pull Request Process

### 1. Update Your Branch

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Run Final Checks

```bash
# All tests pass
npm test

# Coverage meets requirements
npm run test:coverage

# No linting errors (if applicable)
npm run lint  # if available
```

### 3. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 4. Create Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request"
3. Select your branch
4. Fill out the PR template

### PR Title Format

```
[Type] Brief description

Examples:
[Feature] Add mood trend visualization
[Fix] Correct medication time validation
[Test] Increase coverage for error handling
[Docs] Update contributing guidelines
```

### PR Description Should Include

- **Summary**: What does this PR do?
- **Changes**: List of changes made
- **Testing**: How was this tested?
- **Screenshots**: If UI changes (N/A for CLI apps)
- **Breaking Changes**: Any breaking changes?
- **Related Issues**: Links to related issues

### PR Template

```markdown
## Summary
Brief description of changes

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] All tests pass
- [ ] New tests added
- [ ] Coverage maintained/improved
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Commits follow guidelines
```

---

## 💎 Coding Standards

### JavaScript Style

```javascript
// Use const/let, not var
const tracker = new MedicationTracker();
let count = 0;

// Descriptive variable names
const medicationId = 123;  // Good
const mid = 123;           // Bad

// Function documentation
/**
 * Log a mood entry
 * @param {number} rating - Mood rating 1-10
 * @param {string} note - Optional note
 * @returns {boolean} Success status
 */
function logMood(rating, note = '') {
  // Implementation
}

// Error handling
try {
  fs.writeFileSync(file, data);
  return true;
} catch (error) {
  console.error('Error saving:', error.message);
  return false;
}
```

### File Organization

```javascript
// 1. Requires
const fs = require('fs');
const path = require('path');

// 2. Class definition
class ModuleName {
  constructor() { }

  // Public methods
  publicMethod() { }

  // Private methods
  _privateMethod() { }
}

// 3. Helper functions
function helperFunction() { }

// 4. Main/CLI
function main() { }

// 5. Exports
module.exports = ModuleName;
```

### Naming Conventions

- **Classes**: PascalCase (`MedicationTracker`)
- **Functions**: camelCase (`logMood`, `checkStatus`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RATING`)
- **Files**: kebab-case (`medication-tracker.js`)
- **Test files**: `module-name.test.js`

---

## 📂 Project Structure

```
StepSyncAI/
├── mental-health-tracker.js       # Mental health app (83.65% coverage)
├── medication-tracker.js          # Medication app (87.61% coverage)
├── aws-for-kids.js               # AWS learning app (82.24% coverage)
├── reminder-service.js           # Notification service (100% coverage)
├── chart-utils.js                # Data visualization utilities
├── __tests__/                     # Test suite (579 tests, 85%+ coverage)
│   ├── mental-health-tracker.test.js
│   ├── medication-tracker.test.js
│   ├── aws-for-kids.test.js
│   ├── reminder-service.test.js
│   ├── integration.test.js
│   ├── error-handling.test.js
│   ├── error-edge-cases.test.js
│   ├── pdf-export.test.js
│   ├── data-operations.test.js
│   └── cli-interface.test.js
├── .github/
│   └── workflows/
│       └── ci.yml                # CI/CD pipeline (82%+ thresholds)
├── package.json                  # Dependencies & scripts
├── README.md                     # Main documentation
└── CONTRIBUTING.md               # This file
```

### Where to Add Code

- **New App**: Create `app-name.js` in root
- **Tests**: Add `__tests__/app-name.test.js`
- **Documentation**: Update `README.md`
- **CI/CD**: Modify `.github/workflows/ci.yml`

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try latest version
3. Reproduce the bug
4. Gather information

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. Enter input '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g. macOS 13.0]
- Node: [e.g. 18.16.0]
- npm: [e.g. 9.5.1]

**Additional Context**
Any other relevant information
```

---

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Problem**
What problem does this solve?

**Proposed Solution**
How would this feature work?

**Alternatives Considered**
Other solutions you've thought about

**Additional Context**
Any other relevant information
```

---

## 🎨 Code Review Process

### What Reviewers Look For

1. **Functionality**: Does it work as intended?
2. **Tests**: Are there adequate tests?
3. **Code Quality**: Is it clean and maintainable?
4. **Documentation**: Is it properly documented?
5. **Breaking Changes**: Are they necessary and documented?

### Responding to Feedback

- Be receptive to feedback
- Ask clarifying questions
- Make requested changes
- Re-request review when ready

---

## 📚 Additional Resources

### Documentation

- [README.md](README.md) - Project overview
- [TESTING_README.md](TESTING_README.md) - Testing guide
- [TESTING_REPORT.md](TESTING_REPORT.md) - Coverage analysis

### External Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Jest Testing Framework](https://jestjs.io/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Commit Messages](https://www.conventionalcommits.org/)

---

## ❓ Questions?

- **General Questions**: Open a [GitHub Discussion](https://github.com/Isaloum/StepSyncAI/discussions)
- **Bug Reports**: Create an [Issue](https://github.com/Isaloum/StepSyncAI/issues)
- **Feature Requests**: Create an [Issue](https://github.com/Isaloum/StepSyncAI/issues)

---

## 🙏 Thank You!

Your contributions help make this project better for everyone. Whether it's:

- 🐛 Reporting bugs
- 💡 Suggesting features
- 📝 Improving documentation
- 🧪 Adding tests
- ✨ Contributing code

Every contribution matters. Thank you for being part of this project!

---

<p align="center">
  <strong>Happy Contributing! 🎉</strong>
</p>
