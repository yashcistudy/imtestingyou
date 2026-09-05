/* ==========================================================================
   data-handler.js
   --------------------------------------------------------------------------
   Everything to do with DATA, and nothing to do with screens:
     • creating and saving a session
     • surviving an accidental refresh
     • the rotated block design that keeps the study short
     • turning raw answers into the flat field names in the spec
     • sending to Formspree / Netlify
     • CSV export

   Scoring lives here (not in the dashboard) so the export and the dashboard
   can never disagree with each other.
   ========================================================================== */

(function (window) {
  'use strict';

  var KEY_ALL     = 'cakecue_results_v1';   // every completed session
  var KEY_CURRENT = 'cakecue_inprogress_v1';// the one being filled in now
  var KEY_LANG    = 'cakecue_lang';
  var KEY_ROTATE  = 'cakecue_rotation_v1';  // counter that balances sampling

  /* ---------------------------------------------------------------------
     Small helpers
     --------------------------------------------------------------------- */

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // Deterministic pseudo-random generator seeded from a string.
  // Same participant id → same randomisation, so a session is reproducible.
  function seeded(seedStr) {
    var h = 2166136261;
    for (var i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function () {
      h += 0x6D2B79F5;
      var t = h;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rnd) {
    var a = arr.slice(), r = rnd || Math.random, i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(r() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function readLS(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function writeLS(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function mean(nums) {
    var v = nums.filter(function (n) { return typeof n === 'number' && !isNaN(n); });
    if (!v.length) return null;
    return v.reduce(function (a, b) { return a + b; }, 0) / v.length;
  }

  function round(n, dp) {
    if (n === null || n === undefined || isNaN(n)) return null;
    var f = Math.pow(10, dp === undefined ? 2 : dp);
    return Math.round(n * f) / f;
  }

  /* ---------------------------------------------------------------------
     ROTATION
     --------------------------------------------------------------------- 
     The spec asks for per-asset measurement on five candidates across five
     games. Showing every asset in every game would take 20+ minutes, which
     breaks the 5-8 minute requirement.

     So each participant sees a SUBSET for the heavy games, chosen by a
     rotating offset stored on the device plus the session seed. Over a
     number of participants every asset gets comparable coverage, and the
     dashboard always reports n per asset so you can see when a cell is thin.
     Comparative games (7, 13, 23) always show the full set, because
     comparison is the whole point of those.
     --------------------------------------------------------------------- */

  function nextRotation() {
    var n = readLS(KEY_ROTATE, 0);
    writeLS(KEY_ROTATE, (n + 1) % 1000);
    return n;
  }

  function sampleAssets(pool, count, rotation, rnd) {
    if (!count || count >= pool.length) return shuffle(pool, rnd);
    var out = [], i;
    for (i = 0; i < count; i++) {
      out.push(pool[(rotation + i) % pool.length]);
    }
    return shuffle(out, rnd);
  }

  /* ---------------------------------------------------------------------
     SESSION
     --------------------------------------------------------------------- */

  var Session = {

    data: null,

    create: function (lang, mode) {
      var id = uuid();
      var rnd = seeded(id);
      var rotation = nextRotation();

      this.data = {
        participant_id: id,
        study: 'cakecue-identity-lab',
        version: '1.0.0',
        mode: mode || 'core',
        language: lang,
        timestamp: new Date().toISOString(),
        completed_at: null,
        completion_time: null,
        rotation: rotation,
        device: {
          width: window.innerWidth,
          height: window.innerHeight,
          touch: ('ontouchstart' in window) || navigator.maxTouchPoints > 0
        },
        profile: {},
        // Per-game answers, keyed by game then by asset id where relevant.
        games: {},
        // Which assets this participant was actually shown, per game.
        assignment: {},
        timings: {},
        events: [],
        delivery: { sent: false, attempts: 0, last_error: null }
      };

      this.assign(rnd, rotation);
      this.save();
      return this.data;
    },

    // Decide up front which assets this participant sees in each game.
    assign: function (rnd, rotation) {
      var A = window.CC_ASSETS;
      var core = A.core;
      var mode = this.data.mode;

      var byId = function (ids) {
        return ids.map(function (id) { return A.byId(id); }).filter(Boolean);
      };

      // Game 1 pool: 29/30/28 normally; all five in extended mode.
      var g1pool = mode === 'extended' ? core : byId(A.coreFirstImpression);
      var g1 = sampleAssets(g1pool, mode === 'extended' ? 3 : 2, rotation, rnd);

      // Game 3 and 9 sample from all five core candidates.
      var g3 = sampleAssets(core, 2, rotation + 1, rnd);
      var g9 = sampleAssets(core, 1, rotation + 3, rnd);

      // Game 2 target: the FIRST mark shown in game 1, so there is real
      // separation in the flow between exposure and the memory lineup.
      var target = g1[0];
      var foils = shuffle(A.distractors, rnd).slice(0, 3);
      // Add two other core marks the participant has NOT seen, so the lineup
      // tests memory for a specific mark, not memory for "the CakeCue style".
      var unseen = core.filter(function (c) {
        return !g1.some(function (g) { return g.id === c.id; });
      });
      var lineup = shuffle(foils.concat(shuffle(unseen, rnd).slice(0, 2)).concat([target]), rnd);

      var flex = A.flexibility.slice();
      if (mode === 'extended') flex = flex.concat(A.flexibilityDeeper);

      this.data.assignment = {
        game1:  g1.map(idOf),
        game3:  g3.map(idOf),
        game9:  g9.map(idOf),
        game10: A.process.map(idOf),
        game2:  { target: target.id, lineup: lineup.map(idOf) },
        game7:  core.map(idOf),
        game13: flex.map(idOf),
        game23: core.map(idOf),
        // Build game: the five construction states, shuffled so the tray
        // never hands the answer over in the authored order.
        build:  shuffle(A.process, rnd).map(idOf),
        micro1: shuffle(A.process, rnd).map(idOf),
        micro2: [A.monogram.id],
        micro3: A.decoration.map(idOf)
      };

      function idOf(a) { return a.id; }
    },

    // Restore an in-progress session after an accidental refresh.
    restore: function () {
      var saved = readLS(KEY_CURRENT, null);
      if (!saved || !saved.participant_id || saved.completed_at) return null;
      this.data = saved;
      return saved;
    },

    save: function () {
      if (this.data) writeLS(KEY_CURRENT, this.data);
    },

    setGame: function (gameKey, payload) {
      if (!this.data) return;
      this.data.games[gameKey] = payload;
      this.save();
    },

    getGame: function (gameKey) {
      return this.data && this.data.games ? this.data.games[gameKey] : undefined;
    },

    setProfile: function (obj) {
      if (!this.data) return;
      this.data.profile = obj;
      this.save();
    },

    time: function (gameKey, ms) {
      if (!this.data) return;
      this.data.timings[gameKey] = ms;
    },

    event: function (type, detail) {
      if (!this.data) return;
      this.data.events.push({
        t: type,
        ms: Date.now() - new Date(this.data.timestamp).getTime(),
        d: detail === undefined ? null : detail
      });
    },

    complete: function () {
      this.data.completed_at = new Date().toISOString();
      this.data.completion_time = Math.round(
        (new Date(this.data.completed_at) - new Date(this.data.timestamp)) / 1000
      );
      this.commit();
      return this.data;
    },

    // Move the finished session into the permanent results list.
    commit: function () {
      var all = Results.all();
      var i = -1, k;
      for (k = 0; k < all.length; k++) {
        if (all[k].participant_id === this.data.participant_id) { i = k; break; }
      }
      if (i >= 0) all[i] = this.data; else all.push(this.data);
      writeLS(KEY_ALL, all);
      this.save();
    },

    clearCurrent: function () {
      try { window.localStorage.removeItem(KEY_CURRENT); } catch (e) {}
      this.data = null;
    }
  };

  /* ---------------------------------------------------------------------
     SCORING
     --------------------------------------------------------------------- */

  var Score = {

    // Did the participant read the category as cake-related?
    categoryOnTarget: function (choice) {
      return window.CC_OPTIONS.categoryOnTarget.indexOf(choice) >= 0;
    },

    // Game 2: was the correct mark identified?
    memoryCorrect: function (s) {
      var g = s.games.game2;
      if (!g || !g.choice) return null;
      return g.choice === s.assignment.game2.target;
    },

    // Micro-test 1: how close was the participant's order to the authored one?
    // Uses pairwise concordance (Kendall-style), 0..1. 1 = perfect order.
    sequenceScore: function (s) {
      var g = s.games.micro1;
      if (!g || !g.order || g.order.length < 2) return null;
      var A = window.CC_ASSETS;
      var steps = g.order.map(function (id) {
        var a = A.byId(id);
        return a ? a.step : null;
      });
      if (steps.some(function (x) { return x === null; })) return null;
      var agree = 0, total = 0, i, j;
      for (i = 0; i < steps.length; i++) {
        for (j = i + 1; j < steps.length; j++) {
          total++;
          if (steps[i] < steps[j]) agree++;
        }
      }
      return total ? agree / total : null;
    },

    /* Build game: how close is the assembled order to the authored one?
       Same pairwise concordance as the sequence micro-test, 0..1, so the two
       are directly comparable if you ever run both. */
    buildScore: function (s) {
      var g = s.games.build;
      if (!g || !g.order) return null;
      var ids = g.order.filter(Boolean);
      if (ids.length < 2) return null;
      var A = window.CC_ASSETS;
      var steps = ids.map(function (id) {
        var a = A.byId(id);
        return a ? a.step : null;
      });
      if (steps.some(function (x) { return x === null || x === undefined; })) return null;
      var agree = 0, total = 0, i, j;
      for (i = 0; i < steps.length; i++) {
        for (j = i + 1; j < steps.length; j++) {
          total++;
          if (steps[i] < steps[j]) agree++;
        }
      }
      return total ? agree / total : null;
    },

    // Did they reproduce the authored build order exactly? true / false / null.
    buildExact: function (s) {
      var g = s.games.build;
      if (!g || !g.order) return null;
      var ids = g.order.filter(Boolean);
      if (ids.length < 5) return null;
      var A = window.CC_ASSETS;
      for (var i = 0; i < ids.length; i++) {
        var a = A.byId(ids[i]);
        if (!a || a.step !== i + 1) return false;
      }
      return true;
    },

    // Per-asset roll-up used by the dashboard candidate comparison table.
    // Returns { assetId: { metric: {sum, n} } }
    perAsset: function (sessions) {
      var out = {};
      var OPT = window.CC_OPTIONS;

      function bucket(assetId, metric, value) {
        if (value === null || value === undefined || isNaN(value)) return;
        if (!out[assetId]) out[assetId] = {};
        if (!out[assetId][metric]) out[assetId][metric] = { sum: 0, n: 0 };
        out[assetId][metric].sum += value;
        out[assetId][metric].n += 1;
      }

      sessions.forEach(function (s) {
        var g;

        // Game 1 → category recognition accuracy + confidence
        g = s.games.game1 || {};
        Object.keys(g).forEach(function (assetId) {
          var r = g[assetId];
          if (!r) return;
          if (r.category) bucket(assetId, 'category_accuracy', Score.categoryOnTarget(r.category) ? 1 : 0);
          if (r.confidence) bucket(assetId, 'category_confidence', r.confidence / 5);
        });

        // Game 3 → word associations, split into a few named dimensions
        g = s.games.game3 || {};
        Object.keys(g).forEach(function (assetId) {
          var r = g[assetId];
          if (!r || !r.words) return;
          var w = r.words;
          bucket(assetId, 'word_warmth',    w.indexOf('warm') >= 0 || w.indexOf('inviting') >= 0 ? 1 : 0);
          bucket(assetId, 'word_clever',    w.indexOf('clever') >= 0 ? 1 : 0);
          bucket(assetId, 'word_personal',  w.indexOf('personal') >= 0 || w.indexOf('handmade') >= 0 ? 1 : 0);
          bucket(assetId, 'word_confusing', w.indexOf('confusing') >= 0 || w.indexOf('unfinished') >= 0 ? 1 : 0);
          bucket(assetId, 'word_flexible',  w.indexOf('flexible') >= 0 ? 1 : 0);
        });

        // Game 7 → trust
        g = s.games.game7 || {};
        Object.keys(g.scores || {}).forEach(function (assetId) {
          bucket(assetId, 'trust', g.scores[assetId] / 5);
        });

        // Game 9 → semantic differential, each slider its own metric
        g = s.games.game9 || {};
        Object.keys(g).forEach(function (assetId) {
          var r = g[assetId];
          if (!r || !r.sliders) return;
          OPT.sliders.forEach(function (pair) {
            var v = r.sliders[pair.id];
            if (typeof v === 'number') bucket(assetId, 'sd_' + pair.id, (v - 1) / 4);
          });
        });

        // Game 2 → memorability, credited to the target asset
        var mem = Score.memoryCorrect(s);
        if (mem !== null && s.assignment && s.assignment.game2) {
          bucket(s.assignment.game2.target, 'memorability', mem ? 1 : 0);
        }

        // Game 23 → final choices, each its own preference metric
        g = s.games.game23 || {};
        [['choice', 'final_preference'],
         ['memorable', 'final_memorable'],
         ['cake_related', 'final_cake_related'],
         ['flexible', 'final_flexible'],
         ['participatory', 'final_participatory']].forEach(function (pairKV) {
          var picked = g[pairKV[0]];
          if (!picked) return;
          (s.assignment.game23 || []).forEach(function (assetId) {
            bucket(assetId, pairKV[1], assetId === picked ? 1 : 0);
          });
        });

        // Game 13 → anchor / weakest votes across the family set
        g = s.games.game13 || {};
        if (g.anchor) {
          (s.assignment.game13 || []).forEach(function (assetId) {
            bucket(assetId, 'system_anchor', assetId === g.anchor ? 1 : 0);
          });
        }
        if (g.weakest) {
          (s.assignment.game13 || []).forEach(function (assetId) {
            bucket(assetId, 'system_weakest', assetId === g.weakest ? 1 : 0);
          });
        }
      });

      return out;
    },

    // Convenience: mean of a metric for an asset, plus its n.
    cell: function (perAsset, assetId, metric) {
      var a = perAsset[assetId];
      if (!a || !a[metric] || !a[metric].n) return { value: null, n: 0 };
      return { value: a[metric].sum / a[metric].n, n: a[metric].n };
    }
  };

  /* ---------------------------------------------------------------------
     FLATTEN — the readable export shape asked for in the spec
     --------------------------------------------------------------------- */

  function nameOf(assetId) {
    var a = window.CC_ASSETS.byId(assetId);
    return a ? a.name : assetId;
  }

  // Turns { assetId: value } into "Asset_Name=value; Asset_Name=value"
  function byAssetString(obj, valueFn) {
    if (!obj) return '';
    return Object.keys(obj).map(function (assetId) {
      var v = valueFn ? valueFn(obj[assetId]) : obj[assetId];
      if (v === null || v === undefined || v === '') return null;
      return nameOf(assetId) + '=' + v;
    }).filter(Boolean).join('; ');
  }

  function flatten(s) {
    var p = s.profile || {};
    var g1 = s.games.game1 || {};
    var g2 = s.games.game2 || {};
    var g3 = s.games.game3 || {};
    var g7 = s.games.game7 || {};
    var g9 = s.games.game9 || {};
    var g10 = s.games.game10 || {};
    var g13 = s.games.game13 || {};
    var g23 = s.games.game23 || {};
    var bld = s.games.build || {};
    var m1 = s.games.micro1 || {};
    var m2 = s.games.micro2 || {};
    var m3 = s.games.micro3 || {};

    var memCorrect = Score.memoryCorrect(s);

    return {
      participant_id: s.participant_id,
      timestamp: s.timestamp,
      language: s.language,
      mode: s.mode,
      completed: s.completed_at ? 'yes' : 'no',
      completion_time: s.completion_time === null ? '' : s.completion_time,

      age_range: p.age_range || '',
      cake_buying_frequency: p.cake_buying_frequency || '',
      cake_making_or_decorating_experience: p.cake_making_or_decorating_experience || '',
      bakes_at_home: p.bakes_at_home || '',
      what_matters_most: p.what_matters_most || '',

      game_1_category_choice_by_asset: byAssetString(g1, function (r) { return r && r.category; }),
      game_1_confidence_by_asset:      byAssetString(g1, function (r) { return r && r.confidence; }),
      game_1_reason_by_asset:          byAssetString(g1, function (r) { return r && r.reason ? clean(r.reason) : ''; }),

      // The spec lists response time as a Game 1 measure. It is the gap between
      // the mark appearing and the first category being picked. A slow answer
      // on a confident-looking response is a signal worth seeing.
      game_1_response_time_ms_by_asset: byAssetString(g1, function (r) {
        return r && r.response_time_ms ? Math.round(r.response_time_ms) : '';
      }),

      game_2_target: s.assignment && s.assignment.game2 ? nameOf(s.assignment.game2.target) : '',
      game_2_choice: g2.choice ? (g2.choice === 'none' ? 'none' : nameOf(g2.choice)) : '',
      game_2_recognition_result: memCorrect === null ? '' : (memCorrect ? 'correct' : 'incorrect'),
      game_2_confidence: g2.confidence || '',
      game_2_response_time_ms: g2.response_time_ms ? Math.round(g2.response_time_ms) : '',

      game_3_words_by_asset:  byAssetString(g3, function (r) { return r && r.words ? r.words.join('|') : ''; }),
      game_3_reason_by_asset: byAssetString(g3, function (r) { return r && r.reason ? clean(r.reason) : ''; }),

      game_7_trust_score_by_asset: byAssetString(g7.scores || {}),
      game_7_reason_by_asset: g7.reason ? clean(g7.reason) : '',

      game_9_slider_values_by_asset: byAssetString(g9, function (r) {
        if (!r || !r.sliders) return '';
        return Object.keys(r.sliders).map(function (k) { return k + ':' + r.sliders[k]; }).join('|');
      }),

      game_10_brand_role_by_asset: g10.role ? ('process_sequence=' + g10.role) : '',
      game_10_reason_by_asset: g10.reason ? clean(g10.reason) : '',

      game_13_family_score: g13.family_score || '',
      game_13_connector: g13.connector || '',
      game_13_anchor_choice: g13.anchor ? nameOf(g13.anchor) : '',
      game_13_weakest_choice: g13.weakest ? nameOf(g13.weakest) : '',

      game_23_final_choice: g23.choice ? nameOf(g23.choice) : '',
      game_23_most_memorable: g23.memorable ? nameOf(g23.memorable) : '',
      game_23_most_cake_related: g23.cake_related ? nameOf(g23.cake_related) : '',
      game_23_most_flexible: g23.flexible ? nameOf(g23.flexible) : '',
      game_23_most_participatory: g23.participatory ? nameOf(g23.participatory) : '',
      game_23_reason: g23.reason ? clean(g23.reason) : '',

      build_order: bld.order ? bld.order.filter(Boolean).map(nameOf).join('|') : '',
      build_order_score: bld.order ? (round(Score.buildScore(s), 2) || '') : '',
      build_order_exact: Score.buildExact(s) === null ? '' : (Score.buildExact(s) ? 'yes' : 'no'),
      build_first_piece: (bld.order && bld.order[0]) ? nameOf(bld.order[0]) : '',
      build_last_piece: (bld.order && bld.order[4]) ? nameOf(bld.order[4]) : '',
      build_essential_piece: bld.essential ? nameOf(bld.essential) : '',
      build_removable_piece: bld.removable ? nameOf(bld.removable) : '',
      build_finished_score: bld.finished_score || '',
      build_moves: bld.moves === undefined ? '' : bld.moves,
      build_response_time_ms: bld.response_time_ms === undefined ? '' : bld.response_time_ms,
      build_reason: bld.reason ? clean(bld.reason) : '',

      micro_sequence_order: m1.order ? m1.order.map(nameOf).join('|') : '',
      micro_sequence_score: m1.order ? (round(Score.sequenceScore(s), 2) || '') : '',
      micro_monogram_reading: m2.reading ? clean(m2.reading) : '',
      micro_decoration_effect: m3.effect || ''
    };

    function clean(t) {
      return String(t).replace(/[\r\n]+/g, ' ').trim();
    }
  }

  /* ---------------------------------------------------------------------
     RESULTS — the stored corpus
     --------------------------------------------------------------------- */

  var Results = {
    all: function () {
      var list = readLS(KEY_ALL, []);
      return Array.isArray(list) ? list : [];
    },
    replaceAll: function (list) { writeLS(KEY_ALL, list); },
    // Merge imported sessions, de-duplicating on participant_id.
    merge: function (incoming) {
      var all = this.all();
      var seen = {};
      all.forEach(function (s) { seen[s.participant_id] = true; });
      var added = 0;
      incoming.forEach(function (s) {
        if (s && s.participant_id && !seen[s.participant_id]) {
          all.push(s); seen[s.participant_id] = true; added++;
        }
      });
      writeLS(KEY_ALL, all);
      return added;
    },
    clear: function () {
      try {
        window.localStorage.removeItem(KEY_ALL);
        window.localStorage.removeItem(KEY_CURRENT);
      } catch (e) {}
    },
    toCSV: function (sessions) {
      if (!sessions.length) return '';
      var rows = sessions.map(flatten);
      var cols = Object.keys(rows[0]);
      var esc = function (v) {
        var str = (v === null || v === undefined) ? '' : String(v);
        return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
      };
      return [cols.join(',')].concat(rows.map(function (r) {
        return cols.map(function (c) { return esc(r[c]); }).join(',');
      })).join('\n');
    }
  };

  /* ---------------------------------------------------------------------
     SENDING
     --------------------------------------------------------------------- */

  var Sender = {
    send: function (session) {
      var cfg = window.FORMSPREE_CONFIG || {};
      session.delivery.attempts += 1;

      if (cfg.MODE === 'none' || !cfg.ENDPOINT) {
        session.delivery.last_error = 'no_endpoint';
        Session.commit();
        return Promise.resolve({ ok: false, reason: 'no_endpoint' });
      }

      // Flat fields keep the Formspree inbox readable; `payload` carries the
      // complete record so nothing is ever lost to flattening.
      var flat = flatten(session);
      var request;

      if (cfg.MODE === 'netlify') {
        var body = new URLSearchParams();
        body.append('form-name', cfg.NETLIFY_FORM_NAME || 'cakecue-testing-lab');
        Object.keys(flat).forEach(function (k) { body.append(k, String(flat[k])); });
        body.append('payload', JSON.stringify(session));
        request = fetch(cfg.ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });
      } else {
        var data = {};
        Object.keys(flat).forEach(function (k) { data[k] = flat[k]; });
        data.payload = JSON.stringify(session);
        request = fetch(cfg.ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      return request.then(function (res) {
        if (res.ok) {
          session.delivery.sent = true;
          session.delivery.last_error = null;
          Session.commit();
          return { ok: true };
        }
        session.delivery.last_error = 'http_' + res.status;
        Session.commit();
        return { ok: false, reason: 'http_' + res.status };
      }).catch(function (e) {
        session.delivery.last_error = String(e && e.message ? e.message : e);
        Session.commit();
        return { ok: false, reason: 'network' };
      });
    }
  };

  /* ---------------------------------------------------------------------
     Language preference
     --------------------------------------------------------------------- */

  var Lang = {
    get: function () {
      var saved = null;
      try { saved = window.localStorage.getItem(KEY_LANG); } catch (e) {}
      if (saved === 'en' || saved === 'fa') return saved;
      return (navigator.language || '').toLowerCase().indexOf('fa') === 0 ? 'fa' : 'en';
    },
    set: function (l) {
      try { window.localStorage.setItem(KEY_LANG, l); } catch (e) {}
    }
  };

  window.CC_DATA = {
    Session: Session,
    Results: Results,
    Sender: Sender,
    Score: Score,
    Lang: Lang,
    flatten: flatten,
    util: { uuid: uuid, seeded: seeded, shuffle: shuffle, mean: mean, round: round, nameOf: nameOf }
  };

})(window);
