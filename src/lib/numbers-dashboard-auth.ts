import { constantTimeEqual, createSignedSession, hasValidSignedSession, signedSessionCookie } from '@/lib/signed-session'

export const NUMBERS_DASHBOARD_COOKIE = 'gg_numbers_admin'
export const NUMBERS_DASHBOARD_SESSION_SECONDS = 12 * 60 * 60
const SESSION_NAMESPACE = 'groove-garden-numbers-dashboard'

export function isValidNumbersDashboardCode(code: unknown) {
  const expectedCode = process.env.NUMBERS_DASHBOARD_LOGIN_CODE
  return (
    typeof code === 'string' &&
    Boolean(expectedCode) &&
    code.length === expectedCode!.length &&
    constantTimeEqual(code, expectedCode!)
  )
}

export function createNumbersDashboardSession() {
  const secret = process.env.NUMBERS_DASHBOARD_SESSION_SECRET
  if (!secret) throw new Error('Numbers dashboard session signing key is not configured.')
  return createSignedSession(secret, SESSION_NAMESPACE, NUMBERS_DASHBOARD_SESSION_SECONDS)
}

export function hasNumbersDashboardSession(cookieHeader: string | null) {
  return hasValidSignedSession(
    cookieHeader,
    NUMBERS_DASHBOARD_COOKIE,
    process.env.NUMBERS_DASHBOARD_SESSION_SECRET || '',
    SESSION_NAMESPACE,
    NUMBERS_DASHBOARD_SESSION_SECONDS,
  )
}

export function numbersDashboardCookie(session: string, maxAge = NUMBERS_DASHBOARD_SESSION_SECONDS) {
  return signedSessionCookie(NUMBERS_DASHBOARD_COOKIE, session, '/api/numbers', maxAge)
}
