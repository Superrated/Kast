/* Runs inside the Fitted page (tests/run.py): makes each order-check problem on purpose and checks it is found. */
(st => {
  const found = [];
  const base = () => { S = JSON.parse(JSON.stringify(st)); groupsCache = null; if (typeof _bg !== 'undefined') _bg = null; geo = build(S); };
  const titles = () => orderCheck().map(c => c.t);
  const expect = (name, make, word) => {
    base(); make();
    const t = titles();
    found.push([name, t.some(x => x.includes(word))]);
  };
  const mutate = fn => { const gs = groupsCache = groupPanels(bgeo()); fn(gs); };
  expect('broken size', () => mutate(gs => { gs[0].L = NaN }), 'no proper size');
  expect('too-deep hole', () => mutate(gs => { const p = gs.find(q => (q.holes || []).some(h => h.dp)); const h = p.holes.find(h => h.dp); h.dp = p.t }), 'as deep as the board');
  expect('hole off the part', () => mutate(gs => { const p = gs.find(q => (q.holes || []).length); p.holes.push({ x: p.w + 50, y: 10, d: 5, dp: 10 }) }), 'off the part');
  expect('few hinges', () => { const f = geo.fronts.find(f => f.kind === 'door' && f.cups && f.cups.length); f.cups = f.cups.slice(0, 1) }, 'Few hinges');
  expect('hinges too close', () => { const f = geo.fronts.find(f => f.kind === 'door' && f.cups && f.cups.length > 1); f.cups[1] = f.cups[0] + 40 }, 'closer than 90');
  expect('front in ceiling', () => { const f = geo.fronts[0]; const c = geo.ceilAt; geo.ceilAt = x => Math.max(...f.poly.map(p => p[1])) - 1 }, 'touching the ceiling');
  expect('door at wall', () => { const f = geo.fronts.find(f => f.kind === 'door'); f.hinge = 'L'; f.poly = f.poly.map(([x, y]) => [x - Math.min(...f.poly.map(p => p[0])), y]) }, 'side wall');
  expect('hinge plate on header rail', () => { const f = geo.fronts.find(f => f.kind === 'door' && f.cups && f.cups.length && f.hinge); const xs = f.poly.map(p => p[0]), hx = f.hinge === 'L' ? Math.min(...xs) : Math.max(...xs); geo.hRails = (geo.hRails || []).concat([{ xa: hx - 30, xb: hx + 30, y0: f.cups[0] - 10, y1: f.cups[0] + 10, rear: false }]) }, 'header rail');
  return found;
})
