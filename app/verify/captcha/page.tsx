'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function CaptchaInner() {
  const searchParams = useSearchParams()
  const session = searchParams.get('s')
  const [status, setStatus] = useState<'pending' | 'loading' | 'done' | 'error'>('pending')
  const [message, setMessage] = useState('')
  const [challenge, setChallenge] = useState<{ a: number; b: number; op: string; challengeToken: string } | null>(null)
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    if (!session) { setStatus('error'); setMessage('Missing session. Start again from the Discord link.'); return }
    fetch('/api/verify/challenge')
      .then((r) => r.json())
      .then((d) => setChallenge(d))
      .catch(() => { setStatus('error'); setMessage('Could not load verification. Try again.') })
  }, [session])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !challenge) return
    setStatus('loading')
    try {
      const res = await fetch('/api/verify/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, answer: Number(answer), challengeToken: challenge.challengeToken }),
      })
      if (res.ok) {
        setStatus('done')
      } else {
        const d = await res.json()
        setMessage(d.error || 'Verification failed.')
        setStatus('pending')
        setAnswer('')
        // Fetch a fresh challenge — the old one may have been consumed/expired.
        fetch('/api/verify/challenge').then((r) => r.json()).then(setChallenge).catch(() => {})
      }
    } catch {
      setMessage('Network error.')
      setStatus('pending')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        {status === 'done' ? (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Successfully verified!</h1>
            <p style={{ color: '#888' }}>Puoi chiudere questa pagina e tornare su Discord.</p>
          </>
        ) : (
          <>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Complete Verification</h1>
            <p style={{ color: '#888', marginBottom: 24 }}>Answer the question below to continue</p>
            {message && <p style={{ color: '#ff6b6b', marginBottom: 16, fontSize: 14 }}>{message}</p>}
            {challenge ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <label style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
                  {challenge.a} {challenge.op} {challenge.b} = ?
                </label>
                <input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: 120,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #2a2a2a',
                    background: '#0f0f0f',
                    color: '#fff',
                    fontSize: 16,
                    textAlign: 'center',
                  }}
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || answer === ''}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: status === 'loading' ? '#555' : '#90C6FF',
                    color: '#0f0f0f',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: status === 'loading' ? 'default' : 'pointer',
                  }}
                >
                  {status === 'loading' ? 'Verifying…' : 'Verify'}
                </button>
              </form>
            ) : (
              status !== 'error' && <p style={{ color: '#aaa', fontSize: 14 }}>Loading…</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function CaptchaPage() {
  return (
    <Suspense>
      <CaptchaInner />
    </Suspense>
  )
}
