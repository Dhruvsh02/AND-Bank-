import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

const SC = {
  active:   { bg:'rgba(34,197,94,0.1)',   text:'#22c55e', border:'rgba(34,197,94,0.3)'   },
  pending:  { bg:'rgba(245,158,11,0.1)',  text:'#f59e0b', border:'rgba(245,158,11,0.3)'  },
  blocked:  { bg:'rgba(239,68,68,0.1)',   text:'#ef4444', border:'rgba(239,68,68,0.3)'   },
  rejected: { bg:'rgba(107,114,128,0.1)', text:'#9ca3af', border:'rgba(107,114,128,0.3)' },
  expired:  { bg:'rgba(107,114,128,0.1)', text:'#9ca3af', border:'rgba(107,114,128,0.3)' },
}
const Badge = ({status}) => { const s=SC[status]||SC.expired; return <span style={{padding:'0.2rem 0.6rem',borderRadius:'999px',fontSize:'0.65rem',fontWeight:700,background:s.bg,color:s.text,border:`1px solid ${s.border}`}}>{status.toUpperCase()}</span> }

function ActionModal({card, onClose, onDone}) {
  const [action,setAction]=useState('approve')
  const [limit,setLimit]=useState('50000')
  const [note,setNote]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const LIMITS=[25000,50000,100000,150000,200000,300000]

  const submit=async()=>{
    setLoading(true);setError('')
    try{
      const res=await api.post(`/api/cards/admin/${card.id}/action/`,{action,credit_limit:action==='approve'?parseInt(limit):0,admin_note:note})
      onDone(res.data.card)
    }catch(e){setError(e.response?.data?.detail||'Action failed')}
    finally{setLoading(false)}
  }

  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#0d1a35',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'1.25rem',padding:'2rem',width:'100%',maxWidth:'480px'}}>
        <h2 style={{fontFamily:'Georgia,serif',color:'white',fontSize:'1.2rem',marginBottom:'0.25rem'}}>Review Application</h2>
        <p style={{color:C.muted,fontSize:'0.8rem',marginBottom:'1.5rem'}}>{card.holder_name} — Visa Credit Card Application</p>
        <div style={{background:'rgba(255,255,255,0.03)',borderRadius:'0.75rem',padding:'1rem',marginBottom:'1.25rem'}}>
          {[['Annual Income',card.annual_income?fmt.currency(card.annual_income):'—'],['Employment',card.employment_type||'—'],['Purpose',card.purpose||'—']].map(([l,v])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'0.4rem 0',borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted,fontSize:'0.8rem'}}>{l}</span>
              <span style={{color:'white',fontSize:'0.8rem',fontWeight:500,maxWidth:'60%',textAlign:'right'}}>{v}</span>
            </div>
          ))}
        </div>
        {error&&<div style={{marginBottom:'1rem',padding:'0.75rem',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'0.75rem',color:'#f87171',fontSize:'0.875rem'}}>{error}</div>}
        <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem'}}>
          {[['approve','✅ Approve','#22c55e'],['reject','❌ Reject','#ef4444']].map(([val,label,color])=>(
            <button key={val} onClick={()=>setAction(val)} style={{flex:1,padding:'0.75rem',borderRadius:'0.75rem',border:`2px solid ${action===val?color:C.border}`,background:action===val?`${color}18`:'transparent',color:action===val?color:C.muted,cursor:'pointer',fontWeight:600,fontSize:'0.875rem'}}>{label}</button>
          ))}
        </div>
        {action==='approve'&&(
          <div style={{marginBottom:'1rem'}}>
            <label style={S.label}>Credit Limit</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.5rem',marginTop:'0.5rem'}}>
              {LIMITS.map(l=>(
                <button key={l} onClick={()=>setLimit(String(l))} style={{padding:'0.5rem',borderRadius:'0.5rem',border:`1px solid ${limit==l?C.gold:C.border}`,background:limit==l?C.goldDim:'transparent',color:limit==l?C.gold:C.muted,cursor:'pointer',fontSize:'0.75rem',fontWeight:600}}>₹{l/1000}K</button>
              ))}
            </div>
          </div>
        )}
        <div style={{marginBottom:'1.5rem'}}>
          <label style={S.label}>Admin Note</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder={action==='approve'?'Approval note...':'Reason for rejection...'} style={{...S.input,marginTop:'0.5rem',resize:'vertical',fontFamily:'inherit'}}/>
        </div>
        <div style={{display:'flex',gap:'0.75rem'}}>
          <button onClick={onClose} style={{...S.btnGhost,flex:1}}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{flex:2,padding:'0.75rem',borderRadius:'0.75rem',border:'none',cursor:'pointer',fontWeight:700,fontSize:'0.875rem',background:action==='approve'?'linear-gradient(135deg,#22c55e,#16a34a)':'linear-gradient(135deg,#ef4444,#dc2626)',color:'white',opacity:loading?0.7:1}}>
            {loading?'Processing...':action==='approve'?`Approve — ₹${parseInt(limit).toLocaleString('en-IN')} limit`:'Reject Application'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CardManagement() {
  const [cards,setCards]=useState([])
  const [loading,setLoading]=useState(true)
  const [filter,setFilter]=useState('pending')
  const [typeFilter,setTypeFilter]=useState('credit')
  const [actionCard,setActionCard]=useState(null)
  const navigate=useNavigate()

  useEffect(()=>{
    const user=JSON.parse(sessionStorage.getItem('user')||'{}')
    if(!sessionStorage.getItem('access_token')||user.role!=='admin'){navigate('/login');return}
    fetchCards()
  },[filter,typeFilter])

  const fetchCards=async()=>{
    setLoading(true)
    try{
      const params=new URLSearchParams({status:filter})
      if(typeFilter!=='all') params.append('card_type',typeFilter)
      const res=await api.get(`/api/cards/admin/all/?${params}`)
      setCards(res.data.results||[])
    }catch{}finally{setLoading(false)}
  }

  const pending=cards.filter(c=>c.status==='pending').length

  const pendingLabel = pending > 0 ? 'Pending (' + pending + ')' : 'Pending'

  return(
    <div style={S.page}>
      <AdminSidebar/>
      <main style={{flex:1,overflowY:'auto',padding:'2rem'}}>
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',color:'white',marginBottom:'0.25rem'}}>Card Management</h1>
          <p style={{color:C.muted,fontSize:'0.875rem'}}>Review credit card applications and manage all cards</p>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'1.5rem'}}>
          {[
            ['Pending Review', cards.filter(c=>c.status==='pending').length,  '#f59e0b', Clock],
            ['Active',         cards.filter(c=>c.status==='active').length,   '#22c55e', CheckCircle],
            ['Blocked',        cards.filter(c=>c.status==='blocked').length,  '#ef4444', XCircle],
            ['Rejected',       cards.filter(c=>c.status==='rejected').length, '#9ca3af', AlertCircle],
          ].map(([label,count,color,Icon])=>(
            <div key={label} style={{...S.card,padding:'1rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                <span style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted}}>{label}</span>
                <Icon size={16} color={color}/>
              </div>
              <div style={{fontSize:'1.5rem',fontWeight:700,color:'white'}}>{count}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',marginBottom:'1.25rem'}}>
          <div style={{display:'flex',gap:'0.35rem',background:'rgba(255,255,255,0.04)',borderRadius:'0.625rem',padding:'0.3rem'}}>
            {[
              ['pending', pendingLabel],
              ['active',  'Active'],
              ['all',     'All'],
              ['rejected','Rejected'],
            ].map(([val,label])=>(
              <button key={val} onClick={()=>setFilter(val)} style={{padding:'0.35rem 0.875rem',borderRadius:'0.375rem',fontSize:'0.75rem',fontWeight:600,border:'none',cursor:'pointer',background:filter===val?C.gold:'transparent',color:filter===val?C.navy:C.muted}}>{label}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:'0.35rem',background:'rgba(255,255,255,0.04)',borderRadius:'0.625rem',padding:'0.3rem'}}>
            {[['all','All'],['debit','Debit'],['credit','Credit']].map(([val,label])=>(
              <button key={val} onClick={()=>setTypeFilter(val)} style={{padding:'0.35rem 0.875rem',borderRadius:'0.375rem',fontSize:'0.75rem',fontWeight:600,border:'none',cursor:'pointer',background:typeFilter===val?C.gold:'transparent',color:typeFilter===val?C.navy:C.muted}}>{label}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{...S.card,padding:0,overflow:'hidden'}}>
          {loading?(
            <div style={{padding:'4rem',textAlign:'center',color:C.muted}}>Loading...</div>
          ):cards.length===0?(
            <div style={{padding:'4rem',textAlign:'center'}}>
              <CreditCard size={40} color={C.muted} style={{margin:'0 auto 1rem',display:'block',opacity:0.3}}/>
              <p style={{color:C.muted}}>No cards for this filter</p>
            </div>
          ):(
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${C.border}`}}>
                  {['Card','Holder','Type','Status','Expiry','Income','Action'].map(h=>(
                    <th key={h} style={{padding:'0.875rem 1rem',textAlign:'left',fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cards.map(card=>(
                  <tr key={card.id} style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:'1rem',color:'white',fontFamily:'monospace',fontSize:'0.85rem'}}>•••• {card.card_number_last4||card.card_number?.slice(-4)||'????'}</td>
                    <td style={{padding:'1rem',color:C.muted,fontSize:'0.8rem'}}>{card.holder_name}</td>
                    <td style={{padding:'1rem'}}>
                      <span style={{padding:'0.2rem 0.6rem',borderRadius:'999px',fontSize:'0.7rem',fontWeight:600,background:card.card_type==='debit'?'rgba(59,130,246,0.1)':'rgba(139,92,246,0.1)',color:card.card_type==='debit'?'#3b82f6':'#8b5cf6',border:`1px solid ${card.card_type==='debit'?'rgba(59,130,246,0.3)':'rgba(139,92,246,0.3)'}`}}>{card.card_type?.toUpperCase()}</span>
                    </td>
                    <td style={{padding:'1rem'}}><Badge status={card.status}/></td>
                    <td style={{padding:'1rem',color:C.muted,fontSize:'0.8rem',fontFamily:'monospace'}}>{card.expiry}</td>
                    <td style={{padding:'1rem',color:C.muted,fontSize:'0.8rem'}}>{card.annual_income?fmt.currency(card.annual_income):'—'}</td>
                    <td style={{padding:'1rem'}}>
                      {card.status==='pending'&&card.card_type==='credit'?(
                        <button onClick={()=>setActionCard(card)} style={{...S.btnSm,display:'inline-flex',alignItems:'center',gap:'0.35rem',padding:'0.4rem 0.875rem'}}>
                          <Clock size={13}/> Review
                        </button>
                      ):(
                        <span style={{color:C.muted,fontSize:'0.75rem'}}>
                          {card.status==='active'&&card.card_type==='credit'?fmt.currency(card.credit_limit):'—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
      {actionCard&&<ActionModal card={actionCard} onClose={()=>setActionCard(null)} onDone={card=>{setCards(cs=>cs.map(c=>c.id===card.id?{...c,...card}:c));setActionCard(null)}}/>}
    </div>
  )
}