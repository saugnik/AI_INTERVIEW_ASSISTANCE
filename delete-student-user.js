// delete-student-user.js
// Script to delete a student user and all related data to allow re-registration as educator

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function deleteStudentUser(email) {
    try {
        console.log(`🗑️  Deleting all data for: ${email}`);

        // Delete in order to respect foreign key constraints

        // 1. Delete question assignments
        const assignments = await prisma.question_assignments.deleteMany({
            where: { student_email: email }
        });
        console.log(`✅ Deleted ${assignments.count} question assignments`);

        // 2. Delete solved questions
        const solved = await prisma.solved_questions.deleteMany({
            where: { student_email: email }
        });
        console.log(`✅ Deleted ${solved.count} solved questions`);

        // 3. Delete attempts
        const attempts = await prisma.attempts.deleteMany({
            where: { student_email: email }
        });
        console.log(`✅ Deleted ${attempts.count} attempts`);

        // 4. Delete student rankings
        const rankings = await prisma.student_rankings.deleteMany({
            where: { student_email: email }
        });
        console.log(`✅ Deleted ${rankings.count} ranking records`);

        // 5. Delete auth user
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

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.error('❌ Please provide an email address');
    console.error('Usage: node delete-student-user.js <email>');
    process.exit(1);
}

deleteStudentUser(email);
