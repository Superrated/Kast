/* ============================================================
   Kast — all prices in one place.
   Every price is in euro, INCLUDING 21 % Belgian VAT.
   build.py copies this file into the app (index.html).
   The "Update prices" button in the app starts a task that looks the
   board prices up again at Hanssens Hout and Woodcenter and rewrites
   the numbers in this file.
   ============================================================ */

// when the prices below were last looked up
const PRICE_DATE='16 November 2026';

// the shops boards can be priced at; 'best' means "cheapest of these per board"
const SHOPS={hh:'Hanssens Hout',wc:'Woodcenter'};
const PR='Pierard'; // hardware webshop for the Blum hinges and plates
const HH=SHOPS.hh;

/* Full sheets, € per m² per shop.
   Keys are the board types of the app. hdf3 = 3 mm white hardboard. */
const SHOP_M2={
  melamine:{hh:8.66,wc:16.67},   // HH: Krono white 18 mm 2800×2070 · WC: Egger W1000 white 18 mm 2800×2070
  mdfpaint:{hh:13.14,wc:13.31},  // raw MDF 18 mm (HH 2440×1220 · WC 1250×2500)
  mdfmicro:{hh:13.14,wc:13.31},  // the same raw MDF; the microcement itself is under FINISH_PRICE
  veneer:{hh:44.99,wc:46.04},    // oak-veneered MDF 19 mm (HH Decospan 2500×1240 · WC quarter-cut A/B 2800×2070)
  ply:{hh:51.67},                // birch plywood WBP B/BB 18 mm — Woodcenter lists no birch plywood
  solid:{hh:103.48},             // finger-jointed oak panel 19 mm — not at Woodcenter
  hdf3:{hh:4.19,wc:3.68}         // white hardboard 3 mm (WC: Unalit wit 122×244)
};

/* Reference price per board type: used for thickness scaling and when no shop has it.
   p = € per m², t = the thickness that price is for. */
const PRICE_M2={
  melamine:{p:8.66,t:18,src:HH,ref:'Krono melamine 18 mm, 2800×2070: € 50.21 a sheet (Hanssens Hout) · Egger W1000 18 mm: € 16.67 per m² (Woodcenter)'},
  mdfpaint:{p:13.14,t:18,src:HH,ref:'MDF 18 mm: € 39.12 a 2440×1220 sheet (Hanssens Hout) · € 13.31 per m² (Woodcenter)'},
  mdfmicro:{p:13.14,t:18,src:HH,ref:'MDF 18 mm, as painted MDF (the microcement is priced under Finishing)'},
  veneer:{p:44.99,t:19,src:HH,ref:'Oak-veneered MDF 19 mm: € 139.46 a 2500×1240 sheet (Hanssens Hout) · € 266.87 a 2800×2070 sheet (Woodcenter)'},
  ply:{p:51.67,t:18,src:HH,ref:'Birch plywood WBP B/BB 18 mm, 2500×1250: € 161.46 a sheet (Hanssens Hout)'},
  solid:{p:103.48,t:19,src:HH,ref:'Finger-jointed European oak panel 19 mm: € 103.48 per m² (Hanssens Hout)'},
  hdf:{p:13.18,t:8,src:HH,ref:'White melamine 8 mm: € 13.18 per m² (Hanssens Hout)'},
  hpl:{p:75,t:19,est:1,ref:'HPL / Fenix on MDF — not looked up'}
};

/* Pre-edged white 18 mm furniture panels, 2500 mm long: € per panel, by width in mm */
const STOCK_PRICES={
  hh:{200:9.35,250:10.78,300:12.29,400:15.34,500:18.59,550:19.97,600:21.54,800:26.74},
  wc:{250:12.33,300:13.65,350:15.43,400:16.64,500:20.69}
};

/* Finishing, € per unit */
const FINISH_PRICE={
  edge:{p:1.20,unit:'m',est:0,src:'Hubo',ref:'Iron-on edge band 22 mm, 5 m roll € 5.99 (Hubo, 16 Nov 2026)'},
  paint:{p:6.5,unit:'m²',est:1,ref:'Typical cost of MDF primer and acrylic lacquer'},
  micro:{p:45,unit:'m²',est:0,src:'your price',ref:'€ 45 per m² as you set it. For comparison: Silk Plaster complete kit € 27.52 per m²; Hornbach beton ciré ready mix with primer and coating ≈ € 45–55 per m² (looked up 16 Nov 2026)'}
};

/* Hardware: [pattern matched against the hardware list, € each (or per m / m²), 1 = typical price (not looked up), shop, unit]
   Looked up 16 Nov 2026, incl. VAT:
   Pierard — Blum CLIP top BLUMOTION 110° 71B3550 € 7.35, half overlay 71B3650 € 7.82, inset 71B3750 € 8.18, CLIP 71T3650 (no soft-close) € 4.40,
             CLIP 155° 71T7550 € 10.78, cross mounting plate 173H7100 € 1.26, MOVENTO 500 pair € 71.52 (+ front couplings € 3.93 each),
             TIP-ON (unit € 11.49 + holder € 2.29), Bosch beech dowels 8×40 150 pcs € 8.52, cabinet connector screw 6×31–38 € 0.80
   keukenlade.nl — Blum TANDEM BLUMOTION 550 pair € 35.80 (without couplings) · hwt-pro.com — TANDEM locking couplings pair € 2.96
   Hornbach — Hettich connecting screws 7×50, 50 pcs € 9.50 · Hettich plinth foot Euro 100 mm € 0.95 each
   Gamma — HandsOn shelf supports with sleeve, 12 pcs € 6.19 · Suki adjustable cabinet hangers 150 kg, 2 pcs € 8.69 (rail extra) */
const PRICE_HW=[[/Round pod: bendable plywood/,55,1],[/Round pod: ribbed cushion/,140,1],[/contrast cubbies/,14,1,'','m2'],[/Centre support for the wardrobe rail/,4.5,1],[/colour-drenched level/,14,1,'','m2'],[/Levelling shims/,8,1],[/Push-to-open latches/,3.5,1],[/library ladder/i,390,1],[/Heavy-duty full-extension runners/,42,1],[/cable chain/,14,1],[/Power socket inside/,16,1],[/trouser rack/,62,1],[/shoe rack/,48,1],[/wire basket/,34,1],[/wardrobe lift/,79,1],[/MODUL.*hinge/,2.4,1],[/MODUL mounting plate/,0.9,1],[/STANDARD 230M/,7.5,1],[/CLIP top BLUMOTION 110.*inset/,8.18,0,PR],[/CLIP top 110° hinge, unsprung/,4.40,0,PR],[/CLIP top BLUMOTION 110° hinge, half overlay/,7.82,0,PR],[/CLIP top BLUMOTION/,7.35,0,PR],[/155° zero-protrusion/,10.78,0,PR],[/CLIP mounting plate/,1.26,0,PR],[/Clip-top hinges 110/,4.8,1],[/MOVENTO.*runners/,71.52,0,PR],[/TANDEM.*runners/,35.80,0,'keukenlade.nl'],[/locking devices/,2.96,0,'hwt-pro.com'],[/TIP-ON/,13.78,0,PR],[/Full-extension runners/,19,1],[/Minifix/,0.55,1],[/Chipboard screws/,0.04,1],[/Confirmat/,0.19,0,'Hornbach'],[/[Dd]owels/,0.06,0,PR],[/Back nails/,0.02,1],[/Shelf supports/,0.52,0,'Gamma'],[/Battens 45/,6,1],[/Magnetic push latches/,3.5,1],[/T-nuts/,0.35,1],[/climbing holds/,3.5,1],[/ladder rail/,48,1,'','m'],[/ladder,|Library ladder|ladder \(/,390,1],[/Chalkboard paint/,18,1,'','m2'],[/Magnetic primer/,36,1,'','m2'],[/Pegboard pegs/,15,1],[/Wardrobe rail/,9.5,1],[/plinth legs/,0.95,0,'Hornbach'],[/cabinet hangers/,4.35,0,'Gamma'],[/connector bolts/,0.80,0,PR],[/Steel angle/,14,1],[/grommet/,3.5,1],[/sliding door track/,85,1],[/Pocket door system/,165,1],[/Projector screen/,450,1],[/Dog cushion/,60,1],[/LED strip/,29,1],[/LED driver/,36,1],[/Furniture legs/,6.5,1],[/French cleat/,9,1],[/levelling feet/,1.5,1],[/Lip strip/,3,1],[/Curtain track/,26,1],[/Hidden door/,230,1],[/Wall fixing cleats/,3,1],[/Cork board/,22,1,'','m2'],[/acrylic mirror/,45,1],[/Busy board parts/,60,1],[/marbles/,8,1],[/mural/,14,1,'','m2'],[/Slat wall/,95,1,'','m2'],[/Picture frames/,12,1],[/planters/,14,1],[/baseplates/,8,1],[/Relief tiles/,3.5,1]];
const HANDLE_PRICE={wood:1.2,other:6.5}; // handles without their own rule: cheap wooden ones in budget mode, otherwise this

/* Cabinet maker, fitted: € per metre of cabinet EXCLUDING VAT, by front material (DM-Line and Bobex price guides) */
const MAKER_PRICE={perMetre:{melamine:[1200,1600],mdfpaint:[1400,1750],mdfmicro:[1600,2100],hpl:[1400,1750],veneer:[1600,2200],ply:[1600,2200],solid:[1800,3500]},other:[1200,1750],drawer:[300,350],light:[200,400]};
