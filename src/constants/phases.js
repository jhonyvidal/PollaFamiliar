export const FASES = [
  { id: 'grupos', label: 'Fase de grupos' },
  { id: 'dieciseisavos', label: 'Dieciseisavos de final' },
  { id: 'octavos', label: 'Octavos de final' },
  { id: 'cuartos', label: 'Cuartos de final' },
  { id: 'semifinal', label: 'Semifinal' },
  { id: 'tercer_puesto', label: 'Tercer puesto' },
  { id: 'final', label: 'Final' },
]

export const FASE_LABEL = Object.fromEntries(FASES.map(f => [f.id, f.label]))
