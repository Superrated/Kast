/* Runs inside the Fitted page (tests/run.py). For one design it returns everything the tests compare:
   the cut list, the hardware list, the design notes, the price total, and how the 3D boards link to the cut list. */
(st => {
  const r = v => typeof v === 'number' ? Math.round(v * 10) / 10 : v;
  const deep = v => Array.isArray(v) ? v.map(deep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k, x]) => typeof x !== 'function').map(([k, x]) => [k, deep(x)])) : r(v);
  OOPS.length = 0;
  S = JSON.parse(JSON.stringify(st)); geo = build(S); groupsCache = null; if (typeof _bg !== 'undefined') _bg = null;
  const gs = groupPanels(bgeo());
  const cut = gs.map(p => ({ id: p.id, type: p.type, role: p.role, qty: p.qty, L: r(p.L), W: r(p.Wd), t: r(p.t), mat: p.matType, fin: p.fin, grain: p.grain || '', band: bandSides(p).map(b => b ? 1 : 0).join(''),
    holes: (p.holes || []).map(h => [r(h.x), r(h.y), r(h.d), h.dp ? r(h.dp) : 0, h.face || ''].join(' ')).sort(), shape: (p.poly || []).map(q => q.map(r).join(',')).join(' '), secs: (p.secs || []).slice().sort() }));
  const sol = tdSolids(geo), boards = sol.filter(s => s.role !== 'hw');
  const link = { boards: boards.length, linked: boards.filter(s => s.pan).length, holesOnLinked: boards.filter(s => s.pan && (s.pan.holes || []).length).length,
    unlinkedWithHoles: 0 };
  // parts with drill holes (not cut-outs or slots) that have no 3D board
  link.unlinkedWithHoles = geo.panels.filter(p => (p.holes || []).some(h => !h.poly && !h.len) && !geo.items.some(it => it.pan === p)).length;
  const price = priceOf(JSON.parse(JSON.stringify(st)));
  const problems = OOPS.filter(o => !o.quiet).map(o => o.where + ': ' + o.msg);
  return { problems, cut, hardware: deep(geo.H), notes: [...new Set(geo.warns)].sort(), price: price ? r(price.total) : null, link };
})
