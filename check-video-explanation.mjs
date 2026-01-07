import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVideoExplanations() {
    try {
        const videos = await prisma.video_explanations.findMany({
            orderBy: { created_at: 'desc' },
            take: 5
        });

        console.log('📹 Recent video explanations:');
        console.log(JSON.stringify(videos, null, 2));

        if (videos.length === 0) {
            console.log('❌ No video explanations found in database!');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkVideoExplanations();
