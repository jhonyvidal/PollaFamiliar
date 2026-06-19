import { useState, useEffect, useCallback } from 'react'
import { supabase, calcularPuntos } from '../lib/supabase'
import { BarChart2, CheckCircle, Clock } from 'lucide-react'

function getInitials(nombre) {
  return nombre.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function PtsCell({ puntos }) {
  if (puntos === null || puntos === undefined) return <span style={{ color: 'var(--gray-300)', fontWeight: 500 }}>—</span>
  const bg = puntos === 3 ? '#fef9c3' : puntos === 1 ? 'var(--primary-light)' : 'var(--danger-light)'
  const color = puntos === 3 ? '#854d0e' : puntos === 1 ? 'var(--primary-dark)' : 'var(--danger)'
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
  const [loading, setLoading] = useState(true)
  const [jornada, setJornada] = useState('todas')

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

  // Calcular puntos totales por participante
  const rankingMap = {}
  participantes.forEach(p => {
    let pts = 0, exactos = 0, tendencias = 0
    pronosticos
      .filter(pr => pr.participante_id === p.id)
      .forEach(pr => {
        const partido = partidos.find(pa => pa.id === pr.partido_id)
        if (!partido || partido.estado !== 'finalizado') return
        const puntos = calcularPuntos(partido.goles_local, partido.goles_visitante, pr.goles_local, pr.goles_visitante)
        pts += puntos
        if (puntos === 3) exactos++
        if (puntos === 1) tendencias++
      })
    rankingMap[p.id] = { pts, exactos, tendencias }
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
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {participantesOrdenados.slice(0, 3).map((p, i) => {
            const r = rankingMap[p.id]
            const medals = ['🥇', '🥈', '🥉']
            return (
              <div key={p.id} className="card" style={{
                flex: 1, minWidth: 160, padding: '20px 16px', textAlign: 'center',
                borderTop: `3px solid ${i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : '#f97316'}`
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{medals[i]}</div>
                <div className="avatar" style={{ background: p.avatar_color, margin: '0 auto 8px' }}>
                  {getInitials(p.nombre)}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.nombre}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>{r.pts}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>puntos</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filtro */}
      {jornadas.length > 1 && (
        <div style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
          <button
            className={`btn ${jornada === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setJornada('todas')}
          >
            Todas
          </button>
          {jornadas.map(j => (
            <button
              key={j}
              className={`btn ${jornada === String(j) ? 'btn-primary' : 'btn-secondary'}`}
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
                      const puntos = partido.estado === 'finalizado' && pron
                        ? calcularPuntos(partido.goles_local, partido.goles_visitante, pron.goles_local, pron.goles_visitante)
                        : null

                      return (
                        <td key={p.id} style={{ textAlign: 'center' }}>
                          {pron ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>
                                {pron.goles_local}-{pron.goles_visitante}
                              </span>
                              <PtsCell puntos={puntos} />
                            </div>
                          ) : (
                            <span style={{ color: 'var(--gray-200)', fontSize: 18 }}>—</span>
                          )}
                        </td>
                      )
                    })}
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
                      <span style={{
                        fontSize: 16, fontWeight: 800,
                        color: i === 0 ? '#854d0e' : 'var(--primary)'
                      }}>
                        {rankingMap[p.id]?.pts ?? 0}
                      </span>
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
