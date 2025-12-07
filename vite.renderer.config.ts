import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/renderer/main/index.html'),
        settings: path.resolve(__dirname, 'src/renderer/settings/settings.html'),
      },
    },
  },
});
