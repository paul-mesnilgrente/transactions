import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served at the root of the custom domain https://compta.beekuty.fr/
  base: '/',
  plugins: [react()],
  css: {
    preprocessorOptions: {
      // Quiet Bootstrap's own Sass deprecations, plus the @import notice
      // (Bootstrap 5.3 still ships @import-based Sass).
      scss: { quietDeps: true, silenceDeprecations: ['import'] },
    },
  },
})
