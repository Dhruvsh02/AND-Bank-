import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  Eye, EyeOff, TrendingUp, Smartphone,
  RefreshCw, Copy, Check
} from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

const StatCard = ({ label, value, sub, color, icon: Icon }) => (
  <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
        {label}
      </span>
      <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: `rgba(${color},0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={`rgb(${color})`} />
      </div>
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: C.muted }}>{sub}</div>}
  </div>
)

const TxnRow = ({ txn }) => {
  const isCredit = txn.txn_type === 'credit'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: isCredit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isCredit ? <ArrowDownLeft size={16} color="#22c55e" /> : <ArrowUpRight size={16} color="#ef4444" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'white', fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {txn.remark || txn.mode?.toUpperCase() || 'Transaction'}
        </div>
        <div style={{ color: C.muted, fontSize: '0.75rem' }}>{fmt.datetime(txn.initiated_at)}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: isCredit ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>
          {isCredit ? '+' : '-'}{fmt.currency(txn.amount)}
        </div>
        <div style={{ fontSize: '0.65rem', color: C.muted, textTransform: 'uppercase' }}>{txn.mode}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [account,     setAccount]     = useState(null)
  const [txns,        setTxns]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [hideBalance, setHideBalance] = useState(false)
  const [copied,      setCopied]      = useState('')
  const navigate = useNavigate()

  const user = JSON.parse(sessionStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) { navigate('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [accRes, txnRes] = await Promise.all([
        api.get('/api/accounts/balance/'),
        api.get('/api/transactions/?limit=8'),
      ])
      setAccount(accRes.data)
      setTxns(txnRes.data.results || txnRes.data || [])
    } catch (e) {
      if (e.response?.status === 401) navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const totalIn  = txns.filter(t => t.txn_type === 'credit').reduce((a, t) => a + parseFloat(t.amount || 0), 0)
  const totalOut = txns.filter(t => t.txn_type === 'debit').reduce((a, t)  => a + parseFloat(t.amount || 0), 0)

  if (loading) return (
    <div style={S.page}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '3rem', height: '3rem', border: `3px solid ${C.goldDim}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: C.muted }}>Loading your dashboard...</p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.75rem', color: 'white', marginBottom: '0.25rem' }}>
              {greeting}, {user.first_name || 'there'} 👋
            </h1>
            <p style={{ color: C.muted, fontSize: '0.875rem' }}>Here's your financial overview</p>
          </div>
          <button onClick={fetchData} style={{ ...S.btnGhost, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Balance Hero Card */}
        <div style={{ background: `linear-gradient(135deg, #0A1628 0%, #1a3a6b 50%, #0A1628 100%)`, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '1.25rem', padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: `radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)`, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, marginBottom: '0.5rem' }}>
                {account?.account_type?.toUpperCase() || 'SAVINGS'} ACCOUNT
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: C.muted, fontSize: '0.875rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  {account?.account_number || '— — —'}
                </span>
                {account?.account_number && (
                  <button onClick={() => copy(account.account_number, 'acct')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0, display: 'flex' }}>
                    {copied === 'acct' ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: account?.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: account?.status === 'active' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {(account?.status || 'active').toUpperCase()}
              </span>
              <button onClick={() => setHideBalance(h => !h)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: C.muted, display: 'flex' }}>
                {hideBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {/* Balance */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: C.muted, marginBottom: '0.5rem' }}>Available Balance</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {hideBalance ? '₹ ••••••' : fmt.currency(account?.balance || 0)}
            </div>
          </div>

          {/* UPI + IFSC + Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* UPI ID */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '0.625rem', padding: '0.4rem 0.75rem' }}>
                <Smartphone size={13} color={C.gold} />
                <span style={{ color: C.gold, fontSize: '0.8rem', fontFamily: 'monospace' }}>{account?.upi_id || 'No UPI ID'}</span>
                {account?.upi_id && (
                  <button onClick={() => copy(account.upi_id, 'upi')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0, display: 'flex' }}>
                    {copied === 'upi' ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                  </button>
                )}
              </div>
              {/* IFSC */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '0.625rem', padding: '0.4rem 0.75rem' }}>
                <span style={{ color: C.muted, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>IFSC</span>
                <span style={{ color: 'white', fontSize: '0.8rem', fontFamily: 'monospace' }}>{account?.ifsc_code || 'ANDB0001001'}</span>
                <button onClick={() => copy(account?.ifsc_code || 'ANDB0001001', 'ifsc')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0, display: 'flex' }}>
                  {copied === 'ifsc' ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[
                { label: 'Send',    icon: ArrowUpRight,   to: '/transfer',  color: '#ef4444' },
                { label: 'Receive', icon: ArrowDownLeft,  to: '/upi',       color: '#22c55e' },
                { label: 'History', icon: ArrowLeftRight, to: '/statement', color: C.gold },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.to)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '0.75rem', padding: '0.625rem 1rem', cursor: 'pointer' }}>
                  <a.icon size={18} color={a.color} />
                  <span style={{ fontSize: '0.7rem', color: C.muted }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard label="Total In"     value={fmt.currency(totalIn)}           sub="This month" color="34,197,94"  icon={TrendingUp}     />
          <StatCard label="Total Out"    value={fmt.currency(totalOut)}          sub="This month" color="239,68,68"  icon={ArrowUpRight}   />
          <StatCard label="Transactions" value={txns.length}                     sub="Recent"     color="59,130,246" icon={ArrowLeftRight} />
          <StatCard label="UPI Payments" value={txns.filter(t => t.mode === 'upi').length} sub="Recent" color="201,168,76" icon={Smartphone} />
        </div>

        {/* Recent Transactions */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', color: 'white' }}>Recent Transactions</h2>
            <button onClick={() => navigate('/statement')} style={{ fontSize: '0.8rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>
              View All →
            </button>
          </div>
          {txns.length === 0
            ? <div style={{ textAlign: 'center', padding: '3rem 0', color: C.muted }}>
                <ArrowLeftRight size={40} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
                <p>No transactions yet</p>
              </div>
            : txns.map((t, i) => <TxnRow key={t.id || i} txn={t} />)
          }
        </div>

      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}