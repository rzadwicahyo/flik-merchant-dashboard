// Smoke test: starts the local server, opens each screen in a headless browser and fails on any
// page error. Needs Playwright (`npm i -D playwright && npx playwright install chromium`).
// Usage: npm test
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.log('Playwright is not installed, so the smoke test was skipped. Install it with: npm i -D playwright && npx playwright install chromium'); process.exit(0); }

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5199;
const srv = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), FLIK_API_BASE: '', FLIK_API_KEY: '' }, stdio: 'ignore' });
const url = `http://localhost:${PORT}/`;
for (let i = 0; i < 50; i++) { try { await fetch(url); break; } catch { await new Promise(r => setTimeout(r, 100)); } }

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());

const screens = [
  ['?merchant=new#home', '#view-home'], ['?merchant=new#shipments', '#view-shp'],
  ['#home', '#view-home'], ['#shipments/create', '#sx'], ['#monitoring', '#view-mon'],
  ['#check-rate', '#view-cr'], ['#analytics/shipping', '#view-ana'], ['#warehouses', '#view-wh'],
  ['?products=ship#home', '#view-home'], ['?products=all#home', '#view-home']
];
let failed = 0;
for (const [path, sel] of screens) {
  const before = errors.length;
  await page.goto(url + path); await page.waitForTimeout(500);
  const visible = await page.$eval(sel, el => !el.hidden && el.getBoundingClientRect().width > 0).catch(() => false);
  const ok = visible && errors.length === before;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${path}${visible ? '' : ` (${sel} not visible)`}${errors.slice(before).map(e => '\n     ' + e).join('')}`);
}
// Monitoring tabs
await page.goto(url + '#monitoring'); await page.waitForTimeout(400);
for (const t of ['health', 'perf', 'list', 'tickets', 'summary']) { const n = errors.length; await page.click(`[data-mt="${t}"]`); await page.waitForTimeout(150); if (errors.length > n) { failed++; console.log('FAIL monitoring tab ' + t); } }

await browser.close(); srv.kill();
console.log(failed ? `${failed} check(s) failed` : 'All screens load without errors');
process.exit(failed ? 1 : 0);
