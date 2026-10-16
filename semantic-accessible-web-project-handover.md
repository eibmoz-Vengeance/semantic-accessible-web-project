# Semantic Accessible Web Project

## Project Handover and Future Development Notes

**Project:** Semantic Accessible Web Project\
**Studio:** Flat Tire Studio\
**Copyright target:** © 2026 Semantic Accessible Web Project. All rights
reserved.\
**Status:** Early hobby project and school-assignment demonstration\
**Purpose of this document:** Preserve the current direction, known
concerns, architectural preferences, and possible next experiments so
development can resume later without having to reconstruct the
discussion.

------------------------------------------------------------------------

## 1. Project vision

The Semantic Accessible Web Project explores ways to make websites, web
applications, and games easier to understand and use through semantic
structure, accessible interaction, clear feedback, and good separation
of concerns.

The long-term idea is an **Ease of Use Library**: reusable patterns and
capabilities that developers could add to web projects to improve
usability for people, assistive technologies, and potentially AI-powered
interactions.

Guiding statement:

> The web should not require users to understand the interface before
> the interface understands the user.

Related vision statement:

> Build web experiences whose structure is understandable to humans,
> assistive technologies, and machines alike.

This is an early exploration, not a claim that a finished library
already exists. The current number-guessing game is a first test case
for the ideas. The reusable library code is not currently part of the
game implementation; it should be designed, developed, and tested
separately before it is considered for integration.

Flat Tire Studio intends to approach this gradually as a hobby project.
There is no promised release date. If the work eventually becomes useful
and stable, collaboration and a possible open-source release can be
considered. The project is interested in better assistive technology and
ease of use, not in claiming ownership of the general goal of
accessibility.

## 2. Current website and files

The project currently has a simple interactive number-guessing game and
informational pages.

Expected page files:

-   `index.html` --- interactive number-guessing game.
-   `about.html` --- explains the project vision, the game as an early
    demonstration, and the future library idea.
-   `contact.html` --- intentionally explains that no public contact
    channel has been established yet.

Supporting styles and script include:

-   `style-x.css` --- current game stylesheet.
-   `script-x.js` --- current game JavaScript.
-   `assets/css/info-pages.css` --- separate, quieter stylesheet for the
    About and Contact pages.

**Important:** Check the actual repository layout before changing paths.
The current game HTML shown during the latest discussion links to
`style-x.css` and `script-x.js` from the same directory. Earlier project
organization notes placed assets under `assets/css/` and `assets/js/`.
Keep the HTML links and real folder structure in agreement; do not move
files just to match this document.

The About and Contact pages use relative links to `index.html`,
`about.html`, and `contact.html` in the same directory. They should link
to `./assets/css/info-pages.css` if the supporting stylesheet is stored
in that location.

The existing game visual design should be preserved unless a specific
change is needed. The About and Contact pages intentionally use a more
neutral style while retaining a subtle navigation treatment, restrained
glow, and footer motif.

## 3. Current number-guessing game

The game is a small interactive example intended to be straightforward
to demonstrate on GitHub Pages.

Current game rules and behavior:

-   The player guesses a number from 1 through 100.
-   Starting score: 100 points.
-   Available wagers: 5, 10, 20, 50, and 100 points.
-   A correct guess awards twice the wager.
-   An incorrect guess deducts the wager, without allowing the score to
    fall below zero.
-   The game ends when the player has no points remaining.
-   A Restart Game button begins a new game.
-   A high score is saved in browser `localStorage`, when storage is
    available.
-   The number input uses `type="text"` with `inputmode="numeric"`, a
    digit pattern, and a maximum length of three characters. This was
    chosen while investigating unwanted zero announcements associated
    with clearing a number input.

Current HTML elements of interest:

-   `#guess-form`
-   `#user-number`
-   `[data-wager]`
-   `#points-value`
-   `#high-score-value`
-   `#reset-game-button`
-   `#game-message` --- visible feedback.
-   `#game-announcement` --- dedicated screen-reader live region.

The game has a visible feedback area separate from its dedicated live
region. The intended design is to avoid making both regions announce the
same message.

## 4. Accessibility concerns to keep visible

### 4.1 Pause, resume, and return to reading position --- high-priority future research

A key future goal is to let a person pause reading or spoken feedback,
step away, and resume without losing their place or having to reread an
entire page to recover context.

This matters especially when someone is using Narrator or another screen
reader, or when the application provides its own read-aloud experience.
The desired experience should help the user:

-   Pause at a meaningful point.
-   Step away and return later.
-   Resume from the last meaningful reading position.
-   Review what was said or what remains to be read.
-   Avoid being forced to restart a long announcement or reread a whole
    page.
-   Control the pace and avoid being overwhelmed by a rapid stream of
    announcements.

**Technical distinction:** A web page generally cannot directly pause,
resume, or inspect the speech queue of the operating system's screen
reader, such as Windows Narrator. Screen readers control their own
speech and navigation. A website must not promise universal control over
that speech unless a supported platform API actually provides it.

A more realistic design investigation has two related tracks:

1.  **Application-controlled read-aloud:** For speech generated by the
    website itself, investigate the browser Web Speech API
    (`speechSynthesis`) and its `pause()`, `resume()`, and `cancel()`
    methods. Design a reading controller that tracks the current text
    segment and reading position, and test behavior across supported
    browsers. Browser speech behavior and position reporting can vary,
    so position tracking may need to be managed by splitting text into
    stable, meaningful segments.
2.  **Screen-reader-friendly navigation and recovery:** For speech
    generated by Narrator or another screen reader, investigate
    user-controlled navigation, semantic headings and landmarks,
    meaningful focus management, concise announcements, persistent
    progress markers where appropriate, and an optional visible
    transcript or "last update" history. Do not try to take over the
    screen reader's speech queue. Explore whether a user can return to a
    stable heading, section, or last interaction without losing context.

The library may eventually offer a common pause/resume interface for
**speech the application owns**, alongside separate accessible patterns
for people using their own screen reader. These should be treated as
different capabilities, even if the user interface presents them
coherently.

Questions for future research:

-   Is the user pausing app-generated narration, live-region feedback,
    an animation, a game sequence, or their screen reader's own speech?
-   What exact position can the application reliably preserve?
-   Should resume continue the current sentence, the current paragraph,
    or the next semantic segment?
-   Can the user review recent announcements in a history panel?
-   How should keyboard shortcuts be offered without conflicting with
    screen-reader commands?
-   How will pause/resume controls be named, focused, and announced?
-   How should the experience behave with reduced-motion preferences,
    browser changes, or unsupported speech features?
-   How will users test and report whether the feature actually helps
    them?

The first implementation should be a small prototype with clear limits,
not a promise that a web page can control every screen reader.

### 4.2 Avoid duplicate or fragmented announcements

The desired interaction is a single, useful announcement containing the
result, updated score, and next action when appropriate. For example:

-   Incorrect guess: result, points lost, current score, and what to do
    next.
-   Correct guess: success, reward, current score, and what to do next.
-   Game over: result, score, game-over status, and how to restart.

Avoid separately announcing every small DOM update if doing so creates
duplicate or fragmented speech.

### 4.3 Keep visible feedback separate from spoken feedback

Maintain separate responsibilities:

-   `showMessage(message)` updates visible feedback.
-   `announceMessage(message)` updates the dedicated announcement
    region.

Do not automatically make every visible update a live announcement.
Decide intentionally which events need spoken feedback and how much
context each announcement should contain.

The current HTML uses `#game-announcement` with `role="status"`,
`aria-live="polite"`, and `aria-atomic="true"`. The visible
`#game-message` is intended not to be a second live region.

### 4.4 Avoid announcing an empty input as zero

The text input and numeric input mode were selected while investigating
an unwanted "zero" announcement when the input is cleared. Keep testing
with real browser and screen-reader combinations. Do not assume the
input type alone explains every announcement; inspect focus movement,
accessible names, live regions, and timing as well.

### 4.5 Avoid repeated navigation announcements

The "Main navigation" landmark should remain available to assistive
technology. If its label is repeatedly announced after each guess,
investigate unexpected focus movement or screen-reader navigation
behavior rather than removing useful semantics as a first response.

### 4.6 Focus, keyboard use, and motion

-   Keep visible keyboard focus indicators.
-   Keep the skip-to-main-content link on informational pages.
-   Ensure controls have meaningful names and logical focus order.
-   Use adequate target sizes and readable contrast.
-   Respect `prefers-reduced-motion`.
-   Do not rely on color, sound, animation, or visual feedback alone.
-   Test with keyboard-only navigation and actual assistive technology
    where possible.

## 5. Architectural preferences and possible library structure

The long-term library should be reusable and should not depend on a
specific web framework. It should work with semantic HTML and be
adaptable to ordinary websites, web applications, and games. Avoid
coupling the core to a framework such as Astro, React, or another
framework.

Design preferences already established:

-   Prefer **composition over inheritance**.
-   Pass capabilities or objects into components as first-class values
    where practical.
-   Keep pure decision logic separate from DOM effects.
-   Let components own the interaction they are responsible for.
-   Use coordinating controls or a facade when several components need
    to work together.
-   Make decision checkpoints explicit where a user needs context,
    choices, consequences, or a clear next action.
-   Build incrementally and test each idea before turning it into a
    general-purpose abstraction.
-   Treat ARIA and semantic HTML as important parts of the system, not
    decorative add-ons.

Potential conceptual layers:

1.  **Semantic interface:** HTML elements, labels, headings, landmarks,
    and relationships.
2.  **Interaction components:** Guess input, wager selection, score
    display, result display, pause/resume controls, and other reusable
    interactions.
3.  **Accessibility capabilities:** Focus management, announcements,
    user preferences, status history, reading position, and keyboard
    support.
4.  **Pure application logic:** Validation, game rules, scoring, state
    transitions, and decision functions.
5.  **Effect services:** Browser storage, sound, animation,
    app-controlled speech, and recovery behavior.
6.  **Coordinator/facade:** Coordinates components and services without
    taking over every responsibility.
7.  **Persistence and recovery:** Stores only the state needed to
    restore an appropriate experience, with clear privacy and
    user-control decisions.

Potential names from earlier architecture exploration include:

-   `NumberGameFacade`
-   `GuessInputComponent`
-   `PointsStatusComponent`
-   `LastResultComponent`
-   `BettingComponent`
-   `AccessibilityControl`
-   `DecisionCheckpoint`
-   Storage, audio, animation, and recovery services

These are design ideas, not a requirement to implement every class now.
Prefer small objects with clear responsibilities over an elaborate
framework built before the needs are understood.

A future library should make it easier to provide context, available
actions, consequences, results, and next steps. It should not simply add
ARIA attributes without improving the actual interaction.

## 6. Suggested development approach

A reasonable sequence for future work:

1.  Preserve the current school-assignment version and publish it as a
    clear demonstration.
2.  Keep notes on known issues rather than destabilizing the current
    version without a specific reason.
3.  Prototype one accessibility capability separately from the game.
4.  Test the capability with keyboard-only use, browser tools, and
    relevant assistive technologies.
5.  Record the limits and results.
6.  Refine the design before extracting a reusable library API.
7.  Integrate a tested version into a small example.
8.  Repeat with the next capability.

For the pause/resume concept, start with a minimal app-controlled
read-aloud prototype and separately document how screen-reader users can
navigate and recover context. Do not begin by promising direct Narrator
control.

## 7. Future game experiments

Games can serve as progressively more demanding test cases. Each
introduces new interaction patterns and lets the project test whether
its accessibility ideas generalize.

### Stage 1 --- Tic-tac-toe

A useful next experiment because the rules and board are small.

Potential challenges:

-   Represent the board semantically so a user can identify each cell
    and its contents.
-   Support keyboard navigation among cells.
-   Announce whose turn it is, the result of a move, and the current
    game status.
-   Communicate valid and invalid moves without excessive announcements.
-   Offer restart and, later, an optional opponent.
-   Explore undo or move history as ways to preserve context.

### Stage 2 --- Checkers

Introduces a larger board, piece selection, legal moves, captures, and
turn management.

Potential challenges:

-   Communicate coordinates, pieces, occupied squares, legal
    destinations, and captures.
-   Separate move validation from board presentation.
-   Provide a usable keyboard navigation model.
-   Announce a move and its consequences concisely.
-   Offer move history, undo where appropriate, and a way to review the
    board without losing the current selection.
-   Consider optional visual highlighting alongside equivalent nonvisual
    information.

### Stage 3 --- Chess

Chess adds complex rules and a much larger decision space.

Potential challenges:

-   Represent the board and pieces in a way that can be explored
    efficiently.
-   Communicate legal moves, checks, checkmate, castling, promotion, and
    other special cases.
-   Provide a move list and a reliable way to return to the current
    position.
-   Separate rules and game-state logic from input and presentation.
-   Explore hints or explanations as optional features rather than
    interruptions.
-   Consider an AI opponent later, after the core interaction is
    dependable.

### Stage 4 --- Simple side-scrolling platform game

The first real-time, movement-oriented experiment: a character moves
through a side-scrolling environment and jumps over obstacles to reach
the next section.

Potential challenges:

-   Provide alternatives to controls that depend only on precise timing
    or visual cues.
-   Make movement, jumping, collision, checkpoints, and failure states
    understandable.
-   Explore pause, resume, restart, and checkpoint recovery as core
    features.
-   Provide adjustable speed, forgiving jump timing, or other optional
    difficulty settings.
-   Offer meaningful sound or text cues without requiring sound.
-   Respect reduced-motion preferences and avoid relying on screen shake
    or flashing.
-   Investigate turn-based, step-based, or assistive control modes where
    they can preserve the intended challenge.
-   Keep the game state and physics logic separate from the accessible
    control layer.

For each game, ask: What does the player need to know? What actions are
available? What happens if an action is taken? How can they recover from
interruption? How can they inspect the current state without losing
their place?

## 8. Other implementation ideas to explore

Potential reusable features, prioritized by learning value rather than
promised delivery:

-   Pause and resume for application-controlled read-aloud.
-   A small, user-controlled history of recent announcements.
-   Stable reading segments and resume points.
-   Clear "where am I?" and "what can I do next?" support.
-   Contextual help that does not interrupt the main interaction.
-   Undo, redo, checkpoints, and recovery from interruption.
-   Consistent status messages and error recovery.
-   User preferences for verbosity, motion, sound, and interaction pace.
-   Optional step-by-step interaction for activities that would
    otherwise be time-sensitive.
-   A consistent keyboard interaction model for boards, menus, and game
    controls.
-   Tests for pure rules and state transitions, plus manual
    accessibility testing for browser behavior.
-   Documentation that distinguishes tested support from intended or
    experimental behavior.

## 9. Testing and documentation principles

-   Test behavior, not only the presence of ARIA attributes.
-   Check keyboard use, focus order, focus visibility, and recovery
    after interruption.
-   Test with actual screen readers where possible; browser automation
    alone cannot verify the quality of speech output.
-   Keep visible feedback and spoken feedback coordinated but not
    duplicated.
-   Document known limitations honestly.
-   Prefer small prototypes and user feedback over assumptions about
    what assistive-technology users need.
-   Avoid claiming a particular accessibility conformance level without
    appropriate evaluation.
-   Preserve working versions and make focused changes.

## 10. Immediate handover checklist

When returning to the project:

-   [ ] Confirm the current repository folder layout and
    stylesheet/script paths.
-   [ ] Open `index.html`, `about.html`, and `contact.html` locally.
-   [ ] Confirm all navigation links and stylesheets load.
-   [ ] Verify the game still starts, accepts guesses, handles wagers,
    updates scores, ends, and restarts.
-   [ ] Test that visible feedback does not duplicate the dedicated
    live-region announcement.
-   [ ] Revisit the unwanted "zero" and repeated-navigation announcement
    concerns when ready.
-   [ ] Keep the current version stable for the school assignment unless
    a specific correction is needed.
-   [ ] Start the pause/resume research as a separate, narrowly scoped
    prototype.
-   [ ] Record what the prototype can control (app-generated speech) and
    what it cannot control (the operating system screen reader's private
    speech queue).
-   [ ] Choose the next game experiment only after deciding what
    accessibility question it will help answer.

------------------------------------------------------------------------

## Closing direction

The project does not need to become a large framework immediately. The
most useful next step is to keep asking small, testable questions about
how people interact with web experiences, especially when they use
assistive technology or need to pause and return later.

The number game is the first experiment. Tic-tac-toe, checkers, chess,
and a simple side-scroller can become later test cases. The eventual
library should emerge from patterns that have been implemented, tested,
and shown to be useful---not from abstractions created too early.
