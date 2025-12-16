// Manually add asaugnik@gmail.com to database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addUser() {
    try {
        console.log('Adding asaugnik@gmail.com to database...');

        await prisma.$executeRawUnsafe(`
      INSERT INTO auth_users (email, name, role, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, 'asaugnik@gmail.com', 'Saugnik Aich', 'student');

        console.log('✅ User added successfully!');

        // List all users
        const users = await prisma.$queryRawUnsafe(`
      SELECT email, name, role FROM auth_users ORDER BY created_at DESC
    `);

        console.log('\nAll users now:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.name}) - ${user.role}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

addUser();
