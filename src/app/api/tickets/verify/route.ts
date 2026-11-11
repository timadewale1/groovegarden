import { NextResponse } from 'next/server'
import {
  isValidTicketReference,
  verifyAndIssueTickets,
} from '@/lib/tickets'

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
    return NextResponse.json({ error: 'Invalid payment reference.' }, { status: 400 })
  }

  try {
    const payment = await verifyAndIssueTickets(reference)
    if (payment.status === 'pending') {
      return NextResponse.json(
        { ok: true, status: 'pending' },
        { status: 202, headers: { 'Cache-Control': 'no-store', 'Retry-After': '2' } },
      )
    }
    if (payment.status === 'failed') {
      return NextResponse.json(
        { ok: true, status: 'failed' },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json({
      ok: true,
      status: 'paid',
      tickets: payment.tickets.map(ticket => ({ ticketCode: ticket.ticket_code })),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Ticket payment verification failed.')
    const message = error instanceof Error ? error.message : ''
    const invalidPayment = message.includes('could not be verified') || message.includes('not found')
    return NextResponse.json(
      { error: invalidPayment ? message : 'Payment verification is unavailable. Please retry shortly.' },
      { status: invalidPayment ? 400 : 502 },
    )
  }
}
