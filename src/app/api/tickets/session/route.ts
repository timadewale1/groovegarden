import { NextResponse } from 'next/server'
import {
  createTicketVerifierSession,
  hasTicketVerifierSession,
  isValidTicketVerifierCode,
  ticketVerifierCookie,
} from '@/lib/ticket-verification-auth'

export async function GET(request: Request) {
  return NextResponse.json(
    { authenticated: hasTicketVerifierSession(request.headers.get('cookie')) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Enter the staff login code.' }, { status: 400 })
  }

  const code = body && typeof body === 'object'
    ? (body as Record<string, unknown>).code
    : null
  if (!process.env.TICKET_VERIFY_SESSION_SECRET || !process.env.TICKET_VERIFY_LOGIN_CODE) {
    return NextResponse.json({ error: 'Ticket verification login is not configured.' }, { status: 503 })
  }
  if (!isValidTicketVerifierCode(code)) {
    return NextResponse.json({ error: 'Incorrect login code.' }, { status: 401 })
  }

  try {
    const response = NextResponse.json(
      { authenticated: true },
      { headers: { 'Cache-Control': 'no-store' } },
    )
    response.headers.set('Set-Cookie', ticketVerifierCookie(createTicketVerifierSession()))
    return response
  } catch {
    return NextResponse.json({ error: 'Ticket verification login is not configured.' }, { status: 503 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false }, {
    headers: { 'Cache-Control': 'no-store' },
  })
  response.headers.set('Set-Cookie', ticketVerifierCookie('', 0))
  return response
}
