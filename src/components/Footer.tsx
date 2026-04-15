export default function Footer() {
  return (
    <div style={{
      height: 36,
      background: '#111',
      borderTop: '1px solid rgba(201,168,76,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
      flexShrink: 0,
      gap: 12,
    }}>
      <span style={{ color: '#333', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>
        Bolaveau
      </span>
      <span style={{ color: '#222', fontSize: 10 }}>·</span>
      <span style={{ color: '#333', fontSize: 10 }}>
        Design Studio
      </span>
    </div>
  )
}