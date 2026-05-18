import { useState, useEffect, useRef } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import ArticoloModal from './ArticoloModal'
import ArticoloDetail from './ArticoloDetail'

const COMP = ['forma', 'sottopiede', 'tacco', 'suola', 'fussbet', 'scasso']

function statoStyle(stato) {
  switch (stato) {
    case 'Confo OK':       return { bg: '#DCFCE7', color: '#16A34A' }
    case 'In lavorazione': return { bg: '#FEF9C3', color: '#CA8A04' }
    case 'Critico':        return { bg: '#FEE2E2', color: '#DC2626' }
    case 'Sospeso':        return { bg: '#F1F5F9', color: '#64748B' }
    default:               return { bg: '#F1F5F9', color: '#64748B' }
  }
}

function compStyle(stato) {
  if (!stato || stato === '—') return { bg: '#F1F5F9', color: '#94A3B8' }
  if (stato === 'OK')          return { bg: '#DCFCE7', color: '#16A34A' }
  if (stato === 'In attesa')   return { bg: '#FEF9C3', color: '#CA8A04' }
  if (stato === 'Critico')     return { bg: '#FEE2E2', color: '#DC2626' }
  return { bg: '#F1F5F9', color: '#94A3B8' }
}

// Cella appunti inline editabile
function AppuntiCell({ articoloId, value }) {
  const [editing, setEditing] = useState(false)
  const [testo, setTesto]     = useState(value || '')
  const ref = useRef()

  function handleBlur() {
    setEditing(false)
    if (testo !== (value || '')) {
      updateDoc(doc(db, 'articoli', articoloId), { appunti: testo })
    }
  }

  function handleClick(e) {
    e.stopPropagation()
    setEditing(true)
    setTimeout(() => ref.current?.focus(), 50)
  }

  if (editing) {
    return (
      <td style={s.td} onClick={e => e.stopPropagation()}>
        <textarea
          ref={ref}
          value={testo}
          onChange={e => setTesto(e.target.value)}
          onBlur={handleBlur}
          style={s.appuntiInput}
          rows={3}
        />
      </td>
    )
  }

  return (
    <td style={{ ...s.td, cursor: 'text', minWidth: 160 }} onClick={handleClick}>
      {testo
        ? <span style={s.appuntiText}>{testo}</span>
        : <span style={s.appuntiPlaceholder}>+ Appunti</span>}
    </td>
  )
}

export default function Tabella() {
  const [articoli, setArticoli]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [selected, setSelected]           = useState(null)
  const [showModal, setShowModal]         = useState(false)
  const [editArticolo, setEditArticolo]   = useState(null)
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

  const clienti = ['Tutti', ...new Set(articoli.map(a => a.cliente).filter(Boolean))]
  const confoOk = articoli.filter(a => a.statoGenerale === 'Confo OK').length
  const inLav   = articoli.filter(a => a.statoGenerale === 'In lavorazione').length
  const critici = articoli.filter(a => a.statoGenerale === 'Critico').length
  const sospesi = articoli.filter(a => a.statoGenerale === 'Sospeso').length

  const filtered = articoli.filter(a => {
    if (filtroCliente !== 'Tutti' && a.cliente !== filtroCliente) return false
    if (filtroStato   !== 'Tutti' && a.statoGenerale !== filtroStato) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#F7F8FA' }}>

      {/* KPI Cards */}
      <div style={s.kpiRow}>
        <KpiCard n={articoli.length} label="Totale articoli" color="#6366F1" bg="#EEF2FF" icon="▦" />
        <KpiCard n={confoOk}  label="Confo OK"       color="#16A34A" bg="#DCFCE7" icon="✓" />
        <KpiCard n={inLav}    label="In lavorazione"  color="#CA8A04" bg="#FEF9C3" icon="⟳" />
        <KpiCard n={critici}  label="Critici"         color="#DC2626" bg="#FEE2E2" icon="!" />
        <KpiCard n={sospesi}  label="Sospesi"         color="#64748B" bg="#F1F5F9" icon="—" />
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={s.toolbarLeft}>
          <span style={s.filterLabel}>Cliente</span>
          {clienti.map(c => (
            <button key={c} onClick={() => setFiltroCliente(c)}
              style={{ ...s.chip, ...(filtroCliente === c ? s.chipOn : {}) }}>{c}</button>
          ))}
          <div style={s.sep} />
          <span style={s.filterLabel}>Stato</span>
          {['Tutti','Confo OK','In lavorazione','Critico','Sospeso'].map(st => (
            <button key={st} onClick={() => setFiltroStato(st)}
              style={{ ...s.chip, ...(filtroStato === st ? s.chipOn : {}) }}>{st}</button>
          ))}
        </div>
        <button onClick={() => { setEditArticolo(null); setShowModal(true) }} style={s.btnNew}>
          + Nuovo articolo
        </button>
      </div>

      {/* Tabella con scroll orizzontale */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {loading ? (
          <div style={s.empty}>Caricamento...</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, color: '#334155' }}>Nessun articolo</div>
            <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>Clicca "+ Nuovo articolo" per iniziare</div>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th} rowSpan={2}>Foto</th>
                    <th style={s.th} rowSpan={2}>Cliente</th>
                    <th style={s.th} rowSpan={2}>Stagione</th>
                    <th style={s.th} rowSpan={2}>Manovia</th>
                    <th style={s.th} rowSpan={2}>Modello</th>
                    <th style={s.th} rowSpan={2}>Forma</th>
                    <th style={s.th} rowSpan={2}>Paia</th>
                    <th style={s.th} rowSpan={2}>Stato</th>
                    {/* Colonna appunti */}
                    <th style={{ ...s.th, background: '#FFFBEB', color: '#92400E', borderBottom: '1px solid #FDE68A' }} rowSpan={2}>
                      📝 Appunti
                    </th>
                    <th style={s.th} rowSpan={2}>P. Calzata</th>
                    <th style={s.thGroup} colSpan={2}>Forma</th>
                    <th style={s.thGroup} colSpan={2}>Sottopiede</th>
                    <th style={s.thGroup} colSpan={2}>Tacco</th>
                    <th style={s.thGroup} colSpan={2}>Suola</th>
                    <th style={s.thGroup} colSpan={2}>Fussbet</th>
                    <th style={s.thGroup} colSpan={2}>Scasso</th>
                    <th style={s.th} rowSpan={2}>Conformità</th>
                    <th style={s.th} rowSpan={2}>Data sblocco</th>
                    <th style={s.th} rowSpan={2}>Consegna</th>
                  </tr>
                  <tr>
                    <th style={s.thSub}>Stato</th><th style={s.thSub}>Fornitore</th>
                    <th style={s.thSub}>Stato</th><th style={s.thSub}>Fornitore</th>
                    <th style={s.thSub}>Stato</th><th style={s.thSub}>Fornitore</th>
                    <th style={s.thSub}>Stato</th><th style={s.thSub}>Fornitore</th>
                    <th style={s.thSub}>Stato</th><th style={s.thSub}>Fornitore</th>
                    <th style={s.thSub}>Stato</th><th style={s.thSub}>Fornitore</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(art => {
                    const { bg, color } = statoStyle(art.statoGenerale)
                    return (
                      <tr key={art.id}
                        onClick={() => setSelected(art)}
                        style={{ cursor: 'pointer', background: '#fff' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={s.td}>
                          {art.fotoUrl
                            ? <img src={art.fotoUrl} alt="" style={s.thumb} />
                            : <div style={s.thumbEmpty}>📷</div>}
                        </td>
                        <td style={{ ...s.td, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>{art.cliente}</td>
                        <td style={{ ...s.td, color: '#64748B', whiteSpace: 'nowrap' }}>{art.stagione}</td>
                        <td style={{ ...s.td, color: '#64748B', whiteSpace: 'nowrap' }}>{art.manovia}</td>
                        <td style={{ ...s.td, fontWeight: 500, whiteSpace: 'nowrap' }}>{art.modello}</td>
                        <td style={{ ...s.td, color: '#64748B' }}>{art.forma}</td>
                        <td style={{ ...s.td, color: '#64748B' }}>{art.paia}</td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: bg, color, display: 'flex', alignItems: 'center', gap: 5, width: 'fit-content' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            {art.statoGenerale}
                          </span>
                        </td>
                        {/* Cella appunti inline */}
                        <AppuntiCell articoloId={art.id} value={art.appunti} />
                        <td style={s.td}>
                          {art.provaCalzata
                            ? <span style={{ ...s.badge, background: '#DCFCE7', color: '#16A34A' }}>{art.provaCalzata}</span>
                            : <span style={s.dash}>—</span>}
                        </td>
                        {/* Componenti — 2 celle esplicite per ognuno */}
                        {COMP.map(c => {
                          const comp = art.componenti?.[c] || {}
                          const { bg: cbg, color: cc } = compStyle(comp.stato)
                          return [
                            <td key={c+'-s'} style={{ ...s.td, textAlign: 'center', borderLeft: '2px solid #F1F5F9' }}>
                              <span style={{ ...s.badge, background: cbg, color: cc }}>{comp.stato || '—'}</span>
                            </td>,
                            <td key={c+'-f'} style={{ ...s.td, fontSize: 10, color: '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {comp.fornitore || '—'}
                            </td>
                          ]
                        })}
                        <td style={{ ...s.td, fontSize: 11, color: '#64748B', minWidth: 100 }}>{art.conformita}</td>
                        <td style={s.td}>
                          {art.dataSblocco
                            ? <span style={{ ...s.badge, background: '#FEF9C3', color: '#CA8A04', whiteSpace: 'nowrap' }}>{art.dataSblocco}</span>
                            : <span style={s.dash}>—</span>}
                        </td>
                        <td style={{ ...s.td, fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>{art.consegna}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <ArticoloDetail
          articolo={selected}
          onEdit={() => { setEditArticolo(selected); setSelected(null); setShowModal(true) }}
          onClose={() => setSelected(null)}
          onDeleted={() => setSelected(null)}
        />
      )}

      {showModal && (
        <ArticoloModal
          articolo={editArticolo}
          onClose={() => { setShowModal(false); setEditArticolo(null) }}
        />
      )}
    </div>
  )
}

function KpiCard({ n, label, color, bg, icon }) {
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${color}33` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color }}>
          {icon}
        </div>
        <span style={{ fontSize: 32, fontWeight: 800, color }}>{n}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color }}>{label}</div>
    </div>
  )
}

const s = {
  kpiRow:           { display: 'flex', gap: 12, padding: '16px 20px 12px', flexShrink: 0 },
  toolbar:          { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', flexShrink: 0, gap: 8, flexWrap: 'wrap' },
  toolbarLeft:      { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  filterLabel:      { fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  chip:             { padding: '4px 12px', fontSize: 11, borderRadius: 20, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', fontWeight: 500 },
  chipOn:           { background: '#1E293B', color: '#fff', borderColor: '#1E293B' },
  sep:              { width: 1, height: 20, background: '#E2E8F0', margin: '0 4px' },
  btnNew:           { padding: '8px 18px', fontSize: 12, fontWeight: 700, borderRadius: 10, border: 'none', background: '#6366F1', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', whiteSpace: 'nowrap' },
  empty:            { padding: 60, textAlign: 'center', color: '#94A3B8', fontSize: 13 },
  tableWrap:        { background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  table:            { borderCollapse: 'collapse', fontSize: 12, minWidth: '100%' },
  th:               { padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', whiteSpace: 'nowrap' },
  thGroup:          { padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#6366F1', background: '#EEF2FF', borderBottom: '1px solid #E0E7FF', borderLeft: '2px solid #E0E7FF', whiteSpace: 'nowrap' },
  thSub:            { padding: '5px 8px', textAlign: 'center', fontSize: 9, fontWeight: 600, color: '#94A3B8', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', borderLeft: '1px solid #F1F5F9', whiteSpace: 'nowrap' },
  td:               { padding: '10px 12px', borderBottom: '1px solid #F1F5F9', color: '#334155', verticalAlign: 'middle' },
  badge:            { display: 'inline-block', padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' },
  dash:             { color: '#CBD5E1' },
  thumb:            { width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid #E2E8F0' },
  thumbEmpty:       { width: 36, height: 36, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  appuntiText:      { fontSize: 11, color: '#334155', lineHeight: 1.5 },
  appuntiPlaceholder: { fontSize: 11, color: '#CBD5E1', fontStyle: 'italic' },
  appuntiInput:     { width: '100%', minWidth: 160, fontSize: 11, border: '1px solid #6366F1', borderRadius: 6, padding: '6px 8px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, color: '#1E293B' },
}
