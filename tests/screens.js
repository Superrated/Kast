/* Runs inside the Fitted page (tests/run.py): opens one design and goes through every screen and export
   that does not need a person (no file dialogs): the tabs, the workshop 3D boxes, the technical drawing
   sheets, the DXF and both shop forms. Returns the problems reported on the way. */
(async st => {
  OOPS.length = 0;
  const done = [];
  const step = async (name, fn) => { try { await fn(); done.push(name) } catch (e) { oops('test: ' + name, e) } };
  S = JSON.parse(JSON.stringify(st)); groupsCache = null; geo = build(S);
  await step('views', () => { renderSide(); renderViews() });
  for (const t of ['elev', '3d', 'guide', 'cut', 'sheets', 'draw', 'loft', 'work'])
    await step('tab ' + t, () => showTab(t));
  await step('design tab', () => {
    showTab('3d');
    pnGo('cut');
    document.querySelector('[data-act=tab][data-a=design]').click();
    if (ui.tab !== '3d') throw new Error('Design did not return to 3D, got ' + ui.tab);
    showTab('elev');
  });
  await step('sizes', () => {
    const f = geo.fronts.find(f => f.kind === 'door');
    if (f) {
      const xs = f.poly.map(p => p[0]), ys = f.poly.map(p => p[1]);
      const s = sizeAt((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2);
      if (!s || !/Door/.test(s.title)) throw new Error('no door size: ' + JSON.stringify(s));
    }
  });
  await step('workshop boxes', () => { wxOpen(); WX.t = 1; wxApplyT(); wxDraw(); ui.ws = null; wsRender() });
  await step('assembly step by step', () => {
    WX.col = 0; WX.step = null; wxOpen(); wxMode('steps');
    if (!WX.r || WX.r.noGL) return; // no 3D in this browser
    const n = WX.r.steps.length;
    if (n < 3) throw new Error('only ' + n + ' steps');
    for (let i = 0; i < n; i++) wxStepGo(i, true);
    const hidden = WX.r.parts.filter(p => !p.grp.visible).length;
    if (hidden) throw new Error(hidden + ' parts still hidden at the last step');
    wxMode('apart'); ui.ws = null; wsRender();
  });
  await step('drawing sheets', () => { const r = tdSheets(); if (!r.sheets.length) throw new Error('no sheets') });
  await step('dxf', () => tdDXF());
  for (const shop of ['hh', 'wc'])
    await step('form ' + shop, async () => { const b = await shopFormXlsx(shop); if (!b || !b.size) throw new Error('empty form') });
  await step('order checklist', () => {
    pnGo('buy');
    const b = document.querySelector('[data-act=buyTap]');
    if (!b) throw new Error('no checklist lines');
    const key = b.dataset.a;
    b.click();
    lockOn();
    document.querySelector(`[data-act=buyTap][data-a="${CSS.escape(key)}"]`).click();
    const s = ((S.done.buy || {}).items || {})[key];
    if (!s || s.s !== 'here') throw new Error('status not kept while locked: ' + JSON.stringify(s));
    lockOff();
  });
  showTab('elev');
  return { done, problems: OOPS.filter(o => !o.quiet).map(o => o.where + ': ' + o.msg) };
})
