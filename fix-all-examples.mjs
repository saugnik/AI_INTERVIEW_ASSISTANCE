import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function addExamplesToAll() {
    try {
        const questions = await prisma.questions.findMany();
        console.log(`Found ${questions.length} questions\n`);
        for (const q of questions) {
            if (!q.examples || q.examples.length === 0) {
                console.log(`Adding examples to: ${q.title}`);
                const examples = q.type === 'Coding' ? [
                    {
                        input: "Example input 1",
                        output: "Example output 1",
                        explanation: "This is how the solution works for this input"
                    },
                    {
                        input: "Example input 2",
                        output: "Example output 2",
                        explanation: "Another example showing the solution"
                    }
                ] : [
                    {
                        input: "Scenario 1",
                        output: "Expected approach or answer",
                        explanation: "Explanation of the solution"
                    }
                ];
                await prisma.questions.update({
                    where: { id: q.id },
                    data: { examples }
                });
                console.log('✅ Examples added\n');
            }
        }
        console.log('Done!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}
addExamplesToAll();