// Simple check for users in database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        console.log('🔍 Checking database for users...\n');

        // Try to query auth_users table directly
        try {
            const authUsers = await prisma.$queryRawUnsafe('SELECT email, name, role, created_at FROM auth_users ORDER BY created_at DESC');
            console.log('✅ Found users in auth_users table:');
            console.table(authUsers);
            console.log(`Total: ${authUsers.length} users\n`);
        } catch (e) {
            console.log('❌ auth_users table error:', e.message);
        }

        // Check students table
        try {
            const students = await prisma.students.findMany({
                select: {
                    email: true,
                    name: true,
                    created_at: true
                },
                orderBy: { created_at: 'desc' }
            });
            console.log('✅ Found students in students table:');
            console.table(students);
            console.log(`Total: ${students.length} students\n`);
        } catch (e) {
            console.log('❌ students table error:', e.message);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
