import { NextRequest, NextResponse } from 'next/server'
import { hasAdminSession } from '@/lib/adminSession'
import { db } from '@/lib/db'
import { discordVerifications } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { addVerifiedUserToGuild } from '@/lib/verify/addToGuild'

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
    .orderBy(desc(discordVerifications.verifiedAt))
    .limit(1)

  if (!record) return NextResponse.json({ error: 'Utente non trovato.' }, { status: 404 })

  const result = await addVerifiedUserToGuild(record, targetGuildId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Errore del bot.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
