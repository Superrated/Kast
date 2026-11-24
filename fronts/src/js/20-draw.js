/* ==== 20-draw.js ====
   The flat picture: the cabinets seen from the front with the new fronts, each in its own look (style,
   material, colour) and with its handle. Millimetres in, SVG out (y flipped so the floor is at the bottom).
   Tap a front to select it. 25-3d.js draws the same fronts in 3D.
*/
function faceHex(lk) {
  const m = MATS[lk.mat];
  if (m.paint) return colHex(lk.col);
  if (m.glass) return '#cfdcd8';
  return woodCol(lk.mat, lk.oil).wood;
}
function shade(hex, k) {
  // k < 0 darker, k > 0 lighter
  const n = parseInt(hex.slice(1), 16),
    ch = s => Math.max(0, Math.min(255, Math.round(k < 0 ? s * (1 + k) : s + (255 - s) * k)));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => ch(v).toString(16).padStart(2, '0')).join('');
}
function defsSVG(sfx) {
  const x = sfx || '',
    p = S.flute.pitch,
    rot = S.flute.dir === 'h' ? ' patternTransform="rotate(90)"' : '';
  let d = `<linearGradient id="flg${x}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".24"/><stop offset=".35" stop-color="#fff" stop-opacity=".3"/><stop offset=".7" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>
  <pattern id="flute${x}" width="${p}" height="40" patternUnits="userSpaceOnUse"${rot}><rect width="${p}" height="40" fill="url(#flg${x})"/></pattern>
 <pattern id="groove${x}" width="${S.flute.gpitch}" height="40" patternUnits="userSpaceOnUse"${rot}><rect x="${S.flute.gpitch / 2 - 2}" width="2.5" height="40" fill="#000" fill-opacity=".38"/><rect x="${S.flute.gpitch / 2 + 0.5}" width="2" height="40" fill="#fff" fill-opacity=".35"/></pattern>
  <linearGradient id="glass${x}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9f1ee"/><stop offset=".55" stop-color="#c9d8d3"/><stop offset="1" stop-color="#b3c6c0"/></linearGradient>`;
  const tints = [];
  Object.entries(MATS).forEach(([k, m0]) => {
    if (!m0.wood) return;
    (m0.oil ? Object.keys(OILS) : ['pure']).forEach(oil =>
      tints.push([k + (oil === 'pure' ? '' : oil), Object.assign({}, m0, woodCol(k, oil))])
    );
  });
  tints.forEach(([k, m]) => {
    if (m.flame) {
      let arcs = '';
      // two flames per tile; the second is drawn again one tile higher so it runs on without a seam
      [
        [70, 0],
        [210, 260],
        [210, -260]
      ].forEach(([cx, oy]) => {
        for (let j = 0; j < 7; j++) {
          const hw = 16 + j * 12,
            top = oy + 40 + j * 28;
          arcs += `<path d="M${cx - hw} ${oy + 560} C ${cx - hw} ${top + 140}, ${cx - hw * 0.62} ${top}, ${cx} ${top} C ${cx + hw * 0.62} ${top}, ${cx + hw} ${top + 140}, ${cx + hw} ${oy + 560}" stroke="${m.grain}" stroke-opacity="${0.2 + (j % 3) * 0.08}" stroke-width="${2 + (j % 2) * 2.5}" fill="none"/>`;
        }
      });
      for (let i = 0; i < 9; i++)
        arcs += `<line x1="${(i * 31) % 280}" x2="${(i * 31 + 4) % 280}" y1="0" y2="520" stroke="${m.grain}" stroke-opacity=".08" stroke-width="${1 + (i % 2)}"/>`;
      d += `<pattern id="gr_${k}${x}" width="280" height="520" patternUnits="userSpaceOnUse"><rect width="280" height="520" fill="${m.wood}"/>${arcs}</pattern>`;
      return;
    }
    if (m.raw && !m.grain) {
      d += `<pattern id="gr_${k}${x}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${m.wood}"/><circle cx="3" cy="4" r=".9" fill="#000" fill-opacity=".08"/><circle cx="10" cy="10" r=".8" fill="#fff" fill-opacity=".12"/></pattern>`;
      return;
    }
    d += `<pattern id="gr_${k}${x}" width="90" height="900" patternUnits="userSpaceOnUse"><rect width="90" height="900" fill="${m.wood}"/>${Array.from(
      { length: 9 },
      (_, i) =>
        `<path d="M${6 + i * 10 + (i % 3)} 0 C ${12 + i * 10} 300, ${i * 10} 600, ${8 + i * 10} 900" stroke="${m.grain}" stroke-opacity="${(m.ply ? 0.1 : 0.18) + (i % 3) * 0.07}" stroke-width="${1 + (i % 2)}" fill="none"/>`
    ).join('')}</pattern>`;
  });
  return `<defs>${d}</defs>`;
}
function frontSVG(f, Y, sfx) {
  const x_ = sfx || '',
    lk = lookOf(f),
    m = MATS[lk.mat],
    x = f.x,
    y = Y(f.y + f.h),
    w = f.w,
    h = f.h,
    base = faceHex(lk),
    dark = shade(base, -0.38),
    sel = S.sel === f.id;
  let o = `<g class="front${sel ? ' sel' : ''}" data-f="${f.id}">`;
  if (m.glass) {
    // fluted glass in a slim frame; the white inside of the cabinet shows through
    const fr = 22,
      fc = GFRAME[S.gframe].hex;
    o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fc}"/><rect x="${x + fr}" y="${y + fr}" width="${w - 2 * fr}" height="${h - 2 * fr}" fill="url(#glass${x_})" fill-opacity=".92"/><rect x="${x + fr}" y="${y + fr}" width="${w - 2 * fr}" height="${h - 2 * fr}" fill="url(#flute${x_})"/>`;
  } else {
    const fill = m.wood ? `url(#gr_${lk.mat}${m.oil && lk.oil !== 'pure' ? lk.oil : ''}${x_})` : base;
    o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${dark}" stroke-opacity=".5" stroke-width="2"/>`;
    if (S.edge === 'chamfer')
      o += `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`;
    if (lk.style === 'fluted') o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#flute${x_})"/>`;
    if (lk.style === 'grooves') o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#groove${x_})"/>`;
    // plywood shows its layers on the edge
    if (m.ply)
      o += `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" fill="none" stroke="${shade(woodCol(lk.mat, lk.oil).wood, -0.3)}" stroke-opacity=".6" stroke-width="3" stroke-dasharray="6 3"/>`;
  }
  // a door opens away from its hinge: a light dashed V pointing at the hinge side
  if (f.hinge) {
    const hx = f.hinge === 'L' ? x : x + w,
      ox = f.hinge === 'L' ? x + w : x;
    o += `<path d="M${ox} ${y} L${hx} ${y + h / 2} L${ox} ${y + h}" fill="none" stroke="${dark}" stroke-opacity=".3" stroke-width="2" stroke-dasharray="14 10"/>`;
  }
  o += handleSVG(f, Y, lk);
  if (sel)
    o += `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="none" stroke="var(--accent)" stroke-width="10"/>`;
  return o + '</g>';
}
/* where the handle goes (mm, in the picture): doors on the side that opens, drawers in the middle at the top */
function handlePos(f) {
  if (f.kind === 'drawer') return { x: f.x + f.w / 2, y: f.h > 300 ? f.y + f.h - 70 : f.y + f.h / 2, vert: false };
  const x = f.hinge === 'L' ? f.x + f.w - 45 : f.x + 45;
  // where a hand goes: tall doors at about 1 m from the floor, wall cabinets low, base cabinets high
  let y;
  if (f.h > 1200) y = Math.max(f.y + 120, Math.min(f.y + f.h - 120, 1050));
  else y = f.ckind === 'wall' ? f.y + 90 : f.y + f.h - 90;
  return { x, y, vert: true };
}
function handleHex(lk) {
  return S.hfin === 'match' ? shade(faceHex(lk), -0.2) : HFIN[S.hfin].hex;
}
function handleSVG(f, Y, lk) {
  const hd = S.handle;
  if (hd === 'push') return '';
  const col = handleHex(lk),
    P = handlePos(f),
    cx = P.x,
    cy = Y(P.y);
  if (hd === 'knob')
    return `<circle cx="${cx}" cy="${cy}" r="16" fill="${col}" stroke="#000" stroke-opacity=".25" stroke-width="2"/><circle cx="${cx - 4}" cy="${cy - 4}" r="5" fill="#fff" fill-opacity=".35"/>`;
  if (hd === 'bar')
    return P.vert
      ? `<rect x="${cx - 6}" y="${cy - 80}" width="12" height="160" rx="6" fill="${col}" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`
      : `<rect x="${cx - 80}" y="${cy - 6}" width="160" height="12" rx="6" fill="${col}" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`;
  const yT = Y(f.y + f.h);
  if (hd === 'grip') {
    if (f.kind === 'drawer')
      return `<path d="M${cx - 45} ${yT} A45 30 0 0 0 ${cx + 45} ${yT} Z" fill="#000" fill-opacity=".55"/>`;
    const ex = f.hinge === 'L' ? f.x + f.w : f.x,
      s = f.hinge === 'L' ? 0 : 1;
    return `<path d="M${ex} ${cy - 55} A30 55 0 0 ${s} ${ex} ${cy + 55} Z" fill="#000" fill-opacity=".55"/>`;
  }
  if (hd === 'tab') {
    if (f.kind === 'drawer') return `<rect x="${cx - 22}" y="${yT - 18}" width="44" height="40" rx="6" fill="${col}"/>`;
    const ex = f.hinge === 'L' ? f.x + f.w - 10 : f.x - 20;
    return `<rect x="${ex}" y="${cy - 22}" width="30" height="44" rx="6" fill="${col}"/>`;
  }
  return '';
}
function drawPic() {
  const L = layout(),
    pad = 140,
    top = Math.max(L.H, 900) + 120,
    Y = y => top - y,
    W = L.W;
  let s = `<svg viewBox="${-pad} ${-20} ${W + 2 * pad} ${top + 220}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your cabinets with the new fronts">${defsSVG()}`;
  s += `<rect x="${-pad}" y="${Y(0)}" width="${W + 2 * pad}" height="40" fill="var(--wall)"/><line x1="${-pad}" x2="${W + pad}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--ink2)" stroke-width="3"/>`;
  // the white IKEA boxes behind the fronts (shelves when there is no front)
  L.cabs.forEach(p => {
    s += `<rect x="${p.x}" y="${Y(p.y + p.h)}" width="${p.w}" height="${p.h}" fill="#f4f4f1" stroke="#c9cac5" stroke-width="3"/>`;
    if (p.c.layout === 'open') {
      const n = Math.max(2, Math.round(p.h / 350));
      for (let k = 1; k < n; k++)
        s += `<line x1="${p.x + 18}" x2="${p.x + p.w - 18}" y1="${Y(p.y + (k * p.h) / n)}" y2="${Y(p.y + (k * p.h) / n)}" stroke="#c9cac5" stroke-width="10"/>`;
    }
  });
  if (L.plinth && S.sys === 'metod') {
    const bw = Math.max(0, ...L.cabs.filter(p => p.c.kind !== 'wall').map(p => p.x + p.w));
    s += `<rect x="0" y="${Y(L.plinth)}" width="${bw}" height="${L.plinth - 10}" fill="${shade(faceHex(lookOf(null)), -0.3)}"/>`;
  }
  if (S.sys === 'besta')
    L.cabs.forEach(p => {
      s += `<rect x="${p.x + 40}" y="${Y(L.plinth)}" width="24" height="${L.plinth}" fill="#9a9a95"/><rect x="${p.x + p.w - 64}" y="${Y(L.plinth)}" width="24" height="${L.plinth}" fill="#9a9a95"/>`;
    });
  if (L.worktop) {
    const bases = L.cabs.filter(p => p.c.kind === 'base');
    if (bases.length) {
      const a = Math.min(...bases.map(p => p.x)),
        b = Math.max(...bases.map(p => p.x + p.w));
      s += `<rect x="${a - 10}" y="${Y(940)}" width="${b - a + 20}" height="40" fill="#cfc8bb" stroke="#a9a293" stroke-width="2"/>`;
    }
  }
  // side panels: from the front you see their 19 mm edge, in the look of the fronts
  L.sides.forEach(sd => {
    const lk = sideLook(),
      m = MATS[lk.mat],
      fill = m.wood ? woodCol(lk.mat, lk.oil).wood : faceHex(lk);
    s += `<rect class="side" x="${sd.x}" y="${Y(sd.y + sd.h)}" width="${SIDE_T}" height="${sd.h}" fill="${fill}" stroke="${shade(fill, -0.35)}" stroke-width="2"/>`;
  });
  L.fronts.forEach(f => (s += frontSVG(f, Y)));
  L.cabs
    .filter(p => p.c.kind !== 'wall')
    .forEach(p => {
      const yy = Y(0) + 110;
      s += `<line x1="${p.x + 8}" x2="${p.x + p.w - 8}" y1="${yy}" y2="${yy}" stroke="var(--ink2)" stroke-width="3"/><line x1="${p.x + 8}" x2="${p.x + 8}" y1="${yy - 18}" y2="${yy + 18}" stroke="var(--ink2)" stroke-width="3"/><line x1="${p.x + p.w - 8}" x2="${p.x + p.w - 8}" y1="${yy - 18}" y2="${yy + 18}" stroke="var(--ink2)" stroke-width="3"/><text x="${p.x + p.w / 2}" y="${yy - 26}" text-anchor="middle" class="dim">${p.c.w}</text>`;
    });
  s += '</svg>';
  document.getElementById('pic').innerHTML = s;
}

/* a small picture of one look, for the style and material cards */
function lookThumb(style, mat, col, key, oil) {
  const was = { fx: S.fx, style: S.style, mat: S.mat, col: S.col, oil: S.oil, handle: S.handle, sel: S.sel };
  Object.assign(S, { fx: {}, style, mat, col, oil: oil || S.oil, handle: 'push', sel: null });
  const f = { id: 'thumb', cab: 't', kind: 'door', w: 300, h: 420, x: 10, y: 0, hinge: null },
    k = '_' + key;
  const svg = `<svg viewBox="0 0 320 440" aria-hidden="true">${defsSVG(k)}${frontSVG(f, y => 430 - y, k).replace('data-f="thumb"', '')}</svg>`;
  Object.assign(S, was);
  return svg;
}

/* a small picture of a whole design (a preset or a demo): cabinets, side panels and fronts in its own look.
   st holds the parts of the state that differ (sys, cabs, fx, look …); pictures are kept once made. */
const THUMBS = new Map();
function designThumb(key, st) {
  const look = [
    st.style || S.style,
    st.mat || S.mat,
    st.col || S.col,
    st.oil || S.oil,
    st.handle || S.handle,
    st.hfin || S.hfin,
    st.sides || S.sides,
    st.gframe || S.gframe
  ];
  const k = key + '|' + look.join('|');
  if (THUMBS.has(k)) return THUMBS.get(k);
  const keep = S;
  let svg = '';
  S = Object.assign({}, keep, { fx: {}, sel: null, flip: {} }, st);
  try {
    const L = layout(),
      sfx = '_t' + THUMBS.size,
      top = L.H + 30,
      Y = y => top - y,
      x0 = -70,
      w = L.W + 140;
    svg = `<svg viewBox="${x0} 0 ${w} ${top + 40}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${defsSVG(sfx)}`;
    svg += `<rect x="${x0}" y="${Y(0)}" width="${w}" height="40" fill="var(--floor)"/>`;
    L.cabs.forEach(
      p =>
        (svg += `<rect x="${p.x}" y="${Y(p.y + p.h)}" width="${p.w}" height="${p.h}" fill="#f4f4f1" stroke="#c9cac5" stroke-width="6"/>`)
    );
    if (S.sys === 'metod' && L.plinth) {
      const bw = Math.max(0, ...L.cabs.filter(p => p.c.kind !== 'wall').map(p => p.x + p.w));
      if (bw)
        svg += `<rect x="0" y="${Y(L.plinth)}" width="${bw}" height="${L.plinth - 10}" fill="${shade(faceHex(lookOf(null)), -0.3)}"/>`;
    }
    L.sides.forEach(sd => {
      const lk = sideLook(),
        fill = MATS[lk.mat].wood ? woodCol(lk.mat, lk.oil).wood : faceHex(lk);
      svg += `<rect x="${sd.x - 12}" y="${Y(sd.y + sd.h)}" width="${SIDE_T + 24}" height="${sd.h}" fill="${fill}"/>`;
    });
    L.fronts.forEach(
      f =>
        (svg += frontSVG(f, Y, sfx)
          .replace(/ data-f="[^"]*"/, '')
          .replace('class="front', 'class="tf'))
    );
    svg += '</svg>';
  } catch (e) {
    svg = '';
  } finally {
    S = keep;
  }
  THUMBS.set(k, svg);
  return svg;
}
