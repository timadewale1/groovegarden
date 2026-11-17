import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export function constantTimeEqual(left: string, right: string) {
  const leftHash = createHash('sha256').update(left).digest()
  const rightHash = createHash('sha256').update(right).digest()
  return timingSafeEqual(leftHash, rightHash)
}

export function createSignedSession(secret: string, namespace: string, durationSeconds: number) {
  if (secret.length < 32 || /replace|placeholder|generate/i.test(secret)) {
    throw new Error('Session signing secret is not configured.')
  }

  const expiresAt = String(Math.floor(Date.now() / 1000) + durationSeconds)
  const signature = createHmac('sha256', secret)
    .update(`${namespace}:${expiresAt}`)
    .digest('base64url')
  return `${expiresAt}.${signature}`
}

export function hasValidSignedSession(
  cookieHeader: string | null,
  cookieName: string,
  secret: string,
  namespace: string,
  durationSeconds: number,
) {
  const cookie = cookieHeader
    ?.split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1)

  if (!cookie) return false
  const [expiresAt, signature, extra] = cookie.split('.')
  if (!expiresAt || !signature || extra || !/^\d{10}$/.test(expiresAt)) return false

  const expiration = Number(expiresAt)
  const now = Math.floor(Date.now() / 1000)
  if (expiration <= now || expiration > now + durationSeconds) return false

  try {
    if (secret.length < 32 || /replace|placeholder|generate/i.test(secret)) return false
    const expectedSignature = createHmac('sha256', secret)
      .update(`${namespace}:${expiresAt}`)
      .digest('base64url')
    return constantTimeEqual(signature, expectedSignature)
  } catch {
    return false
  }
}

export function signedSessionCookie(
  cookieName: string,
  session: string,
  path: string,
  maxAge: number,
) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${cookieName}=${session}; HttpOnly; SameSite=Strict; Path=${path}; Max-Age=${maxAge}${secure}`
}
