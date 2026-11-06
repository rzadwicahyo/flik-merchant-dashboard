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
  ['?account=lead', '#view-stu'], ['?account=lead#marketing/competitors', '#view-cmp'], ['?account=lead#marketing/growth', '#view-gro'], ['?account=lead#studio/edit', '#gx'], ['?account=lead#home', '#view-stu'], ['#studio/new', '#gx'],
  ['?account=new#marketing/growth', '#view-gro'], ['?account=top#marketing/competitors', '#view-cmp'],
  ['#marketing/growth', '#view-gro'], ['#marketing/studio', '#view-stu'], ['#marketing/competitors', '#view-cmp'], ['#studio/edit', '#gx'],
  ['#marketing/growth/idea/demo', '#gx'], ['#marketing/growth/campaign/demo', '#view-gro'], ['?lang=id#marketing/growth', '#view-gro'],
  // Competitors + Growth Engine (B1–B3, C1–C5): every idea, the seeded campaigns, the claim page, both languages, live sources off
  ...['i-1111', 'i-kk-sale', 'i-second', 'i-sumpah', 'i-best'].map(i => [`#marketing/growth/idea/${i}`, '#gx']), ['?account=new#marketing/growth/idea/i-1111', '#gx'], ['?account=top#marketing/growth', '#view-gro'],
  ['#marketing/growth/campaign/C-1042', '#view-gro'], ['?lang=id#marketing/growth/campaign/C-0987', '#view-gro'], ['?account=anon#claim/ARU1101', '#gx'], ['?account=new#marketing/competitors', '#view-cmp'],
  ['?lang=id#marketing/competitors', '#view-cmp'], ['?live=0#marketing/growth', '#view-gro'], ['?account=lead&lang=id#marketing/competitors', '#view-cmp']
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

// Studio: stranger designs, signs up with the WhatsApp code, downloads; then a merchant pays from the balance
{ const n = errors.length, ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }), sp = await ctx.newPage(), dl = [];
  sp.on('pageerror', e => errors.push(e.message)); sp.on('download', d => dl.push(d.suggestedFilename())); await sp.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  let ok = true; const step = async (name, f) => { if (!ok) return; try { await f(); } catch (e) { ok = false; console.log('FAIL studio: ' + name + '\n     ' + e.message.split('\n')[0]); } };
  await step('public page', async () => { await sp.goto(url + '?account=anon'); await sp.waitForSelector('[data-smp="cookie-jar"]'); });
  await step('design', async () => { await sp.click('[data-smp="cookie-jar"]'); await sp.click('#st-go'); await sp.waitForSelector('.st-main img', { timeout: 9000 }); });
  await step('editor tabs', async () => { for (const t of ['text', 'format', 'brand', 'cut', 'scene']) await sp.click(`[data-stab="${t}"]`); await sp.click('[data-fmt]').catch(() => {}); });
  await step('show me 4 more', async () => { await sp.click('#st-more'); await sp.waitForSelector('.st-main img', { timeout: 5000 }); });
  await step('sign-up', async () => { await sp.click('#st-dl'); await sp.click('[data-sufill]'); await sp.click('#su-send'); await sp.fill('#su-code', '123456'); await sp.click('#su-ok'); await sp.waitForSelector('#ex-go'); });
  await step('download', async () => { await sp.click('#ex-go'); await sp.waitForTimeout(1500); if (dl.length < 3) throw new Error('expected 3 files, got ' + dl.length); });
  await step('lead dashboard', async () => { await sp.click('#ex-dash'); await sp.waitForSelector('#view-stu .st-card'); });
  await step('merchant pays from balance', async () => { await sp.goto(url + '#studio/new'); await sp.evaluate(() => { GE_LIMITS.freeExportsPerMonth.active = 0 }); await sp.click('[data-smp="serum-bottle"]'); await sp.click('#st-go');
    await sp.waitForSelector('.st-main img', { timeout: 9000 }); await sp.click('#st-dl'); await sp.click('#ex-go'); await sp.waitForTimeout(800);
    if (!(await sp.evaluate(() => GS.balance === GE_BALANCE - GE_LIMITS.exportPrice))) throw new Error('balance not debited'); });
  if (!ok || errors.length > n) { failed++; if (ok) console.log('FAIL studio flow' + errors.slice(n).map(e => '\n     ' + e).join('')); } else console.log('ok   studio flow: design, sign-up, download, lead dashboard, balance payment');
  await ctx.close(); }

// Competitors and Growth Engine: the demo script from BUILD_SPEC section 2, steps 4 to 8
{ const n = errors.length, ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }), gp = await ctx.newPage(), dl = [];
  gp.on('pageerror', e => errors.push(e.message)); gp.on('download', d => dl.push(d.suggestedFilename())); await gp.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const W = ms => gp.waitForTimeout(ms), hash = h => gp.evaluate(x => { location.hash = x }, h);
  let ok = true; const step = async (name, f) => { if (!ok) return; try { await f(); } catch (e) { ok = false; console.log('FAIL growth: ' + name + '\n     ' + e.message.split('\n')[0]); } };
  await step('lead one-time snapshot (private, marketplace, then a real look)', async () => { await gp.goto(url + '?account=lead#marketing/competitors'); await W(400);
    await gp.click('[data-cptry="private.label"]'); await gp.click('#cp-lead-f [type=submit]'); await W(1000); if (!(await gp.textContent('#cp-err')).includes('private')) throw new Error('no private state');
    await gp.fill('#cp-h', 'https://shopee.co.id/x'); await gp.click('#cp-lead-f [type=submit]'); await W(100); if (!/marketplace/i.test(await gp.textContent('#cp-err'))) throw new Error('marketplace not refused');
    await gp.click('[data-cptry="kain.kita.id"]'); await gp.click('#cp-lead-f [type=submit]'); await gp.waitForSelector('.cp-grid .cp-post'); });
  await step('merchant adds a competitor; unsupported site; AI-tagged post', async () => { await gp.goto(url + '#marketing/competitors'); await W(1200);
    for (const t of ['products', 'activity', 'posts']) await gp.click(`[data-cptab="${t}"]`); if (!await gp.$('.cp-post .ge-ai')) throw new Error('no AI-tagged post');
    await gp.click('.cp-list [data-cpadd]'); await gp.fill('#cp-ah', 'sare.basic'); await gp.fill('#cp-as', 'sare-basic.example'); await gp.click('#cp-ago'); await W(1100);
    if (!(await gp.textContent('#view-cmp')).includes("isn't supported")) throw new Error('no unsupported state'); });
  await step('get an idea from a competitor move', async () => { await gp.click('[data-cpsel="lunaloom.co"]'); await gp.click('[data-cptab="activity"]'); await gp.click('[data-cpidea^="lunaloom.co|"]'); await W(500);
    if (!(await gp.evaluate(() => location.hash)).includes('idea/i-c')) throw new Error('no idea opened'); });
  await step('11.11 idea: adjust voucher, own context, template', async () => { await hash('#marketing/growth/idea/i-1111'); await W(500); await gp.click('.gi-foot [data-gstep="2"]');
    await gp.fill('#gv-v', '5'); await gp.dispatchEvent('#gv-v', 'change'); await gp.fill('#g-ctx', 'we have a new batik collection'); await gp.click('[data-gctx]'); await W(1500);
    if (!(await gp.textContent('#gi')).includes('batik')) throw new Error('own context not applied'); await gp.selectOption('#g-tpl', 'big_date'); });
  await step('execute: pay from balance, Outbox, post kit, poster', async () => { const bal = await gp.evaluate(() => GS.balance); await gp.click('.gi-foot [data-gstep="3"]'); await gp.click('#gi-go'); await W(2200);
    const r = await gp.evaluate(() => ({ bal: GS.balance, h: location.hash, ob: GS.outbox.length })); if (!(r.bal < bal && r.h.includes('campaign/C-') && r.ob >= 6)) throw new Error(JSON.stringify(r));
    if (!dl.some(f => f.endsWith('poster-a5.png')) || !dl.some(f => f.endsWith('caption.txt'))) throw new Error('downloads: ' + dl.join(',')); });
  await step('poster QR opens the claim page', async () => { const r = await gp.evaluate(() => { const c = GE.camps[0], m = geQR(geClaimUrl(c)); return m.length >= 21 && m.length % 4 === 1 && m[0][0] && m[6][6] && !m[7][7]; }); if (!r) throw new Error('bad QR matrix'); });
  await step('skip 7 days, CSV, claim, cashier redeem, end with report', async () => { await gp.click('.pbar [data-ge="skip"]'); await W(300); await gp.click('[data-gcsv]'); await W(300);
    await hash('#claim/' + await gp.evaluate(() => GE.camps[0].code)); await W(300); await gp.fill('#gc-ph', '081299990001'); await gp.check('#gc-cons'); await gp.click('#gc-f [type=submit]'); await gp.waitForSelector('.gc-ok');
    await hash('#marketing/growth'); await W(300); await gp.click('.pbar [data-ge="cashier"]'); await gp.click('[data-gkph]'); await gp.click('[data-gkr]'); await gp.keyboard.press('Escape');
    if (await gp.evaluate(() => GE.camps[0].cashier) !== 1) throw new Error('not redeemed');
    await hash('#marketing/growth/campaign/' + await gp.evaluate(() => GE.camps[0].id)); await W(300); await gp.click('[data-gend]'); await W(300);
    if (await gp.evaluate(() => GS.outbox[0].template) !== 'campaign_report') throw new Error('no owner report'); if (!dl.some(f => f.endsWith('.csv'))) throw new Error('no CSV'); });
  await step('Studio: Use in a campaign, and the round trip from an idea', async () => { await hash('#marketing/studio'); await W(600); await gp.click('[data-stopen="0"]'); await W(600); await gp.click('#st-use'); await gp.click('[data-pi="i-best"]'); await W(400);
    if (await gp.evaluate(() => GE.drafts['i-best'].step) !== 2) throw new Error('picker');
    await hash('#marketing/growth/idea/i-second'); await W(400); await gp.click('.gi-foot [data-gstep="2"]'); await gp.click('[data-gstudio="new"]'); await W(500); await gp.click('#st-go'); await gp.waitForSelector('.st-main img', { timeout: 9000 }); await gp.click('#st-use'); await W(500);
    const r = await gp.evaluate(() => ({ h: location.hash, d: GE.drafts['i-second'].design })); if (!r.h.includes('i-second') || !r.d) throw new Error(JSON.stringify(r)); });
  if (!ok || errors.length > n) { failed++; if (ok) console.log('FAIL growth flow' + errors.slice(n).map(e => '\n     ' + e).join('')); } else console.log('ok   competitors + growth flow: snapshot, tracking, idea, adjust, execute, results, claim, cashier, report, Studio');
  await ctx.close(); }

// Free public sources: live when they answer (mocked here), example data when they don't (everything else is blocked)
{ const n = errors.length, ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), lp = await ctx.newPage(); lp.on('pageerror', e => errors.push(e.message));
  await lp.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await lp.route(/date\.nager\.at\/api\/v3\/PublicHolidays\/\d+\/ID/, r => r.fulfill({ json: [{ date: '2026-12-25', localName: 'Hari Raya Natal', name: 'Christmas Day' }, { date: '2027-01-16', localName: 'Isra Mikraj', name: 'Ascension of the Prophet' }], headers: { 'access-control-allow-origin': '*' } }));
  await lp.route('https://toko-contoh.id/products.json?limit=12', r => r.fulfill({ json: { products: [{ title: 'Kemeja Uji', variants: [{ price: '199000.00', compare_at_price: '249000.00', available: true }], created_at: '2026-01-01', updated_at: '2026-01-01' }] }, headers: { 'access-control-allow-origin': '*' } }));
  let ok = true;
  try { await lp.goto(url + '#marketing/growth'); await lp.waitForTimeout(1200);
    if (!(await lp.textContent('.g-cal')).includes('Ascension of the Prophet')) throw new Error('live holidays not shown');
    await lp.goto(url + '#marketing/competitors'); await lp.waitForTimeout(800); await lp.click('.cp-list [data-cpadd]'); await lp.fill('#cp-ah', 'toko.contoh'); await lp.fill('#cp-as', 'toko-contoh.id'); await lp.click('#cp-ago'); await lp.waitForTimeout(1200);
    if (!(await lp.textContent('#view-cmp')).includes('Kemeja Uji')) throw new Error('live shop products not shown');
    await lp.goto(url + '?fresh=1#marketing/competitors'); await lp.waitForTimeout(800); await lp.click('.cp-list [data-cpadd]'); await lp.fill('#cp-ah', 'toko.lain'); await lp.fill('#cp-as', 'toko-lain.id'); await lp.click('#cp-ago'); await lp.waitForTimeout(1500);
    if (!(await lp.textContent('#view-cmp')).includes('Read weekly by FLIK')) throw new Error('blocked shop has no fallback state');
    await lp.goto(url + '?live=0#marketing/growth'); await lp.waitForTimeout(600); if ((await lp.textContent('.g-cal')).includes('Ascension of the Prophet')) throw new Error('?live=0 still live');
  } catch (e) { ok = false; console.log('FAIL live sources: ' + e.message.split('\n')[0]); }
  if (!ok || errors.length > n) { failed++; if (ok) console.log('FAIL live sources' + errors.slice(n).map(e => '\n     ' + e).join('')); } else console.log('ok   free public sources: live holidays, live shop, fallback states, ?live=0');
  await ctx.close(); }

await browser.close(); srv.kill();
console.log(failed ? `${failed} check(s) failed` : 'All screens load without errors');
process.exit(failed ? 1 : 0);
