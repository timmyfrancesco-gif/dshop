export default function WhyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: '40px 32px', maxWidth: 480, width: '100%', color: '#fff' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>🔐 Why do we need to verify you?</h1>
        <p style={{ color: '#aaa', lineHeight: 1.7 }}>
          Verification protects the community from bots and fake accounts.<br /><br />
          The process only needs your Discord account (we only read your ID, nothing else) and a quick automatic browser check. No data is shared with third parties.
        </p>
      </div>
    </div>
  )
}
