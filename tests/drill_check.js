/* Runs inside the Fitted page (tests/run.py). Workshop sanity checks for one design; returns a list of problems:
   holes that fall off their part, Ø5/Ø8 holes that run into each other on one part, hinge mounting plates that are
   not 37 mm from the front, hinge cups without plate holes beside them, and boards that overlap in 3D
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
  return [...new Set(out)];
})
