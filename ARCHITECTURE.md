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

## Tests

The app has no test files in the repo. The checks used during development load the built page in a headless browser and:
- click every button;
- build random designs and every column type, fitting, niche, corner angle and room restriction, checking that no part or price is invalid;
- export every file type.

`python3 build.py --source` prints the assembled source for such checks.
