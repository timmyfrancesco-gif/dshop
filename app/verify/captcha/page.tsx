'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'

function CaptchaInner() {
  const searchParams = useSearchParams()
  const session = searchParams.get('s')
  const [status, setStatus] = useState<'pending' | 'loading' | 'done' | 'error'>('pending')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!session) { setStatus('error'); setMessage('Missing session. Start again from the Discord link.'); return }
    ;(window as any).__verifyCallback = async (token: string) => {
      setStatus('loading')
      try {
        const res = await fetch('/api/verify/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, session }),
        })
        if (res.ok) { setStatus('done') }
        else { const d = await res.json(); setMessage(d.error || 'Verification failed.'); setStatus('error') }
      } catch { setMessage('Network error.'); setStatus('error') }
    }
    return () => { delete (window as any).__verifyCallback }
  }, [session])

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
            <p style={{ color: '#888', marginBottom: 24 }}>Please complete the captcha to continue</p>
            {status === 'error' && <p style={{ color: '#ff6b6b', marginBottom: 16, fontSize: 14 }}>{message}</p>}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                className="cf-turnstile"
                data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                data-callback="__verifyCallback"
                data-theme="dark"
              />
            </div>
            {status === 'loading' && <p style={{ color: '#aaa', marginTop: 16, fontSize: 14 }}>Verifying...</p>}
          </>
        )}
      </div>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
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
