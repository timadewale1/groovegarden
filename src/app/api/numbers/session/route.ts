import { NextResponse } from 'next/server'
import {
  createNumbersDashboardSession,
  hasNumbersDashboardSession,
  isValidNumbersDashboardCode,
  numbersDashboardCookie,
} from '@/lib/numbers-dashboard-auth'

const noStore = { 'Cache-Control': 'no-store' }

export async function GET(request: Request) {
  return NextResponse.json(
    { authenticated: hasNumbersDashboardSession(request.headers.get('cookie')) },
    { headers: noStore },
  )
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Enter the dashboard passcode.' }, { status: 400, headers: noStore })
  }

  const code = body && typeof body === 'object'
    ? (body as Record<string, unknown>).code
    : null
  if (!process.env.NUMBERS_DASHBOARD_LOGIN_CODE || !process.env.NUMBERS_DASHBOARD_SESSION_SECRET) {
    return NextResponse.json(
      { error: 'Dashboard login is not configured on the server.' },
      { status: 503, headers: noStore },
    )
  }
  if (!isValidNumbersDashboardCode(code)) {
    return NextResponse.json({ error: 'Incorrect passcode.' }, { status: 401, headers: noStore })
  }

  try {
    const response = NextResponse.json({ authenticated: true }, { headers: noStore })
    response.headers.set('Set-Cookie', numbersDashboardCookie(createNumbersDashboardSession()))
    return response
  } catch (error) {
    console.error('Numbers dashboard session could not be created.', error)
    return NextResponse.json(
      { error: 'Dashboard login is not available.' },
      { status: 503, headers: noStore },
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false }, { headers: noStore })
  response.headers.set('Set-Cookie', numbersDashboardCookie('', 0))
  return response
}
