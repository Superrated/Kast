/* ==== 53-machining.js ====
   Machining drawings: one drawing per part with every size needed to cut, drill, groove, rout and finish it.
   - Measured from one corner, marked 0 (bottom-left as drawn). Sides: x = 0 is the FRONT edge; tops, bottoms
     and shelves: y = 0 is the FRONT edge.
   - Holes come from the part's own data (x, y, Ø, depth, which face), grouped in a hole table;
     grooves and finishing work come from the part notes; shaped edges get the coordinates of every corner.
   Used in the build guide (as SVG, per box) and as a PDF (Drawings → Labels & files), one part per page.
*/
function mdFrontEdge(p) {
  if (/side|End panel|Partition/i.test(p.type)) return 'x0';
  if (p.role === 'carcass' || p.role === 'shelf' || p.role === 'desk') return 'y0';
  return '';
}
function mdGroove(p) {
  for (const t of p.notes || []) {
    const m = /groove ([\d.]+) × ([\d.]+) mm deep, ([\d.]+) mm in from the back edge/i.exec(t);
    if (m) return { w: +m[1], d: +m[2], o: +m[3] };
  }
  return null;
}
const mdFmt = v => String(Math.round(v * 10) / 10);
/* compress a sorted list of numbers: "108 → 1924, every 32 (58)" when evenly spaced */
function mdList(vs) {
  vs = [...new Set(vs.map(v => Math.round(v * 10) / 10))].sort((a, b) => a - b);
  if (vs.length >= 4) {
    const st = vs[1] - vs[0];
    if (st > 0 && vs.every((v, i) => !i || Math.abs(v - vs[i - 1] - st) < 0.6))
      return `${mdFmt(vs[0])} → ${mdFmt(vs[vs.length - 1])}, every ${mdFmt(st)} (${vs.length})`;
  }
  return vs.map(mdFmt).join(', ');
}
function mdHoleKind(h) {
  if (h.poly) return 'cut';
  const d = +h.d || 5;
  if (h.len) return 'slot';
  if (d >= 30 && h.dp) return 'cup';
  if (d >= 25 && !h.dp) return d >= 60 ? 'cutout' : 'finger';
  return h.dp ? 'blind' : 'through';
}
function mdHoleText(k, h) {
  const d = +h.d || 5;
  return {
    cup: `Hinge cup Ø${d} × ${h.dp || 13} deep`,
    blind: `Ø${d} × ${h.dp} deep`,
    through: `Ø${d} through`,
    finger: `Ø${d} through (finger hole)`,
    cutout: `Ø${d} through (cut-out)`,
    slot: `Groove/slot ${h.len} long, Ø${d}`,
    cut: 'Cut-out'
  }[k];
}
/* a cut-out (h.poly) in plain sizes: a round hole (porthole), an arch (straight sides, round top) or any other shape.
   x0/y0 = its lowest-left point from the part's 0 corner; w × h its size. */
function mdCutInfo(poly) {
  const xs = poly.map(q => q[0]),
    ys = poly.map(q => q[1]),
    x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys),
    w = x1 - x0,
    h = y1 - y0,
    cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2;
  const rs = poly.map(q => Math.hypot(q[0] - cx, q[1] - cy)),
    rm = rs.reduce((a, b) => a + b, 0) / rs.length;
  if (poly.length >= 12 && Math.abs(w - h) < 2 && rs.every(r => Math.abs(r - rm) < 2))
    return { kind: 'round', x0, y0, w, h, cx, cy, d: w, text: `Round Ø${mdFmt(w)} · centre ${mdFmt(cx)}, ${mdFmt(cy)}` };
  // arch: the highest points at the left and right edges are where the round top starts
  const atL = poly.filter(q => Math.abs(q[0] - x0) < 0.6).map(q => q[1]),
    atR = poly.filter(q => Math.abs(q[0] - x1) < 0.6).map(q => q[1]);
  if (poly.length > 6 && atL.length && atR.length) {
    const ys_ = Math.min(Math.max(...atL), Math.max(...atR)),
      ry = y1 - ys_;
    if (ry > 10)
      return {
        kind: 'arch',
        x0, y0, w, h, cx, ys: ys_, ry,
        text: `Arch ${mdFmt(w)} wide × ${mdFmt(h)} high · straight sides ${mdFmt(ys_ - y0)} · round top ${mdFmt(ry)} high${Math.abs(ry - w / 2) < 1 ? ' (half circle R ' + mdFmt(w / 2) + ')' : ''}`
      };
  }
  return { kind: 'shape', x0, y0, w, h, text: `Shape ${mdFmt(w)} × ${mdFmt(h)} — corners in the shaped-parts list` };
}
/* the cut-outs of a part, the same ones grouped: what, how many, where (lowest-left corner) */
function mdCutRows(p) {
  const g = {};
  (p.holes || [])
    .filter(h => h.poly && h.poly.length > 2)
    .forEach(h => {
      const c = mdCutInfo(h.poly),
        key = c.text.replace(/ · centre .*/, '');
      (g[key] = g[key] || { c, list: [] }).list.push(c);
    });
  return Object.values(g).map(o => ({
    what: o.c.text.replace(/ · centre .*/, ''),
    n: o.list.length,
    where: o.list.map(c => (c.kind === 'round' ? `centre X ${mdFmt(c.cx)}, Y ${mdFmt(c.cy)}` : `from X ${mdFmt(c.x0)}, Y ${mdFmt(c.y0)}`))
  }));
}
/* the hole table rows for a part */
function mdHoleRows(p) {
  const g = {};
  (p.holes || []).forEach(h => {
    if (h.poly) return;
    const k = mdHoleKind(h),
      key = k + '|' + (+h.d || 5) + '|' + (h.dp || '') + '|' + (h.face || '');
    (g[key] = g[key] || { k, h, list: [] }).list.push(h);
  });
  const AZ = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Object.values(g).map((o, i) => {
    const xs = [...new Set(o.list.map(h => Math.round(h.x * 10) / 10))].sort((a, b) => a - b);
    return {
      tag: AZ[i] || 'Z' + i,
      what: mdHoleText(o.k, o.h),
      face: (o.h.face || '').replace(/^face towards /, 'face towards ').replace(/^through · /, ''),
      n: o.list.length,
      kind: o.k,
      d: +o.h.d || 5,
      blind: !!o.h.dp,
      where: xs.map(x => `X ${mdFmt(x)}: Y ${mdList(o.list.filter(h => Math.abs(h.x - x) < 0.06).map(h => h.y))}`)
    };
  });
}
/* the drawing of one part, in mm, as td-style entities */
function mdPart(p, den) {
  const E = [],
    poly = p.poly || rect(p.w, p.h),
    W = p.w,
    H = p.h,
    rows = mdHoleRows(p),
    tagOf = {};
  rows.forEach(r => (tagOf[r.kind + '|' + r.d + '|' + r.blind] = r.tag));
  E.push(tdPg(poly, { f: 1, w: 'thick', ly: 'CUT_OUTSIDE' }));
  // edge banding: thick bars just outside the banded edges
  const bs = bandSides(p),
    fe = mdFrontEdge(p),
    gr = p.grain === 'h';
  const edges = {
    x0: [
      [0, 0],
      [0, H]
    ],
    xW: [
      [W, 0],
      [W, H]
    ],
    y0: [
      [0, 0],
      [W, 0]
    ],
    yH: [
      [0, H],
      [W, H]
    ]
  };
  const longE = gr ? ['x0', 'xW'] : ['y0', 'yH'],
    shortE = gr ? ['y0', 'yH'] : ['x0', 'xW'];
  let L1 = longE[0],
    L2 = longE[1];
  if (fe && longE.includes(fe)) {
    L1 = fe;
    L2 = longE.find(e => e !== fe);
  }
  const on = {};
  on[L1] = bs[0];
  on[L2] = bs[1];
  on[shortE[0]] = bs[2];
  on[shortE[1]] = bs[3];
  const g = 1.6 * den;
  Object.entries(edges).forEach(([k, [a, b]]) => {
    if (!on[k]) return;
    const off = k === 'x0' ? [-g, 0] : k === 'xW' ? [g, 0] : k === 'y0' ? [0, -g] : [0, g];
    E.push(
      tdLn([a[0] + off[0], a[1] + off[1]], [b[0] + off[0], b[1] + off[1]], { w: 'thick', ly: 'EDGE_BAND' }),
      tdLn([a[0] + off[0] * 1.25, a[1] + off[1] * 1.25], [b[0] + off[0] * 1.25, b[1] + off[1] * 1.25], {
        w: 'thick',
        ly: 'EDGE_BAND'
      })
    );
  });
  // groove at the back edge
  const gv = mdGroove(p);
  if (gv && fe) {
    if (fe === 'x0') {
      const x1 = W - gv.o,
        x0 = x1 - gv.w;
      E.push(
        tdPg(
          [
            [x0, 0],
            [x1, 0],
            [x1, H],
            [x0, H]
          ],
          { f: 0.9, w: 'thin', d: 1, ly: 'GROOVE' }
        )
      );
      tdDim(E, [x0, H], [x1, H], 'h', H + 5 * den, den);
      tdDim(E, [x1, H], [W, H], 'h', H + 5 * den, den);
    } else {
      const y1 = H - gv.o,
        y0 = y1 - gv.w;
      E.push(
        tdPg(
          [
            [0, y0],
            [W, y0],
            [W, y1],
            [0, y1]
          ],
          { f: 0.9, w: 'thin', d: 1, ly: 'GROOVE' }
        )
      );
      tdDim(E, [W, y0], [W, y1], 'v', W + 5 * den, den);
      tdDim(E, [W, y1], [W, H], 'v', W + 5 * den, den);
    }
  }
  // holes
  (p.holes || []).forEach(h => {
    if (h.poly) {
      E.push(tdPg(h.poly, { f: 0.85, w: 'med', ly: 'CUT_INSIDE' }));
      try {
        const c = mdCutInfo(h.poly),
          tx = c.kind === 'round' ? c.cx : c.x0 + c.w / 2,
          ty = c.kind === 'round' ? c.cy : c.y0 + c.h * 0.45,
          big = Math.min(c.w, c.h) > 14 * den;
        if (big) {
          E.push(tdTx([tx, ty + 1.5 * den], c.kind === 'round' ? `Ø${mdFmt(c.d)}` : `${mdFmt(c.w)} × ${mdFmt(c.h)}`, { h: 2.2, al: 'c', ly: 'DIMENSIONS' }));
          E.push(
            tdTx(
              [tx, ty - 2 * den],
              c.kind === 'round' ? `centre ${mdFmt(c.cx)}, ${mdFmt(c.cy)}` : c.kind === 'arch' ? `top R ${mdFmt(c.ry)} from ${mdFmt(c.ys - c.y0)}` : 'see corners',
              { h: 1.8, al: 'c', ly: 'DIMENSIONS' }
            )
          );
        }
        if (c.kind !== 'round') {
          E.push(Object.assign(tdArc([c.x0, c.y0], 0.6 * den, 0, 360, { w: 'thin', ly: 'DIMENSIONS' }), { c: true, f: 0 }));
          if (big) E.push(tdTx([c.x0 + 1.2 * den, c.y0 + 1 * den], `${mdFmt(c.x0)}, ${mdFmt(c.y0)}`, { h: 1.8, al: 'l', ly: 'DIMENSIONS' }));
        }
      } catch (e) {
        oops('machining: cut-out sizes', e);
      }
      return;
    }
    const k = mdHoleKind(h),
      r = Math.max((+h.d || 5) / 2, 0.7 * den);
    E.push(Object.assign(tdArc([h.x, h.y], r, 0, 360, { w: 'thin', ly: 'HOLES' }), { c: true, f: h.dp ? 0.15 : 1 }));
  });
  // ordinates: X along the top, Y along the left (only where they do not crowd each other)
  const hx = [...new Set((p.holes || []).filter(h => !h.poly).map(h => Math.round(h.x)))].sort((a, b) => a - b),
    hy = [...new Set((p.holes || []).filter(h => !h.poly).map(h => Math.round(h.y)))].sort((a, b) => a - b),
    top = H + (gv && fe === 'x0' ? 12 : 3) * den;
  let lx = -1e9;
  hx.forEach(x => {
    E.push(tdLn([x, H + 0.6 * den], [x, top - 0.6 * den], { w: 'xthin', d: 1, ly: 'DIMENSIONS' }));
    if (x - lx >= 3.2 * den) {
      E.push(tdTx([x + 0.8 * den, top], String(x), { h: 2.2, r: 90, al: 'l', ly: 'DIMENSIONS' }));
      lx = x;
    }
  });
  let ly = -1e9,
    skipped = 0;
  hy.forEach(y => {
    if (y - ly >= 3 * den) {
      E.push(
        tdLn([-0.6 * den, y], [-4.2 * den, y], { w: 'xthin', ly: 'DIMENSIONS' }),
        tdTx([-4.8 * den, y - 0.8 * den], String(y), { h: 2.2, al: 'r', ly: 'DIMENSIONS' })
      );
      ly = y;
    } else skipped++;
  });
  if (skipped)
    E.push(
      tdTx([0, -(fe === 'y0' ? 14.5 : 10.5) * den], `+${skipped} more Y positions — see the hole table`, {
        h: 2,
        al: 'l',
        ly: 'DIMENSIONS'
      })
    );
  // shaped outline: coordinates of every corner that is not a plain rectangle corner
  if (!p.rect)
    poly.forEach(([x, y]) => {
      if ((Math.abs(x) < 0.5 || Math.abs(x - W) < 0.5) && (Math.abs(y) < 0.5 || Math.abs(y - H) < 0.5)) return;
      E.push(
        Object.assign(tdArc([x, y], 0.6 * den, 0, 360, { w: 'thin', ly: 'DIMENSIONS' }), { c: true, f: 0 }),
        tdTx([x + 1.2 * den, y + 1 * den], `${mdFmt(x)}, ${mdFmt(y)}`, { h: 2, al: 'l', ly: 'DIMENSIONS' })
      );
    });
  // overall sizes, origin, front edge, grain
  tdDim(E, [0, 0], [W, 0], 'h', -(on.y0 ? 7 : 5) * den, den);
  tdDim(E, [W, 0], [W, H], 'v', W + (on.xW ? 14 : 11) * den + (gv && fe === 'y0' ? 8 * den : 0), den);
  E.push(
    Object.assign(tdArc([0, 0], 1.4 * den, 0, 360, { w: 'med', ly: 'DIMENSIONS' }), { c: true, f: 1 }),
    tdLn([-2 * den, 0], [2 * den, 0], { w: 'thin', ly: 'DIMENSIONS' }),
    tdLn([0, -2 * den], [0, 2 * den], { w: 'thin', ly: 'DIMENSIONS' }),
    tdTx([-2.2 * den, -3.2 * den], '0', { h: 2.6, b: 1, al: 'r', ly: 'DIMENSIONS' })
  );
  if (fe === 'x0') E.push(tdTx([-2 * den, H / 2], 'FRONT EDGE', { h: 2.4, b: 1, r: 90, ly: 'TEXT' }));
  if (fe === 'y0') E.push(tdTx([W / 2, -11 * den], 'FRONT EDGE', { h: 2.4, b: 1, ly: 'TEXT' }));
  if (grainMatters(p)) {
    const cx = W / 2,
      cy = H / 2,
      Lg = Math.min(gr ? H : W, 60 * den) * 0.5;
    const a = gr ? [cx, cy - Lg / 2] : [cx - Lg / 2, cy],
      b = gr ? [cx, cy + Lg / 2] : [cx + Lg / 2, cy];
    E.push(
      tdLn(a, b, { w: 'med', ly: 'TEXT' }),
      tdTx(gr ? [cx + 1.6 * den, cy] : [cx, cy + 1.4 * den], 'GRAIN', { h: 2.2, r: gr ? 90 : 0, ly: 'TEXT' })
    );
  }
  // where each kind of hole is: a letter next to the first hole of the kind
  rows.forEach(r => {
    const h = (p.holes || []).find(
      h_ => !h_.poly && mdHoleKind(h_) === r.kind && (+h_.d || 5) === r.d && !!h_.dp === r.blind
    );
    if (h)
      E.push(
        tdTx([h.x + Math.max(+h.d / 2, 0.7 * den) + 0.8 * den, h.y + 0.6 * den], r.tag, {
          h: 2.4,
          b: 1,
          al: 'l',
          ly: 'TEXT'
        })
      );
  });
  const bb = [
    [-16 * den, -17 * den],
    [W + 24 * den, top + 12 * den]
  ];
  return { E, bb, rows, on, fe, gv };
}
/* small HTML block for the guide: drawing + hole table + notes */
function mdSVG(V, den, maxW) {
  const [x0, y0] = V.bb[0],
    [x1, y1] = V.bb[1],
    w = x1 - x0,
    h = y1 - y0,
    F = y => -y;
  let o = `<svg viewBox="${x0} ${-y1} ${w} ${h}" class="mdsvg" style="max-width:${maxW || 420}px" role="img" aria-label="Machining drawing">`;
  const sw = { thick: 0.5, med: 0.3, thin: 0.18, xthin: 0.12 };
  V.E.forEach(e => {
    if (e.t === 'pg') {
      const pts = e.p.map(([x, y]) => `${x.toFixed(1)},${F(y).toFixed(1)}`).join(' ');
      const col = /EDGE_BAND/.test(e.ly)
        ? '#1D1D1F'
        : e.ly === 'GROOVE'
          ? '#3446D6'
          : e.ly === 'DIMENSIONS'
            ? '#3446D6'
            : '#1D1D1F';
      o += e.c
        ? `<polygon points="${pts}" fill="${e.f == null ? 'none' : `rgb(${Math.round(e.f * 255)},${Math.round(e.f * 255)},${Math.round(e.f * 255)})`}" stroke="${col}" stroke-width="${(sw[e.w] || 0.18) * den}" ${e.d ? `stroke-dasharray="${2 * den} ${1.2 * den}"` : ''}/>`
        : `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="${(sw[e.w] || 0.18) * den}" ${e.d ? `stroke-dasharray="${2 * den} ${1.2 * den}"` : ''}/>`;
    } else if (e.t === 'tx') {
      const fs = (e.h / 0.72) * den,
        anc = e.al === 'l' ? 'start' : e.al === 'r' ? 'end' : 'middle';
      o += `<text x="${e.p[0].toFixed(1)}" y="${F(e.p[1]).toFixed(1)}" font-size="${fs.toFixed(1)}" text-anchor="${anc}" ${e.b ? 'font-weight="700"' : ''} fill="${e.ly === 'DIMENSIONS' ? '#3446D6' : '#1D1D1F'}" font-family="IBM Plex Mono,Menlo,monospace" ${e.r ? `transform="rotate(${-e.r} ${e.p[0].toFixed(1)} ${F(e.p[1]).toFixed(1)})"` : ''}>${esc(e.s)}</text>`;
    }
  });
  return o + '</svg>';
}
function mdDen(p, aw, ah) {
  const w = p.w + 40 * 10,
    h = p.h + 26 * 10;
  for (const d of TD_SCALES) if (p.w / d + 40 <= aw && p.h / d + 26 <= ah) return d;
  return 100;
}
function mdBlock(p, side) {
  const den = mdDen(p, 110, 150),
    V = mdPart(p, den),
    M = (MATS[p.matType] || {}).name || p.matType,
    F_ = (FIN[p.fin] || {}).name || p.fin;
  const notes = (p.notes || []).filter(t => !/^Drilling \(see/.test(t));
  return `<div class="mdblk"><div class="mdh"><b>${p.id} · ${esc(p.type)}</b><span>${f0(p.L)} × ${f0(p.Wd)} × ${p.t} mm · ${esc(M)} · ${esc(F_)}${p.qty > 1 ? ` · ${p.qty}×` : ''}</span></div>
    <div class="mdbody"><div class="mdpic">${mdSVG(V, den, side ? 260 : 420)}</div><div class="mdinfo">
    ${V.rows.length ? `<table class="mdt"><thead><tr><th></th><th>Hole</th><th>Where (mm from 0)</th></tr></thead><tbody>${V.rows.map(r => `<tr><td><b>${r.tag}</b></td><td>${esc(r.what)}<small>${r.n}× · ${esc(r.face)}</small></td><td>${r.where.map(esc).join('<br>')}</td></tr>`).join('')}</tbody></table>` : '<p class="hintp" style="margin:0">No holes in this part.</p>'}
    ${(() => {
      const cr = mdCutRows(p);
      return cr.length
        ? `<table class="mdt"><thead><tr><th>Cut-out</th><th>Where (mm from 0)</th></tr></thead><tbody>${cr.map(r => `<tr><td>${esc(r.what)}<small>${r.n}× · saw just inside the line, then sand or rout to it</small></td><td>${r.where.map(esc).join('<br>')}</td></tr>`).join('')}</tbody></table>`
        : '';
    })()}
    <p class="mdl"><b>Edges:</b> ${esc(bandWords(p, bandSides(p)))}${V.fe ? ` · front edge marked` : ''}${grainMatters(p) ? ` · grain along the ${f0(p.L)} side` : ''}${V.gv ? ` · groove ${V.gv.w} wide × ${V.gv.d} deep, ${V.gv.o} in from the back edge (blue)` : ''}</p>
    ${notes.length ? `<ul class="mdn">${notes.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div></div></div>`;
}
/* PDF: one part per A4 page (portrait), vector */
async function mdExportPDF() {
  toast('Drawing every part…');
  await new Promise(r => setTimeout(r, 30));
  const gs = groupsCache || (groupsCache = groupPanels(bgeo()));
  if (!gs.length) {
    toast('There are no parts');
    return;
  }
  const keep = TD.paper;
  TD.paper = 'A4';
  const PW = 210,
    PH = 297,
    M = 10,
    TB = 16,
    meta = { name: curName(), date: new Date().toLocaleDateString(tr('@date')) },
    pages = [];
  gs.forEach((p, i) => {
    const R = tdOps();
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
    R.tx(M + 2.5, M + TB - 5, 'Fitted by BRUIS', 2.8, 'l', 0, 1);
    R.tx(M + 2.5, M + 3.6, `${meta.name} · ${meta.date}`, 2.2, 'l');
    R.tx(PW / 2, M + TB - 5.4, `${p.id} · ${p.type}`, 3.2, 'c', 0, 1);
    R.tx(
      PW / 2,
      M + 3.6,
      `${f0(p.L)} × ${f0(p.Wd)} × ${p.t} mm · ${(MATS[p.matType] || {}).short || ''} · ${(FIN[p.fin] || {}).name || ''} · ${p.qty}×`,
      2.4,
      'c'
    );
    R.tx(PW - M - 2.5, M + TB - 5, `Part ${i + 1} / ${gs.length}`, 2.2, 'r');
    const aw = PW - 2 * M - 8,
      ah = 150,
      den = mdDen(p, aw - 40, ah - 26),
      V = mdPart(p, den),
      w = (V.bb[1][0] - V.bb[0][0]) / den,
      h = (V.bb[1][1] - V.bb[0][1]) / den,
      x0 = M + 4 + (aw - w) / 2,
      y0 = PH - M - 6 - h;
    tdRenderView(R, V, den, x0, Math.max(y0, PH - M - 6 - ah));
    R.tx(PW - M - 4, PH - M - 5, `1:${den} · all sizes in mm from 0`, 2.2, 'r');
    let y = Math.min(y0, PH - M - 6 - ah) - 6;
    const line = (t, b, sz) => {
      if (y < M + TB + 6) return;
      R.tx(M + 4, y, t, sz || 2.3, 'l', 0, b);
      y -= (sz || 2.3) * 1.6;
    };
    const rows = V.rows;
    if (rows.length) {
      line('Holes', 1, 2.8);
      rows.forEach(r => {
        line(`${r.tag}  ${r.what} · ${r.n}× · ${r.face}`, 1);
        r.where.forEach(t => {
          const parts = t.match(/.{1,110}(,|$)/g) || [t];
          parts.forEach(s => line('     ' + s.trim()));
        });
      });
    }
    const cuts = mdCutRows(p);
    if (cuts.length) {
      line('');
      line('Cut-outs (saw just inside the line, then sand or rout to it)', 1, 2.8);
      cuts.forEach(r => {
        line(`${r.what} · ${r.n}×`, 1);
        const parts = r.where.join(' · ').match(/.{1,110}( · |$)/g) || [];
        parts.forEach(s_ => line('     ' + s_.trim()));
      });
    }
    line('');
    line('Edges and finishing', 1, 2.8);
    line(bandWords(p, bandSides(p)) + (grainMatters(p) ? ` · grain along the ${f0(p.L)} side` : ' · no grain'));
    if (V.gv) line(`Groove ${V.gv.w} wide × ${V.gv.d} deep, ${V.gv.o} mm in from the back edge (dashed)`);
    (p.notes || [])
      .filter(t => !/^Drilling \(see/.test(t))
      .forEach(t => {
        (t.match(/.{1,120}(\s|$)/g) || [t]).forEach((s, j) => line((j ? '   ' : '• ') + s.trim()));
      });
    pages.push({ w: PW * TD_K, h: PH * TD_K, ops: R.o.join('\n') });
  });
  TD.paper = keep;
  saveFile(`${slugOf(meta.name)}-machining-drawings.pdf`, pdfVec(pages), 'Machining drawings');
}
