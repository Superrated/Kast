# Changelog

## v0.68

- **Fitted by BRUIS**: the name now carries BRUIS (header, page title, PDF cover and footer, installed app).
- UX audit fixes:
  - The build guide's time estimate now matches "Your plan".
  - The time and weight boxes in the guide are readable in dark mode.
  - The drawing's "Contents" toggle is now "Show items".
  - Faint hint text has better contrast.
  - One word list: "closing strip" instead of skirt; "parts" instead of panels.
  - Tabs: Drawing · 3D · Cut list · Sheets · Shaped parts · Build guide (Lofting is now "Shaped parts"; the phone says Drawing too).
  - New "Words explained" glossary, linked from every panel.
  - "Add a column" is one folding list grouped by type; the dropdown is gone.
  - Top bar: New design · PDF · Designs · ☰ (Notes, Words, Comment and Install moved into the menu, now also on desktop).
  - Design notes open from the bottom bar or the ⚠ chip only; the duplicate price card is gone from the cut list.
  - "Building in phases" is now a small link until you use it.
  - One dark look for anything selected; blue is kept for actions.
  - Every dialog closes with "Close" at the bottom left.
  - Sizes in text written like the drawings (1300 mm); no emoji in menus and buttons; no text under 11 px; bigger small buttons.
  - Smaller page headings; clearer cut-list sheet cards; Construction and Closing strips visible in Simple view.
  - Plain-language intro on Shaped parts; old duplicate colour scheme removed.

## v0.67

- **Kast is now called Fitted** — built-in wardrobes & cabinets, drawn and cut. (Saved designs, notes and settings stay; the GitHub address stays the same.)
- **Washer + dryer** (new column, wizard wish, and “Show in the niche” → Washing machine / Dryer / Washer + dryer on top): drawn in the drawing and in 3D, with a basket drawer under the washer, stacking kit, anti-vibration pads, vents, and checks for width (610 mm), depth (650 mm) and height. Tips on heat-pump dryers, socket, tap and drain.
- **Fold-down bed** (new column, wizard wish “Guest bed”, and “Show in the niche” → Fold-down bed): the bed’s underside is the front; mechanism, mattress and wall anchors in the hardware list; checks for width (90 / 140 / 160 cm mattress), height and depth.
- **Utility cupboard** (new column, wizard wish): socket for chargers, broom rail and a vacuum bracket, with vents.
- **Inside fittings, grouped**: *For clothes* (trouser rack, tie & belt rack, valet rod, pull-down rail), *Drawers and baskets* (internal drawers, jewellery drawer, wire baskets, laundry baskets, shoe rack), *Extras* (ironing board, pull-out mirror, hidden safe, space for suitcases). Each one is drawn when you look inside, and is listed and priced.
- **Per level**: mirror on the inside of the door, air vents in the door, utility cupboard.
- **Lights inside**: switch on with the door, or by a motion sensor.
- Quick-add buttons now include Wardrobe, Washer + dryer, Fold-down bed and Utility cupboard.
- Everything is in English, including the shop cut lists, the shop email, the cabinet-maker brief and the DXF read-me.
- **Ready for more languages**: translations go in `src/lang.js` (see the README). A language button appears once a second language is added.

## v0.66

- Removed the Nederlands / English switch: the app stays in English.

## v0.65

- **A friendlier wizard.** Two parts — *Your room* and *Your cabinet* — with a progress bar.
  - The wall and ceiling steps have a big drawing of your wall with a 1.75 m person for scale; drag the blue dots to set the width, height, slopes and beam.
  - "I measured in more places": width at the floor, halfway and at the top, plus the floor level. Kast uses the smallest width and widens the side strips to match.
  - New step **"How does it get up there?"**: doorway, stairs (straight, quarter or half turn) and loft hatch. It shows the longest board that gets through and whether boxes go up built.
  - Proposals say whether the boxes fit up the stairs; "🎲 Surprise me" for the look; confetti when the design is made.
- **Getting it in** (Room): every box and board is checked against the doorway, stairs and hatch. Parts that can't get in are flagged; boxes too big to carry built are listed as "build it in the room".
- **Several walls in one room** (Room → Walls in this room): add the next wall to the right for an L- or U-shaped room, with a floor plan showing how the doors open. Each corner is "runs into the corner" or "both stop". Kast keeps the widths right, warns when fronts are blocked in a corner or the side strip is too narrow, and adds up the whole room (price, and sheets when cut together).
- **DXF files for a CNC shop** (Cut list and Lofting): one drawing per part with every hole and cut-out on its own layer, plus a read-me with the part list.
- **Offcuts** (Cut list): keep the useful leftovers of a design and cut small parts from them first next time.
- **Weight and wall fixing** (Build): weight per column empty and full, who carries it, and which plugs and screws to use for your wall.
- **Time and weekend plan** (Build, and the first step of the guide): hours per stage and a Saturday/Sunday plan.
- **Ask a maker for a quote** (PDF): a Dutch brief for a cabinet maker with the room, the cabinet, materials and hardware, followed by the drawings.
- **Edge band thickness** (Build → Construction): with 1 or 2 mm ABS the saw sizes are made smaller so parts end up at the drawn size; the shop Excel keeps finished sizes.
- **3D light**: daylight, morning, evening, or evening with the lamps on.
- **Nederlands / English**: the NL button switches most of the screen to Dutch.
- "Styling" is now called "Contents".
- Fixed: the depth buttons in the wizard (600 / 500 / 400 / 320) did nothing.

## v0.64

- **Compare two designs** (Designs → "Compare two designs side by side"): pick any two — or what is open now against a saved one — and see size, columns, doors, drawers, panels, sheets, board / finishing / hardware cost, total, cabinet-maker estimate, materials and warnings next to each other, with the difference and the cheaper one in green. A list shows which settings differ.
- **Comments.** A "Comment" button (and 💬 on each column card) opens claude.ai's own comment box pinned to the drawing or that column, so you can leave notes for each other on the design.
- The exploded 3D view per box is reachable from each box step in the build guide ("Show in 3D").

## v0.63

- **Workshop mode** (Build guide and Cut list): a full-screen view for your phone that shows one cut or one build step at a time in big letters, with Done ✓ and Back.
  - Cuts follow the chosen cut order, and it says when to change the saw setting.
  - Ticks are saved in the design, so you can stop and pick up where you were.
- **Every drilling hole on the sides.** Box sides, partitions and end panels now carry:
  - the Ø5 connector-screw holes, centred on every top, bottom and fixed divider;
  - the shelf-pin holes (Ø5 × 12) under each adjustable shelf, 37 mm from the front and back edges;
  - the hinge mounting-plate holes (Ø5 × 12, 37 mm from the front edge, 32 mm apart) at the same heights as each door's hinge cups.
  - They show in Lofting with a hole table and in the cut-list note.
- **Drag column edges in the front view.** Select a column and drag its left or right edge to make it wider or narrower; the neighbour gives or takes the difference. Level heights could already be dragged.
- **New collision checks:**
  - a door hinged right next to the room wall (it can't open fully);
  - a door hinged next to a level that sticks out further (it hits it before it is fully open).
  - Doors under the sloped ceiling and sockets behind dividers or drawers were already checked.

## v0.62

- **Have it cut at Hanssens Hout or Woodcenter.** The Cut list tab has an "Excel for Hanssens Hout" and an "Excel for Woodcenter" button. Each makes a Dutch cut list (zaaglijst):
  - per part: number, quantity, length, width, thickness, board, colour, grain, and which edges get edge band (L1 L2 B1 B2);
  - a sheet with the boards needed and a sheet with the shop's contact details;
  - after saving, the app shows the shop's e-mail address and a ready-made message to copy.
- **Part labels (PDF):** one sticker per piece, 24 per A4 page (70 × 37 mm labels). Each shows the part number, what it is and where it goes, its size, board and colour, a little drawing of its edge-banded sides, and which sheet and strip it comes from.
- **Full-size templates (PDF):** for every shaped part, the A4 pages its sloped edges run through, printed at 1:1. Rulers along each page show the position on the panel, and the first page has a 100 mm square to check the printer scale.

## v0.61

- **Cut order: "Same width together".** New "Cut order" step in the Build guide, with two choices:
  - **Sheet by sheet** (as before): each sheet is cut completely before the next one.
  - **Same width together:** every cut with the same measurement is made one after the other, across all sheets and boards. First all rips (widest first), then all cross-cuts (longest first), then the trims. You set the track-saw jig, fence or stop far fewer times; the guide says how many (in the example design 102 instead of about 158).
  - The numbers on the sheet drawings follow the chosen order. A new list, "Cut list by saw setting", shows for each setting which sheet and strip, or which part, to cut.

## v0.60

Fixes from an audit of errors, the cut and material lists, and the technical drawings.

- **Hinge cups are drawn and measured now.** Every door's Lofting drawing shows its Ø35 × 13 mm hinge cups, dimensioned like the other holes. The cut-list note gives the exact heights, and that the mounting plates go 37 mm from the front edge at the same heights. Short doors get their cups closer to the edges.
- **Backs under a sloped ceiling** had a small 9 mm step in the top corner. The top edge is now one straight line.
- **Lofting:** dimension numbers that were close together no longer print on top of each other. The hole table says "through" or "× 13 deep". Each drawing names the board ("Melamine chipboard · Pure white · 18 mm"), not only the colour.
- **Copy as CSV / text:** now includes the board type (melamine, MDF…) next to the colour, so a panel shop knows what to cut from.
- Checked with no other errors found: 40–60 random designs through every tab and the PDF export (no errors, no "NaN"); the cut list against the 3D model (no parts missing or overlapping); hinges, runners, drawer-box parts and sheet layouts all add up.

## v0.59

- **Levels can stick out or sit further back.** Every level with doors, drawers or open shelves has a new setting, "Depth of this level": 100 or 50 mm back, flush, or 50, 100 or 150 mm out, or any exact number.
  - **Sticking out:** the level gets a sleeve in carcass board (two sides, a top and a bottom) in front of the carcass. Its shelves and drawers become that much deeper, so drawers may get longer runners. The sleeve boards are on the cut list.
  - **Further back:** the doors fit inside the sides (inset hinges), and the shelves and drawers become that much shallower.
- The front view marks these levels with a small "▲ 100 out" or "▼ 80 back" tag. The 3D view shows the real depth.
- A level under the sloped ceiling can step back, but not stick out.

## v0.58

- **All prices are in one file now: `src/prices.js`.** Boards per shop, furniture panels, edge band, paint, microcement, every hardware item and the cabinet-maker estimate. `build.py` copies it into the app.
- **Board prices from Hanssens Hout and Woodcenter.** The price table can show "Cheapest per board", only Hanssens Hout or only Woodcenter.
- **Hardware looked up for real** (16 Nov 2026, incl. VAT): Blum hinges, plates, MOVENTO and TIP-ON at Pierard; TANDEM runners at keukenlade.nl (€ 35.80 a pair) and couplings at hwt-pro.com; Confirmat screws and plinth feet at Hornbach; shelf supports and cabinet hangers at Gamma; edge band at Hubo (€ 1.20 per m).
- **Update prices button** (in the price section, when the app is opened in Claude): starts a task that looks every price up again at those shops, saves them in `src/prices.js`, pushes to GitHub and updates the app. Takes about 15–30 minutes.

## v0.57

- **Even out door widths:** when doors in different columns are almost the same width (within about 5 %), Layout → Columns shows them with a "Make them the same" button. It nudges the column widths (the total stays the same) until those doors are exactly equal.
- **Find a depth that wastes less** (Sheets tab, and Sheet saver under the price): tries every cabinet depth from 100 mm shallower to 20 mm deeper, and shows for each sheet count the deepest depth that reaches it, with how much of the sheets is used, the board cost, and warnings (less than 560 mm for clothes, shorter drawer runners). One tap uses that depth.
- Microcement is now priced at € 45 per m² (visible sides only).

## v0.56

Fixes from an audit of the cut list, lofting, sheets, build guide and measurements.

- Measurements: under the front view there is now a second chain of widths, the boxes (or side centres), that adds up exactly to the wall, next to the inside widths.
- Cut list: each material is now one block (18 mm melamine was split in two). Materials are listed in build order: carcass board first, fronts and skirts last.
- Cut list: picture ledges now include their 30 × 12 mm lip strip (it was in 3D but not on the list).
- Cut list: drawer box parts say "top edge" instead of "front edge"; painted and microcement parts say "Paint" or "Microcement on" instead of "Edge band"; groove widths are written the same everywhere (8.5, not 9).
- Lofting: storage box fronts are drawn with their hand slot or finger holes; cut-outs that are not for fabric are no longer labelled "fabric cut-out".
- Sheets and build guide always use the same saw-blade and trim values, also when the field is left empty (4 mm and 10 mm).
- Build guide: bigger numbered cutting diagrams, and a note on which sheets to cut first — carcass first, doors and drawer fronts last, after measuring the openings.

## v0.55

- Microcement now uses the same RAL colours as painted MDF: pick any RAL colour and order the microcement tinted to it. The eight separate microcement colours are gone; designs that used them get the nearest RAL colour.
- Microcement is priced per m² on the visible sides only (front face + visible edges): € 28 per m² from the Silk Plaster complete kit (€ 688 for 25 m²). Fabric-wrapped frames and speaker baffles are left out. The backs are no longer priced.

## v0.54

- New board finish: **Microcement on MDF** (Look → Materials → Board). Eight colours: chalk, sand, greige, stone, terracotta, sage, graphite and anthracite, with a soft cloudy trowelled look in the drawing and 3D.
- Doors and drawer fronts in microcement are cut 1 mm smaller all round, so the coating on the edges keeps the 3 mm gaps.
- The price adds a microcement kit (primer, base coats, finish coats, sealer) for the face and edges, and primer for the backs. The build guide gets a "Microcement the panels" step.
- Fix: painted MDF edges were also charged as edge band in the price, and listed in the edge-banding step. They no longer are.

## v0.53

- The dot pattern handle is removed. Designs that used it get a finger hole instead.

## v0.52

- The dot pattern is now a real handle: a small group of drilled holes where a handle would be, not a pattern over the whole door. Choose Line of 4, Dots + finger hole (small dots ending in one bigger hole a finger fits in), Square, Diamond, Triangle or Arc. Dot sizes Small 32, Medium 38 and Large 45 mm (32 mm is the smallest, so a finger fits). Designs with the old whole-door patterns switch to Line of 4.

## v0.51

- Storage boxes on open shelves: new setting "Grip on the boxes" with Hand slot (as before), One finger hole or Two finger holes. It shows in the drawing and the 3D view, and on the cut list as a note on the box front.

## v0.50

Dots are now a handle, and every door can have its own handle.

- "Dot pattern" is a handle type now (Look → Doors & handles), not a front style. Patterns: Grid, Rows, Dashes, Diagonal, Column (a line of dots along the opening edge) and Scattered. Dot size Small 16 / Medium 25 / Large 35 mm. The pattern runs on from one door to the next across the whole wall; "Shuffle the dots" gives a new arrangement.
- Per level: "Handles in this level" picks a different handle for one level (or none, push to open).
- Per door: open "Handle per door/drawer" to give a single door or drawer its own handle.
- Older designs with dotted fronts keep their dots.

## v0.49

Peg wall, after the new reference photos.

- Holes: "Round, for pegs" (as before) or "Slots, for hook tabs" — 12 × 40 mm slots on the same 120 mm grid; every shelf, ledge and box then hangs on two hardwood tabs.
- New accessories: book ledges (books shown with their covers to the front behind a rail), a drawing-paper roll on two brackets, and a hanging rail with S-hooks for bags and paint tubes. Set how many of each; "Rearrange" moves them around.
- Their parts are on the cut list, the paper roll, dowels and tabs on the shopping list.

## v0.48

Five ideas from the inspiration photos.

- Dotted fronts: new front style "Dots" for cupboards and drawers. Ø25 holes drilled through in a grid, in rows that line up from one door to the next, or scattered. Two of the dots sit where a handle would be and are the handle (or tick "Add a normal handle as well"). A strip next to the hinges stays free. The holes are on the cut list and lofting.
- Round reading pod: new reading-nook front "Round pod". A tube of bent plywood runs from the round opening to the back, with a thick rim in front, a ribbed cushion inside and book ledges on the back. Its own colour; rim, back disc, ledges, plywood and cushion are on the lists.
- Contrast cubbies: on open shelves, "Contrast cubbies" — Checkerboard, Steps or Random. Open cells get a frame and inside in the cubby colour, the others a flat cover in the door colour.
- New handles: Coloured stick, Coloured cross and Coloured ring, in seven colours.
- New handle: Wooden disc (60–120 mm), with "One disc across the seam of a door pair" — half a disc on each door.
- Fix: the reading nook front no longer reports a wide front as too big for its board.

## v0.47

- Reading nook front: new "Opening size" — Full width, Large, Medium or Small. A smaller opening leaves more closed front around it; the arch, low arch, porthole and house shapes all scale with it. With a smaller opening you also pick its position: left, middle or right. The curtain follows the opening.
- A design note appears when the opening gets narrower than about 500 mm, too tight for a child to climb in.

## v0.46

- 3D: storage boxes are now drawn as real open boxes — a front with a rounded hand slot you can see through, a back, two sides and a bottom, all 12 mm thick — instead of solid blocks.

## v0.45

- Storage boxes on open shelves now reach up to 20 mm under the shelf above (they used to stop at most 320 mm high, often well below it). Boxes stay at most 600 mm high in very tall compartments.

## v0.44

- Notes: a "Notes" button in the top bar (and "📝 Notes" in the ☰ menu on a phone). Write text notes, or add photos — "Take a photo" opens the camera on a phone, "Choose a photo" picks one or more from the device, and pasting a picture works too.
- "Make hand-drawn notes easier to read" (on by default) turns a photo of a sketch into clean black and white with more contrast, which also keeps the file small.
- Notes belong to the design: they are saved, opened and undone with it. Photos are stored in the app's shared storage (or on the device outside claude.ai); the design keeps a small preview. Tap a photo to see it large, give it a caption, or delete it (tap twice).
- The Notes window warns when the notes are not saved yet, with a button to save.

## v0.43

- Reading nook: the curtain now follows the opening of the front panel. With an arch, porthole or house front it hangs just behind that opening, at its sides and up to its top; before, it hung across the whole niche and showed up in the wrong places (inside the round window of the house front, cut off behind the arch).
- A niche you make yourself — by switching a level to "Niche / TV" or adding one on top — now starts as a reading nook. Niches that already exist, TV niches from the shuffle and the "TV niche" ready-made column stay as they are.

## v0.42

- Simple view no longer hides a section that is in use: the Book ladder, the Projector screen and "Floor, walls & things on the wall" stay visible while they are switched on, so you can switch them off again.

## v0.41

- AI render: the instruction now tells the picture AI to make the decoration photorealistic as well — books, vases, plants, frames, cushions, baskets, boxes and toys — each kept in its place, size and colour, with no flat or cartoon-like objects left.

## v0.40

- AI render: a new button in the 3D view (and in the ☰ menu on a phone). Kast makes the picture — the 3D cabinet on your room photo when there is one, otherwise the plain 3D view — and writes the instruction for a picture AI from your design: materials, colours, handles and what is in every column. You save the picture, copy the instruction, and give both to a picture AI you already use.
- "Small changes" box: what you type is added to the instruction, and "Copy only the change" gives a short follow-up message for the same AI chat.
- With several room photos you pick which one to hand over.

## v0.39

- New "Never include" list in the shuffle options, next to "Always include": drawers, open shelves, glass doors, TV niche, speakers, desk, window seat, hanging rail. No shuffle puts these in. An item can be on only one of the two lists.
- A desk top wider than 1200 mm always gets a 30 mm top in shuffles and wizard proposals, in every price level, so it does not flex.

## v0.38

- "Split into two units" now also works by hand for columns that share one opening (a TV niche or desk across several columns). Tap it on any column of the group: the whole group gets the joint, above the opening.

## v0.37

Five extras for the reading nook (Niche → Show in the niche → Reading nook).

- Front of the nook: a front board with an arched, low-arched, round porthole or house-shaped opening, in its own colour or the drench colour. A wide house front also gets a small round window. On the cut list as one board with the opening drawn in.
- Curtain: a rail under the top of the nook and two curtain panels in a fabric you pick.
- Book ledges and cubby: up to three lipped ledges on the side wall for books with their covers showing, and a small open box on the back wall.
- Padded back and sides in the mattress fabric.
- Step box in front, sized to half the height of the nook floor, for nooks that sit higher up.
- 3D: boards can now have real openings, so the nook front shows its cut-out.

## v0.36

Easier to use: less on screen, changes on the drawing, notes that fix themselves.

- Simple and Expert view, switched at the top of the side panel. Simple is the default: each part shows only its size, split, shelves, doors or drawers, front style and colour; everything else is one tap away under "More options". The Room and Build tabs show only their main sections. Expert shows every setting, as before. Nothing was removed.
- Toolbar on the drawing: tap a part and a small bar appears next to it with the everyday changes — cupboard / shelves / drawers / niche, split 1–4, shelves or drawers − / +, remove, and "More" to jump to all its settings. On a phone the bar sits along the bottom of the drawing.
- Design notes with "Fix it": notes Kast can solve get a button that applies the advice in the note, and "Fix what Kast can" does them all in one go. A fix is only kept when the note is really gone and no new note appears; Undo brings everything back.

## v0.35

- Columns that share one wide opening (a TV niche or desk across several columns) are now built as two stacked units when they are taller than one board, like the other tall columns. The joint sits above the opening, at the same height in every column of the group. This was the last case where a side could come out bigger than its board.

## v0.34

- "Install app" button: in the top bar on a computer and in the ☰ menu on a phone. It appears only where the browser can really install Kast (the GitHub site, in Chrome, Edge or Android), and disappears once Kast is installed. On iPhone and iPad it explains the Share → "Add to Home Screen" steps.
- Messages at the bottom of the screen now stay long enough to read; longer messages stay longer.

## v0.33

- Open shelves: "Storage boxes on the shelves". Open wooden boxes with a hand slot, made to fit each compartment, on the bottom row, every other row or every row. "Box colour" follows the inside colour (so they join a colour-drench) or takes any colour you pick.
- The box parts are on the cut list, and the styling objects make room for the boxes in the drawing.
- Not available together with a fixed slatted screen, because the boxes could not come out.

## v0.32

- Niche: new choice "Reading nook" under "Show in the niche", next to TV, Art frame and DJ setup. A foam mattress on the niche floor in a fabric you pick, cushions against the back and a warm reading light above. The mattress, cushions and light are on the shopping list.
- Design notes for the nook: too low to sit upright (under 800 mm inside), too high to climb into (over 550 mm from the floor), too shallow or too narrow, and when the board under it needs an upright because it carries a sitting child.
- A reading nook has no cable hole and no TV.

## v0.31

- Niches and open shelves: "Line the inside…" is now called "Own box, flush with the doors". The niche gets its own box whose front edge stands one door thickness (about 18 mm) proud of the cabinet body, in line with the door fronts above and below.
- New "Stands proud by" field on that box: leave it empty to line up with the doors, or type a little more or less.
- Niches (TV, art, DJ) can now be colour-drenched: with an inside colour set, "Colour-drench" puts back, sides, top and bottom in that colour. A drenched niche gets its own box automatically.
- Cut list: "Opening box" parts are now called "Niche box".

## v0.30

Slatted screens.

- Cupboards: new front style "Slats". The doors are made of slats on cross rails with open gaps, so air and light pass through. The two edge pieces of every door are wider, for the hinge cups and the handle.
- Open shelves: "Slatted screen" puts fixed slats in front of the level; it half hides the shelves. It has its own slat colour.
- Both have "Slats run: up and down / left to right" and three sizes: fine (20 mm slats, 10 mm gaps), medium (30 / 15) and wide (45 / 20). Gaps are evened out so the slats end flush at both edges. Under a sloping ceiling the slats always run up and down and are cut to the slope.
- Every slat, stile and rail is on the cut list, with the gap to use as a spacer block. Design notes warn about horizontal slats spanning more than 900 mm and long vertical slats with nothing behind them.

## v0.29

- Panel wall: it now has a toe kick like the cabinets. The panel stops above the plinth and the set-back plinth board runs on underneath it, in one line with the rest. The side next to the panel no longer runs down to the floor. Switch it off under the panel wall's settings ("Toe kick at the bottom") if you want the panel down to the floor again.
- Faux-door panel walls get the same plinth; before, there was an open gap under them.

## v0.28

- 3D view: making a piece see-through also hides the styling objects that stand on it, hang on it or lean against it (books and vases on a shelf, pegs and boxes on a peg wall). They come back when the piece is made solid again.

## v0.27

- Arched tops: the shelves in an arched level now run right up to the front, so the front frame sits on them without a gap.
- 3D, colour-drench: the thin colour layer on the inside walls was thinner than the shadow tolerance and came out speckled and dark. It is thicker now, and left out where the panel behind it is already in the drench colour.

## v0.26

- Narrower compartments: "Split side by side" now goes up to 6, and compartments can be as narrow as 100 mm (was 200 mm). The uprights stepper goes up to 7 uprights, and an upright can be moved to within 100 mm of the next one.
- Shelves are now made for compartments from 70 mm wide.
- A cupboard whose doors would follow compartments narrower than 150 mm gets one design note: too narrow for hinges and a handle.

## v0.25

Two new units, and colour-drench on the outside.

- Panel wall, "Peg wall" (replaces the old small-hole pegboard): a plywood board full of Ø20 holes on a 120 mm grid, with wooden pegs, loose shelves, small boxes, a drawer box and hooks. You set how many of each and tap "Rearrange"; pegs go on the shopping list, shelves and boxes on the cut list, the holes on the lofting drawing.
- Open shelves, "Arched tops": one front board with a rounded opening over every compartment. Works with "Split side by side" and the shelf count, has its own frame colour, and is on the cut list as one board with the arches drawn in.
- New ready-made column "Arched bookcase": 3 wide, 4 high, colour-drenched.
- Colour-drench: when every level of a column is drenched in one colour, the column's own box takes that colour on the outside too — top, bottom, fixed boards and each side it does not share with a column in another colour. The extra paint is on the shopping list.

## v0.24

Saving designs can no longer lose work.

- The Designs window now says in plain words which design is open and whether it has unsaved changes. With a design open the buttons are "Save changes" and "Save as a new design"; with a new design there is only "Save as a new design".
- A design made with the wizard, the example or pasted text is always a new design. Before, "Save" could silently replace the design that was open earlier.
- "Save changes" keeps the version from before under "Earlier versions" on that design's card (the last 8).
- Opening another design, starting the wizard or loading the example while there is unsaved work first puts a copy under "Recovered work and deleted designs".
- Deleting a design moves it to "Recovered work and deleted designs" instead of removing it for good. Copies stay about three months.
- The Designs button shows the name of the open design and a dot when there are unsaved changes.

## v0.23

- 3D view: tap (or click) any door, drawer front, panel or shelf to make just that piece see-through. Tap it again to make it solid. "Solid again" in the toolbar resets all of them. Dragging still turns the view; only a short tap selects.

## v0.22

- Doors: "Join with the cupboard above" on a cupboard level makes one tall door that runs over this level and the one above it, in one piece and one colour. Switch it on in the next level too to run the door over three levels. Shelves and inside stay separate per level; the fixed board between the levels sits behind the door.
- Joined doors get the right number of hinges for their height, and a design note when they are taller than about 2.3 m.

## v0.21

Staggered shelves and a more flexible wardrobe.

- Split levels: every compartment has its own card with its number of shelves, its own spacing (even, tall bottom, tall top, tall middle) and a "Staggered" switch that puts its shelves half a step lower than next door. "Stagger every other compartment" does it in one tap.
- Hanging rail in a split cupboard: choose which compartment gets the rail ("Hanging rail here"), or give several compartments one. Before, it was always the widest.
- Hanging rail: "Shelves above the rail" and "Shelves below the clothes" are now two separate counts.
- Hanging rail: "Two rails, one above the other" for double hanging; needs about 1.75 m of height.
- The shopping list now counts each rail at the width of its compartment.

## v0.20

Plainer words in the editor.

- "Zone" is now "level" everywhere: a column is a stack of levels. "Opening" is now "niche", and "Doors + shelves" is "Cupboard with doors".
- The setting on open shelves that was also called "Niche" is now "Use these shelves as" (plain shelves, bar, coffee corner).
- Plain names for the technical settings: "Carcass" → "Sides, tops & bottoms", "Skirts" → "Closing strips", "Clear width" → "Inside width", "Scribe allowance" → "Extra to trim against the wall", "Saw kerf" → "Saw blade thickness", "Carcass fasteners" → "How the boards are joined", "Grommet" → "Cable hole", and more.
- "Dividers" in the editor are called "uprights", matching "Split side by side".

## v0.19

Simpler budget and simpler side-by-side splitting.

- Budget: one card at the top of the price list replaces the Budget chip, "Budget build" and "Budget joints". Drag the slider to the amount you want to spend; below it is a list of savings, each with what it saves on this design, that you switch on or off. When the design is over budget, the least noticeable savings are marked "suggested" and one button switches them on. The Budget chip now shows how far over or under you are.
- Layout: every part of a column has "Split side by side · 1 2 3 4" right under its height. Doors, open shelves and drawers all split this way, so a wide niche with three cupboards above it is one wide column.
- Layout: "Shift" moves the uprights of a part half a step, so they sit between the uprights above or below, like bricks.
- "Vertical dividers" is now called "Uprights" and stays below for moving them one by one.

## v0.18

Audit of the wizard, saved designs and photos.

- Shuffler and wizard: with "Free" box widths, an automatic TV-and-speakers group could overwrite "Always include" items (a window seat or dog den silently became a speaker column). It now only uses columns that are still free.
- Projector screen: the screen drawer is one piece, so it is no longer planned wider than a board.
- Window seats wider than 800 mm get enough drawers side by side to support the seat board.

## v0.17

Audit of the build guide and the PDF.

- PDF cut list: notes were cut off after three lines, and long part names, materials and column lists after one. Everything is now printed in full.
- PDF hardware and price lists: long item names wrap instead of being cut off; a hardware list that runs onto a new page no longer starts with an empty cut list header.
- Price list: the centre support for a wardrobe rail and the paint for colour-drenched zones now have a typical price.
- Faux drawer fronts have their grain running sideways, like real drawer fronts; a faux door for shaft access counts 4 push latches in the hardware list.

## v0.16

- New panel wall option "Faux doors": the shaft cover is cut as fixed door and drawer fronts that copy the cabinet next to it (same lines, colours, gaps and handles), with a plinth strip below, so the wall reads as one run of cabinets. With the access option on, one faux door hangs on push latches and comes off to reach the shaft.

## v0.15

- Top skirt pieces under a steep slope are cut shorter so each fits the width of its board; a tall narrow filler piece gets its grain upright.
- Stacked units leave a little more margin, so the upper sides under a slope no longer come out a few millimetres longer than the board.

## v0.14

- Desk columns taller than one board are built as two stacked units, like the other tall columns. The joint is never at the board right above the knee space. The "Split into two units" button now also shows for desk columns.

## v0.13

- A back panel that would be bigger than the board it is cut from is now made per zone, with the joints hidden behind the fixed dividers.

## v0.12

- Shuffling no longer leaves empty wall on the right. It happened with a pinned panel wall or door plus "Always include" items: the stretch of wall after the pinned part kept its old, too-short width. Leftover wall now goes back to the cabinets next to it, and a stretch that holds only fixed items shares the leftover between them.

## v0.11

Shuffler
- Lines that almost line up between columns (3–40 mm apart) are forced onto one line.
- Doors under a slope hinge on their tall side; a door across a ridge gets an upright at the ridge so each half can open.
- More varied and playful shuffles: less weight on symmetry, more on variety and open parts; playful styles come up more often.
- Open shelves and niches have a minimum usable size: 280 mm high, 220 mm clear between shelves, compartments at least 250 mm wide.

Structural review
- Header over a TV niche wider than 900 mm with open shelves or glass doors above: 3 layers (54 mm) instead of 2, because it has no front rail to stiffen it.
- A doorway wider than 800 mm gets a double head with rails, like a TV niche, because a cabinet stands on it.
- Wardrobe rails longer than 1 m get a centre support in the hardware list.
- Upright dividers that stand on a board get a note to screw the back panel to them (the back carries them); a design note warns when the column has no back.
- A design note warns when an opening wider than 1600 mm has cabinets standing on it.

## v0.10

- Items under "Always include" now follow Left / Middle / Right: picking a side moves the item straight away, and a Contents shuffle no longer leaves it on the wrong side.

## v0.09

Audit of the shuffler (360 shuffled designs in five room shapes, checked by script).

- The TV column now shuffles too: what sits under the niche (drawers, doors, open shelf), the box lining, and what sits above it (doors, glass, open shelves, an open strip). The niche and TV size stay.
- Shuffles and styles use colour-drench: one choice per design, so open shelves, niches and the TV niche share one accent colour.
- Every shuffle is tidied for buildability: no door taller than 2300 mm (it gets a second door above, with the dividing line at the same height in every column), no empty space behind doors (shelves are added), drawer fronts between 140 and 400 mm high, no sliver zone under the ceiling, and columns taller than one board get a divider so they can be built as two stacked units.

## v0.08

- Box lining now works on open shelves at the top of a column (for example above a TV niche), under a flat or a sloped top. Before, it was silently left out with only a design note.
- The lining of open shelves keeps its own "Lining colour"; with colour-drench on it takes the inside colour.
- Colour-drench also colours the underside of the cabinet top.
- Vertical divider presets (Even, ⅓ · ⅔, Golden, Wide middle) now give exact compartment widths, stay in proportion when the column width changes, and show which one is active. Tap ⅓ · ⅔ or Golden again to swap sides.
- Shelves that would sag under a moderate load (clothes and boxes) get a vertical divider automatically. It can be switched off per zone.

## v0.07

- The reinforced double header above a TV niche takes the colour-drench colour of the open shelves above it (drawing, 3D and cut list).

## v0.06

- Shelf spacing now works on open shelves split into compartments (for example above a TV niche): every compartment uses the same shelf heights, so the rows line up, and the spacing choice applies to the whole unit. Compartments that are lower under the slope just leave out the shelves that don't fit.
- Columns that share one opening (a TV niche running over several columns) also share the shelf heights above it.
- Above a TV niche with open shelves, the spacing is measured from the header itself, not from the top of the rear rail hidden behind the books.
- A compartment where you set its own number of shelves keeps its own spacing.

## v0.05

- Open shelves (or glass doors) above a TV niche: no more front header rail standing in front of the lowest shelf. Only the rear rail stays, in the inside colour of the shelves above.
- Colour-drench for open shelves: with an inside colour picked, tick "Colour-drench" to give the sides, top, bottom and dividers the same colour. Dividers are listed in that colour in the cut list; the paint for the sides, top and bottom is in the hardware list.

## v0.04

- TV niche: the inside (back) colour now shows in the front drawing; before, it always showed the plain back colour.
- TV niche with a box lining: the lining keeps its own "Lining colour" instead of taking the inside colour.

## v0.03

- Clothes rails sit at a comfortable height for the person set in Room → people (just under their own height; 1.75 m if none is set), instead of a fixed 1750 mm above the bottom of the zone.
- A design note warns when a rail is above easy reach, and the shuffler avoids layouts with rails out of reach.
- Shelf spacing per zone: Even, Tall bottom, Tall top or Tall middle. Works in compartments too.

## v0.02

- The shuffle options in the Layout panel fold away (only the four shuffle buttons stay), so they no longer cover the column editing. The app remembers whether they are open.
- The version number shows on a short loading screen when the app opens, also on phones where the header hides it.

## v0.01

First version in this repository.

- Cabinet designer for flat and sloped walls: columns, zones, doors, drawers, desks, TV niches, window seats, panel walls.
- Shuffle and wizard with styles, width rules and a budget build.
- Site conditions: floor out of level, walls out of plumb, skirting boards, sockets, switches, radiators, pipes.
- Inside fittings: trouser and shoe racks, baskets, internal drawers, pull-down rail.
- Cut list, sheet plans, lofting drawings, hardware list, Belgian price estimate, build guide, PDF export.
- Room photos: up to three photos, automatic line-up, light matching, and the result in the PDF.
- More realistic 3D: shadow lines round doors and drawers, a soft floor shadow, wood relief and lacquer gloss, things in the photo that stand in front of the cabinet, and a camera look (grain, softness, glow, dark corners).
- Installable as an app and usable offline after the first visit.
