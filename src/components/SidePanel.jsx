import { useState } from 'react'
import { doc, updateDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

const COMPONENTI = ['forma', 'sottopiede', 'tacco', 'suola', 'fussbet', 'scasso']

function statoColore(stato) {
  if (!stato || stato === '—') return '#999'
  if (stato === 'OK' || stato.startsWith('OK')) return '#2D7A3A'
  if (stato === 'In attesa') return '#A0620A'
  if (stato === 'Critico') return '#B03030'
  return '#999'
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
  const [sbloccato, setSbloccato] = useState(false)

  async function handleSblocca() {
    if (!window.confirm(`Confermi lo sblocco di "${articolo.cliente} — ${articolo.modello}"? L'articolo verrà spostato nello storico.`)) return
    setSbloccando(true)
    try {
      const today = new Date()
      const dataSblocco = today.toLocaleDateString('it-IT')

      // Aggiungi allo storico
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

      // Segna come sbloccato
      await updateDoc(doc(db, 'articoli', articolo.id), {
        sbloccato: true,
        dataSbloccoEffettiva: dataSblocco,
        sbloccatoDa: user?.email,
      })

      setSbloccato(true)
      onClose()
    } catch (err) {
      console.error(err)
      alert('Errore durante lo sblocco')
    } finally {
      setSbloccando(false)
    }
  }

  return (
    <div style={styles.side}>
      <div style={styles.header}>
        <div>
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
          <div style={styles.fotoPlaceholder}>Nessuna foto</div>
        )}

        {/* Stato generale */}
        <div style={styles.fieldGroup}>
          <div style={styles.label}>Stato generale</div>
          <StatoBadge stato={articolo.statoGenerale} />
        </div>

        <div style={styles.divider} />

        {/* Componenti */}
        <div style={styles.fieldGroup}>
          <div style={styles.label}>Componenti</div>
          {COMPONENTI.map(comp => {
            const c = articolo.componenti?.[comp]
            if (!c) return null
            return (
              <div key={comp} style={{ marginBottom: 8 }}>
                <div style={styles.compRow}>
                  <span style={{ ...styles.dot, background: statoColore(c.stato) }} />
                  <span style={styles.compName}>{comp.charAt(0).toUpperCase() + comp.slice(1)}</span>
                  <StatoBadge stato={c.stato} />
                </div>
                {c.fornitore && (
                  <div style={styles.compFornitore}>{c.fornitore}</div>
                )}
              </div>
            )
          })}
        </div>

        <div style={styles.divider} />

        {/* Prove */}
        {(articolo.provaCalzata || articolo.provaModello || articolo.provaStruttura) && (
          <>
            <div style={styles.fieldGroup}>
              <div style={styles.label}>Prove</div>
              {articolo.provaCalzata && <InfoRow label="Calzata" value={articolo.provaCalzata} />}
              {articolo.provaModello && <InfoRow label="Modello" value={articolo.provaModello} />}
              {articolo.provaStruttura && <InfoRow label="Struttura" value={articolo.provaStruttura} />}
            </div>
            <div style={styles.divider} />
          </>
        )}

        {/* Date */}
        <div style={styles.fieldGroup}>
          <div style={styles.label}>Date</div>
          {articolo.dataSblocco && <InfoRow label="Sblocco previsto" value={articolo.dataSblocco} />}
          {articolo.consegna && <InfoRow label="Consegna" value={articolo.consegna} />}
        </div>

        {/* Conformità */}
        {articolo.conformita && (
          <div style={styles.fieldGroup}>
            <div style={styles.label}>Conformità</div>
            <div style={styles.noteBox}>{articolo.conformita}</div>
          </div>
        )}

        {/* Note */}
        {articolo.note && (
          <div style={styles.fieldGroup}>
            <div style={styles.label}>Note</div>
            <div style={styles.noteBox}>{articolo.note}</div>
          </div>
        )}

        <div style={styles.divider} />

        {/* Azioni */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onEdit} style={styles.btnEdit}>Modifica articolo</button>

          {!articolo.sbloccato && (
            <button
              onClick={handleSblocca}
              style={styles.btnSblocca}
              disabled={sbloccando}
            >
              {sbloccando ? 'Sblocco in corso...' : '🔓 Articolo sbloccato'}
            </button>
          )}

          {articolo.sbloccato && (
            <div style={styles.sbloccatoTag}>
              ✓ Sbloccato il {articolo.dataSbloccoEffettiva} da {articolo.sbloccatoDa}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 12, marginBottom: 4 }}>
      <span style={{ color: '#aaa', minWidth: 70 }}>{label}:</span>
      <span style={{ color: '#222' }}>{value}</span>
    </div>
  )
}

const styles = {
  side: {
    width: 272,
    borderLeft: '1px solid #EBEBEB',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '14px 16px 10px',
    borderBottom: '1px solid #EBEBEB',
  },
  title: { fontSize: 13, fontWeight: 600, color: '#111' },
  sub: { fontSize: 11, color: '#999', marginTop: 2 },
  closeBtn: { background: 'none', border: 'none', fontSize: 14, color: '#bbb', cursor: 'pointer', flexShrink: 0, marginLeft: 8, marginTop: 2 },
  body: { flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  foto: { width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #EBEBEB' },
  fotoPlaceholder: { width: '100%', height: 80, background: '#FAFAFA', border: '1px dashed #D8D8D8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#bbb' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em' },
  divider: { borderTop: '1px solid #F0F0F0' },
  compRow: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  compName: { fontSize: 12, color: '#333', flex: 1, textTransform: 'capitalize' },
  compFornitore: { fontSize: 10, color: '#bbb', marginLeft: 13, marginTop: 1 },
  noteBox: { fontSize: 11, color: '#555', background: '#FAFAFA', border: '1px solid #EBEBEB', borderRadius: 6, padding: '7px 9px', lineHeight: 1.5 },
  btnEdit: { width: '100%', padding: 8, fontSize: 12, borderRadius: 7, border: '1px solid #D8D8D8', background: '#fff', color: '#333', cursor: 'pointer' },
  btnSblocca: { width: '100%', padding: 10, fontSize: 12, fontWeight: 600, background: '#2D7A3A', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' },
  sbloccatoTag: { fontSize: 11, color: '#2D7A3A', background: '#EBF5EC', border: '1px solid #C3E0C8', borderRadius: 6, padding: '8px 10px', lineHeight: 1.5 },
}
