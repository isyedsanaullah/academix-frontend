const fs = require('fs');
const path = require('path');
const https = require('https');

// Resolve Hostinger OAuth credentials stored by IDE connection
const credsPath = path.join(process.env.APPDATA || '', 'hostinger-mcp', 'credentials.json');

if (!fs.existsSync(credsPath)) {
  console.error('Hostinger credentials not found in', credsPath);
  process.exit(1);
}

let creds;
try {
  creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
} catch (e) {
  console.error('Failed to parse Hostinger credentials:', e.message);
  process.exit(1);
}

// Find access token
const token = creds.access_token || creds.accessToken || (creds.tokens && creds.tokens.access_token) || (Object.values(creds).find(v => v && v.access_token)?.access_token);

if (!token) {
  console.error('No access token found in credentials.json. Please ensure Hostinger is connected in IDE.');
  process.exit(1);
}

const DOMAIN = process.argv[2] || 'collegeshub.org';
const ZIP_PATH = path.resolve(__dirname, '..', 'academix-hostinger.zip');

if (!fs.existsSync(ZIP_PATH)) {
  console.error('Deployment zip not found at:', ZIP_PATH);
  console.error('Run "npm run build:static" first.');
  process.exit(1);
}

const stats = fs.statSync(ZIP_PATH);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`\n🚀 Deploying ${ZIP_PATH} (${sizeMB} MB) to ${DOMAIN}...`);

const fileBuffer = fs.readFileSync(ZIP_PATH);
const boundary = '----HostingerDeployBoundary' + Date.now();

// Build multipart form body
const pre = Buffer.from(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="academix-hostinger.zip"\r\n` +
  `Content-Type: application/zip\r\n\r\n`
);
const post = Buffer.from(
  `\r\n--${boundary}\r\n` +
  `Content-Disposition: form-data; name="type"\r\n\r\n` +
  `static\r\n` +
  `--${boundary}--\r\n`
);

const fullBody = Buffer.concat([pre, fileBuffer, post]);

const req = https.request(
  {
    hostname: 'api.hostinger.com',
    port: 443,
    path: `/v1/hosting/websites/${DOMAIN}/deploy`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullBody.length,
      'User-Agent': 'Antigravity/1.4.7'
    }
  },
  res => {
    let responseData = '';
    res.on('data', chunk => { responseData += chunk; });
    res.on('end', () => {
      console.log(`HTTP Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(responseData);
        console.log('Response:', JSON.stringify(json, null, 2));
      } catch {
        console.log('Response:', responseData);
      }

      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`\n✅ Deployment successful to https://${DOMAIN}`);
      } else {
        console.error(`\n❌ Deployment returned status ${res.statusCode}`);
        process.exit(1);
      }
    });
  }
);

req.on('error', err => {
  console.error('Upload error:', err.message);
  process.exit(1);
});

req.write(fullBody);
req.end();
