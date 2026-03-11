import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

const PRESETS = [500, 1000, 2000, 5000, 10000, 25000]

export default function AddMoney() {
  const [amount,   setAmount]   = useState('')
  const [balance,  setBalance]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(null)
  const [error,    setError]    = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) { navigate('/login'); return }
    // Load Razorpay script
    if (!document.getElementById('rzp-script')) {
      const s = document.createElement('script')
      s.id  = 'rzp-script'
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(s)
    }
    api.get('/api/accounts/balance/').then(r => setBalance(r.data)).catch(() => {})
  }, [])

  const handleAddMoney = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 1)   { setError('Enter a valid amount (minimum ₹1)'); return }
    if (amt > 100000)      { setError('Maximum ₹1,00,000 per transaction'); return }
    setLoading(true); setError('')

    try {
      // Step 1: Create Razorpay order
      const orderRes = await api.post('/api/transactions/razorpay/create-order/', { amount: amt })
      const { order_id, key_id, amount: paise } = orderRes.data

      // Step 2: Open Razorpay checkout
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const options = {
        key:         key_id,
        amount:      paise,
        currency:    'INR',
        name:        'AND Bank',
        description: 'Add Money to Account',
        order_id:    order_id,
        prefill: {
          name:  `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email || '',
        },
        theme: { color: '#C9A84C' },
        handler: async (response) => {
          // Step 3: Verify payment
          try {
            const verifyRes = await api.post('/api/transactions/razorpay/verify/', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
              amount:              paise,
            })
            setSuccess(verifyRes.data)
            setAmount('')
            // Refresh balance
            api.get('/api/accounts/balance/').then(r => setBalance(r.data)).catch(() => {})
          } catch (e) {
            setError(e.response?.data?.detail || 'Payment verification failed')
          } finally { setLoading(false) }
        },
        modal: { ondismiss: () => setLoading(false) },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not initiate payment')
      setLoading(false)
    }
  }

  if (success) return (
    <div style={S.page}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ ...S.card, maxWidth: '420px', width: '100%', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={40} color="#22c55e" />
          </div>
          <h2 style={{ fontFamily: 'Georgia,serif', color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Money Added!</h2>
          <p style={{ color: C.muted, marginBottom: '0.5rem' }}>{fmt.currency(success.amount)} added to your account</p>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', padding: '0.875rem', margin: '1rem 0', fontFamily: 'monospace', fontSize: '0.8rem', color: C.muted }}>
            Txn ID: {success.txn_id}
          </div>
          <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: C.muted }}>
            New Balance: <span style={{ color: C.gold, fontWeight: 700 }}>{fmt.currency(success.balance)}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setSuccess(null)} style={{ ...S.btnGhost, flex: 1 }}>Add More</button>
            <button onClick={() => navigate('/dashboard')} style={{ ...S.btn, flex: 1 }}>Dashboard</button>
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: '600px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.75rem', color: 'white' }}>Add Money</h1>
          <p style={{ color: C.muted, fontSize: '0.875rem' }}>Top up your AND Bank account instantly via UPI, Card or Net Banking</p>
        </div>

        {/* Current balance */}
        {balance && (
          <div style={{ ...S.card, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: C.muted, fontSize: '0.875rem' }}>Current Balance</span>
            <span style={{ color: C.gold, fontWeight: 700, fontSize: '1.1rem' }}>{fmt.currency(balance.balance)}</span>
          </div>
        )}

        <div style={S.card}>
          <h2 style={{ fontFamily: 'Georgia,serif', color: 'white', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Enter Amount</h2>

          {error && (
            <div style={{ marginBottom: '1rem', padding: '0.875rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', color: '#f87171', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} /> {error}
            </div>
          )}

          {/* Amount input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={S.label}>Amount (₹)</label>
            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: C.gold, fontWeight: 700, fontSize: '1.3rem' }}>₹</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1" max="100000"
                placeholder="0" style={{ ...S.input, paddingLeft: '2.25rem', fontSize: '1.4rem', fontWeight: 700, height: '3.5rem' }} />
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={S.label}>Quick Select</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.625rem', marginTop: '0.5rem' }}>
              {PRESETS.map(p => (
                <button key={p} onClick={() => setAmount(String(p))}
                  style={{ padding: '0.625rem', borderRadius: '0.625rem', fontSize: '0.85rem', fontWeight: 600, border: `1px solid ${amount == p ? C.gold : C.border}`, background: amount == p ? C.goldDim : 'rgba(255,255,255,0.03)', color: amount == p ? C.gold : C.muted, cursor: 'pointer', transition: 'all 0.15s' }}>
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Pay methods info */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: '0.75rem' }}>Accepted Payment Methods</div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[['💳', 'Debit / Credit Card'], ['🏦', 'Net Banking'], ['📱', 'UPI'], ['💼', 'Wallets']].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: C.muted }}>
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleAddMoney} disabled={loading || !amount}
            style={{ ...S.btn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', fontSize: '1rem', opacity: (loading || !amount) ? 0.7 : 1 }}>
            {loading ? 'Opening Payment...' : <><Zap size={18} /> Pay ₹{parseFloat(amount || 0).toLocaleString('en-IN')} via Razorpay</>}
          </button>

          <p style={{ textAlign: 'center', color: C.muted, fontSize: '0.72rem', marginTop: '1rem' }}>
            🔒 Secured by Razorpay · PCI DSS Compliant · 256-bit SSL Encryption
          </p>
        </div>
      </main>
    </div>
  )
}
