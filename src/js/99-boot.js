/* ==== 99-boot.js ====
   Start-up: load the saved design, first render, install button, saved designs, offcuts, languages, comments.
*/
/* ===== boot ===== */
{
  const sp = document.getElementById('splash');
  if (sp) sp.addEventListener('animationend', () => sp.remove());
}
try {
  new ResizeObserver(() => {
    const f = document.getElementById('fmode');
    if (f) f.style.top = document.getElementById('bar').offsetHeight + 10 + 'px';
  }).observe(document.getElementById('bar'));
} catch (e) {
  oops('boot #1', e);
}
buildDefs();
if (!load()) {
  S = slopeFix(exampleState());
  ui.fresh = 1;
}
geo = build(S);
renderSide();
renderViews();
lastSnap = JSON.stringify(S);
updUndo();
if (!ui.wizSeen) openWiz();
priceSoon();
/* Install button: only where the browser can really install Fitted (the GitHub site, not the claude.ai page) */
const INST = { ev: null, ios: false };
function instShow(on) {
  ['instBtn', 'instBtnM'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.hidden = !on;
  });
}
(function () {
  try {
    const standalone =
        (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true,
      hasMf = !!document.querySelector('link[rel="manifest"]');
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      INST.ev = e;
      if (!standalone) instShow(true);
    });
    window.addEventListener('appinstalled', () => {
      INST.ev = null;
      instShow(false);
    });
    const ua = navigator.userAgent || '';
    INST.ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    if (INST.ios && hasMf && !standalone && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) instShow(true);
  } catch (e) {
    oops('boot #2', e);
  }
})();
dsInit();
offInit();
try {
  msInit();
} catch (e) {
  oops('boot #3', e);
}
szInit(); // sizes on hover / touch and hold (32-sizes.js)
syncInit(); // your settings on every device (58-sync-settings.js)
document.addEventListener(
  'click',
  e => {
    const m = document.getElementById('mmenu');
    if (!m || m.hidden) return;
    if (e.target.closest('#mmenu [data-act]')) {
      setTimeout(() => {
        m.hidden = true;
        document.querySelectorAll('[data-act=mmenu]').forEach(b => b.setAttribute('aria-expanded', 'false'));
      }, 0);
      return;
    }
    if (!e.target.closest('#mmenu,[data-act=mmenu]')) {
      m.hidden = true;
      document.querySelectorAll('[data-act=mmenu]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    }
  },
  true
);
/* ===== languages (dictionaries in src/lang.js) =====
   tr(text) translates a text for files and PDFs; tr('@key',{..}) fills a longer template.
   On screen, every text node is matched against the language's words while it is not English. */
let LANG = 'en';
try {
  const l = localStorage.getItem('kast-lang');
  if (l && LANGS[l]) LANG = l;
} catch (e) {
  oops('boot #4', e, 1);
}
function tr(k, v) {
  const L = LANGS[LANG] || LANG_EN;
  if (k === '@date') return L.date || LANG_EN.date;
  if (k[0] === '@') {
    const f = L[k] || LANG_EN[k];
    return typeof f === 'function' ? f(v || {}) : String(f || k);
  }
  if (LANG === 'en') return k;
  const w = (L.words || {})[k];
  if (w != null) return w;
  for (const [re, to] of L.patterns || []) if (re.test(k)) return k.replace(re, to);
  return k;
}
const TRN = new Map(),
  TRA = ['placeholder', 'title', 'aria-label'];
function trOf(t) {
  const k = t.trim();
  if (!k) return null;
  let v = tr(k);
  if (v === k) {
    const m = /^([^\p{L}\d]+)(\p{L}.*)$/u.exec(k);
    if (m) {
      const w = tr(m[2]);
      if (w !== m[2]) v = m[1] + w;
    }
  }
  return v === k ? null : t.replace(k, v);
}
function trText(n) {
  const v = n.nodeValue;
  if (!v || v.length > 300) return;
  const t = trOf(v);
  if (t != null) {
    TRN.set(n, v);
    n.nodeValue = t;
  }
}
function trTree(root) {
  if (LANG === 'en' || !root) return;
  if (root.nodeType === 3) {
    trText(root);
    return;
  }
  if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA)$/.test(root.tagName)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: n =>
      n.nodeType === 1 && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.tagName)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT
  });
  let n = root;
  do {
    if (n.nodeType === 3) trText(n);
    else
      TRA.forEach(a => {
        const v = n.getAttribute && n.getAttribute(a);
        if (v) {
          const t = trOf(v);
          if (t != null) n.setAttribute(a, t);
        }
      });
  } while ((n = w.nextNode()));
}
let trQ = [],
  trRaf = 0;
const trObs = new MutationObserver(ms => {
  if (LANG === 'en') return;
  ms.forEach(m => {
    if (m.type === 'characterData') {
      if (TRN.get(m.target) !== m.target.nodeValue) trQ.push(m.target);
    } else m.addedNodes.forEach(x => trQ.push(x));
  });
  if (!trRaf)
    trRaf = requestAnimationFrame(() => {
      trRaf = 0;
      const q = trQ;
      trQ = [];
      trObs.disconnect();
      q.forEach(trTree);
      trWatch();
    });
});
function trWatch() {
  if (LANG !== 'en') trObs.observe(document.body, { childList: true, subtree: true, characterData: true });
}
function setLang(l) {
  if (!LANGS[l]) l = 'en';
  LANG = l;
  try {
    localStorage.setItem('kast-lang', l);
  } catch (e) {
    oops('boot #5', e, 1);
  }
  document.documentElement.lang = l;
  trObs.disconnect();
  TRN.forEach((v, n) => {
    if (n.isConnected) n.nodeValue = v;
  });
  TRN.clear();
  if (l !== 'en') {
    trTree(document.body);
    trWatch();
  }
  try {
    renderSide();
    renderBar();
    renderTab(ui.tab);
  } catch (e) {
    oops('boot #6', e);
  }
  langBtns();
}
function langBtns() {
  const ks = Object.keys(LANGS),
    many = ks.length > 1;
  document.querySelectorAll('[data-act="lang"]').forEach(b => {
    b.hidden = !many;
    b.textContent = (b.dataset.m ? '🌐 ' : '') + (LANGS[ks[(ks.indexOf(LANG) + 1) % ks.length]] || LANG_EN).name;
  });
}
langBtns();
if (LANG !== 'en') setTimeout(() => setLang(LANG), 0);
/* comments: open claude.ai's own comment box, pinned to the drawing or a column */
(async () => {
  try {
    if (window.claude && claude.use) CMT = await claude.use('comments');
  } catch (e) {
    CMT = null;
  }
  if (CMT) document.querySelectorAll('.cmtb').forEach(b => (b.hidden = false));
})();
async function cmtOpen(el) {
  if (!CMT || !el) return;
  try {
    const r = await CMT.openComposer({ element: el });
    if (r && !r.opened) toast('Finish the comment that is already open first');
  } catch (e) {
    if (e && e.code === 'unavailable') {
      CMT = null;
      document.querySelectorAll('.cmtb').forEach(b => (b.hidden = true));
      toast('Comments are not available in this view');
    } else if (e && e.code === 'rate_limited') toast('One moment — try again in a few seconds');
  }
}
try {
  const stg = document.querySelector('.stage'),
    setH = () => {
      document.documentElement.style.setProperty(
        '--stageH',
        (innerWidth <= 860 && getComputedStyle(stg).position === 'sticky' ? stg.offsetHeight : 0) + 'px'
      );
    };
  new ResizeObserver(setH).observe(stg);
  addEventListener('resize', setH);
  setH();
} catch (e) {
  oops('boot #7', e);
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (T3 && ui.tab === '3d') {
    dirty['3d'] = true;
    renderTab('3d');
  }
});
