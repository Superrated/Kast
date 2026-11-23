#!/usr/bin/env python3
"""Builds the BRUIS Fronts prototype (fronts/index.html) from fronts/src.

It borrows from the Fitted app next door, so both look and colour the same:
  - the colour tokens (light and dark) from ../src/css/10-look.css
  - the RAL colour list from ../src/js/00-core-data.js
Run:  python3 fronts/build.py
"""
import pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
FITTED = HERE.parent / "src"
SRC = HERE / "src"


def fitted_tokens():
    css = (FITTED / "css" / "10-look.css").read_text()
    # every :root block (light, dark by preference, dark by choice)
    out, i = [], 0
    for m in re.finditer(r"(@media \(prefers-color-scheme: dark\) \{\s*)?:root[^{]*\{", css):
        start = m.start()
        depth, j = 0, m.end() - 1
        while j < len(css):
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        block = css[start : j + 1]
        if m.group(1):  # close the @media block too
            block += "\n}"
        out.append(block)
    return "\n".join(out)


def fitted_ral():
    js = (FITTED / "js" / "00-core-data.js").read_text()
    m = re.search(r"'(1000 Green beige [^']+)'", js)
    if not m:
        raise SystemExit("RAL list not found in Fitted's 00-core-data.js")
    return m.group(1)


def main():
    html = (SRC / "app.html").read_text()
    css = fitted_tokens() + "\n" + (SRC / "fronts.css").read_text()
    js = "".join(p.read_text() + "\n" for p in sorted((SRC / "js").glob("*.js")))
    # the marker may have a space after it (code formatter): accept both
    js, n = re.subn(r"/\*@RAL@\*/\s*''", lambda m: repr(fitted_ral()), js)
    if n != 1:
        raise SystemExit("RAL marker /*@RAL@*/'' not found in fronts/src/js")
    html = html.replace("/*@CSS@*/", css).replace("/*@JS@*/", js)
    (HERE / "index.html").write_text(html)
    print(f"built fronts/index.html ({len(html) // 1024} kB)")


if __name__ == "__main__":
    main()
