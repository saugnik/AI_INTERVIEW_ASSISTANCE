// Check questions in database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkQuestions() {
    try {
        const questions = await prisma.questions.findMany({
            take: 3,
            orderBy: { created_at: 'desc' }
        });

        console.log(`Found ${questions.length} questions\n`);

        questions.forEach((q, index) => {
            console.log(`${index + 1}. ${q.title}`);
            console.log(`   Domain: ${q.domain}`);
            console.log(`   Difficulty: ${q.difficulty}`);
            console.log(`   Examples: ${JSON.stringify(q.examples)}`);
            console.log(`   Test Cases: ${q.test_cases ? 'Yes' : 'No'}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkQuestions();
