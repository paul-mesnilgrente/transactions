import { useState } from 'react'
import { useAuth } from './auth/auth-context'
import { ProduitsPage } from './produits/ProduitsPage'
import { ChargesPage } from './charges/ChargesPage'

type Page = 'produits' | 'charges'

function App() {
  const { ready, restoring, user, signIn, signOut } = useAuth()
  const [page, setPage] = useState<Page>('produits')

  return (
    <main className="container py-4">
      <header className="d-flex justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <img src="/logo.png" alt="Beekuty" height={44} />
            <h1 className="h3 mb-0">Compta</h1>
          </div>
          {user && (
            <ul className="nav nav-pills">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${page === 'produits' ? 'active' : ''}`}
                  aria-current={page === 'produits' ? 'page' : undefined}
                  onClick={() => setPage('produits')}
                >
                  Produits
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${page === 'charges' ? 'active' : ''}`}
                  aria-current={page === 'charges' ? 'page' : undefined}
                  onClick={() => setPage('charges')}
                >
                  Charges
                </button>
              </li>
              <li className="nav-item">
                {/* Placeholder — page à venir */}
                <button type="button" className="nav-link" disabled>
                  Résumé
                </button>
              </li>
            </ul>
          )}
        </div>
        {user && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={signOut}
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"
              />
              <path
                fillRule="evenodd"
                d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"
              />
            </svg>
          </button>
        )}
      </header>

      {(!ready || restoring) && (
        <p className="text-body-secondary">Chargement de la connexion Google…</p>
      )}

      {ready && !restoring && !user && (
        <button type="button" className="btn btn-primary" onClick={signIn}>
          Se connecter avec Google
        </button>
      )}

      {user && (page === 'charges' ? <ChargesPage /> : <ProduitsPage />)}
    </main>
  )
}

export default App
