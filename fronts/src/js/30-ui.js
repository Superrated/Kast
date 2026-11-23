/* ==== 30-ui.js ====
   The four steps (1 Cabinets · 2 Fronts · 3 Handles · 4 Order), the panel for each, the picture switch
   (Front | 3D), Surprise me, the price bar and every tap. One render() redraws everything from S.
   Tapping a front selects it: in Fronts it can get its own look, in Handles its hinge side can swap.
*/
const STEPS = [
  ['cabs', 'Cabinets'],
  ['fronts', 'Fronts'],
  ['handles', 'Handles'],
  ['order', 'Order']
];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const seg = (act, cur, opts) =>
  `<div class="seg">${opts.map(([k, l]) => `<button type="button" class="${String(k) === String(cur) ? 'on' : ''}" data-act="${act}" data-a="${k}">${l}</button>`).join('')}</div>`;
/* a row of choices for one cabinet: data-a is "cabinet id|value" */
const segC = (act, c, cur, opts) =>
  `<div class="seg">${opts.map(([k, l]) => `<button type="button" class="${String(k) === String(cur) ? 'on' : ''}" data-act="${act}" data-a="${c.id}|${k}">${l}</button>`).join('')}</div>`;
const f1 = v => (Math.round(v * 10) / 10).toString();

function render() {
  if (!matOk(S.style, S.mat)) S.style = MATS[S.mat] && MATS[S.mat].only ? MATS[S.mat].only : 'flat';
  const L = layout(),
    P = priceAll(L);
  if (S.sel && !L.fronts.some(f => f.id === S.sel)) S.sel = null;
  save();
  const i = STEPS.findIndex(s => s[0] === S.step);
  const stepBtns = STEPS.map(
    ([k, l], n) =>
      `<button type="button" class="${k === S.step ? 'on' : ''}${n < i ? ' done' : ''}" data-act="step" data-a="${k}"><i>${n < i ? '✓' : n + 1}</i><span>${l}</span></button>`
  ).join('');
  document.getElementById('steps').innerHTML = stepBtns;
  document.getElementById('bsteps').innerHTML = stepBtns;
  // the picture: flat or 3D
  const v3 = S.view === '3d';
  document.getElementById('pic').hidden = v3;
  document.getElementById('pic3d').hidden = !v3;
  if (v3) open3D();
  else drawPic();
  document.getElementById('stagebar').innerHTML = `${seg('view', S.view, [
    ['2d', 'Front'],
    ['3d', '3D']
  ])}<span class="chip"><b>${SYS[S.sys].name}</b> ${P.n} front${P.n === 1 ? '' : 's'}</span>${S.recipe ? `<span class="chip rec">✨ ${esc(S.recipeSay || S.recipe)}</span>` : ''}<span class="sp"></span><button type="button" class="btn sm surp" data-act="surprise">✨ Surprise me</button>`;
  document.getElementById('pichint').textContent = L.fronts.length
    ? v3
      ? 'Drag to turn · scroll or pinch to zoom · tap a front to change just that one'
      : 'Tap a front to change just that one'
    : '';
  document.getElementById('pbar').innerHTML =
    `<div class="ptot"><span>${P.n} front${P.n === 1 ? '' : 's'} · incl. VAT${P.del ? ' + delivery' : ''}</span><b>${eur(P.total)}</b></div>${
      S.step === 'order'
        ? ''
        : `<button type="button" class="btn ghost" data-act="next">${i < STEPS.length - 2 ? 'Next: ' + STEPS[i + 1][1] : 'See the order'} →</button>`
    }<button type="button" class="btn pri" data-act="orderNow" ${P.n ? '' : 'disabled'}>Order</button>`;
  document.getElementById('panel').innerHTML = {
    cabs: cabsHTML,
    fronts: frontsHTML,
    handles: handlesHTML,
    order: orderHTML
  }[S.step](L, P);
  document.getElementById('app').dataset.step = S.step;
}
function selectFront(id) {
  S.sel = id && S.sel !== id ? id : null;
  if (S.sel && S.step !== 'handles') S.step = 'fronts';
  render();
  if (S.sel && innerWidth <= 860) {
    const el = document.getElementById('panel');
    window.scrollTo({ top: el.offsetTop - document.querySelector('.stage').offsetHeight, behavior: 'smooth' });
  }
}

/* ---------- 1 Cabinets ---------- */
const QUICK = {
  pax: [
    [
      'Three wide',
      [
        [100, 236],
        [100, 236],
        [100, 236]
      ]
    ],
    [
      'Wide · narrow · wide',
      [
        [100, 236],
        [50, 236],
        [100, 236]
      ]
    ],
    [
      'Two 75s',
      [
        [75, 236],
        [75, 236]
      ]
    ],
    [
      'Under a low ceiling',
      [
        [100, 201],
        [100, 201]
      ]
    ]
  ],
  metod: [
    ['Small kitchen', { base: [60, 60, 60], wall: [60, 60, 60] }],
    ['With a tall cabinet', { high: [60], base: [40, 60, 80], wall: [40, 60, 80] }],
    ['Long run', { base: [60, 40, 60, 80, 60], wall: [60, 40, 60, 80, 60] }]
  ],
  besta: [
    [
      'TV bench',
      [
        [60, 38, 'drawers'],
        [60, 38, 'drawers'],
        [60, 38, 'drawers']
      ]
    ],
    [
      'Low sideboard',
      [
        [120, 64],
        [120, 64]
      ]
    ],
    [
      'Tall wall',
      [
        [60, 192],
        [60, 192],
        [60, 192]
      ]
    ]
  ]
};
function quickMake(q) {
  if (Array.isArray(q)) return q.map(([w, h, lay]) => cab(S.sys, 'frame', w, h, lay));
  const out = [];
  ['high', 'base', 'wall'].forEach(k =>
    (q[k] || []).forEach(w =>
      out.push(cab('metod', k, w, SYS.metod.kinds[k].heights[k === 'high' ? 1 : k === 'wall' ? 2 : 0]))
    )
  );
  return out;
}
/* "100 50 100" or "2x100 50" → widths, each snapped to the nearest IKEA width */
function parseWidths(txt, widths) {
  const out = [];
  String(txt || '')
    .replace(/,/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .forEach(t => {
      const m = t.match(/^(?:(\d+)\s*[x×*])?(\d{2,3})$/i);
      if (!m) return;
      const n = Math.min(12, +(m[1] || 1)),
        w = widths.reduce((b, v) => (Math.abs(v - +m[2]) < Math.abs(b - +m[2]) ? v : b), widths[0]);
      for (let i = 0; i < n; i++) out.push(w);
    });
  return out;
}
function cabsHTML() {
  const sysBtns = Object.entries(SYS)
    .map(
      ([k, s]) =>
        `<button type="button" class="sys ${k === S.sys ? 'on' : ''}" data-act="sys" data-a="${k}"><b>${s.name}</b><span>${s.what}</span></button>`
    )
    .join('');
  const kinds = SYS[S.sys].kinds,
    qh =
      S.qh && kinds.frame && kinds.frame.heights.includes(S.qh)
        ? S.qh
        : kinds.frame
          ? kinds.frame.heights[S.sys === 'pax' ? 1 : 1]
          : 80;
  const quick = QUICK[S.sys]
    .map(
      (q, n) =>
        `<button type="button" class="qk" data-act="quick" data-a="${n}"><b>${q[0]}</b><small>${quickWords(q[1])}</small></button>`
    )
    .join('');
  const typeRow =
    S.sys === 'metod'
      ? `<label class="field"><span>Base cabinets, left to right</span><input id="twBase" inputmode="numeric" placeholder="60 40 80" value="${esc(S.twBase || '')}"></label><label class="field"><span>Wall cabinets, left to right</span><input id="twWall" inputmode="numeric" placeholder="60 40 80" value="${esc(S.twWall || '')}"></label>`
      : `<label class="field"><span>Widths in cm, left to right</span><input id="twFrame" inputmode="numeric" placeholder="${S.sys === 'pax' ? '100 50 100' : '60 120 60'}" value="${esc(S.twFrame || '')}"></label><div class="row"><label>Height</label>${seg(
          'qh',
          qh,
          kinds.frame.heights.map(v => [v, v])
        )}</div>`;
  const addRows = Object.entries(kinds)
    .map(
      ([k, kd]) =>
        `<div class="row"><label>${S.sys === 'metod' ? kd.label.replace(' cabinet', '') : 'Add'}</label><div class="chips">${kd.widths.map(w => `<button type="button" class="btn sm" data-act="addw" data-a="${k}|${w}">+ ${w}</button>`).join('')}</div></div>`
    )
    .join('');
  const card = (c, n) => {
    const kd = kinds[c.kind];
    return `<div class="cab"><div class="cabh"><b>${n + 1}</b><span>${S.sys === 'metod' ? kd.label : SYS[S.sys].name + ' frame'} · ${c.w}${kd.heights.length > 1 ? ' × ' + c.h : ''}</span><span class="sp"></span><button type="button" class="ib" data-act="mv" data-a="${c.id}|-1" aria-label="Move left">◀</button><button type="button" class="ib" data-act="mv" data-a="${c.id}|1" aria-label="Move right">▶</button><button type="button" class="ib" data-act="del" data-a="${c.id}" aria-label="Remove">✕</button></div>
      <div class="row"><label>Width</label>${segC(
        'cw',
        c,
        c.w,
        kd.widths.map(v => [v, v])
      )}</div>
      ${
        kd.heights.length > 1
          ? `<div class="row"><label>Height</label>${segC(
              'ch',
              c,
              c.h,
              kd.heights.map(v => [v, v])
            )}</div>`
          : ''
      }
      <div class="row"><label>Fronts</label>${segC(
        'cl',
        c,
        c.layout,
        layoutsFor(c).map(([k, l]) => [k, l])
      )}</div></div>`;
  };
  return `<h2>What do you have?</h2><p class="lede">Pick your IKEA system and set up your cabinets the quickest way for you.</p>
    <div class="syss">${sysBtns}</div>
    <h3>Start from a common layout</h3><div class="qks">${quick}</div>
    <h3>Or type your widths</h3>${typeRow}<div class="adds"><button type="button" class="btn pri" data-act="typed">Make these cabinets</button></div>
    <h3>Or add one at a time</h3>${addRows}
    <h3>Your cabinets, left to right</h3>
    <div class="cabs">${S.cabs.map(card).join('') || '<p class="hint">No cabinets yet.</p>'}</div>
    <details class="imp"${S.impOpen ? ' open' : ''}><summary>Have an IKEA planner list? Paste it</summary>
      <p class="hint">Copy the item list from the IKEA planner (or your order confirmation) and paste it here. Frames and cabinets are picked up with their sizes; doors, hinges and legs are skipped.</p>
      <textarea id="impText" rows="6" placeholder="PAX Wardrobe frame, white, 100x58x236 cm   2 pcs">${esc(S.impText || '')}</textarea>
      <div class="adds"><button type="button" class="btn pri" data-act="imp">Read the list</button><button type="button" class="btn" data-act="impEx">Try an example</button></div>
      ${S.impMsg ? `<p class="hint">${S.impMsg}</p>` : ''}</details>`;
}
function quickWords(q) {
  if (Array.isArray(q)) return q.map(x => x[0]).join(' + ') + (q[0][1] ? ` · ${q[0][1]} high` : '');
  return ['high', 'base', 'wall']
    .filter(k => q[k])
    .map(k => `${q[k].length} ${k === 'high' ? 'tall' : k}`)
    .join(' · ');
}

/* ---------- 2 Fronts ---------- */
/* the look editor: for all fronts (target "all") or for one front (its id) */
function lookEdHTML(target, lk) {
  const t = target;
  const styles = Object.entries(STYLES)
    .map(([k, s]) => {
      const ok = matOk(k, lk.mat) || !MATS[lk.mat].only;
      return `<button type="button" class="stc ${k === lk.style ? 'on' : ''}" data-act="lk" data-a="${t}|style|${k}" ${ok ? '' : 'disabled'}>${lookThumb(k, lk.mat === 'glass' && k === 'flat' ? 'painted' : lk.mat, lk.col, t + k)}<b>${s.name}</b><small>${s.blurb}</small></button>`;
    })
    .join('');
  const mats = Object.entries(MATS)
    .map(([k, m]) => {
      const sw = m.paint ? colHex(lk.col) : m.glass ? '#cfdcd8' : m.wood;
      return `<button type="button" class="mat ${k === lk.mat ? 'on' : ''}" data-act="lk" data-a="${t}|mat|${k}"><i class="sw${m.glass ? ' gl' : ''}" style="background:${sw}"></i><b>${m.name}</b>${m.budget ? '<em class="tag">Budget</em>' : ''}<small>${m.blurb} · from ${eur(m.rate * (m.glass ? 1 : 1))}/m²</small></button>`;
    })
    .join('');
  const cols = MATS[lk.mat].paint
    ? `<h3>Colour</h3><div class="sws">${Object.entries(COLOURS)
        .map(
          ([k, c]) =>
            `<button type="button" class="swb ${k === lk.col ? 'on' : ''}" data-act="lk" data-a="${t}|col|${k}" title="${esc(c.name)} · RAL ${c.ral}" style="background:${colHex(k)}"><span>${esc(c.name)}</span></button>`
        )
        .join(
          ''
        )}</div><p class="hint">${esc(COLOURS[lk.col].name)} is RAL ${COLOURS[lk.col].ral} ${esc((RAL[COLOURS[lk.col].ral] || {}).name || '')}, so any paint shop can match it later.</p>`
    : '';
  return `<h3>Style</h3><div class="stcs two">${styles}</div><h3>Material</h3><p class="hint">Fluted and grooved fronts are routed into MDF, so wood and plywood come flat.</p><div class="mats">${mats}</div>${cols}`;
}
function frontsHTML(L) {
  let h = `<h2>Your fronts</h2><p class="lede">19 mm thick, made to the exact IKEA sizes and drilled for the IKEA hinges you already have. Choose one look for all of them, then tap any front in the picture to give it its own.</p>
    <div class="adds"><button type="button" class="btn surp" data-act="surprise">✨ Surprise me</button>${S.recipe ? `<span class="hint">${esc(S.recipe)}: ${esc(S.recipeSay || '')} — tap again for another idea</span>` : ''}</div>`;
  const f = S.sel && L.fronts.find(x => x.id === S.sel);
  if (f) {
    const lk = lookOf(f),
      c = S.cabs.find(x => x.id === f.cab),
      n = S.cabs.indexOf(c) + 1,
      sib = L.fronts.filter(x => x.cab === f.cab).length;
    h += `<div class="selcard"><div class="cabh"><b>${n}</b><span><strong>This ${f.kind === 'door' ? 'door' : 'drawer front'}</strong> · ${f1(f.w)} × ${f1(f.h)} mm</span><span class="sp"></span><button type="button" class="ib" data-act="desel" aria-label="Done">✕</button></div>
      ${seg('own', lk.own ? 'own' : 'same', [
        ['same', 'Same as the rest'],
        ['own', 'Its own look']
      ])}
      ${lk.own ? lookEdHTML(f.id, lk) : ''}
      <div class="adds">${lk.own && sib > 1 ? `<button type="button" class="btn sm" data-act="copycab">Same for the whole cabinet</button>` : ''}${f.hinge ? `<button type="button" class="btn sm" data-act="flip">Hinge ${f.hinge === 'L' ? 'left' : 'right'} → swap</button>` : ''}</div></div>`;
  }
  const all = { style: S.style, mat: S.mat, col: S.col };
  h += `<h3 class="big">${f ? 'All the other fronts' : 'All fronts'}</h3>${lookEdHTML('all', all)}`;
  const used = st => L.fronts.some(x => lookOf(x).style === st || (st === 'fluted' && MATS[lookOf(x).mat].glass)),
    anyFluted = used('fluted'),
    anyGrooves = used('grooves'),
    anyGlass = L.fronts.some(x => MATS[lookOf(x).mat].glass);
  if (anyFluted || anyGrooves)
    h += `<h3>${anyFluted && anyGrooves ? 'Flutes and grooves' : anyFluted ? 'Flutes' : 'Grooves'}</h3>${
      anyFluted
        ? `<div class="row"><label>Flutes</label>${seg(
            'pitch',
            S.flute.pitch,
            FLUTE.pitch.map(([v, l]) => [v, `${l} <small>${v} mm</small>`])
          )}</div>`
        : ''
    }${
      anyGrooves
        ? `<div class="row"><label>Grooves</label>${seg(
            'gpitch',
            S.flute.gpitch,
            FLUTE.gpitch.map(([v, l]) => [v, `${l} <small>${v} mm</small>`])
          )}</div>`
        : ''
    }<div class="row"><label>Run</label>${seg('fdir', S.flute.dir, FLUTE.dir)}</div>`;
  if (anyGlass)
    h += `<h3>Glass frame</h3>${seg(
      'gframe',
      S.gframe,
      Object.entries(GFRAME).map(([k, g]) => [k, g.name])
    )}`;
  return h;
}

/* ---------- 3 Handles ---------- */
function handlesHTML(L) {
  const hs = Object.entries(HANDLES)
    .map(
      ([k, h]) =>
        `<button type="button" class="mat ${k === S.handle ? 'on' : ''}" data-act="handle" data-a="${k}"><b>${h.name}</b><small>${h.blurb} · ${eur(h.price)} a front</small></button>`
    )
    .join('');
  const fins =
    S.handle === 'knob' || S.handle === 'bar' || S.handle === 'tab'
      ? `<h3>Finish</h3>${seg(
          'hfin',
          S.hfin,
          Object.entries(HFIN)
            .filter(([k]) => S.handle !== 'tab' || k !== 'steel')
            .map(([k, f]) => [k, f.name])
        )}`
      : '';
  const f = S.sel && L.fronts.find(x => x.id === S.sel);
  const doors = L.fronts.filter(x => x.hinge).length;
  return `<h2>Handles</h2><p class="lede">The same handle on every front. Doors get it on the side that opens, drawers in the middle.</p>
    <div class="mats">${hs}</div>${fins}
    ${doors ? `<h3>Hinge sides</h3>${f && f.hinge ? `<div class="selcard"><b>This door</b> hinges on the ${f.hinge === 'L' ? 'left' : 'right'}. <button type="button" class="btn sm" data-act="flip">Swap to the ${f.hinge === 'L' ? 'right' : 'left'}</button></div>` : '<p class="hint">Tap a door in the picture to swap the side it hinges on — the handle moves with it.</p>'}${Object.keys(S.flip).length ? `<button type="button" class="linkb" data-act="unflip">Put all doors back</button>` : ''}` : ''}`;
}

/* ---------- 4 Order ---------- */
function orderHTML(L, P) {
  const g = grouped(L);
  let last = '';
  const rows = g
    .map(r => {
      const key = lookKey(r.look),
        head =
          key !== last
            ? `<tr class="lkh"><td colspan="4"><i class="sw${MATS[r.look.mat].glass ? ' gl' : ''}" style="background:${faceHex(r.look)}"></i>${esc(lookName(r.look))}</td></tr>`
            : '';
      last = key;
      return `${head}<tr><td>${r.n}×</td><td>${r.kind === 'door' ? 'Door' + (r.hinge ? ` <small>hinge ${r.hinge === 'L' ? 'left' : 'right'}</small>` : '') : 'Drawer front'}</td><td class="num">${f1(r.w)} × ${f1(r.h)}<small>IKEA ${r.nom}</small></td><td class="num">${eur(r.p * r.n)}</td></tr>`;
    })
    .join('');
  return `<h2>Your order</h2><p class="lede">${P.n} fronts with ${esc(HANDLES[S.handle].name.toLowerCase())}${S.handle === 'push' ? ' latches' : S.handle === 'grip' ? 's' : 's in ' + esc(HFIN[S.hfin].name.toLowerCase())}. Made to measure and drilled for your IKEA hinges; ready ${leadOf(L)} after you order${L.fronts.some(f => MATS[lookOf(f).mat].paint) ? ' (painted fronts take 1–2 weeks longer: they go to our spray shop)' : ''}.</p>
    ${
      P.n
        ? `<table class="ord"><thead><tr><th></th><th>Front</th><th class="num">Size, mm</th><th class="num">Price</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td></td><td colspan="2">Fronts</td><td class="num">${eur(P.sub)}</td></tr><tr><td></td><td colspan="2">Delivery${P.del ? ` <small>free from ${eur(PRICE.deliveryFree)}</small>` : ' — free'}</td><td class="num">${P.del ? eur(P.del) : '€ 0'}</td></tr><tr class="tot"><td></td><td colspan="2">Total incl. VAT</td><td class="num">${eur(P.total)}</td></tr></tfoot></table>
    <button type="button" class="btn pri big" data-act="orderNow">Order these fronts</button>`
        : '<p class="hint">Add a cabinet with fronts first.</p>'
    }
    <p class="hint">Keep your IKEA frames, hinges and drawers — only the fronts change. Hinges and drawer fittings are not included.${L.fronts.some(f => MATS[lookOf(f).mat].budget) ? ' Raw MDF and untreated ply come sanded and unfinished: paint, oil or wax them before you hang them.' : ''}</p>`;
}

/* ---------- order form (prototype: nothing is sent) ---------- */
function openOrder() {
  const L = layout(),
    P = priceAll(L);
  if (!P.n) return;
  document.getElementById('mbox').innerHTML =
    `<h2>Order your fronts</h2><p class="lede">${P.n} fronts · <b>${eur(P.total)}</b> incl. VAT and delivery. We check every size with you before we cut.</p>
    <label class="field"><span>Your name</span><input id="oName" autocomplete="name"></label>
    <label class="field"><span>E-mail</span><input id="oMail" type="email" autocomplete="email"></label>
    <label class="field"><span>Postcode</span><input id="oZip" autocomplete="postal-code"></label>
    <label class="field"><span>Anything we should know?</span><textarea id="oNote" rows="3" placeholder="e.g. the left wall is not straight"></textarea></label>
    <div class="adds"><button type="button" class="btn pri" data-act="send">Send order request</button><button type="button" class="btn" data-act="close">Not now</button></div>
    <p class="hint">This is a prototype: the request is not sent anywhere yet.</p>`;
  document.getElementById('modal').hidden = false;
  setTimeout(() => document.getElementById('oName').focus(), 30);
}
function orderText() {
  const L = layout(),
    P = priceAll(L);
  return [
    `BRUIS Fronts — order request (${SYS[S.sys].name})`,
    `Handles: ${HANDLES[S.handle].name}${S.handle === 'knob' || S.handle === 'bar' || S.handle === 'tab' ? ', ' + HFIN[S.hfin].name : ''}${L.fronts.some(f => lookOf(f).style === 'fluted') ? ` · flutes ${S.flute.pitch} mm, ${S.flute.dir === 'v' ? 'vertical' : 'horizontal'}` : ''}${L.fronts.some(f => lookOf(f).style === 'grooves') ? ` · grooves every ${S.flute.gpitch} mm, ${S.flute.dir === 'v' ? 'vertical' : 'horizontal'}` : ''}${L.fronts.some(f => MATS[lookOf(f).mat].glass) ? ` · glass frame ${GFRAME[S.gframe].name.toLowerCase()}` : ''}`,
    '',
    ...grouped(L).map(
      r =>
        `${r.n} × ${r.kind === 'door' ? 'door' : 'drawer front'} ${f1(r.w)} × ${f1(r.h)} mm (IKEA ${r.nom})${r.hinge ? ', hinge ' + (r.hinge === 'L' ? 'left' : 'right') : ''} — ${lookName(r.look)}${MATS[r.look.mat].paint ? ' (RAL ' + COLOURS[r.look.col].ral + ')' : ''}`
    ),
    '',
    `Total ${eur(P.total)} incl. VAT${P.del ? ' and delivery' : ''}`
  ].join('\n');
}
function sendOrder() {
  const v = id => (document.getElementById(id).value || '').trim();
  if (!v('oName') || !/.+@.+\..+/.test(v('oMail'))) {
    document.querySelector('#mbox .hint').textContent = 'Please fill in your name and a valid e-mail address.';
    return;
  }
  const txt = orderText() + `\n\nFrom: ${v('oName')} <${v('oMail')}>, ${v('oZip')}\n${v('oNote')}`;
  try {
    const all = JSON.parse(localStorage.getItem('bruis-fronts-orders') || '[]');
    all.push({ at: Date.now(), txt });
    localStorage.setItem('bruis-fronts-orders', JSON.stringify(all));
  } catch (e) {
    /* fine */
  }
  document.getElementById('mbox').innerHTML =
    `<h2>Thank you, ${esc(v('oName').split(' ')[0])}!</h2><p class="lede">In the real shop BRUIS would now e-mail you to check the sizes and send a payment link. In this prototype nothing was sent — here is the order as text:</p><pre class="otext">${esc(txt)}</pre><div class="adds"><button type="button" class="btn pri" data-act="copyOrder">Copy</button><button type="button" class="btn" data-act="close">Close</button></div>`;
  S.lastOrder = txt;
  save();
}

/* ---------- a look change, for all fronts or for one ---------- */
/* fluted or grooves picked on wood: budget ply goes to raw MDF, the rest to painted */
const mdfFor = mat => (MATS[mat] && MATS[mat].budget ? 'rawmdf' : 'painted');
function setLook(target, field, val) {
  if (target === 'all') {
    S[field] = val;
    if (field === 'mat' && !matOk(S.style, val)) S.style = MATS[val].only || 'flat';
    if (field === 'style' && !matOk(val, S.mat)) S.mat = mdfFor(S.mat);
    S.recipe = null;
    return;
  }
  const cur = lookOf({ id: target }),
    nx = { style: cur.style, mat: cur.mat, col: cur.col };
  nx[field] = val;
  if (field === 'mat' && !matOk(nx.style, val)) nx.style = MATS[val].only || 'flat';
  if (field === 'style' && !matOk(val, nx.mat)) nx.mat = mdfFor(nx.mat);
  S.fx[target] = nx;
}

/* ---------- taps ---------- */
document.addEventListener('click', e => {
  const fr = e.target.closest('#pic .front');
  if (fr) {
    selectFront(fr.dataset.f);
    return;
  }
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const a = b.dataset.a || '',
    [id, val] = a.split('|'),
    c = S.cabs.find(x => x.id === id);
  switch (b.dataset.act) {
    case 'step':
      S.step = a;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'next': {
      const i = STEPS.findIndex(s => s[0] === S.step);
      S.step = STEPS[Math.min(STEPS.length - 1, i + 1)][0];
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    }
    case 'view':
      S.view = a;
      break;
    case 'surprise':
      surprise();
      if (S.step === 'cabs') S.step = 'fronts';
      break;
    case 'sys':
      if (a !== S.sys) {
        // another system starts from an example row of its cabinets; the look you chose stays
        const keep = {
          style: S.style,
          flute: S.flute,
          mat: S.mat,
          col: S.col,
          gframe: S.gframe,
          handle: S.handle,
          hfin: S.hfin,
          view: S.view
        };
        S = Object.assign(freshState(a), keep, { step: 'cabs' });
      }
      break;
    case 'quick':
      S.cabs = quickMake(QUICK[S.sys][+a][1]);
      S.flip = {};
      S.fx = {};
      break;
    case 'qh':
      S.qh = +a;
      break;
    case 'typed': {
      const kinds = SYS[S.sys].kinds,
        got = [];
      if (S.sys === 'metod') {
        S.twBase = document.getElementById('twBase').value;
        S.twWall = document.getElementById('twWall').value;
        parseWidths(S.twBase, kinds.base.widths).forEach(w => got.push(cab('metod', 'base', w, 80)));
        parseWidths(S.twWall, kinds.wall.widths).forEach(w => got.push(cab('metod', 'wall', w, 80)));
        // keep the tall cabinets you already had
        S.cabs.filter(x => x.kind === 'high').forEach(x => got.unshift(x));
      } else {
        S.twFrame = document.getElementById('twFrame').value;
        const h = S.qh && kinds.frame.heights.includes(S.qh) ? S.qh : kinds.frame.heights[1];
        parseWidths(S.twFrame, kinds.frame.widths).forEach(w => got.push(cab(S.sys, 'frame', w, h)));
      }
      if (got.length) {
        S.cabs = got;
        S.flip = {};
        S.fx = {};
      }
      break;
    }
    case 'addw': {
      const kd = SYS[S.sys].kinds[id],
        h =
          kd.heights.length === 1
            ? kd.heights[0]
            : S.sys === 'metod'
              ? kd.heights[id === 'wall' ? 2 : 1]
              : S.qh && kd.heights.includes(S.qh)
                ? S.qh
                : kd.heights[1];
      S.cabs.push(cab(S.sys, id, +val, h));
      break;
    }
    case 'cw':
      if (c) {
        c.w = +val;
        fixLayout(c);
      }
      break;
    case 'ch':
      if (c) {
        c.h = +val;
        fixLayout(c);
      }
      break;
    case 'cl':
      if (c) c.layout = val;
      break;
    case 'mv': {
      const i = S.cabs.indexOf(c),
        j = i + +val;
      if (c && j >= 0 && j < S.cabs.length) [S.cabs[i], S.cabs[j]] = [S.cabs[j], S.cabs[i]];
      break;
    }
    case 'del':
      S.cabs = S.cabs.filter(x => x !== c);
      break;
    case 'impEx':
      S.impText = IMPORT_EXAMPLE;
      S.impOpen = true;
      S.impMsg = '';
      break;
    case 'imp': {
      const t = document.getElementById('impText').value;
      S.impText = t;
      S.impOpen = true;
      const r = parsePlanner(t);
      if (!r.found.length) {
        S.impMsg =
          'No PAX, METOD or BESTÅ frames found in that list. Each line needs the name and a size like 60x60x80 cm.';
        break;
      }
      const bySys = {};
      r.found.forEach(x => (bySys[x.sys] = (bySys[x.sys] || 0) + 1));
      const main = Object.entries(bySys).sort((p, q) => q[1] - p[1])[0][0];
      S.sys = main;
      S.cabs = r.found.filter(x => x.sys === main);
      S.flip = {};
      S.fx = {};
      const other = Object.entries(bySys).filter(([k]) => k !== main);
      S.impMsg = `Found ${S.cabs.length} ${SYS[main].name} cabinet${S.cabs.length === 1 ? '' : 's'}.${other.length ? ` The list also has ${other.map(([k, n]) => `${n} ${SYS[k].name}`).join(' and ')} — one system per order for now; switch above to do those next.` : ''}${r.skipped.length ? ` Skipped ${r.skipped.length} line${r.skipped.length === 1 ? '' : 's'} that are not frames.` : ''}`;
      break;
    }
    case 'lk': {
      const [t, field, v] = a.split('|');
      setLook(t, field, v);
      break;
    }
    case 'own':
      if (S.sel) {
        if (a === 'same') delete S.fx[S.sel];
        else S.fx[S.sel] = { style: S.style, mat: S.mat, col: S.col };
      }
      break;
    case 'copycab': {
      const L = layout(),
        f = L.fronts.find(x => x.id === S.sel);
      if (f && S.fx[f.id])
        L.fronts.filter(x => x.cab === f.cab).forEach(x => (S.fx[x.id] = Object.assign({}, S.fx[f.id])));
      break;
    }
    case 'desel':
      S.sel = null;
      break;
    case 'flip':
      if (S.sel) {
        if (S.flip[S.sel]) delete S.flip[S.sel];
        else S.flip[S.sel] = 1;
      }
      break;
    case 'unflip':
      S.flip = {};
      break;
    case 'pitch':
      S.flute.pitch = +a;
      break;
    case 'gpitch':
      S.flute.gpitch = +a;
      break;
    case 'fdir':
      S.flute.dir = a;
      break;
    case 'gframe':
      S.gframe = a;
      break;
    case 'handle':
      S.handle = a;
      if (a === 'tab' && S.hfin === 'steel') S.hfin = 'black';
      break;
    case 'hfin':
      S.hfin = a;
      break;
    case 'orderNow':
      openOrder();
      return;
    case 'send':
      sendOrder();
      return;
    case 'copyOrder':
      try {
        navigator.clipboard.writeText(S.lastOrder || orderText());
        b.textContent = 'Copied';
      } catch (er) {
        /* ignore */
      }
      return;
    case 'close':
      document.getElementById('modal').hidden = true;
      return;
    default:
      return;
  }
  render();
});
document.addEventListener(
  'toggle',
  e => {
    if (e.target.classList && e.target.classList.contains('imp')) S.impOpen = e.target.open;
  },
  true
);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('modal').hidden = true;
  if (e.key === 'Enter' && e.target && /^tw/.test(e.target.id)) document.querySelector('[data-act=typed]').click();
});
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') e.currentTarget.hidden = true;
});
