// Demo: Enhanced Medication Tracker with Multi-Region Compliance
// Run with: node examples/demo_compliance.js

const { EnhancedMedicationTracker } = require('../medication-tracker-enhanced');

async function runDemo() {
    console.log("=== Initializing Tracker (Region: BOTH - US & CA) ===");
    const tracker = new EnhancedMedicationTracker({
        userId: 'demo-user',
        region: 'BOTH' // Enable both FDA and Health Canada checks
    });

    try {
        console.log("\n--- Adding 'Lisinopril 10mg' (Valid) ---");
        const med = await tracker.addMedicationWithFDAVerification({
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'once daily'
        });
        console.log("✅ Medication Added Successfully:");
        console.log(JSON.stringify(med, null, 2));

        console.log("\n--- Attempting Security Attack (XSS) ---");
        try {
            await tracker.addMedicationWithFDAVerification({
                name: '<script>alert("hacked")</script>',
                dosage: '10mg'
            });
        } catch (error) {
            console.log("🛡️ Security Check Passed: Blocked malicious input.");
            console.log("Error:", error.message);
        }

        console.log("\n--- Accessing Audit Logs ---");
        const logs = tracker.getMedicationAuditTrail(med.id);
        console.log(`Found ${logs.length} audit entries.`);
        console.log("Latest Action:", logs[logs.length-1].action);

    } catch (error) {
        console.error("Demo Error:", error);
    }
}

runDemo();
