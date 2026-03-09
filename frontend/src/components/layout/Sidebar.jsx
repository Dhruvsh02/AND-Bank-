import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, PiggyBank,
  Smartphone, User, MessageCircle, LogOut, ChevronRight
} from 'lucide-react'
import { C } from '../../utils/styles'

const NAV = [
  { to:'/dashboard',  icon:LayoutDashboard, label:'Dashboard' },
  { to:'/transfer',   icon:ArrowLeftRight,  label:'Transfer' },
  { to:'/statement',  icon:CreditCard,      label:'Statement' },
  { to:'/loans',      icon:PiggyBank,       label:'Loans' },
  { to:'/upi',        icon:Smartphone,      label:'UPI' },
  { to:'/cards',      icon:CreditCard,      label:'Cards' },
  { to:'/profile',    icon:User,            label:'Profile' },
  { to:'/chat',       icon:MessageCircle,   label:'Chat Assistant' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const user         = JSON.parse(sessionStorage.getItem('user') || '{}')

  const logout = () => {
    sessionStorage.clear()
    navigate('/login')
  }

  return (
    <aside style={{
      width:'240px', flexShrink:0,
      backgroundColor:'#0A1628',
      borderRight:`1px solid ${C.border}`,
      display:'flex', flexDirection:'column',
      height:'100vh', position:'sticky', top:0,
    }}>
      {/* Logo */}
      <div style={{padding:'1.5rem',borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:'1.75rem',color:'white',letterSpacing:'0.1rem'}}>
          AND<span style={{color:C.gold}}>Bank</span>
        </div>
        <div style={{fontSize:'0.65rem',color:C.muted,letterSpacing:'0.15em',textTransform:'uppercase',marginTop:'0.2rem'}}>
          Private Banking
        </div>
      </div>

      {/* User info */}
      <div style={{padding:'1rem 1.5rem',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:'0.75rem'}}>
        <div style={{width:'2.5rem',height:'2.5rem',borderRadius:'50%',background:`linear-gradient(135deg,${C.gold},#b08c32)`,display:'flex',alignItems:'center',justifyContent:'center',color:C.navy,fontWeight:700,fontSize:'1rem',flexShrink:0}}>
          {user.first_name?.[0] || 'U'}
        </div>
        <div style={{overflow:'hidden'}}>
          <div style={{color:'white',fontWeight:600,fontSize:'0.875rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {user.first_name} {user.last_name}
          </div>
          <div style={{color:C.muted,fontSize:'0.7rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {user.email}
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{flex:1,padding:'1rem 0.75rem',overflowY:'auto'}}>
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = pathname === to
          return (
            <Link key={to} to={to} style={{
              display:'flex', alignItems:'center', gap:'0.75rem',
              padding:'0.75rem 1rem', borderRadius:'0.75rem',
              marginBottom:'0.25rem', textDecoration:'none',
              backgroundColor: active ? C.goldDim : 'transparent',
              color: active ? C.gold : C.muted,
              fontWeight: active ? 600 : 400,
              fontSize:'0.875rem',
              transition:'all 0.15s',
              border: active ? `1px solid rgba(201,168,76,0.2)` : '1px solid transparent',
            }}>
              <Icon size={18} />
              {label}
              {active && <ChevronRight size={14} style={{marginLeft:'auto'}} />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{padding:'1rem 0.75rem',borderTop:`1px solid ${C.border}`}}>
        <button onClick={logout} style={{
          width:'100%', display:'flex', alignItems:'center', gap:'0.75rem',
          padding:'0.75rem 1rem', borderRadius:'0.75rem',
          background:'none', border:'none', cursor:'pointer',
          color:C.muted, fontSize:'0.875rem',
        }}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
