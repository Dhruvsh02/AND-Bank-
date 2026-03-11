import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, MapPin, Shield, CheckCircle, Eye, EyeOff } from 'lucide-react'
import api from '../../services/api'

const STEPS = ['Personal Info', 'KYC Details', 'Account Setup', 'Security']
const S = {
  bg: { minHeight:'100vh', backgroundColor:'#06101F', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' },
  wrap: { width:'100%', maxWidth:'32rem' },
  card: { backgroundColor:'#112240', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'1rem', padding:'2.5rem' },
  label: { display:'block', fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#9ca3af', marginBottom:'0.5rem' },
  input: { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.75rem', padding:'0.875rem 1rem', color:'white', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' },
  btn: { width:'100%', background:'linear-gradient(135deg,#C9A84C,#b08c32)', color:'#0A1628', fontWeight:700, padding:'0.875rem', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.9rem' },
  btnSecondary: { width:'100%', background:'rgba(255,255,255,0.05)', color:'white', fontWeight:600, padding:'0.875rem', borderRadius:'0.75rem', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontSize:'0.9rem' },
  row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },
  err: { marginBottom:'1rem', padding:'0.75rem', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'0.75rem', color:'#f87171', fontSize:'0.875rem' },
}

export default function Register() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()
  const submitting = useRef(false)

  const [form, setForm] = useState({
    first_name:'', last_name:'', email:'', phone:'', date_of_birth:'',
    address:'', pan_number:'', aadhar_number:'',
    account_type:'savings', otp_channel:'email',
    password:'', confirm_password:'',
  })

  const set = (k, v) => setForm(p => ({...p, [k]: v}))
  const inp = (k, extra={}) => (
    <input style={S.input} value={form[k]} onChange={e => set(k, e.target.value)} {...extra} />
  )

  const pwStrength = (pw) => {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }
  const strength = pwStrength(form.password)
  const strengthColor = ['#ef4444','#f97316','#eab308','#22c55e'][strength - 1] || '#374151'
  const strengthLabel = ['','Weak','Fair','Good','Strong'][strength] || ''

  const validateStep = () => {
    if (step === 0) {
      if (!form.first_name || !form.last_name) return 'Enter your full name'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email'
      if (!/^[6-9]\d{9}$/.test(form.phone)) return 'Enter a valid 10-digit Indian mobile number'
      if (!form.date_of_birth) return 'Enter your date of birth'
      const age = (Date.now() - new Date(form.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25)
      if (age < 18) return 'You must be at least 18 years old'
    }
    if (step === 1) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan_number.toUpperCase())) return 'Enter a valid PAN (e.g. ABCDE1234F)'
      if (!/^\d{12}$/.test(form.aadhar_number)) return 'Aadhar must be 12 digits'
      if (!form.address || form.address.trim().length < 10) return 'Address must be at least 10 characters'
    }
    if (step === 3) {
      if (form.password.length < 8) return 'Password must be at least 8 characters'
      if (strength < 3) return 'Password is too weak — add uppercase, numbers, symbols'
      if (form.password !== form.confirm_password) return 'Passwords do not match'
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    if (step < 3) setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (submitting.current) return
    const err = validateStep()
    if (err) { setError(err); return }
    submitting.current = true
    setError(''); setLoading(true)
    try {
      const res = await api.post('/api/auth/register/', {
        ...form,
        pan_number: form.pan_number.toUpperCase(),
      })
      sessionStorage.setItem('otp_user_id', res.data.user_id)
      sessionStorage.setItem('otp_email',   form.email)
      navigate('/verify-otp')
    } catch (err) {
      const data = err.response?.data
      if (typeof data === 'object') {
        const msgs = Object.values(data).flat()
        setError(msgs[0] || 'Registration failed')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally { setLoading(false); submitting.current = false }
  }

  const icons = [User, MapPin, Shield, CheckCircle]

  return (
    <div style={S.bg}>
      <div style={S.wrap}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <span style={{fontFamily:'Georgia,serif',fontSize:'2.5rem',color:'white'}}>AND<span style={{color:'#C9A84C'}}>Bank</span></span>
        </div>

        {/* Step indicators */}
        <div style={{display:'flex',alignItems:'center',marginBottom:'2rem'}}>
          {STEPS.map((s, i) => {
            const Icon = icons[i]
            const active = i === step
            const done   = i < step
            return (
              <div key={s} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',width:'100%'}}>
                  {i > 0 && <div style={{flex:1,height:'1px',background:done?'#C9A84C':'rgba(255,255,255,0.1)'}} />}
                  <div style={{width:'2.5rem',height:'2.5rem',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:done?'#C9A84C':active?'rgba(201,168,76,0.15)':'rgba(255,255,255,0.05)',border:active?'2px solid #C9A84C':done?'2px solid #C9A84C':'1px solid rgba(255,255,255,0.1)'}}>
                    {done ? <CheckCircle size={14} color="#0A1628" /> : <Icon size={14} color={active?'#C9A84C':'#6b7280'} />}
                  </div>
                  {i < STEPS.length-1 && <div style={{flex:1,height:'1px',background:i<step?'#C9A84C':'rgba(255,255,255,0.1)'}} />}
                </div>
                <span style={{fontSize:'0.6rem',color:active?'#C9A84C':done?'#E4C57A':'#6b7280',marginTop:'0.4rem',fontWeight:active?700:400}}>{s}</span>
              </div>
            )
          })}
        </div>

        <div style={S.card}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',color:'white',marginBottom:'0.25rem'}}>{STEPS[step]}</h2>
          <p style={{color:'#9ca3af',fontSize:'0.8rem',marginBottom:'1.5rem'}}>Step {step+1} of {STEPS.length}</p>

          {error && <div style={S.err}>{error}</div>}

          {/* Step 0 — Personal */}
          {step === 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div style={S.row}>
                <div><label style={S.label}>First Name</label>{inp('first_name',{placeholder:'Dhruv'})}</div>
                <div><label style={S.label}>Last Name</label>{inp('last_name',{placeholder:'Sharma'})}</div>
              </div>
              <div><label style={S.label}>Email Address</label>{inp('email',{type:'email',placeholder:'dhruv@example.com'})}</div>
              <div><label style={S.label}>Mobile Number</label>
                <div style={{display:'flex',gap:'0.5rem'}}>
                  <div style={{...S.input,width:'auto',padding:'0.875rem',color:'#C9A84C',flexShrink:0}}>+91</div>
                  <input style={{...S.input}} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" maxLength={10} />
                </div>
              </div>
              <div><label style={S.label}>Date of Birth</label>{inp('date_of_birth',{type:'date'})}</div>
            </div>
          )}

          {/* Step 1 — KYC */}
          {step === 1 && (
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div><label style={S.label}>PAN Number</label>{inp('pan_number',{placeholder:'ABCDE1234F',maxLength:10,style:{...S.input,textTransform:'uppercase'}})}</div>
              <div><label style={S.label}>Aadhar Number</label>{inp('aadhar_number',{placeholder:'123456789012',maxLength:12,type:'password'})}</div>
              <div><label style={S.label}>Full Address</label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="Flat 4B, Sunshine Apartments, MG Road, Mumbai - 400001"
                  rows={3} style={{...S.input,resize:'vertical',lineHeight:'1.5'}} />
              </div>
            </div>
          )}

          {/* Step 2 — Account Setup */}
          {step === 2 && (
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div>
                <label style={S.label}>Account Type</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginTop:'0.25rem'}}>
                  {[{v:'savings',label:'Savings Account',desc:'4.5% interest p.a.'},{v:'current',label:'Current Account',desc:'For businesses'}].map(opt => (
                    <button key={opt.v} type="button" onClick={() => set('account_type', opt.v)}
                      style={{padding:'1rem',borderRadius:'0.75rem',border:`2px solid ${form.account_type===opt.v?'#C9A84C':'rgba(255,255,255,0.1)'}`,background:form.account_type===opt.v?'rgba(201,168,76,0.1)':'transparent',cursor:'pointer',textAlign:'left'}}>
                      <div style={{color:'white',fontWeight:600,fontSize:'0.875rem'}}>{opt.label}</div>
                      <div style={{color:'#9ca3af',fontSize:'0.75rem',marginTop:'0.25rem'}}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>OTP Delivery Channel</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  {[{v:'email',label:'Email'},{v:'sms',label:'SMS'}].map(opt => (
                    <button key={opt.v} type="button" onClick={() => set('otp_channel', opt.v)}
                      style={{padding:'0.875rem',borderRadius:'0.75rem',border:`2px solid ${form.otp_channel===opt.v?'#C9A84C':'rgba(255,255,255,0.1)'}`,background:form.otp_channel===opt.v?'rgba(201,168,76,0.1)':'transparent',cursor:'pointer',color:form.otp_channel===opt.v?'#C9A84C':'white',fontWeight:600}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Security */}
          {step === 3 && (
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div>
                <label style={S.label}>Password</label>
                <div style={{position:'relative'}}>
                  <input style={{...S.input,paddingRight:'3rem'}} type={showPw?'text':'password'}
                    value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 chars, uppercase, number, symbol" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{position:'absolute',right:'1rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af'}}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div style={{marginTop:'0.5rem'}}>
                    <div style={{display:'flex',gap:'0.25rem',marginBottom:'0.25rem'}}>
                      {[1,2,3,4].map(i => <div key={i} style={{flex:1,height:'3px',borderRadius:'2px',background:i<=strength?strengthColor:'#1e3a5f'}} />)}
                    </div>
                    <span style={{fontSize:'0.7rem',color:strengthColor}}>{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div>
                <label style={S.label}>Confirm Password</label>
                <input style={{...S.input,borderColor:form.confirm_password&&form.password!==form.confirm_password?'#ef4444':undefined}}
                  type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} placeholder="Re-enter password" />
              </div>
              <div style={{background:'rgba(201,168,76,0.05)',border:'1px solid rgba(201,168,76,0.15)',borderRadius:'0.75rem',padding:'1rem',fontSize:'0.8rem',color:'#9ca3af'}}>
                By creating an account you agree to our{' '}
                <span style={{color:'#C9A84C',cursor:'pointer'}}>Terms of Service</span> and{' '}
                <span style={{color:'#C9A84C',cursor:'pointer'}}>Privacy Policy</span>.
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{display:'flex',gap:'1rem',marginTop:'1.5rem'}}>
            {step > 0 && (
              <button type="button" onClick={() => { setError(''); setStep(s => s-1) }} style={S.btnSecondary}>
                Back
              </button>
            )}
            {step < 3
              ? <button type="button" onClick={handleNext} style={S.btn}>Continue</button>
              : <button type="button" onClick={handleSubmit} disabled={loading}
                  style={{...S.btn,opacity:loading?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                  {loading
                    ? <><div style={{width:'1rem',height:'1rem',border:'2px solid rgba(10,22,40,0.3)',borderTop:'2px solid #0A1628',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />Creating Account...</>
                    : 'Create Account'
                  }
                </button>
            }
          </div>

          <p style={{textAlign:'center',fontSize:'0.875rem',color:'#6b7280',marginTop:'1.5rem'}}>
            Already have an account?{' '}
            <Link to="/login" style={{color:'#C9A84C',textDecoration:'none',fontWeight:500}}>Sign in</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
