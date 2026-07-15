import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'

// Self-contained "prove you're not a trivial bot" challenge — replaces the
// Cloudflare Turnstile step. Not meant to stop sophisticated scripted
// abuse, just the naive form-fill bots the verify flow needs to filter.
export async function GET() {
  const a = Math.floor(Math.random() * 8) + 1
  const b = Math.floor(Math.random() * 8) + 1
  const exp = Date.now() + 5 * 60 * 1000 // 5 minutes to solve it

  const payload = Buffer.from(JSON.stringify({ answer: a + b, exp })).toString('base64url')
  const sig = createHmac('sha256', process.env.VERIFY_SESSION_SECRET!).update(payload).digest('hex')

  return NextResponse.json({ a, b, challengeToken: `${payload}.${sig}` })
}
