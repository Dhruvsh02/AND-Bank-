import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

const MODES = [
  { v:'imps', label:'IMPS', desc:'Instant · 24/7 · Up to ₹5L',    limit:'5,00,000' },
  { v:'neft', label:'NEFT', desc:'2-4 hrs · Batch settlement',      limit:'No limit' },
  { v:'rtgs', label:'RTGS', desc:'Instant · Min ₹2L',              limit:'No limit' },
  { v:'upi',  label:'UPI',  desc:'Instant · Via UPI ID',           limit:'1,00,000' },
]

const STEP_LABELS = ['Recipient', 'Amount & Mode', 'Review', 'Done']

export default function Transfer() {
  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [balance, setBalance] = useState(null)
  const [result,  setResult]  = useState(null)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    to_identifier: '', mode: 'imps',
    amount: '', remark: '', otp: '',
  })
  const [recipient, setRecipient] = useState(null)

  const set = (k,v) => setForm(p => ({...p, [k]:v}))

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) { navigate('/login'); return }
    api.get('/api/accounts/balance/').then(r => setBalance(r.data)).catch(() => {})
  }, [])

  const lookupRecipient = async () => {
    if (!form.to_identifier) { setError('Enter account number or UPI ID'); return }
    setLoading(true); setError('')
    try {
      const res = await api.get(`/api/accounts/lookup/?identifier=${form.to_identifier}`)
      setRecipient(res.data)
      setStep(1)
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
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/transactions/transfer/', {
        to_identifier:  form.to_identifier,
        amount:         parseFloat(form.amount),
        mode:           form.mode,
        remark:         form.remark,
      })
      setResult(res.data)
      setStep(3)
    } catch (e) {
      setError(e.response?.data?.detail || 'Transfer failed. Please try again.')
      setStep(2)
    } finally { setLoading(false) }
  }

  const inp = (k, extra={}) => (
    <input style={S.input} value={form[k]} onChange={e => set(k, e.target.value)} {...extra} />
  )

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{flex:1, overflowY:'auto', padding:'2rem', maxWidth:'700px'}}>
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontFamily:'Georgia,serif', fontSize:'1.75rem', color:'white'}}>Transfer Money</h1>
          <p style={{color:C.muted, fontSize:'0.875rem'}}>Send money securely via NEFT, RTGS, IMPS or UPI</p>
        </div>

        {/* Balance pill */}
        {balance && (
          <div style={{...S.card, marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{color:C.muted, fontSize:'0.875rem'}}>Available Balance</span>
            <span style={{color:C.gold, fontWeight:700, fontSize:'1.1rem'}}>{fmt.currency(balance.balance)}</span>
          </div>
        )}

        {/* Step indicator */}
        <div style={{display:'flex', alignItems:'center', marginBottom:'2rem'}}>
          {STEP_LABELS.map((l, i) => (
            <div key={l} style={{display:'flex', alignItems:'center', flex: i < STEP_LABELS.length - 1 ? 1 : 0}}>
              <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                <div style={{width:'2rem', height:'2rem', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700,
                  background: i < step ? C.gold : i === step ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.05)',
                  color: i < step ? C.navy : i === step ? C.gold : C.muted,
                  border: i === step ? `2px solid ${C.gold}` : 'none'}}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{fontSize:'0.65rem', color: i===step ? C.gold : C.muted, marginTop:'0.3rem', whiteSpace:'nowrap'}}>{l}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div style={{flex:1, height:'1px', background: i < step ? C.gold : C.border, margin:'0 0.5rem', marginBottom:'1.2rem'}} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={{marginBottom:'1rem', padding:'0.875rem', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'0.75rem', color:'#f87171', fontSize:'0.875rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div style={S.card}>
          {/* STEP 0 — Recipient */}
          {step === 0 && (
            <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
              <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.2rem', color:'white'}}>Who are you sending to?</h2>
              <div>
                <label style={S.label}>Account Number or UPI ID</label>
                {inp('to_identifier', {placeholder:'AND123456789012 or name@andbank'})}
              </div>
              <button onClick={lookupRecipient} disabled={loading}
                style={{...S.btn, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', opacity:loading?0.7:1}}>
                {loading ? 'Looking up...' : <><ArrowRight size={16} /> Continue</>}
              </button>
            </div>
          )}

          {/* STEP 1 — Amount & Mode */}
          {step === 1 && (
            <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.2rem', color:'white'}}>Amount & Payment Mode</h2>
                <div style={{background:`rgba(201,168,76,0.1)`, border:`1px solid rgba(201,168,76,0.2)`, borderRadius:'0.625rem', padding:'0.5rem 0.875rem', fontSize:'0.8rem', color:C.gold}}>
                  To: {recipient?.name || form.to_identifier}
                </div>
              </div>

              <div>
                <label style={S.label}>Amount (₹)</label>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:C.gold, fontWeight:700, fontSize:'1.1rem'}}>₹</span>
                  <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} min="1"
                    placeholder="0.00" style={{...S.input, paddingLeft:'2rem', fontSize:'1.1rem', fontWeight:700}} />
                </div>
              </div>

              <div>
                <label style={S.label}>Payment Mode</label>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem'}}>
                  {MODES.map(m => (
                    <button key={m.v} type="button" onClick={() => set('mode', m.v)}
                      style={{padding:'0.875rem', borderRadius:'0.75rem', textAlign:'left', cursor:'pointer',
                        border:`2px solid ${form.mode===m.v ? C.gold : 'rgba(255,255,255,0.08)'}`,
                        background: form.mode===m.v ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)'}}>
                      <div style={{color:'white', fontWeight:700, fontSize:'0.9rem'}}>{m.label}</div>
                      <div style={{color:C.muted, fontSize:'0.72rem', marginTop:'0.2rem'}}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={S.label}>Remark (optional)</label>
                {inp('remark', {placeholder:'Rent, electricity, etc.'})}
              </div>

              <div style={{display:'flex', gap:'0.75rem'}}>
                <button onClick={() => setStep(0)} style={{...S.btnGhost, flex:1}}>Back</button>
                <button onClick={() => {
                  const err = validateAmount()
                  if (err) { setError(err); return }
                  setError(''); setStep(2)
                }} style={{...S.btn, flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'}}>
                  Review Transfer <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Review */}
          {step === 2 && (
            <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.2rem', color:'white'}}>Review & Confirm</h2>
              <div style={{background:'rgba(255,255,255,0.03)', borderRadius:'0.75rem', overflow:'hidden', border:`1px solid ${C.border}`}}>
                {[
                  ['To',      recipient?.name || form.to_identifier],
                  ['Account', form.to_identifier],
                  ['Amount',  fmt.currency(form.amount)],
                  ['Mode',    form.mode.toUpperCase()],
                  ['Remark',  form.remark || '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'0.875rem 1rem', borderBottom:`1px solid ${C.border}`}}>
                    <span style={{color:C.muted, fontSize:'0.875rem'}}>{k}</span>
                    <span style={{color:'white', fontWeight:600, fontSize:'0.875rem'}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{background:'rgba(201,168,76,0.06)', border:`1px solid rgba(201,168,76,0.15)`, borderRadius:'0.75rem', padding:'0.875rem', display:'flex', alignItems:'center', gap:'0.75rem', fontSize:'0.8rem', color:C.muted}}>
                <Shield size={16} color={C.gold} /> This transaction is secured and encrypted end-to-end.
              </div>
              <div style={{display:'flex', gap:'0.75rem'}}>
                <button onClick={() => setStep(1)} style={{...S.btnGhost, flex:1}}>Edit</button>
                <button onClick={handleSubmit} disabled={loading}
                  style={{...S.btn, flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', opacity:loading?0.7:1}}>
                  {loading ? 'Processing...' : <><Shield size={16} /> Confirm Transfer</>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Success */}
          {step === 3 && (
            <div style={{textAlign:'center', padding:'1rem 0'}}>
              <div style={{width:'5rem', height:'5rem', borderRadius:'50%', background:'rgba(34,197,94,0.1)', border:'2px solid rgba(34,197,94,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem'}}>
                <CheckCircle size={40} color="#22c55e" />
              </div>
              <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.5rem', color:'white', marginBottom:'0.5rem'}}>Transfer Successful!</h2>
              <p style={{color:C.muted, marginBottom:'1.5rem'}}>
                {fmt.currency(form.amount)} sent via {form.mode.toUpperCase()}
              </p>
              {result?.txn_id && (
                <div style={{background:'rgba(255,255,255,0.04)', borderRadius:'0.75rem', padding:'0.875rem', marginBottom:'1.5rem', fontFamily:'monospace', fontSize:'0.8rem', color:C.muted}}>
                  Txn ID: {result.txn_id}
                </div>
              )}
              <div style={{display:'flex', gap:'0.75rem', justifyContent:'center'}}>
                <button onClick={() => { setStep(0); setForm({to_identifier:'',mode:'imps',amount:'',remark:'',otp:''}); setRecipient(null); setResult(null) }}
                  style={S.btnGhost}>New Transfer</button>
                <button onClick={() => navigate('/statement')} style={S.btn}>View Statement</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
