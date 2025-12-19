import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdminCodes() {
    try {
        const codes = await prisma.$queryRawUnsafe(`
            SELECT * FROM admin_codes LIMIT 10
        `);

        if (codes.length === 0) {
            console.log('⚠️  No admin codes found in database.');
            console.log('💡 You may need to create an admin code first.');
        } else {
            console.log('📋 Admin Codes in Database:\n');
            codes.forEach((code, index) => {
                console.log(`${index + 1}. Code: ${code.code}`);
                console.log(`   Active: ${code.is_active !== false}`);
                if (code.used_count !== undefined) {
                    console.log(`   Used: ${code.used_count} times`);
                }
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 The admin_codes table may not exist yet.');
        console.log('   You can create an admin code using: node insert-admin-code.cjs');
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminCodes();
