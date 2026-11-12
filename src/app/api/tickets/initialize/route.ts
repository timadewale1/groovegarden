import { NextResponse } from 'next/server'
import {
  createPendingTicketOrder,
  MAX_TICKETS,
  requireTicketSettings,
} from '@/lib/tickets'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid ticket details.' }, { status: 400 })
  }

  const details = body as Record<string, unknown>
  const fullName = typeof details.fullName === 'string' ? details.fullName.trim() : ''
  const email = typeof details.email === 'string' ? details.email.trim().toLowerCase() : ''
  const phone = typeof details.phone === 'string' ? details.phone.trim() : ''
  const quantity = details.quantity
  const phoneDigits = phone.replace(/\D/g, '')

  if (fullName.length < 2 || fullName.length > 100) {
    return NextResponse.json({ error: 'Enter your name (2–100 characters).' }, { status: 400 })
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (!/^[+0-9()\-\s]{7,24}$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 })
  }
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS) {
    return NextResponse.json({ error: `Choose between 1 and ${MAX_TICKETS} tickets.` }, { status: 400 })
  }

  try {
    requireTicketSettings()
    const order = await createPendingTicketOrder({
      fullName,
      email,
      phone,
      quantity: Number(quantity),
    })

    return NextResponse.json(order, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Ticket order initialization failed.')
    const message = error instanceof Error ? error.message : ''
    const unavailable = message.includes('not configured')
    return NextResponse.json(
      { error: unavailable ? message : 'Could not start ticket checkout. Please try again.' },
      { status: unavailable ? 503 : 500 },
    )
  }
}
