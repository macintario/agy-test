import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/celex/',
  plugins: [react()],
  server: {
    port: 5176,
    allowedHosts: ['www.kuali.des.ipn.mx'],
    proxy: {
      '/celex/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/celex/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
