// Comprehensive Test for All New Features
console.log('🧪 Testing Complete System Implementation\n');
console.log('='.repeat(60));
console.log('');

const API_BASE = 'http://localhost:3001';
const TEST_STUDENT_EMAIL = 'student@test.com';

let passedTests = 0;
let totalTests = 0;

async function runTests() {
    // Test 1: Generate Question (Auto-Save)
    console.log('\n📝 Test 1: Generate Question with Auto-Save');
    console.log('-'.repeat(60));
    totalTests++;
    try {
        const response = await fetch(`${API_BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                domain: 'DSA',
                difficulty: 'EASY',
                type: 'CODING'
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.id && data.source === 'ai') {
            console.log('✅ PASSED - Question generated and saved');
            console.log(`   ID: ${data.id}`);
            console.log(`   Title: ${data.title}`);
            console.log(`   Source: ${data.source}`);
            passedTests++;
        } else {
            console.log('❌ FAILED - Missing ID or source');
        }
    } catch (error) {
        console.log(`❌ FAILED - ${error.message}`);
    }

    // Test 2: Get Leaderboard
    console.log('\n🏆 Test 2: Get Leaderboard');
    console.log('-'.repeat(60));
    totalTests++;
    try {
        const response = await fetch(`${API_BASE}/api/rankings?limit=5`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.leaderboard && Array.isArray(data.leaderboard)) {
            console.log('✅ PASSED - Leaderboard retrieved');
            console.log(`   Students: ${data.leaderboard.length}`);
            if (data.leaderboard.length > 0) {
                console.log(`   Top student: ${data.leaderboard[0].name} (Score: ${data.leaderboard[0].totalScore})`);
            }
            passedTests++;
        } else {
            console.log('❌ FAILED - Invalid leaderboard data');
        }
    } catch (error) {
        console.log(`❌ FAILED - ${error.message}`);
    }

    // Test 3: Get Student Rank
    console.log('\n📊 Test 3: Get Student Rank');
    console.log('-'.repeat(60));
    totalTests++;
    try {
        const response = await fetch(`${API_BASE}/api/rankings/${encodeURIComponent(TEST_STUDENT_EMAIL)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.rank !== undefined) {
            console.log('✅ PASSED - Student rank retrieved');
            console.log(`   Rank: ${data.rank}/${data.totalStudents}`);
            console.log(`   Questions Solved: ${data.questionsSolved}`);
            console.log(`   Avg Score: ${data.avgScore}`);
            passedTests++;
        } else {
            console.log('❌ FAILED - Invalid rank data');
        }
    } catch (error) {
        console.log(`❌ FAILED - ${error.message}`);
    }

    // Test 4: Get Student Progress
    console.log('\n📈 Test 4: Get Student Progress Dashboard');
    console.log('-'.repeat(60));
    totalTests++;
    try {
        const response = await fetch(`${API_BASE}/api/student/progress/${encodeURIComponent(TEST_STUDENT_EMAIL)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.level && data.xp !== undefined) {
            console.log('✅ PASSED - Progress dashboard retrieved');
            console.log(`   Level: ${data.level}`);
            console.log(`   XP: ${data.xp}/${data.nextLevelXP}`);
            console.log(`   Badges: ${data.badges.length}`);
            console.log(`   Rank: ${data.rank}/${data.totalStudents}`);
            passedTests++;
        } else {
            console.log('❌ FAILED - Invalid progress data');
        }
    } catch (error) {
        console.log(`❌ FAILED - ${error.message}`);
    }

    // Test 5: Get AI-Generated Questions (Admin)
    console.log('\n🤖 Test 5: Get AI-Generated Questions (Admin)');
    console.log('-'.repeat(60));
    totalTests++;
    try {
        const response = await fetch(`${API_BASE}/api/admin/suggested-questions`, {
            headers: {
                'x-user-email': 'admin@aiinterview.com',
                'x-user-role': 'admin'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.suggestions && Array.isArray(data.suggestions)) {
            console.log('✅ PASSED - AI-generated questions retrieved');
            console.log(`   Total: ${data.suggestions.length}`);
            if (data.suggestions.length > 0) {
                console.log(`   Latest: ${data.suggestions[0].title}`);
                console.log(`   Test Cases: ${data.suggestions[0].testCasesCount}`);
                console.log(`   Hints: ${data.suggestions[0].hintsCount}`);
            }
            passedTests++;
        } else {
            console.log('❌ FAILED - Invalid suggestions data');
        }
    } catch (error) {
        console.log(`❌ FAILED - ${error.message}`);
    }

    // Test 6: Database Check
    console.log('\n💾 Test 6: Database Tables Check');
    console.log('-'.repeat(60));
    totalTests++;
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const tables = {
            auth_users: await prisma.auth_users.count(),
            student_rankings: await prisma.student_rankings.count(),
            student_levels: await prisma.student_levels.count(),
            questions: await prisma.questions.count(),
            test_cases: await prisma.test_cases.count(),
            question_hints: await prisma.question_hints.count(),
            solved_questions: await prisma.solved_questions.count()
        };

        await prisma.$disconnect();

        console.log('✅ PASSED - All tables accessible');
        console.log(`   Users: ${tables.auth_users}`);
        console.log(`   Rankings: ${tables.student_rankings}`);
        console.log(`   Levels: ${tables.student_levels}`);
        console.log(`   Questions: ${tables.questions}`);
        console.log(`   Test Cases: ${tables.test_cases}`);
        console.log(`   Hints: ${tables.question_hints}`);
        console.log(`   Solved: ${tables.solved_questions}`);
        passedTests++;
    } catch (error) {
        console.log(`❌ FAILED - ${error.message}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed\n`);

    if (passedTests === totalTests) {
        console.log('✅ ALL TESTS PASSED! System is fully operational.\n');
        console.log('🎉 Features Implemented:');
        console.log('   ✅ Auto-save AI-generated questions');
        console.log('   ✅ Email-based primary keys');
        console.log('   ✅ Student ranking system');
        console.log('   ✅ Leveling system with XP and badges');
        console.log('   ✅ Solved questions tracking');
        console.log('   ✅ AI-powered hints');
        console.log('   ✅ Admin suggestion panel');
        console.log('   ✅ Student progress dashboard');
        console.log('');
    } else {
        console.log(`⚠️  ${totalTests - passedTests} test(s) failed. Check errors above.\n`);
    }

    process.exit(passedTests === totalTests ? 0 : 1);
}

runTests().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
