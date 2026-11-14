# Changelog

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
