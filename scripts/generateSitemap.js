'use strict';

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.collegeshub.org';

async function generate() {
  const publicDir = path.resolve(__dirname, '..', 'public');
  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch public active colleges if available
  const collegeSlugs = [];
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://academix-backend-8zcg.onrender.com/api').replace(/\/api\/?$/, '');
    const res = await fetch(`${apiUrl}/api/public/colleges`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      const list = json?.data || [];
      for (const c of list) {
        const slug = c.slug || c.code;
        if (slug && c.status === 'active') {
          collegeSlugs.push(slug);
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch colleges for static sitemap fallback, continuing with core routes');
  }

  // 2. Build XML sitemap
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const coreRoutes = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/request-subscription/', priority: '0.9', changefreq: 'monthly' },
    { path: '/login/', priority: '0.7', changefreq: 'monthly' },
    { path: '/terms/', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy-policy/', priority: '0.5', changefreq: 'monthly' },
  ];

  for (const route of coreRoutes) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${route.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const slug of collegeSlugs) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/college/${slug}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  console.log(`✔ Generated public/sitemap.xml with ${coreRoutes.length + collegeSlugs.length} URLs`);

  // 3. Build robots.txt
  const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /super-admin/
Disallow: /admin/
Disallow: /teacher/
Disallow: /student/
Disallow: /principal/
Disallow: /registrar/
Disallow: /accountant/
Disallow: /employee/
Disallow: /onboarding/
Disallow: /setup/
Disallow: /set-password/
Disallow: /verify/
Disallow: /verify-email
Disallow: /api/
Disallow: /_next/

User-agent: Googlebot-Image
Allow: /favicon.ico
Allow: /favicon.svg
Allow: /logo-mark.svg
Allow: /logo.svg
Allow: /logo-horizontal.svg
Allow: /icon.svg
Allow: /og-image.png
Allow: /apple-touch-icon.png

Sitemap: ${BASE_URL}/sitemap.xml
Host: ${BASE_URL}
`;

  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8');
  console.log('✔ Generated public/robots.txt');
}

generate().catch(err => {
  console.error('Sitemap generator failed:', err);
  process.exit(1);
});
