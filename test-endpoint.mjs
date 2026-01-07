// Test the video explanation endpoint directly using node-fetch or http
import http from 'http';

async function testEndpoint() {
    const attemptId = '2472514d-b371-485e-89f6-eb5be550ca1e';
    const userEmail = 'saugnikaich_80_j_@gmail.com';

    console.log(`\n🧪 Testing endpoint: GET /api/student/video-explanation/${attemptId}`);
    console.log(`User Email: ${userEmail}\n`);

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/student/video-explanation/${attemptId}`,
        method: 'GET',
        headers: {
            'x-user-email': userEmail
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            console.log('Status Code:', res.statusCode);
            console.log('Status Message:', res.statusMessage);
            console.log('Headers:', res.headers);

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('\nResponse Body:');
                console.log(data);

                if (res.statusCode === 200) {
                    console.log('\n✅ SUCCESS - Endpoint is working!');
                    try {
                        const jsonData = JSON.parse(data);
                        console.log('\nVideo Data:');
                        console.log('  Status:', jsonData.status);
                        console.log('  Video URL:', jsonData.video_url || 'NULL');
                        console.log('  Error:', jsonData.error_message || 'NULL');
                    } catch (e) {
                        console.log('Could not parse JSON:', e.message);
                    }
                } else {
                    console.log('\n❌ FAILED - Endpoint returned error');
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error('\n❌ ERROR:', error.message);
            reject(error);
        });

        req.end();
    });
}

testEndpoint().catch(console.error);
