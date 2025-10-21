# StepSyncAI - Medication Tracker

A simple, easy-to-use medication tracker app designed for people who have trouble remembering if they've taken their pills.

## Features

- **Add Medications**: Track multiple medications with dosage, frequency, and scheduled times
- **Mark as Taken**: Quickly log when you take your medication
- **Daily Status Check**: See at a glance which medications you've taken today
- **History Tracking**: View your medication history over time
- **Notes Support**: Add notes when taking medications (e.g., "taken with food")
- **Simple CLI**: Easy-to-use command-line interface

## Quick Start

### Installation

No installation required! Just make sure you have Node.js installed.

### Basic Usage

```bash
# Add a medication
node medication-tracker.js add "Aspirin" "100mg" "daily" "08:00"

# Check today's status
node medication-tracker.js status

# Mark a medication as taken
node medication-tracker.js take <medication-id>

# List all medications
node medication-tracker.js list

# View help
node medication-tracker.js help
```

### Example Workflow

1. **Add your medications:**
   ```bash
   node medication-tracker.js add "Aspirin" "100mg" "daily" "08:00"
   node medication-tracker.js add "Vitamin D" "1000 IU" "daily" "08:00"
   node medication-tracker.js add "Blood Pressure Med" "50mg" "twice-daily" "08:00,20:00"
   ```

2. **Check what you need to take today:**
   ```bash
   node medication-tracker.js status
   ```

3. **Mark medications as taken:**
   ```bash
   node medication-tracker.js take 1234567890
   # Or with notes:
   node medication-tracker.js take 1234567890 "taken with breakfast"
   ```

4. **View your medication history:**
   ```bash
   node medication-tracker.js history
   # Or view history for a specific medication:
   node medication-tracker.js history 1234567890 30
   ```

## Commands

### add
Add a new medication to track.

```bash
node medication-tracker.js add <name> <dosage> <frequency> <time>
```

**Example:**
```bash
node medication-tracker.js add "Aspirin" "100mg" "daily" "08:00"
```

### list
Display all active medications.

```bash
node medication-tracker.js list
```

### take
Mark a medication as taken. You can optionally add notes.

```bash
node medication-tracker.js take <medication-id> [notes]
```

**Example:**
```bash
node medication-tracker.js take 1234567890
node medication-tracker.js take 1234567890 "taken with food"
```

### status
Check which medications have been taken today and which are pending.

```bash
node medication-tracker.js status
```

### history
View medication history. You can filter by medication ID and number of days.

```bash
node medication-tracker.js history [medication-id] [days]
```

**Examples:**
```bash
node medication-tracker.js history          # Last 7 days, all medications
node medication-tracker.js history 1234567890 30  # Last 30 days, specific medication
```

### remove
Deactivate a medication (it will be hidden from active lists but history is preserved).

```bash
node medication-tracker.js remove <medication-id>
```

### help
Display help information.

```bash
node medication-tracker.js help
```

## Testing

Run the test script to see the medication tracker in action:

```bash
npm test
# or
node test-medication-tracker.js
```

This will create a test database and demonstrate all the features.

## Data Storage

Medications and history are stored in `medications.json` in the same directory. This file is created automatically when you add your first medication.

## Future Extensions

This app is designed to be extensible for other tracking needs:
- Habit tracking
- Exercise routines
- Meal planning
- Daily tasks
- And more!

## Original Project

This project also includes a simple step logging tool:

```bash
node index.js "Your step description"
```

## License

MIT
