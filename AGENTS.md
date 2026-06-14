# Agent Notes

This is a public, fully client-side SILO query and learning app built with Vite, React, TypeScript,
and plain CSS. Keep the setup simple and static-host friendly; do not introduce a backend or a heavier
framework unless explicitly requested.

## Commands

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run check-format
npm run build
```

Run `npm run format` before committing formatting-sensitive changes. The default development and
preview port is 5001.

## Architecture

- Routes live in `src/main.tsx` and are rendered through React Router `BrowserRouter`.
- `scripts/postbuild.mjs` copies `dist/index.html` into real route directories so static hosts can
  serve deep links without SPA fallback rules. When adding a top-level route, update `src/main.tsx`,
  `src/components/Sidebar.tsx`, and the `routes` array in `scripts/postbuild.mjs`.
- Exercise routes are generated from `src/data/exercises.js`; changing an exercise slug changes the
  generated static route.
- `VITE_BASE` controls sub-path deployments, and `src/config.js` derives the router basename from
  Vite's `BASE_URL`.
- The default SILO server is `VITE_SILO_DEFAULT_SERVER`, falling back to
  `https://gs-staging-1.int.genspectrum.org/open/v2/silo`.

## SILO Query Behavior

- `src/lib/runQuery.js` sends plain-text SaneQL to `POST <server>/query` with
  `Accept: application/x-ndjson`.
- `runBounded()` appends `.limit(100)` unless the query already has a limit, and retries without the
  added limit only for SILO's unordered-output limit error.
- Staging schema examples used by exercises include `country`, `region`, `division`, `date`,
  `pangoLineage`, `strain`, `main`, `unaligned_main`, and amino acid columns such as `S`, `N`, and
  `E`.
- Integer comparisons with `>` / `<` may not be available on all SILO columns; prefer supported
  query-language functions such as `between(...)` where appropriate.

## Exercises

- Exercises are `{ slug, title, question, answer }` objects in `src/data/exercises.js`.
- The answer checker compares user rows to reference rows order-independently as a multiset.
- Reference answers should be bounded, deterministic when possible, non-empty, and small enough for
  browser use. Validate changed answers against the default staging server.
- Questions that ask for a top-N result should include an explicit `.limit(...)` in the reference
  answer so users cannot accidentally pass by relying on the automatic `.limit(100)`.

## Sequence And Alignment UI

- Sequence detection is heuristic in `src/lib/sequences.js`: uppercase biological symbols plus
  gap/stop characters, with a minimum length.
- Aligned sequence columns offer the table-header `align` action only when all non-null values share
  one length.
- `src/components/MsaView.tsx` uses Nightingale custom elements. Keep imports as used value imports;
  side-effect-only imports can be tree-shaken from production builds.
- `QueryEditor.tsx` registers Cmd/Ctrl+Enter with `Prec.highest`; otherwise CodeMirror's default
  key binding can win.

## Public Repository Hygiene

Do not commit local machine paths, private workflow notes, generated `dist/` output, `node_modules/`,
credentials, personal access tokens, or deployment state. Keep repository instructions useful to any
contributor or agent working from a normal clone.
