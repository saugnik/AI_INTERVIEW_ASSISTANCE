/**
 * Video Explanation Service
 * Generates AI-powered audio explanations for incorrect student answers
 * Uses Gemini AI for script generation and Google TTS for audio
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Gemini API key
function getGeminiApiKey() {
    return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
}

// Get HeyGen API key (legacy, not used anymore)
function getHeyGenApiKey() {
    return process.env.HEYGEN_API_KEY || '';
}

/**
 * Generate explanation script using Gemini AI
 * Analyzes the question, user's wrong answer, and test results to create personalized explanation
 */
export async function generateExplanationScript(question, userAnswer, testResults = []) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Missing Gemini API key');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Analyze which test cases failed
    const failedTests = testResults.filter(t => !t.passed);
    const failedTestsInfo = failedTests.length > 0
        ? `\n\nFailed Test Cases:\n${failedTests.map((t, i) =>
            `Test ${i + 1}: Input: ${t.input || 'N/A'}, Expected: ${t.expected || 'N/A'}, Got: ${t.actual || 'N/A'}`
        ).join('\n')}`
        : '';

    const prompt = `You are a friendly AI teacher creating a comprehensive audio explanation for a student who got a coding question wrong.

Question Title: ${question.title}
Question Description: ${question.description}

Student's Answer:
${userAnswer}
${failedTestsInfo}

Create a detailed, encouraging explanation (800-1200 words) that will be converted to audio and take 3-5 minutes to listen to. Structure it as follows:

**1. Warm Introduction (30 seconds)**
- Acknowledge their effort positively
- Set expectations for what they'll learn

**2. Problem Analysis (1 minute)**
- Explain what the question is really asking
- Break down the key requirements
- Identify what makes this problem challenging

**3. Mistake Identification (1 minute)**
- Clearly explain what went wrong in their solution
- Use specific examples from their code
- Explain why this approach doesn't work

**4. Correct Approach (2 minutes)**
- Teach the correct algorithm step-by-step
- Explain the logic behind each step
- Provide a complete working solution with code
- Walk through how it handles different test cases

**5. Key Concepts & Tips (30 seconds)**
- Highlight important concepts they should remember
- Give tips to avoid similar mistakes
- Encourage them to practice

Make it conversational and engaging, as if you're explaining to a friend. Use simple language and speak directly to the student ("you", "your"). The explanation will be read aloud by an AI voice, so write it as natural spoken dialogue.

IMPORTANT: Write 800-1200 words to ensure 3-5 minutes of audio content.`;

    // FORCE TEST MODE - Always use test script to avoid API limits
    const USE_TEST_MODE = false; // Set to true to skip Gemini API

    if (USE_TEST_MODE) {
        console.log('🎬 Using TEST MODE - generating sample script without Gemini API');

        // Safety checks for undefined properties
        const questionTitle = question?.title || 'this problem';
        const questionDesc = question?.description || question?.prompt || 'the given problem';
        const descPreview = questionDesc.substring(0, Math.min(100, questionDesc.length));

        const testScript = `Hi there! I can see you gave this problem a good try, and I want to help you understand where things went wrong.

Looking at your answer for "${questionTitle}", I noticed a few things. The main issue is in your approach to solving this problem. Let me break it down step by step.

First, let's understand what the question is really asking. ${descPreview}... The key here is to think about the most efficient way to solve this.

Your solution had the right idea, but there's a better approach. Here's what I recommend: Start by analyzing the input carefully, then use a systematic method to process it. 

The correct solution would look something like this: First, initialize your variables. Then, iterate through the data structure efficiently. Finally, return the result in the expected format.

Remember, practice makes perfect! Don't get discouraged - every mistake is a learning opportunity. Try again with this new understanding, and I'm confident you'll get it right!`;

        return testScript;
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const script = response.text();

        // Ensure script is long enough (800-1200 words for 3-5 minutes)
        const words = script.split(/\s+/).length;
        console.log(`📝 Generated explanation: ${words} words (target: 800-1200)`);

        if (words < 500) {
            console.warn(`⚠️ Script is only ${words} words, may be too short for 3-5 minutes`);
        }

        return script;
    } catch (error) {
        console.error('⚠️ Gemini API error (falling back to template):', error.message);

        // FALLBACK: Generate a detailed template-based explanation when API fails
        const questionTitle = question?.title || 'this problem';
        const questionDesc = question?.description || question?.prompt || 'the given problem';

        // Analyze failed tests for better feedback
        const failedTests = testResults.filter(t => !t.passed);
        const passedTests = testResults.filter(t => t.passed);
        const scorePercent = testResults.length > 0
            ? Math.round((passedTests.length / testResults.length) * 100)
            : 0;

        // Generate a comprehensive fallback script
        const fallbackScript = `Hello! I'm your AI coding instructor, and I'm here to help you understand where your solution needs improvement.

Let me start by acknowledging your effort on the "${questionTitle}" problem. You passed ${passedTests.length} out of ${testResults.length} test cases, which shows you're on the right track. Let's work together to get you to 100 percent.

First, let's review what the problem is asking. ${questionDesc.substring(0, 200)}${questionDesc.length > 200 ? '...' : ''} The key to solving this problem is understanding the core requirements and edge cases.

Now, let's talk about what went wrong in your solution. Looking at the test cases that failed, I can see a pattern. ${failedTests.length > 0 ? `For example, when the input was ${failedTests[0].input}, you returned ${failedTests[0].actual}, but the expected output was ${failedTests[0].expected}.` : 'Your solution needs to handle edge cases better.'}

The main issues I've identified are: First, your algorithm might not be handling all input scenarios correctly. Second, there could be edge cases you haven't considered. Third, the logic might need optimization for better performance.

Let me explain the correct approach step by step. Start by carefully reading the problem requirements. Then, think about the data structures that would be most efficient. Consider using techniques like hash maps for O(1) lookups, or two-pointer approaches for array problems.

Here's the recommended algorithm: First, initialize your variables and data structures. Next, iterate through the input systematically, processing each element according to the problem requirements. Make sure to handle edge cases like empty inputs, single elements, or maximum constraints.

For this specific problem, the optimal solution typically involves analyzing the input pattern, choosing the right data structure, and implementing a clean, efficient algorithm. Don't forget to consider time and space complexity.

Some key concepts to remember: Always test your code with the provided examples before submitting. Think about edge cases like empty arrays, single elements, duplicate values, and maximum input sizes. Write clean, readable code with meaningful variable names.

Common mistakes to avoid: Don't assume the input is always in a specific format. Always validate your logic with multiple test cases. Consider both time and space complexity in your solution.

Here are some tips for improvement: Practice similar problems to build pattern recognition. Study common algorithms and data structures. Learn to identify problem types quickly. And most importantly, don't get discouraged by mistakes - they're valuable learning opportunities!

Remember, coding is a skill that improves with practice. Every problem you solve makes you a better programmer. Take your time to understand the concepts, and don't hesitate to try different approaches.

I believe in your ability to solve this! Review the failed test cases, think about the edge cases, and try implementing the solution again with this new understanding. You've got this!

Keep practicing, stay curious, and happy coding!`;

        console.log('✅ Generated fallback explanation script (template-based)');
        return fallbackScript;
    }
}

/**
 * Create audio explanation using Google TTS (FREE!)
 * Replaces expensive HeyGen video generation
 */
export async function createAudioWithGoogleTTS(scriptText, attemptId) {
    try {
        console.log('🎤 Creating audio explanation with Google TTS (FREE)...');

        // Import Google TTS service
        const { generateAudioExplanation } = await import('./googleTTSService.js');

        // Generate unique filename
        const filename = `explanation_${attemptId}_${Date.now()}`;

        // Generate audio
        const result = await generateAudioExplanation(scriptText, filename);

        console.log(`✅ Audio generated: ${result.audioUrl} (${result.duration}s)`);

        return {
            audioId: filename,
            audioUrl: result.audioUrl,
            duration: result.duration,
            status: 'completed', // Audio is ready immediately!
            success: true
        };
    } catch (error) {
        console.error('Error creating audio with Google TTS:', error);
        throw new Error(`Failed to create audio: ${error.message}`);
    }
}

/**
 * Get video status from HeyGen
 * Polls HeyGen API to check if video generation is complete
 */
export async function getVideoStatus(videoId) {
    const apiKey = getHeyGenApiKey();
    if (!apiKey) {
        throw new Error('Missing HeyGen API key');
    }

    try {
        console.log(`🔍 Polling HeyGen for video ID: ${videoId}`);
        const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HeyGen API error: ${response.status} - ${errorText}`);
            throw new Error(`HeyGen API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`📊 HeyGen Response:`, JSON.stringify(data, null, 2));

        const status = data.data?.status;
        const videoUrl = data.data?.video_url;
        const error = data.data?.error;

        console.log(`📹 Video Status: ${status}, URL: ${videoUrl ? 'Present' : 'None'}, Error: ${error || 'None'}`);

        return {
            status: status, // 'pending', 'processing', 'completed', 'failed'
            videoUrl: videoUrl,
            error: error
        };
    } catch (error) {
        console.error('Error getting video status:', error);
        throw new Error(`Failed to get video status: ${error.message}`);
    }
}

/**
 * Save video explanation to database
 */
export async function saveVideoExplanation(attemptId, questionId, studentEmail, explanationText, videoData) {
    try {
        const videoExplanation = await prisma.video_explanations.create({
            data: {
                attempt_id: attemptId,
                question_id: questionId,
                student_email: studentEmail,
                explanation_text: explanationText,
                video_url: videoData.audioUrl || videoData.videoUrl || null, // Support both audio and video
                video_provider: videoData.audioId ? 'google-tts' : 'heygen', // Identify provider
                video_provider_id: videoData.audioId || videoData.videoId || null,
                status: videoData.status || 'pending',
                error_message: videoData.error || null,
                completed_at: videoData.status === 'completed' ? new Date() : null
            }
        });

        return videoExplanation;
    } catch (error) {
        console.error('Error saving video explanation:', error);
        throw new Error(`Failed to save video explanation: ${error.message}`);
    }
}

/**
 * Update video explanation status
 */
export async function updateVideoExplanation(attemptId, updates) {
    try {
        const videoExplanation = await prisma.video_explanations.update({
            where: { attempt_id: attemptId },
            data: {
                ...updates,
                completed_at: updates.status === 'completed' ? new Date() : undefined
            }
        });

        return videoExplanation;
    } catch (error) {
        console.error('Error updating video explanation:', error);
        throw new Error(`Failed to update video explanation: ${error.message}`);
    }
}

/**
 * Get video explanation by attempt ID
 */
export async function getVideoExplanation(attemptId) {
    try {
        const videoExplanation = await prisma.video_explanations.findUnique({
            where: { attempt_id: attemptId }
        });

        return videoExplanation;
    } catch (error) {
        console.error('Error getting video explanation:', error);
        return null;
    }
}

/**
 * Check rate limit for video requests
 * Returns true if student can request more videos
 */
export async function checkRateLimit(studentEmail, maxPerDay = 5) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const requestCount = await prisma.video_explanation_requests.count({
            where: {
                student_email: studentEmail,
                requested_at: {
                    gte: today
                }
            }
        });

        return {
            allowed: requestCount < maxPerDay,
            count: requestCount,
            limit: maxPerDay
        };
    } catch (error) {
        console.error('Error checking rate limit:', error);
        return { allowed: true, count: 0, limit: maxPerDay };
    }
}

/**
 * Record video explanation request
 */
export async function recordVideoRequest(studentEmail, attemptId) {
    try {
        await prisma.video_explanation_requests.create({
            data: {
                student_email: studentEmail,
                attempt_id: attemptId
            }
        });
    } catch (error) {
        console.error('Error recording video request:', error);
    }
}

/**
 * Main function to request a video explanation
 * Orchestrates the entire process
 */
export async function requestVideoExplanation(attemptId, questionId, studentEmail, question, userAnswer, testResults) {
    try {
        // Check if video already exists
        const existing = await getVideoExplanation(attemptId);
        if (existing) {
            return {
                success: true,
                videoExplanation: existing,
                message: 'Audio explanation already exists'
            };
        }

        // Record the request
        await recordVideoRequest(studentEmail, attemptId);

        // Generate explanation script (now 800-1200 words for 3-5 minutes)
        console.log(`📝 Generating detailed explanation script for attempt ${attemptId}...`);
        const script = await generateExplanationScript(question, userAnswer, testResults);

        // Create audio with Google TTS (FREE and FAST!)
        console.log(`🎤 Creating audio with Google TTS...`);
        const audioData = await createAudioWithGoogleTTS(script, attemptId);

        // Save to database
        const videoExplanation = await saveVideoExplanation(
            attemptId,
            questionId,
            studentEmail,
            script,
            {
                status: 'completed', // Audio is ready immediately!
                audioId: audioData.audioId,
                audioUrl: audioData.audioUrl,
                duration: audioData.duration
            }
        );

        console.log(`✅ Audio explanation created successfully! Duration: ${audioData.duration}s`);

        return {
            success: true,
            videoExplanation,
            audioId: audioData.audioId,
            audioUrl: audioData.audioUrl,
            duration: audioData.duration,
            message: 'Audio explanation ready!'
        };
    } catch (error) {
        console.error('Error requesting audio explanation:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
