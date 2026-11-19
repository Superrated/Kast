/* ==== 90-bar-views.js ====
   The toolbar above the drawing, the status bar and switching views.
*/
/* ===== bar, views ===== */
function renderBar(){
  const b=document.getElementById('bar');const w=geo.warns;let h='';
  if(ui.tab==='elev')h+=`<button class="btn sm ${ui.props?'on':''}" data-act="props" title="Show books, clothes, boxes and decoration at real size">Show items</button>${fmodeHTML()}<button class="btn sm" data-act="zoom" data-a="-1" aria-label="Zoom out">−</button><button class="btn sm" data-act="zoom" data-a="1" aria-label="Zoom in">+</button>`;
  if(ui.tab==='3d')h+=`<button class="btn sm ${ui.photoOn?'on':''}" data-act="photo" title="Line the design up with a photo of your room">${ui.photoOn?'Photo on':PH.img?'Room photo':'+ Room photo'}</button>${S.proj?`<button class="btn sm ${ui.others3D===false?'':'on'}" data-act="others3D" title="Show the other walls of the room around this one">Other walls</button>`:''}<button class="btn sm" data-act="light3d" title="Change the light: daylight, morning, evening, lamps">Light: ${(LIGHTS[ui.light||'']||LIGHTS[''])[1]}</button><button class="btn sm" data-act="cam" data-a="front">Front</button><button class="btn sm" data-act="cam" data-a="angle">Right ¾</button><button class="btn sm" data-act="cam" data-a="left">Left ¾</button><button class="btn sm ${ui.props?'on':''}" data-act="props" title="Show books, clothes, boxes and decoration at real size">Show items</button>${fmodeHTML()}<button class="btn sm" data-act="aiOpen" title="Hand this picture to a picture AI to make it look like a photo">🪄 AI render</button><button class="btn sm ${ui.see&&ui.see.size?'on':''}" data-act="seeClear" title="Tap any door, panel or shelf in the 3D view to see through it">${ui.see&&ui.see.size?`Solid again (${ui.see.size})`:'Tap a piece to see through'}</button><button class="btn sm ${ui.room3D?'on':''}" data-act="room3D">Room</button><button class="btn sm ${ui.exOn?'on':''}" data-act="explode" title="Pull every column and every part apart">Exploded</button><button class="btn sm ${ui.iso?'on':''}" data-act="iso" title="Show one column on its own">${ui.iso?'Column '+(ui.sel+1):'One column'}</button>${ui.iso?`<button class="btn sm" data-act="isoSec" data-a="-1" aria-label="Previous column">◀</button><button class="btn sm" data-act="isoSec" data-a="1" aria-label="Next column">▶</button>`:''}`;
  if(ui.tab==='elev'||ui.tab==='3d')h+=`<span class="sp"></span><span class="note" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">Fronts ${finSel('front')} Carcass ${finSel('carcass')}</span>`;
  else h+='<span class="sp"></span>';
  if(ui.tab==='elev'||ui.tab==='3d')h+=`<button class="btn sm mobonly" data-act="bigView" aria-label="${ui.big?'Smaller drawing':'Bigger drawing'}">${ui.big?'⤡ Smaller':'⤢ Bigger'}</button>`;
  const nt=w.length?`<details class="notes"${ui.notesOpen||ui.mnotes?' open':''}><summary>${w.length} design note${w.length>1?'s':''} — tap to read</summary><div class="fixall"><button type="button" class="fixb" data-act="fixAll">Fix what Fitted can</button><button type="button" class="fixb" data-act="notesClose">Close</button><span>Each fix follows the advice in its note. Undo brings it back.</span></div><ul>${[...new Set(w)].map((x,j)=>`<li>${esc(x)}${fixBtn(x,j)}</li>`).join('')}</ul></details>`:'<span class="note okline" style="color:var(--ink2)">No design issues found</span>';
  if((ui.tab==='elev'||ui.tab==='3d')&&S.opts.screen&&S.opts.screen.on)h=`<button class="btn sm ${S.opts.screen.show==='down'?'on':''}" data-act="scrT" title="Pull the screen drawer out and roll the screen down, or put it away">${S.opts.screen.show==='down'?'Screen is down':'Pull screen down'}</button>`+(ui.tab==='3d'?`<button class="btn sm ${ui.cinema?'on':''}" data-act="cinema" title="Dim the room, switch the picture on and look from the sofa">Cinema view</button>`:'')+h;
  b.innerHTML=`<div class="tools">${h}</div><div class="bnotes">${nt}</div>`;
  {const mf=document.getElementById('mfloat');if(mf){const wn=[...new Set(w)];const fmN={solid:'Doors',glass:'See-through',off:'No doors'}[ui.fm]||'Doors';
    mf.innerHTML=`${wn.length?`<button type="button" class="mfb warn" data-act="mnotes">⚠ ${wn.length}</button>`:''}<button type="button" class="mfb pchip" data-act="toPriceTab" aria-label="Estimated price">${pchipText()}</button><span class="sp"></span><button type="button" class="mfb" data-act="fmCycle" aria-label="Fronts: ${fmN}">${FM_ICON[ui.fm]||''}${fmN}</button>${isLocked()?'<button type="button" class="mfb" data-act="lockInfo" aria-label="Locked while you build">🔒</button>':''}<button type="button" class="mfb ${ui.props?'on':''}" data-act="props" aria-pressed="${!!ui.props}" title="Show books, clothes and boxes at real size">🪴 Items</button>${S.opts.screen&&S.opts.screen.on?`<button type="button" class="mfb ${S.opts.screen.show==='down'?'on':''}" data-act="scrT">Screen</button>`:''}${flowNow()!=='home'?`<button type="button" class="mfb" data-act="focusT">${ui.focus===false?'Zoom in':'Whole wall'}</button>`:''}`;mnotesPanel(wn)}}try{fixScan()}catch(e){}
  placeFmode();renderStatus();
}
function renderStatus(){const el=document.getElementById('sbar');if(!el||!geo)return;const qs=geo.secs.filter(q=>!q.panel),wn=[...new Set(geo.warns)].length,tops=geo.cps.map(p=>p.y);
  el.innerHTML=`<span><b>${f0(geo.W)}</b> mm wall</span><span><b>${f0(Math.max(...tops,+S.room.H||0))}</b> mm high</span><span><b>${f0(+S.room.D)}</b> mm deep</span><span><b>${qs.length}</b> column${qs.length===1?'':'s'}</span><span><b>${geo.panels.length}</b> parts</span><span class="sp"></span>${isLocked()?'<button type="button" class="sbtn" data-act="lockInfo" title="Locked while you build">🔒 Locked</button>':''}${budgetKind()?'<span class="sbadge">Budget build</span>':''}${S.opts.part&&S.opts.part.on&&partSet()?'<span class="sbadge">Partial build</span>':''}<button type="button" class="sbtn ${wn?'warn':''}" data-act="notesOpen">${wn?`⚠ ${wn} design note${wn>1?'s':''}`:'✓ No design issues'}</button><button type="button" class="sbtn pchip" data-act="toPriceTab" title="Estimated price — open the price list">${pchipText()}</button><button type="button" class="sbtn" data-act="fbOpen" title="Say thanks, report a bug, suggest a feature or buy me a coffee">♥ Feedback</button>`}
function skewPlan(){const G=geo,sk=G.skew;if(!sk)return '';const W=G.W,mx=Math.max(sk.dL,sk.dR),sc=300/W,H=mx*sc+46;let o=`<svg viewBox="-8 -8 316 ${n1(H)}" style="width:100%;max-width:380px;display:block" role="img" aria-label="Plan from above"><polygon points="0,0 300,0 300,${n1((mx-sk.dR)*sc)} 0,${n1((mx-sk.dL)*sc)}" fill="url(#hatch)" style="stroke:var(--ink3)" stroke-width="1"/><line x1="0" y1="${n1((mx-sk.dL)*sc)}" x2="300" y2="${n1((mx-sk.dR)*sc)}" style="stroke:var(--ink)" stroke-width="2"/>`;
  G.secs.forEach(q=>{if(q.panel)return;const x0=q.bL*sc,x1=q.bR*sc,y1=mx*sc,y0=y1-q.D*sc;o+=`<rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(x1-x0)}" height="${n1(y1-y0)}" style="fill:var(--accent-soft);stroke:var(--accent)" stroke-width="1.2"/><text x="${n1((x0+x1)/2)}" y="${n1((y0+y1)/2+4)}" text-anchor="middle" font-size="10" style="fill:var(--ink)">${f0(q.D)}</text>`});
  return o+`<line x1="0" y1="${n1(mx*sc)}" x2="300" y2="${n1(mx*sc)}" style="stroke:var(--accent)" stroke-width="2.5"/><text x="150" y="${n1(mx*sc+16)}" text-anchor="middle" font-size="10" style="fill:var(--ink2)">cabinet front (straight) — seen from above, wall at the top</text></svg>`}
function finSel(role){return finButton('mat.'+role+'.fin','',true)}
let dirty={};
const FM_ICON={solid:'<svg viewBox="0 0 20 20"><rect x="4" y="2.5" width="12" height="15" rx="1" fill="currentColor" opacity=".85"/><circle cx="13" cy="10" r="1.1" style="fill:var(--surface)"/></svg>',
  glass:'<svg viewBox="0 0 20 20"><rect x="4" y="2.5" width="12" height="15" rx="1" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="1.4"/><line x1="4" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="1.2"/><line x1="4" y1="13" x2="16" y2="13" stroke="currentColor" stroke-width="1.2"/></svg>',
  off:'<svg viewBox="0 0 20 20"><rect x="4" y="2.5" width="12" height="15" rx="1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2.5 2"/><line x1="3" y1="17" x2="17" y2="3" stroke="currentColor" stroke-width="1.6"/></svg>'};
function fmodeHTML(){return `<button type="button" class="btn sm ${ui.peek?'on':''}" data-act="peek" title="Make the selected compartment's doors see-through">Look inside selected</button><div class="fmode inl" role="group" aria-label="Show fronts">${[['solid','Doors'],['glass','See-through'],['off','Hidden']].map(([k,l])=>`<button type="button" class="${ui.fm===k?'on':''}" data-act="fm" data-a="${k}" aria-pressed="${ui.fm===k}" title="Fronts: ${l} (press F to cycle)">${FM_ICON[k]}<span>${l}</span></button>`).join('')}</div>`}
function placeFmode(){const f0_=document.getElementById('fmode');if(f0_)f0_.hidden=true;return;const f=document.getElementById('fmode'),b=document.getElementById('bar');if(!f)return;const show=ui.tab==='elev'||ui.tab==='3d';f.hidden=!show;if(!show)return;
  f.innerHTML=[['solid','Doors'],['glass','See-through'],['off','Hidden']].map(([k,l])=>`<button type="button" class="${ui.fm===k?'on':''}" data-act="fm" data-a="${k}" aria-pressed="${ui.fm===k}" title="Fronts: ${l} (press F to cycle)">${FM_ICON[k]}<span>${l}</span></button>`).join('');
  f.style.top=(b.offsetHeight+10)+'px'}
function setFm(m){ui.fm=m;dirty.elev=true;renderBar();if(ui.tab==='elev')renderTab('elev');applyFronts3D()}
function applyFronts3D(noReq){if(!T3)return;if(!T3.glass)T3.glass={};T3.frontG.visible=ui.fm!=='off';
  T3.frontG.traverse(o=>{if(!o.isMesh)return;if(o.userData.gap){o.visible=ui.fm!=='glass';o.castShadow=false;return}if(!o.userData.solid)o.userData.solid=o.material;const sm=o.userData.solid;
    const peek=ui.peek&&ui.zsel!=null&&(o.userData.sz===ui.sel+':'+ui.zsel||o.userData.sz===ui.sel+':-1');
    if(ui.fm==='glass'||peek||(ui.see&&ui.see.has(o.userData.pk))){const k=sm.uuid;if(!T3.glass[k]){const gm=sm.clone();gm.transparent=true;gm.opacity=.2;gm.depthWrite=false;T3.glass[k]=gm}o.material=T3.glass[k];o.castShadow=false}else{o.material=sm;o.castShadow=true}});
  if((ui.see&&ui.see.size)||T3.rootSee){T3.rootSee=!!(ui.see&&ui.see.size);T3.root.traverse(o=>{if(!o.isMesh||o.userData.pk==null||Array.isArray(o.material))return;const on=ui.see&&ui.see.has(o.userData.pk);if(!on&&!o.userData.solid)return;if(!o.userData.solid)o.userData.solid=o.material;const sm=o.userData.solid;
      if(on){const k=sm.uuid;if(!T3.glass[k]){const gm=sm.clone();gm.transparent=true;gm.opacity=.2;gm.depthWrite=false;T3.glass[k]=gm}o.material=T3.glass[k];o.castShadow=false}else{o.material=sm;o.castShadow=true}})}
  /* styling objects that stand on, hang on or lean against a see-through piece disappear with it */
  try{if((ui.see&&ui.see.size)||T3.decoHid){const bx=[];[T3.frontG,T3.root].forEach(g=>g.traverse(o=>{if(o.isMesh&&o.userData.pk!=null&&ui.see&&ui.see.has(o.userData.pk))bx.push(new THREE.Box3().setFromObject(o).expandByScalar(12))}));
      const decos=[];if(T3.propG)T3.propG.children.forEach(o=>decos.push(o));T3.root.children.forEach(o=>{if(o.userData.deco)o.children.forEach(c=>decos.push(c))});
      decos.forEach(o=>{const was=o.visible;o.visible=true;const b=new THREE.Box3().setFromObject(o);o.visible=!bx.some(x=>x.intersectsBox(b))});T3.decoHid=bx.length>0}}catch(e){}
  if(ui.iso||ui.exT)applyExplode(true);if(!noReq)T3.req()}
function renderViews(){
  groupsCache=null;renderBar();
  const t=ui.tab;['elev','3d','cut','loft','sheets','guide'].forEach(k=>dirty[k]=true);
  renderTab(t);
}
function zoomWrap(){const w=document.getElementById('elevWrap');w.classList.toggle('fit',!(ui.zoom>1));w.style.width=(100*ui.zoom)+'%';w.style.height=isSheet()&&ui.zoom>1?(100*ui.zoom)+'%':''}
/* ===== Toolbar on the drawing: the everyday changes for the selected part, right next to it ===== */
function ztbRender(){const view=document.getElementById('v-elev');if(!view)return;let tb=document.getElementById('ztb');if(tb)tb.remove();const i=ui.sel,k=ui.zsel,sc=S.sections[i],z=sc&&k!=null&&sc.zones?sc.zones[k]:null;if(!z||ui.tab!=='elev')return;
  const p=`sections.${i}.zones.${k}`,zr=geo.secs[i]&&geo.secs[i].zones[k],q=geo.secs[i],T=[['closed','Cupboard'],['open','Shelves'],['drawers','Drawers'],['opening','Niche']];
  const canSplit=z.type==='open'||z.type==='drawers'||(z.type==='closed'&&!z.dog),vd=Array.isArray(z.vd)?z.vd:[],cur=z.type==='drawers'?Math.max(1,+z.split||1):(z.vdMode==='shift'?vd.length:vd.length+1);
  const stp=(lab,path,mn,mx,val)=>`<span class="ztg"><em>${lab}</em><button type="button" data-act="step" data-a="${path}|-1|${mn}|${mx}" aria-label="Fewer ${lab}">−</button><b>${val}</b><button type="button" data-act="step" data-a="${path}|1|${mn}|${mx}" aria-label="More ${lab}">+</button></span>`;
  let h=`<span class="ztg zty">${T.map(([t,l])=>`<button type="button" class="${z.type===t?'on':''}" data-act="setv" data-a="${p}.type|${t}|s" title="${l}" aria-label="${l}">${ZICON[t]||l}</button>`).join('')}</span>`;
  if(canSplit&&q)h+=`<span class="ztg"><em>Split</em>${[1,2,3,4].map(n=>`<button type="button" class="${cur===n?'on':''}" data-act="splitN" data-a="${i}|${k}|${n}" aria-label="Split in ${n}">${n}</button>`).join('')}</span>`;
  if(z.type==='open'||(z.type==='closed'&&!z.rail&&!z.dog))h+=stp('Shelves',p+'.shelves',0,10,+z.shelves||0);
  if(z.type==='drawers')h+=stp('Drawers',p+'.count',1,8,+z.count||1);
  h+=`<span class="ztg"><button type="button" data-act="ztbMore" title="All settings for this part">⋯ More</button><button type="button" data-act="delZone" data-a="${k}" title="Remove this part" aria-label="Remove this part">🗑</button><button type="button" data-act="ztbClose" title="Done" aria-label="Done">✕</button></span>`;
  tb=document.createElement('div');tb.id='ztb';tb.className='ztb';tb.setAttribute('role','toolbar');tb.setAttribute('aria-label','Change the selected part');tb.innerHTML=h;view.appendChild(tb);ztbPlace()}
function ztbPlace(){const tb=document.getElementById('ztb'),view=document.getElementById('v-elev');if(!tb||!view)return;if(isSheet()){tb.classList.add('dock');tb.style.left=tb.style.top='';return}tb.classList.remove('dock');
  const pg=view.querySelector(`polygon[data-sec="${ui.sel}"][data-zone="${ui.zsel}"]`);if(!pg){tb.remove();return}const r=pg.getBoundingClientRect(),v=view.getBoundingClientRect(),w=tb.offsetWidth,hh=tb.offsetHeight;
  let x=r.left-v.left+view.scrollLeft+r.width/2-w/2,y=r.top-v.top+view.scrollTop-hh-10;if(y<view.scrollTop+4)y=r.bottom-v.top+view.scrollTop+10;if(y+hh>view.scrollTop+view.clientHeight-4)y=Math.max(view.scrollTop+4,r.top-v.top+view.scrollTop+8);
  x=Math.max(view.scrollLeft+6,Math.min(x,view.scrollLeft+view.clientWidth-w-6));tb.style.left=x+'px';tb.style.top=y+'px'}
window.addEventListener('resize',()=>{try{ztbPlace()}catch(e){}});
function renderTab(t){
  if(!dirty[t])return;dirty[t]=false;
  if(t==='elev'){const w=document.getElementById('elevWrap');zoomWrap();w.innerHTML=elevSVG(S,geo,{sel:ui.sel,zsel:ui.zsel,xray:ui.fm==='glass',hide:ui.fm==='off',props:ui.props,peek:ui.peek&&ui.zsel!=null?[ui.sel,ui.zsel]:null,focus:isSheet()&&ui.focus!==false&&flowNow()!=='home'?ui.sel:null})}
  if(t==='elev'){try{ztbRender()}catch(e){}}
  if(t==='3d')rebuild3D();if(t==='cut')renderCut();if(t==='loft')renderLoft();if(t==='sheets')renderSheets();if(t==='guide')renderGuide();
}
function changed(side){if(lockGuard())side=true;if(S.proj){try{pjSync()}catch(e){}}geo=build(S);if(side)renderSide();renderViews();saveSoon();snap();priceSoon();try{dsAutoSoon()}catch(e){}}
let prT=null;function pchipText(){if(!lastPrice)return '≈ € …';const d=ui.priceD||0;return `≈ ${eur(lastPrice.tot.all)}${Math.abs(d)>=1?` <small>${d<0?'▼':'▲'} ${eur(Math.abs(d)).replace('€ ','€')}</small>`:''}`}
function priceSoon(){clearTimeout(prT);prT=setTimeout(()=>{try{const prev=ui.priceLast!=null?ui.priceLast:(lastPrice?lastPrice.tot.all:null);if(ui.tab!=='cut'){renderCut();dirty.cut=true}if(!lastPrice)return;ui.priceLast=lastPrice.tot.all;if(prev!=null&&Math.abs(lastPrice.tot.all-prev)>=1)ui.priceD=lastPrice.tot.all-prev;document.querySelectorAll('.pchip').forEach(el=>{el.innerHTML=pchipText()});budChips()}catch(e){}},220)}
let hist=[],fut=[],lastSnap=null;
function snap(){const j=JSON.stringify(S);if(j===lastSnap)return;
  // a different design was opened: its undo history starts fresh, so Undo can never pour one saved design into another
  if((ui.histDoc||null)!==(ui.docId||null)){hist=[];fut=[];ui.histDoc=ui.docId||null}else if(lastSnap!=null){hist.push(lastSnap);if(hist.length>100)hist.shift();fut=[]}lastSnap=j;updUndo()}
function updUndo(){const u=document.getElementById('bUndo'),r=document.getElementById('bRedo');if(u)u.disabled=!hist.length;if(r)r.disabled=!fut.length}
function undoRedo(dir){if(isLocked()){lockToast();return}const from=dir<0?hist:fut,to=dir<0?fut:hist;if(!from.length)return;to.push(lastSnap);lastSnap=from.pop();S=JSON.parse(lastSnap);geo=build(S);renderSide();renderViews();saveSoon();updUndo();try{dsAutoSoon()}catch(e){}toast(dir<0?'Undone':'Redone')}
let chT=null;function changedSoon(){clearTimeout(chT);chT=setTimeout(()=>{geo=build(S);renderViews();updateSideInfo();saveSoon();snap();priceSoon()},160)}
function updateSideInfo(){const s=document.getElementById('side');const scr=s.scrollTop,ae=document.activeElement,id=ae&&ae.id,ss=ae&&ae.selectionStart;
  // only placeholders/info depend on geometry; refresh section editor in place when not typing in it
  const box=s.querySelector('details[data-k="secs"] .accb');if(box&&!(ae&&box.contains(ae)))box.innerHTML=secEditor();
  s.scrollTop=scr}


/* phone: the design notes open as their own panel (a bottom sheet over the drawing), not squeezed into the button row */
function mnotesPanel(wn){let p=document.getElementById('mnp');const on=!!(ui.mnotes&&wn&&wn.length&&innerWidth<=860);
  if(!on){if(p)p.hidden=true;return}
  if(!p){p=document.createElement('div');p.id='mnp';p.className='mnp';document.body.appendChild(p);p.addEventListener('click',e=>{if(e.target===p){ui.mnotes=false;p.hidden=true}})}
  const fixable=wn.map((x,j)=>fixBtn(x,j)).filter(Boolean).length;
  p.innerHTML=`<div class="mnpbox" role="dialog" aria-modal="true" aria-label="Design notes"><div class="mnph"><b>${wn.length} design note${wn.length>1?'s':''}</b><button type="button" class="btn sm" data-act="notesClose">Close</button></div>
    ${fixable?`<div class="mnpfix"><button type="button" class="btn pri" data-act="fixAll">Fix what Fitted can (${fixable})</button><span>Each fix follows the advice in its note. Undo brings it back.</span></div>`:''}
    <ol class="mnpl">${wn.map((x,j)=>`<li><p>${esc(x)}</p>${fixBtn(x,j)}</li>`).join('')}</ol></div>`;p.hidden=false}

/* ===== locked while building =====
   Workshop mode locks the design: the parts being cut must keep matching the drawings.
   Ticking cuts and build steps as done (S.done) still works; every other change is undone with a short note. */
const isLocked=()=>!!(S&&S.lock&&S.lock.on);
function lockSig(st){const o=Object.assign({},st);delete o.done;delete o.lock;return JSON.stringify(o)}
let lockT=0;function lockToast(){if(Date.now()-lockT<2500)return;lockT=Date.now();toast('This design is locked while you build. To change it, tap “Unlock” at the top of the settings.')}
function lockOn(){if(isLocked())return;S.lock={on:true,id:uid(),at:Date.now()};ui.lockId=S.lock.id;ui.lockSnap=JSON.stringify(S);ui.lockSig=lockSig(S);changed(true);toast('Design locked while you build — the parts you cut keep matching the drawings')}
function lockOff(){if(!isLocked())return;S.lock={on:false};ui.lockId=null;ui.lockSnap=null;ui.lockSig=null;changed(true);toast('Unlocked — changes now change the parts too. Parts already cut may no longer fit.')}
/* returns true when it had to put the locked design back */
function lockGuard(){if(!isLocked())return false;if(ui.lockId!==S.lock.id||!ui.lockSnap){let prev=null;try{prev=lastSnap&&JSON.parse(lastSnap)}catch(e){}
    // the state before this change is the locked one when it carries the same lock (a reload, then an edit)
    const base=prev&&prev.lock&&prev.lock.on&&prev.lock.id===S.lock.id?prev:S;ui.lockId=S.lock.id;ui.lockSnap=JSON.stringify(base);ui.lockSig=lockSig(base);if(base===S)return false}
  if(lockSig(S)===ui.lockSig){ui.lockSnap=JSON.stringify(S);return false}const done=S.done;S=JSON.parse(ui.lockSnap);if(done)S.done=done;lockToast();return true}
function lockBanner(){if(!isLocked())return '';let d='';try{d=new Date(S.lock.at||Date.now()).toLocaleDateString(undefined,{day:'numeric',month:'short'})}catch(e){}
  return `<div class="lockban"><b>🔒 Locked for building</b><span>Since ${esc(d)}. Changes are switched off so the parts you cut keep matching the drawings. Ticking cuts and steps as done still works.</span><button type="button" class="btn sm" data-act="unlock">Unlock to change the design</button></div>`}
