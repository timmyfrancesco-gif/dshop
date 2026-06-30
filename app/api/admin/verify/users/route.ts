import { NextRequest, NextResponse } from 'next/server'
import { hasAdminSession } from '@/lib/adminSession'
import { db } from '@/lib/db'
import { discordVerifications } from '@/lib/db/schema'
import { desc, eq, like, or } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  if (!hasAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const guild = searchParams.get('guild')
  const search = searchParams.get('search')
  const limitParam = searchParams.get('limit')
  const limit = Math.min(Number(limitParam) || 100, 500)

  let query = db
    .select({
      id: discordVerifications.id,
      discordUserId: discordVerifications.discordUserId,
      guildId: discordVerifications.guildId,
      username: discordVerifications.username,
      globalName: discordVerifications.globalName,
      avatar: discordVerifications.avatar,
      verifiedAt: discordVerifications.verifiedAt,
      ip: discordVerifications.ip,
    })
    .from(discordVerifications)
    .orderBy(desc(discordVerifications.verifiedAt))
    .limit(limit)

  const rows = await (guild
    ? query.where(eq(discordVerifications.guildId, guild))
    : search
    ? query.where(
        or(
          like(discordVerifications.username, `%${search}%`),
          like(discordVerifications.globalName, `%${search}%`),
          like(discordVerifications.discordUserId, `%${search}%`)
        )
      )
    : query)

  return NextResponse.json({ users: rows })
}
