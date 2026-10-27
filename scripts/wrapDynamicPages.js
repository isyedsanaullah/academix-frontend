const fs = require('fs');
const path = require('path');

// Root of client-next (parent of scripts/)
const ROOT = path.resolve(__dirname, '..');

const pages = [
  'app/accountant/fees/receipt/[id]/page.js',
  'app/admin/fees/receipt/[id]/page.js',
  'app/admin/results/card/[id]/page.js',
  'app/admin/staff/[id]/page.js',
  'app/admin/students/[id]/page.js',
  'app/apply/[code]/page.js',
  'app/college/[college-shortcut]/page.js',
  'app/principal/staff/[id]/page.js',
  'app/principal/students/[id]/page.js',
  'app/register/invitation/[token]/page.js',
  'app/registrar/students/[id]/page.js',
  'app/super-admin/colleges/[id]/page.js',
  'app/verify/[token]/page.js'
];

const SERVER_WRAPPER = [
  "// Server component wrapper — required for Next.js static export.",
  "// generateStaticParams returns [] so no pages are pre-rendered;",
  "// the .htaccess SPA fallback handles all dynamic routes client-side.",
  "import ClientPage from './_client';",
  "",
  "export function generateStaticParams() {",
  "  return [];",
  "}",
  "",
  "export default function Page(props) {",
  "  return <ClientPage {...props} />;",
  "}",
  ""
].join('\n');

pages.forEach(rel => {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.log('MISSING:', rel); return; }

  const content = fs.readFileSync(p, 'utf8');

  // Skip if already wrapped
  if (content.includes('_client')) { console.log('SKIP (already wrapped):', rel); return; }

  // 1. Save original as _client.js
  const clientPath = p.replace('page.js', '_client.js');
  fs.writeFileSync(clientPath, content, 'utf8');

  // 2. Write thin server wrapper
  fs.writeFileSync(p, SERVER_WRAPPER, 'utf8');
  console.log('WRAPPED:', rel);
});

console.log('\nDone wrapping', pages.length, 'pages.');
