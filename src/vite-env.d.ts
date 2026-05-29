/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_CLIENT_URL: string;
  readonly VITE_ADMIN_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_WAVE_PAYMENT_LINK: string;
  readonly VITE_CODE_ADMIN: string;
  readonly VITE_CODE_DEMO: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
