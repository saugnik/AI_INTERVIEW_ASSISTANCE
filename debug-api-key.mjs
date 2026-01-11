import dotenv from 'dotenv';
dotenv.config();
console.log('🔍 Debugging D-ID API Key Loading...\n');
const DID_API_KEY = process.env.DID_API_KEY;
if (!DID_API_KEY) {
    console.error('❌ DID_API_KEY is NOT loaded from .env!');
    console.error('💡 Make sure .env file exists and has DID_API_KEY=...');
} else {
    console.log('✅ DID_API_KEY is loaded');
    console.log(`📏 Length: ${DID_API_KEY.length} characters`);
    console.log(`🔑 First 40 chars: ${DID_API_KEY.substring(0, 40)}...`);
    console.log(`🔑 Last 20 chars: ...${DID_API_KEY.substring(DID_API_KEY.length - 20)}`);
}
console.log('\n💡 If the key shown above is the OLD key, the server needs to be restarted.');
console.log('💡 Run: Stop-Process -Name "node" -Force; .\\start-all.ps1\n');