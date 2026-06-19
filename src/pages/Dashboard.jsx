import { useState, useEffect, useCallback } from 'react'
import { supabase, calcularPuntos } from '../lib/supabase'
import { Trophy, Medal } from 'lucide-react'
import { Link } from 'react-router-dom'

function getInitials(nombre) {
  return nombre.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function RankBadge({ pos }) {
  const cls = pos === 1 ? 'rank-1' : pos === 2 ? 'rank-2' : pos === 3 ? 'rank-3' : 'rank-other'
  return <div className={`rank-pos ${cls}`}>{pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos}</div>
}

export default function Dashboard() {
  const [ranking, setRanking] = useState([])
  const [stats, setStats] = useState({ partidos: 0, finalizados: 0, participantes: 0, pronosticos: 0 })
  const [loading, setLoading] = useState(true)
  const [ultimosPartidos, setUltimosPartidos] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: parts }, { data: partidos }, { data: prons }] = await Promise.all([
      supabase.from('participantes').select('*'),
      supabase.from('partidos').select('*').order('fecha', { ascending: false }),
      supabase.from('pronosticos').select('*'),
    ])

    const participantes = parts ?? []
    const todosPartidos = partidos ?? []
    const todosProns = prons ?? []

    // Calcular ranking
    const rank = participantes.map(p => {
      const misProns = todosProns.filter(pr => pr.participante_id === p.id)
      let pts = 0, exactos = 0, tendencias = 0, errores = 0

      misProns.forEach(pr => {
        const partido = todosPartidos.find(pa => pa.id === pr.partido_id)
        if (!partido || partido.estado !== 'finalizado') return
        const puntos = calcularPuntos(partido.goles_local, partido.goles_visitante, pr.goles_local, pr.goles_visitante)
        pts += puntos
        if (puntos === 3) exactos++
        else if (puntos === 1) tendencias++
        else errores++
      })

      return { ...p, pts, exactos, tendencias, errores, pronTotal: misProns.length }
    }).sort((a, b) => b.pts - a.pts || b.exactos - a.exactos)

    setRanking(rank)
    setUltimosPartidos(todosPartidos.filter(p => p.estado === 'finalizado').slice(0, 5))
    setStats({
      partidos: todosPartidos.length,
      finalizados: todosPartidos.filter(p => p.estado === 'finalizado').length,
      participantes: participantes.length,
      pronosticos: todosProns.length,
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="loading-center"><div className="spinner" /><span>Cargando...</span></div>
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">⚽ Polla Familia Vidal</h1>
        <p className="page-subtitle">Tabla de posiciones en tiempo real</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Participantes</div>
          <div className="stat-value">{stats.participantes}</div>
          <div className="stat-sub"><Link to="/participantes" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Ver todos →</Link></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Partidos jugados</div>
          <div className="stat-value">{stats.finalizados}</div>
          <div className="stat-sub">de {stats.partidos} programados</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pronósticos</div>
          <div className="stat-value">{stats.pronosticos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Líder</div>
          <div className="stat-value" style={{ fontSize: 18, marginTop: 8 }}>
            {ranking[0] ? ranking[0].nombre.split(' ')[0] : '—'}
          </div>
          <div className="stat-sub">{ranking[0] ? `${ranking[0].pts} pts` : ''}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Trophy size={18} /> Tabla de posiciones</span>
          </div>
          {ranking.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <p className="empty-text">Aún no hay datos suficientes</p>
              <p className="empty-sub">Agrega participantes, crea partidos e ingresa pronósticos</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Participante</th>
                    <th style={{ textAlign: 'center' }}>Pts</th>
                    <th style={{ textAlign: 'center' }}>⭐ Exactos</th>
                    <th style={{ textAlign: 'center' }}>✓ Tendencia</th>
                    <th style={{ textAlign: 'center' }}>✗ Error</th>
                    <th style={{ textAlign: 'center' }}>Pronóst.</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((p, i) => (
                    <tr key={p.id} style={i === 0 ? { background: '#fffbeb' } : {}}>
                      <td><RankBadge pos={i + 1} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ background: p.avatar_color }}>{getInitials(p.nombre)}</div>
                          <strong style={{ fontSize: 15 }}>{p.nombre}</strong>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: 18, color: i === 0 ? '#854d0e' : 'var(--gray-800)' }}>
                          {p.pts}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', color: '#854d0e', fontWeight: 700 }}>{p.exactos}</td>
                      <td style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 600 }}>{p.tendencias}</td>
                      <td style={{ textAlign: 'center', color: 'var(--danger)', fontWeight: 600 }}>{p.errores}</td>
                      <td style={{ textAlign: 'center', color: 'var(--gray-400)' }}>{p.pronTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {ultimosPartidos.length > 0 && (
          <div className="card" style={{ minWidth: 260 }}>
            <div className="card-header">
              <span className="card-title">Últimos resultados</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ultimosPartidos.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--gray-100)',
                  gap: 12
                }}>
                  <div style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{p.equipo_local}</div>
                  <div style={{
                    background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                    borderRadius: 6, padding: '4px 10px', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap'
                  }}>
                    {p.goles_local} - {p.goles_visitante}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.equipo_visitante}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
