#!/usr/bin/env python3
"""Quick check of the BRUIS Fronts prototype in a headless Chrome: the page starts without errors, all four
steps render for PAX, METOD and BESTÅ, the planner example is read, and every cabinet size and front layout
gives fronts that stay inside their cabinet without overlapping.  Run after  python3 fronts/build.py"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

PAGE = pathlib.Path(__file__).resolve().parent / "index.html"
CHECK = """(()=>{const bad=[];
  for (const sys of ['pax','metod','besta']) { S=freshState(sys); for (const st of ['cabs','fronts','handles','order']) { S.step=st; render(); } }
  const r=parsePlanner(IMPORT_EXAMPLE); const sy=new Set(r.found.map(c=>c.sys));
  if (sy.size!==3) bad.push('planner example: systems found '+[...sy]);
  for (const [sys,s] of Object.entries(SYS)) for (const [k,kd] of Object.entries(s.kinds)) for (const w of kd.widths) for (const h of kd.heights) {
    const c=cab(sys,k,w,h);
    for (const [lk] of layoutsFor(c)) { c.layout=lk; const fr=frontsOf(c,0,0);
      if (lk!=='open'&&!fr.length) bad.push(`no fronts ${sys} ${k} ${w}x${h} ${lk}`);
      fr.forEach(f=>{ if(f.x<-0.1||f.x+f.w>w*10+0.1||f.y<-0.1||f.y+f.h>h*10+0.1) bad.push(`front outside ${sys} ${k} ${w}x${h} ${lk}`) });
      for (let i=0;i<fr.length;i++) for (let j=i+1;j<fr.length;j++) { const a=fr[i],b=fr[j];
        if (Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>0.1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>0.1) bad.push(`fronts overlap ${sys} ${k} ${w}x${h} ${lk}`) } } }
  if (Object.keys(RAL).length<200) bad.push('RAL list missing');
  return [...new Set(bad)] })()"""

with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"), args=["--no-sandbox"])
    p = br.new_page()
    errs = []
    p.on("pageerror", lambda e: errs.append(str(e)))
    p.on("console", lambda m: m.type == "error" and errs.append(m.text))
    p.route("**/*", lambda r: r.fulfill(path=str(PAGE)) if r.request.url.startswith("http://fronts.test/") else r.fulfill(status=200, body="", content_type="text/css"))
    p.goto("http://fronts.test/")
    p.evaluate("localStorage.clear()")
    p.reload()
    p.wait_for_timeout(300)
    bad = errs + (p.evaluate(CHECK) if not errs else [])
    br.close()
print("\n".join(bad) or "all fine")
sys.exit(1 if bad else 0)
