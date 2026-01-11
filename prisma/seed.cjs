// prisma/seed.cjs - Corrected version
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Clear existing data
    console.log('🗑️  Cleaning existing data...');
    await prisma.attempt_test_results.deleteMany({});
    await prisma.attempts.deleteMany({});
    await prisma.test_cases.deleteMany({});
    await prisma.questions.deleteMany({});
    await prisma.users.deleteMany({});
    // Create demo users
    console.log('👤 Creating users...');
    const demoUser = await prisma.users.create({
        data: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'demo@local',
            name: 'Demo User',
            metadata: { theme: 'dark', notifications: true }
        },
    });
    console.log('✅ Created user:', demoUser.email);
    // Create questions
    console.log('📝 Creating questions...');
    const twoSumId = randomUUID();
    await prisma.questions.create({
        data: {
            id: twoSumId,
            domain: 'Arrays',
            difficulty: 'Easy',
            type: 'coding',
            title: 'Two Sum',
            prompt: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            constraints: {
                items: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9']
            },
            examples: [
                { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }
            ],
            reference_solution: 'function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) { return [map.get(complement), i]; } map.set(nums[i], i); } return []; }',
            starter_code: 'function twoSum(nums, target) {\n    // Write your solution here\n}'
        }
    });
    // Create test cases for Two Sum
    await prisma.test_cases.createMany({
        data: [
            {
                id: randomUUID(),
                question_id: twoSumId,
                stdin: '4\\n2 7 11 15\\n9',
                stdout: '0 1',
                order_index: 1
            },
            {
                id: randomUUID(),
                question_id: twoSumId,
                stdin: '3\\n3 2 4\\n6',
                stdout: '1 2',
                order_index: 2
            }
        ]
    });
    console.log('✅ Created question: Two Sum');
    const palindromeId = randomUUID();
    await prisma.questions.create({
        data: {
            id: palindromeId,
            domain: 'Strings',
            difficulty: 'Easy',
            type: 'coding',
            title: 'Valid Palindrome',
            prompt: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
            constraints: {
                items: ['1 <= s.length <= 2 * 10^5']
            },
            examples: [
                { input: 's = "A man, a plan, a canal: Panama"', output: 'true' }
            ],
            reference_solution: 'function isPalindrome(s) { const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, ""); return cleaned === cleaned.split("").reverse().join(""); }',
            starter_code: 'function isPalindrome(s) {\n    // Write your solution here\n}'
        }
    });
    await prisma.test_cases.createMany({
        data: [
            {
                id: randomUUID(),
                question_id: palindromeId,
                stdin: 'A man, a plan, a canal: Panama',
                stdout: 'true',
                order_index: 1
            },
            {
                id: randomUUID(),
                question_id: palindromeId,
                stdin: 'race a car',
                stdout: 'false',
                order_index: 2
            }
        ]
    });
    console.log('✅ Created question: Valid Palindrome');
    // Create sample attempt
    console.log('🎯 Creating sample attempt...');
    await prisma.attempts.create({
        data: {
            id: randomUUID(),
            user_id: demoUser.id,
            question_id: twoSumId,
            language: 'javascript',
            submission: 'function twoSum(nums, target) { return [0, 1]; }',
            score: 0.85,
            feedback: {
                strengths: ['Good code structure'],
                improvements: ['Add edge case handling']
            }
        }
    });
    console.log('🎉 Seed completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${await prisma.users.count()}`);
    console.log(`   - Questions: ${await prisma.questions.count()}`);
    console.log(`   - Test Cases: ${await prisma.test_cases.count()}`);
    console.log(`   - Attempts: ${await prisma.attempts.count()}`);
}
main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
