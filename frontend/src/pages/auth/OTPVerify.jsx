import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, RefreshCw } from 'lucide-react'
import api from '../../services/api'

export default function OTPVerify() {
  const [otp,       setOtp]      = useState(['','','','','',''])
  const [loading,   setLoading]  = useState(false)
  const [resending, setResending]= useState(false)
  const [error,     setError]    = useState('')
  const [countdown, setCountdown]= useState(60)
  const refs    = useRef([])
  const navigate = useNavigate()

  const userId = sessionStorage.getItem('otp_user_id')
  const email  = sessionStorage.getItem('otp_email')

  useEffect(() => { if (!userId) navigate('/login') }, [userId, navigate])
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next)
    if (val && idx < 5) refs.current[idx + 1]?.focus()
  }
  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('Enter the 6-digit OTP'); return }
    setError(''); setLoading(true)
    try {
      const res = await api.post('/api/auth/verify-otp/', { user_id: userId, otp: code })
      const { access, refresh, user } = res.data
      sessionStorage.setItem('access_token',  access)
      sessionStorage.setItem('refresh_token', refresh)
      sessionStorage.setItem('user',          JSON.stringify(user))
      sessionStorage.removeItem('otp_user_id')
      sessionStorage.removeItem('otp_email')
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP')
      setOtp(['','','','','',''])
      refs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await api.post('/api/auth/resend-otp/', { user_id: userId })
      setCountdown(60); setOtp(['','','','','',''])
    } catch { setError('Could not resend OTP') }
    finally { setResending(false) }
  }

  const masked = email ? email.replace(/(.{2}).+(@.+)/, '$1****$2') : '****'
  const s = { box:{backgroundColor:'#112240',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'1rem',padding:'2.5rem',textAlign:'center'} }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'#06101F',padding:'1rem'}}>
      <div style={{width:'100%',maxWidth:'28rem'}}>
        <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
          <span style={{fontFamily:'Georgia,serif',fontSize:'2.5rem',color:'white'}}>AND<span style={{color:'#C9A84C'}}>Bank</span></span>
        </div>
        <div style={s.box}>
          <div style={{width:'4rem',height:'4rem',borderRadius:'1rem',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.5rem'}}>
            <Shield size={32} color="#C9A84C" />
          </div>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',color:'white',marginBottom:'0.5rem'}}>Verify Identity</h2>
          <p style={{color:'#9ca3af',fontSize:'0.875rem',marginBottom:'0.25rem'}}>OTP sent to</p>
          <p style={{color:'#E4C57A',fontWeight:500,fontSize:'0.875rem',marginBottom:'2rem'}}>{masked}</p>

          {error && <div style={{marginBottom:'1rem',padding:'0.75rem',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'0.75rem',color:'#f87171',fontSize:'0.875rem'}}>{error}</div>}

          <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',marginBottom:'2rem'}}>
            {otp.map((d, i) => (
              <input key={i} ref={el => refs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleChange(e.target.value, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                autoFocus={i === 0}
                style={{width:'3.5rem',height:'3.5rem',textAlign:'center',fontSize:'1.25rem',fontWeight:700,background:d?'rgba(201,168,76,0.05)':'rgba(255,255,255,0.05)',border:d?'1px solid rgba(201,168,76,0.6)':'1px solid rgba(255,255,255,0.1)',borderRadius:'0.75rem',color:'white',outline:'none'}}
              />
            ))}
          </div>

          <button onClick={handleVerify} disabled={loading}
            style={{width:'100%',background:'linear-gradient(135deg,#C9A84C,#b08c32)',color:'#0A1628',fontWeight:700,padding:'0.875rem',borderRadius:'0.75rem',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',marginBottom:'1rem',opacity:loading?0.7:1}}>
            {loading ? <><div style={{width:'1rem',height:'1rem',border:'2px solid rgba(10,22,40,0.3)',borderTop:'2px solid #0A1628',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />Verifying...</> : 'Verify OTP'}
          </button>

          <div style={{textAlign:'center'}}>
            {countdown > 0
              ? <p style={{fontSize:'0.75rem',color:'#6b7280'}}>Resend in <span style={{color:'#C9A84C'}}>{countdown}s</span></p>
              : <button onClick={handleResend} disabled={resending}
                  style={{background:'none',border:'none',cursor:'pointer',color:'#C9A84C',fontSize:'0.75rem',display:'flex',alignItems:'center',gap:'0.5rem',margin:'0 auto'}}>
                  <RefreshCw size={14} style={resending?{animation:'spin 0.8s linear infinite'}:{}} />
                  {resending ? 'Sending...' : 'Resend OTP'}
                </button>
            }
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
