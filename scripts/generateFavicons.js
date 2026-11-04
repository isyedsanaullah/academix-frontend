'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const publicDir = path.resolve(__dirname, '..', 'public');
  const appDir = path.resolve(__dirname, '..', 'app');
  const logoMarkSvgPath = path.join(publicDir, 'logo-mark.svg');

  if (!fs.existsSync(logoMarkSvgPath)) {
    console.error('logo-mark.svg not found in public/');
    process.exit(1);
  }

  const svgContent = fs.readFileSync(logoMarkSvgPath, 'utf8');

  // 1. Update app/icon.svg and public/favicon.svg with the CollegesHub mark
  fs.writeFileSync(path.join(appDir, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
  console.log('✔ Updated app/icon.svg and public/favicon.svg with CollegesHub mark');

  // 2. Render PNGs at various resolutions
  const sizes = [16, 32, 48, 96, 144, 180, 192, 512];
  const pngBuffers = {};

  for (const size of sizes) {
    const buf = await sharp(Buffer.from(svgContent))
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers[size] = buf;
  }

  // Save standalone PNGs
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), pngBuffers[16]);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), pngBuffers[32]);
  fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), pngBuffers[48]);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffers[180]);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngBuffers[192]);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngBuffers[512]);
  console.log('✔ Rendered PNG favicons (16x16, 32x32, 48x48, 180x180, 192x192, 512x512)');

  // 3. Create a valid multi-size .ico file containing 16x16, 32x32, 48x48 PNG frames
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(count, 4); // count

  const dirEntries = [];
  let offset = 6 + count * 16;
  const imageBuffers = [];

  for (const s of icoSizes) {
    const imgBuf = pngBuffers[s];
    imageBuffers.push(imgBuf);

    const entry = Buffer.alloc(16);
    entry.writeUInt8(s === 256 ? 0 : s, 0); // width
    entry.writeUInt8(s === 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(imgBuf.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);

    offset += imgBuf.length;
  }

  const icoBuffer = Buffer.concat([header, ...dirEntries, ...imageBuffers]);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✔ Generated multi-size favicon.ico (16, 32, 48px) in app/ and public/');

  // 4. Generate Open Graph 1200x630 image (og-image.png)
  const ogSvg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#051329" />
          <stop offset="50%" stop-color="#0b1e3b" />
          <stop offset="100%" stop-color="#07172f" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0A4D94" />
          <stop offset="100%" stop-color="#289A48" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" />
      
      <!-- Subtle grid background -->
      <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
        <line x1="0" y1="105" x2="1200" y2="105" />
        <line x1="0" y1="210" x2="1200" y2="210" />
        <line x1="0" y1="315" x2="1200" y2="315" />
        <line x1="0" y1="420" x2="1200" y2="420" />
        <line x1="0" y1="525" x2="1200" y2="525" />
        <line x1="200" y1="0" x2="200" y2="630" />
        <line x1="400" y1="0" x2="400" y2="630" />
        <line x1="600" y1="0" x2="600" y2="630" />
        <line x1="800" y1="0" x2="800" y2="630" />
        <line x1="1000" y1="0" x2="1000" y2="630" />
      </g>

      <!-- Top brand bar -->
      <rect x="0" y="0" width="1200" height="6" fill="url(#accent)" />

      <!-- Content text -->
      <g transform="translate(100, 230)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="800" fill="#ffffff" letter-spacing="-1">
          Collegeshub<tspan fill="#289A48">.org</tspan>
        </text>
        <text x="0" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="600" fill="#93c5fd">
          Smart College Management System
        </text>
        <text x="0" y="115" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">
          Admissions • Academics • Attendance • Fees • Examinations • Student Records
        </text>
      </g>

      <!-- Badge bottom left -->
      <rect x="100" y="470" width="280" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
      <text x="130" y="497" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#e2e8f0">
        🏛️ Modern Higher Education SaaS
      </text>
    </svg>
  `;

  // Overlay CollegesHub logo mark on the right side of OG image
  const markResized = await sharp(Buffer.from(svgContent))
    .resize(260, 260, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp(Buffer.from(ogSvg))
    .composite([
      {
        input: markResized,
        top: 185,
        left: 820
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));

  console.log('✔ Generated public/og-image.png (1200x630)');
}

generate().catch(err => {
  console.error('Favicon generation failed:', err);
  process.exit(1);
});
