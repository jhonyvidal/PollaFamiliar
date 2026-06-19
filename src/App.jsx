import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import AdminGuard from './components/AdminGuard'
import Dashboard from './pages/Dashboard'
import Participantes from './pages/Participantes'
import Partidos from './pages/Partidos'
import Pronosticos from './pages/Pronosticos'
import Visor from './pages/Visor'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="participantes" element={<AdminGuard><Participantes /></AdminGuard>} />
            <Route path="partidos" element={<AdminGuard><Partidos /></AdminGuard>} />
            <Route path="pronosticos" element={<Pronosticos />} />
            <Route path="visor" element={<Visor />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
