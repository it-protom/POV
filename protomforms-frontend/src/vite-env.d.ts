/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_PUBLIC_URL?: string;
  readonly VITE_FRONTEND_URL?: string;
  readonly VITE_FLOWISE_API_URL?: string;
  readonly VITE_FLOWISE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

