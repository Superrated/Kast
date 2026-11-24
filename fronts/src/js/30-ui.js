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
  // the landing page: everything else waits; the render still starts, so the pictures can be made
  const home = S.step === 'home';
  document.getElementById('home').hidden = !home;
  document.getElementById('app').dataset.step = S.step;
  if (home) {
    document.getElementById('home').innerHTML = homeHTML();
    if (!V3.failed) open3D();
    return;
  }
  // the picture: a still render of a room; the flat drawing only when 3D can't run
  const v3 = !V3.failed;
  document.getElementById('pic').hidden = v3;
  document.getElementById('pic3d').hidden = !v3;
  if (v3) open3D();
  else drawPic();
  // the caption under the picture: what it shows, a hint, and Surprise me
  document.getElementById('stagebar').innerHTML =
    `<p class="cap"><b>${SYS[S.sys].name} ${SYS[S.sys].what.toLowerCase()}</b>, ${countWords(P).replace(' + ', ' and ')}${S.recipe ? `. ${esc(S.recipeSay || S.recipe)}` : S.demo ? `. ${esc(S.demo)}` : ''}<span>${L.fronts.length ? (S.view === 'close' ? 'A close-up of one front. Pick another in the room view' : 'Tap a front to give it its own look') : ''}</span></p>${
      v3 && L.fronts.length
        ? `<div class="vseg" role="group" aria-label="View">${[
            ['room', 'Room'],
            ['close', 'Close-up']
          ]
            .map(
              ([k, n]) =>
                `<button type="button" data-act="view" data-a="${k}" aria-pressed="${S.view === k}" class="${S.view === k ? 'on' : ''}">${n}</button>`
            )
            .join('')}</div>`
        : ''
    }<button type="button" class="lnk surp" data-act="surprise">Surprise me</button>`;
  document.getElementById('pbar').innerHTML =
    `${chipHTML()}<div class="ptot"><span>${countWords(P)} · incl. VAT${P.del ? ' + delivery' : ''}</span><b>${eur(P.total)}</b></div>${
      S.step === 'order'
        ? ''
        : `<button type="button" class="btn ghost" data-act="next">${i < STEPS.length - 2 ? 'Next: ' + STEPS[i + 1][1] : 'See the order'}</button>`
    }<button type="button" class="btn pri" data-act="orderNow" ${P.n ? '' : 'disabled'}>Order</button>`;
  document.getElementById('panel').innerHTML = {
    cabs: cabsHTML,
    fronts: frontsHTML,
    handles: handlesHTML,
    order: orderHTML
  }[S.step](L, P);
  document.getElementById('app').dataset.step = S.step;
}
/* "oak knobs", "walnut handles", "finger holes" */
function handleWords() {
  return S.handle === 'hole'
    ? 'finger holes'
    : `${HFIN[S.hfin].name.toLowerCase()} ${S.handle === 'bar' ? 'handles' : 'knobs'}`;
}
/* the paint chip in the price bar: the main look as a sample, with its name and code */
function chipHTML() {
  const lk = lookOf(null),
    m = MATS[lk.mat],
    hex = m.glass ? '#cfdcd8' : faceHex(lk),
    name = m.paint ? COLOURS[lk.col].name : m.name,
    sub = m.paint
      ? `RAL ${COLOURS[lk.col].ral}, ${STYLES[lk.style].name}`
      : m.oil
        ? `${STYLES[lk.style].name}, ${OILS[lk.oil].name} oil`
        : STYLES[lk.style].name;
  return `<div class="pchip" title="${esc(lookName(lk))}"><i style="background:${hex}"></i><span><b>${esc(name)}</b><small>${esc(sub)}</small></span></div>`;
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
      ],
      'Six doors, the classic wall of wardrobes'
    ],
    [
      'Open in the middle',
      [
        [100, 236],
        [50, 236, 'open'],
        [100, 236]
      ],
      'Open shelves between two wide frames'
    ],
    [
      'Wide, narrow, wide',
      [
        [100, 236],
        [50, 236],
        [100, 236]
      ],
      'Five doors with a slim one in the middle'
    ],
    [
      'Two 75s',
      [
        [75, 236],
        [75, 236]
      ],
      'A wide and a narrow door per frame'
    ],
    [
      'Under a low ceiling',
      [
        [100, 201],
        [75, 201],
        [100, 201]
      ],
      'The 201 cm frames, for attics and eaves'
    ]
  ],
  metod: [
    [
      'Small kitchen',
      {
        base: [
          [60, 'drawers3'],
          [60, 'door'],
          [60, 'drawer_door']
        ],
        wall: [60, 60, 60]
      },
      'Drawers, a sink and a cooker under three wall cabinets'
    ],
    [
      'With a fridge',
      {
        high: [[60, 'split']],
        base: [
          [40, 'drawers4'],
          [60, 'door'],
          [80, 'doors2']
        ],
        wall: [40, 60, [80, 'doors2']]
      },
      'A tall fridge cabinet at the end of the run'
    ],
    [
      'Long run',
      {
        base: [
          [60, 'drawers3'],
          [40, 'door'],
          [60, 'drawer_door'],
          [80, 'doors2'],
          [60, 'drawers2']
        ],
        wall: [60, 40, 60, [80, 'doors2'], 60]
      },
      'Five base and five wall cabinets, plenty of drawers'
    ],
    [
      'Pantry wall',
      {
        high: [
          [60, 'split'],
          [40, 'door'],
          [60, 'split']
        ]
      },
      'Three tall cabinets, floor to ceiling'
    ],
    [
      'All drawers',
      {
        base: [
          [80, 'drawers3'],
          [60, 'drawers4'],
          [80, 'drawers3']
        ]
      },
      'A run of drawers, for an island or a long wall'
    ]
  ],
  besta: [
    [
      'TV bench',
      [
        [60, 38, 'drawers'],
        [60, 38, 'drawers'],
        [60, 38, 'drawers']
      ],
      'Three low drawers, 180 cm wide'
    ],
    [
      'Low sideboard',
      [
        [120, 64, 'drawers'],
        [120, 64]
      ],
      'Drawers next to two doors'
    ],
    [
      'Media wall',
      [
        [60, 192],
        [120, 38, 'drawers'],
        [60, 192]
      ],
      'Two tall frames around a TV bench'
    ],
    [
      'Tall wall',
      [
        [60, 192],
        [60, 192],
        [60, 192]
      ],
      'Nine doors, floor to shoulder'
    ],
    [
      'Hallway',
      [
        [120, 38, 'drawers'],
        [60, 38, 'drawers']
      ],
      'Shallow drawers for keys and shoes'
    ]
  ]
};
function quickMake(q, sys) {
  sys = sys || S.sys;
  const mk = (kind, w, h, lay) => {
    const c = cab(sys, kind, w, h, lay);
    fixLayout(c);
    return c;
  };
  if (Array.isArray(q)) return q.map(([w, h, lay]) => mk('frame', w, h, lay));
  const out = [];
  ['high', 'base', 'wall'].forEach(k =>
    (q[k] || []).forEach(e => {
      const [w, lay] = Array.isArray(e) ? e : [e];
      out.push(mk(k, w, SYS.metod.kinds[k].heights[k === 'high' ? 1 : k === 'wall' ? 2 : 0], lay));
    })
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
        `<button type="button" class="tile" data-act="quick" data-a="${n}"><span class="tpic">${(st => thumbHTML('q' + S.sys + n, st, designThumb('q' + S.sys + n, st)))({ sys: S.sys, cabs: quickMake(q[1]), fx: {}, sides: 'none' })}</span><b>${q[0]}</b><small>${esc(q[2] || quickWords(q[1]))}</small></button>`
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
  const addRow = `<div class="addrow"><span>Add</span>${Object.entries(kinds)
    .map(([k, kd]) =>
      kd.widths
        .map(
          w =>
            `<button type="button" class="btn sm" data-act="addw" data-a="${k}|${w}">+ ${S.sys === 'metod' ? kd.label.replace(' cabinet', '').toLowerCase() + ' ' : ''}${w}</button>`
        )
        .join('')
    )
    .join('')}</div>`;
  const card = (c, n) => {
    const kd = kinds[c.kind];
    const ln = layoutsFor(c).find(x => x[0] === c.layout),
      open = S.openCab === c.id || S.cabs.length <= 2;
    return `<details class="cab" data-c="${c.id}"${open ? ' open' : ''}><summary class="cabh"><b>${n + 1}</b><span>${S.sys === 'metod' ? kd.label : SYS[S.sys].name + ' frame'} · ${c.w}${kd.heights.length > 1 ? ' × ' + c.h : ''}<small>${ln ? esc(ln[1]) : ''}</small></span><span class="sp"></span><button type="button" class="ib" data-act="mv" data-a="${c.id}|-1" aria-label="Move left">◀</button><button type="button" class="ib" data-act="mv" data-a="${c.id}|1" aria-label="Move right">▶</button><button type="button" class="ib" data-act="del" data-a="${c.id}" aria-label="Remove">✕</button></summary>
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
      )}</div></details>`;
  };
  const how = `<details class="how"${S.howOpen ? ' open' : ''}><summary>Where do I find my IKEA list?</summary><ol>
      <li><b>IKEA planner</b> (PAX, kitchen or BESTÅ): open your design, go to the <b>shopping list</b> or <b>item list</b>, select all of it and copy.</li>
      <li><b>Cart or order confirmation</b> (website, app or e-mail): select the products and copy.</li>
      <li>Paste it here. Prices, article numbers and the other products don’t matter — only the cabinets are picked up, in any language IKEA uses here (EN, NL, FR, DE).</li></ol>
      <p class="hint">Only have a PDF? Open it, select all and copy — or type your widths below.</p></details>`;
  return `<h2>Your IKEA cabinets</h2><p class="lede">Paste the list from the IKEA planner and we set everything up for you. No list? Start from a layout below.</p>
    <div class="impcard">
      <div class="imphead"><b>Paste your IKEA list</b><span class="sp"></span><button type="button" class="btn sm pri" data-act="impPaste">Paste</button></div>
      <textarea id="impText" rows="5" spellcheck="false" placeholder="PAX Wardrobe frame, white, 100x58x236 cm   2 pcs&#10;METOD Base cabinet with 3 drawers, 60x60x80 cm   1">${esc(S.impText || '')}</textarea>
      <div class="impsub"><label class="lnk file">Open a file<input type="file" id="impFile" accept=".txt,.csv,.tsv,text/plain"></label>${S.impText ? '<button type="button" class="lnk" data-act="impClear">Clear</button>' : ''}</div>
      ${S.impMsg ? `<p class="impok">${S.impMsg}</p>` : `<div id="impPrev" class="impprev" aria-live="polite">${impPreviewHTML(S.impText)}</div>`}
      ${how}
    </div>
    <div class="or"><span>no list? start here</span></div>
    <h3>Open a demo</h3>${demosHTML()}
    <h3>Or start from your own cabinets</h3>
    <div class="syss">${sysBtns}</div>
    <h3>A common layout</h3><div class="tiles">${quick}</div>
    <h3>Or type your widths</h3>${typeRow}<div class="adds"><button type="button" class="btn" data-act="typed">Make these cabinets</button></div>
    <h3 id="yourCabs">Your cabinets, left to right · ${S.cabs.length}</h3>
    <div class="cabs">${S.cabs.map(card).join('') || '<p class="hint">No cabinets yet.</p>'}</div>
    ${addRow}`;
}
function quickWords(q) {
  if (Array.isArray(q)) return q.map(x => x[0]).join(' + ') + (q[0][1] ? ` · ${q[0][1]} high` : '');
  return ['high', 'base', 'wall']
    .filter(k => q[k])
    .map(k => `${q[k].length} ${k === 'high' ? 'tall' : k}`)
    .join(' · ');
}

/* ---------- 2 Fronts ---------- */
/* the cabinet in the style close-ups: one 60 × 80 door */
const CLOSE_CAB = { id: 'close', sys: 'metod', kind: 'base', w: 60, h: 80, layout: 'door' };
/* the look editor: for all fronts (target "all") or for one front (its id) */
function lookEdHTML(target, lk) {
  const t = target;
  const styles = Object.entries(STYLES)
    .map(([k, s]) => {
      const ok = matOk(k, lk.mat) || !MATS[lk.mat].only;
      return `<button type="button" class="stc ${k === lk.style ? 'on' : ''}" data-act="lk" data-a="${t}|style|${k}" ${ok ? '' : 'disabled'}>${(() => {
        const m = lk.mat === 'glass' && k === 'flat' ? 'painted' : matOk(k, lk.mat) ? lk.mat : 'painted',
          st = {
            sys: 'metod',
            cabs: [CLOSE_CAB],
            style: k,
            mat: m,
            col: lk.col,
            oil: lk.oil,
            handle: 'push',
            zoom: true
          };
        return thumbHTML('sw' + k, st, lookThumb(k, m, lk.col, t + k, lk.oil), 320, 300);
      })()}<b>${s.name}</b><small>${s.blurb}</small></button>`;
    })
    .join('');
  const mats = Object.entries(MATS)
    .map(([k, m]) => {
      const sw = m.paint ? colHex(lk.col) : m.glass ? '#cfdcd8' : woodCol(k, lk.oil).wood;
      return `<button type="button" class="mat ${k === lk.mat ? 'on' : ''}" data-act="lk" data-a="${t}|mat|${k}"><i class="sw${m.glass ? ' gl' : ''}" style="background:${sw}"></i><b>${m.name}</b>${m.budget ? '<em class="tag">Budget</em>' : ''}<small>${m.blurb} · from ${eur(m.rate * (m.glass ? 1 : 1))}/m²</small></button>`;
    })
    .join('');
  const cols = MATS[lk.mat].paint
    ? `<h3>Colour</h3><div class="sws">${Object.entries(COLOURS)
        .map(
          ([k, c]) =>
            `<button type="button" class="swb ${k === lk.col ? 'on' : ''}${c.trend ? ' tr' : ''}" data-act="lk" data-a="${t}|col|${k}" title="${esc(c.name)} · RAL ${c.ral}${c.trend ? ' · 2027' : ''}" style="background:${colHex(k)}"><span>${esc(c.name)}</span></button>`
        )
        .join(
          ''
        )}</div><p class="hint"><b>${esc(COLOURS[lk.col].name)}</b> is RAL ${COLOURS[lk.col].ral} ${esc((RAL[COLOURS[lk.col].ral] || {}).name || '')}, so any paint shop can match it later.${COLOURS[lk.col].trend ? ' One of the 2027 colours.' : ''}</p>`
    : MATS[lk.mat].oil
      ? `<h3>Oil colour</h3><div class="sws">${Object.entries(OILS)
          .map(
            ([k, o]) =>
              `<button type="button" class="swb ${k === lk.oil ? 'on' : ''}" data-act="lk" data-a="${t}|oil|${k}" title="Rubio Monocoat ${esc(o.name)} — ${esc(o.blurb)}" style="background:${woodCol(lk.mat, k).wood}"><span>${esc(o.name)}</span></button>`
          )
          .join(
            ''
          )}</div><p class="hint">Rubio Monocoat Oil Plus 2C, ${esc(OILS[lk.oil].name)}: ${esc(OILS[lk.oil].blurb.toLowerCase())}. One coat, food-safe once cured, and you can touch up a scratch with a drop of oil.</p>`
      : '';
  return `<h3>Style</h3><div class="stcs two">${styles}</div><h3>Material</h3><p class="hint">Riet and Voeg are routed into MDF, so wood and plywood come Effen (flat).</p><div class="mats">${mats}</div>${cols}`;
}
function frontsHTML(L) {
  let h = `<h2>Your fronts</h2><p class="lede">19 mm thick, made to the exact IKEA sizes and drilled for the IKEA hinges you already have. Choose one look for all of them, then tap any front in the picture to give it its own.</p>
    <div class="adds"><button type="button" class="btn surp" data-act="surprise">✨ ${S.recipe ? 'Another idea' : 'Surprise me'}</button>${S.recipe ? `<span class="hint">${esc(S.recipe)}: ${esc(S.recipeSay || '')}</span>` : '<span class="hint">A matching look, picked for your cabinets</span>'}</div>`;
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
  const all = { style: S.style, mat: S.mat, col: S.col, oil: S.oil };
  h += `<h3 class="big">${f ? 'All the other fronts' : 'All fronts'}</h3>${lookEdHTML('all', all)}`;
  const sl = sideLook();
  h += `<h3>Side panels</h3>${seg(
    'sides',
    S.sides,
    Object.entries(SIDES).map(([k, n]) => [k, n])
  )}<p class="hint">${
    S.sides === 'none'
      ? 'Cover the white IKEA side at the end of your run with a panel in the same look as your fronts.'
      : `${L.sides.length} panel${L.sides.length === 1 ? '' : 's'} in ${esc(lookName(sl))}, ${[...new Set(L.sides.map(x => x.nom.replace('×', ' × ')))].join(' and ')} cm, flush with the fronts.${MATS[lookOf(null).mat].glass ? ' Glass is for doors only, so the sides are painted.' : ''}`
  }</p>`;
  h += `<h3>${S.sys === 'metod' ? 'Plinth and filler strips' : 'Filler strips'}</h3>${
    S.sys === 'metod'
      ? `<div class="row"><label>Plinth</label>${seg('plinth', S.plinth, [
          ['ikea', 'IKEA’s own'],
          ['match', 'Same look']
        ])}</div>`
      : ''
  }<div class="row"><label>Fillers</label>${seg(
    'fillers',
    S.fillers,
    [0, 1, 2, 3, 4].map(n => [n, n ? String(n) : 'None'])
  )}</div><p class="hint">${S.sys === 'metod' ? `A plinth in the look of your fronts, ${eur(EXTRAS.plinthPerM)} a metre. ` : ''}Filler strips close the gap to a wall or ceiling, ${eur(EXTRAS.filler)} each, cut to fit.</p>`;
  h += `<h3>Edges</h3>${seg(
    'edge',
    S.edge,
    Object.entries(EDGES).map(([k, e]) => [k, e.name])
  )}<p class="hint">${esc(EDGES[S.edge].blurb)} — the same on every front.</p>`;
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
/* a small picture of each handle on a corner of your front */
function handleIcon(k) {
  const face = faceHex(lookOf(null)),
    w = (HFIN[S.hfin] || HFIN.oak).hex,
    edge = 'stroke="#000" stroke-opacity=".2" stroke-width="1.5"';
  const inner =
    k === 'knob'
      ? `<circle cx="60" cy="40" r="12" fill="${w}" ${edge}/><circle cx="57" cy="37" r="6" fill="#fff" fill-opacity=".16"/>`
      : k === 'bar'
        ? `<rect x="54" y="12" width="10" height="56" rx="5" fill="${w}" ${edge}/>`
        : `<circle cx="60" cy="40" r="10" fill="#17130f"/><circle cx="60" cy="40" r="10" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2"/>`;
  return `<svg viewBox="0 0 120 80" aria-hidden="true"><rect width="120" height="80" fill="${face}"/><rect x="88" width="2" height="80" fill="#000" fill-opacity=".18"/>${inner}</svg>`;
}
function handlesHTML(L) {
  const hs = Object.entries(HANDLES)
    .map(
      ([k, h]) =>
        `<button type="button" class="hcard ${k === S.handle ? 'on' : ''}" data-act="handle" data-a="${k}"><span class="hico">${handleIcon(k)}</span><b>${h.name}</b><small>${h.blurb} · ${eur(h.price)} a front</small></button>`
    )
    .join('');
  const fins =
    S.handle === 'knob' || S.handle === 'bar'
      ? `<h3>Wood</h3>${seg(
          'hfin',
          S.hfin,
          Object.entries(HFIN).map(([k, f]) => [k, f.name])
        )}<p class="hint">${S.hfin === 'walnut' ? 'Walnut: dark and warm, lovely on light and pastel fronts.' : 'Oak: light and honest, lovely on deep colours and dark wood.'} Oiled, like the wooden fronts.</p>`
      : '<p class="hint">A clean 30 mm hole with softened edges — nothing to catch a sleeve on. Behind it you see the cabinet.</p>';
  const f = S.sel && L.fronts.find(x => x.id === S.sel);
  const doors = L.fronts.filter(x => x.hinge).length;
  return `<h2>Handles</h2><p class="lede">Three quiet choices, the same on every front. Doors get it on the side that opens, drawers in the middle.</p>
    <div class="hcards">${hs}</div>${fins}
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
      return `${head}<tr><td>${r.n}×</td><td>${r.kind === 'door' ? 'Door' + (r.hinge ? ` <small>hinge ${r.hinge === 'L' ? 'left' : 'right'}</small>` : '') : r.kind === 'side' ? 'Side panel <small>19 mm</small>' : 'Drawer front'}</td><td class="num">${f1(r.w)} × ${f1(r.h)}<small>${r.kind === 'side' ? 'depth × height' : 'IKEA ' + r.nom}</small></td><td class="num">${eur(r.p * r.n)}</td></tr>`;
    })
    .join('');
  return `<h2>Your order</h2><p class="lede">${countWords(P)}, ${esc(EDGES[S.edge].name.toLowerCase())} edges, with ${handleWords()}. Made to measure and drilled for your IKEA hinges; ready ${leadOf(L)} after you order${L.fronts.some(f => MATS[lookOf(f).mat].paint) ? ' (painted fronts take 1–2 weeks longer: they go to our spray shop)' : ''}.</p>
    ${
      P.n
        ? `<table class="ord"><thead><tr><th></th><th>Front</th><th class="num">Size, mm</th><th class="num">Price</th></tr></thead><tbody>${rows}${
            P.ex.length
              ? `<tr class="lkh"><td colspan="4">Extras</td></tr>` +
                P.ex
                  .map(
                    x =>
                      `<tr><td>${x.n}×</td><td>${esc(x.name)}<small>${esc(x.note)}</small></td><td class="num"></td><td class="num">${eur(x.p * x.n)}</td></tr>`
                  )
                  .join('')
              : ''
          }</tbody>
    <tfoot><tr><td></td><td colspan="2">Subtotal</td><td class="num">${eur(P.sub)}</td></tr><tr><td></td><td colspan="2">Delivery${P.del ? ` <small>free from ${eur(PRICE.deliveryFree)}</small>` : ' — free'}</td><td class="num">${P.del ? eur(P.del) : '€ 0'}</td></tr><tr class="tot"><td></td><td colspan="2">Total incl. VAT</td><td class="num">${eur(P.total)}</td></tr></tfoot></table>
    <label class="chk"><input type="checkbox" data-act="planCheck"${S.planCheck ? ' checked' : ''}><span><b>Free plan check</b> We go through your IKEA list and every size with you before anything is cut.</span></label>
    <button type="button" class="btn pri big" data-act="orderNow">Order these fronts</button>
    <div class="adds qa"><button type="button" class="btn sm" data-act="print">Print or save the quote</button><button type="button" class="btn sm" data-act="share">Share this design</button></div>
    <div class="sbox"><div><b>Not sure yet? Order the sample box</b><span>Every colour and material as a 10 × 15 cm chip, ${eur(EXTRAS.sampleBox)}, taken off your order later.</span></div><button type="button" class="btn" data-act="samples">Order samples</button></div>`
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
    `<h2>Order your fronts</h2><p class="lede">${countWords(P)} · <b>${eur(P.total)}</b> incl. VAT and delivery. We check every size with you before we cut.</p>
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
    `Edges: ${EDGES[S.edge].name.toLowerCase()} · Handles: ${handleWords()}${L.fronts.some(f => lookOf(f).style === 'fluted') ? ` · flutes ${S.flute.pitch} mm, ${S.flute.dir === 'v' ? 'vertical' : 'horizontal'}` : ''}${L.fronts.some(f => lookOf(f).style === 'grooves') ? ` · grooves every ${S.flute.gpitch} mm, ${S.flute.dir === 'v' ? 'vertical' : 'horizontal'}` : ''}${L.fronts.some(f => MATS[lookOf(f).mat].glass) ? ` · glass frame ${GFRAME[S.gframe].name.toLowerCase()}` : ''}`,
    '',
    ...grouped(L).map(
      r =>
        `${r.n} × ${r.kind === 'door' ? 'door' : r.kind === 'side' ? 'side panel' : 'drawer front'} ${f1(r.w)} × ${f1(r.h)} mm (${r.kind === 'side' ? 'depth × height' : 'IKEA ' + r.nom})${r.hinge ? ', hinge ' + (r.hinge === 'L' ? 'left' : 'right') : ''} — ${lookName(r.look)}${MATS[r.look.mat].paint ? ' (RAL ' + COLOURS[r.look.col].ral + ')' : ''}`
    ),
    ...P.ex.map(x => `${x.n} × ${x.name.toLowerCase()} (${x.note}) — ${eur(x.p * x.n)}`),
    '',
    `Plan check before cutting: ${S.planCheck ? 'yes, please' : 'no, the sizes are final'}`,
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

/* ---------- the quote: a clean page with the picture and every line, for printing or saving as PDF ---------- */
function printQuote() {
  const L = layout(),
    P = priceAll(L),
    no = 'BF-' + designCode().slice(-6).toUpperCase(),
    pic = V3.ready && V3.r ? V3.r.domElement.toDataURL('image/jpeg', 0.9) : '',
    rows =
      grouped(L)
        .map(
          r =>
            `<tr><td>${r.n}×</td><td>${r.kind === 'door' ? 'Door' : r.kind === 'side' ? 'Side panel' : 'Drawer front'}${r.hinge ? `, hinge ${r.hinge === 'L' ? 'left' : 'right'}` : ''}<small>${esc(lookName(r.look))}</small></td><td class="num">${f1(r.w)} × ${f1(r.h)} mm</td><td class="num">${eur(r.p * r.n)}</td></tr>`
        )
        .join('') +
      P.ex
        .map(
          x =>
            `<tr><td>${x.n}×</td><td>${esc(x.name)}<small>${esc(x.note)}</small></td><td></td><td class="num">${eur(x.p * x.n)}</td></tr>`
        )
        .join('');
  let q = document.getElementById('printq');
  if (!q) {
    q = document.createElement('div');
    q.id = 'printq';
    document.body.appendChild(q);
  }
  q.innerHTML = `<header><b>BRUIS</b><span>Quote ${no} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></header>
    ${pic ? `<img src="${pic}" alt="">` : ''}
    <h1>${SYS[S.sys].name} ${SYS[S.sys].what.toLowerCase()}: ${countWords(P)}</h1>
    <p>Edges ${EDGES[S.edge].name.toLowerCase()} · ${handleWords()} · ready ${esc(leadOf(L))} after ordering</p>
    <table><tbody>${rows}</tbody><tfoot><tr><td></td><td colspan="2">Delivery</td><td class="num">${P.del ? eur(P.del) : 'free'}</td></tr><tr class="tot"><td></td><td colspan="2">Total incl. VAT</td><td class="num">${eur(P.total)}</td></tr></tfoot></table>
    <p>${S.planCheck ? 'Includes our free plan check: we go through your IKEA list and every size with you before anything is cut.' : ''} Hinges and drawer fittings are IKEA's own and not included.</p>
    <p class="link">Open this design again: ${esc(shareLink())}</p>
    <footer>BRUIS — fronts for IKEA PAX, METOD and BESTÅ. Prototype: prices are examples.</footer>`;
  window.print();
}

/* ---------- the sample box (prototype: nothing is sent) ---------- */
function openSamples() {
  document.getElementById('mbox').innerHTML =
    `<h2>The sample box</h2><p class="lede">Every colour and material we make, as 10 × 15 cm chips with the real edge and a piece of each profile: Effen, Riet and Voeg. ${eur(EXTRAS.sampleBox)} including delivery, and we take it off your order later.</p>
    <label class="field"><span>Your name</span><input id="sName" autocomplete="name"></label>
    <label class="field"><span>E-mail</span><input id="sMail" type="email" autocomplete="email"></label>
    <label class="field"><span>Address</span><textarea id="sAddr" rows="3" autocomplete="street-address"></textarea></label>
    <div class="adds"><button type="button" class="btn pri" data-act="sendSamples">Order the sample box</button><button type="button" class="btn" data-act="close">Not now</button></div>
    <p class="hint">This is a prototype: the request is not sent anywhere yet.</p>`;
  document.getElementById('modal').hidden = false;
  setTimeout(() => document.getElementById('sName').focus(), 30);
}
function sendSamples() {
  const v = id => (document.getElementById(id).value || '').trim();
  if (!v('sName') || !/.+@.+\..+/.test(v('sMail')) || !v('sAddr')) {
    document.querySelector('#mbox .hint').textContent =
      'Please fill in your name, a valid e-mail address and your address.';
    return;
  }
  document.getElementById('mbox').innerHTML =
    `<h2>Thank you, ${esc(v('sName').split(' ')[0])}!</h2><p class="lede">In the real shop your sample box would be on its way within two working days. In this prototype nothing was sent.</p><div class="adds"><button type="button" class="btn pri" data-act="close">Close</button></div>`;
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
    nx = { style: cur.style, mat: cur.mat, col: cur.col, oil: cur.oil };
  nx[field] = val;
  if (field === 'mat' && !matOk(nx.style, val)) nx.style = MATS[val].only || 'flat';
  if (field === 'style' && !matOk(val, nx.mat)) nx.mat = mdfFor(nx.mat);
  S.fx[target] = nx;
}

/* the Handles step opens on the close-up, where a knob is big enough to judge; leaving it goes back
   to the room, unless the close-up was picked by hand */
function autoView(next) {
  if (next === 'handles' && S.view !== 'close') {
    S.view = 'close';
    S.viewAuto = true;
  } else if (next !== 'handles' && S.viewAuto) {
    S.view = 'room';
    S.viewAuto = false;
  }
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
  if (b.closest('summary')) e.preventDefault();
  const a = b.dataset.a || '',
    [id, val] = a.split('|'),
    c = S.cabs.find(x => x.id === id);
  switch (b.dataset.act) {
    case 'step':
      autoView(a);
      S.step = a;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'next': {
      const i = STEPS.findIndex(s => s[0] === S.step);
      autoView(STEPS[Math.min(STEPS.length - 1, i + 1)][0]);
      S.step = STEPS[Math.min(STEPS.length - 1, i + 1)][0];
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    }
    case 'view':
      S.view = a === 'close' ? 'close' : 'room';
      S.viewAuto = false;
      break;
    case 'openShared': {
      const m = String(S.impText || '').match(/#d=([A-Za-z0-9_-]+)/),
        o = m && readCode(m[1]);
      if (o) {
        S.undo = JSON.stringify({ sys: S.sys, cabs: S.cabs, fx: S.fx, flip: S.flip });
        Object.assign(S, o, { step: 'fronts', sel: null, recipe: null, demo: null, impText: '' });
      }
      break;
    }
    case 'share': {
      const url = shareLink();
      const done = ok => {
        b.textContent = ok ? 'Link copied' : 'Copy failed';
        if (!ok) prompt('Copy this link to share your design:', url);
        setTimeout(() => (b.textContent = 'Share this design'), 2200);
      };
      try {
        navigator.clipboard.writeText(url).then(
          () => done(true),
          () => done(false)
        );
      } catch (er) {
        done(false);
      }
      return;
    }
    case 'print':
      printQuote();
      return;
    case 'trend':
      if (S.step === 'home') loadDemo(0);
      surprise(undefined, true);
      S.step = 'fronts';
      window.scrollTo({ top: 0 });
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
          oil: S.oil,
          edge: S.edge,
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
      S.demo = null;
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
      S.openCab = S.cabs[S.cabs.length - 1].id;
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
      S.impMsg = '';
      S.impMsg = '';
      break;
    case 'demo':
      loadDemo(+a);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'impUse': {
      const r = parsePlanner(S.impText),
        got = r.found.filter(c => c.sys === a);
      if (!got.length) break;
      S.undo = JSON.stringify({ sys: S.sys, cabs: S.cabs, fx: S.fx, flip: S.flip });
      S.sys = a;
      S.cabs = got;
      S.demo = null;
      S.fx = {};
      S.flip = {};
      S.sel = null;
      S.impMsg = `✓ ${got.length} ${SYS[a].name} cabinet${got.length === 1 ? '' : 's'} set up from your list — check them below. <button type="button" class="lnk" data-act="undo">Undo</button> · <button type="button" class="lnk" data-act="step" data-a="fronts">Choose your fronts</button>`;
      break;
    }
    case 'undo':
      if (S.undo) {
        Object.assign(S, JSON.parse(S.undo));
        S.undo = null;
        S.impMsg = '';
      }
      break;
    case 'impClear':
      S.impText = '';
      S.impMsg = '';
      break;
    case 'impPaste':
      try {
        navigator.clipboard
          .readText()
          .then(t => {
            S.impText = t;
            S.impMsg = '';
            render();
          })
          .catch(() => impPasteHelp());
      } catch (er) {
        impPasteHelp();
      }
      return;
    case 'lk': {
      const [t, field, v] = a.split('|');
      setLook(t, field, v);
      break;
    }
    case 'own':
      if (S.sel) {
        if (a === 'same') delete S.fx[S.sel];
        else S.fx[S.sel] = { style: S.style, mat: S.mat, col: S.col, oil: S.oil };
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
    case 'edge':
      S.edge = a;
      break;
    case 'sides':
      S.sides = a;
      break;
    case 'plinth':
      S.plinth = a;
      break;
    case 'fillers':
      S.fillers = +a;
      break;
    case 'planCheck':
      S.planCheck = !!b.checked;
      break;
    case 'samples':
      openSamples();
      return;
    case 'sendSamples':
      sendSamples();
      return;
    case 'home':
      S.step = 'home';
      window.scrollTo({ top: 0 });
      break;
    case 'goPaste':
      S.step = 'cabs';
      window.scrollTo({ top: 0 });
      render();
      setTimeout(() => {
        const t = document.getElementById('impText');
        if (t) {
          t.scrollIntoView({ block: 'center', behavior: 'smooth' });
          t.focus({ preventScroll: true });
        }
      }, 60);
      return;
    case 'demoGo':
      loadDemo(+a);
      S.step = 'fronts';
      window.scrollTo({ top: 0 });
      break;
    case 'handle':
      S.handle = a;
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
    if (e.target.classList && e.target.classList.contains('how')) S.howOpen = e.target.open;
    if (e.target.classList && e.target.classList.contains('cab')) {
      if (e.target.open) S.openCab = e.target.dataset.c;
      else if (S.openCab === e.target.dataset.c) S.openCab = null;
    }
  },
  true
);
/* the IKEA list: read it while you type or paste, without redrawing the box you type in */
let impTimer = 0;
document.addEventListener('input', e => {
  if (e.target.id !== 'impText') return;
  S.impText = e.target.value;
  clearTimeout(impTimer);
  impTimer = setTimeout(() => {
    if (S.impMsg) {
      S.impMsg = '';
      return render();
    }
    const el = document.getElementById('impPrev');
    if (el) el.innerHTML = impPreviewHTML(S.impText);
    save();
  }, 120);
});
document.addEventListener('change', e => {
  if (e.target.id !== 'impFile' || !e.target.files[0]) return;
  e.target.files[0].text().then(t => {
    S.impText = t;
    S.impMsg = '';
    render();
  });
});
function impPasteHelp() {
  const t = document.getElementById('impText');
  if (t) t.focus();
  const el = document.getElementById('impPrev');
  if (el)
    el.innerHTML =
      '<p class="hint warn">Your browser didn’t let us read the clipboard — tap in the box and paste (long-press and Paste, or Ctrl/⌘ + V).</p>';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('modal').hidden = true;
  if (e.key === 'Enter' && e.target && /^tw/.test(e.target.id)) document.querySelector('[data-act=typed]').click();
});
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') e.currentTarget.hidden = true;
});
