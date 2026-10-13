// Assembles a local page that runs the dashboard source (../dashboard/index.html) against a snapshot of the
// real BigQuery results (fixtures.js), so it can be screen-recorded outside Claude. Usage: node docs/build-harness.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const DOCS = fileURLToPath(new URL('.', import.meta.url));
const OUT = join(DOCS, 'harness');
mkdirSync(OUT, { recursive: true });

const page = readFileSync(join(DOCS, '..', 'dashboard', 'index.html'), 'utf8');
const fixtures = readFileSync(join(DOCS, 'fixtures.js'), 'utf8');
const stub = readFileSync(join(DOCS, 'harness-stub.js'), 'utf8');
copyFileSync(join(DOCS, '..', 'dashboard', 'usmap.js'), join(OUT, 'usmap.js'));

// Stand-ins for the design tokens Claude Dashboards provides at runtime.
const tokens = `
:root { --color-bg:#ffffff; --color-panel:#ffffff; --color-fg:#1a1a1a; --color-fg-muted:#666; --color-border-line:#e4e4e4; --color-ok:#15803d; --color-bad:#b91c1c;
  --font-anthropic-sans: "Segoe UI", system-ui, -apple-system, sans-serif; --font-anthropic-serif: Georgia, "Times New Roman", serif;
  --cds-radius: 8px; --cds-gap-xs:4px; --cds-gap-sm:8px; --cds-gap-md:16px; --cds-gap-lg:24px; --cds-pad-xs:4px; --cds-pad-sm:8px; --cds-pad-md:12px; --cds-pad-lg:16px;
  --cds-font-size-caption:12px; --cds-font-size-body:14px; --cds-font-size-heading:16px; --cds-font-size-title:28px; --cds-font-weight-medium:500;
  --cds-chart-grid:#ececec; --cds-surface-popover:#fff; --cds-border:#ddd; --cds-shadow-popover:0 6px 20px rgba(0,0,0,.15); --cds-text-secondary:#666;
  --cds-dur-slow:380ms; --cds-ease-out:cubic-bezier(.2,.8,.2,1); --cds-chart-status-critical:#dc2626; }
body { margin: 0; padding: 24px; background: #eceef2; font-family: var(--font-anthropic-sans); }
.dash-skeleton { background: #eee; }`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>dashboard</title><style>${tokens}</style>
<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script><script src="usmap.js"></script>
<script>${fixtures}</script><script>${stub}</script></head>
<body><div id="dash-root">${page}</div></body></html>`;
writeFileSync(join(OUT, 'index.html'), html);
console.log('harness written to', OUT);
