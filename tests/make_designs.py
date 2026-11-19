"""Makes the test designs in tests/designs/ (run once; the files are then kept as they are).
   The nine starter designs, plus random designs in harder rooms: slanted ceilings, a beam, narrow and wide walls."""
import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from page import open_page, ROOT
from playwright.sync_api import sync_playwright
out = ROOT / "tests" / "designs"; out.mkdir(exist_ok=True)
ROOMS = [
  {"W": 3000, "H": 2500}, {"W": 4200, "H": 2600}, {"W": 1800, "H": 2400},
  {"W": 3600, "H": 2500, "ceil": [{"x": 0, "y": 1400}, {"x": 1800, "y": 2500}, {"x": 3600, "y": 2500}]},
  {"W": 3400, "H": 2600, "ceil": [{"x": 0, "y": 2600}, {"x": 2000, "y": 2600}, {"x": 3400, "y": 1500}]},
  {"W": 4000, "H": 2500, "beams": [{"x": 1200, "w": 300, "h": 250}]},
  {"W": 3600, "H": 2550, "ceil": [{"x": 0, "y": 1300}, {"x": 1500, "y": 2550}, {"x": 2400, "y": 2550}, {"x": 3600, "y": 1600}], "beams": [{"x": 2600, "w": 200, "h": 300}]},
]
with sync_playwright() as pw:
    b, p = open_page(pw)
    for k in p.evaluate("STARTERS.map(s=>s.key)"):
        (out / f"starter-{k}.json").write_text(json.dumps(p.evaluate(f"STARTERS.find(s=>s.key==='{k}').make()"), indent=1))
    n = 0
    for i, room in enumerate(ROOMS):
        for seed in (11, 23):
            st = p.evaluate("""([room,seed])=>{const s=exampleState();const H=room.H;s.room={W:room.W,H,D:600,drop:0,ceil:room.ceil||[{x:0,y:H},{x:room.W,y:H}],beams:room.beams||[]};
              let st=randomLayout(s,prng(seed));const key=pick(prng(seed+1),STYLE_PICK);st=applyStyle(st,key,seed,{});delete st._mustMiss;build(st);return st}""", [room, seed])
            (out / f"random-{i}-{seed}.json").write_text(json.dumps(st, indent=1)); n += 1
    print("errors:", p.errors[:3]); b.close()
print("made", n, "random designs")
