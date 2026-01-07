import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkVideoExplanations() {
    try {
        const videos = await prisma.video_explanations.findMany({
            orderBy: { created_at: 'desc' },
            take: 3
        });

        console.log(`\n📹 Found ${videos.length} video explanation(s):\n`);

        videos.forEach((video, index) => {
            console.log(`Video #${index + 1}:`);
            console.log(`  Attempt ID: ${video.attempt_id}`);
            console.log(`  Question ID: ${video.question_id}`);
            console.log(`  Student: ${video.student_email}`);
            console.log(`  Status: ${video.status}`);
            console.log(`  Video URL: ${video.video_url || 'N/A'}`);
            console.log(`  Error: ${video.error_message || 'None'}`);
            console.log(`  Created: ${video.created_at}`);
            console.log('');
        });

        // Also check the specific attempt ID from the browser test
        const specificAttemptId = '2472514d-b371-485e-89f6-eb5be550ca1e';
        console.log(`\n🔍 Checking for specific attempt ID: ${specificAttemptId}`);
        const specificVideo = await prisma.video_explanations.findUnique({
            where: { attempt_id: specificAttemptId }
        });

        if (specificVideo) {
            console.log('✅ Found it!');
            console.log(JSON.stringify(specificVideo, null, 2));
        } else {
            console.log('❌ Not found in database');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkVideoExplanations();
