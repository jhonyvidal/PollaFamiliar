import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Devuelve 'exacto', 'tendencia', 'error' o null si faltan datos
export function calcularTipoResultado(golesLocalReal, golesVisitanteReal, golesLocalPron, golesVisitantePron) {
  if (golesLocalReal === null || golesVisitanteReal === null) return null
  if (golesLocalPron === null || golesVisitantePron === null) return null

  if (golesLocalReal === golesLocalPron && golesVisitanteReal === golesVisitantePron) return 'exacto'

  const resultadoReal = golesLocalReal > golesVisitanteReal ? 'G' : golesLocalReal === golesVisitanteReal ? 'E' : 'P'
  const resultadoPron = golesLocalPron > golesVisitantePron ? 'G' : golesLocalPron === golesVisitantePron ? 'E' : 'P'

  return resultadoReal === resultadoPron ? 'tendencia' : 'error'
}

// puntosExacto y puntosTendencia son opcionales (por defecto 3 y 1 para compatibilidad)
export function calcularPuntos(golesLocalReal, golesVisitanteReal, golesLocalPron, golesVisitantePron, puntosExacto = 3, puntosTendencia = 1) {
  const tipo = calcularTipoResultado(golesLocalReal, golesVisitanteReal, golesLocalPron, golesVisitantePron)
  if (tipo === null) return null
  if (tipo === 'exacto') return puntosExacto
  if (tipo === 'tendencia') return puntosTendencia
  return 0
}

export function getResultadoTexto(golesLocal, golesVisitante) {
  if (golesLocal === null || golesVisitante === null) return null
  if (golesLocal > golesVisitante) return 'local'
  if (golesLocal === golesVisitante) return 'empate'
  return 'visitante'
}
