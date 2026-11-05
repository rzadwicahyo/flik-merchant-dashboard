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
  ['#check-rate', '#view-cr'], ['#shipping/analytics', '#view-ana'], ['#warehouses', '#view-wh'],
  ['?products=ship#home', '#view-home'], ['?products=all#home', '#view-home'], ['?merchant=new&products=ship#home', '#view-home'],
  // Growth Engine v2 + Studio: every route for each account that can reach it
  ['?account=anon', '#gx'], ['?account=anon#studio', '#gx'], ['?account=anon&lang=en#studio/edit', '#gx'], ['?account=anon#marketing/growth', '#gx'], ['?account=anon#claim/DEMO', '#gx'],
  ['?account=lead', '#view-stu'], ['?account=lead#marketing/competitors', '#view-cmp'], ['?account=lead#marketing/growth', '#view-gro'], ['?account=lead#studio/edit', '#gx'],
  ['?account=new#marketing/growth', '#view-gro'], ['?account=top#marketing/competitors', '#view-cmp'],
  ['#marketing/growth', '#view-gro'], ['#marketing/studio', '#view-stu'], ['#marketing/competitors', '#view-cmp'], ['#studio/edit', '#gx'],
  ['#marketing/growth/idea/demo', '#gx'], ['#marketing/growth/campaign/demo', '#view-gro'], ['?lang=id#marketing/growth', '#view-gro']
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

// Growth Engine v2 + Studio: prototype bar tools
await page.goto(url + '#marketing/growth'); await page.waitForTimeout(400);
for (const t of ['outbox', 'ledger', 'limits', 'skip', 'end', 'cashier']) { const n = errors.length; await page.click(`.pbar [data-ge="${t}"]`); await page.waitForTimeout(150); await page.keyboard.press('Escape'); if (errors.length > n) { failed++; console.log('FAIL prototype bar ' + t + errors.slice(n).map(e => '\n     ' + e).join('')); } }
{ const n = errors.length; await page.click('#pt-acct'); await page.click('[data-acc="anon"]'); await page.waitForTimeout(300);
  const onStudio = await page.$eval('#gx', el => !el.hidden).catch(() => false); if (!onStudio || errors.length > n) { failed++; console.log('FAIL account switch to Anonymous'); } }
{ const n = errors.length; const r = await page.evaluate(async () => { const a = useLimit('regenPerDesign', 'd1'), b = useLimit('regenPerDesign', 'd1'); const llm = await mockLLM('copy', {}); waSend('campaign_report', 'en', ['Dewi', '11.11', 'Rp6 jt', 'Rp2 jt', 'flik.id/r/1']);
    const d = await ledgerDebit(2000, 'Studio export'); return a.ok && !b.ok && llm.ai && GS.outbox.length > 0 && !!d.ledgerTxnId; });
  if (!r || errors.length > n) { failed++; console.log('FAIL shared helpers (limits, AI fallback, WhatsApp, ledger)'); } }

await browser.close(); srv.kill();
console.log(failed ? `${failed} check(s) failed` : 'All screens load without errors');
process.exit(failed ? 1 : 0);
