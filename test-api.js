const API_BASE = 'http://localhost:3001';
async function testAPI() {
    console.log('🧪 Testing AI Interview App APIs\n');
    console.log('='.repeat(50));
    console.log('');
    let passedTests = 0;
    let totalTests = 0;
    console.log('Test 1: Code Generation API (/api/generate)');
    console.log('-'.repeat(50));
    totalTests++;
    try {
        const response = await fetch(`${API_BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                domain: 'DSA',
                difficulty: 'EASY',
                type: 'CODING'
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        const requiredFields = ['title', 'description'];
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing fields: ${missingFields.join(', ')}`);
        }
        console.log('✅ PASSED');
        console.log(`   Generated: "${data.title}"`);
        console.log(`   Has test cases: ${data.testCases?.length || 0}`);
        passedTests++;
    } catch (error) {
        console.log('❌ FAILED');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');
    console.log('Test 2: Code Evaluation API (/api/evaluate)');
    console.log('-'.repeat(50));
    totalTests++;
    try {
        const testQuestion = {
            title: 'Test Question',
            description: 'Write a function that returns the sum of two numbers',
            prompt: 'function sum(a, b) { ... }'
        };
        const testCode = 'function sum(a, b) { return a + b; }';
        const testCases = [
            { input: '2,3', expected: '5' },
            { input: '10,20', expected: '30' }
        ];
        const response = await fetch(`${API_BASE}/api/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: testQuestion,
                userAnswer: testCode,
                testCases: testCases
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        if (typeof data.score !== 'number') {
            throw new Error('Missing or invalid score');
        }
        console.log('✅ PASSED');
        console.log(`   Score: ${data.score}/100`);
        console.log(`   Passed: ${data.passedTests}/${data.totalTests} tests`);
        passedTests++;
    } catch (error) {
        console.log('❌ FAILED');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');
    console.log('Test 3: Questions List API (/api/questions)');
    console.log('-'.repeat(50));
    totalTests++;
    try {
        const response = await fetch(`${API_BASE}/api/questions`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Response is not an array');
        }
        console.log('✅ PASSED');
        console.log(`   Found ${data.length} questions`);
        passedTests++;
    } catch (error) {
        console.log('❌ FAILED');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');
    console.log('Test 4: Random Question API (/api/questions/random)');
    console.log('-'.repeat(50));
    totalTests++;
    try {
        const response = await fetch(`${API_BASE}/api/questions/random`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        if (!data.id || !data.title) {
            throw new Error('Invalid question structure');
        }
        console.log('✅ PASSED');
        console.log(`   Question: "${data.title}"`);
        console.log(`   Difficulty: ${data.difficulty || 'N/A'}`);
        passedTests++;
    } catch (error) {
        console.log('❌ FAILED');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');
    console.log('='.repeat(50));
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed\n`);
    if (passedTests === totalTests) {
        console.log('✅ All tests passed! API is working correctly.\n');
    } else {
        console.log('⚠️  Some tests failed. Check the errors above.\n');
        console.log('Common issues:');
        console.log('  - Server not running (run: npm run dev)');
        console.log('  - Missing GROQ_API_KEY in .env file');
        console.log('  - Database not configured');
        console.log('');
    }
    process.exit(passedTests === totalTests ? 0 : 1);
}
testAPI().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});