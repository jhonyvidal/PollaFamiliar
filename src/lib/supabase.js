import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helpers de puntuación (también en frontend para mostrar sin esperar trigger)
export function calcularPuntos(golesLocalReal, golesVisitanteReal, golesLocalPron, golesVisitantePron) {
  if (golesLocalReal === null || golesVisitanteReal === null) return null
  if (golesLocalPron === null || golesVisitantePron === null) return null

  if (golesLocalReal === golesLocalPron && golesVisitanteReal === golesVisitantePron) return 3

  const resultadoReal = golesLocalReal > golesVisitanteReal ? 'G' : golesLocalReal === golesVisitanteReal ? 'E' : 'P'
  const resultadoPron = golesLocalPron > golesVisitantePron ? 'G' : golesLocalPron === golesVisitantePron ? 'E' : 'P'

  return resultadoReal === resultadoPron ? 1 : 0
}

export function getResultadoTexto(golesLocal, golesVisitante) {
  if (golesLocal === null || golesVisitante === null) return null
  if (golesLocal > golesVisitante) return 'local'
  if (golesLocal === golesVisitante) return 'empate'
  return 'visitante'
}
