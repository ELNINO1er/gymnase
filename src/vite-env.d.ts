/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_API_URL: string;
  readonly VITE_WAVE_PAYMENT_LINK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
