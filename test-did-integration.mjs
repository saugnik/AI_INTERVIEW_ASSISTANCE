/**
 * Test D-ID Integration (SIMPLIFIED)
 */

import dotenv from 'dotenv';
dotenv.config();

const DID_API_KEY = process.env.DID_API_KEY;
const DID_API_URL = 'https://api.d-id.com';

async function testDID() {
    console.log('🧪 Testing D-ID API...\n');

    if (!DID_API_KEY) {
        console.error('❌ No API key');
        process.exit(1);
    }

    console.log(`✅ API Key: ${DID_API_KEY.substring(0, 30)}...`);

    try {
        const requestBody = {
            script: {
                type: 'text',
                input: 'Hello! This is a test video.'
            },
            presenter_id: 'amy-jcwCkr1grs',
            driver_id: 'Vcq0R4a8F0'
        };

        console.log('\n📤 Creating test video...');

        const response = await fetch(`${DID_API_URL}/talks`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${DID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const text = await response.text();
        console.log(`📥 Response (${response.status}):`, text);

        if (!response.ok) {
            console.error('❌ FAILED');
            process.exit(1);
        }

        const data = JSON.parse(text);
        console.log('\n✅ SUCCESS!');
        console.log(`🎬 Video ID: ${data.id}`);
        console.log(`📊 Status: ${data.status}`);

        if (data.result_url) {
            console.log(`🎉 Video URL: ${data.result_url}`);
        }

        console.log('\n🎉 D-ID is working! You can now use the feature.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

testDID();
