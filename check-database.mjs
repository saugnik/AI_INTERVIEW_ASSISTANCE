import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkDatabase() {
    try {
        console.log('\n🔍 Database Status Check\n');
        const totalQuestions = await prisma.questions.count();
        console.log(`📚 Total Questions in Database: ${totalQuestions}`);
        if (totalQuestions > 0) {
            const questions = await prisma.questions.findMany({
                take: 5,
                select: {
                    id: true,
                    title: true,
                    source: true
                }
            });
            console.log('\nSample questions:');
            questions.forEach(q => console.log(`  - ${q.title} (${q.source})`));
        }
        const totalAssignments = await prisma.question_assignments.count();
        console.log(`\n📋 Total Assignments: ${totalAssignments}`);
        if (totalAssignments > 0) {
            const assignments = await prisma.question_assignments.findMany({
                take: 5,
                include: {
                    question: {
                        select: { title: true }
                    }
                }
            });
            console.log('\nSample assignments:');
            assignments.forEach(a => {
                console.log(`  - ${a.student_email}: ${a.question.title} (${a.completed ? 'Completed' : 'Pending'})`);
            });
        }
        const studentEmail = 'asaugnik@gmail.com';
        const studentAssignments = await prisma.question_assignments.findMany({
            where: { student_email: studentEmail }
        });
        console.log(`\n👤 Assignments for ${studentEmail}: ${studentAssignments.length}`);
        const adminUsers = await prisma.auth_users.findMany({
            where: { role: 'admin' }
        });
        console.log(`\n👨‍💼 Admin Users: ${adminUsers.length}`);
        adminUsers.forEach(a => console.log(`  - ${a.email} (${a.name})`));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}
checkDatabase();