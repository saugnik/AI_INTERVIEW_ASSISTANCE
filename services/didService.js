/**
 * D-ID Service - AI Avatar Video Generation (SIMPLIFIED)
 * Creates talking avatar videos with lip-sync using D-ID API
 */

import dotenv from 'dotenv';
dotenv.config();

const DID_API_KEY = process.env.DID_API_KEY;
const DID_API_URL = 'https://api.d-id.com';

/**
 * Create a talking avatar video from text script (SIMPLIFIED VERSION)
 */
export async function createTalkingAvatar(scriptText, attemptId) {
    if (!DID_API_KEY) {
        throw new Error('D-ID API key not configured');
    }

    try {
        console.log('🎬 Creating AI avatar video with D-ID...');

        // SIMPLIFIED: Use minimal required parameters
        const requestBody = {
            script: {
                type: 'text',
                input: scriptText
            },
            presenter_id: 'amy-jcwCkr1grs', // D-ID stock avatar
            driver_id: 'Vcq0R4a8F0'  // Default driver for natural movements
        };

        console.log('📤 Sending request to D-ID...');

        const response = await fetch(`${DID_API_URL}/talks`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${DID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        console.log('📥 D-ID Response:', responseText);

        if (!response.ok) {
            console.error(`❌ D-ID API error: ${response.status}`);
            throw new Error(`D-ID API error: ${response.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log('✅ Video creation initiated!');
        console.log(`🎬 Talk ID: ${data.id}, Status: ${data.status}`);

        return {
            videoId: data.id,
            status: data.status === 'done' ? 'completed' : 'processing',
            videoUrl: data.result_url || null,
            success: true
        };

    } catch (error) {
        console.error('❌ Error creating D-ID video:', error);
        throw error;
    }
}

/**
 * Check video status
 */
export async function checkVideoStatus(talkId) {
    try {
        const response = await fetch(`${DID_API_URL}/talks/${talkId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${DID_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Status check failed: ${response.status}`);
        }

        const data = await response.json();
        return {
            status: data.status,
            videoUrl: data.result_url,
            error: data.error
        };
    } catch (error) {
        console.error('Error checking status:', error);
        throw error;
    }
}

/**
 * Poll until video is ready
 */
export async function pollVideoUntilReady(talkId, maxAttempts = 60, intervalMs = 5000) {
    console.log(`⏳ Polling for video completion...`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = await checkVideoStatus(talkId);

        if (result.status === 'done' && result.videoUrl) {
            console.log(`✅ Video ready: ${result.videoUrl}`);
            return { status: 'completed', videoUrl: result.videoUrl };
        }

        if (result.status === 'error') {
            throw new Error(`Video generation failed: ${result.error}`);
        }

        console.log(`⏳ Attempt ${attempt}/${maxAttempts}: ${result.status}`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Video generation timeout');
}
