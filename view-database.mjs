// View database contents
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function viewDatabase() {
    try {
        console.log('=== DATABASE CONTENTS ===\n');

        // Users
        const users = await prisma.$queryRawUnsafe('SELECT email, name, role FROM auth_users');
        console.log('👥 USERS (auth_users):');
        console.table(users);

        // Questions
        const questions = await prisma.questions.findMany({
            select: {
                title: true,
                domain: true,
                difficulty: true,
                type: true
            },
            take: 10
        });
        console.log('\n📚 QUESTIONS (first 10):');
        console.table(questions);

        // Assignments
        const assignments = await prisma.question_assignments.findMany({
            select: {
                student_email: true,
                assignment_type: true,
                source: true,
                completed: true
            },
            take: 10
        });
        console.log('\n📝 ASSIGNMENTS (first 10):');
        console.table(assignments);

        // Stats
        const stats = await prisma.$queryRawUnsafe(`
      SELECT 
        (SELECT COUNT(*) FROM auth_users) as total_users,
        (SELECT COUNT(*) FROM questions) as total_questions,
        (SELECT COUNT(*) FROM question_assignments) as total_assignments,
        (SELECT COUNT(*) FROM question_assignments WHERE completed = true) as completed_assignments
    `);
        console.log('\n📊 STATISTICS:');
        console.table(stats);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

viewDatabase();
