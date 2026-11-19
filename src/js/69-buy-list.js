/* ==== 69-buy-list.js ====
   Order checklist (Parts → Shopping, at the top): everything to buy, grouped per shop, with a status per line:
     ○ to order  →  ◐ ordered  →  ● here (picked up or delivered)  →  back to ○   (tap the line)
   Per shop: "All ordered", "All here", and an order number / note.
   It is built from the priced lines (lastPrice.rows from priceRows, 66-prices-budget.js), so it always
   lists the shop the price comes from. The status is kept in the design, S.done.buy:
     S.done.buy = { items: { '<shop>|<line name>': { s: 'ordered' | 'here', at: time } },
                    shops: { '<shop>': { ref: 'order number or note' } } }
   S.done is what the build lock lets you change, so the list works while the design is locked, and it
   travels with the saved design to your other devices.
*/
const BUY_ANY = 'Any shop (typical prices)';
const BUY_NEXT = { '': 'ordered', ordered: 'here', here: '' };
const BUY_LABEL = { '': 'to order', ordered: 'ordered', here: 'here' };

function buyState() {
  S.done = S.done || {};
  const b = (S.done.buy = S.done.buy || {});
  b.items = b.items || {};
  b.shops = b.shops || {};
  return b;
}
const buyShop = r => (r.shop && r.shop !== 'Other' ? r.shop : BUY_ANY);
const buyKey = r => buyShop(r) + '|' + r.name;

function buyGroups(rows) {
  const by = {};
  (rows || []).forEach(r => {
    if (!(r.qty > 0)) return;
    const shop = buyShop(r);
    (by[shop] = by[shop] || []).push(r);
  });
  return Object.entries(by).sort((a, b) => b[1].reduce((s, r) => s + (r.total || 0), 0) - a[1].reduce((s, r) => s + (r.total || 0), 0));
}

function buyListHTML(price) {
  if (!price || !price.rows) return '';
  const st = buyState(),
    groups = buyGroups(price.rows);
  if (!groups.length) return '';
  let all = 0,
    here = 0;
  const body = groups
    .map(([shop, rows]) => {
      const n = rows.length,
        sum = rows.reduce((s, r) => s + (r.total || 0), 0),
        ss = rows.map(r => (st.items[buyKey(r)] || {}).s || ''),
        nHere = ss.filter(s => s === 'here').length,
        nOrd = ss.filter(s => s === 'ordered').length;
      all += n;
      here += nHere;
      const ref = (st.shops[shop] || {}).ref || '';
      return `<details class="buyshop"${nHere === n ? '' : ' open'}><summary><b>${esc(shop)}</b><span>${nHere === n ? '✓ all here' : `${nHere} of ${n} here${nOrd ? ` · ${nOrd} ordered` : ''}`} · ${eur(sum)}</span></summary>
      <div class="buyacts"><button type="button" class="btn sm" data-act="buyAll" data-a="${esc(shop)}|ordered">All ordered</button><button type="button" class="btn sm" data-act="buyAll" data-a="${esc(shop)}|here">All here</button><input type="text" placeholder="Order number or note" value="${esc(ref)}" data-buyref="${esc(shop)}" aria-label="Order number or note for ${esc(shop)}"></div>
      <ul>${rows
        .map((r, i) => {
          const s = ss[i];
          return `<li><button type="button" class="buyit ${s || 'todo'}" data-act="buyTap" data-a="${esc(buyKey(r))}" aria-label="${esc(r.name)}: ${BUY_LABEL[s]} — tap to change"><i aria-hidden="true"></i><span><b>${esc(r.name)}</b><small>${r.qty} ${esc(r.unitLbl || '')} · ${eur(r.total || 0)}${r.est ? ' · typical price' : ''}</small></span><em>${BUY_LABEL[s]}</em></button></li>`;
        })
        .join('')}</ul></details>`;
    })
    .join('');
  return `<div class="buylist" id="buylist"><div class="buyhead"><h3>Order checklist</h3><span>${here === all ? 'Everything is here' : `${here} of ${all} here`} · tap a line: to order → ordered → here</span></div>${body}</div>`;
}

function buySaved() {
  saveSoon();
  try {
    dsAutoSoon();
  } catch (e) {
    oops('buy list: save', e, 1);
  }
}
function buyRedraw() {
  const sc = document.getElementById('v-cut'),
    y = sc ? sc.scrollTop : 0;
  renderCut();
  if (sc) sc.scrollTop = y;
}
function buyTap(key) {
  const st = buyState(),
    cur = (st.items[key] || {}).s || '',
    nx = BUY_NEXT[cur];
  if (nx) st.items[key] = { s: nx, at: Date.now() };
  else delete st.items[key];
  buySaved();
  buyRedraw();
}
function buyAll(arg) {
  const i = arg.lastIndexOf('|'),
    shop = arg.slice(0, i),
    s = arg.slice(i + 1),
    st = buyState();
  ((lastPrice && lastPrice.rows) || []).filter(r => buyShop(r) === shop && r.qty > 0).forEach(r => (st.items[buyKey(r)] = { s, at: Date.now() }));
  buySaved();
  buyRedraw();
}
document.addEventListener('change', e => {
  const el = e.target;
  if (!el || !el.dataset || el.dataset.buyref == null) return;
  const st = buyState(),
    shop = el.dataset.buyref;
  st.shops[shop] = Object.assign(st.shops[shop] || {}, { ref: el.value.slice(0, 120) });
  buySaved();
});
