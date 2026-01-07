import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getVideoProviderId() {
    try {
        const video = await prisma.video_explanations.findUnique({
            where: { attempt_id: 'dd753964-b37e-47ea-9fbb-0ff46b5cafea' }
        });

        console.log('\\n📹 Video Explanation Record:');
        console.log('Attempt ID:', video?.attempt_id);
        console.log('Video Provider ID (HeyGen):', video?.video_provider_id);
        console.log('Status:', video?.status);
        console.log('Video URL:', video?.video_url || 'Not set');
        console.log('Created:', video?.created_at);

        await prisma.$disconnect();

        return video?.video_provider_id;
    } catch (error) {
        console.error('Error:', error.message);
        await prisma.$disconnect();
    }
}

getVideoProviderId();
