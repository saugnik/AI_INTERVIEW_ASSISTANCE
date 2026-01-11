import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function createAuthUsersTable() {
    try {
        console.log('Creating auth_users table...');
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        picture TEXT,
        role TEXT DEFAULT 'student',
        password_hash TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('✅ auth_users table created successfully!');
        const result = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) FROM auth_users;
    `);
        console.log('✅ Table verified, current rows:', result);
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}
createAuthUsersTable();