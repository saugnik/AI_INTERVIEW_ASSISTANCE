// Test AI Question Generation Endpoint
const fetch = require('node-fetch');

async function testAIGeneration() {
    try {
        console.log('Testing AI question generation endpoint...\n');

        const response = await fetch('http://localhost:3001/api/student/generate-ai-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': 'test@example.com',
                'x-user-role': 'student'
            },
            body: JSON.stringify({
                domain: 'Data Structures & Algorithms',
                difficulty: 'Medium',
                type: 'Coding'
            })
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        const data = await response.json();
        console.log('\nResponse:');
        console.log(JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('\n✅ AI question generated successfully!');
            console.log('Question Title:', data.question.title);
        } else {
            console.log('\n❌ Failed to generate question');
            console.log('Error:', data.error);
        }
    } catch (error) {
        console.error('\n❌ Error testing endpoint:');
        console.error(error.message);
    }
}

testAIGeneration();
