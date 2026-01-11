const http = require('http');
const testData = {
    questionId: 'test',
    code: 'function solution(arr) { return arr.reverse(); }',
    language: 'javascript',
    testCases: [
        { input: '[1,2,3]', expected: '[3,2,1]' },
        { input: '[5]', expected: '[5]' }
    ]
};
const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/evaluate',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};
const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const result = JSON.parse(body);
        console.log('SCORE:', result.score + '%');
        console.log('PASSED:', result.passedTests + '/' + result.totalTests);
        console.log('SUCCESS:', result.score === 100 ? 'YES ✅' : 'NO ❌');
    });
});
req.write(JSON.stringify(testData));
req.end();