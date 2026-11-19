/* ==== 46-custom.js ====
   Your own boards and colours.
   A custom colour becomes a finish (FIN key 'cu_…'), a custom board a board type (MATS key 'cm_…').
   They are kept in two places: in the design itself (S.custom), so a shared or reopened design still has them,
   and in this browser's library, so every new design can use them too. regCustom() puts both into FIN and MATS;
   build() calls it, so anything that builds a design knows its custom boards and colours.
*/
const CU_LS='fitted-custom';
let CU_LIB={fins:{},mats:{}};try{const o=JSON.parse(localStorage.getItem(CU_LS)||'null');if(o&&typeof o==='object')CU_LIB={fins:o.fins||{},mats:o.mats||{}}}catch(e){}
const CU_KINDS=[['plain','Plain colour'],['wood','Wood grain'],['stone','Stone / speckled']];
const CU_FINS=[['all','Any colour'],['wood','Wood finishes only'],['ral','Paint colours only']];
function cuHex(h){return /^#[0-9a-f]{6}$/i.test(String(h||''))?String(h).toUpperCase():'#CCCCCC'}
function cuShade(hex,f){const n=parseInt(hex.slice(1),16),c=[n>>16,(n>>8)&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(f<0?v*(1+f):v+(255-v)*f))));return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')}
function cuFin(c){const b=cuHex(c.base),kind=CU_KINDS.some(k=>k[0]===c.kind)?c.kind:'plain';return {name:String(c.name||'My colour').slice(0,48),base:b,grain:cuShade(b,kind==='stone'?-0.25:-0.4),kind,rough:kind==='plain'?.5:.6,custom:true}}
function cuMat(m){const t=Math.max(3,Math.min(60,+m.t||18)),sh=/^\d{3,4}x\d{3,4}$/.test(String(m.sheet||''))?m.sheet:'2800x2070';
  return {name:String(m.name||'My board').slice(0,48),short:String(m.name||'My board').slice(0,18),t,sheet:sh,edge:String(m.edge||'Edge band to match').slice(0,80),sag:750,fins:CU_FINS.some(k=>k[0]===m.fins)?m.fins:'all',rough:.5,custom:true}}
let cuSig='';
function regCustom(st){const C=(st&&st.custom)||{},all={fins:Object.assign({},CU_LIB.fins,C.fins||{}),mats:Object.assign({},CU_LIB.mats,C.mats||{})},sig=JSON.stringify(all);if(sig===cuSig)return;cuSig=sig;let defs=false;
  Object.entries(all.fins).forEach(([k,c])=>{if(!/^cu_/.test(k))return;const f=cuFin(c),o=FIN[k];if(!o||o.base!==f.base||o.kind!==f.kind||o.name!==f.name){FIN[k]=f;defs=true}});
  Object.entries(all.mats).forEach(([k,m])=>{if(!/^cm_/.test(k))return;MATS[k]=cuMat(m)});
  if(defs&&typeof document!=='undefined'&&document.getElementById('gdefs'))try{buildDefs()}catch(e){}}
function cuSave(){try{localStorage.setItem(CU_LS,JSON.stringify(CU_LIB))}catch(e){}}
function cuVal(id){const e=document.getElementById(id);return e?e.value.trim():''}
/* add a colour; returns its key */
function cuAddFin(name,base,kind){if(!name){toast('Give the colour a name first');return null}const k='cu_'+uid().slice(1,9),c={name,base:cuHex(base),kind};
  S.custom=S.custom||{};S.custom.fins=Object.assign({},S.custom.fins,{[k]:c});CU_LIB.fins[k]=c;cuSave();regCustom(S);return k}
function cuAddMat(){const name=cuVal('cuMName');if(!name){toast('Give the board a name first');return}const k='cm_'+uid().slice(1,9),sheet=cuVal('cuMSheet').replace(/\s*[×x*]\s*/,'x'),m={name,t:+cuVal('cuMT')||18,sheet,fins:cuVal('cuMFins')||'all',edge:cuVal('cuMEdge')},p=parseFloat(cuVal('cuMPrice').replace(',','.'));
  S.custom=S.custom||{};S.custom.mats=Object.assign({},S.custom.mats,{[k]:m});CU_LIB.mats[k]=m;cuSave();regCustom(S);if(p>0){S.opts.myM2=S.opts.myM2||{};S.opts.myM2[k]=p}
  ui.cuOpen=true;changed(true);toast(`${name} added — choose it as the board for any part under Materials`)}
/* remove from the library and the design; parts that used it go back to a standard board or colour */
function cuDel(k){if(!/^c[um]_/.test(String(k)))return;const isM=/^cm_/.test(k),grp=isM?'mats':'fins',nm=((isM?MATS:FIN)[k]||{}).name||'';delete CU_LIB[grp][k];if(S.custom&&S.custom[grp])delete S.custom[grp][k];cuSave();
  if(isM){Object.values(S.mat).forEach(m=>{if(m.type===k){m.type='melamine';m.t=18;m.sheet=MATS.melamine.sheet}});(S.sections||[]).forEach(s=>(s.zones||[]).forEach(z=>{if(z.mat===k)delete z.mat}));if(S.opts.myM2)delete S.opts.myM2[k];delete MATS[k]}
  else{const walk=o=>{if(!o||typeof o!=='object')return;for(const x in o){if(o[x]===k)o[x]=Array.isArray(o)?'':'ral9010';else if(typeof o[x]==='object')walk(o[x])}};walk(S.sections);walk(S.mat);walk(S.opts);delete FIN[k]}
  cuSig='';regCustom(S);changed(true);toast(`${nm} removed`)}
function cuUsed(k){const s=JSON.stringify([S.mat,S.sections,S.opts]);return s.includes('"'+k+'"')}
function custHTML(){const fins=Object.keys(FIN).filter(k=>/^cu_/.test(k)),mats=Object.keys(MATS).filter(k=>/^cm_/.test(k));
  return `<details class="pf cust"${ui.cuOpen?' open':''} data-cu="1"><summary>Your own boards &amp; colours${fins.length+mats.length?` · ${fins.length+mats.length}`:''}</summary><div style="display:grid;gap:12px;padding-top:8px">
    <p class="hintp" style="margin:0">Add a board or colour that is not in the lists — a brand paint colour, a special veneer, a board from your own supplier. They stay in this browser for every design, and travel with the design when you share it.</p>
    ${fins.length?`<div class="culist">${fins.map(k=>{const f=FIN[k];return `<div class="curow"><i class="cusw" style="background:${f.base}"></i><b>${esc(f.name)}</b><small>${esc((CU_KINDS.find(x=>x[0]===f.kind)||CU_KINDS[0])[1])} · ${f.base}${cuUsed(k)?' · in use':''}</small><button type="button" class="rowbtn" data-act="cuDel" data-a="${k}" aria-label="Remove ${esc(f.name)}">×</button></div>`}).join('')}</div>`:''}
    <div class="cuform"><b>New colour</b><div class="grid2"><label class="fld"><span>Name</span><span class="inp"><input type="text" id="cuFName" maxlength="48" placeholder="e.g. Farrow &amp; Ball Hague Blue"></span></label><label class="fld"><span>Colour</span><span class="inp"><input type="color" id="cuFCol" value="#7A8C7E" style="width:100%;height:34px;border:0;background:none"></span></label></div>
      <label class="fld"><span>Look</span><select id="cuFKind">${CU_KINDS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label>
      <button type="button" class="btn sm pri" data-act="cuAddFin" style="justify-self:start">+ Add colour</button></div>
    ${mats.length?`<div class="culist">${mats.map(k=>{const m=MATS[k],p=+((S.opts.myM2||{})[k])||0;return `<div class="curow"><i class="cusw cub">${f0(m.t)}</i><b>${esc(m.name)}</b><small>${f0(m.t)} mm · ${m.sheet.replace('x',' × ')}${p?` · € ${p.toFixed(2)}/m²`:''} · ${esc((CU_FINS.find(x=>x[0]===m.fins)||CU_FINS[0])[1].toLowerCase())}${cuUsed(k)?' · in use':''}</small><button type="button" class="rowbtn" data-act="cuDel" data-a="${k}" aria-label="Remove ${esc(m.name)}">×</button></div>`}).join('')}</div>`:''}
    <div class="cuform"><b>New board type</b><div class="grid2"><label class="fld"><span>Name</span><span class="inp"><input type="text" id="cuMName" maxlength="48" placeholder="e.g. Valchromat, oak-veneered ply"></span></label><label class="fld"><span>Thickness</span><span class="inp"><input type="number" id="cuMT" inputmode="decimal" value="18"><em>mm</em></span></label>
      <label class="fld"><span>Sheet size</span><span class="inp"><input type="text" id="cuMSheet" list="cuSheets" value="2800x2070"></span></label><label class="fld"><span>Price (optional)</span><span class="inp"><input type="number" id="cuMPrice" inputmode="decimal" placeholder="per m²"><em>€/m²</em></span></label>
      <label class="fld"><span>Colours it comes in</span><select id="cuMFins">${CU_FINS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label><label class="fld"><span>Edges (optional)</span><span class="inp"><input type="text" id="cuMEdge" maxlength="80" placeholder="e.g. 2 mm matching ABS"></span></label></div>
      <datalist id="cuSheets">${SHEETS.map(s=>`<option value="${s}">`).join('')}</datalist>
      <button type="button" class="btn sm pri" data-act="cuAddMat" style="justify-self:start">+ Add board type</button></div>
  </div></details>`}
/* the small "add your own colour" form inside the colour picker */
function cuPickerHTML(){return `<div class="cuform cupick"><b>Your own colour</b><div class="cuprow"><input type="color" id="fpCuCol" value="#7A8C7E" aria-label="Colour"><input type="text" id="fpCuName" maxlength="48" placeholder="Name, e.g. Little Greene Aquamarine"><select id="fpCuKind" aria-label="Look">${CU_KINDS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select><button type="button" class="btn sm pri" data-act="cuPickAdd">Add &amp; use</button></div></div>`}
