import { createContext, useContext } from 'react'

export interface UserProfile {
  email: string
  name: string
  picture: string
}

export interface AuthContextValue {
  /** True once the GIS script has loaded and the token client is ready. */
  ready: boolean
  /** The signed-in user's profile, or null when signed out. */
  user: UserProfile | null
  /** Prompt the user to sign in and grant access. */
  signIn: () => void
  /** Revoke the current access token and clear the session. */
  signOut: () => void
  /**
   * Resolve to a valid access token, refreshing silently if the current one
   * is missing or near expiry. Rejects if the user must interact (re-consent).
   */
  getAccessToken: () => Promise<string>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
