import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromImage } from '@/lib/claude'
import { extractTextFromFigma } from '@/lib/figma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body

    if (type === 'screenshot') {
      const { base64, mediaType } = body
      if (!base64 || !mediaType) {
        return NextResponse.json({ error: 'Missing base64 or mediaType' }, { status: 400 })
      }
      const text = await extractTextFromImage(base64, mediaType)
      return NextResponse.json({ text })
    }

    if (type === 'figma') {
      const { url } = body
      if (!url) {
        return NextResponse.json({ error: 'Missing Figma URL' }, { status: 400 })
      }
      const text = await extractTextFromFigma(url)
      return NextResponse.json({ text })
    }

    return NextResponse.json({ error: 'Unknown extraction type' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
