import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Plus, CheckCircle } from 'lucide-react'
import AdminSidebar from '../../components/layout/AdminSidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

export default function CardManagement() {
  const [cards,   setCards]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}')
    if (!sessionStorage.getItem('access_token') || user.role !== 'admin') { navigate('/login'); return }
    api.get('/api/admin/cards/')
      .then(r => setCards(r.data.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const approve = async (id) => {
    try {
      await api.post(`/api/admin/cards/${id}/approve/`, {})
      setCards(p => p.map(c => c.id===id ? {...c, status:'active'} : c))
    } catch (e) { alert(e.response?.data?.detail || 'Failed') }
  }

  const sc = s => ({active:'#22c55e',pending:'#f59e0b',blocked:'#ef4444',expired:'#6b7280'}[s]||C.muted)
  const sb = s => ({active:'rgba(34,197,94,0.1)',pending:'rgba(245,158,11,0.1)',blocked:'rgba(239,68,68,0.1)',expired:'rgba(107,114,128,0.1)'}[s]||'rgba(107,114,128,0.1)')

  const filtered = cards.filter(c => filter === 'all' || c.status === filter)

  const pill = (val, label) => (
    <button key={val} onClick={() => setFilter(val)} style={{padding:'0.35rem 0.875rem',borderRadius:'999px',fontSize:'0.75rem',fontWeight:600,border:'none',cursor:'pointer',
      background:filter===val?C.gold:'rgba(255,255,255,0.06)',color:filter===val?C.navy:C.muted}}>
      {label}
    </button>
  )

  return (
    <div style={S.page}>
      <AdminSidebar/>
      <main style={{flex:1,overflowY:'auto',padding:'2rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'2rem',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',color:'white'}}>Card Management</h1>
            <p style={{color:C.muted,fontSize:'0.875rem'}}>Issue and manage debit/credit cards</p>
          </div>
          <button style={{...S.btn,display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <Plus size={16}/> Issue New Card
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'1rem',marginBottom:'1.5rem'}}>
          {[
            {label:'Total',   value:cards.length,                                 color:C.gold},
            {label:'Active',  value:cards.filter(c=>c.status==='active').length,  color:'#22c55e'},
            {label:'Pending', value:cards.filter(c=>c.status==='pending').length, color:'#f59e0b'},
            {label:'Blocked', value:cards.filter(c=>c.status==='blocked').length, color:'#ef4444'},
          ].map(s=>(
            <div key={s.label} style={S.card}>
              <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,marginBottom:'0.5rem'}}>{s.label}</div>
              <div style={{fontSize:'1.75rem',fontWeight:700,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{...S.card,marginBottom:'1.5rem',display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
          {[['all','All'],['active','Active'],['pending','Pending'],['blocked','Blocked']].map(([v,l])=>pill(v,l))}
        </div>

        {loading
          ? <div style={{...S.card,textAlign:'center',padding:'3rem',color:C.muted}}>Loading cards...</div>
          : filtered.length === 0
            ? <div style={{...S.card,textAlign:'center',padding:'3rem',color:C.muted}}>
                <CreditCard size={40} style={{margin:'0 auto 1rem',opacity:0.3,display:'block'}}/>
                <p>No cards found</p>
              </div>
            : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1.25rem'}}>
                {filtered.map((card,i)=>(
                  <div key={card.id||i} style={{background:'linear-gradient(135deg,#0A1628,#1a3a6b)',border:'1px solid rgba(201,168,76,0.15)',borderRadius:'1rem',padding:'1.5rem',position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,right:0,width:'120px',height:'120px',background:'radial-gradient(circle,rgba(201,168,76,0.06),transparent)',pointerEvents:'none'}}/>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem'}}>
                      <CreditCard size={28} color={C.gold}/>
                      <span style={{fontSize:'0.7rem',fontWeight:700,padding:'0.2rem 0.6rem',borderRadius:'999px',background:sb(card.status),color:sc(card.status),textTransform:'capitalize'}}>{card.status}</span>
                    </div>
                    <div style={{fontFamily:'monospace',fontSize:'1rem',color:'white',letterSpacing:'0.12em',marginBottom:'1rem'}}>
                      **** **** **** {card.card_number?.slice(-4)||'****'}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.75rem'}}>
                      <div><div style={{fontSize:'0.6rem',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>Holder</div><div style={{color:'white',fontSize:'0.875rem',fontWeight:500}}>{card.holder_name||'—'}</div></div>
                      <div><div style={{fontSize:'0.6rem',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>Expires</div><div style={{color:'white',fontSize:'0.875rem'}}>{card.expiry||'—'}</div></div>
                      <div><div style={{fontSize:'0.6rem',color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>Network</div><div style={{color:'white',fontSize:'0.875rem',textTransform:'uppercase'}}>{card.network||'—'}</div></div>
                    </div>
                    {card.status === 'pending' && (
                      <button onClick={()=>approve(card.id)}
                        style={{width:'100%',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'0.625rem',padding:'0.5rem',cursor:'pointer',color:'#22c55e',fontSize:'0.8rem',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.35rem'}}>
                        <CheckCircle size={14}/> Approve & Activate
                      </button>
                    )}
                  </div>
                ))}
              </div>
        }
      </main>
    </div>
  )
}
