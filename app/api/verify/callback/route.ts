import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const guildId = searchParams.get('state')

  if (!code || !guildId) return NextResponse.redirect(new URL('/verify/error', req.url))

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

  const payload = Buffer.from(JSON.stringify({ userId: user.id, guildId, accessToken: access_token })).toString('base64url')
  const sig = createHmac('sha256', process.env.VERIFY_SESSION_SECRET!).update(payload).digest('hex')
  const session = `${payload}.${sig}`

  const captchaUrl = new URL('/verify/captcha', req.url)
  captchaUrl.searchParams.set('s', session)
  return NextResponse.redirect(captchaUrl)
}
