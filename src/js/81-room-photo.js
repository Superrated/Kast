/* ==== 81-room-photo.js ====
   Lining the design up with a photo of the room.
*/
/* ===== room photo, lined up in 3D ===== */
const APP_VERSION = 'v0.124';
const PH = {
  src: null,
  iw: 0,
  ih: 0,
  pts: [],
  edges: {},
  pose: null,
  op: 1,
  lens: 1,
  cur: 0,
  k1: 0,
  f35: 0,
  light: true
};
/* up to three photos of the room, each with its own line-up; PH always holds the one in use */
const PHF = [
    'src',
    'src0',
    'img',
    'img0',
    'iw',
    'ih',
    'pts',
    'edges',
    'manual',
    'fAuto',
    'autoN',
    'k1',
    'f35',
    'lens',
    'occ'
  ],
  PHS = [];
let phCur = 0;
const phBlank = () => ({
  src: null,
  src0: null,
  img: null,
  img0: null,
  iw: 0,
  ih: 0,
  pts: [],
  edges: {},
  manual: {},
  fAuto: 0,
  autoN: 0,
  k1: 0,
  f35: 0,
  lens: 1,
  occ: []
});
function phStore() {
  const o = {};
  PHF.forEach(k => (o[k] = PH[k]));
  if (o.src0 || o.src) PHS[phCur] = o;
  else if (PHS[phCur]) PHS.splice(phCur, 1);
}
function phUse(i, then) {
  phStore();
  phCur = Math.max(0, Math.min(i, PHS.length));
  Object.assign(PH, phBlank(), PHS[phCur] || {}, { pose: null, H: null, _la: null, _g: null, zoom: null, cur: 0 });
  const fin = () => {
    try {
      if (PH.img) solvePhoto();
    } catch (e) {
      oops('room-photo #1', e);
    }
    then && then();
  };
  if (PH.img0 && PH.k1 && PH.src === PH.src0) photoWarp(PH.k1, fin, true);
  else fin();
}
function phCount() {
  phStore();
  return PHS.filter(o => o && (o.src0 || o.src)).length;
}
function phChips() {
  const n = phCount();
  if (n < 1) return '';
  let h = '';
  for (let i = 0; i < n; i++)
    h += `<button type="button" class="btn sm ${i === phCur ? 'on' : ''}" data-act="phSlot" data-a="${i}" aria-label="Photo ${i + 1}">${i + 1}</button>`;
  if (n < 3)
    h += `<button type="button" class="btn sm" data-act="phSlot" data-a="${n}" title="Add another photo, from a different angle">+ photo</button>`;
  return h;
}
try {
  const sv = JSON.parse(localStorage.getItem('kast-photo') || 'null');
  if (sv) {
    const slots =
      sv.v === 3
        ? sv.slots || []
        : sv.src
          ? [sv.v === 2 ? sv : { src: sv.src, pts: (sv.pts || []).slice(0, 4), lens: sv.lens }]
          : [];
    PH.op = sv.op ?? 1;
    PH.light = sv.light !== false;
    PH.look = sv.look !== false;
    PH.keep = !!sv.keep;
    slots.slice(0, 3).forEach((o, i) => {
      if (!o || !o.src) return;
      const rec = Object.assign(phBlank(), {
        src: o.src,
        src0: o.src,
        pts: o.pts || [],
        edges: o.edges || {},
        manual: o.manual || {},
        fAuto: o.fAuto || 0,
        autoN: o.autoN || 0,
        k1: o.k1 || 0,
        f35: o.f35 || 0,
        lens: o.lens || 1,
        occ: Array.isArray(o.occ) ? o.occ : []
      });
      PHS[i] = rec;
      const im = new Image();
      im.onload = () => {
        rec.iw = im.naturalWidth;
        rec.ih = im.naturalHeight;
        rec.img = rec.img0 = im;
        if (i === phCur) {
          Object.assign(PH, rec);
          const fin = () => {
            try {
              solvePhoto();
            } catch (e) {
              oops('room-photo #2', e);
            }
          };
          if (PH.k1) photoWarp(PH.k1, fin, true);
          else fin();
        }
      };
      im.src = o.src;
    });
    phCur = Math.max(0, Math.min(+sv.cur || 0, PHS.length - 1));
    if (PHS[phCur]) Object.assign(PH, PHS[phCur]);
  }
} catch (e) {
  oops('room-photo #3', e);
}
function photoSave() {
  try {
    phStore();
    localStorage.setItem(
      'kast-photo',
      JSON.stringify({
        v: 3,
        cur: phCur,
        keep: !!PH.keep,
        op: PH.op,
        light: PH.light !== false,
        look: PH.look !== false,
        slots: PHS.filter(o => o && (o.src0 || o.src)).map(o => ({
          src: o.src0 || o.src,
          pts: o.pts,
          edges: o.edges || {},
          manual: o.manual || {},
          fAuto: o.fAuto || 0,
          autoN: o.autoN || 0,
          k1: o.k1 || 0,
          f35: o.f35 || 0,
          lens: o.lens || 1,
          occ: o.occ || []
        }))
      })
    );
  } catch (e) {
    toast('The photos are too big to keep after a reload — they work for now.');
  }
}
/* the cabinet drawn into each lined-up photo, as pictures (for the PDF) */
async function photoShots() {
  const out = [];
  if (!window.THREE) return out;
  try {
    if (!T3) {
      if (!init3D()) return out;
      rebuild3D();
    }
  } catch (e) {
    return out;
  }
  phStore();
  const cur0 = phCur,
    on0 = ui.photoOn,
    adj0 = PH.adjust,
    n = PHS.length;
  for (let i = 0; i < n; i++) {
    const o = PHS[i];
    if (!o || !o.img) continue;
    try {
      await new Promise(r => phUse(i, r));
      if (!PH.pose) continue;
      ui.photoOn = true;
      const w = Math.min(1600, PH.iw),
        h = Math.round((w * PH.ih) / PH.iw);
      T3.renderer.setSize(w, h, false);
      T3.scene.background = null;
      try {
        applyExplode(true);
      } catch (e) {
        oops('room-photo #4', e);
      }
      photoShadow();
      try {
        photoLight();
      } catch (e) {
        oops('room-photo #5', e);
      }
      photoCam();
      T3.renderer.render(T3.scene, T3.cam);
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const x = cv.getContext('2d');
      x.drawImage(PH.img, 0, 0, w, h);
      try {
        x.filter = T3.renderer.domElement.style.filter || 'none';
      } catch (e) {
        oops('room-photo #6', e);
      }
      x.drawImage(T3.renderer.domElement, 0, 0, w, h);
      x.filter = 'none';
      (PH.occ || []).forEach(sh => {
        if (sh.length < 3) return;
        x.save();
        x.beginPath();
        sh.forEach((q, k) => {
          const X = (q[0] * w) / PH.iw,
            Y = (q[1] * h) / PH.ih;
          k ? x.lineTo(X, Y) : x.moveTo(X, Y);
        });
        x.closePath();
        x.clip();
        x.drawImage(PH.img, 0, 0, w, h);
        x.restore();
      });
      out.push(cv);
    } catch (e) {
      oops('room-photo #7', e);
    }
  }
  await new Promise(r => phUse(cur0, r));
  ui.photoOn = on0;
  PH.adjust = adj0;
  try {
    setPhotoMode(on0);
  } catch (e) {
    oops('room-photo #8', e);
  }
  return out;
}
const photoActive = () => !!(ui.photoOn && PH.pose && PH.img);
