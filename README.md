# Sara's Medication Log Builder

Run `npm install` and `npm run dev`, then open the local address displayed by Vite.

## Live website

The public site is hosted at https://AVRNoah.github.io/ForMyBaby/.
Pushing to `master` runs the GitHub Pages workflow, which checks and builds the app before deploying it. The deployment build uses `/ForMyBaby/` as Vite's base path; local development still uses `/`.
The website has no login protection. Do not enter patient-identifying information.

## Using the app

The **Add medications** panel starts collapsed. Open it, paste a list, and select **Find medications & labels**. Each name is automatically searched in openFDA without regard to capitalization. Entries show the matching product-label options or an explicit no-match/error message. Choose the appropriate label to populate its excerpts; the app never automatically chooses the first product. Enter one medication per line, with optional dose and route on the same line or immediately below it. Review every entry before exporting a PDF.

Typing at least three characters in a drug-name field searches the free [NLM RxTerms API](https://clinicaltables.nlm.nih.gov/apidoc/rxterms/v3/doc.html) for suggestions. Choosing a suggestion sets the name only; it does not set the route or select a specific product.

**Find FDA labels** searches the free [openFDA drug labeling API](https://open.fda.gov/apis/drug/label/). Search uses generic or brand names and allows common salt suffixes; select the appropriate product and formulation before copying label excerpts. Only complete sentences within the first 450 characters of a section are copied; other sections remain blank. Excerpts do not establish the patient's indication, dose, route, or safe administration, and may be incomplete. Use the full-label link and an appropriate current reference to verify the information. Not all products are available, and the first 50 results are shown.

Unedited label excerpts are replaced when a different label is selected and cleared when the drug name changes. Your own or edited text is preserved. If the name changes while other details remain, review or clear them before looking up another label or exporting.

Typing a medication name sends it to NLM for suggestions; label searches send it to openFDA. Do not enter names or other patient-identifying details in that field. An internet connection is needed for searches.

The interactive dachshund is adapted from the snippet supplied by the user. It roams left and right along the bottom, blinks, wags its tail, and tracks the mouse with its eyes. While roaming, it hops 20% of the viewport height every 6-12 seconds (unless hovered or focused). Click (or activate with the keyboard) to jump, double-click to switch roaming/following, or use the **Follow mouse / Roam** button revealed on hover or keyboard focus. Following mode still follows the pointer in both directions. Reduced-motion mode keeps the dog stationary and disables animation. Animation pauses in hidden tabs; listeners and timers are cleaned up on unmount.

The previously imported Kenney models remain in `public/pets/` with their CC0 license, but are no longer displayed or loaded.

The original eye-tracking cartoon is retained in `src/Dachshund.jsx`, but is not mounted in the app.

Press **Escape** for a speech bubble lasting 6.5 seconds. Each press independently selects from:

- 10%: 15 Aristotle quotations.
- 5%: 10 dog jokes.
- 85%: 50 motivational messages, including exactly 5 dog-themed messages.

Quotes do not repeat consecutively. Holding Escape does not spam messages. The dog pauses walking while speaking, and existing Escape behavior (such as dismissing suggestions) is preserved. Aristotle quotations use W. D. Ross's translations of [Metaphysics I.1](https://classics.mit.edu/Aristotle/metaphysics.1.i.html) and Nicomachean Ethics [Book I](https://classics.mit.edu/Aristotle/nicomachaen.1.i.html), [Book II](https://classics.mit.edu/Aristotle/nicomachaen.2.ii.html), and [Book VIII](https://classics.mit.edu/Aristotle/nicomachaen.8.viii.html). Shortened passages are marked as excerpts.

Escape also has an independent 5% chance of playing a real miniature dachshund bark: a 1.5-second excerpt from Ligidium's [Miniature Dachshund Bark - Indoors](https://freesound.org/people/Ligidium/sounds/192236/), released under CC0. The recording is served locally, with reduced volume and short fades; its source and license are recorded in `public/audio/LICENSE.txt`. The **Mute barks / Unmute barks** button is available alongside the dog's follow control on hover or keyboard focus. Audio starts only in response to Escape; unsupported or blocked audio displays an error in the speech bubble.

Run `npm run build`, `npm run lint`, and `node --test` to check the application.
