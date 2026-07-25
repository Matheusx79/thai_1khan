# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A static, single-page web app (Portuguese-language UI) for memorizing Muay Thai technique names in Thai, for the 1º Khan (Branco) grading exam (AITMA/CBAMCT). No framework, no build step — plain HTML/CSS/JS loaded directly by the browser.

## Commands

- `npm run dev` — serves the app at `http://localhost:3000` via `http-server` (only script defined; no build/lint/test tooling exists in this repo).
- Alternatively just open `index.html` directly in a browser, or serve the folder with any static file server — nothing needs compiling.
- There are no automated tests, linter, or build process. Verify changes by loading the page in a browser and exercising the affected tab (Catálogo / Estudar / Treinar).

## Architecture

The app is three tabs (Catalog, Flashcards, Quiz) sharing one data source, wired together by two plain `<script>` tags in `index.html` (order matters: `js/data/techniques.js` must load before `js/app.js`, since app.js reads `window.techniquesData`).

- **`js/data/techniques.js`** — single source of truth, an IIFE that assigns `window.techniquesData = { categories, items }`.
  - `categories`: dict keyed by category id (`mahd`, `tee`, `tip`, `khao`, `sok`, `contagem`, `boran`) with `title`, `icon`, `description`, `image`.
  - `items`: flat array of technique entries — `{ id, category, thName, thScript, ptName, notes }` (`thName` = romanized Thai, `thScript` = Thai script used for TTS, `ptName` = Portuguese translation).
  - To add/edit vocabulary, edit only this file — all three tabs (category dropdown, flashcard category buttons, quiz category checkboxes, catalog cards) derive their UI from this data automatically.

- **`js/app.js`** — a single IIFE holding one central `state` object (`state.catalog`, `state.flashcards`, `state.quiz`) and one `init*` function per tab (`initCatalog`, `initFlashcards`, `initQuiz`), wired up by `initTabs()` which toggles `.active` classes on tab buttons/sections. There is no virtual DOM or reactive binding — every state mutation must be followed by an explicit re-render call (`renderCatalog()`, `updateFlashcardUI()`, `displayQuestion()`), matching the pattern already used by each feature's own event handlers.

- **Thai audio (`speakThai`)** — a 3-tier fallback chain, in order: (1) native `SpeechSynthesis` with an installed Thai voice, (2) Google Translate TTS endpoint (`translate.google.com/translate_tts?...tl=th`) played via an `Audio` element with `referrerPolicy = "no-referrer"` (required for this to work when hosted on GitHub Pages — do not remove), (3) local `SpeechSynthesis` reading the romanized (`thName`) text as a last resort. Any change touching audio playback must preserve all three tiers and the no-referrer policy.

- **Known dead code**: `openVideoModal`/`closeVideoModal` in `js/app.js` reference DOM ids (`video-modal`, `modal-iframe`, `modal-direct-link`, `modal-search-link`) that no longer exist in `index.html` — the markup was reworked to a simpler image-based modal (`technique-modal`, `modal-image`, `modal-description`) and these two functions are currently unreferenced/non-functional. Don't assume they work; either wire them to the current modal markup or remove them if touching that area.

- **Styling** (`styles/main.css`) — a single stylesheet driven by CSS custom properties (e.g. `--accent-gold`, `--bg-tertiary`, `--border-radius-md`) defined once and reused across components; follow the existing variable names rather than hardcoding colors/sizes.

- **Deployment**: the project is served from GitHub Pages (see recent commit history around TTS referrer-policy fixes) — there is no server-side code, so all functionality must work as static files.

## Responsive Design (PC + Phone)

This app must work well on both desktop and phone screens — real users take this exam-prep tool out on a phone. Any UI change (new markup, new component, layout/spacing/typography edit) must be verified at both a desktop width and a narrow phone width (~360-430px) before being considered done, not just at whatever width the editor/browser happens to be.

- Existing breakpoints in `styles/main.css`: `768px` (search/filter bar stacking), `576px` (quiz options grid), and `480px` (small-phone breakpoint covering header, nav tabs, catalog cards, flashcard box/fonts, quiz setup/board, and the detail modal). Add new mobile-specific rules inside the existing `480px` block (or a new breakpoint following the same fixed-value media-query pattern) rather than introducing `clamp()`-based fluid scaling, to stay consistent with the rest of the file.
- To test on a real phone on the same Wi-Fi: run `npm run dev`, then open the **LAN IP** it prints (e.g. `http://192.168.x.x:3000`) on the phone — `http://localhost:3000` only resolves to the phone itself, not the PC, so it will never work from a phone. If the phone still can't connect, the most common cause is router AP/client isolation, not the app or Windows Firewall (Node.js already has an inbound-allow firewall rule on Private+Public profiles by default).
- Browser automation viewport resize (e.g. Claude's Chrome tools) may not reflect real narrow-width rendering reliably in this environment — embedding the page in a sized `<iframe>` and screenshotting that region is a working fallback for emulating a phone viewport when real-device testing isn't immediately available. Real-device testing on an actual phone remains the final check.
