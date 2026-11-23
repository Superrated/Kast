/* ==== 70-build-guide.js ====
   The build guide (IKEA-style steps) with Bolt & Pip.
*/
/* ===== Build guide (IKEA-style step-by-step) ===== */
const GK = '#1D1D1F';
function obl(x, y, d) {
  return [x + d * 0.42, -(y + d * 0.32)];
}
function gScene(items, { w = 340, pad = 26 } = {}) {
  const pts = [];
  items.forEach(it => (it.pts || []).forEach(p => pts.push(p)));
  if (!pts.length) return '';
  const xs = pts.map(p => p[0]),
    ys = pts.map(p => p[1]),
    x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys),
    sc = (w - 2 * pad) / Math.max(1, x1 - x0),
    h = Math.max(120, (y1 - y0) * sc + 2 * pad);
  const T = p => [(p[0] - x0) * sc + pad, (p[1] - y0) * sc + pad],
    P = a =>
      a
        .map(p =>
          T(p)
            .map(v => v.toFixed(1))
            .join(',')
        )
        .join(' ');
  let s = `<svg viewBox="0 0 ${w} ${h.toFixed(0)}" class="gsvg" role="img"><defs><marker id="gar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${GK}"/></marker></defs>`;
  items.forEach(it => {
    if (it.poly)
      s += `<polygon points="${P(it.pts)}" fill="${it.fill || '#fff'}" stroke="${it.ghost ? '#C9C9C9' : GK}" stroke-width="${it.sw || 1.6}" stroke-linejoin="round"${it.dash ? ' stroke-dasharray="4 3"' : ''}/>`;
    else if (it.line)
      s += `<polyline points="${P(it.pts)}" fill="none" stroke="${it.col || GK}" stroke-width="${it.sw || 1.6}"${it.arrow ? ' marker-end="url(#gar)"' : ''}${it.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
    else if (it.label) {
      const [x, y] = T(it.pts[0]);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="#fff" stroke="${GK}" stroke-width="1.4"/><text x="${x.toFixed(1)}" y="${(y + 3.8).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="${GK}" font-family="IBM Plex Mono,monospace">${esc(it.label)}</text>`;
    } else if (it.text) {
      const [x, y] = T(it.pts[0]);
      s += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${it.anchor || 'middle'}" font-size="${it.fs || 10}" fill="${GK}" font-family="IBM Plex Mono,monospace">${esc(it.text)}</text>`;
    } else if (it.dot) {
      const [x, y] = T(it.pts[0]);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${it.r || 3}" fill="${it.fill || GK}" stroke="${GK}" stroke-width="1"/>`;
    }
  });
  return s + '</svg>';
}
// a slab: x0..x1, y0..y1, d0..d1, with optional sloped top given by function topAt(x) — returns visible faces in oblique view
function gSlab(x0, x1, y0, y1, d0, d1, o = {}) {
  const f = o.fill || '#fff',
    out = [],
    top = o.top || null;
  const yT = x => (top ? top(x) : y1);
  const front = [obl(x0, y0, d0), obl(x1, y0, d0), obl(x1, yT(x1), d0), obl(x0, yT(x0), d0)];
  const right = [obl(x1, y0, d0), obl(x1, y0, d1), obl(x1, yT(x1), d1), obl(x1, yT(x1), d0)];
  const tp = [obl(x0, yT(x0), d0), obl(x1, yT(x1), d0), obl(x1, yT(x1), d1), obl(x0, yT(x0), d1)];
  out.push({ poly: 1, pts: right, fill: o.shade || '#EDEDED', ghost: o.ghost, dash: o.dash });
  out.push({ poly: 1, pts: tp, fill: o.topFill || '#F6F6F6', ghost: o.ghost, dash: o.dash });
  out.push({ poly: 1, pts: front, fill: f, ghost: o.ghost, dash: o.dash });
  return out;
}
const gArrow = (a, b) => ({ line: 1, arrow: 1, pts: [obl(...a), obl(...b)] });
function gSlab2(x0, x1, yLo, yHi, d0, d1, o = {}) {
  const out = [];
  const front = [obl(x0, yLo(x0), d0), obl(x1, yLo(x1), d0), obl(x1, yHi(x1), d0), obl(x0, yHi(x0), d0)],
    right = [obl(x1, yLo(x1), d0), obl(x1, yLo(x1), d1), obl(x1, yHi(x1), d1), obl(x1, yHi(x1), d0)],
    tp = [obl(x0, yHi(x0), d0), obl(x1, yHi(x1), d0), obl(x1, yHi(x1), d1), obl(x0, yHi(x0), d1)];
  out.push(
    { poly: 1, pts: right, fill: o.shade || '#EDEDED', ghost: o.ghost },
    { poly: 1, pts: tp, fill: o.topFill || '#F6F6F6', ghost: o.ghost },
    { poly: 1, pts: front, fill: o.fill || '#fff', ghost: o.ghost }
  );
  return out;
}
const gLab = (p, t) => ({ label: t, pts: [obl(...p)] });
function inSecLab(sec, i) {
  const t = String(sec).match(/S\d+/g) || [];
  const n = i + 1;
  if (t.includes('S' + n)) return true;
  const m = String(sec).match(/S(\d+)[–-]S(\d+)/);
  return !!(m && n >= +m[1] && n <= +m[2]);
}
const GICON = {
  drill:
    '<path d="M4 9h11l3 2v2l-3 2H9l-1 5H5l1-5H4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M18 12h4" stroke="currentColor" stroke-width="1.5"/>',
  level:
    '<rect x="2" y="9" width="20" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="10.5" width="4" height="3" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>',
  tape: '<circle cx="10" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="12" r="2" fill="currentColor"/><path d="M17 16h5" stroke="currentColor" stroke-width="1.5"/>',
  clamp:
    '<path d="M5 4h10v4M5 4v16h10v-4M15 8v8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 12h8" stroke="currentColor" stroke-width="2"/>',
  saw: '<path d="M3 15l14-8 4 3-14 8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 16l1 2M8 14l1 2M11 12.5l1 2M14 11l1 2" stroke="currentColor" stroke-width="1.1"/>',
  driver:
    '<path d="M12 2v8M9 10h6l-1 11h-4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  pencil:
    '<path d="M4 20l2-6L16 4l4 4L10 18z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  people:
    '<circle cx="8" cy="6" r="2.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 21v-6a4.5 4.5 0 0 1 9 0v6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="16.5" cy="7" r="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M13.5 21v-5.5a3.5 3.5 0 0 1 7 0V21" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  screw:
    '<path d="M8 4h8M12 4v15l-1.5 2M9.5 8l5-1M9.5 11l5-1M9.5 14l5-1" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  hinge:
    '<circle cx="8" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 10h9v4h-9" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  pin: '<path d="M5 12h8M13 9v6l6-3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  bolt: '<path d="M4 12h12M16 8v8M18 9v6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  runner: '<path d="M2 10h20v4H2zM5 12h14" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  bracket:
    '<path d="M5 4v16h14" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="5" cy="9" r="1.2" fill="currentColor"/><circle cx="14" cy="20" r="1.2" fill="currentColor"/>',
  leg: '<path d="M8 3h8l-2 18h-4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  light:
    '<path d="M3 8h18v3H3z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 14l-1 3M12 14v4M18 14l1 3" stroke="currentColor" stroke-width="1.5"/>',
  cam: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.6"/><path d="M15 7.5a6 6 0 0 1 1.5 4.5" stroke="currentColor" stroke-width="1.2" fill="none"/>',
  dowel:
    '<rect x="9" y="3" width="6" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 7h6M9 10h6M9 13h6M9 16h6" stroke="currentColor" stroke-width="1"/>',
  warn: '<path d="M12 3l10 18H2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="18" r="1.1" fill="currentColor"/>'
};
const gi = k => `<svg viewBox="0 0 24 24" class="gico" aria-hidden="true">${GICON[k] || ''}</svg>`;
const FASTEN = {
  minifix: {
    name: 'Minifix cam fittings',
    short: 'Minifix 15',
    side: 'Ø5 × 11 mm for the connecting bolt (screw-in), on the centre line of the shelf panel',
    horiz: 'Ø15 × 12.5 mm cam housing in the face, 34 mm from the end; Ø8 × 34 mm from the end edge for the bolt',
    dowel: true,
    how: 'Screw the bolts into the sides, push dowels into the top/bottom edges, offer the panels up, then turn each cam clockwise until it pulls tight (about ½ turn). Demountable — handy for an attic.'
  },
  confirmat: {
    name: 'Confirmat screws 7 × 50',
    short: 'Confirmat 7×50',
    side: 'Ø7 through the side + Ø10 countersink, on the centre line of the joining panel (9 mm from its face for 18 mm board), 50 mm from the front and back edges and never more than 250 mm apart',
    horiz:
      'Ø5 × 45 mm pilot into the end edge, dead centre of the board thickness — easiest drilled in one go with a stepped Confirmat bit through the side, panels clamped',
    dowel: false,
    how: 'Clamp the panels square (a corner clamp helps), drill each joint in one pass with the stepped Confirmat bit (Ø5 / Ø7 / Ø10) through the side into the edge, and drive the screw with a 4 mm hex bit — snug, not over-tight, or the chipboard strips. Cover caps hide the heads on visible outer sides.'
  },
  screw: {
    name: 'Chipboard screws 4.5 × 50',
    short: 'Screws 4.5×50',
    side: 'Ø4.5 clearance hole + countersink through the side, on the centre line of the joining panel (9 mm from its face for 18 mm board), 50 mm from the front and back edges and never more than 250 mm apart',
    horiz:
      'Ø3 × 40 mm pilot into the end edge, dead centre of the board thickness — never drive a screw into chipboard edge without a pilot',
    dowel: false,
    how: 'The cheapest joint. Clamp the panels square, drill the Ø4.5 clearance hole and countersink through the side, then the Ø3 pilot through it into the edge, and drive a 4.5 × 50 full-thread chipboard screw — snug, not over-tight. A little wood glue in the joint makes it much stiffer. Cover caps hide the heads on visible outer sides.'
  },
  dowel: {
    name: 'Glued beech dowels Ø8 × 35',
    short: 'Dowels Ø8',
    side: 'Ø8 × 12 mm deep',
    horiz: 'Ø8 × 25 mm deep into the end edge',
    dowel: true,
    how: 'Glue the dowels into the edges, glue the holes in the sides and clamp until set (1 h). Invisible and strong, but permanent.'
  }
};

/* ===== Bolt & Pip: two cartoon builders who get it wrong first, so you don't have to ===== */
const GAGS = {
  tools: {
    p: 'plan',
    a: 'Instructions? I never read those.',
    b: 'Bolt. You are holding the plan upside down.',
    tip: 'Read the whole guide once before you start, and lay every tool out first.'
  },
  cutgen: {
    p: 'short',
    a: 'Measure once, cut twice. That is the saying, right?',
    b: 'It is really, really not.',
    tip: 'Measure twice, cut once — and cut on the waste side of the pencil line.'
  },
  sheet: {
    p: 'pile',
    a: 'I cut all the little parts first. They were the fun ones.',
    b: 'And now the big ones do not fit on what is left.',
    tip: 'Follow the numbered cuts: the long cuts across the whole sheet come first.'
  },
  stock: {
    p: 'short',
    a: 'I cut every board exactly to the line!',
    b: 'On the wrong side of the line. Every one is 4 mm short.',
    tip: 'The saw blade eats about 4 mm. Keep the blade on the waste side.'
  },
  edge: {
    p: 'iron',
    a: 'Tiny problem. The iron is stuck to the shelf.',
    b: 'And the shelf is stuck to your sleeve.',
    tip: 'Medium heat, keep the iron moving, and trim the edge band only when it has cooled.'
  },
  groove: {
    p: 'groove',
    a: 'I put the grooves on the outside. As decoration.',
    b: 'The back panel is meant to go IN them, Bolt.',
    tip: 'Mark the inside face of every panel in pencil before you rout. The groove goes on the inside, 18 mm from the back edge.'
  },
  box0: {
    p: 'upside',
    a: 'Finished! Hang on. Why are the shelf holes on the outside?',
    b: 'Because that side is the inside. Was. Should have been.',
    tip: 'Lay both sides down as a mirrored pair, inside faces up, before you drill or screw anything.'
  },
  box1: {
    p: 'diamond',
    a: 'Looks perfectly square to me.',
    b: 'It is a diamond, Bolt.',
    tip: 'Measure both diagonals. When they are the same, the box is square — only then tighten the last screws.'
  },
  box2: {
    p: 'ouch',
    a: 'I found a faster way to hold the screw.',
    b: 'With your thumb. Under the drill. I will get the plasters.',
    tip: 'Drill a pilot hole first and let clamps hold the panels — not your fingers.'
  },
  door: {
    p: 'door',
    a: 'The door frame is in. It only leans a little.',
    b: 'The door opens by itself now. That is not a feature.',
    tip: 'Check the frame with a level both ways, and that both diagonals are equal, before you fix it.'
  },
  wall: {
    p: 'water',
    a: 'Good news: I found the water pipe!',
    b: 'With the drill?',
    tip: 'Check the wall for pipes and cables with a detector before you drill, and mark them on the wall.'
  },
  plinth: {
    p: 'marble',
    a: 'I levelled it by eye. I have a very good eye.',
    b: 'The marble does not agree with your eye.',
    tip: 'Use a spirit level in both directions and turn the feet until the bubble is centred.'
  },
  place: {
    p: 'stuck',
    a: 'It fits through the door. Probably. Push harder.',
    b: 'We built it bigger than the stairs, Bolt.',
    tip: 'Carry the boxes up one at a time and join them in the room with the connector bolts.'
  },
  shelf: {
    p: 'shelf',
    a: 'Shelf pins are optional, right? I saved four.',
    b: 'That explains the books on the floor.',
    tip: 'Four pins under every shelf, all at the same height — count the holes up from the bottom.'
  },
  drawer: {
    p: 'drawer',
    a: 'The drawer runs beautifully!',
    b: 'Out of the back of the cabinet.',
    tip: 'Runners have a front and a back. The marked end goes to the front, 37 mm behind the edge.'
  },
  doors: {
    p: 'hang',
    a: 'I hung the door. It opens downwards now.',
    b: 'Hinges go on the side, Bolt. The side.',
    tip: 'Hang each door on its top hinge first, clip the others in, then adjust with the three screws until the gaps are even.'
  },
  handle: {
    p: 'holes',
    a: 'I drilled the handle holes by feeling.',
    b: 'Your feelings are all at different heights.',
    tip: 'Make one drilling template from scrap and use it for every door and drawer.'
  },
  skirt: {
    p: 'gap',
    a: 'I cut the closing strip dead straight. The ceiling is the crooked one.',
    b: 'Then the closing strip has to be crooked too. That is what the pencil is for.',
    tip: 'Hold the closing strip in place, run a pencil along the ceiling, and cut to that line.'
  },
  finish: {
    p: 'tangle',
    a: 'The lights are in. I may be part of the wiring now.',
    b: 'Stand still. I will find the plug.',
    tip: 'Lay cables in the gap behind the back panels and plug in only when everything is fixed.'
  },
  done: {
    p: 'proud',
    a: 'We built it! And it is not even on fire!',
    b: 'Twenty fingers between us. I counted twice.',
    tip: 'Stand back, check every door gap once more — and enjoy it.'
  }
};
function gagFor(t) {
  if (S.opts.noToons) return null;
  const m = /^S(\d+)/.exec(t);
  if (/doorway/.test(t)) return GAGS.door;
  if (m) return GAGS['box' + ((+m[1] - 1) % 3)];
  const k = /^Microcement/.test(t)
    ? null
    : /^Tools/.test(t)
      ? 'tools'
      : /^How to cut/.test(t)
        ? 'cutgen'
        : /^Cut the pre-edged/.test(t)
          ? 'stock'
          : /^Cut /.test(t)
            ? 'sheet'
            : /^Edge-band/.test(t)
              ? 'edge'
              : /^Rout/.test(t)
                ? 'groove'
                : /^Mark out/.test(t)
                  ? 'wall'
                  : /^Legs/.test(t)
                    ? 'plinth'
                    : /^Place/.test(t)
                      ? 'place'
                      : /^Shelves/.test(t)
                        ? 'shelf'
                        : /^Drawers/.test(t)
                          ? 'drawer'
                          : /^Doors/.test(t)
                            ? 'doors'
                            : /^Handles/.test(t)
                              ? 'handle'
                              : /^Top and side/.test(t)
                                ? 'skirt'
                                : /^Finishing/.test(t)
                                  ? 'finish'
                                  : /^Done/.test(t)
                                    ? 'done'
                                    : null;
  return k ? GAGS[k] : null;
}
function duoSVG(g) {
  const K = '#26282B',
    SK = '#F2C9A0',
    W = 620,
    Hh = 268,
    F = 252;
  const wrap = (t, n) => {
    const L = [];
    let c = '';
    t.split(' ').forEach(x => {
      if ((c + ' ' + x).trim().length > n) {
        L.push(c);
        c = x;
      } else c = (c + ' ' + x).trim();
    });
    if (c) L.push(c);
    return L;
  };
  const bub = (x, w, t, tail) => {
    const ls = wrap(t, Math.floor(w / 7.6)),
      h = ls.length * 17 + 20,
      y = 6;
    return `<path d="M${x + 12} ${y}h${w - 24}a12 12 0 0 1 12 12v${h - 24}a12 12 0 0 1-12 12H${tail + 24}l-13 18 1-18H${x + 12}a12 12 0 0 1-12-12V${y + 12}a12 12 0 0 1 12-12z" fill="#fff" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>${ls.map((l, i) => `<text x="${x + w / 2}" y="${y + 25 + i * 17}" text-anchor="middle" font-size="13.5" font-family="Inter,Arial,sans-serif" fill="${K}">${esc(l)}</text>`).join('')}`;
  };
  const L = (a, b, c, d, w = 5, col = K) =>
    `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const mouth = (x, y, m) =>
    m === 'o'
      ? `<ellipse cx="${x}" cy="${y + 2}" rx="3.5" ry="4.5" fill="${K}"/>`
      : m === 'sad'
        ? `<path d="M${x - 6} ${y + 4}q6-7 12 0" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`
        : m === 'flat'
          ? L(x - 5, y + 2, x + 5, y + 2, 2)
          : `<path d="M${x - 6} ${y}q6 7 12 0" fill="none" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`;
  const limb = (d, col, w) =>
    `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w + 4.5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const arm = (sx, sy, h, col, sd) => {
    const up = h[1] < sy - 6,
      mx = (sx + h[0]) / 2 + sd * (up ? 13 : 6),
      my = (sy + h[1]) / 2 + (up ? 6 : 13);
    return (
      limb(`M${sx} ${sy}Q${mx} ${my} ${h[0]} ${h[1]}`, col, 7.5) +
      `<path d="M${h[0] + sd * 1} ${h[1] - 5}q${sd * 6}-5 ${sd * 7} 1" fill="${SK}" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/><circle cx="${h[0]}" cy="${h[1]}" r="6.2" fill="${SK}" stroke="${K}" stroke-width="2"/>`
    );
  };
  const shoe = (x, sd, col) =>
    `<path d="M${x - 6 * sd} ${F - 8}h${10 * sd}q${12 * sd} 0 ${13 * sd} 8h${-23 * sd}z" fill="${col}" stroke="${K}" stroke-width="2" stroke-linejoin="round"/><path d="M${x - 6 * sd} ${F - 1}h${23 * sd}" stroke="#F1E9DA" stroke-width="2" stroke-linecap="round"/>`;
  const brow = (x, y, m, sd) =>
    m === 'o'
      ? `<path d="M${x - 4} ${y - 3}q4-4 8 0" fill="none" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>`
      : m === 'sad'
        ? L(x - 4 * sd, y + 1, x + 4 * sd, y - 3, 2.2)
        : m === 'flat'
          ? L(x - 4, y, x + 4, y, 2.2)
          : `<path d="M${x - 4} ${y}q4-3 8 0" fill="none" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>`;
  const lips = (x, y, m) =>
    m === 'o'
      ? `<ellipse cx="${x}" cy="${y + 1}" rx="3.6" ry="4.8" fill="#6B2A2A" stroke="${K}" stroke-width="1.6"/>`
      : m === 'sad'
        ? `<path d="M${x - 6} ${y + 4}q6-7 12 0" fill="none" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>`
        : m === 'flat'
          ? `<path d="M${x - 6} ${y + 2}q3-3 6 0t6 0" fill="none" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>`
          : `<path d="M${x - 7} ${y - 1}q7 10 14 0z" fill="#6B2A2A" stroke="${K}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${x - 4.5} ${y + 0.4}h9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`;
  const shade = (x, w) => `<ellipse cx="${x}" cy="${F + 1}" rx="${w}" ry="5" fill="rgba(60,40,10,.16)"/>`;
  const bolt = (x, m, arms) => {
    const [l, r] = arms,
      DN = '#4A6FA5',
      SH = '#E8853A',
      hy = F - 138;
    return (
      shade(x, 30) +
      limb(`M${x - 8} ${F - 62}L${x - 10} ${F - 9}`, DN, 8.5) +
      limb(`M${x + 8} ${F - 62}L${x + 10} ${F - 9}`, DN, 8.5) +
      shoe(x - 10, -1, '#6A4630') +
      shoe(x + 10, 1, '#6A4630') +
      `<path d="M${x - 21} ${F - 109}q21-9 42 0l-2 47q-19 6-38 0z" fill="${SH}" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/><path d="M${x - 19} ${F - 70}q19 6 38 0l-1 10q-18 6-36 0z" fill="${DN}" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${x - 11} ${F - 98}h22v28q-11 4-22 0z" fill="${DN}" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${x - 10} ${F - 98}l-5-13M${x + 10} ${F - 98}l5-13" stroke="${DN}" stroke-width="5" stroke-linecap="round"/><path d="M${x - 10} ${F - 98}l-5-13M${x + 10} ${F - 98}l5-13" stroke="${K}" stroke-width="1.2" stroke-dasharray="1 40"/><circle cx="${x - 8}" cy="${F - 94}" r="1.8" fill="#F3D27A" stroke="${K}" stroke-width="1"/><circle cx="${x + 8}" cy="${F - 94}" r="1.8" fill="#F3D27A" stroke="${K}" stroke-width="1"/><path d="M${x - 6} ${F - 86}h12v9q-6 3-12 0z" fill="none" stroke="${K}" stroke-width="1.5"/>${L(x + 3, F - 90, x + 3, F - 80, 2.4, '#E0A21B')}` +
      arm(x - 19, F - 104, l, SH, -1) +
      arm(x + 19, F - 104, r, SH, 1) +
      `<rect x="${x - 4.5}" y="${F - 124}" width="9" height="15" rx="3" fill="${SK}" stroke="${K}" stroke-width="2"/><circle cx="${x - 17}" cy="${hy + 1}" r="4.2" fill="${SK}" stroke="${K}" stroke-width="2"/><circle cx="${x + 17}" cy="${hy + 1}" r="4.2" fill="${SK}" stroke="${K}" stroke-width="2"/><path d="M${x - 17} ${hy - 4}q0-17 17-17t17 17v6q0 17-17 19q-17-2-17-19z" fill="${SK}" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${x - 10}" cy="${hy + 7}" r="4" fill="#F0A58A" opacity=".55"/><circle cx="${x + 12}" cy="${hy + 7}" r="4" fill="#F0A58A" opacity=".55"/>` +
      `<path d="M${x - 18} ${hy - 8}q-1-27 18-27t18 27z" fill="#3F6FB5" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/><rect x="${x - 19.5}" y="${hy - 13}" width="39" height="9" rx="4" fill="#7FA6DD" stroke="${K}" stroke-width="2.2"/>${[-12, -6, 0, 6, 12].map(d => L(x + d, hy - 11, x + d, hy - 6, 1.2)).join('')}<circle cx="${x}" cy="${hy - 37}" r="6" fill="#fff" stroke="${K}" stroke-width="2.2"/><path d="M${x - 9} ${hy - 4}q3 5 7 0" fill="#7A4A2A" stroke="${K}" stroke-width="1.4"/>` +
      `<ellipse cx="${x - 5}" cy="${hy + 1}" rx="3.6" ry="4.6" fill="#fff" stroke="${K}" stroke-width="1.6"/><ellipse cx="${x + 8}" cy="${hy + 1}" rx="3.6" ry="4.6" fill="#fff" stroke="${K}" stroke-width="1.6"/><circle cx="${x - 3.8}" cy="${hy + 1.6}" r="1.9" fill="${K}"/><circle cx="${x + 9.2}" cy="${hy + 1.6}" r="1.9" fill="${K}"/>${brow(x - 5, hy - 6, m, -1)}${brow(x + 8, hy - 6, m, 1)}<path d="M${x + 2} ${hy + 3}q4 3 0 6" fill="none" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>${lips(x + 2, hy + 13, m)}`
    );
  };
  const pip = (x, m, arms) => {
    const [l, r] = arms,
      JM = '#4F8F86',
      hy = F - 92;
    return (
      shade(x, 32) +
      limb(`M${x - 9} ${F - 30}L${x - 10} ${F - 9}`, '#6B4A32', 8.5) +
      limb(`M${x + 9} ${F - 30}L${x + 10} ${F - 9}`, '#6B4A32', 8.5) +
      shoe(x - 10, -1, '#39444E') +
      shoe(x + 10, 1, '#39444E') +
      `<path d="M${x - 24} ${F - 64}q24-14 48 0q5 22-2 40q-22 8-44 0q-7-18-2-40z" fill="${JM}" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/><path d="M${x - 25} ${F - 48}l7-6 7 6 7-6 7 6 7-6 7 6 6-5" fill="none" stroke="#E9D8A6" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M${x - 22} ${F - 28}q22 8 44 0" fill="none" stroke="#3B6F68" stroke-width="4"/><path d="M${x - 8} ${F - 71}l8 8 8-8" fill="#fff" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>` +
      arm(x - 22, F - 62, l, JM, -1) +
      arm(x + 22, F - 62, r, JM, 1) +
      `<circle cx="${x - 19}" cy="${hy + 2}" r="4.4" fill="${SK}" stroke="${K}" stroke-width="2"/><circle cx="${x + 19}" cy="${hy + 2}" r="4.4" fill="${SK}" stroke="${K}" stroke-width="2"/><circle cx="${x}" cy="${hy}" r="19.5" fill="${SK}" stroke="${K}" stroke-width="2.5"/><circle cx="${x - 12}" cy="${hy + 9}" r="4" fill="#F0A58A" opacity=".55"/><circle cx="${x + 12}" cy="${hy + 9}" r="4" fill="#F0A58A" opacity=".55"/>` +
      `<path d="M${x - 19} ${hy - 5}q-5-15 7-15q2-9 12-5q9-6 13 4q9 1 6 15q-5-9-12-8q-6-5-12 0q-8-2-14 9z" fill="#7A4A2A" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>${limb(`M${x + 15} ${hy - 4}L${x + 24} ${hy - 20}`, '#F2C230', 3)}<path d="M${x + 24} ${hy - 20}l1.5-5-4.5 2.6z" fill="${K}"/>` +
      `<circle cx="${x - 8.5}" cy="${hy + 1}" r="7.6" fill="#fff" fill-opacity=".92" stroke="${K}" stroke-width="2.3"/><circle cx="${x + 8.5}" cy="${hy + 1}" r="7.6" fill="#fff" fill-opacity=".92" stroke="${K}" stroke-width="2.3"/>${L(x - 1, hy, x + 1, hy, 2.3)}${L(x - 16, hy - 1, x - 19, hy - 2, 2)}${L(x + 16, hy - 1, x + 19, hy - 2, 2)}<circle cx="${x - 10}" cy="${hy + 1.6}" r="2.1" fill="${K}"/><circle cx="${x + 7}" cy="${hy + 1.6}" r="2.1" fill="${K}"/><path d="M${x - 13} ${hy - 3}q2-2 4-1M${x + 4} ${hy - 3}q2-2 4-1" fill="none" stroke="#B9D3E6" stroke-width="1.6" stroke-linecap="round"/>${brow(x - 8.5, hy - 11, m, -1)}${brow(x + 8.5, hy - 11, m, 1)}<path d="M${x - 1} ${hy + 6}q-3 2 0 4" fill="none" stroke="${K}" stroke-width="1.7" stroke-linecap="round"/>${lips(x - 1, hy + 12, m)}`
    );
  };
  const star = (x, y, c = '#E0A21B') =>
    `<path d="M${x} ${y - 8}l2.5 5.5 6 .6-4.5 4 1.4 5.9-5.4-3.2-5.4 3.2 1.4-5.9-4.5-4 6-.6z" fill="${c}" stroke="${K}" stroke-width="1.2"/>`;
  const wood = '#D9B27C',
    bx = 230,
    P = {
      plan: `<g transform="rotate(180 ${bx - 112} ${F - 92})"><rect x="${bx - 140}" y="${F - 116}" width="56" height="46" fill="#fff" stroke="${K}" stroke-width="2"/><path d="M${bx - 132} ${F - 104}h40M${bx - 132} ${F - 94}h30M${bx - 132} ${F - 84}h36" stroke="#3446D6" stroke-width="2"/><path d="M${bx - 112} ${F - 80}v-8m-4 4l4-5 4 5" fill="none" stroke="${K}" stroke-width="1.6"/></g><text x="${bx + 60}" y="${F - 120}" font-size="40" font-family="Georgia,serif" fill="${K}">?</text>`,
      short: `<rect x="${bx - 40}" y="${F - 60}" width="120" height="16" fill="${wood}" stroke="${K}" stroke-width="2"/><rect x="${bx + 96}" y="${F - 60}" width="70" height="16" fill="${wood}" stroke="${K}" stroke-width="2"/><path d="M${bx - 40} ${F - 30}h206" stroke="#3446D6" stroke-width="2" stroke-dasharray="5 4"/><path d="M${bx + 80} ${F - 74}v44M${bx + 96} ${F - 74}v44" stroke="#C2603A" stroke-width="2"/><text x="${bx + 88}" y="${F - 80}" text-anchor="middle" font-size="12" font-family="Inter,Arial,sans-serif" fill="#C2603A">oops</text>`,
      pile: `<rect x="${bx - 30}" y="${F - 22}" width="180" height="14" fill="${wood}" stroke="${K}" stroke-width="2"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${bx - 20 + i * 30}" y="${F - 44 - (i % 2) * 12}" width="26" height="${18 + (i % 3) * 6}" fill="${wood}" stroke="${K}" stroke-width="2" transform="rotate(${(i - 2) * 9} ${bx - 7 + i * 30} ${F - 36})"/>`).join('')}`,
      iron: `<rect x="${bx - 30}" y="${F - 40}" width="190" height="14" fill="${wood}" stroke="${K}" stroke-width="2"/><path d="M${bx + 20} ${F - 40}h56l-8-26h-30q-18 6-18 26z" fill="#8FA3AD" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/><path d="M${bx + 40} ${F - 76}q-8-10 0-18q8-8 0-18M${bx + 60} ${F - 76}q-8-10 0-18q8-8 0-18" fill="none" stroke="#9A9A9A" stroke-width="2.5" stroke-linecap="round"/>`,
      groove: `<rect x="${bx}" y="${F - 150}" width="110" height="146" fill="${wood}" stroke="${K}" stroke-width="2.5"/><path d="M${bx + 16} ${F - 150}v146M${bx + 94} ${F - 150}v146" stroke="#3446D6" stroke-width="3" stroke-dasharray="7 5"/>${star(bx + 55, F - 80)}`,
      upside: `<g transform="rotate(180 ${bx + 60} ${F - 70})"><rect x="${bx}" y="${F - 136}" width="120" height="132" fill="none" stroke="${K}" stroke-width="2.5"/><rect x="${bx}" y="${F - 136}" width="10" height="132" fill="${wood}" stroke="${K}" stroke-width="2"/><rect x="${bx + 110}" y="${F - 136}" width="10" height="132" fill="${wood}" stroke="${K}" stroke-width="2"/><rect x="${bx}" y="${F - 14}" width="120" height="10" fill="${wood}" stroke="${K}" stroke-width="2"/></g>${[0, 1, 2, 3, 4].map(i => `<circle cx="${bx - 8}" cy="${F - 30 - i * 22}" r="2.4" fill="${K}"/><circle cx="${bx + 128}" cy="${F - 30 - i * 22}" r="2.4" fill="${K}"/>`).join('')}`,
      diamond: `<path d="M${bx + 10} ${F - 4}h110l26-130h-110z" fill="none" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/><path d="M${bx + 10} ${F - 4}l136-130M${bx + 120} ${F - 4}l-84-130" stroke="#3446D6" stroke-width="2" stroke-dasharray="6 4"/>`,
      ouch: `<rect x="${bx}" y="${F - 30}" width="150" height="14" fill="${wood}" stroke="${K}" stroke-width="2"/>${star(118, F - 120, '#E14B3B')}${star(134, F - 104)}${star(104, F - 100)}<text x="${bx + 80}" y="${F - 70}" font-size="22" font-family="Georgia,serif" font-style="italic" fill="#E14B3B">OW!</text>`,
      door: `<path d="M${bx + 10} ${F - 4}l14-150h84l14 150" fill="none" stroke="${K}" stroke-width="6" stroke-linejoin="round"/><path d="M${bx + 34} ${F - 10}l8-132h44l22 132z" fill="${wood}" stroke="${K}" stroke-width="2"/>`,
      water: `<rect x="${bx + 110}" y="${F - 170}" width="60" height="166" fill="#E6E2D8" stroke="${K}" stroke-width="2"/>${[0, 1, 2, 3].map(i => `<path d="M${bx + 110} ${F - 100}q${-(40 + i * 14)} ${-(30 - i * 18)} ${-(70 + i * 16)} ${10 + i * 14}" fill="none" stroke="#3F8FD0" stroke-width="3" stroke-linecap="round"/>`).join('')}<circle cx="${bx + 112}" cy="${F - 100}" r="4" fill="${K}"/>`,
      marble: `<g transform="rotate(-7 ${bx + 70} ${F})"><rect x="${bx + 10}" y="${F - 120}" width="130" height="116" fill="${wood}" stroke="${K}" stroke-width="2.5"/><circle cx="${bx + 34}" cy="${F - 129}" r="8" fill="#5D7A8C" stroke="${K}" stroke-width="2"/><path d="M${bx + 50} ${F - 131}h30m-8-5l8 5-8 5" fill="none" stroke="${K}" stroke-width="2" transform="rotate(180 ${bx + 65} ${F - 131})"/></g>`,
      stuck: `<path d="M${bx + 30} ${F - 4}v-160h110v160" fill="none" stroke="${K}" stroke-width="6"/><rect x="${bx - 10}" y="${F - 128}" width="190" height="96" fill="${wood}" stroke="${K}" stroke-width="2.5" transform="rotate(-6 ${bx + 85} ${F - 80})"/>`,
      shelf: `<rect x="${bx + 10}" y="${F - 150}" width="130" height="146" fill="none" stroke="${K}" stroke-width="2.5"/><rect x="${bx + 14}" y="${F - 96}" width="122" height="10" fill="${wood}" stroke="${K}" stroke-width="2" transform="rotate(14 ${bx + 14} ${F - 96})"/>${[0, 1, 2].map(i => `<rect x="${bx + 70 + i * 22}" y="${F - 22}" width="16" height="${14 + i * 3}" fill="${['#C96B4B', '#5D7A8C', '#E0A21B'][i]}" stroke="${K}" stroke-width="1.6" transform="rotate(${-30 + i * 26} ${bx + 78 + i * 22} ${F - 12})"/>`).join('')}`,
      drawer: `<rect x="${bx + 40}" y="${F - 110}" width="110" height="106" fill="none" stroke="${K}" stroke-width="2.5"/><rect x="${bx + 110}" y="${F - 78}" width="90" height="34" fill="${wood}" stroke="${K}" stroke-width="2"/><path d="M${bx + 160} ${F - 92}h34m-8-5l8 5-8 5" fill="none" stroke="#C2603A" stroke-width="2.5"/>`,
      hang: `<rect x="${bx + 20}" y="${F - 150}" width="120" height="146" fill="none" stroke="${K}" stroke-width="2.5"/><rect x="${bx + 24}" y="${F - 146}" width="112" height="70" fill="${wood}" stroke="${K}" stroke-width="2" transform="rotate(38 ${bx + 24} ${F - 146})"/><circle cx="${bx + 24}" cy="${F - 146}" r="4" fill="${K}"/>`,
      holes: `<rect x="${bx + 20}" y="${F - 150}" width="110" height="146" fill="${wood}" stroke="${K}" stroke-width="2.5"/>${[
        [40, -120],
        [96, -98],
        [62, -70],
        [104, -44],
        [36, -30],
        [78, -132]
      ]
        .map(([a, b]) => `<circle cx="${bx + a}" cy="${F + b}" r="4" fill="${K}"/>`)
        .join('')}`,
      gap: `<path d="M${bx - 20} ${F - 150}l210-34" stroke="${K}" stroke-width="4"/><rect x="${bx - 20}" y="${F - 140}" width="210" height="26" fill="${wood}" stroke="${K}" stroke-width="2"/><path d="M${bx + 60} ${F - 152}l6 8 6-10 6 8" fill="none" stroke="#C2603A" stroke-width="2.5"/>`,
      tangle: `<path d="M30 ${F - 70}q40-50 70-10t-50 30q-50 0-10-40t80 20q10 30-40 34" fill="none" stroke="#E0A21B" stroke-width="3.5" stroke-linecap="round"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="${36 + i * 17}" cy="${F - 58 + (i % 2) * 12}" r="4" fill="#FFE08A" stroke="${K}" stroke-width="1.2"/>`).join('')}<rect x="${bx + 40}" y="${F - 130}" width="120" height="126" fill="${wood}" stroke="${K}" stroke-width="2.5"/>`,
      proud: `<rect x="${bx + 10}" y="${F - 150}" width="150" height="146" fill="${wood}" stroke="${K}" stroke-width="2.5"/><path d="M${bx + 60} ${F - 150}v146M${bx + 110} ${F - 150}v146M${bx + 10} ${F - 60}h150" stroke="${K}" stroke-width="2"/>${star(bx, F - 160)}${star(bx + 172, F - 150)}${star(bx + 90, F - 168)}`
    };
  const A = {
    plan: [
      'flat',
      [
        [70, F - 96],
        [148, F - 96]
      ]
    ],
    ouch: [
      'o',
      [
        [40, F - 70],
        [112, F - 112]
      ]
    ],
    proud: [
      'smile',
      [
        [38, F - 150],
        [124, F - 150]
      ]
    ],
    tangle: [
      'o',
      [
        [44, F - 74],
        [118, F - 74]
      ]
    ],
    stuck: [
      'flat',
      [
        [50, F - 70],
        [190, F - 92]
      ]
    ]
  }[g.p] || [
    ['smile', 'flat', 'o'][g.p.length % 3],
    [
      [52, F - 64],
      [112, F - 70]
    ]
  ];
  const B = {
    proud: [
      'smile',
      [
        [470, F - 118],
        [556, F - 118]
      ]
    ],
    plan: [
      'flat',
      [
        [492, F - 36],
        [548, F - 112]
      ]
    ]
  }[g.p] || [
    'flat',
    [
      [488, F - 34],
      [548, F - 36]
    ]
  ];
  return `<svg viewBox="0 0 ${W} ${Hh}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bolt and Pip get it wrong"><rect width="${W}" height="${Hh}" rx="14" fill="#FFF8E6"/><path d="M0 ${F + 2}h${W}v${Hh - F - 16}a14 14 0 0 1-14 14H14a14 14 0 0 1-14-14z" fill="#F1E3BF"/><path d="M0 ${F - 12}h${W}" stroke="#F3E9CC" stroke-width="6"/><path d="M0 ${F + 2}h${W}" stroke="${K}" stroke-width="2.5"/>${P[g.p] || ''}${bolt(82, A[0], A[1])}${pip(518, B[0], B[1])}${bub(10, 300, g.a, 82)}${bub(326, 284, g.b, 500)}<text x="82" y="${F + 14}" text-anchor="middle" font-size="10" font-family="Inter,Arial,sans-serif" fill="#8A7A55">BOLT</text><text x="518" y="${F + 14}" text-anchor="middle" font-size="10" font-family="Inter,Arial,sans-serif" fill="#8A7A55">PIP</text></svg>`;
}
function gagHTML(t) {
  const g = gagFor(t);
  return g
    ? `<div class="gsub wide gcomic">${duoSVG(g)}<p><b>Don’t be like Bolt &amp; Pip.</b> ${g.tip}</p></div>`
    : '';
}
/* every cut of every sheet, numbered sheet by sheet or grouped by saw setting (Build guide and Workshop mode) */
function cutPlan(gs) {
  const { kerf, trim } = sawCfg(),
    nest = nestAll(gs);
  // collect every cut of every sheet first, so they can be numbered sheet by sheet or grouped by saw setting
  const batch = S.opts.cutOrder === 'width',
    ops = [],
    plans = [],
    AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    KO = { rip: 0, cross: 1, trim: 2 };
  nest.forEach((g, gi) => {
    if (!g.sheets.length) return;
    const L = g.sh.L,
      W = g.sh.W,
      pl = { g, L, W, sheets: [] };
    plans.push(pl);
    g.sheets.forEach((sh, si) => {
      const strips = {};
      sh.pl.forEach(c => {
        (strips[c.y] = strips[c.y] || []).push(c);
      });
      const ys = Object.keys(strips)
          .map(Number)
          .sort((a, b) => a - b),
        cuts = [],
        txt = [],
        sn = `${g.name} mm sheet ${si + 1}`;
      const mshort = `${MATS[g.mt]?.short || ''} ${FIN[g.fin]?.name || ''} ${g.t} mm`.trim(),
        txtC = [],
        add = (o, t) => {
          o.mat = mshort;
          o.sheet = sn;
          o.gi = gi;
          o.si = si;
          o.ord = ops.length;
          cuts.push(o);
          ops.push(o);
          if (t) (o.kind === 'rip' ? txt : txtC).push([o, t]);
        };
      ys.forEach((y, k) => {
        const row = strips[y].sort((a, b) => a.x - b.x),
          h = Math.max(...row.map(c => c.ph)),
          yc = y + h,
          nm = AZ[k % 26] + (k >= 26 ? Math.floor(k / 26) : '');
        if (yc < W - trim - 1)
          add(
            { kind: 'rip', v: h, x1: 0, y1: yc + kerf / 2, x2: L, y2: yc + kerf / 2, lbl: `strip ${nm}`, tag: nm },
            `<b>rip</b> strip ${nm}: ${f0(h)} mm wide, off the long edge`
          );
        else txt.push([null, `what is left of the sheet is strip ${nm} (${f0(h)} mm wide)`]);
        row.forEach((c, j) => {
          const xc = c.x + c.pw;
          let o = null,
            t;
          if (xc < L - trim - 1) {
            o = {
              kind: 'cross',
              v: c.pw,
              x1: xc + kerf / 2,
              y1: y,
              x2: xc + kerf / 2,
              y2: yc,
              lbl: `strip ${nm} → ${c.p.id}`,
              tag: `${nm}→${c.p.id}`
            };
            t = `strip ${nm}: <b>cross-cut</b> at ${f0(c.pw)} mm → ${c.p.id} ${esc(c.p.type)}`;
          } else t = `strip ${nm}: the piece that is left is ${c.p.id} ${esc(c.p.type)} (${f0(c.pw)} mm)`;
          const tr =
            c.ph < h - 1
              ? {
                  kind: 'trim',
                  v: c.ph,
                  x1: c.x,
                  y1: y + c.ph + kerf / 2,
                  x2: xc,
                  y2: y + c.ph + kerf / 2,
                  lbl: `${c.p.id} (from strip ${nm})`,
                  tag: c.p.id
                }
              : null;
          if (tr) t += `, then <b>trim</b> it to ${f0(c.ph)} mm wide`;
          if (!c.p.rect)
            t += ` — then <b>shape</b> ${c.p.id} from its points under Shaped parts${c.p.angled ? ' (bevel as noted in the cut list)' : ''}`;
          if (o) add(o, t);
          else txtC.push([null, t]);
          if (tr) add(tr, null);
        });
      });
      pl.sheets.push({ sh, si, cuts, txt: txt.concat(txtC) });
    });
  });
  // numbering: sheet by sheet (rips first on each sheet), or all cuts with the same saw setting one after another
  const key = v => Math.round(v * 2) / 2;
  if (batch) {
    ops.sort((a, b) => KO[a.kind] - KO[b.kind] || key(b.v) - key(a.v) || a.ord - b.ord);
  } else
    ops.sort(
      (a, b) => a.gi - b.gi || a.si - b.si || (a.kind === 'rip' ? 0 : 1) - (b.kind === 'rip' ? 0 : 1) || a.ord - b.ord
    );
  ops.forEach((o, ix) => (o.num = ix + 1));
  const settings = new Set(ops.map(o => o.kind + key(o.v))).size;
  let chg = 0,
    prev = '';
  ops
    .slice()
    .sort(
      (a, b) => a.gi - b.gi || a.si - b.si || (a.kind === 'rip' ? 0 : 1) - (b.kind === 'rip' ? 0 : 1) || a.ord - b.ord
    )
    .forEach(o => {
      const k = o.kind + key(o.v);
      if (k !== prev) chg++;
      prev = k;
    });
  return { batch, ops, plans, settings, chg, key };
}
/* ---------- workshop mode: one cut or one build step at a time, ticks saved in the design ---------- */
function wsItems() {
  const gs = groupsCache || (groupsCache = groupPanels(bgeo()));
  if (ui.ws.tab === 'cuts') {
    const { ops, key } = cutPlan(gs),
      nm = { rip: 'Rip', cross: 'Cross-cut', trim: 'Trim' },
      how = { rip: 'Jig / fence', cross: 'Stop / mark', trim: 'Jig / fence' };
    return ops.map(o => ({
      k: `c|${o.sheet}|${o.kind}|${o.lbl}`,
      set: `${how[o.kind]} at ${f0(o.v)} mm`,
      setK: o.kind + key(o.v),
      big:
        o.kind === 'rip'
          ? `Rip strip ${o.tag} off ${o.sheet}`
          : o.kind === 'cross'
            ? `Cross-cut ${f0(o.v)} mm off strip ${o.tag.split('→')[0]} → ${o.tag.split('→')[1]}`
            : `Trim ${o.tag} to ${f0(o.v)} mm wide`,
      mid:
        o.kind === 'rip'
          ? `The strip is ${f0(o.v)} mm wide. Write the sheet number and letter ${o.tag} on it.`
          : (() => {
              const id = o.kind === 'cross' ? o.tag.split('→')[1] : o.tag,
                pp = gs.find(p => p.id === id) || {};
              return `${id} · ${esc(pp.type || '')} · ${f0(pp.L || 0)} × ${f0(pp.Wd || 0)} mm — write ${id} on its back edge.`;
            })(),
      num: o.num
    }));
  }
  renderGuide();
  return [...document.querySelectorAll('#v-guide .gstep')].map(st => {
    const t = st.querySelector('h4')?.textContent || '',
      fig = st.querySelector('.gfig svg');
    return {
      k: `s|${t}`,
      set: `Step ${st.querySelector('.gnum')?.textContent || ''}`,
      big: esc(t),
      mid:
        (st.querySelector('.gchips')
          ? `<p>${[...st.querySelectorAll('.gchips > span')].map(c => esc(c.textContent.trim())).join(' · ')}</p>`
          : '') + (st.querySelector('.gtxt')?.innerHTML || ''),
      fig: fig ? fig.outerHTML : ''
    };
  });
}
function wsRender() {
  let m = document.getElementById('wsm');
  if (!ui.ws) {
    try {
      wxDispose();
    } catch (e) {
      oops('build-guide #1', e);
    }
    if (m) m.remove();
    return;
  }
  if (!m) {
    m = document.createElement('div');
    m.id = 'wsm';
    m.className = 'ws';
    document.body.appendChild(m);
  }
  if (ui.ws.tab === 'boxes') {
    wxRender(m);
    return;
  }
  try {
    wxDispose();
  } catch (e) {
    oops('build-guide #2', e);
  }
  const it = wsItems(),
    done = new Set(S.done ? S.done[ui.ws.tab] || [] : []);
  let i = Math.max(0, Math.min(it.length - 1, ui.ws.i ?? it.findIndex(x => !done.has(x.k))));
  if (i < 0) i = 0;
  ui.ws.i = i;
  const cur = it[i],
    nDone = it.filter(x => done.has(x.k)).length;
  const newSet = cur && ui.ws.tab === 'cuts' && (i === 0 || it[i - 1].setK !== cur.setK);
  m.innerHTML = `<div class="wsbar"><div class="seg"><button type="button" class="${ui.ws.tab === 'cuts' ? 'on' : ''}" data-act="wsTab" data-a="cuts">Cuts</button><button type="button" class="${ui.ws.tab === 'steps' ? 'on' : ''}" data-act="wsTab" data-a="steps">Build steps</button><button type="button" data-act="wsTab" data-a="boxes">Boxes 3D</button></div><button type="button" class="btn sm" data-act="wsClose">Close</button></div>
  <div class="wsprog"><i style="width:${it.length ? Math.round((nDone / it.length) * 100) : 0}%"></i></div><div class="hintp" style="margin:4px 0 0">${nDone} of ${it.length} done${ui.ws.tab === 'cuts' ? ` · order: ${S.opts.cutOrder === 'width' ? 'same width together' : 'sheet by sheet'} (change it in the Build guide)` : ''}</div>
  ${
    cur
      ? `<div class="wscard"><div class="wsset">${newSet ? '⚑ Set the saw: ' : ''}${cur.set}${cur.num ? ` · cut ${cur.num}` : ''}${done.has(cur.k) ? ' · ✓ done' : ''}</div><div class="wsbig">${cur.big}</div><div class="wsmid">${cur.mid}</div>${cur.fig ? `<div class="wsfig">${cur.fig}</div>` : ''}
    <div class="wslist">${it
      .slice(i + 1, i + 6)
      .map(
        (x, j) =>
          `<button type="button" data-act="wsGo" data-a="${i + 1 + j}" class="${done.has(x.k) ? 'ok' : ''}">${x.num ? x.num + '. ' : ''}${x.big.replace(/<[^>]+>/g, '')}</button>`
      )
      .join('')}</div></div>
  <div class="wsnav"><button type="button" class="btn" data-act="wsGo" data-a="${i - 1}" ${i ? '' : 'disabled'}>Back</button><button type="button" class="btn wsdone" data-act="wsDone">${done.has(cur.k) ? 'Next' : 'Done ✓'}</button></div>`
      : '<div class="wscard"><div class="wsbig">Nothing to do here</div></div>'
  }`;
}
function wsDone() {
  const it = wsItems(),
    cur = it[ui.ws.i];
  if (!cur) return;
  S.done = S.done || {};
  const L = (S.done[ui.ws.tab] = S.done[ui.ws.tab] || []);
  if (!L.includes(cur.k)) L.push(cur.k);
  saveSoon && saveSoon();
  ui.ws.i = Math.min(it.length - 1, ui.ws.i + 1);
  wsRender();
}
function renderGuide() {
  const G = bgeo(),
    el = document.getElementById('v-guide');
  if (!el) return;
  const gs = groupsCache || (groupsCache = groupPanels(G)),
    H = G.H,
    secs = G.secs.filter(q => !q.panel),
    boxes = G.boxes,
    tc = G.tc,
    tb = G.tb;
  const JN = S.opts.joinery || 'confirmat',
    FJ = FASTEN[JN],
    GRV = (S.opts.backFix || 'groove') === 'groove',
    GO = 18,
    GD = 10,
    GW = Math.round((tb + 0.5) * 10) / 10;
  const chip = (p, q) =>
    `<span class="gpart"><b>${p.id}</b>${q ? `<i>${q}×</i>` : ''}<small>${esc(p.type)}</small></span>`;
  const hwc = (ic, n, t) => (n ? `<span class="ghw">${gi(ic)}<b>${n}×</b><small>${esc(t)}</small></span>` : '');
  const out = [];
  let n = 0;
  const chapter = (t, sub) => out.push(`<div class="gchap"><b>${t}</b>${sub ? `<span>${sub}</span>` : ''}</div>`);
  const step = (title, svg, parts, hw, text, warn, subs) => {
    {
      const cm = gagHTML(String(title).replace(/<[^>]+>/g, ''));
      if (cm) subs = (subs || '') + cm;
    }
    out.push(
      `<section class="gstep"><div class="gnum">${++n}</div><div class="gbody"><h4>${title}</h4>${svg ? `<div class="gfig">${svg}</div>` : ''}${subs ? `<div class="gsubs">${subs}</div>` : ''}${parts || hw ? `<div class="gchips">${parts || ''}${hw || ''}</div>` : ''}${text ? `<div class="gtxt">${text}</div>` : ''}${warn ? `<div class="gwarn">${gi('warn')}<span>${warn}</span></div>` : ''}</div></section>`
    );
  };
  const sub = (l, svg, text, wide) =>
    `<div class="gsub${wide ? ' wide' : ''}"><span class="gsl">${l}</span>${svg || ''}<p>${text}</p></div>`;
  const total = gs.reduce((a, p) => a + p.qty, 0),
    fr = G.fronts.length,
    dr = G.fronts.filter(f => f.kind === 'drawer').length,
    hours = (() => {
      try {
        const P_ = planOf(G);
        return `${f0(Math.round(P_.tot * 0.85))}–${f0(Math.round(P_.tot * 1.25))}`;
      } catch (e) {
        return String(Math.max(4, Math.round((total * 6 + fr * 12 + dr * 25 + secs.length * 35) / 60)));
      }
    })();
  const J = H.join || { joints: 0, dowels: 0 };
  // ===== A. Prepare
  chapter('A · Prepare', 'Tools, fasteners and parts');
  step(
    'Your plan',
    `<div class="gplan">${planHTML(G)}</div>`,
    '',
    '',
    'How long each stage takes and how it fits into weekends. It is only an estimate.'
  );
  step(
    'Tools and fasteners',
    `<div class="gtools">${['drill', 'driver', 'level', 'tape', 'clamp', 'saw', 'pencil', 'people'].map(k => `<span>${gi(k)}<small>${{ drill: 'Drill + Ø5, Ø8, Ø15, Ø35 bits', driver: 'Screwdriver / hex bit', level: 'Spirit level', tape: 'Tape measure', clamp: '2 clamps + square', saw: 'Jigsaw for scribing', pencil: 'Pencil + compass', people: '2 people' }[k]}</small></span>`).join('')}</div>`,
    '',
    hwc(JN === 'confirmat' || JN === 'screw' ? 'screw' : 'cam', J.joints, FJ.short) +
      (FJ.dowel ? hwc('dowel', J.dowels, 'dowels Ø8 × 30') : '') +
      hwc('pin', H.pins, 'shelf supports Ø5') +
      hwc(
        'hinge',
        H.hinges,
        (S.opts.hw || {}).brand === 'generic'
          ? 'Clip-top hinges 110°'
          : (S.opts.hw || {}).brand === 'blumeco'
            ? 'Blum MODUL hinges + plates'
            : 'Blum CLIP top hinges + plates'
      ) +
      Object.entries(H.slides)
        .map(([l, c]) =>
          hwc(
            'runner',
            c,
            (S.opts.hw || {}).brand === 'generic'
              ? `runner pairs ${l}`
              : `${(S.opts.hw || {}).runner === 'movento' ? 'MOVENTO' : 'TANDEM'} runner pairs ${l}`
          )
        )
        .join('') +
      hwc('bolt', H.boxJoins * 4, 'connector bolts Ø5') +
      hwc('bracket', H.wallHang || H.brackets, 'cabinet hangers') +
      hwc('leg', H.legs, 'plinth legs'),
    `Plan about <b>${hours} hours</b> for two people. Carcass joints use <b>${FJ.name}</b>${GRV ? `, and every back slides into a <b>${GW} × ${GD} mm groove</b>, ${GO} mm in from the back edge` : ', with the backs nailed on'}. Lay all panels out by their number (the same numbers as the cut list).`,
    'Check the wall for cables and pipes before drilling. Everything tall gets fixed to the wall.'
  );
  const thumb = p => {
    const xs = p.poly.map(v => v[0]),
      ys = p.poly.map(v => v[1]),
      w = Math.max(...xs) - Math.min(...xs),
      h = Math.max(...ys) - Math.min(...ys),
      s_ = 40 / Math.max(w, h, 1);
    return `<svg viewBox="-2 -2 44 44" class="gth"><polygon points="${p.poly.map(v => ((v[0] - Math.min(...xs)) * s_ + (40 - w * s_) / 2).toFixed(1) + ',' + (40 - ((v[1] - Math.min(...ys)) * s_ + (40 - h * s_) / 2)).toFixed(1)).join(' ')}" fill="#fff" stroke="${GK}" stroke-width="1.2"/></svg>`;
  };
  out.push(
    `<section class="gparts"><h4>Parts</h4><div class="gpgrid">${gs.map(p => `<div class="gpc">${thumb(p)}<b>${p.id}</b><span>${p.qty}×</span><small>${esc(p.type)} · ${f0(p.L)}×${f0(p.Wd)}</small></div>`).join('')}</div></section>`
  );
  // ----- cutting
  {
    const { kerf, trim } = sawCfg(),
      nest = nestAll(gs),
      sp = stockPlan(gs);
    step(
      'How to cut the panels',
      '',
      ``,
      hwc('saw', 1, 'track saw or table saw, fine-tooth blade') +
        hwc('tape', 1, 'tape measure + square') +
        hwc('pencil', 1, 'pencil for part numbers'),
      `<b>Order of work on every sheet:</b> 1) ${trim ? `trim ${trim} mm off the factory edges so you start square` : 'check the factory edges are clean and square (set a sheet edge trim under Build if they are not)'}; 2) make all the long <b>rip cuts</b> first, splitting the sheet into strips A, B, C…; 3) <b>cross-cut</b> each strip into its parts, measuring every cut from the freshly cut end; 4) trim any part that is narrower than its strip; 5) cut angles and shapes last. Allow ${kerf} mm for the saw kerf — the plans already do. <b>Melamine chips:</b> with a track or circular saw cut good face <b>down</b>, on a table saw good face <b>up</b>; use a scoring blade or tape over the cut line. Write each part number on its back edge as soon as it is cut.<br><b>Which sheets first:</b> cut the carcass sheets first (sides, tops, bottoms, dividers), then shelves and backs, then the drawer boxes. The doors and drawer fronts are on their own sheets when they are a different board: cut those <b>last</b>, after the carcass stands, so you can measure each opening first and keep the 3 mm gaps even if a box came out a millimetre off.`,
      'Get a second person to support long strips as they come off the saw. Many panel shops cut and edge-band from this cut list for little money.'
    );
    const { batch, ops, plans, settings, chg, key } = cutPlan(gs);
    step(
      'Cut order',
      '',
      `<div class="fld" style="margin:4px 0 0"><span>Cut</span>${seg(
        'opts.cutOrder',
        [
          ['', 'Sheet by sheet'],
          ['width', 'Same width together']
        ],
        { dflt: '' }
      )}</div>`,
      '',
      batch
        ? `All cuts with the same measurement are done one after the other, across every sheet, so you set your track-saw jig, fence or stop only <b>${settings}</b> times (sheet by sheet would be about ${chg} changes). First all <b>rips</b> (widest first), then all <b>cross-cuts</b> (longest first), then the <b>trims</b>. Keep the strips and pieces on a trolley labelled with their sheet and strip letter, and write the part number on each piece as it comes off. The numbers on the sheet drawings follow this order.`
        : `Each sheet is cut completely before the next one: rips first, then cross-cuts and trims, numbered on each drawing. Tip: choose “Same width together” to make every cut with the same measurement one after the other, so the jig or fence is set only ${settings} times instead of about ${chg}.`
    );
    const cutSVG2 = (sh, pl, cuts, L, W) => {
      const fs = Math.max(36, L / 42);
      let sv = `<svg viewBox="0 0 ${L} ${W}" class="gsheet"><rect width="${L}" height="${W}" fill="#fff" stroke="${GK}" stroke-width="6"/>`;
      pl.forEach(c => {
        sv += `<rect x="${c.x}" y="${c.y}" width="${c.pw}" height="${c.ph}" fill="${c.p.rect ? '#F4F4F4' : '#EDEFF8'}" stroke="#999" stroke-width="3"/>`;
        const f = Math.min(fs * 1.1, c.ph * 0.4, c.pw / 3.4);
        if (f > 14)
          sv += `<text x="${c.x + c.pw / 2}" y="${c.y + c.ph / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${f}" font-family="IBM Plex Mono,monospace" fill="#555">${c.p.id}</text>`;
      });
      cuts.forEach((k, ix) => {
        const col = k.kind === 'rip' ? '#3446D6' : k.kind === 'cross' ? '#D2463A' : '#2E8B57';
        sv += `<line x1="${k.x1}" y1="${k.y1}" x2="${k.x2}" y2="${k.y2}" stroke="${col}" stroke-width="${k.kind === 'rip' ? 9 : 6}"/>`;
        const mx = k.kind === 'rip' ? k.x1 + 60 + ((ix * 170) % (L * 0.5)) : k.x1,
          my = k.kind === 'rip' ? k.y1 : (k.y1 + k.y2) / 2,
          lab = String(k.num),
          rr = fs * (lab.length > 2 ? 0.8 : 0.62);
        sv += `<circle cx="${mx}" cy="${my}" r="${rr}" fill="${col}"/><text x="${mx}" y="${my}" text-anchor="middle" dominant-baseline="central" font-size="${fs * (lab.length > 2 ? 0.6 : 0.7)}" font-weight="700" fill="#fff" font-family="IBM Plex Mono,monospace">${lab}</text>`;
      });
      return sv + '</svg>';
    };
    plans.forEach(({ g, L, W, sheets }) => {
      let html = '',
        ol = '';
      sheets.forEach(({ sh, si, cuts, txt }) => {
        html += `<div class="gsheetwrap">${cutSVG2(sh, sh.pl, cuts, L, W)}<p>Sheet ${si + 1} of ${g.sheets.length}</p></div>`;
        if (!batch) {
          const rips = cuts.filter(c => c.kind === 'rip').length;
          ol += `<details class="pf"${si === 0 ? ' open' : ''}><summary>Sheet ${si + 1}: ${rips} rip${rips === 1 ? '' : 's'}, then ${cuts.length - rips} cross-cuts and trims</summary><ol class="gcuts">${txt.map(([o, t]) => `<li>${o ? `<b>${o.num}.</b> ` : ''}${t}</li>`).join('')}</ol></details>`;
        }
      });
      step(
        `Cut ${esc(g.name)} mm sheets (${L}×${W})`,
        `<div class="gsheets">${html}</div>`,
        '',
        '',
        `${ol}<span class="gkey"><i style="background:#3446D6"></i>rip cuts <i style="background:#D2463A"></i>cross-cuts <i style="background:#2E8B57"></i>trims — numbered in the order you make them${batch ? ' (same measurement together — see the list below)' : ''}. Strips are lettered from the first rip. Light-blue parts are shaped.</span>`
      );
    });
    if (batch && ops.length) {
      const groups = [];
      ops.forEach(o => {
        const k = o.kind + key(o.v),
          l = groups[groups.length - 1];
        if (l && l.k === k) l.ops.push(o);
        else groups.push({ k, kind: o.kind, v: o.v, ops: [o] });
      });
      const nm = { rip: 'Rip', cross: 'Cross-cut', trim: 'Trim' },
        how = { rip: 'set the jig / fence to', cross: 'set the stop / mark at', trim: 'set the jig / fence to' };
      step(
        'Cut list by saw setting',
        `<ol class="gcuts">${groups
          .map(
            (gp, ix) =>
              `<li><b>${how[gp.kind]} ${f0(gp.v)} mm</b> — ${nm[gp.kind]} ${gp.ops.length}× (cuts ${gp.ops[0].num}${gp.ops.length > 1 ? '–' + gp.ops[gp.ops.length - 1].num : ''}): ${(() => {
                const bm = {};
                gp.ops.forEach(o => {
                  ((bm[o.mat] = bm[o.mat] || {})[o.si] = bm[o.mat][o.si] || []).push(o.tag);
                });
                return Object.entries(bm)
                  .map(
                    ([m, ss]) =>
                      `<i>${esc(m)}</i> ${Object.entries(ss)
                        .map(([si, tg]) => `sheet ${+si + 1}: ${tg.join(', ')}`)
                        .join(' · ')}`
                  )
                  .join(' | ');
              })()}</li>`
          )
          .join('')}</ol>`,
        '',
        '',
        `${groups.length} settings in this order. A rip cuts a full-length strip off the sheet (the order of strips on one sheet does not matter). A cross-cut takes a part off the end of a strip; a trim rips a part to its final width.`
      );
    }
    if (sp.groups.length) {
      let t = '';
      sp.groups.forEach(g => {
        t +=
          `<p><b>${esc(FIN[g.fin]?.name || '')} ${g.t} mm · ${g.W} mm boards</b></p><ol class="gcuts">` +
          g.bars
            .map(
              (b, i) =>
                `<li>Board ${i + 1}: ${b.pl.map(c => `cross-cut ${f0(c.len)} → ${c.p.id}${c.rip ? ` (rip ${c.rip} mm off the back edge)` : ''}`).join(', ')}</li>`
            )
            .join('') +
          `</ol>`;
      });
      step(
        'Cut the pre-edged boards',
        '',
        '',
        '',
        `Square one end first, then cross-cut to length — measure each part from the squared end. Where a part is narrower than the board, rip the extra off the <b>back</b> edge so the factory edge band stays at the front.${t}`
      );
    }
    const band = gs.filter(
        p => p.band !== 'none' && !sp.ids.has(p.id) && !(MATS[p.matType] || {}).paint && !(MATS[p.matType] || {}).micro
      ),
      bm = band.reduce((a, p) => a + p.bandM * p.qty, 0);
    if (band.length)
      step(
        'Edge-band the visible edges',
        '',
        band
          .slice(0, 40)
          .map(p => chip(p, p.qty))
          .join(''),
        hwc('drill', 0, ''),
        `About ${bm.toFixed(1)} m of edge band in total. Front edges of sides, tops, bottoms and shelves get banded; doors and drawer fronts all round. Iron on (or glue ABS), let it cool, trim flush with an edge trimmer, ease the corners with a sanding block. Band <b>before</b> drilling hinge cups and handle holes.`
      );
  }
  if (GRV) {
    const T = tc,
      E = 90,
      gx = E - GO - GW,
      its = [
        {
          poly: 1,
          pts: [
            [0, 0],
            [E, 0],
            [E, -T],
            [0, -T]
          ],
          fill: '#fff'
        },
        {
          poly: 1,
          pts: [
            [gx, -T],
            [gx + GW, -T],
            [gx + GW, -T + GD],
            [gx, -T + GD]
          ],
          fill: '#E6EBFF'
        },
        {
          poly: 1,
          pts: [
            [gx + 0.5, -T - 24],
            [gx + GW - 0.5, -T - 24],
            [gx + GW - 0.5, -T + GD - 1],
            [gx + 0.5, -T + GD - 1]
          ],
          fill: '#F6F6F6',
          dash: 1
        },
        {
          line: 1,
          pts: [
            [gx, -T - 30],
            [gx + GW, -T - 30]
          ]
        },
        { text: `${GW} wide`, pts: [[gx + GW / 2, -T - 33]], fs: 11 },
        {
          line: 1,
          pts: [
            [gx + GW, 8],
            [E, 8]
          ]
        },
        { text: `${GO} to the back edge`, pts: [[gx + GW + 1, 20]], fs: 11, anchor: 'start' },
        { text: `${GD} deep`, pts: [[gx - 2, -T + GD / 2 + 2]], fs: 11, anchor: 'end' },
        { text: `${T} mm side, top or bottom — cross-section`, pts: [[2, 40]], fs: 11, anchor: 'start' },
        { text: 'back panel', pts: [[gx - 3, -T - 14]], fs: 11, anchor: 'end' }
      ];
    step(
      'Rout the back grooves',
      gScene(its, { w: 300 }),
      gs
        .filter(
          p =>
            p.notes.some(t => /Back groove/.test(t)) &&
            !/Drawer/.test(p.type) &&
            !p.notes.some(t => /stops in front of the back panel/.test(t))
        )
        .map(p => chip(p, p.qty))
        .join(''),
      '',
      `Before drilling anything, cut a ${GW} mm wide, ${GD} mm deep groove ${GO} mm in from the back edge on the inside face of every side, top and bottom (a table saw or router with a fence). Fixed dividers that are shallower than the sides need no groove: the back runs past behind them. Stop the groove on the sides ${tc} mm short of the top on sloped tops, so it does not show. The ${GO} mm behind the back leaves room for scribing to an uneven wall and for cables.`
    );
  }
  // ===== B. Each cabinet
  chapter(
    boxes ? 'B · Build each cabinet on the floor' : 'B · Build the carcass, column by column',
    boxes
      ? 'Drill, pre-fit, assemble — one box at a time'
      : 'Partitions are shared: start at the left end and add one column at a time'
  );
  secs.forEach(q => {
    const lab = 'S' + (q.i + 1),
      mine = gs.filter(p => p.secs.some(s => inSecLab(s, q.i))),
      carc = mine.filter(p => p.role === 'carcass'),
      back = mine.filter(p => p.role === 'back'),
      fr_ = G.fronts.filter(f => f.sec === q.i);
    if (q.door) {
      step(
        `${lab} — the doorway`,
        '',
        mine
          .filter(p => p.role !== 'front')
          .map(p => chip(p, p.qty))
          .join(''),
        '',
        'Fit the door head and linings so the opening is square; check both diagonals are equal before fixing. The door leaf is hung last, after the cabinets around it stand.'
      );
      return;
    }
    const D_ = q.Dc,
      ybs = q.desk ? 0 : q.Pq,
      ht = Math.min(q.top(q.bL), q.top(q.bR)),
      X = d => D_ - d,
      joinsY = [],
      jMin = new Map();
    if (!q.desk) joinsY.push(ybs + tc / 2);
    else {
      const yd = +q.s.deskH - G.td / 2;
      joinsY.push(yd);
      if (q.deskShut) jMin.set(yd, G.tf + 25);
    }
    joinsY.push(ht - tc / 2);
    q.zones.forEach(zr => {
      if (!zr.top && zr.divY) {
        const yv = zr.divY + zr.divT / 2;
        joinsY.push(yv);
        if (q.upD) jMin.set(yv, q.Dh - q.upD);
      }
    });
    const jx =
      JN === 'confirmat' || JN === 'screw'
        ? (() => {
            const k = Math.ceil((D_ - 100) / 250);
            return Array.from({ length: k + 1 }, (_, j) => 50 + ((D_ - 100) * j) / k);
          })()
        : D_ > 450
          ? [37, D_ / 2, D_ - 37]
          : [37, D_ - 37];
    // a) side drilling plan
    const sideIts = [
      {
        poly: 1,
        pts: [
          [0, -ybs],
          [D_, -ybs],
          [D_, -ht],
          [0, -ht]
        ],
        fill: '#fff'
      }
    ];
    if (GRV)
      sideIts.push({
        line: 1,
        dash: 1,
        col: '#3446D6',
        pts: [
          [GO + GW / 2, -ybs],
          [GO + GW / 2, -ht]
        ]
      });
    joinsY.forEach(y =>
      jx
        .map(d => Math.max(d, (jMin.get(y) || 0) + 37))
        .filter((d, ix, a) => a.indexOf(d) === ix)
        .forEach(d => {
          sideIts.push({ dot: 1, r: JN === 'confirmat' ? 7 : 5, pts: [[X(d), -y]], fill: '#fff' });
          if (FJ.dowel)
            [-32, 32].forEach(o => {
              const dd = d + o;
              if (dd > 20 && dd < D_ - 20) sideIts.push({ dot: 1, r: 6, pts: [[X(dd), -y]], fill: '#F2E3C6' });
            });
        })
    );
    let pins = 0;
    const PM = S.opts.pinHoles || 'rows';
    q.zones.forEach(zr => {
      if (!(zr.shelvesY || []).length) return;
      const y0 = zr.y0 + 40,
        y1 = (zr.top ? ht - tc : zr.y0 + zr.h) - 40;
      pinYs(zr, y0, y1, PM).forEach(y => {
        [37, D_ - 37 - (GRV ? GO + GW : 0)].forEach(d => sideIts.push({ dot: 1, r: 3, pts: [[X(d), -y]] }));
        pins++;
      });
    });
    let hp = 0;
    fr_
      .filter(f => f.kind === 'door' && !f.leaf && f.hinge === 'L' && f.face !== 'curtain')
      .forEach(f => {
        const ys = f.poly.map(p => p[1]),
          y0 = Math.min(...ys),
          y1 = Math.min(...f.poly.filter(p => p[1] > y0 + 1).map(p => p[1])),
          hh = y1 - y0,
          nh = hh <= 900 ? 2 : hh <= 1600 ? 3 : hh <= 2000 ? 4 : 5;
        for (let j = 0; j < nh; j++) {
          const y = y0 + 100 + ((hh - 200) * j) / Math.max(1, nh - 1);
          sideIts.push(
            {
              poly: 1,
              pts: [
                [X(37) - 16, -y - 24],
                [X(37) + 16, -y - 24],
                [X(37) + 16, -y + 24],
                [X(37) - 16, -y + 24]
              ],
              fill: '#E6EBFF'
            },
            { dot: 1, r: 3, pts: [[X(37), -y - 16]] },
            { dot: 1, r: 3, pts: [[X(37), -y + 16]] }
          );
          hp++;
        }
      });
    let rn = 0;
    fr_
      .filter(f => f.kind === 'drawer')
      .forEach(f => {
        const y = Math.min(...f.poly.map(p => p[1])) + 37;
        sideIts.push({
          line: 1,
          dash: 1,
          col: GK,
          pts: [
            [X(D_ - 20), -y],
            [X(10), -y]
          ]
        });
        rn++;
      });
    sideIts.push(
      { text: 'front edge →', pts: [[D_, -ybs + 70]], anchor: 'end', fs: 12 },
      { text: '← back', pts: [[0, -ybs + 70]], anchor: 'start', fs: 12 },
      { text: 'inside face', pts: [[D_ / 2, -(ybs + ht) / 2]], fs: 12 }
    );
    jx.forEach(d => sideIts.push({ text: f0(d), pts: [[X(d), -ht - 30]], fs: 12 }));
    joinsY.forEach(y => sideIts.push({ text: f0(y - ybs), pts: [[-14, -y + 4]], anchor: 'end', fs: 12 }));
    const legend = [`◯ ${FJ.side}`];
    if (FJ.dowel) legend.push('dowel holes Ø8 × 12, 32 mm either side');
    if (pins)
      legend.push(
        PM === 'needed'
          ? `• shelf-support holes Ø5 × 12 — only where a shelf sits (${pins * 2} per side), 37 mm in from front and back`
          : PM === 'some'
            ? `• shelf-support holes Ø5 × 12 — at each shelf plus two 32 mm steps above and below for adjusting (${pins * 2} per side)`
            : `• shelf-support rows Ø5 × 12, 32 mm pitch, 37 mm in from front and back (${pins * 2} per side)`
      );
    if (hp) legend.push('▭ hinge mounting plates: 2 × Ø5 holes 32 mm apart, 37 mm from the front edge');
    if (rn) legend.push('— runner lines, 37 mm above each drawer bottom, first screw 37 mm from the front');
    if (GRV) legend.push('blue dashed: the back groove');
    // b) top/bottom plan
    const L_ = Math.max(200, q.w),
      tbIts = [
        {
          poly: 1,
          pts: [
            [0, 0],
            [L_, 0],
            [L_, -D_],
            [0, -D_]
          ],
          fill: '#fff'
        }
      ];
    if (GRV)
      tbIts.push({
        line: 1,
        dash: 1,
        col: '#3446D6',
        pts: [
          [0, -(D_ - GO - GW / 2)],
          [L_, -(D_ - GO - GW / 2)]
        ]
      });
    jx.forEach(d =>
      [34, L_ - 34].forEach(x => {
        if (JN === 'minifix') tbIts.push({ dot: 1, r: (15 / 2) * 1.6, pts: [[x, -d]], fill: '#fff' });
        tbIts.push({
          line: 1,
          sw: 2.4,
          pts:
            x < L_ / 2
              ? [
                  [0, -d],
                  [JN === 'minifix' ? x : 28, -d]
                ]
              : [
                  [L_, -d],
                  [JN === 'minifix' ? x : L_ - 28, -d]
                ]
        });
      })
    );
    tbIts.push({ text: 'front edge', pts: [[L_ / 2, 40]], fs: 12 });
    jx.forEach(d => tbIts.push({ text: f0(d), pts: [[-14, -d + 4]], anchor: 'end', fs: 12 }));
    // c) prefit
    const prefit = [];
    if (JN === 'minifix') prefit.push(`screw ${joinsY.length * jx.length * 2} Minifix bolts into the sides`);
    if (FJ.dowel)
      prefit.push(
        `tap ${joinsY.length * jx.length * 2 * (JN === 'minifix' ? 1 : 2)} dowels into the panel edges${JN === 'dowel' ? ' with glue' : ''}`
      );
    if (hp)
      prefit.push(
        `screw ${hp * 2} hinge mounting plates on (left side ${hp}, right side to match the right-hand doors)`
      );
    if (rn) prefit.push(`screw ${rn} runner pair${rn > 1 ? 's' : ''} on along the lines`);
    if (!prefit.length) prefit.push('nothing to pre-fit for this box');
    // d) assembly, one move per picture: grey = already in place, black = the part you add now
    const x0 = q.bL,
      x1 = q.bR,
      yb = q.desk ? 0 : q.Pq,
      D = q.Dc,
      topL = q.top(x0),
      topR = q.top(x1),
      tp = x => topL + ((topR - topL) * (x - x0)) / (x1 - x0 || 1),
      ix0 = x0 + tc,
      ix1 = x1 - tc,
      bk = GRV ? D - GO - GW : D - tb,
      divs = q.zones.filter(zr => !zr.top && zr.divY),
      M_ = Math.max(260, q.w * 0.4);
    const sideP = carc.find(p => /side|Partition|End panel/i.test(p.type)),
      nS_ = G.secs.length,
      labL = boxes ? `${lab} left` : q.i === 0 ? 'left end' : `S${q.i}|S${q.i + 1}`,
      labR = boxes ? `${lab} right` : q.i === nS_ - 1 ? 'right end' : `S${q.i + 1}|S${q.i + 2}`,
      sideL = gs.find(p => p.role === 'carcass' && p.secs.includes(labL)) || sideP,
      sideR = gs.find(p => p.role === 'carcass' && p.secs.includes(labR)) || sideP,
      grown = !boxes && q.i > 0 && !!G.secs[q.i - 1] && !G.secs[q.i - 1].panel && !G.secs[q.i - 1].door,
      botP = carc.find(p => /^Bottom/.test(p.type)),
      topP = carc.find(p => /^Top/.test(p.type)),
      divP = carc.find(p => /Fixed divider|Seat board|Top \(lower|Bottom \(upper/.test(p.type));
    const G_ = { ghost: 1, fill: '#F7F7F7', shade: '#F0F0F0', topFill: '#F7F7F7' };
    const pL = (o, dx = 0) => gSlab(x0 + dx, x0 + tc + dx, yb, topL, 0, q.D, o),
      pR = (o, dx = 0) => gSlab(x1 - tc + dx, x1 + dx, yb, topR, 0, q.D, o),
      pB = (o, dy = 0, dx = 0) => (q.desk ? [] : gSlab(ix0 + dx, ix1 + dx, yb + dy, yb + tc + dy, 0, D, o)),
      pT = (o, dy = 0) =>
        gSlab2(
          ix0,
          ix1,
          x => tp(x) - tc + dy,
          x => tp(x) + dy,
          0,
          D,
          o
        ),
      pK = (o, dy = 0) =>
        GRV
          ? gSlab(
              ix0 + 4,
              ix1 - 4,
              yb + tc - 9 + dy,
              0,
              bk,
              bk + tb,
              Object.assign({ top: x => tp(x) - tc + 9 + dy }, o)
            )
          : gSlab(ix0, ix1, yb, 0, D + dy, D + dy + tb, Object.assign({ top: x => tp(x) }, o)),
      pD = (o, dz = 0) => divs.flatMap(zr => gSlab(ix0, ix1, zr.divY, zr.divY + zr.divT, dz, D + dz, o));
    const scr = (xs, y, n) => {
      const r = [];
      jx.forEach(d =>
        r.push({ line: 1, dash: 1, pts: [obl(xs, y, d), obl(xs + (xs < (x0 + x1) / 2 ? -140 : 140), y, d)] })
      );
      return r;
    };
    const cap = t => ({ text: t, pts: [obl((x0 + x1) / 2, yb - 200, 0)], fs: 13 });
    const nJ = jx.length;
    const frames = [];
    const deskP = q.desk ? gs.find(p => p.type === 'Desk top' && p.secs.some(s_ => inSecLab(s_, q.i))) : null,
      jv = JN === 'dowel' ? 'Glue and dowel' : JN === 'minifix' ? 'Cam-lock' : 'Screw';
    frames.push({
      t: q.desk
        ? `${jv} the desk top${deskP ? ` (${deskP.id})` : ''} to the ${grown ? 'partition that already stands' : 'left side'}${sideL ? ` (${sideL.id})` : ''}, its top face ${f0(+q.s.deskH)} mm from the floor`
        : `${jv} the bottom${botP ? ` (${botP.id})` : ''} to the ${grown ? 'partition that already stands' : 'left side'}${sideL ? ` (${sideL.id})` : ''}`,
      its: [
        ...pL({}),
        ...(sideL ? [gLab([x0, topL * 0.7, 0], sideL.id)] : []),
        ...pB({}, 0, M_),
        gArrow([ix1 + M_ - 40, yb + tc / 2, D / 2], [ix1 + 40, yb + tc / 2, D / 2]),
        ...scr(x0, yb + tc / 2),
        { text: `${nJ}× ${FJ.short}`, pts: [obl((x0 + x1) / 2 + M_ / 2, yb - 140, 0)], fs: 13 },
        ...(botP ? [gLab([ix1 + M_ - 60, yb + tc, 0], botP.id)] : [])
      ]
    });
    if (divs.length)
      frames.push({
        t: `Fixed divider${divs.length > 1 ? 's' : ''}${divP ? ` (${divP.id})` : ''} into the left side`,
        its: [
          ...pL(G_),
          ...pB(G_),
          ...pD({}, -M_ * 0.9),
          gArrow([(ix0 + ix1) / 2, divs[0].divY + tc, -M_ * 0.9 + 20], [(ix0 + ix1) / 2, divs[0].divY + tc, -40]),
          ...divs.flatMap(zr => scr(x0, zr.divY + zr.divT / 2)),
          { text: `${nJ * divs.length}× ${FJ.short}`, pts: [obl((x0 + x1) / 2, yb - 140, 0)], fs: 13 },
          ...(divP ? [gLab([ix1 - 40, divs[0].divY + tc, -M_ * 0.9], divP.id)] : [])
        ]
      });
    if (GRV)
      frames.push({
        t: `Slide the back${back[0] ? ` (${back[0].id})` : ''} down into the grooves`,
        its: [
          ...pK({}, M_ * 1.1),
          ...pL(G_),
          ...pB(G_),
          ...pD(G_),
          ...(back[0] ? [gLab([(ix0 + ix1) / 2, (yb + tp(ix0)) / 2 + M_ * 1.1, bk], back[0].id)] : []),
          gArrow(
            [(ix0 + ix1) / 2, tp((ix0 + ix1) / 2) + M_ * 1.1 - 60, bk],
            [(ix0 + ix1) / 2, tp((ix0 + ix1) / 2) + 60, bk]
          )
        ]
      });
    frames.push({
      t: `Fit the ${boxes ? 'right side' : q.i === nS_ - 1 ? 'right end panel' : 'next partition'}${sideR ? ` (${sideR.id})` : ''}`,
      its: [
        ...(GRV ? pK(G_) : []),
        ...pL(G_),
        ...pB(G_),
        ...pD(G_),
        ...pR({}, M_),
        gArrow([x1 + M_ - 60, (yb + topR) / 2, D / 2], [x1 + 30, (yb + topR) / 2, D / 2]),
        ...scr(x1 + M_, yb + tc / 2),
        ...divs.flatMap(zr => scr(x1 + M_, zr.divY + zr.divT / 2)),
        { text: `${nJ * (1 + divs.length)}× ${FJ.short}`, pts: [obl((x0 + x1) / 2 + M_ / 2, yb - 140, 0)], fs: 13 },
        ...(sideR ? [gLab([x1 + M_, topR * 0.7, 0], sideR.id)] : [])
      ]
    });
    frames.push({
      t: `Put the top${topP ? ` (${topP.id})` : ''} on`,
      its: [
        ...(GRV ? pK(G_) : []),
        ...pL(G_),
        ...pB(G_),
        ...pD(G_),
        ...pR(G_),
        ...pT({}, M_ * 0.8),
        gArrow(
          [(ix0 + ix1) / 2, tp((ix0 + ix1) / 2) + M_ * 0.8 - tc, D / 2],
          [(ix0 + ix1) / 2, tp((ix0 + ix1) / 2) + 30, D / 2]
        ),
        ...scr(x0, Math.min(topL, topR) - tc / 2),
        ...scr(x1, Math.min(topL, topR) - tc / 2),
        { text: `${nJ * 2}× ${FJ.short}`, pts: [obl((x0 + x1) / 2, yb - 140, 0)], fs: 13 },
        ...(topP ? [gLab([ix1, tp(ix1) + M_ * 0.8, 0], topP.id)] : [])
      ]
    });
    if (!GRV)
      frames.push({
        t: `Nail the back${back[0] ? ` (${back[0].id})` : ''} on`,
        its: [
          ...pL(G_),
          ...pB(G_),
          ...pD(G_),
          ...pR(G_),
          ...pT(G_),
          ...pK({}, M_ * 0.8),
          gArrow([(ix0 + ix1) / 2, (yb + topL) / 2, D + M_ * 0.8], [(ix0 + ix1) / 2, (yb + topL) / 2, D + 40])
        ]
      });
    frames.push({
      t: 'Check it is square: both diagonals equal',
      its: [
        ...(GRV ? pK(G_) : []),
        ...pL(G_),
        ...pB(G_),
        ...pD(G_),
        ...pR(G_),
        ...pT(G_),
        { line: 1, dash: 1, col: '#3446D6', sw: 2, pts: [obl(x0, yb, 0), obl(x1, tp(x1), 0)] },
        { line: 1, dash: 1, col: '#3446D6', sw: 2, pts: [obl(x1, yb, 0), obl(x0, tp(x0), 0)] },
        { text: '=', pts: [obl((x0 + x1) / 2 - 60, (yb + tp((x0 + x1) / 2)) / 2 + 80, 0)], fs: 26 },
        { text: '=', pts: [obl((x0 + x1) / 2 + 60, (yb + tp((x0 + x1) / 2)) / 2 + 80, 0)], fs: 26 }
      ]
    });
    // exploded view of this box: every part pulled off, numbered like the cut list
    const E_ = Math.max(240, Math.min(520, q.w * 0.55)),
      shP = mine.find(p => p.role === 'shelf'),
      frP = mine.filter(p => p.role === 'front'),
      ts_ = shP ? shP.t : tc;
    const FX = q.bR - q.bL + E_ * 1.35;
    const exBack = GRV
      ? gSlab(ix0 + 4, ix1 - 4, yb + tc - 9, 0, bk + E_ * 1.5, bk + tb + E_ * 1.5, {
          top: x => tp(x) - tc + 9,
          fill: '#F4EFE4'
        })
      : gSlab(ix0, ix1, yb, 0, D + E_ * 1.5, D + tb + E_ * 1.5, { top: x => tp(x), fill: '#F4EFE4' });
    const exSh = q.zones.flatMap(zr =>
      (zr.shelvesY || []).flatMap(v =>
        gSlab(v[1] ?? ix0, v[2] ?? ix1, v[0], v[0] + ts_, 30, D - 30, { fill: '#FBF7EE' })
      )
    );
    const exFr = fr_
      .filter(f => f.kind === 'door' || f.kind === 'drawer')
      .flatMap(f => {
        const xs = f.poly.map(p => p[0]),
          ys = f.poly.map(p => p[1]);
        return gSlab(
          Math.min(...xs) - FX,
          Math.max(...xs) - FX,
          Math.min(...ys),
          Math.max(...ys),
          -E_ * 0.5 - G.tf,
          -E_ * 0.5,
          { fill: '#EEF1FF' }
        );
      });
    const exIts = [
      ...exBack,
      ...pL({}, -E_ * 0.8),
      ...pB({}, -E_ * 0.55),
      ...pD({}),
      ...exSh,
      ...pT({}, E_ * 0.55),
      ...pR({}, E_ * 0.8),
      ...exFr,
      ...(sideL && sideR
        ? [gLab([x0 - E_ * 0.8, topL * 0.55, 0], sideL.id), gLab([x1 + E_ * 0.8, topR * 0.55, 0], sideR.id)]
        : []),
      ...(botP && !q.desk ? [gLab([(ix0 + ix1) / 2, yb - E_ * 0.55, 0], botP.id)] : []),
      ...(topP ? [gLab([(ix0 + ix1) / 2, tp((ix0 + ix1) / 2) + E_ * 0.55, 0], topP.id)] : []),
      ...(divP && divs.length ? [gLab([ix1 - 30, divs[0].divY + tc, 0], divP.id)] : []),
      ...(back[0] ? [gLab([(ix0 + ix1) / 2, (yb + tp(ix0)) * 0.6, bk + E_ * 1.5], back[0].id)] : []),
      ...(shP && exSh.length
        ? [gLab([ix0 + 60, q.zones.find(zr => (zr.shelvesY || []).length).shelvesY[0][0] + ts_, 30], shP.id)]
        : []),
      ...(frP.length && exFr.length
        ? [
            {
              text: frP.length > 1 ? `fronts ${frP[0].id}–${frP[frP.length - 1].id}` : `front ${frP[0].id}`,
              pts: [obl((x0 + x1) / 2 - FX, yb - 150, -E_ * 0.5)],
              fs: 13
            }
          ]
        : [])
    ];
    const exHTML = `<div class="gsub wide gexpl"><span class="gsl">✱</span>${gScene(exIts, { w: 640, pad: 34 })}<p><b>Exploded view of ${lab}.</b> Every part of this box pulled apart, with its cut-list number: back, two sides, ${q.desk ? '' : 'bottom, '}top${divs.length ? ', fixed divider' + (divs.length > 1 ? 's' : '') : ''}${exSh.length ? ', loose shelves' : ''}${exFr.length ? ' and the fronts (blue) set to the left' : ''}.</p><button type="button" class="btn sm" data-act="box3d" data-a="${q.i}">Turn this box around in 3D</button></div>`;
    const its = null;
    const frameHTML = `<div class="gframes">${frames.map((f, k) => `<div class="gframe"><span class="gsl">${k + 1}</span>${gScene(f.its, { w: 240, pad: 30 })}<p>${f.t}</p></div>`).join('')}</div>`;
    const order = !boxes
      ? `<b>Shared sides: build in place, from left to right.</b> ${grown ? `The left side of this column is the partition you fitted last (${sideL ? sideL.id : ''}) — drill it for this column from its right face.` : 'Stand the left end panel on the level line (clamp it to a batten screwed to the wall, or have a helper hold it).'} Fix the ${q.desk ? 'desk top' : 'bottom'}${joinsY.length > 2 ? ', the fixed dividers' : ''} and the top to it, ${GRV ? 'slide the back in from the open side into the grooves' : 'nail the back on later, when the whole run stands'}, then close the column with the ${q.i === nS_ - 1 ? 'right end panel' : 'next partition'}${sideR ? ` (${sideR.id})` : ''}. A partition takes joints from both faces: stagger the screws of the two columns by 32 mm so they do not meet inside the board.`
      : GRV
        ? `${q.noTilt ? `<b>Too tall to tilt upright</b> (diagonal ${f0(q.noTilt)} mm): build this box standing where it goes — stand the left side up against a helper or a clamp, fit the bottom, dividers and top to it, slide the back in from the open side, then close it with the right side. Otherwise: ` : ''}Lay the left side flat (inside up). Fit the ${q.desk ? 'desk top' : 'bottom'}${joinsY.length > 2 ? ' and the fixed dividers' : ''} into it, <b>slide the back down into the grooves</b>, then add the right side and finally the top.`
        : `Lay the left side flat, fit the ${q.desk ? 'desk top' : 'bottom'}${joinsY.length > 2 ? ' and the fixed dividers' : ''}, add the right side and the top, then square the box and nail the back on every 150 mm.`;
    const mdSides = mine.filter(p => /side|End panel|Partition/i.test(p.type)),
      mdTB = mine.filter(p => p.role === 'carcass' && !/side|End panel|Partition/i.test(p.type)),
      mdRest = mine.filter(p => !mdSides.includes(p) && !mdTB.includes(p));
    const mdOf = a => (a.length ? a.map(p => mdBlock(p)).join('') : '');
    const subs =
      exHTML +
      sub(
        'a',
        mdOf(mdSides) || gScene(sideIts, { w: 200 }),
        `<b>Drill the sides</b> as a clamped pair, inside faces up. Every hole is measured from the corner marked 0 (front edge, bottom) — X across, Y up; the hole table lists every position, size and depth. ${legend.join('; ')}. The right side is the mirror image.`
      ) +
      sub(
        'b',
        mdOf(mdTB) || gScene(tbIts, { w: 200 }),
        `<b>Drill ${q.desk ? 'the top' : 'top and bottom'}${joinsY.length > 2 ? ' and fixed dividers' : ''}</b>: ${FJ.horiz}, at ${jx.map(f0).join(' / ')} mm from the front.`
      ) +
      (mdRest.length
        ? `<div class="gsub wide"><details class="pf"><summary>Machining drawings of the other parts of this box (${mdRest.length}): shelves, backs, fronts…</summary>${mdOf(mdRest)}</details></div>`
        : '') +
      sub('c', '', `<b>Pre-fit while the panels are flat:</b> ${prefit.join('; ')}.`) +
      sub(
        'd',
        frameHTML,
        `<b>Assemble</b>, one move per picture — grey parts are already in place, black is the part you add now. ${order} ${FJ.how} Check both diagonals are equal before tightening the last joint.${q.topPts.length > 2 || Math.abs(topL - topR) > 5 ? ' The top follows the ceiling: the side tops are cut at an angle — check left from right before you start.' : ''}`,
        true
      );
    const special = mine.filter(
      p =>
        p.role !== 'skirt' &&
        !/^(Box side|Partition|End panel|Bottom|Top|Fixed divider|Back|Shelf|Door|Drawer front|Drawer box|Drawer bottom|Desk top|Plinth)/.test(
          p.type
        )
    );
    const subsX = special.length
      ? sub(
          'e',
          '',
          `<b>Then the special parts of this box:</b><br>${special.map(p => `${p.id} ${esc(p.type)}${p.qty > 1 ? ' ×' + p.qty : ''}${p.notes.length ? ' — ' + esc(p.notes.slice(0, 2).join('. ')) : ''}`).join('<br>')}`
        )
      : '';
    step(
      `${lab} — ${q.desk ? 'desk unit' : q.free ? 'freestanding unit' : 'cabinet'}`,
      '',
      [sideL, sideR]
        .filter((p, k, a_) => p && !carc.includes(p) && a_.indexOf(p) === k)
        .map(p => chip(p, 1))
        .join('') +
        carc.map(p => chip(p, p.qty)).join('') +
        (deskP ? chip(deskP, deskP.qty) : '') +
        back.map(p => chip(p, p.qty)).join('') +
        special
          .filter(p => p.role !== 'carcass' && p.role !== 'back')
          .map(p => chip(p, p.qty))
          .join(''),
      hwc(JN === 'confirmat' || JN === 'screw' ? 'screw' : 'cam', joinsY.length * jx.length * 2, FJ.short) +
        (FJ.dowel ? hwc('dowel', joinsY.length * jx.length * 2 * (JN === 'minifix' ? 1 : 2), 'dowels') : '') +
        hwc('hinge', hp * 2 || 0, 'plates') +
        hwc('runner', rn, 'runner pairs'),
      '',
      q.w > 1000 && !q.desk ? 'Wide box: assemble it close to where it will stand and lift with two people.' : '',
      subs + subsX
    );
  });
  // ===== C. Install
  chapter('C · Install', 'Wall, plinth, boxes, shelves');
  {
    const W = G.W,
      cl = [[0, G.ceilAt(0)], ...G.cps.filter(p => p.x > 0 && p.x < W).map(p => [p.x, p.y]), [W, G.ceilAt(W)]],
      its = [{ poly: 1, pts: [[0, 0], [W, 0], ...cl.slice().reverse()].map(([x, y]) => [x, -y]), fill: '#fff' }];
    secs.forEach(q =>
      its.push(
        {
          line: 1,
          dash: 1,
          pts: [
            [q.bL, 0],
            [q.bL, -q.top(q.bL)]
          ]
        },
        {
          line: 1,
          dash: 1,
          pts: [
            [q.bR, 0],
            [q.bR, -q.top(q.bR)]
          ]
        }
      )
    );
    its.push({
      line: 1,
      col: '#3446D6',
      sw: 2,
      pts: [
        [0, -G.P],
        [W, -G.P]
      ]
    });
    secs.forEach(q => its.push({ text: 'S' + (q.i + 1), pts: [[(q.bL + q.bR) / 2, -G.P - 140]], fs: 11 }));
    step(
      'Mark out the wall',
      gScene(its, { w: 520 }),
      '',
      hwc('level', 1, 'spirit level / laser'),
      `${G.P > 0 ? `Draw a level line at plinth height (${f0(G.P)} mm)` : 'Draw a level reference line 1 m above the highest point of the floor'}, mark each box: ${secs.map(q => `S${q.i + 1} at ${f0(q.lx)} mm`).join(', ')}. Mark the studs, or plan plugs${
        H.wallHang || H.brackets
          ? `. Each box hangs from its own length of hanger rail, just under its lowest top corner: ${secs
              .filter(q => !q.door && !q.free)
              .map(q => `S${q.i + 1} at ${f0(Math.min(q.top(q.bL), q.top(q.bR)) - tc - 45)} mm`)
              .join(', ')} (top of the rail, from the floor)`
          : ''
      }.${G.site && G.site.wobs.length ? ` Also mark the things on the wall: ${G.site.wobs.map(o => `${o.nm.toLowerCase()} at ${f0(o.cx)} mm`).join(', ')}. Switch the power off at the fuse box before working near sockets, and copy each socket's position onto the back panel before you cut its opening.` : ''}`
    );
  }
  {
    const pl = gs.filter(p => /^Plinth/.test(p.type));
    const L = Math.min(2400, G.W * 0.5),
      its = [];
    [[120], [L / 2], [L - 140]].forEach(([x]) =>
      its.push(...gSlab(x, x + 40, 0, G.P - 10, G.D - 200, G.D - 160, { fill: '#E4E4E4' }))
    );
    its.push(
      ...gSlab(0, 18, 0, G.P, 18, G.D - 80, { fill: '#F2F2F2' }),
      ...gSlab(L - 18, L, 0, G.P, 18, G.D - 80),
      ...gSlab(0, L, 0, G.P, 0, 18)
    );
    step(
      'Legs and plinth',
      gScene(its),
      pl.map(p => chip(p, p.qty)).join(''),
      hwc('leg', H.legs, 'adjustable legs + kick clips') + hwc('leg', H.flegs || 0, 'furniture legs'),
      H.noLegs
        ? `No adjustable legs with a ${f0(G.P)} mm plinth. ${G.P > 0 ? `Make a base frame ${f0(G.P)} mm high from two rails on edge with cross pieces every 600 mm, set back ${S.skirt.recess} mm from the front, and level it with packers before the boxes go on.` : 'The boxes stand straight on the floor: find the highest spot with a long level and pack under the other boxes until all the tops line up.'} Fix every box to the wall before loading it.`
        : `Screw the adjustable legs under every ${boxes ? 'box that has a bottom (4 per box, 6 under boxes wider than 700 mm, 50 mm in from the corners' : 'partition and end panel line (2 each, front and back, screwed under the bottom panels beside it) and 2 in the middle of columns wider than 700 mm'}; desk units stand on their sides), stand the boxes on them later and level to ${f0(G.P)} mm. The plinth boards clip on at the very end.${G.site && G.site.fD ? ` Your floor is ${f0(Math.abs(G.site.fD))} mm lower at the ${G.site.fD > 0 ? 'left' : 'right'} end: start at the high (${G.site.fD > 0 ? 'right' : 'left'}) end with the legs at ${f0(G.P)} mm and wind the others out until everything is level — up to ${f0(G.P + Math.abs(G.site.fD))} mm at the low end. The plinth boards are cut tapered to match; hold each one in place and scribe its bottom edge before the final cut.` : ''}`
    );
  }
  {
    const its = [];
    let x = 0;
    secs.slice(0, 5).forEach((q, k) => {
      its.push(...gSlab(x, x + q.w, G.P, G.P + Math.min(q.top(q.bL), 2400) - G.P, 0, G.D, { fill: '#fff' }));
      x += q.w + (k === 0 ? 160 : 0);
    });
    its.push(gArrow([secs[0].w + 150, 1200, G.D / 2], [secs[0].w + 20, 1200, G.D / 2]));
    step(
      'Place, join and fix the boxes',
      gScene(its, { w: 420 }),
      '',
      hwc('bolt', H.boxJoins * 4, 'connector bolts Ø5 (sleeve + screw)') +
        hwc('bracket', H.wallHang || H.brackets, 'cabinet hangers + wall rail') +
        hwc('level', 1, 'level'),
      `Start ${secs.some(q => q.pin != null) ? 'from the fixed column (the doorway or shaft panel) and work outwards' : 'in the lowest corner of the floor and work along the wall'}. ${boxes ? 'Level each box on its legs, clamp it to its neighbour with the fronts flush, drill Ø5 through both sides and fit the connector bolts — 4 per joint, 37 mm in from the front and back. Hang the boxes on the wall rail with the adjustable cabinet hangers (top-back corners) and tighten.' : 'With shared partitions the carcass grows in place as you build it (part B), so there are no boxes to join: keep checking level and plumb after every column, shim the legs, and fix each column to the wall through its hangers or rear rail before you start the next one.'}`,
      'Fix everything to the wall before loading it — tall units can tip over.'
    );
  }
  {
    const kp = ((G.site || {}).wobs || []).filter(o => (WOB[o.t] || {}).keep);
    if (kp.length)
      step(
        'Keep these reachable',
        '',
        '',
        '',
        kp.map(o => `<b>${esc(o.nm)}</b> — ${esc(o.bad ? 'in the way: see the design notes' : o.msg)}`).join('<br>') +
          '<br>Mark them on the back panels before you fit them, and cut the openings first.'
      );
  }
  step(
    'Weight and fixing to the wall',
    `<div class="gplan">${fixHTML(G)}</div>`,
    '',
    '',
    'Fix every box at the top-back to the wall before you load it. Heavy things go low.'
  );
  {
    const sh = gs.filter(p => p.role === 'shelf'),
      vd = gs.filter(p => p.type === 'Vertical divider');
    const ft = H.fit || [],
      pk_ = gs.filter(p => /^Runner packer/.test(p.type));
    if (sh.length || vd.length || ft.length)
      step(
        'Shelves, dividers and rails',
        '',
        sh.map(p => chip(p, p.qty)).join('') +
          vd.map(p => chip(p, p.qty)).join('') +
          pk_.map(p => chip(p, p.qty)).join(''),
        hwc('pin', H.pins, 'shelf supports Ø5') +
          H.rails.map(r => hwc('runner', 1, `rail ${r.L} mm`)).join('') +
          ft.map(f => hwc('runner', f.n, FITS[f.kind].s.toLowerCase() + ' ' + f.sec)).join(''),
        'Push the shelf supports into the pre-drilled rows and lay the shelves in. Vertical dividers go in with two dowels at the top and bottom. Wardrobe rails clip into their end sockets.' +
          (ft.length
            ? ' Inside fittings go in last, with the doors off: ' +
              [
                ...new Set(
                  ft.map(
                    f =>
                      ({
                        trouser: 'the trouser rack screws to both sides at the height you like, lowest in its level',
                        shoe: 'shoe racks screw to both sides, about 200 mm apart',
                        basket: 'basket runners screw to both sides, about 220 mm apart',
                        idrawer:
                          'for internal drawers first screw the packers flat to both sides (front edge 5 mm behind the door), then the runners onto the packers',
                        lift: 'the pull-down rail screws to both sides right under the top; check that it swings down freely before loading it'
                      })[f.kind]
                  )
                )
              ].join('; ') +
              '. Follow the drilling template that comes in the box — sizes differ per maker.'
            : '')
      );
  }
  // ===== D. Fronts
  chapter('D · Fronts', 'Drawers, doors, handles');
  {
    const mc = gs.filter(p => p.matType === 'mdfmicro' && !MC_SKIP.test(p.type));
    if (mc.length) {
      const ar = mc.reduce((a, p) => a + (Math.abs(polyArea(p.poly)) * p.qty) / 1e6, 0);
      step(
        'Microcement the panels',
        '',
        mc
          .slice(0, 40)
          .map(p => chip(p, p.qty))
          .join(''),
        '',
        `Order the microcement tinted to <b>${[...new Set(mc.map(p => FIN[p.fin]?.name || p.fin))].join('</b>, <b>')}</b> (most brands mix any RAL colour). About <b>${ar.toFixed(1)} m²</b> of visible face. Only the visible sides get microcement; the backs just get one coat of primer so the boards stay flat. Do it flat on trestles, in a dust-free room above 10 °C, <b>before</b> drilling hinge cups and fitting handles (drill the handle holes first, then coat into them). 1) Sand the MDF lightly, dust off, and roll the microcement primer on the face and edges, and one coat on the back. 2) Trowel on the <b>first base coat</b> thin, edges too, round the corners slightly so the coat does not chip; let it dry (about 4 h) and sand off the ridges. 3) Second base coat the same way. 4) Two thin <b>finish coats</b> with a steel trowel — vary the strokes for the cloudy look, and burnish the last one when it is nearly dry. 5) Seal with 2–3 coats of water-based PU varnish (matt), sanding lightly between coats. Let it cure for a week before heavy use. The cut list already makes these panels 1 mm smaller all round to leave room for the coating on the edges.`,
        'Microcement chips on sharp corners: round every edge to about 2 mm before you start, and test your colour and trowel strokes on an offcut first.'
      );
    }
  }
  if (dr || gs.some(p => /drawer box/i.test(p.type))) {
    const its = [...gSlab(0, 500, 0, 160, 60, 520, { fill: '#fff' }), ...gSlab(0, 520, 0, 180, 0, 18)];
    its.push({ line: 1, sw: 3, pts: [obl(-8, 60, 40), obl(-8, 60, 560)] }, gArrow([250, 90, 700], [250, 90, 540]));
    step(
      'Drawers',
      gScene(its),
      gs
        .filter(p => /drawer (front|box|bottom)/i.test(p.type))
        .map(p => chip(p, p.qty))
        .join(''),
      Object.entries(H.slides)
        .map(([l, c]) => hwc('runner', c, `full-extension runners ${l} mm`))
        .join(''),
      (S.opts.hw || {}).brand === 'blumeco'
        ? '<b>Build each drawer box:</b> glue and screw the inner front and the back between the two sides, check the diagonals are equal, then glue and nail or screw the bottom on underneath — it holds the box square. Screw the drawer part of each roller runner under the lower edge of the sides, flush with the front, and hook the box onto the cabinet runners (tilt it in, wheels behind wheels). <b>Fronts:</b> hold each show front in place with 3 mm spacers around it and screw it on from inside the box through the inner front with 4 screws; slotted holes let you adjust until all gaps are the same.'
        : '<b>Build each drawer box:</b> glue and screw (or dowel) the inner front and the back between the two sides, slide the bottom into the grooves from the back, check the diagonals are equal and screw the bottom up into the back piece. Notch the back of the box and drill the hook holes exactly as the runner’s drilling sheet shows, screw the locking devices under the front corners, and push the box onto the runners until it clicks. <b>Fronts:</b> hold each show front in place with 3 mm spacers around it and screw it on from inside the box through the inner front with 4 screws; adjust until all gaps are the same.'
    );
  }
  if (H.hinges || H.slide.length) {
    const its = [...gSlab(0, 450, 0, 900, 0, 18)];
    its.push(
      { dot: 1, r: 6, pts: [obl(40, 120, 18)], fill: '#fff' },
      { dot: 1, r: 6, pts: [obl(40, 780, 18)], fill: '#fff' },
      gArrow([500, 450, 9], [600, 450, 9]),
      gArrow([225, 950, 9], [225, 1060, 9]),
      gArrow([500, 700, 9], [560, 700, -90])
    );
    step(
      'Doors',
      gScene(its),
      gs
        .filter(p => /door/i.test(p.type) && p.role === 'front')
        .map(p => chip(p, p.qty))
        .join(''),
      hwc(
        'hinge',
        H.hinges,
        (S.opts.hw || {}).brand === 'generic'
          ? 'Clip-top 110° full overlay'
          : (S.opts.hw || {}).brand === 'blumeco'
            ? 'Blum MODUL slide-on hinges'
            : 'Blum CLIP top hinges'
      ) + H.slide.map(r => hwc('runner', 1, `sliding track ${r.L} mm`)).join(''),
      `Drill the Ø35 × 13 mm hinge cups 4 mm in from the door edge (cup centre ≈ 21.5 mm), about 100 mm from the top and bottom — every door's exact cup positions are in its drawing under Shaped parts and cut-list note — press the hinges in and clip them onto the plates. Adjust with the three screws — sideways, up/down, in/out — until every gap is ${+S.opts.gap || 3} mm.`
    );
  }
  const hc = Object.entries(H.handles)
    .filter(([k]) => k !== 'none')
    .reduce((a, [, c]) => a + c, 0);
  if (hc)
    step(
      'Handles',
      '',
      '',
      hwc('drill', hc, 'handles'),
      `Make a drilling template from scrap so every handle lands in the same place. ${['hole', 'slot', 'groove'].includes(S.opts.handle) ? 'Your handles are cut into the fronts: drill or rout them from the drawings under Shaped parts before the fronts go on, from the face side into scrap held behind — there is no hardware to fit.' : 'Drill from the front into scrap held behind, to avoid break-out.'}${H.handles.none ? ` ${H.handles.none} front${H.handles.none > 1 ? 's get' : ' gets'} a push-to-open latch instead.` : ''}`
    );
  // ===== E. Finish
  chapter('E · Finish', 'Skirts, light, the last details');
  const sk = gs.filter(p => p.role === 'skirt' && !/^Plinth/.test(p.type));
  if (sk.length) {
    const its = [...gSlab(0, 1400, 0, 300, 0, 18, { top: x => 220 + x * 0.12 })];
    its.push(
      { line: 1, dash: 1, pts: [obl(0, 300, -30), obl(1400, 468, -30)] },
      { text: 'scribe', pts: [obl(700, 430, -30)], fs: 11 }
    );
    step(
      'Top and side closing strips',
      gScene(its),
      sk.map(p => chip(p, p.qty)).join(''),
      hwc('pencil', 1, 'compass') + hwc('saw', 1, 'jigsaw'),
      `Hold each closing strip in place, run a compass along the ceiling or wall, cut to the line and screw it from inside the boxes. The closing strips include ${S.skirt.scribe || 0} mm extra for this.${
        G.site && (G.site.lnL || G.site.lnR)
          ? ` The side walls are out of plumb (${[
              [G.site.lnL, 'left'],
              [G.site.lnR, 'right']
            ]
              .filter(a => a[0])
              .map(([l, sd]) => `${sd} ${f0(Math.abs(l))} mm ${l > 0 ? 'wider' : 'narrower'} at the top`)
              .join(
                ', '
              )}), so the side closing strips are cut tapered — check each one against the wall before the final cut.`
          : ''
      }${G.site && G.site.skb ? ` Skirting board: take it off the wall behind the cabinet (best), or the boxes stand ${f0(G.site.skb.t)} mm off the wall; the side closing strips are notched ${f0(G.site.skb.t)} × ${f0(G.site.skb.h)} mm to fit over it.` : ''}${G.P > 0 ? (H.noLegs ? ' Then screw the plinth boards to the base frame.' : ' Then clip the plinth boards on.') : ''}`
    );
  }
  const ex = [];
  if (H.led.length)
    ex.push(
      `${hwc('light', H.led.length, 'LED strips')} Stick the aluminium profiles in and run the cables behind the back${GRV ? ' (the 18 mm gap is made for this)' : ''} to the driver.`
    );
  if (H.cane.length || H.glass.length)
    ex.push(
      'Fit the cane (soaked — it shrinks tight as it dries) and the fluted glass into the rebates from the back, held with small beads.'
    );
  if (H.fabric.length || H.curtain.length || H.cushion.length)
    ex.push(
      [
        H.fabric.length ? 'Wrap the fabric over the speaker frames and staple it at the back' : '',
        H.curtain.length ? 'hang the curtains on their tracks' : '',
        H.cushion.length ? 'lay in the seat cushions' : ''
      ]
        .filter(Boolean)
        .join('; ') + '.'
    );
  if (G.screen)
    ex.push(
      `<b>Projector screen drawer:</b> columns S${G.screen.cols[0] + 1}–S${G.screen.cols[1] + 1} stop ${f0(G.screen.boxH)} mm lower than their neighbours. Stand the two housing ends on them, screw the housing top on, and fit one runner to each end. Build the drawer (two sides, carrier board, long front), screw the cassette brackets under the carrier board so the middle of the cassette is ${f0(12 + G.screen.cas / 2)} mm behind the front, hang the ${G.screen.diag}″ screen and plug it in. Set the stop so the drawer comes out ${f0(G.screen.pull)} mm — then the cloth clears the doors${G.screen.hProj ? ' and handles' : ''} by about 15 mm.`
    );
  if ((H.dog || []).length)
    ex.push(
      '<b>Dog den:</b> seal the inside edges with clear varnish, lay the mat and cushion in, and sand the doorway edge smooth and round.'
    );
  if (G.ladder)
    ex.push(
      'Screw the ladder-rail brackets into the boxes along the rail line, hang the ladder and check it rolls the full length.'
    );
  if (ex.length) step('Finishing touches', '', '', '', ex.join('<br>'));
  step(
    'Done',
    `<div class="gdone">${elevSVG(S, G, { mini: true })}</div>`,
    '',
    '',
    'Clean the surfaces, stick on the door bumpers, and fill it up. Enjoy your Fitted.'
  );
  el.innerHTML =
    partBar() +
    `<h2>Build guide</h2><p class="lede">${S.opts.noToons ? '' : 'With <b>Bolt &amp; Pip</b>, two builders who get every step wrong first — so you don’t have to. '}Step by step, like flat-pack instructions: prepare, build each cabinet on the floor, install, fit the fronts, finish. Part numbers match the cut list and the shaped-part drawings. ${secs.length} columns · ${total} parts · about ${hours} hours of work (see “Your plan” below).</p><label class="chk" style="margin:-6px 0 14px"><input type="checkbox" data-act="toonsT" ${S.opts.noToons ? '' : 'checked'}> Show Bolt &amp; Pip</label><div class="guide">${out.join('')}</div>`;
}

function renderSheets() {
  const gs = groupsCache || groupPanels(bgeo());
  const ns = nestAll(gs);
  const el = document.getElementById('v-sheets');
  const sp = stockPlan(gs);
  let hb = '';
  if (sp.groups.length) {
    hb = `<h3>Pre-edged boards · ${sp.cfg.L} mm long</h3><p class="lede">Melamine boards with the edge band already on both long edges. Parts that fit across a board width are cut from these — just cross-cut to length, and rip where a part is narrower (the factory edge stays at the front). Saves ≈ ${sp.saved.toFixed(1)} m of edge banding.</p>`;
    sp.groups.forEach(g => {
      const L = sp.cfg.L,
        used = g.bars.reduce((a, b) => a + b.used, 0) / (g.bars.length * L);
      hb +=
        `<h3 style="font-size:14px"><span class="sw" style="background:${FIN[g.fin]?.base}"></span> ${esc(FIN[g.fin]?.name || '')} ${g.t} mm · ${g.W}×${L} · ${g.bars.length} board${g.bars.length > 1 ? 's' : ''} · ${(used * 100).toFixed(0)}% used</h3><div class="bars">` +
        g.bars
          .map(
            (b, i) =>
              `<div class="sbar" style="height:${Math.round(22 + g.W / 12)}px">${b.pl.map(c => `<span class="spc" style="left:${((c.x / L) * 100).toFixed(2)}%;width:${((c.len / L) * 100).toFixed(2)}%;background:${FIN[c.p.fin].base};color:${lum(FIN[c.p.fin].base) < 0.45 ? '#fff' : '#111'}"><i style="height:${((c.rip / g.W) * 100).toFixed(1)}%"></i><b>${c.p.id}</b><small>${f0(c.len)}${c.rip ? ` · rip ${c.rip}` : ''}</small></span>`).join('')}<em>${Math.round(L - b.used)} mm left</em></div>`
          )
          .join('') +
        `</div>`;
    });
    hb += `<p class="note">Blue lines are the factory edges. Hatched strips are ripped off the back edge and become offcuts.</p>`;
  }
  if (ui.saver && ui.saver.sig !== JSON.stringify(S)) ui.saver = null;
  const sv = `<div class="pbud" style="margin:0 0 14px"><button type="button" class="btn" data-act="saverS">${ui.saver ? 'Check again' : 'Find a depth that wastes less'}</button><span>Slightly shallower (or deeper) cabinets can fit more parts on a sheet. This tries every depth and shows the ones that save a sheet.</span></div>${ui.saver ? saverHTML() : ''}`;
  let h = `<h2>Sheets</h2>${sv}${hb}<p class="lede">A first-pass nesting estimate per material, allowing for saw kerf (${sawCfg().kerf} mm) and edge trim (${sawCfg().trim} mm). Wood finishes keep their grain along the sheet length. Use it to order material; your panel shop will optimise further.</p>`;
  ns.forEach(n => {
    const avg = n.sheets.length ? n.sheets.reduce((a, s) => a + s.used, 0) / n.sheets.length : 0;
    h += `<h3><span class="sw" style="background:${FIN[n.fin]?.base}"></span> ${esc(n.name)} mm · ${n.sh.L}×${n.sh.W} · ${n.sheets.length} sheet${n.sheets.length === 1 ? '' : 's'}</h3>`;
    if (n.over.length)
      h += `<p class="lede" style="color:var(--warn)">Too big for this sheet: ${[...new Set(n.over.map(p => p.id + ' ' + p.type + ' (' + f0(p.L) + '×' + f0(p.Wd) + ')'))].join(', ')}. Pick a larger sheet or plan a joint.</p>`;
    h +=
      '<div class="sheets">' +
      n.sheets
        .map((s, i) => {
          const L = n.sh.L,
            Wd = n.sh.W,
            fs = Math.max(40, L / 50);
          let svg = `<svg viewBox="0 0 ${L} ${Wd}" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Mono, monospace"><rect width="${L}" height="${Wd}" style="fill:var(--surface);stroke:var(--ink3)" stroke-width="6"/>`;
          s.pl.forEach(c => {
            const p = c.p;
            const poly = c.rot ? p.poly.map(([x, y]) => [y, p.w - x]) : p.poly;
            const ph = c.ph;
            svg += `<rect x="${c.x}" y="${c.y}" width="${c.pw}" height="${c.ph}" fill="none" style="stroke:var(--line)" stroke-width="3"/>`;
            svg += `<polygon points="${poly.map(([x, y]) => `${(c.x + x).toFixed(1)},${(c.y + ph - y).toFixed(1)}`).join(' ')}" fill="${FIN[p.fin].base}" stroke="rgba(0,0,0,.45)" stroke-width="4"/>`;
            const f = Math.min(fs, c.ph * 0.45, c.pw / 3.2);
            if (f > 12)
              svg += `<text x="${c.x + c.pw / 2}" y="${c.y + c.ph / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${f}" fill="${lum(FIN[p.fin].base) < 0.45 ? '#fff' : '#111'}">${p.id}</text>`;
          });
          svg += '</svg>';
          return `<div class="sheet">${svg}<p>Sheet ${i + 1} · ${s.pl.length} parts · ${(s.used * 100).toFixed(0)}% used</p></div>`;
        })
        .join('') +
      '</div>';
    if (n.sheets.length) h += `<p class="note">Average yield ${(avg * 100).toFixed(0)}%.</p>`;
  });
  el.innerHTML = partBar() + h;
}
