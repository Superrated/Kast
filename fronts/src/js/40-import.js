/* ==== 40-import.js ====
   Read an IKEA list — the planner's item list, the shopping cart, an order confirmation, or typed by hand —
   and turn every PAX frame, METOD cabinet and BESTÅ frame into a cabinet. Everything else (doors, hinges,
   legs, drawers) is skipped, but IKEA doors and drawer fronts are counted so we can compare.

   Copied text comes in two shapes, and both work:
     one item per line      PAX Wardrobe frame, white, 100x58x236 cm   2 pcs
     one item over lines    PAX
                            Wardrobe frame, white, 100x58x236 cm
                            € 95
                            2
   A new item starts at a line that begins with an IKEA name in capitals (PAX, METOD / MAXIMERA, KOMPLEMENT …)
   or names one of the three systems; lines in between belong to the item above.
   English, Dutch, French and German words are understood. Sizes are width × depth × height in cm
   ("cm" may be left out); with two numbers the second is the height, unless it is clearly a depth.
   METOD cabinets that come with drawers or doors ("with 3 drawers", "2 fronts/4 drawers", "met 2 deuren")
   get the matching front layout.
*/
const IMPORT_EXAMPLE = `PAX Wardrobe frame, white, 100x58x236 cm   2 pcs
PAX Wardrobe frame, white, 50x58x236 cm   1 pcs
KOMPLEMENT Hinge with damper, 4 pack   3
METOD / MAXIMERA Base cabinet with 3 drawers, white/Voxtorp, 60x60x80 cm   Qty: 1
METOD Base cabinet frame, white, 80x60x80 cm   Qty: 2
METOD Wall cabinet with 2 doors, white, 80x37x80 cm   2
METOD High cabinet frame, white, 60x60x200 cm   1
BESTÅ Frame, white, 120x40x38 cm   1`;

const IMP = {
  frame:
    /FRAME|CABINET|CARCASS|STOMME|KORPUS|CORPS|CAISSON|OMBOUW|ONDERKAST|BOVENKAST|HOGE ?KAST|KASTFRAME|KAST\b|SCHRANK|ÉLÉMENT|ELEMENT|ÉLT\b|ELT\b|ARMOIRE|BENCH|BANC|MEUBLE|UNIT\b/,
  // words that make the head of the line something else than a frame
  other:
    /\b(DOORS?|DEUR(EN)?|PORTES?|TÜR(EN)?|FRONTS?|FRONTEN|FAÇADES?|FACADES?|HINGES?|SCHARNIER(EN)?|CHARNIÈRES?|LEGS?|POOT|POTEN|PIEDS?|FÜSSE|PLINTH|PLINT|SOCLE|SOCKEL|SHELF|SHELVES|PLANK(EN)?|TABLETTES?|EINLEGEBODEN|RAILS?|KNOBS?|HANDLES?|GREPEN?|GREEP|POIGNÉES?|GRIFFE?|COVER PANEL|DEKPANEEL|PANNEAU|ABDECKSEITE|DECO STRIP|WORKTOP|COUNTERTOP|WERKBLAD|PLAN DE TRAVAIL|DRAWERS?|LADES?|LADEN|TIROIRS?|SCHUBLADEN?|INTERIOR|ORGANI[SZ]ER|MIRROR|SPIEGEL|LIGHTING|LED)\b/,
  combo: /COMBINATION|COMBINATIE|COMBINAISON|KOMBINATION/,
  wall: /WALL|BOVENKAST|WANDKAST|OBERSCHRANK|WANDSCHRANK|MURAL|ÉLÉMENT HAUT|\bBOVEN\b/,
  high: /HIGH|TALL|HOGE ?KAST|HOCHSCHRANK|ARMOIRE|COLONNE/,
  doorFront:
    /\b(DOORS?|DEUR(EN)?|PORTES?|TÜR(EN)?|DRAWER FRONTS?|LADEFRONTS?|FAÇADES? DE TIROIR|SCHUBLADENFRONTS?|FRONTS?)\b/,
  depths: [20, 35, 37, 39, 40, 42, 58, 60, 61]
};

/* split the text into items */
function impBlocks(text) {
  const blocks = [];
  String(text || '')
    .replace(/ /g, ' ')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .forEach(l => {
      const starts =
        /^(\d{1,2}\s*[x×]\s+)?[A-ZÅÄÖ]{3,}(\s*\/\s*[A-ZÅÄÖ]{3,})*(\s|,|$)/.test(l) ||
        /\b(pax|metod|best[aå])\b/i.test(l);
      if (starts || !blocks.length) blocks.push([l]);
      else blocks[blocks.length - 1].push(l);
    });
  return blocks;
}
function impQty(lines) {
  const all = lines.join('  '),
    pats = [
      /^\s*(\d{1,2})\s*[x×]\s+/i,
      /(?:QTY|QUANTITY|AANTAL|ANTAL|QUANTITÉ|QTÉ|ANZAHL|MENGE)\s*[:.]?\s*(\d{1,3})/i,
      /(\d{1,3})\s*(?:PCS|PC|PIECES|PIÈCES|ST|STK|STUKS?)\.?(?:\s|$)/i,
      /(?:^|[^\d\s])\s*[x×]\s*(\d{1,2})\s*$/i
    ];
  for (const p of pats) {
    const m = all.match(p);
    if (m) return +m[1];
  }
  // a table row: a cell that is just a number (tabs or wide gaps between the columns)
  for (const l of lines) {
    const cells = l.split(/\t|\s{2,}/).map(c => c.trim());
    const q = cells.slice(1).find(c => /^\d{1,2}$/.test(c));
    if (q) return +q;
  }
  const after = all.match(/\bcm\.?\s+(\d{1,2})\s*$/i) || all.match(/\b(\d)\s*[x×]\s+(?=\d{2,3}\s*[x×])/i);
  if (after) return +after[1];
  // a line that is just a number (the quantity column), or a number at the end after a wide gap
  for (const l of lines.slice(1)) if (/^\d{1,2}$/.test(l)) return +l;
  const t = lines[0].match(/\s{2,}(\d{1,2})\s*$/);
  return t ? +t[1] : 1;
}
const impNum = s => +String(s).replace(',', '.');
/* a PAX combination's width as frames: as many 100s as fit, then a 50 or 75 (125 = 75 + 50) */
function paxSplit(w) {
  if (w < 50 || w > 600 || w % 25) return null;
  let n = Math.floor(w / 100),
    r = w - n * 100;
  const out = [];
  if (r === 25) {
    if (!n) return null;
    n--;
    out.push(75, 50);
  } else if (r) out.push(r);
  return Array(n).fill(100).concat(out);
}

function parsePlanner(text, only) {
  const found = [],
    skipped = [],
    notes = [],
    combos = [];
  let ikeaFronts = 0;
  impBlocks(text).forEach(lines => {
    const line = lines.join(' '),
      up = line.toUpperCase(),
      sys = /\bPAX\b/.test(up)
        ? 'pax'
        : /\bMETOD\b/.test(up)
          ? 'metod'
          : /\bBEST[AÅ](?![A-Z])/.test(up)
            ? 'besta'
            : null;
    // the head: the name of the thing, before its colour, size and "with …"
    const head = up.replace(/^\d{1,2}\s*[x×]\s+/, '').split(/,|\s(?:WITH|W\/|MET|AVEC|MIT|FOR|VOOR|POUR|FÜR)\s/)[0];
    const dm = line.match(/(\d{2,3}(?:[.,]\d)?)\s*[x×*]\s*(\d{2,3}(?:[.,]\d)?)(?:\s*[x×*]\s*(\d{2,3}(?:[.,]\d)?))?/);
    const qty = Math.min(impQty(lines), 30);
    if (IMP.combo.test(head)) {
      const pw = dm && sys === 'pax' ? paxSplit(impNum(dm[1])) : null;
      if (!pw || /CORNER|HOEK|ANGLE|ECK/.test(up)) {
        if (sys) combos.push(line);
        return;
      }
      const hh = impNum(dm[3] || dm[2]) > 210 ? 236 : 201;
      for (let q = 0; q < qty; q++)
        pw.forEach(w => found.push(cab('pax', 'frame', w, hh, /\bOPEN\b/.test(up) ? 'open' : 'doors')));
      notes.push(`PAX combination ${impNum(dm[1])} cm wide read as frames ${pw.join(' + ')} — check the order below.`);
      return;
    }
    const name = head.replace(/\b(PAX|METOD|BEST[AÅ])\b/g, ''),
      fm = name.match(IMP.frame),
      om = name.match(IMP.other),
      bare = !name
        .replace(
          /\d+([.,]\d)?|[x×*\/:\-]|\bCM\b|\b(BASE|WALL|HIGH|TALL|FRAME|ONDER|BOVEN|HOOG|HOGE|BAS|MURAL|PCS|ST|QTY)\b/gi,
          ''
        )
        .trim();
    const isFrame = sys && dm && ((fm && (!om || om.index > fm.index)) || (bare && !om));
    if (!isFrame) {
      if (dm && IMP.doorFront.test(head) && !/HINGE|SCHARNIER|CHARNIÈRE|SCHARNIERE/.test(up)) ikeaFronts += qty;
      if (sys || /^[A-ZÅÄÖ]{3,}/.test(lines[0])) skipped.push(lines[0]);
      return;
    }
    if (!dm) {
      notes.push(`No size found in “${lines[0].slice(0, 60)}” — add the size like 60x60x80 cm.`);
      return;
    }
    if (only && sys !== only) {
      skipped.push(lines[0]);
      return;
    }
    let kind = 'frame';
    if (sys === 'metod') kind = IMP.wall.test(up) ? 'wall' : IMP.high.test(up) ? 'high' : 'base';
    const kd = SYS[sys].kinds[kind],
      a = impNum(dm[1]),
      b = impNum(dm[2]),
      c3 = dm[3] ? impNum(dm[3]) : null;
    // width × depth × height; with two numbers the second is the height unless it is a depth
    const w = a,
      h =
        c3 != null
          ? c3
          : IMP.depths.includes(b)
            ? kd.heights[kind === 'high' ? kd.heights.length - 1 : kind === 'wall' ? 2 : 0]
            : b;
    const near = (list, v) => list.reduce((p, q) => (Math.abs(q - v) < Math.abs(p - v) ? q : p), list[0]);
    const W = near(kd.widths, w),
      H = near(kd.heights, h);
    if (Math.abs(W - w) > 2 || Math.abs(H - h) > 2)
      notes.push(
        `${SYS[sys].name} ${w}×${h} is not a standard size — read as ${W}×${H}. Check it in your cabinets below.`
      );
    const lay = impLayout(sys, kind, W, H, up);
    for (let i = 0; i < qty; i++) {
      const c = cab(sys, kind, W, H, lay || undefined);
      fixLayout(c);
      found.push(c);
    }
  });
  if (combos.length)
    notes.push(
      `${combos.length} ready-made combination${combos.length === 1 ? '' : 's'} (like PAX/FORSAND) can’t be split into frames from the name alone — paste the frame lines, or type the widths below.`
    );
  return { found, skipped, notes, ikeaFronts };
}

/* the front layout a cabinet came with, from words like "with 3 drawers", "2 fronts/4 drawers", "met 2 deuren" */
function impLayout(sys, kind, w, h, up) {
  const num = re => {
    const m = up.match(re);
    return m ? +m[1] : 0;
  };
  const nf = num(/(\d)\s*(?:FRONTS?|FRONTEN|FAÇADES?|FACES)\b/),
    nd = num(/(\d)\s*(?:HIGH\s+|LOW\s+)?(?:DRAWERS?|LADES?|LADEN|TIROIRS?|SCHUBLADEN?)\b/),
    nDoor = num(/(\d)\s*(?:DOORS?|DEUREN|PORTES|TÜREN)\b/) || (/\b(DOOR|DEUR|PORTE|TÜR)\b/.test(up) ? 1 : 0),
    hasDrawer = /\b(DRAWERS?|LADES?|LADEN|TIROIRS?|SCHUBLADEN?)\b/.test(up);
  if (sys === 'pax') return /\bOPEN\b/.test(up) ? 'open' : 'doors';
  if (sys === 'besta') return hasDrawer ? 'drawers' : null;
  if (kind === 'base') {
    if (hasDrawer && nDoor) return 'drawer_door';
    if (hasDrawer) {
      const n = nf || nd || 3;
      return n >= 4 ? 'drawers4' : n === 3 ? 'drawers3' : n === 2 ? 'drawers2' : 'drawer_door';
    }
    if (nDoor) return nDoor >= 2 && w >= 60 ? 'doors2' : 'door';
    return null;
  }
  if (kind === 'wall') return nDoor >= 2 && w >= 60 ? 'doors2' : nDoor ? 'door' : null;
  if (kind === 'high') return nDoor >= 2 && h === 200 ? 'split' : null;
  return null;
}

/* what the reader found, as a short preview with a button per system */
function impPreviewHTML(text) {
  if (!String(text || '').trim())
    return `<p class="hint">Nothing pasted yet. <button type="button" class="lnk" data-act="impEx">Try an example list</button></p>`;
  const r = parsePlanner(text),
    bySys = {};
  r.found.forEach(c => (bySys[c.sys] = bySys[c.sys] || []).push(c));
  if (!r.found.length)
    return `<p class="impbad">No PAX, METOD or BESTÅ frames in this text yet.${r.notes.length ? ' ' + esc(r.notes[0]) : ' Each item needs its name and a size, like “METOD Base cabinet frame 60x60x80 cm”.'}</p>`;
  const order = Object.keys(bySys).sort((p, q) => bySys[q].length - bySys[p].length);
  const groups = order
    .map(sys => {
      const m = new Map();
      bySys[sys].forEach(c => {
        const k = `${c.kind}|${c.w}|${c.h}|${c.layout}`;
        m.set(k, (m.get(k) || 0) + 1);
      });
      const chips = [...m.entries()]
        .map(([k, n]) => {
          const [kind, w, h, lay] = k.split('|'),
            kd = SYS[sys].kinds[kind],
            ln = (LAYOUTS[sys === 'metod' ? 'metod_' + kind : sys] || []).find(x => x[0] === lay);
          return `<span class="ichip"><b>${n}×</b> ${sys === 'metod' ? kd.label.replace(' cabinet', '') : 'Frame'} ${w}×${h}${ln && ln[0] !== 'door' && ln[0] !== 'doors' ? ` <small>${esc(ln[1].toLowerCase())}</small>` : ''}</span>`;
        })
        .join('');
      return `<div class="igrp"><div class="igh"><b>${SYS[sys].name}</b> ${bySys[sys].length} cabinet${bySys[sys].length === 1 ? '' : 's'}</div><div class="ichips">${chips}</div>
        <button type="button" class="btn ${sys === order[0] ? 'pri' : ''} sm" data-act="impUse" data-a="${sys}">Use ${order.length > 1 ? 'these ' + bySys[sys].length + ' ' + SYS[sys].name : 'these ' + bySys[sys].length} cabinet${bySys[sys].length === 1 ? '' : 's'} →</button></div>`;
    })
    .join('');
  const ours = order.length
    ? (() => {
        const n = layoutFronts(bySys[order[0]]);
        return r.ikeaFronts
          ? `<p class="hint">Your list also has ${r.ikeaFronts} IKEA door${r.ikeaFronts === 1 ? '' : 's'} and drawer fronts; these cabinets take ${n} of ours.${r.ikeaFronts !== n ? ' Check the fronts per cabinet after you use them.' : ''}</p>`
          : '';
      })()
    : '';
  return `${groups}${r.notes.map(n => `<p class="hint warn">${esc(n)}</p>`).join('')}${ours}${order.length > 1 ? '<p class="hint">One system per order for now — use one, order, then come back for the other.</p>' : ''}`;
}
function layoutFronts(cabs) {
  return cabs.reduce((n, c) => n + frontsOf(c, 0, 0).length, 0);
}
