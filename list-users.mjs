// Check which users are in the database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        console.log('🔍 Checking users in auth_users table...\n');

        const users = await prisma.$queryRawUnsafe(`
      SELECT email, name, role, created_at 
      FROM auth_users 
      ORDER BY created_at DESC
    `);

        console.log('Users in database:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.name}) - Role: ${user.role}`);
        });
        console.log(`\nTotal: ${users.length} users`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
