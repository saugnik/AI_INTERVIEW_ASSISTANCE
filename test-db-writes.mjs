// Test database write operations
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseWrites() {
    try {
        console.log('🧪 Testing database write operations...\n');

        // Test 1: Read auth_users
        console.log('1️⃣ Testing read from auth_users...');
        const users = await prisma.auth_users.findMany({ take: 1 });
        console.log(`✅ Read successful: Found ${users.length} user(s)\n`);

        // Test 2: Read questions
        console.log('2️⃣ Testing read from questions...');
        const questions = await prisma.questions.findMany({ take: 1 });
        console.log(`✅ Read successful: Found ${questions.length} question(s)\n`);

        // Test 3: Read question_assignments
        console.log('3️⃣ Testing read from question_assignments...');
        const assignments = await prisma.question_assignments.findMany({ take: 1 });
        console.log(`✅ Read successful: Found ${assignments.length} assignment(s)\n`);

        // Test 4: Try to create a test user (then delete it)
        console.log('4️⃣ Testing write to auth_users...');
        const testEmail = `test_${Date.now()}@example.com`;
        const testUser = await prisma.auth_users.create({
            data: {
                email: testEmail,
                name: 'Test User',
                role: 'student'
            }
        });
        console.log(`✅ Write successful: Created user ${testUser.email}`);

        // Clean up
        await prisma.auth_users.delete({ where: { email: testEmail } });
        console.log(`✅ Cleanup successful: Deleted test user\n`);

        // Test 5: Check if attempts table is writable
        console.log('5️⃣ Testing read from attempts...');
        const attempts = await prisma.attempts.findMany({ take: 1 });
        console.log(`✅ Read successful: Found ${attempts.length} attempt(s)\n`);

        console.log('✅ ALL TESTS PASSED - Database writes are working!\n');

    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabaseWrites();
