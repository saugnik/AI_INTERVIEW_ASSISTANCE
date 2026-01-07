/**
 * Simple Google TTS Test
 * Quick verification that audio generation works
 */

import { createAudioWithGoogleTTS } from './services/videoExplanationService.js';
import fs from 'fs';
import path from 'path';

async function quickTest() {
    console.log('🧪 Quick Google TTS Test\n');

    const testScript = `Hello! This is a test of the Google Text-to-Speech system. 
If you can hear this audio, then the video explanation feature is working correctly. 
The system can now generate audio explanations for coding problems without any API costs. 
This is a free alternative to expensive video generation services.`;

    try {
        console.log('🎤 Creating test audio...\n');

        const result = await createAudioWithGoogleTTS(testScript, 'quick-test-' + Date.now());

        console.log('✅ SUCCESS!');
        console.log('   Audio URL:', result.audioUrl);
        console.log('   Duration:', result.duration, 'seconds');

        // List all audio files
        console.log('\n📁 Audio files in public/audio:');
        const audioDir = path.join(process.cwd(), 'public', 'audio');
        const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
        files.forEach(file => {
            const stats = fs.statSync(path.join(audioDir, file));
            console.log(`   - ${file} (${Math.round(stats.size / 1024)} KB)`);
        });

        console.log('\n🎉 Google TTS is working perfectly!');
        console.log('\n📌 You can now use the video explanation feature:');
        console.log('   1. Submit a wrong answer to any question');
        console.log('   2. Click "Get AI Video Explanation"');
        console.log('   3. Listen to the audio explanation\n');

        return true;
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        return false;
    }
}

quickTest()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
