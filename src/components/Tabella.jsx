import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import ArticoloModal from './ArticoloModal'
import SidePanel from './SidePanel'

const COMPONENTI_COLS = ['forma', 'sottopiede', 'tacco', 'suola', 'fussbet', 'scasso']

function statoGeneraleStyle(stato) {
  switch (stato) {
    case 'Confo OK':     return { bg: '#EBF5EC', color: '#2D7A3A' }
    case 'In lavorazione': return { bg: '#FEF3E2', color: '#A0620A' }
    case 'Critico':      return { bg: '#FEECEC', color: '#B03030' }
    case 'Sospeso':      return { bg: '#F2F2F2', color: '#999' }
    default:             return { bg: '#F2F2F2', color: '#999' }
  }
}

function ComponenteCell({ comp }) {
  const stato = comp?.stato || '—'
  const fornitore = comp?.fornitore || ''
  const isOk = stato === 'OK' || stato.startsWith('OK')
  const isCritico = stato === 'Critico'
  const isAttesa = stato === 'In attesa'
  const bg = isOk ? '#EBF5EC' : isCritico ? '#FEECEC' : isAttesa ? '#FEF3E2' : '#F2F2F2'
  const color = isOk ? '#2D7A3A' : isCritico ? '#B03030' : isAttesa ? '#A0620A' : '#999'

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
  const [articoli, setArticoli] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editArticolo, setEditArticolo] = useState(null)
  const [filtroCliente, setFiltroCliente] = useState('Tutti')
  const [filtroStato, setFiltroStato] = useState('Tutti')

  useEffect(() => {
    const q = query(
      collection(db, 'articoli'),
      where('sbloccato', '==', false),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setArticoli(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const clienti = ['Tutti', ...new Set(articoli.map(a => a.cliente).filter(Boolean))]
  const stati = ['Tutti', 'Confo OK', 'In lavorazione', 'Critico', 'Sospeso']

  const filtered = articoli.filter(a => {
    if (filtroCliente !== 'Tutti' && a.cliente !== filtroCliente) return false
    if (filtroStato !== 'Tutti' && a.statoGenerale !== filtroStato) return false
    return true
  })

  const totale = articoli.length
  const sbloccati = 0 // solo non-sbloccati in questa view
  const inAttesa = articoli.filter(a => a.statoGenerale === 'In lavorazione').length
  const critici = articoli.filter(a => a.statoGenerale === 'Critico').length
  const confoOk = articoli.filter(a => a.statoGenerale === 'Confo OK').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Stats */}
      <div style={styles.statsbar}>
        <Stat n={totale} label="Totale" />
        <Stat n={confoOk} label="Confo OK" color="#2D7A3A" />
        <Stat n={inAttesa} label="In lavorazione" color="#A0620A" />
        <Stat n={critici} label="Critici" color="#B03030" />
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
        <div style={{ width: 1, background: '#E8E8E8', margin: '0 4px' }} />
        <span style={styles.filterLabel}>Stato:</span>
        {stati.map(s => (
          <button key={s} onClick={() => setFiltroStato(s)}
            style={{ ...styles.chip, ...(filtroStato === s ? styles.chipOn : {}) }}>
            {s}
          </button>
        ))}
        <button
          onClick={() => { setEditArticolo(null); setShowModal(true) }}
          style={styles.btnNew}
        >
          + Nuovo articolo
        </button>
      </div>

      {/* Tabella + side panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          {loading ? (
            <div style={styles.loading}>Caricamento...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.loading}>Nessun articolo trovato. Clicca "+ Nuovo articolo" per iniziare.</div>
          ) : (
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
                      <th key={c + '-stato'} style={styles.thSub}>Stato</th>
                      <th key={c + '-forn'} style={styles.thSub}>Fornitore</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(articolo => {
                  const sel = selected?.id === articolo.id
                  const { bg, color } = statoGeneraleStyle(articolo.statoGenerale)
                  return (
                    <tr
                      key={articolo.id}
                      onClick={() => setSelected(sel ? null : articolo)}
                      style={{ cursor: 'pointer', background: sel ? '#F7F9FF' : '#fff' }}
                    >
                      <td style={styles.td}>
                        {articolo.fotoUrl
                          ? <img src={articolo.fotoUrl} alt="" style={styles.thumb} />
                          : <div style={styles.thumbEmpty}>—</div>
                        }
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{articolo.cliente}</td>
                      <td style={styles.td}>{articolo.stagione}</td>
                      <td style={styles.td}>{articolo.manovia}</td>
                      <td style={{ ...styles.td, fontSize: 11 }}>{articolo.modello}</td>
                      <td style={styles.td}>{articolo.forma}</td>
                      <td style={styles.td}>{articolo.paia}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: bg, color }}>
                          {articolo.statoGenerale}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {articolo.provaCalzata
                          ? <span style={{ ...styles.badge, background: '#EBF5EC', color: '#2D7A3A' }}>{articolo.provaCalzata}</span>
                          : <span style={styles.dash}>—</span>
                        }
                      </td>
                      {COMPONENTI_COLS.map(c => (
                        <ComponenteCell key={c} comp={articolo.componenti?.[c]} />
                      ))}
                      <td style={{ ...styles.td, fontSize: 10, maxWidth: 100, color: '#555' }}>{articolo.conformita}</td>
                      <td style={styles.td}>
                        {articolo.dataSblocco
                          ? <span style={{ ...styles.badge, background: '#FEF3E2', color: '#A0620A' }}>{articolo.dataSblocco}</span>
                          : <span style={styles.dash}>—</span>
                        }
                      </td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#555' }}>{articolo.consegna}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Side panel */}
        {selected && (
          <SidePanel
            articolo={selected}
            onEdit={() => { setEditArticolo(selected); setShowModal(true) }}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ArticoloModal
          articolo={editArticolo}
          onClose={() => { setShowModal(false); setEditArticolo(null) }}
        />
      )}
    </div>
  )
}

function Stat({ n, label, color = '#111' }) {
  return (
    <div style={{ paddingRight: 24, marginRight: 8 }}>
      <div style={{ fontSize: 20, fontWeight: 600, color }}>{n}</div>
      <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{label}</div>
    </div>
  )
}

const styles = {
  statsbar: { display: 'flex', padding: '8px 24px', borderBottom: '1px solid #EBEBEB', flexShrink: 0 },
  filtersbar: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 24px', borderBottom: '1px solid #EBEBEB', background: '#FAFAFA', flexShrink: 0, flexWrap: 'wrap' },
  filterLabel: { fontSize: 11, color: '#999' },
  chip: { padding: '3px 10px', fontSize: 11, borderRadius: 20, border: '1px solid #E8E8E8', background: '#fff', color: '#555', cursor: 'pointer' },
  chipOn: { background: '#111', color: '#fff', borderColor: '#111' },
  btnNew: { marginLeft: 'auto', padding: '5px 14px', fontSize: 12, fontWeight: 600, borderRadius: 7, border: 'none', background: '#111', color: '#fff', cursor: 'pointer' },
  loading: { padding: 40, textAlign: 'center', color: '#999', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#999', letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid #EBEBEB', background: '#FAFAFA', whiteSpace: 'nowrap', borderRight: '1px solid #F0F0F0' },
  thGroup: { padding: '6px 8px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#555', background: '#FAFAFA', borderBottom: '1px solid #E0E0E0', borderLeft: '2px solid #E8E8E8', borderRight: '1px solid #F0F0F0' },
  thSub: { padding: '4px 8px', textAlign: 'center', fontSize: 9, color: '#bbb', background: '#F8F8F8', borderBottom: '1px solid #EBEBEB', borderRight: '1px solid #F0F0F0' },
  td: { padding: '7px 10px', borderBottom: '1px solid #F2F2F2', color: '#222', verticalAlign: 'middle', borderRight: '1px solid #F5F5F5' },
  badge: { display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' },
  fornitoreTag: { fontSize: 9, color: '#bbb', textAlign: 'center' },
  dash: { color: '#ccc', fontSize: 12 },
  thumb: { width: 30, height: 30, borderRadius: 5, objectFit: 'cover', border: '1px solid #E8E8E8' },
  thumbEmpty: { width: 30, height: 30, borderRadius: 5, background: '#F0F0F0', border: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#bbb' },
}
