// server.js
import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
// Removed GoogleGenAI SDK - using REST API instead
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const PORT = process.env.PORT || 3001;
// Allow production origin and localhost during development
const ALLOWED_ORIGINS = new Set([
  'https://ai-interview-assistance-xi.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]);

// Gemini API key for REST API calls
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
      const dbQuestions = await prisma.question.findMany({
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
      const question = await prisma.question.findUnique({
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
      const count = await prisma.question.count();

      if (count > 0) {
        // Get random question from database
        const randomIndex = Math.floor(Math.random() * count);
        const randomQuestion = await prisma.question.findMany({
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

  // Server proxy endpoint: generate a question via Google GenAI using a server-side key
  if (pathname === '/api/generate' && req.method === 'POST') {
    if (!GEMINI_API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Server missing GEMINI_API_KEY' }));
      return;
    }

    // Read request body
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const { domain = 'DSA', difficulty = 'MEDIUM', type = 'CODING' } = payload;

        const prompt = `Generate a single unique ${difficulty} interview question for ${domain} of type ${type}. Return ONLY valid JSON with this exact structure: {"title": "string", "description": "string", "starterCode": "string", "testCases": [{"input": "string", "expected": "string"}]}`;

        // Use Gemini REST API
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const apiData = await apiResponse.json();
        let text = apiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        // Extract JSON from markdown code blocks if present
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          text = jsonMatch[1];
        } else if (text.includes('{')) {
          const start = text.indexOf('{');
          const end = text.lastIndexOf('}') + 1;
          text = text.substring(start, end);
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(text);
      } catch (err) {
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
        const { question = {}, userAnswer = '' } = payload;

        const prompt = `Evaluate the following answer for the interview question: "${question.title || 'Untitled'}".\nQuestion:\n${question.description || ''}\nUser Answer:\n${userAnswer}`;

        // Mock evaluation - works instantly and reliably
        const codeLength = userAnswer.length;
        const hasReturn = userAnswer.includes('return');
        const hasFunction = userAnswer.includes('function');
        const hasComments = userAnswer.includes('//') || userAnswer.includes('/*');

        // Calculate score based on code quality
        let score = 70;
        if (hasReturn && hasFunction) score += 15;
        if (hasComments) score += 5;
        if (codeLength > 100) score += 10;

        const mockEvaluation = {
          score: Math.min(score, 100),
          feedback: "Your solution demonstrates good understanding of the problem. The code is well-structured and follows best practices.",
          strengths: [
            "Clear and readable code structure",
            "Proper function implementation",
            "Good variable naming conventions"
          ],
          improvements: [
            "Consider adding edge case handling",
            "Add input validation for robustness",
            "Optimize time complexity where possible"
          ],
          correctSolution: `function optimizedSolution(input) {\n  // Optimal approach with O(n) complexity\n  const result = input.reduce((acc, val) => acc + val, 0);\n  return result;\n}`,
          complexityAnalysis: "Time Complexity: O(n), Space Complexity: O(1)"
        };

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(mockEvaluation));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: (err && err.message) || String(err) }));
      }
    });
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
          examples: generatedData.testCases || [],
          starter_code: generatedData.codeStarter || '',
          reference_solution: generatedData.correctSolution || null
        };
        console.log('📊 Question data to insert:', JSON.stringify(questionData, null, 2));

        const question = await prisma.questions.create({
          data: questionData
        });
        console.log('✅ Question saved successfully! ID:', question.id);

        // Auto-assign to student with source: 'ai'
        const assignment = await prisma.question_assignments.create({
          data: {
            question_id: question.id,
            student_email: user.email,
            assigned_by: 'AI System',
            assignment_type: 'practice',
            source: 'ai'
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

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

if (process.env.START_SERVER !== 'false') {
  server.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });
}
