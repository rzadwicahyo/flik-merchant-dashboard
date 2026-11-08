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
  // Growth Engine: one sidebar item, four tabs (My Brand, Competitor, Studio, Campaign), every account that can reach them
  ['?account=anon', '#gx'], ['?account=anon#studio', '#gx'], ['?account=anon&lang=en#studio/edit', '#gx'], ['?account=anon#marketing/growth', '#gx'], ['?account=anon#claim/DEMO', '#gx'],
  ['?account=lead', '#view-stu'], ['?account=lead#marketing/growth/competitors', '#view-cmp'], ['?account=lead#marketing/growth', '#view-brd'], ['?account=lead#marketing/growth/campaigns', '#view-gro'],
  ['?account=lead#marketing/growth/studio/new', '#gx'], ['?account=lead#studio/edit', '#gx'], ['?account=lead#home', '#view-stu'], ['?account=lead#marketing/growth/campaigns/new', '#view-gro'],
  ['#marketing/growth', '#view-brd'], ['#marketing/growth/competitors', '#view-cmp'], ['#marketing/growth/studio', '#view-stu'], ['#marketing/growth/campaigns', '#view-gro'],
  ['#marketing/growth/studio/new', '#gx'], ['#marketing/growth/campaigns/new', '#gx'], ['#studio/edit', '#gx'],
  // old links redirect into the tabs
  ['#marketing/studio', '#view-stu'], ['#marketing/competitors', '#view-cmp'], ['#studio/new', '#gx'], ['#marketing/growth/idea/i-1111', '#view-gro'],
  ['#marketing/growth/campaign/C-1042', '#view-gro'], ['?lang=id#marketing/growth/campaign/C-0987', '#view-gro'], ['#marketing/growth/campaign/demo', '#view-gro'], ['?account=anon#claim/ARU1101', '#gx'],
  ['?account=new#marketing/growth', '#view-brd'], ['?account=new#marketing/growth/competitors', '#view-cmp'], ['?account=new#marketing/growth/campaigns', '#view-gro'],
  ['?account=top#marketing/growth', '#view-brd'], ['?account=top#marketing/growth/competitors', '#view-cmp'], ['?account=top#marketing/growth/campaigns', '#view-gro'],
  ['?lang=id#marketing/growth', '#view-brd'], ['?lang=id#marketing/growth/competitors', '#view-cmp'], ['?lang=id#marketing/growth/studio/new', '#gx'], ['?lang=id#marketing/growth/campaigns/new', '#gx'],
  ['?live=0#marketing/growth/campaigns', '#view-gro'], ['?account=lead&lang=id#marketing/growth/competitors', '#view-cmp']
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
await page.goto(url + '#marketing/growth/campaigns'); await page.waitForTimeout(400);
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
  if (!ok || errors.length > n) { failed++; if (ok) console.log('FAIL studio flow' + errors.slice(n).map(e => '\n     ' + e).join('')); } else console.log('ok   studio flow: design, sign-up, download, lead dashboard, balance payment');
  await ctx.close(); }

// Growth Engine tabs: My Brand → Competitor (summary, action plan) → Studio create content → Campaign journey → results
{ const n = errors.length, ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }), gp = await ctx.newPage(), dl = [];
  gp.on('pageerror', e => errors.push(e.message)); gp.on('download', d => dl.push(d.suggestedFilename())); await gp.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const W = ms => gp.waitForTimeout(ms), hash = h => gp.evaluate(x => { location.hash = x }, h), txt = s => gp.textContent(s);
  let ok = true; const step = async (name, f) => { if (!ok) return; try { await f(); } catch (e) { ok = false; console.log('FAIL growth: ' + name + '\n     ' + e.message.split('\n')[0]); } };
  await step('lead one-time snapshot (private, marketplace, then a real look); My Brand and Campaign locked', async () => { await gp.goto(url + '?account=lead#marketing/growth/competitors'); await W(400);
    await gp.click('[data-cptry="private.label"]'); await gp.click('#cp-lead-f [type=submit]'); await W(1000); if (!(await txt('#cp-err')).includes('private')) throw new Error('no private state');
    await gp.fill('#cp-h', 'https://shopee.co.id/x'); await gp.click('#cp-lead-f [type=submit]'); await W(100); if (!/marketplace/i.test(await txt('#cp-err'))) throw new Error('marketplace not refused');
    await gp.click('[data-cptry="kain.kita.id"]'); await gp.click('#cp-lead-f [type=submit]'); await gp.waitForSelector('.cp-grid .cp-post');
    await gp.click('[data-getab="brd"]'); await W(300); if (!await gp.$('#view-brd .ge-locked')) throw new Error('My Brand not locked for a lead'); });
  await step('My Brand: socials and my FLIK store; a segment opens Create campaign', async () => { await gp.goto(url + '#marketing/growth'); await W(1000);
    if ((await gp.$$('#view-brd .b-ch')).length !== 4) throw new Error('expected 4 channel cards'); if (!(await txt('#view-brd')).includes('Top products')) throw new Error('no store section');
    await gp.click('[data-bseg="vip"]'); await W(500); if (!(await gp.evaluate(() => location.hash)).includes('campaigns/new') || !(await gp.evaluate(() => GS.cj.segs[0] === 'vip'))) throw new Error('segment not prefilled'); });
  await step('Competitor: summary by channel, channel tabs, AI-tagged post, add up to the limit, remove', async () => { await gp.goto(url + '#marketing/growth/competitors'); await W(1300);
    if ((await gp.$$('.cs-ch')).length !== 4) throw new Error('summary should have 4 channels'); if (!await gp.$('.cs-best')) throw new Error('no best highlighted');
    for (const c of ['fb', 'ads', 'web', 'ig']) await gp.click(`[data-cpch="${c}"]`); if (!await gp.$('.cp-post .ge-ai')) throw new Error('no AI-tagged post');
    if (!(await txt('.cs-grid')).includes('n/a')) throw new Error('no n/a for a number the fallback tool cannot give');
    await gp.click('.cp-list [data-cpadd]'); await gp.fill('#cp-ah', 'shopee.co.id/x'); await gp.click('#cp-find'); await W(100); if (!/marketplace/i.test(await txt('#cp-aerr'))) throw new Error('marketplace not refused in add');
    await gp.fill('#cp-ah', 'sare.basic'); await gp.click('#cp-find'); await gp.waitForSelector('#cp-afb', { timeout: 3000 });
    if ((await gp.inputValue('#cp-as')) !== 'sare-basic.example' || (await gp.inputValue('#cp-afb')) !== '') throw new Error('"Is this them?" did not show what was found');
    await gp.click('#cp-ago'); await W(300); if (!await gp.$('.cs-ld')) throw new Error('snapshot does not fill in channel by channel'); await W(2300);
    if (!(await txt('.cs-grid')).includes('Not found')) throw new Error('no "not found" state for the missing Facebook page'); if (await gp.$('.cp-list [data-cpadd]')) throw new Error('limit of 3 not applied');
    await gp.click('[data-cpch="fb"]'); await gp.click('[data-cpfix="sare.basic|fb"]'); await gp.fill('#cp-fx', 'facebook.com/sarebasic'); await gp.click('#cp-fxgo'); await W(2400);
    if (!(await gp.evaluate(() => { const c = CP.tracked.find(x => x.h === 'sare.basic'); return c.cs.fb === 'ok' && c.cs.ads === 'ok' && c.siteSt === 'ok' }))) throw new Error('fix link did not read Facebook and ads');
    await gp.click('[data-cprm="sare.basic"]'); await W(200); if (!await gp.$('.cp-list [data-cpadd]')) throw new Error('remove did not free a slot'); });
  await step('Refresh: free day-1 read, paid Refresh now (balance), price 0 makes it free', async () => {
    await gp.goto(url + '?r=1#marketing/growth/competitors'); await W(1000); const bal = await gp.evaluate(() => GS.balance); await gp.click('[data-cprefresh]'); await gp.click('#rf-go'); await W(300);
    if (!await gp.$('[data-cprefresh][disabled]')) throw new Error('refresh button not busy'); await W(2300);
    if (!(await gp.evaluate(b => GS.balance === b - GE_LIMITS.cpRefreshPrice && !CP.refreshing, bal))) throw new Error('refresh not charged');
    await gp.evaluate(() => { GE_LIMITS.cpRefreshPrice = 0; show() }); await gp.click('[data-cprefresh]'); if (!(await txt('#modal')).includes('Free for now')) throw new Error('price 0 is not free'); await gp.click('#rf-go'); await W(2500);
    if (!(await gp.evaluate(b => GS.balance === b - 5000, bal))) throw new Error('free refresh charged');
    const as = await gp.evaluate(() => { GE_LIMITS.cpRefreshPrice = 5000; GS.dayOffset = 25; const d = cpAsOf(CP.tracked[0]); GS.dayOffset = 0; return d.getDate() + '/' + (d.getMonth() + 1) });
    if (as !== '1/11') throw new Error('day-1 read not used: ' + as); });
  await step('Action plan: only fixed categories; a campaign action prefills Create campaign', async () => { await gp.click('[data-cpsel="kain.kita.id"]'); await W(300);
    const ks = await gp.evaluate(() => cpPlan(CP.tracked[0]).map(a => GE_ACTIONS[a.k] ? a.k : 'BAD:' + a.k)); if (!ks.length || ks.some(k => k.startsWith('BAD'))) throw new Error('plan: ' + ks);
    await gp.click('[data-cpgo="kain.kita.id|0"]'); await W(500); if (!(await gp.evaluate(() => GS.cj && GS.cj.from.cmp === 'kain.kita.id'))) throw new Error('not prefilled'); });
  await step('Studio: feed carousel, low match offers AI, pay with the watermark, download 3 slides', async () => { await hash('#marketing/growth/studio'); await W(500); await gp.click('#view-stu [data-stnew]'); await W(300);
    await gp.check('input[name=crch][value=feed]'); await gp.check('input[name=crfmt][value=carousel]'); await gp.click('[data-crnext]'); await W(200);
    await gp.click('[data-smp="linen-shirt"]'); await gp.fill('#cr-style', 'cyberpunk neon galaxy'); await gp.click('[data-crcap]'); await gp.click('[data-crnext]'); await W(1200);
    if (!await gp.$('.cr-low')) throw new Error('no AI offer below the match threshold'); await gp.click('.cr-low [data-crai]'); await gp.click('#cr-pgo'); await W(1800);
    if (!(await gp.evaluate(() => STU.design.vibeAi && STU.design.flikMark))) throw new Error('AI design not made'); await gp.click('[data-crnext]'); await W(500);
    await gp.click('#cr-dl'); await gp.click('#ex-go'); await W(1600); if (dl.filter(f => /-[123]\.png$/.test(f)).length !== 3) throw new Error('downloads: ' + dl.join(',')); await gp.waitForSelector('.cr-done'); });
  await step('Studio: AI from the balance', async () => { await gp.click('[data-crnew]'); await gp.click('[data-crnext]'); await gp.click('[data-smp="tote-bag"]'); await gp.check('#cr-ai'); const b = await gp.evaluate(() => GS.balance);
    await gp.click('[data-crnext]'); await W(400); await gp.check('input[name=crpm][value=balance]'); await gp.click('#cr-pgo'); await W(1800);
    if (await gp.evaluate(() => GS.balance) !== b - await gp.evaluate(() => GE_LIMITS.llmPrice)) throw new Error('AI not charged'); });
  await step('Studio WhatsApp: Send with FLIK → preview → Create campaign at Shoppers', async () => { await gp.click('[data-crnext]'); await W(500); await gp.click('#cr-send'); await W(300);
    await gp.selectOption('#cr-tpl', 'restock'); await W(200); if (!await gp.$('.ge-bub .ge-bbtn')) throw new Error('no template preview'); await gp.click('#cr-tocamp'); await W(500);
    const r = await gp.evaluate(() => ({ s: GS.cj.step, d: !!GS.cj.design, t: GS.cj.tpl })); if (r.s !== 'who' || !r.d || r.t !== 'restock') throw new Error(JSON.stringify(r)); });
  await step('Campaign journey: selected shoppers, cashback, rules, review, pay, Outbox', async () => { await gp.check('[data-cjseg="sel"]'); await gp.click('[data-cjnext]'); await W(200);
    await gp.fill('#cj-q', 'a'); await gp.click('[data-cjall]'); await gp.click('[data-cjnext]'); await gp.check('input[name=cjtype][value=cashback]'); await gp.click('[data-cjnext]'); await W(200);
    await gp.fill('#cjc-v', '25000'); await gp.dispatchEvent('#cjc-v', 'change'); await gp.click('[data-cjnext]'); await W(300);
    const bal = await gp.evaluate(() => GS.balance), n = await gp.evaluate(() => cjAud(GS.cj).send); await gp.click('#cj-go'); await W(800);
    const r = await gp.evaluate(() => ({ bal: GS.balance, h: location.hash, ob: GS.outbox.length, c: GE.camps[0] })); if (!(r.bal === bal - n * 500 && r.h.includes('campaign/C-') && r.ob >= 5 && r.c.type === 'cashback' && r.c.voucher.v === 25000)) throw new Error(JSON.stringify({ ...r, c: r.c.type })); });
  await step('Campaign tab: idea opens the journey; skip 7 days, CSV, end with report; metrics and list', async () => { await hash('#marketing/growth/campaigns'); await W(500);
    await gp.click('[data-gidea="i-1111"]'); await W(400); if (!(await gp.evaluate(() => GS.cj.idea === 'i-1111' && GS.cj.voucher.v === 10))) throw new Error('idea not prefilled');
    await hash('#marketing/growth/campaigns'); await W(300); await gp.click('.pbar [data-ge="skip"]'); await W(300);
    if (!(await txt('#view-gro')).includes('Sales by campaign')) throw new Error('no metrics by campaign');
    await hash('#marketing/growth/campaign/' + await gp.evaluate(() => GE.camps[0].id)); await W(300); await gp.click('[data-gcsv]'); await W(300); await gp.click('[data-gend]'); await W(300);
    if (await gp.evaluate(() => GS.outbox[0].template) !== 'campaign_report') throw new Error('no owner report'); if (!dl.some(f => f.endsWith('.csv'))) throw new Error('no CSV'); });
  await step('Saved design → Use in a campaign', async () => { await hash('#marketing/growth/studio'); await W(500); await gp.click('[data-stopen]'); await W(600); await gp.click('#st-use'); await W(400);
    if (!(await gp.evaluate(() => GS.cj && !!GS.cj.design))) throw new Error('design not carried'); });
  if (!ok || errors.length > n) { failed++; if (ok) console.log('FAIL growth flow' + errors.slice(n).map(e => '\n     ' + e).join('')); } else console.log('ok   growth engine flow: My Brand, Competitor summary + action plan, Studio create (AI paid), Send with FLIK, campaign journey, results');
  await ctx.close(); }

// Free public sources: live when they answer (mocked here), example data when they don't (everything else is blocked)
{ const n = errors.length, ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), lp = await ctx.newPage(); lp.on('pageerror', e => errors.push(e.message));
  await lp.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await lp.route(/date\.nager\.at\/api\/v3\/PublicHolidays\/\d+\/ID/, r => r.fulfill({ json: [{ date: '2026-12-25', localName: 'Hari Raya Natal', name: 'Christmas Day' }, { date: '2027-01-16', localName: 'Isra Mikraj', name: 'Ascension of the Prophet' }], headers: { 'access-control-allow-origin': '*' } }));
  await lp.route('https://toko-contoh.id/products.json?limit=12', r => r.fulfill({ json: { products: [{ title: 'Kemeja Uji', variants: [{ price: '199000.00', compare_at_price: '249000.00', available: true }], created_at: '2026-01-01', updated_at: '2026-01-01' }] }, headers: { 'access-control-allow-origin': '*' } }));
  let ok = true;
  try { await lp.goto(url + '#marketing/growth/campaigns'); await lp.waitForTimeout(1200);
    if (!(await lp.textContent('.g-cal')).includes('Ascension of the Prophet')) throw new Error('live holidays not shown');
    await lp.goto(url + '#marketing/growth/competitors'); await lp.waitForTimeout(800); await lp.click('.cp-list [data-cpadd]'); await lp.fill('#cp-ah', 'toko.contoh'); await lp.click('#cp-find'); await lp.waitForSelector('#cp-as'); await lp.fill('#cp-as', 'toko-contoh.id'); await lp.click('#cp-ago'); await lp.waitForTimeout(1200); await lp.click('[data-cpch="web"]');
    if (!(await lp.textContent('#view-cmp')).includes('Kemeja Uji')) throw new Error('live shop products not shown');
    await lp.goto(url + '?fresh=1#marketing/growth/competitors'); await lp.waitForTimeout(800); await lp.click('.cp-list [data-cpadd]'); await lp.fill('#cp-ah', 'toko.lain'); await lp.click('#cp-find'); await lp.waitForSelector('#cp-as'); await lp.fill('#cp-as', 'toko-lain.id'); await lp.click('#cp-ago'); await lp.waitForTimeout(1500); await lp.click('[data-cpch="web"]');
    if (!(await lp.textContent('#view-cmp')).includes('Read by FLIK')) throw new Error('blocked shop has no fallback state');
    await lp.goto(url + '?live=0#marketing/growth/campaigns'); await lp.waitForTimeout(600); if ((await lp.textContent('.g-cal')).includes('Ascension of the Prophet')) throw new Error('?live=0 still live');
  } catch (e) { ok = false; console.log('FAIL live sources: ' + e.message.split('\n')[0]); }
  if (!ok || errors.length > n) { failed++; if (ok) console.log('FAIL live sources' + errors.slice(n).map(e => '\n     ' + e).join('')); } else console.log('ok   free public sources: live holidays, live shop, fallback states, ?live=0');
  await ctx.close(); }

await browser.close(); srv.kill();
console.log(failed ? `${failed} check(s) failed` : 'All screens load without errors');
process.exit(failed ? 1 : 0);
