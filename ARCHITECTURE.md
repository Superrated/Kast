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

`python3 build.py && python3 tests/run.py` — run after every change. It opens the built page in headless Chrome (Playwright).

- `tests/designs/*.json`: the test designs (9 starters + 14 random walls, made once by `tests/make_designs.py`).
- `tests/snapshot.js`: per design, the cut list, hardware (`G.H`), design notes, price and how 3D boards link to parts.
  Compared with `tests/expected/*.json`; any difference fails and is shown. When a change is meant to change
  results, check the differences, then `python3 tests/run.py --update`.
- `tests/screens.js`: on the starters, every tab, workshop 3D, drawing sheets, DXF and both shop forms.
- A test fails on any page error, any problem reported with `oops()`, or a drilled part without a 3D board.
- Offline: set `THREE_JS=/path/to/three.min.js` (e.g. from `npm i three@0.159.0`) and the page gets that copy.

## Code layout and errors (v0.114)

- Source is formatted with prettier (`.prettierrc.json`, 120 columns). Keep it that way: `npx prettier --write "src/js/*.js" "src/css/*.css"`. `src/prices.js` and `src/lang.js` are not formatted (the price task edits prices.js by pattern).
- `build.py` shrinks the program with terser (local names only, every global keeps its name) and strips spaces from the CSS. `--plain` builds it unshrunk. Markers may have spaces after them (`/*@FORMS@*/ null`).
- Never write `catch(e){}`. Call `oops(where, e)` (`30-ui-helpers.js`); add `1` as third argument for things allowed to fail (storage, clipboard).
- `10-build.js` `linkPanels()` links each part to its 3D board (`item.pan`, `item.panSw`, `item.panOff` for framed doors).
- `58-sync-settings.js`: settings in `SYNC` are kept in localStorage and in `data/users/<id>/fitted/settings`. To sync another setting, add its key with an `apply()`.
- three.js r159 from jsDelivr; `srgb(texture)` and `threeOut(renderer, sRGB)` (`80-3d.js`) keep the r128 look. r160+ has no `three.min.js`; moving on needs ES modules.

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

## Parts area (v0.109)

- `91-parts-nav.js`: the tabs Parts · Drawings · Workshop. The views are v-cut (List / Shopping / Price, which are `<section data-psec>` blocks of one render), v-sheets, v-draw (Technical drawings via `tdBodyHTML`, plus Labels & files), v-loft and v-work. `pnGo(key)` opens a section, `showTab(tab)` switches the view, and the last place is kept in localStorage `fitted-pn`.

## Machining drawings (v0.110)

- `53-machining.js`: `mdPart(p,den)` turns a cut-list part (poly, holes, notes, edge banding, grain) into td-style entities. `mdHoleRows` builds the hole table, `mdBlock` the HTML for the guide, and `mdExportPDF` writes one A4 page per part. The 0 corner: sides have x = 0 at the front edge; other carcass parts have y = 0 at the front edge.

## Your shops and prices (v0.111)

- `51-shop-forms.js`: the panel shops' own order forms. `templates/` holds the original files; `build.py` (`shop_forms()`) packs each one as a small zip (pictures re-saved smaller, .xltx turned into .xlsx) in place of `/*@FORMS@*/null`. At export `sfFiles()` unpacks it with `DecompressionStream`, `hhForm()` / `wcForm()` write values into the existing cells (`sfSet` keeps each cell's style) and widen the drop-down ranges when there are more parts, and `zipStore` saves it. `hhMat()` maps a board to Hanssens' material code, `sfBand()` the edge band word per shop, `sfWork()` the hinge cups / shelf-pin rows / shapes. `ME` (localStorage `fitted-me`) holds the customer details, `SHOP_DRILL` the drill tick box. `exportShop()` falls back to Fitted's own list (`shopXlsx`) if a form can't be made.
- `54-assembly.js`: what goes into a box. `build()` now links every 3D board to its cut-list panel (`item.pan`, matched on outline and role), so `asHoles(s)` can put the panel's holes on the board in 3D. `asHW(c,G)` makes the hardware of one box as small solids riding along with a host board (hinges, shelf pins, connector screws, runners, rails), plus assembly lines and the numbered list; `asMarks(s,c)` gives the front edge, grain direction and inside-face triangle. Used by `tdExploded()` (with `tdRelax()` to spread the labels) and the 3D Assemble view.
- `68-my-shops.js`: `MS={shops,offers}` (localStorage `fitted-myshops`, plus `data/users/<id>/fitted/myshops` in the db). `msOffer(n)` picks the price for a sheet material, `msShip(name,subtotal)` works out delivery or pick-up, and `msHTML(nest)` draws the panel under Price. All of it is hooked into `priceRows()`.

## Check before ordering (v0.115)

- `59-order-check.js`: `orderCheck()` returns `{lv:'stop'|'look', t, d}` items; `orderCheckHTML()` draws the card in the cut list; `ocBeforeShop(shop)` holds back the shop export while there is a stop (`ui.ocPending`, button `ocAnyway`). `tests/order_check.js` makes each problem on purpose.

## Order checklist (v0.116)

- `69-buy-list.js`: `buyListHTML(lastPrice)` groups `lastPrice.rows` by shop; status in `S.done.buy` (`items['shop|name'] = {s:'ordered'|'here', at}`, `shops[shop].ref`). `S.done` is allowed through the build lock. Placed in the Shopping section via the `<!--BUYLIST-->` marker in `renderCut`.

## Make the doors the same (v0.118)

- `41-even-doors.js`: `edSets(G)` (door widths per column, the level with most doors; `follow` = doors in front of uprights), `doorGroups(G, far)`, `edPlan(G, group)` (per stretch between pinned columns: a free column makes room, 2+ door columns trade width, a lone column is fixed and sets the target), `edEvenInside()` moves uprights so following doors match, `evenDoors(far)` applies it by rebuilding up to 10 times. `tests/even_doors.js` checks two real walls.

## Uprights spaced by the doors (v0.119)

- `vdPosDoors(n, mode, span)` (`00-core-data.js`) and `doorVd(q, z)` / `doorVdLead(z)` (`10-build.js`, next to `autoVd`): a closed, hinged level without its own door count, with uprights and a `vdMode`, spaces the uprights over the door span `q.bL…q.bR`; levels of the same column with the same count and mode use the same positions.

## Design tab and sizes (v0.120)

- Header/bottom bar have one `data-a="design"` tab; the 'tab' action turns it into `ui.dmode` ('elev' or '3d', set in `showTab`). `dswHTML()` (`90-bar-views.js`) draws the Front / 3D switch in the toolbar and in `#mfloat`. Internally the views are still `elev` and `3d`.
- `32-sizes.js`: `sizeAt(x, y)` (mm) for the front view, `sz3D(e)` raycasts the 3D meshes (`userData.it`, set in `80-3d.js`, with `.pan` = linked cut-list part). `szWire()` handles mouse hover and touch-and-hold (450 ms). `ELEV_T` comes from `elevSVG`.

## Assemble step by step (v0.121)

- `72-workshop-3d.js`: `WX.step` (null = slider "Pull apart"). `wxStepsBuild(R)` gives every part and hardware piece a step from `WX_STEPS` (by role and `tdPartName`), `wxK(step)` says how far apart and whether shown, `wxStepGo(i)` animates the step in (`WX.ap` 0→1), `WX.play` runs through. Parts whose explode offset is ~0 drop in from above (`p.fly`).
- `tdOffset` (`52-techdraw.js`): side strips sideways, top strips up, plinth down; inner uprights forward.

## Cut-outs and arched fronts (v0.123)

- `mdCutInfo(poly)` / `mdCutRows(p)` (`53-machining.js`): a cut-out (`hole.poly`) as round / arch / shape with sizes; used on the drawing, the cut-out table and the shop Excel note.
- Arched front frame (`10-build.js`, open level with `z.arch`): `z.archOpen` ('' | 'tall'), `z.archTop` ('' | 'flat' | 'square'), `z.archBorder` (mm). Cells become the board's cut-outs; the frame around them is built from pieces (`pieces`) for 3D and the technical drawings.
- Porthole: `z.portD`, `z.portX`, `z.portY` (reading nook with `nookFront: 'port'`).
