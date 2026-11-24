/* ==== 25-3d.js ====
   The picture: your cabinets with the new fronts, standing in a room — instantly, on any phone.
   The trick: the empty room (oak floor, plaster wall, ceiling, a tall window on the left, a rug) was ray-traced once
   ahead of time (tools/prerender.js) and ships as a picture, together with the light of that room as an HDR panorama.
   For your design only the cabinets are drawn, with quick hacks that make them sit in the photo:
     - they are lit by the room's own light (the panorama) and by the sun through the window, which also throws
       the window's shadow over the fronts,
     - the sun patch on the floor and wall is added on top of the room picture, with your cabinets' shadows in it,
     - soft contact shadows darken the floor and wall where the cabinets stand,
     - rounded or chamfered edges, real flute ribs, a plant beside the run.
   The camera never moves; the picture is cropped around your cabinets. Tap a front to select it.
   Without WebGL the flat drawing from 20-draw.js is shown instead.
   Open the page with #prerender to make the room pictures again (see tools/prerender.js).
*/
const V3 = { ready: false, loading: false, failed: false, tex: {}, meshes: [] };
/* the room: millimetres; the back wall is the plane z = 0, the floor y = 0, the run of cabinets is centred on x = 0 */
const ROOM = {
  W: 1280, // the pre-rendered picture
  H: 800,
  cam: [-300, 1300, 7600], // level camera, looking straight at the wall
  fov: 36,
  wallL: -3200, // the side wall with the window
  win: [1000, 2600, 650, 2550], // window: z from, z to, y from, y to
  ceil: 2750,
  envAt: [0, 1150, 1000], // where the light panorama was taken
  sun: [-8200, 2300, 4300], // sun direction (from): low morning sun through the window, across the run
  exposure: 0.82
};
const ROOM_BG = /*@ROOMBG@*/ '';
const ROOM_ENV = /*@ROOMENV@*/ '';

function open3D() {
  const el = document.getElementById('pic3d');
  if (V3.ready) return start3D(el);
  if (V3.loading) return;
  V3.loading = true;
  const pre = location.hash === '#prerender';
  Promise.all([
    import('three'),
    pre ? import('three-gpu-pathtracer') : null,
    import('three/examples/jsm/geometries/RoundedBoxGeometry.js').catch(() => null),
    import('three/examples/jsm/utils/BufferGeometryUtils.js').catch(() => null)
  ])
    .then(([T, PT, RB, BGU]) => {
      Object.assign(V3, { T, PT, RB: RB && RB.RoundedBoxGeometry, merge: BGU && BGU.mergeGeometries });
      if (pre) return prerenderRoom();
      return loadRoom().then(() => start3D(el));
    })
    .catch(() => {
      V3.failed = true;
      V3.loading = false;
      render();
    });
}
/* the two pictures that come with the page: the room (JPEG) and its light (RGBE in a PNG) */
function loadRoom() {
  const T = V3.T,
    img = src =>
      new Promise((ok, no) => {
        const im = new Image();
        im.onload = () => ok(im);
        im.onerror = no;
        im.src = src;
      });
  if (!ROOM_BG || !ROOM_ENV) return Promise.reject(new Error('no room pictures'));
  return Promise.all([img(ROOM_BG), img(ROOM_ENV)]).then(([bg, env]) => {
    const t = new T.Texture(bg);
    t.colorSpace = T.NoColorSpace; // drawn as it is: the picture is already finished
    t.needsUpdate = true;
    V3.bgTex = t;
    // RGBE → linear HDR panorama
    const c = document.createElement('canvas');
    c.width = env.width;
    c.height = env.height;
    const g = c.getContext('2d');
    g.drawImage(env, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data,
      f = new Float32Array(c.width * c.height * 4);
    // rows are stored top-down; a data texture starts at the bottom
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4,
          o = ((c.height - 1 - y) * c.width + x) * 4,
          e = d[i + 3] ? Math.pow(2, d[i + 3] - 136) : 0;
        f[o] = d[i] * e;
        f[o + 1] = d[i + 1] * e;
        f[o + 2] = d[i + 2] * e;
        f[o + 3] = 1;
      }
    const et = new T.DataTexture(f, c.width, c.height, T.RGBAFormat, T.FloatType);
    et.mapping = T.EquirectangularReflectionMapping;
    et.magFilter = et.minFilter = T.LinearFilter;
    et.needsUpdate = true;
    V3.envTex = et;
  });
}

/* ---------- the live picture ---------- */
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
    r.toneMappingExposure = ROOM.exposure;
    r.shadowMap.enabled = true;
    r.shadowMap.type = T.PCFSoftShadowMap;
    const sc = new T.Scene(),
      pm = new T.PMREMGenerator(r);
    sc.environment = pm.fromEquirectangular(V3.envTex).texture;
    sc.environmentIntensity = 1.35; // the room's light on the cabinets, a touch brighter than the walls
    const cam = new T.PerspectiveCamera(ROOM.fov, ROOM.W / ROOM.H, 20, 60000);
    cam.position.set(...ROOM.cam);
    cam.lookAt(ROOM.cam[0], ROOM.cam[1], 0);
    // the sun through the window: lights the fronts and throws the window's shadow on them
    const sun = new T.DirectionalLight(0xfff0e0, 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 2;
    sun.shadow.radius = 4;
    sun.position.set(...ROOM.sun);
    sun.target.position.set(0, 0, 0);
    Object.assign(sun.shadow.camera, { left: -7000, right: 7000, top: 7000, bottom: -7000, near: 100, far: 40000 });
    sun.shadow.camera.updateProjectionMatrix();
    sc.add(sun, sun.target);
    roomLive(T, sc);
    // the room picture behind everything, cropped like the camera
    const bgSc = new T.Scene(),
      bgCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1),
      bgMat = new T.ShaderMaterial({
        uniforms: { map: { value: V3.bgTex }, crop: { value: new T.Vector4(0, 0, 1, 1) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader:
          'uniform sampler2D map; uniform vec4 crop; varying vec2 vUv; void main(){ gl_FragColor = texture2D(map, crop.xy + vUv * crop.zw); }',
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      });
    bgSc.add(new T.Mesh(new T.PlaneGeometry(2, 2), bgMat));
    Object.assign(V3, { r, sc, cam, sun, bgSc, bgCam, bgMat, ready: true, loading: false, root: null });
    el.innerHTML = '<svg class="rover" id="rover" aria-hidden="true"></svg>';
    el.prepend(r.domElement);
    el.addEventListener('click', tap3D);
    new ResizeObserver(() => draw3D()).observe(el);
  } else if (!el.contains(V3.r.domElement)) {
    el.innerHTML = '<svg class="rover" id="rover" aria-hidden="true"></svg>';
    el.prepend(V3.r.domElement);
  }
  build3D();
}

/* the parts of the room the live picture needs: the window wall (it only throws shadow), and the floor and wall
   again, invisible except for the sun patch and the contact shadows that are blended onto the room picture */
function roomLive(T, sc) {
  const hide = new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  roomWindowWall(T, sc, hide, true);
  // for the sun the room is closed: a ceiling and a far front wall, so light only comes in through the window
  const lid = new T.Mesh(new T.BoxGeometry(30000, 100, 40000), hide);
  lid.position.set(10000, ROOM.ceil + 50, 19000);
  lid.castShadow = true;
  sc.add(lid);
  // the sun patch: only the sun's light on floor and wall, added onto the picture (which has no sun)
  const add = map =>
    new T.MeshLambertMaterial({
      map,
      transparent: true,
      blending: T.AdditiveBlending,
      depthWrite: false
    });
  const ft = plankTex().clone();
  ft.needsUpdate = true;
  ft.repeat.set(12000 / 1440, 9000 / 2400);
  const floor = new T.Mesh(new T.PlaneGeometry(12000, 9000), add(ft));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.5, 4500);
  floor.receiveShadow = true;
  floor.renderOrder = 3;
  sc.add(floor);
  const wall = new T.Mesh(new T.PlaneGeometry(12000, ROOM.ceil), add(null));
  wall.position.set(0, ROOM.ceil / 2, 0.5);
  wall.receiveShadow = true;
  wall.renderOrder = 3;
  sc.add(wall);
  floor.material.color.set('#fff6ee').multiplyScalar(0.36);
  wall.material.color.set('#f2ece4').multiplyScalar(0.36);
}
/* the side wall with its window opening, as solid blocks (also used for the pre-render) */
function roomWindowWall(T, parent, mat, castOnly) {
  const [z0, z1, y0, y1] = ROOM.win,
    t = 140,
    x = ROOM.wallL - t / 2,
    zf = castOnly ? 40000 : 9000,
    add = (zA, zB, yA, yB) => {
      const m = new T.Mesh(new T.BoxGeometry(t, yB - yA, zB - zA), mat);
      m.position.set(x, (yA + yB) / 2, (zA + zB) / 2);
      m.castShadow = true;
      m.receiveShadow = !castOnly;
      parent.add(m);
    };
  add(-10, z0, 0, ROOM.ceil);
  add(z1, zf, 0, ROOM.ceil);
  add(z0, z1, 0, y0);
  add(z0, z1, y1, ROOM.ceil);
}

/* the camera is fixed; the picture is cropped around the cabinets to fill the stage */
function cropFor(L, aspect) {
  const T = V3.T,
    cam = V3.cam,
    side = S.sides === 'none' ? 0 : 20,
    x0 = -L.W / 2 - 350 - side,
    x1 = L.W / 2 + 900 + side, // room for the plant
    top = Math.max(L.H, 900) + 260;
  cam.clearViewOffset();
  cam.updateMatrixWorld();
  const P = (x, y, z) => {
    const v = new T.Vector3(x, y, z).project(cam);
    return [((v.x + 1) / 2) * ROOM.W, ((1 - v.y) / 2) * ROOM.H];
  };
  const pts = [P(x0, top, 0), P(x1, top, 0), P(x0, 0, 1600), P(x1, 0, 1600)];
  let l = Math.min(...pts.map(p => p[0])),
    r = Math.max(...pts.map(p => p[0])),
    t = Math.min(...pts.map(p => p[1])),
    b = Math.max(...pts.map(p => p[1]));
  let w = r - l,
    h = b - t;
  if (w / h > aspect) h = w / aspect;
  else w = h * aspect;
  w = Math.min(w, ROOM.W);
  h = Math.min(h, ROOM.H);
  if (w / h > aspect) w = h * aspect;
  else h = w / aspect;
  let cx = (l + r) / 2,
    cy = (t + b) / 2 + h * 0.04;
  // keep the ceiling line out of the top when there is floor to show instead
  const ceilY = P(0, ROOM.ceil - 60, 0)[1];
  cy = Math.max(cy, ceilY + h / 2);
  cx = Math.max(w / 2, Math.min(ROOM.W - w / 2, cx));
  cy = Math.max(h / 2, Math.min(ROOM.H - h / 2, cy));
  return [cx - w / 2, cy - h / 2, w, h];
}
function draw3D(tw, th) {
  if (!V3.ready || !V3.L) return;
  const el = V3.r.domElement.parentElement;
  if (!tw && (!el || !el.clientWidth)) return;
  const w = tw || el.clientWidth,
    h = th || el.clientHeight,
    r = V3.r;
  r.setSize(w, h, false);
  r.domElement.style.width = w + 'px';
  r.domElement.style.height = h + 'px';
  const [cx, cy, cw, ch] = cropFor(V3.L, w / h);
  V3.cam.aspect = ROOM.W / ROOM.H;
  V3.cam.setViewOffset(ROOM.W, ROOM.H, cx, cy, cw, ch);
  V3.cam.updateProjectionMatrix();
  // the room picture's texture coordinates run from the bottom
  V3.bgMat.uniforms.crop.value.set(cx / ROOM.W, 1 - (cy + ch) / ROOM.H, cw / ROOM.W, ch / ROOM.H);
  r.autoClear = true;
  r.render(V3.bgSc, V3.bgCam);
  r.autoClear = false;
  r.clearDepth();
  r.render(V3.sc, V3.cam);
  r.autoClear = true;
  if (!tw) {
    overlay3D();
    queueThumbs();
  }
}

/* ---------- small renders for the preset and demo cards ----------
   Made one at a time when the browser is idle: the design is built, drawn small on the same canvas, copied,
   and the main picture drawn again in the same moment (so nothing flickers). Kept for the visit and in the
   browser's storage. A card shows its drawing until its render is ready. */
const THUMB_W = 360,
  THUMB_H = 240;
V3.thumbs = new Map();
V3.thumbQ = [];
try {
  const saved = JSON.parse(localStorage.getItem('bruis-fronts-thumbs') || '{}');
  Object.entries(saved).forEach(([k, v]) => V3.thumbs.set(k, v));
} catch (e) {
  /* no storage: render them again */
}
function thumbKey(key, st) {
  return (
    key +
    '|' +
    [
      st.style || S.style,
      st.mat || S.mat,
      st.col || S.col,
      st.oil || S.oil,
      st.handle || S.handle,
      st.hfin || S.hfin,
      st.sides || 'none',
      st.edge || S.edge
    ].join('|')
  );
}
/* the card picture: the render if it is ready, otherwise the drawing; asks for the render */
function thumbHTML(key, st, svg) {
  const k = thumbKey(key, st),
    got = V3.thumbs.get(k);
  if (got) return `<img src="${got}" alt="" data-tk="${esc(k)}">`;
  if (!V3.failed && !V3.thumbQ.some(q => q.k === k)) V3.thumbQ.push({ k, st });
  return `<span class="tdraw" data-tk="${esc(k)}">${svg}</span>`;
}
function queueThumbs() {
  if (V3.thumbBusy || !V3.thumbQ.length) return;
  V3.thumbBusy = true;
  const idle = window.requestIdleCallback || (f => setTimeout(f, 120));
  idle(() => {
    V3.thumbBusy = false;
    const job = V3.thumbQ.shift();
    if (!job || V3.thumbs.has(job.k)) return queueThumbs();
    const keep = S;
    let url = '';
    try {
      S = Object.assign({}, keep, { fx: {}, sel: null, flip: {}, sides: 'none' }, job.st);
      V3.key = null;
      build3D(true);
      draw3D(THUMB_W, THUMB_H);
      url = V3.r.domElement.toDataURL('image/jpeg', 0.82);
    } catch (e) {
      url = '';
    } finally {
      S = keep;
      V3.key = null;
      build3D(true);
      draw3D();
    }
    if (url) {
      V3.thumbs.set(job.k, url);
      document.querySelectorAll('[data-tk]').forEach(el => {
        if (el.dataset.tk === job.k) el.outerHTML = `<img src="${url}" alt="" data-tk="${esc(job.k)}">`;
      });
      try {
        const o = {};
        [...V3.thumbs.entries()].slice(-24).forEach(([k, v]) => (o[k] = v));
        localStorage.setItem('bruis-fronts-thumbs', JSON.stringify(o));
      } catch (e) {
        /* storage full: they stay for this visit */
      }
    }
    queueThumbs();
  });
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

/* ---------- the cabinets ---------- */
const DEPTH = { pax: 580, metod: { base: 600, high: 600, wall: 370 }, besta: 420 };
/* what the picture shows; the cabinets are only rebuilt when this changes */
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
function build3D(noDraw) {
  if (!V3.ready) return;
  const key = sceneKey();
  if (key === V3.key && V3.L) return noDraw ? null : draw3D();
  V3.key = key;
  const T = V3.T,
    L = layout();
  if (V3.root) {
    V3.sc.remove(V3.root);
    V3.root.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.dispose && !o.material.keep) o.material.dispose();
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
    inner = new T.MeshStandardMaterial({ color: '#dedcd5', roughness: 0.8 });
  const W = L.W,
    Dmax = S.sys === 'metod' ? 600 : DEPTH[S.sys],
    dOf = c => (c.sys === 'metod' ? DEPTH.metod[c.kind] || 600 : DEPTH[c.sys] || 580),
    zfOf = {}; // where each cabinet's front plane is (wall cabinets are shallower)
  // the IKEA boxes, backs against the wall: open at the front, so glass and open shelves show the inside
  L.cabs.forEach(p => {
    const d = dOf(p.c),
      t = 16,
      z0 = -Dmax;
    zfOf[p.c.id] = d - Dmax;
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
          new T.MeshPhysicalMaterial({ color: '#d6d0c4', roughness: 0.35, clearcoat: 0.3 }),
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
        c.castShadow = true;
        root.add(c);
      });
    });
  }
  // side panels, against the wall and flush with the fronts
  L.sides.forEach(sd => {
    const lk = sideLook();
    rbox(SIDE_T, sd.h, sd.w, matFor(lk, { w: sd.w, h: sd.h }), sd.x + SIDE_T / 2, sd.y + sd.h / 2, -Dmax + sd.w / 2);
  });
  // the fronts
  const FT = 19,
    hcache = {};
  L.fronts.forEach(f => {
    const lk = lookOf(f),
      m = MATS[lk.mat],
      cx = f.x + f.w / 2,
      cy = f.y + f.h / 2,
      cz = FT / 2 + 1,
      n0 = root.children.length;
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
      const nm = fluteTex(S.flute.dir).clone();
      nm.needsUpdate = true;
      if (S.flute.dir === 'v') nm.repeat.set((f.w - 2 * fr) / S.flute.pitch, 1);
      else nm.repeat.set(1, (f.h - 2 * fr) / S.flute.pitch);
      // reeded glass, faked: a pale see-through pane that blurs the shelves behind it
      const gm = new T.MeshPhysicalMaterial({
        color: '#e4ece9',
        roughness: 0.25,
        metalness: 0,
        transparent: true,
        opacity: 0.62,
        normalMap: nm,
        normalScale: new T.Vector2(2.2, 2.2),
        clearcoat: 1,
        clearcoatRoughness: 0.1
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
    // wall cabinets are shallower: their fronts (and handles) sit further back
    const zf = zfOf[f.cab] || 0;
    if (zf) for (let i = n0; i < root.children.length; i++) root.children[i].position.z += zf;
  });
  plant3D(T, root, W + 520, -Dmax + 380);
  contact3D(T, root, L, Dmax, dOf);
  // the whole run stands centred against the back wall
  root.position.set(-W / 2, 0, Dmax);
  V3.sc.add(root);
  V3.L = L;
  if (!noDraw) draw3D();
}
/* soft contact shadows, multiplied onto the room picture: a dark band on the floor along the foot of the run,
   and a soft halo on the wall around every cabinet (light can't reach in there) */
function blurTex() {
  if (V3.tex.blur) return V3.tex.blur;
  // a tiny dark square, scaled up smoothly: a soft-edged shadow without needing a blur filter
  const s = document.createElement('canvas');
  s.width = s.height = 16;
  const sg = s.getContext('2d');
  sg.fillStyle = '#fff';
  sg.fillRect(0, 0, 16, 16);
  sg.fillStyle = '#000';
  sg.fillRect(4, 4, 8, 8);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.drawImage(s, 0, 0, 128, 128);
  const t = new V3.T.CanvasTexture(c);
  t.colorSpace = V3.T.NoColorSpace;
  return (V3.tex.blur = t);
}
function contact3D(T, root, L, Dmax, dOf) {
  const mk = strength => {
    const m = new T.ShaderMaterial({
      uniforms: { map: { value: blurTex() }, k: { value: strength } },
      vertexShader:
        'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:
        'uniform sampler2D map; uniform float k; varying vec2 vUv; void main(){ float s = texture2D(map, vUv).r; gl_FragColor = vec4(vec3(mix(1.0 - k, 1.0, s)), 1.0); }',
      transparent: true,
      depthWrite: false,
      blending: T.CustomBlending,
      blendSrc: T.ZeroFactor,
      blendDst: T.SrcColorFactor,
      toneMapped: false
    });
    return m;
  };
  // on the wall: each cabinet's outline, blown up and blurred (the 128 px texture has its dark core in the middle half)
  L.cabs.forEach(p => {
    const d = dOf(p.c),
      sw = p.w / 0.53 + d * 0.9,
      sh = p.h / 0.53 + d * 0.9,
      q = new T.Mesh(new T.PlaneGeometry(sw, sh), mk(0.34));
    q.position.set(p.x + p.w / 2, p.y + p.h / 2, -Dmax + 1);
    q.renderOrder = 2;
    root.add(q);
  });
  // on the floor: under and just in front of the run
  const floorCabs = L.cabs.filter(p => p.y < 400);
  if (floorCabs.length) {
    const a = Math.min(...floorCabs.map(p => p.x)),
      b = Math.max(...floorCabs.map(p => p.x + p.w)),
      d = Math.max(...floorCabs.map(p => dOf(p.c))),
      q = new T.Mesh(new T.PlaneGeometry((b - a) / 0.53 + 200, (d + 20) / 0.53 + 120), mk(0.38));
    q.rotation.x = -Math.PI / 2;
    q.position.set((a + b) / 2, 1, -Dmax + d / 2 + 20);
    q.renderOrder = 2;
    root.add(q);
  }
}
/* a plant in a stone pot, beside the run */
function plant3D(T, root, px, pz) {
  const pot = new T.Mesh(
    new T.CylinderGeometry(190, 150, 420, 40),
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
  const leaf = new T.MeshStandardMaterial({ color: '#4c6941', roughness: 0.55, side: T.DoubleSide }),
    stem = new T.MeshStandardMaterial({ color: '#6b5a3e', roughness: 0.8 }),
    r = prng(5);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + r() * 0.5,
      tilt = 0.3 + r() * 0.55,
      len = 520 + r() * 460,
      base = new T.Vector3(px, 415, pz),
      dir = new T.Vector3(Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt)),
      tip = base.clone().addScaledVector(dir, len);
    const st = new T.Mesh(new T.CylinderGeometry(5, 7, len, 6), stem);
    st.position.copy(base).addScaledVector(dir, len / 2);
    st.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    st.castShadow = true;
    root.add(st);
    const lf = new T.Mesh(new T.SphereGeometry(1, 20, 12), leaf);
    lf.scale.set(70 + r() * 35, 230 + r() * 110, 9);
    lf.position.copy(tip);
    lf.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    lf.rotateY(r() * Math.PI);
    lf.castShadow = true;
    root.add(lf);
  }
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

/* ---------- the pre-render (open the page with #prerender; tools/prerender.js saves the results) ----------
   Ray-traces the empty room with three-gpu-pathtracer: the picture from the fixed camera, and the light of the
   room as an HDR panorama (RGBE in a PNG) for lighting the cabinets. No sun here: the sun is added live. */
function skyTex(T) {
  const w = 256,
    h = 128,
    d = new Float32Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = 1 - y / (h - 1),
        base = v > 0.5 ? 1.0 + 0.5 * (v - 0.5) : 0.5 + 1.0 * v,
        k = (y * w + x) * 4;
      d[k] = base * 0.97;
      d[k + 1] = base * 0.98;
      d[k + 2] = base * 1.02;
      d[k + 3] = 1;
    }
  const t = new T.DataTexture(d, w, h, T.RGBAFormat, T.FloatType);
  t.mapping = T.EquirectangularReflectionMapping;
  t.magFilter = t.minFilter = T.LinearFilter;
  t.needsUpdate = true;
  return t;
}
function prerenderRoom() {
  const T = V3.T,
    PT = V3.PT,
    q = new URLSearchParams(location.search),
    spp = +q.get('spp') || 256,
    espp = +q.get('espp') || 128;
  document.body.innerHTML = '';
  const r = new T.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  r.outputColorSpace = T.SRGBColorSpace;
  r.toneMapping = T.NeutralToneMapping;
  r.toneMappingExposure = ROOM.exposure;
  r.setPixelRatio(1);
  r.setSize(ROOM.W, ROOM.H);
  document.body.appendChild(r.domElement);
  const sc = new T.Scene();
  sc.environment = sc.background = skyTex(T);
  const plaster = (() => {
    const t = plasterTex().clone();
    t.needsUpdate = true;
    t.repeat.set(14000 / 900, ROOM.ceil / 900);
    return new T.MeshStandardMaterial({ map: t, roughness: 0.95 });
  })();
  const ft = plankTex().clone();
  ft.needsUpdate = true;
  ft.repeat.set(12000 / 1440, 9000 / 2400);
  const floor = new T.Mesh(new T.PlaneGeometry(12000, 9000), new T.MeshStandardMaterial({ map: ft, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 4500);
  sc.add(floor);
  const back = new T.Mesh(new T.PlaneGeometry(14000, ROOM.ceil), plaster);
  back.position.set(0, ROOM.ceil / 2, 0);
  sc.add(back);
  const skirt = new T.Mesh(
    new T.BoxGeometry(14000, 80, 14),
    new T.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.6 })
  );
  skirt.position.set(0, 40, 7);
  sc.add(skirt);
  roomWindowWall(T, sc, plaster, false);
  const [z0, z1, y0, y1] = ROOM.win,
    xl = ROOM.wallL,
    steel = new T.MeshStandardMaterial({ color: '#2b2d2f', roughness: 0.4, metalness: 0.5 }),
    bx = (w, h, d, m, x, y, z) => {
      const ms = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      ms.position.set(x, y, z);
      sc.add(ms);
    };
  bx(30, y1 - y0, 30, steel, xl + 10, (y0 + y1) / 2, z0 + 15);
  bx(30, y1 - y0, 30, steel, xl + 10, (y0 + y1) / 2, z1 - 15);
  bx(30, 30, z1 - z0, steel, xl + 10, y1 - 15, (z0 + z1) / 2);
  bx(30, 30, z1 - z0, steel, xl + 10, (y0 + y1) / 2, (z0 + z1) / 2);
  bx(
    200,
    30,
    z1 - z0 + 40,
    new T.MeshStandardMaterial({ color: '#d9d4ca', roughness: 0.7 }),
    xl - 50,
    y0 - 15,
    (z0 + z1) / 2
  );
  const ceil = new T.Mesh(
    new T.PlaneGeometry(14000, 9000),
    new T.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.9 })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, ROOM.ceil, 4500);
  sc.add(ceil);
  bx(3200, 10, 1700, new T.MeshStandardMaterial({ color: '#cbbfa9', roughness: 1 }), 0, 5, 1500);
  const cam = new T.PerspectiveCamera(ROOM.fov, ROOM.W / ROOM.H, 20, 60000);
  cam.position.set(...ROOM.cam);
  cam.lookAt(ROOM.cam[0], ROOM.cam[1], 0);
  cam.updateMatrixWorld();
  const pt = new PT.WebGLPathTracer(r);
  pt.bounces = 6;
  pt.renderDelay = 0;
  pt.fadeDuration = 0;
  pt.minSamples = 1;
  pt.tiles.set(2, 2);
  // the last frame goes to the screen through a light edge-aware denoise
  let clean = false;
  const dn = new PT.DenoiseMaterial({ map: null, blending: T.NoBlending, transparent: true });
  pt.renderToCanvasCallback = (target, renderer, quad) => {
    const m = quad.material;
    if (clean) {
      dn.map = m.map;
      dn.opacity = 1;
      dn.sigma = 2.2;
      dn.threshold = 0.045;
      dn.kSigma = 1;
      quad.material = dn;
    }
    const ac = renderer.autoClear;
    renderer.autoClear = false;
    quad.render(renderer);
    renderer.autoClear = ac;
    quad.material = m;
  };
  const out = (window.__prerender = { status: 'room' });
  pt.setScene(sc, cam);
  const step = () => {
    pt.renderSample();
    out.samples = pt.samples;
    if (pt.samples < spp - 1) return requestAnimationFrame(step);
    if (!clean) {
      clean = true;
      return requestAnimationFrame(step);
    }
    clean = false;
    out.bg = r.domElement.toDataURL('image/jpeg', 0.86);
    // the light of the room, seen from where the cabinets stand: an HDR panorama
    out.status = 'env';
    r.setSize(256, 128);
    const ec = new PT.EquirectCamera();
    ec.position.set(...ROOM.envAt);
    ec.updateMatrixWorld();
    pt.setScene(sc, ec);
    const step2 = () => {
      pt.renderSample();
      out.samples = pt.samples;
      if (pt.samples < espp) return requestAnimationFrame(step2);
      const tg = pt.target,
        px = new Float32Array(tg.width * tg.height * 4);
      r.readRenderTargetPixels(tg, 0, 0, tg.width, tg.height, px);
      const c = document.createElement('canvas');
      c.width = tg.width;
      c.height = tg.height;
      const g = c.getContext('2d'),
        im = g.createImageData(c.width, c.height);
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++) {
          const i = ((c.height - 1 - y) * c.width + x) * 4, // the target is bottom-up
            o = (y * c.width + x) * 4,
            m = Math.max(px[i], px[i + 1], px[i + 2]);
          if (m < 1e-32) continue;
          const e = Math.ceil(Math.log2(m)),
            sc2 = Math.pow(2, -e) * 256;
          im.data[o] = Math.min(255, px[i] * sc2);
          im.data[o + 1] = Math.min(255, px[i + 1] * sc2);
          im.data[o + 2] = Math.min(255, px[i + 2] * sc2);
          im.data[o + 3] = e + 128;
        }
      g.putImageData(im, 0, 0);
      out.env = c.toDataURL('image/png');
      out.status = 'done';
    };
    requestAnimationFrame(step2);
  };
  requestAnimationFrame(step);
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
  // the selected front: the front face of its mesh, in the picture
  const ms = S.sel && V3.meshes.find(m => m.userData.fid === S.sel);
  if (ms) {
    const b = new T.Box3().setFromObject(ms),
      z = b.max.z + 2,
      pts = [
        P(b.min.x - 4, b.min.y - 4, z),
        P(b.max.x + 4, b.min.y - 4, z),
        P(b.max.x + 4, b.max.y + 4, z),
        P(b.min.x - 4, b.max.y + 4, z)
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
