// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Upsert demo user
    await prisma.user.upsert({
        where: { email: 'demo@local' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'demo@local',
            name: 'Demo User',
            created_at: new Date(),
            metadata: {}
        },
    });

    // Create demo question
    const question = await prisma.question.upsert({
        where: { id: '10000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '10000000-0000-0000-0000-000000000001',
            domain: 'Algorithms',
            difficulty: 'Easy',
            type: 'coding',
            title: 'Sum of Two',
            prompt: 'Given two integers a and b on a single line, print their sum.',
            constraints: { notes: ['a and b fit in 32-bit signed int'] },
            examples: [{ input: '2 3', output: '5' }],
            reference_solution: "def solve():\n a,b = map(int,input().split())\n print(a+b)\n",
            created_at: new Date(),
        },
    });

    // Create test cases
    await prisma.testCase.createMany({
        data: [
            {
                id: '20000000-0000-0000-0000-000000000001',
                question_id: question.id,
                order_index: 1,
                stdin: '2 3\n',
                stdout: '5\n',
            },
            {
                id: '20000000-0000-0000-0000-000000000002',
                question_id: question.id,
                order_index: 2,
                stdin: '0 0\n',
                stdout: '0\n',
            },
        ],
        skipDuplicates: true,
    });

    console.log('Seed complete');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
