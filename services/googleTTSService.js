import gTTS from 'gtts';
import fs from 'fs';
import path from 'path';
export async function generateAudioExplanation(text, filename) {
    try {
        console.log('🎤 Generating audio with Google TTS...');
        const audioDir = path.join(process.cwd(), 'public', 'audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
            console.log('📁 Created audio directory:', audioDir);
        }
        const audioPath = path.join(audioDir, `${filename}.mp3`);
        console.log('📝 Saving audio to:', audioPath);
        const gtts = new gTTS(text, 'en');
        await new Promise((resolve, reject) => {
            gtts.save(audioPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        console.log('✅ Audio generated successfully:', audioPath);
        const wordCount = text.split(/\s+/).length;
        const estimatedDuration = Math.ceil((wordCount / 150) * 60);
        return {
            audioUrl: `/audio/${filename}.mp3`,
            duration: estimatedDuration,
            success: true
        };
    } catch (error) {
        console.error('❌ Error generating audio:', error);
        throw new Error(`Failed to generate audio: ${error.message}`);
    }
}
export async function deleteAudioFile(filename) {
    try {
        const audioPath = path.join(__dirname, '..', 'public', 'audio', `${filename}.mp3`);
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
            console.log('🗑️ Deleted old audio file:', filename);
        }
    } catch (error) {
        console.error('Error deleting audio file:', error);
    }
}
export function getAudioFileSize(filename) {
    try {
        const audioPath = path.join(__dirname, '..', 'public', 'audio', `${filename}.mp3`);
        if (fs.existsSync(audioPath)) {
            const stats = fs.statSync(audioPath);
            return stats.size;
        }
        return 0;
    } catch (error) {
        console.error('Error getting audio file size:', error);
        return 0;
    }
}