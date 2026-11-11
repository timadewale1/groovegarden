import { NextResponse } from 'next/server'
import { getPublicTicketSettings } from '@/lib/tickets'

export async function GET() {
  return NextResponse.json(getPublicTicketSettings(), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
