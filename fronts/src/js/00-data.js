/* ==== 00-data.js ====
   Everything the configurator knows: the IKEA systems and their sizes, front styles, materials, colours,
   handles and prices. Sizes from IKEA's own product pages (checked Nov 2026):
     PAX    frames 50 / 75 / 100 wide, 201 / 236 high; hinged doors 50 or 25 wide (a 75 frame takes 50 + 25),
            door 49.5 × 229.4 cm on a 236 frame (195 cm on a 201 frame)
     METOD  fronts are 3 mm smaller than the cabinet both ways (39.7 × 79.7 for a 40 × 80 cabinet)
     BESTÅ  fronts 59.6 wide; 63.7 / 37.7 / 25.7 high for the 64 / 38 / 26 positions
   The range is curated: Flat or Fluted; painted in a few bold colours, oak, walnut, birch ply, fluted glass,
   and two budget boards (raw MDF, untreated birch ply). Prices are examples for the prototype.
*/
const SYS = {
  pax: {
    name: 'PAX',
    what: 'Wardrobe',
    blurb: 'Wardrobe frames 50, 75 or 100 cm wide, 201 or 236 cm high',
    kinds: { frame: { label: 'Frame', widths: [50, 75, 100], heights: [201, 236] } }
  },
  metod: {
    name: 'METOD',
    what: 'Kitchen',
    blurb: 'Base, wall and tall cabinets, 20 to 80 cm wide',
    kinds: {
      base: { label: 'Base cabinet', widths: [20, 30, 40, 60, 80], heights: [80], row: 'base' },
      high: { label: 'Tall cabinet', widths: [40, 60], heights: [140, 200], row: 'base' },
      wall: { label: 'Wall cabinet', widths: [20, 30, 40, 60, 80], heights: [40, 60, 80, 100], row: 'wall' }
    }
  },
  besta: {
    name: 'BESTÅ',
    what: 'Storage & TV',
    blurb: 'Frames 60 or 120 cm wide, 38 to 192 cm high',
    kinds: { frame: { label: 'Frame', widths: [60, 120], heights: [38, 64, 128, 192] } }
  }
};

/* how a cabinet is filled with fronts: [key, label, test(cab) → offered?] */
const LAYOUTS = {
  pax: [
    ['doors', 'Doors', () => true],
    ['open', 'No doors', () => true]
  ],
  metod_base: [
    ['door', 'Door', c => c.w <= 60],
    ['doors2', '2 doors', c => c.w >= 60],
    ['drawer_door', 'Drawer + door', c => c.w <= 60],
    ['drawers3', '3 drawers', () => true],
    ['drawers2', '2 drawers', () => true],
    ['drawers4', '4 drawers', () => true],
    ['open', 'No front', () => true]
  ],
  metod_wall: [
    ['door', 'Door', c => c.w <= 60],
    ['doors2', '2 doors', c => c.w >= 60],
    ['open', 'Open shelf', () => true]
  ],
  metod_high: [
    ['door', 'One door', () => true],
    ['split', 'Two doors stacked', c => c.h === 200],
    ['open', 'No front', () => true]
  ],
  besta: [
    ['door', 'Door(s)', () => true],
    ['drawers', 'Drawers', c => c.h <= 64],
    ['open', 'Open', () => true]
  ]
};

/* Rubio Monocoat Oil Plus 2C: one coat of hardwax oil, in four tints. mix = how much of the tint covers the wood */
const OILS = {
  pure: { name: 'Pure', blurb: 'Clear, the wood as it is', hex: '#000000', mix: 0 },
  white5: { name: 'White 5%', blurb: 'A light Nordic wash', hex: '#F4EFE7', mix: 0.38 },
  smoke5: { name: 'Smoke 5%', blurb: 'Soft grey, like weathered wood', hex: '#C9C1B6', mix: 0.42 },
  charcoal: { name: 'Charcoal', blurb: 'Near black, the grain still shows', hex: '#34302D', mix: 0.74 },
  chocolate: { name: 'Chocolate', blurb: 'Deep warm brown — the darker woods of 2027', hex: '#3E2A1E', mix: 0.58 }
};
/* side panels: none, or on the left / right / both ends of the run */
const SIDES = { none: 'None', left: 'Left', right: 'Right', both: 'Both ends' };
/* the rounded or chamfered edge on every front */
const EDGES = {
  round: { name: 'Round', blurb: '2 mm radius, soft and hard-wearing' },
  chamfer: { name: 'Chamfer', blurb: '45°, crisp; shows the ply layers as a line' }
};
function mixHex(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)),
    x = p(a),
    y = p(b);
  return (
    '#' +
    x
      .map((v, i) =>
        Math.round(v + (y[i] - v) * t)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}
/* the wood and grain colour of a material after its oil */
function woodCol(mat, oil) {
  const m = MATS[mat],
    o = (m.oil && OILS[oil]) || OILS.pure;
  return { wood: mixHex(m.wood, o.hex, o.mix), grain: mixHex(m.grain || m.wood, o.hex, o.mix * 0.75) };
}
/* the curated range: two styles … */
const STYLES = {
  flat: { name: 'Effen', en: 'flat', blurb: 'Flat and calm, the classic', f: 1 },
  fluted: { name: 'Riet', en: 'fluted', blurb: 'Rounded flutes like reeds, routed into MDF', f: 1.3, mdf: true },
  grooves: { name: 'Voeg', en: 'grooves', blurb: 'Fine V-grooves in MDF, calm and graphic', f: 1.3, mdf: true }
};
const FLUTE = {
  pitch: [
    [12, 'Fine'],
    [20, 'Classic'],
    [32, 'Bold']
  ],
  gpitch: [
    [32, 'Close'],
    [50, 'Classic'],
    [80, 'Wide']
  ],
  dir: [
    ['v', 'Up and down'],
    ['h', 'Side to side']
  ]
};

/* … a few materials (price per m² of front, both faces finished, edges included) … */
const MATS = {
  // painted by our partner spray shop; priced against other makers of IKEA fronts (Nov 2026):
  //   60×80 METOD door, painted, flat: Ogony from €111, Faktum Online €119, Bucks & Spurs ≈ €180
  //   PAX door 50×229, painted, flat: Foxstow £226 (≈ €265); bare MDF £121 (≈ €142)
  //   → €30 a front + €200/m²: a 60×80 door ≈ €125, a PAX door ≈ €257 (before handles), middle of the market
  painted: {
    mdf: true,
    name: 'Painted',
    blurb: 'Smooth matt paint in one of our colours, by our spray shop',
    rate: 200,
    paint: true
  },
  oak: {
    name: 'Oak veneer',
    blurb: 'Natural oak, hardwax oil',
    rate: 235,
    wood: '#C9A26E',
    grain: '#8F6A3C',
    oil: true
  },
  walnut: {
    name: 'Walnut veneer',
    blurb: 'Deep and warm, hardwax oil',
    rate: 295,
    wood: '#5C3A26',
    grain: '#2E1A0F',
    oil: true
  },
  birch: {
    name: 'Birch plywood',
    blurb: 'Hardwax oil, layered edge on show',
    oil: true,
    rate: 160,
    wood: '#DCC69E',
    grain: '#B89B6C',
    ply: true
  },
  // the other plywood: pine (Douglas fir / spruce) with its bold, flame-shaped grain
  pine: {
    name: 'Pine plywood',
    blurb: 'Bold flame grain, hardwax oil',
    oil: true,
    rate: 140,
    wood: '#DDBB86',
    grain: '#A86E35',
    ply: true,
    flame: true
  },
  glass: { name: 'Fluted glass', blurb: 'Reeded glass in a slim frame', rate: 340, glass: true, only: 'fluted' },
  rawmdf: {
    mdf: true,
    name: 'Raw MDF',
    blurb: 'Sanded, ready for your own paint',
    rate: 85,
    wood: '#B39874',
    budget: true,
    raw: true
  },
  rawply: {
    name: 'Untreated birch ply',
    blurb: 'No lacquer — oil, wax or paint it yourself',
    rate: 115,
    wood: '#E3D2B0',
    grain: '#C9AF84',
    ply: true,
    budget: true
  }
};
/* … the frame around fluted glass … */
const GFRAME = {
  black: { name: 'Black', hex: '#1F1F1F' },
  alu: { name: 'Aluminium', hex: '#B9BCBE' },
  oak: { name: 'Oak', hex: '#C9A26E' }
};
/* … and a short list of bold colours, each one a RAL colour so any paint shop can match it */
const COLOURS = {
  cobalt: { name: 'Cobalt', ral: '5002' },
  midnight: { name: 'Midnight', ral: '5011' },
  racing: { name: 'Racing green', ral: '6005' },
  sage: { name: 'Sage', ral: '6021' },
  mustard: { name: 'Mustard', ral: '1005' },
  terracotta: { name: 'Terracotta', ral: '8023' },
  tomato: { name: 'Tomato', ral: '3013' },
  oxblood: { name: 'Oxblood', ral: '3005' },
  plum: { name: 'Plum', ral: '4007' },
  blush: { name: 'Blush', ral: '3015' },
  chalk: { name: 'Chalk white', ral: '9010' },
  black: { name: 'Soft black', ral: '9005' },
  // the 2027 edit: green in every shade, and the warm earthy colours that go with it
  celery: { name: 'Celery', ral: '6019', trend: true },
  olive: { name: 'Olive', ral: '6013', trend: true },
  taupe: { name: 'Taupe', ral: '1019', trend: true },
  clay: { name: 'Clay', ral: '8025', trend: true },
  dusty: { name: 'Dusty blue', ral: '5014', trend: true }
};

/* RAL colours: the full list comes from Fitted at build time (names and colours for the curated list) */
const RAL = {};
/*@RAL@*/ ''.split('|').forEach(e => {
  const m = e.match(/^(\d{4}) (.+) ([0-9A-F]{6})$/);
  if (m) RAL[m[1]] = { name: m[2], hex: '#' + m[3] };
});

/* handles: price per front (handle or latch), and how they are drawn */
/* handles: three quiet wooden choices. 'push' is used internally for "no handle" (the style close-ups) */
const HANDLES = {
  knob: { name: 'Wooden knob', blurb: 'A turned mushroom knob, 38 mm', price: 16 },
  bar: { name: 'Wooden handle', blurb: 'A slim rounded rail, 160 mm', price: 24 },
  hole: { name: 'Finger hole', blurb: 'A 30 mm hole through the front, edges softened', price: 8 }
};
/* the wood of knobs and handles */
const HFIN = {
  oak: { name: 'Oak', hex: '#C9A26E' },
  walnut: { name: 'Walnut', hex: '#5C3A26' }
};

/* extras around the fronts */
const EXTRAS = {
  plinthPerM: 55, // a plinth (kick plate) in the look of the fronts, per metre of run
  filler: 35, // a filler strip in the look of the fronts, up to 10 cm wide, any height
  sampleBox: 25, // every colour and material as a 10 × 15 cm chip; the €25 comes off the order
  planCheckFrom: 0 // checking your IKEA list and every size before we cut: free
};
const PRICE = {
  perFront: 30, // cutting, edging, drilling set-up, packing
  hinge: 3, // drilling the hinge cups for the IKEA hinges
  minArea: 0.08 // m² — a small front still costs a small front
};
/* ---------- delivery: we bring it ourselves, priced by distance from the workshop ---------- */
// set this to the workshop's own postcode
const WORKSHOP_PC = '8501';
// price bands by road distance (km, one way) from the workshop; incl. VAT
const DELIVERY_BANDS = [
  [30, 45, 'Up to 30 km'],
  [80, 85, '30–80 km'],
  [150, 135, '80–150 km'],
  [9999, 185, 'Over 150 km']
];
const ROUTE_DAY_OFF = 30; // off when the customer takes the monthly route day for their region
// the middle of each Belgian postcode area (first two digits), roughly, as [lat, lon]
const PC_AREAS = {
  10: [50.85, 4.35],
  11: [50.85, 4.35],
  12: [50.84, 4.4],
  13: [50.67, 4.6],
  14: [50.6, 4.4],
  15: [50.73, 4.24],
  16: [50.8, 4.2],
  17: [50.87, 4.17],
  18: [50.93, 4.43],
  19: [50.88, 4.5],
  20: [51.22, 4.4],
  21: [51.23, 4.47],
  22: [51.17, 4.8],
  23: [51.32, 4.95],
  24: [51.19, 5.12],
  25: [51.12, 4.55],
  26: [51.17, 4.4],
  27: [51.2, 4.4],
  28: [51.03, 4.48],
  29: [51.32, 4.45],
  30: [50.88, 4.7],
  31: [50.97, 4.63],
  32: [50.98, 4.97],
  33: [50.8, 4.93],
  34: [50.75, 5.08],
  35: [50.93, 5.34],
  36: [50.97, 5.5],
  37: [50.78, 5.47],
  38: [50.82, 5.19],
  39: [51.2, 5.35],
  40: [50.63, 5.57],
  41: [50.56, 5.48],
  42: [50.65, 5.25],
  43: [50.68, 5.3],
  44: [50.6, 5.45],
  45: [50.52, 5.24],
  46: [50.7, 5.75],
  47: [50.63, 6.03],
  48: [50.59, 5.86],
  49: [50.45, 5.95],
  50: [50.47, 4.87],
  51: [50.4, 4.85],
  52: [50.45, 4.95],
  53: [50.49, 5.09],
  54: [50.35, 4.7],
  55: [50.26, 4.91],
  56: [50.2, 4.54],
  57: [50.4, 4.7],
  58: [50.4, 4.75],
  59: [50.45, 4.85],
  60: [50.41, 4.44],
  61: [50.4, 4.35],
  62: [50.48, 4.55],
  63: [50.3, 4.4],
  64: [50.05, 4.32],
  65: [50.41, 4.17],
  66: [50.0, 5.72],
  67: [49.68, 5.81],
  68: [49.92, 5.38],
  69: [50.23, 5.34],
  70: [50.45, 3.95],
  71: [50.48, 4.19],
  72: [50.45, 3.9],
  73: [50.43, 3.8],
  74: [50.5, 3.7],
  75: [50.61, 3.39],
  76: [50.51, 3.59],
  77: [50.74, 3.21],
  78: [50.63, 3.78],
  79: [50.6, 3.6],
  80: [51.21, 3.22],
  81: [51.15, 3.1],
  82: [51.15, 3.2],
  83: [51.34, 3.29],
  84: [51.22, 2.92],
  85: [50.83, 3.27],
  86: [51.03, 2.8],
  87: [50.95, 3.25],
  88: [50.95, 3.12],
  89: [50.85, 2.88],
  90: [51.05, 3.72],
  91: [51.15, 4.1],
  92: [51.03, 4.1],
  93: [50.94, 4.04],
  94: [50.83, 4.02],
  95: [50.77, 3.88],
  96: [50.75, 3.6],
  97: [50.85, 3.6],
  98: [50.98, 3.53],
  99: [51.18, 3.56]
};
/* road km from the workshop to a postcode: straight line × 1.3; null for an unknown postcode */
function deliveryKm(pc) {
  const a = PC_AREAS[String(WORKSHOP_PC).slice(0, 2)],
    b = /^\d{4}$/.test(String(pc || '')) ? PC_AREAS[String(pc).slice(0, 2)] : null;
  if (!a || !b) return null;
  const r = Math.PI / 180,
    dLat = (b[0] - a[0]) * r,
    dLon = (b[1] - a[1]) * r,
    h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 1.3);
}
/* the delivery price for a postcode: { band, price } or null when we don't know the postcode yet */
function deliveryFor(pc, routeDay) {
  const km = deliveryKm(pc);
  if (km === null) return null;
  const b = DELIVERY_BANDS.find(x => km <= x[0]);
  return { km, band: b[2], price: Math.max(0, b[1] - (routeDay ? ROUTE_DAY_OFF : 0)) };
}

const LEAD = 'about 3–4 weeks';
// painted fronts go to the spray shop: 1–2 weeks longer
const LEAD_PAINTED = 'about 4–6 weeks';
const leadOf = L => (L.fronts.some(f => MATS[lookOf(f).mat].paint) ? LEAD_PAINTED : LEAD);
const colHex = k => (RAL[(COLOURS[k] || COLOURS.chalk).ral] || {}).hex || '#eeeeee';
