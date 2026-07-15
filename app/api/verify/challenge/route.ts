import { NextResponse } from 'next/server'
import { createHmac, randomBytes } from 'crypto'

export const POW_DIFFICULTY = 4 // leading zero hex chars required (~65k avg attempts)

// Self-contained "prove you're not a trivial bot" challenge — replaces the
// Cloudflare Turnstile step. Instead of an answerable puzzle (which a
// scripted bot can just read out of the DOM and reply to instantly), this is
// a small proof-of-work: the client must brute-force a nonce suffix whose
// SHA-256 hash starts with POW_DIFFICULTY zero hex chars. A human's browser
// eats ~1-3s of CPU doing this once; a bot trying to farm many verifications
// pays that same cost every single time, which is the actual point — it
// doesn't try to detect "human-ness", it makes abuse expensive.
export async function GET() {
  const nonce = randomBytes(16).toString('hex')
  const exp = Date.now() + 5 * 60 * 1000 // 5 minutes to solve it

  const payload = Buffer.from(JSON.stringify({ nonce, difficulty: POW_DIFFICULTY, exp })).toString('base64url')
  const sig = createHmac('sha256', process.env.VERIFY_SESSION_SECRET!).update(payload).digest('hex')

  return NextResponse.json({ nonce, difficulty: POW_DIFFICULTY, challengeToken: `${payload}.${sig}` })
}
