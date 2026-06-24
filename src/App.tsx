import { useAuth } from './auth/auth-context'
import { TransactionsPage } from './transactions/TransactionsPage'

function App() {
  const { ready, restoring, user, signIn, signOut } = useAuth()

  return (
    <main className="container py-4">
      <header className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <img src="/logo.png" alt="Beekuty" height={44} />
          <h1 className="h3 mb-0">Beekuty Compta</h1>
        </div>
        {user && (
          <div className="d-flex align-items-center gap-3">
            {user.picture && (
              <img
                src={user.picture}
                alt=""
                width={36}
                height={36}
                className="rounded-circle"
              />
            )}
            <div className="lh-sm small">
              <strong className="d-block">{user.name}</strong>
              <span className="text-body-secondary">{user.email}</span>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={signOut}
            >
              Se déconnecter
            </button>
          </div>
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

      {user && <TransactionsPage />}
    </main>
  )
}

export default App
