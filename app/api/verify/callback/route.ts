import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function errorRedirect(req: NextRequest, reason: string) {
  const url = new URL('/verify/error', req.url)
  url.searchParams.set('reason', reason)
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const guildId = searchParams.get('state')

  if (!code || !guildId) {
    console.error('[verify/callback] missing code or state', { hasCode: !!code, hasGuildId: !!guildId })
    return errorRedirect(req, 'missing_params')
  }

  // .trim() guards against a stray trailing/leading space in the Vercel env
  // var value -- Discord compares redirect_uri byte-for-byte between the
  // authorize request and this token exchange, so even whitespace makes it
  // reject with "Invalid redirect_uri in request".
  const clientId = process.env.DISCORD_CLIENT_ID?.trim()
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim()
  const redirectUri = process.env.DISCORD_REDIRECT_URI?.trim()
  if (!clientId || !clientSecret || !redirectUri) {
    // Without this check, the fetch below would silently send the literal
    // string "undefined" for whichever var is missing -- Discord rejects
    // that as an OAuth error, but the old code swallowed the real reason.
    console.error('[verify/callback] missing env vars', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUri: !!redirectUri,
    })
    return errorRedirect(req, 'missing_env')
  }

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => '')
    console.error('[verify/callback] token exchange failed', {
      status: tokenRes.status,
      body: body.slice(0, 500),
      redirectUriUsed: redirectUri,
      clientId,
    })
    return errorRedirect(req, 'token_exchange_failed')
  }
  const tokenData = await tokenRes.json()
  const { access_token, refresh_token, expires_in } = tokenData

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!userRes.ok) {
    const body = await userRes.text().catch(() => '')
    console.error('[verify/callback] fetching user info failed', {
      status: userRes.status,
      body: body.slice(0, 500),
    })
    return errorRedirect(req, 'user_fetch_failed')
  }
  const user = await userRes.json()

  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    guildId,
    accessToken: access_token,
    refreshToken: refresh_token ?? null,
    expiresIn: expires_in ?? null,
    username: user.username ?? null,
    globalName: user.global_name ?? null,
    avatar: user.avatar ?? null,
    email: user.email ?? null,
  })).toString('base64url')

  const sig = createHmac('sha256', process.env.VERIFY_SESSION_SECRET!).update(payload).digest('hex')
  const session = `${payload}.${sig}`

  const captchaUrl = new URL('/verify/captcha', req.url)
  captchaUrl.searchParams.set('s', session)
  return NextResponse.redirect(captchaUrl)
}
