"""Opens the built Fitted page (index.html) in a headless Chrome, for the tests.

The 3D library normally comes from the internet; if THREE_JS points to a local copy
of three.min.js, the page gets that instead (handy when the test machine is offline).
Fonts from Google are skipped. Every console error is collected in page.errors.
"""
import os, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent


def open_page(pw, html=None):
    html = html or ROOT / "index.html"
    browser = pw.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"), args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1280, "height": 860})
    page.errors = []
    page.on("console", lambda m: m.type == "error" and page.errors.append(m.text))
    page.on("pageerror", lambda e: page.errors.append(str(e)))
    three = os.environ.get("THREE_JS")

    def route(r):
        url = r.request.url
        if url.startswith("http://fitted.test/"):
            p = ROOT / url[len("http://fitted.test/"):]
            return r.fulfill(path=str(p)) if p.exists() else r.fulfill(status=404)
        if "three" in url and url.endswith(".js") and three:
            return r.fulfill(path=three, content_type="application/javascript")
        if "fonts.g" in url:
            return r.fulfill(status=200, body="", content_type="text/css")
        return r.continue_()
    page.route("**/*", route)
    page.goto("http://fitted.test/" + pathlib.Path(html).name)
    page.wait_for_function("typeof build==='function'&&typeof geo!=='undefined'&&geo", timeout=60000)
    return browser, page
