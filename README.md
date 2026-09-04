# CakeCue — Identity Testing Lab

A static research site for testing the **CakeCue visual identity system**.

This is **not** a logo preference poll. It measures recognition, meaning,
memorability, emotional association, perceived participation, and system
flexibility. Preference is one question at the very end, and it is the least
important number in the whole study.

Built with plain HTML, CSS and JavaScript. No build step, no frameworks, no
npm install. Works on GitHub Pages as-is.

---

## 1. What is in here

```
index.html              the study itself (what participants open)
dashboard.html          your analysis view (do not share this link)
.nojekyll               tells GitHub Pages not to process the folder

css/style.css           all styling

js/formspree-config.js  ← where your response endpoint lives
js/study-config.js      ← which games are switched on
js/questions.js         assets, options, and all participant copy (EN + FA)
js/data-handler.js      storage, scoring, export, sending
js/app.js               screen rendering and flow
js/dashboard.js         analysis and synthesis

assets/                 your SVG artwork (see section 6)
data/                   sample results for previewing the dashboard
tools/                  helper script that regenerates the sample data
```

The two files with an arrow are the only ones you need to touch for normal use.

---

## 2. Run it on your own machine

Double-clicking `index.html` mostly works, but browsers block file loading on
`file://`, so the dashboard's "Load sample data" button will fail. Start a
tiny local server instead:

```
cd cakecue-testing-lab
python3 -m http.server 8000
```

Then open <http://localhost:8000/index.html> for the study and
<http://localhost:8000/dashboard.html> for the dashboard.

---

## 3. Publish it on GitHub Pages

1. Create a new repository on GitHub.
2. Upload everything in this folder (keep the folder structure intact).
3. Repository **Settings → Pages**.
4. Under "Build and deployment", set Source to **Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save.
5. Wait about a minute. Your study is at
   `https://YOURNAME.github.io/YOURREPO/`

Share that link. Do **not** share `dashboard.html` — it shows real candidate
names, and a participant who sees those names is no longer a blind participant.

---

## 4. Collecting responses

Your Formspree endpoint is already set in `js/formspree-config.js`:

```js
ENDPOINT: 'https://formspree.io/f/xqpkllpw',
MODE: 'formspree',
```

Every completed session is sent there, **and** kept in the participant's own
browser as a backup. If the send fails, nothing is lost.

To read the results: log into Formspree, download your submissions as JSON or
CSV, then drag that file onto the dashboard's drop zone.

To test without sending anything, set `MODE: 'none'`. Responses then stay on
the device and you read them with "Load from this browser".

---

## 5. Choosing which games run

Open `js/study-config.js`. Remove a key from the list and that screen
disappears; the progress bar and export adjust automatically.

All eight specified games are on:

| Game | What it measures | Assets used |
|------|------------------|-------------|
| 1  | first impression, category, confidence, response time | symbol only |
| 3  | word association / personality | symbol only |
| 9  | emotional profile, six sliders | symbol only |
| 10 | participation and brand role | symbol only, process |
| 2  | memory and recognition | symbol only + foils |
| 7  | trust and confidence | symbol only |
| 13 | system flexibility, visual anchor | full lockups |
| 23 | final decision plus four follow-ups | full lockups |

Three optional extras (`micro1` sequence ordering, `micro2` monogram reading,
`micro3` decoration reading) are off by default. Add `?mode=extended` to the
URL to try them all.

**Two rules worth not breaking:**

- The `filler` task between Game 10 and Game 2 is not padding. It is the
  unrelated task that makes Game 2 a memory test rather than a copying test.
  If you remove `filler`, remove `game2` too.
- If you ever enable `micro2`, keep it last. Saying "CC monogram" out loud
  contaminates every meaning question after it.

---

## 6. The assets, and the one rule that matters

### Symbol only vs full lockup

Some of your SVGs contain the words CAKE and CUE as part of the construction.
If a participant sees the word "CAKE" and is then asked what category the mark
belongs to, they are reading, not interpreting. The result would be worthless.

So each tested mark exists as two files:

```
CakeCue_29_Core_Empty_Frame_SYMBOL_ONLY.svg     ← blind tests
CakeCue_29_Core_Empty_Frame_FULL_LOCKUP.svg     ← system / final tests
```

The site picks the right one automatically. In `js/questions.js`:

- `HAS_VARIANTS` lists the ten assets that have both files.
- `BLIND_SCREENS` lists the screens that must never show text.
- `srcFor(asset, screen)` returns the correct file for the current screen.

So you never choose by hand, and you cannot accidentally show a wordmark in a
blind test.

**Your geometry was never altered.** The only operations performed were
removing whole text elements and narrowing the `viewBox`. No shape was moved,
redrawn, rescaled or reinterpreted.

### How the asset files got to this state

Three scripts ran, in order:

1. **`recrop.py`** — ten delivered SVGs had `viewBox` values that disagreed
   with your own manifest, which clipped them (asset 30 read "AKE"). This
   rewrote only the root `<svg>` tag to the manifest values.
2. **`tighten2.py`** — the board crops still contained your working captions
   ("the first cake layer is in place") and, on a few, a fragment of the
   neighbouring board cell. This trimmed the `viewBox` vertically to drop the
   caption band. Vertical only, deliberately: an earlier horizontal version
   clipped the thin leading "C" off several wordmarks, so horizontal bounds
   are left exactly as you authored them.
3. **`variants.py`** — generated the `_SYMBOL_ONLY` and `_FULL_LOCKUP` pairs
   by measuring each element and excluding the wordmark elements. The size gap
   is unambiguous: wordmark parts measure about 134×38, the smallest real mark
   component is 292×148.

Originals are preserved outside the site folder, untouched.

### Replacing or adding artwork

Drop the new `.svg` into the right `assets/` subfolder, then add or edit its
entry in the `CC_ASSETS` block near the top of `js/questions.js`:

```js
{ id: 'core_31_slice_light', code: 'D', name: 'Slice, light',
  file: A + '05_Refined_Core_System/CakeCue_31_Core_Slice_Light.svg' }
```

`code` is what the participant sees (`A`–`E`). `name` is for your dashboard
only. If the new file contains lettering and will be used in a blind test,
supply both `_SYMBOL_ONLY` and `_FULL_LOCKUP` versions and add its `id` to
`HAS_VARIANTS`.

### The recognition foils

`assets/90_Distractors/` holds five wordless marks. These are the **only**
drawings here not authored by you. Game 2 needs plausible wrong answers.
They use deliberately unrelated geometry — rings, chevrons, a hexagon, arcs,
a column — so a wrong answer means your mark was forgettable, not that the
foil was too similar. They carry no text, because in a blind lineup a foil
with words would make "has words" the deciding cue.

### One known caveat

In assets **18–26**, the crop windows in your own manifest clip the wordmark
slightly (18–20 and 24–25 lose the leading "C"; 21–23 clip the top of
"CAKE"). This came with the files and was not introduced here. Those assets
are only used in Game 13, which is about system flexibility rather than
letterforms, so it does not invalidate anything. Re-export them when
convenient and drop them straight in.

---

## 7. Editing the wording

All participant text lives in `CC_COPY` at the bottom of `js/questions.js`,
as two blocks: `en` and `fa`. Edit the text between the quotes. The Persian
block sets `_dir: 'rtl'` and the layout flips automatically.

Tone to keep: warm, direct, plain. Never hint at the answer. Participants
should feel helpful, not examined.

---

## 8. Reading the results

Open `dashboard.html` and load data one of three ways: from this browser,
from the sample file, or by dropping in a file from Formspree.

It reports, in this order: how much data you have, how the candidates compare
across every measure, **where the sample is still too thin to trust**,
meaning and participation, word associations, participants' own words, and
only then a synthesis.

Any cell based on fewer than five participants is flagged. A candidate can win
on clarity and lose on warmth — that is a finding, not a problem. Resist
ranking the five into a single winner too early.

Export buttons give you CSV (for a spreadsheet) or JSON (complete records).

To regenerate the sample data:

```
node tools/make-sample-data.js
```

Those numbers are invented, purely so the dashboard has something to draw.
Delete `data/sample-results.*` before publishing if you would rather no one
could mistake them for real findings.

---

## 9. Design notes

The interface is deliberately quiet: warm off-white, near-black text, one
restrained accent, lots of whitespace. Participants see neutral codes (`A`–`E`)
rather than descriptive names, so a label can never colour an answer.

The identity assets are the variables. The interface is only the room they
are tested in.
