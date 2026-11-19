/* ==== 50-exports.js ====
   Files: PDF pack, part labels, full-size templates, Excel for the shops, DXF for CNC and the brief for a cabinet maker.
*/
/* ===== PDF export: pages are drawn on a canvas and stored as JPEGs in a small hand-written PDF ===== */
const PDFW=1754,PDFH=1240; // A4 landscape at 150 dpi
function cssVarsInline(svg){const cs=getComputedStyle(document.documentElement);return svg.replace(/var\((--[a-z0-9-]+)\)/gi,(m,v)=>(cs.getPropertyValue(v)||'#888').trim()||'#888')}
function svgDefsFor(svg){const gd=document.getElementById('gdefs');if(!gd)return '';const need=new Set(),out=[];let src=svg;for(let pass=0;pass<3;pass++){let add='';(src.match(/url\(#([\w-]+)\)|href="#([\w-]+)"/g)||[]).forEach(m=>{const id=m.replace(/^url\(#|^href="#/,'').replace(/[)"]$/,'');if(need.has(id))return;need.add(id);if(svg.includes('id="'+id+'"'))return;const el=gd.querySelector('#'+CSS.escape(id));if(el){const h=new XMLSerializer().serializeToString(el);out.push(h);add+=h}});if(!add)break;src=add}return out.join('')}
function svgImage(svg){return new Promise(res=>{let s=cssVarsInline(svg);if(!/xmlns=/.test(s))s=s.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');{const d=svgDefsFor(s);if(d)s=s.replace(/(<svg[^>]*>)/,'$1<defs>'+cssVarsInline(d)+'</defs>')}const img=new Image();img.onload=()=>res(img);img.onerror=()=>res(null);img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s)})}
function newPage(){const c=document.createElement('canvas');c.width=PDFW;c.height=PDFH;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,PDFW,PDFH);x.fillStyle='#1D1D1F';x.textBaseline='top';return {c,x,y:110}}
const PF=(w,s)=>`${w} ${s}px "Instrument Sans", "Helvetica Neue", Arial, sans-serif`,PM=s=>`${s}px "IBM Plex Mono", Menlo, monospace`;
function wrapText(x,t,maxW){const words=String(t).split(/\s+/);const lines=[];let cur='';words.forEach(w=>{const tr=cur?cur+' '+w:w;if(x.measureText(tr).width>maxW&&cur){lines.push(cur);cur=w}else cur=tr});if(cur)lines.push(cur);return lines}
const PACC='#3446D6',PINK='#1D1D1F';let PDFSEC=[];
function pageFrame(pg,title,n,name){const x=pg.x;pg.n=n;pg.title=title;if(!PDFSEC.some(q=>q.t===title))PDFSEC.push({t:title,n});
  x.fillStyle=PACC;x.fillRect(70,40,6,44);x.fillStyle=PINK;x.font=PF(600,30);x.fillText(title,92,46);
  x.font=PF(600,13);x.fillStyle=PACC;x.textAlign='right';x.fillText('KAST · BUILD PACK',PDFW-70,42);x.font=PF(400,16);x.fillStyle='#777';x.fillText(name,PDFW-70,62);x.textAlign='left';x.fillStyle=PINK;x.fillRect(70,94,PDFW-140,1.5)}
function pageFooter(pg,i,name,date){if(!pg.n)return;const x=pg.x;x.fillStyle='#fff';x.fillRect(0,PDFH-50,PDFW,50);x.fillStyle='#D8D8D4';x.fillRect(70,PDFH-50,PDFW-140,1);x.font=PF(400,13);x.fillStyle='#777';x.textAlign='left';x.fillText(`Fitted by BRUIS · ${name}`,70,PDFH-38);x.textAlign='center';x.fillText(date,PDFW/2,PDFH-38);x.textAlign='right';x.fillStyle=PINK;x.font=PF(600,13);x.fillText(`Page ${i+1}`,PDFW-70,PDFH-38);x.textAlign='left'}
const PDF_SECS=[['brief','Brief for a cabinet maker'],['elev','Front drawing'],['room','The cabinet in your room photos'],['cut','Cut list and hardware'],['price','Price estimate'],['loft','Drawings of shaped parts'],['guide','Build guide'],['toons','Bolt & Pip cartoons in the guide']],PDF_PRE={full:['Full pack',{elev:1,room:1,cut:1,price:1,loft:1,guide:1,toons:1}],shop:['Shopping list',{elev:1,cut:1,price:1}],work:['Workshop',{elev:1,cut:1,loft:1,guide:1}],quote:['Ask a maker for a quote',{brief:1,elev:1,room:1}]};
function pdfDialog(){let m=document.getElementById('pdfm');if(!m){m=document.createElement('div');m.id='pdfm';m.className='modal';document.body.appendChild(m)}const sel=ui.pdfSec||(ui.pdfSec=Object.assign({},PDF_PRE.full[1]));
  m.innerHTML=`<div class="pdfc" role="dialog" aria-modal="true" aria-label="Download PDF"><h3>Download PDF</h3><div class="pdfpre">${Object.entries(PDF_PRE).map(([k,[l,v]])=>`<button type="button" class="btn sm ${PDF_SECS.every(([q])=>!!sel[q]===!!v[q])?'on':''}" data-act="pdfPre" data-a="${k}">${l}</button>`).join('')}</div><div class="pdfl">${PDF_SECS.map(([k,l])=>`<label><input type="checkbox" data-pdfsec="${k}" ${sel[k]?'checked':''} ${k==='toons'&&!sel.guide?'disabled':''}> <span>${l}</span></label>`).join('')}</div><div class="pdfbar" id="pdfbar" hidden><i></i></div><p class="hintp" id="pdfst" style="margin:0;min-height:18px">Fewer sections means a smaller, faster PDF.</p><div class="pdfbtn"><button type="button" class="btn" data-act="pdfClose" id="pdfcl">Close</button><button type="button" class="btn pri" data-act="pdfGo" id="pdfgo">Download</button></div></div>`;m.hidden=false}
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.pdfsec;if(!k)return;ui.pdfSec=ui.pdfSec||{};ui.pdfSec[k]=e.target.checked?1:0;if(!ui.pdfBusy)pdfDialog()});
async function fitImage(pg,svg,X,Y,W,H){const img=await svgImage(svg);if(!img)return 0;const r=Math.min(W/img.width,H/img.height);const w=img.width*r,h=img.height*r;pg.x.drawImage(img,X+(W-w)/2,Y,w,h);return h}
function toJpeg(c){return new Promise(res=>c.toBlob(b=>b.arrayBuffer().then(a=>res(new Uint8Array(a))),'image/jpeg',0.86))}
function buildPdf(jpegs,o){o=o||{};const PW=o.pw||842,PH=o.ph||595,IW=o.iw||PDFW,IH=o.ih||PDFH;const enc=new TextEncoder(),parts=[],offs=[];let len=0;const push=b=>{const u=typeof b==='string'?enc.encode(b):b;parts.push(u);len+=u.length};
  const n=jpegs.length,obj=k=>{offs[k]=len};push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  obj(1);push('1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n');
  obj(2);push(`2 0 obj<</Type/Pages/Count ${n}/Kids[${jpegs.map((_,i)=>`${3+i*3} 0 R`).join(' ')}]>>endobj\n`);
  jpegs.forEach((j,i)=>{const p=3+i*3,c=p+1,im=p+2,cs=`q ${PW} 0 0 ${PH} 0 0 cm /I${i} Do Q`;
    obj(p);push(`${p} 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PW} ${PH}]/Resources<</XObject<</I${i} ${im} 0 R>>>>/Contents ${c} 0 R>>endobj\n`);
    obj(c);push(`${c} 0 obj<</Length ${cs.length}>>stream\n${cs}\nendstream endobj\n`);
    obj(im);push(`${im} 0 obj<</Type/XObject/Subtype/Image/Width ${IW}/Height ${IH}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${j.length}>>stream\n`);push(j);push('\nendstream endobj\n')});
  const total=3+n*3,xref=len;let x=`xref\n0 ${total}\n0000000000 65535 f \n`;for(let k=1;k<total;k++)x+=String(offs[k]).padStart(10,'0')+' 00000 n \n';push(x);push(`trailer<</Size ${total}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`);
  const out=new Uint8Array(len);let o_=0;parts.forEach(u=>{out.set(u,o_);o_+=u.length});return out}
/* ---------- A4 portrait pages in real millimetres (labels and full-size templates) ---------- */
const A4W=1240,A4H=1754,MMP=A4W/210; // 150 dpi: 5.905 px per mm
function a4Page(){const c=document.createElement('canvas');c.width=A4W;c.height=A4H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,A4W,A4H);x.fillStyle='#1D1D1F';x.textBaseline='top';return {c,x}}
async function savePdfA4(pages,fn,what){const jp=[];for(const p of pages){jp.push(await toJpeg(p.c));p.c.width=p.c.height=1}await saveFile(fn,new Blob([buildPdf(jp,{pw:595.28,ph:841.89,iw:A4W,ih:A4H})],{type:'application/pdf'}),what)}
const fileBase=()=>(ui.docName||'Fitted').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'Fitted';
// where each part comes from in the cutting plan: "18 mm Melamine #2 B"
function partSources(gs){const out={},AZ='ABCDEFGHIJKLMNOPQRSTUVWXYZ';nestAll(gs).forEach(n=>n.sheets.forEach((sh,si)=>{const ys=[...new Set(sh.pl.map(c=>c.y))].sort((a,b)=>a-b);sh.pl.forEach(c=>{(out[c.p.id]=out[c.p.id]||[]).push(`${n.t} mm ${MATS[n.mt]?.short||''} sheet ${si+1} · strip ${AZ[ys.indexOf(c.y)%26]}`)})}));return out}
/* part labels: 24 stickers of 70 × 37 mm on A4 (3 × 8), one per piece */
/* does the wood grain matter for this part? (wood, plywood, wood-look melamine, veneer, solid wood) */
function grainMatters(p){const f=FIN[p.fin]||{},m=MATS[p.matType]||{};return !!((f.kind&&f.kind!=='plain'&&!f.micro&&!m.paint)||(!f.kind&&/veneer|solid|ply/.test(p.matType||'')))}
/* plain words for the edge banding of a part: [L1,L2,W1,W2] = the two long edges, the two short ends */
function bandWords(p,bs){const m=MATS[p.matType]||{};if(m.paint)return 'Painted — no edge band';if(m.micro)return 'Microcement — no edge band';const nL=(bs[0]?1:0)+(bs[1]?1:0),nW=(bs[2]?1:0)+(bs[3]?1:0);
  if(!nL&&!nW)return 'No edge band';if(nL===2&&nW===2)return 'Edge band all 4 edges';const a=[];if(nL)a.push(nL===2?'both long edges':p.band==='front'?'1 long edge (the front)':'1 long edge');if(nW)a.push(nW===2?'both ends':'1 end');return 'Edge band: '+a.join(' + ')}
async function exportLabels(){const gs=groupsCache||(groupsCache=groupPanels(bgeo())),src=partSources(gs),LW=70*MMP,LH=297/8*MMP,pages=[];let pg=null,n=0;
  const items=[];gs.forEach(p=>{for(let i=0;i<p.qty;i++)items.push([p,i])});const used={};
  items.forEach(([p,i])=>{if(n%24===0){pg=a4Page();pages.push(pg)}const c=n%24,X=(c%3)*LW,Y=Math.floor(c/3)*LH,x=pg.x,pad=3.5*MMP;n++;
    const bs=bandSides(p),gr=grainMatters(p),DW=25*MMP,leftW=LW-DW-pad*3;
    x.strokeStyle='#E2E2E2';x.lineWidth=1;x.strokeRect(X+0.5,Y+0.5,LW-1,LH-1);x.textBaseline='top';
    // left: what the part is
    x.fillStyle='#1D1D1F';x.font=PF(700,50);x.fillText(p.id,X+pad,Y+pad-2);const idw=x.measureText(p.id).width;
    x.font=PF(600,19);const tl=wrapText(x,p.type,LW-idw-pad*3.2).slice(0,2);tl.forEach((l,k)=>x.fillText(l,X+pad*1.6+idw,Y+pad+k*21));
    x.font=PF(400,15);x.fillStyle='#555';x.fillText(`${p.secs.join(', ')}${p.qty>1?` · ${i+1} of ${p.qty}`:''}`,X+pad*1.6+idw,Y+pad+tl.length*21+1);
    x.fillStyle='#1D1D1F';x.font=PM(21);x.fillText(`${f0(p.L)} × ${f0(p.Wd)} × ${p.t}`,X+pad,Y+pad+62);
    x.font=PF(600,14);x.fillStyle=gr?'#8A5A1C':'#666';x.fillText(gr?`Grain runs along the ${f0(p.L)} side`:'No grain — may be turned',X+pad,Y+pad+92);
    x.font=PF(400,14);x.fillStyle='#333';{let t=`${MATS[p.matType]?.short||''} · ${FIN[p.fin]?.name||''}`;while(t.length>8&&x.measureText(t).width>leftW)t=t.slice(0,-2);x.fillText(t,X+pad,Y+pad+112)}
    const sl=(src[p.id]||[]);const k_=used[p.id]=(used[p.id]||0);used[p.id]++;x.fillStyle='#777';x.font=PF(400,13);x.fillText(wrapText(x,sl[k_]||'',leftW)[0]||'',X+pad,Y+LH-pad-14);
    if((p.holes||[]).some(h=>h.dp)){x.fillStyle='#3446D6';x.font=PF(600,13);x.fillText('Hinge cups: see drawing',X+pad,Y+LH-pad-31)}
    // right: the part seen from above, long side across — thick black bar = edge band, thin dashed = bare edge, lines = grain
    const ratio=Math.max(0.28,Math.min(0.6,(p.Wd||1)/(p.L||1))),rw=DW-18,rh=Math.min(11*MMP,rw*ratio),rx=X+LW-pad-DW+4,ry=Y+pad+64;
    x.fillStyle=gr?'#EAD7B7':'#EEEEEC';x.fillRect(rx,ry,rw,rh);
    if(gr){x.strokeStyle='rgba(138,90,28,.45)';x.lineWidth=1.4;for(let k=1;k<6;k++){const yy=ry+rh*k/6;x.beginPath();x.moveTo(rx+3,yy);for(let t=0;t<=8;t++)x.lineTo(rx+3+(rw-6)*t/8,yy+Math.sin(t*1.3+k)*1.6);x.stroke()}
      x.fillStyle='#8A5A1C';x.font=PF(700,11);x.fillText('GRAIN →',rx+4,ry+rh/2-6)}
    const E=[[rx,ry+rh,rx+rw,ry+rh,bs[0]],[rx,ry,rx+rw,ry,bs[1]],[rx,ry,rx,ry+rh,bs[2]],[rx+rw,ry,rx+rw,ry+rh,bs[3]]];
    E.forEach(([a,b,c2,d,on])=>{x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);if(on){x.setLineDash([]);x.strokeStyle='#1D1D1F';x.lineWidth=8}else{x.setLineDash([5,4]);x.strokeStyle='#9A9A9A';x.lineWidth=1.5}x.stroke()});x.setLineDash([]);
    x.fillStyle='#333';x.font=PM(13);x.textAlign='center';x.fillText(f0(p.L),rx+rw/2,ry+rh+8);x.save();x.translate(rx+rw+9,ry+rh/2);x.rotate(Math.PI/2);x.fillText(f0(p.Wd),0,-6);x.restore();x.textAlign='left';
    const bw_=bandWords(p,bs);x.font=PF(700,13);x.fillStyle=bs.some(Boolean)?'#1D1D1F':'#777';const bl=wrapText(x,bw_,DW).slice(0,3);bl.forEach((l,k)=>x.fillText(l,X+LW-pad-DW,ry+rh+24+k*15));
    x.textBaseline='alphabetic'});
  if(!pages.length){toast('No parts to label');return}
  // a key page at the end: how to read the labels
  {const kp=a4Page(),x=kp.x,m=18*MMP;x.fillStyle='#1D1D1F';x.textBaseline='top';x.font=PF(700,40);x.fillText('How to read the labels',m,m);x.font=PF(400,22);
    const rows=[['Thick black bar','that edge gets edge banding'],['Thin dashed line','bare edge — no edge banding'],['Wavy lines + GRAIN →','wood grain: the grain runs along the long side shown, which is the first size on the label'],['No grain — may be turned','plain colour: the part may be cut either way round'],['Sizes','length along the grain × width × thickness, in mm'+(+(S.opts.bandTh||0)>0.45?`; already ${S.opts.bandTh} mm smaller where edge banding goes on`:'')]];
    rows.forEach(([a,b],k)=>{x.font=PF(700,22);x.fillText(a,m,m+90+k*78);x.font=PF(400,22);wrapText(x,b,A4W-2*m-360).forEach((l,j)=>x.fillText(l,m+360,m+90+k*78+j*26))});pages.push(kp)}
  await savePdfA4(pages,`${fileBase()}-labels.pdf`,'Labels');}
/* full-size templates: only the A4 tiles that a sloped or curved edge crosses, at 1:1 */
/* ===== DXF per part for CNC cutting and drilling ===== */
function dxfOf(p){const L=[],e=(c,v)=>L.push(String(c),String(v)),f=v=>(+v).toFixed(2);
  e(0,'SECTION');e(2,'HEADER');e(9,'$ACADVER');e(1,'AC1009');e(9,'$INSUNITS');e(70,4);e(0,'ENDSEC');
  const lay=new Set(['CUT_OUTSIDE']);(p.holes||[]).forEach(h=>lay.add(dxfLayer(h)));
  e(0,'SECTION');e(2,'TABLES');e(0,'TABLE');e(2,'LAYER');e(70,lay.size);[...lay].forEach((n,i)=>{e(0,'LAYER');e(2,n);e(70,0);e(62,[7,1,3,5,4,6,2][i%7]);e(6,'CONTINUOUS')});e(0,'ENDTAB');e(0,'ENDSEC');
  e(0,'SECTION');e(2,'ENTITIES');
  const pl=(pts,layer)=>{e(0,'POLYLINE');e(8,layer);e(66,1);e(70,1);pts.forEach(([x,y])=>{e(0,'VERTEX');e(8,layer);e(10,f(x));e(20,f(y));e(30,'0.0')});e(0,'SEQEND');e(8,layer)};
  pl(p.poly,'CUT_OUTSIDE');
  (p.holes||[]).forEach(h=>{const ly=dxfLayer(h);if(h.poly){pl(h.poly,ly);return}if(h.len){const dx=h.dir==='h'?h.len/2:0,dy=h.dir==='h'?0:h.len/2;e(0,'LINE');e(8,ly);e(10,f(h.x-dx));e(20,f(h.y-dy));e(30,'0.0');e(11,f(h.x+dx));e(21,f(h.y+dy));e(31,'0.0');return}
    e(0,'CIRCLE');e(8,ly);e(10,f(h.x));e(20,f(h.y));e(30,'0.0');e(40,f((+h.d||5)/2))});
  e(0,'ENDSEC');e(0,'EOF');return L.join('\r\n')+'\r\n'}
function dxfLayer(h){if(h.poly)return 'CUT_INSIDE';const d=Math.round(+h.d||5);if(h.len)return `GROOVE_${d}MM`;return h.dp?`DRILL_D${d}_DEPTH${Math.round(h.dp)}`:`DRILL_D${d}_THROUGH`}
async function exportDXF(){const gs=groupsCache||(groupsCache=groupPanels(bgeo()));if(!gs.length){toast('There are no parts');return}
  const safe=t=>t.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').slice(0,40),files=[];
  const rows=[['Part','Name','Qty','Length × width (mm)','Thickness','Material','Finish','Holes','File']];
  gs.forEach(p=>{const fn=`${p.id}_${safe(p.type)}_x${p.qty}.dxf`;files.push(['parts/'+fn,dxfOf(p)]);rows.push([p.id,p.type+(p.secs.length?' ('+p.secs.join(', ')+')':''),p.qty,`${f0(p.L)} × ${f0(p.Wd)}`,p.t+' mm',(MATS[p.matType]||{}).name||p.matType,(FIN[p.fin]||{}).name||p.fin,(p.holes||[]).length,fn])});
  const txt=['Fitted — DXF files for CNC cutting and drilling','',`Design: ${ui.docName||'Untitled design'} · ${new Date().toLocaleDateString(tr('@date'))}`,'','One file per part, drawn 1:1 in millimetres, seen from the front face, origin at the bottom-left corner.','Layers:','  CUT_OUTSIDE            outline, cut through','  CUT_INSIDE             cut-outs (sockets, cable holes), cut through','  DRILL_D<d>_THROUGH     drill through, diameter d','  DRILL_D<d>_DEPTH<n>    blind hole, diameter d, n mm deep, drilled into the face that ends up inside the cabinet (on doors and drawer fronts: the back face — the Ø35 hinge cups)','  GROOVE_<w>MM           groove centre line, w mm wide','','Grain / length direction: along the first number in "Length × width".','',...rows.map(r=>r.join('\t'))].join('\r\n');
  files.unshift(['README.txt',txt]);
  const blob=new Blob([zipStore(files)],{type:'application/zip'});await saveFile(`${safe(ui.docName||'Fitted')||'Fitted'}-dxf.zip`,blob,'DXF files')}
async function exportTemplates(){const gs=(groupsCache||(groupsCache=groupPanels(bgeo()))).filter(p=>!p.rect),pages=[],M=10,TW=190,TH=277;
  if(!gs.length){toast('There are no shaped parts — every part is a rectangle');return}
  {const pg=a4Page(),x=pg.x;x.font=PF(700,46);x.fillText('Full-size templates',M*MMP,M*MMP);x.font=PF(400,22);x.fillStyle='#333';
    const intro=['Print at 100 % / “actual size” — not “fit to page”. Check the square below with a ruler: it must be exactly 100 mm.','Only the parts of each panel with a sloped or curved edge are printed. Every page shows where it sits on the panel: the X and Y numbers along its edges are millimetres from the panel’s bottom-left corner, the same as in the Shaped parts drawing.','Mark the corner coordinates on the board, line the page up with them, tape it down and trace or prick through along the thick line. The grey side is waste.'];
    let y=M*MMP+80;intro.forEach(t=>{wrapText(x,t,A4W-2*M*MMP).forEach(l=>{x.fillText(l,M*MMP,y);y+=30});y+=12});
    x.strokeStyle='#1D1D1F';x.lineWidth=2;x.strokeRect(M*MMP,y+20,100*MMP,100*MMP);x.font=PF(600,22);x.fillStyle='#1D1D1F';x.fillText('100 × 100 mm',M*MMP+12,y+32);y+=100*MMP+60;
    x.font=PF(600,26);x.fillText('In this file',M*MMP,y);y+=40;x.font=PF(400,21);pg.list=y;pages.push(pg)}
  const toc=[];
  gs.forEach(p=>{const P=p.poly,shaped=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];if(Math.abs(a[0]-b[0])>0.5&&Math.abs(a[1]-b[1])>0.5)shaped.push([a,b])}
    const nx=Math.ceil(p.w/TW),ny=Math.ceil(p.h/TH),tiles=new Set();shaped.forEach(([a,b])=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<=L;t+=5){const u=t/L,px=a[0]+(b[0]-a[0])*u,py=a[1]+(b[1]-a[1])*u;tiles.add(Math.min(nx-1,Math.floor(px/TW))+','+Math.min(ny-1,Math.floor(py/TH)))}});
    const list=[...tiles].map(t=>t.split(',').map(Number)).sort((a,b)=>b[1]-a[1]||a[0]-b[0]);if(!list.length){toc.push(`${p.id} ${p.type} — straight edges only: mark it from the Shaped parts points`);return}toc.push(`${p.id} ${p.type} (${p.qty}×) — ${list.length} page${list.length>1?'s':''}`);
    list.forEach(([cx,cy],ti)=>{const pg=a4Page(),x=pg.x,ox=cx*TW,oy=cy*TH,X=mx=>(M+(mx-ox))*MMP,Y=my=>(M+TH-(my-oy))*MMP;
      // waste side: grey everywhere, then the part in white
      x.fillStyle='#E9E9E9';x.fillRect(M*MMP,M*MMP,TW*MMP,TH*MMP);x.save();x.beginPath();x.rect(M*MMP,M*MMP,TW*MMP,TH*MMP);x.clip();x.beginPath();P.forEach((q,k)=>k?x.lineTo(X(q[0]),Y(q[1])):x.moveTo(X(q[0]),Y(q[1])));x.closePath();x.fillStyle='#fff';x.fill();x.strokeStyle='#000';x.lineWidth=4;x.stroke();
      (p.holes||[]).forEach(h=>{if(h.poly){x.beginPath();h.poly.forEach((q,k)=>k?x.lineTo(X(q[0]),Y(q[1])):x.moveTo(X(q[0]),Y(q[1])));x.closePath();x.lineWidth=3;x.stroke()}else{x.beginPath();x.arc(X(h.x),Y(h.y),h.d/2*MMP,0,7);x.lineWidth=2;x.stroke();x.beginPath();x.moveTo(X(h.x)-8,Y(h.y));x.lineTo(X(h.x)+8,Y(h.y));x.moveTo(X(h.x),Y(h.y)-8);x.lineTo(X(h.x),Y(h.y)+8);x.stroke()}});
      P.forEach((q,k)=>{if(q[0]>=ox-1&&q[0]<=ox+TW+1&&q[1]>=oy-1&&q[1]<=oy+TH+1){x.fillStyle='#000';x.beginPath();x.arc(X(q[0]),Y(q[1]),9,0,7);x.fill();x.fillStyle='#fff';x.font=PF(700,12);x.textAlign='center';x.fillText(String(k+1),X(q[0]),Y(q[1])-6);x.textAlign='left';x.fillStyle='#000';x.font=PM(16);x.fillText(`${r1(q[0])}, ${r1(q[1])}`,X(q[0])+12,Y(q[1])+4)}});
      x.restore();
      // rulers: panel coordinates every 10 mm along the tile edges
      x.strokeStyle='#000';x.lineWidth=1.5;x.fillStyle='#000';x.font=PM(13);
      for(let mm=Math.ceil(ox/10)*10;mm<=ox+TW;mm+=10){const xx=X(mm),big=mm%50===0;x.beginPath();x.moveTo(xx,M*MMP);x.lineTo(xx,M*MMP+(big?24:12));x.moveTo(xx,(M+TH)*MMP);x.lineTo(xx,(M+TH)*MMP-(big?24:12));x.stroke();if(mm%50===0)x.fillText(String(mm),xx+3,M*MMP+26)}
      for(let mm=Math.ceil(oy/10)*10;mm<=oy+TH;mm+=10){const yy=Y(mm),big=mm%50===0;x.beginPath();x.moveTo(M*MMP,yy);x.lineTo(M*MMP+(big?24:12),yy);x.moveTo((M+TW)*MMP,yy);x.lineTo((M+TW)*MMP-(big?24:12),yy);x.stroke();if(mm%50===0)x.fillText(String(mm),M*MMP+28,yy-7)}
      x.lineWidth=1;x.strokeStyle='#999';x.strokeRect(M*MMP,M*MMP,TW*MMP,TH*MMP);
      x.fillStyle='#fff';x.fillRect(0,A4H-M*MMP+2,A4W,M*MMP);x.fillStyle='#1D1D1F';x.font=PF(600,18);x.fillText(`${p.id} ${p.type} · page ${ti+1} of ${list.length} · X ${f0(ox)}–${f0(ox+TW)}, Y ${f0(oy)}–${f0(oy+TH)} mm from the bottom-left corner`,M*MMP,A4H-M*MMP+12);
      pages.push(pg)})});
  {const pg=pages[0],x=pg.x;let y=pg.list;toc.forEach(t=>{x.fillText(t,M*MMP,y);y+=30})}
  await savePdfA4(pages,`${fileBase()}-templates.pdf`,'Templates')}
/* ---------- files: save helper, tiny XLSX writer, cut lists for the panel shops ---------- */
async function saveFile(fn,blob,what){let dl=null;try{if(window.claude&&claude.use)dl=await claude.use('downloads')}catch(e){}
  if(!dl){if(!window.claude){try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);toast(`Saved ${fn}`)}catch(e){toast('Could not save the file here')}return}toast((what||'File')+' ready — saving works in the published Fitted app');return}
  try{await dl.save({filename:fn,data:blob});toast(`Saved ${fn}`)}catch(e){toast(e&&e.code==='declined'?'Not saved':'Could not save the file here')}}
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC_T[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zipStore(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;const u16=v=>[v&255,(v>>8)&255],u32=v=>[v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255];
  files.forEach(([name,data])=>{const nb=enc.encode(name),db=typeof data==='string'?enc.encode(data):data,crc=crc32(db);
    const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0)]);
    parts.push(lh,nb,db);cen.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb);off+=lh.length+nb.length+db.length});
  const cs=cen.reduce((a,b)=>a+b.length,0),end=new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cs),...u32(off),0,0]);return new Blob([...parts,...cen,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
// sheets: [{name, rows:[[cell,...]], widths:[..], bold:Set(rowIndex)}]; a cell is a string or number
function xlsxBlob(sheets){const X=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),col=i=>{let s='';i++;while(i){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
  const ws=sh=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${sh.widths?`<cols>${sh.widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`:''}<sheetData>${sh.rows.map((r,ri)=>`<row r="${ri+1}">${r.map((v,ci)=>v===''||v==null?'':typeof v==='number'?`<c r="${col(ci)}${ri+1}"${sh.bold&&sh.bold.has(ri)?' s="1"':''}><v>${v}</v></c>`:`<c r="${col(ci)}${ri+1}" t="inlineStr"${sh.bold&&sh.bold.has(ri)?' s="1"':''}><is><t xml:space="preserve">${X(v)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
  const files=[['[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sh,i)=>`<sheet name="${X(sh.name.slice(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>'],
    ...sheets.map((sh,i)=>[`xl/worksheets/sheet${i+1}.xml`,ws(sh)])];
  return zipStore(files)}
const SHOP_INFO={hh:{name:'Hanssens Hout',email:'info@hanssenshout.be',phone:'09 250 96 80',web:'hanssenshout.be/nl/maatwerk',how:'Mail this list to Hanssens Hout, or bring it to the shop. They cut on three panel saws and can edge-band (melamine, veneer, ABS) and drill or rout on CNC.'},
  wc:{name:'Woodcenter',email:'info@woodcenter.be',phone:'+32 56 42 42 84',web:'woodcenter.be/maatwerk',addr:'Zuidstraat 7, 8560 Wevelgem',how:'Mail this list to Woodcenter (more than 5 panels) — they work out the sheet layout for free and send a message when it is ready to collect. Edge banding: panels at least 70 × 150 mm.'}};
// edge-band sides for a part: L1/L2 = the two long (length) edges, B1/B2 = the two short (width) edges
function bandSides(p){if(p.band==='none'||(MATS[p.matType]||{}).paint||(MATS[p.matType]||{}).micro)return ['','','',''];if(p.band==='all')return ['x','x','x','x'];
  const bl=p.bandLen||0;return Math.abs(bl-p.L)<=Math.abs(bl-p.Wd)?['x','','','']:['','','x','']}
function shopXlsx(shop){const I=SHOP_INFO[shop],BG=bgeo(),gs=groupsCache||(groupsCache=groupPanels(BG)),nest=nestAll(gs),date=new Date().toLocaleDateString(tr('@date'),{day:'numeric',month:'long',year:'numeric'}),name=ui.docName||'Fitted';
  const head=[[tr('Cut list for')+' '+I.name],[tr('Project'),name],[tr('Date'),date],[tr('Customer'),''],[tr('Phone'),''],[tr('Collect / deliver'),tr('collect')],[tr('Edge band'),tr('1 mm ABS in the colour of the board unless noted (x = this edge gets edge band)')],[tr('Sizes'),tr('finished sizes in mm, edge band included · length = along the grain of the decor')],[]];
  const cols=['No.','Qty','Length (mm)','Width (mm)','Thickness (mm)','Material','Decor / colour','Grain','Edge L1','Edge L2','Edge W1','Edge W2','Part','Note'].map(tr);
  const rows=gs.map(p=>{const f=FIN[p.fin]||{},grain=f.kind&&f.kind!=='plain'&&!f.micro,bs=bandSides(p),opm=[];if(!p.rect)opm.push(tr('shape: cut the rectangle, the slope or shape we trim ourselves following drawing')+' '+p.id);if(p.angled)opm.push(tr('angled cut: see drawing'));if((p.holes||[]).some(h=>h.dp))opm.push(tr('Ø35 hinge cups (CNC if possible)'));
    return [p.id,p.qty,+f0((p.finL||p.L)),+f0((p.finWd||p.Wd)),+p.t,tr(MATS[p.matType]?.name||p.matType),tr(f.name||p.fin),grain?tr('yes (length)'):tr('free'),...bs,tr(p.type),opm.join(' · ')]});
  const sum=[[tr('Boards (Fitted’s estimate — the saw service optimises the layout itself)')],['Material','Decor','Thickness (mm)','Sheet size','Sheets'].map(tr),...nest.filter(n=>n.sheets.length).map(n=>[tr(MATS[n.mt]?.name||n.mt),tr(FIN[n.fin]?.name||n.fin),+n.t,n.sheet.replace('x',' × '),n.sheets.length+(n.over.length?1:0)])];
  const info=[[I.name],[tr('Email'),I.email],[tr('Phone'),I.phone],[tr('Web'),I.web],...(I.addr?[[tr('Address'),I.addr]]:[]),[],[tr(I.how)]];
  return xlsxBlob([{name:tr('Cut list'),rows:[...head,cols,...rows],widths:[7,8,12,12,13,22,24,12,8,8,8,8,28,60],bold:new Set([0,head.length])},{name:tr('Boards'),rows:sum,widths:[24,26,13,16,10],bold:new Set([0,1])},{name:tr('Contact'),rows:info,widths:[14,60],bold:new Set([0])}])}
async function exportShop(shop){const I=SHOP_INFO[shop];if(!I)return;const base=(ui.docName||'Fitted').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'Fitted',form=typeof SHOP_FORMS!=='undefined'&&SHOP_FORMS&&SHOP_FORMS[shop]&&typeof DecompressionStream!=='undefined';
  const fn=form?`${base}-${shop==='hh'?'HanssensHout-invulblad-zaagwerk':'Woodcenter-houtlijst'}.xlsx`:`${base}-cut-list-${I.name.replace(/\s+/g,'')}.xlsx`;let blob;try{blob=form?await shopFormXlsx(shop):shopXlsx(shop)}catch(e){console.error(e);blob=shopXlsx(shop)}await saveFile(fn,blob,'Cut list')}
function shopMail(shop){const I=SHOP_INFO[shop],gs=groupsCache||(groupsCache=groupPanels(bgeo())),n=gs.reduce((a,p)=>a+p.qty,0);return tr('@mail',{shop:I.name,n,kinds:gs.length,project:ui.docName||'Fitted',band:gs.some(p=>p.band!=='none')})}
/* ===== brief for a cabinet maker ===== */
function briefData(G){const R=S.room,M=S.mat,fin=k=>tr((FIN[k]||{}).name||k),mat=m=>`${tr((MATS[m.type]||{}).name||m.type)} ${m.t} mm, ${fin(m.fin)}`,qs=G.secs.filter(q=>!q.panel&&!q.door);
  const doors=G.fronts.filter(f=>f.kind==='door').length,drawers=G.fronts.filter(f=>f.kind==='drawer').length,sl=(R.ceil||[]).some(c=>Math.abs(c.y-R.H)>5);
  const rows=(lastPrice&&lastPrice.rows||[]).filter(r=>r.grp==='Hardware').map(r=>`${f0(r.qty)} × ${tr(r.name)}`);
  const A=accRoute(R.access),AK={door:tr('doorway'),stairs:tr('stairs'),hatch:tr('hatch')},T=tr;
  return [[T('The room'),[T('@b.wall',{W:f0(R.W),H:f0(R.H),D:f0(R.D)}),sl?T('@b.slope',{pts:R.ceil.map(c=>`${f0(c.x)} → ${f0(c.y)}`).join(', ')}):T('Flat ceiling.'),...(R.beams||[]).map((b,i)=>T('@b.beam',{i:i+1,x:f0(b.x),w:f0(b.w),y:f0(b.bottom)})),R.lvl&&R.lvl.on?T('@b.level',{f:(R.lvl.fR>0?'+':'')+f0(+R.lvl.fR||0),l:f0(+R.lvl.wL||0),r:f0(+R.lvl.wR||0)}):'',(R.wobs||[]).length?T('@b.wobs',{n:R.wobs.length}):'',A.length?T('Access:')+' '+A.map(o=>`${AK[o.kind]} ${f0(o.w)} × ${f0(o.h)} mm${o.kind==='stairs'&&o.turn&&o.turn!=='none'?', '+T(o.turn==='half'?'half turn':'quarter turn'):''}`).join('; ')+'.':''].filter(Boolean)],
    [T('The cabinet'),[T('@b.cols',{n:qs.length,ws:qs.map(q=>f0(q.w)).join(' / ')}),T('@b.fronts',{d:doors,r:drawers}),T('@b.build',{how:T(S.opts.construct==='boxes'?'separate boxes (carcasses) side by side':'shared partitions running through'),p:f0(+S.skirt.plinth)}),T('Handles:')+' '+T(((HANDLES.find(h=>h[0]===S.opts.handle)||[])[1])||S.opts.handle||'—')+'.',S.opts.innerLight?T('LED lighting inside the cupboards.'):''].filter(Boolean)],
    [T('Materials'),[`${T('Carcass:')} ${mat(M.carcass)}.`,`${T('Fronts (doors, drawers):')} ${mat(M.front)}.`,`${T('Shelves:')} ${mat(M.shelf)}.`,`${T('Back:')} ${mat(M.back)}.`,`${T('Closing strips:')} ${mat(M.skirt)}.`,M.desk&&qs.some(q=>q.desk)?`${T('Desk top:')} ${mat(M.desk)}.`:''].filter(Boolean)],
    [T('Hardware (as drawn, equivalent is fine)'),rows.length?rows.slice(0,14):[T('See the drawings.')]],
    [T('Please quote for'),[T('Supply and fitting, everything included (VAT shown separately).'),T('A price per option if something else is better or cheaper.'),T('Lead time, and when you can come and measure.'),T('All sizes are in mm and for guidance — please measure on site.')]],
    [T('Contact'),[T('Name:')+' ……………………………………………',T('Phone:')+' ……………………………………………',T('Email:')+' ……………………………………………',T('Address:')+' ……………………………………………']]]}
async function exportPdf(){
  const sec=ui.pdfSec||PDF_PRE.full[1],bar=document.getElementById('pdfbar'),stEl=document.getElementById('pdfst'),goB=document.getElementById('pdfgo');ui.pdfCancel=false;if(bar)bar.hidden=false;if(goB){goB.disabled=true;goB.textContent='Working…';const c_=document.getElementById('pdfcl');if(c_)c_.textContent='Stop'}
  const jp=[];let lastY=0;const flush=async all=>{for(let i=0;i<pages.length;i++){const p=pages[i];if(p.done||(!all&&(p===tocPg||i===pages.length-1)))continue;pageFooter(p,i,name,date);p.done=true;jp[i]=await toJpeg(p.c);p.c.width=p.c.height=1}};
  const prog=async(f,t)=>{if(bar)bar.firstElementChild.style.width=Math.round(f*100)+'%';if(stEl)stEl.textContent=t+(pages.length?` · ${pages.length} pages so far`:'');await flush(false);if(performance.now()-lastY>40){await new Promise(r=>setTimeout(r,0));lastY=performance.now()}if(ui.pdfCancel)throw new Error('cancelled')};
  if(!bar)toast('Making the PDF…');await new Promise(r=>setTimeout(r,30));
  PDFSEC=[];let tocPg=null;const G=geo,name=(ui.docName||'Fitted design').slice(0,60),pages=[];let pn=0;const date=new Date().toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'});
  const BG=bgeo(),gs=groupsCache||(groupsCache=groupPanels(BG)),H=BG.H,total=gs.reduce((a,p)=>a+p.qty,0),nest=nestAll(gs),sp=stockPlan(gs);
  // 1 cover
  {const pg=newPage(),x=pg.x,LW=560;x.fillStyle=PINK;x.fillRect(0,0,LW,PDFH);x.fillStyle=PACC;x.fillRect(0,0,LW,10);
    x.fillStyle='#fff';x.font=PF(400,84);x.fillText('Fitted',64,70);x.font=PF(600,15);x.fillStyle='#9AA3F0';x.fillText('by BRUIS',68,158);x.fillStyle='#fff';x.font=PF(600,13);x.fillStyle='#9AA3F0';x.fillText('BUILD PACK · DRAWINGS · CUT LIST · GUIDE',66,190);
    x.fillStyle='#fff';x.font=PF(600,34);wrapText(x,name,LW-128).slice(0,2).forEach((l,i)=>x.fillText(l,64,232+i*42));x.font=PF(400,18);x.fillStyle='#B8B8B4';x.fillText(date+(BG.partial?' · partial build: '+partLabel().toLowerCase():''),64,326);
    const st=[[f0(G.W)+' mm','wall width'],[BG.partial?BG.partial.length+' of '+G.secs.length:String(G.secs.length),'columns'],[String(total),'parts'],[nest.reduce((a,n)=>a+n.sheets.length,0)+(sp.groups.length?` + ${sp.groups.reduce((a,g)=>a+g.bars.length,0)}`:''),sp.groups.length?'sheets + boards':'sheets'],[String(G.fronts.length),'doors & drawers']];{renderCut();if(lastPrice)st.push([eur(lastPrice.tot.all),'estimated price, incl. VAT'])}
    x.fillStyle='#3A3A3E';x.fillRect(64,390,LW-128,1);st.forEach(([v,l],i)=>{const cx=64+(i%2)*((LW-128)/2),cy=424+Math.floor(i/2)*150;x.fillStyle='#fff';x.font=PF(600,42);x.fillText(v,cx,cy);x.font=PF(400,17);x.fillStyle='#B8B8B4';x.fillText(l,cx,cy+54)});
    x.font=PF(400,14);x.fillStyle='#8A8A86';x.fillText('Made with Fitted by BRUIS '+APP_VERSION+' — built-in wardrobes & cabinets, drawn and cut.',64,PDFH-60);
    x.fillStyle='#F6F5F1';x.fillRect(LW,0,PDFW-LW,PDFH);x.fillStyle=PACC;x.font=PF(600,13);x.fillText('FRONT ELEVATION',LW+60,70);x.fillStyle='#777';x.font=PF(400,15);x.fillText(`${f0(G.W)} mm wall · ${G.secs.length} columns`,LW+60,92);
    await fitImage(pg,elevSVG(S,G,{mini:true,props:true}),LW+50,170,PDFW-LW-100,PDFH-330);x.fillStyle=PINK;pages.push(pg)}
  tocPg=newPage();pageFrame(tocPg,'Contents',++pn+1,name);pages.push(tocPg);await prog(0.05,'Cover done');
  if(sec.brief){const pg=newPage();pageFrame(pg,tr('Request for a quote — built-in cabinet'),++pn+1,name);const x=pg.x,B=briefData(G),colW=(PDFW-140-60)/2;let col=0,y=130;const X0=[70,70+colW+60];
    x.fillStyle='#555';x.font=PF(400,17);wrapText(x,tr('Hello — we are looking for a cabinet maker for this built-in cabinet. Below is what we would like; the drawings are on the following pages.'),PDFW-140).forEach(l=>{x.fillText(l,70,y);y+=24});y+=16;const y0=y;
    B.forEach(([h,ls])=>{const need=34+ls.length*44;if(y+need>PDFH-110&&col===0){col=1;y=y0}x.fillStyle=PACC;x.font=PF(600,14);x.fillText(h.toUpperCase(),X0[col],y);y+=26;x.fillStyle='#1D1D1F';x.font=PF(400,16);ls.forEach(t=>{wrapText(x,t,colW).forEach(l=>{if(y<PDFH-100){x.fillText(l,X0[col],y);y+=22}});y+=4});y+=18});
    pages.push(pg);await prog(0.08,'Brief done')}
  // 2 elevation
  if(sec.elev){const pg=newPage();pageFrame(pg,'Front drawing',++pn+1,name);await fitImage(pg,elevSVG(S,G,{props:ui.props}),70,120,PDFW-140,PDFH-270);if(G.warns.length){const x=pg.x;x.fillStyle='#FBF3EC';x.fillRect(70,PDFH-136,PDFW-140,74);x.fillStyle='#A0522D';x.fillRect(70,PDFH-136,4,74);x.font=PF(600,13);x.fillText('DESIGN NOTES',88,PDFH-128);x.font=PF(400,15);wrapText(x,G.warns.join(' · '),PDFW-190).slice(0,2).forEach((l,i)=>x.fillText(l,88,PDFH-108+i*20));x.fillStyle=PINK}pages.push(pg)}
  if(sec.room){let shots=[];try{shots=await photoShots()}catch(e){}shots.forEach((cv,i)=>{const pg=newPage();pageFrame(pg,shots.length>1?`In your room — view ${i+1}`:'In your room',++pn+1,name);const X=70,Y=120,Wd=PDFW-140,Hh=PDFH-230,r=Math.min(Wd/cv.width,Hh/cv.height),w=cv.width*r,h=cv.height*r;pg.x.drawImage(cv,X+(Wd-w)/2,Y,w,h);pg.x.font=PF(400,14);pg.x.fillStyle='#8A8A86';pg.x.fillText('The design drawn into your own photo. Light and position are estimated from the picture.',X,Y+h+26);pg.x.fillStyle=PINK;pages.push(pg)})}
  await prog(0.1,'Elevation done');
  // 3 cut list
  if(sec.cut){const cols=[['#',60],['Part',300],['Qty',60],['Length',100],['Width',100],['Material',300],['Where',220],['Notes',474]];let pg=null,y=0;const rowH=26;
    const head=(plain)=>{pg=newPage();pageFrame(pg,'Cut list',++pn+1,name);y=124;const x=pg.x;if(plain!==true){x.fillStyle='#EFEEEA';x.fillRect(70,y-10,PDFW-140,34);x.fillStyle=PINK;x.font=PF(600,15);let cx=80;cols.forEach(([t,w])=>{x.fillText(t.toUpperCase(),cx,y);cx+=w});y+=40}else x.fillStyle=PINK;pages.push(pg)};head();let zr_=0;
    gs.forEach(p=>{const x=pg.x;x.font=PF(400,16);const sf=stockFor(p,sp.cfg);const note=(sf?`From ${sf.W}×${sp.cfg.L} board${sf.rip?`, rip ${sf.rip}`:''}. `:'')+p.notes.join(' · ')+(p.band!=='none'&&!sf?` ${bandTxt(p)}.`:'');
      x.font=PF(400,14);const nl=wrapText(x,note,cols[7][1]-20),vals=[p.id,p.type,String(p.qty),f0(p.L),f0(p.Wd),matName(p),p.secs.join(', ')],vfont=k=>k===0||k>=2&&k<=4?PM(15):PF(400,16),vl=vals.map((v,k)=>{x.font=vfont(k);const w_=wrapText(x,v,cols[k][1]-12);return w_.length?w_:['']}),h=Math.max(1,nl.length,...vl.map(a=>a.length))*20+8;if(y+h>PDFH-70)head();
      {const x=pg.x;if(zr_++%2){x.fillStyle='#F8F8F5';x.fillRect(70,y-6,PDFW-140,h);x.fillStyle=PINK}let cx=80;vals.forEach((v,k)=>{x.font=vfont(k);vl[k].forEach((t,i)=>x.fillText(t,cx,y+i*19));cx+=cols[k][1]});x.font=PF(400,14);x.fillStyle='#555';nl.forEach((l,i)=>x.fillText(l,cx,y+i*19));x.fillStyle='#E5E5E5';x.fillRect(70,y+h-4,PDFW-140,1);x.fillStyle='#1D1D1F';y+=h}});
    // hardware
    const rows=[...document.createRange().createContextualFragment(`<div>${(()=>{renderCut();return document.getElementById('v-cut').innerHTML})()}</div>`).querySelectorAll('table.hwt')].pop();
    if(rows){if(y+200>PDFH-60)head(true);const x=pg.x;y+=24;x.font=PF(600,24);x.fillText('Hardware',70,y);y+=40;[...rows.querySelectorAll('tbody tr')].forEach(tr=>{const td=[...tr.children].map(t=>t.textContent.trim());x.font=PF(400,16);const nl=wrapText(x,td[2]||'',740),n0=wrapText(x,td[0]||'',680);const h=Math.max(1,nl.length,n0.length)*20+8;if(y+h>PDFH-60){head(true)}const X=pg.x;X.font=PF(400,16);n0.forEach((l,i)=>X.fillText(l,70,y+i*19));X.font=PM(15);X.fillText(td[1]||'',760,y);X.font=PF(400,14);X.fillStyle='#555';nl.forEach((l,i)=>X.fillText(l,860,y+i*19));X.fillStyle='#1D1D1F';y+=h})}}
  await prog(0.16,'Cut list done');
  // 3a price estimate
  if(sec.price&&lastPrice){const P=lastPrice;let pg=null,y=0,x=null;const C=[70,900,1060,1250,1420],head=first=>{pg=newPage();pageFrame(pg,'Estimated price',++pn+1,name);pages.push(pg);x=pg.x;y=120;
      if(first){x.fillStyle='#F6F5F1';x.fillRect(70,y-10,PDFW-140,136);x.fillStyle=PACC;x.fillRect(70,y-10,6,136);x.fillStyle=PINK;y+=6;x.font=PF(600,54);x.fillText(eur(P.tot.all),100,y);x.font=PF(400,18);x.fillStyle='#666';x.fillText('boards, finishing and hardware · incl. 21 % VAT · Belgium',100,y+66);x.font=PF(400,18);x.fillText(`${eur(P.tot.sheets)} boards   ·   ${eur(P.tot.fin)} edge band & paint   ·   ${eur(P.tot.hw)} hardware`,100,y+92);x.fillStyle='#1D1D1F';y+=150;
        x.font=PF(400,15);x.fillStyle='#555';wrapText(x,`Board prices looked up at ${Object.values(SHOPS).join(' and ')} (the Source column shows which shop each board is priced at); hardware at Pierard, Hornbach, Gamma, Hubo and two Blum webshops. Looked up on ${PRICE_DATE}. Lines marked “typical” (${eur(P.tot.est)} of the total) are normal trade prices that were not looked up; lines marked “your price” were typed in by you. Not included: sawing or edge-banding service, tools, TV, speakers and other equipment.`,PDFW-140).forEach(l=>{x.fillText(l,70,y);y+=21});x.fillStyle='#1D1D1F';{const MK=makerEstimate();if(MK){y+=6;x.font=PF(600,16);x.fillText(`Cabinet maker, fitted: ${eurK(MK.lo)} – ${eurK(MK.hi)} incl. 21 % VAT`,70,y);y+=24;x.font=PF(400,14);x.fillStyle='#555';wrapText(x,`Rough guide, not a quote: ${MK.parts.join(' · ')}. From Belgian price guides for fitted made-to-measure cabinets (DM-Line, Bobex). Building it yourself is about ${eurK((MK.lo+MK.hi)/2-P.tot.all)} less than the middle of that range, before your own hours, tools and delivery.`,PDFW-140).forEach(l=>{x.fillText(l,70,y);y+=20});x.fillStyle='#1D1D1F'}}y+=16}
      x.fillStyle='#EFEEEA';x.fillRect(70,y-10,PDFW-140,34);x.fillStyle=PINK;x.font=PF(600,15);['ITEM','QTY','PRICE EACH','TOTAL','SOURCE'].forEach((t,i)=>x.fillText(t,C[i]+(i?0:10),y));y+=40};head(true);let last='';
    P.rows.forEach(r=>{if(y>PDFH-90)head(false);if(r.grp!==last){last=r.grp;y+=10;x.font=PF(600,13);x.fillStyle=PACC;x.fillText(r.grp.toUpperCase(),80,y);x.fillStyle=PINK;y+=26}
      x.font=PF(400,15);const nm_=wrapText(x,r.name,C[1]-C[0]-30);nm_.forEach((l,i)=>x.fillText(l,C[0]+10,y+i*18));const ex_=Math.max(0,nm_.length-1)*18;x.font=PM(14);x.fillText(`${r.unitLbl==='pc'||r.unitLbl==='sheet'||r.unitLbl==='board'?r.qty:(+r.qty).toFixed(r.unitLbl==='m'?1:2)}${r.unitLbl==='pc'?'':' '+r.unitLbl}`,C[1],y);x.fillText(r.unit!=null?'€ '+r.unit.toFixed(2):'—',C[2],y);x.fillText(r.total!=null?eur(r.total):'—',C[3],y);x.font=PF(400,14);x.fillStyle='#666';x.fillText(r.mine?'your price':r.est?'typical':r.src,C[4],y);x.fillStyle='#E5E5E5';x.fillRect(70,y+20+ex_,PDFW-140,1);x.fillStyle='#1D1D1F';y+=27+ex_})}
  // 3b lofting: every shaped, drilled or angled panel, drawn large
  await prog(0.2,'Price done');
  if(sec.loft){const lp=gs.filter(p=>!p.rect||p.holes.length);for(let i=0;i<lp.length;i+=2){await prog(0.2+0.18*i/Math.max(1,lp.length),'Drawing shaped parts');const pg=newPage();pageFrame(pg,'Shaped and drilled parts',++pn+1,name);
      for(let j=0;j<2&&i+j<lp.length;j++){const p=lp[i+j],Wc=(PDFW-140)/2-30,X0=70+j*(Wc+60),x=pg.x;x.font=PF(600,24);x.fillText(`${p.id} · ${p.type}`,X0,116);x.font=PF(400,16);x.fillStyle='#666';x.fillText(wrapText(x,`${p.qty}× · ${p.t} mm · ${FIN[p.fin]?.name||''} · ${p.secs.join(', ')} · box ${f0(p.w)} × ${f0(p.h)} mm`,Wc)[0]||'',X0,150);x.fillStyle='#1D1D1F';
        const h=await fitImage(pg,loftSVG(p),X0,186,Wc,770);let y=186+h+22;
        if(!(p.rect&&!p.holes.length)&&p.poly.length<=24){x.font=PF(600,14);x.fillText('Points (X, Y in mm from the bottom-left corner)',X0,y);y+=22;x.font=PM(14);p.poly.forEach((q,k)=>{if(y+Math.floor(k/4)*20<PDFH-120)x.fillText(`${k+1}: ${q[0].toFixed(1)}, ${q[1].toFixed(1)}`,X0+(k%4)*(Wc/4),y+Math.floor(k/4)*20)});y+=Math.ceil(p.poly.length/4)*20+8}
        x.font=PF(400,14);x.fillStyle='#555';wrapText(x,p.notes.join(' · '),Wc).slice(0,Math.max(0,Math.floor((PDFH-60-y)/19))).forEach((l,k)=>x.fillText(l,X0,y+k*19));x.fillStyle='#1D1D1F'}
      if(lp.length-i>1){pg.x.fillStyle='#DDD';pg.x.fillRect(PDFW/2,116,1,PDFH-190);pg.x.fillStyle='#1D1D1F'}pages.push(pg)}}
  // 4 build guide (from the rendered guide)
  await prog(0.38,'Lofting done');
  if(sec.guide){renderGuide();const gd=document.getElementById('v-guide');let pg=null,y=0;const np=t=>{pg=newPage();pageFrame(pg,t||'Build guide',++pn+1,name);y=120;pages.push(pg)};np();
    const blocks=[...gd.querySelectorAll('.guide > *')];
    let bi_=0;for(const b of blocks){await prog(0.38+0.57*(bi_++)/Math.max(1,blocks.length),'Build guide');if(b.classList.contains('gchap')){if(y>PDFH*0.55)np();const x=pg.x;y+=14;x.fillStyle='#F6F5F1';x.fillRect(70,y-12,PDFW-140,84);x.fillStyle=PACC;x.fillRect(70,y-12,6,84);x.fillStyle=PINK;x.font=PF(600,28);x.fillText(b.querySelector('b').textContent,96,y);x.font=PF(400,17);x.fillStyle='#666';x.fillText(b.querySelector('span')?.textContent||'',96,y+38);x.fillStyle='#1D1D1F';y+=100;continue}
      if(b.classList.contains('gparts')){continue}
      const num=b.querySelector('.gnum')?.textContent||'',title=b.querySelector('h4')?.textContent||'';
      const svgs=[...b.querySelectorAll('.gbody > .gfig svg, .gsub > svg, .gframe svg, .gsheetwrap svg, .gdone svg')].filter(v=>!v.classList.contains('gico'));
      const tools=[...b.querySelectorAll('.gtools small')].map(t=>t.textContent);
      const texts=[];if(tools.length)texts.push('Tools: '+tools.join(' · '));b.querySelectorAll('.gtxt, .gsub > p, .gframe > p, .gwarn span').forEach(t=>{const c=t.cloneNode(true);const lists=[...c.querySelectorAll('details')];lists.forEach(d=>d.remove());c.querySelectorAll('.gkey').forEach(k=>k.remove());const main=c.textContent.replace(/\s+/g,' ').trim();if(main)texts.push(main);
        [...t.querySelectorAll('details')].forEach(d=>{texts.push('§'+(d.querySelector('summary')?.textContent||''));[...d.querySelectorAll('li')].forEach((li,k)=>texts.push(`  ${k+1}. ${li.textContent.replace(/\s+/g,' ').trim()}`))})});
      const chips=[...b.querySelectorAll('.gchips > span')].map(c=>c.textContent.replace(/\s+/g,' ').trim());
      if(y>PDFH-360)np();let x=pg.x;
      x.fillStyle=PINK;x.beginPath();x.arc(96,y+24,26,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.font=PF(700,26);x.textAlign='center';x.fillText(num,96,y+10);x.textAlign='left';x.fillStyle=PINK;x.font=PF(600,24);x.fillText(title,140,y+10);y+=68;
      // images in a row (wrap to next rows)
      const comics=svgs.filter(v=>v.closest('.gcomic')),tech=svgs.filter(v=>!v.closest('.gcomic')),frames=tech.length>2&&tech.every(v=>v.closest('.gframe'));
      if(tech.length){const per=tech.length===1?1:frames?3:2,cw=(PDFW-210)/per,ch=per===1?640:frames?400:520;let col=0,rowMax=0;
        for(const sv of tech){if(y+ch>PDFH-80){np();x=pg.x}const h=await fitImage(pg,sv.outerHTML,140+col*cw,y,cw-20,ch);rowMax=Math.max(rowMax,h);col++;if(col>=per){col=0;y+=rowMax+16;rowMax=0}}if(col)y+=rowMax+16}
      if(sec.toons)for(const sv of comics){if(y+250>PDFH-80){np();x=pg.x}const h=await fitImage(pg,sv.outerHTML,140,y,560,250);y+=h+16}
      if(chips.length){x=pg.x;x.font=PM(15);let cx=140;chips.forEach(c=>{const w=x.measureText(c).width+24;if(cx+w>PDFW-70){cx=140;y+=34}x.strokeStyle='#1D1D1F';x.lineWidth=1.5;x.strokeRect(cx,y-4,w,28);x.fillText(c,cx+12,y+2);cx+=w+8});y+=42}
      x=pg.x;for(const t0 of texts){const head_=t0.startsWith('§'),li=t0.startsWith('  '),t=head_?t0.slice(1):t0.trim();x.font=head_?PF(600,18):PF(400,li?15:17);const ls=wrapText(x,t,PDFW-(li?260:230));for(const l of ls){if(y>PDFH-70){np();x=pg.x;x.font=head_?PF(600,18):PF(400,li?15:17)}x.fillText(l,li?170:140,y);y+=li?20:24}y+=li?2:8}
      y+=18;x.fillStyle='#DDD';x.fillRect(140,y-10,PDFW-210,1);x.fillStyle='#1D1D1F'}}
  // contents page
  {const x=tocPg.x,DESC={'Elevation':'Front view with every column and its width','Cut list':'Every panel with its finished size, plus the hardware list','Estimated price':'Boards, finishing and hardware, incl. VAT','Shaped and drilled parts':'Large dimensioned drawings with point coordinates','Build guide':'Step by step: cutting plans, drilling, assembly and fitting'};let y=150;
    PDFSEC.filter(q=>q.t!=='Contents').forEach((q,i)=>{x.fillStyle=PACC;x.font=PF(600,15);x.fillText(String(i+1).padStart(2,'0'),70,y+6);x.fillStyle=PINK;x.font=PF(600,26);x.fillText(q.t,120,y);const tw=x.measureText(q.t).width;x.font=PF(400,16);x.fillStyle='#777';x.fillText(DESC[q.t]||'',120,y+38);x.font=PM(22);x.fillStyle=PINK;x.textAlign='right';x.fillText(String(q.n),PDFW-70,y+2);x.textAlign='left';x.fillStyle='#CFCFCB';for(let dx=120+tw+18;dx<PDFW-130;dx+=10)x.fillRect(dx,y+22,2,2);x.fillStyle='#E5E5E1';x.fillRect(70,y+72,PDFW-140,1);y+=96});
    y+=10;x.fillStyle='#F6F5F1';x.fillRect(70,y,PDFW-140,150);x.fillStyle=PACC;x.fillRect(70,y,6,150);x.fillStyle=PACC;x.font=PF(600,13);x.fillText('PROJECT',100,y+22);x.fillStyle=PINK;x.font=PF(600,24);x.fillText(name,100,y+46);
    const M=S.mat,facts=[['Wall',f0(G.W)+' mm'],['Columns',String(G.secs.length)],['Construction',S.opts.construct==='boxes'?'Separate boxes':'Shared sides'],['Fronts',FIN[M.front.fin]?.name||''],['Carcass',FIN[M.carcass.fin]?.name||''],['Date',date]];facts.forEach(([l,v],i)=>{const cx=100+i*((PDFW-200)/facts.length);x.font=PF(400,13);x.fillStyle='#777';x.fillText(l.toUpperCase(),cx,y+92);x.font=PF(600,16);x.fillStyle=PINK;x.fillText(wrapText(x,v,(PDFW-200)/facts.length-16)[0]||'',cx,y+112)})}
  await prog(0.97,'Packing pages');await flush(true);if(bar)bar.firstElementChild.style.width='100%';
  // write
  const pdf=buildPdf(jp);window.__lastPdf=pdf;
  const fn=(name.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'kast')+'.pdf';
  let dl=null;try{if(window.claude&&claude.use)dl=await claude.use('downloads')}catch(e){}
  if(!dl){if(!window.claude){try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));a.download=fn;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);toast(`Saved ${fn} · ${pages.length} pages`)}catch(e){toast('Could not save the PDF here')}return}toast('PDF ready — saving works in the published Fitted app');return}
  try{await dl.save({filename:fn,data:new Blob([pdf],{type:'application/pdf'})});toast(`Saved ${fn} · ${pages.length} pages`)}catch(e){toast(e&&e.code==='declined'?'Not saved':'Could not save the PDF here')}}

