const http = require('http');
async function testGeneration() {
    console.log('🧪 Testing AI Question Generation...\n');
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/generate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };
    const data = JSON.stringify({
        domain: 'Data Structures & Algorithms',
        difficulty: 'Easy',
        type: 'Coding'
    });
    const result = await new Promise((resolve, reject) => {
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
        req.write(data);
        req.end();
    });
    console.log('📋 Generated Question:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ Validation:');
    console.log(`  Title: ${result.title ? '✓' : '✗'}`);
    console.log(`  Description: ${result.description ? '✓' : '✗'}`);
    console.log(`  Examples: ${result.examples?.length || 0} items`);
    console.log(`  Test Cases: ${result.testCases?.length || 0} items`);
    console.log(`  Starter Code: ${result.starterCode ? '✓' : '✗'}`);
    if (result.testCases && result.testCases.length > 0) {
        console.log('\n🎉 SUCCESS! AI is generating test cases!');
    } else {
        console.log('\n❌ FAIL: No test cases generated');
    }
}
testGeneration().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});