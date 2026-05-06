import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => {
          // Don't rewrite /api/todos, keep it as is
          if (path.startsWith('/api/todos')) {
            return path;
          }
          return path.replace(/^\/api/, '');
        }
      }
    }
  }
})
