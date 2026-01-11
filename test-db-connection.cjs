const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function testDatabase() {
    try {
        console.log('🔍 Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connected successfully!');
        const questionCount = await prisma.questions.count();
        console.log(`📊 Total questions in database: ${questionCount}`);
        const questions = await prisma.questions.findMany({
            select: {
                id: true,
                title: true,
                domain: true,
                difficulty: true,
                created_at: true
            },
            orderBy: { created_at: 'desc' },
            take: 10
        });
        console.log('\n📝 Recent questions:');
        if (questions.length === 0) {
            console.log('   No questions found in database.');
        } else {
            questions.forEach((q, i) => {
                console.log(`   ${i + 1}. ${q.title} (${q.domain} - ${q.difficulty})`);
                console.log(`      ID: ${q.id}`);
                console.log(`      Created: ${q.created_at}`);
            });
        }
        const assignmentCount = await prisma.question_assignments.count();
        console.log(`\n📋 Total assignments: ${assignmentCount}`);
    } catch (error) {
        console.error('❌ Database error:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}
testDatabase();