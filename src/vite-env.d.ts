/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google OAuth 2.0 Web client ID (public — safe to ship) */
  readonly VITE_GOOGLE_CLIENT_ID: string
  /** ID of the Google Sheet holding the produits */
  readonly VITE_SPREADSHEET_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
