// Check admin codes in database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdminCodes() {
    try {
        const codes = await prisma.$queryRawUnsafe(`
      SELECT code, created_by, is_active, used_count 
      FROM admin_codes 
      ORDER BY created_at DESC
    `);

        console.log('📋 Admin Codes in Database:\n');
        codes.forEach((code, index) => {
            console.log(`${index + 1}. Code: ${code.code}`);
            console.log(`   Created by: ${code.created_by || 'System'}`);
            console.log(`   Active: ${code.is_active}`);
            console.log(`   Used: ${code.used_count} times\n`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminCodes();
