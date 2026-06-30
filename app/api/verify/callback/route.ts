import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function signSession(payload: string, secret: string) {
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const guildId = searchParams.get('state')

  if (!code || !guildId) {
    return NextResponse.redirect(new URL('/verify/error', req.url))
  }

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    }),
  })
  if (!tokenRes.ok) return NextResponse.redirect(new URL('/verify/error', req.url))
  const { access_token } = await tokenRes.json()

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!userRes.ok) return NextResponse.redirect(new URL('/verify/error', req.url))
  const user = await userRes.json()

  const payload = `${user.id}|${guildId}`
  const signed = signSession(payload, process.env.VERIFY_SESSION_SECRET!)

  const res = NextResponse.redirect(new URL('/verify/captcha', req.url))
  res.cookies.set('verify_session', signed, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 10,
    path: '/',
    sameSite: 'lax',
  })
  return res
}
