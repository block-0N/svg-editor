import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(() => {
  const isElectron = process.env.ELECTRON === 'true';

  const input: Record<string, string> = isElectron
    ? { app: resolve(__dirname, 'app.html') }
    : {
        index: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
      };

  return {
    base: isElectron ? './' : '/svg-editor/',
    plugins: [react()],
    build: { rollupOptions: { input } },
  };
});
