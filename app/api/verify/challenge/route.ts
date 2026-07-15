import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const OPS = ['+', '-', '×'] as const

function randomChallenge() {
  const op = OPS[Math.floor(Math.random() * OPS.length)]
  if (op === '×') {
    const a = Math.floor(Math.random() * 11) + 2 // 2-12
    const b = Math.floor(Math.random() * 11) + 2 // 2-12
    return { a, b, op, answer: a * b }
  }
  if (op === '-') {
    const a = Math.floor(Math.random() * 41) + 20 // 20-60
    const b = Math.floor(Math.random() * 20) + 1 // 1-20, always < a
    return { a, b, op, answer: a - b }
  }
  const a = Math.floor(Math.random() * 41) + 10 // 10-50
  const b = Math.floor(Math.random() * 41) + 10 // 10-50
  return { a, b, op, answer: a + b }
}

// Self-contained "prove you're not a trivial bot" challenge — replaces the
// Cloudflare Turnstile step. Not meant to stop sophisticated scripted
// abuse, just the naive form-fill bots the verify flow needs to filter.
export async function GET() {
  const { a, b, op, answer } = randomChallenge()
  const exp = Date.now() + 5 * 60 * 1000 // 5 minutes to solve it

  const payload = Buffer.from(JSON.stringify({ answer, exp })).toString('base64url')
  const sig = createHmac('sha256', process.env.VERIFY_SESSION_SECRET!).update(payload).digest('hex')

  return NextResponse.json({ a, b, op, challengeToken: `${payload}.${sig}` })
}
