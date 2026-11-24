import { after, NextResponse } from 'next/server'
import {
  emailTicketsIfNeeded,
  isValidPaystackSignature,
  isValidTicketReference,
  verifyAndIssueTickets,
} from '@/lib/tickets'

export const maxDuration = 60

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!isValidPaystackSignature(rawBody, request.headers)) {
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

  const reference = payload.data.reference
  after(async () => {
    try {
      const payment = await verifyAndIssueTickets(reference)
      if (payment.status === 'paid') await emailTicketsIfNeeded(reference, payment.tickets)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const safeMessage = message
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
        .replace(/\bGG-[A-Z0-9-]{8,}\b/gi, '[reference]')
        .slice(0, 200)
      console.error('Paystack ticket webhook processing failed after acknowledgement.', {
        reason: safeMessage || 'Unknown error',
      })
    }
  })

  // Paystack requires a quick 2xx acknowledgement. Fulfilment is idempotent
  // and remains recoverable through the admin reconciliation check.
  return NextResponse.json({ received: true })
}
