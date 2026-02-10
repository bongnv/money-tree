/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ONEDRIVE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
