import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkUserProgress() {
    try {
        const users = await prisma.auth_users.findMany({
            where: {
                role: 'student'
            },
            select: {
                email: true,
                name: true
            }
        });
        console.log('\n📧 Student users:');
        users.forEach(u => console.log(`  - ${u.email} (${u.name})`));
        if (users.length === 0) {
            console.log('\n❌ No student users found!');
            return;
        }
        const studentEmail = users[0].email;
        console.log(`\n🔍 Checking progress for: ${studentEmail}\n`);
        const solvedQuestions = await prisma.solved_questions.findMany({
            where: { student_email: studentEmail },
            include: {
                question: {
                    select: { title: true }
                }
            }
        });
        console.log(`✅ Solved Questions: ${solvedQuestions.length}`);
        solvedQuestions.forEach(sq => {
            console.log(`   - ${sq.question.title} (Score: ${sq.score})`);
        });
        const assignments = await prisma.question_assignments.findMany({
            where: { student_email: studentEmail }
        });
        console.log(`\n📋 Assignments: ${assignments.length}`);
        console.log(`   Completed: ${assignments.filter(a => a.completed).length}`);
        console.log(`   Pending: ${assignments.filter(a => !a.completed).length}`);
        const levelData = await prisma.student_levels.findUnique({
            where: { student_email: studentEmail }
        });
        console.log(`\n⚡ XP & Level:`);
        if (levelData) {
            console.log(`   XP: ${levelData.xp_points}`);
            console.log(`   Level: ${levelData.current_level}`);
        } else {
            console.log(`   ❌ No level data found!`);
        }
        const rankingData = await prisma.student_rankings.findUnique({
            where: { student_email: studentEmail }
        });
        console.log(`\n🏆 Rankings:`);
        if (rankingData) {
            console.log(`   Total Score: ${rankingData.total_score}`);
            console.log(`   Questions Solved: ${rankingData.questions_solved}`);
            console.log(`   Rank: ${rankingData.rank || 'N/A'}`);
        } else {
            console.log(`   ❌ No ranking data found!`);
        }
        const attempts = await prisma.attempts.findMany({
            where: { student_email: studentEmail },
            orderBy: { created_at: 'desc' },
            take: 5
        });
        console.log(`\n📝 Recent Attempts: ${attempts.length}`);
        attempts.forEach(att => {
            console.log(`   - Score: ${att.score}, Passed: ${att.passed}, Time: ${att.created_at}`);
        });
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}
checkUserProgress();