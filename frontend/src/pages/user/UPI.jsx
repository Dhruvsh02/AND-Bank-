import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Copy, Check, QrCode, ArrowRight } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S, fmt } from '../../utils/styles'

export default function UPI() {
  const [account, setAccount] = useState(null)
  const [tab,     setTab]     = useState('send')
  const [upiId,   setUpiId]   = useState('')
  const [amount,  setAmount]  = useState('')
  const [remark,  setRemark]  = useState('')
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')
  const [showQR,  setShowQR]  = useState(false)
  const qrRef    = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) { navigate('/login'); return }
    api.get('/api/accounts/balance/').then(r => setAccount(r.data)).catch(() => {})
  }, [])

  const copy = () => {
    navigator.clipboard.writeText(account?.upi_id || '')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // Draw QR code on canvas using UPI deep-link format
  const drawQR = useCallback(() => {
    if (!qrRef.current || !account?.upi_id) return
    const canvas = qrRef.current
    const ctx    = canvas.getContext('2d')
    const size   = 200
    canvas.width  = size
    canvas.height = size

    // UPI payment string
    const upiStr = `upi://pay?pa=${account.upi_id}&pn=AND+Bank&mc=0000&mode=02&purpose=00`

    // Use QR generation via Google Charts API (works offline via URL)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiStr)}&bgcolor=0A1628&color=C9A84C&format=png`
    img.onload = () => { ctx.drawImage(img, 0, 0, size, size) }
    img.onerror = () => {
      // Fallback: draw a simple pattern indicating QR unavailable
      ctx.fillStyle = '#0A1628'
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#C9A84C'
      ctx.font = 'bold 13px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('QR Code', size/2, size/2 - 10)
      ctx.font = '10px monospace'
      ctx.fillStyle = '#9ca3af'
      ctx.fillText(account?.upi_id || '', size/2, size/2 + 10)
    }
  }, [account?.upi_id])

  useEffect(() => { if (showQR) drawQR() }, [showQR, drawQR])

  const sendUPI = async () => {
    if (!upiId || !amount) { setError('Enter UPI ID and amount'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/transactions/transfer/', { to_identifier:upiId, amount:parseFloat(amount), mode:'upi', remark })
      setResult(res.data)
    } catch (e) { setError(e.response?.data?.detail || 'UPI transfer failed') }
    finally { setLoading(false) }
  }

  const tabBtn = (t, label) => (
    <button onClick={() => setTab(t)}
      style={{flex:1, padding:'0.75rem', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.875rem', transition:'all 0.15s', borderRadius:'0.625rem',
        background: tab===t ? C.gold : 'transparent',
        color:       tab===t ? C.navy : C.muted }}>
      {label}
    </button>
  )

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{flex:1, overflowY:'auto', padding:'2rem', maxWidth:'600px'}}>
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontFamily:'Georgia,serif', fontSize:'1.75rem', color:'white'}}>UPI Payments</h1>
          <p style={{color:C.muted, fontSize:'0.875rem'}}>Send & receive money instantly via UPI</p>
        </div>

        {/* Your UPI card */}
        <div style={{background:`linear-gradient(135deg,#0A1628,#1a3a6b)`, border:`1px solid rgba(201,168,76,0.2)`, borderRadius:'1.25rem', padding:'1.75rem', marginBottom:'1.5rem'}}>
          <div style={{fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:C.gold, marginBottom:'1rem'}}>Your UPI ID</div>
          <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem'}}>
            <div style={{width:'3rem', height:'3rem', borderRadius:'0.75rem', background:C.goldDim, display:'flex', alignItems:'center', justifyContent:'center'}}>
              <Smartphone size={24} color={C.gold} />
            </div>
            <div>
              <div style={{color:'white', fontWeight:700, fontSize:'1.1rem', fontFamily:'monospace'}}>{account?.upi_id || '—'}</div>
              <div style={{color:C.muted, fontSize:'0.75rem'}}>Linked to {account?.account_number}</div>
            </div>
          </div>
          <div style={{display:'flex', gap:'0.75rem'}}>
            <button onClick={copy} style={{...S.btnGhost, display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8rem', padding:'0.5rem 1rem'}}>
              {copied ? <><Check size={14} color="#22c55e" /> Copied!</> : <><Copy size={14} /> Copy UPI ID</>}
            </button>
            <button onClick={() => setShowQR(true)} style={{...S.btnGhost, display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8rem', padding:'0.5rem 1rem'}}>
              <QrCode size={14} /> Show QR
            </button>
          </div>
        </div>

        {/* Send / Receive Tabs */}
        <div style={{...S.card}}>
          <div style={{display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:'0.75rem', padding:'0.3rem', marginBottom:'1.5rem'}}>
            {tabBtn('send',    'Send Money')}
            {tabBtn('receive', 'Receive Money')}
          </div>

          {tab === 'send' && (
            result
              ? <div style={{textAlign:'center', padding:'1rem 0'}}>
                  <div style={{width:'4rem',height:'4rem',borderRadius:'50%',background:'rgba(34,197,94,0.1)',border:'2px solid rgba(34,197,94,0.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem'}}>
                    <Check size={32} color="#22c55e" />
                  </div>
                  <h3 style={{color:'white',fontFamily:'Georgia,serif',fontSize:'1.2rem',marginBottom:'0.5rem'}}>Payment Sent!</h3>
                  <p style={{color:C.muted,fontSize:'0.875rem',marginBottom:'1.5rem'}}>{fmt.currency(amount)} → {upiId}</p>
                  <button onClick={() => {setResult(null);setUpiId('');setAmount('');setRemark('')}} style={S.btn}>Send Another</button>
                </div>
              : <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                  {error && <div style={{padding:'0.75rem',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'0.75rem',color:'#f87171',fontSize:'0.875rem'}}>{error}</div>}
                  <div>
                    <label style={S.label}>Recipient UPI ID</label>
                    <input value={upiId} onChange={e=>setUpiId(e.target.value)} placeholder="name@andbank or name@upi" style={{...S.input,marginTop:'0.5rem'}} />
                  </div>
                  <div>
                    <label style={S.label}>Amount (₹)</label>
                    <div style={{position:'relative'}}>
                      <span style={{position:'absolute',left:'1rem',top:'50%',transform:'translateY(-50%)',color:C.gold,fontWeight:700}}>₹</span>
                      <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={{...S.input,paddingLeft:'2rem',marginTop:'0.5rem'}} />
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Remark (optional)</label>
                    <input value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Paying for..." style={{...S.input,marginTop:'0.5rem'}} />
                  </div>
                  <button onClick={sendUPI} disabled={loading}
                    style={{...S.btn,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',opacity:loading?0.7:1}}>
                    {loading ? 'Processing...' : <><ArrowRight size={16}/> Pay via UPI</>}
                  </button>
                </div>
          )}

          {tab === 'receive' && (
            <div style={{textAlign:'center',padding:'1rem 0'}}>
              <div onClick={() => setShowQR(true)} style={{width:'12rem',height:'12rem',borderRadius:'1rem',overflow:'hidden',margin:'0 auto 1.5rem',cursor:'pointer',border:`2px solid rgba(201,168,76,0.3)`}}>
                <canvas ref={qrRef} width="200" height="200" style={{width:'100%',height:'100%'}} />
              </div>
              <p style={{color:C.muted,fontSize:'0.875rem',marginBottom:'0.5rem'}}>Share your UPI ID to receive payments</p>
              <div style={{fontFamily:'monospace',color:C.gold,fontWeight:700,fontSize:'1rem',marginBottom:'1.5rem'}}>{account?.upi_id}</div>
              <button onClick={copy} style={{...S.btn,display:'inline-flex',alignItems:'center',gap:'0.5rem'}}>
                {copied ? <><Check size={16}/>Copied!</> : <><Copy size={16}/>Copy UPI ID</>}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* QR Modal */}
      {showQR && (
        <div onClick={() => setShowQR(false)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'2rem'}}>
          <div onClick={e => e.stopPropagation()}
            style={{background:'#0d1a35',border:'1px solid rgba(201,168,76,0.3)',borderRadius:'1.25rem',padding:'2rem',textAlign:'center',maxWidth:'320px',width:'100%'}}>
            <h3 style={{fontFamily:'Georgia,serif',color:'white',fontSize:'1.2rem',marginBottom:'0.5rem'}}>Scan to Pay</h3>
            <p style={{color:C.muted,fontSize:'0.75rem',marginBottom:'1.5rem'}}>Open any UPI app and scan this QR code</p>
            <div style={{borderRadius:'0.75rem',overflow:'hidden',display:'inline-block',border:'2px solid rgba(201,168,76,0.2)'}}>
              <canvas ref={qrRef} width="200" height="200" style={{display:'block'}} />
            </div>
            <div style={{marginTop:'1rem',fontFamily:'monospace',color:'#C9A84C',fontWeight:700,fontSize:'0.9rem'}}>{account?.upi_id}</div>
            <button onClick={() => setShowQR(false)}
              style={{marginTop:'1.25rem',...S.btnGhost,padding:'0.5rem 1.5rem',fontSize:'0.875rem'}}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
