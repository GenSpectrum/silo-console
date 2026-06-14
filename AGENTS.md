# webClient — agent notes

A static, fully client-side web app for **querying and learning SILO**. It replaces the old
`console.html`. Read this before changing anything here.

## What it is

- **Vite + React**, plain **JavaScript + JSX** (no TypeScript), plain CSS (`src/styles.css`). Keep
  it that way — the explicit goal is a _very simple_ setup deployable on nginx or GitHub Pages.
- Pages (left sidebar), via React Router `BrowserRouter`:
    - `/console` — interactive SaneQL query console.
    - `/languageReference` — concise reference distilled from `../documentation/query_documentation.md`.
    - `/exercises`, `/exercises/:slug` — practice questions with automatic answer checking.

## Commands

```sh
npm install
npm run dev          # http://localhost:5001 (dev preview; bind loopback with -- --host 127.0.0.1)
npm run build        # vite build + scripts/postbuild.mjs  -> dist/
npm run serve        # preview the build on :5001
npm test             # Vitest unit tests (co-located src/lib/*.test.js)
npm run format       # Prettier --write; check-format verifies
```

Default port is **5001** (set in `vite.config.js`). Code is formatted with Prettier (see
`.prettierrc`: printWidth 120, tabWidth 4, single quotes, trailing commas — the GenSpectrum
dashboards convention). Run `npm run format` before committing.

## Core architecture & decisions

- **Routing = real file per route ("Option B").** `scripts/postbuild.mjs` copies
  `dist/index.html` into a folder per route (`dist/console/index.html`, `dist/exercises/<slug>/…`)
  so deep links / refreshes work on static hosts with **no SPA-fallback config**. The top-level
  routes are a hardcoded list in `postbuild.mjs`; exercise routes are derived from
  `src/data/exercises.js`. **Adding a new top-level page → update both `src/main.jsx` and the
  `routes` array in `postbuild.mjs`** (and `Sidebar.jsx`).
- **Default server URL** = build-time env `VITE_SILO_DEFAULT_SERVER`
  (default `https://gs-staging-1.int.genspectrum.org/open/v2/silo`), see `src/config.js`. A header
  input overrides it at runtime, persisted in `localStorage` (`src/server/ServerContext.jsx`).
- **Sub-path deploys**: `VITE_BASE` (default `/`) feeds both Vite `base` and the router `BASENAME`.
- **Editor**: CodeMirror (`@uiw/react-codemirror`) with a lightweight SaneQL `StreamLanguage`
  highlighter in `src/lib/saneql.js`.

## SILO query API (what the client talks to)

- `POST <base>/query`, body = **plain-text SaneQL** (`Content-Type: text/plain`, not JSON-wrapped),
  `Accept: application/x-ndjson`. Response is **NDJSON** (one JSON object per line) + a `data-version`
  header. See `src/lib/runQuery.js`.

### Hard-won server constraints — do not forget these

1. **`limit`/`offset` require ordered output.** SILO rejects a limit on unordered _aggregated_
   output (bare `groupBy`/`count`) with "…can only be applied if the output of the operation has
   some ordering". `runBounded()` (in `runQuery.js`) appends `.limit(100)` and, on that specific
   error, retries the un-limited query. `withLimit()`/`isOrderingError()` live in
   `src/lib/queryTransform.js`. Always bound queries — the dataset is **~9.4M sequences**.
2. **The staging DB schema is NOT the doc's SARS-CoV-2 example schema.** Real columns include
   `country`, `region`, `division`, `date`, `age`, `pangoLineage` (**not** `pango_lineage`),
   `strain` (there is **no** `primary_key`), the nucleotide sequence `main`, amino acid sequences
   `S`, `N`, `E`, `ORF1a`, …, and `usherTree`. Discover the full column list by triggering an
   orderBy error: `default.orderBy({__x__}).limit(1)`.
3. **Integer `>` / `<` are not implemented.** Use `age.between(18, null)` instead of `age > 18`.
4. **Exercise reference answers are validated against staging** and kept small (responses must
   stay **< 3 MB**; in practice ≤ ~11 KB). If you change an answer, re-test it against staging and
   keep it bounded (an explicit `.limit(...)`, with an `orderBy` where the output would otherwise
   be unordered). Questions deliberately ask for a small "top N" (e.g. 20, not 100) so users must
   write their own `.limit(20)` rather than rely on the auto-appended `.limit(100)`.

> Note: the **Language Reference page** intentionally uses the documentation's _illustrative_
> column names (`pango_lineage`, `primary_key`, …) since it mirrors `query_documentation.md`. Those
> teach syntax but won't run verbatim against staging — that's a known, accepted mismatch.

## Exercises & answer checking

- Each exercise in `src/data/exercises.js` is `{slug, title, question, answer}`.
- On Run in an exercise, `QueryRunner` executes the **reference answer** (cached per
  `base+query`) and compares it to the user's result **order-independently** as a multiset of rows
  (`src/lib/compareResults.js`). Match → green **Correct!**, plus a **green editor border** and a
  **confetti burst** (`src/lib/celebrate.js`). Mismatch → red **Wrong!**. If the reference fails to
  run, a neutral "could not verify" note is shown.
- Both the user query and the reference go through `runBounded` (so both are `.limit(100)`-bounded).

## Sequences & alignment view

- `src/lib/sequences.js` classifies result columns: a column is a **sequence** when all its non-null
  values use the biological alphabet (uppercase IUPAC + gap/stop — this excludes long free text like
  `originatingLab`) and the longest reaches `SEQUENCE_MIN_LENGTH`; it is an **alignment** when all
  those values share one length. `ResultsTable` collapses sequence cells to a preview + `view`,
  aligned columns get an `align` header action, and other long strings (>80 chars) get a more/less
  toggle.
- `src/components/SequenceViewer.jsx` is the modal (rendered through a portal to `document.body` so
  page CSS can't leak in): a **single** sequence shows as a wrapped, position-labeled GenBank-style
  block (monospace, nucleotide-only base coloring under `MAX_COLOR_CELLS`); an **alignment** uses
  `src/components/MsaView.jsx`, a wrapper around EBI's `<nightingale-msa>` web component.
- `MsaView`: registers the nightingale elements, tracks container width, and assigns the sequence
  data via a ref **after `element.updateComplete`** (the data setter needs the element's internal
  viewer, which only exists after its first render). Labels are truncated to fit the gutter.

## Tests

- Vitest, co-located `src/lib/*.test.js` (node env, pure logic + a mocked-`fetch` `runBounded` test).
  Keep them few and high-value. `npm test` must stay green.

## Gotchas

- **Cmd/Ctrl+Enter to run** must be registered with `Prec.highest` — otherwise CodeMirror
  `basicSetup`'s default `Mod-Enter` binding ("insert blank line") wins and swallows it. See
  `src/components/QueryEditor.jsx`.
- The SaneQL highlighter maps a custom `function` token via `tokenTable` (a non-standard stream
  token name); don't drop that.
- Don't commit build artifacts: `webClient/.gitignore` ignores `node_modules`/`dist` (the repo-root
  `.gitignore`'s `dist/*` is root-anchored and does **not** cover `webClient/dist`).

## Workflow conventions (this repo)

- After any change, keep a **loopback preview** running: `npm run dev -- --host 127.0.0.1 --port 5001`.
- **Commit in logical increments and push** (`origin` is a local bare repo); branch first, never
  commit on `main`. End commit messages with the required `Co-Authored-By` trailer.
- Verifying without a manual click-through: `npm run build` (compiles all modules), headless render
  (`chromium --headless=new --dump-dom http://127.0.0.1:5001/console`), and a Node script importing
  `src/lib/*` to hit staging directly (good for validating queries / the answer-check logic).
