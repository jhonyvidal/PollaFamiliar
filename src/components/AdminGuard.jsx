import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function AdminGuard({ children }) {
  const { isAdmin, login } = useAuth()
  const [pin, setPin] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  if (isAdmin) return children

  function handleSubmit(e) {
    e.preventDefault()
    const ok = login(pin)
    if (!ok) {
      setError(true)
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh'
    }}>
      <div
        className="card"
        style={{
          width: '100%', maxWidth: 360, padding: '40px 32px',
          textAlign: 'center',
          animation: shake ? 'shake .4s ease' : 'none'
        }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--primary-light)', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Lock size={28} color="var(--primary)" />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 }}>
          Acceso restringido
        </h2>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 28 }}>
          Ingresa el PIN de administrador para continuar
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              type={show ? 'text' : 'password'}
              inputMode="numeric"
              value={pin}
              onChange={e => { setPin(e.target.value); setError(false) }}
              placeholder="PIN"
              autoFocus
              style={{
                textAlign: 'center', fontSize: 22, letterSpacing: 8,
                paddingRight: 44,
                borderColor: error ? 'var(--danger)' : undefined
              }}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)',
                display: 'flex', alignItems: 'center'
              }}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600, margin: '-8px 0 0' }}>
              PIN incorrecto, intenta de nuevo
            </p>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            <ShieldCheck size={16} /> Ingresar
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
