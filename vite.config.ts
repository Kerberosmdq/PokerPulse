import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'icon-192.png', 'icon-512.png'],
      // Incluir las fuentes en la caché: la app tiene que funcionar sin internet
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png}', '**/*latin*.woff2'], globIgnores: ['**/logo.png'] },
      manifest: {
        name: 'NexPulse',
        short_name: 'NexPulse',
        description: 'Reloj de ciegas y gestor de torneos de póker',
        lang: 'es',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        start_url: '/',
        // Sin orientación fija: el control remoto se usa en el celular en vertical
        icons: [
          { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ]
      }
    })
  ],
})
