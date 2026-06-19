import { NavLink, Outlet } from 'react-router-dom'
import { Trophy, Users, Calendar, Target, BarChart2, Lock, LockOpen, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { isAdmin, logout } = useAuth()

  return (
    <>
      <nav className="topbar">
        <NavLink to="/" className="topbar-brand">
          <div className="brand-icon">⚽</div>
          <span>Polla Familia Vidal</span>
        </NavLink>

        <div className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Trophy size={16} />
            <span className="nav-label">Ranking</span>
          </NavLink>

          {/* Solo visibles para admin */}
          <NavLink to="/participantes" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Users size={16} />
            <span className="nav-label">Participantes</span>
            {!isAdmin && <Lock size={11} style={{ color: 'var(--gray-400)', marginLeft: 2 }} />}
          </NavLink>

          <NavLink to="/partidos" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Calendar size={16} />
            <span className="nav-label">Partidos</span>
            {!isAdmin && <Lock size={11} style={{ color: 'var(--gray-400)', marginLeft: 2 }} />}
          </NavLink>

          <NavLink to="/pronosticos" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Target size={16} />
            <span className="nav-label">Pronósticos</span>
          </NavLink>

          <NavLink to="/visor" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <BarChart2 size={16} />
            <span className="nav-label">Visor</span>
          </NavLink>

          {/* Indicador de sesión admin */}
          <div style={{ width: 1, background: 'var(--gray-200)', height: 24, margin: '0 4px' }} />

          {isAdmin ? (
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Cerrar sesión de administrador"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LockOpen size={14} style={{ color: 'var(--success)' }} />
              <span className="nav-label">Admin</span>
              <LogOut size={13} />
            </button>
          ) : (
            <NavLink
              to="/participantes"
              className="nav-link"
              title="Acceso administrador"
              style={{ color: 'var(--gray-400)' }}
            >
              <Lock size={15} />
              <span className="nav-label" style={{ fontSize: 12 }}>Admin</span>
            </NavLink>
          )}
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </>
  )
}
