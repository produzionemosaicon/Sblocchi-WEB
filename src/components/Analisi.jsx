import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function Analisi() {
  const [articoli, setArticoli] = useState([])
  const [sbloccati, setSbloccati] = useState([])

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'articoli'), snap => {
      setArticoli(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const u2 = onSnapshot(collection(db, 'sbloccati'), snap => {
      setSbloccati(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { u1(); u2() }
  }, [])

  const attivi = articoli.filter(a => !a.sbloccato)
  const clientiStats = [...new Set(articoli.map(a => a.cliente).filter(Boolean))].map(cliente => ({
    cliente,
    totale: articoli.filter(a => a.cliente === cliente).length,
    attivi: articoli.filter(a => a.cliente === cliente && !a.sbloccato).length,
    sbloccati: sbloccati.filter(a => a.cliente === cliente).length,
    critici: articoli.filter(a => a.cliente === cliente && a.statoGenerale === 'Critico').length,
  }))

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Analisi</div>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 24 }}>Riepilogo stato articoli</div>

      {/* KPI cards */}
      <div style={styles.grid4}>
        <KpiCard n={articoli.length} label="Articoli totali" color="#111" />
        <KpiCard n={attivi.filter(a => a.statoGenerale === 'Confo OK').length} label="Confo OK" color="#2D7A3A" />
        <KpiCard n={attivi.filter(a => a.statoGenerale === 'In lavorazione').length} label="In lavorazione" color="#A0620A" />
        <KpiCard n={attivi.filter(a => a.statoGenerale === 'Critico').length} label="Critici" color="#B03030" />
        <KpiCard n={sbloccati.length} label="Sbloccati totali" color="#2952A3" />
        <KpiCard n={attivi.filter(a => a.statoGenerale === 'Sospeso').length} label="Sospesi" color="#999" />
      </div>

      {/* Per cliente */}
      {clientiStats.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={styles.sectionTitle}>Per cliente</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Totale</th>
                <th style={styles.th}>Attivi</th>
                <th style={styles.th}>Sbloccati</th>
                <th style={styles.th}>Critici</th>
                <th style={styles.th}>% sbloccati</th>
              </tr>
            </thead>
            <tbody>
              {clientiStats.map(c => (
                <tr key={c.cliente}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{c.cliente}</td>
                  <td style={styles.td}>{c.totale}</td>
                  <td style={styles.td}>{c.attivi}</td>
                  <td style={{ ...styles.td, color: '#2D7A3A', fontWeight: 600 }}>{c.sbloccati}</td>
                  <td style={{ ...styles.td, color: c.critici > 0 ? '#B03030' : '#999' }}>{c.critici}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${c.totale > 0 ? (c.sbloccati / c.totale) * 100 : 0}%`, height: '100%', background: '#2D7A3A', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#555', minWidth: 30 }}>
                        {c.totale > 0 ? Math.round((c.sbloccati / c.totale) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function KpiCard({ n, label, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{ fontSize: 28, fontWeight: 600, color }}>{n}</div>
      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{label}</div>
    </div>
  )
}

const styles = {
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 },
  kpiCard: { background: '#FAFAFA', border: '1px solid #EBEBEB', borderRadius: 10, padding: '16px 18px' },
  sectionTitle: { fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#999', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid #EBEBEB', background: '#FAFAFA' },
  td: { padding: '10px 12px', borderBottom: '1px solid #F2F2F2', color: '#222', verticalAlign: 'middle' },
}
