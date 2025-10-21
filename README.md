# StepSyncAI - Health & Wellness Apps

A collection of personal health management tools designed to support recovery, wellness, and daily health tracking.

## Apps Included

1. **Mental Health Tracker** - Support tool for managing mental health after workplace accidents
2. **Medication Tracker** - Simple pill reminder and tracking system

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

#### Profile & Overview
```bash
# Setup profile
node mental-health-tracker.js profile-setup <date> <description>

# View profile
node mental-health-tracker.js profile

# Daily check-in
node mental-health-tracker.js checkin
```

#### Mood & Emotions
```bash
# Log mood (1-10)
node mental-health-tracker.js mood <rating> [note]

# View mood history (default 7 days)
node mental-health-tracker.js mood-history [days]
```

#### Symptoms
```bash
# Log symptom (severity 1-10)
# Types: anxiety, panic, flashback, nightmare, depression, insomnia,
#        irritability, avoidance, hypervigilance, concentration, physical-pain
node mental-health-tracker.js symptom <type> <severity> [note]

# View symptoms
node mental-health-tracker.js view-symptoms [days] [type]
```

#### Journal
```bash
# Add entry (types: general, incident, therapy, progress)
node mental-health-tracker.js journal <content> [type]

# View journal
node mental-health-tracker.js view-journal [days] [type]
```

#### Triggers
```bash
# Add new trigger
node mental-health-tracker.js add-trigger <description> [intensity]

# Log trigger occurrence
node mental-health-tracker.js log-trigger <trigger-id>

# List all triggers
node mental-health-tracker.js list-triggers
```

#### Coping Strategies
```bash
# Add strategy
node mental-health-tracker.js add-coping <name> <description>

# Use strategy and rate effectiveness
node mental-health-tracker.js use-coping <strategy-id> [rating]

# List strategies
node mental-health-tracker.js list-coping
```

#### Emergency & Support
```bash
# Add emergency contact
node mental-health-tracker.js add-contact <name> <relationship> <phone> [notes]

# View contacts
node mental-health-tracker.js contacts
```

#### Goals
```bash
# Add goal
node mental-health-tracker.js add-goal <description> [target-date]

# Complete goal
node mental-health-tracker.js complete-goal <goal-id>

# List goals
node mental-health-tracker.js list-goals [all]
```

### Example Workflow

1. **Initial Setup:**
   ```bash
   node mental-health-tracker.js profile-setup "2024-06-15" "Workplace machinery accident"
   node mental-health-tracker.js add-contact "Dr. Smith" "Therapist" "555-0123"
   node mental-health-tracker.js add-contact "Crisis Line" "Support" "988"
   ```

2. **Daily Routine:**
   ```bash
   # Morning check-in
   node mental-health-tracker.js checkin
   node mental-health-tracker.js mood 6 "Slept better last night"

   # Throughout the day
   node mental-health-tracker.js symptom anxiety 7 "Before work meeting"

   # Evening reflection
   node mental-health-tracker.js journal "Made it through the day. Used breathing exercises twice." progress
   ```

3. **After Therapy:**
   ```bash
   node mental-health-tracker.js journal "Discussed trauma processing. Difficult but helpful." therapy
   node mental-health-tracker.js add-coping "EMDR Exercises" "Eye movement technique from therapy"
   ```

4. **Tracking Progress:**
   ```bash
   node mental-health-tracker.js add-goal "Sleep 6+ hours for a week" "2024-07-15"
   node mental-health-tracker.js mood-history 30
   node mental-health-tracker.js view-symptoms 30
   ```

### Testing

Run the demonstration to see all features:

```bash
node test-mental-health-tracker.js
```

### Important Notes

- This is a **personal tracking tool** to support your recovery
- Always consult with mental health professionals for proper care
- In crisis, call **988** (Suicide & Crisis Lifeline) or text **HOME to 741741**
- Data stored in `mental-health-data.json` (created automatically)

---

## 💊 Medication Tracker

A simple, easy-to-use medication tracker app designed for people who have trouble remembering if they've taken their pills.

### Features

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
