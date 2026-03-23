import { NextRequest, NextResponse } from 'next/server'
import { extractFullFile, renderFrameImages, parseFigmaFileKey } from '@/lib/figma'
import { createAuditSheet, AuditRow } from '@/lib/google-sheets'

export async function POST(req: NextRequest) {
  try {
    const { figmaUrl } = await req.json()

    if (!figmaUrl?.trim()) {
      return NextResponse.json({ error: 'No Figma URL provided.' }, { status: 400 })
    }

    const fileKey = parseFigmaFileKey(figmaUrl)
    if (!fileKey) {
      return NextResponse.json({ error: 'Invalid Figma URL. Use a full file URL.' }, { status: 400 })
    }

    // Step 1: Extract all text entries with full paths
    const { entries, fileName } = await extractFullFile(fileKey)

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No text found in this Figma file.' }, { status: 400 })
    }

    // Step 2: Deduplicate by exact text content
    const grouped = new Map<string, typeof entries>()
    for (const entry of entries) {
      const existing = grouped.get(entry.text) ?? []
      existing.push(entry)
      grouped.set(entry.text, existing)
    }

    // Step 3: Render frame images for all unique frames
    const uniqueFrameIds = [...new Set(entries.map(e => e.frameId))]
    const imageMap = await renderFrameImages(fileKey, uniqueFrameIds)

    // Step 4: Build deduplicated rows sorted by path
    const rows: AuditRow[] = Array.from(grouped.entries())
      .map(([text, dupes]) => ({
        path: dupes[0].path,
        text,
        imageUrl: imageMap.get(dupes[0].frameId) ?? '',
        occurrences: dupes.length,
        allPaths: dupes.length > 1 ? dupes.map(d => d.path).join(' | ') : '',
      }))
      .sort((a, b) => a.path.localeCompare(b.path))

    // Step 5: Create Google Sheet
    const sheetUrl = await createAuditSheet(rows, fileName)

    return NextResponse.json({ url: sheetUrl, rowCount: rows.length, fileName })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
