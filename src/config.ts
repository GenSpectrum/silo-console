import siloWasmSource from '../silo-wasm-source.txt?raw';

// Default Console server, configurable at build time.
export const DEFAULT_CONSOLE_SERVER =
    import.meta.env.VITE_SILO_DEFAULT_SERVER || 'https://gs-staging-1.int.genspectrum.org/open/v2/silo';

// Exercises always use this build-time target. It is never editable in the UI.
export const EXERCISE_SERVER =
    import.meta.env.VITE_SILO_EXERCISE_SERVER || 'https://gs-staging-1.int.genspectrum.org/open/v2/silo';

// Browser-local SILO is an opt-in deployment capability because its pthread WASM build requires
// both separately supplied assets and cross-origin-isolation response headers.
export const SILO_WASM_ENABLED = import.meta.env.VITE_SILO_WASM_ENABLED === 'true';

export const SILO_WASM_VERSION = /^SILO commit:\s*(\S+)/m.exec(siloWasmSource)?.[1] ?? 'unknown';

// React Router basename, kept in sync with Vite's `base` for sub-path deploys.
// import.meta.env.BASE_URL is "/" by default, or e.g. "/repo/" on GitHub Pages.
export const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '');
