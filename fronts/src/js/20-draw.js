/* ==== 20-draw.js ====
   The picture: the cabinets seen from the front with the new fronts in their style, material, colour and
   handles. Millimetres in, SVG out (y flipped so the floor is at the bottom). Tap a door to swap its hinge side.
*/
function faceColour() {
  const m = MATS[S.mat];
  if (m.paint) return (RAL[S.ral] || RAL['9010']).hex;
  if (m.lino) return (LINO.find(l => l[0] === S.lino) || LINO[0])[2];
  return m.wood;
}
function shade(hex, k) {
  // k < 0 darker, k > 0 lighter
  const n = parseInt(hex.slice(1), 16),
    ch = s => Math.max(0, Math.min(255, Math.round(k < 0 ? s * (1 + k) : s + (255 - s) * k)));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => ch(v).toString(16).padStart(2, '0')).join('');
}
function defsSVG() {
  const base = faceColour(),
    m = MATS[S.mat],
    p = S.flute.pitch;
  let d = `<linearGradient id="flg" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity=".28"/><stop offset=".7" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
  <pattern id="flute" width="${p}" height="40" patternUnits="userSpaceOnUse"${S.flute.dir === 'h' ? ' patternTransform="rotate(90)"' : ''}><rect width="${p}" height="40" fill="url(#flg)"/></pattern>
  <linearGradient id="slg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".9" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
  <pattern id="slat" width="48" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="url(#slg)"/><rect x="40" width="8" height="40" fill="#000" fill-opacity=".55"/></pattern>`;
  if (m.wood)
    d += `<pattern id="grain" width="90" height="900" patternUnits="userSpaceOnUse"${S.style === 'fluted' && S.flute.dir === 'h' ? ' patternTransform="rotate(90)"' : ''}><rect width="90" height="900" fill="${base}"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${6 + i * 10 + (i % 3)} 0 C ${12 + i * 10} 300, ${i * 10} 600, ${8 + i * 10} 900" stroke="${m.grain}" stroke-opacity="${0.18 + (i % 3) * 0.08}" stroke-width="${1 + (i % 2)}" fill="none"/>`).join('')}</pattern>`;
  if (m.lino)
    d += `<pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${base}"/><circle cx="2" cy="3" r=".7" fill="#000" fill-opacity=".06"/></pattern>`;
  return `<defs>${d}</defs>`;
}
function frontSVG(f, Y) {
  const x = f.x,
    y = Y(f.y + f.h),
    w = f.w,
    h = f.h,
    base = faceColour(),
    fill = MATS[S.mat].wood || MATS[S.mat].lino ? 'url(#grain)' : base,
    dark = shade(base, -0.35),
    light = shade(base, 0.35),
    st = S.style;
  let o = `<g class="front${f.hinge ? ' hd' : ''}" data-f="${f.id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${dark}" stroke-opacity=".55" stroke-width="2"/>`;
  if (st === 'fluted') o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#flute)"/>`;
  if (st === 'slats') o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#slat)"/>`;
  if (st === 'shaker') {
    const i = Math.min(70, w * 0.16, h * 0.16);
    o += `<rect x="${x + i}" y="${y + i}" width="${w - 2 * i}" height="${h - 2 * i}" fill="#000" fill-opacity=".05" stroke="${dark}" stroke-opacity=".6" stroke-width="3"/><path d="M${x + i} ${y + h - i} V${y + i} H${x + w - i}" stroke="#000" stroke-opacity=".18" stroke-width="6" fill="none"/><path d="M${x + i} ${y + h - i} H${x + w - i} V${y + i}" stroke="${light}" stroke-opacity=".7" stroke-width="3" fill="none"/>`;
  }
  if (st === 'arch') {
    const i = Math.min(60, w * 0.14),
      iw = w - 2 * i,
      r = iw / 2,
      top = y + i + Math.min(r, (h - 2 * i) / 2);
    const path = `M${x + i} ${y + h - i} V${top} A${r} ${Math.min(r, (h - 2 * i) / 2)} 0 0 1 ${x + w - i} ${top} V${y + h - i} Z`;
    o += `<path d="${path}" fill="#000" fill-opacity=".05" stroke="${dark}" stroke-opacity=".65" stroke-width="5"/><path d="${path}" fill="none" stroke="${light}" stroke-opacity=".55" stroke-width="2" transform="translate(3 3)"/>`;
  }
  if (st === 'grid') {
    const i = 50,
      nx = Math.max(1, Math.round((w - 2 * i) / 130)),
      ny = Math.max(1, Math.round((h - 2 * i) / 130)),
      cw = (w - 2 * i) / nx,
      ch = (h - 2 * i) / ny;
    let g = '';
    for (let a = 0; a <= nx; a++) g += `M${x + i + a * cw} ${y + i} V${y + h - i}`;
    for (let b = 0; b <= ny; b++) g += `M${x + i} ${y + i + b * ch} H${x + w - i}`;
    o += `<path d="${g}" stroke="${dark}" stroke-opacity=".6" stroke-width="4" fill="none"/><path d="${g}" stroke="${light}" stroke-opacity=".5" stroke-width="1.5" fill="none" transform="translate(2.5 2.5)"/>`;
  }
  // the door opens away from its hinge: a light dashed V pointing at the hinge side
  if (f.hinge) {
    const hx = f.hinge === 'L' ? x : x + w,
      ox = f.hinge === 'L' ? x + w : x;
    o += `<path class="swing" d="M${ox} ${y} L${hx} ${y + h / 2} L${ox} ${y + h}" fill="none" stroke="${dark}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="14 10"/>`;
  }
  o += handleSVG(f, Y, dark);
  return o + '</g>';
}
function handleSVG(f, Y, dark) {
  const hd = S.handle;
  if (hd === 'push') return '';
  const col = S.hfin === 'match' ? shade(faceColour(), -0.2) : HFIN[S.hfin].hex,
    x0 = f.x,
    x1 = f.x + f.w,
    yT = Y(f.y + f.h),
    yB = Y(f.y);
  let cx, cy, vert;
  if (f.kind === 'drawer') {
    cx = (x0 + x1) / 2;
    cy = f.h > 300 ? yT + 70 : (yT + yB) / 2;
    vert = false;
  } else {
    cx = f.hinge === 'L' ? x1 - 45 : x0 + 45;
    // where a hand goes: tall doors at about 1 m from the floor, wall cabinets low, base cabinets high
    const hy = f.h > 1200 ? 1050 : null;
    const isWall = (S.cabs.find(c => c.id === f.cab) || {}).kind === 'wall';
    cy = hy != null ? Y(Math.max(f.y + 120, Math.min(f.y + f.h - 120, hy))) : isWall ? yB - 90 : yT + 90;
    vert = true;
  }
  if (hd === 'knob')
    return `<circle cx="${cx}" cy="${cy}" r="16" fill="${col}" stroke="#000" stroke-opacity=".25" stroke-width="2"/><circle cx="${cx - 4}" cy="${cy - 4}" r="5" fill="#fff" fill-opacity=".35"/>`;
  if (hd === 'bar')
    return vert
      ? `<rect x="${cx - 6}" y="${cy - 80}" width="12" height="160" rx="6" fill="${col}" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`
      : `<rect x="${cx - 80}" y="${cy - 6}" width="160" height="12" rx="6" fill="${col}" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`;
  if (hd === 'grip') {
    if (f.kind === 'drawer')
      return `<path d="M${cx - 45} ${yT} A45 30 0 0 0 ${cx + 45} ${yT} Z" fill="#000" fill-opacity=".55"/>`;
    const ex = f.hinge === 'L' ? x1 : x0,
      s = f.hinge === 'L' ? 0 : 1;
    return `<path d="M${ex} ${cy - 55} A30 55 0 0 ${s} ${ex} ${cy + 55} Z" fill="#000" fill-opacity=".55"/>`;
  }
  if (hd === 'tab') {
    if (f.kind === 'drawer') return `<rect x="${cx - 22}" y="${yT - 18}" width="44" height="40" rx="6" fill="${col}"/>`;
    const ex = f.hinge === 'L' ? x1 - 10 : x0 - 20;
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
  // floor
  s += `<rect x="${-pad}" y="${Y(0)}" width="${W + 2 * pad}" height="40" fill="var(--wall)"/><line x1="${-pad}" x2="${W + pad}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--ink2)" stroke-width="3"/>`;
  // carcasses (white IKEA boxes behind the fronts)
  L.cabs.forEach(p => {
    s += `<rect x="${p.x}" y="${Y(p.y + p.h)}" width="${p.w}" height="${p.h}" fill="#f4f4f1" stroke="#c9cac5" stroke-width="3"/>`;
    if (p.c.layout === 'open' || p.c.sys === 'metod') {
      // shelves when there is no front
      if (p.c.layout === 'open')
        for (let k = 1; k < Math.round(p.h / 350); k++)
          s += `<line x1="${p.x + 18}" x2="${p.x + p.w - 18}" y1="${Y(p.y + (k * p.h) / Math.round(p.h / 350))}" y2="${Y(p.y + (k * p.h) / Math.round(p.h / 350))}" stroke="#c9cac5" stroke-width="10"/>`;
    }
  });
  if (L.plinth && S.sys === 'metod') {
    const bw = Math.max(0, ...L.cabs.filter(p => p.c.kind !== 'wall').map(p => p.x + p.w));
    s += `<rect x="0" y="${Y(L.plinth)}" width="${bw}" height="${L.plinth - 10}" fill="${shade(faceColour(), -0.25)}"/>`;
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
  L.fronts.forEach(f => (s += frontSVG(f, Y)));
  // widths under the picture
  L.cabs
    .filter(p => p.c.kind !== 'wall')
    .forEach(p => {
      const yy = Y(0) + 110;
      s += `<line x1="${p.x + 8}" x2="${p.x + p.w - 8}" y1="${yy}" y2="${yy}" stroke="var(--ink2)" stroke-width="3"/><line x1="${p.x + 8}" x2="${p.x + 8}" y1="${yy - 18}" y2="${yy + 18}" stroke="var(--ink2)" stroke-width="3"/><line x1="${p.x + p.w - 8}" x2="${p.x + p.w - 8}" y1="${yy - 18}" y2="${yy + 18}" stroke="var(--ink2)" stroke-width="3"/><text x="${p.x + p.w / 2}" y="${yy - 26}" text-anchor="middle" class="dim">${p.c.w}</text>`;
    });
  s += '</svg>';
  document.getElementById('pic').innerHTML = s;
}

/* small pictures of the styles for the style cards */
function styleThumb(k) {
  const was = S.style,
    wasH = S.handle;
  S.style = k;
  S.handle = 'push';
  const f = { id: 't', cab: 't', kind: 'door', w: 300, h: 420, x: 10, y: 0, hinge: null };
  const svg = `<svg viewBox="0 0 320 440" aria-hidden="true">${defsSVG()
    .replace(/id="(\w+)"/g, 'id="$1_' + k + '"')
    .replace(/url\(#(\w+)\)/g, 'url(#$1_' + k + ')')}${frontSVG(f, y => 430 - y)
    .replace(/url\(#(\w+)\)/g, 'url(#$1_' + k + ')')
    .replace(/data-f="t"/, '')}</svg>`;
  S.style = was;
  S.handle = wasH;
  return svg;
}
