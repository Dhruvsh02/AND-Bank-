export const C = {
  bg:       '#06101F',
  navy:     '#0A1628',
  card:     '#112240',
  border:   'rgba(255,255,255,0.06)',
  gold:     '#C9A84C',
  goldLight:'#E4C57A',
  goldDim:  'rgba(201,168,76,0.15)',
  text:     '#ffffff',
  muted:    '#9ca3af',
  dim:      '#6b7280',
  success:  '#22c55e',
  danger:   '#ef4444',
  warning:  '#f59e0b',
  info:     '#3b82f6',
}

export const S = {
  page: { minHeight:'100vh', backgroundColor:C.bg, display:'flex' },
  card: { backgroundColor:C.card, border:`1px solid ${C.border}`, borderRadius:'1rem', padding:'1.5rem' },
  label: { display:'block', fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:C.muted, marginBottom:'0.5rem' },
  input: { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.75rem', padding:'0.875rem 1rem', color:'#ffffff', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' },
  btn:   { background:'linear-gradient(135deg,#C9A84C,#b08c32)', color:'#0A1628', fontWeight:700, padding:'0.75rem 1.5rem', borderRadius:'0.75rem', border:'none', cursor:'pointer', fontSize:'0.875rem' },
  btnSm: { background:'linear-gradient(135deg,#C9A84C,#b08c32)', color:'#0A1628', fontWeight:700, padding:'0.5rem 1rem', borderRadius:'0.5rem', border:'none', cursor:'pointer', fontSize:'0.8rem' },
  btnGhost: { background:'rgba(255,255,255,0.05)', color:'#ffffff', fontWeight:600, padding:'0.75rem 1.5rem', borderRadius:'0.75rem', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontSize:'0.875rem' },
}

export const fmt = {
  currency: (n) => new Intl.NumberFormat('en-IN',{ style:'currency', currency:'INR', maximumFractionDigits:2 }).format(n || 0),
  date:     (d) => new Date(d).toLocaleDateString('en-IN',{ day:'2-digit', month:'short', year:'numeric' }),
  datetime: (d) => new Date(d).toLocaleString('en-IN',{ day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }),
}
