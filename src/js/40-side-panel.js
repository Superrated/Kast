/* ==== 40-side-panel.js ====
   The side panel (Room · Layout · Look · Build): renderSide, the column and level editors, Simple/Expert view, the "Words explained" glossary and the "Talk to BRUIS" feedback dialog.
*/
/* ===== Side panel ===== */
const getP = p => p.split('.').reduce((o, k) => (o == null ? o : o[k]), S);
function setP(p, v) {
  const ks = p.split('.');
  let o = S;
  for (let i = 0; i < ks.length - 1; i++) {
    if (o[ks[i]] == null) o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    o = o[ks[i]];
  }
  o[ks[ks.length - 1]] = v;
}
const idOf = p => 'i-' + p.replace(/\./g, '-');
function fld(label, p, { unit = 'mm', ph = '', step = 1, auto = false } = {}) {
  const v = getP(p);
  return `<label class="fld"><span>${label}</span><span class="inp"><input type="number" inputmode="decimal" id="${idOf(p)}" data-p="${p}" value="${v == null ? '' : v}" placeholder="${esc(ph)}" step="${step}"><em>${unit}</em>${auto && v != null && v !== '' ? `<button type="button" class="autob" data-act="setv" data-a="${p}||x" title="Make automatic">auto</button>` : ''}</span></label>`;
}
function sel(label, p, opts, { re = false, num = false } = {}) {
  const v = getP(p);
  return `<label class="fld"><span>${label}</span><span class="inp"><select id="${idOf(p)}" data-p="${p}" ${re ? 'data-re="1"' : ''} ${num ? 'data-num="1"' : ''}>${opts.map(([k, l]) => `<option value="${k}" ${String(k) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></span></label>`;
}
function chk(label, p, { re = true } = {}) {
  return `<label class="chk"><input type="checkbox" id="${idOf(p)}" data-p="${p}" ${re ? 'data-re="1"' : ''} ${getP(p) ? 'checked' : ''}> ${label}</label>`;
}
function seg(p, opts, { num = false, dflt = '' } = {}) {
  const v = getP(p) ?? dflt;
  return `<div class="seg" role="group">${opts.map(([k, l]) => `<button type="button" class="${String(v ?? '') === String(k) ? 'on' : ''}" data-act="setv" data-a="${p}|${k}|${num ? 'n' : 's'}">${l}</button>`).join('')}</div>`;
}
function stepper(label, p, min = 0, max = 12, autoZero = false) {
  const v = +getP(p) || 0;
  return `<div class="fld"><span>${label}</span><div class="step"><button type="button" data-act="step" data-a="${p}|-1|${min}|${max}" aria-label="Fewer">−</button><b>${autoZero && v === 0 ? 'Auto' : v}</b><button type="button" data-act="step" data-a="${p}|1|${min}|${max}" aria-label="More">+</button></div></div>`;
}
function applyMatType(p) {
  let mm = p.match(/^mat\.(\w+)\.type$/),
    obj = null;
  if (mm) obj = S.mat[mm[1]];
  else if (/\.panel\.mat$/.test(p)) obj = getP(p.slice(0, -4));
  if (!obj) return;
  const t = obj.type || obj.mat,
    m = MATS[t];
  if (!m) return;
  if (mm) {
    obj.t = m.t;
    obj.sheet = m.sheet;
  } else obj.t = m.t;
  if (!finAllowed(t, obj.fin))
    obj.fin = m.fins === 'wood' ? 'oak' : m.fins === 'ply' ? 'birch' : m.fins === 'ral' ? 'ral9010' : obj.fin;
  toast(`${m.name}: ${m.t} mm${mm ? ', ' + m.sheet.replace('x', '×') + ' sheets' : ''}`);
}
function pathType(p) {
  if (p.startsWith('wiz:')) return null;
  let m = p.match(/^mat\.(\w+)\.fin$/);
  if (m) return S.mat[m[1]].type;
  if (/\.panel\.fin$/.test(p)) return getP(p.replace(/fin$/, 'mat')) || 'ply';
  if (/\.inFin$/.test(p)) return S.mat.shelf.type;
  if (/\.zones\./.test(p)) return S.mat.front.type;
  return null;
}
function finVal(p) {
  return p.startsWith('wiz:') ? WZ[p.slice(4)] : getP(p);
}
function finButton(p, inheritLabel, compact) {
  const v = finVal(p) || '',
    f = FIN[v];
  const nm = f ? f.name : inheritLabel || 'Choose';
  return `<button type="button" class="finbtn${compact ? ' cmp' : ''}" data-act="pickFin" data-a="${p}|${esc(inheritLabel || '')}" aria-label="Choose colour: ${esc(nm)}"><i class="${f ? '' : 'inh'}" style="background:${f ? f.base : 'transparent'}"></i><span>${esc(nm)}</span><b>▾</b></button>`;
}
function finSelect(label, p, inheritLabel) {
  return `<div class="fld"><span>${label}</span>${finButton(p, inheritLabel)}</div>`;
}
let FP = null;
function openFinPicker(p, inherit) {
  FP = { p, inherit, q: '', type: pathType(p) };
  document.getElementById('fpm').hidden = false;
  document.getElementById('fpSearch').value = '';
  renderFinPicker();
  setTimeout(() => {
    if (window.innerWidth > 860) document.getElementById('fpSearch').focus();
  }, 50);
}
function renderFinPicker() {
  const v = finVal(FP.p) || '',
    q = FP.q.trim().toLowerCase();
  const keyOf = f => Object.keys(FIN).find(k => FIN[k] === f);
  const match = f =>
    (!FP.type || finAllowed(FP.type, keyOf(f))) &&
    (!q || f.name.toLowerCase().includes(q) || f.name.replace('RAL ', '').startsWith(q));
  const tile = (k, f) => {
    const light = lum(f.base) > 0.6;
    const code = f.ral ? f.name.slice(4, 8) : '';
    return `<button type="button" class="fsw ${k === v ? 'on' : ''}" data-act="finPicked" data-a="${k}" title="${esc(f.name)}" style="background:${f.kind !== 'plain' ? `url(&quot;data:image/svg+xml;utf8,${encodeURIComponent(swatchSVG(k))}&quot;) center/cover` : f.base};color:${light ? '#222' : '#fff'}"><span>${f.ral ? code : esc(f.name)}</span></button>`;
  };
  let h = '';
  if (FP.inherit)
    h += `<button type="button" class="btn sm ${!v ? 'on' : ''}" data-act="finPicked" data-a="" style="justify-self:start">${esc(FP.inherit)}</button>`;
  const mine = Object.entries(FIN).filter(([, f]) => f.custom && match(f));
  h += `<h4>Your colours</h4>${mine.length ? `<div class="fgrid wide">${mine.map(([k, f]) => tile(k, f)).join('')}</div>` : ''}${cuPickerHTML()}`;
  const tex = Object.entries(FIN).filter(([, f]) => !f.ral && !f.hidden && !f.micro && !f.custom && match(f)),
    mic = Object.entries(FIN).filter(([, f]) => f.micro && match(f));
  if (tex.length)
    h += `<h4>Wood &amp; textures</h4><div class="fgrid wide">${tex.map(([k, f]) => tile(k, f)).join('')}</div>`;
  if (mic.length) h += `<h4>Microcement</h4><div class="fgrid wide">${mic.map(([k, f]) => tile(k, f)).join('')}</div>`;
  for (let fam = 1; fam <= 9; fam++) {
    const r = Object.entries(FIN).filter(([, f]) => f.ral && f.fam === fam && match(f));
    if (!r.length) continue;
    h += `<h4>RAL ${fam}000 · ${RAL_FAM[fam]}</h4><div class="fgrid">${r.map(([k, f]) => tile(k, f)).join('')}</div>`;
  }
  if (!h.includes('fsw'))
    h += '<p class="hintp">No colour matches that. Try a RAL number like 7016 or a name like “grey”.</p>';
  document.getElementById('fpBody').innerHTML = h;
  const f = FIN[v];
  document.getElementById('fpCur').innerHTML =
    (f ? `<i style="background:${f.base}"></i>${esc(f.name)}` : esc(FP.inherit || '')) +
    (FP.type && MATS[FP.type].fins !== 'all'
      ? `<span class="note"> · ${MATS[FP.type].fins === 'wood' ? 'wood finishes' : MATS[FP.type].fins === 'ral' ? 'RAL paint colours' : MATS[FP.type].fins === 'micro' ? 'microcement colours' : 'birch or painted'} for ${MATS[FP.type].name.toLowerCase()}</span>`
      : '');
}
function swatchSVG(k) {
  const f = FIN[k];
  const r = rng(k.length * 31 + 7);
  let b = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><rect width='60' height='60' fill='${f.base}'/>`;
  if (f.micro) {
    for (let i = 0; i < 10; i++)
      b += `<ellipse cx='${(r() * 60).toFixed(0)}' cy='${(r() * 60).toFixed(0)}' rx='${(8 + r() * 16).toFixed(1)}' ry='${(5 + r() * 10).toFixed(1)}' fill='${r() < 0.5 ? f.grain : '#fff'}' fill-opacity='.14'/>`;
  } else if (f.kind === 'stone') {
    for (let i = 0; i < 14; i++)
      b += `<circle cx='${(r() * 60).toFixed(0)}' cy='${(r() * 60).toFixed(0)}' r='${(1 + r() * 5).toFixed(1)}' fill='${f.grain}' fill-opacity='.25'/>`;
  } else
    for (let i = 0; i < (f.kind === 'ply' ? 14 : 9); i++) {
      const x = r() * 60;
      b += `<path d='M${x.toFixed(1)} 0 Q${(x + (r() - 0.5) * 8).toFixed(1)} 30 ${(x + (r() - 0.5) * 4).toFixed(1)} 60' stroke='${f.grain}' stroke-opacity='${(0.2 + r() * 0.35).toFixed(2)}' stroke-width='${(0.5 + r() * 2).toFixed(1)}' fill='none'/>`;
    }
  return b + '</svg>';
}
function fabSwatches(p) {
  const v = getP(p) || 'charcoal';
  return `<div class="fabname">${esc((FABRICS[v] || FABRICS.charcoal).name)}</div><div class="fabs">${Object.entries(
    FABRICS
  )
    .map(
      ([k, f]) =>
        `<button type="button" class="fab ${v === k ? 'on' : ''}" style="background:${f.c}" title="${f.name}" aria-label="${f.name} fabric" data-act="setv" data-a="${p}|${k}|s"></button>`
    )
    .join('')}</div>`;
}
const ZICON = {
  seat: '<svg viewBox="0 0 22 22"><path d="M2 13h18v7H2zM4 13V9.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><line x1="11" y1="13" x2="11" y2="20" stroke="currentColor" stroke-width="1.6"/></svg>',
  passage:
    '<svg viewBox="0 0 22 22"><rect x="5" y="2" width="12" height="18" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="14" cy="11.5" r="1.2" fill="currentColor"/></svg>',
  closed:
    '<svg viewBox="0 0 22 22"><rect x="2" y="2" width="18" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="11" y1="2" x2="11" y2="20" stroke="currentColor" stroke-width="1.6"/><circle cx="8.5" cy="11" r="1.2" fill="currentColor"/><circle cx="13.5" cy="11" r="1.2" fill="currentColor"/></svg>',
  open: '<svg viewBox="0 0 22 22"><rect x="2" y="2" width="18" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="2" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="1.6"/><line x1="2" y1="14" x2="20" y2="14" stroke="currentColor" stroke-width="1.6"/></svg>',
  drawers:
    '<svg viewBox="0 0 22 22"><rect x="2" y="2" width="18" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="2" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="1.6"/><line x1="2" y1="14" x2="20" y2="14" stroke="currentColor" stroke-width="1.6"/><line x1="9" y1="5" x2="13" y2="5" stroke="currentColor" stroke-width="1.6"/><line x1="9" y1="11" x2="13" y2="11" stroke="currentColor" stroke-width="1.6"/><line x1="9" y1="17" x2="13" y2="17" stroke="currentColor" stroke-width="1.6"/></svg>',
  opening:
    '<svg viewBox="0 0 22 22"><rect x="2" y="2" width="18" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="5" y="6" width="12" height="8" rx="1" fill="currentColor"/></svg>',
  speaker:
    '<svg viewBox="0 0 22 22"><rect x="2" y="2" width="18" height="18" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="11" cy="7" r="2" fill="currentColor"/><circle cx="11" cy="14" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
};
function handleIcon(k) {
  const w = '#B98B57';
  let h = '';
  switch (k) {
    case 'hole':
      h = '<circle cx="25" cy="20" r="2.8" fill="currentColor"/>';
      break;
    case 'dots':
      h =
        '<g fill="currentColor"><circle cx="20" cy="10" r="1.6"/><circle cx="26" cy="10" r="1.6"/><circle cx="20" cy="16" r="1.6"/><circle cx="26" cy="16" r="1.6"/><circle cx="20" cy="22" r="1.6"/><circle cx="26" cy="22" r="1.6"/><circle cx="20" cy="28" r="1.6"/><circle cx="26" cy="28" r="1.6"/></g>';
      break;
    case 'slot':
      h = '<rect x="23.6" y="14" width="3" height="11" rx="1.5" fill="currentColor"/>';
      break;
    case 'groove':
      h = '<rect x="27.5" y="2" width="3.5" height="40" fill="currentColor" opacity=".35"/>';
      break;
    case 'woodbar':
      h = `<rect x="23" y="12" width="3.6" height="17" rx="1.8" fill="${w}"/>`;
      break;
    case 'woodknob':
      h = `<circle cx="25" cy="20" r="3.2" fill="${w}"/>`;
      break;
    case 'disc':
      h = `<circle cx="25" cy="20" r="5" fill="${w}"/>`;
      break;
    case 'stick':
      h = '<rect x="23.5" y="9" width="3" height="22" rx="1.5" fill="#5D74A3"/>';
      break;
    case 'cross':
      h = '<path d="M21.5 16.5 l7 7 M28.5 16.5 l-7 7" stroke="#D9A6A0" stroke-width="2.4" stroke-linecap="round"/>';
      break;
    case 'ring':
      h = '<circle cx="25" cy="20" r="3.6" fill="none" stroke="#93A98E" stroke-width="1.8"/>';
      break;
    case 'edge':
      h = `<rect x="29.5" y="15" width="3" height="11" rx="1" fill="${w}"/>`;
      break;
    case 'bar':
      h = '<line x1="25" y1="13" x2="25" y2="28" stroke="#8D9399" stroke-width="2.4" stroke-linecap="round"/>';
      break;
    case 'knob':
      h = '<circle cx="25" cy="20" r="2.8" fill="#8D9399"/>';
      break;
    case 'none':
      h = '<path d="M17 18 l5 4 -5 4" fill="none" stroke="currentColor" stroke-width="1.6"/>';
      break;
    case 'woodpull':
      h = `<rect x="23.4" y="12" width="3.4" height="17" rx="1.7" fill="${w}"/><circle cx="25.1" cy="13.5" r="1.6" fill="#6b4a2a"/><circle cx="25.1" cy="27.5" r="1.6" fill="#6b4a2a"/>`;
      break;
    case 'woodblock':
      h = `<rect x="22" y="17" width="6" height="6" rx="1" fill="${w}"/>`;
      break;
    case 'woodcup':
      h = `<path d="M22 15 A4 5 0 0 0 22 25 Z" fill="${w}" transform="translate(5 0)"/>`;
      break;
    case 'profile':
      h = `<rect x="28" y="2" width="3" height="40" fill="${w}"/>`;
      break;
    case 'leather':
      h = '<rect x="23.6" y="12" width="3" height="17" rx="1" fill="#7A4A2A"/>';
      break;
  }
  return `<svg viewBox="0 0 34 44"><rect x="3" y="2" width="28" height="40" rx="1.5" style="fill:var(--surface)" stroke="currentColor" stroke-width="1.2"/>${h}</svg>`;
}
const openState = {
  stk: true,
  lad: true,
  room: true,
  ceil: true,
  obs: true,
  secs: true,
  mat: true,
  hd: true,
  con: true,
  sk: true
};
const PANES_X = 1;
const PANES = [
  [
    'room',
    'Room',
    'Wall, slopes and anything in the way.',
    ['room', 'walls', 'ceil', 'site', 'front', 'access', 'obs', 'ppl', 'scr']
  ],
  ['layout', 'Layout', 'The columns and what goes in them.', ['secs']],
  ['look', 'Look', 'Colours, boards, handles.', ['mat', 'hd']],
  ['build', 'Build', 'How it goes together.', ['con', 'sk', 'lad', 'wt', 'plan']]
];
const PANE_ICON = {
  room: '<svg viewBox="0 0 20 20"><path d="M3 17V8l7-5 7 5v9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  layout:
    '<svg viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 3v14M13 3v14M8 10h5" stroke="currentColor" stroke-width="1.6"/></svg>',
  look: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="7.5" cy="8" r="1.3" fill="currentColor"/><circle cx="12.5" cy="8" r="1.3" fill="currentColor"/><circle cx="8.5" cy="12.6" r="1.3" fill="currentColor"/></svg>',
  build:
    '<svg viewBox="0 0 20 20"><path d="M4 16l6-6m2-2l1.5-1.5a2.5 2.5 0 013.5 3.5L15.5 11.5M10 10l-1.5 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M3 13l4 4" stroke="currentColor" stroke-width="1.6"/></svg>'
};
/* ===== Simple / Expert view =====
   Simple shows the handful of controls most people touch; everything else is folded under "More options". Nothing is removed:
   the panel is drawn in full and then tidied here, so every setting keeps working in both views. */
const VIEW_KEY = 'kast-view';
try {
  ui.simple = localStorage.getItem(VIEW_KEY) !== 'x';
} catch (e) {
  ui.simple = true;
}
const SIMPLE_KEEP =
    /^(Height|Depth of this level|Split side by side|Shelves|Doors|Drawers|Hanging rail|Rail height|Shelves above|Shelves below|Front style|Door colour|Front colour|Inside colour|Show in the niche|TV size|Frame size|Cushion fabric|Mattress fabric|Slats run|Slat size|Storage boxes|Grip on the boxes|Arched tops|Front of the nook|Opening size|Opening position|Pod colour|Handles in this level|Contrast cubbies|Cubby colour|Cover colour|Curtain|Book ledges|Padded back|Step box)/,
  SIMPLE_HIDE = { site: 1, ppl: 1, scr: 1, lad: 1 };
function simplifySide(el) {
  const head = el.querySelector('.shead');
  if (head && !el.querySelector('.viewsw'))
    head.insertAdjacentHTML(
      'afterend',
      `<div class="viewsw"><div class="seg" role="group" aria-label="How much to show"><button type="button" class="${ui.simple ? 'on' : ''}" data-act="viewMode" data-a="s">Simple</button><button type="button" class="${ui.simple ? '' : 'on'}" data-act="viewMode" data-a="x">Expert</button></div><span>${ui.simple ? 'The settings most people use' : 'Every setting'}</span></div>`
    );
  if (!ui.simple) return;
  const open = ui.moreOpen || {},
    label = c => ((c.querySelector(':scope > span') || c).textContent || '').trim().replace(/\s+/g, ' ');
  const fold = (host, items, mk, after) => {
    if (!items.length) return;
    const d = document.createElement('details');
    d.className = 'pf more';
    d.dataset.mk = mk;
    if (open[mk]) d.open = true;
    d.innerHTML = `<summary>More options (${items.length})</summary><div class="grid2 moreb"></div>`;
    const box = d.lastElementChild;
    items.forEach(c => box.appendChild(c));
    if (after) after.insertAdjacentElement('afterend', d);
    else host.appendChild(d);
  };
  el.querySelectorAll('.zbody').forEach(zb => {
    const g = zb.querySelector(':scope > .grid2');
    if (!g) return;
    const mv = [...g.children].filter(c => c.tagName === 'P' || !SIMPLE_KEEP.test(label(c)));
    fold(zb, mv, 'z' + ui.sel + ':' + ui.zsel, g);
  });
  el.querySelectorAll('.card.sel').forEach(card => {
    const mv = [...card.children].filter(
      c =>
        c.classList.contains('linkbox') ||
        c.classList.contains('addrow') ||
        (c.classList.contains('fld') && /^Back panel/.test(label(c)))
    );
    const zl = card.querySelector(':scope > .zlist');
    fold(card, mv, 'c' + ui.sel, null);
  });
  const R_ = S.room || {},
    used = {
      lad: !!(S.ladder && S.ladder.on),
      scr: !!(S.opts.screen && S.opts.screen.on),
      site: !!((R_.lvl && R_.lvl.on) || (R_.skb && R_.skb.on) || (R_.wobs || []).length || (R_.bumps || []).length)
    };
  const hid = [];
  el.querySelectorAll('details.acc').forEach(d => {
    if (SIMPLE_HIDE[d.dataset.k] && !used[d.dataset.k]) {
      d.hidden = true;
      hid.push(d.querySelector('summary').textContent.trim());
    }
  });
  if (hid.length)
    el.insertAdjacentHTML(
      'beforeend',
      `<p class="hintp viewmore">${hid.length} more section${hid.length > 1 ? 's' : ''} in Expert view: ${hid.map(esc).join(', ')}. <button type="button" class="linkb" data-act="viewMode" data-a="x">Show everything</button></p>`
    );
}
/* ===== words explained ===== */
const GLOSS = [
  [
    'Column',
    'One upright unit of the cabinet, counted from the left: S1, S2, S3… The drawing and the lists use these numbers.'
  ],
  ['Level', 'A part of a column above or below another: a drawer stack, a cupboard, an open niche.'],
  ['Carcass', 'The box itself: sides, top, bottom and back — everything except the doors and drawer fronts.'],
  ['Front', 'A door or a drawer front: the parts you see.'],
  [
    'Closing strip',
    'A strip that closes the gap between the cabinet and a wall or the ceiling. It is cut a little wider and trimmed to the wall on site.'
  ],
  ['Plinth', 'The strip along the floor under the cabinet, set back a little so your toes fit.'],
  [
    'Scribe',
    'Trimming a strip to follow a crooked wall or ceiling: hold it in place, draw the wall line on it with a pencil, cut to the line.'
  ],
  ['Part', 'One piece of board you cut: a side, a shelf, a door. The cut list lists every part.'],
  ['Sheet', 'A big board you buy (for example 2800 × 2070 mm). Parts are cut out of sheets.'],
  [
    'Shaped parts',
    'Parts that are not plain rectangles — sloped tops, cut-outs, holes. They get their own drawing with every point measured.'
  ],
  ['Edge band', 'A thin strip ironed or glued onto the raw edge of a board so it looks finished.'],
  ['Grain', 'The direction of the wood pattern. Long parts follow the grain of the sheet.'],
  ['Kerf', 'The width of the saw cut, about 3–4 mm. It is lost between two parts.'],
  ['Inside width', 'The free space between the sides of a column — what fits inside.']
];
function glossOpen() {
  let m = document.getElementById('glm');
  if (!m) {
    m = document.createElement('div');
    m.id = 'glm';
    m.className = 'modal';
    document.body.appendChild(m);
    m.addEventListener('click', e => {
      if (e.target === m) m.hidden = true;
    });
  }
  m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true" aria-label="Words explained"><div class="mhead"><h2>Words explained</h2></div><div class="mbody"><dl class="gloss">${GLOSS.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl></div><div class="mfoot"><button class="btn" data-act="glossClose">Close</button><div></div></div></div>`;
  m.hidden = false;
  const mm = document.getElementById('mmenu');
  if (mm) mm.hidden = true;
}
/* ===== messages to BRUIS: thanks, bugs, ideas, coffee ===== */
const SUPPORT = { coffee: '', github: 'https://github.com/Superrated/Kast' }; // coffee: your Buy Me a Coffee / Ko-fi link
const FBK = [
  ['thanks', '💛', 'Say thanks', 'A kind word goes a long way.'],
  ['bug', '🐞', 'Report a bug', 'Something broken or wrong? Tell what you did and what happened.'],
  ['idea', '💡', 'Suggest a feature', 'An idea that would make Fitted better for you.'],
  ['coffee', '☕', 'Buy me a coffee', 'Help keep Fitted growing.']
];
const FB = { kind: 'thanks', sent: null, inbox: null };
function fbOpen(kind) {
  if (kind) FB.kind = kind;
  FB.sent = null;
  let m = document.getElementById('fbm');
  if (!m) {
    m = document.createElement('div');
    m.id = 'fbm';
    m.className = 'modal';
    document.body.appendChild(m);
    m.addEventListener('click', e => {
      if (e.target === m) m.hidden = true;
    });
  }
  fbRender();
  m.hidden = false;
  const mm = document.getElementById('mmenu');
  if (mm) mm.hidden = true;
  fbInbox();
}
function fbText() {
  const t = document.getElementById('fbText');
  return t ? t.value.trim() : '';
}
function fbTech() {
  const qs = ((geo && geo.secs) || []).filter(q => !q.panel);
  return `Fitted ${APP_VERSION} · ${navigator.userAgent.replace(/\s+/g, ' ').slice(0, 160)} · screen ${innerWidth}×${innerHeight} · design "${ui.docName || 'unsaved'}": wall ${f0(+S.room.W)}×${f0(+S.room.H)}×${f0(+S.room.D)} mm, ${qs.length} columns, ${[...new Set((geo && geo.warns) || [])].length} design notes${S.proj ? `, ${S.proj.walls.length} walls` : ''}`;
}
function fbRender() {
  const m = document.getElementById('fbm');
  if (!m) return;
  const K = FBK.find(k => k[0] === FB.kind) || FBK[0],
    draft = (() => {
      try {
        return localStorage.getItem('fit-fb-' + FB.kind) || '';
      } catch (e) {
        return '';
      }
    })();
  const ph = {
    thanks: 'What do you like about Fitted?',
    bug: 'What did you do, what did you expect, and what happened instead?',
    idea: 'What would you like Fitted to do?'
  }[FB.kind];
  let body = '';
  if (FB.sent)
    body = `<div class="fbdone"><b>${FB.sent === 'db' ? 'Sent — thank you!' : 'Almost there'}</b><p>${FB.sent === 'db' ? 'Your message is with BRUIS. You can send another one any time.' : 'This view can’t send messages directly. Copy your message and send it as a GitHub issue (free account) — or copy it and send it any way you like.'}</p>${FB.sent !== 'db' ? `<div class="fbbtns"><a class="btn pri" target="_blank" rel="noopener" href="${esc(fbIssueUrl())}">Open a GitHub issue</a><button type="button" class="btn" data-act="fbCopy">Copy my message</button></div>` : ''}</div>`;
  else if (FB.kind === 'coffee')
    body = `<div class="fbcoffee"><div class="fbcup" aria-hidden="true">☕</div><p>Fitted is made by <b>BRUIS</b> in Belgium. If it saved you time, money or a ruined sheet of oak, a coffee says thanks and helps build the next features.</p>${SUPPORT.coffee ? `<a class="btn pri" target="_blank" rel="noopener" href="${esc(SUPPORT.coffee)}">Buy me a coffee</a>` : '<p class="hintp" style="margin:0">The coffee link is coming soon — until then, a thank-you message makes my day just as much.</p><button type="button" class="btn pri" data-act="fbKind" data-a="thanks">Say thanks instead</button>'}</div>`;
  else
    body = `<p class="hintp" style="margin:0">${K[3]}</p><textarea id="fbText" rows="6" placeholder="${ph}">${esc(draft)}</textarea>
    <div class="grid2"><label class="fld"><span>Your name (optional)</span><span class="inp"><input type="text" id="fbName" maxlength="60"></span></label><label class="fld"><span>Email, if you'd like an answer (optional)</span><span class="inp"><input type="email" id="fbMail" maxlength="100"></span></label></div>
    ${FB.kind !== 'thanks' ? `<label class="chk"><input type="checkbox" id="fbTech" ${FB.kind === 'bug' ? 'checked' : ''}> Add technical details (app version, browser, size of the design — no personal data)</label>` : ''}
    <div class="fbbtns"><button type="button" class="btn pri" data-act="fbSend">Send</button>${FB.kind !== 'thanks' ? `<a class="linkb" target="_blank" rel="noopener" href="${esc(SUPPORT.github + '/issues')}">or see what others reported on GitHub</a>` : ''}</div>`;
  m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true" aria-label="Messages to BRUIS"><div class="mhead"><h2>Talk to BRUIS</h2></div><div class="mbody" style="display:grid;gap:12px">
    <div class="fbk">${FBK.map(([k, ic, l]) => `<button type="button" class="fbkb ${FB.kind === k ? 'on' : ''}" data-act="fbKind" data-a="${k}"><span aria-hidden="true">${ic}</span>${l}</button>`).join('')}</div>${body}
    <div id="fbInbox">${fbInboxHTML()}</div></div><div class="mfoot"><button class="btn" data-act="fbClose">Close</button><div></div></div></div>`;
}
function fbIssueUrl() {
  const t = fbText() || FB.lastText || '',
    K = FBK.find(k => k[0] === FB.kind) || FBK[0],
    title = `${K[2]}: ${t.split('\n')[0].slice(0, 60)}`;
  return `${SUPPORT.github}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(t + (FB.lastTech ? '\n\n---\n' + FB.lastTech : ''))}`;
}
async function fbSend() {
  const t = fbText();
  if (t.length < 3) {
    toast('Write a few words first');
    return;
  }
  const tech = (document.getElementById('fbTech') || {}).checked ? fbTech() : '';
  FB.lastText = t;
  FB.lastTech = tech;
  const doc = {
    kind: FB.kind,
    text: t.slice(0, 4000),
    name: ((document.getElementById('fbName') || {}).value || '').slice(0, 60),
    contact: ((document.getElementById('fbMail') || {}).value || '').slice(0, 100),
    tech,
    at: Date.now(),
    ver: APP_VERSION
  };
  let ok = false;
  try {
    const db = DS.db || (window.claude && claude.use ? await claude.use('db') : null),
      us = window.claude && claude.use ? await claude.use('user') : null,
      uid = us && us.id ? await us.id() : null;
    if (db && uid) {
      const ref = db.doc('feedback/' + uid);
      let cur = [];
      try {
        const sn = await ref.get();
        const d_ = sn && (typeof sn.data === 'function' ? sn.data() : sn);
        if (d_ && Array.isArray(d_.msgs)) cur = d_.msgs;
      } catch (e) {
        oops('side-panel #1', e);
      }
      cur.push(Object.assign({ id: 'm' + Date.now().toString(36) }, doc));
      await ref.set({ msgs: cur.slice(-50), at: doc.at });
      ok = true;
    }
  } catch (e) {
    ok = false;
  }
  try {
    localStorage.removeItem('fit-fb-' + FB.kind);
  } catch (e) {
    oops('side-panel #2', e, 1);
  }
  FB.sent = ok ? 'db' : 'copy';
  fbRender();
  if (ok) fbInbox();
}
async function fbInbox() {
  try {
    const db = DS.db;
    if (!db) {
      FB.inbox = null;
      return;
    }
    const snap = await db.collection('feedback').limit(200).get();
    FB.inbox = snap.docs
      .flatMap(d => {
        const v = d.data() || {};
        return (v.msgs || []).map(m => Object.assign({}, m, { uid: d.id }));
      })
      .sort((a, b) => (+b.at || 0) - (+a.at || 0));
  } catch (e) {
    FB.inbox = null;
  }
  const el = document.getElementById('fbInbox');
  if (el) el.innerHTML = fbInboxHTML();
}
function fbInboxHTML() {
  const L = FB.inbox;
  if (!L || !L.length) return '';
  const IC = Object.fromEntries(FBK.map(k => [k[0], k[1]]));
  return `<details class="pf fbin"><summary>Messages received (${L.length}) — only you and your editors see these</summary><div class="fblist">${L.map(m => `<div class="fbmsg"><div class="fbmh"><span>${IC[m.kind] || '✉️'} <b>${esc(m.name || 'Someone')}</b>${m.contact ? ` · ${esc(m.contact)}` : ''}</span><span class="note">${dsAgo(+m.at || 0)}</span></div><p>${esc(m.text || '')}</p>${m.tech ? `<small>${esc(m.tech)}</small>` : ''}<button type="button" class="rowbtn" data-act="fbDel" data-a="${esc(m.uid + '|' + m.id)}" aria-label="Delete message">×</button></div>`).join('')}</div></details>`;
}
document.addEventListener('input', e => {
  if (e.target && e.target.id === 'fbText') {
    try {
      localStorage.setItem('fit-fb-' + FB.kind, e.target.value);
    } catch (_) {
      oops('side-panel #3', _, 1);
    }
  }
});
function renderSide() {
  const el = document.getElementById('side'),
    op = k => (openState[k] || (k === 'secs' && isSheet()) ? 'open' : ''),
    R = S.room;
  const pane = PANES.find(x => x[0] === (ui.pane || 'layout')) || PANES[1];
  let h = `<details class="acc" data-k="room" ${op('room')}><summary>Wall</summary><div class="accb">
    <div class="grid2">${S.proj ? `<div class="fld"><span>Wall width</span><span class="note" style="padding:8px 0">${f0(R.W)} mm for cabinets — the wall length is set under “Walls in this room”</span></div>` : fld('Wall width', 'room.W')}${fld('Full ceiling height', 'room.H')}${fld('Cabinet depth', 'room.D')}${fld('Ceiling lower at the back by', 'room.drop')}</div>
    <div style="display:grid;gap:8px">${chk('The back wall is not parallel to the cabinet front', 'room.skew.on')}${
      R.skew && R.skew.on
        ? `<div class="grid2">${fld('Depth available at the left end', 'room.skew.dL', { ph: String(R.D) })}${fld('Depth available at the right end', 'room.skew.dR', { ph: String(R.D) })}</div>${skewPlan()}<p class="hintp" style="margin:0">Measure from where the cabinet front will be, straight back to the wall, at both ends. The front stays straight and every column is made as deep as the wall allows at its shallowest corner, rounded down to 10 mm${
            geo.skew
              ? `: ${geo.secs
                  .filter(q => !q.panel)
                  .map(q => `S${q.i + 1} ${f0(q.D)}`)
                  .join(' · ')} mm`
              : ''
          }. The wedge-shaped gap behind is hidden by the side closing strips. Shelves, backs, drawer runners and the price follow each column's own depth.</p>`
        : ''
    }</div>
    <p class="hintp">Depth includes the back panel; doors add their thickness in front. “Ceiling lower at the back by” is for a roof that also slopes toward the wall (positive = lower at the back).</p></div></details>`;
  h += `<details class="acc" data-k="ceil" ${op('ceil')}><summary>Ceiling &amp; slopes</summary><div class="accb">
    <p class="hintp">Points trace the ceiling line where it meets the front of the cabinet, measured from the left wall. Add a point for each change of slope.</p>
    <div class="chips"><button class="btn sm" data-act="ceilPreset" data-a="flat">Flat</button><button class="btn sm" data-act="ceilPreset" data-a="left">Slope left</button><button class="btn sm" data-act="ceilPreset" data-a="right">Slope right</button><button class="btn sm" data-act="ceilPreset" data-a="both">Both sides</button></div>
    <table class="mini"><tr><td class="note">From left (x)</td><td class="note">Height (y)</td><td></td></tr>${R.ceil.map((c, i) => `<tr><td><input type="number" inputmode="decimal" id="${idOf('room.ceil.' + i + '.x')}" data-p="room.ceil.${i}.x" value="${c.x}"></td><td><input type="number" inputmode="decimal" id="${idOf('room.ceil.' + i + '.y')}" data-p="room.ceil.${i}.y" value="${c.y}"></td><td><button class="rowbtn" data-act="delCeil" data-a="${i}" aria-label="Remove point">×</button></td></tr>`).join('')}</table>
    <button class="btn sm" data-act="addCeil">Add point</button></div></details>`;
  {
    const st = geo.site || { wobs: [] },
      lv = R.lvl || {},
      wl = Array.isArray(R.wobs) ? R.wobs : [];
    h += `<details class="acc" data-k="site" ${op('site')}><summary>Floor, walls &amp; things on the wall</summary><div class="accb">
    <p class="hintp">Old houses are never square. Fill in what you measure and the plinth, side closing strips and backs are cut to match.</p>
    ${chk('The floor or the side walls are not level / straight', 'room.lvl.on')}
    ${
      lv.on
        ? `<div class="grid2">${fld('Floor at the right end, compared with the left', 'room.lvl.fR', { ph: '0' })}<span></span>${fld('Left wall: gap at the top', 'room.lvl.wL', { ph: '0' })}${fld('Right wall: gap at the top', 'room.lvl.wR', { ph: '0' })}</div>
      <p class="hintp" style="margin:0"><b>Floor:</b> lay a long spirit level (or a laser line) along the wall. + means the floor is higher at the right end, − lower. <b>Walls:</b> hold the level upright against the foot of the side wall; the gap between level and wall at ceiling height is the number (+ if the wall leans away from the cabinet, − if it leans in over it).${st.fD ? ` The cabinet is set level from the high (${st.fD > 0 ? 'right' : 'left'}) end; the plinth grows from ${f0(geo.P)} to ${f0(geo.P + Math.abs(st.fD))} mm. Measure your ceiling heights from that high end.` : ''}</p>`
        : ''
    }
    ${chk('There is a skirting board on the walls', 'room.skb.on')}
    ${R.skb && R.skb.on ? `<div class="grid2">${fld('Skirting board height', 'room.skb.h', { ph: '70' })}${fld('Thickness', 'room.skb.t', { ph: '12' })}</div><p class="hintp" style="margin:0">Best: take it off behind the cabinet so the boxes stand against the wall. The side closing strips get a notch so they close over the skirting board on the side walls.</p>` : ''}
    ${wl
      .map((o, i) => {
        const p_ = 'room.wobs.' + i,
          t = WOB[o.type] ? o.type : 'socket',
          g_ = st.wobs[i];
        return `<div class="card"><div class="cardh"><h4>${WOB[t].n} ${i + 1}</h4><button class="rowbtn" data-act="delWob" data-a="${i}" aria-label="Remove">×</button></div>
      <div class="grid2">${t === 'radiator' ? fld('Left edge, from left wall', p_ + '.x') + fld('Width', p_ + '.w', { ph: '1000' }) + fld('Underside above floor', p_ + '.y', { ph: '150' }) + fld('Height', p_ + '.h', { ph: '600' }) : t === 'pipe' ? fld('Centre, from left wall', p_ + '.x') + fld('Thickness', p_ + '.w', { ph: '22' }) + fld('Sticks out from the wall', p_ + '.p', { ph: '37' }) + fld('Runs up to', p_ + '.h', { ph: 'ceiling' }) : WOB[t].keep ? fld('Centre, from left wall', p_ + '.x') + fld('Centre, above floor', p_ + '.y', { ph: String(WOB[t].y) }) + fld('Width', p_ + '.w', { ph: String(WOB[t].w) }) + fld('Height', p_ + '.h', { ph: String(WOB[t].h) }) + (t === 'boiler' ? fld('Sticks out from the wall', p_ + '.p', { ph: '350' }) : '') : fld('Centre, from left wall', p_ + '.x') + fld('Centre, above floor', p_ + '.y', { ph: String(WOB[t].y) })}</div>
      ${g_ ? `<p class="hintp" style="margin:0;${g_.bad ? 'color:#B4532A;font-weight:600' : ''}">${g_.bad ? 'In the way — see the warning under the drawing.' : esc(g_.msg || '')}</p>` : ''}</div>`;
      })
      .join('')}
    <div class="tchips"><button type="button" class="tchip" data-act="addWob" data-a="socket">+ Socket</button><button type="button" class="tchip" data-act="addWob" data-a="switch">+ Switch</button><button type="button" class="tchip" data-act="addWob" data-a="radiator">+ Radiator</button><button type="button" class="tchip" data-act="addWob" data-a="pipe">+ Pipe</button></div>
    <div class="fitg"><small>Must stay reachable — Fitted keeps a door in front, with no shelf or drawer in the way</small><div class="tchips">${[
      ['fuse', 'Fuse box'],
      ['meter', 'Meter'],
      ['boiler', 'Boiler'],
      ['tap', 'Stopcock / tap'],
      ['access', 'Inspection hatch']
    ]
      .map(([k, l]) => `<button type="button" class="tchip" data-act="addWob" data-a="${k}">+ ${l}</button>`)
      .join('')}</div></div>
    ${(Array.isArray(R.bumps) ? R.bumps : [])
      .map((b, i) => {
        const p_ = 'room.bumps.' + i;
        return `<div class="card"><div class="cardh"><h4>${BUMPS[b.type] || 'Bump in the wall'}</h4><button class="rowbtn" data-act="delBump" data-a="${i}" aria-label="Remove">×</button></div>
      <div class="fld"><span>What is it</span>${seg(p_ + '.type', Object.entries(BUMPS), { dflt: 'chimney' })}</div>
      <div class="grid2">${fld('Left edge, from left wall', p_ + '.x')}${fld('Width', p_ + '.w', { ph: '600' })}${fld('Sticks out from the wall', p_ + '.d', { ph: '200' })}${fld('Height (empty = to the ceiling)', p_ + '.h', { ph: 'ceiling' })}</div>
      <div class="fld"><span>How the cabinet deals with it</span>${seg(
        p_ + '.mode',
        [
          ['shallow', 'Columns in front get shallower'],
          ['notch', 'Notch the parts around it']
        ],
        { dflt: 'shallow' }
      )}</div></div>`;
      })
      .join('')}
    <div class="fitg"><small>Something sticking out of the wall behind the cabinet</small><div class="tchips">${Object.entries(
      BUMPS
    )
      .map(([k, l]) => `<button type="button" class="tchip" data-act="addBump" data-a="${k}">+ ${l}</button>`)
      .join('')}</div></div>
    <p class="hintp" style="margin:0">They show as blue outlines on the drawing (orange when something is in the way). Sockets get a cut-out in the back panel; shuffling tries to keep sides, shelves and drawers away from them.</p>
  </div></details>`;
  }
  h += `<details class="acc" data-k="walls" ${op('walls')}><summary>Walls in this room${S.proj ? ` (${S.proj.walls.length})` : ''}</summary><div class="accb">${pjHTML()}</div></details>`;
  {
    const F = R.front || {};
    h += `<details class="acc" data-k="front" ${op('front')}><summary>Space in front · hallway</summary><div class="accb">
    <p class="hintp">How much floor is free in front of the cabinet? Fitted checks that every door, drawer, pull-out and fold-down bed can open — and in a hallway, that you can still walk past.</p>
    ${chk('I know how much space there is in front', 'room.front.on')}
    ${F.on ? `<div class="grid2">${fld('Free floor in front of the cabinet', 'room.front.space', { ph: '1200' })}<div></div></div>${chk('This is a hallway — keep a 900 mm walking path', 'room.front.hall')}<div class="pjwrap">${frontPlanSVG()}</div><p class="hintp" style="margin:0">Seen from above: the cabinet (blue), how the doors open (dashed), doors in the side walls (orange) and the ${F.hall ? 'walking path' : 'room to stand'} in front.</p>` : ''}
  </div></details>`;
  }
  {
    const A = R.access || {},
      ga = geo.access;
    h += `<details class="acc" data-k="access" ${op('access')}><summary>Getting it in</summary><div class="accb">
    <p class="hintp">Tick what is on the way from the front door and measure the tightest spot. Fitted checks every box and board against it.</p>
    ${ACC_KINDS.map(([k, ic, l]) => {
      const o = A[k] || {};
      return `${chk(ic + ' ' + l, 'room.access.' + k + '.on')}${
        o.on
          ? `<div class="grid2">${fld(k === 'stairs' ? 'Narrowest width' : k === 'hatch' ? 'Opening width' : 'Clear width', 'room.access.' + k + '.w')}${fld(k === 'stairs' ? 'Lowest headroom' : k === 'hatch' ? 'Opening length' : 'Clear height', 'room.access.' + k + '.h')}</div>${
              k === 'stairs'
                ? seg(
                    'room.access.stairs.turn',
                    [
                      ['none', 'Straight'],
                      ['quarter', 'Quarter turn'],
                      ['half', 'Half turn']
                    ],
                    { dflt: 'none' }
                  )
                : ''
            }`
          : ''
      }`;
    }).join('')}
    ${
      ga
        ? `<div class="accres">${ga.parts.length ? `<p class="hintp" style="color:var(--warn);margin:0"><b>✗ Too long to get in:</b> ${ga.parts.map(x => esc(x.name) + ' — ' + esc(x.why)).join('; ')}</p>` : '<p class="hintp" style="margin:0">✓ Every board gets in.</p>'}
      ${ga.boxes.length ? `<ul class="acclist">${ga.boxes.map(b => `<li class="${b.ok ? 'ok' : 'no'}">${b.ok ? '✓' : '↻'} <b>${b.lab}</b> ${f0(b.dims[0])}×${f0(b.dims[1])}×${f0(b.dims[2])} — ${b.ok ? 'carry it up built' : 'carry the parts up, build it in the room'}</li>`).join('')}</ul>` : ''}</div>`
        : ''
    }
  </div></details>`;
  }
  h += `<details class="acc" data-k="obs" ${op('obs')}><summary>Beams &amp; things in the ceiling</summary><div class="accb">
    <p class="hintp">Steel beams or ducts at the top. A beam deeper than the cabinet lowers the columns under it and the top closing strip stops at the beam; a shallower one sits behind the closing strip.</p>
    ${R.beams.map((b, i) => `<div class="card"><div class="cardh"><h4>Beam ${i + 1}</h4><button class="rowbtn" data-act="delBeam" data-a="${i}" aria-label="Remove beam">×</button></div><div class="grid2">${fld('From left wall', `room.beams.${i}.x`)}${fld('Width', `room.beams.${i}.w`)}${fld('Underside height', `room.beams.${i}.bottom`)}${fld('Sticks out from the wall', `room.beams.${i}.depth`)}</div></div>`).join('')}
    <div class="tchips"><button type="button" class="tchip" data-act="addBeam">+ Steel beam</button><button type="button" class="tchip" data-act="addPurlin">+ Roof purlin (along the wall)</button>${Object.entries(
      COBJ
    )
      .map(([k, l]) => `<button type="button" class="tchip" data-act="addCobj" data-a="${k}">+ ${l}</button>`)
      .join('')}</div>
    ${(Array.isArray(R.cobjs) ? R.cobjs : [])
      .map((o, i) => {
        const p_ = 'room.cobjs.' + i,
          t = COBJ[o.type] ? o.type : 'light';
        return `<div class="card"><div class="cardh"><h4>${COBJ[t]}</h4><button class="rowbtn" data-act="delCobj" data-a="${i}" aria-label="Remove">×</button></div><div class="grid2">${t === 'dormer' ? fld('Left edge, from left wall', p_ + '.x') + fld('Width', p_ + '.w', { ph: '1200' }) + fld('Ceiling height inside the dormer', p_ + '.h', { ph: '2300' }) + fld('Window sill height', p_ + '.sill', { ph: '900' }) : t === 'hatch' ? fld('Left edge, from left wall', p_ + '.x') + fld('Width', p_ + '.w', { ph: '600' }) + fld('Centre, out from this wall', p_ + '.d', { ph: '1200' }) + fld('Length (out from the wall)', p_ + '.L', { ph: '900' }) : fld('From left wall', p_ + '.x') + fld('Out from this wall', p_ + '.d', { ph: '800' })}</div></div>`;
      })
      .join('')}</div></details>`;
  {
    const pr = R.person || {},
      objs = Array.isArray(R.objs) ? R.objs : [],
      gp = geo.person;
    h += `<details class="acc" data-k="ppl" ${op('ppl')}><summary>People, windows &amp; doors</summary><div class="accb">
    <p class="hintp">See the cabinets at true scale next to a person, with reach lines, and mark windows and doors so nothing gets built in front of them.</p>
    <label class="chk"><input type="checkbox" data-act="personOn" ${pr.on ? 'checked' : ''}> Show a person</label>
    ${
      pr.on
        ? `<div class="fld"><span>Who</span><div class="tchips">${[
            [1200, 'Child 1.20'],
            [1600, '1.60 m'],
            [1750, '1.75 m'],
            [1900, '1.90 m']
          ]
            .map(
              ([v, l]) =>
                `<button type="button" class="tchip ${(+pr.h || 1750) === v ? 'on' : ''}" data-act="setv" data-a="room.person.h|${v}|n">${l}</button>`
            )
            .join('')}</div></div>
      <div class="grid2">${fld('Height', 'room.person.h', { ph: '1750' })}${fld('Stands at (from left wall)', 'room.person.x', { ph: 'auto · ' + f0(gp ? gp.x : 0), auto: true })}</div>
      ${gp ? `<p class="hintp" style="margin:0">Eye level ${f0(gp.eye)} · easy reach ${f0(gp.low)}–${f0(gp.easy)} · max reach on flat feet ≈ ${f0(gp.max)} mm. Put everyday things in the green band; above ${f0(gp.max)} needs a step or the ladder.</p>` : ''}`
        : ''
    }
    ${objs
      .map((o, i) => {
        const p_ = 'room.objs.' + i,
          t = o.type || 'window';
        return `<div class="card"><div class="cardh"><h4>${{ window: 'Window', door: 'Door', roofwin: 'Roof window' }[t] || 'Window'} ${i + 1}</h4><button class="rowbtn" data-act="delObj" data-a="${i}" aria-label="Remove">×</button></div>
      <div class="fld"><span>Type</span>${seg(
        p_ + '.type',
        [
          ['window', 'Window'],
          ['door', 'Door']
        ],
        { dflt: 'window' }
      )}</div>
      <div class="fld"><span>Which wall</span>${seg(
        p_ + '.wall',
        [
          ['back', 'Cabinet wall'],
          ['left', 'Left wall'],
          ['right', 'Right wall']
        ],
        { dflt: 'back' }
      )}</div>
      ${
        o.wall && o.wall !== 'back' && t === 'door'
          ? `<div class="fld"><span>The door opens</span>${seg(
              p_ + '.opens',
              [
                ['', 'Into this room'],
                ['out', 'Out of this room']
              ],
              { dflt: '' }
            )}</div><div class="fld"><span>Hinges</span>${seg(
              p_ + '.hinge',
              [
                ['', 'On the side nearest the cabinet'],
                ['far', 'On the far side']
              ],
              { dflt: '' }
            )}</div>`
          : ''
      }<div class="grid2">${fld(o.wall && o.wall !== 'back' ? 'Nearest edge, from the cabinet wall' : 'From left wall', p_ + '.x')}${fld('Width', p_ + '.w', { ph: t === 'door' ? '830' : '900' })}${t === 'door' ? '' : fld('Sill height', p_ + '.y', { ph: '850' })}${fld('Height', p_ + '.h', { ph: t === 'door' ? '2015' : '1200' })}</div></div>`;
      })
      .join('')}
    <div class="tchips"><button type="button" class="tchip" data-act="addObj" data-a="window">+ Window</button><button type="button" class="tchip" data-act="addObj" data-a="door">+ Door</button></div>
  </div></details>`;
  }
  {
    const so = S.opts.screen || {},
      gs_ = geo.screen;
    h += `<details class="acc" data-k="scr" ${op('scr')}><summary>Projector screen</summary><div class="accb">
    <p class="hintp">The screen hides in one very wide, shallow drawer across the top of several columns, flush with the doors. Pull the drawer out a hand’s width and the screen drops in front of the cabinet. Closed, it reads as a row of small doors.</p>
    <label class="chk"><input type="checkbox" data-act="scrOn" ${so.on ? 'checked' : ''}> Hidden pull-down projector screen</label>
    ${
      so.on
        ? `<div class="fld"><span>Show it</span>${seg(
            'opts.screen.show',
            [
              ['up', 'Rolled up (hidden)'],
              ['down', 'Pulled down']
            ],
            { dflt: 'up' }
          )}</div><p class="hintp" style="margin:0">Pulled down, the screen is drawn see-through so you can keep designing and shuffling behind it. “Cinema view” in 3D shows it solid.</p>
      <div class="fld"><span>Where on the wall</span>${seg(
        'opts.screen.pos',
        [
          ['auto', 'Best spot'],
          ['centre', 'Middle of the wall'],
          ['x', 'Set it myself']
        ],
        { dflt: so.x != null && so.x !== '' ? 'x' : 'auto' }
      )}</div>
      <div class="grid2">${fld('Screen width (mm)', 'opts.screen.w', { ph: 'auto · ' + (gs_ ? f0(gs_.w) : ''), auto: true })}${(so.pos || 'auto') === 'x' ? fld('Centre (from left wall)', 'opts.screen.x', { ph: 'auto · ' + (gs_ ? f0(gs_.xc) : ''), auto: true }) : '<div></div>'}</div>
      <div class="tchips">${[1600, 1800, 2000, 2200, 2400, 2800].map(d => `<button type="button" class="tchip ${+so.w === d ? 'on' : ''}" data-act="setv" data-a="opts.screen.w|${d}|n">${d / 1000} m</button>`).join('')}</div>
      <div class="grid2">${fld('Cassette size (height = depth)', 'opts.screen.cas', { ph: '90' })}<div></div></div>
      <div class="fld"><span>Drawer front</span>${seg(
        'opts.screen.faux',
        [
          ['doors', 'Faux doors (a groove at each column)'],
          ['plain', 'One plain band']
        ],
        { dflt: 'doors' }
      )}</div>
      ${gs_ ? `<p class="hintp" style="margin:0">Picture ${f0(gs_.w)} × ${f0(gs_.h)} mm (16:9, about ${gs_.diag}″), bottom edge ${f0(gs_.imgBot)} mm above the floor. The drawer is ${f0(gs_.bx1 - gs_.bx0)} mm wide and ${f0(gs_.boxH)} mm high, across columns ${gs_.cols[0] + 1}–${gs_.cols[1] + 1}; those columns are ${f0(gs_.boxH)} mm lower to make room. It pulls out ${f0(gs_.pull)} mm. The doors under it can’t open while the screen is down. Put a normal projector about ${((gs_.w * 1.2) / 1000).toFixed(1)}–${((gs_.w * 1.5) / 1000).toFixed(1)} m away (short-throw: about ${((gs_.w * 0.5) / 1000).toFixed(1)} m). Up to about ${gs_.fit ? f0(gs_.fit) + ' mm wide' : '—'} fits well on this wall.</p>` : ''}`
        : ''
    }
  </div></details>`;
  }
  h += `<details class="acc" data-k="wt" ${op('wt')}><summary>Weight &amp; wall fixing</summary><div class="accb">${fixHTML(geo)}</div></details>`;
  h += `<details class="acc" data-k="plan" ${op('plan')}><summary>Time &amp; weekend plan</summary><div class="accb">${planHTML(geo)}</div></details>`;
  h += `<details class="acc" data-k="con" ${op('con')}><summary>Construction</summary><div class="accb">
    ${seg('opts.construct', [
      ['shared', 'Shared sides'],
      ['boxes', 'Separate boxes']
    ])}
    <p class="hintp"><b>Separate boxes</b> (recommended here): each column is its own carcass with two sides, so you can carry it up the stairs, square it on the floor and level it on its own under slopes and the beam. Doors cover each box fully, so the double side only shows in open columns. Costs a little more board.</p>
    <p class="hintp"><b>Shared sides</b>: one ${S.mat.carcass.t} mm panel between columns — less material and weight, but the whole carcass is built and levelled in place.</p>
    <div class="fld"><span>Edge band you put on yourself</span>${seg(
      'opts.bandTh',
      [
        ['', 'Thin iron-on (0.4 mm) — ignore'],
        ['1', '1 mm ABS'],
        ['2', '2 mm ABS']
      ],
      { dflt: '' }
    )}</div>${+S.opts.bandTh > 0.45 ? '<p class="hintp" style="margin:0">Parts are cut smaller by the band on each banded edge, so they end up at the drawn size. The cut list shows the saw size with the finished size under it; the shop Excel keeps finished sizes (the shop subtracts it).</p>' : ''}
    <div class="fld"><span>How the boards are joined</span>${seg(
      'opts.joinery',
      [
        ['confirmat', 'Confirmat screws 7×50 ' + eurs(1)],
        ['screw', 'Chipboard screws ' + eurs(1)],
        ['minifix', 'Minifix cams + dowels ' + eurs(3)],
        ['dowel', 'Glued dowels ' + eurs(2)]
      ],
      { dflt: 'confirmat' }
    )}</div>
    <p class="hintp" style="margin:0">${(FASTEN[S.opts.joinery || 'confirmat'] || FASTEN.confirmat).how}</p>
    <div class="fld"><span>Hinges &amp; runners</span>${seg(
      'opts.hw.brand',
      [
        ['blum', 'Blum ' + eurs(3)],
        ['blumeco', 'Blum budget ' + eurs(1)],
        ['generic', 'Any brand ' + eurs(2)]
      ],
      { dflt: 'blum' }
    )}</div>
    ${(S.opts.hw || {}).brand === 'blumeco' ? '<p class="hintp" style="margin:0">Blum’s low-cost lines: MODUL slide-on hinges (no soft close) and STANDARD roller runners (single extension, 25 kg). The drawer boxes are sized for the roller runners.</p>' : ''}${
      ((S.opts.hw || {}).brand || 'blum') === 'blum'
        ? `<div class="fld"><span>Blum door hinges</span>${seg(
            'opts.hw.hinge',
            [
              ['110', '110° soft close ' + eurs(3)],
              ['155', '155° wide opening ' + eurs(4)]
            ],
            { dflt: '110' }
          )}</div><div class="fld"><span>Blum drawer runners</span>${seg(
            'opts.hw.runner',
            [
              ['tandem', 'TANDEM 550H ' + eurs(3)],
              ['movento', 'MOVENTO 760H ' + eurs(5)]
            ],
            { dflt: 'tandem' }
          )}</div><p class="hintp" style="margin:0">The hardware list shows Blum names, article numbers and runner lengths. Desk doors always get 155° hinges; inset fronts get inset hinges; handleless fronts get TIP-ON.</p>`
        : ''
    }
    <div class="fld"><span>Holes for shelf supports</span>${seg(
      'opts.pinHoles',
      [
        ['needed', 'Only where needed'],
        ['some', 'A few to adjust'],
        ['rows', 'Full rows']
      ],
      { dflt: 'rows' }
    )}</div>
    <p class="hintp" style="margin:0">${{ needed: 'Cleanest inside: 4 holes per shelf, exactly where it sits. Shelves can’t be moved later.', some: 'Holes at each shelf plus two 32 mm steps up and down — move a shelf ±64 mm later without drilling.', rows: 'A full 32 mm row from top to bottom of every shelf level — move shelves anywhere, any time.' }[S.opts.pinHoles || 'rows']}</p>
    <div class="grid2">${fld('Tallest box to carry in', 'opts.maxUnitH', { ph: 'auto · ' + f0(geo.maxUnitAuto || 2780), auto: true })}${fld('Longest closing strip', 'opts.maxSkirtL', { ph: 'auto · ' + f0(geo.maxSkirt || 2780), auto: true })}</div>
    <p class="hintp" style="margin:0">Taller columns are built as two stacked units, and longer closing strips and plinths are cut in pieces that join over a cabinet side. Auto follows your sheet size, or the pre-edged board length when those are on.</p>
    <div class="fld"><span>Back panel</span>${seg(
      'opts.backFix',
      [
        ['groove', 'In a groove'],
        ['nailed', 'Nailed on the back']
      ],
      { dflt: 'groove' }
    )}</div>
    <p class="hintp" style="margin:0">${(S.opts.backFix || 'groove') === 'groove' ? `The back slides into an ${Math.round((+S.mat.back.t + 0.5) * 10) / 10} × 10 mm groove, 18 mm in from the back edge — stiffer, no nails, and an 18 mm gap behind for cables and scribing.` : 'The back is nailed or screwed onto the back edges every 150 mm — quicker, but the edge shows from the side.'}</p></div></details>`;
  {
    const sc = stockCfg();
    h += `<details class="acc" data-k="stk" ${op('stk')}><summary>Furniture panels (meubelpanelen)</summary><div class="accb">
    <label class="chk"><input type="checkbox" data-act="stkOn" ${sc.on ? 'checked' : ''}> Use ready-made melamine furniture panels (meubelpanelen) — ${sc.L} mm long, edge band already on both long sides</label>
    ${
      sc.on
        ? `<div class="fld"><span>Board widths you can buy</span><div class="tchips">${STOCK_W.map(w => `<button type="button" class="tchip ${sc.ws.includes(w) ? 'on' : ''}" data-act="stkW" data-a="${w}">${w / 10} cm</button>`).join('')}</div></div>
    <div class="fld"><span>Use them for</span><div class="tchips">${[
      ['carcass', 'Sides, tops & bottoms'],
      ['shelf', 'Shelves'],
      ['skirt', 'Closing strips & plinth'],
      ['desk', 'Desk top'],
      ['front', 'Fronts']
    ]
      .map(
        ([k, l]) =>
          `<button type="button" class="tchip ${sc.roles[k] ? 'on' : ''}" data-act="stkR" data-a="${k}">${l}</button>`
      )
      .join('')}</div></div>
    <div class="grid2">${fld('Board length', 'opts.stock.L', { ph: '2500' })}<div></div></div>
    <p class="hintp" style="margin:0">Only melamine parts that fit across one of these widths and are shorter than the board are taken from boards; the rest stays on full sheets. Tip: a cabinet depth of ${sc.ws
      .filter(w => w >= 300)
      .map(w => w)
      .join(' / ')} mm uses the full board width for the sides, with no ripping.</p>`
        : ''
    }</div></details>`;
  }
  h += `<details class="acc" data-k="hd" ${op('hd')}><summary>Doors &amp; handles</summary><div class="accb">
    <div class="hgrid">${HANDLES.map(([k, l]) => `<button type="button" class="hopt ${S.opts.handle === k ? 'on' : ''}" data-act="setv" data-a="opts.handle|${k}|s">${handleIcon(k)}<span>${l}</span></button>`).join('')}</div>
    ${
      hCat(S.opts.handle)
        ? `<div class="fld"><span>Handle size${hCat(S.opts.handle) === 'bar' ? ' — S 128 · M 192 · L 320 · XL 600 mm' : hCat(S.opts.handle) === 'knob' || hCat(S.opts.handle) === 'hole' ? ' — Ø 26 · 34 · 42 · 50 mm' : hCat(S.opts.handle) === 'disc' ? ' — 60 · 80 · 100 · 120 mm' : hCat(S.opts.handle) === 'stick' ? ' — 250 · 400 · 600 · 900 mm' : ''}</span>${seg(
            'opts.handleSize',
            [
              ['S', 'S'],
              ['M', 'M'],
              ['L', 'L'],
              ['XL', 'XL'],
              ['F', 'Full length']
            ],
            { dflt: 'M' }
          )}</div>`
        : ''
    }
    ${
      ['stick', 'cross', 'ring'].includes(S.opts.handle)
        ? `<div class="fld"><span>Handle colour</span><div class="tchips">${Object.entries(HCOL)
            .map(
              ([k, v]) =>
                `<button type="button" class="tchip ${(S.opts.handleCol || 'blue') === k ? 'on' : ''}" data-act="setv" data-a="opts.handleCol|${k}|s"><i class="dot" style="width:14px;height:14px;background:${v[1]}"></i>${v[0]}</button>`
            )
            .join('')}</div></div>`
        : ''
    }
    
    ${S.opts.handle === 'disc' ? `<div style="display:grid;gap:6px">${chk('One disc across the seam of a door pair — half on each door', `opts.discSeam`)}</div>` : ''}
    ${
      isWoodHandle(S.opts.handle)
        ? `<div class="fld"><span>Wood</span><div class="tchips">${Object.entries(WOODS)
            .map(
              ([k, wv]) =>
                `<button type="button" class="tchip ${(S.opts.handleWood || 'oak') === k ? 'on' : ''}" data-act="setv" data-a="opts.handleWood|${k}|s"><i class="dot" style="width:14px;height:14px;background:${wv.c}"></i>${wv.name}</button>`
            )
            .join('')}</div></div>`
        : ''
    }
    <div class="grid2">${fld('Gap between doors', 'opts.gap', { step: 0.5 })}</div>
    <div style="display:grid;gap:6px">${chk('Light inside the cupboards', `opts.innerLight`)}${
      S.opts.innerLight
        ? seg(
            'opts.lightSensor',
            [
              ['', 'Switches on when the door opens'],
              ['motion', 'Motion sensor']
            ],
            { dflt: '' }
          )
        : ''
    }</div>
    <div class="ttbox">${chk('Two-tone fronts — upper fronts in a second colour', 'opts.two.on')}
    ${S.opts.two && S.opts.two.on ? `<div class="grid2">${finSelect('Upper colour', 'opts.two.fin')}${fld('Split line', 'opts.two.y', { ph: '1000' })}</div><p class="hintp" style="margin:0">Fronts whose middle sits above the split line take the upper colour. Line it up with the worktop or desk (≈ 900–1000 mm) for the classic look.</p>` : ''}</div>
    <p class="hintp">Finger holes, slots and grooves are cut into the panels and appear in Shaped parts. Fabric fronts and individual front colours are set per level in Layout.</p></div></details>`;
  {
    const LD = S.ladder || {},
      G_ = geo.ladder;
    h += `<details class="acc" data-k="lad" ${op('lad')}><summary>Book ladder</summary><div class="accb">
    <label class="chk"><input type="checkbox" id="i-ladder-on" data-p="ladder.on" data-re="1" data-ladon="1" ${LD.on ? 'checked' : ''}> Rolling library ladder on a rail</label>
    ${
      LD.on
        ? `<p class="hintp" style="margin:0">The rail runs along the tallest stretch of the fronts.${G_ ? ` Rail ${f0(G_.r1 - G_.r0)} mm long at ${f0(G_.h)} mm; ladder ${f0(G_.len)} mm at 75°.` : ''}</p>
    <div class="fld"><span>Slide the ladder</span><div class="step rail"><button type="button" data-act="ladPos" data-a="-0.1">◀ Left</button><b>${Math.round((LD.pos ?? 0.5) * 100)}%</b><button type="button" data-act="ladPos" data-a="0.1">Right ▶</button></div></div>
    <div class="grid2">${fld('Rail height', 'ladder.h', { ph: G_ ? String(f0(G_.h)) : 'auto', auto: true })}<div></div></div>
    ${G_ ? `<button type="button" class="btn ${G_.miss && G_.miss.length ? 'pri' : ''}" data-act="ladAlign">Line up the cabinets with the rail</button><p class="hintp" style="margin:0">${G_.miss && G_.miss.length ? `${G_.miss.length} column${G_.miss.length > 1 ? 's' : ''} still cross${G_.miss.length > 1 ? '' : 'es'} the rail line.` : 'Every column under the rail has a joint at the rail height, so the rail runs along one straight line across the fronts.'} Auto height picks the height where the rail can run the longest.</p>` : ''}
    <div class="fld"><span>Wood</span><div class="tchips">${Object.entries(WOODS)
      .map(
        ([k, wv]) =>
          `<button type="button" class="tchip ${(LD.wood || 'oak') === k ? 'on' : ''}" data-act="setv" data-a="ladder.wood|${k}|s"><i class="dot" style="width:14px;height:14px;background:${wv.c}"></i>${wv.name}</button>`
      )
      .join('')}</div></div>`
        : ''
    }
  </div></details>`;
  }
  h += `<details class="acc" data-k="sk" ${op('sk')}><summary>Closing strips &amp; gaps</summary><div class="accb"><div class="grid2">
    ${fld('Strip to the ceiling (min)', 'skirt.top')}${fld('Strips to the side walls', 'skirt.side')}${fld('Plinth (floor strip) height', 'skirt.plinth')}${fld('Plinth set back by', 'skirt.recess')}
    ${fld('Extra to trim against the wall', 'skirt.scribe')}${fld('Beam clearance', 'skirt.beamGap')}${fld('Shelves set back from the front', 'opts.setback')}${fld('Saw blade thickness', 'opts.kerf')}${fld('Trim off each sheet edge', 'opts.trim')}</div></div></details>`;
  h += `<details class="acc" data-k="mat" ${op('mat')}><summary>Materials</summary><div class="accb">
    ${ROLES.map(
      ([k, l]) =>
        `<div class="mcard"><div class="mtitle">${l}<span>${esc(MATS[S.mat[k].type]?.short || '')} · ${S.mat[k].t} mm ${eurs(boardLevel(S.mat[k].type))}</span></div>${finButton('mat.' + k + '.fin')}${mx(
          'Board &amp; sheet size',
          `<div class="mgrid">${sel(
            'Board',
            `mat.${k}.type`,
            Object.entries(MATS).map(([m, v]) => [m, v.name + '  ' + eurs(boardLevel(m), true)]),
            { re: true }
          )}${fld('Thickness', `mat.${k}.t`)}</div><details class="pf"><summary>Sheet size · ${S.mat[k].sheet.replace('x', ' × ')}</summary>${sel(
            '',
            `mat.${k}.sheet`,
            SHEETS.map(s => [s, s.replace('x', ' × ') + ' mm'])
          )}</details>`
        )}${stockBuy(k)}</div>`
    ).join('')}
    ${custHTML()}</div></details>`;
  h += `<details class="acc" data-k="secs" ${op('secs')}><summary>Columns</summary><div class="accb">${secEditor()}</div></details>`;
  const parts = {};
  h.split('<details class="acc"')
    .slice(1)
    .forEach(c => {
      const m = c.match(/data-k="(\w+)"/);
      if (m) parts[m[1]] = '<details class="acc"' + c;
    });
  el.dataset.flow = pane[0] === 'layout' ? flowNow() : 'home';
  if (isSheet()) setTimeout(renderBar, 0);
  el.innerHTML =
    `<div class="shead"><div class="shandle" data-sgrab="1" aria-hidden="true"><i></i></div><div class="spane" role="tablist">${PANES.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === pane[0]}" class="${k === pane[0] ? 'on' : ''}" data-act="pane" data-a="${k}">${PANE_ICON[k]}<span>${l}</span></button>`).join('')}</div><div class="crumb">${pane[0] === 'layout' ? crumbHTML() : ''}</div></div><p class="panelede">${pane[2]} <button type="button" class="linkb" data-act="gloss">What do the words mean?</button></p>` +
    lockBanner() +
    pane[3].map(k => parts[k] || '').join('');
  el.classList.toggle('locked', isLocked());
  try {
    simplifySide(el);
  } catch (e) {
    oops('side-panel #4', e);
  }
}
const presetOpts = () =>
  Object.entries(PRESETS)
    .map(([k, p]) => `<option value="${k}">${p.label}</option>`)
    .join('');
/* doors that are almost the same width: nudge the column widths so they become exactly the same.
   far = true: group every door column in the same stretch of wall, however different (the "further apart" option) */
function doorGroups(G, far) {
  G = G || geo;
  const reps = [];
  let run = 0;
  G.secs.forEach(q => {
    if (q.pin != null && q.i > 0) run++;
    if (q.panel || q.door || q.follow != null || q.grp) return;
    const byZ = {};
    G.fronts.forEach(f => {
      if (f.sec !== q.i || f.kind !== 'door' || f.leaf || f.rear || f.face === 'curtain') return;
      (byZ[f.zone] = byZ[f.zone] || []).push(f);
    });
    const zs = Object.values(byZ).sort((a, b) => b.length - a.length);
    if (!zs.length) return;
    const ds = zs[0],
      w = ds.map(f => {
        const xs = f.poly.map(p => p[0]);
        return Math.max(...xs) - Math.min(...xs);
      });
    reps.push({ i: q.i, run, n: ds.length, d: w.reduce((a, b) => a + b, 0) / w.length, w: q.w });
  });
  const groups = [];
  const byRun = {};
  reps.forEach(r => (byRun[r.run] = byRun[r.run] || []).push(r));
  Object.values(byRun).forEach(rs => {
    rs.sort((a, b) => a.d - b.d);
    let g = [];
    rs.forEach(r => {
      if (g.length && !far && r.d - g[0].d > Math.max(12, g[0].d * 0.05)) {
        if (g.length > 1) groups.push(g);
        g = [];
      }
      g.push(r);
    });
    if (g.length > 1) groups.push(g);
  });
  return groups.filter(g => Math.max(...g.map(r => r.d)) - Math.min(...g.map(r => r.d)) > 0.4);
}
function evenDoors(far) {
  const g0 = doorGroups(geo, far),
    notes0 = new Set(geo.warns || []);
  if (!g0.length) {
    toast('The door widths are already even');
    return;
  }
  const mem = g0.map(g => g.map(r => r.i)),
    autos = S.sections.map((sc, i) => (!(+sc.w > 0) ? i : -1)).filter(i => i >= 0),
    inG = new Set(mem.flat());
  let maxMove = 0;
  const w0 = geo.secs.map(q => q.w);
  for (let it = 0; it < 5; it++) {
    const G = geo;
    const reps = {};
    doorGroups(G);
    G.secs.forEach(q => {
      const fr = G.fronts.filter(f => f.sec === q.i && f.kind === 'door' && !f.leaf && !f.rear && f.face !== 'curtain'),
        byZ = {};
      fr.forEach(f => (byZ[f.zone] = byZ[f.zone] || []).push(f));
      const zs = Object.values(byZ).sort((a, b) => b.length - a.length);
      if (!zs.length) return;
      const w = zs[0].map(f => {
        const xs = f.poly.map(p => p[0]);
        return Math.max(...xs) - Math.min(...xs);
      });
      reps[q.i] = { n: zs[0].length, d: w.reduce((a, b) => a + b, 0) / w.length };
    });
    let worst = 0;
    mem.forEach(ix => {
      const rs = ix.map(i => reps[i]).filter(Boolean);
      if (rs.length < 2) return;
      const T = rs.reduce((a, r) => a + r.n * r.d, 0) / rs.reduce((a, r) => a + r.n, 0);
      ix.forEach(i => {
        const r = reps[i];
        if (!r) return;
        worst = Math.max(worst, Math.abs(r.d - T));
        S.sections[i].w = Math.round((geo.secs[i].w + r.n * (T - r.d)) * 10) / 10;
      });
    });
    autos.forEach(i => {
      if (!inG.has(i) && autos.some(j => inG.has(j))) S.sections[i].w = null;
    });
    S.sections.forEach((sc, i) => {
      if (!inG.has(i) && !autos.includes(i) && !(+sc.w > 0)) sc.w = null;
    });
    geo = build(S);
    if (worst < 0.15) break;
  }
  geo.secs.forEach((q, i) => {
    maxMove = Math.max(maxMove, Math.abs(q.w - (w0[i] || q.w)));
  });
  changed(true);
  const left = doorGroups(geo, far),
    newNotes = [...new Set(geo.warns || [])].filter(w => !notes0.has(w)).length;
  if (far) {
    toast(
      `${left.length ? 'Most doors are even now; some could not be matched exactly.' : 'All these doors are the same width now.'} Columns moved by up to ${Math.max(1, Math.round(maxMove))} mm.${newNotes ? ` ⚠ ${newNotes} new design note${newNotes > 1 ? 's — check them' : ' — check it'}; Undo puts it back.` : ' Check that drawers, rails and fittings still suit the new widths; Undo puts it back.'}`,
      9000
    );
    return;
  }
  toast(
    left.length
      ? 'Most doors are even now; some could not be matched exactly'
      : `Done: ${mem
          .map(ix =>
            ix
              .slice()
              .sort((x, y) => x - y)
              .map(i => 'S' + (i + 1))
              .join(', ')
          )
          .join(
            ' and '
          )} now have doors of the same width. Columns moved by up to ${Math.max(1, Math.round(maxMove))} mm.`
  );
}
function evenDoorsUI() {
  let g = [];
  try {
    g = doorGroups(geo);
  } catch (e) {
    oops('side-panel #5', e);
  }
  if (!g.length) return '';
  const f1 = v => Math.round(v);
  return `<div class="gwarn" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12.5px;padding:8px 10px;border-radius:10px;background:var(--surface2,rgba(52,70,214,.06));border-color:transparent"><span style="flex:1 1 220px">${g
    .map(
      x =>
        `Doors in ${x
          .slice()
          .sort((a, b) => a.i - b.i)
          .map(r => 'S' + (r.i + 1))
          .join(', ')} are almost the same: ${x
          .slice()
          .sort((a, b) => a.i - b.i)
          .map(r => f1(r.d))
          .join(', ')} mm.`
    )
    .join(' ')}</span><button type="button" class="btn sm" data-act="evenDoors">Make them the same</button></div>`;
}
/* doors further apart: same idea, with a warning how far the columns move */
function evenDoorsFarUI() {
  if (ui.evenFarOff) return '';
  let g = [];
  try {
    const near = new Set(doorGroups(geo).flat().map(r => r.i));
    g = doorGroups(geo, true).filter(x => x.some(r => !near.has(r.i)));
  } catch (e) {
    oops('side-panel: doors further apart', e);
  }
  if (!g.length) return '';
  const f1 = v => Math.round(v);
  const move = Math.max(
    ...g.map(x => {
      const T = x.reduce((a, r) => a + r.n * r.d, 0) / x.reduce((a, r) => a + r.n, 0);
      return Math.max(...x.map(r => Math.abs(r.n * (T - r.d))));
    })
  );
  const txt = g
    .map(x => {
      const xs = x.slice().sort((a, b) => a.i - b.i),
        T = x.reduce((a, r) => a + r.n * r.d, 0) / x.reduce((a, r) => a + r.n, 0);
      return `${xs.map(r => `S${r.i + 1} ${r.n}× ${f1(r.d)}`).join(', ')} mm → all ${f1(T)} mm`;
    })
    .join('; ');
  return `<div class="gwarn evfar"><span><b>Doors of different widths</b> ${txt}.<br><small>⚠ This moves columns by up to ${f1(move)} mm, so inside fittings (drawers, rails, shelves) change size too. Undo puts it back.</small></span><div class="evfarb"><button type="button" class="btn sm" data-act="evenDoorsFar">Make them the same anyway</button><button type="button" class="btn sm" data-act="evenFarOff" aria-label="Hide this">Hide</button></div></div>`;
}
function secEditorFull() {
  const secs = S.sections;
  let h = isSheet() ? '' : shufBar();
  if (!secs.length)
    return (
      h +
      `<div class="addrow"><span class="inp"><select id="addPreset">${presetOpts()}</select></span><button class="btn" data-act="addSec">Add</button></div>`
    );
  ui.sel = Math.max(0, Math.min(ui.sel, secs.length - 1));
  const i = ui.sel,
    s = secs[i],
    q = geo.secs[i],
    p = 'sections.' + i;
  h += `<div class="chips dskchips">${secs.map((x, j) => `<button class="chip ${j === i ? 'on' : ''}" data-act="selSec" data-a="${j}">S${j + 1}${x.base === 'panel' ? ' ▦' : ''}<small>${geo.secs[j] ? f0(geo.secs[j].w) : ''}</small></button>`).join('')}</div>
  ${evenDoorsUI()}${evenDoorsFarUI()}<details class="quickadd pf"${ui.qaOpen ? ' open' : ''} data-qa="1"><summary>+ Add a column next to S${i + 1}</summary><div class="qag">${[
    [
      'Storage',
      [
        ['cupboard', 'Cupboard'],
        ['wardrobe', 'Wardrobe'],
        ['drawers', 'Drawers + cupboard'],
        ['open', 'Open shelves'],
        ['low', 'Low cupboard'],
        ['utility', 'Utility cupboard']
      ]
    ],
    [
      'Rooms & living',
      [
        ['laundry', 'Washer + dryer'],
        ['bed', 'Fold-down bed'],
        ['desk', 'Desk'],
        ['tv', 'TV niche'],
        ['speaker', 'Speaker column'],
        ['seat', 'Window seat']
      ]
    ],
    [
      'Food & appliances',
      [
        ['pantry', 'Pantry pull-out'],
        ['fridge', 'Fridge housing'],
        ['oven', 'Oven housing']
      ]
    ],
    [
      'Special',
      [
        ['arch', 'Arched bookcase'],
        ['door', 'Walk-through door'],
        ['dog', 'Dog den'],
        ['panel', 'Panel wall']
      ]
    ]
  ]
    .map(
      ([g, ks]) =>
        `<div class="fitg"><small>${g}</small><div class="tchips">${ks.map(([k, l]) => `<button type="button" class="tchip" data-act="addQuick" data-a="${k}">+ ${l}</button>`).join('')}</div></div>`
    )
    .join('')}</div></details>`;
  const follower = q && q.follow != null;
  h += `<div class="card sel" data-comment-target><div class="cardh"><h4>Column ${i + 1} <span class="zinfo">${q ? f0(q.w) + ' mm inside' : ''}</span></h4><div class="tools">
    <button class="rowbtn" data-act="moveSec" data-a="-1" aria-label="Move left" title="Move left">◀</button><button class="rowbtn" data-act="moveSec" data-a="1" aria-label="Move right" title="Move right">▶</button><button class="rowbtn" data-act="dupSec" aria-label="Duplicate" title="Duplicate">⧉</button><button class="rowbtn" data-act="delSec" aria-label="Delete" title="Delete">✕</button><button class="rowbtn cmtb" data-act="cmtCol" ${CMT ? '' : 'hidden'} aria-label="Comment on this column" title="Comment on this column"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button></div></div>
    ${mx(
      'Width, depth &amp; height',
      `<div class="grid2">${fld('Inside width', p + '.w', { ph: 'auto · ' + (q ? f0(q.w) : ''), auto: true })}${fld('Depth', p + '.depth', { ph: 'wall · ' + S.room.D, auto: true })}</div>
    ${
      s.base === 'cab' || s.base === 'desk' || !s.base
        ? `<div class="fld"><span>Height</span>${seg(
            p + '.ownMode',
            [
              ['', 'To the ceiling'],
              ['own', 'Own height']
            ],
            { dflt: '' }
          )}</div>${s.ownMode === 'own' ? `<div class="grid2">${fld('Cabinet height', p + '.ownH', { ph: '2000' })}<div></div></div><p class="hintp" style="margin:0">This column stops at its own height with a finished top — no top closing strip above it. Handy under a low slope, next to a window, or for a sideboard between tall cabinets.</p>` : ''}`
        : ''
    }
    ${
      +s.depth > 0 && +s.depth < +S.room.D
        ? `<div class="fld"><span>Shallower than the wall depth — place it</span>${seg(
            p + '.align',
            [
              ['wall', 'Back to wall (front steps back)'],
              ['front', 'Front flush (gap behind)']
            ],
            { dflt: 'wall' }
          )}</div>`
        : ''
    }${
      !isSheet() || s.base === 'panel'
        ? ''
        : `<div class="fld"><span>Back panel</span>${seg(p + '.back', [
            ['full', 'One piece'],
            ['split', 'One per level'],
            ['none', 'No back']
          ])}</div>`
    }`
    )}
    ${mx('Copy or link this column', linkUI(i, s))}
    <div class="fld o-type"><span>Type</span>${seg(p + '.base', [
      ['cab', 'Cabinet'],
      ['free', 'Freestanding'],
      ['desk', 'Desk'],
      ['door', 'Door / hallway'],
      ['panel', 'Panel wall']
    ])}</div>
    ${s.base === 'desk' && q && q.w < 990 ? `<div class="gwarn" style="display:flex;gap:8px;align-items:center;font-size:12px;padding:8px 10px;border-radius:10px"><span>A desk needs at least 1000 mm — this one is ${f0(q.w)} mm.</span><button type="button" class="btn sm" data-act="deskSpan">Span two columns</button></div>` : ''}
    ${
      s.base === 'desk'
        ? mx(
            'Desk options',
            `<div class="grid2">${fld('Desk height', p + '.deskH')}${(s.deskFront || 'open') === 'open' ? fld('Desk overhang', p + '.over') : '<div></div>'}</div>
      ${fixRow(i)}${s.pinX != null && s.pinX !== '' ? `<div class="grid2">${fld('Left edge from wall', p + '.pinX', { auto: true })}<div></div></div>` : ''}
      <div class="fld"><span>Desk front</span>${seg(
        p + '.deskFront',
        [
          ['open', 'Open'],
          ['doors', 'Behind doors'],
          ['hidden', 'Hidden']
        ],
        { dflt: 'open' }
      )}</div>
      ${
        (s.deskFront || 'open') !== 'open'
          ? `<div class="grid2">${stepper('Doors', p + '.deskDoors', 0, 4, true)}${
              +s.deskDoors === 1 || (!+s.deskDoors && q && q.bR - q.bL <= 620)
                ? `<div class="fld"><span>Hinge side</span>${seg(
                    p + '.deskHinge',
                    [
                      ['L', 'Left'],
                      ['R', 'Right']
                    ],
                    { dflt: 'L' }
                  )}</div>`
                : ''
            }</div><p class="hintp" style="margin:0">${s.deskFront === 'hidden' ? 'Handleless push-to-open doors in the front finish — the desk disappears into the wall of fronts.' : 'Doors close over the desk; 155° wide-angle hinges let them fold back flat while you work.'} They run from the plinth line up to the cabinet above the desk. Everything inside — desk top, drawers, pedestal — sits ${geo.tf + 25} mm back so the doors close in front of it, and the gap under the doors stays open for the chair.</p>`
          : ''
      }
      ${stepper('Desk runs under the next columns →', p + '.zones.0.span', 0, 2)}${+(s.zones[0] || {}).span > 0 ? '<p class="hintp" style="margin:0">One long desk top; the cabinets above stay separate boxes, one per column. The next columns must be desks too — their own contents are ignored.</p>' : ''}
      ${
        s.zones.length > 1
          ? `<div class="fld"><span>Cabinet above the desk</span>${seg(
              p + '.upD',
              [
                ['', 'Full depth'],
                ['400', '400 deep'],
                ['350', '350 deep'],
                ['300', '300 deep']
              ],
              { dflt: '' }
            )}</div>${+s.upD > 0 ? `<div class="grid2">${fld('Depth above the desk', p + '.upD', { ph: '350' })}<div></div></div>` : ''}<p class="hintp" style="margin:0">${+s.upD > 0 ? `The cabinet above sits back — its doors fit inside the sides, ${q ? f0(q.Dh - (q.upD || +s.upD)) : ''} mm behind the front — so you get more head and screen room. The sides stay full depth and carry it.` : 'A shallower cabinet above the desk gives more head and screen room.'}</p>`
          : ''
      }
      ${chk('Drawer under the desk top', p + '.deskDrawer')}
      <div class="fld"><span>Drawer unit under the desk</span>${seg(
        p + '.deskPed',
        [
          ['none', 'None'],
          ['L', 'Left'],
          ['R', 'Right']
        ],
        { dflt: 'none' }
      )}</div>
      ${s.deskPed === 'L' || s.deskPed === 'R' ? `<div class="grid2">${stepper('Pedestal drawers', p + '.pedN', 2, 4)}<div></div></div>` : ''}
      <div class="fld"><span>Wall behind the desk</span>${seg(
        p + '.deskBack',
        [
          ['plain', 'Plain'],
          ['colour', 'Colour'],
          ['peg', 'Pegboard'],
          ['cork', 'Cork'],
          ['mirror', 'Mirror']
        ],
        { dflt: 'plain' }
      )}</div>
      ${s.deskBack === 'colour' || s.deskBack === 'peg' ? finSelect(s.deskBack === 'peg' ? 'Pegboard colour' : 'Back colour', p + '.deskBackFin', s.deskBack === 'peg' ? 'White' : 'Sage') : ''}
      <div class="fld"><span>Desk setup</span><div class="tchips">${[
        ['work', 'Work'],
        ['studio', 'Studio'],
        ['vanity', 'Vanity'],
        ['craft', 'Craft'],
        ['none', 'Empty']
      ]
        .map(
          ([k_, l]) =>
            `<button type="button" class="tchip ${(s.deskSetup || 'work') === k_ ? 'on' : ''}" data-act="setv" data-a="${p}.deskSetup|${k_}|s">${l}</button>`
        )
        .join('')}</div></div>
      <div style="display:grid;gap:6px">${chk('LED strip over the desk', p + '.deskLED')}${chk('Cable holes in the desk top', p + '.deskGrommet')}${(s.deskFront || 'open') === 'open' ? `<label class="chk"><input type="checkbox" id="${idOf(p + '.deskChair')}" data-p="${p}.deskChair" data-re="1" ${s.deskChair !== false ? 'checked' : ''}> Show a chair</label>` : ''}</div>`
          )
        : ''
    }
    ${q && !q.door && !q.panel ? (q.splitK >= 0 && q.zones[q.splitK] ? `<p class="hintp" style="margin:0">🧱 Built as two stacked units — the lower unit is ${f0(q.zones[q.splitK].divY + geo.tc * 2 - (q.desk ? 0 : q.Pq || 0))} mm tall, the upper one stands on it (boards up to ${f0(geo.maxUnit)} mm).</p>` : (q.grp ? Math.max(...q.grp.members.map(m => m.maxU)) : q.maxU) + geo.tc - (q.desk ? 0 : q.Pq) > geo.maxUnit ? `<div class="gwarn" style="display:flex;gap:8px;align-items:center;font-size:12px;padding:8px 10px;border-radius:10px"><span>${f0((q.grp ? Math.max(...q.grp.members.map(m => m.maxU)) : q.maxU) + geo.tc - (q.desk ? 0 : q.Pq))} mm tall — longer than your ${f0(geo.maxUnit)} mm boards.</span><button type="button" class="btn sm" data-act="splitUnit">Split into two units</button></div>` : '') : ''}
    ${
      s.base === 'free'
        ? mx(
            'Freestanding options',
            `<div class="grid2">${fld('Unit height', 'sections.' + i + '.freeH', { ph: '900' })}<div></div></div>
      <div class="fld"><span>Stands on</span>${seg(
        p + '.mount',
        [
          ['legs', 'Legs'],
          ['plinth', 'Plinth'],
          ['wall', 'Wall-hung']
        ],
        { dflt: 'legs' }
      )}</div>
      ${
        (s.mount || 'legs') === 'legs'
          ? `<div class="grid2">${fld('Leg height', p + '.legH', { ph: '160' })}<div></div></div><div class="fld"><span>Legs</span><div class="tchips">${[
              ['oak', 'Oak'],
              ['walnut', 'Walnut'],
              ['black', 'Black'],
              ['ral1036', 'Brass'],
              ['ral9016', 'White']
            ]
              .map(
                ([k_, l]) =>
                  `<button type="button" class="tchip ${(s.legFin || 'oak') === k_ ? 'on' : ''}" data-act="setv" data-a="${p}.legFin|${k_}|s"><i class="dot" style="width:14px;height:14px;background:${FIN[k_].base}"></i>${l}</button>`
              )
              .join('')}</div></div>`
          : ''
      }
      ${s.mount === 'wall' ? `<div class="grid2">${fld('Height off the floor', p + '.floatY', { ph: '350' })}<div></div></div>` : ''}
      <p class="hintp" style="margin:0">A separate piece of furniture: flat top, the wall shows above it, no top closing strip. Sideboards are ≈ 750–900 mm, tall cabinets 1800–2000 mm.</p>`
          )
        : ''
    }
    ${s.base === 'door' ? doorEditor(i) : ''}
    ${
      s.base === 'panel' || isSheet()
        ? ''
        : `<div class="fld"><span>Back panel</span>${seg(p + '.back', [
            ['full', 'One piece'],
            ['split', 'One per level'],
            ['none', 'No back']
          ])}</div>`
    }`;
  if (s.base === 'panel') return h + panelEditor(i) + '</div>';
  const zMin = s.base === 'door' ? 1 : 0;
  if (follower) {
    const L = q.follow;
    h += `<div class="banner"><span>Part of the niche from S${L + 1}. Its levels follow S${L + 1}.</span><button class="btn sm" data-act="selSec" data-a="${L}">Edit S${L + 1}</button></div></div>`;
    return h;
  }
  h +=
    mx(
      'Ready-made layouts &amp; shuffle',
      `<div class="addrow"><span class="inp"><select id="secPreset" aria-label="Layout preset">${presetOpts()}</select></span><button class="btn sm" data-act="applyPreset">Use this layout</button><button class="btn sm" data-act="rand" data-a="sec" title="Random levels for this column">Shuffle</button></div>`
    ) +
    `
    <div class="fld o-zl"><span>Levels of this column, top to bottom — tap one to edit</span></div><div class="zlist o-zl2">`;
  for (let k = s.zones.length - 1; k >= zMin; k--) h += zoneRow(i, k);
  h +=
    `</div>` +
    mx(
      '+ Add a level on top',
      `<div class="fld"><span>Add a level on top</span><div class="tchips">${ZTYPES.map(([k, l]) => `<button type="button" class="tchip" data-act="addZoneT" data-a="${k}">${ZICON[k]}${l}</button>`).join('')}</div></div>`
    ) +
    `</div>`;
  return h;
}

function mx(t, h, key) {
  if (!h) return '';
  key = key || t;
  return isSheet()
    ? `<details class="mx"${openMx.has(key) ? ' open' : ''} data-mx="${esc(key)}"><summary>${t}</summary><div class="mxb">${h}</div></details>`
    : h;
}
const openMx = new Set();
const isSheet = () => innerWidth <= 860 && (ui.tab === 'elev' || ui.tab === '3d');
const SECT_LBL = { cab: 'Cabinet', free: 'Freestanding', desk: 'Desk', door: 'Door', panel: 'Panel wall' };
function flowNow() {
  const secs = S.sections;
  if (!isSheet() || !secs.length) return 'home';
  let f = ui.flow || 'home';
  const s = secs[ui.sel];
  if (
    f === 'zone' &&
    (!s ||
      s.base === 'panel' ||
      ui.zsel == null ||
      !s.zones[ui.zsel] ||
      (geo.secs[ui.sel] && geo.secs[ui.sel].follow != null))
  )
    f = s ? 'col' : 'home';
  if (f === 'col' && !s) f = 'home';
  return f;
}
function crumbHTML() {
  const f = flowNow();
  if (f === 'home') return '';
  const i = ui.sel,
    s = S.sections[i],
    n = S.sections.length;
  let h = `<button type="button" data-act="flow" data-a="home">‹ All</button>`;
  if (f === 'col')
    h += `<b>Column ${i + 1} · ${SECT_LBL[s.base] || 'Cabinet'}</b><span class="cnav"><button type="button" data-act="flowSec" data-a="-1" aria-label="Previous column" ${i <= 0 ? 'disabled' : ''}>◀</button><button type="button" data-act="flowSec" data-a="1" aria-label="Next column" ${i >= n - 1 ? 'disabled' : ''}>▶</button></span>`;
  else {
    const z = s.zones[ui.zsel],
      nm = (ZTYPES.find(t => t[0] === z.type) || [])[1] || '';
    const zMin = s.base === 'door' ? 1 : 0;
    h += `<span>›</span><button type="button" data-act="flow" data-a="col">Column ${i + 1}</button><span>›</span><b>${nm}</b><span class="cnav"><button type="button" data-act="flowZone" data-a="1" aria-label="Level above" ${ui.zsel >= s.zones.length - 1 ? 'disabled' : ''}>▲</button><button type="button" data-act="flowZone" data-a="-1" aria-label="Level below" ${ui.zsel <= zMin ? 'disabled' : ''}>▼</button></span>`;
  }
  return h;
}
function secEditor() {
  if (!isSheet() || !S.sections.length) return secEditorFull();
  ui.sel = Math.max(0, Math.min(ui.sel, S.sections.length - 1));
  const f = flowNow();
  ui.flow = f;
  if (f === 'zone') {
    const i = ui.sel,
      s = S.sections[i];
    return `<div class="card sel mzone">${zoneRow(i, ui.zsel)}</div><div class="mzn"><button type="button" class="btn" data-act="flow" data-a="col">Done</button><button type="button" class="btn" data-act="flowAddZone">+ Level on top</button></div>`;
  }
  const zs = ui.zsel;
  if (f === 'col') ui.zsel = -1;
  const full = secEditorFull();
  ui.zsel = zs;
  const cut = full.indexOf('<div class="card sel">');
  if (f === 'col') return cut >= 0 ? full.slice(cut) : full;
  const tiles = `<p class="mhint">Tap a column — here or in the drawing — to edit it.</p><div class="mcols">${S.sections
    .map((x, j) => {
      const q = geo.secs[j];
      const zic = (x.zones || [])
        .slice()
        .reverse()
        .slice(0, 6)
        .map(z => ZICON[z.type] || '')
        .join('');
      return `<button type="button" class="mcol ${j === ui.sel ? 'on' : ''}" data-act="selSec" data-a="${j}"><b>${j + 1}<small>${q ? f0(q.w) : ''}</small></b><span>${SECT_LBL[x.base] || 'Cabinet'}${x.pinX != null && x.pinX !== '' ? ' 📌' : ''}</span>${x.base === 'panel' ? '' : `<span class="zic">${zic}</span>`}</button>`;
    })
    .join('')}</div>`;
  const qm = /<details class="quickadd[\s\S]*?<\/details>/.exec(full),
    adds = qm ? qm[0].replace(/\+ Add a column next to S\d+/, '+ Add a column') : '';
  const shuf = `<div class="mshuf"><button type="button" class="pri" data-act="rand" data-a="all"><i>✨</i>Surprise me</button><button type="button" data-act="rand" data-a="keep"><i>⇄</i>Contents</button><button type="button" data-act="rand" data-a="layout"><i>▦</i>Layout</button><button type="button" data-act="rand" data-a="fin"><i>◐</i>Colours</button></div>`;
  const sty = stylePick();
  const more = mx(
    'Shuffle rules: box widths and number of columns',
    `<div class="sbw"><span class="sbl">Box widths when shuffling the layout</span>${seg('opts.wmode', WMODES, { dflt: 'mixed' })}</div><div class="sbr" style="margin:8px 0">${S.opts.wmode === 'fixed' ? sbn('Every box', 'opts.wFix', '600') + '<span class="sbl">TV niche, desk and the like become a double box; leftover is one filler box</span>' : sbn('Narrowest', 'opts.wMin', 'any') + sbn('Widest', 'opts.wMax', 'any')}</div><div class="colsctl"><span>Columns</span><div class="step"><button type="button" data-act="cols" data-a="-1" aria-label="Fewer columns">−</button><b>${+S.opts.cols > 0 ? S.opts.cols : 'Free'}</b><button type="button" data-act="cols" data-a="1" aria-label="More columns">+</button></div></div>`
  );
  // columns first (that is what you came to edit), then the shuffle buttons, then the folded extras
  return (
    `<div class="mlbl">Your columns — tap one to edit</div>` +
    tiles.replace(/<p class="mhint">[^<]*<\/p>/, '') +
    adds +
    `<div class="mlbl">Shuffle</div>` +
    shuf +
    mx('Styles — restyle the whole wall in one tap', sty, 'sty') +
    `<div class="mlock" style="display:flex;gap:8px;flex-wrap:wrap">${lockChip()}${budChipBtn()}</div>` +
    mx(
      'Always include when shuffling' + ((S.opts.must || []).length ? ` · ${(S.opts.must || []).length}` : ''),
      mustUI(),
      'must'
    ) +
    more
  );
}
/* bottom sheet sizing */
const SHEET = { st: 'half' };
function sheetSizes() {
  const hh = document.querySelector('header.top')?.offsetHeight || 52,
    bn = document.getElementById('bnav')?.offsetHeight || 62,
    av = innerHeight - hh - bn;
  return {
    peek: Math.min(Math.round(av * 0.4), 156),
    half: Math.round(av * (ui.flow && ui.flow !== 'home' && ui.pane === 'layout' ? 0.6 : 0.5)),
    full: Math.max(200, av - 40),
    av
  };
}
function setSheet(st, keepStage) {
  if (st) SHEET.st = st;
  const z = sheetSizes(),
    h = z[SHEET.st] || z.half,
    r = document.documentElement.style,
    app = document.querySelector('.app');
  app.style.setProperty('--sheetH', h + 'px');
  r.setProperty('--hdrH', (document.querySelector('header.top')?.offsetHeight || 52) + 'px');
  r.setProperty('--bnavH', (document.getElementById('bnav')?.offsetHeight || 62) + 'px');
  app.dataset.sheet = SHEET.st;
  if (!keepStage) {
    r.setProperty('--stageB', Math.min(h, z.half) + 'px');
    if (T3 && T3.req) T3.req();
  }
}
function openSheetAt(st) {
  if (!isSheet()) return;
  setSheet(SHEET.st === 'peek' || st === 'full' ? st || 'half' : null);
}
(function () {
  const sd = document.getElementById('side');
  let d = null;
  sd.addEventListener('pointerdown', e => {
    if (!isSheet()) return;
    const g = e.target.closest('.shead');
    if (!g) return;
    if (e.target.closest('.crumb')) return;
    d = {
      y: e.clientY,
      h: sd.offsetHeight,
      id: e.pointerId,
      moved: false,
      t: performance.now(),
      grab: !!e.target.closest('[data-sgrab]')
    };
  });
  sd.addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dy) < 7) return;
    if (!d.moved) {
      d.moved = true;
      try {
        sd.setPointerCapture(d.id);
      } catch (_) {
        oops('side-panel #6', _);
      }
      document.querySelector('.app').classList.add('sdrag');
    }
    const z = sheetSizes();
    document.querySelector('.app').style.setProperty('--sheetH', Math.max(90, Math.min(z.av - 20, d.h - dy)) + 'px');
    e.preventDefault();
  });
  const end = e => {
    if (!d) return;
    const app = document.querySelector('.app');
    app.classList.remove('sdrag');
    if (d.moved) {
      const h = sd.offsetHeight,
        v = (e.clientY - d.y) / Math.max(1, performance.now() - d.t),
        z = sheetSizes();
      let best = 'half',
        bd = 1e9;
      for (const k of ['peek', 'half', 'full']) {
        const dd = Math.abs(z[k] - h);
        if (dd < bd) {
          bd = dd;
          best = k;
        }
      }
      if (v > 0.6) best = SHEET.st === 'full' ? 'half' : 'peek';
      else if (v < -0.6) best = SHEET.st === 'peek' ? 'half' : 'full';
      setSheet(best);
      const kill = ev => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      addEventListener('click', kill, { capture: true, once: true });
      setTimeout(() => removeEventListener('click', kill, { capture: true }), 60);
    } else if (d.grab) setSheet(SHEET.st === 'peek' ? 'half' : SHEET.st === 'half' ? 'full' : 'peek');
    d = null;
  };
  sd.addEventListener('pointerup', end);
  sd.addEventListener('pointercancel', end);
  let lw = innerWidth;
  addEventListener('resize', () => {
    const ae = document.activeElement;
    if (innerWidth <= 860 && !(ae && ae.closest && ae.closest('#side') && /INPUT|SELECT|TEXTAREA/.test(ae.tagName)))
      setSheet(null);
    lw = innerWidth;
  });
  try {
    new ResizeObserver(() => {
      if (innerWidth <= 860) setSheet(null);
    }).observe(document.querySelector('header.top'));
  } catch (_) {
    oops('side-panel #7', _);
  }
  setTimeout(() => setSheet(null), 0);
})();
function pinYs(zr, y0, y1, mode) {
  const sy = (zr.shelvesY || []).map(v => v[0] - 7);
  if (mode === 'rows' || !sy.length) {
    const o = [];
    for (let y = y0 + 24; y <= y1 - 24; y += 32) o.push(y);
    return o;
  }
  const set = new Set();
  sy.forEach(y => {
    const k = mode === 'some' ? 2 : 0;
    for (let j = -k; j <= k; j++) {
      const v = Math.round(y + j * 32);
      if (v >= zr.y0 + 20 && v <= y1 + 30) set.add(v);
    }
  });
  return [...set].sort((a, b) => a - b);
}
function fixRow(i) {
  const s = S.sections[i],
    q = geo.secs[i],
    on = s.pinX != null && s.pinX !== '';
  return `<label class="chk fixrow"><input type="checkbox" data-act="fixSec" data-a="${i}" ${on ? 'checked' : ''}> 📌 Fix in place — keep this position and width when shuffling${q && on ? ` (${f0(q.lx)} mm from the wall, ${f0(q.w)} mm wide)` : ''}</label>`;
}
function doorEditor(i) {
  const s = S.sections[i],
    p = `sections.${i}`,
    q = geo.secs[i],
    st = s.doorStyle || 'visible',
    pz = s.zones[0];
  return `<div class="fld"><span>Door style</span>${seg(
    p + '.doorStyle',
    [
      ['visible', 'Door'],
      ['hidden', 'Hidden door'],
      ['hallway', 'Hallway'],
      ['open', 'Open doorway']
    ],
    { dflt: 'visible' }
  )}</div>
  <p class="hintp" style="margin:0">${st === 'hidden' ? 'A flush, handleless door in the front finish with concealed hinges — it reads as part of the cabinet wall.' : st === 'hallway' ? 'The door sits back at the wall; the cabinet depth becomes a short lined hallway in the front finish.' : st === 'open' ? 'A lined walk-through with no door leaf.' : 'A normal door with a lever handle, flush with the cabinet fronts.'}</p>
  <div class="fld"><span>Doorway width — in columns</span><div class="seg">${[1, 2, 3].map(n => `<button type="button" class="${(+s.span || 1) === n ? 'on' : ''}" data-act="spanSec" data-a="${n}">${n} column${n > 1 ? 's' : ''}</button>`).join('')}</div></div>
  ${
    st !== 'open'
      ? `<div class="fld"><span>Leaves</span>${seg(
          p + '.doorLeaves',
          [
            [1, 'Single door'],
            [2, 'Double doors']
          ],
          { num: true, dflt: q && q.w > 1250 ? 2 : 1 }
        )}</div>`
      : ''
  }
  ${fixRow(i)}
  <div class="grid2">${fld('Left edge from wall', p + '.pinX', { ph: 'free · ' + (q ? f0(q.lx) : ''), auto: true })}${fld('Door height', p + '.zones.0.h', { ph: '2015' })}
  ${
    st !== 'open'
      ? `<div class="fld"><span>Hinge side</span>${seg(
          p + '.doorHinge',
          [
            ['L', 'Left'],
            ['R', 'Right']
          ],
          { dflt: 'L' }
        )}</div>`
      : ''
  }</div>
  <p class="hintp" style="margin:0">${s.pinX != null && s.pinX !== '' ? '📌 Pinned — the cabinets around it resize, and the randomizers never move it.' : 'Type the distance from the left wall to the door opening to pin it in place.'} Storage above the door is set in the levels below.</p>`;
}
function panelEditor(i) {
  const p = `sections.${i}.panel`,
    pn = Object.assign({}, PANEL_DEF, S.sections[i].panel || {}),
    q = geo.secs[i],
    sp = `sections.${i}`;
  let h = `<p class="hintp">A flat panel wall that hides a technical shaft, flush with the doors, with a removable hatch so the shaft stays reachable.</p>
    <div class="grid2">${fld('Left edge from wall', sp + '.pinX', { ph: 'free · ' + (q ? f0(q.lx) : ''), auto: true })}<div class="fld"><span>Right edge</span><div class="zinfo" style="padding:9px 0">${q ? f0(q.rx + (S.opts.construct === 'boxes' ? geo.tc : 0)) + ' mm from left wall' : ''}</div></div></div>
    <p class="hintp" style="margin-top:-2px">${S.sections[i].pinX != null && S.sections[i].pinX !== '' ? '📌 Pinned. The cabinets on each side resize to fit around it.' : 'Type the distance from the left wall to where the shaft starts to pin it in place.'}</p>
    <div class="fld"><span>Fun side</span><div class="tchips">${FUN.map(([k, l]) => `<button type="button" class="tchip ${pn.fun === k ? 'on' : ''}" data-act="setv" data-a="${p}.fun|${k}|s">${l}</button>`).join('')}</div></div>
    <div class="grid2">${sel(
      'Board type',
      p + '.mat',
      Object.entries(MATS)
        .filter(([m]) => m !== 'hdf')
        .map(([m, v]) => [m, v.name]),
      { re: true }
    )}${fld('Board thickness', p + '.t', { ph: '18' })}<div style="grid-column:1/-1">${finSelect('Cladding finish', p + '.fin', 'Birch plywood')}</div></div>
    <div style="display:grid;gap:6px">${pn.fun === 'faux' ? '' : `<label class="chk"><input type="checkbox" data-act="setv" data-a="${p}.toe|${(pn.toe == null ? true : !!pn.toe) ? 0 : 1}|n" ${(pn.toe == null ? true : !!pn.toe) ? 'checked' : ''}> Toe kick at the bottom, like the cabinets (the panel stops above a set-back plinth)</label>`}${chk(pn.fun === 'faux' ? 'One faux door comes off for access to the shaft' : 'Access hatch for the shaft', p + '.hatch')}${pn.fun === 'faux' ? '' : chk('Height chart strip', p + '.chart')}</div>${pn.fun === 'faux' ? '<p class="hintp" style="margin:0">Faux doors copy the cabinet next to the panel wall: same lines, front colour, gaps and handles. They are fixed panels, so the wall looks like one run of cabinets. Board and finish follow your fronts.</p>' : ''}`;
  if (pn.hatch && pn.fun !== 'faux')
    h += `<div class="grid2">${fld('Hatch bottom', p + '.hatchY')}${fld('Hatch height', p + '.hatchH')}</div>`;
  if (pn.fun === 'peg') {
    const st_ = (l, k_, mx_) =>
        `<div class="fld"><span>${l}</span><div class="step"><button type="button" data-act="pegN" data-a="${i}|${k_}|-1|${mx_}" aria-label="Fewer">−</button><b>${Math.max(0, Math.min(mx_, +pn[k_] || 0))}</b><button type="button" data-act="pegN" data-a="${i}|${k_}|1|${mx_}" aria-label="More">+</button></div></div>`,
      pc = q && q.pegN;
    h += `<div class="fld"><span>Holes</span>${seg(
      p + '.pegHole',
      [
        ['', 'Round, for pegs'],
        ['slot', 'Slots, for hook tabs']
      ],
      { dflt: '' }
    )}</div><div class="grid2">${st_('Shelves', 'pegS', 8)}${st_('Book ledges', 'pegL', 4)}${st_('Boxes', 'pegB', 4)}${st_('Drawer boxes', 'pegD', 2)}${st_('Paper roll', 'pegR', 1)}${st_('Rail with hooks', 'pegK', 2)}${st_('Hooks for bags and baskets', 'pegH', 10)}</div><div class="pbrow"><button class="btn sm" data-act="setv" data-a="${p}.seed|${Math.floor(Math.random() * 9999)}|n">Rearrange</button></div><p class="hintp">${pn.pegHole === 'slot' ? 'A board full of 12 × 40 mm slots on a 120 mm grid. Every shelf, ledge and box has two hardwood tabs on its back that drop into the slots' : 'A board full of Ø20 holes on a 120 mm grid. Wooden pegs push into the holes; shelves, boxes and bags hang on them'} and can move any time. Use 18 mm birch plywood. ${
      pc
        ? `Now on the wall: ${
            [
              [pc.shelves, 'shelf', 'shelves'],
              [pc.ledges, 'book ledge', 'book ledges'],
              [pc.boxes, 'box', 'boxes'],
              [pc.drawers, 'drawer box', 'drawer boxes'],
              [pc.rolls, 'paper roll', 'paper rolls'],
              [pc.rails, 'rail', 'rails'],
              [pc.hooks, 'hook', 'hooks']
            ]
              .filter(a => a[0])
              .map(a => a[0] + ' ' + (a[0] === 1 ? a[1] : a[2]))
              .join(', ') || 'nothing yet'
          }.${pc.shelves < (+pn.pegS || 0) || pc.boxes < (+pn.pegB || 0) || pc.drawers < (+pn.pegD || 0) || pc.hooks < (+pn.pegH || 0) || (pc.ledges || 0) < (+pn.pegL || 0) || (pc.rolls || 0) < (+pn.pegR || 0) || (pc.rails || 0) < (+pn.pegK || 0) ? ' Not everything fitted: make the panel wider or ask for less.' : ''}`
        : ''
    } The baskets, bags and toys in the drawing are decoration.</p>`;
  }
  if (pn.fun === 'climb')
    h += `<div class="grid2">${fld('Holds up to', p + '.climbH')}<div class="fld"><span>&nbsp;</span><button class="btn sm" data-act="setv" data-a="${p}.seed|${Math.floor(Math.random() * 9999)}|n">Rearrange holds</button></div></div><p class="hintp">Climbing walls need 18 mm+ birch ply on battens at max 400 mm centres, fixed into solid structure, plus a crash mat. ${q && q.holdsN != null ? `${q.holdsN} holds placed.` : ''}</p>`;
  return h;
}
function zoneSummary(z, zr) {
  const b = [];
  if (z.type === 'closed' && z.rail && zr && zr.railY) {
    b.push('rail ' + f0(zr.railY));
  }
  if (zr) b.push(zr.top ? `${f0(zr.hMin)}${zr.hMax - zr.hMin > 2 ? '–' + f0(zr.hMax) : ''}` : f0(zr.h));
  if (z.type === 'closed') {
    b.push((+z.doors || 'auto') + ' dr');
    if (+z.shelves) b.push(z.shelves + ' sh');
  }
  if (z.type === 'open' && +z.shelves) b.push(z.shelves + ' sh');
  if (z.type === 'drawers') b.push(z.count + '×');
  if (z.type === 'opening') {
    if (+z.tv) b.push(z.tv + '″');
    if (+z.span) b.push('+' + z.span + ' sec');
  }
  return b.join(' · ');
}
function loadUI(p, z, zr) {
  if (!(+z.shelves > 0 || (z.vsh || []).some(v => +v > 0))) return '';
  const sg = zr && zr.sag;
  const st = !sg
    ? ''
    : sg.r > 1
      ? `<span class="sagb bad">sags ≈ ${sg.d.toFixed(1)} mm — keep spans under ${f0(sg.Lmax)}</span>`
      : sg.r > 0.7
        ? `<span class="sagb mid">ok · ${sg.d.toFixed(1)} mm sag</span>`
        : `<span class="sagb ok">stiff enough</span>`;
  return `<div class="fld" style="grid-column:1/-1"><span>On these shelves ${st}</span>${seg(
    p + '.load',
    [
      ['light', 'Light things'],
      ['normal', 'Clothes & boxes'],
      ['books', 'Books & records']
    ],
    { dflt: 'normal' }
  )}</div>`;
}
function mustUI() {
  const ms = Array.isArray(S.opts.must) ? S.opts.must : [];
  return `<div class="mustbox"><div class="mbh"><b>Always include${ms.length ? ' · ' + ms.length : ''}</b><span>Things every shuffle must contain — and where, and how big.</span></div>
  ${ms
    .map((m, i) => {
      const D = MUSTS[m.type] || MUSTS.desk,
        p = 'opts.must.' + i;
      return `<div class="mustrow"><div class="mrh">${ZICON[{ desk: 'open', tv: 'opening', speakers: 'speaker', seat: 'seat', wardrobe: 'closed', drawers: 'drawers', open: 'open', dog: 'closed', screen: 'opening', ladder: 'open', laundry: 'opening', bed: 'opening', utility: 'closed', pantry: 'closed', fridge: 'closed', oven: 'opening' }[m.type]] || ''}<b>${D.n}</b><button type="button" class="rowbtn" data-act="mustDel" data-a="${i}" aria-label="Remove ${D.n}">×</button></div>
    ${
      m.type === 'ladder'
        ? `<div class="grid2">${fld('Rail at least', p + '.wMin', { ph: '1200', auto: true })}${fld('at most', p + '.wMax', { ph: 'as long as it is useful', auto: true })}</div><p class="hintp" style="margin:0">The rail runs only over tall storage columns — never over a desk, a doorway or the screen drawer — and those columns get shelves up high worth climbing for. If the cabinets are too low for a ladder to make sense, the shuffle leaves it out and tells you.</p>`
        : D.wall
          ? `<div class="grid2">${fld('Screen width at least', p + '.wMin', { ph: 'any', auto: true })}${fld('at most', p + '.wMax', { ph: 'widest that fits', auto: true })}</div><p class="hintp" style="margin:0">Hidden in one very wide drawer across the top of the cabinets. It stays on through every shuffle.</p>`
          : `<div class="fld"><span>Where</span>${seg(
              p + '.pos',
              [
                ['any', 'Anywhere'],
                ['left', 'Left'],
                ['centre', 'Middle'],
                ['right', 'Right']
              ],
              { dflt: 'any' }
            )}</div>
    <div class="grid2">${fld(D.pair ? 'Each at least' : 'Width at least', p + '.wMin', { ph: +m.w > 0 ? m.w : 'auto · ' + D.min, auto: true })}${fld('at most', p + '.wMax', { ph: +m.w > 0 ? m.w : 'auto', auto: true })}</div>
    ${m.type === 'tv' ? `<div class="grid2">${fld('TV size (inch)', p + '.size', { ph: 'fits the niche', auto: true })}<div></div></div>` : ''}${m.type === 'desk' || m.type === 'wardrobe' || m.type === 'tv' ? `<div class="grid2">${fld('Unit at least this high', p + '.hMin', { ph: 'any · ' + f0(D.minH + +S.skirt.plinth + 2 * +S.mat.carcass.t), auto: true })}<div></div></div>` : ''}<p class="hintp" style="margin:0">Each shuffle picks a width between the two. Leave one empty for “no limit”; fill in the same number twice for an exact size.</p>`
    }</div>`;
    })
    .join('')}
  <div class="tchips">${Object.entries(MUSTS)
    .filter(([k]) => !ms.some(m => m.type === k) || k === 'wardrobe' || k === 'drawers' || k === 'open')
    .map(([k, D]) => `<button type="button" class="tchip" data-act="mustAdd" data-a="${k}">+ ${D.n}</button>`)
    .join('')}</div>
  ${ms.length ? `<button type="button" class="btn sm pri" data-act="rand" data-a="layout" style="justify-self:start">Shuffle with these</button>` : ''}</div>`;
}
function stockBuy(k) {
  if (k === 'back' || S.mat[k].type !== 'melamine') return '';
  const sc = stockCfg(),
    on = sc.on && !!sc.roles[k];
  return `<div class="fld"><span>Buy as</span><div class="seg" role="group"><button type="button" class="${on ? '' : 'on'}" data-act="stkBuy" data-a="${k}|0">Full sheets</button><button type="button" class="${on ? 'on' : ''}" data-act="stkBuy" data-a="${k}|1">Furniture panels</button></div></div>
  ${
    on
      ? `<div class="fld"><span>Panel widths you can buy · ${sc.L} mm long, edges already on</span><div class="tchips">${STOCK_W.map(w => `<button type="button" class="tchip ${sc.ws.includes(w) ? 'on' : ''}" data-act="stkW" data-a="${w}">${w / 10} cm</button>`).join('')}</div></div>${
          k === 'carcass'
            ? `<div class="fld"><span>Cabinet depth = panel width, so the sides need no long cuts</span><div class="tchips">${sc.ws
                .filter(w => w >= 300)
                .map(
                  w =>
                    `<button type="button" class="tchip ${+S.room.D === w ? 'on' : ''}" data-act="setv" data-a="room.D|${w}|n">${w / 10} cm deep</button>`
                )
                .join('')}</div></div>`
            : ''
        }`
      : ''
  }`;
}

function stylePick() {
  const cur = ui.style && STYLES[ui.style] ? STYLES[ui.style] : null,
    ks = [...STYLE_KEYS.filter(k => STYLES[k].sig), ...STYLE_KEYS.filter(k => !STYLES[k].sig)];
  return `<div class="stygrid" role="group" aria-label="Design style">${ks
    .map(k => {
      const y = STYLES[k],
        on = ui.style === k;
      return `<button type="button" class="sty ${on ? 'on' : ''}" data-act="style" data-a="${k}" aria-pressed="${on}" title="${esc(y.blurb)}"><span class="stsw">${y.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span><span class="stn">${on ? '↻ ' : ''}${y.name}</span></button>`;
    })
    .join(
      ''
    )}</div>${cur ? `<p class="styb"><b>${cur.name}</b> — ${esc(cur.blurb)}. Tap it again for another take.</p>` : '<p class="styb">Tap a look to restyle the whole wall.</p>'}`;
}
function lockChip() {
  const on = !!S.opts.lockFin,
    M = S.mat;
  return `<button type="button" class="lockchip ${on ? 'on' : ''}" data-act="lockFin" aria-pressed="${on}" title="Shuffles and styles keep your main colours and finishes; only layout, contents and accents change"><span class="ssw"><i style="background:${FIN[M.front.fin]?.base || '#ccc'}"></i><i style="background:${FIN[M.carcass.fin]?.base || '#ccc'}"></i></span>${on ? '🔒 Colours locked' : '🔓 Lock main colours'}</button>`;
}
const WMODES = [
  ['same', 'Same'],
  ['two', '2 sizes'],
  ['mixed', '3 sizes'],
  ['free', 'Free'],
  ['fixed', 'Fixed']
];
function sbn(l, p, ph) {
  const v = getP(p);
  return `<label class="sbn"><span class="sbl">${l}</span><input type="number" inputmode="numeric" id="${idOf(p)}" data-p="${p}" value="${v == null ? '' : v}" placeholder="${ph}" step="10"><em>mm</em></label>`;
}
function shufBar() {
  const nm = (S.opts.must || []).length,
    op = shufOpen();
  return `<div class="shufbar ${op ? '' : 'fold'}"><div class="sb1"><button type="button" class="pri" data-act="rand" data-a="all" title="New layout, contents and look">✨ Surprise me</button><button type="button" data-act="rand" data-a="keep" title="Keep every column's width and position; change what's inside">Contents</button><button type="button" data-act="rand" data-a="layout" title="New layout for this wall">Layout</button><button type="button" data-act="rand" data-a="fin" title="New colours and accents">Colours</button></div>
    <button type="button" class="sbfold" data-act="shufFold" aria-expanded="${op}" title="${op ? 'Fold the shuffle options away' : 'Show styles, box widths, budget and the other shuffle options'}"><span>Shuffle options</span><em>${op ? 'Hide ▴' : 'Show ▾'}</em></button>
    ${
      op
        ? `${stylePick()}
    <div class="sbw"><span class="sbl">Box widths when shuffling the layout</span>${seg('opts.wmode', WMODES, { dflt: 'mixed' })}</div>
    <div class="sbr">${S.opts.wmode === 'fixed' ? sbn('Every box', 'opts.wFix', '600') + '<span class="sbl">TV niche, desk and the like become a double box; leftover is one filler box</span>' : sbn('Narrowest', 'opts.wMin', 'any') + sbn('Widest', 'opts.wMax', 'any') + `<span class="sbg"><span class="sbl">Columns</span><div class="step"><button type="button" data-act="cols" data-a="-1" aria-label="Fewer columns">−</button><b style="min-width:34px;text-align:center">${+S.opts.cols > 0 ? S.opts.cols : 'Free'}</b><button type="button" data-act="cols" data-a="1" aria-label="More columns">+</button></div></span>`}</div>
    <div class="sb2"><button type="button" class="lockchip pchip" data-act="toPriceTab" title="Estimated price of this design — tap for the full price list">${pchipText()}</button>${budChipBtn()}</div>
    <div class="sb2">${lockChip()}${S.sections.some(x => x.base === 'panel') ? `<button type="button" class="lockchip ${S.opts.shufPanel !== false ? 'on' : ''}" data-act="shufPanel" aria-pressed="${S.opts.shufPanel !== false}" title="Shuffles also give the panel wall a new colour, finish and decoration">${S.opts.shufPanel !== false ? '✓ ' : ''}Panel wall too</button>` : ''}<button type="button" class="lockchip ${ui.mustOpen ? 'on' : ''}" data-act="mustT" aria-expanded="${!!ui.mustOpen}">Always include${nm ? ' · ' + nm : ''} ${ui.mustOpen ? '▴' : '▾'}</button><button type="button" class="lockchip ${ui.neverOpen ? 'on' : ''}" data-act="neverT" aria-expanded="${!!ui.neverOpen}">Never include${neverSet(S).size ? ' · ' + neverSet(S).size : ''} ${ui.neverOpen ? '▴' : '▾'}</button></div>`
        : ''
    }</div>${op && ui.mustOpen ? mustUI() : ''}${op && ui.neverOpen ? neverUI() : ''}`;
}
function neverUI() {
  const nv = neverSet(S);
  return `<div class="mustbox"><div class="mbh"><b>Never include${nv.size ? ' · ' + nv.size : ''}</b><span>Things no shuffle may put in. Tap to switch one on or off.</span></div>
  <div class="tchips">${Object.entries(NEVER)
    .map(
      ([k, n]) =>
        `<button type="button" class="tchip ${nv.has(k) ? 'on' : ''}" data-act="neverTog" data-a="${k}" aria-pressed="${nv.has(k)}">${nv.has(k) ? '✕ ' : ''}${n}</button>`
    )
    .join('')}</div>
  <p class="hintp" style="margin:0">This only steers the shuffle buttons: what you add by hand stays. Putting something here takes it off "Always include", and the other way round.</p>
  ${nv.size ? `<button type="button" class="btn sm pri" data-act="rand" data-a="keep" style="justify-self:start">Shuffle contents without these</button>` : ''}</div>`;
}
function shufOpen() {
  if (ui.shufOpen == null) {
    try {
      ui.shufOpen = localStorage.getItem('kast-shufopen') === '1';
    } catch (e) {
      ui.shufOpen = false;
    }
  }
  return !!ui.shufOpen;
}
function lockMain(st, base) {
  if (!base.opts.lockFin) return st;
  st.mat = JSON.parse(JSON.stringify(base.mat));
  ['handle', 'handleWood', 'handleSize'].forEach(k => {
    st.opts[k] = base.opts[k];
  });
  st.opts.two = JSON.parse(JSON.stringify(base.opts.two || { on: false }));
  st.room.wallFin = base.room.wallFin || '';
  st.sections.forEach(sc => {
    if (sc.base !== 'panel') return;
    const b =
      base.sections.find(x => x.id === sc.id && x.base === 'panel') || base.sections.find(x => x.base === 'panel');
    if (b && b.panel)
      sc.panel = Object.assign({}, sc.panel || {}, { fin: b.panel.fin, mat: b.panel.mat, t: b.panel.t });
    if (sc.panel.fun === 'climb' && (sc.panel.mat !== 'ply' || +sc.panel.t < 18)) sc.panel.fun = 'slats';
  });
  st.opts.lockFin = true;
  return st;
}
function linkUI(i, s) {
  if (s.base === 'panel' || s.base === 'door') return '';
  const li = s.link != null && s.link !== '' ? S.sections.findIndex(y => y.id === s.link) : -1,
    lk = li >= 0 ? li : null,
    cands = S.sections
      .map((x, j) => j)
      .filter(
        j => j !== i && S.sections[j].base === s.base && (S.sections[j].link == null || S.sections[j].link === '')
      );
  return `<div class="linkbox">${lk != null ? `<p class="linked">🔗 Same as column ${lk + 1} — its levels follow that column. Edit column ${lk + 1}, or <button type="button" class="lnk" data-act="unlink">unlink</button>.</p>` : ''}
  <div class="pbrow"><button type="button" class="btn sm" data-act="copyZones">Copy layout</button>${ui.clip && ui.clip.from !== i ? `<button type="button" class="btn sm" data-act="pasteZones">Paste layout${ui.clip.from != null ? ' from ' + (ui.clip.from + 1) : ''}</button>` : ''}${cands.length ? `<span class="inp sm"><select data-act="linkTo" aria-label="Make this column the same as another"><option value="">${lk != null ? 'Linked to ' + (lk + 1) : 'Make same as…'}</option>${cands.map(j => `<option value="${S.sections[j].id}" ${lk === j ? 'selected' : ''}>Column ${j + 1}</option>`).join('')}</select></span>` : ''}</div></div>`;
}
function slatUI(p, z, txt) {
  return `<div class="fld" style="grid-column:1/-1"><span>Slats run</span>${seg(
    p + '.slatDir',
    [
      ['v', 'Up and down'],
      ['h', 'Left to right']
    ],
    { dflt: 'v' }
  )}</div><div class="fld" style="grid-column:1/-1"><span>Slat size</span>${seg(
    p + '.slatSize',
    Object.entries(SLAT).map(([k_, v]) => [k_, `${v[2]} · ${v[0]} mm`]),
    { dflt: 'med' }
  )}</div><p class="hintp" style="grid-column:1/-1;margin:0">${txt} Under a sloping ceiling the slats always run up and down.</p>`;
}
function splitUI(i, k, z, zr) {
  const dr = z.type === 'drawers';
  if (!(dr || z.type === 'open' || (z.type === 'closed' && !z.dog))) return '';
  const q = geo.secs[i];
  if (!q) return '';
  const vd = Array.isArray(z.vd) ? z.vd : [],
    sh = !dr && z.vdMode === 'shift',
    auto = dr ? Math.max(1, Math.ceil(q.w / ((S.opts.hw || {}).brand === 'blumeco' ? 900 : 1200))) : 1,
    cur = dr ? Math.max(auto, Math.min(+z.split || 1, Math.floor(q.w / 250))) : sh ? vd.length : vd.length + 1,
    own = !dr && vd.length && !z.vdMode;
  const what = dr ? 'drawer stacks' : z.type === 'closed' ? 'cupboards' : 'compartments';
  return `<div class="fld splitf" style="grid-column:1/-1"><span>Split side by side</span><div class="splitrow"><div class="seg" role="group">${[1, 2, 3, 4, 5, 6].map(n => `<button type="button" class="${cur === n && !own ? 'on' : ''}" ${(dr && (n < auto || n > Math.max(auto, Math.floor(q.w / 250)))) || (!dr && n > 1 && (q.w - (n - 1) * geo.tc) / n < 100) ? 'disabled' : ''} data-act="splitN" data-a="${i}|${k}|${n}" aria-label="Split in ${n}">${splitIcon(n, sh && cur === n)}${n}</button>`).join('')}</div>${dr ? '' : `<button type="button" class="tchip ${sh ? 'on' : ''}" ${cur < 2 && !sh ? 'disabled' : ''} data-act="splitShift" data-a="${i}|${k}" aria-pressed="${sh}">⇆ Shift</button>`}</div>
  <p class="hintp" style="margin:0">${own ? 'The uprights have their own positions now — tap a number to make them even again.' : cur < 2 ? `One wide part. Tap a number to stand uprights in it and get ${what} side by side.` : sh ? `${cur + 1} ${what}: the uprights are shifted half a step, so they sit between the uprights of an even split above or below — like bricks.` : `${cur} equal ${what} side by side.${dr ? '' : ' Shift moves the uprights half a step, so they do not line up with the part above or below.'}`}${dr && auto > 1 ? ` This column is wide, so it needs at least ${auto}.` : ''}</p></div>`;
}
function splitIcon(n, sh) {
  const xs = sh
    ? Array.from({ length: n }, (_, j) => (j + 0.5) / n)
    : Array.from({ length: n - 1 }, (_, j) => (j + 1) / n);
  return `<svg viewBox="0 0 26 14" width="26" height="14" aria-hidden="true"><rect x="1" y="1" width="24" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/>${xs.map(x => `<line x1="${(1 + 24 * x).toFixed(1)}" y1="1" x2="${(1 + 24 * x).toFixed(1)}" y2="13" stroke="currentColor" stroke-width="1.3"/>`).join('')}</svg>`;
}
function zoneRow(i, k) {
  const s = S.sections[i],
    z = s.zones[k],
    p = `sections.${i}.zones.${k}`,
    zr = geo.secs[i]?.zones[k],
    top = k === s.zones.length - 1,
    on = ui.zsel === k,
    nm = (ZTYPES.find(t => t[0] === z.type) || [])[1];
  const dots = [];
  if (z.fabric) dots.push(FABRICS[z.fabricCol]?.c);
  if (FIN[z.fin]) dots.push(FIN[z.fin].base);
  if (FIN[z.inFin]) dots.push(FIN[z.inFin].base);
  let h = `<div class="zwrap"><button type="button" class="zrow ${on ? 'on' : ''}" data-act="zsel" data-a="${k}">${ZICON[z.type]}<span class="zt">${nm}${dots.map(c => `<i class="dot" style="background:${c}"></i>`).join('')}</span><span class="zm">${zoneSummary(z, zr)}</span><span class="chev">${on ? '▾' : '▸'}</span></button>`;
  if (!on) return h + '</div>';
  h += `<div class="zbody"><div class="tchips">${ZTYPES.map(([t, l]) => `<button type="button" class="tchip ${z.type === t ? 'on' : ''}" data-act="setv" data-a="${p}.type|${t}|s">${ZICON[t]}${l}</button>`).join('')}</div>`;
  h += `<div class="grid2">${fld('Height', p + '.h', { ph: top ? 'to ceiling' : 'auto · ' + (zr ? f0(zr.h) : ''), auto: true })}`;
  {
    const q_ = geo.secs[i],
      okD =
        ['closed', 'drawers', 'open'].includes(z.type) &&
        q_ &&
        !q_.panel &&
        !q_.door &&
        q_.follow == null &&
        !(q_.desk && k === 0) &&
        !(+z.span > 0);
    if (okD) {
      const v = +z.dz || 0;
      h += `<div class="fld" style="grid-column:1/-1"><span>Depth of this level</span>${seg(
        p + '.dz',
        [
          ['-100', '100 back'],
          ['-50', '50 back'],
          ['0', 'Flush'],
          ['50', '50 out'],
          ['100', '100 out'],
          ['150', '150 out']
        ],
        { num: true, dflt: 0 }
      )}</div>${fld('Or exactly (mm, minus = further back)', p + '.dz', { ph: '0' })}${v ? `<p class="hintp" style="grid-column:1/-1;margin:0">${v > 0 ? `This level sticks out ${f0((zr && zr.dzV) || v)} mm: it gets a sleeve (two sides, top and bottom) in front of the carcass, and its shelves and drawers are that much deeper.` : `This level sits ${f0(-((zr && zr.dzV) || v))} mm further back: its doors fit inside the sides (inset hinges) and its shelves and drawers are that much shallower.`}</p>` : ''}`;
    }
  }
  const nFronts = geo.fronts.filter(f => f.sec === i && f.zone === k).length;
  const handleRow = lbl => mx('Handles', handleRow0(lbl));
  const handleRow0 = lbl => {
    if (!nFronts) return '';
    const L1 = lbl[0].toUpperCase() + lbl.slice(1),
      opts = (cur, first) =>
        `<option value="">${first}</option>` +
        HANDLES.filter(h_ => h_[0] !== 'none')
          .map(([k_, l_]) => `<option value="${k_}" ${cur === k_ ? 'selected' : ''}>${l_}</option>`)
          .join('') +
        `<option value="none" ${cur === 'none' ? 'selected' : ''}>No handle (push to open)</option>`,
      gName = (HANDLES.find(h_ => h_[0] === S.opts.handle) || [])[1] || '';
    return `<div class="fld" style="grid-column:1/-1"><span>Handles in this level</span><select data-hd="${i}|${k}">${opts(z.hd || ((z.nh || []).length >= nFronts && (z.nh || []).slice(0, nFronts).every(Boolean) ? 'none' : ''), `Same as the whole cabinet (${gName})`)}</select></div>${nFronts > 1 ? `<details class="pf"${(z.hts || []).some(Boolean) || (z.nh || []).some(Boolean) ? ' open' : ''}><summary>Handle per ${lbl}</summary><div class="grid2">${Array.from({ length: nFronts }, (_, j) => `<label class="fld"><span>${L1} ${j + 1}</span><select data-hts="${i}|${k}|${j}">${opts((z.nh || [])[j] ? 'none' : (z.hts || [])[j] || '', 'Same as the level')}</select></label>`).join('')}</div></details>` : ''}`;
  };
  const perFront = lbl =>
    nFronts > 1
      ? `<details class="pf"><summary>Colour per ${lbl}</summary><div class="grid2">${Array.from({ length: nFronts }, (_, j) => finSelect(`${lbl[0].toUpperCase() + lbl.slice(1)} ${j + 1}`, `${p}.fins.${j}`, 'Level colour')).join('')}</div></details>`
      : '';
  const fabric = () =>
    `<div style="grid-column:1/-1;display:grid;gap:6px">${chk('Fabric fronts (frame wrapped in fabric)', p + '.fabric')}${z.fabric ? fabSwatches(p + '.fabricCol') : ''}</div>`;
  const frontDefault = `Same as fronts (${FIN[S.mat.front.fin].name})`;
  const vdUI = () => {
    const vd = Array.isArray(z.vd) ? z.vd : [],
      iw = zr ? Math.round(zr.comps ? zr.comps[zr.comps.length - 1][1] - geo.secs[i].xa : geo.secs[i].w) : 900;
    let o = `<div class="fld vdf" style="grid-column:1/-1"><span>Compartments and uprights</span><div class="vdrow"><div class="step"><button type="button" data-act="vdN" data-a="${i}|${k}|-1" aria-label="Fewer uprights">−</button><b>${vd.length || 'None'}</b><button type="button" data-act="vdN" data-a="${i}|${k}|1" aria-label="More uprights">+</button></div>`;
    if (vd.length) {
      const cur = String(z.vdMode || '').replace(/-r$/, '');
      o += `<div class="tchips">${Object.entries(VD_MODES)
        .filter(([m, M]) => M.ok(vd.length))
        .map(
          ([m, M]) =>
            `<button type="button" class="tchip ${cur === m ? 'on' : ''}" data-act="vdPreset" data-a="${i}|${k}|${m}" title="${M.r && vd.length === 1 ? 'Tap again to swap sides' : ''}">${M.l}${cur === m && M.r && vd.length === 1 ? ' ⇄' : ''}</button>`
        )
        .join(
          ''
        )}${z.vdMode ? '' : `<span class="hintp" style="margin:0;align-self:center">Own positions</span>`}</div>`;
    }
    o += `</div>`;
    if (zr && zr.vdSag)
      o += `<p class="hintp" style="margin:0">${zr.vdSag === 1 ? '1 upright was' : zr.vdSag + ' uprights were'} added automatically, because shelves this wide would sag under clothes and boxes. Set your own uprights to replace ${zr.vdSag === 1 ? 'it' : 'them'}.</p>`;
    if (!vd.length && ((zr && zr.vdSag) || z.noAutoVd))
      o += `<label class="chk"><input type="checkbox" data-act="setv" data-a="${p}.noAutoVd|${z.noAutoVd ? 'x' : '1'}|${z.noAutoVd ? 'x' : 'n'}" ${z.noAutoVd ? 'checked' : ''}> No automatic uprights (the shelves may sag)</label>`;
    if (vd.length) {
      const cw = (zr && zr.comps) || [];
      const lb_ = (zr && zr.lined) || 0,
        cwi = (c, ci) => c[1] - c[0] - (ci === 0 ? lb_ : 0) - (ci === cw.length - 1 ? lb_ : 0);
      o += `<div class="vdbar">${cw.map((c, ci) => `<i style="flex:${Math.max(1, cwi(c, ci))}">${f0(cwi(c, ci))}</i>`).join('')}</div>`;
      o += `<div class="vdlist">${vd.map((v, j) => `<div class="vdi"><span>Upright ${j + 1}</span><div class="step"><button type="button" data-act="vdMove" data-a="${i}|${k}|${j}|-50" aria-label="Move left">◀</button><b>${f0(v)}</b><button type="button" data-act="vdMove" data-a="${i}|${k}|${j}|50" aria-label="Move right">▶</button></div></div>`).join('')}</div>`;
      o += `<p class="hintp" style="margin:0">Numbers are mm from the inside left. Each tap moves 50 mm; compartments can be as narrow as 100 mm.${z.type === 'closed' && !(+z.doors > 0) ? ' Doors follow the compartments.' : ''}</p>`;
      const nc = vd.length + 1,
        railIdx = z.type === 'closed' && z.rail && zr && zr.railY && zr.railIdx ? zr.railIdx : [],
        anySt = (z.vst || []).slice(0, nc).some(Boolean);
      o += `<details class="pf"><summary>Colour per compartment</summary><div class="grid2">${Array.from({ length: nc }, (_, ci) => finSelect(`Back colour · compartment ${ci + 1}`, `${p}.cFin.${ci}`, 'Same as inside')).join('')}</div></details>`;
      o += `<div class="fld" style="grid-column:1/-1"><span>Per compartment — shelves, spacing and stagger</span><div class="tchips"><button type="button" class="tchip ${anySt ? 'on' : ''}" data-act="stagAlt" data-a="${i}|${k}" aria-pressed="${anySt}">⇅ Stagger every other compartment</button></div></div><div class="ccs">${Array.from(
        { length: nc },
        (_, ci) => {
          const isR = railIdx.includes(ci),
            st = !!(z.vst || [])[ci];
          return `<div class="cc"><div class="cch"><b>Compartment ${ci + 1}</b><span>${cw[ci] ? f0(cwi(cw[ci], ci)) + ' mm' : ''}</span></div>${z.type === 'closed' && z.rail && zr && zr.railY ? `<button type="button" class="tchip ${isR ? 'on' : ''}" data-act="railPick" data-a="${i}|${k}|${ci}" aria-pressed="${isR}">${isR ? '●' : '○'} Hanging rail here</button>` : ''}${isR ? '<p class="hintp" style="margin:0">Its shelves are set under “Hanging rail” above.</p>' : stepper('Shelves', `${p}.vsh.${ci}`, 0, 10) + `<div class="fld"><span>Spacing</span><div class="tchips">${SPACINGS.map(([sk, sl]) => `<button type="button" class="tchip ${((z.vsp || [])[ci] || z.space || 'even') === sk ? 'on' : ''}" data-act="setv" data-a="${p}.vsp.${ci}|${sk}|s">${sl}</button>`).join('')}</div></div><label class="chk"><input type="checkbox" data-act="setv" data-a="${p}.vst.${ci}|${st ? 'x' : '1'}|${st ? 'x' : 'n'}" ${st ? 'checked' : ''}> Staggered — shelves half a step lower</label>`}</div>`;
        }
      ).join('')}</div>`;
    }
    return isSheet()
      ? mx('Compartments and uprights', o.replace('<span>Compartments and uprights</span>', '') + '</div>')
      : o + `</div>`;
  };
  const faceUI = () =>
    `<div class="fld" style="grid-column:1/-1"><span>Front style</span><div class="tchips">${[
      ['flat', 'Flat'],
      ['fluted', 'Fluted'],
      ['cane', 'Cane'],
      ...(z.type === 'closed'
        ? [
            ['slat', 'Slats'],
            ['glass', 'Fluted glass + light'],
            ['curtain', 'Curtain']
          ]
        : [])
    ]
      .map(
        ([k_, l]) =>
          `<button type="button" class="tchip ${(z.face || 'flat') === k_ ? 'on' : ''}" data-act="setv" data-a="${p}.face|${k_}|s"><i class="fdot f-${k_}"></i>${l}</button>`
      )
      .join('')}</div></div>` +
    (z.face === 'slat' && z.type === 'closed'
      ? slatUI(
          p,
          z,
          'Doors made of slats on cross rails, with open gaps: air and light pass through and you glimpse what is inside. The two edge pieces of each door are wider, for the hinges and the handle.'
        )
      : '') +
    (z.face === 'curtain' ? `<div style="grid-column:1/-1">${fabSwatches(p + '.fabricCol')}</div>` : '') +
    (z.doorMode === 'slide' || z.face === 'curtain'
      ? ''
      : `<div class="fld" style="grid-column:1/-1"><span>How the fronts sit</span>${seg(
          p + '.inset',
          [
            ['', 'Over the frame'],
            ['1', 'Inset in the frame']
          ],
          { dflt: '' }
        )}</div>`);
  h += splitUI(i, k, z, zr);
  if (z.type === 'seat') {
    h += `<div class="fld"><span>Drawers under the seat</span>${seg(
      p + '.count',
      [
        [1, '1'],
        [2, '2'],
        [3, '3']
      ],
      { num: true }
    )}</div><div class="fld" style="grid-column:1/-1"><span>Cushion fabric</span>${fabSwatches(p + '.fabricCol')}</div><p class="hintp" style="grid-column:1/-1;margin:0">Set the level height so the seat board lands ≈ 420 mm; the cushion adds about 80 mm. Leave the level above open for the nook.</p>`;
    h += handleRow('drawer');
  }
  if (z.type === 'closed') {
    if (zr && zr.joined != null)
      h += `<p class="linked" style="grid-column:1/-1;margin:0">🔗 The doors of level ${zr.joined + 1} below run up over this level, in one piece and one colour. Its shelves and inside are still set here. To give this level its own doors again, switch off “Join with the cupboard above” in level ${zr.joined + 1}.</p>`;
    if (!z.dog && s.zones[k + 1] && s.zones[k + 1].type === 'closed')
      h += `<div style="grid-column:1/-1">${chk('Join with the cupboard above — one tall door over both, in one colour', p + '.joinUp')}</div>`;
    if (z.face !== 'curtain')
      h += `<div class="fld" style="grid-column:1/-1"><span>Doors</span>${seg(
        p + '.doorMode',
        [
          ['hinged', 'Hinged'],
          ['slide', 'Sliding'],
          ['pocket', 'Pocket']
        ],
        { dflt: 'hinged' }
      )}</div>`;
    h +=
      (z.rail ? '' : stepper(z.vd && z.vd.length ? 'Shelves (when not split)' : 'Shelves', p + '.shelves', 0, 10)) +
      loadUI(p, z, zr) +
      (!z.rail && (+z.shelves > 0 || (z.vsh || []).some(v => +v > 0))
        ? `<div class="fld" style="grid-column:1/-1"><span>Shelf spacing</span>${seg(p + '.space', SPACINGS, { dflt: 'even' })}</div>`
        : '') +
      stepper('Doors', p + '.doors', z.doorMode === 'slide' ? 2 : 0, 6, z.doorMode !== 'slide');
    if (+z.doors === 1)
      h += `<div class="fld"><span>Hinge side</span>${seg(p + '.hinge', [
        ['L', 'Left'],
        ['R', 'Right']
      ])}</div>`;
    h += `<div style="grid-column:1/-1">${chk('Hanging rail', p + '.rail')}</div>`;
    if (z.rail) {
      h += `<div class="fld" style="grid-column:1/-1"><span>Rail height ${zr && zr.railAuto ? '(suggested)' : `<button type="button" class="autob" data-act="setv" data-a="${p}.railH||x">reset</button>`}</span><div class="step rail"><button type="button" data-act="railStep" data-a="${i}|${k}|-50" aria-label="Lower the rail 50 mm">▼ Lower</button><b>${zr && zr.railY ? f0(zr.railY) : '—'} mm</b><button type="button" data-act="railStep" data-a="${i}|${k}|50" aria-label="Raise the rail 50 mm">▲ Higher</button></div></div>`;
      h += `<p class="hintp" style="grid-column:1/-1;margin:0">${zr && zr.railY ? `${zr.na || zr.nb ? `${zr.na} shelf${zr.na === 1 ? '' : 'ves'} above, ${zr.nb} below the rail · ` : ''}${f0(zr.railY - (zr.hangFloor ?? zr.y0))} mm to hang. ` : ''}Each tap moves the rail 50 mm. Coats and dresses need ≈1500–1700 mm, shirts and jackets ≈1000 mm, children ≈800 mm. </p>`;
      h += `<div class="fld"><span>Shelves above the rail</span><div class="step"><button type="button" data-act="railSh" data-a="${i}|${k}|up|-1" aria-label="Fewer">−</button><b>${zr ? zr.na || 0 : 0}</b><button type="button" data-act="railSh" data-a="${i}|${k}|up|1" aria-label="More">+</button></div></div><div class="fld"><span>Shelves below the clothes</span><div class="step"><button type="button" data-act="railSh" data-a="${i}|${k}|dn|-1" aria-label="Fewer">−</button><b>${zr ? zr.nb || 0 : 0}</b><button type="button" data-act="railSh" data-a="${i}|${k}|dn|1" aria-label="More">+</button></div></div><div style="grid-column:1/-1">${chk('Two rails, one above the other (double hanging for shirts)', p + '.rail2')}</div>${zr && zr.rail2Y ? `<p class="hintp" style="grid-column:1/-1;margin:0">Top rail at ${f0(zr.railY)} mm, lower rail at ${f0(zr.rail2Y)} mm — about ${f0(zr.railY - zr.rail2Y - 40)} mm of hanging length each.</p>` : ''}`;
    }
    if (!z.dog) {
      const F = FITS[z.fit],
        q_ = geo.secs[i];
      h += mx(
        'Inside fittings',
        `<div class="fld" style="grid-column:1/-1"><span>Inside fittings — behind the doors</span><div class="tchips"><button type="button" class="tchip ${!z.fit ? 'on' : ''}" data-act="setv" data-a="${p}.fit||s">None</button></div>${[
          ['clothes', 'For clothes'],
          ['drawers', 'Drawers and baskets'],
          ['extra', 'Extras']
        ]
          .map(
            ([g_, gl]) =>
              `<div class="fitg"><small>${gl}</small><div class="tchips">${Object.entries(FITS)
                .filter(([, v]) => v.grp === g_)
                .map(
                  ([k_, v]) =>
                    `<button type="button" class="tchip ${(z.fit || '') === k_ ? 'on' : ''}" data-act="setv" data-a="${p}.fit|${k_}|s">${v.s}</button>`
                )
                .join('')}</div></div>`
          )
          .join(
            ''
          )}</div><div style="grid-column:1/-1;display:grid;gap:6px">${chk('Mirror on the inside of the door', p + '.dMirror')}${chk('Air vents in the door (damp attic, or a dryer inside)', p + '.vent')}${chk('Utility cupboard: socket for chargers, broom rail, vacuum bracket', p + '.util')}${chk('Built-in fridge behind this door (the door is fixed to the fridge door)', p + '.fridge')}</div>${F && F.multi ? stepper('How many', p + '.fitN', 1, 6) : ''}${F ? `<p class="hintp" style="grid-column:1/-1;margin:0">${F.tip} Needs ${F.minW}–${F.maxW} mm inside width and ${F.minD} mm depth; this column has ${q_ ? f0(q_.w) + ' × ' + f0(q_.Dh) : ''} mm${zr && zr.fit ? ' — it fits.' : ' — <b>it does not fit here, see the warning under the drawing.</b>'} Switch on “see inside” to see it in the drawing.</p>` : ''}`,
        'fit'
      );
    }
    if (!z.dog) h += vdUI();
    h += z.dog ? '' : mx('Front style', faceUI() + (!z.face || z.face === 'flat' ? fabric() : ''));
    h += mx(
      'Dog den',
      `<div class="fld" style="grid-column:1/-1"><span>Dog den (for a big dog)</span>${seg(p + '.dog', [['', 'Off'], ...Object.entries(DOGS)], { dflt: '' })}</div>${z.dog ? `<p class="hintp" style="margin:0;grid-column:1/-1">The front is a fixed panel in the same finish as the doors beside it, with a doorway cut in so the dog can always walk in and out. Pick the doorway shape above. Inside now: ${zr ? f0(geo.secs[i].w) + ' × ' + f0(zr.h) : ''} mm, ${f0(geo.secs[i]?.Dh || 0)} deep. A big dog likes about 1100 × 760 mm or more — set the column width and this level’s height to suit.</p>` : ''}`,
      'dog'
    );
    if (!z.fabric)
      h += `<div style="grid-column:1/-1">${finSelect('Door colour', p + '.fin', frontDefault)}${perFront('door')}</div>`;
    h += handleRow('door');
  }
  if (z.type === 'drawers') {
    h +=
      stepper('Drawers', p + '.count', 1, 8) +
      mx('Front style', faceUI() + (!z.face || z.face === 'flat' ? fabric() : ''));
    if (!z.fabric)
      h += `<div style="grid-column:1/-1">${finSelect('Front colour', p + '.fin', frontDefault)}${perFront('drawer')}</div>`;
    h += handleRow('drawer');
  }
  if (z.type === 'open') {
    h +=
      stepper(z.vd && z.vd.length ? 'Shelves (when not split)' : 'Shelves', p + '.shelves', 0, 10) +
      loadUI(p, z, zr) +
      (+z.shelves > 0 || (z.vsh || []).some(v => +v > 0)
        ? `<div class="fld" style="grid-column:1/-1"><span>Shelf spacing</span>${seg(p + '.space', SPACINGS, { dflt: 'even' })}</div>`
        : '') +
      `<div style="grid-column:1/-1">${chk('Picture ledges — slim lipped shelves for leaning art and records', p + '.ledge')}${chk('Arched tops — a front frame with a rounded opening over every compartment', p + '.arch')}${z.arch ? '' : chk('Slatted screen — fixed slats in front of the shelves, with open gaps', p + '.slat')}${
        z.arch || z.slat
          ? ''
          : `<div class="fld"><span>Contrast cubbies</span>${seg(
              p + '.cub',
              [
                ['', 'Off'],
                ['checker', 'Checkerboard'],
                ['steps', 'Steps'],
                ['random', 'Random']
              ],
              { dflt: '' }
            )}</div>${z.cub ? `<div class="grid2">${finSelect('Cubby colour', p + '.cubFin', 'Blue-green')}${finSelect('Cover colour', p + '.fin', 'Same as the doors')}</div>${z.cub === 'random' ? `<button type="button" class="btn sm" style="justify-self:start" data-act="setv" data-a="${p}.cubSeed|${Math.floor(Math.random() * 999)}|n">Shuffle the cubbies</button>` : ''}<p class="hintp" style="margin:0">Every cell of this level is either an open cubby, framed and painted inside in the cubby colour, or closed by a flat cover in the door colour. The grid comes from “Split side by side” and the shelf count.</p>` : ''}`
      }${
        z.slat && !z.arch
          ? ''
          : `<div class="fld"><span>Storage boxes on the shelves</span>${seg(
              p + '.bask',
              [
                ['', 'None'],
                ['bottom', 'Bottom row'],
                ['alt', 'Every other row'],
                ['all', 'Every row']
              ],
              { dflt: '' }
            )}</div>${
              z.bask
                ? `<div class="fld"><span>Grip on the boxes</span>${seg(
                    p + '.baskGrip',
                    [
                      ['', 'Hand slot'],
                      ['hole', 'One finger hole'],
                      ['two', 'Two finger holes']
                    ],
                    { dflt: '' }
                  )}</div>` +
                  finSelect(
                    'Box colour',
                    p + '.baskFin',
                    FIN[z.inFin] ? 'Same as the inside colour' : 'Same as the doors'
                  ) +
                  `<p class="hintp" style="margin:0">Open wooden boxes with a hand slot or finger holes, made to fit each compartment: toys and clutter go in, and the wall stays calm. Give them the inside colour for a colour-drenched look, or pick their own. ${zr && zr.bask ? zr.bask + ' box' + (zr.bask === 1 ? '' : 'es') + ' in this level; the parts are on the cut list.' : ''}</p>`
                : ''
            }`
      }${z.slat && !z.arch ? `<div class="grid2">${slatUI(p, z, 'The screen does not open: it half hides the shelves and lets air and light through. Good in front of a radiator, speakers or a messy shelf.')}</div>${finSelect('Slat colour', p + '.slatFin', 'Same as the doors')}` : ''}${z.arch ? finSelect('Frame colour', p + '.archFin', FIN[z.inFin] ? 'Same as the inside colour' : 'Same as the doors') : ''}${z.arch ? '<p class="hintp" style="margin:0">One board sits in front of this level with the arches sawn out of it; the shelves and uprights behind it stay straight. Use “Split side by side” for more arches next to each other and the shelf count for rows. It looks best colour-drenched, in one colour inside and out.</p>' : ''}</div><div class="fld" style="grid-column:1/-1"><span>Use these shelves as</span>${seg(
        p + '.niche',
        [
          ['', 'Plain shelves'],
          ['bar', 'Bar (mirror + light)'],
          ['coffee', 'Coffee (splashback + light)']
        ],
        { dflt: '' }
      )}</div>` +
      vdUI() +
      `<div style="grid-column:1/-1;display:grid;gap:8px">${finSelect('Inside colour (back & shelves)', p + '.inFin', `Same as carcass (${FIN[S.mat.carcass.fin].name})`)}${FIN[z.inFin] ? chk('Colour-drench — sides, top, bottom and dividers in the inside colour too', p + '.drench') + (z.drench && geo.secs[i] && geo.secs[i].dren ? '<p class="hintp" style="margin:0">Every level of this column is drenched in this colour, so its own box takes the colour on the outside too: top, bottom and each side it does not share with a column in another colour.</p>' : '') : ''}${chk(`Own box, flush with the doors — its front edge stands ${S.mat.front.t} mm proud of the carcass, in line with the door fronts above and below`, p + '.box')}</div>`;
    if (z.box)
      h +=
        fld('Box board thickness', p + '.boxT', { ph: String(S.mat.front.t) }) +
        fld('Stands proud by', p + '.boxExt', { ph: String(S.mat.front.t) }) +
        `<div style="grid-column:1/-1">${finSelect(z.drench && FIN[z.inFin] ? 'Box colour (now: the drench colour)' : 'Box colour', p + '.boxFin', frontDefault)}</div><p class="hintp" style="grid-column:1/-1;margin:0">“Stands proud by” is how far the box sticks out past the cabinet body. Leave it empty to line up exactly with the doors; type a little more or less to make the box stand out or sit back.</p>`;
  }
  if (z.type === 'opening') {
    const maxSpan = S.sections.length - 1 - i,
      look = z.look || 'tv';
    h += `<div class="fld" style="grid-column:1/-1"><span>Show in the niche</span>${seg(
      p + '.look',
      [
        ['tv', 'TV'],
        ['art', 'Art frame'],
        ['nook', 'Reading nook'],
        ['dj', 'DJ setup'],
        ['washer', 'Washing machine'],
        ['dryer', 'Dryer'],
        ['stack', 'Washer + dryer on top'],
        ['bed', 'Fold-down bed'],
        ['oven', 'Oven'],
        ['combi', 'Compact oven / combi microwave'],
        ['none', 'Nothing']
      ],
      { dflt: 'tv' }
    )}</div>${['washer', 'dryer', 'stack'].includes(look) ? `<p class="hintp" style="grid-column:1/-1;margin:0">Machines are about 600 × 850 × 600 mm. The niche needs 610+ mm inside width and the column about 650 mm depth for the hoses. A dryer in a cupboard must be a heat-pump or condenser dryer (no air hose). Put a basket drawer of about 300 mm under the washer so you don’t bend down.</p>` : ''}${look === 'oven' || look === 'combi' ? `<p class="hintp" style="grid-column:1/-1;margin:0">A built-in ${look === 'oven' ? 'oven needs a niche of 560–568 × 585–600 mm' : 'compact oven or combi microwave needs a niche of 560–568 × 450–460 mm'} and 550 mm depth, with an air gap behind it. In a 600 mm column with 18 mm sides the width is right. Best with its bottom at 700–950 mm; drawers below are handy for trays.</p>` : ''}${look === 'bed' ? `<p class="hintp" style="grid-column:1/-1;margin:0">A bed that folds down from the wall: its underside is the front you see. 90 cm mattress from 960 mm inside width, 140 cm from 1,460; at least 2080 mm high and 420 mm deep. Make it the bottom level.</p>` : ''}`;
    if (look === 'nook')
      h += `<div class="fld" style="grid-column:1/-1"><span>Front of the nook</span>${seg(
        p + '.nookFront',
        [
          ['', 'Open'],
          ['arch', 'Arch'],
          ['eyebrow', 'Low arch'],
          ['port', 'Porthole'],
          ['pod', 'Round pod'],
          ['house', 'House']
        ],
        { dflt: '' }
      )}</div>${
        z.nookFront
          ? `<div class="fld" style="grid-column:1/-1"><span>Opening size</span>${seg(
              p + '.nookSize',
              [
                ['', 'Full width'],
                ['0.8', 'Large'],
                ['0.65', 'Medium'],
                ['0.5', 'Small']
              ],
              { dflt: '' }
            )}</div>${
              [0.8, 0.65, 0.5].includes(+z.nookSize)
                ? `<div class="fld" style="grid-column:1/-1"><span>Opening position</span>${seg(
                    p + '.nookPos',
                    [
                      ['l', 'Left'],
                      ['', 'Middle'],
                      ['r', 'Right']
                    ],
                    { dflt: '' }
                  )}</div><p class="hintp" style="grid-column:1/-1;margin:0">A smaller opening leaves more closed front around it — cosier inside, and the nook stays a little hidden.</p>`
                : ''
            }`
          : ''
      }${z.nookFront === 'pod' ? `<div style="grid-column:1/-1">${finSelect('Pod colour — rim, tube and back', p + '.podFin', FIN[z.inFin] ? 'Same as the inside colour' : 'Same as the front')}</div><p class="hintp" style="grid-column:1/-1;margin:0">A round tube of bent plywood runs from the opening to the back, with a thick rim in front and a ribbed cushion inside. It replaces the mattress, side cushions and padding; book ledges go on the back.</p>` : ''}${z.nookFront ? `<div style="grid-column:1/-1">${finSelect('Front of the nook — colour', p + '.nookFrontFin', z.drench && FIN[z.inFin] ? 'Same as the inside colour' : 'Same as the doors')}</div>` : ''}<div style="grid-column:1/-1;display:grid;gap:8px">${chk('Curtain — close the nook off as a den', p + '.nookCurtain')}${z.nookCurtain ? `<div class="fld"><span>Curtain fabric</span>${fabSwatches(p + '.nookCurtCol')}</div>` : ''}${chk('Book ledges on the side wall and a cubby on the back wall', p + '.nookLedges')}${chk('Padded back and sides, in the mattress fabric', p + '.nookPad')}${chk('Step box in front, to climb in', p + '.nookStep')}</div><div class="fld" style="grid-column:1/-1"><span>Mattress fabric</span>${fabSwatches(p + '.fabricCol')}</div><p class="hintp" style="grid-column:1/-1;margin:0">A cosy place to sit and read: a foam mattress on the niche floor, cushions against the back and a warm reading light above. ${zr && zr.open ? `Now ${f0(zr.open.ix1 - zr.open.ix0)} wide, ${f0(zr.open.iy1 - zr.open.iy0)} high, starting ${f0(zr.open.iy0)} mm above the floor. ` : ''}Good sizes for children: 900 mm or wider, 850 mm or higher, 250–450 mm above the floor. It looks best with “Own box” or colour-drench switched on below. The cushions show in the drawing when Styling is on.</p>`;
    if (look === 'dj') {
      h += `<div style="grid-column:1/-1;display:grid;gap:6px">${chk('LED glow strip', p + '.led')}${
        z.led !== false
          ? `<div class="tchips">${[
              ['#7FD3FF', 'Ice blue'],
              ['#FF5FD2', 'Magenta'],
              ['#9DFF7F', 'Lime'],
              ['#FFD08A', 'Warm white']
            ]
              .map(
                ([c, l]) =>
                  `<button type="button" class="tchip ${(z.ledCol || '#7FD3FF') === c ? 'on' : ''}" data-act="setv" data-a="${p}.ledCol|${c}|s"><i class="dot" style="width:14px;height:14px;background:${c}"></i>${l}</button>`
              )
              .join('')}</div>`
          : ''
      }<p class="hintp" style="margin:0">${zr && zr.open ? `Deck height ${f0(zr.open.iy0)} mm — 950–1050 mm is comfortable when standing.` : ''} Two turntables and a mixer if the niche is 1.25 m or wider, otherwise a controller.</p></div>`;
    }
    if (look === 'tv' || look === 'art')
      h += fld(look === 'art' ? 'Frame size' : 'TV size', p + '.tv', {
        unit: 'inch',
        ph: look === 'art' ? 'auto' : 'none'
      });
    h += stepper('Niche runs over the next columns →', p + '.span', 0, Math.max(0, maxSpan));
    if (look === 'art')
      h += `<div class="fld" style="grid-column:1/-1"><span>Artwork</span><div class="tchips">${ARTSTYLES.map(([k, l]) => `<button type="button" class="tchip ${(z.artStyle || 'abstract') === k ? 'on' : ''}" data-act="setv" data-a="${p}.artStyle|${k}|s">${l}</button>`).join('')}<button type="button" class="tchip" data-act="setv" data-a="${p}.artSeed|${1 + Math.floor(Math.random() * 9999)}|n">↻ New artwork</button></div></div><div class="fld" style="grid-column:1/-1"><span>Frame</span><div class="tchips">${Object.entries(
        ARTFRAMES
      )
        .map(
          ([k, f]) =>
            `<button type="button" class="tchip ${(z.frameCol || 'oak') === k ? 'on' : ''}" data-act="setv" data-a="${p}.frameCol|${k}|s"><i class="dot" style="width:14px;height:14px;background:${f.c}"></i>${f.name}</button>`
        )
        .join('')}</div></div>`;
    h += `<div style="grid-column:1/-1;display:grid;gap:6px">${chk('Stronger board above the niche (2–3 layers + rails)', p + '.header')}${chk('Cable hole in the back', p + '.grommet')}${chk(`Own box, flush with the doors — its front edge stands ${S.mat.front.t} mm proud of the carcass, in line with the door fronts above and below`, p + '.box')}</div>`;
    if (z.box)
      h +=
        fld('Box board thickness', p + '.boxT', { ph: String(S.mat.front.t) }) +
        fld('Stands proud by', p + '.boxExt', { ph: String(S.mat.front.t) }) +
        `<div style="grid-column:1/-1">${finSelect(z.drench && FIN[z.inFin] ? 'Box colour (now: the drench colour)' : 'Box colour', p + '.boxFin', frontDefault)}</div><p class="hintp" style="grid-column:1/-1;margin:0">“Stands proud by” is how far the box sticks out past the cabinet body. Leave it empty to line up exactly with the doors; type a little more or less to make the box stand out or sit back.</p>`;
    h += `<div style="grid-column:1/-1;display:grid;gap:8px">${finSelect('Inside colour (back)', p + '.inFin', `Same as back (${FIN[S.mat.back.fin].name})`)}${FIN[z.inFin] ? chk('Colour-drench — the whole niche in the inside colour: back, sides, top and bottom', p + '.drench') : ''}${z.drench && FIN[z.inFin] && !z.box ? '<p class="hintp" style="margin:0">A drenched niche gets its own box in that colour, flush with the doors.</p>' : ''}</div>`;
  }
  if (z.type === 'speaker') {
    h +=
      fld('Woofer cut-out Ø', p + '.woofer') +
      `<div class="fld"><span>Woofers</span>${seg(
        p + '.nw',
        [
          [0, '0'],
          [1, '1'],
          [2, '2']
        ],
        { num: true }
      )}</div>` +
      fld('Tweeter cut-out Ø', p + '.tweeter', { ph: 'none' });
    h += `<div style="grid-column:1/-1;display:grid;gap:6px">${chk('Fabric grille', p + '.grille')}${z.grille ? fabSwatches(p + '.fabricCol') : finSelect('Baffle colour', p + '.fin', frontDefault)}</div>`;
  }
  h += '</div>';
  if (zr) {
    const bits = [];
    if (zr.vol) bits.push(`≈${zr.vol.toFixed(1)} L enclosure`);
    if (zr.headerNote) bits.push(zr.headerNote);
    if (zr.boxNote) bits.push(zr.boxNote);
    if (zr.railY) bits.push(`rail at ${f0(zr.railY)} mm`);
    if (bits.length) h += `<div class="zinfo">${bits.join(' · ')}</div>`;
  }
  h += `<div class="ztools"><button class="btn sm" data-act="moveZone" data-a="${k},1">Move up</button><button class="btn sm" data-act="moveZone" data-a="${k},-1">Move down</button><button class="btn sm" data-act="delZone" data-a="${k}">Remove</button></div></div></div>`;
  return h;
}
