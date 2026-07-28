# SILO website

The public homepage, documentation, exercises, and browser-based query Console for [SILO](https://github.com/GenSpectrum/LAPIS-SILO). The site is a fully client-side React and TypeScript application built with Vite, Tailwind CSS, and daisyUI. It can be hosted as static files and has no backend of its own.

## Site areas

- `/` introduces SILO, its use cases, and the available learning and query tools.
- `/docs` explains SILO's data and query model and provides the query-language and HTTP API references.
- `/exercises` teaches the query language through tasks on a fixed SARS-CoV-2 staging dataset. Exercise and reference queries always use the configured exercise server.
- `/console` connects to a listed public SILO instance or a browser-accessible custom URL, displays `/info` and `default.schema()`, runs queries, and renders the results.

The Console sends requests directly from the visitor's browser. The target SILO instance must be reachable from that browser and allow the site's origin through its CORS policy. The site does not collect credentials or proxy requests. Shared Console links store the server and query in the URL fragment, which is not sent to the static site host.

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

| Variable                    | Default                  | Purpose                                                                             |
| --------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `VITE_SILO_DEFAULT_SERVER`  | GenSpectrum staging SILO | Initial server shown by the Console. Visitors may connect another instance.         |
| `VITE_SILO_EXERCISE_SERVER` | GenSpectrum staging SILO | Fixed server used by exercises and reference answers. It is not editable in the UI. |
| `VITE_BASE`                 | `/`                      | Public base path, such as `/silo-console/` for a GitHub Pages project site.         |

Example:

```sh
VITE_SILO_DEFAULT_SERVER=https://silo.example.org npm run build
```

## Query results

The Console requests NDJSON and infers a few presentation details from the returned values:

- Uppercase biological strings of at least 40 characters are displayed as sequences.
- Equally sized aligned sequence values can be opened together in the alignment viewer.
- Queries without a top-level `.limit(...)` are bounded to 100 rows for interactive use. If SILO rejects that limit for an unordered aggregate, the Console retries the original query.
- Long values are collapsed in the result table and can be expanded on demand.

## SILO compatibility

`silo-version.txt` records the SILO commit against which the language reference, syntax highlighting, examples, and exercises were checked. When updating it, compare the site with SILO's `documentation/query_documentation.md` and validate exercise answers against the configured staging server.

## Docker

The multi-stage image builds the static site and serves it with nginx on port 5001.

```sh
docker build -t silo-website .
docker run -p 5001:5001 silo-website
```
