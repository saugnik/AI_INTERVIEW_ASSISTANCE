import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
async function deleteStudentUser(email) {
    try {
        console.log(`🗑️  Deleting all data for: ${email}`);
        const assignments = await prisma.question_assignments.deleteMany({
            where: { student_email: email }
        });
        console.log(`✅ Deleted ${assignments.count} question assignments`);
        const solved = await prisma.solved_questions.deleteMany({
            where: { student_email: email }
        });
        console.log(`✅ Deleted ${solved.count} solved questions`);
        const attempts = await prisma.attempts.deleteMany({
            where: { student_email: email }
        });
        console.log(`✅ Deleted ${attempts.count} attempts`);
        const rankings = await prisma.student_rankings.deleteMany({
            where: { student_email: email }
        });
        console.log(`✅ Deleted ${rankings.count} ranking records`);
        const user = await prisma.auth_users.delete({
            where: { email: email }
        });
        console.log(`✅ Deleted user account: ${user.email} (${user.role})`);
        console.log(`\n✨ Successfully deleted all data for ${email}`);
        console.log(`📝 User can now re-register as an educator`);
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}
const email = process.argv[2];
if (!email) {
    console.error('❌ Please provide an email address');
    console.error('Usage: node delete-student-user.js <email>');
    process.exit(1);
}
deleteStudentUser(email);