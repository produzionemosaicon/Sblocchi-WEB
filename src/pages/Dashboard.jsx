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
    { id: 'tabella', label: 'Tabella' },
    { id: 'storico', label: 'Storico sbloccati' },
    { id: 'analisi', label: 'Analisi' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={styles.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>SP</div>
            <div>
              <div style={styles.brandName}>Sblocchi Produzione</div>
              <div style={styles.brandSub}>Mosaicon Group</div>
            </div>
          </div>
          <div style={styles.nav}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ ...styles.navBtn, ...(tab === t.id ? styles.navBtnActive : {}) }}>
                {t.label}
                {tab === t.id && <div style={styles.navIndicator} />}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.userArea}>
          <div style={styles.avatar}>{user?.email?.[0]?.toUpperCase()}</div>
          <span style={styles.userEmail}>{user?.email}</span>
          <button onClick={() => signOut(auth)} style={styles.btnLogout}>Esci</button>
        </div>
      </div>

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
    height: 56,
    background: '#fff',
    borderBottom: '1px solid #F1F5F9',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    color: '#fff', fontSize: 11, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    letterSpacing: '0.05em',
  },
  brandName: { fontSize: 13, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 },
  brandSub:  { fontSize: 10, color: '#94A3B8' },
  nav: { display: 'flex', gap: 0 },
  navBtn: {
    position: 'relative',
    padding: '0 16px',
    height: 56,
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    background: 'transparent',
    color: '#94A3B8',
    cursor: 'pointer',
  },
  navBtnActive: { color: '#6366F1', fontWeight: 700 },
  navIndicator: {
    position: 'absolute',
    bottom: 0, left: 16, right: 16,
    height: 2,
    background: '#6366F1',
    borderRadius: 2,
  },
  userArea: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    color: '#fff', fontSize: 12, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userEmail: { fontSize: 11, color: '#94A3B8' },
  btnLogout: {
    padding: '5px 12px', fontSize: 11, borderRadius: 6,
    border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer',
  },
}
