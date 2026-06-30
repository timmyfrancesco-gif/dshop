export default function WhyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: '40px 32px', maxWidth: 480, width: '100%', color: '#fff' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>🔐 Perché dobbiamo verificarti?</h1>
        <p style={{ color: '#aaa', lineHeight: 1.7 }}>
          La verifica serve a proteggere la community da bot e account falsi.<br /><br />
          Il processo richiede solo il tuo account Discord (leggiamo solo il tuo ID, niente altro) e un captcha Cloudflare. Nessun dato viene condiviso con terze parti.
        </p>
      </div>
    </div>
  )
}
