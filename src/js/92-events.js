/* ==== 92-events.js ====
   All clicks: one big switch on data-act="…". To add a button: give it data-act="myAction" and add a case here.
*/
/* ===== events ===== */
document.addEventListener('keydown', e => {
  const tg = e.target;
  if (
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    (e.key === 'f' || e.key === 'F') &&
    !(tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT')) &&
    (ui.tab === 'elev' || ui.tab === '3d')
  ) {
    setFm({ solid: 'glass', glass: 'off', off: 'solid' }[ui.fm]);
    return;
  }
  if (!(e.ctrlKey || e.metaKey)) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  const k = e.key.toLowerCase();
  if (k === 'z') {
    e.preventDefault();
    undoRedo(e.shiftKey ? 1 : -1);
  } else if (k === 'y') {
    e.preventDefault();
    undoRedo(1);
  }
});
document.addEventListener('focusin', e => {
  const el = e.target;
  if (el && el.dataset && el.dataset.p === 'room.W') ui.prevW = +S.room.W;
});
document.addEventListener('change', e => {
  const el = e.target;
  if (!el || !el.dataset || !S.proj) return;
  if (el.dataset.pja != null) {
    const v = +el.value;
    if (v >= 45 && v <= 179) {
      (S.proj.angles = S.proj.angles || [])[+el.dataset.pja] = v;
      pjSync();
      changed(true);
    }
    return;
  }
  if (el.dataset.pjl != null) {
    const [k, f] = el.dataset.pjl.split(':'),
      v = +el.value;
    if (v >= 200) {
      const L = (S.proj.legs = S.proj.legs || []);
      L[+k] = Object.assign({}, L[+k] || {}, { [f]: v });
      pjSync();
      changed(true);
    }
    return;
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (!el || !el.dataset || el.dataset.pj == null || !S.proj) return;
  const k = +el.dataset.pj,
    v = +el.value;
  if (!(v >= 600)) return;
  S.proj.walls[k].len = v;
  pjSync();
  changed(true);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (!el || !el.dataset || el.dataset.p !== 'room.W') return;
  const W = +S.room.W,
    W0 = +ui.prevW;
  if (!(W >= 600) || !(W0 >= 600) || Math.abs(W - W0) < 1) return;
  const sd = +S.skirt.side || 0,
    k = (W - 2 * sd) / Math.max(100, W0 - 2 * sd);
  let n = 0;
  (S.sections || []).forEach(sc => {
    if (+sc.w > 0) {
      sc.w = Math.max(150, Math.round(+sc.w * k));
      n++;
    }
    if (sc.pinX != null && sc.pinX !== '' && isFinite(+sc.pinX)) sc.pinX = Math.round(+sc.pinX * k);
  });
  const cl = S.room.ceil || [];
  cl.forEach(c => {
    if (+c.x >= W0 - 1 || +c.x > W) c.x = W;
  });
  S.room.ceil = cl
    .filter((c, i) => i === 0 || +c.x > +cl[i - 1].x || i === cl.length - 1)
    .filter((c, i, a) => i === 0 || +c.x > +a[i - 1].x);
  (S.room.beams || []).forEach(b => {
    if (+b.x + +b.w > W) b.x = Math.max(0, W - +b.w);
  });
  (S.room.wobs || []).forEach(o => {
    if (+o.x > W) o.x = W - 100;
  });
  ui.prevW = W;
  changed(true);
  if (n) toast('Columns rescaled to the new wall width — shuffle the layout for a fresh fit');
});
document.addEventListener('input', e => {
  const el = e.target;
  if (!el.dataset || !el.dataset.p) return;
  if (el.tagName === 'SELECT' || el.type === 'checkbox') return;
  setP(el.dataset.p, el.value === '' ? null : +el.value);
  changedSoon();
});
document.addEventListener('change', e => {
  const el = e.target;
  if (!el.dataset || !el.dataset.p) return;
  if (!(el.tagName === 'SELECT' || el.type === 'checkbox')) return;
  const v = el.type === 'checkbox' ? el.checked : el.dataset.num ? +el.value : el.value;
  setP(el.dataset.p, v);
  applyMatType(el.dataset.p);
  if (el.dataset.ladon && v) {
    geo = build(S);
    S = alignLadder(S);
    setTimeout(() => toast('Ladder added — the cabinets under the rail were lined up with it'), 30);
  }
  changed(!!el.dataset.re);
});
(() => {
  const v = document.getElementById('v-elev');
  let d0 = 0,
    z0 = 1;
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  v.addEventListener(
    'touchstart',
    e => {
      if (e.touches.length === 2) {
        d0 = dist(e.touches);
        z0 = ui.zoom;
      }
    },
    { passive: true }
  );
  v.addEventListener(
    'touchmove',
    e => {
      if (e.touches.length === 2 && d0) {
        e.preventDefault();
        ui.zoom = Math.max(1, Math.min(5, (z0 * dist(e.touches)) / d0));
        zoomWrap();
      }
    },
    { passive: false }
  );
  v.addEventListener(
    'touchend',
    () => {
      d0 = 0;
    },
    { passive: true }
  );
})();
document.getElementById('bar').addEventListener(
  'toggle',
  e => {
    const d = e.target;
    if (d.classList && d.classList.contains('notes')) ui.notesOpen = d.open;
  },
  true
);
document.getElementById('side').addEventListener(
  'toggle',
  e => {
    const d = e.target;
    if (d.dataset && d.dataset.mk) {
      (ui.moreOpen = ui.moreOpen || {})[d.dataset.mk] = d.open;
    }
    if (d.dataset && d.dataset.k) openState[d.dataset.k] = d.open;
    if (d.dataset && d.dataset.mx) {
      if (d.open) openMx.add(d.dataset.mx);
      else openMx.delete(d.dataset.mx);
    }
  },
  true
);
document.getElementById('elevWrap').addEventListener('click', e => {
  const t = e.target.closest('[data-sec]');
  if (!t) return;
  ui.pane = 'layout';
  ui.sel = +t.dataset.sec;
  ui.zsel = t.dataset.zone != null ? +t.dataset.zone : null;
  if (isSheet()) ui.flow = ui.zsel != null ? 'zone' : 'col';
  applyFronts3D();
  openState.secs = true;
  renderSide();
  dirty.elev = true;
  renderTab('elev');
  if (isSheet()) {
    document.getElementById('side').scrollTop = 0;
    openSheetAt();
    return;
  }
  const c =
    document.querySelector('.zrow.on') ||
    document.querySelector('details[data-k="secs"] .card.sel') ||
    document.querySelector('details[data-k="secs"]');
  if (!c) return;
  if (window.innerWidth > 860) {
    const sd = document.getElementById('side');
    sd.scrollLeft = 0;
    sd.scrollTo({
      top: c.getBoundingClientRect().top - sd.getBoundingClientRect().top + sd.scrollTop - 120,
      behavior: 'smooth'
    });
  } else {
    const st = document.querySelector('.stage').offsetHeight + (document.querySelector('.spane')?.offsetHeight || 0);
    window.scrollTo({ top: c.getBoundingClientRect().top + scrollY - st - 10, behavior: 'smooth' });
  }
});
document.getElementById('side').addEventListener('click', e => {
  const zc = e.target.closest('[data-zcard]');
  if (zc && !e.target.closest('input,select,button')) {
    ui.zsel = +zc.dataset.zcard;
    document.querySelectorAll('.zone').forEach(z => z.classList.toggle('sel', z === zc));
    dirty.elev = true;
    if (ui.tab === 'elev') renderTab('elev');
  }
});
document.addEventListener('click', e => {
  {
    const mm = document.getElementById('mmenu');
    if (mm && !mm.hidden && !e.target.closest('#mmenu,[data-act="mmenu"]')) mm.hidden = true;
    if (mm && !mm.hidden && e.target.closest('#mmenu [data-act]'))
      setTimeout(() => {
        mm.hidden = true;
      }, 0);
  }
  if (innerWidth <= 860) {
    const hp = e.target.closest('aside.side .hintp');
    if (hp && !e.target.closest('button,a,input')) hp.classList.toggle('open');
  }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.a,
    act = b.dataset.act;
  const secs = S.sections;
  switch (act) {
    case 'tab': {
      const t = a === 'design' ? ui.dmode || 'elev' : a; // the Design tab opens Front or 3D, whichever was used last
      if (PN_GROUP[t]) {
        PN.last = t;
        pnSave();
      }
      showTab(t);
      break;
    }
    case 'pnTop':
      if (a === 'area') showTab(pnLast());
      else pnGo(a);
      break;
    case 'pnGo':
      pnGo(a);
      break;
    case 'wkCut':
      ui.ws = { tab: 'cuts' };
      lockOn();
      wsRender();
      break;
    case 'wkSteps':
      ui.ws = { tab: 'steps' };
      lockOn();
      wsRender();
      break;
    case 'wkBox':
      WX.col = +a || 0;
      WX.sel = null;
      ui.ws = { tab: 'boxes' };
      wsRender();
      break;
    case 'ceilPreset': {
      const W = +S.room.W,
        H = +S.room.H,
        k = Math.min(1200, H * 0.5),
        L = Math.min(1600, W * 0.35);
      S.room.ceil =
        a === 'flat'
          ? [
              { x: 0, y: H },
              { x: W, y: H }
            ]
          : a === 'left'
            ? [
                { x: 0, y: k },
                { x: L, y: H },
                { x: W, y: H }
              ]
            : a === 'right'
              ? [
                  { x: 0, y: H },
                  { x: W - L, y: H },
                  { x: W, y: k }
                ]
              : [
                  { x: 0, y: k },
                  { x: L, y: H },
                  { x: W - L, y: H },
                  { x: W, y: k }
                ];
      changed(true);
      break;
    }
    case 'addCeil': {
      const c = S.room.ceil;
      const l = c[c.length - 1] || { x: 0, y: S.room.H };
      c.push({ x: Math.min(+S.room.W, +l.x + 500), y: l.y });
      changed(true);
      break;
    }
    case 'delCeil':
      S.room.ceil.splice(+a, 1);
      changed(true);
      break;
    case 'addBeam':
      S.room.beams.push({
        x: Math.round(S.room.W / 2 - 100),
        w: 200,
        bottom: Math.round(+S.room.H - 250),
        depth: +S.room.D
      });
      openState.obs = true;
      changed(true);
      break;
    case 'delBeam':
      S.room.beams.splice(+a, 1);
      changed(true);
      break;
    case 'scrOn':
      S.opts.screen = Object.assign({ show: 'down' }, S.opts.screen || {}, { on: !!b.checked });
      if (b.checked) S.opts.screen.show = 'down';
      openState.scr = true;
      changed(true);
      break;
    case 'scrT': {
      if (!geo.screen) {
        toast(
          geo.warns.find(w => /^Projector screen/.test(w)) ||
            'The screen has no place on this wall yet — it needs two plain cabinet columns side by side.'
        );
        break;
      }
      if (ui.exT > 0.02 || ui.iso || ui.exOn) {
        ui.exOn = false;
        ui.iso = false;
        ui.exT = 0;
        if (T3) {
          applyExplode();
          camPreset('angle');
        }
      }
      const dn = S.opts.screen.show !== 'down';
      S.opts.screen.show = dn ? 'down' : 'up';
      if (ui.tab === '3d' && T3 && !T3.scr) {
        try {
          screen3D();
        } catch (e) {
          oops('events #1', e);
        }
      }
      if (ui.tab === '3d' && T3 && T3.scr) {
        geo.screen.down = dn;
        dirty.elev = true;
        saveSoon();
        snap();
        renderBar();
        if (dn && ui.photoOn) setPhotoMode(false);
        animScreen(dn ? 1 : 0);
        if (!dn && ui.cinema) {
          ui.cinema = false;
          renderBar();
        }
      } else {
        ui.scrA = dn ? 1 : 0;
        if (!dn) ui.cinema = false;
        changed(true);
      }
      break;
    }
    case 'cinema': {
      if (!geo.screen) {
        toast(geo.warns.find(w => /^Projector screen/.test(w)) || 'The screen has no place on this wall yet.');
        break;
      }
      if (ui.exT > 0.02 || ui.iso) {
        ui.exOn = false;
        ui.iso = false;
        ui.exT = 0;
        applyExplode();
      }
      if (ui.photoOn) setPhotoMode(false);
      ui.cinema = !ui.cinema;
      if (ui.cinema && S.opts.screen.show !== 'down') {
        S.opts.screen.show = 'down';
        geo.screen.down = true;
        dirty.elev = true;
        saveSoon();
        snap();
        animScreen(1);
        setTimeout(() => applyScreen3D(), 1600);
      } else applyScreen3D();
      if (ui.cinema) camPreset('seat');
      renderBar();
      break;
    }
    case 'personOn':
      S.room.person = Object.assign({ h: 1750 }, S.room.person || {}, { on: !!b.checked });
      openState.ppl = true;
      changed(true);
      break;
    case 'addObj':
      (S.room.objs = Array.isArray(S.room.objs) ? S.room.objs : []).push(
        a === 'door'
          ? { type: 'door', wall: 'left', x: 400, w: 830, h: 2015 }
          : { type: 'window', wall: 'back', x: Math.round(+S.room.W / 2 - 450), w: 900, y: 850, h: 1200 }
      );
      openState.ppl = true;
      changed(true);
      break;
    case 'delObj':
      S.room.objs.splice(+a, 1);
      changed(true);
      break;
    case 'addWob': {
      const d = WOB[a] || WOB.socket,
        l = (S.room.wobs = Array.isArray(S.room.wobs) ? S.room.wobs : []);
      l.push(
        a === 'radiator'
          ? { type: a, x: Math.round(+S.room.W / 2 - 500), w: 1000, y: 150, h: 600 }
          : a === 'pipe'
            ? { type: a, x: 150, w: 22, p: 37 }
            : { type: a, x: Math.round(300 + l.length * 400), y: d.y }
      );
      openState.site = true;
      changed(true);
      break;
    }
    case 'delWob':
      S.room.wobs.splice(+a, 1);
      changed(true);
      break;
    case 'addBump':
      (S.room.bumps = Array.isArray(S.room.bumps) ? S.room.bumps : []).push({
        type: a,
        x: Math.round(+S.room.W / 2 - (a === 'pipes' ? 100 : 300)),
        w: a === 'pipes' ? 200 : a === 'pillar' ? 300 : 600,
        d: a === 'pipes' ? 150 : a === 'pillar' ? 200 : 350,
        h: a === 'pipes' ? '' : '',
        mode: 'shallow'
      });
      openState.site = true;
      changed(true);
      break;
    case 'delBump':
      S.room.bumps.splice(+a, 1);
      changed(true);
      break;
    case 'addCobj':
      (S.room.cobjs = Array.isArray(S.room.cobjs) ? S.room.cobjs : []).push(
        a === 'dormer'
          ? { type: a, x: Math.round(+S.room.W / 2 - 600), w: 1200, h: Math.round(+S.room.H), sill: 900 }
          : a === 'hatch'
            ? { type: a, x: Math.round(+S.room.W / 2 - 300), w: 600, d: 1300, L: 900 }
            : { type: a, x: Math.round(+S.room.W / 2), d: a === 'smoke' ? 1500 : 1000 }
      );
      openState.obs = true;
      changed(true);
      break;
    case 'delCobj':
      S.room.cobjs.splice(+a, 1);
      changed(true);
      break;
    case 'addPurlin':
      S.room.beams.push({
        x: 0,
        w: Math.round(+S.room.W),
        bottom: Math.round(Math.min(+S.room.H - 200, 2200)),
        depth: 200
      });
      openState.obs = true;
      changed(true);
      toast('Roof purlin added — set its height and how far it sticks out');
      break;
    case 'focusT':
      ui.focus = ui.focus === false;
      dirty.elev = true;
      renderTab('elev');
      renderBar();
      break;
    case 'flow':
      ui.flow = a;
      if (a !== 'zone') ui.zsel = a === 'home' ? null : ui.zsel;
      if (a === 'col') ui.zsel = null;
      renderSide();
      setSheet(null);
      renderBar();
      document.getElementById('side').scrollTop = 0;
      dirty.elev = true;
      if (ui.tab === 'elev') renderTab('elev');
      applyFronts3D();
      break;
    case 'flowSec':
      ui.sel = Math.max(0, Math.min(secs.length - 1, ui.sel + +a));
      ui.zsel = null;
      ui.flow = 'col';
      renderSide();
      document.getElementById('side').scrollTop = 0;
      dirty.elev = true;
      if (ui.tab === 'elev') renderTab('elev');
      applyFronts3D();
      break;
    case 'flowZone': {
      const s_ = secs[ui.sel],
        zm = s_.base === 'door' ? 1 : 0;
      ui.zsel = Math.max(zm, Math.min(s_.zones.length - 1, (ui.zsel ?? 0) + +a));
      renderSide();
      document.getElementById('side').scrollTop = 0;
      dirty.elev = true;
      if (ui.tab === 'elev') renderTab('elev');
      applyFronts3D();
      break;
    }
    case 'flowAddZone': {
      ui.flow = 'col';
      ui.zsel = null;
      renderSide();
      document.getElementById('side').scrollTop = 1e5;
      break;
    }
    case 'selSec':
      if (isSheet()) {
        ui.flow = 'col';
        document.getElementById('side').scrollTop = 0;
        openSheetAt();
      }
      ui.sel = +a;
      ui.zsel = null;
      renderSide();
      dirty.elev = true;
      if (ui.tab === 'elev') renderTab('elev');
      applyFronts3D();
      break;
    case 'fixSec': {
      const i = +a,
        sc = S.sections[i],
        q = geo.secs[i];
      if (!q) break;
      if (b.checked) {
        sc.pinX = Math.round(q.lx);
        sc.w = Math.round(q.w);
        toast('Fixed in place — shuffles and columns work around it');
      } else {
        sc.pinX = null;
        toast('No longer fixed');
      }
      changed(true);
      break;
    }
    case 'spanSec': {
      const i = ui.sel,
        sc = S.sections[i],
        q = geo.secs[i];
      if (!q) break;
      const per = geo.boxes ? 2 * geo.tc : geo.tc,
        cur = +sc.span || 1,
        n = +a;
      if (n === cur) break;
      const fixed = x => ['panel', 'door'].includes(x.base) || (x.base === 'desk' && x.pinX != null && x.pinX !== '');
      const cw = geo.secs
          .filter((x, j) => j !== i && !fixed(S.sections[j]) && !x.desk)
          .map(x => x.w)
          .sort((a2, b2) => a2 - b2),
        colW = cw.length ? cw[Math.floor(cw.length / 2)] : (q.w - (cur - 1) * per) / cur;
      // keep the column count: remove (or add) plain columns next to the doorway
      let d = n - cur;
      while (d > 0) {
        const r = S.sections[i + 1] && !fixed(S.sections[i + 1]) && S.sections[i + 1].base !== 'desk' ? i + 1 : -1,
          l =
            r < 0
              ? S.sections
                  .slice(0, i)
                  .map((x, k) => k)
                  .reverse()
                  .find(k => !fixed(S.sections[k]) && S.sections[k].base !== 'desk')
              : undefined;
        const nb = r >= 0 ? r : l != null ? l : -1;
        if (nb < 0) break;
        S.sections.splice(nb, 1);
        d--;
      }
      while (d < 0) {
        const src = S.sections.find(x => x.base === 'cab');
        const c = src ? JSON.parse(JSON.stringify(src)) : Sec({ zones: [Z('closed', { shelves: 2 })] });
        c.id = uid();
        c.pinX = null;
        S.sections.splice(S.sections.indexOf(sc) + 1, 0, c);
        d++;
      }
      sc.w = Math.round(n * colW + (n - 1) * per);
      sc.span = n;
      if (n >= 2 && !+sc.doorLeaves) sc.doorLeaves = sc.w > 1250 ? 2 : 1;
      S.sections.forEach(x => {
        if (x !== sc && !fixed(x) && x.base !== 'desk') x.w = null;
      });
      ui.sel = S.sections.indexOf(sc);
      S.opts.cols = 0;
      ui.zsel = null;
      changed(true);
      toast(`Doorway is ${n} column${n > 1 ? 's' : ''} wide (${sc.w} mm)`);
      break;
    }
    case 'addQuick': {
      const s = PRESETS[a].make();
      secs.splice(ui.sel + 1, 0, s);
      ui.sel = Math.min(ui.sel + 1, secs.length - 1);
      ui.zsel = null;
      if (a === 'door') {
        s.doorStyle = 'hallway';
        S.sections.forEach(x => {
          if (x !== s && !['panel', 'door'].includes(x.base) && !(x.base === 'desk' && x.pinX != null && x.pinX !== ''))
            x.w = x.base === 'desk' ? Math.max(1000, +x.w || 0) : null;
        });
        S.opts.cols = 0;
        geo = build(S);
        const q = geo.secs[ui.sel];
        if (q) {
          s.pinX = Math.round(q.lx);
          s.w = Math.round(q.w);
        }
      }
      changed(true);
      toast(
        a === 'door'
          ? 'Walk-through added — pick Door, Hidden door, Hallway or Open doorway in its settings'
          : 'Column added'
      );
      break;
    }
    case 'addSec': {
      const k = document.getElementById('addPreset').value;
      const s = PRESETS[k].make();
      secs.splice(ui.sel + 1, 0, s);
      ui.sel = Math.min(ui.sel + 1, secs.length - 1);
      ui.zsel = null;
      changed(true);
      break;
    }
    case 'delSec':
      if (secs.length < 2) {
        toast('Keep at least one column');
        break;
      }
      secs.splice(ui.sel, 1);
      ui.sel = Math.max(0, ui.sel - 1);
      ui.zsel = null;
      changed(true);
      break;
    case 'dupSec': {
      const c = JSON.parse(JSON.stringify(secs[ui.sel]));
      c.id = uid();
      c.zones.forEach(z => (z.id = uid()));
      secs.splice(ui.sel + 1, 0, c);
      ui.sel++;
      changed(true);
      break;
    }
    case 'moveSec': {
      const j = ui.sel + +a;
      if (j < 0 || j >= secs.length) break;
      [secs[ui.sel], secs[j]] = [secs[j], secs[ui.sel]];
      ui.sel = j;
      changed(true);
      break;
    }
    case 'addZone': {
      const t = document.getElementById('addZoneType').value;
      const zs = secs[ui.sel].zones;
      const prevTop = zs[zs.length - 1];
      const nz = Z(t, { shelves: t === 'open' || t === 'closed' ? 2 : 0, h: null });
      if (t === 'opening') nz.look = 'nook';
      if (prevTop && !(+prevTop.h > 0)) prevTop.h = 400;
      zs.push(nz);
      ui.zsel = zs.length - 1;
      changed(true);
      break;
    }
    case 'delZone': {
      const zs = secs[ui.sel].zones;
      if (zs.length < 2) {
        toast('A column needs at least one level');
        break;
      }
      zs.splice(+a, 1);
      ui.zsel = null;
      changed(true);
      break;
    }
    case 'moveZone': {
      const [k, d] = a.split(',').map(Number);
      const zs = secs[ui.sel].zones,
        j = k + d;
      if (j < 0 || j >= zs.length || zs[j].type === 'passage' || zs[k].type === 'passage') break;
      [zs[k], zs[j]] = [zs[j], zs[k]];
      ui.zsel = j;
      changed(true);
      break;
    }
    case 'fm':
      setFm(a);
      break;
    case 'xray':
      ui.xray = !ui.xray;
      if (ui.xray) ui.hide = false;
      dirty.elev = true;
      renderBar();
      renderTab('elev');
      break;
    case 'hideF':
      ui.hide = !ui.hide;
      if (ui.hide) ui.xray = false;
      dirty.elev = true;
      renderBar();
      renderTab('elev');
      break;
    case 'zoom':
      ui.zoom = Math.max(1, Math.min(4, ui.zoom * (+a > 0 ? 1.4 : 1 / 1.4)));
      if (ui.zoom < 1.05) ui.zoom = 1;
      zoomWrap();
      break;
    case 'cam':
      if (ui.photoOn) setPhotoMode(false);
      camPreset(a);
      break;
    case 'light3d': {
      const ks = Object.keys(LIGHTS);
      ui.light = ks[(ks.indexOf(ui.light || '') + 1) % ks.length];
      if (T3) {
        const G = geo;
        try {
          dayLight(G.W, Math.max(...G.cps.map(p => p.y)), G.D);
        } catch (e) {
          oops('events #2', e);
        }
        T3.req();
      }
      renderBar();
      break;
    }
    case 'hide3D':
      ui.hide3D = !ui.hide3D;
      if (T3) {
        T3.frontG.visible = !ui.hide3D;
        T3.req();
      }
      renderBar();
      break;
    case 'room3D':
      ui.room3D = !ui.room3D;
      if (T3) {
        applyExplode();
      }
      renderBar();
      break;
    case 'photo':
      if (ui.photoOn) {
        PH.keep = false;
        photoSave();
        setPhotoMode(false);
      } else if (PH.pose && PH.img) {
        PH.adjust = !PH.keep;
        setPhotoMode(true);
      } else {
        pcalOpen();
        if (PH.img) pcalRender();
      }
      break;
    case 'pcalOpen':
      document.body.classList.remove('pfull');
      pcalOpen();
      break;
    case 'mmenu': {
      const m = document.getElementById('mmenu');
      m.hidden = !m.hidden;
      b.setAttribute('aria-expanded', String(!m.hidden));
      break;
    }
    case 'shufPanel':
      S.opts.shufPanel = S.opts.shufPanel === false;
      changed(true);
      toast(
        S.opts.shufPanel
          ? 'Shuffles now also change the panel wall colour and decoration'
          : 'Panel wall stays as it is in shuffles'
      );
      break;
    case 'sideT': {
      ui.noside = !ui.noside;
      const ap = document.querySelector('.app');
      ap.classList.toggle('noside', ui.noside);
      b.setAttribute('aria-pressed', String(ui.noside));
      setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
      break;
    }
    case 'notesOpen': {
      if (ui.tab !== 'elev' && ui.tab !== '3d') {
        const tb = document.querySelector('[data-act="tab"][data-a="elev"]');
        if (tb) tb.click();
      }
      const d = document.querySelector('#bar details.notes');
      if (d) {
        ui.notesOpen = !d.open;
        d.open = ui.notesOpen;
        d.scrollIntoView({ block: 'nearest' });
      } else toast('No design issues found');
      break;
    }
    case 'toBudget': {
      pnGo('price');
      if (isSheet()) {
        try {
          closeSheet();
        } catch (e) {
          oops('events #3', e);
        }
      }
      setTimeout(() => {
        const t = document.getElementById('budcard');
        if (t) t.scrollIntoView({ block: 'start' });
      }, 80);
      break;
    }
    case 'budT': {
      budSwitch(a);
      ui.saver = null;
      changed(true);
      break;
    }
    case 'budGo': {
      const T = +S.opts.budT,
        ids = ((ui.bud && ui.bud.rows) || []).filter(r => r.sug).map(r => r.id);
      if (!(T > 0) || !ids.length) break;
      let n = 0;
      for (const id of ids) {
        const pr = priceOf(S);
        if (pr && pr.total <= T) break;
        budSwitch(id, true);
        n++;
      }
      ui.saver = null;
      changed(true);
      const pr = priceOf(S);
      toast(
        pr
          ? pr.total <= T
            ? `${n} saving${n === 1 ? '' : 's'} switched on — now ${eur(pr.total)}, within your budget`
            : `${n} saving${n === 1 ? '' : 's'} switched on — now ${eur(pr.total)}, still ${eur(pr.total - T)} over`
          : 'Savings switched on'
      );
      break;
    }
    case 'budClear':
      delete S.opts.budT;
      saveSoon();
      snap();
      budPaint();
      budChips();
      break;
    case 'budMode':
      if (budgetKind()) delete S.opts.budget;
      else S.opts.budget = S.mat.front.type === 'mdfpaint' ? 'mdf' : 'mel';
      changed(true);
      toast(budgetKind() ? 'New shuffles will stay cheap' : 'Shuffles are free again');
      break;
    case 'budgetCycle':
      budgetBuild(budgetKind() === 'mel' ? 'mdf' : budgetKind() === 'mdf' ? 'off' : 'mel');
      break;
    case 'toPriceTab': {
      pnGo('price');
      setTimeout(() => {
        const t = document.getElementById('price');
        if (t) t.scrollIntoView({ block: 'start' });
      }, 60);
      break;
    }
    case 'budget':
      budgetBuild(a);
      ui.saver = null;
      dirty.cut = true;
      if (ui.tab === 'cut') renderCut();
      break;
    case 'phases':
      planPhases(+a);
      {
        const t = document.getElementById('price');
        if (t) t.scrollIntoView({ block: 'start' });
      }
      break;
    case 'phaseUse':
      S.opts.part = Object.assign({}, S.opts.part || {}, { on: '1', secs: a.split(',').map(Number) });
      changed(true);
      toast(
        'Showing only this phase — the cut list, sheets, guide and PDF follow. Choose “Everything” at the top to go back.'
      );
      {
        const v = document.getElementById('v-cut');
        if (v) v.scrollTop = 0;
        window.scrollTo(0, 0);
      }
      break;
    case 'shop':
      S.opts.shop = a;
      ui.saver = null;
      changed(true);
      break;
    case 'saver':
      sheetSaver();
      dirty.cut = true;
      renderCut();
      {
        const t = document.getElementById('price');
        if (t) t.scrollIntoView({ block: 'start' });
      }
      break;
    case 'evenDoorsFar':
      evenDoors(true);
      break;
    case 'evenFarOff':
      ui.evenFarOff = true;
      renderSide();
      break;
    case 'evenDoors':
      evenDoors();
      break;
    case 'wsOpen':
      ui.ws = { tab: 'cuts' };
      lockOn();
      wsRender();
      break;
    case 'lockOn':
      lockOn();
      break;
    case 'dsLockSave':
      dsLockSave();
      break;
    case 'dsEditCopy':
      dsEditCopy();
      break;
    case 'lockInfo':
      lockT = 0;
      lockToast();
      break;
    case 'unlock': {
      const b = e.target.closest('button');
      if (b.dataset.armed) {
        lockOff();
      } else {
        b.dataset.armed = '1';
        b.textContent = 'Tap again — parts already cut may no longer fit';
        setTimeout(() => {
          if (b.isConnected) {
            delete b.dataset.armed;
            b.textContent = 'Unlock to change the design';
          }
        }, 4000);
      }
      break;
    }
    case 'wsClose':
      ui.ws = null;
      wsRender();
      break;
    case 'wsTab':
      ui.ws = { tab: a };
      wsRender();
      break;
    case 'wsGo':
      ui.ws.i = +a;
      wsRender();
      break;
    case 'wxCol':
      WX.col = +a;
      WX.sel = null;
      if (WX.step != null) {
        WX.step = 0;
        WX.play = false;
      }
      wsRender();
      break;
    case 'wxMode':
      wxMode(a);
      break;
    case 'wxStep':
      WX.play = false;
      wxStepGo(WX.step + +a);
      break;
    case 'wxPlay':
      WX.play = !WX.play;
      if (WX.play) wxStepGo(WX.step >= ((WX.r && WX.r.steps) || []).length - 1 ? 0 : WX.step + (WX.ap >= 1 ? 1 : 0));
      else {
        clearTimeout(WX.playT);
        wxStepUI();
      }
      break;
    case 'wxDims':
      WX.dims = !WX.dims;
      e.target.closest('button').classList.toggle('on', WX.dims);
      wxApplyT();
      wxDraw();
      break;
    case 'wxLabs':
      WX.labels = !WX.labels;
      e.target.closest('button').classList.toggle('on', WX.labels);
      wxDraw();
      break;
    case 'wxHw':
      WX.hw = !WX.hw;
      wxSave();
      e.target.closest('button').classList.toggle('on', WX.hw);
      wxApplyT();
      wxDraw();
      break;
    case 'wxMarks':
      WX.marks = !WX.marks;
      wxSave();
      e.target.closest('button').classList.toggle('on', WX.marks);
      wxApplyT();
      wxDraw();
      break;
    case 'wxSee':
      WX.see = !WX.see;
      wxSave();
      e.target.closest('button').classList.toggle('on', WX.see);
      e.target.closest('button').setAttribute('aria-pressed', String(WX.see));
      wxDraw();
      break;
    case 'wxReset':
      if (WX.r && WX.r.home) {
        Object.assign(WX.r.ctl, WX.r.home);
        WX.r.zoomed = 0;
        wxDraw();
      }
      break;
    case 'wxSel':
      wxSelect(WX.sel && WX.sel.tag === a ? null : a || null);
      break;
    case 'wsDone':
      wsDone();
      break;
    case 'lblPdf':
      toast('Making the labels…');
      exportLabels();
      break;
    case 'tplPdf':
      toast('Making the templates…');
      exportTemplates();
      break;
    case 'dxfZip':
      exportDXF();
      break;
    case 'msAddShop':
      msAddShop();
      break;
    case 'msAddOff':
      msAddOff();
      break;
    case 'msAddFor': {
      const [mt, fin, t, sheet] = a.split('|');
      msAddOff({ mt, fin, t, sheet });
      break;
    }
    case 'msDelShop': {
      const b = e.target.closest('button');
      if (!b.dataset.armed) {
        b.dataset.armed = '1';
        b.textContent = 'Sure?';
        setTimeout(() => {
          if (b.isConnected) {
            delete b.dataset.armed;
            b.textContent = '×';
          }
        }, 3000);
        break;
      }
      MS.shops = MS.shops.filter(x => x.id !== a);
      MS.offers = MS.offers.filter(x => x.shop !== a);
      if (S.opts.msShop === a) S.opts.msShop = '';
      msSave();
      break;
    }
    case 'msDelOff':
      MS.offers = MS.offers.filter(x => x.id !== a);
      msSave();
      break;
    case 'msPickShop':
      S.opts.msShop = a || '';
      saveSoon();
      msSave();
      break;
    case 'msSheet': {
      const [mt, sheet] = a.split('|');
      Object.values(S.mat).forEach(m => {
        if (m.type === mt) m.sheet = sheet;
      });
      changed(true);
      toast(`Sheet size set to ${sheet.replace('x', ' × ')} for that board`);
      break;
    }
    case 'mdPdf':
      mdExportPDF();
      break;
    case 'pjStart':
      openState.walls = true;
      pjStart();
      break;
    case 'pjAdd':
      pjAdd();
      break;
    case 'pjOpen':
      pjOpen(+a);
      break;
    case 'pjDel': {
      const b_ = e.target.closest('button');
      if (b_ && !b_.dataset.armed) {
        b_.dataset.armed = '1';
        b_.textContent = 'Sure?';
        break;
      }
      pjDel(+a);
      break;
    }
    case 'pjMode': {
      const [k, m] = a.split(':');
      S.proj.modes[+k] = m;
      pjSync();
      changed(true);
      break;
    }
    case 'pjSq': {
      const [k, v] = a.split(':');
      (S.proj.square = S.proj.square || [])[+k] = v;
      pjSync();
      changed(true);
      break;
    }
    case 'pjAng': {
      const [k, v] = a.split(':');
      (S.proj.angles = S.proj.angles || [])[+k] = +v;
      pjSync();
      changed(true);
      break;
    }
    case 'pjTotal': {
      const el = document.getElementById('pjTot');
      if (el) el.innerHTML = '<p class="hintp">Adding up…</p>';
      setTimeout(pjTotal, 30);
      break;
    }
    case 'offDel':
      offDel(a).then(() => {
        groupsCache = null;
        renderCut();
      });
      break;
    case 'offKeep': {
      const n_ = nestAll(groupsCache || groupPanels(bgeo())),
        items = n_.flatMap(offLeft);
      ui.offOpen = true;
      offAdd(items).then(() => {
        toast(items.length + ' offcuts kept');
        renderCut();
      });
      break;
    }
    case 'offAdd': {
      const L = +document.getElementById('offL').value,
        W = +document.getElementById('offW').value,
        [mt, fin, t] = document.getElementById('offM').value.split('|');
      if (!(L >= 50 && W >= 50)) {
        toast('Type the length and width first');
        break;
      }
      ui.offOpen = true;
      offAdd([{ mt, fin, t: +t, L: Math.max(L, W), W: Math.min(L, W), from: 'added by hand' }]).then(() => renderCut());
      break;
    }
    case 'buyTap':
      buyTap(a);
      break;
    case 'buyAll':
      buyAll(a);
      break;
    case 'ocAnyway': {
      const shop = ui.ocPending;
      if (!shop) break;
      ui.shopMail = shop;
      exportShop(shop);
      ui.ocPending = null;
      dirty.cut = true;
      renderCut();
      break;
    }
    case 'shopX':
      if (!ocBeforeShop(a)) break;
      ui.ocPending = null;
      ui.shopMail = a;
      exportShop(a);
      dirty.cut = true;
      renderCut();
      break;
    case 'shopMailCopy': {
      const t = shopMail(ui.shopMail);
      try {
        navigator.clipboard.writeText(t).then(
          () => toast('Text copied'),
          () => toast('Select the text and copy it')
        );
      } catch (e) {
        toast('Select the text and copy it');
      }
      break;
    }
    case 'priceUpd':
      priceUpd();
      break;
    case 'saverS':
      sheetSaver();
      renderSheets();
      break;
    case 'saverUse':
      S.room.D = +a;
      ui.saver = null;
      changed(true);
      toast(`Cabinet depth is now ${a} mm`);
      break;
    case 'stkAll':
      setStockAll(a === '1');
      changed(true);
      toast(
        a === '1'
          ? 'Melamine parts now come from 250 cm furniture panels where they fit'
          : 'Melamine parts now come from full sheets'
      );
      break;
    case 'toPrice': {
      const t = document.getElementById('price');
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
    case 'lockFin':
      S.opts.lockFin = !S.opts.lockFin;
      changed(true);
      toast(
        S.opts.lockFin
          ? 'Main colours locked — shuffles and styles keep your fronts, carcass, closing strips, desk top and handles'
          : 'Main colours unlocked'
      );
      break;
    case 'styleAgain':
      if (ui.style && STYLES[ui.style]) styleNow(ui.style);
      break;
    case 'styleSel':
      break;
    case 'toonsT':
      S.opts.noToons = !b.checked;
      changed(false);
      renderTab('guide');
      break;
    case 'shufFold':
      ui.shufOpen = !shufOpen();
      try {
        localStorage.setItem('kast-shufopen', ui.shufOpen ? '1' : '0');
      } catch (e) {
        oops('events #4', e, 1);
      }
      renderSide();
      break;
    case 'mustT':
      ui.mustOpen = !ui.mustOpen;
      renderSide();
      break;
    case 'neverT':
      ui.neverOpen = !ui.neverOpen;
      renderSide();
      break;
    case 'neverTog': {
      const nv = Array.isArray(S.opts.never) ? S.opts.never.slice() : [],
        j = nv.indexOf(a);
      if (j >= 0) nv.splice(j, 1);
      else {
        nv.push(a);
        if ((S.opts.must || []).some(m => m.type === a)) {
          S.opts.must = S.opts.must.filter(m => m.type !== a);
          S.sections.forEach(sc => {
            if (sc.must === a) delete sc.must;
          });
        }
      }
      S.opts.never = nv;
      changed(true);
      break;
    }
    case 'mustAdd':
      ui.mustOpen = true;
      {
        if (Array.isArray(S.opts.never)) S.opts.never = S.opts.never.filter(k => k !== a);
        (S.opts.must = Array.isArray(S.opts.must) ? S.opts.must : []).push({
          type: a,
          pos: a === 'tv' ? 'centre' : 'any',
          w: null
        });
        openMx.add('must');
        changed(true);
        break;
      }
    case 'mustDel': {
      const m_ = (S.opts.must || []).splice(+a, 1)[0];
      if (m_ && !(S.opts.must || []).some(x => x.type === m_.type))
        S.sections.forEach(sc => {
          if (sc.must === m_.type) delete sc.must;
        });
      changed(true);
      break;
    }
    case 'copyZones':
      ui.clip = {
        zones: JSON.parse(JSON.stringify(secs[ui.sel].zones)),
        back: secs[ui.sel].back,
        from: ui.sel,
        base: secs[ui.sel].base
      };
      toast(`Copied the layout of column ${ui.sel + 1}. Open another column and tap “Paste layout”.`);
      renderSide();
      break;
    case 'pasteZones':
      if (ui.clip) {
        const t_ = secs[ui.sel];
        t_.zones = JSON.parse(JSON.stringify(ui.clip.zones)).map(z => Object.assign(z, { id: uid() }));
        if (ui.clip.back) t_.back = ui.clip.back;
        t_.link = null;
        ui.zsel = null;
        changed(true);
        toast(`Pasted onto column ${ui.sel + 1}.`);
      }
      break;
    case 'unlink':
      secs[ui.sel].link = null;
      changed(true);
      break;
    case 'batchSave': {
      const ps = partSet();
      if (!ps) break;
      const bs = (S.opts.batches = S.opts.batches || []);
      bs.push({ name: 'Batch ' + (bs.length + 1), secs: [...ps].sort((x, y) => x - y), cut: false, built: false });
      changed(true);
      break;
    }
    case 'batchUse': {
      const bt = (S.opts.batches || [])[+a];
      if (bt) {
        S.opts.part = Object.assign(S.opts.part || {}, { on: '1', secs: bt.secs.slice() });
        changed(true);
      }
      break;
    }
    case 'batchTick': {
      const [bi, k_] = a.split('|');
      const bt = (S.opts.batches || [])[+bi];
      if (bt) {
        bt[k_] = !bt[k_];
        changed(true);
      }
      break;
    }
    case 'batchDel':
      (S.opts.batches || []).splice(+a, 1);
      changed(true);
      break;
    case 'partSec': {
      const p = (S.opts.part = S.opts.part || { on: '1' });
      const a_ = new Set(p.secs || []),
        i_ = +a;
      a_.has(i_) ? a_.delete(i_) : a_.add(i_);
      p.secs = [...a_].sort((x, y) => x - y);
      changed(true);
      break;
    }
    case 'partAll':
      S.opts.part = Object.assign(S.opts.part || {}, { on: '1', secs: geo.secs.filter(q => !q.panel).map(q => q.i) });
      changed(true);
      break;
    case 'partNone':
      S.opts.part = Object.assign(S.opts.part || {}, { secs: [] });
      changed(true);
      break;
    case 'partShared':
      S.opts.part = Object.assign(S.opts.part || {}, { shared: !!b.checked });
      changed(true);
      break;
    case 'notesClose':
      ui.notesOpen = false;
      ui.mnotes = false;
      renderBar();
      break;
    case 'mnotes':
      ui.mnotes = !ui.mnotes;
      renderBar();
      break;
    case 'expMode':
      EXP = !EXP;
      try {
        localStorage.setItem('fitted-exp', EXP ? '1' : '0');
      } catch (er) {
        oops('events #exp', er, 1);
      }
      if (EXP && S.proj) {
        try {
          pjSync();
        } catch (er) {
          oops('events #exp2', er);
        }
      }
      geo = build(S);
      groupsCache = null;
      renderSide();
      renderViews();
      toast(
        EXP
          ? 'Experimental on: more walls and corner cabinets under “Walls in this room”'
          : 'Experimental off: one wall at a time'
      );
      break;
    case 'viewMode':
      ui.simple = a !== 'x';
      try {
        localStorage.setItem(VIEW_KEY, ui.simple ? 's' : 'x');
      } catch (er) {
        oops('events #5', er, 1);
      }
      renderSide();
      toast(ui.simple ? 'Simple view — the rest is under “More options”' : 'Expert view — every setting is shown');
      break;
    case 'ztbClose':
      ui.zsel = null;
      renderSide();
      dirty.elev = true;
      if (ui.tab === 'elev') renderTab('elev');
      try {
        applyFronts3D();
      } catch (er) {
        oops('events #6', er);
      }
      break;
    case 'ztbMore': {
      if (ui.pane && ui.pane !== 'layout') {
        ui.pane = 'layout';
      }
      (ui.moreOpen = ui.moreOpen || {})['z' + ui.sel + ':' + ui.zsel] = true;
      renderSide();
      if (isSheet()) {
        try {
          openSheetAt();
        } catch (er) {
          oops('events #7', er);
        }
      }
      const zb = document.querySelector('#side .zbody');
      if (zb) zb.scrollIntoView({ block: 'center' });
      break;
    }
    case 'fixW': {
      const w = [...new Set(geo.warns)][+a];
      if (w == null) break;
      const r = fixOne(w);
      if (r) {
        changed(true);
        toast(
          geo.warns.includes(w)
            ? 'Changed, but the note is still there — it needs your own choice'
            : 'Fixed. Undo brings it back.'
        );
      } else toast('Fitted cannot fix this one by itself — the note says what to change');
      break;
    }
    case 'fixAll': {
      const n0 = [...new Set(geo.warns)].length;
      let guard = 0,
        ch = false;
      while (guard++ < 8) {
        const ws = [...new Set(geo.warns)];
        let did = false;
        for (const w of ws) {
          if (fixOne(w)) {
            did = ch = true;
            geo = build(S);
            break;
          }
        }
        if (!did) break;
      }
      changed(true);
      const n1 = [...new Set(geo.warns)].length;
      toast(
        n1 < n0
          ? `Fixed ${n0 - n1} of ${n0} design notes${n1 ? ` — ${n1} need${n1 === 1 ? 's' : ''} your own choice` : ''}. Undo brings them back.`
          : 'Nothing Fitted can fix by itself here — the notes say what to change'
      );
      break;
    }
    case 'fmCycle':
      setFm({ solid: 'glass', glass: 'off', off: 'solid' }[ui.fm] || 'solid');
      break;
    case 'pcalNew':
      photoPick();
      break;
    case 'phSlot': {
      const i = +a,
        n = phCount();
      if (i >= n) {
        if (n >= 3) break;
        phUse(n, () => {
          document.body.classList.remove('pfull');
          pcalOpen();
        });
      } else
        phUse(i, () => {
          photoSave();
          if (PH.pose) {
            setPhotoMode(true);
          } else {
            document.body.classList.remove('pfull');
            pcalOpen();
          }
        });
      break;
    }
    case 'phDel': {
      phStore();
      PHS.splice(phCur, 1);
      Object.assign(PH, phBlank(), { pose: null, H: null });
      phCur = 0;
      if (PHS[0]) {
        Object.assign(PH, PHS[0]);
        try {
          solvePhoto();
        } catch (e) {
          oops('events #8', e);
        }
        photoSave();
        setPhotoMode(!!PH.pose);
      } else {
        PH.keep = false;
        photoSave();
        setPhotoMode(false);
      }
      renderBar();
      break;
    }
    case 'phMask':
      PH.maskEdit = true;
      PH.maskCur = [];
      document.body.classList.remove('pfull');
      document.getElementById('pcal').hidden = false;
      pcalRender();
      break;
    case 'pmClose':
      if ((PH.maskCur || []).length >= 3) {
        (PH.occ = PH.occ || []).push(PH.maskCur);
        PH.maskCur = [];
        photoSave();
      }
      pcalRender();
      break;
    case 'pmUndo':
      (PH.maskCur || []).pop();
      pcalRender();
      break;
    case 'pmDel':
      (PH.occ || []).pop();
      photoSave();
      pcalRender();
      break;
    case 'pmDone':
      if ((PH.maskCur || []).length >= 3) (PH.occ = PH.occ || []).push(PH.maskCur);
      PH.maskCur = [];
      PH.maskEdit = false;
      photoSave();
      document.getElementById('pcal').hidden = true;
      setPhotoMode(true);
      break;
    case 'phLook':
      PH.look = PH.look === false;
      PH._la = null;
      photoSave();
      setPhotoMode(true);
      break;
    case 'phAuto':
      photoAuto();
      setPhotoMode(true);
      break;
    case 'phKeep':
      PH.keep = true;
      PH.adjust = false;
      PH.panel = false;
      photoSave();
      setPhotoMode(true);
      toast('Photo view kept — every change you make now shows in your room. “Adjust” reopens the line-up.');
      break;
    case 'phAdjust':
      PH.adjust = true;
      setPhotoMode(true);
      break;
    case 'phPanel':
      PH.panel = !PH.panel;
      setPhotoMode(true);
      break;
    case 'phLight':
      PH.light = PH.light === false;
      photoSave();
      setPhotoMode(true);
      break;
    case 'phEdgesReset':
      PH.edges = {};
      PH.manual = {};
      PH.autoN = 0;
      PH.fAuto = 0;
      solvePhoto();
      photoSave();
      setPhotoMode(true);
      break;
    case 'pcalZoomOk':
      PH.zoom = null;
      pcalRender();
      break;
    case 'pcalNudge': {
      const z = PH.zoom,
        q = PH.pts[z];
      if (z == null || !q) break;
      const [dx, dy] = a.split('|').map(Number),
        st_ = Math.max(PH.iw, PH.ih) / 1600;
      PH.pts[z] = [Math.max(0, Math.min(PH.iw, q[0] + dx * st_)), Math.max(0, Math.min(PH.ih, q[1] + dy * st_))];
      photoSave();
      pcalRender();
      break;
    }
    case 'pcalClose':
      PH.zoom = null;
      PH.maskEdit = false;
      PH.maskCur = [];
      if (!PH.img && PHS.length) {
        phUse(0, () => {
          if (ui.photoOn) setPhotoMode(true);
        });
      }
      document.getElementById('pcal').hidden = true;
      break;
    case 'pcalSkip': {
      const R = photoRefs();
      let k = PH.cur + 1;
      while (k < R.length && PH.pts[k]) k++;
      PH.cur = k;
      pcalRender();
      break;
    }
    case 'pcalBack':
      PH.zoom = null;
      PH.cur = Math.max(0, PH.cur - 1);
      pcalRender();
      break;
    case 'pcalReset':
      if (!PH.img) break;
      PH.zoom = null;
      PH.edges = {};
      PH.manual = {};
      PH.fAuto = 0;
      PH.pts = [];
      PH.cur = 0;
      PH.pose = null;
      photoSave();
      pcalRender();
      break;
    case 'pcalDone':
      PH.zoom = null;
      if (solvePhoto()) {
        document.getElementById('pcal').hidden = true;
        if (ui.tab !== '3d') document.querySelector('[data-act="tab"][data-a="3d"]').click();
        setTimeout(() => {
          PH.adjust = true;
          PH.panel = false;
          setPhotoMode(true);
          if (!Object.keys(PH.manual || {}).length) {
            photoAuto();
            setPhotoMode(true);
          }
        }, 60);
      }
      break;
    case 'explode': {
      if (ui.photoOn) setPhotoMode(false);
      const on = !(ui.exT > 0.5);
      animExplode(on ? 1 : 0);
      ui.exOn = on;
      renderBar();
      setTimeout(() => {
        if (!ui.iso) camPreset('angle');
      }, 540);
      break;
    }
    case 'box3d': {
      ui.sel = +a;
      ui.zsel = null;
      ui.iso = true;
      ui.exOn = true;
      ui.exT = 1;
      if (ui.photoOn) setPhotoMode(false);
      document.querySelector('[data-act="tab"][data-a="3d"]').click();
      setTimeout(() => {
        applyExplode();
        isoFrame();
        renderBar();
      }, 350);
      break;
    }
    case 'iso':
      if (ui.photoOn) setPhotoMode(false);
      ui.iso = !ui.iso;
      applyExplode();
      isoFrame();
      renderBar();
      break;
    case 'isoSec':
      ui.sel = Math.max(0, Math.min(secs.length - 1, ui.sel + +a));
      ui.zsel = null;
      applyExplode();
      isoFrame();
      renderBar();
      renderSide();
      dirty.elev = true;
      break;
    case 'copyCSV':
      copy(csv());
      break;
    case 'copyText':
      copy(txt());
      break;
    case 'io':
      ioOpen('designs', dsCur() ? null : 'dsName');
      break;
    case 'ioRooms':
      ioOpen('rooms');
      break;
    case 'ioShare1':
      ioOpen('share');
      break;
    case 'ioTab':
      ui.ioTab = a || 'designs';
      renderDesigns();
      break;
    case 'newHub': {
      const mm = document.getElementById('mmenu');
      if (mm) mm.hidden = true;
      const io = document.getElementById('iom');
      if (io) io.hidden = true;
      ST.roomId = null;
      stOpen();
      break;
    }
    case 'dsMore':
      ui.dsMore = a || null;
      ui.dsRen = null;
      renderDesigns();
      break;
    case 'dsRen':
      ui.dsRen = a;
      renderDesigns();
      setTimeout(() => {
        const r = document.getElementById('dsRen');
        if (r) {
          r.focus();
          r.select();
        }
      }, 50);
      break;
    case 'dsRenOk': {
      const r = document.getElementById('dsRen');
      dsRename(a, r ? r.value : '');
      break;
    }
    case 'dsDup':
      dsDup(a);
      break;
    case 'dsFile':
      dsFile(a);
      break;
    case 'ioFile':
      ioFile();
      break;
    case 'ioCopyText':
      ioCopyText();
      break;
    case 'ioShare':
      ioShare();
      break;
    case 'ioToCut': {
      document.getElementById('iom').hidden = true;
      pnGo('files');
      break;
    }
    case 'rmSave':
      rmSave();
      break;
    case 'rmUse':
      rmUse(a);
      break;
    case 'rmNew':
      rmNew(a);
      break;
    case 'rmFile':
      rmFile(a || '');
      break;
    case 'rmDel': {
      const b = e.target.closest('button');
      if (b.dataset.armed) {
        rmDel(a);
      } else {
        b.dataset.armed = '1';
        b.textContent = 'Tap again to delete';
        setTimeout(() => {
          if (b.isConnected) {
            delete b.dataset.armed;
            b.textContent = 'Delete';
          }
        }, 3000);
      }
      break;
    }
    case 'dsSave':
      dsSave(false);
      break;
    case 'dsSaveNew':
      dsSave(true);
      break;
    case 'install': {
      if (INST.ev) {
        const ev = INST.ev;
        INST.ev = null;
        try {
          ev.prompt();
          ev.userChoice
            .then(r => {
              if (r && r.outcome === 'accepted') {
                toast('Fitted is being installed — look for it on your home screen');
                instShow(false);
              } else instShow(true);
            })
            .catch(() => {});
        } catch (er) {
          toast('Use your browser menu: Install app, or Add to Home screen');
        }
      } else
        toast(
          INST.ios
            ? 'On iPhone and iPad: tap the Share button in Safari, then “Add to Home Screen”'
            : 'Open your browser menu (⋮) and choose “Install app” or “Add to Home screen”',
          9000
        );
      break;
    }
    case 'dsOpen':
      dsOpen(a);
      break;
    case 'cmt': {
      const v = document.getElementById('v-' + (ui.tab || 'elev')) || document.getElementById('v-elev');
      document.getElementById('mmenu').hidden = true;
      cmtOpen(v);
      break;
    }
    case 'lang': {
      const ks = Object.keys(LANGS);
      setLang(ks[(ks.indexOf(LANG) + 1) % ks.length]);
      const m_ = document.getElementById('mmenu');
      if (m_) m_.hidden = true;
      break;
    }
    case 'others3D':
      ui.others3D = ui.others3D === false;
      if (T3) rebuild3D();
      renderBar();
      break;
    case 'gloss':
      glossOpen();
      break;
    case 'fbOpen':
      fbOpen(a || '');
      break;
    case 'fbKind':
      FB.kind = a;
      FB.sent = null;
      fbRender();
      break;
    case 'fbSend':
      fbSend();
      break;
    case 'stOpen':
      stOpen();
      break;
    case 'stPick':
      stPick(a);
      break;
    case 'tdOpen':
      tdOpen();
      break;
    case 'tdClose':
      document.getElementById('tdm').hidden = true;
      break;
    case 'tdPaper':
      TD.paper = a === 'A4' ? 'A4' : 'A3';
      tdRender();
      break;
    case 'tdPDF':
      tdExportPDF();
      break;
    case 'tdDXF':
      try {
        tdDXF();
      } catch (err) {
        console.error(err);
        toast('The DXF could not be made for this design');
      }
      break;
    case 'stInRoom': {
      ST.fit = true;
      if (!ST.roomId && RM.list[0]) ST.roomId = RM.list[0].id;
      stRender();
      const f = document.querySelector('#stm .stfit');
      if (f) {
        f.scrollIntoView({ block: 'center' });
        const sel = document.getElementById('stRoom');
        if (sel) sel.focus();
      }
      break;
    }
    case 'stClose':
      document.getElementById('stm').hidden = true;
      break;
    case 'stFit':
      ST.fit = !!(document.getElementById('stFit') || {}).checked;
      {
        const r = document.getElementById('stRoom');
        if (r) r.disabled = !ST.fit;
      }
      break;
    case 'cuAddFin': {
      const k = cuAddFin(cuVal('cuFName'), cuVal('cuFCol'), cuVal('cuFKind'));
      if (k) {
        ui.cuOpen = true;
        changed(true);
        toast('Colour added — pick it from any colour button, under “Your colours”');
      }
      break;
    }
    case 'cuAddMat':
      cuAddMat();
      break;
    case 'cuDel':
      cuDel(a);
      break;
    case 'cuPickAdd': {
      const k = cuAddFin(cuVal('fpCuName'), cuVal('fpCuCol'), cuVal('fpCuKind'));
      if (!k) break;
      const p = FP.p;
      document.getElementById('fpm').hidden = true;
      if (p.startsWith('wiz:')) {
        WZ[p.slice(4)] = k;
        wizRender();
      } else {
        setP(p, k);
        fitTypes(S);
        changed(true);
      }
      toast('Colour added and used. It is now under “Your colours” in every colour list.');
      break;
    }
    case 'fbClose':
      document.getElementById('fbm').hidden = true;
      break;
    case 'fbCopy': {
      const t = (FB.lastText || '') + (FB.lastTech ? '\n\n' + FB.lastTech : '');
      copy(t);
      break;
    }
    case 'fbDel': {
      const b_ = e.target.closest('button');
      if (b_ && !b_.dataset.armed) {
        b_.dataset.armed = '1';
        b_.textContent = 'Delete?';
        break;
      }
      (async () => {
        try {
          const [u, id] = a.split('|'),
            ref = DS.db.doc('feedback/' + u),
            sn = await ref.get(),
            d_ = sn && (typeof sn.data === 'function' ? sn.data() : sn),
            L = ((d_ && d_.msgs) || []).filter(m => m.id !== id);
          if (L.length) await ref.set({ msgs: L, at: Date.now() });
          else await ref.delete();
        } catch (_) {
          oops('events #9', _);
        }
        fbInbox();
      })();
      break;
    }
    case 'glossClose':
      document.getElementById('glm').hidden = true;
      break;
    case 'cmtCol':
      cmtOpen(e.target.closest('.card'));
      break;
    case 'dsRestore':
      dsRestore(a);
      break;
    case 'dsBackDel': {
      const b = e.target.closest('button');
      if (b.dataset.armed) {
        dsBackDel(a);
      } else {
        b.dataset.armed = '1';
        b.textContent = 'Tap again to remove';
        setTimeout(() => {
          if (b.isConnected) {
            delete b.dataset.armed;
            b.textContent = 'Remove';
          }
        }, 3000);
      }
      break;
    }
    case 'dsDel': {
      const b = e.target.closest('button');
      if (b.dataset.armed) {
        dsDelete(a);
      } else {
        b.dataset.armed = '1';
        b.textContent = 'Tap again to delete';
        setTimeout(() => {
          if (b.isConnected) {
            delete b.dataset.armed;
            b.textContent = 'Delete';
          }
        }, 3000);
      }
      break;
    }
    case 'ioClose':
      document.getElementById('iom').hidden = true;
      break;
    case 'ntOpen':
      ntOpen();
      break;
    case 'ntClose':
      document.getElementById('ntm').hidden = true;
      break;
    case 'ntAdd':
      ntAdd();
      break;
    case 'ntToDesigns': {
      document.getElementById('ntm').hidden = true;
      ioOpen('designs', 'dsName');
      break;
    }
    case 'ntSaveNow':
      dsSave(false).then(() => ntRender());
      break;
    case 'ntDelete': {
      const b = e.target.closest('button');
      if (!b.dataset.armed) {
        b.dataset.armed = '1';
        b.textContent = 'Tap again to delete';
        setTimeout(() => {
          if (b.isConnected) {
            delete b.dataset.armed;
            b.textContent = 'Delete';
          }
        }, 3000);
        break;
      }
      const L = ntList(),
        j = L.findIndex(n => n.id === a);
      if (j < 0) break;
      const n = L.splice(j, 1)[0];
      if (n.pid) {
        ntDel(n.pid);
        delete NT_CACHE[n.pid];
      }
      ntChanged();
      toast('Note deleted');
      break;
    }
    case 'ntView': {
      const n = ntList().find(x => x.id === a);
      if (!n) break;
      const v = document.getElementById('ntView'),
        im = document.getElementById('ntViewImg');
      im.src = NT_CACHE[n.pid] || n.thumb || '';
      v.hidden = false;
      if (!NT_CACHE[n.pid] && n.pid)
        ntGet(n.pid).then(src => {
          if (src) {
            NT_CACHE[n.pid] = src;
            im.src = src;
          } else toast('Only the small preview is on this device — the full photo was saved somewhere else');
        });
      break;
    }
    case 'ntViewClose':
      document.getElementById('ntView').hidden = true;
      break;
    case 'aiOpen':
      aiOpen();
      break;
    case 'aiClose':
      document.getElementById('aim').hidden = true;
      break;
    case 'aiPick':
      AI.cur = +a;
      aiShow();
      break;
    case 'aiQ': {
      const [k, v] = a.split(':');
      aiQ(k, v);
      break;
    }
    case 'aiSave':
      aiSave();
      break;
    case 'aiCopy':
      aiCopy(
        document.getElementById('aiText').value,
        'Instruction copied — paste it next to the picture in your picture AI'
      );
      break;
    case 'aiCopyNote': {
      const n = document.getElementById('aiNote').value.trim();
      if (!n) {
        toast('Type the small change first');
        break;
      }
      aiCopy(
        'Keep everything else exactly the same — same camera angle, same cabinet layout, same room. Change only this: ' +
          n +
          '.',
        'Change copied — paste it as your next message'
      );
      break;
    }
    case 'ioCopy':
      copy(document.getElementById('ioText').value);
      break;
    case 'ioLoad': {
      const t = (document.getElementById('ioText') || {}).value || '';
      if (!t.trim()) {
        toast('Paste the text first');
        break;
      }
      ioImport(t);
      break;
    }
    case 'ioReset': {
      const kept = dsKeep();
      dsDetach(true);
      S = exampleState();
      ui.sel = 0;
      document.getElementById('iom').hidden = true;
      changed(true);
      ui.savedSig = dsSig();
      saveSoon();
      toast('Example loaded' + (kept ? '. Your unsaved work was kept under Designs → Recovered work.' : ''));
      break;
    }
    case 'setv': {
      const [pth, val, t] = a.split('|');
      {
        // a level's shelf spacing applies to all its compartments: clear their own spacing
        const ms = /^(sections\.\d+\.zones\.\d+)\.space$/.exec(pth),
          zz = ms ? getP(ms[1]) : null;
        if (zz && Array.isArray(zz.vsp) && zz.vsp.some(Boolean)) {
          zz.vsp = [];
          setTimeout(() => toast('Every compartment of this level now uses this spacing'), 30);
        }
      }
      {
        const mz = /^(sections\.\d+\.zones\.\d+)\.type$/.exec(pth);
        if (mz && val === 'opening') {
          const z0 = getP(mz[1]);
          if (z0 && z0.type !== 'opening' && !z0.look) z0.look = 'nook';
        }
      }
      setP(pth, t === 'x' ? null : t === 'n' ? +val : val);
      if (/^opts\.must\.\d+\.pos$/.test(pth)) {
        geo = build(S);
        if (mustOff()) {
          randomize('layout');
          break;
        }
      }
      if (/^opts\.must\.\d+\.w(Min|Max)$/.test(pth)) {
        const mm = getP(pth.replace(/\.w(Min|Max)$/, ''));
        if (mm) mm.w = null;
      }
      if (pth === 'opts.screen.pos' && val !== 'x' && S.opts.screen) S.opts.screen.x = null;
      if (pth === 'opts.screen.w' && S.opts.screen) S.opts.screen.diag = null;
      if (pth.endsWith('.ownMode')) {
        const sx = getP(pth.slice(0, -8));
        if (sx && val === 'own') {
          if (!(+sx.ownH > 0)) {
            const qi = geo.secs[+pth.split('.')[1]],
              lo = qi ? Math.min(geo.ceilAt(qi.lx), geo.ceilAt(qi.rx)) : +S.room.H || 2500;
            sx.ownH = Math.max(600, Math.round(Math.min(2000, lo - 250) / 10) * 10);
          }
          (sx.zones || []).forEach((z, j, arr) => {
            if (j < arr.length - 1 && +z.h > 0) z.h = null;
          });
        }
      }
      if (pth.endsWith('.look') && val === 'dj') {
        const zz = getP(pth.slice(0, -5));
        if (zz.led == null) zz.led = true;
      }
      if (pth.endsWith('.base') && val === 'door') {
        const sc = getP(pth.slice(0, -5));
        sc.zones = [Z('passage', { h: 2050 }), Z('closed', { shelves: 1 })];
        if (!(+sc.w > 0)) sc.w = 900;
        sc.back = 'split';
      }
      if (pth.endsWith('.base') && val !== 'door') {
        const sc = getP(pth.slice(0, -5));
        if (sc.zones && sc.zones[0] && sc.zones[0].type === 'passage') {
          sc.zones.shift();
          if (!sc.zones.length) sc.zones.push(Z('closed', { shelves: 2 }));
        }
      }
      if (pth.endsWith('.base') && val === 'desk') {
        const i = +pth.split('.')[1],
          sc = S.sections[i];
        if (sc.zones && sc.zones[0] && sc.zones.length > 1 && +sc.zones[0].h > 0 && +sc.zones[0].h < 560)
          sc.zones[0].h = 600;
        if (sc.zones && sc.zones.length < 2)
          sc.zones = [Z('open', { h: 600, shelves: 0 }), Z('closed', { shelves: 1 })];
        const q = geo.secs[i];
        if (q && q.w < 1000) {
          const nb =
            S.sections[i + 1] && !['panel', 'door', 'desk'].includes(S.sections[i + 1].base)
              ? i + 1
              : S.sections[i - 1] && !['panel', 'door', 'desk'].includes(S.sections[i - 1].base)
                ? i - 1
                : -1;
          if (nb >= 0) {
            const per = geo.boxes ? 2 * geo.tc : geo.tc,
              w = q.w + geo.secs[nb].w + per;
            S.sections.splice(nb, 1);
            const k = nb < i ? i - 1 : i;
            S.sections[k].w = Math.round(w);
            ui.sel = k;
            S.opts.cols = 0;
            setTimeout(() => toast(`The desk takes two columns: ${Math.round(w)} mm`), 50);
          }
        }
      }
      if (pth.endsWith('.base') && val === 'free') {
        const sc = getP(pth.slice(0, -5));
        if (!(+sc.freeH > 0)) sc.freeH = 900;
        sc.mount = sc.mount || 'legs';
      }
      if (pth.endsWith('.base') && val === 'panel') {
        const sc = getP(pth.slice(0, -5));
        if (!sc.panel) sc.panel = { ...PANEL_DEF };
      }
      if (pth.endsWith('.type')) ui.zsel = +pth.split('.')[3];
      if (pth === 'opts.wmode') {
        randomize('layout');
        break;
      }
      changed(true);
      break;
    }
    case 'step': {
      const [pth, d, mn, mx] = a.split('|');
      setP(pth, Math.max(+mn, Math.min(+mx, (+getP(pth) || 0) + +d)));
      changed(true);
      break;
    }
    case 'zsel':
      if (isSheet()) {
        ui.zsel = +a;
        ui.flow = 'zone';
        renderSide();
        document.getElementById('side').scrollTop = 0;
        openSheetAt();
        dirty.elev = true;
        if (ui.tab === 'elev') renderTab('elev');
        applyFronts3D();
        break;
      }
      ui.zsel = ui.zsel === +a ? null : +a;
      renderSide();
      dirty.elev = true;
      if (ui.tab === 'elev') renderTab('elev');
      applyFronts3D();
      break;
    case 'addZoneT': {
      const zs = secs[ui.sel].zones;
      if (secs[ui.sel].base === 'panel') break;
      const prevTop = zs[zs.length - 1];
      if (prevTop && !(+prevTop.h > 0))
        prevTop.h = geo.secs[ui.sel]
          ? Math.round(Math.max(300, geo.secs[ui.sel].zones[zs.length - 1].h * 0.6) / 10) * 10
          : 400;
      zs.push(Z(a, { shelves: a === 'open' || a === 'closed' ? 2 : 0 }));
      if (a === 'opening') zs[zs.length - 1].look = 'nook';
      ui.zsel = zs.length - 1;
      changed(true);
      break;
    }
    case 'applyPreset': {
      const k = document.getElementById('secPreset').value,
        p = PRESETS[k].make();
      secs[ui.sel].zones = p.zones;
      secs[ui.sel].base = p.base;
      ui.zsel = null;
      changed(true);
      break;
    }
    case 'rand':
      randomize(a);
      break;
    case 'style':
      styleNow(a);
      break;
    case 'pdf':
      pdfDialog();
      {
        const mm = document.getElementById('mmenu');
        if (mm) mm.hidden = true;
      }
      break;
    case 'pdfPre':
      if (!ui.pdfBusy) {
        ui.pdfSec = Object.assign({}, PDF_PRE[a][1]);
        pdfDialog();
      }
      break;
    case 'pdfClose':
      if (ui.pdfBusy) {
        ui.pdfCancel = true;
      } else {
        const m = document.getElementById('pdfm');
        if (m) m.hidden = true;
      }
      break;
    case 'pdfGo':
      if (!ui.pdfBusy) {
        ui.pdfBusy = true;
        const t0 = performance.now();
        exportPdf()
          .then(() => {
            const st = document.getElementById('pdfst');
            if (st) st.textContent = `Done in ${((performance.now() - t0) / 1000).toFixed(1)} s.`;
          })
          .catch(e => {
            const st = document.getElementById('pdfst');
            if (st)
              st.textContent = e && e.message === 'cancelled' ? 'Stopped.' : 'Something went wrong making the PDF.';
            if (!(e && e.message === 'cancelled')) console.error(e);
          })
          .finally(() => {
            ui.pdfBusy = false;
            const b = document.getElementById('pdfbar'),
              g = document.getElementById('pdfgo');
            if (b) b.hidden = true;
            if (g) {
              g.disabled = false;
              g.textContent = 'Download';
            }
            const c_ = document.getElementById('pdfcl');
            if (c_) c_.textContent = 'Close';
          });
      }
      break;
    case 'stkOn': {
      S.opts.stock = Object.assign(
        { ws: STOCK_W.slice(), L: 2500, roles: { carcass: true, shelf: true, skirt: true, desk: true } },
        S.opts.stock || {},
        { on: !!b.checked }
      );
      changed(true);
      if (b.checked) toast('Pre-edged boards on — see the Cut list and Sheets');
      break;
    }
    case 'stkBuy': {
      const [k_, v_] = a.split('|');
      const o = (S.opts.stock = Object.assign({ ws: STOCK_W.slice(), L: 2500 }, S.opts.stock || {}));
      o.roles = Object.assign(
        { carcass: false, shelf: false, skirt: false, desk: false, front: false },
        o.on ? o.roles : {}
      );
      o.roles[k_] = v_ === '1';
      o.on = Object.values(o.roles).some(Boolean);
      changed(true);
      if (v_ === '1') toast('Furniture panels (meubelpanelen) on for this part — see the Cut list and Sheets');
      break;
    }
    case 'stkW': {
      const o = S.opts.stock;
      const w = +a;
      o.ws = (o.ws || STOCK_W.slice()).map(Number);
      o.ws = o.ws.includes(w) ? o.ws.filter(x => x !== w) : [...o.ws, w].sort((x, y) => x - y);
      if (!o.ws.length) o.ws = [w];
      changed(true);
      break;
    }
    case 'stkR': {
      const o = S.opts.stock;
      o.roles = Object.assign({}, o.roles || {});
      o.roles[a] = !o.roles[a];
      changed(true);
      break;
    }
    case 'cols': {
      const cur = +S.opts.cols || 0,
        nCab = S.sections.filter(sc => sc.base !== 'panel' && sc.base !== 'door').length;
      let N = cur ? cur + +a : +a > 0 ? nCab : 0;
      const span = geo.secs.filter(q => !q.panel && !q.door).reduce((t, q) => t + q.w, 0);
      if (N > 0 && span / N < 300) {
        toast('Columns would get narrower than 300 mm');
        break;
      }
      if (N <= 0) {
        S.opts.cols = 0;
        toast('Columns: free widths again');
        changed(true);
        break;
      }
      {
        const key = ui.style && STYLES[ui.style] ? ui.style : 'scandi';
        let st = applyColumns(S, N);
        st.opts.cols = N;
        let best = null,
          bs = Infinity;
        const sd = Date.now() % 100000;
        for (let k = 0; k < 6; k++) {
          const t = applyStyle(st, key, sd + k * 53, { keepFinish: true });
          const w = build(t).warns.length;
          if (w < bs) {
            bs = w;
            best = t;
          }
          if (!w) break;
        }
        S = best;
      }
      ui.sel = Math.min(ui.sel, S.sections.length - 1);
      ui.zsel = null;
      changed(true);
      toast(`${N} equal columns${S.sections.some(sc => sc.base === 'desk' && sc.w) ? ' — the desk spans two' : ''}`);
      break;
    }
    case 'deskSpan': {
      const i = ui.sel,
        sc = S.sections[i],
        nb =
          S.sections[i + 1] && !['panel', 'door'].includes(S.sections[i + 1].base)
            ? i + 1
            : S.sections[i - 1] && !['panel', 'door'].includes(S.sections[i - 1].base)
              ? i - 1
              : -1;
      if (nb < 0) {
        toast('No neighbouring column to join');
        break;
      }
      const per = geo.boxes ? 2 * geo.tc : geo.tc,
        w = geo.secs[i].w + geo.secs[nb].w + per;
      S.sections.splice(nb, 1);
      const k = nb < i ? i - 1 : i;
      S.sections[k].w = Math.round(w);
      ui.sel = k;
      S.opts.cols = 0;
      changed(true);
      toast(`Desk now ${Math.round(w)} mm wide`);
      break;
    }
    case 'undo':
      undoRedo(-1);
      break;
    case 'redo':
      undoRedo(1);
      break;
    case 'props':
      ui.props = !ui.props;
      dirty.elev = true;
      if (T3 && T3.propG) {
        applyExplode();
      }
      renderBar();
      if (ui.tab === 'elev') renderTab('elev');
      break;
    case 'wizSetS': {
      const [k, v] = a.split(':');
      WZ[k] = v;
      wizRender();
      break;
    }
    case 'wizAcc': {
      const o = (WZ.acc[a] = WZ.acc[a] || { w: 800, h: 2000 });
      o.on = !o.on;
      wizRender();
      break;
    }
    case 'wizAccTurn':
      WZ.acc.stairs.turn = a;
      wizRender();
      break;
    case 'wizSurprise': {
      const ks = Object.keys(STYLES).filter(k => k !== WZ.style);
      WZ.style = ks[Math.floor(Math.random() * ks.length)];
      wizRender();
      const b_ = document.querySelector('#wizBody .sty.on');
      if (b_) {
        b_.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        b_.classList.add('pop');
      }
      break;
    }
    case 'pickFin': {
      const ix = a.indexOf('|');
      openFinPicker(a.slice(0, ix), a.slice(ix + 1));
      break;
    }
    case 'finPicked': {
      const p = FP.p;
      document.getElementById('fpm').hidden = true;
      if (p.startsWith('wiz:')) {
        WZ[p.slice(4)] = a;
        wizRender();
      } else {
        setP(p, a);
        changed(true);
      }
      break;
    }
    case 'fpClose':
      document.getElementById('fpm').hidden = true;
      break;
    case 'loftAll':
      ui.loftAll = a === '1';
      dirty.loft = true;
      renderTab('loft');
      break;
    case 'bigView':
      ui.big = !ui.big;
      document.querySelector('.app').classList.toggle('big', ui.big);
      {
        const f = document.getElementById('bigfab');
        if (f) {
          f.textContent = ui.big ? '⤡' : '⤢';
          f.setAttribute('aria-label', ui.big ? 'Smaller drawing' : 'Bigger drawing');
        }
      }
      renderBar();
      if (T3) T3.req();
      break;
    case 'pegN': {
      const pa = a.split('|'),
        sc = S.sections[+pa[0]];
      if (!sc || sc.base !== 'panel') break;
      sc.panel = Object.assign({}, PANEL_DEF, sc.panel || {});
      sc.panel[pa[1]] = Math.max(0, Math.min(+pa[3], (+sc.panel[pa[1]] || 0) + +pa[2]));
      changed(true);
      break;
    }
    case 'railSh': {
      const pa = a.split('|'),
        si = +pa[0],
        zk = +pa[1],
        z = (S.sections[si] || { zones: [] }).zones[zk],
        zr = geo.secs[si] && geo.secs[si].zones[zk];
      if (!z || !zr) break;
      let up = z.railUp != null ? +z.railUp : zr.na || 0,
        dn = z.railDn != null ? +z.railDn : zr.nb || 0;
      const u0 = up,
        d0 = dn;
      if (pa[2] === 'up') up = Math.max(0, Math.min(4, up + +pa[3]));
      else dn = Math.max(0, Math.min(6, dn + +pa[3]));
      z.railUp = up;
      z.railDn = dn;
      {
        const g2 = build(S),
          z2 = g2.secs[si] && g2.secs[si].zones[zk];
        if (z2 && ((z2.na || 0) < up || (z2.nb || 0) < dn)) {
          z.railUp = z2.na || 0;
          z.railDn = z2.nb || 0;
          toast(
            pa[2] === 'up'
              ? 'No room for another shelf above the rail — lower the rail first'
              : 'No room for another shelf under the clothes — raise the rail first'
          );
        }
      }
      z.shelves = (+z.railUp || 0) + (+z.railDn || 0);
      changed(true);
      break;
    }
    case 'railPick': {
      const pa = a.split('|').map(Number),
        z = (S.sections[pa[0]] || { zones: [] }).zones[pa[1]],
        zr = geo.secs[pa[0]] && geo.secs[pa[0]].zones[pa[1]];
      if (!z || !zr) break;
      const n = (zr.comps || []).length,
        cur = Array.from({ length: n }, (_, j) => (zr.railIdx || []).includes(j));
      cur[pa[2]] = !cur[pa[2]];
      if (!cur.some(Boolean)) {
        toast('One compartment keeps the rail — tap another compartment first to move it');
        break;
      }
      z.railCs = cur.map(v => (v ? 1 : null));
      changed(true);
      break;
    }
    case 'stagAlt': {
      const pa = a.split('|').map(Number),
        z = (S.sections[pa[0]] || { zones: [] }).zones[pa[1]],
        zr = geo.secs[pa[0]] && geo.secs[pa[0]].zones[pa[1]];
      if (!z || !zr) break;
      const n = (zr.comps || []).length,
        any = (z.vst || []).slice(0, n).some(Boolean);
      z.vst = Array.from({ length: n }, (_, j) => (!any && j % 2 ? 1 : null));
      changed(true);
      break;
    }
    case 'railStep': {
      const [si, zk, d] = a.split('|').map(Number);
      const zr = geo.secs[si] && geo.secs[si].zones[zk];
      if (!zr || !zr.railY) break;
      S.sections[si].zones[zk].railH = Math.round((zr.railY + d) / 10) * 10;
      changed(true);
      break;
    }
    case 'pane':
      ui.pane = a;
      renderSide();
      document.getElementById('side').scrollTop = 0;
      if (isSheet()) {
        openSheetAt();
      } else if (innerWidth <= 860) {
        const sd = document.getElementById('side'),
          st = document.querySelector('.stage').offsetHeight,
          y = sd.getBoundingClientRect().top + scrollY - st;
        if (scrollY > y) scrollTo({ top: y });
      }
      break;
    case 'seeClear':
      if (ui.see && ui.see.size) {
        ui.see.clear();
        applyFronts3D();
        renderBar();
      } else toast('Tap any door, panel or shelf in the 3D view to see through it. Tap it again to make it solid.');
      break;
    case 'peek':
      ui.peek = !ui.peek;
      dirty.elev = true;
      renderBar();
      if (ui.tab === 'elev') renderTab('elev');
      applyFronts3D();
      break;
    case 'splitN':
    case 'splitShift': {
      const pa = a.split('|'),
        si = +pa[0],
        zk = +pa[1],
        z = (S.sections[si] || { zones: [] }).zones[zk],
        q = geo.secs[si];
      if (!q || !z) break;
      const w = q.w,
        tc = geo.tc,
        lb = (q.zones[zk] && q.zones[zk].lined) || 0;
      if (z.type === 'drawers') {
        if (act === 'splitN') {
          z.split = Math.max(1, +pa[2] || 1);
          changed(true);
        }
        break;
      }
      if (!Array.isArray(z.vd)) z.vd = [];
      if (!Array.isArray(z.vsh)) z.vsh = [];
      const sh0 = z.vdMode === 'shift',
        k0 = sh0 ? z.vd.length : z.vd.length + 1;
      let kk = act === 'splitN' ? Math.max(1, Math.min(6, +pa[2] || 1)) : k0,
        sh = act === 'splitShift' ? !sh0 : sh0;
      if (kk < 2) sh = false;
      const n = sh ? kk : kk - 1;
      if (n > 0 && (sh ? (w - n * tc) / (2 * kk) < 80 : (w - n * tc) / (n + 1) < 100)) {
        toast(
          sh
            ? 'Not enough width here to shift — the end parts would get too narrow'
            : 'Not enough width here to split in ' + kk
        );
        break;
      }
      z.vdMode = n ? (sh ? 'shift' : 'even') : null;
      z.vd = n ? vdPos(n, z.vdMode, w, tc, lb).map(v => Math.round(v)) : [];
      const base = +z.shelves || 0;
      z.vsh = Array.from({ length: n + 1 }, (_, j) => z.vsh[j] ?? base);
      if (n && z.type === 'closed' && z.doorMode !== 'slide') z.doors = 0;
      changed(true);
      break;
    }
    case 'vdN':
    case 'vdPreset':
    case 'vdMove': {
      const pa = a.split('|');
      const si = +pa[0],
        zk = +pa[1],
        z = S.sections[si].zones[zk],
        q = geo.secs[si];
      if (!q) break;
      const w = q.w,
        tc = geo.tc;
      if (!Array.isArray(z.vd)) z.vd = [];
      if (!Array.isArray(z.vsh)) z.vsh = [];
      const lb = (q.zones[zk] && q.zones[zk].lined) || 0,
        place = (n, m) => {
          z.vdMode = m;
          return vdPos(n, m, w, tc, lb).map(v => Math.round(v));
        };
      if (act === 'vdN') {
        const n = Math.max(0, Math.min(7, z.vd.length + +pa[2]));
        if (n > 0 && (w - n * tc) / (n + 1) < 100) {
          toast('Not enough width for another upright');
          break;
        }
        const cm = String(z.vdMode || 'even'),
          okm = (VD_MODES[cm.replace(/-r$/, '')] || VD_MODES.even).ok(n) ? cm : 'even';
        z.vd = n ? place(n, okm) : [];
        if (!n) z.vdMode = null;
        const base = +z.shelves || 0;
        z.vsh = Array.from({ length: n + 1 }, (_, j) => z.vsh[j] ?? base);
      }
      if (act === 'vdPreset') {
        const n = z.vd.length;
        let m = pa[2];
        const M = VD_MODES[m];
        if (!M || !M.ok(n)) m = 'even';
        else if (M.r && n === 1 && String(z.vdMode || '').replace(/-r$/, '') === m) m = z.vdMode === m ? m + '-r' : m;
        z.vd = place(n, m);
      }
      if (act === 'vdMove') {
        const zr_ = q.zones[zk];
        if (z.vdMode && zr_ && zr_.vdUsed && zr_.vdUsed.length === z.vd.length)
          z.vd = zr_.vdUsed.map(v => Math.round(v));
        z.vdMode = null;
        const j = +pa[2],
          d = +pa[3],
          lo = (j ? z.vd[j - 1] : 0) + 100 + tc,
          hi = (j < z.vd.length - 1 ? z.vd[j + 1] : w) - 100 - tc;
        z.vd[j] = Math.max(lo, Math.min(hi, z.vd[j] + d));
      }
      changed(true);
      break;
    }
    case 'toggleNh': {
      const [si, zk, j] = a.split('|').map(Number);
      const z = S.sections[si].zones[zk];
      if (!Array.isArray(z.nh)) z.nh = [];
      if (!Array.isArray(z.vd)) z.vd = [];
      if (!Array.isArray(z.vsh)) z.vsh = [];
      z.nh[j] = !z.nh[j];
      changed(true);
      break;
    }
    case 'splitUnit': {
      const i0 = ui.sel,
        q0 = geo.secs[i0];
      if (!q0) break;
      const i = q0.follow != null ? q0.follow : i0,
        q = geo.secs[i],
        gU = q.grp ? Math.max(...q.grp.members.map(m => m.maxU)) : q.maxU,
        ko_ = q.grp ? q.zones[q.grp.ko] : null; // columns that share an opening are split through their lead column, above the opening
      const tc = geo.tc,
        ys = q.desk ? 0 : q.Pq,
        hS = gU + tc - ys,
        M_ = geo.maxUnit,
        low = Math.min(
          M_ - 2 * tc - 10,
          Math.max(hS - M_ + 4 * tc + 10, hS * 0.62, ko_ ? ko_.divY + (ko_.divT || tc) + 300 - ys + tc : 0)
        );
      S = splitZoneAt(S, i, ys + low - tc);
      changed(true);
      toast(
        geo.secs[i] && geo.secs[i].splitK >= 0
          ? 'Split into a lower and an upper unit'
          : 'Could not find a good split height — add a fixed divider by hand'
      );
      break;
    }
    case 'ladAlign': {
      S = alignLadder(S);
      changed(true);
      toast('Cabinets lined up with the ladder rail');
      break;
    }
    case 'ladPos': {
      S.ladder = S.ladder || {};
      S.ladder.pos = Math.max(0, Math.min(1, Math.round(((S.ladder.pos ?? 0.5) + +a) * 10) / 10));
      changed(true);
      break;
    }
    case 'wizard': {
      const sm = document.getElementById('stm');
      if (sm) sm.hidden = true;
      openWiz();
      break;
    }
    case 'wizNext':
      wizGo(1);
      break;
    case 'wizBack':
      wizGo(-1);
      break;
    case 'wizSkip':
      closeWiz();
      break;
    case 'wizCeil':
      WZ.ceil = a;
      wizRender();
      break;
    case 'wizPur':
      WZ.pur[a] = !WZ.pur[a];
      wizRender();
      break;
    case 'wizStyle':
      WZ.style = a;
      wizRender();
      break;
    case 'wizPick':
      WZ.sel = +a;
      wizRender();
      break;
    case 'wizTier':
      WZ.tier = a;
      wizRender();
      break;
    case 'wizMore':
      WZ.gen++;
      WZ.props = null;
      WZ.sel = 0;
      wizRender();
      break;
    case 'wizManual':
      WZ.manual = a === '1';
      wizRender();
      break;
    case 'wizJump':
      if (+a <= wstep + 1) {
        wstep = +a;
        wizRender();
      }
      break;
    case 'wizFin': {
      const [r, k] = a.split(':');
      WZ[r] = k;
      wizRender();
      break;
    }
    case 'wizCount': {
      const nn = Math.max(1, Math.min(10, WZ.secs.length + +a));
      while (WZ.secs.length < nn) {
        const k = 'cupboard';
        WZ.secs.push({ type: k, w: '' });
      }
      WZ.secs.length = nn;
      wizRender();
      break;
    }
    case 'wizStart': {
      const kept = dsKeep();
      dsDetach(true);
      S = slopeFix(exampleState());
      ui.sel = 0;
      ui.zsel = null;
      closeWiz();
      const sm = document.getElementById('stm');
      if (sm) sm.hidden = true;
      changed(true);
      toast('Example design loaded' + (kept ? '. Your unsaved work was kept under My designs → Recovered work.' : ''));
      break;
    }
  }
});
