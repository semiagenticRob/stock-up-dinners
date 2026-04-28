import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stockupdinners.com',
  output: 'static',
  trailingSlash: 'never',
  integrations: [sitemap()],
  build: {
    assets: '_assets',
  },
});
