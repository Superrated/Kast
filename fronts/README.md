# BRUIS Fronts — prototype

A configurator for custom fronts on IKEA cabinets (PAX wardrobes, METOD kitchens, BESTÅ storage), built next to Fitted on the `fronts-prototype` branch.

**Build:** `python3 fronts/build.py` → `fronts/index.html` (one self-contained page). **Check:** `python3 fronts/test.py`.

It borrows from Fitted so both look the same: the colour tokens (light and dark) from `src/css/10-look.css` and the RAL colour list from `src/js/00-core-data.js` are copied in at build time.

## How it works

Four steps, like Fitted: **1 Cabinets → 2 Fronts → 3 Handles → 4 Order**, with one live picture — a still, ray-traced render of your cabinets in a room — and the price always in view.

- **Cabinets**: paste your IKEA list first — the planner's shopping/item list, the cart or an order confirmation, copied as text (or opened as a .txt/.csv file, or read from the clipboard with **Paste**). It is read while you type: the preview shows what was found per system with one **Use these cabinets** button (and Undo). Works with one item per line, items spread over several lines (name / description / price / quantity), table rows with tabs, and typed lines like "pax 2x 50x236"; English, Dutch, French and German words; METOD cabinets that come with drawers or doors ("with 3 drawers", "4 faces/4 tiroirs", "met 2 deuren") get that front layout; PAX combinations are split into frames (150 → 100 + 50); odd sizes are snapped to IKEA sizes with a note; IKEA doors and drawer fronts in the list are counted and compared with ours. No list: start from a common layout, type the widths ("100 50 100", "2x100") or add one at a time. Cabinet cards fold to one line.
- **Look**: a design studio — the render runs edge to edge with a quiet caption under it; stone white, soft black ink and hairline rules, colour only from the fronts; Bricolage Grotesque, light and large for headings, the BRUIS wordmark bold and condensed; materials as a spec-sheet list, presets and styles as borderless pictures, near-square corners, black buttons. One light theme on every device. The price bar carries a paint chip of the main look.
- **Presets**: every common layout and demo shows a small drawing of the design (`designThumb` in `20-draw.js`). Common layouts come with real front layouts (drawers, sink, fridge): PAX Three wide, Open in the middle, Wide narrow wide, Two 75s, Under a low ceiling; METOD Small kitchen, With a fridge, Long run, Pantry wall, All drawers; BESTÅ TV bench, Low sideboard, Media wall, Tall wall, Hallway.
- **Demos**: six ready-made designs to open from the Cabinets step — Sage kitchen, Charcoal oak kitchen, Midnight wardrobe, Birch under the eaves, Walnut media wall, Terracotta sideboard (`src/js/47-demos.js`). Each sets the cabinets, looks, side panels, edge and handles; Undo brings back what you had.
- **Side panels**: none, left, right or both ends — one choice for the whole run, in the look of "all fronts" (glass becomes painted). 19 mm, flush with the fronts: PAX 60 cm deep, METOD base/tall 62, wall 39, BESTÅ 42; as high as the cabinet. A kitchen gets them on the base row and the wall row; a tall cabinet at the end covers both. Priced like fronts (no hinge, no handle) and listed in the order.
- **Fronts**: one look for all fronts, then tap any front to give it its own (or copy it to its whole cabinet). The range is curated: Flat, Fluted, Grooves (fine V-grooves, close / classic / wide); no Shaker or Scallop; fluted and grooves are MDF only (painted or raw), wood and ply come flat; painted in 12 colours (each a RAL colour), oak veneer, walnut veneer, birch plywood, pine plywood (bold flame grain) — all in hardwax oil with 4 Rubio Monocoat tints (Pure, White 5%, Smoke 5%, Charcoal), fluted glass in a slim frame, and two budget boards — raw MDF and untreated birch ply.
- **Surprise me**: a recipe, not a dice roll (one bold colour, wood and one colour, two colours that go together, a glass accent, birch or pine ply with colour, charcoal oak, walnut); one edge for all fronts: round 2 mm or chamfer) applied by what each front is: tall door, drawer, wall cabinet, top row.
- **The render**: one still, photographic picture that appears instantly, made with hacks rather than live ray tracing. The empty room (oak plank floor, plaster wall with skirting, ceiling, a tall window on the left, a rug) is ray-traced once ahead of time with `tools/prerender.js` and ships inside the page as a picture (`src/assets/room-bg.jpg`), together with the light of that room as an HDR panorama (`src/assets/room-env.png`, RGBE). For your design only the cabinets are drawn on top, from the same fixed camera: lit by the room's panorama and by a sun through the window (which also throws the window's shadow over the fronts); the sun patch with your cabinets' shadows is added onto the room picture; soft contact shadows darken the floor and wall around the cabinets; rounded or chamfered edges, real flute ribs and a plant beside the run. The picture is cropped around your cabinets to fill the stage. Preset and demo cards get small renders made the same way while the browser is idle (kept in the browser), showing their drawing until then. Without WebGL the flat drawing is shown.
- **Pre-render the room**: `NPM_DIR=/path/to/node_modules node tools/prerender.js [samples] [panorama samples]`, then `python3 build.py`. Needs Playwright and three@0.170.0, three-mesh-bvh@0.8.3, three-gpu-pathtracer@0.0.23; a minute or two with a graphics card (add `SOFTWARE_GL=1` on a machine without one — much slower). Change the room (`ROOM` and `prerenderRoom()` in `25-3d.js`) and run it again.

| File | What it does |
|---|---|
| `src/js/00-data.js` | IKEA systems and sizes, front layouts, styles, materials, colours, handles, prices |
| `src/js/10-model.js` | the project (saved in the browser), cabinet → fronts with real sizes, layout, price |
| `src/js/20-draw.js` | the flat picture (SVG): each front in its own look, with its handle; tap a front to select it |
| `src/js/25-3d.js` | the picture: the pre-rendered room, the cabinets drawn into it (materials, flutes, handles, sun, contact shadows, plant), the crop, card renders, tap to select; and the room pre-render itself (`#prerender`) |
| `tools/prerender.js` | ray-traces the empty room once and saves `src/assets/room-bg.jpg` and `room-env.png` |
| `src/js/45-surprise.js` | Surprise me: the recipes, colour pairs and handle rules |
| `src/js/30-ui.js` | the steps, panels, price bar, order form, every tap |
| `src/js/40-import.js` | reads a pasted IKEA list (planner, cart, order; EN/NL/FR/DE; one line or several per item) into cabinets with their front layouts, and the live preview |
| `src/fronts.css` | layout for computer and phone |

## Sizes (from IKEA's product pages, Nov 2026)

- **PAX**: frames 50 / 75 / 100 × 201 / 236 cm. Doors 49.5 (or 24.5) wide; 229.4 cm high on a 236 frame, 195 on a 201 frame. A 75 frame takes a 50 + a 25 door.
- **METOD**: fronts are 3 mm smaller than the cabinet both ways (39.7 × 79.7 for 40 × 80).
- **BESTÅ**: fronts 59.6 wide; 63.7 / 37.7 / 25.7 high.

Still to check before making real fronts: the 201-frame PAX door height (taken as 195.0), the 25 cm PAX door width (taken as 24.5), and the hinge-cup positions for each system — measure an original IKEA door.

## Prototype limits

- Painted prices are set against other makers of IKEA fronts (Nov 2026, see the note in `00-data.js`): a painted 60×80 METOD door ≈ €128 and a PAX door ≈ €260 before handles. Other prices, delivery and lead times are examples. Painted orders show 1–2 weeks extra (spray shop).
- The order button collects name, e-mail and postcode but sends nothing; it shows the order as text to copy.
- One system per order.

IKEA, PAX, METOD and BESTÅ are trademarks of Inter IKEA Systems B.V. BRUIS is not part of or endorsed by IKEA.
