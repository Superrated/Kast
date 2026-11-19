/* Runs inside the Fitted page (tests/run.py): "Make the doors the same" must give equal doors in
   1. balder v07: 3 doors following the uprights (uneven inside the column) above the nook, a pinned panel wall,
      and 2 full-height doors further on (the pinned wall means only the column between can make room);
   2. a 3-door column next to a 2-door column, nothing else on the wall (they trade width). */
(balder => {
  const out = [];
  const doors = () => geo.fronts.filter(f => f.kind === 'door').map(f => { const xs = f.poly.map(p => p[0]); return Math.max(...xs) - Math.min(...xs) });
  const check = (name, st, far, moved) => {
    S = JSON.parse(JSON.stringify(st)); geo = build(S); groupsCache = null;
    const notes = new Set(geo.warns); evenDoors(far);
    const w = doors(), spread = Math.max(...w) - Math.min(...w), extra = geo.warns.filter(x => !notes.has(x)).length;
    out.push([name, spread < 0.6 && (moved == null || extra === 0), `doors ${w.map(x => x.toFixed(1)).join(', ')}; ${extra} new notes`]);
  };
  check('balder v07: nook doors + pinned wall + wardrobe', balder, false);
  check('3 doors next to 2 doors', stBase({ name: 't', W: 2400, secs: [Sec({ w: 1300, zones: [Z('closed', { shelves: 2, doors: 3 })] }), Sec({ zones: [Z('closed', { shelves: 2, doors: 2 })] })] }), true);
  return out;
})
