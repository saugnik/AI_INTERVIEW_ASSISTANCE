export function evaluateCode(userCode, testCases) {
    console.log('='.repeat(60));
    console.log('EVALUATOR CALLED');
    console.log('User Code Type:', typeof userCode);
    console.log('User Code Length:', userCode?.length);
    console.log('User Code:', userCode);
    console.log('Test Cases:', JSON.stringify(testCases, null, 2));
    console.log('='.repeat(60));
    const results = {
        passedTests: 0,
        totalTests: testCases.length,
        testResults: []
    };
    for (const testCase of testCases) {
        try {
            let input = testCase.input;
            if (typeof input === 'string') {
                try {
                    input = JSON.parse(input);
                } catch (e) {
                    try {
                        input = eval(`(${input})`);
                    } catch (e2) {
                        console.log('Input kept as string:', input);
                    }
                }
            }
            console.log('Parsed input:', input, 'Type:', typeof input);
            let match = userCode.match(/function\s+(\w+)\s*\(/);
            if (!match) {
                match = userCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>/);
            }
            console.log('Function match:', match);
            console.log('User code:', userCode);
            if (!match) {
                throw new Error('No function found. Please define a function using: function name(params) { } or const name = (params) => { }');
            }
            const funcName = match[1];
            console.log('Function name:', funcName);
            const wrappedCode = `
        ${userCode}
        return ${funcName};
      `;
            console.log('Wrapped code:', wrappedCode);
            const userFunction = new Function(wrappedCode)();
            console.log('Function created:', typeof userFunction);
            const actualOutput = userFunction(input);
            console.log('Function result:', actualOutput, 'Type:', typeof actualOutput);
            const expectedOutput = testCase.expected || testCase.expectedOutput || testCase.output || testCase.stdout;
            let actualStr, expectedStr;
            if (typeof actualOutput === 'object' && actualOutput !== null) {
                actualStr = JSON.stringify(actualOutput);
            } else {
                actualStr = String(actualOutput);
            }
            if (typeof expectedOutput === 'string') {
                try {
                    const parsed = JSON.parse(expectedOutput);
                    expectedStr = JSON.stringify(parsed);
                } catch (e) {
                    expectedStr = expectedOutput.trim();
                }
            } else if (typeof expectedOutput === 'object' && expectedOutput !== null) {
                expectedStr = JSON.stringify(expectedOutput);
            } else {
                expectedStr = String(expectedOutput);
            }
            const normalizeJson = (str) => {
                try {
                    return JSON.stringify(JSON.parse(str));
                } catch (e) {
                    return str;
                }
            };
            const normalizedActual = normalizeJson(actualStr);
            const normalizedExpected = normalizeJson(expectedStr);
            const passed = normalizedActual === normalizedExpected;
            console.log('Comparison:');
            console.log('  Actual:', actualStr, '->', normalizedActual);
            console.log('  Expected:', expectedStr, '->', normalizedExpected);
            console.log('  Passed?', passed);
            if (passed) results.passedTests++;
            results.testResults.push({
                input: testCase.input,
                expected: expectedStr,
                actual: actualStr,
                passed
            });
        } catch (error) {
            console.log('ERROR:', error.message);
            results.testResults.push({
                input: testCase.input,
                expected: testCase.expected || testCase.output,
                actual: `Error: ${error.message}`,
                passed: false
            });
        }
    }
    console.log('Final results:', results);
    return results;
}