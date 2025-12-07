import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  // Set root to src/renderer to access both main and settings
  root: 'src/renderer',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/renderer/main/index.html'),
        settings: path.resolve(__dirname, 'src/renderer/settings/settings.html'),
      },
    },
  },
});
