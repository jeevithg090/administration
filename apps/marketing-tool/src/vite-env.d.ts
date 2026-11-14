/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRAND_NAME?: string;
  readonly VITE_AI_PROXY_BASE?: string;
  readonly VITE_PROMPT_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
