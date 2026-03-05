import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import api from '../../services/api'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try { await api.post('/api/auth/forgot-password/', { email }); setSent(true) }
    catch (err) { setError(err.response?.data?.detail || 'Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'#06101F',padding:'1rem'}}>
      <div style={{width:'100%',maxWidth:'28rem'}}>
        <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
          <span style={{fontFamily:'Georgia,serif',fontSize:'2.5rem',color:'white'}}>AND<span style={{color:'#C9A84C'}}>Bank</span></span>
        </div>
        <div style={{backgroundColor:'#112240',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'1rem',padding:'2.5rem'}}>
          <div style={{width:'3.5rem',height:'3.5rem',borderRadius:'1rem',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1.5rem'}}>
            <Mail size={28} color="#C9A84C" />
          </div>
          {sent ? (
            <div style={{textAlign:'center'}}>
              <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',color:'white',marginBottom:'0.75rem'}}>Check your email</h2>
              <p style={{color:'#9ca3af',fontSize:'0.875rem',marginBottom:'1.5rem'}}>
                If <span style={{color:'#E4C57A'}}>{email}</span> is registered, you'll receive a reset OTP.
              </p>
              <Link to="/login" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',background:'linear-gradient(135deg,#C9A84C,#b08c32)',color:'#0A1628',fontWeight:700,padding:'0.875rem',borderRadius:'0.75rem',textDecoration:'none'}}>
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',color:'white',marginBottom:'0.5rem'}}>Forgot Password</h2>
              <p style={{color:'#9ca3af',fontSize:'0.875rem',marginBottom:'1.5rem'}}>Enter your registered email to receive a reset OTP.</p>
              {error && <div style={{marginBottom:'1rem',padding:'0.75rem',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'0.75rem',color:'#f87171',fontSize:'0.875rem'}}>{error}</div>}
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div>
                  <label style={{display:'block',fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#9ca3af',marginBottom:'0.5rem'}}>Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'0.75rem',padding:'0.875rem 1rem',color:'white',fontSize:'0.875rem',outline:'none',boxSizing:'border-box'}} />
                </div>
                <button type="submit" disabled={loading}
                  style={{background:'linear-gradient(135deg,#C9A84C,#b08c32)',color:'#0A1628',fontWeight:700,padding:'0.875rem',borderRadius:'0.75rem',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',opacity:loading?0.7:1}}>
                  {loading ? 'Sending...' : 'Send Reset OTP'}
                </button>
              </form>
              <Link to="/login" style={{display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.875rem',color:'#9ca3af',textDecoration:'none',marginTop:'1.5rem'}}>
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
