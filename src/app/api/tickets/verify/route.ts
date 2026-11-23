import { NextResponse } from 'next/server'
import {
  isValidTicketReference,
  verifyAndIssueTickets,
} from '@/lib/tickets'
import { createTicketDownloadPath } from '@/lib/ticket-download'

export const maxDuration = 60

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
      tickets: payment.tickets.map(ticket => ({
        ticketCode: ticket.ticket_code,
        downloadUrl: createTicketDownloadPath(ticket.ticket_code),
        ticketType: ticket.ticket_type,
        cabanaName: ticket.cabana_name,
      })),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const safeMessage = message
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
      .replace(/\bGG-[A-Z0-9-]{8,}\b/gi, '[reference]')
      .slice(0, 200)
    console.error('Ticket payment verification failed.', { reason: safeMessage || 'Unknown error' })
    const cabanaConflict = message.includes('Cabana hold expired or is no longer available')
    const invalidPayment = message.includes('could not be verified') || message.includes('not found')
    return NextResponse.json(
      {
        error: cabanaConflict
          ? 'Paystack confirmed your payment, but this cabana is no longer available. Do not pay again; contact groovegardenhq@gmail.com for assistance.'
          : invalidPayment
            ? message
            : 'Payment verification is unavailable. Please retry shortly.',
      },
      { status: cabanaConflict ? 409 : invalidPayment ? 400 : 502 },
    )
  }
}
