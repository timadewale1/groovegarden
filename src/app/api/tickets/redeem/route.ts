import { NextResponse } from 'next/server'
import { hasTicketVerifierSession } from '@/lib/ticket-verification-auth'
import { redeemTicket } from '@/lib/tickets'

export async function POST(request: Request) {
  if (!hasTicketVerifierSession(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Staff login required.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Enter or scan a ticket code.' }, { status: 400 })
  }

  const code = body && typeof body === 'object'
    ? (body as Record<string, unknown>).code
    : null
  if (typeof code !== 'string' || !/^\d{5}$/.test(code)) {
    return NextResponse.json({ error: 'Ticket codes must contain exactly five digits.' }, { status: 400 })
  }

  try {
    const result = await redeemTicket(code)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    console.error('Ticket redemption failed.')
    return NextResponse.json({ error: 'Ticket verification is unavailable. Please try again.' }, { status: 503 })
  }
}
