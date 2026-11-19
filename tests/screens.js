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
  await step('workshop boxes', () => { wxOpen(); WX.t = 1; wxApplyT(); wxDraw(); ui.ws = null; wsRender() });
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
