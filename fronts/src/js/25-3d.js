/* ==== 25-3d.js ====
   The picture: one still, ray-traced render of your cabinets with the new fronts — matt paint, oak and walnut
   grain, birch and pine ply, raw MDF, flutes and grooves as real relief, fluted glass in its frame, the handles.
   three.js draws a quick first frame; three-gpu-pathtracer then traces light rays (soft shadows, light bouncing
   off the floor and between the doors) and refines the same still image over a second or two.
   The camera does not move. Tap a front to select it: a drawn outline shows which one.
   If 3D can't load (no internet, no WebGL), the flat drawing from 20-draw.js is shown instead.
   three r170 and the path tracer come from jsDelivr through the import map in app.html.
*/
const V3 = { ready: false, loading: false, failed: false, tex: {}, meshes: [], gen: 0, cache: new Map() };
const PT_MAX = () => V3.max || (innerWidth <= 860 ? 140 : 320); // samples per still: enough to clear the noise

/* the stage: the last finished render as a picture, the working canvas hidden under it, the selection on top */
const STAGE3D =
  '<img class="rimg" id="rimg" alt="Your cabinets with the new fronts, in a room"><svg class="rover" id="rover" aria-hidden="true"></svg><div class="rbar" id="rbar"><i id="rbarI"></i><span id="rmsg"></span></div>';
function showShot(src, instant) {
  const im = document.getElementById('rimg');
  if (!im) return;
  im.classList.toggle('draft', !!V3.drafting);
  if (instant) im.src = src;
  else {
    const n = new Image();
    n.onload = () => {
      im.src = src;
      im.classList.remove('fresh');
      void im.offsetWidth;
      im.classList.add('fresh');
    };
    n.src = src;
  }
}
function grabShot(draft) {
  try {
    V3.drafting = draft;
    const src = V3.r.domElement.toDataURL('image/jpeg', 0.92);
    if (!draft) V3.shot = src;
    if (!draft || !V3.shot) showShot(src, draft);
    else document.getElementById('rimg').classList.add('working');
  } catch (e) {
    /* keep what is shown */
  }
}
function open3D() {
  const el = document.getElementById('pic3d');
  if (V3.ready) return start3D(el);
  if (V3.loading) return;
  V3.loading = true;
  el.innerHTML = '<p class="hint c3">Setting up the render…</p>';
  Promise.all([
    import('three'),
    import('three-gpu-pathtracer').catch(() => null),
    import('three/examples/jsm/geometries/RoundedBoxGeometry.js').catch(() => null),
    import('three/examples/jsm/utils/BufferGeometryUtils.js').catch(() => null)
  ])
    .then(([T, PT, RB, BGU]) => {
      V3.merge = BGU && BGU.mergeGeometries;
      V3.T = T;
      V3.PT = PT;
      V3.RB = RB && RB.RoundedBoxGeometry;
      start3D(el);
    })
    .catch(() => {
      V3.failed = true;
      V3.loading = false;
      render();
    });
}
/* a soft studio sky: bright from the front-left like a big window, darker below; HDR so the window lights the scene */
function envTex(T) {
  const w = 128,
    h = 64,
    d = new Float32Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = 1 - y / (h - 1), // 1 = up, 0 = down
        u = x / w,
        // the window: a soft patch up and to the front-left
        du = Math.min(Math.abs(u - 0.36), 1 - Math.abs(u - 0.36)),
        win = Math.exp(-((du / 0.08) ** 2) - ((v - 0.64) / 0.12) ** 2) * 4,
        base = v > 0.5 ? 0.85 + 0.35 * (v - 0.5) : 0.42 + 0.86 * v,
        k = (y * w + x) * 4;
      d[k] = base * 0.98 + win;
      d[k + 1] = base * 0.97 + win * 0.96;
      d[k + 2] = base * 0.94 + win * 0.9;
      d[k + 3] = 1;
    }
  const t = new T.DataTexture(d, w, h, T.RGBAFormat, T.FloatType);
  t.mapping = T.EquirectangularReflectionMapping;
  t.magFilter = t.minFilter = T.LinearFilter;
  t.needsUpdate = true;
  return t;
}
function start3D(el) {
  const T = V3.T;
  if (!T) return;
  if (!V3.ready) {
    let r;
    try {
      r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    } catch (e) {
      V3.failed = true;
      return render();
    }
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputColorSpace = T.SRGBColorSpace;
    r.toneMapping = T.NeutralToneMapping;
    r.toneMappingExposure = 0.82;
    r.shadowMap.enabled = true;
    r.shadowMap.type = T.PCFSoftShadowMap;
    const sc = new T.Scene();
    sc.background = new T.Color('#e6e7e2');
    sc.environment = envTex(T);
    const cam = new T.PerspectiveCamera(24, 1, 10, 80000);
    // a weak sun for the quick first frame's shadows; the path tracer gets most of its light from the sky
    const sun = new T.DirectionalLight(0xffeedb, 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sc.add(sun, sun.target);
    let pt = null;
    if (V3.PT && V3.PT.WebGLPathTracer)
      try {
        pt = new V3.PT.WebGLPathTracer(r);
        pt.bounces = 4;
        pt.minSamples = 1;
        pt.fadeDuration = 0;
        pt.renderDelay = 0;
        pt.filterGlossyFactor = 0.5;
        pt.renderScale = innerWidth <= 860 ? 0.75 : 1;
        if (innerWidth <= 860) pt.tiles.set(2, 2);
        // a light edge-aware denoise as the traced image goes to the screen, stronger while samples are few
        if (V3.PT.DenoiseMaterial) {
          const dn = new V3.PT.DenoiseMaterial({
            map: null,
            blending: T.NoBlending,
            transparent: true,
            premultipliedAlpha: r.getContextAttributes().premultipliedAlpha
          });
          pt.renderToCanvasCallback = (target, renderer, quad) => {
            const m = quad.material,
              n = pt.samples;
            dn.map = m.map;
            dn.opacity = m.opacity;
            dn.sigma = n < 16 ? 4 : n < 64 ? 2.5 : 1.6;
            dn.threshold = n < 16 ? 0.08 : n < 64 ? 0.04 : 0.025;
            quad.material = dn;
            const ac = renderer.autoClear;
            renderer.autoClear = false;
            quad.render(renderer);
            renderer.autoClear = ac;
            quad.material = m;
          };
        }
      } catch (e) {
        pt = null;
      }
    Object.assign(V3, { r, sc, cam, sun, pt, ready: true, loading: false, root: null });
    el.innerHTML = STAGE3D;
    el.prepend(r.domElement);
    el.addEventListener('click', tap3D);
    new ResizeObserver(() => draw3D(true)).observe(el);
  } else if (!el.contains(V3.r.domElement)) {
    el.innerHTML = STAGE3D;
    el.prepend(V3.r.domElement);
    if (V3.shot) showShot(V3.shot, true);
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
function woodTex(k, oil) {
  const tk = 'w' + k + (MATS[k].oil ? oil || 'pure' : '');
  if (V3.tex[tk]) return V3.tex[tk];
  const m = Object.assign({}, MATS[k], woodCol(k, oil));
  const t = canvasTex(256, 1024, (g, w, h) => {
    g.fillStyle = m.wood;
    g.fillRect(0, 0, w, h);
    const r = prng(k.length * 97 + 7);
    if (m.flame) {
      // pine plywood: nested flame arches with a few straight streaks between them
      for (let i = 0; i < 26; i++) {
        g.strokeStyle = m.grain;
        g.globalAlpha = 0.06 + r() * 0.06;
        g.lineWidth = 1 + r() * 2;
        const x = r() * w;
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x + (r() - 0.5) * 10, h);
        g.stroke();
      }
      [
        [w * 0.3, h * 0.05],
        [w * 0.78, h * 0.5]
      ].forEach(([cx, oy]) => {
        for (let j = 0; j < 9; j++) {
          const hw = 10 + j * 9 + r() * 4,
            top = oy + 30 + j * 30;
          g.globalAlpha = 0.22 + (j % 3) * 0.1;
          g.lineWidth = 2 + (j % 2) * 3;
          g.beginPath();
          g.moveTo(cx - hw, oy + h * 0.5);
          g.bezierCurveTo(cx - hw, top + 160, cx - hw * 0.62, top, cx, top);
          g.bezierCurveTo(cx + hw * 0.62, top, cx + hw, top + 160, cx + hw, oy + h * 0.5);
          g.stroke();
        }
      });
      g.globalAlpha = 1;
      return;
    }
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
  return (V3.tex[tk] = t);
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
function matFor(lk, f, noRelief) {
  const T = V3.T,
    m = MATS[lk.mat],
    o = { roughness: 0.52, metalness: 0 };
  // matt spray paint; hardwax oil gives wood a soft satin sheen
  if (m.paint) o.color = new T.Color(colHex(lk.col));
  else if (m.glass) return null;
  else {
    const t = woodTex(lk.mat, lk.oil).clone();
    t.needsUpdate = true;
    t.repeat.set(f.w / 260, f.h / 1000);
    o.map = t;
    o.roughness = m.raw ? 0.85 : 0.5;
    if (m.oil) Object.assign(o, { clearcoat: 0.22, clearcoatRoughness: 0.45 });
  }
  if (!noRelief && (lk.style === 'fluted' || lk.style === 'grooves')) {
    const gr = lk.style === 'grooves',
      p = gr ? S.flute.gpitch : S.flute.pitch,
      n = (gr ? grooveTex : fluteTex)(S.flute.dir).clone();
    n.needsUpdate = true;
    if (S.flute.dir === 'v') n.repeat.set(f.w / p, 1);
    else n.repeat.set(1, f.h / p);
    o.normalMap = n;
    o.normalScale = new T.Vector2(gr ? 3 : 1.4, gr ? 3 : 1.4);
  }
  return new T.MeshPhysicalMaterial(o);
}

/* the ribs of a fluted front, as one mesh centred on the front: half-rounds side by side at the chosen pitch,
   7.5 mm proud of the slab, stopping 12 mm short of the edges like a routed panel */
const FLUTE_D = 7.5;
function fluteMesh(f, mat, FT) {
  const T = V3.T,
    v = S.flute.dir === 'v',
    span = v ? f.w : f.h,
    len = (v ? f.h : f.w) - 24,
    n = Math.max(2, Math.round((span - 8) / S.flute.pitch)),
    pw = (span - 8) / n,
    parts = [];
  for (let i = 0; i < n; i++) {
    const g = new T.CylinderGeometry(pw / 2, pw / 2, len, 12, 1, true, -Math.PI / 2, Math.PI);
    g.scale(1, 1, FLUTE_D / (pw / 2)); // as deep as a routed flute
    if (!v) g.rotateZ(Math.PI / 2);
    const o = -span / 2 + 4 + pw / 2 + i * pw;
    g.translate(v ? o : 0, v ? 0 : o, FT / 2 - FLUTE_D);
    parts.push(g);
  }
  const ms = new T.Mesh(V3.merge(parts), mat);
  ms.castShadow = ms.receiveShadow = true;
  return ms;
}

/* ---------- the scene ---------- */
const DEPTH = { pax: 580, metod: { base: 600, high: 600, wall: 370 }, besta: 420 };
/* what the picture shows; the scene is only rebuilt (and traced again) when this changes */
function sceneKey() {
  return JSON.stringify([
    S.sys,
    S.cabs,
    S.fx,
    S.flip,
    S.style,
    S.mat,
    S.col,
    S.oil,
    S.handle,
    S.hfin,
    S.gframe,
    S.flute,
    S.sides,
    S.edge
  ]);
}
function build3D() {
  if (!V3.ready) return;
  const key = sceneKey();
  if (key === V3.key && V3.L) return overlay3D();
  V3.key = key;
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
  // fronts and side panels with their real edge: a 2 mm round, or a small chamfer
  const rbox = (w, h, d, mat, x, y, z) => {
    if (!V3.RB) return box(w, h, d, mat, x, y, z);
    const ch = S.edge === 'chamfer',
      ms = new T.Mesh(new V3.RB(w, h, d, ch ? 1 : 3, ch ? 3.5 : 2.5), mat);
    ms.position.set(x, y, z);
    ms.castShadow = ms.receiveShadow = true;
    root.add(ms);
    return ms;
  };
  const white = new T.MeshStandardMaterial({ color: '#f2f1ec', roughness: 0.7 }),
    inner = new T.MeshStandardMaterial({ color: '#e6e4dd', roughness: 0.8 });
  const W = L.W;
  room3D(T, root, L, box);
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
  // side panels, flush with the front of the fronts
  L.sides.forEach(sd => {
    const lk = sideLook();
    rbox(SIDE_T, sd.h, sd.w, matFor(lk, { w: sd.w, h: sd.h }), sd.x + SIDE_T / 2, sd.y + sd.h / 2, 20 - sd.w / 2);
  });
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
      const gm = new T.MeshPhysicalMaterial({
        color: '#eef4f1',
        roughness: 0.12,
        metalness: 0,
        transmission: 1,
        thickness: 6,
        ior: 1.5,
        normalMap: n,
        normalScale: new T.Vector2(2, 2)
      });
      hit = box(f.w - 2 * fr, f.h - 2 * fr, 6, gm, cx, cy, cz, false);
    } else if (lk.style === 'fluted' && V3.merge) {
      // real flutes: half-round ribs on a thinner slab, so they catch the light like the routed board
      const mat = matFor(lk, f, true);
      hit = rbox(f.w, f.h, FT - FLUTE_D, mat, cx, cy, cz - FLUTE_D / 2);
      const fl = fluteMesh(f, mat, FT);
      fl.position.set(cx, cy, cz);
      fl.userData.fid = f.id;
      root.add(fl);
      V3.meshes.push(fl);
    } else hit = rbox(f.w, f.h, FT, matFor(lk, f), cx, cy, cz);
    hit.userData.fid = f.id;
    V3.meshes.push(hit);
    handle3D(f, lk, root, hcache, FT);
  });
  V3.sc.add(root);
  // the sun's shadow covers the whole row
  const sh = V3.sun.shadow.camera,
    R = Math.max(W, L.H) * 0.8 + 3200;
  Object.assign(sh, { left: -R, right: R, top: R, bottom: -R, near: 100, far: 20000 });
  sh.updateProjectionMatrix();
  // late-morning sun through the window in the left wall
  V3.sun.target.position.set(W / 2 + 400, 300, -300);
  V3.sun.position.set(W / 2 - 7200, 4600, 2600);
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
/* ---------- the room around the cabinets ----------
   Oak plank floor, a warm plaster wall with a skirting board, a side wall on the left with a tall window the
   sun comes through, a wool rug and a plant. All in millimetres, the cabinets' back against the wall (z < 0). */
function plankTex() {
  if (V3.tex.planks) return V3.tex.planks;
  // 8 planks of 180 mm side by side, 2400 mm long, ends staggered
  const t = canvasTex(512, 1024, (g, w, h) => {
    const r = prng(41),
      pw = w / 8;
    g.fillStyle = 'rgb(200,168,126)';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const off = r() * h * 0.62;
      for (let k = -1; k < 3; k++) {
        const y0 = off + k * h * 0.62,
          len = h * 0.62;
        const l = 0.92 + r() * 0.14;
        g.fillStyle = `rgb(${Math.round(203 * l)},${Math.round(170 * l)},${Math.round(128 * l)})`;
        g.fillRect(i * pw, y0, pw, len);
        g.strokeStyle = 'rgba(110,80,45,.10)';
        for (let q = 0; q < 9; q++) {
          const x = i * pw + 4 + r() * (pw - 8);
          g.lineWidth = 0.6 + r() * 1.4;
          g.beginPath();
          g.moveTo(x, y0);
          g.bezierCurveTo(x + (r() - 0.5) * 8, y0 + len * 0.3, x + (r() - 0.5) * 8, y0 + len * 0.7, x, y0 + len);
          g.stroke();
        }
        g.fillStyle = 'rgba(70,50,30,.35)';
        g.fillRect(i * pw, y0, pw, 1.5);
      }
      g.fillStyle = 'rgba(70,50,30,.4)';
      g.fillRect(i * pw, 0, 1.5, h);
    }
  });
  return (V3.tex.planks = t);
}
function plasterTex() {
  if (V3.tex.plaster) return V3.tex.plaster;
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#ece8e0';
    g.fillRect(0, 0, w, h);
    const r = prng(7);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.025)' : 'rgba(255,255,255,.05)';
      const s = 1 + r() * 3;
      g.fillRect(r() * w, r() * h, s, s);
    }
  });
  return (V3.tex.plaster = t);
}
function room3D(T, root, L, box) {
  const W = L.W,
    D = S.sys === 'metod' ? 600 : S.sys === 'besta' ? 420 : 580,
    xl = -1500, // the side wall
    xr = W + 4500,
    zf = 6500,
    wallH = 3200;
  // floor
  const ft = plankTex().clone();
  ft.needsUpdate = true;
  ft.repeat.set((xr - xl) / 1440, (zf + D) / 2400);
  const floor = new T.Mesh(
    new T.PlaneGeometry(xr - xl, zf + D),
    new T.MeshStandardMaterial({ map: ft, roughness: 0.55, color: '#ffffff' })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((xl + xr) / 2, 0, (zf - D) / 2);
  floor.receiveShadow = true;
  root.add(floor);
  // back wall and skirting
  const pt = plasterTex().clone();
  pt.needsUpdate = true;
  pt.repeat.set((xr - xl) / 900, wallH / 900);
  const plaster = new T.MeshStandardMaterial({ map: pt, roughness: 0.95 });
  const back = new T.Mesh(new T.PlaneGeometry(xr - xl, wallH), plaster);
  back.position.set((xl + xr) / 2, wallH / 2, -D - 2);
  back.receiveShadow = true;
  root.add(back);
  const skirt = new T.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.6 });
  box(xr - xl, 80, 14, skirt, (xl + xr) / 2, 40, -D + 5);
  // side wall with a tall window (the opening lets the sun and the sky in)
  const t = 140,
    w0 = 700,
    w1 = 2300, // window from z = 700 to 2300
    y0 = 650,
    y1 = 2550;
  const side = (z0, z1, ya, yb) => {
    const ms = box(t, yb - ya, z1 - z0, plaster, xl - t / 2, (ya + yb) / 2, (z0 + z1) / 2);
    ms.receiveShadow = true;
  };
  side(-D - 2, w0, 0, wallH);
  side(w1, zf, 0, wallH);
  side(w0, w1, 0, y0);
  side(w0, w1, y1, wallH);
  // a slim dark steel window frame and a deep sill
  const steel = new T.MeshStandardMaterial({ color: '#2b2d2f', roughness: 0.4, metalness: 0.5 });
  box(30, y1 - y0, 30, steel, xl + 10, (y0 + y1) / 2, w0 + 15);
  box(30, y1 - y0, 30, steel, xl + 10, (y0 + y1) / 2, w1 - 15);
  box(30, 30, w1 - w0, steel, xl + 10, y1 - 15, (w0 + w1) / 2);
  box(30, 30, w1 - w0, steel, xl + 10, (y0 + y1) / 2, (w0 + w1) / 2);
  box(
    t + 60,
    30,
    w1 - w0 + 40,
    new T.MeshStandardMaterial({ color: '#d9d4ca', roughness: 0.7 }),
    xl - t / 2 + 20,
    y0 - 15,
    (w0 + w1) / 2
  );
  // the ceiling: closes the room so light comes in through the window and the open front, like an interior
  const ceil = new T.Mesh(
    new T.PlaneGeometry(xr - xl, zf + D),
    new T.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.9 })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set((xl + xr) / 2, Math.max(wallH, L.H + 350), (zf - D) / 2);
  root.add(ceil);
  // a wool rug in front of the cabinets
  const rw = Math.min(W * 0.75, 3000),
    rug = box(rw, 10, 1500, new T.MeshStandardMaterial({ color: '#cbbfa9', roughness: 1 }), W / 2, 5, 1250);
  rug.castShadow = false;
  // a plant in a stone pot, to the right of the run
  const px = W + 520,
    pz = -D + 420;
  const pot = new T.Mesh(
    new T.CylinderGeometry(190, 150, 420, 32),
    new T.MeshStandardMaterial({ color: '#d7d0c4', roughness: 0.85 })
  );
  pot.position.set(px, 210, pz);
  pot.castShadow = pot.receiveShadow = true;
  root.add(pot);
  const soil = new T.Mesh(
    new T.CylinderGeometry(175, 175, 10, 24),
    new T.MeshStandardMaterial({ color: '#3b2f25', roughness: 1 })
  );
  soil.position.set(px, 412, pz);
  root.add(soil);
  const leaf = new T.MeshStandardMaterial({ color: '#4f6b43', roughness: 0.6, side: T.DoubleSide }),
    stem = new T.MeshStandardMaterial({ color: '#6b5a3e', roughness: 0.8 }),
    r = prng(5);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + r() * 0.5,
      tilt = 0.35 + r() * 0.5,
      len = 520 + r() * 420,
      base = new T.Vector3(px, 415, pz),
      dir = new T.Vector3(Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt)),
      tip = base.clone().addScaledVector(dir, len);
    const st = new T.Mesh(new T.CylinderGeometry(5, 7, len, 6), stem);
    st.position.copy(base).addScaledVector(dir, len / 2);
    st.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    root.add(st);
    const lf = new T.Mesh(new T.SphereGeometry(1, 16, 10), leaf);
    lf.scale.set(70 + r() * 35, 230 + r() * 110, 9);
    lf.position.copy(tip);
    lf.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    lf.rotateY(r() * Math.PI);
    lf.castShadow = true;
    root.add(lf);
  }
}

/* the fixed camera: a little to the left and above, looking at the middle of the run, everything in frame */
function draw3D(resized) {
  if (!V3.ready || !V3.L) return;
  const el = V3.r.domElement.parentElement;
  if (!el || !el.clientWidth) return;
  const w = el.clientWidth,
    h = el.clientHeight,
    L = V3.L,
    cam = V3.cam,
    T = V3.T;
  V3.r.setSize(w, h, false);
  V3.r.domElement.style.width = w + 'px';
  V3.r.domElement.style.height = h + 'px';
  const H = Math.max(L.H, 900),
    tgt = new T.Vector3((L.W + 200) / 2, H / 2 + 60, 0),
    yaw = -0.2,
    pitch = 0; // level camera: verticals stay straight, like an architectural photo
  cam.aspect = w / h;
  const span = Math.max((L.W + 1700) / cam.aspect, H + 500) * 1.08,
    dist = span / 2 / Math.tan((cam.fov * Math.PI) / 360);
  cam.position.set(
    tgt.x + Math.sin(yaw) * Math.cos(pitch) * dist,
    tgt.y + Math.sin(pitch) * dist,
    Math.cos(yaw) * Math.cos(pitch) * dist
  );
  cam.lookAt(tgt);
  cam.updateProjectionMatrix();
  overlay3D();
  // a design already rendered at this size shows straight away
  const ck = V3.key + '|' + w + 'x' + h;
  if (V3.cache.has(ck)) {
    V3.gen++;
    V3.drafting = false;
    V3.shot = V3.cache.get(ck);
    showShot(V3.shot, true);
    document.getElementById('rimg').classList.remove('working', 'draft');
    return msg3D('');
  }
  if (!V3.pt) {
    V3.r.render(V3.sc, cam);
    grabShot(false);
    keepShot(ck);
    return msg3D('');
  }
  if (V3.ptScene !== V3.key) {
    msg3D('Rendering');
    // a quick first frame, shown soft until the traced one is ready
    V3.r.render(V3.sc, cam);
    grabShot(true);
    try {
      V3.pt.setScene(V3.sc, cam);
    } catch (e) {
      V3.pt = null;
      V3.r.render(V3.sc, cam);
      grabShot(false);
      return msg3D('');
    }
    V3.ptScene = V3.key;
  } else V3.pt.updateCamera();
  trace3D(ck);
}
/* finished renders, kept for this visit (the last 16) */
function keepShot(ck) {
  if (!V3.shot) return;
  V3.cache.set(ck, V3.shot);
  if (V3.cache.size > 16) V3.cache.delete(V3.cache.keys().next().value);
}
/* refine the still: one path-traced sample per frame until it is clean, then stop */
function trace3D(ck) {
  const g = ++V3.gen,
    pt = V3.pt,
    max = PT_MAX();
  const step = () => {
    if (g !== V3.gen || !V3.r.domElement.isConnected) return;
    try {
      // a few samples per frame while the picture is out of sight
      for (let k = 0; k < 2; k++) pt.renderSample();
    } catch (e) {
      V3.pt = null;
      V3.r.render(V3.sc, V3.cam);
      grabShot(false);
      return msg3D('');
    }
    const n = Math.floor(pt.samples);
    if (n < max) {
      msg3D('Rendering', n / max);
      requestAnimationFrame(step);
    } else {
      grabShot(false);
      keepShot(ck);
      document.getElementById('rimg').classList.remove('working', 'draft');
      msg3D('');
    }
  };
  requestAnimationFrame(step);
}
function msg3D(t, f) {
  const b = document.getElementById('rbar');
  if (!b) return;
  b.hidden = !t;
  document.getElementById('rmsg').textContent = t;
  document.getElementById('rbarI').style.width = Math.round((f || 0.02) * 100) + '%';
}
/* on top of the render: the outline of the selected front, at its place in the picture */
function overlay3D() {
  const svg = document.getElementById('rover');
  if (!svg) return;
  const T = V3.T,
    cam = V3.cam,
    el = V3.r.domElement,
    w = el.clientWidth,
    h = el.clientHeight,
    P = (x, y, z) => {
      const v = new T.Vector3(x, y, z).project(cam);
      return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
    };
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  let o = '';
  const f = S.sel && V3.L.fronts.find(x => x.id === S.sel);
  if (f) {
    const z = 21,
      pts = [
        P(f.x - 4, f.y - 4, z),
        P(f.x + f.w + 4, f.y - 4, z),
        P(f.x + f.w + 4, f.y + f.h + 4, z),
        P(f.x - 4, f.y + f.h + 4, z)
      ];
    o += `<polygon points="${pts.map(p => p.join(',')).join(' ')}" class="osel"/>`;
  }
  svg.innerHTML = o;
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
