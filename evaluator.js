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
            // Parse input
            let input = testCase.input;
            if (typeof input === 'string') {
                try {
                    input = JSON.parse(input);
                } catch (e) {
                    // Keep as string
                }
            }

            // Try to find function
            const match = userCode.match(/function\s+(\w+)\s*\(/);
            console.log('Function match:', match);

            if (!match) {
                throw new Error('No function found');
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
            console.log('Function result:', actualOutput);

            const expectedOutput = testCase.expected || testCase.output;
            const actualStr = typeof actualOutput === 'object' ? JSON.stringify(actualOutput) : String(actualOutput);
            const expectedStr = typeof expectedOutput === 'string' && (expectedOutput.startsWith('[') || expectedOutput.startsWith('{'))
                ? expectedOutput.trim()
                : typeof expectedOutput === 'object' ? JSON.stringify(expectedOutput) : String(expectedOutput);

            const passed = actualStr === expectedStr;
            console.log('Comparison:', actualStr, '===', expectedStr, '?', passed);

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
