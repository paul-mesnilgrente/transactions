import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Repo is served at https://paul-mesnilgrente.github.io/transactions/
  base: '/transactions/',
  plugins: [react()],
})
