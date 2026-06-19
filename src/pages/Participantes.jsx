import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, Users, X } from 'lucide-react'
import Toast from '../components/Toast'

const COLORS = ['#6366f1','#ec4899','#f59e0b','#22c55e','#ef4444','#14b8a6','#8b5cf6','#f97316','#06b6d4','#84cc16']

function getInitials(nombre) {
  return nombre.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function Modal({ title, onClose, onSave, saving, initial }) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [color, setColor] = useState(initial?.avatar_color ?? COLORS[0])

  function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    onSave({ nombre: nombre.trim(), email: email.trim(), avatar_color: color })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{initial ? 'Editar participante' : 'Nuevo participante'}</span>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Juan García" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email (opcional)</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Color del avatar</label>
              <div className="color-opts">
                {COLORS.map(c => (
                  <div
                    key={c}
                    className={`color-opt${color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            {nombre && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar" style={{ background: color }}>{getInitials(nombre)}</div>
                <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>Vista previa</span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !nombre.trim()}>
              {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Participantes() {
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | {participant}
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('participantes').select('*').order('nombre')
    setParticipantes(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(values) {
    setSaving(true)
    let error
    if (modal?.id) {
      ;({ error } = await supabase.from('participantes').update(values).eq('id', modal.id))
    } else {
      ;({ error } = await supabase.from('participantes').insert(values))
    }
    setSaving(false)
    if (error) {
      setToast({ message: 'Error al guardar: ' + error.message, type: 'error' })
    } else {
      setToast({ message: modal?.id ? 'Participante actualizado' : 'Participante agregado', type: 'success' })
      setModal(null)
      load()
    }
  }

  async function handleDelete(p) {
    if (!confirm(`¿Eliminar a "${p.nombre}"? Se borrarán también sus pronósticos.`)) return
    const { error } = await supabase.from('participantes').delete().eq('id', p.id)
    if (error) {
      setToast({ message: 'Error al eliminar', type: 'error' })
    } else {
      setToast({ message: 'Participante eliminado', type: 'success' })
      load()
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Participantes</h1>
        <p className="page-subtitle">Gestiona quiénes forman parte de la polla</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><Users size={18} /> {participantes.length} participantes</span>
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={16} /> Agregar
          </button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Cargando...</span></div>
        ) : participantes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p className="empty-text">No hay participantes aún</p>
            <p className="empty-sub">Agrega el primero para comenzar</p>
          </div>
        ) : (
          <div className="list-cards">
            {participantes.map(p => (
              <div key={p.id} className="list-card">
                <div className="avatar avatar-lg" style={{ background: p.avatar_color }}>
                  {getInitials(p.nombre)}
                </div>
                <div className="list-card-main">
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.nombre}</div>
                  {p.email && (
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{p.email}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--gray-300)', marginTop: 2 }}>
                    Desde {new Date(p.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="list-card-actions">
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setModal(p)} title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p)} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal?.id ? 'Editar' : 'Nuevo'}
          initial={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
