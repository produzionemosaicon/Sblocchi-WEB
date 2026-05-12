import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError('Email o password non corretti')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Sblocchi Produzione</div>
        <div style={styles.subtitle}>Accedi per continuare</div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="nome@azienda.it"
              required
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#FAFAFA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#fff',
    border: '1px solid #EBEBEB',
    borderRadius: 12,
    padding: '40px 36px',
    width: 360,
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  },
  logo: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 28,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    padding: '8px 10px',
    border: '1px solid #D8D8D8',
    borderRadius: 7,
    fontSize: 13,
    color: '#111',
    outline: 'none',
    background: '#fff',
  },
  error: {
    fontSize: 12,
    color: '#B03030',
    background: '#FEECEC',
    padding: '8px 10px',
    borderRadius: 6,
  },
  btn: {
    padding: '10px',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 4,
  },
}
