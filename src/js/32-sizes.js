/* ==== 32-sizes.js ====
   Sizes on demand: point at a part to see how big it is.
     Front view: hover with the mouse, or touch and hold (½ s) on a phone, over
       - a door or drawer front → width × height × thickness, hinges (side and how many), handle,
       - an open space or a compartment behind the doors → inside width × height × depth,
         between the shelves or boards above and below,
       - a column → its width.
     3D: hover with the mouse (or touch and hold) over a board → its name and cut size from the cut list.
   The readout follows the pointer and goes away when you move off, lift your finger or tap elsewhere.
   Uses: G.fronts, G.secs[i].zones (comps, shelvesY, y0, h), the 3D meshes' userData.it (with .pan, the
   cut-list part linked in build()), and ELEV_T from elevSVG to turn screen points into mm.
*/
var ELEV_T = 0;
const SZ = { tip: null, hold: null, at: null };

function szTip() {
  if (!SZ.tip) {
    SZ.tip = document.createElement('div');
    SZ.tip.className = 'sztip';
    SZ.tip.setAttribute('role', 'status');
    SZ.tip.hidden = true;
    document.body.appendChild(SZ.tip);
  }
  return SZ.tip;
}
function szShow(html, cx, cy) {
  const t = szTip();
  t.innerHTML = html;
  t.hidden = false;
  const w = t.offsetWidth,
    h = t.offsetHeight;
  let x = cx + 16,
    y = cy + 16;
  if (x + w > innerWidth - 8) x = cx - w - 16;
  if (y + h > innerHeight - 8) y = cy - h - 16;
  t.style.left = Math.max(8, x) + 'px';
  t.style.top = Math.max(8, y) + 'px';
}
function szHide() {
  if (SZ.tip) SZ.tip.hidden = true;
  SZ.at = null;
}
const szIn = (pt, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i],
      [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const szBox = poly => {
  const xs = poly.map(p => p[0]),
    ys = poly.map(p => p[1]);
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};
const szMM = v => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1));

/* what is at x, y (mm, y up from the floor) in the front view */
function sizeAt(x, y) {
  const G = geo;
  if (!G) return null;
  const KIND = { door: 'Door', drawer: 'Drawer front', flap: 'Flap', curtain: 'Curtain' };
  // 1. fronts (not when the drawing shows no doors)
  if (ui.fm !== 'off') {
    const f = (G.fronts || []).find(f => f.poly && f.poly.length > 2 && szIn([x, y], f.poly));
    if (f) {
      const b = szBox(f.poly),
        lines = [`<b>${szMM(b.w)} × ${szMM(b.h)} mm</b> · ${G.tf} mm thick`];
      if (f.kind === 'door' && f.hinge) lines.push(`Hinges ${f.hinge === 'L' ? 'left' : 'right'}${Array.isArray(f.cups) ? ` · ${f.cups.length}×` : ''}`);
      if (f.poly.length !== 4) lines.push('Shaped — see the cut list drawing');
      return { title: `${KIND[f.kind] || 'Front'} · S${f.sec + 1}`, lines };
    }
  }
  // 2. the space inside a column, between the boards around it
  const q = (G.secs || []).find(q => x >= q.bL && x <= q.bR);
  if (!q) return null;
  if (q.panel) return { title: `Panel wall · S${q.i + 1}`, lines: [`<b>${szMM(q.w)} mm</b> wide`] };
  const zr = (q.zones || []).find(zr => y >= zr.y0 && y <= zr.y0 + zr.h);
  if (zr && x >= q.xa && x <= q.xb) {
    const comp = (zr.comps && zr.comps.length ? zr.comps : [[q.xa, q.xb]]).find(c => x >= c[0] - 0.5 && x <= c[1] + 0.5) || [q.xa, q.xb];
    const ts = G.ts || 18;
    let lo = zr.y0,
      hi = zr.y0 + zr.h;
    (zr.shelvesY || []).forEach(s => {
      const [sy, sx0, sx1] = s;
      if (sx1 < comp[0] + 1 || sx0 > comp[1] - 1) return;
      if (sy + ts <= y) lo = Math.max(lo, sy + ts);
      else if (sy >= y) hi = Math.min(hi, sy);
    });
    const Z = { closed: 'Behind the doors', open: 'Open space', drawers: 'Drawer level', opening: 'Niche' };
    return {
      title: `${Z[(zr.z || {}).type] || 'Inside'} · S${q.i + 1}`,
      lines: [`Inside <b>${szMM(comp[1] - comp[0])} × ${szMM(hi - lo)} mm</b>`, `${szMM(q.Dh)} mm deep`]
    };
  }
  return { title: `Column S${q.i + 1}`, lines: [`<b>${szMM(q.w)} mm</b> wide inside`] };
}

/* screen point over the front drawing → mm */
function szElevPoint(e) {
  const svg = document.querySelector('#elevWrap > svg') || document.querySelector('#elevWrap svg');
  if (!svg || !svg.getScreenCTM) return null;
  const m = svg.getScreenCTM();
  if (!m) return null;
  const p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  const r = p.matrixTransform(m.inverse());
  return [r.x, ELEV_T - r.y];
}
function szElev(e) {
  const pt = szElevPoint(e);
  const s = pt && sizeAt(pt[0], pt[1]);
  if (!s) return szHide();
  szShow(`<em>${esc(s.title)}</em>${s.lines.map(l => `<span>${l}</span>`).join('')}`, e.clientX, e.clientY);
}

/* 3D: the board under the pointer */
function sz3D(e) {
  if (!T3 || !window.THREE || !THREE.Raycaster) return szHide();
  const el = T3.renderer.domElement,
    r = el.getBoundingClientRect();
  if (!r.width) return szHide();
  const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  if (!T3.rcs) T3.rcs = new THREE.Raycaster();
  T3.cam.updateMatrixWorld();
  T3.rcs.setFromCamera(v, T3.cam);
  const shown = o => {
    for (let p = o; p; p = p.parent) if (!p.visible) return false;
    return true;
  };
  const hit = T3.rcs.intersectObjects([T3.frontG, T3.root].filter(Boolean), true).find(h => h.object.isMesh && h.object.userData.it && !h.object.userData.gap && shown(h.object));
  const it = hit && hit.object.userData.it;
  if (!it) return szHide();
  let title = 'Part',
    lines = [];
  if (it.pan) {
    const P = it.pan,
      L = Math.max(P.w, P.h),
      W = Math.min(P.w, P.h);
    title = P.type || 'Part';
    lines = [`<b>${szMM(L)} × ${szMM(W)} mm</b> · ${szMM(P.t)} mm thick`];
    try {
      const g = (groupsCache || (groupsCache = groupPanels(bgeo()))).find(gp => gp.type === P.type && gp.t === P.t && JSON.stringify(gp.poly) === JSON.stringify(P.poly));
      if (g) lines.push(`Cut list <b>${g.id}</b>${g.qty > 1 ? ` · ${g.qty}×` : ''}`);
    } catch (e2) {
      oops('sizes: cut list part', e2, 1);
    }
  } else if (it.k === 'prism' && it.poly) {
    const b = szBox(it.poly),
      t = Math.hypot(...(it.ext || [0, 0, 0]));
    lines = [`<b>${szMM(Math.max(b.w, b.h))} × ${szMM(Math.min(b.w, b.h))} mm</b>${t ? ` · ${szMM(t)} mm thick` : ''}`];
    title = { front: 'Front piece', carcass: 'Board', shelf: 'Shelf', back: 'Back', skirt: 'Strip' }[it.role] || 'Board';
  } else return szHide();
  szShow(`<em>${esc(title)}</em>${lines.map(l => `<span>${l}</span>`).join('')}`, e.clientX, e.clientY);
}

/* mouse: follow the pointer; touch: touch and hold ½ s without moving */
function szWire(id, fn) {
  const el = document.getElementById(id);
  if (!el || el.dataset.sz) return;
  el.dataset.sz = '1';
  let raf = 0;
  el.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') {
      if (e.buttons) return szHide(); // dragging
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try {
          fn(e);
        } catch (er) {
          oops('sizes', er);
        }
      });
    } else if (SZ.hold && Math.hypot(e.clientX - SZ.hold.x, e.clientY - SZ.hold.y) > 8) {
      clearTimeout(SZ.hold.t);
      SZ.hold = null;
    }
  });
  el.addEventListener('pointerleave', e => e.pointerType === 'mouse' && szHide());
  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    szHide();
    const x = e.clientX,
      y = e.clientY,
      ev = { clientX: x, clientY: y };
    SZ.hold = {
      x,
      y,
      t: setTimeout(() => {
        try {
          fn(ev);
          SZ.held = Date.now();
        } catch (er) {
          oops('sizes', er);
        }
      }, 450)
    };
  });
  const end = () => {
    if (SZ.hold) clearTimeout(SZ.hold.t);
    SZ.hold = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  // a hold should not also select the part it was held on
  el.addEventListener(
    'click',
    e => {
      if (SZ.held && Date.now() - SZ.held < 700) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true
  );
}
document.addEventListener('pointerdown', e => {
  if (SZ.tip && !SZ.tip.hidden && !e.target.closest('#v-elev,#v-3d')) szHide();
});
function szInit() {
  szWire('v-elev', szElev);
  szWire('v-3d', sz3D);
}
