/* ==========================================================================
   dashboard.js
   --------------------------------------------------------------------------
   Reads sessions (from this browser, from sample-results.json, or from a file
   you drop in) and renders the analysis views.

   Two rules this file follows on purpose:
     1. Every number is shown with its n. Because the study rotates which
        assets each participant sees, n differs per cell and you must be able
        to see that.
     2. The synthesis panel never announces a single winner. It reports which
        candidate is strongest on each dimension and lets you decide.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var D = window.CC_DATA;
  var A = window.CC_ASSETS;
  var OPT = window.CC_OPTIONS;

  var state = { sessions: [], source: 'local' };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function pct(v) { return v === null ? '–' : Math.round(v * 100) + '%'; }
  function scale5(v) { return v === null ? '–' : (v * 4 + 1).toFixed(1); }

  var LOW_N = 5; // below this, a cell is flagged as thin

  /* ---------------------------------------------------------------------
     Table of candidates × measures (the spec's comparison table)
     --------------------------------------------------------------------- */

  var ROWS = [
    { key: 'category_accuracy', label: 'Category recognition (read as cake-related)', fmt: pct },
    { key: 'category_confidence', label: 'Confidence in that reading', fmt: scale5 },
    { key: 'trust',              label: 'Trust / would buy from', fmt: scale5 },
    { key: 'memorability',       label: 'Memorability (correct in lineup)', fmt: pct },
    { key: 'sd_warmth',          label: 'Warmth', fmt: scale5 },
    { key: 'sd_clarity',         label: 'Clarity', fmt: scale5 },
    { key: 'sd_participatory',   label: 'Participation feeling', fmt: scale5 },
    { key: 'sd_flexible',        label: 'Flexibility (felt)', fmt: scale5 },
    { key: 'sd_distinctive',     label: 'Distinctiveness', fmt: scale5 },
    { key: 'sd_handmade',        label: 'Handmade quality', fmt: scale5 },
    { key: 'word_confusing',     label: 'Flagged confusing / unfinished', fmt: pct, negative: true },
    { key: 'final_preference',   label: 'Final preference share', fmt: pct },
    { key: 'final_participatory',label: 'Chosen as most participatory', fmt: pct }
    /* There is deliberately no 'system_anchor' row here. Game 13 shows the
       FLEXIBILITY assets, so anchor votes belong to those assets and could
       never appear in this table of the five core candidates — the row would
       read "no data" forever. The anchor tally lives in "System signals". */
  ];

  function renderComparison(perAsset) {
    var candidates = A.core;
    var table = el('table', { class: 'data' });

    var headRow = el('tr', {}, [el('th', { text: 'Measure' })]);
    candidates.forEach(function (a) {
      var img = el('img', { class: 'thumb-sm', src: a.file, alt: '' });
      img.addEventListener('error', function () { img.remove(); });
      headRow.appendChild(el('th', {}, [
        img,
        el('div', { text: a.code + ' · ' + (a.shortName || a.name) })
      ]));
    });
    table.appendChild(el('thead', {}, [headRow]));

    var tbody = el('tbody');
    ROWS.forEach(function (row) {
      var cells = candidates.map(function (a) { return D.Score.cell(perAsset, a.id, row.key); });
      var valid = cells.filter(function (c) { return c.value !== null; }).map(function (c) { return c.value; });
      var best = valid.length ? (row.negative ? Math.min.apply(null, valid) : Math.max.apply(null, valid)) : null;

      var tr = el('tr', {}, [el('td', { class: 'metric', text: row.label })]);
      cells.forEach(function (c) {
        if (c.value === null) {
          tr.appendChild(el('td', {}, [el('span', { class: 'lown', text: 'no data' })]));
          return;
        }
        var isBest = best !== null && Math.abs(c.value - best) < 1e-9 && valid.length > 1;
        var bar = el('span', { class: 'cellbar' }, [
          el('span', { style: 'width:' + Math.round(c.value * 100) + '%' })
        ]);
        var td = el('td', {}, [
          el('div', { class: 'cellval' + (isBest ? ' best' : '') }, [
            bar, el('span', { class: 'cellnum', text: row.fmt(c.value) })
          ]),
          el('div', { class: 'lown' }, [
            document.createTextNode('n=' + c.n),
            c.n < LOW_N ? el('span', { class: 'flag-lown', text: 'thin' }) : null
          ])
        ]);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return el('div', { class: 'table-scroll' }, [table]);
  }

  /* ---------------------------------------------------------------------
     Overview stats
     --------------------------------------------------------------------- */

  function renderOverview(sessions) {
    var completed = sessions.filter(function (s) { return s.completed_at; });
    var times = completed.map(function (s) { return s.completion_time; })
      .filter(function (n) { return typeof n === 'number' && n > 0; });
    var avg = D.util.mean(times);
    var median = null;
    if (times.length) {
      var sorted = times.slice().sort(function (a, b) { return a - b; });
      median = sorted[Math.floor(sorted.length / 2)];
    }

    var memAll = completed.map(function (s) { return D.Score.memoryCorrect(s); })
      .filter(function (v) { return v !== null; });
    var memRate = memAll.length ? memAll.filter(Boolean).length / memAll.length : null;

    var seq = completed.map(function (s) { return D.Score.sequenceScore(s); })
      .filter(function (v) { return v !== null; });

    function fmtTime(sec) {
      if (sec === null || sec === undefined) return '–';
      var m = Math.floor(sec / 60), r = Math.round(sec % 60);
      return m + 'm ' + (r < 10 ? '0' : '') + r + 's';
    }

    var stats = [
      { n: String(sessions.length), k: 'Sessions recorded' },
      { n: String(completed.length), k: 'Completed' },
      { n: sessions.length ? Math.round(completed.length / sessions.length * 100) + '%' : '–', k: 'Completion rate' },
      { n: fmtTime(median), k: 'Median session time' },
      { n: fmtTime(avg === null ? null : Math.round(avg)), k: 'Average session time' },
      { n: memRate === null ? '–' : Math.round(memRate * 100) + '%', k: 'Overall recognition accuracy' },
      { n: seq.length ? Math.round(D.util.mean(seq) * 100) + '%' : '–', k: 'Process story read in order' }
    ];

    var grid = el('div', { class: 'stat-grid' });
    stats.forEach(function (s) {
      grid.appendChild(el('div', { class: 'stat' }, [
        el('div', { class: 'n', text: s.n }),
        el('div', { class: 'k', text: s.k })
      ]));
    });
    return grid;
  }

  /* ---------------------------------------------------------------------
     Meaning: brand role, family cohesion, connectors, monogram
     --------------------------------------------------------------------- */

  function tally(list) {
    var counts = {};
    list.forEach(function (v) { if (v) counts[v] = (counts[v] || 0) + 1; });
    return Object.keys(counts).map(function (k) { return { key: k, n: counts[k] }; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  function labelFor(optionList, value) {
    var found = (optionList || []).filter(function (o) { return o.value === value; })[0];
    return found ? (found.en || value) : value;
  }

  function renderMeaning(sessions) {
    var wrap = el('div', { class: 'quote-cols' });

    // Brand role — the participation question the spec cares most about
    var roles = tally(sessions.map(function (s) {
      return s.games && s.games.game10 ? s.games.game10.role : null;
    }));
    var roleTotal = roles.reduce(function (a, b) { return a + b.n; }, 0);
    var roleCard = el('div', { class: 'quote-card' }, [
      el('h3', { text: 'Brand role read from the process sequence' })
    ]);
    var roleList = el('ul');
    roles.forEach(function (r) {
      var onTarget = r.key === OPT.roleOnTarget;
      roleList.appendChild(el('li', {}, [
        el('span', { text: labelFor(OPT.roles, r.key) + ' — ' + Math.round(r.n / roleTotal * 100) + '% (' + r.n + ')' }),
        onTarget ? el('span', { class: 'flag-lown', text: 'intended reading' }) : null
      ]));
    });
    if (!roles.length) roleList.appendChild(el('li', { text: 'No data yet.' }));
    roleCard.appendChild(roleList);
    wrap.appendChild(roleCard);

    // What holds the system together
    var conns = tally(sessions.map(function (s) {
      return s.games && s.games.game13 ? s.games.game13.connector : null;
    }));
    var connTotal = conns.reduce(function (a, b) { return a + b.n; }, 0);
    var connCard = el('div', { class: 'quote-card' }, [
      el('h3', { text: 'What participants say holds the family together' })
    ]);
    var connList = el('ul');
    conns.forEach(function (c) {
      connList.appendChild(el('li', {
        text: labelFor(OPT.connectors, c.key) + ' — ' + Math.round(c.n / connTotal * 100) + '% (' + c.n + ')'
      }));
    });
    if (!conns.length) connList.appendChild(el('li', { text: 'No data yet.' }));
    connCard.appendChild(connList);
    wrap.appendChild(connCard);

    // Family cohesion score
    var fam = D.util.mean(sessions.map(function (s) {
      return s.games && s.games.game13 ? s.games.game13.family_score : null;
    }).filter(function (v) { return typeof v === 'number'; }));
    var famN = sessions.filter(function (s) { return s.games && s.games.game13 && s.games.game13.family_score; }).length;

    // Decoration micro-test
    var dec = tally(sessions.map(function (s) {
      return s.games && s.games.micro3 ? s.games.micro3.effect : null;
    }));
    var decCard = el('div', { class: 'quote-card' }, [
      el('h3', { text: 'System signals' })
    ]);
    var decList = el('ul');
    decList.appendChild(el('li', {
      text: 'Family cohesion: ' + (fam === null ? '–' : fam.toFixed(1) + ' / 5') + ' (n=' + famN + ')'
    }));
    /* Strongest visual anchor — a required Game 13 measure. These votes land
       on the flexibility assets rather than the five core candidates, which
       is why they are reported here instead of in the comparison table. */
    var anchors = tally(sessions.map(function (s) {
      return s.games && s.games.game13 ? s.games.game13.anchor : null;
    }));
    var anchorTotal = anchors.reduce(function (a, b) { return a + b.n; }, 0);
    if (!anchors.length) {
      decList.appendChild(el('li', { text: 'Strongest visual anchor: no data yet.' }));
    } else {
      anchors.slice(0, 3).forEach(function (an) {
        var asset = window.CC_ASSETS && window.CC_ASSETS.byId ? window.CC_ASSETS.byId(an.key) : null;
        var name = asset ? (asset.code + ' · ' + (asset.shortName || asset.name)) : an.key;
        decList.appendChild(el('li', {
          text: 'Visual anchor: ' + name + ' — ' +
            Math.round(an.n / anchorTotal * 100) + '% (' + an.n + ')'
        }));
      });
    }

    dec.forEach(function (d) {
      decList.appendChild(el('li', { text: 'Decoration reads as “' + d.key.replace(/_/g, ' ') + '” — ' + d.n }));
    });
    decCard.appendChild(decList);
    wrap.appendChild(decCard);

    return wrap;
  }

  /* ---------------------------------------------------------------------
     Qualitative: word frequency and quotes
     --------------------------------------------------------------------- */

  function renderWords(sessions) {
    var counts = {};
    sessions.forEach(function (s) {
      var g = (s.games && s.games.game3) || {};
      Object.keys(g).forEach(function (assetId) {
        (g[assetId].words || []).forEach(function (w) { counts[w] = (counts[w] || 0) + 1; });
      });
    });
    var list = Object.keys(counts).map(function (k) { return { k: k, n: counts[k] }; })
      .sort(function (a, b) { return b.n - a.n; });

    if (!list.length) return el('div', { class: 'empty', text: 'No word associations yet.' });

    var cloud = el('div', { class: 'wordcloud' });
    list.forEach(function (item) {
      var opt = OPT.words.filter(function (w) { return w.value === item.k; })[0];
      var neg = opt && opt.valence === 'neg';
      cloud.appendChild(el('span', { class: 'w' + (neg ? ' neg' : '') }, [
        document.createTextNode(opt ? opt.en : item.k),
        el('b', { text: String(item.n) })
      ]));
    });
    return cloud;
  }

  function renderQuotes(sessions) {
    var positives = [], negatives = [], confusion = [], monogram = [];

    sessions.forEach(function (s) {
      var g = s.games || {};
      var id = s.participant_id ? s.participant_id.slice(0, 6) : '?';

      function push(bucket, text, tag) {
        if (text && String(text).trim().length > 12) {
          bucket.push({ text: String(text).trim(), who: id, tag: tag });
        }
      }

      if (g.game23) push(g.game23.choice ? positives : positives, g.game23.reason, 'final choice');
      if (g.game7) push(positives, g.game7.reason, 'trust');
      if (g.game10) push(positives, g.game10.reason, 'brand role');

      Object.keys(g.game1 || {}).forEach(function (assetId) {
        var r = g.game1[assetId];
        if (!r) return;
        var onTarget = D.Score.categoryOnTarget(r.category);
        push(onTarget ? positives : confusion, r.reason, D.util.nameOf(assetId));
      });

      Object.keys(g.game3 || {}).forEach(function (assetId) {
        var r = g.game3[assetId];
        if (!r) return;
        var hasNeg = (r.words || []).some(function (w) {
          return w === 'confusing' || w === 'unfinished';
        });
        push(hasNeg ? negatives : positives, r.reason, D.util.nameOf(assetId));
      });

      if (g.micro2) push(monogram, g.micro2.reading, 'monogram');
    });

    function card(title, items, emptyMsg) {
      var c = el('div', { class: 'quote-card' }, [el('h3', { text: title })]);
      var ul = el('ul');
      if (!items.length) ul.appendChild(el('li', { text: emptyMsg }));
      items.slice(0, 8).forEach(function (q) {
        ul.appendChild(el('li', { text: '“' + q.text + '” — ' + q.who + ' · ' + q.tag }));
      });
      c.appendChild(ul);
      return c;
    }

    return el('div', { class: 'quote-cols' }, [
      card('Strongest positive comments', positives, 'Nothing yet.'),
      card('Confusion and misreadings', confusion.concat(negatives), 'Nothing yet.'),
      card('How the monogram is read', monogram, 'Not asked in core mode.')
    ]);
  }

  /* ---------------------------------------------------------------------
     Synthesis — deliberately plural, never a single verdict
     --------------------------------------------------------------------- */

  function renderSynthesis(perAsset, sessions) {
    function leader(metric, invert) {
      var best = null;
      A.core.forEach(function (a) {
        var c = D.Score.cell(perAsset, a.id, metric);
        if (c.value === null || c.n === 0) return;
        if (!best) { best = { asset: a, c: c }; return; }
        var better = invert ? c.value < best.c.value : c.value > best.c.value;
        if (better) best = { asset: a, c: c };
      });
      if (!best) return 'Not enough data yet.';
      return best.asset.code + ' · ' + (best.asset.shortName || best.asset.name) +
        ' (' + (best.c.value * 100).toFixed(0) + '%, n=' + best.c.n + ')' +
        (best.c.n < LOW_N ? ' — thin sample' : '');
    }

    // Most polarising: widest spread between trust and confusion signals.
    function polarising() {
      var worst = null;
      A.core.forEach(function (a) {
        var pref = D.Score.cell(perAsset, a.id, 'final_preference');
        var conf = D.Score.cell(perAsset, a.id, 'word_confusing');
        if (pref.value === null || conf.value === null) return;
        var spread = pref.value + conf.value; // liked by some, flagged by others
        if (!worst || spread > worst.spread) worst = { asset: a, spread: spread, pref: pref, conf: conf };
      });
      if (!worst) return 'Not enough data yet.';
      return worst.asset.code + ' · ' + (worst.asset.shortName || worst.asset.name) +
        ' — preferred by ' + Math.round(worst.pref.value * 100) + '% but flagged confusing/unfinished by ' +
        Math.round(worst.conf.value * 100) + '%';
    }

    var lines = [
      { k: 'Clearest — read correctly with least effort', v: leader('sd_clarity') },
      { k: 'Most memorable — survived the lineup', v: leader('memorability') },
      { k: 'Strongest participatory meaning', v: leader('sd_participatory') },
      { k: 'Most trusted', v: leader('trust') },
      { k: 'Most cake-recognisable', v: leader('category_accuracy') },
      { k: 'Best candidate for system expansion (felt flexibility + anchor votes)', v: leader('sd_flexible') },
      { k: 'Most polarising — needs a decision, not an average', v: polarising() },
      { k: 'Highest raw preference', v: leader('final_preference') }
    ];

    var box = el('div', { class: 'synth' });
    lines.forEach(function (l) {
      box.appendChild(el('div', { class: 'line' }, [
        el('div', { class: 'k', text: l.k }),
        el('div', { class: 'v', text: l.v })
      ]));
    });
    box.appendChild(el('div', { class: 'caveat', text:
      'These are separate readings, not a ranking. A mark can win on clarity and lose on ' +
      'meaning — that is a useful result, not a tie to be broken. Because each participant ' +
      'sees a rotating subset of candidates, compare cells with similar n, and treat anything ' +
      'marked “thin” (n<' + LOW_N + ') as directional only.'
    }));
    return box;
  }

  /* ---------------------------------------------------------------------
     Coverage — how many observations each asset has
     --------------------------------------------------------------------- */

  function renderCoverage(perAsset) {
    var metrics = ['category_accuracy', 'word_warmth', 'trust', 'sd_warmth', 'memorability'];
    var labels = ['Game 1', 'Game 3', 'Game 7', 'Game 9', 'Game 2'];
    var table = el('table', { class: 'data' });
    var head = el('tr', {}, [el('th', { text: 'Candidate' })]);
    labels.forEach(function (l) { head.appendChild(el('th', { text: l })); });
    table.appendChild(el('thead', {}, [head]));
    var tb = el('tbody');
    A.core.forEach(function (a) {
      var tr = el('tr', {}, [el('td', { class: 'metric', text: a.code + ' · ' + (a.shortName || a.name) })]);
      metrics.forEach(function (m) {
        var c = D.Score.cell(perAsset, a.id, m);
        tr.appendChild(el('td', {}, [
          document.createTextNode('n=' + c.n),
          c.n < LOW_N ? el('span', { class: 'flag-lown', text: 'thin' }) : null
        ]));
      });
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    return el('div', { class: 'table-scroll' }, [table]);
  }

  /* ---------------------------------------------------------------------
     Render everything
     --------------------------------------------------------------------- */

  function renderAll() {
    var sessions = state.sessions;
    document.getElementById('source-note').textContent =
      sessions.length + ' session(s) loaded from ' + state.source + '.';

    var slots = {
      overview: document.getElementById('sec-overview'),
      compare: document.getElementById('sec-compare'),
      coverage: document.getElementById('sec-coverage'),
      meaning: document.getElementById('sec-meaning'),
      words: document.getElementById('sec-words'),
      quotes: document.getElementById('sec-quotes'),
      synth: document.getElementById('sec-synth')
    };
    Object.keys(slots).forEach(function (k) { slots[k].innerHTML = ''; });

    if (!sessions.length) {
      slots.overview.appendChild(el('div', { class: 'empty', text:
        'No results yet. Run a session in the study, or load data/sample-results.json to preview the dashboard.' }));
      return;
    }

    var perAsset = D.Score.perAsset(sessions);

    slots.overview.appendChild(renderOverview(sessions));
    slots.compare.appendChild(renderComparison(perAsset));
    slots.coverage.appendChild(renderCoverage(perAsset));
    slots.meaning.appendChild(renderMeaning(sessions));
    slots.words.appendChild(renderWords(sessions));
    slots.quotes.appendChild(renderQuotes(sessions));
    slots.synth.appendChild(renderSynthesis(perAsset, sessions));
  }

  /* ---------------------------------------------------------------------
     Loading and exporting
     --------------------------------------------------------------------- */

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function loadLocal() {
    state.sessions = D.Results.all();
    state.source = 'this browser';
    renderAll();
  }

  function loadSample() {
    fetch('data/sample-results.json')
      .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(function (json) {
        state.sessions = Array.isArray(json) ? json : (json.sessions || []);
        state.source = 'sample-results.json';
        renderAll();
      })
      .catch(function () {
        document.getElementById('source-note').textContent =
          'Could not load data/sample-results.json (this needs a local server or GitHub Pages, not file://).';
      });
  }

  function ingestFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var json = JSON.parse(reader.result);
        var list = Array.isArray(json) ? json : (json.sessions || [json]);
        state.sessions = list;
        state.source = file.name;
        renderAll();
      } catch (e) {
        document.getElementById('source-note').textContent = 'That file is not valid JSON.';
      }
    };
    reader.readAsText(file);
  }

  function init() {
    document.getElementById('btn-local').addEventListener('click', loadLocal);
    document.getElementById('btn-sample').addEventListener('click', loadSample);

    document.getElementById('btn-csv').addEventListener('click', function () {
      if (!state.sessions.length) return;
      download('cakecue-results.csv', D.Results.toCSV(state.sessions), 'text/csv;charset=utf-8');
    });
    document.getElementById('btn-json').addEventListener('click', function () {
      if (!state.sessions.length) return;
      download('cakecue-results.json', JSON.stringify(state.sessions, null, 2), 'application/json');
    });
    document.getElementById('btn-clear').addEventListener('click', function () {
      if (!window.confirm('Delete all results stored in this browser? This cannot be undone.')) return;
      D.Results.clear();
      loadLocal();
    });

    var zone = document.getElementById('dropzone');
    var input = document.getElementById('file-input');
    zone.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) ingestFile(e.target.files[0]);
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('over'); });
    });
    zone.addEventListener('drop', function (e) {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) ingestFile(e.dataTransfer.files[0]);
    });

    // Start with whatever is in this browser; fall back to the sample set.
    var local = D.Results.all();
    if (local.length) loadLocal(); else loadSample();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})(window, document);
