// Debug test to see what's happening
const vm = require('vm');

const userCode = 'function solution(arr) { return arr.reverse(); }';
const input = [1, 2, 3];

console.log('Testing VM execution...\n');

// Test 1: Simple approach
const sandboxObj = {
    console: console,
    result: null,
    inputValue: input
};

const sandbox = vm.createContext(sandboxObj);

console.log('1. Executing user code...');
vm.runInContext(userCode, sandbox, { timeout: 1000 });

console.log('2. Finding function...');
const funcMatch = userCode.match(/function\s+(\w+)/);
console.log('   Function name:', funcMatch ? funcMatch[1] : 'NOT FOUND');

if (funcMatch) {
    const funcName = funcMatch[1];
    const callCode = `result = ${funcName}(inputValue);`;
    console.log('3. Calling function with code:', callCode);

    try {
        vm.runInContext(callCode, sandbox, { timeout: 1000 });
        console.log('4. Result:', sandboxObj.result);
        console.log('   Type:', typeof sandboxObj.result);
        console.log('   Value:', JSON.stringify(sandboxObj.result));
    } catch (e) {
        console.log('ERROR:', e.message);
    }
}
