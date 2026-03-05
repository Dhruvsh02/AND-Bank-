import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, PiggyBank } from 'lucide-react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

export default function LoanManagement() {
  const [loans,   setLoans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('pending')
  const [modal,   setModal]   = useState({ loanId:'', action:'', reason:'' })
  const [saving,  setSaving]  = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}')
    if (!sessionStorage.getItem('access_token') || user.role !== 'admin') { navigate('/login'); return }
    fetchLoans()
  }, [filter])

  const fetchLoans = async () => {
    setLoading(true)
    try {
      const q = filter !== 'all' ? `?status=${filter}` : ''
      const res = await api.get(`/api/admin/loans/${q}`)
      setLoans(res.data.results || res.data || [])
    } catch {} finally { setLoading(false) }
  }

  const doAction = async () => {
    if (modal.action === 'reject' && !modal.reason) { alert('Reason required for rejection'); return }
    setSaving(true)
    try {
      await api.post(`/api/admin/loans/${modal.loanId}/action/`, { action: modal.action, reason: modal.reason })
      setModal({ loanId:'', action:'', reason:'' })
      fetchLoans()
    } catch (e) { alert(e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  const pill = (val, label) => (
    <button key={val} onClick={() => setFilter(val)} style={{padding:'0.35rem 0.875rem',borderRadius:'999px',fontSize:'0.75rem',fontWeight:600,border:'none',cursor:'pointer',
      background:filter===val?C.gold:'rgba(255,255,255,0.06)',color:filter===val?C.navy:C.muted}}>
      {label}
    </button>
  )

  const sc = s => ({approved:'#22c55e',pending:'#f59e0b',rejected:'#ef4444'}[s]||C.muted)
  const sb = s => ({approved:'rgba(34,197,94,0.1)',pending:'rgba(245,158,11,0.1)',rejected:'rgba(239,68,68,0.1)'}[s]||'rgba(107,114,128,0.1)')

  return (
    <div style={S.page}>
      <AdminSidebar/>
      <main style={{flex:1,overflowY:'auto',padding:'2rem'}}>
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',color:'white'}}>Loan Management</h1>
          <p style={{color:C.muted,fontSize:'0.875rem'}}>Review and process loan applications</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
          {[
            {label:'Pending',  value:loans.filter(l=>l.status==='pending').length,  color:'#f59e0b'},
            {label:'Approved', value:loans.filter(l=>l.status==='approved').length, color:'#22c55e'},
            {label:'Rejected', value:loans.filter(l=>l.status==='rejected').length, color:'#ef4444'},
            {label:'Volume',   value:fmt.currency(loans.reduce((a,l)=>a+parseFloat(l.amount||0),0)), color:C.gold},
          ].map(s=>(
            <div key={s.label} style={S.card}>
              <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,marginBottom:'0.5rem'}}>{s.label}</div>
              <div style={{fontSize:'1.4rem',fontWeight:700,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{...S.card,marginBottom:'1.5rem',display:'flex',gap:'0.5rem',flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:'0.72rem',color:C.muted,marginRight:'0.5rem'}}>Filter:</span>
          {[['all','All'],['pending','Pending'],['approved','Approved'],['rejected','Rejected']].map(([v,l])=>pill(v,l))}
        </div>

        <div style={S.card}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',color:'white',marginBottom:'1rem'}}>
            Applications <span style={{color:C.muted,fontSize:'0.875rem',fontFamily:'sans-serif'}}>({loans.length})</span>
          </h2>
          {loading
            ? <div style={{textAlign:'center',padding:'3rem',color:C.muted}}>Loading...</div>
            : loans.length === 0
              ? <div style={{textAlign:'center',padding:'3rem',color:C.muted}}>
                  <PiggyBank size={40} style={{margin:'0 auto 1rem',opacity:0.3,display:'block'}}/>
                  <p>No applications found</p>
                </div>
              : loans.map((loan,i)=>(
                <div key={loan.id||i} style={{padding:'1rem',border:`1px solid ${C.border}`,borderRadius:'0.75rem',marginBottom:'0.75rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'1rem'}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem'}}>
                        <span style={{color:'white',fontWeight:600,textTransform:'capitalize'}}>{loan.loan_type} Loan</span>
                        <span style={{background:sb(loan.status),color:sc(loan.status),borderRadius:'999px',padding:'0.2rem 0.6rem',fontSize:'0.7rem',fontWeight:600,textTransform:'capitalize'}}>{loan.status}</span>
                      </div>
                      <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',fontSize:'0.8rem'}}>
                        <span style={{color:C.muted}}>Amount: <span style={{color:C.gold,fontWeight:700}}>{fmt.currency(loan.amount)}</span></span>
                        <span style={{color:C.muted}}>Tenure: <span style={{color:'white'}}>{loan.tenure_months}m</span></span>
                        <span style={{color:C.muted}}>EMI: <span style={{color:'white'}}>{fmt.currency(loan.emi_amount)}/mo</span></span>
                        <span style={{color:C.muted}}>Rate: <span style={{color:'white'}}>{loan.interest_rate}%</span></span>
                      </div>
                      {loan.purpose && <p style={{color:C.muted,fontSize:'0.78rem',marginTop:'0.5rem',fontStyle:'italic'}}>"{loan.purpose}"</p>}
                    </div>
                    {loan.status === 'pending' && (
                      <div style={{display:'flex',gap:'0.5rem'}}>
                        <button onClick={()=>setModal({loanId:loan.id,action:'approve',reason:''})}
                          style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'0.625rem',padding:'0.5rem 0.875rem',cursor:'pointer',color:'#22c55e',fontSize:'0.8rem',display:'flex',alignItems:'center',gap:'0.35rem',fontWeight:600}}>
                          <CheckCircle size={14}/> Approve
                        </button>
                        <button onClick={()=>setModal({loanId:loan.id,action:'reject',reason:''})}
                          style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'0.625rem',padding:'0.5rem 0.875rem',cursor:'pointer',color:'#ef4444',fontSize:'0.8rem',display:'flex',alignItems:'center',gap:'0.35rem',fontWeight:600}}>
                          <XCircle size={14}/> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
          }
        </div>

        {modal.loanId && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
            <div style={{background:'#112240',borderRadius:'1rem',padding:'2rem',maxWidth:'400px',width:'100%',margin:'1rem',border:`1px solid ${C.border}`}}>
              <h3 style={{color:'white',fontFamily:'Georgia,serif',fontSize:'1.2rem',marginBottom:'0.75rem',textTransform:'capitalize'}}>{modal.action} Loan</h3>
              <div style={{marginBottom:'1rem'}}>
                <label style={S.label}>Reason {modal.action==='reject'&&'(required)'}</label>
                <input value={modal.reason} onChange={e=>setModal(p=>({...p,reason:e.target.value}))}
                  placeholder={modal.action==='approve'?'Approved per credit score':'Reason for rejection'}
                  style={{...S.input,marginTop:'0.5rem'}}/>
              </div>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={()=>setModal({loanId:'',action:'',reason:''})} style={{...S.btnGhost,flex:1}}>Cancel</button>
                <button onClick={doAction} disabled={saving}
                  style={{flex:2,background:modal.action==='approve'?'#22c55e':'#ef4444',color:'white',fontWeight:700,padding:'0.75rem',borderRadius:'0.75rem',border:'none',cursor:'pointer',opacity:saving?0.7:1}}>
                  {saving?'Processing...':modal.action==='approve'?'Approve':'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
