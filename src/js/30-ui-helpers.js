/* ==== 30-ui-helpers.js ====
   Small UI helpers shared by the panels.
*/
/* ================= UI ================= */
const LS='builtin-lofter-v1';
let S, geo, ui={peek:true,pane:'layout',fm:'solid',props:true,tab:'elev',sel:0,zsel:null,xray:false,hide:false,zoom:1,hide3D:false,room3D:true,wizSeen:false};
function load(){try{const t=localStorage.getItem(LS);if(t){const o=JSON.parse(t);if(o&&o.S&&o.S.sections){S=fixFins(o.S);ui.wizSeen=!!o.wizSeen;ui.docId=o.docId||null;ui.docName=o.docName||'';ui.savedSig=o.sv!=null?o.sv:null;return true}}}catch(e){}return false}
let saveT=null;function saveSoon(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(LS,JSON.stringify({S,wizSeen:ui.wizSeen,docId:ui.docId||null,docName:ui.docName||'',sv:ui.savedSig??null}))}catch(e){}try{dsBadge()}catch(e){}},400)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(m,ms){document.querySelectorAll('.toast').forEach(t=>t.remove());const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),ms||Math.max(1800,Math.min(9000,String(m).length*55)))}
function lum(hex){const n=parseInt(hex.slice(1),16);return(0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))/255}

/* SVG finish patterns */
function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
function buildDefs(){let out='';
  Object.entries(FIN).forEach(([k,f],idx)=>{const r=rng(idx*977+131),Wp=320,Hp=1400;let b=`<rect width="${Wp}" height="${Hp}" fill="${f.base}"/>`;
    if(f.kind==='wood'||f.kind==='ply'){const nl=f.kind==='ply'?44:24;for(let i=0;i<nl;i++){const x=r()*Wp;let d=`M${x.toFixed(1)} -20`;for(let y=0;y<=Hp+140;y+=140)d+=` L${(x+Math.sin(y/260+i)*(f.kind==='ply'?2:10)+(r()-.5)*5).toFixed(1)} ${y}`;
      b+=`<path d="${d}" stroke="${f.grain}" stroke-opacity="${(0.12+r()*0.32).toFixed(2)}" stroke-width="${(0.8+r()*(f.kind==='ply'?2:6)).toFixed(1)}" fill="none"/>`}}
    if(f.micro){for(let i=0;i<70;i++)b+=`<ellipse cx="${(r()*Wp).toFixed(0)}" cy="${(r()*Hp).toFixed(0)}" rx="${(50+r()*150).toFixed(0)}" ry="${(30+r()*90).toFixed(0)}" fill="${r()<.6?f.grain:'#fff'}" fill-opacity="${(0.012+r()*0.025).toFixed(3)}"/>`;for(let i=0;i<18;i++){const x=r()*Wp,y=r()*Hp,R=80+r()*140;b+=`<path d="M${x.toFixed(0)} ${y.toFixed(0)}a${R.toFixed(0)} ${(R*0.6).toFixed(0)} 0 0 1 ${(R*1.4).toFixed(0)} 0" stroke="${f.grain}" stroke-opacity=".05" stroke-width="${(2+r()*4).toFixed(1)}" fill="none"/>`}}
    else if(f.kind==='stone'){for(let i=0;i<60;i++)b+=`<circle cx="${(r()*Wp).toFixed(0)}" cy="${(r()*Hp).toFixed(0)}" r="${(4+r()*30).toFixed(0)}" fill="${f.grain}" fill-opacity="${(0.06+r()*0.14).toFixed(2)}"/>`}
    out+=`<pattern id="pv-${k}" patternUnits="userSpaceOnUse" width="${Wp}" height="${Hp}">${b}</pattern><pattern id="ph-${k}" patternUnits="userSpaceOnUse" width="${Wp}" height="${Hp}" patternTransform="rotate(90)">${b}</pattern>`});
  out+=`<pattern id="hatch" patternUnits="userSpaceOnUse" width="60" height="60" patternTransform="rotate(45)"><rect width="60" height="60" style="fill:var(--wall)"/><line x1="0" y1="0" x2="0" y2="60" style="stroke:var(--hatch)" stroke-width="7"/></pattern>`;
  out+=`<pattern id="steel" patternUnits="userSpaceOnUse" width="50" height="50" patternTransform="rotate(45)"><rect width="50" height="50" fill="#69737A"/><line x1="0" y1="0" x2="0" y2="50" stroke="#4B5358" stroke-width="10"/></pattern>`;
  out+=`<pattern id="cloth" patternUnits="userSpaceOnUse" width="12" height="12"><rect width="12" height="12" fill="#35383A"/><circle cx="6" cy="6" r="2.2" fill="#2A2C2E"/></pattern>`;
  Object.entries(FABRICS).forEach(([k,f])=>{out+=`<pattern id="fab-${k}" patternUnits="userSpaceOnUse" width="16" height="16"><rect width="16" height="16" fill="${f.c}"/><rect width="16" height="2" y="7" fill="rgba(0,0,0,.14)"/><rect width="2" height="16" x="7" fill="rgba(255,255,255,.06)"/></pattern>`});
  out+=`<pattern id="studs" patternUnits="userSpaceOnUse" width="16" height="16"><circle cx="8" cy="8" r="4.6" fill="rgba(255,255,255,.22)" stroke="rgba(0,0,0,.22)" stroke-width="1"/></pattern>`;
  {const r=rng(9157);let m='';for(let i=0;i<70;i++)m+=`<ellipse cx="${(r()*900).toFixed(0)}" cy="${(r()*900).toFixed(0)}" rx="${(50+r()*150).toFixed(0)}" ry="${(30+r()*90).toFixed(0)}" fill="${r()<.55?'#000':'#fff'}" fill-opacity="${(0.015+r()*0.03).toFixed(3)}"/>`;for(let i=0;i<22;i++){const x=r()*900,y=r()*900,R=80+r()*140;m+=`<path d="M${x.toFixed(0)} ${y.toFixed(0)}a${R.toFixed(0)} ${(R*0.6).toFixed(0)} 0 0 1 ${(R*1.4).toFixed(0)} 0" stroke="#000" stroke-opacity=".05" stroke-width="${(2+r()*4).toFixed(1)}" fill="none"/>`}out+=`<pattern id="microfx" patternUnits="userSpaceOnUse" width="900" height="900">${m}</pattern>`}
  out+=`<pattern id="peg" patternUnits="userSpaceOnUse" width="50" height="50"><circle cx="25" cy="25" r="4.5" fill="rgba(40,30,20,.55)"/></pattern>`;
  out+=`<pattern id="folds" patternUnits="userSpaceOnUse" width="90" height="100"><rect width="90" height="100" fill="rgba(255,255,255,.06)"/><rect x="0" width="22" height="100" fill="rgba(0,0,0,.16)"/><rect x="22" width="14" height="100" fill="rgba(0,0,0,.07)"/><rect x="55" width="20" height="100" fill="rgba(255,255,255,.14)"/></pattern>`;
  out+=`<pattern id="flute" patternUnits="userSpaceOnUse" width="25" height="100"><rect width="25" height="100" fill="rgba(255,255,255,.10)"/><rect x="0" width="5" height="100" fill="rgba(0,0,0,.20)"/><rect x="5" width="5" height="100" fill="rgba(0,0,0,.08)"/><rect x="16" width="5" height="100" fill="rgba(255,255,255,.14)"/></pattern>`;
  out+=`<pattern id="cane" patternUnits="userSpaceOnUse" width="36" height="36"><rect width="36" height="36" fill="#E3CFA3"/><path d="M0 0L36 36M36 0L0 36" stroke="#B58F55" stroke-width="5"/><path d="M18 0V36M0 18H36" stroke="#C9A66C" stroke-width="4"/><circle cx="9" cy="9" r="4.5" fill="#3B3024" opacity=".55"/><circle cx="27" cy="27" r="4.5" fill="#3B3024" opacity=".55"/><circle cx="27" cy="9" r="4.5" fill="#3B3024" opacity=".55"/><circle cx="9" cy="27" r="4.5" fill="#3B3024" opacity=".55"/></pattern>`;
  out+=`<pattern id="glassf" patternUnits="userSpaceOnUse" width="22" height="100"><rect width="22" height="100" fill="rgba(214,228,226,.38)"/><rect width="7" height="100" fill="rgba(255,255,255,.35)"/><rect x="15" width="4" height="100" fill="rgba(60,80,80,.12)"/></pattern>`;
  out+=`<radialGradient id="mirrg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#F4F8F9"/><stop offset=".6" stop-color="#C9D4D8"/><stop offset="1" stop-color="#9EAEB4"/></radialGradient>`;
  out+=`<linearGradient id="ledg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD88A" stop-opacity=".75"/><stop offset=".45" stop-color="#FFE3A8" stop-opacity=".25"/><stop offset="1" stop-color="#FFE3A8" stop-opacity="0"/></linearGradient>`;
  out+=`<linearGradient id="tvg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2B3540"/><stop offset=".55" stop-color="#101418"/><stop offset="1" stop-color="#080A0C"/></linearGradient>`;
  document.getElementById('gdefs').innerHTML=out}

