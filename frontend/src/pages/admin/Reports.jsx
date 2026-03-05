import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Users, PiggyBank, ArrowLeftRight, Download } from 'lucide-react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

export default function Reports() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('30d')
  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}')
    if (!sessionStorage.getItem('access_token') || user.role !== 'admin') { navigate('/login'); return }
    api.get(`/api/admin/dashboard/?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  const Bar = ({label, pct, color}) => (
    <div style={{marginBottom:'1rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.4rem'}}>
        <span style={{color:C.muted,fontSize:'0.8rem'}}>{label}</span>
        <span style={{color:'white',fontWeight:600,fontSize:'0.8rem'}}>{pct}%</span>
      </div>
      <div style={{height:'6px',background:'rgba(255,255,255,0.06)',borderRadius:'999px',overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:'999px',transition:'width 0.5s'}}/>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <AdminSidebar/>
      <main style={{flex:1,overflowY:'auto',padding:'2rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'2rem',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',color:'white'}}>Reports & Analytics</h1>
            <p style={{color:C.muted,fontSize:'0.875rem'}}>Platform-wide financial overview</p>
          </div>
          <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
            <div style={{display:'flex',gap:'0.35rem',background:'rgba(255,255,255,0.04)',borderRadius:'0.75rem',padding:'0.35rem'}}>
              {[['7d','7D'],['30d','30D'],['90d','3M'],['365d','1Y']].map(([v,l])=>(
                <button key={v} onClick={()=>setPeriod(v)}
                  style={{padding:'0.4rem 0.75rem',borderRadius:'0.5rem',fontSize:'0.8rem',fontWeight:600,border:'none',cursor:'pointer',
                    background:period===v?C.gold:'transparent',color:period===v?C.navy:C.muted}}>
                  {l}
                </button>
              ))}
            </div>
            <button style={{...S.btn,display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.625rem 1rem'}}>
              <Download size={14}/> Export
            </button>
          </div>
        </div>

        {loading
          ? <div style={{textAlign:'center',padding:'4rem',color:C.muted}}>Loading reports...</div>
          : <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
                {[
                  {label:'Total Users',    value:data?.users?.total||0,               color:'#3b82f6'},
                  {label:'New Users',      value:data?.users?.new_today||0,           color:'#22c55e'},
                  {label:'Transactions',   value:data?.transactions?.total||0,        color:C.gold},
                  {label:'Volume',         value:fmt.currency(data?.transactions?.volume||0), color:C.gold},
                  {label:'Active Loans',   value:data?.loans?.approved||0,            color:'#ef4444'},
                  {label:'Pending Loans',  value:data?.loans?.pending||0,             color:'#f59e0b'},
                ].map(s=>(
                  <div key={s.label} style={S.card}>
                    <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,marginBottom:'0.5rem'}}>{s.label}</div>
                    <div style={{fontSize:'1.4rem',fontWeight:700,color:s.color}}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
                <div style={S.card}>
                  <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',color:'white',marginBottom:'1.25rem'}}>KYC Status</h2>
                  <Bar label="Verified" pct={80} color="#22c55e"/>
                  <Bar label="Pending"  pct={15} color="#f59e0b"/>
                  <Bar label="Rejected" pct={5}  color="#ef4444"/>
                </div>
                <div style={S.card}>
                  <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',color:'white',marginBottom:'1.25rem'}}>Transaction Modes</h2>
                  <Bar label="UPI"  pct={45} color={C.gold}/>
                  <Bar label="IMPS" pct={30} color="#3b82f6"/>
                  <Bar label="NEFT" pct={15} color="#22c55e"/>
                  <Bar label="RTGS" pct={10} color="#f59e0b"/>
                </div>
              </div>
            </>
        }
      </main>
    </div>
  )
}
