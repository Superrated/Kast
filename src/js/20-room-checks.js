/* ==== 20-room-checks.js ====
   Checks and helpers that look at the whole room: getting it in (doors, stairs, hatch), weight and wall fixing, time and weekend plan, several walls and corners (any angle, diagonal corner cabinet, tapering), and room restrictions (bumps, ceiling things, side-wall doors and windows, space in front).
*/
/* ===== getting it into the room: doors, stairs, hatch ===== */
const ACC_KINDS = [
  ['door', '🚪', 'Doorway', 'The narrowest door on the way'],
  ['stairs', '🪜', 'Stairs', 'The staircase up'],
  ['hatch', '🕳️', 'Hatch', 'A loft hatch or small opening']
];
function accRoute(A) {
  if (!A) return [];
  return ACC_KINDS.map(([k]) => Object.assign({ kind: k }, A[k] || {})).filter(o => o.on && +o.w > 0 && +o.h > 0);
}
/* largest flat-ish object (length l, smaller sides m×s) that gets round a turn of corridor width a with headroom hh — rough, errs on the safe side */
function accTurnMax(a, s, m, hh) {
  const a_ = Math.max(1, a - s),
    flat = Math.pow(2 * Math.pow(a_, 2 / 3), 1.5),
    tilt = Math.max(0, hh - m);
  return Math.sqrt(flat * flat + tilt * tilt);
}
function accFitOne(dims, o) {
  const [l, m, s] = dims.slice().sort((a, b) => b - a),
    w = +o.w,
    h = +o.h,
    lo = Math.min(w, h),
    hi = Math.max(w, h);
  if (s > lo + 0.5 || m > hi + 0.5)
    return {
      ok: false,
      why: `${f0(m)} × ${f0(s)} mm across is more than the ${f0(w)} × ${f0(h)} mm ${o.kind === 'stairs' ? 'stair width × headroom' : o.kind === 'hatch' ? 'hatch' : 'doorway'}`
    };
  if (o.kind === 'stairs' && o.turn && o.turn !== 'none') {
    const k_ = o.turn === 'half' ? 0.9 : 1,
      mx = accTurnMax(w, s, m, h) * k_,
      up = l <= h - 50 && m <= accTurnMax(w, s, 0, 0) * k_;
    if (l > mx && !up)
      return {
        ok: false,
        why: `${f0(l)} mm long — about ${f0(Math.floor(mx / 10) * 10)} mm is the most that gets round the ${o.turn === 'half' ? 'half turn' : 'turn'} in the stairs`
      };
  }
  return { ok: true };
}
function accFit(dims, route) {
  for (const o of route) {
    const r = accFitOne(dims, o);
    if (!r.ok) return Object.assign(r, { at: o.kind });
  }
  return { ok: true };
}
function accessCheck(G, St) {
  const route = accRoute(St.room && St.room.access);
  if (!route.length) {
    G.access = null;
    return;
  }
  const out = { route, boxes: [], parts: [] };
  const seen = new Set();
  G.panels.forEach(p => {
    const d = [p.w, p.h, p.t],
      k = p.type + '|' + Math.round(Math.max(p.w, p.h)) + '|' + Math.round(Math.min(p.w, p.h));
    if (seen.has(k)) return;
    seen.add(k);
    const r = accFit(d, route);
    if (!r.ok) out.parts.push({ name: p.type + (p.sec ? ' (' + p.sec + ')' : ''), dims: d, why: r.why, at: r.at });
  });
  if (G.boxes)
    G.secs.forEach(q => {
      if (q.panel || q.door) return;
      try {
        const top =
          Math.max(q.top ? q.top(q.bL) : 0, q.top ? q.top(q.bR) : 0) || Math.min(G.ceilAt(q.lx), G.ceilAt(q.rx));
        const d = [q.bR - q.bL, top - (q.Pq || 0), q.D || G.D];
        const r = accFit(d, route);
        out.boxes.push({ lab: 'S' + (q.i + 1), dims: d, ok: r.ok, why: r.why, at: r.at });
      } catch (e) {
        oops('room-checks #1', e);
      }
    });
  G.access = out;
  const AK = Object.fromEntries(ACC_KINDS.map(([k, , l]) => [k, l.toLowerCase()]));
  if (out.parts.length)
    G.warns.push(
      `Getting it in: ${out.parts.length === 1 ? 'one part does' : out.parts.length + ' parts do'} not get through the ${AK[out.parts[0].at]}: ${out.parts
        .slice(0, 3)
        .map(x => `${x.name} ${f0(Math.max(x.dims[0], x.dims[1]))} × ${f0(Math.min(x.dims[0], x.dims[1]))} mm`)
        .join(
          ', '
        )}${out.parts.length > 3 ? ' …' : ''}. Split ${out.parts.length === 1 ? 'it' : 'them'} in two (with the joint where it is hidden), or have it cut to size in the room.`
    );
  const bad = out.boxes.filter(b => !b.ok);
  if (bad.length && !out.parts.length)
    G.warns.push(
      `Getting it in: ${bad.length === out.boxes.length ? 'none of the boxes' : bad.map(b => b.lab).join(', ')} ${bad.length === 1 ? 'goes' : 'go'} through the ${AK[bad[0].at]} in one piece. No problem — carry the parts up and put ${bad.length === 1 ? 'that box' : 'those boxes'} together in the room.`
    );
}
/* ===== weight, wall fixing, time and plan ===== */
const DENS = {
  melamine: 650,
  mdfpaint: 750,
  mdfmicro: 750,
  veneer: 720,
  ply: 680,
  solid: 700,
  hdf: 850,
  hdf3: 900,
  hpl: 800
};
const WALLS = {
  brick: ['Brick', 'Ø8 nylon plug + 5 × 70 mm screw, 3 per box top rail', 3, 60],
  concrete: ['Concrete', 'Ø8 nylon plug + 5 × 70 mm screw (drill on hammer setting)', 3, 80],
  aerated: ['Aerated block (Ytong)', 'Ø8 aerated-concrete plug (e.g. Fischer GB 8) + 6 × 70 mm screw', 3, 35],
  studs: [
    'Plasterboard on wood studs / rafters',
    '5 × 80 mm wood screw straight into a stud or rafter — find them with a stud finder; between studs a metal cavity anchor (Molly HM 5)',
    2,
    25
  ],
  plaster: [
    'Plasterboard, no studs behind',
    'Metal cavity anchors (Molly HM 5 × 52) — only for anti-tip; let the cabinet stand on the floor',
    4,
    12
  ],
  wood: ['Wood (planks, OSB)', '5 × 60 mm wood screw, 3 per box', 3, 60]
};
function weightsOf(G) {
  const gs = groupsCache || (groupsCache = groupPanels(G)),
    cols = {},
    extra = { kg: 0 };
  const area = p => Math.abs(polyArea(p.poly)) / 1e6;
  G.panels.forEach(p => {
    const kg = area(p) * (p.t / 1000) * (DENS[p.matType] || 700),
      m = /^S(\d+)/.exec(p.sec || '');
    if (m) {
      const k = +m[1];
      (cols[k] = cols[k] || { board: 0, load: 0 }).board += kg;
    } else extra.kg += kg;
  });
  G.secs.forEach(q => {
    if (q.panel || q.door) return;
    const c = (cols[q.i + 1] = cols[q.i + 1] || { board: 0, load: 0 }),
      z_ = S.sections[q.i] || {};
    (q.zones || []).forEach(zr => {
      const z = zr.z || {},
        L = LOADS[z.load] || LOADS.normal,
        shA = (q.w / 1000) * ((q.D || G.D) / 1000);
      c.load += ((zr.shelvesY || []).length * shA * L.q * 1e6) / 9.81;
      if (z.rail) c.load += (q.w / 1000) * 25;
      if (z.type === 'open' && !(zr.shelvesY || []).length) c.load += (shA * L.q * 1e6) / 9.81;
    });
    c.load += G.fronts.filter(f => f.kind === 'drawer' && f.sec === q.i).length * 10;
    c.w = q.w;
    c.D = q.D || G.D;
  });
  const list = Object.entries(cols).map(([k, c]) => ({
    lab: 'S' + k,
    board: c.board,
    load: c.load,
    tot: c.board + c.load,
    w: c.w || 600,
    D: c.D || G.D
  }));
  const tot = list.reduce((a, c) => a + c.tot, 0) + extra.kg,
    board = list.reduce((a, c) => a + c.board, 0) + extra.kg,
    foot = (G.W / 1000) * (G.D / 1000);
  return { list, extra: extra.kg, tot, board, floor: foot ? tot / foot : 0 };
}
function fixHTML(G) {
  const W_ = weightsOf(G),
    wt = WALLS[S.room.wallType] ? S.room.wallType : '',
    k = v => f0(Math.round(v)) + ' kg';
  const boxes = G.secs.filter(q => !q.panel && !q.door).length,
    pts = wt ? Math.max(2, WALLS[wt][2]) * boxes : 0;
  return `<div class="wtgrid"><div><b>${k(W_.board)}</b><span>boards</span></div><div><b>${k(W_.tot)}</b><span>full, with contents</span></div><div><b>${f0(Math.round(W_.tot / Math.max(0.5, G.W / 1000)))} kg</b><span>per metre of wall, full</span></div></div>
  <table class="mini wtt"><tr><td class="note">Column</td><td class="note">Empty</td><td class="note">Full</td><td class="note">Carry</td></tr>${W_.list.map(c => `<tr><td>${c.lab}</td><td>${k(c.board)}</td><td>${k(c.tot)}</td><td>${c.board > 35 ? '2 people' : '1 person'}</td></tr>`).join('')}${W_.extra > 1 ? `<tr><td>Closing strips, plinth</td><td>${k(W_.extra)}</td><td></td><td></td></tr>` : ''}</table>
  ${W_.tot / Math.max(0.5, G.W / 1000) > 250 ? `<p class="hintp" style="color:var(--warn)">That is a heavy wall of storage. On concrete it is no problem; on an old timber attic floor, put the books near the walls the beams rest on, or ask someone who knows timber floors.</p>` : ''}
  <div class="fld"><span>What is the wall made of?</span>${seg(
    'room.wallType',
    Object.entries(WALLS).map(([k_, v]) => [k_, v[0]])
  )}</div>
  ${wt ? `<p class="hintp" style="margin:0"><b>Use:</b> ${WALLS[wt][1]}. About <b>${pts}</b> fixing points in all. ${wt === 'plaster' ? 'Plasterboard alone holds little — the cabinet must stand on its legs; the wall fixing only stops it tipping.' : 'The cabinet stands on its legs: the wall fixing keeps it upright and stops it tipping forward when a drawer is pulled out.'}</p>` : '<p class="hintp" style="margin:0">Pick the wall and Fitted tells you which plugs and screws to use.</p>'}`;
}
function planOf(G) {
  const gs = groupsCache || (groupsCache = groupPanels(G)),
    H = G.H,
    q = v => v || 0;
  let cp = null;
  try {
    cp = cutPlan(gs);
  } catch (e) {
    oops('room-checks #2', e);
  }
  const sheets = cp ? cp.plans.reduce((a, pl) => a + pl.sheets.length, 0) : 0,
    cuts = cp ? cp.ops.length : gs.reduce((a, p) => a + p.qty * 2, 0);
  const holes = gs.reduce((a, p) => a + (p.holes || []).length * p.qty, 0),
    band = gs.reduce((a, p) => a + p.bandM * p.qty, 0);
  const paintA = gs
      .filter(p => (MATS[p.matType] || {}).paint)
      .reduce((a, p) => a + (Math.abs(polyArea(p.poly)) / 1e6) * p.qty * 2, 0),
    microA = gs
      .filter(p => (MATS[p.matType] || {}).micro)
      .reduce((a, p) => a + (Math.abs(polyArea(p.poly)) / 1e6) * p.qty * 1.2, 0);
  const boxes = G.secs.filter(x => !x.panel && !x.door).length,
    doors = G.fronts.filter(f => f.kind === 'door').length,
    drawers = G.fronts.filter(f => f.kind === 'drawer').length,
    shelves = gs.filter(p => p.role === 'shelf').reduce((a, p) => a + p.qty, 0),
    skirts = gs.filter(p => p.role === 'skirt').reduce((a, p) => a + p.qty, 0);
  const shopCut = S.opts.shopCut;
  const st = [
    [
      'cut',
      'Cutting',
      shopCut ? 0.5 : (sheets * 12 + cuts * 2) / 60,
      shopCut ? 'collected from the shop' : `${sheets} sheets, ${cuts} cuts`
    ],
    ['band', 'Edge banding', (band * 3) / 60, `${f0(band)} m of edge`],
    ['drill', 'Drilling', (holes * 0.8 + doors * 2 * 3) / 60, `${holes} holes`],
    ['paint', 'Painting', paintA * 0.35, paintA ? `${f0(paintA)} m² — primer + 2 coats, a day drying in between` : ''],
    ['micro', 'Microcement', microA * 0.75, microA ? `${f0(microA)} m² — 3 or 4 thin layers, a day drying each` : ''],
    ['box', 'Building the boxes', boxes * 0.9 + shelves * 0.08, `${boxes} boxes`],
    ['place', 'Placing and fixing', boxes * 0.6 + 1, 'level, join and fix to the wall'],
    ['drw', 'Drawers', drawers * 0.75, `${drawers} drawers`],
    ['door', 'Doors', doors * 0.4, `${doors} doors with hinges, adjusted`],
    ['skirt', 'Skirts and plinth', skirts * 0.5 + 1, 'scribing to the walls and ceiling']
  ].filter(x => x[2] > 0.05);
  const tot = st.reduce((a, x) => a + x[2], 0),
    dry = (paintA ? 2 : 0) + (microA ? 3 : 0);
  // weekend plan: 6 working hours a day, drying days counted
  const days = [];
  let cur = { h: 0, t: [] };
  st.forEach(([k, n, h]) => {
    let left = h;
    while (left > 0.01) {
      const room = 6 - cur.h,
        take = Math.min(room, left);
      cur.t.push(n);
      cur.h += take;
      left -= take;
      if (cur.h >= 5.99) {
        days.push(cur);
        cur = { h: 0, t: [] };
      }
    }
    if ((k === 'paint' || k === 'micro') && cur.h > 0) {
      days.push(cur);
      cur = { h: 0, t: [] };
    }
  });
  if (cur.h > 0) days.push(cur);
  return { st, tot, dry, days: days.map(d => ({ h: d.h, t: [...new Set(d.t)] })) };
}
function planHTML(G) {
  const P = planOf(G),
    r = h => (h < 1 ? Math.round(h * 60) + ' min' : (Math.round(h * 2) / 2).toLocaleString('en-GB') + ' h');
  const wk = Math.ceil(P.days.length / 2);
  return `<div class="wtgrid"><div><b>≈ ${f0(Math.round(P.tot * 0.85))}–${f0(Math.round(P.tot * 1.25))} h</b><span>of work</span></div><div><b>${P.days.length} days</b><span>at 6 hours a day</span></div><div><b>${wk} weekend${wk > 1 ? 's' : ''}</b><span>${P.dry ? `+ drying time` : 'if you work Sat + Sun'}</span></div></div>
  <table class="mini wtt"><tr><td class="note">Stage</td><td class="note">Time</td><td class="note"></td></tr>${P.st.map(x => `<tr><td>${x[1]}</td><td>${r(x[2])}</td><td class="note">${esc(x[3])}</td></tr>`).join('')}</table>
  <ol class="wplan">${P.days.map((d, i) => `<li><b>${i % 2 ? 'Sunday' : 'Saturday'}${wk > 1 ? ' · weekend ' + (Math.floor(i / 2) + 1) : ''}</b> — ${d.t.join(', ')}</li>`).join('')}</ol>
  <p class="hintp" style="margin:0">A first-timer estimate with a track saw and a drill. Two people go faster for placing the boxes. ${S.opts.shopCut ? '' : '<label class="chk" style="display:inline-flex"><input type="checkbox" data-p="opts.shopCut" data-re="1"> The shop cuts the boards</label>'}</p>`;
}
/* ===== several walls in one room: corners ===== */
/* S.proj = {walls:[{name,len,D,state}], at, modes:[...]} — the wall at index `at` is S itself (its state is null).
   Wall k+1 joins the right end of wall k at a right angle (you face wall k; the next wall is on your right).
   'blind' corner: wall k runs into the corner and its last part sits behind wall k+1; 'dead': both stop and the corner square stays closed. */
const PJ_MAX = 4,
  PJ_NAMES = ['A', 'B', 'C', 'D'];
function pjWalls() {
  const P = S.proj;
  if (!P) return null;
  return P.walls.map((w, i) => {
    const st =
      i === P.at
        ? S
        : (() => {
            try {
              return JSON.parse(w.state);
            } catch (e) {
              return null;
            }
          })();
    return {
      i,
      name: w.name,
      len: +w.len || 0,
      D: st ? +st.room.D : +w.D || 600,
      st,
      side: st ? +(st.skirt || {}).side || 0 : 30
    };
  });
}
/* ---- corner geometry. Corner at (0,0); wall k runs back along −x, the room is y>0; wall k+1 leaves the corner along u at the inside angle θ. ---- */
function cgeo(Dk, Dn, deg) {
  const th = (Math.max(45, Math.min(179, +deg || 90)) * Math.PI) / 180,
    u = [-Math.cos(th), Math.sin(th)],
    N = [-Math.sin(th), -Math.cos(th)];
  const tn = (x, y) => [x * u[0] + y * u[1], x * N[0] + y * N[1]],
    inRoom = (x, y) => y >= -0.5 && tn(x, y)[1] >= -0.5,
    inA = (x, y, e) => y >= 0.5 && y <= Dk - 0.5 && x <= -e - 0.5,
    inB = (x, y, s) => {
      const [t, n] = tn(x, y);
      return n >= 0.5 && n <= Dn - 0.5 && t >= s + 0.5;
    };
  const bs = (lo, hi, ok) => {
    if (ok(lo)) return lo;
    for (let i = 0; i < 22; i++) {
      const m = (lo + hi) / 2;
      if (ok(m)) hi = m;
      else lo = m;
    }
    return Math.ceil(hi);
  };
  const steps = [0, 2, 5, 10, 20, 35, 50, 75, 100, 140, 200, 280, 400, 550, 750, 1000, 1300, 1600],
    boxA = e => {
      const out = [];
      for (let y = 0; y <= Dk + 1e-6; y += Dk / 24) steps.forEach(dx => out.push([-e - dx, y]));
      return out;
    };
  const boxB = s => {
    const out = [];
    for (let n = 0; n <= Dn + 1e-6; n += Dn / 24)
      steps.forEach(dt => {
        const t = s + dt;
        out.push([t * u[0] + n * N[0], t * u[1] + n * N[1]]);
      });
    return out;
  };
  const eBlind = bs(0, 4000, e => boxA(e).every(([x, y]) => inRoom(x, y))),
    eDead = bs(0, 4000, e => boxA(e).every(([x, y]) => inRoom(x, y) && !inB(x, y, 0)));
  const sAfter = eA =>
    bs(
      0,
      4000,
      s => boxB(s).every(([x, y]) => inRoom(x, y) && !inA(x, y, eA)) && boxA(eA).every(([x, y]) => !inB(x, y, s))
    );
  const P = (t, n) => [t * u[0] + n * N[0], t * u[1] + n * N[1]];
  return {
    th,
    deg: (th * 180) / Math.PI,
    u,
    N,
    P,
    eBlind,
    eDead,
    sBlind: sAfter(eBlind),
    sDead: sAfter(0),
    /* how far in front of wall k's fronts the next wall's cabinets reach back towards the corner: blocked length of wall k's front */
    blocked: s => {
      let mn = 0;
      boxB(s).forEach(([x, y]) => {
        if (y >= Dk && y <= Dk + 450) mn = Math.min(mn, x);
      });
      return -mn;
    }
  };
}
function pjCorner(ws, k, P) {
  const A = ws[k],
    B = ws[k + 1],
    deg = +(P.angles || [])[k] || 90,
    sq = (P.square || [])[k] && Math.abs(deg - 90) > 0.5 && Math.abs(deg - 90) <= 15 ? (P.square || [])[k] : '',
    g = cgeo(A.D, B.D, sq ? 90 : deg),
    mode = P.modes[k] || 'blind';
  let eA, sB;
  if (mode === 'diag') {
    const lg = (P.legs || [])[k] || {};
    eA = Math.max(g.eDead + 150, +lg.a || g.eDead + 350);
    sB = Math.max(g.sDead + 150, +lg.b || g.sDead + 350);
  } else if (mode === 'dead') {
    eA = g.eDead;
    sB = g.sDead;
  } else {
    eA = g.eBlind;
    sB = g.sBlind;
  }
  const PA = [-eA, A.D],
    PB = g.P(sB, B.D),
    fw = Math.hypot(PB[0] - PA[0], PB[1] - PA[1]),
    dA = [1, 0],
    dF = fw ? [(PB[0] - PA[0]) / fw, (PB[1] - PA[1]) / fw] : [1, 0],
    ang = (a, b) => (Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]))) * 180) / Math.PI;
  /* a front line that turns left (into the corner) means the next wall's fronts sit behind: then there is nothing to close */
  const fwd = dA[0] * dF[0] + dA[1] * dF[1],
    strip =
      !sq && mode !== 'diag' && Math.abs(deg - 90) > 2 && fw > 8 && fwd > 0.05
        ? { w: Math.round(fw), a1: +ang(dA, dF).toFixed(1), a2: +ang(dF, g.u).toFixed(1) }
        : null;
  return { deg, sq, mode, g, eA, sB, PA, PB, fw, strip, blk: mode === 'blind' ? Math.max(0, g.blocked(sB) - eA) : 0 };
}
/* fronts made square in a crooked corner: the tapered wall's cabinets get gradually shallower (depth = room depth at the deepest point) */
function pjTaper(ws, k, P, W) {
  const w = ws[k],
    sqL = k > 0 && (P.square || [])[k - 1] === 'B' ? (+(P.angles || [])[k - 1] || 90) - 90 : 0,
    sqR = k < ws.length - 1 && (P.square || [])[k] === 'A' ? (+(P.angles || [])[k] || 90) - 90 : 0;
  if ((!sqL || Math.abs(sqL) > 15) && (!sqR || Math.abs(sqR) > 15)) return null;
  const tL = Math.abs(sqL) <= 15 ? Math.tan((sqL * Math.PI) / 180) : 0,
    tR = Math.abs(sqR) <= 15 ? Math.tan((sqR * Math.PI) / 180) : 0,
    v = x => x * tL + (W - x) * tR,
    mx = Math.max(v(0), v(W));
  return { dL: Math.round(w.D - (mx - v(0))), dR: Math.round(w.D - (mx - v(W))) };
}
function pjEff(ws, k, P) {
  const W = ws[k];
  let off = 0;
  if (k > 0) off += pjCorner(ws, k - 1, P).sB;
  if (k < ws.length - 1) off += pjCorner(ws, k, P).eA;
  return Math.max(600, W.len - off);
}
function ceilEnd(st, right) {
  try {
    const c = (st.room.ceil || []).slice().sort((a, b) => a.x - b.x);
    if (!c.length) return +st.room.H;
    return right ? +c[c.length - 1].y : +c[0].y;
  } catch (e) {
    return 2400;
  }
}
function pjSync() {
  const P = S.proj;
  if (!P) return;
  P.angles = P.angles || [];
  P.legs = P.legs || [];
  const ws = pjWalls(),
    cs = ws.slice(0, -1).map((w, k) => pjCorner(ws, k, P));
  ws.forEach((w, k) => {
    const eff = pjEff(ws, k, P),
      cor = {};
    if (k > 0) {
      const c = cs[k - 1],
        A = ws[k - 1];
      cor.L = { name: A.name, D: A.D, mode: c.mode, deg: c.deg, side: 'L', strip: c.strip };
      if (c.mode === 'diag' && A.st && w.st) {
        const g = c.g,
          poly = [[0, 0], [-c.eA, 0], [-c.eA, A.D], c.PB, g.P(c.sB, 0)];
        cor.L.diag = {
          poly,
          front: c.fw,
          legA: c.eA,
          legB: c.sB,
          DA: A.D,
          DB: w.D,
          h: Math.min(ceilEnd(A.st, true), ceilEnd(w.st, false)),
          names: A.name + ' / ' + w.name
        };
      }
      if (c.mode === 'diag') {
        const t = P_ => P_[0] * c.g.u[0] + P_[1] * c.g.u[1];
        cor.L.dproj = {
          x0: t(c.PB) - c.sB,
          x1: t(c.PA) - c.sB,
          front: c.fw,
          h: Math.min(ceilEnd(A.st || S, true), ceilEnd(w.st || S, false))
        };
      }
    }
    if (k < ws.length - 1) {
      const c = cs[k];
      cor.R = {
        name: ws[k + 1].name,
        D: ws[k + 1].D,
        mode: c.mode,
        deg: c.deg,
        side: 'R',
        sideN: ws[k + 1].side,
        blk: c.blk
      };
      if (c.mode === 'diag' && w.st && ws[k + 1].st)
        cor.R.dproj = {
          x0: c.PA[0] + c.eA,
          x1: c.PB[0] + c.eA,
          front: c.fw,
          h: Math.min(ceilEnd(w.st, true), ceilEnd(ws[k + 1].st, false))
        };
    }
    const st = k === P.at ? S : w.st,
      tp = st ? pjTaper(ws, k, P, eff) : null;
    if (st) {
      const sk = st.room.skew;
      if (tp) {
        if (!sk || !sk.on || sk.auto)
          st.room.skew = { on: true, auto: true, dL: Math.max(150, tp.dL), dR: Math.max(150, tp.dR) };
        else cor.taperBlocked = true;
        cor.taper = tp;
      } else if (sk && sk.auto) delete st.room.skew;
    }
    if (k === P.at) {
      S.room.W = eff;
      S.room.corner = cor;
    } else if (w.st) {
      w.st.room.W = eff;
      w.st.room.corner = cor;
      w.st.proj = undefined;
      P.walls[k].state = JSON.stringify(w.st);
      P.walls[k].D = w.st.room.D;
    }
  });
}
function pjStart() {
  if (S.proj) return;
  S.proj = {
    walls: [{ name: 'Wall A', len: +S.room.W, D: +S.room.D, state: null }],
    at: 0,
    modes: [],
    angles: [],
    legs: []
  };
  pjSync();
  changed(true);
}
function pjAdd() {
  const P = S.proj;
  if (!P || P.walls.length >= PJ_MAX) return;
  const cur = JSON.parse(JSON.stringify(S));
  delete cur.proj;
  cur.room.beams = [];
  cur.room.wobs = [];
  cur.room.objs = [];
  delete cur.room.corner;
  cur.room.ceil = [
    { x: 0, y: +cur.room.H },
    { x: 3000, y: +cur.room.H }
  ];
  cur.sections = cur.sections
    .slice(0, Math.max(1, Math.min(3, cur.sections.length)))
    .map(x => Object.assign(x, { w: null, pinX: null }));
  const k = P.walls.length;
  P.walls.push({ name: 'Wall ' + PJ_NAMES[k], len: 2400, D: +cur.room.D, state: JSON.stringify(cur) });
  P.modes[k - 1] = 'blind';
  (P.angles = P.angles || [])[k - 1] = 90;
  pjSync();
  pjOpen(k);
}
function pjOpen(k) {
  const P = S.proj;
  if (!P || k === P.at || !P.walls[k]) return;
  const me = JSON.parse(JSON.stringify(S));
  delete me.proj;
  P.walls[P.at].state = JSON.stringify(me);
  P.walls[P.at].D = +S.room.D;
  let nx;
  try {
    nx = fixFins(JSON.parse(P.walls[k].state));
  } catch (e) {
    toast('That wall could not be opened');
    return;
  }
  P.walls[k].state = null;
  P.at = k;
  nx.proj = P;
  S = nx;
  pjSync();
  ui.sel = 0;
  ui.zsel = null;
  groupsCache = null;
  changed(true);
  toast(`Now designing ${P.walls[k].name}`);
}
function pjDel(k) {
  const P = S.proj;
  if (!P || k === P.at || P.walls.length < 2) return;
  P.walls.splice(k, 1);
  const j = Math.max(0, k - 1);
  P.modes.splice(j, 1);
  (P.angles || []).splice(j, 1);
  (P.legs || []).splice(j, 1);
  (P.square || []).splice(j, 1);
  if (P.at > k) P.at--;
  P.walls.forEach((w, i) => {
    if (/^Wall [A-D]$/.test(w.name)) w.name = 'Wall ' + PJ_NAMES[i];
  });
  if (P.walls.length === 1) {
    delete S.proj;
    delete S.room.corner;
    S.room.W = +P.walls[0].len || S.room.W;
  } else pjSync();
  changed(true);
}
/* corner checks, the angled closing strip and the diagonal corner cabinet (built with the wall to the right of the corner) */
function cornerPanel(G, St, role, type, poly, o) {
  const M = St.mat || {},
    m = M[role] || M.carcass,
    mx = Math.min(...poly.map(p => p[0])),
    my = Math.min(...poly.map(p => p[1])),
    pp = poly.map(p => [r1(p[0] - mx), r1(p[1] - my)]);
  G.panels.push(
    Object.assign(
      {
        type,
        role,
        sec: o.sec || 'corner',
        poly: pp,
        holes: [],
        w: Math.max(...pp.map(p => p[0])),
        h: Math.max(...pp.map(p => p[1])),
        t: +m.t,
        fin: m.fin,
        sheet: m.sheet,
        matType: m.type,
        notes: [],
        band: 'none',
        bandLen: 0,
        grain: 'h'
      },
      o
    )
  );
}
function cornerCheck(G, St) {
  const C = St.room && St.room.corner;
  if (!C) return;
  const W = G.W,
    fr = G.fronts.filter(f => f.kind === 'door' || f.kind === 'drawer'),
    xr = f => {
      const xs = f.poly.map(p => p[0]);
      return [Math.min(...xs), Math.max(...xs)];
    };
  if (C.R && C.R.mode === 'blind') {
    const lim = W - (C.R.blk || 0) - (C.R.sideN || 30);
    const bad = fr.filter(f => xr(f)[1] > lim + 2);
    if (bad.length && (C.R.blk || 0) > 0)
      G.warns.push(
        `Corner with ${C.R.name}: ${C.R.name}’s cabinets stand in front of the last ${f0(W - lim)} mm of this wall, so ${bad.length === 1 ? 'one front' : bad.length + ' fronts'} there can’t open. Make the last column a closed “blind” corner box (no door in that part), or switch the corner to “Both stop” or “Diagonal corner cabinet” in Room → Walls in this room.`
      );
    G.cornerLim = lim;
  }
  ['L', 'R'].forEach(sd => {
    const c = C[sd];
    if (!c || c.mode === 'diag') return;
    const side = +(St.skirt || {}).side || 0;
    if (
      side < 50 &&
      (c.deg || 90) <= 95 &&
      fr.some(f => {
        const [a, b] = xr(f);
        return sd === 'L' ? a < side + 700 : b > W - side - 700;
      })
    )
      G.warns.push(
        `Corner with ${c.name}: the side strip is only ${f0(side)} mm — doors and handles in the corner can hit the other wall’s fronts. Make the side strips at least 50 mm (Design → Construction → Closing strips).`
      );
  });
  if (C.R && (C.R.deg || 90) < 85)
    G.warns.push(
      `The corner with ${C.R.name} is sharp (${f0(C.R.deg)}°): the last ${f0(C.R.D)} mm deep box can’t reach into it — the space behind it stays empty. A shallower last column uses more of it.`
    );
  if (C.taper) {
    const mn = Math.min(C.taper.dL, C.taper.dR);
    if (C.taperBlocked)
      G.warns.push(
        'This wall’s cabinets should taper to make the corner fronts square, but you set “The back wall is not parallel” yourself (Room → Wall). Switch that off to let Fitted taper them.'
      );
    else if (mn < 300)
      G.warns.push(
        `To keep the corner fronts square, this wall’s cabinets taper down to ${f0(mn)} mm deep — that is very shallow. Taper the other wall instead, or let the fronts follow the walls.`
      );
  }
  const L = C.L;
  if (!L) return;
  const hh = G.ceilAt ? G.ceilAt(0) : +St.room.H;
  if (L.strip && L.strip.w > 8) {
    cornerPanel(
      G,
      St,
      'skirt',
      `Corner closing strip (angled, ${f0(L.deg)}° corner)`,
      [
        [0, 0],
        [L.strip.w, 0],
        [L.strip.w, hh],
        [0, hh]
      ],
      {
        sec: 'corner ' + L.name,
        grain: 'h',
        band: 'front',
        bandLen: hh,
        angled: true,
        notes: [
          `Closes the corner between ${L.name} and this wall. It turns ${L.strip.a1}° away from ${L.name}’s front and ${L.strip.a2}° towards this wall’s front (the cabinet edges stay square): tilt the saw blade ${L.strip.a1.toFixed(1)}° on one long edge and ${L.strip.a2.toFixed(1)}° on the other so both edges sit flush. Cut it 10 mm wider and trim on site.`
        ]
      }
    );
    G.H.funParts.push({
      n: `Corner closing strip: ${f0(L.strip.w)} mm wide, bevelled ${L.strip.a1.toFixed(1)}° and ${L.strip.a2.toFixed(1)}°`,
      q: '1',
      sec: 'corner'
    });
  }
  if (L.diag) {
    const d = L.diag,
      tc = G.tc || 18,
      Pl = G.P || 0,
      top = +(St.skirt || {}).top || 40,
      hb = Math.max(600, Math.min(d.h - top, 2400) - Pl),
      sec = 'corner ' + d.names,
      poly = d.poly;
    cornerPanel(G, St, 'carcass', 'Corner cabinet — bottom', poly, {
      sec,
      notes: [
        `Five-sided: legs ${f0(d.legA)} and ${f0(d.legB)} mm along the walls, front ${f0(d.front)} mm. The sides stand on it; the backs are nailed on behind.`
      ],
      band: 'front',
      bandLen: d.front
    });
    cornerPanel(G, St, 'carcass', 'Corner cabinet — top', poly, {
      sec,
      notes: ['Same shape as the bottom.'],
      band: 'front',
      bandLen: d.front
    });
    cornerPanel(
      G,
      St,
      'carcass',
      'Corner cabinet — side (towards ' + d.names.split(' / ')[0] + ')',
      [
        [0, 0],
        [d.DA, 0],
        [d.DA, hb],
        [0, hb]
      ],
      { sec, band: 'front', bandLen: hb }
    );
    cornerPanel(
      G,
      St,
      'carcass',
      'Corner cabinet — side (towards ' + d.names.split(' / ')[1] + ')',
      [
        [0, 0],
        [d.DB, 0],
        [d.DB, hb],
        [0, hb]
      ],
      { sec, band: 'front', bandLen: hb }
    );
    cornerPanel(
      G,
      St,
      'back',
      'Corner cabinet — back (along ' + d.names.split(' / ')[0] + ')',
      [
        [0, 0],
        [d.legA, 0],
        [d.legA, hb],
        [0, hb]
      ],
      { sec }
    );
    cornerPanel(
      G,
      St,
      'back',
      'Corner cabinet — back (along ' + d.names.split(' / ')[1] + ')',
      [
        [0, 0],
        [d.legB, 0],
        [d.legB, hb],
        [0, hb]
      ],
      { sec }
    );
    const ins = poly.map(([x, y]) => [x, y]);
    for (let i = 0; i < 2; i++)
      cornerPanel(G, St, 'shelf', 'Corner cabinet — shelf', ins, {
        sec,
        notes: ['Same shape as the bottom, 20 mm smaller at the front edge; on shelf supports.'],
        band: 'front',
        bandLen: d.front - 20
      });
    const nD = d.front > 650 ? 2 : 1,
      dw = (d.front - 4 - (nD - 1) * 3) / nD;
    for (let i = 0; i < nD; i++)
      cornerPanel(
        G,
        St,
        'front',
        'Corner cabinet — door',
        [
          [0, 0],
          [dw, 0],
          [dw, hb - 4],
          [0, hb - 4]
        ],
        { sec, band: 'all', notes: ['Hangs on the corner cabinet’s sides; 110° hinges.'] }
      );
    cornerPanel(
      G,
      St,
      'skirt',
      'Corner cabinet — plinth',
      [
        [0, 0],
        [d.front, 0],
        [d.front, Math.max(40, Pl)],
        [0, Math.max(40, Pl)]
      ],
      { sec, band: 'front', bandLen: d.front }
    );
    G.H.funParts.push(
      {
        n: `Hinges for the corner cabinet door${nD > 1 ? 's' : ''} (110°, with mounting plates)`,
        q: String(nD * (hb > 1200 ? 3 : 2)),
        sec: 'corner'
      },
      { n: 'Shelf supports for the corner cabinet', q: '8', sec: 'corner' }
    );
    if (d.front < 350)
      G.warns.push(
        `The diagonal corner cabinet’s front is only ${f0(d.front)} mm wide — make its legs along the walls longer (Room → Walls in this room) so the door is at least 400 mm.`
      );
  }
}
function pjLayout() {
  const P = S.proj;
  if (!P) return null;
  const ws = pjWalls(),
    cs = ws.slice(0, -1).map((w, k) => pjCorner(ws, k, P));
  let x = 0,
    y = 0,
    hd = 0;
  const segs = [];
  ws.forEach((w, k) => {
    const d = [Math.cos(hd), Math.sin(hd)],
      n = [-Math.sin(hd), Math.cos(hd)],
      s0 = k > 0 ? cs[k - 1].sB : 0,
      s1 = w.len - (k < ws.length - 1 ? cs[k].eA : 0);
    segs.push({ k, w, o: [x, y], d, n, s0, s1 });
    x += d[0] * w.len;
    y += d[1] * w.len;
    if (k < cs.length) hd += ((180 - cs[k].deg) * Math.PI) / 180;
  });
  const fr = (g, X, Y_) => {
    const C = [g.o[0] + g.d[0] * g.w.len, g.o[1] + g.d[1] * g.w.len];
    return [C[0] + X * g.d[0] + Y_ * g.n[0], C[1] + X * g.d[1] + Y_ * g.n[1]];
  };
  return { ws, cs, segs, fr };
}
function pjPlanSVG() {
  const P = S.proj;
  if (!P) return '';
  const ws = pjWalls(),
    cs = ws.slice(0, -1).map((w, k) => pjCorner(ws, k, P));
  let x = 0,
    y = 0,
    hd = 0;
  const segs = [];
  ws.forEach((w, k) => {
    const d = [Math.cos(hd), Math.sin(hd)],
      n = [-Math.sin(hd), Math.cos(hd)],
      s0 = k > 0 ? cs[k - 1].sB : 0,
      s1 = w.len - (k < ws.length - 1 ? cs[k].eA : 0);
    segs.push({ k, w, o: [x, y], d, n, s0, s1 });
    x += d[0] * w.len;
    y += d[1] * w.len;
    if (k < cs.length) hd += ((180 - cs[k].deg) * Math.PI) / 180;
  });
  const pts = [];
  segs.forEach(g => {
    pts.push(
      g.o,
      [g.o[0] + g.d[0] * g.w.len, g.o[1] + g.d[1] * g.w.len],
      [g.o[0] + g.n[0] * g.w.D, g.o[1] + g.n[1] * g.w.D]
    );
  });
  const xs = pts.map(p => p[0]),
    ys = pts.map(p => p[1]),
    pad = 500,
    x0 = Math.min(...xs) - pad,
    y0 = Math.min(...ys) - pad,
    W_ = Math.max(...xs) - x0 + pad,
    H_ = Math.max(...ys) - y0 + pad;
  const P_ = (a, b) => `${n1(a)},${n1(b)}`;
  let o = `<svg viewBox="${n1(x0)} ${n1(y0)} ${n1(W_)} ${n1(H_)}" class="pjplan" role="img" aria-label="Floor plan of the walls">`;
  const fr = (g, X, Y_) => {
    const C = [g.o[0] + g.d[0] * g.w.len, g.o[1] + g.d[1] * g.w.len];
    return [C[0] + X * g.d[0] + Y_ * g.n[0], C[1] + X * g.d[1] + Y_ * g.n[1]];
  };
  segs.forEach(g => {
    const [ox, oy] = g.o,
      [dx, dy] = g.d,
      [nx, ny] = g.n,
      L = g.w.len,
      D = g.w.D,
      act = g.k === P.at;
    o += `<line x1="${n1(ox)}" y1="${n1(oy)}" x2="${n1(ox + dx * L)}" y2="${n1(oy + dy * L)}" style="stroke:var(--ink)" stroke-width="60" stroke-linecap="square"/>`;
    const tp = pjTaper(ws, g.k, P, g.s1 - g.s0),
      dL_ = tp ? tp.dL : D,
      dR_ = tp ? tp.dR : D,
      q = [
        [g.s0, 0],
        [g.s1, 0],
        [g.s1, dR_],
        [g.s0, dL_]
      ].map(([s, t]) => [ox + dx * s + nx * t, oy + dy * s + ny * t]);
    o += `<polygon points="${q.map(p => P_(p[0], p[1])).join(' ')}" style="fill:${act ? 'var(--accent-soft)' : 'var(--raised)'};stroke:${act ? 'var(--accent)' : 'var(--ink2)'}" stroke-width="${act ? 24 : 14}" data-act="pjOpen" data-a="${g.k}" class="pjw"/>`;
    const c = [ox + (dx * (g.s0 + g.s1)) / 2 + (nx * D) / 2, oy + (dy * (g.s0 + g.s1)) / 2 + (ny * D) / 2];
    o += `<text x="${n1(c[0])}" y="${n1(c[1] + 90)}" text-anchor="middle" font-size="260" font-weight="700" style="fill:${act ? 'var(--accent)' : 'var(--ink2)'};pointer-events:none">${esc(g.w.name.replace(/^Wall /, ''))}</text>`;
    let G_ = null;
    try {
      G_ = g.k === P.at ? geo : build(g.w.st);
    } catch (e) {
      oops('room-checks #3', e);
    }
    if (G_) {
      G_.fronts
        .filter(f => f.kind === 'door')
        .forEach(f => {
          const xs_ = f.poly.map(p => p[0]),
            a = Math.min(...xs_) + g.s0,
            b = Math.max(...xs_) + g.s0,
            w_ = b - a,
            hx = f.hinge === 'R' ? b : a,
            s_ = f.hinge === 'R' ? -1 : 1,
            t = D + 20;
          const H0 = [ox + dx * hx + nx * t, oy + dy * hx + ny * t],
            E = [ox + dx * (hx + s_ * w_) + nx * t, oy + dy * (hx + s_ * w_) + ny * t],
            O = [H0[0] + nx * w_, H0[1] + ny * w_],
            sw = s_ > 0 === dx * ny - dy * nx > 0 ? 0 : 1;
          o += `<path d="M${P_(...O)} A${n1(w_)} ${n1(w_)} 0 0 ${sw} ${P_(...E)}" fill="none" style="stroke:var(--ink3)" stroke-width="10" stroke-dasharray="40 30"/><line x1="${n1(H0[0])}" y1="${n1(H0[1])}" x2="${n1(O[0])}" y2="${n1(O[1])}" style="stroke:var(--ink3)" stroke-width="14"/>`;
        });
    }
    if (g.k < cs.length) {
      const c = cs[g.k];
      if (c.mode === 'diag') {
        const poly = [[0, 0], [-c.eA, 0], [-c.eA, g.w.D], c.PB, c.g.P(c.sB, 0)].map(([X, Y_]) => fr(g, X, Y_));
        o += `<polygon points="${poly.map(p => P_(p[0], p[1])).join(' ')}" style="fill:var(--raised);stroke:var(--accent)" stroke-width="14" stroke-dasharray="50 30"/>`;
      }
      if (c.strip) {
        const a = fr(g, ...c.PA),
          b = fr(g, ...c.PB);
        o += `<line x1="${n1(a[0])}" y1="${n1(a[1])}" x2="${n1(b[0])}" y2="${n1(b[1])}" style="stroke:var(--accent)" stroke-width="40"/>`;
      }
      if (Math.abs(c.deg - 90) > 0.5) {
        const C = fr(g, 0, 0),
          lab = fr(g, -350, 350);
        o += `<text x="${n1(lab[0])}" y="${n1(lab[1])}" text-anchor="middle" font-size="150" style="fill:var(--accent)">${f0(c.deg)}°${c.sq ? ' → 90°' : ''}</text>`;
      }
    }
    const m = [ox + (dx * L) / 2 - nx * 260, oy + (dy * L) / 2 - ny * 260];
    o += `<text x="${n1(m[0])}" y="${n1(m[1] + 50)}" text-anchor="middle" font-size="150" style="fill:var(--ink3)">${f0(L)}</text>`;
  });
  return o + '</svg>';
}
function pjHTML() {
  const P = S.proj;
  if (!P)
    return `<p class="hintp">An L- or U-shaped room? Add the wall to the right of this one; Fitted keeps the corner right and adds up the whole room.</p><button type="button" class="btn sm" data-act="pjStart">+ Design more walls of this room</button>`;
  const ws = pjWalls();
  return `<div class="pjwrap">${pjPlanSVG()}</div><p class="hintp" style="margin:0">Seen from above. Tap a wall to design it. Dashed arcs show how the doors open.</p>
  <div class="pjlist">${ws
    .map((w, k) => {
      const c = k < ws.length - 1 ? pjCorner(ws, k, P) : null,
        lg = (P.legs || [])[k] || {};
      return `<div class="pjrow ${k === P.at ? 'on' : ''}"><b>${esc(w.name)}</b><label class="fld"><span>Wall length</span><span class="inp"><input type="number" inputmode="decimal" data-pj="${k}" value="${w.len}"><em>mm</em></span></label>
    <span class="note">${f0(w.D)} deep · cabinets ${f0(pjEff(ws, k, P))} mm</span>${k === P.at ? '<span class="tag">open now</span>' : `<button type="button" class="btn sm" data-act="pjOpen" data-a="${k}">Open</button><button type="button" class="rowbtn" data-act="pjDel" data-a="${k}" aria-label="Remove ${esc(w.name)}">×</button>`}</div>${
      c
        ? `<div class="pjcor"><span>Corner ${esc(PJ_NAMES[k])}–${esc(PJ_NAMES[k + 1])}</span>
      <label class="fld"><span>Angle inside the corner</span><span class="inp"><input type="number" inputmode="decimal" data-pja="${k}" value="${f0(c.deg)}" min="45" max="179"><em>°</em></span></label>
      <div class="tchips">${[
        [90, '90° square'],
        [95, '95°'],
        [120, '120°'],
        [135, '135° bay']
      ]
        .map(
          ([v, l]) =>
            `<button type="button" class="tchip ${Math.round(c.deg) === v ? 'on' : ''}" data-act="pjAng" data-a="${k}:${v}">${l}</button>`
        )
        .join('')}</div>
      <div class="seg">${[
        ['blind', `${esc(w.name)} runs into the corner`],
        ['dead', 'Both stop, corner closed'],
        ['diag', 'Diagonal corner cabinet']
      ]
        .map(
          ([m, l]) =>
            `<button type="button" class="${c.mode === m ? 'on' : ''}" data-act="pjMode" data-a="${k}:${m}">${l}</button>`
        )
        .join('')}</div>
      ${
        Math.abs(c.deg - 90) > 0.5
          ? Math.abs(c.deg - 90) <= 15
            ? `<div class="fld"><span>Make the fronts meet square (90°)</span><div class="seg">${[
                ['', 'No — follow the walls'],
                ['A', `Taper ${esc(w.name)}`],
                ['B', `Taper ${esc(ws[k + 1].name)}`]
              ]
                .map(
                  ([v, l]) =>
                    `<button type="button" class="${((P.square || [])[k] || '') === v ? 'on' : ''}" data-act="pjSq" data-a="${k}:${v}">${l}</button>`
                )
                .join('')}</div></div>${
                c.sq
                  ? (() => {
                      const j = c.sq === 'A' ? k : k + 1,
                        tp = pjTaper(ws, j, P, pjEff(ws, j, P));
                      return tp
                        ? `<p class="hintp" style="margin:0">${esc(ws[j].name)}’s cabinets go from ${f0(tp.dL)} mm deep at the left to ${f0(tp.dR)} mm at the right, so all fronts are square to each other. The boxes are cut tapered (the shaped parts show them).</p>`
                        : '';
                    })()
                  : ''
              }`
            : `<p class="hintp" style="margin:0">At ${f0(c.deg)}° the corner is too far from square to taper the cabinets (up to 15° off works).</p>`
          : ''
      }
      ${c.mode === 'diag' ? `<div class="grid2"><label class="fld"><span>Along ${esc(w.name)}</span><span class="inp"><input type="number" inputmode="decimal" data-pjl="${k}:a" value="${f0(c.eA)}"><em>mm</em></span></label><label class="fld"><span>Along ${esc(ws[k + 1].name)}</span><span class="inp"><input type="number" inputmode="decimal" data-pjl="${k}:b" value="${f0(c.sB)}"><em>mm</em></span></label></div><p class="hintp" style="margin:0">One cabinet across the corner with its door straight across: front ${f0(c.fw)} mm. Its parts are in ${esc(ws[k + 1].name)}’s cut list.</p>` : ''}
      ${c.strip ? `<p class="hintp" style="margin:0">Angled closing strip in the corner: ${f0(c.strip.w)} mm wide, edges bevelled ${c.strip.a1.toFixed(1)}° and ${c.strip.a2.toFixed(1)}° — in ${esc(ws[k + 1].name)}’s cut list.</p>` : ''}</div>`
        : ''
    }`;
    })
    .join('')}</div>
  ${ws.length < PJ_MAX ? `<button type="button" class="btn sm" data-act="pjAdd">+ Add the next wall (to the right of ${esc(ws[ws.length - 1].name)})</button>` : ''}
  <div id="pjTot">${ui.pjTot && ui.pjTot.sig === pjSig() ? ui.pjTot.html : `<button type="button" class="btn sm" data-act="pjTotal">Add up the whole room</button>`}</div>`;
}
function pjSig() {
  return JSON.stringify([S.proj, S]);
}
function pjTotal() {
  const P = S.proj;
  if (!P) return;
  const ws = pjWalls(),
    st = ws.map(w => {
      try {
        return cmpStats(JSON.parse(JSON.stringify(w.st)));
      } catch (e) {
        return null;
      }
    });
  let gsAll = [];
  ws.forEach(w => {
    const S0 = S;
    try {
      S = w.st;
      const G = build(w.st);
      gsAll = gsAll.concat(groupPanels(G));
    } catch (e) {
      oops('room-checks #4', e);
    }
    S = S0;
  });
  let sheets = 0;
  try {
    const S0 = S;
    sheets = nestAll(gsAll).reduce((a, n) => a + n.sheets.length, 0);
    S = S0;
  } catch (e) {
    oops('room-checks #5', e);
  }
  const sum = k => st.reduce((a, x) => a + (x ? x[k] : 0), 0),
    sep = sum('sheets');
  const html = `<table class="mini wtt"><tr><td class="note">Wall</td><td class="note">Parts</td><td class="note">Price</td></tr>${ws.map((w, i) => `<tr><td>${esc(w.name)}</td><td>${st[i] ? st[i].panels : '—'}</td><td>${st[i] ? eur(st[i].total) : '—'}</td></tr>`).join('')}<tr><td><b>Whole room</b></td><td><b>${sum('panels')}</b></td><td><b>${eur(sum('total'))}</b></td></tr></table><p class="hintp" style="margin:0">Cut together, the whole room needs about <b>${sheets} sheets</b>${sep > sheets ? ` — ${sep - sheets} fewer than wall by wall` : ''}.</p>`;
  ui.pjTot = { sig: pjSig(), html };
  const el = document.getElementById('pjTot');
  if (el) el.innerHTML = html;
}
/* ===== room restrictions: bumps, ceiling things, side-wall doors and windows, space in front ===== */
function roomCheck(G, St, X) {
  const R = St.room || {},
    W = G.W,
    D = G.D,
    tf = G.tf || 19,
    secs = G.secs.filter(q => !q.panel),
    lab = q => 'S' + (q.i + 1),
    fr = G.fronts.filter(f => f.kind === 'door' || f.kind === 'drawer'),
    xr = f => {
      const xs = f.poly.map(p => p[0]);
      return [Math.min(...xs), Math.max(...xs)];
    };
  G.bumps = X.bumps;
  G.cobjs = X.cobjs;
  // 2 bumps in the back wall
  X.bumps.forEach(b => {
    const nm = BUMPS[b.t],
      hit = secs.filter(q => b.x < q.rx + tc_(G) - 5 && b.x + b.w > q.lx + 5);
    if (!hit.length) return;
    if (b.mode === 'shallow') {
      hit.forEach(q => {
        if (q.zones.some(zr => zr.z && zr.z.rail) && q.Dh < 540)
          G.warns.push(
            `${lab(q)} is only ${f0(q.Dh)} mm deep inside in front of the ${nm.toLowerCase()} — clothes on hangers need about 540 mm. Use folded storage there, or hang the rail front-to-back.`
          );
      });
      const part = hit.filter(q => b.x > q.lx + 40 || b.x + b.w < q.rx - 40);
      if (part.length)
        G.warns.push(
          `The ${nm.toLowerCase()} (${f0(b.x)}–${f0(b.x + b.w)} mm) covers only part of ${part.map(lab).join(', ')}, so the whole column is made ${f0(b.d)} mm shallower. Put a column edge at ${f0(b.x)} and ${f0(b.x + b.w)} mm to keep the neighbours full depth.`
        );
    } else {
      const hh = b.h || 'full height';
      hit.forEach(q =>
        G.H.funParts.push({
          n: `Notch for the ${nm.toLowerCase()}: cut ${f0(b.d + 5)} × ${typeof hh === 'number' ? f0(hh + 5) : hh} mm out of the back of the parts of ${lab(q)} that touch it (sides, bottom, back panel)`,
          q: '1',
          sec: lab(q)
        })
      );
      if (!b.h)
        G.warns.push(
          `The ${nm.toLowerCase()} runs the full height — notching every part is a lot of work. Switch it to “make the columns shallower”.`
        );
    }
  });
  // 3 ceiling things
  X.cobjs.forEach(o => {
    const nm = COBJ[o.t],
      cx = o.t === 'dormer' || o.t === 'hatch' ? o.x + o.w / 2 : o.x;
    if (o.t === 'dormer') {
      if (o.sill > 0) {
        const hit = secs.filter(q => q.lx < o.x + o.w - 5 && q.rx > o.x + 5 && (q.maxU || 0) > o.sill + 5);
        if (hit.length)
          G.warns.push(
            `${nm}: ${hit.map(lab).join(', ')} ${hit.length > 1 ? 'go' : 'goes'} higher than its sill (${f0(o.sill)} mm) and block the window. Give ${hit.length > 1 ? 'them their' : 'it its'} own height (Column → Height → Own height ${f0(o.sill - 20)} mm), or make that part an open niche.`
          );
      }
      return;
    }
    if (o.t === 'light') {
      if (o.d < D + 80)
        G.warns.push(
          `The ${nm.toLowerCase()} ${f0(o.x)} mm from the left wall is only ${f0(o.d)} mm out from the wall — it ends up above the cabinet. Have it moved at least ${f0(D + 300)} mm out, or keep the cabinet below it.`
        );
      else if (o.d < D + 300)
        G.warns.push(
          `The ${nm.toLowerCase()} is ${f0(o.d - D)} mm in front of the cabinet: open doors will throw a shadow inside. ${f0(D + 400)} mm or more out is better.`
        );
      return;
    }
    if (o.t === 'smoke') {
      if (o.d < D + 500)
        G.warns.push(
          `The smoke detector should be at least 500 mm from walls and from the cabinet (EN 14604) — it is ${f0(Math.max(0, o.d - D))} mm in front of it. Move it to at least ${f0(D + 500)} mm out from this wall.`
        );
      return;
    }
    if (o.t === 'hatch') {
      const near = o.d - o.L / 2,
        far = o.d + o.L / 2;
      if (near < D + 20)
        G.warns.push(
          `The loft hatch (${f0(o.x)}–${f0(o.x + o.w)} mm) is partly above the cabinet — you could no longer open it. Keep the columns under it lower, or leave a gap in the cabinet there.`
        );
      else if (near < D + 700)
        G.warns.push(
          `The loft hatch is ${f0(near - D)} mm in front of the cabinet — its fold-down ladder needs about 700 mm of free floor; open cabinet doors and drawers there will be in the way.`
        );
    }
  });
  // 4 doors and windows in the side walls
  (G.objs || []).forEach(o => {
    if (o.wall === 'back') return;
    const side = o.wall,
      edgeQ = side === 'left' ? secs[0] : secs[secs.length - 1];
    if (!edgeQ) return;
    const nm = o.type === 'door' ? 'door' : 'window',
      wn = `The ${nm} in the ${side} wall`,
      a = o.x,
      b = o.x + o.w,
      front = D + tf;
    if (a < front - 5)
      G.warns.push(
        `${wn} starts ${f0(a)} mm from the cabinet wall — the cabinet is ${f0(front)} mm deep, so it ${b <= front ? 'is hidden behind' : 'is partly behind'} the ${side} end of the cabinet.${o.type === 'window' ? ` Give ${lab(edgeQ)} its own height below the sill (${f0(o.y - 20)} mm), or make it shallower.` : ' Make the end column shallower or narrower so the doorway stays free.'}`
      );
    else if (a < front + 80)
      G.warns.push(
        `${wn} is ${f0(a - front)} mm from the cabinet front — its frame and trim (about 70 mm) will clash with the ${side} closing strip. Leave about 80 mm, or make ${lab(edgeQ)} a little shallower.`
      );
    if (o.type === 'door' && (R.objs[o.i] || {}).opens !== 'out' && (R.objs[o.i] || {}).hinge !== 'far') {
      const reach = a - o.w;
      if (a >= front - 5 && reach < front + 20)
        G.warns.push(
          `${wn} opens into the room on the cabinet side: opened wide it swings against the cabinet front${
            fr.some(f => {
              const [x0, x1] = xr(f);
              return side === 'left' ? x0 < o.w : x1 > W - o.w;
            })
              ? ' and the handles there'
              : ''
          }. Fit a door stop, or hinge the door on the other side.`
        );
    }
    if (o.type === 'door') {
      const endF = fr.filter(f => {
        const [x0, x1] = xr(f);
        return (
          f.kind === 'door' &&
          (side === 'left'
            ? x0 < Math.min(700, W / 2) && f.hinge === 'R'
            : x1 > W - Math.min(700, W / 2) && f.hinge === 'L')
        );
      });
      if (endF.length && a < front + 400)
        G.warns.push(
          `The door of ${lab(edgeQ)} next to the ${side} wall opens towards the room door — both can’t be open at once. Hinge it on the wall side.`
        );
    }
  });
  // 1 space in front / hallway
  const F = R.front || {};
  if (F.on && +F.space > 0) {
    const sp = +F.space,
      hall = !!F.hall,
      walk = hall ? 900 : 600;
    G.frontInfo = { sp, hall };
    if (hall && sp < walk + 50)
      G.warns.push(
        `Hallway: only ${f0(sp)} mm is left in front of the cabinet — 900 mm is the usual minimum to walk past. Make the columns ${f0(walk + 50 - sp)} mm shallower, or choose shallower cupboards (400 mm) here.`
      );
    const big = fr
      .filter(f => f.kind === 'door' && f.slide !== true)
      .filter(f => {
        const [x0, x1] = xr(f);
        return x1 - x0 > sp - 30;
      });
    if (big.length)
      G.warns.push(
        `${big.length === 1 ? 'One door is' : big.length + ' doors are'} wider (${f0(
          Math.max(
            ...big.map(f => {
              const [a, b] = xr(f);
              return b - a;
            })
          )
        )} mm) than the ${f0(sp)} mm of free floor in front — ${big.length === 1 ? 'it' : 'they'} can’t open fully. Use two narrower doors, or sliding doors.`
      );
    else if (hall && sp < 1300 && fr.some(f => f.kind === 'door'))
      G.warns.push(
        `Hallway: open doors block the way while they’re open. Sliding doors keep the hallway free (Column → level → How the fronts sit → Sliding).`
      );
    G.secs.forEach(q => {
      if (q.panel) return;
      const drw = fr.filter(f => f.kind === 'drawer' && f.sec === q.i);
      if (drw.length && sp < q.D + 350)
        G.warns.push(
          `${lab(q)}: a drawer pulls out about ${f0(q.D - 50)} mm — with ${f0(sp)} mm in front you can’t stand in front of it when it’s open. Shallower drawers or doors work better here.`
        );
      (q.zones || []).forEach(zr => {
        if (zr.fit && zr.fit.kind === 'ironing' && sp < 1100)
          G.warns.push(
            `${lab(q)}: the ironing board needs about 1100 mm of free floor in front; there is ${f0(sp)} mm.`
          );
        if (zr.bed && sp < 2200 - q.D)
          G.warns.push(
            `${lab(q)}: the folded-down bed reaches about ${f0(2100 - q.D)} mm into the room (plus room to get in); there is ${f0(sp)} mm.`
          );
        if (zr.larder && sp < q.D + 300)
          G.warns.push(
            `${lab(q)}: the larder pull-out comes out its full depth (about ${f0(q.D)} mm) — leave about ${f0(q.D + 300)} mm free in front; there is ${f0(sp)} mm.`
          );
        if (zr.oven && sp < 1000)
          G.warns.push(
            `${lab(q)}: an oven door folds down about 500 mm — leave about 1000 mm free in front; there is ${f0(sp)} mm.`
          );
        if (zr.laundry && sp < 1000)
          G.warns.push(`${lab(q)}: you need about 1000 mm in front of the washing machine to load it.`);
      });
    });
  }
}
function tc_(G) {
  return G.tc || 18;
}
function frontPlanSVG() {
  const G = geo,
    R = S.room,
    F = R.front || {},
    W = G.W,
    D = G.D,
    sp = +F.space > 0 ? +F.space : 1500,
    hall = !!F.hall,
    pad = 200,
    H = D + sp + pad;
  const P = (a, b) => `${n1(a)},${n1(b)}`;
  let o = `<svg viewBox="${-pad} ${-pad} ${W + 2 * pad} ${H + pad}" class="pjplan" role="img" aria-label="Plan from above: the cabinet and the free floor in front">`;
  o += `<rect x="0" y="0" width="${W}" height="${D + sp}" style="fill:var(--paper)"/>`;
  if (F.on && F.space > 0)
    o += `<rect x="0" y="${D + sp - (hall ? 900 : 600)}" width="${W}" height="${hall ? 900 : 600}" fill="${hall && sp < 950 ? 'rgba(194,65,12,.18)' : 'rgba(47,111,168,.10)'}"/><text x="${W / 2}" y="${D + sp - (hall ? 450 : 300)}" text-anchor="middle" font-size="110" style="fill:var(--ink3)">${hall ? 'walking path 900' : 'standing room'}</text>`;
  (G.bumps || []).forEach(b => {
    o += `<rect x="${n1(b.x)}" y="0" width="${n1(b.w)}" height="${n1(b.d)}" style="fill:var(--hatch);stroke:var(--ink2)" stroke-width="10"/>`;
  });
  G.secs.forEach(q => {
    if (q.panel) return;
    o += `<rect x="${n1(q.lx)}" y="${n1(D - q.D - (q.z0 || 0))}" width="${n1(q.rx + (G.boxes ? G.tc : 0) - q.lx)}" height="${n1(q.D)}" style="fill:var(--accent-soft);stroke:var(--accent)" stroke-width="12"/>`;
  });
  G.fronts
    .filter(f => f.kind === 'door')
    .forEach(f => {
      const xs = f.poly.map(p => p[0]),
        a = Math.min(...xs),
        b = Math.max(...xs),
        w = b - a,
        hx = f.hinge === 'R' ? b : a,
        e = f.hinge === 'R' ? a : b,
        y = D + 20;
      o += `<path d="M${P(hx, y + w)} A${n1(w)} ${n1(w)} 0 0 ${f.hinge === 'R' ? 1 : 0} ${P(e, y)}" fill="none" style="stroke:var(--ink3)" stroke-width="10" stroke-dasharray="40 30"/><line x1="${n1(hx)}" y1="${n1(y)}" x2="${n1(hx)}" y2="${n1(y + w)}" style="stroke:var(--ink3)" stroke-width="14"/>`;
    });
  (G.objs || [])
    .filter(ob => ob.wall !== 'back')
    .forEach(ob => {
      const x = ob.wall === 'left' ? 0 : W;
      o += `<line x1="${x}" y1="${n1(ob.x)}" x2="${x}" y2="${n1(ob.x + ob.w)}" stroke="${ob.type === 'door' ? '#C2410C' : '#2F6FA8'}" stroke-width="70"/>`;
      if (ob.type === 'door') {
        const op = (S.room.objs[ob.i] || {}).opens !== 'out',
          far = (S.room.objs[ob.i] || {}).hinge === 'far',
          hy = far ? ob.x + ob.w : ob.x,
          ey = far ? ob.x : ob.x + ob.w,
          dx = ob.wall === 'left' ? 1 : -1;
        if (op)
          o += `<path d="M${P(x + dx * ob.w, hy)} A${n1(ob.w)} ${n1(ob.w)} 0 0 ${dx > 0 === far ? 1 : 0} ${P(x, ey)}" fill="none" stroke="#C2410C" stroke-width="10" stroke-dasharray="40 30"/>`;
      }
    });
  o += `<line x1="0" y1="0" x2="${W}" y2="0" style="stroke:var(--ink)" stroke-width="50"/><line x1="0" y1="0" x2="0" y2="${D + sp}" style="stroke:var(--ink)" stroke-width="40"/><line x1="${W}" y1="0" x2="${W}" y2="${D + sp}" style="stroke:var(--ink)" stroke-width="40"/>`;
  if (F.on && F.space > 0)
    o += `<line x1="0" y1="${D + sp}" x2="${W}" y2="${D + sp}" style="stroke:var(--ink)" stroke-width="30" stroke-dasharray="80 50"/><text x="${W + 60}" y="${n1(D + sp / 2)}" font-size="120" style="fill:var(--ink2)" transform="rotate(90 ${W + 60} ${n1(D + sp / 2)})" text-anchor="middle">${f0(sp)}</text>`;
  return o + '</svg>';
}
function groupPanels(G) {
  const map = new Map();
  G.panels.forEach(p => {
    const key = [
      p.type,
      p.role,
      p.matType,
      p.t,
      p.fin,
      JSON.stringify(p.poly),
      JSON.stringify(p.holes),
      p.notes.join(';')
    ].join('|');
    if (!map.has(key)) map.set(key, Object.assign({}, p, { qty: 0, secs: [] }));
    const q = map.get(key);
    q.qty++;
    if (p.sec && !q.secs.includes(p.sec)) q.secs.push(p.sec);
  });
  const ro = { carcass: 0, shelf: 1, back: 2, front: 3, desk: 4, skirt: 5 };
  const mk = p => p.matType + '|' + p.fin + '|' + p.t,
    mr = {},
    mq = {};
  map.forEach(p => {
    const k = mk(p),
      r = /^Drawer (box|bottom)/.test(p.type) ? 2.5 : (ro[p.role] ?? 9);
    if (mr[k] == null || r < mr[k]) mr[k] = r;
    mq[k] = (mq[k] || 0) + p.qty * p.w * p.h;
  });
  const mOrd = Object.keys(mr).sort((a, b) => mr[a] - mr[b] || mq[b] - mq[a]);
  const arr = [...map.values()].sort(
    (a, b) =>
      mOrd.indexOf(mk(a)) - mOrd.indexOf(mk(b)) ||
      (ro[a.role] ?? 9) - (ro[b.role] ?? 9) ||
      a.type.localeCompare(b.type) ||
      Math.max(b.w, b.h) - Math.max(a.w, a.h)
  );
  const bTh = +(S.opts.bandTh || 0);
  arr.forEach((p, i) => {
    p.id = 'P' + (i + 1);
    p.L = p.grain === 'w' ? p.w : p.h;
    p.Wd = p.grain === 'w' ? p.h : p.w;
    p.rect = isRect(p);
    p.finL = p.L;
    p.finWd = p.Wd;
    if (bTh > 0.45 && p.rect) {
      const b = bandSides(p),
        nL = (b[2] ? 1 : 0) + (b[3] ? 1 : 0),
        nW = (b[0] ? 1 : 0) + (b[1] ? 1 : 0);
      if (nL || nW) {
        p.L = r1(p.L - bTh * nL);
        p.Wd = r1(p.Wd - bTh * nW);
        p.bandCut = 1;
      }
    }
    p.bandM = p.band === 'all' ? polyPerim(p.poly) / 1000 : p.band === 'front' ? (p.bandLen || 0) / 1000 : 0;
  });
  return arr;
}

/* nesting: shelf first-fit, grain aware */
function packGroup(parts, sheet, kerf, trim, grainLock) {
  const L = sheet.L - 2 * trim,
    Wd = sheet.W - 2 * trim,
    sheets = [],
    over = [];
  const pcs = parts
    .map(p => {
      let rot, pw, ph;
      if (grainLock) {
        rot = p.grain === 'h';
      } else {
        rot = p.h > p.w;
      }
      pw = rot ? p.h : p.w;
      ph = rot ? p.w : p.h;
      if (!grainLock && (pw > L || ph > Wd) && ph <= L && pw <= Wd) {
        rot = !rot;
        [pw, ph] = [ph, pw];
      }
      return { p, rot, pw, ph };
    })
    .sort((a, b) => b.ph - a.ph || b.pw - a.pw);
  pcs.forEach(c => {
    if (c.pw > L + 0.1 || c.ph > Wd + 0.1) {
      over.push(c.p);
      return;
    }
    let done = false;
    for (const s of sheets) {
      for (const sh of s.shelves) {
        if (sh.x + c.pw <= L + 0.1 && c.ph <= sh.h + 0.1) {
          s.pl.push({ ...c, x: sh.x + trim, y: sh.y + trim });
          sh.x += c.pw + kerf;
          done = true;
          break;
        }
      }
      if (done) break;
      if (s.y + c.ph <= Wd + 0.1) {
        s.shelves.push({ y: s.y, h: c.ph, x: c.pw + kerf });
        s.pl.push({ ...c, x: trim, y: s.y + trim });
        s.y += c.ph + kerf;
        done = true;
        break;
      }
    }
    if (!done) {
      const s = { shelves: [{ y: 0, h: c.ph, x: c.pw + kerf }], y: c.ph + kerf, pl: [{ ...c, x: trim, y: trim }] };
      sheets.push(s);
    }
  });
  sheets.forEach(s => {
    s.used = s.pl.reduce((a, c) => a + Math.abs(polyArea(c.p.poly)), 0) / (sheet.L * sheet.W);
  });
  return { sheets, over };
}
/*CORE-END*/
