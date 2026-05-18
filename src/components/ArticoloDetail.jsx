import { useState } from 'react'
import { doc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

const COMPONENTI = ['forma', 'sottopiede', 'tacco', 'suola', 'fussbet', 'scasso']

function statoColor(stato) {
  if (!stato || stato === '—') return { bg: '#F1F5F9', color: '#94A3B8' }
  if (stato === 'OK' || stato.startsWith('OK')) return { bg: '#DCFCE7', color: '#16A34A' }
  if (stato === 'In attesa') return { bg: '#FEF9C3', color: '#CA8A04' }
  if (stato === 'Critico')   return { bg: '#FEE2E2', color: '#DC2626' }
  return { bg: '#F1F5F9', color: '#94A3B8' }
}

export default function ArticoloDetail({ articolo, onEdit, onClose, onDeleted }) {
  const { user } = useAuth()
  const [sbloccando, setSbloccando]         = useState(false)
  const [eliminando, setEliminando]         = useState(false)
  const [confermaElimina, setConfermaElimina] = useState(false)

  async function handleSblocca() {
    if (!window.confirm(`Confermi lo sblocco di "${articolo.cliente} — ${articolo.modello}"?`)) return
    setSbloccando(true)
    try {
      const dataSblocco = new Date().toLocaleDateString('it-IT')
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
      alert('Errore: ' + err.message)
    } finally {
      setSbloccando(false)
    }
  }

  async function handleElimina() {
    setEliminando(true)
    try {
      await deleteDoc(doc(db, 'articoli', articolo.id))
      onDeleted()
    } catch (err) {
      alert('Errore: ' + err.message)
    } finally {
      setEliminando(false)
    }
  }

  const statoStyle = (() => {
    switch (articolo.statoGenerale) {
      case 'Confo OK':       return { bg: '#DCFCE7', color: '#16A34A' }
      case 'In lavorazione': return { bg: '#FEF9C3', color: '#CA8A04' }
      case 'Critico':        return { bg: '#FEE2E2', color: '#DC2626' }
      default:               return { bg: '#F1F5F9', color: '#64748B' }
    }
  })()

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.popup}>

        {/* Header */}
        <div style={{ ...styles.popupHeader, background: statoStyle.bg }}>
          <div style={{ flex: 1 }}>
            <div style={styles.popupTitle}>{articolo.cliente} — {articolo.modello}</div>
            <div style={styles.popupSub}>
              {[articolo.stagione, articolo.manovia, articolo.paia && `${articolo.paia} paia`].filter(Boolean).join(' · ')}
            </div>
            <span style={{ ...styles.statoBadge, background: '#fff', color: statoStyle.color }}>
              {articolo.statoGenerale}
            </span>
          </div>
          {articolo.fotoUrl && (
            <img src={articolo.fotoUrl} alt="" style={styles.fotoHeader} />
          )}
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Body */}
        <div style={styles.popupBody}>
          <div style={styles.cols}>

            {/* Colonna sinistra */}
            <div style={styles.col}>

              {/* Componenti */}
              <Section title="Componenti">
                {COMPONENTI.map(comp => {
                  const c = articolo.componenti?.[comp]
                  if (!c) return null
                  const { bg, color } = statoColor(c.stato)
                  return (
                    <div key={comp} style={styles.compRow}>
                      <div style={styles.compName}>{comp.charAt(0).toUpperCase() + comp.slice(1)}</div>
                      <span style={{ ...styles.miniBadge, background: bg, color }}>{c.stato || '—'}</span>
                      {c.fornitore && <span style={styles.compFornitore}>{c.fornitore}</span>}
                    </div>
                  )
                })}
              </Section>

              {/* Prove */}
              {(articolo.provaCalzata || articolo.provaModello || articolo.provaStruttura) && (
                <Section title="Prove">
                  {articolo.provaCalzata   && <InfoRow label="Calzata"   value={articolo.provaCalzata} />}
                  {articolo.provaModello   && <InfoRow label="Modello"   value={articolo.provaModello} />}
                  {articolo.provaStruttura && <InfoRow label="Struttura" value={articolo.provaStruttura} />}
                </Section>
              )}
            </div>

            {/* Colonna destra */}
            <div style={styles.col}>

              {/* Date */}
              <Section title="Date">
                {articolo.dataSblocco && <InfoRow label="Sblocco previsto" value={articolo.dataSblocco} />}
                {articolo.consegna    && <InfoRow label="Consegna"         value={articolo.consegna} />}
                {articolo.dataSbloccoEffettiva && (
                  <InfoRow label="Sbloccato il" value={articolo.dataSbloccoEffettiva} highlight />
                )}
              </Section>

              {/* Conformità */}
              {articolo.conformita && (
                <Section title="Conformità">
                  <div style={styles.noteText}>{articolo.conformita}</div>
                </Section>
              )}

              {/* Note */}
              {articolo.note && (
                <Section title="Note">
                  <div style={styles.noteText}>{articolo.note}</div>
                </Section>
              )}

              {/* Foto se non in header */}
              {articolo.fotoUrl && (
                <Section title="Foto articolo">
                  <img src={articolo.fotoUrl} alt="" style={styles.fotoBody} />
                </Section>
              )}
            </div>
          </div>
        </div>

        {/* Footer azioni */}
        <div style={styles.popupFooter}>
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <button onClick={onEdit} style={styles.btnEdit}>✏️ Modifica</button>

            {!articolo.sbloccato ? (
              <button onClick={handleSblocca} style={styles.btnSblocca} disabled={sbloccando}>
                {sbloccando ? 'Sblocco in corso...' : '🔓 Segna come sbloccato'}
              </button>
            ) : (
              <div style={styles.sbloccatoTag}>✓ Già sbloccato il {articolo.dataSbloccoEffettiva}</div>
            )}
          </div>

          {!confermaElimina ? (
            <button onClick={() => setConfermaElimina(true)} style={styles.btnElimina}>
              🗑 Elimina
            </button>
          ) : (
            <div style={styles.confermaBox}>
              <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Sicuro?</span>
              <button onClick={() => setConfermaElimina(false)} style={styles.btnAnnulla}>No</button>
              <button onClick={handleElimina} style={styles.btnConferma} disabled={eliminando}>
                {eliminando ? '...' : 'Sì, elimina'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 5, alignItems: 'flex-start' }}>
      <span style={{ color: '#94A3B8', minWidth: 110, fontSize: 11, flexShrink: 0 }}>{label}</span>
      <span style={{ color: highlight ? '#16A34A' : '#1E293B', fontWeight: highlight ? 600 : 400 }}>{value}</span>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  popup: {
    background: '#fff',
    borderRadius: 20,
    width: 780,
    maxWidth: '95vw',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  popupHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    padding: '20px 24px',
    position: 'relative',
  },
  popupTitle: { fontSize: 18, fontWeight: 800, color: '#1E293B', marginBottom: 4 },
  popupSub:   { fontSize: 12, color: '#64748B', marginBottom: 10 },
  statoBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  fotoHeader: { width: 90, height: 90, objectFit: 'cover', borderRadius: 12, border: '2px solid rgba(255,255,255,0.8)', flexShrink: 0 },
  closeBtn:   { position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 28, height: 28, fontSize: 13, color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  popupBody:  { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  cols:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  col:        { display: 'flex', flexDirection: 'column' },
  compRow:    { display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid #F1F5F9', marginBottom: 8 },
  compName:   { fontSize: 12, fontWeight: 500, color: '#334155', width: 80, flexShrink: 0, textTransform: 'capitalize' },
  miniBadge:  { display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600 },
  compFornitore: { fontSize: 11, color: '#94A3B8', marginLeft: 'auto' },
  noteText:   { fontSize: 12, color: '#475569', lineHeight: 1.6, background: '#F8FAFC', borderRadius: 8, padding: '10px 12px' },
  fotoBody:   { width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 200, border: '1px solid #E2E8F0' },
  popupFooter:{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC' },
  btnEdit:    { padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#334155', cursor: 'pointer' },
  btnSblocca: { padding: '8px 16px', fontSize: 12, fontWeight: 700, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' },
  btnElimina: { padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer' },
  confermaBox:{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEE2E2', borderRadius: 8, padding: '6px 10px' },
  btnAnnulla: { padding: '5px 10px', fontSize: 11, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' },
  btnConferma:{ padding: '5px 10px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer' },
  sbloccatoTag: { fontSize: 11, color: '#16A34A', background: '#DCFCE7', borderRadius: 8, padding: '6px 12px', fontWeight: 600 },
}
