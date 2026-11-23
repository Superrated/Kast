/* ==== 91-parts-nav.js ====
   The Order and Build steps (see 93-steps.js for the four steps Room → Design → Order → Build):
     Order — everything to buy, cut and send:  Parts · Sheets · Shopping · Price · Drawings · Shaped parts · Files
     Build — making it:                        Workshop (cut, assemble in 3D, build steps) · Build guide
   Views: v-cut (Parts / Shopping / Price, one render split in sections), v-sheets, v-draw (Drawings / Files),
   v-loft, v-work, v-guide. The last sub-tab you used in each step is remembered.
*/
const PN_GROUP = { cut: 'order', sheets: 'order', draw: 'order', loft: 'order', work: 'build', guide: 'build' };
const PN_ORDER = [
  ['list', 'cut', 'Parts'],
  ['sheets', 'sheets', 'Sheets'],
  ['buy', 'cut', 'Shopping'],
  ['price', 'cut', 'Price'],
  ['tech', 'draw', 'Drawings'],
  ['loft', 'loft', 'Shaped parts'],
  ['files', 'draw', 'Files']
];
const PN_BUILD = [
  ['work', 'work', 'Workshop'],
  ['guide', 'guide', 'Build guide']
];
// older names still used by buttons here and there
const PN_ALIAS = { parts: 'list', drawings: 'tech', workshop: 'work', area: null, order: null, build: null };
let PN = { last: 'cut', osub: 'list', bsub: 'work', psub: 'list', dsub: 'tech' };
try {
  const o = JSON.parse(localStorage.getItem('fitted-pn') || 'null');
  if (o) PN = Object.assign(PN, o);
  if (o && !o.osub) PN.osub = o.psub || 'list';
} catch (e) {
  oops('parts-nav #1', e, 1);
}
function pnSave() {
  try {
    localStorage.setItem('fitted-pn', JSON.stringify(PN));
  } catch (e) {
    oops('parts-nav #2', e, 1);
  }
}
/* open a place in Order or Build by its sub key (list, sheets, buy, price, tech, loft, files, work, guide) */
function pnGo(key) {
  if (key in PN_ALIAS) key = PN_ALIAS[key] || (key === 'build' ? PN.bsub || 'work' : PN.osub || 'list');
  const o = PN_ORDER.find(x => x[0] === key),
    b = PN_BUILD.find(x => x[0] === key),
    hit = o || b || PN_ORDER[0];
  if (b) PN.bsub = key;
  else {
    PN.osub = hit[0];
    // which sections the shared views show
    if (hit[1] === 'cut') PN.psub = hit[0];
    if (hit[1] === 'draw') PN.dsub = hit[0];
  }
  PN.last = hit[1];
  pnSave();
  showTab(hit[1]);
}
function pnLast() {
  return PN.last && PN_GROUP[PN.last] ? PN.last : 'cut';
}
function pnNav(t) {
  const g = PN_GROUP[t];
  if (!g) return '';
  const sub = g === 'order' ? PN_ORDER : PN_BUILD,
    cur = g === 'order' ? PN.osub : PN.bsub;
  return `<nav class="pnav" aria-label="${g === 'order' ? 'Order' : 'Build'}"><div class="pnsub seg" role="tablist">${sub
    .map(
      ([k, , l]) =>
        `<button type="button" role="tab" class="${k === cur ? 'on' : ''}" aria-selected="${k === cur}" data-act="pnGo" data-a="${k}">${l}</button>`
    )
    .join('')}</div></nav>`;
}
function pnPut(t) {
  const el = document.getElementById('v-' + t);
  if (!el) return;
  const old = el.querySelector(':scope>.pnav');
  if (old) old.remove();
  el.insertAdjacentHTML('afterbegin', pnNav(t));
  if (t === 'cut') el.dataset.psub = ['list', 'buy', 'price'].includes(PN.psub) ? PN.psub : 'list';
  if (t === 'draw') el.dataset.dsub = ['tech', 'files'].includes(PN.dsub) ? PN.dsub : 'tech';
  stepsOn();
}
function pnTabsOn() {
  stepsOn();
}
/* wrap the renders of the views so the section bar is always on top */
['renderCut', 'renderSheets', 'renderLoft', 'renderWork', 'renderGuide'].forEach(fnm => {
  const f = window[fnm];
  if (typeof f !== 'function') return;
  const t = { renderCut: 'cut', renderSheets: 'sheets', renderLoft: 'loft', renderWork: 'work', renderGuide: 'guide' }[
    fnm
  ];
  window[fnm] = function () {
    const r = f.apply(this, arguments);
    try {
      if (!PRICING) pnPut(t);
    } catch (e) {
      oops('parts-nav #3', e);
    }
    return r;
  };
});
/* ---------- Drawings ---------- */
function renderDraw() {
  const el = document.getElementById('v-draw');
  if (!el) return;
  el.innerHTML = `<section data-dsec="tech"><h2>Technical drawings</h2>${tdBodyHTML(true)}</section>
  <section data-dsec="files"><h2>Labels &amp; files</h2><div class="shgrid">
    <section class="shcard"><h3>Part labels</h3><p class="hintp">One sticker per part: its number, size, board, which edges get edge banding and which way the grain runs. A last page explains how to read them.</p><div class="dbtns"><button type="button" class="btn pri" data-act="lblPdf">Part labels (PDF)</button></div></section>
    <section class="shcard"><h3>PDF packs</h3><p class="hintp">Front drawing, cut list, price, shaped parts and the build guide — as one PDF for the workshop, the shop or a quote.</p><div class="dbtns"><button type="button" class="btn" data-act="pdf">Choose a PDF pack…</button></div></section>
    <section class="shcard"><h3>Machining drawings</h3><p class="hintp">One page per part with every size to cut, drill, groove and finish: holes by position, Ø and depth from the 0 corner, grooves, cut-outs, shaped corners, edge banding and grain.</p><div class="dbtns"><button type="button" class="btn pri" data-act="mdPdf">Machining drawings (PDF)</button></div></section>
    <section class="shcard"><h3>Templates at full size</h3><p class="hintp">Shaped parts printed 1:1 on A4 sheets to tape together and trace.</p><div class="dbtns"><button type="button" class="btn" data-act="tplPdf">Templates (PDF)</button></div></section>
    <section class="shcard"><h3>CNC files per part</h3><p class="hintp">One DXF per part, with cut-outs and drill holes on their own layers, for a CNC router.</p><div class="dbtns"><button type="button" class="btn" data-act="dxfZip">DXF files (zip)</button></div></section>
  </div></section>`;
  pnPut('draw');
}
/* ---------- Workshop ---------- */
function wsCount(tab) {
  const o = ui.ws;
  let d = 0,
    n = 0;
  try {
    ui.ws = { tab };
    const it = wsItems(),
      done = new Set((S.done || {})[tab] || []);
    n = it.length;
    d = it.filter(x => done.has(x.k)).length;
  } catch (e) {
    oops('parts-nav #4', e);
  }
  ui.ws = o;
  return [d, n];
}
function renderWork() {
  const el = document.getElementById('v-work');
  if (!el) return;
  const [cd, cn] = wsCount('cuts'),
    [sd, sn] = wsCount('steps');
  let cols = [];
  try {
    cols = wxCols();
  } catch (e) {
    oops('parts-nav #5', e);
  }
  const bar = (d, n) =>
    `<div class="wsprog"><i style="width:${n ? Math.round((d / n) * 100) : 0}%"></i></div><span class="hintp" style="margin:0">${d} of ${n} done</span>`;
  let ld = '';
  try {
    ld = isLocked()
      ? new Date(S.lock.at || Date.now()).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
      : '';
  } catch (e) {
    oops('parts-nav #6', e);
  }
  el.innerHTML = `<h2>Workshop</h2><p class="lede">Building it: cut the parts, put each box together, then follow the build steps. Big buttons, one thing at a time — made for a phone in the workshop.</p>
  <div class="wklock ${isLocked() ? 'on' : ''}">${
    isLocked()
      ? `<b>🔒 Locked for building</b><span>Since ${esc(ld)}. Nothing can change by accident, so the parts you cut keep matching the drawings. Ticking cuts and steps as done still works.</span><div class="dbtns"><button type="button" class="btn sm pri" data-act="dsEditCopy">Edit a copy</button><button type="button" class="btn sm" data-act="unlock">Unlock to change the design</button></div>`
      : `<b>🔓 Not locked</b><span>When you start cutting, Fitted locks the design so the parts keep matching the drawings. You can lock it now too.</span><div class="dbtns"><button type="button" class="btn sm" data-act="lockOn">🔒 Lock now</button></div>`
  }</div>
  <div class="wkgrid">
    <section class="wkcard"><h3>1 · Cut</h3><p>Every cut at the saw, in order, with the fence setting. Tick each one off.</p>${bar(cd, cn)}<button type="button" class="btn pri" data-act="wkCut">${cd ? 'Go on cutting' : 'Start cutting'}</button></section>
    <section class="wkcard wkasm"><h3>2 · Assemble</h3><p>Each box in 3D: pull it apart with the slider, turn it, tap a part to see its size, edge banding and holes.</p>
      <div class="wkboxes">${cols.map((c, i) => `<button type="button" class="tchip" data-act="wkBox" data-a="${i}">Box ${c.n}<small>${f0(c.bx.x1 - c.bx.x0)} wide</small></button>`).join('') || '<span class="hintp">No boxes in this design.</span>'}</div><button type="button" class="btn pri" data-act="wkBox" data-a="0">Open in 3D</button></section>
    <section class="wkcard"><h3>3 · Build steps</h3><p>Fixing to the wall, levelling, doors, strips — step by step.</p>${bar(sd, sn)}<div class="dbtns"><button type="button" class="btn pri" data-act="wkSteps">${sd ? 'Go on' : 'Start the steps'}</button><button type="button" class="btn" data-act="tab" data-a="guide">Read the whole guide</button></div></section>
  </div>`;
}
