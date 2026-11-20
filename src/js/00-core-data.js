/* ==== 00-core-data.js ====
   Basic data: rounding helpers, finishes (FIN), board types (MATS), column presets (PRESETS), the example design, inside fittings (FITS), wall obstacles (WOB), bumps (BUMPS), ceiling things (COBJ).
   To add a column type: add it to PRESETS (and to the "Add a column" list in 40-side-panel.js).
   To add an inside fitting: add it to FITS with its group (grp) — it then shows in the fittings list.
*/
/*CORE-START*/
const r1 = v => Math.round(v * 10) / 10,
  f0 = v => Math.round(v),
  DEG = 180 / Math.PI;
let _uid = 1;
const uid = () => 'i' + _uid++ + Math.random().toString(36).slice(2, 6);
const FIN = {
  oak: { name: 'Natural oak', base: '#C9A26E', grain: '#8F6A3C', kind: 'wood', rough: 0.6 },
  smoked: { name: 'Smoked oak', base: '#71533A', grain: '#3F2B1C', kind: 'wood', rough: 0.6 },
  walnut: { name: 'Walnut', base: '#5C3A26', grain: '#2E1A0F', kind: 'wood', rough: 0.55 },
  birch: { name: 'Birch plywood', base: '#DCC69E', grain: '#B89B6C', kind: 'ply', rough: 0.65 },
  black: { name: 'Black ash', base: '#2A2826', grain: '#0E0E0D', kind: 'wood', rough: 0.55 },
  cork: { name: 'Cork', base: '#B58B5A', grain: '#8A6239', kind: 'stone', rough: 0.9, hidden: true },
  mirror: { name: 'Mirror', base: '#CFD8DC', kind: 'plain', rough: 0.06, hidden: true },
  concrete: { name: 'Concrete look', base: '#9D9C97', grain: '#7E7D78', kind: 'stone', rough: 0.85 }
};
const RAL_FAM = {
  1: 'Yellow & beige',
  2: 'Orange',
  3: 'Red',
  4: 'Violet',
  5: 'Blue',
  6: 'Green',
  7: 'Grey',
  8: 'Brown',
  9: 'White & black'
};
'1000 Green beige CDBA88|1001 Beige D0B084|1002 Sand yellow D2AA6D|1003 Signal yellow F9A800|1004 Golden yellow E49E00|1005 Honey yellow CB8E00|1006 Maize yellow E29000|1007 Daffodil yellow E88C00|1011 Brown beige AF804F|1012 Lemon yellow DDAF27|1013 Oyster white E3D9C6|1014 Ivory DDC49A|1015 Light ivory E6D2B5|1016 Sulfur yellow F1DD38|1017 Saffron yellow F6A950|1018 Zinc yellow FACA30|1019 Grey beige A48F7A|1020 Olive yellow A08F65|1021 Rape yellow F6B600|1023 Traffic yellow F7B500|1024 Ochre yellow BA8F4C|1026 Luminous yellow FFFF00|1027 Curry A77F0E|1028 Melon yellow FF9B00|1032 Broom yellow E2A300|1033 Dahlia yellow F99A1C|1034 Pastel yellow EB9C52|1035 Pearl beige 908370|1036 Pearl gold 80643F|1037 Sun yellow F09200|2000 Yellow orange DA6E00|2001 Red orange BA481B|2002 Vermilion BF3922|2003 Pastel orange F67828|2004 Pure orange E25303|2005 Luminous orange FF4D06|2007 Luminous bright orange FFB200|2008 Bright red orange ED6B21|2009 Traffic orange DE5307|2010 Signal orange D05D28|2011 Deep orange E26E0E|2012 Salmon orange D5654D|2013 Pearl orange 923E25|2017 RAL orange FC5500|3000 Flame red A72920|3001 Signal red 9B2423|3002 Carmine red 9B2321|3003 Ruby red 861A22|3004 Purple red 6B1C23|3005 Wine red 59191F|3007 Black red 3E2022|3009 Oxide red 6D342D|3011 Brown red 792423|3012 Beige red C6846D|3013 Tomato red 972E25|3014 Antique pink CB7375|3015 Light pink D8A0A6|3016 Coral red A63D2F|3017 Rose CB555D|3018 Strawberry red C73F4A|3020 Traffic red BB1E10|3022 Salmon pink CF6955|3024 Luminous red FF2D21|3026 Luminous bright red FF2A1B|3027 Raspberry red AB273C|3028 Pure red CC2C24|3031 Orient red A63437|3032 Pearl ruby red 701D23|3033 Pearl pink A53A2D|4001 Red lilac 816183|4002 Red violet 8D3C4B|4003 Heather violet C4618C|4004 Claret violet 651E38|4005 Blue lilac 76689A|4006 Traffic purple 903373|4007 Purple violet 47243C|4008 Signal violet 844C82|4009 Pastel violet 9D8692|4010 Telemagenta BC4077|4011 Pearl violet 6E6387|4012 Pearl blackberry 6B6B7F|5000 Violet blue 314F6F|5001 Green blue 0F4C64|5002 Ultramarine blue 00387B|5003 Sapphire blue 1F3855|5004 Black blue 191E28|5005 Signal blue 005387|5007 Brilliant blue 376B8C|5008 Grey blue 2B3A44|5009 Azure blue 225F78|5010 Gentian blue 004F7C|5011 Steel blue 1A2B3C|5012 Light blue 0089B6|5013 Cobalt blue 193153|5014 Pigeon blue 637D96|5015 Sky blue 007CB0|5017 Traffic blue 005B8C|5018 Turquoise blue 048B8C|5019 Capri blue 005E83|5020 Ocean blue 00414B|5021 Water blue 007577|5022 Night blue 222D5A|5023 Distant blue 42698C|5024 Pastel blue 6093AC|5025 Pearl gentian blue 21697C|5026 Pearl night blue 0F3052|6000 Patina green 3C7460|6001 Emerald green 366735|6002 Leaf green 325928|6003 Olive green 50533C|6004 Blue green 024442|6005 Moss green 114232|6006 Grey olive 3C392E|6007 Bottle green 2C3222|6008 Brown green 37342A|6009 Fir green 27352A|6010 Grass green 4D6F39|6011 Reseda green 6C7C59|6012 Black green 303D3A|6013 Reed green 7D765A|6014 Yellow olive 474135|6015 Black olive 3D3D36|6016 Turquoise green 00694C|6017 May green 587F40|6018 Yellow green 61993B|6019 Pastel green B9CEAC|6020 Chrome green 37422F|6021 Pale green 8A9977|6022 Olive drab 3A3327|6024 Traffic green 008351|6025 Fern green 5E6E3B|6026 Opal green 005F4E|6027 Light green 7EBAB5|6028 Pine green 315442|6029 Mint green 006F3D|6032 Signal green 237F52|6033 Mint turquoise 46877F|6034 Pastel turquoise 7AACAC|6035 Pearl dark green 194D25|6036 Pearl opal green 04574B|6037 Pure green 008B29|6038 Luminous green 00B51B|6039 Fibrous green B3C43E|7000 Squirrel grey 7A888E|7001 Silver grey 8C969D|7002 Olive grey 817863|7003 Moss grey 7A7669|7004 Signal grey 9B9B9B|7005 Mouse grey 6C6E6B|7006 Beige grey 766A5E|7008 Khaki grey 745E3D|7009 Green grey 5D6058|7010 Tarpaulin grey 585C56|7011 Iron grey 52595D|7012 Basalt grey 575D5E|7013 Brown grey 575044|7015 Slate grey 4F5358|7016 Anthracite grey 383E42|7021 Black grey 2F3234|7022 Umbra grey 4C4A44|7023 Concrete grey 808076|7024 Graphite grey 45494E|7026 Granite grey 374345|7030 Stone grey 928E85|7031 Blue grey 5B686D|7032 Pebble grey B5B0A1|7033 Cement grey 7F8274|7034 Yellow grey 92886F|7035 Light grey C5C7C4|7036 Platinum grey 979392|7037 Dusty grey 7A7B7A|7038 Agate grey B0B0A9|7039 Quartz grey 6B665E|7040 Window grey 989EA1|7042 Traffic grey A 8E9291|7043 Traffic grey B 4F5250|7044 Silk grey B7B3A8|7045 Telegrey 1 8D9295|7046 Telegrey 2 7F868A|7047 Telegrey 4 C8C8C7|7048 Pearl mouse grey 817B73|8000 Green brown 89693F|8001 Ochre brown 9D622B|8002 Signal brown 794D3E|8003 Clay brown 7E4B26|8004 Copper brown 8D4931|8007 Fawn brown 70452A|8008 Olive brown 724A25|8011 Nut brown 5A3826|8012 Red brown 66332B|8014 Sepia brown 4A3526|8015 Chestnut brown 5E2F26|8016 Mahogany brown 4C2B20|8017 Chocolate brown 442F29|8019 Grey brown 3D3635|8022 Black brown 1A1718|8023 Orange brown A45729|8024 Beige brown 795038|8025 Pale brown 755847|8028 Terra brown 513A2A|8029 Pearl copper 7F4031|9001 Cream E9E0D2|9002 Grey white D7D5CB|9003 Signal white ECECE7|9004 Signal black 2B2B2C|9005 Jet black 0E0E10|9006 White aluminium A1A1A0|9007 Grey aluminium 878581|9010 Pure white F1ECE1|9011 Graphite black 27292B|9012 Clean room white F8F2E1|9016 Traffic white F1F0EA|9017 Traffic black 2A292A|9018 Papyrus white C8CBC4|9022 Pearl light grey 858583|9023 Pearl dark grey 797B7A'
  .split('|')
  .forEach(e => {
    const m = e.match(/^(\d{4}) (.+) ([0-9A-F]{6})$/);
    if (!m) return;
    const pearl = /Pearl|aluminium/.test(m[2]);
    FIN['ral' + m[1]] = {
      name: `RAL ${m[1]} ${m[2]}`,
      base: '#' + m[3],
      kind: 'plain',
      rough: pearl ? 0.4 : 0.6,
      ral: true,
      fam: +m[1][0]
    };
  });
const FIN_ALIAS = { white: 'ral9010', greige: 'ral1013', sage: 'ral6021', ink: 'ral5011' };
const MC_SKIP = /fabric|Speaker baffle/i,
  MC_OLD = {
    mc_chalk: 'ral9001',
    mc_sand: 'ral1015',
    mc_greige: 'ral1019',
    mc_stone: 'ral7044',
    mc_clay: 'ral3012',
    mc_sage: 'ral6021',
    mc_graphite: 'ral7024',
    mc_anthracite: 'ral7016'
  };
function fixFins(st) {
  try {
    const walk = o => {
      if (!o || typeof o !== 'object') return;
      for (const k in o) {
        const v = o[k];
        if (typeof v === 'string' && MC_OLD[v]) o[k] = MC_OLD[v];
        else if (v && typeof v === 'object') walk(v);
      }
    };
    walk(st);
    // a beam saved with only its height (h): give it an underside height and the full depth, so the form shows them
    const R = st && st.room;
    if (R && Array.isArray(R.beams))
      R.beams.forEach(b => {
        if (!(isFinite(+b.bottom) && b.bottom !== null && b.bottom !== '') && +b.h > 0) {
          b.bottom = Math.round((+R.H || 2500) - +b.h);
          delete b.h;
        }
        if (!(+b.depth > 0)) b.depth = +R.D || 600;
      });
  } catch (e) {
    oops('core-data #1', e);
  }
  if (st && st.opts) {
    st.opts.construct = st.opts.construct || 'shared';
    if (!st.opts.two) st.opts.two = { on: false, y: 1000, fin: 'ral7016' };
    if (st.opts.handle === 'dots') st.opts.handle = 'hole';
    if (!HANDLES.some(h => h[0] === st.opts.handle)) st.opts.handle = 'bar';
    if (st.opts.dotPat && !['lead', 'square', 'diamond', 'tri', 'arc'].includes(st.opts.dotPat)) st.opts.dotPat = '';
  }
  if (st && st.sections)
    st.sections.forEach(s => {
      s.back = s.back || 'full';
      if (s.base === 'panel' && !s.panel) s.panel = { ...PANEL_DEF };
      (s.zones || []).forEach(z => {
        if (z.face === 'dots') {
          z.face = 'flat';
          if (!z.hd) z.hd = 'hole';
        }
        if (z.hd === 'dots') z.hd = 'hole';
        if (Array.isArray(z.hts)) z.hts = z.hts.map(v => (v === 'dots' ? 'hole' : v));
        if (!Array.isArray(z.fins)) z.fins = [];
        if (!Array.isArray(z.nh)) z.nh = [];
        if (!Array.isArray(z.vd)) z.vd = [];
        if (!Array.isArray(z.vsh)) z.vsh = [];
        if (z.fin == null) z.fin = '';
        if (z.inFin == null) z.inFin = '';
        if (z.fabricCol == null) z.fabricCol = 'charcoal';
      });
    });
  if (st && st.mat)
    Object.entries(st.mat).forEach(([role, m]) => {
      if (!MATS[m.type]) {
        const f = FIN[m.fin] || FIN[FIN_ALIAS[m.fin]];
        m.type =
          role === 'back'
            ? 'hdf'
            : f && f.kind !== 'plain' && f.kind !== 'stone'
              ? m.fin === 'birch'
                ? 'ply'
                : role === 'carcass' || role === 'shelf'
                  ? 'melamine'
                  : 'veneer'
              : role === 'front' || role === 'skirt'
                ? 'mdfpaint'
                : 'melamine';
      }
      if (FIN_ALIAS[m.fin]) m.fin = FIN_ALIAS[m.fin];
      if (!FIN[m.fin]) m.fin = 'ral9010';
    });
  return st;
}
const ROLES = [
  ['carcass', 'Sides, tops & bottoms'],
  ['shelf', 'Shelves'],
  ['back', 'Back panels'],
  ['front', 'Doors & fronts'],
  ['desk', 'Desk top'],
  ['skirt', 'Closing strips & plinth']
];
const MATS = {
  melamine: {
    name: 'Melamine chipboard',
    short: 'Melamine',
    t: 18,
    sheet: '2800x2070',
    edge: '1 mm ABS edge band',
    sag: 700,
    fins: 'all',
    rough: 0.5
  },
  mdfpaint: {
    name: 'Painted MDF',
    short: 'Painted MDF',
    t: 18,
    sheet: '2440x1220',
    edge: 'Edges sealed, filled and painted',
    sag: 750,
    fins: 'ral',
    paint: true,
    rough: 0.42
  },
  mdfmicro: {
    name: 'Microcement on MDF',
    short: 'MDF',
    t: 18,
    sheet: '2440x1220',
    edge: 'Face and edges trowelled in microcement, back primed',
    sag: 750,
    fins: 'ral',
    micro: true,
    rough: 0.8
  },
  veneer: {
    name: 'Veneered MDF',
    short: 'Veneer',
    t: 19,
    sheet: '2500x1250',
    edge: 'Matching real-wood veneer edging',
    sag: 750,
    fins: 'wood',
    rough: 0.6
  },
  ply: {
    name: 'Birch plywood',
    short: 'Plywood',
    t: 18,
    sheet: '2500x1250',
    edge: 'Exposed ply edge, sanded and lacquered',
    sag: 900,
    fins: 'ply',
    rough: 0.62
  },
  hpl: {
    name: 'HPL / Fenix on MDF',
    short: 'HPL',
    t: 19,
    sheet: '3050x1300',
    edge: 'Matching HPL or dark-core edge',
    sag: 750,
    fins: 'all',
    rough: 0.3
  },
  solid: {
    name: 'Solid wood panel',
    short: 'Solid wood',
    t: 20,
    sheet: '2500x1250',
    edge: 'Planed and oiled edge',
    sag: 1000,
    fins: 'wood',
    rough: 0.6
  },
  hdf: {
    name: 'HDF / thin MDF',
    short: 'HDF',
    t: 8,
    sheet: '2800x2070',
    edge: 'No edge treatment',
    sag: 350,
    fins: 'all',
    rough: 0.7
  }
};
function fitTypes(st) {
  if (st.opts && st.opts.budget) budgetFix(st);
  Object.entries(st.mat).forEach(([r, m]) => {
    if (!finAllowed(m.type, m.fin)) {
      const f = FIN[m.fin] || {};
      m.type = f.ral
        ? r === 'front' || r === 'skirt'
          ? 'mdfpaint'
          : r === 'back'
            ? 'hdf'
            : 'melamine'
        : m.fin === 'birch'
          ? 'ply'
          : r === 'desk'
            ? 'solid'
            : 'veneer';
      m.sheet = MATS[m.type].sheet;
    }
  });
  return st;
}
const finAllowed = (type, k) => {
  const m = MATS[type],
    f = FIN[k];
  if (!m || !f) return true;
  if (f.custom) return m.fins === 'all' || (m.fins === 'wood' ? f.kind !== 'plain' : f.kind === 'plain');
  if (m.fins === 'wood') return f.kind === 'wood' || f.kind === 'ply';
  if (m.fins === 'ral') return !!f.ral;
  if (m.fins === 'ply') return k === 'birch' || !!f.ral;
  return true;
};
const SHEETS = ['2800x2070', '2440x1220', '3050x1220', '3050x1300', '2500x1250', '2620x2070', '4100x1300'];
const ZTYPES = [
  ['closed', 'Cupboard with doors'],
  ['open', 'Open shelves'],
  ['drawers', 'Drawers'],
  ['opening', 'Niche / TV'],
  ['speaker', 'Speaker'],
  ['seat', 'Window seat']
];
const SLIDES = [250, 300, 350, 400, 450, 500, 550, 600];

const FABRICS = {
  charcoal: { name: 'Charcoal', c: '#3A3C3F' },
  graphite: { name: 'Graphite', c: '#4A4D52' },
  black: { name: 'Black', c: '#1C1D1F' },
  stone: { name: 'Stone grey', c: '#9C978C' },
  pebble: { name: 'Pebble', c: '#B9B2A5' },
  oatmeal: { name: 'Oatmeal', c: '#CDBFA8' },
  linen: { name: 'Linen', c: '#DDD3C0' },
  cream: { name: 'Cream', c: '#E9E1CF' },
  sand: { name: 'Sand', c: '#C8AE88' },
  camel: { name: 'Camel', c: '#A8804F' },
  cognac: { name: 'Cognac', c: '#8A5A35' },
  rust: { name: 'Rust', c: '#9A4E33' },
  terracotta: { name: 'Terracotta', c: '#B5603F' },
  mustard: { name: 'Mustard', c: '#C99A2E' },
  ochre: { name: 'Ochre', c: '#B07D2B' },
  olive: { name: 'Olive', c: '#6B6C48' },
  moss: { name: 'Moss', c: '#5B6B3E' },
  sage: { name: 'Sage', c: '#8E9B87' },
  forest: { name: 'Forest green', c: '#2F4A3A' },
  teal: { name: 'Teal', c: '#2E6466' },
  petrol: { name: 'Petrol', c: '#234B57' },
  denim: { name: 'Denim', c: '#4B6584' },
  navy: { name: 'Navy', c: '#2C3A52' },
  dustyblue: { name: 'Dusty blue', c: '#8099AE' },
  lavender: { name: 'Lavender', c: '#9B93AE' },
  plum: { name: 'Plum', c: '#5E3A4F' },
  blush: { name: 'Blush', c: '#D8AFA4' },
  burgundy: { name: 'Burgundy', c: '#6B2735' }
};
const HANDLES = [
  ['hole', 'Finger hole'],
  ['slot', 'Finger slot'],
  ['groove', 'Finger groove'],
  ['woodbar', 'Wooden bar'],
  ['woodpull', 'Wooden D-pull'],
  ['woodknob', 'Wooden knob'],
  ['woodblock', 'Wooden block'],
  ['woodcup', 'Wooden cup pull'],
  ['edge', 'Wooden edge pull'],
  ['profile', 'Wooden edge profile'],
  ['disc', 'Wooden disc'],
  ['stick', 'Coloured stick'],
  ['cross', 'Coloured cross'],
  ['ring', 'Coloured ring'],
  ['leather', 'Leather strap'],
  ['bar', 'Metal bar'],
  ['knob', 'Metal knob'],
  ['none', 'Push-to-open']
];
const WOODS = {
  oak: { name: 'Oak', c: '#B98B57', d: '#8A6236', fin: 'oak' },
  walnut: { name: 'Walnut', c: '#5E3B26', d: '#3B2416', fin: 'walnut' },
  ash: { name: 'Ash', c: '#DCC7A1', d: '#B39B72', fin: 'birch' },
  smoked: { name: 'Smoked oak', c: '#6F5038', d: '#4A3424', fin: 'smoked' },
  black: { name: 'Black stained', c: '#2B2826', d: '#0E0E0E', fin: 'black' }
};
const HSIZE = {
  S: { bar: 128, knob: 26, slot: 70, hole: 25, edge: 80, cup: 76, stick: 250, disc: 60 },
  M: { bar: 192, knob: 34, slot: 100, hole: 30, edge: 110, cup: 96, stick: 400, disc: 80 },
  L: { bar: 320, knob: 42, slot: 140, hole: 35, edge: 160, cup: 128, stick: 600, disc: 100 },
  XL: { bar: 600, knob: 50, slot: 200, hole: 40, edge: 250, cup: 160, stick: 900, disc: 120 }
};
const HCOL = {
  blue: ['Blue', '#5D74A3'],
  navy: ['Navy', '#2E3E5E'],
  pink: ['Pink', '#D9A6A0'],
  sage: ['Sage', '#93A98E'],
  ochre: ['Ochre', '#D2A13F'],
  terra: ['Terracotta', '#B8613F'],
  white: ['White', '#EDEBE6']
};
const DOTSZ = { S: 32, M: 38, L: 45 };
const hColour = () => (HCOL[S.opts.handleCol] || HCOL.blue)[1];
const hCat = t =>
  ({
    stick: 'stick',
    disc: 'disc',
    cross: 'disc',
    ring: 'disc',
    bar: 'bar',
    woodbar: 'bar',
    woodpull: 'bar',
    leather: 'bar',
    knob: 'knob',
    woodknob: 'knob',
    woodblock: 'knob',
    slot: 'slot',
    hole: 'hole',
    edge: 'edge',
    woodcup: 'cup'
  })[t];
const isWoodHandle = t => /^wood|^edge$|^profile$|^disc$/.test(t);
const BOOKC = [
  '#7A3B2E',
  '#2F4858',
  '#C9A86A',
  '#4E6E58',
  '#D9CBB3',
  '#8C5A3C',
  '#3D3B3A',
  '#A8B5A2',
  '#B5503C',
  '#E8E2D6',
  '#5B6C8C',
  '#C2B280'
];
const POTC = ['#E8E3DA', '#C2703D', '#3A3A38', '#B9AE9C', '#7F8F86'];
const BOXC = ['#C8B79A', '#6E6A60', '#D9D3C7', '#8A6F52'];
const FRAMEC = ['#C96B4B', '#E2C27A', '#5D7A8C', '#9DAE8F', '#2E2E2E'];
const CLOTHC = [
  '#2E3A4F',
  '#8A8F96',
  '#E8E2D6',
  '#B5503C',
  '#3D3B3A',
  '#6E7F5C',
  '#C9A86A',
  '#9AB0C4',
  '#7A3B2E',
  '#F2EFE9',
  '#4E6E58',
  '#D7B7A5',
  '#1F2328',
  '#A3B9A0'
];
const LEAFC = ['#4F6B3A', '#5E7F45', '#3E5A32', '#6B8A4E'];
function prng(seed) {
  let s = Math.abs(Math.floor(seed)) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
function insetPoly(poly, d) {
  const ar = polyArea(poly),
    sg = ar > 0 ? 1 : -1,
    L = [],
    n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i],
      b = poly[(i + 1) % n],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      l = Math.hypot(dx, dy);
    if (l < 1e-6) continue;
    L.push({ p: [a[0] - (dy / l) * sg * d, a[1] + (dx / l) * sg * d], v: [dx, dy] });
  }
  const m = L.length,
    out = [];
  for (let i = 0; i < m; i++) {
    const A = L[(i - 1 + m) % m],
      B = L[i],
      den = A.v[0] * B.v[1] - A.v[1] * B.v[0];
    if (Math.abs(den) < 1e-9) {
      out.push(B.p);
      continue;
    }
    const t = ((B.p[0] - A.p[0]) * B.v[1] - (B.p[1] - A.p[1]) * B.v[0]) / den;
    out.push([A.p[0] + t * A.v[0], A.p[1] + t * A.v[1]]);
  }
  return out;
}
/* slatted fronts: slat width / gap presets, and the slat rectangles for one front. Edge pieces are 60 mm stiles on doors so hinge cups have wood to sit in */
const SLAT = { fine: [20, 10, 'Fine'], med: [30, 15, 'Medium'], wide: [45, 20, 'Wide'] };
function slatsOf(poly, dir, size, door) {
  const S_ = SLAT[size] || SLAT.med,
    sw = S_[0],
    gp = S_[1],
    xs = poly.map(p => p[0]),
    ys = poly.map(p => p[1]),
    x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys),
    yLow = Math.min(polyTopAt(poly, x0 + 0.5), polyTopAt(poly, x1 - 0.5), polyTopAt(poly, (x0 + x1) / 2));
  const flat = !(y1 - yLow > 1.5),
    tp = x => {
      const t = polyTopAt(poly, Math.max(x0 + 0.01, Math.min(x1 - 0.01, x)));
      return isFinite(t) ? t : y1;
    };
  if (dir === 'h' && !flat) dir = 'v';
  const slats = [],
    rails = [];
  if (dir === 'v') {
    const W = x1 - x0,
      st = door ? Math.min(60, W / 3) : sw,
      inner = W - 2 * st,
      n = Math.max(0, Math.floor((inner - gp) / (sw + gp))),
      gap = (inner - n * sw) / (n + 1),
      add = (a, b) =>
        slats.push([
          [a, y0],
          [b, y0],
          [b, tp(b)],
          [a, tp(a)]
        ]);
    add(x0, x0 + st);
    for (let j = 0; j < n; j++) {
      const a = x0 + st + gap * (j + 1) + sw * j;
      add(a, a + sw);
    }
    add(x1 - st, x1);
    if (door) {
      const top = flat ? y1 : yLow,
        yy = [y0 + 70, top - 130];
      if (top - y0 > 1200) yy.push((y0 + top) / 2 - 30);
      yy.forEach(a => {
        if (a > y0 + 10 && a + 60 < top)
          rails.push([
            [x0 + 25, a],
            [x1 - 25, a],
            [x1 - 25, a + 60],
            [x0 + 25, a + 60]
          ]);
      });
    }
    return { slats, rails, dir, sw, gap, n: n + 2, st };
  }
  const Hh = y1 - y0,
    n = Math.max(2, Math.floor((Hh + gp) / (sw + gp))),
    gap = (Hh - n * sw) / (n - 1);
  for (let j = 0; j < n; j++) {
    const a = y0 + j * (sw + gap);
    slats.push([
      [x0, a],
      [x1, a],
      [x1, a + sw],
      [x0, a + sw]
    ]);
  }
  if (door) {
    [x0 + 20, x1 - 80].forEach(a =>
      rails.push([
        [a, y0 + 15],
        [a + 60, y0 + 15],
        [a + 60, y1 - 15],
        [a, y1 - 15]
      ])
    );
    if (x1 - x0 > 700)
      rails.push([
        [(x0 + x1) / 2 - 30, y0 + 15],
        [(x0 + x1) / 2 + 30, y0 + 15],
        [(x0 + x1) / 2 + 30, y1 - 15],
        [(x0 + x1) / 2 - 30, y1 - 15]
      ]);
  }
  return { slats, rails, dir, sw, gap, n, st: sw };
}
/* dotted fronts: Ø25 holes in a grid, in rows that line up from door to door, or scattered; two of them sit where a handle would be */
function dotsFor(poly, kind, hinge, pat, d, seed, wseed) {
  // a small cluster of drilled holes that IS the handle; returns [x,y,diameter]
  const xs = poly.map(p => p[0]),
    ys = poly.map(p => p[1]),
    l = Math.min(...xs),
    r = Math.max(...xs),
    b = Math.min(...ys),
    T = Math.max(...ys),
    top = x => {
      const t = polyTopAt(poly, x);
      return isFinite(t) ? t : T;
    },
    sp = Math.round(d * 1.55),
    D = Math.min(60, Math.max(45, Math.round(d * 1.4))),
    gap = sp - d;
  let pts; // u = along the handle (up a door, across a drawer), v = across it
  if (pat === 'lead')
    pts =
      kind === 'door'
        ? [
            [2 * sp, 0, d],
            [sp, 0, d],
            [0, 0, d],
            [-(d / 2 + gap + D / 2), 0, D]
          ]
        : [
            [-(D / 2 + gap + d / 2 + sp), 0, d],
            [-(D / 2 + gap + d / 2), 0, d],
            [0, 0, D],
            [D / 2 + gap + d / 2, 0, d],
            [D / 2 + gap + d / 2 + sp, 0, d]
          ];
  else if (pat === 'square')
    pts = [
      [-0.5, -0.5],
      [-0.5, 0.5],
      [0.5, -0.5],
      [0.5, 0.5]
    ].map(([u, v]) => [u * sp, v * sp, d]);
  else if (pat === 'diamond')
    pts = [
      [0, -0.8],
      [0, 0.8],
      [-0.8, 0],
      [0.8, 0]
    ].map(([u, v]) => [u * sp, v * sp, d]);
  else if (pat === 'tri')
    pts = (
      kind === 'door'
        ? [
            [0.6, 0],
            [-0.4, -0.6],
            [-0.4, 0.6]
          ]
        : [
            [0, -0.6],
            [-0.6, 0.4],
            [0.6, 0.4]
          ]
    ).map(([u, v]) => [u * sp, v * sp, d]);
  else if (pat === 'arc')
    pts = [-2, -1, 0, 1, 2].map(k => {
      const a = (k * Math.PI) / 9,
        R = 2.6 * sp;
      return [R * Math.sin(a), R * (1 - Math.cos(a)), d];
    });
  else pts = [-1.5, -0.5, 0.5, 1.5].map(u => [u * sp, 0, d]);
  const us = pts.map(p => p[0]),
    vs = pts.map(p => p[1]),
    mu = (Math.min(...us) + Math.max(...us)) / 2,
    mv = (Math.min(...vs) + Math.max(...vs)) / 2;
  pts = pts.map(([u, v, dd]) => [u - mu, v - mv, dd]);
  const big = Math.max(...pts.map(p => p[2])),
    uH = Math.max(...pts.map(p => Math.abs(p[0]))) + big / 2,
    vH = Math.max(...pts.map(p => Math.abs(p[1]))) + big / 2;
  if (kind === 'door') {
    const sx = hinge === 'L' ? -1 : 1,
      ex = hinge === 'L' ? r : l,
      off = Math.max(45, vH + 28),
      cx = ex + sx * off,
      cy = Math.max(b + uH + 30, Math.min(Math.max(1050, b + 150), top(cx) - uH - 40));
    return pts.map(([u, v, dd]) => [cx + sx * v, cy + u, dd]);
  }
  const cx = (l + r) / 2,
    tp = Math.min(T, top(cx)),
    cy = tp - b > 2 * (vH + 35) ? tp - Math.max(55, vH + 35) : (b + tp) / 2;
  return pts.map(([u, v, dd]) => [cx + u, cy - v, dd]);
}
function polyTopAt(poly, x) {
  let best = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length];
    const lo = Math.min(a[0], b[0]),
      hi = Math.max(a[0], b[0]);
    if (x < lo - 1e-6 || x > hi + 1e-6) continue;
    const y = hi - lo < 1e-6 ? Math.max(a[1], b[1]) : a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
    if (y > best) best = y;
  }
  return best > -Infinity ? best : Math.max(...poly.map(p => p[1]));
}
/* styling props for a surface */
function fillSurface(x0, x1, y, hAv, zF, zB, seed, kind) {
  const r = prng(seed),
    out = [];
  if (hAv < 110 || x1 - x0 < 120) return out;
  const maxH = Math.min(hAv - 15, 340);
  if (kind === 'ledge') {
    let x = x0 + 20 + r() * 40;
    while (x < x1 - 120) {
      const t = r();
      if (t < 0.6) {
        const w = Math.min(x1 - x - 10, 140 + r() * 160),
          h = Math.min(maxH, w * (0.8 + r() * 0.6));
        if (w < 100) break;
        out.push({ k: 'frame', x, y, w, h, z: zB - 60, col: FRAMEC[(r() * FRAMEC.length) | 0] });
        x += w * (0.55 + r() * 0.5);
      } else {
        const w = Math.min(305, maxH - 5);
        if (x + w > x1 - 10 || w < 150) break;
        out.push({
          k: 'record',
          x,
          y,
          w,
          h: w,
          d: 6,
          z: zB - 50,
          col: BOOKC[(r() * BOOKC.length) | 0],
          c2: POTC[(r() * POTC.length) | 0]
        });
        x += w + 30 + r() * 60;
      }
    }
    return out;
  }
  if (kind === 'bar' || kind === 'coffee') {
    let x = x0 + 40;
    const bar = kind === 'bar';
    if (!bar && y < 1200 && x1 - x0 > 420) {
      out.push({ k: 'coffee', x: x0 + (x1 - x0) / 2 - 160, y, w: 300, h: Math.min(maxH, 360), d: 380, z: zF + 40 });
      x = x0 + 30;
      out.push({ k: 'cup', x, y, w: 80, h: 70, col: '#F2F0EA', z: zF + 60 });
      out.push({ k: 'cup', x: x1 - 110, y, w: 80, h: 70, col: '#3A3A38', z: zF + 60 });
      return out.filter(p => p.h > 50);
    }
    while (x < x1 - 90) {
      const t = r();
      if (bar && t < 0.55) {
        const h = Math.min(maxH, 240 + r() * 90);
        out.push({
          k: 'bottle',
          x,
          y,
          w: 70 + r() * 20,
          h,
          col: pick2(r, ['#3B5B3A', '#6B3A1E', '#C9A86A', '#2F4858', '#B5503C', '#E8E2D6']),
          z: zB - 120
        });
        x += 95 + r() * 30;
      } else {
        out.push({
          k: bar ? 'glass' : 'cup',
          x,
          y,
          w: bar ? 60 : 75,
          h: Math.min(maxH, bar ? 110 : 70),
          col: pick2(r, ['#F2F0EA', '#3A3A38', '#C2703D', '#9DAE8F']),
          z: zF + 50
        });
        x += 80 + r() * 40;
      }
    }
    return out.filter(p => p.h > 40);
  }
  if (kind === 'display') {
    let x = x0 + 40 + r() * 50;
    while (x < x1 - 120) {
      const t = r(),
        room = x1 - x - 20;
      if (t < 0.45 && room > 90) {
        const w = 70 + r() * 50,
          h = Math.min(maxH, 120 + r() * 160);
        out.push({ k: 'vase', x, y, w, h, col: POTC[(r() * POTC.length) | 0], z: zF + 80 });
        x += w + 70 + r() * 70;
      } else if (t < 0.75 && room > 160) {
        const w = 150 + r() * 60,
          h = Math.min(maxH, 60 + r() * 40);
        out.push({ k: 'bowl', x, y, w, h, col: POTC[(r() * POTC.length) | 0], z: zF + 60 });
        x += w + 60 + r() * 60;
      } else if (room > 140) {
        const w = 120 + r() * 40,
          ph = Math.min(maxH, 180 + r() * 120);
        out.push({
          k: 'plant',
          x,
          y,
          w,
          h: ph,
          potH: Math.min(ph * 0.42, 110),
          fol: pick2(r, ['tall', 'round', 'trail']),
          pot: POTC[(r() * POTC.length) | 0],
          z: zF + 60
        });
        x += w + 70 + r() * 60;
      } else break;
    }
    return out.filter(p => p.h > 50);
  }
  if (kind.startsWith('desk')) {
    const w = x1 - x0,
      set = kind.split(':')[1] || 'work';
    if (set === 'none') return out;
    if (set === 'studio') {
      const mw = Math.min(600, w - 260);
      if (mw > 300)
        out.push({
          k: 'screen',
          x: x0 + (w - mw) / 2,
          y: y + 110,
          w: mw,
          h: Math.min(hAv - 140, mw * 0.58),
          d: 30,
          z: zB - 230,
          scr: true
        });
      out.push({ k: 'stand', x: x0 + (w - 60) / 2, y, w: 60, h: 110, z: zB - 215 });
      out.push({ k: 'keyboard', x: x0 + (w - 420) / 2, y, w: Math.min(420, w - 120), h: 22, d: 130, z: zF + 70 });
      if (w > 700) {
        out.push({ k: 'monitor', x: x0 + 40, y, w: 120, h: Math.min(hAv - 20, 200), d: 150, z: zB - 200 });
        out.push({ k: 'monitor', x: x1 - 160, y, w: 120, h: Math.min(hAv - 20, 200), d: 150, z: zB - 200 });
      }
      return out.filter(p => p.h > 15);
    }
    if (set === 'vanity') {
      const mw = Math.min(420, w * 0.5, hAv - 60);
      out.push({ k: 'mirror', x: x0 + (w - mw) / 2, y, w: mw, h: mw * 1.15, z: zB - 120 });
      out.push({ k: 'vase', x: x0 + 40, y, w: 60, h: Math.min(hAv - 20, 110), col: '#E8D5C4', z: zF + 120 });
      out.push({ k: 'vase', x: x0 + 110, y, w: 45, h: Math.min(hAv - 20, 80), col: '#D8AFA4', z: zF + 110 });
      if (w > 650) out.push({ k: 'box', x: x1 - 220, y, w: 160, h: 70, d: 110, col: '#B8995A', z: zF + 90 });
      if (w > 900)
        out.push({
          k: 'plant',
          x: x1 - 140,
          y,
          w: 110,
          h: Math.min(hAv - 20, 240),
          potH: 90,
          fol: 'trail',
          pot: '#E8E3DA',
          z: zB - 150
        });
      return out.filter(p => p.h > 40);
    }
    if (set === 'craft') {
      out.push({ k: 'mat', x: x0 + 60, y, w: Math.min(560, w - 200), h: 4, d: 380, z: zF + 60 });
      let x = x1 - 110;
      for (let j = 0; j < 3 && x > x0 + w * 0.55; j++) {
        out.push({
          k: 'vase',
          x,
          y,
          w: 70,
          h: Math.min(hAv - 20, 90 + j * 20),
          col: POTC[j % POTC.length],
          z: zB - 150
        });
        x -= 100;
      }
      out.push({ k: 'lamp', x: x0 + 20, y, w: 160, h: Math.min(hAv - 20, 430), z: zB - 170 });
      return out.filter(p => p.h == null || p.h > 3);
    }
    if (w > 480) out.push({ k: 'laptop', x: x0 + w * 0.2, y, w: 320, d: 220, z: zF + 60 });
    out.push({ k: 'lamp', x: x1 - 190, y, w: 160, h: Math.min(hAv - 20, 430), z: zB - 170 });
    if (w > 520) out.push({ k: 'mug', x: x0 + w * 0.2 + 370, y, w: 80, h: 95, z: zF + 80 });
    if (w > 850)
      out.push({
        k: 'plant',
        x: x0 + 30,
        y,
        w: 140,
        h: Math.min(maxH, 260),
        potH: 105,
        fol: 'round',
        pot: '#E8E3DA',
        z: zB - 180
      });
    if (w > 1150) out.push({ k: 'stack', x: x1 - 450, y, w: 230, h: 66, d: 170, z: zB - 210 });
    return out.filter(p => p.h == null || p.h > 60);
  }
  let x = x0 + 15 + r() * 60;
  while (x < x1 - 80) {
    const t = r(),
      room = x1 - x - 12;
    if (t < 0.5 && maxH > 140 && room > 90) {
      const run = Math.min(room, 130 + r() * 230),
        bh = maxH * (0.62 + r() * 0.22);
      let bx = x;
      while (bx < x + run - 14) {
        const bw = 18 + r() * 24;
        if (bx + bw > x1 - 8) break;
        out.push({
          k: 'book',
          x: bx,
          y,
          w: bw,
          h: Math.min(maxH, bh * (0.85 + r() * 0.22)),
          d: 150 + r() * 60,
          z: zF + 15,
          col: BOOKC[(r() * BOOKC.length) | 0]
        });
        bx += bw + 0.6;
      }
      x = bx + 40 + r() * 90;
    } else if (t < 0.72 && room > 150 && maxH > 150) {
      const w = 120 + r() * 50,
        ph = Math.min(maxH, 170 + r() * 150);
      out.push({
        k: 'plant',
        x,
        y,
        w,
        h: ph,
        potH: Math.min(ph * 0.42, 115),
        fol: r() < 0.35 ? 'trail' : r() < 0.6 ? 'tall' : 'round',
        pot: POTC[(r() * POTC.length) | 0],
        z: zF + Math.max(10, (zB - zF) / 2 - w / 2)
      });
      x += w + 50 + r() * 80;
    } else if (t < 0.84 && room > 110 && maxH > 130) {
      const w = 80 + r() * 40,
        h = Math.min(maxH, 140 + r() * 110);
      out.push({ k: 'vase', x, y, w, h, col: POTC[(r() * POTC.length) | 0], z: zF + 60 });
      x += w + 60 + r() * 80;
    } else if (t < 0.94 && room > 200 && maxH > 120) {
      const w = 180 + r() * 80,
        h = Math.min(maxH, 110 + r() * 60);
      out.push({
        k: 'box',
        x,
        y,
        w,
        h,
        d: Math.min(260, zB - zF - 20),
        col: BOXC[(r() * BOXC.length) | 0],
        z: zF + 15
      });
      x += w + 40 + r() * 60;
    } else if (room > 140 && maxH > 160) {
      const w = 130 + r() * 40,
        h = Math.min(maxH, w * 1.25);
      out.push({ k: 'frame', x, y, w, h, z: zB - 40, col: FRAMEC[(r() * FRAMEC.length) | 0] });
      x += w + 50 + r() * 70;
    } else x += 60;
  }
  return out.filter(p => p.x + p.w <= x1 - 4);
}

const ARTSTYLES = [
  ['abstract', 'Abstract'],
  ['landscape', 'Landscape'],
  ['botanical', 'Botanical'],
  ['lines', 'Line art'],
  ['photo', 'Photo']
];
const ARTFRAMES = {
  oak: { name: 'Oak', c: '#B98B57' },
  walnut: { name: 'Walnut', c: '#5E3B26' },
  black: { name: 'Black', c: '#1E1E1E' },
  white: { name: 'White', c: '#F1EEE8' },
  brass: { name: 'Brass', c: '#B8995A' }
};
function artBody(w, h, style, r) {
  const pal = ['#C96B4B', '#E2C27A', '#5D7A8C', '#9DAE8F', '#2E2E2E', '#D8AFA4', '#8A5A35', '#E8D9BE'];
  const m = Math.min(w, h);
  let s = '';
  if (style === 'landscape') {
    const sky = ['#F6E3C3', '#F2D2A8', '#EDBF91', '#E7A97C'];
    for (let i = 0; i < 4; i++)
      s += `<rect y="${((h * 0.65 * i) / 4).toFixed(1)}" width="${w}" height="${((h * 0.65) / 4 + 1).toFixed(1)}" fill="${sky[i]}"/>`;
    s += `<circle cx="${(w * (0.25 + r() * 0.5)).toFixed(1)}" cy="${(h * (0.3 + r() * 0.15)).toFixed(1)}" r="${(m * 0.12).toFixed(1)}" fill="#E07A4F"/>`;
    ['#B7A98E', '#8C9A7A', '#5E6F4E', '#33452F'].forEach((c, li) => {
      const base = h * (0.5 + li * 0.13),
        amp = h * (0.08 - li * 0.012),
        ph = r() * 6;
      let d = `M0 ${h} L0 ${base.toFixed(1)}`;
      for (let x = 0; x <= w; x += w / 24)
        d += ` L${x.toFixed(1)} ${(base - Math.sin((x / w) * Math.PI * (1.5 + li * 0.6) + ph) * amp - r() * amp * 0.3).toFixed(1)}`;
      s += `<path d="${d} L${w} ${h} Z" fill="${c}"/>`;
    });
    return s;
  }
  if (style === 'botanical') {
    s += `<rect width="${w}" height="${h}" fill="#F1ECE1"/>`;
    const n = 2 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) {
      const x0 = w * (0.3 + (k * 0.4) / Math.max(1, n - 1)) + (r() - 0.5) * w * 0.1,
        top = h * (0.12 + r() * 0.1),
        c = ['#5E7F45', '#3E5A32', '#7F9468', '#2F4A3A'][k % 4];
      s += `<path d="M${x0.toFixed(1)} ${h} Q${(x0 + (r() - 0.5) * w * 0.25).toFixed(1)} ${(h * 0.5).toFixed(1)} ${x0.toFixed(1)} ${top.toFixed(1)}" stroke="${c}" stroke-width="${(m * 0.012).toFixed(1)}" fill="none"/>`;
      for (let j = 0; j < 8; j++) {
        const t = 0.15 + j * 0.1,
          y = h - (h - top) * t,
          side = j % 2 ? 1 : -1,
          L = m * (0.08 + r() * 0.06);
        s += `<ellipse cx="${(x0 + side * L * 0.55).toFixed(1)}" cy="${y.toFixed(1)}" rx="${L.toFixed(1)}" ry="${(L * 0.38).toFixed(1)}" fill="${c}" transform="rotate(${side * -30} ${(x0 + side * L * 0.55).toFixed(1)} ${y.toFixed(1)})"/>`;
      }
    }
    return s;
  }
  if (style === 'lines') {
    s += `<rect width="${w}" height="${h}" fill="#FAF8F3"/><circle cx="${(w * (0.35 + r() * 0.3)).toFixed(1)}" cy="${(h * (0.35 + r() * 0.3)).toFixed(1)}" r="${(m * 0.2).toFixed(1)}" fill="${pick2(r, ['#E2C27A', '#D8AFA4', '#9DAE8F', '#C96B4B'])}" opacity=".85"/>`;
    let d = `M${(w * 0.1).toFixed(1)} ${(h * (0.3 + r() * 0.4)).toFixed(1)}`;
    for (let k = 0; k < 5; k++)
      d += ` C${(w * r()).toFixed(1)} ${(h * r()).toFixed(1)} ${(w * r()).toFixed(1)} ${(h * r()).toFixed(1)} ${(w * (0.15 + k * 0.17)).toFixed(1)} ${(h * (0.2 + r() * 0.6)).toFixed(1)}`;
    return (
      s +
      `<path d="${d}" fill="none" stroke="#1F1F1F" stroke-width="${(m * 0.008).toFixed(1)}" stroke-linecap="round"/>`
    );
  }
  if (style === 'photo') {
    const g = ['#2F4858', '#4E6E7E', '#86A3A8', '#D7C9A7'];
    for (let i = 0; i < 4; i++)
      s += `<rect y="${((h * i) / 4).toFixed(1)}" width="${w}" height="${(h / 4 + 1).toFixed(1)}" fill="${g[i]}"/>`;
    s += `<path d="M0 ${(h * 0.62).toFixed(1)} L${(w * 0.3).toFixed(1)} ${(h * 0.3).toFixed(1)} L${(w * 0.48).toFixed(1)} ${(h * 0.5).toFixed(1)} L${(w * 0.68).toFixed(1)} ${(h * 0.22).toFixed(1)} L${w} ${(h * 0.6).toFixed(1)} L${w} ${h} L0 ${h} Z" fill="#E9EEF0" opacity=".9"/><path d="M0 ${(h * 0.72).toFixed(1)} L${w} ${(h * 0.68).toFixed(1)} L${w} ${h} L0 ${h} Z" fill="#3B5560"/>`;
    return s;
  }
  s += `<rect width="${w}" height="${h}" fill="#EFE6D6"/>`;
  for (let k = 0; k < 6; k++) {
    const c = pal[(r() * pal.length) | 0],
      x = w * r(),
      y = h * r(),
      z = m * (0.12 + r() * 0.28);
    const t = r();
    s +=
      t < 0.4
        ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${z.toFixed(1)}" fill="${c}"/>`
        : t < 0.7
          ? `<rect x="${(x - z / 2).toFixed(1)}" y="${(y - z).toFixed(1)}" width="${z.toFixed(1)}" height="${(z * 2).toFixed(1)}" fill="${c}"/>`
          : `<path d="M${(x - z).toFixed(1)} ${y.toFixed(1)} A${z.toFixed(1)} ${z.toFixed(1)} 0 0 1 ${(x + z).toFixed(1)} ${y.toFixed(1)} Z" fill="${c}"/>`;
  }
  return s;
}
const pick2 = (r, a) => a[(r() * a.length) | 0];
function artInner(w, h, style, frame, seed) {
  const r = prng(seed),
    fc = (ARTFRAMES[frame] || ARTFRAMES.oak).c,
    fr = Math.max(14, Math.min(w, h) * 0.03),
    mat = Math.min(w, h) * 0.07,
    ax = fr + mat,
    ay = fr + mat,
    aw = w - 2 * ax,
    ah = h - 2 * ay;
  return `<rect width="${w}" height="${h}" fill="${fc}"/><rect x="${fr}" y="${fr}" width="${w - 2 * fr}" height="${h - 2 * fr}" fill="#F6F3EC"/><svg x="${ax}" y="${ay}" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}" preserveAspectRatio="none">${artBody(aw, ah, style, r)}</svg><rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="${Math.max(2, fr * 0.12)}"/>`;
}
function Z(type, o = {}) {
  return Object.assign(
    {
      id: uid(),
      type,
      h: null,
      shelves: 0,
      doors: 0,
      rail: false,
      hinge: 'L',
      count: 3,
      tv: 0,
      header: true,
      grommet: true,
      woofer: 145,
      nw: 1,
      tweeter: 52,
      grille: false,
      fabric: false,
      fabricCol: 'charcoal',
      span: 0,
      box: false,
      boxT: null,
      boxFin: 'front',
      fin: '',
      fins: [],
      inFin: ''
    },
    o
  );
}
function Sec(o) {
  return Object.assign({ id: uid(), w: null, base: 'cab', back: 'full', deskH: 740, over: 20, zones: [] }, o);
}
const PANEL_DEF = {
  mat: 'ply',
  fin: 'birch',
  t: 18,
  hatch: true,
  hatchY: 300,
  hatchH: 600,
  fun: 'climb',
  chart: true,
  climbH: 1900,
  seed: 7,
  toe: 1,
  pegL: 1,
  pegR: 0,
  pegK: 1,
  pegS: 3,
  pegB: 2,
  pegD: 1,
  pegH: 3
};
const FUN = [
  ['climb', 'Climbing holds'],
  ['busy', 'Busy board'],
  ['marble', 'Marble run'],
  ['ledges', 'Book ledges'],
  ['mural', 'Painted mural'],
  ['chalk', 'Chalkboard'],
  ['magnet', 'Magnetic board'],
  ['cork', 'Cork pinboard'],
  ['peg', 'Peg wall'],
  ['mirror', 'Kids mirror'],
  ['faux', 'Faux doors'],
  ['slats', 'Wood slat wall'],
  ['frames', 'Gallery frames'],
  ['plants', 'Plant wall'],
  ['bricks', 'Brick-building wall'],
  ['relief', 'Relief tiles'],
  ['none', 'Plain']
];
const HOLDC = ['#E4572E', '#F3A712', '#29335C', '#669BBC', '#A8C686', '#D3A4C9', '#F0E6D2'];
const PRESETS = {
  dog: {
    label: 'Dog den (big dog)',
    make: () =>
      Sec({ w: 1180, zones: [Z('closed', { h: 820, dog: 'arch', doors: 1, shelves: 0 }), Z('closed', { shelves: 2 })] })
  },
  wardrobe: { label: 'Wardrobe (hanging rail)', make: () => Sec({ zones: [Z('closed', { rail: true, shelves: 1 })] }) },
  arch: {
    label: 'Arched bookcase (3 wide, colour-drenched)',
    make: () => {
      const f = ['ral8004', 'ral3012', 'ral2001', 'ral8023', 'ral3009'].find(k => FIN[k]) || '';
      return Sec({
        w: 900,
        zones: [
          Z('open', { shelves: 3, vd: [300, 600], vdMode: 'even', vsh: [3, 3, 3], arch: true, inFin: f, drench: !!f })
        ]
      });
    }
  },
  cupboard: { label: 'Cupboard with shelves', make: () => Sec({ zones: [Z('closed', { shelves: 4 })] }) },
  open: { label: 'Open shelving', make: () => Sec({ zones: [Z('open', { shelves: 4 })] }) },
  drawers: {
    label: 'Drawers + cupboard',
    make: () => Sec({ zones: [Z('drawers', { h: 700, count: 4 }), Z('closed', { shelves: 2 })] })
  },
  desk: {
    label: 'Built-in desk',
    make: () => Sec({ w: 1100, base: 'desk', zones: [Z('open', { h: 600, shelves: 0 }), Z('closed', { shelves: 1 })] })
  },
  tv: {
    label: 'TV niche',
    make: () =>
      Sec({
        w: 1300,
        zones: [
          Z('drawers', { h: 430, count: 2 }),
          Z('opening', { h: 820, tv: 55, box: true }),
          Z('closed', { shelves: 1 })
        ]
      })
  },
  speaker: {
    label: 'Speaker column',
    make: () =>
      Sec({
        w: 380,
        zones: [Z('closed', { h: 560, shelves: 1 }), Z('speaker', { h: 430, grille: true }), Z('open', { shelves: 2 })]
      })
  },
  panel: {
    label: 'Panel wall (shaft cover)',
    make: () => Sec({ w: 900, base: 'panel', panel: { ...PANEL_DEF }, zones: [] })
  },
  door: {
    label: 'Door in the wall',
    make: () =>
      Sec({ w: 900, base: 'door', back: 'split', zones: [Z('passage', { h: 2050 }), Z('closed', { shelves: 1 })] })
  },
  seat: {
    label: 'Window seat (bench + drawers)',
    make: () =>
      Sec({
        w: 1200,
        zones: [
          Z('seat', { h: 420, count: 2, fabricCol: 'oatmeal' }),
          Z('open', { h: 650, shelves: 0 }),
          Z('closed', { shelves: 1 })
        ]
      })
  },
  low: { label: 'Low cupboard (under slope)', make: () => Sec({ zones: [Z('closed', { shelves: 1, doors: 1 })] }) },
  laundry: {
    label: 'Laundry: washer + dryer',
    make: () =>
      Sec({
        w: 660,
        zones: [
          Z('drawers', { h: 300, count: 1 }),
          Z('opening', { h: 1750, look: 'stack', grommet: false }),
          Z('closed', { shelves: 0, vent: true })
        ]
      })
  },
  bed: {
    label: 'Fold-down bed',
    make: () =>
      Sec({ w: 1000, zones: [Z('opening', { h: 2120, look: 'bed', grommet: false }), Z('closed', { shelves: 0 })] })
  },
  utility: {
    label: 'Utility cupboard (vacuum, brooms)',
    make: () => Sec({ w: 500, zones: [Z('closed', { shelves: 1, util: true, vent: true })] })
  },
  pantry: {
    label: 'Pantry: tall pull-out with baskets',
    make: () =>
      Sec({
        w: 564,
        zones: [Z('closed', { h: 1900, shelves: 0, doors: 1, fit: 'larder' }), Z('closed', { shelves: 1 })]
      })
  },
  fridge: {
    label: 'Built-in fridge housing',
    make: () =>
      Sec({
        w: 564,
        zones: [Z('closed', { h: 1780, shelves: 0, doors: 1, fridge: true }), Z('closed', { shelves: 0 })]
      })
  },
  oven: {
    label: 'Built-in oven housing',
    make: () =>
      Sec({
        w: 564,
        zones: [
          Z('drawers', { h: 800, count: 2 }),
          Z('opening', { h: 595, look: 'oven', grommet: false }),
          Z('closed', { shelves: 1 })
        ]
      })
  }
};

function exampleState() {
  return {
    name: 'Attic wall',
    room: {
      W: 4200,
      H: 2500,
      D: 600,
      drop: 0,
      ceil: [
        { x: 0, y: 1250 },
        { x: 1600, y: 2500 },
        { x: 3300, y: 2500 },
        { x: 4200, y: 1800 }
      ],
      beams: [{ x: 1950, w: 200, bottom: 2300, depth: 300 }]
    },
    skirt: { top: 40, side: 30, plinth: 90, recess: 40, beamGap: 10, scribe: 10 },
    mat: {
      carcass: { type: 'melamine', t: 18, sheet: '2800x2070', fin: 'ral9010' },
      shelf: { type: 'melamine', t: 25, sheet: '2800x2070', fin: 'ral9010' },
      back: { type: 'hdf', t: 8, sheet: '2800x2070', fin: 'ral9010' },
      front: { type: 'veneer', t: 19, sheet: '2500x1250', fin: 'oak' },
      desk: { type: 'solid', t: 30, sheet: '2500x1250', fin: 'walnut' },
      skirt: { type: 'veneer', t: 19, sheet: '2500x1250', fin: 'oak' }
    },
    opts: {
      gap: 3,
      setback: 20,
      kerf: 4,
      trim: 10,
      handle: 'hole',
      handleSize: 'M',
      handleWood: 'oak',
      construct: 'boxes'
    },
    sections: [
      Sec({ w: 520, zones: [Z('drawers', { h: 620, count: 3 }), Z('closed', { shelves: 1, doors: 1, hinge: 'L' })] }),
      Sec({
        w: 380,
        zones: [
          Z('closed', { h: 560, shelves: 1, doors: 1, hinge: 'L', fabric: true, fabricCol: 'charcoal' }),
          Z('speaker', { h: 430, grille: true, fabricCol: 'charcoal' }),
          Z('open', { shelves: 2 })
        ]
      }),
      Sec({
        w: 1300,
        zones: [
          Z('drawers', { h: 430, count: 2 }),
          Z('opening', { h: 820, tv: 55, box: true }),
          Z('closed', { shelves: 0, doors: 3 })
        ]
      }),
      Sec({
        w: 380,
        zones: [
          Z('closed', { h: 560, shelves: 1, doors: 1, hinge: 'R', fabric: true, fabricCol: 'charcoal' }),
          Z('speaker', { h: 430, grille: true, fabricCol: 'charcoal' }),
          Z('open', { shelves: 2 })
        ]
      }),
      Sec({
        w: 1000,
        base: 'desk',
        deskH: 740,
        over: 20,
        zones: [Z('open', { h: 560, shelves: 0 }), Z('closed', { shelves: 1 })]
      }),
      Sec({ w: null, zones: [Z('closed', { rail: true, shelves: 1 })] })
    ]
  };
}

function clean(poly) {
  const o = [];
  poly.forEach(p => {
    const l = o[o.length - 1];
    if (!l || Math.abs(l[0] - p[0]) > 0.05 || Math.abs(l[1] - p[1]) > 0.05) o.push([p[0], p[1]]);
  });
  while (o.length > 2) {
    const a = o[0],
      b = o[o.length - 1];
    if (Math.abs(a[0] - b[0]) <= 0.05 && Math.abs(a[1] - b[1]) <= 0.05) o.pop();
    else break;
  }
  return o;
}
const rect = (w, h) => [
  [0, 0],
  [w, 0],
  [w, h],
  [0, h]
];
function clipY(poly, lo, hi) {
  const cut = (P, y, keepAbove) => {
    const o = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i],
        b = P[(i + 1) % P.length],
        ia = keepAbove ? a[1] >= y : a[1] <= y,
        ib = keepAbove ? b[1] >= y : b[1] <= y;
      if (ia) o.push(a);
      if (ia !== ib) {
        const t = (y - a[1]) / (b[1] - a[1]);
        o.push([a[0] + (b[0] - a[0]) * t, y]);
      }
    }
    return o;
  };
  return cut(cut(poly, lo, true), hi, false);
}
function polyArea(p) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i],
      [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}
function polyPerim(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [a, b] = p[i],
      [c, d] = p[(i + 1) % p.length];
    s += Math.hypot(c - a, d - b);
  }
  return s;
}
const sheetOf = s => {
  const m = String(s || '')
    .split('x')
    .map(Number);
  const a = m[0] || 2800,
    b = m[1] || 2070;
  return { L: Math.max(a, b), W: Math.min(a, b) };
};
const isRect = p =>
  p.poly.length === 4 &&
  p.poly.every(
    ([x, y]) => (Math.abs(x) < 0.2 || Math.abs(x - p.w) < 0.2) && (Math.abs(y) < 0.2 || Math.abs(y - p.h) < 0.2)
  );

const LOADS = {
  light: { n: 'Light things', q: 0.0004 },
  normal: { n: 'Clothes & boxes', q: 0.0008 },
  books: { n: 'Books & records', q: 0.0014 }
};
const SAGMAT = {
  melamine: [2500, 2],
  mdfpaint: [3000, 2],
  mdfmicro: [3000, 2],
  veneer: [3000, 2],
  ply: [6500, 1.5],
  hpl: [3800, 1.8],
  solid: [9000, 1.3],
  hdf: [3500, 2]
};
function sagOf(L, dep, t, type, load) {
  const [E, cr] = SAGMAT[type] || SAGMAT.melamine,
    I = (dep * t * t * t) / 12,
    w = (LOADS[load] || LOADS.normal).q * dep,
    d = ((5 * w * Math.pow(L, 4)) / (384 * E * I)) * cr,
    lim = L / 300,
    r = d / lim;
  return { d, lim, r, Lmax: L * Math.pow(1 / Math.max(r, 1e-6), 1 / 3) };
}
const FITS = {
  ties: {
    n: 'Pull-out tie and belt rack',
    s: 'Tie & belt rack',
    grp: 'clothes',
    minW: 300,
    maxW: 2000,
    minD: 450,
    h: 0,
    tip: 'A slim rack that slides out of the side of the cupboard, with hooks for ties, belts and scarves.',
    hw: w => 'Pull-out tie and belt rack, side-mounted',
    note: 'screws to the cabinet side under the rail'
  },
  valet: {
    n: 'Pull-out valet rod',
    s: 'Valet rod',
    grp: 'clothes',
    minW: 300,
    maxW: 2000,
    minD: 300,
    h: 0,
    tip: 'A rod that slides out of the side to hang tomorrow’s outfit or the ironing on.',
    hw: w => 'Pull-out valet rod 300–350 mm, side-mounted',
    note: 'screws to the cabinet side at about 1700 mm'
  },
  jewel: {
    n: 'Jewellery and watch drawer',
    s: 'Jewellery drawer',
    grp: 'drawers',
    minW: 300,
    maxW: 1200,
    minD: 350,
    h: 100,
    multi: 1,
    tip: 'A shallow internal drawer with a velvet insert: trays for rings, earrings and watches.',
    hw: w => 'Velvet jewellery and watch insert, cut to size',
    note: 'for the internal drawer of this width'
  },
  hamper: {
    n: 'Pull-out laundry baskets',
    s: 'Laundry baskets',
    grp: 'drawers',
    minW: 400,
    maxW: 1000,
    minD: 450,
    h: 450,
    tip: 'A pull-out frame with two or three removable laundry bags — sort the wash where you undress.',
    hw: w => 'Pull-out laundry hamper, 2–3 removable bags',
    note: 'bottom-mounted on runners'
  },
  ironing: {
    n: 'Fold-out ironing board',
    s: 'Ironing board',
    grp: 'extra',
    minW: 400,
    maxW: 1200,
    minD: 450,
    h: 110,
    tip: 'An ironing board that folds out of a shallow drawer and swivels; it needs a socket nearby.',
    hw: w => 'Fold-out ironing board in a drawer (e.g. Häfele Ironfix)',
    note: 'needs about 1100 mm of free floor in front and a socket'
  },
  mirror: {
    n: 'Pull-out mirror',
    s: 'Pull-out mirror',
    grp: 'extra',
    minW: 300,
    maxW: 2000,
    minD: 450,
    h: 0,
    tip: 'A full-length mirror on a side runner: pull it out and swivel it to see yourself.',
    hw: w => 'Pull-out swivel mirror, about 1,000 × 300 mm, side-mounted',
    note: 'needs about 1100 mm of free height in this level'
  },
  safe: {
    n: 'Hidden safe',
    s: 'Safe',
    grp: 'extra',
    minW: 400,
    maxW: 2000,
    minD: 380,
    h: 300,
    tip: 'A small furniture safe bolted to the bottom and the wall behind the back panel.',
    hw: w => 'Small furniture safe, about 350 × 250 × 300 mm',
    note: 'bolt it through the cabinet bottom into the floor or wall'
  },
  suitcase: {
    n: 'Space for suitcases',
    s: 'Suitcases',
    grp: 'extra',
    minW: 450,
    maxW: 2000,
    minD: 450,
    h: 350,
    tip: 'Keep the top level free for suitcases and bedding. A telescopic hook pulls them down from up high.',
    hw: w => 'Telescopic hook to pull things down from high shelves',
    note: 'hangs inside the door'
  },
  trouser: {
    grp: 'clothes',
    n: 'Pull-out trouser rack',
    s: 'Trouser rack',
    minW: 400,
    maxW: 1000,
    minD: 480,
    h: 130,
    tip: 'A frame with bars that slides out; trousers hang folded over the bars.',
    hw: w => 'Pull-out trouser rack, full extension',
    note: 'buy the size made for this inside width'
  },
  shoe: {
    grp: 'drawers',
    n: 'Pull-out shoe rack',
    s: 'Shoe rack',
    minW: 450,
    maxW: 1000,
    minD: 400,
    h: 200,
    multi: 1,
    tip: 'A sloping wire shelf on runners; about one pair per 220 mm of width.',
    hw: w => 'Pull-out shoe rack, side-mounted, width-adjustable',
    note: 'screws to both cabinet sides'
  },
  basket: {
    grp: 'drawers',
    n: 'Pull-out wire basket',
    s: 'Baskets',
    minW: 400,
    maxW: 1000,
    minD: 450,
    h: 220,
    multi: 1,
    tip: 'Wire or mesh baskets on runners for socks, scarves and bags.',
    hw: w => 'Pull-out wire basket on runners',
    note: 'screws to both cabinet sides'
  },
  idrawer: {
    grp: 'drawers',
    n: 'Internal drawer',
    s: 'Internal drawers',
    minW: 300,
    maxW: 1200,
    minD: 300,
    h: 170,
    multi: 1,
    tip: 'Low drawers hidden behind the doors. They run on packers so they clear the door and the hinges; the door must open a full 90°.',
    hw: w => '',
    note: ''
  },
  larder: {
    grp: 'extra',
    n: 'Tall larder pull-out',
    s: 'Larder pull-out',
    minW: 270,
    maxW: 620,
    minD: 470,
    h: 0,
    tip: 'One tall frame with 4–6 baskets that slides straight out on heavy runners; the door is fixed to the front of the frame, so it pulls out with it. You see everything from both sides.',
    hw: w =>
      `Tall larder pull-out, full extension, 4–6 baskets, for a ${w < 330 ? '300' : w < 430 ? '400' : w < 530 ? '500' : '600'} mm cabinet (e.g. Kesseböhmer Dispensa, Hettich, Blum Space Tower)`,
    note: 'the door is screwed to the frame, not hung on hinges'
  },
  lift: {
    grp: 'clothes',
    n: 'Pull-down clothes rail',
    s: 'Pull-down rail',
    minW: 450,
    maxW: 1150,
    minD: 480,
    h: 0,
    tip: 'A rail at the very top that swings down to you on a pull rod — it makes the space above head height usable. It replaces the ordinary rail.',
    hw: w =>
      `Pull-down wardrobe rail (wardrobe lift) for ${w < 600 ? '450–600' : w < 830 ? '600–830' : '830–1150'} mm, 10 kg`,
    note: 'needs a clear swing path in front: no shelf or drawer front in its way'
  }
};
const WOB = {
  socket: { n: 'Socket', w: 80, h: 80, y: 300 },
  switch: { n: 'Light switch', w: 80, h: 80, y: 1050 },
  radiator: { n: 'Radiator', w: 1000, h: 600, y: 150 },
  pipe: { n: 'Pipe', w: 22, h: 0, y: 0 },
  fuse: { n: 'Fuse box', w: 450, h: 600, y: 1500, keep: 1 },
  meter: { n: 'Meter', w: 350, h: 450, y: 1300, keep: 1 },
  boiler: { n: 'Boiler', w: 450, h: 750, y: 1600, keep: 1 },
  tap: { n: 'Stopcock / tap', w: 150, h: 150, y: 350, keep: 1 },
  access: { n: 'Inspection hatch', w: 400, h: 400, y: 600, keep: 1 }
};
const FRIDGE_PAD = 0; /* level height above the fridge niche height, set after measuring */
const BUMPS = { chimney: 'Chimney breast', pillar: 'Pillar', pipes: 'Boxed-in pipes', other: 'Bump in the wall' };
const COBJ = {
  dormer: 'Dormer window',
  light: 'Ceiling light',
  smoke: 'Smoke detector',
  hatch: 'Loft hatch in the ceiling'
};
const DOGS = {
  arch: 'Arch',
  round: 'Porthole',
  square: 'Rounded square',
  house: 'Little house',
  double: 'Twin arches',
  bars: 'Arch + air slots'
};
function applyLinks(st) {
  const ss = st.sections || [];
  ss.forEach((x, i) => {
    const m = x.link;
    if (m == null || m === '') return;
    const src = ss.find(y => y.id === m);
    if (!src || src === x) return;
    if (
      !src ||
      (src.link != null && src.link !== '') ||
      (src.base !== x.base && !(src.base !== 'panel' && x.base !== 'panel' && src.base !== 'door' && x.base !== 'door'))
    ) {
      return;
    }
    x.zones = JSON.parse(JSON.stringify(src.zones)).map(z =>
      Object.assign(z, { id: String(z.id || 'z') + '~' + (x.id || i) })
    );
    if (src.back) x.back = src.back;
  });
}
/* shelf spacing: how the free height in a level is shared between the gaps (bottom gap first) */
const SPACINGS = [
  ['even', 'Even'],
  ['bottom', 'Tall bottom'],
  ['top', 'Tall top'],
  ['middle', 'Tall middle']
];
function shelfYs(y0, top, n, ts, mode) {
  const g = [];
  for (let i = 0; i <= n; i++) {
    const t = n ? i / n : 0;
    g.push(
      mode === 'bottom'
        ? 1.6 - 0.6 * t
        : mode === 'top'
          ? 1 + 0.6 * t
          : mode === 'middle'
            ? 1 + 0.6 * (1 - Math.abs(2 * t - 1))
            : 1
    );
  }
  const sum = g.reduce((a, b) => a + b, 0),
    free = top - y0 - n * ts,
    ys = [];
  let y = y0;
  for (let j = 0; j < n; j++) {
    y += (free * g[j]) / sum;
    ys.push(y);
    y += ts;
  }
  return { ys, min: (free * Math.min(...g)) / sum };
}
/* clothes rail: comfortable height follows the person set under Room → people (1.75 m if none) */
function railReach(S) {
  const h = Math.max(800, Math.min(2200, +((S.room || {}).person || {}).h || 1750));
  return { h, ideal: Math.round(h * 0.99), easy: Math.round(h * 1.07) };
}
/* vertical divider presets → divider centres from the inside left, so the compartments come out exactly in these proportions */
const VD_MODES = {
  even: { l: 'Even', ok: n => n >= 1 },
  third: { l: '⅓ · ⅔', ok: n => n === 1, r: [1, 2] },
  golden: { l: 'Golden', ok: n => n === 1, r: [0.382, 0.618] },
  wide: { l: 'Wide middle', ok: n => n === 2 || n === 4, r: n => (n === 2 ? [1, 2, 1] : [1, 1, 2, 1, 1]) },
  shift: { l: 'Shifted', ok: n => n >= 2, r: n => [1, ...Array(n - 1).fill(2), 1] }
};
/* the same presets for a level with doors in front of its uprights: here the DOORS get the proportions,
   not the compartments behind them (the outer doors also cover the side panels, so "even compartments" would
   give wider outer doors). span = from the left outer edge of the doors to the right one; returns upright
   centres measured from that left edge. */
function vdPosDoors(n, mode, span) {
  const base = String(mode || 'even').replace(/-r$/, ''),
    M = VD_MODES[base] || VD_MODES.even;
  let r = M.ok(n) && M.r ? (typeof M.r === 'function' ? M.r(n) : M.r).slice() : Array(n + 1).fill(1);
  if (/-r$/.test(mode)) r.reverse();
  const sum = r.reduce((a, b) => a + b, 0),
    out = [];
  let x = 0;
  for (let j = 0; j < n; j++) {
    x += (span * r[j]) / sum;
    out.push(x);
  }
  return out;
}
function vdPos(n, mode, w, tc, lb = 0) {
  const base = String(mode || 'even').replace(/-r$/, ''),
    M = VD_MODES[base] || VD_MODES.even;
  let r = M.ok(n) && M.r ? (typeof M.r === 'function' ? M.r(n) : M.r).slice() : Array(n + 1).fill(1);
  if (/-r$/.test(mode)) r.reverse();
  const use = w - 2 * lb - n * tc,
    sum = r.reduce((a, b) => a + b, 0),
    out = [];
  let x = lb;
  for (let j = 0; j < n; j++) {
    x += (use * r[j]) / sum;
    out.push(x + tc / 2);
    x += tc;
  }
  return out;
}
