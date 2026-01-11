const { generateExplanationScript } = require('./services/videoExplanationService.js');
async function testVideoExplanation() {
    console.log('🧪 Testing Video Explanation Service...\n');
    const question = {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'
    };
    const userAnswer = `
function twoSum(nums, target) {
    for (let i = 0; i < nums.length; i++) {
        return [i, i+1];
    }
}
    `;
    const testResults = [
        { input: '[2,7,11,15], 9', expected: '[0,1]', actual: '[0,1]', passed: true },
        { input: '[3,2,4], 6', expected: '[1,2]', actual: '[0,1]', passed: false },
        { input: '[3,3], 6', expected: '[0,1]', actual: '[0,1]', passed: false }
    ];
    try {
        console.log('📝 Generating explanation script...');
        console.log('Question:', question.title);
        console.log('User Answer Preview:', userAnswer.substring(0, 50) + '...\n');
        const script = await generateExplanationScript(question, userAnswer, testResults);
        console.log('\n✅ SUCCESS! Explanation generated without errors!\n');
        console.log('📊 Script Details:');
        console.log('- Length:', script.length, 'characters');
        console.log('- Word count:', script.split(/\s+/).length, 'words');
        console.log('\n📄 Script Preview (first 300 chars):');
        console.log(script.substring(0, 300) + '...\n');
        console.log('🎉 The Gemini API fix is working correctly!');
        console.log('✅ Model "gemini-1.5-flash" is responding successfully');
        return true;
    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        console.error('Error:', error.message);
        console.error('\nFull error:', error);
        return false;
    }
}
testVideoExplanation()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(err => {
        console.error('Unexpected error:', err);
        process.exit(1);
    });