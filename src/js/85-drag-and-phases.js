/* ==== 85-drag-and-phases.js ====
   Dragging level edges in the drawing, and building in phases (only some columns).
*/
/* ===== drag level edges in the drawing ===== */
(function(){const wrap=document.getElementById('elevWrap');let d=null;
  const svgY=e=>{const sv=wrap.querySelector('svg');const pt=sv.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=sv.getScreenCTM();return m?pt.matrixTransform(m.inverse()).y:0};
  wrap.addEventListener('pointerdown',e=>{const g=e.target.closest('.zdrag');if(!g)return;const[i,k]=g.dataset.zd.split('|').map(Number);const q=geo.secs[i];if(!q)return;const zr=q.zones.find(z=>z.k===k);if(!zr)return;
    const snaps=[];geo.secs.forEach(o=>{if(o.i===i)return;o.zones.forEach(z=>{if(!z.top&&z.divY!=null)snaps.push(z.divY+z.divT/2)});if(o.desk)snaps.push(+o.s.deskH)});
    const nxt=q.zones.find(z=>z.k===k+1),src=(()=>{const j=q.s.link?S.sections.findIndex(y=>y.id===q.s.link):-1;return j>=0?j:i})();
    d={g,i,k,src,by:+g.dataset.by,y0:svgY(e),zr,nxt,snaps,id:e.pointerId,moved:false,nb:+g.dataset.by};
    e.preventDefault();e.stopPropagation();try{wrap.setPointerCapture(e.pointerId)}catch(_){}g.classList.add('act')},true);
  wrap.addEventListener('pointermove',e=>{if(!d||e.pointerId!==d.id)return;const dy=d.y0-svgY(e);if(!d.moved&&Math.abs(dy)<4)return;d.moved=true;
    let nb=Math.round((d.by+dy)/10)*10;const sn=d.snaps.find(v=>Math.abs(v-(d.by+dy))<25);if(sn!=null)nb=sn;
    const lo=d.zr.y0+120+d.zr.divT/2,hiTop=d.nxt?(d.nxt.top?d.nxt.y0+d.nxt.h-150:d.nxt.y0+d.nxt.h-120):d.by;nb=Math.max(lo,Math.min(hiTop,nb));d.nb=nb;
    const off=-(nb-d.by);d.g.setAttribute('transform',`translate(0 ${off})`);d.g.querySelector('.zdl').setAttribute('stroke-opacity','1');const t=d.g.querySelector('.zdt');t.style.display='';t.textContent=`${f0(nb-d.zr.divT/2-d.zr.y0)} mm${sn!=null&&nb===sn?' · lines up':''}`;e.preventDefault()});
  const up=e=>{if(!d)return;const dd=d;d=null;dd.g.classList.remove('act');if(!dd.moved)return;
    const kill=ev=>{ev.stopPropagation();ev.preventDefault()};addEventListener('click',kill,{capture:true,once:true});setTimeout(()=>removeEventListener('click',kill,{capture:true}),60);
    const delta=dd.nb-dd.by;if(Math.abs(delta)<1){renderTab('elev');return}const zs=S.sections[dd.src].zones,z=zs[dd.k],zn=zs[dd.k+1];
    z.h=Math.round(dd.zr.h+delta);if(zn&&+zn.h>0&&dd.nxt&&!dd.nxt.top)zn.h=Math.max(120,Math.round(dd.nxt.h-delta));
    ui.sel=dd.i;ui.zsel=dd.k;changed(true);toast(`Level height ${f0(z.h)} mm${dd.src!==dd.i?` (changed on column ${dd.src+1}, which this column follows)`:''}.`)};
  wrap.addEventListener('pointerup',up);wrap.addEventListener('pointercancel',up)})();
(function(){const wrap=document.getElementById('elevWrap');let d=null;
  const svgX=e=>{const sv=wrap.querySelector('svg');const pt=sv.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=sv.getScreenCTM();return m?pt.matrixTransform(m.inverse()).x:0};
  wrap.addEventListener('pointerdown',e=>{const g=e.target.closest('.cdrag');if(!g)return;const [i,sd,j]=g.dataset.cd.split('|');const q=geo.secs[+i],nq=geo.secs[+j];if(!q||!nq)return;
    d={g,i:+i,j:+j,sd,x0:svgX(e),bx:+g.dataset.bx,w0:q.w,w1:nq.w,id:e.pointerId,moved:false,dw:0};e.preventDefault();e.stopPropagation();try{wrap.setPointerCapture(e.pointerId)}catch(_){}g.classList.add('act')},true);
  wrap.addEventListener('pointermove',e=>{if(!d||e.pointerId!==d.id)return;let dx=svgX(e)-d.x0;if(!d.moved&&Math.abs(dx)<4)return;d.moved=true;
    let dw=Math.round((d.sd==='r'?dx:-dx)/10)*10;dw=Math.max(150-d.w0,Math.min(d.w1-150,dw));d.dw=dw;const off=d.sd==='r'?dw:-dw;
    d.g.setAttribute('transform',`translate(${off} 0)`);d.g.querySelector('.cdl').setAttribute('stroke-opacity','1');const t=d.g.querySelector('.cdt');t.style.display='';t.textContent=`S${d.i+1} ${f0(d.w0+dw)} · S${d.j+1} ${f0(d.w1-dw)} mm`;e.preventDefault()});
  const up=e=>{if(!d)return;const dd=d;d=null;dd.g.classList.remove('act');if(!dd.moved)return;
    const kill=ev=>{ev.stopPropagation();ev.preventDefault()};addEventListener('click',kill,{capture:true,once:true});setTimeout(()=>removeEventListener('click',kill,{capture:true}),60);
    if(Math.abs(dd.dw)<1){renderTab('elev');return}const a=S.sections[dd.i],b=S.sections[dd.j],aAuto=!(+a.w>0),bAuto=!(+b.w>0);
    if(!aAuto||bAuto)a.w=Math.round(dd.w0+dd.dw);if(!bAuto)b.w=Math.round(dd.w1-dd.dw);if(aAuto&&!bAuto){} 
    ui.sel=dd.i;changed(true);toast(`S${dd.i+1} is now ${f0(geo.secs[dd.i].w)} mm and S${dd.j+1} ${f0(geo.secs[dd.j].w)} mm wide.`)};
  wrap.addEventListener('pointerup',up);wrap.addEventListener('pointercancel',up)})();
/* ===== partial builds: only some cabinets in the parts, sheets, lofting, guide and PDF ===== */
function hDiff(a,b){if(typeof a==='number')return a-(typeof b==='number'?b:0);if(Array.isArray(a))return a.slice(Array.isArray(b)?b.length:0);if(a&&typeof a==='object'){const o={};Object.keys(a).forEach(k=>{o[k]=hDiff(a[k],b?b[k]:undefined)});return o}return a}
function hAdd(a,b){if(b==null)return a;if(a==null)return JSON.parse(JSON.stringify(b));if(typeof a==='number')return a+(+b||0);if(Array.isArray(a))return a.concat(b||[]);if(typeof a==='object'){const o={...a};Object.keys(b).forEach(k=>{o[k]=hAdd(a[k],b[k])});return o}return b??a}
function partSet(G){G=G||geo;const p=S.opts.part;if(!p||!p.on)return null;const n=G.secs.length,a=(p.secs||[]).filter(i=>i>=0&&i<n&&!G.secs[i].panel);return a.length?new Set(a):null}
let _bg=null;
function bgeo(){const G=geo,ps=partSet(G);if(!ps)return G;const sh=S.opts.part.shared!==false,key=[...ps].sort().join(',')+'|'+sh;if(_bg&&_bg.src===G&&_bg.key===key)return _bg.g;
  const inSel=p=>{const m=(String(p.sec).match(/S(\d+)/g)||[]).map(x=>+x.slice(1)-1);return m.length?m.some(i=>ps.has(i)):sh};
  let H=G.H;const sn=G.Hsnap;if(sn&&sn.length===G.secs.length+1){const snap=sn.map(x=>JSON.parse(x));H=hAdd(snap[0],hDiff(G.H,snap[snap.length-1]));if(!sh)H=snap[0];[...ps].forEach(i=>{H=hAdd(H,hDiff(snap[i+1],snap[i]))})}
  {const sel=G.secs.filter(q=>ps.has(q.i)&&!q.panel&&!q.door);if(H.join){const j=sel.reduce((a,q)=>a+(q.jn||0),0);H={...H,join:{...H.join,joints:j,dowels:H.join.type==='confirmat'?0:j}}}H={...H,wallHang:sel.filter(q=>!q.free||q.mount==='wall').length*2,stacked:sel.filter(q=>q.splitK>=0).length}}
  const g=Object.assign({},G,{panels:G.panels.filter(inSel),H,secs:G.secs.filter(q=>ps.has(q.i)),partial:[...ps].sort((a,b)=>a-b),partShared:sh});
  _bg={src:G,key,g};return g}
function batchUI(ps){const bs=S.opts.batches||[];const cur=ps?[...ps].sort((a,b)=>a-b).join(','):'';
  return `<div class="batches">${bs.map((b,i)=>`<div class="batch ${b.secs.join(',')===cur?'on':''}"><button type="button" class="bname" data-act="batchUse" data-a="${i}"><b>${esc(b.name)}</b><small>columns ${b.secs.map(x=>x+1).join(', ')}</small></button><label class="chk"><input type="checkbox" data-act="batchTick" data-a="${i}|cut" ${b.cut?'checked':''}> cut</label><label class="chk"><input type="checkbox" data-act="batchTick" data-a="${i}|built" ${b.built?'checked':''}> built</label><button type="button" class="rowbtn" data-act="batchDel" data-a="${i}" aria-label="Remove ${esc(b.name)}">×</button></div>`).join('')}
  ${ps&&!bs.some(b=>b.secs.join(',')===cur)?`<button type="button" class="btn sm" data-act="batchSave">Save these columns as batch ${bs.length+1}</button>`:''}</div>`}
function partLabel(){const ps=partSet();return ps?`Columns ${[...ps].sort((a,b)=>a-b).map(i=>i+1).join(', ')}`:'All columns'}
function partBar(){const p=S.opts.part||{},on=!!p.on,ps=partSet(),n=geo.secs.length;
  if(!on)return `<div class="partmini"><button type="button" class="linkb" data-act="setv" data-a="opts.part.on|1|s">Building in phases? Show only some columns</button></div>`;
  return `<div class="partbar"><div class="pbrow"><b>Building</b>${seg('opts.part.on',[['','Everything'],['1','Only some columns']],{dflt:''})}</div>
  ${on?`<div class="pbrow pbsecs">${geo.secs.map((q,i)=>q.panel?'':`<button type="button" class="pbsec ${ps&&ps.has(i)?'on':''}" data-act="partSec" data-a="${i}" aria-pressed="${!!(ps&&ps.has(i))}"><b>${i+1}</b><small>${(S.opts.batches||[]).some(b=>b.built&&b.secs.includes(i))?'✓ built':(S.opts.batches||[]).some(b=>b.cut&&b.secs.includes(i))?'✓ cut':({desk:'Desk',door:'Door',free:'Free'})[q.s.base]||f0(q.w)}</small></button>`).join('')}<button type="button" class="btn sm" data-act="partAll">All</button><button type="button" class="btn sm" data-act="partNone">None</button></div>
  ${batchUI(ps)}
  <label class="chk"><input type="checkbox" data-act="partShared" ${p.shared!==false?'checked':''}> Also plinths, top closing strips and wall fillers</label>
  <p class="hintp" style="margin:0">${ps?`Parts, sheets, shaped parts, hardware, guide and PDF now cover <b>${partLabel().toLowerCase()}</b> only. A side shared with a column you're not building is included, so the cabinets stand on their own.`:'Tap the columns you want to build now.'}</p>`:''}</div>`}

