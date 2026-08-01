# RhyDB website

The public homepage, documentation, exercises, and browser-based query Console for [RhyDB](https://github.com/GenSpectrum/LAPIS-SILO). The site is a fully client-side React and TypeScript application built with Vite, Tailwind CSS, and daisyUI. It can be hosted as static files and has no backend of its own.

## Site areas

- `/` introduces RhyDB, its use cases, and the available learning and query tools.
- `/docs` explains RhyDB's data and query model and provides the query-language and HTTP API references.
- `/exercises` teaches the query language through tasks on a fixed SARS-CoV-2 staging dataset. Exercise and reference queries always use the configured exercise server.
- `/console` connects to a listed public RhyDB instance or a browser-accessible custom URL, displays `/info` and `default.schema()`, runs queries, and renders the results. Deployments may also enable browser-local RhyDB for preprocessing and querying files that remain on the visitor's device.

The Console sends requests directly from the visitor's browser. The target RhyDB instance must be reachable from that browser and allow the site's origin through its CORS policy. The site does not collect credentials or proxy requests. Shared Console links store the server and query in the URL fragment, which is not sent to the static site host.

When browser-local RhyDB is enabled, uploaded files, preprocessing, state loading, and queries remain in the current browser tab. The local database is cleared when the visitor reloads or closes the tab. Processed data can be downloaded as a ZIP and opened again later.

## Development

```sh
npm install
npm run dev          # http://localhost:5001
npm run typecheck
npm test
npm run check-format
npm run build
```

Run `npm run format` before committing formatting-sensitive changes.

`npm run build` typechecks the application, builds it into `dist/`, and creates a real `index.html` for every route. This allows direct loads and browser refreshes on static hosts without SPA fallback rules.

## Configuration

Vite reads these variables at build time:

| Variable                     | Default                   | Purpose                                                                                                        |
| ---------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `VITE_RHYDB_DEFAULT_SERVER`  | GenSpectrum staging RhyDB | Initial server shown by the Console. Visitors may connect another instance.                                    |
| `VITE_RHYDB_EXERCISE_SERVER` | GenSpectrum staging RhyDB | Fixed server used by exercises and reference answers. It is not editable in the UI.                            |
| `VITE_RHYDB_WASM_ENABLED`    | `false`                   | Adds the opt-in browser-local RhyDB target. Requires administrator-supplied WASM assets and isolation headers. |
| `VITE_BASE`                  | `/`                       | Public base path, such as `/rhydb-console/` for a GitHub Pages project site.                                   |

Example:

```sh
VITE_RHYDB_DEFAULT_SERVER=https://rhydb.example.org npm run build
```

## Browser-local RhyDB

The pthread-enabled RhyDB WASM files are supplied separately at build time. Their source commit and GitHub Actions artifact are recorded in `rhydb-wasm-source.txt`. Download that artifact and place its two files in `.rhydb-wasm/`, or point `RHYDB_WASM_ASSET_DIR` at another directory:

```sh
gh run download 30373590930 --repo GenSpectrum/LAPIS-SILO --name silo-wasm --dir .rhydb-wasm
VITE_RHYDB_WASM_ENABLED=true npm run build
VITE_RHYDB_WASM_ENABLED=true npm run serve -- --host 127.0.0.1 --port 5001
```

An enabled build fails when `rhydb_wasm.js` or `rhydb_wasm.wasm` is absent. Disabled builds omit both files and the local-data tab. GitHub Pages uses the disabled default.

WASM threads require a secure, cross-origin-isolated page. The development/preview server sets the headers when the feature flag is enabled, and the included nginx configuration sets them for container deployments:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

To build the container with local RhyDB, place the files in `.rhydb-wasm/` before building:

```sh
docker build --build-arg VITE_RHYDB_WASM_ENABLED=true -t rhydb-website .
```

Raw preprocessing accepts one preprocessing YAML and the files it references: one plain NDJSON or `.zst` input, the database configuration, the reference genome, and any configured lineage-definition or phylogenetic-tree files. The browser matches references by filename and reports missing or duplicate selections before loading WASM. Inputs above 500 MB are allowed with a memory warning; whether they fit depends on the resulting RhyDB indexes and the browser's 2 GiB WASM memory ceiling.

## Query results

The Console requests NDJSON and infers a few presentation details from the returned values:

- Uppercase biological strings of at least 40 characters are displayed as sequences.
- Equally sized aligned sequence values can be opened together in the alignment viewer.
- Queries without a top-level `.limit(...)` are bounded to 100 rows for interactive use. If RhyDB rejects that limit for an unordered aggregate, the Console retries the original query.
- Long values are collapsed in the result table and can be expanded on demand.

## RhyDB compatibility

`rhydb-version.txt` records the RhyDB commit against which the language reference, syntax highlighting, examples, and exercises were checked. When updating it, compare the site with RhyDB's `documentation/query_documentation.md` and validate exercise answers against the configured staging server.

## Docker

The multi-stage image builds the static site and serves it with nginx on port 5001.

```sh
docker build -t rhydb-website .
docker run -p 5001:5001 rhydb-website
```
