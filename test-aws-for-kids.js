const AWSForKids = require('./aws-for-kids');
const fs = require('fs');

// Test file for AWS For Kids app
const TEST_DATA_FILE = 'test-aws-learning-progress.json';

function cleanup() {
    if (fs.existsSync(TEST_DATA_FILE)) {
        fs.unlinkSync(TEST_DATA_FILE);
    }
}

function test(description, fn) {
    try {
        fn();
        console.log(`✅ ${description}`);
        return true;
    } catch (error) {
        console.log(`❌ ${description}`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

console.log('\n' + '═'.repeat(70));
console.log('🧪 TESTING AWS FOR KIDS APP');
console.log('═'.repeat(70) + '\n');

let passed = 0;
let failed = 0;

// Test 1: Initialize app
test('Test 1: Initialize app', () => {
    const app = new AWSForKids(TEST_DATA_FILE);
    if (!app) throw new Error('Failed to initialize app');
    if (!app.concepts) throw new Error('Concepts not loaded');
    passed++;
});

// Test 2: Load concepts
test('Test 2: Load AWS concepts', () => {
    const app = new AWSForKids(TEST_DATA_FILE);
    const conceptCount = Object.keys(app.concepts).length;
    if (conceptCount < 15) throw new Error(`Expected at least 15 concepts, got ${conceptCount}`);

    // Check for essential concepts
    const essentialConcepts = ['ec2', 's3', 'iam', 'lambda', 'rds'];
    essentialConcepts.forEach(concept => {
        if (!app.concepts[concept]) {
            throw new Error(`Missing essential concept: ${concept}`);
        }
    });
    passed++;
});

// Test 3: Check concept structure
test('Test 3: Verify concept structure', () => {
    const app = new AWSForKids(TEST_DATA_FILE);
    const ec2 = app.concepts['ec2'];

    const requiredFields = ['name', 'emoji', 'simple', 'explanation', 'category', 'examWeight'];
    requiredFields.forEach(field => {
        if (!ec2[field]) {
            throw new Error(`Missing field in concept: ${field}`);
        }
    });
    passed++;
});

// Test 4: Quiz questions loaded
test('Test 4: Load quiz questions', () => {
    const app = new AWSForKids(TEST_DATA_FILE);
    if (!app.quizQuestions || app.quizQuestions.length === 0) {
        throw new Error('Quiz questions not loaded');
    }
    if (app.quizQuestions.length < 10) {
        throw new Error(`Expected at least 10 questions, got ${app.quizQuestions.length}`);
    }
    passed++;
});

// Test 5: Quiz question structure
test('Test 5: Verify quiz question structure', () => {
    const app = new AWSForKids(TEST_DATA_FILE);
    const question = app.quizQuestions[0];

    const requiredFields = ['question', 'options', 'correct', 'explanation'];
    requiredFields.forEach(field => {
        if (question[field] === undefined) {
            throw new Error(`Missing field in quiz question: ${field}`);
        }
    });

    if (!Array.isArray(question.options) || question.options.length < 2) {
        throw new Error('Quiz options must be an array with at least 2 items');
    }
    passed++;
});

// Test 6: Data persistence
test('Test 6: Save and load data', () => {
    const app = new AWSForKids(TEST_DATA_FILE);

    // Simulate learning a topic
    app.data.completedLessons = ['ec2', 's3', 'iam'];
    app.data.quizScores = [{
        date: new Date().toISOString(),
        score: 8,
        total: 10,
        percentage: 80
    }];

    if (!app.saveData()) {
        throw new Error('Failed to save data');
    }

    // Load in new instance
    const app2 = new AWSForKids(TEST_DATA_FILE);
    if (app2.data.completedLessons.length !== 3) {
        throw new Error('Data not persisted correctly');
    }
    if (app2.data.quizScores.length !== 1) {
        throw new Error('Quiz scores not persisted correctly');
    }
    passed++;
});

// Test 7: Learn function
test('Test 7: Learn function tracking', () => {
    cleanup(); // Start fresh
    const app = new AWSForKids(TEST_DATA_FILE);

    const initialCount = app.data.completedLessons.length;

    // Capture console output
    const originalLog = console.log;
    let output = '';
    console.log = (msg) => { output += msg + '\n'; };

    app.learn('ec2');

    console.log = originalLog;

    if (!output.includes('EC2')) {
        throw new Error('Learn function did not display EC2 content');
    }

    if (app.data.completedLessons.length !== initialCount + 1) {
        throw new Error('Learn function did not track completion');
    }
    passed++;
});

// Test 8: Categories
test('Test 8: Verify service categories', () => {
    const app = new AWSForKids(TEST_DATA_FILE);

    const categories = new Set();
    Object.values(app.concepts).forEach(concept => {
        categories.add(concept.category);
    });

    const expectedCategories = ['Compute', 'Storage', 'Database', 'Security', 'Networking'];
    expectedCategories.forEach(cat => {
        if (!categories.has(cat)) {
            throw new Error(`Missing category: ${cat}`);
        }
    });
    passed++;
});

// Test 9: Exam weights
test('Test 9: Verify exam importance weights', () => {
    const app = new AWSForKids(TEST_DATA_FILE);

    const validWeights = ['HIGH', 'MEDIUM', 'LOW'];
    Object.entries(app.concepts).forEach(([key, concept]) => {
        if (!validWeights.includes(concept.examWeight)) {
            throw new Error(`Invalid exam weight for ${key}: ${concept.examWeight}`);
        }
    });
    passed++;
});

// Test 10: High priority topics
test('Test 10: Verify high-priority exam topics exist', () => {
    const app = new AWSForKids(TEST_DATA_FILE);

    const highPriority = ['ec2', 's3', 'iam', 'pricing', 'shared-responsibility'];
    highPriority.forEach(topic => {
        if (!app.concepts[topic]) {
            throw new Error(`Missing high-priority topic: ${topic}`);
        }
        if (app.concepts[topic].examWeight !== 'HIGH') {
            throw new Error(`Topic ${topic} should have HIGH exam weight`);
        }
    });
    passed++;
});

// Test 11: Simple explanations
test('Test 11: Verify child-friendly explanations', () => {
    const app = new AWSForKids(TEST_DATA_FILE);

    Object.entries(app.concepts).forEach(([key, concept]) => {
        if (concept.simple.length < 10) {
            throw new Error(`Simple explanation for ${key} is too short`);
        }
        if (concept.explanation.length < 50) {
            throw new Error(`Detailed explanation for ${key} is too short`);
        }
    });
    passed++;
});

// Test 12: Quiz answer validation
test('Test 12: Verify quiz answers are valid', () => {
    const app = new AWSForKids(TEST_DATA_FILE);

    app.quizQuestions.forEach((q, idx) => {
        if (q.correct < 0 || q.correct >= q.options.length) {
            throw new Error(`Question ${idx + 1} has invalid correct answer index`);
        }
    });
    passed++;
});

// Clean up
cleanup();

// Summary
console.log('\n' + '═'.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('═'.repeat(70));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n🎉 All tests passed! The AWS for Kids app is ready to use!');
} else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.`);
    process.exit(1);
}

console.log('═'.repeat(70) + '\n');
