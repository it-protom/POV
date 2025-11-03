import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    // Skip type checking to avoid blocking build
    // Types will be checked in development
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  // Define environment variables for build
  define: {
    'process.env.VITE_PUBLIC_URL': JSON.stringify(process.env.VITE_PUBLIC_URL || ''),
    'process.env.VITE_FRONTEND_URL': JSON.stringify(process.env.VITE_FRONTEND_URL || ''),
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Log per debugging
            if (req.url?.includes('/auth/signin')) {
              console.log('🔄 Proxying auth request:', req.url);
            }
          });
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
        },
        // Gestisci i redirect correttamente per NextAuth
        followRedirects: true,
        // Non riscrivere i redirect (NextAuth gestisce i suoi redirect)
        rewrite: (path) => path,
      },
    },
  },
})



