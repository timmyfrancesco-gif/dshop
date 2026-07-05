export default function VerifyErrorPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Verification failed</h1>
        <p style={{ color: '#aaa' }}>An error occurred. Go back to Discord and try again.</p>
      </div>
    </div>
  )
}
