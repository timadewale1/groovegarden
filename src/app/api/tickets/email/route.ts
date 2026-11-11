import { NextResponse } from 'next/server'
import { emailPaidOrderTickets, isValidTicketReference } from '@/lib/tickets'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const reference = body && typeof body === 'object'
    ? (body as Record<string, unknown>).reference
    : null
  if (!isValidTicketReference(reference)) {
    return NextResponse.json({ error: 'Invalid ticket reference.' }, { status: 400 })
  }

  try {
    const emailSent = await emailPaidOrderTickets(reference)
    return NextResponse.json({ ok: true, emailSent }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'Ticket payment is not confirmed.') {
      return NextResponse.json({ error: message }, { status: 409, headers: { 'Cache-Control': 'no-store' } })
    }

    console.error('Confirmed ticket email delivery failed.')
    return NextResponse.json(
      { error: 'Payment is confirmed, but ticket email delivery is unavailable. Please retry.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
