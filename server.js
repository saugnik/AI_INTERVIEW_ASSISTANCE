import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { evaluateCode } from './evaluator.js';
import { generateHintsForQuestion, saveHintsToDatabase } from './services/hintService.js';
import { updateStudentRanking, getLeaderboard, getStudentRank } from './services/rankingService.js';
import { awardXP, getStudentLevel } from './services/levelingService.js';
import { requestVideoExplanation, getVideoExplanation } from './services/videoExplanationService.js';
dotenv.config();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = new Set([
  'https://ai-interview-app.vercel.app',
  'https://ai-interview-app-git-main-saugniks-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
]);
const GROQ_GENERATION_KEY = process.env.GROQ_GENERATION_KEY || process.env.GROQ_API_KEY;
const GROQ_EVALUATION_KEY = process.env.GROQ_EVALUATION_KEY || process.env.GROQ_API_KEY;
const prisma = new PrismaClient();
const questions = [
  {
    id: 'two-sum-0001',
    title: 'Two Sum',
    prompt:
      'Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Exactly one valid solution exists',
      'Time complexity should be O(n)',
    ],
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' },
    ],
    tests: [
      { stdin: '4\n2 7 11 15\n9\n', stdout: '0 1\n' },
      { stdin: '3\n3 2 4\n6\n', stdout: '1 2\n' },
      { stdin: '2\n3 3\n6\n', stdout: '0 1\n' },
    ],
  },
];
function setCors(req, res) {
  const origin = req.headers && req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-email, x-user-role');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}
function parseCookies(req) {
  const cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.split('=');
      const value = rest.join('=').trim();
      if (name) {
        cookies[name.trim()] = decodeURIComponent(value);
      }
    });
  }
  return cookies;
}
export const server = http.createServer(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  const fullUrl = `http://localhost:${req.socket.localPort}`
  const { pathname } = new URL(req.url || '/', fullUrl);
  if (pathname === '/api/questions' && req.method === 'GET') {
    try {
      const dbQuestions = await prisma.questions.findMany({
        select: {
          id: true,
          title: true,
          prompt: true,
          examples: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      const payload = dbQuestions && dbQuestions.length ? dbQuestions : questions.map(q => ({
        id: q.id,
        title: q.title,
        prompt: q.prompt,
        examples: q.examples,
      }));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(payload));
    } catch (err) {
      console.error('GET /api/questions error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch questions' }));
    }
    return;
  }
  if (pathname.startsWith('/api/questions/') && req.method === 'GET') {
    const id = pathname.replace('/api/questions/', '');
    try {
      const question = await prisma.questions.findUnique({
        where: { id },
        select: {
          id: true,
          domain: true,
          difficulty: true,
          type: true,
          title: true,
          prompt: true,
          constraints: true,
          examples: true,
          referenceSolution: true,
          starterCode: true,
          createdAt: true,
        },
      });
      if (question) {
        const tests = await prisma.testCase.findMany({
          where: { questionId: id },
          orderBy: { orderIndex: 'asc' },
          select: { id: true, stdin: true, stdout: true, orderIndex: true },
        });
        question.tests = tests;
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(question));
        return;
      }
      const fallback = questions.find((q) => q.id === id);
      if (fallback) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(fallback));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Question not found' }));
    } catch (err) {
      console.error('GET /api/questions/:id error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch question' }));
    }
    return;
  }
  if (pathname === '/api/questions/generate' && (req.method === 'GET' || req.method === 'POST')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(questions[0]));
    return;
  }
  if (pathname === '/api/questions/random' && req.method === 'GET') {
    try {
      const count = await prisma.questions.count();
      if (count > 0) {
        const randomIndex = Math.floor(Math.random() * count);
        const randomQuestion = await prisma.questions.findMany({
          skip: randomIndex,
          take: 1,
          select: {
            id: true,
            domain: true,
            difficulty: true,
            type: true,
            title: true,
            prompt: true,
            constraints: true,
            examples: true,
            referenceSolution: true,
            starterCode: true,
          },
        });
        if (randomQuestion[0]) {
          const tests = await prisma.testCase.findMany({
            where: { questionId: randomQuestion[0].id },
            orderBy: { orderIndex: 'asc' },
            select: { id: true, stdin: true, stdout: true, orderIndex: true },
          });
          randomQuestion[0].tests = tests;
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(randomQuestion[0]));
          return;
        }
      }
      const randomFallback = questions[Math.floor(Math.random() * questions.length)];
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(randomFallback));
    } catch (err) {
      console.error('GET /api/questions/random error:', err);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(questions[0]));
    }
    return;
  }
  if (pathname === '/api/auth/save-user' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { email, name, google_id, role } = JSON.parse(body);
        if (!email || !role) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            error: 'Email and role are required'
          }));
          return;
        }
        const existingUser = await prisma.auth_users.findUnique({
          where: { email }
        });
        if (existingUser) {
          if (existingUser.role !== role) {
            console.log(`❌ Role mismatch for ${email}: existing = ${existingUser.role}, requested = ${role} `);
            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: false,
              error: 'ROLE_MISMATCH',
              message: `This account is registered as ${existingUser.role}. You cannot login as ${role}.`,
              existingRole: existingUser.role,
              requestedRole: role
            }));
            return;
          }
          const updated = await prisma.auth_users.update({
            where: { email },
            data: {
              name: name || existingUser.name,
              google_id: google_id || existingUser.google_id,
              last_login_at: new Date()
            }
          });
          console.log(`✅ Updated user: ${email} (${role})`);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            user: updated,
            isNewUser: false
          }));
        } else {
          const newUser = await prisma.auth_users.create({
            data: {
              email,
              name,
              google_id,
              role,
              auth_provider: 'google',
              created_at: new Date(),
              last_login_at: new Date()
            }
          });
          console.log(`✅ Created new user: ${email} (${role})`);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            user: newUser,
            isNewUser: true
          }));
        }
      } catch (error) {
        console.error('❌ Error saving user:', error);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: 'Database error',
          details: error.message
        }));
      }
    });
    return;
  }
  if (pathname === '/api/generate' && req.method === 'POST') {
    if (!GROQ_GENERATION_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Server missing GROQ_GENERATION_KEY' }));
      return;
    }
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const { domain = 'DSA', difficulty = 'MEDIUM', type = 'CODING' } = payload;
        let prompt = '';
        if (type === 'Theory') {
          prompt = `Generate a ${difficulty} level THEORY question for "${domain}".This is CONCEPTUAL, not coding.
Return ONLY valid JSON:
{ "title": "Question", "description": "Theoretical question to answer", "constraints": ["200-300 words"], "examples": [{ "input": "Approach", "output": "Key points", "explanation": "Why" }], "starterCode": "", "testCases": [], "hints": ["Hint 1", "Hint 2"] } `;
        } else if (type === 'System Design') {
          prompt = `Generate a ${difficulty} level SYSTEM DESIGN question for "${domain}".This is ARCHITECTURE, not coding.
Return ONLY valid JSON:
{ "title": "Design X", "description": "System to design", "constraints": ["Scale: 100M users"], "examples": [{ "input": "Scenario", "output": "Components", "explanation": "Why" }], "starterCode": "", "testCases": [], "hints": ["Scalability", "Caching"] } `;
        } else {
          prompt = `Generate a ${difficulty} level CODING question for "${domain}".This requires writing executable JavaScript code.
  CRITICAL: You MUST include at least 3 test cases with actual input values and expected outputs.
Return ONLY valid JSON in this EXACT format:
{
  "title": "Problem Name",
    "description": "Clear problem description with requirements",
      "constraints": ["Time: O(n)", "Space: O(1)", "Input range: 1-1000"],
        "examples": [
          { "input": "[1,2,3]", "output": "[3,2,1]", "explanation": "Array is reversed" },
          { "input": "[5]", "output": "[5]", "explanation": "Single element stays same" }
        ],
          "starterCode": "function solution(arr) {\\n
  "testCases": [
    { "input": "[1,2,3]", "expected": "[3,2,1]" },
    { "input": "[5]", "expected": "[5]" },
    { "input": "[]", "expected": "[]" }
  ],
    "hints": ["Think about array methods", "Consider edge cases"]
}
The testCases array is MANDATORY and must have at least 3 test cases with valid JavaScript values.`;
        }
        const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_GENERATION_KEY} `
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are an expert technical interviewer.Generate high - quality ${type} interview questions.Always respond with valid JSON only, no markdown formatting.Generate UNIQUE and CREATIVE questions - avoid repeating common problems.Request ID: ${Date.now()} `
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 1.1,
            max_tokens: 2048
          })
        });
        const apiData = await apiResponse.json();
        console.log('🤖 Groq API Response:', JSON.stringify(apiData, null, 2));
        if (!apiResponse.ok) {
          throw new Error(`Groq API error: ${apiData.error?.message || 'Unknown error'} `);
        }
        let text = apiData.choices?.[0]?.message?.content || '{}';
        const jsonMatch = text.match(/```(?: json) ?\s * (\{ [\s\S] *?\ }) \s * ```/);
        if (jsonMatch) {
          text = jsonMatch[1];
        } else if (text.includes('{')) {
          const start = text.indexOf('{');
          const end = text.lastIndexOf('}') + 1;
          text = text.substring(start, end);
        }
        const parsedData = JSON.parse(text);
        console.log('✅ Parsed AI response:', JSON.stringify(parsedData, null, 2));
        try {
          console.log('💾 Checking for duplicates and saving question...');
          const existingQuestion = await prisma.questions.findFirst({
            where: {
              title: parsedData.title
            }
          });
          if (existingQuestion) {
            console.log(`⚠️ Duplicate question detected: "${parsedData.title}" already exists(ID: ${existingQuestion.id})`);
            console.log('📋 Skipping database save, returning existing question');
            parsedData.id = existingQuestion.id;
            parsedData.source = 'ai';
            parsedData.isDuplicate = true;
          } else {
            const questionId = crypto.randomUUID();
            await prisma.questions.create({
              data: {
                id: questionId,
                domain,
                difficulty,
                type,
                title: parsedData.title,
                prompt: parsedData.description,
                constraints: JSON.stringify(parsedData.constraints || []),
                examples: JSON.stringify(parsedData.examples || []),
                reference_solution: parsedData.solution || '',
                starter_code: parsedData.starterCode || '',
                source: 'ai'
              }
            });
            if (parsedData.testCases && parsedData.testCases.length > 0) {
              await prisma.test_cases.createMany({
                data: parsedData.testCases.map((tc, i) => ({
                  id: crypto.randomUUID(),
                  question_id: questionId,
                  stdin: tc.input || '',
                  stdout: tc.expected || '',
                  order_index: i
                }))
              });
              console.log(`✅ Saved ${parsedData.testCases.length} test cases`);
            }
            const hints = await generateHintsForQuestion(parsedData.title, parsedData.description);
            await saveHintsToDatabase(questionId, hints);
            console.log(`✅ Saved ${hints.length} AI - generated hints`);
            console.log(`✅ New question saved with ID: ${questionId} `);
            parsedData.id = questionId;
            parsedData.source = 'ai';
            parsedData.isDuplicate = false;
          }
        } catch (saveError) {
          console.error('⚠️ Error saving to database:', saveError);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(parsedData));
      } catch (err) {
        console.error('❌ Error in /api/generate:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: (err && err.message) || String(err) }));
      }
    });
    return;
  }
  if (pathname === '/api/evaluate' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const { question = {}, userAnswer = '', testCases = [] } = payload;
        console.log('🧪 Evaluating code submission...');
        console.log('Question:', question.title);
        console.log('Test cases:', testCases.length);
        let passedTests = 0;
        let totalTests = testCases.length || 0;
        const testResults = [];
        if (totalTests > 0) {
          const evalResults = evaluateCode(userAnswer, testCases);
          passedTests = evalResults.passedTests;
          testResults.push(...evalResults.testResults);
        }
        const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        let feedback = '';
        let strengths = [];
        let improvements = [];
        if (score === 100) {
          feedback = "Excellent! Your solution passes all test cases. The code is correct and handles all scenarios properly.";
          strengths = [
            "Passes all test cases",
            "Correct implementation",
            "Handles all edge cases"
          ];
        } else if (score >= 70) {
          feedback = "Good effort! Your solution passes most test cases but needs some adjustments.";
          strengths = [
            `Passes ${passedTests} out of ${totalTests} test cases`,
            "Shows understanding of the problem"
          ];
          improvements = [
            "Review the failing test cases",
            "Check edge cases handling",
            "Verify output format matches expected"
          ];
        } else if (score > 0) {
          feedback = "Your solution needs significant improvements. Please review the test cases and try again.";
          strengths = [
            `Passes ${passedTests} out of ${totalTests} test cases`
          ];
          improvements = [
            "Review the problem requirements carefully",
            "Test your code with the provided examples",
            "Check your logic for correctness"
          ];
        } else {
          feedback = "Your solution doesn't pass any test cases. Please review the problem and try a different approach.";
          improvements = [
            "Review the problem statement",
            "Start with the basic examples",
            "Test your code before submitting"
          ];
        }
        let referenceSolution = null;
        let complexityAnalysis = null;
        if (score < 100 && GROQ_EVALUATION_KEY) {
          try {
            const solutionPrompt = `Generate an optimal solution for this coding problem:
  Problem: ${question.title || 'Coding Problem'}
Description: ${question.description || question.prompt || 'No description'}
Requirements:
- Provide a clean, well - commented JavaScript solution
  - Include time and space complexity analysis
    - Make it beginner - friendly with explanations
Return ONLY valid JSON:
{
  "solution": "function name(params) {\\n
  "explanation": "Brief explanation of the approach",
    "timeComplexity": "O(n)",
      "spaceComplexity": "O(1)"
} `;
            const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
            const apiResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_EVALUATION_KEY} `
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert coding instructor. Provide clear, optimal solutions with explanations.'
                  },
                  {
                    role: 'user',
                    content: solutionPrompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 1024,
                response_format: { type: 'json_object' }
              })
            });
            if (apiResponse.ok) {
              const apiData = await apiResponse.json();
              const solutionData = JSON.parse(apiData.choices?.[0]?.message?.content || '{}');
              referenceSolution = solutionData.solution || null;
              complexityAnalysis = `Time: ${solutionData.timeComplexity || 'N/A'}, Space: ${solutionData.spaceComplexity || 'N/A'} `;
              if (solutionData.explanation) {
                improvements.unshift(`Optimal approach: ${solutionData.explanation} `);
              }
            }
          } catch (error) {
            console.error('Error generating reference solution:', error);
          }
        }
        const evaluation = {
          score,
          feedback,
          strengths,
          improvements,
          testResults,
          passedTests,
          totalTests,
          referenceSolution,
          complexityAnalysis
        };
        console.log('✅ Evaluation complete:', { score, passedTests, totalTests });
        const attemptId = crypto.randomUUID();
        try {
          const studentEmail = req.headers['x-user-email'];
          const questionId = question.id || payload.questionId;
          console.log('🔍 DEBUG - Attempting to save:');
          console.log('   Student Email:', studentEmail);
          console.log('   Question ID:', questionId);
          console.log('   Score:', score);
          if (!studentEmail) {
            console.error('❌ ERROR: No student email in headers!');
            console.error('   Headers:', req.headers);
          }
          if (!questionId) {
            console.error('❌ ERROR: No question ID!');
            console.error('   question.id:', question.id);
            console.error('   payload.questionId:', payload.questionId);
          }
          if (studentEmail && questionId) {
            console.log('💾 Saving attempt and updating rankings...');
            const questionExists = await prisma.questions.findUnique({
              where: { id: questionId },
              select: { id: true, title: true }
            });
            if (!questionExists) {
              console.error(`❌ ERROR: Question ID ${questionId} does not exist in database!`);
              console.error('   Cannot save attempt - foreign key constraint would fail');
              console.error('   Skipping database save but returning evaluation result');
              console.warn(`⚠️ Generated attemptId ${attemptId} for response(not saved to DB)`);
            } else {
              console.log(`✅ Question verified: ${questionExists.title} `);
              await prisma.attempts.create({
                data: {
                  id: attemptId,
                  student_email: studentEmail,
                  question_id: questionId,
                  submission: userAnswer,
                  score: score / 100,
                  feedback: JSON.stringify(evaluation)
                }
              });
              console.log(`✅ Attempt saved with ID: ${attemptId} `);
              const rankingResult = await updateStudentRanking(studentEmail, score);
              console.log(`✅ Rankings updated: ${rankingResult.newTotalScore} total score, ${rankingResult.newQuestionsSolved} solved`);
              const xpResult = await awardXP(studentEmail, score);
              evaluation.xpAwarded = xpResult.xpAwarded;
              evaluation.totalXP = xpResult.totalXP;
              evaluation.currentLevel = xpResult.currentLevel;
              evaluation.leveledUp = xpResult.leveledUp;
              if (xpResult.newBadges.length > 0) {
                evaluation.newBadges = xpResult.newBadges;
              }
              console.log(`✅ XP awarded: ${xpResult.xpAwarded} (Total: ${xpResult.totalXP}, Level: ${xpResult.currentLevel})`);
              if (score >= 70) {
                await prisma.solved_questions.upsert({
                  where: {
                    student_email_question_id: {
                      student_email: studentEmail,
                      question_id: questionId
                    }
                  },
                  update: {
                    score,
                    attempts: { increment: 1 }
                  },
                  create: {
                    id: crypto.randomUUID(),
                    student_email: studentEmail,
                    question_id: questionId,
                    score,
                    attempts: 1
                  }
                });
                console.log(`✅ Question marked as solved`);
                evaluation.questionSolved = true;
                try {
                  const assignment = await prisma.question_assignments.findFirst({
                    where: {
                      student_email: studentEmail,
                      question_id: questionId,
                      completed: false
                    }
                  });
                  if (assignment) {
                    await prisma.question_assignments.update({
                      where: { id: assignment.id },
                      data: {
                        completed: true,
                        completed_at: new Date()
                      }
                    });
                    console.log(`✅ Assignment marked as completed`);
                    evaluation.assignmentCompleted = true;
                  }
                } catch (assignmentError) {
                  console.error('⚠️ Error updating assignment:', assignmentError);
                }
              }
              if (score < 70 && testResults.length > 0) {
                const failedTests = testResults.filter(t => !t.passed);
                if (failedTests.length > 0) {
                  const { generateHintForWrongAnswer } = await import('./services/hintService.js');
                  const hint = await generateHintForWrongAnswer(question, userAnswer, failedTests);
                  evaluation.hint = hint;
                  console.log(`✅ Generated hint for wrong answer`);
                }
              }
            }
            evaluation.attemptId = attemptId;
            console.log(`✅ Added attemptId to response: ${attemptId} `);
          }
        } catch (saveError) {
          console.error('⚠️ Error saving attempt/updating rankings:', saveError);
        }
        evaluation.attemptId = attemptId;
        console.log(`✅ Added attemptId to response: ${attemptId} `);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(evaluation));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: (err && err.message) || String(err) }));
      }
    });
    return;
  }
  if (pathname === '/api/log-security-violation' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const { type, timestamp, questionId, attemptId } = payload;
        const studentEmail = req.headers['x-user-email'];
        if (!studentEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Student email required' }));
          return;
        }
        console.log(`🚨 Security violation logged: ${type} by ${studentEmail} `);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          message: 'Violation logged',
          type,
          timestamp
        }));
      } catch (err) {
        console.error('Error logging security violation:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Failed to log violation' }));
      }
    });
    return;
  }
  if (pathname.startsWith('/api/student/video-explanation/') && req.method === 'GET') {
    try {
      const attemptId = pathname.replace('/api/student/video-explanation/', '');
      const studentEmail = req.headers['x-user-email'];
      console.log(`🎬 Video explanation requested for attempt: ${attemptId} by ${studentEmail} `);
      if (!studentEmail) {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const existing = await getVideoExplanation(attemptId);
      if (existing) {
        console.log(`✅ Video explanation already exists for attempt ${attemptId}`);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          videoUrl: existing.video_url,
          audioUrl: JSON.parse(existing.video_provider_id || '{}').audioUrl,
          status: existing.status,
          explanationText: existing.explanation_text
        }));
        return;
      }
      const attempt = await prisma.attempts.findUnique({
        where: { id: attemptId },
        include: {
          questions: true
        }
      });
      if (!attempt) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Attempt not found' }));
        return;
      }
      const feedback = JSON.parse(attempt.feedback || '{}');
      const testResults = feedback.testResults || [];
      console.log(`🎬 Generating new video explanation for attempt ${attemptId}...`);
      const result = await requestVideoExplanation(
        attemptId,
        attempt.question_id,
        studentEmail,
        attempt.questions,
        attempt.submission,
        testResults
      );
      if (result.success) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          videoUrl: result.videoUrl,
          audioUrl: result.audioUrl,
          duration: result.duration,
          status: 'completed',
          message: 'Video explanation ready!'
        }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: result.error || 'Failed to generate video explanation'
        }));
      }
    } catch (err) {
      console.error('❌ Error in video explanation endpoint:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message || 'Failed to generate video explanation' }));
    }
    return;
  }
  if (pathname === '/api/student/request-video-explanation' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { attemptId, questionId, question, userAnswer, testResults } = payload;
        const studentEmail = req.headers['x-user-email'];
        console.log(`🎬 Video explanation requested(direct data) for attempt: ${attemptId} `);
        if (!studentEmail) {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }
        if (!question || !userAnswer) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Missing question or userAnswer' }));
          return;
        }
        try {
          const existing = await getVideoExplanation(attemptId);
          if (existing) {
            console.log(`✅ Video explanation already exists for attempt ${attemptId}`);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: true,
              videoUrl: existing.video_url,
              audioUrl: JSON.parse(existing.video_provider_id || '{}').audioUrl,
              status: existing.status,
              explanationText: existing.explanation_text
            }));
            return;
          }
        } catch (dbError) {
          console.warn('⚠️ Database check failed, proceeding without DB:', dbError.message);
        }
        console.log(`🎬 Generating new video explanation for attempt ${attemptId}...`);
        const result = await requestVideoExplanation(
          attemptId,
          questionId || question.id,
          studentEmail,
          question,
          userAnswer,
          testResults || []
        );
        if (result.success) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            videoUrl: result.videoUrl,
            audioUrl: result.audioUrl,
            duration: result.duration,
            status: 'completed',
            message: 'Video explanation ready!'
          }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            error: result.error || 'Failed to generate video explanation'
          }));
        }
      } catch (err) {
        console.error('❌ Error in video explanation POST endpoint:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          error: err.message || 'Failed to generate video explanation',
          details: err.stack
        }));
      }
    });
    return;
  }
  if (pathname.startsWith('/api/student/video-explanation/') && req.method === 'GET') {
    try {
      const attemptId = pathname.replace('/api/student/video-explanation/', '');
      const studentEmail = req.headers['x-user-email'];
      console.log(`🎬 Video explanation requested for attempt: ${attemptId} by ${studentEmail} `);
      if (!studentEmail) {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      const existing = await getVideoExplanation(attemptId);
      if (existing) {
        console.log(`✅ Video explanation already exists for attempt ${attemptId}`);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          videoUrl: existing.video_url,
          audioUrl: JSON.parse(existing.video_provider_id || '{}').audioUrl,
          status: existing.status,
          explanationText: existing.explanation_text
        }));
        return;
      }
      const attempt = await prisma.attempts.findUnique({
        where: { id: attemptId },
        include: {
          questions: true
        }
      });
      if (!attempt) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Attempt not found' }));
        return;
      }
      const feedback = JSON.parse(attempt.feedback || '{}');
      const testResults = feedback.testResults || [];
      console.log(`🎬 Generating new video explanation for attempt ${attemptId}...`);
      const result = await requestVideoExplanation(
        attemptId,
        attempt.question_id,
        studentEmail,
        attempt.questions,
        attempt.submission,
        testResults
      );
      if (result.success) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          videoUrl: result.videoUrl,
          audioUrl: result.audioUrl,
          duration: result.duration,
          status: 'completed',
          message: 'Video explanation ready!'
        }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: result.error || 'Failed to generate video explanation'
        }));
      }
    } catch (err) {
      console.error('❌ Error in video explanation endpoint:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message || 'Failed to generate video explanation' }));
    }
    return;
  }
  if (pathname === '/api/rankings' && req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://localhost:3001`);
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const leaderboard = await getLeaderboard(limit);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ leaderboard }));
    } catch (err) {
      console.error('Error getting leaderboard:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch leaderboard' }));
    }
    return;
  }
  if (pathname.startsWith('/api/rankings/') && req.method === 'GET') {
    try {
      const email = decodeURIComponent(pathname.replace('/api/rankings/', ''));
      const rankData = await getStudentRank(email);
      if (!rankData) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Student not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(rankData));
    } catch (err) {
      console.error('Error getting student rank:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch student rank' }));
    }
    return;
  }
  if (pathname.startsWith('/api/student/progress/') && req.method === 'GET') {
    try {
      const email = decodeURIComponent(pathname.replace('/api/student/progress/', ''));
      const levelData = await getStudentLevel(email);
      const rankData = await getStudentRank(email);
      const solvedQuestions = await prisma.solved_questions.findMany({
        where: { student_email: email },
        include: {
          question: {
            select: {
              title: true,
              difficulty: true,
              domain: true
            }
          }
        },
        orderBy: { solved_at: 'desc' },
        take: 20
      });
      const recentAttempts = await prisma.attempts.findMany({
        where: { student_email: email },
        include: {
          question: {
            select: {
              title: true,
              difficulty: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 10
      });
      const progress = {
        email,
        level: levelData?.currentLevel || 1,
        xp: levelData?.xpPoints || 0,
        nextLevelXP: levelData?.nextLevelXP || 100,
        progressToNextLevel: levelData?.progressToNextLevel || 0,
        badges: levelData?.badges || [],
        rank: rankData?.rank || null,
        totalStudents: rankData?.totalStudents || 0,
        totalScore: rankData?.totalScore || 0,
        questionsSolved: rankData?.questionsSolved || 0,
        avgScore: rankData?.avgScore || 0,
        solvedQuestions: solvedQuestions.map(sq => ({
          title: sq.question.title,
          difficulty: sq.question.difficulty,
          domain: sq.question.domain,
          score: sq.score,
          solvedAt: sq.solved_at,
          attempts: sq.attempts
        })),
        recentActivity: recentAttempts.map(a => ({
          questionTitle: a.question.title,
          difficulty: a.question.difficulty,
          score: Math.round(parseFloat(a.score) * 100),
          date: a.created_at
        }))
      };
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(progress));
    } catch (err) {
      console.error('Error getting student progress:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch student progress' }));
    }
    return;
  }
  if (pathname === '/api/student/assigned-questions' && req.method === 'GET') {
    try {
      const studentEmail = req.headers['x-user-email'];
      if (!studentEmail) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Student email required' }));
        return;
      }
      console.log(`📚 Fetching assigned questions for ${studentEmail}`);
      const assignments = await prisma.question_assignments.findMany({
        where: {
          student_email: studentEmail
        },
        include: {
          question: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              domain: true,
              prompt: true,
              type: true,
              constraints: true,
              examples: true,
              test_cases: {
                select: {
                  id: true,
                  stdin: true,
                  stdout: true,
                  order_index: true
                },
                orderBy: {
                  order_index: 'asc'
                }
              }
            }
          }
        },
        orderBy: {
          assigned_at: 'desc'
        }
      });
      console.log(`✅ Found ${assignments.length} assignments`);
      const aiPractice = [];
      const adminPractice = [];
      const testQuestions = [];
      assignments.forEach(assignment => {
        let constraints = assignment.question.constraints;
        let examples = assignment.question.examples;
        if (typeof constraints === 'string') {
          try {
            constraints = JSON.parse(constraints);
          } catch (e) {
            constraints = [];
          }
        }
        if (typeof examples === 'string') {
          try {
            examples = JSON.parse(examples);
          } catch (e) {
            examples = [];
          }
        }
        const testCases = (assignment.question.test_cases || []).map(tc => ({
          input: tc.stdin,
          expected: tc.stdout,
          expectedOutput: tc.stdout
        }));
        const questionData = {
          id: assignment.question.id,
          title: assignment.question.title,
          difficulty: assignment.question.difficulty,
          domain: assignment.question.domain,
          prompt: assignment.question.prompt,
          description: assignment.question.prompt,
          type: assignment.question.type,
          constraints: constraints || [],
          examples: examples || [],
          testCases: testCases,
          assignmentId: assignment.id,
          assignedAt: assignment.assigned_at,
          dueDate: assignment.due_date,
          completed: assignment.completed,
          completedAt: assignment.completed_at
        };
        if (assignment.assignment_type === 'test') {
          testQuestions.push(questionData);
        } else if (assignment.source === 'ai') {
          aiPractice.push(questionData);
        } else {
          adminPractice.push(questionData);
        }
      });
      const response = {
        assignments: {
          aiPractice,
          adminPractice,
          test: testQuestions
        },
        total: assignments.length
      };
      console.log(`📊 Grouped: ${adminPractice.length} admin, ${aiPractice.length} AI, ${testQuestions.length} tests`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(response));
    } catch (err) {
      console.error('❌ Error fetching assigned questions:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch assigned questions', details: err.message }));
    }
    return;
  }
  if (pathname === '/api/student/my-progress' && req.method === 'GET') {
    try {
      const studentEmail = req.headers['x-user-email'];
      if (!studentEmail) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Student email required' }));
        return;
      }
      console.log(`📊 Fetching progress for ${studentEmail}`);
      const allAssignments = await prisma.question_assignments.findMany({
        where: { student_email: studentEmail }
      });
      const total = allAssignments.length;
      const completed = allAssignments.filter(a => a.completed).length;
      const pending = total - completed;
      const now = new Date();
      const overdue = allAssignments.filter(a =>
        !a.completed && a.due_date && new Date(a.due_date) < now
      ).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      const solvedQuestions = await prisma.solved_questions.findMany({
        where: { student_email: studentEmail }
      });
      const questionsSolved = solvedQuestions.length;
      const averageScore = questionsSolved > 0
        ? Math.round(solvedQuestions.reduce((sum, q) => sum + q.score, 0) / questionsSolved)
        : 0;
      const levelData = await prisma.student_levels.findUnique({
        where: { student_email: studentEmail }
      });
      const rankingData = await prisma.student_rankings.findUnique({
        where: { student_email: studentEmail }
      });
      const response = {
        email: studentEmail,
        total,
        completed,
        pending,
        overdue,
        progress,
        questionsSolved,
        averageScore,
        totalScore: rankingData?.total_score || 0,
        xp: levelData?.xp_points || 0,
        level: levelData?.current_level || 1,
        nextLevelXP: levelData?.next_level_xp || 100,
        progressToNextLevel: levelData?.progress_to_next_level || 0,
        badges: levelData?.badges ? JSON.parse(levelData.badges) : [],
        rank: rankingData?.rank || null,
        totalStudents: rankingData?.total_students || 0,
        avgScore: averageScore,
        solvedQuestions: solvedQuestions.map(sq => ({
          title: sq.question?.title || 'Unknown',
          difficulty: sq.question?.difficulty || 'MEDIUM',
          domain: sq.question?.domain || 'General',
          score: sq.score,
          solvedAt: sq.solved_at,
          attempts: sq.attempts
        })),
        recentActivity: []
      };
      console.log(`✅ Progress: ${completed}/${total} assignments, ${questionsSolved} solved`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(response));
    } catch (err) {
      console.error('❌ Error fetching progress:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch progress', details: err.message }));
    }
    return;
  }
  if (pathname === '/api/student/generate-ai-question' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const studentEmail = req.headers['x-user-email'];
        if (!studentEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Student email required' }));
          return;
        }
        const payload = body ? JSON.parse(body) : {};
        const { domain = 'Data Structures & Algorithms', difficulty = 'Medium', type = 'Coding' } = payload;
        console.log(`🤖 Generating AI question for ${studentEmail}: ${difficulty} ${type} in ${domain}`);
        const generateResponse = await fetch(`http://localhost:3001/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ domain, difficulty, type })
        });
        if (!generateResponse.ok) {
          throw new Error('Failed to generate question');
        }
        const generatedQuestion = await generateResponse.json();
        console.log(`✅ Generated question: ${generatedQuestion.title} (ID: ${generatedQuestion.id})`);
        const assignmentId = crypto.randomUUID();
        await prisma.question_assignments.create({
          data: {
            id: assignmentId,
            question_id: generatedQuestion.id,
            student_email: studentEmail,
            assigned_by: 'AI System',
            assignment_type: 'practice',
            source: 'ai',
            due_date: null
          }
        });
        console.log(`✅ Assigned AI question to ${studentEmail} (Assignment ID: ${assignmentId})`);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          question: generatedQuestion,
          assignmentId
        }));
      } catch (err) {
        console.error('❌ Error generating AI question:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Failed to generate AI question', details: err.message }));
      }
    });
    return;
  }
  if (pathname === '/api/admin/suggested-questions' && req.method === 'GET') {
    try {
      const user = {
        email: req.headers['x-user-email'],
        role: req.headers['x-user-role'] || 'student'
      };
      if (user.role !== 'admin') {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Admin access required' }));
        return;
      }
      const aiQuestions = await prisma.questions.findMany({
        where: { source: 'ai' },
        include: {
          test_cases: true,
          hints: true,
          _count: {
            select: {
              question_assignments: true,
              attempts: true,
              solved_questions: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 50
      });
      const suggestions = aiQuestions.map(q => ({
        id: q.id,
        title: q.title,
        domain: q.domain,
        difficulty: q.difficulty,
        type: q.type,
        createdAt: q.created_at,
        testCasesCount: q.test_cases.length,
        hintsCount: q.hints.length,
        assignedTo: q._count.question_assignments,
        attemptCount: q._count.attempts,
        solvedBy: q._count.solved_questions
      }));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ suggestions }));
    } catch (err) {
      console.error('Error getting suggested questions:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch suggested questions' }));
    }
    return;
  }
  if (pathname.startsWith('/api/hints/') && req.method === 'GET') {
    try {
      const questionId = pathname.replace('/api/hints/', '');
      const url = new URL(req.url, `http://localhost:3001`);//localhost:3001`);
      const level = url.searchParams.get('level');
      const { getQuestionHints } = await import('./services/hintService.js');
      const hints = await getQuestionHints(questionId, level ? parseInt(level) : null);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ hints }));
    } catch (err) {
      console.error('Error getting hints:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch hints' }));
    }
    return;
  }
  if (pathname === '/api/attempts' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const { userId, questionId, language, submission, score, feedback } = payload;
        if (!userId || !questionId || !submission) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Missing required fields: userId, questionId, submission' }));
          return;
        }
        const attempt = await prisma.attempt.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            questionId,
            language: language || 'javascript',
            submission,
            score: score ? parseFloat(score) / 100 : null,
            feedback: feedback || null
          },
          include: {
            questions: {
              select: {
                title: true,
                difficulty: true,
                domain: true
              }
            }
          }
        });
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(attempt));
      } catch (err) {
        console.error('POST /api/attempts error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Failed to save attempt' }));
      }
    });
    return;
  }
  if (pathname.startsWith('/api/attempts/user/') && req.method === 'GET') {
    const userId = pathname.replace('/api/attempts/user/', '');
    try {
      const attempts = await prisma.attempt.findMany({
        where: { userId },
        include: {
          questions: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              domain: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(attempts));
    } catch (err) {
      console.error('GET /api/attempts/user/:userId error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch attempts' }));
    }
    return;
  }
  if (pathname.startsWith('/api/stats/user/') && req.method === 'GET') {
    const userId = pathname.replace('/api/stats/user/', '');
    try {
      const attempts = await prisma.attempt.findMany({
        where: { userId },
        select: {
          score: true,
          createdAt: true,
          questions: {
            select: {
              difficulty: true,
              domain: true
            }
          }
        }
      });
      const totalAttempts = attempts.length;
      const avgScore = totalAttempts > 0
        ? attempts.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0) / totalAttempts
        : 0;
      const solvedCount = attempts.filter(a => parseFloat(a.score) > 0.7).length;
      const today = new Date().toDateString();
      const hasToday = attempts.some(a => new Date(a.createdAt).toDateString() === today);
      const streak = hasToday ? Math.floor(Math.random() * 7) + 1 : 0;
      const domainStats = {};
      attempts.forEach(a => {
        const domain = a.questions.domain;
        if (!domainStats[domain]) {
          domainStats[domain] = { total: 0, solved: 0 };
        }
        domainStats[domain].total++;
        if (parseFloat(a.score) > 0.7) {
          domainStats[domain].solved++;
        }
      });
      const stats = {
        totalAttempts,
        avgScore: Math.round(avgScore * 100),
        solvedCount,
        streak,
        domainStats,
        recentActivity: attempts.slice(0, 5).map(a => ({
          questionTitle: a.questions.title,
          score: Math.round(parseFloat(a.score) * 100),
          date: a.createdAt,
          difficulty: a.questions.difficulty
        }))
      };
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(stats));
    } catch (err) {
      console.error('GET /api/stats/user/:userId error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch statistics' }));
    }
    return;
  }
  const getUserInfo = (req) => {
    return {
      email: req.headers['x-user-email'],
      role: req.headers['x-user-role'] || 'student'
    };
  };
  if (pathname === '/api/admin/questions' && req.method === 'GET') {
    const user = getUserInfo(req);
    if (user.role !== 'admin') {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Admin access required' }));
      return;
    }
    try {
      const questions = await prisma.questions.findMany({
        include: {
          test_cases: true,
          _count: {
            select: {
              attempts: true,
              question_assignments: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ questions }));
    } catch (err) {
      console.error('Error fetching admin questions:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch questions' }));
    }
    return;
  }
  if (pathname === '/api/admin/students' && req.method === 'GET') {
    const user = getUserInfo(req);
    if (user.role !== 'admin') {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Admin access required' }));
      return;
    }
    try {
      const students = await prisma.auth_users.findMany({
        where: { role: 'student' },
        select: {
          email: true,
          name: true,
          created_at: true,
          last_login_at: true
        }
      });
      const studentsWithProgress = await Promise.all(
        students.map(async (student) => {
          const assignments = await prisma.question_assignments.findMany({
            where: { student_email: student.email }
          });
          const completed = assignments.filter(a => a.completed).length;
          const total = assignments.length;
          return {
            ...student,
            assignedQuestions: total,
            completedQuestions: completed,
            progress: total > 0 ? Math.round((completed / total) * 100) : 0
          };
        })
      );
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ students: studentsWithProgress }));
    } catch (err) {
      console.error('Error fetching students:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch students' }));
    }
    return;
  }
  if (pathname === '/api/admin/assign-question' && req.method === 'POST') {
    const user = getUserInfo(req);
    if (user.role !== 'admin') {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Admin access required' }));
      return;
    }
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { questionId, studentEmail, dueDate } = JSON.parse(body);
        if (!questionId || !studentEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Question ID and student email required' }));
          return;
        }
        const assignment = await prisma.question_assignments.upsert({
          where: {
            question_id_student_email: {
              question_id: questionId,
              student_email: studentEmail
            }
          },
          update: {
            due_date: dueDate ? new Date(dueDate) : null,
            assigned_by: user.email
          },
          create: {
            question_id: questionId,
            student_email: studentEmail,
            assigned_by: user.email,
            due_date: dueDate ? new Date(dueDate) : null
          }
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, assignment }));
      } catch (err) {
        console.error('Error assigning question:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Failed to assign question' }));
      }
    });
    return;
  }
  if (pathname === '/api/student/assigned-questions' && req.method === 'GET') {
    const user = getUserInfo(req);
    if (!user.email) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    try {
      const assignments = await prisma.question_assignments.findMany({
        where: { student_email: user.email },
        include: {
          questions: {
            include: {
              test_cases: true
            }
          }
        },
        orderBy: { assigned_at: 'desc' }
      });
      const assignedQuestions = assignments.map(assignment => ({
        ...assignment.questions,
        assignmentId: assignment.id,
        assignedAt: assignment.assigned_at,
        dueDate: assignment.due_date,
        completed: assignment.completed,
        completedAt: assignment.completed_at
      }));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ questions: assignedQuestions }));
    } catch (err) {
      console.error('Error fetching assigned questions:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch assigned questions' }));
    }
    return;
  }
  if (pathname === '/api/student/my-progress' && req.method === 'GET') {
    const user = getUserInfo(req);
    if (!user.email) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    try {
      const assignments = await prisma.question_assignments.findMany({
        where: { student_email: user.email }
      });
      const total = assignments.length;
      const completed = assignments.filter(a => a.completed).length;
      const pending = total - completed;
      const now = new Date();
      const overdue = assignments.filter(a =>
        !a.completed && a.due_date && new Date(a.due_date) < now
      ).length;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        total,
        completed,
        pending,
        overdue,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0
      }));
    } catch (err) {
      console.error('Error fetching progress:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to fetch progress' }));
    }
    return;
  }
  if (pathname === '/api/student/generate-ai-question' && req.method === 'POST') {
    const user = getUserInfo(req);
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { domain, difficulty, type } = JSON.parse(body);
        if (!domain || !difficulty || !type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Domain, difficulty, and type are required' }));
          return;
        }
        const generateUrl = `http://localhost:3001/api/generate`;
        const generateResponse = await fetch(generateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain, difficulty, type })
        });
        if (!generateResponse.ok) {
          const errorText = await generateResponse.text();
          throw new Error(`Question generation failed: ${errorText}`);
        }
        const generatedData = await generateResponse.json();
        console.log('📝 Generated data from AI:', JSON.stringify(generatedData, null, 2));
        console.log('💾 Attempting to save question to database...');
        const questionData = {
          id: crypto.randomUUID(),
          domain,
          difficulty,
          type,
          title: generatedData.title || 'Untitled Question',
          prompt: generatedData.description || 'No description provided',
          constraints: generatedData.constraints || [],
          examples: generatedData.examples || generatedData.testCases || [],
          starter_code: generatedData.starterCode || '',
          reference_solution: generatedData.hints ? generatedData.hints.join('\n') : null
        };
        console.log('📊 Question data to insert:', JSON.stringify(questionData, null, 2));
        const question = await prisma.questions.create({
          data: questionData
        });
        console.log('✅ Question saved successfully! ID:', question.id);
        const assignment = await prisma.question_assignments.create({
          data: {
            question_id: question.id,
            student_email: user.email,
            assigned_by: 'AI System'
          }
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          question,
          assignment,
          message: 'AI question generated and assigned successfully!'
        }));
      } catch (error) {
        console.error('Error generating AI question:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate AI question: ' + error.message }));
      }
    });
    return;
  }
  if (pathname === '/api/admin/create-question' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const questionData = JSON.parse(body);
        console.log('📝 Admin creating question:', questionData.title);
        const question = await prisma.questions.create({
          data: {
            id: crypto.randomUUID(),
            domain: questionData.domain,
            difficulty: questionData.difficulty,
            type: questionData.type,
            title: questionData.title,
            prompt: questionData.description,
            constraints: questionData.constraints || [],
            examples: questionData.examples || [],
            starter_code: questionData.starterCode || '',
            reference_solution: questionData.hints ? questionData.hints.join('\n') : null
          }
        });
        console.log('✅ Question created successfully! ID:', question.id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          question,
          message: 'Question created successfully!'
        }));
      } catch (error) {
        console.error('Error creating question:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to create question: ' + error.message }));
      }
    });
    return;
  }
  if (pathname === '/api/admin/students' && req.method === 'GET') {
    try {
      console.log('📊 Admin fetching students list...');
      const users = await prisma.$queryRawUnsafe(`
        SELECT email, name, role, created_at
        FROM auth_users
        WHERE role = 'student'
        ORDER BY created_at DESC
      `);
      const studentsWithStats = await Promise.all(users.map(async (user) => {
        const assignments = await prisma.question_assignments.findMany({
          where: { student_email: user.email }
        });
        const completed = assignments.filter(a => a.completed).length;
        const total = assignments.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          email: user.email,
          name: user.name || user.email.split('@')[0],
          assignedQuestions: total,
          completedQuestions: completed,
          progress
        };
      }));
      console.log(`✅ Found ${studentsWithStats.length} students`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ students: studentsWithStats }));
    } catch (error) {
      console.error('Error fetching students:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch students: ' + error.message }));
    }
    return;
  }
  if (pathname === '/api/student/profile' && req.method === 'GET') {
    try {
      const userEmail = req.headers['x-user-email'];
      console.log('📊 Fetching student profile for:', userEmail);
      const assignments = await prisma.question_assignments.findMany({
        where: { student_email: userEmail },
        include: {
          questions: true
        },
        orderBy: { assigned_at: 'desc' }
      });
      const totalAssigned = assignments.length;
      const totalCompleted = assignments.filter(a => a.completed).length;
      const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      const recentAttempts = assignments
        .filter(a => a.completed && a.score !== null)
        .slice(0, 10)
        .map(a => ({
          questionTitle: a.questions.title,
          score: a.score || 0,
          completedAt: a.completed_at
        }));
      const scores = assignments.filter(a => a.score !== null).map(a => a.score || 0);
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        totalAssigned,
        totalCompleted,
        averageScore,
        completionRate,
        recentAttempts
      }));
    } catch (error) {
      console.error('Error fetching student profile:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch profile' }));
    }
    return;
  }
  if (pathname === '/api/admin/profile' && req.method === 'GET') {
    try {
      const userEmail = req.headers['x-user-email'];
      console.log('📊 Fetching admin profile for:', userEmail);
      const assignments = await prisma.question_assignments.findMany({
        include: {
          questions: true
        },
        orderBy: { assigned_at: 'desc' }
      });
      const totalAssignments = assignments.length;
      const uniqueStudents = new Set(assignments.map(a => a.student_email));
      const studentsManaged = uniqueStudents.size;
      const recentAssignments = assignments.slice(0, 20).map(a => ({
        questionTitle: a.questions.title,
        studentEmail: a.student_email,
        assignedAt: a.assigned_at,
        assignmentType: a.assignment_type
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        totalAssignments,
        studentsManaged,
        recentAssignments
      }));
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch profile' }));
    }
    return;
  }
  if (pathname === '/api/auth/save-user' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { email, name, google_id, role } = JSON.parse(body);
        console.log('💾 Saving user to database:', email, 'Role:', role);
        await prisma.$executeRawUnsafe(`
          INSERT INTO auth_users (email, name, google_id, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (email)
          DO UPDATE SET
            name = EXCLUDED.name,
            google_id = EXCLUDED.google_id,
            role = EXCLUDED.role,
            updated_at = NOW()
        `, email, name, google_id, role);
        console.log('✅ User saved successfully');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('Error saving user:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to save user' }));
      }
    });
    return;
  }
  if (pathname === '/api/student/assigned-questions' && req.method === 'GET') {
    try {
      const userEmail = req.headers['x-user-email'];
      console.log('📚 Fetching assigned questions for:', userEmail);
      const assignments = await prisma.question_assignments.findMany({
        where: { student_email: userEmail },
        include: {
          questions: true
        },
        orderBy: { assigned_at: 'desc' }
      });
      console.log(`✅ Found ${assignments.length} assignments`);
      const grouped = {
        aiPractice: assignments.filter(a => a.source === 'ai_generated'),
        adminPractice: assignments.filter(a => a.source === 'admin_assigned' && a.assignment_type === 'practice'),
        test: assignments.filter(a => a.assignment_type === 'test')
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ assignments: grouped }));
    } catch (error) {
      console.error('Error fetching assigned questions:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch assigned questions' }));
    }
    return;
  }
  if (pathname === '/api/admin/questions' && req.method === 'GET') {
    try {
      console.log('📚 Fetching all questions for admin...');
      const questions = await prisma.questions.findMany({
        include: {
          _count: {
            select: {
              attempts: true,
              question_assignments: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });
      console.log(`✅ Found ${questions.length} questions`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ questions }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch questions' }));
    }
    return;
  }
  if (pathname === '/api/auth/save-user' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { email, name, google_id, role } = JSON.parse(body);
        console.log('💾 Saving user to database:', email, 'Role:', role);
        await prisma.$executeRawUnsafe(`
          INSERT INTO auth_users (email, name, google_id, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (email)
          DO UPDATE SET
            name = EXCLUDED.name,
            google_id = EXCLUDED.google_id,
            role = EXCLUDED.role,
            updated_at = NOW()
        `, email, name, google_id, role);
        console.log('✅ User saved successfully');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('❌ Error saving user:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to save user: ' + error.message }));
      }
    });
    return;
  }
  if (pathname === '/api/student/request-video-explanation' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { attemptId, questionId } = JSON.parse(body);
        const cookies = parseCookies(req);
        const studentEmail = cookies.userEmail || req.headers['x-user-email'];
        if (!studentEmail) {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Authentication required' }));
          return;
        }
        if (!attemptId || !questionId) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'attemptId and questionId are required' }));
          return;
        }
        console.log(`📹 Video explanation requested for attempt ${attemptId} by ${studentEmail}`);
        const {
          requestVideoExplanation,
          getVideoExplanation
        } = await import('./services/videoExplanationService.js');
        const existing = await getVideoExplanation(attemptId);
        if (existing) {
          console.log(`✅ Video explanation already exists: ${existing.status}`);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            videoExplanation: existing,
            message: 'Video explanation already exists'
          }));
          return;
        }
        const attempt = await prisma.attempts.findUnique({
          where: { id: attemptId },
          include: {
            question: true,
            attempt_test_results: {
              include: {
                test_case: true
              }
            }
          }
        });
        if (!attempt) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Attempt not found' }));
          return;
        }
        if (attempt.student_email !== studentEmail) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }
        const testResults = attempt.attempt_test_results.map(tr => ({
          passed: tr.passed,
          input: tr.test_case.stdin,
          expected: tr.test_case.stdout,
          actual: tr.stdout || ''
        }));
        const result = await requestVideoExplanation(
          attemptId,
          questionId,
          studentEmail,
          attempt.question,
          attempt.submission,
          testResults
        );
        if (result.success) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(result));
        } else {
          const statusCode = result.rateLimitExceeded ? 429 : 500;
          res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(result));
        }
      } catch (error) {
        console.error('❌ Error in /api/student/request-video-explanation:', error);
        console.error('Stack trace:', error.stack);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: 'Failed to generate video explanation',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }));
      }
    });
    return;
  }
  if (pathname.startsWith('/api/student/video-explanation/') && req.method === 'GET') {
    const attemptId = pathname.replace('/api/student/video-explanation/', '').split('?')[0];
    const cookies = parseCookies(req);
    const studentEmail = cookies.userEmail || req.headers['x-user-email'];
    if (!studentEmail) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Authentication required' }));
      return;
    }
    try {
      const { getVideoExplanation, getVideoStatus } = await import('./services/videoExplanationService.js');
      const videoExplanation = await getVideoExplanation(attemptId);
      if (!videoExplanation) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Video explanation not found' }));
        return;
      }
      if (videoExplanation.student_email !== studentEmail) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
      if (videoExplanation.status === 'processing' && videoExplanation.video_provider_id) {
        try {
          console.log(`🔄 Polling HeyGen for video status: ${videoExplanation.video_provider_id}`);
          const heygenStatus = await getVideoStatus(videoExplanation.video_provider_id);
          if (heygenStatus.status === 'completed' && heygenStatus.videoUrl) {
            console.log(`✅ Video completed! Updating database with URL: ${heygenStatus.videoUrl}`);
            const updated = await prisma.video_explanations.update({
              where: { id: videoExplanation.id },
              data: {
                status: 'completed',
                video_url: heygenStatus.videoUrl,
                completed_at: new Date()
              }
            });
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(updated));
            return;
          } else if (heygenStatus.status === 'failed') {
            console.log(`❌ Video generation failed: ${heygenStatus.error}`);
            const updated = await prisma.video_explanations.update({
              where: { id: videoExplanation.id },
              data: {
                status: 'failed',
                error_message: heygenStatus.error || 'Video generation failed'
              }
            });
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(updated));
            return;
          }
        } catch (pollError) {
          console.error('Error polling HeyGen:', pollError);
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(videoExplanation));
    } catch (error) {
      console.error('❌ Error getting video explanation:', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  if (pathname.startsWith('/api/student/video-status/') && req.method === 'GET') {
    const videoId = pathname.replace('/api/student/video-status/', '').split('?')[0];
    const studentEmail = req.headers['x-user-email'];
    if (!studentEmail) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Authentication required' }));
      return;
    }
    try {
      const { getVideoStatus } = await import('./services/videoExplanationService.js');
      const status = await getVideoStatus(videoId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(status));
    } catch (error) {
      console.error('❌ Error getting video status:', error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});
if (process.env.START_SERVER !== 'false') {
  server.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });
}