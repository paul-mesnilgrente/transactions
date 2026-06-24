import { useAuth } from './auth/auth-context'
import { TransactionsPage } from './transactions/TransactionsPage'
import './App.css'

function App() {
  const { ready, user, signIn, signOut } = useAuth()

  return (
    <main className="app">
      <header className="topbar">
        <h1>Salon Transactions</h1>
        {user && (
          <div className="account">
            {user.picture && (
              <img src={user.picture} alt="" width={36} height={36} />
            )}
            <div className="account-info">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <button type="button" onClick={signOut}>
              Se déconnecter
            </button>
          </div>
        )}
      </header>

      {!ready && <p>Chargement de la connexion Google…</p>}

      {ready && !user && (
        <button type="button" className="signin" onClick={signIn}>
          Se connecter avec Google
        </button>
      )}

      {user && <TransactionsPage />}
    </main>
  )
}

export default App
