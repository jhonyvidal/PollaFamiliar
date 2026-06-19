import { NavLink, Outlet } from 'react-router-dom'
import { Trophy, Users, Calendar, Target, BarChart2, Lock, LockOpen, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { isAdmin, logout } = useAuth()

  return (
    <>
      {/* ── Top bar ── */}
      <nav className="topbar">
        <NavLink to="/" className="topbar-brand">
          <div className="brand-icon">⚽</div>
          <span className="brand-text">Polla Familia Vidal</span>
        </NavLink>

        {/* Desktop nav */}
        <div className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Trophy size={15} />
            Ranking
          </NavLink>
          <NavLink to="/participantes" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Users size={15} />
            Participantes
            {!isAdmin && <Lock size={10} style={{ color: 'var(--gray-400)', marginLeft: 1 }} />}
          </NavLink>
          <NavLink to="/partidos" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Calendar size={15} />
            Partidos
            {!isAdmin && <Lock size={10} style={{ color: 'var(--gray-400)', marginLeft: 1 }} />}
          </NavLink>
          <NavLink to="/pronosticos" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Target size={15} />
            Pronósticos
          </NavLink>
          <NavLink to="/visor" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <BarChart2 size={15} />
            Visor
          </NavLink>

          <div style={{ width: 1, background: 'var(--gray-200)', height: 22, margin: '0 6px' }} />

          {isAdmin ? (
            <button
              onClick={logout}
              className="admin-btn active"
              title="Cerrar sesión de administrador"
            >
              <LockOpen size={13} />
              Admin
              <LogOut size={12} />
            </button>
          ) : (
            <NavLink to="/participantes" className="admin-btn" title="Acceso administrador" style={{ textDecoration: 'none' }}>
              <Lock size={13} />
              Admin
            </NavLink>
          )}
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Bottom nav (mobile only) ── */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <NavLink to="/" end className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
            <span className="bnl-icon"><Trophy size={20} /></span>
            Ranking
          </NavLink>

          <NavLink to="/participantes" className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
            <span className="bnl-icon">
              <Users size={20} />
              {!isAdmin && <span className="lock-dot" />}
            </span>
            Participantes
          </NavLink>

          <NavLink to="/partidos" className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
            <span className="bnl-icon">
              <Calendar size={20} />
              {!isAdmin && <span className="lock-dot" />}
            </span>
            Partidos
          </NavLink>

          <NavLink to="/pronosticos" className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
            <span className="bnl-icon"><Target size={20} /></span>
            Pronóst.
          </NavLink>

          <NavLink to="/visor" className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
            <span className="bnl-icon"><BarChart2 size={20} /></span>
            Visor
          </NavLink>
        </div>
      </nav>
    </>
  )
}
