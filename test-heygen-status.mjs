// Test HeyGen API status check
import dotenv from 'dotenv';
dotenv.config();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

// Get video ID from database (the one that's stuck)
const VIDEO_ID = '8b47cf0b0c1f96565'; // HeyGen video ID from database

async function checkHeyGenStatus() {
    console.log('🔍 Checking HeyGen status for video:', VIDEO_ID);
    console.log('API Key:', HEYGEN_API_KEY ? `${HEYGEN_API_KEY.substring(0, 10)}...` : 'MISSING');

    try {
        const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${VIDEO_ID}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': HEYGEN_API_KEY
            }
        });

        console.log('Response status:', response.status);

        const data = await response.json();
        console.log('\\n📊 Full HeyGen Response:');
        console.log(JSON.stringify(data, null, 2));

        if (data.data) {
            console.log('\\n📹 Video Details:');
            console.log('Status:', data.data.status);
            console.log('Video URL:', data.data.video_url || 'Not ready');
            console.log('Error:', data.data.error || 'None');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkHeyGenStatus();
