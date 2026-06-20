import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, Star, X, Calendar } from 'lucide-react'
import Toast from '../components/Toast'

function getInitials(nombre) {
  return nombre.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function Modal({ onClose, onSave, saving, initial, participantes }) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [puntos, setPuntos] = useState(initial?.puntos ?? 1)
  const [fecha, setFecha] = useState(initial?.fecha ?? new Date().toISOString().split('T')[0])
  const [ganadores, setGanadores] = useState(initial?.ganadores ?? [])

  function toggleGanador(id) {
    setGanadores(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim() || ganadores.length === 0) return
    onSave({ nombre: nombre.trim(), puntos: Number(puntos), fecha, ganadores })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{initial ? 'Editar evento' : 'Nuevo evento extraoficial'}</span>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre del evento *</label>
              <input
                className="form-input"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Mejor comentarista, Reto especial..."
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input
                  className="form-input"
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Puntos a ganar *</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={100}
                  value={puntos}
                  onChange={e => setPuntos(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                Ganadores *{' '}
                <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>(selecciona uno o más)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {participantes.map(p => (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8,
                      border: `2px solid ${ganadores.includes(p.id) ? 'var(--primary)' : 'var(--gray-200)'}`,
                      background: ganadores.includes(p.id) ? 'var(--primary-light)' : 'white',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={ganadores.includes(p.id)}
                      onChange={() => toggleGanador(p.id)}
                      style={{ display: 'none' }}
                    />
                    <div className="avatar avatar-sm" style={{ background: p.avatar_color }}>
                      {getInitials(p.nombre)}
                    </div>
                    <span style={{ fontWeight: ganadores.includes(p.id) ? 700 : 400, fontSize: 14 }}>
                      {p.nombre}
                    </span>
                    {ganadores.includes(p.id) && (
                      <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 700 }}>✓</span>
                    )}
                  </label>
                ))}
              </div>
              {ganadores.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>
                  Selecciona al menos un ganador
                </p>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !nombre.trim() || ganadores.length === 0}
            >
              {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EventosExtra() {
  const [eventos, setEventos] = useState([])
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: evs }, { data: parts }, { data: gans }] = await Promise.all([
      supabase.from('eventos_extra').select('*').order('fecha', { ascending: false }),
      supabase.from('participantes').select('*').order('nombre'),
      supabase.from('evento_ganadores').select('evento_id, participante_id'),
    ])
    const eventosConGanadores = (evs ?? []).map(ev => ({
      ...ev,
      ganadores: (gans ?? []).filter(g => g.evento_id === ev.id).map(g => g.participante_id),
    }))
    setEventos(eventosConGanadores)
    setParticipantes(parts ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave({ nombre, puntos, fecha, ganadores }) {
    setSaving(true)
    try {
      let eventoId
      if (modal?.id) {
        const { error } = await supabase
          .from('eventos_extra')
          .update({ nombre, puntos, fecha })
          .eq('id', modal.id)
        if (error) throw error
        eventoId = modal.id
        await supabase.from('evento_ganadores').delete().eq('evento_id', eventoId)
      } else {
        const { data, error } = await supabase
          .from('eventos_extra')
          .insert({ nombre, puntos, fecha })
          .select()
          .single()
        if (error) throw error
        eventoId = data.id
      }
      const { error: errGan } = await supabase.from('evento_ganadores').insert(
        ganadores.map(pid => ({ evento_id: eventoId, participante_id: pid }))
      )
      if (errGan) throw errGan
      setToast({ message: modal?.id ? 'Evento actualizado' : 'Evento creado', type: 'success' })
      setModal(null)
      load()
    } catch (err) {
      setToast({ message: 'Error: ' + err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(ev) {
    if (!confirm(`¿Eliminar el evento "${ev.nombre}"?`)) return
    const { error } = await supabase.from('eventos_extra').delete().eq('id', ev.id)
    if (error) {
      setToast({ message: 'Error al eliminar', type: 'error' })
    } else {
      setToast({ message: 'Evento eliminado', type: 'success' })
      load()
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Eventos Extraoficiales</h1>
        <p className="page-subtitle">Puntos especiales fuera de los partidos</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><Star size={18} /> {eventos.length} evento{eventos.length !== 1 ? 's' : ''}</span>
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={16} /> Nuevo evento
          </button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Cargando...</span></div>
        ) : eventos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⭐</div>
            <p className="empty-text">No hay eventos extraoficiales</p>
            <p className="empty-sub">Crea el primero para otorgar puntos especiales</p>
          </div>
        ) : (
          <div className="list-cards">
            {eventos.map(ev => {
              const winners = participantes.filter(p => ev.ganadores.includes(p.id))
              return (
                <div key={ev.id} className="list-card">
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: '#fef9c3',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0
                  }}>
                    ⭐
                  </div>
                  <div className="list-card-main">
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{ev.nombre}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'var(--primary-light)', color: 'var(--primary-dark)',
                        padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700
                      }}>
                        +{ev.puntos} pt{ev.puntos !== 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} />
                        {new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                    {winners.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {winners.map(p => (
                          <div key={p.id} style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                            borderRadius: 20, padding: '3px 10px 3px 4px'
                          }}>
                            <div style={{
                              background: p.avatar_color, width: 20, height: 20, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 8, fontWeight: 700, color: 'white', flexShrink: 0
                            }}>
                              {getInitials(p.nombre)}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{p.nombre.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="list-card-actions">
                    <button
                      className="btn btn-secondary btn-sm btn-icon"
                      onClick={() => setModal(ev)}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={() => handleDelete(ev)}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <Modal
          initial={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
          participantes={participantes}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
