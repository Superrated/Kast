/* ==== 80-3d.js ====
   The 3D view (three.js): scene, materials, meshes from G.items, camera.
*/
/* ---------- three.js version bridge ----------
   Fitted was tuned on three.js r128. Newer versions (r152+) handle colours and light strength differently;
   these settings keep the old look on any version from r128 to r159:
   - colour management off: colours like 0xE8EBE7 are used as written,
   - textures and the main 3D view marked sRGB the way each version expects (srgb(), threeOut()),
   - the old light strengths (useLegacyLights). */
if (window.THREE && THREE.ColorManagement) THREE.ColorManagement.enabled = false;
function srgb(t) {
  if (!t) return t;
  if ('colorSpace' in t && THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
  else t.encoding = THREE.sRGBEncoding;
  return t;
}
/* sRGB = true: the picture is written as sRGB (main 3D view); false: as linear (workshop boxes, as on r128) */
function threeOut(renderer, sRGB) {
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = sRGB ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  else renderer.outputEncoding = sRGB ? THREE.sRGBEncoding : THREE.LinearEncoding;
  if ('useLegacyLights' in renderer) renderer.useLegacyLights = true;
  return renderer;
}

/* ===== 3D ===== */
let T3 = null;
function texFor(fin, mc) {
  const f = Object.assign({}, FIN[fin] || FIN.ral9010);
  if (mc) {
    f.micro = true;
    f.grain = '#000000';
  }
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  const r = rng(fin.length * 7919 + fin.charCodeAt(0));
  x.fillStyle = f.base;
  x.fillRect(0, 0, 512, 512);
  if (f.kind === 'wood' || f.kind === 'ply') {
    const nl = f.kind === 'ply' ? 90 : 55;
    for (let i = 0; i < nl; i++) {
      const x0 = r() * 512;
      x.strokeStyle = f.grain;
      x.globalAlpha = 0.06 + r() * 0.28;
      x.lineWidth = 0.6 + r() * (f.kind === 'ply' ? 1.5 : 4);
      x.beginPath();
      for (let y = 0; y <= 512; y += 16) {
        const xx = x0 + Math.sin(y / 90 + i) * (f.kind === 'ply' ? 1.5 : 6);
        y ? x.lineTo(xx, y) : x.moveTo(xx, y);
      }
      x.stroke();
    }
  }
  if (f.micro) {
    for (let i = 0; i < 160; i++) {
      x.fillStyle = r() < 0.6 ? f.grain : '#fff';
      x.globalAlpha = 0.015 + r() * 0.03;
      x.beginPath();
      x.ellipse(r() * 512, r() * 512, 20 + r() * 80, 12 + r() * 50, r() * 3, 0, 7);
      x.fill();
    }
    x.globalAlpha = 0.07;
    x.strokeStyle = f.grain;
    for (let i = 0; i < 30; i++) {
      x.lineWidth = 1 + r() * 3;
      x.beginPath();
      x.arc(r() * 512, r() * 512, 30 + r() * 80, r() * 3, r() * 3 + 1.4);
      x.stroke();
    }
  } else if (f.kind === 'stone') {
    for (let i = 0; i < 400; i++) {
      x.fillStyle = f.grain;
      x.globalAlpha = 0.04 + r() * 0.1;
      x.beginPath();
      x.arc(r() * 512, r() * 512, 2 + r() * 22, 0, 7);
      x.fill();
    }
  }
  x.globalAlpha = 1;
  const id = x.getImageData(0, 0, 512, 512);
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (r() - 0.5) * (f.kind === 'plain' ? 6 : 10);
    id.data[i] += n;
    id.data[i + 1] += n;
    id.data[i + 2] += n;
  }
  x.putImageData(id, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  srgb(t);
  t.anisotropy = 4;
  return t;
}
function floorTex() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const x = c.getContext('2d');
  const r = rng(4242);
  for (let row = 0; row < 8; row++) {
    let px = -r() * 600;
    while (px < 1024) {
      const len = 300 + r() * 500;
      const l = 0.62 + r() * 0.12;
      x.fillStyle = `hsl(32,32%,${l * 72}%)`;
      x.fillRect(px, row * 128, len, 126);
      for (let k = 0; k < 10; k++) {
        x.strokeStyle = 'rgba(90,60,30,' + (0.05 + r() * 0.12) + ')';
        x.lineWidth = 1 + r() * 2;
        x.beginPath();
        const yy = row * 128 + r() * 126;
        x.moveTo(px, yy);
        x.bezierCurveTo(px + len / 3, yy + (r() - 0.5) * 10, px + (len * 2) / 3, yy + (r() - 0.5) * 10, px + len, yy);
        x.stroke();
      }
      x.fillStyle = 'rgba(40,25,10,.35)';
      x.fillRect(px + len - 2, row * 128, 2, 126);
      px += len;
    }
    x.fillStyle = 'rgba(40,25,10,.4)';
    x.fillRect(0, row * 128 + 126, 1024, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  srgb(t);
  return t;
}
/* the other walls of the room and the diagonal corner cabinets, placed around the open wall in 3D */
function others3D() {
  if (!S.proj || !T3 || ui.others3D === false) return;
  const L = pjLayout();
  if (!L) return;
  const a = L.segs[S.proj.at];
  if (!a) return;
  const toW = Pp => {
    const v = [Pp[0] - a.o[0], Pp[1] - a.o[1]];
    return [v[0] * a.d[0] + v[1] * a.d[1] - a.s0, v[0] * a.n[0] + v[1] * a.n[1] - a.w.D];
  };
  const G0 = new THREE.Group();
  G0.name = 'others';
  L.segs.forEach(g => {
    if (g.k === S.proj.at || !g.w.st) return;
    const st = g.w.st;
    let G;
    const S0 = S;
    try {
      S = st;
      G = build(st);
    } catch (e) {
      G = null;
    }
    S = S0;
    if (!G) return;
    const grp = new THREE.Group(),
      M = st.mat || {};
    G.items.forEach(it => {
      if (it.k !== 'prism') return;
      const ge = prismGeo(it.poly, it.toW, it.ext, it.grainU, it.holes);
      if (!ge) return;
      let mt;
      try {
        mt =
          it.role === 'glass' || it.role === 'led' || String(it.role).startsWith('fabric:') || it.role === 'cane'
            ? colMat('#d8dcd8', 0.6)
            : mat3(it.fin || (M[it.role] || M.carcass).fin, it.mt || (M[it.role] || M.carcass).type);
      } catch (e) {
        mt = colMat('#cccccc', 0.7);
      }
      const m = new THREE.Mesh(ge, mt);
      m.castShadow = true;
      m.receiveShadow = true;
      grp.add(m);
    });
    const O = toW([g.o[0] + g.d[0] * g.s0 + g.n[0] * g.w.D, g.o[1] + g.d[1] * g.s0 + g.n[1] * g.w.D]),
      cs = g.d[0] * a.d[0] + g.d[1] * a.d[1],
      sn = g.n[0] * a.d[0] + g.n[1] * a.d[1];
    grp.rotation.y = Math.atan2(sn, cs);
    grp.position.set(O[0], 0, O[1]);
    G0.add(grp);
  });
  L.cs.forEach((c, k) => {
    if (c.mode !== 'diag') return;
    const g = L.segs[k],
      A = L.ws[k],
      B = L.ws[k + 1];
    if (!A.st || !B.st) return;
    const poly = [[0, 0], [-c.eA, 0], [-c.eA, A.D], c.PB, c.g.P(c.sB, 0)].map(([X, Y_]) => toW(L.fr(g, X, Y_)));
    const Pl = +(B.st.skirt || {}).plinth || 90,
      hb = Math.max(600, Math.min(ceilEnd(A.st, true), ceilEnd(B.st, false)) - (+(B.st.skirt || {}).top || 40) - Pl);
    const sh = new THREE.Shape(poly.map(([X, Z]) => new THREE.Vector2(X, -Z)));
    const ge = new THREE.ExtrudeGeometry(sh, { depth: hb, bevelEnabled: false });
    ge.rotateX(-Math.PI / 2);
    ge.translate(0, Pl, 0);
    let mt;
    try {
      mt = mat3((B.st.mat.front || {}).fin, (B.st.mat.front || {}).type);
    } catch (e) {
      mt = colMat('#d9c3a0', 0.6);
    }
    const m = new THREE.Mesh(ge, mt);
    m.castShadow = true;
    m.receiveShadow = true;
    G0.add(m);
  });
  T3.root.add(G0);
  T3.req && T3.req();
}
function prismGeo(poly, toW, ext, grainU, holes) {
  const pts0 = clean(poly);
  if (pts0.length < 3) return null;
  const hs = (holes || []).map(h => clean(h)).filter(h => h.length >= 3),
    rings = [pts0, ...hs],
    pts = [].concat(...rings);
  let tris = [];
  try {
    tris = THREE.ShapeUtils.triangulateShape(
      pts0.map(p => new THREE.Vector2(p[0], p[1])),
      hs.map(h => h.map(p => new THREE.Vector2(p[0], p[1])))
    );
  } catch (e) {
    oops('3d #1', e);
  }
  const A = pts.map(p => new THREE.Vector3(...toW(p[0], p[1]))),
    E = new THREE.Vector3(...ext),
    B = A.map(v => v.clone().add(E));
  const pos = [],
    uv = [],
    U = 700,
    uvOf = p => (grainU ? [p[1] / U, p[0] / U] : [p[0] / U, p[1] / U]);
  const add = (v, t) => {
    pos.push(v.x, v.y, v.z);
    uv.push(t[0], t[1]);
  };
  tris.forEach(([a, b, c]) => {
    add(A[a], uvOf(pts[a]));
    add(A[b], uvOf(pts[b]));
    add(A[c], uvOf(pts[c]));
    add(B[a], uvOf(pts[a]));
    add(B[c], uvOf(pts[c]));
    add(B[b], uvOf(pts[b]));
  });
  const tl = E.length() / U;
  let off = 0;
  rings.forEach(rg => {
    const n = rg.length;
    for (let j = 0; j < n; j++) {
      const k = off + j,
        k2 = off + ((j + 1) % n),
        s1 = Math.hypot(pts[k2][0] - pts[k][0], pts[k2][1] - pts[k][1]) / U;
      add(A[k], [0, 0]);
      add(A[k2], [s1, 0]);
      add(B[k2], [s1, tl]);
      add(A[k], [0, 0]);
      add(B[k2], [s1, tl]);
      add(B[k], [0, tl]);
    }
    off += n;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
function init3D() {
  if (T3) return true;
  if (!window.THREE) {
    document
      .getElementById('v-3d')
      .insertAdjacentHTML(
        'beforeend',
        '<p class="docview">The 3D library could not load. The other views still work.</p>'
      );
    return false;
  }
  const host = document.getElementById('v-3d');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  threeOut(renderer, true);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(38, 1, 20, 60000);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7f70, 0.55);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0xffffff, 0.12);
  scene.add(amb);
  const sun = new THREE.DirectionalLight(0xfff1dc, 0.95);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 2;
  scene.add(sun);
  scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.3);
  scene.add(fill);
  /* soft studio light all round: gives lacquer, glass and metal something to reflect and fills the shadows */
  try {
    const pm = new THREE.PMREMGenerator(renderer),
      es = new THREE.Scene(),
      bm = v => new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v * 0.98), side: THREE.BackSide }),
      box = (w, h, d, x, y, z, v) => {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v * 0.98, v * 0.94) })
        );
        m.position.set(x, y, z);
        es.add(m);
      };
    es.add(new THREE.Mesh(new THREE.BoxGeometry(20, 12, 20), bm(0.3)));
    box(12, 0.2, 12, 0, 5.9, 0, 1.7);
    box(0.2, 5, 7, -9.8, 0.5, 1, 2.4);
    box(0.2, 3, 4, 9.8, 1, -2, 0.9);
    box(8, 4, 0.2, 0, 1, 9.8, 1.1);
    box(20, 0.2, 20, 0, -5.9, 0, 0.18);
    scene.environment = pm.fromScene(es, 0.035).texture;
    pm.dispose();
    hemi.intensity = 0.3;
    amb.intensity = 0.05;
    fill.intensity = 0.18;
  } catch (e) {
    oops('3d #2', e);
  }
  try {
    sun.shadow.mapSize.set(innerWidth > 860 ? 4096 : 2048, innerWidth > 860 ? 4096 : 2048);
    sun.shadow.radius = 3;
    renderer.setPixelRatio(Math.min(2, Math.max(innerWidth > 860 ? 1.5 : 1, window.devicePixelRatio || 1)));
  } catch (e) {
    oops('3d #3', e);
  }
  const root = new THREE.Group(),
    frontG = new THREE.Group(),
    roomG = new THREE.Group();
  scene.add(root, frontG, roomG);
  const ctl = { theta: 0.42, phi: 0.14, r: 6000, target: new THREE.Vector3() };
  T3 = {
    renderer,
    scene,
    cam,
    sun,
    fill,
    hemi,
    amb,
    root,
    frontG,
    roomG,
    ctl,
    mats: {},
    host,
    pending: false,
    framed: false
  };
  const req = () => {
    if (T3.pending) return;
    T3.pending = true;
    requestAnimationFrame(() => {
      T3.pending = false;
      place();
      renderer.render(scene, cam);
    });
  };
  T3.req = req;
  function place() {
    if (photoActive()) {
      photoCam();
      return;
    }
    const c = T3.ctl;
    cam.position.set(
      c.target.x + c.r * Math.cos(c.phi) * Math.sin(c.theta),
      c.target.y + c.r * Math.sin(c.phi),
      c.target.z + c.r * Math.cos(c.phi) * Math.cos(c.theta)
    );
    cam.lookAt(c.target);
  }
  const ro = new ResizeObserver(() => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    if (photoActive()) {
      photoLayout();
      req();
      return;
    }
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    req();
  });
  ro.observe(host);
  T3.ro = ro;
  const ptrs = new Map();
  let last = null;
  const el = renderer.domElement;
  let panBtn = false,
    vel = null,
    velRaf = 0,
    tap = null;
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('dblclick', () => {
    if (ui.iso) isoFrame();
    else camPreset('angle');
  });
  el.addEventListener('pointerdown', e => {
    cancelAnimationFrame(velRaf);
    cancelAnimationFrame(camTo.raf);
    vel = null;
    panBtn = e.pointerType === 'mouse' && (e.button === 2 || e.button === 1 || e.shiftKey);
    el.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    last = null;
    tap = ptrs.size === 1 && !panBtn ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() } : null;
  });
  el.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 7) tap = null;
    const p = ptrs.get(e.pointerId),
      dx = e.clientX - p.x,
      dy = e.clientY - p.y;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1 && panBtn) {
      const k = ctl.r * 0.0011,
        right = new THREE.Vector3(Math.cos(ctl.theta), 0, -Math.sin(ctl.theta));
      ctl.target.addScaledVector(right, -dx * k);
      ctl.target.y += dy * k;
    } else if (ptrs.size === 1) {
      ctl.theta -= dx * 0.006;
      ctl.phi = Math.max(-0.15, Math.min(1.35, ctl.phi + dy * 0.005));
      vel = { x: dx, y: dy, t: performance.now() };
    } else if (ptrs.size === 2) {
      const a = [...ptrs.values()];
      const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y),
        m = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
      if (last) {
        ctl.r = Math.max(800, Math.min(40000, (ctl.r * last.d) / d));
        const k = ctl.r * 0.0011,
          right = new THREE.Vector3(Math.cos(ctl.theta), 0, -Math.sin(ctl.theta));
        ctl.target.addScaledVector(right, -(m.x - last.m.x) * k);
        ctl.target.y += (m.y - last.m.y) * k;
      }
      last = { d, m };
    }
    req();
  });
  const up = e => {
    if (
      tap &&
      e.type === 'pointerup' &&
      tap.id === e.pointerId &&
      performance.now() - tap.t < 450 &&
      Math.hypot(e.clientX - tap.x, e.clientY - tap.y) <= 7
    ) {
      tap = null;
      try {
        pick3D(e);
      } catch (er) {
        oops('3d #4', er);
      }
    }
    tap = null;
    ptrs.delete(e.pointerId);
    last = null;
    if (!ptrs.size && vel && !panBtn && performance.now() - vel.t < 60 && Math.hypot(vel.x, vel.y) > 3) {
      let vx = vel.x,
        vy = vel.y;
      const glide = () => {
        vx *= 0.9;
        vy *= 0.9;
        ctl.theta -= vx * 0.006;
        ctl.phi = Math.max(-0.15, Math.min(1.35, ctl.phi + vy * 0.005));
        req();
        if (Math.hypot(vx, vy) > 0.25) velRaf = requestAnimationFrame(glide);
      };
      velRaf = requestAnimationFrame(glide);
    }
    vel = null;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      ctl.r = Math.max(800, Math.min(40000, ctl.r * (1 + e.deltaY * 0.0012)));
      req();
    },
    { passive: false }
  );
  return true;
}
function mat3(fin, type) {
  const key = fin + '|' + (type || '');
  if (T3.mats[key]) return T3.mats[key];
  const f = FIN[fin] || FIN.ral9010,
    m = MATS[type];
  if (!T3.tex) T3.tex = {};
  const mcT = type === 'mdfmicro',
    tk = fin + (mcT ? '|mc' : ''),
    tex = T3.tex[tk] || (T3.tex[tk] = texFor(fin, mcT));
  try {
    if (tex && !tex._an) {
      tex._an = 1;
      tex.anisotropy = Math.min(8, T3.renderer.capabilities.getMaxAnisotropy());
    }
  } catch (e) {
    oops('3d #5', e);
  }
  try {
    const wood = f.kind === 'wood' || f.kind === 'ply',
      lac = f.kind === 'plain' && (type === 'mdfpaint' || type === 'hpl'),
      o_ = {
        envMapIntensity: f.kind === 'plain' ? 0.9 : 0.7,
        map: tex,
        roughness: m ? (f.kind === 'plain' ? m.rough : (m.rough + f.rough) / 2) : f.rough,
        metalness: 0,
        side: THREE.DoubleSide
      };
    if (wood) {
      o_.bumpMap = tex;
      o_.bumpScale = 0.5;
    } else if (f.kind === 'plain') {
      if (!T3.noiseT) {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const x = c.getContext('2d'),
          id = x.createImageData(256, 256);
        for (let k = 0; k < id.data.length; k += 4) {
          const v = 110 + Math.random() * 60;
          id.data[k] = id.data[k + 1] = id.data[k + 2] = v;
          id.data[k + 3] = 255;
        }
        x.putImageData(id, 0, 0);
        T3.noiseT = new THREE.CanvasTexture(c);
        T3.noiseT.wrapS = T3.noiseT.wrapT = THREE.RepeatWrapping;
      }
      o_.bumpMap = T3.noiseT;
      o_.bumpScale = type === 'melamine' ? 0.14 : 0.05;
    }
    if (lac && THREE.MeshPhysicalMaterial)
      return (T3.mats[key] = new THREE.MeshPhysicalMaterial(
        Object.assign(o_, { clearcoat: 0.35, clearcoatRoughness: 0.45 })
      ));
    return (T3.mats[key] = new THREE.MeshStandardMaterial(o_));
  } catch (e) {
    oops('3d #6', e);
  }
  return (T3.mats[key] = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: f.rough,
    metalness: 0,
    side: THREE.DoubleSide
  }));
}
function clearG(g) {
  while (g.children.length) {
    const c = g.children.pop();
    c.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.userData.own) o.material.dispose();
    });
  }
}
function fabMat(col) {
  const k = 'fab:' + col;
  if (T3.mats[k]) return T3.mats[k];
  const f = FABRICS[col] || FABRICS.charcoal;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = f.c;
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 3) {
    x.fillStyle = i % 6 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)';
    x.fillRect(i, 0, 1, 256);
    x.fillRect(0, i, 256, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  srgb(t);
  return (T3.mats[k] = new THREE.MeshStandardMaterial({ map: t, roughness: 1, side: THREE.DoubleSide }));
}
function colMat(c, rough = 0.75, metal = 0) {
  const k = 'c:' + c + rough + metal;
  if (T3.mats[k]) return T3.mats[k];
  return (T3.mats[k] = new THREE.MeshStandardMaterial({
    color: new THREE.Color(c),
    roughness: rough,
    metalness: metal
  }));
}
function prop3D(p) {
  const G = new THREE.Group(),
    M_ = (geo, m, x, y, z) => {
      const o = new THREE.Mesh(geo, m);
      o.position.set(x, y, z);
      o.castShadow = true;
      o.receiveShadow = true;
      G.add(o);
      return o;
    };
  switch (p.k) {
    case 'book':
      M_(new THREE.BoxGeometry(p.w - 1, p.h, p.d), colMat(p.col, 0.85), p.x + p.w / 2, p.y + p.h / 2, -(p.z + p.d / 2));
      break;
    case 'stack':
      ['#2F4858', '#C9A86A', '#7A3B2E'].forEach((c, i) =>
        M_(
          new THREE.BoxGeometry(p.w - i * 16, 22, p.d - i * 10),
          colMat(c, 0.85),
          p.x + p.w / 2,
          p.y + 11 + i * 22,
          -(p.z + p.d / 2)
        )
      );
      break;
    case 'plant': {
      const cx = p.x + p.w / 2,
        cz = -(p.z + p.w / 2),
        pw = p.w * 0.72,
        r = prng(Math.round(p.x * 7 + p.y * 3)),
        fh = p.h - p.potH;
      M_(new THREE.CylinderGeometry(pw / 2, pw * 0.38, p.potH, 24), colMat(p.pot, 0.7), cx, p.y + p.potH / 2, cz);
      const leaf = LEAFC.map(c => colMat(c, 0.8));
      if (p.fol === 'tall') {
        for (let i = 0; i < 7; i++) {
          const m = M_(
            new THREE.SphereGeometry(p.w * 0.09, 10, 8),
            leaf[i % 4],
            cx + (r() - 0.5) * p.w * 0.5,
            p.y + p.potH + fh * 0.5,
            cz + (r() - 0.5) * p.w * 0.4
          );
          m.scale.set(1, fh / (p.w * 0.2), 0.5);
          m.rotation.z = (r() - 0.5) * 0.6;
        }
      } else {
        const R = p.w * 0.3;
        for (let i = 0; i < 9; i++)
          M_(
            new THREE.SphereGeometry(R * (0.5 + r() * 0.5), 12, 10),
            leaf[i % 4],
            cx + (r() - 0.5) * p.w * 0.7,
            p.y + p.potH + R * 0.6 + r() * Math.max(10, fh - R * 1.4),
            cz + (r() - 0.5) * p.w * 0.6
          );
        if (p.fol === 'trail')
          for (let i = 0; i < 8; i++)
            M_(
              new THREE.SphereGeometry(18, 8, 6),
              leaf[i % 4],
              cx + (r() - 0.5) * pw * 1.1,
              p.y + p.potH - r() * p.potH * 1.6,
              cz + pw * 0.4
            );
      }
      break;
    }
    case 'vase': {
      const w = p.w,
        h = p.h,
        pts = [
          [0.001, 0],
          [w * 0.28, 0],
          [w * 0.42, h * 0.1],
          [w * 0.5, h * 0.45],
          [w * 0.3, h * 0.82],
          [w * 0.15, h],
          [w * 0.17, h]
        ].map(a => new THREE.Vector2(a[0], a[1]));
      const m = M_(new THREE.LatheGeometry(pts, 28), colMat(p.col, 0.5), p.x + w / 2, p.y, -(p.z + w / 2));
      m.material.side = THREE.DoubleSide;
      break;
    }
    case 'box':
      M_(new THREE.BoxGeometry(p.w, p.h, p.d), colMat(p.col, 0.9), p.x + p.w / 2, p.y + p.h / 2, -(p.z + p.d / 2));
      break;
    case 'frame': {
      const m = M_(new THREE.BoxGeometry(p.w, p.h, 14), colMat('#2A2A2A', 0.6), p.x + p.w / 2, p.y + p.h / 2, -p.z);
      m.rotation.x = -0.1;
      const a = M_(
        new THREE.PlaneGeometry(p.w - 24, p.h - 24),
        colMat('#F1EDE4', 0.9),
        p.x + p.w / 2,
        p.y + p.h / 2 + 1,
        -p.z + 8
      );
      a.rotation.x = -0.1;
      const c = M_(
        new THREE.CircleGeometry(p.w * 0.2, 28),
        colMat(p.col, 0.8),
        p.x + p.w / 2,
        p.y + p.h * 0.55,
        -p.z + 9
      );
      c.rotation.x = -0.1;
      break;
    }
    case 'laptop': {
      const al = colMat('#B5B9BD', 0.35, 0.6);
      M_(new THREE.BoxGeometry(p.w, 10, p.d), al, p.x + p.w / 2, p.y + 5, -(p.z + p.d / 2));
      const lid = new THREE.Group();
      lid.position.set(p.x + p.w / 2, p.y + 10, -(p.z + p.d));
      lid.rotation.x = -0.28;
      const sh = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.d * 0.92, 7), al);
      sh.position.y = p.d * 0.46;
      sh.castShadow = true;
      lid.add(sh);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(p.w - 20, p.d * 0.92 - 20), colMat('#1C2632', 0.15, 0.2));
      scr.position.set(0, p.d * 0.46, 3.6);
      lid.add(scr);
      G.add(lid);
      break;
    }
    case 'lamp': {
      const bk = colMat('#2B2B2B', 0.5, 0.3),
        cx = p.x + p.w / 2,
        cz = -p.z;
      M_(new THREE.CylinderGeometry(65, 70, 14, 28), bk, cx, p.y + 7, cz);
      M_(new THREE.CylinderGeometry(6, 6, p.h - 100, 10), bk, cx, p.y + (p.h - 100) / 2, cz);
      const s = M_(new THREE.ConeGeometry(82, 110, 28, 1, true), bk, cx, p.y + p.h - 55, cz);
      s.material.side = THREE.DoubleSide;
      const bulb = M_(
        new THREE.SphereGeometry(26, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffd98a, emissiveIntensity: 0.9 }),
        cx,
        p.y + p.h - 95,
        cz
      );
      break;
    }
    case 'turntable': {
      const cz = -(p.z + p.d / 2);
      M_(new THREE.BoxGeometry(p.w, p.h, p.d), colMat('#26272A', 0.5), p.x + p.w / 2, p.y + p.h / 2, cz);
      const pl = M_(
        new THREE.CylinderGeometry(p.w * 0.34, p.w * 0.34, 8, 40),
        colMat('#101012', 0.35),
        p.x + p.w * 0.42,
        p.y + p.h + 4,
        cz
      );
      M_(
        new THREE.CylinderGeometry(p.w * 0.08, p.w * 0.08, 9, 24),
        colMat('#C96B4B', 0.6),
        p.x + p.w * 0.42,
        p.y + p.h + 5,
        cz
      );
      const arm = M_(
        new THREE.BoxGeometry(8, 8, p.d * 0.6),
        colMat('#C9CCD0', 0.3, 0.8),
        p.x + p.w * 0.82,
        p.y + p.h + 14,
        cz
      );
      arm.rotation.y = 0.35;
      break;
    }
    case 'mixer':
    case 'controller': {
      const cz = -(p.z + p.d / 2);
      M_(new THREE.BoxGeometry(p.w, p.h, p.d), colMat('#1E1F22', 0.5), p.x + p.w / 2, p.y + p.h / 2, cz);
      if (p.k === 'controller') {
        [0.22, 0.78].forEach(f =>
          M_(
            new THREE.CylinderGeometry(p.w * 0.13, p.w * 0.13, 10, 32),
            colMat('#3A3C40', 0.4),
            p.x + p.w * f,
            p.y + p.h + 5,
            cz
          )
        );
      } else {
        for (let a = 0; a < 4; a++)
          for (let b = 0; b < 3; b++)
            M_(
              new THREE.CylinderGeometry(9, 9, 14, 12),
              colMat('#C9CCD0', 0.4, 0.5),
              p.x + 40 + (a * (p.w - 80)) / 3,
              p.y + p.h + 7,
              cz - p.d * 0.3 + b * 60
            );
      }
      break;
    }
    case 'headphones': {
      const t = M_(
        new THREE.TorusGeometry(p.w / 2 - 15, 7, 8, 20, Math.PI),
        colMat('#2A2A2C', 0.6),
        p.x + p.w / 2,
        p.y + 5,
        -(p.z + 40)
      );
      t.rotation.x = -Math.PI / 2;
      break;
    }
    case 'crate': {
      M_(new THREE.BoxGeometry(p.w, p.h, p.d), colMat('#C8A97E', 0.8), p.x + p.w / 2, p.y + p.h / 2, -(p.z + p.d / 2));
      for (let i = 0; i < 9; i++)
        M_(
          new THREE.BoxGeometry(6, p.h + 30, p.d - 30),
          colMat(['#1A1A1A', '#2E3A4F', '#B5503C', '#E2C27A', '#3D3B3A'][i % 5], 0.6),
          p.x + 20 + (i * (p.w - 40)) / 9,
          p.y + p.h / 2 + 20,
          -(p.z + p.d / 2)
        );
      break;
    }
    case 'monitor': {
      M_(new THREE.BoxGeometry(p.w, p.h, p.d), colMat('#1E1E20', 0.5), p.x + p.w / 2, p.y + p.h / 2, -(p.z + p.d / 2));
      const c = M_(
        new THREE.CircleGeometry(p.w * 0.32, 28),
        colMat('#0E0E10', 0.4),
        p.x + p.w / 2,
        p.y + p.h * 0.35,
        -p.z + 1
      );
      break;
    }
    case 'garment': {
      const cz = -(p.z + p.d / 2),
        cx = p.x + p.w / 2;
      M_(new THREE.BoxGeometry(p.w, p.h - 50, p.d), colMat(p.col, 0.95), cx, p.y + (p.h - 50) / 2, cz);
      const sh = M_(new THREE.BoxGeometry(p.w * 0.85, 60, p.d * 0.92), colMat(p.col, 0.95), cx, p.y + p.h - 25, cz);
      sh.scale.set(1, 1, 1);
      M_(new THREE.BoxGeometry(8, 10, p.d * 0.8), colMat('#6B5442', 0.6), cx, p.y + p.h + 6, cz);
      M_(
        new THREE.TorusGeometry(10, 2.5, 6, 12, Math.PI * 1.4),
        colMat('#8d9399', 0.3, 0.8),
        cx,
        p.rail + 2,
        cz
      ).rotation.y = Math.PI / 2;
      break;
    }
    case 'bottle': {
      M_(
        new THREE.CylinderGeometry(p.w / 2, p.w / 2, p.h * 0.7, 18),
        colMat(p.col, 0.2),
        p.x + p.w / 2,
        p.y + p.h * 0.35,
        -p.z
      );
      M_(
        new THREE.CylinderGeometry(p.w * 0.16, p.w * 0.3, p.h * 0.3, 14),
        colMat(p.col, 0.2),
        p.x + p.w / 2,
        p.y + p.h * 0.85,
        -p.z
      );
      break;
    }
    case 'glass': {
      const m = M_(
        new THREE.CylinderGeometry(p.w / 2, p.w * 0.36, p.h, 18, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xdcebf0, transparent: true, opacity: 0.35, roughness: 0.1 }),
        p.x + p.w / 2,
        p.y + p.h / 2,
        -(p.z + p.w / 2)
      );
      m.material.side = THREE.DoubleSide;
      break;
    }
    case 'cup': {
      M_(
        new THREE.CylinderGeometry(p.w / 2, p.w * 0.42, p.h, 18),
        colMat(p.col, 0.4),
        p.x + p.w / 2,
        p.y + p.h / 2,
        -(p.z + p.w / 2)
      );
      break;
    }
    case 'coffee': {
      M_(
        new THREE.BoxGeometry(p.w, p.h, p.d),
        colMat('#B9BEC2', 0.35, 0.6),
        p.x + p.w / 2,
        p.y + p.h / 2,
        -(p.z + p.d / 2)
      );
      break;
    }
    case 'cushion': {
      const m = M_(
        new THREE.BoxGeometry(p.w, p.h, p.d),
        colMat(p.col, 0.95),
        p.x + p.w / 2,
        p.y + p.h / 2,
        -(p.z + p.d / 2)
      );
      break;
    }
    case 'pillow': {
      const m = M_(new THREE.SphereGeometry(p.w / 2, 18, 12), colMat(p.col, 0.95), p.x + p.w / 2, p.y + p.h / 2, -p.z);
      m.scale.set(1, p.h / p.w, 0.35);
      break;
    }
    case 'record': {
      M_(new THREE.BoxGeometry(p.w, p.h, 6), colMat(p.col, 0.7), p.x + p.w / 2, p.y + p.h / 2, -p.z);
      break;
    }
    case 'bowl': {
      const m = M_(
        new THREE.SphereGeometry(p.w / 2, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        colMat(p.col, 0.5),
        p.x + p.w / 2,
        p.y + p.h,
        -(p.z + p.w / 2)
      );
      m.scale.y = p.h / (p.w / 2);
      m.material.side = THREE.DoubleSide;
      break;
    }
    case 'stand': {
      const k = colMat('#3A3C40', 0.4, 0.5);
      M_(new THREE.BoxGeometry(20, p.h, 20), k, p.x + p.w / 2, p.y + p.h / 2, -p.z);
      M_(new THREE.BoxGeometry(p.w + 80, 8, 180), k, p.x + p.w / 2, p.y + 4, -p.z);
      break;
    }
    case 'screen': {
      M_(new THREE.BoxGeometry(p.w, p.h, p.d || 25), colMat('#1B1D21', 0.4), p.x + p.w / 2, p.y + p.h / 2, -p.z);
      M_(
        new THREE.PlaneGeometry(p.w - 24, p.h - 24),
        new THREE.MeshStandardMaterial({ color: 0x2c4a63, emissive: 0x1e3a52, roughness: 0.2 }),
        p.x + p.w / 2,
        p.y + p.h / 2,
        -p.z + (p.d || 25) / 2 + 1
      );
      break;
    }
    case 'keyboard': {
      M_(new THREE.BoxGeometry(p.w, p.h, p.d), colMat('#2A2C30', 0.6), p.x + p.w / 2, p.y + p.h / 2, -(p.z + p.d / 2));
      break;
    }
    case 'mat': {
      M_(new THREE.BoxGeometry(p.w, 4, p.d), colMat('#3E7A5E', 0.8), p.x + p.w / 2, p.y + 2, -(p.z + p.d / 2));
      break;
    }
    case 'mirror': {
      const b = colMat('#B8995A', 0.35, 0.8),
        r_ = p.w / 2;
      M_(new THREE.CylinderGeometry(p.w * 0.3, p.w * 0.3, 12, 24), b, p.x + r_, p.y + 6, -p.z);
      const m = M_(
        new THREE.CircleGeometry(r_ - 12, 40),
        new THREE.MeshStandardMaterial({ color: 0xdce3e6, metalness: 0.95, roughness: 0.05 }),
        p.x + r_,
        p.y + p.h - r_,
        -p.z + 6
      );
      const fr = M_(new THREE.TorusGeometry(r_ - 6, 6, 8, 40), b, p.x + r_, p.y + p.h - r_, -p.z + 6);
      M_(new THREE.BoxGeometry(10, p.h - 2 * r_ + 12, 10), b, p.x + r_, p.y + (p.h - 2 * r_) / 2 + 6, -p.z);
      break;
    }
    case 'chair': {
      const c = colMat(p.col, 0.85),
        k = colMat('#2C2E31', 0.5, 0.4),
        cx = p.x + p.w / 2,
        cz = -p.z;
      M_(new THREE.CylinderGeometry(17, 17, p.seat - 60, 12), k, cx, 60 + (p.seat - 60) / 2, cz);
      M_(new THREE.BoxGeometry(p.w, 70, p.w * 0.9), c, cx, p.seat + 35, cz);
      M_(
        new THREE.BoxGeometry(p.w * 0.84, p.h - p.seat - 110, 50),
        c,
        cx,
        p.seat + 110 + (p.h - p.seat - 110) / 2,
        cz - p.w * 0.45
      );
      for (let a = 0; a < 5; a++) {
        const g = M_(
          new THREE.BoxGeometry(p.w * 0.5, 20, 30),
          k,
          cx + Math.cos(a * 1.2566) * p.w * 0.25,
          40,
          cz + Math.sin(a * 1.2566) * p.w * 0.25
        );
        g.rotation.y = -a * 1.2566;
      }
      break;
    }
    case 'mug': {
      const w = colMat('#F2F0EA', 0.4);
      M_(new THREE.CylinderGeometry(40, 38, p.h, 24), w, p.x + 40, p.y + p.h / 2, -(p.z + 40));
      const t = M_(new THREE.TorusGeometry(24, 6, 8, 16, Math.PI), w, p.x + 80, p.y + p.h / 2, -(p.z + 40));
      t.rotation.z = -Math.PI / 2;
      break;
    }
  }
  return G;
}
function handle3D(hs, tf, metal) {
  if (!hs || hs.type === 'none') return null;
  const W_ = WOODS[S.opts.handleWood] || WOODS.oak,
    wood = mat3(W_.fin, 'solid'),
    dk = colMat('#101010', 0.9),
    v = hs.dir === 'v',
    L = hs.len || 100,
    d = hs.d || 30;
  let m;
  const box = (a, b, c, mt, z) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), mt);
    o.position.set(hs.x, hs.y, z);
    return o;
  };
  switch (hs.type) {
    case 'bar':
      m = box(v ? 12 : L, v ? L : 12, 12, metal, tf + 24);
      break;
    case 'knob':
      m = new THREE.Mesh(new THREE.SphereGeometry(d / 2, 16, 12), metal);
      m.position.set(hs.x, hs.y, tf + d / 2 + 4);
      break;
    case 'woodbar':
      m = box(v ? 22 : L, v ? L : 22, 22, wood, tf + 11);
      break;
    case 'woodpull': {
      m = new THREE.Group();
      const g = box(v ? 18 : L, v ? L : 18, 16, wood, tf + 30);
      m.add(g);
      [-1, 1].forEach(k => {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 24, 12), wood);
        st.rotation.x = Math.PI / 2;
        st.position.set(hs.x + (v ? 0 : k * (L / 2 - 14)), hs.y + (v ? k * (L / 2 - 14) : 0), tf + 12);
        m.add(st);
      });
      break;
    }
    case 'woodknob':
      m = new THREE.Mesh(new THREE.CylinderGeometry(d / 2, d / 2 - 3, 24, 24), wood);
      m.rotation.x = Math.PI / 2;
      m.position.set(hs.x, hs.y, tf + 12);
      break;
    case 'woodblock':
      m = box(d, d, 26, wood, tf + 13);
      break;
    case 'lever': {
      m = new THREE.Group();
      const r = box(26, 110, 6, metal, tf + 3),
        lv = box(130, 14, 14, metal, tf + 40);
      lv.position.x = hs.x + hs.sx * 65;
      lv.position.y = hs.y + 30;
      m.add(r, lv);
      break;
    }
    case 'woodcup': {
      m = new THREE.Mesh(new THREE.CylinderGeometry(L / 2, L / 2, 22, 24, 1, false, 0, Math.PI), wood);
      m.rotation.x = Math.PI / 2;
      m.rotation.z = v ? (hs.sx < 0 ? Math.PI / 2 : -Math.PI / 2) : Math.PI;
      m.position.set(hs.x, hs.y, tf + 11);
      break;
    }
    case 'leather':
      m = box(v ? 18 : L, v ? L : 18, 4, colMat('#7A4A2A', 0.8), tf + 3);
      break;
    case 'edge':
      m = box(v ? 14 : L, v ? L : 14, tf + 12, wood, (tf + 12) / 2 + 1);
      break;
    case 'profile':
      m = box(v ? 24 : L, v ? L : 22, tf + 14, wood, (tf + 14) / 2);
      m.position.x = v ? hs.x + hs.sx * 12 : hs.x + L / 2;
      m.position.y = v ? hs.y + L / 2 : hs.y - 11;
      break;
    case 'hole':
      m = new THREE.Mesh(new THREE.CircleGeometry(d / 2, 28), dk);
      m.position.set(hs.x, hs.y, tf + 0.7);
      break;
    case 'disc':
      m = new THREE.Mesh(
        hs.seam
          ? new THREE.CylinderGeometry(d / 2, d / 2, 18, 32, 1, false, hs.seam === 'L' ? Math.PI : 0, Math.PI)
          : new THREE.CylinderGeometry(d / 2, d / 2, 18, 40),
        wood
      );
      m.rotation.x = Math.PI / 2;
      m.position.set(hs.x, hs.y, tf + 9);
      break;
    case 'stick': {
      const pm = colMat(hColour(), 0.55);
      m = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, L, 18), pm);
      if (!v) m.rotation.z = Math.PI / 2;
      m.position.set(hs.x, hs.y, tf + 16);
      break;
    }
    case 'cross': {
      const pm = colMat(hColour(), 0.55),
        w_ = d * 0.24;
      m = new THREE.Group();
      [1, -1].forEach(k_ => {
        const b_ = new THREE.Mesh(new THREE.BoxGeometry(d, w_, 16), pm);
        b_.rotation.z = (k_ * Math.PI) / 4;
        b_.position.set(hs.x, hs.y, tf + 8);
        m.add(b_);
      });
      break;
    }
    case 'ring': {
      const pm = colMat(hColour(), 0.55);
      m = new THREE.Mesh(new THREE.TorusGeometry(d / 2 - d * 0.09, d * 0.09, 10, 32), pm);
      m.position.set(hs.x, hs.y, tf + d * 0.09);
      break;
    }
    case 'slot':
      m = new THREE.Mesh(v ? new THREE.PlaneGeometry(25, L) : new THREE.PlaneGeometry(L, 25), dk);
      m.position.set(hs.x, hs.y, tf + 0.7);
      break;
    case 'groove': {
      const sh = new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
      m = new THREE.Mesh(v ? new THREE.PlaneGeometry(15, L) : new THREE.PlaneGeometry(L, 15), sh);
      m.position.set(v ? hs.x + hs.sx * 7.5 : hs.x + L / 2, v ? hs.y + L / 2 : hs.y - 7.5, tf + 0.7);
      break;
    }
  }
  if (m)
    m.traverse(o => {
      if (o.isMesh) o.castShadow = true;
    });
  return m;
}
function caneMat() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#E3CFA3';
  x.fillRect(0, 0, 128, 128);
  x.strokeStyle = '#B58F55';
  x.lineWidth = 10;
  for (let k = -128; k <= 256; k += 64) {
    x.beginPath();
    x.moveTo(k, 0);
    x.lineTo(k + 128, 128);
    x.stroke();
    x.beginPath();
    x.moveTo(k + 128, 0);
    x.lineTo(k, 128);
    x.stroke();
  }
  x.fillStyle = 'rgba(59,48,36,.6)';
  for (let a = 32; a < 128; a += 64)
    for (let b = 0; b < 128; b += 64) {
      x.beginPath();
      x.arc(a, b, 9, 0, 7);
      x.fill();
      x.beginPath();
      x.arc(b, a, 9, 0, 7);
      x.fill();
    }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(12, 12);
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
}
/* a stable name for one piece of the 3D model, so a piece you made see-through stays see-through after the scene is rebuilt */
function pkOf(it) {
  try {
    const t = JSON.stringify(it, (k, v) => (typeof v === 'number' ? Math.round(v) : v));
    let h = 7;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
    return h;
  } catch (e) {
    return null;
  }
}
function pick3D(e) {
  if (!T3 || !window.THREE || !THREE.Raycaster) return;
  if (ui.photoOn && PH.adjust) return;
  const el = T3.renderer.domElement,
    r = el.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  if (!T3.rc) T3.rc = new THREE.Raycaster();
  T3.cam.updateMatrixWorld();
  T3.rc.setFromCamera(v, T3.cam);
  const shown = o => {
      for (let p = o; p; p = p.parent) if (!p.visible) return false;
      return true;
    },
    inFront = o => {
      for (let p = o; p; p = p.parent) if (p === T3.frontG) return true;
      return false;
    };
  const hit = T3.rc.intersectObjects([T3.frontG, T3.root], true).find(h => {
    const o = h.object;
    return o.isMesh && o.userData.pk != null && !o.userData.gap && shown(o) && !(ui.fm === 'glass' && inFront(o));
  });
  if (!hit) return;
  if (!ui.see) ui.see = new Set();
  const k = hit.object.userData.pk,
    was = ui.see.has(k);
  if (was) ui.see.delete(k);
  else ui.see.add(k);
  applyFronts3D();
  renderBar();
  if (!was && !ui.seeTold) {
    ui.seeTold = 1;
    toast('See-through, and the things standing or hanging on it are hidden. Tap it again to bring it back.');
  }
}
function rebuild3D() {
  if (!init3D()) return;
  const G = geo,
    { root, frontG, roomG } = T3;
  clearG(root);
  clearG(frontG);
  clearG(roomG);
  if (!T3.propG) {
    T3.propG = new THREE.Group();
    T3.scene.add(T3.propG);
  }
  clearG(T3.propG);
  const M = S.mat,
    maxC = Math.max(...G.cps.map(p => p.y), +S.room.H);
  const metal = colMat('#8d9399', 0.3, 0.85),
    dark = colMat('#121314', 0.6);
  G.items.forEach(it => {
    let mesh = null;
    const tgt = it.tag === 'front' ? frontG : root;
    if (it.k === 'prism') {
      const g = prismGeo(it.poly, it.toW, it.ext, it.grainU, it.holes);
      if (!g) return;
      const mt =
        it.role === 'led'
          ? (T3.ledM =
              T3.ledM ||
              new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffc870, emissiveIntensity: 1.4 }))
          : it.role === 'glass'
            ? (T3.glassM =
                T3.glassM ||
                new THREE.MeshStandardMaterial({
                  color: 0xd6e4e2,
                  transparent: true,
                  opacity: 0.42,
                  roughness: 0.15,
                  metalness: 0.1
                }))
            : it.role === 'cane'
              ? (T3.caneM = T3.caneM || caneMat())
              : String(it.role).startsWith('fabric:')
                ? fabMat(it.role.slice(7))
                : mat3(it.fin || M[it.role].fin, it.mt || (M[it.role] && M[it.role].type));
      mesh = new THREE.Mesh(g, mt);
    } else if (it.k === 'hole') {
      mesh = new THREE.Group();
      const a = new THREE.Mesh(new THREE.CircleGeometry(it.d / 2, 40), dark);
      a.position.set(it.x, it.y, it.z + 0.8);
      const b = new THREE.Mesh(new THREE.RingGeometry(it.d * 0.3, it.d * 0.44, 40), colMat('#2b2e30', 0.8));
      b.position.set(it.x, it.y, it.z + 1.2);
      mesh.add(a, b);
    } else if (it.k === 'tv' && it.look === 'art') {
      mesh = new THREE.Group();
      const fr = new THREE.Mesh(
        new THREE.BoxGeometry(it.w, it.h, 24),
        colMat((ARTFRAMES[it.frame] || ARTFRAMES.oak).c, 0.6)
      );
      fr.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z);
      const img = new Image(),
        tex = new THREE.Texture(img);
      srgb(tex);
      img.onload = () => {
        tex.needsUpdate = true;
        T3.req();
      };
      const pw = 1024,
        phh = Math.round((1024 * it.h) / it.w);
      img.src =
        'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${phh}" viewBox="0 0 ${it.w} ${it.h}">${artInner(it.w, it.h, it.style, it.frame, it.seed)}</svg>`
        );
      const pl = new THREE.Mesh(
        new THREE.PlaneGeometry(it.w, it.h),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })
      );
      pl.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z + 12.5);
      mesh.add(fr, pl);
    } else if (it.k === 'tv') {
      mesh = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(it.w, it.h, 28), colMat('#0b0c0e', 0.4));
      body.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(it.w - 14, it.h - 14), colMat('#1a222c', 0.12, 0.3));
      scr.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z + 14.5);
      mesh.add(body, scr);
    } else if (it.k === 'appl' && it.kind === 'oven') {
      mesh = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(it.w, it.h, it.d), colMat('#2B2F33', 0.4, 0.3));
      body.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z - it.d / 2 - 20);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(it.w - 100, it.h * 0.55), colMat('#14171A', 0.1, 0.6));
      glass.position.set(it.x + it.w / 2, it.y + it.h * 0.45, it.z - 19);
      const pnl = new THREE.Mesh(
        new THREE.PlaneGeometry(it.w - 24, Math.min(90, it.h * 0.18)),
        colMat('#C9CDD1', 0.4, 0.5)
      );
      pnl.position.set(it.x + it.w / 2, it.y + it.h - 60, it.z - 19);
      mesh.add(body, glass, pnl);
    } else if (it.k === 'appl') {
      mesh = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(it.w, it.h, it.d), colMat('#F2F3F4', 0.35));
      body.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z - it.d / 2 - 20);
      const r_ = Math.min(it.w, it.h) * 0.3,
        door = new THREE.Mesh(
          new THREE.CircleGeometry(r_, 40),
          colMat(it.kind === 'washer' ? '#7F95A6' : '#B9C0C6', 0.2, 0.3)
        );
      door.position.set(it.x + it.w / 2, it.y + it.h * 0.45, it.z - 18);
      const ring = new THREE.Mesh(new THREE.RingGeometry(r_, r_ * 1.12, 40), colMat('#9AA0A6', 0.4, 0.5));
      ring.position.set(it.x + it.w / 2, it.y + it.h * 0.45, it.z - 17.5);
      const pnl = new THREE.Mesh(new THREE.PlaneGeometry(it.w - 40, 90), colMat('#DDE1E4', 0.5));
      pnl.position.set(it.x + it.w / 2, it.y + it.h - 65, it.z - 19);
      mesh.add(body, door, ring, pnl);
    } else if (it.k === 'holdX') {
    } else if (it.k === 'rail') {
      const L = it.xb - it.xa;
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 12.5, L, 20), metal);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set((it.xa + it.xb) / 2, it.y, -it.z);
    }
    if (mesh) {
      const pk = pkOf(it);
      mesh.traverse(o => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          if (it.sz) o.userData.sz = it.sz;
          o.userData.pk = pk;
          o.userData.it = it; // for the size readout (32-sizes.js)
        }
      });
      /* dark line in the gaps round each door and drawer, like the real shadow there */
      try {
        if (
          it.k === 'prism' &&
          it.tag === 'front' &&
          it.ext &&
          Math.abs(it.ext[2]) >= 12 &&
          !it.ext[0] &&
          !it.ext[1] &&
          mesh.geometry
        ) {
          const xs = it.poly.map(p => p[0]),
            ys = it.poly.map(p => p[1]),
            x0 = Math.min(...xs),
            x1 = Math.max(...xs),
            y0 = Math.min(...ys),
            y1 = Math.max(...ys),
            w = x1 - x0,
            h = y1 - y0;
          if (w > 90 && h > 60) {
            const zc = it.toW(x0, y0)[2] + it.ext[2] / 2,
              sx = 1 + 5 / w,
              sy = 1 + 5 / h,
              sz = 0.8,
              gm =
                T3.gapM ||
                (T3.gapM = new THREE.MeshBasicMaterial({
                  color: 0x050505,
                  transparent: true,
                  opacity: 0.5,
                  depthWrite: false
                })),
              sl = new THREE.Mesh(mesh.geometry, gm);
            sl.scale.set(sx, sy, sz);
            sl.position.set(((x0 + x1) / 2) * (1 - sx), ((y0 + y1) / 2) * (1 - sy), zc * (1 - sz) - 1.2);
            sl.userData.gap = 1;
            mesh.add(sl);
          }
        }
      } catch (e) {
        oops('3d #7', e);
      }
      tgt.add(mesh);
    }
  });
  /* soft shadow where the cabinet meets the floor */
  try {
    if (!T3.contactT) {
      const c = document.createElement('canvas');
      c.width = 8;
      c.height = 128;
      const x = c.getContext('2d'),
        g = x.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, 'rgba(0,0,0,0.62)');
      g.addColorStop(0.12, 'rgba(0,0,0,0.34)');
      g.addColorStop(0.45, 'rgba(0,0,0,0.1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, 8, 128);
      T3.contactT = new THREE.CanvasTexture(c);
    }
    const x0 = G.sx0 ?? 0,
      x1 = G.sx1 ?? G.W,
      rec = +S.skirt.recess || 0,
      dep = 380,
      cm = new THREE.Mesh(
        new THREE.PlaneGeometry(x1 - x0, dep + rec),
        new THREE.MeshBasicMaterial({
          map: T3.contactT,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
          opacity: +S.skirt.plinth > 0 ? 0.75 : 0.55
        })
      );
    cm.rotation.x = -Math.PI / 2;
    cm.position.set((x0 + x1) / 2, 0.8, (dep - rec) / 2);
    cm.renderOrder = 2;
    if (T3.contactM) T3.scene.remove(T3.contactM);
    T3.contactM = cm;
    T3.scene.add(cm);
  } catch (e) {
    oops('3d #8', e);
  }
  G.fronts.forEach(f => {
    const m = handle3D(f.handle, (f.zF ?? G.tf) - (f.z0 || 0), metal);
    if (m) {
      m.traverse(o => {
        o.userData.sz = f.sec + ':' + f.zone;
      });
      frontG.add(m);
    }
  });
  G.claddings.forEach(c => {
    if (!c.handle) return;
    const m = handle3D(c.handle, G.tf - (c.z0 || 0), metal);
    if (m) frontG.add(m);
  });
  G.holds.forEach(hd => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(hd.s / 2, 14, 10), colMat(hd.col, 0.7));
    m.scale.set(1, hd.shape === 0 ? 0.66 : 0.85, 0.45);
    m.rotation.z = (hd.rot * Math.PI) / 180;
    m.position.set(hd.x, hd.y, G.tf - (hd.z0 || 0) + hd.s * 0.12);
    m.castShadow = true;
    root.add(m);
  });
  G.secs.forEach(q =>
    q.zones.forEach(zr => {
      if (zr.dj && zr.led) {
        const o = zr.open,
          m = new THREE.Mesh(
            new THREE.BoxGeometry(o.ix1 - o.ix0 - 20, 8, 12),
            new THREE.MeshStandardMaterial({ color: zr.ledCol, emissive: zr.ledCol, emissiveIntensity: 1.2 })
          );
        m.position.set((o.ix0 + o.ix1) / 2, o.iy1 - 8, -(q.z0 + 30));
        T3.propG.add(m);
      }
    })
  );
  G.funs.forEach(f => {
    const g = fun3D(f);
    if (g) {
      g.userData.deco = 1;
      root.add(g);
    }
  });
  G.props.forEach(p => T3.propG.add(prop3D(p)));
  T3.propG.visible = ui.props;
  const steel = colMat('#5f676d', 0.45, 0.55);
  if (G.ladder) {
    const L_ = G.ladder,
      wd = mat3((WOODS[(S.ladder || {}).wood || 'oak'] || WOODS.oak).fin, 'solid'),
      stl = colMat('#7F858B', 0.3, 0.85),
      gL = new THREE.Group();
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, L_.r1 - L_.r0, 16), stl);
    rail.rotation.z = Math.PI / 2;
    rail.position.set((L_.r0 + L_.r1) / 2, L_.h, L_.z);
    gL.add(rail);
    const lad = new THREE.Group();
    lad.position.set(L_.x, L_.h, L_.z);
    lad.rotation.x = -(Math.PI / 2 - (75 * Math.PI) / 180);
    [23, L_.w - 23].forEach(x => {
      const st = new THREE.Mesh(new THREE.BoxGeometry(46, L_.len + 60, 30), wd);
      st.position.set(x, -L_.len / 2 + 30, 0);
      lad.add(st);
    });
    for (let d = 280; d < L_.len - 100; d += 280) {
      const rg = new THREE.Mesh(new THREE.BoxGeometry(L_.w - 46, 24, 90), wd);
      rg.position.set(L_.w / 2, -L_.len + d, 20);
      lad.add(rg);
    }
    gL.add(lad);
    gL.traverse(o => {
      if (o.isMesh) o.castShadow = true;
    });
    root.add(gL);
  }
  G.beams.forEach(b => {
    const ct = Math.max(G.ceilAt(b.x), G.ceilAt(b.x + b.w)) + 50,
      full = G.isFull(b),
      z0 = G.D - b.depth,
      len = full ? G.D + 1600 : b.depth;
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, ct - b.bottom, len), steel);
    m.position.set(b.x + b.w / 2, (ct + b.bottom) / 2, full ? -(G.D - len / 2) : -(z0 + G.D) / 2);
    m.castShadow = true;
    roomG.add(m);
  });
  const W = G.W,
    D = G.D,
    F = 1800,
    drop = G.drop;
  const wallM = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.95, side: THREE.DoubleSide });
  const ghost = new THREE.MeshStandardMaterial({
    color: 0xe9e6df,
    roughness: 0.95,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });
  const cl = [[0, G.ceilAt(0)], ...G.cps.filter(p => p.x > 0 && p.x < W).map(p => [p.x, p.y]), [W, G.ceilAt(W)]];
  const shp = new THREE.Shape();
  shp.moveTo(0, 0);
  shp.lineTo(W, 0);
  cl.slice()
    .reverse()
    .forEach(p => shp.lineTo(p[0], p[1]));
  const back = new THREE.Mesh(new THREE.ShapeGeometry(shp), wallM);
  back.position.z = -D - 1;
  back.receiveShadow = true;
  roomG.add(back);
  const fl = floorTex();
  fl.repeat.set((W + 2000) / 1600, (D + F + 400) / 1600);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W + 2000, D + F + 400),
    new THREE.MeshStandardMaterial({ map: fl, roughness: 0.7 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(W / 2, -0.5, (F - D) / 2);
  floor.receiveShadow = true;
  roomG.add(floor);
  const hz = (x, z) => G.ceilAt(x) - (drop * z) / D;
  for (let k = 0; k < cl.length - 1; k++) {
    const [a, ya] = cl[k],
      [b, yb] = cl[k + 1];
    const g = prismGeo(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1]
      ],
      (u, v) => {
        const x = a + (b - a) * u,
          z = D - (D + F) * v;
        return [x, ya + (yb - ya) * u - (drop * z) / D, -z];
      },
      [0, 0, 0.001]
    );
    roomG.add(new THREE.Mesh(g, ghost));
  }
  [0, W].forEach(x => {
    const g = prismGeo(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1]
      ],
      (u, v) => {
        const z = D - (D + F) * u;
        return [x, v * hz(x, z), -z];
      },
      [0.001, 0, 0]
    );
    roomG.add(new THREE.Mesh(g, ghost));
  });
  roomG.visible = ui.room3D;
  applyFronts3D(true);
  tagExplode();
  room3D();
  T3.sun.position.set(W * 0.25, maxC * 1.9, 2800);
  T3.sun.target.position.set(W / 2, 0, -D / 2);
  try {
    dayLight(W, maxC, D);
  } catch (e) {
    oops('3d #9', e);
  }
  const sc = T3.sun.shadow.camera;
  const ext = Math.max(W, maxC) * 0.85;
  sc.left = -ext;
  sc.right = ext;
  sc.top = ext;
  sc.bottom = -ext;
  sc.near = 100;
  sc.far = 20000;
  sc.updateProjectionMatrix();
  T3.fill.position.set(-W * 0.4, maxC * 0.6, 2000);
  if (typeof photoActive === 'function') {
    if (photoActive()) {
      try {
        solvePhoto();
        photoLight();
        photoFit();
      } catch (e) {
        oops('3d #10', e);
      }
    } else if (PH.keep && PH.img && !ui.photoOn && ui.tab === '3d' && !PH._auto1) {
      PH._auto1 = 1;
      try {
        solvePhoto();
        if (PH.pose) {
          PH.adjust = false;
          setPhotoMode(true);
        }
      } catch (e) {
        oops('3d #11', e);
      }
    }
  }
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--stage').trim() || '#dde1dc';
  T3.scene.background = photoActive() ? null : new THREE.Color(bg);
  photoShadow();
  if (!T3.framed) {
    camPreset('angle');
    T3.framed = true;
  }
  T3.req();
  try {
    others3D();
  } catch (e) {
    console.warn(e);
  }
}

/* ===== exploded view: every column pulled apart, every part pulled off its box ===== */

function room3D() {
  if (!T3) return;
  if (!T3.pplG) {
    T3.pplG = new THREE.Group();
    T3.scene.add(T3.pplG);
  }
  const g = T3.pplG;
  clearG(g);
  const G = geo,
    D = G.D;
  const glassM = new THREE.MeshStandardMaterial({
      color: 0xbfddf2,
      emissive: 0x8fc3e8,
      emissiveIntensity: 0.55,
      roughness: 0.2
    }),
    frameM = colMat('#F4F2EE', 0.6),
    doorM = colMat('#C9B79C', 0.6),
    hM = colMat('#8d9399', 0.3, 0.85);
  const box = (w, h, d, m, x, y, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z);
    b.castShadow = true;
    b.receiveShadow = true;
    g.add(b);
    return b;
  };
  (G.objs || []).forEach(o => {
    const isD = o.type === 'door',
      fr = 60,
      dp = 30;
    const panel = (cx, cy, u) => {
      // u: 'back' | 'left' | 'right'
      if (u === 'back') {
        box(o.w, o.h, 4, isD ? doorM : glassM, cx, cy, -D + 3);
        [
          [o.w + fr * 2, fr, 0, o.h / 2 + fr / 2],
          [o.w + fr * 2, fr, 0, -o.h / 2 - fr / 2],
          [fr, o.h, -o.w / 2 - fr / 2, 0],
          [fr, o.h, o.w / 2 + fr / 2, 0]
        ].forEach(([w, h, dx, dy]) => {
          if (isD && dy < 0) return;
          box(w, h, dp, frameM, cx + dx, cy + dy, -D + dp / 2);
        });
        if (isD) box(120, 22, 40, hM, cx + o.w / 2 - 110, 1050, -D + 28);
      } else {
        const x = u === 'left' ? 3 : G.W - 3,
          sgn = u === 'left' ? 1 : -1;
        box(4, o.h, o.w, isD ? doorM : glassM, x, cy, cx);
        [
          [fr, o.w + fr * 2, 0, o.h / 2 + fr / 2],
          [fr, o.w + fr * 2, 0, -o.h / 2 - fr / 2],
          [o.h, fr, -o.w / 2 - fr / 2, 0],
          [o.h, fr, o.w / 2 + fr / 2, 0]
        ].forEach(([a, b, dz, dy]) => {
          if (isD && dy < 0) return;
          const m = box(
            dp,
            a === fr ? fr : o.h,
            b === fr ? fr : o.w + fr * 2,
            frameM,
            x + (sgn * dp) / 2,
            cy + dy,
            cx + dz
          );
        });
        if (isD) box(40, 22, 120, hM, x + sgn * 28, 1050, cx + o.w / 2 - 110);
      }
    };
    if (o.wall === 'back') panel(o.x + o.w / 2, o.y + o.h / 2, 'back');
    else panel(-D + o.x + o.w / 2, o.y + o.h / 2, o.wall);
  });
  screen3D();
  const pn = G.person;
  if (pn) {
    const u = pn.h / 1750,
      m = colMat('#59656E', 0.75),
      pg = new THREE.Group(),
      cy_ = (r, h, x, y, z) => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(r * u, r * u, h * u, 16), m);
        c.position.set(x * u, y * u, z * u);
        c.castShadow = true;
        pg.add(c);
        return c;
      };
    [-58, 58].forEach(x => cy_(62, 820, x, 410, 0));
    const t = new THREE.Mesh(new THREE.BoxGeometry(300 * u, 560 * u, 190 * u), m);
    t.position.set(0, 1140 * u, 0);
    t.castShadow = true;
    pg.add(t);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(112 * u, 20, 14), m);
    hd.position.set(0, 1625 * u, 0);
    hd.castShadow = true;
    pg.add(hd);
    cy_(50, 180, 0, 1470, 0);
    cy_(42, 640, -185, 1100, 0);
    const ra = pn.max - 20 * u - 1400 * u,
      arm = cy_(42, ra / u, 185, (1400 * u + ra / 2) / u, 0);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(40 * u, 12, 10), colMat('#C2603A', 0.6));
    hand.position.set(185 * u, pn.max, 0);
    pg.add(hand);
    pg.name = 'refPerson';
    pg.position.set(pn.x, 0, (G.tf || 20) + 620);
    g.add(pg);
  }
  applyExplode(true);
}
function solveH(src, dst) {
  const n = src.length,
    A = [],
    b = [];
  for (let i = 0; i < n; i++) {
    const [X, Y] = src[i],
      [u, v] = dst[i];
    A.push([X, Y, 1, 0, 0, 0, -u * X, -u * Y]);
    b.push(u);
    A.push([0, 0, 0, X, Y, 1, -v * X, -v * Y]);
    b.push(v);
  }
  const M = Array.from({ length: 8 }, () => Array(9).fill(0));
  for (let r = 0; r < A.length; r++)
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) M[i][j] += A[r][i] * A[r][j];
      M[i][8] += A[r][i] * b[r];
    }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c];
    if (Math.abs(d) < 1e-12) return null;
    for (let j = c; j < 9; j++) M[c][j] /= d;
    for (let r = 0; r < 8; r++)
      if (r !== c) {
        const f = M[r][c];
        if (f) for (let j = c; j < 9; j++) M[r][j] -= f * M[c][j];
      }
  }
  const h = M.map(r => r[8]);
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1]
  ];
}
function poseFromH(H, imgH, fFix) {
  const a = H;
  let f2a = -(a[0][0] * a[0][1] + a[1][0] * a[1][1]) / (a[2][0] * a[2][1]),
    f2b = (a[0][0] ** 2 + a[1][0] ** 2 - a[0][1] ** 2 - a[1][1] ** 2) / (a[2][1] ** 2 - a[2][0] ** 2);
  const pp = a[2][0] ** 2 + a[2][1] ** 2,
    wa = Math.abs(a[2][0] * a[2][1]) / (pp || 1),
    wb = Math.abs(a[2][1] ** 2 - a[2][0] ** 2) / (pp || 1),
    span = typeof geo !== 'undefined' && geo ? Math.max(geo.W, 2000) : 3000,
    flat = Math.sqrt(pp) * span < 0.09,
    dflt = Math.max(imgH, (typeof PH !== 'undefined' && PH.iw) || imgH) * 0.74;
  const cands = [
    [f2a, wa],
    [f2b, wb]
  ].filter(([v, w]) => isFinite(v) && v > 0 && w > 0.12);
  let f =
    flat || !cands.length
      ? dflt
      : Math.sqrt(cands.reduce((x, [v, w]) => x + v * w * w, 0) / cands.reduce((x, [v, w]) => x + w * w, 0));
  let guessed = flat || !cands.length;
  if (fFix > 0) {
    f = fFix;
    guessed = false;
  }
  const col = j => [a[0][j] / f, a[1][j] / f, a[2][j]],
    a1 = col(0),
    a2 = col(1),
    a3 = col(2),
    nrm = v => Math.hypot(...v);
  const asp = nrm(a1) / nrm(a2);
  let lam = 2 / (nrm(a1) + nrm(a2));
  if (a3[2] * lam < 0) lam = -lam;
  let r1 = a1.map(v => v * lam),
    r2 = a2.map(v => v * lam);
  const t = a3.map(v => v * lam);
  {
    const n1 = nrm(r1),
      n2 = nrm(r2);
    r1 = r1.map(v => v / n1);
    r2 = r2.map(v => v / n2);
    let c = r1.map((v, i) => v + r2[i]),
      d = r1.map((v, i) => v - r2[i]);
    const nc = nrm(c),
      nd = nrm(d);
    c = c.map(v => v / nc);
    d = d.map(v => v / nd);
    r1 = c.map((v, i) => (v + d[i]) / Math.SQRT2);
    r2 = c.map((v, i) => (v - d[i]) / Math.SQRT2);
  }
  const r3 = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]];
  const R = [
    [r1[0], r2[0], r3[0]],
    [r1[1], r2[1], r3[1]],
    [r1[2], r2[2], r3[2]]
  ];
  const C = [0, 1, 2].map(i => -(R[0][i] * t[0] + R[1][i] * t[1] + R[2][i] * t[2]));
  return { f, R, C, guessed, asp, fov: (2 * Math.atan(imgH / 2 / f) * 180) / Math.PI };
}
