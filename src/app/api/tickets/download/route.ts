import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createTicketSvg, isValidTicketDownloadToken } from '@/lib/ticket-download'
import { getPaidTicketForDownload } from '@/lib/tickets'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const ticketCode = url.searchParams.get('code') || ''
  const token = url.searchParams.get('token')
  const isPreview = ticketCode === 'PREVIEW'
  if ((!isPreview && !/^\d{5}$/.test(ticketCode)) || !isValidTicketDownloadToken(ticketCode, token)) {
    return new NextResponse('Ticket download link is invalid or expired.', { status: 404 })
  }

  try {
    const ticket = isPreview ? null : await getPaidTicketForDownload(ticketCode)
    if (!isPreview && !ticket) {
      return new NextResponse('No paid ticket is associated with this download link.', { status: 404 })
    }
    const ticketCodeForSvg = ticket?.ticket_code || 'PREVIEW'

    const [logo, qr] = await Promise.all([
      readFile(path.join(process.cwd(), 'public', 'banners', 'Groove-Garden-Email-Logo.png')),
      QRCode.toBuffer(isPreview ? 'PREVIEW-NOT-VALID' : ticketCodeForSvg, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
      }),
    ])
    const eventTime = process.env.TICKET_EVENT_TIME?.trim() || '9 PM till Sunrise'
    const eventDateRaw = ticket?.event_date || process.env.TICKET_EVENT_DATE || 'To be announced'
    const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(eventDateRaw)
      ? new Date(`${eventDateRaw}T00:00:00Z`).toLocaleDateString('en-NG', {
          timeZone: 'UTC',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : eventDateRaw
    const svg = createTicketSvg({
      ticketCode: ticketCodeForSvg,
      fullName: ticket?.full_name || 'Preview Guest',
      email: ticket?.email || 'Preview only - not for entry',
      eventName: ticket?.event_name || process.env.TICKET_EVENT_NAME || 'Groove Garden',
      eventDate,
      eventTime,
      logoDataUri: `data:image/png;base64,${logo.toString('base64')}`,
      qrDataUri: `data:image/png;base64,${qr.toString('base64')}`,
    })

    return new NextResponse(svg, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="groove-garden-ticket-${ticketCodeForSvg.toLowerCase()}.svg"`,
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Ticket download generation failed.', error)
    return new NextResponse('Ticket download is temporarily unavailable.', { status: 503 })
  }
}
