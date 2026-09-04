/* ==========================================================================
   make-sample-data.js
   --------------------------------------------------------------------------
   Generates data/sample-results.json and data/sample-results.csv so the
   dashboard can be demonstrated before real participants exist.

   It builds the sessions by hand and then runs them through the study's OWN
   flatten/toCSV code, so the sample files cannot drift away from the real
   export format. If the export changes, re-run this and they match again.

   Run:  node tools/make-sample-data.js

   THE NUMBERS IN HERE ARE INVENTED. Delete data/sample-results.* before you
   publish if you would rather nobody could mistake them for findings.
   ========================================================================== */

// --- minimal browser shims so the study's files load under node ----------
global.window = global;
global.navigator = { maxTouchPoints: 0 };
global.document = { addEventListener: function () {} };
global.localStorage = {
  _d: {},
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
  setItem: function (k, v) { this._d[k] = String(v); },
  removeItem: function (k) { delete this._d[k]; }
};
window.innerWidth = 1440;
window.innerHeight = 900;

require('../js/questions.js');
require('../js/data-handler.js');

var A = window.CC_ASSETS;
var D = window.CC_DATA;
var O = window.CC_OPTIONS;

var N = 24;                     // participants
var CORE = A.core.map(function (a) { return a.id; });
var PROC = A.process.map(function (a) { return a.id; });
var DIST = A.distractors.map(function (a) { return a.id; });

// deterministic RNG so the sample file is stable between runs
var seed = 20260904;
function rnd() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function chance(p) { return rnd() < p; }
function clamp5(n) { return Math.max(1, Math.min(5, Math.round(n))); }

/* Invented per-candidate tendencies, only so the dashboard has something with
   shape to display rather than noise. These are NOT predictions. */
var TEND = {
  core_29_empty_frame:  { trust: 3.0, warm: 2.6, clear: 2.5, part: 4.1, dist: 3.9, hand: 3.2, onTarget: 0.42 },
  core_30_single_block: { trust: 3.2, warm: 2.9, clear: 3.6, part: 2.4, dist: 2.3, hand: 2.6, onTarget: 0.38 },
  core_28_double_band:  { trust: 3.6, warm: 3.2, clear: 3.4, part: 3.5, dist: 3.4, hand: 3.4, onTarget: 0.58 },
  core_31_slice_light:  { trust: 4.1, warm: 3.9, clear: 4.2, part: 3.6, dist: 3.8, hand: 3.7, onTarget: 0.79 },
  core_32_slice_dark:   { trust: 4.0, warm: 3.5, clear: 4.0, part: 3.4, dist: 4.1, hand: 3.3, onTarget: 0.75 }
};

var REASONS = {
  bakery: ['The layers look like a cake in cross section.', 'The stacked shapes read as tiers.', 'It looks like a slice on a plate.'],
  tool_kit: ['It feels like a diagram or a set of parts.', 'The outline looks like a template to fill in.'],
  other: ['Honestly not sure what it is.', 'Looks architectural to me.', 'Could be furniture.']
};
var WHY_TRUST = ['Clean and deliberate, feels professional.', 'A bit unfinished for a real shop.', 'Simple enough that I would trust it.', 'The empty outline makes it feel unresolved.', 'Feels handmade in a good way.'];
var WHY_FINAL = ['It is the clearest and still feels warm.', 'The slice makes it obvious without spelling it out.', 'It felt the most like something I could take part in.', 'The plain block was too anonymous.', 'It looked the most finished of the set.'];
var WHY_ROLE  = ['The empty frame suggests you fill it in yourself.', 'It looks like a step in building something.', 'Feels like it comes ready made.', 'It looks like it is showing you how.'];

var sessions = [];

for (var i = 0; i < N; i++) {
  var rot = i % 5;
  var lang = chance(0.3) ? 'fa' : 'en';
  var complete = chance(0.87);

  // rotated incomplete-block sampling, same idea the live study uses
  var g1Assets = [CORE[rot % 5], CORE[(rot + 2) % 5]];
  var g3Assets = [CORE[(rot + 1) % 5], CORE[(rot + 3) % 5]];
  var g9Asset  = CORE[(rot + 4) % 5];
  var g10Asset = PROC[rot % 5];

  var games = { game1: {}, game3: {}, game9: {} };

  g1Assets.forEach(function (id) {
    var t = TEND[id];
    var on = chance(t.onTarget);
    var cat = on ? pick(['bakery', 'decoration', 'tool_kit']) : pick(['cafe', 'gift', 'kids', 'other']);
    games.game1[id] = {
      category: cat,
      confidence: clamp5(on ? 3.6 + rnd() * 1.4 : 2.2 + rnd() * 1.6),
      reason: pick(REASONS[cat === 'bakery' ? 'bakery' : (cat === 'tool_kit' ? 'tool_kit' : 'other')] || REASONS.other)
    };
  });

  g3Assets.forEach(function (id) {
    var t = TEND[id];
    var words = [];
    if (chance(t.warm / 5)) words.push('warm');
    if (chance(t.hand / 5)) words.push('handmade');
    if (chance(t.dist / 5)) words.push('modern');
    if (chance(t.part / 5)) words.push('personal');
    if (chance(0.45)) words.push('simple');
    if (chance((5 - t.clear) / 6)) words.push('confusing');
    if (chance((5 - t.clear) / 7)) words.push('unfinished');
    if (chance(0.3)) words.push('creative');
    if (!words.length) words.push('simple');
    games.game3[id] = { words: words, reason: pick(['The rounded corners feel friendly.', 'The thin outline feels unfinished.', 'The diagonal cut is the part I noticed.', 'The stacked bands look like layers.']) };
  });

  var t9 = TEND[g9Asset];
  games.game9[g9Asset] = { sliders: {
    warmth: clamp5(t9.warm + (rnd() - 0.5)),
    distinctive: clamp5(t9.dist + (rnd() - 0.5)),
    participatory: clamp5(t9.part + (rnd() - 0.5)),
    handmade: clamp5(t9.hand + (rnd() - 0.5)),
    clarity: clamp5(t9.clear + (rnd() - 0.5)),
    flexible: clamp5(3.2 + (rnd() - 0.5))
  } };

  // Game 2 - recognition against the authored wordless foils
  var target = CORE[(rot + 3) % 5];
  var opts = [target, pick(DIST), pick(DIST), CORE[(rot + 1) % 5]];
  var got = chance(0.66);
  games.game2 = {
    choice: got ? target : (chance(0.8) ? pick(DIST) : 'none'),
    confidence: clamp5(got ? 3.5 + rnd() * 1.5 : 2 + rnd() * 2)
  };

  // Game 7 - trust across the whole core set
  var scores = {};
  CORE.forEach(function (id) { scores[id] = clamp5(TEND[id].trust + (rnd() - 0.5) * 1.3); });
  games.game7 = { scores: scores, reason: pick(WHY_TRUST) };

  // Game 10 - brand role, on a wordless process asset
  var step = A.byId(g10Asset).step;
  games.game10 = {
    role: chance(step >= 2 ? 0.62 : 0.44) ? 'helps_build' : pick(['makes_for_you', 'teaches', 'other']),
    reason: pick(WHY_ROLE)
  };

  // Game 13 - system flexibility, full lockups
  games.game13 = {
    family_score: clamp5(3.7 + (rnd() - 0.5) * 1.6),
    connector: pick(['frame', 'layers', 'slice', 'typography', 'proportion']),
    // Game 13 shows the FLEXIBILITY assets, so the anchor and weakest votes
    // must be flexibility ids — not core candidate ids. Picking from CORE
    // here produced votes that no dashboard section could ever attribute.
    anchor: pick(A.flexibility.map(function (a) { return a.id; })),
    weakest: pick(A.flexibility.map(function (a) { return a.id; }))
  };

  // Game 23 - final decision
  var fin = chance(0.62) ? pick(['core_31_slice_light', 'core_32_slice_dark']) : pick(CORE);
  games.game23 = {
    choice: fin,
    memorable: chance(0.7) ? fin : pick(CORE),
    cake_related: chance(0.72) ? pick(['core_31_slice_light', 'core_32_slice_dark']) : pick(CORE),
    flexible: pick(CORE),
    participatory: chance(0.5) ? 'core_29_empty_frame' : pick(CORE),
    reason: pick(WHY_FINAL)
  };

  if (!complete) { delete games.game13; delete games.game23; }

  sessions.push({
    participant_id: 'sample-' + String(i + 1).padStart(3, '0'),
    study: 'cakecue-identity-lab',
    version: '1.0.0',
    mode: 'core',
    language: lang,
    timestamp: new Date(Date.UTC(2026, 8, 1 + (i % 4), 9 + (i % 9), (i * 7) % 60)).toISOString(),
    completed_at: complete ? new Date(Date.UTC(2026, 8, 1 + (i % 4), 9 + (i % 9), ((i * 7) % 60) + 6)).toISOString() : null,
    completion_time: complete ? Math.round(280 + rnd() * 240) : null,
    rotation: rot,
    device: { width: chance(0.45) ? 390 : 1440, height: chance(0.45) ? 844 : 900, touch: chance(0.45) },
    profile: {
      age_range: pick(O.profile ? ['18-24', '25-34', '35-44', '45-54', '55+'] : ['25-34']),
      cake_buying_frequency: pick(['rarely', 'few_times_year', 'monthly', 'weekly']),
      cake_making_or_decorating_experience: pick(['none', 'a_little', 'confident', 'professional']),
      bakes_at_home: pick(['yes', 'no']),
      what_matters_most: pick(['taste', 'design', 'price', 'personalisation'])
    },
    // The assignment records WHICH assets this participant was shown. The
    // dashboard needs it to work out shares correctly: a vote only counts
    // against the marks that were actually on screen as alternatives.
    // Mirrors Session.assign() in data-handler.js.
    assignment: {
      game1: g1Assets,
      game3: g3Assets,
      game9: [g9Asset],
      game10: PROC.slice(),
      game2: { target: target, lineup: opts },
      game7: CORE.slice(),
      game13: A.flexibility.map(function (a) { return a.id; }),
      game23: CORE.slice()
    },
    games: games,
    timings: {}
  });
}

var fs = require('fs');
fs.writeFileSync('data/sample-results.json', JSON.stringify(sessions, null, 2));
fs.writeFileSync('data/sample-results.csv', D.Results.toCSV(sessions));

var flat = D.flatten(sessions[0]);
console.log('wrote data/sample-results.json  (' + sessions.length + ' sessions)');
console.log('wrote data/sample-results.csv   (' + Object.keys(flat).length + ' columns)');
console.log('complete sessions:', sessions.filter(function (s) { return s.completed_at; }).length);
console.log('\ncolumns:');
Object.keys(flat).forEach(function (k) { console.log('  ' + k); });
