import { NextResponse } from 'next/server'
import {
  emailTicketsIfNeeded,
  isValidPaystackSignature,
  isValidTicketReference,
  verifyAndIssueTickets,
} from '@/lib/tickets'

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!isValidPaystackSignature(rawBody, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 })
  }

  let event: unknown
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 })
  }

  if (!event || typeof event !== 'object') {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 })
  }

  const payload = event as { event?: unknown; data?: { reference?: unknown } }
  if (payload.event !== 'charge.success' && payload.event !== 'charge.failed') {
    return NextResponse.json({ received: true })
  }
  if (!isValidTicketReference(payload.data?.reference)) {
    return NextResponse.json({ error: 'Invalid transaction reference.' }, { status: 400 })
  }

  try {
    const payment = await verifyAndIssueTickets(payload.data.reference)
    if (payment.status === 'pending') {
      return NextResponse.json({ error: 'Transaction is not final yet.' }, { status: 503 })
    }
    if (payment.status === 'paid') {
      await emailTicketsIfNeeded(payload.data.reference, payment.tickets)
    }
    return NextResponse.json({ received: true })
  } catch {
    console.error('Paystack ticket webhook processing failed.')
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
