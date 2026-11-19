# How Fitted is built

Fitted is one web page with no server and no framework. `python3 build.py` glues the pieces in `src/` into `index.html`.

## Files

| Where | What |
|---|---|
| `src/app.html` | The page: header, side panel, tabs, dialogs. Markup only. |
| `src/css/*.css` | Styles, loaded in file-name order. Colours are tokens on `:root` (light and dark). |
| `src/js/*.js` | The program, in file-name order: one topic per file (see the comment at the top of each). |
| `src/prices.js` | Every price, incl. VAT: boards per shop, hardware, delivery per shop. |
| `src/lang.js` | Translations (English only for now; see "Adding a language" in the README). |

## How it works

1. **The design** is one object, `S`: the room (`S.room`), the columns (`S.sections`, each with levels in `zones`), materials (`S.mat`), options (`S.opts`) and, for a room with several walls, `S.proj`.
2. **`build(S)`** (`10-build.js`) turns it into geometry `G`: every part (`G.panels`), front (`G.fronts`), 3D item (`G.items`), the hardware list (`G.H`) and design notes (`G.warns`).
3. Every view reads `G`: the drawing (`31-elevation.js`), cut list and prices (`65-`, `66-`), the guide (`70-`), 3D (`80-`), exports (`50-`).
4. **`changed()`** rebuilds `G` and redraws after every edit; undo/redo keeps snapshots of `S`.
5. **Clicks**: every button has `data-act="…"`; `92-events.js` handles them in one switch. Number fields use `data-p="path.in.S"` and are saved automatically.

## Common extensions

- **A new column type**: add it to `PRESETS` (`00-core-data.js`) and to the "Add a column" groups in `40-side-panel.js`. If the wizard should offer it, add it to `MUSTS` and `WPUR`, and a case in the randomizer's zone generator (`60-randomizer.js`).
- **A new inside fitting**: add it to `FITS` with `grp:'clothes'|'drawers'|'extra'`, a size (`h`, `minW`, `minD`) and a hardware line. It is listed, checked and priced automatically. Draw it in `31-elevation.js` (look for `f.kind===`).
- **A new design check**: push a plain-language sentence to `G.warns` at the end of `build` (or in `20-room-checks.js`). It appears in the design notes.
- **A new price**: add it to `src/prices.js` (`PRICE_HW` matches hardware names by pattern).
- **A new language**: see the README.

## Version

The version is `APP_VERSION` in `src/js/81-room-photo.js`. Each update adds 0.001 (v0.1 → v0.101 → v0.102 …); add a line to CHANGELOG.md and the README.

## Tests

The app has no test files in the repo. The checks used during development load the built page in a headless browser and:
- click every button;
- build random designs and every column type, fitting, niche, corner angle and room restriction, checking that no part or price is invalid;
- export every file type.

`python3 build.py --source` prints the assembled source for such checks.

## Starter designs and custom boards/colours (v0.102)

- `src/js/46-custom.js`: your own colours (FIN keys `cu_…`) and board types (MATS keys `cm_…`). They are stored in `S.custom` and in localStorage (`fitted-custom`). `regCustom(st)` is called at the start of `build()`, so FIN and MATS always know them.
- `src/js/96-starters.js`: `STARTERS`, ready-made designs. To add one, add an entry whose `make()` returns a design built with `stBase({...})`. Keep each starter free of design notes; the test in `st1.py` checks this.

## Saving, rooms and sharing (v0.103)

- `55-designs.js`: the My designs window. `ioOpen(tab)` opens it and `renderDesigns()` draws the tab. `dsSave(true)` adds a design (first save or a copy). `dsAutoSoon()`/`dsAuto()` save the open design a few seconds after `changed()`. `dsStatus()` feeds the header button (`dsBadge`).
- `56-rooms-share.js`: rooms (`RM`, collection `rooms` or localStorage `fitted-rooms-v1`). `fitToRoom(st, room)` puts a design into a room. Files and text use `{app,kind:'design'|'room',version,name,design|room}`, and `ioImport(text)` opens either kind.
- `snap()` resets the undo history when the open design changes (`ui.histDoc`), so an Undo can never write one design into another.

## Technical drawings and the build lock (v0.106)

- `52-techdraw.js`: `tdSolids(G)` turns `G.items` prisms into 3D solids. Views (`tdFront`, `tdPlan`, `tdSection`, `tdExploded`) are entity lists in mm. `tdSheets()` lays them out on A3/A4 at standard scales. `pdfVec()` writes a vector PDF (Helvetica, WinAnsi), and `tdDXF()` writes the whole wall at 1:1 with layers.
- Build lock (`90-bar-views.js`): `S.lock={on,id,at}`. `lockGuard()` runs at the start of `changed()` and puts back any change except `S.done` (workshop progress). `lockOn()` is called by Workshop mode, and `lockOff()` is the Unlock button.

## Workshop Boxes 3D (v0.108)

- `72-workshop-3d.js`: its own small three.js scene for one box (`WX`). Solids come from `tdSolids`/`tdCols`, offsets from `tdOffset`, and letters from `tdPartRows` (all in `52-techdraw.js`), so the 3D and the PDF sheets always match. `wxMatch` links a solid to its cut-list part (for edge banding, grain and holes).
- Tests with the real three.js r128: clone `mrdoob/three.js` at tag r128 (sparse, `build/`) and inline `three.min.js` in the test page.

## Parts area (v0.109)

- `91-parts-nav.js`: the tabs Parts · Drawings · Workshop. The views are v-cut (List / Shopping / Price, which are `<section data-psec>` blocks of one render), v-sheets, v-draw (Technical drawings via `tdBodyHTML`, plus Labels & files), v-loft and v-work. `pnGo(key)` opens a section, `showTab(tab)` switches the view, and the last place is kept in localStorage `fitted-pn`.

## Machining drawings (v0.110)

- `53-machining.js`: `mdPart(p,den)` turns a cut-list part (poly, holes, notes, edge banding, grain) into td-style entities. `mdHoleRows` builds the hole table, `mdBlock` the HTML for the guide, and `mdExportPDF` writes one A4 page per part. The 0 corner: sides have x = 0 at the front edge; other carcass parts have y = 0 at the front edge.

## Your shops and prices (v0.111)

- `68-my-shops.js`: `MS={shops,offers}` (localStorage `fitted-myshops`, plus `data/users/<id>/fitted/myshops` in the db). `msOffer(n)` picks the price for a sheet material, `msShip(name,subtotal)` works out delivery or pick-up, and `msHTML(nest)` draws the panel under Price. All of it is hooked into `priceRows()`.
