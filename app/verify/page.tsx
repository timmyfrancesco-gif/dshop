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
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>❌ Invalid link</h1>
          <p style={{ color: '#aaa' }}>This verification link is not valid.</p>
        </div>
      </div>
    )
  }
  const params = new URLSearchParams({
    // .trim() guards against a stray trailing/leading space in the Vercel
    // env var value -- Discord compares redirect_uri byte-for-byte between
    // this authorize request and the later token exchange, so even
    // whitespace makes it reject with "Invalid redirect_uri in request".
    client_id: process.env.DISCORD_CLIENT_ID!.trim(),
    redirect_uri: process.env.DISCORD_REDIRECT_URI!.trim(),
    response_type: 'code',
    scope: 'identify email guilds.join',
    state: guild,
  })
  redirect(`https://discord.com/oauth2/authorize?${params.toString()}`)
}
