import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

const COMPONENTI = ['forma', 'sottopiede', 'tacco', 'suola', 'fussbet', 'scasso']
const STATI_COMPONENTE = ['—', 'OK', 'In attesa', 'Critico']
const STATI_GENERALI = ['In lavorazione', 'Confo OK', 'Critico', 'Sospeso']

const defaultArticolo = {
  cliente: '',
  stagione: '',
  manovia: '',
  modello: '',
  forma: '',
  paia: '',
  statoGenerale: 'In lavorazione',
  provaCalzata: '',
  provaModello: '',
  provaStruttura: '',
  conformita: '',
  dataSblocco: '',
  consegna: '',
  note: '',
  fotoUrl: '',
  componenti: {
    forma:      { stato: '—', fornitore: '' },
    sottopiede: { stato: '—', fornitore: '' },
    tacco:      { stato: '—', fornitore: '' },
    suola:      { stato: '—', fornitore: '' },
    fussbet:    { stato: '—', fornitore: '' },
    scasso:     { stato: '—', fornitore: '' },
  }
}

export default function ArticoloModal({ articolo, onClose }) {
  const { user } = useAuth()
  const isEdit = !!articolo?.id
  const [form, setForm] = useState(isEdit ? { ...defaultArticolo, ...articolo } : defaultArticolo)
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(articolo?.fotoUrl || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setComponente(comp, field, value) {
    setForm(f => ({
      ...f,
      componenti: {
        ...f.componenti,
        [comp]: { ...f.componenti[comp], [field]: value }
      }
    }))
  }

  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.cliente || !form.modello) {
      setError('Cliente e Modello sono obbligatori')
      return
    }
    setSaving(true)
    setError('')
    try {
      let fotoUrl = form.fotoUrl || ''
      if (fotoFile) {
        const storageRef = ref(storage, `foto/${Date.now()}_${fotoFile.name}`)
        await uploadBytes(storageRef, fotoFile)
        fotoUrl = await getDownloadURL(storageRef)
      }

      const data = {
        ...form,
        fotoUrl,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email,
      }

      if (isEdit) {
        await updateDoc(doc(db, 'articoli', articolo.id), data)
      } else {
        await addDoc(collection(db, 'articoli'), {
          ...data,
          createdAt: serverTimestamp(),
          createdBy: user?.email,
          sbloccato: false,
        })
      }
      onClose()
    } catch (err) {
      setError('Errore durante il salvataggio')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.title}>{isEdit ? 'Modifica articolo' : 'Nuovo articolo'}</div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          {/* Sezione info base */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Informazioni base</div>
            <div style={styles.grid2}>
              <Field label="Cliente *" value={form.cliente} onChange={v => setField('cliente', v)} />
              <Field label="Stagione" value={form.stagione} onChange={v => setField('stagione', v)} />
              <Field label="Manovia" value={form.manovia} onChange={v => setField('manovia', v)} />
              <Field label="Modello *" value={form.modello} onChange={v => setField('modello', v)} />
              <Field label="Forma" value={form.forma} onChange={v => setField('forma', v)} />
              <Field label="Paia" value={form.paia} onChange={v => setField('paia', v)} type="number" />
            </div>
          </div>

          {/* Stato generale */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Stato generale</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATI_GENERALI.map(s => (
                <button
                  key={s}
                  onClick={() => setField('statoGenerale', s)}
                  style={{
                    ...styles.statoBadge,
                    ...(form.statoGenerale === s ? styles.statoBadgeActive : {})
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Prove */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Prove</div>
            <div style={styles.grid3}>
              <Field label="Prova calzata" value={form.provaCalzata} onChange={v => setField('provaCalzata', v)} />
              <Field label="Prova modello" value={form.provaModello} onChange={v => setField('provaModello', v)} />
              <Field label="Prova struttura" value={form.provaStruttura} onChange={v => setField('provaStruttura', v)} />
            </div>
          </div>

          {/* Componenti */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Componenti</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {COMPONENTI.map(comp => (
                <div key={comp} style={styles.compRow}>
                  <div style={styles.compName}>{comp.charAt(0).toUpperCase() + comp.slice(1)}</div>
                  <select
                    value={form.componenti[comp]?.stato || '—'}
                    onChange={e => setComponente(comp, 'stato', e.target.value)}
                    style={styles.select}
                  >
                    {STATI_COMPONENTE.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <input
                    placeholder="Fornitore"
                    value={form.componenti[comp]?.fornitore || ''}
                    onChange={e => setComponente(comp, 'fornitore', e.target.value)}
                    style={{ ...styles.input, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Date e conformità */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Date e conformità</div>
            <div style={styles.grid2}>
              <Field label="Conformità" value={form.conformita} onChange={v => setField('conformita', v)} />
              <Field label="Data sblocco" value={form.dataSblocco} onChange={v => setField('dataSblocco', v)} type="date" />
              <Field label="Consegna" value={form.consegna} onChange={v => setField('consegna', v)} />
            </div>
          </div>

          {/* Note */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Note</div>
            <textarea
              value={form.note}
              onChange={e => setField('note', e.target.value)}
              style={styles.textarea}
              rows={3}
              placeholder="Note aggiuntive..."
            />
          </div>

          {/* Foto */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Foto articolo</div>
            {fotoPreview && (
              <img src={fotoPreview} alt="preview" style={styles.fotoPreview} />
            )}
            <input type="file" accept="image/*" onChange={handleFoto} style={{ fontSize: 12 }} />
          </div>

          {error && <div style={styles.error}>{error}</div>}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnCancel}>Annulla</button>
          <button onClick={handleSave} style={styles.btnSave} disabled={saving}>
            {saving ? 'Salvataggio...' : (isEdit ? 'Salva modifiche' : 'Crea articolo')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ padding: '6px 8px', border: '1px solid #D8D8D8', borderRadius: 6, fontSize: 12, color: '#111', outline: 'none' }}
      />
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    width: 680,
    maxWidth: '95vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #EBEBEB',
  },
  title: { fontSize: 14, fontWeight: 600, color: '#111' },
  closeBtn: { background: 'none', border: 'none', fontSize: 16, color: '#999', cursor: 'pointer' },
  body: { flex: 1, overflowY: 'auto', padding: '20px' },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 8,
    padding: '14px 20px',
    borderTop: '1px solid #EBEBEB',
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  compRow: { display: 'flex', alignItems: 'center', gap: 8 },
  compName: { fontSize: 12, color: '#333', width: 90, flexShrink: 0, textTransform: 'capitalize' },
  select: { padding: '6px 8px', border: '1px solid #D8D8D8', borderRadius: 6, fontSize: 12, color: '#111', background: '#fff', width: 110 },
  input: { padding: '6px 8px', border: '1px solid #D8D8D8', borderRadius: 6, fontSize: 12, color: '#111', outline: 'none' },
  textarea: { width: '100%', padding: '8px', border: '1px solid #D8D8D8', borderRadius: 6, fontSize: 12, color: '#111', outline: 'none', resize: 'vertical' },
  statoBadge: { padding: '5px 12px', borderRadius: 20, border: '1px solid #E0E0E0', background: '#F5F5F5', color: '#555', cursor: 'pointer', fontSize: 12 },
  statoBadgeActive: { background: '#111', color: '#fff', borderColor: '#111' },
  fotoPreview: { width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #EBEBEB', marginBottom: 8 },
  error: { background: '#FEECEC', color: '#B03030', padding: '8px 10px', borderRadius: 6, fontSize: 12, marginTop: 8 },
  btnCancel: { padding: '8px 16px', fontSize: 12, borderRadius: 7, border: '1px solid #E0E0E0', background: '#fff', color: '#555', cursor: 'pointer' },
  btnSave: { padding: '8px 20px', fontSize: 12, fontWeight: 600, borderRadius: 7, border: 'none', background: '#111', color: '#fff', cursor: 'pointer' },
}
