/* ==== 10-build.js ====
   build(S): turns the design state S into geometry G — every part (G.panels), front (G.fronts), 3D item (G.items), the hardware list (G.H) and the design notes (G.warns).
   Everything else (drawing, cut list, price, guide, 3D) reads G. New checks go at the end of build, next to accessCheck/roomCheck/cornerCheck.
*/
function build(S) {
  regCustom(S);
  applyLinks(S);
  (S.sections || []).forEach(sc =>
    (sc.zones || []).forEach(z => {
      if (!z.dog) return;
      if (z.type !== 'closed') {
        delete z.dog;
        return;
      }
      z.shelves = 0;
      z.rail = false;
      z.vd = [];
      z.vsh = [];
      z.fabric = false;
      z.doorMode = 'hinged';
      if (!DOGS[z.dog]) z.dog = 'arch';
      z.face = 'flat';
      z.inset = '';
      z.doors = 1;
    })
  );
  const R = S.room,
    K = S.skirt,
    M = S.mat,
    O = S.opts;
  const W = +R.W,
    D = +R.D,
    drop = +R.drop || 0;
  const tc = +M.carcass.t,
    tb = +M.back.t,
    tf = +M.front.t,
    ts = +M.shelf.t,
    td = +M.desk.t,
    tk = +M.skirt.t;
  const MAXU_AUTO = (() => {
      const sh = sheetOf(M.carcass.sheet);
      let m = Math.max(sh.L, sh.W) - 2 * (+O.trim || 0);
      const so = O.stock;
      if (so && so.on && (!so.roles || so.roles.carcass) && M.carcass.type === 'melamine')
        m = Math.min(m, (+so.L || 2500) - 2);
      return Math.floor(m);
    })(),
    MAXU = +O.maxUnitH > 0 ? +O.maxUnitH : MAXU_AUTO;
  const GRV = (O.backFix || 'groove') === 'groove',
    GRV_OFF = 18,
    GRV_D = 10,
    GRV_W = Math.round((tb + 0.5) * 10) / 10;
  const g = +O.gap,
    P = +K.plinth,
    Dh = D - tb,
    sc = +K.scribe || 0,
    boxes = O.construct === 'boxes',
    HT = O.handle || 'bar';
  const LV = R.lvl && R.lvl.on ? R.lvl : null,
    fD = LV ? +LV.fR || 0 : 0,
    fHi = Math.max(0, fD),
    flo = x => (fD ? fHi - (fD * Math.max(0, Math.min(W, x))) / W : 0),
    lnL = LV ? +LV.wL || 0 : 0,
    lnR = LV ? +LV.wR || 0 : 0;
  const SKB = R.skb && R.skb.on ? { h: Math.max(20, +R.skb.h || 70), t: Math.max(5, +R.skb.t || 12) } : null;
  const wobs = (Array.isArray(R.wobs) ? R.wobs : []).map((o, i) => {
    const t = WOB[o.type] ? o.type : 'socket',
      d = WOB[t],
      w = Math.max(10, +o.w || d.w),
      nm = `${d.n} ${i + 1}`;
    if (t === 'radiator') {
      const x0 = +o.x || 0,
        y0 = Math.max(0, +o.y || d.y),
        h = Math.max(100, +o.h || d.h);
      return { i, t, nm, x0, x1: x0 + w, y0, y1: y0 + h, cx: x0 + w / 2, cy: y0 + h / 2 };
    }
    if (t === 'pipe') {
      const cx = +o.x || 0,
        y1 = +o.h > 0 ? +o.h : 1e5;
      return {
        i,
        t,
        nm,
        x0: cx - w / 2,
        x1: cx + w / 2,
        y0: 0,
        y1,
        cx,
        cy: Math.min(y1, 2000) / 2,
        w,
        pr: Math.max(w, +o.p || w + 15)
      };
    }
    const cx = +o.x || 0,
      cy = Math.max(40, +o.y || d.y),
      h = Math.max(10, +o.h || d.h);
    return { i, t, nm, x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2, cx, cy };
  });
  const wcuts = wobs
    .filter(o => o.t === 'socket' || o.t === 'switch' || (WOB[o.t] || {}).keep)
    .map(o => ({ x0: o.x0 - 10, x1: o.x1 + 10, y0: o.y0 - 10, y1: o.y1 + 10, nm: o.nm.toLowerCase() }));
  const warns = [],
    panels = [],
    items = [],
    fronts = [],
    parts = [],
    plinthW = [],
    skirtW = [],
    sideW = [],
    props = [],
    linings = [],
    grommets = [],
    hRails = [];
  const H = {
    fit: [],
    funParts: [],
    tnuts: 0,
    battens: [],
    hatches: 0,
    paint: [],
    climb: 0,
    hinges: 0,
    slides: {},
    pins: 0,
    rails: [],
    legs: 0,
    angles: [],
    grommets: 0,
    handles: {},
    baffles: 0,
    brackets: 0,
    fabric: [],
    boxJoins: 0,
    cane: [],
    glass: [],
    led: [],
    slide: [],
    pocket: 0,
    ledges: 0,
    flute: 0,
    ped: 0,
    curtain: [],
    cushion: []
  };
  const cps = (R.ceil || [])
    .map(p => ({ x: +p.x, y: +p.y }))
    .filter(p => isFinite(p.x) && isFinite(p.y))
    .sort((a, b) => a.x - b.x);
  if (!cps.length) cps.push({ x: 0, y: +R.H }, { x: W, y: +R.H });
  const cobjs = (Array.isArray(R.cobjs) ? R.cobjs : []).map((o, i) => ({
    i,
    t: COBJ[o.type] ? o.type : 'light',
    x: +o.x || 0,
    w: Math.max(100, +o.w || (o.type === 'dormer' ? 1200 : o.type === 'hatch' ? 600 : 100)),
    d: +o.d >= 0 ? +o.d : 800,
    h: +o.h || 0,
    sill: +o.sill || 0,
    L: Math.max(300, +o.L || 900)
  }));
  {
    const dms = cobjs.filter(o => o.t === 'dormer' && o.h > 0);
    if (dms.length) {
      const c0 = x => {
        if (x <= cps[0].x) return cps[0].y;
        for (let i = 1; i < cps.length; i++) {
          if (x <= cps[i].x) {
            const a = cps[i - 1],
              b = cps[i];
            return b.x === a.x ? b.y : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
          }
        }
        return cps[cps.length - 1].y;
      };
      const xs = new Set(cps.map(p => p.x));
      dms.forEach(o => {
        [
          [o.x - 150, o.x],
          [o.x + o.w, o.x + o.w + 150]
        ].forEach(pr => {
          if (pr.some(v => c0(v) < o.h - 1))
            pr.forEach(v => {
              if (v >= 0 && v <= W) xs.add(v);
            });
        });
      });
      const np = [...xs]
        .sort((a, b) => a - b)
        .map(x => {
          let y = c0(x);
          dms.forEach(o => {
            if (x >= o.x && x <= o.x + o.w) y = Math.max(y, o.h);
          });
          return { x, y };
        });
      cps.splice(0, cps.length, ...np);
    }
  }
  const bumps = (Array.isArray(R.bumps) ? R.bumps : [])
    .map((o, i) => ({
      i,
      t: BUMPS[o.type] ? o.type : 'chimney',
      x: +o.x || 0,
      w: Math.max(20, +o.w || 600),
      d: Math.max(5, +o.d || 200),
      h: +o.h > 0 ? +o.h : 0,
      mode: o.mode === 'notch' ? 'notch' : 'shallow'
    }))
    .filter(b => b.d < D - 150);
  const beams = (R.beams || [])
    .map(b => ({ x: +b.x, w: +b.w, bottom: +b.bottom, depth: +b.depth }))
    .filter(b => b.w > 0);
  const ceilAt = x => {
    if (x <= cps[0].x) return cps[0].y;
    for (let i = 1; i < cps.length; i++) {
      if (x <= cps[i].x) {
        const a = cps[i - 1],
          b = cps[i];
        return b.x === a.x ? b.y : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
      }
    }
    return cps[cps.length - 1].y;
  };
  const isFull = b => b.depth >= D;
  const frontLim = x => {
    let c = ceilAt(x);
    beams.forEach(b => {
      if (isFull(b) && x > b.x && x < b.x + b.w) c = Math.min(c, b.bottom);
    });
    return c;
  };
  const breaks = (a, b) => {
    const xs = [a, b];
    cps.forEach(p => {
      if (p.x > a + 1e-6 && p.x < b - 1e-6) xs.push(p.x);
    });
    return [...new Set(xs)].sort((m, n) => m - n);
  };
  function sampleLine(f, a, b) {
    const xs = breaks(a, b),
      out = [];
    for (let k = 0; k < xs.length - 1; k++) {
      const l = xs[k],
        r = xs[k + 1];
      out.push([l, f(l)]);
      if (r - l > 1) {
        const m = (l + r) / 2;
        if (Math.abs(f(m) - (f(l) + f(r)) / 2) > 0.05) {
          const e = Math.min(0.5, (r - l) / 8);
          const sl = (f(l + e) - f(l)) / e,
            sr = (f(r) - f(r - e)) / e;
          if (Math.abs(sl - sr) > 1e-9) {
            const xk = (f(r) - f(l) + sl * l - sr * r) / (sl - sr);
            if (xk > l && xk < r) out.push([xk, f(xk)]);
          }
        }
      }
    }
    const e = xs[xs.length - 1];
    out.push([e, f(e)]);
    const m = [out[0]];
    for (let k = 1; k < out.length - 1; k++) {
      const a = m[m.length - 1],
        b = out[k],
        c = out[k + 1];
      const s1 = (b[1] - a[1]) / (b[0] - a[0] || 1e-9),
        s2 = (c[1] - b[1]) / (c[0] - b[0] || 1e-9);
      if (Math.abs(s1 - s2) > 1e-6) m.push(b);
    }
    if (out.length > 1) m.push(out[out.length - 1]);
    return m;
  }
  function upperLine(a, b) {
    const edges = [];
    beams.filter(isFull).forEach(bm =>
      [bm.x, bm.x + bm.w].forEach(e => {
        if (e > a + 1e-6 && e < b - 1e-6) edges.push(e);
      })
    );
    const all = [...new Set([...breaks(a, b), ...edges])].sort((m, n) => m - n),
      out = [];
    all.forEach((x, k) => {
      if (edges.includes(x)) {
        out.push([x, frontLim(x - 0.01)]);
        out.push([x, frontLim(x + 0.01)]);
      } else out.push([x, frontLim(k === 0 ? x + 0.01 : k === all.length - 1 ? x - 0.01 : x)]);
    });
    return out;
  }
  function addPanel(o) {
    let poly = clean(o.poly);
    if (poly.length < 3) return;
    if (o.role === 'skirt' && !(o.holes && o.holes.length)) {
      const bb = P_ => {
          const xs = P_.map(p => p[0]),
            ys = P_.map(p => p[1]);
          return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
        },
        b0 = bb(poly);
      let best = null;
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k],
          b = poly[(k + 1) % poly.length],
          th = Math.atan2(b[1] - a[1], b[0] - a[0]);
        if (Math.abs(Math.sin(th)) < 0.02 || Math.abs(Math.cos(th)) < 0.02) continue;
        const c = Math.cos(-th),
          s_ = Math.sin(-th),
          R_ = poly.map(([x, y]) => [x * c - y * s_, x * s_ + y * c]),
          d = bb(R_);
        if (!best || d[0] * d[1] < best.a) best = { a: d[0] * d[1], R: R_, d };
      }
      if (best && best.a < 0.7 * b0[0] * b0[1]) {
        poly = best.d[0] >= best.d[1] ? best.R : best.R.map(([x, y]) => [-y, x]);
        o = Object.assign({}, o, {
          grain: 'w',
          notes: (o.notes || []).concat(
            'Drawn along its own length so it fits the sheet — the grain runs along the strip'
          )
        });
      }
    }
    const mx = Math.min(...poly.map(p => p[0])),
      my = Math.min(...poly.map(p => p[1]));
    poly = poly.map(p => [r1(p[0] - mx), r1(p[1] - my)]);
    let w = Math.max(...poly.map(p => p[0])),
      h = Math.max(...poly.map(p => p[1]));
    const holes = (o.holes || []).map(q => {
      const r = { x: r1(q.x - mx), y: r1(q.y - my), d: q.d };
      if (q.dp) r.dp = q.dp;
      if (q.face) r.face = q.face;
      if (q.plate) r.plate = 1;
      if (q.cf) r.cf = 1;
      if (q.len) {
        r.len = q.len;
        r.dir = q.dir;
      }
      if (q.poly) r.poly = q.poly.map(p => [r1(p[0] - mx), r1(p[1] - my)]);
      return r;
    });
    const role = M[o.role] || M.carcass;
    if (
      (o.matType ?? role.type) === 'mdfmicro' &&
      o.band === 'all' &&
      poly.length >= 3 &&
      !MC_SKIP.test(o.type || '')
    ) {
      const ip = insetPoly(poly, 1);
      if (ip && ip.length >= 3) {
        const ax = Math.min(...ip.map(p => p[0])),
          ay = Math.min(...ip.map(p => p[1]));
        poly = ip.map(p => [r1(p[0] - ax), r1(p[1] - ay)]);
        holes.forEach(q => {
          q.x = r1(q.x - ax);
          q.y = r1(q.y - ay);
          if (q.poly) q.poly = q.poly.map(p => [r1(p[0] - ax), r1(p[1] - ay)]);
        });
        w = Math.max(...poly.map(p => p[0]));
        h = Math.max(...poly.map(p => p[1]));
        o = Object.assign({}, o, {
          notes: (o.notes || []).concat(
            'Cut 1 mm smaller all round than the finished front: the microcement adds about 1 mm on every edge'
          )
        });
      }
    }
    panels.push(
      Object.assign({ notes: [], band: 'none', bandLen: 0 }, o, {
        poly,
        holes,
        w,
        h,
        t: o.t ?? +role.t,
        fin: o.fin ?? role.fin,
        sheet: o.sheet ?? role.sheet,
        matType: o.matType ?? role.type ?? 'melamine'
      })
    );
  }
  const finOf = (k, dflt) => (FIN[k] ? k : dflt);
  // Drawer boxes for Blum TANDEM / MOVENTO style under-mount runners: box 10 mm narrower than the opening (16 mm sides → inside width = opening − 42), box length = runner length − 10, bottom recessed 13 mm
  const DRW_T = 16,
    ECO = (O.hw || {}).brand === 'blumeco',
    drawerBox = (lab, LW, sl, hF, what) => {
      if (ECO) {
        const DT = +M.carcass.t || 18,
          SKL = +sl,
          OW = LW - 26,
          Hs = Math.max(70, Math.min(250, Math.floor((hF - 50) / 10) * 10)),
          iw = OW - 2 * DT;
        if (!(iw >= 120) || !(SKL >= 200)) return;
        const b = { role: 'carcass', sec: lab, grain: 'w' },
          w_ = (what ? what + ' ' : '') + 'Cut from the carcass board leftovers. ';
        for (let l = 0; l < 2; l++)
          addPanel({
            ...b,
            type: 'Drawer box side',
            poly: rect(SKL, Hs),
            band: 'front',
            bandLen: SKL,
            notes: [`${w_}Band the top edge. The roller runner screws under the lower edge`]
          });
        for (let l = 0; l < 2; l++)
          addPanel({
            ...b,
            type: l ? 'Drawer box back' : 'Drawer box front (inner)',
            poly: rect(iw, Hs),
            band: 'front',
            bandLen: iw,
            notes: [`${w_}Fits between the sides${l ? '' : '; the show front screws onto this piece'}`]
          });
        addPanel({
          role: 'back',
          sec: lab,
          type: 'Drawer bottom',
          poly: rect(OW, SKL),
          grain: 'h',
          notes: [`${w_}Glue and nail or screw under the box, flush all round — it squares the box`]
        });
        H.drawerBoxes = (H.drawerBoxes || 0) + 1;
        if (LW > 900 && !warns.some(w => w.startsWith(lab + ': a drawer ' + f0(LW))))
          warns.push(
            `${lab}: a drawer ${f0(LW)} mm wide is too wide for roller runners (about 900 mm) — make two drawers side by side or use full-extension runners.`
          );
        return;
      }
      const SKL = +sl - 10,
        OW = LW - 10,
        Hs = Math.max(70, Math.min(250, Math.floor((hF - 50) / 10) * 10)),
        iw = OW - 2 * DRW_T;
      if (!(iw >= 120) || !(SKL >= 200)) return;
      const cf = M.carcass,
        fin = cf.type === 'melamine' && FIN[cf.fin] ? cf.fin : 'ral9010',
        b = { role: 'carcass', matType: 'melamine', sheet: MATS.melamine.sheet, fin, t: DRW_T, sec: lab, grain: 'w' },
        w_ = what ? what + ' ' : '';
      for (let l = 0; l < 2; l++)
        addPanel({
          ...b,
          type: 'Drawer box side',
          poly: rect(SKL, Hs),
          band: 'front',
          bandLen: SKL,
          notes: [
            `${w_}Band the top edge. Groove ${Math.round((tb + 0.5) * 10) / 10} wide × 8 deep for the bottom, its lower edge 13 mm above the bottom edge. Notch the rear and drill the hook hole from the runner's drilling sheet`
          ]
        });
      addPanel({
        ...b,
        type: 'Drawer box front (inner)',
        poly: rect(iw, Hs),
        band: 'front',
        bandLen: iw,
        notes: [`${w_}Fits between the sides; same bottom groove. The show front screws onto this piece`]
      });
      addPanel({
        ...b,
        type: 'Drawer box back',
        poly: rect(iw, Hs - 13 - tb - 1),
        band: 'front',
        bandLen: iw,
        notes: [`${w_}Fits between the sides and sits on top of the bottom panel`]
      });
      addPanel({
        role: 'back',
        sec: lab,
        type: 'Drawer bottom',
        poly: rect(iw + 14, SKL - DRW_T + 7),
        grain: 'h',
        notes: [`${w_}Slides 7 mm into the grooves of the sides and the inner front; screw up into the back piece`]
      });
      H.drawerBoxes = (H.drawerBoxes || 0) + 1;
      if (LW > 1200 && !warns.some(w => w.startsWith(lab + ': a drawer ' + f0(LW))))
        warns.push(
          `${lab}: a drawer ${f0(LW)} mm wide is more than runners are made for (about 1200 mm) and its bottom will sag — make two drawers side by side or a narrower column.`
        );
    };
  const TT = S.opts && S.opts.two && S.opts.two.on && FIN[S.opts.two.fin] ? S.opts.two : null;
  const ttFin = poly => {
    if (!TT) return null;
    const ys = poly.map(p => p[1]),
      cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    return cy > (+TT.y || 900) ? TT.fin : null;
  };
  const linFin = z =>
      FIN[z.boxFin]
        ? z.boxFin
        : z.boxFin === 'carcass'
          ? M.carcass.fin
          : z.boxFin === 'desk'
            ? M.desk.fin
            : M.front.fin,
    boxFinOf = z => (z.drench && FIN[z.inFin] ? z.inFin : linFin(z)),
    boxExt = z =>
      z.boxExt != null && z.boxExt !== '' && isFinite(+z.boxExt) ? Math.max(0, Math.min(60, +z.boxExt)) : tf;
  /* a column whose levels are all colour-drenched open shelves in one colour: its own box (sides, top, bottom) takes that colour too */
  const colDrench = q => {
    if (!q || q.desk || q.panel || q.door || !q.s) return null;
    const zs = q.s.zones || [];
    if (!zs.length) return null;
    const f = zs[0].inFin;
    return FIN[f] && zs.every(z => z.type === 'open' && z.drench && z.inFin === f) ? f : null;
  };
  /* uprights spaced by the DOORS (vdPosDoors): for a level whose doors sit in front of its uprights
     (closed, hinged, no door count of its own) with a spacing preset. Other levels of the same column with
     the same number of uprights and the same preset get the same positions, so the uprights stay in line.
     Returns positions from the inside left (like z.vd), or null to space by compartments as usual. */
  const doorVdLead = z =>
    z &&
    z.type === 'closed' &&
    !(+z.doors > 0) &&
    Array.isArray(z.vd) &&
    z.vd.length &&
    z.vdMode &&
    (!z.doorMode || z.doorMode === 'hinged') &&
    z.face !== 'curtain' &&
    !z.dog;
  const doorVd = (q, z) => {
    if (!q || !q.s || q.bL == null || q.bR == null) return null;
    const mode = String(z.vdMode || '').replace(/-r$/, ''),
      lead = (q.s.zones || []).find(z2 => doorVdLead(z2) && z2.vd.length === z.vd.length && String(z2.vdMode).replace(/-r$/, '') === mode);
    if (!lead) return null;
    return vdPosDoors(z.vd.length, lead.vdMode, q.bR - q.bL).map(x => x + q.bL - q.xa);
  };
  const autoVd = (z, bL_, bR_, xa_) => {
    const nd = +z.doors || 0;
    if (
      !z ||
      z.type !== 'closed' ||
      (z.doorMode && z.doorMode !== 'hinged') ||
      z.face === 'curtain' ||
      z.dog ||
      nd < 3 ||
      (Array.isArray(z.vd) && z.vd.length)
    )
      return null;
    return Array.from({ length: Math.ceil(nd / 2) - 1 }, (_, k_) => bL_ + ((k_ + 1) * 2 * (bR_ - bL_)) / nd - xa_);
  };
  const hz = (xa, xb, y, t, z0, z1, role) => ({
    k: 'prism',
    poly: [
      [xa, z0],
      [xb, z0],
      [xb, z1],
      [xa, z1]
    ],
    toW: (u, v) => [u, y, -v],
    ext: [0, t, 0],
    role,
    grainU: true
  });
  const fp = (poly, z, t, role, tag, grainU) => ({
    k: 'prism',
    poly,
    toW: (u, v) => [u, v, z],
    ext: [0, 0, -t],
    role,
    tag,
    grainU
  });
  const wf = (it, fin) => {
    if (fin) it.fin = fin;
    return it;
  };
  function okInterval(poly, y) {
    const ivs = [];
    let cur = null;
    for (let k = 0; k < poly.length - 1; k++) {
      const [xa, ya] = poly[k],
        [xb, yb] = poly[k + 1];
      const ina = ya >= y - 1e-6,
        inb = yb >= y - 1e-6;
      if (ina && cur === null) cur = xa;
      if (ina && !inb) {
        ivs.push([cur, xa + ((y - ya) / (yb - ya)) * (xb - xa)]);
        cur = null;
      }
      if (!ina && inb) {
        cur = xa + ((y - ya) / (yb - ya)) * (xb - xa);
      }
    }
    if (cur !== null) ivs.push([cur, poly[poly.length - 1][0]]);
    let best = null;
    ivs.forEach(iv => {
      if (iv[1] - iv[0] > 0.5 && (!best || iv[1] - iv[0] > best[1] - best[0])) best = iv;
    });
    return best;
  }
  const underAt = (q, x) => {
    const u = q.under;
    if (x <= u[0][0]) return u[0][1];
    for (let k = 1; k < u.length; k++)
      if (x <= u[k][0]) {
        const a = u[k - 1],
          b = u[k];
        return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0] || 1);
      }
    return u[u.length - 1][1];
  };
  const minUnder = (q, l, r) =>
    Math.min(underAt(q, l), underAt(q, r), ...q.under.filter(p => p[0] > l && p[0] < r).map(p => p[1]));
  const HSZ = O.handleSize || 'M',
    HWD = WOODS[O.handleWood] ? O.handleWood : 'oak';
  function hSize(type, avail) {
    const c = hCat(type);
    if (!c) return 0;
    const lin = c === 'bar' || c === 'slot' || c === 'edge' || c === 'stick';
    if (HSZ === 'F') return lin ? Math.max(90, avail * 0.8) : HSIZE.XL[c];
    const v = (HSIZE[HSZ] || HSIZE.M)[c];
    return lin ? Math.max(60, Math.min(v, avail * 0.85)) : v;
  }
  function handleSpec(kind, poly, hinge, ht) {
    const HT_ = ht || HT;
    if (HT_ === 'dots') return { type: 'dots' };
    if (HT_ === 'none') return { type: 'none' };
    const xs = poly.map(p => p[0]),
      ys = poly.map(p => p[1]),
      l = Math.min(...xs),
      r = Math.max(...xs),
      b = Math.min(...ys),
      t = Math.max(...ys),
      c = hCat(HT_);
    if (kind === 'door') {
      const ex = hinge === 'L' ? r : l,
        sx = hinge === 'L' ? -1 : 1,
        edge = hinge === 'L' ? 'right' : 'left',
        tt = polyTopAt(poly, ex + sx * 50),
        Hd = tt - b;
      if (HT_ === 'groove' || HT_ === 'profile') return { type: HT_, x: ex, y: b, len: Hd, dir: 'v', sx, edge };
      const len = hSize(HT_, Hd - 60);
      const hy =
        (len > 400 || HSZ === 'F') && c !== 'knob' && c !== 'hole' && c !== 'disc'
          ? b + Hd / 2
          : Math.min(Math.max(1050, b + len / 2 + 60), tt - len / 2 - 60);
      if (HT_ === 'edge') return { type: 'edge', x: ex, y: hy, len, dir: 'v', sx, edge };
      const inset = c === 'knob' || c === 'hole' || c === 'disc' || c === 'cup' ? Math.max(48, len / 2 + 28) : 45;
      return {
        type: HT_,
        x: ex + sx * (c === 'cup' ? len * 0.25 + 25 : inset),
        y: hy,
        len,
        d: c === 'knob' || c === 'hole' || c === 'disc' ? len : 0,
        dir: 'v',
        sx,
        edge
      };
    }
    const Wd = r - l,
      cx = (l + r) / 2;
    if (HT_ === 'groove' || HT_ === 'profile') return { type: HT_, x: l, y: t, len: Wd, dir: 'h', edge: 'top' };
    const len = hSize(HT_, Wd - 60);
    if (HT_ === 'edge') return { type: 'edge', x: cx, y: t, len, dir: 'h', edge: 'top' };
    const m =
      c === 'knob' || c === 'hole' || c === 'disc'
        ? len / 2 + 25
        : c === 'cup'
          ? len * 0.22 + 22
          : Math.min(55, (t - b) / 3);
    return {
      type: HT_,
      x: cx,
      y: t - Math.min(m, (t - b) / 2),
      len,
      d: c === 'knob' || c === 'hole' || c === 'disc' ? len : 0,
      dir: 'h',
      edge: 'top'
    };
  }
  const handleHoles = hs =>
    hs.type === 'hole'
      ? [{ x: hs.x, y: hs.y, d: hs.d || 30 }]
      : hs.type === 'slot'
        ? [{ x: hs.x, y: hs.y, d: 25, len: f0(hs.len), dir: hs.dir }]
        : [];
  const wn = WOODS[HWD].name;
  const handleNote = hs =>
    ({
      hole: `Ø${hs.d} finger hole drilled through`,
      slot: `Routed finger slot 25×${f0(hs.len)} through`,
      groove: `15 mm bevelled finger groove along the ${hs.edge} edge`,
      profile: `${wn} J-profile along the ${hs.edge} edge`,
      edge: `${wn} edge pull ${f0(hs.len)} mm on the ${hs.edge} edge`,
      woodbar: `${wn} bar handle ${f0(hs.len)} mm`,
      woodpull: `${wn} D-pull ${f0(hs.len)} mm`,
      woodknob: `${wn} knob Ø${hs.d}`,
      woodblock: `${wn} block knob ${hs.d}×${hs.d}`,
      woodcup: `${wn} cup pull ${f0(hs.len)} mm`,
      disc: `${wn} disc pull Ø${hs.d}${hs.seam ? ' — half of a disc that sits across the seam with the next door' : ''}`,
      stick: `Painted wooden stick pull ${f0(hs.len)} mm`,
      cross: `Painted wooden cross knob ${hs.d} mm`,
      ring: `Painted wooden ring pull Ø${hs.d}`,
      dots: 'The dots are the finger pulls',
      leather: `Leather strap ${f0(hs.len)} mm`,
      bar: `Bar handle ${f0(hs.len)} mm`,
      knob: `Knob Ø${hs.d}`,
      none: 'Push-to-open latch'
    })[hs.type] || '';
  const addFabric = (poly, col, lab) => {
    const xs = poly.map(p => p[0]),
      ys = poly.map(p => p[1]);
    const wr = 2 * (tf + 25);
    H.fabric.push({
      col,
      w: f0(Math.max(...xs) - Math.min(...xs) + wr),
      h: f0(Math.max(...ys) - Math.min(...ys) + wr),
      sec: lab
    });
  };
  const claddings = [],
    funs = [],
    holds = [];
  const arches = [],
    baskets = [],
    nooks = [],
    cubs = [],
    cubCov = [];
  const result = {
    arches,
    baskets,
    nooks,
    cubs,
    claddings,
    funs,
    holds,
    warns,
    panels,
    items,
    fronts,
    parts,
    plinthW,
    skirtW,
    sideW,
    props,
    linings,
    H,
    cps,
    beams,
    ceilAt,
    frontLim,
    sampleLine,
    upperLine,
    secs: [],
    groups: [],
    W,
    D,
    Dh,
    P,
    tc,
    tb,
    tf,
    ts,
    td,
    tk,
    g,
    drop,
    isFull,
    boxes
  };

  function buildPanel(q) {
    const s = q.s,
      pn = Object.assign({}, PANEL_DEF, s.panel || {}),
      lab = 'S' + (q.i + 1),
      fin = FIN[pn.fin] ? pn.fin : 'birch',
      t = +pn.t || 18,
      r = prng((+pn.seed || 7) * 131 + q.i * 17);
    q.zones = [];
    q.backPieces = [];
    q.backHoles = [];
    q.panelOpt = pn;
    const toeOn = P > 0 && (pn.fun === 'faux' || (pn.toe == null ? true : !!pn.toe));
    q.toe = toeOn;
    const L = q.bL + g / 2,
      Rr = q.bR - g / 2,
      yb0 = toeOn ? P + g / 2 : 5,
      maxL = sheetOf(M.front.sheet).L - 2 * (+O.trim || 0);
    const topMin = Math.min(...sampleLine(q.top, L, Rr).map(p => p[1]));
    if (Rr - L < 450) warns.push(`${lab}: the panel wall is only ${f0(Rr - L)} mm wide.`);
    const pmt = MATS[pn.mat] ? pn.mat : 'ply';
    if (pn.fun === 'climb' && (t < 18 || pmt !== 'ply'))
      warns.push(`${lab}: a climbing wall needs at least 18 mm birch plywood (T-nuts pull out of MDF and chipboard).`);
    const bands = [];
    let hy0 = null,
      hy1 = null;
    const faux = pn.fun === 'faux';
    if (faux) q.fauxPn = { pn, L, Rr, topMin, lab };
    if (pn.hatch && !faux) {
      hy0 = Math.max(yb0 + 120, +pn.hatchY || 300);
      hy1 = Math.min(topMin - 150, hy0 + (+pn.hatchH || 600));
      if (hy1 - hy0 < 200) {
        warns.push(`${lab}: not enough height for the access hatch.`);
        hy0 = null;
      }
    }
    if (hy0 != null) {
      bands.push(
        { y0: yb0, y1: hy0 - g / 2, kind: 'clad' },
        { y0: hy0 + g / 2, y1: hy1 - g / 2, kind: 'hatch' },
        { y0: hy1 + g / 2, y1: null, kind: 'clad' }
      );
    } else bands.push({ y0: yb0, y1: null, kind: 'clad' });
    const pcs = [];
    if (!faux)
      bands.forEach(b => {
        let y = b.y0;
        if (b.y1 != null && b.y1 - y < 20) return;
        for (let guard = 0; guard < 6; guard++) {
          const top = b.y1 ?? topMin;
          if (top - y <= maxL) {
            pcs.push({ ...b, y0: y });
            break;
          }
          pcs.push({ kind: b.kind, y0: y, y1: y + maxL - g / 2, joint: true });
          y += maxL + g / 2;
        }
      });
    const PG = 120,
      pgN = pn.fun === 'peg' ? Math.max(0, Math.floor((Rr - L - 160) / PG) + 1) : 0,
      pgX0 = (L + Rr) / 2 - ((pgN - 1) * PG) / 2,
      pgH = new Set(),
      pgY = r_ => 300 + PG * r_;
    pcs.forEach((pc, pi) => {
      const poly =
        pc.y1 != null
          ? [
              [L, pc.y0],
              [Rr, pc.y0],
              [Rr, pc.y1],
              [L, pc.y1]
            ]
          : [[L, pc.y0], [Rr, pc.y0], ...sampleLine(x => q.top(x) - g / 2, L, Rr).reverse()];
      const holes = [],
        notes = [],
        ytop = pc.y1 ?? topMin;
      if (pc.kind === 'hatch') {
        holes.push({ x: (L + Rr) / 2, y: pc.y1 - 50, d: 30 });
        notes.push('Removable access panel for the shaft — magnetic push latches, Ø30 finger hole');
        H.hatches++;
      }
      if (pn.fun === 'peg' && pc.kind !== 'hatch' && pgN > 0) {
        let nH = 0;
        const sl_ = pn.pegHole === 'slot';
        for (let r_ = 0; pgY(r_) <= ytop - 100 && r_ < 40; r_++) {
          const y = pgY(r_);
          if (y < pc.y0 + 70) continue;
          for (let c = 0; c < pgN; c++) {
            holes.push(sl_ ? { x: pgX0 + c * PG, y, d: 12, len: '40', dir: 'v' } : { x: pgX0 + c * PG, y, d: 20 });
            pgH.add(c + ',' + r_);
            nH++;
          }
        }
        if (nH)
          notes.push(
            sl_
              ? `${nH} slots of 12 × 40 mm on a ${PG} mm grid — rout them with a 12 mm bit and a slot template, against a scrap board so the back does not splinter`
              : `${nH} × Ø20 holes on a ${PG} mm grid for the pegs — drill with a Forstner bit against a scrap board, so the back does not splinter`
          );
      }
      if (pn.fun === 'climb' && pc.kind !== 'hatch') {
        let row = 0;
        for (let y = 250; y <= Math.min(+pn.climbH || 1900, ytop - 100); y += 200, row++) {
          if (y < pc.y0 + 80) continue;
          const off = row % 2 ? 100 : 0;
          for (let x = L + 100 + off; x <= Rr - 100; x += 200) {
            holes.push({ x, y, d: 11 });
            if (r() < 0.42)
              holds.push({
                z0: q.z0,
                x,
                y,
                s: 55 + r() * 65,
                col: HOLDC[(r() * HOLDC.length) | 0],
                rot: r() * 180,
                shape: (r() * 3) | 0
              });
          }
        }
        if (holes.length) {
          notes.push(`${holes.length} × Ø11 holes for M10 hammer-in T-nuts (fit from the back before mounting)`);
          H.tnuts += holes.length;
          H.climb++;
        }
      }
      if (pc.joint) notes.push('Joint to the next panel lands on a horizontal batten');
      addPanel({
        type: pc.kind === 'hatch' ? 'Access hatch' : 'Panel wall cladding',
        role: 'front',
        matType: pmt,
        sheet: MATS[pmt].sheet,
        fin,
        t,
        sec: lab,
        poly,
        holes,
        grain: 'h',
        band: pc.kind === 'hatch' ? 'all' : 'none',
        notes,
        manyHoles: holes.length > 24
      });
      items.push(Object.assign(wf(fp(poly, tf - q.z0, t, 'front'), fin), { mt: pmt }));
      claddings.push({ poly, fin, kind: pc.kind, holes: pc.kind === 'hatch' ? holes : [] });
    });
    const ox0 = L + 90,
      ox1 = Rr - 90,
      oy0 = Math.max(700, hy0 != null ? hy1 + 80 : 0),
      oy1 = Math.min(1800, topMin - 150);
    if ((pn.fun === 'chalk' || pn.fun === 'magnet') && oy1 - oy0 > 300 && ox1 - ox0 > 250) {
      const o = { k: pn.fun, x0: ox0, x1: ox1, y0: oy0, y1: oy1 };
      funs.push(o);
      const area = ((ox1 - ox0) * (oy1 - oy0)) / 1e6;
      H.paint.push({ k: pn.fun, area, sec: lab });
      if (pn.fun !== 'peg')
        items.push(
          wf(
            fp(
              [
                [ox0, oy0],
                [ox1, oy0],
                [ox1, oy1],
                [ox0, oy1]
              ],
              tf + 1 - q.z0,
              1,
              'front'
            ),
            pn.fun === 'chalk' ? 'ral6012' : 'ral7016'
          )
        );
      else {
        const pc = panels.filter(p => p.sec === lab && p.type === 'Panel wall cladding');
        pc.forEach(p => p.notes.push(`Pegboard area ${f0(ox1 - ox0)}×${f0(oy1 - oy0)} mm: Ø6 holes on a 50 mm grid`));
      }
    }
    const yS = hy0 != null ? hy1 + 80 : null,
      kidY = lo => Math.max(lo, yS ?? 0);
    const pext = { matType: pmt, sheet: MATS[pmt].sheet, fin, sec: lab };
    if (pn.fun === 'cork' && oy1 - oy0 > 300 && ox1 - ox0 > 250) {
      funs.push({ k: 'cork', x0: ox0, x1: ox1, y0: oy0, y1: oy1, z0: q.z0 });
      H.funParts.push({
        n: 'Cork board 10 mm, glued to the panel',
        q: `${(((ox1 - ox0) * (oy1 - oy0)) / 1e6).toFixed(2)} m²`,
        sec: lab
      });
      items.push(
        wf(
          fp(
            [
              [ox0, oy0],
              [ox1, oy0],
              [ox1, oy1],
              [ox0, oy1]
            ],
            tf + 8 - q.z0,
            8,
            'front'
          ),
          'cork'
        )
      );
    }
    if (pn.fun === 'mirror') {
      const mw = Math.min(600, ox1 - ox0),
        y0 = kidY(400),
        mh = Math.min(900, topMin - 200 - y0);
      if (mh > 250 && mw > 250) {
        const mx = (L + Rr) / 2,
          o = { k: 'mirror', x0: mx - mw / 2, x1: mx + mw / 2, y0, y1: y0 + mh, z0: q.z0 };
        funs.push(o);
        H.funParts.push({ n: 'Shatterproof acrylic mirror 3 mm', q: `${f0(mw)}×${f0(mh)} mm`, sec: lab });
        items.push(
          wf(
            fp(
              [
                [o.x0, o.y0],
                [o.x1, o.y0],
                [o.x1, o.y1],
                [o.x0, o.y1]
              ],
              tf + 3 - q.z0,
              3,
              'front'
            ),
            'mirror'
          )
        );
      }
    }
    if (pn.fun === 'busy') {
      const y0 = kidY(450),
        y1 = Math.min(y0 + 820, topMin - 150),
        bx0 = L + 70,
        bx1 = Rr - 70;
      if (y1 - y0 > 300 && bx1 - bx0 > 300) {
        const cols = Math.max(1, Math.floor((bx1 - bx0) / 230)),
          rows = Math.max(1, Math.floor((y1 - y0) / 230)),
          cw = (bx1 - bx0) / cols,
          ch = (y1 - y0) / rows,
          els = [],
          T = ['spinner', 'wheel', 'latch', 'switch', 'abacus', 'door', 'gears', 'bell'];
        for (let a = 0; a < rows; a++)
          for (let b = 0; b < cols; b++)
            els.push({
              t: T[(r() * T.length) | 0],
              x: bx0 + cw * (b + 0.5),
              y: y0 + ch * (a + 0.5),
              s: Math.min(cw, ch) * 0.78,
              c: HOLDC[(r() * HOLDC.length) | 0]
            });
        funs.push({ k: 'busy', x0: bx0, x1: bx1, y0, y1, els, z0: q.z0 });
        const cnt = {};
        els.forEach(e => (cnt[e.t] = (cnt[e.t] || 0) + 1));
        H.funParts.push({
          n:
            'Busy board parts: ' +
            Object.entries(cnt)
              .map(
                ([t, c]) =>
                  c +
                  '× ' +
                  {
                    spinner: 'colour spinner',
                    wheel: 'steering wheel',
                    latch: 'door latch',
                    switch: 'light switch',
                    abacus: 'bead abacus',
                    door: 'peek-a-boo door',
                    gears: 'gear set',
                    bell: 'bicycle bell'
                  }[t]
              )
              .join(', '),
          q: 'set',
          sec: lab
        });
      }
    }
    if (pn.fun === 'marble') {
      const y0 = kidY(320),
        y1 = Math.min(1750, topMin - 150),
        mx0 = L + 60,
        mx1 = Rr - 60,
        nR = Math.floor((y1 - y0) / 210);
      if (nR >= 2 && mx1 - mx0 > 300) {
        const ramps = [];
        for (let k = 0; k < nR; k++) {
          const yt = y1 - k * 210,
            left = k % 2 === 0,
            xa = left ? mx0 : mx0 + 70,
            xb = left ? mx1 - 70 : mx1,
            ya = left ? yt : yt - 45,
            yb = left ? yt - 45 : yt;
          ramps.push([xa, ya, xb, yb]);
          const Lr = Math.hypot(xb - xa, 45);
          addPanel({
            ...pext,
            type: 'Marble run ramp',
            role: 'front',
            t: 12,
            poly: rect(Lr, 60),
            grain: 'w',
            notes: ['Fix at a 45 mm fall over its length']
          });
          for (let l = 0; l < 2; l++)
            addPanel({
              ...pext,
              type: 'Marble run lip',
              role: 'front',
              t: 6,
              poly: rect(Lr, 25),
              grain: 'w',
              notes: ['Glue along both ramp edges']
            });
        }
        funs.push({ k: 'marble', ramps, x0: mx0, x1: mx1, y0, y1, z0: q.z0 });
        H.funParts.push({ n: 'Wooden marbles Ø16', q: '≈20', sec: lab });
      }
    }
    if (pn.fun === 'peg' && pgH.size) {
      if (t < 18 || (pmt !== 'ply' && pmt !== 'solid'))
        warns.push(
          `${lab}: a peg wall needs 18 mm plywood or solid wood — in MDF and chipboard the peg holes wear out and the pegs start to droop.`
        );
      const used = new Set(),
        has = (c, r_) => pgH.has(c + ',' + r_),
        free = (c0, c1, r0, r1) => {
          for (let c = c0; c <= c1; c++)
            for (let r_ = r0; r_ <= r1; r_++) {
              if (c < 0 || c >= pgN || r_ < 0 || used.has(c + ',' + r_)) return false;
            }
          return true;
        },
        take = (c0, c1, r0, r1) => {
          for (let c = c0; c <= c1; c++) for (let r_ = r0; r_ <= r1; r_++) used.add(c + ',' + r_);
        };
      const rows = [...pgH].map(k => +k.split(',')[1]),
        rMax = Math.max(...rows),
        rLo = Math.max(Math.min(...rows), Math.ceil((kidY(420) - 300) / PG)),
        rHi = Math.max(rLo, rMax - 1),
        X = c => pgX0 + c * PG,
        pegs = [],
        shelves = [],
        boxes = [],
        drawers = [],
        hooks = [],
        ledges = [],
        rolls = [],
        rails = [],
        slotM = pn.pegHole === 'slot';
      const place = (wc, hr, n, fn) => {
        for (let k = 0; k < n; k++)
          for (let tr = 0; tr < 240; tr++) {
            const c = Math.floor(r() * (pgN - wc)),
              r_ = rLo + Math.floor(r() * Math.max(1, rHi - rLo - hr + 2));
            if (c < 0 || !has(c, r_) || !has(c + wc, r_) || !free(c, c + wc, r_, r_ + hr)) continue;
            take(c, c + wc, r_, r_ + hr);
            pegs.push([X(c), pgY(r_)], [X(c + wc), pgY(r_)]);
            fn(c, r_);
            break;
          }
      };
      if (pgN >= 3) {
        place(2, 2, Math.max(0, Math.min(2, +pn.pegD || 0)), (c, r_) =>
          drawers.push({ x0: X(c) - 40, x1: X(c + 2) + 40, y: pgY(r_) + 10, h: 220 })
        );
        place(2, 1, Math.max(0, Math.min(4, +pn.pegB || 0)), (c, r_) =>
          boxes.push({ x0: X(c) - 40, x1: X(c + 2) + 40, y: pgY(r_) + 10, h: 110 })
        );
      }
      if (pgN >= 3)
        for (let k = 0; k < Math.max(0, Math.min(4, +pn.pegL || 0)); k++) {
          const sp = Math.min(pgN - 1, 2 + Math.floor(r() * 2));
          place(sp, 2, 1, (c, r_) => {
            const bk = [];
            let x = X(c) - 30;
            const x1 = X(c + sp) + 30;
            while (x < x1 - 150) {
              const bw = 150 + r() * 50;
              if (x + bw > x1 - 10) break;
              bk.push({ x, w: bw, h: 190 + r() * 60, col: BOOKC[(r() * BOOKC.length) | 0] });
              x += bw + 6 + r() * 14;
            }
            ledges.push({ x0: X(c) - 40, x1: X(c + sp) + 40, y: pgY(r_) + 10, books: bk });
          });
        }
      if (pgN >= 4 && +pn.pegR > 0)
        for (let r_ = rLo, done = false; r_ <= Math.min(rHi, rLo + 3) && !done; r_++)
          for (let tr = 0; tr < 40 && !done; tr++) {
            const c = Math.floor(r() * (pgN - 3));
            if (c < 0 || !has(c, r_) || !has(c + 3, r_) || !free(c, c + 3, r_, r_ + 1)) continue;
            take(c, c + 3, r_, r_ + 1);
            pegs.push([X(c), pgY(r_)], [X(c + 3), pgY(r_)]);
            rolls.push({ x0: X(c) - 30, x1: X(c + 3) + 30, y: pgY(r_) + 10 });
            done = true;
          }
      if (pgN >= 3)
        for (let k = 0; k < Math.max(0, Math.min(2, +pn.pegK || 0)); k++)
          place(3, 3, 1, (c, r_) => {
            const its = [];
            for (let j = 0; j < 4; j++)
              its.push({
                x: X(c) + 30 + (j * (3 * PG - 60)) / 3,
                t: (r() * 3) | 0,
                col: HOLDC[(r() * HOLDC.length) | 0],
                h: 110 + r() * 120
              });
            rails.push({ x0: X(c) - 25, x1: X(c + 3) + 25, y: pgY(r_) + 40, its });
          });
      if (pgN >= 2)
        for (let k = 0; k < Math.max(0, Math.min(8, +pn.pegS || 0)); k++) {
          const sp = Math.max(1, Math.min(pgN - 1, 2 + Math.floor(r() * 3)));
          place(sp, 2, 1, (c, r_) => shelves.push({ x0: X(c) - 40, x1: X(c + sp) + 40, y: pgY(r_) + 10 }));
        }
      for (let k = 0; k < Math.max(0, Math.min(10, +pn.pegH || 0)); k++)
        for (let tr = 0; tr < 240; tr++) {
          const c = Math.floor(r() * pgN),
            r_ = Math.max(rLo + 2, rLo + Math.floor(r() * Math.max(1, rHi - rLo + 1)));
          if (!has(c, r_) || !free(c, c, r_ - 3, r_)) continue;
          take(c, c, r_ - 3, r_);
          pegs.push([X(c), pgY(r_)]);
          hooks.push({ x: X(c), y: pgY(r_), t: (r() * 4) | 0, col: HOLDC[(r() * HOLDC.length) | 0] });
          break;
        }
      shelves.forEach(sh =>
        addPanel({
          ...pext,
          type: 'Peg shelf',
          role: 'front',
          t,
          poly: rect(sh.x1 - sh.x0, 150),
          grain: 'w',
          band: 'all',
          notes: [
            'Loose shelf that rests on two pegs. Glue a 10 × 10 mm strip under the back edge, behind the pegs, so it cannot slide forward'
          ]
        })
      );
      boxes.forEach(bx => {
        const w = bx.x1 - bx.x0;
        [
          ['Peg box — back', w, 110, 1, ['Two Ø21 holes, 120 mm grid, so it hangs on two pegs']],
          ['Peg box — bottom', w, 108, 1, []],
          ['Peg box — front', w, 80, 1, []],
          ['Peg box — end', 108, 98, 2, []]
        ].forEach(([n_, a_, b_, q_, nt]) => {
          for (let j = 0; j < q_; j++)
            addPanel({
              ...pext,
              type: n_,
              role: 'front',
              t: 12,
              poly: rect(a_, b_),
              grain: 'w',
              band: 'none',
              notes: nt.concat(['12 mm plywood, glued and pinned'])
            });
        });
      });
      drawers.forEach(dw => {
        const w = dw.x1 - dw.x0;
        [
          ['Peg drawer unit — back', w, 220, 1, ['Two Ø21 holes so it hangs on two pegs']],
          ['Peg drawer unit — top / bottom', w, 150, 2, []],
          ['Peg drawer unit — side', 196, 150, 2, []],
          ['Peg drawer unit — shelf', w - 24, 140, 1, ['Sits 100 mm above the bottom; the drawer runs under it']],
          ['Peg drawer — front', w - 28, 96, 1, ['Ø25 finger hole in the middle']],
          ['Peg drawer — side', 130, 80, 2, []],
          ['Peg drawer — back / inner front', w - 56, 80, 2, []],
          ['Peg drawer — bottom', w - 32, 130, 1, []]
        ].forEach(([n_, a_, b_, q_, nt]) => {
          for (let j = 0; j < q_; j++)
            addPanel({
              ...pext,
              type: n_,
              role: 'front',
              t: 12,
              poly: rect(a_, b_),
              grain: 'w',
              band: 'none',
              notes: nt.concat(['12 mm plywood, glued and pinned'])
            });
        });
      });
      ledges.forEach(lg => {
        const w = lg.x1 - lg.x0;
        [
          ['Peg book ledge — shelf', w, 90, 1, ['Books stand on it with their covers to the front']],
          ['Peg book ledge — front rail', w, 40, 1, ['Glued on the front edge; holds the books']],
          [
            'Peg book ledge — back',
            w,
            140,
            1,
            [slotM ? 'Two hardwood tabs on the back drop into the slots' : 'Two Ø21 holes so it hangs on two pegs']
          ],
          ['Peg book ledge — end', 90, 100, 2, []]
        ].forEach(([n_, a_, b_, q_, nt]) => {
          for (let j = 0; j < q_; j++)
            addPanel({
              ...pext,
              type: n_,
              role: 'front',
              t: 12,
              poly: rect(a_, b_),
              grain: 'w',
              band: 'none',
              notes: nt.concat(['12 mm plywood, glued and pinned'])
            });
        });
      });
      rolls.forEach(ro => {
        for (let j = 0; j < 2; j++)
          addPanel({
            ...pext,
            type: 'Peg paper-roll bracket',
            role: 'front',
            t: 18,
            poly: rect(120, 140),
            grain: 'w',
            band: 'none',
            notes: ['Ø27 hole for the dowel, 60 mm from the front; round the corners']
          });
        H.funParts.push({
          n: `Drawing paper roll 45 cm wide, on a beech dowel Ø25 × ${f0(ro.x1 - ro.x0 + 30)} mm`,
          q: '1',
          sec: lab
        });
      });
      rails.forEach(ra => {
        H.funParts.push({
          n: `Hanging rail: beech dowel Ø20 × ${f0(ra.x1 - ra.x0)} mm on two brackets, with 4 S-hooks`,
          q: '1',
          sec: lab
        });
      });
      if (pegs.length)
        H.funParts.push(
          slotM
            ? {
                n: 'Hardwood hook tabs 12 mm thick, 40 mm wide — two on the back of every shelf, box and bracket; they drop into the slots',
                q: `${pegs.length} tabs`,
                sec: lab
              }
            : {
                n: 'Beech dowel pegs Ø20 × 150 mm — saw them from dowel rod and round the ends; they push 18 mm into the board',
                q: `${pegs.length} pegs`,
                sec: lab
              }
        );
      funs.push({
        k: 'pegs',
        holes: [...pgH].map(k => {
          const [c, r_] = k.split(',').map(Number);
          return [X(c), pgY(r_)];
        }),
        slot: slotM,
        pegs,
        shelves,
        boxes,
        drawers,
        hooks,
        ledges,
        rolls,
        rails,
        fin,
        z0: q.z0,
        seed: (+pn.seed || 7) * 31 + q.i
      });
      q.pegN = {
        pegs: pegs.length,
        shelves: shelves.length,
        boxes: boxes.length,
        drawers: drawers.length,
        hooks: hooks.length,
        ledges: ledges.length,
        rolls: rolls.length,
        rails: rails.length
      };
    }
    if (pn.fun === 'ledges') {
      const ys2 = [];
      for (let y = kidY(250); y <= Math.min(1450, topMin - 260); y += 330) ys2.push(y);
      const lw = Rr - L - 60;
      ys2.forEach(() => {
        addPanel({
          ...pext,
          type: 'Book ledge',
          role: 'front',
          t,
          poly: rect(lw, 90),
          grain: 'w',
          band: 'front',
          bandLen: lw,
          notes: ['Screw through the cladding into the battens']
        });
        addPanel({ ...pext, type: 'Book ledge lip', role: 'front', t: 12, poly: rect(lw, 45), grain: 'w' });
      });
      if (ys2.length)
        funs.push({ k: 'ledges', ys: ys2, x0: L + 30, x1: Rr - 30, z0: q.z0, seed: (+pn.seed || 7) + q.i });
    }
    if (pn.fun === 'mural') {
      const o = {
        k: 'mural',
        x0: L + 20,
        x1: Rr - 20,
        y0: 40,
        y1: topMin - 60,
        seed: (+pn.seed || 7) * 17 + q.i,
        z0: q.z0
      };
      if (o.y1 - o.y0 > 300) {
        funs.push(o);
        H.funParts.push({
          n: 'Wall paint for the mural (4–5 colours)',
          q: `${(((o.x1 - o.x0) * (o.y1 - o.y0)) / 1e6).toFixed(2)} m²`,
          sec: lab
        });
      }
    }
    const dy0 = kidY(140),
      dy1 = topMin - 140;
    if (pn.fun === 'slats' && dy1 - dy0 > 400 && Rr - L > 300) {
      const x0 = L + 40,
        x1 = Rr - 40,
        n = Math.max(3, Math.floor((x1 - x0 + 22) / 52)),
        pitch = (x1 - x0 + 22) / n,
        sw_ = pitch - 22,
        wood = r() < 0.5 ? 'oak' : 'walnut';
      funs.push({ k: 'slats', x0, x1, y0: dy0, y1: dy1, n, pitch, sw: sw_, wood, z0: q.z0 });
      H.funParts.push({
        n: `Slat wall: solid ${FIN[wood].name.toLowerCase()} slats ${f0(sw_)}×20 mm, ${f0(dy1 - dy0)} mm long, glued and pinned onto black acoustic felt`,
        q: `${n} slats + ${(((x1 - x0) * (dy1 - dy0)) / 1e6).toFixed(2)} m² felt`,
        sec: lab
      });
    }
    if (pn.fun === 'frames') {
      const y0 = kidY(650),
        y1 = Math.min(2000, topMin - 160),
        x0 = L + 80,
        x1 = Rr - 80;
      if (y1 - y0 > 350 && x1 - x0 > 250) {
        const cols = Math.max(1, Math.round((x1 - x0) / 330)),
          cw = (x1 - x0) / cols,
          fr = [],
          FC = ['#1E1E1E', '#B98B57', '#F2EFE9', '#6B4A2B', '#C9A227'];
        for (let c = 0; c < cols; c++) {
          let y = y0 + r() * 60;
          for (let gd = 0; gd < 8 && y1 - y > 220; gd++) {
            const h = Math.min(y1 - y, 230 + r() * 260),
              w = cw - 50 - r() * 40;
            fr.push({
              x: x0 + cw * c + (cw - w) / 2,
              y,
              w,
              h: h - 40,
              c: FC[(r() * FC.length) | 0],
              a: (r() * 5) | 0,
              col: HOLDC[(r() * HOLDC.length) | 0],
              col2: HOLDC[(r() * HOLDC.length) | 0]
            });
            y += h + 10;
          }
        }
        if (fr.length) {
          funs.push({ k: 'frames', fr, z0: q.z0 });
          H.funParts.push({
            n: 'Picture frames for the gallery hang (screws into the battens)',
            q: `${fr.length} frames`,
            sec: lab
          });
        }
      }
    }
    if (pn.fun === 'plants') {
      const y0 = kidY(500),
        y1 = Math.min(2000, topMin - 280),
        x0 = L + 110,
        x1 = Rr - 110,
        pots = [];
      let row = 0;
      if (x1 - x0 >= 0)
        for (let y = y0; y <= y1; y += 360, row++) {
          const n = Math.max(1, Math.floor((x1 - x0) / 300) + (row % 2 ? 0 : 1)),
            sp = n > 1 ? (x1 - x0) / (n - 1) : 0;
          for (let i = 0; i < n; i++)
            pots.push({
              x: n > 1 ? x0 + sp * i : (x0 + x1) / 2,
              y,
              s: 130 + r() * 40,
              t: (r() * 3) | 0,
              sd: (r() * 999) | 0,
              c: ['#C8643C', '#F2EFE9', '#3A3A38', '#D9B38C'][(r() * 4) | 0]
            });
        }
      if (pots.length) {
        funs.push({ k: 'plants', pots, z0: q.z0 });
        H.funParts.push({
          n: 'Half-round wall planters with drip trays (screwed into the battens) + plants',
          q: `${pots.length} planters`,
          sec: lab
        });
      }
    }
    if (pn.fun === 'bricks') {
      const P_ = 255,
        cols = Math.floor((Rr - L - 140) / P_),
        y0 = kidY(350),
        rows = Math.min(4, Math.floor((Math.min(1500, topMin - 150) - y0) / P_));
      if (cols >= 1 && rows >= 1) {
        const x0 = (L + Rr) / 2 - (cols * P_) / 2,
          BC = ['#4C9A52', '#2D7DD2', '#B8BDC2', '#E9C46A'],
          plates = [],
          br = [];
        for (let a = 0; a < rows; a++)
          for (let b = 0; b < cols; b++)
            plates.push({ x: x0 + b * P_, y: y0 + a * P_, c: BC[(a + b * 2 + ((r() * 2) | 0)) % BC.length] });
        for (let i = 0; i < cols * rows * 2; i++) {
          const w = [32, 64, 96, 128][(r() * 4) | 0];
          br.push({
            x: x0 + Math.floor((r() * (cols * P_ - w)) / 16) * 16,
            y: y0 + Math.floor((r() * (rows * P_ - 60)) / 19.2) * 19.2,
            w,
            h: 19.2 * (1 + ((r() * 3) | 0)),
            c: HOLDC[(r() * HOLDC.length) | 0]
          });
        }
        funs.push({ k: 'bricks', plates, br, P: P_, x0, x1: x0 + cols * P_, y0, y1: y0 + rows * P_, z0: q.z0 });
        H.funParts.push({
          n: 'Building-brick baseplates 255×255 mm, glued on with construction adhesive',
          q: `${plates.length} plates`,
          sec: lab
        });
      }
    }
    if (pn.fun === 'relief' && dy1 - dy0 > 400 && Rr - L > 300) {
      const x0a = L + 50,
        x1a = Rr - 50,
        cols = Math.max(1, Math.floor((x1a - x0a) / 220)),
        ts_ = (x1a - x0a) / cols,
        rows = Math.min(14, Math.floor((dy1 - dy0) / ts_)),
        tiles = [];
      for (let a = 0; a < rows; a++)
        for (let b = 0; b < cols; b++) tiles.push({ x: x0a + b * ts_, y: dy0 + a * ts_, o: (r() * 4) | 0 });
      if (tiles.length) {
        funs.push({ k: 'relief', tiles, s: ts_, fin, z0: q.z0 });
        H.funParts.push({
          n: `Relief tiles ${f0(ts_)}×${f0(ts_)} mm: 18 mm MDF planed to a wedge (18 → 4 mm), glued on in turned directions and painted with the wall`,
          q: `${tiles.length} tiles`,
          sec: lab
        });
      }
    }
    if (pn.chart && !faux) {
      const y1 = Math.min(1800, topMin - 50);
      funs.push({ k: 'chart', x: L + 25, y0: 0, y1 });
      items.push(
        wf(
          fp(
            [
              [L + 25, yb0 + 5],
              [L + 95, yb0 + 5],
              [L + 95, y1],
              [L + 25, y1]
            ],
            tf + 1 - q.z0,
            1,
            'front'
          ),
          'ral9001'
        )
      );
    }
    const nv = Math.ceil((Rr - L) / 400) + 1;
    H.battens.push({ sec: lab, n: nv + 2 + (hy0 != null ? 2 : 0), L: f0(Math.max(Rr - L, topMin)) });
    q.holdsN = holds.length;
  }
  ROLES.forEach(([k, l]) => {
    if (!finAllowed(M[k].type, M[k].fin))
      warns.push(
        `${l}: ${FIN[M[k].fin]?.name} isn't available as ${MATS[M[k].type]?.name.toLowerCase()} — pick another finish or board type.`
      );
  });
  const SS = S.sections || [];
  const n = SS.length;
  if (!n) {
    warns.push('Add at least one column.');
    return result;
  }
  let x0 = +K.side,
    x1 = W - +K.side;
  const per = boxes ? 2 * tc : tc,
    ws = SS.map(s => (+s.w > 0 ? +s.w : 0)),
    pinAt = {};
  SS.forEach((s, i) => {
    if (
      (s.base === 'panel' || s.base === 'door' || s.base === 'desk') &&
      s.pinX != null &&
      s.pinX !== '' &&
      isFinite(+s.pinX)
    )
      pinAt[i] = +s.pinX;
  });
  const pinIdx = Object.keys(pinAt)
    .map(Number)
    .sort((a, b) => a - b);
  let prevPin = -1;
  pinIdx.forEach(pi => {
    let v = pinAt[pi];
    if (pi === 0) {
      if (v < 0) v = 0;
      x0 = v;
    } else if (v < x0 + 150) {
      warns.push(`S${pi + 1}: this fixed column can't start at ${f0(v)} mm — the columns to its left need room.`);
      v = x0 + 150 * pi + per * pi;
    }
    if (prevPin >= 0 && v < pinAt[prevPin] + 50) v = pinAt[prevPin] + 50;
    pinAt[pi] = v;
    prevPin = pi;
  });
  const wruns = [];
  let a0 = 0,
    st = x0;
  pinIdx.forEach(pi => {
    if (pi > 0) wruns.push([a0, pi, st, pinAt[pi]]);
    a0 = pi;
    st = pinAt[pi];
  });
  wruns.push([a0, n, st, boxes ? x1 : x1 - tc, true]);
  wruns.forEach(([a, b, start, end, last]) => {
    if (b <= a) return;
    const span = end - start - (b - a) * per;
    let fixed = 0,
      autos = [];
    for (let i = a; i < b; i++) {
      if (+SS[i].w > 0) fixed += +SS[i].w;
      else autos.push(i);
    }
    if (!autos.length) {
      if (last && pinAt[a] != null && span - fixed >= 0) {
        x1 = x1 - (span - fixed);
        return;
      }
      autos = [b - 1];
      fixed -= ws[b - 1];
      if (Math.abs(span - fixed - ws[b - 1]) > 1)
        warns.push(
          `Columns S${a + 1}–S${b} add up to ${f0(fixed + ws[b - 1])} mm but ${f0(span)} mm is available${last ? '' : ' before the panel wall'} — S${b} was stretched to fit. Leave one width empty to make it automatic.`
        );
    }
    let aw = (span - fixed) / autos.length;
    if (aw < 150) {
      warns.push(
        `Not enough room for S${a + 1}–S${b}: automatic columns would be ${f0(aw)} mm. Reduce fixed widths${pinIdx.length ? ' or move the panel wall' : ''}. Until then the columns are drawn squeezed to fit.`
      );
      if (fixed > 0) {
        const k_ = Math.max(0.1, (span - autos.length * 150) / fixed);
        for (let i = a; i < b; i++) if (!autos.includes(i)) ws[i] = Math.max(60, ws[i] * k_);
      }
      aw = 150;
    }
    autos.forEach(i => (ws[i] = aw));
  });
  let cx = x0;
  const SKW =
    R.skew && R.skew.on && +R.skew.dL > 0 && +R.skew.dR > 0
      ? {
          dL: +R.skew.dL,
          dR: +R.skew.dR,
          at: x => +R.skew.dL + ((+R.skew.dR - +R.skew.dL) * Math.max(0, Math.min(W, x))) / W
        }
      : null;
  result.skew = SKW;
  const secs = SS.map((s, i) => {
    if (pinAt[i] != null) cx = pinAt[i];
    const lx = cx,
      xa = lx + tc,
      xb = xa + ws[i];
    cx = boxes ? xb + tc : xb;
    const skD = SKW
        ? Math.max(150, Math.min(D, Math.floor(Math.min(SKW.at(lx), SKW.at(boxes ? xb + tc : xb + tc)) / 10) * 10))
        : 0,
      dq0 = +s.depth > 0 ? Math.max(150, Math.min(+s.depth, skD || D)) : skD || D,
      bmp = bumps
        .filter(b => b.mode === 'shallow' && b.x < (boxes ? xb + tc : xb + tc) - 5 && b.x + b.w > lx + 5)
        .reduce((m, b) => Math.max(m, b.d), 0),
      dq = bmp ? Math.min(dq0, D - bmp - 10) : dq0,
      z0 = dq >= D || s.align === 'front' || SKW || bmp ? 0 : D - dq;
    return {
      pin: pinAt[i],
      s,
      i,
      w: ws[i],
      lx,
      rx: xb,
      xa,
      xb,
      D: dq,
      Dh: dq - tb - (GRV ? GRV_OFF : 0),
      Dc: GRV ? dq : dq - tb,
      z0,
      cap: Infinity,
      desk: s.base === 'desk',
      panel: s.base === 'panel',
      door: s.base === 'door',
      deskShut: s.base === 'desk' && (s.deskFront === 'doors' || s.deskFront === 'hidden'),
      free: s.base === 'free',
      mount: s.base === 'free' ? s.mount || 'legs' : null,
      Pq:
        s.base === 'free' && (s.mount || 'legs') !== 'plinth'
          ? s.mount === 'wall'
            ? Math.max(0, +s.floatY || 350)
            : Math.max(60, +s.legH || 160)
          : P,
      grp: null,
      follow: null
    };
  });
  // projector screen as one very wide drawer across the top of several columns
  let scrPre = null;
  {
    const SC = O.screen || {};
    if (SC.on && secs.length) {
      const cl_ = (v, a, b) => Math.max(a, Math.min(b, v));
      const E = secs.map((q, i) => {
        let m = Infinity;
        for (let x = q.lx; x <= q.rx + tc; x += 20) m = Math.min(m, ceilAt(x));
        m = Math.min(m, ceilAt(q.rx + tc)) - K.top;
        beams.forEach(b => {
          if (b.x < q.rx + tc && b.x + b.w > q.lx && D - b.depth < q.z0 + q.D)
            m = Math.min(m, b.depth >= D - q.z0 ? b.bottom - K.top : b.bottom - K.beamGap);
        });
        return {
          i,
          l: i === 0 || boxes ? q.lx : q.lx + tc / 2,
          r: i === n - 1 || boxes ? q.rx + tc : q.rx + tc / 2,
          top: m,
          ok: !q.panel && !q.door && !q.free && q.s.ownMode !== 'own' && q.z0 === 0 && q.D >= D - 1 && m > 900
        };
      });
      const dm = w => ({ w, h: w * 0.5625 }),
        STD = [3200, 3000, 2800, 2600, 2400, 2200, 2000, 1800, 1600, 1400, 1200, 1000, 900, 800, 700, 600],
        cas = cl_(+SC.cas || 90, 70, 140),
        Hb = cas + 44,
        wallC = (E[0].l + E[n - 1].r) / 2,
        pos = SC.pos || 'auto',
        xu = SC.x != null && SC.x !== '' ? +SC.x : pos === 'centre' ? W / 2 : null,
        wantW = +SC.w > 0 ? cl_(+SC.w, 600, 4000) : +SC.diag > 0 ? Math.round(+SC.diag * 22.14) : 0,
        wLo = !wantW && +SC.wMin > 0 ? +SC.wMin : 0,
        wHi = !wantW && +SC.wMax > 0 ? Math.max(+SC.wMax, wLo) : 0;
      if (wHi) {
        const k_ = STD.filter(d => d < wHi);
        STD.length = 0;
        STD.push(wHi, ...k_);
      }
      const hiTop = (() => {
        let m = 0;
        const need = dm(600).w + 160 + 2 * tc + 40;
        for (let a = 0; a < n; a++) {
          if (!E[a].ok) continue;
          let t = Infinity;
          for (let b = a; b < n && E[b].ok; b++) {
            t = Math.min(t, E[b].top);
            if (E[b].r - E[a].l >= need) {
              m = Math.max(m, t);
              break;
            }
          }
        }
        return m;
      })();
      const tryD = (d, minTop = -1e9) => {
        const d_ = dm(d),
          cl = d_.w + 160,
          need = cl + 2 * tc + 40;
        let best = null;
        for (let a = 0; a < n; a++) {
          if (!E[a].ok) continue;
          for (let b = a; b < n && E[b].ok; b++) {
            const wd = E[b].r - E[a].l;
            if (
              wd < need ||
              wd > Math.min(sheetOf(M.front.sheet).L, sheetOf(M.carcass.sheet).L) - 2 * (+O.trim || 0) - 10
            )
              continue;
            const yT = Math.min(...E.slice(a, b + 1).map(e => e.top)),
              c = (E[a].l + E[b].r) / 2,
              imgBot = yT - Hb - 80 - d_.h;
            if (yT < minTop) continue;
            const lo_ = E[a].l + cl / 2 + tc + 20,
              hi_ = E[b].r - cl / 2 - tc - 20,
              off = xu != null ? Math.abs(cl_(xu, lo_, hi_) - xu) : 0,
              score =
                (xu != null ? Math.abs(c - xu) * 4 + off * 40 : Math.abs(c - wallC) * 4) - yT * 1.5 + (wd - need) * 0.6;
            if (!best || score < best.score) best = { a, b, yT, c, imgBot, score, d, d_, cl, off };
          }
        }
        return best;
      };
      let pk = null,
        fit = 0;
      {
        let firstFit = null;
        for (const mt of xu != null ? [hiTop - 260, -1e9] : [hiTop - 260]) {
          for (const d of STD) {
            const t = tryD(d, mt);
            if (t && t.imgBot >= 480) {
              if (!firstFit) {
                firstFit = t;
                fit = d;
              }
              if (xu != null ? t.off < 25 : Math.abs(t.c - wallC) < 60) {
                if (!wantW) pk = t;
                break;
              }
            }
          }
          if (pk) break;
        }
        if (!pk && firstFit && !wantW) pk = firstFit;
      }
      let shrunk = 0;
      if (wantW) {
        pk = tryD(wantW);
        if (!pk) {
          for (const d of STD) {
            if (d >= wantW) continue;
            const t = tryD(d);
            if (t) {
              pk = t;
              shrunk = d;
              break;
            }
          }
        }
      }
      if (!pk) {
        for (const mt of [hiTop - 260, -1e9]) {
          for (const d of STD) {
            const t = tryD(d, mt);
            if (t && (t.imgBot >= 300 || d <= 800)) {
              pk = t;
              break;
            }
          }
          if (pk) break;
        }
      }
      if (!pk) {
        for (const d of STD) {
          const t = tryD(d);
          if (t) {
            pk = t;
            break;
          }
        }
      }
      if (pk && wLo && pk.d_.w < wLo - 1) {
        const t = tryD(wLo);
        if (t) pk = t;
        else
          warns.push(
            `Projector screen: your minimum width of ${f0(wLo)} mm does not fit on this wall — it is drawn ${f0(pk.d_.w)} mm wide.`
          );
      }
      if (pk && shrunk)
        warns.push(
          `Projector screen: a ${f0(wantW)} mm wide screen does not fit on this wall — it is drawn ${f0(shrunk)} mm wide instead.`
        );
      if (pk) {
        const l = E[pk.a].l,
          r = E[pk.b].r,
          xc = cl_(xu != null ? xu : pk.c, l + pk.cl / 2 + tc + 20, r - pk.cl / 2 - tc - 20);
        scrPre = Object.assign(pk, { l, r, xc, cas, Hb, fit, hiTop });
        for (let k = pk.a; k <= pk.b; k++) secs[k].scrCap = pk.yT - Hb;
      } else
        warns.push(
          `Projector screen: ${wantW ? `a ${f0(wantW)} mm wide screen needs about ${f0(wantW + 240)} mm of plain cabinet columns side by side` : 'there is no run of plain cabinet columns wide enough'} — doors, panel walls and freestanding or own-height columns can’t carry the screen drawer. Make two neighbouring columns plain cabinets, at least 900 mm wide together.${fit ? ` The widest that fits is about ${f0(fit)} mm.` : ''}`
        );
      if (pk && pos === 'centre' && Math.abs(scrPre.xc - xu) > 25)
        warns.push(
          `Projector screen: it can’t sit exactly in the middle of the wall here — it is ${f0(Math.abs(scrPre.xc - xu))} mm off centre. A door, panel wall or low column is in the way; a narrower screen may fit.`
        );
    }
  }
  secs.forEach((q, i) => {
    q.bL = i === 0 || boxes ? q.lx : q.lx + tc / 2;
    q.bR = i === n - 1 || boxes ? q.rx + tc : q.rx + tc / 2;
    const a0 = q.lx,
      a1 = q.rx + tc;
    beams.forEach(b => {
      if (b.x < a1 && b.x + b.w > a0 && D - b.depth < q.z0 + q.D) {
        q.cap = Math.min(q.cap, b.depth >= D - q.z0 ? b.bottom - K.top : b.bottom - K.beamGap);
        const inside = b.x >= a0 - 1 && b.x + b.w <= a1 + 1;
        if (!inside && ((b.x > a0 + 1 && b.x < a1 - 1) || (b.x + b.w > a0 + 1 && b.x + b.w < a1 - 1)))
          warns.push(
            `A beam edge falls inside S${i + 1}; the whole column is lowered to clear it. Line up a column edge with the beam to keep the neighbours full height.`
          );
      }
    });
    if (q.scrCap != null) q.cap = Math.min(q.cap, q.scrCap);
    const fTop = q.free ? Math.max(q.Pq + tc * 2 + 150, +q.s.freeH || 900) : Infinity;
    if (q.free && fTop > Math.min(ceilAt(q.lx), ceilAt(q.rx + tc)) - 10)
      warns.push(`S${i + 1}: the freestanding unit is taller than the ceiling allows here — it is cut down to fit.`);
    const ownT =
      !q.free && !q.panel && !q.door && q.s.ownMode === 'own'
        ? Math.max(q.Pq + tc * 2 + 150, +q.s.ownH || 2000)
        : Infinity;
    q.own = ownT < Infinity;
    if (q.own && ownT > Math.min(ceilAt(q.lx), ceilAt(q.rx + tc)) - K.top - 10) {
      q.own = false;
      warns.push(
        `S${i + 1}: its own height (${f0(ownT)} mm) is taller than the ceiling allows here — it runs to the ceiling instead.`
      );
    }
    q.top = x => Math.min(ceilAt(x) - K.top, q.cap, q.free ? fTop : Infinity, q.own ? ownT : Infinity);
    q.topPts = sampleLine(q.top, q.xa, q.xb);
    q.under = q.topPts.map((p, k, a) => {
      const s1 = k > 0 ? Math.abs(Math.atan2(p[1] - a[k - 1][1], p[0] - a[k - 1][0])) : 0,
        s2 = k < a.length - 1 ? Math.abs(Math.atan2(a[k + 1][1] - p[1], a[k + 1][0] - p[0])) : 0;
      return [p[0], p[1] - tc / Math.cos(Math.max(s1, s2))];
    });
    q.minU = Math.min(...q.under.map(p => p[1]));
    q.maxU = Math.max(...q.under.map(p => p[1]));
  });
  result.secs = secs;
  // openings spanning several sections
  const groups = result.groups;
  // a level that sticks out (dz > 0) or steps back (dz < 0): its contents and fronts are built as if the column were that much deeper / shallower
  const ZW = (q, fn) => (zr, k, a) => {
    const dz = zr.dzV || 0;
    if (!dz) return fn(zr, k, a);
    const o = [q.z0, q.D, q.Dh, q.Dc];
    q.z0 -= dz;
    q.D += dz;
    q.Dh += dz;
    q.Dc += dz;
    try {
      return fn(zr, k, a);
    } finally {
      q.z0 = o[0];
      q.D = o[1];
      q.Dh = o[2];
      q.Dc = o[3];
    }
  };
  secs.forEach((q, i) => {
    if (q.follow != null) return;
    const zs = q.s.zones || [],
      ko = q.desk ? (zs[0] && +zs[0].span > 0 ? 0 : -1) : zs.findIndex(z => z.type === 'opening' && +z.span > 0);
    if (ko < 0) return;
    const want = +zs[ko].span;
    let last = i;
    for (let j = 1; j <= want; j++) {
      const f = secs[i + j];
      if (!f) {
        warns.push(
          `S${i + 1}: the niche is set to run over ${want} more column${want > 1 ? 's' : ''}, but only ${n - 1 - i} ${n - 1 - i === 1 ? 'is' : 'are'} to its right.`
        );
        break;
      }
      if (f.desk !== q.desk || f.panel || f.door || q.door || f.D !== q.D || f.z0 !== q.z0) {
        warns.push(
          `S${i + 1}: the niche can't continue into S${i + j + 1} because that column has a different base or depth.`
        );
        break;
      }
      last = i + j;
    }
    if (last > i) {
      const gp = { lead: i, last, ko, members: secs.slice(i, last + 1) };
      gp.members.forEach((m, j) => {
        m.grp = gp;
        if (j) m.follow = i;
      });
      if (q.desk) {
        gp.desk = true;
        q.dgEnd = secs[last].xb;
        gp.members.forEach((m, j) => {
          if (!j) return;
          const o = {};
          Object.keys(q.s).forEach(k => {
            if (/^(desk|over$|ped|upD$)/.test(k)) o[k] = q.s[k];
          });
          m.s = Object.assign({}, m.s, o);
          m.deskShut = q.deskShut;
          m.dF = true;
        });
      }
      groups.push(gp);
    }
  });
  const shelfMax = Math.round((MATS[M.shelf.type]?.sag || 750) * Math.pow(ts / 18, 1.5));
  const _hs = [];
  secs.forEach(q => {
    _hs.push(JSON.stringify(H));
    const hzq = (xa, xb, y, t, a, b, role) => hz(xa, xb, y, t, a + q.z0, b + q.z0, role),
      fpq = (poly, z, t, role, tag, gU) => fp(poly, z - q.z0, t, role, tag, gU);
    const i = q.i,
      s = q.s,
      lab = 'S' + (i + 1),
      lead = q.follow != null ? secs[q.follow] : null,
      Z0 = lead ? lead.s.zones || [] : s.zones || [],
      nz = Z0.length,
      gp = q.grp;
    const glab = gp ? `S${gp.lead + 1}–S${gp.last + 1}` : lab,
      gEnd = gp ? gp.members[gp.members.length - 1].xb : q.xb;
    if (q.panel) {
      buildPanel(q);
      return;
    }
    if (q.w < 120) warns.push(`${lab} is only ${f0(q.w)} mm wide.`);
    const yB = q.desk ? +s.deskH : q.door ? 0 : q.Pq + tc;
    if (q.door) {
      if (q.w > 1250 && (+s.doorLeaves || 2) === 1 && s.doorStyle !== 'open')
        warns.push(`${lab}: a single ${f0(q.w)} mm door leaf is very wide — switch to double doors.`);
      if (q.w < 700)
        warns.push(
          `${lab}: a ${f0(q.w)} mm doorway is narrow — 780 mm or more is comfortable, 850 mm for wheelchairs.`
        );
      const ph = +(Z0[0] && Z0[0].h) || 0;
      if (ph && ph < 1950) warns.push(`${lab}: the doorway is only ${f0(ph)} mm high — 2015 mm is a standard door.`);
    }
    if (q.minU - yB < 150) {
      warns.push(
        `${lab}: the ceiling is too low here (${f0(q.minU)} mm under the top). Make this column narrower or move it.`
      );
    }
    // bottom / desk
    const spanBottom = gp && gp.ko === 0;
    if (q.door) {
    } else if (!q.desk) {
      if (!(spanBottom && lead)) {
        const bx1 = spanBottom ? gEnd : q.xb;
        addPanel({
          type: 'Bottom',
          role: 'carcass',
          fin: colDrench(q) || undefined,
          sec: spanBottom ? glab : lab,
          poly: rect(bx1 - q.xa, q.Dc),
          grain: 'w',
          band: q.free && q.mount !== 'plinth' ? 'all' : 'front',
          bandLen: bx1 - q.xa,
          notes: spanBottom
            ? ['Runs continuously under the opening']
            : q.free && q.mount === 'wall'
              ? ['Visible underside — band all edges; fix the unit with a French cleat or hanging rail']
              : []
        });
        items.push(wf(hzq(q.xa, bx1, q.Pq, tc, 0, q.Dc, 'carcass'), colDrench(q)));
      }
      H.legs += boxes ? (q.w > 700 ? 6 : 4) : q.w > 700 ? 2 : 0;
    } else if (q.dF) {
    } else {
      const dW_ = (q.dgEnd || q.xb) - q.xa,
        dlab = q.dgEnd ? glab : lab;
      const ov = q.deskShut ? -(tf + 25) : +s.over || 0;
      if (dW_ < 990)
        warns.push(
          `${lab}: the desk is only ${f0(q.w)} mm wide — make it at least 1000 mm (tap “Span two columns” in its settings).`
        );
      {
        const z0 = Z0[0],
          hr = z0 && nz > 1 ? (+z0.h > 0 ? +z0.h : null) : null;
        if (hr != null && hr < 500)
          warns.push(
            `${lab}: only ${f0(hr)} mm headroom above the desk — 500 mm is the minimum for a screen, 600+ feels open.`
          );
      }
      if (+s.deskH < 600 || +s.deskH > 1150)
        warns.push(`${lab}: desk height ${s.deskH} mm is unusual (sitting 720–760, standing 1000–1100).`);
      const gN = s.deskGrommet ? (dW_ > 1000 ? 2 : 1) : 0;
      H.grommets += gN;
      const gHoles = Array.from({ length: gN }, (_, j) => ({
        x: gN === 1 ? dW_ - 150 : j ? dW_ - 150 : 150,
        y: q.Dh + ov - 70,
        d: 60
      }));
      addPanel({
        type: 'Desk top',
        role: 'desk',
        sec: dlab,
        poly: rect(dW_, q.Dh + ov),
        holes: gHoles,
        grain: 'w',
        band: 'front',
        bandLen: dW_,
        notes: (q.dgEnd
          ? ['One piece under the separate cabinets above — it rests on the two outer sides and a rear batten']
          : []
        )
          .concat(gN ? [`${gN} × Ø60 cable grommet${gN > 1 ? 's' : ''}, 70 mm from the back edge`] : [])
          .concat([
            ov > 0
              ? `Overhangs carcass by ${ov} mm`
              : ov < 0
                ? `Set back ${-ov} mm so the doors close in front of it`
                : 'Flush with carcass front'
          ])
      });
      items.push(hzq(q.xa, q.dgEnd || q.xb, +s.deskH - td, td, -ov, q.Dh, 'desk'));
      if (dW_ > 1200 && td < 30)
        warns.push(`${lab}: a ${f0(dW_)} mm desk span in ${td} mm board will flex — add a rear batten or use 30 mm+.`);
    }
    if (q.free && q.mount === 'legs') {
      const lf = FIN[s.legFin] ? s.legFin : 'oak',
        lw = 40,
        xs = [q.bL + 40, q.bR - 40 - lw],
        zs = [40, q.Dh - 80];
      H.flegs = (H.flegs || 0) + 4;
      q.legs = { xs, lw, fin: lf };
      xs.forEach(x =>
        zs.forEach(zz =>
          items.push(
            wf(
              {
                k: 'prism',
                poly: [
                  [zz, 0],
                  [zz + lw, 0],
                  [zz + lw, q.Pq],
                  [zz, q.Pq]
                ],
                toW: (u, v) => [x, v, -u - q.z0],
                ext: [lw, 0, 0],
                role: 'carcass'
              },
              lf
            )
          )
        )
      );
    }
    if (q.free && q.mount === 'wall') H.cleats = (H.cleats || 0) + 1;
    // top panels
    const segs = [];
    for (let k = 0; k < q.topPts.length - 1; k++) {
      const [xa, ya] = q.topPts[k],
        [xb, yb] = q.topPts[k + 1];
      if (xb - xa > 0.5) segs.push({ xa, ya, xb, yb, ang: Math.atan2(yb - ya, xb - xa) * DEG });
    }
    for (let k = segs.length - 1; k >= 0 && segs.length > 1; k--) {
      const sg = segs[k];
      if (sg.xb - sg.xa >= 40) continue;
      const nb = k > 0 ? segs[k - 1] : segs[1],
        sl = (nb.yb - nb.ya) / (nb.xb - nb.xa);
      if (k > 0) {
        nb.yb = nb.ya + sl * (sg.xb - nb.xa);
        nb.xb = sg.xb;
      } else {
        nb.ya = nb.yb - sl * (nb.xb - sg.xa);
        nb.xa = sg.xa;
      }
      segs.splice(k, 1);
    }
    segs.forEach((sg, k) => {
      const L = Math.hypot(sg.xb - sg.xa, sg.yb - sg.ya),
        notes = [];
      const lc = k === 0 ? Math.abs(sg.ang) : Math.abs(sg.ang - segs[k - 1].ang) / 2,
        rc = k === segs.length - 1 ? Math.abs(sg.ang) : Math.abs(segs[k + 1].ang - sg.ang) / 2;
      if (lc > 0.2 || rc > 0.2)
        notes.push(
          `End cuts: left ∠${lc.toFixed(1)}° ${k === 0 ? 'to side' : 'mitre'}, right ∠${rc.toFixed(1)}° ${k === segs.length - 1 ? 'to side' : 'mitre'} (length is long point)`
        );
      if (Math.abs(drop) > 0.5)
        notes.push(`Front & back edges bevel ∠${Math.abs(Math.atan(drop / D) * DEG).toFixed(1)}°`);
      const Wd = Math.hypot(q.Dc, (drop * q.Dc) / D);
      addPanel({
        type: segs.length > 1 ? 'Top (sloped part)' : 'Top',
        role: 'carcass',
        fin: colDrench(q) || undefined,
        sec: lab,
        poly: rect(L, Wd),
        grain: 'w',
        band: 'front',
        bandLen: L,
        notes,
        angled: notes.length > 0
      });
      const vt = tc / Math.cos(sg.ang / DEG);
      items.push({
        k: 'prism',
        poly: rect(L, q.Dc),
        toW: (u, v) => [
          sg.xa + ((sg.xb - sg.xa) * u) / L,
          sg.ya + ((sg.yb - sg.ya) * u) / L - (drop * v) / D,
          -v - q.z0
        ],
        ext: [0, -vt, 0],
        role: 'carcass',
        grainU: true,
        fin: colDrench(q) || undefined
      });
      q.dren = colDrench(q);
    });
    q.segs = segs;
    // levels
    if (lead) {
      q.zones = lead.zones.map(lz => {
        const zr = { k: lz.k, z: lz.z, y0: lz.y0, h: lz.h, top: lz.top, divY: lz.divY, divT: lz.divT };
        if (zr.top) {
          zr.hMin = q.minU - zr.y0;
          zr.hMax = q.maxU - zr.y0;
          zr.h = zr.hMin;
          if (zr.hMin < 120)
            warns.push(`${lab}: not enough height above the shared niche — the ceiling is too low here.`);
        }
        return zr;
      });
    } else {
      q.splitK = -1;
      const ySide = q.desk || q.door ? 0 : q.Pq,
        gU = gp ? Math.max(...gp.members.map(m => m.maxU)) : q.maxU,
        gMn = gp ? Math.min(...gp.members.map(m => m.minU)) : q.minU,
        hSide = gU + tc - ySide;
      if (!q.door && !q.panel && hSide > MAXU && nz > 1) {
        let fx0 = 0,
          au0 = 0;
        Z0.forEach(z => {
          if (+z.h > 0) fx0 += +z.h;
          else au0++;
        });
        const sd0 = (nz - 1) * tc,
          aH0 = au0 ? (gMn - yB - sd0 - tc - fx0) / au0 : 0;
        let yy = yB;
        for (let k = 0; k < nz - 1; k++) {
          const h = +Z0[k].h > 0 ? +Z0[k].h : aH0,
            dY = yy + h;
          const low = dY + 2 * tc - ySide,
            up = gU + tc - (dY + tc);
          if (
            low <= MAXU &&
            up <= MAXU - 2 * tc &&
            Z0[k].type !== 'opening' &&
            !(q.desk && k === 0) &&
            !(gp && k <= gp.ko)
          )
            q.splitK = k;
          yy = dY + tc;
        }
      }
      if (boxes && !q.free && !q.door && !q.panel && q.splitK < 0) {
        const dg = Math.min(Math.hypot(hSide, q.D), Math.hypot(hSide, q.bR - q.bL)),
          rm = Math.max(...cps.map(p => p.y));
        if (dg > rm - 10) {
          q.noTilt = Math.round(dg);
          warns.push(
            `${lab}: this box is ${f0(hSide)} mm tall and cannot be tilted upright after building it flat — its diagonal (${f0(dg)} mm) is more than the ${f0(rm)} mm ceiling. Build it standing in place (the guide says how), or split it into two stacked units in its settings.`
          );
        }
      }
      if (hSide > MAXU && !q.door && !q.panel && !(gp && q.follow != null) && q.splitK < 0)
        warns.push(
          `${lab}: ${f0(hSide)} mm tall — more than the ${f0(MAXU)} mm your boards allow. Tap “Split into two units” in its settings.`
        );
      if (q.follow != null && secs[q.follow] && !(q.splitK >= 0)) q.splitK = secs[q.follow].splitK ?? -1;
      const oSpan = gp ? gp.members[gp.members.length - 1].xb - gp.members[0].xa : q.w,
        visUp = k => !!(Z0[k + 1] && (Z0[k + 1].type === 'open' || Z0[k + 1].face === 'glass'));
      // structural: a header over a wide niche with open shelves above has no front rail to stiffen it, so it is made 3 layers thick; a doorway wider than 800 mm gets a double head
      const divT = k =>
        Z0[k].type === 'opening' && Z0[k].header !== false
          ? visUp(k) && oSpan > 900
            ? 3 * tc
            : 2 * tc
          : (Z0[k].type === 'passage' && q.w > 800) || k === q.splitK
            ? 2 * tc
            : tc;
      let sumDiv = 0;
      for (let k = 0; k < nz - 1; k++) sumDiv += divT(k);
      let fx = 0,
        au = [];
      Z0.forEach((z, k) => {
        if (+z.h > 0) fx += +z.h;
        else au.push(k);
      });
      const refU = gp ? Math.min(...gp.members.map(m => m.minU)) : q.minU;
      const avail = refU - yB - sumDiv;
      let aH = au.length ? (avail - fx) / au.length : 0;
      let kH = 1;
      if (fx > 0 && (au.length ? aH < 80 : fx > avail + 1)) {
        kH = Math.max(0.15, (avail - au.length * 80) / fx);
        if (au.length) {
          aH = 80;
          warns.push(
            `${lab}: the levels don't fit — ${f0(avail)} mm available, ${f0(fx)} mm of fixed heights. They are drawn squeezed to fit; reduce a level height.`
          );
        }
      }
      if (au.length && aH < 80) {
        warns.push(
          `${lab}: the levels don't fit — ${f0(avail)} mm available, ${f0(fx)} mm of fixed heights. Reduce a level height.`
        );
        aH = Math.max(aH, 80);
      }
      if (!au.length && nz && fx > avail + 1)
        warns.push(`${lab}: fixed level heights (${f0(fx)} mm) exceed the space (${f0(avail)} mm).`);
      let y = yB;
      q.zones = [];
      Z0.forEach((z, k) => {
        const h = +z.h > 0 ? +z.h * kH : aH,
          top = k === nz - 1,
          zr = { k, z, y0: y, h, top };
        q.zones.push(zr);
        if (!top) {
          zr.divY = y + h;
          zr.divT = divT(k);
          y = y + h + zr.divT;
        } else {
          zr.hMin = q.minU - y;
          zr.hMax = q.maxU - y;
          zr.h = zr.hMin;
        }
      });
    }
    q.zones.forEach(zr => {
      const v = Math.round(+zr.z.dz || 0),
        okT =
          ['closed', 'drawers', 'open'].includes(zr.z.type) &&
          !q.panel &&
          !q.door &&
          q.follow == null &&
          !(q.desk && zr.k === 0) &&
          !(+zr.z.span > 0);
      zr.dzV = !okT || !v ? 0 : v > 0 ? Math.min(400, v) : Math.max(-(q.Dh - 150), v);
      if (v && !okT)
        warns.push(
          `${lab}: level ${zr.k + 1} can't stick out or step back (only doors, drawers and open shelves can).`
        );
    });
    q.upD = q.desk && q.zones.length > 1 && +s.upD > 0 ? Math.max(200, Math.min(q.Dh - 100, +s.upD)) : 0;
    const recOff = q.upD ? q.Dh - q.upD : 0;
    if (q.upD && q.zones[0] && q.zones[0].h < 550)
      warns.push(
        `${lab}: the cabinet above the desk starts only ${f0(q.zones[0].h)} mm over the desk top — with a shallow cabinet 550–650 mm still feels comfortable.`
      );
    // dividers + headers
    q.zones.forEach(zr => {
      if (zr.top) return;
      const spanDiv = gp && (zr.k === gp.ko - 1 || zr.k === gp.ko);
      if (spanDiv && lead) {
        zr.divIv = null;
        return;
      }
      const yt = zr.divY + zr.divT;
      let iv;
      if (spanDiv)
        iv = gp.members.every(m => {
          const v = okInterval(m.under, yt);
          return v && v[1] - v[0] >= m.w - 1;
        })
          ? [q.xa, gEnd]
          : null;
      else iv = okInterval(q.under, yt);
      if (!iv) {
        warns.push(`${lab}: level ${zr.k + 1} reaches above the ceiling.`);
        return;
      }
      if (q.follow != null && secs[q.follow] && !(q.splitK >= 0)) q.splitK = secs[q.follow].splitK ?? -1;
      zr.divIv = iv;
      const L = iv[1] - iv[0],
        isHead = zr.divT > tc,
        short = !spanDiv && L < q.w - 1,
        dl = spanDiv ? glab : lab;
      const isSplit = zr.k === q.splitK,
        nm = isSplit
          ? 'Top (lower unit)'
          : zr.z.type === 'seat'
            ? 'Seat board'
            : zr.z.type === 'passage'
              ? 'Door head (lining)'
              : isHead
                ? 'Header layer'
                : spanDiv
                  ? zr.k === gp.ko
                    ? 'Opening top'
                    : 'Opening sill'
                  : 'Fixed divider';
      const dOff = recOff && !spanDiv ? recOff : 0,
        dDep = GRV && !isSplit && !q.door && !q.noBack && (q.s.back || 'full') === 'full' ? q.Dh : q.Dc;
      const up_ = Z0[zr.k + 1],
        hFin =
          isHead && up_ && up_.type === 'open' && up_.drench && FIN[up_.inFin] ? up_.inFin : colDrench(q) || undefined;
      zr.divFin = hFin || null; // header under a colour-drenched open level takes its colour
      for (let l = 0; l < (isSplit ? 2 : isHead ? Math.round(zr.divT / tc) : 1); l++)
        addPanel({
          type:
            isSplit && l === 1
              ? 'Bottom (upper unit)'
              : dOff && zr.k === 0
                ? 'Bottom of the cabinet above the desk'
                : nm,
          role: 'carcass',
          fin: hFin,
          sec: dl,
          poly: rect(L, dDep - dOff),
          grain: 'w',
          band: 'front',
          bandLen: L,
          notes: [
            isHead ? `Glue + screw ${Math.round(zr.divT / tc)} layers into one ${f0(zr.divT)} mm header` : '',
            spanDiv ? 'Continuous across the shared opening' : '',
            short ? 'Shortened by ceiling slope' : '',
            dOff ? `Shallow cabinet: ${f0(dDep - dOff)} deep, set ${f0(dOff)} mm back from the front of the sides` : '',
            dDep < q.Dc
              ? `${f0(q.Dc - dDep)} mm shallower than the sides: it stops in front of the back panel, which runs past it in one piece`
              : ''
          ].filter(Boolean)
        });
      items.push(wf(hzq(iv[0], iv[1], zr.divY, zr.divT, dOff, dDep, 'carcass'), hFin));
      if (isHead) {
        const nzr_ = q.zones[zr.k + 1],
          rh = Math.max(0, Math.min(100, (nzr_ ? (nzr_.top ? nzr_.hMin : nzr_.h) : 100) - tc - 2));
        if (rh >= 40) {
          let rIv = spanDiv && gp ? gp.members.map(m => [m.xa, m.xb]) : [[iv[0], iv[1]]];
          {
            const nz_ = Z0[zr.k + 1],
              vr0 = (nz_ && Array.isArray(nz_.vd) ? nz_.vd : []).map(Number).filter(v => isFinite(v));
            rIv = rIv.flatMap(([ra0, rb0]) => {
              const base = spanDiv && gp ? ra0 : q.xa;
              let o_ = [[ra0, rb0]];
              const pe_ = boxes ? tc : tc / 2,
                va_ = nz_ ? autoVd(nz_, ra0 - pe_, rb0 + pe_, ra0) : null,
                vr = va_ ? va_ : vr0.slice();
              if (nz_ && nz_.type === 'drawers') {
                const w_ = rb0 - ra0,
                  nc = Math.max(1, Math.ceil(w_ / (ECO ? 900 : 1200))),
                  bw = (w_ - (nc - 1) * tc) / nc;
                for (let c = 1; c < nc; c++) vr.push(c * bw + (c - 1) * tc + tc / 2);
              }
              vr.sort((a_, b_) => a_ - b_).forEach(v0 => {
                const v = base + v0;
                o_ = o_.flatMap(([ra, rb]) =>
                  v - tc / 2 > ra + 20 && v + tc / 2 < rb - 20
                    ? [
                        [ra, v - tc / 2],
                        [v + tc / 2, rb]
                      ]
                    : [[ra, rb]]
                );
              });
              return o_;
            });
          }
          const nzV = !!(Z0[zr.k + 1] && (Z0[zr.k + 1].type === 'open' || Z0[zr.k + 1].face === 'glass')),
            rFin = nzV && FIN[Z0[zr.k + 1].inFin] ? Z0[zr.k + 1].inFin : undefined;
          zr.hRailsN = nzV ? 1 : 2;
          rIv.forEach(([ra, rb]) => hRails.push({ xa: ra, xb: rb, y0: yt, y1: yt + rh, rear: nzV }));
          rIv.forEach(([ra, rb]) => {
            addPanel({
              type: 'Header rail (rear)',
              role: 'carcass',
              fin: rFin,
              sec: dl,
              poly: rect(rb - ra, rh),
              grain: 'w',
              notes: ['On edge on top of header, against back; screw to sides + wall studs'].concat(
                rIv.length > 1 ? ['One per column: fits between the uprights that stand on the header'] : [],
                nzV
                  ? [
                      'The shelves above are open, so there is no front rail: this rear rail and the thick header carry the load'
                    ]
                  : []
              )
            });
            if (!nzV)
              addPanel({
                type: 'Header rail (front)',
                role: 'carcass',
                sec: dl,
                poly: rect(rb - ra, rh),
                grain: 'w',
                notes: ['On edge on top of header, 20 mm behind front; screw to sides']
              });
          });
          rIv.forEach(([ra, rb]) => {
            items.push(
              wf(
                {
                  k: 'prism',
                  poly: [
                    [ra, yt],
                    [rb, yt],
                    [rb, yt + rh],
                    [ra, yt + rh]
                  ],
                  toW: (u, v) => [u, v, -(q.Dh - tc) - q.z0],
                  ext: [0, 0, -tc],
                  role: 'carcass'
                },
                rFin
              )
            );
            if (!nzV)
              items.push({
                k: 'prism',
                poly: [
                  [ra, yt],
                  [rb, yt],
                  [rb, yt + rh],
                  [ra, yt + rh]
                ],
                toW: (u, v) => [u, v, -20 - q.z0],
                ext: [0, 0, -tc],
                role: 'carcass'
              });
          });
        }
        zr.headerNote = `${f0(zr.divT)} mm header + ${zr.hRailsN === 1 ? 'rear rail' : '2 rails'}`;
        if (zr.z.type === 'opening' && L > 1600 && nzr_)
          warns.push(
            `${dl}: the niche is ${f0(L)} mm wide with cabinets standing on it — more than a board header can carry without sagging (about 1600 mm). Make the niche narrower, or have a steel flat bar (50 × 8 mm) let into the header.`
          );
        if (L > 900) {
          H.angles.push({ sec: dl, L: f0(L) });
          zr.headerNote += ' + steel angle';
        }
      }
    });
    // open-zone box linings
    // levels that stick out get a sleeve: two sides + a top and a bottom in carcass board, in front of the carcass edges
    q.zones.forEach((zr, k) => {
      const dz = zr.dzV || 0;
      if (dz <= 0) return;
      if (zr.top) {
        const pts = sampleLine(x => underAt(q, x), q.xa, q.xb).map(p_ => p_[1]);
        if (Math.max(...pts) - Math.min(...pts) > 2) {
          zr.dzV = 0;
          warns.push(`${lab}: the top level is under the slope, so it can't stick out — only flat-topped levels can.`);
          return;
        }
      }
      const zs = q.zones,
        dzB = k > 0 ? zs[k - 1].dzV || 0 : 0,
        dzT = zr.top ? 0 : zs[k + 1].dzV || 0,
        fin = colDrench(q) || undefined,
        yb = zr.y0 - (k === 0 ? tc : zs[k - 1].divT || tc),
        yt = zr.y0 + zr.h + (zr.top ? tc : zr.divT || tc),
        x0 = q.xa - tc,
        x1 = q.xb + tc,
        nt = `Sleeve that makes level ${k + 1} stick out ${f0(dz)} mm: glue and screw it to the front edges of the carcass`;
      [
        [x0, q.xa],
        [q.xb, x1]
      ].forEach(([a, b]) => {
        items.push(
          wf(
            fpq(
              [
                [a, yb],
                [b, yb],
                [b, yt],
                [a, yt]
              ],
              dz,
              dz,
              'carcass'
            ),
            fin
          )
        );
        addPanel({
          type: 'Stick-out sleeve (side)',
          role: 'carcass',
          fin,
          sec: lab,
          poly: rect(dz, yt - yb),
          grain: 'h',
          band: 'front',
          bandLen: yt - yb,
          notes: [nt]
        });
      });
      const hb = (ya, d) => {
        items.push(
          wf(
            fpq(
              [
                [q.xa, ya],
                [q.xb, ya],
                [q.xb, ya + tc],
                [q.xa, ya + tc]
              ],
              d,
              d,
              'carcass'
            ),
            fin
          )
        );
        addPanel({
          type: 'Stick-out sleeve (top/bottom)',
          role: 'carcass',
          fin,
          sec: lab,
          poly: rect(q.xb - q.xa, d),
          grain: 'w',
          band: 'front',
          bandLen: q.xb - q.xa,
          notes: [nt]
        });
      };
      if (dz > dzB) hb(yb, dz);
      if (dz >= dzT) hb(yt - tc, dz);
      H.sleeves = (H.sleeves || 0) + 1;
    });
    q.zones.forEach(
      ZW(q, zr => {
        const z = zr.z;
        zr.inFin = FIN[z.inFin] ? z.inFin : null;
        if (z.type !== 'open' || !z.box) return;
        if (zr.top) {
          const bt = +z.boxT > 0 ? +z.boxT : tf,
            ext = boxExt(z),
            dep = q.Dh + ext,
            fin = boxFinOf(z),
            x0_ = q.xa,
            x1_ = q.xb,
            y0_ = zr.y0,
            pts = sampleLine(x => underAt(q, x), x0_, x1_),
            nt = `Projects ${ext} mm past the carcass ${Math.abs(ext - tf) < 0.6 ? 'so its front edge is flush with the doors' : '(the doors are ' + tf + ' mm thick)'}`;
          const yL = underAt(q, x0_),
            yR = underAt(q, x1_);
          if (Math.min(yL, yR) - y0_ < 2 * bt + 60) {
            warns.push(`${lab}: the open level is too low under the slope for a box lining.`);
            return;
          }
          addPanel({
            type: 'Open box (bottom)',
            role: 'front',
            fin,
            t: bt,
            sec: lab,
            poly: rect(x1_ - x0_, dep),
            grain: 'w',
            band: 'front',
            bandLen: x1_ - x0_,
            notes: [nt]
          });
          items.push(wf(hzq(x0_, x1_, y0_, bt, -ext, q.Dh, 'front'), fin));
          [
            [x0_, yL],
            [x1_ - bt, yR]
          ].forEach(([x, yt]) => {
            const h_ = yt - bt - (y0_ + bt);
            addPanel({
              type: 'Open box (side)',
              role: 'front',
              fin,
              t: bt,
              sec: lab,
              poly: rect(h_, dep),
              grain: 'h',
              band: 'front',
              bandLen: h_,
              notes: [nt].concat(pts.length > 2 ? ['Top end cut to the slope of the top lining'] : [])
            });
            items.push({
              k: 'prism',
              poly: [
                [-ext, y0_ + bt],
                [q.Dh, y0_ + bt],
                [q.Dh, yt - bt],
                [-ext, yt - bt]
              ],
              toW: (u, v) => [x, v, -u - q.z0],
              ext: [bt, 0, 0],
              role: 'front',
              fin
            });
          });
          for (let j = 1; j < pts.length; j++) {
            const [ax, ay] = pts[j - 1],
              [bx, by] = pts[j],
              L_ = Math.hypot(bx - ax, by - ay);
            if (L_ < 20) continue;
            addPanel({
              type: 'Open box (top)',
              role: 'front',
              fin,
              t: bt,
              sec: lab,
              poly: rect(L_, dep),
              grain: 'w',
              band: 'front',
              bandLen: L_,
              notes: [nt].concat(
                Math.abs(by - ay) > 1
                  ? ['Sloped: glue under the cabinet top, mitre the ends where it meets the next piece']
                  : []
              )
            });
            items.push({
              k: 'prism',
              poly: [
                [ax, ay],
                [bx, by],
                [bx, by - bt],
                [ax, ay - bt]
              ],
              toW: (u, v) => [u, v, ext - q.z0],
              ext: [0, 0, -dep],
              role: 'front',
              fin
            });
          }
          zr.lined = bt;
          linings.push({ x0: x0_, x1: x1_, y0: y0_, y1: Math.max(...pts.map(p_ => p_[1])), bt, fin, top: pts });
          return;
        }
        const bt = +z.boxT > 0 ? +z.boxT : tf,
          ext = boxExt(z),
          dep = q.Dh + ext,
          fin = boxFinOf(z),
          x0_ = q.xa,
          x1_ = q.xb,
          y0_ = zr.y0,
          y1_ = zr.y0 + zr.h,
          nt = `Projects ${ext} mm past the carcass ${Math.abs(ext - tf) < 0.6 ? 'so its front edge is flush with the doors' : '(the doors are ' + tf + ' mm thick)'}`;
        for (let l = 0; l < 2; l++)
          addPanel({
            type: 'Open box (top/bottom)',
            role: 'front',
            fin,
            t: bt,
            sec: lab,
            poly: rect(x1_ - x0_, dep),
            grain: 'w',
            band: 'front',
            bandLen: x1_ - x0_,
            notes: [nt]
          });
        for (let l = 0; l < 2; l++)
          addPanel({
            type: 'Open box (side)',
            role: 'front',
            fin,
            t: bt,
            sec: lab,
            poly: rect(zr.h - 2 * bt, dep),
            grain: 'h',
            band: 'front',
            bandLen: zr.h - 2 * bt,
            notes: [nt]
          });
        items.push(wf(hzq(x0_, x1_, y0_, bt, -ext, q.Dh, 'front'), fin));
        items.push(wf(hzq(x0_, x1_, y1_ - bt, bt, -ext, q.Dh, 'front'), fin));
        [x0_, x1_ - bt].forEach(x =>
          items.push({
            k: 'prism',
            poly: [
              [-ext, y0_ + bt],
              [q.Dh, y0_ + bt],
              [q.Dh, y1_ - bt],
              [-ext, y1_ - bt]
            ],
            toW: (u, v) => [x, v, -u - q.z0],
            ext: [bt, 0, 0],
            role: 'front',
            fin
          })
        );
        zr.lined = bt;
        linings.push({ x0: x0_, x1: x1_, y0: y0_, y1: y1_, bt, fin });
      })
    );
    // shelves + rail
    q.zones.forEach(
      ZW(q, zr => {
        const z = zr.z;
        zr.shelvesY = [];
        const ns = z.type === 'open' || z.type === 'closed' ? Math.max(0, +z.shelves || 0) : 0;
        const gmm =
            gp && zr.top
              ? [Math.min(...gp.members.map(m => m.minU)), Math.max(...gp.members.map(m => m.maxU))]
              : [q.minU, q.maxU],
          ref =
            (zr.top ? (z.rail || z.fit === 'lift' ? q.minU : (gmm[0] + gmm[1]) / 2) : zr.y0 + zr.h) -
            (zr.top && zr.lined ? zr.lined : 0); // columns under one shared opening share shelf heights
        const vdA = autoVd(z, q.bL, q.bR, q.xa);
        zr.vdAuto = !!vdA;
        let lift = false;
        if (z.fit && FITS[z.fit] && FITS[z.fit].multi && !(+z.fitN > 0)) z.fitN = 1;
        const hr_ = hRails.filter(r_ => Math.abs(r_.y0 - zr.y0) < 1 && r_.xb > q.xa + 5 && r_.xa < q.xb - 5),
          yz = Math.max(
            zr.y0,
            hr_.reduce((m_, r_) => Math.max(m_, r_.y1), 0)
          ),
          yzV = hr_.length && hr_.every(r_ => r_.rear) ? zr.y0 : yz; // yzV: where the open space starts for the eye (a rear-only rail hides behind the books)
        const zb = (() => {
          zr.fit = null;
          if (z.type !== 'closed' || !z.fit || !FITS[z.fit] || z.dog) return yz;
          const F = FITS[z.fit],
            fl = `${lab}: the ${F.n.toLowerCase()}`;
          if ((Array.isArray(z.vd) && z.vd.length) || vdA) {
            warns.push(
              `${fl} needs the full width of the level — ${vdA ? 'use one or two doors there (three or more doors need uprights to hinge on)' : 'remove the vertical dividers there'}; for now it is left out.`
            );
            return yz;
          }
          if (q.w < F.minW || q.w > F.maxW) {
            warns.push(
              `${fl} needs an inside width of ${F.minW}–${F.maxW} mm; this column is ${f0(q.w)} mm inside — left out.`
            );
            return yz;
          }
          if (q.Dh < F.minD) {
            warns.push(`${fl} needs ${F.minD} mm of depth inside; there is ${f0(q.Dh)} mm — left out.`);
            return yz;
          }
          if (z.doorMode === 'slide')
            warns.push(
              `${fl} sits behind sliding doors — it only pulls out when the door in front of it is slid fully aside; hinged doors work better here.`
            );
          if (z.fit === 'larder') {
            const lh = ref - yz;
            if (lh < 1000) {
              warns.push(
                `${fl} needs at least 1000 mm of height (1500–2000 is usual); this level has ${f0(lh)} mm — left out.`
              );
              return yz;
            }
            if (lh > 2150)
              warns.push(
                `${fl} is made up to about 2000 mm high; this level is ${f0(lh)} mm — lower it and put a small cupboard above.`
              );
            if (+z.shelves > 0)
              warns.push(`${fl} fills the whole level — the shelves there are in its way; set shelves to 0.`);
            if (z.rail) warns.push(`${fl} and a clothes rail can't share a level.`);
            if ((+z.doors || 1) > 1)
              warns.push(`${fl} carries one door, fixed to its frame — set this level to 1 door.`);
            if (z.doorMode && z.doorMode !== 'hinged')
              warns.push(`${fl} needs a plain door: the door is fixed to the frame and pulls straight out.`);
            const nb = Math.max(3, Math.min(6, Math.floor((lh - 150) / 300)));
            zr.fit = { kind: 'larder', n: nb, y0: yz, y1: ref };
            zr.larder = true;
            H.fit.push({ kind: 'larder', sec: lab, w: q.w, n: 1 });
            H.funParts.push({
              n: 'Door-mounting brackets for the larder pull-out (come with it)',
              q: '1 set',
              sec: lab
            });
            return ref;
          }
          if (z.fit === 'lift') {
            if (ref < 1700)
              warns.push(
                `${fl} is meant for rails above head height (about 1.9 m and up); here the rail sits at ${f0(ref - 90)} mm, so an ordinary rail does the same job for less.`
              );
            lift = true;
            zr.fit = { kind: 'lift', n: 1 };
            H.fit.push({ kind: 'lift', sec: lab, w: q.w, n: 1 });
            return yz;
          }
          let n = F.multi ? Math.max(1, Math.min(6, +z.fitN || 1)) : 1;
          const cap = Math.floor((ref - yz - (z.rail ? 700 : 120)) / F.h);
          if (cap < 1) {
            warns.push(
              `${fl} doesn't fit in this level — it needs ${F.h} mm of height${z.rail ? ' under the hanging clothes' : ''}.`
            );
            return yz;
          }
          if (n > cap) {
            warns.push(`${lab}: only ${cap} of the ${n} ${F.s.toLowerCase()} fit in this zone.`);
            n = cap;
          }
          if (z.fit === 'suitcase' && zr.y0 < 1500)
            warns.push(
              `${fl} is best in the top level, up high, where nothing else fits — here it starts at ${f0(zr.y0)} mm.`
            );
          if (z.fit === 'mirror' && ref - yz < 1050)
            warns.push(`${fl} needs about 1050 mm of height to pull out; this level has ${f0(ref - yz)} mm.`);
          zr.fit = { kind: z.fit, n, h: F.h, y0: yz };
          H.fit.push({ kind: z.fit, sec: lab, w: q.w, n });
          if (z.fit === 'idrawer' || z.fit === 'jewel') {
            const sl = SLIDES.filter(v => v <= q.Dh - 30).pop() || 250;
            for (let j = 0; j < n; j++) {
              H.slides[sl] = (H.slides[sl] || 0) + 1;
              drawerBox(
                lab,
                q.w - 2 * tc,
                sl,
                z.fit === 'jewel' ? 100 : F.h,
                z.fit === 'jewel'
                  ? 'Shallow internal drawer for the jewellery insert.'
                  : 'Internal drawer behind the door.'
              );
              for (let l = 0; l < 2; l++)
                addPanel({
                  type: 'Runner packer (internal drawer)',
                  role: 'carcass',
                  sec: lab,
                  poly: rect(sl, 80),
                  grain: 'w',
                  band: 'front',
                  bandLen: sl,
                  notes: [
                    'Screw flat to the cabinet side, front edge 5 mm behind the door. The runner screws onto it, so the drawer clears the door and its hinges'
                  ]
                });
            }
          }
          return yz + n * F.h + 10;
        })();
        const ys = [],
          near_ = (a, b) => Math.abs(a - b) < 1;
        if ((z.rail || lift) && z.type === 'closed') {
          const man = !lift && (z.railUp != null || z.railDn != null),
            nTot = man ? Math.max(0, +z.railUp || 0) + Math.max(0, +z.railDn || 0) : Math.max(0, +z.shelves || 0),
            lo = zb + 400,
            hi = ref - 90;
          let dbl = !lift && !!z.rail2;
          if (dbl && hi - zb < 1740) {
            dbl = false;
            warns.push(
              `${lab}: two rails above each other need about 1.75 m of height (two rows of shirts); there is ${f0(hi - zb)} mm here, so it has one rail.`
            );
          }
          const RR = railReach(S),
            dflt = dbl
              ? Math.min(hi, Math.max(RR.easy, zb + 1760))
              : Math.max(lo, Math.min(hi, RR.ideal, ref - 80 - (nTot ? ts + 70 : 0)));
          const want = lift ? hi : +z.railH > 0 ? +z.railH : dflt;
          zr.railY = Math.max(dbl ? zb + 1740 : lo, Math.min(want, hi));
          const y2 = dbl ? Math.round(zb + (zr.railY - zb - 40) / 2) : null;
          zr.rail2Y = y2;
          zr.railAuto = lift || !(+z.railH > 0);
          if (!lift && +z.railH > 0 && Math.abs(zr.railY - want) > 1)
            warns.push(
              `${lab}: the rail can't go at ${f0(want)} mm here — placed at ${f0(zr.railY)} mm (allowed ${f0(lo)}–${f0(hi)}).`
            );
          const y1 = zr.railY + 70,
            spA = ref - y1,
            capA = spA >= ts + 10 ? 1 + Math.max(0, Math.floor((spA - ts) / (240 + ts))) : 0,
            na = Math.min(man ? Math.max(0, +z.railUp || 0) : nTot, capA);
          let nb = man ? Math.max(0, +z.railDn || 0) : nTot - na;
          if (man && (+z.railUp || 0) > capA)
            warns.push(
              `${lab}: only ${capA} shel${capA === 1 ? 'f fits' : 'ves fit'} above the rail — lower the rail to make room for more.`
            );
          const spB = (dbl ? y2 - 850 : zr.railY - 700) - zb,
            capB = Math.max(0, Math.floor(spB / (200 + ts)));
          if (nb > capB) {
            warns.push(
              `${lab}: ${nb - capB} shelf${nb - capB > 1 ? 'ves' : ''} didn't fit above or below the rail and ${nb - capB > 1 ? 'were' : 'was'} left out — move the rail or use fewer shelves.`
            );
            nb = capB;
          }
          zr.na = na;
          zr.nb = nb;
          if (na) {
            ys.push(y1);
            const rest = na - 1;
            if (rest > 0) {
              const span = ref - (y1 + ts),
                sp = (span - rest * ts) / (rest + 1);
              for (let j = 0; j < rest; j++) ys.push(y1 + ts + sp * (j + 1) + ts * j);
            }
          }
          zr.hangFloor = zb;
          if (nb) {
            const sp = (spB - nb * ts) / (nb + 1);
            for (let j = 0; j < nb; j++) ys.push(zb + sp * (j + 1) + ts * j);
            zr.hangFloor = zb + sp * nb + ts * nb;
          }
          if (!lift && zr.railY > RR.easy + (dbl ? 200 : 5)) {
            warns.push(
              `${lab}: the clothes rail at ${f0(zr.railY)} mm is above easy reach (≈${f0(RR.easy)} mm for someone ${f0(RR.h)} mm tall) — lower it, or use a pull-down rail.`
            );
            result.railHigh = (result.railHigh || 0) + 1;
          }
          const drop = dbl ? Math.min(zr.railY - y2 - 40, y2 - zr.hangFloor) : zr.railY - zr.hangFloor;
          if (drop < 850)
            warns.push(
              `${lab}: ${f0(drop)} mm of hanging space under the rail — fine for shirts and folded trousers, too short for coats or dresses.`
            );
          if (zr.railY > zr.y0 + 200 && q.Dh < 470)
            warns.push(
              `${lab}: a hanging rail needs about 550 mm of depth inside (a hanger is 420–450 mm wide plus sleeves); here there is ${f0(q.Dh)} mm, so clothes will stick out or the doors won't close. Use shelves here, or a pull-out rail that faces the front.`
            );
          if (zr.railY > zr.y0 + 200) {
            if (lift) zr.lift = 1;
          } else {
            zr.railY = null;
            zr.rail2Y = null;
          }
        } else if (ns) {
          const b_ = zb === yz ? yzV : zb,
            sy = shelfYs(b_, ref, ns, ts, z.space),
            sp = sy.min;
          sy.ys = sy.ys.map(y => Math.max(y, zb));
          if (sp < 140)
            warns.push(
              `${lab}: shelves in level ${zr.k + 1} are only ${f0(sp)} mm apart${zr.fit ? ' above the ' + FITS[zr.fit.kind].s.toLowerCase() : ''}.`
            );
          ys.push(...sy.ys);
        }
        const dren = z.type === 'open' && z.drench && zr.inFin ? zr.inFin : null;
        zr.drench = dren;
        let vd = vdA
          ? vdA
          : (z.type === 'open' || z.type === 'closed') && Array.isArray(z.vd)
            ? (z.vdMode && z.vd.length ? doorVd(q, z) || vdPos(z.vd.length, z.vdMode, q.w, tc, zr.lined || 0) : z.vd.map(Number))
                .filter(v => v > 60 && v < q.w - 60)
                .sort((a, b) => a - b)
            : [];
        zr.vdSag = 0;
        if (
          !vd.length &&
          (z.type === 'open' || z.type === 'closed') &&
          ns > 0 &&
          !z.rail &&
          !z.dog &&
          !z.noAutoVd &&
          !(q.desk && zr.k === 0) &&
          !z.ledge
        ) {
          // shelves that would sag under a moderate load get evenly spaced dividers
          const ld = z.load === 'books' ? 'books' : 'normal',
            lb = zr.lined || 0,
            dep = q.Dh - 20,
            sagR = n => sagOf((q.w - 2 * lb - n * tc) / (n + 1), dep, ts, M.shelf.type, ld).r;
          if (sagR(0) > 1.3) {
            let n = 1;
            while (n < 4 && sagR(n) > 1.3) n++;
            if ((q.w - 2 * lb - n * tc) / (n + 1) >= 150) {
              vd = vdPos(n, 'even', q.w, tc, lb);
              zr.vdSag = n;
            }
          }
        }
        zr.vdUsed = vd;
        const comps = [];
        {
          let a = q.xa;
          vd.forEach(v => {
            comps.push([a, q.xa + v - tc / 2]);
            a = q.xa + v + tc / 2;
          });
          comps.push([a, q.xb]);
        }
        zr.comps = comps;
        zr.vdx = vd.map(v => q.xa + v);
        zr.cIns = [];
        const insert = (cl, cr, fin, kind, why) => {
          const lb = zr.lined || 0;
          if (near_(cl, q.xa)) cl += lb;
          if (near_(cr, q.xb)) cr -= lb;
          const y0 = zr.y0 + lb,
            poly = zr.top
              ? [[cl, y0], [cr, y0], ...sampleLine(x => underAt(q, x), cl, cr).reverse()]
              : [
                  [cl, y0],
                  [cr, y0],
                  [cr, zr.y0 + zr.h - lb],
                  [cl, zr.y0 + zr.h - lb]
                ];
          if (Math.max(...poly.map(p => p[1])) - y0 < 80 || cr - cl < 60) return;
          zr.insD = 6;
          zr.cIns.push({ poly, fin, kind });
          addPanel({
            type: why,
            role: 'back',
            fin: FIN[fin] ? fin : undefined,
            t: 6,
            sec: lab,
            poly: poly.map(([x, y]) => [x - cl, y - y0]),
            grain: 'h',
            band: 'none',
            notes: [
              kind === 'peg'
                ? 'Perforated hardboard, Ø6 holes at 25 mm; fix on 10 mm spacers so hooks fit'
                : kind === 'cork'
                  ? '6 mm cork sheet glued to the back panel'
                  : kind === 'mirror'
                    ? '4 mm mirror glued with mirror adhesive'
                    : 'Glue or pin in front of the back panel'
            ].concat([
              'Goes in before the shelves — the shelves in this compartment are cut 6 mm shallower to sit in front of it'
            ])
          });
          items.push(wf(fpq(poly, -(q.Dh - 6), 6, 'back', 'back'), FIN[fin] ? fin : null));
        };
        if (z.type === 'open' || (z.type === 'closed' && z.face === 'glass')) {
          const full_ =
            (z.type === 'open' && z.niche) || (q.desk && zr.k === 0 && s.deskBack && s.deskBack !== 'plain');
          if (!full_)
            comps.forEach(([cl, cr], ci) => {
              const f = (z.cFin || [])[ci];
              if (FIN[f]) insert(cl, cr, f, 'colour', 'Colour insert (back)');
            });
        }
        if (z.type === 'open' && z.niche)
          comps.forEach(([cl, cr]) =>
            insert(
              cl,
              cr,
              z.niche === 'bar' ? 'mirror' : 'concrete',
              z.niche === 'bar' ? 'mirror' : 'colour',
              z.niche === 'bar' ? 'Mirror back (bar niche)' : 'Splashback (coffee niche)'
            )
          );
        if (q.desk && zr.k === 0 && s.deskBack && s.deskBack !== 'plain' && !(z.type === 'open' && z.niche)) {
          const kb = s.deskBack,
            f =
              kb === 'cork'
                ? 'cork'
                : kb === 'mirror'
                  ? 'mirror'
                  : kb === 'peg'
                    ? FIN[s.deskBackFin]
                      ? s.deskBackFin
                      : 'ral9010'
                    : FIN[s.deskBackFin]
                      ? s.deskBackFin
                      : 'ral6021';
          comps.forEach(([cl, cr]) =>
            insert(
              cl,
              cr,
              f,
              kb,
              kb === 'peg'
                ? 'Pegboard (desk back)'
                : kb === 'cork'
                  ? 'Cork pinboard (desk back)'
                  : kb === 'mirror'
                    ? 'Mirror (desk back)'
                    : 'Colour panel (desk back)'
            )
          );
        }
        const ledge = z.type === 'open' && !!z.ledge;
        let sbk = ledge
          ? Math.max(O.setback, q.Dh - 110)
          : z.inset || z.face === 'glass' || z.doorMode === 'slide'
            ? Math.max(+O.setback, (z.doorMode === 'slide' ? 0 : tf) + 5)
            : +O.setback;
        if (z.type === 'open' && (z.arch || z.slat || z.cub) && !ledge && !(q.desk && zr.k === 0)) sbk = 0;
        if (recOff && zr.k > 0) sbk = Math.max(sbk, recOff + (z.type === 'open' ? 0 : tf + 5));
        const addShelf = (y, cl, cr) => {
          let iv = okInterval(q.under, y + ts + (zr.top && zr.lined ? zr.lined * 1.5 : 0));
          if (iv && zr.lined) iv = [iv[0] + zr.lined, iv[1] - zr.lined];
          if (!iv) return;
          iv = [Math.max(iv[0], cl), Math.min(iv[1], cr)];
          if (iv[1] - iv[0] < 70 || y < zr.y0) return;
          const L = iv[1] - iv[0] - 2,
            dep = q.Dh - sbk - (zr.insD || 0);
          addPanel({
            type: ledge ? 'Picture ledge' : 'Shelf',
            role: 'shelf',
            fin: zr.inFin || undefined,
            sec: lab,
            poly: rect(L, dep),
            grain: 'w',
            band: 'front',
            bandLen: L,
            notes: (L < cr - cl - 3 ? ['Shortened by ceiling slope'] : []).concat(
              ledge ? ['Screw from the back; the 30 × 12 mm lip strip is its own part on this list'] : []
            )
          });
          if (ledge)
            addPanel({
              type: 'Picture ledge lip',
              role: 'shelf',
              fin: zr.inFin || undefined,
              t: 12,
              sec: lab,
              poly: rect(iv[1] - iv[0] - 2, 30),
              grain: 'w',
              band: 'all',
              notes: [
                'Glue and pin along the front edge of the ledge so it stands 30 mm above it: pictures lean against it'
              ]
            });
          items.push(wf(hzq(iv[0] + 1, iv[1] - 1, y, ts, sbk, q.Dh - (zr.insD || 0), 'shelf'), zr.inFin));
          if (ledge) {
            H.ledges++;
            items.push(
              wf(
                fpq(
                  [
                    [iv[0] + 1, y + ts],
                    [iv[1] - 1, y + ts],
                    [iv[1] - 1, y + ts + 30],
                    [iv[0] + 1, y + ts + 30]
                  ],
                  -sbk,
                  12,
                  'shelf',
                  'shelf'
                ),
                zr.inFin
              )
            );
          } else H.pins += 4;
          zr.shelvesY.push([y, iv[0] + 1, iv[1] - 1]);
          {
            const sg = sagOf(L, dep, ts, M.shelf.type, ledge ? 'light' : z.load || 'normal');
            if (!zr.sag || sg.r > zr.sag.r) zr.sag = Object.assign(sg, { L, dep });
            if (sg.r > 1.3 && !q._sag) {
              q._sag = 1;
              warns.push(
                `${lab}: the ${f0(L)} mm shelves (${LOADS[z.load || 'normal'].n.toLowerCase()}) will sag about ${sg.d.toFixed(1)} mm over the years — fine up to ≈ ${f0(sg.Lmax)} mm in ${ts} mm ${(MATS[M.shelf.type]?.short || 'board').toLowerCase()}. Add a vertical divider, use thicker shelves, or glue a solid-wood strip under the front edge.`
              );
            }
          }
        };
        zr.railComps = [];
        zr.railIdx = [];
        if (!vd.length) ys.forEach(y => addShelf(y, q.xa, q.xb));
        else {
          const widest = comps.reduce((b, c, ci) => (c[1] - c[0] > comps[b][1] - comps[b][0] ? ci : b), 0),
            rset = (Array.isArray(z.railCs) ? z.railCs : [])
              .map((v, j) => (v && j < comps.length ? j : -1))
              .filter(j => j >= 0),
            isRail = ci => (rset.length ? rset.includes(ci) : ci === widest);
          comps.forEach(([cl, cr], ci) => {
            const zTop = zr.top ? minUnder(q, cl, cr) : zr.y0 + zr.h;
            if (zr.railY && isRail(ci)) {
              ys.forEach(y => addShelf(y, cl, cr));
              if (!zr.railComp) zr.railComp = [cl, cr];
              zr.railComps.push([cl, cr]);
              zr.railIdx.push(ci);
              return;
            }
            const own = (z.vsh || [])[ci],
              ownSp = (z.vsp || [])[ci],
              stg = !!(z.vst || [])[ci],
              lower = a => {
                if (!stg || !a.length) return a;
                const g = (a[0] - yz) / 2;
                return g >= 60 ? a.map(y => y - g) : a;
              }; // staggered: every shelf half a step lower than in the compartment next to it
            if (own == null && !ownSp && !z.rail && ys.length) {
              lower(ys.filter(y => y + ts <= zTop - 100)).forEach(y => addShelf(y, cl, cr));
              return;
            } // same shelf heights in every compartment, so the rows line up
            const hz_ = zTop - yz,
              cnt = Math.max(
                0,
                +(
                  own ??
                  (z.rail
                    ? Math.max(0, Math.min(2, Math.floor(hz_ / 260) - 1))
                    : Math.min(ns, Math.max(0, Math.floor(hz_ / (150 + ts)))))
                ) || 0
              ),
              sy = shelfYs(yz, zTop, cnt, ts, ownSp || z.space),
              sp = sy.min;
            if (cnt && sp < 140) warns.push(`${lab}: compartment ${ci + 1} has shelves only ${f0(sp)} mm apart.`);
            lower(sy.ys).forEach(y => addShelf(y, cl, cr));
          });
          vd.forEach(v => {
            const lb = zr.lined || 0,
              x = q.xa + v - tc / 2,
              yt = (zr.top ? Math.min(underAt(q, x), underAt(q, x + tc)) : zr.y0 + zr.h) - lb;
            const y0v = zr.y0 + lb;
            if (yt - y0v < 100) return;
            addPanel({
              type: 'Vertical divider',
              role: 'carcass',
              fin: dren || undefined,
              sec: lab,
              poly: rect(q.Dh, yt - y0v),
              grain: 'h',
              band: 'front',
              bandLen: yt - y0v,
              notes: [`${f0(v)} mm from the inside left of ${lab}; fix with dowels top and bottom`].concat(
                vdA ? ['Needed here: the middle doors hinge on this upright'] : [],
                zr.k > 0 || q.desk
                  ? [
                      'Screw the back panel to its rear edge every 150 mm: the back then carries it, so the board it stands on does not bend'
                    ]
                  : [],
                dren ? [`Colour-drenched: ${FIN[dren].name}, like the inside of this level`] : []
              )
            });
            if (zr.k > 0 && q.s.back === 'none' && !q._vdNB) {
              q._vdNB = 1;
              warns.push(
                `${lab}: the upright divider stands on a board with nothing under it, and this column has no back panel to carry it — give the column a back, or put a divider in the same place in the level below.`
              );
            }
            items.push(
              wf(
                {
                  k: 'prism',
                  poly: [
                    [0, y0v],
                    [q.Dh, y0v],
                    [q.Dh, yt],
                    [0, yt]
                  ],
                  toW: (u, v2) => [x, v2, -u - q.z0],
                  ext: [tc, 0, 0],
                  role: 'carcass'
                },
                dren
              )
            );
            (result.vdivs = result.vdivs || []).push({
              x,
              y0: y0v,
              y1: yt,
              sec: i,
              zone: zr.k,
              vis: z.type === 'open',
              fin: dren || null
            });
          });
        }
        if (dren && !zr.lined) {
          const sk = 3,
            yTop = x => (zr.top ? underAt(q, x) : zr.y0 + zr.h),
            full = colDrench(q) === dren,
            sideOwn = d_ => {
              if (!full) return false;
              if (boxes) return true;
              const nb = secs[i + d_];
              return !nb || nb.panel || colDrench(nb) === dren;
            };
          let area = 0;
          [
            [q.xa, 1],
            [q.xb - sk, -1]
          ].forEach(([x, dir]) => {
            const yt = yTop(dir > 0 ? q.xa : q.xb);
            if (yt - zr.y0 < 60) return;
            area += q.Dh * (yt - zr.y0);
            if (sideOwn(-dir)) return;
            items.push(
              wf(
                {
                  k: 'prism',
                  poly: [
                    [0, zr.y0],
                    [q.Dh, zr.y0],
                    [q.Dh, yt],
                    [0, yt]
                  ],
                  toW: (u, v2) => [x, v2, -u - q.z0],
                  ext: [sk, 0, 0],
                  role: 'shelf'
                },
                dren
              )
            );
          });
          items.push(wf(hzq(q.xa, q.xb, zr.y0, sk, 0, q.Dh, 'shelf'), dren));
          area += q.w * q.Dh;
          if (!zr.top) {
            items.push(wf(hzq(q.xa, q.xb, zr.y0 + zr.h - sk, sk, 0, q.Dh, 'shelf'), dren));
            area += q.w * q.Dh;
          } else {
            const t = sampleLine(x => underAt(q, x), q.xa, q.xb);
            for (let j = 1; j < t.length; j++) {
              const [ax, ay] = t[j - 1],
                [bx, by] = t[j];
              items.push({
                k: 'prism',
                poly: [
                  [ax, ay],
                  [bx, by],
                  [bx, by - sk],
                  [ax, ay - sk]
                ],
                toW: (u, v) => [u, v, -q.z0],
                ext: [0, 0, -q.Dh],
                role: 'shelf',
                fin: dren
              });
              area += Math.hypot(bx - ax, by - ay) * q.Dh;
            }
          }
          (H.drench = H.drench || []).push({ fin: dren, area: area / 1e6, sec: lab });
        }
        if (zr.railY) {
          (zr.railComps.length ? zr.railComps : [[q.xa, q.xb]]).forEach(rc =>
            [zr.railY, zr.rail2Y]
              .filter(y => y > 0)
              .forEach(y => {
                items.push({ k: 'rail', xa: rc[0] + 1, xb: rc[1] - 1, y, z: q.z0 + q.Dh / 2 });
                if (!zr.lift) H.rails.push({ sec: lab, L: f0(rc[1] - rc[0] - 2) });
              })
          );
        }
      })
    );
    // fronts
    const frontPoly = (l, r, yb, yt) => {
      const L = l + g / 2,
        Rr = r - g / 2,
        B = yb + g / 2;
      if (yt != null)
        return [
          [L, B],
          [Rr, B],
          [Rr, yt - g / 2],
          [L, yt - g / 2]
        ];
      return [[L, B], [Rr, B], ...sampleLine(x => q.top(x) - g / 2, L, Rr).reverse()];
    };
    const topMinFront = () => Math.min(...sampleLine(q.top, q.bL, q.bR).map(p => p[1]));
    const countHandle = hs => {
      H.handles[hs.type] = (H.handles[hs.type] || 0) + 1;
    };
    q.zones.forEach(
      ZW(q, (zr, k) => {
        const z = zr.z;
        zr.fb0 = k === 0 ? (q.desk || q.door ? yB : q.Pq) : q.zones[k - 1].divY + q.zones[k - 1].divT / 2;
        zr.fb1 = zr.top ? null : zr.divY + zr.divT / 2;
        const bL = q.bL,
          bR = q.bR,
          fab = !!z.fabric && !(z.face && z.face !== 'flat'),
          fcol = FABRICS[z.fabricCol] ? z.fabricCol : 'charcoal';
        const rec = !!(recOff && k > 0),
          cz = z.type === 'closed' || z.type === 'drawers',
          ins = cz && (!!z.inset || rec || zr.dzV < 0),
          face = cz ? z.face || 'flat' : 'flat',
          gi = 2.5,
          vdz = zr.vdx || [],
          near = (a, b) => Math.abs(a - b) < 1;
        const inPoly = (l, r, yb, yt) => {
          const L = near(l, bL) ? q.xa + gi : vdz.some(v => near(v, l)) ? l + tc / 2 + gi : l + g / 2,
            R = near(r, bR) ? q.xb - gi : vdz.some(v => near(v, r)) ? r - tc / 2 - gi : r - g / 2;
          return yt != null
            ? [
                [L, yb],
                [R, yb],
                [R, yt],
                [L, yt]
              ]
            : [[L, yb], [R, yb], ...sampleLine(x => underAt(q, x) - gi, L, R).reverse()];
        };
        const inB = zr.y0 + gi,
          inT = zr.top ? null : zr.divY - gi;
        let jTop = zr.fb1,
          jN = 0; // doors joined with the cupboard(s) above: one tall door over several levels
        if (z.type === 'closed' && z.joinUp && zr.joined == null && q.zones[k + 1]) {
          const okJ = zz =>
            zz &&
            zz.type === 'closed' &&
            !zz.dog &&
            !zz.inset &&
            zz.face !== 'curtain' &&
            (zz.doorMode || 'hinged') === 'hinged';
          let n = k;
          while (
            !recOff &&
            q.zones[n].z.joinUp &&
            q.zones[n + 1] &&
            okJ(q.zones[n].z) &&
            okJ(q.zones[n + 1].z) &&
            (q.zones[n].dzV || 0) === (q.zones[n + 1].dzV || 0)
          ) {
            n++;
            q.zones[n].joined = k;
          }
          if (n > k) {
            const zt = q.zones[n];
            jTop = zt.top ? null : zt.divY + zt.divT / 2;
            jN = n - k;
            zr.joinN = jN;
          } else
            warns.push(
              `${lab}: the doors of level ${k + 1} can't join the cupboard above — both must be cupboards with plain hinged doors (not sliding, pocket, inset, curtain, dog den or a shallow cabinet above a desk).`
            );
        }
        if (face === 'glass') {
          zr.glass = true;
          H.led.push({ sec: lab, L: f0(q.w - 20), why: 'inside the glass cabinet' });
        }
        if (z.dog) {
          const need = [1050, 740];
          if (q.w < need[0] || zr.h < need[1])
            warns.push(
              `${lab}: the dog den is ${f0(q.w)} × ${f0(zr.h)} mm inside — a big dog (Labrador, shepherd) is comfortable from about 1100 × 760 mm.`
            );
          (H.dog = H.dog || []).push({ sec: lab, w: f0(q.w - 30), d: f0(q.Dh - 40), kind: z.dog });
        }
        if (z.type === 'closed' && !z.dog && face !== 'glass' && S.opts.innerLight) {
          zr.glowIn = true;
          H.led.push({
            sec: lab,
            L: f0(q.w - 20),
            why:
              S.opts.lightSensor === 'motion'
                ? 'switches on by a motion sensor when you reach in'
                : 'switches on when the door opens (door sensor)'
          });
        }
        if (z.type === 'closed' && !z.dog) {
          if (z.dMirror) {
            const mh = Math.min(1500, zr.h - 120),
              mw = Math.min(500, q.w / Math.max(1, +z.doors || 1) - 120);
            if (mh >= 500 && mw >= 250)
              H.funParts.push({
                n: `Mirror on the inside of the door: safety mirror ${f0(mw)} × ${f0(mh)} mm, glued`,
                q: '1',
                sec: lab
              });
            else warns.push(`${lab}: the door is too small for a useful mirror inside.`);
          }
          if (z.vent)
            H.funParts.push({ n: 'Air vent grille in the door, 400 × 80 mm (top and bottom)', q: '2', sec: lab });
          if (z.fridge) {
            const iw = q.w,
              ih = zr.h,
              std = [1945, 1780, 1580, 1400, 1225, 1025, 880].find(v => v <= ih + 5);
            zr.fridge = true;
            if (iw < 556)
              warns.push(
                `${lab}: a built-in fridge needs a niche of 560–570 mm wide; this column is ${f0(iw)} mm inside.`
              );
            else if (iw > 580)
              warns.push(
                `${lab}: a built-in fridge needs a niche of 560–570 mm wide; this column is ${f0(iw)} mm inside — set the column to 564 mm (600 mm on the outside with 18 mm sides), or add filler strips inside.`
              );
            if (q.Dh < 550)
              warns.push(`${lab}: a built-in fridge needs at least 550 mm of depth inside; there is ${f0(q.Dh)} mm.`);
            if (!std)
              warns.push(
                `${lab}: a built-in fridge needs a niche of at least 880 mm high (under-counter model); this level is ${f0(ih)} mm.`
              );
            else if (ih - std > 15)
              warns.push(
                `${lab}: built-in fridges come in fixed niche heights (880, 1025, 1225, 1400, 1580, 1780, 1945 mm). This level is ${f0(ih)} mm — set it to ${std} mm so the ${std} mm model fits snugly (they allow only a few mm of play).`
              );
            if (+z.shelves > 0 || z.rail || z.fit)
              warns.push(
                `${lab}: the fridge fills this level — take out the shelves${z.rail ? ', the rail' : ''}${z.fit ? ' and the inside fitting' : ''}.`
              );
            if (std >= 1580)
              H.funParts.push({
                n: 'Fridge-freezer with two doors? Then make two levels at the heights in its manual, one door each',
                q: 'check',
                sec: lab
              });
            if (zr.k === 0 && !q.desk && q.Pq < 80)
              warns.push(
                `${lab}: the fridge takes in air at the bottom — give the column a plinth with a vent grille (or a 20 mm gap under the door).`
              );
            if (std)
              (zr.applIn = zr.applIn || []).push({
                k: 'fridge',
                x: (q.xa + q.xb) / 2 - 280,
                y: zr.y0 + 5,
                w: Math.min(560, iw - 6),
                h: Math.min(std - 10, ih - 10)
              });
            H.funParts.push(
              {
                n: `Built-in fridge for a ${std || '—'} mm high niche (560 × 550 mm), door-on-door fixing`,
                q: '1',
                sec: lab
              },
              { n: 'Vent grille in the plinth below the fridge, 200 cm² or more', q: '1', sec: lab },
              {
                n: 'Leave a 40 mm air channel behind the fridge: cut the back panel away behind it and leave the top open to the cupboard above, or vent the top',
                q: '1',
                sec: lab
              },
              { n: 'Power socket behind or beside the fridge (reachable)', q: '1', sec: lab }
            );
          }
          if (z.util) {
            H.funParts.push(
              { n: 'Power socket inside, for chargers', q: '1', sec: lab },
              { n: 'Broom and mop holder rail', q: '1', sec: lab },
              { n: 'Wall bracket for a stick vacuum with its charger', q: '1', sec: lab }
            );
            if (q.w < 400)
              warns.push(
                `${lab}: a utility cupboard is handy from about 450 mm wide (a stick vacuum with its brush is about 300 mm).`
              );
            if (zr.h < 1300)
              warns.push(
                `${lab}: brooms and a stick vacuum need about 1300 mm of height; this level has ${f0(zr.h)} mm.`
              );
            if (+z.shelves > 1)
              warns.push(`${lab}: keep the utility cupboard mostly free — one shelf at the top is enough.`);
          }
        }
        if (z.type === 'open' && z.niche) {
          zr.nicheLight = true;
          H.led.push({
            sec: lab,
            L: f0(q.w - 20),
            why: z.niche === 'bar' ? 'in the bar niche' : 'in the coffee niche'
          });
        }
        if (zr.glass || zr.glowIn || zr.nicheLight) {
          (zr.comps && zr.comps.length ? zr.comps : [[q.xa, q.xb]]).forEach(([cl, cr]) => {
            if (cr - cl < 120) return;
            let yT = zr.top ? minUnder(q, cl, cr) : zr.y0 + zr.h;
            const sh_ = (zr.shelvesY || []).filter(
              ([y, l, r_]) => l < cr - 30 && r_ > cl + 30 && y < yT - 1 && y + ts > yT - 14
            );
            if (sh_.length) yT = Math.min(...sh_.map(a => a[0]));
            items.push(Object.assign(hzq(cl + 30, cr - 30, yT - 6, 5, 50, 80, 'led'), { sz: i + ':' + k }));
          });
        }
        const mkFront = (kind, type, poly, hinge, extraNotes, grainU, idx, zf) => {
          if (q.deskShut && k === 0) return;
          if (rec && zf == null) zf = -recOff;
          const ff = finOf((z.fins || [])[idx], finOf(z.fin, ttFin(poly)));
          extraNotes = [...extraNotes];
          if (rec)
            extraNotes.push(
              `Shallow cabinet above the desk: the front sits ${f0(recOff)} mm back, inside the sides, with a 2.5 mm reveal — use inset hinges`
            );
          else if (ins)
            extraNotes.push(
              'Inset — sits inside the cabinet frame with a 2.5 mm reveal; use 0 mm overlay (inset) hinges or runners'
            );
          if (face === 'fluted') {
            extraNotes.push('Fluted / reeded face: 25 mm reeds, 6 mm deep — buy reeded MDF or rout after cutting');
            H.flute++;
          }
          const htO = (z.hts || [])[idx] || z.hd || (face === 'dots' ? 'hole' : ''),
            htU = htO && HANDLES.some(h_ => h_[0] === htO) ? htO : HT,
            hs = (z.nh || [])[idx] ? { type: 'none' } : handleSpec(kind, poly, hinge, htU),
            dotted = hs.type === 'dots' && !fab && (kind === 'door' || kind === 'drawer') && !z.dog,
            holes = handleHoles(hs);
          let dd = DOTSZ[O.dotSize] || 38;
          if (hs.type === 'dots' && !dotted) {
            hs.type = 'none';
          }
          let cupYs = null;
          {
            const hcM =
                kind === 'door' && !/Sliding|Pocket/.test(type) && (hinge === 'L' || hinge === 'R')
                  ? /(\d+) hinges/.exec(extraNotes.join(' '))
                  : null,
              hc_ = hcM ? +hcM[1] : 0;
            if (hc_ > 0) {
              const xs_ = poly.map(p_ => p_[0]),
                xl = Math.min(...xs_),
                xr = Math.max(...xs_),
                cx = hinge === 'L' ? xl + 21.5 : xr - 21.5,
                yb = Math.min(...poly.map(p_ => p_[1])),
                yt_ = polyTopAt(poly, cx),
                yT = isFinite(yt_) ? yt_ : Math.max(...poly.map(p_ => p_[1])),
                mg = Math.max(35, Math.min(100, (yT - yb) / 4)),
                a = yb + mg,
                b = yT - mg,
                ys_ =
                  hc_ === 1 || b - a < 40
                    ? [(yb + yT) / 2]
                    : Array.from({ length: hc_ }, (_, m) => a + ((b - a) * m) / (hc_ - 1));
              cupYs = ys_.slice();
              ys_.forEach(y_ => holes.push({ x: cx, y: y_, d: 35, dp: 13, cup: true }));
              extraNotes.push(
                `Hinge cups Ø35 × 13 mm deep in the back face, centre ${21.5} mm from the ${hinge === 'L' ? 'left' : 'right'} edge, at ${ys_.map(y_ => f0(y_ - yb)).join(', ')} mm from the bottom edge. Mounting plates on the cabinet side 37 mm from its front edge, at the same heights`
              );
            }
          }
          let dots = null;
          if (dotted) {
            dots = dotsFor(
              poly,
              kind,
              hinge,
              O.dotPat || 'grid',
              dd,
              (+O.dotSeed || 0) * 7919 + i * 131 + k * 17 + idx * 7,
              +O.dotSeed || 0
            );
            dots.forEach(([x_, y_, d_]) => holes.push({ x: x_, y: y_, d: d_ || dd }));
            const nBig = dots.filter(p_ => p_[2] > dd).length;
            extraNotes.push(
              `${dots.length - nBig} holes Ø${dd}${nBig ? ` and ${nBig} finger hole Ø${dots.find(p_ => p_[2] > dd)[2]}` : ''} drilled through as the handle — drill from the front with a sharp Forstner bit into a backing board, so the back does not splinter`
            );
          }
          let notes = [...extraNotes];
          const hn = handleNote(hs);
          if (hn) notes.push(hn);
          countHandle(hs);
          if (fab) {
            const inner = insetPoly(poly, 60);
            holes.push({ poly: inner, x: inner[0][0], y: inner[0][1] });
            notes.push(`Fabric frame with 60 mm border; wrap in ${FABRICS[fcol].name.toLowerCase()} fabric`);
            addFabric(poly, fcol, lab);
          }
          let inner = null;
          if (!fab && (face === 'cane' || face === 'glass')) {
            const bw = face === 'cane' ? 70 : 45;
            inner = insetPoly(poly, bw);
            holes.push({ poly: inner, x: inner[0][0], y: inner[0][1] });
            const xs = inner.map(p => p[0]),
              ys = inner.map(p => p[1]),
              iw = Math.max(...xs) - Math.min(...xs),
              ih = Math.max(...ys) - Math.min(...ys);
            if (face === 'cane') {
              notes.push(`Frame with ${bw} mm border, rebated 10 mm at the back for cane webbing`);
              H.cane.push({ w: f0(iw + 40), h: f0(ih + 40), sec: lab });
            } else {
              notes.push(`Frame with ${bw} mm border, rebated for a 4 mm fluted glass panel`);
              H.glass.push({ w: f0(iw + 16), h: f0(ih + 16), sec: lab });
            }
          }
          let dogCut = null;
          if (z.dog && kind === 'door') {
            const xs = poly.map(p => p[0]),
              ys = poly.map(p => p[1]),
              x0 = Math.min(...xs),
              x1 = Math.max(...xs),
              y0 = Math.min(...ys),
              y1 = Math.max(...ys),
              w_ = x1 - x0,
              h_ = y1 - y0;
            const topAt = x => {
              let m = -1e9;
              for (let j = 0; j < poly.length; j++) {
                const a_ = poly[j],
                  b_ = poly[(j + 1) % poly.length];
                if ((a_[0] - x) * (b_[0] - x) <= 0 && Math.abs(a_[0] - b_[0]) > 0.01) {
                  const yy = a_[1] + ((b_[1] - a_[1]) * (x - a_[0])) / (b_[0] - a_[0]);
                  if (yy > m) m = yy;
                }
              }
              return m > -1e8 ? m : y1;
            };
            {
              const cxm = (x0 + x1) / 2,
                B = y0 + 75,
                lim = (xa, xb) => Math.min(topAt(xa + 1), topAt(xb - 1), topAt((xa + xb) / 2)) - B - 75,
                arc = (cx, cy, rx, ry, a0, a1, n) =>
                  Array.from({ length: n + 1 }, (_, j) => {
                    const t = a0 + ((a1 - a0) * j) / n;
                    return [cx + Math.cos(t) * rx, cy + Math.sin(t) * ry];
                  });
              const archAt = (cx, aw, ah) => {
                const ry = Math.min(aw / 2, ah * 0.5);
                return [[cx - aw / 2, B], [cx + aw / 2, B], ...arc(cx, B + ah - ry, aw / 2, ry, 0, Math.PI, 14)];
              };
              const mk = {
                arch: () => {
                  const aw = Math.min(w_ - 200, 780),
                    ah = Math.min(h_ - 140, 700, lim(cxm - aw / 2, cxm + aw / 2));
                  return [archAt(cxm, aw, ah)];
                },
                round: () => {
                  const d = Math.min(w_ - 200, h_ - 160, 720, lim(cxm - 200, cxm + 200)),
                    r_ = d / 2;
                  return [arc(cxm, B + 15 + r_, r_, r_, -Math.PI / 2, Math.PI * 1.5, 32)];
                },
                square: () => {
                  const aw = Math.min(w_ - 200, 760),
                    ah = Math.min(h_ - 140, 680, lim(cxm - aw / 2, cxm + aw / 2)),
                    c = Math.min(110, aw / 4, ah / 4),
                    l = cxm - aw / 2,
                    r_ = cxm + aw / 2,
                    t = B + ah;
                  return [
                    [
                      [l, B],
                      [r_, B],
                      ...arc(r_ - c, t - c, c, c, 0, Math.PI / 2, 6),
                      ...arc(l + c, t - c, c, c, Math.PI / 2, Math.PI, 6)
                    ]
                  ];
                },
                house: () => {
                  const aw = Math.min(w_ - 200, 740),
                    ah = Math.min(h_ - 130, 740, lim(cxm - aw / 2, cxm + aw / 2) + 40),
                    l = cxm - aw / 2,
                    r_ = cxm + aw / 2;
                  return [
                    [
                      [l, B],
                      [r_, B],
                      [r_, B + ah * 0.6],
                      [cxm, B + ah],
                      [l, B + ah * 0.6]
                    ]
                  ];
                },
                double: () => {
                  if (w_ < 1000) return mk.arch();
                  const aw = Math.min((w_ - 300) / 2, 520),
                    off = aw / 2 + 50;
                  return [-1, 1].map(sg => {
                    const cx = cxm + sg * off;
                    return archAt(cx, aw, Math.min(h_ - 140, 680, lim(cx - aw / 2, cx + aw / 2)));
                  });
                },
                bars: () => {
                  const aw = Math.min(w_ - 200, 600),
                    ah = Math.min(h_ - 140, 680, lim(cxm - aw / 2, cxm + aw / 2)),
                    out = [archAt(cxm, aw, ah)];
                  [
                    [x0 + 70, cxm - aw / 2 - 70],
                    [cxm + aw / 2 + 70, x1 - 70]
                  ].forEach(([a_, b_]) => {
                    const n_ = Math.floor((b_ - a_ + 50) / 84);
                    for (let j = 0; j < n_; j++) {
                      const sx = a_ + j * 84,
                        yt_ = Math.min(topAt(sx), topAt(sx + 34), y0 + 900) - 90;
                      if (yt_ - y0 - 90 > 120)
                        out.push([
                          [sx, y0 + 90],
                          [sx + 34, y0 + 90],
                          [sx + 34, yt_],
                          [sx, yt_]
                        ]);
                    }
                  });
                  return out;
                }
              };
              const cuts = (mk[z.dog] || mk.arch)().filter(c => {
                const xs_ = c.map(p => p[0]),
                  ys_ = c.map(p => p[1]);
                return Math.max(...xs_) - Math.min(...xs_) > 30 && Math.max(...ys_) - Math.min(...ys_) > 120;
              });
              const main = cuts[0];
              if (main) {
                const mx_ = main.map(p => p[0]),
                  my_ = main.map(p => p[1]),
                  ow = Math.max(...mx_) - Math.min(...mx_),
                  oh = Math.max(...my_) - Math.min(...my_);
                dogCut = cuts;
                cuts.forEach(c => holes.push({ poly: c, x: c[0][0], y: c[0][1] }));
                if (ow < 450 || oh < 480)
                  warns.push(
                    `${lab}: the dog doorway is only ${f0(ow)} × ${f0(oh)} mm — a big dog needs about 500 × 600 mm to walk in. Make the den wider or taller.`
                  );
                type = 'Dog den front (fixed, with doorway)';
                notes.push(
                  `Fixed panel, not hinged — screw it on from inside. Cut the ${{ arch: 'arched', round: 'round', square: 'rounded', house: 'house-shaped', double: 'twin arched', bars: 'arched' }[z.dog] || 'arched'} doorway (${f0(ow)} × ${f0(oh)} mm${z.dog === 'double' ? ' each' : ''}) with a jigsaw and round the edges over`,
                  z.dog === 'bars'
                    ? `${cuts.length - 1} air slots 34 mm wide beside the doorway — rout them with a template`
                    : '',
                  w_ > 700 && z.dog !== 'double'
                    ? 'Rout a 3 mm V-groove down the middle so it reads as two doors like the neighbours'
                    : ''
                );
              } else
                warns.push(
                  `${lab}: the dog den is too small for a doorway — make it at least 500 mm wide and 600 mm high.`
                );
            }
            notes = notes.filter(Boolean);
          }
          let slat = null;
          if (face === 'slat' && !fab && kind === 'door' && !z.dog && !dogCut) {
            slat = slatsOf(poly, z.slatDir === 'h' ? 'h' : 'v', z.slatSize, true);
            const SN = SLAT[z.slatSize] || SLAT.med,
              sn = [
                `Slatted door: ${slat.sw} mm slats with ${f0(slat.gap)} mm gaps — use a spacer block of that size`,
                'Solid wood or plywood strips; round the edges over lightly before fitting'
              ];
            slat.slats.forEach((sp, j) => {
              const xs_ = sp.map(p_ => p_[0]),
                ys_ = sp.map(p_ => p_[1]),
                w_ = Math.max(...xs_) - Math.min(...xs_),
                h_ = Math.max(...ys_) - Math.min(...ys_),
                edge = slat.dir === 'v' && (j === 0 || j === slat.slats.length - 1);
              addPanel({
                type: edge ? 'Door stile (slatted door)' : 'Door slat',
                role: 'front',
                fin: ff || undefined,
                sec: lab,
                poly: rect(Math.max(w_, h_), Math.min(w_, h_)),
                grain: 'w',
                band: 'none',
                notes: (edge ? ['The hinge cups and the handle go in these wider edge pieces'] : []).concat(
                  j === 0 ? sn.concat(notes) : []
                )
              });
            });
            slat.rails.forEach(rp => {
              const xs_ = rp.map(p_ => p_[0]),
                ys_ = rp.map(p_ => p_[1]),
                w_ = Math.max(...xs_) - Math.min(...xs_),
                h_ = Math.max(...ys_) - Math.min(...ys_);
              addPanel({
                type: 'Door rail (behind the slats)',
                role: 'front',
                fin: ff || undefined,
                sec: lab,
                poly: rect(Math.max(w_, h_), Math.min(w_, h_)),
                grain: 'w',
                band: 'none',
                notes: [
                  'Glue and screw every slat to it from the back; it sits inside the cabinet opening, clear of the frame'
                ].concat(slat.dir === 'h' ? ['Hinge cups go in the rail on the hinge side'] : [])
              });
            });
          } else if (face === 'slat' && kind === 'door')
            notes.push('Slats are not possible on this front; it is a flat door');
          if (!slat)
            addPanel({
              type: fab ? type + ' (fabric frame)' : type,
              role: 'front',
              fin: ff || undefined,
              sec: lab,
              poly,
              holes,
              grain: grainU ? 'w' : 'h',
              band: 'all',
              notes
            });
          const zF = zf != null ? zf : ins ? 0 : tf;
          fronts.push({
            z0: q.z0,
            kind,
            poly,
            hinge,
            slide: z.doorMode === 'slide',
            cups: cupYs,
            ins,
            sec: i,
            zone: k,
            idx,
            handle: hs,
            fabric: fab ? fcol : null,
            fin: ff,
            inset: ins,
            face: fab ? 'flat' : face,
            slats: slat ? slat.slats : null,
            dots,
            dotD: dd,
            inner,
            zF,
            rear: zf != null && zf <= tf + 1 && z.doorMode === 'slide',
            rec,
            dog: z.dog || '',
            dogCut
          });
          if (inner && face === 'glass') {
            const xs = poly.map(p => p[0]),
              ys = poly.map(p => p[1]),
              x0 = Math.min(...xs),
              x1 = Math.max(...xs),
              y0 = Math.min(...ys),
              ix = inner.map(p => p[0]),
              iy = inner.map(p => p[1]),
              ix0 = Math.min(...ix),
              ix1 = Math.max(...ix),
              iy0 = Math.min(...iy),
              iy1 = Math.min(...inner.filter(p => p[1] > iy0 + 1).map(p => p[1]));
            [
              [x0, y0, ix0, iy1 + 45],
              [ix1, y0, x1, iy1 + 45],
              [ix0, y0, ix1, iy0],
              [ix0, iy1, ix1, iy1 + 45]
            ].forEach(([a, b, c, d]) => {
              if (c - a > 1 && d - b > 1)
                items.push(
                  Object.assign(
                    wf(
                      fpq(
                        [
                          [a, b],
                          [c, b],
                          [c, d],
                          [a, d]
                        ],
                        zF,
                        tf,
                        'front',
                        'front'
                      ),
                      ff
                    ),
                    { sz: i + ':' + k }
                  )
                );
            });
            items.push(Object.assign(fpq(inner, zF - tf / 2 + 2, 4, 'glass', 'front'), { sz: i + ':' + k }));
          } else if (slat) {
            slat.slats.forEach(sp =>
              items.push(Object.assign(wf(fpq(sp, zF, tf, 'front', 'front'), ff), { sz: i + ':' + k }))
            );
            slat.rails.forEach(rp =>
              items.push(Object.assign(wf(fpq(rp, zF - tf, 18, 'front', 'front'), ff), { sz: i + ':' + k }))
            );
          } else {
            items.push(
              Object.assign(
                wf(fpq(poly, zF, tf, fab ? 'fabric:' + fcol : 'front', 'front', grainU), ff),
                { sz: i + ':' + k },
                dots && dots.length
                  ? {
                      holes: dots.map(([x_, y_, d_]) =>
                        Array.from({ length: 14 }, (_, m) => [
                          x_ + ((d_ || dd) / 2) * Math.cos((m * Math.PI) / 7),
                          y_ + ((d_ || dd) / 2) * Math.sin((m * Math.PI) / 7)
                        ])
                      )
                    }
                  : {}
              )
            );
            if (inner && face === 'cane')
              items.push(Object.assign(fpq(inner, zF + 0.8, 1, 'cane', 'front'), { sz: i + ':' + k }));
            if (face === 'fluted' && !fab) {
              const xs = poly.map(p => p[0]),
                ys = poly.map(p => p[1]),
                x0 = Math.min(...xs) + 8,
                x1 = Math.max(...xs) - 8,
                y0 = Math.min(...ys) + 8,
                top = x => {
                  let t = -1e9;
                  for (let a = 0; a < poly.length; a++) {
                    const P1 = poly[a],
                      P2 = poly[(a + 1) % poly.length];
                    if ((P1[0] - x) * (P2[0] - x) <= 0 && Math.abs(P2[0] - P1[0]) > 0.01) {
                      const yy = P1[1] + ((P2[1] - P1[1]) * (x - P1[0])) / (P2[0] - P1[0]);
                      if (yy > t) t = yy;
                    }
                  }
                  return t > -1e8 ? t - 8 : y0;
                };
              const pitch = 25;
              for (let x = x0; x + pitch * 0.7 <= x1; x += pitch) {
                const yt = Math.min(top(x), top(Math.min(x1, x + pitch * 0.7)));
                if (yt - y0 > 30)
                  items.push(
                    Object.assign(
                      wf(
                        fpq(
                          [
                            [x, y0],
                            [x + pitch * 0.7, y0],
                            [x + pitch * 0.7, yt],
                            [x, yt]
                          ],
                          zF + 5,
                          5,
                          'front',
                          'front'
                        ),
                        ff
                      ),
                      { sz: i + ':' + k }
                    )
                  );
              }
            }
          }
        };
        zr.cubOpen = null;
        if (z.type === 'open' && z.cub && !z.arch && !z.slat && !(q.desk && k === 0) && !z.ledge) {
          // contrast cubbies: some cells open, in their own colour; the rest closed by a fixed cover in the door colour
          const cm = zr.comps && zr.comps.length ? zr.comps : [[q.xa, q.xb]],
            lb = zr.lined || 0,
            cF = FIN[z.cubFin] ? z.cubFin : ['ral5024', 'ral6021', 'ral5014'].find(c => FIN[c]) || M.front.fin,
            wF = FIN[z.fin] ? z.fin : M.front.fin,
            rnd = prng((+z.cubSeed || 7) * 97 + i * 13 + k),
            cells = [];
          cm.forEach(([cl0, cr0], ci) => {
            let cl = cl0,
              cr = cr0;
            if (ci === 0) cl += lb;
            if (ci === cm.length - 1) cr -= lb;
            const sy = (zr.shelvesY || [])
                .filter(([y, l, r_]) => l < cr - 5 && r_ > cl + 5)
                .map(a_ => a_[0])
                .sort((a_, b_) => a_ - b_),
              zt = (zr.top ? minUnder(q, cl, cr) : zr.y0 + zr.h) - lb;
            let yb = zr.y0 + lb;
            const xl = ci === 0 ? bL : (cm[ci - 1][1] + cl0) / 2,
              xr = ci === cm.length - 1 ? bR : (cr0 + cm[ci + 1][0]) / 2;
            [...sy, zt].forEach((yt, ri, all) => {
              const last = ri === all.length - 1,
                flat = !(last && zr.top) || Math.abs(underAt(q, cl) - underAt(q, cr)) < 5;
              cells.push({
                ci,
                ri,
                nR: all.length,
                cl,
                cr,
                yb,
                yt,
                xl,
                xr,
                yl: ri === 0 ? zr.fb0 : yb - ts / 2,
                yu: last ? zr.fb1 : yt + ts / 2,
                flat
              });
              yb = yt + ts;
            });
          });
          const nC = cm.length,
            isOpen = c =>
              z.cub === 'checker'
                ? (c.ci + c.ri) % 2 === 0
                : z.cub === 'steps'
                  ? c.ri <= Math.round((c.ci * (c.nR - 1)) / Math.max(1, nC - 1))
                  : rnd() < 0.45;
          cells.forEach(c => {
            c.open = c.flat && c.yt - c.yb >= 120 && c.cr - c.cl >= 120 && isOpen(c);
          });
          if (!cells.some(c => c.open)) {
            const c = cells.find(c => c.flat && c.yt - c.yb >= 120);
            if (c) c.open = true;
          }
          zr.cubOpen = new Set(cells.filter(c => c.open).map(c => c.ci + ':' + c.ri));
          let area = 0;
          cells.forEach(c => {
            const poly = frontPoly(c.xl, c.xr, c.yl, c.yu),
              R_ = (a_, b_, y0_, y1_) => [
                [a_, y0_],
                [b_, y0_],
                [b_, y1_],
                [a_, y1_]
              ];
            if (c.open) {
              const hole = R_(c.cl, c.cr, c.yb, c.yt);
              addPanel({
                type: 'Cubby frame',
                role: 'front',
                fin: cF,
                sec: lab,
                poly,
                holes: [{ poly: hole, x: c.cl, y: c.yb }],
                grain: 'h',
                band: 'all',
                notes: [
                  'A frame in the cubby colour, glued onto the front edges of the shelves and uprights around this open cell'
                ]
              });
              items.push(
                Object.assign(wf(fpq(poly, tf, tf, 'front', 'front'), cF), { holes: [hole], sz: i + ':' + k })
              );
              const sk = 3;
              [
                R_(c.cl, c.cr, c.yt - sk, c.yt),
                R_(c.cl, c.cr, c.yb, c.yb + sk),
                R_(c.cl, c.cl + sk, c.yb, c.yt),
                R_(c.cr - sk, c.cr, c.yb, c.yt)
              ].forEach(rr => items.push(Object.assign(wf(fpq(rr, 0, q.Dh - 4, 'shelf'), cF), { sz: i + ':' + k })));
              items.push(
                Object.assign(wf(fpq(R_(c.cl, c.cr, c.yb, c.yt), -(q.Dh - 4), sk, 'shelf'), cF), { sz: i + ':' + k })
              );
              area += ((c.cr - c.cl) * (c.yt - c.yb) + 2 * (c.cr - c.cl + c.yt - c.yb) * q.Dh) / 1e6;
              cubs.push({ open: 1, poly, hole, fin: cF, x0: c.cl, x1: c.cr, y0: c.yb, y1: c.yt, sec: i, zone: k });
            } else {
              addPanel({
                type: 'Cubby cover (fixed)',
                role: 'front',
                fin: wF,
                sec: lab,
                poly,
                grain: 'h',
                band: 'all',
                notes: [
                  'Fixed cover glued and screwed onto the front edges from inside — or hang it on two hinges with a push latch to use the space behind'
                ]
              });
              items.push(Object.assign(wf(fpq(poly, tf, tf, 'front', 'front'), wF), { sz: i + ':' + k }));
              cubs.push({ open: 0, poly, fin: wF, sec: i, zone: k });
              const xs_ = poly.map(p_ => p_[0]),
                ys_ = poly.map(p_ => p_[1]);
              cubCov.push({
                x0: Math.min(...xs_),
                x1: Math.max(...xs_),
                y0: Math.min(...ys_),
                y1: Math.max(...ys_),
                sec: i,
                zone: k
              });
            }
          });
          if (area > 0) (H.drench = H.drench || []).push({ fin: cF, area, sec: lab, cub: 1 });
          zr.cub = cells.filter(c => c.open).length;
        }
        if (z.type === 'open' && z.bask && !z.slat && !(q.desk && k === 0) && !z.ledge) {
          // storage boxes that fit the compartments, in their own colour
          const cm = zr.comps && zr.comps.length ? zr.comps : [[q.xa, q.xb]],
            lb = zr.lined || 0,
            bF = FIN[z.baskFin] ? z.baskFin : FIN[zr.inFin] ? zr.inFin : M.front.fin,
            dB = Math.max(180, Math.min(400, q.Dh - 40));
          let nB = 0;
          cm.forEach(([cl, cr], ci) => {
            if (ci === 0) cl += lb;
            if (ci === cm.length - 1) cr -= lb;
            const sy = (zr.shelvesY || [])
                .filter(([y, l, r_]) => l < cr - 5 && r_ > cl + 5)
                .map(a_ => a_[0])
                .sort((a_, b_) => a_ - b_),
              zt = (zr.top ? minUnder(q, cl, cr) : zr.y0 + zr.h) - lb;
            let yb = zr.y0 + lb;
            [...sy, zt].forEach((yt, j) => {
              const w = cr - cl - 8,
                h = Math.min(600, yt - yb - 20),
                use =
                  (z.bask === 'all' || (z.bask === 'alt' ? j % 2 === 0 : j === 0)) &&
                  (!zr.cubOpen || zr.cubOpen.has(ci + ':' + j));
              if (use && w >= 150 && h >= 110) {
                const x0 = cl + 4,
                  x1 = cr - 4,
                  grip = z.baskGrip === 'hole' || z.baskGrip === 'two' ? z.baskGrip : 'slot',
                  gd = h < 160 ? 25 : 30,
                  gNote =
                    grip === 'slot'
                      ? 'Hand slot 100 × 30 mm, 40 mm under the top edge of the front'
                      : grip === 'two'
                        ? `Two Ø${gd} finger holes, ${Math.round(Math.min(70, w * 0.18))} mm left and right of the middle, 40 mm under the top edge of the front — drill through into scrap`
                        : `One Ø${gd} finger hole in the middle, 40 mm under the top edge of the front — drill through into scrap`,
                  b = { x0, x1, y0: yb, y1: yb + h, fin: bF, sec: i, zone: k, grip, gd };
                baskets.push(b);
                nB++;
                [
                  [
                    'Storage box — front',
                    w,
                    h,
                    1,
                    [gNote],
                    grip === 'slot'
                      ? [
                          {
                            x: w / 2,
                            y: h - Math.min(40, h * 0.22) - 15,
                            d: 30,
                            len: Math.min(100, w * 0.45),
                            dir: 'h'
                          }
                        ]
                      : grip === 'two'
                        ? [-1, 1].map(sg => ({
                            x: w / 2 + sg * Math.min(70, w * 0.18),
                            y: h - Math.min(40, h * 0.22) - gd / 2,
                            d: gd
                          }))
                        : [{ x: w / 2, y: h - Math.min(40, h * 0.22) - gd / 2, d: gd }]
                  ],
                  ['Storage box — back', w, h, 1, []],
                  ['Storage box — side', dB - 24, h, 2, []],
                  ['Storage box — bottom', w - 24, dB - 24, 1, ['Glue felt pads under it so it slides']]
                ].forEach(([n_, a_, b_, q_, nt, hl]) => {
                  for (let m = 0; m < q_; m++)
                    addPanel({
                      type: n_,
                      role: 'front',
                      fin: bF,
                      t: 12,
                      sec: lab,
                      poly: rect(a_, b_),
                      holes: hl || [],
                      grain: 'w',
                      band: 'none',
                      notes: nt.concat(['12 mm board, glued and pinned; open at the top'])
                    });
                });
                {
                  // 3D: a real open box — 12 mm front with a rounded hand slot, back, two sides and a bottom
                  const R_ = (a_, b_, c_, d_) => [
                      [a_, c_],
                      [b_, c_],
                      [b_, d_],
                      [a_, d_]
                    ],
                    bt = 12,
                    sw_ = Math.min(100, (x1 - x0) * 0.45),
                    sh_ = Math.min(30, h * 0.18),
                    scx = (x0 + x1) / 2,
                    scy = yb + h - Math.min(40, h * 0.22) - sh_ / 2,
                    rr = sh_ / 2,
                    slot = [];
                  for (let m = 0; m <= 8; m++) {
                    const t_ = -Math.PI / 2 + (Math.PI * m) / 8;
                    slot.push([scx + sw_ / 2 - rr + Math.cos(t_) * rr, scy + Math.sin(t_) * rr]);
                  }
                  for (let m = 0; m <= 8; m++) {
                    const t_ = Math.PI / 2 + (Math.PI * m) / 8;
                    slot.push([scx - sw_ / 2 + rr + Math.cos(t_) * rr, scy + Math.sin(t_) * rr]);
                  }
                  const gcy = yb + h - Math.min(40, h * 0.22) - gd / 2,
                    circ = cx_ => {
                      const c_ = [];
                      for (let m = 0; m < 16; m++) {
                        const t_ = (Math.PI * 2 * m) / 16;
                        c_.push([cx_ + (Math.cos(t_) * gd) / 2, gcy + (Math.sin(t_) * gd) / 2]);
                      }
                      return c_;
                    },
                    gHoles =
                      grip === 'slot'
                        ? sh_ >= 12 && sw_ >= 40
                          ? [slot]
                          : []
                        : grip === 'two'
                          ? [circ(scx - Math.min(70, (x1 - x0) * 0.18)), circ(scx + Math.min(70, (x1 - x0) * 0.18))]
                          : [circ(scx)];
                  const sz_ = i + ':' + k,
                    P_ = it => items.push(Object.assign(wf(it, bF), { sz: sz_ }));
                  P_(Object.assign(fpq(R_(x0, x1, yb, yb + h), -12, bt, 'front'), { holes: gHoles }));
                  P_(fpq(R_(x0, x1, yb, yb + h), -dB, bt, 'front'));
                  P_(fpq(R_(x0, x0 + bt, yb, yb + h), -12 - bt, dB - 2 * bt, 'front'));
                  P_(fpq(R_(x1 - bt, x1, yb, yb + h), -12 - bt, dB - 2 * bt, 'front'));
                  P_(fpq(R_(x0 + bt, x1 - bt, yb, yb + bt), -12 - bt, dB - 2 * bt, 'front'));
                }
              }
              yb = yt + ts;
            });
          });
          zr.bask = nB;
          if (!nB)
            warns.push(
              `${lab}: no storage box fits in level ${k + 1} — a box needs a compartment at least 160 mm wide and 130 mm high.`
            );
        }
        if (z.type === 'open' && z.slat && !z.arch && !(q.desk && k === 0)) {
          const poly = frontPoly(bL, bR, zr.fb0, zr.fb1),
            sF = FIN[z.slatFin] ? z.slatFin : M.front.fin,
            sl = slatsOf(poly, z.slatDir === 'h' ? 'h' : 'v', z.slatSize, false);
          sl.slats.forEach((sp, j) => {
            const xs_ = sp.map(p_ => p_[0]),
              ys_ = sp.map(p_ => p_[1]),
              w_ = Math.max(...xs_) - Math.min(...xs_),
              h_ = Math.max(...ys_) - Math.min(...ys_);
            addPanel({
              type: 'Screen slat',
              role: 'front',
              fin: sF,
              sec: lab,
              poly: rect(Math.max(w_, h_), Math.min(w_, h_)),
              grain: 'w',
              band: 'none',
              notes:
                j === 0
                  ? [
                      `Fixed slatted screen: ${sl.sw} mm slats with ${f0(sl.gap)} mm gaps — use a spacer block of that size`,
                      sl.dir === 'v'
                        ? 'Glue and pin each slat to the front edges of the bottom, the shelves and the top'
                        : 'Glue and pin each slat to the front edges of the sides and uprights'
                    ]
                  : []
            });
            items.push(Object.assign(wf(fpq(sp, tf, tf, 'front', 'front'), sF), { sz: i + ':' + k }));
          });
          fronts.push({
            z0: q.z0,
            kind: 'screen',
            poly,
            sec: i,
            zone: k,
            idx: 0,
            handle: { type: 'none' },
            fabric: null,
            fin: sF,
            face: 'slat',
            slats: sl.slats,
            zF: tf
          });
          zr.slat = sl.n;
          if (
            sl.dir === 'h' &&
            Math.max(...(zr.comps && zr.comps.length ? zr.comps : [[q.xa, q.xb]]).map(c => c[1] - c[0])) > 900
          )
            warns.push(
              `${lab}: the horizontal slats span more than 900 mm between uprights and will bend when someone leans on them — split the level side by side, or use vertical slats.`
            );
          if (sl.dir === 'v' && !(zr.shelvesY || []).length && (zr.top ? q.maxU - zr.y0 : zr.h) > 1400)
            warns.push(
              `${lab}: the vertical slats are over 1.4 m long with nothing behind them to fix to — add a shelf in this level so they have something halfway.`
            );
        }
        if (z.type === 'open' && z.arch && !(q.desk && k === 0)) {
          // arched front frame: one board in front of the level, with a rounded opening over every compartment
          const outer = frontPoly(bL, bR, zr.fb0, zr.fb1),
            cm = zr.comps && zr.comps.length ? zr.comps : [[q.xa, q.xb]],
            lb = zr.lined || 0,
            cells = [],
            pieces = [],
            aF = FIN[z.archFin] ? z.archFin : FIN[zr.inFin] ? zr.inFin : M.front.fin,
            yTopF = x => (zr.fb1 != null ? zr.fb1 - g / 2 : q.top(x) - g / 2),
            yB = zr.fb0 + g / 2;
          // your settings: archOpen 'shelf' (an opening per shelf space) or 'tall' (one opening per compartment,
          // shelves seen behind it) · archTop 'half' | 'flat' | 'square' · archBorder = extra frame around each opening (mm)
          const aTall = z.archOpen === 'tall',
            aTop = ['flat', 'square'].includes(z.archTop) ? z.archTop : 'half',
            aB = Math.max(0, Math.min(150, +z.archBorder || 0));
          const rect_ = (x0, x1, y0, y1) => [
            [x0, y0],
            [x1, y0],
            [x1, y1],
            [x0, y1]
          ];
          cm.forEach(([cl, cr], ci) => {
            if (ci === 0) cl += lb;
            if (ci === cm.length - 1) cr -= lb;
            if (cr - cl < 80) return;
            const sy = aTall
                ? []
                : (zr.shelvesY || [])
                    .filter(([y, l, r_]) => l < cr - 5 && r_ > cl + 5)
                    .map(a_ => a_[0])
                    .sort((a_, b_) => a_ - b_),
              zt = (zr.top ? minUnder(q, cl, cr) : zr.y0 + zr.h) - lb;
            let yb = zr.y0 + lb;
            if (yb - yB > 1) pieces.push(rect_(cl, cr, yB, yb));
            [...sy, zt].forEach((yt, j, all) => {
              // the opening: inside the space [cl, cr] × [yb, yt], minus the border
              const l = cl + aB,
                r = cr - aB,
                ob = yb + aB,
                ot = yt - aB,
                w = r - l,
                cx = (l + r) / 2;
              if (w > 60 && ot - ob > 70) {
                const ryMax = Math.max(0, ot - ob - 30),
                  ry = aTop === 'square' ? 0 : Math.min(aTop === 'flat' ? w * 0.22 : w / 2, ryMax),
                  arc = (a0, a1, n_) =>
                    Array.from({ length: n_ + 1 }, (_, m) => {
                      const t_ = a0 + ((a1 - a0) * m) / n_;
                      return [cx + (Math.cos(t_) * w) / 2, ot - ry + Math.sin(t_) * ry];
                    });
                if (ry >= 20) {
                  cells.push([[l, ob], [r, ob], ...arc(0, Math.PI, 16)]);
                  // frame above the round top, in two halves (each half is a simple shape)
                  pieces.push([[r, ot - ry], [r, yt], [cx, yt], ...arc(Math.PI / 2, 0, 8).slice(1)]);
                  pieces.push([[l, yt], [l, ot - ry], ...arc(Math.PI, Math.PI / 2, 8).slice(1)]);
                } else {
                  cells.push(rect_(l, r, ob, ot));
                  if (yt - ot > 0.5) pieces.push(rect_(l, r, ot, yt));
                }
                if (aB > 0.5) {
                  pieces.push(rect_(cl, l, yb, yt));
                  pieces.push(rect_(r, cr, yb, yt));
                  pieces.push(rect_(l, r, yb, ob));
                }
              } else pieces.push(rect_(cl, cr, yb, yt));
              const yn = j < all.length - 1 ? yt + ts : null;
              if (yn != null) pieces.push(rect_(cl, cr, yt, yn));
              else
                pieces.push([
                  [cl, yt],
                  [cr, yt],
                  [cr, yTopF(cr)],
                  [cl, yTopF(cl)]
                ]);
              yb = yt + ts;
            });
          });
          {
            const xs = [bL + g / 2];
            cm.forEach(([cl, cr], ci) => {
              xs.push(ci === 0 ? cl + lb : cl, ci === cm.length - 1 ? cr - lb : cr);
            });
            xs.push(bR - g / 2);
            for (let j = 0; j < xs.length; j += 2) {
              const xa_ = xs[j],
                xb_ = xs[j + 1];
              if (xb_ - xa_ > 0.5)
                pieces.push([
                  [xa_, yB],
                  [xb_, yB],
                  [xb_, yTopF(xb_)],
                  [xa_, yTopF(xa_)]
                ]);
            }
          }
          if (cells.length) {
            addPanel({
              type: 'Arched front frame',
              role: 'front',
              fin: aF,
              sec: lab,
              poly: outer,
              holes: cells.map(c => ({ poly: c, x: c[0][0], y: c[0][1] })),
              grain: 'h',
              band: 'none',
              notes: [
                `One board with ${cells.length} arched opening${cells.length > 1 ? 's' : ''}: saw them out with a jigsaw just inside the line, then sand or rout to the line`,
                'Glue and pin it onto the front edges of the sides, shelves and uprights, where doors would sit',
                'MDF is the easiest board for this — no grain to tear out, and it paints well'
              ]
            });
            arches.push({ poly: outer, holes: cells, fin: aF, sec: i, zone: k });
            pieces.forEach(pc => {
              if (Math.max(...pc.map(p_ => p_[1])) - Math.min(...pc.map(p_ => p_[1])) < 0.5) return;
              items.push(Object.assign(wf(fp(pc, tf - q.z0, tf, 'front'), aF), { sz: i + ':' + k }));
            });
            zr.arch = cells.length;
            if (cells.some(c => Math.max(...c.map(p_ => p_[0])) - Math.min(...c.map(p_ => p_[0])) > 900))
              warns.push(
                `${lab}: an arch wider than about 900 mm gets very tall and flat at the sides — split the level side by side for narrower arches.`
              );
          }
        }
        if (z.type === 'closed') {
          const vdx = zr.vdx || [],
            follow = vdx.length && !(+z.doors > 0);
          const edges0 = follow ? [bL, ...vdx, bR] : null,
            hfix = [],
            edges = edges0
              ? edges0.flatMap((a_, c_) => {
                  if (c_ === edges0.length - 1) return [a_];
                  const b_ = edges0[c_ + 1];
                  if (b_ - a_ - g > 650) {
                    hfix.push('L', 'R');
                    return [a_, (a_ + b_) / 2];
                  }
                  hfix.push(null);
                  return [a_];
                })
              : null;
          const nd = follow ? edges.length - 1 : +z.doors > 0 ? +z.doors : bR - bL > 620 ? 2 : 1,
            wd = (bR - bL) / nd;
          if (!follow && wd - g > 650 && !z.dog)
            warns.push(`${lab}: doors are ${f0(wd - g)} mm wide — consider ${nd + 1} doors.`);
          if (!follow && nd > 1 && wd - g < 200 && !z.dog)
            warns.push(
              `${lab}: doors are only ${f0(wd - g)} mm wide — too narrow for hinges and a handle. Use ${Math.max(1, Math.floor((wd * nd) / 300))} door${Math.floor((wd * nd) / 300) > 1 ? 's' : ''} here.`
            );
          if (face === 'curtain') {
            const poly = frontPoly(bL, bR, zr.fb0, zr.fb1),
              col = FABRICS[z.fabricCol] ? z.fabricCol : 'oatmeal',
              ys = poly.map(p => p[1]);
            H.curtain.push({ sec: lab, w: f0((bR - bL) * 2.2), h: f0(Math.max(...ys) - Math.min(...ys) + 80), col });
            fronts.push({
              z0: q.z0,
              kind: 'curtain',
              poly,
              sec: i,
              zone: k,
              idx: 0,
              handle: { type: 'none' },
              fabric: col,
              fin: null,
              face: 'curtain',
              zF: tf + 10
            });
            items.push(Object.assign(fpq(poly, tf + 10, 6, 'fabric:' + col, 'front'), { sz: i + ':' + k }));
          } else if (z.doorMode === 'slide') {
            const n = Math.max(2, +z.doors || 2),
              ov = 40,
              W_ = bR - bL,
              dw = (W_ + (n - 1) * ov) / n,
              yt = zr.top ? topMinFront() : zr.fb1;
            H.slide.push({ sec: lab, L: f0(W_), n });
            if (
              (zr.top && q.topPts.some(p => p[0] > bL + 1 && p[0] < bR - 1)) ||
              (zr.top && Math.abs(q.top(bL) - q.top(bR)) > 5)
            )
              warns.push(
                `${lab}: sliding doors need a level top — the doors stop at the lowest point (${f0(yt)} mm); fill above with a fixed panel.`
              );
            const order = [...Array(n).keys()].sort((a, b) => (a % 2) - (b % 2));
            order.forEach(j => {
              const l = bL + j * (dw - ov),
                poly = frontPoly(l, l + dw, zr.fb0, yt),
                rearT = j % 2 === 0;
              mkFront(
                'door',
                'Sliding door',
                poly,
                j === 0 ? 'R' : 'L',
                [`Top-hung sliding door, ${ov} mm overlap, ${rearT ? 'rear' : 'front'} track`],
                false,
                j,
                rearT ? tf : 2 * tf + 8
              );
            });
          } else if (zr.joined == null)
            for (let j = 0; j < nd; j++) {
              const l = follow ? edges[j] : bL + j * wd,
                r_ = follow ? edges[j + 1] : bL + (j + 1) * wd;
              if (follow && r_ - l - g > 650)
                warns.push(`${lab}: door ${j + 1} is ${f0(r_ - l - g)} mm wide — add a divider or set the door count.`);
              if (follow && j === 0 && !z.dog) {
                const mn_ = Math.min(...edges.slice(1).map((e_, m_) => e_ - edges[m_] - g));
                if (mn_ < 150)
                  warns.push(
                    `${lab}: the narrowest door in level ${k + 1} is only ${f0(mn_)} mm wide — too narrow for hinges and a handle. Make this level open shelves, or set the door count so one door covers two compartments.`
                  );
              }
              const poly = ins ? inPoly(l, r_, inB, inT) : frontPoly(l, r_, zr.fb0, jTop);
              let hinge =
                follow && hfix[j]
                  ? hfix[j]
                  : nd === 1
                    ? z.hinge || 'L'
                    : j === 0
                      ? 'L'
                      : j === nd - 1
                        ? 'R'
                        : j % 2
                          ? 'R'
                          : 'L';
              const swNote = [];
              if (!z.dog && z.doorMode !== 'slide') {
                const xs_ = poly.map(p => p[0]),
                  xl = Math.min(...xs_),
                  xr = Math.max(...xs_),
                  wdr = xr - xl,
                  swing = hg => {
                    let mn = Infinity;
                    const xh = hg === 'L' ? xl : xr,
                      dir = hg === 'L' ? 1 : -1;
                    for (let a = 10; a <= 90; a += 10) {
                      const ca = Math.cos((a * Math.PI) / 180),
                        sa = Math.sin((a * Math.PI) / 180);
                      for (let u = 0; u <= 8; u++) {
                        const sd = (wdr * u) / 8,
                          t = polyTopAt(poly, Math.max(xl + 0.01, Math.min(xr - 0.01, xh + dir * sd)));
                        if (!isFinite(t)) continue;
                        mn = Math.min(mn, ceilAt(xh + dir * sd * ca) + (drop * (sd * sa + tf)) / D - t);
                      }
                    }
                    return mn;
                  };
                let cl = swing(hinge);
                if (cl < 3 && (nd === 1 || (follow && !hfix[j]))) {
                  const o = hinge === 'L' ? 'R' : 'L',
                    c2 = swing(o);
                  if (c2 >= 3) {
                    hinge = o;
                    cl = c2;
                    swNote.push('Hinged on its tall side so it clears the sloping ceiling when it opens');
                  }
                }
                if (cl < 3) {
                  zr.swingBad = true;
                  warns.push(
                    `${lab}: the ${nd > 1 ? (j === 0 ? 'left ' : j === nd - 1 ? 'right ' : 'middle ') : ''}door cannot open fully — its tall edge swings under the sloping ceiling and hits it (${f0(3 - cl)} mm short). ${nd > 1 ? 'Add an upright divider between the doors (then each door hinges on its tall side), or use a sliding door or open shelves here.' : 'Make the top closing strip taller, or use a sliding door or open shelves here.'}`
                  );
                }
              }
              const hh = Math.max(...poly.map(p => p[1])) - Math.min(...poly.map(p => p[1]));
              const hc = z.dog || zr.larder || zr.fridge ? 0 : hh <= 900 ? 2 : hh <= 1600 ? 3 : hh <= 2000 ? 4 : 5;
              if (zr.larder)
                swNote.push(
                  'No hinges: screw this door to the front of the larder frame with its brackets — it pulls straight out'
                );
              if (zr.fridge)
                swNote.push(
                  'No hinges: this door is fixed to the fridge’s own door with the fixing kit that comes with the fridge (door-on-door)'
                );
              if (jN && hh > 2300 && j === 0)
                warns.push(
                  `${lab}: the joined doors are ${f0(hh)} mm tall — doors over about 2.3 m are heavy and tend to warp. Use 19 mm or thicker board with a straightening fitting, or join fewer levels.`
                );
              H.hinges += hc;
              H.hk = H.hk || {};
              {
                const hx_ = hinge === 'L' ? l : r_,
                  onDiv = vdz.some(v => near(v, hx_)),
                  nb_ = secs[hinge === 'L' ? i - 1 : i + 1],
                  onShared =
                    !boxes &&
                    !onDiv &&
                    near(hx_, hinge === 'L' ? bL : bR) &&
                    nb_ &&
                    !nb_.panel &&
                    !nb_.door &&
                    !nb_.free &&
                    !q.free &&
                    nb_.z0 === q.z0,
                  hk_ = ins ? 'inset' : onDiv || onShared ? 'half' : 'std';
                H.hk[hk_] = (H.hk[hk_] || 0) + hc;
                if (hk_ === 'half' && hc)
                  swNote.push('Half-overlay hinges: this door shares its upright with the door next to it');
              }
              if (z.doorMode === 'pocket') H.pocket++;
              mkFront(
                'door',
                z.doorMode === 'pocket' ? 'Pocket door' : 'Door',
                poly,
                hinge,
                (hc ? [`${hc} hinges · ${hinge === 'L' ? 'left' : 'right'}-hand`] : [])
                  .concat(
                    jN
                      ? [
                          `One tall door over ${jN + 1} levels — the fixed board${jN > 1 ? 's' : ''} between them stay${jN > 1 ? '' : 's'} behind the door`
                        ]
                      : []
                  )
                  .concat(swNote)
                  .concat(
                    z.doorMode === 'pocket' ? ['Pocket system: opens, then slides back into a 25 mm side pocket'] : []
                  ),
                false,
                j
              );
            }
          if (z.doorMode === 'pocket')
            warns.push(
              `${lab}: pocket doors need about 25 mm each side inside the cabinet for the pocket — inside width drops to ${f0(q.w - 50)} mm.`
            );
        }
        if (z.type === 'drawers') {
          const cnt = Math.max(1, +z.count || 1),
            y1 = zr.fb1 ?? topMinFront();
          if (zr.top) warns.push(`${lab}: drawers in the top level use the lowest point of the ceiling.`);
          const hd = (y1 - zr.fb0) / cnt;
          if (hd < 90) warns.push(`${lab}: drawer fronts are only ${f0(hd)} mm tall.`);
          const sl = SLIDES.filter(v => v <= q.Dh - 10 - (ins ? tf + 3 : 0)).pop() || 250;
          if (q.Dh - 10 - (ins ? tf + 3 : 0) < 250)
            warns.push(
              `${lab}: ${f0(q.Dh)} mm inside is too shallow for drawer runners (the shortest are 250 mm) — use doors or open shelves here.`
            );
          const iT = inT ?? minUnder(q, q.xa, q.xb) - gi,
            ihd = (iT - inB) / cnt;
          const nc = Math.max(1, Math.ceil(q.w / (ECO ? 900 : 1200)), Math.min(+z.split || 1, Math.floor(q.w / 250))),
            bw = (q.w - (nc - 1) * tc) / nc,
            xe = [bL];
          for (let c = 1; c < nc; c++) {
            const xm = q.xa + c * bw + (c - 1) * tc + tc / 2,
              yt = zr.top ? minUnder(q, q.xa, q.xb) : zr.y0 + zr.h;
            xe.push(xm);
            vdz.push(xm);
            addPanel({
              type: 'Vertical divider',
              role: 'carcass',
              sec: lab,
              poly: rect(q.Dh, yt - zr.y0),
              grain: 'h',
              band: 'front',
              bandLen: yt - zr.y0,
              notes: [
                `Between the two drawer stacks, centred ${f0(xm - q.xa)} mm from the inside left of ${lab}; fix with dowels top and bottom. A drawer wider than about ${ECO ? 900 : 1200} mm sags and has no runners made for it, so this column gets ${nc} stacks side by side`
              ]
            });
            items.push({
              k: 'prism',
              poly: [
                [0, zr.y0],
                [q.Dh, zr.y0],
                [q.Dh, yt],
                [0, yt]
              ],
              toW: (u, v2) => [xm - tc / 2, v2, -u - q.z0],
              ext: [tc, 0, 0],
              role: 'carcass'
            });
            (result.vdivs = result.vdivs || []).push({
              x: xm - tc / 2,
              y0: zr.y0,
              y1: yt,
              sec: i,
              zone: zr.k,
              vis: false
            });
          }
          xe.push(bR);
          zr.dCols = nc;
          for (let j = 0; j < cnt; j++)
            for (let c = 0; c < nc; c++) {
              const poly = ins
                ? inPoly(
                    xe[c],
                    xe[c + 1],
                    inB + j * ihd + (j ? g / 2 : 0),
                    inB + (j + 1) * ihd - (j < cnt - 1 ? g / 2 : 0)
                  )
                : frontPoly(xe[c], xe[c + 1], zr.fb0 + j * hd, zr.fb0 + (j + 1) * hd);
              H.slides[sl] = (H.slides[sl] || 0) + 1;
              drawerBox(lab, bw, sl, ins ? ihd : hd);
              mkFront('drawer', 'Drawer front', poly, null, [`Box for ${sl} mm runners`], true, j * nc + c);
            }
        }
        if (z.type === 'seat') {
          const n = Math.max(1, Math.min(4, +z.count || (bR - bL > 900 ? 2 : 1))),
            w_ = (bR - bL) / n,
            y1 = zr.fb1 ?? topMinFront(),
            sl = SLIDES.filter(v => v <= q.Dh - 10).pop() || 250;
          {
            const bw = (q.w - (n - 1) * tc) / n,
              yt = zr.y0 + zr.h;
            for (let c = 1; c < n; c++) {
              const xm = q.xa + c * bw + (c - 1) * tc + tc / 2;
              vdz.push(xm);
              addPanel({
                type: 'Vertical divider',
                role: 'carcass',
                sec: lab,
                poly: rect(q.Dh, yt - zr.y0),
                grain: 'h',
                band: 'front',
                bandLen: yt - zr.y0,
                notes: [
                  `Under the seat board between the drawers, centred ${f0(xm - q.xa)} mm from the inside left of ${lab}: it carries the seat and the drawer runners. Dowels top and bottom`
                ]
              });
              items.push({
                k: 'prism',
                poly: [
                  [0, zr.y0],
                  [q.Dh, zr.y0],
                  [q.Dh, yt],
                  [0, yt]
                ],
                toW: (u, v2) => [xm - tc / 2, v2, -u - q.z0],
                ext: [tc, 0, 0],
                role: 'carcass'
              });
              (result.vdivs = result.vdivs || []).push({
                x: xm - tc / 2,
                y0: zr.y0,
                y1: yt,
                sec: i,
                zone: zr.k,
                vis: false
              });
            }
            if (bw > 800 && tc < 22)
              warns.push(
                `${lab}: the seat board spans ${f0(bw)} mm in ${tc} mm board — it will bend when someone sits in the middle. Use two drawers under it (that adds a support in the middle), or glue a second layer under the board.`
              );
          }
          if (zr.h < 300 || zr.h > 520)
            warns.push(
              `${lab}: a seat at ${f0(zr.y0 + zr.h)} mm is ${zr.h < 300 ? 'low' : 'high'} — 420–480 mm including the cushion is comfortable.`
            );
          for (let j = 0; j < n; j++) {
            const poly = frontPoly(bL + j * w_, bL + (j + 1) * w_, zr.fb0, y1);
            H.slides[sl] = (H.slides[sl] || 0) + 1;
            drawerBox(lab, (q.w - (n - 1) * tc) / n, sl, y1 - zr.fb0, 'Bench drawer.');
            mkFront(
              'drawer',
              'Bench drawer front',
              poly,
              null,
              [`Deep drawer under the seat, ${sl} mm runners`],
              true,
              j
            );
          }
          H.cushion.push({
            sec: lab,
            w: f0(q.w - 10),
            d: f0(q.Dh - 20),
            col: FABRICS[z.fabricCol] ? z.fabricCol : 'oatmeal'
          });
        }
        if (z.type === 'passage') {
          const st = q.s.doorStyle || 'visible';
          zr.passage = st;
          const top = zr.fb1 ?? zr.y0 + zr.h,
            hinge = q.s.doorHinge || 'L';
          if (st === 'hallway' || st === 'open') {
            const bt = tf,
              fin = M.front.fin,
              ph = zr.y0 + zr.h;
            for (let l = 0; l < 2; l++)
              addPanel({
                type: 'Hallway side lining',
                role: 'front',
                t: bt,
                sec: lab,
                poly: rect(q.Dh, ph),
                grain: 'h',
                band: 'front',
                bandLen: ph,
                notes: ['Lines the inside of the passage; glue + pin to the box side']
              });
            addPanel({
              type: 'Hallway head lining',
              role: 'front',
              t: bt,
              sec: lab,
              poly: rect(q.w - 2 * bt, q.Dh),
              grain: 'w',
              band: 'front',
              bandLen: q.w,
              notes: ['Lines the underside of the door head']
            });
            [q.xa, q.xb - bt].forEach(x =>
              items.push({
                k: 'prism',
                poly: [
                  [0, 0],
                  [q.Dh, 0],
                  [q.Dh, ph],
                  [0, ph]
                ],
                toW: (u, v) => [x, v, -u - q.z0],
                ext: [bt, 0, 0],
                role: 'front'
              })
            );
            items.push(hzq(q.xa, q.xb, ph - bt, bt, 0, q.Dh, 'front'));
            linings.push({ x0: q.xa, x1: q.xb, y0: 0, y1: ph, bt, fin, nb: true });
            zr.hall = { x0: q.xa + bt, x1: q.xb - bt, y1: ph - bt };
            if (st === 'hallway') {
              const lw = q.w - 2 * bt - 6,
                lh = ph - bt - 12,
                lx = q.xa + bt + 3,
                poly = [
                  [lx, 8],
                  [lx + lw, 8],
                  [lx + lw, 8 + lh - 4],
                  [lx, 8 + lh - 4]
                ],
                ex = hinge === 'L' ? lx + lw : lx,
                sx = hinge === 'L' ? -1 : 1;
              addPanel({
                type: 'Door leaf facing (at the wall)',
                role: 'front',
                sec: lab,
                poly,
                grain: 'h',
                band: 'all',
                notes: [
                  'Glue to a 40 mm solid-core door blank, hung in the wall opening behind the passage',
                  '3 butt hinges + lever handle and latch set'
                ]
              });
              (H.passage = H.passage || []).push({ sec: lab, style: 'hallway', w: f0(lw), h: f0(lh) });
              const hs = { type: 'lever', x: ex + sx * 65, y: 1050, dir: 'v', sx };
              zr.hall.leaf = { poly, hs };
              items.push(Object.assign(fpq(poly, -q.Dh + 5, 40, 'front'), {}));
            } else (H.passage = H.passage || []).push({ sec: lab, style: 'open', w: f0(q.w - 2 * bt), h: f0(ph - bt) });
          } else if ((+q.s.doorLeaves || (q.w > 1250 ? 2 : 1)) === 2) {
            const hid = st === 'hidden',
              mid = (bL + bR) / 2;
            [
              [bL, mid, 'L'],
              [mid, bR, 'R']
            ].forEach(([a, b2, hg], j) => {
              const poly = frontPoly(a, b2, 8, zr.fb1),
                xs = poly.map(p => p[0]),
                l = Math.min(...xs),
                r = Math.max(...xs),
                ex = hg === 'L' ? r : l,
                sx = hg === 'L' ? -1 : 1,
                hs = hid ? { type: 'none' } : { type: 'lever', x: ex + sx * 65, y: 1050, dir: 'v', sx };
              addPanel({
                type: hid ? 'Hidden double door leaf facing' : 'Double door leaf facing',
                role: 'front',
                sec: lab,
                poly,
                grain: 'h',
                band: 'all',
                notes: [
                  hid
                    ? 'Glue to a 40 mm solid-core door blank; concealed hinges ×3 + push latch'
                    : 'Glue to a 40 mm solid-core door blank; 3 butt hinges',
                  j
                    ? 'Active leaf: lever handle + latch'
                    : 'Fixed leaf: flush bolts top and bottom' + (hid ? '' : ' + dummy handle')
                ]
              });
              (H.passage = H.passage || []).push({
                sec: lab,
                style: st + ' (pair)',
                w: f0(r - l),
                h: f0(Math.max(...poly.map(p => p[1])) - 8)
              });
              fronts.push({
                z0: q.z0,
                kind: 'door',
                poly,
                hinge: hg,
                sec: i,
                zone: k,
                idx: j,
                handle: hs,
                fabric: null,
                fin: null,
                leaf: true
              });
              items.push(Object.assign(fpq(poly, tf, tf, 'front', 'front'), { sz: i + ':' + k }));
            });
          } else {
            const poly = frontPoly(bL, bR, 8, zr.fb1),
              hid = st === 'hidden';
            const xs = poly.map(p => p[0]),
              l = Math.min(...xs),
              r = Math.max(...xs),
              ex = hinge === 'L' ? r : l,
              sx = hinge === 'L' ? -1 : 1,
              hs = hid ? { type: 'none' } : { type: 'lever', x: ex + sx * 65, y: 1050, dir: 'v', sx };
            addPanel({
              type: hid ? 'Hidden door leaf facing' : 'Door leaf facing',
              role: 'front',
              sec: lab,
              poly,
              grain: 'h',
              band: 'all',
              notes: hid
                ? [
                    'Glue to a 40 mm solid-core door blank; same finish as the fronts so it disappears',
                    'Concealed (invisible) door hinges ×3 + magnetic push latch; no handle'
                  ]
                : ['Glue to a 40 mm solid-core door blank', '3 butt hinges + lever handle and latch set']
            });
            (H.passage = H.passage || []).push({
              sec: lab,
              style: st,
              w: f0(r - l),
              h: f0(Math.max(...poly.map(p => p[1])) - 8)
            });
            fronts.push({
              z0: q.z0,
              kind: 'door',
              poly,
              hinge,
              sec: i,
              zone: k,
              idx: 0,
              handle: hs,
              fabric: null,
              fin: null,
              leaf: true
            });
            items.push(Object.assign(fpq(poly, tf, tf, 'front', 'front'), { sz: i + ':' + k }));
          }
        }
        if (z.type === 'speaker' && !q.deskShut) {
          const poly = frontPoly(bL, bR, zr.fb0, zr.fb1),
            cxs = (bL + bR) / 2,
            yb = zr.fb0 + g / 2,
            yt = (zr.fb1 != null ? zr.fb1 : topMinFront()) - g / 2,
            ph = yt - yb,
            pw = bR - bL - g;
          const wo = +z.woofer || 0,
            tw = +z.tweeter || 0,
            nw = Math.max(0, +z.nw || 0);
          let dr = [];
          if (nw === 2 && tw > 0) dr = [wo, tw, wo];
          else {
            if (tw > 0) dr.push(tw);
            for (let j = 0; j < nw; j++) dr.push(wo);
          }
          const gp_ = 30,
            stack = dr.reduce((a, d) => a + d, 0) + gp_ * Math.max(0, dr.length - 1);
          if (stack > ph - 30)
            warns.push(`${lab}: speaker drivers (${f0(stack)} mm stacked) don't fit the ${f0(ph)} mm baffle.`);
          if (wo > pw - 40) warns.push(`${lab}: a Ø${wo} cut-out leaves too little baffle in ${f0(pw)} mm width.`);
          let yy = yb + ph / 2 + stack / 2;
          const hs = [];
          dr.forEach(d => {
            yy -= d / 2;
            hs.push({ x: cxs, y: yy, d });
            yy -= d / 2 + gp_;
          });
          zr.vol = (q.w * (zr.top ? zr.hMin : zr.h) * q.Dh) / 1e6;
          H.baffles++;
          const gcol = FABRICS[z.fabricCol] ? z.fabricCol : 'charcoal';
          if (z.grille) addFabric(poly, gcol, lab);
          addPanel({
            type: 'Speaker baffle',
            role: 'front',
            fin: finOf(z.fin, undefined),
            sec: lab,
            poly,
            holes: hs,
            grain: 'h',
            band: 'all',
            notes: [
              `Cabinet volume behind ≈ ${zr.vol.toFixed(1)} L`,
              z.grille
                ? `Wrap in ${FABRICS[gcol].name.toLowerCase()} acoustic fabric`
                : 'Fix with screws from inside; seal with foam tape'
            ]
          });
          fronts.push({
            z0: q.z0,
            kind: 'baffle',
            poly,
            holes: hs,
            grille: !!z.grille,
            fabric: z.grille ? gcol : null,
            sec: i,
            zone: k,
            fin: finOf(z.fin, null)
          });
          items.push(
            Object.assign(wf(fpq(poly, tf, tf, z.grille ? 'fabric:' + gcol : 'front', 'front'), finOf(z.fin, null)), {
              sz: i + ':' + k
            })
          );
          if (!z.grille) hs.forEach(h => items.push({ k: 'hole', x: h.x, y: h.y, d: h.d, z: tf - q.z0, tag: 'front' }));
        }
        if (z.type === 'opening' && !lead) {
          const isG = gp && zr.k === gp.ko,
            gx0 = q.xa,
            gx1 = isG ? gEnd : q.xb,
            oh = zr.top ? zr.hMin : zr.h,
            oy0 = zr.y0,
            oy1 = zr.y0 + oh,
            ol = isG ? glab : lab;
          let ix0 = gx0,
            ix1 = gx1,
            iy0 = oy0,
            iy1 = oy1;
          if (z.box || (z.drench && FIN[z.inFin])) {
            const bt = +z.boxT > 0 ? +z.boxT : tf,
              ext = boxExt(z),
              dep = q.Dh + ext,
              role = 'front',
              fin = boxFinOf(z),
              nt = `Projects ${ext} mm past the carcass ${Math.abs(ext - tf) < 0.6 ? 'so its front edge is flush with the doors' : '(the doors are ' + tf + ' mm thick)'}`;
            for (let l = 0; l < 2; l++)
              addPanel({
                type: 'Niche box (top/bottom)',
                role,
                fin,
                t: bt,
                sec: ol,
                poly: rect(gx1 - gx0, dep),
                grain: 'w',
                band: 'front',
                bandLen: gx1 - gx0,
                notes: [nt]
              });
            for (let l = 0; l < 2; l++)
              addPanel({
                type: 'Niche box (side)',
                role,
                fin,
                t: bt,
                sec: ol,
                poly: rect(oh - 2 * bt, dep),
                grain: 'h',
                band: 'front',
                bandLen: oh - 2 * bt,
                notes: [nt]
              });
            items.push(wf(hzq(gx0, gx1, oy0, bt, -ext, q.Dh, role), fin));
            items.push(wf(hzq(gx0, gx1, oy1 - bt, bt, -ext, q.Dh, role), fin));
            [gx0, gx1 - bt].forEach(x =>
              items.push({
                k: 'prism',
                poly: [
                  [-ext, oy0 + bt],
                  [q.Dh, oy0 + bt],
                  [q.Dh, oy1 - bt],
                  [-ext, oy1 - bt]
                ],
                toW: (u, v) => [x, v, -u - q.z0],
                ext: [bt, 0, 0],
                role,
                fin
              })
            );
            ix0 += bt;
            ix1 -= bt;
            iy0 += bt;
            iy1 -= bt;
            linings.push({ x0: gx0, x1: gx1, y0: oy0, y1: oy1, bt, fin });
            zr.inFin = zr.inFin || null;
            zr.boxNote = `boxed ${bt} mm, flush with doors`;
          }
          zr.open = { x0: gx0, x1: gx1, y0: oy0, y1: oy1, ix0, ix1, iy0, iy1, span: isG ? gp.members.length : 1 };
          const look = z.look || 'tv';
          if (look === 'nook') {
            zr.nook = true;
            const nw = ix1 - ix0,
              nh = iy1 - iy0;
            H.led.push({ sec: ol, L: f0(nw - 60), why: 'reading light in the nook (warm white, with its own switch)' });
            H.funParts.push({
              n: `Reading nook: foam mattress ${f0(nw - 12)} × ${f0(q.Dh - 30)} mm, 80 mm thick, with a washable cover`,
              q: '1',
              sec: ol
            });
            H.funParts.push({
              n: 'Reading nook: back cushions about 300 × 300 mm',
              q: `${nw > 1000 ? 3 : 2}`,
              sec: ol
            });
            // sitting height above an 80 mm cushion: 700 mm for small children, 800+ up to about 12 (900+ for teenagers and adults: no note)
            {
              const sh = nh - 80,
                need = (age, mm) => `${age} need about ${f0(mm + 80)} mm inside (${f0(mm)} mm above an 80 mm cushion)`;
              if (sh < 700)
                warns.push(
                  `${ol}: the reading nook is ${f0(nh)} mm high inside — about ${f0(sh)} mm above a cushion, too low to sit upright even for small children. ${need('Young children', 750)}; make this level taller.`
                );
              else if (sh < 800)
                warns.push(
                  `${ol}: the reading nook is ${f0(nh)} mm high inside — about ${f0(sh)} mm above a cushion: fine for children up to about 7, tight from about 8. ${need('Children up to about 12', 870)}.`
                );

            }
            if (iy0 > (z.nookStep ? 800 : 550))
              warns.push(
                `${ol}: the reading nook starts ${f0(iy0)} mm above the floor — 250 to 450 mm is easy for a child to climb into. Lower the level below it, or plan a step.`
              );
            if (q.Dh < 450)
              warns.push(
                `${ol}: ${f0(q.Dh)} mm is shallow to sit in — a reading nook is comfortable from about 500 mm deep.`
              );
            if (nw < 700)
              warns.push(
                `${ol}: the reading nook is only ${f0(nw)} mm wide — about 900 mm lets a child sit sideways with legs up.`
              );
            if (nw > 800)
              warns.push(
                `${ol}: the board under the reading nook carries a sitting child over ${f0(nw)} mm — put an upright under it in the level below (Split side by side), or glue a second board under it.`
              );
          }
          if (look === 'nook') {
            const Wi = ix1 - ix0,
              Hi = iy1 - iy0,
              cx = (ix0 + ix1) / 2,
              nk = { sec: i, zone: k, x0: ix0, x1: ix1, y0: iy0, y1: iy1, D: q.Dh, z0: q.z0 },
              fabN = c => (FABRICS[c] || FABRICS.charcoal).name.toLowerCase(),
              sz_ = i + ':' + k;
            const fF = FIN[z.nookFrontFin] ? z.nookFrontFin : z.drench && FIN[z.inFin] ? z.inFin : M.front.fin,
              nf = z.nookFront;
            // 1 + 2: a front board with an arched, round or house-shaped opening
            if (nf === 'arch' || nf === 'eyebrow' || nf === 'port' || nf === 'house' || nf === 'pod') {
              const X0 = q.bL + g / 2,
                X1 = (isG ? gEnd + (q.bR - q.xb) : q.bR) - g / 2,
                Y0 = zr.fb0 + g / 2,
                Y1 = (zr.fb1 != null ? zr.fb1 : oy1 + tc) - g / 2,
                outer = [
                  [X0, Y0],
                  [X1, Y0],
                  [X1, Y1],
                  [X0, Y1]
                ],
                holes = [];
              const arc = (cx_, cy_, rx, ry, a0, a1, n_) =>
                Array.from({ length: n_ + 1 }, (_, m) => {
                  const t_ = a0 + ((a1 - a0) * m) / n_;
                  return [cx_ + Math.cos(t_) * rx, cy_ + Math.sin(t_) * ry];
                });
              // smaller opening with more covered front around it: size scales the width (and a little of the height), position puts it left / middle / right
              const osz = [0.8, 0.65, 0.5].includes(+z.nookSize) ? +z.nookSize : 1,
                small = osz < 1;
              // porthole with your own size and/or position (portD = diameter, portX = sideways from the middle, portY = up from the lowest place)
              const ownPort = nf === 'port' && (+z.portD > 0 || +z.portX || +z.portY);
              if (ownPort) {
                const rMax = Math.max(120, Math.min(Wi, Hi) / 2 - 20),
                  r_ = +z.portD > 0 ? Math.max(120, Math.min(rMax, +z.portD / 2)) : Math.max(120, Math.min(Wi, Hi) / 2 - 30),
                  pcx = Math.max(ix0 + r_ + 20, Math.min(ix1 - r_ - 20, cx + (+z.portX || 0))),
                  pcy = Math.max(iy0 + r_ + 20, Math.min(iy1 - r_ - 20, iy0 + 30 + r_ + (+z.portY || 0)));
                holes.push(arc(pcx, pcy, r_, r_, 0, Math.PI * 2, 48).slice(0, -1));
                zr.port = { cx: pcx, cy: pcy, r: r_ };
                if (+z.portD > 0 && Math.abs(r_ * 2 - +z.portD) > 2)
                  warns.push(`${ol}: the porthole can be at most ${f0(rMax * 2)} mm across here (and at least 240 mm) — it is ${f0(r_ * 2)} mm now.`);
                if (r_ * 2 < 500)
                  warns.push(`${ol}: the porthole is ${f0(r_ * 2)} mm across — a child climbs in easily from about 500 mm.`);
                if (Math.abs(pcx - (cx + (+z.portX || 0))) > 1 || Math.abs(pcy - (iy0 + 30 + r_ + (+z.portY || 0))) > 1)
                  warns.push(`${ol}: the porthole was moved back inside the front — it needs 20 mm of board around it.`);
              } else if (small) {
                const ow = Math.min(Wi, Math.max(450, Wi * osz)),
                  oh = Math.min(Hi, Math.max(600, Hi * (0.55 + 0.45 * osz))),
                  side = Math.max(0, Math.min(120, (Wi - ow) / 2)),
                  ox0 = z.nookPos === 'l' ? ix0 + side : z.nookPos === 'r' ? ix1 - side - ow : (ix0 + ix1) / 2 - ow / 2,
                  ocx = ox0 + ow / 2;
                if (nf === 'port' || nf === 'pod') {
                  const r_ = Math.max(120, Math.min(ow, oh) / 2 - 20);
                  holes.push(arc(ocx, iy0 + 40 + r_, r_, r_, 0, Math.PI * 2, 48).slice(0, -1));
                } else if (nf === 'house') {
                  const rh = Math.min(oh * 0.4, ow * 0.45);
                  holes.push([
                    [ox0, iy0],
                    [ox0 + ow, iy0],
                    [ox0 + ow, iy0 + oh - rh],
                    [ocx, iy0 + oh],
                    [ox0, iy0 + oh - rh]
                  ]);
                  const lw = ox0 - ix0,
                    rw = ix1 - (ox0 + ow),
                    sw_ = Math.max(lw, rw),
                    r_ = Math.max(60, Math.min(120, sw_ / 2 - 50));
                  if (sw_ >= 260)
                    holes.push(
                      arc(rw >= lw ? ix1 - sw_ / 2 : ix0 + sw_ / 2, iy0 + oh * 0.62, r_, r_, 0, Math.PI * 2, 28).slice(
                        0,
                        -1
                      )
                    );
                } else {
                  const ry =
                    nf === 'eyebrow' ? Math.min(oh * 0.3, ow / 4) : Math.max(ow * 0.25, Math.min(ow / 2, oh - 150));
                  holes.push([[ox0, iy0], [ox0 + ow, iy0], ...arc(ocx, iy0 + oh - ry, ow / 2, ry, 0, Math.PI, 24)]);
                }
                if (ow < 500)
                  warns.push(
                    `${ol}: the opening of the reading nook is ${f0(ow)} mm wide — a child climbs in easily from about 500 mm. Choose a larger opening.`
                  );
              } else if (nf === 'port') {
                const r_ = Math.max(120, Math.min(Wi, Hi) / 2 - 30);
                holes.push(arc(cx, iy0 + 30 + r_, r_, r_, 0, Math.PI * 2, 36).slice(0, -1));
              } else if (nf === 'pod') {
                const shp = sheetOf(M.front.sheet),
                  r_ = Math.max(
                    150,
                    Math.min(Math.min(Wi, Hi) / 2 - 10, (Math.min(shp.W, shp.L) - 2 * (+O.trim || 0) - 6) / 2 - 45)
                  );
                holes.push(arc(cx, (iy0 + iy1) / 2, r_, r_, 0, Math.PI * 2, 48).slice(0, -1));
              } else if (nf === 'house') {
                const wd = Wi >= 1000 ? Wi * 0.6 : Wi,
                  x1h = ix0 + wd,
                  rh = Math.min(Hi * 0.4, wd * 0.4);
                holes.push([
                  [ix0, iy0],
                  [x1h, iy0],
                  [x1h, iy1 - rh],
                  [ix0 + wd / 2, iy1],
                  [ix0, iy1 - rh]
                ]);
                if (Wi >= 1000) {
                  const sw_ = ix1 - x1h,
                    r_ = Math.max(60, Math.min(120, sw_ / 2 - 50));
                  if (sw_ >= 260)
                    holes.push(arc(x1h + sw_ / 2 + 15, iy0 + Hi * 0.6, r_, r_, 0, Math.PI * 2, 28).slice(0, -1));
                }
              } else {
                const ry = nf === 'eyebrow' ? Math.min(Hi * 0.3, Wi / 4) : Math.min(Wi / 2, Hi - 200);
                holes.push([[ix0, iy0], [ix1, iy0], ...arc(cx, iy1 - ry, Wi / 2, ry, 0, Math.PI, 24)]);
              }
              const nmF = { arch: 'arched', eyebrow: 'low arch', port: 'porthole', house: 'house', pod: 'round pod' }[
                nf
              ];
              addPanel({
                type: `Reading nook front (${nmF})`,
                role: 'front',
                fin: fF,
                sec: ol,
                poly: outer,
                holes: holes.map(c => ({ poly: c, x: c[0][0], y: c[0][1] })),
                grain: 'w',
                band: 'all',
                notes: [
                  'One board with the opening sawn out: jigsaw just inside the line, then sand or rout to the line and round the edge over well — children climb over it',
                  'Glue and screw it onto the front edges around the niche, where doors would sit'
                ]
              });
              arches.push({ poly: outer, holes, fin: fF, sec: i, zone: k });
              items.push(Object.assign(wf(fpq(outer, tf, tf, 'front', 'front'), fF), { holes, sz: sz_ }));
              nk.front = nf;
              {
                const hx = holes[0].map(p_ => p_[0]),
                  hy = holes[0].map(p_ => p_[1]);
                nk.ob = [Math.min(...hx), Math.max(...hx), Math.min(...hy), Math.max(...hy)];
              }
              if (nf === 'pod') {
                // round pod: a tube of bent plywood behind the round opening, a thick rim in front, a ribbed cushion inside
                const [ox0, ox1, oy0, oy1] = nk.ob,
                  pcx = (ox0 + ox1) / 2,
                  pcy = (oy0 + oy1) / 2,
                  pr = (ox1 - ox0) / 2,
                  rimF = FIN[z.podFin] ? z.podFin : FIN[z.inFin] ? z.inFin : fF,
                  dep = q.Dh - 15,
                  rw = 45,
                  circ = rr => arc(pcx, pcy, rr, rr, 0, Math.PI * 2, 48).slice(0, -1),
                  fabC = FABRICS[z.fabricCol] ? z.fabricCol : Object.keys(FABRICS)[0];
                zr.nookPod = true;
                items.push(
                  Object.assign(wf(fpq(circ(pr), tf, tf + dep, 'front', 'front'), rimF), {
                    holes: [circ(pr - 12)],
                    sz: sz_
                  })
                );
                items.push(Object.assign(wf(fpq(circ(pr - 12), -(dep - 6), 6, 'front', 'front'), rimF), { sz: sz_ }));
                items.push(
                  Object.assign(wf(fpq(circ(pr + rw), tf + 36, 36, 'front', 'front'), rimF), {
                    holes: [circ(pr)],
                    sz: sz_
                  })
                );
                for (let m = 0; m < 2; m++)
                  addPanel({
                    type: 'Round pod rim (2 layers glued)',
                    role: 'front',
                    fin: rimF,
                    t: 18,
                    sec: ol,
                    poly: circ(pr + rw),
                    holes: [{ poly: circ(pr), x: pcx - pr, y: pcy }],
                    grain: 'h',
                    band: 'none',
                    notes: [
                      'Rout the outer and inner circle on a trammel; glue the two rings together, then round the front edge over well'
                    ]
                  });
                addPanel({
                  type: 'Round pod back disc',
                  role: 'front',
                  fin: rimF,
                  t: 6,
                  sec: ol,
                  poly: circ(pr - 12),
                  grain: 'h',
                  band: 'none',
                  notes: ['Closes the tube at the back; screw it to two battens on the back panel']
                });
                H.funParts.push({
                  n: `Round pod: bendable plywood, 2 layers of 6 mm, ${f0(2 * Math.PI * (pr - 6))} × ${f0(dep)} mm — bend it round 4 ribs cut to the circle and glue the layers`,
                  q: '2',
                  sec: ol
                });
                const nRib = 11,
                  a0 = (150 * Math.PI) / 180,
                  a1 = (390 * Math.PI) / 180,
                  ribs = [];
                for (let j = 0; j < nRib; j++) {
                  const s0 = a0 + ((a1 - a0) * j) / nRib + 0.012,
                    s1 = a0 + ((a1 - a0) * (j + 1)) / nRib - 0.012;
                  const rib = [
                    ...arc(pcx, pcy, pr - 14, pr - 14, s0, s1, 4),
                    ...arc(pcx, pcy, pr - 14 - 72, pr - 14 - 72, s1, s0, 4)
                  ];
                  ribs.push(rib);
                  items.push(Object.assign(fpq(rib, tf - 22, dep - 30, 'fabric:' + fabC), { sz: sz_ }));
                }
                H.funParts.push({
                  n: `Round pod: ribbed cushion of ${nRib} foam rolls Ø70 × ${f0(dep - 40)} mm, sewn side by side, in ${fabN(fabC)}`,
                  q: '1',
                  sec: ol
                });
                for (let j_ = H.funParts.length - 1; j_ >= 0; j_--) {
                  const fp_ = H.funParts[j_];
                  if (fp_.sec === ol && /^Reading nook: (foam mattress|back cushions)/.test(fp_.n))
                    H.funParts.splice(j_, 1);
                }
                const ledges = [];
                if (z.nookLedges)
                  [pcy + pr * 0.05, pcy + pr * 0.38].forEach(y => {
                    const hc = Math.sqrt(Math.max(0, (pr - 12) ** 2 - (y - pcy) ** 2)) - 110;
                    if (hc < 110) return;
                    ledges.push([pcx - hc, pcx + hc, y]);
                    items.push(wf(hzq(pcx - hc, pcx + hc, y, 12, dep - 110, dep - 6, 'front'), rimF));
                    items.push(wf(hzq(pcx - hc, pcx + hc, y + 12, 26, dep - 110, dep - 98, 'front'), rimF));
                    addPanel({
                      type: 'Round pod book ledge',
                      role: 'front',
                      fin: rimF,
                      t: 12,
                      sec: ol,
                      poly: rect(2 * hc, 100),
                      grain: 'w',
                      band: 'none',
                      notes: ['Screwed to the back disc; glue a 26 mm lip on the front edge']
                    });
                  });
                if (2 * pr < 850)
                  warns.push(
                    `${ol}: the round pod is ${f0(2 * pr)} mm across — a child lies back comfortably from about 900 mm. Make the niche taller and wider, or choose a larger opening.`
                  );
                nk.pod = { cx: pcx, cy: pcy, r: pr, rw, rim: rimF, fab: FABRICS[fabC].c, ribs, ledges };
              }
            }
            // 3: curtain
            if (z.nookCurtain) {
              const cc = FABRICS[z.nookCurtCol] ? z.nookCurtCol : FABRICS.sand ? 'sand' : Object.keys(FABRICS)[0],
                ob = nk.ob || [ix0, ix1, iy0, iy1],
                cw_ = ob[1] - ob[0],
                ov = nk.ob ? 40 : 0,
                cx0 = Math.max(ix0, ob[0] - ov),
                cx1 = Math.min(ix1, ob[1] + ov),
                cyT = Math.min(iy1 - 10, ob[3] + (nk.ob ? 30 : -10)),
                cyB = iy0 + 10,
                dw_ = Math.min((cx1 - cx0) * 0.22, 260);
              nk.curt = { col: FABRICS[cc].c, x0: cx0, x1: cx1, y0: cyB, y1: cyT, dw: dw_ };
              H.funParts.push({
                n: `Reading nook: curtain rail ${f0(cx1 - cx0)} mm with gliders, ${nk.ob ? 'on the back of the front panel, above the opening' : 'under the top of the nook, 50 mm behind the front'}`,
                q: '1',
                sec: ol
              });
              H.funParts.push({
                n: `Reading nook: curtain panel of about ${f0((cx1 - cx0) * 0.75)} × ${f0(cyT - cyB)} mm in ${fabN(cc)}`,
                q: '2',
                sec: ol
              });
              [
                [cx0, cx0 + dw_],
                [cx1 - dw_, cx1]
              ].forEach(([a_, b_]) =>
                items.push(
                  Object.assign(
                    fpq(
                      [
                        [a_, cyB],
                        [b_, cyB],
                        [b_, cyT],
                        [a_, cyT]
                      ],
                      nk.ob ? -22 : -50,
                      12,
                      'fabric:' + cc
                    ),
                    { sz: sz_ }
                  )
                )
              );
            }
            // 4: book ledges on the left wall and a cubby on the back
            if (z.nookLedges && !zr.nookPod) {
              nk.ledges = [];
              for (let y = iy0 + 80 + 260; y < iy1 - 230 && nk.ledges.length < 3; y += 250) {
                nk.ledges.push(y);
                const L_ = q.Dh - 80;
                addPanel({
                  type: 'Nook book ledge',
                  role: 'front',
                  fin: fF,
                  t: 12,
                  sec: ol,
                  poly: rect(L_, 70),
                  grain: 'w',
                  band: 'none',
                  notes: [
                    'Screwed to the side wall of the nook from the outside, before the column goes in; books stand on it with their covers showing'
                  ]
                });
                addPanel({
                  type: 'Nook book ledge — lip',
                  role: 'front',
                  fin: fF,
                  t: 12,
                  sec: ol,
                  poly: rect(L_, 32),
                  grain: 'w',
                  band: 'none',
                  notes: ['Glued on the front edge of the ledge so books cannot slide off']
                });
                items.push(wf(hzq(ix0, ix0 + 70, y, 12, 40, q.Dh - 40, 'front'), fF));
                items.push(wf(hzq(ix0 + 58, ix0 + 70, y + 12, 20, 40, q.Dh - 40, 'front'), fF));
              }
              if (Wi >= 600 && Hi >= 520) {
                const cw = 260,
                  ch = 160,
                  cx0 = ix1 - 70 - cw,
                  cy0 = iy0 + 80 + Math.min(Hi - 80 - ch - 60, Hi * 0.42);
                nk.cubby = { x0: cx0, x1: cx0 + cw, y0: cy0, y1: cy0 + ch };
                [
                  ['Nook cubby — top / bottom', cw, 90, 2],
                  ['Nook cubby — side', ch - 24, 90, 2]
                ].forEach(([n_, a_, b_, q_]) => {
                  for (let m = 0; m < q_; m++)
                    addPanel({
                      type: n_,
                      role: 'front',
                      fin: fF,
                      t: 12,
                      sec: ol,
                      poly: rect(a_, b_),
                      grain: 'w',
                      band: 'none',
                      notes: ['Small open box on the back wall of the nook, for a cup or a torch']
                    });
                });
                items.push(wf(hzq(cx0, cx0 + cw, cy0, 12, q.Dh - 110, q.Dh - 20, 'front'), fF));
                items.push(wf(hzq(cx0, cx0 + cw, cy0 + ch - 12, 12, q.Dh - 110, q.Dh - 20, 'front'), fF));
              }
            }
            // 5: padded walls and a step box
            if (z.nookPad && !zr.nookPod) {
              const pc = FABRICS[z.fabricCol] ? z.fabricCol : Object.keys(FABRICS)[0],
                ph_ = Math.min(600, Hi - 80 - 60),
                sides = z.nookLedges ? 1 : 2;
              if (ph_ >= 200) {
                nk.pad = { y0: iy0 + 80, y1: iy0 + 80 + ph_, col: FABRICS[pc].c };
                H.funParts.push({
                  n: `Reading nook: padded panel ${f0(Wi)} × ${f0(ph_)} mm for the back — 30 mm foam on a 9 mm board, covered in ${fabN(pc)}`,
                  q: '1',
                  sec: ol
                });
                H.funParts.push({
                  n: `Reading nook: padded panel ${f0(q.Dh - 60)} × ${f0(ph_)} mm for the side${sides > 1 ? 's' : ''} — 30 mm foam on a 9 mm board, covered in ${fabN(pc)}`,
                  q: String(sides),
                  sec: ol
                });
                items.push(
                  Object.assign(
                    fpq(
                      [
                        [ix0, iy0 + 80],
                        [ix1, iy0 + 80],
                        [ix1, iy0 + 80 + ph_],
                        [ix0, iy0 + 80 + ph_]
                      ],
                      -(q.Dh - 45),
                      30,
                      'fabric:' + pc
                    ),
                    { sz: sz_ }
                  )
                );
              }
            }
            if (z.nookStep && iy0 >= 200) {
              const sh = Math.max(120, Math.min(260, Math.round(iy0 / 2))),
                sw_ = Math.min(420, Wi - 60),
                sx0 = cx - sw_ / 2;
              nk.step = { x0: sx0, x1: sx0 + sw_, h: sh, fin: fF };
              [
                ['Step box — top', sw_, 250, 1],
                ['Step box — front / back', sw_ - 36, sh - 18, 2],
                ['Step box — side', 250, sh - 18, 2]
              ].forEach(([n_, a_, b_, q_]) => {
                for (let m = 0; m < q_; m++)
                  addPanel({
                    type: n_,
                    role: 'front',
                    fin: fF,
                    t: 18,
                    sec: ol,
                    poly: rect(a_, b_),
                    grain: 'w',
                    band: 'all',
                    notes: [
                      'Loose step in front of the reading nook: glue and screw it, round every edge over, and stick felt under it'
                    ]
                  });
              });
              items.push(
                wf(
                  fpq(
                    [
                      [sx0, 0],
                      [sx0 + sw_, 0],
                      [sx0 + sw_, sh],
                      [sx0, sh]
                    ],
                    tf + 262,
                    250,
                    'front'
                  ),
                  fF
                )
              );
            } else if (z.nookStep)
              warns.push(`${ol}: the reading nook is only ${f0(iy0)} mm above the floor, so it needs no step box.`);
            nooks.push(nk);
          }
          if (look === 'dj') {
            zr.dj = true;
            zr.led = z.led !== false;
            zr.ledCol = z.ledCol || '#7FD3FF';
            if (iy0 < 850 || iy0 > 1150)
              warns.push(
                `${ol}: the DJ deck sits at ${f0(iy0)} mm — 950–1050 mm is comfortable standing height. Change the level below the niche.`
              );
            if (q.Dh < 420)
              warns.push(`${ol}: ${f0(q.Dh)} mm is shallow for turntables (they need about 360 mm plus cables).`);
            H.funParts.push({
              n: 'DJ niche: anti-vibration feet for turntables, cable grommet, power strip',
              q: 'set',
              sec: ol
            });
          }
          if (look === 'washer' || look === 'dryer' || look === 'stack') {
            const iw = ix1 - ix0,
              ih = iy1 - iy0,
              ks = look === 'stack' ? ['washer', 'dryer'] : [look],
              need = look === 'stack' ? 1720 : 870;
            zr.appl = [];
            zr.laundry = true;
            if (iw < 610)
              warns.push(
                `${ol}: a washing machine or dryer is 600 mm wide — the niche needs at least 610 mm inside (620 is easier); it is ${f0(iw)} mm.`
              );
            if (q.Dh < 620)
              warns.push(
                `${ol}: the machines are about 600 mm deep plus about 50 mm for the hoses and plug — make this column at least 650 mm deep (it is ${f0(q.Dh)} mm inside).`
              );
            if (ih < need)
              warns.push(
                `${ol}: ${look === 'stack' ? 'a washer with a dryer on top needs about 1720 mm' : 'a machine needs about 870 mm'} of height; the niche is ${f0(ih)} mm.`
              );
            if (look === 'stack' && iy0 > 450)
              warns.push(
                `${ol}: with a stacked dryer, keep the washer low (the niche starts at ${f0(iy0)} mm) or the dryer door ends up out of reach.`
              );
            if (look !== 'stack' && iy0 < 250)
              warns.push(
                `${ol}: a raised base of about 300 mm (a basket drawer below) saves bending down to load the machine.`
              );
            let y = iy0 + 5;
            ks.forEach(k_ => {
              const a = { k: k_, x: (ix0 + ix1) / 2 - 300, y, w: 600, h: 850 };
              zr.appl.push(a);
              items.push({
                k: 'appl',
                kind: k_,
                x: a.x,
                y: a.y,
                w: 600,
                h: 850,
                d: Math.min(600, q.Dh - 30),
                z: -q.z0
              });
              y += 850 + 15;
            });
            if (look === 'stack')
              H.funParts.push({ n: 'Stacking kit for a washer with a dryer on top (same brand)', q: '1', sec: ol });
            if (ks.includes('washer'))
              H.funParts.push(
                { n: 'Anti-vibration pads for the washing machine', q: '1', sec: ol },
                { n: 'Plumbing behind the washer: tap and drain (plumber)', q: '1', sec: ol }
              );
            H.funParts.push({ n: `Power socket behind the machines (${ks.length} needed)`, q: '1', sec: ol });
            if (ks.includes('dryer'))
              H.funParts.push({
                n: 'Air vent grilles top and bottom of the laundry niche (heat-pump dryer)',
                q: '2',
                sec: ol
              });
            if (zr.k > 0)
              H.funParts.push({
                n: 'Centre support under the washer: the box below carries 70–80 kg that shakes when it spins — give it a 25 mm top and a support in the middle',
                q: '1',
                sec: ol
              });
          }
          if (look === 'oven' || look === 'combi') {
            const iw = ix1 - ix0,
              ih = iy1 - iy0,
              nh = look === 'oven' ? [585, 600] : [450, 460],
              ah = look === 'oven' ? 595 : 455,
              nm = look === 'oven' ? 'an oven' : 'a compact oven or combi microwave';
            zr.appl = [];
            zr.oven = true;
            if (iw < 560) warns.push(`${ol}: ${nm} needs a niche of 560–568 mm wide; it is ${f0(iw)} mm.`);
            else if (iw > 572)
              warns.push(
                `${ol}: ${nm} needs a niche of 560–568 mm wide; it is ${f0(iw)} mm — set the column to 564 mm (600 mm on the outside), or add filler strips.`
              );
            if (q.Dh < 550) warns.push(`${ol}: ${nm} needs at least 550 mm of depth inside; there is ${f0(q.Dh)} mm.`);
            if (ih < nh[0])
              warns.push(
                `${ol}: ${nm} needs a niche of ${nh[0]}–${nh[1]} mm high; it is ${f0(ih)} mm. Make the level ${nh[0] + 10} mm high.`
              );
            else if (ih > nh[1] + 10)
              warns.push(
                `${ol}: ${nm} needs a niche of ${nh[0]}–${nh[1]} mm high; it is ${f0(ih)} mm — make the level ${nh[1]} mm (or close the gap with a filler strip or a small drawer).`
              );
            if (iy0 < 650 || iy0 > 1050)
              warns.push(
                `${ol}: the oven sits at ${f0(iy0)} mm — with its bottom at 700–950 mm you can look in and lift dishes out without bending.`
              );
            if (zr.k > 0)
              H.funParts.push({
                n: 'Under the oven: glue and screw a second board under the divider (it carries about 35 kg)',
                q: '1',
                sec: ol
              });
            const a = { k: 'oven', x: (ix0 + ix1) / 2 - 297, y: iy0 + 2, w: 595, h: Math.min(ah, ih - 4) };
            zr.appl.push(a);
            items.push({
              k: 'appl',
              kind: 'oven',
              x: a.x,
              y: a.y,
              w: 595,
              h: a.h,
              d: Math.min(550, q.Dh - 20),
              z: -q.z0
            });
            H.funParts.push(
              {
                n: `Built-in ${look === 'oven' ? 'oven (595 mm high)' : 'compact oven or combi microwave (455 mm high)'}`,
                q: '1',
                sec: ol
              },
              {
                n: 'Air gap behind the oven: cut the back panel away behind it (or leave 40–50 mm open) so the heat can escape',
                q: '1',
                sec: ol
              },
              {
                n:
                  look === 'oven'
                    ? 'Own power circuit for the oven, 16 A (electrician)'
                    : 'Power socket behind the appliance, reachable from the cupboard next to it',
                q: '1',
                sec: ol
              }
            );
            if (!z.vent && q.zones.length - 1 > zr.k)
              H.funParts.push({
                n: 'Vent slot of about 50 × 500 mm at the top of the column, so warm air can leave',
                q: '1',
                sec: ol
              });
          }
          if (look === 'bed') {
            const iw = ix1 - ix0,
              ih = iy1 - iy0,
              mw = [1600, 1400, 900].find(v => v <= iw - 60);
            zr.bedNiche = true;
            if (!mw)
              warns.push(
                `${ol}: a fold-down bed needs at least 960 mm inside width for a 90 cm mattress (1,460 for 140 cm); it is ${f0(iw)} mm.`
              );
            if (ih < 2080)
              warns.push(
                `${ol}: a fold-down bed stands up 2080 mm or more (a 2 m mattress and the frame); the niche is ${f0(ih)} mm high. Put it under the flat part of the ceiling.`
              );
            if (q.Dh < 420)
              warns.push(
                `${ol}: a fold-down bed cabinet needs about 420 mm inside depth; this column has ${f0(q.Dh)} mm.`
              );
            if (iy0 > 150) warns.push(`${ol}: a fold-down bed stands on the floor — make it the bottom level.`);
            const poly = [
              [gx0, oy0],
              [gx1, oy0],
              [gx1, oy1],
              [gx0, oy1]
            ];
            addPanel({
              type: 'Fold-down bed front (the underside of the bed)',
              role: 'front',
              sec: ol,
              poly: rect(gx1 - gx0, oy1 - oy0),
              grain: 'h',
              band: 'all',
              notes: [
                'Screws to the bed frame — it is what you see when the bed is up. A groove down the middle makes it look like two doors'
              ]
            });
            arches.push({ poly, holes: [], fin: M.front.fin, sec: i, zone: k, bed: true });
            items.push(wf(fpq(poly, tf, tf, 'front', 'front'), M.front.fin));
            zr.bed = { x0: gx0, x1: gx1, y0: oy0, y1: oy1, mw: mw || 900 };
            H.funParts.push(
              {
                n: `Fold-down bed mechanism (vertical, springs or gas struts) for a ${mw || 900} × 2000 mattress`,
                q: '1',
                sec: ol
              },
              { n: `Mattress ${mw || 900} × 2000, at most 22 cm thick`, q: '1', sec: ol },
              { n: 'Bed safety strap and wall anchors for the bed cabinet', q: '1', sec: ol }
            );
          }
          if (
            look !== 'none' &&
            look !== 'dj' &&
            look !== 'nook' &&
            look !== 'bed' &&
            !zr.appl &&
            (+z.tv > 0 || look === 'art')
          ) {
            let tvW, tvH;
            if (+z.tv > 0) {
              tvW = +z.tv * 25.4 * 0.8716;
              tvH = +z.tv * 25.4 * 0.4903;
            } else {
              tvW = Math.min((ix1 - ix0) * 0.72, 1400);
              tvH = Math.min(tvW * 0.68, (iy1 - iy0) * 0.76);
              tvW = Math.min(tvW, tvH * 1.6);
            }
            if (tvW > ix1 - ix0 - 20 || tvH > iy1 - iy0 - 20)
              warns.push(
                `${ol}: a ${+z.tv > 0 ? z.tv + '″ ' : ''}${look === 'art' ? 'art frame' : 'TV'} (${f0(tvW)}×${f0(tvH)} mm) doesn't fit the ${f0(ix1 - ix0)}×${f0(iy1 - iy0)} mm opening.`
              );
            zr.tv = {
              x: (ix0 + ix1) / 2 - tvW / 2,
              y: (iy0 + iy1) / 2 - tvH / 2,
              w: tvW,
              h: tvH,
              look,
              style: z.artStyle || 'abstract',
              frame: z.frameCol || 'oak',
              seed: (+z.artSeed || 1) * 97 + i * 13 + zr.k
            };
            items.push({ k: 'tv', ...zr.tv, z: -(q.Dh - 45) - q.z0 });
          }
          if (z.grommet !== false && look !== 'nook' && look !== 'bed' && !zr.appl) {
            let gx = (gx0 + gx1) / 2;
            const mem = isG ? gp.members : [q];
            if (!mem.find(m => gx > m.xa + 60 && gx < m.xb - 60)) {
              const nm = mem.reduce((a, m) =>
                Math.abs((m.xa + m.xb) / 2 - gx) < Math.abs((a.xa + a.xb) / 2 - gx) ? m : a
              );
              gx = (nm.xa + nm.xb) / 2;
            }
            grommets.push({ x: gx, y: iy0 + Math.min(160, (iy1 - iy0) * 0.25), d: 80 });
            H.grommets++;
          }
          if (zr.k === nz - 1)
            warns.push(`${ol}: the niche is the top level, so there is nothing above it to support.`);
        }
      })
    );
    // desk drawer + hideaway doors
    let kA = q.xa,
      kB = q.dgEnd || q.xb;
    const dX1 = q.dgEnd || q.xb,
      dWk = dX1 - q.xa;
    if (q.desk && !q.dF && (s.deskPed === 'L' || s.deskPed === 'R')) {
      const L_ = s.deskPed === 'L',
        pw = Math.max(300, Math.min(450, dWk * 0.4)),
        px0 = L_ ? q.xa : dX1 - pw,
        px1 = L_ ? q.xa + pw : dX1,
        sx = L_ ? px1 : px0 - tc,
        yTop = +s.deskH - td - (s.deskDrawer ? 0 : 0),
        nDr = Math.max(2, Math.min(4, +s.pedN || 3));
      if (L_) kA = px1 + tc;
      else kB = px0 - tc;
      if (kB - kA < 580)
        warns.push(
          `${lab}: only ${f0(kB - kA)} mm knee space beside the pedestal — 600 mm is the minimum to sit comfortably.`
        );
      addPanel({
        type: 'Pedestal side',
        role: 'carcass',
        sec: lab,
        poly: rect(q.Dh, yTop),
        grain: 'h',
        band: 'front',
        bandLen: yTop,
        notes: ['Screw up into the desk top; adjustable foot at the front']
      });
      items.push({
        k: 'prism',
        poly: [
          [0, 0],
          [q.Dh, 0],
          [q.Dh, yTop],
          [0, yTop]
        ],
        toW: (u, v) => [sx, v, -u - q.z0],
        ext: [tc, 0, 0],
        role: 'carcass'
      });
      const bx0 = L_ ? q.xa : sx + tc,
        bx1 = L_ ? sx : q.xb;
      addPanel({
        type: 'Pedestal bottom',
        role: 'carcass',
        sec: lab,
        poly: rect(bx1 - bx0, q.Dh),
        grain: 'w',
        band: 'front',
        bandLen: bx1 - bx0,
        notes: []
      });
      items.push(hzq(bx0, bx1, P, tc, 0, q.Dh, 'carcass'));
      H.legs += 2;
      H.ped++;
      const fl = q.deskShut ? (L_ ? q.xa + 2 - g / 2 : sx + tc + 2 - g / 2) : L_ ? q.bL : sx - tc / 2 + tc / 2,
        fr = q.deskShut ? (L_ ? sx - 2 + g / 2 : q.xb - 2 + g / 2) : L_ ? sx + tc : q.bR,
        fy0 = q.deskShut ? P + tc + 2 : 10,
        fy1 = yTop - (q.deskShut ? 2 : 3),
        hd = (fy1 - fy0) / nDr,
        sl = SLIDES.filter(v => v <= q.Dh - 30).pop() || 250,
        zp = q.deskShut ? -(tf + 25) : tf;
      for (let j = 0; j < nDr; j++) {
        const poly = frontPoly(fl, fr, fy0 + j * hd, fy0 + (j + 1) * hd),
          hs =
            (q.deskShut && s.deskFront === 'hidden') || s.pedNh ? { type: 'none' } : handleSpec('drawer', poly, null);
        H.slides[sl] = (H.slides[sl] || 0) + 1;
        H.handles[hs.type] = (H.handles[hs.type] || 0) + 1;
        drawerBox(lab, bx1 - bx0, sl, hd, 'Pedestal drawer.');
        addPanel({
          type: 'Pedestal drawer front',
          role: 'front',
          sec: lab,
          poly,
          holes: handleHoles(hs),
          grain: 'w',
          band: 'all',
          notes: [
            `Box for ${sl} mm runners`,
            q.deskShut
              ? `Sits inside the desk cabinet, flush with the desk top edge (${f0(tf + 25)} mm behind the doors)`
              : '',
            handleNote(hs)
          ].filter(Boolean)
        });
        fronts.push({
          z0: q.z0,
          kind: 'drawer',
          poly,
          sec: i,
          zone: 0,
          idx: 50 + j,
          handle: hs,
          fabric: null,
          fin: null,
          zF: zp
        });
        items.push(Object.assign(fpq(poly, zp, tf, 'front', 'front', true), { sz: i + ':0' }));
      }
    }
    if (q.desk && !q.dF && s.deskLED) {
      H.led.push({ sec: lab, L: f0(dWk - 40), why: 'under the shelf over the desk' });
    }
    if (q.desk && !q.dF && !q.deskShut && s.deskChair !== false && (s.deskSetup || 'work') !== 'none') {
      const cw = Math.min(520, kB - kA - 40);
      if (cw > 360)
        props.push({
          k: 'chair',
          x: (kA + kB) / 2 - cw / 2,
          y: 0,
          w: cw,
          h: Math.min(+s.deskH + 300, 1150),
          seat: Math.max(380, +s.deskH - 260),
          col: s.deskSetup === 'vanity' ? '#D8B8A8' : s.deskSetup === 'studio' ? '#2E3238' : '#C7B9A3',
          sec: i,
          zone: 0,
          z: -(+s.over || 0) - 260 + q.z0
        });
    }
    if (q.desk && !q.dF && s.deskDrawer) {
      const dw = Math.min(600, kB - kA - 80),
        dl = (kA + kB) / 2 - dw / 2,
        dy1 = +s.deskH - td - 2,
        poly = [
          [dl, dy1 - 100],
          [dl + dw, dy1 - 100],
          [dl + dw, dy1],
          [dl, dy1]
        ],
        hs = q.deskShut && s.deskFront === 'hidden' ? { type: 'none' } : handleSpec('drawer', poly, null),
        sl = SLIDES.filter(v => v <= q.Dh - 60).pop() || 250;
      H.slides[sl] = (H.slides[sl] || 0) + 1;
      H.handles[hs.type] = (H.handles[hs.type] || 0) + 1;
      drawerBox(lab, dw, sl, 120, 'Desk drawer.');
      addPanel({
        type: 'Desk drawer front',
        role: 'front',
        sec: lab,
        poly,
        holes: handleHoles(hs),
        grain: 'w',
        band: 'all',
        notes: [`Shallow drawer under the desk top, ${sl} mm runners, 70 mm inside height`]
      });
      fronts.push({ z0: q.z0, kind: 'drawer', poly, sec: i, zone: 0, idx: 99, handle: hs, fabric: null, fin: null });
      items.push(Object.assign(fpq(poly, q.deskShut ? -(tf + 25) : tf, tf, 'front', 'front', true), { sz: i + ':0' }));
    }
    if (q.deskShut) {
      const hid = s.deskFront === 'hidden',
        nd = +s.deskDoors > 0 ? +s.deskDoors : q.bR - q.bL > 620 ? 2 : 1,
        wd = (q.bR - q.bL) / nd,
        z0_ = q.zones[0],
        dTop = z0_ && !z0_.top ? z0_.divY + z0_.divT / 2 : null;
      q.deskDoorB = P;
      if (q.zones.length === 1)
        warns.push(
          `${lab}: the desk doors run to the ceiling — add a cabinet above the desk (a level on top) so the doors stop at a sensible height.`
        );
      for (let j = 0; j < nd; j++) {
        const l = q.bL + j * wd,
          poly = frontPoly(l, l + wd, P, dTop),
          hinge = nd === 1 ? s.deskHinge || 'L' : j % 2 ? 'R' : 'L',
          hh = Math.max(...poly.map(p => p[1])) - 8,
          hc = hh <= 900 ? 2 : hh <= 1600 ? 3 : hh <= 2000 ? 4 : 5;
        H.hinges += hc;
        H.hk = H.hk || {};
        H.hk.wide = (H.hk.wide || 0) + hc;
        const hs = hid ? { type: 'none' } : handleSpec('door', poly, hinge);
        H.handles[hs.type] = (H.handles[hs.type] || 0) + 1;
        addPanel({
          type: hid ? 'Desk door (hidden)' : 'Desk door',
          role: 'front',
          sec: lab,
          poly,
          holes: handleHoles(hs),
          grain: 'h',
          band: 'all',
          notes: [
            `${hc} hinges · ${hinge === 'L' ? 'left' : 'right'}-hand · use 155° wide-angle hinges so the door folds back flat while working`,
            `Bottom lines up with the plinths of the cabinets beside it; the ${f0(P)} mm gap under it stays open so the chair rolls in`,
            hid ? 'No handle — push-to-open latch; matches the surrounding fronts' : handleNote(hs)
          ].filter(Boolean)
        });
        fronts.push({
          z0: q.z0,
          kind: 'door',
          poly,
          hinge,
          sec: i,
          zone: -1,
          idx: j,
          handle: hs,
          fabric: null,
          fin: null
        });
        items.push(Object.assign(fpq(poly, tf, tf, 'front', 'front'), { sz: i + ':-1' }));
      }
    }
    // styling props
    q.zones.forEach(
      ZW(q, (zr, k) => {
        const z = zr.z,
          seed = i * 97 + k * 31 + 11;
        if (zr.railY) {
          const r = prng(seed + 77),
            avail = zr.railY - (zr.rail2Y ? zr.rail2Y + 20 : (zr.hangFloor ?? zr.y0)) - 40,
            rc = zr.railComp || [q.xa, q.xb];
          let x = rc[0] + 28;
          while (x < rc[1] - 36) {
            const t = r();
            let L =
              t < 0.35 ? 720 + r() * 180 : t < 0.6 ? 950 + r() * 200 : t < 0.8 ? 1150 + r() * 250 : 560 + r() * 90;
            if (L > avail) L = Math.max(250, avail * (0.7 + r() * 0.25));
            const w = 22 + r() * 30,
              dd = Math.min(q.Dh - 40, 400 + r() * 60);
            if (x + w > rc[1] - 20) break;
            props.push({
              k: 'garment',
              x,
              y: zr.railY - L - 28,
              w,
              h: L,
              d: dd,
              z: q.Dh / 2 - dd / 2 + q.z0,
              rail: zr.railY,
              col: CLOTHC[(r() * CLOTHC.length) | 0],
              sec: i,
              zone: k
            });
            x += w + 5 + r() * 20;
          }
        }
        if (z.type === 'seat' && !zr.top) {
          const y = zr.divY + zr.divT,
            col = FABRICS[z.fabricCol] ? FABRICS[z.fabricCol].c : '#CDBFA8';
          props.push({
            k: 'cushion',
            x: q.xa + 6,
            y,
            w: q.w - 12,
            h: 85,
            d: q.Dh - 20,
            col,
            sec: i,
            zone: k,
            z: q.z0 + 10
          });
          const np = q.w > 1100 ? 3 : 2,
            pw = Math.min(420, (q.w - 80) / np);
          for (let j = 0; j < np; j++)
            props.push({
              k: 'pillow',
              x: q.xa + 40 + j * ((q.w - 80 - pw) / Math.max(1, np - 1)),
              y: y + 85,
              w: pw,
              h: pw * 0.9,
              col: j % 2 ? '#E9E2D4' : ['#B5503C', '#5D7A8C', '#9DAE8F', '#C9A86A'][(i + j) % 4],
              sec: i,
              zone: k,
              z: q.z0 + q.Dh - 150
            });
        }
        const aboveSeat = k > 0 && q.zones[k - 1].z.type === 'seat';
        if ((z.type === 'open' || zr.glass) && !(k === 0 && q.dF))
          (zr.comps || [[q.xa, q.xb]]).forEach(([cl, cr], ci, ca) => {
            const levels = [
              {
                y: zr.y0,
                l: cl,
                r: k === 0 && q.dgEnd && ci === ca.length - 1 ? q.dgEnd : cr,
                zF: k === 0 && q.desk ? (q.deskShut ? tf + 25 : -(+s.over || 0)) : recOff && k > 0 ? recOff : 0
              }
            ].concat(
              zr.shelvesY
                .filter(([y, l, r]) => l >= cl - 2 && r <= cr + 2)
                .sort((a, b) => a[0] - b[0])
                .map(([y, l, r]) => ({ y: y + ts, l, r, zF: O.setback }))
            );
            levels.forEach((lv, j) => {
              if (aboveSeat && j === 0) return;
              const nextY =
                j + 1 < levels.length ? levels[j + 1].y - ts : zr.top ? minUnder(q, lv.l, lv.r) : zr.y0 + zr.h;
              fillSurface(
                lv.l,
                lv.r,
                lv.y,
                nextY - lv.y,
                lv.zF,
                q.Dh,
                seed + j * 7 + ci * 31,
                k === 0 && q.desk && j === 0 && ci === 0
                  ? 'desk:' + (s.deskSetup || 'work')
                  : z.niche
                    ? z.niche
                    : z.ledge && j > 0
                      ? 'ledge'
                      : zr.glass
                        ? 'display'
                        : 'shelf'
              ).forEach(p => props.push(Object.assign(p, { sec: i, zone: k, z: p.z + q.z0 })));
            });
          });
        if (z.type === 'opening' && zr.open) {
          const o = zr.open,
            hA = o.iy1 - o.iy0;
          if (zr.nook && !zr.nookPod) {
            const Wi = o.ix1 - o.ix0,
              y = o.iy0,
              col = FABRICS[z.fabricCol] ? FABRICS[z.fabricCol].c : '#CDBFA8',
              add = pr => props.push(Object.assign(pr, { sec: i, zone: k })),
              PC = ['#E9C46A', '#E4572E', '#669BBC', '#A8C686'],
              np = Wi > 1000 ? 3 : 2;
            add({ k: 'cushion', x: o.ix0 + 6, y, w: Wi - 12, h: 80, d: q.Dh - 30, col, z: q.z0 + 10 });
            for (let j = 0; j < np; j++)
              add({
                k: 'cushion',
                x: o.ix0 + 30 + j * 320,
                y: y + 80,
                w: 300,
                h: Math.min(280, hA - 120),
                d: 110,
                col: PC[j % PC.length],
                z: q.z0 + q.Dh - 135
              });
            if (Wi > np * 320 + 260)
              add({ k: 'box', x: o.ix1 - 210, y: y + 80, w: 160, h: 55, d: 210, col: '#29335C', z: q.z0 + 70 });
            items.push(Object.assign(hzq(o.ix0 + 30, o.ix1 - 30, o.iy1 - 8, 5, 50, 80, 'led'), { sz: i + ':' + k }));
          }
          if (zr.nook) {
          } else if (zr.dj) {
            const Wi = o.ix1 - o.ix0,
              cx = (o.ix0 + o.ix1) / 2,
              y = o.iy0,
              zf = 40 + q.z0,
              add = pr => props.push(Object.assign(pr, { sec: i, zone: k }));
            let used;
            if (Wi >= 1250) {
              add({ k: 'turntable', x: cx - 160 - 10 - 450, y, w: 450, h: 110, d: 350, z: zf });
              add({ k: 'mixer', x: cx - 160, y, w: 320, h: 105, d: 360, z: zf });
              add({ k: 'turntable', x: cx + 160 + 10, y, w: 450, h: 110, d: 350, z: zf });
              used = 1240;
            } else {
              const cw = Wi >= 760 ? 640 : Math.max(300, Wi - 80);
              add({ k: 'controller', x: cx - cw / 2, y, w: cw, h: 60, d: 330, z: zf });
              used = cw;
            }
            add({ k: 'headphones', x: cx + used / 2 - 150, y: y + 110, w: 150, h: 60, d: 150, z: zf + 60 });
            const side = (Wi - used) / 2 - 30;
            if (side >= 380) {
              add({ k: 'crate', x: o.ix0 + 20, y, w: 330, h: 300, d: 330, z: q.Dh - 350 + q.z0 });
            }
            if (side >= 230)
              add({ k: 'monitor', x: o.ix1 - 20 - 200, y, w: 200, h: Math.min(320, hA - 40), d: 240, z: zf });
            if (side >= 600)
              add({
                k: 'monitor',
                x: o.ix0 + 20 + (side >= 380 ? 350 : 0),
                y,
                w: 200,
                h: Math.min(320, hA - 40),
                d: 240,
                z: zf
              });
          } else if (zr.tv) {
            const gL = zr.tv.x - o.ix0 - 40,
              gR = o.ix1 - (zr.tv.x + zr.tv.w) - 40;
            if (gL > 170)
              fillSurface(o.ix0, o.ix0 + gL, o.iy0, hA, 0, q.Dh, seed + 3, 'shelf').forEach(p =>
                props.push(Object.assign(p, { sec: i, zone: k, z: p.z + q.z0 }))
              );
            if (gR > 170)
              fillSurface(o.ix1 - gR, o.ix1, o.iy0, hA, 0, q.Dh, seed + 5, 'shelf').forEach(p =>
                props.push(Object.assign(p, { sec: i, zone: k, z: p.z + q.z0 }))
              );
          } else
            fillSurface(o.ix0, o.ix1, o.iy0, hA, 0, q.Dh, seed + 9, 'shelf').forEach(p =>
              props.push(Object.assign(p, { sec: i, zone: k, z: p.z + q.z0 }))
            );
        }
      })
    );
  });
  // backs
  _hs.push(JSON.stringify(H));
  result.Hsnap = _hs;
  // faux doors on a panel wall: the cladding is cut as door and drawer fronts that copy the lines, colour and handles of the cabinet next to it, so the shaft cover disappears into the wall of cabinets
  secs.forEach(q => {
    const F = q.fauxPn;
    if (!F) return;
    const { pn, L, Rr, topMin, lab } = F,
      t = tf,
      maxL = sheetOf(M.front.sheet).L - 2 * (+O.trim || 0);
    const nbs = [secs[q.i - 1], secs[q.i + 1]].filter(n_ => n_ && !n_.panel && !n_.door),
      bbx = f => {
        const xs = f.poly.map(p => p[0]),
          ys = f.poly.map(p => p[1]);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      };
    let nf = [];
    for (const nb of nbs) {
      nf = fronts
        .filter(f => f.sec === nb.i && !f.rear && (f.kind === 'door' || f.kind === 'drawer'))
        .map(f => ({ k: f.kind, b: bbx(f), fin: FIN[f.fin] ? f.fin : null }));
      if (nf.length) break;
    }
    const base = nf.length ? Math.min(...nf.map(f => f.b[1])) : P + g / 2,
      st = [base];
    [...new Set(nf.map(f => Math.round(f.b[1])))]
      .sort((a, b) => a - b)
      .forEach(y => {
        if (y > st[st.length - 1] + 140 && y < topMin - 200) st.push(y);
      });
    for (let j = 0; j < st.length; j++) {
      const top = j < st.length - 1 ? st[j + 1] : topMin;
      if (top - st[j] > Math.min(2300, maxL)) {
        st.splice(j + 1, 0, st[j] + Math.round((top - st[j]) / 2));
        j--;
      }
    }
    if (base > 40) {
      const poly = [
        [L, 5],
        [Rr, 5],
        [Rr, base - g],
        [L, base - g]
      ];
      addPanel({
        type: 'Panel wall plinth',
        role: 'skirt',
        sec: lab,
        poly,
        grain: 'w',
        notes: ['Runs in line with the plinth of the cabinets; screw to the bottom batten']
      });
      items.push(wf(fp(poly, tf - q.z0 - (+K.recess || 0), tf, 'skirt'), M.skirt.fin));
      claddings.push({ poly, fin: M.skirt.fin, kind: 'clad', holes: [] });
    }
    let access = !pn.hatch,
      nLeaf = 0;
    st.forEach((y0, j) => {
      const last = j === st.length - 1,
        y1 = last ? null : st[j + 1] - g,
        h = (y1 ?? topMin) - y0,
        isDr = nf.some(f => f.k === 'drawer' && Math.abs(f.b[1] - y0) < 3) && h <= 420,
        n = Math.max(1, Math.ceil((Rr - L) / (isDr ? 1200 : 625))),
        w = (Rr - L + g) / n,
        rf = nf.find(f => Math.abs(f.b[1] - y0) < 3),
        fin = rf && rf.fin ? rf.fin : M.front.fin;
      for (let c = 0; c < n; c++) {
        const l = L + c * w,
          r_ = l + w - g,
          poly =
            y1 != null
              ? [
                  [l, y0],
                  [r_, y0],
                  [r_, y1],
                  [l, y1]
                ]
              : [[l, y0], [r_, y0], ...sampleLine(x => q.top(x) - g / 2, l, r_).reverse()],
          hinge = n === 1 ? 'L' : c === 0 ? 'L' : c === n - 1 ? 'R' : c % 2 ? 'R' : 'L';
        const hs = handleSpec(isDr ? 'drawer' : 'door', poly, hinge),
          holes = handleHoles(hs),
          notes = [
            `Faux ${isDr ? 'drawer' : 'door'} front: it does not open. Same gaps (${g} mm) and handle as the cabinets beside it`
          ];
        const hn = handleNote(hs);
        if (hn) notes.push(hn);
        H.handles[hs.type] = (H.handles[hs.type] || 0) + 1;
        const acc = !access && !isDr && h >= 500 && y0 < 1200;
        if (acc)
          notes.push(
            'This one comes off for access to the shaft: hang it on 4 magnetic push latches (2 at the top, 2 at the bottom) instead of screws'
          );
        else notes.push('Screw from the back through the battens, or glue and pin');
        addPanel({
          type: acc
            ? 'Faux door (access to the shaft)'
            : isDr
              ? 'Faux drawer front (panel wall)'
              : 'Faux door (panel wall)',
          role: 'front',
          fin,
          sec: lab,
          poly,
          holes,
          grain: isDr ? 'w' : 'h',
          band: 'all',
          notes
        });
        items.push(wf(fp(poly, tf - q.z0, t, 'front'), fin));
        claddings.push({ poly, fin, kind: 'clad', holes: [], handle: hs, z0: q.z0 });
        nLeaf++;
        if (acc && c === n - 1) {
          access = true;
          H.hatches += 2;
        }
      }
    });
    q.fauxN = nLeaf;
  });
  secs.forEach(q => {
    const lab = 'S' + (q.i + 1),
      by0 = q.desk || q.door ? 0 : q.Pq,
      mode = q.door ? 'split' : q.s.back || 'full';
    q.backHoles = [];
    q.backPieces = [];
    if (q.panel) return;
    if (mode === 'none') {
      q.noBack = true;
      H.noBack = (H.noBack || 0) + 1;
      return;
    }
    const bsh = sheetOf(M.back.sheet),
      bMax = Math.max(bsh.L, bsh.W) - 2 * (+O.trim || 0),
      bMin = Math.min(bsh.L, bsh.W) - 2 * (+O.trim || 0),
      bH = q.maxU - by0,
      bW = q.xb - q.xa,
      bigBack = q.zones.length > 1 && (Math.max(bH, bW) > bMax || Math.min(bH, bW) > bMin); // a back taller than the board is made per level, with the joints hidden behind the fixed dividers
    const split = mode === 'split' || bigBack || q.zones.some(zr => zr.inFin),
      ranges = [];
    if (split) {
      q.zones.forEach((zr, k) => {
        const lo = k === 0 ? by0 : q.zones[k - 1].divY + q.zones[k - 1].divT / 2,
          hi = zr.top ? null : zr.divY + zr.divT / 2;
        ranges.push({ lo, hi, fin: zr.inFin, k });
      });
    } else if (q.splitK >= 0) {
      const zs = q.zones[q.splitK];
      ranges.push(
        { lo: by0, hi: zs.divY + tc / 2, fin: null, k: 0, hiK: q.splitK },
        { lo: zs.divY + tc * 1.5, hi: null, fin: null, k: q.splitK + 1 }
      );
    } else ranges.push({ lo: by0, hi: null, fin: null });
    const gi_ = GRV ? GRV_D - 1 : 0;
    ranges.forEach(rg => {
      if (rg.k != null && q.zones[rg.k].z.type === 'passage') return;
      let lo = rg.lo,
        hi = rg.hi;
      if (GRV) {
        if (rg.k == null || rg.k === 0) {
          if (!(q.desk || q.door)) lo = q.Pq + tc - gi_;
        } else {
          const pz = q.zones[rg.k - 1];
          lo = pz.divY + pz.divT - gi_;
        }
        if (hi != null) {
          const cz = q.zones[rg.hiK ?? rg.k];
          hi = cz.divY + gi_;
        }
      }
      const xA = q.xa - gi_,
        xB = q.xb + gi_,
        tX = x =>
          x < q.xa
            ? q.top(q.xa) + ((q.top(q.xa) - q.top(q.xa + 5)) / 5) * (q.xa - x)
            : x > q.xb
              ? q.top(q.xb) + ((q.top(q.xb) - q.top(q.xb - 5)) / 5) * (x - q.xb)
              : q.top(x),
        btop =
          hi == null
            ? sampleLine(x => tX(x) - (GRV ? tc - gi_ : 0) - (drop * q.Dh) / D, xA, xB)
            : [
                [xB, hi],
                [xA, hi]
              ];
      const bpoly =
        hi == null
          ? [[xA, lo], [xB, lo], ...btop.slice().reverse()]
          : [
              [xA, lo],
              [xB, lo],
              [xB, hi],
              [xA, hi]
            ];
      const holes = grommets.filter(h => h.x > q.xa && h.x < q.xb && h.y > rg.lo && (rg.hi == null || h.y < rg.hi)),
        notes = [];
      const wch = wcuts
        .filter(c => c.x1 > q.xa + 25 && c.x0 < q.xb - 25 && c.y1 > rg.lo + 25 && (rg.hi == null || c.y0 < rg.hi - 25))
        .map(c => {
          const a = Math.max(c.x0, q.xa + 15),
            b = Math.min(c.x1, q.xb - 15),
            l_ = Math.max(c.y0, rg.lo + 15),
            h_ = Math.min(c.y1, (rg.hi == null ? q.minU || 1e5 : rg.hi) - 15);
          return b - a > 30 && h_ - l_ > 30
            ? {
                poly: [
                  [a, l_],
                  [b, l_],
                  [b, h_],
                  [a, h_]
                ],
                x: a,
                y: l_,
                nm: c.nm
              }
            : null;
        })
        .filter(Boolean);
      if (wch.length) {
        notes.push(
          `Cut-out for ${[...new Set(wch.map(c => c.nm))].join(' and ')} — mark it from the wall, cut with a jigsaw before the back goes in`
        );
        (q.wallCuts = q.wallCuts || []).push(...wch);
      }
      if (holes.length) notes.push('Ø80 cable grommet behind TV');
      if (q.grp) notes.push('Backs meet behind the shared niche — add a vertical batten behind the joint');
      if (split) notes.push('Per-compartment back: joints sit behind the fixed dividers');
      if (GRV) notes.push(`Slides into the ${GRV_W} × ${GRV_D} mm grooves — fit it before the last panel goes on`);
      else notes.push('Nailed or screwed onto the back edges every 150 mm');
      addPanel({
        type: split ? 'Back (compartment)' : 'Back',
        role: 'back',
        fin: rg.fin || undefined,
        sec: lab,
        poly: bpoly,
        holes: holes.concat(wch.map(c => ({ poly: c.poly, x: c.x, y: c.y }))),
        grain: 'h',
        notes
      });
      if (q.z0 === 0 && q.D < D)
        notes.push(`${f0(D - q.D)} mm gap to the wall behind — fix the box to the wall with battens`);
      items.push(wf(fp(bpoly, -(q.z0 + q.Dh), tb, 'back'), rg.fin));
      q.backHoles.push(...holes);
      q.backPieces.push({ poly: bpoly, fin: rg.fin });
    });
  });
  // sides / partitions
  const walls = [];
  if (boxes)
    secs.forEach(q => {
      if (q.panel) return;
      walls.push({ x: q.lx, L: null, R: q, side: 'left' });
      walls.push({ x: q.rx, L: q, R: null, side: 'right' });
    });
  else {
    walls.push({ x: secs[0].lx, L: null, R: secs[0] });
    secs.forEach((q, i) => walls.push({ x: q.rx, L: q, R: secs[i + 1] || null }));
  }
  for (let wi = walls.length - 1; wi >= 0; wi--)
    if (![walls[wi].L, walls[wi].R].filter(Boolean).some(q => !q.panel)) walls.splice(wi, 1);
  secs.forEach(q => {
    if (q.follow != null && secs[q.follow] && q.splitK == null) q.splitK = secs[q.follow].splitK;
  }); // columns that follow a shared opening are stacked at the same joint as their lead
  walls.forEach((wl, wi) => {
    const xL = wl.x,
      Lq = wl.L,
      Rq = wl.R,
      own = [Lq, Rq].filter(Boolean),
      zmn = Math.min(...own.map(q => q.z0)),
      dW = Math.max(...own.map(q => q.z0 + q.D)) - zmn;
    const hF = Math.max(...own.flatMap(q => [q.top(xL), q.top(xL + tc)])),
      nearDesk = own.some(q => q.desk || (q.panel && !q.toe) || q.door),
      yb = nearDesk ? 0 : Math.min(...own.map(q => (q.panel ? P : (q.Pq ?? P))));
    let gIn = null;
    if (boxes) {
      const q = own[0];
      if (q.grp && ((wl.side === 'left' && q.i > q.grp.lead) || (wl.side === 'right' && q.i < q.grp.last))) gIn = q.grp;
    } else if (Lq && Rq && Lq.grp && Lq.grp === Rq.grp) gIn = Lq.grp;
    if (gIn && !((secs[gIn.lead].zones || [])[gIn.ko] && (gIn.ko === 0 || secs[gIn.lead].zones[gIn.ko - 1])))
      gIn = null;
    const capped = own.some(q => q.cap < Infinity && Math.abs(q.top(xL) - q.cap) < 0.01),
      base = [];
    const sl = Math.atan((ceilAt(xL + tc) - ceilAt(xL)) / tc) * DEG;
    if (Math.abs(sl) > 0.5 && !capped)
      base.push(`Top edge bevel ∠${Math.abs(sl).toFixed(1)}° across thickness (follows ceiling)`);
    if (nearDesk)
      base.push(own.some(q => q.panel) ? 'Runs to floor beside the panel wall' : 'Runs to floor beside desk');
    if (boxes && !(wl.side === 'left' && own[0].i === 0) && !(wl.side === 'right' && own[0].i === n - 1))
      base.push('Screw to the neighbouring box side');
    const typ = boxes ? 'Box side' : wi === 0 || wi === walls.length - 1 ? 'End panel' : 'Partition';
    const dF = (() => {
      const f = colDrench(own[0]);
      return f && own.every(o => colDrench(o) === f) ? f : null;
    })(); // not drenched when the wall is shared with a column in another colour
    const lab = boxes
      ? `S${own[0].i + 1} ${wl.side}`
      : Lq
        ? Rq
          ? `S${Lq.i + 1}|S${Rq.i + 1}`
          : 'right end'
        : 'left end';
    const spl = own.find(q => q.splitK >= 0),
      sY = spl ? spl.zones[spl.splitK].divY + tc : null;
    const pcs = [];
    if (spl && !gIn) {
      pcs.push({ y0: yb, y1: sY, ft: 'lowerU' });
      pcs.push({ y0: sY, y1: null, ft: 'upperU' });
    } else if (gIn) {
      const LZ = secs[gIn.lead].zones,
        ko = gIn.ko;
      if (ko > 0) pcs.push({ y0: yb, y1: LZ[ko - 1].divY, ft: 'lower' });
      const uy = LZ[ko].divY + LZ[ko].divT;
      if (uy < hF - 60) {
        if (spl && sY > uy + 60 && sY < hF - 60) {
          pcs.push({ y0: uy, y1: sY, ft: 'upper' });
          pcs.push({ y0: sY, y1: null, ft: 'upperU' });
        } else pcs.push({ y0: uy, y1: null, ft: 'upper' });
      }
    } else pcs.push({ y0: yb, y1: null });
    // every hole in this side: connector screws for the boards, shelf pins, hinge mounting plates
    const drill = (y0, y1) => {
      const hs = [],
        near = (u, y) => hs.some(h => Math.abs(h.x - u) < 12 && Math.abs(h.y - y) < 12),
        put = (u, y, o) => {
          if (y < y0 + 8 || y > y1 - 8 || u < 5 || u > dW - 5) return;
          let uu = u;
          if (near(uu, y)) uu += 25;
          if (!near(uu, y)) hs.push(Object.assign({ x: uu, y }, o));
        };
      own.forEach(q => {
        if (q.panel) return;
        const uF = q.z0 - zmn,
          isL = boxes ? wl.side === 'left' : q === Rq,
          face = `face towards ${'S' + (q.i + 1)}`,
          us = q.Dh > 420 ? [50, q.Dh / 2, q.Dh - 50] : [50, q.Dh - 50];
        const boards = [];
        if (q.zones[0] && !q.desk) boards.push(q.zones[0].y0 - tc / 2);
        q.zones.forEach(zr => {
          if (!zr.top && zr.divT) boards.push(zr.divY + zr.divT / 2);
        });
        {
          const t0 = q.top(q.xa),
            t1 = q.top(q.xb);
          if (Math.abs(t0 - t1) < 2) boards.push(q.top(xL) - tc / 2);
        }
        boards.forEach(y => us.forEach(u => put(uF + u, y, { d: 5, cf: 1, face: 'through · connector screw' })));
        q.zones.forEach(zr =>
          (zr.shelvesY || []).forEach(([y, x0, x1]) => {
            if (isL ? Math.abs(x0 - 1 - q.xa) < 3 : Math.abs(x1 + 1 - q.xb) < 3)
              [37, q.Dh - 37].forEach(u => put(uF + u, y - 4, { d: 5, dp: 12, face }));
          })
        );
        fronts
          .filter(f => f.sec === q.i && f.cups && !f.rear && (isL ? f.hinge === 'L' : f.hinge === 'R'))
          .forEach(f => {
            const xs = f.poly.map(p_ => p_[0]),
              he = isL ? Math.min(...xs) : Math.max(...xs);
            if (Math.abs(he - (isL ? q.xa : q.xb)) > 40) return;
            f.cups.forEach(y => [y - 16, y + 16].forEach(yy => put(uF + 37, yy, { d: 5, dp: 12, face, plate: 1 })));
          });
      });
      return hs;
    };
    pcs.forEach(pc => {
      const tF = pc.y1 ?? hF,
        tB = pc.y1 ?? hF - drop,
        poly = [
          [0, pc.y0],
          [dW, pc.y0],
          [dW, tB],
          [0, tF]
        ];
      let notes = [...base];
      const sideHoles = drill(pc.y0, Math.min(tF, tB));
      if (sideHoles.length) {
        const nc = sideHoles.filter(h => h.cf).length,
          np = sideHoles.filter(h => h.dp && !h.plate).length,
          nh = sideHoles.filter(h => h.plate).length;
        notes.push(
          `Drilling (see Shaped parts): ${[nc && `${nc} × Ø5 through for the connector screws, centred on each board`, np && `${np} shelf-pin holes Ø5 × 12 deep, 37 mm from the front and back edges`, nh && `${nh} holes Ø5 × 12 deep for the hinge mounting plates, 37 mm from the front edge, 32 mm apart`].filter(Boolean).join(' · ')}`
        );
      }
      if (own.length === 2 && Lq.z0 !== Rq.z0)
        notes.push(
          `Front edge stands ${f0(Math.abs(Lq.z0 - Rq.z0))} mm proud of the shallower column — band or cover the exposed face`
        );
      if (pc.ft === 'lower') notes = notes.filter(t => !t.includes('∠')).concat('Stops under the niche sill');
      if (pc.ft === 'upper' && pc.y1 != null)
        notes = notes.filter(t => !t.includes('∠')).concat('Lower unit — the upper unit stands on it');
      if (pc.ft === 'upper')
        notes.push('Stands on the board above the niche; screw down through the header and into the rear rail');
      if (pc.ft === 'lowerU')
        notes = notes.filter(t => !t.includes('∠')).concat('Lower unit — the upper unit stands on it');
      if (pc.ft === 'upperU') notes.push('Upper unit — screw down into the lower unit through the double panel');
      addPanel({
        type:
          typ +
          (pc.ft === 'lowerU'
            ? ' (lower unit)'
            : pc.ft === 'upperU'
              ? ' (upper unit)'
              : pc.ft
                ? pc.ft === 'upper'
                  ? ' above opening'
                  : ' below opening'
                : ''),
        role: 'carcass',
        fin: dF || undefined,
        sec: lab,
        poly,
        holes: sideHoles,
        grain: 'h',
        band: 'front',
        bandLen: tF - pc.y0,
        notes,
        angled: notes.some(t => t.includes('∠'))
      });
      items.push({
        k: 'prism',
        poly,
        toW: (u, v) => [xL, v, -(u + zmn)],
        ext: [tc, 0, 0],
        role: 'carcass',
        fin: dF || undefined
      });
      parts.push({ x: xL, yb: pc.y0, h: tF, fin: dF });
      if (dF && (boxes || own.length === 1))
        (H.drench = H.drench || []).push({ fin: dF, area: (dW * (tF - pc.y0)) / 1e6, sec: lab, out: 1 });
    });
    if (!boxes && !nearDesk) H.legs += 2;
    H.brackets += boxes ? 1 : 2;
    if (boxes && wl.side === 'left' && own[0].i > 0) H.boxJoins++;
  });
  secs.forEach((q, i) => {
    const nx = secs[i + 1];
    if (nx && nx.z0 !== q.z0 && !q.panel && !nx.panel) {
      const deep = q.z0 < nx.z0 ? q : nx;
      if (boxes)
        warns.push(
          `The front steps back ${f0(Math.abs(q.z0 - nx.z0))} mm between S${i + 1} and S${i + 2} — the side of S${deep.i + 1} shows; it gets a finished cover panel in the cut list.`
        );
      if (boxes) {
        const sh = deep === q ? nx : q,
          hF = Math.max(sh.top(sh.bL), sh.top(sh.bR));
        addPanel({
          type: 'Side cover (front step)',
          role: 'front',
          sec: `S${deep.i + 1} ${deep === q ? 'right' : 'left'}`,
          poly: rect(Math.abs(q.z0 - nx.z0), hF - (deep.desk ? 0 : P)),
          grain: 'h',
          band: 'front',
          bandLen: hF,
          notes: ['Glue to the exposed box side where the front steps back']
        });
      }
    }
  });
  // plinth
  const runs = [];
  secs.forEach(q => {
    if (q.desk || (q.panel && !q.toe) || q.door || (q.free && q.mount !== 'plinth')) return;
    const l = runs[runs.length - 1];
    if (l && Math.abs(l[1] - q.bL) < 0.01 && l[2] === q.z0) l[1] = q.bR;
    else runs.push([q.bL, q.bR, q.z0]);
  });
  {
    const fl_ = parts.filter(p_ => p_.yb < 1 && p_.h > P + 1);
    runs.forEach(r_ => {
      fl_.forEach(p_ => {
        if (p_.x < r_[0] + 0.5 && p_.x + tc > r_[0] + 0.5) r_[0] = p_.x + tc;
        if (p_.x < r_[1] - 0.5 && p_.x + tc > r_[1] - 0.5) r_[1] = p_.x;
      });
    });
  }
  const mlK = (() => {
    let m = sheetOf(M.skirt.sheet).L - 2 * (+O.trim || 0);
    const so = O.stock;
    if (so && so.on && (!so.roles || so.roles.skirt) && M.skirt.type === 'melamine')
      m = Math.min(m, (+so.L || 2500) - 2);
    if (+O.maxSkirtL > 0) m = Math.min(m, +O.maxSkirtL);
    return m;
  })();
  result.maxSkirt = mlK;
  const jointNote = x =>
    `Butt joint at ${f0(x)} mm from the left wall — over a cabinet side; glue and screw a 100 mm backing strip behind`;
  const legXs = secs.flatMap(q => [q.bL, q.bR]);
  runs.forEach(([a, b, zr]) => {
    let s = a;
    while (s < b - 0.5) {
      let e = Math.min(b, s + mlK);
      if (e < b - 0.5) {
        const c = legXs.filter(x => x > s + 300 && x <= e);
        if (c.length) e = Math.max(...c);
      }
      const nts = [];
      if (s > a + 0.5) nts.push(jointNote(s));
      if (e < b - 0.5) nts.push(jointNote(e));
      if (fD)
        nts.push(
          `Floor not level: this board is ${f0(P + flo(s))} mm tall at its left end and ${f0(P + flo(e))} mm at its right end — the top edge stays level, the bottom edge follows the floor (scribe it on site)`
        );
      addPanel({
        type: 'Plinth',
        role: 'skirt',
        sec: 'base',
        poly: fD
          ? [
              [0, -flo(s)],
              [e - s, -flo(e)],
              [e - s, P],
              [0, P]
            ]
          : rect(e - s, P),
        grain: 'w',
        notes: nts
      });
      items.push(
        fp(
          [
            [s, 0],
            [e, 0],
            [e, P],
            [s, P]
          ],
          -+K.recess - zr,
          tk,
          'skirt',
          null,
          true
        )
      );
      plinthW.push([s, e]);
      s = e;
    }
  });
  // top closing strip
  const sx0 = secs[0].lx,
    sx1 = secs[n - 1].rx + tc,
    bounds = secs.map(q => q.bR);
  let a = sx0;
  const pieces = [];
  // projector screen drawer: housing on top of the lowered columns, a wide drawer with the cassette that pulls out so the cloth drops in front of the doors
  const scrK = [];
  if (scrPre) {
    const P_ = scrPre,
      SC = O.screen || {},
      d_ = P_.d_,
      cas = P_.cas,
      Hb = P_.Hb,
      bx0 = P_.l + (boxes ? 0 : tc / 2),
      bx1 = P_.r - (boxes ? 0 : tc / 2),
      yT = P_.yT,
      yB = yT - Hb,
      hProj = ['none', 'groove', 'slot', 'hole'].includes(O.handle) ? 0 : 35,
      fOff = hProj + 15,
      pull = Math.round(tf + 12 + cas / 2 + fOff),
      depth = Math.min(D - 40, Math.max(300, cas + 230)),
      rl = [250, 300, 350, 400, 450].find(v => v >= depth - 20) || 450;
    const iw = bx1 - bx0 - 2 * tc,
      dw = iw - 26,
      cols = secs.filter(q => q.i >= P_.a && q.i <= P_.b),
      joints = cols.slice(1).map(q => q.bL),
      faux = (SC.faux || 'doors') !== 'plain',
      down = SC.show === 'down',
      po = down ? pull : 0,
      imgTop = yB - 80,
      imgBot = imgTop - d_.h,
      xc = P_.xc;
    if (yT < P_.hiTop - 300)
      warns.push(
        `Projector screen: a ${f0(d_.w)} mm wide screen is wider than the high part of the wall, so its drawer sits ${f0(P_.hiTop - yT)} mm lower, under the slope, with a blank panel above it${P_.fit ? `. About ${f0(P_.fit)} mm fits at full height` : ''}.`
      );
    if (imgBot < 450)
      warns.push(
        `Projector screen: the picture would reach down to ${f0(Math.max(0, imgBot))} mm above the floor — a narrower screen sits better${P_.fit ? ` (about ${f0(P_.fit)} mm fits well here)` : ''}.`
      );
    addPanel({
      type: 'Screen drawer housing top',
      role: 'carcass',
      sec: 'top',
      poly: rect(bx1 - bx0, D),
      grain: 'w',
      band: 'front',
      bandLen: bx1 - bx0,
      notes: [
        `Lies across columns S${P_.a + 1}–S${P_.b + 1}, on the two housing ends; screw down into them and into the wall batten`
      ]
    });
    for (let e_ = 0; e_ < 2; e_++)
      addPanel({
        type: 'Screen drawer housing end',
        role: 'carcass',
        sec: 'top',
        poly: rect(D, Hb - tc),
        grain: 'w',
        band: 'front',
        bandLen: Hb - tc,
        notes: [
          `Stands on the top of column S${(e_ ? P_.b : P_.a) + 1}; carries one drawer runner, ${f0(Hb - tc - 45)} mm up from its bottom edge`
        ]
      });
    addPanel({
      type: faux ? 'Screen drawer front (faux doors)' : 'Screen drawer front',
      role: 'front',
      sec: 'top',
      poly: rect(bx1 - bx0 - 4, Hb - 4),
      grain: 'w',
      band: 'all',
      notes: [
        `One long front across ${cols.length} column${cols.length > 1 ? 's' : ''}`,
        faux && joints.length
          ? `Rout a 3 mm V-groove at ${joints.map(x => f0(x - bx0)).join(' / ')} mm from the left end so it reads as ${cols.length} small doors over the columns below`
          : '',
        `Finger groove under the bottom edge to pull it; it comes out ${f0(pull)} mm to a stop`
      ].filter(Boolean)
    });
    addPanel({
      type: 'Screen drawer carrier board',
      role: 'carcass',
      sec: 'top',
      poly: rect(dw - 2 * tc, depth),
      grain: 'w',
      notes: [
        `The cassette brackets screw up into this board, the middle of the cassette ${f0(12 + cas / 2)} mm behind the drawer front`
      ]
    });
    for (let e_ = 0; e_ < 2; e_++)
      addPanel({
        type: 'Screen drawer side',
        role: 'carcass',
        sec: 'top',
        poly: rect(depth, Hb - tc - 30),
        grain: 'w',
        band: 'front',
        bandLen: Hb - tc - 30,
        notes: ['Runner screws to the outside; carrier board sits on top, flush']
      });
    items.push(hz(bx0, bx1, yT - tc, tc, 0, D, 'carcass'));
    [bx0, bx1 - tc].forEach(xe =>
      items.push({
        k: 'prism',
        poly: [
          [-D, yB],
          [0, yB],
          [0, yT - tc],
          [-D, yT - tc]
        ],
        toW: (u, v) => [xe, v, u],
        ext: [tc, 0, 0],
        role: 'carcass'
      })
    );

    result.screen = {
      diag: Math.round(d_.w / 22.14),
      w: d_.w,
      h: d_.h,
      xc,
      cx0: xc - P_.cl / 2,
      cx1: xc + P_.cl / 2,
      cl: P_.cl,
      yS: yB,
      yT,
      imgTop,
      imgBot,
      fx0: xc - d_.w / 2 - 40,
      fx1: xc + d_.w / 2 + 40,
      down,
      fit: P_.fit,
      bx0,
      bx1,
      boxH: Hb,
      cas,
      fOff,
      hProj,
      pull,
      joints,
      faux,
      cols: [P_.a, P_.b],
      depth,
      po
    };
    H.screen = {
      diag: Math.round(d_.w / 22.14),
      cl: f0(P_.cl),
      w: f0(d_.w),
      h: f0(d_.h),
      cas,
      pull: f0(pull),
      rl,
      len: f0(bx1 - bx0)
    };
  }
  const steps = secs
    .slice(0, -1)
    .filter((q, i) => q.z0 !== secs[i + 1].z0)
    .map(q => q.bR);
  const kinks = [
    ...cps.map(p => p.x).filter(x => x > sx0 + 20 && x < sx1 - 20),
    ...steps,
    ...secs.filter(q => q.free || q.own).flatMap(q => [q.bL, q.bR])
  ]
    .filter(x => x > sx0 + 0.5 && x < sx1 - 0.5)
    .sort((m, n) => m - n);
  const allK = [...kinks, ...scrK].sort((m, n) => m - n);
  while (a < sx1 - 0.5) {
    const kk = allK.find(x => x > a + 1);
    let b = Math.min(a + mlK, kk ?? Infinity);
    if (b >= sx1) b = sx1;
    else if (!(kk != null && b === kk)) {
      const c = bounds.filter(x => x > a + 1 && x <= b);
      if (c.length) b = Math.max(...c);
    }
    {
      const cy = x => ceilAt(Math.max(0, Math.min(W, x))),
        ln = x => Math.hypot(x - a, cy(x) - cy(a)) + 2 * sc + 25;
      if (ln(b) > mlK) {
        const c = bounds.filter(x => x > a + 150 && x < b && ln(x) <= mlK);
        b = c.length ? Math.max(...c) : a + (((b - a) * mlK) / ln(b)) * 0.97;
      }
    }
    {
      const wK = sheetOf(M.skirt.sheet).W - 2 * (+O.trim || 0),
        hBox = x => {
          let lo = Infinity,
            hi = -Infinity;
          secs.forEach(q => {
            const l = Math.max(a, q.bL),
              r = Math.min(x, q.bR);
            if (r - l > 0.01) for (let u = 0; u <= 6; u++) lo = Math.min(lo, q.top(l + ((r - l) * u) / 6));
          });
          upperLine(a, x).forEach(p_ => {
            hi = Math.max(hi, p_[1]);
          });
          return hi + sc - lo;
        };
      for (let it = 0; it < 12 && b - a > 260 && hBox(b) > wK; it++) {
        const c = bounds.filter(x => x > a + 150 && x < b - 1 && hBox(x) <= wK);
        b = c.length ? Math.max(...c) : a + (b - a) * 0.8;
      }
    } // a closing strip piece under a steep slope is cut shorter so it fits the width of the board
    pieces.push([a, b]);
    a = b;
  }
  pieces.forEach(([a, b]) => {
    if (secs.some(q => (q.free || q.own) && (a + b) / 2 > q.bL && (a + b) / 2 < q.bR)) return;
    const lower = [];
    secs.forEach(q => {
      const l = Math.max(a, q.bL),
        r = Math.min(b, q.bR);
      if (r - l > 0.01)
        lower.push(...sampleLine(x => (q.scrCap != null && scrPre ? scrPre.yT : q.top(x)) + g / 2, l, r));
    });
    const up = upperLine(a, b);
    if (
      up.some(p => {
        const lo = lower.find(l => Math.abs(l[0] - p[0]) < 1);
        return lo && p[1] - lo[1] < g;
      })
    ) {
      warns.push('The top closing strip is very thin somewhere — check the top gap and beam clearances.');
    }
    const poly = [...lower, ...up.slice().reverse()];
    skirtW.push(poly);
    const jn = [a, b]
      .filter(x => x > sx0 + 0.5 && x < sx1 - 0.5 && !allK.some(k => Math.abs(k - x) < 0.5))
      .map(jointNote);
    const flap = false;
    if (flap)
      jn.push(
        'Lift-up flap for the projector screen: hang it on 2 flap hinges at the top edge (or on push latches) so it tips open and the screen drops in front of the doors',
        'Leave a 3 mm gap to the closing strips beside it'
      );
    addPanel({
      type: flap ? 'Top closing strip flap (projector screen)' : 'Top closing strip',
      role: 'skirt',
      sec: 'top',
      poly: [
        ...lower,
        ...up
          .slice()
          .reverse()
          .map(p => [p[0], p[1] + sc])
      ],
      grain: (() => {
        const ys_ = [...lower, ...up].map(p_ => p_[1]);
        return Math.max(...ys_) + sc - Math.min(...ys_) > (b - a) * 1.5 ? 'h' : 'w';
      })(),
      notes: [
        sc ? `Includes ${sc} mm scribe allowance on the top edge` : 'Scribe to ceiling',
        ...(kinks.some(x => Math.abs(x - a) < 0.5 || Math.abs(x - b) < 0.5)
          ? ['Ends mitred where the ceiling changes slope']
          : []),
        ...jn
      ]
    });
    const zq = (secs.find(q => (a + b) / 2 >= q.bL && (a + b) / 2 <= q.bR) || secs[0]).z0;
    items.push(fp(poly, tf - zq, tk, 'skirt', null, true));
  });
  steps.forEach(x => {
    const i = secs.findIndex(q => Math.abs(q.bR - x) < 0.01),
      qa = secs[i],
      qb = secs[i + 1];
    const lo = Math.max(qa.top(x), qb.top(x)),
      hi = frontLim(x),
      dz = Math.abs(qa.z0 - qb.z0),
      zm = Math.min(qa.z0, qb.z0);
    if (hi - lo > 5) {
      addPanel({
        type: 'Skirt return (front step)',
        role: 'skirt',
        sec: 'top',
        poly: rect(dz, hi - lo),
        grain: 'h',
        notes: ['Closes the top closing strip where the front steps back']
      });
      items.push({
        k: 'prism',
        poly: [
          [zm - tf, lo],
          [zm + dz - tf, lo],
          [zm + dz - tf, hi],
          [zm - tf, hi]
        ],
        toW: (u, v) => [x - tk / 2, v, -u],
        ext: [tk, 0, 0],
        role: 'skirt'
      });
    }
    if (!qa.desk && !qb.desk && !qa.panel && !qb.panel && !qa.door && !qb.door && !qa.free && !qb.free)
      addPanel({ type: 'Plinth return (front step)', role: 'skirt', sec: 'base', poly: rect(dz, P), grain: 'w' });
  });
  // side closing strips
  const addSide = o => {
    const ys = o.poly.map(p_ => p_[1]),
      y1 = Math.max(...ys),
      hg = y1 - Math.min(...ys);
    if (hg <= mlK) return addPanel(o);
    const cut = Math.round(y1 - Math.max(300, hg - (mlK - 10)));
    [
      [-1e5, cut],
      [cut, 1e5]
    ].forEach(([lo, hi], j) => {
      const pl = clipY(o.poly, lo, hi);
      if (pl.length > 2)
        addPanel({
          ...o,
          poly: pl,
          notes: o.notes.concat([
            `Too tall for one board: this is the ${j ? 'upper' : 'lower'} piece, butt joint ${f0(cut)} mm above the floor — glue a 100 mm backing strip behind the joint`
          ])
        });
    });
  };
  if (x0 > 0.5 && !secs[0].free) {
    const up = upperLine(0, x0),
      poly = [[0, 0], [x0, 0], ...up.slice().reverse()];
    sideW.push(poly);
    {
      const Hw = Math.max(500, ceilAt(0)),
        wx = y => -sc - (lnL * Math.max(0, y)) / Hw,
        nk = SKB && x0 > SKB.t + 8,
        nts = sc ? [`Includes ${sc} mm scribe on wall and ceiling edges`] : [];
      if (lnL)
        nts.push(
          `Left wall is ${f0(Math.abs(lnL))} mm out of plumb: this strip is ${f0(x0)} mm wide at the floor and ${f0(x0 + lnL)} mm at the top (before the scribe allowance) — scribe the wall edge`
        );
      if (nk) nts.push(`Notch ${f0(SKB.t)} × ${f0(SKB.h)} mm at the bottom wall corner for the skirting board`);
      addSide({
        type: 'Side closing strip',
        role: 'skirt',
        sec: 'left wall',
        poly: [
          nk ? [SKB.t, 0] : [-sc, 0],
          [x0, 0],
          ...up
            .slice()
            .reverse()
            .map(([x, y]) => [x < 0.01 ? wx(y + sc) : x, y + sc]),
          ...(nk
            ? [
                [wx(SKB.h), SKB.h],
                [SKB.t, SKB.h]
              ]
            : [])
        ],
        grain: 'h',
        notes: nts
      });
    }
    items.push(fp(poly, tf - secs[0].z0, tk, 'skirt'));
  }
  if (W - sx1 > 0.5 && !secs[n - 1].free) {
    const up = upperLine(sx1, W),
      poly = [[sx1, 0], [W, 0], ...up.slice().reverse()];
    sideW.push(poly);
    {
      const Hw = Math.max(500, ceilAt(W)),
        wx = y => W + sc + (lnR * Math.max(0, y)) / Hw,
        gp_ = W - sx1,
        nk = SKB && gp_ > SKB.t + 8,
        nts = sc ? [`Includes ${sc} mm scribe on wall and ceiling edges`] : [];
      if (lnR)
        nts.push(
          `Right wall is ${f0(Math.abs(lnR))} mm out of plumb: this strip is ${f0(gp_)} mm wide at the floor and ${f0(gp_ + lnR)} mm at the top (before the scribe allowance) — scribe the wall edge`
        );
      if (nk) nts.push(`Notch ${f0(SKB.t)} × ${f0(SKB.h)} mm at the bottom wall corner for the skirting board`);
      addSide({
        type: 'Side closing strip',
        role: 'skirt',
        sec: 'right wall',
        poly: [
          [sx1, 0],
          ...(nk
            ? [
                [W - SKB.t, 0],
                [W - SKB.t, SKB.h],
                [wx(SKB.h), SKB.h]
              ]
            : [[W + sc, 0]]),
          ...up
            .slice()
            .reverse()
            .map(([x, y]) => [x > W - 0.01 ? wx(y + sc) : x, y + sc])
        ],
        grain: 'h',
        notes: nts
      });
    }
    items.push(fp(poly, tf - secs[n - 1].z0, tk, 'skirt'));
  }
  result.sx0 = sx0;
  result.sx1 = sx1;
  {
    const gL = secs[0].free ? 1e5 : x0,
      gR = secs[n - 1].free ? 1e5 : W - sx1;
    if (Math.abs(fD) > 25)
      warns.push(
        `The floor is ${f0(Math.abs(fD))} mm out of level across the wall — more than plinth legs take up (about 25 mm). Put packers under the legs at the low (${fD > 0 ? 'left' : 'right'}) end, or use taller legs there.`
      );
    if (fD && P + Math.abs(fD) > sheetOf(M.skirt.sheet).W)
      warns.push('The tapered plinth board is taller than the sheet is wide.');
    [
      [lnL, gL, 'left'],
      [lnR, gR, 'right']
    ].forEach(([ln, gp, sd]) => {
      if (!ln) return;
      if (gp < 0.5)
        warns.push(
          `The ${sd} wall is ${f0(Math.abs(ln))} mm out of plumb but the cabinet runs tight to it — leave a side closing strip of at least ${f0(Math.abs(ln) + 15)} mm there so the gap can be scribed shut.`
        );
      else if (ln < 0 && gp + ln < 8)
        warns.push(
          `The ${sd} wall leans in ${f0(-ln)} mm at the top but the side closing strip is only ${f0(gp)} mm — the cabinet won't go in at the top. Make that side closing strip at least ${f0(-ln + 15)} mm.`
        );
    });
    if (SKB)
      [
        [gL, 'left'],
        [gR, 'right']
      ].forEach(([gp, sd]) => {
        if (gp < SKB.t + 8 && gp < 1e4)
          warns.push(
            `The skirting board (${f0(SKB.t)} mm thick) on the ${sd} wall is in the way of the end panel — cut the skirting board back there, or make the side closing strip at least ${f0(SKB.t + 10)} mm.`
          );
      });
    const cols = secs.filter(q => !q.door),
      at = o => cols.find(q => o.cx >= q.bL && o.cx < q.bR),
      vds = result.vdivs || [];
    const side = (o, q) => {
      const hp = parts.find(p_ => o.x1 > p_.x - 8 && o.x0 < p_.x + tc + 8 && o.y1 > p_.yb && o.y0 < p_.h),
        hv = !hp && vds.find(d => o.x1 > d.x - 8 && o.x0 < d.x + tc + 8 && o.y1 > d.y0 && o.y0 < d.y1),
        h_ = hp || hv;
      return h_
        ? { x: h_.x, need: Math.ceil(Math.min(o.x1 + 8 - h_.x, h_.x + tc + 8 - o.x0) / 5) * 5, vd: !!hv }
        : null;
    };
    wobs.forEach(o => {
      o.msg = '';
      if (o.t === 'radiator') {
        const hit = cols.filter(q => o.x1 > q.bL + 5 && o.x0 < q.bR - 5 && (q.maxU || 1e5) > o.y0);
        if (hit.length) {
          o.bad = 1;
          warns.push(
            `${o.nm} (${f0(o.x0)}–${f0(o.x1)} mm) ends up behind ${hit.length > 1 ? `S${hit[0].i + 1}–S${hit[hit.length - 1].i + 1}` : `S${hit[0].i + 1}`} — a cabinet in front of a radiator traps the heat and dries out the boards. Keep that stretch of wall free, have the radiator moved, or shut it off for good.`
          );
        } else o.msg = 'Free — nothing is built in front of it.';
        return;
      }
      const q = at(o);
      if (!q) {
        o.msg = 'Outside the cabinet — stays free.';
        return;
      }
      const lab = 'S' + (q.i + 1);
      if (o.t === 'pipe') {
        if (q.panel) {
          o.msg = `Hidden behind the panel wall ${lab}.`;
          return;
        }
        const sd = side(o, q);
        if (sd) {
          o.bad = 1;
          warns.push(
            `${o.nm} (${f0(o.cx)} mm from the left wall) runs right behind a cabinet side — shift that ${sd.vd ? 'divider' : 'column edge'} at least ${sd.need} mm so the side doesn't have to be notched over its whole height.`
          );
          return;
        }
        const nw = Math.ceil((o.w + 10) / 5) * 5,
          nd = Math.ceil((o.pr + 8) / 5) * 5,
          xr = f0(o.cx - q.xa);
        let cnt = 0;
        panels.forEach(p_ => {
          if (p_.sec !== lab) return;
          const hor =
            p_.role === 'shelf' || p_.type === 'Bottom' || /^(Top|Fixed|Niche box \(top|Open box \(top)/.test(p_.type);
          if (hor) {
            p_.notes.push(
              `Pipe behind: notch ${nw} × ${nd} mm out of the back edge, centred ${xr} mm from the inside left of ${lab}`
            );
            cnt++;
          } else if (p_.role === 'back' && /^Back/.test(p_.type))
            p_.notes.push(
              `Pipe behind: either stop this back ${nd} mm short of the wall side (it sits in front of the pipe) or cut a ${nw} mm slot ${xr} mm from the inside left`
            );
        });
        o.msg = `Runs behind ${lab}: ${cnt} shelf/bottom part${cnt === 1 ? '' : 's'} get a ${nw} × ${nd} mm notch (see the notes in the cut list).`;
        if (o.pr > 40)
          warns.push(
            `${o.nm} sticks ${f0(o.pr)} mm out from the wall behind ${lab} — simpler than notching every part: make ${lab} about ${Math.ceil((o.pr + 10) / 10) * 10} mm shallower so its back passes in front of the pipe.`
          );
        return;
      }
      const KP = !!(WOB[o.t] || {}).keep,
        nm = o.t === 'switch' ? 'switch' : o.t === 'socket' ? 'socket' : WOB[o.t].n.toLowerCase();
      if (q.panel) {
        o.msg = `Behind the panel wall ${lab} — cut an opening in the cladding and fit a deeper box frame.`;
        return;
      }
      const sd = side(o, q);
      if (sd) {
        o.bad = 1;
        warns.push(
          `${o.nm} (${f0(o.cx)} mm from the left wall, ${f0(o.cy)} mm up) sits behind a cabinet ${sd.vd ? 'divider' : 'side'} — shift that ${sd.vd ? 'divider' : 'column edge'} at least ${sd.need} mm or the ${nm} can't be used.`
        );
        return;
      }
      if (!q.desk && o.cy < (q.Pq || 0)) {
        o.msg = `Behind the plinth of ${lab} — the plinth board clips off, so it stays reachable (handy for an extension lead).`;
        return;
      }
      const zr = q.zones.find(zr => o.cy >= zr.y0 - tc && o.cy < zr.y0 + (zr.top ? 1e5 : zr.h + (zr.divT || 0)));
      if (!zr) {
        o.msg = `Behind ${lab}.`;
        return;
      }
      const ty = zr.z.type;
      if (
        q.zones.some(z2 => !z2.top && z2.divY != null && o.y1 > z2.divY - 5 && o.y0 < z2.divY + (z2.divT || tc) + 5) ||
        o.y0 < zr.y0 + 2
      ) {
        o.bad = 1;
        warns.push(
          `${o.nm} (${f0(o.cy)} mm up) sits behind a fixed shelf between two parts of ${lab} — make the part below or above it ${Math.ceil((o.y1 - o.y0) / 2 + 30)} mm taller or shorter.`
        );
        return;
      }
      if (ty === 'drawers' || ty === 'seat') {
        o.bad = 1;
        warns.push(
          KP
            ? `${o.nm} ends up behind the drawers of ${lab} — you couldn’t get to it. Make that part a door (no shelf in front of it).`
            : `${o.nm} ends up behind the drawers of ${lab} — a plug there hits the drawer boxes. Make that part doors or open shelves, or have the ${nm} moved.`
        );
        return;
      }
      if ((zr.shelvesY || []).some(([y]) => o.y1 > y - 5 && o.y0 < y + ts + 5)) {
        o.bad = 1;
        warns.push(
          `${o.nm} (${f0(o.cy)} mm up) sits behind a shelf in ${lab} — change the number of shelves there so it falls between two shelves.`
        );
        return;
      }
      if (zr.fit && zr.fit.h && o.y0 < zr.fit.y0 + zr.fit.n * zr.fit.h) {
        o.bad = 1;
        warns.push(
          `${o.nm} ends up behind the ${FITS[zr.fit.kind].s.toLowerCase()} in ${lab} — a plug there is in the way of the pull-out.`
        );
        return;
      }
      if (o.t === 'switch' && ty !== 'open' && ty !== 'opening') {
        o.bad = 1;
        warns.push(
          `${o.nm} ends up inside ${lab}, behind a front — have it moved to a free wall, or leave that part of the cabinet open.`
        );
        return;
      }
      if (KP && o.t === 'boiler') {
        H.funParts.push({
          n: 'Air vent grilles for the boiler cupboard (top and bottom), and keep 50 mm free around the boiler',
          q: '2',
          sec: lab
        });
        if (q.Dh < (+(R.wobs[o.i] || {}).p || 350) + 50)
          warns.push(
            `${o.nm} sticks out about ${f0(+(R.wobs[o.i] || {}).p || 350)} mm — ${lab} needs at least ${f0((+(R.wobs[o.i] || {}).p || 350) + 70)} mm of depth to close over it.`
          );
        if (ty === 'closed' && !(S.sections[q.i].zones[zr.k] || {}).vent)
          warns.push(`${lab}: a boiler behind a door needs air — tick “Air vents in the door” for that level.`);
      }
      o.msg = KP
        ? `Stays reachable behind ${ty === 'closed' ? 'the door of ' : ''}${lab}: no shelf in front of it${q.noBack ? '' : ', and a cut-out in the back panel'}. Keep it this way when you change the layout.`
        : `Reachable inside ${lab}${ty === 'closed' ? ', behind the door' : ''}${q.noBack ? '' : ' through a cut-out in the back panel'}.`;
    });
    result.site = { fD, flo, lnL, lnR, gL, gR, skb: SKB, wobs };
  }
  const LD = S.ladder || {};
  if (LD.on) {
    const tops = x => {
      const q = secs.find(q => x >= q.bL && x <= q.bR);
      return q && !q.panel && !q.door && !q.desk && !q.free && q.scrCap == null ? q.top(x) : -1;
    };
    const maxTop = Math.max(...secs.map(q => Math.min(q.top(q.bL), q.top(q.bR), ...q.topPts.map(p => p[1]))));
    const stretch = hr => {
      let b = null,
        cur = null;
      for (let x = sx0; x <= sx1; x += 10) {
        const ok = tops(x) >= hr + 60;
        if (ok && !cur) cur = [x, x];
        if (ok) cur[1] = x;
        if ((!ok || x + 10 > sx1) && cur) {
          if (!b || cur[1] - cur[0] > b[1] - b[0]) b = cur;
          cur = null;
        }
      }
      return b;
    };
    let Hr = +LD.h > 0 ? +LD.h : null,
      best = null;
    if (Hr == null) {
      const hi = Math.min(2250, Math.round((maxTop - 120) / 50) * 50);
      let bl = -1;
      for (let hr = hi; hr >= Math.min(1600, hi); hr -= 50) {
        const b = stretch(hr),
          L = b ? b[1] - b[0] : 0;
        if (L > bl + 60) {
          bl = L;
          Hr = hr;
          best = b;
        }
      }
      if (Hr == null) Hr = hi;
    }
    if (!best) best = stretch(Hr);
    if (!best || best[1] - best[0] < 800)
      warns.push(
        `Book ladder: no stretch of at least 800 mm is tall enough for a rail at ${f0(Hr)} mm — lower the rail.`
      );
    else {
      let r0 = best[0] + 40,
        r1 = best[1] - 40;
      const mxL = +LD.maxLen > 0 ? Math.max(900, +LD.maxLen) : 0;
      if (mxL && r1 - r0 > mxL) {
        const cxL = LD.cx != null ? +LD.cx : (r0 + r1) / 2;
        let a_ = Math.max(r0, Math.min(r1 - mxL, cxL - mxL / 2));
        const eds = secs.flatMap(q => [q.bL, q.bR]),
          snap = x => {
            const e = eds
              .filter(v => v >= r0 - 41 && v <= r1 + 41)
              .sort((u, v) => Math.abs(u - x) - Math.abs(v - x))[0];
            return e != null && Math.abs(e - x) < 220 ? e : x;
          };
        const na = snap(a_),
          nb = snap(a_ + mxL);
        if (nb - na >= 800) {
          r0 = Math.max(r0, na + 40);
          r1 = Math.min(r1, nb - 40);
        } else {
          r0 = a_;
          r1 = a_ + mxL;
        }
      }
      const lw = 440,
        ang = (75 * Math.PI) / 180,
        foot = Hr / Math.tan(ang),
        len = Hr / Math.sin(ang),
        pos = Math.max(0, Math.min(1, LD.pos ?? 0.5)),
        lx = r0 + (r1 - r0 - lw) * pos;
      const H_ = Hr,
        onRail = secs.filter(q => !q.panel && !q.door && q.bR > r0 + 50 && q.bL < r1 - 50),
        miss = onRail.filter(
          q => q.minU >= H_ + 150 && !q.zones.some(zr => !zr.top && Math.abs(zr.divY + zr.divT / 2 - Hr) <= 25)
        );
      result.ladder = {
        r0,
        r1,
        h: Hr,
        x: lx,
        w: lw,
        foot,
        len,
        z: tf + 70,
        secs: onRail.map(q => q.i),
        miss: miss.map(q => q.i)
      };
      if (miss.length)
        warns.push(
          `Book ladder: ${miss.map(q => 'S' + (q.i + 1)).join(', ')} ${miss.length > 1 ? 'have' : 'has'} no joint at the rail height (${f0(Hr)} mm) — tap “Line up the cabinets” in the Book ladder card so the rail runs along one straight line.`
        );
      if (Hr < 1500) warns.push(`Book ladder: a rail at ${f0(Hr)} mm is low — a step stool would do.`);
      H.ladder = { rail: f0(r1 - r0), h: f0(Hr), len: f0(len), foot: f0(foot) };
    }
  }
  // ---- collision checks (the sloped-ceiling swing and sockets behind dividers/drawers are checked where those parts are made)
  {
    const lvl = f => `S${f.sec + 1} level ${f.zone + 1}`;
    fronts.forEach(f => {
      if (f.kind !== 'door' || f.rear || !(f.hinge === 'L' || f.hinge === 'R')) return;
      const xs = f.poly.map(p => p[0]),
        hx = f.hinge === 'L' ? Math.min(...xs) : Math.max(...xs),
        fx = f.hinge === 'L' ? Math.max(...xs) : Math.min(...xs),
        top = Math.max(...f.poly.map(p => p[1]));
      {
        const q = secs[f.sec],
          nq = secs[f.hinge === 'L' ? f.sec - 1 : f.sec + 1],
          y0 = Math.min(...f.poly.map(p => p[1])),
          myDz = (q.zones.find(z => z.k === f.zone) || {}).dzV || 0;
        if (nq && Math.abs((f.hinge === 'L' ? q.bL : q.bR) - hx) < 45) {
          const st = nq.zones.find(z => (z.dzV || 0) > myDz + 5 && z.y0 < top && z.y0 + z.h > y0);
          if (st)
            warns.push(
              `${lvl(f)}: the door hinges next to level ${st.k + 1} of S${nq.i + 1}, which sticks out ${f0(st.dzV - myDz)} mm further — the door hits it before it is fully open. Hinge it on the other side or make that level flush.`
            );
        }
      }
      if (!f.ins && (hx < 25 || hx > W - 25))
        warns.push(
          `${lvl(f)}: the door is hinged right next to the room wall — it can't open fully and the handle hits the wall. Add a side filler of at least 30 mm or hinge it on the other side.`
        );
    });
    const uq = [...new Set(warns)];
    warns.length = 0;
    warns.push(...uq);
  }
  if (GRV)
    panels.forEach(p => {
      if (
        p.role === 'carcass' &&
        /(Box side|side|Partition|End panel|^Bottom|^Top|Fixed divider|Seat board|Opening top|Opening sill)/i.test(
          p.type
        ) &&
        !/Pedestal|Header rail|Vertical divider|Drawer|packer|Screen/.test(p.type) &&
        !p.notes.some(n_ => /shallower than the sides|Shallow cabinet/.test(n_))
      )
        p.notes.push(`Back groove ${GRV_W} × ${GRV_D} mm deep, ${GRV_OFF} mm in from the back edge`);
    });
  // furniture fasteners
  {
    const JN = O.joinery || 'confirmat',
      jt = secs.filter(q => !q.panel && !q.door);
    let joints = 0;
    jt.forEach(q => {
      const per = JN === 'confirmat' || JN === 'screw' ? Math.ceil((q.Dc - 100) / 250) + 1 : q.Dc > 450 ? 3 : 2;
      const nh = 1 + 1 + q.zones.filter(zr => !zr.top && zr.divY).length;
      q.jn = nh * 2 * per;
      joints += nh * 2 * per;
    });
    H.join = { type: JN, joints, dowels: JN === 'confirmat' || JN === 'screw' ? 0 : joints, groove: GRV };
    H.wallHang = jt.filter(q => !q.free || q.mount === 'wall').length * 2;
    H.stacked = secs.filter(q => q.splitK >= 0).length;
  }
  result.maxUnit = MAXU;
  result.maxUnitAuto = MAXU_AUTO;
  // people, windows and doors in the room
  {
    const R_ = S.room,
      pr = R_.person || {};
    result.person = pr.on
      ? {
          h: Math.max(800, Math.min(2200, +pr.h || 1750)),
          x: pr.x != null && pr.x !== '' ? +pr.x : Math.round(W * 0.5)
        }
      : null;
    if (result.person) {
      const h = result.person.h;
      Object.assign(result.person, {
        eye: Math.round(h * 0.936),
        sh: Math.round(h * 0.818),
        easy: Math.round(h * 1.07),
        max: Math.round(h * 1.19),
        low: Math.round(h * 0.4)
      });
    }
    result.objs = (Array.isArray(R_.objs) ? R_.objs : []).map((o, i) => {
      const t = o.type || 'window',
        w = Math.max(200, +o.w || (t === 'door' ? 830 : 900)),
        hh = Math.max(200, +o.h || (t === 'door' ? 2015 : 1200)),
        y = t === 'door' ? 0 : Math.max(0, +o.y || (t === 'roofwin' ? 1100 : 850));
      return { i, type: t, wall: o.wall || 'back', x: +o.x || 0, w, h: hh, y };
    });
    result.objs.forEach(o => {
      if (o.wall !== 'back') return;
      const nm = { window: 'Window', door: 'Door', roofwin: 'Roof window' }[o.type] || 'Window';
      secs.forEach(q => {
        if (q.door && o.type === 'door') return;
        const ox0 = o.x,
          ox1 = o.x + o.w;
        if (ox1 <= q.lx + 5 || ox0 >= q.rx - 5) return;
        const hit = q.zones.filter(zr => zr.y0 < o.y + o.h && zr.y0 + zr.h > o.y);
        const ok =
          hit.length &&
          hit.every(zr => {
            const z = S.sections[q.i].zones[zr.k];
            return z && (z.type === 'opening' || z.type === 'open') && S.sections[q.i].back === 'none';
          });
        const below = hit.length === 0 && (q.maxU || 0) < o.y;
        if (!ok && !below)
          warns.push(
            `${nm} ${o.i + 1} (${f0(ox0)}–${f0(ox1)} mm) is behind S${q.i + 1} — make that part an open niche with no back, or move the ${nm.toLowerCase()}.`
          );
      });
    });
  }
  if (P < 60 && secs.some(q => !q.panel && !q.door && !q.desk && !q.free)) {
    H.legs = 0;
    H.noLegs = true;
    warns.push(
      P > 0
        ? `A ${f0(P)} mm plinth is too low for adjustable legs (they start at about 60 mm). The boxes stand on a ${f0(P)} mm base frame instead — two rails on edge, levelled with packers.`
        : `No plinth: the boxes stand straight on the floor, so the lowest doors and drawers start ${f0(tc)} mm above it and will catch on carpet or an uneven floor. A plinth of 60–100 mm is safer and lets you level the cabinet.`
    );
  }
  {
    const trm = +O.trim || 0,
      seen = new Set();
    panels.forEach(p_ => {
      if (!p_.sheet) return;
      const so = O.stock;
      if (so && so.on && p_.matType === 'melamine' && p_.t === 18) return;
      const sh = sheetOf(p_.sheet),
        gr = FIN[p_.fin] && FIN[p_.fin].kind !== 'plain',
        L = p_.grain === 'w' ? p_.w : p_.h,
        Wd = p_.grain === 'w' ? p_.h : p_.w,
        ok =
          (L <= sh.L - 2 * trm + 0.5 && Wd <= sh.W - 2 * trm + 0.5) ||
          (!gr && Wd <= sh.L - 2 * trm + 0.5 && L <= sh.W - 2 * trm + 0.5);
      if (!ok && !seen.has(p_.type)) {
        seen.add(p_.type);
        warns.push(
          `${p_.type}${p_.sec ? ' (' + p_.sec + ')' : ''} is ${f0(L)} × ${f0(Wd)} mm — bigger than the ${f0(sh.L)} × ${f0(sh.W)} mm board it is cut from${gr ? ' (the wood grain has to run along its length)' : ''}. Pick a larger board for that material under Look, or make that part smaller.`
        );
      }
    });
  }
  if (O.discSeam && fronts.some(f => f.handle && f.handle.type === 'disc')) {
    let pairs = 0;
    const ds = fronts.filter(f => f.kind === 'door' && f.handle && f.handle.type === 'disc'),
      bx = f => {
        const xs = f.poly.map(p_ => p_[0]);
        return [Math.min(...xs), Math.max(...xs)];
      };
    ds.forEach(f1 => {
      if (f1.hinge !== 'L' || f1.handle.seam) return;
      const r1 = bx(f1)[1],
        f2 = ds.find(
          f =>
            f !== f1 &&
            f.hinge === 'R' &&
            !f.handle.seam &&
            Math.abs(bx(f)[0] - r1) <= g + 6 &&
            Math.abs(f.handle.y - f1.handle.y) < 3
        );
      if (!f2) return;
      const cx_ = (r1 + bx(f2)[0]) / 2;
      f1.handle = Object.assign({}, f1.handle, { x: cx_, seam: 'L' });
      f2.handle = Object.assign({}, f2.handle, { x: cx_, seam: 'R' });
      pairs++;
    });
    if (pairs && H.handles.disc) H.handles.disc -= pairs;
  }
  if (cubCov.length)
    for (let j = props.length - 1; j >= 0; j--) {
      const p_ = props[j],
        cx = p_.x + (p_.w || 0) / 2;
      if (
        cubCov.some(
          b => b.sec === p_.sec && b.zone === p_.zone && cx > b.x0 && cx < b.x1 && p_.y > b.y0 - 30 && p_.y < b.y1
        )
      )
        props.splice(j, 1);
    }
  if (baskets.length)
    for (let j = props.length - 1; j >= 0; j--) {
      const p_ = props[j],
        cx = p_.x + (p_.w || 0) / 2;
      if (
        baskets.some(
          b =>
            b.sec === p_.sec &&
            b.zone === p_.zone &&
            cx > b.x0 - 4 &&
            cx < b.x1 + 4 &&
            p_.y > b.y0 - 30 &&
            p_.y < b.y1 + 10
        )
      )
        props.splice(j, 1);
    }
  try {
    accessCheck(result, S);
  } catch (e) {
    oops('build #1', e);
  }
  try {
    roomCheck(result, S, { bumps, cobjs });
  } catch (e) {
    oops('build #2', e);
  }
  try {
    cornerCheck(result, S);
  } catch (e) {
    oops('build #3', e);
  }
  // link each cut-list panel to its 3D board, so holes and hardware can be placed in 3D (see linkPanels below)
  try {
    linkPanels(panels, items, secs);
  } catch (e) {
    oops('Linking parts to 3D boards', e);
  }
  return result;
}

/* grouping for cut list */

/* ---------- link each cut-list part to its 3D board ----------
   A part (panel) and its 3D board (an item of kind 'prism') are made in different places of build(),
   so they are matched here on what they share:
     - the same kind of part (carcass, shelf, front …; fabric frames count as fronts),
     - the same thickness (within 1 mm),
     - preferably the same column, when the part belongs to one (sec 'S1', 'S2' …),
     - the same outline: every corner of the part lies within 1.5 mm of a corner of the board,
       allowing the board to be turned a quarter (panSw = 1).
   The closest match wins; each board is used once. Sets item.pan (the part) and item.panSw.
   Parts that are drawn in 3D as several pieces (framed glass doors, arched frames) have no single
   board and stay unlinked; their holes are then simply not shown in the 3D views. */
function linkPanels(panels, items, secs) {
  const kind = role => (/^fabric/.test(role || '') ? 'front' : role);
  const TOL = 1.5;
  const norm = (poly, turned) => {
    const pts = poly.map(p => (turned ? [p[1], p[0]] : [p[0], p[1]]));
    const mx = Math.min(...pts.map(p => p[0])),
      my = Math.min(...pts.map(p => p[1]));
    return pts.map(p => [p[0] - mx, p[1] - my]);
  };
  // how far apart two outlines are: the largest distance from a corner of one to the nearest corner of the other
  const gap = (a, b) => {
    if (a.length !== b.length) return Infinity;
    const one = (P, Q) => Math.max(...P.map(p => Math.min(...Q.map(q => Math.hypot(p[0] - q[0], p[1] - q[1])))));
    return Math.max(one(a, b), one(b, a));
  };
  // which column a board sits in, from the middle of its outline in the room
  const colOf = it => {
    try {
      const W = it.poly.map(([u, v]) => it.toW(u, v)),
        e = it.ext || [0, 0, 0];
      const x = (Math.min(...W.map(p => p[0])) + Math.max(...W.map(p => p[0])) + e[0]) / 2;
      const q = (secs || []).find(q => x >= q.bL - 1 && x <= q.bR + 1);
      return q ? 'S' + (q.i + 1) : null;
    } catch (e) {
      return null;
    }
  };
  const boards = items
    .filter(it => it.k === 'prism' && it.poly && it.poly.length >= 3)
    .map(it => ({
      it,
      role: kind(it.role),
      t: Math.hypot(...(it.ext || [0, 0, 0])),
      n: it.poly.length,
      col: colOf(it),
      shape: norm(it.poly, false)
    }));
  // drilled parts first, so they get first pick of boards that look alike
  const order = panels.slice().sort((a, b) => ((b.holes || []).length ? 1 : 0) - ((a.holes || []).length ? 1 : 0));
  order.forEach(pn => {
    const col = /^S\d+$/.test(pn.sec || '') ? pn.sec : null;
    let best = null;
    boards.forEach(b => {
      if (b.it.pan || b.role !== kind(pn.role) || b.n !== pn.poly.length || Math.abs(b.t - pn.t) > 1) return;
      const otherCol = col && b.col && b.col !== col ? 10 : 0; // a board in another column only wins when nothing closer fits
      for (const turned of [0, 1]) {
        const d = gap(norm(pn.poly, turned), b.shape);
        if (d <= TOL && (!best || d + otherCol < best.d - 1e-6)) best = { b, d: d + otherCol, turned };
      }
    });
    if (best) {
      best.b.it.pan = pn;
      best.b.it.panSw = best.turned;
    }
  });
  // framed doors (e.g. glass doors) are drawn as stiles and rails: link the door to its stiles,
  // so the hinge cups (which sit in a stile) still show. panOff moves the door's own x, y onto the stile.
  const drilled = pn => (pn.holes || []).some(h => !h.poly && !h.len);
  const bbox = it => {
    const xs = it.poly.map(p => p[0]),
      ys = it.poly.map(p => p[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  };
  panels
    .filter(pn => kind(pn.role) === 'front' && drilled(pn) && !items.some(it => it.pan === pn))
    .forEach(pn => {
      const W = Math.max(...pn.poly.map(p => p[0])),
        H = Math.max(...pn.poly.map(p => p[1])),
        col = /^S\d+$/.test(pn.sec || '') ? pn.sec : null;
      const stiles = boards
        .filter(
          b =>
            !b.it.pan &&
            b.role === 'front' &&
            Math.abs(b.t - pn.t) <= 1 &&
            (!col || !b.col || b.col === col) &&
            b.n === 4 &&
            b.it.toW &&
            b.it.toW(0, 0)[0] === 0
        )
        .map(b => Object.assign(b, { bb: bbox(b.it) }))
        .filter(b => Math.abs(b.bb.y1 - b.bb.y0 - H) <= TOL && b.bb.x1 - b.bb.x0 < W / 2);
      for (const L of stiles) {
        const R = stiles.find(
          r => r !== L && Math.abs(r.bb.y0 - L.bb.y0) <= TOL && Math.abs(r.bb.x1 - L.bb.x0 - W) <= TOL
        );
        if (!R || L.it.pan || R.it.pan) continue;
        L.it.pan = pn;
        L.it.panOff = [0, 0];
        R.it.pan = pn;
        R.it.panOff = [-(R.bb.x0 - L.bb.x0), 0];
        break;
      }
    });
}
