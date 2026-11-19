/* ==== 68-my-shops.js ====
   Your own shops and board prices (Parts → Price → Your shops and board prices).
   A shop: name, website, delivery cost, free delivery from (order amount), pick-up (and its cost),
           edge banding per metre, cutting service per cut.
   A price: shop, board type, colour/veneer (or any colour), thickness, sheet size, price per sheet.
   priceRows() (66-prices-budget.js) asks msOffer() for every sheet material: the cheapest of your prices
   (or the shop you chose) wins over the built-in prices. Delivery is counted per shop with the free-delivery
   threshold, or the pick-up cost. Saved in this browser and, when the app can, in your own private space.
*/
const MS_LS='fitted-myshops';let MS={shops:[],offers:[]};
try{const o=JSON.parse(localStorage.getItem(MS_LS)||'null');if(o&&Array.isArray(o.shops))MS={shops:o.shops,offers:Array.isArray(o.offers)?o.offers:[]}}catch(e){}
let msDoc=null,msT=null;
async function msInit(){try{if(!(window.claude&&claude.use))return;const db=await claude.use('db'),u=await claude.use('user');if(!db||!u||!u.id)return;const id=await u.id();if(!id)return;msDoc=db.doc(`data/users/${id}/fitted/myshops`);
  const d=await msDoc.get();const v=d&&(d.data?d.data():d);if(v&&Array.isArray(v.shops)&&(v.shops.length||v.offers&&v.offers.length)&&!MS.shops.length&&!MS.offers.length){MS={shops:v.shops,offers:v.offers||[]};msLocal();dirty.cut=true;if(ui.tab==='cut')renderCut()}}catch(e){msDoc=null}}
function msLocal(){try{localStorage.setItem(MS_LS,JSON.stringify(MS))}catch(e){}}
function msSave(){msLocal();clearTimeout(msT);msT=setTimeout(()=>{try{msDoc&&msDoc.set({shops:MS.shops,offers:MS.offers,updatedAt:Date.now()})}catch(e){}},800);groupsCache=null;dirty.cut=true;if(ui.tab==='cut'){const sc=document.getElementById('v-cut'),y=sc?sc.scrollTop:0;renderCut();if(sc)sc.scrollTop=y}try{priceSoon()}catch(e){}}
const msShop=id=>MS.shops.find(s=>s.id===id)||null;
const msArea=sheet=>{const s=sheetOf(sheet);return s.L*s.W/1e6};
/* the best of your prices for one sheet material of the design */
function msOffer(n){const pick=S.opts.msShop||'';const ok=MS.offers.filter(o=>o.mt===n.mt&&Math.abs(+o.t-+n.t)<0.6&&(o.fin==='*'||o.fin===n.fin)&&msShop(o.shop)&&(!pick||o.shop===pick)&&+o.price>0);
  if(!ok.length)return null;const per=o=>+o.price/msArea(o.sheet);ok.sort((a,b)=>(a.fin==='*')-(b.fin==='*')||per(a)-per(b));const o=ok[0],same=sheetOf(o.sheet).L===sheetOf(n.sheet).L&&sheetOf(o.sheet).W===sheetOf(n.sheet).W;
  return {o,shop:msShop(o.shop),same,unit:same?+o.price:Math.round(per(o)*msArea(n.sheet)*100)/100}}
/* delivery / pick-up for one of your shops, given what you buy there */
function msShip(name,sub){const s=MS.shops.find(x=>x.name===name);if(!s)return null;const pick=!!(S.opts.msPick||{})[s.id];
  if(pick)return {name:`Pick-up at ${s.name}`,u:+s.pickCost||0,ref:s.pickNote||'You collect the order yourself'};
  const free=+s.freeFrom||0,c=+s.ship||0;if(free>0&&sub>=free)return {name:`Delivery from ${s.name} — free`,u:0,ref:`Free delivery from € ${free.toFixed(2)}; this order is € ${sub.toFixed(2)}`};
  return {name:`Delivery from ${s.name}`,u:c,ref:free>0?`Free from € ${free.toFixed(2)} — € ${(free-sub).toFixed(2)} more and delivery is free`:'Your delivery cost'}}
/* ---------- the panel ---------- */
function msFinOpts(sel){const used=[...new Set(Object.values(S.mat).map(m=>m.fin))],tex=Object.entries(FIN).filter(([k,f])=>!f.ral&&!f.hidden&&!used.includes(k)),ral=Object.entries(FIN).filter(([k,f])=>f.ral&&!used.includes(k));
  const o=(k,l)=>`<option value="${esc(k)}"${k===sel?' selected':''}>${esc(l)}</option>`;return o('*','Any colour')+`<optgroup label="In this design">${used.filter(k=>FIN[k]).map(k=>o(k,FIN[k].name)).join('')}</optgroup><optgroup label="Wood, textures, your colours">${tex.map(([k,f])=>o(k,f.name)).join('')}</optgroup><optgroup label="RAL colours">${ral.map(([k,f])=>o(k,f.name)).join('')}</optgroup>`}
function msMatOpts(sel){return Object.entries(MATS).map(([k,m])=>`<option value="${k}"${k===sel?' selected':''}>${esc(m.name)}</option>`).join('')}
function msShopOpts(sel){return MS.shops.map(s=>`<option value="${s.id}"${s.id===sel?' selected':''}>${esc(s.name)}</option>`).join('')}
function msHTML(nest){const used=[];(nest||[]).forEach(n=>{const k=n.mt+'|'+n.fin+'|'+n.t+'|'+n.sheet;if(!used.some(u=>u.k===k))used.push({k,n,cnt:n.sheets.length+(n.over&&n.over.length?1:0)})});
  const pick=S.opts.msShop||'',P=S.opts.msPick||{};
  const status=used.map(({n,cnt})=>{const m=msOffer(n);return `<div class="msst ${m?'ok':''}"><span><b>${esc(n.name)} mm</b> · ${n.sheet.replace('x',' × ')} · ${cnt} sheet${cnt>1?'s':''}</span>${m?`<em>€ ${m.unit.toFixed(2)} a sheet at ${esc(m.shop.name)}${m.same?'':` (their sheet is ${m.o.sheet.replace('x',' × ')} — priced per m²; <button type="button" class="linkb" data-act="msSheet" data-a="${esc(n.mt)}|${esc(m.o.sheet)}">use their sheet size</button>)`}</em>`:`<button type="button" class="btn sm" data-act="msAddFor" data-a="${esc(n.mt)}|${esc(n.fin)}|${n.t}|${esc(n.sheet)}" ${MS.shops.length?'':'disabled'}>+ Add my price</button>`}</div>`}).join('');
  const shopRow=s=>`<tr data-ms-shop="${s.id}"><td><input data-ms="name" value="${esc(s.name)}" aria-label="Shop name"></td><td><input data-ms="url" value="${esc(s.url||'')}" placeholder="website" aria-label="Website"></td><td><input data-ms="ship" type="number" inputmode="decimal" value="${s.ship??''}" aria-label="Delivery cost"></td><td><input data-ms="freeFrom" type="number" inputmode="decimal" value="${s.freeFrom??''}" placeholder="—" aria-label="Free delivery from"></td>
    <td><label class="mschk"><input type="checkbox" data-ms="pick" ${P[s.id]?'checked':''}> pick up</label><input data-ms="pickCost" type="number" inputmode="decimal" value="${s.pickCost??''}" placeholder="€ 0" aria-label="Pick-up cost"></td><td><input data-ms="edgeM" type="number" inputmode="decimal" value="${s.edgeM??''}" placeholder="—" aria-label="Edge banding per metre"></td><td><input data-ms="cutEach" type="number" inputmode="decimal" value="${s.cutEach??''}" placeholder="—" aria-label="Cutting per cut"></td><td><button type="button" class="rowbtn" data-act="msDelShop" data-a="${s.id}" aria-label="Remove ${esc(s.name)}">×</button></td></tr>`;
  const offRow=o=>`<tr data-ms-off="${o.id}"><td><select data-ms="shop">${msShopOpts(o.shop)}</select></td><td><select data-ms="mt">${msMatOpts(o.mt)}</select></td><td><select data-ms="fin">${msFinOpts(o.fin)}</select></td><td><input data-ms="t" type="number" inputmode="decimal" value="${o.t}" aria-label="Thickness"></td><td><input data-ms="sheet" list="msSheets" value="${esc(o.sheet)}" aria-label="Sheet size"></td><td><input data-ms="price" type="number" inputmode="decimal" value="${o.price??''}" aria-label="Price per sheet"></td><td><input data-ms="note" value="${esc(o.note||'')}" placeholder="article nr, note" aria-label="Note"></td><td><button type="button" class="rowbtn" data-act="msDelOff" data-a="${o.id}" aria-label="Remove this price">×</button></td></tr>`;
  return `<details class="pf mscard"${ui.msOpen!==false?' open':''} data-msopen="1"><summary>Your shops and board prices${MS.offers.length?` · ${MS.offers.length} price${MS.offers.length>1?'s':''}`:''}</summary><div class="msb">
    <p class="hintp" style="margin:0">Add the shops you buy from and what a sheet costs there — per board, colour or veneer, thickness and sheet size. Fitted uses the cheapest of your prices (or the shop you pick), adds delivery per shop (free above the amount you enter) or the pick-up cost, and your edge banding and cutting prices. Saved in this browser${msDoc?' and in your account':''}, for every design.</p>
    ${MS.shops.length?`<div class="fld"><span>Buy the boards from</span><div class="seg wrap"><button type="button" class="${!pick?'on':''}" data-act="msPickShop" data-a="">Cheapest of my shops</button>${MS.shops.map(s=>`<button type="button" class="${pick===s.id?'on':''}" data-act="msPickShop" data-a="${s.id}">${esc(s.name)}</button>`).join('')}</div></div>`:''}
    ${used.length?`<div class="msstl"><b>This design</b>${status}</div>`:''}
    <h4>Shops</h4><div class="tw"><table class="cut mst"><thead><tr><th>Shop</th><th>Website</th><th>Delivery €</th><th>Free from €</th><th>Pick-up €</th><th>Edge band €/m</th><th>Cutting €/cut</th><th></th></tr></thead><tbody>${MS.shops.map(shopRow).join('')||'<tr><td colspan="8" class="note">No shops yet.</td></tr>'}</tbody></table></div>
    <div class="dbtns"><button type="button" class="btn sm" data-act="msAddShop">+ Add a shop</button></div>
    <h4>Board prices</h4>${MS.shops.length?`<div class="tw"><table class="cut mst"><thead><tr><th>Shop</th><th>Board</th><th>Colour / veneer</th><th>mm</th><th>Sheet</th><th>€ / sheet</th><th>Note</th><th></th></tr></thead><tbody>${MS.offers.map(offRow).join('')||'<tr><td colspan="8" class="note">No prices yet — add one, or tap “+ Add my price” above.</td></tr>'}</tbody></table></div>
    <div class="dbtns"><button type="button" class="btn sm" data-act="msAddOff">+ Add a board price</button></div>`:'<p class="hintp" style="margin:0">Add a shop first.</p>'}
    <datalist id="msSheets">${SHEETS.map(s=>`<option value="${s}">`).join('')}</datalist></div></details>`}
function msNewId(){return 'm'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)}
function msAddShop(){MS.shops.push({id:msNewId(),name:'My shop '+(MS.shops.length+1),url:'',ship:0,freeFrom:0,pickCost:0,edgeM:'',cutEach:''});msSave()}
function msAddOff(pre){if(!MS.shops.length){msAddShop()}const p=pre||{};const sh=S.opts.msShop||MS.shops[0].id;MS.offers.push({id:msNewId(),shop:sh,mt:p.mt||S.mat.carcass.type,fin:p.fin||'*',t:+p.t||18,sheet:p.sheet||'2800x2070',price:'',note:''});ui.msOpen=true;msSave();
  setTimeout(()=>{const r=document.querySelector(`[data-ms-off="${MS.offers[MS.offers.length-1].id}"] [data-ms="price"]`);if(r){r.focus();r.scrollIntoView({block:'center'})}},80)}
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.dataset||!el.dataset.ms)return;const f=el.dataset.ms,rs=el.closest('[data-ms-shop]'),ro=el.closest('[data-ms-off]');
  if(rs){const s=msShop(rs.dataset.msShop);if(!s)return;if(f==='pick'){S.opts.msPick=Object.assign({},S.opts.msPick,{[s.id]:el.checked});saveSoon();msSave();return}s[f]=el.type==='number'?(el.value===''?'':+el.value):el.value.trim();msSave();return}
  if(ro){const o=MS.offers.find(x=>x.id===ro.dataset.msOff);if(!o)return;let v=el.value;if(f==='t'||f==='price')v=v===''?'':+v;if(f==='sheet')v=String(v).replace(/\s*[×x*]\s*/,'x');o[f]=v;msSave()}});
document.addEventListener('toggle',e=>{if(e.target&&e.target.dataset&&e.target.dataset.msopen)ui.msOpen=e.target.open},true);
