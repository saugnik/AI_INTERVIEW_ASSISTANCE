// Seed database with initial data for new schema
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
    console.log('🌱 Seeding database with initial data...\n');

    try {
        // 1. Create admin user
        console.log('Creating admin user...');
        await prisma.auth_users.upsert({
            where: { email: 'admin@aiinterview.com' },
            update: {},
            create: {
                email: 'admin@aiinterview.com',
                name: 'Admin User',
                role: 'admin',
                auth_provider: 'google'
            }
        });
        console.log('✅ Admin user created\n');

        // 2. Create admin code
        console.log('Creating admin code...');
        await prisma.admin_codes.upsert({
            where: { code: 'ADMIN2024' },
            update: {},
            create: {
                code: 'ADMIN2024',
                description: 'Default admin access code',
                is_active: true
            }
        });
        console.log('✅ Admin code created: ADMIN2024\n');

        // 3. Create sample student
        console.log('Creating sample student...');
        const studentEmail = 'student@test.com';
        await prisma.auth_users.upsert({
            where: { email: studentEmail },
            update: {},
            create: {
                email: studentEmail,
                name: 'Test Student',
                role: 'student',
                auth_provider: 'google'
            }
        });

        // Initialize student rankings
        await prisma.student_rankings.upsert({
            where: { student_email: studentEmail },
            update: {},
            create: {
                student_email: studentEmail,
                total_score: 0,
                questions_solved: 0,
                avg_score: 0
            }
        });

        // Initialize student levels
        await prisma.student_levels.upsert({
            where: { student_email: studentEmail },
            update: {},
            create: {
                student_email: studentEmail,
                current_level: 1,
                xp_points: 0,
                next_level_xp: 100,
                badges: []
            }
        });
        console.log('✅ Sample student created with rankings and levels\n');

        // 4. Create sample question
        console.log('Creating sample question...');
        const questionId = crypto.randomUUID();
        await prisma.questions.create({
            data: {
                id: questionId,
                domain: 'DSA',
                difficulty: 'EASY',
                type: 'CODING',
                title: 'Two Sum',
                prompt: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
                constraints: JSON.stringify([
                    '2 <= nums.length <= 10^4',
                    '-10^9 <= nums[i] <= 10^9',
                    'Only one valid answer exists'
                ]),
                examples: JSON.stringify([
                    { input: '[2,7,11,15], target=9', output: '[0,1]', explanation: '2 + 7 = 9' },
                    { input: '[3,2,4], target=6', output: '[1,2]', explanation: '2 + 4 = 6' }
                ]),
                reference_solution: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}',
                starter_code: 'function twoSum(nums, target) {\n  // Write your solution here\n  \n}',
                source: 'admin'
            }
        });

        // Create test cases for the question
        await prisma.test_cases.createMany({
            data: [
                {
                    id: crypto.randomUUID(),
                    question_id: questionId,
                    stdin: '[2,7,11,15]\n9',
                    stdout: '[0,1]',
                    order_index: 0
                },
                {
                    id: crypto.randomUUID(),
                    question_id: questionId,
                    stdin: '[3,2,4]\n6',
                    stdout: '[1,2]',
                    order_index: 1
                },
                {
                    id: crypto.randomUUID(),
                    question_id: questionId,
                    stdin: '[3,3]\n6',
                    stdout: '[0,1]',
                    order_index: 2
                }
            ]
        });

        // Create hints for the question
        await prisma.question_hints.createMany({
            data: [
                {
                    id: crypto.randomUUID(),
                    question_id: questionId,
                    hint_text: 'Think about using a data structure that allows O(1) lookup time.',
                    hint_level: 1
                },
                {
                    id: crypto.randomUUID(),
                    question_id: questionId,
                    hint_text: 'Consider using a hash map to store numbers you\'ve seen and their indices.',
                    hint_level: 2
                },
                {
                    id: crypto.randomUUID(),
                    question_id: questionId,
                    hint_text: 'For each number, calculate its complement (target - number) and check if it exists in your hash map.',
                    hint_level: 3
                }
            ]
        });

        console.log('✅ Sample question created with test cases and hints\n');

        // 5. Display summary
        console.log('📊 Database Summary:');
        const userCount = await prisma.auth_users.count();
        const questionCount = await prisma.questions.count();
        const testCaseCount = await prisma.test_cases.count();
        const hintCount = await prisma.question_hints.count();
        const rankingCount = await prisma.student_rankings.count();
        const levelCount = await prisma.student_levels.count();

        console.log(`   Users: ${userCount}`);
        console.log(`   Questions: ${questionCount}`);
        console.log(`   Test Cases: ${testCaseCount}`);
        console.log(`   Hints: ${hintCount}`);
        console.log(`   Student Rankings: ${rankingCount}`);
        console.log(`   Student Levels: ${levelCount}`);
        console.log('');

        console.log('✅ Database seeding complete!\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedDatabase();
