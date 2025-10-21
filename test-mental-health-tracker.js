const MentalHealthTracker = require('./mental-health-tracker');
const fs = require('fs');

// Test file - will be deleted after test
const TEST_FILE = 'test-mental-health-data.json';

console.log('='.repeat(70));
console.log('🧠 MENTAL HEALTH TRACKER - DEMONSTRATION');
console.log('='.repeat(70));
console.log('\nThis demo shows how to use the mental health tracker');
console.log('for managing mental health after a work accident.\n');

// Clean up old test file
if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
}

const tracker = new MentalHealthTracker(TEST_FILE);

// Simulate a delay for better visualization
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runDemo() {
    console.log('\n' + '='.repeat(70));
    console.log('1. SETTING UP PROFILE');
    console.log('='.repeat(70));
    tracker.setupProfile('2024-06-15', 'Workplace machinery accident - injured hand, developed anxiety and PTSD symptoms');

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('2. ADDING EMERGENCY CONTACTS');
    console.log('='.repeat(70));
    tracker.addEmergencyContact('Dr. Sarah Johnson', 'Therapist', '555-0123', 'Specializes in workplace trauma');
    tracker.addEmergencyContact('Crisis Hotline', 'Support', '988', '24/7 crisis support');
    tracker.addEmergencyContact('Mom', 'Family', '555-0456', 'Available evenings');

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('3. LISTING EMERGENCY CONTACTS');
    console.log('='.repeat(70));
    tracker.listEmergencyContacts();

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('4. LOGGING MOODS OVER SEVERAL DAYS');
    console.log('='.repeat(70));

    // Simulate entries over time
    const moodEntries = [
        { rating: 3, note: 'Struggled to get out of bed, very anxious' },
        { rating: 4, note: 'Slightly better after talking to therapist' },
        { rating: 5, note: 'Neutral day, managing' },
        { rating: 6, note: 'Good therapy session, feeling hopeful' },
        { rating: 5, note: 'Had a setback but used coping strategies' }
    ];

    for (const entry of moodEntries) {
        tracker.logMood(entry.rating, entry.note);
        await delay(800);
    }

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('5. VIEWING MOOD HISTORY');
    console.log('='.repeat(70));
    tracker.viewMoodHistory(7);

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('6. LOGGING SYMPTOMS');
    console.log('='.repeat(70));
    tracker.logSymptom('anxiety', 7, 'Heart racing, sweating');
    await delay(500);
    tracker.logSymptom('flashback', 8, 'Saw similar machinery at store');
    await delay(500);
    tracker.logSymptom('insomnia', 6, 'Woke up at 3am, could not go back to sleep');
    await delay(500);
    tracker.logSymptom('anxiety', 5, 'Better than yesterday');
    await delay(500);
    tracker.logSymptom('physical-pain', 4, 'Hand still hurts');

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('7. VIEWING SYMPTOM SUMMARY');
    console.log('='.repeat(70));
    tracker.viewSymptoms(7);

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('8. ADDING JOURNAL ENTRIES');
    console.log('='.repeat(70));
    tracker.addJournal(
        'Today was hard. Had to drive past the workplace and felt my chest tighten. But I made it through and used breathing exercises.',
        'general'
    );
    await delay(500);
    tracker.addJournal(
        'Therapy session focused on EMDR for the accident memory. Exhausting but necessary.',
        'therapy'
    );
    await delay(500);
    tracker.addJournal(
        'Small win: I was able to use a kitchen knife without panicking. Progress!',
        'progress'
    );

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('9. VIEWING JOURNAL ENTRIES');
    console.log('='.repeat(70));
    tracker.viewJournal(7);

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('10. IDENTIFYING TRIGGERS');
    console.log('='.repeat(70));
    tracker.addTrigger('Loud machinery sounds', 9);
    await delay(500);
    tracker.addTrigger('Workplace parking lot', 7);
    await delay(500);
    tracker.addTrigger('News about workplace accidents', 8);

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('11. LISTING TRIGGERS');
    console.log('='.repeat(70));
    tracker.listTriggers();

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('12. ADDING COPING STRATEGIES');
    console.log('='.repeat(70));
    tracker.addCopingStrategy(
        'Deep Breathing',
        '4-7-8 breathing technique: Inhale 4 counts, hold 7, exhale 8'
    );
    await delay(500);
    tracker.addCopingStrategy(
        'Grounding Exercise',
        '5-4-3-2-1: Name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste'
    );
    await delay(500);
    tracker.addCopingStrategy(
        'Call Support',
        'Call mom or therapist when feeling overwhelmed'
    );
    await delay(500);
    tracker.addCopingStrategy(
        'Gentle Walk',
        'Take a 10-minute walk in nature'
    );

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('13. USING COPING STRATEGIES (with effectiveness ratings)');
    console.log('='.repeat(70));

    // Get strategy IDs
    const strategies = tracker.data.copingStrategies;
    tracker.useCopingStrategy(strategies[0].id, 8);
    await delay(500);
    tracker.useCopingStrategy(strategies[0].id, 7);
    await delay(500);
    tracker.useCopingStrategy(strategies[1].id, 9);
    await delay(500);
    tracker.useCopingStrategy(strategies[3].id, 6);

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('14. VIEWING COPING STRATEGIES (sorted by effectiveness)');
    console.log('='.repeat(70));
    tracker.listCopingStrategies();

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('15. SETTING RECOVERY GOALS');
    console.log('='.repeat(70));
    tracker.addGoal('Attend all therapy sessions this month', '2024-07-31');
    await delay(500);
    tracker.addGoal('Go back to work part-time', '2024-08-15');
    await delay(500);
    tracker.addGoal('Sleep 6+ hours without waking');
    await delay(500);
    tracker.addGoal('Practice mindfulness daily for a week');

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('16. COMPLETING A GOAL');
    console.log('='.repeat(70));
    const firstGoal = tracker.data.goals[0];
    tracker.completeGoal(firstGoal.id);

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('17. VIEWING ACTIVE GOALS');
    console.log('='.repeat(70));
    tracker.listGoals();

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('18. DAILY CHECK-IN');
    console.log('='.repeat(70));
    tracker.quickCheckIn();

    await delay(1500);

    console.log('\n' + '='.repeat(70));
    console.log('19. VIEWING PROFILE');
    console.log('='.repeat(70));
    tracker.viewProfile();

    await delay(1500);

    console.log('\n\n' + '='.repeat(70));
    console.log('DEMONSTRATION COMPLETE!');
    console.log('='.repeat(70));
    console.log('\nKey Features Demonstrated:');
    console.log('  ✓ Profile setup with accident information');
    console.log('  ✓ Emergency contact management');
    console.log('  ✓ Mood tracking with notes');
    console.log('  ✓ Symptom logging and monitoring');
    console.log('  ✓ Journal entries (general, therapy, progress)');
    console.log('  ✓ Trigger identification and tracking');
    console.log('  ✓ Coping strategies with effectiveness ratings');
    console.log('  ✓ Recovery goal setting and completion');
    console.log('  ✓ Daily check-in summaries');

    console.log('\n💡 Usage Tips:');
    console.log('  • Use daily check-ins to monitor your progress');
    console.log('  • Rate coping strategies to find what works best');
    console.log('  • Track triggers to identify patterns');
    console.log('  • Review mood and symptom trends with your therapist');
    console.log('  • Celebrate small wins and completed goals!');

    console.log('\n📞 Important Reminder:');
    console.log('  This is a personal tracking tool to support your recovery.');
    console.log('  Always work with mental health professionals for treatment.');
    console.log('  In crisis: Call 988 (Suicide & Crisis Lifeline)');

    console.log('\n📁 Test data saved to: ' + TEST_FILE);
    console.log('To clean up: delete ' + TEST_FILE);
    console.log('\n' + '='.repeat(70));
}

// Run the demo
runDemo().catch(console.error);
