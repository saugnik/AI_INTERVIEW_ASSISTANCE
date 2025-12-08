// server.js
import http from 'http';
import { URL } from 'url';
import { GoogleGenAI } from '@google/genai';
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

// Initialize server-side GenAI client when an API key is available
const genai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

  // Server proxy endpoint: generate a question via Google GenAI using a server-side key
  if (pathname === '/api/generate' && req.method === 'POST') {
    if (!genai) {
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

        const prompt = `Generate a single unique ${difficulty} interview question for ${domain} of type ${type}.\nFor coding questions provide starter code and test cases.`;

        const response = await genai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(response.text || '{}');
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: (err && err.message) || String(err) }));
      }
    });
    return;
  }

  // Server proxy endpoint: evaluate an attempt via GenAI
  if (pathname === '/api/evaluate' && req.method === 'POST') {
    if (!genai) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Server missing GEMINI_API_KEY' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const { question = {}, userAnswer = '' } = payload;

        const prompt = `Evaluate the following answer for the interview question: "${question.title || 'Untitled'}".\nQuestion:\n${question.description || ''}\nUser Answer:\n${userAnswer}`;

        const response = await genai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(response.text || '{}');
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: (err && err.message) || String(err) }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

if (process.env.START_SERVER !== 'false') {
  server.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });
}
