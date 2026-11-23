# BRUIS Fronts — prototype

A configurator for custom fronts on IKEA cabinets (PAX wardrobes, METOD kitchens, BESTÅ storage), built next to Fitted on the `fronts-prototype` branch.

**Build:** `python3 fronts/build.py` → `fronts/index.html` (one self-contained page). **Check:** `python3 fronts/test.py`.

It borrows from Fitted so both look the same: the colour tokens (light and dark) from `src/css/10-look.css` and the RAL colour list from `src/js/00-core-data.js` are copied in at build time.

## How it works

Four steps, like Fitted: **1 Cabinets → 2 Fronts → 3 Handles → 4 Order**, with a live picture (flat front view or 3D) and the price always in view.

- **Cabinets**: start from a common layout, type the widths ("100 50 100", "2x100"), add one at a time, or paste the IKEA planner list.
- **Fronts**: one look for all fronts, then tap any front to give it its own (or copy it to its whole cabinet). The range is curated: Flat or Fluted; painted in 12 colours (each a RAL colour), oak veneer, walnut veneer, birch plywood, fluted glass in a slim frame, and two budget boards — raw MDF and untreated birch ply.
- **Surprise me**: a recipe, not a dice roll (one bold colour, wood and one colour, two colours that go together, a glass accent, birch with colour, walnut) applied by what each front is: tall door, drawer, wall cabinet, top row.
- **3D**: three.js r159 (same as Fitted), loaded the first time you open 3D.

| File | What it does |
|---|---|
| `src/js/00-data.js` | IKEA systems and sizes, front layouts, styles, materials, colours, handles, prices |
| `src/js/10-model.js` | the project (saved in the browser), cabinet → fronts with real sizes, layout, price |
| `src/js/20-draw.js` | the flat picture (SVG): each front in its own look, with its handle; tap a front to select it |
| `src/js/25-3d.js` | the 3D view: boxes, fronts with paint / wood / flute / glass materials, handles, turn, zoom, tap |
| `src/js/45-surprise.js` | Surprise me: the recipes, colour pairs and handle rules |
| `src/js/30-ui.js` | the steps, panels, price bar, order form, every tap |
| `src/js/40-import.js` | reads a pasted IKEA planner list (frames and cabinets with their sizes) |
| `src/fronts.css` | layout for computer and phone |

## Sizes (from IKEA's product pages, Nov 2026)

- **PAX**: frames 50 / 75 / 100 × 201 / 236 cm. Doors 49.5 (or 24.5) wide; 229.4 cm high on a 236 frame, 195 on a 201 frame. A 75 frame takes a 50 + a 25 door.
- **METOD**: fronts are 3 mm smaller than the cabinet both ways (39.7 × 79.7 for 40 × 80).
- **BESTÅ**: fronts 59.6 wide; 63.7 / 37.7 / 25.7 high.

Still to check before making real fronts: the 201-frame PAX door height (taken as 195.0), the 25 cm PAX door width (taken as 24.5), and the hinge-cup positions for each system — measure an original IKEA door.

## Prototype limits

- Prices, delivery and lead time are examples.
- The order button collects name, e-mail and postcode but sends nothing; it shows the order as text to copy.
- One system per order.

IKEA, PAX, METOD and BESTÅ are trademarks of Inter IKEA Systems B.V. BRUIS is not part of or endorsed by IKEA.
