/* ==========================================================================
   app.js
   --------------------------------------------------------------------------
   The participant experience. Builds a list of steps from CC_GAMES plus the
   assets this participant was assigned, then renders one step at a time.

   Nothing in here decides research content — that all lives in questions.js.
   Nothing in here stores or scores data — that all lives in data-handler.js.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var D = window.CC_DATA;
  var A = window.CC_ASSETS;
  var OPT = window.CC_OPTIONS;

  var App = {
    lang: 'en',
    mode: 'core',
    steps: [],
    index: 0,
    stepStart: 0,
    root: null,
    started: false
  };

  /* ---------------------------------------------------------------------
     Tiny DOM helpers — keeps the render code readable.
     --------------------------------------------------------------------- */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] === true) node.setAttribute(k, '');
        else if (attrs[k] !== false && attrs[k] !== null && attrs[k] !== undefined) {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function t(key, vars) {
    var dict = window.CC_COPY[App.lang] || window.CC_COPY.en;
    var s = dict[key];
    if (s === undefined) s = window.CC_COPY.en[key];
    if (s === undefined) return key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }

  // Localised label from an option object { en:'..', fa:'..' }
  function L(obj) {
    if (!obj) return '';
    return obj[App.lang] || obj.en || '';
  }

  /* ---------------------------------------------------------------------
     Stimulus rendering.
     Assets are placed with <img> and scaled with object-fit: contain, so the
     authored geometry and proportions are never altered.
     If a file is missing we say so plainly rather than failing silently —
     that makes it obvious when an SVG has not been dropped in yet.
     --------------------------------------------------------------------- */

  /* Which file does this asset use on the screen being rendered right now?
     Blind screens get the wordless SYMBOL_ONLY file, so the word "CAKE"
     cannot hand the participant the answer before they have looked at the
     form. System / application / final brand expression screens get the
     FULL_LOCKUP. Assets with no variants return their authored file.
     The rule itself lives in questions.js (BLIND_SCREENS). */
  function srcOf(asset) {
    return A.srcFor ? A.srcFor(asset, App.screenKey) : asset.file;
  }

  function stimulus(asset, opts) {
    opts = opts || {};
    var img = el('img', {
      src: srcOf(asset),
      alt: '',                 // decorative to a screen reader: the question carries the meaning
      role: 'presentation',
      draggable: 'false'
    });
    img.addEventListener('error', function () {
      img.replaceWith(el('div', {
        class: 'faint center',
        text: 'Missing asset file: ' + srcOf(asset)
      }));
    });
    return el('div', { class: 'stage' + (opts.tall ? ' tall' : '') }, [img]);
  }

  function thumb(asset, maxClass) {
    var img = el('img', { src: srcOf(asset), alt: '', role: 'presentation', draggable: 'false' });
    img.addEventListener('error', function () {
      img.replaceWith(el('span', { class: 'faint small', text: asset.code }));
    });
    return img;
  }

  /* ---------------------------------------------------------------------
     Reusable question widgets
     --------------------------------------------------------------------- */

  // Single-choice list of option cards
  function radioGroup(options, current, onPick, labelFn) {
    var wrap = el('div', { class: 'options' });
    options.forEach(function (o) {
      var selected = current === o.value;
      var btn = el('button', {
        type: 'button',
        class: 'option' + (selected ? ' selected' : ''),
        role: 'radio',
        'aria-checked': selected ? 'true' : 'false',
        onclick: function () { onPick(o.value); }
      }, [
        el('span', { class: 'dot', 'aria-hidden': 'true' }),
        el('span', { text: labelFn ? labelFn(o) : L(o) })
      ]);
      wrap.appendChild(btn);
    });
    wrap.setAttribute('role', 'radiogroup');
    return wrap;
  }

  // 1-5 rating scale with end labels
  function scale5(current, onPick, loLabel, hiLabel) {
    var row = el('div', { class: 'scale', role: 'radiogroup' });
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        var selected = current === n;
        row.appendChild(el('button', {
          type: 'button',
          class: selected ? 'selected' : '',
          role: 'radio',
          'aria-checked': selected ? 'true' : 'false',
          'aria-label': String(n),
          text: String(n),
          onclick: function () { onPick(n); }
        }));
      })(i);
    }
    return el('div', {}, [
      row,
      el('div', { class: 'scale-ends' }, [
        el('span', { text: loLabel || '' }),
        el('span', { text: hiLabel || '' })
      ])
    ]);
  }

  // Row of clickable thumbnails, pick exactly one
  function pickRow(assets, current, onPick) {
    var row = el('div', { class: 'pick-row', role: 'radiogroup' });
    assets.forEach(function (a) {
      var selected = current === a.id;
      row.appendChild(el('button', {
        type: 'button',
        class: 'pick' + (selected ? ' selected' : ''),
        role: 'radio',
        'aria-checked': selected ? 'true' : 'false',
        'aria-label': a.code,
        onclick: function () { onPick(a.id); }
      }, [thumb(a), el('span', { class: 'code', text: a.code })]));
    });
    return row;
  }

  function textarea(value, placeholder, onInput) {
    return el('textarea', {
      placeholder: placeholder || '',
      oninput: function (e) { onInput(e.target.value); }
    }, [value || '']);
  }

  function field(labelText, control, hint) {
    return el('div', { class: 'field' }, [
      el('div', { class: 'field-label', text: labelText }),
      hint ? el('div', { class: 'faint', style: 'margin:-6px 0 10px', text: hint }) : null,
      control
    ]);
  }

  function head(eyebrow, title, sub) {
    return el('div', { class: 'screen-head' }, [
      eyebrow ? el('div', { class: 'eyebrow', text: eyebrow }) : null,
      el('h1', { text: title }),
      sub ? el('p', { class: 'lead', text: sub }) : null
    ]);
  }

  /* ---------------------------------------------------------------------
     STEP LIST
     Games that measure per-asset expand into one step per assigned asset.
     --------------------------------------------------------------------- */

  function buildSteps() {
    var assign = D.Session.data.assignment;
    var steps = [];

    window.CC_GAMES.forEach(function (game) {
      if (game.extendedOnly && App.mode !== 'extended') return;

      // Only run games switched on in study-config.js. This keeps games whose
      // stimuli are missing or not yet approved out of the participant flow.
      if (window.CC_ACTIVE_GAMES && window.CC_ACTIVE_GAMES.indexOf(game.key) < 0) return;

      var ids = assign[game.key];

      // Per-asset games become several steps.
      if (game.screen === 'game1_category' || game.screen === 'game3_words' || game.screen === 'game9_sliders') {
        (ids || []).forEach(function (assetId, i) {
          steps.push({
            key: game.key + '_' + assetId,
            game: game.key,
            screen: game.screen,
            assetId: assetId,
            subIndex: i,
            subTotal: ids.length,
            counts: true
          });
        });
        return;
      }

      steps.push({
        key: game.key,
        game: game.key,
        screen: game.screen,
        counts: game.countsInProgress !== false
      });
    });

    return steps;
  }

  /* ---------------------------------------------------------------------
     SCREENS
     Each returns { node, validate }. validate() returns null when fine, or a
     gentle message string when something is still needed.
     --------------------------------------------------------------------- */

  var Screens = {

    /* ---- Welcome ---- */
    welcome: function () {
      return {
        node: el('div', {}, [
          head(null, t('welcome_h'), t('welcome_p1')),
          el('p', { text: t('welcome_p2') }),
          el('div', { class: 'consent-box', text: t('welcome_consent') }),
          el('div', { class: 'nav' }, [
            el('button', {
              type: 'button', class: 'btn btn-primary btn-lg',
              text: t('welcome_agree'),
              onclick: function () { next(); }
            })
          ])
        ]),
        hideNav: true
      };
    },

    /* ---- Participant profile ---- */
    profile: function () {
      var answers = D.Session.data.profile || {};
      var body = el('div', {}, [head(null, t('profile_h'), t('profile_p'))]);

      OPT.profile.forEach(function (q) {
        var holder = el('div', { class: 'field' });
        function draw() {
          holder.innerHTML = '';
          holder.appendChild(el('div', { class: 'field-label', text: L(q.q) }));
          holder.appendChild(radioGroup(q.options, answers[q.field], function (v) {
            answers[q.field] = v;
            D.Session.setProfile(answers);
            draw();
          }));
        }
        draw();
        body.appendChild(holder);
      });

      return {
        node: body,
        validate: function () {
          var missing = OPT.profile.some(function (q) { return !answers[q.field]; });
          return missing ? t('required') : null;
        }
      };
    },

    /* ---- GAME 1: first impression / category recognition ---- */
    game1_category: function (step) {
      var asset = A.byId(step.assetId);
      var store = D.Session.getGame('game1') || {};
      var r = store[step.assetId] || { category: null, confidence: null, reason: '' };
      var shown = Date.now();

      function commit() {
        store[step.assetId] = r;
        D.Session.setGame('game1', store);
      }

      var body = el('div', {}, [
        head(t('g1_h'), t('g1_p')),
        stimulus(asset, { tall: true })
      ]);

      var qCat = el('div', { class: 'field' });
      function drawCat() {
        qCat.innerHTML = '';
        qCat.appendChild(el('div', { class: 'field-label', text: t('g1_q1') }));
        qCat.appendChild(radioGroup(OPT.category, r.category, function (v) {
          if (r.category === null) r.response_time_ms = Date.now() - shown;
          r.category = v; commit(); drawCat();
        }));
      }
      drawCat();
      body.appendChild(qCat);

      var qConf = el('div', { class: 'field' });
      function drawConf() {
        qConf.innerHTML = '';
        qConf.appendChild(el('div', { class: 'field-label', text: t('g1_q2') }));
        qConf.appendChild(scale5(r.confidence, function (v) {
          r.confidence = v; commit(); drawConf();
        }, t('g1_conf_lo'), t('g1_conf_hi')));
      }
      drawConf();
      body.appendChild(qConf);

      body.appendChild(field(t('g1_q3'),
        textarea(r.reason, t('g1_q3_ph'), function (v) { r.reason = v; commit(); }),
        t('optional')));

      return {
        node: body,
        validate: function () {
          if (!r.category) return t('required');
          if (!r.confidence) return t('required');
          return null;
        }
      };
    },

    /* ---- GAME 3: word association / personality ---- */
    game3_words: function (step) {
      var asset = A.byId(step.assetId);
      var store = D.Session.getGame('game3') || {};
      var r = store[step.assetId] || { words: [], reason: '' };
      // Randomise word order per asset so list position cannot bias choice.
      var rnd = D.util.seeded(D.Session.data.participant_id + step.assetId);
      var words = D.util.shuffle(OPT.words, rnd);

      function commit() { store[step.assetId] = r; D.Session.setGame('game3', store); }

      var body = el('div', {}, [
        head(t('g3_h'), t('g3_p')),
        stimulus(asset)
      ]);

      var chipWrap = el('div', { class: 'field' });
      function drawChips() {
        chipWrap.innerHTML = '';
        chipWrap.appendChild(el('div', { class: 'faint', style: 'margin-bottom:10px', text: t('g3_limit') }));
        var row = el('div', { class: 'chips' });
        words.forEach(function (w) {
          var on = r.words.indexOf(w.value) >= 0;
          var full = r.words.length >= 3 && !on;
          row.appendChild(el('button', {
            type: 'button',
            class: 'chip' + (on ? ' selected' : ''),
            'aria-pressed': on ? 'true' : 'false',
            disabled: full,
            text: L(w),
            onclick: function () {
              if (on) r.words = r.words.filter(function (x) { return x !== w.value; });
              else if (r.words.length < 3) r.words.push(w.value);
              commit(); drawChips();
            }
          }));
        });
        chipWrap.appendChild(row);
      }
      drawChips();
      body.appendChild(chipWrap);

      body.appendChild(field(t('g3_reason'),
        textarea(r.reason, t('g3_reason_ph'), function (v) { r.reason = v; commit(); }),
        t('optional')));

      return {
        node: body,
        validate: function () { return r.words.length ? null : t('required'); }
      };
    },

    /* ---- GAME 9: emotional semantic differential ---- */
    game9_sliders: function (step) {
      var asset = A.byId(step.assetId);
      var store = D.Session.getGame('game9') || {};
      var r = store[step.assetId] || { sliders: {}, touched: {} };

      function commit() { store[step.assetId] = r; D.Session.setGame('game9', store); }

      var body = el('div', {}, [
        head(t('g9_h'), t('g9_p')),
        stimulus(asset)
      ]);

      OPT.sliders.forEach(function (pair) {
        var value = typeof r.sliders[pair.id] === 'number' ? r.sliders[pair.id] : 3;
        var input = el('input', {
          type: 'range', min: '1', max: '5', step: '1', value: String(value),
          class: r.touched[pair.id] ? '' : 'untouched',
          'aria-label': L(pair.left) + ' – ' + L(pair.right),
          oninput: function (e) {
            r.sliders[pair.id] = parseInt(e.target.value, 10);
            r.touched[pair.id] = true;
            e.target.classList.remove('untouched');
            commit();
          }
        });
        body.appendChild(el('div', { class: 'slider-row' }, [
          el('div', { class: 'slider-poles' }, [
            el('span', { text: L(pair.left) }),
            el('span', { text: L(pair.right) })
          ]),
          input
        ]));
      });

      return {
        node: body,
        // Gentle: ask for most, not all. An untouched slider is genuinely
        // ambiguous data, so we do not silently record it as neutral.
        validate: function () {
          var touched = Object.keys(r.touched || {}).length;
          return touched >= Math.ceil(OPT.sliders.length / 2) ? null : t('required');
        }
      };
    },

    /* ---- GAME 10: participation / brand role ---- */
    game10_role: function () {
      var r = D.Session.getGame('game10') || { role: null, reason: '' };
      function commit() { D.Session.setGame('game10', r); }

      var strip = el('div', { class: 'strip' });
      A.process.forEach(function (a) {
        strip.appendChild(el('div', { class: 'cell' }, [thumb(a)]));
      });

      var body = el('div', { class: '' }, [
        head(t('g10_h'), t('g10_p')),
        strip
      ]);

      var q = el('div', { class: 'field' });
      function draw() {
        q.innerHTML = '';
        q.appendChild(el('div', { class: 'field-label', text: t('g10_q') }));
        q.appendChild(radioGroup(OPT.roles, r.role, function (v) { r.role = v; commit(); draw(); }));
      }
      draw();
      body.appendChild(q);

      body.appendChild(field(t('g10_reason'),
        textarea(r.reason, t('g10_reason_ph'), function (v) { r.reason = v; commit(); }),
        t('optional')));

      return { node: body, wide: true, validate: function () { return r.role ? null : t('required'); } };
    },

    /* ---- MICRO 1: sequence ordering ---- */
    micro_sequence: function () {
      var saved = D.Session.getGame('micro1');
      var order = (saved && saved.order) ? saved.order.slice() : D.Session.data.assignment.micro1.slice();
      function commit() { D.Session.setGame('micro1', { order: order }); }
      commit();

      var list = el('div', { class: 'seq-list' });

      function move(from, to) {
        if (to < 0 || to >= order.length) return;
        var item = order.splice(from, 1)[0];
        order.splice(to, 0, item);
        commit(); draw();
      }

      function draw() {
        list.innerHTML = '';
        order.forEach(function (id, i) {
          var a = A.byId(id);
          if (!a) return;
          var row = el('div', { class: 'seq-item', draggable: 'true' }, [
            el('span', { class: 'seq-rank', text: String(i + 1) }),
            el('div', { class: 'seq-thumb' }, [thumb(a)]),
            el('span', { class: 'seq-grip', text: t('m1_hint') }),
            el('div', { class: 'seq-btns' }, [
              el('button', {
                type: 'button', 'aria-label': t('m1_up'), text: '↑',
                disabled: i === 0, onclick: function () { move(i, i - 1); }
              }),
              el('button', {
                type: 'button', 'aria-label': t('m1_down'), text: '↓',
                disabled: i === order.length - 1, onclick: function () { move(i, i + 1); }
              })
            ])
          ]);

          row.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/plain', String(i));
            row.classList.add('dragging');
          });
          row.addEventListener('dragend', function () { row.classList.remove('dragging'); });
          row.addEventListener('dragover', function (e) { e.preventDefault(); row.classList.add('over'); });
          row.addEventListener('dragleave', function () { row.classList.remove('over'); });
          row.addEventListener('drop', function (e) {
            e.preventDefault(); row.classList.remove('over');
            var from = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(from)) move(from, i);
          });

          list.appendChild(row);
        });
      }
      draw();

      return {
        node: el('div', {}, [head(t('m1_h'), t('m1_p')), list]),
        validate: function () { return null; }
      };
    },

    /* ---- MICRO 2: monogram comprehension (deliberately not leading) ---- */
    micro_monogram: function () {
      var r = D.Session.getGame('micro2') || { reading: '' };
      function commit() { D.Session.setGame('micro2', r); }
      return {
        node: el('div', {}, [
          head(t('m2_h'), t('m2_q')),
          stimulus(A.monogram),
          textarea(r.reading, t('m2_ph'), function (v) { r.reading = v; commit(); })
        ]),
        validate: function () { return null; }
      };
    },

    /* ---- UNRELATED TASK: memory delay before Game 2 ----
       The spec requires an unrelated task between seeing the marks and being
       asked to recognise one. Without a gap, Game 2 measures a mark that is
       still being held in mind, which says nothing about memorability.
       These two questions are non-visual and have nothing to do with cake,
       shape or brands, so they clear the visual buffer without priming
       anything later. They are not analysed. */
    filler_task: function () {
      var r = D.Session.getGame('filler') || { a1: null, a2: null };
      function commit() { D.Session.setGame('filler', r); }

      var body = el('div', {}, [head(t('f_h'), t('f_p'), t('f_note'))]);

      var q1 = el('div', { class: 'field' });
      function draw1() {
        q1.innerHTML = '';
        q1.appendChild(el('div', { class: 'field-label', text: t('f_q1') }));
        q1.appendChild(radioGroup(OPT.filler, r.a1, function (v) {
          r.a1 = v; commit(); draw1();
        }));
      }
      draw1();
      body.appendChild(q1);

      var q2 = el('div', { class: 'field' });
      function draw2() {
        q2.innerHTML = '';
        q2.appendChild(el('div', { class: 'field-label', text: t('f_q2') }));
        q2.appendChild(radioGroup(OPT.filler2, r.a2, function (v) {
          r.a2 = v; commit(); draw2();
        }));
      }
      draw2();
      body.appendChild(q2);

      return {
        node: body,
        validate: function () {
          if (!r.a1 || !r.a2) return t('required');
          return null;
        }
      };
    },

    /* ---- GAME 2: memory / recognition lineup ---- */
    game2_memory: function () {
      var r = D.Session.getGame('game2') || { choice: null, confidence: null };
      var shown = Date.now();
      var lineup = D.Session.data.assignment.game2.lineup
        .map(function (id) { return A.byId(id); }).filter(Boolean);

      function commit() { D.Session.setGame('game2', r); }

      var body = el('div', {}, [head(t('g2_h'), t('g2_p'))]);

      var grid = el('div', { class: 'field' });
      function drawGrid() {
        grid.innerHTML = '';
        var row = el('div', { class: 'pick-row', role: 'radiogroup' });
        lineup.forEach(function (a) {
          var sel = r.choice === a.id;
          row.appendChild(el('button', {
            type: 'button', class: 'pick' + (sel ? ' selected' : ''),
            role: 'radio', 'aria-checked': sel ? 'true' : 'false', 'aria-label': a.code,
            onclick: function () {
              if (!r.choice) r.response_time_ms = Date.now() - shown;
              r.choice = a.id; commit(); drawGrid(); drawConf();
            }
          }, [thumb(a), el('span', { class: 'code', text: a.code })]));
        });
        grid.appendChild(row);

        var noneSel = r.choice === 'none';
        grid.appendChild(el('button', {
          type: 'button',
          class: 'option' + (noneSel ? ' selected' : ''),
          style: 'margin-top:12px',
          onclick: function () {
            if (!r.choice) r.response_time_ms = Date.now() - shown;
            r.choice = 'none'; commit(); drawGrid(); drawConf();
          }
        }, [el('span', { class: 'dot', 'aria-hidden': 'true' }), el('span', { text: t('g2_none') })]));
      }
      drawGrid();
      body.appendChild(grid);

      var confWrap = el('div', { class: 'field' });
      function drawConf() {
        confWrap.innerHTML = '';
        if (!r.choice) return;
        confWrap.appendChild(el('div', { class: 'field-label', text: t('g2_conf') }));
        confWrap.appendChild(scale5(r.confidence, function (v) {
          r.confidence = v; commit(); drawConf();
        }, t('g1_conf_lo'), t('g1_conf_hi')));
      }
      drawConf();
      body.appendChild(confWrap);

      return {
        node: body, wide: true,
        validate: function () { return r.choice ? null : t('required'); }
      };
    },

    /* ---- GAME 7: trust / decision confidence ---- */
    game7_trust: function () {
      var r = D.Session.getGame('game7') || { scores: {}, reason: '' };
      var rnd = D.util.seeded(D.Session.data.participant_id + 'g7');
      var assets = D.util.shuffle(
        D.Session.data.assignment.game7.map(function (id) { return A.byId(id); }).filter(Boolean), rnd);

      function commit() { D.Session.setGame('game7', r); }

      var body = el('div', {}, [head(t('g7_h'), t('g7_p'))]);
      var grid = el('div', { class: 'compare-grid' });

      function draw() {
        grid.innerHTML = '';
        assets.forEach(function (a) {
          var card = el('div', { class: 'compare-card' }, [
            el('div', { class: 'thumb' }, [thumb(a)]),
            el('div', { class: 'code', text: a.code })
          ]);
          card.appendChild(scale5(r.scores[a.id], function (v) {
            r.scores[a.id] = v; commit(); draw();
          }, t('g7_lo'), t('g7_hi')));
          grid.appendChild(card);
        });
      }
      draw();
      body.appendChild(grid);

      body.appendChild(field(t('g7_reason'),
        textarea(r.reason, t('g7_reason_ph'), function (v) { r.reason = v; commit(); }),
        t('optional')));

      return {
        node: body, wide: true,
        validate: function () {
          var done = assets.every(function (a) { return r.scores[a.id]; });
          return done ? null : t('required');
        }
      };
    },

    /* ---- GAME 13: system flexibility / family recognition ---- */
    game13_family: function () {
      var r = D.Session.getGame('game13') ||
        { family_score: null, connector: null, anchor: null, weakest: null };
      var assets = D.Session.data.assignment.game13
        .map(function (id) { return A.byId(id); }).filter(Boolean);

      function commit() { D.Session.setGame('game13', r); }

      var strip = el('div', { class: 'strip' });
      assets.forEach(function (a) {
        strip.appendChild(el('div', { class: 'cell' }, [
          thumb(a),
          el('span', { class: 'code faint', style: 'display:block;margin-top:6px;font-size:11px', text: a.code })
        ]));
      });

      var body = el('div', {}, [head(t('g13_h'), t('g13_p')), strip]);

      var q1 = el('div', { class: 'field' });
      function draw1() {
        q1.innerHTML = '';
        q1.appendChild(el('div', { class: 'field-label', text: t('g13_q1') }));
        q1.appendChild(scale5(r.family_score, function (v) { r.family_score = v; commit(); draw1(); },
          t('g13_q1_lo'), t('g13_q1_hi')));
      }
      draw1(); body.appendChild(q1);

      var q2 = el('div', { class: 'field' });
      function draw2() {
        q2.innerHTML = '';
        q2.appendChild(el('div', { class: 'field-label', text: t('g13_q2') }));
        q2.appendChild(radioGroup(OPT.connectors, r.connector, function (v) { r.connector = v; commit(); draw2(); }));
      }
      draw2(); body.appendChild(q2);

      var q3 = el('div', { class: 'field' });
      function draw3() {
        q3.innerHTML = '';
        q3.appendChild(el('div', { class: 'field-label', text: t('g13_q3') }));
        q3.appendChild(pickRow(assets, r.anchor, function (v) { r.anchor = v; commit(); draw3(); }));
      }
      draw3(); body.appendChild(q3);

      var q4 = el('div', { class: 'field' });
      function draw4() {
        q4.innerHTML = '';
        q4.appendChild(el('div', { class: 'field-label', text: t('g13_q4') }));
        q4.appendChild(pickRow(assets, r.weakest, function (v) { r.weakest = v; commit(); draw4(); }));
      }
      draw4(); body.appendChild(q4);

      return {
        node: body, wide: true,
        validate: function () {
          if (!r.family_score) return t('required');
          if (!r.connector) return t('required');
          return null;
        }
      };
    },

    /* ---- MICRO 3: decoration usefulness ---- */
    micro_decoration: function () {
      var r = D.Session.getGame('micro3') || { effect: null };
      function commit() { D.Session.setGame('micro3', r); }

      var strip = el('div', { class: 'strip' });
      A.decoration.forEach(function (a) {
        strip.appendChild(el('div', { class: 'cell' }, [thumb(a)]));
      });

      var opts = [
        { value: 'richer',    en: t('m3_richer'),    fa: t('m3_richer') },
        { value: 'collaborative', en: t('m3_collab'), fa: t('m3_collab') },
        { value: 'confusing', en: t('m3_confusing'), fa: t('m3_confusing') },
        { value: 'no_difference', en: t('m3_nodiff'), fa: t('m3_nodiff') }
      ];

      var body = el('div', {}, [head(t('m3_h'), t('m3_p')), strip]);
      var q = el('div', { class: 'field' });
      function draw() {
        q.innerHTML = '';
        q.appendChild(el('div', { class: 'field-label', text: t('m3_q') }));
        q.appendChild(radioGroup(opts, r.effect, function (v) { r.effect = v; commit(); draw(); }));
      }
      draw(); body.appendChild(q);

      return { node: body, wide: true, validate: function () { return r.effect ? null : t('required'); } };
    },

    /* ---- GAME 23: final comparative decision ---- */
    game23_final: function () {
      var r = D.Session.getGame('game23') ||
        { choice: null, memorable: null, cake_related: null, flexible: null, participatory: null, reason: '' };
      var assets = D.Session.data.assignment.game23
        .map(function (id) { return A.byId(id); }).filter(Boolean);

      function commit() { D.Session.setGame('game23', r); }

      var body = el('div', {}, [head(t('g23_h'), t('g23_p'))]);

      [['choice', 'g23_q1'], ['memorable', 'g23_q2'], ['cake_related', 'g23_q3'],
       ['flexible', 'g23_q4'], ['participatory', 'g23_q5']].forEach(function (pair) {
        var holder = el('div', { class: 'field' });
        function draw() {
          holder.innerHTML = '';
          holder.appendChild(el('div', { class: 'field-label', text: t(pair[1]) }));
          holder.appendChild(pickRow(assets, r[pair[0]], function (v) { r[pair[0]] = v; commit(); draw(); }));
        }
        draw();
        body.appendChild(holder);
      });

      body.appendChild(field(t('g23_q6'),
        textarea(r.reason, t('g23_q6_ph'), function (v) { r.reason = v; commit(); })));

      return {
        node: body, wide: true,
        validate: function () {
          return (r.choice && r.memorable && r.cake_related && r.flexible && r.participatory)
            ? null : t('required');
        }
      };
    },

    /* ---- Thank you ---- */
    thanks: function () {
      var session = D.Session.data;
      var statusLine = el('p', { class: 'muted', text: t('thanks_local') });
      var retryWrap = el('div', {});

      var body = el('div', { class: 'center' }, [
        head(null, t('thanks_h'), t('thanks_p')),
        statusLine,
        retryWrap,
        el('p', { class: 'faint', style: 'margin-top:28px',
          text: t('thanks_id') + ': ' + session.participant_id.slice(0, 8) }),
        el('div', { style: 'margin-top:8px' }, [
          el('button', {
            type: 'button', class: 'btn btn-ghost', text: t('thanks_again'),
            onclick: function () { D.Session.clearCurrent(); location.href = location.pathname; }
          })
        ])
      ]);

      function attempt() {
        retryWrap.innerHTML = '';
        D.Sender.send(session).then(function (res) {
          if (res.ok) {
            statusLine.textContent = t('thanks_sent');
          } else if (res.reason === 'no_endpoint') {
            statusLine.textContent = t('thanks_local');
          } else {
            statusLine.textContent = t('thanks_failed');
            retryWrap.appendChild(el('button', {
              type: 'button', class: 'btn btn-outline', style: 'margin-top:12px',
              text: t('thanks_retry'), onclick: attempt
            }));
          }
        });
      }
      attempt();

      return { node: body, hideNav: true };
    }
  };

  /* ---------------------------------------------------------------------
     RENDER LOOP
     --------------------------------------------------------------------- */

  var currentScreen = null;

  function countedSteps() {
    return App.steps.filter(function (s) { return s.counts; });
  }

  function updateProgress() {
    var counted = countedSteps();
    var step = App.steps[App.index];
    var pos = counted.indexOf(step);
    var wrap = document.getElementById('progress-wrap');
    if (!wrap) return;
    if (pos < 0) { wrap.style.visibility = 'hidden'; return; }
    wrap.style.visibility = 'visible';
    document.getElementById('progress-label').textContent =
      t('progress', { n: pos + 1, total: counted.length });
    document.getElementById('progress-bar').style.width =
      Math.round(((pos + 1) / counted.length) * 100) + '%';
  }

  function render() {
    var step = App.steps[App.index];
    if (!step) return;

    App.stepStart = Date.now();
    D.Session.data.last_step = App.index;
    D.Session.save();

    // Tells srcOf() whether this is a blind visual test or a lockup test.
    App.screenKey = step.screen;

    var builder = Screens[step.screen];
    if (!builder) { console.error('Unknown screen', step.screen); return; }
    currentScreen = builder(step);

    App.root.innerHTML = '';
    var wrapper = el('div', { class: 'screen' + (currentScreen.wide ? ' wide' : '') });

    var notice = el('div', { class: 'notice', hidden: true, role: 'status' });
    wrapper.appendChild(currentScreen.node);
    wrapper.appendChild(notice);

    if (!currentScreen.hideNav) {
      var isLast = App.index === App.steps.length - 2; // last before thanks
      var nav = el('div', { class: 'nav' }, [
        App.index > 1 ? el('button', {
          type: 'button', class: 'btn btn-ghost', text: t('back'),
          onclick: function () { back(); }
        }) : null,
        el('div', { class: 'spacer' }),
        el('button', {
          type: 'button', class: 'btn btn-primary',
          text: isLast ? t('finish') : t('next'),
          onclick: function () {
            var msg = currentScreen.validate ? currentScreen.validate() : null;
            if (msg) {
              notice.textContent = msg;
              notice.hidden = false;
              notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
            notice.hidden = true;
            next();
          }
        })
      ]);
      wrapper.appendChild(nav);
    }

    App.root.appendChild(wrapper);
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function next() {
    var step = App.steps[App.index];
    if (step) D.Session.time(step.key, Date.now() - App.stepStart);

    // Completing the last question screen finalises the record.
    if (App.index === App.steps.length - 2) D.Session.complete();

    if (App.index < App.steps.length - 1) {
      App.index++;
      render();
    }
  }

  function back() {
    if (App.index > 0) { App.index--; render(); }
  }

  /* ---------------------------------------------------------------------
     BOOT
     --------------------------------------------------------------------- */

  function applyLang() {
    var dict = window.CC_COPY[App.lang];
    document.documentElement.lang = App.lang;
    document.documentElement.dir = dict._dir;
    document.title = dict.site_title;
    var btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = dict._switchTo;
  }

  function init() {
    App.root = document.getElementById('app-root');
    App.lang = D.Lang.get();

    var params = new URLSearchParams(location.search);
    App.mode = params.get('mode') === 'extended' ? 'extended' : 'core';

    // Recover an in-progress session after an accidental refresh.
    var restored = D.Session.restore();
    if (restored && restored.mode === App.mode) {
      App.lang = restored.language || App.lang;
      App.steps = buildSteps();
      App.index = Math.min(restored.last_step || 0, App.steps.length - 2);
    } else {
      D.Session.create(App.lang, App.mode);
      App.steps = buildSteps();
      App.index = 0;
    }

    applyLang();

    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        App.lang = App.lang === 'en' ? 'fa' : 'en';
        D.Lang.set(App.lang);
        if (D.Session.data) { D.Session.data.language = App.lang; D.Session.save(); }
        applyLang();
        render();
      });
    }

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CC_APP = App;

})(window, document);
