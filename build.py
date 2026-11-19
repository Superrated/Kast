#!/usr/bin/env python3
"""Builds the standalone, installable Kast app (index.html) from src/kast.html.

src/kast.html is the source of the app (page content without the
<html>/<head>/<body> wrapper); src/prices.js holds every price and is
copied into it at the /*@PRICES@*/ marker. Run:  python3 build.py
"""
import re, pathlib
root = pathlib.Path(__file__).parent
src = (root / "src" / "kast.html").read_text(encoding="utf-8")
version = re.search(r"const APP_VERSION='([^']+)'", src).group(1)
# the version shown in the header and on the loading screen comes from APP_VERSION
src = src.replace("__KAST_VERSION__", version)
# all prices live in src/prices.js; they are copied into the app here
prices = (root / "src" / "prices.js").read_text(encoding="utf-8")
assert "/*@PRICES@*/" in src, "price marker missing in src/kast.html"
src = src.replace("/*@PRICES@*/", prices)
# the Dutch screen texts live in src/nl.js
nl = (root / "src" / "nl.js").read_text(encoding="utf-8")
assert "/*@NL@*/" in src, "translation marker missing in src/kast.html"
src = src.replace("/*@NL@*/", nl)

# the first lines of the source (title, meta, font links) belong in <head>
head_lines, body_lines, in_head = [], [], True
for line in src.split("\n"):
    if in_head and re.match(r"\s*<(title|meta|link)\b", line):
        head_lines.append(line)
    else:
        in_head = False
        body_lines.append(line)

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#E8EBE7">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Kast">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<style>:root{{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}}body{{margin:0;font:14px system-ui,sans-serif}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{chr(10).join(head_lines)}
</head>
<body>
{chr(10).join(body_lines)}
<script>if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{{}}))</script>
</body>
</html>
"""
(root / "index.html").write_text(page, encoding="utf-8")

sw = (root / "sw.js").read_text(encoding="utf-8")
sw = re.sub(r"const VERSION='[^']*'", f"const VERSION='{version}'", sw)
(root / "sw.js").write_text(sw, encoding="utf-8")
print("built index.html for Kast", version, f"({len(page)//1024} kB)")
