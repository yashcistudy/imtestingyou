/* ==========================================================================
   study-config.js
   --------------------------------------------------------------------------
   WHICH PARTS OF THE STUDY ARE SWITCHED ON.

   This is the file you edit to turn games on and off. Nothing else needs to
   change. Remove a key from this list and that screen simply never appears;
   the progress bar, the rotation and the data export all adjust themselves.

   The order below does not set the running order. Running order comes from
   CC_GAMES in questions.js. This list only controls what is INCLUDED.
   ========================================================================== */

window.CC_ACTIVE_GAMES = [
  'welcome',
  'profile',

  'game1',   // 1. first impression / category recognition   (blind)
  'game3',   // 3. brand association mapping                 (blind)
  'game9',   // 9. emotional profile, six sliders            (blind)
  'game10',  // 10. participation and brand role             (blind, process assets)
  'filler',  // unrelated task - the memory delay Game 2 depends on
  'game2',   // 2. memory and recognition                    (blind, with foils)
  'game7',   // 7. trust test                                (blind)
  'game13',  // 13. identity system flexibility              (full lockups)
  'build',   // 24. build the cake: assemble the construction states (blind)
  'game23',  // 23. final decision                           (blind marks)

  'thanks'
];

/* --------------------------------------------------------------------------
   ALL EIGHT SPECIFIED GAMES ARE NOW LIVE.

   Games 10 and 13 were switched off in an earlier build for a real reason:
   at that point the asset crops still carried the designer's working caption
   text ("the first cake layer is in place", "looks like both two Cs").
   Asking someone what a mark means while the picture tells them the answer
   is not research, it is dictation.

   That is fixed. Captions were stripped, and Game 10 now runs on wordless
   SYMBOL_ONLY process assets, so both games are back in the flow.

   Note the ORDER of the blind games. Game 2 (memory) deliberately sits after
   the other blind games, because it can only ask "which did you see?" once
   the marks have actually been seen. The 'filler' task between them is not
   padding - it is the delay that turns Game 2 into a memory test instead of
   a copying test. If you remove 'filler', remove Game 2 as well.

   OPTIONAL EXTRAS, off by default
   ------------------------------------------------------------------------
   Not part of the eight specified games. Built alongside them and available
   if a later round wants them. Add the key above to switch one on, or append
   ?mode=extended to the study URL to enable all of them at once.

     'micro1'  sequence ordering  - can people reconstruct the build order of
               the process narrative unaided? Strong evidence for the
               "building rather than receiving" idea, but it adds length.
     'micro2'  monogram reading   - does the frame read as a CC monogram?
               If used, it must come LAST. Naming the monogram out loud
               contaminates every meaning question that follows it.
     'micro3'  decoration reading - do the decorated variants read as
               decoration, or as noise?

   Keep the session between five and eight minutes. Every screen you add is a
   screen a real person has to sit through, and drop-off costs you more data
   than an extra question wins.
   -------------------------------------------------------------------------- */
