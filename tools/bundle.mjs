// Builds dist/flik-shipping-prototype.html: one file with every style, script and courier
// logo inlined, for sharing without a server. It always runs on example data.
// Usage: npm run bundle
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
let html = read('index.html');

html = html.replace('<link rel="stylesheet" href="app/app.css">', () => `<style>\n${read('app/app.css')}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  if (/^https?:/.test(src)) return m;
  let js = read(src);
  if (src === 'config.js') js = js.replace(/mode\s*:\s*'[a-z]+'/, "mode:'mock'");
  return `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;
});

// courier logos as data URIs (index.html builds each path as 'assets/couriers/'+k+'.png')
const logos = {};
for (const f of readdirSync(join(ROOT, 'assets/couriers'))) if (f.endsWith('.png'))
  logos[f.slice(0, -4)] = 'data:image/png;base64,' + readFileSync(join(ROOT, 'assets/couriers', f)).toString('base64');
const LOGO_SRC = "'assets/couriers/'+k+'.png'";
if (!html.includes(LOGO_SRC)) throw new Error('Logo path not found in index.html: re-check tools/bundle.mjs against tools/vendor.mjs');
html = html.replace(LOGO_SRC, () => `(FLIK_LOGOS[k]||${LOGO_SRC})`);
html = html.replace('</head>', () => `<script>window.FLIK_LOGOS=${JSON.stringify(logos)};</script>\n</head>`);

// the template download points at the published copy
html = html.split('href="assets/templates/').join('href="https://rzadwicahyo.github.io/flik-merchant-dashboard/assets/templates/');

mkdirSync(join(ROOT, 'dist'), { recursive: true });
const out = join(ROOT, 'dist/flik-shipping-prototype.html');
writeFileSync(out, html);
console.log(`Wrote ${out} (${Math.round(html.length / 1024)} KB)`);
