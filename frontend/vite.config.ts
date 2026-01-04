import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Root path for local development
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-image',
      '@tiptap/extension-text-align',
    ],
  },
  build: {
    outDir: '../public_html/newsite', // Still build to newsite for production
    emptyOutDir: false, // Don't empty to preserve .htaccess
    assetsDir: 'assets',
    copyPublicDir: true,
  },
  publicDir: 'public',
})
