import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/web-storage-benchmark/',
  define: {
    global: 'window',
    'process.env': {},
    'process.browser': true,
  },
  resolve: {
    alias: {
      'pouchdb-browser': 'pouchdb-browser/lib/index.js',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('lucide')) return 'vendor-charts';
            if (id.includes('pouchdb') || id.includes('dexie')) return 'vendor-db-core';
            if (id.includes('localforage') || id.includes('store')) return 'vendor-db-utils';
            if (id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
        },
      },
      onwarn(warning, warn) {
        // Suppress eval warning from 'store' package which uses it for legacy JSON support
        if (warning.code === 'EVAL' && warning.id?.includes('store')) return;
        warn(warning);
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
