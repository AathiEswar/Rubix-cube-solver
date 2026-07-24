import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config: React plugin + dev server on 5173, proxying /api requests to
// the Express solver server on 3535 so the client can use relative URLs.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3535',
    },
  },
});
