import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Flag, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

export default function AdminTransactions() {
  const [txns,     setTxns]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [mode,     setMode]     = useState('all')
  const [flagging, setFlagging] = useState({ txnId:'', reason:'' })
  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}')
    if (!sessionStorage.getItem('access_token') || user.role !== 'admin') { navigate('/login'); return }
    fetchTxns()
  }, [mode])

  const fetchTxns = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ limit:100 })
      if (mode !== 'all') p.set('mode', mode)
      const res = await api.get(`/api/admin/transactions/?${p}`)
      setTxns(res.data.results || res.data || [])
    } catch {} finally { setLoading(false) }
  }

  const flagTxn = async () => {
    try {
      await api.post(`/api/admin/transactions/${flagging.txnId}/flag/`, { reason: flagging.reason })
      setFlagging({ txnId:'', reason:'' })
      fetchTxns()
    } catch (e) { alert(e.response?.data?.detail || 'Failed') }
  }

  const filtered = txns.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (t.txn_id||'').toLowerCase().includes(q) || String(t.amount).includes(q)
  })

  const pill = (val) => (
    <button key={val} onClick={() => setMode(val)} style={{padding:'0.35rem 0.875rem',borderRadius:'999px',fontSize:'0.75rem',fontWeight:600,border:'none',cursor:'pointer',
      background:mode===val?C.gold:'rgba(255,255,255,0.06)',color:mode===val?C.navy:C.muted}}>
      {val.toUpperCase()}
    </button>
  )

  return (
    <div style={S.page}>
      <AdminSidebar/>
      <main style={{flex:1,overflowY:'auto',padding:'2rem'}}>
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',color:'white'}}>All Transactions</h1>
          <p style={{color:C.muted,fontSize:'0.875rem'}}>Monitor and flag suspicious transactions</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
          {[
            {label:'Total Volume', value:fmt.currency(txns.reduce((a,t)=>a+parseFloat(t.amount||0),0)), color:C.gold},
            {label:'Completed',    value:txns.filter(t=>t.status==='completed').length, color:'#22c55e'},
            {label:'Flagged',      value:txns.filter(t=>t.is_flagged).length, color:'#ef4444'},
            {label:'Failed',       value:txns.filter(t=>t.status==='failed').length, color:'#f59e0b'},
          ].map(s=>(
            <div key={s.label} style={S.card}>
              <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,marginBottom:'0.5rem'}}>{s.label}</div>
              <div style={{fontSize:'1.4rem',fontWeight:700,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{...S.card,marginBottom:'1.5rem'}}>
          <div style={{display:'flex',gap:'1rem',alignItems:'flex-end',flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:'200px'}}>
              <div style={{position:'relative'}}>
                <Search size={14} style={{position:'absolute',left:'0.875rem',top:'50%',transform:'translateY(-50%)',color:C.muted}}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="TXN ID or amount..."
                  style={{...S.input,paddingLeft:'2.5rem'}}/>
              </div>
            </div>
            <button onClick={fetchTxns} style={{...S.btn,display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1px'}}>
              <Filter size={14}/> Filter
            </button>
          </div>
          <div style={{marginTop:'1rem',display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            <span style={{fontSize:'0.72rem',color:C.muted,marginRight:'0.25rem'}}>Mode:</span>
            {['all','neft','rtgs','imps','upi','atm'].map(pill)}
          </div>
        </div>

        <div style={S.card}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',color:'white',marginBottom:'1rem'}}>
            Transactions <span style={{color:C.muted,fontSize:'0.875rem',fontFamily:'sans-serif'}}>({filtered.length})</span>
          </h2>
          {loading
            ? <div style={{textAlign:'center',padding:'3rem',color:C.muted}}>Loading...</div>
            : <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>
                    {['Date','TXN ID','Amount','Mode','Status','Flagged','Action'].map(h=>(
                      <th key={h} style={{textAlign:'left',padding:'0.75rem 1rem',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,borderBottom:`1px solid ${C.border}`,whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.map((t,i)=>{
                      const isCredit = t.txn_type==='credit'
                      return (
                        <tr key={t.id||i} style={{borderBottom:`1px solid ${C.border}`,background:t.is_flagged?'rgba(239,68,68,0.03)':'transparent'}}>
                          <td style={{padding:'1rem',color:C.muted,fontSize:'0.8rem',whiteSpace:'nowrap'}}>{fmt.date(t.initiated_at)}</td>
                          <td style={{padding:'1rem',color:C.muted,fontSize:'0.72rem',fontFamily:'monospace'}}>{t.txn_id||'—'}</td>
                          <td style={{padding:'1rem',fontWeight:700,color:isCredit?'#22c55e':'#ef4444',whiteSpace:'nowrap'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
                              {isCredit?<ArrowDownLeft size={14}/>:<ArrowUpRight size={14}/>}
                              {fmt.currency(t.amount)}
                            </div>
                          </td>
                          <td style={{padding:'1rem'}}>
                            <span style={{background:'rgba(255,255,255,0.06)',borderRadius:'999px',padding:'0.2rem 0.6rem',fontSize:'0.7rem',color:C.muted,textTransform:'uppercase',fontWeight:600}}>{t.mode}</span>
                          </td>
                          <td style={{padding:'1rem'}}>
                            <span style={{background:t.status==='completed'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',color:t.status==='completed'?'#22c55e':'#ef4444',borderRadius:'999px',padding:'0.2rem 0.6rem',fontSize:'0.7rem',fontWeight:600,textTransform:'capitalize'}}>{t.status}</span>
                          </td>
                          <td style={{padding:'1rem'}}>
                            {t.is_flagged
                              ? <span style={{color:'#ef4444',fontSize:'0.75rem',display:'flex',alignItems:'center',gap:'0.35rem'}}><Flag size={12}/>Flagged</span>
                              : <span style={{color:C.muted,fontSize:'0.75rem'}}>—</span>}
                          </td>
                          <td style={{padding:'1rem'}}>
                            {!t.is_flagged && (
                              <button onClick={()=>setFlagging({txnId:t.txn_id,reason:''})}
                                style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'0.5rem',padding:'0.35rem 0.625rem',cursor:'pointer',color:'#ef4444',fontSize:'0.75rem',display:'flex',alignItems:'center',gap:'0.35rem'}}>
                                <Flag size={12}/> Flag
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
          }
        </div>

        {flagging.txnId && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
            <div style={{background:'#112240',borderRadius:'1rem',padding:'2rem',maxWidth:'400px',width:'100%',margin:'1rem',border:`1px solid ${C.border}`}}>
              <h3 style={{color:'white',fontFamily:'Georgia,serif',fontSize:'1.2rem',marginBottom:'0.5rem'}}>Flag Transaction</h3>
              <p style={{color:C.muted,fontSize:'0.8rem',fontFamily:'monospace',marginBottom:'1rem'}}>{flagging.txnId}</p>
              <div style={{marginBottom:'1rem'}}>
                <label style={S.label}>Reason</label>
                <input value={flagging.reason} onChange={e=>setFlagging(p=>({...p,reason:e.target.value}))}
                  placeholder="Suspicious activity..." style={{...S.input,marginTop:'0.5rem'}}/>
              </div>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={()=>setFlagging({txnId:'',reason:''})} style={{...S.btnGhost,flex:1}}>Cancel</button>
                <button onClick={flagTxn} style={{flex:2,background:'#ef4444',color:'white',fontWeight:700,padding:'0.75rem',borderRadius:'0.75rem',border:'none',cursor:'pointer'}}>
                  Confirm Flag
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
