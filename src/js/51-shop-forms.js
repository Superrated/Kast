/* ==== 51-shop-forms.js ====
   The panel shops' OWN order forms, filled in by Fitted:
     hh  Hanssens Hout — "invulblad zaagwerk" (sheet Invulblad + Persoonlijke gegevens)
     wc  Woodcenter    — "houtlijst" (sheet Houtlijst)
   The real forms live in templates/ and are packed into the page by build.py (SHOP_FORMS).
   Fitted only writes values into their cells, so the shop gets exactly the file it knows:
   same columns, drop-down lists, layout and pictures.
   Your name / address / phone for the forms are kept on this device (localStorage 'fitted-me').
*/
const SHOP_FORMS=/*@FORMS@*/null;
const ME_F=[['name','Name'],['company','Company (optional)'],['street','Street'],['nr','House number'],['zip','Postcode'],['city','Town'],['country','Country'],['email','Email'],['phone','Phone']];
let ME={country:'België'};try{Object.assign(ME,JSON.parse(localStorage.getItem('fitted-me')||'{}'))}catch(e){}
let SHOP_DRILL=true;try{SHOP_DRILL=localStorage.getItem('fitted-shopdrill')!=='0'}catch(e){}
function meSave(){try{localStorage.setItem('fitted-me',JSON.stringify(ME));localStorage.setItem('fitted-shopdrill',SHOP_DRILL?'1':'0')}catch(e){}}
document.addEventListener('input',e=>{const el=e.target;if(!el||!el.dataset||el.dataset.me==null)return;ME[el.dataset.me]=el.value.slice(0,120);meSave()});
document.addEventListener('change',e=>{const el=e.target;if(!el||!el.dataset||el.dataset.shopdrill==null)return;SHOP_DRILL=!!el.checked;meSave()});
/* the "have it cut" options shown under the shop buttons */
function shopFormHTML(){const filled=ME_F.filter(([k])=>k!=='country'&&ME[k]).length;
  return `<div class="sfopts"><label class="sfchk"><input type="checkbox" data-shopdrill ${SHOP_DRILL?'checked':''}> Let the shop drill the hinge cups and shelf-pin rows (costs extra; untick to drill them yourself)</label>
  <details class="sfme"${ui.meOpen?' open':''}><summary>Your details on the forms <small>${filled?filled+' filled in':'not filled in yet'}</small></summary><p class="hintp">Kept on this device only. They go in the name / address boxes of the shop's form, so you don't have to type them each time.</p>
  <div class="sfgrid">${ME_F.map(([k,l])=>`<label><span>${l}</span><input type="${k==='email'?'email':k==='phone'?'tel':'text'}" data-me="${k}" value="${esc(ME[k]||'')}" autocomplete="${{name:'name',company:'organization',street:'address-line1',zip:'postal-code',city:'address-level2',country:'country-name',email:'email',phone:'tel'}[k]||'off'}"></label>`).join('')}</div></details></div>`}
/* ---------- what goes in the cells ---------- */
const SF_R=v=>Math.round(v*10)/10;
const SF_NEAR=(t,list)=>list.reduce((a,b)=>Math.abs(b-t)<Math.abs(a-t)?b:a);
function sfWhite(k){const f=FIN[k]||{};return /^ral90(10|16|03)$/.test(k)||/^(pure |snow |signal |traffic |plain )?(white|wit)$/i.test((f.name||'').replace(/^RAL \d+ /,''))}
function sfDecor(p){const f=FIN[p.fin]||{};return f.name?tr(f.name):String(p.fin||'')}
/* Hanssens Hout material code (their list on the hidden sheet Blad2); custom or unusual boards are written in words */
function hhMat(p){const t=+p.t,mt=p.matType,m=MATS[mt]||{},has=(c,l)=>l.includes(t)?c+t:'';
  if(/^cm_/.test(mt))return `${m.name||mt} ${t} mm`;
  if(mt==='melamine'||(mt==='hdf'&&t===8)){const w=sfWhite(p.fin);return (!w&&[8,18,28].includes(t)?`MEL${t}KLEUR`:has('MEL',[8,10,12,16,18,22,28]))||`Melamine ${sfDecor(p)} ${t} mm`}
  if(mt==='mdfpaint'||mt==='mdfmicro')return has('MDF',[6,9,12,16,18,22,30,38])||`MDF ${t} mm`;
  if(mt==='veneer')return p.fin==='oak'&&t===19?'MDF19EIK':`MDF ${t} mm + fineer ${sfDecor(p)}`;
  if(mt==='ply')return has('BER',[4,6,9,12,15,18])||`Berken multiplex ${t} mm`;
  if(mt==='solid')return p.fin==='oak'&&t>=18&&t<=21?'EIK19':`Massief ${sfDecor(p)} ${t} mm`;
  if(mt==='hdf')return t<=4?(sfWhite(p.fin)?'UNA3WIT':'UNA3S'):(has('MDF',[6,9,12])||`HDF ${t} mm`);
  if(mt==='hpl')return `HPL ${sfDecor(p)} op MDF ${t} mm`;
  return `${m.name||mt} ${t} mm`}
/* the edge band the shop puts on, in each shop's own words; '' = none */
function sfBand(p,shop){const mt=p.matType,m=MATS[mt]||{};if(m.paint||m.micro||mt==='ply'||mt==='solid')return '';
  const vene=mt==='veneer'||(/^cm_/.test(mt)&&/fineer|veneer/i.test(m.name||'')),hpl=mt==='hpl';
  return shop==='hh'?(vene?'FINEER':hpl?'HPL':'ABS1'):(vene?'Fineer_0.7':hpl?'Laminaat_0.8':'PVC_1')}
/* what the shop machines: hinge cups, shelf-pin rows, shapes, angled cuts */
function sfWork(p){const H=(p.holes||[]).filter(h=>!h.poly),cups=H.filter(h=>mdHoleKind(h)==='cup').length,pins0=H.filter(h=>mdHoleKind(h)==='blind'&&(+h.d||5)<=5.5),pins=pins0.length>=6?pins0:[];
  const faces=new Set(pins.map(h=>/left|links/i.test(h.face||'')?'L':/right|rechts/i.test(h.face||'')?'R':(h.face||'a')));
  return {cups,pins:pins.length,two:faces.size>1,shape:!p.rect,angled:!!p.angled}}
function sfParts(){const gs=groupsCache||(groupsCache=groupPanels(bgeo()));return gs}
function sfDate(){const d=new Date(),z=n=>String(n).padStart(2,'0');return `${z(d.getDate())}-${z(d.getMonth()+1)}-${d.getFullYear()}`}
/* ---------- tiny XML cell writer ---------- */
const sfX=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function sfCell(ref,v,s){const st=s!=null&&s!==''?` s="${s}"`:'';if(v===''||v==null)return `<c r="${ref}"${st}/>`;
  return typeof v==='number'?`<c r="${ref}"${st}><v>${v}</v></c>`:`<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${sfX(v)}</t></is></c>`}
/* put a value in an existing cell of a sheet's XML, keeping its style */
function sfSet(xml,ref,v){const re=new RegExp(`<c r="${ref}"((?: [a-z]+="[^"]*")*)\\s*(?:/>|>.*?</c>)`);const m=xml.match(re);
  if(!m)return xml;const s=(m[1].match(/ s="(\d+)"/)||[])[1];return xml.replace(re,()=>sfCell(ref,v,s))}
function sfB64(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
/* unpack a form (a zip): read the central directory, inflate each part with the browser's own DecompressionStream */
async function sfFiles(shop){const u=sfB64(SHOP_FORMS[shop]),dv=new DataView(u.buffer),dec=new TextDecoder();let e=u.length-22;while(e>0&&dv.getUint32(e,true)!==0x06054b50)e--;
  const n=dv.getUint16(e+10,true);let o=dv.getUint32(e+16,true);const out=[];
  for(let i=0;i<n;i++){const meth=dv.getUint16(o+10,true),cs=dv.getUint32(o+20,true),nl=dv.getUint16(o+28,true),xl=dv.getUint16(o+30,true),cl=dv.getUint16(o+32,true),lo=dv.getUint32(o+42,true),name=dec.decode(u.subarray(o+46,o+46+nl));
    const start=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),raw=u.subarray(start,start+cs);let data=raw;
    if(meth===8){const st=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));data=new Uint8Array(await new Response(st).arrayBuffer())}
    out.push([name,/\.(xml|rels)$/.test(name)?dec.decode(data):data]);o+=46+nl+xl+cl}
  return out}
/* ---------- Hanssens Hout: Invulblad ---------- */
async function hhForm(){const files=await sfFiles('hh'),gs=sfParts();const rows=[];
  gs.forEach(p=>{const bs=bandSides(p),b=sfBand(p,'hh'),w=sfWork(p),note=[],gm=grainMatters(p);let pos='';
    if(SHOP_DRILL&&w.cups&&w.cups<=5)pos=`${w.cups} ${w.cups>1?'POTSCHARNIEREN':'POTSCHARNIER'}`;
    else if(SHOP_DRILL&&w.pins)pos=w.two?'RIJBORING 2-ZIJDIG':'RIJBORING 1-ZIJDIG';
    else if(w.shape)pos='CNC FREZEN';else if(w.angled)pos='SCHUIN ZAGEN';
    if(SHOP_DRILL&&w.cups&&!/POTSCH/.test(pos))note.push(`${w.cups}× potscharnier Ø35`);
    if(SHOP_DRILL&&w.pins&&!/RIJB/.test(pos))note.push(`rijboring Ø5 (${w.pins} gaten)`);
    if(w.shape&&pos!=='CNC FREZEN')note.push('vorm volgens tekening/DXF '+p.id);
    if(w.angled&&pos!=='SCHUIN ZAGEN')note.push('schuin zagen volgens tekening');
    if(/KLEUR|fineer|HPL|Massief/.test(hhMat(p))||(p.matType==='melamine'&&!sfWhite(p.fin)))note.unshift('decor: '+sfDecor(p));
    rows.push([p.id,hhMat(p),SF_R(p.finL||p.L),SF_R(p.finWd||p.Wd),p.qty,`${tr(p.type)}${p.secs&&p.secs.length?' · '+p.secs.join(', '):''}`.slice(0,60),bs[0]?b:'',bs[1]?b:'',bs[2]?b:'',bs[3]?b:'',gm?0:1,pos,note.join(' · ')])});
  const N=Math.max(93,rows.length+1);
  return files.map(([n,d])=>{
    if(n==='xl/worksheets/sheet1.xml'){const head=d.slice(0,d.indexOf('<sheetData>')+11),tail=d.slice(d.indexOf('</sheetData>'));
      const orig=[...d.matchAll(/<row r="(\d+)"([^>]*?)(\/>|>.*?<\/row>)/g)];const r1=orig.find(m=>m[1]==='1')[0];
      const data=rows.map((r,i)=>{const R=i+2;return `<row r="${R}" spans="1:13" ht="23.1" customHeight="1">${r.map((v,c)=>sfCell('ABCDEFGHIJKLM'[c]+R,v,c===12?43:'')).join('')}</row>`});
      const rest=orig.filter(m=>+m[1]>rows.length+1&&m[1]!=='3').map(m=>m[0]);
      let t=tail.replace(/sqref="G2:H3 [^"]*"/,`sqref="G2:H${N}"`).replace('sqref="J2:J93"',`sqref="J2:J${N}"`).replace('sqref="I2:I93"',`sqref="I2:I${N}"`).replace('sqref="K2:K93"',`sqref="K2:K${N}"`)
        .replace(/<dataValidation [^>]*promptTitle="Draaibaar"[^>]*sqref="L2"[^>]*>.*?<\/dataValidation>/,'').replace(/(promptTitle="Bewerking"[^>]*sqref=")L2"/,`$1L2:L${N}"`).replace(/(promptTitle="(?:Volgnummer|Lengte|Breedte|Aantal)"[^>]*sqref=")([A-E])2"/g,`$1$22:$2${N}"`);
      t=t.replace(/<dataValidations([^>]*) count="\d+"/,(m,a)=>`<dataValidations${a} count="${(t.match(/<dataValidation /g)||[]).length}"`);
      return [n,head+r1+data.join('')+rest.join('')+t]}
    if(n==='xl/worksheets/sheet2.xml'){let x=d;[['C5',ME.name],['C6',ME.company],['C8',ME.street],['C9',ME.nr],['C10',ME.zip],['C11',ME.city],['C12',ME.country],['C14',ME.email],['C15',ME.phone]].forEach(([r,v])=>{if(v)x=sfSet(x,r,v)});return [n,x]}
    if(n==='xl/workbook.xml')return [n,d.replace(/<calcPr ([^/]*)\/>/,'<calcPr $1 fullCalcOnLoad="1"/>')];
    return [n,d]})}
/* ---------- Woodcenter: Houtlijst ---------- */
async function wcForm(){const files=await sfFiles('wc'),gs=sfParts();const rows=[];
  gs.forEach(p=>{const bs=bandSides(p),b=sfBand(p,'wc'),w=sfWork(p),m=MATS[p.matType]||{},note=[];
    const mat=/^cm_/.test(p.matType)?`${m.name||p.matType}`:({melamine:'Melamine',mdfpaint:'MDF (te lakken)',mdfmicro:'MDF (microcement)',veneer:'MDF gefineerd',ply:'Berken multiplex',hpl:'HPL op MDF',solid:'Massief paneel',hdf:'HDF'}[p.matType]||m.name||p.matType)+(m.paint||m.micro||p.matType==='ply'?'':' '+sfDecor(p));
    if(SHOP_DRILL&&w.cups)note.push(`${w.cups}× potscharnier Ø35`);if(SHOP_DRILL&&w.pins)note.push(`rijboring Ø5${w.two?' 2-zijdig':''} (${w.pins} gaten)`);
    if(w.shape)note.push('vorm volgens tekening/DXF '+p.id);if(w.angled)note.push('schuin zagen volgens tekening');
    rows.push([`${p.id} ${tr(p.type)}`.slice(0,20),p.qty,SF_R(p.finL||p.L),SF_R(p.finWd||p.Wd),+p.t,mat,grainMatters(p)?0:1,bs[0]?b:'',bs[1]?b:'',bs[2]?b:'',bs[3]?b:'',[...note,p.secs&&p.secs.length?p.secs.join(', '):''].filter(Boolean).join(' · '),1])});
  const last=Math.max(112,13+rows.length);
  return files.map(([n,d])=>{if(n!=='xl/worksheets/sheet1.xml')return [n,d];let x=d;
    [['B1',ME.name?ME.name+(ME.company?' · '+ME.company:''):''],['B2',[ME.street,ME.nr].filter(Boolean).join(' ')],['B3',[ME.zip,ME.city].filter(Boolean).join(' ')],['B4',ME.phone],['B5',ME.email],['B6',sfDate()]].forEach(([r,v])=>{if(v)x=sfSet(x,r,v)});
    if(last>112){const r112=(x.match(/<row r="112"[^>]*>.*?<\/row>/)||[''])[0];let add='';for(let R=113;R<=last;R++)add+=r112.replace(/r="112"/,`r="${R}"`).replace(/r="([A-Z]+)112"/g,`r="$1${R}"`).replace(/(<c r="A\d+"[^>]*><v>)\d+(<\/v>)/,`$1${R-13}$2`);
      x=x.replace('</sheetData>',add+'</sheetData>').replace(/112<\/xm:sqref>/g,`${last}</xm:sqref>`).replace(/H14:H112/,`H14:H${last}`).replace(/N14:N112/,`N14:N${last}`).replace('sqref="B14:B112"',`sqref="B14:B${last}"`).replace(/<dimension ref="A1:S\d+"\/>/,`<dimension ref="A1:S${last}"/>`)}
    rows.forEach((r,i)=>{const R=14+i;'BCDEFGHIJKLMN'.split('').forEach((c,j)=>{x=sfSet(x,c+R,r[j])})});
    return [n,x]})}
async function shopFormXlsx(shop){return zipStore(await (shop==='hh'?hhForm():wcForm()))}
document.addEventListener('toggle',e=>{const el=e.target;if(el&&el.classList&&el.classList.contains('sfme'))ui.meOpen=el.open},true);
