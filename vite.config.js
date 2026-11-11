import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { headTags, staticBody } from './seo/staticHtml.js';

/** Injects SEO tags + a static, crawlable copy of content.js into index.html. */
function contentSeo() {
  return {
    name: 'content-seo',
    transformIndexHtml(html) {
      return html.replace('<!--app-head-->', headTags()).replace('<!--app-static-->', staticBody());
    },
  };
}

export default defineConfig({
  plugins: [react(), contentSeo()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Keep three.js out of the entry so the simple 2D version stays tiny.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (id.includes('node_modules/three/')) return 'three';
          // everything else: let Rollup place it next to its (lazy) importer
        },
      },
    },
  },
});
