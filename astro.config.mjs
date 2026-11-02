// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://linwanyu.top',
  output: 'static',
  integrations: [react(), mdx()],
  markdown: {
    // 站点是奶油底色，代码块用深色主题会像贴了一块黑胶布
    shikiConfig: { theme: 'github-light', wrap: true },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
