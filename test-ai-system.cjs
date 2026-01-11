const http = require('http');
async function testAISystem() {
    console.log('=== TESTING AI QUESTION GENERATOR & EVALUATOR ===\n');
    console.log('1️⃣ Generating AI question...');
    const generateOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/generate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const generateData = JSON.stringify({
        domain: 'Data Structures & Algorithms',
        difficulty: 'Easy',
        type: 'Coding'
    });
    const question = await new Promise((resolve, reject) => {
        const req = http.request(generateOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse response: ' + data));
                }
            });
        });
        req.on('error', reject);
        req.write(generateData);
        req.end();
    });
    console.log('✅ Question generated:');
    console.log(`   Title: ${question.title}`);
    console.log(`   Domain: ${question.domain}`);
    console.log(`   Difficulty: ${question.difficulty}`);
    console.log(`   Has examples: ${question.examples ? 'Yes' : 'No'}`);
    console.log(`   Has test cases: ${question.testCases ? 'Yes' : 'No'}`);
    console.log('\n2️⃣ Testing evaluation with correct answer...');
    const correctAnswer = `
function solution(arr) {
  return arr.reverse();
}
  `.trim();
    const evaluateOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/evaluate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const evaluateData = JSON.stringify({
        questionId: question.id || 'test-id',
        code: correctAnswer,
        language: 'javascript'
    });
    const evaluation = await new Promise((resolve, reject) => {
        const req = http.request(evaluateOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse evaluation: ' + data));
                }
            });
        });
        req.on('error', reject);
        req.write(evaluateData);
        req.end();
    });
    console.log('✅ Evaluation results:');
    console.log(`   Score: ${evaluation.score}%`);
    console.log(`   Feedback: ${evaluation.feedback?.substring(0, 100)}...`);
    console.log(`   Passed tests: ${evaluation.passedTests}/${evaluation.totalTests}`);
    console.log('\n📊 SUMMARY:');
    console.log(`   ✅ Question generation: ${question.title ? 'WORKING' : 'FAILED'}`);
    console.log(`   ✅ Code evaluation: ${evaluation.score !== undefined ? 'WORKING' : 'FAILED'}`);
    console.log(`   ✅ Test execution: ${evaluation.totalTests > 0 ? 'WORKING' : 'FAILED'}`);
    if (evaluation.score >= 80) {
        console.log('\n🎉 AI SYSTEM IS WORKING CORRECTLY!');
    } else {
        console.log('\n⚠️ Evaluation may need adjustment');
    }
}
testAISystem().catch(console.error);