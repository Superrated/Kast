/* ==== 52-techdraw.js ====
   Technical drawings: a sheet set (vector PDF, A3 or A4, true to scale) and a DXF of the whole wall.

   How it works
   - Every board is already a 3D solid in build(): G.items of kind 'prism' (a 2D outline, a mapping to 3D
     and a thickness vector). tdSolids() turns them into plain 3D corner lists.
   - A view is a list of entities in millimetres (lines, polygons, arcs, text). Front view and the plan /
     sections are made by projecting or cutting those solids; nearer parts are painted over farther ones.
   - Sheets place views at a standard scale (1:5 … 1:100) inside a border with a title block.
   - pdfVec() writes the sheets as a vector PDF (Helvetica, no libraries); tdDXF() writes the same
     front view, plan and sections 1:1 in one DXF with layers.
   Entity kinds: {t:'pg',p:[[x,y],…],c:closed,f:fill grey 0–1 or null,w:'thick'|'med'|'thin',d:dashed,ly:layer}
                 {t:'tx',p:[x,y],s:text,h:paper mm,al:'l'|'c'|'r',r:90?,b:bold,ly}
*/
const TD = { paper: 'A3', sheets: { front: 1, setout: 1, plan: 1, sec: 1, det: 1, expl: 0 } };
const TD_PAPER = { A3: [420, 297], A4: [297, 210] },
  TD_SCALES = [1, 2, 5, 10, 20, 25, 50, 100, 200],
  TD_LW = { thick: 0.5, med: 0.3, thin: 0.15, xthin: 0.1 };
/* ---------- 3D solids ---------- */
function tdSolids(G) {
  const out = [];
  (G.items || []).forEach((it, idx) => {
    if (it.k !== 'prism' || typeof it.toW !== 'function' || !it.poly || it.poly.length < 3) return;
    const e = it.ext || [0, 0, 0],
      A = it.poly.map(([u, v]) => it.toW(u, v)),
      B = A.map(p => [p[0] + e[0], p[1] + e[1], p[2] + e[2]]),
      all = A.concat(B);
    if (all.some(p => p.some(v => !isFinite(v)))) return;
    const bb = [0, 1, 2].map(i => [Math.min(...all.map(p => p[i])), Math.max(...all.map(p => p[i]))]);
    const ax =
      Math.abs(e[0]) > Math.abs(e[1])
        ? Math.abs(e[0]) > Math.abs(e[2])
          ? 0
          : 2
        : Math.abs(e[1]) > Math.abs(e[2])
          ? 1
          : 2;
    out.push({
      A,
      B,
      e,
      bb,
      ax,
      t: Math.hypot(...e),
      role: String(it.role || ''),
      tag: it.tag || '',
      sz: it.sz || '',
      fin: it.fin || '',
      idx,
      toW: it.toW,
      pan: it.pan || null,
      panSw: it.panSw || 0,
      panOff: it.panOff || null,
      mu: Math.min(...it.poly.map(p => p[0])),
      mv: Math.min(...it.poly.map(p => p[1]))
    });
  });
  return out;
}
const tdLy = s =>
  /^fabric/.test(s.role)
    ? 'FRONTS'
    : { carcass: 'CARCASS', shelf: 'SHELVES', back: 'BACKS', front: 'FRONTS', skirt: 'STRIPS_PLINTH', desk: 'DESK' }[
        s.role
      ] || 'OTHER';
/* cut a solid with the plane coord[ax]=c; returns 3D section polygons */
function tdCut(s, ax, c) {
  const e = s.e;
  if (s.bb[ax][0] > c + 1e-6 || s.bb[ax][1] < c - 1e-6) return [];
  if (Math.abs(e[ax]) > 1e-6) {
    const a0 = s.A[0][ax];
    if (!s.A.every(p => Math.abs(p[ax] - a0) < 1e-6)) return [];
    return [
      s.A.map(p => {
        const q = p.slice();
        q[ax] = c;
        return q;
      })
    ];
  }
  const A = s.A,
    pts = [];
  for (let i = 0; i < A.length; i++) {
    const p = A[i],
      q = A[(i + 1) % A.length],
      dp = p[ax] - c,
      dq = q[ax] - c;
    if (Math.abs(dp) < 1e-9) pts.push(p.slice());
    else if (dp * dq < 0 && Math.abs(dq) > 1e-9) {
      const t = dp / (dp - dq);
      pts.push(p.map((v, k) => v + (q[k] - v) * t));
    }
  }
  if (pts.length < 2) return [];
  const o = [0, 1, 2].filter(k => k !== ax),
    vr = o.map(k => Math.max(...pts.map(p => p[k])) - Math.min(...pts.map(p => p[k]))),
    k = vr[0] >= vr[1] ? o[0] : o[1];
  pts.sort((a, b) => a[k] - b[k]);
  const out = [];
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const a = pts[i],
      b = pts[i + 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.01) continue;
    out.push([a, b, b.map((x, j) => x + e[j]), a.map((x, j) => x + e[j])]);
  }
  return out;
}
function tdHull(P) {
  const p = P.map(q => q.slice()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]),
    lo = [],
    up = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  up.pop();
  lo.pop();
  return lo.concat(up);
}
/* outline of a solid seen along an axis (0 x, 1 y, 2 z), mapped with pr(p3)→[x,y] */
function tdOutline(s, viewAx, pr) {
  const e = s.e,
    along = Math.abs(e[viewAx]) > 1e-6 && [0, 1, 2].every(k => k === viewAx || Math.abs(e[k]) < 1e-6);
  return along ? s.A.map(pr) : tdHull(s.A.concat(s.B).map(pr));
}
/* ---------- small helpers for entities ---------- */
const tdPg = (p, o) => Object.assign({ t: 'pg', p, c: true, f: null, w: 'med', ly: 'OTHER' }, o || {});
const tdLn = (a, b, o) => Object.assign({ t: 'pg', p: [a, b], c: false, f: null, w: 'thin', ly: 'OTHER' }, o || {});
const tdTx = (p, s, o) => Object.assign({ t: 'tx', p, s: String(s), h: 2.5, al: 'c', ly: 'TEXT' }, o || {});
function tdArc(c, r, a0, a1, o) {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) / 6)),
    p = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    p.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
  }
  return Object.assign({ t: 'pg', p, c: false, f: null, w: 'thin', ly: 'OTHER' }, o || {});
}
/* linear dimension between a and b (model points) along 'h' or 'v', dimension line at 'at' (model coord); den = scale */
function tdDim(E, a, b, dir, at, den, o) {
  o = o || {};
  const L = dir === 'h' ? Math.abs(b[0] - a[0]) : Math.abs(b[1] - a[1]);
  if (L < 0.5) return;
  const tk = 1.2 * den,
    gap = 1 * den,
    ly = 'DIMENSIONS';
  if (dir === 'h') {
    const x0 = Math.min(a[0], b[0]),
      x1 = Math.max(a[0], b[0]),
      s = Math.sign(at - a[1]) || 1;
    E.push(
      tdLn([a[0], a[1] + s * gap], [a[0], at + s * 1.5 * den], { ly, w: 'xthin' }),
      tdLn([b[0], b[1] + s * gap], [b[0], at + s * 1.5 * den], { ly, w: 'xthin' }),
      tdLn([x0 - 1.5 * den, at], [x1 + 1.5 * den, at], { ly, w: 'xthin' })
    );
    [x0, x1].forEach(x => E.push(tdLn([x - tk / 2, at - tk / 2], [x + tk / 2, at + tk / 2], { ly, w: 'thin' })));
    const txt = o.text || f0(L),
      tw = tdTW(txt, 2.2) * den,
      fits = tw < x1 - x0 - 1.5 * den;
    E.push(tdTx([fits ? (x0 + x1) / 2 : x1 + 1.5 * den + tw / 2, at + 0.9 * den], txt, { h: 2.2, ly, al: 'c' }));
  } else {
    const y0 = Math.min(a[1], b[1]),
      y1 = Math.max(a[1], b[1]),
      s = Math.sign(at - a[0]) || 1;
    E.push(
      tdLn([a[0] + s * gap, a[1]], [at + s * 1.5 * den, a[1]], { ly, w: 'xthin' }),
      tdLn([b[0] + s * gap, b[1]], [at + s * 1.5 * den, b[1]], { ly, w: 'xthin' }),
      tdLn([at, y0 - 1.5 * den], [at, y1 + 1.5 * den], { ly, w: 'xthin' })
    );
    [y0, y1].forEach(y => E.push(tdLn([at - tk / 2, y - tk / 2], [at + tk / 2, y + tk / 2], { ly, w: 'thin' })));
    const txt = o.text || f0(L),
      tw = tdTW(txt, 2.2) * den,
      fits = tw < y1 - y0 - 1.5 * den;
    E.push(tdTx([at - 0.9 * den, fits ? (y0 + y1) / 2 : y1 + 1.5 * den + tw / 2], txt, { h: 2.2, ly, al: 'c', r: 90 }));
  }
}
/* Helvetica widths (per 1000) for text width estimates */
const TD_HW = (() => {
  const w = {};
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
    .split('')
    .forEach((c, i) => {
      w[c] = [
        278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556,
        556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667,
        556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556,
        556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722,
        500, 500, 500, 334, 260, 334, 584
      ][i];
    });
  return w;
})();
function tdTW(s, hmm) {
  let u = 0;
  for (const c of String(s)) u += TD_HW[c] || 600;
  return ((u / 1000) * hmm) / 0.72;
}
/* ---------- which solids belong to a column, and its box ---------- */
const TD_BOARD = /^(carcass|shelf|back|front|skirt|desk|fabric:.*)$/;
function tdCol(sol, q) {
  const xa = q.xa,
    xb = q.xb;
  return sol.filter(s => {
    if (!TD_BOARD.test(s.role)) return false;
    const [x0, x1] = s.bb[0];
    if (/^\d+:/.test(s.sz)) return +s.sz.split(':')[0] === q.i;
    if (s.role === 'skirt') return x0 >= xa - 120 && x1 <= xb + 120;
    const ov = Math.min(x1, xb) - Math.max(x0, xa);
    if (ov > 1) return true;
    return s.ax === 0 && (Math.abs(x1 - xa) < 3 || Math.abs(x0 - xb) < 3);
  });
}
function tdBox(cs) {
  const c = cs.filter(s => s.role === 'carcass');
  const a = c.length ? c : cs;
  if (!a.length) return null;
  return {
    x0: Math.min(...a.map(s => s.bb[0][0])),
    x1: Math.max(...a.map(s => s.bb[0][1])),
    y0: Math.min(...a.map(s => s.bb[1][0])),
    y1: Math.max(...a.map(s => s.bb[1][1])),
    z0: Math.min(...a.map(s => s.bb[2][0])),
    z1: Math.max(...a.map(s => s.bb[2][1]))
  };
}
function tdCols(G, sol) {
  return G.secs
    .map(q => {
      const cs = tdCol(sol, q),
        bx = tdBox(cs);
      return bx ? { q, cs, bx, n: q.i + 1 } : null;
    })
    .filter(Boolean);
}
function tdTopAt(cs, x) {
  const a = cs.filter(s => s.role === 'carcass' && s.bb[0][0] <= x + 1 && s.bb[0][1] >= x - 1);
  return a.length ? Math.max(...a.map(s => s.bb[1][1])) : 0;
}
/* ---------- the room around the cabinets ---------- */
const tdCeil = (G, x) => {
  try {
    return G.ceilAt(x);
  } catch (e) {
    return +S.room.H;
  }
};
function tdWallZ() {
  return -(+S.room.D || 600);
}
/* ---------- FRONT VIEW ---------- */
function tdFront(G, sol, opt) {
  opt = opt || {};
  const E = [],
    W = G.W,
    H = Math.max(...G.cps.map(p => p.y), +S.room.H),
    wb = 120;
  E.push(
    tdPg(
      [
        [-wb, 0],
        [0, 0],
        [0, tdCeil(G, 0)],
        [-wb, tdCeil(G, 0)]
      ],
      { f: 0.86, w: 'thin', ly: 'WALL' }
    ),
    tdPg(
      [
        [W, 0],
        [W + wb, 0],
        [W + wb, tdCeil(G, W)],
        [W, tdCeil(G, W)]
      ],
      { f: 0.86, w: 'thin', ly: 'WALL' }
    )
  );
  const cp = G.cps.map(p => [p.x, p.y]);
  E.push(
    tdPg(
      cp.concat(
        cp
          .slice()
          .reverse()
          .map(p => [p[0], p[1] + wb])
      ),
      { f: 0.86, w: 'thin', ly: 'WALL' }
    ),
    tdPg(cp, { c: false, w: 'thick', ly: 'WALL' }),
    tdLn([-wb - 200, 0], [W + wb + 200, 0], { w: 'thick', ly: 'WALL' })
  );
  (G.beams || []).forEach(b => {
    const c = tdCeil(G, b.x + b.w / 2);
    E.push(
      tdPg(
        [
          [b.x, b.bottom],
          [b.x + b.w, b.bottom],
          [b.x + b.w, c],
          [b.x, c]
        ],
        { f: 0.72, w: 'med', ly: 'WALL' }
      )
    );
  });
  if (!opt.boxesOnly) {
    sol
      .slice()
      .sort((a, b) => a.bb[2][1] - b.bb[2][1])
      .forEach(s =>
        E.push(
          tdPg(
            tdOutline(s, 2, p => [p[0], p[1]]),
            { f: 1, w: s.role === 'front' || /^fabric/.test(s.role) ? 'med' : 'thin', ly: tdLy(s) }
          )
        )
      );
    (G.items || []).forEach(it => {
      if (it.k === 'tv' || it.k === 'appl')
        E.push(
          tdPg(
            [
              [it.x, it.y],
              [it.x + it.w, it.y],
              [it.x + it.w, it.y + it.h],
              [it.x, it.y + it.h]
            ],
            { f: it.k === 'tv' ? 0.35 : 0.93, w: 'thin', ly: 'OTHER' }
          )
        );
    });
  } else
    opt.cols.forEach(c =>
      E.push(
        tdPg(
          [
            [c.bx.x0, c.bx.y0],
            [c.bx.x1, c.bx.y0],
            [c.bx.x1, tdTopAt(c.cs, c.bx.x1 - 2)],
            [c.bx.x0, tdTopAt(c.cs, c.bx.x0 + 2)]
          ],
          { f: 0.97, w: 'med', ly: 'CARCASS' }
        )
      )
    );
  return {
    E,
    bb: [
      [-wb, Math.min(0, ...sol.map(s => s.bb[1][0]))],
      [W + wb, H + wb]
    ]
  };
}
function tdFrontDims(V, G, cols, den, ord) {
  const E = V.E,
    W = G.W;
  const xs = [0, W];
  cols.forEach(c => xs.push(c.bx.x0, c.bx.x1));
  const u = [...new Set(xs.map(v => Math.round(v * 10) / 10))]
    .sort((a, b) => a - b)
    .filter((v, i, a) => i === 0 || v - a[i - 1] > 1);
  cols.forEach(c => {
    const cx = (c.bx.x0 + c.bx.x1) / 2,
      r = 2.4 * den;
    E.push(
      tdArc([cx, -5 * den], r, 0, 360, { w: 'thin', ly: 'TEXT' }),
      tdTx([cx, -5 * den - 1.1 * den], c.n, { h: 2.6, b: 1 })
    );
  });
  if (ord) {
    let last = -1e9;
    u.forEach(x => {
      const tx = Math.max(x + 0.9 * den, last + 3 * den);
      last = tx;
      E.push(
        tdLn([x, -1 * den], [x, -9 * den], { ly: 'DIMENSIONS', w: 'xthin' }),
        tdTx([tx, -10 * den], f0(x), { h: 2.2, r: 90, al: 'r', ly: 'DIMENSIONS' })
      );
    });
    E.push(
      tdLn([0, -9 * den], [W, -9 * den], { ly: 'DIMENSIONS', w: 'xthin' }),
      tdTx([0, -24 * den], '0 = left wall, measured at the floor', { h: 2.2, al: 'l' })
    );
  } else {
    for (let i = 0; i + 1 < u.length; i++) tdDim(E, [u[i], 0], [u[i + 1], 0], 'h', -12 * den, den);
    tdDim(E, [0, 0], [W, 0], 'h', -20 * den, den);
  }
  const tall = cols.reduce((a, c) => Math.max(a, c.bx.y1), 0),
    P = cols.reduce((a, c) => Math.min(a, c.bx.y0), 1e9),
    cW = tdCeil(G, W);
  const at = W + 120 + 12 * den;
  if (P > 1) tdDim(E, [W, 0], [W, P], 'v', at, den);
  tdDim(E, [W, P > 1 ? P : 0], [W, tdTopAt(cols[cols.length - 1].cs, W - 30) || tall], 'v', at, den);
  tdDim(E, [W, 0], [W, cW], 'v', at + 9 * den, den);
  V.bb = [
    [V.bb[0][0], -(ord ? 26 : 24) * den],
    [V.bb[1][0] + 24 * den, V.bb[1][1]]
  ];
}
/* ---------- PLAN (cut at h) ---------- */
function tdPlan(G, sol, h, den) {
  const E = [],
    W = G.W,
    zW = tdWallZ(),
    wb = 120,
    pr = p => [p[0], -p[2]];
  const Dw = -zW;
  E.push(
    tdPg(
      [
        [-wb, Dw],
        [W + wb, Dw],
        [W + wb, Dw + wb],
        [-wb, Dw + wb]
      ],
      { f: 0.62, w: 'thin', ly: 'WALL' }
    ),
    tdPg(
      [
        [-wb, -900],
        [0, -900],
        [0, Dw],
        [-wb, Dw]
      ],
      { f: 0.62, w: 'thin', ly: 'WALL' }
    ),
    tdPg(
      [
        [W, -900],
        [W + wb, -900],
        [W + wb, Dw],
        [W, Dw]
      ],
      { f: 0.62, w: 'thin', ly: 'WALL' }
    )
  );
  (G.beams || []).forEach(b => {
    const d = Math.min(Dw, +b.depth || Dw);
    E.push(
      tdPg(
        [
          [b.x, Dw - d],
          [b.x + b.w, Dw - d],
          [b.x + b.w, Dw],
          [b.x, Dw]
        ],
        { f: null, w: 'thin', d: 1, ly: 'WALL' }
      )
    );
  });
  sol
    .filter(s => s.bb[1][1] < h - 1e-6)
    .sort((a, b) => a.bb[1][1] - b.bb[1][1])
    .forEach(s => E.push(tdPg(tdOutline(s, 1, pr), { f: 1, w: 'thin', ly: tdLy(s) })));
  sol.forEach(s => tdCut(s, 1, h).forEach(poly => E.push(tdPg(poly.map(pr), { f: 0.78, w: 'thick', ly: tdLy(s) }))));
  const fz = Math.max(0, ...sol.filter(s => s.role === 'front').map(s => s.bb[2][1]));
  (G.fronts || []).forEach(f => {
    if (f.kind !== 'door' || f.slide || (f.hinge !== 'L' && f.hinge !== 'R')) return;
    const xs = f.poly.map(p => p[0]),
      ys = f.poly.map(p => p[1]),
      a = Math.min(...xs),
      b = Math.max(...xs),
      w = b - a;
    if (w < 80) return;
    const on = Math.min(...ys) <= h && Math.max(...ys) >= h;
    const hx = f.hinge === 'L' ? a : b,
      Y = -fz;
    E.push(
      tdLn([hx, Y], [hx, Y - w], { w: 'thin', d: on ? 0 : 1, ly: 'DOOR_SWING' }),
      tdArc([hx, Y], w, f.hinge === 'L' ? 270 : 180, f.hinge === 'L' ? 360 : 270, {
        w: 'xthin',
        d: 1,
        ly: 'DOOR_SWING'
      })
    );
  });
  const sp = +(S.room.front && S.room.front.on && S.room.front.space) || 0;
  if (sp > 0)
    E.push(
      tdLn([0, -fz - sp], [W, -fz - sp], { d: 1, w: 'thin', ly: 'WALL' }),
      tdTx([W / 2, -fz - sp - 3 * den], `free floor in front: ${f0(sp)} mm`, { h: 2.2 })
    );
  return {
    E,
    bb: [
      [-wb, -Math.max(fz + 900, sp + fz + 600)],
      [W + wb, Dw + wb]
    ],
    Dw,
    fz
  };
}
function tdPlanDims(V, cols, den, W) {
  const E = V.E,
    xs = [0, W];
  cols.forEach(c => xs.push(c.bx.x0, c.bx.x1));
  const u = [...new Set(xs.map(v => Math.round(v)))]
    .sort((a, b) => a - b)
    .filter((v, i, a) => i === 0 || v - a[i - 1] > 1);
  const yb = V.bb[0][1] + 2 * den;
  for (let i = 0; i + 1 < u.length; i++) tdDim(E, [u[i], -V.fz], [u[i + 1], -V.fz], 'h', yb + 10 * den, den);
  tdDim(E, [0, -V.fz], [W, -V.fz], 'h', yb + 2 * den, den);
  const c0 = cols[0];
  if (c0) {
    tdDim(E, [-120, V.Dw], [-120, -c0.bx.z1], 'v', -120 - 10 * den, den);
    tdDim(E, [-120, V.Dw], [-120, -V.fz], 'v', -120 - 18 * den, den);
  }
  V.bb = [
    [V.bb[0][0] - 22 * den, V.bb[0][1]],
    [V.bb[1][0] + 4 * den, V.bb[1][1]]
  ];
}
/* ---------- SECTION through a column ---------- */
function tdSection(G, sol, c, den) {
  const E = [],
    Dw = -tdWallZ(),
    pr = p => [p[2] + Dw, p[1]],
    wb = 120,
    bx = c.bx;
  let cx = (bx.x0 + bx.x1) / 2;
  for (let k = 0; k < 6 && sol.some(s => s.ax === 0 && s.bb[0][0] < cx + 1 && s.bb[0][1] > cx - 1); k++) cx += 40;
  const cH = tdCeil(G, cx),
    fz = Math.max(0, ...c.cs.filter(s => s.role === 'front').map(s => s.bb[2][1]));
  E.push(
    tdPg(
      [
        [-wb, -60],
        [0, -60],
        [0, cH],
        [-wb, cH]
      ],
      { f: 0.62, w: 'thin', ly: 'WALL' }
    ),
    tdPg(
      [
        [-wb, cH],
        [Dw + fz + 500, cH],
        [Dw + fz + 500, cH + wb],
        [-wb, cH + wb]
      ],
      { f: 0.86, w: 'thin', ly: 'WALL' }
    ),
    tdLn([-wb, 0], [Dw + fz + 500, 0], { w: 'thick', ly: 'WALL' })
  );
  (G.beams || []).forEach(b => {
    if (cx < b.x || cx > b.x + b.w) return;
    const d = Math.min(Dw, +b.depth || Dw);
    E.push(
      tdPg(
        [
          [0, b.bottom],
          [d, b.bottom],
          [d, cH],
          [0, cH]
        ],
        { f: 0.62, w: 'med', ly: 'WALL' }
      )
    );
  });
  sol
    .filter(s => s.bb[0][0] >= cx && s.bb[0][0] <= bx.x1 + 2 && c.cs.includes(s))
    .sort((a, b) => b.bb[0][0] - a.bb[0][0])
    .forEach(s => E.push(tdPg(tdOutline(s, 0, pr), { f: 1, w: 'thin', ly: tdLy(s) })));
  const cut = [];
  sol.forEach(s =>
    tdCut(s, 0, cx).forEach(poly => {
      const p2 = poly.map(pr);
      cut.push({ s, p2 });
      E.push(tdPg(p2, { f: 0.78, w: 'thick', ly: tdLy(s) }));
    })
  );
  (G.items || []).forEach(it => {
    if (it.k === 'rail' && cx >= it.xa && cx <= it.xb)
      E.push(tdArc([Dw - it.z, it.y], 12.5, 0, 360, { w: 'med', ly: 'OTHER' }));
  });
  // heights of every horizontal board in this column, measured from the floor (to place them)
  const hz = cut
      .filter(o => o.s.ax === 1 && c.cs.includes(o.s))
      .map(o => Math.max(...o.p2.map(p => p[1])))
      .sort((a, b) => a - b),
    tops = [...new Set(hz.map(v => Math.round(v)))];
  const ox = Dw + fz + 8 * den;
  tops.forEach(y => {
    E.push(
      tdLn([Dw + fz + 1 * den, y], [ox, y], { ly: 'DIMENSIONS', w: 'xthin' }),
      tdTx([ox + 0.8 * den, y - 0.8 * den], f0(y), { h: 2.2, al: 'l', ly: 'DIMENSIONS' })
    );
  });
  if (tops.length)
    E.push(
      tdLn([ox, 0], [ox, tops[tops.length - 1]], { ly: 'DIMENSIONS', w: 'xthin' }),
      tdTx([ox + 0.8 * den, -3 * den], 'heights from the floor', { h: 2, al: 'l', ly: 'DIMENSIONS' })
    );
  tdDim(E, [0, 0], [Dw + fz, 0], 'h', -10 * den, den);
  tdDim(E, [0, 0], [Dw + bx.z1, 0], 'h', -5 * den, den);
  tdDim(E, [0, 0], [0, cH], 'v', -wb - 8 * den, den);
  const topCut = Math.max(
    0,
    ...cut.filter(o => o.s.role === 'carcass' && c.cs.includes(o.s)).map(o => Math.max(...o.p2.map(p => p[1])))
  );
  return {
    E,
    bb: [
      [-wb - 14 * den, -14 * den],
      [Dw + fz + 22 * den, cH + wb]
    ],
    cx,
    Dw,
    fz,
    cH,
    c,
    topCut
  };
}
/* ---------- EXPLODED VIEW of one box ---------- */
function tdPartName(s, c) {
  const ax = s.ax,
    bx = c.bx;
  if (s.role === 'front' || /^fabric/.test(s.role)) {
    // boxes, linings and other front-coloured parts keep their own name from the cut list
    const pt = s.pan && s.pan.type ? String(s.pan.type) : '';
    if (pt && !/^(Door|Drawer front|Flap|Sliding door|Pocket door)/.test(pt)) return pt.replace(/\s*\(.*\)$/, '');
    return s.bb[1][1] - s.bb[1][0] < 450 && s.bb[0][1] - s.bb[0][0] > s.bb[1][1] - s.bb[1][0] ? 'Drawer front' : 'Door';
  }
  if (s.role === 'back') return 'Back panel';
  if (s.role === 'shelf') return 'Shelf';
  if (s.role === 'skirt') return 'Plinth / strip';
  if (s.role === 'desk') return 'Desk top';
  if (s.role === 'carcass') {
    if (ax === 0) return Math.abs(s.bb[0][0] - bx.x0) < 3 || Math.abs(s.bb[0][1] - bx.x1) < 3 ? 'Side' : 'Divider';
    if (ax === 1) {
      // the bottom is the lowest fixed board of the box (the box may start lower, at the floor, when its plinth belongs to it)
      if (c.lowY == null)
        c.lowY = Math.min(...(c.cs || []).filter(o => o.role === 'carcass' && o.ax === 1).map(o => o.bb[1][0]));
      return Math.abs(s.bb[1][1] - bx.y1) < 3
        ? 'Top'
        : Math.abs(s.bb[1][0] - bx.y0) < 30 || Math.abs(s.bb[1][0] - c.lowY) < 1
          ? 'Bottom'
          : 'Fixed shelf';
    }
    return 'Rail / batten';
  }
  return 'Part';
}
/* how far a part moves when its box is pulled apart (EX = step in mm) */
function tdOffset(s, c, EX) {
  const bx = c.bx,
    cc = [(bx.x0 + bx.x1) / 2, (bx.y0 + bx.y1) / 2, (bx.z0 + bx.z1) / 2],
    m = [0, 1, 2].map(k => (s.bb[k][0] + s.bb[k][1]) / 2);
  if (s.role === 'front' || /^fabric/.test(s.role)) {
    const sd = Math.sign(m[0] - cc[0]);
    return [Math.abs(m[0] - cc[0]) > 20 ? sd * EX * 0.45 : 0, 0, EX * 2.3];
  }
  if (s.role === 'back') return [0, 0, -EX * 1.2];
  if (s.role === 'shelf') return [0, 0, EX * 0.8];
  if (s.role === 'skirt') {
    // closing strips: a tall one at the side moves sideways, one at the top moves up, the plinth moves down
    const ex = [0, 1, 2].map(k => s.bb[k][1] - s.bb[k][0]);
    if (ex[1] > 300 && ex[1] > 2 * ex[0]) return [Math.sign(m[0] - cc[0] || -1) * EX * 1.3, 0, EX * 0.3];
    if (m[1] > cc[1]) return [0, EX * 0.8, EX * 0.5];
    return [0, -EX * 0.5, EX * 0.9];
  }
  if (s.ax === 0) {
    const side = Math.abs(s.bb[0][0] - bx.x0) < 3 || Math.abs(s.bb[0][1] - bx.x1) < 3;
    // the sides move outward; uprights inside slide forward, so they never move into the shelves next to them
    return side ? [Math.sign(m[0] - cc[0] || 1) * EX, 0, 0] : [0, 0, EX * 0.4];
  }
  if (s.ax === 1) {
    const top = Math.abs(s.bb[1][1] - bx.y1) < 3,
      bot = Math.abs(s.bb[1][0] - bx.y0) < 30;
    return [0, top ? EX : bot ? -EX * 0.6 : 0, top || bot ? 0 : EX * 0.5];
  }
  return [0, 0, 0];
}
/* parts of a box with names, sizes and letters (same name and size = same letter) */
function tdPartRows(c) {
  const list = c.cs.map((s, i) => {
    const ex = [0, 1, 2].map(k => s.bb[k][1] - s.bb[k][0]),
      t = s.t || Math.min(...ex),
      o = ex.filter((x, k) => k !== s.ax).sort((a, b) => b - a);
    return { i, s, name: tdPartName(s, c), L: o[0], W: o[1], t, role: s.role };
  });
  const grp = {};
  list.forEach(r => {
    const k = r.name + '|' + f0(r.L) + '|' + f0(r.W) + '|' + f0(r.t);
    (grp[k] = grp[k] || { name: r.name, L: r.L, W: r.W, t: r.t, role: r.role, q: 0, idx: [] }).q++;
    grp[k].idx.push(r.i);
  });
  const rows = Object.values(grp).sort((a, b) => a.idx[0] - b.idx[0]);
  rows.forEach((r, j) => {
    r.tag = j < 26 ? String.fromCharCode(65 + j) : 'Z' + (j - 25);
  });
  const tagOf = {};
  rows.forEach(r => r.idx.forEach(i => (tagOf[i] = r)));
  return { rows, tagOf };
}
function tdExploded(c, G) {
  G = G || geo;
  const bx = c.bx,
    EX = asEX(c),
    ctr = asCtr(c);
  const v = [0.95, 0.75, 1.25],
    vl = Math.hypot(...v),
    f = v.map(a => -a / vl),
    up0 = [0, 1, 0],
    cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    nm = a => {
      const l = Math.hypot(...a);
      return a.map(x => x / l);
    };
  const rt = nm(cr(f, up0)),
    up = cr(rt, f),
    dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    P = p => [dot(p, rt), dot(p, up)];
  let H = { hw: [], lines: [], types: [] };
  try {
    H = asHW(c, G);
  } catch (e) {
    console.warn(e);
  }
  const mk = (s, o, hw) => {
    const m = [0, 1, 2].map(k => (s.bb[k][0] + s.bb[k][1]) / 2),
      mv = p => [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
    return { s, o, hw, A: s.A.map(mv), B: s.B.map(mv), m: mv(m), mk: hw ? {} : asMarks(s, c) };
  };
  const parts = c.cs.map(s => mk(s, tdOffset(s, c, EX), 0)).concat(H.hw.map(h => mk(h, asOff(h, c, EX), 1)));
  const boardOf = new Map();
  parts.forEach(pt => {
    if (!pt.hw) boardOf.set(pt.s, pt);
  });
  const faces = [];
  parts.forEach(pt => {
    if (pt.hw) return;
    const n = (pt.n = nm(pt.s.e));
    pt.dA = dot(
      pt.A.reduce(
        (a, p) => [a[0] + p[0] / pt.A.length, a[1] + p[1] / pt.A.length, a[2] + p[2] / pt.A.length],
        [0, 0, 0]
      ),
      f
    );
    pt.dB = dot(
      pt.B.reduce(
        (a, p) => [a[0] + p[0] / pt.B.length, a[1] + p[1] / pt.B.length, a[2] + p[2] / pt.B.length],
        [0, 0, 0]
      ),
      f
    );
  });
  // hardware sitting on a board is painted together with the face it sits on
  parts.forEach(pt => {
    if (!pt.hw || !pt.s.host || V3.l(pt.s.extra || [0, 0, 0]) > 1) return;
    const hp = boardOf.get(pt.s.host);
    if (!hp) return;
    const n = hp.n,
      sA = dot(V3.s(pt.m, hp.A[0]), n);
    pt.hd = (sA > hp.s.t / 2 ? hp.dB : hp.dA) - 0.005;
    pt.hc = dot(pt.m, f);
  });
  parts.forEach((pt, i) => {
    const n = pt.A.length,
      fs = [pt.A.slice(), pt.B.slice().reverse()];
    for (let j = 0; j < n; j++) fs.push([pt.A[j], pt.A[(j + 1) % n], pt.B[(j + 1) % n], pt.B[j]]);
    fs.forEach((F, fi) => {
      const a = F[0],
        b = F[1],
        c3 = F[2];
      let nrm = nm(cr([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c3[0] - a[0], c3[1] - a[1], c3[2] - a[2]]));
      if (!nrm.every(isFinite)) return;
      const ctrF = [0, 1, 2].map(k => F.reduce((s_, p) => s_ + p[k], 0) / F.length);
      if (dot(nrm, [ctrF[0] - pt.m[0], ctrF[1] - pt.m[1], ctrF[2] - pt.m[2]]) < 0) nrm = nrm.map(x => -x);
      const dd = dot(ctrF, f);
      if (dot(nrm, f) >= -1e-6) return;
      const sh = Math.abs(nrm[1]) > 0.7 ? 0.97 : Math.abs(nrm[0]) > 0.7 ? 0.84 : 0.91;
      let g = pt.hw
        ? Math.abs(nrm[1]) > 0.7
          ? 0.72
          : 0.6
        : pt.s.role === 'front' || /^fabric/.test(pt.s.role)
          ? sh - 0.06
          : sh;
      if (!pt.hw && pt.mk.edge && fi > 1 && nrm[2] > 0.9) g = 0.5;
      faces.push({
        e: tdPg(F.map(P), { f: g, w: pt.hw ? 'xthin' : 'thin', ly: pt.hw ? 'HARDWARE' : 'PARTS' }),
        d: pt.hd != null ? pt.hd + (dd - pt.hc) * 1e-5 : dd
      });
    });
  });
  // holes, grain arrows and the inside-face triangle ride on their face
  const ring = (cen, n, r) => {
    const k = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0],
      u = nm(cr(n, k)),
      w = cr(n, u),
      o = [];
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      o.push([0, 1, 2].map(j => cen[j] + u[j] * r * Math.cos(t) + w[j] * r * Math.sin(t)));
    }
    return o;
  };
  parts.forEach(pt => {
    if (pt.hw) return;
    const s = pt.s,
      o = pt.o,
      n = nm(s.e);
    let HS = [];
    try {
      HS = asHoles(s, ctr, G);
    } catch (e) {
      oops('techdraw #1', e);
    }
    const vis = out => dot(out, f) < 0,
      dep = isB => (isB ? pt.dB : pt.dA) - 0.01;
    HS.forEach(hh => {
      (hh.face === 'T' ? ['A', 'B'] : [hh.face]).forEach(F => {
        const isB = F === 'B',
          out = isB ? n : n.map(x => -x);
        if (!vis(out)) return;
        const cen = (isB ? hh.B : hh.A).map((x, k) => x + o[k] + out[k] * 0.3);
        faces.push({
          e: tdPg(ring(cen, n, Math.max(hh.d / 2, 2.5)).map(P), {
            f: hh.kind === 'cup' ? 0.45 : 0.2,
            w: 'xthin',
            ly: 'HOLES'
          }),
          d: dep(isB)
        });
      });
    });
    const M = pt.mk;
    if (M.grain) {
      const isB = vis(n),
        out = isB ? n : n.map(x => -x);
      if (vis(out)) {
        const base = isB ? pt.B : pt.A,
          cen = [0, 1, 2].map(k => base.reduce((a, p) => a + p[k], 0) / base.length).map((x, k) => x + out[k] * 0.3),
          ext = [0, 1, 2].reduce((a, k) => a + Math.abs(M.grain[k]) * (s.bb[k][1] - s.bb[k][0]), 0) * 0.3,
          a = cen.map((x, k) => x - M.grain[k] * ext),
          b = cen.map((x, k) => x + M.grain[k] * ext),
          side = nm(cr(n, M.grain)),
          hd = Math.min(25, ext * 0.25),
          head = (p, dir) => [
            p.map((x, k) => x - dir * M.grain[k] * hd + side[k] * hd * 0.5),
            p,
            p.map((x, k) => x - dir * M.grain[k] * hd - side[k] * hd * 0.5)
          ];
        faces.push(
          { e: tdPg([a, b].map(P), { c: false, w: 'thin', ly: 'GRAIN' }), d: dep(isB) },
          { e: tdPg(head(b, 1).map(P), { c: false, w: 'thin', ly: 'GRAIN' }), d: dep(isB) },
          { e: tdPg(head(a, -1).map(P), { c: false, w: 'thin', ly: 'GRAIN' }), d: dep(isB) }
        );
      }
    }
    if (M.tri && vis(M.tri.out)) {
      const isB = dot(M.tri.out, n) > 0;
      faces.push({
        e: tdPg(
          M.tri.pts.map(p => P(p.map((x, k) => x + o[k]))),
          { f: 0.35, w: 'xthin', ly: 'MARKS' }
        ),
        d: dep(isB)
      });
    }
  });
  // assembly lines: screw → the board it goes into (painted at the depth of the screw, so nearer boards cover them)
  H.lines.forEach(L => {
    const oa = V3.a(tdOffset(L.ah, c, EX), L.ax || [0, 0, 0]),
      ob = tdOffset(L.bh, c, EX),
      a = V3.a(L.a, oa),
      b = V3.a(L.b, ob);
    faces.push({
      e: tdPg([P(a), P(b)], { c: false, d: 1, w: 'xthin', ly: 'ASSEMBLY' }),
      d: Math.min(dot(a, f), dot(b, f)) - 1
    });
  });
  faces.sort((a, b) => b.d - a.d);
  const E = faces.map(F => F.e);
  const list = parts
    .filter(pt => !pt.hw)
    .map((pt, i) => {
      const s = pt.s,
        ex = [0, 1, 2].map(k => s.bb[k][1] - s.bb[k][0]),
        t = s.t || Math.min(...ex),
        o = ex.filter((x, k) => k !== s.ax).sort((a, b) => b - a);
      return { no: i + 1, name: tdPartName(s, c), L: o[0], W: o[1], t, role: s.role, lab: P(pt.m) };
    });
  const grp = {};
  list.forEach(r => {
    const k = r.name + '|' + f0(r.L) + '|' + f0(r.W) + '|' + f0(r.t);
    (grp[k] = grp[k] || { ...r, q: 0, nos: [] }).q++;
    grp[k].nos.push(r.no);
  });
  const rows = Object.values(grp)
    .sort((a, b) => a.nos[0] - b.nos[0])
    .map((r, j) => Object.assign(r, { tag: j < 26 ? String.fromCharCode(65 + j) : 'Z' + (j - 25) }));
  rows.forEach(r =>
    list
      .filter(l => r.nos.includes(l.no))
      .forEach(l => E.push({ t: 'lab', p: l.lab.slice(), a: l.lab.slice(), s: r.tag, ly: 'TEXT' }))
  );
  H.types.forEach(T => {
    const pt = parts.filter(p => p.hw && p.s.hw === T.k);
    if (!pt.length) return;
    const one = pt.reduce((a, b) => (P(b.m)[1] > P(a.m)[1] ? b : a)),
      a = P(one.m);
    E.push({ t: 'lab', p: a.slice(), a, s: String(T.no), hw: 1, ly: 'TEXT' });
  });
  const all = E.flatMap(e => (e.t === 'lab' ? [e.p] : e.p || []));
  const bb = [
    [Math.min(...all.map(p => p[0])), Math.min(...all.map(p => p[1]))],
    [Math.max(...all.map(p => p[0])), Math.max(...all.map(p => p[1]))]
  ];
  const pad = Math.max(bb[1][0] - bb[0][0], bb[1][1] - bb[0][1]) * 0.05;
  bb[0][0] -= pad;
  bb[0][1] -= pad;
  bb[1][0] += pad;
  bb[1][1] += pad;
  return { E, bb, rows, hw: H.types };
}
/* spread the letters and numbers so they don't sit on top of each other (den = scale) */
function tdRelax(V, den) {
  const L = V.E.filter(e => e.t === 'lab');
  if (!L.length) return;
  const r = 2.6 * den;
  L.forEach(l => {
    if (l.hw) {
      l.p = [l.a[0] + 6 * den, l.a[1] + 6 * den];
    }
  });
  for (let it = 0; it < 60; it++) {
    let mv = 0;
    for (let i = 0; i < L.length; i++)
      for (let j = i + 1; j < L.length; j++) {
        const a = L[i],
          b = L[j],
          dx = b.p[0] - a.p[0],
          dy = b.p[1] - a.p[1],
          d = Math.hypot(dx, dy) || 0.01,
          need = 2 * r + 0.6 * den;
        if (d < need) {
          const k = (need - d) / 2,
            ux = d > 0.02 ? dx / d : i % 2 ? 1 : -1,
            uy = d > 0.02 ? dy / d : 0.3;
          a.p[0] -= ux * k;
          a.p[1] -= uy * k;
          b.p[0] += ux * k;
          b.p[1] += uy * k;
          mv = 1;
        }
      }
    if (!mv) break;
  }
  L.forEach(l => {
    V.bb[0][0] = Math.min(V.bb[0][0], l.p[0] - r);
    V.bb[0][1] = Math.min(V.bb[0][1], l.p[1] - r);
    V.bb[1][0] = Math.max(V.bb[1][0], l.p[0] + r);
    V.bb[1][1] = Math.max(V.bb[1][1], l.p[1] + r);
  });
}
/* ---------- sheets ---------- */
function tdScaleFor(w, h, aw, ah, max) {
  for (const d of TD_SCALES) {
    if (max && d < max) continue;
    if (w / d <= aw && h / d <= ah) return d;
  }
  return TD_SCALES[TD_SCALES.length - 1];
}
function tdSheets() {
  const G = build(JSON.parse(JSON.stringify(S))),
    sol = tdSolids(G),
    cols = tdCols(G, sol).filter(c => c.cs.length),
    [PW, PH] = TD_PAPER[TD.paper],
    M = 10,
    TB = TD.paper === 'A3' ? 20 : 16,
    aw = PW - 2 * M - 6,
    ah = PH - 2 * M - TB - 14,
    sheets = [],
    O = TD.sheets;
  if (!cols.length) return { sheets, cols, G };
  const one = (title, mk, o) => {
    o = o || {};
    let V = mk(20),
      w = V.bb[1][0] - V.bb[0][0],
      h = V.bb[1][1] - V.bb[0][1],
      d = tdScaleFor(w, h, aw, ah - (o.under || 0), o.min);
    V = mk(d);
    w = V.bb[1][0] - V.bb[0][0];
    h = V.bb[1][1] - V.bb[0][1];
    d = tdScaleFor(w, h, aw, ah - (o.under || 0), o.min);
    V = mk(d);
    return { title, views: [{ V, den: d, label: o.label || title }], extra: o.extra };
  };
  if (O.front)
    sheets.push(
      one(
        'Front view',
        d => {
          const V = tdFront(G, sol);
          tdFrontDims(V, G, cols, d, false);
          return V;
        },
        { label: 'Front view — sizes in mm' }
      )
    );
  if (O.setout) {
    const st = one(
      'Setting out',
      d => {
        const V = tdFront(G, sol, { boxesOnly: 1, cols });
        tdFrontDims(V, G, cols, d, true);
        return V;
      },
      { label: 'Where each box goes — positions from the left wall', under: Math.min(110, 22 + cols.length * 6.5) }
    );
    st.table = tdSetoutTable(G, cols);
    sheets.push(st);
  }
  if (O.plan) {
    const h = Math.min(1000, Math.max(300, ...cols.map(c => c.bx.y1 - 150)));
    sheets.push(
      one(
        'Plan',
        d => {
          const V = tdPlan(G, sol, h, d);
          tdPlanDims(V, cols, d, G.W);
          return V;
        },
        { label: `Plan — cut at ${f0(h)} mm above the floor, seen from above` }
      )
    );
  }
  if (O.sec) {
    let d = 20;
    const secs = cols.filter(c => c.q && !c.q.panel).map(c => ({ c, mk: dd => tdSection(G, sol, c, dd) }));
    const sz = x => {
      const V = x.mk(d);
      return [V.bb[1][0] - V.bb[0][0], V.bb[1][1] - V.bb[0][1]];
    };
    const tall = secs.length ? 0 : 0;
    if (secs.length) {
      const tall = Math.max(...secs.map(x => sz(x)[1]));
      while (tall / d > ah - 10 && d < 100) d = TD_SCALES[TD_SCALES.indexOf(d) + 1];
      let cur = [],
        used = 0;
      const flush = () => {
        if (cur.length)
          sheets.push({
            title: 'Sections',
            views: cur.map(x => ({ V: x.mk(d), den: d, label: `Section through column ${x.c.n}` }))
          });
        cur = [];
        used = 0;
      };
      secs.forEach(x => {
        const w = sz(x)[0] / d + 8;
        if (used + w > aw && cur.length) flush();
        cur.push(x);
        used += w;
      });
      flush();
    }
  }
  if (O.det) {
    const c = cols.find(c => c.q && !c.q.panel && !c.q.desk) || cols[0];
    const SV = tdSection(G, sol, c, 5),
      PV = tdPlan(G, sol, Math.min(1000, c.bx.y1 - 150), 5),
      Dw = SV.Dw,
      fz = SV.fz,
      P = c.bx.y0,
      top = SV.topCut || tdTopAt(c.cs, SV.cx),
      cH = SV.cH;
    const win = (V, x0, y0, x1, y1, lab, dims) => {
      const E = V.E.slice();
      dims(E);
      return {
        V: {
          E,
          bb: [
            [x0, y0],
            [x1, y1]
          ],
          clip: 1
        },
        den: 5,
        label: lab
      };
    };
    const views = [
      win(SV, Dw - 260, -60, Dw + fz + 70, Math.max(P, 90) + 160, `Detail 1 — plinth (column ${c.n})`, E => {
        if (P > 1) tdDim(E, [Dw + fz + 5, 0], [Dw + fz + 5, P], 'v', Dw + fz + 40, 5);
      }),
      win(SV, Dw - 260, top - 200, Dw + fz + 70, cH + 70, `Detail 2 — top strip (column ${c.n})`, E => {
        if (cH - top > 1) tdDim(E, [Dw + fz + 5, top], [Dw + fz + 5, cH], 'v', Dw + fz + 40, 5);
      }),
      win(PV, -70, -fz - 110, 260, Math.min(PV.Dw, 300), 'Detail 3 — side strip at the left wall', E => {
        if (c.bx.x0 > 1 && cols[0]) tdDim(E, [0, -fz], [cols[0].bx.x0, -fz], 'h', -fz - 60, 5);
      })
    ];
    sheets.push({ title: 'Details', views });
  }
  if (O.expl) {
    cols
      .filter(c => c.q && !c.q.panel)
      .forEach(c => {
        const X = tdExploded(c, G),
          tw = TD.paper === 'A3' ? 150 : 112;
        let w = X.bb[1][0] - X.bb[0][0],
          h = X.bb[1][1] - X.bb[0][1],
          d = tdScaleFor(w, h, aw - tw - 8, ah - 8, 10);
        tdRelax(X, d);
        w = X.bb[1][0] - X.bb[0][0];
        h = X.bb[1][1] - X.bb[0][1];
        const d2 = tdScaleFor(w, h, aw - tw - 8, ah - 8, 10);
        if (d2 !== d) {
          d = d2;
        }
        sheets.push({
          title: `Exploded view — box ${c.n}`,
          views: [{ V: X, den: d, label: `Box ${c.n}, pulled apart — letters = parts, numbers = hardware` }],
          parts: X.rows,
          hw: X.hw,
          c
        });
      });
  }
  return { sheets, cols, G };
}
function tdSetoutTable(G, cols) {
  return cols.map(c => {
    const q = c.q,
      t = q.panel ? 'Panel wall' : q.door ? 'Door' : q.desk ? 'Desk' : 'Cabinet';
    return [
      String(c.n),
      t,
      f0(c.bx.x0),
      f0(c.bx.x1),
      f0(c.bx.x1 - c.bx.x0),
      f0(tdTopAt(c.cs, c.bx.x0 + 2)),
      f0(tdTopAt(c.cs, c.bx.x1 - 2)),
      f0(c.bx.z1 - c.bx.z0),
      f0(c.bx.y0)
    ];
  });
}
/* ---------- vector PDF ---------- */
const TD_WIN = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x2191: 0x5e
};
function tdHex(s) {
  let h = '';
  for (const ch of String(s)) {
    let c = ch.codePointAt(0);
    if (TD_WIN[c]) c = TD_WIN[c];
    else if (c > 255) c = 63;
    h += c.toString(16).padStart(2, '0');
  }
  return '<' + h + '>';
}
const TD_K = 72 / 25.4,
  tdN = v => (Math.round(v * 100) / 100).toString();
function tdOps() {
  const o = [];
  return {
    o,
    pg(pts, close, fill, lw, dash) {
      if (pts.length < 2) return;
      o.push(`${tdN(lw * TD_K)} w ${dash ? '[2 1.5] 0 d' : '[] 0 d'}`);
      if (fill != null) o.push(`${tdN(fill)} g`);
      o.push(`${tdN(pts[0][0] * TD_K)} ${tdN(pts[0][1] * TD_K)} m`);
      for (let i = 1; i < pts.length; i++) o.push(`${tdN(pts[i][0] * TD_K)} ${tdN(pts[i][1] * TD_K)} l`);
      o.push(close ? (fill != null ? 'b' : 's') : 'S');
    },
    tx(x, y, s, hmm, al, rot, bold) {
      const sz = (hmm / 0.72) * TD_K,
        w = tdTW(s, hmm);
      let dx = al === 'c' ? -w / 2 : al === 'r' ? -w : 0;
      const r = ((rot || 0) * Math.PI) / 180,
        c = Math.cos(r),
        sn = Math.sin(r);
      const X = x + dx * c,
        Y = y + dx * sn;
      o.push(
        `0 g BT /${bold ? 'F2' : 'F1'} ${tdN(sz)} Tf ${tdN(c)} ${tdN(sn)} ${tdN(-sn)} ${tdN(c)} ${tdN(X * TD_K)} ${tdN(Y * TD_K)} Tm ${tdHex(s)} Tj ET`
      );
    },
    raw(s) {
      o.push(s);
    }
  };
}
function tdRenderView(R, V, den, x0, y0) {
  const bx = V.bb[0][0],
    by = V.bb[0][1],
    T = p => [x0 + (p[0] - bx) / den, y0 + (p[1] - by) / den];
  if (V.clip) {
    const w = (V.bb[1][0] - bx) / den,
      h = (V.bb[1][1] - by) / den;
    R.raw(`q ${tdN(x0 * TD_K)} ${tdN(y0 * TD_K)} ${tdN(w * TD_K)} ${tdN(h * TD_K)} re W n`);
  }
  V.E.forEach(e => {
    if (e.t === 'lab') {
      const p = T(e.p),
        a = e.a ? T(e.a) : p;
      if (Math.hypot(p[0] - a[0], p[1] - a[1]) > 2.6) {
        R.pg([a, p], false, null, 0.12);
        R.pg(tdArc(a, 0.5, 0, 360).p, true, 0, 0.1);
      }
      R.pg(tdArc(p, 2.2, 0, 360).p, true, e.hw ? 0.82 : 1, e.hw ? 0.25 : 0.15);
      R.tx(p[0], p[1] - 1.05, e.s, 2.2, 'c', 0, 1);
      return;
    }
    if (e.t === 'pg') {
      R.pg(e.p.map(T), e.c, e.f, TD_LW[e.w] || 0.15, e.d);
      if (e.lab) {
        const p = T(e.p[0]);
        R.pg(tdArc([p[0] - 1, p[1]], 2.2, 0, 360).p, true, 1, 0.15);
        R.tx(p[0] - 1, p[1] - 1.05, e.lab, 2.2, 'c', 0, 1);
      }
    } else if (e.t === 'tx') {
      const p = T(e.p);
      R.tx(p[0], p[1], e.s, e.h, e.al, e.r, e.b);
    }
  });
  if (V.clip) {
    R.raw('Q');
    const w = (V.bb[1][0] - bx) / den,
      h = (V.bb[1][1] - by) / den;
    R.pg(
      [
        [x0, y0],
        [x0 + w, y0],
        [x0 + w, y0 + h],
        [x0, y0 + h]
      ],
      true,
      null,
      0.3
    );
  }
}
function tdSheetOps(sh, no, tot, meta) {
  const [PW, PH] = TD_PAPER[TD.paper],
    M = 10,
    TB = TD.paper === 'A3' ? 20 : 16,
    R = tdOps();
  R.raw('1 J 1 j 0 G');
  R.pg(
    [
      [M, M],
      [PW - M, M],
      [PW - M, PH - M],
      [M, PH - M]
    ],
    true,
    null,
    0.5
  );
  R.pg(
    [
      [M, M + TB],
      [PW - M, M + TB]
    ],
    false,
    null,
    0.35
  );
  // title block: Fitted by BRUIS | project | drawing | scale | paper | date | sheet
  const cells = [
    [70, 'Fitted by BRUIS', 'built-in cabinets · sizes in mm'],
    [PW - 2 * M - 70 - 38 - 24 - 28 - 22, 'Project: ' + meta.name, sh.title],
    [38, 'Scale', sh.views.length ? [...new Set(sh.views.map(v => '1:' + v.den))].join(', ') : '—'],
    [24, 'Paper', TD.paper],
    [28, 'Date', meta.date],
    [22, 'Sheet', `${no} / ${tot}`]
  ];
  let x = M;
  cells.forEach(([w, a, b], i) => {
    if (i)
      R.pg(
        [
          [x, M],
          [x, M + TB]
        ],
        false,
        null,
        0.25
      );
    R.tx(x + 2.5, M + TB - 5.2, a, i ? 2 : 3.2, 'l', 0, i === 0);
    R.tx(x + 2.5, M + 4, b, i === 1 ? 3.4 : 2.6, 'l', 0, i === 1);
    x += w;
  });
  const aw = PW - 2 * M - 6,
    ah = PH - 2 * M - TB - 14,
    top = PH - M - 4;
  if (sh.parts) {
    const v = sh.views[0],
      tw = TD.paper === 'A3' ? 150 : 112,
      w = (v.V.bb[1][0] - v.V.bb[0][0]) / v.den,
      h = (v.V.bb[1][1] - v.V.bb[0][1]) / v.den,
      x0 = M + 3 + (aw - tw - 8 - w) / 2,
      y0 = M + TB + 10 + (ah - h) / 2;
    tdRenderView(R, v.V, v.den, x0, y0);
    R.tx(M + 3 + (aw - tw - 8) / 2, M + TB + 4, `${v.label}  ·  1:${v.den}`, 2.6, 'c', 0, 1);
    tdPartsTable(R, sh, PW - M - 3 - tw, top - 2, tw);
    return R.o.join('\n');
  }
  const ws = sh.views.map(v => (v.V.bb[1][0] - v.V.bb[0][0]) / v.den),
    hs = sh.views.map(v => (v.V.bb[1][1] - v.V.bb[0][1]) / v.den),
    under = sh.table ? Math.min(110, 22 + sh.table.length * 6.5) : 0,
    gap = Math.max(4, (aw - ws.reduce((a, b) => a + b, 0)) / (sh.views.length + 1));
  let cx = M + 3 + gap;
  sh.views.forEach((v, i) => {
    const y0 = M + TB + 10 + under + Math.max(0, (ah - under - hs[i]) / 2);
    tdRenderView(R, v.V, v.den, cx, y0);
    R.tx(cx + ws[i] / 2, y0 - 6, `${v.label}  ·  1:${v.den}`, 2.6, 'c', 0, 1);
    cx += ws[i] + gap;
  });
  if (sh.table)
    tdTable(
      R,
      M + 3,
      M + TB + 6 + under - 4,
      aw,
      ['Box', 'Type', 'From left wall', 'To', 'Width', 'Height left', 'Height right', 'Depth', 'Bottom at'],
      sh.table,
      'Measure from the left wall at floor level. Heights include the plinth; the closing strips fill the gaps to the walls and the ceiling.'
    );
  return R.o.join('\n');
}
function tdTable(R, x, ytop, w, head, rows, note) {
  const rh = 6.2,
    cw = w / head.length;
  let y = ytop;
  R.pg(
    [
      [x, y],
      [x + w, y]
    ],
    false,
    null,
    0.35
  );
  head.forEach((h, i) => R.tx(x + i * cw + 1.5, y - 4.4, h, 2.2, 'l', 0, 1));
  y -= rh;
  R.pg(
    [
      [x, y],
      [x + w, y]
    ],
    false,
    null,
    0.25
  );
  rows.forEach(r => {
    r.forEach((v, i) => R.tx(x + i * cw + 1.5, y - 4.4, v, 2.3, 'l'));
    y -= rh;
    R.pg(
      [
        [x, y],
        [x + w, y]
      ],
      false,
      null,
      0.1
    );
  });
  if (note) R.tx(x, y - 5, note, 2.1, 'l');
}
function tdPartsTable(R, sh, x, ytop, w) {
  const M = S.mat,
    mn = role => {
      const k = /^fabric/.test(role)
          ? 'front'
          : { front: 'front', back: 'back', shelf: 'shelf', skirt: 'skirt', desk: 'desk' }[role] || 'carcass',
        m = M[k];
      return m ? (MATS[m.type] || {}).short || m.type : '';
    };
  R.tx(x, ytop - 4, `Parts of box ${sh.c.n}`, 3.2, 'l', 0, 1);
  let y = ytop - 9;
  const cols = [
      [0, 'Part'],
      [10, 'Name'],
      [42, 'Qty'],
      [52, 'Length'],
      [72, 'Width'],
      [92, 'Thick'],
      [106, 'Board']
    ],
    sc = w / 150;
  cols.forEach(([cx, h]) => R.tx(x + cx * sc, y - 4, h, 2.1, 'l', 0, 1));
  y -= 6;
  R.pg(
    [
      [x, y],
      [x + w, y]
    ],
    false,
    null,
    0.3
  );
  sh.parts.forEach(r => {
    R.pg(tdArc([x + 2.6, y - 3.1], 2.2, 0, 360).p, true, 1, 0.15);
    R.tx(x + 2.6, y - 4.15, r.tag, 2.1, 'c', 0, 1);
    [
      [10, r.name],
      [42, String(r.q)],
      [52, f0(r.L)],
      [72, f0(r.W)],
      [92, f0(r.t)],
      [106, mn(r.role)]
    ].forEach(([cx, v]) => R.tx(x + cx * sc, y - 4.2, v, 2.2, 'l'));
    y -= 6.2;
    R.pg(
      [
        [x, y],
        [x + w, y]
      ],
      false,
      null,
      0.1
    );
  });
  R.tx(x, y - 5, 'Exact sizes, edge banding and drilling: see the cut list.', 2, 'l');
  y -= 12;
  if (sh.hw && sh.hw.length) {
    R.tx(x, y - 4, `Hardware for box ${sh.c.n}`, 3.2, 'l', 0, 1);
    y -= 9;
    [
      [0, 'No.'],
      [10, 'What'],
      [96, 'Qty']
    ].forEach(([cx, h]) => R.tx(x + cx * sc, y - 4, h, 2.1, 'l', 0, 1));
    y -= 6;
    R.pg(
      [
        [x, y],
        [x + w, y]
      ],
      false,
      null,
      0.3
    );
    sh.hw.forEach(r => {
      R.pg(tdArc([x + 2.6, y - 3.1], 2.2, 0, 360).p, true, 0.82, 0.25);
      R.tx(x + 2.6, y - 4.15, String(r.no), 2.1, 'c', 0, 1);
      R.tx(x + 10 * sc, y - 4.2, r.name, 2.2, 'l');
      R.tx(x + 96 * sc, y - 4.2, String(r.q), 2.2, 'l');
      y -= 4.6;
      R.tx(x + 10 * sc, y - 3.4, r.how, 1.8, 'l');
      y -= 4.4;
      R.pg(
        [
          [x, y],
          [x + w, y]
        ],
        false,
        null,
        0.1
      );
    });
    y -= 4;
  }
  const lg = [
    'Dark strip = the front edge (gets edge band)',
    'Dark triangle = the inside face, its tip points to the front',
    'Arrow on a board = the grain direction',
    'Grey rings = holes  ·  dashed line = what goes into what'
  ];
  lg.forEach(t => {
    R.tx(x, y - 4, t, 2, 'l');
    y -= 4.4;
  });
  return y;
}
function pdfVec(pages) {
  const objs = [
      null,
      null,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
    ],
    kids = [];
  pages.forEach(pg => {
    objs.push(`<< /Length ${pg.ops.length} >>\nstream\n${pg.ops}\nendstream`);
    const cid = objs.length;
    objs.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${tdN(pg.w)} ${tdN(pg.h)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${cid} 0 R >>`
    );
    kids.push(objs.length);
  });
  objs[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[1] = `<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
  let out = '%PDF-1.4\n',
    offs = [];
  objs.forEach((o, i) => {
    offs.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xr = out.length;
  out +=
    `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` +
    offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') +
    `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  return new Blob([out], { type: 'application/pdf' });
}
async function tdExportPDF() {
  toast('Drawing the sheets…');
  await new Promise(r => setTimeout(r, 30));
  let R;
  try {
    R = tdSheets();
  } catch (e) {
    console.error(e);
    toast('The drawings could not be made for this design');
    return;
  }
  if (!R.sheets.length) {
    toast('Pick at least one kind of sheet');
    return;
  }
  const [PW, PH] = TD_PAPER[TD.paper],
    meta = { name: curName(), date: new Date().toLocaleDateString(tr('@date')) };
  const pages = R.sheets.map((sh, i) => ({
    w: PW * TD_K,
    h: PH * TD_K,
    ops: tdSheetOps(sh, i + 1, R.sheets.length, meta)
  }));
  saveFile(`${slugOf(meta.name)}-drawings-${TD.paper}.pdf`, pdfVec(pages), 'Technical drawings');
}
/* ---------- DXF of the whole wall: front view, plan below it, sections to the right — 1:1 in mm ---------- */
function tdDXF() {
  const G = build(JSON.parse(JSON.stringify(S))),
    sol = tdSolids(G),
    cols = tdCols(G, sol).filter(c => c.cs.length),
    den = 20,
    W = G.W;
  const parts = [];
  const F = tdFront(G, sol);
  tdFrontDims(F, G, cols, den, false);
  parts.push({ E: F.E, dx: 0, dy: 0, title: 'FRONT VIEW' });
  const h = Math.min(1000, Math.max(300, ...cols.map(c => c.bx.y1 - 150))),
    Pv = tdPlan(G, sol, h, den);
  tdPlanDims(Pv, cols, den, W);
  parts.push({ E: Pv.E, dx: 0, dy: F.bb[0][1] - Pv.bb[1][1] - 1500, title: `PLAN (cut at ${f0(h)} mm)` });
  let x = W + 2500;
  cols
    .filter(c => c.q && !c.q.panel)
    .forEach(c => {
      const V = tdSection(G, sol, c, den);
      parts.push({ E: V.E, dx: x - V.bb[0][0], dy: 0, title: `SECTION COLUMN ${c.n}` });
      x += V.bb[1][0] - V.bb[0][0] + 800;
    });
  const L = [],
    e = (c, v) => L.push(String(c), String(v)),
    f = v => (+v).toFixed(2),
    lays = new Set(['TEXT']);
  parts.forEach(p => p.E.forEach(en => lays.add(en.ly || 'OTHER')));
  const col = {
    WALL: 8,
    CARCASS: 7,
    SHELVES: 3,
    BACKS: 9,
    FRONTS: 5,
    STRIPS_PLINTH: 6,
    DESK: 30,
    DIMENSIONS: 1,
    TEXT: 7,
    DOOR_SWING: 4,
    OTHER: 2
  };
  e(0, 'SECTION');
  e(2, 'HEADER');
  e(9, '$ACADVER');
  e(1, 'AC1009');
  e(9, '$INSUNITS');
  e(70, 4);
  e(0, 'ENDSEC');
  e(0, 'SECTION');
  e(2, 'TABLES');
  e(0, 'TABLE');
  e(2, 'LTYPE');
  e(70, 2);
  e(0, 'LTYPE');
  e(2, 'CONTINUOUS');
  e(70, 0);
  e(3, 'Solid line');
  e(72, 65);
  e(73, 0);
  e(40, '0.0');
  e(0, 'LTYPE');
  e(2, 'DASHED');
  e(70, 0);
  e(3, 'Dashed');
  e(72, 65);
  e(73, 2);
  e(40, '60.0');
  e(49, '40.0');
  e(49, '-20.0');
  e(0, 'ENDTAB');
  e(0, 'TABLE');
  e(2, 'LAYER');
  e(70, lays.size);
  [...lays].forEach(n => {
    e(0, 'LAYER');
    e(2, n);
    e(70, 0);
    e(62, col[n] || 7);
    e(6, 'CONTINUOUS');
  });
  e(0, 'ENDTAB');
  e(0, 'ENDSEC');
  e(0, 'SECTION');
  e(2, 'ENTITIES');
  const txt = (x, y, s, hh, ly, rot, al) => {
    const s2 = String(s).replace(/[^\x20-\x7E]/g, c =>
      c === '×' ? 'x' : c === '–' || c === '—' ? '-' : c === '↑' ? '^' : ''
    );
    e(0, 'TEXT');
    e(8, ly);
    e(10, f(x));
    e(20, f(y));
    e(30, '0.0');
    e(40, f(hh));
    e(1, s2);
    if (rot) e(50, f(rot));
    if (al) {
      e(72, al === 'c' ? 1 : 2);
      e(11, f(x));
      e(21, f(y));
      e(31, '0.0');
    }
  };
  parts.forEach(p => {
    const T = q => [q[0] + p.dx, q[1] + p.dy];
    p.E.forEach(en => {
      const ly = en.ly || 'OTHER';
      if (en.t === 'pg') {
        const pts = en.p.map(T);
        if (pts.length === 2 && !en.c) {
          e(0, 'LINE');
          e(8, ly);
          if (en.d) e(6, 'DASHED');
          e(10, f(pts[0][0]));
          e(20, f(pts[0][1]));
          e(30, '0.0');
          e(11, f(pts[1][0]));
          e(21, f(pts[1][1]));
          e(31, '0.0');
        } else {
          e(0, 'POLYLINE');
          e(8, ly);
          if (en.d) e(6, 'DASHED');
          e(66, 1);
          e(70, en.c ? 1 : 0);
          pts.forEach(([x_, y_]) => {
            e(0, 'VERTEX');
            e(8, ly);
            e(10, f(x_));
            e(20, f(y_));
            e(30, '0.0');
          });
          e(0, 'SEQEND');
          e(8, ly);
        }
      } else if (en.t === 'tx') {
        const q = T(en.p);
        txt(q[0], q[1], en.s, en.h * den, ly, en.r, en.al === 'l' ? '' : en.al);
      }
    });
    const xs = p.E.flatMap(en => (en.p && en.p.length ? (en.t === 'tx' ? [en.p] : en.p) : [])).map(T),
      mx = Math.min(...xs.map(q => q[0])),
      my = Math.max(...xs.map(q => q[1]));
    txt(mx, my + 400, p.title, 120, 'TEXT');
  });
  e(0, 'ENDSEC');
  e(0, 'EOF');
  saveFile(
    `${slugOf(curName())}-wall.dxf`,
    new Blob([L.join('\r\n') + '\r\n'], { type: 'application/dxf' }),
    'DXF of the wall'
  );
}
/* ---------- the dialog ---------- */
const TD_KINDS = [
  ['front', 'Front view', 'The whole wall with all sizes'],
  ['setout', 'Setting out', 'Where each box goes, measured from the left wall, with a table'],
  ['plan', 'Plan', 'Seen from above, cut through the cabinets, with door swings'],
  ['sec', 'Side sections', 'A cut through every column, with the height of every board'],
  ['det', 'Details', 'Plinth, top strip and side strip at 1:5'],
  ['expl', 'Exploded views', 'Each box pulled apart, with its parts list — one sheet per box']
];
function tdOpen() {
  let m = document.getElementById('tdm');
  if (!m) {
    m = document.createElement('div');
    m.id = 'tdm';
    m.className = 'modal';
    document.body.appendChild(m);
    m.addEventListener('click', e => {
      if (e.target === m) m.hidden = true;
    });
  }
  ['mmenu', 'iom', 'pdfm'].forEach(id => {
    const x = document.getElementById(id);
    if (x) x.hidden = true;
  });
  m.hidden = false;
  tdRender();
}
function tdBodyHTML(inline) {
  return `<p class="hintp" style="margin:0">Drawing sheets for a cabinet maker, a joiner or yourself: true to scale, crisp lines, sizes in millimetres, with a title block on every sheet.</p>
    <div class="fld"><span>Paper</span><div class="seg">${['A3', 'A4'].map(p => `<button type="button" class="${TD.paper === p ? 'on' : ''}" data-act="tdPaper" data-a="${p}">${p}${p === 'A3' ? ' — usual for makers' : ' — easy to print at home'}</button>`).join('')}</div></div>
    <div class="tdk">${TD_KINDS.map(([k, l, d]) => `<label class="tdkb ${TD.sheets[k] ? 'on' : ''}"><input type="checkbox" data-tdk="${k}" ${TD.sheets[k] ? 'checked' : ''}><b>${l}</b><small>${d}</small></label>`).join('')}</div>
    <div class="dbtns"><button type="button" class="btn pri" data-act="tdPDF">Download drawings (PDF)</button><button type="button" class="btn" data-act="tdDXF">Download the whole wall (DXF)</button></div>
    <p class="hintp" style="margin:0">The DXF has the front view, the plan and every section at full size (1 unit = 1 mm), with layers for walls, carcass, fronts, shelves, backs, plinth and dimensions — it opens in AutoCAD, SketchUp, Fusion, LibreCAD and most CAD programs. For CNC files of the separate parts, see Order → Files.</p>`;
}
function tdRender() {
  const m = document.getElementById('tdm');
  if (m && !m.hidden)
    m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true" aria-label="Technical drawings"><div class="mhead"><h2>Technical drawings</h2></div><div class="mbody" style="display:grid;gap:14px">${tdBodyHTML()}</div><div class="mfoot"><button type="button" class="btn" data-act="tdClose">Close</button><div></div></div></div>`;
  if (ui.tab === 'draw') {
    dirty.draw = true;
    renderTab('draw');
  }
}
document.addEventListener('change', e => {
  const k = e.target && e.target.dataset && e.target.dataset.tdk;
  if (!k) return;
  TD.sheets[k] = e.target.checked ? 1 : 0;
  const l = e.target.closest('.tdkb');
  if (l) l.classList.toggle('on', e.target.checked);
});
