console.log('🔍 Quick API Check...\n');
async function quickTest() {
    try {
        const res = await fetch('http://localhost:3001'
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ /api/questions - Found ${data.length} questions`);
        } else {
            console.log(`❌ /api/questions - HTTP ${res.status}`);
        }
    } catch (e) {
        console.log(`❌ Server not responding: ${e.message}`);
    }
}
quickTest();