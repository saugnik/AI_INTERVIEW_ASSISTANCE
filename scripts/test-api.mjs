import http from 'http';
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
  });
}
(async () => {
  let server;
  try {
    process.env.START_SERVER = 'false';
    ({ server } = await import('../server.js'));
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    const base = `http://127.0.0.1:${addr.port}`;
    const res = await httpGet(`${base}/api/questions/generate`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const json = JSON.parse(res.body);
    const required = ['id', 'title', 'prompt', 'constraints', 'examples', 'tests'];
    for (const key of required) {
      if (!(key in json)) throw new Error(`Missing key: ${key}`);
    }
    console.log('OK');
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('TEST FAILED:', e?.message || e);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
})();