import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ArrowDownLeft, Download, Search, Filter } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

const MODES   = ['all','neft','rtgs','imps','upi','atm','pos']
const TYPES   = ['all','credit','debit']

export default function Statement() {
  const [txns,    setTxns]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [mode,    setMode]    = useState('all')
  const [type,    setType]    = useState('all')
  const [from,    setFrom]    = useState('')
  const [to,      setTo]      = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) { navigate('/login'); return }
    fetchTxns()
  }, [])

  const fetchTxns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 100 })
      if (from)             params.set('from_date', from)
      if (to)               params.set('to_date',   to)
      if (mode !== 'all')   params.set('mode',       mode)
      if (type !== 'all')   params.set('txn_type',   type)
      const res = await api.get(`/api/transactions/?${params}`)
      setTxns(res.data.results || res.data || [])
    } catch { } finally { setLoading(false) }
  }

  const filtered = txns.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (t.remark||'').toLowerCase().includes(q) ||
           (t.txn_id||'').toLowerCase().includes(q)  ||
           String(t.amount).includes(q)
  })

  const totalIn  = filtered.filter(t=>t.txn_type==='credit').reduce((a,t)=>a+parseFloat(t.amount||0),0)
  const totalOut = filtered.filter(t=>t.txn_type==='debit').reduce((a,t)=>a+parseFloat(t.amount||0),0)

  const pill = (val, cur, set, label) => (
    <button key={val} onClick={() => set(val)}
      style={{padding:'0.375rem 0.875rem', borderRadius:'999px', fontSize:'0.75rem', fontWeight:600, border:'none', cursor:'pointer',
        background: cur===val ? C.gold : 'rgba(255,255,255,0.06)',
        color:       cur===val ? C.navy : C.muted}}>
      {label || val.toUpperCase()}
    </button>
  )

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{flex:1, overflowY:'auto', padding:'2rem'}}>
        <div style={{marginBottom:'2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem'}}>
          <div>
            <h1 style={{fontFamily:'Georgia,serif', fontSize:'1.75rem', color:'white'}}>Account Statement</h1>
            <p style={{color:C.muted, fontSize:'0.875rem'}}>Your full transaction history</p>
          </div>
          <button style={{...S.btn, display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <Download size={16} /> Download PDF
          </button>
        </div>

        {/* Summary */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1.5rem'}}>
          {[
            { label:'Total Credited', value:fmt.currency(totalIn),  color:'#22c55e' },
            { label:'Total Debited',  value:fmt.currency(totalOut), color:'#ef4444' },
            { label:'Net Flow',       value:fmt.currency(totalIn - totalOut), color: totalIn>=totalOut?'#22c55e':'#ef4444' },
          ].map(s => (
            <div key={s.label} style={S.card}>
              <div style={{fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:C.muted, marginBottom:'0.5rem'}}>{s.label}</div>
              <div style={{fontSize:'1.4rem', fontWeight:700, color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{...S.card, marginBottom:'1.5rem'}}>
          <div style={{display:'flex', flexWrap:'wrap', gap:'1rem', alignItems:'flex-end'}}>
            {/* Search */}
            <div style={{flex:'1', minWidth:'200px'}}>
              <label style={S.label}>Search</label>
              <div style={{position:'relative'}}>
                <Search size={14} style={{position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:C.muted}} />
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search transactions..."
                  style={{...S.input, paddingLeft:'2.5rem'}} />
              </div>
            </div>
            {/* Date range */}
            <div>
              <label style={S.label}>From</label>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...S.input, width:'150px'}} />
            </div>
            <div>
              <label style={S.label}>To</label>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...S.input, width:'150px'}} />
            </div>
            <button onClick={fetchTxns} style={{...S.btn, display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1px'}}>
              <Filter size={14} /> Apply
            </button>
          </div>

          {/* Mode & Type pills */}
          <div style={{marginTop:'1rem', display:'flex', flexWrap:'wrap', gap:'0.5rem', alignItems:'center'}}>
            <span style={{fontSize:'0.75rem', color:C.muted, marginRight:'0.5rem'}}>Mode:</span>
            {MODES.map(m => pill(m, mode, setMode))}
            <span style={{fontSize:'0.75rem', color:C.muted, margin:'0 0.5rem 0 1rem'}}>Type:</span>
            {TYPES.map(t => pill(t, type, setType))}
          </div>
        </div>

        {/* Transaction Table */}
        <div style={S.card}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.1rem', color:'white'}}>
              Transactions <span style={{color:C.muted, fontSize:'0.875rem', fontFamily:'sans-serif'}}>({filtered.length})</span>
            </h2>
          </div>

          {loading
            ? <div style={{textAlign:'center', padding:'3rem 0', color:C.muted}}>Loading...</div>
            : filtered.length === 0
              ? <div style={{textAlign:'center', padding:'3rem 0', color:C.muted}}>No transactions found</div>
              : (
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse'}}>
                    <thead>
                      <tr>
                        {['Date','Transaction ID','Details','Mode','Amount','Status'].map(h => (
                          <th key={h} style={{textAlign:'left', padding:'0.75rem 1rem', fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:C.muted, borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t,i) => {
                        const isCredit = t.txn_type === 'credit'
                        return (
                          <tr key={t.id||i} style={{borderBottom:`1px solid ${C.border}`}}>
                            <td style={{padding:'1rem', fontSize:'0.8rem', color:C.muted, whiteSpace:'nowrap'}}>{fmt.date(t.initiated_at)}</td>
                            <td style={{padding:'1rem', fontSize:'0.75rem', color:C.muted, fontFamily:'monospace'}}>{t.txn_id || '—'}</td>
                            <td style={{padding:'1rem', fontSize:'0.875rem', color:'white', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.remark || 'Transaction'}</td>
                            <td style={{padding:'1rem'}}>
                              <span style={{background:'rgba(255,255,255,0.06)', borderRadius:'999px', padding:'0.2rem 0.6rem', fontSize:'0.7rem', color:C.muted, textTransform:'uppercase', fontWeight:600}}>
                                {t.mode}
                              </span>
                            </td>
                            <td style={{padding:'1rem', fontWeight:700, color:isCredit?'#22c55e':'#ef4444', whiteSpace:'nowrap'}}>
                              <div style={{display:'flex', alignItems:'center', gap:'0.35rem'}}>
                                {isCredit ? <ArrowDownLeft size={14}/> : <ArrowUpRight size={14}/>}
                                {fmt.currency(t.amount)}
                              </div>
                            </td>
                            <td style={{padding:'1rem'}}>
                              <span style={{background:t.status==='completed'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', color:t.status==='completed'?'#22c55e':'#ef4444', borderRadius:'999px', padding:'0.2rem 0.6rem', fontSize:'0.7rem', fontWeight:600, textTransform:'capitalize'}}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
          }
        </div>
      </main>
    </div>
  )
}
