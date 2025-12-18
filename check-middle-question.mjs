// Check specific question for examples
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkQuestion() {
    try {
        const question = await prisma.questions.findFirst({
            where: {
                title: { contains: 'Middle Element' }
            }
        });

        if (question) {
            console.log('Question:', question.title);
            console.log('Type:', question.type);
            console.log('\nExamples:');
            console.log(JSON.stringify(question.examples, null, 2));
            console.log('\nTest Cases:');
            console.log(JSON.stringify(question.test_cases, null, 2));
        } else {
            console.log('Question not found');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkQuestion();
