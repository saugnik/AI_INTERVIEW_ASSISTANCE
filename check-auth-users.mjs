import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function checkAuthUsers() {
    try {
        const authUsers = await prisma.auth_users.findMany({
            select: {
                email: true,
                name: true,
                role: true
            }
        });
        console.log('\n👥 Users in auth_users table:');
        console.log('Total:', authUsers.length);
        authUsers.forEach(u => {
            console.log(`  - ${u.email} (${u.name}) - Role: ${u.role}`);
        });
        const targetEmail = 'asaugnik@gmail.com';
        const exists = authUsers.find(u => u.email === targetEmail);
        console.log(`\n🔍 Does ${targetEmail} exist in auth_users?`, exists ? '✅ YES' : '❌ NO');
        if (!exists) {
            console.log('\n⚠️ THIS IS THE PROBLEM!');
            console.log('The attempts table has a foreign key to auth_users.');
            console.log('When you try to save an attempt, it fails because your email is not in auth_users.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}
checkAuthUsers();