import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Live-mode proxies (LAC): the client fetches relative paths; without
      // these the dev server falls through to the SPA and live mode gets HTML
      // instead of JSON. wind-srv owns /api/*, tackle-srv owns /config/ai/*.
      proxy: {
        '/api': {
          target: process.env.VITE_WIND_SRV_TARGET || 'http://localhost:3300',
          changeOrigin: true,
        },
        '/config': {
          target: process.env.VITE_TACKLE_SRV_TARGET || 'http://localhost:3410',
          changeOrigin: true,
        },
      },
    },
  };
});
