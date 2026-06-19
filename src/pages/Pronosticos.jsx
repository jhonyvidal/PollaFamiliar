import { useState, useEffect, useCallback } from 'react'
import { supabase, calcularPuntos } from '../lib/supabase'
import { Target, Save, CheckCircle, Clock } from 'lucide-react'
import Toast from '../components/Toast'

function getInitials(nombre) {
  return nombre.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function PtsIndicator({ pts }) {
  if (pts === null || pts === undefined) return <span className="pts-badge pts-null">-</span>
  if (pts === 3) return <span className="pts-badge pts-3">3</span>
  if (pts === 1) return <span className="pts-badge pts-1">1</span>
  return <span className="pts-badge pts-0">0</span>
}

export default function Pronosticos() {
  const [participantes, setParticipantes] = useState([])
  const [partidos, setPartidos] = useState([])
  const [pronosticos, setPronosticos] = useState([]) // {participante_id, partido_id, goles_local, goles_visitante, puntos}
  const [selectedPart, setSelectedPart] = useState('')
  const [draft, setDraft] = useState({}) // {partido_id: {gl, gv}}
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [jornadaFiltro, setJornadaFiltro] = useState('todas')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: parts }, { data: pars }, { data: prons }] = await Promise.all([
      supabase.from('participantes').select('*').order('nombre'),
      supabase.from('partidos').select('*').order('fecha'),
      supabase.from('pronosticos').select('*'),
    ])
    setParticipantes(parts ?? [])
    setPartidos(pars ?? [])
    setPronosticos(prons ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!selectedPart) { setDraft({}); return }
    const map = {}
    pronosticos
      .filter(p => p.participante_id === selectedPart)
      .forEach(p => { map[p.partido_id] = { gl: p.goles_local, gv: p.goles_visitante } })
    setDraft(map)
  }, [selectedPart, pronosticos])

  function setScore(partidoId, field, value) {
    const num = value === '' ? '' : Math.max(0, parseInt(value) || 0)
    setDraft(d => ({ ...d, [partidoId]: { ...d[partidoId], [field]: num } }))
  }

  async function handleSave() {
    if (!selectedPart) return
    setSaving(true)

    const upserts = Object.entries(draft)
      .filter(([, v]) => v.gl !== '' && v.gl !== undefined && v.gv !== '' && v.gv !== undefined)
      .map(([partidoId, v]) => ({
        participante_id: selectedPart,
        partido_id: partidoId,
        goles_local: Number(v.gl),
        goles_visitante: Number(v.gv),
      }))

    if (upserts.length === 0) { setSaving(false); return }

    const { error } = await supabase
      .from('pronosticos')
      .upsert(upserts, { onConflict: 'participante_id,partido_id' })

    setSaving(false)
    if (error) {
      setToast({ message: 'Error al guardar: ' + error.message, type: 'error' })
    } else {
      setToast({ message: `${upserts.length} pronóstico(s) guardados`, type: 'success' })
      load()
    }
  }

  const participanteActual = participantes.find(p => p.id === selectedPart)
  const jornadas = [...new Set(partidos.map(p => p.jornada))].sort((a, b) => a - b)
  const partidosFiltrados = jornadaFiltro === 'todas'
    ? partidos
    : partidos.filter(p => p.jornada === Number(jornadaFiltro))

  const totalPts = selectedPart
    ? pronosticos.filter(p => p.participante_id === selectedPart && p.puntos !== null).reduce((s, p) => s + p.puntos, 0)
    : 0

  const completados = selectedPart
    ? pronosticos.filter(p => p.participante_id === selectedPart).length
    : 0

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Pronósticos</h1>
        <p className="page-subtitle">Ingresa los pronósticos de cada participante</p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /><span>Cargando...</span></div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Fila 1: selects */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px' }}>
                  <label className="form-label" style={{ marginBottom: 4, display: 'block' }}>Participante</label>
                  <select
                    className="form-select"
                    value={selectedPart}
                    onChange={e => setSelectedPart(e.target.value)}
                  >
                    <option value="">— Seleccionar —</option>
                    {participantes.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                {jornadas.length > 1 && (
                  <div style={{ flex: '0 1 130px' }}>
                    <label className="form-label" style={{ marginBottom: 4, display: 'block' }}>Jornada</label>
                    <select
                      className="form-select"
                      value={jornadaFiltro}
                      onChange={e => setJornadaFiltro(e.target.value)}
                    >
                      <option value="todas">Todas</option>
                      {jornadas.map(j => <option key={j} value={j}>J{j}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Fila 2: stats + guardar (solo cuando hay selección) */}
              {selectedPart && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>Pronóst.</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-800)' }}>{completados}/{partidos.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase' }}>Puntos</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{totalPts}</div>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Guardando...' : <><Save size={15} /> Guardar</>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {!selectedPart ? (
            <div className="empty-state">
              <div className="empty-icon"><Target size={48} /></div>
              <p className="empty-text">Selecciona un participante para ver sus pronósticos</p>
            </div>
          ) : participanteActual && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div className="avatar" style={{ background: participanteActual.avatar_color }}>
                  {getInitials(participanteActual.nombre)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{participanteActual.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    Exactos: 3pts · Tendencia: 1pt · Error: 0pts
                  </div>
                </div>
              </div>

              {jornadas.filter(j => jornadaFiltro === 'todas' || j === Number(jornadaFiltro)).map(j => {
                const jornadaPartidos = partidosFiltrados.filter(p => p.jornada === j)
                if (jornadaPartidos.length === 0) return null
                return (
                  <div key={j} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
                      Jornada {j}
                    </div>
                    <div className="pron-grid">
                      {jornadaPartidos.map(partido => {
                        const pron = pronosticos.find(p => p.participante_id === selectedPart && p.partido_id === partido.id)
                        const draftVal = draft[partido.id] ?? {}
                        const finalizado = partido.estado === 'finalizado'
                        const ptsCalculados = finalizado && pron
                          ? calcularPuntos(partido.goles_local, partido.goles_visitante, pron.goles_local, pron.goles_visitante)
                          : null

                        return (
                          <div key={partido.id} className="pron-card" style={finalizado ? { opacity: .9 } : {}}>
                            <div className="pron-card-header">
                              <span>
                                {finalizado
                                  ? <><CheckCircle size={11} style={{ color: 'var(--success)', marginRight: 4 }} />Finalizado · {partido.goles_local}-{partido.goles_visitante}</>
                                  : <><Clock size={11} style={{ marginRight: 4 }} />{new Date(partido.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</>
                                }
                              </span>
                              <PtsIndicator pts={ptsCalculados} />
                            </div>
                            <div className="pron-card-body">
                              <span className="pron-team home">{partido.equipo_local}</span>
                              <div className="pron-inputs">
                                <input
                                  className="score-input"
                                  type="number" min="0" max="99"
                                  value={draftVal.gl ?? ''}
                                  onChange={e => setScore(partido.id, 'gl', e.target.value)}
                                  disabled={finalizado}
                                  style={{ fontSize: 16, width: 46 }}
                                  placeholder="?"
                                />
                                <span className="pron-vs">-</span>
                                <input
                                  className="score-input"
                                  type="number" min="0" max="99"
                                  value={draftVal.gv ?? ''}
                                  onChange={e => setScore(partido.id, 'gv', e.target.value)}
                                  disabled={finalizado}
                                  style={{ fontSize: 16, width: 46 }}
                                  placeholder="?"
                                />
                              </div>
                              <span className="pron-team away">{partido.equipo_visitante}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : <><Save size={15} /> Guardar pronósticos</>}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
