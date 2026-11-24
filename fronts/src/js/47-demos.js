/* ==== 47-demos.js ====
   Ready-made demo designs: a set of cabinets with a finished look, side panels, edge and handles.
   Open one to see what the configurator can do, then change anything.
   A cabinet here: [kind, width, height, front layout]. Looks by role work like the Surprise recipes
   (drawer, wall, tall, top, low, door). */
const DEMOS = [
  // ---- the 2027 edit ----
  {
    name: 'Celery & walnut',
    trend: true,
    say: 'Fluted celery green, walnut wall cabinets, mixed metals, on feet',
    sys: 'metod',
    cabs: [
      ['high', 60, 200, 'split'],
      ['base', 60, 80, 'drawers3'],
      ['base', 80, 80, 'doors2'],
      ['base', 60, 80, 'drawer_door'],
      ['wall', 80, 80, 'doors2'],
      ['wall', 60, 80, 'door']
    ],
    all: { mat: 'painted', col: 'celery', style: 'fluted' },
    by: { wall: { mat: 'walnut', style: 'flat' }, drawer: { style: 'flat' } },
    handle: 'bar',
    hfin: 'mixed',
    sides: 'both',
    edge: 'round',
    plinth: 'feet'
  },
  {
    name: 'Olive wardrobe',
    trend: true,
    say: 'Fluted olive green, polished nickel bars, panels on both sides',
    sys: 'pax',
    cabs: [
      ['frame', 100, 236, 'doors'],
      ['frame', 50, 236, 'doors'],
      ['frame', 100, 236, 'doors']
    ],
    all: { mat: 'painted', col: 'olive', style: 'fluted' },
    by: {},
    handle: 'bar',
    hfin: 'nickel',
    sides: 'both',
    edge: 'round'
  },
  {
    name: 'Two woods',
    trend: true,
    say: 'Chocolate-oiled oak below, pale oak above, brass bars, on feet',
    sys: 'metod',
    cabs: [
      ['base', 80, 80, 'doors2'],
      ['base', 60, 80, 'drawers3'],
      ['base', 60, 80, 'door'],
      ['base', 60, 80, 'drawers2'],
      ['wall', 80, 80, 'doors2'],
      ['wall', 60, 80, 'door'],
      ['wall', 60, 80, 'door']
    ],
    all: { mat: 'oak', style: 'flat', oil: 'chocolate' },
    by: { wall: { oil: 'pure' } },
    handle: 'bar',
    hfin: 'brass',
    sides: 'both',
    edge: 'round',
    plinth: 'feet'
  },
  {
    name: 'Sage kitchen',
    say: 'Fluted sage green with calm flat drawers and brass knobs',
    sys: 'metod',
    cabs: [
      ['high', 60, 200, 'split'],
      ['base', 60, 80, 'drawers3'],
      ['base', 40, 80, 'door'],
      ['base', 80, 80, 'doors2'],
      ['base', 60, 80, 'drawer_door'],
      ['wall', 40, 80, 'door'],
      ['wall', 80, 80, 'doors2'],
      ['wall', 60, 80, 'door']
    ],
    all: { mat: 'painted', col: 'sage', style: 'fluted' },
    by: { drawer: { style: 'flat' } },
    handle: 'knob',
    hfin: 'brass',
    sides: 'both',
    edge: 'round'
  },
  {
    name: 'Charcoal oak kitchen',
    say: 'Oak oiled in Charcoal, mustard grooved drawers, brass bars',
    sys: 'metod',
    cabs: [
      ['base', 80, 80, 'doors2'],
      ['base', 60, 80, 'drawers3'],
      ['base', 60, 80, 'door'],
      ['base', 60, 80, 'drawers2'],
      ['base', 80, 80, 'doors2'],
      ['wall', 80, 60, 'doors2'],
      ['wall', 60, 60, 'door'],
      ['wall', 60, 60, 'door'],
      ['wall', 80, 60, 'doors2']
    ],
    all: { mat: 'oak', style: 'flat', oil: 'charcoal' },
    by: { drawer: { mat: 'painted', col: 'mustard', style: 'grooves' } },
    handle: 'bar',
    hfin: 'brass',
    sides: 'both',
    edge: 'round'
  },
  {
    name: 'Midnight wardrobe',
    say: 'Deep blue flutes, push to open, panels on both sides',
    sys: 'pax',
    cabs: [
      ['frame', 100, 236, 'doors'],
      ['frame', 50, 236, 'doors'],
      ['frame', 100, 236, 'doors']
    ],
    all: { mat: 'painted', col: 'midnight', style: 'fluted' },
    by: {},
    handle: 'push',
    sides: 'both',
    edge: 'round'
  },
  {
    name: 'Birch under the eaves',
    say: 'Low PAX in birch ply, White 5% oil, cut-out grips, chamfered edges',
    sys: 'pax',
    cabs: [
      ['frame', 100, 201, 'doors'],
      ['frame', 75, 201, 'doors'],
      ['frame', 100, 201, 'doors']
    ],
    all: { mat: 'birch', style: 'flat', oil: 'white5' },
    by: {},
    handle: 'grip',
    sides: 'right',
    edge: 'chamfer'
  },
  {
    name: 'Walnut media wall',
    say: 'Walnut with fluted glass up top in oak frames',
    sys: 'besta',
    cabs: [
      ['frame', 60, 192, 'door'],
      ['frame', 120, 38, 'drawers'],
      ['frame', 60, 192, 'door']
    ],
    all: { mat: 'walnut', style: 'flat' },
    by: { top: { mat: 'glass', style: 'fluted' } },
    gframe: 'oak',
    handle: 'bar',
    hfin: 'brass',
    sides: 'none',
    edge: 'round'
  },
  {
    name: 'Terracotta sideboard',
    say: 'Grooved terracotta, black knobs, panels at both ends',
    sys: 'besta',
    cabs: [
      ['frame', 120, 64, 'drawers'],
      ['frame', 120, 64, 'door']
    ],
    all: { mat: 'painted', col: 'terracotta', style: 'grooves' },
    by: {},
    handle: 'knob',
    hfin: 'black',
    sides: 'both',
    edge: 'round'
  }
];
/* the state a demo sets, worked out once (its cabinets, looks per front, sides, edge, handles) */
const DEMO_ST = [];
function demoState(i) {
  if (DEMO_ST[i]) return DEMO_ST[i];
  const d = DEMOS[i],
    keep = S;
  S = Object.assign({}, keep, { sys: d.sys, flip: {}, fx: {}, sel: null });
  S.cabs = d.cabs.map(([kind, w, h, lay]) => {
    const c = cab(d.sys, kind, w, h, lay);
    fixLayout(c);
    return c;
  });
  applyPlan(d);
  const st = {
    sys: S.sys,
    cabs: S.cabs,
    fx: S.fx,
    style: S.style,
    mat: S.mat,
    col: S.col,
    oil: S.oil,
    handle: S.handle,
    hfin: S.hfin,
    gframe: S.gframe,
    sides: d.sides || 'none',
    edge: d.edge || 'round',
    plinth: d.plinth || 'ikea',
    fillers: 0
  };
  S = keep;
  return (DEMO_ST[i] = st);
}
function loadDemo(i) {
  const d = DEMOS[i];
  if (!d) return;
  S.undo = JSON.stringify({ sys: S.sys, cabs: S.cabs, fx: S.fx, flip: S.flip });
  Object.assign(S, JSON.parse(JSON.stringify(demoState(i))));
  S.flip = {};
  S.recipe = null;
  S.demo = d.name;
  S.sel = null;
  S.impMsg = '';
}
/* the demo cards: a picture of the design, its name and one line */
function demosHTML() {
  return `<div class="tiles">${DEMOS.map(
    (d, i) =>
      `<button type="button" class="tile ${S.demo === d.name ? 'on' : ''}" data-act="demo" data-a="${i}"><span class="tpic">${thumbHTML('demo' + i, demoState(i), designThumb('demo' + i, demoState(i)))}</span><b>${esc(d.name)}${d.trend ? ' <em class="tag27">2027</em>' : ''}</b><small>${SYS[d.sys].name}, ${esc(d.say.charAt(0).toLowerCase() + d.say.slice(1))}</small></button>`
  ).join('')}</div>`;
}
