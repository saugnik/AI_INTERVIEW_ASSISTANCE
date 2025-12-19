// server.js
import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
// Removed GoogleGenAI SDK - using REST API instead
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { evaluateCode } from './evaluator.js';
import { generateHintsForQuestion, saveHintsToDatabase } from './services/hintService.js';
import { updateStudentRanking, getLeaderboard, getStudentRank } from './services/rankingService.js';
import { awardXP, getStudentLevel } from './services/levelingService.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
// Allow production origin and localhost during development
const ALLOWED_ORIGINS = new Set([
  'https://ai-interview-assistance-xi.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]);

// Groq API key for REST API calls (OpenAI-compatible format)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize Prisma client
const prisma = new PrismaClient();

// Fallback hardcoded questions (used when DB is empty)
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

// Improved CORS helper — uses req.headers.origin
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

export const server = http.createServer(async (req, res) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // safe parsing of pathname
  const fullUrl = `http://${req.headers.host}${req.url}`;
  const { pathname } = new URL(req.url || '/', fullUrl);

  // --- New: GET /api/questions (list) ---
  if (pathname === '/api/questions' && req.method === 'GET') {
    try {
      // Try DB first
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

  // --- New: GET /api/questions/:id (single question with tests) ---
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

      // fallback to static array if DB has no such id
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

  // Keep your existing /api/questions/generate route (returns the hardcoded question)
  if (pathname === '/api/questions/generate' && (req.method === 'GET' || req.method === 'POST')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(questions[0]));
    return;
  }

  // NEW: GET /api/questions/random - Returns a random question
  if (pathname === '/api/questions/random' && req.method === 'GET') {
    try {
      // Try to get a random question from database
      const count = await prisma.questions.count();

      if (count > 0) {
        // Get random question from database
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

      // Fallback to hardcoded questions if database is empty
      const randomFallback = questions[Math.floor(Math.random() * questions.length)];
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(randomFallback));
    } catch (err) {
      console.error('GET /api/questions/random error:', err);
      // On error, return hardcoded question
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(questions[0]));
    }
    return;
  }

  // ============================================
  // AUTHENTICATION: Save/Update User with Role Locking
  // ============================================
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

        // Check if user exists
        const existingUser = await prisma.auth_users.findUnique({
          where: { email }
        });

        if (existingUser) {
          // ROLE LOCKING: Verify role matches existing role
          if (existingUser.role !== role) {
            console.log(`❌ Role mismatch for ${email}: existing=${existingUser.role}, requested=${role}`);
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

          // Update existing user (same role)
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
          // Create new user with specified role (role locked on creation)
          const newUser = await prisma.auth_users.create({
            data: {
              email,
              name,
              google_id,
              role, // Role is locked to this value forever
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

  // Server proxy endpoint: generate a question via Groq AI using a server-side key
  if (pathname === '/api/generate' && req.method === 'POST') {
    if (!GROQ_API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Server missing GROQ_API_KEY' }));
      return;
    }

    // Read request body
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const { domain = 'DSA', difficulty = 'MEDIUM', type = 'CODING' } = payload;

        let prompt = '';

        if (type === 'Theory') {
          prompt = `Generate a ${difficulty} level THEORY question for "${domain}". This is CONCEPTUAL, not coding.
Return ONLY valid JSON:
{"title":"Question","description":"Theoretical question to answer","constraints":["200-300 words"],"examples":[{"input":"Approach","output":"Key points","explanation":"Why"}],"starterCode":"","testCases":[],"hints":["Hint 1","Hint 2"]}`;
        } else if (type === 'System Design') {
          prompt = `Generate a ${difficulty} level SYSTEM DESIGN question for "${domain}". This is ARCHITECTURE, not coding.
Return ONLY valid JSON:
{"title":"Design X","description":"System to design","constraints":["Scale: 100M users"],"examples":[{"input":"Scenario","output":"Components","explanation":"Why"}],"starterCode":"","testCases":[],"hints":["Scalability","Caching"]}`;
        } else {
          prompt = `Generate a ${difficulty} level CODING question for "${domain}". This requires writing executable JavaScript code.

CRITICAL: You MUST include at least 3 test cases with actual input values and expected outputs.

Return ONLY valid JSON in this EXACT format:
{
  "title": "Problem Name",
  "description": "Clear problem description with requirements",
  "constraints": ["Time: O(n)", "Space: O(1)", "Input range: 1-1000"],
  "examples": [
    {"input": "[1,2,3]", "output": "[3,2,1]", "explanation": "Array is reversed"},
    {"input": "[5]", "output": "[5]", "explanation": "Single element stays same"}
  ],
  "starterCode": "function solution(arr) {\\n  // Write your code here\\n  return arr;\\n}",
  "testCases": [
    {"input": "[1,2,3]", "expected": "[3,2,1]"},
    {"input": "[5]", "expected": "[5]"},
    {"input": "[]", "expected": "[]"}
  ],
  "hints": ["Think about array methods", "Consider edge cases"]
}

The testCases array is MANDATORY and must have at least 3 test cases with valid JavaScript values.`;
        }


        // Use Groq REST API (OpenAI-compatible format)
        const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are an expert technical interviewer. Generate high-quality ${type} interview questions. Always respond with valid JSON only, no markdown formatting. Generate UNIQUE and CREATIVE questions - avoid repeating common problems. Request ID: ${Date.now()}`
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
          throw new Error(`Groq API error: ${apiData.error?.message || 'Unknown error'}`);
        }

        let text = apiData.choices?.[0]?.message?.content || '{}';

        // Extract JSON from markdown code blocks if present
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          text = jsonMatch[1];
        } else if (text.includes('{')) {
          const start = text.indexOf('{');
          const end = text.lastIndexOf('}') + 1;
          text = text.substring(start, end);
        }

        // Validate JSON before sending
        const parsedData = JSON.parse(text);
        console.log('✅ Parsed AI response:', JSON.stringify(parsedData, null, 2));

        // ============================================
        // AUTO-SAVE TO DATABASE (with duplicate check)
        // ============================================
        try {
          console.log('💾 Checking for duplicates and saving question...');

          // Check for exact duplicate by title
          const existingQuestion = await prisma.questions.findFirst({
            where: {
              title: parsedData.title
            }
          });

          if (existingQuestion) {
            console.log(`⚠️ Duplicate question detected: "${parsedData.title}" already exists (ID: ${existingQuestion.id})`);
            console.log('📋 Skipping database save, returning existing question');

            // Return existing question instead of creating duplicate
            parsedData.id = existingQuestion.id;
            parsedData.source = 'ai';
            parsedData.isDuplicate = true;
          } else {
            // No duplicate found, save new question
            const questionId = crypto.randomUUID();

            // Save question
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
                source: 'ai' // Mark as AI-generated
              }
            });

            // Save test cases
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

            // Generate and save hints
            const hints = await generateHintsForQuestion(parsedData.title, parsedData.description);
            await saveHintsToDatabase(questionId, hints);
            console.log(`✅ Saved ${hints.length} AI-generated hints`);

            console.log(`✅ New question saved with ID: ${questionId}`);

            // Add question ID to response
            parsedData.id = questionId;
            parsedData.source = 'ai';
            parsedData.isDuplicate = false;
          }
        } catch (saveError) {
          console.error('⚠️ Error saving to database:', saveError);
          // Continue even if save fails - return the generated question
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

  // Server proxy endpoint: evaluate an attempt via GenAI
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

        // Run code against test cases
        let passedTests = 0;
        let totalTests = testCases.length || 0;
        const testResults = [];

        if (totalTests > 0) {
          // Use simple evaluator
          const evalResults = evaluateCode(userAnswer, testCases);
          passedTests = evalResults.passedTests;
          testResults.push(...evalResults.testResults);
        }

        // Calculate score based on test results
        const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

        // Generate feedback based on results
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

        // Generate reference solution if score < 100% using Groq API
        let referenceSolution = null;
        let complexityAnalysis = null;

        if (score < 100 && GROQ_API_KEY) {
          try {
            const solutionPrompt = `Generate an optimal solution for this coding problem:

Problem: ${question.title || 'Coding Problem'}
Description: ${question.description || question.prompt || 'No description'}

Requirements:
- Provide a clean, well-commented JavaScript solution
- Include time and space complexity analysis
- Make it beginner-friendly with explanations

Return ONLY valid JSON:
{
  "solution": "function name(params) {\\n  // code here\\n}",
  "explanation": "Brief explanation of the approach",
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)"
}`;

            const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
            const apiResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
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
              complexityAnalysis = `Time: ${solutionData.timeComplexity || 'N/A'}, Space: ${solutionData.spaceComplexity || 'N/A'}`;

              if (solutionData.explanation) {
                improvements.unshift(`Optimal approach: ${solutionData.explanation}`);
              }
            }
          } catch (error) {
            console.error('Error generating reference solution:', error);
            // Continue without reference solution
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

        // ============================================
        // STORE ATTEMPT & UPDATE RANKINGS
        // ============================================
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

            // CRITICAL: Verify question exists in database before saving
            const questionExists = await prisma.questions.findUnique({
              where: { id: questionId },
              select: { id: true, title: true }
            });

            if (!questionExists) {
              console.error(`❌ ERROR: Question ID ${questionId} does not exist in database!`);
              console.error('   Cannot save attempt - foreign key constraint would fail');
              console.error('   Skipping database save but returning evaluation result');
              // Don't throw error - just skip save and return evaluation
            } else {
              console.log(`✅ Question verified: ${questionExists.title}`);

              // Save attempt to database
              const attemptId = crypto.randomUUID();
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
              console.log(`✅ Attempt saved with ID: ${attemptId}`);

              // Update student rankings
              const rankingResult = await updateStudentRanking(studentEmail, score);
              console.log(`✅ Rankings updated: ${rankingResult.newTotalScore} total score, ${rankingResult.newQuestionsSolved} solved`);

              // Award XP and check for level up
              const xpResult = await awardXP(studentEmail, score);
              evaluation.xpAwarded = xpResult.xpAwarded;
              evaluation.totalXP = xpResult.totalXP;
              evaluation.currentLevel = xpResult.currentLevel;
              evaluation.leveledUp = xpResult.leveledUp;
              if (xpResult.newBadges.length > 0) {
                evaluation.newBadges = xpResult.newBadges;
              }
              console.log(`✅ XP awarded: ${xpResult.xpAwarded} (Total: ${xpResult.totalXP}, Level: ${xpResult.currentLevel})`);

              // Mark question as solved if score >= 70%
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

                // Mark assignment as completed if this was an assigned question
                try {
                  const assignment = await prisma.question_assignments.findFirst({
                    where: {
                      student_email: studentEmail,
                      question_id: questionId,
                      completed: false // Only update if not already completed
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
                  // Continue even if assignment update fails
                }
              }

              // Generate hint for wrong answer if score < 70%
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
          }
        } catch (saveError) {
          console.error('⚠️ Error saving attempt/updating rankings:', saveError);
          // Continue even if save fails - return the evaluation
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(evaluation));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: (err && err.message) || String(err) }));
      }
    });
    return;
  }

  // ============================================
  // NEW ENDPOINTS: RANKINGS & LEADERBOARD
  // ============================================

  // GET /api/rankings - Get global leaderboard
  if (pathname === '/api/rankings' && req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
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

  // GET /api/rankings/:email - Get student's rank
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

  // GET /api/student/progress/:email - Get student progress dashboard
  if (pathname.startsWith('/api/student/progress/') && req.method === 'GET') {
    try {
      const email = decodeURIComponent(pathname.replace('/api/student/progress/', ''));

      // Get level info
      const levelData = await getStudentLevel(email);

      // Get rank info
      const rankData = await getStudentRank(email);

      // Get solved questions
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

      // Get recent attempts
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

  // GET /api/student/assigned-questions - Get assigned questions for student
  if (pathname === '/api/student/assigned-questions' && req.method === 'GET') {
    try {
      const studentEmail = req.headers['x-user-email'];

      if (!studentEmail) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Student email required' }));
        return;
      }

      console.log(`📚 Fetching assigned questions for ${studentEmail}`);

      // Fetch all question assignments for this student
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

      // Group assignments by type
      const aiPractice = [];
      const adminPractice = [];
      const testQuestions = [];

      assignments.forEach(assignment => {
        // Parse JSON fields if they're strings
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

        // Format test cases for evaluator (convert stdin/stdout to input/expected)
        const testCases = (assignment.question.test_cases || []).map(tc => ({
          input: tc.stdin,
          expected: tc.stdout,
          expectedOutput: tc.stdout // Add alias for compatibility
        }));

        const questionData = {
          id: assignment.question.id,
          title: assignment.question.title,
          difficulty: assignment.question.difficulty,
          domain: assignment.question.domain,
          prompt: assignment.question.prompt,
          description: assignment.question.prompt, // Add description alias for frontend
          type: assignment.question.type,
          constraints: constraints || [],
          examples: examples || [],
          testCases: testCases, // Add formatted test cases
          assignmentId: assignment.id,
          assignedAt: assignment.assigned_at,
          dueDate: assignment.due_date,
          completed: assignment.completed,
          completedAt: assignment.completed_at
        };

        // Group by assignment type and source
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

  // GET /api/student/my-progress - Get student's progress statistics
  if (pathname === '/api/student/my-progress' && req.method === 'GET') {
    try {
      const studentEmail = req.headers['x-user-email'];

      if (!studentEmail) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Student email required' }));
        return;
      }

      console.log(`📊 Fetching progress for ${studentEmail}`);

      // Get all assignments for this student
      const allAssignments = await prisma.question_assignments.findMany({
        where: { student_email: studentEmail }
      });

      const total = allAssignments.length;
      const completed = allAssignments.filter(a => a.completed).length;
      const pending = total - completed;

      // Calculate overdue count
      const now = new Date();
      const overdue = allAssignments.filter(a =>
        !a.completed && a.due_date && new Date(a.due_date) < now
      ).length;

      // Calculate progress percentage
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Get solved questions count and average score
      const solvedQuestions = await prisma.solved_questions.findMany({
        where: { student_email: studentEmail }
      });

      const questionsSolved = solvedQuestions.length;
      const averageScore = questionsSolved > 0
        ? Math.round(solvedQuestions.reduce((sum, q) => sum + q.score, 0) / questionsSolved)
        : 0;

      // Get XP and level data
      const levelData = await prisma.student_levels.findUnique({
        where: { student_email: studentEmail }
      });

      // Get ranking data
      const rankingData = await prisma.student_rankings.findUnique({
        where: { student_email: studentEmail }
      });

      const response = {
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
        rank: rankingData?.rank || null
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

  // GET /api/admin/suggested-questions - Get AI-generated questions for admin
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

      // Get all AI-generated questions
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

  // GET /api/hints/:questionId - Get hints for a question
  if (pathname.startsWith('/api/hints/') && req.method === 'GET') {
    try {
      const questionId = pathname.replace('/api/hints/', '');
      const url = new URL(req.url, `http://${req.headers.host}`);
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

  // NEW: POST /api/attempts - Save user attempt
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

  // NEW: GET /api/attempts/user/:userId - Get user's attempt history
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

  // NEW: GET /api/stats/user/:userId - Get user statistics
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

      // Calculate streak (simplified - consecutive days)
      const today = new Date().toDateString();
      const hasToday = attempts.some(a => new Date(a.createdAt).toDateString() === today);
      const streak = hasToday ? Math.floor(Math.random() * 7) + 1 : 0; // Mock streak for now

      // Domain breakdown
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

  // ============================================
  // ROLE-BASED ENDPOINTS
  // ============================================

  // Helper to get user info from headers
  const getUserInfo = (req) => {
    return {
      email: req.headers['x-user-email'],
      role: req.headers['x-user-role'] || 'student'
    };
  };

  // Admin: Get all questions
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

  // Admin: Get all students
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

  // Admin: Assign question to student
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

  // Student: Get assigned questions
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

  // Student: Get progress
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

  // Student: Generate AI Question
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

        // Call the generate API endpoint
        const generateUrl = `http://localhost:${PORT}/api/generate`;
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

        // Create question in database
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

        // Auto-assign to student (will use defaults: assignment_type='practice', source='admin')
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

  // POST /api/admin/create-question - Admin creates a question for the library
  if (pathname === '/api/admin/create-question' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const questionData = JSON.parse(body);
        console.log('📝 Admin creating question:', questionData.title);

        // Create question in database
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

  // GET /api/admin/students - Get all students for admin
  if (pathname === '/api/admin/students' && req.method === 'GET') {
    try {
      console.log('📊 Admin fetching students list...');

      // Get all users from auth_users table
      const users = await prisma.$queryRawUnsafe(`
        SELECT email, name, role, created_at 
        FROM auth_users 
        WHERE role = 'student'
        ORDER BY created_at DESC
      `);

      // For each user, get their assignment stats
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

  // GET /api/student/profile - Get student profile with stats
  if (pathname === '/api/student/profile' && req.method === 'GET') {
    try {
      const userEmail = req.headers['x-user-email'];
      console.log('📊 Fetching student profile for:', userEmail);

      // Get all assignments for this student
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

      // Get recent attempts with scores
      const recentAttempts = assignments
        .filter(a => a.completed && a.score !== null)
        .slice(0, 10)
        .map(a => ({
          questionTitle: a.questions.title,
          score: a.score || 0,
          completedAt: a.completed_at
        }));

      // Calculate average score
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

  // GET /api/admin/profile - Get admin profile with assignment history
  if (pathname === '/api/admin/profile' && req.method === 'GET') {
    try {
      const userEmail = req.headers['x-user-email'];
      console.log('📊 Fetching admin profile for:', userEmail);

      // Get all assignments made by this admin
      const assignments = await prisma.question_assignments.findMany({
        include: {
          questions: true
        },
        orderBy: { assigned_at: 'desc' }
      });

      const totalAssignments = assignments.length;

      // Get unique students managed
      const uniqueStudents = new Set(assignments.map(a => a.student_email));
      const studentsManaged = uniqueStudents.size;

      // Get recent assignments
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

  // POST /api/auth/save-user - Save user to database after OAuth login
  if (pathname === '/api/auth/save-user' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { email, name, google_id, role } = JSON.parse(body);
        console.log('💾 Saving user to database:', email, 'Role:', role);

        // Use raw SQL to insert or update user
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

  // GET /api/student/assigned-questions - Get questions assigned to student
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

      // Group assignments by source
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

  // GET /api/admin/questions - Get all questions for admin dashboard
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

  // POST /api/auth/save-user - Save user after OAuth login
  if (pathname === '/api/auth/save-user' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { email, name, google_id, role } = JSON.parse(body);
        console.log('💾 Saving user to database:', email, 'Role:', role);

        // Insert or update user in auth_users table
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

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

if (process.env.START_SERVER !== 'false') {
  server.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });
}

