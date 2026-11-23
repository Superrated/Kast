/* ==== 93-steps.js ====
   The four steps of the app, the same on a computer (top bar) and a phone (bottom bar):
     1 Room   — the wall: size, slopes, beams, sockets…          side panel: Room · drawing / 3D
     2 Design — the cabinet: columns, look, construction         side panel: Layout · Look · Construction · drawing / 3D
     3 Order  — parts, sheets, shopping, price, drawings, files  full width (91-parts-nav.js)
     4 Build  — workshop (cut, assemble, build steps), guide     full width (91-parts-nav.js)
   The step follows from the view that is open (ui.tab); Room and Design share the drawing, so ui.step tells them apart.
   .app[data-step] lets the CSS hide the side panel in Order and Build.
*/
const STEPS = ['room', 'design', 'order', 'build'];
const STEP_PANES = { room: ['room'], design: ['layout', 'look', 'build'] };
function stepNow() {
  const g = PN_GROUP[ui.tab];
  if (g) return g;
  return ui.step === 'room' ? 'room' : 'design';
}
function stepGo(s) {
  if (!STEPS.includes(s)) s = 'design';
  if (s === 'room' || s === 'design') {
    ui.step = s;
    const ok = STEP_PANES[s];
    if (!ok.includes(ui.pane))
      ui.pane = s === 'room' ? 'room' : ui.dpane && ok.includes(ui.dpane) ? ui.dpane : 'layout';
    showTab(ui.dmode || 'elev');
    renderSide();
    const sd = document.getElementById('side');
    if (sd) sd.scrollTop = 0;
  } else pnGo(s === 'order' ? PN.osub || 'list' : PN.bsub || 'work');
  stepsOn();
}
function stepsOn() {
  const s = stepNow(),
    ap = document.querySelector('.app');
  if (ap) ap.dataset.step = s;
  document.body.dataset.step = s;
  document.querySelectorAll('[data-act="step"]').forEach(x => {
    const on = x.dataset.a === s;
    x.classList.toggle('on', on);
    x.setAttribute('aria-current', on ? 'step' : 'false');
  });
}
/* the side-panel tabs that belong to the current step */
function stepPanes() {
  return STEP_PANES[stepNow()] || STEP_PANES.design;
}
/* Settings in the ☰ menu: how much the side panel shows, and experimental features */
function mmSetHTML() {
  return `<div class="mmrow"><span>Settings shown</span><div class="seg" role="group" aria-label="How much to show"><button type="button" class="${ui.simple ? 'on' : ''}" data-act="viewMode" data-a="s">Simple</button><button type="button" class="${ui.simple ? '' : 'on'}" data-act="viewMode" data-a="x">Expert</button></div></div><label class="chk mmchk"><input type="checkbox" data-act="expMode" ${expOn() ? 'checked' : ''}> Experimental: more walls in one room and corner cabinets</label>`;
}
function mmSetPut() {
  const el = document.getElementById('mmset');
  if (el) el.innerHTML = mmSetHTML();
}
