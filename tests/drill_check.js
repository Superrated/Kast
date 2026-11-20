/* Runs inside the Fitted page (tests/run.py). Workshop sanity checks for one design; returns a list of problems:
   holes that fall off their part, Ø5/Ø8 holes that run into each other on one part, hinge mounting plates that are
   not 37 mm from the front, hinge cups without plate holes beside them, fixed boards and uprights that are not fixed, shelves without
   their 4 pin holes, and boards that overlap in 3D
   (backs in their grooves and header rails in their notches are allowed). */
(st => {
  S = JSON.parse(JSON.stringify(st)); geo = build(S); groupsCache = null; if (typeof _bg !== 'undefined') _bg = null;
  const out = [];
  for (const g of geo.panels) {
    const xs = (g.poly || []).map(q => q[0]), ys = (g.poly || []).map(q => q[1]), pw = Math.max(...xs), ph = Math.max(...ys);
    const hs = (g.holes || []).filter(h => !h.poly);
    for (const h of hs) {
      const r = (h.d || 0) / 2;
      if (h.x - r < -0.5 || h.y - r < -0.5 || h.x + r > pw + 0.5 || h.y + r > ph + 0.5) out.push(`${g.type} ${g.sec}: hole off the part at ${h.x}, ${h.y}`);
    }
    if (hs.some(h => h.plate && Math.abs(h.x - 37) > 0.5 && Math.abs(h.x - (pw - 37)) > 0.5)) out.push(`${g.type} ${g.sec}: hinge plate not 37 mm from the front`);
    const sm = hs.filter(h => h.d <= 10);
    for (let i = 0; i < sm.length; i++)
      for (let j = i + 1; j < sm.length; j++)
        if (Math.hypot(sm[i].x - sm[j].x, sm[i].y - sm[j].y) < (sm[i].d + sm[j].d) / 2 + 2) out.push(`${g.type} ${g.sec}: holes run into each other at ${sm[i].x}, ${sm[i].y}`);
  }
  // every hinge cup needs its two mounting-plate holes in the board the door hinges on, at the cup height ± 16 mm
  const vert = tdSolids(geo).filter(s => s.pan && s.ax === 0);
  for (const f of geo.fronts) {
    if (!f.cups || !f.cups.length || f.rear || !f.poly || !(f.hinge === 'L' || f.hinge === 'R')) continue;
    const xs = f.poly.map(p => p[0]), he = f.hinge === 'R' ? Math.max(...xs) : Math.min(...xs);
    const cand = vert.filter(s => s.bb[0][0] < he + 30 && s.bb[0][1] > he - 30 && s.bb[1][0] < f.cups[0] && s.bb[1][1] > f.cups[f.cups.length - 1]);
    const ok = f.cups.every(c => cand.some(s => (s.pan.holes || []).some(h => h.plate && [c - 16, c + 16].some(y => Math.abs(h.y + s.bb[1][0] - y) < 1.5))));
    if (!ok) out.push(`S${f.sec + 1}: a door's hinge has no mounting-plate holes beside it`);
  }
  const sol = tdSolids(geo).filter(s => s.pan && s.role !== 'hw' && s.role !== 'back' && !/rail/i.test(s.pan.type));
  for (let i = 0; i < sol.length; i++)
    for (let j = i + 1; j < sol.length; j++) {
      const a = sol[i].bb, b = sol[j].bb;
      if ([0, 1, 2].every(k => Math.min(a[k][1], b[k][1]) - Math.max(a[k][0], b[k][0]) > 1)) out.push(`3D overlap: ${sol[i].pan.type} ${sol[i].pan.sec} × ${sol[j].pan.type} ${sol[j].pan.sec}`);
    }
  // every fixed board (bottom, top, fixed shelf, header, desk top, lining box) is fixed where its end meets a side or partition
  {
    const all = tdSolids(geo).filter(s => s.pan && s.role !== 'hw'), vt = all.filter(s => s.ax === 0), hz = all.filter(s => s.ax === 1);
    const FIX = /Bottom|^Top$|Fixed divider|Header$|Desk top|Niche box \(top|Open box \(top/, isFix = h => h.cf || h.dw || /connector|dowel|Minifix|screw/i.test(h.face || '');
    for (const b of hz) {
      if (!FIX.test(b.pan.type)) continue;
      const [y0, y1] = b.bb[1], [z0, z1] = b.bb[2];
      [[b.bb[0][0], 1], [b.bb[0][1], 0]].forEach(([x, k]) => {
        const v = vt.find(s => Math.abs(s.bb[0][k] - x) < 1.5 && s.bb[1][0] < y1 - 1 && s.bb[1][1] > y0 + 1 && s.bb[2][0] < z1 - 1 && s.bb[2][1] > z0 + 1);
        if (v && !(v.pan.holes || []).some(h => isFix(h) && h.y + v.bb[1][0] > y0 - 2 && h.y + v.bb[1][0] < y1 + 2) && !(b.pan.holes || []).some(isFix))
          out.push(`${b.pan.type} ${b.pan.sec}: no fixing into ${v.pan.type} ${v.pan.sec}`);
      });
    }
    // uprights: fixed at both ends (dowels in the boards, or brackets under a sloping top)
    geo.panels.filter(p => p.type === 'Vertical divider').forEach(p => {
      const n = (p.notes || []).join(' ');
      if (!/top and bottom edges|top edge|Top: cut to the slope/.test(n) || !/top and bottom edges|bottom edge/.test(n)) out.push(`Upright ${p.sec}: an end is not fixed`);
    });
    // every shelf on pins has 2 holes at each end that stands against a board
    all.filter(b => b.role === 'shelf' && b.ax === 1 && b.pan.type === 'Shelf' && !/sloping top/.test((b.pan.notes || []).join(' '))).forEach(b => {
      const ys = b.bb[1][0];
      [[b.bb[0][0], 1], [b.bb[0][1], 0]].forEach(([x, k]) => {
        const v = vt.find(s => Math.abs(s.bb[0][k] - x) < 4 && s.bb[1][0] < ys && s.bb[1][1] > ys && s.bb[2][0] < b.bb[2][1] && s.bb[2][1] > b.bb[2][0]);
        if (!v) return;
        const n = (v.pan.holes || []).filter(h => !h.plate && !h.cf && !h.dw && h.d <= 5.5 && Math.abs(h.y + v.bb[1][0] - (ys - 4)) < 3).length;
        if (n < 2) out.push(`Shelf ${b.pan.sec} at ${Math.round(ys)}: ${n} pin hole(s) at one end`);
      });
    });
  }
  return [...new Set(out)];
})
