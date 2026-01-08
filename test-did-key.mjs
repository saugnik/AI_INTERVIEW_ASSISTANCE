/**
 * Quick D-ID API Key Test
 * Tests if the current API key in .env has credits
 */

import dotenv from 'dotenv';
dotenv.config();

const DID_API_KEY = process.env.DID_API_KEY;
const DID_API_URL = 'https://api.d-id.com';

async function testAPIKey() {
    console.log('🔑 Testing D-ID API Key...\n');

    if (!DID_API_KEY) {
        console.error('❌ No DID_API_KEY found in .env file!');
        process.exit(1);
    }

    console.log(`✅ API Key loaded: ${DID_API_KEY.substring(0, 30)}...`);
    console.log(`📏 Key length: ${DID_API_KEY.length} characters\n`);

    try {
        // Test 1: Check credits by trying to create a video
        console.log('🎬 Test 1: Attempting to create a test video...');

        const requestBody = {
            script: {
                type: 'text',
                input: 'This is a test.'
            },
            presenter_id: 'amy-jcwCkr1grs',
            driver_id: 'Vcq0R4a8F0'
        };

        const response = await fetch(`${DID_API_URL}/talks`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${DID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        console.log(`\n📥 Response Status: ${response.status}`);
        console.log(`📄 Response Body: ${responseText}\n`);

        if (!response.ok) {
            if (response.status === 402) {
                console.error('❌ ERROR: Payment Required (No Credits)');
                console.error('💡 This API key has no credits available.');
                console.error('💡 Please check your D-ID account or use a different API key.\n');
            } else if (response.status === 401) {
                console.error('❌ ERROR: Unauthorized');
                console.error('💡 The API key format might be incorrect.');
                console.error('💡 D-ID expects: username:password (already Base64 encoded)\n');
            } else {
                console.error(`❌ ERROR: ${response.status} - ${responseText}\n`);
            }
            process.exit(1);
        }

        const data = JSON.parse(responseText);
        console.log('✅ SUCCESS! Video creation initiated!');
        console.log(`🎬 Talk ID: ${data.id}`);
        console.log(`📊 Status: ${data.status}`);
        console.log('\n🎉 Your API key has credits and is working!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

testAPIKey();
