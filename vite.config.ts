import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BASE_PATH = '/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-32.png', 'icons/favicon-48.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'WheelScore',
        short_name: 'WheelScore',
        description: 'Bank-internal car loan scorecard calculator',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        display: 'standalone',
        background_color: '#f5f6f9',
        theme_color: '#2554c7',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
        // Cloudflare's reserved /cdn-cgi/ paths (e.g. Access logout) must hit the
        // network directly, never the cached app-shell navigation fallback.
        navigateFallbackDenylist: [/^\/cdn-cgi\//],
      },
    }),
  ],
})
