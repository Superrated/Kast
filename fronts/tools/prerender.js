#!/usr/bin/env node
/* Pre-render the empty room for BRUIS Fronts, once, with the path tracer.
   Saves src/assets/room-bg.jpg (the room from the fixed camera) and src/assets/room-env.png (its light, RGBE).
   Then run  python3 build.py  to put them in index.html.

   Needs Playwright and a node_modules folder with three@0.170.0, three-mesh-bvh@0.8.3 and
   three-gpu-pathtracer@0.0.23 (NPM_DIR). On a computer with a real graphics card this takes a minute or two;
   without one (software graphics) much longer.
     NPM_DIR=/path/to/node_modules node tools/prerender.js [samples=256] [panorama samples=128]   */
const { chromium } = require('playwright');
const path = require('path'),
  fs = require('fs');
const NPM = process.env.NPM_DIR,
  SPP = +process.argv[2] || 256,
  ESPP = +process.argv[3] || 128,
  HERE = path.resolve(__dirname, '..');
if (!NPM) throw new Error('set NPM_DIR to a node_modules folder with three and the path tracer');
(async () => {
  const b = await chromium.launch({
    args: process.env.SOFTWARE_GL ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=default']
  });
  const p = await b.newPage();
  p.on('pageerror', e => console.error('page:', e.message));
  await p.route('**/cdn.jsdelivr.net/npm/**', r => {
    const m = r.request().url().match(/\/npm\/((?:@[^/]+\/)?[^@/]+)@[^/]+\/(.*)/),
      f = m && path.join(NPM, m[1], m[2]);
    return f && fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'application/javascript' }) : r.fulfill({ status: 404 });
  });
  await p.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, body: '', contentType: 'text/css' }));
  await p.goto('file://' + path.join(HERE, 'index.html') + `?spp=${SPP}&espp=${ESPP}#prerender`);
  let last = '';
  for (;;) {
    const s = await p.evaluate(() => window.__prerender && { status: window.__prerender.status, n: window.__prerender.samples });
    if (s && s.status === 'done') break;
    const line = s ? `${s.status} ${Math.floor(s.n || 0)}` : 'loading';
    if (line !== last) console.log(line);
    last = line;
    await p.waitForTimeout(5000);
  }
  const out = await p.evaluate(() => ({ bg: window.__prerender.bg, env: window.__prerender.env }));
  const save = (name, url) => fs.writeFileSync(path.join(HERE, 'src/assets', name), Buffer.from(url.split(',')[1], 'base64'));
  save('room-bg.jpg', out.bg);
  save('room-env.png', out.env);
  console.log('saved src/assets/room-bg.jpg and room-env.png');
  await b.close();
})();
