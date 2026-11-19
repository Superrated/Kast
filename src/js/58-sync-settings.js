/* ==== 58-sync-settings.js ====
   Your settings follow you to every device where you open Fitted signed in.
   Each setting below lives in this browser (localStorage, so it works offline and signed out) AND in your
   own private space of the app's data store: data/users/<your id>/fitted/settings. Only you can read it.

   How it stays in step:
   - Every few seconds, syncTick() compares each setting with what it last saw. A changed setting gets a
     time stamp (kept in 'fitted-sync-at') and is sent to the private space.
   - On start, syncInit() reads the private space. A setting that is newer there than here is copied in,
     and its apply() puts it straight into the running app.
   To sync another setting: add its localStorage key to SYNC with an apply() that re-reads it.
   (My shops has its own private sync in 68-my-shops.js; saved designs and offcuts use the shared store.)
*/
const SYNC = {
  'fitted-me': () => {
    // your name / address for the shops' order forms
    Object.assign(ME, JSON.parse(localStorage.getItem('fitted-me') || '{}'));
  },
  'fitted-shopdrill': () => {
    SHOP_DRILL = localStorage.getItem('fitted-shopdrill') !== '0';
  },
  'fitted-wx': () => {
    // Assemble 3D: show hardware / holes & marks
    const o = JSON.parse(localStorage.getItem('fitted-wx') || 'null');
    if (o) {
      WX.hw = o.hw !== false;
      WX.marks = o.marks !== false;
    }
  },
  'fitted-pn': () => {
    Object.assign(PN, JSON.parse(localStorage.getItem('fitted-pn') || '{}'));
  },
  'kast-lang': () => {
    const l = localStorage.getItem('kast-lang');
    if (l && l !== LANG && LANGS[l]) setLang(l);
  },
  'kast-view': () => {
    ui.simple = localStorage.getItem(VIEW_KEY) !== 'x';
  },
  'fitted-custom': () => {
    // your own boards and colours
    const o = JSON.parse(localStorage.getItem('fitted-custom') || 'null');
    if (o && typeof o === 'object') CU_LIB = { fins: o.fins || {}, mats: o.mats || {} };
  }
};
const SY = { doc: null, seen: {}, at: {}, busy: false, timer: null };

function syLocal(k) {
  try {
    return localStorage.getItem(k);
  } catch (e) {
    return null;
  }
}
function syLoadStamps() {
  try {
    SY.at = JSON.parse(localStorage.getItem('fitted-sync-at') || '{}') || {};
  } catch (e) {
    SY.at = {};
  }
}
function sySaveStamps() {
  try {
    localStorage.setItem('fitted-sync-at', JSON.stringify(SY.at));
  } catch (e) {
    oops('sync settings: stamps', e, 1);
  }
}

async function syncInit() {
  syLoadStamps();
  Object.keys(SYNC).forEach(k => (SY.seen[k] = syLocal(k)));
  try {
    if (!(window.claude && claude.use)) return;
    const db = await claude.use('db'),
      u = await claude.use('user');
    if (!db || !u || !u.id) return;
    const id = await u.id();
    if (!id) return;
    SY.doc = db.doc(`data/users/${id}/fitted/settings`);
    const d = await SY.doc.get();
    const v = (d && (d.data ? d.data() : d)) || {};
    const vals = v.vals || {},
      at = v.at || {};
    let took = 0,
      give = 0;
    Object.keys(SYNC).forEach(k => {
      const there = at[k] || 0,
        here = SY.at[k] || 0;
      if (k in vals && there > here) {
        // newer on another device: take it
        try {
          if (vals[k] == null) localStorage.removeItem(k);
          else localStorage.setItem(k, vals[k]);
          SY.at[k] = there;
          SY.seen[k] = vals[k];
          SYNC[k]();
          took++;
        } catch (e) {
          oops('sync settings: ' + k, e);
        }
      } else if (syLocal(k) != null && (here > there || !(k in vals))) give++;
    });
    sySaveStamps();
    if (took) {
      try {
        regCustom(S);
        geo = build(S);
        renderSide();
        renderViews();
      } catch (e) {
        oops('sync settings: redraw', e);
      }
    }
    if (give) syPush();
  } catch (e) {
    SY.doc = null;
    oops('sync settings', e, 1);
  }
  SY.timer = setInterval(syncTick, 4000);
}

/* notice settings changed on this device and send them */
function syncTick() {
  let changed = false;
  Object.keys(SYNC).forEach(k => {
    const now = syLocal(k);
    if (now !== SY.seen[k]) {
      SY.seen[k] = now;
      SY.at[k] = Date.now();
      changed = true;
    }
  });
  if (changed) {
    sySaveStamps();
    syPush();
  }
}

async function syPush() {
  if (!SY.doc || SY.busy) return;
  SY.busy = true;
  try {
    const vals = {};
    Object.keys(SYNC).forEach(k => (vals[k] = syLocal(k)));
    await SY.doc.set({ vals, at: SY.at, updatedAt: Date.now() });
  } catch (e) {
    oops('sync settings: save', e, 1);
  }
  SY.busy = false;
}
