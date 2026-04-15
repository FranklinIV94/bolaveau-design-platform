export default function Footer() {
  return (
    <div style={{
      height: 36,
      background: '#1a1a1a',
      borderTop: '1px solid rgba(201,168,76,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
      flexShrink: 0,
    }}>
      <span style={{ color: '#444', fontSize: 11 }}>
        Bolaveau Design Platform · Powered by Bolaveau Group
      </span>
    </div>
  )
}