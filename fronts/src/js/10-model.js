/* ==== 10-model.js ====
   The project (S), saved in this browser, and what it turns into: each cabinet's fronts with their
   real sizes (mm) and where they sit in the picture.
*/
const KEY = 'bruis-fronts-v2';
let _id = 1;
const nid = () => 'c' + _id++ + Math.random().toString(36).slice(2, 5);

function freshState(sys) {
  const s = {
    sys: sys || 'pax',
    cabs: [],
    style: 'fluted',
    flute: { pitch: 20, dir: 'v', gpitch: 50 },
    mat: 'painted',
    col: 'racing',
    oil: 'pure',
    edge: 'round',
    sides: 'none',
    gframe: 'black',
    handle: 'knob',
    hfin: 'brass',
    step: 'cabs',
    view: '2d',
    flip: {},
    fx: {}, // fronts with their own look: id → { style, mat, col }
    sel: null // the front you tapped
  };
  if (s.sys === 'pax')
    s.cabs = [cab('pax', 'frame', 100, 236), cab('pax', 'frame', 50, 236), cab('pax', 'frame', 100, 236)];
  if (s.sys === 'metod') {
    s.style = 'flat';
    s.col = 'cobalt';
    s.cabs = [
      cab('metod', 'high', 60, 200, 'split'),
      cab('metod', 'base', 40, 80, 'drawers3'),
      cab('metod', 'base', 60, 80, 'drawer_door'),
      cab('metod', 'base', 80, 80, 'doors2'),
      cab('metod', 'wall', 40, 80),
      cab('metod', 'wall', 60, 80),
      cab('metod', 'wall', 80, 80, 'doors2')
    ];
  }
  if (s.sys === 'besta') {
    s.style = 'fluted';
    s.mat = 'walnut';
    s.cabs = [cab('besta', 'frame', 60, 64), cab('besta', 'frame', 120, 38, 'drawers'), cab('besta', 'frame', 60, 64)];
  }
  return s;
}
function cab(sys, kind, w, h, layout) {
  return { id: nid(), sys, kind, w, h, layout: layout || defaultLayout(sys, kind, w, h) };
}
function defaultLayout(sys, kind, w) {
  if (sys === 'pax') return 'doors';
  if (sys === 'besta') return 'door';
  if (kind === 'high') return 'door';
  return w > 60 ? 'doors2' : 'door';
}
function layoutsFor(c) {
  const k = c.sys === 'pax' ? 'pax' : c.sys === 'besta' ? 'besta' : 'metod_' + c.kind;
  return (LAYOUTS[k] || []).filter(([, , ok]) => ok(c));
}
function fixLayout(c) {
  if (!layoutsFor(c).some(([k]) => k === c.layout)) c.layout = layoutsFor(c)[0][0];
}

let S;
try {
  S = JSON.parse(localStorage.getItem(KEY) || 'null');
} catch (e) {
  S = null;
}
if (!S || !S.cabs) S = freshState('pax');
S.flip = S.flip || {};
S.fx = S.fx || {};
if (!S.flute.gpitch) S.flute.gpitch = 50;
if (!OILS[S.oil]) S.oil = 'pure';
if (!EDGES[S.edge]) S.edge = 'round';
if (!SIDES[S.sides]) S.sides = 'none';
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    /* private browsing: works without saving */
  }
}

/* ---------- cabinet → fronts ----------
   A front: { id, cab, kind: 'door'|'drawer', nom: 'w×h' (IKEA's name for the size), w, h (real, mm),
              x, y (bottom-left in the picture, mm from the left / floor), hinge: 'L'|'R'|null } */
const PAX_H = { 236: 2294, 201: 1950 },
  PAX_W = { 50: 495, 25: 245 };
function frontsOf(c, x0, y0) {
  const out = [],
    add = (kind, nw, nh, realW, realH, x, y, hinge) =>
      out.push({
        id: c.id + ':' + out.length,
        cab: c.id,
        ckind: c.kind,
        sys: c.sys,
        kind,
        nom: `${nw}×${nh}`,
        w: realW,
        h: realH,
        x,
        y,
        hinge
      });
  const W = c.w * 10,
    H = c.h * 10;
  if (c.layout === 'open') return out;
  if (c.sys === 'pax') {
    const parts = c.w === 100 ? [50, 50] : c.w === 75 ? [50, 25] : [50];
    const dh = PAX_H[c.h];
    let x = x0 + 2.5;
    parts.forEach((pw, i) => {
      add(
        'door',
        pw,
        c.h === 236 ? 229 : 195,
        PAX_W[pw],
        dh,
        x,
        y0 + (H - dh) / 2,
        parts.length === 1 ? 'R' : i === 0 ? 'L' : 'R'
      );
      x += pw * 10;
    });
  } else if (c.sys === 'metod') {
    const g = 3; // METOD fronts are 3 mm smaller than the cabinet
    if (c.kind === 'base') {
      const stack = {
        door: null,
        doors2: null,
        drawer_door: [20, 60],
        drawers3: [20, 20, 40],
        drawers2: [40, 40],
        drawers4: [20, 20, 20, 20]
      }[c.layout];
      if (!stack) {
        const n = c.layout === 'doors2' ? 2 : 1;
        for (let i = 0; i < n; i++)
          add(
            'door',
            c.w / n,
            c.h,
            W / n - g,
            H - g,
            x0 + (i * W) / n + g / 2,
            y0 + g / 2,
            n === 1 ? 'R' : i === 0 ? 'L' : 'R'
          );
      } else {
        let y = y0 + H;
        stack.forEach((sh, i) => {
          y -= sh * 10;
          const isDoor = c.layout === 'drawer_door' && i === 1;
          add(isDoor ? 'door' : 'drawer', c.w, sh, W - g, sh * 10 - g, x0 + g / 2, y + g / 2, isDoor ? 'R' : null);
        });
      }
    } else if (c.kind === 'wall') {
      const n = c.layout === 'doors2' ? 2 : 1;
      for (let i = 0; i < n; i++)
        add(
          'door',
          c.w / n,
          c.h,
          W / n - g,
          H - g,
          x0 + (i * W) / n + g / 2,
          y0 + g / 2,
          n === 1 ? 'R' : i === 0 ? 'L' : 'R'
        );
    } else {
      const stack = c.layout === 'split' ? [140, 60] : [c.h]; // bottom door first
      let y = y0;
      stack.forEach(sh => {
        add('door', c.w, sh, W - g, sh * 10 - g, x0 + g / 2, y + g / 2, 'R');
        y += sh * 10;
      });
    }
  } else if (c.sys === 'besta') {
    const cols = c.w / 60,
      realH = { 64: 637, 38: 377, 26: 257 };
    for (let k = 0; k < cols; k++) {
      const xs = x0 + k * 600 + 2;
      let stack;
      if (c.layout === 'drawers') stack = c.h === 64 ? [26, 38] : [c.h];
      else stack = c.h === 38 ? [38] : Array.from({ length: c.h / 64 }, () => 64);
      let y = y0 + H;
      stack.forEach(sh => {
        y -= sh * 10;
        const isDrawer = c.layout === 'drawers';
        add(
          isDrawer ? 'drawer' : 'door',
          60,
          sh,
          596,
          realH[sh],
          xs,
          y + (sh * 10 - realH[sh]) / 2,
          isDrawer ? null : cols > 1 && k === 0 ? 'L' : 'R'
        );
      });
    }
  }
  out.forEach(f => {
    if (f.hinge && S.flip[f.id]) f.hinge = f.hinge === 'L' ? 'R' : 'L';
  });
  return out;
}

/* ---------- the whole layout: cabinets placed side by side, kitchen wall cabinets above ---------- */
function layout() {
  const cabs = [],
    fronts = [];
  const plinth = S.sys === 'metod' ? 100 : S.sys === 'besta' ? 120 : 0;
  let xb = 0,
    xw = 0;
  S.cabs.forEach(c => {
    const kd = SYS[c.sys].kinds[c.kind] || {};
    let x, y;
    if (c.sys === 'metod' && kd.row === 'wall') {
      x = xw;
      xw += c.w * 10;
      y = 2200 - c.h * 10; // wall cabinets hang with their tops in one line
    } else {
      x = xb;
      xb += c.w * 10;
      y = plinth;
    }
    const pc = { c, x, y, w: c.w * 10, h: c.h * 10 };
    cabs.push(pc);
    frontsOf(c, x, y).forEach(f => fronts.push(f));
  });
  const W = Math.max(xb, xw, 600),
    Hmax = Math.max(...cabs.map(p => p.y + p.h), 900);
  return {
    cabs,
    fronts,
    sides: sidesOf(cabs),
    W,
    H: Hmax,
    plinth,
    worktop: S.sys === 'metod' && S.cabs.some(c => c.kind === 'base')
  };
}

/* ---------- side panels: one look and one choice for the whole run ----------
   A panel covers the outer side of the first and/or last cabinet of each row (a kitchen has a base row and a
   wall row). It is a little deeper than the cabinet so it ends flush with the fronts:
     PAX 60 cm (58 frame + door), METOD base and tall 62 cm, METOD wall 39 cm, BESTÅ 42 cm; as high as the cabinet.
   A side: { id, kind: 'side', end: 'L'|'R', w: depth (mm), h (mm), x (where its 19 mm edge shows), y, cab } */
const SIDE_T = 19;
function sideDepth(c) {
  if (c.sys === 'pax') return 600;
  if (c.sys === 'besta') return 420;
  return c.kind === 'wall' ? 390 : 620;
}
function sidesOf(cabs) {
  if (S.sides === 'none' || !cabs.length) return [];
  const rows = {};
  cabs.forEach(p => {
    const r = p.c.sys === 'metod' && p.c.kind === 'wall' ? 'wall' : 'base';
    (rows[r] = rows[r] || []).push(p);
  });
  const out = [];
  Object.entries(rows).forEach(([r, ps]) => {
    const first = ps.reduce((a, b) => (b.x < a.x ? b : a)),
      last = ps.reduce((a, b) => (b.x + b.w > a.x + a.w ? b : a)),
      mk = (p, end) => ({
        id: `side:${r}:${end}`,
        kind: 'side',
        end,
        row: r,
        cab: p.c.id,
        w: sideDepth(p.c),
        h: p.h,
        nom: `${sideDepth(p.c) / 10}×${p.h / 10}`,
        x: end === 'L' ? p.x - SIDE_T : p.x + p.w,
        y: p.y
      });
    if (S.sides === 'left' || S.sides === 'both') out.push(mk(first, 'L'));
    if (S.sides === 'right' || S.sides === 'both') out.push(mk(last, 'R'));
  });
  // a tall cabinet at the end already has a full-height panel: no second panel for the wall cabinet above it
  return out.filter(
    sd => sd.row !== 'wall' || !out.some(o => o.row !== 'wall' && Math.abs(o.x - sd.x) < 1 && o.y + o.h > sd.y)
  );
}
/* sides take the look of "all fronts"; glass is for doors only, so glass sides become painted */
function sideLook() {
  const lk = lookOf(null);
  if (MATS[lk.mat].glass) return { style: 'flat', mat: 'painted', col: lk.col, oil: lk.oil, own: false };
  return lk;
}

/* ---------- the look of a front: the overall choice, unless this front has its own ---------- */
function matOk(style, mat) {
  const m = MATS[mat];
  if (!m || !STYLES[style]) return false;
  if (m.only) return m.only === style;
  /* flutes and grooves are routed into MDF only (painted or raw); wood and ply stay flat */
  return !STYLES[style].mdf || !!m.mdf;
}
function lookOf(f) {
  const o = (f && S.fx[f.id]) || {},
    lk = {
      style: o.style || S.style,
      mat: o.mat || S.mat,
      col: o.col || S.col,
      oil: o.oil || S.oil,
      own: !!S.fx[f && f.id]
    };
  if (!MATS[lk.mat]) lk.mat = 'painted';
  if (!COLOURS[lk.col]) lk.col = 'chalk';
  if (!OILS[lk.oil]) lk.oil = 'pure';
  if (!STYLES[lk.style]) lk.style = 'flat';
  if (MATS[lk.mat].only) lk.style = MATS[lk.mat].only;
  else if (!matOk(lk.style, lk.mat)) lk.style = 'flat';
  return lk;
}
function lookName(lk) {
  const m = MATS[lk.mat];
  return `${STYLES[lk.style].name} ${m.paint ? COLOURS[lk.col].name.toLowerCase() : m.name.toLowerCase()}${m.oil ? ', oil ' + OILS[lk.oil].name : ''}`;
}
function lookKey(lk) {
  const m = MATS[lk.mat];
  return `${lk.style}|${lk.mat}|${m.paint ? lk.col : m.oil ? lk.oil : ''}`;
}

/* ---------- price ---------- */
function frontPrice(f) {
  const lk = lookOf(f),
    m = MATS[lk.mat],
    st = STYLES[lk.style],
    area = Math.max(PRICE.minArea, (f.w * f.h) / 1e6);
  let p = PRICE.perFront + area * m.rate * (m.glass ? 1 : st.f) + HANDLES[S.handle].price;
  if (f.kind === 'door') p += PRICE.hinge;
  return Math.round(p * 100) / 100;
}
function sidePrice(sd) {
  const lk = sideLook(),
    m = MATS[lk.mat],
    area = Math.max(PRICE.minArea, (sd.w * sd.h) / 1e6);
  return Math.round((PRICE.perFront + area * m.rate * STYLES[lk.style].f) * 100) / 100;
}
function priceAll(L) {
  const fr = L.fronts.map(f => ({ f, p: frontPrice(f) })),
    sd = (L.sides || []).map(s => ({ s, p: sidePrice(s) })),
    sub = fr.reduce((a, b) => a + b.p, 0) + sd.reduce((a, b) => a + b.p, 0),
    del = sub >= PRICE.deliveryFree || !fr.length ? 0 : PRICE.delivery;
  return { fr, sd, sub, del, total: sub + del, n: fr.length, ns: sd.length };
}
/* "5 fronts + 2 sides" */
function countWords(P) {
  return `${P.n} front${P.n === 1 ? '' : 's'}${P.ns ? ` + ${P.ns} side${P.ns === 1 ? '' : 's'}` : ''}`;
}
const eur = v => '€ ' + Math.round(v).toLocaleString('en-IE');

/* fronts with the same size, kind, hinge side and look, for the order list */
function grouped(L) {
  const m = new Map();
  L.fronts.forEach(f => {
    const lk = lookOf(f),
      k = `${f.kind}|${f.w}|${f.h}|${f.hinge || ''}|${lookKey(lk)}`;
    if (!m.has(k))
      m.set(k, { kind: f.kind, w: f.w, h: f.h, nom: f.nom, hinge: f.hinge, look: lk, n: 0, p: frontPrice(f) });
    m.get(k).n++;
  });
  (L.sides || []).forEach(sd => {
    const lk = sideLook(),
      k = `side|${sd.w}|${sd.h}||${lookKey(lk)}`;
    if (!m.has(k))
      m.set(k, { kind: 'side', w: sd.w, h: sd.h, nom: sd.nom, hinge: null, look: lk, n: 0, p: sidePrice(sd) });
    m.get(k).n++;
  });
  return [...m.values()].sort(
    (a, b) =>
      lookKey(a.look).localeCompare(lookKey(b.look)) ||
      (a.kind === 'side') - (b.kind === 'side') ||
      b.h - a.h ||
      b.w - a.w
  );
}
