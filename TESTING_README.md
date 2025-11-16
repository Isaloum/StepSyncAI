# Testing Guide for StepSyncAI

## Overview

StepSyncAI uses **Jest** as its testing framework with comprehensive unit tests, integration tests, and error handling coverage.

### Current Test Stats
- **Total Tests**: 579
- **Test Suites**: 10
- **Overall Coverage**: 85.5%+
- **Execution Time**: ~4 seconds

## Test Structure

```
__tests__/
├── mental-health-tracker.test.js     # Unit tests (120+ tests)
├── medication-tracker.test.js         # Unit tests (100+ tests)
├── aws-for-kids.test.js               # Unit tests (85+ tests)
├── reminder-service.test.js          # Unit tests (45+ tests, 100% coverage)
├── integration.test.js                # End-to-end workflows (25+ tests)
├── pdf-export.test.js                 # PDF generation tests (102 tests)
├── error-handling.test.js             # Error scenarios (15+ tests)
├── error-edge-cases.test.js          # Edge cases (44+ tests)
├── data-operations.test.js           # Backup/restore/export (20+ tests)
└── cli-interface.test.js             # CLI testing (30+ tests)
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
| Statements | 82% | 85.54% ✅ |
| Branches | 65% | 68.44% ✅ |
| Functions | 90% | 92.57% ✅ |
| Lines | 82% | 85.11% ✅ |

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
- Mental Health Tracker: 120+ tests with 83.65% statement coverage
- Medication Tracker: 100+ tests with 87.61% statement coverage
- AWS For Kids: 85+ tests with 82.24% statement coverage
- Reminder Service: 45+ tests with 100% coverage 🎯

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

### 3. PDF Export Tests

**Purpose**: Validate PDF generation with charts and graphs

**Coverage**:
- 102 comprehensive tests
- Mental health report generation
- Medication adherence reports
- AWS learning progress reports
- Chart rendering validation
- Error handling for missing data

**Features Tested**:
- Document structure and metadata
- Summary statistics rendering
- Chart generation (line charts, bar charts, pie charts)
- Recent data inclusion
- Goal and strategy displays
- Edge cases (empty data, very large datasets)

### 4. Data Operations Tests

**Purpose**: Test backup, restore, and export functionality

**Coverage**:
- CSV export validation (all modules)
- Backup creation with timestamps
- Restore functionality with safety backups
- List backups with metadata
- Data integrity across operations
- Error handling for corrupted backups

**Features Tested**:
- Mental health data export (6 CSV files)
- Medication data export (2 CSV files)
- AWS learning data export (3 CSV files)
- Timestamped backup creation
- Pre-restore safety backups
- Backup restoration verification

### 5. CLI Interface Tests

**Purpose**: Validate command-line interface handling

**Coverage**:
- Help menu display for all modules
- Invalid command handling
- Missing argument validation
- Process.argv parsing
- Exit code verification
- Error message clarity

**Features Tested**:
- Mental health CLI (35+ commands)
- Medication tracker CLI (15+ commands)
- AWS learning CLI (12+ commands)
- Reminder service CLI (5+ commands)

### 6. Error Handling Tests

**Purpose**: Ensure graceful failures

**Scenarios**:
- File permission errors (EACCES)
- Disk full errors (ENOSPC)
- Corrupted JSON data
- Invalid input validation
- Missing file handling
- Null/undefined inputs

### 7. Error Edge Cases Tests

**Purpose**: Comprehensive edge case coverage (44+ tests)

**Testing**:
- Boundary values (mood: 1, 10, medication times, dates)
- Unicode characters (emoji, Chinese, Arabic, special symbols)
- Very long strings (10,000+ characters)
- Empty inputs and null values
- Concurrent operations
- Special characters in names
- Invalid date formats
- Extreme values (negative numbers, very large numbers)
- Malformed data structures

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

### Mental Health Tracker ⭐
```
Statements: 83.65%
Branches:   67.82%
Functions:  95.36%
Lines:      83.65%
```

**Excellent Coverage**! 🎉

**Well Covered**:
- ✅ Mood logging and validation
- ✅ Symptom tracking
- ✅ Journal entries
- ✅ Trigger tracking
- ✅ Coping strategies
- ✅ Emergency contacts
- ✅ Goal tracking
- ✅ Data persistence
- ✅ CSV export
- ✅ PDF export
- ✅ Backup and restore
- ✅ Reminder notifications
- ✅ Data visualization (charts, trends)
- ✅ CLI interface
- ✅ Error handling and edge cases

### Medication Tracker ⭐
```
Statements: 87.61%
Branches:   70.42%
Functions:  92.55%
Lines:      87.61%
```

**Outstanding Coverage**! 🎉

**Well Covered**:
- ✅ All core functions (92.55%)
- ✅ Medication CRUD operations
- ✅ History tracking
- ✅ Daily status checking
- ✅ Adherence visualization
- ✅ CSV export
- ✅ PDF export
- ✅ Backup and restore
- ✅ Reminder notifications
- ✅ CLI interface
- ✅ Error handling

### AWS For Kids ⭐
```
Statements: 82.24%
Branches:   65.91%
Functions:  84.41%
Lines:      82.24%
```

**Excellent Coverage**! 🎉

**Well Covered**:
- ✅ Concept initialization
- ✅ Learning tracking
- ✅ Progress calculation
- ✅ Quiz validation
- ✅ Category filtering
- ✅ Dashboard visualization
- ✅ CSV export
- ✅ PDF export
- ✅ Backup and restore
- ✅ Reminder notifications
- ✅ CLI interface
- ✅ Error handling

### Reminder Service 🎯
```
Statements: 100%
Branches:   100%
Functions:  100%
Lines:      100%
```

**Perfect Coverage**! 🎯

**Complete Coverage**:
- ✅ Notification scheduling
- ✅ Reminder management
- ✅ Cross-platform notifications
- ✅ Persistence handling
- ✅ Enable/disable controls
- ✅ Status checking

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
- ✅ Pass all 579 tests
- ✅ Meet coverage thresholds (82%/65%/90%)
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

If you add new code, maintain the thresholds in `package.json`:

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "statements": 82,  // Maintained at 82%+
        "branches": 65,
        "functions": 90,
        "lines": 82
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

1. **Increase Branch Coverage** (Target: 70%+)
   - Current: 68.44%
   - Add more conditional test cases
   - Test all error paths
   - Cover remaining edge conditions

2. **Performance Tests**
   - Large dataset handling (1000+ entries)
   - Concurrent operation safety
   - Memory usage profiling
   - Load testing for PDF generation

3. **Snapshot Testing**
   - Capture output formats
   - Detect unintended changes
   - Version control for displays
   - CLI output validation

4. **Mutation Testing**
   - Verify test effectiveness
   - Find untested code paths
   - Improve test quality
   - Use Stryker or similar tools

5. **Visual Regression Testing**
   - PDF output validation
   - Chart rendering verification
   - Terminal output formatting

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

**Last Updated**: 2025-11-16
**Test Count**: 579
**Coverage**: 85.5%+
**Status**: ✅ All Passing
