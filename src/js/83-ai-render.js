/* ==== 83-ai-render.js ====
   AI render hand-off: the picture and instruction for an outside image AI.
*/
/* ===== AI render hand-off: Fitted supplies the picture and the instruction, an outside picture AI makes the photo ===== */
const AI={shots:[],cur:0,plain:null};
/* ===== the questions the AI window asks (answers are remembered in this browser) ===== */
const AIQ_DEF={room:'auto',floor:'oak',walls:'warm',light:'day',mood:'calm',view:'34r',format:'land',style:'shown',extras:[]};
const AIQ_OPTS={
  room:['Room',[['auto','Guess from the design'],['bedroom','Bedroom'],['living','Living room'],['attic','Attic room'],['office','Home office'],['kids','Kids’ room'],['hall','Hallway'],['laundry','Utility room']]],
  floor:['Floor',[['oak','Light oak boards'],['herring','Oak herringbone'],['dark','Dark wood'],['concrete','Polished concrete'],['tiles','Large stone tiles'],['carpet','Soft carpet']]],
  walls:['Walls and ceiling',[['warm','Warm white'],['white','Bright white'],['greige','Soft greige'],['lime','Limewash plaster'],['same','Same colour as the cabinet']]],
  light:['Light',[['day','Soft daylight'],['morning','Morning sun'],['evening','Golden evening'],['night','Lamps at night']]],
  mood:['Mood',[['calm','Calm and airy'],['warm','Warm and cosy'],['moody','Moody and dramatic'],['fresh','Bright and fresh']]],
  view:['Camera',[['34r','¾ from the right'],['front','Straight on'],['34l','¾ from the left'],['close','Close-up of the selected column']]],
  format:['Format',[['land','Landscape 16:10'],['port','Portrait 4:5'],['square','Square']]],
  style:['Shelves and niches',[['shown','As in the picture'],['clean','Clean and empty'],['light','Lightly styled'],['lived','Lived-in']]],
  extras:['Add in the room (optional)',[['rug','A rug'],['plant','A big plant'],['bed','End of a bed'],['sofa','A sofa'],['chair','An armchair'],['person','A person']]]};
let AIQ=Object.assign({},AIQ_DEF);try{const o=JSON.parse(localStorage.getItem('fitted-aiq')||'null');if(o)AIQ=Object.assign({},AIQ_DEF,o,{extras:Array.isArray(o.extras)?o.extras:[]})}catch(e){}
function aiqSave(){try{localStorage.setItem('fitted-aiq',JSON.stringify(AIQ))}catch(e){}}
function aiqHTML(onPhoto){const keys=onPhoto?['light','mood','style','extras']:['room','floor','walls','light','mood','view','format','style','extras'];
  return keys.map(k=>{const[l,opts]=AIQ_OPTS[k],multi=k==='extras';return `<div class="aiq"><span>${l}</span><div class="aiqc">${opts.map(([v,t])=>{const on=multi?AIQ.extras.includes(v):AIQ[k]===v;return `<button type="button" class="tchip ${on?'on':''}" data-act="aiQ" data-a="${k}:${v}" aria-pressed="${on}">${t}</button>`}).join('')}</div></div>`}).join('')+(onPhoto?'<p class="hintp" style="margin:0">On a room photo the room, camera and format stay as in your photo.</p>':'')}
const AIQ_SIZE={land:[2560,1600],port:[2048,2560],square:[2400,2400]};
/* hide the stand-in person (height reference) while making AI pictures */
function aiPerson(show){try{T3&&T3.scene&&T3.scene.traverse(o=>{if(o.name==='refPerson'){if(!show){o.userData.wasV=o.visible;o.visible=false}else if(o.userData.wasV!=null){o.visible=o.userData.wasV;delete o.userData.wasV}}})}catch(e){}}
/* the plain 3D picture: always the whole wall (or the selected column for a close-up), at a fixed size whatever the screen */
function aiPlainShot(){try{if(!T3||!T3.renderer||!T3.cam||!window.THREE)return null;const R=T3.renderer,cam=T3.cam,el=R.domElement;let[W,H]=AIQ_SIZE[AIQ.format]||AIQ_SIZE.land;
  try{const gl=R.getContext(),mx=Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),(gl.getParameter(gl.MAX_VIEWPORT_DIMS)||[4096])[0]);const k=Math.min(1,mx/Math.max(W,H));W=Math.floor(W*k);H=Math.floor(H*k)}catch(e){}
  const pr=R.getPixelRatio(),sz=R.getSize(new THREE.Vector2()),asp=cam.aspect,pos=cam.position.clone(),qt=cam.quaternion.clone();
  const maxC=Math.max(...geo.cps.map(p=>p.y),+S.room.H),half=((cam.fov||38)*Math.PI/180)/2,q=geo.secs[ui.sel]||geo.secs[0];let tgt,wFit,hFit;
  if(AIQ.view==='close'&&q){tgt=new THREE.Vector3((q.bL+q.bR)/2,Math.min(maxC*0.5,1200),-geo.D/2);wFit=(q.bR-q.bL)+700;hFit=Math.min(maxC,2400)}else{tgt=new THREE.Vector3(geo.W/2,maxC*0.48,-geo.D/2);wFit=geo.W;hFit=maxC}
  const r=Math.max((hFit*0.6)/Math.tan(half),(wFit*0.6)/(Math.tan(half)*W/H))*1.1,th=AIQ.view==='front'?0:AIQ.view==='34l'?-0.42:AIQ.view==='close'?0.3:0.42,ph=AIQ.view==='front'?0.04:0.14;let shot=null;
  aiPerson(false);
  try{R.setPixelRatio(1);R.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();cam.position.set(tgt.x+r*Math.cos(ph)*Math.sin(th),tgt.y+r*Math.sin(ph),tgt.z+r*Math.cos(ph)*Math.cos(th));cam.lookAt(tgt);R.render(T3.scene,cam);
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.fillStyle=getComputedStyle(document.body).getPropertyValue('--stage').trim()||'#E8EBE7';x.fillRect(0,0,W,H);x.drawImage(el,0,0,W,H);shot=cv}
  finally{aiPerson(true);R.setPixelRatio(pr);R.setSize(sz.x,sz.y,false);cam.aspect=asp;cam.updateProjectionMatrix();cam.position.copy(pos);cam.quaternion.copy(qt);try{R.render(T3.scene,cam)}catch(e){}}
  return shot}catch(e){return null}}
/* ===== the instruction (written for ChatGPT's image model, works in others too) ===== */
const AIQ_TXT={room:{bedroom:'a bedroom',living:'a living room',attic:'an attic room under a sloping roof',office:'a home office',kids:'a child’s bedroom',hall:'a hallway',laundry:'a utility and laundry room'},
  floor:{oak:'wide light-oak floorboards with a matt oiled finish',herring:'light-oak herringbone parquet',dark:'dark smoked-oak floorboards',concrete:'smooth pale-grey polished concrete',tiles:'large-format warm-grey stone tiles',carpet:'soft wall-to-wall carpet in a neutral oatmeal colour'},
  walls:{warm:'warm white matt walls and ceiling',white:'bright white matt walls and ceiling',greige:'soft greige matt walls with a white ceiling',lime:'textured limewash plaster walls in a warm off-white',same:'walls painted the same colour as the cabinet fronts (colour-drenched), white ceiling'},
  light:{day:'soft, even daylight from a window on the left, overcast sky, gentle shadows',morning:'low morning sun from a window on the left casting long soft-edged light patches across the floor',evening:'warm golden-hour light from a window on the left, long warm shadows',night:'evening with warm lamps on (2700 K), a soft glow from any lights inside the cabinet, dark window'},
  mood:{calm:'calm, airy and uncluttered',warm:'warm, cosy and inviting',moody:'moody and dramatic with deep shadows',fresh:'bright, fresh and crisp'},
  style:{shown:'Keep the objects on shelves and in niches as shown, made photorealistic.',clean:'Shelves and niches are empty and clean; remove the placeholder objects.',light:'Shelves and niches are lightly styled: a few books, one or two ceramics, a small plant — plenty of empty space.',lived:'Shelves and niches look lived-in: books of many sizes, baskets, boxes, ceramics and plants, tidy but full.'},
  extras:{rug:'a large rug on the floor in front of the cabinet',plant:'one big leafy plant in a pot beside the cabinet',bed:'the foot end of a made bed in the foreground',sofa:'part of a sofa in the foreground',chair:'an armchair to one side',person:'one person in everyday clothes, naturally in the scene, not covering the cabinet'}};
function aiRoomGuess(){const t=JSON.stringify(S.sections);return /"rail":true/.test(t)?'bedroom':/"tv":[1-9]|"speaker"/.test(t)?'living':/"desk"/.test(t)?'office':/laundry|"stack"|"washer"/.test(t)?'laundry':(S.room.ceil||[]).some(p=>Math.abs(+p.y-+S.room.H)>1)?'attic':'living'}
function aiFinTxt(k,t){const f=FIN[k]||{},m=MATS[t]||{};const surf=m.paint?'smooth matt lacquer':m.micro?'hand-trowelled microcement':f.kind==='wood'||m.fins==='wood'?'real wood veneer with natural grain running vertically':f.kind==='ply'?'birch plywood with visible layered edges':t==='hpl'?'super-matt laminate':'smooth matt melamine';return `${f.name||k}${f.base?' ('+f.base+')':''}, ${surf}`}
function aiPrompt(note,onPhoto){const M=S.mat,G=geo,fn=k=>(FIN[k]||{}).name||'',hl=(HANDLES.find(h=>h[0]===S.opts.handle)||[])[1]||'',zn={closed:'cupboard doors',open:'open shelves',drawers:'drawers',opening:'open niche',seat:'window seat with cushion',speaker:'fabric speaker front',passage:'walk-through opening'};
  const cols=G.secs.map((q,i)=>{const sc=S.sections[i];if(!sc)return '';const w=f0(q.bR-q.bL);if(q.panel){const f=(Object.assign({},PANEL_DEF,sc.panel||{})).fun;return `${i+1} (${w} mm): wall panel${f==='peg'?' with a wooden peg board, pegs and small shelves':f==='slats'?' of vertical wooden slats':f==='climb'?' with climbing holds':''}`}if(q.door)return `${i+1} (${w} mm): doorway`;
      const zs=(sc.zones||[]).map(z=>{let t=zn[z.type]||z.type;if(z.type==='drawers')t=`${+z.count||3} drawers`;if(z.type==='opening'){t=z.look==='nook'?`reading nook with mattress and cushions${z.nookFront?' behind a front with '+({arch:'an arched',eyebrow:'a low arched',port:'a round porthole',house:'a house-shaped'}[z.nookFront])+' opening':''}${z.nookCurtain?' and a curtain':''}`:z.look==='art'?'niche with a framed picture':z.look==='dj'?'niche with DJ turntables':z.look==='oven'||z.look==='combi'?'built-in oven':z.look==='washer'||z.look==='dryer'||z.look==='stack'?'washing machine niche':z.look==='bed'?'fold-down bed front':z.look==='none'?'empty niche':'niche with a TV'}
          if(z.type==='closed'&&z.face==='slat')t='slatted doors';if(z.type==='closed'&&z.face==='glass')t='fluted glass doors';if(z.type==='closed'&&z.face==='cane')t='cane-webbing doors';if(z.type==='closed'&&z.face==='fluted')t='fluted (reeded) doors';if(z.type==='closed'&&z.face==='curtain')t='fabric curtain';if(z.type==='open'&&z.arch)t='open shelves behind arched openings';if(z.type==='open'&&z.slat)t='shelves behind a fixed slatted screen';if(z.type==='open'&&+z.shelves>0)t+=` (${z.shelves} shelves)`;
          const c=FIN[z.fin]?fn(z.fin):FIN[z.inFin]&&(z.type==='open'||z.type==='opening')?fn(z.inFin)+(z.drench?' (all surfaces)':' back'):'';return t+(c?' in '+c:'')}).reverse();return `${i+1} (${w} mm wide${q.desk?', with a desk':''}): ${zs.join(', ')}`}).filter(Boolean);
  const maxC=Math.max(...G.cps.map(p=>p.y),+S.room.H),slope=(S.room.ceil||[]).some(p=>Math.abs(+p.y-+S.room.H)>1),room=AIQ.room==='auto'?aiRoomGuess():AIQ.room,push=S.opts.handle==='none';
  const hand=push?'no handles at all — push-to-open, with even 3 mm shadow gaps between the fronts':`${hl.toLowerCase()}${/wood|edge|profile|disc/.test(S.opts.handle)?' in '+((WOODS[S.opts.handleWood]||{}).name||'oak').toLowerCase():''}, all the same and in the same position on every front`;
  const fmt=onPhoto?'the same size and proportions as the attached photo':{land:'landscape 16:10, the same proportions as the attached picture',port:'portrait 4:5, the same proportions as the attached picture',square:'square, the same proportions as the attached picture'}[AIQ.format];
  const ex=AIQ.extras.map(k=>AIQ_TXT.extras[k]).filter(Boolean);
  const L=[];
  L.push(onPhoto?'Edit the attached photo of a real room: it shows a 3D model of a made-to-measure built-in cabinet wall placed in the room. Make the cabinet look real and built-in, as if photographed in this room.':'Turn the attached 3D picture into a photorealistic interior photograph of a made-to-measure built-in cabinet wall.');
  L.push('','KEEP EXACTLY (most important)',`- The camera position, angle and framing${onPhoto?', and the whole room, its light and everything in it':''}.`,'- The cabinet’s size, shape and layout: every column, door, drawer, shelf, niche, gap and line stays exactly where it is. Do not add, remove, merge, move or resize any part. Do not add handles, doors or shelves that are not in the picture.','- Straight vertical and horizontal lines; no warping, no fisheye.');
  L.push('','THE CABINET',`- Fills the wall ${f0(G.W)} mm wide${slope?`, under a sloping ceiling (up to ${f0(maxC)} mm high), following the slope exactly`:`, floor to ceiling (${f0(maxC)} mm)`}${(G.beams||[]).length?', fitted around a ceiling beam':''}; ${f0(+S.room.D)} mm deep.`,
    `- Columns from left to right, each listed from top to bottom: ${cols.join('; ')}.`,
    `- Fronts: ${aiFinTxt(M.front.fin,M.front.type)}. Body and inside: ${aiFinTxt(M.carcass.fin,M.carcass.type)}.${M.desk&&G.secs.some(q=>q.desk)?` Desk top: ${aiFinTxt(M.desk.fin,M.desk.type)}.`:''}`,
    `- Handles: ${hand}.`,
    `- Built-in details: a plinth set back ${f0(+S.skirt.recess||40)} mm at the bottom; closing strips fitted tight to the ceiling and side walls, no visible gaps to the room; crisp, slightly softened edges; thin, perfectly even gaps between fronts.${S.opts.innerLight?' Warm white LED light strips glow inside the cabinets and niches.':''}`);
  if(!onPhoto)L.push('','THE ROOM',`- ${({bedroom:'A',living:'A',attic:'An',office:'A',kids:'A',hall:'A',laundry:'A'})[room]||'A'} ${String(AIQ_TXT.room[room]||'room').replace(/^an? /,'')}${slope&&room!=='attic'?' with a sloping ceiling':''}.`,`- Floor: ${AIQ_TXT.floor[AIQ.floor]}.`,`- Walls and ceiling: ${AIQ_TXT.walls[AIQ.walls]}.`);
  const lt=AIQ_TXT.light[AIQ.light];L.push('','LIGHT AND MOOD',`- ${onPhoto?'Match the light of the photo; ':''}${onPhoto?lt:lt[0].toUpperCase()+lt.slice(1)}.`,`- Overall feel: ${AIQ_TXT.mood[AIQ.mood]}.`);
  L.push('','STYLING',`- ${AIQ_TXT.style[AIQ.style]}`,'- The decoration in the picture is drawn as simple placeholder shapes; make every object you keep fully photorealistic (real book spines, glazed ceramics, living plants, soft fabric with folds), in the same place and about the same size and colour.',
    ex.length?`- Add only these, outside the cabinet and without covering more than a small part of it: ${ex.join('; ')}.`:'- Do not add furniture, people or objects outside the cabinet.');
  if(!onPhoto)L.push('','PHOTOGRAPHY','- Interior magazine photograph: full-frame camera, 24 mm lens, camera at about 1.4 m, two-point perspective with straight verticals, sharp from front to back (f/8), natural colours, soft high dynamic range, no lens flare.');
  L.push('','RESULT',`- One photo, ${fmt}, as large and sharp as possible.`,'- No text, labels, logos, watermarks or borders. No cartoon or plastic look.');
  if(note)L.push('','ALSO CHANGE','- '+note.trim().replace(/\s+/g,' ')+'.');
  return L.join('\n')}
function aiShow(){const sh=AI.shots[AI.cur],im=document.getElementById('aiImg'),no=document.getElementById('aiNone'),pk=document.getElementById('aiPick');if(sh){im.hidden=false;im.width=sh.cv.width;im.height=sh.cv.height;im.src=sh.url;no.hidden=true}else{im.hidden=true;no.hidden=false;no.textContent='The picture could not be made here. Open the 3D view once and tap AI render again — the instruction below still works with a screenshot.'}
  {const q=document.getElementById('aiQs');if(q)q.innerHTML=aiqHTML(!!(sh&&sh.photo))}
  pk.innerHTML=AI.shots.length>1?AI.shots.map((s_,j)=>`<button type="button" class="tchip ${j===AI.cur?'on':''}" data-act="aiPick" data-a="${j}">${esc(s_.label)}</button>`).join(''):'';aiText()}
function aiText(){const t=document.getElementById('aiText'),sh=AI.shots[AI.cur];t.value=aiPrompt(document.getElementById('aiNote').value,!!(sh&&sh.photo))}
async function aiOpen(){const mm=document.getElementById('mmenu');if(mm)mm.hidden=true;if(ui.tab!=='3d'){const tb=document.querySelector('#tabs [data-a="3d"]')||document.querySelector('[data-act="tab"][data-a="3d"]');if(tb)tb.click();await new Promise(r=>setTimeout(r,600))}
  toast('Making the picture…');await new Promise(r=>setTimeout(r,30));AI.shots=[];AI.cur=0;const mk=(cv,label,photo)=>{try{AI.shots.push({cv,label,photo,url:cv.toDataURL('image/jpeg',.85)})}catch(e){}};aiPerson(false);
  try{if(PHS.some(o=>o&&o.img)){const cs=await photoShots();cs.forEach((cv,j)=>mk(cv,`Room photo ${j+1}`,true))}}catch(e){}
  if(!(ui.photoOn&&AI.shots.length)){const cv=aiPlainShot();if(cv)AI.shots.unshift({cv,label:'3D view',photo:false,url:cv.toDataURL('image/jpeg',.85)})}
  aiPerson(true);if(ui.photoOn&&AI.shots.length)AI.cur=Math.min(AI.shots.length-1,AI.shots.findIndex(s_=>s_.photo)+Math.max(0,phCur));if(AI.cur<0)AI.cur=0;
  document.querySelectorAll('.toast').forEach(t=>t.remove());document.getElementById('aim').hidden=false;aiShow()}
async function aiSave(){const sh=AI.shots[AI.cur];if(!sh){toast('There is no picture to save — take a screenshot of the 3D view instead');return}const blob=await new Promise(r=>sh.cv.toBlob(r,'image/jpeg',.95)),fn=`fitted-for-ai-${slugOf(curName())}-${sh.cv.width}x${sh.cv.height}.jpg`;if(!blob){toast('Could not make the picture file');return}
  let dl=null;try{if(window.claude&&claude.use)dl=await claude.use('downloads')}catch(e){}
  if(dl){try{await dl.save({filename:fn,data:blob});toast('Picture saved — now copy the instruction')}catch(e){toast(e&&e.code==='declined'?'Not saved':'Could not save here — press and hold the picture to save it')}return}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);toast('Picture saved — now copy the instruction')}catch(e){toast('Press and hold the picture to save it')}}
async function aiCopy(t,ok){try{await navigator.clipboard.writeText(t);toast(ok)}catch(e){const ta=document.getElementById('aiText');const d=ta.closest('details');if(d)d.open=true;ta.value=t;ta.focus();ta.select();toast('Could not copy by itself — the text is selected, copy it by hand')}}
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

/* a new answer: rewrite the instruction; a new camera or format also makes a new picture */
function aiQ(k,v){if(k==='extras'){const i=AIQ.extras.indexOf(v);if(i>=0)AIQ.extras.splice(i,1);else AIQ.extras.push(v)}else AIQ[k]=v;aiqSave();
  if((k==='view'||k==='format')&&AI.shots[AI.cur]&&!AI.shots[AI.cur].photo){const cv=aiPlainShot();if(cv){const j=AI.shots.findIndex(x=>!x.photo);if(j>=0)AI.shots[j]=Object.assign(AI.shots[j],{cv,url:cv.toDataURL('image/jpeg',.85)})}}aiShow()}
