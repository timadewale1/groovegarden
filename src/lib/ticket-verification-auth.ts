import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const TICKET_VERIFICATION_COOKIE = 'gg_ticket_verifier'
export const TICKET_VERIFICATION_SESSION_SECONDS = 12 * 60 * 60

function getSessionSecret() {
  const secret = process.env.TICKET_VERIFY_SESSION_SECRET
  if (!secret || secret.length < 32 || /replace|placeholder|generate/i.test(secret)) {
    throw new Error('Ticket verification session secret is not configured.')
  }
  return secret
}

function signatureFor(expiresAt: string) {
  return createHmac('sha256', getSessionSecret())
    .update(`groove-garden-ticket-verifier:${expiresAt}`)
    .digest('base64url')
}

function constantTimeEqual(left: string, right: string) {
  const leftHash = createHash('sha256').update(left).digest()
  const rightHash = createHash('sha256').update(right).digest()
  return timingSafeEqual(leftHash, rightHash)
}

export function isValidTicketVerifierCode(code: unknown) {
  const expectedCode = process.env.TICKET_VERIFY_LOGIN_CODE
  return (
    typeof code === 'string' &&
    Boolean(expectedCode) &&
    constantTimeEqual(code, expectedCode!)
  )
}

export function createTicketVerifierSession() {
  const expiresAt = String(Math.floor(Date.now() / 1000) + TICKET_VERIFICATION_SESSION_SECONDS)
  return `${expiresAt}.${signatureFor(expiresAt)}`
}

export function hasTicketVerifierSession(cookieHeader: string | null) {
  const cookie = cookieHeader
    ?.split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${TICKET_VERIFICATION_COOKIE}=`))
    ?.slice(TICKET_VERIFICATION_COOKIE.length + 1)

  if (!cookie) return false
  const [expiresAt, signature, extra] = cookie.split('.')
  if (!expiresAt || !signature || extra || !/^\d{10}$/.test(expiresAt)) return false

  const expiration = Number(expiresAt)
  const now = Math.floor(Date.now() / 1000)
  if (expiration <= now || expiration > now + TICKET_VERIFICATION_SESSION_SECONDS) return false

  try {
    return constantTimeEqual(signature, signatureFor(expiresAt))
  } catch {
    return false
  }
}

export function ticketVerifierCookie(session: string, maxAge = TICKET_VERIFICATION_SESSION_SECONDS) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${TICKET_VERIFICATION_COOKIE}=${session}; HttpOnly; SameSite=Strict; Path=/api/tickets; Max-Age=${maxAge}${secure}`
}
