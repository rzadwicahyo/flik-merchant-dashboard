// Rebuilds index.html from Raam's reference dashboard (raam-flik/flik-design-system).
// Run it only when the design system changes: `npm run vendor` (DS=/path/to/flik-design-system).
// The FLIK Shipping prototype itself lives in app/ and is loaded on top of the vendored page.
import { readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DS = process.env.DS || join(ROOT, '..', 'flik-design-system');
const SRC = join(DS, 'dashboard', 'index.html');
if (!existsSync(SRC)) { console.error(`Can't find ${SRC}. Clone raam-flik/flik-design-system next to this repo or set DS.`); process.exit(1); }

let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD', { cwd: DS }).toString().trim(); } catch {}

let src = readFileSync(SRC, 'utf8');
const rep = (a, b) => { if (!src.includes(a)) { console.error('Patch target missing:\n' + a.slice(0, 120)); process.exit(1); } src = src.replace(a, b); };

// 1. Title, robots and a note about where the page comes from
rep('<title>FLIK Dashboard</title>', `<title>FLIK Shipping prototype</title>\n<meta name="robots" content="noindex">\n<!-- Vendored from raam-flik/flik-design-system dashboard/index.html @ ${commit} by tools/vendor.mjs. Don't edit by hand: the prototype lives in app/. -->`);
rep('family=Inter:wght@400;500;600&display=swap', 'family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

// 2. Courier logos are served from this repo, not from the design system's live host
const logoLine = src.split('\n').find(l => l.startsWith('const LOGO='));
rep(logoLine, "const LOGO=Object.fromEntries(['anteraja','sicepat','lion','jne','ninja','spx','jnt','tiki','idexpress','sap','rpx','wahana'].map(k=>[k,'assets/couriers/'+k+'.png']));");

// 3. The router starts once the prototype scripts are loaded (app/boot.js)
rep("document.getElementById('baladd').onclick=topupModal;\nshow(hashView());", "document.getElementById('baladd').onclick=topupModal;");

// 4. Prototype styles and scripts
rep('</style>\n</head>', '</style>\n<link rel="stylesheet" href="app/app.css">\n</head>');
const APP = ['config.js', 'app/api.js', 'app/core.js', 'app/data.js', 'app/home.js', 'app/shipment.js', 'app/bulk.js', 'app/monitoring.js', 'app/checkrate.js', 'app/analytics.js', 'app/boot.js'];
rep('</script>\n</body>', '</script>\n' + APP.map(s => `<script src="${s}"></script>`).join('\n') + '\n</body>');

writeFileSync(join(ROOT, 'index.html'), src);

// 5. Courier logos
const NAMES = { anteraja: 'anteraja', sicepat: 'sicepat', lion: 'lionparcel', jne: 'jne', ninja: 'ninjaxpress', spx: 'spx', jnt: 'jnt', tiki: 'tiki', idexpress: 'idexpress', sap: 'sap', rpx: 'rpx', wahana: 'wahana' };
const LD = join(DS, 'assets', 'Logos', 'courier');
for (const [k, f] of Object.entries(NAMES)) copyFileSync(join(LD, f + '.png'), join(ROOT, 'assets', 'couriers', k + '.png'));
console.log(`index.html rebuilt from design system @ ${commit}; ${Object.keys(NAMES).length} courier logos copied (${readdirSync(LD).length} files in the design system)`);
