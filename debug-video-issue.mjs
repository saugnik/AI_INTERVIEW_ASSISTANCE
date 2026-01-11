import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function debugVideoIssue() {
    try {
        const latestVideo = await prisma.video_explanations.findFirst({
            orderBy: { created_at: 'desc' }
        });
        if (!latestVideo) {
            console.log('❌ No videos found in database');
            return;
        }
        console.log('\n=== LATEST VIDEO EXPLANATION ===');
        console.log('ID:', latestVideo.id);
        console.log('Attempt ID:', latestVideo.attempt_id);
        console.log('Question ID:', latestVideo.question_id);
        console.log('Student Email:', latestVideo.student_email);
        console.log('Status:', latestVideo.status);
        console.log('Video URL:', latestVideo.video_url || 'NULL');
        console.log('Error Message:', latestVideo.error_message || 'NULL');
        console.log('Created At:', latestVideo.created_at);
        console.log('Completed At:', latestVideo.completed_at || 'NULL');
        console.log('Script Preview:', latestVideo.explanation_text?.substring(0, 100) + '...');
        console.log('\n=== CHECKING ATTEMPT ===');
        const attempt = await prisma.attempts.findUnique({
            where: { id: latestVideo.attempt_id }
        });
        if (attempt) {
            console.log('✅ Attempt exists');
            console.log('Student Email:', attempt.student_email);
            console.log('Question ID:', attempt.question_id);
        } else {
            console.log('❌ Attempt NOT found!');
        }
        console.log('\n=== TESTING BACKEND QUERY ===');
        const videoByAttemptId = await prisma.video_explanations.findUnique({
            where: { attempt_id: latestVideo.attempt_id }
        });
        if (videoByAttemptId) {
            console.log('✅ Video can be found by attempt_id');
        } else {
            console.log('❌ Video CANNOT be found by attempt_id (this is the problem!)');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}
debugVideoIssue();