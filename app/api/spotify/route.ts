import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing Spotify URL' }, { status: 400 })
  }

  try {
    // Fetch the raw HTML of the Spotify track page
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!res.ok) {
      throw new Error('Failed to fetch from Spotify')
    }

    const html = await res.text()
    
    // Extract metadata from Open Graph tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i)
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i)
    const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i)
    
    const title = titleMatch ? titleMatch[1] : ''
    let artist = ''
    const coverUrl = imgMatch ? imgMatch[1] : ''

    // Description format is typically: "Artist Name · Song · Year"
    if (descMatch && descMatch[1]) {
      const parts = descMatch[1].split('·')
      if (parts.length > 0) {
        artist = parts[0].trim()
      }
    }

    return NextResponse.json({
      title,
      artist,
      coverUrl,
    })
  } catch (error) {
    console.error('Spotify API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch song details' }, { status: 500 })
  }
}
