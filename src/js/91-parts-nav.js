/* ==== 91-parts-nav.js ====
   The Parts area, split by what you are doing:
     Parts     — what to cut and buy:  List · Sheets · Shopping · Price
     Drawings  — everything on paper:  Technical drawings · Shaped parts · Labels & files
     Workshop  — building it:          lock status · Cut · Assemble (3D per box) · Build steps
   Views: v-cut (List / Shopping / Price, one render split in sections), v-sheets, v-draw, v-loft, v-work.
   The last tab you used is remembered.
*/
const PN_GROUP={cut:'parts',sheets:'parts',draw:'drawings',loft:'drawings',work:'workshop'};
const PN_PARTS=[['list','cut','List'],['sheets','sheets','Sheets'],['buy','cut','Shopping'],['price','cut','Price']];
const PN_DRAW=[['tech','draw','Technical drawings'],['loft','loft','Shaped parts'],['files','draw','Labels & files']];
let PN={last:'cut',psub:'list',dsub:'tech'};try{const o=JSON.parse(localStorage.getItem('fitted-pn')||'null');if(o)PN=Object.assign(PN,o)}catch(e){}
function pnSave(){try{localStorage.setItem('fitted-pn',JSON.stringify(PN))}catch(e){}}
/* open a place in the Parts area: g = 'parts'|'drawings'|'workshop', or a sub key */
function pnGo(key){let tab='cut';
  if(key==='parts'){key=PN.psub||'list'}else if(key==='drawings'){key=PN.dsub||'tech'}else if(key==='workshop'){key='work'}
  const p=PN_PARTS.find(x=>x[0]===key),d=PN_DRAW.find(x=>x[0]===key);if(p){PN.psub=key;tab=p[1]}else if(d){PN.dsub=key;tab=d[1]}else if(key==='work')tab='work';
  PN.last=tab;pnSave();showTab(tab)}
function pnLast(){return PN.last&&PN_GROUP[PN.last]?PN.last:'cut'}
function pnNav(t){const g=PN_GROUP[t];if(!g)return '';const sub=g==='parts'?PN_PARTS:g==='drawings'?PN_DRAW:null,cur=g==='parts'?PN.psub:PN.dsub;
  return `<nav class="pnav" aria-label="${g==='parts'?'Parts':'Drawings'} sections">${sub?`<div class="pnsub seg" role="tablist">${sub.map(([k,,l])=>`<button type="button" role="tab" class="${k===cur?'on':''}" aria-selected="${k===cur}" data-act="pnGo" data-a="${k}">${l}</button>`).join('')}</div>`:''}</nav>`}
function pnPut(t){const el=document.getElementById('v-'+t);if(!el)return;const old=el.querySelector(':scope>.pnav');if(old)old.remove();el.insertAdjacentHTML('afterbegin',pnNav(t));if(t==='cut')el.dataset.psub=PN.psub==='sheets'?'list':PN.psub;if(t==='draw')el.dataset.dsub=PN.dsub==='loft'?'tech':PN.dsub;pnTabsOn(t)}
function pnTabsOn(t){const g=PN_GROUP[t];document.querySelectorAll('[data-act="tab"],[data-act="pnTop"]').forEach(x=>{const a=x.dataset.a;const on=x.dataset.act==='pnTop'?a===g:(a===t||(PN_GROUP[a]&&PN_GROUP[a]===g&&(x.closest('#bnav')||a==='cut'&&g==='parts')));x.classList.toggle('on',!!on)})}
/* wrap the renders of the views so the section bar is always on top */
['renderCut','renderSheets','renderLoft'].forEach(fnm=>{const f=window[fnm];if(typeof f!=='function')return;const t={renderCut:'cut',renderSheets:'sheets',renderLoft:'loft'}[fnm];window[fnm]=function(){const r=f.apply(this,arguments);try{if(!PRICING)pnPut(t)}catch(e){}return r}});
/* ---------- Drawings ---------- */
function renderDraw(){const el=document.getElementById('v-draw');if(!el)return;
  el.innerHTML=`<section data-dsec="tech"><h2>Technical drawings</h2>${tdBodyHTML(true)}</section>
  <section data-dsec="files"><h2>Labels &amp; files</h2><div class="shgrid">
    <section class="shcard"><h3>Part labels</h3><p class="hintp">One sticker per part: its number, size, board, which edges get edge banding and which way the grain runs. A last page explains how to read them.</p><div class="dbtns"><button type="button" class="btn pri" data-act="lblPdf">Part labels (PDF)</button></div></section>
    <section class="shcard"><h3>PDF packs</h3><p class="hintp">Front drawing, cut list, price, shaped parts and the build guide — as one PDF for the workshop, the shop or a quote.</p><div class="dbtns"><button type="button" class="btn" data-act="pdf">Choose a PDF pack…</button></div></section>
    <section class="shcard"><h3>Machining drawings</h3><p class="hintp">One page per part with every size to cut, drill, groove and finish: holes by position, Ø and depth from the 0 corner, grooves, cut-outs, shaped corners, edge banding and grain.</p><div class="dbtns"><button type="button" class="btn pri" data-act="mdPdf">Machining drawings (PDF)</button></div></section>
    <section class="shcard"><h3>Templates at full size</h3><p class="hintp">Shaped parts printed 1:1 on A4 sheets to tape together and trace.</p><div class="dbtns"><button type="button" class="btn" data-act="tplPdf">Templates (PDF)</button></div></section>
    <section class="shcard"><h3>CNC files per part</h3><p class="hintp">One DXF per part, with cut-outs and drill holes on their own layers, for a CNC router.</p><div class="dbtns"><button type="button" class="btn" data-act="dxfZip">DXF files (zip)</button></div></section>
  </div></section>`;pnPut('draw')}
/* ---------- Workshop ---------- */
function wsCount(tab){const o=ui.ws;let d=0,n=0;try{ui.ws={tab};const it=wsItems(),done=new Set(((S.done||{})[tab])||[]);n=it.length;d=it.filter(x=>done.has(x.k)).length}catch(e){}ui.ws=o;return [d,n]}
function renderWork(){const el=document.getElementById('v-work');if(!el)return;const[cd,cn]=wsCount('cuts'),[sd,sn]=wsCount('steps');let cols=[];try{cols=wxCols()}catch(e){}
  const bar=(d,n)=>`<div class="wsprog"><i style="width:${n?Math.round(d/n*100):0}%"></i></div><span class="hintp" style="margin:0">${d} of ${n} done</span>`;
  let ld='';try{ld=isLocked()?new Date(S.lock.at||Date.now()).toLocaleDateString(undefined,{day:'numeric',month:'short'}):''}catch(e){}
  el.innerHTML=`<h2>Workshop</h2><p class="lede">Building it: cut the parts, put each box together, then follow the build steps. Big buttons, one thing at a time — made for a phone in the workshop.</p>
  <div class="wklock ${isLocked()?'on':''}">${isLocked()?`<b>🔒 Locked for building</b><span>Since ${esc(ld)}. Nothing can change by accident, so the parts you cut keep matching the drawings. Ticking cuts and steps as done still works.</span><div class="dbtns"><button type="button" class="btn sm pri" data-act="dsEditCopy">Edit a copy</button><button type="button" class="btn sm" data-act="unlock">Unlock to change the design</button></div>`
    :`<b>🔓 Not locked</b><span>When you start cutting, Fitted locks the design so the parts keep matching the drawings. You can lock it now too.</span><div class="dbtns"><button type="button" class="btn sm" data-act="lockOn">🔒 Lock now</button></div>`}</div>
  <div class="wkgrid">
    <section class="wkcard"><h3>1 · Cut</h3><p>Every cut at the saw, in order, with the fence setting. Tick each one off.</p>${bar(cd,cn)}<button type="button" class="btn pri" data-act="wkCut">${cd?'Go on cutting':'Start cutting'}</button></section>
    <section class="wkcard wkasm"><h3>2 · Assemble</h3><p>Each box in 3D: pull it apart with the slider, turn it, tap a part to see its size, edge banding and holes.</p>
      <div class="wkboxes">${cols.map((c,i)=>`<button type="button" class="tchip" data-act="wkBox" data-a="${i}">Box ${c.n}<small>${f0(c.bx.x1-c.bx.x0)} wide</small></button>`).join('')||'<span class="hintp">No boxes in this design.</span>'}</div><button type="button" class="btn pri" data-act="wkBox" data-a="0">Open in 3D</button></section>
    <section class="wkcard"><h3>3 · Build steps</h3><p>Fixing to the wall, levelling, doors, strips — step by step.</p>${bar(sd,sn)}<div class="dbtns"><button type="button" class="btn pri" data-act="wkSteps">${sd?'Go on':'Start the steps'}</button><button type="button" class="btn" data-act="tab" data-a="guide">Read the whole guide</button></div></section>
  </div>`}
