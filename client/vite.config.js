import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const pwaPlugin = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'robots.txt', 'icons/icon-192.png', 'icons/icon-512.png'],
  manifest: {
    name: 'TimeFlow',
    short_name: 'TimeFlow',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    description: 'Planowanie dnia, statystyki i archiwum zadań w jednym miejscu',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  },
  workbox: {
    cleanupOutdatedCaches: true,
    navigateFallback: '/index.html',
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.destination === 'document',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
      {
        urlPattern: ({ request }) =>
          request.destination === 'style' ||
          request.destination === 'script' ||
          request.destination === 'worker',
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'assets-cache',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          },
        },
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5,
          },
        },
      },
    ],
  },
  devOptions: {
    enabled: true,
    type: 'module',
  },
});

pwaPlugin.enforce = 'post';

export default defineConfig({
  define: {
    'process.env': process.env,
  },
  plugins: [react(), pwaPlugin],
  server: {
    open: true,
    host: true,
    proxy: {
      '/tasks': 'http://localhost:3001',
    },
  },
});
