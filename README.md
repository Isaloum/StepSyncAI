# StepSyncAI - Health & Wellness Apps

[![Tests](https://img.shields.io/badge/tests-833%20passing-brightgreen)](https://github.com/Isaloum/StepSyncAI)
[![Coverage](https://img.shields.io/badge/coverage-87.21%25-brightgreen)](https://github.com/Isaloum/StepSyncAI)
[![Branch Coverage](https://img.shields.io/badge/branch%20coverage-71.64%25-brightgreen)](https://github.com/Isaloum/StepSyncAI)
[![Node](https://img.shields.io/badge/node-18.x%20%7C%2020.x-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A comprehensive collection of personal health management and learning tools designed to support recovery, wellness, daily health tracking, and professional development.

## 📦 Apps Included

1. **🧠 Mental Health Tracker** - Comprehensive PTSD/trauma recovery support tool
2. **💊 Medication Tracker** - Simple pill reminder and adherence tracking system
3. **😴 Sleep Tracker** - Monitor sleep quality and discover sleep-mood correlations
4. **💪 Exercise Tracker** - Track physical activity with mood & sleep correlations
5. **📊 Daily Dashboard** - 🆕 Unified wellness view across all health trackers
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
  - **Sleep-mood correlation**: 🆕 How sleep quality impacts your mental health
  - **Exercise-mood correlation**: 🆕 How physical activity affects your mental health
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

Track your sleep patterns, quality, and discover how sleep affects your mental health and mood. Sleep is crucial for recovery, especially after trauma or during mental health challenges.

### Features

- **Sleep Logging**: Track bedtime, wake time, duration, and quality (1-10 scale)
- **Automatic Duration Calculation**: Handles overnight sleep automatically
- **Sleep Statistics**: Average duration, quality, sleep debt tracking
- **Schedule Consistency Analysis**: Monitor bedtime regularity
- **Sleep Insights**: Discover patterns in your sleep data
  - **Duration patterns**: How often you get optimal sleep (7-9h)
  - **Quality correlations**: Relationship between duration and quality
  - **Weekday patterns**: Best and worst sleep days
  - **Personalized recommendations**: Your optimal sleep pattern
- **Sleep-Mood Correlation**: 🔗 Integrates with Mental Health Tracker
  - See how sleep quality affects your mood
  - Quantify the impact of good vs. poor sleep
  - Identify your optimal sleep sweet spot
- **Sleep History**: View recent sleep entries with visual quality indicators
- **Sleep Debt Tracking**: Monitor accumulated sleep deficit

### Quick Start

```bash
# Log a sleep entry
node sleep-tracker.js log 22:30 06:30 8 "Felt refreshed"
# Format: bedtime wake-time quality(1-10) [notes]

# View statistics
node sleep-tracker.js stats

# View sleep history (default: last 7 days)
node sleep-tracker.js history
node sleep-tracker.js history 14  # Last 14 days

# Discover sleep insights and patterns
node sleep-tracker.js insights

# Get help
node sleep-tracker.js help
```

### Example Output

```
✓ Sleep entry logged successfully!
  Date: 2025-11-16
  Bedtime: 22:30 → Wake: 06:30
  Duration: 8.0 hours
  Quality: 8/10

✓ Great sleep duration! You're in the recommended 7-9 hour range.
😊 Excellent sleep quality!
```

### Sleep-Mood Integration

When you track both sleep and mood, the Mental Health Tracker's insights will automatically include sleep-mood correlations:

```bash
# Run mental health insights to see sleep correlations
node mental-health-tracker.js insights
```

**Example Sleep-Mood Insights:**
```
😴 Sleep → Mood Correlation:
   ✓ When well-rested (7-9h): Average mood 8.2/10
   ⚠️  When sleep-deprived (<6h): Average mood 5.1/10
   📊 Impact: Good sleep improves your mood by 3.1 points!
   🎯 Your optimal sleep pattern:
      Duration: 7.8h, Quality: 8.5/10
```

### Why Sleep Tracking Matters

- **Mental Health**: Sleep deprivation worsens anxiety, depression, and PTSD symptoms
- **Recovery**: Quality sleep is essential for trauma recovery and healing
- **Pattern Recognition**: Identify what affects your sleep quality
- **Data-Driven Decisions**: Use objective data to improve sleep habits
- **Healthcare Conversations**: Share sleep data with doctors and therapists

### Tips for Better Sleep

- 🕐 **Consistency**: Go to bed and wake up at the same time daily
- 📱 **Screen Time**: Avoid screens 1 hour before bed
- ☕ **Caffeine**: No caffeine after 2 PM
- 🏃 **Exercise**: Regular physical activity improves sleep
- 🌡️ **Environment**: Cool, dark, quiet bedroom
- 📝 **Track Regularly**: Use this tracker to monitor what works for you

<details>
<summary>💾 <b>Data Management</b></summary>

**Data Location:**
- Default: `sleep-data.json` in project directory
- JSON format for easy backup/export
- Fully portable between devices

**Backup Your Data:**
```bash
# Simple backup
cp sleep-data.json sleep-data-backup-$(date +%Y%m%d).json

# Or use git
git add sleep-data.json
git commit -m "Backup sleep data"
```

**Integration with Mental Health Tracker:**
- Sleep data is automatically read by mental health insights
- No manual synchronization needed
- Both trackers work independently or together
</details>

---

## 💪 Exercise Tracker

Track your physical activity and discover how exercise impacts your mental health and sleep quality. Physical activity is one of the most effective treatments for anxiety, depression, and PTSD.

### Features

- **Activity Logging**: Track type, duration (minutes), intensity (1-10), and notes
- **Exercise Statistics**: Total time, averages, streaks, goal progress
- **Weekly Goals**: Set targets (default: 150 min/week WHO recommendation)
- **Activity Insights**: Discover patterns in your exercise habits
  - **Intensity distribution**: Light, moderate, vigorous breakdown
  - **Timing patterns**: Most active days of the week
  - **Activity preferences**: Which exercises you do most
- **Streak Tracking**: Monitor consecutive active days to build habits
- **Mood Correlation**: 🔗 Integrates with Mental Health Tracker
  - Compare mood on exercise vs. rest days
  - Identify best activities for your mood
  - Discover optimal exercise intensity for you
- **Sleep Correlation**: 🔗 Integrates with Sleep Tracker
  - How exercise affects sleep quality
  - Best exercise timing for better sleep
  - Impact of exercise intensity on sleep

### Quick Start

```bash
# Log an activity
node exercise-tracker.js log Running 30 7 "Morning run felt great"
# Format: type duration-minutes intensity(1-10) [notes]

# View statistics and goal progress
node exercise-tracker.js stats

# View activity history (default: last 7 days)
node exercise-tracker.js history
node exercise-tracker.js history 14  # Last 14 days

# Discover exercise insights and patterns
node exercise-tracker.js insights

# Set weekly goals
node exercise-tracker.js goals 180 5  # 180 min/week, 5 days/week

# See common activity types
node exercise-tracker.js types

# Get help
node exercise-tracker.js help
```

### Example Output

```
✓ Activity logged successfully!
  Type: Running
  Duration: 30 minutes
  Intensity: 7/10

✓ Great! You met the 30-minute activity recommendation.
🔥 High intensity! Great for cardiovascular health.
💚 Exercise boosts mood and reduces anxiety/depression symptoms!
```

### Integrated Insights

When you track exercise along with mood and sleep, you'll get powerful correlations in your mental health and sleep insights:

**Exercise-Mood Correlation** (in mental health insights):
```
💪 Exercise → Mood Correlation:
   📊 Days with exercise: Average mood 8.1/10 (12 days)
   📊 Days without exercise: Average mood 6.3/10 (8 days)
   ✅ Exercise boosts your mood by 1.8 points!
   ⭐ Best activity for your mood: Yoga
      Average mood: 8.5/10 (5 sessions)
```

**Exercise-Sleep Correlation** (in sleep insights):
```
💪 Exercise → Sleep Quality:
   📊 After exercise days: Quality 8.2/10, Duration 7.8h (10 nights)
   📊 No exercise days: Quality 6.9/10, Duration 7.2h (7 nights)
   ✅ Exercise improves sleep quality by 1.3 points!
   💤 You sleep 0.6h longer after exercise!
```

### Why Exercise Tracking Matters

- **Mental Health**: Regular exercise reduces anxiety, depression, and PTSD symptoms as effectively as medication for many people
- **Sleep Quality**: Physical activity improves sleep duration and quality
- **Recovery**: Exercise is essential for trauma recovery and building resilience
- **Pattern Recognition**: Identify which activities work best for YOUR mental health
- **Habit Building**: Streak tracking helps build consistent exercise habits
- **Healthcare Conversations**: Share data-driven insights with doctors and therapists

### Tips for Success

- 💡 **Start Small**: Even 10 minutes counts! Build gradually
- 🎯 **Set Realistic Goals**: WHO recommends 150 min/week moderate activity
- 🏃 **Mix It Up**: Combine cardio, strength, and flexibility
- ⏰ **Find Your Time**: Morning, lunch, or evening - whatever works for you
- 📊 **Track Honestly**: Log actual intensity, not what you wish it was
- 🔥 **Build Streaks**: Consistency matters more than intensity
- 💊 **Medicine Alternative**: Exercise can be as effective as medication for mild-moderate depression

<details>
<summary>💾 <b>Data Management</b></summary>

**Data Location:**
- Default: `exercise-data.json` in project directory
- JSON format for easy backup/export
- Fully portable between devices

**Backup Your Data:**
```bash
# Simple backup
cp exercise-data.json exercise-data-backup-$(date +%Y%m%d).json

# Or use git
git add exercise-data.json
git commit -m "Backup exercise data"
```

**Integration with Other Trackers:**
- Exercise data is automatically read by mental health and sleep insights
- No manual synchronization needed
- All trackers work independently or together seamlessly
</details>

---

## 📊 Daily Dashboard

Get a comprehensive view of your wellness across all health trackers in one beautiful dashboard. See your overall wellness score, today's activities, and personalized recommendations - all in a single command!

### Why Use the Dashboard?

- **Holistic View**: See mental health, sleep, exercise, and medications together
- **Wellness Score**: Get a quantified 0-100 score based on all your health metrics
- **Quick Check-In**: Understand your overall health status at a glance
- **Personalized Recommendations**: Get actionable suggestions based on YOUR data
- **Weekly Summaries**: Track progress and patterns over time

### Features

#### Daily Dashboard View
```bash
node daily-dashboard.js
# or just: node daily-dashboard.js today
```

**Shows:**
- **Wellness Score (0-100)**: Calculated from mood, sleep, exercise, medication adherence
- **Mental Health Summary**: Today's mood, journal entries, symptoms
- **Sleep Summary**: Last night's quality, duration, optimal range check
- **Exercise Summary**: Activities, duration, intensity, goal progress
- **Medication Summary**: Adherence rate, missed medications
- **Smart Recommendations**: Personalized tips based on your data

#### Weekly Summary View
```bash
node daily-dashboard.js weekly
```

**Shows:**
- Average mood for the week
- Sleep quality & duration averages
- Total exercise minutes & WHO goal progress (150 min/week)
- Medication adherence rate
- Days active vs. total days

### Example Output

```
╔════════════════════════════════════════════════════════════════════╗
║                    🌟 DAILY WELLNESS DASHBOARD                     ║
║                     Monday, November 18, 2025                      ║
╚════════════════════════════════════════════════════════════════════╝

┌─ WELLNESS SCORE ───────────────────────────────────────────────────┐
│
│  🟢 85/100 - Excellent
│
│  [████████████████████████████████████░░░░░]
│
│  Breakdown:
│    😊 Mood: 80%
│    😴 Sleep: 88%
│    💪 Exercise: 83%
│    💊 Medications: 100%
└────────────────────────────────────────────────────────────────────┘

┌─ 🧠 MENTAL HEALTH ────────────────────────────────────────────────┐
│
│  Mood: 😊 8.0/10
│  Journal: ✓ 1 entry
│  Symptoms: 0 logged
└────────────────────────────────────────────────────────────────────┘

┌─ 😴 SLEEP ────────────────────────────────────────────────────────┐
│
│  Quality: 😊 8/10
│  Duration: 7.5 hours
│  ✓ Optimal sleep duration (7-9h)
└────────────────────────────────────────────────────────────────────┘

┌─ 💪 EXERCISE ─────────────────────────────────────────────────────┐
│
│  Activity: ✓ 1 session
│  Duration: 30 minutes
│  Intensity: 😊 Moderate (7.0/10)
│  ✓ Met daily activity goal (30+ min)
└────────────────────────────────────────────────────────────────────┘

┌─ 💊 MEDICATIONS ──────────────────────────────────────────────────┐
│
│  Adherence: 2/2 taken (100%)
│  ✓ All medications taken!
└────────────────────────────────────────────────────────────────────┘

┌─ 💡 RECOMMENDATIONS ──────────────────────────────────────────────┐
│
│  🎉 Great job meeting your activity goal!
│  ⭐ Excellent wellness today! Keep it up!
└────────────────────────────────────────────────────────────────────┘

──────────────────────────────────────────────────────────────────────
```

### How the Wellness Score Works

The dashboard calculates a 0-100 wellness score based on four components:

**🧠 Mood (25 points max)**
- Based on your mood rating (1-10 scale)
- Higher mood → Higher score
- Example: Mood of 8/10 = 20 points

**😴 Sleep (25 points max)**
- Quality (15 points): Based on sleep quality rating
- Duration (10 points): Optimal range is 7-9 hours
- Example: 8/10 quality + 7.5h duration = 22 points

**💪 Exercise (25 points max)**
- Based on minutes of activity vs. 30-minute daily goal
- 30+ minutes = full 25 points
- Example: 30 min exercise = 25 points

**💊 Medications (25 points max)**
- Based on adherence rate (taken / total)
- 100% adherence = full 25 points
- Example: 2/2 taken = 25 points

**Total Score:**
- Normalized to 100 if not all categories tracked
- 85-100: 🟢 Excellent
- 70-84: 🟢 Good
- 50-69: 🟡 Fair
- 0-49: 🔴 Needs Attention

### Smart Recommendations

The dashboard provides personalized recommendations based on your data:

**Mental Health:**
- Low mood (<5) → Suggests reaching out to support network
- No journal today → Reminds you to journal

**Sleep:**
- Poor quality (<5) → Suggests relaxation techniques
- Sleep deprived (<6h) → Encourages prioritizing 7-9 hours

**Exercise:**
- No activity → Suggests even 10 minutes helps
- Goal met → Positive reinforcement

**Medications:**
- Missed doses → Reminder to take them
- 100% adherence → Praise and encouragement

### Integration

The dashboard automatically pulls data from:
- `mental-health-data.json` (mood, journal, symptoms)
- `sleep-data.json` (sleep quality & duration)
- `exercise-data.json` (activities, duration, intensity)
- `medications.json` (active meds, adherence history)

**No setup required** - just use the trackers and check your dashboard!

### Use Cases

**Morning Routine:**
```bash
# Start your day by reviewing yesterday and setting intentions
node daily-dashboard.js
```

**Weekly Check-In:**
```bash
# Every Sunday, review your week's progress
node daily-dashboard.js weekly
```

**Healthcare Appointments:**
- Export your weekly summaries
- Share quantified wellness data with doctors/therapists
- Track treatment effectiveness over time

**Recovery Tracking:**
- See your wellness score trend over weeks/months
- Identify what combinations work best for YOU
- Make data-driven decisions about your health

### Tips for Best Results

- 📅 **Check Daily**: Make it part of your morning routine
- 📊 **Track Consistently**: The more data, the better the insights
- 🎯 **Set Goals**: Use recommendations to improve your score
- 📈 **Monitor Trends**: Use weekly view to see progress
- 💬 **Share with Care Team**: Export data for healthcare providers

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

**Version**: 3.5.0
**Status**: ✅ Active Development
**Test Coverage**: 87.21%+ ⭐
**Branch Coverage**: 71.64% ⭐ **MILESTONE ACHIEVED!** (3 modules at 70%+: Mental Health 70.75%, Medication 72.94%, Reminder 94.44% 🎯)
**Tests**: 833 passing
**Latest Features**:
- 📊 **Daily Dashboard** 🆕 (Unified wellness view with 0-100 scoring across all trackers)
- 💪 **Exercise Tracking** (Activity logging + Exercise-Mood & Exercise-Sleep correlations)
- 😴 **Sleep Tracking** (Quality monitoring + Sleep-Mood correlation)
- ⚠️ Drug Interaction Warnings (65+ interactions)
- 🔍 **Insights & Correlations** (comprehensive pattern detection across all health data)
**CI/CD**: ✅ Automated with quality gates

---

## 🙏 Acknowledgments

Built with ❤️ to support personal health, wellness, and professional development.

**Remember**: These tools are meant to support your wellness journey, not replace professional medical care. Always consult healthcare professionals for medical advice.

---

<p align="center">
  <strong>Stay healthy, stay learning! 🌟</strong>
</p>
