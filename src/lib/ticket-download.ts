import { createHmac, timingSafeEqual } from 'node:crypto'

function getTicketDownloadSecret() {
  const secret =
    process.env.TICKET_DOWNLOAD_SECRET ||
    process.env.TICKET_VERIFY_SESSION_SECRET ||
    process.env.PAYSTACK_SECRET_KEY
  if (!secret || secret.length < 32) {
    throw new Error('Ticket download signing secret is not configured.')
  }
  return secret
}

function signatureFor(ticketCode: string) {
  return createHmac('sha256', getTicketDownloadSecret())
    .update(`groove-garden-ticket-download:v1:${ticketCode}`)
    .digest('base64url')
}

export function createTicketDownloadUrl(ticketCode: string) {
  const siteUrl = getTicketPublicUrl()
  const url = new URL('/api/tickets/download', siteUrl)
  url.searchParams.set('code', ticketCode)
  url.searchParams.set('token', signatureFor(ticketCode))
  return url.toString()
}

export function getTicketPublicUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://groovegardenhq.vercel.app'
}

export function createTicketEventDetailsUrl() {
  return `${getTicketPublicUrl()}/#upcoming-event`
}

export function isValidTicketDownloadToken(ticketCode: string, token: string | null) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false
  const expected = Buffer.from(signatureFor(ticketCode))
  const received = Buffer.from(token)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export function createTicketSvg(input: {
  ticketCode: string
  fullName: string
  email: string
  eventName: string
  eventDate: string
  eventTime: string
  logoDataUri: string
  qrDataUri: string
}) {
  const escapeXml = (value: string) => value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character]!)
  const eventName = escapeXml(input.eventName)
  const fullName = escapeXml(input.fullName)
  const email = escapeXml(input.email)
  const eventDate = escapeXml(input.eventDate)
  const eventTime = escapeXml(input.eventTime)
  const ticketCode = escapeXml(input.ticketCode)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="460" viewBox="0 0 1000 460">
  <rect x="10" y="10" width="980" height="440" rx="26" fill="#fffaf0" stroke="#e85d04" stroke-width="3"/>
  <path d="M700 12h264a24 24 0 0 1 24 24v388a24 24 0 0 1-24 24H700z" fill="#d85213"/>
  <path d="M700 12v436" stroke="#fffaf0" stroke-width="3" stroke-dasharray="8 10"/>
  <image href="${input.logoDataUri}" x="48" y="35" width="230" height="96" preserveAspectRatio="xMinYMid meet"/>
  <text x="48" y="163" fill="#d85213" font-family="Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="3">GROOVE GARDEN - TICKET</text>
  <text x="48" y="207" fill="#142b43" font-family="Arial,sans-serif" font-size="31" font-weight="700">${eventName}</text>
  <text x="48" y="254" fill="#7a7d7e" font-family="Arial,sans-serif" font-size="15">DATE</text>
  <text x="160" y="254" fill="#273d52" font-family="Arial,sans-serif" font-size="17" font-weight="700">${eventDate}</text>
  <text x="48" y="290" fill="#7a7d7e" font-family="Arial,sans-serif" font-size="15">TIME</text>
  <text x="160" y="290" fill="#273d52" font-family="Arial,sans-serif" font-size="17" font-weight="700">${eventTime}</text>
  <text x="48" y="326" fill="#7a7d7e" font-family="Arial,sans-serif" font-size="15">NAME</text>
  <text x="160" y="326" fill="#273d52" font-family="Arial,sans-serif" font-size="17" font-weight="700">${fullName}</text>
  <text x="48" y="362" fill="#7a7d7e" font-family="Arial,sans-serif" font-size="15">EMAIL</text>
  <text x="160" y="362" fill="#273d52" font-family="Arial,sans-serif" font-size="17" font-weight="700">${email}</text>
  <text x="48" y="411" fill="#9e321b" font-family="Arial,sans-serif" font-size="15" font-weight="700">VALID FOR ONE ENTRY ONLY - SINGLE USE AT THE GATE</text>
  <text x="832" y="55" text-anchor="middle" fill="#fff4e5" font-family="Arial,sans-serif" font-size="15" font-weight="700" letter-spacing="2">TICKET ID</text>
  <rect x="734" y="72" width="196" height="54" rx="8" fill="#fffaf0"/>
  <text x="832" y="110" text-anchor="middle" fill="#172c42" font-family="monospace" font-size="32" font-weight="700" letter-spacing="5">${ticketCode}</text>
  <image href="${input.qrDataUri}" x="758" y="144" width="148" height="148" preserveAspectRatio="xMidYMid meet"/>
  <text x="832" y="326" text-anchor="middle" fill="#fff4e5" font-family="Arial,sans-serif" font-size="13" font-weight="700" letter-spacing="1">PRESENT AT THE GATE</text>
  <text x="832" y="397" text-anchor="middle" fill="#fff4e5" font-family="Arial,sans-serif" font-size="12">GROOVE GARDEN</text>
</svg>`
}
