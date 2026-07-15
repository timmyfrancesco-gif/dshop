'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Brute-forces a suffix whose SHA-256(nonce + suffix) starts with
// `difficulty` zero hex chars — a small proof-of-work. Takes real CPU time
// (typically 1-3s), which is the point: it doesn't try to detect "human",
// it makes verifying many accounts in bulk expensive instead of free.
async function solvePow(nonce: string, difficulty: number, onProgress: (n: number) => void): Promise<number> {
  const target = '0'.repeat(difficulty)
  let counter = 0
  while (true) {
    const hex = await sha256Hex(nonce + counter)
    if (hex.startsWith(target)) return counter
    counter++
    if (counter % 200 === 0) onProgress(counter)
  }
}

function CaptchaInner() {
  const searchParams = useSearchParams()
  const session = searchParams.get('s')
  const [status, setStatus] = useState<'pending' | 'solving' | 'submitting' | 'done' | 'error'>('pending')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!session) { setStatus('error'); setMessage('Missing session. Start again from the Discord link.'); return }
    if (startedRef.current) return
    startedRef.current = true
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function run() {
    setStatus('solving')
    setMessage('')
    setProgress(0)
    try {
      const challengeRes = await fetch('/api/verify/challenge')
      const challenge = await challengeRes.json()
      const counter = await solvePow(challenge.nonce, challenge.difficulty, setProgress)

      setStatus('submitting')
      const res = await fetch('/api/verify/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, counter, challengeToken: challenge.challengeToken }),
      })
      if (res.ok) {
        setStatus('done')
      } else {
        const d = await res.json()
        setMessage(d.error || 'Verification failed.')
        setStatus('error')
      }
    } catch {
      setMessage('Network error.')
      setStatus('error')
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
            <p style={{ color: '#888', marginBottom: 24 }}>Your browser is proving you&apos;re not a bot — this takes a few seconds</p>
            {status === 'error' && (
              <>
                <p style={{ color: '#ff6b6b', marginBottom: 16, fontSize: 14 }}>{message}</p>
                <button
                  type="button"
                  onClick={run}
                  style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#90C6FF', color: '#0f0f0f', fontWeight: 700, cursor: 'pointer' }}
                >
                  Try again
                </button>
              </>
            )}
            {(status === 'solving' || status === 'submitting') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    border: '3px solid #2a2a2a',
                    borderTopColor: '#90C6FF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <p style={{ color: '#aaa', fontSize: 13 }}>
                  {status === 'submitting' ? 'Confirming…' : progress > 0 ? `Working… (${progress.toLocaleString()} tried)` : 'Working…'}
                </p>
              </div>
            )}
            <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
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
