import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { discordVerifications } from '@/lib/db/schema'
import { encryptSecret } from '@/lib/crypto/secrets'

function verifySession(signed: string, secret: string) {
  try {
    const lastDot = signed.lastIndexOf('.')
    if (lastDot === -1) return null
    const payload = signed.slice(0, lastDot)
    const sig = signed.slice(lastDot + 1)
    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      userId: string
      guildId: string
      accessToken: string
      refreshToken?: string
      expiresIn?: number
      username?: string
      globalName?: string
      avatar?: string
      email?: string
    }
  } catch { return null }
}

function verifyChallenge(signed: string, secret: string): number | false {
  try {
    const lastDot = signed.lastIndexOf('.')
    if (lastDot === -1) return false
    const payload = signed.slice(0, lastDot)
    const sig = signed.slice(lastDot + 1)
    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false
    const { answer, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      answer: number
      exp: number
    }
    if (Date.now() > exp) return false
    return answer
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  let answer: number, challengeToken: string, sessionSigned: string
  try {
    const body = await req.json()
    answer = Number(body?.answer)
    challengeToken = body?.challengeToken
    sessionSigned = body?.session
    if (!challengeToken || !sessionSigned || Number.isNaN(answer)) {
      return NextResponse.json({ error: 'Parametri mancanti.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 })
  }

  // 1. Validate the challenge answer
  const expectedAnswer = verifyChallenge(challengeToken, process.env.VERIFY_SESSION_SECRET!)
  if (expectedAnswer === false || answer !== expectedAnswer) {
    return NextResponse.json({ error: 'Incorrect answer. Try again.' }, { status: 400 })
  }

  // 2. Verify session
  const session = verifySession(sessionSigned, process.env.VERIFY_SESSION_SECRET!)
  if (!session) return NextResponse.json({ error: 'Session invalid or expired.' }, { status: 401 })

  // 3. Call bot API
  const botRes = await fetch(`${process.env.BOT_API_URL}/api/verify-grant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-verify-secret': process.env.BOT_API_SECRET! },
    body: JSON.stringify({
      userId: session.userId,
      guildId: session.guildId,
      accessToken: session.accessToken,
    }),
  })
  if (!botRes.ok) {
    const data = await botRes.json().catch(() => ({}))
    return NextResponse.json({ error: (data as any).error || 'Bot error.' }, { status: 500 })
  }

  // 4. Store verification in DB (best-effort)
  try {
    const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? null
    const tokenExpiresAt = session.expiresIn
      ? new Date(Date.now() + session.expiresIn * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7d default

    await db.insert(discordVerifications).values({
      discordUserId: session.userId,
      guildId: session.guildId,
      username: session.username ?? null,
      globalName: session.globalName ?? null,
      avatar: session.avatar ?? null,
      email: session.email ?? null,
      accessToken: session.accessToken ? encryptSecret(session.accessToken) : null,
      refreshToken: session.refreshToken ? encryptSecret(session.refreshToken) : null,
      tokenExpiresAt,
      ip,
    })
  } catch {
    // non-fatal: verification already granted, just couldn't record it
  }

  return NextResponse.json({ ok: true })
}
