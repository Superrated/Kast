/* ==== 25-3d.js ====
   The 3D view: the white IKEA boxes with the new fronts on them, in their real materials — matt paint, oak and
   walnut grain, birch ply, raw MDF, flutes as a light-catching relief, fluted glass in its frame — and the handles.
   three.js r159 (the same as Fitted) loads only when you first open 3D. Drag to turn, scroll or pinch to zoom,
   tap a front to select it.
*/
const V3 = { ready: false, loading: false, yaw: -0.42, pitch: 0.1, zoom: 1, tex: {}, meshes: [] };
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js';

function open3D() {
  const el = document.getElementById('pic3d');
  if (window.THREE) return start3D(el);
  if (V3.loading) return;
  V3.loading = true;
  el.innerHTML = '<p class="hint c3">Loading 3D…</p>';
  const sc = document.createElement('script');
  sc.src = THREE_URL;
  sc.onload = () => start3D(el);
  sc.onerror = () =>
    (el.innerHTML =
      '<p class="hint c3">3D could not load (no internet?). The flat picture still shows everything.</p>');
  document.head.appendChild(sc);
}
function start3D(el) {
  if (!window.THREE) return;
  if (!V3.ready) {
    const T = THREE,
      r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputColorSpace = T.SRGBColorSpace;
    r.toneMapping = T.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true;
    r.shadowMap.type = T.PCFSoftShadowMap;
    const sc = new T.Scene();
    sc.background = new T.Color('#e9e7e2');
    const cam = new T.PerspectiveCamera(32, 1, 10, 60000);
    sc.add(new T.HemisphereLight(0xffffff, 0xcfc6b8, 1.5));
    const sun = new T.DirectionalLight(0xfff4e6, 2.4);
    sun.position.set(-2600, 4200, 3600);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sc.add(sun, sun.target);
    const fill = new T.DirectionalLight(0xe6eeff, 0.6);
    fill.position.set(3000, 1500, 2500);
    sc.add(fill);
    Object.assign(V3, { T, r, sc, cam, sun, ready: true, root: null });
    el.innerHTML = '';
    el.appendChild(r.domElement);
    controls3D(r.domElement);
    new ResizeObserver(() => draw3D()).observe(el);
  } else if (!el.contains(V3.r.domElement)) {
    el.innerHTML = '';
    el.appendChild(V3.r.domElement);
  }
  build3D();
}

/* ---------- textures, made once ---------- */
function canvasTex(w, h, paint, normal) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new V3.T.CanvasTexture(c);
  t.wrapS = t.wrapT = V3.T.RepeatWrapping;
  if (!normal) t.colorSpace = V3.T.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function woodTex(k) {
  if (V3.tex['w' + k]) return V3.tex['w' + k];
  const m = MATS[k];
  const t = canvasTex(256, 1024, (g, w, h) => {
    g.fillStyle = m.wood;
    g.fillRect(0, 0, w, h);
    const r = prng(k.length * 97 + 7);
    if (m.raw && !m.grain) {
      // raw MDF: fine, even speckle
      for (let i = 0; i < 5000; i++) {
        g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)';
        g.fillRect(r() * w, r() * h, 1.5, 1.5);
      }
      return;
    }
    for (let i = 0; i < 70; i++) {
      const x = r() * w,
        a = (m.ply ? 0.05 : 0.1) + r() * (m.ply ? 0.06 : 0.14);
      g.strokeStyle = m.grain;
      g.globalAlpha = a;
      g.lineWidth = 0.6 + r() * 2.2;
      g.beginPath();
      g.moveTo(x, 0);
      g.bezierCurveTo(x + (r() - 0.5) * 30, h * 0.33, x + (r() - 0.5) * 30, h * 0.66, x + (r() - 0.5) * 16, h);
      g.stroke();
    }
    g.globalAlpha = 1;
  });
  return (V3.tex['w' + k] = t);
}
/* flutes as a normal map: one rounded flute across the width of the canvas */
function fluteTex(dir) {
  const key = 'fl' + dir;
  if (V3.tex[key]) return V3.tex[key];
  const N = 64,
    t = canvasTex(
      dir === 'v' ? N : 4,
      dir === 'v' ? 4 : N,
      (g, w, h) => {
        for (let i = 0; i < N; i++) {
          const u = (i + 0.5) / N,
            s = Math.cos(u * Math.PI) * 0.85, // slope across the flute: left side faces left, right side faces right
            nx = -s,
            nz = Math.sqrt(Math.max(0, 1 - nx * nx));
          const col = `rgb(${Math.round((nx * 0.5 + 0.5) * 255)},128,${Math.round((nz * 0.5 + 0.5) * 255)})`;
          g.fillStyle =
            dir === 'v' ? col : `rgb(128,${Math.round((-nx * 0.5 + 0.5) * 255)},${Math.round((nz * 0.5 + 0.5) * 255)})`;
          if (dir === 'v') g.fillRect(i, 0, 1, h);
          else g.fillRect(0, i, w, 1);
        }
      },
      true
    );
  return (V3.tex[key] = t);
}
/* grooves as a normal map: flat, with one narrow V across the canvas */
function grooveTex(dir) {
  const key = 'gr' + dir;
  if (V3.tex[key]) return V3.tex[key];
  const N = 64,
    t = canvasTex(
      dir === 'v' ? N : 4,
      dir === 'v' ? 4 : N,
      (g, w, h) => {
        for (let i = 0; i < N; i++) {
          const u = i - N / 2,
            nx = Math.abs(u) <= 2 ? (u < 0 ? 0.7 : -0.7) : 0,
            nz = Math.sqrt(1 - nx * nx);
          g.fillStyle =
            dir === 'v'
              ? `rgb(${Math.round((nx * 0.5 + 0.5) * 255)},128,${Math.round((nz * 0.5 + 0.5) * 255)})`
              : `rgb(128,${Math.round((-nx * 0.5 + 0.5) * 255)},${Math.round((nz * 0.5 + 0.5) * 255)})`;
          if (dir === 'v') g.fillRect(i, 0, 1, h);
          else g.fillRect(0, i, w, 1);
        }
      },
      true
    );
  return (V3.tex[key] = t);
}
function matFor(lk, f) {
  const T = V3.T,
    m = MATS[lk.mat],
    o = { roughness: 0.62, metalness: 0 };
  if (m.paint) o.color = new T.Color(colHex(lk.col));
  else if (m.glass) return null;
  else {
    const t = woodTex(lk.mat).clone();
    t.needsUpdate = true;
    t.repeat.set(f.w / 260, f.h / 1000);
    o.map = t;
    o.roughness = m.raw ? 0.85 : m.ply ? 0.6 : 0.5;
  }
  if (lk.style === 'fluted' || lk.style === 'grooves') {
    const gr = lk.style === 'grooves',
      p = gr ? S.flute.gpitch : S.flute.pitch,
      n = (gr ? grooveTex : fluteTex)(S.flute.dir).clone();
    n.needsUpdate = true;
    if (S.flute.dir === 'v') n.repeat.set(f.w / p, 1);
    else n.repeat.set(1, f.h / p);
    o.normalMap = n;
    o.normalScale = new T.Vector2(gr ? 2 : 1.4, gr ? 2 : 1.4);
  }
  // a scalloped front is an extruded outline whose texture coordinates are millimetres
  if (lk.style === 'scallop' && o.map) {
    o.map.repeat.set(1 / 260, 1 / 1000);
  }
  return new T.MeshStandardMaterial(o);
}

/* ---------- the scene ---------- */
const DEPTH = { pax: 580, metod: { base: 600, high: 600, wall: 370 }, besta: 420 };
function build3D() {
  if (!V3.ready) return;
  const T = V3.T,
    L = layout();
  if (V3.root) {
    V3.sc.remove(V3.root);
    V3.root.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.dispose) o.material.dispose();
    });
  }
  const root = new T.Group();
  V3.root = root;
  V3.meshes = [];
  const box = (w, h, d, mat, x, y, z, cast = true) => {
    const ms = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    ms.position.set(x, y, z);
    ms.castShadow = cast;
    ms.receiveShadow = true;
    root.add(ms);
    return ms;
  };
  const white = new T.MeshStandardMaterial({ color: '#f2f1ec', roughness: 0.7 }),
    inner = new T.MeshStandardMaterial({ color: '#e6e4dd', roughness: 0.8 });
  // floor and wall
  const W = L.W,
    floor = new T.Mesh(
      new T.PlaneGeometry(W + 6000, 6000),
      new T.MeshStandardMaterial({ color: '#d8cfc1', roughness: 0.9 })
    );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(W / 2, 0, 1500);
  floor.receiveShadow = true;
  root.add(floor);
  const wall = new T.Mesh(
    new T.PlaneGeometry(W + 6000, 4000),
    new T.MeshStandardMaterial({ color: '#efece6', roughness: 0.95 })
  );
  wall.position.set(W / 2, 2000, -(S.sys === 'metod' ? 600 : S.sys === 'besta' ? 420 : 580) - 2);
  wall.receiveShadow = true;
  root.add(wall);
  // the IKEA boxes: open at the front, so glass and open shelves show the inside
  L.cabs.forEach(p => {
    const d = S.sys === 'metod' ? DEPTH.metod[p.c.kind] : DEPTH[S.sys],
      t = 16,
      z0 = -d;
    box(t, p.h, d, white, p.x + t / 2, p.y + p.h / 2, z0 + d / 2);
    box(t, p.h, d, white, p.x + p.w - t / 2, p.y + p.h / 2, z0 + d / 2);
    box(p.w, t, d, white, p.x + p.w / 2, p.y + t / 2, z0 + d / 2);
    box(p.w, t, d, white, p.x + p.w / 2, p.y + p.h - t / 2, z0 + d / 2);
    box(p.w, p.h, 4, inner, p.x + p.w / 2, p.y + p.h / 2, z0 + 2, false);
    const n = Math.max(1, Math.round(p.h / 380));
    for (let k = 1; k < n; k++)
      box(p.w - 2 * t, t, d - 30, white, p.x + p.w / 2, p.y + (k * p.h) / n, z0 + (d - 30) / 2, false);
  });
  if (S.sys === 'metod') {
    const bases = L.cabs.filter(p => p.c.kind !== 'wall');
    if (bases.length) {
      const a = Math.min(...bases.map(p => p.x)),
        b = Math.max(...bases.map(p => p.x + p.w));
      box(
        b - a,
        L.plinth - 10,
        18,
        new T.MeshStandardMaterial({ color: shade(faceHex(lookOf(null)), -0.3), roughness: 0.7 }),
        (a + b) / 2,
        (L.plinth - 10) / 2,
        -40
      );
      const tops = L.cabs.filter(p => p.c.kind === 'base');
      if (tops.length) {
        const a2 = Math.min(...tops.map(p => p.x)),
          b2 = Math.max(...tops.map(p => p.x + p.w));
        box(
          b2 - a2 + 20,
          40,
          640,
          new T.MeshStandardMaterial({ color: '#cfc8bb', roughness: 0.45 }),
          (a2 + b2) / 2,
          920,
          -600 + 320 + 20
        );
      }
    }
  }
  if (S.sys === 'besta') {
    const leg = new T.MeshStandardMaterial({ color: '#8f8f8a', roughness: 0.4, metalness: 0.6 });
    L.cabs.forEach(p => {
      [p.x + 52, p.x + p.w - 52].forEach(x => {
        const c = new T.Mesh(new T.CylinderGeometry(12, 12, L.plinth, 16), leg);
        c.position.set(x, L.plinth / 2, -60);
        root.add(c);
      });
    });
  }
  // the fronts
  const FT = 19,
    hcache = {};
  L.fronts.forEach(f => {
    const lk = lookOf(f),
      m = MATS[lk.mat],
      cx = f.x + f.w / 2,
      cy = f.y + f.h / 2,
      cz = FT / 2 + 1;
    let hit;
    if (m.glass) {
      const fr = 22,
        fm = new T.MeshStandardMaterial({
          color: GFRAME[S.gframe].hex,
          roughness: S.gframe === 'oak' ? 0.5 : 0.35,
          metalness: S.gframe === 'oak' ? 0 : 0.6
        });
      box(f.w, fr, FT, fm, cx, f.y + f.h - fr / 2, cz);
      box(f.w, fr, FT, fm, cx, f.y + fr / 2, cz);
      box(fr, f.h - 2 * fr, FT, fm, f.x + fr / 2, cy, cz);
      box(fr, f.h - 2 * fr, FT, fm, f.x + f.w - fr / 2, cy, cz);
      const n = fluteTex(S.flute.dir).clone();
      n.needsUpdate = true;
      if (S.flute.dir === 'v') n.repeat.set((f.w - 2 * fr) / S.flute.pitch, 1);
      else n.repeat.set(1, (f.h - 2 * fr) / S.flute.pitch);
      const gm = new T.MeshStandardMaterial({
        color: '#dfe9e5',
        roughness: 0.18,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55,
        normalMap: n,
        normalScale: new T.Vector2(2, 2)
      });
      hit = box(f.w - 2 * fr, f.h - 2 * fr, 6, gm, cx, cy, cz, false);
    } else if (lk.style === 'scallop') {
      const sc = scallops(f.w),
        sh = new T.Shape(),
        hw = f.w / 2,
        hh = f.h / 2;
      sh.moveTo(-hw, -hh);
      sh.lineTo(hw, -hh);
      sh.lineTo(hw, hh - sc.d);
      for (let i = sc.n - 1; i >= 0; i--)
        sh.quadraticCurveTo(-hw + (i + 0.5) * sc.sw, hh + sc.d, -hw + i * sc.sw, hh - sc.d);
      sh.lineTo(-hw, -hh);
      const geo = new T.ExtrudeGeometry(sh, { depth: FT, bevelEnabled: false, curveSegments: 10 });
      geo.translate(0, 0, -FT / 2);
      hit = new T.Mesh(geo, matFor(lk, f));
      hit.position.set(cx, cy, cz);
      hit.castShadow = hit.receiveShadow = true;
      root.add(hit);
    } else hit = box(f.w, f.h, FT, matFor(lk, f), cx, cy, cz);
    hit.userData.fid = f.id;
    V3.meshes.push(hit);
    if (S.sel === f.id) {
      // the selected front: a crisp blue outline just in front of it
      const sel = new T.LineSegments(
        new T.EdgesGeometry(new T.BoxGeometry(f.w + 6, f.h + 6, FT + 4)),
        new T.LineBasicMaterial({ color: '#3446d6' })
      );
      sel.position.set(cx, cy, cz);
      root.add(sel);
      [-1, 1].forEach(sx =>
        [-1, 1].forEach(sy => {
          const k = new T.Mesh(new T.BoxGeometry(sx ? 10 : 10, 10, 4), new T.MeshBasicMaterial({ color: '#3446d6' }));
          k.position.set(cx + sx * (f.w / 2 + 3), cy + sy * (f.h / 2 + 3), FT + 4);
          root.add(k);
        })
      );
    }
    handle3D(f, lk, root, hcache, FT);
  });
  V3.sc.add(root);
  // the sun's shadow covers the whole row
  const sh = V3.sun.shadow.camera,
    R = Math.max(W, L.H) * 0.8 + 800;
  Object.assign(sh, { left: -R, right: R, top: R, bottom: -R, near: 100, far: 20000 });
  sh.updateProjectionMatrix();
  V3.sun.target.position.set(W / 2, L.H / 2, 0);
  V3.sun.position.set(W / 2 - 2600, 4200, 3600);
  V3.L = L;
  draw3D();
}
function handle3D(f, lk, root, cache, FT) {
  if (S.handle === 'push') return;
  const T = V3.T,
    P = handlePos(f),
    hex = handleHex(lk),
    mk =
      cache[hex] ||
      (cache[hex] = new T.MeshStandardMaterial({
        color: hex,
        roughness: S.hfin === 'oak' || S.hfin === 'match' ? 0.55 : 0.3,
        metalness: S.hfin === 'brass' || S.hfin === 'steel' ? 0.85 : 0.1
      })),
    z = FT + 1;
  const add = (geo, x, y, zz, rx, rz) => {
    const ms = new T.Mesh(geo, mk);
    ms.position.set(x, y, zz);
    if (rx) ms.rotation.x = rx;
    if (rz) ms.rotation.z = rz;
    ms.castShadow = true;
    root.add(ms);
  };
  if (S.handle === 'knob') {
    add(new T.CylinderGeometry(6, 6, 18, 16), P.x, P.y, z + 9, Math.PI / 2);
    add(new T.SphereGeometry(16, 24, 16), P.x, P.y, z + 26);
  } else if (S.handle === 'bar') {
    add(new T.CylinderGeometry(6, 6, 160, 16), P.x, P.y, z + 28, 0, P.vert ? 0 : Math.PI / 2);
    [-64, 64].forEach(d =>
      add(new T.CylinderGeometry(4, 4, 28, 12), P.vert ? P.x : P.x + d, P.vert ? P.y + d : P.y, z + 14, Math.PI / 2)
    );
  } else if (S.handle === 'tab') {
    const x = f.kind === 'drawer' ? P.x : f.hinge === 'L' ? f.x + f.w + 4 : f.x - 4,
      y = f.kind === 'drawer' ? f.y + f.h + 4 : P.y;
    add(new T.BoxGeometry(f.kind === 'drawer' ? 44 : 22, f.kind === 'drawer' ? 22 : 44, 4), x, y, z + 2);
  } else if (S.handle === 'grip') {
    const dark = new T.MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.9 }),
      g = new T.Mesh(new T.BoxGeometry(f.kind === 'drawer' ? 90 : 14, f.kind === 'drawer' ? 14 : 110, 3), dark);
    g.position.set(
      f.kind === 'drawer' ? P.x : f.hinge === 'L' ? f.x + f.w - 7 : f.x + 7,
      f.kind === 'drawer' ? f.y + f.h - 7 : P.y,
      z + 0.5
    );
    root.add(g);
  }
}

/* ---------- camera, turning and tapping ---------- */
function draw3D() {
  if (!V3.ready || !V3.L) return;
  const el = V3.r.domElement.parentElement;
  if (!el || !el.clientWidth) return;
  const w = el.clientWidth,
    h = el.clientHeight;
  V3.r.setSize(w, h, false);
  V3.r.domElement.style.width = w + 'px';
  V3.r.domElement.style.height = h + 'px';
  const L = V3.L,
    cam = V3.cam,
    tgt = new V3.T.Vector3(L.W / 2, Math.max(L.H, 900) / 2, 0);
  cam.aspect = w / h;
  const span = Math.max(L.W / cam.aspect, Math.max(L.H, 900)) * 1.25,
    dist = (span / 2 / Math.tan((cam.fov * Math.PI) / 360)) * V3.zoom;
  cam.position.set(
    tgt.x + Math.sin(V3.yaw) * Math.cos(V3.pitch) * dist,
    tgt.y + Math.sin(V3.pitch) * dist,
    Math.cos(V3.yaw) * Math.cos(V3.pitch) * dist
  );
  cam.lookAt(tgt);
  cam.updateProjectionMatrix();
  V3.r.render(V3.sc, cam);
}
function controls3D(cv) {
  const pts = new Map();
  let moved = 0,
    pinch = 0;
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    cv.setPointerCapture(e.pointerId);
    moved = 0;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });
  cv.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x,
      dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()],
        d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) V3.zoom = Math.max(0.35, Math.min(2.2, V3.zoom * (pinch / d)));
      pinch = d;
    } else {
      V3.yaw = Math.max(-1.25, Math.min(1.25, V3.yaw - dx * 0.006));
      V3.pitch = Math.max(-0.05, Math.min(0.9, V3.pitch + dy * 0.004));
    }
    draw3D();
  });
  const up = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = 0;
    if (moved < 6 && e.type === 'pointerup') tap3D(e);
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      V3.zoom = Math.max(0.35, Math.min(2.2, V3.zoom * (e.deltaY > 0 ? 1.1 : 0.9)));
      draw3D();
    },
    { passive: false }
  );
  cv.addEventListener('dblclick', () => {
    Object.assign(V3, { yaw: -0.42, pitch: 0.1, zoom: 1 });
    draw3D();
  });
}
function tap3D(e) {
  const T = V3.T,
    rc = V3.r.domElement.getBoundingClientRect(),
    v = new T.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1),
    ray = new T.Raycaster();
  ray.setFromCamera(v, V3.cam);
  const hit = ray.intersectObjects(V3.meshes, false)[0];
  selectFront(hit ? hit.object.userData.fid : null);
}
