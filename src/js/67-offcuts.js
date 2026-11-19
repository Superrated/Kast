/* ==== 67-offcuts.js ====
   Offcuts: keep leftovers and cut small parts from them first.
*/
/* ===== offcuts: leftover pieces kept for later ===== */
const OFF={list:[],db:null,LS:'kast-offcuts'};
function offLocal(){try{return JSON.parse(localStorage.getItem(OFF.LS)||'[]')}catch(e){return []}}
async function offInit(){let db=null;try{if(window.claude&&claude.use)db=await claude.use('db')}catch(e){}
  if(!db){OFF.list=offLocal();return}OFF.db=db;try{db.collection('offcuts').orderBy('savedAt','desc').limit(300).onSnapshot(snap=>{OFF.list=snap.docs.map(d=>Object.assign({id:d.id},d.data()));if(S.opts.useOff){groupsCache=null;dirty.cut=true;if(ui.tab==='cut')renderCut()}},()=>{})}catch(e){}}
async function offAdd(items){const now=Date.now();items=items.map((o,i)=>Object.assign({id:'o'+now.toString(36)+i,savedAt:now},o));
  if(OFF.db){for(const o of items){try{const{id,...d}=o;await OFF.db.doc('offcuts/'+id).set(d)}catch(e){}}}else{OFF.list=items.concat(OFF.list);try{localStorage.setItem(OFF.LS,JSON.stringify(OFF.list))}catch(e){}}}
async function offDel(id){if(OFF.db){try{await OFF.db.doc('offcuts/'+id).delete()}catch(e){}}else{OFF.list=OFF.list.filter(o=>o.id!==id);try{localStorage.setItem(OFF.LS,JSON.stringify(OFF.list))}catch(e){}}}
/* leftovers of a packed group worth keeping: at least 300 × 100 mm */
function offLeft(g){const out=[],sh=g.sh,{kerf,trim}=sawCfg(),L=sh.L-2*trim,Wd=sh.W-2*trim;(g.sheets||[]).forEach(s=>{(s.shelves||[]).forEach(r=>{const l=L-r.x;if(l>=300&&r.h>=100)out.push([Math.floor(l),Math.floor(r.h)])});const top=Wd-s.y;if(top>=100&&L>=300)out.push([Math.floor(L),Math.floor(top)])});
  return out.map(([a,b])=>({mt:g.mt,fin:g.fin,t:g.t,L:Math.max(a,b),W:Math.min(a,b),from:ui.docName||'a design'}))}
/* put parts into stored offcuts first (guillotine: what is left of an offcut goes back in the pool) */
function offUse(g){if(!S.opts.useOff||!OFF.list.length)return {parts:g.parts,used:[]};const {kerf}=sawCfg();
  let pool=OFF.list.filter(o=>o.mt===g.mt&&o.fin===g.fin&&+o.t===+g.t).map(o=>({id:o.id,L:+o.L,W:+o.W,src:o}));if(!pool.length)return {parts:g.parts,used:[]};
  const grain=FIN[g.fin]&&FIN[g.fin].kind!=='plain'&&!FIN[g.fin].micro,rest=[],used=[];
  g.parts.slice().sort((a,b)=>b.w*b.h-a.w*a.h).forEach(p=>{const pl=p.grain==='w'?p.w:p.h,pw=p.grain==='w'?p.h:p.w;let best=null;
    if(!p.rect){rest.push(p);return}
    pool.forEach((o,i)=>{const fitA=pl<=o.L&&pw<=o.W,fitB=!grain&&pl<=o.W&&pw<=o.L;if((fitA||fitB)&&(!best||o.L*o.W<best.o.L*best.o.W))best={o,i,rot:!fitA}});
    if(!best){rest.push(p);return}const o=best.o,a=best.rot?pw:pl,b=best.rot?pl:pw;used.push({p,off:o.src});pool.splice(best.i,1);
    if(o.L-a-kerf>=100)pool.push({id:o.id,L:o.L-a-kerf,W:o.W,src:o.src});if(o.W-b-kerf>=100)pool.push({id:o.id,L:a,W:o.W-b-kerf,src:o.src})});
  return {parts:rest,used}}
function offHTML(nest){const used=nest.flatMap(n=>(n.offUsed||[]).map(u=>({...u,n}))),left=nest.flatMap(offLeft),mine=OFF.list;const nm=o=>`${MATS[o.mt]?.short||o.mt} ${FIN[o.fin]?.name||o.fin} ${o.t} mm`;
  return `<details class="pf offc"${ui.offOpen?' open':''} data-off="1"><summary>Offcuts${mine.length?` (${mine.length} kept)`:''}${used.length?` · ${used.length} part${used.length>1?'s':''} from offcuts`:''}</summary>
  <p class="hintp">Keep the useful leftovers of a project and Fitted cuts small parts from them next time, before it adds a new sheet.</p>
  <label class="chk"><input type="checkbox" data-p="opts.useOff" data-re="1" ${S.opts.useOff?'checked':''}> Cut parts from my kept offcuts first</label>
  ${used.length?`<p class="hintp" style="margin:0"><b>From your offcuts:</b> ${Object.values(used.reduce((m,u)=>{const k=u.off.id;(m[k]=m[k]||{o:u.off,ps:{}});const nm_=u.p.type;m[k].ps[nm_]=(m[k].ps[nm_]||0)+1;return m},{})).map(x=>`<br>${f0(x.o.L)} × ${f0(x.o.W)} ${esc(nm(x.o))} → ${Object.entries(x.ps).map(([t,c])=>`${c}× ${esc(t)}`).join(', ')}`).join('')}</p>`:''}
  ${mine.length?`<table class="mini offt"><tr><td class="note">Kept offcut</td><td class="note">Size</td><td class="note">From</td><td></td></tr>${mine.slice(0,60).map(o=>`<tr><td>${esc(nm(o))}</td><td>${f0(o.L)} × ${f0(o.W)}</td><td class="note">${esc(o.from||'')}</td><td><button type="button" class="rowbtn" data-act="offDel" data-a="${esc(o.id)}" aria-label="Remove">×</button></td></tr>`).join('')}</table>`:'<p class="hintp" style="margin:0">No offcuts kept yet.</p>'}
  <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:end">${left.length?`<button type="button" class="btn sm" data-act="offKeep">Keep this design’s ${left.length} leftover${left.length>1?'s':''}</button>`:''}
    <span class="inp" style="width:90px"><input type="number" id="offL" placeholder="length"><em>mm</em></span><span class="inp" style="width:90px"><input type="number" id="offW" placeholder="width"><em>mm</em></span>
    <span class="inp"><select id="offM">${[...new Set(nest.map(n=>n.mt+'|'+n.fin+'|'+n.t))].map(k=>{const[mt,fin,t]=k.split('|');return `<option value="${esc(k)}">${esc(nm({mt,fin,t}))}</option>`}).join('')}</select></span><button type="button" class="btn sm" data-act="offAdd">Add a piece</button></div></details>`}
function nestAll(gs){
  const sp=stockPlan(gs);gs=gs.filter(p=>!sp.ids.has(p.id));
  const byKey={};gs.forEach(p=>{const k=p.matType+'|'+p.fin+'|'+p.t+'|'+p.sheet;(byKey[k]=byKey[k]||{fin:p.fin,t:p.t,sheet:p.sheet,mt:p.matType,parts:[]});for(let i=0;i<p.qty;i++)byKey[k].parts.push(p)});
  return Object.values(byKey).map(g=>{const sh=sheetOf(g.sheet),grain=FIN[g.fin]&&FIN[g.fin].kind!=='plain'&&!FIN[g.fin].micro;
    const sc=sawCfg(),ou=offUse(g),r=packGroup(ou.parts,sh,sc.kerf,sc.trim,grain);return {...g,...r,offUsed:ou.used,sh,grain,name:`${MATS[g.mt]?.short||''} ${FIN[g.fin]?.name} ${g.t}`}});
}
