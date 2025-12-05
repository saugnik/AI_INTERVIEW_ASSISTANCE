import http from 'http';
import { URL } from 'url';

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = 'https://ai-interview-assistance-xi.vercel.app';

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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export const server = http.createServer((req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (pathname === '/api/questions/generate' && (req.method === 'GET' || req.method === 'POST')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(questions[0]));
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
