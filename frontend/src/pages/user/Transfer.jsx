import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, CheckCircle, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

const MODES = [
  { v:'imps', label:'IMPS', desc:'Instant · 24/7 · Up to ₹5L'  },
  { v:'neft', label:'NEFT', desc:'2-4 hrs · Batch settlement'   },
  { v:'rtgs', label:'RTGS', desc:'Instant · Min ₹2,00,000'      },
  { v:'upi',  label:'UPI',  desc:'Instant · Via UPI ID'         },
]
const STEPS = ['Recipient', 'Amount', 'MPIN', 'Done']

// ── MPIN Input ────────────────────────────────────────────────────
function MPINInput({ value, onChange, label = 'Enter MPIN' }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label style={S.label}>{label}</label>
      <div style={{ position: 'relative', marginTop: '0.5rem' }}>
        <Lock size={16} color={C.muted} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type={show ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={6}
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          style={{ ...S.input, paddingLeft: '2.5rem', paddingRight: '3rem', letterSpacing: '0.3em', fontSize: '1.1rem', fontWeight: 700 }}
        />
        <button onClick={() => setShow(s => !s)} type="button"
          style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', justifyContent: 'center' }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ width: '0.6rem', height: '0.6rem', borderRadius: '50%', background: i < value.length ? C.gold : 'rgba(255,255,255,0.1)', transition: 'background 0.15s' }} />
        ))}
      </div>
    </div>
  )
}

export default function Transfer() {
  const [step,      setStep]      = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [balance,   setBalance]   = useState(null)
  const [mpinSet,   setMpinSet]   = useState(true)
  const [result,    setResult]    = useState(null)
  const [recipient, setRecipient] = useState(null)
  const [form, setForm] = useState({ to_identifier: '', mode: 'imps', amount: '', remark: '', mpin: '' })
  const navigate = useNavigate()
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) { navigate('/login'); return }
    api.get('/api/accounts/balance/').then(r => {
      setBalance(r.data)
      setMpinSet(r.data.mpin_set || false)
    }).catch(() => {})
  }, [])

  const lookupRecipient = async () => {
    if (!form.to_identifier) { setError('Enter account number or UPI ID'); return }
    setLoading(true); setError('')
    try {
      const res = await api.get(`/api/accounts/lookup/?identifier=${form.to_identifier}`)
      setRecipient(res.data); setStep(1)
    } catch { setError('Recipient not found. Check the account number or UPI ID.') }
    finally { setLoading(false) }
  }

  const validateAmount = () => {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return 'Enter a valid amount'
    if (amt > parseFloat(balance?.balance || 0)) return 'Insufficient balance'
    if (form.mode === 'rtgs' && amt < 200000) return 'RTGS minimum is ₹2,00,000'
    return null
  }

  const handleSubmit = async () => {
    if (form.mpin.length !== 6) { setError('Enter your 6-digit MPIN'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/transactions/transfer/', {
        to_identifier: form.to_identifier,
        amount:        parseFloat(form.amount),
        mode:          form.mode,
        remark:        form.remark,
        mpin:          form.mpin,
      })
      setResult(res.data); setStep(3)
    } catch (e) {
      setError(e.response?.data?.detail || 'Transfer failed. Please try again.')
    } finally { setLoading(false) }
  }

  // ── MPIN not set — show setup prompt ────────────────────────────
  if (!mpinSet) return (
    <div style={S.page}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ ...S.card, maxWidth: '420px', width: '100%', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: C.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Lock size={28} color={C.gold} />
          </div>
          <h2 style={{ fontFamily: 'Georgia,serif', color: 'white', fontSize: '1.3rem', marginBottom: '0.75rem' }}>Set MPIN First</h2>
          <p style={{ color: C.muted, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            You need to set a 6-digit MPIN to authorise transactions. Go to your Profile to set it up.
          </p>
          <button onClick={() => navigate('/profile')} style={{ ...S.btn, width: '100%' }}>
            Go to Profile → Set MPIN
          </button>
        </div>
      </main>
    </div>
  )

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: '700px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.75rem', color: 'white' }}>Transfer Money</h1>
          <p style={{ color: C.muted, fontSize: '0.875rem' }}>Send money securely via NEFT, RTGS, IMPS or UPI</p>
        </div>

        {/* Balance */}
        {balance && (
          <div style={{ ...S.card, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: C.muted, fontSize: '0.875rem' }}>Available Balance</span>
            <span style={{ color: C.gold, fontWeight: 700, fontSize: '1.1rem' }}>{fmt.currency(balance.balance)}</span>
          </div>
        )}

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          {STEPS.map((l, i) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
                  background: i < step ? C.gold : i === step ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
                  color: i < step ? C.navy : i === step ? C.gold : C.muted,
                  border: i === step ? `2px solid ${C.gold}` : 'none' }}>
                  {i < step ? '✓' : i === 2 ? '🔐' : i + 1}
                </div>
                <span style={{ fontSize: '0.65rem', color: i === step ? C.gold : C.muted, marginTop: '0.3rem', whiteSpace: 'nowrap' }}>{l}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '1px', background: i < step ? C.gold : C.border, margin: '0 0.5rem', marginBottom: '1.2rem' }} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.875rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', color: '#f87171', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div style={S.card}>

          {/* STEP 0 — Recipient */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', color: 'white' }}>Who are you sending to?</h2>
              <div>
                <label style={S.label}>Account Number or UPI ID</label>
                <input value={form.to_identifier} onChange={e => set('to_identifier', e.target.value)}
                  placeholder="AND123456789012 or name.surname1234@andbank"
                  style={{ ...S.input, marginTop: '0.5rem' }}
                  onKeyDown={e => e.key === 'Enter' && lookupRecipient()} />
              </div>
              <button onClick={lookupRecipient} disabled={loading}
                style={{ ...S.btn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Looking up...' : <><ArrowRight size={16} /> Continue</>}
              </button>
            </div>
          )}

          {/* STEP 1 — Amount & Mode */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', color: 'white' }}>Amount & Mode</h2>
                <div style={{ background: C.goldDim, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '0.625rem', padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: C.gold }}>
                  To: {recipient?.name || form.to_identifier}
                </div>
              </div>
              <div>
                <label style={S.label}>Amount (₹)</label>
                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: C.gold, fontWeight: 700, fontSize: '1.1rem' }}>₹</span>
                  <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} min="1"
                    placeholder="0.00" style={{ ...S.input, paddingLeft: '2rem', fontSize: '1.1rem', fontWeight: 700 }} />
                </div>
                {/* Quick amounts */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {[500, 1000, 2000, 5000, 10000].map(amt => (
                    <button key={amt} onClick={() => set('amount', String(amt))}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${form.amount == amt ? C.gold : C.border}`, background: form.amount == amt ? C.goldDim : 'transparent', color: form.amount == amt ? C.gold : C.muted, cursor: 'pointer' }}>
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>Payment Mode</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {MODES.map(m => (
                    <button key={m.v} onClick={() => set('mode', m.v)}
                      style={{ padding: '0.875rem', borderRadius: '0.75rem', textAlign: 'left', cursor: 'pointer', border: `2px solid ${form.mode === m.v ? C.gold : 'rgba(255,255,255,0.08)'}`, background: form.mode === m.v ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)' }}>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{m.label}</div>
                      <div style={{ color: C.muted, fontSize: '0.72rem', marginTop: '0.2rem' }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>Remark (optional)</label>
                <input value={form.remark} onChange={e => set('remark', e.target.value)}
                  placeholder="Rent, food, etc." style={{ ...S.input, marginTop: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setStep(0)} style={{ ...S.btnGhost, flex: 1 }}>Back</button>
                <button onClick={() => { const err = validateAmount(); if (err) { setError(err); return } setError(''); set('mpin', ''); setStep(2) }}
                  style={{ ...S.btn, flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — MPIN */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', color: 'white' }}>Confirm with MPIN</h2>

              {/* Summary */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                {[
                  ['To',     recipient?.name ? `${recipient.name} (${form.to_identifier})` : form.to_identifier],
                  ['Amount', fmt.currency(form.amount)],
                  ['Mode',   form.mode.toUpperCase()],
                  ['Charges', `₹${{ neft:'2.50', rtgs:'25', imps:'5', upi:'0' }[form.mode] || '0'}`],
                  ...(form.remark ? [['Remark', form.remark]] : []),
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ color: C.muted, fontSize: '0.875rem' }}>{k}</span>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{v}</span>
                  </div>
                ))}
              </div>

              <MPINInput value={form.mpin} onChange={v => set('mpin', v)} label="Enter your 6-digit MPIN" />

              <div style={{ padding: '0.875rem', background: 'rgba(201,168,76,0.05)', border: `1px solid rgba(201,168,76,0.15)`, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: C.muted }}>
                <Shield size={16} color={C.gold} /> Your MPIN is encrypted and never stored in plain text.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { setStep(1); setError('') }} style={{ ...S.btnGhost, flex: 1 }}>Back</button>
                <button onClick={handleSubmit} disabled={loading || form.mpin.length !== 6}
                  style={{ ...S.btn, flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (loading || form.mpin.length !== 6) ? 0.6 : 1 }}>
                  {loading ? 'Processing...' : <><Lock size={16} /> Confirm Transfer</>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Success */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle size={40} color="#22c55e" />
              </div>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>Transfer Successful!</h2>
              <p style={{ color: C.muted, marginBottom: '0.5rem' }}>
                {fmt.currency(form.amount)} sent to {recipient?.name || form.to_identifier}
              </p>
              <p style={{ color: C.muted, fontSize: '0.8rem', marginBottom: '1.5rem' }}>via {form.mode.toUpperCase()}</p>
              {result?.txn_id && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: C.muted }}>
                  Txn ID: {result.txn_id}
                </div>
              )}
              {result?.balance_after && (
                <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: C.muted }}>
                  New Balance: <span style={{ color: C.gold, fontWeight: 700 }}>{fmt.currency(result.balance_after)}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button onClick={() => { setStep(0); setForm({ to_identifier: '', mode: 'imps', amount: '', remark: '', mpin: '' }); setRecipient(null); setResult(null); setError('') }} style={S.btnGhost}>
                  New Transfer
                </button>
                <button onClick={() => navigate('/statement')} style={S.btn}>View Statement</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
