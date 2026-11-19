"""The Fitted tests. Run after every change:   python3 build.py && python3 tests/run.py

For every design in tests/designs/ the built page works out the cut list, hardware, design notes,
price and 3D links, and compares them with tests/expected/. Any difference fails the test and is shown.
If a change is MEANT to change the results (e.g. a better cut size), check the differences, then run
   python3 tests/run.py --update
to save the new results as the expected ones.

Also fails when the page logs an error or reports a problem (oops), or when a board with holes has no 3D board linked to it.
"""
import json, sys, pathlib, difflib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from page import open_page, ROOT
from playwright.sync_api import sync_playwright
upd = "--update" in sys.argv
D, E = ROOT / "tests" / "designs", ROOT / "tests" / "expected"; E.mkdir(exist_ok=True)
snap = (ROOT / "tests" / "snapshot.js").read_text()
screens = (ROOT / "tests" / "screens.js").read_text()
order_check = (ROOT / "tests" / "order_check.js").read_text()
fails = 0
with sync_playwright() as pw:
    b, p = open_page(pw)
    for f in sorted(D.glob("*.json")):
        got = p.evaluate(snap, json.loads(f.read_text()))
        reported = got.pop("problems")
        txt = json.dumps(got, indent=1, sort_keys=True, ensure_ascii=False)
        exp = E / f.name
        problems = []
        for x in reported:
            problems.append("problem reported: " + x)
        if got["link"]["unlinkedWithHoles"]:
            problems.append(f'{got["link"]["unlinkedWithHoles"]} drilled part(s) have no 3D board')
        if upd:
            exp.write_text(txt)
        elif not exp.exists():
            problems.append("no expected results yet (run with --update)")
        elif exp.read_text() != txt:
            d = list(difflib.unified_diff(exp.read_text().splitlines(), txt.splitlines(), "expected", "now", lineterm="", n=1))
            problems.append("results changed:\n    " + "\n    ".join(d[:40]) + ("\n    …" if len(d) > 40 else ""))
        if f.stem.startswith("starter-"):  # screens and exports, on the starter designs
            sc = p.evaluate(screens, json.loads(f.read_text()))
            problems += ["on screen: " + x for x in sc["problems"]]
        if f.stem == "starter-oak":  # the order check finds each problem made on purpose
            problems += ["order check missed: " + n for n, ok in p.evaluate(order_check, json.loads(f.read_text())) if not ok]
        if p.errors:
            problems.append("page errors: " + " | ".join(p.errors[:3])); p.errors.clear()
        print(("FAIL " if problems else "ok   ") + f.stem + "".join("\n  - " + x for x in problems))
        fails += bool(problems)
    b.close()
print(f"\n{fails} failed" if fails else "\nall passed" + (" (expected results updated)" if upd else ""))
sys.exit(1 if fails else 0)
