#!/usr/bin/env python3
"""Builds the standalone, installable Fitted app (index.html).

The source is split into small files so it is easy to read and extend:

  src/app.html     the page: header, panels, dialogs (markup only)
  src/css/*.css    the styles, in file-name order
  src/js/*.js      the program, in file-name order (one topic per file)
  src/prices.js    every price, copied in at the /*@PRICES@*/ marker
  src/lang.js      translations, copied in at the /*@LANG@*/ marker

Run:  python3 build.py           → writes index.html
      python3 build.py --source  → prints the assembled source (for tests)
"""
import re, sys, pathlib
root = pathlib.Path(__file__).parent


def read(*parts):
    return (root.joinpath(*parts)).read_text(encoding="utf-8")


def shop_forms():
    """The panel shops' own order forms (templates/), packed into the page so Fitted can fill them in.
    Each form goes in as one small zip (base64): pictures re-saved smaller, a template (.xltx)
    turned into a normal workbook (.xlsx). The page unpacks it when you export."""
    import zipfile, base64, json, io
    from PIL import Image
    forms = {}
    for key, fn in (("hh", "hanssens-invulblad-zaagwerk.xlsx"), ("wc", "woodcenter-houtlijst.xltx")):
        out = io.BytesIO()
        with zipfile.ZipFile(root / "templates" / fn) as z, zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as o:
            for n in z.namelist():
                b = z.read(n)
                if n.endswith(".xml"):
                    b = b.replace(b"spreadsheetml.template.main+xml", b"spreadsheetml.sheet.main+xml")
                elif n.endswith((".png", ".jpeg", ".jpg")):
                    im = Image.open(io.BytesIO(b)); im.thumbnail((640, 640)); buf = io.BytesIO()
                    if n.endswith(".png"):
                        im.convert("RGBA").quantize(64, method=Image.FASTOCTREE).save(buf, "PNG", optimize=True)
                    else:
                        im.convert("RGB").save(buf, "JPEG", quality=72, optimize=True)
                    if buf.tell() < len(b):
                        b = buf.getvalue()
                o.writestr(n, b)
        forms[key] = base64.b64encode(out.getvalue()).decode("ascii")
    return json.dumps(forms)


def assemble():
    """The whole app as one page (without the <html>/<head>/<body> wrapper)."""
    page = read("src", "app.html")
    css = "".join(p.read_text(encoding="utf-8") for p in sorted((root / "src" / "css").glob("*.css")))
    js = "".join(p.read_text(encoding="utf-8") for p in sorted((root / "src" / "js").glob("*.js")))
    assert "<!--@CSS@-->" in page and "<!--@JS@-->" in page, "markers missing in src/app.html"
    src = page.replace("<!--@CSS@-->", css, 1).replace("<!--@JS@-->", js, 1)
    if "/*@FORMS@*/null" in src:
        src = src.replace("/*@FORMS@*/null", shop_forms(), 1)
    for marker, name in (("/*@PRICES@*/", "prices.js"), ("/*@LANG@*/", "lang.js")):
        assert marker in src, marker + " missing in src/js"
        src = src.replace(marker, read("src", name), 1)
    return src


if "--source" in sys.argv:
    sys.stdout.write(assemble())
    sys.exit(0)

src = assemble()
version = re.search(r"const APP_VERSION='([^']+)'", src).group(1)
# the version shown in the header and on the loading screen comes from APP_VERSION
src = src.replace("__KAST_VERSION__", version)

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
<meta name="apple-mobile-web-app-title" content="Fitted">
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
print("built index.html for Fitted", version, f"({len(page)//1024} kB)")
