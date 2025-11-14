# Testing Guide for StepSyncAI

## Overview

StepSyncAI uses **Jest** as its testing framework with comprehensive unit tests, integration tests, and error handling coverage.

### Current Test Stats
- **Total Tests**: 229
- **Test Suites**: 5
- **Overall Coverage**: ~60%
- **Execution Time**: ~2 seconds

## Test Structure

```
__tests__/
├── mental-health-tracker.test.js     # Unit tests (72 tests)
├── medication-tracker.test.js         # Unit tests (56 tests)
├── aws-for-kids.test.js               # Unit tests (50 tests)
├── error-handling.test.js             # Error scenarios (27 tests)
└── integration.test.js                # End-to-end workflows (24 tests)
```

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (re-runs on file changes)
npm run test:watch

# Run specific test file
npx jest __tests__/mental-health-tracker.test.js

# Run tests matching a pattern
npx jest -t "logMood"

# Verbose output
npx jest --verbose
```

### Legacy Tests (Pre-Jest)

```bash
# Old demonstration scripts (still available)
npm run test:old
```

## Coverage Reports

### Viewing Coverage

After running `npm run test:coverage`:

```bash
# Open HTML report in browser
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

### Coverage Thresholds

Current thresholds (defined in `package.json`):

| Metric | Threshold | Current |
|--------|-----------|---------|
| Statements | 55% | ~60% ✅ |
| Branches | 45% | ~50% ✅ |
| Functions | 65% | ~70% ✅ |
| Lines | 55% | ~59% ✅ |

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions in isolation

**Example**:
```javascript
test('logMood should reject rating above 10', () => {
  const tracker = new MentalHealthTracker('test.json');

  const result = tracker.logMood(11, 'Invalid');

  expect(result).toBe(false);
});
```

**Coverage**:
- Mental Health Tracker: 72 tests covering all major functions
- Medication Tracker: 56 tests with 76% statement coverage
- AWS For Kids: 50 tests validating learning features

### 2. Integration Tests

**Purpose**: Test complete user workflows

**Example**:
```javascript
test('should handle complete medication management workflow', () => {
  const tracker = new MedicationTracker('test.json');

  // Add medications
  const aspirin = tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');

  // Take medication
  tracker.markAsTaken(aspirin.id, 'With breakfast');

  // Verify status
  tracker.checkTodayStatus();
});
```

**Scenarios Tested**:
- Complete recovery journey (mood tracking + coping strategies)
- Daily medication management
- Learning progression (beginner to exam-ready)
- Cross-module integration (health + medication tracking)

### 3. Error Handling Tests

**Purpose**: Ensure graceful failures

**Scenarios**:
- File permission errors (EACCES)
- Disk full errors (ENOSPC)
- Corrupted JSON data
- Invalid input validation
- Missing file handling
- Null/undefined inputs

### 4. Edge Cases

**Testing**:
- Boundary values (mood: 1, 10)
- Unicode characters (emoji, Chinese, Arabic)
- Very long strings (10,000+ characters)
- Empty inputs
- Concurrent operations
- Special characters in names

## Test Best Practices

### Mocking

All tests use mocked file system operations:

```javascript
jest.mock('fs');

beforeEach(() => {
  fs.existsSync.mockReturnValue(false);
  fs.readFileSync.mockReturnValue('{}');
  fs.writeFileSync.mockImplementation(() => {});
});
```

**Benefits**:
- Fast execution (no disk I/O)
- Isolated tests (no side effects)
- Predictable behavior
- No cleanup required

### Test Structure

```javascript
describe('Feature Name', () => {
  // Setup
  beforeEach(() => {
    // Reset state
  });

  // Cleanup
  afterEach(() => {
    // Restore mocks
  });

  test('should do specific thing', () => {
    // Arrange
    const tracker = new MentalHealthTracker('test.json');

    // Act
    const result = tracker.logMood(5, 'Test');

    // Assert
    expect(result).toBe(true);
  });
});
```

### Console Spying

Tests capture console output:

```javascript
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

tracker.viewMoodHistory();

expect(consoleLogSpy).toHaveBeenCalled();
```

## Coverage by Module

### Mental Health Tracker
```
Statements: 55.63%
Branches:   45.58%
Functions:  63.63%
Lines:      55.18%
```

**Well Covered**:
- ✅ Mood logging and validation
- ✅ Symptom tracking
- ✅ Journal entries
- ✅ Trigger tracking
- ✅ Coping strategies
- ✅ Emergency contacts
- ✅ Goal tracking
- ✅ Data persistence

**Needs Coverage**:
- ❌ CLI interface (lines 515-831)
- ❌ View/display methods (partial)
- ❌ Some edge cases in validation

### Medication Tracker
```
Statements: 76.22%
Branches:   65.07%
Functions:  90.9%
Lines:      75%
```

**Excellent Coverage**! 🎉

**Well Covered**:
- ✅ All core functions (90.9%)
- ✅ Medication CRUD operations
- ✅ History tracking
- ✅ Daily status checking
- ✅ Error handling

**Needs Coverage**:
- ❌ CLI interface (lines 190-281)
- ❌ Some edge cases in display logic

### AWS For Kids
```
Statements: 57.31%
Branches:   46%
Functions:  65%
Lines:      57.4%
```

**Well Covered**:
- ✅ Concept initialization
- ✅ Learning tracking
- ✅ Progress calculation
- ✅ Quiz validation
- ✅ Category filtering

**Needs Coverage**:
- ❌ Interactive quiz mode (lines 845-920)
- ❌ CLI interface (lines 1042-1121)
- ❌ Study guide display (partial)

## Common Testing Patterns

### Testing Validation

```javascript
test('should validate input', () => {
  expect(tracker.logMood(0)).toBe(false);   // Below min
  expect(tracker.logMood(11)).toBe(false);  // Above max
  expect(tracker.logMood(5)).toBe(true);    // Valid
});
```

### Testing Data Persistence

```javascript
test('should save and load data', () => {
  tracker.logMood(5, 'Test');

  const savedData = fs.writeFileSync.mock.calls[0][1];
  const parsed = JSON.parse(savedData);

  expect(parsed.moodEntries.length).toBe(1);
});
```

### Testing Error Handling

```javascript
test('should handle errors gracefully', () => {
  fs.writeFileSync.mockImplementation(() => {
    throw new Error('Write failed');
  });

  const result = tracker.saveData();

  expect(result).toBe(false);
  expect(consoleErrorSpy).toHaveBeenCalled();
});
```

## CI/CD Integration

Tests automatically run on:
- ✅ Every push to main/develop
- ✅ All pull requests
- ✅ Feature branches (claude/**)

### GitHub Actions Workflow

See `.github/workflows/ci.yml`:

- Runs tests on Node 18.x and 20.x
- Generates coverage reports
- Posts coverage to PRs
- Uploads artifacts
- Security audits

### Quality Gates

All PRs must:
- ✅ Pass all 229 tests
- ✅ Meet coverage thresholds
- ✅ Pass linting checks
- ✅ No high-severity vulnerabilities

## Writing New Tests

### Step 1: Choose Test File

```javascript
// Unit test → existing test file
__tests__/mental-health-tracker.test.js

// Integration test → integration.test.js
__tests__/integration.test.js

// Error handling → error-handling.test.js
__tests__/error-handling.test.js
```

### Step 2: Write Test

```javascript
describe('New Feature', () => {
  test('should do something specific', () => {
    // Arrange
    const tracker = new MentalHealthTracker('test.json');

    // Act
    const result = tracker.newMethod();

    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

### Step 3: Run Tests

```bash
# Run to verify
npm test

# Check coverage
npm run test:coverage
```

### Step 4: Update Coverage

If you add new code, update thresholds in `package.json`:

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "statements": 60,  // Increase as coverage improves
        "branches": 50,
        "functions": 70,
        "lines": 60
      }
    }
  }
}
```

## Debugging Tests

### Run Single Test

```bash
npx jest -t "should log mood"
```

### See Console Output

```bash
npx jest --verbose --no-coverage
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-coverage"],
  "console": "integratedTerminal"
}
```

## Troubleshooting

### Tests Failing After Changes

```bash
# Clear Jest cache
npx jest --clearCache

# Run with verbose output
npx jest --verbose
```

### Coverage Threshold Errors

Lower thresholds temporarily in `package.json` while adding new features, then increase coverage with tests.

### Mock Issues

Ensure mocks are reset:

```javascript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Future Improvements

### Planned Enhancements

1. **CLI Testing** (Priority: High)
   - Add tests for command-line interfaces
   - Use mock process.argv
   - Test help menus and error messages

2. **Increase Branch Coverage** (Target: 60%+)
   - Add more negative test cases
   - Test all error paths
   - Cover edge conditions

3. **Performance Tests**
   - Large dataset handling (1000+ entries)
   - Concurrent operation safety
   - Memory usage profiling

4. **Snapshot Testing**
   - Capture output formats
   - Detect unintended changes
   - Version control for displays

5. **Mutation Testing**
   - Verify test effectiveness
   - Find untested code paths
   - Improve test quality

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Coverage Reports Guide](https://istanbul.js.org/)
- [GitHub Actions CI/CD](https://docs.github.com/en/actions)

## Questions?

- Check existing tests for examples
- Read `TESTING_REPORT.md` for detailed analysis
- Review CI logs in GitHub Actions
- Ensure all tests pass before committing

---

**Last Updated**: 2025-11-14
**Test Count**: 229
**Coverage**: ~60%
**Status**: ✅ All Passing
