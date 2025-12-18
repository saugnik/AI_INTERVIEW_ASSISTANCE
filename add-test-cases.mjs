// Add test cases to existing questions
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addTestCases() {
    try {
        console.log('Adding test cases to questions...\n');

        // Get a coding question
        const codingQuestion = await prisma.questions.findFirst({
            where: {
                domain: 'Data Structures & Algorithms',
                type: 'Coding'
            }
        });

        if (codingQuestion) {
            console.log(`Updating: ${codingQuestion.title}`);

            // Add proper examples with input/output
            await prisma.questions.update({
                where: { id: codingQuestion.id },
                data: {
                    examples: [
                        {
                            input: "[1,2,3,4,5]",
                            output: "[5,4,3,2,1]",
                            explanation: "Reverse the array in place"
                        },
                        {
                            input: "[10,20,30]",
                            output: "[30,20,10]",
                            explanation: "Array is reversed"
                        }
                    ],
                    test_cases: [
                        {
                            input: "[1,2,3,4,5]",
                            expectedOutput: "[5,4,3,2,1]",
                            isHidden: false
                        },
                        {
                            input: "[10,20,30]",
                            expectedOutput: "[30,20,10]",
                            isHidden: false
                        },
                        {
                            input: "[]",
                            expectedOutput: "[]",
                            isHidden: true
                        }
                    ]
                }
            });

            console.log('✅ Test cases added!');
        }

        // Verify
        const updated = await prisma.questions.findUnique({
            where: { id: codingQuestion.id }
        });

        console.log('\nUpdated question examples:');
        console.log(JSON.stringify(updated.examples, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

addTestCases();
