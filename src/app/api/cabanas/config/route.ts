import { NextResponse } from 'next/server'
import { getPublicCabanaSettings } from '@/lib/tickets'

export async function GET() {
  try {
    const settings = await getPublicCabanaSettings()
    return NextResponse.json(settings, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    console.error('Cabana availability could not be loaded.')
    return NextResponse.json(
      { error: 'Cabana availability could not be loaded. Please try again.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
