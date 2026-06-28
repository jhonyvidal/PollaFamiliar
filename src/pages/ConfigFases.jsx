import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Settings, Save } from 'lucide-react'
import Toast from '../components/Toast'
import { FASES } from '../constants/phases'

export default function ConfigFases() {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('fases_puntos').select('*')
    const map = {}
    ;(data ?? []).forEach(fp => { map[fp.fase] = { puntos_exacto: fp.puntos_exacto, puntos_tendencia: fp.puntos_tendencia } })
    // Completar con defaults si alguna fase aún no existe en BD
    FASES.forEach(f => {
      if (!map[f.id]) map[f.id] = { puntos_exacto: 3, puntos_tendencia: 1 }
    })
    setConfig(map)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleChange(faseId, field, value) {
    const num = Math.max(0, parseInt(value) || 0)
    setConfig(c => ({ ...c, [faseId]: { ...c[faseId], [field]: num } }))
  }

  async function handleSave() {
    setSaving(true)
    const upserts = FASES.map(f => ({
      fase: f.id,
      label: f.label,
      puntos_exacto: config[f.id]?.puntos_exacto ?? 3,
      puntos_tendencia: config[f.id]?.puntos_tendencia ?? 1,
      orden: FASES.indexOf(f) + 1,
    }))
    const { error } = await supabase
      .from('fases_puntos')
      .upsert(upserts, { onConflict: 'fase' })
    setSaving(false)
    if (error) {
      setToast({ message: 'Error al guardar: ' + error.message, type: 'error' })
    } else {
      setToast({ message: 'Configuración guardada', type: 'success' })
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Configuración de fases</h1>
        <p className="page-subtitle">Define los puntos otorgados por fase del torneo</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><Settings size={16} /> Puntos por fase</span>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || loading}>
            <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Cargando...</span></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fase</th>
                  <th style={{ textAlign: 'center', width: 160 }}>Pts resultado exacto</th>
                  <th style={{ textAlign: 'center', width: 160 }}>Pts tendencia correcta</th>
                </tr>
              </thead>
              <tbody>
                {FASES.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.label}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        style={{ width: 80, textAlign: 'center', margin: '0 auto' }}
                        value={config[f.id]?.puntos_exacto ?? 3}
                        onChange={e => handleChange(f.id, 'puntos_exacto', e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        style={{ width: 80, textAlign: 'center', margin: '0 auto' }}
                        value={config[f.id]?.puntos_tendencia ?? 1}
                        onChange={e => handleChange(f.id, 'puntos_tendencia', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-body" style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>
          <strong>Resultado exacto:</strong> el pronóstico coincide gol a gol con el resultado real.<br />
          <strong>Tendencia correcta:</strong> el pronóstico no es exacto pero acierta quién gana o el empate.
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
