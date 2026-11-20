# Fitted by BRUIS

**Fitted** (by BRUIS) designs built-in wardrobes and cabinets (not kitchens) for one or more walls of a room, including walls under a sloped ceiling, and turns the design into everything needed to build it:

- a front drawing and a 3D view (also drawn into a photo of your own room)
- a cut list, sheet cutting plans and drawings of the shaped parts
- a hardware list and a price estimate (Belgian woodworking shops)
- a step-by-step build guide, and a PDF with all of the above

Version **v0.134**.

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
| `src/ (see ARCHITECTURE.md)` | The whole app in one file. This is the file to edit. |
| `build.py` | Wraps `src/ (see ARCHITECTURE.md)` into the installable `index.html`. |
| `index.html` | The built app. Do not edit by hand. |
| `manifest.webmanifest`, `sw.js`, `icons/` | What makes it installable and usable offline. |

## Changing the app

1. Edit `src/ (see ARCHITECTURE.md)`.
2. Run `python3 build.py`.
3. Open `index.html` to check.

For a new version, change `APP_VERSION` near the photo code in `src/ (see ARCHITECTURE.md)`, then run the build again. The header, the loading screen and the offline cache all pick up the new version number by themselves.

## Good to know

- Prices are estimates, dated in the app. Check them with the shop before ordering.
- Hardware sizes and type numbers come from general knowledge of the Blum range, not from a live catalogue. Check them before ordering.
- Saving designs in this standalone version is local to the browser. Use *Designs → Copy as text* to move a design to another device.

All prices live in `src/prices.js` (incl. 21 % VAT). Edit them there, or use the "Update prices" button in the app.


## Adding a language

Fitted is in English. All translations live in `src/lang.js`:

1. Copy the commented `nl` example in `LANGS`, give it a code (`nl`, `fr`, …), a `name` and a `date` locale.
2. Under `words`, add `'English text as on screen': 'translation'` pairs. Texts with numbers go under `patterns`.
3. The longer texts (the shop email, the brief for a cabinet maker) are templates starting with `@` in `LANG_EN`; copy any of them into the new language to translate it.
4. Run `python3 build.py`. A language button appears in the header as soon as there are two languages. Anything without a translation stays in English.


## Buy-me-a-coffee link

Put your Buy Me a Coffee or Ko-fi address in `SUPPORT.coffee` near "messages to BRUIS" in `src/ (see ARCHITECTURE.md)`, then run `python3 build.py`. Until then the coffee tab invites people to say thanks instead.
