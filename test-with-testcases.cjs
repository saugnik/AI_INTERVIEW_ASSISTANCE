// Create a test question with proper test cases and test the evaluation
const http = require('http');

async function makeRequest(path, method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path,
            method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    console.log('Raw response:', body);
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testWithProperTestCases() {
    console.log('🧪 TESTING EVALUATION WITH PROPER TEST CASES\n');
    console.log('='.repeat(60));

    // Test with a question that has test cases
    const testData = {
        questionId: 'test-reverse-array',
        code: 'function solution(arr) { return arr.reverse(); }',
        language: 'javascript',
        testCases: [
            { input: '[1,2,3]', expected: '[3,2,1]' },
            { input: '[5,4,3,2,1]', expected: '[1,2,3,4,5]' },
            { input: '[10]', expected: '[10]' },
            { input: '[]', expected: '[]' }
        ]
    };

    console.log('\n📝 Test Question: Reverse Array');
    console.log('Code:', testData.code);
    console.log('Test Cases:', testData.testCases.length);

    console.log('\n🔄 Submitting for evaluation...');
    const result = await makeRequest('/api/evaluate', 'POST', testData);

    console.log('\n' + '='.repeat(60));
    console.log('📊 EVALUATION RESULTS:\n');
    console.log(`Score: ${result.score}%`);
    console.log(`Tests Passed: ${result.passedTests}/${result.totalTests}`);
    console.log(`\nFeedback: ${result.feedback}`);

    console.log('\n📋 Detailed Test Results:');
    result.testResults?.forEach((test, i) => {
        const status = test.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`\nTest ${i + 1}: ${status}`);
        console.log(`  Input: ${test.input}`);
        console.log(`  Expected: ${test.expected}`);
        console.log(`  Actual: ${test.actual}`);
    });

    console.log('\n' + '='.repeat(60));

    if (result.score === 100) {
        console.log('\n🎉 SUCCESS! Evaluation system is working perfectly!');
        console.log('✅ All test cases passed');
        console.log('✅ Correct code scored 100%');
        console.log('✅ Test execution is accurate');
    } else {
        console.log('\n⚠️ Unexpected result - should be 100%');
    }
}

testWithProperTestCases().catch(err => {
    console.error('\n❌ ERROR:', err.message);
    process.exit(1);
});
