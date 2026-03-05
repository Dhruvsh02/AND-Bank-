import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PiggyBank, Plus, CheckCircle, Clock, XCircle } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

const LOAN_TYPES = [
  { v:'personal', label:'Personal Loan',  rate:'10.5%', max:'₹10,00,000', desc:'For any personal need' },
  { v:'home',     label:'Home Loan',      rate:'8.5%',  max:'₹1,00,00,000', desc:'Buy your dream home' },
  { v:'car',      label:'Car Loan',       rate:'9.0%',  max:'₹20,00,000', desc:'Drive your dream car' },
  { v:'education',label:'Education Loan', rate:'7.5%',  max:'₹50,00,000', desc:'Invest in your future' },
]

const statusIcon = (s) => ({
  approved: <CheckCircle size={14} color="#22c55e" />,
  pending:  <Clock size={14} color="#f59e0b" />,
  rejected: <XCircle size={14} color="#ef4444" />,
}[s] || <Clock size={14} color={C.muted} />)

const statusColor = (s) => ({
  approved:'rgba(34,197,94,0.1)',  pending:'rgba(245,158,11,0.1)',  rejected:'rgba(239,68,68,0.1)',
}[s] || 'rgba(255,255,255,0.05)')
const statusText = (s) => ({
  approved:'#22c55e', pending:'#f59e0b', rejected:'#ef4444',
}[s] || C.muted)

export default function Loans() {
  const [loans,   setLoans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showing, setShowing] = useState('list')  // 'list' | 'apply'
  const [form,    setForm]    = useState({ loan_type:'personal', amount:'', tenure_months:'12', purpose:'' })
  const [emi,     setEmi]     = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) { navigate('/login'); return }
    api.get('/api/loans/').then(r => { setLoans(r.data.results || r.data || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const calcEMI = () => {
    const P = parseFloat(form.amount)
    const type = LOAN_TYPES.find(t => t.v === form.loan_type)
    const r = parseFloat(type?.rate) / 100 / 12
    const n = parseInt(form.tenure_months)
    if (!P || !r || !n) return
    const emi = P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1)
    setEmi(emi)
  }

  const applyLoan = async () => {
    if (!form.amount || !form.purpose) { setError('Fill all fields'); return }
    setSaving(true); setError('')
    try {
      const res = await api.post('/api/loans/apply/', { ...form, amount: parseFloat(form.amount), tenure_months: parseInt(form.tenure_months) })
      setLoans(p => [res.data, ...p])
      setShowing('list')
      setForm({ loan_type:'personal', amount:'', tenure_months:'12', purpose:'' })
      setEmi(null)
    } catch (e) { setError(e.response?.data?.detail || 'Application failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{flex:1, overflowY:'auto', padding:'2rem'}}>
        <div style={{marginBottom:'2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem'}}>
          <div>
            <h1 style={{fontFamily:'Georgia,serif', fontSize:'1.75rem', color:'white'}}>Loans</h1>
            <p style={{color:C.muted, fontSize:'0.875rem'}}>Apply for loans and track your applications</p>
          </div>
          <button onClick={() => setShowing(s => s==='list'?'apply':'list')}
            style={{...S.btn, display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <Plus size={16} /> {showing==='list' ? 'Apply for Loan' : 'Back to Loans'}
          </button>
        </div>

        {showing === 'list' && (
          <>
            {/* Loan Products */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1rem', marginBottom:'2rem'}}>
              {LOAN_TYPES.map(lt => (
                <div key={lt.v} style={{...S.card, cursor:'pointer'}} onClick={() => { setForm(p=>({...p,loan_type:lt.v})); setShowing('apply') }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem'}}>
                    <PiggyBank size={24} color={C.gold} />
                    <span style={{fontSize:'1rem', fontWeight:700, color:C.gold}}>{lt.rate}</span>
                  </div>
                  <div style={{color:'white', fontWeight:600, marginBottom:'0.25rem'}}>{lt.label}</div>
                  <div style={{color:C.muted, fontSize:'0.75rem', marginBottom:'0.5rem'}}>{lt.desc}</div>
                  <div style={{fontSize:'0.7rem', color:C.muted}}>Up to <span style={{color:C.goldLight}}>{lt.max}</span></div>
                </div>
              ))}
            </div>

            {/* My Applications */}
            <div style={S.card}>
              <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.1rem', color:'white', marginBottom:'1rem'}}>My Loan Applications</h2>
              {loading
                ? <div style={{textAlign:'center', padding:'2rem', color:C.muted}}>Loading...</div>
                : loans.length === 0
                  ? <div style={{textAlign:'center', padding:'3rem 0', color:C.muted}}>
                      <PiggyBank size={40} style={{margin:'0 auto 1rem', opacity:0.3}} />
                      <p>No loan applications yet</p>
                    </div>
                  : loans.map((loan, i) => (
                    <div key={loan.id||i} style={{display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 0', borderBottom:`1px solid ${C.border}`}}>
                      <div style={{flex:1}}>
                        <div style={{color:'white', fontWeight:600, fontSize:'0.9rem', textTransform:'capitalize'}}>{loan.loan_type} Loan</div>
                        <div style={{color:C.muted, fontSize:'0.75rem'}}>{fmt.date(loan.created_at)} · {loan.tenure_months} months</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{color:'white', fontWeight:700}}>{fmt.currency(loan.amount)}</div>
                        <div style={{display:'inline-flex', alignItems:'center', gap:'0.35rem', background:statusColor(loan.status), padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.7rem', color:statusText(loan.status), fontWeight:600, marginTop:'0.25rem', textTransform:'capitalize'}}>
                          {statusIcon(loan.status)} {loan.status}
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </>
        )}

        {showing === 'apply' && (
          <div style={{maxWidth:'550px'}}>
            <div style={S.card}>
              <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.2rem', color:'white', marginBottom:'1.5rem'}}>Loan Application</h2>
              {error && <div style={{marginBottom:'1rem', padding:'0.75rem', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'0.75rem', color:'#f87171', fontSize:'0.875rem'}}>{error}</div>}

              <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
                <div>
                  <label style={S.label}>Loan Type</label>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginTop:'0.5rem'}}>
                    {LOAN_TYPES.map(lt => (
                      <button key={lt.v} type="button" onClick={() => setForm(p=>({...p,loan_type:lt.v}))}
                        style={{padding:'0.75rem', borderRadius:'0.75rem', textAlign:'left', cursor:'pointer',
                          border:`2px solid ${form.loan_type===lt.v ? C.gold : 'rgba(255,255,255,0.08)'}`,
                          background:form.loan_type===lt.v?'rgba(201,168,76,0.08)':'transparent'}}>
                        <div style={{color:'white', fontWeight:600, fontSize:'0.85rem'}}>{lt.label}</div>
                        <div style={{color:C.gold, fontSize:'0.75rem'}}>{lt.rate} p.a.</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={S.label}>Loan Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={e=>{setForm(p=>({...p,amount:e.target.value}));setEmi(null)}}
                    placeholder="5,00,000" style={{...S.input,marginTop:'0.5rem'}} />
                </div>

                <div>
                  <label style={S.label}>Tenure: <span style={{color:C.gold}}>{form.tenure_months} months ({Math.round(form.tenure_months/12*10)/10} years)</span></label>
                  <input type="range" min="6" max="360" step="6" value={form.tenure_months}
                    onChange={e=>{setForm(p=>({...p,tenure_months:e.target.value}));setEmi(null)}}
                    style={{width:'100%',marginTop:'0.5rem',accentColor:C.gold}} />
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',color:C.muted,marginTop:'0.25rem'}}>
                    <span>6m</span><span>5yr</span><span>10yr</span><span>30yr</span>
                  </div>
                </div>

                <div>
                  <label style={S.label}>Purpose</label>
                  <textarea value={form.purpose} onChange={e=>setForm(p=>({...p,purpose:e.target.value}))}
                    placeholder="Briefly describe the purpose of this loan..."
                    rows={3} style={{...S.input,marginTop:'0.5rem',resize:'vertical'}} />
                </div>

                {/* EMI Calculator */}
                <div style={{background:'rgba(255,255,255,0.03)', borderRadius:'0.75rem', padding:'1rem', border:`1px solid ${C.border}`}}>
                  <button onClick={calcEMI} style={{...S.btnGhost, width:'100%', marginBottom: emi?'0.75rem':0}}>
                    Calculate EMI
                  </button>
                  {emi && (
                    <div style={{textAlign:'center', marginTop:'0.75rem'}}>
                      <div style={{fontSize:'0.7rem', color:C.muted, marginBottom:'0.25rem'}}>Estimated Monthly EMI</div>
                      <div style={{fontSize:'1.75rem', fontWeight:700, color:C.gold}}>{fmt.currency(emi)}</div>
                    </div>
                  )}
                </div>

                <button onClick={applyLoan} disabled={saving}
                  style={{...S.btn, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', opacity:saving?0.7:1}}>
                  {saving ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
