import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Static build for GitHub Pages: no Worker, no D1. The app runs entirely in
// the browser against localStorage (src/app/lib/local.ts).
export default defineConfig({
  base: '/Genai-website/',
  plugins: [react(), tailwindcss()],
  define: { 'import.meta.env.VITE_STATIC': JSON.stringify('1') },
  build: { outDir: 'dist-pages', emptyOutDir: true },
})
