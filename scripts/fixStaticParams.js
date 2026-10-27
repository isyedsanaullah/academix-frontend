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
  const dir = path.dirname(rel);
  // Extract param name: [id] -> id, [token] -> token, [college-shortcut] -> college-shortcut
  const seg = dir.split('/').pop();
  const param = seg.replace(/\[/g, '').replace(/\]/g, '');

  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    console.log('MISSING:', rel);
    return;
  }

  let content = fs.readFileSync(p, 'utf8');

  // Replace empty return with a single dummy entry so Next.js is satisfied.
  // The .htaccess SPA fallback serves /index.html for real routes — the
  // dummy-generated page is never actually used in production.
  if (content.includes('return [];')) {
    const dummy = '[{"' + param + '":"_"}]';
    content = content.replace('return [];', 'return ' + dummy + ';');
    fs.writeFileSync(p, content, 'utf8');
    console.log('FIXED', rel, '-> { ' + param + ': "_" }');
  } else {
    console.log('SKIP (no empty return):', rel);
  }
});

console.log('\nDone fixing', pages.length, 'pages.');
