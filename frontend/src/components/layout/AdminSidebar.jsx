import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, ArrowLeftRight, PiggyBank, CreditCard, BarChart3, LogOut, ChevronRight, Shield } from 'lucide-react'
import { C } from '../../utils/styles'

const NAV = [
  { to:'/admin',              icon:LayoutDashboard, label:'Dashboard'       },
  { to:'/admin/users',        icon:Users,           label:'Users'           },
  { to:'/admin/transactions', icon:ArrowLeftRight,  label:'Transactions'    },
  { to:'/admin/loans',        icon:PiggyBank,       label:'Loans'           },
  { to:'/admin/cards',        icon:CreditCard,      label:'Cards'           },
  { to:'/admin/reports',      icon:BarChart3,       label:'Reports'         },
]

export default function AdminSidebar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const user         = JSON.parse(sessionStorage.getItem('user') || '{}')

  return (
    <aside style={{width:'240px',flexShrink:0,backgroundColor:'#07121F',borderRight:'1px solid rgba(255,255,255,0.06)',display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0}}>
      <div style={{padding:'1.5rem',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',color:'white'}}>AND<span style={{color:C.gold}}>Bank</span></div>
        <div style={{display:'inline-flex',alignItems:'center',gap:'0.35rem',marginTop:'0.4rem',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'999px',padding:'0.2rem 0.6rem',fontSize:'0.65rem',color:'#f87171',fontWeight:700,letterSpacing:'0.05em'}}>
          <Shield size={10}/> ADMIN PANEL
        </div>
      </div>
      <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:'0.75rem'}}>
        <div style={{width:'2.5rem',height:'2.5rem',borderRadius:'50%',background:'linear-gradient(135deg,#ef4444,#b91c1c)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,flexShrink:0}}>
          {user.first_name?.[0] || 'A'}
        </div>
        <div style={{overflow:'hidden'}}>
          <div style={{color:'white',fontWeight:600,fontSize:'0.875rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user.first_name} {user.last_name}</div>
          <div style={{color:'#f87171',fontSize:'0.7rem'}}>Administrator</div>
        </div>
      </div>
      <nav style={{flex:1,padding:'1rem 0.75rem',overflowY:'auto'}}>
        {NAV.map(({to,icon:Icon,label}) => {
          const active = pathname === to || (to !== '/admin' && pathname.startsWith(to))
          return (
            <Link key={to} to={to} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1rem',borderRadius:'0.75rem',marginBottom:'0.25rem',textDecoration:'none',backgroundColor:active?'rgba(239,68,68,0.08)':'transparent',color:active?'#f87171':C.muted,fontWeight:active?600:400,fontSize:'0.875rem',border:active?'1px solid rgba(239,68,68,0.15)':'1px solid transparent'}}>
              <Icon size={18}/>{label}
              {active && <ChevronRight size={14} style={{marginLeft:'auto'}}/>}
            </Link>
          )
        })}
      </nav>
      <div style={{padding:'1rem 0.75rem',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <button onClick={() => { sessionStorage.clear(); navigate('/login') }}
          style={{width:'100%',display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1rem',borderRadius:'0.75rem',background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:'0.875rem'}}>
          <LogOut size={18}/> Sign Out
        </button>
      </div>
    </aside>
  )
}
