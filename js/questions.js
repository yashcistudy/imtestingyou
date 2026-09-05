/* ==========================================================================
   questions.js
   --------------------------------------------------------------------------
   EVERYTHING A NON-DEVELOPER NEEDS TO CHANGE LIVES IN THIS FILE:
     • CC_ASSETS  — which SVG file is used where
     • CC_COPY    — every word the participant reads (English + Persian)
     • CC_GAMES   — which games run, in what order, with which assets

   You can add, remove or swap SVGs without touching any other file.
   See README.md → "How to replace or add SVGs later without breaking the test".
   ========================================================================== */

(function () {
  'use strict';

  var A = 'assets/';

  /* ========================================================================
     1. ASSET REGISTRY
     ------------------------------------------------------------------------
     `id`    internal, appears in your exported data. Never shown to anyone.
     `file`  path to your authored SVG. Never modified, only scaled.
     `name`  designer-facing name. Shown in the DASHBOARD only.
     `code`  participant-facing label (A, B, C...). Deliberately meaningless
             so the label itself cannot bias the answer. A name like
             "Empty Frame" would tell the participant what to see.
     ======================================================================== */

  /* The five refined core candidates.

     'code' is the ONLY label a participant ever sees. 'name' is the real file
     name and 'shortName' is a readable label — both are for the dashboard
     only, never rendered in the study, so a descriptive word can never
     colour someone's answer. */
  var CORE = [
    { id: 'core_29_empty_frame',  code: 'A', shortName: 'Empty frame',  name: 'CakeCue_29_Core_Empty_Frame',  file: A + '05_Refined_Core_System/CakeCue_29_Core_Empty_Frame.svg' },
    { id: 'core_30_single_block', code: 'B', shortName: 'Single block', name: 'CakeCue_30_Core_Single_Block', file: A + '05_Refined_Core_System/CakeCue_30_Core_Single_Block.svg' },
    { id: 'core_28_double_band',  code: 'C', shortName: 'Double band', name: 'CakeCue_28_Core_Double_Band',  file: A + '05_Refined_Core_System/CakeCue_28_Core_Double_Band.svg' },
    { id: 'core_31_slice_light',  code: 'D', shortName: 'Slice, light', name: 'CakeCue_31_Core_Slice_Light',  file: A + '05_Refined_Core_System/CakeCue_31_Core_Slice_Light.svg' },
    { id: 'core_32_slice_dark',   code: 'E', shortName: 'Slice, dark',  name: 'CakeCue_32_Core_Slice_Dark',   file: A + '05_Refined_Core_System/CakeCue_32_Core_Slice_Dark.svg' }
  ];

  // Spec: assets 29 / 30 / 28 are the earliest first-impression stimuli.
  // 31 / 32 join Game 1 only in extended mode ("later rounds").
  var CORE_FIRST_IMPRESSION = ['core_29_empty_frame', 'core_30_single_block', 'core_28_double_band'];
  var CORE_LATER_ROUNDS     = ['core_31_slice_light', 'core_32_slice_dark'];

  // Process narrative, in authored order. `step` is the ground truth used to
  // score the optional sequence-ordering micro-test.
  var PROCESS = [
    { id: 'proc_01_skeleton',   step: 1, code: 'P1', name: 'CakeCue_01_Empty_Frame_Skeleton',    file: A + '01_Process_Narrative/CakeCue_01_Empty_Frame_Skeleton.svg' },
    { id: 'proc_02_first_layer',step: 2, code: 'P2', name: 'CakeCue_02_First_Layer',             file: A + '01_Process_Narrative/CakeCue_02_First_Layer.svg' },
    { id: 'proc_03_slice',      step: 3, code: 'P3', name: 'CakeCue_03_Slice_Added',             file: A + '01_Process_Narrative/CakeCue_03_Slice_Added.svg' },
    { id: 'proc_04_undecorated',step: 4, code: 'P4', name: 'CakeCue_04_Finished_Cake_Undecorated',file: A + '01_Process_Narrative/CakeCue_04_Finished_Cake_Undecorated.svg' },
    { id: 'proc_05_decorated',  step: 5, code: 'P5', name: 'CakeCue_05_Decorated_Frame',         file: A + '01_Process_Narrative/CakeCue_05_Decorated_Frame.svg' }
  ];
  // Build game component pieces
  // These are individual construction elements, not process states.
  var COMPONENTS = [
    {
      id: 'component_01',
      code: 'C1',
      name: 'CakeCue Component 01',
      file: A + '06_Components/CakeCue_C01_Bottom_Cake_Structure.svg'
    },
    {
      id: 'component_02',
      code: 'C2',
      name: 'CakeCue Component 02',
      file: A + '06_Components/CakeCue_C02_Bottom_Layer.svg'
    },
    {
      id: 'component_03',
      code: 'C3',
      name: 'CakeCue Component 03',
      file: A + '06_Components/CakeCue_C03_Top_Layer.svg'
    },
    {
      id: 'component_04',
      code: 'C4',
      name: 'CakeCue Component 04',
      file: A + '06_Components/CakeCue_C04_Top_Cake_Structure.svg'
    },
    {
      id: 'component_05',
      code: 'C5',
      name: 'CakeCue Component 05',
      file: A + '06_Components/CakeCue_C05_Top_Slice.svg'
    },
    {
      id: 'component_06',
      code: 'C6',
      name: 'CakeCue Component 06',
      file: A + '06_Components/CakeCue_C06_Frosting.svg'
    }
  ];

  var MONOGRAM = {
    id: 'mono_06_cc_skeleton', code: 'M', name: 'CakeCue_06_CC_Monogram_Skeleton',
    file: A + '02_Exploration_Variants/CakeCue_06_CC_Monogram_Skeleton.svg'
  };

  // Game 13 family set.
  var FLEXIBILITY = [
    { id: 'flex_18', code: 'F1',  name: 'CakeCue_18_HighContrast_Base_Block',  file: A + '03_Refined_High_Contrast/CakeCue_18_HighContrast_Base_Block.svg' },
    { id: 'flex_19', code: 'F2',  name: 'CakeCue_19_HighContrast_Double_Tier', file: A + '03_Refined_High_Contrast/CakeCue_19_HighContrast_Double_Tier.svg' },
    { id: 'flex_20', code: 'F3',  name: 'CakeCue_20_HighContrast_Double_Band', file: A + '03_Refined_High_Contrast/CakeCue_20_HighContrast_Double_Band.svg' },
    { id: 'flex_21', code: 'F4',  name: 'CakeCue_21_RightAligned_Step_Block',  file: A + '04_Refined_Neutral_Text_System/CakeCue_21_RightAligned_Step_Block.svg' },
    { id: 'flex_22', code: 'F5',  name: 'CakeCue_22_RightAligned_Double_Tier', file: A + '04_Refined_Neutral_Text_System/CakeCue_22_RightAligned_Double_Tier.svg' },
    { id: 'flex_23', code: 'F6',  name: 'CakeCue_23_RightAligned_Double_Band', file: A + '04_Refined_Neutral_Text_System/CakeCue_23_RightAligned_Double_Band.svg' },
    { id: 'flex_24', code: 'F7',  name: 'CakeCue_24_SplitText_Base_Block',     file: A + '04_Refined_Neutral_Text_System/CakeCue_24_SplitText_Base_Block.svg' },
    { id: 'flex_25', code: 'F8',  name: 'CakeCue_25_SplitText_Empty_Frame',    file: A + '04_Refined_Neutral_Text_System/CakeCue_25_SplitText_Empty_Frame.svg' },
    { id: 'flex_26', code: 'F9',  name: 'CakeCue_26_SplitText_Double_Tier',    file: A + '04_Refined_Neutral_Text_System/CakeCue_26_SplitText_Double_Tier.svg' },
    { id: 'flex_27', code: 'F10', name: 'CakeCue_27_Grid_Five_Options',        file: A + '04_Refined_Neutral_Text_System/CakeCue_27_Grid_Five_Options.svg' }
  ];

  // Optional deeper flexibility round (extended mode only).
  var FLEXIBILITY_DEEPER = [
    { id: 'flex_33', code: 'F11', name: 'CakeCue_33_Overlay_Slice_Light', file: A + '05_Refined_Core_System/CakeCue_33_Overlay_Slice_Light.svg' },
    { id: 'flex_34', code: 'F12', name: 'CakeCue_34_Overlay_Slice_Dark',  file: A + '05_Refined_Core_System/CakeCue_34_Overlay_Slice_Dark.svg' },
    { id: 'flex_35', code: 'F13', name: 'CakeCue_35_Triangle_Component',  file: A + '05_Refined_Core_System/CakeCue_35_Triangle_Component.svg' }
  ];

  // Decoration-usefulness micro-test (extended mode only).
  var DECORATION = [
    { id: 'dec_10', code: 'D1', name: 'CakeCue_10_Decorated_Frame_Solid',         file: A + '02_Exploration_Variants/CakeCue_10_Decorated_Frame_Solid.svg' },
    { id: 'dec_15', code: 'D2', name: 'CakeCue_15_Decorated_Frame_Dashed_Upper',  file: A + '02_Exploration_Variants/CakeCue_15_Decorated_Frame_Dashed_Upper.svg' },
    { id: 'dec_16', code: 'D3', name: 'CakeCue_16_Decorated_Frame_Dashed_Lower',  file: A + '02_Exploration_Variants/CakeCue_16_Decorated_Frame_Dashed_Lower.svg' }
  ];

  /* Game 2 distractors.
     These are the ONLY visuals not authored by you. The spec explicitly asks
     for them. They are deliberately in the same weight and format as the real
     marks so the lineup is fair, but they use unrelated geometry (circle,
     chevron, hexagon...) so they do not imitate the CakeCue language.
     Swap them freely — nothing else depends on them. */
  var DISTRACTORS = [
    { id: 'dist_01', code: 'X1', name: 'Distractor_01_Ring_Stack',   file: A + '90_Distractors/Distractor_01_Ring_Stack.svg' },
    { id: 'dist_02', code: 'X2', name: 'Distractor_02_Chevron_Mark', file: A + '90_Distractors/Distractor_02_Chevron_Mark.svg' },
    { id: 'dist_03', code: 'X3', name: 'Distractor_03_Hex_Split',    file: A + '90_Distractors/Distractor_03_Hex_Split.svg' },
    { id: 'dist_04', code: 'X4', name: 'Distractor_04_Arc_Pair',     file: A + '90_Distractors/Distractor_04_Arc_Pair.svg' },
    { id: 'dist_05', code: 'X5', name: 'Distractor_05_Notch_Column', file: A + '90_Distractors/Distractor_05_Notch_Column.svg' }
  ];

  // Reference only. Never shown to participants — admin reference area only.
  var BOARDS = [
    { id: 'board_01', name: 'CakeCue_Source_Board_01', file: A + '99_Original_Boards/CakeCue_Source_Board_01.svg' },
    { id: 'board_02', name: 'CakeCue_Source_Board_02', file: A + '99_Original_Boards/CakeCue_Source_Board_02.svg' }
  ];

  /* ========================================================================
     BLIND vs LOCKUP STIMULI
     ------------------------------------------------------------------------
     Several assets carry the words "CAKE" and "CUE" as part of the artwork.
     Those words are a category cue: if a participant reads "CAKE" and then
     tells us the mark looks like a bakery, we have measured their reading,
     not the visual system. So every one of these assets exists twice:

       X_SYMBOL_ONLY.svg   the mark with the wordmark elements removed
       X_FULL_LOCKUP.svg   the complete authored lockup, wordmark included

     Neither file redraws anything. The SYMBOL_ONLY file is the same document
     with the text elements deleted and the viewBox re-framed to what remains.
     Geometry, proportion and colour are untouched.
     ======================================================================== */

  // Assets available in both forms. Anything not listed uses its file as-is.
  var HAS_VARIANTS = [
    'core_28_double_band', 'core_29_empty_frame', 'core_30_single_block',
    'core_31_slice_light', 'core_32_slice_dark',
    'proc_01_skeleton', 'proc_02_first_layer', 'proc_03_slice',
    'proc_04_undecorated', 'proc_05_decorated'
  ];

  // Screens where the participant must NOT see any word.
  // These measure what the form alone communicates.
  var BLIND_SCREENS = [
    'game1_category',   // category association
    'game2_memory',     // recognition / memorability
    'game3_words',      // emotional association
    'game7_trust',      // trust
    'game9_sliders',    // personality / emotional response
    'game10_role',      // brand role / meaning
    'game23_final',     // final choice: judged on the form, not the wordmark
    'game_build',       // assembly: the parts must speak, not the wordmark
    'micro_sequence',   // does the form read as a build sequence?
    'micro_decoration'  // does decoration read as decoration?
  ];

  // Every other stimulus screen is a lockup test: complete identity system,
  // wordmark relationship, application, final brand expression.

  window.CC_ASSETS = {
    core: CORE,
    coreFirstImpression: CORE_FIRST_IMPRESSION,
    coreLaterRounds: CORE_LATER_ROUNDS,
    process: PROCESS,
    components: COMPONENTS,
    monogram: MONOGRAM,
    flexibility: FLEXIBILITY,
    flexibilityDeeper: FLEXIBILITY_DEEPER,
    decoration: DECORATION,
    distractors: DISTRACTORS,
    boards: BOARDS,

    // Is this screen a blind (wordless) visual test?
    isBlind: function (screen) {
      return BLIND_SCREENS.indexOf(screen) >= 0;
    },

    // Which file should this asset use on this screen?
    // Blind screens get the wordless mark; everything else gets the lockup.
    srcFor: function (asset, screen) {
      if (!asset) return '';
      if (HAS_VARIANTS.indexOf(asset.id) < 0) return asset.file;
      var blind = BLIND_SCREENS.indexOf(screen) >= 0;
      return asset.file.replace(/\.svg$/, blind ? '_SYMBOL_ONLY.svg' : '_FULL_LOCKUP.svg');
    },

    // Look up any asset anywhere by its id.
    byId: function (id) {
      var pools = [CORE, PROCESS, COMPONENTS, [MONOGRAM], FLEXIBILITY, FLEXIBILITY_DEEPER, DECORATION, DISTRACTORS, BOARDS];
      for (var i = 0; i < pools.length; i++) {
        for (var j = 0; j < pools[i].length; j++) {
          if (pools[i][j].id === id) return pools[i][j];
        }
      }
      return null;
    }
  };


  /* ========================================================================
     2. RESPONSE OPTIONS
     Values are stored in your data; labels are what participants read.
     ======================================================================== */

  // Game 1 — category recognition (spec wording)
  var CATEGORY_OPTIONS = [
    { value: 'bakery',      en: 'A bakery',                    fa: 'قنادی' },
    { value: 'decoration',  en: 'Cake decoration',             fa: 'تزئین کیک' },
    { value: 'tool_kit',    en: 'A baking tool or kit',        fa: '��بزار یا کیت پخت کیک' },
    { value: 'gift',        en: 'A gift brand',                fa: 'برند هدیه' },
    { value: 'cafe',        en: 'A caf�� or restaurant',        fa: 'کافه یا رستوران' },
    { value: 'kids',        en: "A children's activity",       fa: 'فعالیت کودکان' },
    { value: 'other',       en: 'Something else',              fa: 'چیز دیگری' }
  ];

  // Which categories count as "cake-related" when scoring category accuracy.
  var CATEGORY_ON_TARGET = ['bakery', 'decoration', 'tool_kit'];

  // Game 3 — personality words (spec list, order randomised at runtime)
  var WORD_OPTIONS = [
    { value: 'creative',     en: 'creative',     fa: 'خلاق',        valence: 'pos' },
    { value: 'warm',         en: 'warm',         fa: 'گرم',         valence: 'pos' },
    { value: 'clever',       en: 'clever',       fa: 'زیرکانه',     valence: 'pos' },
    { value: 'handmade',     en: 'handmade',     fa: 'دست‌ساز',     valence: 'pos' },
    { value: 'playful',      en: 'playful',      fa: 'بازیگوش',     valence: 'pos' },
    { value: 'modern',       en: 'modern',       fa: 'مدرن',        valence: 'pos' },
    { value: 'premium',      en: 'premium',      fa: 'لوکس',        valence: 'pos' },
    { value: 'personal',     en: 'personal',     fa: 'شخصی',        valence: 'pos' },
    { value: 'trustworthy',  en: 'trustworthy',  fa: 'قابل‌اعتماد', valence: 'pos' },
    { value: 'inviting',     en: 'inviting',     fa: 'دعوت‌کننده',  valence: 'pos' },
    { value: 'simple',       en: 'simple',       fa: 'ساده',        valence: 'pos' },
    { value: 'confusing',    en: 'confusing',    fa: 'گیج‌کننده',   valence: 'neg' },
    { value: 'unfinished',   en: 'unfinished',   fa: 'ناتمام',      valence: 'neg' },
    { value: 'professional', en: 'professional', fa: 'حرفه‌ای',     valence: 'pos' },
    { value: 'flexible',     en: 'flexible',     fa: 'انعطاف‌پذیر', valence: 'pos' }
  ];

  // Game 9 — semantic differential slider pairs (spec list).
  // 1 = far left pole, 5 = far right pole, 3 = neutral.
  var SLIDER_PAIRS = [
    { id: 'warmth',        left: { en: 'cold',           fa: 'سرد' },          right: { en: 'warm',          fa: 'گرم' } },
    { id: 'distinctive',   left: { en: 'generic',        fa: 'معمولی' },       right: { en: 'distinctive',   fa: 'متمایز' } },
    { id: 'participatory', left: { en: 'passive',        fa: 'منفعل' },        right: { en: 'participatory', fa: 'مشارکتی' } },
    { id: 'handmade',      left: { en: 'mass-produced',  fa: 'انبوه‌سازی' },   right: { en: 'handmade',      fa: 'دست‌ساز' } },
    { id: 'clarity',       left: { en: 'confusing',      fa: 'گیج‌کننده' },    right: { en: 'clear',         fa: 'واضح' } },
    { id: 'flexible',      left: { en: 'rigid',          fa: 'خشک' },           right: { en: 'flexible',      fa: 'انعطاف‌پذیر' } }
  ];

  // Game 10 — brand role (spec wording)
  var ROLE_OPTIONS = [
    { value: 'makes_for_you', en: 'It makes a finished cake for you.',              fa: 'کیک آماده را برای شما می‌سازد.' },
    { value: 'helps_build',   en: 'It helps you build, customise or complete a cake.', fa: 'کمک می‌کند کیک را بسازید، شخصی‌سازی یا کامل کنید.' },
    { value: 'teaches',       en: 'It teaches you how to make or decorate cakes.',  fa: 'به شما یاد می‌دهد چگونه کیک بپزید یا تزئین کنید.' },
    { value: 'other',         en: 'Something else.',                                 fa: 'چیز دیگری.' }
  ];

  // The role reading the identity intends to carry.
  var ROLE_ON_TARGET = 'helps_build';

  // Game 13 — what connects the family
  var CONNECTOR_OPTIONS = [
    { value: 'frame',      en: 'The frame or outline',        fa: 'قا�� یا خط بیرونی' },
    { value: 'layers',     en: 'The stacked layers',          fa: 'لایه‌های روی هم' },
    { value: 'slice',      en: 'The slice or wedge',          fa: 'برش یا گوهه' },
    { value: 'typography', en: 'The way the words are set',   fa: 'شکل چیدمان کلمات' },
    { value: 'proportion', en: 'The proportions and spacing', fa: 'تناسبات و فاصله‌گذاری' },
    { value: 'nothing',    en: 'Nothing really connects them', fa: 'واقعاً چیزی آن‌ها را به هم وصل نمی‌کند' }
  ];

  // Participant profile (spec list)
  var PROFILE_QUESTIONS = [
    {
      id: 'age_range', field: 'age_range',
      q: { en: 'Your age range', fa: 'بازهٔ سنی شما' },
      options: [
        { value: 'under_18', en: 'Under 18', fa: 'زیر ۱۸' },
        { value: '18_24',    en: '18–24',    fa: '۱۸ تا ۲۴' },
        { value: '25_34',    en: '25–34',    fa: '۲۵ تا ۳۴' },
        { value: '35_44',    en: '35–44',    fa: '۳۵ تا ۴۴' },
        { value: '45_54',    en: '45–54',    fa: '۴۵ تا ۵۴' },
        { value: '55_plus',  en: '55 or older', fa: '۵۵ به بالا' },
        { value: 'no_say',   en: 'Rather not say', fa: 'ترجیح می‌دهم نگویم' }
      ]
    },
    {
      id: 'cake_buying_frequency', field: 'cake_buying_frequency',
      q: { en: 'How often do you buy a cake?', fa: 'هر چند وقت یک‌بار کیک می‌خرید؟' },
      options: [
        { value: 'never',     en: 'Almost never',        fa: 'تقریباً هرگز' },
        { value: 'few_year',  en: 'A few times a year',  fa: 'چند بار در سال' },
        { value: 'monthly',   en: 'About monthly',       fa: 'تقریباً ماهانه' },
        { value: 'weekly',    en: 'Weekly or more',      fa: 'هفتگی یا بیشتر' }
      ]
    },
    {
      id: 'decorating_experience', field: 'cake_making_or_decorating_experience',
      q: { en: 'Have you ever decorated or customised a cake yourself?', fa: 'تا به حال خودتان کیکی را تزئین یا شخصی‌سازی کرده‌اید؟' },
      options: [
        { value: 'never',   en: 'Never',                 fa: 'هرگز' },
        { value: 'once',    en: 'Once or twice',         fa: 'یکی دو بار' },
        { value: 'several', en: 'Several times',         fa: 'چندین بار' },
        { value: 'often',   en: 'Often — I enjoy it',    fa: 'اغلب — از آن لذت می‌برم' }
      ]
    },
    {
      id: 'bakes_at_home', field: 'bakes_at_home',
      q: { en: 'Do you bake at home?', fa: 'در خانه شیرینی‌پزی می‌کنید؟' },
      options: [
        { value: 'no',        en: 'No',              fa: 'خیر' },
        { value: 'sometimes', en: 'Sometimes',       fa: 'گاهی' },
        { value: 'regularly', en: 'Regularly',       fa: 'به‌طور منظم' }
      ]
    },
    {
      id: 'priority', field: 'what_matters_most',
      q: { en: 'When you order a cake, what matters most?', fa: 'وقتی کیک سفارش می‌دهید، چه چیزی بیشتر از همه مهم است؟' },
      options: [
        { value: 'taste',         en: 'Taste',          fa: 'طعم' },
        { value: 'presentation',  en: 'Presentation',   fa: 'ظاهر' },
        { value: 'customization', en: 'Customisation',  fa: 'شخصی‌سازی' },
        { value: 'ease',          en: 'Ease',           fa: 'راحتی' }
      ]
    }
  ];

  /* Unrelated task options (memory delay before Game 2).

     These are intentionally boring and have nothing to do with cake, shape,
     making, layering or brands. That is the whole point: they occupy the mind
     for a moment so the marks are recalled from memory rather than still being
     held in view. Anything cake-adjacent here would prime later answers. */
  var FILLER_OPTIONS = [
    { value: 'walk',    en: 'Walking',            fa: 'پیاده' },
    { value: 'bike',    en: 'Cycling',            fa: 'دوچرخه' },
    { value: 'transit', en: 'Public transport',   fa: 'حمل‌ونقل عمومی' },
    { value: 'car',     en: 'Car',                fa: 'خودرو' }
  ];

  var FILLER_OPTIONS_2 = [
    { value: 'morning', en: 'Early morning',  fa: 'صبح زود' },
    { value: 'midday',  en: 'Around midday',  fa: 'نزدیک ظهر' },
    { value: 'evening', en: 'Evening',        fa: 'عصر' },
    { value: 'night',   en: 'Late at night',  fa: 'اخر شب' }
  ];

  window.CC_OPTIONS = {
    filler: FILLER_OPTIONS,
    filler2: FILLER_OPTIONS_2,
    category: CATEGORY_OPTIONS,
    categoryOnTarget: CATEGORY_ON_TARGET,
    words: WORD_OPTIONS,
    sliders: SLIDER_PAIRS,
    roles: ROLE_OPTIONS,
    roleOnTarget: ROLE_ON_TARGET,
    connectors: CONNECTOR_OPTIONS,
    profile: PROFILE_QUESTIONS
  };


  /* ========================================================================
     3. FLOW DEFINITION
     ------------------------------------------------------------------------
     `sample` controls the rotated block design that keeps the study inside
     5–8 minutes. It is the number of assets a single participant sees for
     that game. `null` means "all of them".

     Assets are chosen using a seed derived from the participant id, so
     coverage spreads evenly across participants and each session is
     reproducible from its own id.
     ======================================================================== */

  window.CC_GAMES = [
    { key: 'welcome',   screen: 'welcome',   countsInProgress: false },
    { key: 'profile',   screen: 'profile' },

    { key: 'game1',  screen: 'game1_category',   sample: 2, pool: 'coreFirstImpression', extendedPool: 'coreAll' },
    { key: 'game3',  screen: 'game3_words',      sample: 2, pool: 'coreAll' },
    { key: 'game9',  screen: 'game9_sliders',    sample: 1, pool: 'coreAll' },
    // Spec: use the process assets. Two per participant, rotated across the
    // five, so the whole narrative gets covered by the sample without any one
    // person sitting through all five screens.
    { key: 'game10', screen: 'game10_role',      sample: 2,    pool: 'process' },
    { key: 'micro1', screen: 'micro_sequence',   extendedOnly: true },
    { key: 'micro2', screen: 'micro_monogram',   extendedOnly: true },
    // Required by the spec: an unrelated task between exposure and the
    // recognition lineup. Never remove this and keep Game 2 — without the
    // delay, Game 2 stops measuring memorability.
    { key: 'filler', screen: 'filler_task' },
    { key: 'game2',  screen: 'game2_memory',     sample: null },
    { key: 'game7',  screen: 'game7_trust',      sample: null, pool: 'coreAll' },
    { key: 'game13', screen: 'game13_family',    sample: null, pool: 'flexibility' },
    /* Build the cake. The participant assembles the mark from its authored
       construction states, so we see the order they believe it is made in,
       which piece they treat as load-bearing, and whether the last state
       reads as a finished thing. This supersedes 'micro1' — never run both,
       or the same person is asked to order the same five pieces twice. */
    { key: 'build',  screen: 'game_build',       sample: null, pool: 'components' },
    { key: 'micro3', screen: 'micro_decoration', extendedOnly: true },
    { key: 'game23', screen: 'game23_final',     sample: null, pool: 'coreAll' },

    { key: 'thanks',    screen: 'thanks',    countsInProgress: false }
  ];


  /* ========================================================================
     4. COPY — every participant-facing word.
     Tone: warm, direct, modern, light. Never make them feel tested.
     ======================================================================== */

  window.CC_COPY = {

    en: {
      _dir: 'ltr', _switchTo: 'فارسی',

      site_title: 'CakeCue — Identity Testing Lab',
      progress: 'Step {n} of {total}',
      next: 'Continue', back: 'Back', finish: 'Finish',
      required: 'Just this one before we move on.',
      optional: 'Optional',

      // Welcome
      welcome_h: 'Help us understand how these visual directions come across.',
      welcome_p1: 'There are no right answers. We are interested in your first impression.',
      welcome_p2: 'You will see a few simple marks and answer short questions about them. It takes about six minutes.',
      welcome_consent: 'Your answers are anonymous. We record no name, no email and no IP address. We do record how long answers take, because speed is part of what we are learning.',
      welcome_agree: 'Sounds good — let’s start',

      // Profile
      profile_h: 'First, a little about you',
      profile_p: 'Five quick ones. They help us read the results properly.',

      // Game 1
      g1_h: 'First impression',
      g1_p: 'Take a look. Then tell us what comes to mind.',
      g1_q1: 'What kind of brand do you think this is?',
      g1_q2: 'How confident are you in that guess?',
      g1_q3: 'What made you think that?',
      g1_q3_ph: 'A few words is plenty…',
      g1_conf_lo: 'Not at all', g1_conf_hi: 'Very',

      // Game 3
      g3_h: 'What it feels like',
      g3_p: 'Pick up to three words that fit this mark.',
      g3_limit: 'Up to three. Tap again to unpick.',
      g3_reason: 'What about the mark gave you that feeling?',
      g3_reason_ph: 'Optional, but really useful…',

      // Game 9
      g9_h: 'Where does it sit?',
      g9_p: 'Move each slider to wherever this mark sits for you. The middle means neither.',

      // Game 10
      g10_h: 'What the brand does',
      g10_p: 'These belong to one sequence. Look across them, then answer below.',
      g10_q: 'When you see this, what role does the brand feel like it plays?',
      g10_reason: 'What in the visual made you think that?',
      g10_reason_ph: 'Optional…',

      // Micro 1 — sequence
      m1_h: 'Put them in order',
      m1_p: 'These five are shuffled. Drag them into the order that makes most sense to you.',
      m1_hint: 'Drag to reorder, or use the arrows.',
      m1_up: 'Move earlier', m1_down: 'Move later',

      // Micro 2 — monogram
      m2_h: 'One more look',
      m2_q: 'Do you read anything letter-like here?',
      m2_ph: 'If yes, what? If nothing, just say so.',

      // Game 2
      f_h: 'Quick change of subject',
      f_p: 'Two unrelated questions',
      f_note: 'Nothing to do with the last few screens — just a short breather.',
      f_q1: 'How do you usually get around your city?',
      f_q2: 'When do you feel most alert during the day?',

      g2_h: 'Which one did you see?',
      g2_p: 'One of these appeared earlier in this study. Go with your gut.',
      g2_none: 'None of these',
      g2_conf: 'How sure are you?',

      // Game 7
      g7_h: 'If this were real',
      g7_p: 'Imagine each of these became a real brand tomorrow. How confident would you feel choosing it?',
      g7_lo: 'Not confident', g7_hi: 'Very confident',
      g7_reason: 'Why did you rate them that way?',
      g7_reason_ph: 'Optional…',

      // Game 13
      g13_h: 'One family?',
      g13_p: 'These are different expressions of the same idea.',
      g13_q1: 'Do these look like they belong to the same brand family?',
      g13_q1_lo: 'Not at all', g13_q1_hi: 'Definitely',
      g13_q2: 'Which visual element connects them?',
      g13_q3: 'Which one feels like the strongest anchor for the system?',
      g13_q4: 'Which one feels weakest or most off-system?',
      g13_pick: 'Pick one below',

      // Micro 3 — decoration
      m3_h: 'Does the extra detail help?',
      m3_p: 'Compared with a plain version, these add decoration.',
      m3_q: 'Does that make the brand feel…',
      m3_richer: 'Richer', m3_collab: 'More collaborative', m3_confusing: 'More confusing', m3_nodiff: 'No different',

      // Game 23
      g23_h: 'Last one',
      g23_p: 'All five together. Pick one for each question — they can be the same or different.',
      g23_q1: 'Which would you choose if CakeCue launched tomorrow?',
      g23_q2: 'Which feels most memorable?',
      g23_q3: 'Which feels most clearly cake-related?',
      g23_q4: 'Which feels most like a flexible identity system?',
      g23_q5: 'Which feels most like a brand that helps you create something?',
      g23_q6: 'Why? Anything you want to add.',
      g23_q6_ph: 'This box is genuinely the most useful part of the study…',

      // Build the cake
      b_h: 'Build the cake',
      b_p: 'These are the pieces this mark is made from, shuffled. Put them in the order you think it gets built — first step at the top, finished at the bottom.',
      b_hint: 'Drag a piece into a step. Or tap a piece, then tap the step you want it in.',
      b_tray: 'Pieces',
      b_tray_empty: 'All placed.',
      b_slots: 'Your build order',
      b_slot: 'Step {n}',
      b_empty: 'Empty',
      b_place: 'Place the selected piece here',
      b_take: 'Take out',
      b_reset: 'Start over',
      b_all_slots: 'Place all six pieces before moving on.',
      b_q_finished: 'Look at the step you put last. Does it feel like a finished thing?',
      b_q_finished_lo: 'still unfinished',
      b_q_finished_hi: 'completely finished',
      b_q_essential: 'Which single piece does the most work? Without it the rest stops making sense.',
      b_q_removable: 'Which piece could you drop and still keep the idea?',
      b_q_reason: 'How did you decide the order?',
      b_q_reason_ph: 'What told you which one came first…',

      // Thanks
      thanks_h: 'Thank you — that was really helpful.',
      thanks_p: 'Your answers are recorded.',
      thanks_sent: 'Sent successfully.',
      thanks_local: 'Saved on this device.',
      thanks_failed: 'We could not reach the server, so your answers were saved on this device instead. Please let the researcher know.',
      thanks_retry: 'Try sending again',
      thanks_id: 'Reference',
      thanks_again: 'Start a new session'
    },

    fa: {
      _dir: 'rtl', _switchTo: 'English',

      site_title: 'کیک‌کیو — آزمایشگاه هویت بصری',
      progress: 'گام {n} از {total}',
      next: 'ادامه', back: 'بازگشت', finish: 'پایان',
      required: 'فقط همین یکی مانده تا برویم جلو.',
      optional: 'اختیاری',

      welcome_h: 'کمک کنید بفهمیم این جهت‌های بصری چطور دیده می‌شوند.',
      welcome_p1: 'پاسخ درست و غلط وجود ندارد. برای ما برداشت اولیهٔ شما مهم است.',
      welcome_p2: 'چند نشانهٔ ساده می‌بینید و به سؤالات کوتاهی درباره‌شان پاسخ می‌دهید. حدود شش دقیقه طول می‌کشد.',
      welcome_consent: 'پاسخ‌های شما ناشناس است. نام، ایمیل و نشانی IP ثبت نمی‌شود. مدت زمان پاسخ‌دادن ثبت می‌شود، چون سرعت هم بخشی از چیزی است که یاد می‌گیریم.',
      welcome_agree: 'بسیار خوب — شروع کنیم',

      profile_h: 'اول کمی دربارهٔ شما',
      profile_p: 'پنج سؤال کوتاه. کمک می‌کند نتایج را درست بخوانیم.',

      g1_h: 'برداشت اول',
      g1_p: 'نگاهی بیندازید. بعد بگویید چه به ذهنتان می‌رسد.',
      g1_q1: 'فکر می‌کنید این چه نوع برندی است؟',
      g1_q2: 'چقدر به این حدس مطمئن هستید؟',
      g1_q3: 'چه چیزی باعث شد این را فکر کنید؟',
      g1_q3_ph: 'چند کلمه کافی است…',
      g1_conf_lo: 'اصلاً', g1_conf_hi: 'خیلی',

      g3_h: 'چه حسی دارد',
      g3_p: 'تا سه کلمه که به این نشانه می‌خورد انتخاب کنید.',
      g3_limit: 'حداکثر سه تا. برای لغو دوباره بزنید.',
      g3_reason: 'چه چیزی در این نشانه این حس را به شما داد؟',
      g3_reason_ph: 'اختیاری، اما واقعاً مفید…',

      g9_h: 'کجا می‌ایستد؟',
      g9_p: 'هر لغزنده را به جایی ببرید که این نشانه برای شما قرار می‌گیرد. وسط یعنی هیچ‌کدام.',

      g10_h: 'برند چه کاری می‌کند',
      g10_p: 'این‌ها یک توالی هستند. نگاهی به همه بیندازید و بعد پاسخ دهید.',
      g10_q: 'وقتی این را می‌بینید، احساس می‌کنید برند چه نقشی دارد؟',
      g10_reason: 'چه چیزی در تصویر این را به شما گفت؟',
      g10_reason_ph: 'اختیاری…',

      m1_h: 'به ترتیب بچینید',
      m1_p: 'این پنج تا به‌هم‌ریخته‌اند. به ترتیبی که برایتان معنا دارد بکشید و رها کنید.',
      m1_hint: 'بکشید تا جابه‌جا شود، یا از فلش‌ها استفاده کنید.',
      m1_up: 'جلوتر', m1_down: 'عقب‌تر',

      m2_h: 'یک نگاه دیگر',
      m2_q: 'چیزی شبیه حرف اینجا می‌خوانید؟',
      m2_ph: 'اگر بله، چه چیزی؟ اگر نه، همین را بنویسید.',

      f_h: 'کمی تغییر موضوع',
      f_p: 'دو پرسش بی‌ربط',
      f_note: 'ربطی به صفحه‌های قبل ندارد — فقط یک وقفه کوتاه.',
      f_q1: 'معمولاً ��ر شهر چگونه جابه‌جا می‌شوید؟',
      f_q2: 'در چه زمانی از روز سرحال‌ترید؟',

      g2_h: 'کدام‌یک را دیدید؟',
      g2_p: 'یکی از این‌ها قبلاً در همین مطالعه ظاهر شده بود. به حستان اعتماد کنید.',
      g2_none: 'هیچ‌کدام',
      g2_conf: 'چقدر مطمئن هستید؟',

      g7_h: 'اگر و��قعی بود',
      g7_p: 'فرض کنید هرکدام از این‌ها فردا یک برند واقعی شود. چقدر با اطمینان انتخابش می‌کنید؟',
      g7_lo: 'بدون اطمینان', g7_hi: 'کاملاً مطمئن',
      g7_reason: 'چرا این‌گونه امتیاز دادید؟',
      g7_reason_ph: 'اختیاری…',

      g13_h: 'یک خانواده؟',
      g13_p: 'این‌ها بیان‌های مختلف یک ایده‌اند.',
      g13_q1: 'آیا این‌ها به نظر متعلق به یک خانوادهٔ برندی هستند؟',
      g13_q1_lo: 'اصلاً', g13_q1_hi: 'کاملاً',
      g13_q2: 'کدام عنصر بصری آن‌ها را به هم وصل می‌کند؟',
      g13_q3: 'کدام‌یک قوی‌ترین لنگرگاه این سیستم است؟',
      g13_q4: 'کدام‌یک ضعیف‌ترین یا بیرون از سیستم است؟',
      g13_pick: 'یکی را انتخاب کنید',

      m3_h: 'آیا جزئیات بیشتر کمک می‌کند؟',
      m3_p: 'نسبت به نسخهٔ ساده، این‌ها تزئین بیشتری دارند.',
      m3_q: 'این باعث می‌شود برند به نظر…',
      m3_richer: 'غنی‌تر', m3_collab: 'مشارکتی‌تر', m3_confusing: 'گیج‌کننده‌تر', m3_nodiff: 'فرقی نمی‌کند',

      g23_h: 'آخرین مورد',
      g23_p: 'هر پنج تا کنار هم. برای هر سؤال یکی را انتخاب کنید — می‌توانند یکسان یا متفاوت باشند.',
      g23_q1: 'اگر کیک‌کیو فردا راه‌اندازی شود، کدام را انتخاب می‌کنید؟',
      g23_q2: 'کدام‌یک به‌یادماندنی‌تر است؟',
      g23_q3: 'کدام‌یک واضح‌تر به کیک مربوط است؟',
      g23_q4: 'کدام‌یک بیشتر یک سیستم هویتی انعطاف‌پذیر به نظر می‌رسد؟',
      g23_q5: 'کدام‌یک بیشتر شبیه برندی است که کمکتان می‌کند چیزی بسازید؟',
      g23_q6: 'چرا؟ هر چیزی دوست دارید اضافه کنید.',
      g23_q6_ph: 'این کادر واقعاً مفیدترین بخش مطالعه است…',

      // Build the cake
      b_h: 'کیک را بسازید',
      b_p: 'این‌ها قطعه‌هایی هستند که این نشانه از آن‌ها ساخته شده و به‌هم‌ریخته‌اند. به ترتیبی که فکر می‌کنید ساخته می‌شود بچینید — مرحلهٔ اول بالا، حالت نهایی پایین.',
      b_hint: 'یک قطعه را به داخل یک مرحله بکشید. یا روی قطعه بزنید و بعد روی مرحلهٔ مورد نظر.',
      b_tray: 'قطعه‌ها',
      b_tray_empty: 'همه چیده شدند.',
      b_slots: 'ترتیب ساخت شما',
      b_slot: 'مرحلهٔ {n}',
      b_empty: 'خالی',
      b_place: 'قطعهٔ انتخاب‌شده اینجا قرار بگیرد',
      b_take: 'بردار',
      b_reset: 'از نو',
      b_all_slots: 'قبل از ادامه، همهٔ پنج قطعه را بچینید.',
      b_q_finished: 'به مرحله‌ای که آخر گذاشتید نگاه کنید. حس یک چیز تمام‌شده را دارد؟',
      b_q_finished_lo: 'هنوز ناتمام',
      b_q_finished_hi: 'کاملاً تمام‌شده',
      b_q_essential: 'کدام قطعه بیشترین نقش را دارد؟ بدون آن بقیه بی‌معنا می‌شود.',
      b_q_removable: 'کدام قطعه را می‌شد حذف کرد و ایده باز هم باقی می‌ماند؟',
      b_q_reason: 'چطور ترتیب را انتخاب کردید؟',
      b_q_reason_ph: 'چه چیزی به شما گفت کدام اول است…',

      thanks_h: 'ممنون — واقعاً کمک کرد.',
      thanks_p: 'پاسخ‌های شما ثبت شد.',
      thanks_sent: 'با موفقیت ارسال شد.',
      thanks_local: 'روی این دستگاه ذخیره شد.',
      thanks_failed: 'دسترسی به سرور ممکن نشد، پس پاسخ‌ها روی این دستگاه ذخیره شد. لطفاً به پژوهشگر اطلاع دهید.',
      thanks_retry: 'تلاش دوباره',
      thanks_id: 'شناسه',
      thanks_again: 'جلسهٔ جدید'
    }
  };

})();
