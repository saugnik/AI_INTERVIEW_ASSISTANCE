// Debug evaluator - logs everything
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
            // Parse input - try to evaluate as JavaScript first
            let input = testCase.input;
            if (typeof input === 'string') {
                try {
                    // Try to parse as JSON first
                    input = JSON.parse(input);
                } catch (e) {
                    // If not JSON, try to evaluate as JavaScript expression
                    try {
                        input = eval(`(${input})`);
                    } catch (e2) {
                        // Keep as string if both fail
                        console.log('Input kept as string:', input);
                    }
                }
            }

            console.log('Parsed input:', input, 'Type:', typeof input);

            // Try to find function - support multiple patterns
            let match = userCode.match(/function\s+(\w+)\s*\(/);
            if (!match) {
                // Try arrow function assigned to const/let/var
                match = userCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>/);
            }

            console.log('Function match:', match);
            console.log('User code:', userCode);

            if (!match) {
                throw new Error('No function found. Please define a function using: function name(params) { } or const name = (params) => { }');
            }

            const funcName = match[1];
            console.log('Function name:', funcName);

            // Execute
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

            // Normalize both outputs for comparison
            let actualStr, expectedStr;

            // Handle actual output
            if (typeof actualOutput === 'object' && actualOutput !== null) {
                actualStr = JSON.stringify(actualOutput);
            } else {
                actualStr = String(actualOutput);
            }

            // Handle expected output
            if (typeof expectedOutput === 'string') {
                // Try to parse as JSON to normalize format
                try {
                    const parsed = JSON.parse(expectedOutput);
                    expectedStr = JSON.stringify(parsed);
                } catch (e) {
                    // Not JSON, use as-is
                    expectedStr = expectedOutput.trim();
                }
            } else if (typeof expectedOutput === 'object' && expectedOutput !== null) {
                expectedStr = JSON.stringify(expectedOutput);
            } else {
                expectedStr = String(expectedOutput);
            }

            // Normalize whitespace in JSON strings for comparison
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
