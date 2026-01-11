const API_KEY = 'AIzaSyAHEOpPond2NXRSAbWZG_lBC2UHjo1hjtc';
async function testGeminiAPI() {
    try {
        console.log('🧪 Testing Gemini API with new key...');
        const apiUrl = `https:
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Say hello in one word' }] }]
            })
        });
        const data = await response.json();
        console.log('\n📊 Response Status:', response.status);
        console.log('📊 Response Data:', JSON.stringify(data, null, 2));
        if (data.candidates && data.candidates[0]) {
            console.log('\n✅ API Key is working!');
            console.log('Response:', data.candidates[0].content.parts[0].text);
        } else if (data.error) {
            console.log('\n❌ API Error:', data.error.message);
            console.log('Error Details:', JSON.stringify(data.error, null, 2));
        } else {
            console.log('\n⚠️ Unexpected response format');
        }
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}
testGeminiAPI();