/* ==== 45-styles.js ====
   Design styles: one-tap looks driven by design rules.
*/
/* ===== Design styles: one-tap looks driven by design rules ===== */
/* Rules every style follows:
   1. Shared datum lines — level breaks line up across all columns (calm horizontals).
   2. 60·30·10 colour — a dominant neutral, a secondary front colour, an accent on ≤ ~10 % of the area.
   3. Symmetry — columns that mirror each other around the centre get mirrored contents.
   4. Odd accents — 1 (or 3) accent spots, placed on the axis or in mirrored pairs + the axis.
   5. Weight low — closed and heavy at the bottom, lighter and more open going up.
   6. One handle family per design; proportions from thirds / golden ratio. */
const STYLES = {
  monolith: {
    name: 'Quiet monolith',
    sig: 1,
    comp: 1,
    blurb: 'Flush handleless wall, one lit wood niche',
    sw: ['#B9B2A3', '#5C3A26', '#E9E4D8'],
    pal: [
      {
        c: 'ral7044',
        f: 'ral7044',
        a: ['walnut', 'smoked'],
        k: 'ral7044',
        d: 'walnut',
        h: ['none', 'groove'],
        hw: 'walnut'
      },
      { c: 'ral9001', f: 'ral9001', a: ['oak', 'ral7044'], k: 'ral9001', d: 'oak', h: ['none', 'groove'], hw: 'oak' },
      { c: 'ral7016', f: 'ral7016', a: ['oak', 'walnut'], k: 'ral7016', d: 'oak', h: ['none', 'slot'], hw: 'oak' },
      {
        c: 'smoked',
        f: 'smoked',
        a: ['ral7044', 'ral9001'],
        k: 'smoked',
        d: 'smoked',
        h: ['none', 'edge'],
        hw: 'walnut'
      }
    ],
    DL: [780, 900],
    DH: [2050, 2200]
  },
  band: {
    name: 'Horizon niche',
    sig: 1,
    comp: 1,
    blurb: 'One lit wood band through flush doors',
    sw: ['#E9E4D8', '#5C3A26', '#6F7A66'],
    pal: [
      {
        c: 'ral9001',
        f: 'ral9001',
        a: ['walnut', 'walnut'],
        k: 'ral9001',
        d: 'walnut',
        h: ['none', 'groove'],
        hw: 'walnut'
      },
      { c: 'ral7039', f: 'ral7039', a: ['oak', 'oak'], k: 'ral7039', d: 'oak', h: ['groove', 'none'], hw: 'oak' },
      {
        c: 'ral6013',
        f: 'ral6013',
        a: ['smoked', 'smoked'],
        k: 'ral6013',
        d: 'smoked',
        h: ['none', 'edge'],
        hw: 'walnut'
      },
      { c: 'oak', f: 'oak', a: ['ral7016', 'black'], k: 'oak', d: 'oak', h: ['edge', 'none'], hw: 'oak' }
    ],
    DL: [820, 920],
    DH: [2050, 2200]
  },
  vitrine: {
    name: 'Dark vitrine',
    sig: 1,
    comp: 1,
    blurb: 'Smoked wood, lit glass, pale drawers',
    sw: ['#2B2B2B', '#6B5646', '#B9B2A3'],
    pal: [
      {
        c: 'black',
        f: 'smoked',
        a: ['ral7044', 'ral1013'],
        k: 'black',
        d: 'smoked',
        h: ['edge', 'profile', 'bar'],
        hw: 'walnut'
      },
      {
        c: 'smoked',
        f: 'walnut',
        a: ['ral9001', 'ral7044'],
        k: 'smoked',
        d: 'walnut',
        h: ['edge', 'profile'],
        hw: 'walnut'
      },
      { c: 'ral7016', f: 'ral7016', a: ['oak', 'ral7044'], k: 'ral7016', d: 'oak', h: ['bar', 'edge'], hw: 'oak' }
    ],
    DL: [700, 800],
    DH: [2000, 2150]
  },
  gridlib: {
    name: 'Light grid',
    sig: 1,
    comp: 1,
    blurb: 'Slim open grid with floating boxes',
    sw: ['#E9E4D8', '#C9A26E', '#2B2B2B'],
    pal: [
      { c: 'ral9001', f: 'ral9001', a: ['oak', 'ral7044'], k: 'ral9001', d: 'oak', h: ['none', 'edge'], hw: 'oak' },
      { c: 'oak', f: 'oak', a: ['black', 'ral7016'], k: 'oak', d: 'oak', h: ['none', 'edge'], hw: 'oak' },
      {
        c: 'ral7044',
        f: 'ral7044',
        a: ['walnut', 'black'],
        k: 'ral7044',
        d: 'walnut',
        h: ['none', 'groove'],
        hw: 'walnut'
      }
    ],
    DL: [640, 760],
    DH: [9999, 9999]
  },
  japandi: {
    name: 'Japandi',
    blurb: 'Light oak, cane, low and calm',
    sw: ['#C9A26E', '#E3D9C6', '#9DAE8F'],
    pal: [
      {
        c: 'birch',
        f: 'oak',
        a: ['ral6021', 'ral1013'],
        k: 'oak',
        d: 'oak',
        h: ['woodcup', 'woodpull', 'edge'],
        hw: 'oak'
      },
      {
        c: 'ral9001',
        f: 'oak',
        a: ['ral7044', 'ral6011'],
        k: 'oak',
        d: 'oak',
        h: ['woodcup', 'edge', 'woodpull'],
        hw: 'oak'
      },
      {
        c: 'ral1013',
        f: 'smoked',
        a: ['ral6013', 'ral8025'],
        k: 'smoked',
        d: 'smoked',
        h: ['woodcup', 'edge'],
        hw: 'walnut'
      }
    ],
    DL: [700, 780],
    DH: [1950, 2100]
  },
  shaker: {
    name: 'Modern Shaker',
    blurb: 'Inset painted doors, knobs, two-tone',
    sw: ['#7E8B78', '#C9C3B5', '#B98B57'],
    pal: [
      {
        c: 'ral9001',
        f: 'ral6021',
        two: 'ral9001',
        a: ['ral6013'],
        k: 'ral6021',
        d: 'oak',
        h: ['woodknob', 'knob'],
        hw: 'oak'
      },
      {
        c: 'ral9001',
        f: 'ral7044',
        two: 'ral1013',
        a: ['ral5014'],
        k: 'ral7044',
        d: 'walnut',
        h: ['woodknob'],
        hw: 'walnut'
      },
      {
        c: 'ral9010',
        f: 'ral5011',
        two: 'ral9010',
        a: ['ral1036'],
        k: 'ral5011',
        d: 'oak',
        h: ['knob', 'woodknob'],
        hw: 'oak'
      }
    ],
    DL: [880, 940],
    DH: [2000, 2150]
  },
  midcentury: {
    name: 'Mid-century',
    blurb: 'Walnut, slide doors, warm pops',
    sw: ['#5C3A26', '#CB8E00', '#2F6E73'],
    pal: [
      {
        c: 'walnut',
        f: 'walnut',
        a: ['ral1005', 'ral5021', 'ral2001'],
        k: 'walnut',
        d: 'walnut',
        h: ['woodpull', 'edge', 'profile'],
        hw: 'walnut'
      },
      {
        c: 'ral9001',
        f: 'walnut',
        a: ['ral1005', 'ral6034'],
        k: 'walnut',
        d: 'walnut',
        h: ['edge', 'woodpull'],
        hw: 'walnut'
      },
      { c: 'oak', f: 'oak', a: ['ral2001', 'ral5021'], k: 'oak', d: 'oak', h: ['profile', 'edge'], hw: 'oak' }
    ],
    DL: [650, 760],
    DH: [1800, 2000]
  },
  drenched: {
    name: 'Colour-drenched',
    blurb: 'One deep colour, wall included',
    sw: ['#4C5B3C', '#5B3B33', '#2F3F55'],
    pal: [
      {
        c: 'ral6003',
        f: 'ral6003',
        a: ['ral6003'],
        k: 'ral6003',
        d: 'oak',
        h: ['groove', 'slot', 'none'],
        hw: 'oak',
        wall: 'ral6003'
      },
      {
        c: 'ral3007',
        f: 'ral3007',
        a: ['ral3007'],
        k: 'ral3007',
        d: 'walnut',
        h: ['groove', 'slot'],
        hw: 'walnut',
        wall: 'ral3007'
      },
      {
        c: 'ral5011',
        f: 'ral5011',
        a: ['ral5011'],
        k: 'ral5011',
        d: 'oak',
        h: ['groove', 'none'],
        hw: 'oak',
        wall: 'ral5011'
      },
      {
        c: 'ral8025',
        f: 'ral8025',
        a: ['ral8025'],
        k: 'ral8025',
        d: 'oak',
        h: ['groove', 'woodcup'],
        hw: 'oak',
        wall: 'ral8025'
      },
      {
        c: 'ral7039',
        f: 'ral7039',
        a: ['ral7039'],
        k: 'ral7039',
        d: 'oak',
        h: ['slot', 'none'],
        hw: 'oak',
        wall: 'ral7039'
      }
    ],
    DL: [850, 950],
    DH: [2000, 2200]
  },
  library: {
    name: 'Library wall',
    blurb: 'Shelves to the ceiling + ladder',
    sw: ['#2F4A3A', '#C9A26E', '#E3D9C6'],
    pal: [
      {
        c: 'ral6009',
        f: 'ral6009',
        a: ['ral6009'],
        k: 'ral6009',
        d: 'oak',
        h: ['woodknob', 'woodpull'],
        hw: 'oak',
        inside: 'ral6009'
      },
      {
        c: 'ral9001',
        f: 'ral9001',
        a: ['ral5011'],
        k: 'ral9001',
        d: 'oak',
        h: ['woodknob', 'knob'],
        hw: 'oak',
        inside: 'ral5011'
      },
      { c: 'oak', f: 'oak', a: ['ral3007'], k: 'oak', d: 'oak', h: ['edge', 'woodpull'], hw: 'walnut', inside: 'oak' },
      {
        c: 'ral7016',
        f: 'ral7016',
        a: ['ral7016'],
        k: 'ral7016',
        d: 'walnut',
        h: ['woodknob', 'knob'],
        hw: 'walnut',
        inside: 'ral7016'
      }
    ],
    DL: [800, 900],
    DH: [9999, 9999]
  },
  gallery: {
    name: 'Gallery / display',
    blurb: 'Lit fluted glass, ledges, niches',
    sw: ['#D6E4E2', '#E8E2D6', '#B8995A'],
    pal: [
      { c: 'ral9010', f: 'ral9010', a: ['ral7044'], k: 'ral9010', d: 'oak', h: ['slot', 'hole', 'edge'], hw: 'oak' },
      { c: 'ral7044', f: 'ral7044', a: ['ral1013'], k: 'ral7044', d: 'walnut', h: ['edge', 'slot'], hw: 'walnut' },
      { c: 'oak', f: 'oak', a: ['ral9001'], k: 'oak', d: 'oak', h: ['edge', 'profile'], hw: 'oak' }
    ],
    DL: [850, 950],
    DH: [2000, 2150]
  },
  scandi: {
    name: 'Scandi minimal',
    blurb: 'White + birch, finger holes',
    sw: ['#F1EDE4', '#DCC69E', '#5D7A8C'],
    pal: [
      {
        c: 'ral9010',
        f: 'ral9010',
        a: ['ral5024', 'ral6019', 'ral1034'],
        k: 'ral9010',
        d: 'birch',
        h: ['hole', 'slot', 'none'],
        hw: 'oak'
      },
      { c: 'birch', f: 'ral9016', a: ['ral3015', 'ral5014'], k: 'birch', d: 'birch', h: ['hole', 'groove'], hw: 'oak' },
      { c: 'ral9016', f: 'birch', a: ['ral7035', 'ral6019'], k: 'ral9016', d: 'birch', h: ['slot', 'hole'], hw: 'oak' }
    ],
    DL: [720, 900],
    DH: [1900, 2100]
  },
  playful: {
    name: 'Playful colour block',
    blurb: 'Tones, blocks and coloured cubbies',
    sw: ['#E2C27A', '#C96B4B', '#5D7A8C'],
    pal: [
      {
        c: 'ral9010',
        f: 'ral1034',
        a: ['ral2012', 'ral5024', 'ral6019', 'ral1034'],
        k: 'ral9010',
        d: 'birch',
        h: ['woodknob', 'hole'],
        hw: 'oak',
        tones: ['ral1034', 'ral2012', 'ral5024']
      },
      {
        c: 'birch',
        f: 'ral6019',
        a: ['ral3015', 'ral1034', 'ral5024'],
        k: 'birch',
        d: 'birch',
        h: ['hole', 'woodknob'],
        hw: 'oak',
        tones: ['ral6019', 'ral3015', 'ral1034']
      },
      {
        c: 'ral9016',
        f: 'ral5024',
        a: ['ral1005', 'ral2001', 'ral6034'],
        k: 'ral9016',
        d: 'oak',
        h: ['woodknob', 'woodblock'],
        hw: 'oak',
        tones: ['ral5024', 'ral1005', 'ral2001']
      }
    ],
    DL: [700, 900],
    DH: [1800, 2000]
  }
};
const STYLE_KEYS = Object.keys(STYLES),
  STYLE_PICK = [
    ...STYLE_KEYS,
    ...STYLE_KEYS.filter(k => STYLES[k].sig),
    ...['playful', 'midcentury', 'gallery', 'japandi', 'scandi', 'playful'].filter(k => STYLES[k])
  ];
function okFin(f, d) {
  return FIN[f] ? f : d;
}
function panelDeco(st, r) {
  if (st.opts.shufPanel === false) return;
  st.sections.forEach(sc => {
    if (sc.base !== 'panel') return;
    const pn = Object.assign({}, PANEL_DEF, sc.panel || {}),
      ok = FUN.map(f => f[0]).filter(
        k => k !== 'none' && k !== pn.fun && (k !== 'climb' || (pn.mat === 'ply' && +pn.t >= 18))
      );
    sc.panel = Object.assign(pn, { fun: pick(r, ok), seed: Math.floor(r() * 9999) });
  });
}
function panelColours(st, pal, r) {
  if (st.opts.shufPanel === false) return;
  const ps = st.sections.filter(sc => sc.base === 'panel');
  if (!ps.length) return;
  const fin = okFin(pick(r, [pal.f, pal.f, (pal.a || [])[0], (pal.a || [])[1], pal.d, pal.k, 'birch']), 'birch'),
    f = FIN[fin] || {},
    mat = fin === 'birch' ? 'ply' : f.ral ? 'mdfpaint' : 'veneer';
  ps.forEach(sc => {
    sc.panel = Object.assign({}, PANEL_DEF, sc.panel || {}, { fin, mat, t: MATS[mat].t });
    if (sc.panel.fun === 'climb' && mat !== 'ply')
      sc.panel.fun = pick(r, ['slats', 'frames', 'plants', 'relief', 'ledges', 'mural']);
  });
}
/* TV / media columns are left alone by the style rules (the niche must stay), so vary what sits under and above the niche here */
function varyMedia(st, key, seed) {
  const r = prng(seed + 4242),
    bud = !!(st.opts && st.opts.budget),
    open_ = ['library', 'gridlib', 'gallery', 'scandi', 'playful', 'midcentury', 'japandi'].includes(key),
    glassy = ['vitrine', 'gallery', 'shaker'].includes(key);
  (st.sections || []).forEach(sc => {
    const zs = sc.zones || [],
      ko = zs.findIndex(z => z.type === 'opening');
    if (ko < 0 || sc.base === 'desk' || sc.base === 'door' || (sc.link != null && sc.link !== '')) return;
    const w = +sc.w || 1200;
    if (
      ko > 0 &&
      zs.slice(0, ko).every(z => z.type === 'drawers' || z.type === 'closed' || z.type === 'open') &&
      !zs.slice(0, ko).some(z => z.dog)
    ) {
      const t = pick(
          r,
          bud ? ['doors', 'doors', 'open'] : ['drawers2', 'drawers2', 'drawers1', 'doors', 'open', 'split', 'split']
        ),
        h0 = zs.slice(0, ko).reduce((a, z) => a + (+z.h || 0), 0) + (ko - 1) * 18,
        H = h0 > 250 ? h0 : r10(400 + r() * 80);
      let low;
      if (t === 'drawers2') low = [Z('drawers', { h: H, count: H > 520 ? 3 : 2 })];
      else if (t === 'drawers1') low = [Z('drawers', { h: H, count: 1 })];
      else if (t === 'doors') low = [Z('closed', { h: H, shelves: H > 420 ? 1 : 0, doors: 0 })];
      else if (t === 'open') low = [Z('open', { h: H, shelves: H > 420 ? 1 : 0 })];
      else
        low =
          H >= 420
            ? [Z('drawers', { h: r10(H * 0.5 - 9), count: 1 }), Z('open', { h: H - r10(H * 0.5 - 9) - 18, shelves: 0 })]
            : [Z('drawers', { h: H, count: 2 })];
      zs.splice(0, ko, ...low);
    }
    const k2 = zs.findIndex(z => z.type === 'opening'),
      op = zs[k2];
    if (!bud) op.box = r() < (key === 'monolith' || key === 'drenched' ? 0.35 : 0.6);
    const up = zs.slice(k2 + 1);
    if (up.length && up.every(z => (z.type === 'closed' || z.type === 'open') && !z.dog && !z.rail)) {
      const t = pick(
          r,
          open_
            ? ['open', 'open', 'closed', 'glass', 'strip']
            : glassy
              ? ['glass', 'closed', 'open', 'strip']
              : ['closed', 'closed', 'open', 'strip']
        ),
        acc = up.map(z => z.inFin).find(f => FIN[f]) || '';
      let nu;
      if (t === 'open')
        nu = [Z('open', { shelves: rint(r, 1, 3), inFin: acc, space: pick(r, ['even', 'even', 'bottom']) })];
      else if (t === 'glass' && !bud) nu = [Z('closed', { shelves: rint(r, 1, 2), face: 'glass', doors: 0 })];
      else if (t === 'strip')
        nu = [Z('open', { h: r10(260 + r() * 120), shelves: 0, inFin: acc }), Z('closed', { shelves: 1, doors: 0 })];
      else nu = [Z('closed', { shelves: rint(r, 0, 2), doors: 0 })];
      zs.splice(k2 + 1, up.length, ...nu);
    }
  });
  return st;
}
/* colour-drench: one decision per design, so the accents read as one idea — open shelves and niches with an inside colour get it on sides, top, bottom and dividers too */
const DRENCH_P = {
  drenched: 1,
  playful: 0.9,
  midcentury: 0.8,
  gallery: 0.8,
  japandi: 0.7,
  scandi: 0.65,
  library: 0.6,
  gridlib: 0.6,
  vitrine: 0.65,
  shaker: 0.5,
  band: 0.6,
  monolith: 0.55
};
function drenchPass(st, key, seed) {
  const r = prng(seed + 977),
    M = st.mat,
    all = [];
  (st.sections || []).forEach(sc =>
    (sc.zones || []).forEach(z => {
      if (z.type === 'open' || z.type === 'opening') all.push(z);
    })
  );
  const used = all.map(z => z.inFin).filter(f => FIN[f]),
    acc =
      used[0] || (M.front.fin !== M.carcass.fin && FIN[M.front.fin] && !(st.opts && st.opts.budget) ? M.front.fin : ''),
    on = r() < (DRENCH_P[key] ?? 0.5),
    spread = !!acc && r() < (key === 'drenched' ? 0.9 : 0.45);
  all.forEach(z => {
    if (z.type === 'open') {
      if (spread && !FIN[z.inFin] && !(z.cFin || []).some(f => FIN[f]) && !z.niche) z.inFin = acc;
      z.drench = on && !!FIN[z.inFin];
    } else if (acc && !FIN[z.inFin] && (spread || r() < 0.35)) z.inFin = acc;
  });
  return st;
}
/* tidy: buildability rules every shuffle must meet, whatever the style did
   - no sliver level under the ceiling · no door taller than 2300 mm (it warps and no board is that long) · no empty void behind doors · drawer fronts between 140 and 400 mm high */
/* "Never include": things a shuffle may not put in. "Always include" items and columns you linked are left alone. */
const NEVER = {
  drawers: 'Drawers',
  open: 'Open shelves',
  glass: 'Glass doors',
  tv: 'TV niche',
  speakers: 'Speakers',
  desk: 'Desk',
  seat: 'Window seat',
  wardrobe: 'Hanging rail'
};
function neverSet(st) {
  return new Set(
    (Array.isArray(st.opts && st.opts.never) ? st.opts.never : []).filter(
      k => NEVER[k] && !(st.opts.must || []).some(m => m.type === k)
    )
  );
}
function excludePass(st) {
  const nv = neverSet(st);
  if (!nv.size) return st;
  st.sections.forEach(sc => {
    if (sc.must || sc.base === 'panel' || sc.base === 'door' || (sc.link != null && sc.link !== '')) return;
    const zs = sc.zones || [];
    zs.forEach((z, k) => {
      const shut = sh => {
        const n = Z('closed', { h: z.h, shelves: sh, doors: 0 });
        n.id = z.id;
        zs[k] = n;
      };
      if (z.type === 'drawers' && nv.has('drawers')) return shut(+z.h > 420 || z.h == null ? 1 : 0);
      if (z.type === 'open' && nv.has('open') && !(sc.base === 'desk' && k === 0))
        return shut(Math.max(+z.shelves || 0, +z.h > 0 && +z.h < 420 ? 0 : 1));
      if (z.type === 'opening' && nv.has('tv')) return shut(1);
      if (z.type === 'speaker' && nv.has('speakers')) return shut(1);
      if (z.type === 'seat' && nv.has('seat')) {
        if (nv.has('drawers')) return shut(0);
        const n = Z('drawers', { h: z.h, count: 2 });
        n.id = z.id;
        zs[k] = n;
        return;
      }
      if (z.type === 'closed') {
        if (z.face === 'glass' && nv.has('glass')) z.face = 'flat';
        if (z.rail && nv.has('wardrobe')) {
          z.rail = false;
          z.railH = null;
          z.shelves = Math.max(+z.shelves || 0, 3);
        }
      }
    });
  });
  return st;
}
/* a desk top wider than 1200 mm in thin board flexes: shuffles and the wizard give it a 30 mm top, in every price level */
function deskTopFix(st) {
  try {
    if (!(st.sections || []).some(sc => sc.base === 'desk') || +st.mat.desk.t >= 30) return st;
    const G = build(st);
    if (G.secs.some(q => q.desk && q.follow == null && (q.dgEnd || q.xb) - q.xa > 1200)) st.mat.desk.t = 30;
  } catch (e) {
    oops('styles #1', e);
  }
  return st;
}
function tidy(st) {
  excludePass(st);
  deskTopFix(st);
  const linked = sc => sc.link != null && sc.link !== '';
  for (let pass = 0; pass < 5; pass++) {
    const G = build(st),
      tc = G.tc;
    let ch = false;
    G.secs.forEach(q => {
      if (q.panel || q.door || q.follow != null) return;
      const sc = st.sections[q.i];
      if (!sc || linked(sc)) return;
      const zs = sc.zones || [],
        n = q.zones.length;
      if (zs.length !== n) return;
      const top = q.zones[n - 1];
      if (
        n > 1 &&
        top &&
        top.top &&
        top.hMin < (zs[n - 1].type === 'open' ? 280 : 170) &&
        !['opening', 'drawers', 'seat', 'speaker', 'passage'].includes(zs[n - 2].type) &&
        !(q.desk && n === 2) &&
        zs[n - 1].type !== 'opening'
      ) {
        zs.pop();
        zs[n - 2].h = null;
        ch = true;
        return;
      }
      const mxU = q.grp ? Math.max(...q.grp.members.map(m => m.maxU)) : q.maxU;
      for (const zr of q.zones) {
        const z = zs[zr.k],
          h = zr.top ? mxU - zr.y0 : zr.h;
        if (
          !z ||
          z.type !== 'closed' ||
          z.dog ||
          z.doorMode === 'slide' ||
          z.doorMode === 'pocket' ||
          (q.desk && zr.k === 0) ||
          h <= 2300
        )
          continue;
        const LY = 2180,
          cut = Math.round((LY - zr.y0 >= 900 && h - (LY - zr.y0) >= 250 ? LY - zr.y0 : h / 2) / 10) * 10,
          up = Z('closed', { shelves: 1, doors: 0, face: z.face || 'flat', fin: z.fin || '' });
        up.h = zr.top ? null : Math.max(200, Math.round(h - cut - tc));
        z.h = cut;
        if (+z.railH > cut - 90) z.railH = null;
        zs.splice(zr.k + 1, 0, up);
        ch = true;
        break;
      }
    });
    if (!ch) break;
  }
  // columns taller than one board: make sure there is a fixed divider where the box can be built as two stacked units
  for (let pass = 0; pass < 3; pass++) {
    const G0 = build(st),
      gU_ = q => (q.grp ? Math.max(...q.grp.members.map(m => m.maxU)) : q.maxU),
      q = G0.secs.find(
        q =>
          !q.panel &&
          !q.door &&
          q.follow == null &&
          q.splitK < 0 &&
          gU_(q) + G0.tc - (q.desk ? 0 : q.Pq) > G0.maxUnit &&
          !linked(st.sections[q.i]) &&
          !q._tried
      );
    if (!q) break;
    const y0_ = q.desk ? 0 : q.Pq,
      hS = gU_(q) + G0.tc - y0_,
      ko_ = q.grp ? q.zones[q.grp.ko] : null,
      lo = Math.max(hS - G0.maxUnit + 3 * G0.tc + 10, ko_ ? ko_.divY + (ko_.divT || G0.tc) + 300 - y0_ : 0),
      hi = G0.maxUnit - 3 * G0.tc - 10;
    if (lo > hi) break;
    const Hs = y0_ + Math.max(lo, Math.min(hi, 2180 - y0_)),
      n0 = JSON.stringify(st.sections[q.i].zones).length;
    st = splitZoneAt(st, q.i, Hs);
    if (JSON.stringify(st.sections[q.i].zones).length === n0) break;
  }
  const G = build(st);
  G.secs.forEach(q => {
    if (q.panel || q.door || q.follow != null) return;
    const sc = st.sections[q.i];
    if (!sc || linked(sc)) return;
    (q.zones || []).forEach(zr => {
      const z = (sc.zones || [])[zr.k],
        h = zr.top ? zr.hMin : zr.h;
      if (!z) return;
      if (z.type === 'closed' && !z.rail && !z.dog && !z.fit && !z.fridge && !(q.desk && zr.k === 0) && h > 700) {
        const want = Math.min(6, Math.max(1, Math.round(h / 420) - 1));
        if ((+z.shelves || 0) < want && !(z.vsh || []).some(v => +v > 0)) z.shelves = want;
      }
      if (z.type === 'open' && !z.dog) {
        // open shelves and niches must be big enough to use: 280 mm high, 220 mm clear between shelves, compartments 250 mm wide
        if (!zr.top && +z.h > 0 && h < 280 && !(q.desk && zr.k === 0)) {
          const d = 280 - h,
            nx = sc.zones[zr.k + 1],
            pv = sc.zones[zr.k - 1];
          z.h = 280;
          if (nx && +nx.h > 0 && zr.k + 1 < sc.zones.length - 1 && +nx.h - d >= 280 && nx.type !== 'opening')
            nx.h = Math.round(+nx.h - d);
          else if (
            pv &&
            +pv.h > 0 &&
            +pv.h - d >= 280 &&
            pv.type !== 'opening' &&
            pv.type !== 'seat' &&
            !(q.desk && zr.k === 1)
          )
            pv.h = Math.round(+pv.h - d);
        }
        const hh = Math.max(280, zr.top ? (q.minU + q.maxU) / 2 - zr.y0 : h),
          ts_ = G.ts;
        let n = +z.shelves || 0;
        while (n > 0 && (hh - n * ts_) / (n + 1) < 220) n--;
        z.shelves = n;
        if (Array.isArray(z.vsh)) z.vsh = z.vsh.map(v => (v == null ? v : Math.min(+v, n)));
        if (Array.isArray(z.vd) && z.vd.length) {
          let k_ = z.vd.length;
          while (k_ > 0 && (q.w - k_ * G.tc) / (k_ + 1) < 250) k_--;
          if (k_ < z.vd.length) {
            z.vd = k_ ? vdPos(k_, 'even', q.w, G.tc).map(v => Math.round(v)) : [];
            z.vdMode = k_ ? 'even' : null;
          }
        }
      }
      if (z.type === 'seat' && G.tc < 22) {
        const need = Math.min(4, Math.ceil((q.w + G.tc) / (800 + G.tc)));
        if ((+z.count || 1) < need) z.count = need;
      } // a seat board wider than 800 mm needs a support under it: more drawers side by side give one
      if (z.type === 'drawers' && !zr.top && h > 0) {
        const mn = Math.ceil(h / 400),
          mx = Math.max(1, Math.floor(h / 140));
        z.count = Math.max(mn, Math.min(mx, +z.count || 2));
      }
    });
  });
  return st;
}
/* lines that almost line up (3–40 mm apart in different columns) are forced onto one line. TV, speaker, seat and desk columns keep their line; the others move to it. */
function snapLines(st) {
  const linked = sc => sc.link != null && sc.link !== '';
  for (let pass = 0; pass < 6; pass++) {
    const G = build(st),
      w0 = G.warns.length,
      L = [];
    G.secs.forEach(q => {
      if (q.panel || q.door || q.follow != null) return;
      const sc = st.sections[q.i];
      if (!sc) return;
      (q.zones || []).forEach(zr => {
        if (zr.top || !zr.divY) return;
        const z = (sc.zones || [])[zr.k];
        if (!z) return;
        const anchor =
          linked(sc) ||
          q.desk ||
          !!q.grp ||
          ['opening', 'speaker', 'seat', 'passage'].includes(z.type) ||
          (sc.zones[zr.k + 1] && sc.zones[zr.k + 1].type === 'opening') ||
          z.dog ||
          zr.k === q.splitK;
        L.push({ y: zr.divY + (zr.divT || 0) / 2, i: q.i, k: zr.k, h: zr.h, anchor });
      });
    });
    L.sort((a, b) => a.y - b.y);
    let grp = null,
      did = false;
    const groups = [];
    L.forEach(l => {
      if (grp && l.y - grp[grp.length - 1].y <= 40) grp.push(l);
      else groups.push((grp = [l]));
    });
    for (const g of groups) {
      if (g.length < 2 || g[g.length - 1].y - g[0].y <= 3 || new Set(g.map(l => l.i)).size < 2) continue;
      const an = g.filter(l => l.anchor),
        tgt = an.length ? an[0].y : g[Math.floor(g.length / 2)].y,
        t = JSON.parse(JSON.stringify(st));
      let ch = false;
      g.forEach(l => {
        if (l.anchor) return;
        const d = Math.round(tgt - l.y);
        if (!d) return;
        const zs = t.sections[l.i].zones,
          z = zs[l.k],
          nx = zs[l.k + 1];
        if (l.h + d < 140) return;
        z.h = Math.round(l.h + d);
        if (nx && +nx.h > 0 && l.k + 1 < zs.length - 1 && +nx.h - d >= 140) nx.h = Math.round(+nx.h - d);
        ch = true;
      });
      if (!ch) continue;
      const G2 = build(t);
      if (G2.warns.length <= w0) {
        if (st._mustMiss) t._mustMiss = st._mustMiss;
        st = t;
        did = true;
        break;
      }
    }
    if (!did) break;
  }
  return st;
}
function applyStyle(base, key, seed, o) {
  return slopeFix(
    snapLines(tidy(fitTypes(drenchPass(varyMedia(applyStyle0(base, key, seed, o), key, seed), key, seed))))
  );
}
function applyStyle0(base, key, seed, { keepFinish = false } = {}) {
  const ST = STYLES[key],
    r = prng(seed),
    st = JSON.parse(JSON.stringify(base)),
    G = build(st),
    pal = JSON.parse(JSON.stringify(pick(r, ST.pal))),
    tc = G.tc;
  const DL = r10(ST.DL[0] + r() * (ST.DL[1] - ST.DL[0])),
    DH = r10(ST.DH[0] + r() * (ST.DH[1] - ST.DH[0]));
  // finishes (60·30·10)
  const M = st.mat;
  if (keepFinish) {
    const used = [];
    (base.sections || []).forEach(sc =>
      (sc.zones || []).forEach(z => {
        [z.inFin, ...(z.cFin || [])].forEach(f => {
          if (FIN[f] && !used.includes(f)) used.push(f);
        });
      })
    );
    pal.a = used.length ? used : [M.front.fin !== M.carcass.fin ? M.front.fin : pal.a[0]];
    pal.tones = null;
    pal.inside = FIN[M.back.fin] && M.back.fin !== M.carcass.fin ? M.back.fin : '';
  }
  if (!keepFinish) {
    M.carcass.fin = M.shelf.fin = okFin(pal.c, 'ral9010');
    M.back.fin = okFin(pal.inside || pal.c, 'ral9010');
    M.front.fin = okFin(pal.f, 'ral9010');
    M.skirt.fin = okFin(pal.k, 'ral9010');
    M.desk.fin = okFin(pal.d, 'oak');
    st.opts.handle = pick(r, pal.h);
    st.opts.handleWood = pal.hw || 'oak';
    st.opts.handleSize = key === 'shaker' ? 'S' : pick(r, ['M', 'M', 'L']);
    st.opts.two = { on: !!pal.two && r() < 0.85, y: DL + 20, fin: okFin(pal.two, 'ral9010') };
    st.opts.innerLight = key === 'gallery' || key === 'library' || r() < 0.2;
    st.room.wallFin = pal.wall && FIN[pal.wall] ? pal.wall : '';
    panelDeco(st, prng(seed + 11));
    if (!keepFinish) panelColours(st, pal, prng(seed + 5));
    st.ladder = Object.assign({}, st.ladder || {}, { on: key === 'library' });
  }
  // symmetry classes + accents
  const secs = G.secs,
    cx = (G.secs[0].lx + G.secs[G.secs.length - 1].rx) / 2,
    cls = secs.map((q, i) => i);
  secs.forEach((q, i) =>
    secs.forEach((p, j) => {
      if (
        j < i &&
        cls[i] === i &&
        Math.abs((q.xa + q.xb) / 2 + (p.xa + p.xb) / 2 - 2 * cx) < 120 &&
        Math.abs(q.w - p.w) < 120 &&
        !!q.desk === !!p.desk
      )
        cls[i] = cls[j];
    })
  );
  const mirrored = i => cls[i] !== i,
    center = secs.findIndex(q => Math.abs((q.xa + q.xb) / 2 - cx) < q.w / 2);
  const eligible = secs.filter(
    q =>
      !q.panel &&
      !q.door &&
      !q.desk &&
      !q.s.must &&
      q.follow == null &&
      !(q.s.zones || []).some(z => z.dog || z.type === 'opening' || z.type === 'speaker' || z.type === 'seat')
  );
  const byDist = [...new Set(eligible.map(q => cls[q.i]))].sort(
    (a, b) => Math.abs((secs[a].xa + secs[a].xb) / 2 - cx) - Math.abs((secs[b].xa + secs[b].xb) / 2 - cx)
  );
  const accN = key === 'drenched' ? 0 : key === 'playful' ? Math.min(3, byDist.length) : 1;
  const acc = new Set(byDist.slice(0, accN));
  const drank = {};
  byDist.forEach((c, k) => (drank[c] = k));
  const maxD = Math.max(0, byDist.length - 1);
  if (ST.comp) {
    applyComp(st, G, key, r, seed, pal, eligible, DL, DH, keepFinish);
    if (!keepFinish) {
      st.opts.innerLight = true;
      st.opts.two = { on: false, y: DL + 20, fin: M.front.fin };
      st.ladder = Object.assign({}, st.ladder || {}, { on: false });
    }
    st.sections.forEach(sc => {
      if (sc.base !== 'desk' || keepFinish) return;
      sc.deskSetup = key === 'vitrine' ? 'studio' : 'work';
      sc.deskLED = true;
      sc.deskBack = 'colour';
      sc.deskBackFin = okFin(pal.a[0], 'oak');
      sc.deskGrommet = true;
    });
    return slopeFix(screenCalm(budgetLean(fitTypes(st))));
  }
  const TOPS = {
    japandi: ['closed', 'centre', 'cubbies', 'ends', 'checker'],
    shaker: ['closed', 'glass', 'centre', 'checker'],
    midcentury: ['checker', 'cubbies', 'alternate', 'centre'],
    drenched: ['closed', 'checker', 'centre', 'cubbies'],
    library: ['open', 'cubbies'],
    gallery: ['glass', 'checker', 'centre', 'alternate'],
    scandi: ['checker', 'ends', 'cubbies', 'centre', 'closed'],
    playful: ['checker', 'cubbies', 'alternate', 'all']
  };
  const NICHES = {
    japandi: ['none', 'centre', 'alternate', 'all'],
    shaker: ['none', 'centre', 'none'],
    midcentury: ['centre', 'alternate', 'all', 'none'],
    drenched: ['none', 'centre', 'all'],
    library: ['none'],
    gallery: ['centre', 'all', 'none'],
    scandi: ['centre', 'alternate', 'none', 'all'],
    playful: ['all', 'alternate', 'centre']
  };
  const topPat = pick(r, TOPS[key]),
    nichePat = pick(r, NICHES[key]),
    nicheH = r10(300 + r() * 140),
    DN = DL + tc + r10(380 + r() * 260);
  const topKind = d =>
    topPat === 'closed'
      ? 'closed'
      : topPat === 'open'
        ? 'open'
        : topPat === 'centre'
          ? d === 0
            ? 'open'
            : 'closed'
          : topPat === 'ends'
            ? d === maxD && maxD > 0
              ? 'open'
              : 'closed'
            : topPat === 'checker'
              ? d % 2 === 0
                ? 'open'
                : 'closed'
              : topPat === 'alternate'
                ? d % 2 === 0
                  ? 'cubby'
                  : 'closed'
                : topPat === 'cubbies' || topPat === 'all'
                  ? 'cubby'
                  : topPat === 'glass'
                    ? d % 2 === 0
                      ? 'glass'
                      : 'closed'
                    : 'closed';
  const hasNiche = d =>
    nichePat === 'all'
      ? true
      : nichePat === 'centre'
        ? d === 0
        : nichePat === 'alternate'
          ? d % 2 === 1
          : nichePat === 'ends'
            ? d === maxD && maxD > 0
            : false;
  const rank = {};
  byDist
    .slice()
    .sort((a, b) => a - b)
    .forEach((c, k) => (rank[c] = k));
  const accFin = k => okFin(pal.a[k % pal.a.length], 'ral9010');
  let accK = 0;
  const accColour = {};
  byDist.forEach(c => {
    if (acc.has(c)) accColour[c] = accFin(accK++);
  });
  const vdFor = (w, mode) => {
    if (w < 700) return [];
    const g = 0.382,
      t = 1 / 3;
    return mode === 'golden'
      ? [r10(w * g)]
      : mode === 'thirds'
        ? [r10(w * t), r10(w * 2 * t)]
        : mode === 'center'
          ? [r10(w / 2)]
          : [];
  };
  const rr = {};
  const rc = c => (rr[c] = rr[c] || prng(seed * 7 + c * 131));
  secs.forEach((q, i) => {
    const sc = st.sections[i];
    if (!eligible.includes(q)) return;
    const R = prng(seed * 7 + cls[i] * 131),
      c = cls[i],
      isAcc = acc.has(c),
      yB = q.Pq + tc,
      top = q.minU,
      w = q.w,
      mirror = mirrored(i),
      hinge = mirror ? 'R' : 'L';
    const has1 = top - yB > DL - yB + 260,
      has2 = top > DH + tc + 300 && DH < 9000,
      b0 = DL - yB,
      b1 = DH - DL - tc;
    const Zs = [];
    const add = (type, h, o = {}) => Zs.push(Z(type, Object.assign({ h: h == null ? null : Math.round(h) }, o)));
    const lowType = () =>
      key === 'scandi' || key === 'japandi'
        ? w >= 550 && R() < 0.6
          ? 'drawers'
          : 'closed'
        : key === 'library' || key === 'shaker'
          ? R() < 0.55
            ? 'drawers'
            : 'closed'
          : key === 'midcentury'
            ? 'closed'
            : R() < 0.5
              ? 'drawers'
              : 'closed';
    const lowOpts = t =>
      t === 'drawers' ? { count: b0 > 650 ? 3 : 2 } : { shelves: b0 > 600 ? 1 : 0, doors: w > 620 ? 2 : 1, hinge };
    let face = 'flat',
      inset = '',
      doorMode = 'hinged';
    if (key === 'japandi') face = isAcc || R() < 0.3 ? 'cane' : 'flat';
    if (key === 'shaker') inset = '1';
    if (key === 'midcentury') {
      doorMode = w >= 700 && R() < 0.7 ? 'slide' : 'hinged';
      face = isAcc ? 'fluted' : R() < 0.35 ? 'fluted' : 'flat';
    }
    if (key === 'drenched') face = R() < 0.35 ? 'fluted' : 'flat';
    if (key === 'gallery') face = 'flat';
    const lt = lowType();
    if (!has1) {
      add(
        lt === 'drawers' && top - yB < 500 ? 'closed' : lt,
        null,
        Object.assign(lowOpts(lt), { face, inset, doorMode: lt === 'closed' ? doorMode : undefined })
      );
      sc.zones = Zs;
      return;
    }
    add(lt, b0, Object.assign(lowOpts(lt), { face, inset, doorMode: lt === 'closed' ? doorMode : undefined }));
    const d = drank[c] ?? 0,
      midTop = has2 ? DH : top,
      niche = hasNiche(d) && key !== 'library' && midTop - DN > nicheH + (has2 ? 260 : 380) && DN - DL - tc > 300;
    const midH = niche ? DN - DL - tc : has2 ? b1 : null,
      hM = niche ? DN - DL - tc : has2 ? b1 : top - DL - tc;
    const openMid = o => add('open', midH, Object.assign({ shelves: Math.max(1, Math.round(hM / 380) - 1) }, o));
    const closedMid = o =>
      add(
        'closed',
        midH,
        Object.assign(
          { shelves: Math.max(1, Math.round(hM / 400) - 1), doors: w > 620 ? 2 : 1, hinge, face, inset, doorMode },
          o
        )
      );
    switch (key) {
      case 'japandi':
        isAcc
          ? openMid({ shelves: 1, inFin: accColour[c], vd: vdFor(w, 'golden'), vdMode: 'golden', cFin: [accColour[c]] })
          : R() < 0.55
            ? openMid({ shelves: Math.max(1, Math.round(hM / 480) - 1) })
            : closedMid({ face: 'flat' });
        break;
      case 'shaker':
        isAcc
          ? openMid({ ledge: R() < 0.5, inFin: accColour[c] })
          : closedMid({ face: R() < 0.25 && !mirror ? 'glass' : 'flat' });
        break;
      case 'midcentury':
        isAcc
          ? openMid({ inFin: accColour[c], vd: vdFor(w, 'thirds'), vdMode: 'even' })
          : R() < 0.5
            ? openMid({ inFin: R() < 0.3 ? accFin(1) : '' })
            : closedMid();
        break;
      case 'drenched':
        R() < 0.35 ? openMid({ inFin: '', shelves: Math.max(1, Math.round(hM / 420) - 1) }) : closedMid();
        break;
      case 'library':
        openMid({
          shelves: Math.max(2, Math.round(hM / 330)),
          vd: w > 800 ? vdFor(w, R() < 0.5 ? 'center' : 'thirds') : [],
          vdMode: 'even',
          ledge: isAcc && R() < 0.4,
          inFin: pal.inside || ''
        });
        break;
      case 'gallery':
        isAcc
          ? openMid({ ledge: true, inFin: accColour[c] })
          : rank[c] % 2 === 0
            ? closedMid({ face: 'glass', shelves: Math.max(2, Math.round(hM / 380)) })
            : openMid({ niche: R() < 0.25 && hM < 900 ? 'bar' : '' });
        break;
      case 'scandi':
        isAcc
          ? openMid({ inFin: accColour[c], shelves: Math.max(1, Math.round(hM / 420) - 1) })
          : R() < 0.5
            ? closedMid()
            : openMid({ shelves: Math.max(1, Math.round(hM / 450) - 1) });
        break;
      case 'playful': {
        const ch = rank[c] % 2 === 0;
        ch
          ? openMid({
              vd: vdFor(w, 'center'),
              vdMode: 'even',
              cFin: [accFin(rank[c]), accFin(rank[c] + 1)],
              inFin: accFin(rank[c] + 2)
            })
          : closedMid(
              pal.tones
                ? { fins: Array.from({ length: 6 }, (_, j) => pal.tones[(rank[c] + j) % pal.tones.length]) }
                : {}
            );
        break;
      }
    }
    if (niche) {
      const prev = Zs[Zs.length - 1],
        nc = accFin(d + 1);
      add('open', nicheH, {
        shelves: 0,
        inFin: nc,
        niche: key === 'gallery' && R() < 0.3 ? 'bar' : '',
        vd: w > 800 && R() < 0.5 ? vdFor(w, R() < 0.5 ? 'center' : 'golden') : [],
        cFin: w > 800 ? [nc, accFin(d + 2)] : []
      });
      const restH = has2 ? DH - (DN + nicheH + tc) - tc : null,
        rk = prev.type === 'open' ? 'open' : 'closed';
      if (!has2 || restH > 220)
        add(
          rk,
          has2 ? restH : null,
          rk === 'open'
            ? {
                shelves: Math.max(0, Math.round((has2 ? restH : top - DN - nicheH - tc) / 380) - 1),
                inFin: prev.inFin || ''
              }
            : {
                shelves: 0,
                doors: w > 620 ? 2 : 1,
                hinge,
                face: prev.face || face,
                inset,
                doorMode: prev.doorMode || doorMode,
                fins: prev.fins || []
              }
        );
    }
    if (has2) {
      const hT = top - DH - tc,
        tk = key === 'library' ? (topPat === 'cubbies' ? 'cubby' : 'open') : topKind(d),
        tf_ = face === 'cane' ? 'flat' : face;
      if (tk === 'open')
        add('open', null, {
          shelves: Math.max(0, Math.round(hT / 360) - 1),
          inFin: key === 'library' ? pal.inside || '' : d === 0 || R() < 0.4 ? accFin(d) : ''
        });
      else if (tk === 'cubby')
        add('open', null, {
          shelves: hT > 700 ? 1 : 0,
          vd: w >= 560 ? vdFor(w, w > 1000 ? 'thirds' : 'center') : [],
          cFin: [accFin(d), accFin(d + 1), accFin(d + 2)],
          inFin: key === 'library' ? pal.inside || '' : ''
        });
      else if (tk === 'glass')
        add('closed', null, {
          shelves: Math.max(1, Math.round(hT / 380)),
          doors: w > 620 ? 2 : 1,
          hinge,
          face: 'glass',
          inset
        });
      else
        add('closed', null, {
          shelves: hT > 700 ? 1 : 0,
          doors: w > 620 ? 2 : 1,
          hinge,
          face: tf_,
          inset,
          doorMode: 'hinged',
          fins:
            key === 'playful' && pal.tones
              ? [pal.tones[(d + 2) % pal.tones.length], pal.tones[(d + 2) % pal.tones.length]]
              : []
        });
    }
    if (key === 'playful' && pal.tones && Zs[0].type !== 'open')
      Zs[0].fins = Array.from({ length: 4 }, (_, j) => pal.tones[(rank[c] + j + 1) % pal.tones.length]);
    sc.zones = Zs;
  });
  // sometimes: one artwork opening running over 2–3 columns, centred on the axis
  if (key !== 'library' && r() < (key === 'gallery' ? 0.6 : 0.33)) {
    const el = eligible.slice().sort((a, b) => a.i - b.i),
      n = el.length;
    const runs = [];
    for (let a = 0; a < n; a++) {
      for (let L = 3; L >= 2; L--) {
        const m = el.slice(a, a + L);
        if (m.length < L) continue;
        if (m.some((q, j) => j && q.i !== m[j - 1].i + 1)) continue;
        if (m.some(q => q.D !== m[0].D || q.z0 !== m[0].z0 || q.free !== m[0].free)) continue;
        const cxm = (m[0].xa + m[L - 1].xb) / 2,
          off = Math.abs(cxm - cx),
          span = m[L - 1].xb - m[0].xa,
          minU = Math.min(...m.map(q => q.minU));
        runs.push({ m, L, off, span, minU });
      }
    }
    const okR = runs.filter(o => o.off < 160 && o.span >= 1100 && o.span <= 3200);
    if (okR.length) {
      okR.sort((a, b) => a.off - b.off || b.L - a.L);
      const o = okR[0],
        lead = st.sections[o.m[0].i],
        y0 = DL + tc,
        oh = r10(Math.min(1100, Math.max(620, o.span * 0.42)));
      if (o.minU - y0 - oh > 260) {
        const lz =
          lead.zones[0] && lead.zones[0].type !== 'open'
            ? JSON.parse(JSON.stringify(lead.zones[0]))
            : Z('drawers', { count: 2 });
        lz.h = Math.round(DL - (o.m[0].Pq + tc));
        lz.id = uid();
        lz.doors = 0;
        const restH = o.minU - (y0 + oh) - tc,
          top =
            restH > 760 && DH < 9000 && o.minU > DH + tc + 300
              ? [
                  Z('closed', {
                    h: Math.round(DH - (y0 + oh) - tc),
                    shelves: 1,
                    doors: 0,
                    face: 'flat',
                    inset: lz.inset || ''
                  }),
                  Z(r() < 0.5 ? 'open' : 'closed', { shelves: 0, doors: 0, cFin: [accFin(1), accFin(2)], inFin: '' })
                ]
              : [Z(r() < 0.4 ? 'open' : 'closed', { shelves: restH > 500 ? 1 : 0, doors: 0, inFin: '' })];
        lead.zones = [
          lz,
          Z('opening', {
            h: oh,
            tv: 0,
            look: 'art',
            artStyle: pick(
              r,
              ARTSTYLES.map(a => a[0])
            ),
            frame: pick(r, Object.keys(ARTFRAMES)),
            box: r() < 0.7,
            span: o.L - 1
          }),
          ...top
        ];
        o.m.slice(1).forEach(q => {
          st.sections[q.i].zones = [Z('closed', { shelves: 1 })];
        });
      }
    }
  }
  // desks follow the style
  st.sections.forEach((sc, i) => {
    if (sc.base !== 'desk' || keepFinish) return;
    sc.deskSetup =
      key === 'gallery'
        ? 'vanity'
        : key === 'midcentury' || key === 'drenched'
          ? 'studio'
          : key === 'playful'
            ? 'craft'
            : 'work';
    sc.deskLED = key !== 'scandi';
    sc.deskBack = key === 'playful' ? 'peg' : key === 'japandi' ? 'cork' : key === 'library' ? 'plain' : 'colour';
    sc.deskBackFin = okFin(pal.a[0], 'ral6021');
    sc.deskGrommet = true;
  });
  return slopeFix(screenCalm(budgetLean(fitTypes(st))));
}

/* signature compositions — rules distilled from high-end Italian wall systems: one calm material, lines that run through,
   a single lit accent placed off-centre, glass and wood in a steady rhythm, slim grids with a few closed boxes */
function applyComp(st, G, key, r, seed, pal, eligible, DL, DH, keepFinish) {
  const tc = G.tc,
    secs = G.secs,
    x0 = secs[0].lx,
    x1 = secs[secs.length - 1].rx,
    cx = (x0 + x1) / 2,
    M = st.mat;
  const wood = keepFinish ? (FIN[M.desk.fin] ? M.desk.fin : 'oak') : okFin(pal.a[0], 'oak'),
    alt = keepFinish ? wood : okFin(pal.a[1] || pal.a[0], 'oak');
  const sh = (h, p) => Math.max(0, Math.min(6, Math.round(h / (p || 400)) - 1)),
    nd = w => (w > 620 ? 2 : 1),
    mid = q => (q.xa + q.xb) / 2;
  const el = eligible.slice().sort((a, b) => a.i - b.i),
    put = (q, Zs) => {
      st.sections[q.i].zones = Zs;
    };
  const D = q => ({ yB: q.Pq + tc, top: q.minU, w: q.w, H: q.minU - (q.Pq + tc), b0: DL - (q.Pq + tc) });
  const near = (x, ok, skip) =>
    el.filter(q => ok(q) && !(skip || []).includes(q)).sort((a, b) => Math.abs(mid(a) - x) - Math.abs(mid(b) - x))[0];
  const gold = r() < 0.5 ? 0.382 : 0.618,
    gx = x0 + (x1 - x0) * gold,
    gx2 = x0 + (x1 - x0) * (1 - gold);
  if (key === 'monolith') {
    const nH = r10(430 + r() * 190),
      nq = near(gx, q => D(q).H > D(q).b0 + nH + 420 && D(q).b0 > 350);
    const tw =
      el.length >= 5 && r() < 0.45
        ? near(gx2, q => q.w <= 600 && D(q).H > 1500 && (!nq || Math.abs(q.i - nq.i) > 1), [nq])
        : null;
    el.forEach((q, j) => {
      const d = D(q),
        hinge = j % 2 ? 'R' : 'L';
      if (q === nq)
        return put(q, [
          Z('drawers', { h: Math.round(d.b0), count: d.b0 > 650 ? 3 : 2 }),
          Z('open', { h: nH, shelves: 0, inFin: wood }),
          Z('closed', { shelves: sh(d.top - DL - nH - 2 * tc), doors: nd(d.w), hinge, face: 'flat' })
        ]);
      if (q === tw) return put(q, [Z('open', { shelves: Math.max(2, sh(d.H, 420)), inFin: wood })]);
      put(q, [
        Z('closed', {
          shelves: d.w >= 800 && d.H > 1750 && r() < 0.4 ? 1 : sh(d.H, 420),
          rail: d.w >= 800 && d.H > 1750 && r() < 0.4,
          doors: nd(d.w),
          hinge,
          face: 'flat'
        })
      ]);
    });
    return;
  }
  if (key === 'band') {
    const nH = r10(360 + r() * 120),
      lt = r() < 0.6 ? 'drawers' : 'closed';
    el.forEach((q, j) => {
      const d = D(q),
        hinge = j % 2 ? 'R' : 'L',
        low = h =>
          lt === 'drawers' && (h == null ? d.H : h) >= 380
            ? Z('drawers', { h, count: (h || d.H) > 650 ? 3 : 2 })
            : Z('closed', { h, shelves: (h || d.H) > 600 ? 1 : 0, doors: nd(d.w), hinge, face: 'flat' });
      if (d.b0 > 300 && d.H >= d.b0 + nH + tc + 300)
        return put(q, [
          low(Math.round(d.b0)),
          Z('open', { h: nH, shelves: 0, inFin: wood }),
          Z('closed', { shelves: sh(d.top - DL - nH - 2 * tc), doors: nd(d.w), hinge, face: 'flat' })
        ]);
      if (d.b0 > 300 && d.H >= d.b0 + tc + 220)
        return put(q, [low(Math.round(d.b0)), Z('open', { shelves: 0, inFin: wood })]);
      put(q, [low(null)]);
    });
    return;
  }
  if (key === 'vitrine') {
    const avg = el.reduce((a, q) => a + q.w, 0) / Math.max(1, el.length) + tc,
      g0 = r() < 0.5 ? 0 : 1,
      isG = q => Math.round(Math.abs(mid(q) - cx) / avg) % 2 === g0;
    el.forEach((q, j) => {
      const d = D(q),
        hinge = mid(q) > cx ? 'R' : 'L',
        gl = isG(q) && d.w >= 380;
      if (d.b0 < 300 || d.H < d.b0 + tc + 420)
        return put(q, [Z('closed', { shelves: sh(d.H), doors: nd(d.w), hinge, face: 'flat' })]);
      const low = Z('drawers', { h: Math.round(d.b0), count: d.b0 > 620 ? 3 : 2, fin: alt }),
        two = d.top > DH + tc + 280 && DH < 9000,
        mh = two ? Math.round(DH - DL - tc) : null,
        hM = two ? DH - DL - tc : d.top - DL - tc;
      const midZ = gl
        ? Z('closed', { h: mh, shelves: Math.max(2, sh(hM, 360) + 1), doors: nd(d.w), hinge, face: 'glass' })
        : Z('closed', { h: mh, shelves: sh(hM), doors: nd(d.w), hinge, face: r() < 0.3 ? 'fluted' : 'flat' });
      put(q, two ? [low, midZ, Z('closed', { shelves: 0, doors: nd(d.w), hinge, face: 'flat' })] : [low, midZ]);
    });
    return;
  }
  if (key === 'gridlib') {
    const P = r10(370 + r() * 80),
      lt = r() < 0.5 ? 'drawers' : 'closed';
    el.forEach((q, j) => {
      const d = D(q),
        R = prng(seed * 3 + q.i * 71),
        hinge = j % 2 ? 'R' : 'L';
      if (d.b0 < 300 || d.H < d.b0 + tc + P) {
        return put(q, [Z('open', { shelves: sh(d.H, 360), inFin: R() < 0.3 ? wood : '' })]);
      }
      const Zs = [
        lt === 'drawers'
          ? Z('drawers', { h: Math.round(d.b0), count: 2 })
          : Z('closed', { h: Math.round(d.b0), shelves: 1, doors: nd(d.w), hinge, face: 'flat' })
      ];
      let y = DL + tc,
        prevC = false,
        n = 0;
      while (d.top - y > P * 1.7 && n < 5) {
        const cl = !prevC && R() < 0.26;
        Zs.push(
          cl
            ? Z('closed', { h: P - tc, shelves: 0, doors: nd(d.w), hinge, face: 'flat', fin: R() < 0.55 ? wood : alt })
            : Z('open', {
                h: P - tc,
                shelves: 0,
                inFin: R() < 0.28 ? (R() < 0.6 ? wood : alt) : '',
                vd: d.w > 820 ? [r10(d.w * (R() < 0.5 ? 0.5 : 0.382))] : []
              })
        );
        prevC = cl;
        y += P;
        n++;
      }
      Zs.push(Z('open', { shelves: sh(d.top - y, P), inFin: '' }));
      put(q, Zs);
    });
    return;
  }
}

// a calm backdrop for the projector screen: plain closed doors in the main finish behind the picture, no slivers under the drawer
function screenCalm(st) {
  if (!(st.opts && st.opts.screen && st.opts.screen.on)) return st;
  let G = build(st),
    sc = G.screen;
  if (!sc) return st;
  for (let i = sc.cols[0]; i <= sc.cols[1]; i++) {
    const q = G.secs[i],
      s = st.sections[i];
    if (!q || !s || s.must || q.follow != null) continue;
    q.zones.forEach(zr => {
      const z = s.zones[zr.k];
      if (!z) return;
      const top = zr.top ? q.minU : zr.y0 + zr.h;
      if (top < sc.imgBot + 60) return;
      if (z.type === 'open')
        Object.assign(z, {
          type: 'closed',
          doors: 0,
          face: 'flat',
          fin: '',
          fins: [],
          inFin: '',
          cFin: [],
          vd: [],
          vsh: [],
          ledge: false,
          niche: '',
          box: false,
          rail: false,
          shelves: Math.max(1, Math.min(3, +z.shelves || 1))
        });
      else if (z.type === 'closed') {
        if (z.face === 'glass' || z.face === 'cane' || z.face === 'curtain') z.face = 'flat';
        z.fin = '';
        z.fins = [];
        z.fabric = false;
      }
    });
  }
  G = build(st);
  sc = G.screen;
  if (!sc) return st;
  for (let i = sc.cols[0]; i <= sc.cols[1]; i++) {
    const q = G.secs[i],
      s = st.sections[i];
    if (!q || !s || s.must || s.zones.length < 2) continue;
    const last = q.zones[q.zones.length - 1];
    if (last && q.minU - last.y0 < 280) {
      s.zones.pop();
      s.zones[s.zones.length - 1].h = null;
    }
  }
  return st;
}

// a library ladder that earns its place: the rail runs only over tall storage columns, and those columns get shelves up high worth climbing for
function wantsLadder(st) {
  return (Array.isArray(st.opts.must) ? st.opts.must : []).find(m => m && m.type === 'ladder' && m.on !== false);
}
function ladderSense(st) {
  const m = wantsLadder(st);
  if (!m) return st;
  st = JSON.parse(JSON.stringify(st));
  st._mustMiss = st._mustMiss || [];
  st.ladder = Object.assign({ wood: 'oak' }, st.ladder || {}, {
    on: true,
    h: null,
    maxLen: +m.wMax > 0 ? +m.wMax : null,
    cx: null
  });
  let G = null,
    L = null;
  const lo = +m.wMin > 0 ? +m.wMin : 1200;
  for (const need of [lo, Math.min(lo, 1000)]) {
    for (let hr = 2250; hr >= 1900; hr -= 50) {
      st.ladder.h = hr;
      const g = build(st);
      if (g.ladder && g.ladder.r1 - g.ladder.r0 >= need) {
        G = g;
        L = g.ladder;
        break;
      }
    }
    if (L) break;
  }
  if (!L) {
    st.ladder.h = null;
    G = build(st);
    L = G.ladder;
  }
  if (!L || L.h < 1850 || L.r1 - L.r0 < Math.min(lo, 1000)) {
    st.ladder.on = false;
    st._mustMiss.push(
      !L || L.h < 1850
        ? 'Library ladder (the cabinets are too low here — a step stool does the job)'
        : `Library ladder (only ${f0(L.r1 - L.r0)} mm of tall cabinets side by side)`
    );
    return st;
  }
  // centre a shorter rail on the tallest columns
  if (st.ladder.maxLen) {
    const tall = G.secs.filter(q => L.secs.includes(q.i)).sort((a, b) => b.minU - a.minU)[0];
    if (tall) {
      st.ladder.cx = (tall.bL + tall.bR) / 2;
      G = build(st);
      L = G.ladder || L;
    }
  }
  const tc = G.tc;
  let k = 0;
  L.secs.forEach(i => {
    const q = G.secs[i],
      sc = st.sections[i];
    if (!q || !sc || sc.must || q.follow != null || q.minU < L.h + 260) return;
    const zs = sc.zones,
      top = zs[zs.length - 1];
    if (!top) return;
    const hT = q.minU - (q.zones[q.zones.length - 1] ? q.zones[q.zones.length - 1].y0 : L.h);
    if (top.type === 'opening' || top.type === 'speaker' || top.type === 'seat' || top.dog) return;
    if (k++ % 2 === 0 || top.type === 'open') {
      Object.assign(top, {
        type: 'open',
        shelves: Math.max(1, Math.round(hT / 330) - 1),
        ledge: false,
        niche: '',
        box: false,
        rail: false
      });
    } else {
      top.shelves = Math.max(1, +top.shelves || 0);
      top.rail = false;
      if (top.face === 'glass') top.shelves = Math.max(2, top.shelves);
    }
  });
  return st;
}
function styleColours(base, key, seed) {
  const ST = STYLES[key],
    r = prng(seed),
    st = JSON.parse(JSON.stringify(base)),
    pal = pick(r, ST.pal),
    M = st.mat,
    G = build(st);
  M.carcass.fin = M.shelf.fin = okFin(pal.c, 'ral9010');
  M.back.fin = okFin(pal.inside || pal.c, 'ral9010');
  M.front.fin = okFin(pal.f, 'ral9010');
  M.skirt.fin = okFin(pal.k, 'ral9010');
  M.desk.fin = okFin(pal.d, 'oak');
  st.opts.handle = pick(r, pal.h);
  st.opts.handleWood = pal.hw || 'oak';
  st.opts.two = { on: !!pal.two && r() < 0.7, y: 900, fin: okFin(pal.two, 'ral9010') };
  st.room.wallFin = pal.wall && FIN[pal.wall] ? pal.wall : '';
  panelDeco(st, prng(seed + 11));
  panelColours(st, pal, prng(seed + 5));
  const cx = (G.secs[0].lx + G.secs[G.secs.length - 1].rx) / 2,
    d = q => Math.abs((q.xa + q.xb) / 2 - cx);
  const opens = [];
  G.secs.forEach(q =>
    q.zones.forEach(zr => {
      const z = st.sections[q.i].zones[zr.k];
      if (!z) return;
      z.fin = '';
      z.fins = [];
      if (z.type === 'open') {
        z.inFin = '';
        z.cFin = [];
        opens.push({ q, z, d: Math.round(d(q) / 150) });
      }
      if (z.box) z.boxFin = '';
    })
  );
  // accents: the most central open spot(s), and their mirror partners — odd count where possible
  const ds = [...new Set(opens.map(o => o.d))].sort((a, b) => a - b),
    nA = key === 'drenched' ? 0 : key === 'playful' ? Math.min(3, ds.length) : Math.min(1, ds.length);
  ds.slice(0, nA).forEach((dv, k) =>
    opens
      .filter(o => o.d === dv)
      .forEach(o => {
        o.z.inFin = okFin(pal.a[k % pal.a.length], 'ral9010');
      })
  );
  if (pal.tones) {
    const fs = G.secs.filter(q => !q.panel && !q.door).sort((a, b) => d(a) - d(b));
    fs.forEach(q => {
      const rk = Math.round(d(q) / 150) % pal.tones.length;
      q.zones.forEach(zr => {
        const z = st.sections[q.i].zones[zr.k];
        if (z && (z.type === 'closed' || z.type === 'drawers')) z.fin = pal.tones[rk];
      });
    });
  }
  return fitTypes(st);
}
function styleNow(key) {
  return withBuildCache(() => styleNow0(key));
}
function styleNow0(key) {
  const base = JSON.parse(JSON.stringify(S));
  let best = null,
    bs = Infinity;
  const seed = (Date.now() % 100000) + 7;
  for (let k = 0; k < 10; k++) {
    const st = lockMain(applyStyle(base, key, seed + k * 977, { keepFinish: !!base.opts.lockFin }), base);
    const G_ = build(st),
      w = G_.warns.length * 10 + (G_.railHigh || 0) * 60 + compScore(st, G_, key);
    if (w < bs) {
      bs = w;
      best = st;
    }
  }
  best = alignLines(best, key);
  S = ladderSense(best);
  delete S._mustMiss;
  if (S.ladder && S.ladder.on) S = alignLadder(S);
  ui.style = key;
  ui.zsel = null;
  changed(true);
  toast(`${STYLES[key].name} — tap again for another take`);
}

function splitZoneAt(base, i, H) {
  const st = JSON.parse(JSON.stringify(base)),
    G = build(st),
    q = G.secs[i],
    sc = st.sections[i],
    tc = G.tc;
  if (!q) return st;
  const zs = sc.zones;
  let bk = -1,
    bd = 1e9;
  q.zones.forEach((zr, k) => {
    if (zr.top) return;
    const d = zr.divY - H;
    if (Math.abs(d) < Math.abs(bd)) {
      bd = d;
      bk = k;
    }
  });
  if (bk >= 0 && Math.abs(bd) <= 200 && zs[bk].type !== 'opening') {
    zs[bk].h = Math.round(q.zones[bk].h - bd);
    const nx = zs[bk + 1];
    if (nx && +nx.h > 0) nx.h = Math.max(150, Math.round(+nx.h + bd));
    return st;
  }
  const k = q.zones.findIndex(zr => H > zr.y0 + 150 && H < (zr.top ? q.minU : zr.y0 + zr.h) - 150);
  if (k < 0) return st;
  const zr = q.zones[k],
    z = zs[k];
  const lowH = Math.round(H - zr.y0),
    lower = JSON.parse(JSON.stringify(z));
  lower.id = uid();
  lower.h = lowH;
  lower.rail = false;
  const sh = Math.max(0, +z.shelves || 0);
  lower.shelves = Math.round((sh * lowH) / Math.max(1, zr.h));
  z.shelves = Math.max(0, sh - lower.shelves);
  if (+z.h > 0) z.h = Math.max(150, Math.round(+z.h - lowH - tc));
  if (z.rail && +z.railH > 0 && z.railH < H) z.rail = false;
  zs.splice(k, 0, lower);
  return st;
}
function alignLadder(base) {
  const st = JSON.parse(JSON.stringify(base)),
    G = build(st),
    L = G.ladder;
  if (!L) return st;
  const H = L.h,
    tc = G.tc;
  (L.secs || []).forEach(i => {
    const q = G.secs[i],
      sc = st.sections[i];
    if (!q || !sc || q.follow != null) return;
    const zs = sc.zones;
    // nearest existing joint
    let bk = -1,
      bd = 1e9;
    q.zones.forEach((zr, k) => {
      if (zr.top) return;
      const d = zr.divY + zr.divT / 2 - H;
      if (Math.abs(d) < Math.abs(bd)) {
        bd = d;
        bk = k;
      }
    });
    if (bk >= 0 && Math.abs(bd) <= 25) return;
    if (bk >= 0 && Math.abs(bd) <= 260) {
      const zr = q.zones[bk];
      zs[bk].h = Math.round(zr.h - bd);
      const nx = zs[bk + 1];
      if (nx && +nx.h > 0) nx.h = Math.max(150, Math.round(+nx.h + bd));
      return;
    }
    // split the level that contains the rail height
    if (q.minU < H + 150) return;
    const k = q.zones.findIndex(zr => H > zr.y0 + 150 && H < (zr.top ? q.minU : zr.y0 + zr.h) - 120);
    if (k < 0) return;
    const zr = q.zones[k],
      z = zs[k];
    const lowH = Math.round(H - tc / 2 - zr.y0),
      lower = JSON.parse(JSON.stringify(z));
    lower.id = uid();
    lower.h = lowH;
    lower.rail = false;
    lower.railH = null;
    const shelfSplit = Math.max(0, +z.shelves || 0);
    lower.shelves = Math.round((shelfSplit * lowH) / Math.max(1, zr.h));
    z.shelves = Math.max(0, shelfSplit - lower.shelves);
    if (+z.h > 0) z.h = Math.max(150, Math.round(+z.h - lowH - tc));
    if (z.rail && +z.railH > 0 && z.railH < H) z.rail = false;
    zs.splice(k, 0, lower);
  });
  return st;
}
