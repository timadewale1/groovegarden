import { NextResponse } from 'next/server'
import { hasNumbersDashboardSession } from '@/lib/numbers-dashboard-auth'
import {
  getNumbersDashboardData,
  isValidNumbersDashboardPageSize,
} from '@/lib/numbers-dashboard'

const noStore = { 'Cache-Control': 'no-store' }

export async function GET(request: Request) {
  if (!hasNumbersDashboardSession(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Sign in to view ticket records.' }, { status: 401, headers: noStore })
  }

  const searchParams = new URL(request.url).searchParams
  const page = Number(searchParams.get('page') || '1')
  const pageSize = Number(searchParams.get('pageSize') || '25')
  const search = searchParams.get('search') || ''
  const eventDate = searchParams.get('eventDate') || ''
  const typeValue = searchParams.get('type') || 'all'
  const scanValue = searchParams.get('scan') || 'all'
  const validTypes = ['all', 'entry', 'cabana_regular', 'cabana_premium'] as const
  const validScans = ['all', 'scanned', 'not-scanned'] as const

  if (
    !Number.isSafeInteger(page) || page < 1 || page > 1_000_000 ||
    !Number.isSafeInteger(pageSize) || !isValidNumbersDashboardPageSize(pageSize) ||
    search.length > 100 ||
    (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) ||
    !validTypes.includes(typeValue as (typeof validTypes)[number]) ||
    !validScans.includes(scanValue as (typeof validScans)[number])
  ) {
    return NextResponse.json({ error: 'Invalid dashboard filters.' }, { status: 400, headers: noStore })
  }

  try {
    const data = await getNumbersDashboardData({
      page,
      pageSize,
      search,
      eventDate,
      type: typeValue as (typeof validTypes)[number],
      scan: scanValue as (typeof validScans)[number],
    })
    return NextResponse.json(data, { headers: noStore })
  } catch (error) {
    console.error('Numbers dashboard data request failed.', error)
    return NextResponse.json(
      { error: 'Could not load ticket records. Please try again.' },
      { status: 503, headers: noStore },
    )
  }
}
