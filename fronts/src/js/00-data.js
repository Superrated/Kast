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

/* the curated range: two styles … */
const STYLES = {
  flat: { name: 'Flat', blurb: 'Clean and calm', f: 1 },
  fluted: { name: 'Fluted', blurb: 'Rounded flutes, routed into MDF', f: 1.3, mdf: true },
  grooves: { name: 'Grooves', blurb: 'Fine V-grooves in MDF, calm and graphic', f: 1.3, mdf: true },
  scallop: { name: 'Scallop', blurb: 'A wavy top edge, playful', f: 1.35 }
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
  oak: { name: 'Oak veneer', blurb: 'Natural oak, oiled', rate: 235, wood: '#C9A26E', grain: '#8F6A3C' },
  walnut: { name: 'Walnut veneer', blurb: 'Deep and warm, oiled', rate: 295, wood: '#5C3A26', grain: '#2E1A0F' },
  birch: {
    name: 'Birch plywood',
    blurb: 'Clear lacquer, layered edge on show',
    rate: 160,
    wood: '#DCC69E',
    grain: '#B89B6C',
    ply: true
  },
  // the other plywood: pine (Douglas fir / spruce) with its bold, flame-shaped grain
  pine: {
    name: 'Pine plywood',
    blurb: 'Bold flame grain, warm and honest',
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
  black: { name: 'Soft black', ral: '9005' }
};

/* RAL colours: the full list comes from Fitted at build time (names and colours for the curated list) */
const RAL = {};
/*@RAL@*/ ''.split('|').forEach(e => {
  const m = e.match(/^(\d{4}) (.+) ([0-9A-F]{6})$/);
  if (m) RAL[m[1]] = { name: m[2], hex: '#' + m[3] };
});

/* handles: price per front (handle or latch), and how they are drawn */
const HANDLES = {
  push: { name: 'Push to open', blurb: 'No handle — press the front', price: 9 },
  knob: { name: 'Knob', blurb: 'Round, 30 mm', price: 14 },
  bar: { name: 'Bar', blurb: '160 mm, slim', price: 22 },
  grip: { name: 'Cut-out grip', blurb: 'A half moon routed in the edge', price: 12 },
  tab: { name: 'Leather tab', blurb: 'A soft pull on the edge', price: 16 }
};
const HFIN = {
  brass: { name: 'Brass', hex: '#B8954A' },
  black: { name: 'Black', hex: '#1E1E1E' },
  steel: { name: 'Brushed steel', hex: '#A7AAAD' },
  oak: { name: 'Oak', hex: '#C9A26E' },
  match: { name: 'Same as the front', hex: null }
};

const PRICE = {
  perFront: 30, // cutting, edging, drilling set-up, packing
  hinge: 3, // drilling the hinge cups for the IKEA hinges
  minArea: 0.08, // m² — a small front still costs a small front
  delivery: 59,
  deliveryFree: 1500
};
const LEAD = 'about 3–4 weeks';
// painted fronts go to the spray shop: 1–2 weeks longer
const LEAD_PAINTED = 'about 4–6 weeks';
const leadOf = L => (L.fronts.some(f => MATS[lookOf(f).mat].paint) ? LEAD_PAINTED : LEAD);
const colHex = k => (RAL[(COLOURS[k] || COLOURS.chalk).ral] || {}).hex || '#eeeeee';
