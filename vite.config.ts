import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Habitrack',
        short_name: 'Habitrack',
        description: 'Basic Kids Habit and Manners Tracker',
        theme_color: '#f8fafc',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Make it accessible on LAN
    port: 3020,      // Port aligned with implementation plan
    proxy: {
      '/api': 'http://127.0.0.1:3021'
    }
  }
})
