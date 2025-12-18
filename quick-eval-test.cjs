// Quick evaluation test
const http = require('http');

async function quickTest() {
    // Test evaluation with simple array reverse
    const testData = {
        questionId: 'test',
        code: 'function solution(arr) { return arr.reverse(); }',
        language: 'javascript',
        testCases: [
            { input: '[1,2,3]', expected: '[3,2,1]' },
            { input: '[5]', expected: '[5]' },
            { input: '[]', expected: '[]' }
        ]
    };

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/evaluate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };

    const result = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(JSON.stringify(testData));
        req.end();
    });

    console.log('EVALUATION RESULT:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\nSUMMARY:');
    console.log(`Score: ${result.score}%`);
    console.log(`Tests Passed: ${result.passedTests}/${result.totalTests}`);
    console.log(`Working: ${result.totalTests > 0 && result.score >= 0 ? 'YES ✅' : 'NO ❌'}`);
}

quickTest().catch(console.error);
