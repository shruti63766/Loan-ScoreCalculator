import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this app from a /<repo-name>/ subpath; every other
// deploy target (Cloudflare Workers, etc.) serves it from the domain root.
const BASE_PATH = process.env.DEPLOY_TARGET === 'github-pages' ? '/Loan-ScoreCalculator/' : '/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-32.png', 'icons/favicon-48.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Car Loan Score Calculator',
        short_name: 'Loan Score',
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
