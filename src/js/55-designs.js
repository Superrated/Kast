/* ==== 55-designs.js ====
   Saved designs (shared in the app through the db capability), backups, versions and "compare two designs".
*/
/* ===== Saved designs (shared in the app) ===== */
const DS={db:null,list:[],state:'loading',local:false,thumbs:{}};const DSL='kast-designs-v1';
const dsLocalGet=()=>{try{return JSON.parse(localStorage.getItem(DSL)||'[]')}catch(e){return []}};
const dsLocalPut=l=>{try{localStorage.setItem(DSL,JSON.stringify(l));return true}catch(e){return false}};
const DSB='kast-backups-v1';DS.backs=[];
const dsHash=t=>{let h=7;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return h},dsSig=()=>dsHash(JSON.stringify(S));
const dsCur=()=>ui.docId?DS.list.find(d=>d.id===ui.docId)||null:null;
/* is there work in the editor that is not in the saved list? */
function dsDirty(){if(ui.savedSig!=null)return dsSig()!==ui.savedSig;const c=dsCur();return c?c.state!==JSON.stringify(S):true}
const dsBackLocal=()=>{try{return JSON.parse(localStorage.getItem(DSB)||'[]')}catch(e){return []}};
async function dsInit(){let db=null;try{if(window.claude&&claude.use)db=await claude.use('db')}catch(e){db=null}
  if(ui.fresh&&ui.savedSig==null){try{ui.savedSig=dsSig()}catch(e){}}
  if(!db){DS.local=true;DS.list=dsLocalGet().sort((a,b)=>b.updatedAt-a.updatedAt);DS.backs=dsBackLocal();DS.state='ready';rmInit();renderDesigns();dsBadge();return}
  DS.db=db;rmInit();const t=setTimeout(()=>{if(DS.state==='loading'){DS.state='slow';renderDesigns()}},10000);
  db.collection('designs').orderBy('updatedAt','desc').limit(200).onSnapshot(snap=>{clearTimeout(t);DS.list=snap.docs.map(d=>Object.assign({id:d.id},d.data()));DS.state='ready';renderDesigns();dsBadge()},err=>{clearTimeout(t);DS.state='error';DS.err=err&&err.message;renderDesigns()});
  try{db.collection('backups').orderBy('savedAt','desc').limit(80).onSnapshot(snap=>{DS.backs=snap.docs.map(d=>Object.assign({id:d.id},d.data()));renderDesigns()},()=>{})}catch(e){}}
/* Safety net: every time something would be replaced or thrown away, a copy goes here first.
   kind 'version' = a saved design as it was before "Save changes"; 'auto' = unsaved work that was about to be replaced; 'deleted' = a deleted design */
async function dsBackup(kind,name,state,of){if(!state||state.length>240000)return false;if(DS.backs.some(b=>b.state===state&&b.kind===kind))return true;const rec={kind,name:name||'Untitled design',state,savedAt:Date.now(),of:of||''};
  try{if(DS.db){await DS.db.collection('backups').add(rec);dsPrune()}
    else{const l=dsBackLocal();l.unshift(Object.assign({id:'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)},rec));while(l.length>10)l.pop();let ok=false;while(l.length){try{localStorage.setItem(DSB,JSON.stringify(l));ok=true;break}catch(e){l.pop()}}DS.backs=l;if(!ok)return false}
    return true}catch(e){return false}}
function dsPrune(){if(!DS.db)return;const seen={},kill=[];DS.backs.forEach(b=>{const k=b.kind==='version'?'v:'+b.of:b.kind,max=b.kind==='version'?8:b.kind==='deleted'?15:10;seen[k]=(seen[k]||0)+1;if(seen[k]>max||Date.now()-(+b.savedAt||0)>90*864e5)kill.push(b.id)});kill.slice(0,10).forEach(id=>{try{DS.db.doc('backups/'+id).delete().catch(()=>{})}catch(e){}})}
function dsAgo(ts){const m=Math.round((Date.now()-ts)/60000);return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':new Date(ts).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}
function dsThumb(d){const k=d.id+':'+(d.updatedAt||d.savedAt);if(DS.thumbs[k]!=null)return DS.thumbs[k];let h='';try{const st=fixFins(JSON.parse(d.state));h=elevSVG(st,build(st),{mini:true})}catch(e){h=''}DS.thumbs[k]=h;return h}
function dsBadge(){const c=dsCur(),st=dsStatus(),nm=c?(c.name||'Untitled design'):(ui.docName||''),b=document.getElementById('dsBtn'),m=document.getElementById('dsBtnM');
  if(b){b.className='btn dsb '+st.k;b.innerHTML=st.k==='new'?`<span class="dsico" aria-hidden="true">●</span>Save`:`<span class="dsnm">${esc(nm.length>22?nm.slice(0,21)+'…':nm)}</span><i class="dsst2" aria-hidden="true">${st.k==='ok'?'✓':st.k==='err'?'!':'…'}</i>`;
    b.title=st.k==='new'?'This design is not saved yet — tap to name and save it':`“${nm}” — ${st.t}. Tap for your designs, rooms and sharing.`;b.setAttribute('aria-label',st.k==='new'?'Save this design':`My designs — ${nm}, ${st.t}`)}
  if(m)m.textContent=st.k==='new'?'Save this design':'My designs';try{ntBadge()}catch(e){}}
/* ===== compare two designs ===== */
function cmpStats(st){const S0=S,g0=geo,lp=lastPrice,la=lastAlt,gc=groupsCache;let out=null;PRICING++;
  try{S=st;geo=build(st);renderCut();const G=geo,mk=makerEstimate(),qs=G.secs.filter(q=>!q.panel&&!q.door),sh=lastPrice.rows.filter(r=>r.grp==='Sheets').reduce((a,r)=>a+(+r.qty||0),0);
    const fn=k=>{const m=st.mat[k];return m?((MATS[m.type]||{}).short||m.type)+' · '+((FIN[m.fin]||{}).name||m.fin):'—'};
    out={W:+st.room.W,H:+st.room.H,D:+st.room.D,cols:qs.length,doors:G.fronts.filter(f=>f.kind==='door').length,drawers:G.fronts.filter(f=>f.kind==='drawer').length,
      panels:G.panels.length,sheets:sh,total:lastPrice.tot.all,tsheets:lastPrice.tot.sheets,tfin:lastPrice.tot.fin,thw:lastPrice.tot.hw,maker:mk?[mk.lo,mk.hi]:null,warns:G.warns.length,
      front:fn('front'),carcass:fn('carcass'),handle:st.opts.handle||'—'}}catch(e){out=null}
  PRICING--;S=S0;geo=g0;lastPrice=lp;lastAlt=la;groupsCache=gc;return out}
function cmpDiff(a,b,pre,out){if(out.length>40)return;const ks=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);ks.forEach(k=>{if(k.startsWith('_'))return;const x=(a||{})[k],y=(b||{})[k];
  if(JSON.stringify(x)===JSON.stringify(y))return;if(x&&y&&typeof x==='object'&&typeof y==='object'&&!Array.isArray(x)&&pre.split('.').length<3)cmpDiff(x,y,pre?pre+'.'+k:k,out);else out.push(pre?pre+'.'+k:k)})}
function renderCompare(){const el=document.getElementById('dsCmp'),box=document.getElementById('dsCmpBox');if(!el||!box||!box.open)return;
  const opts=[{id:'@now',name:'What is open now',state:JSON.stringify(S)}].concat(DS.list.map(d=>({id:d.id,name:d.name||'Untitled design',state:d.state})));
  if(opts.length<2){el.innerHTML='<p class="hintp">Save at least one design to compare it with what is open now.</p>';return}
  if(!ui.cmpA||!opts.some(o=>o.id===ui.cmpA))ui.cmpA='@now';if(!ui.cmpB||!opts.some(o=>o.id===ui.cmpB)||ui.cmpB===ui.cmpA)ui.cmpB=(opts.find(o=>o.id!==ui.cmpA&&o.id!==ui.docId)||opts.find(o=>o.id!==ui.cmpA)).id;
  const sel=(k,v)=>`<select data-cmp="${k}">${opts.map(o=>`<option value="${esc(o.id)}"${o.id===v?' selected':''}>${esc(o.name)}</option>`).join('')}</select>`;
  const A=opts.find(o=>o.id===ui.cmpA),B=opts.find(o=>o.id===ui.cmpB);let sa=null,sb=null,ja=null,jb=null;
  try{ja=fixFins(JSON.parse(A.state));sa=cmpStats(JSON.parse(JSON.stringify(ja)))}catch(e){}try{jb=fixFins(JSON.parse(B.state));sb=cmpStats(JSON.parse(JSON.stringify(jb)))}catch(e){}
  if(!sa||!sb){el.innerHTML=`<div class="cmpsel">${sel('a',ui.cmpA)}<span>vs</span>${sel('b',ui.cmpB)}</div><p class="hintp">One of these designs could not be read.</p>`;return}
  const mm=v=>f0(v)+' mm',n=v=>String(v),rng=m=>m?eur(m[0])+' – '+eur(m[1]):'—';
  const rows=[['Wall width',sa.W,sb.W,mm,1],['Height',sa.H,sb.H,mm,1],['Depth',sa.D,sb.D,mm,1],['Columns',sa.cols,sb.cols,n,0],['Doors',sa.doors,sb.doors,n,0],['Drawers',sa.drawers,sb.drawers,n,0],['Parts to cut',sa.panels,sb.panels,n,-1],['Sheets to buy',sa.sheets,sb.sheets,n,-1],
    ['Boards',sa.tsheets,sb.tsheets,eur,-1],['Finishing',sa.tfin,sb.tfin,eur,-1],['Hardware',sa.thw,sb.thw,eur,-1],['Total to build yourself',sa.total,sb.total,eur,-1],['Cabinet maker (excl. VAT)',sa.maker,sb.maker,rng,0],
    ['Fronts',sa.front,sb.front,String,0],['Carcass',sa.carcass,sb.carcass,String,0],['Handles',sa.handle,sb.handle,String,0],['Warnings',sa.warns,sb.warns,n,-1]];
  const cell=(v,o,f,better)=>{const same=JSON.stringify(v)===JSON.stringify(o);let c=same?'':' class="cdif"';if(!same&&better&&typeof v==='number'&&typeof o==='number'){const good=better<0?v<o:false;if(good)c=' class="cdif cgood"'}return `<td${c}>${esc(f(v))}</td>`};
  const dd=(v,f)=>typeof v==='number'&&Math.abs(v)>0.004?(v>0?'+ ':'− ')+f(Math.abs(v)):'';
  const diff=[];cmpDiff(ja,jb,'',diff);const secA=(ja.sections||[]).length,secB=(jb.sections||[]).length;
  const nice=k=>k.replace(/^opts\./,'').replace(/^mat\./,'material: ').replace(/^room\./,'room: ').replace(/\./g,' › ');
  el.innerHTML=`<div class="cmpsel">${sel('a',ui.cmpA)}<span>vs</span>${sel('b',ui.cmpB)}</div>
  <div class="cmpwrap"><table class="cmpt"><thead><tr><th></th><th>${esc(A.name)}</th><th>${esc(B.name)}</th><th>Difference</th></tr></thead><tbody>${rows.map(r=>`<tr><th>${r[0]}</th>${cell(r[1],r[2],r[3],r[4])}${cell(r[2],r[1],r[3],r[4])}<td class="cdd">${typeof r[1]==='number'&&typeof r[2]==='number'?esc(dd(r[2]-r[1],r[3])):''}</td></tr>`).join('')}</tbody></table></div>
  <p class="hintp">Difference = right minus left. Green is the cheaper or simpler one.</p>
  ${diff.length?`<details class="pf"><summary>Settings that differ (${diff.length>40?'40+':diff.length})</summary><p class="hintp">${secA!==secB?`Columns: ${secA} vs ${secB}. `:''}${diff.slice(0,40).map(k=>esc(nice(k))).join(' · ')}</p></details>`:'<p class="hintp">These two designs have exactly the same settings.</p>'}`}
document.addEventListener('toggle',e=>{if(e.target&&e.target.dataset&&e.target.dataset.qa)ui.qaOpen=e.target.open;if(e.target&&e.target.id==='dsCmpBox'){ui.cmpOpen=e.target.open;renderCompare()}if(e.target&&e.target.dataset&&e.target.dataset.off)ui.offOpen=e.target.open},true);
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.cmp;if(!k)return;if(k==='a')ui.cmpA=e.target.value;else ui.cmpB=e.target.value;renderCompare()});
/* ===== the "My designs" window: three tabs — Designs, Rooms (56-rooms-share.js), Share & files ===== */
function ioOpen(tab,focus){ui.ioTab=tab||ui.ioTab||'designs';const m=document.getElementById('iom');m.hidden=false;const mm=document.getElementById('mmenu');if(mm)mm.hidden=true;renderDesigns();
  if(focus)setTimeout(()=>{const n=document.getElementById(focus);if(n){n.focus();try{n.select()}catch(e){}}},90)}
/* where the open design stands: new (not in the list), saving, dirty (will save in a moment), ok, err */
function dsStatus(){const c=dsCur();if(!c&&!ui.docId)return {k:'new',t:'Not saved yet'};if(ui.dsSaving||!c)return {k:'saving',t:'Saving…'};if(ui.dsErr)return {k:'err',t:'Not saved: '+ui.dsErr};if(dsDirty())return {k:'dirty',t:'Saving in a moment…'};return {k:'ok',t:'Saved '+dsAgo(+c.updatedAt||Date.now())}}
function renderDesigns(){const m=document.getElementById('iom');if(!m||m.hidden)return;const body=document.getElementById('ioBody');if(!body)return;const t=ui.ioTab||'designs';
  document.querySelectorAll('#ioTabs button').forEach(b=>{const on=b.dataset.a===t;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  const keep={};['dsFind','rmName','ioText','dsRen'].forEach(id=>{const e=document.getElementById(id);if(e)keep[id]=[e.value,document.activeElement===e]});
  const nmE=document.getElementById('dsName'),nmKeep=nmE&&document.activeElement===nmE?nmE.value:null;
  body.innerHTML=t==='rooms'?roomsHTML():t==='share'?shareHTML():designsHTML();
  Object.entries(keep).forEach(([id,[v,f]])=>{const e=document.getElementById(id);if(e){e.value=v;if(f)e.focus()}});if(nmKeep!=null){const e=document.getElementById('dsName');if(e){e.value=nmKeep;e.focus()}}
  if(t==='designs')try{renderCompare()}catch(e){}}
function designsHTML(){const c=dsCur(),st=dsStatus(),nm=c?(c.name||'Untitled design'):(ui.docName||S.name||'');const q=(ui.dsFind||'').trim().toLowerCase();
  const note=DS.state==='loading'?'Loading your designs…':DS.state==='slow'?'Still loading — check your connection.':DS.state==='error'?'Your designs could not be loaded right now.':DS.local?'Saved in this browser.':'Saved in Fitted — everyone you share this Fitted page with can open them too.';
  let thumb='';try{thumb=elevSVG(S,geo,{mini:true})}catch(e){}
  const now=`<div class="dsnow2 ${st.k}"><div class="dthumb" aria-hidden="true">${thumb}</div><div class="dsnowb">
    <label class="fld"><span>${c?'Open now — tap the name to rename it':'Give this design a name'}</span><span class="inp"><input type="text" id="dsName" maxlength="80" value="${esc(nm)}" placeholder="e.g. Attic, oak + sage" enterkeyhint="done"></span></label>
    <div class="dsst"><i aria-hidden="true"></i><span>${esc(st.t)}${c?' · every change saves by itself':''}</span></div>
    <div class="dbtns">${c?`<button type="button" class="btn sm" data-act="dsSaveNew">Save a copy</button><button type="button" class="btn sm" data-act="ioTab" data-a="share">Share this design</button><button type="button" class="btn sm" data-act="newHub">New design</button>`:`<button type="button" class="btn pri" data-act="dsSaveNew">Save design</button><span class="hintp" style="margin:0">After this, changes save by themselves.</span>`}</div></div></div>`;
  const vers=id=>DS.backs.filter(b=>b.kind==='version'&&b.of===id);
  const list=DS.list.filter(d=>!q||(d.name||'').toLowerCase().includes(q));
  const cards=list.map(d=>{const v=vers(d.id),on=d.id===ui.docId,more=ui.dsMore===d.id,ren=ui.dsRen===d.id;
    return `<div class="dcard${on?' on':''}"><button type="button" class="dthumb" data-act="dsOpen" data-a="${esc(d.id)}" aria-label="Open ${esc(d.name||'design')}">${dsThumb(d)}</button>
      <div class="dmeta">${ren?`<span class="inp"><input type="text" id="dsRen" data-id="${esc(d.id)}" maxlength="80" value="${esc(d.name||'')}" enterkeyhint="done" aria-label="New name"></span>`:`<b>${esc(d.name||'Untitled design')}</b>`}<span>${on?'open now · ':''}${dsAgo(+d.updatedAt||0)}</span></div>
      <div class="dact">${ren?`<button type="button" class="btn sm pri" data-act="dsRenOk" data-a="${esc(d.id)}">Save name</button><button type="button" class="btn sm" data-act="dsMore" data-a="">Cancel</button>`:`${on?'':`<button type="button" class="btn sm pri" data-act="dsOpen" data-a="${esc(d.id)}">Open</button>`}<button type="button" class="btn sm" data-act="dsMore" data-a="${more?'':esc(d.id)}" aria-expanded="${more}" aria-label="More for ${esc(d.name||'design')}">${more?'Less':'More…'}</button>`}</div>
      ${more&&!ren?`<div class="dmore"><button type="button" class="btn sm" data-act="dsRen" data-a="${esc(d.id)}">Rename</button><button type="button" class="btn sm" data-act="dsDup" data-a="${esc(d.id)}">Duplicate</button><button type="button" class="btn sm" data-act="dsFile" data-a="${esc(d.id)}">Download file</button><button type="button" class="btn sm warnb" data-act="dsDel" data-a="${esc(d.id)}">Delete</button></div>`:''}
      ${v.length?`<details class="pf dver"><summary>Earlier versions (${v.length})</summary>${v.map(b=>`<div class="dvrow"><span>${dsAgo(+b.savedAt||0)}${b.name&&b.name!==d.name?' · “'+esc(b.name)+'”':''}</span><button type="button" class="btn sm" data-act="dsRestore" data-a="${esc(b.id)}">Open this version</button></div>`).join('')}</details>`:''}</div>`}).join('');
  const rest=DS.backs.filter(b=>b.kind!=='version'||!DS.list.some(d=>d.id===b.of)),KL={auto:'unsaved work, kept automatically',deleted:'deleted design',version:'earlier version of a deleted design'};
  return now+`<div class="dshead"><h3>My designs${DS.list.length?` <small>${DS.list.length}</small>`:''}</h3>${DS.list.length>5?`<span class="inp dsfind"><input type="search" id="dsFind" placeholder="Find a design" aria-label="Find a design" value="${esc(ui.dsFind||'')}"></span>`:''}</div>
    <p class="hintp" style="margin:0">${note}</p>
    ${DS.list.length?(list.length?`<div class="dgrid">${cards}</div>`:'<p class="hintp">No design has that name.</p>'):'<p class="hintp">Nothing saved yet — name the design above and tap Save design.</p>'}
    ${DS.list.length?`<details class="pf" id="dsCmpBox"${ui.cmpOpen?' open':''}><summary>Compare two designs side by side</summary><p class="hintp">Pick two designs — price, sheets, size and what is different between them.</p><div id="dsCmp"></div></details>`:''}
    ${rest.length?`<details class="pf"${ui.dsBackOpen?' open':''} data-dsback="1"><summary>Recovered work and deleted designs (${rest.length})</summary><p class="hintp">Fitted puts a copy here whenever unsaved work is about to be replaced, and when you delete a design. Copies stay for about three months.</p><div class="dgrid">${rest.map(b=>`<div class="dcard"><div class="dthumb" aria-hidden="true">${dsThumb(b)}</div><div class="dmeta"><b>${esc(b.name||'Untitled design')}</b><span>${KL[b.kind]||''} · ${dsAgo(+b.savedAt||0)}</span></div><div class="dact"><button type="button" class="btn sm" data-act="dsRestore" data-a="${esc(b.id)}">Open</button><button type="button" class="btn sm" data-act="dsBackDel" data-a="${esc(b.id)}">Remove</button></div></div>`).join('')}</div></details>`:''}`}
/* write one design record; returns its id */
async function dsWrite(id,rec){if(DS.db){if(id){await DS.db.doc('designs/'+id).set(rec);return id}const ref=await DS.db.collection('designs').add(rec);return ref.id}
  const l=dsLocalGet();id=id||('d'+Date.now().toString(36)+Math.random().toString(36).slice(2,4));const i=l.findIndex(d=>d.id===id),r=Object.assign({id},rec);if(i>=0)l[i]=r;else l.push(r);if(!dsLocalPut(l))throw {code:'full'};DS.list=l.sort((a,b)=>b.updatedAt-a.updatedAt);return id}
const dsErrText=e=>e&&(e.code==='not_granted'||e.code==='revoked'||e.code==='not_writer')?'you can look but not save — ask for edit access':e&&e.code==='full'?'this browser is full':'no connection, trying again';
/* first save, or "Save a copy": always adds a new design to the list. From then on dsAuto keeps it up to date. */
async function dsSave(asNew){const cur=dsCur();if(!asNew&&cur)return dsAuto();const el=document.getElementById('dsName');let name=((el&&el.value)||'').trim()||ui.docName||S.name||'Untitled design';
  if(cur&&name===(cur.name||''))name=(cur.name||'Design')+' (copy)';const state=JSON.stringify(S);if(state.length>240000){toast('This design is too big to save');return}
  try{const id=await dsWrite(null,{name,state,updatedAt:Date.now()});ui.docId=id;ui.docName=name;ui.savedSig=dsHash(state);ui.fresh=0;ui.dsErr='';saveSoon();
    toast(cur?`Saved a copy — you are now working in “${name}”`:`Saved “${name}”. From now on every change saves by itself.`);renderDesigns();dsBadge()}
  catch(e){toast('Could not save: '+dsErrText(e))}}
/* autosave: a design that is in the list saves itself a few seconds after each change. An "earlier version" copy is kept at most every 20 minutes. */
let dsAutoT=null;
function dsAutoSoon(){if(!ui.docId)return;clearTimeout(dsAutoT);if(dsDirty())dsAutoT=setTimeout(dsAuto,2500);dsBadge()}
async function dsAuto(){const cur=dsCur();if(!cur||!dsDirty()||ui.dsSaving)return;const state=JSON.stringify(S);if(state.length>240000){ui.dsErr='the design is too big';dsBadge();return}
  ui.dsSaving=true;dsBadge();
  try{const lastV=DS.backs.filter(b=>b.kind==='version'&&b.of===cur.id).reduce((a,b)=>Math.max(a,+b.savedAt||0),0);
    if(cur.state&&cur.state!==state&&(ui.forceVer||Date.now()-lastV>20*60000)){const ok=await dsBackup('version',cur.name,cur.state,cur.id);if(ok)ui.forceVer=false}
    await dsWrite(cur.id,{name:cur.name||'Untitled design',state,updatedAt:Date.now()});ui.savedSig=dsHash(state);ui.dsErr=''}
  catch(e){ui.dsErr=dsErrText(e);if(!/look but not/.test(ui.dsErr)){clearTimeout(dsAutoT);dsAutoT=setTimeout(dsAuto,15000)}}
  ui.dsSaving=false;dsBadge();renderDesigns();if(dsDirty())dsAutoSoon()}
async function dsRename(id,name){name=String(name||'').trim();const d=DS.list.find(x=>x.id===id);if(!d||!name||name===d.name){ui.dsRen=null;renderDesigns();return}
  try{const st=id===ui.docId?JSON.stringify(S):d.state;await dsWrite(id,{name,state:st,updatedAt:Date.now()});if(id===ui.docId){ui.docName=name;ui.savedSig=dsHash(st)}d.name=name;ui.dsRen=null;ui.dsMore=null;toast(`Renamed to “${name}”`)}catch(e){toast('Could not rename: '+dsErrText(e))}renderDesigns();dsBadge()}
async function dsDup(id){const d=DS.list.find(x=>x.id===id);if(!d)return;try{await dsWrite(null,{name:(d.name||'Design')+' (copy)',state:id===ui.docId?JSON.stringify(S):d.state,updatedAt:Date.now()});ui.dsMore=null;toast('Duplicated — the copy is at the top of the list')}catch(e){toast('Could not duplicate: '+dsErrText(e))}renderDesigns()}
/* keep unsaved work before something replaces what is in the editor */
function dsKeep(){try{if(!dsDirty())return false;if(ui.fresh&&!ui.docId&&ui.savedSig!=null&&dsSig()===ui.savedSig)return false;dsBackup('auto',ui.docName||'Unsaved design',JSON.stringify(S),ui.docId||'');return true}catch(e){return false}}
/* a brand-new design (wizard, example, pasted text) must never be saved over the design that was open before */
function dsDetach(clean){ui.docId=null;ui.docName='';ui.savedSig=null;ui.fresh=clean?1:0;const n=document.getElementById('dsName');if(n)n.value=''}
function dsOpen(id){const d=DS.list.find(x=>x.id===id);if(!d)return;const kept=dsKeep();try{S=fixFins(JSON.parse(d.state));ui.docId=d.id;ui.docName=d.name||'';ui.fresh=0;ui.sel=0;ui.zsel=null;document.getElementById('iom').hidden=true;changed(true);ui.savedSig=dsSig();saveSoon();toast(`Opened “${d.name||'design'}”`+(kept?'. Your unsaved work was kept under Designs → Recovered work.':''))}catch(e){toast('That design could not be opened')}}
function dsRestore(bid){const b=DS.backs.find(x=>x.id===bid);if(!b)return;dsKeep();try{S=fixFins(JSON.parse(b.state));const still=b.kind==='version'&&DS.list.some(d=>d.id===b.of);ui.docId=still?b.of:null;ui.docName=still?(DS.list.find(d=>d.id===b.of).name||''):(b.name||'');ui.fresh=0;ui.sel=0;ui.zsel=null;document.getElementById('iom').hidden=true;changed(true);ui.savedSig=null;saveSoon();ui.forceVer=true;toast(still?`This earlier version of “${ui.docName}” is open again and is now the current one. The newer one stays under Earlier versions.`:`“${b.name||'Design'}” is open again. Tap Save at the top to keep it in your designs.`)}catch(e){toast('That copy could not be opened')}}
async function dsBackDel(bid){try{if(DS.db)await DS.db.doc('backups/'+bid).delete();else{const l=dsBackLocal().filter(b=>b.id!==bid);localStorage.setItem(DSB,JSON.stringify(l));DS.backs=l}renderDesigns()}catch(e){toast('Could not remove it right now')}}
async function dsDelete(id){const d=DS.list.find(x=>x.id===id);try{if(d){const ok=await dsBackup('deleted',d.name,d.state,d.id);if(!ok){toast('Could not keep a copy, so nothing was deleted');return}}
    if(DS.db)await DS.db.doc('designs/'+id).delete();else{const l=dsLocalGet().filter(d=>d.id!==id);dsLocalPut(l);DS.list=l}if(ui.docId===id){ui.docId=null;ui.savedSig=null}ui.dsBackOpen=1;toast('Deleted — a copy stays under “Recovered work and deleted designs”');renderDesigns();dsBadge()}catch(e){toast('Could not delete right now')}}

