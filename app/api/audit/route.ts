import { NextRequest } from 'next/server'
import { extractFullFile, renderFrameImages, parseFigmaFileKey } from '@/lib/figma'
import { createAuditWorkbook, AuditRow } from '@/lib/excel'

export async function POST(req: NextRequest) {
  try {
    const { figmaUrl } = await req.json()

    if (!figmaUrl?.trim()) {
      return new Response(JSON.stringify({ error: 'No Figma URL provided.' }), { status: 400 })
    }

    const fileKey = parseFigmaFileKey(figmaUrl)
    if (!fileKey) {
      return new Response(JSON.stringify({ error: 'Invalid Figma URL. Use a full file URL.' }), { status: 400 })
    }

    // Step 1: Extract all text entries with full paths
    const { entries, fileName } = await extractFullFile(fileKey)

    if (entries.length === 0) {
      return new Response(JSON.stringify({ error: 'No text found in this Figma file.' }), { status: 400 })
    }

    // Step 2: Deduplicate by exact text content
    const grouped = new Map<string, typeof entries>()
    for (const entry of entries) {
      const existing = grouped.get(entry.text) ?? []
      existing.push(entry)
      grouped.set(entry.text, existing)
    }

    // Step 3: Render frame images for all unique frames
    const uniqueFrameIds = Array.from(new Set(entries.map(e => e.frameId)))
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

    // Step 5: Generate Excel workbook
    const buffer = await createAuditWorkbook(rows, fileName)

    const safeName = fileName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const date = new Date().toISOString().split('T')[0]

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="content-audit-${safeName}-${date}.xlsx"`,
        'X-Row-Count': String(rows.length),
        'X-File-Name': fileName,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed.'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
