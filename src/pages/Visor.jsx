import { useState, useEffect, useCallback } from 'react'
import { supabase, calcularPuntos, calcularTipoResultado } from '../lib/supabase'
import { BarChart2, CheckCircle, Clock, Star } from 'lucide-react'

function getInitials(nombre) {
  return nombre.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function PtsCell({ puntos, tipo }) {
  if (puntos === null || puntos === undefined || tipo === null) return <span style={{ color: 'var(--gray-300)', fontWeight: 500 }}>—</span>
  const bg = tipo === 'exacto' ? '#fef9c3' : tipo === 'tendencia' ? 'var(--primary-light)' : 'var(--danger-light)'
  const color = tipo === 'exacto' ? '#854d0e' : tipo === 'tendencia' ? 'var(--primary-dark)' : 'var(--danger)'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: bg, color, borderRadius: '50%', width: 26, height: 26,
      fontSize: 11, fontWeight: 800
    }}>
      {puntos}
    </span>
  )
}

export default function Visor() {
  const [participantes, setParticipantes] = useState([])
  const [partidos, setPartidos] = useState([])
  const [pronosticos, setPronosticos] = useState([])
  const [eventosExtra, setEventosExtra] = useState([])
  const [faseConfig, setFaseConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [jornada, setJornada] = useState('todas')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: parts }, { data: pars }, { data: prons }, { data: evs }, { data: gans }, { data: fasesPts }] = await Promise.all([
      supabase.from('participantes').select('*').order('nombre'),
      supabase.from('partidos').select('*').order('fecha'),
      supabase.from('pronosticos').select('*'),
      supabase.from('eventos_extra').select('*').order('fecha'),
      supabase.from('evento_ganadores').select('evento_id, participante_id'),
      supabase.from('fases_puntos').select('*'),
    ])
    setParticipantes(parts ?? [])
    setPartidos(pars ?? [])
    setPronosticos(prons ?? [])
    setEventosExtra(
      (evs ?? []).map(ev => ({
        ...ev,
        ganadores: (gans ?? []).filter(g => g.evento_id === ev.id).map(g => g.participante_id),
      }))
    )
    const cfg = {}
    ;(fasesPts ?? []).forEach(fp => { cfg[fp.fase] = fp })
    setFaseConfig(cfg)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Calcular puntos totales por participante
  const rankingMap = {}
  participantes.forEach(p => {
    let pts = 0, exactos = 0, tendencias = 0
    pronosticos
      .filter(pr => pr.participante_id === p.id)
      .forEach(pr => {
        const partido = partidos.find(pa => pa.id === pr.partido_id)
        if (!partido || partido.estado !== 'finalizado') return
        const cfg = faseConfig[partido.fase] ?? { puntos_exacto: 3, puntos_tendencia: 1 }
        const tipo = calcularTipoResultado(partido.goles_local, partido.goles_visitante, pr.goles_local, pr.goles_visitante)
        if (tipo === null) return
        const puntos = calcularPuntos(partido.goles_local, partido.goles_visitante, pr.goles_local, pr.goles_visitante, cfg.puntos_exacto, cfg.puntos_tendencia)
        pts += puntos
        if (tipo === 'exacto') exactos++
        if (tipo === 'tendencia') tendencias++
      })
    const ptsExtra = eventosExtra
      .filter(ev => ev.ganadores.includes(p.id))
      .reduce((sum, ev) => sum + ev.puntos, 0)
    pts += ptsExtra
    rankingMap[p.id] = { pts, exactos, tendencias, ptsExtra }
  })

  const participantesOrdenados = [...participantes].sort((a, b) => {
    const ra = rankingMap[a.id] ?? { pts: 0 }
    const rb = rankingMap[b.id] ?? { pts: 0 }
    return rb.pts - ra.pts || rb.exactos - ra.exactos
  })

  const jornadas = [...new Set(partidos.map(p => p.jornada))].sort((a, b) => a - b)
  const partidosFiltrados = jornada === 'todas' ? partidos : partidos.filter(p => p.jornada === Number(jornada))

  function getPron(partId, parId) {
    return pronosticos.find(p => p.partido_id === parId && p.participante_id === partId)
  }

  if (loading) {
    return <div className="loading-center"><div className="spinner" /><span>Cargando...</span></div>
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Visor de puntajes</h1>
        <p className="page-subtitle">Comparación completa de pronósticos y resultados</p>
      </div>

      {/* Podio */}
      {participantesOrdenados.length >= 1 && (
        <div className="podio-grid" style={{ marginBottom: 20 }}>
          {participantesOrdenados.slice(0, 3).map((p, i) => {
            const r = rankingMap[p.id]
            const medals = ['🥇', '🥈', '🥉']
            const colors = ['#f59e0b', '#9ca3af', '#f97316']
            return (
              <div key={p.id} className="card" style={{
                padding: '16px 12px', textAlign: 'center',
                borderTop: `3px solid ${colors[i]}`
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{medals[i]}</div>
                <div className="avatar" style={{ background: p.avatar_color, margin: '0 auto 6px' }}>
                  {getInitials(p.nombre)}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.nombre}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>{r.pts}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>pts</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filtro jornadas */}
      {jornadas.length > 1 && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${jornada === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setJornada('todas')}
          >
            Todas
          </button>
          {jornadas.map(j => (
            <button
              key={j}
              className={`btn btn-sm ${jornada === String(j) ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setJornada(String(j))}
            >
              J{j}
            </button>
          ))}
        </div>
      )}

      {/* Tabla grande */}
      {participantes.length === 0 || partidos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><BarChart2 size={48} /></div>
          <p className="empty-text">No hay datos para mostrar</p>
          <p className="empty-sub">Agrega participantes y partidos primero</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--gray-50)', zIndex: 10, minWidth: 140 }}>
                    Partido
                  </th>
                  <th style={{ minWidth: 90, textAlign: 'center' }}>Resultado</th>
                  {participantesOrdenados.map((p, i) => (
                    <th key={p.id} style={{ textAlign: 'center', minWidth: 110 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div className="avatar avatar-sm" style={{ background: p.avatar_color }}>
                          {getInitials(p.nombre)}
                        </div>
                        <span style={{ fontSize: 11 }}>{p.nombre.split(' ')[0]}</span>
                        <span style={{
                          fontWeight: 800, color: i === 0 ? '#854d0e' : 'var(--gray-600)',
                          fontSize: 13
                        }}>
                          {rankingMap[p.id]?.pts ?? 0} pts
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partidosFiltrados.map(partido => (
                  <tr key={partido.id}>
                    <td style={{ position: 'sticky', left: 0, background: 'white', zIndex: 5, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {partido.estado === 'finalizado'
                          ? <CheckCircle size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
                          : <Clock size={12} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                        }
                        <span style={{ fontSize: 12 }}>
                          {partido.equipo_local} vs {partido.equipo_visitante}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                        J{partido.jornada} · {new Date(partido.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {partido.estado === 'finalizado' ? (
                        <span style={{ fontWeight: 800, fontSize: 15 }}>
                          {partido.goles_local}-{partido.goles_visitante}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gray-300)' }}>—</span>
                      )}
                    </td>
                    {participantesOrdenados.map(p => {
                      const pron = getPron(p.id, partido.id)
                      const cfg = faseConfig[partido.fase] ?? { puntos_exacto: 3, puntos_tendencia: 1 }
                      const tipo = partido.estado === 'finalizado' && pron
                        ? calcularTipoResultado(partido.goles_local, partido.goles_visitante, pron.goles_local, pron.goles_visitante)
                        : null
                      const puntos = tipo !== null
                        ? calcularPuntos(partido.goles_local, partido.goles_visitante, pron.goles_local, pron.goles_visitante, cfg.puntos_exacto, cfg.puntos_tendencia)
                        : null

                      return (
                        <td key={p.id} style={{ textAlign: 'center' }}>
                          {pron ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>
                                {pron.goles_local}-{pron.goles_visitante}
                              </span>
                              <PtsCell puntos={puntos} tipo={tipo} />
                            </div>
                          ) : (
                            <span style={{ color: 'var(--gray-200)', fontSize: 18 }}>—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {/* Filas de eventos extraoficiales (solo si no hay filtro de jornada) */}
                {jornada === 'todas' && eventosExtra.map(ev => (
                  <tr key={ev.id} style={{ background: '#fffbeb' }}>
                    <td style={{ position: 'sticky', left: 0, background: '#fffbeb', zIndex: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Star size={12} style={{ color: '#b45309', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{ev.nombre}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                        Extraoficial · {new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        background: '#fef9c3', color: '#b45309',
                        padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700
                      }}>
                        +{ev.puntos} pts
                      </span>
                    </td>
                    {participantesOrdenados.map(p => (
                      <td key={p.id} style={{ textAlign: 'center' }}>
                        {ev.ganadores.includes(p.id) ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: '#fef9c3', color: '#b45309', borderRadius: '50%',
                            width: 26, height: 26, fontSize: 13, fontWeight: 800
                          }}>
                            +{ev.puntos}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--gray-200)', fontSize: 18 }}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Fila de totales */}
                <tr style={{ background: 'var(--gray-50)', fontWeight: 700 }}>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--gray-50)', zIndex: 5 }}>
                    Total
                  </td>
                  <td />
                  {participantesOrdenados.map((p, i) => (
                    <td key={p.id} style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{
                          fontSize: 16, fontWeight: 800,
                          color: i === 0 ? '#854d0e' : 'var(--primary)'
                        }}>
                          {rankingMap[p.id]?.pts ?? 0}
                        </span>
                        {(rankingMap[p.id]?.ptsExtra ?? 0) > 0 && (
                          <span style={{ fontSize: 10, color: '#b45309', fontWeight: 600 }}>
                            ⭐+{rankingMap[p.id].ptsExtra}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
