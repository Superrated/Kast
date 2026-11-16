# Kast

**Kast** designs a built-in cabinet for one wall of a room, including walls under a sloped ceiling, and turns the design into everything needed to build it:

- a front drawing and a 3D view (also drawn into a photo of your own room)
- a cut list, sheet cutting plans and drawings of the shaped parts
- a hardware list and a price estimate (Belgian woodworking shops)
- a step-by-step build guide, and a PDF with all of the above

Version **v0.57**.

## Use it

Open `index.html` in a browser. Nothing has to be installed, and your design stays in your own browser.

To install it as an app:

- **Phone or tablet:** open the page in Safari or Chrome, then choose *Add to Home Screen*.
- **Computer (Chrome or Edge):** click the install icon at the right of the address bar.

After the first visit it also works without an internet connection. The first visit needs a connection, because the 3D view and the fonts are loaded from the web once.

### Putting it online with GitHub Pages

1. In this repository: **Settings → Pages**.
2. Under *Build and deployment*, pick **Deploy from a branch**, branch **main**, folder **/ (root)**.
3. After a minute the app is at `https://<your-name>.github.io/kast/`.

On a free GitHub account this only works when the repository is public.

## Files

| File | What it is |
| --- | --- |
| `src/kast.html` | The whole app in one file. This is the file to edit. |
| `build.py` | Wraps `src/kast.html` into the installable `index.html`. |
| `index.html` | The built app. Do not edit by hand. |
| `manifest.webmanifest`, `sw.js`, `icons/` | What makes it installable and usable offline. |

## Changing the app

1. Edit `src/kast.html`.
2. Run `python3 build.py`.
3. Open `index.html` to check.

For a new version, change `APP_VERSION` near the photo code in `src/kast.html`, then run the build again. The header, the loading screen and the offline cache all pick up the new version number by themselves.

## Good to know

- Prices are estimates, dated in the app. Check them with the shop before ordering.
- Hardware sizes and type numbers come from general knowledge of the Blum range, not from a live catalogue. Check them before ordering.
- Saving designs in this standalone version is local to the browser. Use *Designs → Copy as text* to move a design to another device.
