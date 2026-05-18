import { useState } from 'react'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'

const COMPONENTI = ['forma', 'sottopiede', 'tacco', 'suola', 'fussbet', 'scasso']
const STATI_COMPONENTE = ['—', 'OK', 'In attesa', 'Critico']
const STATI_GENERALI = ['In lavorazione', 'Confo OK', 'Critico', 'Sospeso']

function defaultForm(articolo) {
  return {
    cliente:        articolo?.cliente        || '',
    stagione:       articolo?.stagione       || '',
    manovia:        articolo?.manovia        || '',
    modello:        articolo?.modello        || '',
    forma:          articolo?.forma          || '',
    paia:           articolo?.paia           || '',
    statoGenerale:  articolo?.statoGenerale  || 'In lavorazione',
    provaCalzata:   articolo?.provaCalzata   || '',
    provaModello:   articolo?.provaModello   || '',
    provaStruttura: articolo?.provaStruttura || '',
    conformita:     articolo?.conformita     || '',
    dataSblocco:    articolo?.dataSblocco    || '',
    consegna:       articolo?.consegna       || '',
    note:           articolo?.note           || '',
    fotoUrl:        articolo?.fotoUrl        || '',
    componenti: {
      forma:      { stato: articolo?.componenti?.forma?.stato      || '—', fornitore: articolo?.componenti?.forma?.fornitore      || '' },
      sottopiede: { stato: articolo?.componenti?.sottopiede?.stato || '—', fornitore: articolo?.componenti?.sottopiede?.fornitore || '' },
      tacco:      { stato: articolo?.componenti?.tacco?.stato      || '—', fornitore: articolo?.componenti?.tacco?.fornitore      || '' },
      suola:      { stato: articolo?.componenti?.suola?.stato      || '—', fornitore: articolo?.componenti?.suola?.fornitore      || '' },
      fussbet:    { stato: articolo?.componenti?.fussbet?.stato    || '—', fornitore: articolo?.componenti?.fussbet?.fornitore    || '' },
      scasso:     { stato: articolo?.componenti?.scasso?.stato     || '—', fornitore: articolo?.componenti?.scasso?.fornitore     || '' },
    }
  }
}

export default function ArticoloModal({ articolo, onClose }) {
  const { user } = useAuth()
  const isEdit = !!articolo?.id
  const [form, setForm] = useState(() => defaultForm(articolo))
  const [fotoBase64, setFotoBase64] = useState(null)
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
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 600
        let w = img.width, h = img.height
        if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX }
        else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        const base64 = canvas.toDataURL('image/jpeg', 0.75)
        setFotoBase64(base64)
        setFotoPreview(base64)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.cliente || !form.modello) {
      setError('Cliente e Modello sono obbligatori')
      return
    }
    setSaving(true)
    setError('')
    try {
      const fotoUrl = fotoBase64 || form.fotoUrl || ''
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
      setError('Errore: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.title}>{isEdit ? 'Modifica articolo' : 'Nuovo articolo'}</div>
            {isEdit && <div style={styles.subtitle}>{articolo.cliente} — {articolo.modello}</div>}
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Body */}
        <div style={styles.body}>

          {/* Info base */}
          <SectionTitle>Informazioni base</SectionTitle>
          <div style={styles.grid2}>
            <Field label="Cliente *"  value={form.cliente}  onChange={v => setField('cliente', v)} />
            <Field label="Stagione"   value={form.stagione}  onChange={v => setField('stagione', v)} />
            <Field label="Manovia"    value={form.manovia}   onChange={v => setField('manovia', v)} />
            <Field label="Modello *"  value={form.modello}   onChange={v => setField('modello', v)} />
            <Field label="Forma"      value={form.forma}     onChange={v => setField('forma', v)} />
            <Field label="Paia"       value={form.paia}      onChange={v => setField('paia', v)} type="number" />
          </div>

          {/* Stato generale */}
          <SectionTitle>Stato generale</SectionTitle>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {STATI_GENERALI.map(s => (
              <button key={s} onClick={() => setField('statoGenerale', s)}
                style={{ ...styles.statoBadge, ...(form.statoGenerale === s ? styles.statoBadgeActive : {}) }}>
                {s}
              </button>
            ))}
          </div>

          {/* Prove */}
          <SectionTitle>Prove</SectionTitle>
          <div style={{ ...styles.grid2, marginBottom: 20 }}>
            <Field label="Prova calzata"   value={form.provaCalzata}   onChange={v => setField('provaCalzata', v)} />
            <Field label="Prova modello"   value={form.provaModello}   onChange={v => setField('provaModello', v)} />
            <Field label="Prova struttura" value={form.provaStruttura} onChange={v => setField('provaStruttura', v)} />
          </div>

          {/* Componenti */}
          <SectionTitle>Componenti</SectionTitle>
          <div style={{ marginBottom: 20 }}>
            {COMPONENTI.map(comp => (
              <div key={comp} style={styles.compRow}>
                <div style={styles.compLabel}>{comp.charAt(0).toUpperCase() + comp.slice(1)}</div>
                <select
                  value={form.componenti[comp]?.stato || '—'}
                  onChange={e => setComponente(comp, 'stato', e.target.value)}
                  style={styles.select}
                >
                  {STATI_COMPONENTE.map(s => <option key={s} value={s}>{s}</option>)}
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

          {/* Date */}
          <SectionTitle>Date e conformità</SectionTitle>
          <div style={styles.grid2}>
            <Field label="Conformità"   value={form.conformita}  onChange={v => setField('conformita', v)} />
            <Field label="Data sblocco" value={form.dataSblocco} onChange={v => setField('dataSblocco', v)} type="date" />
            <Field label="Consegna"     value={form.consegna}    onChange={v => setField('consegna', v)} />
          </div>

          {/* Note */}
          <SectionTitle>Note</SectionTitle>
          <textarea
            value={form.note}
            onChange={e => setField('note', e.target.value)}
            style={{ ...styles.input, width: '100%', resize: 'vertical', marginBottom: 20 }}
            rows={3}
            placeholder="Note aggiuntive..."
          />

          {/* Foto */}
          <SectionTitle>Foto articolo</SectionTitle>
          {fotoPreview && (
            <img src={fotoPreview} alt="preview"
              style={{ width: 120, height: 100, objectFit: 'cover', borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 8, display: 'block' }} />
          )}
          <input type="file" accept="image/*" onChange={handleFoto} style={{ fontSize: 12, marginBottom: 4 }} />
          <div style={{ fontSize: 10, color: '#94A3B8' }}>La foto viene ridimensionata automaticamente</div>

          {error && <div style={styles.error}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnCancel}>Annulla</button>
          <button onClick={handleSave} style={styles.btnSave} disabled={saving}>
            {saving ? 'Salvataggio...' : isEdit ? '✓ Salva modifiche' : '+ Crea articolo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={styles.input}
      />
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
  modal: {
    background: '#fff',
    borderRadius: 16,
    width: 700,
    maxWidth: '95vw',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid #F1F5F9',
  },
  title:    { fontSize: 16, fontWeight: 700, color: '#1E293B' },
  subtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  closeBtn: { background: 'none', border: 'none', fontSize: 16, color: '#94A3B8', cursor: 'pointer', padding: 4 },
  body:   { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 24px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', borderRadius: '0 0 16px 16px' },
  grid2:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', marginBottom: 20 },
  compRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  compLabel: { fontSize: 12, fontWeight: 500, color: '#334155', width: 90, flexShrink: 0, textTransform: 'capitalize' },
  select: { padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#334155', background: '#fff', width: 120, cursor: 'pointer' },
  input:  { padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: '#1E293B', outline: 'none', background: '#fff', width: '100%' },
  statoBadge: { padding: '6px 14px', borderRadius: 20, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  statoBadgeActive: { background: '#6366F1', color: '#fff', borderColor: '#6366F1', fontWeight: 700 },
  error:  { background: '#FEE2E2', color: '#DC2626', padding: '10px 12px', borderRadius: 8, fontSize: 12, marginTop: 12 },
  btnCancel: { padding: '9px 18px', fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer' },
  btnSave:   { padding: '9px 20px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', background: '#6366F1', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
}
