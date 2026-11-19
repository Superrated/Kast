/* ==== 72-workshop-3d.js ====
   Workshop mode → "Boxes 3D": one box at a time in 3D, with a slider that pulls it apart.
   - Letters on the parts match the exploded sheets in the technical drawings (tdPartRows in 52-techdraw.js).
   - Tap a part: its card shows the size, board, edge banding (same picture as the labels), grain and holes,
     matched to the cut list part number (P12).
   - "Measurements" draws the box's width, height and depth and the height of every shelf from the floor.
   It has its own small three.js scene, so the main 3D view is not touched.
*/
const WX={col:0,t:0.55,dims:true,labels:true,hw:true,marks:true,sel:null,r:null};try{const o=JSON.parse(localStorage.getItem('fitted-wx')||'null');if(o){WX.hw=o.hw!==false;WX.marks=o.marks!==false}}catch(e){}
function wxSave(){try{localStorage.setItem('fitted-wx',JSON.stringify({hw:WX.hw,marks:WX.marks}))}catch(e){}}
function wxCols(){const G=geo,sol=tdSolids(G);return tdCols(G,sol).filter(c=>c.q&&!c.q.panel&&c.cs.length)}
/* find the cut-list part for a solid: same column, same thickness, same size */
function wxMatch(gs,s,n,row){const ex=[row.L,row.W],re=new RegExp('^S'+n+'(\\D|$)');const ok=p=>Math.abs(p.t-row.t)<1.2&&Math.abs(Math.max(p.L,p.Wd)-ex[0])<4.5&&Math.abs(Math.min(p.L,p.Wd)-ex[1])<4.5;
  return gs.filter(p=>p.secs.some(x=>re.test(x))&&ok(p))[0]||gs.filter(ok)[0]||null}
function wxColour(s){if(/^fabric:/.test(s.role)){const k=s.role.slice(7);return (FABRICS[k]||{}).c||'#555'}
  const k=s.fin||(S.mat[{front:'front',back:'back',shelf:'shelf',skirt:'skirt',desk:'desk'}[s.role]||'carcass']||{}).fin;return (FIN[k]||FIN.ral9010||{base:'#ddd'}).base}
/* triangles for one solid (flat-shaded prism) */
function wxGeo(s){const A=s.A,B=s.B,n=A.length,o=[0,1,2].filter(k=>k!==s.ax),p2=A.map(p=>new THREE.Vector2(p[o[0]],p[o[1]]));let tri=[];try{tri=THREE.ShapeUtils.triangulateShape(p2,[])}catch(e){}
  if(!tri.length)for(let i=1;i+1<n;i++)tri.push([0,i,i+1]);const v=[],push=(...ps)=>ps.forEach(p=>v.push(p[0],p[1],p[2]));
  tri.forEach(([a,b,c])=>{push(A[a],A[b],A[c]);push(B[c],B[b],B[a])});for(let i=0;i<n;i++){const j=(i+1)%n;push(A[i],A[j],B[j]);push(A[i],B[j],B[i])}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();return g}
function wxOpen(){ui.ws=ui.ws||{};ui.ws.tab='boxes';wsRender()}
function wxRender(m){const cols=wxCols();if(WX.col>=cols.length)WX.col=0;const c=cols[WX.col];
  const tabs=`<div class="wsbar"><div class="seg"><button type="button" data-act="wsTab" data-a="cuts">Cuts</button><button type="button" data-act="wsTab" data-a="steps">Build steps</button><button type="button" class="on" data-act="wsTab" data-a="boxes">Boxes 3D</button></div><button type="button" class="btn sm" data-act="wsClose">Close</button></div>`;
  if(!c){m.innerHTML=tabs+'<div class="wscard"><div class="wsbig">There are no boxes in this design</div></div>';return}
  m.innerHTML=tabs+`<div class="wxchips">${cols.map((x,i)=>`<button type="button" class="tchip ${i===WX.col?'on':''}" data-act="wxCol" data-a="${i}">Box ${x.n}<small>${f0(x.bx.x1-x.bx.x0)} wide</small></button>`).join('')}</div>
  <div class="wxmain"><div class="wxstage" id="wxStage"><div class="wxlabs" id="wxLabs"></div><div class="wxcard" id="wxCard" hidden></div><div class="wxhint" id="wxHint">Drag to turn · pinch or scroll to zoom · tap a part</div></div>
    <div class="wxside"><div class="wxctl"><label class="wxsl"><span>Closed</span><input type="range" id="wxT" min="0" max="1" step="0.01" value="${WX.t}" aria-label="Pull the box apart"><span>Apart</span></label>
      <div class="wxtg"><button type="button" class="tchip ${WX.dims?'on':''}" data-act="wxDims" aria-pressed="${WX.dims}">Measurements</button><button type="button" class="tchip ${WX.labels?'on':''}" data-act="wxLabs" aria-pressed="${WX.labels}">Letters</button><button type="button" class="tchip ${WX.hw?'on':''}" data-act="wxHw" aria-pressed="${WX.hw}">Hardware</button><button type="button" class="tchip ${WX.marks?'on':''}" data-act="wxMarks" aria-pressed="${WX.marks}">Holes &amp; marks</button><button type="button" class="tchip" data-act="wxReset">Reset view</button></div></div>
      <div class="wxlist" id="wxList"></div></div></div>`;
  wxScene(c);wxListRender()}
function wxDispose(){const R=WX.r;if(!R)return;try{cancelAnimationFrame(R.raf);R.ro&&R.ro.disconnect();R.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});R.renderer.dispose();R.renderer.domElement.remove()}catch(e){}WX.r=null}
function wxScene(c){wxDispose();const st=document.getElementById('wxStage');if(!st)return;
  if(!window.THREE){st.insertAdjacentHTML('beforeend','<p class="hintp" style="padding:16px">The 3D library could not load here. The parts list on the right still works.</p>');WX.r={c,parts:[],rows:tdPartRows(c),noGL:1};return}
  let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){st.insertAdjacentHTML('beforeend','<p class="hintp" style="padding:16px">3D is not available on this device. The parts list still works.</p>');WX.r={c,parts:[],rows:tdPartRows(c),noGL:1};return}
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));st.prepend(renderer.domElement);
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(35,1,10,100000);scene.add(new THREE.HemisphereLight(0xffffff,0x8a8a80,0.85));const sun=new THREE.DirectionalLight(0xffffff,0.75);sun.position.set(1,1.6,1.3);scene.add(sun);
  const bx=c.bx,EX=Math.max(180,Math.min(420,(bx.y1-bx.y0)*0.12)),ctr=new THREE.Vector3((bx.x0+bx.x1)/2,(bx.y0+bx.y1)/2,(bx.z0+bx.z1)/2),{rows,tagOf}=tdPartRows(c);
  const gs=groupsCache||(groupsCache=groupPanels(bgeo()));
  const parts=c.cs.map((s,i)=>{const g=wxGeo(s),mat=new THREE.MeshStandardMaterial({color:new THREE.Color(wxColour(s)),roughness:.7,metalness:0,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1,transparent:true,opacity:1});
    const mesh=new THREE.Mesh(g,mat),edges=new THREE.LineSegments(new THREE.EdgesGeometry(g,20),new THREE.LineBasicMaterial({color:0x2a2a2a,transparent:true,opacity:.55}));const grp=new THREE.Group();grp.add(mesh,edges);scene.add(grp);
    const row=tagOf[i],mid=new THREE.Vector3(...[0,1,2].map(k=>(s.bb[k][0]+s.bb[k][1])/2));return {s,i,grp,mesh,row,off:tdOffset(s,c,EX),mid,cut:wxMatch(gs,s,c.n,row)}});
  // holes, marks and hardware (54-assembly.js)
  const ctrA=asCtr(c),yUp=new THREE.Vector3(0,1,0),hm=new THREE.MeshBasicMaterial({color:0x2b2b2b}),cm=new THREE.MeshStandardMaterial({color:0xB4B8BC,roughness:.4,metalness:.15}),om=new THREE.MeshBasicMaterial({color:0xE8772E,side:THREE.DoubleSide}),gm=new THREE.LineBasicMaterial({color:0x8A5A1C,transparent:true,opacity:.75}),cyG={};
  const disc=(r)=>cyG[r]||(cyG[r]=new THREE.CylinderGeometry(r,r,1.2,14));const orient=(o,n)=>o.quaternion.setFromUnitVectors(yUp,new THREE.Vector3(...n).normalize());
  parts.forEach(p=>{const s=p.s,mk=new THREE.Group();mk.userData.marks=1;p.grp.add(mk);let HS=[];try{HS=asHoles(s,ctrA,geo)}catch(e){}
    HS.forEach(h=>(h.face==='T'?['A','B']:[h.face]).forEach(F=>{const isB=F==='B',n=V3.n(s.e),out=isB?n:V3.m(n,-1),pt=V3.a(isB?h.B:h.A,V3.m(out,0.5)),m=new THREE.Mesh(disc(Math.max(2.5,h.d/2)),hm);m.position.set(...pt);orient(m,out);mk.add(m)}));
    const M=asMarks(s,c);if(M.edge){const[a,b]=M.edge,L=V3.l(V3.s(b,a)),m=new THREE.Mesh(new THREE.CylinderGeometry(3,3,L,8),om);m.position.set(...V3.m(V3.a(a,b),.5).map((x,k)=>k===2?x+2:x));orient(m,V3.s(b,a));mk.add(m)}
    if(M.tri){const g=new THREE.BufferGeometry().setFromPoints(M.tri.pts.map(q=>new THREE.Vector3(...q)));mk.add(new THREE.Mesh(g,om))}
    if(M.grain){const n=V3.n(s.e),side=V3.n(V3.x(n,M.grain)),ext=[0,1,2].reduce((a,k)=>a+Math.abs(M.grain[k])*(s.bb[k][1]-s.bb[k][0]),0)*0.42,sw=[0,1,2].reduce((a,k)=>a+Math.abs(side[k])*(s.bb[k][1]-s.bb[k][0]),0)*0.3,pts=[];
      [s.A,s.B].forEach((F,fi)=>{const cen=[0,1,2].map(k=>F.reduce((a,q)=>a+q[k],0)/F.length).map((x,k)=>x+(fi?n[k]:-n[k])*0.6);[-1,-0.33,0.33,1].forEach(o=>{const b=V3.a(cen,V3.m(side,o*sw));pts.push(new THREE.Vector3(...V3.a(b,V3.m(M.grain,-ext))),new THREE.Vector3(...V3.a(b,V3.m(M.grain,ext))))})});
      mk.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),gm))}});
  let HW={hw:[],lines:[],types:[]};try{HW=asHW(c,geo)}catch(e){console.warn(e)}
  const hwParts=HW.hw.map(h=>{const m=new THREE.Mesh(wxGeo(h),cm),grp=new THREE.Group();grp.add(m);grp.userData.hw=1;scene.add(grp);return {h,grp,off:asOff(h,c,EX),mid:[0,1,2].map(k=>(h.bb[k][0]+h.bb[k][1])/2)}});
  const lm=new THREE.LineDashedMaterial({color:0x3446D6,dashSize:14,gapSize:10}),hwLines=HW.lines.map(L=>{const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),ln=new THREE.Line(g,lm);ln.userData.hw=1;scene.add(ln);return {L,ln,oa:V3.a(tdOffset(L.ah,c,EX),L.ax||[0,0,0]),ob:tdOffset(L.bh,c,EX)}});
  // measurements: drawn around the closed box
  const dims=new THREE.Group();scene.add(dims);const dm=new THREE.LineBasicMaterial({color:0x3446D6});const L=(a,b)=>{const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);dims.add(new THREE.Line(g,dm))};
  const o=60,fz=bx.z1+o;L([bx.x0,bx.y0-o,fz],[bx.x1,bx.y0-o,fz]);L([bx.x0,bx.y0-o-30,fz],[bx.x0,bx.y0-o+30,fz]);L([bx.x1,bx.y0-o-30,fz],[bx.x1,bx.y0-o+30,fz]);
  L([bx.x1+o,0,fz],[bx.x1+o,bx.y1,fz]);L([bx.x1+o-30,bx.y1,fz],[bx.x1+o+30,bx.y1,fz]);L([bx.x1+o-30,0,fz],[bx.x1+o+30,0,fz]);
  L([bx.x1+o,bx.y0-o,bx.z0],[bx.x1+o,bx.y0-o,bx.z1]);
  const hz=[...new Set(c.cs.filter(s=>s.ax===1&&s.role!=='front').map(s=>Math.round(s.bb[1][1])))].sort((a,b)=>a-b);hz.forEach(y=>L([bx.x1+o-15,y,fz],[bx.x1+o+15,y,fz]));
  const dimLabs=[{p:[(bx.x0+bx.x1)/2,bx.y0-o,fz],t:f0(bx.x1-bx.x0)+' wide'},{p:[bx.x1+o,bx.y1/2,fz],t:f0(bx.y1)+' high'},{p:[bx.x1+o,bx.y0-o,(bx.z0+bx.z1)/2],t:f0(bx.z1-bx.z0)+' deep'}].concat(hz.map(y=>({p:[bx.x1+o+20,y,fz],t:'↑ '+f0(y),sm:1})));
  const size=Math.max(bx.x1-bx.x0,bx.y1-bx.y0,bx.z1-bx.z0)+EX*3,ctl={theta:0.62,phi:0.32,r:size*1.55,tx:ctr.x,ty:ctr.y,tz:ctr.z+EX*0.4};
  const R=WX.r={c,renderer,scene,cam,parts,rows:{rows,tagOf},dims,dimLabs,ctl,home:Object.assign({},ctl),ro:null,raf:0,hwParts,hwLines,hwTypes:HW.types};
  const place=()=>{cam.position.set(ctl.tx+ctl.r*Math.cos(ctl.phi)*Math.sin(ctl.theta),ctl.ty+ctl.r*Math.sin(ctl.phi),ctl.tz+ctl.r*Math.cos(ctl.phi)*Math.cos(ctl.theta));cam.lookAt(ctl.tx,ctl.ty,ctl.tz)};R.place=place;
  const fit=()=>{const w=st.clientWidth||300,h=st.clientHeight||300;renderer.setSize(w,h,false);renderer.domElement.style.width=w+'px';renderer.domElement.style.height=h+'px';cam.aspect=w/h;cam.updateProjectionMatrix();
    const rr=size*1.55*Math.max(1,0.95/cam.aspect);if(!R.zoomed){ctl.r=rr}R.home.r=rr;wxDraw()};
  try{R.ro=new ResizeObserver(fit);R.ro.observe(st)}catch(e){}wxApplyT();fit();
  // turn, zoom, tap
  const el=renderer.domElement,pts=new Map();let moved=0,d0=0,r0=0;
  el.addEventListener('pointerdown',e=>{el.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);moved=0;if(pts.size===2){const[a,b]=[...pts.values()];d0=Math.hypot(a[0]-b[0],a[1]-b[1]);r0=ctl.r}});
  el.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p)return;const dx=e.clientX-p[0],dy=e.clientY-p[1];pts.set(e.pointerId,[e.clientX,e.clientY]);moved+=Math.abs(dx)+Math.abs(dy);
    if(pts.size===2){const[a,b]=[...pts.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(d0>0){ctl.r=Math.max(size*0.35,Math.min(size*5,r0*d0/d));R.zoomed=1}}else{ctl.theta-=dx*0.008;ctl.phi=Math.max(-0.2,Math.min(1.45,ctl.phi+dy*0.008))}wxDraw()});
  const up=e=>{const was=pts.has(e.pointerId);pts.delete(e.pointerId);if(was&&moved<8&&pts.size===0)wxPick(e)};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',e=>pts.delete(e.pointerId));
  el.addEventListener('wheel',e=>{e.preventDefault();ctl.r=Math.max(size*0.35,Math.min(size*5,ctl.r*(1+Math.sign(e.deltaY)*0.1)));R.zoomed=1;wxDraw()},{passive:false});
  el.addEventListener('dblclick',()=>{Object.assign(ctl,R.home);R.zoomed=0;wxDraw()});el.style.touchAction='none'}
function wxApplyT(){const R=WX.r;if(!R||R.noGL)return;const t=WX.t,e=t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;R.parts.forEach(p=>{p.grp.position.set(p.off[0]*e,p.off[1]*e,p.off[2]*e);p.grp.children.forEach(ch=>{if(ch.userData.marks)ch.visible=!!WX.marks})});R.dims.visible=!!WX.dims;
  (R.hwParts||[]).forEach(p=>{p.grp.position.set(p.off[0]*e,p.off[1]*e,p.off[2]*e);p.grp.visible=!!WX.hw});
  (R.hwLines||[]).forEach(o=>{const a=V3.a(o.L.a,V3.m(o.oa,e)),b=V3.a(o.L.b,V3.m(o.ob,e)),pos=o.ln.geometry.attributes.position;pos.setXYZ(0,...a);pos.setXYZ(1,...b);pos.needsUpdate=true;o.ln.computeLineDistances();o.ln.visible=!!WX.hw&&e>0.15})}
function wxDraw(){const R=WX.r;if(!R||R.noGL)return;R.place();R.parts.forEach(p=>{const on=WX.sel==null||p.row===WX.sel,hi=WX.sel!=null&&p.row===WX.sel,ed=p.grp.children[1].material;p.mesh.material.opacity=on?1:0.18;p.mesh.material.depthWrite=on;ed.color.set(hi?0x3446D6:0x2a2a2a);ed.opacity=hi?1:on?.55:.1});
  R.renderer.render(R.scene,R.cam);wxLabels()}
function wxLabels(){const R=WX.r,box=document.getElementById('wxLabs'),st=document.getElementById('wxStage');if(!R||!box||!st||R.noGL)return;const w=st.clientWidth,h=st.clientHeight,v=new THREE.Vector3();let o='';
  const at=(p,cls,txt,act)=>{v.set(p[0],p[1],p[2]).project(R.cam);if(v.z>1)return;const x=(v.x+1)/2*w,y=(1-v.y)/2*h;if(x<-40||x>w+40||y<-20||y>h+20)return;o+=`<span class="${cls}" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px"${act?` data-act="wxSel" data-a="${act}"`:''}>${esc(txt)}</span>`};
  if(WX.labels){const seen={};R.parts.forEach(p=>{const t=WX.t<0.5?2*WX.t*WX.t:1-Math.pow(-2*WX.t+2,2)/2;at([p.mid.x+p.off[0]*t,p.mid.y+p.off[1]*t,p.mid.z+p.off[2]*t],'wxtag'+(WX.sel===p.row?' on':''),p.row.tag,p.row.tag)})}
  if(WX.hw&&R.hwTypes){const t=WX.t<0.5?2*WX.t*WX.t:1-Math.pow(-2*WX.t+2,2)/2;R.hwTypes.forEach(T=>{const ps=R.hwParts.filter(p=>p.h.hw===T.k);if(!ps.length)return;const p=ps.reduce((a,b)=>b.mid[1]>a.mid[1]?b:a);at([p.mid[0]+p.off[0]*t,p.mid[1]+p.off[1]*t+30,p.mid[2]+p.off[2]*t],'wxhwn',String(T.no))})}
  if(WX.dims)R.dimLabs.forEach(d=>at(d.p,'wxdim'+(d.sm?' sm':''),d.t));box.innerHTML=o}
function wxPick(e){const R=WX.r;if(!R||R.noGL)return;const r=R.renderer.domElement.getBoundingClientRect(),m=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),rc=new THREE.Raycaster();rc.setFromCamera(m,R.cam);
  const hit=rc.intersectObjects(R.parts.map(p=>p.mesh),false)[0],p=hit&&R.parts.find(x=>x.mesh===hit.object);wxSelect(p?p.row.tag:null)}
function wxSelect(tag){const R=WX.r;if(!R)return;const row=tag?R.rows.rows.find(r=>r.tag===tag):null;WX.sel=row||null;wxDraw();wxCard();wxListRender()}
function wxEdgeSVG(bs,gr){const W=120,H=54,x=6,y=6,w=W-12,h=H-12;let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${gr?'#EAD7B7':'#EEEEEC'}"/>`;
  if(gr)for(let k=1;k<5;k++)s+=`<path d="M${x+3} ${y+h*k/5} q${w/4} 2 ${w/2} 0 t${w/2-6} 0" fill="none" stroke="rgba(138,90,28,.5)" stroke-width="1"/>`;
  [[x,y+h,x+w,y+h,bs[0]],[x,y,x+w,y,bs[1]],[x,y,x,y+h,bs[2]],[x+w,y,x+w,y+h,bs[3]]].forEach(([a,b,c,d,on])=>{s+=`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${on?'#1D1D1F':'#9A9A9A'}" stroke-width="${on?5:1.2}" ${on?'':'stroke-dasharray="4 3"'}/>`});return s+'</svg>'}
function wxCard(){const R=WX.r,el=document.getElementById('wxCard');if(!el||!R)return;const row=WX.sel;if(!row){el.hidden=true;return}
  const p=R.parts.find(x=>x.row===row),cut=p&&p.cut,bs=cut?bandSides(cut):['','','',''],gr=cut?grainMatters(cut):false,holes=cut?(cut.holes||[]):[],cups=holes.filter(h=>h.dp&&(+h.d||0)>=30).length,pins=holes.filter(h=>(+h.d||0)<=6&&!h.len&&!h.plate&&!h.cf).length,plates=holes.filter(h=>h.plate).length,scr=holes.filter(h=>h.cf).length,ins=holes.filter(h=>h.poly).length;
  const mat=cut?`${(MATS[cut.matType]||{}).name||cut.matType} · ${(FIN[cut.fin]||{}).name||cut.fin}`:'';
  el.innerHTML=`<button type="button" class="wxx" data-act="wxSel" data-a="" aria-label="Close">×</button><div class="wxch"><b class="wxbig">${row.tag}</b><div><b>${esc(row.name)}${row.q>1?` <small>× ${row.q}</small>`:''}</b><span>${f0(row.L)} × ${f0(row.W)} × ${f0(row.t)} mm${cut?` · cut list <b>${cut.id}</b>`:''}</span></div></div>
    ${mat?`<p>${esc(mat)}</p>`:''}${cut?`<div class="wxedge">${wxEdgeSVG(bs,gr)}<div><b>${esc(bandWords(cut,bs))}</b><span>${gr?`Grain runs along the ${f0(cut.L)} side`:'No grain — may be turned'}</span></div></div>`:''}
    ${cups||pins||ins||plates||scr?`<p>${[cups?`${cups} hinge cup${cups>1?'s':''}`:'',pins?`${pins} shelf-pin hole${pins>1?'s':''}`:'',plates?`${plates} holes for hinge plates`:'',scr?`${scr} holes for connector screws`:'',ins?`${ins} cut-out${ins>1?'s':''}`:''].filter(Boolean).join(' · ')} — see the cut list drawing</p>`:''}`;el.hidden=false}
function wxListRender(){const R=WX.r,el=document.getElementById('wxList');if(!el||!R)return;const rows=R.rows.rows;
  el.innerHTML=`<div class="wxlh"><b>Parts of box ${R.c.n}</b><span>${rows.reduce((a,r)=>a+r.q,0)} parts</span></div>${rows.map(r=>`<button type="button" class="wxrow ${WX.sel===r?'on':''}" data-act="wxSel" data-a="${r.tag}"><i>${r.tag}</i><b>${esc(r.name)}</b><span>${r.q>1?r.q+' × ':''}${f0(r.L)} × ${f0(r.W)} × ${f0(r.t)}</span></button>`).join('')}${(R.hwTypes||[]).length?`<div class="wxlh wxlh2"><b>Hardware for box ${R.c.n}</b><span>numbers in the 3D</span></div>${R.hwTypes.map(T=>`<div class="wxhwrow"><i>${T.no}</i><div><b>${esc(T.name)} <small>× ${T.q}</small></b><span>${esc(T.how)}</span></div></div>`).join('')}`:''}
  <p class="wxkey"><span class="k1"></span> front edge <span class="k2"></span> inside face, tip to the front <span class="k3"></span> grain <span class="k4"></span> holes <span class="k5"></span> screw goes in here</p>`}
document.addEventListener('input',e=>{if(e.target&&e.target.id==='wxT'){WX.t=+e.target.value;wxApplyT();wxDraw()}});
