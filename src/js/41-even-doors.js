/* ==== 41-even-doors.js ====
   "Make the doors the same": doors in different columns (and within one column) that should match.
   Shown at the top of the column editor (Layout).

   How it plans (edPlan), for a group of columns whose doors should match:
   - A column's doors = the level with the most doors (edSets). Doors that follow the uprights of a level
     (doors: 0 with uprights) can be uneven inside one column, because the outer doors also cover the side
     panels; those uprights are moved a little so the doors match (edEvenInside).
   - A pinned column (one with a fixed position) splits the wall into stretches. In a stretch where no other
     column can change width, the columns are FIXED: their doors set the target width, and the other
     columns follow them. In a stretch with a free column, that column takes up the difference (it is made
     "auto width"), so nothing else moves.
   - Without fixed columns the target is the average of all the doors (weighted by how many there are).
   doorGroups(G)      groups of columns whose doors are almost the same (within 12 mm or 5 %), or doors
                      uneven inside one column;
   doorGroups(G,true) all door columns together ("further apart", shown with a warning).
   evenDoors(far) applies the plan and says what moved.
*/
function edSets(G) {
  const out = [];
  G.secs.forEach(q => {
    if (q.panel || q.door || q.follow != null || q.grp) return;
    const byZ = {};
    G.fronts.forEach(f => {
      if (f.sec !== q.i || f.kind !== 'door' || f.leaf || f.rear || f.face === 'curtain') return;
      (byZ[f.zone] = byZ[f.zone] || []).push(f);
    });
    const zs = Object.entries(byZ).sort((a, b) => b[1].length - a[1].length);
    if (!zs.length) return;
    const [zk, ds] = zs[0],
      x0 = f => Math.min(...f.poly.map(p => p[0])),
      ws = ds
        .slice()
        .sort((a, b) => x0(a) - x0(b))
        .map(f => {
          const xs = f.poly.map(p => p[0]);
          return Math.max(...xs) - Math.min(...xs);
        });
    const z = ((S.sections[q.i] || {}).zones || [])[+zk];
    const follow = !!(z && Array.isArray(z.vd) && z.vd.length && !(+z.doors > 0) && z.vd.length === ws.length - 1);
    out.push({ i: q.i, zone: +zk, n: ws.length, ws, d: ws.reduce((a, b) => a + b, 0) / ws.length, spread: Math.max(...ws) - Math.min(...ws), follow });
  });
  return out;
}

function doorGroups(G, far) {
  G = G || geo;
  const sets = edSets(G).sort((a, b) => a.d - b.d);
  const uneven = r => r.follow && r.spread > 0.6;
  let groups = [];
  if (far) groups = sets.length ? [sets] : [];
  else {
    let g = [];
    sets.forEach(r => {
      if (g.length && r.d - g[0].d > Math.max(12, g[0].d * 0.05)) {
        groups.push(g);
        g = [];
      }
      g.push(r);
    });
    if (g.length) groups.push(g);
  }
  return groups.filter(g => (g.length > 1 && Math.max(...g.map(r => r.d)) - Math.min(...g.map(r => r.d)) > 0.4) || g.some(uneven));
}

/* which columns stay, which move, and who makes room.
   Per stretch of wall (between pinned columns):
   - another column can change width → it makes room; these doors follow the target T,
   - no other column, but 2+ door columns → they trade width among themselves (their total stays);
     their own average is what they can reach, and it counts towards T,
   - one door column alone → it can't change: FIXED, its doors count towards T. */
function edPlan(G, grp) {
  const runs = [];
  let run = 0;
  G.secs.forEach(q => {
    if (q.pin != null && q.i > 0) run++;
    runs[q.i] = run;
  });
  const mem = new Set(grp.map(r => r.i)),
    fixed = new Set(),
    absorber = {},
    selfT = {},
    byRun = {};
  grp.forEach(r => (byRun[runs[r.i]] = byRun[runs[r.i]] || []).push(r));
  const avg = rs => rs.reduce((a, r) => a + r.n * r.d, 0) / rs.reduce((a, r) => a + r.n, 0);
  const anchors = []; // what can't move: [door width, number of doors]
  Object.entries(byRun).forEach(([rn, rs]) => {
    const cand = G.secs.filter(q => runs[q.i] === +rn && !mem.has(q.i) && q.pin == null && !q.panel && !q.door && q.follow == null && !q.grp);
    if (cand.length) {
      const auto = cand.find(q => !(+S.sections[q.i].w > 0));
      absorber[rn] = (auto || cand.slice().sort((a, b) => b.w - a.w)[0]).i;
      return;
    }
    if (rs.length === 1) {
      fixed.add(rs[0].i);
      anchors.push([rs[0].d, rs[0].n]);
      return;
    }
    const t = avg(rs);
    rs.forEach(r => (selfT[r.i] = t));
    anchors.push([t, rs.reduce((a, r) => a + r.n, 0)]);
  });
  const T = anchors.length ? anchors.reduce((a, [d, n]) => a + d * n, 0) / anchors.reduce((a, [, n]) => a + n, 0) : avg(grp);
  const target = i => (fixed.has(i) ? null : selfT[i] != null ? selfT[i] : T);
  const moves = grp.filter(r => target(r.i) != null).map(r => ({ i: r.i, dw: r.n * (target(r.i) - r.d) })),
    ends = anchors.map(a => a[0]),
    fixedOff = ends.length > 1 ? Math.max(...ends) - Math.min(...ends) : 0;
  return { T, fixed, absorber, selfT, target, moves, fixedOff, runs, move: Math.max(0, ...moves.map(m => Math.abs(m.dw))) };
}

/* doors that follow the uprights of one level: move the uprights so the doors come out equal.
   Levels of the same column with the same uprights move along, so the uprights stay in line. */
function edEvenInside(i, s) {
  const sc = S.sections[i],
    z = sc.zones[s.zone],
    q = geo.secs[i],
    zr = q && q.zones ? q.zones[s.zone] : null,
    old = (zr && zr.vdUsed && zr.vdUsed.length === z.vd.length ? zr.vdUsed : z.vd).map(Number);
  const m = s.d;
  let cum = 0;
  const nv = old.map((x, j) => {
    cum += m - s.ws[j];
    return Math.round((x + cum) * 10) / 10;
  });
  sc.zones.forEach((z2, k) => {
    if (k === s.zone || !Array.isArray(z2.vd) || z2.vd.length !== old.length) return;
    const zr2 = q && q.zones ? q.zones[k] : null,
      used = (zr2 && zr2.vdUsed && zr2.vdUsed.length === z2.vd.length ? zr2.vdUsed : z2.vd).map(Number);
    if (used.every((v, j) => Math.abs(v - old[j]) < 0.6)) {
      z2.vd = nv.slice();
      z2.vdMode = null;
    }
  });
  z.vd = nv;
  z.vdMode = null;
}

/* plain words for the strip: what happens */
function edWords(g, P) {
  const f1 = v => Math.round(v),
    xs = g.slice().sort((a, b) => a.i - b.i);
  const now = xs.map(r => `S${r.i + 1} ${r.n}× ${r.spread > 0.6 ? r.ws.map(f1).join('/') : f1(r.d)}`).join(', ');
  const why = [];
  const fx = xs.filter(r => P.fixed.has(r.i));
  if (fx.length && fx.length < xs.length)
    why.push(`${fx.map(r => 'S' + (r.i + 1)).join(', ')} can't change width (a pinned column next to it), so the others follow ${fx.length > 1 ? 'them' : 'it'}`);
  const ab = [...new Set(Object.values(P.absorber))];
  if (ab.length && P.move > 0.4) why.push(`${ab.map(i => 'S' + (i + 1)).join(', ')} changes width to make room`);
  const ins = xs.filter(r => r.follow && r.spread > 0.6);
  if (ins.length) why.push(`the uprights in ${ins.map(r => 'S' + (r.i + 1)).join(', ')} move a little so ${ins.length > 1 ? 'their' : 'its'} doors match`);
  if (P.fixedOff > 0.6) why.push(`parts of the wall that can't change differ by ${f1(P.fixedOff)} mm, so not all doors can match exactly`);
  return { now, T: f1(P.T * 10) / 10, why };
}

function evenDoors(far) {
  const g0 = doorGroups(geo, far);
  if (!g0.length) {
    toast('The door widths are already even');
    return;
  }
  const notes0 = new Set(geo.warns || []),
    w0 = geo.secs.map(q => q.w),
    plans = g0.map(g => edPlan(geo, g)),
    ids = g0.map(g => g.map(r => r.i));
  plans.forEach(P => Object.values(P.absorber).forEach(i => (S.sections[i].w = null)));
  let worst = Infinity;
  for (let it = 0; it < 10; it++) {
    geo = build(S);
    const by = {};
    edSets(geo).forEach(s => (by[s.i] = s));
    worst = 0;
    ids.forEach((ix, gi) =>
      ix.forEach(i => {
        const s = by[i];
        if (!s) return;
        const t = plans[gi].target(i);
        worst = Math.max(worst, t == null ? 0 : Math.abs(s.d - t), s.follow ? s.spread : 0);
        if (s.follow && s.spread > 0.3) edEvenInside(i, s);
        if (t != null) S.sections[i].w = Math.round((geo.secs[i].w + s.n * (t - s.d)) * 10) / 10;
      })
    );
    if (worst < 0.6) break;
  }
  geo = build(S);
  let maxMove = 0;
  geo.secs.forEach((q, i) => (maxMove = Math.max(maxMove, Math.abs(q.w - (w0[i] == null ? q.w : w0[i])))));
  changed(true);
  const newNotes = [...new Set(geo.warns || [])].filter(w => !notes0.has(w)).length,
    names = ids.map(ix => ix.slice().sort((x, y) => x - y).map(i => 'S' + (i + 1)).join(', ')).join(' and ');
  toast(
    `${worst < 0.6 ? `Done: the doors in ${names} are the same width now.` : 'Most doors are even now; some could not be matched exactly.'} Columns moved by up to ${Math.max(1, Math.round(maxMove))} mm.${
      newNotes ? ` ⚠ ${newNotes} new design note${newNotes > 1 ? 's — check them' : ' — check it'}; Undo puts it back.` : far ? ' Check that drawers, rails and fittings still suit the new widths; Undo puts it back.' : ''
    }`,
    9000
  );
}

function evenDoorsUI() {
  let g = [];
  try {
    g = doorGroups(geo);
  } catch (e) {
    oops('even doors', e);
  }
  if (!g.length) return '';
  const lines = g.map(x => {
    const W = edWords(x, edPlan(geo, x));
    return `Doors in ${W.now} mm are almost the same → all ${W.T} mm${W.why.length ? ` <small>(${W.why.join('; ')})</small>` : ''}.`;
  });
  return `<div class="gwarn evnear"><span>${lines.join('<br>')}</span><button type="button" class="btn sm" data-act="evenDoors">Make them the same</button></div>`;
}

/* doors further apart: same idea, with a warning how far the columns move */
function evenDoorsFarUI() {
  if (ui.evenFarOff) return '';
  let g = [],
    P = null;
  try {
    const near = new Set(doorGroups(geo).flat().map(r => r.i));
    g = doorGroups(geo, true).filter(x => x.some(r => !near.has(r.i)) && x.length > 1);
    if (g.length) P = edPlan(geo, g[0]);
  } catch (e) {
    oops('even doors: further apart', e);
  }
  if (!g.length || !P) return '';
  const W = edWords(g[0], P);
  return `<div class="gwarn evfar"><span><b>Doors of different widths</b> ${W.now} mm → all ${W.T} mm.${W.why.length ? ` <small>(${W.why.join('; ')})</small>` : ''}<br><small>⚠ This moves columns by up to ${Math.round(P.move)} mm, so inside fittings (drawers, rails, shelves) change size too. Undo puts it back.</small></span><div class="evfarb"><button type="button" class="btn sm" data-act="evenDoorsFar">Make them the same anyway</button><button type="button" class="btn sm" data-act="evenFarOff" aria-label="Hide this">Hide</button></div></div>`;
}
