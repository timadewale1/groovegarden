import { NextResponse } from 'next/server'
import { hasTicketVerifierSession } from '@/lib/ticket-verification-auth'
import { sendCabanaTicketDesignPreviews } from '@/lib/tickets'

export async function POST(request: Request) {
  if (!hasTicketVerifierSession(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Staff login required.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Enter the preview recipient email.' }, { status: 400 })
  }

  const recipient = body && typeof body === 'object'
    ? (body as Record<string, unknown>).recipient
    : null
  if (typeof recipient !== 'string' || recipient.length > 254) {
    return NextResponse.json({ error: 'Enter a valid preview recipient email.' }, { status: 400 })
  }

  try {
    await sendCabanaTicketDesignPreviews(recipient)
    return NextResponse.json({ ok: true, emailsSent: 2 }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    console.error('Cabana ticket preview email delivery failed.')
    return NextResponse.json({ error: 'Could not send both cabana preview emails.' }, { status: 503 })
  }
}
