/* ==========================================================================
   formspree-config.js
   --------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO GO LIVE.

   1. Create a free form at https://formspree.io
   2. Copy the form endpoint it gives you (looks like https://formspree.io/f/abcdwxyz)
   3. Paste it into ENDPOINT below.
   4. Save, commit, push. Done.

   If you leave ENDPOINT empty the study still works perfectly — every response
   is stored in the browser on the participant's device and you can export it
   from dashboard.html. That is a good way to test before you go live.
   ========================================================================== */

window.FORMSPREE_CONFIG = {

  // Paste your Formspree (or Netlify) endpoint between the quotes.
  ENDPOINT: 'https://formspree.io/f/xqpkllpw',

  // 'formspree'  → sends JSON. Use this for Formspree.
  // 'netlify'    → sends url-encoded form data. Use this for Netlify Forms.
  // 'none'       → never sends anything; local storage only.
  MODE: 'formspree',

  // Only used when MODE is 'netlify'. Must match the form name in your HTML.
  NETLIFY_FORM_NAME: 'cakecue-testing-lab',

  // If a send fails, the response is always kept on the device so nothing is
  // ever lost. Set to false if you would rather it failed loudly.
  FALLBACK_TO_LOCAL: true

};
