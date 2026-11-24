/* ==== 47-demos.js ====
   Ready-made demo designs: a set of cabinets with a finished look, side panels, edge and handles.
   Open one to see what the configurator can do, then change anything.
   A cabinet here: [kind, width, height, front layout]. Looks by role work like the Surprise recipes
   (drawer, wall, tall, top, low, door). */
const DEMOS = [
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
function loadDemo(i) {
  const d = DEMOS[i];
  if (!d) return;
  S.undo = JSON.stringify({ sys: S.sys, cabs: S.cabs, fx: S.fx, flip: S.flip });
  S.sys = d.sys;
  S.cabs = d.cabs.map(([kind, w, h, lay]) => {
    const c = cab(d.sys, kind, w, h, lay);
    fixLayout(c);
    return c;
  });
  S.flip = {};
  applyPlan(d);
  S.sides = d.sides || 'none';
  S.edge = d.edge || 'round';
  S.recipe = null;
  S.demo = d.name;
  S.sel = null;
  S.impMsg = '';
}
/* the demo cards: name, a strip of its colours, one line */
function demosHTML() {
  return `<div class="demos">${DEMOS.map((d, i) => {
    const looks = [d.all, ...Object.values(d.by)].map(o => Object.assign({}, d.all, o));
    const strip = looks
      .map(
        lk =>
          `<i style="background:${MATS[lk.mat].glass ? '#cfdcd8' : faceHex(Object.assign({ col: 'chalk', oil: 'pure' }, lk))}"></i>`
      )
      .join('');
    return `<button type="button" class="demo ${S.demo === d.name ? 'on' : ''}" data-act="demo" data-a="${i}"><span class="dstrip">${strip}</span><b>${esc(d.name)}</b><small>${SYS[d.sys].name} · ${esc(d.say)}</small></button>`;
  }).join('')}</div>`;
}
