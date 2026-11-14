import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3001';

// In development the Express API runs separately; proxy it so the frontend can
// use same-origin relative URLs (which is also how production is served).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': apiTarget,
      '/uploads': apiTarget,
    },
  },
});
