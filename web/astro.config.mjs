import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stockupdinners.com',
  output: 'static',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.endsWith('/thanks') &&
        !page.endsWith('/thanks/') &&
        !page.endsWith('/404') &&
        !page.endsWith('/404/'),
    }),
  ],
  build: {
    assets: '_assets',
  },
});
