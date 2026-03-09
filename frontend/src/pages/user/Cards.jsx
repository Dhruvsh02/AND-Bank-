import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Shield, Wifi, ChevronRight, Check,
  Lock, Unlock, Globe, Zap, AlertCircle, X, CheckCircle,
  Clock, XCircle, Eye, EyeOff
} from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

// ── Chip SVG ────────────────────────────────────────────────────
const Chip = () => (
  <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
    <rect width="40" height="32" rx="5" fill="#C9A84C" opacity="0.9"/>
    <rect x="13" y="0" width="14" height="32" fill="#b08c32" opacity="0.4"/>
    <rect x="0" y="10" width="40" height="12" fill="#b08c32" opacity="0.4"/>
    <rect x="13" y="10" width="14" height="12" rx="1" fill="#C9A84C" opacity="0.6"/>
  </svg>
)

// ── Network Logo ─────────────────────────────────────────────────
const NetworkLogo = ({ network }) => {
  if (network === 'rupay') return (
    <div style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '0.85rem', color: '#fff', letterSpacing: '-0.02em' }}>
      RuPay
    </div>
  )
  if (network === 'mastercard') return (
    <div style={{ display: 'flex', gap: '-4px' }}>
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#eb001b', opacity: 0.9 }} />
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f79e1b', opacity: 0.9, marginLeft: '-8px' }} />
    </div>
  )
  // Visa
  return (
    <div style={{ fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em', fontStyle: 'italic' }}>
      VISA
    </div>
  )
}

// ── Physical Card Component ───────────────────────────────────────
const PhysicalCard = ({ card, flipped, onFlip }) => {
  const isDebit  = card.card_type === 'debit'
  const isActive = card.status === 'active'

  const gradients = {
    debit:  'linear-gradient(135deg, #0A1628 0%, #1a3a6b 40%, #0f2547 70%, #0A1628 100%)',
    credit: 'linear-gradient(135deg, #1a0a28 0%, #3a1a6b 40%, #2a0f47 70%, #1a0a28 100%)',
  }

  return (
    <div onClick={onFlip} style={{ width: '100%', maxWidth: '380px', aspectRatio: '1.586', perspective: '1000px', cursor: 'pointer', position: 'relative' }}>
      <div style={{
        width: '100%', height: '100%',
        position: 'relative', transformStyle: 'preserve-3d',
        transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>

        {/* FRONT */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: '1rem',
          background: isDebit ? gradients.debit : gradients.credit,
          border: `1px solid rgba(201,168,76,${isActive ? '0.4' : '0.15'})`,
          padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: isActive ? '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(201,168,76,0.1)' : '0 10px 30px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-20px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(201,168,76,0.04)', pointerEvents: 'none' }} />

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                AND Bank
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: C.gold, letterSpacing: '0.05em' }}>
                {isDebit ? 'Debit Card' : 'Credit Card'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {card.is_contactless && <Wifi size={18} color="rgba(255,255,255,0.5)" style={{ transform: 'rotate(90deg)' }} />}
              <div style={{
                padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.6rem', fontWeight: 700,
                background: isActive ? 'rgba(34,197,94,0.15)' : card.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                color: isActive ? '#22c55e' : card.status === 'pending' ? '#f59e0b' : '#ef4444',
                border: `1px solid ${isActive ? 'rgba(34,197,94,0.3)' : card.status === 'pending' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                {card.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Chip + Contactless */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Chip />
          </div>

          {/* Card Number */}
          <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
            {card.card_number || '**** **** **** ****'}
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Card Holder</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.05em' }}>
                {card.holder_name}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Expires</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>
                {card.expiry}
              </div>
            </div>
            <NetworkLogo network={card.network} />
          </div>
        </div>

        {/* BACK */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: '1rem',
          background: isDebit ? gradients.debit : gradients.credit,
          border: `1px solid rgba(201,168,76,0.2)`, transform: 'rotateY(180deg)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* Magnetic stripe */}
          <div style={{ height: '48px', background: 'rgba(0,0,0,0.7)', margin: '1.5rem 0 1rem' }} />
          {/* Signature strip */}
          <div style={{ margin: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, height: '36px', background: 'linear-gradient(90deg,#e5e7eb,#f9fafb)', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '0.75rem' }}>
              <span style={{ fontFamily: 'cursive', color: '#374151', fontSize: '0.8rem', opacity: 0.5 }}>Authorized Signature</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '0.4rem 0.75rem' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.1rem' }}>CVV</div>
              <div style={{ fontFamily: 'monospace', color: 'white', fontWeight: 700 }}>•••</div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', padding: '0 1.5rem 1.5rem', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>AND Bank Private Ltd</div>
            <NetworkLogo network={card.network} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Toggle Row ────────────────────────────────────────────────────
const ToggleRow = ({ icon: Icon, label, sub, enabled, onToggle, disabled }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 0', borderBottom: `1px solid ${C.border}` }}>
    <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: enabled ? C.goldDim : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} color={enabled ? C.gold : C.muted} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ color: 'white', fontWeight: 500, fontSize: '0.875rem' }}>{label}</div>
      <div style={{ color: C.muted, fontSize: '0.75rem' }}>{sub}</div>
    </div>
    <button onClick={onToggle} disabled={disabled}
      style={{ width: '44px', height: '24px', borderRadius: '999px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', position: 'relative', background: enabled ? C.gold : 'rgba(255,255,255,0.1)', transition: 'background 0.2s', opacity: disabled ? 0.4 : 1 }}>
      <div style={{ position: 'absolute', top: '3px', left: enabled ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  </div>
)

// ── Credit Card Application Modal ─────────────────────────────────
const ApplyModal = ({ onClose, onSuccess, holderName }) => {
  const [form, setForm]     = useState({ annual_income: '', employment_type: 'salaried', purpose: '', holder_name: holderName || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const EMPLOYMENT = ['salaried', 'self-employed', 'business', 'freelancer', 'student', 'retired']

  const submit = async () => {
    if (!form.annual_income || parseFloat(form.annual_income) < 100000)
      { setError('Minimum annual income of ₹1,00,000 required'); return }
    if (!form.purpose.trim())
      { setError('Please describe why you need this card'); return }

    setLoading(true); setError('')
    try {
      const res = await api.post('/api/cards/', { ...form, card_type: 'credit' })
      onSuccess(res.data.card)
    } catch (e) {
      setError(e.response?.data?.detail || 'Application failed')
    } finally { setLoading(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0d1a35', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', color: 'white', marginBottom: '0.25rem' }}>Apply for Credit Card</h2>
            <p style={{ color: C.muted, fontSize: '0.8rem' }}>Fill in your details — admin will review within 24 hours</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={20} /></button>
        </div>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', color: '#f87171', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={S.label}>Name on Card</label>
            <input value={form.holder_name} onChange={e => setForm(f => ({ ...f, holder_name: e.target.value }))} style={{ ...S.input, marginTop: '0.5rem' }} placeholder="As per your ID" />
          </div>
          <div>
            <label style={S.label}>Annual Income (₹)</label>
            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: C.gold, fontWeight: 700 }}>₹</span>
              <input type="number" value={form.annual_income} onChange={e => setForm(f => ({ ...f, annual_income: e.target.value }))} style={{ ...S.input, paddingLeft: '2rem' }} placeholder="500000" />
            </div>
            <p style={{ color: C.muted, fontSize: '0.7rem', marginTop: '0.35rem' }}>Minimum ₹1,00,000 per year</p>
          </div>
          <div>
            <label style={S.label}>Employment Type</label>
            <select value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))}
              style={{ ...S.input, marginTop: '0.5rem', appearance: 'none', cursor: 'pointer' }}>
              {EMPLOYMENT.map(e => <option key={e} value={e} style={{ background: '#0d1a35' }}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Purpose / Reason</label>
            <textarea value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} rows={3}
              placeholder="Why do you need a credit card? (travel, business expenses, etc.)"
              style={{ ...S.input, marginTop: '0.5rem', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* Credit limits info */}
        <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: C.muted, marginBottom: '0.5rem' }}>Credit limit is set by the admin based on your profile. Typical ranges:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
            {[['Income < 3L', '₹25,000'], ['Income 3–6L', '₹50,000'], ['Income 6–12L', '₹1,00,000'], ['Income > 12L', '₹2,00,000+']].map(([inc, lim]) => (
              <div key={inc} style={{ fontSize: '0.7rem', color: C.muted }}><span style={{ color: 'white' }}>{lim}</span> — {inc}</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ ...S.btnGhost, flex: 1 }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ ...S.btn, flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Submitting...' : <><CreditCard size={16} /> Submit Application</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function Cards() {
  const [cards,     setCards]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(0)
  const [flipped,   setFlipped]   = useState(false)
  const [showApply, setShowApply] = useState(false)
  const [toggling,  setToggling]  = useState(false)
  const [msg,       setMsg]       = useState({ type: '', text: '' })
  const navigate = useNavigate()

  const user    = JSON.parse(sessionStorage.getItem('user') || '{}')
  const card    = cards[selected]
  const isActive = card?.status === 'active'

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) { navigate('/login'); return }
    fetchCards()
  }, [])

  const fetchCards = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/cards/')
      setCards(res.data.results || [])
    } catch { } finally { setLoading(false) }
  }

  const showMsg = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const toggle = async (field) => {
    if (!card || !isActive) return
    setToggling(true)
    try {
      const res = await api.patch(`/api/cards/${card.id}/settings/`, { [field]: !card[field] })
      setCards(cs => cs.map((c, i) => i === selected ? { ...c, ...res.data } : c))
    } catch (e) { showMsg('error', e.response?.data?.detail || 'Update failed') }
    finally { setToggling(false) }
  }

  const blockUnblock = async (action) => {
    if (!card) return
    setToggling(true)
    try {
      const res = await api.post(`/api/cards/${card.id}/action/`, { action })
      setCards(cs => cs.map((c, i) => i === selected ? { ...c, ...res.data.card } : c))
      showMsg('success', action === 'block' ? 'Card blocked successfully' : 'Card unblocked')
    } catch (e) { showMsg('error', e.response?.data?.detail || 'Action failed') }
    finally { setToggling(false) }
  }

  const hasActiveCreditCard = cards.some(c => c.card_type === 'credit' && ['active', 'pending'].includes(c.status))

  if (loading) return (
    <div style={S.page}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '3rem', height: '3rem', border: `3px solid ${C.goldDim}`, borderTop: `3px solid ${C.gold}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.75rem', color: 'white', marginBottom: '0.25rem' }}>My Cards</h1>
            <p style={{ color: C.muted, fontSize: '0.875rem' }}>Manage your debit and credit cards</p>
          </div>
          {!hasActiveCreditCard && (
            <button onClick={() => setShowApply(true)}
              style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={16} /> Apply for Credit Card
            </button>
          )}
        </div>

        {/* Toast */}
        {msg.text && (
          <div style={{ marginBottom: '1rem', padding: '0.875rem', background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '0.75rem', color: msg.type === 'success' ? '#22c55e' : '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg.text}
          </div>
        )}

        {cards.length === 0 ? (
          /* No cards state */
          <div style={{ ...S.card, textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ width: '5rem', height: '5rem', borderRadius: '1rem', background: C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <CreditCard size={36} color={C.gold} />
            </div>
            <h2 style={{ fontFamily: 'Georgia,serif', color: 'white', fontSize: '1.3rem', marginBottom: '0.75rem' }}>No Cards Yet</h2>
            <p style={{ color: C.muted, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Your debit card will appear here once your account is set up.
            </p>
            <button onClick={() => setShowApply(true)} style={{ ...S.btn, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={16} /> Apply for Credit Card
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

            {/* LEFT — Card display */}
            <div>
              {/* Card selector tabs */}
              {cards.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {cards.map((c, i) => (
                    <button key={c.id} onClick={() => { setSelected(i); setFlipped(false) }}
                      style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: `1px solid ${i === selected ? C.gold : C.border}`, background: i === selected ? C.goldDim : 'transparent', color: i === selected ? C.gold : C.muted, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                      {c.card_type === 'debit' ? '💳' : '🏦'} •••• {c.card_number_last4}
                    </button>
                  ))}
                </div>
              )}

              {/* Physical card */}
              <div style={{ marginBottom: '1rem' }}>
                <PhysicalCard card={card} flipped={flipped} onFlip={() => setFlipped(f => !f)} />
              </div>
              <p style={{ textAlign: 'center', color: C.muted, fontSize: '0.7rem', marginBottom: '1.5rem' }}>
                Click card to flip
              </p>

              {/* Card type badge */}
              <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: card.card_type === 'debit' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={22} color={card.card_type === 'debit' ? '#3b82f6' : '#8b5cf6'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: 600 }}>{card.card_type === 'debit' ? 'RuPay Debit Card' : 'Visa Credit Card'}</div>
                  <div style={{ color: C.muted, fontSize: '0.75rem' }}>
                    {card.card_type === 'debit'
                      ? `Daily limit: ${fmt.currency(card.daily_limit)}`
                      : card.status === 'active' ? `Credit limit: ${fmt.currency(card.credit_limit)}` : card.status === 'pending' ? 'Application under review' : card.status}
                  </div>
                </div>
                <ChevronRight size={16} color={C.muted} />
              </div>

              {/* Pending notice */}
              {card.status === 'pending' && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                  <Clock size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Application Under Review</div>
                    <div style={{ color: C.muted, fontSize: '0.75rem' }}>Your credit card application has been submitted. Admin will review within 24 hours. You'll see it activate here once approved.</div>
                  </div>
                </div>
              )}

              {card.status === 'rejected' && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                  <XCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Application Rejected</div>
                    <div style={{ color: C.muted, fontSize: '0.75rem' }}>{card.admin_note || 'Your application did not meet the criteria. You may re-apply after 30 days.'}</div>
                    <button onClick={() => setShowApply(true)} style={{ ...S.btnSm, marginTop: '0.75rem' }}>Re-apply</button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Card controls */}
              {isActive && (
                <div style={S.card}>
                  <h3 style={{ fontFamily: 'Georgia,serif', color: 'white', fontSize: '1rem', marginBottom: '0.25rem' }}>Card Controls</h3>
                  <p style={{ color: C.muted, fontSize: '0.75rem', marginBottom: '1rem' }}>Toggle features on or off instantly</p>

                  <ToggleRow icon={Wifi}  label="Contactless / Tap to Pay" sub="NFC payments at POS terminals" enabled={card.is_contactless}   onToggle={() => toggle('is_contactless')}   disabled={toggling} />
                  <ToggleRow icon={Globe} label="Online Transactions"       sub="E-commerce and app payments"  enabled={card.is_online_enabled} onToggle={() => toggle('is_online_enabled')} disabled={toggling} />
                  <ToggleRow icon={Zap}   label="International Usage"      sub="Payments outside India"       enabled={card.is_international}  onToggle={() => toggle('is_international')}  disabled={toggling} />

                  <div style={{ marginTop: '1rem', paddingTop: '1rem' }}>
                    {card.status === 'active' ? (
                      <button onClick={() => blockUnblock('block')} disabled={toggling}
                        style={{ ...S.btnGhost, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)', opacity: toggling ? 0.6 : 1 }}>
                        <Lock size={16} /> Block Card
                      </button>
                    ) : card.status === 'blocked' ? (
                      <button onClick={() => blockUnblock('unblock')} disabled={toggling}
                        style={{ ...S.btn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: toggling ? 0.6 : 1 }}>
                        <Unlock size={16} /> Unblock Card
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Card details */}
              <div style={S.card}>
                <h3 style={{ fontFamily: 'Georgia,serif', color: 'white', fontSize: '1rem', marginBottom: '1rem' }}>Card Details</h3>
                {[
                  ['Card Number',   card.card_number || '—'],
                  ['Card Type',     (card.card_type || '').toUpperCase()],
                  ['Network',       (card.network || '').toUpperCase()],
                  ['Expiry Date',   card.expiry],
                  ['Daily Limit',   fmt.currency(card.daily_limit)],
                  card.card_type === 'credit' && card.status === 'active'
                    ? ['Credit Limit', fmt.currency(card.credit_limit)]
                    : null,
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.muted, fontSize: '0.8rem' }}>{label}</span>
                    <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 600, fontFamily: label.includes('Number') ? 'monospace' : 'inherit' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Security notice */}
              <div style={{ padding: '1rem', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                <Shield size={18} color={C.gold} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <div style={{ color: C.gold, fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem' }}>Zero Liability Protection</div>
                  <div style={{ color: C.muted, fontSize: '0.72rem' }}>Report unauthorized transactions within 3 days for full protection under RBI guidelines.</div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Apply Modal */}
      {showApply && (
        <ApplyModal
          holderName={`${user.first_name || ''} ${user.last_name || ''}`.trim().toUpperCase()}
          onClose={() => setShowApply(false)}
          onSuccess={(newCard) => {
            setCards(cs => [...cs, newCard])
            setShowApply(false)
            showMsg('success', 'Credit card application submitted! Admin will review within 24 hours.')
          }}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
