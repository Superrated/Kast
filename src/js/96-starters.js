/* ==== 96-starters.js ====
   Starter designs: ready-made walls to begin from, from simple to "everything Fitted can do".
   Each starter follows a current high-end interior trend and shows a few of the app's features.
   To add one: add an entry to STARTERS with make() returning a full design (start from stBase).
*/
/* a clean flat room with one set of boards; m = {front,carcass,desk} finish keys and board types */
function stBase(o) {
  const s = exampleState();
  s.name = o.name;
  s.room = {
    W: o.W || 3600,
    H: o.H || 2500,
    D: o.D || 600,
    drop: 0,
    ceil: o.ceil || [
      { x: 0, y: o.H || 2500 },
      { x: o.W || 3600, y: o.H || 2500 }
    ],
    beams: o.beams || []
  };
  const c = o.c || 'ral9010',
    f = o.f || c,
    ft = o.ft || (FIN[f] && FIN[f].ral ? 'mdfpaint' : 'veneer');
  s.mat.carcass = Object.assign(s.mat.carcass, { type: 'melamine', t: 18, sheet: '2800x2070', fin: c });
  s.mat.shelf = Object.assign(s.mat.shelf, { type: 'melamine', t: o.shelfT || 18, sheet: '2800x2070', fin: c });
  s.mat.back = Object.assign(s.mat.back, { type: 'hdf', t: 8, sheet: '2800x2070', fin: c });
  s.mat.front = Object.assign(s.mat.front, { type: ft, t: 19, sheet: MATS[ft].sheet, fin: f });
  s.mat.skirt = Object.assign(s.mat.skirt, { type: ft, t: 19, sheet: MATS[ft].sheet, fin: o.k || f });
  if (o.d) {
    const dt = FIN[o.d] && FIN[o.d].ral ? 'mdfpaint' : 'veneer';
    s.mat.desk = Object.assign(s.mat.desk, { type: dt, t: dt === 'veneer' ? 19 : 22, sheet: MATS[dt].sheet, fin: o.d });
  }
  Object.assign(s.opts, {
    handle: o.h || 'none',
    handleWood: o.hw || 'oak',
    handleSize: o.hs || 'M',
    construct: 'shared',
    innerLight: !!o.light
  });
  s.opts.two = { on: false, y: 1000, fin: f };
  s.sections = o.secs;
  if (o.ladder) s.ladder = { on: true, wood: o.ladder };
  return s;
}
const STARTERS = [
  {
    key: 'white',
    level: 'Simple',
    name: 'Clean white wardrobe',
    trend: 'Handleless, all white',
    blurb: 'Three columns, flush push-to-open doors in white. The easiest start.',
    shows: ['Hanging rails', 'Drawers', 'Push-to-open', 'Cut list'],
    make: () =>
      stBase({
        name: 'Clean white wardrobe',
        W: 2400,
        c: 'ral9010',
        f: 'ral9010',
        ft: 'melamine',
        shelfT: 25,
        secs: [
          Sec({ zones: [Z('closed', { rail: true, shelves: 1 })] }),
          Sec({ zones: [Z('drawers', { h: 720, count: 4 }), Z('closed', { shelves: 3 })] }),
          Sec({ zones: [Z('closed', { rail: true, shelves: 1 })] })
        ]
      })
  },
  {
    key: 'oak',
    level: 'Simple',
    name: 'Warm oak bedroom',
    trend: 'Warm wood, soft greige',
    blurb: 'Oak doors with wooden edge pulls, and smart fittings behind them.',
    shows: ['Inside fittings', 'Lights in the cupboard', 'Mirror in the door', 'Wooden handles'],
    make: () =>
      stBase({
        name: 'Warm oak bedroom',
        W: 3200,
        c: 'ral1013',
        f: 'oak',
        h: 'edge',
        hw: 'oak',
        light: true,
        shelfT: 25,
        secs: [
          Sec({ zones: [Z('closed', { rail: true, shelves: 1, fit: 'trouser' })] }),
          Sec({
            zones: [Z('drawers', { h: 720, count: 3 }), Z('closed', { shelves: 2, fit: 'jewel', dMirror: true })]
          }),
          Sec({ zones: [Z('closed', { rail: true, shelves: 1, fit: 'lift' })] }),
          Sec({ zones: [Z('closed', { rail: true, shelves: 1, fit: 'shoe', fitN: 2 })] })
        ]
      })
  },
  {
    key: 'media',
    level: 'Classic',
    name: 'Quiet luxury media wall',
    trend: 'Quiet luxury: tone-on-tone, one warm accent',
    blurb: 'Flush greige doors, a walnut-lined TV niche and speakers behind fabric.',
    shows: ['TV niche', 'Speakers with fabric', 'Wood-lined niche', '3D view'],
    make: () =>
      stBase({
        name: 'Quiet luxury media wall',
        W: 4000,
        H: 2600,
        c: 'ral7044',
        f: 'ral7044',
        shelfT: 25,
        secs: [
          Sec({ zones: [Z('drawers', { h: 700, count: 3 }), Z('closed', { shelves: 3 })] }),
          Sec({
            w: 400,
            zones: [
              Z('closed', { h: 560, shelves: 1, doors: 1, hinge: 'L', fabric: true, fabricCol: 'pebble' }),
              Z('speaker', { h: 430, grille: true, fabricCol: 'pebble' }),
              Z('closed', { shelves: 2 })
            ]
          }),
          Sec({
            w: 1500,
            zones: [
              Z('drawers', { h: 430, count: 2 }),
              Z('opening', { h: 880, tv: 65, box: true, inFin: 'walnut', boxFin: 'walnut' }),
              Z('closed', { shelves: 0, doors: 3 })
            ]
          }),
          Sec({
            w: 400,
            zones: [
              Z('closed', { h: 560, shelves: 1, doors: 1, hinge: 'R', fabric: true, fabricCol: 'pebble' }),
              Z('speaker', { h: 430, grille: true, fabricCol: 'pebble' }),
              Z('closed', { shelves: 2 })
            ]
          }),
          Sec({ zones: [Z('drawers', { h: 700, count: 3 }), Z('closed', { shelves: 3 })] })
        ]
      })
  },
  {
    key: 'arch',
    level: 'Classic',
    name: 'Fluted arches in clay',
    trend: 'Colour drenching, curves and reeded fronts',
    blurb: 'One earthy colour on everything: fluted doors below, arched shelves above, a cushioned seat in the middle.',
    shows: ['Arches', 'Fluted doors', 'Colour drench', 'Window seat'],
    make: () => {
      const c = FIN.ral3012 ? 'ral3012' : 'ral8025';
      return stBase({
        name: 'Fluted arches in clay',
        W: 3600,
        c,
        f: c,
        secs: [
          Sec({
            zones: [
              Z('closed', { h: 820, shelves: 1, face: 'fluted' }),
              Z('open', { shelves: 3, arch: true, inFin: c, drench: true })
            ]
          }),
          Sec({
            zones: [
              Z('closed', { h: 820, shelves: 1, face: 'fluted' }),
              Z('open', { shelves: 3, arch: true, inFin: c, drench: true })
            ]
          }),
          Sec({
            w: 1200,
            zones: [
              Z('seat', { h: 440, count: 2, fabricCol: 'oatmeal' }),
              Z('open', { h: 700, shelves: 0, box: true, inFin: 'oak', boxFin: 'oak' }),
              Z('closed', { shelves: 1, face: 'fluted' })
            ]
          }),
          Sec({
            zones: [
              Z('closed', { h: 820, shelves: 1, face: 'fluted' }),
              Z('open', { shelves: 3, arch: true, inFin: c, drench: true })
            ]
          }),
          Sec({
            zones: [
              Z('closed', { h: 820, shelves: 1, face: 'fluted' }),
              Z('open', { shelves: 3, arch: true, inFin: c, drench: true })
            ]
          })
        ]
      });
    }
  },
  {
    key: 'attic',
    level: 'Showcase',
    name: 'Attic under the slopes',
    trend: 'Japandi: light oak, sage, calm',
    blurb: 'Sloping ceilings and a beam: low cupboards, a reading nook for the kids, and a wardrobe in the tall part.',
    shows: ['Sloping ceilings', 'Beam cut-out', 'Reading nook', 'Low cupboards'],
    make: () => {
      const c = FIN.ral6021 ? 'ral6021' : 'ral1013';
      return slopeFix(
        stBase({
          name: 'Attic under the slopes',
          W: 4200,
          H: 2500,
          c: 'ral1013',
          f: c,
          h: 'woodcup',
          hw: 'oak',
          shelfT: 25,
          ceil: [
            { x: 0, y: 1250 },
            { x: 1600, y: 2500 },
            { x: 3300, y: 2500 },
            { x: 4200, y: 1800 }
          ],
          beams: [{ x: 1950, w: 200, bottom: 2300, depth: 300 }],
          secs: [
            Sec({ w: 700, zones: [Z('closed', { shelves: 1 })] }),
            Sec({
              w: 800,
              zones: [
                Z('drawers', { h: 420, count: 2 }),
                Z('opening', { h: 900, look: 'nook', nookPad: true, nookLedges: true, fabricCol: 'sage' }),
                Z('closed', { shelves: 1 })
              ]
            }),
            Sec({ w: 800, zones: [Z('drawers', { h: 600, count: 3 }), Z('closed', { rail: true, shelves: 1 })] }),
            Sec({ zones: [Z('closed', { rail: true, shelves: 1 })] }),
            Sec({ w: 600, zones: [Z('drawers', { h: 600, count: 3 }), Z('closed', { shelves: 1 })] })
          ]
        })
      );
    }
  },
  {
    key: 'library',
    level: 'Showcase',
    name: 'Dark library and study',
    trend: 'Moody smoked oak, lit glass, bronze tones',
    blurb: 'Smoked oak with a built-in desk, lit glass cabinets, a bar niche and a rolling library ladder.',
    shows: ['Built-in desk', 'Glass doors with lights', 'Library ladder', 'Bar niche'],
    make: () =>
      stBase({
        name: 'Dark library and study',
        W: 4400,
        H: 2800,
        c: 'black',
        f: 'smoked',
        d: 'walnut',
        h: 'edge',
        hw: 'walnut',
        light: true,
        ladder: 'walnut',
        shelfT: 25,
        secs: [
          Sec({ w: 800, zones: [Z('closed', { h: 860, shelves: 1 }), Z('open', { shelves: 4 })] }),
          Sec({
            w: 800,
            zones: [
              Z('closed', { h: 860, shelves: 1 }),
              Z('open', { h: 520, shelves: 0, niche: 'bar', box: true, boxFin: 'walnut' }),
              Z('closed', { shelves: 2, face: 'glass' })
            ]
          }),
          Sec({
            w: 1200,
            base: 'desk',
            deskH: 740,
            deskLED: true,
            zones: [Z('open', { h: 620, shelves: 0 }), Z('closed', { shelves: 2, face: 'glass' })]
          }),
          Sec({ zones: [Z('closed', { h: 860, shelves: 1 }), Z('open', { shelves: 4 })] })
        ]
      })
  },
  {
    key: 'utility',
    level: 'Showcase',
    name: 'Laundry and pantry wall',
    trend: 'Hard-working utility room in soft sage',
    blurb:
      'Washer and dryer stacked at a good height, a tall pantry pull-out, a utility cupboard and an ironing board.',
    shows: ['Washer + dryer', 'Pantry pull-out', 'Utility cupboard', 'Ironing board'],
    make: () => {
      const c = FIN.ral6021 ? 'ral6021' : 'ral7044';
      return stBase({
        name: 'Laundry and pantry wall',
        W: 3000,
        H: 2500,
        D: 660,
        c: 'ral9001',
        f: c,
        h: 'woodknob',
        hw: 'oak',
        secs: [
          PRESETS.laundry.make(),
          PRESETS.utility.make(),
          PRESETS.pantry.make(),
          Sec({ zones: [Z('closed', { h: 1000, shelves: 1, fit: 'ironing' }), Z('closed', { shelves: 2 })] })
        ]
      });
    }
  },
  {
    key: 'guest',
    level: 'Showcase',
    name: 'Guest room and home office',
    trend: 'Japandi with cane and birch',
    blurb: 'A bed that folds down from the wall, a desk with a lamp strip and a wardrobe with cane doors.',
    shows: ['Fold-down bed', 'Desk', 'Cane doors', 'Plywood look'],
    make: () =>
      stBase({
        name: 'Guest room and home office',
        W: 3800,
        H: 2500,
        c: 'birch',
        f: 'oak',
        d: 'oak',
        h: 'woodpull',
        hw: 'oak',
        shelfT: 25,
        secs: [
          Sec({
            w: 1000,
            zones: [Z('opening', { h: 2120, look: 'bed', grommet: false }), Z('closed', { shelves: 0 })]
          }),
          Sec({
            w: 1100,
            base: 'desk',
            deskH: 740,
            deskLED: true,
            zones: [Z('open', { h: 600, shelves: 0 }), Z('closed', { shelves: 1, face: 'cane' })]
          }),
          Sec({
            zones: [Z('drawers', { h: 600, count: 3 }), Z('closed', { rail: true, shelves: 1, face: 'cane', doors: 2 })]
          }),
          Sec({ zones: [Z('closed', { rail: true, shelves: 1, face: 'cane', doors: 2 })] })
        ]
      })
  },
  {
    key: 'kids',
    level: 'Showcase',
    name: 'Kids’ adventure wall',
    trend: 'Playful colour blocking',
    blurb:
      'A climbing wall over a shaft, an arched reading den, a hideout for the dog and toy drawers with coloured handles.',
    shows: ['Climbing wall', 'Reading den', 'Dog den', 'Coloured handles'],
    make: () => {
      const c = FIN.ral1013 ? 'ral1013' : 'ral9001',
        f = FIN.ral5014 ? 'ral5014' : 'ral6021';
      return stBase({
        name: 'Kids’ adventure wall',
        W: 4000,
        H: 2500,
        c,
        f,
        d: 'oak',
        h: 'stick',
        secs: [
          Sec({ w: 900, base: 'panel', panel: { ...PANEL_DEF }, zones: [] }),
          Sec({
            w: 800,
            zones: [
              Z('drawers', { h: 420, count: 2 }),
              Z('opening', {
                h: 950,
                look: 'nook',
                nookFront: 'arch',
                nookPad: true,
                nookCurtain: true,
                fabricCol: 'mustard'
              }),
              Z('closed', { shelves: 1 })
            ]
          }),
          Sec({
            w: 1180,
            zones: [
              Z('closed', { h: 820, dog: 'house', doors: 1, shelves: 0 }),
              Z('open', { h: 500, shelves: 0 }),
              Z('closed', { shelves: 1 })
            ]
          }),
          Sec({ zones: [Z('drawers', { h: 900, count: 4 }), Z('closed', { shelves: 2 })] })
        ]
      });
    }
  }
];
const ST = { fit: false, thumbs: {} };
function stRoomData() {
  if (ST.roomId) {
    const r = (RM.list || []).find(x => x.id === ST.roomId),
      d = r && rmParse(r);
    if (d && d.room) return d;
  }
  return roomOf(S);
}
function stMake(k, fit) {
  const T = STARTERS.find(x => x.key === k);
  if (!T) return null;
  let st = T.make();
  if (fit && S && S.room) {
    st = fitToRoom(st, stRoomData());
  }
  st = fitTypes(st);
  if (st.ladder && st.ladder.on)
    try {
      st = alignLadder(st);
    } catch (e) {
      oops('starters #1', e);
    }
  return st;
}
function stThumb(k) {
  if (ST.thumbs[k] != null) return ST.thumbs[k];
  let h = '';
  try {
    const st = stMake(k, false);
    h = elevSVG(st, build(st), { mini: true });
  } catch (e) {
    h = '';
  }
  ST.thumbs[k] = h;
  return h;
}
function stOpen() {
  let m = document.getElementById('stm');
  if (!m) {
    m = document.createElement('div');
    m.id = 'stm';
    m.className = 'modal';
    document.body.appendChild(m);
    m.addEventListener('click', e => {
      if (e.target === m) m.hidden = true;
    });
  }
  const mm = document.getElementById('mmenu');
  if (mm) mm.hidden = true;
  const w = document.getElementById('wiz');
  if (w && !w.hidden) closeWiz();
  stRender();
  m.hidden = false;
}
function stRender() {
  const m = document.getElementById('stm');
  if (!m) return;
  const lv = ['Simple', 'Classic', 'Showcase'];
  const R = S.room,
    rooms = RM.list || [];
  if (ST.roomId && !rooms.some(r => r.id === ST.roomId)) ST.roomId = null;
  const slope = (R.ceil || []).some(p => Math.abs(+p.y - +R.H) > 1);
  const roomSel = `<div class="stfit"><label class="chk"><input type="checkbox" id="stFit" ${ST.fit ? 'checked' : ''} data-act="stFit"> Fit it to a wall</label><select id="stRoom" aria-label="Which wall" ${ST.fit ? '' : 'disabled'}><option value="">the wall of the open design (${f0(+R.W)} × ${f0(+R.H)} mm${slope ? ', sloping' : ''})</option>${rooms
    .map(r => {
      const d = rmParse(r) || {},
        rr = d.room || {};
      return `<option value="${esc(r.id)}"${r.id === ST.roomId ? ' selected' : ''}>${esc(r.name || 'Room')} (${f0(+rr.W)} × ${f0(+rr.H)} mm)</option>`;
    })
    .join('')}</select></div>`;
  m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true" aria-label="New design"><div class="mhead"><h2>New design</h2></div><div class="mbody" style="display:grid;gap:14px">
    <div class="sthub"><button type="button" class="sthb" data-act="wizard"><b>Step by step</b><small>Measure your wall and tell Fitted what you need — it proposes designs.</small></button>${rooms.length ? `<button type="button" class="sthb" data-act="stInRoom"><b>In a saved room</b><small>${rooms.length} room${rooms.length > 1 ? 's' : ''} saved — choose the room below, then a design.</small></button>` : ''}<button type="button" class="sthb" data-act="wizStart"><b>The example attic</b><small>A sloped attic wall with a beam, ready to explore.</small></button></div>
    <h3 class="sth">Or start from a ready-made design</h3>
    <p class="hintp" style="margin:0">Pick one and make it yours — every part can be changed. They go from simple to showing off everything Fitted can do.</p>
    ${roomSel}
    ${lv
      .map(
        L =>
          `<div class="stgrp"><h3>${L === 'Simple' ? 'Simple — a quick start' : L === 'Classic' ? 'Classic — a statement wall' : 'Showcase — everything Fitted can do'}</h3><div class="stgrid">${STARTERS.filter(
            t => t.level === L
          )
            .map(
              t =>
                `<button type="button" class="stcard" data-act="stPick" data-a="${t.key}"><span class="stpic">${stThumb(t.key)}</span><b>${esc(t.name)}</b><small class="sttrend">${esc(t.trend)}</small><small>${esc(t.blurb)}</small><span class="stshows">${t.shows.map(x => `<i>${esc(x)}</i>`).join('')}</span></button>`
            )
            .join('')}</div></div>`
      )
      .join('')}
  </div><div class="mfoot"><button type="button" class="btn" data-act="stClose">Close</button><div></div></div></div>`;
}
function stPick(k) {
  const T = STARTERS.find(x => x.key === k);
  const st = stMake(k, ST.fit);
  if (!st) return;
  const kept_ = dsKeep();
  dsDetach(false);
  S = st;
  ui.sel = 0;
  ui.zsel = null;
  ui.wizSeen = 1;
  groupsCache = null;
  const m = document.getElementById('stm');
  if (m) m.hidden = true;
  changed(true);
  toast(
    `${T.name} — change anything you like${kept_ ? '. The design you had open was kept under Designs → Recovered work.' : ''}`
  );
}

document.addEventListener('change', e => {
  if (e.target && e.target.id === 'stRoom') {
    ST.roomId = e.target.value || null;
    ST.fit = true;
  }
});
