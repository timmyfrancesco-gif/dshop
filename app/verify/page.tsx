import { redirect } from 'next/navigation'

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ guild?: string }>
}) {
  const { guild } = await searchParams
  if (!guild) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>❌ Link non valido</h1>
          <p style={{ color: '#aaa' }}>Questo link di verifica non è valido.</p>
        </div>
      </div>
    )
  }
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    response_type: 'code',
    scope: 'identify',
    state: guild,
  })
  redirect(`https://discord.com/oauth2/authorize?${params.toString()}`)
}
