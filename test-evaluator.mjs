// Test the evaluator directly
import { evaluateCode } from './evaluator.js';

const code = 'function solution(arr) { return arr.reverse(); }';
const testCases = [
    { input: '[1,2,3]', expected: '[3,2,1]' },
    { input: '[5]', expected: '[5]' },
    { input: '[]', expected: '[]' }
];

console.log('Testing evaluator...\n');
const result = evaluateCode(code, testCases);

console.log('Result:', JSON.stringify(result, null, 2));
console.log('\nScore:', Math.round((result.passedTests / result.totalTests) * 100) + '%');
