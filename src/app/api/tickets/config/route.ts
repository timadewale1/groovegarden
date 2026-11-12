import { NextResponse } from 'next/server'
import { getPublicTicketSettings } from '@/lib/tickets'

export async function GET() {
  return NextResponse.json(getPublicTicketSettings(), {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
