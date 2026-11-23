/* ==== 40-import.js ====
   Read the item list from the IKEA planner (copied as text, or typed): every line with a PAX, METOD or BESTÅ
   frame/cabinet and its size becomes a cabinet. Doors, hinges, legs and the rest are skipped.
   Understands quantities like "2 x …", "2× …", "… 2 pcs", "Qty: 2", and sizes like 60x60x80 cm (width first).
*/
const IMPORT_EXAMPLE = `PAX Wardrobe frame, white, 100x58x236 cm   2 pcs
PAX Wardrobe frame, white, 50x58x236 cm   1 pcs
KOMPLEMENT Hinge with damper, 4 pack   3
METOD Base cabinet frame, white, 60x60x80 cm   Qty: 2
METOD Wall cabinet frame, white, 40x37x80 cm   1
METOD High cabinet frame, white, 60x60x200 cm   1
BESTÅ Frame, white, 120x40x38 cm   1`;

function parsePlanner(text, only) {
  const found = [],
    skipped = [];
  String(text || '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .forEach(line => {
      const up = line.toUpperCase(),
        sys = /\bPAX\b/.test(up)
          ? 'pax'
          : /\bMETOD\b/.test(up)
            ? 'metod'
            : /\bBEST[AÅ](?![A-Z])/.test(up)
              ? 'besta'
              : null;
      const isFrame =
        /FRAME|CABINET|STOMME|KORPUS|CORPS|KAST/.test(up) &&
        !/DOOR|FRONT|HINGE|LEG|PLINTH|SHELF|RAIL|DRAWER(?! UNIT)/.test(up.replace(/CABINET FRAME/, ''));
      const dm = line.match(/(\d{2,3})\s*[x×]\s*(\d{2,3})(?:\s*[x×]\s*(\d{2,3}))?\s*cm/i);
      if (!sys || !isFrame || !dm) {
        if (sys && !isFrame) skipped.push(line);
        return;
      }
      if (only && sys !== only) {
        skipped.push(line);
        return;
      }
      const a = +dm[1],
        c3 = dm[3] ? +dm[3] : null;
      // width × depth × height (IKEA's order); with two numbers: width × height
      const w = a,
        h = c3 != null ? c3 : +dm[2];
      let kind = 'frame';
      if (sys === 'metod') kind = /WALL/.test(up) ? 'wall' : /HIGH|TALL/.test(up) ? 'high' : 'base';
      const kd = SYS[sys].kinds[kind];
      const W = kd.widths.reduce((b, v) => (Math.abs(v - w) < Math.abs(b - w) ? v : b), kd.widths[0]),
        Hh = kd.heights.reduce((b, v) => (Math.abs(v - h) < Math.abs(b - h) ? v : b), kd.heights[0]);
      const q = +(
        (line.match(/^(\d+)\s*[x×]\s+/i) || [])[1] ||
        (line.match(/(?:qty|quantity|antal|aantal)\s*:?\s*(\d+)/i) || [])[1] ||
        (line.match(/(\d+)\s*(?:pcs|pc|st|stk|pieces|x)\s*$/i) || [])[1] ||
        (line.match(/\s(\d{1,2})\s*$/) || [])[1] ||
        1
      );
      for (let i = 0; i < Math.min(q, 20); i++) found.push(cab(sys, kind, W, Hh));
    });
  return { found, skipped };
}
