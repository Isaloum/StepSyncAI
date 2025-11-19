#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const chalk = require('chalk');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
    console.clear();
    console.log(chalk.cyan.bold('\n🏥 Welcome to StepSyncAI Health & Wellness Apps!\n'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.white('\nThis interactive setup will help you get started with:\n'));
    console.log(chalk.green('  • 🧠 Mental Health Tracker') + ' - Mood, symptoms, triggers');
    console.log(chalk.green('  • 💊 Medication Tracker') + ' - Pill reminders & adherence');
    console.log(chalk.green('  • 😴 Sleep Tracker') + ' - Quality & duration monitoring');
    console.log(chalk.green('  • 🏃 Exercise Tracker') + ' - Physical activity logging');
    console.log(chalk.green('  • 📊 Daily Dashboard') + ' - Unified wellness overview');
    console.log(chalk.green('  • ☁️  AWS For Kids') + ' - Cloud practitioner exam prep');
    console.log(chalk.gray('\n' + '═'.repeat(60) + '\n'));

    // Check if user wants to continue
    const proceed = await question(chalk.yellow('Ready to get started? (yes/no): '));
    if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        console.log(chalk.gray('\nNo problem! Run this script anytime with: npm run setup\n'));
        rl.close();
        return;
    }

    console.log(chalk.cyan('\n\n📋 Quick Setup Guide\n'));
    console.log(chalk.gray('─'.repeat(60)));

    // Step 1: Mental Health Profile
    console.log(chalk.bold('\n1️⃣  Mental Health Tracker\n'));
    const setupMental = await question(chalk.white('   Set up your mental health profile? (yes/no): '));

    if (setupMental.toLowerCase() === 'yes' || setupMental.toLowerCase() === 'y') {
        console.log(chalk.gray('\n   Example command:'));
        console.log(chalk.white('   node mental-health-tracker.js profile-setup "2024-01-01" "Recovery journey"'));
        console.log(chalk.gray('\n   This creates your profile with accident date and description.'));
        console.log(chalk.yellow('\n   ✏️  Try it: npm run mental profile-setup "YYYY-MM-DD" "Your description"'));
    }

    // Step 2: Medication Tracker
    console.log(chalk.bold('\n2️⃣  Medication Tracker\n'));
    const setupMeds = await question(chalk.white('   Add your medications? (yes/no): '));

    if (setupMeds.toLowerCase() === 'yes' || setupMeds.toLowerCase() === 'y') {
        console.log(chalk.gray('\n   Example command:'));
        console.log(chalk.white('   node medication-tracker.js add "Aspirin" "100mg" "Once daily" "08:00"'));
        console.log(chalk.gray('\n   This adds a medication with dosage, frequency, and reminder time.'));
        console.log(chalk.yellow('\n   ✏️  Try it: npm run med add "MedName" "Dosage" "Frequency" "Time"'));
    }

    // Step 3: Sample Data
    console.log(chalk.bold('\n3️⃣  Sample Data\n'));
    const createSamples = await question(chalk.white('   Generate sample wellness data to explore features? (yes/no): '));

    if (createSamples.toLowerCase() === 'yes' || createSamples.toLowerCase() === 'y') {
        console.log(chalk.cyan('\n   Generating sample data...'));

        try {
            const MentalHealthTracker = require('./mental-health-tracker');
            const SleepTracker = require('./sleep-tracker');
            const ExerciseTracker = require('./exercise-tracker');

            // Create sample mood logs
            const mental = new MentalHealthTracker('test-mental-health-data.json');
            const today = new Date();

            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const timestamp = date.toISOString();
                const rating = Math.floor(Math.random() * 4) + 6; // 6-9

                mental.data.moodLogs.push({
                    rating,
                    note: `Sample mood entry ${i + 1}`,
                    timestamp
                });
            }
            mental.saveData();

            // Create sample sleep entries
            const sleep = new SleepTracker('test-sleep.json');
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);

                sleep.data.sleepEntries.push({
                    id: i + 1,
                    date: date.toISOString().split('T')[0],
                    bedtime: '22:30',
                    wakeTime: '06:30',
                    duration: 7.5 + (Math.random() - 0.5),
                    quality: Math.floor(Math.random() * 3) + 7,
                    notes: `Sample sleep entry ${i + 1}`,
                    timestamp: date.toISOString()
                });
            }
            sleep.saveData();

            // Create sample exercise logs
            const exercise = new ExerciseTracker('test-exercise.json');
            for (let i = 0; i < 5; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);

                exercise.data.exercises.push({
                    id: i + 1,
                    date: date.toISOString().split('T')[0],
                    type: ['Running', 'Cycling', 'Yoga', 'Swimming'][Math.floor(Math.random() * 4)],
                    duration: Math.floor(Math.random() * 30) + 20,
                    intensity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
                    notes: `Sample exercise ${i + 1}`,
                    timestamp: date.toISOString()
                });
            }
            exercise.saveData();

            console.log(chalk.green('   ✅ Sample data created!'));
            console.log(chalk.gray('\n   Test files created:'));
            console.log(chalk.white('      • test-mental-health-data.json'));
            console.log(chalk.white('      • test-sleep.json'));
            console.log(chalk.white('      • test-exercise.json'));
        } catch (error) {
            console.log(chalk.red(`   ❌ Error creating sample data: ${error.message}`));
        }
    }

    // Step 4: Quick Command Reference
    console.log(chalk.bold('\n4️⃣  Quick Command Reference\n'));
    console.log(chalk.gray('   Here are the most useful commands:\n'));

    console.log(chalk.cyan('   Mental Health:'));
    console.log(chalk.white('      npm run mental log-mood 8 "Feeling good"'));
    console.log(chalk.white('      npm run mental daily'));

    console.log(chalk.cyan('\n   Sleep Tracking:'));
    console.log(chalk.white('      node sleep-tracker.js log 22:30 06:30 8'));
    console.log(chalk.white('      node sleep-tracker.js stats'));

    console.log(chalk.cyan('\n   Exercise:'));
    console.log(chalk.white('      node exercise-tracker.js log "Running" 30 moderate'));
    console.log(chalk.white('      node exercise-tracker.js today'));

    console.log(chalk.cyan('\n   Daily Dashboard:'));
    console.log(chalk.white('      node daily-dashboard.js daily'));
    console.log(chalk.white('      node daily-dashboard.js correlations'));
    console.log(chalk.white('      node daily-dashboard.js export-pdf'));

    // Step 5: Documentation
    console.log(chalk.bold('\n5️⃣  Documentation & Help\n'));
    console.log(chalk.gray('   For detailed help on any tracker, run:\n'));
    console.log(chalk.white('      node <tracker>.js help'));
    console.log(chalk.gray('\n   Check the README for complete documentation:\n'));
    console.log(chalk.white('      cat README.md | less'));

    // Final message
    console.log(chalk.gray('\n' + '═'.repeat(60)));
    console.log(chalk.green.bold('\n✅ Setup Complete!\n'));
    console.log(chalk.white('You\'re all set to start tracking your wellness journey.'));
    console.log(chalk.yellow('\n💡 Pro tip: Run commands daily to build meaningful insights!\n'));
    console.log(chalk.gray('═'.repeat(60) + '\n'));

    rl.close();
}

// Run setup
setup().catch(err => {
    console.error(chalk.red('\n❌ Setup error:', err.message));
    rl.close();
    process.exit(1);
});
