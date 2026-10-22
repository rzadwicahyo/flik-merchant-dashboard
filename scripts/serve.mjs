// Local server for the prototype. No dependencies: `npm start` (or `node scripts/serve.mjs`).
// Static files come from the repo root. Requests to /api/* are forwarded to FLIK's API when
// FLIK_API_BASE and FLIK_API_KEY are set, so the secret key stays on this machine and never
// reaches the browser. Without them, the page runs on its built-in example data.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// .env (optional): KEY=value lines
const envFile = join(ROOT, '.env');
if (existsSync(envFile)) for (const line of readFileSync(envFile, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const PORT = +process.env.PORT || 5173;
const API_BASE = (process.env.FLIK_API_BASE || '').replace(/\/$/, '');
const API_KEY = process.env.FLIK_API_KEY || '';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.csv': 'text/csv', '.md': 'text/markdown; charset=utf-8' };

async function proxy(req, res) {
  if (!API_BASE || !API_KEY) { res.writeHead(503, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'api_not_configured', message: 'Set FLIK_API_BASE and FLIK_API_KEY in .env to use the FLIK API. The page falls back to example data.' })); return; }
  const body = await new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
  try {
    const up = await fetch(API_BASE + req.url.replace(/^\/api/, ''), { method: req.method, headers: { 'content-type': req.headers['content-type'] || 'application/json', authorization: `Bearer ${API_KEY}` }, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
    res.writeHead(up.status, { 'content-type': up.headers.get('content-type') || 'application/json' });
    res.end(Buffer.from(await up.arrayBuffer()));
  } catch (e) { res.writeHead(502, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'api_unreachable', message: e.message })); }
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) return proxy(req, res);
  // the browser only learns whether the API proxy is on, never the key
  if (url.pathname === '/__flik/status') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ api: !!(API_BASE && API_KEY) })); return; }
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  if (p.startsWith('..') || /(^|[/\\])\./.test(p)) { res.writeHead(403); res.end('Forbidden'); return; }
  let file = join(ROOT, p || 'index.html');
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); const data = await readFile(file); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(data); }
  catch { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found'); }
}).listen(PORT, () => {
  console.log(`FLIK Shipping prototype: http://localhost:${PORT}`);
  console.log(API_BASE && API_KEY ? `API proxy on: /api/* → ${API_BASE}` : 'Example data (no FLIK_API_BASE / FLIK_API_KEY set)');
});
