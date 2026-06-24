import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served at the root of the custom domain https://compta.beekuty.fr/
  base: '/',
  plugins: [react()],
})
