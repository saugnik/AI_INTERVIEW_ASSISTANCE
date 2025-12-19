import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function testDirectInsert() {
    try {
        const studentEmail = 'asaugnik@gmail.com';

        // Get a question
        const question = await prisma.questions.findFirst();

        if (!question) {
            console.log('❌ No questions in database!');
            return;
        }

        console.log(`\n✅ Found question: ${question.title}`);
        console.log(`   ID: ${question.id}`);

        // Try to insert attempt directly
        console.log(`\n🔄 Attempting to insert attempt for ${studentEmail}...`);

        const attemptId = crypto.randomUUID();
        const attempt = await prisma.attempts.create({
            data: {
                id: attemptId,
                student_email: studentEmail,
                question_id: question.id,
                submission: 'test code',
                score: 1.0,
                feedback: JSON.stringify({ test: true })
            }
        });

        console.log('✅ SUCCESS! Attempt created:');
        console.log('   ID:', attempt.id);
        console.log('   Student:', attempt.student_email);
        console.log('   Question:', attempt.question_id);

        // Clean up
        await prisma.attempts.delete({ where: { id: attemptId } });
        console.log('\n🧹 Cleaned up test attempt');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Code:', error.code);
        if (error.meta) {
            console.error('Meta:', JSON.stringify(error.meta, null, 2));
        }
    } finally {
        await prisma.$disconnect();
    }
}

testDirectInsert();
