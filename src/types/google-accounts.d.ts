// Minimal typings for the Google Identity Services token model.
// https://developers.google.com/identity/oauth2/web/reference/js-reference
export {}

declare global {
  interface GoogleTokenResponse {
    access_token: string
    expires_in: number
    scope: string
    token_type: string
    error?: string
    error_description?: string
  }

  interface GoogleTokenClientConfig {
    client_id: string
    scope: string
    callback: (response: GoogleTokenResponse) => void
    error_callback?: (error: { type: string; message?: string }) => void
    prompt?: '' | 'none' | 'consent' | 'select_account'
    /** Email of the account to use, to skip the account chooser. */
    hint?: string
  }

  interface GoogleTokenClient {
    requestAccessToken: (overrides?: { prompt?: string; hint?: string }) => void
  }

  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient
          revoke: (accessToken: string, done?: () => void) => void
        }
      }
    }
  }
}
