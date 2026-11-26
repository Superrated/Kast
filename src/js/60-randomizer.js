/* ==== 60-randomizer.js ====
   Shuffle / "Surprise me": random layouts that respect the wishes (MUSTS) and the room.
*/
/* ===== Randomizer ===== */
const PALETTES = [
  { c: 'ral9010', f: 'oak', a: 'ral6021', d: 'walnut', k: 'oak' },
  { c: 'ral9016', f: 'ral7016', a: 'oak', d: 'oak', k: 'ral7016' },
  { c: 'birch', f: 'birch', a: 'ral5024', d: 'birch', k: 'birch' },
  { c: 'ral9001', f: 'smoked', a: 'ral3012', d: 'smoked', k: 'smoked' },
  { c: 'ral7035', f: 'ral6011', a: 'oak', d: 'oak', k: 'ral6011' },
  { c: 'ral9010', f: 'ral5014', a: 'walnut', d: 'walnut', k: 'ral5014' },
  { c: 'ral9005', f: 'black', a: 'oak', d: 'oak', k: 'black' },
  { c: 'ral1013', f: 'ral1019', a: 'ral8025', d: 'walnut', k: 'ral1019' },
  { c: 'ral9002', f: 'walnut', a: 'ral1034', d: 'walnut', k: 'walnut' },
  { c: 'ral9016', f: 'ral6021', a: 'ral3014', d: 'oak', k: 'ral6021' },
  { c: 'ral9010', f: 'ral7044', a: 'ral5014', d: 'oak', k: 'ral7044' }
];
const MINI_HANDLES = [
  'hole',
  'slot',
  'groove',
  'woodbar',
  'woodpull',
  'woodknob',
  'woodblock',
  'woodcup',
  'edge',
  'profile',
  'leather'
];
const pick = (r, a) => a[(r() * a.length) | 0],
  rint = (r, a, b) => a + Math.floor(r() * (b - a + 1)),
  r10 = v => Math.round(v / 10) * 10;
function randomFinishes(st, r) {
  const p = pick(r, PALETTES);
  st.mat.carcass.fin = st.mat.shelf.fin = st.mat.back.fin = p.c;
  st.mat.front.fin = p.f;
  st.mat.skirt.fin = p.k;
  st.mat.desk.fin = p.d;
  st.opts.handle = pick(r, MINI_HANDLES);
  st.opts.handleSize = pick(r, ['S', 'M', 'M', 'L', 'XL']);
  st.opts.handleWood = pick(r, Object.keys(WOODS));
  st.sections.forEach(s =>
    (s.zones || []).forEach(z => {
      z.fin = '';
      z.fins = [];
      z.inFin = '';
      if (z.type === 'open' && r() < 0.4) z.inFin = p.a;
      if ((z.type === 'closed' || z.type === 'drawers') && !z.fabric && r() < 0.1) z.fin = p.a;
      if (z.box) z.boxFin = r() < 0.5 ? '' : p.a;
      if (z.fabric || z.grille) z.fabricCol = pick(r, ['charcoal', 'oatmeal', 'stone', 'olive', 'navy']);
    })
  );
  return fitTypes(st);
}
function zonesFor(type, hAv, w, r) {
  const sh = h => Math.max(0, Math.min(6, Math.round(h / 340) - 1));
  const fab = () => r() < 0.12;
  switch (type) {
    case 'low':
      return [
        Z('closed', { shelves: hAv > 700 ? 1 : 0, doors: w > 600 ? 2 : 1, hinge: pick(r, ['L', 'R']), fabric: fab() })
      ];
    case 'lowdrawers':
      return hAv > 900
        ? [Z('drawers', { h: r10(Math.min(600, hAv * 0.5)), count: hAv > 1100 ? 3 : 2 }), Z('open', { shelves: 1 })]
        : [Z('drawers', { count: 2 })];
    case 'lowopen':
      return [Z('open', { shelves: Math.max(1, sh(hAv)) })];
    case 'cupboard':
      return [Z('closed', { shelves: sh(hAv), fabric: fab() })];
    case 'open':
      return [Z('open', { shelves: Math.max(2, sh(hAv)) })];
    case 'drawers': {
      const dh = r10(500 + r() * 250);
      return [Z('drawers', { h: dh, count: dh > 650 ? 4 : 3 }), Z('closed', { shelves: sh(hAv - dh) })];
    }
    case 'split': {
      const bh = r10(700 + r() * 250),
        oh = r10(Math.min(hAv - bh - 400, 350 + r() * 250));
      return oh > 250
        ? [
            Z('closed', { h: bh, shelves: 1, fabric: fab() }),
            Z('open', { h: oh, shelves: 0, box: r() < 0.3 }),
            Z('closed', { shelves: sh(hAv - bh - oh - 60) })
          ]
        : [Z('closed', { h: bh, shelves: 1 }), Z('open', { shelves: sh(hAv - bh) })];
    }
    case 'wardrobe':
      return [Z('closed', { rail: true, shelves: 1 })];
    case 'wardrobeDrawers':
      return [
        Z('drawers', { h: r10(560 + r() * 140), count: 3 }),
        Z('closed', { rail: true, shelves: hAv > 2000 ? 1 : 0 })
      ];
    case 'speaker':
      return [
        Z('closed', { h: r10(520 + r() * 80), shelves: 1, doors: 1, fabric: r() < 0.4 }),
        Z('speaker', { h: r10(400 + r() * 60), grille: r() < 0.6, tweeter: r() < 0.7 ? 52 : 0 }),
        Z('open', { shelves: 2 })
      ];
    case 'tv': {
      const oh = r10(760 + r() * 140),
        inch = Math.max(0, Math.floor(Math.min((w - 80) / 22.14, (oh - 80) / 12.45) / 5) * 5),
        tv = inch >= 32 ? Math.min(inch, 85) : 0;
      return [
        Z('drawers', { h: r10(400 + r() * 80), count: 2 }),
        Z('opening', { h: oh, tv, box: r() < 0.65 }),
        Z('closed', { shelves: 0 })
      ];
    }
    case 'desk':
      return [Z('open', { h: r10(560 + r() * 160), shelves: 0, box: r() < 0.25 }), Z('closed', { shelves: 1 })];
    case 'dog':
      return hAv > 1250
        ? [
            Z('closed', { h: 820, dog: pick(r, Object.keys(DOGS)), doors: 1, shelves: 0 }),
            Z(hAv > 1700 && r() < 0.5 ? 'open' : 'closed', {
              h: hAv > 1700 ? r10(380 + r() * 120) : null,
              shelves: hAv > 1700 ? 0 : 1
            }),
            ...(hAv > 1700 ? [Z('closed', { shelves: 1 })] : [])
          ]
        : [Z('closed', { dog: pick(r, ['arch', 'round', 'square', 'house']), doors: 1, shelves: 0 })];
    case 'laundry':
      return hAv >= 2080
        ? [
            Z('drawers', { h: 300, count: 1 }),
            Z('opening', { h: 1750, look: 'stack', grommet: false }),
            ...(hAv > 2250 ? [Z('closed', { shelves: hAv > 2600 ? 1 : 0, vent: true })] : [])
          ]
        : [
            Z('drawers', { h: 300, count: 1 }),
            Z('opening', { h: 880, look: 'washer', grommet: false }),
            ...(hAv > 1400 ? [Z('closed', { shelves: 1, vent: true })] : [])
          ];
    case 'bed':
      return hAv > 2350
        ? [Z('opening', { h: 2120, look: 'bed', grommet: false }), Z('closed', { shelves: 0 })]
        : [Z('opening', { look: 'bed', grommet: false })];
    case 'utility':
      return [Z('closed', { shelves: 1, util: true, vent: true })];
    case 'pantry': {
      const ph = Math.min(1950, hAv - (hAv > 2150 ? 320 : 0));
      return hAv > 2150
        ? [
            Z('closed', { h: r10(ph), shelves: 0, doors: 1, fit: 'larder' }),
            Z('closed', { shelves: hAv - ph > 600 ? 1 : 0 })
          ]
        : [Z('closed', { shelves: 0, doors: 1, fit: 'larder' })];
    }
    case 'fridge': {
      const NS = [1945, 1780, 1580, 1400, 1225, 1025, 880],
        std = NS.find(v => hAv - v >= 250) || NS.find(v => v <= hAv) || 880;
      return hAv - std >= 250
        ? [Z('closed', { h: std + FRIDGE_PAD, shelves: 0, doors: 1, fridge: true }), Z('closed', { shelves: 0 })]
        : [Z('closed', { shelves: 0, doors: 1, fridge: true })];
    }
    case 'oven':
      return hAv > 1700
        ? [
            Z('drawers', { h: 800, count: 2 }),
            Z('opening', { h: 595, look: 'oven', grommet: false }),
            Z('closed', { shelves: hAv > 2200 ? 1 : 0 })
          ]
        : [
            Z('drawers', { h: r10(Math.max(300, hAv - 640)), count: 2 }),
            Z('opening', { h: 595, look: 'oven', grommet: false })
          ];
    case 'seat':
      return hAv > 1500
        ? [
            Z('seat', {
              h: 420,
              count: w > 900 ? 2 : 1,
              fabricCol: pick(r, ['oatmeal', 'oatmeal', 'sage', 'charcoal'])
            }),
            Z('open', { h: r10(600 + r() * 150), shelves: 0 }),
            Z('closed', { shelves: hAv > 2000 ? 1 : 0 })
          ]
        : [Z('seat', { h: 420, count: w > 900 ? 2 : 1, fabricCol: 'oatmeal' }), Z('open', { shelves: 0 })];
  }
  return [Z('closed', { shelves: 2 })];
}
const MUSTS = {
  desk: { n: 'Desk', w: 1200, min: 1000, minH: 1350, t: 'desk' },
  tv: { n: 'TV niche', w: 1260, min: 700, minH: 1500, t: 'tv' },
  speakers: { n: 'Speakers (pair)', w: 380, min: 300, minH: 1300, t: 'speaker', pair: true },
  seat: { n: 'Window seat', w: 1200, min: 700, minH: 450, t: 'seat' },
  wardrobe: { n: 'Wardrobe with rail', w: 900, min: 500, minH: 1700, t: 'wardrobe' },
  drawers: { n: 'Drawer column', w: 600, min: 400, minH: 700, t: 'drawers' },
  open: { n: 'Open bookcase', w: 700, min: 340, minH: 900, t: 'open' },
  dog: { n: 'Dog den (big dog)', w: 1180, min: 1000, minH: 860, t: 'dog' },
  screen: { n: 'Projector screen', wall: 1, w: 0, min: 0, minH: 0, t: 'screen' },
  ladder: { n: 'Library ladder', wall: 1, w: 0, min: 0, minH: 0, t: 'ladder' },
  laundry: { n: 'Washer + dryer', w: 660, min: 640, minH: 1250, t: 'laundry' },
  bed: { n: 'Fold-down bed', w: 1000, min: 980, minH: 2150, t: 'bed' },
  utility: { n: 'Utility cupboard', w: 500, min: 450, minH: 1400, t: 'utility' },
  pantry: { n: 'Pantry pull-out', w: 564, min: 470, maxW: 600, minH: 1300, t: 'pantry' },
  fridge: { n: 'Built-in fridge', w: 564, min: 560, maxW: 568, minH: 1100, t: 'fridge' },
  oven: { n: 'Built-in oven', w: 564, min: 560, maxW: 568, minH: 1350, t: 'oven' }
};
function mustList(st, r) {
  r = r || Math.random;
  return (Array.isArray(st.opts.must) ? st.opts.must : [])
    .filter(m => m && MUSTS[m.type] && m.on !== false)
    .map(m => {
      const D = MUSTS[m.type];
      let lo = +m.wMin > 0 ? +m.wMin : 0,
        hi = +m.wMax > 0 ? +m.wMax : 0;
      if (!lo && !hi && +m.w > 0) lo = hi = +m.w;
      if (lo && hi && hi < lo) {
        const t = lo;
        lo = hi;
        hi = t;
      }
      const size = m.type === 'tv' && +m.size > 0 ? +m.size : 0;
      if (D.wall) return { type: m.type, pos: m.pos || 'any', w: null, lo, hi, size: 0, D };
      if (lo) lo = Math.max(D.min, lo);
      if (hi) hi = Math.max(D.min, hi);
      const tvW = size ? r10(size * 22.14 + 140) : 0;
      if (tvW) {
        lo = Math.max(lo || 0, tvW);
        if (hi && hi < lo) hi = lo;
      }
      let w = null;
      if (lo && hi) w = r10(lo + r() * (hi - lo));
      else if (lo) w = r10(lo + r() * Math.max(0, Math.max(D.w, lo) * 1.25 - lo));
      else if (hi)
        w = r10(
          Math.min(hi, Math.max(D.min, D.w * 0.8)) + r() * Math.max(0, hi - Math.min(hi, Math.max(D.min, D.w * 0.8)))
        );
      if (w != null) {
        if (lo) w = Math.max(lo, w);
        if (hi) w = Math.min(hi, w);
      }
      if (D.maxW && !(+m.wMin > 0) && !(+m.wMax > 0) && !(+m.w > 0)) {
        lo = D.min;
        hi = D.maxW;
        w = D.w;
      }
      return {
        type: m.type,
        pos: m.pos || 'any',
        w,
        lo: lo || D.min,
        hi: hi || 0,
        size,
        D,
        hMin: +m.hMin > 0 ? +m.hMin : 0
      };
    });
}
function splitCols(N, spans) {
  const tot = spans.reduce((a, b) => a + b, 0) || 1;
  let ns = spans.map(sp => Math.max(1, Math.round((N * sp) / tot)));
  let sum = ns.reduce((a, b) => a + b, 0);
  while (sum > N) {
    let bi = -1;
    ns.forEach((v, i) => {
      if (v > 1 && (bi < 0 || spans[i] / v < spans[bi] / ns[bi])) bi = i;
    });
    if (bi < 0) break;
    ns[bi]--;
    sum--;
  }
  while (sum < N) {
    let bi = 0;
    ns.forEach((v, i) => {
      if (spans[i] / (v + 1) > spans[bi] / (ns[bi] + 1)) bi = i;
    });
    ns[bi]++;
    sum++;
  }
  return ns;
}
function applyColumns(base, N) {
  const st = JSON.parse(JSON.stringify(base)),
    G = build(st),
    per = G.boxes ? 2 * G.tc : G.tc,
    runs = [];
  let cur = null;
  st.sections.forEach((sc, i) => {
    const q = G.secs[i];
    if (!q) return;
    if (sc.base === 'panel' || sc.base === 'door' || (sc.base === 'desk' && sc.pinX != null && sc.pinX !== '')) {
      if (cur) {
        runs.push(cur);
        cur = null;
      }
      runs.push({ fixed: sc });
    } else {
      if (!cur) cur = { secs: [], ws: [] };
      cur.secs.push(sc);
      cur.ws.push(q.w);
    }
  });
  if (cur) runs.push(cur);
  const cr = runs.filter(x => x.secs);
  if (!cr.length) return st;
  const spans = cr.map(x => x.ws.reduce((a, b) => a + b, 0) + (x.ws.length - 1) * per),
    ns = splitCols(N, spans);
  const pool = cr.flatMap(x => x.secs).filter(sc => sc.base !== 'desk'),
    desks = cr.flatMap(x => x.secs).filter(sc => sc.base === 'desk');
  let pi = 0,
    di = 0;
  const out = [];
  runs.forEach(x => {
    if (x.fixed) {
      out.push(x.fixed);
      return;
    }
    const k = cr.indexOf(x),
      n = ns[k],
      sp = spans[k],
      colW = (sp - (n - 1) * per) / n,
      hasDesk = x.secs.some(sc => sc.base === 'desk') && di < desks.length;
    const cols = [];
    for (let j = 0; j < n; j++) {
      const src = pool.length ? pool[pi++ % pool.length] : Sec({ zones: [Z('closed', { shelves: 2 })] });
      const c = JSON.parse(JSON.stringify(src));
      c.id = uid();
      c.w = null;
      cols.push(c);
    }
    if (hasDesk) {
      const d = JSON.parse(JSON.stringify(desks[di++]));
      const c0 = Math.floor((n - 1) / 2),
        two = colW < 990 && n >= 2;
      if (two) {
        cols.splice(c0, 2, d);
        d.w = Math.round(2 * colW + per);
        cols.forEach(c => {
          if (c !== d) c.w = Math.round(colW);
        });
      } else {
        cols[c0] = d;
        d.w = null;
      }
    }
    out.push(...cols);
  });
  st.sections = out;
  const lastCab = [...out].reverse().find(sc => sc.base !== 'panel' && sc.base !== 'door' && sc.base !== 'desk');
  if (lastCab && out.some(sc => sc.w)) lastCab.w = null;
  return st;
}
function randomLayout(base, r) {
  const st = JSON.parse(JSON.stringify(base)),
    R = st.room,
    K = st.skirt,
    tc = +st.mat.carcass.t,
    boxes = st.opts.construct === 'boxes',
    W = +R.W,
    per = boxes ? 2 * tc : tc;
  const probe = build(Object.assign({}, st, { sections: [Sec({ zones: [Z('open')] })] })),
    ceilAt = probe.ceilAt;
  const hAt = (a, b) => {
    let m = Math.min(ceilAt(a), ceilAt(b));
    probe.cps.forEach(p => {
      if (p.x > a && p.x < b) m = Math.min(m, p.y);
    });
    probe.beams.forEach(bm => {
      if (bm.x < b && bm.x + bm.w > a) m = Math.min(m, bm.bottom);
    });
    return m;
  };
  // keep panel walls (shafts) where they are; fill the runs between them
  const G0 = build(base),
    runs = [];
  let cur = null;
  (base.sections.length ? base.sections : [Sec({})]).forEach((sc, i) => {
    const q = G0.secs[i];
    if ((sc.base === 'panel' || sc.base === 'door' || (sc.base === 'desk' && sc.pinX != null && sc.pinX !== '')) && q) {
      if (cur) {
        runs.push(cur);
        cur = null;
      }
      runs.push({ panel: JSON.parse(JSON.stringify(sc)), w: q.w });
    } else if (q) {
      if (!cur) cur = { x0: q.lx, ws: [] };
      cur.ws.push(q.w);
    }
  });
  if (cur) runs.push(cur);
  // empty wall left over from an earlier layout (before a pinned part, or at the right end) goes back to the stretch of cabinets next to it, so every shuffle fills the wall
  {
    const qs = G0.secs.filter(Boolean),
      gaps = [];
    for (let j = 1; j < qs.length; j++) gaps.push(qs[j].lx - qs[j - 1].rx);
    const c0 = gaps.length ? Math.max(0, Math.min(...gaps)) : 0;
    let ri = -1,
      prevCab = null;
    (base.sections.length ? base.sections : []).forEach((sc, i) => {
      const q = G0.secs[i];
      if (!q) return;
      const fixed =
        sc.base === 'panel' || sc.base === 'door' || (sc.base === 'desk' && sc.pinX != null && sc.pinX !== '');
      if (i > 0 && G0.secs[i - 1]) {
        const ex = q.lx - G0.secs[i - 1].rx - c0;
        if (ex > 5 && fixed && prevCab) prevCab.ws[prevCab.ws.length - 1] += ex;
      }
      if (fixed) {
        ri++;
        prevCab = null;
      } else {
        if (!prevCab) {
          ri++;
          prevCab = runs.filter(x => !x.panel)[runs.slice(0, ri + 1).filter(x => !x.panel).length - 1] || null;
        }
      }
    });
    const lastQ = qs[qs.length - 1],
      lastRun = runs[runs.length - 1];
    if (lastQ && lastRun && !lastRun.panel) {
      const ex = W - +K.side - lastQ.rx - (boxes ? 0 : tc);
      if (ex > 5) lastRun.ws[lastRun.ws.length - 1] += ex;
    }
  }
  if (!runs.length) runs.push({ x0: +K.side, ws: [W - 2 * K.side - 2 * tc] });
  const nv_ = neverSet(base);
  let mediaUsed = nv_.has('tv') || nv_.has('speakers'),
    deskUsed = nv_.has('desk') || base.sections.some(sc => sc.base === 'desk' && sc.pinX != null && sc.pinX !== '');
  const out = [];
  const wmRaw = st.opts.wmode || 'mixed',
    WF = wmRaw === 'fixed' ? Math.min(1500, Math.max(250, Math.round(+st.opts.wFix || 600))) : 0,
    WMN = WF ? 0 : Math.max(0, +st.opts.wMin || 0),
    WMX0 = WF ? 0 : Math.max(0, +st.opts.wMax || 0),
    WMX = WMX0 && WMX0 >= Math.max(WMN, 250) ? WMX0 : 0;
  const NC = WF ? 0 : +st.opts.cols || 0;
  const cruns = runs.filter(x => !x.panel),
    cspans = cruns.map(x => x.ws.reduce((a, b) => a + b, 0) + (x.ws.length - 1) * per),
    cN = NC ? splitCols(NC, cspans) : null;
  // must-haves: give every wanted item a run (stretch of wall between fixed parts)
  const mustAll = mustList(st, r),
    musts = mustAll.filter(m => !m.D.wall);
  st._mustMiss = [];
  {
    const ms = mustAll.find(m => m.type === 'screen');
    if (ms)
      st.opts.screen = Object.assign(
        { show: 'up' },
        st.opts.screen || {},
        { on: true },
        { w: null, diag: null, wMin: ms.lo || null, wMax: ms.hi || null }
      );
  }
  {
    const room = cspans.map(v => v),
      ctr = cruns.map((x, j) => x.x0 + cspans[j] / 2);
    cruns.forEach(x => (x.must = []));
    const order = m => (m.type === 'tv' ? 0 : m.type === 'desk' ? 1 : m.type === 'speakers' ? 2 : 3);
    musts
      .slice()
      .sort((a, b) => order(a) - order(b))
      .forEach(m => {
        const need = ((m.w || m.D.w) + per) * (m.D.pair ? 2 : 1);
        let pref = cruns.map((_, j) => j);
        const tvRun = m.type === 'speakers' ? cruns.findIndex(x => x.must.some(o => o.type === 'tv')) : -1;
        if (tvRun >= 0) pref = [tvRun];
        else if (m.pos === 'left') pref.sort((a, b) => a - b);
        else if (m.pos === 'right') pref.sort((a, b) => b - a);
        else if (m.pos === 'centre') pref.sort((a, b) => Math.abs(ctr[a] - W / 2) - Math.abs(ctr[b] - W / 2));
        else pref.sort((a, b) => room[b] - room[a]);
        if (m.hMin) {
          const tall = j => {
            const x = cruns[j];
            let mx = 0;
            for (let xx = x.x0; xx <= x.x0 + cspans[j]; xx += 40) mx = Math.max(mx, ceilAt(xx));
            return mx - +K.top >= m.hMin;
          };
          const t_ = pref.filter(tall);
          if (t_.length) pref = [...t_, ...pref.filter(j => !t_.includes(j))];
        }
        let j = pref.find(j => room[j] >= need);
        const mul = m.D.pair ? 2 : 1;
        if (j == null && m.w && m.lo < m.w) {
          const k2 = pref.find(j => room[j] >= (m.lo + per) * mul);
          if (k2 != null) {
            j = k2;
            m = Object.assign({}, m, { w: Math.max(m.lo, Math.floor((room[j] / mul - per - 10) / 10) * 10) });
          }
        }
        if (j == null) {
          j = pref.slice().sort((a, b) => room[b] - room[a])[0];
          if (j == null || room[j] < (m.D.min + per) * mul) {
            st._mustMiss.push(m.D.n);
            return;
          }
          m = Object.assign({}, m, { w: Math.max(m.D.min, Math.floor(room[j] / mul - per - 10)) });
          st._mustMiss.push(m.D.n + ' (made narrower than your minimum to fit)');
        }
        cruns[j].must.push(m);
        room[j] -= ((m.w || m.D.w) + per) * (m.D.pair ? 2 : 1);
      });
    if (musts.some(m => m.type === 'desk')) deskUsed = true;
    if (musts.some(m => m.type === 'tv' || m.type === 'speakers')) mediaUsed = true;
  }
  runs.forEach(run => {
    if (run.panel) {
      run.panel.w = Math.round(run.w);
      out.push({ sec: run.panel });
      return;
    }
    const span = run.ws.reduce((a, b) => a + b, 0) + (run.ws.length - 1) * per;
    let k = cN ? cN[cruns.indexOf(run)] : Math.max(1, Math.round(span / (520 + r() * 260)));
    while (!cN && k > 1 && (span - (k - 1) * per) / k < 340) k--;
    const wm = wmRaw === 'two' ? 'mixed' : wmRaw,
      eq = wm === 'same';
    if (!cN && (WMN || WMX)) {
      const kmax = WMN ? Math.max(1, Math.floor((span + per) / (WMN + per))) : 99,
        kmin = WMX ? Math.ceil((span + per) / (WMX + per)) : 1;
      k = Math.max(Math.min(k, kmax), Math.min(kmin, kmax));
    }
    if (!eq && !cN && !WMN && !WMX && k >= 4 && k % 2 === 0 && r() < 0.6 && (span - k * per) / (k + 1) >= 380) k++;
    const MU = run.must || [],
      slots = MU.reduce((a, m) => a + (m.D.pair ? 2 : 1), 0);
    const WFr = WF || (eq ? (span - (k - 1) * per) / k : 0);
    if (WFr)
      MU.forEach(m => {
        const want = m.w || m.D.w;
        let n = m.D.pair ? 1 : Math.max(1, Math.min(2, Math.round((want + per) / (WFr + per))));
        while (!m.D.pair && n < 4 && n * WFr + (n - 1) * per < m.D.min - 1) n++;
        m.nmod = n;
        m.w = Math.round(n * WFr + (n - 1) * per);
      });
    const mw = MU.reduce((a, m) => a + (m.w || m.D.w) * (m.D.pair ? 2 : 1), 0);
    if (slots) {
      const hasSp = MU.some(m => m.D.pair);
      k = Math.max(k, slots, hasSp ? 3 : 1);
      while (k > Math.max(slots, hasSp ? 3 : 1) && (span - (k - 1) * per - mw) / (k - slots) < 340) k--;
      if (k === slots && span - (k - 1) * per - mw >= 340) k++;
      if (k > slots && (span - (k - 1) * per - mw) / (k - slots) < 200) k = Math.max(slots, hasSp ? 3 : 1);
      if (!cN)
        while (
          k < slots + 8 &&
          (span - (k - 1) * per - mw) / Math.max(1, k - slots) > (WMX || 780) &&
          (span - k * per - mw) / (k + 1 - slots) >= Math.max(340, WMN)
        )
          k++;
    }
    let fx = null;
    if (WFr) {
      const nf = Math.max(slots ? 0 : 1, Math.floor((span - mw - (slots - 1) * per) / (WFr + per) + 1e-6)),
        rem = span - mw - (slots + nf - 1) * per - nf * WFr,
        fillOk = rem - per >= 200;
      if (!slots || rem >= 0) {
        fx = { fill: fillOk ? rem - per : 0, extra: fillOk ? 0 : rem };
        k = slots + nf + (fillOk ? 1 : 0);
      }
    }
    const fullW = slots > 0 && k > slots && (span - (k - 1) * per - mw) / (k - slots) >= 340;
    const clear = span - (k - 1) * per,
      specs = [];
    for (let i = 0; i < k; i++) specs.push({ wt: 1, type: null });
    if (slots) {
      const c = (k - 1) / 2,
        free = () => specs.map((_, i) => i).filter(i => !specs[i].type),
        hEst = i => hAt(run.x0 + (span * i) / k + 20, run.x0 + (span * (i + 1)) / k - 20) - +K.top - +K.plinth - 2 * tc;
      const put = (i, m) => {
        specs[i].type = m.D.t;
        specs[i].mw = 1;
        specs[i].must = m;
        specs[i].w = Math.round(
          m.w || (fx || fullW ? m.D.w : Math.min(m.D.w, Math.max(m.D.min, (span - (k - 1) * per) / k)))
        );
      };
      const rank = (pos, ok) => {
        let f = free().filter(ok);
        if (pos === 'left') f.sort((a, b) => a - b);
        else if (pos === 'right') f.sort((a, b) => b - a);
        else if (pos === 'centre') f.sort((a, b) => Math.abs(a - c) - Math.abs(b - c));
        else f.sort(() => r() - 0.5);
        return f;
      };
      const hasSp = MU.find(m => m.D.pair);
      const put1 = m => {
        const inner = m.type === 'tv' && hasSp ? i => i > 0 && i < k - 1 : () => true;
        const uH = i => {
            const c_ = run.x0 + (span * (i + 0.5)) / k,
              hw = Math.max(m.w || 0, span / k) / 2 + tc;
            return hAt(c_ - hw, c_ + hw) - +K.top;
          },
          needH = i => hEst(i) >= m.D.minH && (!m.hMin || uH(i) >= m.hMin);
        let f = rank(m.pos, i => inner(i) && needH(i));
        if (!f.length && m.hMin) {
          f = free().filter(i => inner(i) && needH(i));
        }
        if (!f.length) {
          f = rank(m.pos, inner).sort((a, b) => hEst(b) - hEst(a));
          if (m.hMin && f.length)
            st._mustMiss.push(
              `${m.D.n} (no spot is ${f0(m.hMin)} mm high — the tallest is about ${f0(Math.floor(uH(f[0]) / 10) * 10)} mm)`
            );
        }
        if (!f.length) f = free();
        if (f.length) put(f[0], m);
      };
      MU.filter(m => !m.D.pair && m.type === 'tv').forEach(put1);
      if (hasSp) {
        const tvI = specs.findIndex(x => x.type === 'tv');
        let a = -1,
          b = -1;
        if (tvI > 0 && tvI < k - 1 && !specs[tvI - 1].type && !specs[tvI + 1].type) {
          a = tvI - 1;
          b = tvI + 1;
        } else {
          const f = free();
          if (f.length >= 2) {
            if (hasSp.pos === 'left') {
              a = f[0];
              b = f.find(i => i > a + 1) ?? f[1];
            } else if (hasSp.pos === 'right') {
              b = f[f.length - 1];
              a = [...f].reverse().find(i => i < b - 1) ?? f[f.length - 2];
            } else {
              const lo = f.filter(i => i < c),
                hi = f.filter(i => i > c);
              if (lo.length && hi.length) {
                a = lo[lo.length - 1];
                b = hi[0];
              } else {
                a = f[0];
                b = f[f.length - 1];
              }
            }
          }
        }
        if (a >= 0 && b >= 0 && a !== b) {
          put(a, hasSp);
          put(b, hasSp);
        } else st._mustMiss.push(hasSp.D.n);
      }
      MU.filter(m => !m.D.pair && m.type !== 'tv').forEach(put1);
    }
    if (fx) {
      const fr = specs.filter(x => !x.type);
      let fi = null;
      if (fx.fill && fr.length) {
        fi = hAt(run.x0, run.x0 + 200) < hAt(run.x0 + span - 200, run.x0 + span) ? fr[0] : fr[fr.length - 1];
        fi.w = Math.round(fx.fill);
      }
      const bx = fr.filter(x => x !== fi);
      bx.forEach(x => (x.w = Math.floor(WFr)));
      if (Math.abs(fx.extra) >= 2 && bx.length) bx[bx.length - 1].w = Math.max(200, Math.round(WFr + fx.extra));
    }
    if (wm === 'free') {
      specs.forEach(x => (x.wt = 0.75 + r() * 0.6));
      const pat = pick(r, ['mirror', 'mirror', 'rhythm', 'wideCentre']);
      for (let i = 0; i < k; i++) {
        const j = k - 1 - i;
        if (j < i) specs[i].wt = specs[j].wt;
        else if (pat === 'rhythm') specs[i].wt = i % 2 ? 0.8 : 1.2;
        else if (pat === 'wideCentre') specs[i].wt = Math.abs(i - (k - 1) / 2) < 0.6 ? 1.5 : 1;
      }
    }
    if (wm === 'mixed' && k >= 2) {
      const sizes = pick(
          r,
          wmRaw === 'two'
            ? [
                [0.7, 1],
                [1, 1.45],
                [0.6, 1.1],
                [1, 1.7]
              ]
            : [
                [0.65, 1, 1.4],
                [0.75, 1, 1.6],
                [0.7, 1, 1.3],
                [0.65, 1, 1.4],
                [1, 1.45]
              ]
        ),
        c = (k - 1) / 2,
        half = Math.ceil(k / 2);
      const pat = pick(r, ['wideCentre', 'narrowEnds', 'rhythm', 'steps', 'ends']);
      for (let i = 0; i < half; i++) {
        const dc = Math.abs(i - c);
        let si;
        if (pat === 'wideCentre') si = dc < 0.6 ? sizes.length - 1 : sizes.length > 2 && dc < 1.6 ? 1 : 0;
        else if (pat === 'narrowEnds') si = i === 0 ? 0 : sizes.length - 1;
        else if (pat === 'rhythm') si = i % 2 ? 0 : sizes.length - 1;
        else if (pat === 'ends') si = i === 0 ? sizes.length - 1 : 0;
        else si = Math.min(sizes.length - 1, Math.floor((i * sizes.length) / half));
        specs[i].wt = sizes[si];
        specs[k - 1 - i].wt = sizes[si];
      }
    }
    const midH = hAt(run.x0 + span * 0.3, run.x0 + span * 0.7);
    if (
      !mediaUsed &&
      !WMN &&
      !WMX &&
      wm === 'free' &&
      k >= 5 &&
      k % 2 === 1 &&
      midH > 2050 &&
      clear > 2400 &&
      [-1, 0, 1].every(d => !specs[(k - 1) / 2 + d].type) &&
      r() < 0.55
    ) {
      mediaUsed = true;
      const m = (k - 1) / 2;
      const sw = r10(360 + r() * 40);
      specs[m - 1].type = 'speaker';
      specs[m - 1].w = sw;
      specs[m].type = 'tv';
      specs[m].w = r10(Math.min(1500, Math.max(1000, clear * 0.35)));
      specs[m + 1].type = 'speaker';
      specs[m + 1].w = sw;
    }
    const fixed = specs.reduce((a, x) => a + (x.w || 0), 0),
      free = specs.filter(x => !x.w),
      wsum = free.reduce((a, x) => a + x.wt, 0);
    free.forEach(x => (x.w = Math.floor(((clear - fixed) * x.wt) / wsum)));
    if (wm === 'mixed' && free.some(x => x.w < 340)) {
      const mn = Math.min(...free.map(x => x.wt)),
        unit = (clear - fixed) / wsum;
      if (unit * mn < 340) {
        const tgt = 340 / unit;
        free.forEach(x => (x.wt = Math.max(x.wt, tgt)));
        const ws2 = free.reduce((a, x) => a + x.wt, 0);
        free.forEach(x => (x.w = Math.floor(((clear - fixed) * x.wt) / ws2)));
      }
    }
    if ((WMN || WMX) && free.length && free.some(x => (WMN && x.w < WMN) || (WMX && x.w > WMX))) {
      const lo = WMN || 0,
        hi = WMX || 1e9,
        cl = () => free.forEach(x => (x.w = Math.max(lo, Math.min(hi, x.w))));
      cl();
      for (let it = 0; it < 8; it++) {
        const d = clear - fixed - free.reduce((a, x) => a + x.w, 0);
        if (Math.abs(d) < free.length) break;
        const adj = free.filter(x => (d > 0 ? x.w < hi - 1 : x.w > lo + 1));
        if (!adj.length) break;
        adj.forEach(x => (x.w = Math.floor(x.w + d / adj.length)));
        cl();
      }
      if (Math.abs(clear - fixed - free.reduce((a, x) => a + x.w, 0)) > free.length + 2) {
        const e = Math.floor((clear - fixed) / free.length);
        free.forEach(x => (x.w = e));
      }
    }
    if (!mediaUsed && !WMN && !WMX && wm === 'mixed' && k >= 5 && k % 2 === 1 && midH > 2050 && r() < 0.5) {
      const m = (k - 1) / 2;
      if (
        specs[m].w >= 1000 &&
        specs[m - 1].w >= 330 &&
        specs[m - 1].w <= 470 &&
        [-1, 0, 1].every(d => !specs[m + d].type)
      ) {
        mediaUsed = true;
        specs[m - 1].type = 'speaker';
        specs[m].type = 'tv';
        specs[m + 1].type = 'speaker';
      }
    }
    {
      let drift = clear - specs.reduce((a, x) => a + x.w, 0);
      const fl = specs.filter(x => (!x.type || x.type === 'desk') && !x.mw);
      if (!fl.length && drift > 0) {
        const c_ = specs.filter(x => !(x.must && x.must.D.pair));
        (c_.length ? c_ : specs).forEach(x => fl.push(x));
      } // only fixed items in this stretch: they share the leftover instead of leaving a gap
      const per1 = Math.floor(drift / Math.max(1, fl.length));
      fl.forEach(x => (x.w += per1));
      drift -= per1 * fl.length;
      const ord = specs.map((_, i) => i).sort((a, b) => Math.abs(a - (k - 1) / 2) - Math.abs(b - (k - 1) / 2));
      for (const i of ord) {
        if (drift <= 0) break;
        specs[i].w += 1;
        drift--;
      }
    }
    // appliance columns have a fixed width (a fridge or oven niche is 560–568 mm): give the rest to a neighbour
    specs.forEach((sp, i) => {
      const D = sp.must && sp.must.D;
      if (!D || !D.maxW || sp.w <= D.maxW) return;
      const ex = sp.w - D.w,
        nb = [i + 1, i - 1, i + 2, i - 2].map(j => specs[j]).find(o => o && !(o.must && o.must.D.maxW));
      if (!nb) return;
      sp.w = D.w;
      nb.w += ex;
    });
    let x = run.x0;
    specs.forEach(sp => {
      const a = x + tc,
        b = a + sp.w;
      sp.h = hAt(a, b) - +K.top - +K.plinth - 2 * tc;
      x = boxes ? b + tc : b;
    });
    specs.forEach(sp => {
      if (sp.must && sp.must.hMin) {
        const uh = sp.h + +K.plinth + 2 * tc;
        if (uh < sp.must.hMin - 5 && !st._mustMiss.some(t => t.startsWith(sp.must.D.n)))
          st._mustMiss.push(
            `${sp.must.D.n} (only ${f0(Math.floor(uh / 10) * 10)} mm high where it landed, not ${f0(sp.must.hMin)})`
          );
      }
    });
    if (!deskUsed && r() < 0.5) {
      const cand = specs
        .map((_, i) => i)
        .filter(
          i =>
            !specs[i].type &&
            specs[i].w >= 1000 &&
            specs[i].w <= 1600 &&
            specs[i].h > 1900 &&
            (k % 2 === 0 || Math.abs(i - (k - 1) / 2) < 0.6)
        );
      if (cand.length) {
        cand.sort((a, b) => Math.abs(a - (k - 1) / 2) - Math.abs(b - (k - 1) / 2));
        specs[cand[0]].type = 'desk';
        deskUsed = true;
      } else if (k >= 3 && !WMX && (wm === 'free' || wm === 'same')) {
        const c0 = Math.floor((k - 1) / 2),
          a = specs[c0],
          b = specs[c0 + 1];
        if (a && b && !a.type && !b.type && a.w + b.w + per >= 1000 && Math.min(a.h, b.h) > 1900) {
          a.w = a.w + b.w + per;
          a.h = Math.min(a.h, b.h);
          a.type = 'desk';
          a.merged = true;
          specs.splice(c0 + 1, 1);
          deskUsed = true;
        }
      }
    }
    let prev = null;
    specs.forEach(sp => {
      if (sp.type) return;
      const opts =
        sp.h < 1350
          ? ['low', 'lowdrawers', 'lowopen']
          : sp.h < 1950
            ? ['cupboard', 'open', 'drawers', 'split']
            : ['wardrobe', 'wardrobeDrawers', 'cupboard', 'open', 'drawers', 'split'];
      let t = pick(r, opts);
      if (t === prev && r() < 0.6) t = pick(r, opts);
      if (sp.w > 850 && (t === 'open' || t === 'lowopen')) t = 'cupboard';
      sp.type = t;
      prev = t;
    });
    specs.forEach(sp => {
      const nm =
        sp.must && sp.must.nmod > 1 && (sp.type === 'tv' || sp.type === 'desk')
          ? sp.must.nmod
          : sp.merged && WFr && sp.type === 'desk'
            ? 2
            : 0;
      if (nm) {
        const base = sp.type === 'desk' ? 'desk' : 'cab',
          w1 = Math.floor((sp.w - (nm - 1) * per) / nm),
          lead = Sec({ w: w1, base });
        lead.zones = zonesFor(sp.type, sp.h, sp.w, r);
        const ko = base === 'desk' ? 0 : lead.zones.findIndex(z => z.type === 'opening');
        if (ko >= 0) {
          lead.zones.forEach(z => {
            if (z.type === 'closed') z.doors = 0;
          });
          lead.zones[ko].span = nm - 1;
          if (base === 'desk') {
            lead.zones[0].shelves = 0;
            lead.zones[0].vd = [];
          }
          if (sp.must) lead.must = sp.must.type;
          if (sp.must && sp.must.size && lead.zones[ko].type === 'opening') {
            lead.zones[ko].tv = sp.must.size;
            lead.zones[ko].h = r10(Math.max(lead.zones[ko].h || 0, sp.must.size * 12.45 + 150));
          }
          out.push({ sec: lead });
          for (let j = 1; j < nm; j++) {
            const f = Sec({ w: w1, base });
            f.zones = [Z('closed', {})];
            out.push({ sec: f });
          }
          return;
        }
      }
      const sec = Sec({ w: Math.round(sp.w), base: sp.type === 'desk' ? 'desk' : 'cab' });
      sec.zones = zonesFor(sp.type, sp.h, sp.w, r);
      if (sp.must && sp.must.nmod > 1)
        sec.zones.forEach(z => {
          if (z.type === 'closed' && !z.dog) z.doors = sp.must.nmod * (WFr > 620 ? 2 : 1);
        });
      if (sp.must && sp.w > 850)
        sec.zones.forEach((z, zi) => {
          if (
            z.type === 'closed' &&
            !z.dog &&
            +z.shelves > 0 &&
            !(sec.base === 'desk' && zi === 0) &&
            !(z.vd && z.vd.length)
          ) {
            z.vd = [Math.round(sp.w / 2)];
            z.vdMode = 'even';
            if (!(+z.doors > 0) || +z.doors % 2) z.doors = 0;
          }
        });
      if (sp.must && sp.must.D.pair) {
        if (sp.must._z) {
          sec.zones = JSON.parse(JSON.stringify(sp.must._z));
          sec.zones.forEach(z => (z.id = uid()));
        } else sp.must._z = sec.zones;
      }
      if (sp.must) {
        sec.must = sp.must.type;
        if (sp.must.size) {
          const op = sec.zones.find(z => z.type === 'opening');
          if (op) {
            op.tv = sp.must.size;
            op.h = r10(Math.max(op.h || 0, sp.must.size * 12.45 + 150));
          }
        }
      }
      out.push({ sec });
    });
  });
  st.sections = out.map(o => o.sec);
  const lastCab =
    [...st.sections].reverse().find(sc => sc.base !== 'panel' && sc.base !== 'door' && !sc.must) ||
    (musts.length ? null : [...st.sections].reverse().find(sc => sc.base !== 'panel'));
  if (lastCab) lastCab.w = null;
  if (st.opts.wmode === 'same' && !musts.length && !st.sections.some(sc => sc.base === 'desk'))
    st.sections.forEach(sc => {
      if (sc.base !== 'panel' && sc.base !== 'door') sc.w = null;
    });
  return st;
}
function mustOff() {
  const W = geo.W;
  return (S.opts.must || []).find(m => {
    if (!m || !MUSTS[m.type] || MUSTS[m.type].wall || !['left', 'right', 'centre'].includes(m.pos)) return false;
    const qs = geo.secs.filter(q => S.sections[q.i] && S.sections[q.i].must === m.type);
    if (!qs.length) return true;
    const c = qs.reduce((a, q) => a + (q.bL + q.bR) / 2, 0) / qs.length / W;
    return m.pos === 'left' ? c > 0.5 : m.pos === 'right' ? c < 0.5 : c < 0.25 || c > 0.75;
  });
}
function randomize(mode) {
  return withBuildCache(() => randomize0(mode));
}
function randomize0(mode) {
  if (mode === 'keep' || mode === 'sec') {
    const off = mustOff(),
      key = JSON.stringify(S.opts.must || []) + geo.W;
    if (off && ui.mustTried !== key && (mode === 'keep' || (S.sections[ui.sel] || {}).must === off.type)) {
      ui.mustTried = key;
      toast(
        `Layout reshuffled so the ${MUSTS[off.type].n.toLowerCase()} sits ${off.pos === 'centre' ? 'in the middle' : 'on the ' + off.pos}`
      );
      mode = 'layout';
    }
  }
  const seed = Date.now() % 100000;
  let best = null,
    bs = Infinity;
  if (mode === 'sec') {
    const i = ui.sel,
      q = geo.secs[i];
    if (!q) return;
    if (q.door) return;
    if (q.panel) {
      const sc = S.sections[i];
      sc.panel = Object.assign({}, PANEL_DEF, sc.panel || {}, {
        fun: pick(
          prng(seed),
          FUN.map(f => f[0]).filter(k => k !== 'none' && k !== (sc.panel || {}).fun)
        ),
        seed: seed % 9999
      });
      changed(true);
      return;
    }
    const r = prng(seed + 7),
      hAv = q.minU - (q.desk ? +q.s.deskH : geo.P + geo.tc);
    for (let k = 0; k < 12; k++) {
      const t = q.desk
        ? 'desk'
        : hAv < 1250
          ? pick(r, ['low', 'lowdrawers', 'lowopen'])
          : hAv < 1850
            ? pick(r, ['cupboard', 'open', 'drawers', 'split'])
            : pick(r, ['wardrobe', 'wardrobeDrawers', 'cupboard', 'open', 'drawers', 'split', 'speaker']);
      const trial = JSON.parse(JSON.stringify(S));
      trial.sections[i].zones = zonesFor(t, hAv, q.w, r);
      const w = build(trial).warns.length;
      if (w < bs) {
        bs = w;
        best = trial;
      }
    }
    S = best;
    if (S.ladder && S.ladder.on) S = alignLadder(S);
    ui.zsel = null;
    changed(true);
    return;
  }
  if (mode === 'keep' || mode === 'fin') {
    const key = ui.style && STYLES[ui.style] && Math.random() < 0.6 ? ui.style : pick(prng(seed), STYLE_PICK);
    let best2 = null,
      b2 = Infinity;
    for (let k = 0; k < (mode === 'fin' ? 8 : 16); k++) {
      const st = lockMain(
        mode === 'fin' ? styleColours(S, key, seed + k * 97) : applyStyle(S, key, seed + k * 97, { keepFinish: true }),
        S
      );
      const G_ = build(st),
        w = G_.warns.length * 10 + (G_.railHigh || 0) * 60 + (mode === 'fin' ? 0 : compScore(st, G_, key));
      if (w < b2) {
        b2 = w;
        best2 = st;
      }
      if (mode === 'fin' && w === 0) break;
    }
    if (mode !== 'fin') best2 = slopeFix(snapLines(tidy(alignLines(best2, key))));
    S = mode === 'fin' ? best2 : ladderSense(best2);
    delete S._mustMiss;
    if (S.ladder && S.ladder.on) S = alignLadder(S);
    ui.zsel = null;
    changed(true);
    toast(
      mode === 'fin'
        ? `New colours · ${STYLES[key].name} palette`
        : `New contents · ${STYLES[key].name} rules — widths and colours kept`
    );
    return;
  }
  if (mode === 'keep') {
    let firstTv = true;
    for (let k = 0; k < 30; k++) {
      const r = prng(seed + k * 53),
        trial = JSON.parse(JSON.stringify(S));
      let tvUsed = false;
      geo.secs.forEach((q, i) => {
        if (q.panel || q.door || q.follow != null) return;
        const sc = trial.sections[i],
          hAv = q.minU - (q.desk ? +sc.deskH : geo.P + geo.tc);
        let opts = q.desk
          ? ['desk']
          : hAv < 1250
            ? ['low', 'lowdrawers', 'lowopen']
            : hAv < 1850
              ? ['cupboard', 'open', 'drawers', 'split']
              : ['wardrobe', 'wardrobeDrawers', 'cupboard', 'open', 'drawers', 'split'];
        if (!q.desk && hAv > 1850 && q.w >= 330 && q.w <= 460 && r() < 0.25) opts = ['speaker'];
        if (!q.desk && !tvUsed && hAv > 1900 && q.w >= 1000 && r() < 0.35) {
          opts = ['tv'];
          tvUsed = true;
        }
        let t = pick(r, opts);
        if (q.w > 850 && (t === 'open' || t === 'lowopen')) t = 'cupboard';
        sc.zones = zonesFor(t, hAv, q.w, r);
      });
      const w = build(trial).warns.length;
      if (w < bs) {
        bs = w;
        best = trial;
      }
      if (w === 0 && k > 6) break;
    }
    S = best;
    if (S.ladder && S.ladder.on) S = alignLadder(S);
    ui.zsel = null;
    changed(true);
    toast('New contents — widths and positions kept');
    return;
  }
  if (mode === 'fin') {
    S = randomFinishes(JSON.parse(JSON.stringify(S)), prng(seed + 3));
    changed(true);
    toast('New colours');
    return;
  }
  let sk = null,
    bk = null;
  for (let k = 0; k < 24; k++) {
    const r = prng(seed + k * 101);
    let st = randomLayout(S, r);
    if (mode === 'all') {
      sk = pick(r, STYLE_PICK);
      st = lockMain(applyStyle(st, sk, seed + k * 31, { keepFinish: !!S.opts.lockFin }), S);
    } else {
      sk = ui.style && STYLES[ui.style] ? ui.style : pick(r, STYLE_PICK);
      st = applyStyle(st, sk, seed + k * 31, { keepFinish: true });
    }
    const G = build(st),
      sc =
        G.warns.length * 10 +
        (G.railHigh || 0) * 60 +
        G.warns.filter(w => w.includes('beam')).length * 25 +
        (st._mustMiss || []).length * 80 +
        compScore(st, G, sk);
    if (sc < bs) {
      bs = sc;
      best = st;
      bk = sk;
    }
    if (k >= 12 && bs < 4) break;
  }
  best = snapLines(tidy(alignLines(best, bk)));
  S = ladderSense(best);
  const miss = S._mustMiss || [];
  delete S._mustMiss;
  if (S.ladder && S.ladder.on) S = alignLadder(S);
  S = slopeFix(S);
  ui.sel = 0;
  ui.zsel = null;
  if (bk && mode === 'all') ui.style = bk;
  changed(true);
  const nw = geo.warns.length;
  if (miss.length) {
    toast(`Couldn't fully place: ${miss.join(', ')} — the wall is too short or too low there.`);
    return;
  }
  if (bk) {
    toast(
      `${mode === 'all' ? 'Surprise: ' + STYLES[bk].name : 'New layout · ' + STYLES[bk].name + ' rules'}${nw ? ` · ${nw} design note${nw > 1 ? 's' : ''}` : ''}`
    );
    return;
  }
  toast(nw ? `New layout · ${nw} design note${nw > 1 ? 's' : ''}` : 'New layout — no design issues');
}
/* Composition score — lower is calmer. The visual rules a shuffle is judged on:
   lines that line up, mirrored partners that match, few different column types, weight low, a focal point near the axis, some (not too much) openness. */
function zoneSig(q) {
  return q.desk
    ? 'desk'
    : (q.zones || [])
        .map(zr => {
          const z = zr.z || {};
          return z.type + (z.face === 'glass' ? 'g' : '') + (z.dog ? 'd' : '');
        })
        .join('|');
}
function lineLevels(G, only) {
  const lv = [];
  G.secs.forEach(q => {
    if (q.panel || q.door || q.follow != null || (only && !only(q))) return;
    (q.zones || []).forEach(zr => {
      if (!zr.top && zr.divY) lv.push(zr.divY + (zr.divT || 0) / 2);
    });
  });
  lv.sort((a, b) => a - b);
  const cl = [];
  lv.forEach(y => {
    const c = cl[cl.length - 1];
    if (c && y - c.y1 <= 20) {
      c.y1 = y;
      c.n++;
      c.y = (c.y0 + c.y1) / 2;
    } else cl.push({ y0: y, y1: y, y, n: 1 });
  });
  return cl;
}
function compScore(st, G, key) {
  const qs = G.secs.filter(q => !q.panel && !q.door);
  if (qs.length < 2) return 0;
  let p = 0;
  const comp = !!(STYLES[key] && STYLES[key].comp);
  const cl = lineLevels(G);
  for (let i = 1; i < cl.length; i++) if (cl[i].y0 - cl[i - 1].y1 < 110) p += 9;
  p += Math.max(0, cl.length - 3) * 5 + cl.filter(c => c.n === 1).length * 3;
  const x0 = qs[0].lx,
    x1 = qs[qs.length - 1].rx,
    cx = (x0 + x1) / 2,
    ctr = q => (q.xa + q.xb) / 2,
    used = new Set();
  qs.forEach((a, i) => {
    if (used.has(i)) return;
    if (Math.abs(ctr(a) - cx) < a.w / 2 - 20) {
      used.add(i);
      return;
    }
    const j = qs.findIndex(
      (b, j) => j !== i && !used.has(j) && Math.abs(ctr(a) + ctr(b) - 2 * cx) < 60 && Math.abs(a.w - b.w) < 30
    );
    if (j < 0) {
      p += 0.5;
      return;
    }
    used.add(i);
    used.add(j);
    const b = qs[j];
    if (Math.abs(a.minU - b.minU) > 150) return;
    p += zoneSig(a) === zoneSig(b) ? -1 : 1.5;
  });
  const sigs = new Set(qs.filter(q => q.follow == null).map(zoneSig));
  p += Math.max(0, sigs.size - 5) * 3;
  if (!comp && qs.length >= 4) p += sigs.size === 1 ? 12 : sigs.size === 2 ? 5 : 0; // variety: a wall of identical columns scores badly
  qs.forEach(q => {
    if (q.desk || q.follow != null) return;
    const zs = q.zones || [],
      b = zs[0] && zs[0].z;
    if (
      b &&
      b.type === 'open' &&
      zs.slice(1).some(zr => zr.z && (zr.z.type === 'closed' || zr.z.type === 'drawers') && zr.z.face !== 'glass')
    )
      p += 3;
  });
  if (!comp && key !== 'library' && !(st.opts && st.opts.budget)) {
    let tot = 0,
      op = 0;
    qs.forEach(q =>
      (q.zones || []).forEach(zr => {
        const a = q.w * (zr.h || 0),
          z = zr.z || {};
        tot += a;
        if (z.type === 'open' || z.type === 'opening' || z.face === 'glass') op += a;
      })
    );
    const sh = tot ? op / tot : 0;
    if (sh < 0.16) p += (0.16 - sh) * 90;
    if (sh > 0.55) p += (sh - 0.55) * 60;
  }
  const pinned = (Array.isArray(st.opts.must) ? st.opts.must : []).some(
    m => m && m.type === 'tv' && (m.pos === 'left' || m.pos === 'right')
  );
  if (!pinned)
    G.secs.forEach(q =>
      (q.zones || []).forEach(zr => {
        if (zr.open && zr.z && zr.z.type === 'opening' && q.follow == null)
          p += (Math.abs((zr.open.x0 + zr.open.x1) / 2 - cx) / Math.max(1, (x1 - x0) / 2)) * 2;
      })
    );
  return p;
}
/* pull the stray lines of special columns (TV, speakers, seat…) onto the lines the plain columns share */
function alignLines(st, key) {
  let cur = st,
    G = build(cur),
    w0 = G.warns.length,
    s0 = compScore(cur, G, key);
  for (let it = 0; it < 4; it++) {
    const main = lineLevels(G, q => !q.s.must && !q.desk).filter(c => c.n >= 2);
    if (!main.length) break;
    let done = false;
    for (const q of G.secs) {
      if (done) break;
      if (q.panel || q.door || q.follow != null || q.desk || !q.s.must) continue;
      for (const zr of q.zones) {
        if (zr.top || !zr.divY) continue;
        const y = zr.divY + (zr.divT || 0) / 2,
          m = main.reduce((a, c) => (Math.abs(c.y - y) < Math.abs(a.y - y) ? c : a)),
          d = Math.round(m.y - y);
        if (Math.abs(d) < 12 || Math.abs(d) > 110) continue;
        const t = JSON.parse(JSON.stringify(cur)),
          zs = t.sections[q.i].zones,
          z = zs[zr.k],
          nx = zs[zr.k + 1];
        if (!z || !(+z.h > 0) || +z.h + d < 150) continue;
        z.h = Math.round(+z.h + d);
        if (nx && +nx.h > 0 && zr.k + 1 < zs.length - 1 && nx.type !== 'opening' && +nx.h - d >= 200)
          nx.h = Math.round(+nx.h - d);
        const G2 = build(t),
          s2 = compScore(t, G2, key);
        if (G2.warns.length <= w0 && s2 < s0 - 0.5) {
          cur = t;
          G = G2;
          s0 = s2;
          done = true;
          break;
        }
      }
    }
    if (!done) break;
  }
  if (st._mustMiss) cur._mustMiss = st._mustMiss;
  return cur;
}
