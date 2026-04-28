/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_BEEHIIV_SUBSCRIBE_URL: string | undefined;
  readonly PUBLIC_GA4_MEASUREMENT_ID: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
