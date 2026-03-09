import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Key, CheckCircle, XCircle, Clock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import api from '../../services/api'
import { C, S } from '../../utils/styles'

const TOKEN_TTL = 60 // seconds

export default function ChangePassword() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()

  // Token / timer state
  const [valid,     setValid]     = useState(false)   // token is live
  const [expired,   setExpired]   = useState(false)
  const [timeLeft,  setTimeLeft]  = useState(TOKEN_TTL)

  // Form state
  const [current,   setCurrent]   = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState({ cur: false, new: false, con: false })
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  // ── Validate token on mount ──────────────────────────────────────
  useEffect(() => {
    const token = params.get('token')
    const ts    = params.get('ts')

    if (!token || !ts) {
      navigate('/profile')
      return
    }

    const issued = parseInt(ts, 10)
    const age    = Math.floor(Date.now() / 1000) - issued

    if (age >= TOKEN_TTL) {
      setExpired(true)
      return
    }

    setValid(true)
    setTimeLeft(TOKEN_TTL - age)
  }, [params, navigate])

  // ── Countdown timer ──────────────────────────────────────────────
  useEffect(() => {
    if (!valid || expired || done) return

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval)
          setValid(false)
          setExpired(true)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [valid, expired, done])

  // ── Submit ───────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    setError('')
    if (!current)             { setError('Enter your current password');      return }
    if (newPw.length < 8)     { setError('New password must be 8+ chars');    return }
    if (newPw !== confirm)    { setError('Passwords do not match');            return }
    if (newPw === current)    { setError('New password must differ from old'); return }

    setLoading(true)
    try {
      await api.post('/api/auth/change-password/', {
        current_password: current,
        new_password:     newPw,
        confirm_password: confirm,
      })
      setDone(true)
      setTimeout(() => navigate('/profile'), 3000)
    } catch (e) {
      setError(e.response?.data?.detail || e.response?.data?.error || 'Password change failed')
    } finally {
      setLoading(false)
    }
  }, [current, newPw, confirm, navigate])

  // ── Handle Enter key ─────────────────────────────────────────────
  const onKey = e => { if (e.key === 'Enter') submit() }

  // ── Timer colour ─────────────────────────────────────────────────
  const timerColor = timeLeft > 30 ? '#22c55e' : timeLeft > 10 ? '#f59e0b' : '#ef4444'
  const timerPct   = (timeLeft / TOKEN_TTL) * 100

  // ─────────────────────────────────────────────────────────────────
  // EXPIRED
  // ─────────────────────────────────────────────────────────────────
  if (expired) return (
    <div style={{ minHeight: '100vh', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ ...S.card, maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Clock size={40} color="#ef4444" />
        </div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', color: 'white', marginBottom: '0.75rem' }}>
          Link Expired
        </h2>
        <p style={{ color: C.muted, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          This password change link has expired. Links are only valid for {TOKEN_TTL} seconds for your security.
        </p>
        <button onClick={() => navigate('/profile')} style={{ ...S.btn, width: '100%' }}>
          Go Back & Try Again
        </button>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────
  // SUCCESS
  // ─────────────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight: '100vh', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ ...S.card, maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle size={40} color="#22c55e" />
        </div>
        <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', color: 'white', marginBottom: '0.75rem' }}>
          Password Changed!
        </h2>
        <p style={{ color: C.muted, fontSize: '0.875rem' }}>
          Your password has been updated successfully. Redirecting you back...
        </p>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────
  // MAIN FORM
  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ShieldCheck size={28} color={C.gold} />
          </div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.75rem', color: 'white', marginBottom: '0.5rem' }}>
            Change Password
          </h1>
          <p style={{ color: C.muted, fontSize: '0.875rem' }}>Secure your AND Bank account</p>
        </div>

        {/* Timer bar */}
        <div style={{ ...S.card, marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} color={timerColor} />
              <span style={{ fontSize: '0.75rem', color: timerColor, fontWeight: 600 }}>
                Session expires in
              </span>
            </div>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: timerColor, fontSize: '1rem' }}>
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: '999px', transition: 'width 1s linear, background 1s' }} />
          </div>
        </div>

        {/* Form card */}
        <div style={{ ...S.card, padding: '2rem' }}>
          {error && (
            <div style={{ marginBottom: '1.25rem', padding: '0.875rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.875rem' }}>
              <XCircle size={16} /> {error}
            </div>
          )}

          {/* Current Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Current Password</label>
            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
              <input
                type={showPw.cur ? 'text' : 'password'}
                value={current}
                onChange={e => setCurrent(e.target.value)}
                onKeyDown={onKey}
                placeholder="••••••••"
                style={{ ...S.input, paddingRight: '3rem' }}
              />
              <button onClick={() => setShowPw(p => ({ ...p, cur: !p.cur }))}
                style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}>
                {showPw.cur ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>New Password</label>
            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
              <input
                type={showPw.new ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                onKeyDown={onKey}
                placeholder="Min. 8 characters"
                style={{ ...S.input, paddingRight: '3rem' }}
              />
              <button onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}>
                {showPw.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password strength */}
            {newPw && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                {[
                  newPw.length >= 8,
                  /[A-Z]/.test(newPw),
                  /[0-9]/.test(newPw),
                  /[^A-Za-z0-9]/.test(newPw),
                ].map((ok, i) => (
                  <div key={i} style={{ flex: 1, height: '3px', borderRadius: '999px', background: ok ? '#22c55e' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                ))}
              </div>
            )}
            {newPw && (
              <p style={{ fontSize: '0.7rem', color: C.muted, marginTop: '0.35rem' }}>
                {[newPw.length >= 8, /[A-Z]/.test(newPw), /[0-9]/.test(newPw), /[^A-Za-z0-9]/.test(newPw)].filter(Boolean).length} / 4 — 8+ chars, uppercase, number, special char
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={S.label}>Confirm New Password</label>
            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
              <input
                type={showPw.con ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={onKey}
                placeholder="••••••••"
                style={{ ...S.input, paddingRight: '3rem', borderColor: confirm && confirm !== newPw ? 'rgba(239,68,68,0.5)' : confirm && confirm === newPw ? 'rgba(34,197,94,0.5)' : undefined }}
              />
              <button onClick={() => setShowPw(p => ({ ...p, con: !p.con }))}
                style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}>
                {showPw.con ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirm && confirm !== newPw && (
              <p style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '0.35rem' }}>Passwords don't match</p>
            )}
            {confirm && confirm === newPw && (
              <p style={{ fontSize: '0.7rem', color: '#22c55e', marginTop: '0.35rem' }}>✓ Passwords match</p>
            )}
          </div>

          <button
            onClick={submit}
            disabled={loading || expired}
            style={{ ...S.btn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            <Key size={16} />
            {loading ? 'Updating...' : 'Update Password'}
          </button>

          <button onClick={() => navigate('/profile')}
            style={{ marginTop: '0.75rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: '0.875rem', padding: '0.5rem' }}>
            ← Back to Profile
          </button>
        </div>
      </div>
    </div>
  )
}