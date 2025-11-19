# StepSyncAI - Health & Wellness Apps

[![Tests](https://img.shields.io/badge/tests-1063%20passing-brightgreen)](https://github.com/Isaloum/StepSyncAI)
[![Coverage](https://img.shields.io/badge/coverage-82.99%25-brightgreen)](https://github.com/Isaloum/StepSyncAI)
[![Branch Coverage](https://img.shields.io/badge/branch%20coverage-66.1%25-brightgreen)](https://github.com/Isaloum/StepSyncAI)
[![Node](https://img.shields.io/badge/node-18.x%20%7C%2020.x-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A comprehensive collection of personal health management and learning tools designed to support recovery, wellness, daily health tracking, and professional development.

## 📦 Apps Included

1. **🧠 Mental Health Tracker** - Comprehensive PTSD/trauma recovery support tool
2. **💊 Medication Tracker** - Simple pill reminder and adherence tracking system
3. **😴 Sleep Tracker** - Monitor sleep quality and duration patterns
4. **🏃 Exercise Tracker** - Track physical activity and fitness goals
5. **📊 Daily Dashboard** - Unified wellness overview aggregating all health data
6. **☁️ AWS For Kids** - Interactive AWS Cloud Practitioner exam preparation

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
- **Insights & Correlations**: 🔍 **NEW!** Discover patterns in your data
  - **Trigger impact analysis**: How triggers affect your mood
  - **Symptom patterns**: Which symptoms correlate with mood changes
  - **Temporal insights**: Best/worst days of the week
  - **Coping effectiveness**: Which strategies work best for you
  - **Symptom clustering**: Which symptoms tend to occur together
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

# Discover insights & patterns (requires 5+ mood entries)
node mental-health-tracker.js insights

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

<details>
<summary><b>Generate Professional PDF Reports</b></summary>

```bash
# Generate comprehensive PDF report with charts
node mental-health-tracker.js export-pdf [directory]
node medication-tracker.js export-pdf [directory]
node aws-for-kids.js export-pdf [directory]

# Example: Generate PDF to custom directory
node mental-health-tracker.js export-pdf ./reports
```

**Mental Health PDF includes:**
- 📊 Summary statistics (mood averages, journal entries, goals)
- 📈 Mood trend chart (last 30 days)
- 📊 Mood distribution bar chart
- 📝 Recent journal entries
- 🎯 Active goals
- 💪 Top coping strategies

**Medication Tracker PDF includes:**
- 📊 Adherence statistics and current streak
- 💊 Active medications list
- 📈 Adherence pie chart (taken vs missed)
- 📅 Today's medication schedule
- 📝 Recent history (last 10 entries)

**AWS Learning Tracker PDF includes:**
- 🎯 Exam readiness gauge (0-100 score)
- 📚 Learning progress bar chart
- 📊 Quiz performance trend
- 🗺️ Recommended next topics to study

**Perfect for:**
- 🏥 Professional meetings with healthcare providers
- 📋 Comprehensive progress reviews
- 📈 Visual tracking of your wellness journey
- 🎓 Certification readiness assessment (AWS)
</details>

<details>
<summary><b>Generate Professional PDF Reports from Dashboard</b></summary>

```bash
# Generate comprehensive PDF report with visualizations (default 30 days)
node daily-dashboard.js export-pdf

# Generate 60-day report with custom filename
node daily-dashboard.js export-pdf 60 my-wellness-dashboard.pdf

# Alternative command
node daily-dashboard.js pdf
```

**What's Included**:
- 📊 **Professional Summary Cards**:
  - Current wellness score with color-coded status
  - Average mood, sleep duration/quality, exercise minutes, medication adherence
  - Visual progress indicators for each metric
- 📈 **Multi-Line Wellness Trends Chart**:
  - Wellness score progression over time
  - Mood ratings overlay for correlation
  - Color-coded lines (purple for wellness, green for mood)
  - Professional Chart.js-style visualization
- 🔗 **Correlation Analysis Bar Chart**:
  - Sleep duration, sleep quality, exercise, and medication correlations with mood
  - Color-coded bars: green (positive), red (negative)
  - Correlation strength indicators
- 📅 **Day-of-Week Performance Chart**:
  - Average wellness score for each day of the week
  - Identifies best and worst days
  - Helps pattern recognition for weekly planning
- 💡 **Wellness Insights**:
  - High-priority actionable recommendations (red)
  - Medium-priority suggestions (yellow)
  - Positive reinforcement and achievements (green)
  - Pattern-based personalized advice
- 🏆 **Goals & Milestones**:
  - Active goals with progress bars
  - On-track indicators
  - Recently achieved goals
- 🎨 **Professional Layout**:
  - Multi-page PDF with automatic page breaks
  - Page numbers on every page
  - Consistent branding and formatting
  - Print-ready for healthcare providers

**Perfect for:**
- 🏥 Bringing to doctor/therapist appointments with visual data
- 📋 Insurance documentation with comprehensive metrics
- 📈 Quarterly wellness reviews with stakeholders
- 💼 Professional health tracking and reporting
- 🎯 Demonstrating wellness progress with evidence-based charts
</details>

### 📊 Statistics Summary

<details>
<summary><b>Quick Overview of Your Progress</b></summary>

```bash
# Display comprehensive statistics
node mental-health-tracker.js stats
```

**What you'll see:**
- 📅 Total tracking duration
- 🎭 Mood entries and average rating
- 📝 Journal entries count
- 🩺 Symptoms logged
- ⚡ Identified triggers
- 💪 Available coping strategies
- 🎯 Goals (active vs completed)
- 🕐 Days since accident (if profile set)

**Perfect for:**
- Quick progress check
- Motivation boost
- Sharing overview with healthcare providers
- Understanding your tracking habits
</details>

### ⏰ Reminder Notifications

<details>
<parameter name="summary"><b>Never Miss a Medication or Study Session</b></summary>

```bash
# Medication Tracker - Enable reminders for all active medications
node medication-tracker.js reminders-on

# Mental Health Tracker - Enable daily reminders
# Default: Journal at 20:00 (8 PM), Check-in at 09:00 (9 AM)
node mental-health-tracker.js reminders-on [journal-time] [checkin-time]

# AWS Learning - Enable daily study reminders
# Default: Study session at 19:00 (7 PM)
node aws-for-kids.js reminders-on [study-time]

# Check reminder status
node medication-tracker.js reminders
node mental-health-tracker.js reminders
node aws-for-kids.js reminders

# Disable reminders
node medication-tracker.js reminders-off
node mental-health-tracker.js reminders-off
node aws-for-kids.js reminders-off
```

**Medication Reminders:**
- 💊 Automatic reminders at each medication's scheduled time
- 🔔 Desktop notifications when it's time to take your medication
- ✅ Based on your active medications list
- 📅 Daily recurring reminders

**Mental Health Reminders:**
- 📝 Journal prompt reminder (default: 8 PM)
- 🧠 Daily mood check-in reminder (default: 9 AM)
- 🎯 Customizable reminder times
- 💭 Gentle prompts for self-reflection

**AWS Study Reminders:**
- ☁️ Daily study session reminder (default: 7 PM)
- 📚 Consistent learning habits
- 🎓 Exam preparation support
- ⏰ Customizable study time

**Features:**
- Cross-platform desktop notifications (Windows, macOS, Linux)
- Persistent reminders (survive app restarts)
- Easy enable/disable controls
- Status checking to see active reminders

**Perfect for:**
- 💊 Medication adherence improvement
- 🧠 Building healthy mental health tracking habits
- 📚 Consistent AWS certification study
- ⏰ Time management and routine building
</details>

### 🔄 Backup & Restore

<details>
<summary><b>Protect Your Data with Automatic Backups</b></summary>

```bash
# Create a timestamped backup
node mental-health-tracker.js backup [directory]

# List all available backups
node mental-health-tracker.js list-backups [directory]

# Restore from a backup (current data is auto-backed up first!)
node mental-health-tracker.js restore <backup-filename> [directory]
```

**How it works:**
- Backups are timestamped JSON files (e.g., `mental-health-backup-2025-01-15T10-30-00.json`)
- Before restoring, your current data is automatically backed up as `pre-restore`
- All backups include creation date and file size
- Default backup directory: `./backups`

**When to use:**
- 🛡️ Before making major changes
- 📅 Regular scheduled backups (daily/weekly)
- 🔄 Before sharing device or reinstalling
- 💻 When switching computers
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
- **Drug Interaction Warnings**: Automatic detection of 65+ dangerous drug interactions ⚠️
  - **Severity levels**: SEVERE 🔴, MODERATE 🟡, MINOR 🟢
  - **Auto-check** when adding new medications
  - **Manual check** anytime with `check-interactions` command
  - Includes detailed descriptions and recommendations
- **Mark as Taken**: Quickly log when you take your medication
- **Daily Status Check**: See at a glance which medications you've taken today
- **History Tracking**: View your medication history over time
- **Adherence Tracking**: Monitor your medication compliance
- **Notes Support**: Add notes when taking medications (e.g., "taken with food")

### Quick Start

```bash
# Add a medication (auto-checks for interactions)
node medication-tracker.js add "Aspirin" "100mg" "daily" "08:00"

# Check for drug interactions
node medication-tracker.js check-interactions

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

### 📊 Statistics Summary

<details>
<summary><b>Quick Overview of Your Adherence</b></summary>

```bash
# Display comprehensive statistics
node medication-tracker.js stats
```

**What you'll see:**
- 📅 Total tracking duration
- 💊 Active/inactive medications count
- 📈 Overall adherence rate percentage
- 🔥 Current adherence streak
- 🕐 Today's schedule with status (✓ taken / ○ pending)

**Perfect for:**
- Daily adherence check
- Quick status before doctor appointments
- Motivation to maintain streaks
- Understanding medication compliance
</details>

### 🔄 Backup & Restore

<details>
<summary><b>Protect Your Medication Records</b></summary>

```bash
# Create a timestamped backup
node medication-tracker.js backup [directory]

# List all available backups
node medication-tracker.js list-backups [directory]

# Restore from a backup (current data is auto-backed up first!)
node medication-tracker.js restore <backup-filename> [directory]
```

**Safety features:**
- Automatic pre-restore backup prevents data loss
- Timestamped backups with creation date and size
- Quick recovery if something goes wrong

**Critical use cases:**
- 💊 Before changing medication regimen
- 🏥 Before doctor appointments (backup then export)
- 📱 When upgrading or changing devices
</details>

---

## 😴 Sleep Tracker

Monitor your sleep patterns, quality, and discover correlations between sleep and other health metrics.

### Features

- **Sleep Logging**: Record bedtime, wake time, and sleep quality (1-10 scale)
- **Duration Calculation**: Automatically calculates sleep duration including overnight sleep
- **Quality Tracking**: Monitor sleep quality trends over time
- **Sleep Statistics**: Average duration, quality, best/worst nights, sleep debt
- **Consistency Analysis**: Identifies sleep schedule consistency patterns
- **Weekly Insights**: Patterns by day of week, duration analysis
- **Smart Feedback**: Get personalized suggestions for optimal sleep (7-9 hours)
- **Correlation Ready**: Export data for mental health correlation analysis

### Quick Start

```bash
# Log last night's sleep
node sleep-tracker.js log 23:00 07:00 8 "Slept well"

# View sleep history (last 7 days)
node sleep-tracker.js history

# View detailed statistics
node sleep-tracker.js stats

# Get insights and patterns
node sleep-tracker.js insights

# View help
node sleep-tracker.js help
```

### Sleep Quality Guide

- **Excellent (8-10)**: Woke up refreshed, no interruptions
- **Good (6-7)**: Generally restful, minor disturbances
- **Moderate (4-5)**: Some restlessness, mediocre rest
- **Poor (1-3)**: Very restless, feeling unrested

### Understanding Sleep Metrics

- **Optimal Duration**: 7-9 hours for most adults
- **Sleep Debt**: Accumulated difference from 8-hour baseline
- **Consistency**: Variation in bedtime/wake time patterns
- **Quality vs Duration**: Both matter! Track both for complete picture

---

## 🏃 Exercise Tracker

Track your physical activity, workout intensity, and progress toward daily fitness goals.

### Features

- **Activity Logging**: Record exercise type, duration, and intensity
- **Intensity Levels**: Low, moderate, or high intensity tracking
- **Daily Goals**: 30-minute daily activity goal with progress tracking
- **Exercise History**: View recent workouts with duration and notes
- **Statistics**: Total workouts, minutes, averages, and activity breakdown
- **Today's Progress**: Quick view of today's exercise minutes
- **Flexible Activities**: Track any type of physical activity

### Quick Start

```bash
# Log an exercise session
node exercise-tracker.js log "Running" 30 high "Morning jog"

# Shorter version (moderate intensity by default)
node exercise-tracker.js log "Walking" 20

# View exercise history (last 7 days)
node exercise-tracker.js history

# View detailed statistics
node exercise-tracker.js stats

# Check today's progress
node exercise-tracker.js today

# View help
node exercise-tracker.js help
```

### Intensity Guidelines

- **🚶 Low**: Walking, stretching, gentle yoga, light household chores
- **🏃 Moderate**: Brisk walking, cycling, swimming, moderate-intensity sports
- **💨 High**: Running, HIIT, vigorous sports, intense cardio

### Exercise Types Examples

Track any activity:
- Cardio: Running, cycling, swimming, rowing
- Strength: Weight training, resistance exercises
- Flexibility: Yoga, pilates, stretching
- Sports: Basketball, tennis, soccer
- Daily Activity: Walking, gardening, dancing

---

## 📊 Daily Dashboard

Get a unified wellness overview by aggregating data from all your health trackers into one comprehensive dashboard with actionable insights.

### Why Use the Dashboard?

The Daily Dashboard provides:
- **Holistic View**: See all your wellness metrics in one place
- **Wellness Score**: 0-100 score showing overall health status
- **Smart Recommendations**: Personalized suggestions based on your data
- **Progress Tracking**: Daily and weekly summaries
- **Missing Data Handling**: Works gracefully even with partial data

### Quick Start

```bash
# View today's dashboard
node daily-dashboard.js daily

# View weekly summary
node daily-dashboard.js weekly

# View help
node daily-dashboard.js help
```

### Wellness Score Breakdown (0-100 points)

The dashboard calculates your wellness score from four components:

#### 🧠 Mood Score (0-25 points)
- Based on your mental health mood ratings
- **Calculation**: (Average Mood / 10) × 25
- **Example**: Mood 8/10 = 20 points

#### 😴 Sleep Score (0-25 points)
- **Quality Component** (15 points): (Average Quality / 10) × 15
- **Duration Component** (10 points):
  - 7-9 hours: 10 points (optimal)
  - 6-7 or 9-10 hours: 7 points (good)
  - 5-6 or 10-11 hours: 4 points (acceptable)
  - Other: 0 points
- **Example**: 8h sleep at 9/10 quality = 13.5 + 10 = 23.5 points

#### 🏃 Exercise Score (0-25 points)
- Based on daily exercise toward 30-minute goal
- **Calculation**: (Average Daily Minutes / 30) × 25
- **Example**: 25 min/day average = 20.8 points
- **30+ min/day**: Full 25 points

#### 💊 Medication Score (0-25 points)
- Based on medication adherence rate
- **Calculation**: (Adherence % / 100) × 25
- **Example**: 90% adherence = 22.5 points

### Example Dashboard Output

```
╔════════════════════════════════════════════════════════════╗
║           📊 DAILY WELLNESS DASHBOARD                      ║
╚════════════════════════════════════════════════════════════╝

📅 Monday, November 17, 2025

┌─────────────────────────────────────────────────────────┐
│  😊  OVERALL WELLNESS: 78.5/100 (78.5%) - Good
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

### Smart Recommendations

The dashboard provides context-aware recommendations:

#### High Priority 🔴
- Mood below 6/10: Suggests journaling, therapy, coping strategies
- Sleep < 6 hours or quality < 4: Sleep hygiene tips
- Medication adherence < 80%: Reminder to stay consistent

#### Medium Priority 🟡
- Exercise < 18 min/day average: Encouragement to increase activity
- Sleep quality 4-6: Suggestions for better sleep environment

#### Positive Feedback ✅
- Mood ≥ 8/10: Recognition of good mental health
- Exercise ≥ 24 min/day: Praise for staying active
- Medication adherence ≥ 95%: Acknowledgment of consistency
- Overall score ≥ 85%: Celebration of excellent wellness

### Use Cases

**Daily Check-in**
```bash
# Start your day with a wellness overview
node daily-dashboard.js daily
```

**Weekly Review**
```bash
# Sunday evening: review the week's wellness
node daily-dashboard.js weekly
```

**Track Progress**
- Compare weekly scores to identify trends
- Use recommendations to focus improvement efforts
- Celebrate wins when scores improve

**Discover Correlations**
```bash
# Analyze how sleep, exercise, and medication affect your mood
node daily-dashboard.js correlations

# Analyze last 60 days
node daily-dashboard.js correlations 60
```

### Correlation Analysis 🔗

Discover powerful insights about how different wellness factors affect your mood using statistical correlation analysis with **enhanced colored visualizations** 🎨.

#### What Correlations Are Analyzed

**😴 Sleep → Mood**
- **Sleep Duration**: Does getting more/less sleep affect your mood?
- **Sleep Quality**: Does better sleep quality boost your mood?
- Shows correlation strength and interpretation
- Example: "Getting more sleep strongly improves your mood! 🌟"

**🏃 Exercise → Mood**
- How does physical activity impact your emotional state?
- Compares mood on exercise days vs. non-exercise days
- Shows average mood difference
- Example: "You feel 1.5 points better on days you exercise!"

**💊 Medication → Mood**
- Does medication adherence correlate with mood improvements?
- Compares full adherence vs. no adherence days
- Helps validate medication effectiveness
- Example: "You feel 2.0 points better with full medication adherence!"

#### Understanding Correlation Results

The dashboard uses **Pearson correlation coefficient** (-1.0 to +1.0):

| Correlation | Strength | Meaning | Emoji |
|-------------|----------|---------|-------|
| 0.7 to 1.0 | Strong | Factors move together strongly | 💚 |
| 0.5 to 0.7 | Moderate to Strong | Clear relationship | 💚 🟢 |
| 0.3 to 0.5 | Moderate | Some relationship | 🟢 |
| 0.1 to 0.3 | Weak | Slight relationship | 🟡 |
| -0.1 to 0.1 | Very Weak | No clear relationship | ⚪ |
| -0.3 to -0.1 | Weak Negative | Inverse relationship | 🟠 |
| -1.0 to -0.3 | Moderate to Strong Negative | Factors move opposite | 🔴 |

#### Example Correlation Output

```
╔════════════════════════════════════════════════════════════╗
║         🔗 WELLNESS CORRELATIONS ANALYSIS                  ║
╚════════════════════════════════════════════════════════════╝

📊 Analyzing patterns over the last 30 days...

😴 Sleep → Mood Correlation

   Sample Size: 25 days with both sleep and mood data

   💚 Sleep Duration ↔ Mood: Moderate to Strong
      ⬆️ ████████████████████████░░░░░░░░░░░░░░ +0.612
      Getting more sleep strongly improves your mood! 🌟

   💚 Sleep Quality ↔ Mood: Strong
      ⬆️ ████████████████████████████████░░░░░░ +0.743
      Better sleep quality strongly boosts your mood! 🌟

🏃 Exercise → Mood Correlation

   Sample Size: 30 days with mood data

   🟢 Exercise Minutes ↔ Mood: Moderate
      ⬆️ ████████████████░░░░░░░░░░░░░░░░░░░░░░ +0.423

   📊 Mood Comparison:
      With Exercise (18 days): 7.8/10
      Without Exercise (12 days): 6.5/10
      💚 You feel 1.3 points better on days you exercise!

💊 Medication Adherence → Mood Correlation

   Sample Size: 30 days with mood data

   💚 Medication Adherence ↔ Mood: Moderate to Strong
      ⬆️ ███████████████████████░░░░░░░░░░░░░░░ +0.587

   📊 Mood Comparison:
      Full Adherence (22 days): 7.9/10
      No Adherence (3 days): 5.8/10
      💚 You feel 2.1 points better with full medication adherence!

────────────────────────────────────────────────────────────

💡 Understanding Correlations:

   • Strong positive (0.7+): These factors move together
   • Moderate positive (0.3-0.7): Some relationship exists
   • Weak (0-0.3): Little to no relationship
   • Negative: Inverse relationship

   Keep logging data to strengthen these insights!
```

#### Data Requirements

- **Minimum**: 3 days with matching data for each correlation type
- **Recommended**: 30+ days for reliable patterns
- **Best**: 60+ days for strong statistical confidence

The more data you log, the more accurate the correlations become!

### Wellness Trends & Progress Tracking 📈

Visualize your wellness journey over time with **enhanced asciichart line graphs** and detailed progress analysis. Track improvements, identify declines, and understand which wellness components are changing.

#### Quick Start

```bash
# View 8-week wellness trend (default)
node daily-dashboard.js trends

# View 4-week trend
node daily-dashboard.js trends 4

# Alternative commands
node daily-dashboard.js trend
node daily-dashboard.js progress
```

#### What's Analyzed

**Overall Wellness Trend**
- Tracks your wellness score week by week
- Identifies if you're improving ⬆️, declining ⬇️, or stable ➡️
- Compares recent weeks to earlier weeks using moving averages
- Shows percentage change over time

**Component Trends** (Individual tracking for each):
- 🧠 **Mood**: Average mood ratings over time
- 😴 **Sleep**: Sleep quality and duration patterns
- 🏃 **Exercise**: Physical activity levels
- 💊 **Medication**: Adherence rate changes

**Best & Worst Weeks**
- Highlights your highest scoring week
- Identifies your lowest scoring week
- Helps you understand what worked (or didn't)

#### Understanding Trend Types

| Trend | Symbol | Meaning |
|-------|--------|---------|
| **Improving** | ⬆️ | Wellness score increasing over time |
| **Declining** | ⬇️ | Wellness score decreasing - actionable suggestions provided |
| **Stable** | ➡️ | Wellness score consistent (within 5% variation) |
| **Insufficient** | ℹ️ | Less than 2 weeks of data - keep logging! |

#### ASCII Trend Chart

The dashboard generates visual charts showing your progress:

```
Week 1  ●
Week 2   ●─
Week 3     ●─
Week 4       ●─
Week 5         ●
```

- Each `●` represents your wellness score for that week
- Lines (`─`) connect consecutive weeks
- Higher position = better score
- Shows 8 weeks by default (customizable)

#### Example Trends Output

```
╔════════════════════════════════════════════════════════════╗
║        📈 WELLNESS TRENDS & PROGRESS (8 Weeks)             ║
╚════════════════════════════════════════════════════════════╝

Overall Trend: ⬆️ Improving
Your wellness is trending upward! Recent weeks average 15.2%
higher than earlier weeks.

Current Week: 78.5% (Good)
Previous Week: 72.0% (Good)
Change: +6.5% ⬆️

────────────────────────────────────────────────────────────

📊 8-Week Wellness Trend Chart:

100% ┤
 90% ┤
 80% ┤                                         ●
 70% ┤                             ●─────────●─┘
 60% ┤                   ●───────●─┘
 50% ┤         ●───────●─┘
 40% ┤   ●───●─┘
 30% ┤ ●─┘
 20% ┤
 10% ┤
  0% ┤
     └─────────────────────────────────────────────
     Week  1    2    3    4    5    6    7    8

────────────────────────────────────────────────────────────

📊 Component Trends:

  🧠 Mood: Stable ➡️
     Current: 8.0/10  |  Previous: 7.8/10  |  Change: +0.2

  😴 Sleep: Improving ⬆️
     Current: 8.5h, 8.2/10  |  Previous: 7.2h, 7.0/10

  🏃 Exercise: Improving ⬆️
     Current: 28 min/day  |  Previous: 20 min/day  |  +8 min

  💊 Medication: Declining ⬇️
     Current: 75%  |  Previous: 85%  |  -10%

────────────────────────────────────────────────────────────

🏆 Best Week: Week 8 (78.5%)
😞 Worst Week: Week 1 (45.0%)

Total Progress: +33.5 percentage points! 🎉

────────────────────────────────────────────────────────────

💡 Recommendations:

  ✅ Great progress! You've improved by 15.2% over recent weeks.

  🟡 Focus on medication adherence - it's declined by 10%.
     Your medication tracker shows missed doses. Set reminders
     to stay consistent.

  🌟 Your sleep improvements are contributing to better overall
     wellness. Keep maintaining good sleep hygiene!
```

#### Smart Decline Suggestions

When trends show decline, the dashboard identifies which component needs attention most:

- **Mood declining**: Suggests journaling, therapy, coping strategies
- **Sleep declining**: Recommends consistent sleep schedule, reviewing sleep hygiene
- **Exercise declining**: Encourages returning to 30-minute daily goal
- **Medication declining**: Reminds to set reminders and track adherence

#### Data Requirements

- **Minimum**: 1 week of data (shows limited trends)
- **Good**: 2+ weeks of data (identifies trend direction)
- **Best**: 4-8+ weeks (reliable trend analysis and predictions)

The dashboard calculates weekly scores by averaging daily wellness scores across each 7-day period.

#### How It Works

1. **Weekly Aggregation**: Divides your history into 7-day weeks
2. **Score Calculation**: Computes average wellness score for each week
3. **Trend Analysis**: Compares recent 50% of weeks to earlier 50%
4. **Visualization**: Generates ASCII chart showing the progression
5. **Component Analysis**: Tracks each wellness component individually
6. **Recommendations**: Provides actionable suggestions based on trends

### Goal Setting & Milestones 🏆

Set wellness targets and track your progress toward achieving them. The dashboard provides intelligent goal tracking with progress bars, on-track indicators, and milestone celebrations.

#### Quick Start

```bash
# View all goals
node daily-dashboard.js goals

# Set a wellness goal (reach 80% by end of year)
node daily-dashboard.js set-goal wellness 80 2025-12-31

# Set an exercise goal (30 min/day by summer)
node daily-dashboard.js set-goal exercise 30 2025-06-30

# Check specific goal progress
node daily-dashboard.js goal-progress 1

# Delete a goal
node daily-dashboard.js delete-goal 1
```

#### Goal Types

| Type | Target Range | Example |
|------|--------------|---------|
| **wellness** | 0-100% | Overall wellness score target |
| **mood** | 1-10 | Average daily mood rating |
| **sleep-duration** | hours | Average sleep duration (e.g., 8h) |
| **sleep-quality** | 1-10 | Average sleep quality rating |
| **exercise** | minutes/day | Daily exercise target (e.g., 30 min) |
| **medication** | 0-100% | Medication adherence rate |

#### What's Tracked

**Progress Metrics**:
- Current value vs. target
- Progress percentage (0-100%)
- Days remaining until target date
- Days elapsed since goal creation
- On-track status (based on trends)

**Milestone Detection** (Automatic):
- 25% progress
- 50% progress (halfway!)
- 75% progress (almost there!)
- 100% - Goal achieved! 🎉

**On-Track Analysis**:
- 🟢 **On Track**: Making good progress, likely to achieve goal
- 🔴 **Behind Schedule**: Need to increase effort
- 🟡 **Uncertain**: Not enough data to determine

#### Example Goals Display

```
╔════════════════════════════════════════════════════════════╗
║              🏆 WELLNESS GOALS & MILESTONES                ║
╚════════════════════════════════════════════════════════════╝

🎯 Active Goals:

1. 🟢 Reach 80% overall wellness score (ID: 1)
   [████████████████░░░░░░░░░░░░░░] 55.0%
   Current: 44.0% / Target: 80%
   25 days remaining (15 days elapsed)
   🎯 Milestones reached: 25%, 50%
   ✅ On track to achieve!

2. 🔴 Exercise 30 minutes per day (ID: 2)
   [████████░░░░░░░░░░░░░░░░░░░░] 28.3%
   Current: 8.5 min/day / Target: 30 min/day
   45 days remaining (5 days elapsed)
   ⚠️  Behind schedule - increase effort!

3. ✅ Maintain average mood of 8/10 (ID: 3)
   [████████████████████████████████] 106.3%
   Current: 8.5/10 / Target: 8/10
   60 days remaining (10 days elapsed)
   🎯 Milestones reached: 25%, 50%, 75%, 100%


🏆 Recently Achieved Goals:

1. ✅ Average 7 hours of sleep per night
   Achieved: 2025-11-01

2. ✅ Reach 70% overall wellness score
   Achieved: 2025-10-15

────────────────────────────────────────────────────────────

📊 Summary: 3 active, 2 achieved
```

#### Smart Features

**Automatic Status Updates**:
- Goals automatically marked as "achieved" when reaching 100%
- Expired goals detected when target date passes
- Milestones celebrated as you reach them

**Trend-Based Predictions**:
- Uses your wellness trends to predict if you'll achieve the goal
- Factors in current trajectory and time remaining
- Suggests course corrections if falling behind

**Progress Tracking**:
- Real-time progress calculation based on latest data
- Beautiful progress bars showing visual progress
- Days remaining countdown

#### Creating Effective Goals

**SMART Goal Examples**:

```bash
# Specific & Measurable: Reach 80% wellness
node daily-dashboard.js set-goal wellness 80 2025-12-31 "End year strong"

# Achievable: Improve mood gradually
node daily-dashboard.js set-goal mood 7.5 2025-06-30 "Feel happier"

# Realistic: Increase exercise moderately
node daily-dashboard.js set-goal exercise 25 2025-03-31 "Build habit"

# Time-bound: Summer sleep goal
node daily-dashboard.js set-goal sleep-duration 8 2025-06-21 "Better rest"
```

**Tips for Success**:
1. **Start Small**: Set achievable targets, then increase
2. **Be Specific**: Choose exact numbers and dates
3. **Track Progress**: Check `goal-progress` weekly
4. **Stay Consistent**: Log data daily for accurate tracking
5. **Celebrate**: Acknowledge milestones and achievements!

#### Goal Management

**View All Goals**:
```bash
node daily-dashboard.js goals
```

**Check Specific Goal**:
```bash
node daily-dashboard.js goal-progress 1
```
Shows detailed progress including on-track status and estimated completion.

**Delete a Goal**:
```bash
node daily-dashboard.js delete-goal 1
```
Removes a goal you no longer want to track.

### Wellness Insights & Pattern Detection 💡

Get AI-like pattern detection across all wellness metrics with weekly insights reports and personalized predictions based on your unique data patterns.

#### Quick Start

```bash
# Get 30-day insights report (default)
node daily-dashboard.js insights

# Analyze last 60 days
node daily-dashboard.js insights 60

# Alternative commands
node daily-dashboard.js insight
node daily-dashboard.js patterns
```

#### What's Analyzed

**📅 Day of Week Patterns**:
- Identifies your best and worst days of the week
- Shows average wellness score for each day
- Reveals which days tend to be challenging
- Example: "Mondays average 55% wellness, Saturdays 85%"

**📈 Tracking Consistency**:
- Measures how consistently you log data
- Separate tracking for mood, sleep, and exercise
- Overall consistency percentage
- Encourages daily logging for better insights

**🔥 Current Streaks**:
- Tracks consecutive days of logging
- Separate streaks for mood, sleep, exercise
- Celebrates week-long+ streaks
- Motivates consistency

**💡 Predictive Suggestions**:
- Day-based: Extra self-care for challenging days
- Consistency: Encouragement to log more frequently
- Trend-based: Warnings if wellness declining
- Positive reinforcement for improvements

**📊 Trend Integration**:
- Uses your wellness trends for predictions
- Identifies improving/declining patterns
- Suggests course corrections

#### Example Insights Output

```
╔════════════════════════════════════════════════════════════╗
║              💡 WELLNESS INSIGHTS & PATTERNS               ║
╚════════════════════════════════════════════════════════════╝

📊 Analysis Period: Last 30 days

Current Wellness: 😊 72.3% - Good
Weekly Change: ⬆️ +5.2%

────────────────────────────────────────────────────────────

📅 Day of Week Patterns:

🌟 Best Day: Saturday (85.2% avg wellness)
😞 Challenging Day: Monday (55.8% avg wellness)

   Weekly Breakdown:
   Sunday     [███████████████░] 80.5%
   Monday     [███████░░░░░░░░░] 55.8%
   Tuesday    [██████████░░░░░░] 65.0%
   Wednesday  [███████████░░░░░] 68.5%
   Thursday   [████████████░░░░] 72.0%
   Friday     [██████████████░░] 78.5%
   Saturday   [████████████████] 85.2%

────────────────────────────────────────────────────────────

📈 Tracking Consistency:

   Mood Logging:     [████████████████░░░░] 80%
   Sleep Logging:    [██████████████░░░░░░] 70%
   Exercise Logging: [█████████░░░░░░░░░░░] 45%
   Overall:          65% of data logged

────────────────────────────────────────────────────────────

🔥 Current Streaks:

   🧠 Mood: 12 days 🌟
   😴 Sleep: 8 days 🌟
   🏃 Exercise: 4 days

   🎉 Week-long streak! Consistency is key to wellness!

────────────────────────────────────────────────────────────

💡 Personalized Insights:

   🔴 Mondays tend to be challenging (55.8% wellness). Plan extra self-care on Mondays.
   🟡 Exercise logged only 45% of days. Even 10 minutes counts!
   ✅ Saturdays are your best days (85.2% wellness)! What makes Saturdays great? Replicate that.
   ✅ Wellness improving by 5.2%! Keep up the momentum!

────────────────────────────────────────────────────────────

📊 Trend: ⬆️ Improving
   Recent weeks 8.3% higher than earlier weeks
```

#### Types of Insights Generated

**Temporal Insights** (Day-Based):
- High Priority 🔴: Challenging days < 50% wellness
- Positive ✅: Best days > 70% wellness
- Helps you plan around difficult days

**Consistency Insights**:
- Medium Priority 🟡: Logging < 50% of days
- Encourages daily tracking
- "You're logging mood only 45% of days. Daily tracking reveals better patterns."

**Trend Insights**:
- High Priority 🔴: Wellness declining
- Positive ✅: Wellness improving
- Includes percentage change
- Provides specific suggestions

#### Use Cases

**Weekly Review**:
```bash
# Every Sunday, check insights
node daily-dashboard.js insights
```

**Pattern Discovery**:
- "Why do I feel worse on Mondays?"
- "Which days should I schedule important tasks?"
- "Am I tracking consistently enough?"

**Motivation**:
- Celebrate streaks
- See improvement trends
- Get positive reinforcement

**Course Correction**:
- Warnings about declining trends
- Reminders to log more consistently
- Suggestions for challenging days

### Export & Reporting 📄

Export your wellness data for backup, sharing with healthcare providers, or external analysis. Generate comprehensive reports combining all your wellness metrics, insights, trends, and correlations.

#### Quick Start

```bash
# Export to JSON (complete data with insights)
node daily-dashboard.js export

# Export to CSV (daily records for Excel)
node daily-dashboard.js export-csv

# Generate comprehensive text report
node daily-dashboard.js report
```

#### Export Formats

**JSON Export** (Complete Data Backup):
```bash
# Export last 30 days (default)
node daily-dashboard.js export-json

# Export last 90 days with custom filename
node daily-dashboard.js export-json 90 my-wellness-data.json

# Alternative command
node daily-dashboard.js export
```

**What's Included**:
- Export metadata (dates, period)
- Daily records (mood, sleep, exercise, medication, wellness scores)
- Summary statistics (averages, totals, adherence rates)
- Active and achieved goals
- Wellness insights (patterns, streaks, suggestions)
- Trend analysis (overall and component trends)
- Correlation findings (sleep, exercise, medication impacts)

**CSV Export** (Excel-Compatible):
```bash
# Export last 30 days to CSV
node daily-dashboard.js export-csv

# Export last 60 days with custom filename
node daily-dashboard.js export-csv 60 wellness-data.csv
```

**CSV Columns**:
- Date, Day of Week, Wellness Score
- Mood Rating, Mood Notes
- Sleep Duration (hrs), Sleep Quality, Sleep Notes
- Exercise Minutes, Exercise Types
- Medication Taken, Medication Scheduled, Medication Adherence %

**HTML Export** (Interactive Charts & Visualizations) 🆕:
```bash
# Generate interactive HTML report (default 30 days)
node daily-dashboard.js export-html

# Generate 60-day report with custom filename
node daily-dashboard.js export-html 60 my-wellness-report.html

# Alternative commands
node daily-dashboard.js html
node daily-dashboard.js web-report
```

**What's Included**:
- 📊 **Interactive Chart.js Visualizations**:
  - Line chart showing wellness trends and mood ratings over time
  - Bar chart displaying correlation strength (color-coded: green=positive, red=negative)
  - Radar chart revealing day-of-week patterns
- 🎨 **Beautiful Responsive Design**:
  - Gradient backgrounds and modern UI
  - Mobile-friendly layout
  - Print-optimized styling
- 📈 **Summary Cards**:
  - Current wellness score with label (Excellent/Great/Good/Fair/Needs Attention)
  - Average mood, sleep, exercise, and medication adherence
- 💡 **Wellness Insights**:
  - Color-coded insights (red=high priority, yellow=medium, green=positive)
  - Pattern detection and personalized suggestions
- 🌐 **Self-Contained File**:
  - Single HTML file with embedded Chart.js from CDN
  - No external dependencies needed
  - Easy to share with healthcare providers

**PDF Export** (Professional Reports with Charts) 🆕:
```bash
# Generate professional PDF report (default 30 days)
node daily-dashboard.js export-pdf

# Generate 60-day report with custom filename
node daily-dashboard.js export-pdf 60 wellness-report.pdf

# Alternative command
node daily-dashboard.js pdf
```

**What's Included**:
- 📊 **Summary Cards**: Wellness score, mood, sleep, exercise, medication with visual indicators
- 📈 **Wellness Trends Chart**: Multi-line chart showing wellness score and mood over time
- 🔗 **Correlation Bar Chart**: Color-coded analysis of sleep, exercise, medication impact on mood
- 📅 **Day-of-Week Chart**: Column chart revealing weekly performance patterns
- 💡 **Wellness Insights**: Color-coded recommendations (red/yellow/green priority levels)
- 🏆 **Goals Progress**: Active and achieved goals with progress bars
- 🎨 **Professional Layout**: Multi-page PDF with page numbers, automatic breaks, print-ready formatting

**Perfect for:**
- 🏥 Healthcare provider appointments with visual evidence
- 📋 Insurance documentation and claims
- 📊 Professional wellness reporting
- 💼 Quarterly reviews and progress tracking

**Text Report** (Comprehensive Overview):
```bash
# Generate 30-day report (default)
node daily-dashboard.js report

# Generate 90-day report with custom filename
node daily-dashboard.js report 90 quarterly-wellness-report.txt

# Alternative command
node daily-dashboard.js generate-report
```

**Report Sections**:
- Executive Summary (averages and key metrics)
- Goals & Milestones (progress and achievements)
- Wellness Insights & Patterns (day-of-week, consistency, streaks)
- Correlation Analysis (factor relationships)
- Wellness Trends (overall and component trends)

#### Example Report Output

```
═══════════════════════════════════════════════════════════
              WELLNESS REPORT
═══════════════════════════════════════════════════════════

Report Generated: Monday, November 18, 2025, 10:30 AM
Period: 2025-10-19 to 2025-11-18
Days Analyzed: 30

───────────────────────────────────────────────────────────
EXECUTIVE SUMMARY
───────────────────────────────────────────────────────────

Average Wellness Score: 72.5/100
Mood Average: 7.2/10 (27 entries)
Sleep Duration: 7.8 hours avg (25 nights)
Sleep Quality: 8.1/10
Exercise: 22.5 min/day avg (18 active days)
Medication Adherence: 88.3%

───────────────────────────────────────────────────────────
GOALS & MILESTONES
───────────────────────────────────────────────────────────

Active Goals: 2
  • Reach 80% overall wellness score
    Progress: 90.6% (72.5/80)
    Target Date: 2025-12-31
    Status: ✅ On Track

  • Maintain average mood of 8/10
    Progress: 90.0% (7.2/8.0)
    Target Date: 2025-12-31
    Status: 🟡 Uncertain

Achieved Goals: 1
  ✅ Average 7 hours of sleep per night
     Achieved: 2025-11-01

───────────────────────────────────────────────────────────
WELLNESS INSIGHTS & PATTERNS
───────────────────────────────────────────────────────────

Day-of-Week Patterns:
  Best Day: Saturday (avg score: 85.2)
  Worst Day: Monday (avg score: 58.3)

Logging Consistency:
  Mood: 90.0%
  Sleep: 83.3%
  Exercise: 60.0%
  Overall: 77.8%

Current Streaks:
  🎯 Mood tracking: 12 days
  😴 Sleep logging: 8 days
  💪 Exercise: 4 days

AI Suggestions:
  High Priority:
    🔴 Mondays tend to be challenging. Plan extra self-care.
  Medium Priority:
    🟡 Exercise logged only 60% of days. Even 10 minutes counts!
  Positive Trends:
    ✅ Saturdays are your best days! Replicate that.
    ✅ Wellness improving by 5.2%! Keep momentum!

───────────────────────────────────────────────────────────
CORRELATION ANALYSIS
───────────────────────────────────────────────────────────

• Sleep Duration: Better sleep improves mood
  Correlation: 0.612 (Moderate to Strong)
• Sleep Quality: Better sleep quality boosts mood strongly
  Correlation: 0.743 (Strong)
• Exercise: Mood is 1.3 points higher on exercise days
  Correlation: 0.423 (Moderate)

───────────────────────────────────────────────────────────
WELLNESS TRENDS
───────────────────────────────────────────────────────────

Overall Trend: ⬆️ IMPROVING
Weekly Change: +5.2%

Component Trends:
  Mood: 📈 improving
  Sleep: ➡️ stable
  Exercise: 📈 improving
  Medication: ➡️ stable

═══════════════════════════════════════════════════════════
End of Report
═══════════════════════════════════════════════════════════
```

#### Use Cases

**Healthcare Provider Sharing**:
```bash
# Generate comprehensive report for doctor appointment
node daily-dashboard.js report 90 doctor-visit-nov-2025.txt
```
Share detailed wellness data with your therapist, doctor, or psychiatrist.

**Data Backup**:
```bash
# Monthly JSON backup
node daily-dashboard.js export-json 30 backup-nov-2025.json
```
Keep backups of your wellness data for safekeeping.

**Excel Analysis**:
```bash
# Export to CSV for custom analysis
node daily-dashboard.js export-csv 90 wellness-q4-2025.csv
```
Open in Excel/Google Sheets for custom charts and pivot tables.

**Insurance Documentation**:
```bash
# Generate quarterly wellness report
node daily-dashboard.js report 90 insurance-q4-2025.txt
```
Provide evidence of wellness management for insurance claims.

**Progress Reviews**:
```bash
# Monthly wellness review
node daily-dashboard.js report 30 monthly-review.txt
```
Review your monthly progress and share with accountability partners.

#### File Naming

**Default Filenames** (auto-generated with today's date):
- JSON: `wellness-export-2025-11-18.json`
- CSV: `wellness-export-2025-11-18.csv`
- Report: `wellness-report-2025-11-18.txt`

**Custom Filenames**:
```bash
# Use descriptive names for easy organization
node daily-dashboard.js export-json 30 "november-2025-wellness.json"
node daily-dashboard.js export-csv 90 "q4-2025-daily-data.csv"
node daily-dashboard.js report 30 "monthly-review-nov-2025.txt"
```

### Tips for Best Results

1. **Log Consistently**: The more data you track, the better insights
2. **Use All Trackers**: Dashboard works best with complete data
3. **Check Daily**: Morning wellness check sets a positive tone
4. **Act on Recommendations**: Use insights to guide your day
5. **Review Weekly**: Weekly summaries show meaningful trends

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

### 📊 Statistics Summary

<details>
<summary><b>Quick Exam Readiness Check</b></summary>

```bash
# Display comprehensive statistics
node aws-for-kids.js stats
```

**What you'll see:**
- 📅 Study duration
- 📚 Topics completed (X/21) with completion rate
- 🎯 Quiz performance (total quizzes and average score)
- 🏆 Exam readiness score (0-100)
- 📊 Breakdown by category: Topic coverage, quiz performance, practice consistency
- ✨ Readiness status (Ready/Almost there/Keep studying)

**Perfect for:**
- Quick progress check
- Deciding if you're ready to schedule the exam
- Identifying weak areas
- Motivation to keep studying
</details>

### 🔄 Backup & Restore

<details>
<summary><b>Safeguard Your Certification Progress</b></summary>

```bash
# Create a timestamped backup
node aws-for-kids.js backup [directory]

# List all available backups
node aws-for-kids.js list-backups [directory]

# Restore from a backup (current data is auto-backed up first!)
node aws-for-kids.js restore <backup-filename> [directory]
```

**Why backup your progress:**
- 🎓 Don't lose quiz scores and study history
- 📚 Preserve completed lessons and learning path
- 🔄 Easy recovery if you need to reset or switch devices
- 📊 Maintain accurate study streak data

**Best practices:**
- Backup before taking practice exams
- Create backups weekly during intensive study periods
- Keep backups when reinstalling or updating Node.js
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

This project has comprehensive test coverage with **649 tests** covering all functionality.

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

| Module | Statements | Branch | Functions | Lines |
|--------|------------|--------|-----------|-------|
| **Mental Health Tracker** | 86.59% ⭐ | **70.75%** ⭐ | 97.82% ⭐ | 85.83% ⭐ |
| **Medication Tracker** | 89.56% ⭐ | **72.94%** ⭐ | 96.11% ⭐ | 89.14% ⭐ |
| **AWS For Kids** | 83.62% ⭐ | 67.89% | 88.31% ⭐ | 83.08% ⭐ |
| **Reminder Service** | **100%** 🎯 | **94.44%** 🎯 | **100%** 🎯 | **100%** 🎯 |
| **Overall** | **87.21%** ⭐ | **71.64%** ⭐ | **95.66%** ⭐ | **86.64%** ⭐ |

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
├── reminder-service.js          # Notification service (100% coverage)
├── index.js                      # Original step logger
├── __tests__/                    # Test suites (579 tests, 85%+ coverage)
│   ├── mental-health-tracker.test.js  # 120+ tests
│   ├── medication-tracker.test.js     # 100+ tests
│   ├── aws-for-kids.test.js          # 85+ tests
│   ├── reminder-service.test.js      # 45+ tests
│   ├── integration.test.js           # 25+ tests
│   ├── pdf-export.test.js            # 102 tests
│   ├── error-handling.test.js        # 15+ tests
│   ├── error-edge-cases.test.js      # 44+ tests
│   ├── data-operations.test.js       # 20+ tests
│   └── cli-interface.test.js         # 30+ tests
├── .github/
│   └── workflows/
│       └── ci.yml                # CI/CD pipeline
├── package.json                  # Dependencies & scripts
├── CONTRIBUTING.md              # Contribution guidelines
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
- Maintain test coverage above 82%+ (statements and lines)
- Ensure function coverage stays above 90%
- Follow existing code style
- Update documentation
- All tests must pass before merging

---

## 📊 Code Quality

### Testing Standards

- ✅ 712 comprehensive tests (+19 for insights/correlations)
- ✅ Unit tests for all core functions
- ✅ Integration tests for complete workflows
- ✅ Error handling tests
- ✅ Edge case coverage
- ✅ Branch coverage achieved 71%+ (71.64%)
- ✅ PDF export testing with visual components
- ✅ Drug interaction safety testing (30 tests)
- ✅ Mental health insights testing (19 tests)
- ✅ Fast execution (~5.7 seconds)

### Quality Gates

- Minimum 82% statement coverage (currently: 87.21%)
- Minimum 65% branch coverage (currently: 71.64%)
- Minimum 90% function coverage (currently: 95.66%)
- All tests passing (712/712)
- No high-severity vulnerabilities
- CI/CD enforced quality standards

---

## 🛠️ NPM Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (712 tests) |
| `npm run test:coverage` | Run tests with coverage report (87%+) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run mental` | Start mental health tracker |
| `npm run med` | Start medication tracker |
| `npm run aws` | Start AWS learning app |

---

## 📖 Documentation

- [TESTING_README.md](TESTING_README.md) - Complete testing guide
- [TESTING_REPORT.md](TESTING_REPORT.md) - Detailed coverage analysis and testing journey
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines and quality standards

---

## 🔮 Future Enhancements

### Planned Features

- [ ] CLI interface tests (target: 70%+ coverage)
- [x] Data export functionality (CSV) ✓
- [x] Backup and restore system ✓
- [x] PDF export with charts and graphs ✓
- [x] Reminder notifications ✓
- [x] **Drug interaction warnings** ✓ (65+ interactions, 3 severity levels)
- [x] **Insights & correlation analysis** ✓ **NEW!** (Mental Health Tracker)
  - Trigger-mood impact analysis
  - Symptom pattern detection
  - Temporal insights (best/worst days)
  - Coping strategy effectiveness
  - Symptom clustering
- [ ] Multi-user support
- [ ] Cloud sync option
- [ ] Mobile app version
- [ ] Integration with health devices
- [ ] More drug interactions (expand database)
- [ ] Predictive insights (ML-based mood forecasting)

### Testing Improvements

- [x] Increase branch coverage to 60%+ ✓ (Currently at 71.64%)
- [x] Mental Health Tracker: 70%+ branch coverage ✓ **ACHIEVED!** (Currently at 70.75%)
- [x] Medication Tracker: 70%+ branch coverage ✓ (Currently at 72.94%)
- [x] Reminder Service: 70%+ branch coverage ✓ (Currently at 94.44%)
- [x] Increase overall branch coverage to 70%+ ✓ **MILESTONE ACHIEVED!** (Currently at 71.64%)
- [ ] Add performance benchmarks
- [ ] Snapshot testing for outputs
- [ ] Mutation testing
- [x] Achieve 85%+ overall coverage ✓

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

---

## ❓ FAQ & Troubleshooting

<details>
<summary><strong>How do I get started?</strong></summary>

1. Clone the repository: `git clone https://github.com/Isaloum/StepSyncAI.git`
2. Install dependencies: `npm install`
3. Start with any tracker:
   ```bash
   node mental-health-tracker.js help
   node medication-tracker.js help
   node sleep-tracker.js help
   node exercise-tracker.js help
   node aws-for-kids.js help
   node daily-dashboard.js help
   ```
4. Use the `help` command for each app to learn all available commands
</details>

<details>
<summary><strong>Where is my data stored?</strong></summary>

All data is stored locally in JSON files in the project directory:
- `mental-health-data.json` - Mental health tracking data
- `medications.json` - Medication tracking data
- `sleep-data.json` - Sleep tracking data
- `exercise-data.json` - Exercise tracking data
- `aws-learning-progress.json` - AWS learning progress
- `dashboard-goals.json` - Wellness goals and milestones
- `reminders-config.json` - Reminder settings

**Privacy**: Your data never leaves your computer. No cloud sync, no external APIs.
</details>

<details>
<summary><strong>How do I backup my data?</strong></summary>

Each app has built-in backup functionality:

```bash
# Mental Health Tracker
node mental-health-tracker.js backup

# Medication Tracker
node medication-tracker.js backup

# AWS For Kids
node aws-for-kids.js backup

# Sleep Tracker
node sleep-tracker.js backup

# Exercise Tracker
node exercise-tracker.js backup
```

Backups are stored in the `./backups` directory with timestamps.

You can also manually copy the JSON data files to a safe location.
</details>

<details>
<summary><strong>How do I restore from a backup?</strong></summary>

1. List available backups:
   ```bash
   node mental-health-tracker.js list-backups
   ```

2. Restore from a specific backup:
   ```bash
   node mental-health-tracker.js restore mental-health-backup-2024-11-19T10-30-00.json
   ```

**Safety**: The app automatically creates a safety backup of your current data before restoring.
</details>

<details>
<summary><strong>How do I export my data to Excel?</strong></summary>

Use the CSV export feature:

```bash
# Mental Health (exports 6 CSV files)
node mental-health-tracker.js export

# Medication (exports 2 CSV files)
node medication-tracker.js export

# AWS For Kids (exports 3 CSV files)
node aws-for-kids.js export

# Sleep Tracker (exports 1 CSV file)
node sleep-tracker.js export

# Exercise Tracker (exports 1 CSV file)
node exercise-tracker.js export

# Daily Dashboard (exports multiple formats)
node daily-dashboard.js export-csv
```

Files are saved in the `./exports` directory and can be opened in Excel, Google Sheets, or any spreadsheet software.
</details>

<details>
<summary><strong>Can I use this on multiple computers?</strong></summary>

Yes! You have several options:

1. **Manual Sync**: Copy the JSON data files between computers
2. **Git**: Commit your data files to a private Git repository
3. **Cloud Backup**: Store backups in Dropbox, Google Drive, or iCloud
4. **USB Drive**: Keep data files on a USB drive

**Note**: There's no built-in cloud sync, so you'll need to manually manage data transfer.
</details>

<details>
<summary><strong>Error: "Cannot find module" when running commands</strong></summary>

Make sure you've installed dependencies:

```bash
npm install
```

If the issue persists, try:

```bash
rm -rf node_modules package-lock.json
npm install
```
</details>

<details>
<summary><strong>Reminder notifications aren't working</strong></summary>

1. Check if the reminder service is running:
   ```bash
   node reminder-service.js start
   ```

2. Verify your reminder configuration:
   ```bash
   node reminder-service.js status
   ```

3. Check the `reminders-config.json` file for correct settings

4. On macOS, ensure terminal-notifier is installed:
   ```bash
   brew install terminal-notifier
   ```

5. On Linux, ensure notify-send is available (usually pre-installed)
</details>

<details>
<summary><strong>Can multiple people use this on the same computer?</strong></summary>

Currently, StepSyncAI is designed for single-user use. If multiple people need to use it:

**Option 1 - Separate Project Folders**:
```bash
# Person 1
cd ~/StepSyncAI-person1
git clone https://github.com/Isaloum/StepSyncAI.git .

# Person 2
cd ~/StepSyncAI-person2
git clone https://github.com/Isaloum/StepSyncAI.git .
```

**Option 2 - Manual Data Swapping**:
1. Person 1: `node mental-health-tracker.js backup`
2. Switch data files
3. Person 2 uses the app
4. Restore Person 1's backup when done

**Note**: Multi-user authentication is not currently supported (see roadmap for future features).
</details>

<details>
<summary><strong>How do I update to the latest version?</strong></summary>

1. Backup your data first:
   ```bash
   node mental-health-tracker.js backup
   node medication-tracker.js backup
   node aws-for-kids.js backup
   node sleep-tracker.js backup
   node exercise-tracker.js backup
   ```

2. Pull latest changes:
   ```bash
   git pull origin main
   ```

3. Update dependencies:
   ```bash
   npm install
   ```

4. Verify everything works:
   ```bash
   npm test
   ```

Your data files are preserved during updates.
</details>

<details>
<summary><strong>Tests are failing after I made changes</strong></summary>

1. Run the full test suite to see what's broken:
   ```bash
   npm test
   ```

2. Check coverage:
   ```bash
   npm run test:coverage
   ```

3. Run linting:
   ```bash
   npm run lint
   ```

4. If you modified core functionality, you may need to update tests
5. Check the [CONTRIBUTING.md](CONTRIBUTING.md) guide for testing best practices
</details>

<details>
<summary><strong>How do I contribute to this project?</strong></summary>

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
2. Fork the repository
3. Create a feature branch
4. Make your changes
5. Add tests (maintain 80%+ coverage)
6. Submit a Pull Request

See the contributing guide for detailed instructions.
</details>

<details>
<summary><strong>Is my health data secure?</strong></summary>

**Privacy**:
- ✅ All data stored locally on your computer
- ✅ No cloud sync or external API calls
- ✅ No telemetry or tracking
- ✅ No user accounts or authentication needed

**Security Recommendations**:
- 📁 Store data files in an encrypted folder (FileVault on macOS, BitLocker on Windows)
- 🔒 Use whole-disk encryption
- 💾 Create regular backups
- 🔐 Set file permissions to restrict access (see next question)

**Note**: While data is stored locally, the files are **not encrypted by default**. Consider using OS-level encryption for sensitive health data.
</details>

<details>
<summary><strong>How do I set secure file permissions on my data files?</strong></summary>

**On macOS/Linux**:

```bash
# Make data files readable/writable only by you
chmod 600 *.json

# Or for specific files:
chmod 600 mental-health-data.json
chmod 600 medications.json
chmod 600 sleep-data.json
chmod 600 exercise-data.json
chmod 600 aws-learning-progress.json
chmod 600 dashboard-goals.json
chmod 600 reminders-config.json
```

**On Windows**:

1. Right-click the JSON file → Properties
2. Security tab → Advanced
3. Disable inheritance
4. Remove all users except your account
5. Grant yourself Full Control
6. Apply changes

**Automate** (macOS/Linux):

Add to your shell profile (.bashrc, .zshrc):

```bash
alias secure-health-data='chmod 600 ~/path/to/StepSyncAI/*.json'
```
</details>

<details>
<summary><strong>Can I use this for my family/patients?</strong></summary>

**Personal/Family Use**: Yes! Each family member should have their own installation or use separate project folders.

**Clinical Use**: Not recommended. StepSyncAI is designed for personal tracking, not clinical use. It lacks:
- HIPAA compliance
- Audit logging
- Multi-user authentication
- Data encryption at rest
- Access controls
- Clinical decision support

**Recommendation**: Use for personal wellness tracking only. Always consult healthcare professionals for medical decisions.
</details>

<details>
<summary><strong>What's the difference between the trackers and the Dashboard?</strong></summary>

**Individual Trackers** (Mental Health, Medication, Sleep, Exercise):
- Focused on specific health aspect
- Deep data entry and tracking
- Specialized features (e.g., drug interactions, symptom clustering)
- Detailed insights for that domain

**Daily Dashboard**:
- Aggregates data from all trackers
- Provides unified wellness score
- Cross-tracker correlations (e.g., how sleep affects mood)
- High-level overview and trends
- Goal setting and progress tracking

**Best Practice**: Use individual trackers for daily logging, and the Dashboard for weekly/monthly reviews.
</details>

<details>
<summary><strong>How accurate is the AWS For Kids exam preparation?</strong></summary>

**Content Coverage**:
- ✅ 21 core AWS concepts covered
- ✅ Kid-friendly explanations for complex topics
- ✅ Focuses on Cloud Practitioner level

**Limitations**:
- ❌ Not comprehensive for the full exam (65 questions)
- ❌ No official AWS certification
- ❌ Best used as supplementary study material

**Recommendation**: Use AWS For Kids to build foundational knowledge, then complement with:
- Official AWS Cloud Practitioner Study Guide
- AWS training courses
- Practice exams from AWS
</details>

<details>
<summary><strong>The app says "out of pills" but I still have medication</strong></summary>

This happens when the pill count tracker gets out of sync with reality. To fix:

1. Count your actual pills
2. Update the refill information:
   ```bash
   node medication-tracker.js refill <medication-id> <actual-pill-count>
   ```

Or set up fresh refill tracking:
```bash
node medication-tracker.js set-refill-info <medication-id> <pill-count> <pills-per-dose> <alert-threshold>
```

Example:
```bash
node medication-tracker.js set-refill-info 1 60 1 7
```

This sets medication ID 1 to 60 pills, 1 pill per dose, alert when ≤7 days remaining.
</details>

<details>
<summary><strong>My sleep duration is calculating incorrectly</strong></summary>

**Overnight Sleep**: The app handles overnight sleep automatically. For example:
- Bedtime: `23:00` (11 PM)
- Wake time: `07:00` (7 AM)
- Duration: 8 hours ✓

**24-Hour Format**: Make sure you're using 24-hour time format:
- ✅ Correct: `23:00` for 11 PM
- ❌ Wrong: `11:00` (this means 11 AM)

**Format**: Use `HH:MM` format:
- ✅ `08:30` (8:30 AM)
- ✅ `20:15` (8:15 PM)
- ❌ `8:30` (missing leading zero)
</details>

<details>
<summary><strong>How do I delete old entries/data?</strong></summary>

Currently, there's no built-in "delete" command. To remove old data:

**Option 1 - Manual JSON Editing**:
1. Create a backup first: `node <tracker>.js backup`
2. Open the JSON file (e.g., `mental-health-data.json`)
3. Carefully edit the array to remove unwanted entries
4. Save and verify: `node <tracker>.js stats`

**Option 2 - Start Fresh**:
1. Backup existing data: `node <tracker>.js backup`
2. Rename or delete the JSON file
3. Start tracking from scratch

**Caution**: Manual JSON editing can corrupt your data. Always backup first!
</details>

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

**Version**: 3.9.0
**Status**: ✅ Active Development
**Test Coverage**: 87.21%+ ⭐
**Branch Coverage**: 71.64% ⭐ **MILESTONE ACHIEVED!** (3 modules at 70%+: Mental Health 70.75%, Medication 72.94%, Reminder 94.44% 🎯)
**Tests**: 920 passing 🎉
**Latest Features**:
- 💡 **Wellness Insights** - AI-like pattern detection, best/worst days, streaks, predictive suggestions (NEW!)
- 🏆 **Goal Setting & Milestones** - Set wellness targets, track progress, celebrate achievements
- 📈 **Wellness Trends** - Visualize 8-week progress with ASCII charts & trend analysis
- 🔗 **Correlation Analysis** - Discover how sleep, exercise & medication affect mood
- 📊 **Daily Dashboard** - Unified wellness overview with scoring system
- 😴 **Sleep Tracker** - Monitor sleep quality and patterns
- 🏃 **Exercise Tracker** - Track physical activity and fitness goals
- ⚠️ Drug Interaction Warnings (65+ interactions)
- 🔍 Insights & Correlations (pattern detection in mental health data)
**CI/CD**: ✅ Automated with quality gates

---

## 🙏 Acknowledgments

Built with ❤️ to support personal health, wellness, and professional development.

**Remember**: These tools are meant to support your wellness journey, not replace professional medical care. Always consult healthcare professionals for medical advice.

---

<p align="center">
  <strong>Stay healthy, stay learning! 🌟</strong>
</p>
