import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, MoreVertical, Eye, X } from 'lucide-react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

const SC = { active:'#22c55e',blocked:'#ef4444',suspended:'#f59e0b',inactive:'#6b7280' }
const SB = { active:'rgba(34,197,94,0.1)',blocked:'rgba(239,68,68,0.1)',suspended:'rgba(245,158,11,0.1)',inactive:'rgba(107,114,128,0.1)' }

export default function UserManagement() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('all')
  const [menu,    setMenu]    = useState(null)
  const [modal,   setModal]   = useState({ userId:'', type:'', reason:'' })
  const [saving,  setSaving]  = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}')
    if (!sessionStorage.getItem('access_token') || user.role !== 'admin') { navigate('/login'); return }
    fetchUsers()
  }, [status])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (status !== 'all') p.set('status', status)
      if (search) p.set('search', search)
      const res = await api.get(`/api/admin/users/?${p}`)
      setUsers(res.data.results || res.data || [])
    } catch {} finally { setLoading(false) }
  }

  const doAction = async () => {
    setSaving(true)
    try {
      await api.post(`/api/admin/users/${modal.userId}/action/`, { action: modal.type, reason: modal.reason })
      setModal({ userId:'', type:'', reason:'' })
      fetchUsers()
    } catch (e) { alert(e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  const pill = (val, cur, set) => (
    <button onClick={() => set(val)} style={{padding:'0.35rem 0.875rem',borderRadius:'999px',fontSize:'0.75rem',fontWeight:600,border:'none',cursor:'pointer',
      background:cur===val?C.gold:'rgba(255,255,255,0.06)',color:cur===val?C.navy:C.muted}}>
      {val==='all'?'All':val.charAt(0).toUpperCase()+val.slice(1)}
    </button>
  )

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.email||'').toLowerCase().includes(q)||(u.first_name||'').toLowerCase().includes(q)||(u.phone||'').includes(q)
  })

  return (
    <div style={S.page}>
      <AdminSidebar/>
      <main style={{flex:1,overflowY:'auto',padding:'2rem'}}>
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',color:'white'}}>User Management</h1>
          <p style={{color:C.muted,fontSize:'0.875rem'}}>Manage accounts, KYC and user status</p>
        </div>

        <div style={{...S.card,marginBottom:'1.5rem'}}>
          <div style={{display:'flex',gap:'1rem',alignItems:'flex-end',flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:'200px'}}>
              <label style={S.label}>Search</label>
              <div style={{position:'relative'}}>
                <Search size={14} style={{position:'absolute',left:'0.875rem',top:'50%',transform:'translateY(-50%)',color:C.muted}}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchUsers()}
                  placeholder="Name, email or phone..." style={{...S.input,paddingLeft:'2.5rem'}}/>
              </div>
            </div>
            <button onClick={fetchUsers} style={{...S.btn,display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1px'}}>
              <Filter size={14}/> Search
            </button>
          </div>
          <div style={{marginTop:'1rem',display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            <span style={{fontSize:'0.72rem',color:C.muted,marginRight:'0.25rem'}}>Status:</span>
            {['all','active','blocked','suspended','inactive'].map(s=>pill(s,status,setStatus))}
          </div>
        </div>

        <div style={S.card}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',color:'white',marginBottom:'1rem'}}>
            Users <span style={{color:C.muted,fontSize:'0.875rem',fontFamily:'sans-serif'}}>({filtered.length})</span>
          </h2>
          {loading
            ? <div style={{textAlign:'center',padding:'3rem',color:C.muted}}>Loading...</div>
            : filtered.length === 0
              ? <div style={{textAlign:'center',padding:'3rem',color:C.muted}}>No users found</div>
              : <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr>
                      {['User','Email','Phone','Status','KYC','Joined','Actions'].map(h=>(
                        <th key={h} style={{textAlign:'left',padding:'0.75rem 1rem',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,borderBottom:`1px solid ${C.border}`,whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.map((u,i)=>(
                        <tr key={u.id||i} style={{borderBottom:`1px solid ${C.border}`}}>
                          <td style={{padding:'1rem'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                              <div style={{width:'2rem',height:'2rem',borderRadius:'50%',background:`linear-gradient(135deg,${C.gold},#b08c32)`,display:'flex',alignItems:'center',justifyContent:'center',color:C.navy,fontWeight:700,fontSize:'0.875rem',flexShrink:0}}>
                                {u.first_name?.[0]||'?'}
                              </div>
                              <span style={{color:'white',fontWeight:500,fontSize:'0.875rem'}}>{u.first_name} {u.last_name}</span>
                            </div>
                          </td>
                          <td style={{padding:'1rem',color:C.muted,fontSize:'0.8rem'}}>{u.email}</td>
                          <td style={{padding:'1rem',color:C.muted,fontSize:'0.8rem'}}>{u.phone}</td>
                          <td style={{padding:'1rem'}}>
                            <span style={{background:SB[u.status]||'rgba(107,114,128,0.1)',color:SC[u.status]||C.muted,borderRadius:'999px',padding:'0.2rem 0.6rem',fontSize:'0.7rem',fontWeight:600,textTransform:'capitalize'}}>{u.status}</span>
                          </td>
                          <td style={{padding:'1rem'}}>
                            <span style={{background:u.is_kyc_verified?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)',color:u.is_kyc_verified?'#22c55e':'#f59e0b',borderRadius:'999px',padding:'0.2rem 0.6rem',fontSize:'0.7rem',fontWeight:600}}>
                              {u.is_kyc_verified?'Verified':'Pending'}
                            </span>
                          </td>
                          <td style={{padding:'1rem',color:C.muted,fontSize:'0.75rem',whiteSpace:'nowrap'}}>{fmt.date(u.created_at)}</td>
                          <td style={{padding:'1rem'}}>
                            <div style={{display:'flex',gap:'0.5rem',position:'relative'}}>
                              <button onClick={()=>setMenu(menu===u.id?null:u.id)}
                                style={{background:'rgba(255,255,255,0.05)',border:`1px solid ${C.border}`,borderRadius:'0.5rem',padding:'0.375rem',cursor:'pointer',color:C.muted}}>
                                <MoreVertical size={14}/>
                              </button>
                              {menu===u.id && (
                                <div style={{position:'absolute',right:0,top:'100%',marginTop:'0.25rem',background:'#1a3a6b',border:`1px solid ${C.border}`,borderRadius:'0.75rem',padding:'0.5rem',zIndex:10,minWidth:'130px'}}>
                                  {[{a:'block',l:'Block',c:'#ef4444'},{a:'unblock',l:'Unblock',c:'#22c55e'},{a:'suspend',l:'Suspend',c:'#f59e0b'},{a:'delete',l:'Delete',c:'#ef4444'}].map(({a,l,c})=>(
                                    <button key={a} onClick={()=>{setModal({userId:u.id,type:a,reason:''});setMenu(null)}}
                                      style={{width:'100%',textAlign:'left',padding:'0.5rem 0.75rem',background:'none',border:'none',cursor:'pointer',color:c,fontSize:'0.8rem',borderRadius:'0.5rem'}}>
                                      {l}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
          }
        </div>

        {modal.userId && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
            <div style={{background:'#112240',borderRadius:'1rem',padding:'2rem',maxWidth:'400px',width:'100%',margin:'1rem',border:`1px solid ${C.border}`}}>
              <h3 style={{color:'white',fontFamily:'Georgia,serif',fontSize:'1.2rem',marginBottom:'0.75rem',textTransform:'capitalize'}}>{modal.type} User</h3>
              <div style={{marginBottom:'1rem'}}>
                <label style={S.label}>Reason (optional)</label>
                <input value={modal.reason} onChange={e=>setModal(p=>({...p,reason:e.target.value}))}
                  placeholder="Enter reason..." style={{...S.input,marginTop:'0.5rem'}}/>
              </div>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={()=>setModal({userId:'',type:'',reason:''})} style={{...S.btnGhost,flex:1}}>Cancel</button>
                <button onClick={doAction} disabled={saving}
                  style={{flex:2,background:'#ef4444',color:'white',fontWeight:700,padding:'0.75rem',borderRadius:'0.75rem',border:'none',cursor:'pointer',opacity:saving?0.7:1}}>
                  {saving?'Processing...':'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
