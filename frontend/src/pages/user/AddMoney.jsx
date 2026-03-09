import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Check } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

const PRESETS = [500, 1000, 2000, 5000, 10000, 25000]

export default function AddMoney() {
  const [amount,  setAmount]  = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error,   setError]   = useState('')
  const navigate = useNavigate()

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

  const pay = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 1)      { setError('Enter a valid amount (min ₹1)'); return }
    if (amt > 100000)         { setError('Maximum deposit is ₹1,00,0000');  return }

    setLoading(true); setError('')

    const loaded = await loadRazorpay()
    if (!loaded) { setError('Could not load payment gateway'); setLoading(false); return }

    try {
      // Create order on backend
      const { data } = await api.post('/api/transactions/razorpay/create-order/', { amount: amt })

      const user = JSON.parse(sessionStorage.getItem('user') || '{}')

      const options = {
        key:         data.key_id,
        amount:      data.amount,
        currency:    'INR',
        name:        'AND Bank',
        description: 'Account Deposit',
        order_id:    data.order_id,
        prefill: {
          name:    `${user.first_name} ${user.last_name}`,
          email:   user.email,
          contact: user.phone,
        },
        theme: { color: '#C9A84C' },
        handler: async (response) => {
          // Verify payment
          try {
            const res = await api.post('/api/transactions/razorpay/verify/', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              amount:              data.amount,
            })
            setSuccess(res.data)
          } catch (e) {
            setError(e.response?.data?.detail || 'Payment verification failed')
          } finally {
            setLoading(false)
          }
        },
        modal: { ondismiss: () => setLoading(false) }
      }

      new window.Razorpay(options).open()

    } catch (e) {
      setError(e.response?.data?.detail || 'Could not create payment order')
      setLoading(false)
    }
  }

  if (success) return (
    <div style={S.page}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...S.card, maxWidth: '400px', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Check size={40} color="#22c55e" />
          </div>
          <h2 style={{ fontFamily: 'Georgia,serif', color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Money Added!</h2>
          <p style={{ color: C.muted, marginBottom: '1.5rem' }}>{success.message}</p>
          <p style={{ color: C.muted, fontSize: '0.75rem', marginBottom: '1.5rem' }}>Payment ID: {success.payment_id}</p>
          <button onClick={() => navigate('/dashboard')} style={{ ...S.btn, width: '100%' }}>
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  )

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: '520px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.75rem', color: 'white' }}>Add Money</h1>
          <p style={{ color: C.muted, fontSize: '0.875rem' }}>Deposit via UPI, Card, or Net Banking</p>
        </div>

        <div style={S.card}>
          {error && (
            <div style={{ marginBottom: '1rem', padding: '0.875rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', color: '#f87171', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <label style={S.label}>Enter Amount (₹)</label>
          <div style={{ position: 'relative', margin: '0.5rem 0 1rem' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: C.gold, fontWeight: 700, fontSize: '1.1rem' }}>₹</span>
            <input
              type="number" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00" min="1" max="100000"
              style={{ ...S.input, paddingLeft: '2.25rem', fontSize: '1.1rem' }}
            />
          </div>

          {/* Preset amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {PRESETS.map(p => (
              <button key={p} onClick={() => setAmount(String(p))}
                style={{ padding: '0.5rem', borderRadius: '0.625rem', border: `1px solid ${amount == p ? C.gold : C.border}`, background: amount == p ? C.goldDim : 'transparent', color: amount == p ? C.gold : C.muted, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s' }}>
                ₹{p.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <button onClick={pay} disabled={loading}
            style={{ ...S.btn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1, fontSize: '1rem' }}>
            <PlusCircle size={18} />
            {loading ? 'Opening Payment...' : `Pay ₹${parseFloat(amount || 0).toLocaleString('en-IN')}`}
          </button>

          <p style={{ textAlign: 'center', color: C.muted, fontSize: '0.7rem', marginTop: '1rem' }}>
            🔒 Secured by Razorpay · PCI DSS Compliant
          </p>
        </div>
      </main>
    </div>
  )
}