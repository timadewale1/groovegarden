import { createHmac, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import opentype, { type Font } from 'opentype.js'
import sharp from 'sharp'

let ticketFontPromise: Promise<Font> | undefined

function getTicketFont() {
  ticketFontPromise ??= readFile(path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans.ttf')).then(buffer => {
    const fontData = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    return opentype.parse(fontData)
  })
  return ticketFontPromise
}

function textPath(
  font: Font,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fill: string,
  maxWidth?: number,
) {
  const width = font.getAdvanceWidth(text, fontSize)
  const fittedFontSize = maxWidth && width > maxWidth ? fontSize * maxWidth / width : fontSize
  const pathData = font.getPath(text, x, y, fittedFontSize).toPathData(2)
  return `<path d="${pathData}" fill="${fill}"/>`
}

function centeredTextPath(
  font: Font,
  text: string,
  centerX: number,
  y: number,
  fontSize: number,
  fill: string,
) {
  const x = centerX - font.getAdvanceWidth(text, fontSize) / 2
  return textPath(font, text, x, y, fontSize, fill)
}

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

export function createTicketDownloadPath(ticketCode: string) {
  const url = new URL('/api/tickets/download', 'https://groovegarden.invalid')
  url.searchParams.set('code', ticketCode)
  url.searchParams.set('token', signatureFor(ticketCode))
  return `${url.pathname}${url.search}`
}

export function createTicketDownloadUrl(ticketCode: string) {
  return new URL(createTicketDownloadPath(ticketCode), getTicketPublicUrl()).toString()
}

export function getTicketPublicUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://groovegardenhq.com'
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

export async function createTicketSvg(input: {
  ticketCode: string
  fullName: string
  email: string
  eventName: string
  eventDate: string
  eventTime: string
  ticketType?: 'entry' | 'cabana_regular' | 'cabana_premium'
  cabanaName?: string | null
  logoDataUri: string
  qrDataUri: string
}) {
  const font = await getTicketFont()

  if (input.ticketType === 'cabana_regular' || input.ticketType === 'cabana_premium') {
    const premium = input.ticketType === 'cabana_premium'
    const accent = premium ? '#b18b4d' : '#c65b25'
    const panel = premium ? '#25213a' : '#254134'
    const cabanaName = input.cabanaName || 'Reserved Cabana'
    const boldCabanaName = `${textPath(font, cabanaName, 49, 286, 34, panel, 590)}${textPath(font, cabanaName, 50, 286, 34, panel, 590)}`
    const boldGuestName = `${textPath(font, `${input.fullName} & friends`, 128, 330, 16, '#273d52', 520)}${textPath(font, `${input.fullName} & friends`, 129, 330, 16, '#273d52', 520)}`
    const tagsIncluded = premium ? '15 TAGS INCLUDED' : '10 TAGS INCLUDED'
    const boldTagsIncluded = `${textPath(font, tagsIncluded, 49, 411, 17, accent, 610)}${textPath(font, tagsIncluded, 50, 411, 17, accent, 610)}`

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="460" viewBox="0 0 1000 460">
  <rect x="10" y="10" width="980" height="440" rx="26" fill="#fffaf0" stroke="${accent}" stroke-width="4"/>
  <path d="M700 12h264a24 24 0 0 1 24 24v388a24 24 0 0 1-24 24H700z" fill="${panel}"/>
  <path d="M700 12v436" stroke="${accent}" stroke-width="3" stroke-dasharray="8 10"/>
  <image href="${input.logoDataUri}" x="48" y="28" width="215" height="90" preserveAspectRatio="xMinYMid meet"/>
  ${textPath(font, premium ? 'PREMIUM CABANA RESERVATION' : 'REGULAR CABANA RESERVATION', 49, 151, 15, accent, 610)}
  ${textPath(font, input.eventName, 49, 198, 29, '#172c42', 610)}
  ${textPath(font, 'RESERVED CABANA', 49, 236, 13, '#69747c')}
  ${boldCabanaName}
  ${textPath(font, 'GUEST', 49, 330, 13, '#69747c')}
  ${boldGuestName}
  ${textPath(font, input.eventDate, 49, 366, 15, '#273d52', 570)}
  ${boldTagsIncluded}
  ${centeredTextPath(font, 'TICKET ID', 832, 55, 15, '#fff4e5')}
  <rect x="734" y="72" width="196" height="54" rx="8" fill="#fffaf0"/>
  ${centeredTextPath(font, input.ticketCode, 832, 110, 32, '#172c42')}
  <image href="${input.qrDataUri}" x="758" y="144" width="148" height="148" preserveAspectRatio="xMidYMid meet"/>
  ${centeredTextPath(font, 'CABANA ENTRY', 832, 326, 13, '#fff4e5')}
  ${centeredTextPath(font, premium ? 'PREMIUM' : 'REGULAR', 832, 397, 12, '#fff4e5')}
</svg>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="460" viewBox="0 0 1000 460">
  <rect x="10" y="10" width="980" height="440" rx="26" fill="#fffaf0" stroke="#e85d04" stroke-width="3"/>
  <path d="M700 12h264a24 24 0 0 1 24 24v388a24 24 0 0 1-24 24H700z" fill="#d85213"/>
  <path d="M700 12v436" stroke="#fffaf0" stroke-width="3" stroke-dasharray="8 10"/>
  <image href="${input.logoDataUri}" x="48" y="35" width="230" height="96" preserveAspectRatio="xMinYMid meet"/>
  ${textPath(font, 'GROOVE GARDEN - TICKET', 48, 163, 16, '#d85213', 620)}
  ${textPath(font, input.eventName, 48, 207, 31, '#142b43', 620)}
  ${textPath(font, 'DATE', 48, 254, 15, '#7a7d7e')}
  ${textPath(font, input.eventDate, 160, 254, 17, '#273d52', 520)}
  ${textPath(font, 'TIME', 48, 290, 15, '#7a7d7e')}
  ${textPath(font, input.eventTime, 160, 290, 17, '#273d52', 520)}
  ${textPath(font, 'NAME', 48, 326, 15, '#7a7d7e')}
  ${textPath(font, input.fullName, 160, 326, 17, '#273d52', 520)}
  ${textPath(font, 'EMAIL', 48, 362, 15, '#7a7d7e')}
  ${textPath(font, input.email, 160, 362, 17, '#273d52', 520)}
  ${textPath(font, 'VALID FOR ONE ENTRY ONLY - SINGLE USE AT THE GATE', 48, 411, 15, '#9e321b', 620)}
  ${centeredTextPath(font, 'TICKET ID', 832, 55, 15, '#fff4e5')}
  <rect x="734" y="72" width="196" height="54" rx="8" fill="#fffaf0"/>
  ${centeredTextPath(font, input.ticketCode, 832, 110, 32, '#172c42')}
  <image href="${input.qrDataUri}" x="758" y="144" width="148" height="148" preserveAspectRatio="xMidYMid meet"/>
  ${centeredTextPath(font, 'PRESENT AT THE GATE', 832, 326, 13, '#fff4e5')}
  ${centeredTextPath(font, 'GROOVE GARDEN', 832, 397, 12, '#fff4e5')}
</svg>`
}

export async function createTicketPng(input: Parameters<typeof createTicketSvg>[0]) {
  return sharp(Buffer.from(await createTicketSvg(input))).png().toBuffer()
}
