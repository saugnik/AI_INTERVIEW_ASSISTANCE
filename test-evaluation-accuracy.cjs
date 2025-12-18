// Test AI Evaluation System with Real Question and Answer
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

async function testEvaluation() {
    console.log('🧪 TESTING AI EVALUATION SYSTEM\n');
    console.log('='.repeat(60));

    // Step 1: Generate a question
    console.log('\n1️⃣ Generating AI Question...');
    const question = await makeRequest('/api/generate', 'POST', {
        domain: 'Data Structures & Algorithms',
        difficulty: 'Easy',
        type: 'Coding'
    });

    console.log(`✅ Question: "${question.title}"`);
    console.log(`   Description: ${question.description?.substring(0, 80)}...`);
    console.log(`   Test Cases: ${question.testCases?.length || 0}`);

    if (question.testCases && question.testCases.length > 0) {
        console.log('\n   Test Case Examples:');
        question.testCases.slice(0, 2).forEach((tc, i) => {
            console.log(`   ${i + 1}. Input: ${tc.input} → Expected: ${tc.expected}`);
        });
    }

    // Step 2: Test with CORRECT answer
    console.log('\n2️⃣ Testing with CORRECT Answer...');
    const correctCode = `
function solution(arr) {
  return arr.reverse();
}
  `.trim();

    console.log(`   Code: ${correctCode}`);

    const correctEval = await makeRequest('/api/evaluate', 'POST', {
        questionId: 'test-id',
        code: correctCode,
        language: 'javascript',
        testCases: question.testCases
    });

    console.log(`\n   ✅ Score: ${correctEval.score}%`);
    console.log(`   ✅ Passed: ${correctEval.passedTests}/${correctEval.totalTests} tests`);
    console.log(`   ✅ Feedback: ${correctEval.feedback?.substring(0, 100)}...`);

    // Step 3: Test with WRONG answer
    console.log('\n3️⃣ Testing with WRONG Answer...');
    const wrongCode = `
function solution(arr) {
  return arr; // Wrong! Should reverse
}
  `.trim();

    console.log(`   Code: ${wrongCode}`);

    const wrongEval = await makeRequest('/api/evaluate', 'POST', {
        questionId: 'test-id',
        code: wrongCode,
        language: 'javascript',
        testCases: question.testCases
    });

    console.log(`\n   ❌ Score: ${wrongEval.score}%`);
    console.log(`   ❌ Passed: ${wrongEval.passedTests}/${wrongEval.totalTests} tests`);
    console.log(`   ❌ Feedback: ${wrongEval.feedback?.substring(0, 100)}...`);

    // Step 4: Verify correctness
    console.log('\n' + '='.repeat(60));
    console.log('📊 EVALUATION ACCURACY CHECK:\n');

    const correctPassed = correctEval.score >= 80;
    const wrongFailed = wrongEval.score < 80;

    console.log(`   Correct code scored high: ${correctPassed ? '✅ PASS' : '❌ FAIL'} (${correctEval.score}%)`);
    console.log(`   Wrong code scored low: ${wrongFailed ? '✅ PASS' : '❌ FAIL'} (${wrongEval.score}%)`);
    console.log(`   Test execution working: ${correctEval.totalTests > 0 ? '✅ PASS' : '❌ FAIL'}`);

    if (correctPassed && wrongFailed && correctEval.totalTests > 0) {
        console.log('\n🎉 AI EVALUATION SYSTEM IS WORKING CORRECTLY!');
        console.log('   ✅ Correctly identifies correct solutions');
        console.log('   ✅ Correctly identifies wrong solutions');
        console.log('   ✅ Executes test cases properly');
    } else {
        console.log('\n⚠️ ISSUES DETECTED:');
        if (!correctPassed) console.log('   ❌ Correct code not scoring high enough');
        if (!wrongFailed) console.log('   ❌ Wrong code not being caught');
        if (correctEval.totalTests === 0) console.log('   ❌ Test cases not executing');
    }

    console.log('\n' + '='.repeat(60));
}

testEvaluation().catch(err => {
    console.error('\n❌ ERROR:', err.message);
    process.exit(1);
});
