import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import Tabella from '../components/Tabella'
import StoricoSbloccati from '../components/StoricoSbloccati'
import Analisi from '../components/Analisi'

export default function Dashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('tabella')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={styles.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={styles.logo}>
            Sblocchi Produzione
            <span style={styles.logoSub}>Mosaicon</span>
          </div>
          <div style={styles.tabs}>
            {[
              { id: 'tabella', label: 'Tabella' },
              { id: 'storico', label: 'Storico sbloccati' },
              { id: 'analisi', label: 'Analisi' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{ ...styles.tab, ...(tab === t.id ? styles.tabActive : {}) }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#999' }}>{user?.email}</span>
          <button onClick={() => signOut(auth)} style={styles.btnLogout}>Esci</button>
        </div>
      </div>

      {/* Contenuto */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'tabella' && <Tabella />}
        {tab === 'storico' && <StoricoSbloccati />}
        {tab === 'analisi' && <Analisi />}
      </div>
    </div>
  )
}

const styles = {
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderBottom: '1px solid #EBEBEB',
    background: '#fff',
    flexShrink: 0,
  },
  logo: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  logoSub: {
    fontSize: 12,
    fontWeight: 400,
    color: '#999',
  },
  tabs: {
    display: 'flex',
    gap: 2,
    background: '#F5F5F5',
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    padding: '5px 14px',
    fontSize: 12,
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: '#777',
    cursor: 'pointer',
    fontWeight: 400,
  },
  tabActive: {
    background: '#fff',
    color: '#111',
    fontWeight: 600,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  btnLogout: {
    padding: '5px 12px',
    fontSize: 11,
    borderRadius: 6,
    border: '1px solid #E0E0E0',
    background: '#fff',
    color: '#555',
    cursor: 'pointer',
  },
}
