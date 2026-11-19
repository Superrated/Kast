/* ==== 59-order-check.js ====
   "Check before ordering": a last look at the finished parts before they go to a panel shop.
   The design notes (G.warns) look at the design; this looks at what will actually be cut and drilled,
   the things that cost wood and money when they are wrong:
     - every part has a real size and fits on a sheet,
     - holes are not deeper than the board and sit on the part,
     - hinge cups: enough hinges for the door height, not closer than 40 mm to the door's ends or 90 mm to each other,
     - hinge mounting plates clear of a front header rail,
     - no front reaches into the ceiling (it would scrape when it opens),
     - a door hinged right against a side wall can open (needs a gap or a filler strip),
     - drilled parts show their holes in 3D (otherwise the exploded views miss them),
     - your name and phone or email for the shops' forms.
   orderCheck() returns the list; orderCheckHTML() draws the card shown in Parts → List above "Have it cut".
   Pressing a shop button while something is marked "stop" opens the card first; "Order anyway" goes on.
   To add a check: push {lv:'stop'|'look', t:'short title', d:'what to do'} in orderCheck().
*/
const OC_HINGES = [
  [900, 2],
  [1600, 3],
  [2000, 4],
  [2400, 5]
]; // door height up to … mm → hinges needed (Blum's rule of thumb for 19 mm doors)

function ocNeed(h) {
  for (const [max, n] of OC_HINGES) if (h <= max) return n;
  return 6;
}

function orderCheck() {
  const out = [];
  const add = (lv, t, d) => out.push({ lv, t, d });
  const G = bgeo();
  const gs = groupsCache || (groupsCache = groupPanels(G));

  // 1. sizes
  const bad = gs.filter(p => !(p.L > 0 && p.Wd > 0 && p.t > 0 && p.qty > 0) || [p.L, p.Wd, p.t].some(v => !isFinite(v)));
  if (bad.length)
    add('stop', `${bad.length} part${bad.length > 1 ? 's have' : ' has'} no proper size`, `${bad.map(p => p.id).join(', ')} — change the design until the size shows in the list.`);

  // 2. bigger than the sheet
  let nest = [];
  try {
    nest = nestAll(gs);
  } catch (e) {
    oops('order check: sheets', e);
  }
  nest.forEach(n => {
    if (!n.over || !n.over.length) return;
    const ids = [...new Set(n.over.map(o => (o.p && o.p.id) || o.id).filter(Boolean))];
    add(
      'stop',
      `Too big for a ${n.sheet.replace('x', ' × ')} sheet`,
      `${ids.length ? ids.join(', ') + ': ' : ''}${MATS[n.mt]?.name || n.mt} ${n.t} mm. Split the part, choose a bigger sheet, or ask the shop for a joint.`
    );
  });

  // 3. holes
  const deep = [],
    outside = [];
  gs.forEach(p => {
    (p.holes || []).forEach(h => {
      if (h.poly || h.len) return;
      if (h.dp && h.dp >= p.t - 1 && !/through/i.test(h.face || '')) deep.push(`${p.id} (Ø${h.d} × ${h.dp} mm in ${p.t} mm)`);
      if (h.x < -0.5 || h.y < -0.5 || h.x > p.w + 0.5 || h.y > p.h + 0.5) outside.push(p.id);
    });
  });
  if (deep.length)
    add('stop', 'Holes as deep as the board', [...new Set(deep)].join(', ') + ' — they would come out the other side. Use a thicker board or shallower hinges.');
  if (outside.length) add('stop', 'Holes off the part', [...new Set(outside)].join(', ') + ' — a hole falls outside the board.');

  // 4. hinges
  const few = [],
    ends = [],
    close = [];
  (G.fronts || []).forEach((f, i) => {
    if (f.kind !== 'door' || !Array.isArray(f.cups) || !f.cups.length || !f.poly) return;
    const ys = f.poly.map(p => p[1]),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys),
      h = y1 - y0,
      lab = `S${f.sec + 1} door ${f.idx + 1}`;
    if (f.cups.length < ocNeed(h)) few.push(`${lab}: ${f.cups.length} for ${f0(h)} mm (use ${ocNeed(h)})`);
    if (f.cups.some(c => c - y0 < 40 || y1 - c < 40)) ends.push(lab);
    const cs = f.cups.slice().sort((a, b) => a - b);
    if (cs.some((c, k) => k && c - cs[k - 1] < 90)) close.push(lab);
  });
  if (few.length) add('look', 'Few hinges for the door height', few.join(' · ') + '. More hinges keep a tall door straight.');
  if (ends.length) add('look', 'Hinge closer than 40 mm to a door end', ends.join(', ') + ' — the cup would break through the edge or hit the cabinet top or bottom.');
  if (close.length) add('look', 'Hinges closer than 90 mm to each other', close.join(', ') + ' — the mounting plates would touch.');

  // 4b. hinge mounting plates (±25 mm round the cup height, 37 mm behind the front) must clear a front header rail
  const clash = [];
  (G.fronts || []).forEach(f => {
    if (f.kind !== 'door' || !Array.isArray(f.cups) || !f.hinge || !f.poly) return;
    const xs = f.poly.map(p => p[0]),
      hx = f.hinge === 'L' ? Math.min(...xs) : Math.max(...xs);
    (G.hRails || []).forEach(r => {
      if (r.rear || r.xa > hx + 40 || r.xb < hx - 40) return;
      if (f.cups.some(c => c - 25 < r.y1 && c + 25 > r.y0)) clash.push(`S${f.sec + 1} door ${f.idx + 1}`);
    });
  });
  if (clash.length) add('stop', 'Hinge plate on a header rail', [...new Set(clash)].join(', ') + ' — move the lowest hinge up so its mounting plate clears the rail.');

  // 5. fronts into the ceiling
  const hit = [];
  if (typeof G.ceilAt === 'function')
    (G.fronts || []).forEach(f => {
      if (!f.poly) return;
      if (f.poly.some(([x, y]) => y > G.ceilAt(x) - 2)) hit.push(`S${f.sec + 1} ${f.kind} ${f.idx + 1}`);
    });
  if (hit.length) add('stop', 'Fronts touching the ceiling', hit.join(', ') + ' — leave at least 2 mm, or they scrape when they open.');

  // 6. doors hinged against a side wall
  const wall = [];
  (G.fronts || []).forEach(f => {
    if (f.kind !== 'door' || !f.hinge || !f.poly) return;
    const xs = f.poly.map(p => p[0]),
      gap = f.hinge === 'L' ? Math.min(...xs) : G.W - Math.max(...xs);
    if (gap < 25) wall.push(`S${f.sec + 1} door ${f.idx + 1} (${f0(Math.max(0, gap))} mm)`);
  });
  if (wall.length)
    add(
      'look',
      'Door hinged right next to a side wall',
      wall.join(', ') + ' — if there is a wall there, the door and its handle hit it and drawers behind it can’t come out. Leave 30–50 mm (a closing strip) or hinge the door on the other side.'
    );

  // 7. drilled parts without a 3D board
  const lost = (G.panels || []).filter(p => (p.holes || []).some(h => !h.poly && !h.len) && !(G.items || []).some(it => it.pan === p));
  if (lost.length) add('look', 'Some drilled parts are not in the 3D views', `${lost.length} part${lost.length > 1 ? 's' : ''}: the cut list and drawings are right; only the exploded views miss their holes.`);

  // 8. design notes still open
  const notes = [...new Set(G.warns || [])];
  if (notes.length) add('look', `${notes.length} design note${notes.length > 1 ? 's' : ''} still open`, 'Read them under the drawing (the ⚠ marks) — some may change the parts.');

  // 9. details for the forms
  if (!ME.name || !(ME.phone || ME.email))
    add('look', 'Your details for the shop forms', 'Fill in your name and phone or email under “Your details on the forms”, so the shop knows who ordered.');

  return out.sort((a, b) => (a.lv === 'stop' ? 0 : 1) - (b.lv === 'stop' ? 0 : 1));
}

function orderCheckHTML() {
  let list = [];
  try {
    list = orderCheck();
  } catch (e) {
    oops('order check', e);
    return '';
  }
  const stops = list.filter(c => c.lv === 'stop').length,
    looks = list.length - stops;
  const head = !list.length
    ? '<b>Ready to order</b><span>Sizes, sheets, holes, hinges, ceiling and walls all check out.</span>'
    : `<b>${stops ? `${stops} thing${stops > 1 ? 's' : ''} to fix before ordering` : 'Ready to order — a few things to look at'}</b><span>${looks ? `${looks} to look at` : ''}</span>`;
  return `<div class="occard ${stops ? 'stop' : list.length ? 'look' : 'ok'}" id="occard"><div class="ochead"><i>${stops ? '!' : list.length ? '?' : '✓'}</i><div>${head}</div></div>${
    list.length
      ? `<ul>${list.map(c => `<li class="${c.lv}"><b>${esc(c.t)}</b><span>${esc(c.d)}</span></li>`).join('')}</ul>`
      : ''
  }${ui.ocPending ? `<div class="ocgo"><button type="button" class="btn sm" data-act="ocAnyway">Order anyway</button><span>The file is made with the parts as they are now.</span></div>` : ''}</div>`;
}

/* shop button pressed: with something to fix, show the card first */
function ocBeforeShop(shop) {
  if (ui.ocPending === shop) {
    ui.ocPending = null;
    return true;
  }
  let stops = 0;
  try {
    stops = orderCheck().filter(c => c.lv === 'stop').length;
  } catch (e) {
    oops('order check', e);
  }
  if (!stops) return true;
  ui.ocPending = shop;
  renderCut();
  setTimeout(() => {
    const el = document.getElementById('occard');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 30);
  toast('Check these first — or press “Order anyway”');
  return false;
}
