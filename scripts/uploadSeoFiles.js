'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const uploadUrl = 'https://srv1986-files.hstgr.io/rest/cc6a9ed5f6359524/api/tus/public_html';
const authKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxLCJsb2NhbGUiOiJlbl9VUyIsInZpZXdNb2RlIjoibGlzdCIsInNpbmdsZUNsaWNrIjpmYWxzZSwicmVkaXJlY3RBZnRlckNvcHlNb3ZlIjpmYWxzZSwicGVybSI6eyJhZG1pbiI6ZmFsc2UsImV4ZWN1dGUiOmZhbHNlLCJjcmVhdGUiOnRydWUsInJlbmFtZSI6dHJ1ZSwibW9kaWZ5Ijp0cnVlLCJkZWxldGUiOnRydWUsInNoYXJlIjpmYWxzZSwiZG93bmxvYWQiOnRydWV9LCJjb21tYW5kcyI6W10sImxvY2tQYXNzd29yZCI6dHJ1ZSwiaGlkZURvdGZpbGVzIjpmYWxzZSwiZGF0ZUZvcm1hdCI6ZmFsc2UsInVzZXJuYW1lIjoidTEzMDQwOTY3NiIsImFjZUVkaXRvclRoZW1lIjoiIn0sImlzcyI6IkZpbGUgQnJvd3NlciIsImV4cCI6MTc5MzQyNjQ1OCwiaWF0IjoxNzkzNDA0ODU4fQ.LjGF1l_VAqrLT-oWxBzZiYyknCpo-HUoNxB62pJueIw';
const restAuthKey = '2df728aed78b68261156027d1075865f6a4693ae5587900fc07c15b94c14ca86-cc6a9ed5f6359524';

const filesToUpload = [
  'sitemap.xml',
  'robots.txt',
  '.htaccess',
  'favicon.ico',
  'favicon.svg',
  'icon.svg',
  'logo-mark.svg',
  'og-image.png',
  'apple-touch-icon.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'index.html',
  'request-subscription/index.html',
  'terms/index.html',
  'privacy-policy/index.html',
  'login/index.html'
];

function uploadSingleFile(relPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(__dirname, '..', 'out', relPath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File does not exist: ${fullPath}`);
      return resolve();
    }

    const fileContent = fs.readFileSync(fullPath);
    const fileSize = fileContent.length;
    // TUS endpoint URL
    const targetUrl = new URL(`${uploadUrl}/${relPath.replace(/\\/g, '/')}?override=true`);

    console.log(`[TUS] Uploading ${relPath} (${fileSize} bytes)...`);

    const reqPost = https.request(targetUrl, {
      method: 'POST',
      headers: {
        'X-Auth': authKey,
        'X-Auth-Rest': restAuthKey,
        'Tus-Resumable': '1.0.0',
        'Upload-Length': fileSize.toString(),
        'Upload-Offset': '0'
      }
    }, res => {
      if (res.statusCode === 201 || res.statusCode === 200 || res.statusCode === 204) {
        const patchReq = https.request(targetUrl, {
          method: 'PATCH',
          headers: {
            'X-Auth': authKey,
            'X-Auth-Rest': restAuthKey,
            'Tus-Resumable': '1.0.0',
            'Content-Type': 'application/offset+octet-stream',
            'Upload-Offset': '0',
            'Content-Length': fileSize
          }
        }, patchRes => {
          if (patchRes.statusCode === 204 || patchRes.statusCode === 200) {
            console.log(`  ✔ Successfully deployed ${relPath}`);
            resolve();
          } else {
            console.error(`  ❌ PATCH failed for ${relPath}: ${patchRes.statusCode}`);
            resolve();
          }
        });
        patchReq.on('error', err => {
          console.error(`  ❌ PATCH error on ${relPath}: ${err.message}`);
          resolve();
        });
        patchReq.write(fileContent);
        patchReq.end();
      } else {
        console.error(`  ❌ POST creation failed for ${relPath}: ${res.statusCode}`);
        resolve();
      }
    });

    reqPost.on('error', err => {
      console.error(`  ❌ POST error on ${relPath}: ${err.message}`);
      resolve();
    });

    reqPost.end();
  });
}

async function run() {
  console.log('🚀 Starting TUS upload of SEO files to Hostinger...');
  for (const f of filesToUpload) {
    await uploadSingleFile(f);
  }
  console.log('🎉 All SEO files uploaded!');
}

run();
