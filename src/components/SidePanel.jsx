import { useState } from 'react'
import { doc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

const COMPONENTI = ['forma', 'sottopiede', 'tacco', 'suola', 'fussbet', 'scasso']

function statoColore(stato) {
  if (!stato || stato === '—') return '#ccc'
  if (stato === 'OK' || stato.startsWith('OK')) return '#2D7A3A'
  if (stato === 'In attesa') return '#A0620A'
  if (stato === 'Critico') return '#B03030'
  return '#ccc'
}

function StatoBadge({ stato }) {
  const color = statoColore(stato)
  const bg = color === '#2D7A3A' ? '#EBF5EC' : color === '#A0620A' ? '#FEF3E2' : color === '#B03030' ? '#FEECEC' : '#F2F2F2'
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: bg, color }}>
      {stato || '—'}
    </span>
  )
}

export default function SidePanel({ articolo, onEdit, onClose }) {
  const { user } = useAuth()
  const [sbloccando, setSbloccando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [confermaElimina, setConfermaElimina] = useState(false)

  async function handleSblocca() {
    if (!window.confirm(`Confermi lo sblocco di "${articolo.cliente} — ${articolo.modello}"?`)) return
    setSbloccando(true)
    try {
      const today = new Date()
      const dataSblocco = today.toLocaleDateString('it-IT')
      await addDoc(collection(db, 'sbloccati'), {
        articoloId: articolo.id,
        cliente: articolo.cliente,
        stagione: articolo.stagione,
        manovia: articolo.manovia,
        modello: articolo.modello,
        paia: articolo.paia,
        conformita: articolo.conformita,
        note: articolo.note,
        fotoUrl: articolo.fotoUrl || '',
        dataSblocco,
        sbloccatoDa: user?.email,
        sbloccatoAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'articoli', articolo.id), {
        sbloccato: true,
        dataSbloccoEffettiva: dataSblocco,
        sbloccatoDa: user?.email,
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert('Errore durante lo sblocco')
    } finally {
      setSbloccando(false)
    }
  }

  async function handleElimina() {
    setEliminando(true)
    try {
      await deleteDoc(doc(db, 'articoli', articolo.id))
      onClose()
    } catch (err) {
      console.error(err)
      alert('Errore durante eliminazione')
    } finally {
      setEliminando(false)
      setConfermaElimina(false)
    }
  }

  return (
    <div style={styles.side}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.title}>{articolo.cliente} — {articolo.modello}</div>
          <div style={styles.sub}>
            {[articolo.stagione, articolo.manovia, articolo.paia && `${articolo.paia} paia`].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>

      <div style={styles.body}>

        {/* Foto */}
        {articolo.fotoUrl ? (
          <img src={articolo.fotoUrl} alt="articolo" style={styles.foto} />
        ) : (
          <div style={styles.fotoPlaceholder}>📷 Nessuna foto</div>
        )}

        {/* Stato */}
        <div style={styles.card}>
          <div style={styles.cardLabel}>Stato generale</div>
          <StatoBadge stato={articolo.statoGenerale} />
        </div>

        {/* Componenti */}
        <div style={styles.card}>
          <div style={styles.cardLabel}>Componenti</div>
          {COMPONENTI.map(comp => {
            const c = articolo.componenti?.[comp]
            if (!c) return null
            return (
              <div key={comp} style={styles.compItem}>
                <div style={styles.compRow}>
                  <span style={{ ...styles.dot, background: statoColore(c.stato) }} />
                  <span style={styles.compName}>{comp.charAt(0).toUpperCase() + comp.slice(1)}</span>
                  <StatoBadge stato={c.stato} />
                </div>
                {c.fornitore && <div style={styles.compFornitore}>{c.fornitore}</div>}
              </div>
            )
          })}
        </div>

        {/* Prove */}
        {(articolo.provaCalzata || articolo.provaModello || articolo.provaStruttura) && (
          <div style={styles.card}>
            <div style={styles.cardLabel}>Prove</div>
            {articolo.provaCalzata  && <InfoRow label="Calzata"   value={articolo.provaCalzata} />}
            {articolo.provaModello  && <InfoRow label="Modello"   value={articolo.provaModello} />}
            {articolo.provaStruttura && <InfoRow label="Struttura" value={articolo.provaStruttura} />}
          </div>
        )}

        {/* Date */}
        {(articolo.dataSblocco || articolo.consegna) && (
          <div style={styles.card}>
            <div style={styles.cardLabel}>Date</div>
            {articolo.dataSblocco && <InfoRow label="Sblocco"  value={articolo.dataSblocco} />}
            {articolo.consegna    && <InfoRow label="Consegna" value={articolo.consegna} />}
          </div>
        )}

        {/* Conformità */}
        {articolo.conformita && (
          <div style={styles.card}>
            <div style={styles.cardLabel}>Conformità</div>
            <div style={styles.noteBox}>{articolo.conformita}</div>
          </div>
        )}

        {/* Note */}
        {articolo.note && (
          <div style={styles.card}>
            <div style={styles.cardLabel}>Note</div>
            <div style={styles.noteBox}>{articolo.note}</div>
          </div>
        )}

        {/* Azioni */}
        <div style={styles.actions}>
          <button onClick={onEdit} style={styles.btnEdit}>✏️ Modifica</button>

          {!articolo.sbloccato ? (
            <button onClick={handleSblocca} style={styles.btnSblocca} disabled={sbloccando}>
              {sbloccando ? 'Sblocco...' : '🔓 Articolo sbloccato'}
            </button>
          ) : (
            <div style={styles.sbloccatoTag}>
              ✓ Sbloccato il {articolo.dataSbloccoEffettiva}
            </div>
          )}

          {/* Elimina */}
          {!confermaElimina ? (
            <button onClick={() => setConfermaElimina(true)} style={styles.btnElimina}>
              🗑 Elimina articolo
            </button>
          ) : (
            <div style={styles.confermaBox}>
              <div style={{ fontSize: 12, color: '#B03030', marginBottom: 8, fontWeight: 500 }}>
                Sicuro di voler eliminare?
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setConfermaElimina(false)} style={styles.btnAnnullaElimina}>
                  Annulla
                </button>
                <button onClick={handleElimina} style={styles.btnConfermaElimina} disabled={eliminando}>
                  {eliminando ? 'Elimino...' : 'Sì, elimina'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4, alignItems: 'flex-start' }}>
      <span style={{ color: '#bbb', minWidth: 68, fontSize: 11 }}>{label}</span>
      <span style={{ color: '#222' }}>{value}</span>
    </div>
  )
}

const styles = {
  side: {
    width: 280,
    borderLeft: '1px solid #EBEBEB',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
    boxShadow: '-2px 0 8px rgba(0,0,0,0.04)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '14px 16px 12px',
    borderBottom: '1px solid #F0F0F0',
  },
  title: { fontSize: 13, fontWeight: 700, color: '#111', lineHeight: 1.3 },
  sub:   { fontSize: 11, color: '#aaa', marginTop: 3 },
  closeBtn: { background: 'none', border: 'none', fontSize: 14, color: '#ccc', cursor: 'pointer', flexShrink: 0, padding: 2 },
  body: { flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 },
  foto: { width: '100%', height: 150, objectFit: 'cover', borderRadius: 10, border: '1px solid #EBEBEB' },
  fotoPlaceholder: { width: '100%', height: 72, background: '#FAFAFA', border: '1px dashed #E0E0E0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#ccc' },
  card: { background: '#FAFAFA', border: '1px solid #F0F0F0', borderRadius: 10, padding: '10px 12px' },
  cardLabel: { fontSize: 9, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
  compItem: { marginBottom: 6 },
  compRow:  { display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  compName: { fontSize: 12, color: '#333', flex: 1, textTransform: 'capitalize' },
  compFornitore: { fontSize: 10, color: '#bbb', marginLeft: 12, marginTop: 2 },
  noteBox: { fontSize: 11, color: '#555', lineHeight: 1.6 },
  actions: { display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 },
  btnEdit:    { padding: '8px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #E8E8E8', background: '#fff', color: '#333', cursor: 'pointer', textAlign: 'left' },
  btnSblocca: { padding: '9px 12px', fontSize: 12, fontWeight: 600, background: '#2D7A3A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  btnElimina: { padding: '8px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #FEECEC', background: '#FEECEC', color: '#B03030', cursor: 'pointer', textAlign: 'left' },
  confermaBox: { background: '#FEECEC', border: '1px solid #F5C6C6', borderRadius: 8, padding: '10px 12px' },
  btnAnnullaElimina:  { flex: 1, padding: '6px', fontSize: 11, borderRadius: 6, border: '1px solid #E0E0E0', background: '#fff', color: '#555', cursor: 'pointer' },
  btnConfermaElimina: { flex: 1, padding: '6px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', background: '#B03030', color: '#fff', cursor: 'pointer' },
  sbloccatoTag: { fontSize: 11, color: '#2D7A3A', background: '#EBF5EC', border: '1px solid #C3E0C8', borderRadius: 8, padding: '8px 12px' },
}
