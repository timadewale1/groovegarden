import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import nodemailer from 'nodemailer'
import QRCode from 'qrcode'
import {
  createTicketEventDetailsUrl,
  createTicketPng,
} from '@/lib/ticket-download'

export const MAX_TICKET_SLOTS = 1

export type TicketSettings = {
  enabled: boolean
  eventName: string
  eventDate: string
  eventTime: string
  ticketPriceNaira: number | null
  maxSlots: number
}

export type IssuedTicket = {
  ticket_code: string
  full_name: string
  email: string
  phone: string
  event_name: string
  event_date: string
  quantity: number
  amount_kobo: number
}

export type TicketRedemption = {
  status: 'valid' | 'used' | 'not_found'
  ticket_code: string | null
  full_name: string | null
  event_name: string | null
  event_date: string | null
  used_at: string | null
}

type TicketOrderPayment = {
  id: string
  reference: string
  email: string
  amount_kobo: number
  currency: string
  quantity: number
  status: 'pending' | 'paid' | 'failed'
  full_name: string
  phone: string
  event_name: string
  event_date: string
  tickets: Array<{ ticket_code: string; slot_number: number }>
}

type TicketOrderForEmail = {
  id: string
  full_name: string
  email: string
  phone: string
  event_name: string
  event_date: string
  quantity: number
  amount_kobo: number
}

export type TicketPaymentVerification =
  | { status: 'pending' }
  | { status: 'failed' }
  | { status: 'paid'; tickets: IssuedTicket[] }

const TICKET_REQUEST_TIMEOUT_MS = 8_000

function isValidFutureDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  const today = `${values.year}-${values.month}-${values.day}`
  return date >= today
}

function getTicketPrice() {
  const rawPrice = process.env.TICKET_PRICE_NGN
  if (!rawPrice || !/^\d+$/.test(rawPrice)) return null

  const price = Number(rawPrice)
  return Number.isSafeInteger(price) && price > 0 ? price : null
}

function hasRequiredSettings() {
  const eventName = process.env.TICKET_EVENT_NAME?.trim()
  const eventDate = process.env.TICKET_EVENT_DATE?.trim()

  return Boolean(
    process.env.PAYSTACK_PUBLIC_KEY &&
    process.env.PAYSTACK_SECRET_KEY &&
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.GG_MAIL_USER &&
    process.env.GG_MAIL_PASS &&
    eventName &&
    !/placeholder|tba|to be announced/i.test(eventName) &&
    eventDate &&
    isValidFutureDate(eventDate) &&
    getTicketPrice(),
  )
}

export function getPublicTicketSettings(): TicketSettings {
  const eventName = process.env.TICKET_EVENT_NAME?.trim()
  const eventDate = process.env.TICKET_EVENT_DATE?.trim()
  const enabled = hasRequiredSettings()

  return {
    enabled,
    eventName: eventName && !/placeholder|tba|to be announced/i.test(eventName)
      ? eventName
      : 'Next Groove Garden event',
    eventDate: eventDate && isValidFutureDate(eventDate) ? eventDate : 'To be announced',
    eventTime: process.env.TICKET_EVENT_TIME?.trim() || '9 PM till Sunrise',
    ticketPriceNaira: enabled ? getTicketPrice() : null,
    maxSlots: MAX_TICKET_SLOTS,
  }
}

export function requireTicketSettings() {
  if (!hasRequiredSettings()) {
    throw new Error('Ticket sales are not configured yet.')
  }

  return {
    ...requirePaymentInfrastructure(),
    eventName: process.env.TICKET_EVENT_NAME!.trim(),
    eventDate: process.env.TICKET_EVENT_DATE!.trim(),
    eventTime: process.env.TICKET_EVENT_TIME?.trim() || '9 PM till Sunrise',
    ticketPriceNaira: getTicketPrice()!,
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY!,
  }
}

function requireSupabaseInfrastructure() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Ticket database services are not configured.')
  }
  return {
    supabaseUrl: process.env.SUPABASE_URL!.replace(/\/+$/, ''),
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }
}

function requirePaymentInfrastructure() {
  const supabase = requireSupabaseInfrastructure()
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error('Ticket payment services are not configured.')
  }

  return {
    ...supabase,
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  }
}

function supabaseHeaders() {
  const settings = requireSupabaseInfrastructure()
  return {
    apikey: settings.supabaseServiceRoleKey,
    Authorization: `Bearer ${settings.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
  }
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const settings = requireSupabaseInfrastructure()
  const response = await fetch(`${settings.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(TICKET_REQUEST_TIMEOUT_MS),
    headers: {
      ...supabaseHeaders(),
      ...init.headers,
    },
  })

  if (!response.ok) {
    const responseBody = await response.text()
    let databaseError: { code?: unknown; message?: unknown; hint?: unknown } = {}
    try {
      databaseError = JSON.parse(responseBody) as typeof databaseError
    } catch {
      databaseError.message = 'Database returned a non-JSON error.'
    }

    const safeMessage = (value: unknown) => typeof value === 'string'
      ? value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
        .replace(/\bGG-[A-Z0-9-]{8,}\b/gi, '[reference]')
        .slice(0, 240)
      : undefined
    const code = typeof databaseError.code === 'string' ? databaseError.code.slice(0, 32) : undefined
    const message = safeMessage(databaseError.message)
    const hint = safeMessage(databaseError.hint)
    console.error('Ticket database request failed.', {
      resource: path.split('?')[0],
      status: response.status,
      code,
      message,
      hint,
    })
    throw new Error(
      message
        ? `Ticket service is temporarily unavailable (${code || response.status}: ${message}).`
        : 'Ticket service is temporarily unavailable.',
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function createPendingTicketOrder(input: {
  fullName: string
  email: string
  phone: string
  quantity: number
}) {
  const settings = requireTicketSettings()
  const reference = `GG-${randomUUID()}`
  const amountKobo = settings.ticketPriceNaira * input.quantity * 100

  if (!Number.isSafeInteger(amountKobo)) {
    throw new Error('Ticket total is outside the supported payment range.')
  }

  const createdOrders = await supabaseRequest<unknown[]>('ticket_orders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      reference,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      event_name: settings.eventName,
      event_date: settings.eventDate,
      currency: 'NGN',
      unit_amount_kobo: settings.ticketPriceNaira * 100,
      amount_kobo: amountKobo,
      quantity: input.quantity,
      status: 'pending',
    }),
  })
  if (!Array.isArray(createdOrders) || createdOrders.length !== 1) {
    throw new Error('Ticket order could not be saved.')
  }

  return { reference, amountKobo, publicKey: settings.paystackPublicKey }
}

type PaystackVerification = {
  status: boolean
  data?: {
    status?: string
    reference?: string
    amount?: number
    currency?: string
    customer?: { email?: string }
  }
}

export async function verifyAndIssueTickets(reference: string): Promise<TicketPaymentVerification> {
  const settings = requirePaymentInfrastructure()
  const orders = await supabaseRequest<TicketOrderPayment[]>(
    `ticket_orders?reference=eq.${encodeURIComponent(reference)}&select=id,reference,email,amount_kobo,currency,quantity,status,full_name,phone,event_name,event_date,tickets(ticket_code,slot_number)`,
  )
  const order = orders[0]
  if (!order) throw new Error('Ticket order was not found.')

  if (order.status === 'paid') {
    if (!Array.isArray(order.tickets) || order.tickets.length !== order.quantity) {
      throw new Error('Ticket records could not be confirmed.')
    }

    return {
      status: 'paid',
      tickets: order.tickets.map(ticket => ({
        ticket_code: ticket.ticket_code,
        full_name: order.full_name,
        email: order.email,
        phone: order.phone,
        event_name: order.event_name,
        event_date: order.event_date,
        quantity: order.quantity,
        amount_kobo: order.amount_kobo,
      })),
    }
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${settings.paystackSecretKey}`       },
      cache: 'no-store',
      signal: AbortSignal.timeout(TICKET_REQUEST_TIMEOUT_MS),
    },
  )
  if (!response.ok) throw new Error('Could not verify payment with Paystack.')

  let verification: PaystackVerification
  try {
    verification = await response.json() as PaystackVerification
  } catch {
    throw new Error('Paystack returned an invalid verification response.')
  }
  if (!verification.status || !verification.data) {
    throw new Error('Paystack could not verify this transaction.')
  }

  const payment = verification.data
  const verifiedEmail = payment?.customer?.email
  if (
    payment.reference !== order.reference ||
    !verifiedEmail ||
    verifiedEmail.toLowerCase() !== order.email.toLowerCase()
  ) {
    throw new Error('Payment could not be verified against this ticket order.')
  }

  if (payment.status !== 'success') {
    if (['failed', 'abandoned', 'reversed'].includes(payment.status ?? '')) {
      await supabaseRequest<boolean>('rpc/fail_ticket_order', {
        method: 'POST',
        body: JSON.stringify({ p_reference: order.reference }),
      })
      return { status: 'failed' }
    }

    return { status: 'pending' }
  }

  if (
    payment.amount !== order.amount_kobo ||
    payment.currency !== order.currency ||
    payment.currency !== 'NGN'
  ) {
    throw new Error('Payment could not be verified against this ticket order.')
  }

  const tickets = await supabaseRequest<IssuedTicket[]>('rpc/complete_ticket_order', {
    method: 'POST',
    body: JSON.stringify({
      p_reference: order.reference,
      p_amount_kobo: payment.amount,
      p_currency: payment.currency,
      p_email: verifiedEmail,
    }),
  })

  if (tickets.length !== order.quantity) {
    throw new Error('Ticket records could not be confirmed.')
  }

  return { status: 'paid', tickets }
}

export async function redeemTicket(ticketCode: string) {
  const result = await supabaseRequest<TicketRedemption[]>('rpc/redeem_ticket', {
    method: 'POST',
    body: JSON.stringify({ p_ticket_code: ticketCode }),
  })

  if (!Array.isArray(result) || result.length !== 1) {
    throw new Error('Ticket redemption result was invalid.')
  }

  return result[0]
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

async function sendTicketEmail(tickets: IssuedTicket[], options: { to?: string; preview?: boolean } = {}) {
  const [firstTicket] = tickets
  const isPreview = options.preview === true
  const eventTime = process.env.TICKET_EVENT_TIME?.trim() || '9 PM till Sunrise'
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: {
      user: process.env.GG_MAIL_USER,
      pass: process.env.GG_MAIL_PASS,
    },
  })
  const safeName = escapeHtml(firstTicket.full_name)
  const formattedEventDate = new Date(`${firstTicket.event_date}T00:00:00Z`).toLocaleDateString('en-NG', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const logo = await readFile(path.join(process.cwd(), 'public', 'banners', 'Groove-Garden-Email-Logo.png'))
  const ticketImages = await Promise.all(tickets.map(async ticket => ({
    ticket,
    cid: `ticket-${ticket.ticket_code}-${randomUUID()}@groovegarden`,
    content: await createTicketPng({
      ticketCode: ticket.ticket_code,
      fullName: ticket.full_name,
      email: isPreview ? 'Preview only - not for entry' : ticket.email,
      eventName: ticket.event_name,
      eventDate: formattedEventDate,
      eventTime,
      logoDataUri: `data:image/png;base64,${logo.toString('base64')}`,
      qrDataUri: `data:image/png;base64,${(await QRCode.toBuffer(
        isPreview ? 'PREVIEW-NOT-VALID' : ticket.ticket_code,
        { errorCorrectionLevel: 'H', margin: 2, width: 320 },
      )).toString('base64')}`,
    }),
  })))
  const ticketCards = ticketImages.map(({ ticket, cid }) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;border:1px solid #e85d04;border-radius:12px;border-collapse:separate;border-spacing:0;">
      <tr><td align="center" style="padding:8px;background:#fffaf0;border-radius:11px;">
        <img src="cid:${cid}" alt="Groove Garden ticket for ${escapeHtml(ticket.full_name)}; ticket ID ${escapeHtml(ticket.ticket_code)}; includes logo and QR code" width="640" style="display:block;width:100%;max-width:640px;height:auto;border:0;" />
      </td></tr>
      <tr><td align="center" style="padding:12px;background:#fffaf0;color:#69747c;font:11px/1.5 Arial,sans-serif;">
        A downloadable PNG copy of this ticket is attached to this email.
      </td></tr>
    </table>
  `).join('')

  await transporter.sendMail({
    from: process.env.GG_MAIL_USER,
    to: options.to || firstTicket.email,
    subject: isPreview
      ? `Groove Garden ticket design preview - ${firstTicket.event_name}`
      : `Your Groove Garden ticket${tickets.length > 1 ? 's' : ''} - ${firstTicket.event_name}`,
    attachments: [
      ...ticketImages.map(({ ticket, cid, content }) => ({
        filename: `groove-garden-ticket-display-${ticket.ticket_code}.png`,
        content,
        contentType: 'image/png',
        contentDisposition: 'inline' as const,
        cid,
        headers: { 'X-Attachment-Id': cid },
      })),
      ...ticketImages.map(({ ticket, content }) => ({
        filename: `groove-garden-ticket-${ticket.ticket_code}.png`,
        content,
        contentType: 'image/png',
        contentDisposition: 'attachment' as const,
      })),
    ],
    text: [
      `Hi ${firstTicket.full_name},`,
      isPreview
        ? `This is a ticket design preview for ${firstTicket.event_name}. It is not a purchase or a valid entry ticket.`
        : `Your payment is confirmed for ${firstTicket.event_name} on ${firstTicket.event_date}.`,
      `Event time: ${eventTime}`,
      `Name: ${firstTicket.full_name}`,
      `Email: ${firstTicket.email}`,
      `Phone: ${firstTicket.phone}`,
      `Ticket: 1 person`,
      ...(isPreview
        ? [`Ticket price shown in the design: NGN ${(firstTicket.amount_kobo / 100).toLocaleString('en-NG')}`]
        : [`Amount paid: NGN ${(firstTicket.amount_kobo / 100).toLocaleString('en-NG')}`]),
      `Ticket IDs: ${tickets.map(ticket => ticket.ticket_code).join(', ')}`,
      ...(isPreview ? ['PREVIEW ONLY - This ticket and QR code are not valid for entry.'] : []),
      'A downloadable PNG copy of your ticket is attached to this email.',
      'This ticket is valid for one entry only and can be used once at the gate.',
      'For more enquiries or payment issues, contact groovegardenhq@gmail.com and our team will assist you.',
      `View event details: ${createTicketEventDetailsUrl()}`,
      'Groove Garden',
    ].join('\n'),
    html: `<!doctype html><html><body style="margin:0;background:#f1eee8;padding:24px;font-family:Arial,sans-serif;color:#172c42;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;">
          <tr><td style="padding:10px 4px 18px;font:12px Arial,sans-serif;color:#69747c;">${isPreview ? 'GROOVE GARDEN - TICKET DESIGN PREVIEW - NOT VALID FOR ENTRY' : 'GROOVE GARDEN - PAYMENT CONFIRMED'}</td></tr>
          <tr><td style="font:15px/1.6 Arial,sans-serif;color:#273d52;">Hi ${safeName}, ${isPreview ? 'this is a design preview only. It is not a purchase or valid entry ticket.' : 'your payment is confirmed. Your personal event ticket is below.'}</td></tr>
          <tr><td>${ticketCards}</td></tr>
          <tr><td style="padding:0 4px;color:#69747c;font:12px/1.6 Arial,sans-serif;">${isPreview ? `Ticket price shown: NGN ${(firstTicket.amount_kobo / 100).toLocaleString('en-NG')} - This preview and its QR code are not valid for entry.` : `Paid: NGN ${(firstTicket.amount_kobo / 100).toLocaleString('en-NG')} - Keep this ticket available and present it at the entrance.`}</td></tr>
          <tr><td align="center" style="padding:18px 4px 4px;"><a href="${createTicketEventDetailsUrl()}" style="display:inline-block;padding:12px 20px;color:#fffaf0;background:#142b43;border-radius:6px;font:bold 12px Arial,sans-serif;text-decoration:none;letter-spacing:1px;">VIEW EVENT DETAILS</a></td></tr>
          <tr><td style="padding:12px 4px 0;color:#69747c;font:12px/1.6 Arial,sans-serif;">For more enquiries or payment issues, contact <a href="mailto:groovegardenhq@gmail.com" style="color:#d85213;font-weight:bold;">groovegardenhq@gmail.com</a> and our team will be happy to assist you.</td></tr>
        </table>
      </td></tr></table>
    </body></html>`,
  })
}

export async function sendTicketDesignPreview(recipient: string) {
  const eventName = process.env.TICKET_EVENT_NAME?.trim()
  const eventDate = process.env.TICKET_EVENT_DATE?.trim()
  const price = getTicketPrice()
  if (!eventName || !eventDate || !price || !process.env.GG_MAIL_USER || !process.env.GG_MAIL_PASS) {
    throw new Error('Ticket preview email settings are incomplete.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('A valid preview email recipient is required.')
  }
  await sendTicketEmail([{
    ticket_code: 'PREVIEW',
    full_name: 'Ticket Preview',
    email: recipient,
    phone: '',
    event_name: eventName,
    event_date: eventDate,
    quantity: 1,
    amount_kobo: price * 100,
  }], { to: recipient, preview: true })
}

export async function emailTicketsIfNeeded(reference: string, tickets: IssuedTicket[]) {
  const claimed = await supabaseRequest<boolean>('rpc/claim_ticket_email', {
    method: 'POST',
    body: JSON.stringify({ p_reference: reference }),
  })

  if (!claimed) {
    const orders = await supabaseRequest<Array<{ email_sent_at: string | null }>>(
      `ticket_orders?reference=eq.${encodeURIComponent(reference)}&select=email_sent_at`,
    )
    return Boolean(orders[0]?.email_sent_at)
  }

  try {
    await sendTicketEmail(tickets)
    await supabaseRequest('rpc/mark_ticket_email_sent', {
      method: 'POST',
      body: JSON.stringify({ p_reference: reference }),
    })
    return true
  } catch (error) {
    try {
      await supabaseRequest('rpc/release_ticket_email', {
        method: 'POST',
        body: JSON.stringify({ p_reference: reference }),
      })
    } catch {
      console.error('Failed to release ticket email delivery claim.')
    }
    throw error
  }
}

export async function emailPaidOrderTickets(reference: string) {
  const orders = await supabaseRequest<TicketOrderForEmail[]>(
    `ticket_orders?reference=eq.${encodeURIComponent(reference)}&status=eq.paid&select=id,full_name,email,phone,event_name,event_date,quantity,amount_kobo`,
  )
  const order = orders[0]
  if (!order) throw new Error('Ticket payment is not confirmed.')

  const ticketRows = await supabaseRequest<Array<{ ticket_code: string; slot_number: number }>>(
    `tickets?order_id=eq.${encodeURIComponent(order.id)}&select=ticket_code,slot_number&order=slot_number.asc`,
  )
  if (ticketRows.length !== order.quantity) {
    throw new Error('Confirmed ticket records are not ready for email.')
  }

  const tickets: IssuedTicket[] = ticketRows.map(ticket => ({
    ...order,
    ticket_code: ticket.ticket_code,
  }))
  return emailTicketsIfNeeded(reference, tickets)
}

export async function getPaidTicketForDownload(ticketCode: string) {
  const rows = await supabaseRequest<Array<{ order_id: string; ticket_code: string }>>(
    `tickets?ticket_code=eq.${encodeURIComponent(ticketCode)}&select=order_id,ticket_code&limit=1`,
  )
  const ticket = rows[0]
  if (!ticket) return null

  const orders = await supabaseRequest<TicketOrderForEmail[]>(
    `ticket_orders?id=eq.${encodeURIComponent(ticket.order_id)}&status=eq.paid&select=id,full_name,email,phone,event_name,event_date,quantity,amount_kobo`,
  )
  const order = orders[0]
  if (!order) return null

  return { ...order, ticket_code: ticket.ticket_code }
}

export function isValidTicketReference(reference: unknown): reference is string {
  return typeof reference === 'string' && /^[A-Za-z0-9._=-]{1,100}$/.test(reference)
}

export function isValidPaystackSignature(body: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false

  const expected = createHmac('sha512', secret).update(body).digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}
