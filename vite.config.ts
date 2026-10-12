import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import { PYODIDE_URL } from './src/python/protocol.ts';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  worker: { format: 'es' },
  // in development, the API runs on port 3000 (npm run dev starts both)
  server: { proxy: { '/api': 'http://localhost:3000' } },
  preview: { proxy: { '/api': 'http://localhost:3000' } },
  // the main file holds the whole course (65 lessons of text): ~650 kB, ~200 kB compressed
  build: { chunkSizeWarningLimit: 800 },
  plugins: [
    react(),
    // Installable app (PC and phone) that keeps working offline once opened: the app itself is
    // precached, and Pyodide (downloaded from the CDN the first time) is kept in a cache.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo-96.png'],
      manifest: {
        name: 'PyBac : Python et NSI',
        short_name: 'PyBac',
        description: 'Apprendre Python et l\'algorithmique depuis zéro, puis préparer le bac NSI.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0B226B',
        theme_color: '#1F4B73',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
        // only the latin letters of the font are needed (French); the other subsets load on demand
        globIgnores: ['**/*cyrillic*', '**/*vietnamese*', '**/*latin-ext*'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // a RegExp, not a function: the function would be copied as text into the service
            // worker, where PYODIDE_URL does not exist
            urlPattern: new RegExp(`^${PYODIDE_URL.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pyodide',
              expiration: { maxEntries: 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
