/* ==== 86-screen-3d.js ====
   The projector screen in 3D.
*/
/* ===== projector screen in 3D: the drawer slides out, the cloth rolls down, the picture comes on ===== */
function screenTex(){if(T3.scrTex)return T3.scrTex;const c=document.createElement('canvas');c.width=640;c.height=360;const x=c.getContext('2d');
  try{const g=x.createLinearGradient(0,0,0,360);g.addColorStop(0,'#1B2A4A');g.addColorStop(.45,'#C96B4B');g.addColorStop(.62,'#F2C27A');g.addColorStop(.63,'#2F4858');g.addColorStop(1,'#16222E');x.fillStyle=g;x.fillRect(0,0,640,360);
    x.fillStyle='#FFE9B8';x.beginPath();x.arc(430,205,46,0,7);x.fill();x.fillStyle='#22313D';x.beginPath();x.moveTo(0,228);x.lineTo(120,150);x.lineTo(230,215);x.lineTo(330,170);x.lineTo(470,228);x.lineTo(640,190);x.lineTo(640,360);x.lineTo(0,360);x.fill();
    x.fillStyle='rgba(255,255,255,.9)';x.font='600 22px sans-serif';x.fillText('KAST CINEMA',24,40)}catch(e){}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return T3.scrTex=t}
function screen3D(){if(!T3)return;if(!T3.scrG){T3.scrG=new THREE.Group();T3.scene.add(T3.scrG)}const g=T3.scrG;clearG(g);T3.scr=null;const sc=geo.screen;if(!sc)return;const G=geo,tf=G.tf||20,tc=G.tc;
  const mk=(w,h,d,m,x,y,z,par)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=true;b.receiveShadow=true;(par||g).add(b);return b};
  const dr=new THREE.Group();g.add(dr);const fm=mat3(S.mat.front.fin,S.mat.front.type),cm=mat3(S.mat.carcass.fin,S.mat.carcass.type);
  mk(sc.bx1-sc.bx0-4,sc.boxH-4,tf,fm,(sc.bx0+sc.bx1)/2,sc.yS+sc.boxH/2,tf/2,dr);
  if(sc.faux)sc.joints.forEach(x=>mk(3,sc.boxH-6,2,colMat('#2A2A2A',.9),x,sc.yS+sc.boxH/2,tf+0.6,dr));
  mk(sc.bx1-sc.bx0-4*tc-26,tc,sc.depth,cm,(sc.bx0+sc.bx1)/2,sc.yT-tc-12-tc/2,-sc.depth/2,dr);
  const zc=-12-sc.cas/2;mk(sc.cl,sc.cas,sc.cas,colMat('#2A2A2A',.6),sc.xc,sc.yT-tc-12-tc-sc.cas/2,zc,dr);
  const cloth=new THREE.Group();dr.add(cloth);const full=sc.yS-sc.imgBot+50,top=sc.yS+sc.cas/2;
  const bm=new THREE.MeshStandardMaterial({color:0x161616,roughness:.9,transparent:true,opacity:.22,depthWrite:false});const blk=new THREE.Mesh(new THREE.BoxGeometry(sc.fx1-sc.fx0,1,3),bm);blk.userData.own=true;blk.position.set(sc.xc,0,zc);cloth.add(blk);
  const pm=new THREE.MeshStandardMaterial({color:0xF3F3EF,emissive:0xffffff,emissiveIntensity:.18,roughness:.95,transparent:true,opacity:.35,depthWrite:false});pm.userData={};const pic=new THREE.Mesh(new THREE.BoxGeometry(sc.w,sc.h,2),pm);pic.userData.own=true;pic.renderOrder=3;blk.renderOrder=2;pic.position.set(sc.xc,0,zc+3);cloth.add(pic);
  const bar=mk(sc.fx1-sc.fx0+30,26,26,colMat('#3A3A3A',.5),sc.xc,0,zc,cloth);
  const glow=new THREE.PointLight(0xBFD4FF,0,9000);glow.position.set(sc.xc,sc.imgTop-sc.h/2,1800);g.add(glow);
  T3.scr={dr,cloth,blk,pic,pm,bm,bar,glow,full,top,sc};ui.scrA=sc.down?1:0;applyScreen3D(true)}
function applyScreen3D(noReq){if(!T3||!T3.scr)return;const o=T3.scr,sc=o.sc,t=Math.max(0,Math.min(1,ui.scrA||0)),a=Math.min(1,t/0.3),b=Math.max(0,(t-0.3)/0.7),e=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
  o.dr.position.z=sc.pull*e(a);const len=Math.max(1,o.full*e(b)+sc.cas/2*e(b));o.cloth.visible=b>0.001;
  o.blk.scale.y=len;o.blk.position.y=o.top-len/2;o.bar.position.y=o.top-len;
  const picLen=Math.max(0,Math.min(sc.h,len-(o.top-sc.imgTop)));o.pic.visible=picLen>2;o.pic.scale.y=Math.max(0.001,picLen/sc.h);o.pic.position.y=sc.imgTop-picLen/2;
  const cin=!!ui.cinema&&t>0.95;if(cin&&!o.pm.map){o.pm.map=screenTex();o.pm.emissiveMap=o.pm.map;o.pm.needsUpdate=true}if(!cin&&o.pm.map){o.pm.map=null;o.pm.emissiveMap=null;o.pm.needsUpdate=true}
  o.pm.emissiveIntensity=cin?0.95:0.18;o.glow.intensity=cin?0.55:0;o.pm.opacity=cin?1:0.35;o.pm.transparent=!cin;o.pm.depthWrite=cin;o.bm.opacity=cin?1:0.22;o.bm.transparent=!cin;o.bm.depthWrite=cin;o.pic.castShadow=cin;o.blk.castShadow=cin;o.pm.needsUpdate=true;o.bm.needsUpdate=true;
  T3.hemi.intensity=cin?0.14:0.55;T3.sun.intensity=cin?0.12:0.95;T3.fill.intensity=cin?0.06:0.3;T3.amb.intensity=cin?0.05:0.12;
  T3.scrG.visible=!(ui.exT>0.02)&&!ui.iso;if(!noReq)T3.req()}
function animScreen(to){const from=ui.scrA||0,t0=performance.now(),dur=1500*Math.abs(to-from)+1;cancelAnimationFrame(animScreen.raf);
  const step=now=>{const k=Math.min(1,(now-t0)/dur);ui.scrA=from+(to-from)*k;applyScreen3D();if(k<1)animScreen.raf=requestAnimationFrame(step)};animScreen.raf=requestAnimationFrame(step)}
function tagExplode(){if(!T3)return;const G=geo,n=G.secs.length,tc=G.tc,B=new THREE.Box3(),c=new THREE.Vector3(),sz=new THREE.Vector3();
  const secOf=x=>{let best=-1,bd=1e9;G.secs.forEach((q,i)=>{if(x>=q.xa-tc-2&&x<=q.xb+tc+2){const d=Math.abs(x-(q.xa+q.xb)/2);if(d<bd){bd=d;best=i}}});return best};
  const zc=-(G.D/2);
  [[T3.root,false],[T3.frontG,true]].forEach(([grp,isF])=>grp.children.forEach(o=>{
    if(!o.userData.base)o.userData.base=o.position.clone();else o.position.copy(o.userData.base);
    B.setFromObject(o);if(B.isEmpty()){o.userData.ex=new THREE.Vector3();o.userData.sec=-1;return}B.getCenter(c);B.getSize(sz);
    const wide=sz.x>G.W*0.55,sec=wide?-1:secOf(c.x);o.userData.sec=sec;
    const q=G.secs[sec],cx=q?(q.xa+q.xb)/2:G.W/2,ys=q?[q.Pq||0,Math.min(q.top(q.bL),q.top(q.bR))]:[0,+S.room.H],cy=(ys[0]+ys[1])/2;
    const shift=sec>=0?(sec-(n-1)/2)*420:0;
    const thinZ=sz.z<30&&sz.x>120&&sz.y>120,atBack=c.z<-(G.D-60);
    let dz=isF?520:(thinZ&&atBack?-420:(c.z-zc)*0.25);
    if(!isF&&thinZ&&!atBack)dz=260;
    const thinX=sz.x<40&&sz.y>200;
    o.userData.ex=new THREE.Vector3(shift+(c.x-cx)*(thinX?0.55:0.12),(c.y-cy)*0.42,dz)}));
  applyExplode(true)}
function applyExplode(noReq){if(!T3)return;const t=ui.exT||0,iso=!!ui.iso;
  [T3.root,T3.frontG].forEach(grp=>grp.children.forEach(o=>{const b=o.userData.base,e=o.userData.ex;if(b&&e)o.position.set(b.x+e.x*t,b.y+e.y*t,b.z+e.z*t);o.visible=!iso||o.userData.sec===ui.sel}));
  if(T3.propG)T3.propG.visible=ui.props&&t<0.02&&!iso;T3.roomG.visible=ui.room3D&&t<0.02&&!iso&&!photoActive();if(T3.pplG)T3.pplG.visible=t<0.02&&!iso;if(T3.scrG)T3.scrG.visible=t<0.02&&!iso;if(T3.frontG)T3.frontG.visible=ui.fm!=='off';
  if(!noReq)T3.req()}
function animExplode(to){const from=ui.exT||0,t0=performance.now(),dur=520;cancelAnimationFrame(animExplode.raf);
  const step=now=>{const k=Math.min(1,(now-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;ui.exT=from+(to-from)*e;applyExplode();if(k<1)animExplode.raf=requestAnimationFrame(step)};animExplode.raf=requestAnimationFrame(step)}
function isoFrame(){if(!T3)return;const c=T3.ctl;if(ui.iso){const q=geo.secs[ui.sel];if(!q)return;const ht=Math.max(q.top(q.bL),q.top(q.bR));c.target.set((q.xa+q.xb)/2+((ui.exT||0)*(ui.sel-(geo.secs.length-1)/2)*420),ht*0.5,-geo.D/2+(ui.exT||0)*120);c.r=Math.max(q.w*1.6,ht*1.15)/Math.tan(19*Math.PI/180)*0.9;c.theta=0.62;c.phi=0.2}else camPreset('angle');T3.req()}
function camTo(to,ms=420){if(!T3)return;const c=T3.ctl,fr={theta:c.theta,phi:c.phi,r:c.r,x:c.target.x,y:c.target.y,z:c.target.z},t0=performance.now();cancelAnimationFrame(camTo.raf);
  let dth=to.theta-fr.theta;dth=((dth+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
  const step=now=>{const k=Math.min(1,(now-t0)/ms),e=1-Math.pow(1-k,3);c.theta=fr.theta+dth*e;c.phi=fr.phi+(to.phi-fr.phi)*e;c.r=fr.r+(to.r-fr.r)*e;c.target.set(fr.x+(to.x-fr.x)*e,fr.y+(to.y-fr.y)*e,fr.z+(to.z-fr.z)*e);T3.req();if(k<1)camTo.raf=requestAnimationFrame(step)};
  if(!T3.framed||ms<=0){c.theta=to.theta;c.phi=to.phi;c.r=to.r;c.target.set(to.x,to.y,to.z);T3.req();return}camTo.raf=requestAnimationFrame(step)}
function camPreset(k){if(!T3)return;const maxC=Math.max(...geo.cps.map(p=>p.y),+S.room.H);
  const sp=(ui.exT||0)*(geo.secs.length-1)*420;const fit=Math.max((geo.W+sp)*0.62,maxC*0.75)/Math.tan(19*Math.PI/180)*(ui.exT>0.02?1.12:1);
  const to={x:geo.W/2,y:maxC*0.48,z:-geo.D/2,r:fit,theta:k==='front'?0:k==='left'?-0.55:k==='seat'?0:0.48,phi:k==='front'?0.04:k==='seat'?0.02:0.16};
  if(k==='seat'){to.r=Math.max(3200,geo.W*0.9);to.y=1150;to.z=0}camTo(to)}

