import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2, Calendar, CheckCircle, X, Clock } from 'lucide-react'
import Toast from '../components/Toast'
import { FASES, FASE_LABEL } from '../constants/phases'

function fmt(fecha) {
  return new Date(fecha).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function ModalPartido({ initial, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    equipo_local: initial?.equipo_local ?? '',
    equipo_visitante: initial?.equipo_visitante ?? '',
    fecha: initial?.fecha ? initial.fecha.slice(0, 16) : '',
    jornada: initial?.jornada ?? 1,
    fase: initial?.fase ?? '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.equipo_local.trim() || !form.equipo_visitante.trim() || !form.fecha || !form.fase) return
    onSave({
      equipo_local: form.equipo_local.trim(),
      equipo_visitante: form.equipo_visitante.trim(),
      fecha: new Date(form.fecha).toISOString(),
      jornada: Number(form.jornada),
      fase: form.fase,
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{initial ? 'Editar partido' : 'Nuevo partido'}</span>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Equipo local *</label>
                <input className="form-input" value={form.equipo_local} onChange={e => set('equipo_local', e.target.value)} placeholder="Ej. Colombia" required />
              </div>
              <div className="form-group">
                <label className="form-label">Equipo visitante *</label>
                <input className="form-input" value={form.equipo_visitante} onChange={e => set('equipo_visitante', e.target.value)} placeholder="Ej. Argentina" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha y hora *</label>
                <input className="form-input" type="datetime-local" value={form.fecha} onChange={e => set('fecha', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Jornada</label>
                <input className="form-input" type="number" min="1" value={form.jornada} onChange={e => set('jornada', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fase del partido *</label>
              <select className="form-select" value={form.fase} onChange={e => set('fase', e.target.value)} required>
                <option value="">— Seleccionar fase —</option>
                {FASES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear partido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalResultado({ partido, onClose, onSave, saving }) {
  const [gl, setGl] = useState(partido.goles_local ?? '')
  const [gv, setGv] = useState(partido.goles_visitante ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    if (gl === '' || gv === '') return
    onSave({ goles_local: Number(gl), goles_visitante: Number(gv), estado: 'finalizado' })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Ingresar resultado</span>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ color: 'var(--gray-500)', fontSize: 14, textAlign: 'center' }}>
              {partido.equipo_local} vs {partido.equipo_visitante}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>{partido.equipo_local}</div>
                <input
                  className="score-input"
                  type="number" min="0" max="99"
                  value={gl} onChange={e => setGl(e.target.value)}
                  required
                />
              </div>
              <span style={{ fontSize: 24, color: 'var(--gray-300)', fontWeight: 700 }}>-</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>{partido.equipo_visitante}</div>
                <input
                  className="score-input"
                  type="number" min="0" max="99"
                  value={gv} onChange={e => setGv(e.target.value)}
                  required
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
              Al confirmar, se calcularán automáticamente los puntos de todos los pronósticos.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? 'Guardando...' : <><CheckCircle size={15} /> Confirmar resultado</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Partidos() {
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [resultadoModal, setResultadoModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [jornada, setJornada] = useState('todas')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('partidos').select('*').order('fecha')
    setPartidos(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(values) {
    setSaving(true)
    let error
    if (modal?.id) {
      ;({ error } = await supabase.from('partidos').update(values).eq('id', modal.id))
    } else {
      ;({ error } = await supabase.from('partidos').insert({ ...values, estado: 'pendiente' }))
    }
    setSaving(false)
    if (error) {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    } else {
      setToast({ message: modal?.id ? 'Partido actualizado' : 'Partido creado', type: 'success' })
      setModal(null)
      load()
    }
  }

  async function handleResultado(values) {
    setSaving(true)
    const { error } = await supabase.from('partidos').update(values).eq('id', resultadoModal.id)
    setSaving(false)
    if (error) {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    } else {
      setToast({ message: 'Resultado registrado y puntos calculados ✓', type: 'success' })
      setResultadoModal(null)
      load()
    }
  }

  async function handleDelete(p) {
    if (!confirm(`¿Eliminar el partido ${p.equipo_local} vs ${p.equipo_visitante}?`)) return
    const { error } = await supabase.from('partidos').delete().eq('id', p.id)
    if (error) {
      setToast({ message: 'Error al eliminar', type: 'error' })
    } else {
      setToast({ message: 'Partido eliminado', type: 'success' })
      load()
    }
  }

  const jornadas = [...new Set(partidos.map(p => p.jornada))].sort((a, b) => a - b)
  const filtrados = jornada === 'todas' ? partidos : partidos.filter(p => p.jornada === Number(jornada))

  const pendientes = partidos.filter(p => p.estado === 'pendiente').length
  const finalizados = partidos.filter(p => p.estado === 'finalizado').length

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Partidos</h1>
        <p className="page-subtitle">Crea partidos y registra resultados para calcular puntos</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{partidos.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendientes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Finalizados</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{finalizados}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Jornadas</div>
          <div className="stat-value">{jornadas.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <span className="card-title"><Calendar size={16} /> Partidos</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            {jornadas.length > 0 && (
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
                value={jornada}
                onChange={e => setJornada(e.target.value)}
              >
                <option value="todas">Todas</option>
                {jornadas.map(j => <option key={j} value={j}>J{j}</option>)}
              </select>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}>
              <Plus size={14} /> Nuevo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Cargando...</span></div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚽</div>
            <p className="empty-text">No hay partidos</p>
            <p className="empty-sub">Crea el primer partido para comenzar</p>
          </div>
        ) : (
          <div className="list-cards">
            {filtrados.map(p => (
              <div key={p.id} className="list-card">
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Partido */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{p.equipo_local}</span>
                    {p.goles_local !== null ? (
                      <span style={{
                        background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                        borderRadius: 6, padding: '2px 10px', fontWeight: 800, fontSize: 15
                      }}>
                        {p.goles_local} - {p.goles_visitante}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--gray-300)', fontWeight: 700 }}>vs</span>
                    )}
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{p.equipo_visitante}</span>
                  </div>
                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>J{p.jornada}</span>
                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>·</span>
                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{fmt(p.fecha)}</span>
                    {p.fase && <>
                      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>·</span>
                      <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{FASE_LABEL[p.fase] ?? p.fase}</span>
                    </>}
                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>·</span>
                    {p.estado === 'finalizado'
                      ? <span className="badge badge-done" style={{ fontSize: 11 }}><CheckCircle size={10} /> Finalizado</span>
                      : <span className="badge badge-pending" style={{ fontSize: 11 }}><Clock size={10} /> Pendiente</span>
                    }
                  </div>
                </div>
                <div className="list-card-actions">
                  {p.estado === 'pendiente' && (
                    <button className="btn btn-success btn-sm btn-icon" onClick={() => setResultadoModal(p)} title="Ingresar resultado">
                      <CheckCircle size={14} />
                    </button>
                  )}
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
        <ModalPartido
          initial={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {resultadoModal && (
        <ModalResultado
          partido={resultadoModal}
          onClose={() => setResultadoModal(null)}
          onSave={handleResultado}
          saving={saving}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
