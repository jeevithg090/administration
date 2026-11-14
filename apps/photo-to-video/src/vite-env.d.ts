/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute URL of the API when it is hosted on another origin. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
