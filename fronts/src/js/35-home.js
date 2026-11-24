/* ==== 35-home.js ====
   The landing page, before the configurator: a large render, what BRUIS does in one line, three steps,
   the demos with their price, the sample box and plan check, and a few plain facts.
   The pictures are made by the same renderer as the stage (25-3d.js), while the browser is idle. */
function homeHTML() {
  const d0 = demoState(0),
    hero =
      innerWidth <= 860
        ? thumbHTML('hero', d0, designThumb('demo0', d0), 960, 720)
        : thumbHTML('hero', d0, designThumb('demo0', d0), 1800, 860),
    demos = DEMOS.map((d, i) => {
      const st = demoState(i);
      return `<button type="button" class="hdemo" data-act="demoGo" data-a="${i}"><span class="tpic">${thumbHTML('demo' + i, st, designThumb('demo' + i, st))}</span><span class="hdl"><b>${esc(d.name)}${d.trend ? ' <em class="tag27">2027</em>' : ''}</b><em>${eur(priceOfDesign(st))}</em></span><small>${SYS[d.sys].name}, ${esc(d.say.charAt(0).toLowerCase() + d.say.slice(1))}</small></button>`;
    }).join(''),
    chips = Object.keys(COLOURS)
      .map(k => `<i style="background:${colHex(k)}" title="${esc(COLOURS[k].name)}"></i>`)
      .join('');
  return `<div class="hero"><div class="hpic">${hero}</div>
    <div class="htext"><h1>Your IKEA cabinets, with fronts made for your home.</h1>
      <p>Paste your IKEA list, see your kitchen or wardrobe in the room, and get the price straight away. Made to measure in Belgium, for PAX, METOD and BESTÅ.</p>
      <div class="hcta"><button type="button" class="btn pri" data-act="goPaste">Paste your IKEA list</button><button type="button" class="btn" data-act="step" data-a="cabs">Start without a list</button></div>
    </div></div>
    <section class="hsec hsteps"><h2>How it works</h2><ol>
      <li><b>Paste your IKEA list</b><span>From the IKEA planner, your cart or your order. We read the cabinets and their sizes in seconds — no drawings, no waiting for a quote.</span></li>
      <li><b>Choose your fronts</b><span>Effen, Riet or Voeg; twelve colours, oak, walnut or plywood; edges, side panels and handles. You see it in the room as you go.</span></li>
      <li><b>We check, make and deliver</b><span>We go through every size with you before anything is cut, make your fronts to measure and deliver them drilled for your IKEA hinges.</span></li></ol></section>
    <section class="hsec"><div class="hhead"><h2>Start from a design</h2><p>Open one, then change anything. Prices are for the whole design, delivered.</p></div><div class="hdemos">${demos}</div></section>
    <section class="hsec h27"><div class="h27t"><h2>The 2027 edit</h2>
      <p>Next year belongs to green — soft sage and celery, olive and deep forest — with warm taupes and clay browns beside it. Kitchens get darker woods, two woods together, painted borders, mixed metals and feet, so they stand like furniture. We added all of it to the range.</p>
      <button type="button" class="btn" data-act="trend">Try a 2027 look</button></div>
      <div class="h27c">${Object.entries(COLOURS)
        .filter(([, c]) => c.trend)
        .concat([
          ['sage', COLOURS.sage],
          ['racing', COLOURS.racing],
          ['oxblood', COLOURS.oxblood]
        ])
        .map(
          ([k, c]) => `<span><i style="background:${colHex(k)}"></i>${esc(c.name)}<small>RAL ${c.ral}</small></span>`
        )
        .join('')}</div></section>
    <section class="hsec hsplit">
      <div class="hcard"><div class="hchips">${chips}</div><h3>The sample box</h3><p>Every colour and material as a 10 × 15 cm chip, with the real edge and a piece of each profile. ${eur(EXTRAS.sampleBox)}, taken off your order later.</p><button type="button" class="btn" data-act="samples">Order samples</button></div>
      <div class="hcard"><h3>Free plan check</h3><p>Not sure your IKEA list is right? Before anything is cut, we go through every cabinet and size with you — and tell you if a filler strip or side panel would make it look built in.</p><button type="button" class="btn" data-act="goPaste">Paste your list</button></div>
    </section>
    <section class="hsec hfacts"><ul>
      <li><b>Made to measure in Belgium</b><span>Cut, routed and finished in our own workshop; painted by a local spray shop.</span></li>
      <li><b>Fits your IKEA hinges</b><span>Drilled for the IKEA hinges and drawers you already have. Keep your frames, change the look.</span></li>
      <li><b>Clear prices</b><span>The price you see is the price you pay, with free delivery from ${eur(PRICE.deliveryFree)}.</span></li></ul></section>
    <section class="hsec hfaq"><h2>Questions</h2>${[
      [
        'Do I need to buy IKEA’s doors too?',
        'No. At IKEA you buy the frames or cabinets, the hinges, the drawers and the legs — everything except the fronts. Our fronts are drilled for those IKEA hinges and drawers.'
      ],
      [
        'Which IKEA cabinets do you make fronts for?',
        'PAX wardrobes, METOD kitchens and BESTÅ storage. Side panels, plinths and filler strips come in the same look.'
      ],
      [
        'How long does it take?',
        'Most fronts are made in about three to four weeks; painted fronts take one to two weeks longer, because they go to our spray shop.'
      ],
      [
        'What if a size is wrong?',
        'That is what the free plan check is for: we go through your IKEA list and every size with you before anything is cut.'
      ],
      [
        'Can I paint the budget fronts myself?',
        'Yes. Raw MDF and untreated birch ply come sanded and ready for your own paint, oil or wax — prime MDF first, front and back.'
      ],
      [
        'Can I see the colours first?',
        `Yes — the sample box has every colour and material as a 10 × 15 cm chip, ${eur(EXTRAS.sampleBox)}, taken off your order later.`
      ]
    ]
      .map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`)
      .join('')}</section>
    <footer class="hfoot"><b>BRUIS</b><span>Fronts for IKEA PAX, METOD and BESTÅ. A prototype: nothing can be ordered yet.</span></footer>`;
}
