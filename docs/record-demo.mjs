// Records a scripted walkthrough of the dashboard with a headless browser (DevTools protocol screenshots,
// no deps): real mouse hovers and clicks, a visible cursor, captions, title and end cards.
// Frames land in docs/demo-frames/ with timestamps; encode them with docs/encode-demo.mjs.
// Usage: node docs/build-harness.mjs && node docs/record-demo.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BROWSER = process.env.BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DOCS = fileURLToPath(new URL('.', import.meta.url));
const APP = pathToFileURL(join(DOCS, 'harness', 'index.html')).href;
const FRAMES = join(DOCS, 'demo-frames');
const PORT = 9335;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const KPI_SQL = readFileSync(join(DOCS, '..', 'queries', 'kpis.sql'), 'utf8');

rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });

const browser = spawn(BROWSER, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'demo-'))}`,
  '--window-size=1371,772', '--hide-scrollbars', '--allow-file-access-from-files', '--disable-gpu', 'about:blank',
]);

// ---------- minimal DevTools protocol client ----------
async function pageSocket() {
  for (let i = 0; i < 60; i++) {
    try {
      const page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('Browser did not start');
}
const ws = new WebSocket(await pageSocket());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let nextId = 1;
const pending = new Map();
const listeners = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method) listeners.get(msg.method)?.(msg.params);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
  ws.send(JSON.stringify({ id, method, params }));
});
const js = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'page error');
  return r.result.value;
};

// ---------- capture: a steady loop of DevTools screenshots ----------
// (the DevTools screencast stalls after the first scroll in some headless builds, so it is not used)
let frameCount = 0;
let recording = false;
const T0 = Date.now();
const log = (m) => console.log(((Date.now() - T0) / 1000).toFixed(1) + 's frames=' + frameCount + ' ' + m);
async function captureLoop() {
  while (recording) {
    const t = Date.now() / 1000;
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85, optimizeForSpeed: true });
    writeFileSync(join(FRAMES, `${String(frameCount++).padStart(5, '0')}_${t.toFixed(3)}.jpg`), Buffer.from(r.data, 'base64'));
  }
}
// ---------- in-page helpers: cursor, captions, cards, smooth scroll ----------
const HELPERS = `(() => {
  if (window.__d) return;
  const el = (css, html) => { const e = document.createElement('div'); Object.assign(e.style, css); if (html) e.innerHTML = html; document.body.append(e); return e; };
  const cur = el({ position: 'fixed', left: 0, top: 0, zIndex: 99999, pointerEvents: 'none', transition: 'transform .7s cubic-bezier(.4,0,.2,1)', transform: 'translate(1200px,700px)' },
    '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2l15 11-6.5 1.2L16 21l-3 1.4-3.4-6.6L4 20z" fill="#111" stroke="#fff" stroke-width="1.5"/></svg>');
  const ring = el({ position: 'fixed', width: '38px', height: '38px', borderRadius: '50%', border: '3px solid #2f5fe0', zIndex: 99998, pointerEvents: 'none', opacity: 0, transition: 'opacity .15s, transform .4s' });
  const cap = el({ position: 'fixed', left: '50%', bottom: '34px', transform: 'translateX(-50%)', zIndex: 99997, pointerEvents: 'none', opacity: 0, transition: 'opacity .35s',
    background: 'rgba(14,17,23,.9)', color: '#fff', padding: '12px 26px', borderRadius: '999px', font: '500 21px "Segoe UI", system-ui, sans-serif', width: 'max-content', maxWidth: '88vw', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,.3)' });
  const card = el({ position: 'fixed', inset: 0, zIndex: 99996, display: 'grid', placeItems: 'center', opacity: 0, pointerEvents: 'none', transition: 'opacity .5s', textAlign: 'center',
    background: 'radial-gradient(90% 120% at 0% 0%, #2f5fe0 0%, transparent 60%), radial-gradient(80% 110% at 100% 100%, #e8590c 0%, transparent 60%), #0d1117', color: '#fff', fontFamily: 'Georgia, serif' });
  const sqlBox = el({ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 99995, pointerEvents: 'none', opacity: 0, transition: 'opacity .4s',
    background: '#0d1117', color: '#d6deeb', borderRadius: '14px', padding: '22px 28px', width: '980px', maxWidth: '92%', boxShadow: '0 24px 70px rgba(0,0,0,.45)', border: '1px solid #283142' });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__d = {
    async glide(x, y, ms = 800) { cur.style.transform = 'translate(' + x + 'px,' + y + 'px)'; await wait(ms); },
    pulse(x, y) { Object.assign(ring.style, { left: x - 19 + 'px', top: y - 19 + 'px', opacity: 1, transform: 'scale(.6)' }); setTimeout(() => { ring.style.opacity = 0; ring.style.transform = 'scale(1.5)'; }, 260); },
    caption(t) { if (!t) { cap.style.opacity = 0; return; } cap.textContent = t; cap.style.opacity = 1; },
    card(html, on) { card.innerHTML = html; card.style.opacity = on ? 1 : 0; cur.style.opacity = on ? 0 : 1; },
    sql(title, text, on) {
      sqlBox.innerHTML = '<div style="font:600 16px Segoe UI,sans-serif;color:#7aa7ff;margin-bottom:10px">' + title + '</div><pre style="margin:0;font:15px/1.5 Consolas,monospace;white-space:pre-wrap;color:#d6deeb"></pre>';
      sqlBox.querySelector('pre').textContent = text; sqlBox.style.opacity = on ? 1 : 0;
    },
    scroll(y) { window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); },
  };
})()`;

// ---------- actions ----------
const point = async (expr, fx = 0.5, fy = 0.5) =>
  js(`(() => { const e = ${expr}; if (!e) throw new Error('not found: ' + ${JSON.stringify(expr)}); const r = e.getBoundingClientRect(); return [r.left + r.width * ${fx}, r.top + r.height * ${fy}]; })()`);
const mouse = (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: type === 'mouseMoved' ? 0 : 1 });
async function hover(expr, fx, fy) {
  const [x, y] = await point(expr, fx, fy);
  await js(`window.__d.glide(${x}, ${y})`);
  await mouse('mouseMoved', x, y);
}
// Visible cursor glide + click ring, then a DOM click (real mouse presses are unreliable in headless builds).
async function click(expr, fx, fy) {
  const [x, y] = await point(expr, fx, fy);
  await js(`window.__d.glide(${x}, ${y})`);
  await mouse('mouseMoved', x, y);
  await js(`window.__d.pulse(${x}, ${y})`);
  await sleep(150);
  await js(`(${expr}).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))`);
}
const caption = (t) => js(`window.__d.caption(${JSON.stringify(t)})`);
const scrollToEl = async (expr, offset = 120) => {
  await js(`(() => { const e = ${expr}; window.__d.scroll(e.getBoundingClientRect().top + scrollY - ${offset}); })()`);
  await sleep(900);
};
const top = async () => { await js('window.__d.scroll(0)'); await sleep(800); };
const tab = async (name) => {
  await click(`document.querySelector('#tab-${name}')`);
  await sleep(250);
};
const leaf = (dept, cat) =>
  `[...document.querySelectorAll('#ex-treemap rect')].find((r) => r.__data__ && r.__data__.data && r.__data__.data.category === ${JSON.stringify(cat)} && r.__data__.data.department === ${JSON.stringify(dept)})`;
const stateEl = (name) => `[...document.querySelectorAll('#ex-map path')].find((p) => p.__data__ && p.__data__[0] === ${JSON.stringify(name)})`;

// ---------- storyboard ----------
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1371, height: 772, deviceScaleFactor: 1.4, mobile: false });
await send('Page.navigate', { url: APP });
for (let i = 0; i < 60 && !(await js(`!!document.querySelector('#ex-treemap svg')`)); i++) await sleep(500);
await js(HELPERS);
// Warm every tab off camera so first views are already drawn.
for (const t of ['customers', 'products', 'operations', 'overview']) { await js(`document.querySelector('#tab-${t}').click()`); await sleep(900); }
await js('window.scrollTo(0, 0)');
await js(`window.__d.card('<div><div style="font-size:60px;letter-spacing:-.01em">TheLook e-commerce</div><div style="font:500 26px Segoe UI,sans-serif;margin-top:14px;opacity:.9">An executive dashboard built with Claude Dashboards over BigQuery</div></div>', true)`);
await sleep(600);

recording = true;
const loop = captureLoop();
console.log('recording…');
await sleep(3200);
await js(`window.__d.card('', false)`);
await sleep(700);

log('1. KPIs');
// 1. KPIs
await caption('Five KPIs with change vs the prior period and 12-month sparklines');
await sleep(4200);
log('2. Trend');
// 2. Trend
await scrollToEl(`document.querySelector('#ex-trend-card')`, 90);
await caption('Revenue trend with a 3-month average and a prior-year overlay');
await sleep(800);
await hover(`[...document.querySelectorAll('#ex-trend svg rect')].at(-1)`);
await sleep(2600);
await hover(`[...document.querySelectorAll('#ex-trend svg rect')].at(-8)`);
await sleep(2000);
log('3. Treemap drill-down');
// 3. Treemap drill-down
await scrollToEl(`document.querySelector('#ex-mix-card')`, 90);
await caption('Click any category and the whole dashboard drills into it');
await sleep(800);
await hover(leaf('Men', 'Outerwear & Coats'));
await sleep(1500);
await click(leaf('Men', 'Outerwear & Coats'));
await sleep(1200);
await top();
await caption('Every KPI, chart and table re-queries for Men › Outerwear & Coats');
await sleep(4800);
await click(`document.querySelector('#f-reset')`);
await caption('One click to clear it');
await sleep(2400);
log('4. SQL provenance');
// 4. SQL provenance
await js(`window.__d.sql('queries/kpis.sql: the query behind the headline KPIs', ${JSON.stringify(KPI_SQL.trim())}, true)`);
await caption('Every number is a live SQL query, one click from its source');
await sleep(5600);
await js(`window.__d.sql('', '', false)`);
await sleep(500);

log('5. Customers');
// 5. Customers
await tab('customers');
await caption('Cohort retention and who buys, straight from BigQuery');
await sleep(4500);
await scrollToEl(`document.querySelector('#ex-map-card')`, 90);
await caption('A real map: hover a state for details, click to filter everything');
await sleep(700);
await hover(stateEl('California'));
await sleep(2400);
await hover(stateEl('Texas'));
await sleep(2200);
await hover(stateEl('New York'));
await sleep(2200);
await top();

log('6. Products');
// 6. Products
await tab('products');
await caption('Sort, search and drill into 34 categories, with a calculated 12-month trend');
await sleep(1000);
await click(`document.querySelector('#ex-cat th[data-field="growth"]')`);
await sleep(2000);
await click(`document.querySelector('.ex-search[data-table="ex-cat"]')`);
for (const ch of 'jeans') { await send('Input.insertText', { text: ch }); await sleep(180); }
await sleep(3000);
await js(`(() => { const s = document.querySelector('.ex-search[data-table="ex-cat"]'); s.value = ''; s.dispatchEvent(new Event('input', { bubbles: true })); })()`);
await sleep(700);
await top();

log('7. Operations');
// 7. Operations
await tab('operations');
await caption('A session funnel that flags its biggest drop-off, plus fulfilment health');
await sleep(4200);
await scrollToEl(`document.querySelector('#ex-fulfil-card')`, 90);
await hover(`document.querySelectorAll('.ex-mini[data-metric="return_rate"] svg g circle')[7]`);
await sleep(2600);
await top();

log('8. Theme');
// 8. Theme
await caption('Light and dark themes for presenting');
await click(`document.querySelector('#ex-th-dark')`);
await sleep(1500);
await tab('overview');
await sleep(3600);
await caption('');
await js(`window.__d.card('<div><div style="font-size:54px">Question to auditable dashboard</div><div style="font:500 24px Segoe UI,sans-serif;margin-top:16px;opacity:.92">Claude Dashboards · BigQuery · thelook_ecommerce</div><div style="font:500 20px Consolas,monospace;margin-top:26px;opacity:.85">github.com/randomwanderer-cpu/claude-dashboards-thelook</div><div style="font:400 15px Segoe UI,sans-serif;margin-top:22px;opacity:.6">Synthetic public dataset. Query results snapshot taken 2026-10-13.</div></div>', true)`);
await sleep(4200);

recording = false;
await loop;
await sleep(500);
console.log(`saved ${frameCount} frames to ${FRAMES}`);
ws.close();
browser.kill();
