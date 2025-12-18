// Test the complete data flow
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDataFlow() {
    try {
        // 1. Get a question from database
        const question = await prisma.questions.findFirst({
            where: { type: 'Coding' }
        });

        console.log('=== DATABASE QUESTION ===');
        console.log('Title:', question.title);
        console.log('Examples type:', typeof question.examples);
        console.log('Examples:', JSON.stringify(question.examples, null, 2));
        console.log('\n');

        // 2. Simulate what the API returns
        const apiResponse = {
            questions: question
        };

        console.log('=== API RESPONSE ===');
        console.log(JSON.stringify(apiResponse, null, 2));
        console.log('\n');

        // 3. Check if examples array exists and has data
        if (question.examples && Array.isArray(question.examples) && question.examples.length > 0) {
            console.log('✅ Examples exist and are an array');
            console.log(`✅ Number of examples: ${question.examples.length}`);
            console.log('✅ First example:', question.examples[0]);
        } else {
            console.log('❌ Examples missing or not an array');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testDataFlow();
