// List ALL questions in database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listAll() {
    try {
        const questions = await prisma.questions.findMany({
            orderBy: { created_at: 'desc' }
        });

        console.log(`Total questions: ${questions.length}\n`);

        questions.forEach((q, i) => {
            console.log(`${i + 1}. ${q.title}`);
            console.log(`   Type: ${q.type}, Domain: ${q.domain}`);
            console.log(`   Has examples: ${q.examples && q.examples.length > 0 ? 'YES (' + q.examples.length + ')' : 'NO'}`);
            if (q.examples && q.examples.length > 0) {
                console.log(`   First example: Input="${q.examples[0].input?.substring(0, 30)}..." Output="${q.examples[0].output?.substring(0, 30)}..."`);
            }
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

listAll();
