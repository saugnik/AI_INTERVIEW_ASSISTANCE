import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function testDatabase() {
    console.log('🧪 Testing Database Connection and Operations\n');
    console.log('='.repeat(50));
    console.log('');
    let passedTests = 0;
    let totalTests = 0;
    console.log('Test 1: Database Connection');
    console.log('-'.repeat(50));
    totalTests++;
    try {
        await prisma.$connect();
        console.log('✅ PASSED - Connected to database');
        passedTests++;
    } catch (error) {
        console.log('❌ FAILED');
        console.log(`   Error: ${error.message}`);
        console.log('\n⚠️  Cannot proceed without database connection');
        await prisma.$disconnect();
        process.exit(1);
    }
    console.log('');
    console.log('Test 2: Read Questions');
    console.log('-'.repeat(50));
    totalTests++;
    try {
        const questions = await prisma.questions.findMany({ take: 5 });
        console.log('✅ PASSED');
        console.log(`   Found ${questions.length} questions`);
        if (questions.length > 0) {
            console.log(`   Sample: "${questions[0].title}"`);
        }
        passedTests++;
    } catch (error) {
        console.log('❌ FAILED');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');
    console.log('Test 3: Read Test Cases');
    console.log('-'.repeat(50));
    totalTests++;
    try {
        const testCases = await prisma.test_cases.findMany({ take: 5 });
        console.log('✅ PASSED');
        console.log(`   Found ${testCases.length} test cases`);
        passedTests++;
    } catch (error) {
        console.log('❌ FAILED');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');
    console.log('Test 4: Read Admin Codes');
    console.log('-'.repeat(50));
    totalTests++;
    try {
        const adminCodes = await prisma.admin_codes.findMany();
        console.log('✅ PASSED');
        console.log(`   Found ${adminCodes.length} admin codes`);
        if (adminCodes.length > 0) {
            console.log(`   Active codes: ${adminCodes.filter(c => c.is_active).length}`);
        }
        passedTests++;
    } catch (error) {
        console.log('❌ FAILED');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');
    console.log('Test 5: Read Auth Users');
    console.log('-'.repeat(50));
    totalTests++;
    try {
        const users = await prisma.auth_users.findMany({ take: 5 });
        console.log('✅ PASSED');
        console.log(`   Found ${users.length} users`);
        if (users.length > 0) {
            const admins = users.filter(u => u.role === 'admin').length;
            const students = users.filter(u => u.role === 'student' || u.role === 'user').length;
            console.log(`   Admins: ${admins}, Students: ${students}`);
        }
        passedTests++;
    } catch (error) {
        console.log('❌ FAILED');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');
    console.log('Test 6: Database Schema');
    console.log('-'.repeat(50));
    totalTests++;
    try {
        const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
        const expectedTables = [
            'admin_codes',
            'attempt_test_results',
            'attempts',
            'auth_users',
            'question_assignments',
            'questions',
            'session',
            'test_cases',
            'users'
        ];
        const tableNames = tables.map(t => t.table_name);
        const missingTables = expectedTables.filter(t => !tableNames.includes(t));
        if (missingTables.length === 0) {
            console.log('✅ PASSED');
            console.log(`   All ${expectedTables.length} required tables exist`);
            passedTests++;
        } else {
            console.log('⚠️  PARTIAL');
            console.log(`   Found ${tableNames.length} tables`);
            console.log(`   Missing: ${missingTables.join(', ')}`);
        }
    } catch (error) {
        console.log('❌ FAILED');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');
    console.log('='.repeat(50));
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed\n`);
    if (passedTests === totalTests) {
        console.log('✅ All database tests passed!\n');
    } else {
        console.log('⚠️  Some tests failed.\n');
        console.log('Troubleshooting:');
        console.log('  1. Run: npx prisma migrate dev --name init');
        console.log('  2. Run: node setup-database.js');
        console.log('  3. Check DATABASE_URL in .env file');
        console.log('');
    }
    await prisma.$disconnect();
    process.exit(passedTests === totalTests ? 0 : 1);
}
testDatabase().catch(async (error) => {
    console.error('❌ Fatal error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
});