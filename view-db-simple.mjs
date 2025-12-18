// Simple database viewer
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function viewDB() {
    try {
        console.log('=== YOUR DATABASE ===\n');

        // Users
        const users = await prisma.$queryRawUnsafe('SELECT email, name, role FROM auth_users');
        console.log('👥 USERS:');
        users.forEach(u => console.log(`  - ${u.email} (${u.name}) - ${u.role}`));

        // Questions count
        const qCount = await prisma.questions.count();
        console.log(`\n📚 QUESTIONS: ${qCount} total`);

        const questions = await prisma.questions.findMany({ take: 5 });
        console.log('  First 5:');
        questions.forEach(q => console.log(`  - ${q.title} (${q.domain}, ${q.difficulty})`));

        // Assignments
        const aCount = await prisma.question_assignments.count();
        console.log(`\n📝 ASSIGNMENTS: ${aCount} total`);

        const assignments = await prisma.$queryRawUnsafe(`
      SELECT qa.student_email, q.title, qa.completed, qa.assignment_type
      FROM question_assignments qa
      JOIN questions q ON qa.question_id = q.id
      LIMIT 10
    `);
        console.log('  Recent assignments:');
        assignments.forEach(a => console.log(`  - ${a.student_email}: "${a.title}" (${a.completed ? '✅' : '⏳'} ${a.assignment_type})`));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

viewDB();
