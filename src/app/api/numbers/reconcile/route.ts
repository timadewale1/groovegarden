import { NextResponse } from 'next/server'
import { hasNumbersDashboardSession } from '@/lib/numbers-dashboard-auth'
import { reconcilePendingTicketOrders } from '@/lib/tickets'

export const maxDuration = 60

export async function POST(request: Request) {
  if (!hasNumbersDashboardSession(request.headers.get('cookie'))) {
    return NextResponse.json(
      { error: 'Sign in to reconcile pending payments.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const result = await reconcilePendingTicketOrders()
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Ticket payment reconciliation batch failed.', {
      message: error instanceof Error ? error.message.slice(0, 200) : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Could not reconcile pending payments. Try again shortly.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
