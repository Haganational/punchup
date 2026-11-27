import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The whole game builds into one self-contained index.html,
// so it can be hosted anywhere (GitHub Pages, a file share, an attachment).
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    assetsInlineLimit: 10_000_000,
    chunkSizeWarningLimit: 4000,
  },
});
