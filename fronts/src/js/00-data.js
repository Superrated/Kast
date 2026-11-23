/* ==== 00-data.js ====
   Everything the configurator knows: the IKEA systems and their sizes, front styles, materials, colours,
   handles and prices. Sizes from IKEA's own product pages (checked Nov 2026):
     PAX    frames 50 / 75 / 100 wide, 201 / 236 high; hinged doors 50 or 25 wide (a 75 frame takes 50 + 25),
            door 49.5 × 229.4 cm on a 236 frame (195 cm on a 201 frame)
     METOD  fronts are 3 mm smaller than the cabinet both ways (39.7 × 79.7 for a 40 × 80 cabinet)
     BESTÅ  fronts 59.6 wide; 63.7 / 37.7 / 25.7 high for the 64 / 38 / 26 positions
   Prices are examples for the prototype.
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

/* front styles — the shape of the front */
const STYLES = {
  flat: { name: 'Flat', blurb: 'Clean and quiet', f: 1 },
  fluted: { name: 'Fluted', blurb: 'Rounded flutes routed in', f: 1.6 },
  shaker: { name: 'Shaker', blurb: 'Frame with a sunk panel', f: 1.35 },
  arch: { name: 'Arch', blurb: 'An arch routed in the face', f: 1.45 },
  slats: { name: 'Slats', blurb: 'Ribs with shadow gaps', f: 1.5 },
  grid: { name: 'Grid', blurb: 'Squares cut in the face', f: 1.4 }
};
const FLUTE = {
  pitch: [
    [12, 'Fine'],
    [20, 'Classic'],
    [32, 'Bold']
  ],
  dir: [
    ['v', 'Up and down'],
    ['h', 'Side to side']
  ]
};

/* materials: price per m² of front (both faces finished, edges included) and which styles they can take */
const MATS = {
  mdf: { name: 'Painted MDF', blurb: 'Any RAL colour, smooth matt paint', rate: 150, styles: 'all', paint: true },
  oak: {
    name: 'Oak veneer',
    blurb: 'Natural oak, oiled',
    rate: 235,
    styles: ['flat', 'fluted', 'shaker', 'arch', 'slats'],
    wood: '#C9A26E',
    grain: '#8F6A3C'
  },
  smoked: {
    name: 'Smoked oak',
    blurb: 'Dark, fumed oak',
    rate: 255,
    styles: ['flat', 'fluted', 'shaker', 'slats'],
    wood: '#71533A',
    grain: '#3F2B1C'
  },
  walnut: {
    name: 'Walnut veneer',
    blurb: 'Warm and dark',
    rate: 295,
    styles: ['flat', 'fluted', 'shaker', 'slats'],
    wood: '#5C3A26',
    grain: '#2E1A0F'
  },
  birch: {
    name: 'Birch plywood',
    blurb: 'Layered edge on show',
    rate: 160,
    styles: ['flat', 'slats', 'grid'],
    wood: '#DCC69E',
    grain: '#B89B6C'
  },
  lino: {
    name: 'Linoleum',
    blurb: 'Soft, warm surface on birch ply',
    rate: 220,
    styles: ['flat', 'arch', 'grid'],
    lino: true
  }
};
/* linoleum colours (generic names) */
const LINO = [
  ['mushroom', 'Mushroom', '#B9AC97'],
  ['pebble', 'Pebble', '#9A9A93'],
  ['olive', 'Olive', '#6F6E4C'],
  ['sage', 'Sage', '#8E9B85'],
  ['iron', 'Iron', '#4A4D50'],
  ['burgundy', 'Burgundy', '#6B2B2E'],
  ['powder', 'Powder', '#D9C6BD'],
  ['charcoal', 'Charcoal', '#2E2F31']
];

/* RAL colours: the full list comes from Fitted at build time; a short list is shown first */
const RAL = {};
/*@RAL@*/ ''.split('|').forEach(e => {
  const m = e.match(/^(\d{4}) (.+) ([0-9A-F]{6})$/);
  if (m) RAL[m[1]] = { name: m[2], hex: '#' + m[3] };
});
const RAL_PICK = [
  '9010',
  '9001',
  '1013',
  '1015',
  '7044',
  '7035',
  '6021',
  '6011',
  '6003',
  '5014',
  '5011',
  '3012',
  '8025',
  '7016',
  '7021',
  '9005'
];

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
  perFront: 22, // cutting, edging, packing
  hinge: 3, // drilling the hinge cups for the IKEA hinges
  minArea: 0.08, // m² — a small front still costs a small front
  delivery: 59,
  deliveryFree: 1500
};
const LEAD = 'about 3–4 weeks';
