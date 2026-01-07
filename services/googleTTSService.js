/**
 * Google Text-to-Speech Service
 * FREE alternative to HeyGen for generating AI voice explanations
 * Uses gTTS (Google Text-to-Speech) - no API key required!
 */

import gTTS from 'gtts';
import fs from 'fs';
import path from 'path';

/**
 * Generate audio from text using Google TTS
 * @param {string} text - The explanation text to convert to speech
 * @param {string} filename - Unique filename for the audio file
 * @returns {Promise<{audioUrl: string, duration: number}>}
 */
export async function generateAudioExplanation(text, filename) {
    try {
        console.log('🎤 Generating audio with Google TTS...');

        // Create public/audio directory if it doesn't exist
        // Use process.cwd() for ES modules instead of __dirname
        const audioDir = path.join(process.cwd(), 'public', 'audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
            console.log('📁 Created audio directory:', audioDir);
        }

        const audioPath = path.join(audioDir, `${filename}.mp3`);
        console.log('📝 Saving audio to:', audioPath);

        // Create gTTS instance with female voice
        const gtts = new gTTS(text, 'en');

        // Generate and save audio file
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

        // Estimate duration (rough calculation: ~150 words per minute)
        const wordCount = text.split(/\s+/).length;
        const estimatedDuration = Math.ceil((wordCount / 150) * 60); // in seconds

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

/**
 * Delete old audio files to save space
 * @param {string} filename - Audio filename to delete
 */
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

/**
 * Get audio file size
 * @param {string} filename - Audio filename
 * @returns {number} File size in bytes
 */
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
