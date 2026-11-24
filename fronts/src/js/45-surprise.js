/* ==== 45-surprise.js ====
   "Surprise me": not a dice roll but a recipe, like Fitted's. Each recipe is a small rule set a designer would use —
   one bold colour, wood with one colour, two colours that go together, a glass accent, birch, walnut — and gives
   every front its look by what it is: a tall door, a drawer, a wall cabinet, the top row. Handles follow the colours:
   brass on dark and saturated colours, black on light colours and birch, the same colour for a quiet look.
*/
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const BOLD = ['cobalt', 'midnight', 'racing', 'mustard', 'terracotta', 'tomato', 'oxblood', 'plum'];
const DARK = {
  cobalt: 1,
  midnight: 1,
  racing: 1,
  oxblood: 1,
  plum: 1,
  black: 1,
  terracotta: 1,
  tomato: 1,
  olive: 1,
  clay: 1,
  dusty: 1
};
// colours that sit well together (first the main one, then the partner)
const PAIRS = [
  ['cobalt', 'chalk'],
  ['racing', 'blush'],
  ['oxblood', 'blush'],
  ['terracotta', 'sage'],
  ['midnight', 'mustard'],
  ['plum', 'sage'],
  ['tomato', 'chalk'],
  ['racing', 'mustard'],
  ['black', 'terracotta'],
  // 2027 pairings: dusty blue with maroon, ochre with maroon, celery with clay, olive with taupe
  ['dusty', 'oxblood'],
  ['mustard', 'oxblood'],
  ['celery', 'clay'],
  ['olive', 'taupe']
];
/* what a front is, for the rules */
function roleOf(f) {
  if (f.kind === 'drawer') return 'drawer';
  if (f.ckind === 'wall') return 'wall';
  if (f.sys === 'besta') return f.y > 700 ? 'top' : 'low';
  if (f.h > 1200) return 'tall';
  return 'door';
}
const RECIPES = [
  // ---- the 2027 edit ----
  {
    name: '2027: green and wood',
    trend: true,
    make(r) {
      const g = pick(r, ['celery', 'sage', 'olive', 'racing']),
        wood = pick(r, ['walnut', 'oak']);
      return {
        all: { mat: 'painted', col: g, style: pick(r, ['flat', 'fluted']) },
        by: {
          wall: { mat: wood, style: 'flat', oil: wood === 'oak' ? 'chocolate' : 'pure' },
          top: { mat: wood, style: 'flat' }
        },
        handle: pick(r, ['knob', 'bar']),
        hfin: 'mixed',
        say: `${COLOURS[g].name} with ${wood === 'oak' ? 'dark oak' : 'walnut'}, mixed metals`
      };
    }
  },
  {
    name: '2027: two woods',
    trend: true,
    make(r) {
      return {
        all: { mat: 'oak', style: 'flat', oil: 'chocolate' },
        by: {
          wall: { mat: 'oak', oil: 'pure' },
          top: { mat: 'oak', oil: 'pure' },
          drawer: { mat: pick(r, ['walnut', 'oak']), oil: 'chocolate' }
        },
        handle: 'bar',
        hfin: pick(r, ['brass', 'mixed']),
        say: 'Dark oak below, pale oak above'
      };
    }
  },
  {
    name: '2027: warm earth',
    trend: true,
    make(r) {
      const [a, b] = pick(r, [
        ['taupe', 'clay'],
        ['clay', 'mustard'],
        ['dusty', 'oxblood'],
        ['mustard', 'oxblood']
      ]);
      return {
        all: { mat: 'painted', col: a, style: pick(r, ['grooves', 'flat']) },
        by: { drawer: { col: b, style: 'flat' } },
        handle: pick(r, ['knob', 'tab', 'bar']),
        hfin: DARK[a] ? 'brass' : 'nickel',
        say: `${COLOURS[a].name} and ${COLOURS[b].name.toLowerCase()}`
      };
    }
  },
  {
    name: 'One bold colour',
    make(r) {
      const c = pick(r, BOLD);
      return {
        all: { mat: 'painted', col: c, style: pick(r, ['fluted', 'fluted', 'grooves']) },
        by: { drawer: { style: 'flat' } },
        hfin: DARK[c] ? 'brass' : 'black',
        say: COLOURS[c].name
      };
    }
  },
  {
    name: 'Wood and one colour',
    make(r) {
      const wood = pick(r, ['oak', 'walnut']),
        c = pick(
          r,
          wood === 'oak'
            ? ['racing', 'cobalt', 'terracotta', 'midnight', 'tomato']
            : ['mustard', 'blush', 'sage', 'chalk', 'terracotta']
        );
      return {
        all: { mat: wood, style: 'flat' },
        by: {
          drawer: { mat: 'painted', col: c, style: 'flat' },
          wall: { mat: 'painted', col: c, style: 'flat' },
          top: { mat: 'painted', col: c, style: 'flat' }
        },
        hfin: wood === 'walnut' ? 'brass' : 'black',
        say: `${MATS[wood].name.replace(' veneer', '')} & ${COLOURS[c].name.toLowerCase()}`
      };
    }
  },
  {
    name: 'Two colours',
    make(r) {
      const [a, b] = pick(r, PAIRS);
      return {
        all: { mat: 'painted', col: a, style: 'fluted' },
        by: { wall: { col: b, style: 'flat' }, top: { col: b, style: 'flat' }, drawer: { col: a, style: 'flat' } },
        hfin: DARK[a] ? 'brass' : 'black',
        say: `${COLOURS[a].name} & ${COLOURS[b].name.toLowerCase()}`
      };
    }
  },
  {
    name: 'Glass accent',
    make(r) {
      const base = pick(r, ['walnut', 'oak', 'painted']),
        c = pick(r, ['midnight', 'racing', 'oxblood', 'black', 'chalk']);
      const look = base === 'painted' ? { mat: 'painted', col: c, style: 'flat' } : { mat: base, style: 'flat' };
      return {
        all: look,
        by: { wall: { mat: 'glass' }, top: { mat: 'glass' }, tall: { mat: 'glass', every: 2 } },
        gframe: base === 'oak' ? 'oak' : pick(r, ['black', 'alu']),
        hfin: base === 'walnut' || DARK[c] ? 'brass' : 'black',
        say: `${base === 'painted' ? COLOURS[c].name : MATS[base].name.replace(' veneer', '')} & fluted glass`
      };
    }
  },
  {
    name: 'Plywood with colour',
    make(r) {
      const c = pick(r, ['tomato', 'cobalt', 'mustard', 'racing', 'blush']),
        ply = pick(r, ['birch', 'birch', 'pine']);
      return {
        all: { mat: ply, style: 'flat', oil: pick(r, ['pure', 'white5', 'smoke5']) },
        by: { drawer: { mat: 'painted', col: c, style: 'flat' } },
        handle: pick(r, ['push', 'tab', 'grip']),
        hfin: 'black',
        say: `${ply === 'pine' ? 'Pine' : 'Birch'} & ${COLOURS[c].name.toLowerCase()}`
      };
    }
  },
  {
    name: 'Charcoal oak',
    make(r) {
      const c = pick(r, ['mustard', 'terracotta', 'sage', 'blush']);
      return {
        all: { mat: 'oak', style: 'flat', oil: 'charcoal' },
        by: { drawer: { mat: 'painted', col: c, style: 'grooves' } },
        handle: 'bar',
        hfin: 'brass',
        say: `Charcoal-oiled oak & ${COLOURS[c].name.toLowerCase()} grooves`
      };
    }
  },
  {
    name: 'Walnut, quietly',
    make() {
      return {
        all: { mat: 'walnut', style: 'flat' },
        by: {},
        handle: 'bar',
        hfin: 'brass',
        say: 'Walnut'
      };
    }
  }
];
function surprise(seed, trendOnly) {
  const r = prng(seed || Date.now() & 0xffffffff),
    L = layout();
  // glass needs something to show off: skip glass recipes when nothing suits it
  const okR = RECIPES.filter(
    x =>
      (!trendOnly || x.trend) &&
      (x.name !== 'Glass accent' || L.fronts.some(f => ['wall', 'top', 'tall'].includes(roleOf(f))))
  );
  let rec = pick(r, okR);
  if (okR.length > 1 && rec.name === S.recipe)
    rec = okR[(okR.indexOf(rec) + 1 + Math.floor(r() * (okR.length - 1))) % okR.length];
  const plan = rec.make(r);
  applyPlan(plan, r);
  S.recipe = rec.name;
  S.recipeSay = plan.say;
  S.sel = null;
}

/* put a plan on the fronts: a look for all, and other looks by role (drawers, wall cabinets, tall doors …) */
function applyPlan(plan, r) {
  S.style = plan.all.style || 'flat';
  S.mat = plan.all.mat;
  if (plan.all.col) S.col = plan.all.col;
  S.oil = plan.all.oil || 'pure';
  S.fx = {};
  const count = {};
  layout().fronts.forEach(f => {
    const role = roleOf(f),
      o = plan.by[role];
    if (!o) return;
    count[role] = (count[role] || 0) + 1;
    if (o.every && count[role] % o.every) return; // e.g. every other tall door in glass
    const lk = Object.assign({}, plan.all, o);
    delete lk.every;
    if (lk.mat !== S.mat || lk.style !== S.style || (lk.col && lk.col !== S.col) || (lk.oil && lk.oil !== S.oil))
      S.fx[f.id] = lk;
  });
  if (plan.gframe) S.gframe = plan.gframe;
  S.handle = plan.handle || (r ? pick(r, ['knob', 'bar', 'knob', 'push']) : 'knob');
  S.hfin = S.handle === 'tab' ? 'black' : plan.hfin || 'brass';
}
