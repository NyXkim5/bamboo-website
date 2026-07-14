#!/usr/bin/env node
// Build a self-contained, searchable, INTERACTIVE HTML catalog from the skill
// registry. Every skill is pure zero-dependency ESM, so we embed each skill's
// source and run it live in the browser via a blob-module import — no server,
// no build step. Open catalog/index.html and click any skill to try it.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadSkills, buildRegistry } from "./registry.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "catalog", "index.html");

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// --- sample-input generators (so "Try it" works out of the box) ---
const SAMPLE = "Solar power adoption is accelerating worldwide. Solar panels are cheaper than ever before. Governments now offer generous subsidies for solar installation. Battery storage finally makes solar power reliable at night.";
const sine = (n, base, amp) => Array.from({ length: n }, (_, i) => Math.round((base + amp * Math.sin(i / 4)) * 100) / 100);
const ohlc = (n) => Array.from({ length: n }, (_, i) => {
  const c = 100 + 8 * Math.sin(i / 4);
  return { high: Math.round((c + 3) * 100) / 100, low: Math.round((c - 3) * 100) / 100, close: Math.round(c * 100) / 100 };
});

const EXAMPLES = {
  "design/palette-gen": { base: "#3b7a57", scheme: "analogous" },
  "design/contrast-check": { fg: "#3b7a57", bg: "#ffffff" },
  "design/gradient-gen": { from: "#3b7a57", to: "#f2c14e", stops: 5 },
  "design/oklch-convert": { hex: "#3b7a57" },
  "design/color-mix": { a: "#3b7a57", b: "#f2c14e", ratio: 0.5 },
  "design/nearest-css-color": { hex: "#3d7a55" },
  "design/tailwind-shades": { hex: "#3b7a57" },
  "design/type-scale": { base: 16, ratio: 1.25 },
  "design/spacing-tokens": { base: 4, steps: 6 },
  "design/shadow-scale": { levels: 5 },
  "design/aspect-ratios": { width: 1920, height: 1080 },
  "devtools/code-review": { code: "var x = 1\nconsole.log(x)\nif (x == 1) {}" },
  "devtools/conventional-commit": { message: "feat(api): add pagination" },
  "devtools/semver-bump": { current: "1.4.2", commits: ["fix", "feat"] },
  "devtools/test-scaffold": { signature: "export function addUser(name, email) {" },
  "devtools/env-validate": { env: { PORT: "3000" }, schema: { PORT: { type: "number" }, TOKEN: { required: true } } },
  "devtools/slugify": { text: "Hello, World! Cafe deja vu" },
  "devtools/gitignore-gen": { stacks: ["node", "macos", "vscode"] },
  "devtools/json-schema-infer": { value: { name: "Bao", age: 3, tags: ["panda"] } },
  "devtools/case-convert": { text: "getUserByID", to: "kebab" },
  "devtools/cron-describe": { expr: "0 9 * * 1-5" },
  "devtools/diff-summary": { diff: "--- a/x.js\n+++ b/x.js\n@@ -1,2 +1,3 @@\n a\n+b\n+c\n-d" },
  "finance/sma-backtest": { prices: sine(60, 100, 12), fast: 5, slow: 15 },
  "finance/rsi": { prices: sine(40, 100, 6), period: 14 },
  "finance/macd": { prices: sine(80, 100, 10) },
  "finance/bollinger": { prices: sine(40, 100, 6), period: 20 },
  "finance/atr": { bars: ohlc(30), period: 14 },
  "finance/ema": { prices: sine(40, 100, 6), period: 12 },
  "finance/roc": { prices: sine(40, 100, 6), period: 12 },
  "finance/williams-r": { bars: ohlc(30), period: 14 },
  "finance/stochastic-oscillator": { bars: ohlc(30), period: 14, dPeriod: 3 },
  "finance/obv": { bars: ohlc(20).map((b, i) => ({ close: b.close, volume: 1000 + i * 10 })) },
  "finance/vwap": { bars: ohlc(20).map((b) => ({ ...b, volume: 1000 })) },
  "finance/portfolio-metrics": { returns: [0.01, -0.005, 0.02, 0.008, -0.003, 0.015, 0.004] },
  "finance/sharpe-rolling": { returns: [0.01, -0.005, 0.02, 0.008, -0.003, 0.015, 0.004, 0.009, -0.002, 0.011], window: 5 },
  "finance/position-size": { account: 10000, entry: 50, stop: 45, riskPct: 1 },
  "finance/cagr": { begin: 10000, end: 18000, years: 3 },
  "research/extractive-summary": { text: SAMPLE, sentences: 2 },
  "research/readability": { text: SAMPLE },
  "research/keyword-density": { text: SAMPLE, top: 5 },
  "research/sentiment": { text: "This product is great and I love it, but shipping was terrible." },
  "research/dedupe": { texts: ["solar power grows fast", "solar power grows quickly", "the market fell today"], threshold: 0.3 },
  "research/tokenize": { text: SAMPLE },
  "research/tf-idf": { docs: ["solar energy is clean", "solar panels are cheap", "wind energy grows"], term: "solar" },
  "research/ngrams": { text: SAMPLE, n: 2, top: 5 },
  "research/levenshtein": { a: "kitten", b: "sitting" },
  "research/stopwords": { text: SAMPLE },
  "research/textrank-summary": { text: SAMPLE, sentences: 2 },
};

function card(m) {
  const tags = m.tags.slice(0, 5).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  return `<article class="card" data-id="${esc(m.id)}" data-search="${esc((m.id + " " + m.name + " " + m.description + " " + m.tags.join(" ")).toLowerCase())}" data-domain="${esc(m.domain)}">
    <div class="card-head"><span class="domain">${esc(m.domain)}</span><code class="id">${esc(m.id)}</code></div>
    <h3>${esc(m.name)}</h3>
    <p>${esc(m.description)}</p>
    <div class="tags">${tags}</div>
    <button class="try" data-id="${esc(m.id)}">Try it →</button>
  </article>`;
}

function page(reg, skills) {
  const chips = ["all", ...reg.domains]
    .map((d) => `<button class="chip${d === "all" ? " active" : ""}" data-filter="${esc(d)}">${esc(d)}</button>`)
    .join("");

  // Embed each skill's source + metadata + example for in-browser execution.
  const DATA = {};
  for (const s of skills) {
    DATA[s.meta.id] = {
      src: readFileSync(s.file, "utf8"),
      meta: s.meta,
      example: EXAMPLES[s.meta.id] ?? {},
    };
  }

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SkillForge — ${reg.count} skills</title>
<style>
:root{--bg:#fafafa;--fg:#18181b;--muted:#71717a;--card:#fff;--border:#e4e4e7;--accent:#3b7a57;--code:#f4f4f5}
@media(prefers-color-scheme:dark){:root{--bg:#0d0d0f;--fg:#f4f4f5;--muted:#a1a1aa;--card:#18181b;--border:#27272a;--accent:#5db088;--code:#111113}}
*{box-sizing:border-box}body{margin:0;font:15px/1.55 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--fg)}
header{padding:40px 24px 8px;max-width:1100px;margin:0 auto}
h1{margin:0;font-size:28px;letter-spacing:-.02em}h1 span{color:var(--accent)}
.sub{color:var(--muted);margin:6px 0 20px}
.controls{max-width:1100px;margin:0 auto;padding:0 24px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
input#q{flex:1;min-width:200px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--fg);font-size:15px}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{padding:7px 13px;border:1px solid var(--border);border-radius:999px;background:var(--card);color:var(--muted);cursor:pointer;font-size:13px}
.chip.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.grid{max-width:1100px;margin:20px auto;padding:0 24px;display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;display:flex;flex-direction:column}
.card-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}
.domain{font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:700;color:var(--accent)}
.id{font-size:12px;color:var(--muted)}
h3{margin:2px 0 6px;font-size:17px}.card p{margin:0 0 12px;color:var(--muted);flex:1}
.tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px}
.tag{font-size:11px;padding:3px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--muted)}
.try{align-self:flex-start;padding:7px 14px;border:1px solid var(--accent);background:transparent;color:var(--accent);border-radius:8px;cursor:pointer;font-size:13px;font-weight:600}
.try:hover{background:var(--accent);color:#fff}
.empty{max-width:1100px;margin:40px auto;padding:0 24px;color:var(--muted);display:none}
footer{max-width:1100px;margin:40px auto;padding:16px 24px;color:var(--muted);font-size:13px;border-top:1px solid var(--border)}
/* drawer */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;z-index:40}
.overlay.open{display:block}
.drawer{position:fixed;top:0;right:0;height:100%;width:min(560px,100%);background:var(--bg);border-left:1px solid var(--border);transform:translateX(100%);transition:transform .2s ease;z-index:50;overflow-y:auto}
.drawer.open{transform:translateX(0)}
.drawer-inner{padding:24px}
.close{float:right;border:none;background:none;color:var(--muted);font-size:24px;cursor:pointer;line-height:1}
.drawer h2{margin:0 0 4px;font-size:22px}
.drawer .id{display:block;margin-bottom:14px}
.sec{margin:18px 0}
.sec h4{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.kv{font-size:13px;color:var(--muted)}.kv code{color:var(--fg)}
textarea{width:100%;min-height:96px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--code);color:var(--fg);font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical}
.runbtn{margin-top:8px;padding:9px 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-weight:600;cursor:pointer}
pre.out{background:var(--code);border:1px solid var(--border);border-radius:8px;padding:12px;overflow-x:auto;font:12px/1.5 ui-monospace,Menlo,monospace;max-height:340px}
pre.out.err{color:#ef4444}
details.src summary{cursor:pointer;color:var(--muted);font-size:13px}
details.src pre{background:var(--code);border:1px solid var(--border);border-radius:8px;padding:12px;overflow-x:auto;font:12px/1.5 ui-monospace,Menlo,monospace;max-height:280px}
</style></head><body>
<header><h1>Skill<span>Forge</span></h1><p class="sub">${reg.count} runnable skills across ${reg.domains.length} domains. Click <b>Try it</b> to run any skill live in your browser — no server.</p></header>
<div class="controls"><input id="q" type="search" placeholder="Search skills, tags, descriptions…" aria-label="Search skills"><div class="chips">${chips}</div></div>
<main class="grid" id="grid">${reg.skills.map(card).join("")}</main>
<p class="empty" id="empty">No skills match your search.</p>
<footer>Generated by <code>core/build-catalog.mjs</code>. Skills run client-side via blob-module import. CLI: <code>node core/cli.mjs run &lt;id&gt; '&lt;json&gt;'</code></footer>

<div class="overlay" id="overlay"></div>
<aside class="drawer" id="drawer"><div class="drawer-inner" id="drawer-inner"></div></aside>

<script id="skills-data" type="application/json">${JSON.stringify(DATA).replace(/</g, "\\u003c")}</script>
<script>
const DATA = JSON.parse(document.getElementById('skills-data').textContent);
const q=document.getElementById('q'),grid=document.getElementById('grid'),empty=document.getElementById('empty');
let domain='all';
function apply(){const term=q.value.trim().toLowerCase();let shown=0;
  for(const c of grid.children){const okD=domain==='all'||c.dataset.domain===domain;const okT=!term||c.dataset.search.includes(term);const vis=okD&&okT;c.style.display=vis?'':'none';if(vis)shown++;}
  empty.style.display=shown?'none':'block';}
q.addEventListener('input',apply);
for(const chip of document.querySelectorAll('.chip')){chip.addEventListener('click',()=>{document.querySelector('.chip.active').classList.remove('active');chip.classList.add('active');domain=chip.dataset.filter;apply();});}

const overlay=document.getElementById('overlay'),drawer=document.getElementById('drawer'),inner=document.getElementById('drawer-inner');
function esc(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function closeDrawer(){overlay.classList.remove('open');drawer.classList.remove('open');}
overlay.addEventListener('click',closeDrawer);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});

async function runSkill(id,inputText,outEl){
  outEl.classList.remove('err');outEl.textContent='running…';
  let input;
  try{input=inputText.trim()?JSON.parse(inputText):{};}catch(e){outEl.classList.add('err');outEl.textContent='Invalid JSON input: '+e.message;return;}
  try{
    const url=URL.createObjectURL(new Blob([DATA[id].src],{type:'text/javascript'}));
    const mod=await import(url);URL.revokeObjectURL(url);
    const result=mod.run(input);
    outEl.textContent=JSON.stringify(result,null,2);
  }catch(e){outEl.classList.add('err');outEl.textContent='Error: '+(e&&e.message?e.message:e);}
}

function openSkill(id){
  const d=DATA[id],m=d.meta;
  const inputs=m.inputs?Object.entries(m.inputs).map(([k,v])=>'<div class="kv"><code>'+esc(k)+'</code> — '+esc(v)+'</div>').join(''):'';
  inner.innerHTML=
    '<button class="close" aria-label="Close">×</button>'+
    '<span class="domain">'+esc(m.domain)+'</span>'+
    '<h2>'+esc(m.name)+'</h2><code class="id">'+esc(m.id)+' · v'+esc(m.version)+' · '+esc(m.license)+'</code>'+
    '<p>'+esc(m.description)+'</p>'+
    (inputs?'<div class="sec"><h4>Inputs</h4>'+inputs+'</div>':'')+
    (m.outputs?'<div class="sec"><h4>Output</h4><div class="kv"><code>'+esc(m.outputs)+'</code></div></div>':'')+
    '<div class="sec"><h4>Try it</h4><textarea id="inp">'+esc(JSON.stringify(d.example,null,2))+'</textarea>'+
    '<button class="runbtn" id="run">Run ▶</button><pre class="out" id="out">— output appears here —</pre></div>'+
    (m.source?'<div class="sec"><h4>Source / attribution</h4><div class="kv">'+esc(m.source)+'</div></div>':'')+
    '<div class="sec"><details class="src"><summary>View skill source</summary><pre>'+esc(d.src)+'</pre></details></div>';
  inner.querySelector('.close').addEventListener('click',closeDrawer);
  const out=inner.querySelector('#out');
  inner.querySelector('#run').addEventListener('click',()=>runSkill(id,inner.querySelector('#inp').value,out));
  overlay.classList.add('open');drawer.classList.add('open');
}
grid.addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b&&(e.target.classList.contains('try')||e.target.closest('.card')))openSkill(b.dataset.id);});
</script></body></html>`;
}

const skills = await loadSkills();
const reg = await buildRegistry();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, page(reg, skills));

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  console.log(`catalog written: catalog/index.html (${reg.count} skills, interactive)`);
}
