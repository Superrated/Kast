/* ==== 56-rooms-share.js ====
   Saved rooms and sharing.
   A room is the wall without the cabinets: size, slopes, beams, sockets, doors, closing strips.
   Rooms are kept like designs (in the app's shared list when there is one, otherwise in this browser),
   so you can measure once and try many designs in the same room.
   Sharing: download a design or room file, copy it as text, open what someone sent you.
*/
const RM = { list: [], state: 'loading' };
const RML = 'fitted-rooms-v1';
const rmLocalGet = () => {
  try {
    return JSON.parse(localStorage.getItem(RML) || '[]');
  } catch (e) {
    return [];
  }
};
function rmInit() {
  if (!DS.db) {
    RM.list = rmLocalGet().sort((a, b) => b.updatedAt - a.updatedAt);
    RM.state = 'ready';
    return;
  }
  try {
    DS.db
      .collection('rooms')
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .onSnapshot(
        snap => {
          RM.list = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
          RM.state = 'ready';
          renderDesigns();
        },
        () => {
          RM.state = 'error';
          renderDesigns();
        }
      );
  } catch (e) {
    RM.state = 'error';
  }
}
/* the part of a design that is "the room" */
function roomOf(st) {
  const R = JSON.parse(JSON.stringify(st.room || {}));
  delete R.corner;
  return { room: R, skirt: JSON.parse(JSON.stringify(st.skirt || {})) };
}
function rmParse(r) {
  try {
    return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
  } catch (e) {
    return null;
  }
}
async function rmAdd(name, data) {
  const rec = { name: String(name || 'My room').slice(0, 80), data: JSON.stringify(data), updatedAt: Date.now() };
  if (DS.db) {
    const ref = await DS.db.collection('rooms').add(rec);
    return ref.id;
  }
  const l = rmLocalGet(),
    id = 'r' + Date.now().toString(36);
  l.unshift(Object.assign({ id }, rec));
  try {
    localStorage.setItem(RML, JSON.stringify(l));
  } catch (e) {
    throw { code: 'full' };
  }
  RM.list = l;
  return id;
}
async function rmSave() {
  const el = document.getElementById('rmName'),
    R = S.room;
  const name = ((el && el.value) || '').trim() || `Wall ${f0(+R.W)} × ${f0(+R.H)}`;
  try {
    await rmAdd(name, roomOf(S));
    if (el) el.value = '';
    toast(`Room “${name}” saved — use it for any design`);
    ui.ioTab = 'rooms';
    renderDesigns();
  } catch (e) {
    toast('Could not save the room: ' + dsErrText(e));
  }
}
async function rmDel(id) {
  try {
    if (DS.db) await DS.db.doc('rooms/' + id).delete();
    else {
      const l = rmLocalGet().filter(r => r.id !== id);
      localStorage.setItem(RML, JSON.stringify(l));
      RM.list = l;
    }
    toast('Room removed');
    renderDesigns();
  } catch (e) {
    toast('Could not remove it right now');
  }
}
/* put a design's cabinets into another room: flexible columns share the new wall, fixed-size ones (speakers, appliances, panel walls) keep their width */
function fitToRoom(st, data) {
  st = JSON.parse(JSON.stringify(st));
  const sameW = Math.abs((+(st.room || {}).W || 0) - (+data.room.W || 0)) < 5;
  st.room = JSON.parse(JSON.stringify(data.room));
  if (data.skirt) st.skirt = Object.assign({}, st.skirt, JSON.parse(JSON.stringify(data.skirt)));
  delete st.proj;
  (st.sections || []).forEach(sc => {
    const fixed =
      sc.base === 'panel' ||
      (sc.zones || []).some(
        z =>
          z.type === 'speaker' ||
          z.fridge ||
          z.fit === 'larder' ||
          ['oven', 'combi', 'washer', 'dryer', 'stack', 'bed'].includes(z.look)
      );
    if (!fixed && !sameW) {
      sc.w = null;
      sc.pinX = null;
    }
  });
  try {
    st = slopeFix(st);
  } catch (e) {
    oops('rooms-share #1', e);
  }
  return fitTypes(st);
}
function rmUse(id) {
  const r = RM.list.find(x => x.id === id),
    d = r && rmParse(r);
  if (!d || !d.room) {
    toast('That room could not be read');
    return;
  }
  if (S.proj) {
    toast('This design has several walls — open one wall, or start a new design in this room');
    return;
  }
  S = fitToRoom(S, d);
  ui.sel = 0;
  ui.zsel = null;
  document.getElementById('iom').hidden = true;
  changed(true);
  toast(`Your cabinets now stand in “${r.name}”. Undo brings the old room back.`);
}
function rmNew(id) {
  ST.fit = true;
  ST.roomId = id;
  document.getElementById('iom').hidden = true;
  stOpen();
}
function roomThumb(d) {
  const R = (d && d.room) || {},
    W = Math.max(600, +R.W || 3000),
    H = Math.max(600, +R.H || 2500),
    pts = (
      R.ceil && R.ceil.length
        ? R.ceil
        : [
            { x: 0, y: H },
            { x: W, y: H }
          ]
    ).map(p => [Math.max(0, Math.min(W, +p.x)), Math.max(0, +p.y)]);
  const Y = y => H - y,
    poly = [[0, 0], ...pts, [W, 0]];
  let o = `<svg viewBox="-120 -160 ${W + 240} ${H + 320}" role="img" aria-label="Wall ${f0(W)} by ${f0(H)} mm"><polygon points="${poly.map(p => `${f0(p[0])},${f0(Y(p[1]))}`).join(' ')}" style="fill:var(--raised);stroke:var(--ink2)" stroke-width="24"/>`;
  (R.beams || []).forEach(b => {
    o += `<rect x="${f0(+b.x)}" y="${f0(Y(H))}" width="${f0(+b.w)}" height="${f0(Math.max(0, H - (+b.bottom || H)))}" style="fill:var(--ink3)"/>`;
  });
  (R.wobs || []).forEach(w => {
    const D = WOB[w.type] || { w: 80, h: 80 };
    o += `<rect x="${f0(+w.x)}" y="${f0(Y((+w.y || 0) + (D.h || 80)))}" width="${f0(D.w || 80)}" height="${f0(D.h || 80)}" style="fill:var(--accent)" opacity=".55"/>`;
  });
  return (
    o +
    `<text x="${f0(W / 2)}" y="${f0(H / 2)}" text-anchor="middle" font-size="${f0(Math.min(W, H) / 7)}" style="fill:var(--ink2)">${f0(W)} × ${f0(H)}</text></svg>`
  );
}
function roomsHTML() {
  const R = S.room,
    slope = (R.ceil || []).some(p => Math.abs(+p.y - +R.H) > 1);
  const cur = `<div class="dsnow2 ok"><div class="dthumb rmthumb" aria-hidden="true">${roomThumb(roomOf(S))}</div><div class="dsnowb"><label class="fld"><span>Save the room of the open design</span><span class="inp"><input type="text" id="rmName" maxlength="80" placeholder="e.g. Attic bedroom, left wall" enterkeyhint="done"></span></label>
    <div class="dsst"><span>${f0(+R.W)} × ${f0(+R.H)} mm, ${f0(+R.D)} deep${slope ? ', sloping ceiling' : ''}${(R.beams || []).length ? ', beam' : ''}${(R.wobs || []).length ? `, ${(R.wobs || []).length} thing${(R.wobs || []).length > 1 ? 's' : ''} on the wall` : ''}</span></div>
    <div class="dbtns"><button type="button" class="btn pri" data-act="rmSave">Save room</button><span class="hintp" style="margin:0">Measure once, try as many designs as you like in it.</span></div></div></div>`;
  const list = RM.list
    .map(r => {
      const d = rmParse(r);
      return `<div class="dcard"><div class="dthumb rmthumb" aria-hidden="true">${roomThumb(d)}</div><div class="dmeta"><b>${esc(r.name || 'Room')}</b><span>${dsAgo(+r.updatedAt || 0)}</span></div>
    <div class="dact"><button type="button" class="btn sm pri" data-act="rmNew" data-a="${esc(r.id)}">New design here</button><button type="button" class="btn sm" data-act="rmUse" data-a="${esc(r.id)}">Use for the open design</button><button type="button" class="btn sm" data-act="rmFile" data-a="${esc(r.id)}">Download</button><button type="button" class="btn sm warnb" data-act="rmDel" data-a="${esc(r.id)}">Delete</button></div></div>`;
    })
    .join('');
  return (
    cur +
    `<div class="dshead"><h3>My rooms${RM.list.length ? ` <small>${RM.list.length}</small>` : ''}</h3></div>${RM.list.length ? `<div class="dgrid">${list}</div>` : `<p class="hintp">${RM.state === 'loading' ? 'Loading your rooms…' : 'No rooms saved yet. Save the room above — then “New design here” starts any design in it, already fitted to the wall.'}</p>`}`
  );
}
/* ---- files and text ---- */
const slugOf = n =>
  String(n || 'design')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 48) || 'design';
function designPack(st, name) {
  return {
    app: 'Fitted by BRUIS',
    kind: 'design',
    version: APP_VERSION,
    name: name || st.name || 'My design',
    saved: new Date().toISOString(),
    design: st
  };
}
function roomPack(data, name) {
  return {
    app: 'Fitted by BRUIS',
    kind: 'room',
    version: APP_VERSION,
    name: name || 'My room',
    saved: new Date().toISOString(),
    room: data.room,
    skirt: data.skirt
  };
}
function packBlob(o) {
  return new Blob([JSON.stringify(o)], { type: 'application/json' });
}
function curName() {
  const c = dsCur();
  return (c && c.name) || ui.docName || S.name || 'My design';
}
function ioFile() {
  const nm = curName();
  saveFile(slugOf(nm) + '.fitted.json', packBlob(designPack(S, nm)), 'Design file');
}
function dsFile(id) {
  const d = DS.list.find(x => x.id === id);
  if (!d) return;
  let st;
  try {
    st = JSON.parse(d.state);
  } catch (e) {
    return;
  }
  saveFile(slugOf(d.name) + '.fitted.json', packBlob(designPack(st, d.name)), 'Design file');
}
function rmFile(id) {
  let nm, data;
  if (id) {
    const r = RM.list.find(x => x.id === id);
    data = r && rmParse(r);
    nm = r && r.name;
  } else {
    data = roomOf(S);
    nm = ((document.getElementById('rmName') || {}).value || '').trim() || 'Room ' + curName();
  }
  if (!data) return;
  saveFile(slugOf(nm) + '.room.fitted.json', packBlob(roomPack(data, nm)), 'Room file');
}
function ioCopyText() {
  const nm = curName();
  copy(
    `Fitted design “${nm}” — to open it: Fitted → ☰ → Share & files → paste it in the box.\n` +
      JSON.stringify(designPack(S, nm))
  );
}
function canShareFile() {
  try {
    return !!(
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [new File(['{}'], 'a.json', { type: 'application/json' })] })
    );
  } catch (e) {
    return false;
  }
}
async function ioShare() {
  const nm = curName();
  try {
    await navigator.share({
      title: nm,
      text: `My Fitted design “${nm}”`,
      files: [new File([JSON.stringify(designPack(S, nm))], slugOf(nm) + '.fitted.json', { type: 'application/json' })]
    });
  } catch (e) {
    if (!e || e.name !== 'AbortError') toast('Sharing is not available here — use Download design file');
  }
}
/* open a design or room from a file or pasted text */
async function ioImport(t) {
  let o = null;
  try {
    const s = String(t || ''),
      i = s.indexOf('{');
    o = JSON.parse(s.slice(i));
  } catch (e) {
    oops('rooms-share #2', e);
  }
  if (o && o.kind === 'room' && o.room) {
    try {
      await rmAdd(o.name || 'Room', { room: o.room, skirt: o.skirt });
      ui.ioTab = 'rooms';
      document.getElementById('iom').hidden = false;
      renderDesigns();
      toast(`Room “${o.name || 'Room'}” added to your rooms. Tap “New design here” to design for it.`);
    } catch (e) {
      toast('Could not add the room: ' + dsErrText(e));
    }
    return;
  }
  const st = o && o.design ? o.design : o;
  if (!st || !st.sections || !st.room) {
    toast('That is not a Fitted design or room');
    return;
  }
  const kept = dsKeep();
  dsDetach(false);
  S = fixFins(st);
  ui.docName = (o && o.name) || st.name || '';
  ui.sel = 0;
  ui.zsel = null;
  document.getElementById('iom').hidden = true;
  changed(true);
  toast(
    `Opened “${ui.docName || 'design'}”. Tap Save at the top to keep it in your designs.` +
      (kept ? ' Your unsaved work was kept under Recovered work.' : '')
  );
}
document.addEventListener('change', e => {
  const el = e.target;
  if (!el || !el.matches || !el.matches('[data-iofile]')) return;
  const f = el.files && el.files[0];
  if (!f) return;
  if (f.size > 2e6) {
    toast('That file is too big for a Fitted design');
    return;
  }
  const rd = new FileReader();
  rd.onload = () => {
    ioImport(rd.result);
    el.value = '';
  };
  rd.readAsText(f);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const id = e.target && e.target.id;
  if (id === 'dsName') {
    e.preventDefault();
    dsCur() ? dsNameCommit() : dsSave(true);
  } else if (id === 'dsRen') {
    e.preventDefault();
    dsRename(e.target.dataset.id, e.target.value);
  } else if (id === 'rmName') {
    e.preventDefault();
    rmSave();
  } else if (id === 'dsFind') {
    e.preventDefault();
  }
});
document.addEventListener('input', e => {
  if (e.target && e.target.id === 'dsFind') {
    ui.dsFind = e.target.value;
    renderDesigns();
  }
});
document.addEventListener('change', e => {
  if (e.target && e.target.id === 'dsName' && dsCur()) dsNameCommit();
});
function dsNameCommit() {
  const c = dsCur(),
    el = document.getElementById('dsName');
  if (c && el) dsRename(c.id, el.value);
}
function shareHTML() {
  const nm = curName(),
    inList = !!dsCur();
  return `<div class="shgrid">
  <section class="shcard"><h3>Send this design</h3><p class="hintp">“${esc(nm)}” as a file the other person opens in Fitted. Your own colours and boards go with it.</p>
    <div class="dbtns"><button type="button" class="btn pri" data-act="ioFile">Download design file</button>${canShareFile() ? '<button type="button" class="btn" data-act="ioShare">Share…</button>' : ''}<button type="button" class="btn" data-act="ioCopyText">Copy as text</button></div>
    <p class="hintp" style="margin:0">“Copy as text” fits in an e-mail or chat message. ${DS.local ? '' : inList ? 'Anyone who opens this same Fitted page also finds it under My designs.' : 'Saved designs also show up for anyone who opens this same Fitted page.'}</p></section>
  <section class="shcard"><h3>Technical drawings</h3><p class="hintp">Sheets in A3 or A4, true to scale: front view, setting out, plan, sections, details and exploded boxes — plus the whole wall as DXF for CAD.</p>
    <div class="dbtns"><button type="button" class="btn pri" data-act="tdOpen">Technical drawings…</button></div></section>
  <section class="shcard"><h3>For the workshop</h3><p class="hintp">A PDF with the drawings, cut list and build guide — or the cut list files for the panel saw.</p>
    <div class="dbtns"><button type="button" class="btn" data-act="pdf">Download PDF</button><button type="button" class="btn" data-act="ioToCut">Cut list files</button></div></section>
  <section class="shcard"><h3>Send just the room</h3><p class="hintp">Only the measurements — wall, slopes, beams, sockets, doors — so someone can design for your room.</p>
    <div class="dbtns"><button type="button" class="btn" data-act="rmFile">Download room file</button><button type="button" class="btn" data-act="ioTab" data-a="rooms">My rooms</button></div></section>
  <section class="shcard"><h3>Open what someone sent you</h3><p class="hintp">A design or room file (.fitted.json), or text copied from Fitted.</p>
    <div class="dbtns"><label class="btn pri filebtn">Open a file…<input type="file" accept=".json,.fitted,application/json,text/plain" data-iofile></label></div>
    <textarea class="io" id="ioText" spellcheck="false" placeholder="…or paste the text here"></textarea><div class="dbtns"><button type="button" class="btn" data-act="ioLoad">Open pasted text</button></div></section>
  </div>`;
}
