/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot: {
    dispose: (callback: () => void) => void;
  } | undefined;
}
