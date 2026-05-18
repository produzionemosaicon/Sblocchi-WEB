import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import ArticoloModal from './ArticoloModal'
import ArticoloDetail from './ArticoloDetail'

const COMPONENTI_COLS = ['forma', 'sottopiede', 'tacco', 'suola', 'fussbet', 'scasso']

function statoGeneraleStyle(stato) {
  switch (stato) {
    case 'Confo OK':       return { bg: '#DCFCE7', color: '#16A34A', dot: '#16A34A' }
    case 'In lavorazione': return { bg: '#FEF9C3', color: '#CA8A04', dot: '#CA8A04' }
    case 'Critico':        return { bg: '#FEE2E2', color: '#DC2626', dot: '#DC2626' }
    case 'Sospeso':        return { bg: '#F1F5F9', color: '#64748B', dot: '#64748B' }
    default:               return { bg: '#F1F5F9', color: '#64748B', dot: '#64748B' }
  }
}

function ComponenteCell({ comp }) {
  const stato = comp?.stato || '—'
  const fornitore = comp?.fornitore || ''
  const isOk = stato === 'OK' || stato.startsWith('OK')
  const isCritico = stato === 'Critico'
  const isAttesa = stato === 'In attesa'
  const bg    = isOk ? '#DCFCE7' : isCritico ? '#FEE2E2' : isAttesa ? '#FEF9C3' : '#F1F5F9'
  const color = isOk ? '#16A34A' : isCritico ? '#DC2626' : isAttesa ? '#CA8A04' : '#94A3B8'
  return (
    <td style={styles.td}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ ...styles.badge, background: bg, color }}>{stato}</span>
        {fornitore && <span style={styles.fornitoreTag}>{fornitore}</span>}
      </div>
    </td>
  )
}

export default function Tabella() {
  const [articoli, setArticoli]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editArticolo, setEditArticolo] = useState(null)
  const [filtroCliente, setFiltroCliente] = useState('Tutti')
  const [filtroStato, setFiltroStato]     = useState('Tutti')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'articoli'), snap => {
      const tutti = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const attivi = tutti
        .filter(a => !a.sbloccato)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setArticoli(attivi)
      setLoading(false)
    }, err => { console.error(err); setLoading(false) })
    return unsub
  }, [])

  const clienti  = ['Tutti', ...new Set(articoli.map(a => a.cliente).filter(Boolean))]
  const stati    = ['Tutti', 'Confo OK', 'In lavorazione', 'Critico', 'Sospeso']
  const confoOk  = articoli.filter(a => a.statoGenerale === 'Confo OK').length
  const inLav    = articoli.filter(a => a.statoGenerale === 'In lavorazione').length
  const critici  = articoli.filter(a => a.statoGenerale === 'Critico').length
  const sospesi  = articoli.filter(a => a.statoGenerale === 'Sospeso').length

  const filtered = articoli.filter(a => {
    if (filtroCliente !== 'Tutti' && a.cliente !== filtroCliente) return false
    if (filtroStato   !== 'Tutti' && a.statoGenerale !== filtroStato) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#F7F8FA' }}>

      {/* KPI Cards */}
      <div style={styles.kpiRow}>
        <KpiCard n={articoli.length} label="Totale articoli" color="#6366F1" bg="#EEF2FF" icon="▦" />
        <KpiCard n={confoOk}  label="Confo OK"       color="#16A34A" bg="#DCFCE7" icon="✓" />
        <KpiCard n={inLav}    label="In lavorazione"  color="#CA8A04" bg="#FEF9C3" icon="⟳" />
        <KpiCard n={critici}  label="Critici"         color="#DC2626" bg="#FEE2E2" icon="!" />
        <KpiCard n={sospesi}  label="Sospesi"         color="#64748B" bg="#F1F5F9" icon="—" />
      </div>

      {/* Filtri + azioni */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Cliente</span>
            <div style={styles.chips}>
              {clienti.map(c => (
                <button key={c} onClick={() => setFiltroCliente(c)}
                  style={{ ...styles.chip, ...(filtroCliente === c ? styles.chipOn : {}) }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.dividerV} />
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Stato</span>
            <div style={styles.chips}>
              {stati.map(s => (
                <button key={s} onClick={() => setFiltroStato(s)}
                  style={{ ...styles.chip, ...(filtroStato === s ? styles.chipOn : {}) }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => { setEditArticolo(null); setShowNewModal(true) }} style={styles.btnNew}>
          + Nuovo articolo
        </button>
      </div>

      {/* Tabella */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '0 20px 20px' }}>
        {loading ? (
          <div style={styles.empty}>Caricamento...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Nessun articolo</div>
            <div style={{ color: '#aaa', fontSize: 12 }}>Clicca "+ Nuovo articolo" per iniziare</div>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th} rowSpan={2}>Foto</th>
                  <th style={styles.th} rowSpan={2}>Cliente</th>
                  <th style={styles.th} rowSpan={2}>Stagione</th>
                  <th style={styles.th} rowSpan={2}>Manovia</th>
                  <th style={styles.th} rowSpan={2}>Modello</th>
                  <th style={styles.th} rowSpan={2}>Forma</th>
                  <th style={styles.th} rowSpan={2}>Paia</th>
                  <th style={styles.th} rowSpan={2}>Stato</th>
                  <th style={styles.th} rowSpan={2}>P. Calzata</th>
                  {COMPONENTI_COLS.map(c => (
                    <th key={c} colSpan={2} style={styles.thGroup}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </th>
                  ))}
                  <th style={styles.th} rowSpan={2}>Conformità</th>
                  <th style={styles.th} rowSpan={2}>Sblocco</th>
                  <th style={styles.th} rowSpan={2}>Consegna</th>
                </tr>
                <tr>
                  {COMPONENTI_COLS.map(c => (
                    <>
                      <th key={c+'-s'} style={styles.thSub}>Stato</th>
                      <th key={c+'-f'} style={styles.thSub}>Fornitore</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(articolo => {
                  const { bg, color, dot } = statoGeneraleStyle(articolo.statoGenerale)
                  return (
                    <tr key={articolo.id} onClick={() => setSelected(articolo)} style={styles.tr}>
                      <td style={styles.td}>
                        {articolo.fotoUrl
                          ? <img src={articolo.fotoUrl} alt="" style={styles.thumb} />
                          : <div style={styles.thumbEmpty}>📷</div>}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 700, color: '#1E293B' }}>{articolo.cliente}</td>
                      <td style={{ ...styles.td, color: '#64748B' }}>{articolo.stagione}</td>
                      <td style={{ ...styles.td, color: '#64748B' }}>{articolo.manovia}</td>
                      <td style={{ ...styles.td, fontWeight: 500 }}>{articolo.modello}</td>
                      <td style={{ ...styles.td, color: '#64748B' }}>{articolo.forma}</td>
                      <td style={{ ...styles.td, color: '#64748B' }}>{articolo.paia}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: bg, color, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                          {articolo.statoGenerale}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {articolo.provaCalzata
                          ? <span style={{ ...styles.badge, background: '#DCFCE7', color: '#16A34A' }}>{articolo.provaCalzata}</span>
                          : <span style={styles.dash}>—</span>}
                      </td>
                      {COMPONENTI_COLS.map(c => (
                        <ComponenteCell key={c} comp={articolo.componenti?.[c]} />
                      ))}
                      <td style={{ ...styles.td, fontSize: 11, maxWidth: 120, color: '#64748B' }}>{articolo.conformita}</td>
                      <td style={styles.td}>
                        {articolo.dataSblocco
                          ? <span style={{ ...styles.badge, background: '#FEF9C3', color: '#CA8A04' }}>{articolo.dataSblocco}</span>
                          : <span style={styles.dash}>—</span>}
                      </td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#64748B' }}>{articolo.consegna}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Popup dettaglio articolo */}
      {selected && (
        <ArticoloDetail
          articolo={selected}
          onEdit={() => { setEditArticolo(selected); setSelected(null); setShowNewModal(true) }}
          onClose={() => setSelected(null)}
          onDeleted={() => setSelected(null)}
        />
      )}

      {/* Modal nuovo/modifica */}
      {showNewModal && (
        <ArticoloModal
          articolo={editArticolo}
          onClose={() => { setShowNewModal(false); setEditArticolo(null) }}
        />
      )}
    </div>
  )
}

function KpiCard({ n, label, color, bg, icon }) {
  return (
    <div style={{ ...styles.kpiCard, background: bg, borderColor: color + '22' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 18, opacity: 0.5 }}>{icon}</span>
        <span style={{ fontSize: 28, fontWeight: 800, color }}>{n}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color }}>{label}</div>
    </div>
  )
}

const styles = {
  kpiRow: { display: 'flex', gap: 12, padding: '16px 20px 12px', flexShrink: 0 },
  kpiCard: { flex: 1, borderRadius: 14, padding: '14px 16px', border: '1px solid transparent' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', flexShrink: 0, gap: 12, flexWrap: 'wrap' },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  filterGroup: { display: 'flex', alignItems: 'center', gap: 6 },
  filterLabel: { fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  chips: { display: 'flex', gap: 4 },
  chip:  { padding: '4px 10px', fontSize: 11, borderRadius: 20, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', fontWeight: 500 },
  chipOn:{ background: '#1E293B', color: '#fff', borderColor: '#1E293B' },
  dividerV: { width: 1, height: 20, background: '#E2E8F0' },
  btnNew: { padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
  empty: { padding: 60, textAlign: 'center', color: '#94A3B8', fontSize: 13 },
  tableWrap: { background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:    { padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', whiteSpace: 'nowrap' },
  thGroup: { padding: '7px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#64748B', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', borderLeft: '2px solid #E2E8F0' },
  thSub: { padding: '5px 8px', textAlign: 'center', fontSize: 9, color: '#CBD5E1', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', borderLeft: '1px solid #F1F5F9' },
  tr:    { cursor: 'pointer', transition: 'background .1s' },
  td:    { padding: '10px 12px', borderBottom: '1px solid #F1F5F9', color: '#334155', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' },
  fornitoreTag: { fontSize: 9, color: '#94A3B8', textAlign: 'center' },
  dash:  { color: '#CBD5E1' },
  thumb: { width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: '1px solid #E2E8F0' },
  thumbEmpty: { width: 34, height: 34, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 },
}
