import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
const prisma = new PrismaClient();
async function manuallyAddAttempt() {
    try {
        const studentEmail = 'asaugnik@gmail.com';
        const question = await prisma.questions.findFirst({
            select: { id: true, title: true }
        });
        if (!question) {
            console.log('❌ No questions found in database!');
            return;
        }
        console.log(`\n✅ Found question: ${question.title} (ID: ${question.id})`);
        console.log('\n🔄 Attempting to create attempt record...');
        const attemptId = crypto.randomUUID();
        const attempt = await prisma.attempts.create({
            data: {
                id: attemptId,
                student_email: studentEmail,
                question_id: question.id,
                submission: 'function test() { return true; }',
                score: 1.0,
                feedback: JSON.stringify({ score: 100 }),
                passed: true
            }
        });
        console.log('✅ Attempt created successfully!');
        console.log('   ID:', attempt.id);
        console.log('\n🔄 Attempting to create solved_questions record...');
        const solvedId = crypto.randomUUID();
        const solved = await prisma.solved_questions.create({
            data: {
                id: solvedId,
                student_email: studentEmail,
                question_id: question.id,
                score: 100,
                attempts: 1
            }
        });
        console.log('✅ Solved question created successfully!');
        console.log('   ID:', solved.id);
        const count = await prisma.solved_questions.count({
            where: { student_email: studentEmail }
        });
        console.log(`\n📊 Total solved questions for ${studentEmail}: ${count}`);
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Code:', error.code);
        if (error.meta) {
            console.error('Meta:', error.meta);
        }
    } finally {
        await prisma.$disconnect();
    }
}
manuallyAddAttempt();