#!/usr/bin/env python3
"""Quick check of the BRUIS Fronts prototype in a headless Chrome: the page starts without errors, all four
steps render for PAX, METOD and BESTÅ, the planner example is read, every cabinet size and front layout
gives fronts that stay inside their cabinet without overlapping, Surprise me gives valid looks, a front can get its
own look, typed widths and quick starts work, and (with THREE_JS set to a local three.min.js) 3D draws.  Run after  python3 fronts/build.py"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

PAGE = pathlib.Path(__file__).resolve().parent / "index.html"
CHECK = """(()=>{const bad=[];
  for (const sys of ['pax','metod','besta']) { S=freshState(sys); for (const st of ['cabs','fronts','handles','order']) { S.step=st; render(); } }
  const r=parsePlanner(IMPORT_EXAMPLE); const sy=new Set(r.found.map(c=>c.sys));
  if (sy.size!==3) bad.push('planner example: systems found '+[...sy]);
  // the IKEA list reader: other shapes and languages (cart over several lines, Dutch, French, typed, combinations, table rows)
  const IMPS=[
    ['PAX\\nWardrobe frame, white, 100x58x236 cm\\n702.145.67\\n€ 95,00\\n2\\nFORSAND\\nDoor, white, 50x229 cm\\n4', 'pax:100x236:doors,pax:100x236:doors'],
    ['METOD / MAXIMERA Onderkast met 3 lades, wit/Voxtorp, 60x60x80 cm  1 st\\nMETOD Bovenkast met 2 deuren, wit, 80x37x80 cm  Aantal: 2', 'metod:60x80:drawers3,metod:80x80:doors2,metod:80x80:doors2'],
    ['METOD / MAXIMERA Élt bas 4 faces/4 tiroirs, blanc, 40x60 cm  1', 'metod:40x80:drawers4'],
    ['pax 100x236\\nmetod base 60x60x80', 'pax:100x236:doors,metod:60x80:door'],
    ['PAX / FORSAND Wardrobe combination, white, 150x60x236 cm  1', 'pax:100x236:doors,pax:50x236:doors'],
    ['METOD\\tWall cabinet frame, white, 60x37x80 cm\\t302.055.53\\t2\\t€ 35', 'metod:60x80:door,metod:60x80:door']];
  IMPS.forEach(([t,want])=>{ const got=parsePlanner(t).found.map(c=>`${c.sys}:${c.w}x${c.h}:${c.layout}`).join(); if(got!==want) bad.push('IKEA list: '+JSON.stringify(t.slice(0,40))+' gave '+got) });
  // demos: each one loads, has fronts and valid looks, and draws every step
  DEMOS.forEach((d,i)=>{ S=freshState(d.sys); loadDemo(i); const Ld=layout();
    if(!Ld.fronts.length) bad.push('demo without fronts: '+d.name);
    if(S.cabs.length!==d.cabs.length) bad.push('demo cabinets changed: '+d.name);
    S.cabs.forEach((c,k)=>{ if(c.layout!==d.cabs[k][3]) bad.push(`demo ${d.name}: cabinet ${k+1} layout ${c.layout}`) });
    Ld.fronts.forEach(f=>{ const lk=lookOf(f); if(!matOk(lk.style,lk.mat)) bad.push('demo bad look: '+d.name) });
    for (const st of ['cabs','fronts','handles','order']) { S.step=st; render(); } });
  // side panels: priced and in the order list
  S=freshState('metod'); S.sides='both'; let Ls=layout(); if(Ls.sides.length!==3) bad.push('kitchen sides (tall at the left end covers the wall row too): '+Ls.sides.length);
  if(!(priceAll(Ls).ns===3&&grouped(Ls).some(r=>r.kind==='side'))) bad.push('sides not priced/listed');
  S.step='fronts'; render(); S.step='order'; render(); if(!/Side panel/.test(document.getElementById('panel').textContent)) bad.push('no side panel in the order');
  for (const [sys,s] of Object.entries(SYS)) for (const [k,kd] of Object.entries(s.kinds)) for (const w of kd.widths) for (const h of kd.heights) {
    const c=cab(sys,k,w,h);
    for (const [lk] of layoutsFor(c)) { c.layout=lk; const fr=frontsOf(c,0,0);
      if (lk!=='open'&&!fr.length) bad.push(`no fronts ${sys} ${k} ${w}x${h} ${lk}`);
      fr.forEach(f=>{ if(f.x<-0.1||f.x+f.w>w*10+0.1||f.y<-0.1||f.y+f.h>h*10+0.1) bad.push(`front outside ${sys} ${k} ${w}x${h} ${lk}`) });
      for (let i=0;i<fr.length;i++) for (let j=i+1;j<fr.length;j++) { const a=fr[i],b=fr[j];
        if (Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>0.1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>0.1) bad.push(`fronts overlap ${sys} ${k} ${w}x${h} ${lk}`) } } }
  if (Object.keys(RAL).length<200) bad.push('RAL list missing');
  Object.entries(COLOURS).forEach(([k,c])=>{ if(!RAL[c.ral]) bad.push('colour '+k+' has no RAL '+c.ral) });
  // surprise: every recipe, every system, gives valid looks
  for (const sys of ['pax','metod','besta']) for (let seed=1; seed<40; seed++) { S=freshState(sys); surprise(seed);
    layout().fronts.forEach(f=>{ const lk=lookOf(f); if(!MATS[lk.mat]||!STYLES[lk.style]||!matOk(lk.style,lk.mat)) bad.push(`surprise ${sys} ${seed}: bad look ${JSON.stringify(lk)}`) });
    if(!S.recipe) bad.push('surprise gave no recipe'); }
  // a look for one front: own, change, copy to the cabinet, back to the rest
  S=freshState('pax'); render(); const f0=layout().fronts[0]; S.sel=f0.id; S.fx[f0.id]={style:'flat',mat:'walnut',col:'chalk'};
  if (lookOf(f0).mat!=='walnut') bad.push('own look not used'); setLook(f0.id,'mat','glass'); if (lookOf(f0).style!=='fluted') bad.push('glass must be fluted');
  S.step='fronts'; render(); if(!document.querySelector('.selcard')) bad.push('no card for the selected front');
  // typed widths
  if (parseWidths('100 50 2x100', SYS.pax.kinds.frame.widths).join()!=='100,50,100,100') bad.push('typed widths: '+parseWidths('100 50 2x100', SYS.pax.kinds.frame.widths));
  for (const sys of ['pax','metod','besta']) QUICK[sys].forEach(q=>{ S=freshState(sys); S.cabs=quickMake(q[1]); if(!layout().fronts.length) bad.push('quick start '+q[0]+' has no fronts') });
  return [...new Set(bad)] })()"""

with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"), args=["--no-sandbox"])
    p = br.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    p.on("console", lambda m: m.type == "error" and errs.append(m.text))
    three = os.environ.get("THREE_JS")

    def route(r):
        u = r.request.url
        if u.startswith("http://fronts.test/"):
            return r.fulfill(path=str(PAGE))
        if "three" in u and u.endswith(".js") and three:
            return r.fulfill(path=three, content_type="application/javascript")
        return r.fulfill(status=200, body="", content_type="text/css")

    p.route("**/*", route)
    p.goto("http://fronts.test/")
    p.evaluate("localStorage.clear()")
    p.reload()
    p.wait_for_timeout(300)
    bad = errs + (p.evaluate(CHECK) if not errs else [])
    if not bad and os.environ.get("THREE_JS"):
        # 3D: open it, draw, and tap the middle of the picture
        p.evaluate("S=freshState('metod');S.view='3d';render()")
        p.wait_for_function("V3.ready&&V3.meshes.length>0", timeout=20000)
        n = p.evaluate("V3.meshes.length")
        if n < 5:
            bad.append(f"3D: only {n} fronts")
        bad += errs
    br.close()
print("\n".join(bad) or "all fine")
sys.exit(1 if bad else 0)
