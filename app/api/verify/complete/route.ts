import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

function verifySession(signed: string, secret: string): { userId: string; guildId: string } | null {
  const [payloadB64, sig] = signed.split('.')
  if (!payloadB64 || !sig) return null
  const expected = createHmac('sha256', secret).update(payloadB64).digest('hex')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  if (!timingSafeEqual(a, b)) return null
  const [userId, guildId] = Buffer.from(payloadB64, 'base64url').toString().split('|')
  if (!userId || !guildId) return null
  return { userId, guildId }
}

export async function POST(req: NextRequest) {
  let token: string
  try {
    const body = await req.json()
    token = body?.token
    if (!token) return NextResponse.json({ error: 'Token mancante.' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 })
  }

  // 1. Validate Turnstile
  const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for'),
    }),
  })
  const cfData = await cfRes.json()
  if (!cfData.success) {
    return NextResponse.json({ error: 'Captcha non valido. Riprova.' }, { status: 400 })
  }

  // 2. Validate session cookie
  const sessionCookie = req.cookies.get('verify_session')?.value
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Sessione scaduta. Ricomincia dal link Discord.' }, { status: 401 })
  }
  const session = verifySession(sessionCookie, process.env.VERIFY_SESSION_SECRET!)
  if (!session) {
    return NextResponse.json({ error: 'Sessione non valida.' }, { status: 401 })
  }

  // 3. Call bot API to grant role
  const botRes = await fetch(`${process.env.BOT_API_URL}/api/verify-grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-verify-secret': process.env.BOT_API_SECRET!,
    },
    body: JSON.stringify({ userId: session.userId, guildId: session.guildId }),
  })
  if (!botRes.ok) {
    const data = await botRes.json().catch(() => ({}))
    return NextResponse.json({ error: (data as any).error || 'Errore del bot.' }, { status: 500 })
  }

  // 4. Clear cookie
  const res = NextResponse.json({ ok: true })
  res.cookies.set('verify_session', '', { maxAge: 0, path: '/' })
  return res
}
