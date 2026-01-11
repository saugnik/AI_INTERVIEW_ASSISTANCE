// Test script to check OAuth redirect URI
const PORT = process.env.PORT || 3001;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`;
console.log('='.repeat(60));
console.log('OAuth Configuration Check');
console.log('='.repeat(60));
console.log(`PORT: ${PORT}`);
console.log(`GOOGLE_REDIRECT_URI env: ${process.env.GOOGLE_REDIRECT_URI || 'NOT SET'}`);
console.log(`Actual redirect_uri being used: ${redirectUri}`);
console.log('='.repeat(60));
console.log('\nThis is the EXACT URI that must be in Google Cloud Console:');
console.log(`  ${redirectUri}`);
console.log('='.repeat(60));
