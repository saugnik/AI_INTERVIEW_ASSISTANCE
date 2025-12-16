// Check if users are being saved to database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        console.log('🔍 Checking for users in database...\n');

        // Check auth_users table (from auth backend)
        const authUsers = await prisma.$queryRaw`SELECT * FROM auth_users ORDER BY created_at DESC LIMIT 10`;
        console.log('📊 Auth Users (from auth_users table):');
        console.log(authUsers);
        console.log(`\nTotal auth users: ${authUsers.length}\n`);

        // Check students table (from main app)
        const students = await prisma.students.findMany({
            take: 10,
            orderBy: { created_at: 'desc' }
        });
        console.log('📊 Students (from students table):');
        console.log(students);
        console.log(`\nTotal students: ${students.length}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
