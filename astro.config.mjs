import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://onehousing.club',
  build: {
    format: 'preserve',
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
  ],
});
