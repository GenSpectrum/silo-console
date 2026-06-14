# SILO Web Client

A small, fully client-side web app for querying and learning SILO. It is a static
React + TypeScript (Vite) application — it can be served by any static host
(nginx, GitHub Pages, …) with no backend of its own.

Pages (left sidebar):

- **`/console`** — interactive query console: write a SaneQL query and run it
  against a SILO server. Long genomic sequences are collapsed to a preview; a
  `view` opens them in a sequence viewer, and aligned columns can be opened as a
  multi-row alignment (position ruler, base coloring, mismatch highlighting).
- **`/languageReference`** — a concise reference for the SILO query language.
- **`/exercises`**, **`/exercises/:slug`** — practice questions; your result is
  compared against a hidden reference answer for a Correct!/Wrong! verdict.

## How results are interpreted

SILO's `/query` endpoint returns rows without a schema, so the client infers a few things from the
result data itself. These behaviors are intentional but worth knowing, since they are not configured
per column:

- **Sequence columns** — a column is treated as a genomic sequence (collapsed to a preview with a
  `view` action) when all its non-null values are uppercase IUPAC symbols (nucleotide/amino acid)
  plus gap/stop and the longest value is ≥ 40 characters.
- **Alignments** — a sequence column offers the `align` action only when all its non-null values
  share the same length.
- **Nucleotide vs amino acid** — inferred from the alphabet; controls the `nt`/`aa` length label, the
  MSA color scheme (`nucleotide` vs `clustal`), and whether base coloring is applied.
- **Row labels** — sequence and alignment rows are labelled by their 1-based row number, matching the
  results table's `#` column (no identifier column is guessed).
- **Column width** — each column is sized to fit its header on one line, with a 150px minimum. Cells
  stay on a single line and truncate with an ellipsis; content that doesn't fit can be expanded —
  strings with a more/less toggle, sequences with the `view` button.
- **Automatic `.limit(100)`** — appended to every query that does not already contain a `.limit(...)`
  (detected by a text scan that ignores `--` comments and string literals). If the server rejects the
  limit because the output is unordered/aggregated, the query is retried once without it.
- **Display caps** — the alignment view renders at most the first 200 rows and opens on the first 60
  columns (zoom/pan with the ruler); per-base coloring is skipped for very large sequences.

## Development

```sh
npm install
npm run dev          # http://localhost:5001
npm run typecheck    # TypeScript
npm test             # run unit tests (Vitest)
npm run format       # format with Prettier (check-format to verify)
```

## Production build

```sh
npm run build        # outputs static files to dist/
npm run serve        # preview the build on http://localhost:5001
```

`npm run build` runs the TypeScript checker, `vite build`, and then a post-build step
(`scripts/postbuild.mjs`) that copies `dist/index.html` into a real folder for
every route (`dist/console/index.html`, `dist/exercises/<slug>/index.html`, …).
This makes deep links and refreshes work on static hosts without any SPA-fallback
configuration.

## Configuration (environment variables)

These are read at **build time** (the app is static, so the value is baked into
the bundle).

| Variable                   | Default                                                 | Purpose                                                                                                           |
| -------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `VITE_SILO_DEFAULT_SERVER` | `https://gs-staging-1.int.genspectrum.org/open/v2/silo` | Default SILO server URL shown in the header. Users can still override it in the UI (persisted in `localStorage`). |
| `VITE_BASE`                | `/`                                                     | Public base path. Set to e.g. `/silo-console/` when deploying under a sub-path (GitHub Pages project sites).      |

Example:

```sh
VITE_SILO_DEFAULT_SERVER=https://my-silo.example.org/api npm run build
```

## Docker

A simple multi-stage image builds the app and serves it with nginx on port 5001.

```sh
docker build -t silo-web .
docker run -p 5001:5001 silo-web
# override the default server:
docker build --build-arg VITE_SILO_DEFAULT_SERVER=https://my-silo/api -t silo-web .
```

## Deployment (GitHub Pages)

Only the source is committed; GitHub Actions builds and deploys it. `.github/workflows/deploy.yml`
builds on every push to `main` with `VITE_BASE=/silo-console/` and publishes `dist/` to GitHub
Pages, so the site is served at `https://<owner>.github.io/silo-console/`. `.github/workflows/ci.yml`
checks formatting, runs the tests, and builds on every push and pull request.

To point the deployed site at a different SILO server, set a repository **variable**
`VITE_SILO_DEFAULT_SERVER` (Settings → Secrets and variables → Actions → Variables). The SILO server
must allow CORS requests from the Pages origin. Users can also override the server in the header.
