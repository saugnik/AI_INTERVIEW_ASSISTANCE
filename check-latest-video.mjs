import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLatestVideo() {
    try {
        const video = await prisma.video_explanations.findFirst({
            orderBy: { created_at: 'desc' }
        });

        if (!video) {
            console.log('No video found');
            return;
        }

        console.log('Latest Video Explanation:');
        console.log('Attempt ID:', video.attempt_id);
        console.log('Status:', video.status);
        console.log('Error:', video.error_message);
        console.log('Video URL:', video.video_url);
        console.log('Script length:', video.explanation_text?.length || 0);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestVideo();
