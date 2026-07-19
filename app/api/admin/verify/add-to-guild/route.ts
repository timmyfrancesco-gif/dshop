import { NextRequest, NextResponse } from 'next/server'
import { hasAdminSession } from '@/lib/adminSession'
import { db } from '@/lib/db'
import { discordVerifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { decryptSecret, encryptSecret } from '@/lib/crypto/secrets'

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  try {
    const res = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!.trim(),
        client_secret: process.env.DISCORD_CLIENT_SECRET!.trim(),
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function POST(req: NextRequest) {
  if (!hasAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let discordUserId: string, targetGuildId: string
  try {
    const body = await req.json()
    discordUserId = body?.discordUserId
    targetGuildId = body?.guildId
    if (!discordUserId || !targetGuildId) throw new Error()
  } catch {
    return NextResponse.json({ error: 'discordUserId e guildId sono richiesti.' }, { status: 400 })
  }

  // Get the most recent verification record for this user
  const [record] = await db
    .select()
    .from(discordVerifications)
    .where(eq(discordVerifications.discordUserId, discordUserId))
    .orderBy(discordVerifications.verifiedAt)
    .limit(1)

  if (!record) return NextResponse.json({ error: 'Utente non trovato.' }, { status: 404 })
  if (!record.accessToken) return NextResponse.json({ error: 'Token OAuth non disponibile per questo utente.' }, { status: 400 })

  let accessToken = decryptSecret(record.accessToken)

  // Refresh token if expired or close to expiry (within 60s)
  const expired = record.tokenExpiresAt && record.tokenExpiresAt.getTime() < Date.now() + 60_000
  if (expired && record.refreshToken) {
    const plainRefresh = decryptSecret(record.refreshToken) ?? ""
    const refreshed = await refreshAccessToken(plainRefresh)
    if (refreshed) {
      accessToken = refreshed.access_token
      // Update stored tokens
      await db.update(discordVerifications)
        .set({
          accessToken: encryptSecret(refreshed.access_token),
          refreshToken: encryptSecret(refreshed.refresh_token),
          tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        })
        .where(eq(discordVerifications.id, record.id))
    } else {
      return NextResponse.json({ error: 'Token scaduto e refresh fallito. L\'utente deve riverificarsi.' }, { status: 400 })
    }
  }

  // Call bot to add the user to the target guild
  const botRes = await fetch(`${process.env.BOT_API_URL}/api/verify-grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-verify-secret': process.env.BOT_API_SECRET!,
    },
    body: JSON.stringify({ userId: discordUserId, guildId: targetGuildId, accessToken }),
  })

  if (!botRes.ok) {
    const data = await botRes.json().catch(() => ({}))
    return NextResponse.json({ error: (data as any).error || 'Errore del bot.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
