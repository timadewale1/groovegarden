import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder')

  if (!folder) {
    return NextResponse.json({ error: 'No folder specified' }, { status: 400 })
  }

  const allowedFolders = ['banners', 'past-events', 'past-flyers', 'main-past-flyers', 'past-events-videos', 'coming-soon']
  if (!allowedFolders.includes(folder)) {
    return NextResponse.json({ error: 'Folder not allowed' }, { status: 403 })
  }

  try {
    const folderPath = path.join(process.cwd(), 'public', folder)

    if (!fs.existsSync(folderPath)) {
      return NextResponse.json(
        { files: [] },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
      )
    }

    const files = fs.readdirSync(folderPath).filter((file) => {
      // Filter out hidden files and system files
      return !file.startsWith('.') && !file.startsWith('_')
    })

    return NextResponse.json(
      { files },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    )
  } catch (error) {
    console.error(`Error reading folder ${folder}:`, error)
    return NextResponse.json({ error: 'Failed to read folder' }, { status: 500 })
  }
}
