import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield } from 'lucide-react'
import api from '../../services/api'

export default function Login() {
  const [form,    setForm]    = useState({ identifier: '', password: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login/', form)
      sessionStorage.setItem('otp_user_id', res.data.user_id)
      sessionStorage.setItem('otp_email',   res.data.email)
      navigate('/verify-otp')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',backgroundColor:'#06101F'}}>
      {/* Left panel */}
      <div style={{flex:1,display:'none',background:'linear-gradient(135deg,#0A1628,#1a3a6b)',padding:'4rem',position:'relative',overflow:'hidden'}} className="lg-show">
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 30% 50%,rgba(201,168,76,0.1),transparent 60%)'}} />
        <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',height:'100%',justifyContent:'center'}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:'5rem',fontWeight:300,letterSpacing:'0.5rem',color:'white',lineHeight:1}}>
            AND<span style={{color:'#C9A84C',fontWeight:700}}>Bank</span>
          </div>
          <p style={{color:'#9ca3af',fontSize:'0.75rem',letterSpacing:'0.3rem',textTransform:'uppercase',marginTop:'1rem'}}>
            Private Banking · Wealth Management
          </p>
          <div style={{marginTop:'3rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
            {['RBI Regulated & DICGC Insured','Military-grade 256-bit encryption','Multi-factor authentication on every login'].map(f => (
              <div key={f} style={{display:'flex',alignItems:'center',gap:'0.75rem',fontSize:'0.875rem',color:'#9ca3af'}}>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',backgroundColor:'#C9A84C',flexShrink:0}} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{flex:1,maxWidth:'28rem',display:'flex',flexDirection:'column',justifyContent:'center',padding:'3rem',backgroundColor:'#112240'}}>
        <div style={{marginBottom:'2rem'}}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'2rem',fontWeight:600,color:'white',marginBottom:'0.5rem'}}>Welcome back</h2>
          <p style={{color:'#9ca3af',fontSize:'0.875rem'}}>Sign in to your AND Bank account</p>
        </div>

        {error && (
          <div style={{marginBottom:'1rem',padding:'0.75rem',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'0.75rem',color:'#f87171',fontSize:'0.875rem'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div>
            <label style={{display:'block',fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#9ca3af',marginBottom:'0.5rem'}}>
              Account Number / Email
            </label>
            <input
              style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'0.75rem',padding:'0.875rem 1rem',color:'white',fontSize:'0.875rem',outline:'none',boxSizing:'border-box'}}
              placeholder="AND123456789012 or email@example.com"
              value={form.identifier}
              onChange={e => setForm(p => ({...p, identifier: e.target.value}))}
              required
            />
          </div>

          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
              <label style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#9ca3af'}}>Password</label>
              <Link to="/forgot-password" style={{fontSize:'0.75rem',color:'#C9A84C',textDecoration:'none'}}>Forgot?</Link>
            </div>
            <div style={{position:'relative'}}>
              <input
                style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'0.75rem',padding:'0.875rem 3rem 0.875rem 1rem',color:'white',fontSize:'0.875rem',outline:'none',boxSizing:'border-box'}}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({...p, password: e.target.value}))}
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{position:'absolute',right:'1rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{width:'100%',background:'linear-gradient(135deg,#C9A84C,#b08c32)',color:'#0A1628',fontWeight:700,padding:'0.875rem',borderRadius:'0.75rem',border:'none',cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',fontSize:'0.9rem',marginTop:'0.5rem',opacity:loading?0.7:1}}>
            {loading
              ? <><div style={{width:'1rem',height:'1rem',border:'2px solid rgba(10,22,40,0.3)',borderTop:'2px solid #0A1628',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />Verifying...</>
              : <><Shield size={16} />Sign In Securely</>
            }
          </button>
        </form>

        <p style={{textAlign:'center',fontSize:'0.875rem',color:'#6b7280',marginTop:'2rem'}}>
          New to AND Bank?{' '}
          <Link to="/register" style={{color:'#C9A84C',textDecoration:'none',fontWeight:500}}>Open an account</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(min-width:1024px) { .lg-show { display:flex !important; } }
      `}</style>
    </div>
  )
}
