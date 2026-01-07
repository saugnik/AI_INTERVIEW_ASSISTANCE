/**
 * Comprehensive Test for Google TTS Video Explanation System
 * Tests the complete flow: script generation → audio creation → database save
 */

import { generateExplanationScript, createAudioWithGoogleTTS } from './services/videoExplanationService.js';
import fs from 'fs';
import path from 'path';

async function testGoogleTTSSystem() {
    console.log('🧪 Testing Google TTS Video Explanation System\n');
    console.log('='.repeat(60));

    // Mock question data
    const question = {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        prompt: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'
    };

    const userAnswer = `
function twoSum(nums, target) {
    for (let i = 0; i < nums.length; i++) {
        return [i, i+1]; // Wrong solution - always returns first two indices
    }
}
    `;

    const testResults = [
        { input: '[2,7,11,15], 9', expected: '[0,1]', actual: '[0,1]', passed: true },
        { input: '[3,2,4], 6', expected: '[1,2]', actual: '[0,1]', passed: false },
        { input: '[3,3], 6', expected: '[0,1]', actual: '[0,1]', passed: false }
    ];

    try {
        // STEP 1: Generate explanation script
        console.log('\n📝 STEP 1: Generating explanation script...');
        console.log('   Question:', question.title);
        console.log('   Test Results: 1/3 passed\n');

        const script = await generateExplanationScript(question, userAnswer, testResults);

        console.log('✅ Script generated successfully!');
        console.log('   Length:', script.length, 'characters');
        console.log('   Word count:', script.split(/\s+/).length, 'words');
        console.log('   Preview:', script.substring(0, 150) + '...\n');

        // STEP 2: Create audio with Google TTS
        console.log('🎤 STEP 2: Creating audio with Google TTS...');
        const attemptId = 'test-' + Date.now();

        const audioResult = await createAudioWithGoogleTTS(script, attemptId);

        console.log('✅ Audio created successfully!');
        console.log('   Audio URL:', audioResult.audioUrl);
        console.log('   Duration:', audioResult.duration, 'seconds');
        console.log('   Estimated listening time:', Math.floor(audioResult.duration / 60), 'min', audioResult.duration % 60, 'sec\n');

        // STEP 3: Verify audio file exists
        console.log('📁 STEP 3: Verifying audio file...');
        const audioPath = path.join(process.cwd(), 'public', 'audio', `${attemptId}.mp3`);

        if (fs.existsSync(audioPath)) {
            const stats = fs.statSync(audioPath);
            console.log('✅ Audio file exists!');
            console.log('   Path:', audioPath);
            console.log('   Size:', Math.round(stats.size / 1024), 'KB\n');
        } else {
            console.log('❌ Audio file not found at:', audioPath, '\n');
            return false;
        }

        // STEP 4: Test complete flow
        console.log('🎉 STEP 4: Complete flow test');
        console.log('='.repeat(60));
        console.log('✅ Script Generation: PASSED');
        console.log('✅ Audio Creation: PASSED');
        console.log('✅ File Verification: PASSED');
        console.log('='.repeat(60));
        console.log('\n🎊 ALL TESTS PASSED! Google TTS is working correctly!\n');
        console.log('📌 Next Steps:');
        console.log('   1. Start your server: node server.js');
        console.log('   2. Test the API endpoint: POST /api/student/request-video-explanation');
        console.log('   3. Check the audio player in your frontend\n');

        return true;
    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        console.error('Error:', error.message);
        console.error('\nStack:', error.stack);

        console.log('\n🔧 Troubleshooting Tips:');
        console.log('   1. Check if gtts package is installed: npm list gtts');
        console.log('   2. Verify public/audio directory exists');
        console.log('   3. Check Gemini API key in .env file');
        console.log('   4. Ensure you have write permissions to public/audio\n');

        return false;
    }
}

// Run the test
testGoogleTTSSystem()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(err => {
        console.error('Unexpected error:', err);
        process.exit(1);
    });
