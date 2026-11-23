/* ==== 30-ui.js ====
   The four steps (1 Cabinets · 2 Fronts · 3 Handles · 4 Order), the panel for each, the price bar,
   and every tap. One render() redraws everything from S.
*/
const STEPS = [
  ['cabs', 'Cabinets'],
  ['fronts', 'Fronts'],
  ['handles', 'Handles'],
  ['order', 'Order']
];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/* a row of choices for one cabinet: data-a is "cabinet id|value" */
const segC = (act, c, cur, opts) =>
  `<div class="seg">${opts.map(([k, l]) => `<button type="button" class="${String(k) === String(cur) ? 'on' : ''}" data-act="${act}" data-a="${c.id}|${k}">${l}</button>`).join('')}</div>`;
const seg = (act, cur, opts) =>
  `<div class="seg">${opts.map(([k, l]) => `<button type="button" class="${String(k) === String(cur) ? 'on' : ''}" data-act="${act}" data-a="${k}">${l}</button>`).join('')}</div>`;

function render() {
  if (!matOk(S.style, S.mat)) S.mat = 'mdf';
  save();
  const i = STEPS.findIndex(s => s[0] === S.step);
  const stepBtns = STEPS.map(
    ([k, l], n) =>
      `<button type="button" class="${k === S.step ? 'on' : ''}${n < i ? ' done' : ''}" data-act="step" data-a="${k}"><i>${n < i ? '✓' : n + 1}</i><span>${l}</span></button>`
  ).join('');
  document.getElementById('steps').innerHTML = stepBtns;
  document.getElementById('bsteps').innerHTML = stepBtns;
  drawPic();
  const L = layout(),
    P = priceAll(L);
  document.getElementById('stagebar').innerHTML =
    `<span class="chip"><b>${SYS[S.sys].name}</b> ${SYS[S.sys].what}</span><span class="chip">${P.n} front${P.n === 1 ? '' : 's'}</span><span class="chip">${STYLES[S.style].name}${S.style === 'fluted' ? ' · ' + (FLUTE.pitch.find(p => p[0] === S.flute.pitch) || [0, ''])[1].toLowerCase() : ''}</span><span class="chip"><i class="sw" style="background:${faceColour()}"></i>${esc(colourName())}</span>`;
  document.getElementById('pichint').textContent = L.fronts.some(f => f.hinge)
    ? 'Tap a door to swap the side it hinges on.'
    : '';
  document.getElementById('pbar').innerHTML =
    `<div class="ptot"><span>${P.n} front${P.n === 1 ? '' : 's'} · incl. VAT${P.del ? ' + delivery' : ''}</span><b>${eur(P.total)}</b></div>${
      S.step === 'order'
        ? ''
        : `<button type="button" class="btn ghost" data-act="next">${i < STEPS.length - 2 ? 'Next: ' + STEPS[i + 1][1] : 'See the order'} →</button>`
    }<button type="button" class="btn pri" data-act="orderNow" ${P.n ? '' : 'disabled'}>Order</button>`;
  const panel = document.getElementById('panel');
  panel.innerHTML = { cabs: cabsHTML, fronts: frontsHTML, handles: handlesHTML, order: orderHTML }[S.step](L, P);
  document.getElementById('app').dataset.step = S.step;
}
function colourName() {
  const m = MATS[S.mat];
  if (m.paint) return `RAL ${S.ral} ${(RAL[S.ral] || {}).name || ''}`;
  if (m.lino) return 'Linoleum ' + (LINO.find(l => l[0] === S.lino) || LINO[0])[1].toLowerCase();
  return m.name;
}

/* ---------- 1 Cabinets ---------- */
function cabsHTML() {
  const sysBtns = Object.entries(SYS)
    .map(
      ([k, s]) =>
        `<button type="button" class="sys ${k === S.sys ? 'on' : ''}" data-act="sys" data-a="${k}"><b>${s.name}</b><span>${s.what}</span><small>${s.blurb}</small></button>`
    )
    .join('');
  const kinds = SYS[S.sys].kinds;
  const card = (c, n) => {
    const kd = kinds[c.kind];
    return `<div class="cab"><div class="cabh"><b>${n + 1}</b><span>${S.sys === 'metod' ? kd.label : SYS[S.sys].name + ' frame'}</span><span class="sp"></span><button type="button" class="ib" data-act="mv" data-a="${c.id}|-1" aria-label="Move left">◀</button><button type="button" class="ib" data-act="mv" data-a="${c.id}|1" aria-label="Move right">▶</button><button type="button" class="ib" data-act="del" data-a="${c.id}" aria-label="Remove">✕</button></div>
      <div class="row"><label>Width</label>${segC(
        'cw',
        c,
        c.w,
        kd.widths.map(v => [v, v])
      )}</div>
      ${
        kd.heights.length > 1
          ? `<div class="row"><label>Height</label>${segC(
              'ch',
              c,
              c.h,
              kd.heights.map(v => [v, v])
            )}</div>`
          : ''
      }
      <div class="row"><label>Fronts</label>${segC(
        'cl',
        c,
        c.layout,
        layoutsFor(c).map(([k, l]) => [k, l])
      )}</div></div>`;
  };
  const cards = S.cabs.map(card).join('');
  const adds = Object.entries(kinds)
    .map(
      ([k, kd]) =>
        `<button type="button" class="btn" data-act="add" data-a="${k}">+ ${S.sys === 'metod' ? kd.label.toLowerCase() : 'frame'}</button>`
    )
    .join('');
  return `<h2>What do you have?</h2><p class="lede">Pick your IKEA system, then add your cabinets from left to right. Or paste the list from the IKEA planner.</p>
    <div class="syss">${sysBtns}</div>
    <div class="cabs">${cards || '<p class="hint">No cabinets yet — add one below.</p>'}</div>
    <div class="adds">${adds}</div>
    <details class="imp"${S.impOpen ? ' open' : ''}><summary>Paste your IKEA planner list</summary>
      <p class="hint">Copy the item list from the IKEA planner (or type it) and paste it here. Frames and cabinets are picked up with their sizes; doors, hinges and legs are skipped.</p>
      <textarea id="impText" rows="6" placeholder="PAX Wardrobe frame, white, 100x58x236 cm   2 pcs">${esc(S.impText || '')}</textarea>
      <div class="adds"><button type="button" class="btn pri" data-act="imp">Read the list</button><button type="button" class="btn" data-act="impEx">Try an example</button></div>
      ${S.impMsg ? `<p class="hint">${S.impMsg}</p>` : ''}</details>`;
}

/* ---------- 2 Fronts ---------- */
function frontsHTML() {
  const styles = Object.entries(STYLES)
    .map(
      ([k, s]) =>
        `<button type="button" class="stc ${k === S.style ? 'on' : ''}" data-act="style" data-a="${k}">${styleThumb(k)}<b>${s.name}</b><small>${s.blurb}</small></button>`
    )
    .join('');
  const mats = Object.entries(MATS)
    .map(([k, m]) => {
      const ok = matOk(S.style, k);
      return `<button type="button" class="mat ${k === S.mat ? 'on' : ''}" data-act="mat" data-a="${k}" ${ok ? '' : 'disabled title="Not made in this style"'}><i class="sw" style="background:${m.paint ? (RAL[S.ral] || {}).hex : m.lino ? (LINO.find(l => l[0] === S.lino) || LINO[0])[2] : m.wood}"></i><b>${m.name}</b><small>${ok ? m.blurb : 'not in ' + STYLES[S.style].name.toLowerCase()}</small></button>`;
    })
    .join('');
  let col = '';
  if (MATS[S.mat].paint)
    col = `<h3>Colour</h3><div class="sws">${RAL_PICK.map(k => `<button type="button" class="swb ${k === S.ral ? 'on' : ''}" data-act="ral" data-a="${k}" title="RAL ${k} ${esc(RAL[k].name)}" style="background:${RAL[k].hex}"></button>`).join('')}</div>
    <label class="field"><span>Any RAL colour</span><select data-ch="ral">${Object.entries(RAL)
      .map(([k, r]) => `<option value="${k}" ${k === S.ral ? 'selected' : ''}>RAL ${k} ${esc(r.name)}</option>`)
      .join('')}</select></label>`;
  if (MATS[S.mat].lino)
    col = `<h3>Colour</h3><div class="sws">${LINO.map(([k, n, h]) => `<button type="button" class="swb ${k === S.lino ? 'on' : ''}" data-act="lino" data-a="${k}" title="${n}" style="background:${h}"></button>`).join('')}</div>`;
  const flute =
    S.style === 'fluted'
      ? `<div class="row"><label>Flutes</label>${seg(
          'pitch',
          S.flute.pitch,
          FLUTE.pitch.map(([v, l]) => [v, `${l} <small>${v} mm</small>`])
        )}</div><div class="row"><label>Direction</label>${seg('fdir', S.flute.dir, FLUTE.dir)}</div>`
      : '';
  return `<h2>Your fronts</h2><p class="lede">One style for every front — 19 mm thick, made to the exact IKEA sizes and drilled for the IKEA hinges you already have.</p>
    <h3>Style</h3><div class="stcs">${styles}</div>${flute}
    <h3>Material</h3><div class="mats">${mats}</div>${col}`;
}

/* ---------- 3 Handles ---------- */
function handlesHTML(L) {
  const hs = Object.entries(HANDLES)
    .map(
      ([k, h]) =>
        `<button type="button" class="mat ${k === S.handle ? 'on' : ''}" data-act="handle" data-a="${k}"><b>${h.name}</b><small>${h.blurb} · ${eur(h.price)} a front</small></button>`
    )
    .join('');
  const fins =
    S.handle === 'knob' || S.handle === 'bar' || S.handle === 'tab'
      ? `<h3>Finish</h3>${seg(
          'hfin',
          S.hfin,
          Object.entries(HFIN)
            .filter(([k]) => S.handle !== 'tab' || k !== 'steel')
            .map(([k, f]) => [k, f.name])
        )}`
      : '';
  const doors = L.fronts.filter(f => f.hinge).length;
  return `<h2>Handles</h2><p class="lede">The same handle on every front. Doors get it on the side that opens, drawers in the middle.</p>
    <div class="mats">${hs}</div>${fins}
    ${doors ? `<h3>Hinge sides</h3><p class="hint">Tap a door in the picture to swap the side it hinges on — the handle moves with it. ${Object.keys(S.flip).length ? `<button type="button" class="linkb" data-act="unflip">Put all doors back</button>` : ''}</p>` : ''}`;
}

/* ---------- 4 Order ---------- */
function orderHTML(L, P) {
  const g = grouped(L);
  const rows = g
    .map(
      r =>
        `<tr><td>${r.n}×</td><td>${r.kind === 'door' ? 'Door' + (r.hinge ? ` <small>hinge ${r.hinge === 'L' ? 'left' : 'right'}</small>` : '') : 'Drawer front'}</td><td class="num">${f1(r.w)} × ${f1(r.h)}<small>IKEA ${r.nom}</small></td><td class="num">${eur(r.p * r.n)}</td></tr>`
    )
    .join('');
  return `<h2>Your order</h2><p class="lede">${P.n} fronts in ${esc(STYLES[S.style].name.toLowerCase())} ${esc(colourName())}, with ${esc(HANDLES[S.handle].name.toLowerCase())}${S.handle === 'push' ? ' latches' : S.handle === 'grip' ? 's' : 's in ' + esc(HFIN[S.hfin].name.toLowerCase())}. Made to measure and drilled for your IKEA hinges; ready ${LEAD} after you order.</p>
    ${
      P.n
        ? `<table class="ord"><thead><tr><th></th><th>Front</th><th class="num">Size, mm</th><th class="num">Price</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td></td><td colspan="2">Fronts</td><td class="num">${eur(P.sub)}</td></tr><tr><td></td><td colspan="2">Delivery${P.del ? ` <small>free from ${eur(PRICE.deliveryFree)}</small>` : ' — free'}</td><td class="num">${P.del ? eur(P.del) : '€ 0'}</td></tr><tr class="tot"><td></td><td colspan="2">Total incl. VAT</td><td class="num">${eur(P.total)}</td></tr></tfoot></table>
    <button type="button" class="btn pri big" data-act="orderNow">Order these fronts</button>`
        : '<p class="hint">Add a cabinet with fronts first.</p>'
    }
    <p class="hint">Keep your IKEA frames, hinges and drawers — only the fronts change. Hinges and drawer fittings are not included.</p>`;
}
const f1 = v => (Math.round(v * 10) / 10).toString();

/* ---------- order form (prototype: nothing is sent) ---------- */
function openOrder() {
  const L = layout(),
    P = priceAll(L);
  if (!P.n) return;
  const box = document.getElementById('mbox');
  box.innerHTML = `<h2>Order your fronts</h2><p class="lede">${P.n} fronts · <b>${eur(P.total)}</b> incl. VAT and delivery. We check every size with you before we cut.</p>
    <label class="field"><span>Your name</span><input id="oName" autocomplete="name"></label>
    <label class="field"><span>E-mail</span><input id="oMail" type="email" autocomplete="email"></label>
    <label class="field"><span>Postcode</span><input id="oZip" autocomplete="postal-code"></label>
    <label class="field"><span>Anything we should know?</span><textarea id="oNote" rows="3" placeholder="e.g. the left wall is not straight"></textarea></label>
    <div class="adds"><button type="button" class="btn pri" data-act="send">Send order request</button><button type="button" class="btn" data-act="close">Not now</button></div>
    <p class="hint">This is a prototype: the request is not sent anywhere yet.</p>`;
  document.getElementById('modal').hidden = false;
  setTimeout(() => document.getElementById('oName').focus(), 30);
}
function orderText() {
  const L = layout(),
    P = priceAll(L);
  return [
    `BRUIS Fronts — order request`,
    `${SYS[S.sys].name} · ${STYLES[S.style].name}${S.style === 'fluted' ? ` (${S.flute.pitch} mm, ${S.flute.dir === 'v' ? 'vertical' : 'horizontal'})` : ''} · ${MATS[S.mat].name} · ${colourName()}`,
    `Handles: ${HANDLES[S.handle].name}${S.handle === 'knob' || S.handle === 'bar' || S.handle === 'tab' ? ', ' + HFIN[S.hfin].name : ''}`,
    '',
    ...grouped(L).map(
      r =>
        `${r.n} × ${r.kind === 'door' ? 'door' : 'drawer front'} ${f1(r.w)} × ${f1(r.h)} mm (IKEA ${r.nom})${r.hinge ? ', hinge ' + (r.hinge === 'L' ? 'left' : 'right') : ''}`
    ),
    '',
    `Total ${eur(P.total)} incl. VAT${P.del ? ' and delivery' : ''}`
  ].join('\n');
}
function sendOrder() {
  const v = id => (document.getElementById(id).value || '').trim();
  if (!v('oName') || !/.+@.+\..+/.test(v('oMail'))) {
    document.querySelector('#mbox .hint').textContent = 'Please fill in your name and a valid e-mail address.';
    return;
  }
  const txt = orderText() + `\n\nFrom: ${v('oName')} <${v('oMail')}>, ${v('oZip')}\n${v('oNote')}`;
  try {
    const all = JSON.parse(localStorage.getItem('bruis-fronts-orders') || '[]');
    all.push({ at: Date.now(), txt });
    localStorage.setItem('bruis-fronts-orders', JSON.stringify(all));
  } catch (e) {
    /* fine */
  }
  document.getElementById('mbox').innerHTML =
    `<h2>Thank you, ${esc(v('oName').split(' ')[0])}!</h2><p class="lede">In the real shop BRUIS would now e-mail you to check the sizes and send a payment link. In this prototype nothing was sent — here is the order as text:</p><pre class="otext">${esc(txt)}</pre><div class="adds"><button type="button" class="btn pri" data-act="copyOrder">Copy</button><button type="button" class="btn" data-act="close">Close</button></div>`;
  S.lastOrder = txt;
  save();
}

/* ---------- taps ---------- */
document.addEventListener('click', e => {
  const fr = e.target.closest('#pic .front.hd');
  if (fr && !e.target.closest('[data-act]')) {
    const id = fr.dataset.f;
    if (S.flip[id]) delete S.flip[id];
    else S.flip[id] = 1;
    render();
    return;
  }
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const a = b.dataset.a || '',
    [id, val] = a.split('|'),
    c = S.cabs.find(x => x.id === id);
  switch (b.dataset.act) {
    case 'step':
      S.step = a;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'next': {
      const i = STEPS.findIndex(s => s[0] === S.step);
      S.step = STEPS[Math.min(STEPS.length - 1, i + 1)][0];
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    }
    case 'sys':
      if (a !== S.sys) {
        // another system starts from an example row of its cabinets; the look you chose stays
        const keep = {
          style: S.style,
          flute: S.flute,
          mat: S.mat,
          ral: S.ral,
          lino: S.lino,
          handle: S.handle,
          hfin: S.hfin
        };
        S = Object.assign(freshState(a), keep, { step: 'cabs' });
      }
      break;
    case 'cw':
      if (c) {
        c.w = +val;
        fixLayout(c);
      }
      break;
    case 'ch':
      if (c) {
        c.h = +val;
        fixLayout(c);
      }
      break;
    case 'cl':
      if (c) c.layout = val;
      break;
    case 'mv': {
      const i = S.cabs.indexOf(c),
        j = i + +val;
      if (c && j >= 0 && j < S.cabs.length) [S.cabs[i], S.cabs[j]] = [S.cabs[j], S.cabs[i]];
      break;
    }
    case 'del':
      S.cabs = S.cabs.filter(x => x !== c);
      break;
    case 'add': {
      const kd = SYS[S.sys].kinds[a];
      S.cabs.push(
        cab(
          S.sys,
          a,
          kd.widths.includes(60) ? 60 : kd.widths[kd.widths.length - 1],
          kd.heights[
            kd.heights.length > 1 && S.sys === 'pax' ? 1 : kd.heights.includes(80) ? kd.heights.indexOf(80) : 0
          ]
        )
      );
      break;
    }
    case 'impEx':
      S.impText = IMPORT_EXAMPLE;
      S.impOpen = true;
      S.impMsg = '';
      break;
    case 'imp': {
      const t = document.getElementById('impText').value;
      S.impText = t;
      S.impOpen = true;
      const r = parsePlanner(t);
      if (!r.found.length) {
        S.impMsg =
          'No PAX, METOD or BESTÅ frames found in that list. Each line needs the name and a size like 60x60x80 cm.';
        break;
      }
      const bySys = {};
      r.found.forEach(x => (bySys[x.sys] = (bySys[x.sys] || 0) + 1));
      const main = Object.entries(bySys).sort((p, q) => q[1] - p[1])[0][0];
      S.sys = main;
      S.cabs = r.found.filter(x => x.sys === main);
      S.flip = {};
      const other = Object.entries(bySys).filter(([k]) => k !== main);
      S.impMsg = `Found ${S.cabs.length} ${SYS[main].name} cabinet${S.cabs.length === 1 ? '' : 's'}.${other.length ? ` The list also has ${other.map(([k, n]) => `${n} ${SYS[k].name}`).join(' and ')} — one system per order for now; switch above to do those next.` : ''}${r.skipped.length ? ` Skipped ${r.skipped.length} line${r.skipped.length === 1 ? '' : 's'} that are not frames.` : ''}`;
      break;
    }
    case 'style':
      S.style = a;
      if (!matOk(a, S.mat)) S.mat = 'mdf';
      break;
    case 'pitch':
      S.flute.pitch = +a;
      break;
    case 'fdir':
      S.flute.dir = a;
      break;
    case 'mat':
      S.mat = a;
      break;
    case 'ral':
      S.ral = a;
      break;
    case 'lino':
      S.lino = a;
      break;
    case 'handle':
      S.handle = a;
      if (a === 'tab' && S.hfin === 'steel') S.hfin = 'black';
      break;
    case 'hfin':
      S.hfin = a;
      break;
    case 'unflip':
      S.flip = {};
      break;
    case 'orderNow':
      openOrder();
      return;
    case 'send':
      sendOrder();
      return;
    case 'copyOrder':
      try {
        navigator.clipboard.writeText(S.lastOrder || orderText());
        b.textContent = 'Copied';
      } catch (er) {
        /* ignore */
      }
      return;
    case 'close':
      document.getElementById('modal').hidden = true;
      return;
    default:
      return;
  }
  render();
});
document.addEventListener('change', e => {
  if (e.target.dataset.ch === 'ral') {
    S.ral = e.target.value;
    render();
  }
});
document.addEventListener(
  'toggle',
  e => {
    if (e.target.classList && e.target.classList.contains('imp')) S.impOpen = e.target.open;
  },
  true
);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('modal').hidden = true;
});
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') e.currentTarget.hidden = true;
});
render();
