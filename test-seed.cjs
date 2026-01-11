const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('Testing database connection...');
    const count = await prisma.users.count();
    console.log(`Current users in database: ${count}`);
    try {
        const user = await prisma.users.create({
            data: {
                id: '00000000-0000-0000-0000-000000000099',
                email: 'test@test.com',
                name: 'Test User',
                metadata: {}
            }
        });
        console.log('✅ Created test user:', user.email);
    } catch (e) {
        if (e.code === 'P2002') {
            console.log('User already exists, that\'s fine!');
        } else {
            throw e;
        }
    }
}
main()
    .then(() => console.log('Done!'))
    .catch(e => console.error('Error:', e.message))
    .finally(() => prisma.$disconnect());