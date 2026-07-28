# Agent Notes

This is a public, fully client-side SILO query and learning app built with Vite, React, TypeScript,
Tailwind CSS, and daisyUI. Keep the setup simple and static-host friendly; do not introduce a backend
or a heavier framework unless explicitly requested.

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
  serve deep links without SPA fallback rules. Documentation routes are derived from
  `src/data/docs.ts`; add other top-level routes to both `src/main.tsx` and `scripts/postbuild.mjs`.
- Exercise routes are generated from `src/data/exercises.ts`; changing an exercise slug changes the
  generated static route.
- `VITE_BASE` controls sub-path deployments, and `src/config.ts` derives the router basename from
  Vite's `BASE_URL`.
- `VITE_SILO_DEFAULT_SERVER` sets the Console's initial server. `VITE_SILO_EXERCISE_SERVER` is the
  separate, non-editable exercise target. Both fall back to the GenSpectrum staging SILO.

## SILO Query Behavior

- `silo-version.txt` records the SILO commit this app is currently optimized against. When updating it, review the language reference, editor highlighting, examples, and exercises against the matching SILO `documentation/query_documentation.md`.
- `src/lib/runQuery.ts` sends plain-text SILO queries to `POST <server>/query` with
  `Accept: application/x-ndjson`.
- `runBounded()` appends `.limit(100)` unless the query already has a limit, and retries without the
  added limit only for SILO's unordered-output limit error.
- Staging schema examples used by exercises include `country`, `region`, `division`, `date`,
  `pangoLineage`, `strain`, `main`, `unaligned_main`, and amino acid columns such as `S`, `N`, and
  `E`.
- Integer comparisons with `>` / `<` may not be available on all SILO columns; prefer supported
  query-language functions such as `between(...)` where appropriate.

## Exercises

- Exercises are `{ slug, title, question, explanation, documentation, answer }` objects in
  `src/data/exercises.ts`.
- The answer checker compares user rows to reference rows order-independently as a multiset.
- Reference answers should be bounded, deterministic when possible, non-empty, and small enough for
  browser use. Validate changed answers against the default staging server.
- Questions that ask for a top-N result should include an explicit `.limit(...)` in the reference
  answer so users cannot accidentally pass by relying on the automatic `.limit(100)`.

## Sequence And Alignment UI

- Sequence detection is heuristic in `src/lib/sequences.ts`: uppercase biological symbols plus
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
