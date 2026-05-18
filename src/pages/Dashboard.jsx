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

  const tabs = [
    { id: 'tabella',  label: 'Tabella',           icon: '▦' },
    { id: 'storico',  label: 'Storico sbloccati',  icon: '✓' },
    { id: 'analisi',  label: 'Analisi',            icon: '◎' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#F7F8FA' }}>

      {/* Topbar */}
      <div style={styles.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={styles.brand}>
            <div style={styles.brandDot} />
            <span style={styles.brandName}>Sblocchi Produzione</span>
            <span style={styles.brandSub}>Mosaicon</span>
          </div>
          <nav style={styles.nav}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ ...styles.navBtn, ...(tab === t.id ? styles.navBtnActive : {}) }}>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={styles.userArea}>
          <div style={styles.avatar}>{user?.email?.[0]?.toUpperCase()}</div>
          <span style={styles.userEmail}>{user?.email}</span>
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
    padding: '0 24px',
    height: 52,
    background: '#fff',
    borderBottom: '1px solid #EBEBEB',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#111',
  },
  brandName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111',
    letterSpacing: '-0.01em',
  },
  brandSub: {
    fontSize: 12,
    color: '#bbb',
    fontWeight: 400,
  },
  nav: {
    display: 'flex',
    gap: 2,
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 7,
    border: 'none',
    background: 'transparent',
    color: '#888',
    cursor: 'pointer',
    transition: 'all .15s',
  },
  navBtnActive: {
    background: '#F0F0F2',
    color: '#111',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#111',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userEmail: {
    fontSize: 11,
    color: '#999',
  },
  btnLogout: {
    padding: '5px 12px',
    fontSize: 11,
    borderRadius: 6,
    border: '1px solid #E8E8E8',
    background: '#fff',
    color: '#666',
    cursor: 'pointer',
  },
}
