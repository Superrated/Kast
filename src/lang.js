/* ============================================================
   Fitted — languages.
   The app is written in English. To add a language, add an entry to LANGS
   below (copy the commented example). build.py copies this file into the app.

   Each language has:
     name      the name shown in the language menu (in that language)
     date      the locale used for dates, e.g. 'nl-BE', 'fr-BE'
     words     { 'English text exactly as on screen': 'translation' }
               — buttons, labels, headings, and the texts in the shop files.
     patterns  [ [/regular expression/, 'replacement with $1'], ... ]
               — for texts with numbers in them, e.g. [/^(\d+) columns$/,'$1 kolommen']
     '@...'    longer texts with {placeholders}, see LANG_EN below for the full list.

   As soon as there is more than one language, a language button appears
   in the header and in the phone menu. Texts that have no translation stay in English.
   ============================================================ */

/* English: the templates for the longer texts. Every other language may translate these. */
const LANG_EN={
  name:'English',date:'en-GB',
  '@mail':({shop,n,kinds,project,band})=>`Dear ${shop},\n\nPlease find attached my cut list (${n} parts, ${kinds} different sizes) for the project "${project}". Could you cut${band?' and edge-band (see the columns L1/L2/W1/W2)':''} them for me? Please let me know the price and when I can collect them.\n\nKind regards,\n`,
  '@b.wall':({W,H,D})=>`Wall ${W} mm wide, ceiling up to ${H} mm high, cabinet ${D} mm deep.`,
  '@b.slope':({pts})=>`Sloping ceiling: ${pts} (distance from the left → height, mm).`,
  '@b.beam':({i,x,w,y})=>`Beam ${i}: from ${x} mm, ${w} mm wide, underside at ${y} mm.`,
  '@b.level':({f,l,r})=>`Floor and walls not straight: floor at the right ${f} mm, walls lean ${l} / ${r} mm at the top.`,
  '@b.wobs':({n})=>`${n} socket(s) or other things on the wall — see the drawing.`,
  '@b.cols':({n,ws})=>`${n} columns: ${ws} mm (inside widths).`,
  '@b.fronts':({d,r})=>`${d} doors, ${r} drawers.`,
  '@b.build':({how,p})=>`Built as ${how}, plinth ${p} mm, closing strips to the ceiling and side walls scribed to fit.`,
};

const LANGS={
  en:LANG_EN,
  /* Example — remove the comment marks to switch it on, then add more words:
  nl:{name:'Nederlands',date:'nl-BE',
    words:{'Cut list':'Zaaglijst','Doors':'Deuren','Drawers':'Laden','Next':'Volgende','Back':'Terug'},
    patterns:[[/^(\d+) columns$/,'$1 kolommen']],
    '@b.fronts':({d,r})=>`${d} deuren, ${r} laden.`},
  */
};
