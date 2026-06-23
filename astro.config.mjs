import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://allstar26.vercel.app',
  build: {
    format: 'preserve',
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
  ],
});
