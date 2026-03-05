import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ArrowLeftRight, PiggyBank, Shield, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

const Stat = ({label,value,sub,color,icon:Icon}) => (
  <div style={S.card}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.75rem'}}>
      <span style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted}}>{label}</span>
      <div style={{width:'2.25rem',height:'2.25rem',borderRadius:'0.625rem',background:`rgba(${color},0.12)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Icon size={16} color={`rgb(${color})`}/>
      </div>
    </div>
    <div style={{fontSize:'2rem',fontWeight:700,color:'white',lineHeight:1}}>{value}</div>
    {sub && <div style={{fontSize:'0.75rem',color:C.muted,marginTop:'0.35rem'}}>{sub}</div>}
  </div>
)

export default function AdminDashboard() {
  const [stats,  setStats]  = useState(null)
  const [audit,  setAudit]  = useState([])
  const [loading,setLoading]= useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}')
    if (!sessionStorage.getItem('access_token') || user.role !== 'admin') { navigate('/login'); return }
    Promise.allSettled([
      api.get('/api/admin/dashboard/'),
      api.get('/api/admin/audit-logs/'),
    ]).then(([s,a]) => {
      if (s.status === 'fulfilled') setStats(s.value.data)
      if (a.status === 'fulfilled') setAudit(a.value.data.results || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={S.page}><AdminSidebar/>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:'2.5rem',height:'2.5rem',border:'3px solid rgba(239,68,68,0.2)',borderTop:'3px solid #ef4444',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <AdminSidebar/>
      <main style={{flex:1,overflowY:'auto',padding:'2rem'}}>
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',color:'white'}}>Admin Dashboard</h1>
          <p style={{color:C.muted,fontSize:'0.875rem'}}>Platform overview and key metrics</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
          <Stat label="Total Users"    value={stats?.users?.total||0}              sub={`${stats?.users?.new_today||0} new today`}   color="59,130,246"  icon={Users}/>
          <Stat label="Active Users"   value={stats?.users?.active||0}             sub="Verified accounts"                            color="34,197,94"   icon={CheckCircle}/>
          <Stat label="Pending KYC"    value={stats?.users?.pending_kyc||0}        sub="Awaiting review"                              color="245,158,11"  icon={Clock}/>
          <Stat label="Transactions"   value={stats?.transactions?.total||0}       sub={fmt.currency(stats?.transactions?.volume||0)} color="201,168,76"  icon={ArrowLeftRight}/>
          <Stat label="Pending Loans"  value={stats?.loans?.pending||0}            sub={`${stats?.loans?.approved||0} approved`}      color="239,68,68"   icon={PiggyBank}/>
          <Stat label="Flagged Txns"   value={stats?.transactions?.flagged||0}     sub="Needs review"                                 color="239,68,68"   icon={Shield}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'2rem'}}>
          {[
            {label:'Pending KYC',   count:stats?.users?.pending_kyc||0,  to:'/admin/users',  color:'#f59e0b', desc:'Review user documents'},
            {label:'Pending Loans', count:stats?.loans?.pending||0,       to:'/admin/loans',  color:'#3b82f6', desc:'Approve or reject applications'},
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.to)}
              style={{...S.card,cursor:'pointer',textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{color:'white',fontWeight:600,marginBottom:'0.25rem'}}>{a.label}</div>
                <div style={{color:C.muted,fontSize:'0.8rem'}}>{a.desc}</div>
              </div>
              <div style={{fontSize:'2.5rem',fontWeight:700,color:a.color,marginLeft:'1rem'}}>{a.count}</div>
            </button>
          ))}
        </div>

        <div style={S.card}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',color:'white',marginBottom:'1rem'}}>Recent Admin Activity</h2>
          {audit.length === 0
            ? <p style={{color:C.muted,textAlign:'center',padding:'2rem'}}>No activity yet</p>
            : audit.slice(0,10).map((log,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.75rem 0',borderBottom:`1px solid ${C.border}`}}>
                <div style={{width:'2rem',height:'2rem',borderRadius:'0.5rem',background:'rgba(239,68,68,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Shield size={14} color="#f87171"/>
                </div>
                <div style={{flex:1}}>
                  <div style={{color:'white',fontSize:'0.875rem',fontWeight:500,textTransform:'capitalize'}}>{log.action.replace(/_/g,' ')}</div>
                  <div style={{color:C.muted,fontSize:'0.75rem'}}>{new Date(log.created_at).toLocaleString()}</div>
                </div>
                <div style={{color:C.muted,fontSize:'0.75rem'}}>{log.ip_address}</div>
              </div>
            ))
          }
        </div>
      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
