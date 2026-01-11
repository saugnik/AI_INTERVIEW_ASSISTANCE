const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function seedAdminCodes() {
    console.log('🔐 Seeding admin codes...');
    const adminCode = await prisma.admin_codes.upsert({
        where: { code: 'ADMIN2024' },
        update: {},
        create: {
            code: 'ADMIN2024',
            description: 'Default administrator access code',
            is_active: true,
            expires_at: null,
            used_by: []
        }
    });
    console.log('✅ Admin code created:', adminCode.code);
    console.log('📝 Description:', adminCode.description);
}
seedAdminCodes()
    .catch((e) => {
        console.error('❌ Error seeding admin codes:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
