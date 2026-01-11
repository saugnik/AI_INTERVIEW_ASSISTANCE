import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
const GROQ_EVALUATION_KEY = process.env.GROQ_EVALUATION_KEY || process.env.GROQ_API_KEY;
export async function generateHintsForQuestion(questionTitle, questionDescription) {
    if (!GROQ_EVALUATION_KEY) {
        console.warn('GROQ_EVALUATION_KEY not set, using default hints');
        return [
            'Think about the problem constraints and edge cases.',
            'Consider what data structures might help solve this efficiently.',
            'Break down the problem into smaller steps and solve each one.'
        ];
    }
    try {
        const prompt = `Generate 3 progressive hints for this coding problem. Each hint should be more specific than the last, but none should give away the complete solution.
Problem: ${questionTitle}
Description: ${questionDescription}
Return ONLY valid JSON in this format:
{
  "hint1": "Gentle hint - general approach",
  "hint2": "Moderate hint - suggest data structure or algorithm",
  "hint3": "Strong hint - specific implementation detail without full solution"
}`;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_EVALUATION_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful coding tutor. Generate progressive hints that guide students without giving away the solution.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500,
                response_format: { type: 'json_object' }
            })
        });
        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }
        const data = await response.json();
        const hints = JSON.parse(data.choices[0].message.content);
        return [hints.hint1, hints.hint2, hints.hint3];
    } catch (error) {
        console.error('Error generating hints:', error);
        return [
            'Think about the problem constraints and what they tell you about the solution.',
            'Consider using a hash map or set for O(1) lookups.',
            'Try solving a smaller version of the problem first, then scale up.'
        ];
    }
}
export async function generateHintForWrongAnswer(question, userAnswer, failedTests) {
    if (!GROQ_EVALUATION_KEY) {
        return 'Review the test cases that failed and check your logic for those specific inputs.';
    }
    try {
        const failedTestsStr = failedTests.map(t =>
            `Input: ${t.input}, Expected: ${t.expected}, Got: ${t.actual || 'error'}`
        ).join('\n');
        const prompt = `A student submitted this code for a coding problem and some test cases failed. Provide a helpful hint (not the solution) to guide them.
Problem: ${question.title}
Description: ${question.prompt}
Student's Code:
${userAnswer}
Failed Test Cases:
${failedTestsStr}
Provide a specific hint about what might be wrong with their approach. Don't give the solution, just point them in the right direction.`;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_EVALUATION_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful coding tutor. Analyze failed test cases and provide specific hints without giving away the solution.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });
        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating hint for wrong answer:', error);
        return 'Review the test cases that failed. Check if your code handles edge cases correctly.';
    }
}
export async function getQuestionHints(questionId, level = null) {
    try {
        const where = level ? { question_id: questionId, hint_level: level } : { question_id: questionId };
        const hints = await prisma.question_hints.findMany({
            where,
            orderBy: { hint_level: 'asc' }
        });
        return hints.map(h => ({
            id: h.id,
            text: h.hint_text,
            level: h.hint_level
        }));
    } catch (error) {
        console.error('Error getting question hints:', error);
        throw error;
    }
}
export async function saveHintsToDatabase(questionId, hints) {
    try {
        const hintsData = hints.map((hint, index) => ({
            question_id: questionId,
            hint_text: hint,
            hint_level: index + 1
        }));
        await prisma.question_hints.createMany({
            data: hintsData
        });
        return { success: true, count: hints.length };
    } catch (error) {
        console.error('Error saving hints:', error);
        throw error;
    }
}