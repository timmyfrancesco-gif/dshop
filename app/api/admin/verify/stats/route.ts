import { NextRequest, NextResponse } from 'next/server'
import { hasAdminSession } from '@/lib/adminSession'
import { db } from '@/lib/db'
import { discordVerifications } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  if (!hasAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      todayCount: sql<number>`count(*) filter (where verified_at >= now() - interval '24 hours')::int`,
      uniqueUsers: sql<number>`count(distinct discord_user_id)::int`,
      uniqueGuilds: sql<number>`count(distinct guild_id)::int`,
    })
    .from(discordVerifications)

  const guilds = await db
    .select({
      guildId: discordVerifications.guildId,
      count: sql<number>`count(*)::int`,
    })
    .from(discordVerifications)
    .groupBy(discordVerifications.guildId)
    .orderBy(sql`count(*) desc`)

  return NextResponse.json({ ...totals, guilds })
}
