import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Save, Key, Shield, CheckCircle } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S } from '../../utils/styles'

export default function Profile() {
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [pwData,   setPwData]   = useState({ current_password:'', new_password:'', confirm_password:'' })
  const [msg,      setMsg]      = useState({ type:'', text:'' })
  const fileRef  = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) { navigate('/login'); return }
    api.get('/api/users/profile/').then(r => { setProfile(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const showMsg = (type, text) => { setMsg({type, text}); setTimeout(() => setMsg({type:'',text:''}), 3000) }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await api.put('/api/users/profile/', { email: profile.email, phone: profile.phone })
      setProfile(res.data)
      showMsg('success', 'Profile updated successfully!')
    } catch (e) { showMsg('error', e.response?.data?.detail || 'Update failed') }
    finally { setSaving(false) }
  }

  const goToChangePassword = () => {
    // Generate a short-lived token (timestamp-based, valid 60 seconds)
    const ts    = Math.floor(Date.now() / 1000)
    const token = btoa(String(ts) + '-' + (sessionStorage.getItem('user') || 'user')).slice(0, 32)
    navigate(`/change-password?token=${token}&ts=${ts}`)
  }

  const uploadPhoto = async (file) => {
    const fd = new FormData(); fd.append('photo', file)
    try {
      const res = await api.post('/api/users/profile/photo/', fd, { headers:{'Content-Type':'multipart/form-data'} })
      setProfile(p => ({...p, photo_url: res.data.photo_url}))
      showMsg('success', 'Photo updated!')
    } catch { showMsg('error', 'Photo upload failed') }
  }

  const inputStyle = { ...S.input, marginTop:'0.5rem' }

  if (loading) return (
    <div style={S.page}><Sidebar />
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:'2rem',height:'2rem',border:`3px solid ${C.goldDim}`,borderTop:`3px solid ${C.gold}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{flex:1, overflowY:'auto', padding:'2rem', maxWidth:'700px'}}>
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontFamily:'Georgia,serif', fontSize:'1.75rem', color:'white'}}>My Profile</h1>
          <p style={{color:C.muted, fontSize:'0.875rem'}}>Manage your personal information and security settings</p>
        </div>

        {msg.text && (
          <div style={{marginBottom:'1rem', padding:'0.875rem', background:msg.type==='success'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${msg.type==='success'?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:'0.75rem', color:msg.type==='success'?'#22c55e':'#f87171', display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <CheckCircle size={16} /> {msg.text}
          </div>
        )}

        {/* Avatar */}
        <div style={{...S.card, marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1.5rem'}}>
          <div style={{position:'relative', flexShrink:0}}>
            <div style={{width:'5rem', height:'5rem', borderRadius:'50%', background:`linear-gradient(135deg,${C.gold},#b08c32)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:700, color:C.navy, overflow:'hidden'}}>
              {profile?.photo_url
                ? <img src={profile.photo_url} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                : (profile?.first_name?.[0] || 'U')
              }
            </div>
            <button onClick={() => fileRef.current?.click()}
              style={{position:'absolute', bottom:0, right:0, width:'1.75rem', height:'1.75rem', borderRadius:'50%', background:C.gold, border:`2px solid ${C.card}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
              <Camera size={12} color={C.navy} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0])} />
          </div>
          <div>
            <div style={{fontSize:'1.25rem', fontWeight:700, color:'white'}}>{profile?.first_name} {profile?.last_name}</div>
            <div style={{color:C.muted, fontSize:'0.875rem'}}>{profile?.email}</div>
            <div style={{display:'inline-flex', alignItems:'center', gap:'0.35rem', marginTop:'0.5rem', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'999px', padding:'0.2rem 0.625rem', fontSize:'0.7rem', color:'#22c55e', fontWeight:600}}>
              <Shield size={10} /> KYC Verified
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div style={{...S.card, marginBottom:'1.5rem'}}>
          <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.1rem', color:'white', marginBottom:'1.25rem'}}>Account Details</h2>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
            {[
              { label:'Account Number', value: profile?.account_number },
              { label:'Account Type',   value: profile?.account_type?.toUpperCase() },
              { label:'UPI ID',         value: profile?.upi_id },
              { label:'IFSC Code',      value: profile?.ifsc_code },
              { label:'Balance',        value: profile?.balance ? `₹${parseFloat(profile.balance).toLocaleString('en-IN')}` : '₹0.00' },
              { label:'Status',         value: profile?.account_status?.toUpperCase() },
            ].map(({label, value}) => (
              <div key={label}>
                <div style={{fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#9ca3af', marginBottom:'0.35rem'}}>{label}</div>
                <div style={{color: label==='UPI ID'?'#C9A84C':'white', fontFamily:'monospace', fontSize:'0.875rem', fontWeight:600}}>{value || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div style={{...S.card, marginBottom:'1.5rem'}}>
          <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.1rem', color:'white', marginBottom:'1.25rem'}}>Personal Information</h2>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
            <div>
              <label style={S.label}>First Name</label>
              <input value={profile?.first_name || ''} disabled style={{...inputStyle, opacity:0.5, cursor:'not-allowed'}} />
            </div>
            <div>
              <label style={S.label}>Last Name</label>
              <input value={profile?.last_name || ''} disabled style={{...inputStyle, opacity:0.5, cursor:'not-allowed'}} />
            </div>
            <div>
              <label style={S.label}>Email Address</label>
              <input value={profile?.email || ''} onChange={e => setProfile(p=>({...p,email:e.target.value}))} style={inputStyle} />
            </div>
            <div>
              <label style={S.label}>Mobile Number</label>
              <input value={profile?.phone || ''} onChange={e => setProfile(p=>({...p,phone:e.target.value}))} style={inputStyle} />
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving}
            style={{...S.btn, display:'flex', alignItems:'center', gap:'0.5rem', opacity:saving?0.7:1}}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Change Password */}
        <div style={S.card}>
          <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.1rem', color:'white', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <Key size={18} color={C.gold} /> Change Password
          </h2>
          <p style={{color:C.muted, fontSize:'0.875rem', marginBottom:'1.25rem'}}>
            For your security, you'll be redirected to a secure page that expires in 60 seconds.
          </p>
          <button onClick={goToChangePassword}
            style={{...S.btn, display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <Key size={16} /> Change Password Securely
          </button>
        </div>
      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
