const fs = require('fs');
const path = require('path');
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

pages.forEach(rel => {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.log('MISSING:', rel); return; }

  let content = fs.readFileSync(p, 'utf8');

  if (content.includes('force-static')) {
    console.log('SKIP (already has force-static):', rel);
    return;
  }

  // Insert export const dynamic = 'force-static' before the import line
  content = content.replace(
    'import ClientPage from',
    "export const dynamic = 'force-static';\nexport const dynamicParams = false;\nimport ClientPage from"
  );

  fs.writeFileSync(p, content, 'utf8');
  console.log('PATCHED:', rel);
});

console.log('\nDone.');
