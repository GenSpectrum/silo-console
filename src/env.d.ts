/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly PUBLIC_RHYDB_DEFAULT_SERVER?: string;
    readonly PUBLIC_RHYDB_EXERCISE_SERVER?: string;
    readonly PUBLIC_RHYDB_WASM_ENABLED?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
