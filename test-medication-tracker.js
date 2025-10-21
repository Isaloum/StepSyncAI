const MedicationTracker = require('./medication-tracker.js');
const fs = require('fs');

// Use a test data file so we don't interfere with real data
const testDataFile = 'medications-test.json';

console.log('🧪 Testing Medication Tracker\n');

// Clean up any existing test data
if (fs.existsSync(testDataFile)) {
    fs.unlinkSync(testDataFile);
}

const tracker = new MedicationTracker(testDataFile);

console.log('\n1️⃣  Adding medications...\n');
const med1 = tracker.addMedication('Aspirin', '100mg', 'daily', '08:00');
const med2 = tracker.addMedication('Vitamin D', '1000 IU', 'daily', '08:00');
const med3 = tracker.addMedication('Blood Pressure Med', '50mg', 'twice-daily', '08:00,20:00');

console.log('\n2️⃣  Listing all medications...\n');
tracker.listMedications();

console.log('\n3️⃣  Marking Aspirin as taken...\n');
if (med1) {
    tracker.markAsTaken(med1.id, 'Taken with breakfast');
}

console.log('\n4️⃣  Checking today\'s status...\n');
tracker.checkTodayStatus();

console.log('\n5️⃣  Marking Vitamin D as taken...\n');
if (med2) {
    tracker.markAsTaken(med2.id);
}

console.log('\n6️⃣  Checking today\'s status again...\n');
tracker.checkTodayStatus();

console.log('\n7️⃣  Viewing history...\n');
tracker.getHistory();

console.log('\n✅ Test completed! Test data saved to:', testDataFile);
console.log('You can delete the test file when done.\n');
