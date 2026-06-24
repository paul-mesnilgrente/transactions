import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AuthContext, type UserProfile } from './auth-context'

const GSI_SRC = 'https://accounts.google.com/gsi/client'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

// openid/email/profile let us show who is signed in; spreadsheets lets us
// read and write the transactions sheet.
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ')

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Flag (not the token) persisted across refreshes so we only attempt a silent
// re-auth for users who have already granted consent.
const GRANTED_KEY = 'auth:granted'

/** Inject the Google Identity Services script once and resolve when ready. */
function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Identity Services')),
      )
      return
    }
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

interface StoredToken {
  value: string
  expiresAt: number
}

type Pending = {
  resolve: (token: string) => void
  reject: (error: Error) => void
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  // Start in "restoring" if a previous session was granted, so the sign-in
  // button doesn't flash before the silent re-auth resolves.
  const [restoring, setRestoring] = useState(
    () => localStorage.getItem(GRANTED_KEY) === '1',
  )
  const [user, setUser] = useState<UserProfile | null>(null)

  const clientRef = useRef<GoogleTokenClient | null>(null)
  const tokenRef = useRef<StoredToken | null>(null)
  const pendingRef = useRef<Pending[]>([])

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch(USERINFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = (await res.json()) as {
        email: string
        name: string
        picture: string
      }
      setUser({ email: data.email, name: data.name, picture: data.picture })
    } catch {
      // Profile is best-effort; a failure here doesn't block auth.
    }
  }, [])

  useEffect(() => {
    if (!CLIENT_ID) {
      console.error(
        'VITE_GOOGLE_CLIENT_ID is not set. Copy .env.example to .env.local and fill it in.',
      )
      return
    }

    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled) return
        clientRef.current = window.google!.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.error) {
              const err = new Error(
                response.error_description ?? response.error,
              )
              pendingRef.current.forEach((p) => p.reject(err))
              pendingRef.current = []
              return
            }
            tokenRef.current = {
              value: response.access_token,
              expiresAt: Date.now() + response.expires_in * 1000,
            }
            // Remember that consent was granted so we can silently restore
            // the session on the next page load.
            localStorage.setItem(GRANTED_KEY, '1')
            pendingRef.current.forEach((p) => p.resolve(response.access_token))
            pendingRef.current = []
            void fetchProfile(response.access_token)
          },
          error_callback: (error) => {
            const err = new Error(error.message ?? error.type)
            pendingRef.current.forEach((p) => p.reject(err))
            pendingRef.current = []
          },
        })
        setReady(true)

        // If the user granted consent before, silently re-acquire a token
        // (no popup) to restore the session after a refresh.
        if (localStorage.getItem(GRANTED_KEY) === '1') {
          new Promise<string>((resolve, reject) => {
            pendingRef.current.push({ resolve, reject })
            clientRef.current!.requestAccessToken({ prompt: '' })
          })
            .catch(() => {
              // Silent restore failed (session expired or consent revoked);
              // fall back to showing the sign-in button.
              localStorage.removeItem(GRANTED_KEY)
            })
            .finally(() => {
              if (!cancelled) setRestoring(false)
            })
        } else {
          setRestoring(false)
        }
      })
      .catch((err) => {
        console.error(err)
        setRestoring(false)
      })

    return () => {
      cancelled = true
    }
  }, [fetchProfile])

  const signIn = useCallback(() => {
    // Default prompt lets Google decide between account chooser / consent.
    clientRef.current?.requestAccessToken()
  }, [])

  const signOut = useCallback(() => {
    const token = tokenRef.current?.value
    if (token) window.google?.accounts.oauth2.revoke(token)
    tokenRef.current = null
    localStorage.removeItem(GRANTED_KEY)
    setUser(null)
  }, [])

  const getAccessToken = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      const current = tokenRef.current
      // Treat a token expiring within 60s as already expired.
      if (current && current.expiresAt - 60_000 > Date.now()) {
        resolve(current.value)
        return
      }
      if (!clientRef.current) {
        reject(new Error('Auth is not ready yet'))
        return
      }
      pendingRef.current.push({ resolve, reject })
      // Empty prompt = silent refresh when the user already granted access.
      clientRef.current.requestAccessToken({ prompt: '' })
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{ ready, restoring, user, signIn, signOut, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}
