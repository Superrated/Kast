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
  await step('design step', () => {
    showTab('3d');
    pnGo('list');
    document.querySelector('[data-act=step][data-a=design]').click();
    if (ui.tab !== '3d') throw new Error('Design did not return to 3D, got ' + ui.tab);
    showTab('elev');
  });
  await step('four steps', () => {
    const side = () => getComputedStyle(document.getElementById('side')).display !== 'none';
    for (const [s, panes, sideOn] of [['room', ['room'], true], ['design', ['layout', 'look', 'build'], true], ['order', null, false], ['build', null, false]]) {
      document.querySelector(`[data-act=step][data-a=${s}]`).click();
      if (stepNow() !== s) throw new Error(`step ${s}: got ${stepNow()}`);
      if (document.querySelector('.app').dataset.step !== s) throw new Error(`step ${s}: page not marked`);
      if (side() !== sideOn) throw new Error(`step ${s}: settings panel ${sideOn ? 'hidden' : 'shown'}`);
      if (panes) {
        const tabs = [...document.querySelectorAll('#side .spane [data-act=pane]')].map(b => b.dataset.a);
        if (panes.length > 1 && tabs.join() !== panes.join()) throw new Error(`step ${s}: side tabs ${tabs}`);
        if (!panes.includes(ui.pane)) throw new Error(`step ${s}: pane ${ui.pane}`);
      } else if (!document.querySelector(`#v-${ui.tab} .pnav`)) throw new Error(`step ${s}: no sub-tabs`);
    }
    for (const k of ['list', 'sheets', 'buy', 'price', 'tech', 'loft', 'files', 'work', 'guide']) {
      pnGo(k);
      const on = document.querySelector(`#v-${ui.tab} .pnav [data-a=${k}].on`);
      if (!on) throw new Error(`sub-tab ${k} not lit`);
    }
    document.querySelector('[data-act=step][data-a=design]').click();
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
  await step('cut-outs in machining drawings', () => {
    const gs = groupPanels(bgeo());
    gs.filter(g => (g.holes || []).some(h => h.poly)).forEach(g => {
      const rows = mdCutRows(g);
      if (!rows.length || rows.some(r => !r.what || !r.where.length)) throw new Error(g.id + ' has cut-outs but no sizes');
      if (!/Cut-out/.test(mdBlock(g, false))) throw new Error(g.id + ': no cut-out table in its drawing');
    });
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
