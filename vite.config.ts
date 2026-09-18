import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
      build: {
    target: 'esnext',
    minify: 'esbuild' as const,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          reactVendor: ['react', 'react-dom'],
          firebaseVendor: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          icons: ['lucide-react'],
          pdfLib: ['pdf-lib'],
          framerMotion: ['framer-motion']
        }
      }
    }
  },
  plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png'],
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/(?!upload).*/i,
              handler: 'NetworkOnly',
              options: {
                backgroundSync: {
                  name: 'api-queue',
                  options: {
                    maxRetentionTime: 24 * 60
                  }
                }
              }
            },
            {
              urlPattern: /^\/api\/upload/i,
              handler: 'NetworkOnly'
            }
          ]
        },
        manifest: {
          id: '/',
          name: 'MPM Printer',
          short_name: 'MPM Printer',
          description: 'Online printer ordering system with real-time tracking, document uploads, secure authentication, and account settings.',
          theme_color: '#2563eb',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/logo.png',
              sizes: '192x192 512x512',
              type: 'image/png',
              purpose: 'any maskable',
            }
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
