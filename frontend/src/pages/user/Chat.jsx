import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Bot, User as UserIcon } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import api from '../../services/api'
import { C, S } from '../../utils/styles'

const SUGGESTIONS = [
  'What is my account balance?',
  'How do I transfer money?',
  'What are the loan interest rates?',
  'How to set up UPI?',
  'Show my recent transactions',
]

export default function Chat() {
  const [messages, setMessages] = useState([
    { role:'assistant', text:`Hello! I'm your AND Bank assistant. How can I help you today?` }
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()
  const navigate  = useNavigate()

  useEffect(() => {
    if (!sessionStorage.getItem('access_token')) { navigate('/login'); return }
  }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(p => [...p, { role:'user', text: msg }])
    setLoading(true)
    try {
      const res = await api.post('/api/chat/message/', { message: msg })
      setMessages(p => [...p, { role:'assistant', text: res.data.reply || "I'm not sure about that. Please contact support." }])
    } catch {
      setMessages(p => [...p, { role:'assistant', text: "I'm having trouble connecting right now. Please try again shortly." }])
    } finally { setLoading(false) }
  }

  const Bubble = ({ msg }) => {
    const isBot = msg.role === 'assistant'
    return (
      <div style={{display:'flex', gap:'0.75rem', alignItems:'flex-end', justifyContent:isBot?'flex-start':'flex-end'}}>
        {isBot && (
          <div style={{width:'2rem',height:'2rem',borderRadius:'50%',background:C.goldDim,border:`1px solid rgba(201,168,76,0.3)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <Bot size={14} color={C.gold} />
          </div>
        )}
        <div style={{
          maxWidth:'70%', padding:'0.875rem 1rem', borderRadius:isBot?'1rem 1rem 1rem 0.25rem':'1rem 1rem 0.25rem 1rem',
          background: isBot ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${C.gold},#b08c32)`,
          color:       isBot ? 'white' : C.navy,
          fontSize:   '0.875rem', lineHeight:1.6,
          border:      isBot ? `1px solid ${C.border}` : 'none',
        }}>
          {msg.text}
        </div>
        {!isBot && (
          <div style={{width:'2rem',height:'2rem',borderRadius:'50%',background:`linear-gradient(135deg,${C.gold},#b08c32)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <UserIcon size={14} color={C.navy} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={{flex:1, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden'}}>
        {/* Header */}
        <div style={{padding:'1.5rem 2rem', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:'0.75rem'}}>
          <div style={{width:'2.5rem',height:'2.5rem',borderRadius:'50%',background:C.goldDim,border:`1px solid rgba(201,168,76,0.3)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Bot size={20} color={C.gold} />
          </div>
          <div>
            <div style={{color:'white', fontWeight:600}}>AND Bank Assistant</div>
            <div style={{color:'#22c55e', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:'0.35rem'}}>
              <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#22c55e',display:'inline-block'}} /> Online
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1, overflowY:'auto', padding:'1.5rem 2rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          {loading && (
            <div style={{display:'flex', gap:'0.75rem', alignItems:'flex-end'}}>
              <div style={{width:'2rem',height:'2rem',borderRadius:'50%',background:C.goldDim,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Bot size={14} color={C.gold} />
              </div>
              <div style={{padding:'1rem',background:'rgba(255,255,255,0.06)',borderRadius:'1rem 1rem 1rem 0.25rem',border:`1px solid ${C.border}`,display:'flex',gap:'0.4rem',alignItems:'center'}}>
                {[0,150,300].map(d => (
                  <div key={d} style={{width:'6px',height:'6px',borderRadius:'50%',background:C.muted,animation:'bounce 1s ease infinite',animationDelay:`${d}ms`}} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div style={{padding:'0 2rem', display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.75rem'}}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.border}`,borderRadius:'999px',padding:'0.375rem 0.875rem',fontSize:'0.75rem',color:C.muted,cursor:'pointer'}}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{padding:'1rem 2rem', borderTop:`1px solid ${C.border}`, display:'flex', gap:'0.75rem'}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
            placeholder="Ask me anything about your account..."
            style={{...S.input, flex:1}} />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{...S.btn, padding:'0.875rem', aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', opacity:!input.trim()||loading?0.5:1}}>
            <Send size={18} />
          </button>
        </div>
      </main>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }
      `}</style>
    </div>
  )
}
