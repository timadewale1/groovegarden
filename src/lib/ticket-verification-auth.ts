import {
  constantTimeEqual,
  createSignedSession,
  hasValidSignedSession,
  signedSessionCookie,
} from '@/lib/signed-session'

export const TICKET_VERIFICATION_COOKIE = 'gg_ticket_verifier'
export const TICKET_VERIFICATION_SESSION_SECONDS = 12 * 60 * 60
const SESSION_NAMESPACE = 'groove-garden-ticket-verifier'

function getSessionSecret() {
  const secret = process.env.TICKET_VERIFY_SESSION_SECRET
  if (!secret || secret.length < 32 || /replace|placeholder|generate/i.test(secret)) {
    throw new Error('Ticket verification session secret is not configured.')
  }
  return secret
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
  return createSignedSession(getSessionSecret(), SESSION_NAMESPACE, TICKET_VERIFICATION_SESSION_SECONDS)
}

export function hasTicketVerifierSession(cookieHeader: string | null) {
  const secret = process.env.TICKET_VERIFY_SESSION_SECRET || ''
  return hasValidSignedSession(
    cookieHeader,
    TICKET_VERIFICATION_COOKIE,
    secret,
    SESSION_NAMESPACE,
    TICKET_VERIFICATION_SESSION_SECONDS,
  )
}

export function ticketVerifierCookie(session: string, maxAge = TICKET_VERIFICATION_SESSION_SECONDS) {
  return signedSessionCookie(TICKET_VERIFICATION_COOKIE, session, '/api/tickets', maxAge)
}
