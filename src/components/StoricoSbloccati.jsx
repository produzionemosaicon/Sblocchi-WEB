import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function StoricoSbloccati() {
  const [sbloccati, setSbloccati] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroCliente, setFiltroCliente] = useState('Tutti')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'sbloccati'), orderBy('sbloccatoAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setSbloccati(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const clienti = ['Tutti', ...new Set(sbloccati.map(a => a.cliente).filter(Boolean))]
  const filtered = sbloccati.filter(a => filtroCliente === 'Tutti' || a.cliente === filtroCliente)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Storico articoli sbloccati</div>
          <div style={styles.sub}>{sbloccati.length} articoli sbloccati totali</div>
        </div>
      </div>

      {/* Filtri */}
      <div style={styles.filtersbar}>
        <span style={styles.filterLabel}>Cliente:</span>
        {clienti.map(c => (
          <button key={c} onClick={() => setFiltroCliente(c)}
            style={{ ...styles.chip, ...(filtroCliente === c ? styles.chipOn : {}) }}>
            {c}
          </button>
        ))}
      </div>

      {/* Tabella */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        {loading ? (
          <div style={styles.empty}>Caricamento...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>Nessun articolo sbloccato ancora.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Foto</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Modello</th>
                <th style={styles.th}>Stagione</th>
                <th style={styles.th}>Manovia</th>
                <th style={styles.th}>Paia</th>
                <th style={styles.th}>Conformità</th>
                <th style={styles.th}>Data sblocco</th>
                <th style={styles.th}>Sbloccato da</th>
                <th style={styles.th}>Stato</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(art => (
                <tr key={art.id}
                  onClick={() => setSelected(selected?.id === art.id ? null : art)}
                  style={{ cursor: 'pointer', background: selected?.id === art.id ? '#F7FFF8' : '#fff' }}
                >
                  <td style={styles.td}>
                    {art.fotoUrl
                      ? <img src={art.fotoUrl} alt="" style={styles.thumb} />
                      : <div style={styles.thumbEmpty}>—</div>
                    }
                  </td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{art.cliente}</td>
                  <td style={{ ...styles.td, fontSize: 11 }}>{art.modello}</td>
                  <td style={styles.td}>{art.stagione}</td>
                  <td style={styles.td}>{art.manovia}</td>
                  <td style={styles.td}>{art.paia}</td>
                  <td style={{ ...styles.td, fontSize: 11, color: '#555', maxWidth: 160 }}>{art.conformita}</td>
                  <td style={styles.td}>
                    <span style={styles.dateGreen}>{art.dataSblocco}</span>
                  </td>
                  <td style={{ ...styles.td, color: '#666', fontSize: 11 }}>{art.sbloccatoDa}</td>
                  <td style={styles.td}>
                    <span style={styles.badgeGreen}>Sbloccato</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail panel quando selezionato */}
      {selected && (
        <div style={styles.detailBar}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{selected.cliente} — {selected.modello}</div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>✕</button>
          </div>
          {selected.note && (
            <div style={{ fontSize: 12, color: '#555', background: '#FAFAFA', padding: '8px 10px', borderRadius: 6, border: '1px solid #EBEBEB' }}>
              {selected.note}
            </div>
          )}
          {selected.fotoUrl && (
            <img src={selected.fotoUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginTop: 8, border: '1px solid #EBEBEB' }} />
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  header: { padding: '16px 24px 12px', borderBottom: '1px solid #EBEBEB', flexShrink: 0 },
  title: { fontSize: 14, fontWeight: 600, color: '#111' },
  sub: { fontSize: 11, color: '#999', marginTop: 2 },
  filtersbar: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 24px', borderBottom: '1px solid #EBEBEB', background: '#FAFAFA', flexShrink: 0 },
  filterLabel: { fontSize: 11, color: '#999' },
  chip: { padding: '3px 10px', fontSize: 11, borderRadius: 20, border: '1px solid #E8E8E8', background: '#fff', color: '#555', cursor: 'pointer' },
  chipOn: { background: '#111', color: '#fff', borderColor: '#111' },
  empty: { padding: 40, textAlign: 'center', color: '#999', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 16 },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#999', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid #EBEBEB', background: '#FAFAFA', whiteSpace: 'nowrap' },
  td: { padding: '9px 12px', borderBottom: '1px solid #F2F2F2', color: '#222', verticalAlign: 'middle' },
  thumb: { width: 30, height: 30, borderRadius: 5, objectFit: 'cover', border: '1px solid #E8E8E8' },
  thumbEmpty: { width: 30, height: 30, borderRadius: 5, background: '#F0F0F0', border: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#bbb' },
  dateGreen: { color: '#2D7A3A', fontWeight: 600, fontSize: 12 },
  badgeGreen: { display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#EBF5EC', color: '#2D7A3A' },
  detailBar: { borderTop: '1px solid #EBEBEB', padding: '14px 24px', background: '#fff', flexShrink: 0 },
}
