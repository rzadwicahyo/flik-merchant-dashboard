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

// 4b. Raam's v4 create flow, with Reza's 24 Oct decisions: one batch = one warehouse + one courier service,
//     and plain words for the delivery rate. The rest of the changes are in app/flow.js.
rep("const nBatches=()=>new Set(X.ships.map((s,i)=>svcFor(i))).size+(X.held||[]).length;",
  "const nBatches=()=>new Set(X.ships.map((s,i)=>svcFor(i)+'|'+whOf(s).k)).size+(X.held||[]).length;");
rep("/* one batch per courier service, whatever the number of warehouses; each warehouse is a pickup inside the batch */",
  "/* one batch per warehouse and courier service */");
rep("const G=groups(),byV=new Map();G.forEach(g=>{if(!byV.has(g.v))byV.set(g.v,[]);byV.get(g.v).push(g)});const bOf=new Map(),ids=[];\n    byV.forEach((gs,v)=>{const id=bid(),sv=SERVICES[v];ids.push(id);bOf.set(v,id);",
  "const G=groups(),byV=new Map();G.forEach(g=>byV.set(g.v+'|'+g.w.k,[g]));const bOf=new Map(),ids=[];\n    byV.forEach((gs,kk)=>{const v=gs[0].v,id=bid(),sv=SERVICES[v];ids.push(id);bOf.set(kk,id);");
rep("rows:G.map(g=>({id:bOf.get(g.v),", "rows:G.map(g=>({id:bOf.get(g.v+'|'+g.w.k),");
rep("batches:[...byV].map(([v,gs])=>({id:bOf.get(v),v,", "batches:[...byV].map(([kk,gs])=>({id:bOf.get(kk),v:gs[0].v,");
rep("${nb===1?`One batch: ${svName(G[0].v)} picks up ${parcels(n)}${nW===1?` from ${G[0].w.n}`:` from your ${nW} warehouses`}.`:`${nb} batches, one per courier. Each courier picks up its batch from every warehouse in it.`}",
  "${G.length===1?`One batch: ${svName(G[0].v)} picks up ${parcels(n)} from ${G[0].w.n}.`:`${G.length} batches, one for each warehouse and courier service.`}");
rep("Delivery rates come from FLIK shipments to the same kecamatan in the last 90 days.",
  "Delivered means: of all the parcels a courier carried to the same kecamatans as your orders in the last 90 days, for every FLIK merchant, how many arrived.");
rep("${pct(ST[rec].rate)} delivered in your shoppers' areas, with none of your parcels in its red zone.",
  "Delivers best where your orders are going: ${pct(ST[rec].rate)} of its parcels there arrived in the last 90 days, and it can take every order.");

// 4. Prototype styles and scripts
rep('</style>\n</head>', '</style>\n<link rel="stylesheet" href="app/app.css">\n</head>');
const APP = ['config.js', 'app/api.js', 'app/core.js', 'app/data.js', 'app/home.js', 'app/shipment.js', 'app/flow.js', 'app/monitoring.js', 'app/checkrate.js', 'app/analytics.js', 'app/boot.js'];
rep('</script>\n</body>', '</script>\n' + APP.map(s => `<script src="${s}"></script>`).join('\n') + '\n</body>');

writeFileSync(join(ROOT, 'index.html'), src);

// 5. Courier logos
const NAMES = { anteraja: 'anteraja', sicepat: 'sicepat', lion: 'lionparcel', jne: 'jne', ninja: 'ninjaxpress', spx: 'spx', jnt: 'jnt', tiki: 'tiki', idexpress: 'idexpress', sap: 'sap', rpx: 'rpx', wahana: 'wahana' };
const LD = join(DS, 'assets', 'Logos', 'courier');
for (const [k, f] of Object.entries(NAMES)) copyFileSync(join(LD, f + '.png'), join(ROOT, 'assets', 'couriers', k + '.png'));
console.log(`index.html rebuilt from design system @ ${commit}; ${Object.keys(NAMES).length} courier logos copied (${readdirSync(LD).length} files in the design system)`);
