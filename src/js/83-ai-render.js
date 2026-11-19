/* ==== 83-ai-render.js ====
   AI render hand-off: the picture and instruction for an outside image AI.
*/
/* ===== AI render hand-off: Fitted supplies the picture and the instruction, an outside picture AI makes the photo ===== */
const AI={shots:[],cur:0,plain:null};
function aiPlainShot(){try{if(!T3)return null;const el=T3.renderer.domElement,w=el.width,h=el.height;if(!w||!h)return null;T3.renderer.render(T3.scene,T3.cam);const cv=document.createElement('canvas'),k=Math.min(1,1600/w);cv.width=Math.round(w*k);cv.height=Math.round(h*k);const x=cv.getContext('2d');x.fillStyle=getComputedStyle(document.body).getPropertyValue('--stage').trim()||'#E8EBE7';x.fillRect(0,0,cv.width,cv.height);x.drawImage(el,0,0,cv.width,cv.height);return cv}catch(e){return null}}
function aiPrompt(note,onPhoto){const M=S.mat,fn=k=>(FIN[k]||{}).name||'',mn=t=>((MATS[t]||{}).name||t||'').toLowerCase(),hl=(HANDLES.find(h=>h[0]===S.opts.handle)||[])[1]||'',zn={closed:'cupboard doors',open:'open shelves',drawers:'drawers',opening:'open niche',seat:'window seat with cushion',speaker:'fabric speaker front',passage:'walk-through opening'};
  const cols=geo.secs.map((q,i)=>{const sc=S.sections[i];if(!sc)return '';if(q.panel){const f=(Object.assign({},PANEL_DEF,sc.panel||{})).fun;return `${i+1}: wall panel${f==='peg'?' with a wooden peg board, pegs and small shelves':f==='slats'?' of vertical wooden slats':f==='climb'?' with climbing holds':''}`}if(q.door)return `${i+1}: doorway`;
      const zs=(sc.zones||[]).map(z=>{let t=zn[z.type]||z.type;if(z.type==='opening'){t=z.look==='nook'?`reading nook with mattress and cushions${z.nookFront?' behind a front with '+({arch:'an arched',eyebrow:'a low arched',port:'a round porthole',house:'a house-shaped'}[z.nookFront])+' opening':''}${z.nookCurtain?' and a curtain':''}`:z.look==='art'?'niche with a framed picture':z.look==='dj'?'niche with DJ turntables':z.look==='none'?'empty niche':'niche with a TV'}
          if(z.type==='closed'&&z.face==='slat')t='slatted doors';if(z.type==='closed'&&z.face==='glass')t='fluted glass doors';if(z.type==='closed'&&z.face==='cane')t='cane-webbing doors';if(z.type==='closed'&&z.face==='fluted')t='fluted doors';if(z.type==='closed'&&z.face==='curtain')t='fabric curtain';if(z.type==='open'&&z.arch)t='open shelves behind arched openings';if(z.type==='open'&&z.slat)t='shelves behind a fixed slatted screen';
          const c=FIN[z.fin]?fn(z.fin):FIN[z.inFin]&&(z.type==='open'||z.type==='opening')?fn(z.inFin)+(z.drench?' (all surfaces)':' back'):'';return t+(c?' in '+c:'')}).reverse();return `${i+1}${q.desk?' (desk)':''}: ${zs.join(', ')}`}).filter(Boolean);
  const lines=['Turn this picture into a photorealistic interior photograph.',
    onPhoto?'It is a photo of a real room with a 3D model of a built-in cabinet wall placed in it.':'It is a 3D model of a built-in cabinet wall.',
    'Keep exactly as shown: the camera angle and framing, '+(onPhoto?'the room, ':'')+'and the size, position and layout of the cabinet. Every door, drawer, shelf, niche and gap stays where it is; do not add, remove, move or resize any part, and do not add furniture or people.',
    'Change only how it looks: real materials with fine edges and thin, even gaps between the fronts; natural light and soft shadows'+(onPhoto?' that match the room in the photo':'')+'; believable reflections.',
    'The decoration is drawn as simple placeholder shapes'+(ui.props?'':' (if any is shown)')+': books, vases, plants, framed pictures, cushions, baskets, boxes and toys. Make every one of them photorealistic too — real printed book spines of different thickness, glazed ceramic, living plants with real leaves, soft fabric with folds and seams, woven baskets — each the same kind of object, in the same place and about the same size and colour as shown. Do not leave any flat, cartoon-like or plain-coloured object in the picture, and do not add new ones.',
    `Materials — fronts: ${fn(M.front.fin)} (${mn(M.front.type)}); cabinet body and inside: ${fn(M.carcass.fin)} (${mn(M.carcass.type)})${M.desk&&geo.secs.some(q=>q.desk)?`; desk top: ${fn(M.desk.fin)}`:''}; handles: ${hl.toLowerCase()||'none'}.`,
    `From left to right, top to bottom — ${cols.join('; ')}.`,
    'Result: one photo, same proportions as the picture, no text, no labels, no watermark.'];
  if(note)lines.push('Also change: '+note.trim().replace(/\s+/g,' ')+'.');return lines.join('\n')}
function aiShow(){const sh=AI.shots[AI.cur],im=document.getElementById('aiImg'),no=document.getElementById('aiNone'),pk=document.getElementById('aiPick');if(sh){im.hidden=false;im.src=sh.url;no.hidden=true}else{im.hidden=true;no.hidden=false;no.textContent='The picture could not be made here. Open the 3D view once and tap AI render again — the instruction below still works with a screenshot.'}
  pk.innerHTML=AI.shots.length>1?AI.shots.map((s_,j)=>`<button type="button" class="tchip ${j===AI.cur?'on':''}" data-act="aiPick" data-a="${j}">${esc(s_.label)}</button>`).join(''):'';aiText()}
function aiText(){const t=document.getElementById('aiText'),sh=AI.shots[AI.cur];t.value=aiPrompt(document.getElementById('aiNote').value,!!(sh&&sh.photo))}
async function aiOpen(){const mm=document.getElementById('mmenu');if(mm)mm.hidden=true;if(ui.tab!=='3d'){const tb=document.querySelector('#tabs [data-a="3d"]')||document.querySelector('[data-act="tab"][data-a="3d"]');if(tb)tb.click();await new Promise(r=>setTimeout(r,600))}
  toast('Making the picture…');await new Promise(r=>setTimeout(r,30));AI.shots=[];AI.cur=0;const mk=(cv,label,photo)=>{try{AI.shots.push({cv,label,photo,url:cv.toDataURL('image/jpeg',.9)})}catch(e){}};
  try{if(PHS.some(o=>o&&o.img)){const cs=await photoShots();cs.forEach((cv,j)=>mk(cv,`Room photo ${j+1}`,true))}}catch(e){}
  if(!(ui.photoOn&&AI.shots.length)){const cv=aiPlainShot();if(cv)AI.shots.unshift({cv,label:'3D view',photo:false,url:cv.toDataURL('image/jpeg',.9)})}
  if(ui.photoOn&&AI.shots.length)AI.cur=Math.min(AI.shots.length-1,AI.shots.findIndex(s_=>s_.photo)+Math.max(0,phCur));if(AI.cur<0)AI.cur=0;
  document.querySelectorAll('.toast').forEach(t=>t.remove());document.getElementById('aim').hidden=false;aiShow()}
async function aiSave(){const sh=AI.shots[AI.cur];if(!sh){toast('There is no picture to save — take a screenshot of the 3D view instead');return}const blob=await new Promise(r=>sh.cv.toBlob(r,'image/jpeg',.92)),fn='kast-for-ai-render.jpg';if(!blob){toast('Could not make the picture file');return}
  let dl=null;try{if(window.claude&&claude.use)dl=await claude.use('downloads')}catch(e){}
  if(dl){try{await dl.save({filename:fn,data:blob});toast('Picture saved — now copy the instruction')}catch(e){toast(e&&e.code==='declined'?'Not saved':'Could not save here — press and hold the picture to save it')}return}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);toast('Picture saved — now copy the instruction')}catch(e){toast('Press and hold the picture to save it')}}
async function aiCopy(t,ok){try{await navigator.clipboard.writeText(t);toast(ok)}catch(e){const ta=document.getElementById('aiText');ta.value=t;ta.focus();ta.select();toast('Could not copy by itself — the text is selected, copy it by hand')}}
document.addEventListener('input',e=>{if(e.target&&e.target.id==='aiNote')aiText()});
function photoRefs(){const G=geo,W=G.W,r=[{x:0,y:0,t:'Floor, left',h:'Where the cabinet wall meets the floor on the left.'},{x:W,y:0,t:'Floor, right',h:'Where the cabinet wall meets the floor on the right.'},{x:W,y:G.ceilAt(W),t:'Top right corner',h:`Where the wall meets the ceiling on the right — ${f0(G.ceilAt(W))} mm up.`},{x:0,y:G.ceilAt(0),t:'Top left corner',h:`Where the wall meets the ceiling on the left — ${f0(G.ceilAt(0))} mm up.`}];
  G.cps.filter(p=>p.x>20&&p.x<W-20).forEach(p=>r.push({x:p.x,y:p.y,t:`Ceiling bend at ${f0(p.x)} mm`,h:`Optional — where the ceiling line bends, ${f0(p.x)} mm from the left wall, ${f0(p.y)} mm up. Makes the fit more exact.`,opt:true}));return r}
function solvePhoto(){if(typeof geo==='undefined'||!geo)return false;const R=photoRefs(),src=[],dst=[],obs=[];R.forEach((r,i)=>{const p=PH.pts[i];if(p){src.push([r.x,r.y]);dst.push([p[0]-PH.iw/2,p[1]-PH.ih/2]);obs.push({X:r.x,Y:r.y,u:p[0],v:p[1]})}});
  PH.pose=null;PH.H=null;if(src.length<4||!PH.iw)return false;const H=solveH(src,dst);if(!H)return false;PH.H=H;
  try{const cx=PH.iw/2,cy=PH.ih/2,mx=Math.max(PH.iw,PH.ih),edgs=[];let fE=null;
    {const n=v3x([H[0][0],H[1][0],H[2][0]],[H[0][1],H[1][1],H[2][1]]);let sw=0,sf=0;photoEdgeRefs().forEach(e=>{const q=PH.edges&&PH.edges[e.c];if(!q)return;edgs.push({x:e.x,y:e.y,q});const P=projH(H,e.x,e.y),a=[P[0]-cx,P[1]-cy,1],len=Math.hypot(q[0]-P[0],q[1]-P[1]);if(len<8)return;
      const fOf=b=>{const l=v3x(a,b),f2=-l[2]*n[2]/(l[0]*n[0]+l[1]*n[1]);return isFinite(f2)&&f2>0?Math.sqrt(f2):0/0},px=-(q[1]-P[1])/len*3,py=(q[0]-P[0])/len*3,f=fOf([q[0]-cx,q[1]-cy,1]),fa=fOf([q[0]-cx+px,q[1]-cy+py,1]),fb=fOf([q[0]-cx-px,q[1]-cy-py,1]),rel=Math.max(Math.abs(fa-f),Math.abs(fb-f))/f;
      if(f>mx*0.3&&f<mx*3.5&&rel<0.2){const w=len/(rel+0.02);sw+=w;sf+=f*w}});if(sw)fE=sf/sw}
    const fX=PH.f35>0?PH.f35/43.27*Math.hypot(PH.iw,PH.ih):null;
    const fA=PH.fAuto>0?PH.fAuto:null;let p=poseFromH(H,PH.ih,fE||fX||fA||undefined);const srcF=fE?'edges':fX?'photo':fA?'auto':p.guessed?'guess':'wall';
    if(!isFinite(p.C[0])||!isFinite(p.C[2]))return false;
    p=refinePose(p,obs,edgs,!!fE);
    if(PH.lens!==1)p=refinePose(poseFromH(H,PH.ih,p.f*PH.lens),obs,[],false);
    p.src=srcF;p.guessed=srcF==='guess';p.asp=poseFromH(H,PH.ih,p.f).asp;PH.pose=p;return true}catch(e){return false}}
const v3x=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function poseProj(p,X,Y,Z){const d=[X-p.C[0],Y-p.C[1],Z-p.C[2]],R=p.R,x=R[0][0]*d[0]+R[0][1]*d[1]+R[0][2]*d[2],y=R[1][0]*d[0]+R[1][1]*d[1]+R[1][2]*d[2],z=R[2][0]*d[0]+R[2][1]*d[1]+R[2][2]*d[2];return [PH.iw/2+p.f*x/z,PH.ih/2+p.f*y/z,z]}
function photoEdgeRefs(){const G=geo,W=G.W,e=[{c:0,x:0,y:0},{c:1,x:W,y:0}];if(!(+S.room.drop))e.push({c:2,x:W,y:G.ceilAt(W)},{c:3,x:0,y:G.ceilAt(0)});return e}
/* fit the whole camera (rotation, position and, when room edges are lined up, the lens) to every tapped point at once */
function refinePose(p0,obs,edges,freeF){try{const cx=PH.iw/2,cy=PH.ih/2;let R=p0.R.map(r=>r.slice()),C=p0.C.slice(),f=p0.f;
  const rot=(w,R)=>{const th=Math.hypot(w[0],w[1],w[2]);if(th<1e-12)return R.map(r=>r.slice());const k=w.map(v=>v/th),c=Math.cos(th),sn=Math.sin(th),K=[[0,-k[2],k[1]],[k[2],0,-k[0]],[-k[1],k[0],0]],E=[[1,0,0],[0,1,0],[0,0,1]].map((r,i)=>r.map((v,j)=>v+sn*K[i][j]+(1-c)*(K[i][0]*K[0][j]+K[i][1]*K[1][j]+K[i][2]*K[2][j])));return E.map(r=>[0,1,2].map(j=>r[0]*R[0][j]+r[1]*R[1][j]+r[2]*R[2][j]))};
  const pr=(R,C,f,X,Y,Z)=>{const d=[X-C[0],Y-C[1],Z-C[2]],x=R[0][0]*d[0]+R[0][1]*d[1]+R[0][2]*d[2],y=R[1][0]*d[0]+R[1][1]*d[1]+R[1][2]*d[2],z=R[2][0]*d[0]+R[2][1]*d[1]+R[2][2]*d[2];return [cx+f*x/z,cy+f*y/z]};
  const n=freeF?7:6,res=q=>{const Rq=rot(q,R),Cq=[C[0]+q[3],C[1]+q[4],C[2]+q[5]],fq=f+(freeF?q[6]:0),r=[];obs.forEach(o=>{const u=pr(Rq,Cq,fq,o.X,o.Y,0);r.push(u[0]-o.u,u[1]-o.v)});
    edges.forEach(e=>{const a=pr(Rq,Cq,fq,e.x,e.y,0),b=pr(Rq,Cq,fq,e.x,e.y,1000),dx=e.q[0]-a[0],dy=e.q[1]-a[1],bl=Math.hypot(b[0]-a[0],b[1]-a[1])||1;r.push(((b[0]-a[0])*dy-(b[1]-a[1])*dx)/bl*1.5)});return r};
  const cost=r=>r.reduce((a,v)=>a+v*v,0),eps=[1e-5,1e-5,1e-5,0.5,0.5,0.5,0.5];let r0=res([0,0,0,0,0,0,0]),c0=cost(r0),lam=1e-3;if(!isFinite(c0))return p0;
  for(let it=0;it<40;it++){const J=[];for(let k=0;k<n;k++){const q=[0,0,0,0,0,0,0];q[k]=eps[k];const r1=res(q);J.push(r1.map((v,i)=>(v-r0[i])/eps[k]))}
    const A=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>J[i].reduce((a,v,m)=>a+v*J[j][m],0))),g=J.map(Ji=>-Ji.reduce((a,v,m)=>a+v*r0[m],0));let ok=false;
    for(let tr=0;tr<8&&!ok;tr++){const M=A.map((row,i)=>row.map((v,j)=>i===j?v*(1+lam)+1e-12:v).concat([g[i]]));let sing=false;
      for(let c=0;c<n;c++){let pv=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[pv][c]))pv=r;[M[c],M[pv]]=[M[pv],M[c]];const d=M[c][c];if(Math.abs(d)<1e-18){sing=true;break}for(let j=c;j<=n;j++)M[c][j]/=d;for(let r=0;r<n;r++)if(r!==c){const m=M[r][c];if(m)for(let j=c;j<=n;j++)M[r][j]-=m*M[c][j]}}
      if(sing){lam*=10;continue}const q=[0,0,0,0,0,0,0];for(let k=0;k<n;k++)q[k]=M[k][n];const r1=res(q),c1=cost(r1);
      if(isFinite(c1)&&c1<c0){R=rot(q,R);C=[C[0]+q[3],C[1]+q[4],C[2]+q[5]];if(freeF)f+=q[6];r0=res([0,0,0,0,0,0,0]);const dc=c0-c1;c0=cost(r0);lam=Math.max(1e-7,lam/4);ok=true;if(dc<1e-9)it=99}else lam*=10}
    if(!ok)break}
  const mx=Math.max(PH.iw,PH.ih);if(!(f>mx*0.25&&f<mx*4)||!isFinite(C[0]+C[1]+C[2]))return p0;return Object.assign({},p0,{f,R,C,rms:Math.sqrt(c0/Math.max(1,r0.length))})}catch(e){return p0}}
/* read the lens (35 mm equivalent) from the photo file, when the phone stored it */
function exifF35(buf){try{const v=new DataView(buf);if(v.getUint16(0)!==0xFFD8)return 0;let o=2;while(o+4<v.byteLength){const m=v.getUint16(o),len=v.getUint16(o+2);if(m===0xFFE1&&v.getUint32(o+4)===0x45786966){const t=o+10,le=v.getUint16(t)===0x4949,u16=x=>v.getUint16(x,le),u32=x=>v.getUint32(x,le);
      const find=(ifd,tag)=>{const cnt=u16(ifd);for(let k=0;k<cnt;k++){const e=ifd+2+k*12;if(u16(e)===tag)return e}return 0};const e0=find(t+u32(t+4),0x8769);if(!e0)return 0;const ex=t+u32(e0+8),e1=find(ex,0xA405);if(!e1)return 0;const f=u16(e1+8);return f>8&&f<400?f:0}
    if((m&0xFF00)!==0xFF00)break;o+=2+len}}catch(e){}return 0}
/* straighten a wide-angle photo: k>0 pushes the corners out, k<0 pulls them in */
function photoWarp(k,done,noMap){const im0=PH.img0||PH.img;if(!im0){done&&done();return}const w=im0.naturalWidth,h=im0.naturalHeight,cx=w/2,cy=h/2,R0=Math.hypot(cx,cy),k0=PH.k1||0;
  if(!noMap){const mp=q=>{if(!q)return q;const nx=(q[0]-cx)/R0,ny=(q[1]-cy)/R0,s0=1+k0*(nx*nx+ny*ny),dx=nx*s0,dy=ny*s0;let ux=dx,uy=dy;for(let i=0;i<10;i++){const sc=1+k*(ux*ux+uy*uy);ux=dx/sc;uy=dy/sc}return [cx+ux*R0,cy+uy*R0]};PH.pts=(PH.pts||[]).map(mp);PH.occ=(PH.occ||[]).map(sh=>sh.map(mp));Object.keys(PH.edges||{}).forEach(c=>PH.edges[c]=mp(PH.edges[c]))}
  PH.k1=k;PH._la=null;if(!k){PH.src=PH.src0||PH.src;PH.img=im0;done&&done();return}
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.drawImage(im0,0,0,w,h);const sd=x.getImageData(0,0,w,h),dd=x.createImageData(w,h),a=sd.data,b=dd.data;
  for(let yy=0;yy<h;yy++){const ny=(yy-cy)/R0;for(let xx=0;xx<w;xx++){const nx=(xx-cx)/R0,sc=1+k*(nx*nx+ny*ny),sx=Math.round(cx+nx*sc*R0),sy=Math.round(cy+ny*sc*R0),o=(yy*w+xx)*4;if(sx>=0&&sy>=0&&sx<w&&sy<h){const i=(sy*w+sx)*4;b[o]=a[i];b[o+1]=a[i+1];b[o+2]=a[i+2];b[o+3]=255}else{b[o]=b[o+1]=b[o+2]=14;b[o+3]=255}}}
  x.putImageData(dd,0,0);PH.src=cv.toDataURL('image/jpeg',.88);const im=new Image();im.onload=()=>{PH.img=im;done&&done()};im.src=PH.src}
/* guess the room's light from the photo: brightness and colour of the wall, which side is brighter, how hard the contrast is */
function photoAnalyse(){const im=PH.img,w=96,h=Math.max(8,Math.round(96*PH.ih/PH.iw)),cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.drawImage(im,0,0,w,h);const d=x.getImageData(0,0,w,h).data,sc=w/PH.iw;
  let ring=null;if(PH.H){const G=geo,W=G.W;ring=[[0,0],[W,0],[W,G.ceilAt(W)],...G.cps.filter(p=>p.x>0&&p.x<W).map(p=>[p.x,p.y]).reverse(),[0,G.ceilAt(0)]].map(([X,Y])=>{const q=projH(PH.H,X,Y);return [q[0]*sc,q[1]*sc]})}
  const inside=(px,py)=>{if(!ring)return true;let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>py)!==(b[1]>py)&&px<(b[0]-a[0])*(py-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
  const lin=v=>Math.pow(v/255,2.2),xs=ring?ring.map(p=>p[0]):[0,w],ys=ring?ring.map(p=>p[1]):[0,h],x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  let n=0,mr=0,mg=0,mb=0,sl=0,nl=0,sr=0,nr=0,st=0,nt=0,sb=0,nb=0,sat=0;const lum=[];
  for(let py=0;py<h;py++)for(let px=0;px<w;px++){const i=(py*w+px)*4,r=d[i],g=d[i+1],b=d[i+2],L=0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);lum.push((0.2126*r+0.7152*g+0.0722*b)/255);const mxc=Math.max(r,g,b),mnc=Math.min(r,g,b);sat+=mxc?(mxc-mnc)/mxc:0;
    if(inside(px,py)){n++;mr+=lin(r);mg+=lin(g);mb+=lin(b);const fx=(px-x0)/Math.max(1,x1-x0),fy=(py-y0)/Math.max(1,y1-y0);if(fx<0.33){sl+=L;nl++}else if(fx>0.67){sr+=L;nr++}if(fy<0.4){st+=L;nt++}else if(fy>0.6){sb+=L;nb++}}}
  lum.sort((a,b)=>a-b);const p5=lum[Math.floor(lum.length*0.05)],p95=lum[Math.floor(lum.length*0.95)];if(!n){n=1;mr=mg=mb=0.5}
  const Ll=nl?sl/nl:0.5,Lr=nr?sr/nr:0.5,Lt=nt?st/nt:0.5,Lb=nb?sb/nb:0.5,cl=v=>Math.max(-1,Math.min(1,v));
  return {src:PH.src,rgb:[mr/n,mg/n,mb/n],L:0.2126*mr/n+0.7152*mg/n+0.0722*mb/n,side:cl((Ll-Lr)/(Ll+Lr+1e-6)*5),vert:cl((Lt-Lb)/(Lt+Lb+1e-6)*4),con:p95-p5,sat:sat/(w*h),...photoCamLook(d,w,h,lum.length?p95-p5:0.5)}}
/* how grainy, how soft and how dark in the corners is the photo? */
function photoCamLook(dSmall,w,h,con){let noise=6,soft=0.5,vig=0.1;try{const n=Math.min(240,PH.iw,PH.ih),cv=document.createElement('canvas');cv.width=cv.height=n;const x=cv.getContext('2d');x.drawImage(PH.img,(PH.iw-n)/2,(PH.ih-n)/2,n,n,0,0,n,n);const d=x.getImageData(0,0,n,n).data,g=new Float32Array(n*n);for(let i=0;i<n*n;i++)g[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
    const hp=[],gr=[];for(let y=1;y<n-1;y+=2)for(let xx=1;xx<n-1;xx+=2){const i=y*n+xx,m=(g[i-1]+g[i+1]+g[i-n]+g[i+n])/4;hp.push(Math.abs(g[i]-m));gr.push(Math.hypot(g[i+1]-g[i-1],g[i+n]-g[i-n])/2)}hp.sort((a,b)=>a-b);gr.sort((a,b)=>a-b);
    noise=hp[Math.floor(hp.length*0.5)]*1.5;const top=gr[Math.floor(gr.length*0.985)],rng=Math.max(20,con*255);soft=top<8?0.45:Math.max(0.3,Math.min(0.75,0.85-top/rng*1.6));
    let c=0,nc=0,e=0,ne=0;for(let py=0;py<h;py++)for(let px=0;px<w;px++){const i=(py*w+px)*4,L=(dSmall[i]+dSmall[i+1]+dSmall[i+2])/3,rx=(px/w-0.5)*2,ry=(py/h-0.5)*2,r2=rx*rx+ry*ry;if(r2<0.2){c+=L;nc++}else if(r2>1.3){e+=L;ne++}}if(nc&&ne)vig=Math.max(0,Math.min(0.3,(1-(e/ne)/(c/nc+1e-6))*0.6))}catch(e){}
  return {noise,soft,vig}}
