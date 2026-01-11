import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkTestCases() {
    const question = await prisma.questions.findFirst({
        where: { source: 'ai' },
        include: {
            test_cases: true
        },
        orderBy: { created_at: 'desc' }
    });
    console.log('Question:', question.title);
    console.log('Test Cases:');
    question.test_cases.forEach((tc, i) => {
        console.log(`\nTest ${i + 1}:`);
        console.log('  stdin:', tc.stdin);
        console.log('  stdout:', tc.stdout);
        console.log('  stdin type:', typeof tc.stdin);
        console.log('  stdout type:', typeof tc.stdout);
    });
    await prisma.$disconnect();
}
checkTestCases().catch(console.error);