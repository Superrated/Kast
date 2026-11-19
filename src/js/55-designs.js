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
  if(!db){DS.local=true;DS.list=dsLocalGet().sort((a,b)=>b.updatedAt-a.updatedAt);DS.backs=dsBackLocal();DS.state='ready';renderDesigns();dsBadge();return}
  DS.db=db;const t=setTimeout(()=>{if(DS.state==='loading'){DS.state='slow';renderDesigns()}},10000);
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
function dsBadge(){const c=dsCur(),dirty=dsDirty(),nm=c?(c.name||'Untitled design'):'',b=document.getElementById('dsBtn'),m=document.getElementById('dsBtnM');
  if(b){b.innerHTML=`Designs${nm?` · <span class="dsnm">${esc(nm.length>18?nm.slice(0,17)+'…':nm)}</span>`:''}${dirty&&(c||!ui.fresh||ui.savedSig==null||dsSig()!==ui.savedSig)?'<i class="dsdot" title="Changes not saved yet"></i>':''}`;b.title=c?(dirty?`“${nm}” has changes that are not saved yet`:`“${nm}” — all changes saved`):(dirty?'This design is not saved yet':'Saved designs')}
  if(m)m.textContent='My designs'+(dirty?' · not saved yet':'');try{ntBadge()}catch(e){}}
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
document.addEventListener('toggle',e=>{if(e.target&&e.target.dataset&&e.target.dataset.qa)ui.qaOpen=e.target.open;if(e.target&&e.target.id==='dsCmpBox')renderCompare();if(e.target&&e.target.dataset&&e.target.dataset.off)ui.offOpen=e.target.open},true);
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.cmp;if(!k)return;if(k==='a')ui.cmpA=e.target.value;else ui.cmpB=e.target.value;renderCompare()});
function renderDesigns(){const el=document.getElementById('dsList'),note=document.getElementById('dsNote');if(!el||document.getElementById('iom').hidden)return;try{renderCompare()}catch(e){}
  const c=dsCur(),dirty=dsDirty(),now=document.getElementById('dsNow'),btns=document.getElementById('dsBtns'),help=document.getElementById('dsHelp'),nm=c?(c.name||'Untitled design'):'';
  now.className='dsnow'+(dirty?' dirty':'');
  now.innerHTML=c?`<b>Open now: “${esc(nm)}”</b><span>${dirty?'It has changes that are not saved yet.':'All changes are saved.'}</span>`:`<b>This design is not in your list yet</b><span>${dirty?'Give it a name and save it, or it only lives in this browser.':'It is the example. Change something and save it under your own name.'}</span>`;
  btns.innerHTML=c?`<button class="btn pri" data-act="dsSave">Save changes</button><button class="btn" data-act="dsSaveNew">Save as a new design</button>`:`<button class="btn pri" data-act="dsSaveNew">Save as a new design</button>`;
  help.textContent=c?`“Save changes” updates “${nm}” in the list below — the way it was before stays under its “Earlier versions”. “Save as a new design” leaves “${nm}” untouched and adds a second one.`:'Saving adds this design to the list below. Nothing in the list is replaced.';
  note.textContent=DS.state==='loading'?'Loading saved designs…':DS.state==='slow'?'Still loading — check your connection.':DS.state==='error'?'Saved designs could not be loaded right now.':DS.local?'Saved in this browser only (shared saving works in the published app).':DS.list.length?'Saved in the app — everyone you share Fitted with sees these.':'No saved designs yet. Name this one and tap Save.';
  const vers=id=>DS.backs.filter(b=>b.kind==='version'&&b.of===id);
  el.innerHTML=DS.list.map(d=>{const v=vers(d.id);return `<div class="dcard${d.id===ui.docId?' on':''}"><button type="button" class="dthumb" data-act="dsOpen" data-a="${esc(d.id)}" aria-label="Open ${esc(d.name||'design')}">${dsThumb(d)}</button><div class="dmeta"><b>${esc(d.name||'Untitled design')}</b><span>${dsAgo(+d.updatedAt||0)}${d.id===ui.docId?' · open now':''}</span></div><div class="dact"><button type="button" class="btn sm" data-act="dsOpen" data-a="${esc(d.id)}">Open</button><button type="button" class="btn sm" data-act="dsDel" data-a="${esc(d.id)}">Delete</button></div>${v.length?`<details class="pf dver"><summary>Earlier versions (${v.length})</summary>${v.map(b=>`<div class="dvrow"><span>${dsAgo(+b.savedAt||0)}${b.name&&b.name!==d.name?' · “'+esc(b.name)+'”':''}</span><button type="button" class="btn sm" data-act="dsRestore" data-a="${esc(b.id)}">Open this version</button></div>`).join('')}</details>`:''}</div>`}).join('');
  const rest=DS.backs.filter(b=>b.kind!=='version'||!DS.list.some(d=>d.id===b.of)),bk=document.getElementById('dsBack'),KL={auto:'unsaved work, kept automatically',deleted:'deleted design',version:'earlier version of a deleted design'};
  if(bk)bk.innerHTML=rest.length?`<details class="pf"${ui.dsBackOpen?' open':''} data-dsback="1"><summary>Recovered work and deleted designs (${rest.length})</summary><p class="hintp">Fitted puts a copy here whenever unsaved work is about to be replaced, and when you delete a design. Copies stay for about three months.</p><div class="dgrid">${rest.map(b=>`<div class="dcard"><div class="dthumb" aria-hidden="true">${dsThumb(b)}</div><div class="dmeta"><b>${esc(b.name||'Untitled design')}</b><span>${KL[b.kind]||''} · ${dsAgo(+b.savedAt||0)}</span></div><div class="dact"><button type="button" class="btn sm" data-act="dsRestore" data-a="${esc(b.id)}">Open</button><button type="button" class="btn sm" data-act="dsBackDel" data-a="${esc(b.id)}">Remove</button></div></div>`).join('')}</div></details>`:''}
async function dsSave(asNew){const name=(document.getElementById('dsName').value||'').trim()||'Untitled design',state=JSON.stringify(S);
  if(state.length>240000){toast('This design is too big to save');return}
  const rec={name,state,updatedAt:Date.now()},cur=asNew?null:dsCur();
  try{if(cur&&cur.state!==state){const ok=await dsBackup('version',cur.name,cur.state,cur.id);if(!ok){toast('Could not keep a copy of the earlier version, so nothing was replaced. Use “Save as a new design”.');return}}
    if(DS.db){if(cur)await DS.db.doc('designs/'+cur.id).set(rec);else{const ref=await DS.db.collection('designs').add(rec);ui.docId=ref.id}}
    else{const l=dsLocalGet();const id=cur?cur.id:('d'+Date.now().toString(36));const i=l.findIndex(d=>d.id===id);const r=Object.assign({id},rec);if(i>=0)l[i]=r;else l.push(r);if(!dsLocalPut(l)){toast('Could not save in this browser');return}ui.docId=id;DS.list=l.sort((a,b)=>b.updatedAt-a.updatedAt)}
    ui.docName=name;ui.savedSig=dsHash(state);ui.fresh=0;saveSoon();toast(cur?`Saved the changes to “${name}”`:`Saved “${name}” as a new design`);renderDesigns();dsBadge()}
  catch(e){toast(e&&(e.code==='not_granted'||e.code==='revoked')?'You can look at designs but not save — ask for edit access':'Could not save right now')}}
/* keep unsaved work before something replaces what is in the editor */
function dsKeep(){try{if(!dsDirty())return false;if(ui.fresh&&!ui.docId&&ui.savedSig!=null&&dsSig()===ui.savedSig)return false;dsBackup('auto',ui.docName||'Unsaved design',JSON.stringify(S),ui.docId||'');return true}catch(e){return false}}
/* a brand-new design (wizard, example, pasted text) must never be saved over the design that was open before */
function dsDetach(clean){ui.docId=null;ui.docName='';ui.savedSig=null;ui.fresh=clean?1:0;const n=document.getElementById('dsName');if(n)n.value=''}
function dsOpen(id){const d=DS.list.find(x=>x.id===id);if(!d)return;const kept=dsKeep();try{S=fixFins(JSON.parse(d.state));ui.docId=d.id;ui.docName=d.name||'';ui.fresh=0;ui.sel=0;ui.zsel=null;document.getElementById('iom').hidden=true;changed(true);ui.savedSig=dsSig();saveSoon();toast(`Opened “${d.name||'design'}”`+(kept?'. Your unsaved work was kept under Designs → Recovered work.':''))}catch(e){toast('That design could not be opened')}}
function dsRestore(bid){const b=DS.backs.find(x=>x.id===bid);if(!b)return;dsKeep();try{S=fixFins(JSON.parse(b.state));const still=b.kind==='version'&&DS.list.some(d=>d.id===b.of);ui.docId=still?b.of:null;ui.docName=still?(DS.list.find(d=>d.id===b.of).name||''):(b.name||'');ui.fresh=0;ui.sel=0;ui.zsel=null;document.getElementById('iom').hidden=true;changed(true);ui.savedSig=null;saveSoon();toast(still?`This earlier version of “${ui.docName}” is open. Tap Designs → Save changes to make it the current one.`:`“${b.name||'Design'}” is open again. Tap Designs → Save as a new design to keep it.`)}catch(e){toast('That copy could not be opened')}}
async function dsBackDel(bid){try{if(DS.db)await DS.db.doc('backups/'+bid).delete();else{const l=dsBackLocal().filter(b=>b.id!==bid);localStorage.setItem(DSB,JSON.stringify(l));DS.backs=l}renderDesigns()}catch(e){toast('Could not remove it right now')}}
async function dsDelete(id){const d=DS.list.find(x=>x.id===id);try{if(d){const ok=await dsBackup('deleted',d.name,d.state,d.id);if(!ok){toast('Could not keep a copy, so nothing was deleted');return}}
    if(DS.db)await DS.db.doc('designs/'+id).delete();else{const l=dsLocalGet().filter(d=>d.id!==id);dsLocalPut(l);DS.list=l}if(ui.docId===id){ui.docId=null;ui.savedSig=null}ui.dsBackOpen=1;toast('Deleted — a copy stays under “Recovered work and deleted designs”');renderDesigns();dsBadge()}catch(e){toast('Could not delete right now')}}

