/* ==== 54-assembly.js ====
   What goes INTO a box, in 3D: holes on every board, the hardware in place and the marks a maker uses.
   Used by the exploded sheets (52-techdraw.js, tdExploded) and the 3D Assemble view (72-workshop-3d.js).

   - build() links each 3D board to its cut-list panel (item.pan), so a panel's holes (x, y on the part)
     can be put on the board in 3D: asHoles(s) → points on face A / face B.
   - asHW(c,G) makes the hardware of one box as small solids (same shape as boards: A, B, e, ax), each
     riding along with a "host" board when the box is pulled apart:
       hinge (cup + arm on the door, mounting plate on the side) · shelf pin · connector screw
       · drawer runner (pair) · hanging rail with 2 sockets.
     It also gives assembly lines (screw → the board it goes into) and the numbered hardware list.
   - asMarks(s,c) gives the front edge, the grain direction and the inside face (a ▲ pointing to the front).
*/
const V3={a:(p,q)=>[p[0]+q[0],p[1]+q[1],p[2]+q[2]],s:(p,q)=>[p[0]-q[0],p[1]-q[1],p[2]-q[2]],m:(p,k)=>[p[0]*k,p[1]*k,p[2]*k],d:(p,q)=>p[0]*q[0]+p[1]*q[1]+p[2]*q[2],
  x:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],n:p=>{const l=Math.hypot(p[0],p[1],p[2])||1;return [p[0]/l,p[1]/l,p[2]/l]},l:p=>Math.hypot(p[0],p[1],p[2])};
const AS_T=[['hinge','Hinge with mounting plate','Clip the hinge into the plate; the cup sits in the Ø35 hole of the door'],['pin','Shelf pin Ø5','Push into the holes, the shelf rests on 4 pins'],['screw','Connector screw 7 × 50','Through the side into the end of the board — pre-drill Ø5 in the board end'],
  ['runner','Drawer runner (pair)','Screw to the inside of both sides, front end 3 mm behind the front edge'],['rail','Hanging rail with 2 end sockets','Screw the sockets to the sides, then drop the rail in']];
const asEX=c=>Math.max(180,Math.min(420,(c.bx.y1-c.bx.y0)*0.12));
const asCtr=c=>[(c.bx.x0+c.bx.x1)/2,(c.bx.y0+c.bx.y1)/2,(c.bx.z0+c.bx.z1)/2];
/* ---------- holes of one board, in 3D ---------- */
function asUV(s,h){return s.panSw?[s.mu+h.y,s.mv+h.x]:[s.mu+h.x,s.mv+h.y]}
function asHoles(s,ctr,G){if(!s.pan||!s.toW||!(s.pan.holes||[]).length)return [];const n=V3.n(s.e),out=[];
  s.pan.holes.forEach(h=>{if(h.poly||h.len)return;const d=+h.d||5;if(d>=60)return;let A,uv=asUV(s,h);try{A=s.toW(uv[0],uv[1])}catch(e){return}if(!A.every(isFinite))return;const B=V3.a(A,s.e);
    const through=!h.dp||/through/i.test(h.face||'');let ref=ctr;const m=/S(\d+)/.exec(h.face||'');if(m&&G&&G.secs&&G.secs[+m[1]-1]){const q=G.secs[+m[1]-1];ref=[(q.xa+q.xb)/2,A[1],A[2]]}
    const face=through?'T':(Math.abs(V3.d(V3.s(ref,A),n))<=Math.abs(V3.d(V3.s(ref,B),n))?'A':'B');
    const kind=d>=30&&h.dp?'cup':h.cf||/connector/i.test(h.face||'')?'screw':h.plate?'plate':h.dp&&d<=5.5?'pin':'hole';
    out.push({h,d,A,B,n,face,kind,pt:face==='B'?B:A,out:face==='B'?n:V3.m(n,-1)})});return out}
/* ---------- simple solids for hardware ---------- */
function asSolid(A,e,o){const all=A.concat(A.map(p=>V3.a(p,e))),bb=[0,1,2].map(i=>[Math.min(...all.map(p=>p[i])),Math.max(...all.map(p=>p[i]))]),ax=Math.abs(e[0])>Math.abs(e[1])?(Math.abs(e[0])>Math.abs(e[2])?0:2):(Math.abs(e[1])>Math.abs(e[2])?1:2);
  return Object.assign({A,B:A.map(p=>V3.a(p,e)),e,bb,ax,t:V3.l(e),role:'hw'},o||{})}
function asBox(c,sz,o){const[x,y,z]=c,[a,b,d]=sz.map(v=>v/2);return asSolid([[x-a,y-b,z-d],[x+a,y-b,z-d],[x+a,y+b,z-d],[x-a,y+b,z-d]],[0,0,2*d],o)}
function asCyl(c,ax,r,len,o){ax=V3.n(ax);const k=Math.abs(ax[0])<0.9?[1,0,0]:[0,1,0],u=V3.n(V3.x(ax,k)),v=V3.x(ax,u),b=V3.a(c,V3.m(ax,-len/2)),A=[];
  for(let i=0;i<10;i++){const t=i/10*Math.PI*2;A.push(V3.a(b,V3.a(V3.m(u,r*Math.cos(t)),V3.m(v,r*Math.sin(t)))))}return asSolid(A,V3.m(ax,len),o)}
/* ---------- the hardware of one box ---------- */
function asHW(c,G){const ctr=asCtr(c),EX=asEX(c),hw=[],lines=[],cnt={};const add=(type,s,host,extra)=>{hw.push(Object.assign(s,{hw:type,host:host||null,extra:extra||[0,0,0]}))},inc=(t,n)=>cnt[t]=(cnt[t]||0)+(n||1);
  const boards=c.cs.filter(s=>(s.role==='carcass'||s.role==='shelf')&&s.ax===1);
  c.cs.forEach(s=>{const H=asHoles(s,ctr,G);if(!H.length)return;
    // hinges: cup + arm on the door
    if(s.role==='front'||/^fabric/.test(s.role))H.filter(o=>o.kind==='cup').forEach(o=>{const P=o.pt,out=o.out;add('hinge',asCyl(V3.a(P,V3.m(out,2.5)),out,17.5,5),s);
      const ex=Math.abs(P[0]-s.bb[0][0])<Math.abs(P[0]-s.bb[0][1])?s.bb[0][0]:s.bb[0][1],len=Math.max(30,Math.min(70,Math.abs(ex-P[0])+18));add('hinge',asBox([(P[0]+ex)/2,P[1],P[2]+out[2]*9],[len,16,10]),s);inc('hinge')});
    if(s.role!=='carcass'||s.ax!==0)return;
    // mounting plates: pairs of plate holes 32 apart
    const pl=H.filter(o=>o.kind==='plate').sort((a,b)=>a.pt[2]-b.pt[2]||a.pt[1]-b.pt[1]);const used=new Set();
    pl.forEach((o,i)=>{if(used.has(i))return;const j=pl.findIndex((q,k)=>k>i&&!used.has(k)&&Math.abs(q.pt[2]-o.pt[2])<2&&Math.abs(q.pt[1]-o.pt[1])<45);used.add(i);let m=o.pt;if(j>=0){used.add(j);m=V3.m(V3.a(o.pt,pl[j].pt),.5)}
      add('hinge',asBox(V3.a(m,V3.m(o.out,6)),[12,50,32]),s)});
    // shelf pins
    H.filter(o=>o.kind==='pin').forEach(o=>{add('pin',asCyl(V3.a(o.pt,V3.m(o.out,5)),o.out,2.5,10),s);inc('pin')});
    // connector screws: only where a board of this box meets the side
    H.filter(o=>o.kind==='screw').forEach(o=>{const y=o.A[1],z=o.A[2],tb=boards.find(b=>b!==s&&y>=b.bb[1][0]-2&&y<=b.bb[1][1]+2&&z>=b.bb[2][0]-2&&z<=b.bb[2][1]+2&&(Math.abs(b.bb[0][0]-s.bb[0][1])<4||Math.abs(b.bb[0][1]-s.bb[0][0])<4));if(!tb)return;
      const inX=Math.sign(((tb.bb[0][0]+tb.bb[0][1])/2)-o.A[0])||1,dirIn=[inX,0,0],head=inX>0?(o.A[0]<o.B[0]?o.A:o.B):(o.A[0]>o.B[0]?o.A:o.B),tip=V3.a(head,V3.m(dirIn,50)),entry=V3.a(head,V3.m(dirIn,s.t));
      const ext=V3.m(dirIn,-EX*0.45);add('screw',asCyl(V3.a(head,V3.m(dirIn,25)),dirIn,3,50),s,ext);lines.push({a:V3.a(head,V3.m(dirIn,50)),ah:s,ax:ext,b:entry,bh:tb});inc('screw')})});
  // drawer runners: one pair per drawer, on the inside of the two sides
  const sides=c.cs.filter(s=>s.role==='carcass'&&s.ax===0),L=sides.find(s=>Math.abs(s.bb[0][0]-c.bx.x0)<4),R=sides.find(s=>Math.abs(s.bb[0][1]-c.bx.x1)<4);
  if(L&&R&&c.q){const D=c.bx.z1-c.bx.z0,len=[...SLIDES].reverse().find(v=>v<=D-15)||Math.max(200,Math.floor((D-20)/50)*50);
    (G.fronts||[]).filter(f=>f.kind==='drawer'&&f.sec===c.q.i).forEach(f=>{const y=Math.min(...f.poly.map(p=>p[1]))+32,z=c.bx.z1-3-len/2;
      add('runner',asBox([L.bb[0][1]+6.5,y,z],[13,40,len]),L);add('runner',asBox([R.bb[0][0]-6.5,y,z],[13,40,len]),R);inc('runner')})}
  // hanging rails
  (G.items||[]).forEach(it=>{if(it.k!=='rail'||!(it.xb>c.bx.x0+5&&it.xa<c.bx.x1-5))return;const xa=Math.max(it.xa,c.bx.x0),xb=Math.min(it.xb,c.bx.x1),z=-(+it.z||0),y=+it.y;if(!isFinite(y)||!isFinite(z))return;
    add('rail',asCyl([(xa+xb)/2,y,z],[1,0,0],12.5,Math.max(20,xb-xa-6)),null);[xa+5,xb-5].forEach((x,k)=>add('rail',asBox([x,y+8,z],[10,44,34]),k?R:L));inc('rail')});
  const types=AS_T.filter(([k])=>cnt[k]).map(([k,name,how],i)=>({no:i+1,k,name,how,q:cnt[k]}));
  return {hw,lines,types}}
/* where a hardware solid sits at "apart" amount e (0 closed … 1 apart) */
function asOff(h,c,EX){const o=h.host?tdOffset(h.host,c,EX):[0,0,0];return V3.a(o,h.extra||[0,0,0])}
/* ---------- marks on a board ---------- */
function asMarks(s,c){const out={edge:null,grain:null,tri:null};if(!s.A||!s.A.length)return out;const ctr=asCtr(c);
  if((s.role==='carcass'||s.role==='shelf'||s.role==='desk')&&(s.ax===0||s.ax===1)){const zm=s.bb[2][1],A=s.A;let best=null;
    for(let i=0;i<A.length;i++){const a=A[i],b=A[(i+1)%A.length];if(Math.abs(a[2]-zm)<1.5&&Math.abs(b[2]-zm)<1.5){const L=V3.l(V3.s(a,b));if(L>20&&(!best||L>best.L))best={a,b,L}}}
    if(best)out.edge=[V3.a(best.a,V3.m(s.e,.5)),V3.a(best.b,V3.m(s.e,.5))]}
  if(s.pan&&s.toW&&typeof grainMatters==='function'&&grainMatters(s.pan)){try{const g=s.pan.grain==='w'?[1,0]:[0,1],uv=s.panSw?[g[1],g[0]]:g,o=s.toW(s.mu,s.mv),q=s.toW(s.mu+uv[0]*100,s.mv+uv[1]*100);out.grain=V3.n(V3.s(q,o))}catch(e){}}
  if(s.role==='carcass'&&(s.ax===0||s.ax===1)){const n=V3.n(s.e),m=[0,1,2].map(k=>(s.bb[k][0]+s.bb[k][1])/2),k=s.ax,A0=s.A[0][k],B0=A0+s.e[k],useA=Math.abs(ctr[k]-A0)<Math.abs(ctr[k]-B0),
      pz=useA?A0:B0,out_=useA?V3.m(n,-1):n,sz=Math.min(90,(s.bb[2][1]-s.bb[2][0])*0.35,(k===0?s.bb[1][1]-s.bb[1][0]:s.bb[0][1]-s.bb[0][0])*0.35),c0=m.slice();c0[k]=pz;
    const w=k===0?[0,1,0]:[1,0,0];out.tri={pts:[V3.a(c0,[0,0,sz*0.6]),V3.a(V3.a(c0,[0,0,-sz*0.4]),V3.m(w,sz*0.45)),V3.a(V3.a(c0,[0,0,-sz*0.4]),V3.m(w,-sz*0.45))].map(p=>V3.a(p,V3.m(out_,0.8))),out:out_}}
  return out}
