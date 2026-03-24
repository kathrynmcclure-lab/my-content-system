import ExcelJS from 'exceljs'

export interface AuditRow {
  path: string
  text: string
  imageUrl: string
  occurrences: number
  allPaths: string
}

export async function createAuditWorkbook(
  rows: AuditRow[],
  fileName: string
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Ox & Adder Content Tools'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Audit', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  // Column definitions
  sheet.columns = [
    { header: 'Flow / Path', key: 'path', width: 45 },
    { header: 'Copy', key: 'text', width: 55 },
    { header: 'Context', key: 'context', width: 32 },
    { header: 'Occurrences', key: 'occurrences', width: 14 },
    { header: 'All Paths', key: 'allPaths', width: 60 },
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.height = 22
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FF1A1A1A' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } } }
  })

  // Fetch all unique images up front
  const uniqueUrls = Array.from(new Set(rows.map(r => r.imageUrl).filter(Boolean)))
  const imageBase64s = new Map<string, string>()

  await Promise.all(
    uniqueUrls.map(async url => {
      try {
        const res = await fetch(url)
        if (res.ok) {
          const b64 = Buffer.from(await res.arrayBuffer()).toString('base64')
          imageBase64s.set(url, b64)
        }
      } catch {
        // Skip images that fail to fetch
      }
    })
  )

  // Add data rows
  const ROW_HEIGHT = 120
  const IMG_WIDTH = 220
  const IMG_HEIGHT = 110

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowIndex = i + 2 // 1-indexed, row 1 is header

    const dataRow = sheet.addRow({
      path: row.path,
      text: row.text,
      context: '', // image goes here
      occurrences: row.occurrences,
      allPaths: row.allPaths,
    })

    dataRow.height = ROW_HEIGHT

    // Style data cells
    dataRow.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'top', wrapText: true }
      if (colNumber === 4) cell.alignment = { vertical: 'top', horizontal: 'center' }
    })

    // Embed image in Context column (col 3)
    const imgBase64 = imageBase64s.get(row.imageUrl)
    if (imgBase64) {
      try {
        const imageId = workbook.addImage({ base64: imgBase64, extension: 'png' })
        sheet.addImage(imageId, {
          tl: { col: 2, row: rowIndex - 1 } as ExcelJS.Anchor,
          ext: { width: IMG_WIDTH, height: IMG_HEIGHT },
        })
      } catch {
        // If image embedding fails, leave the cell empty rather than corrupt the file
      }
    }

    // Alternate row background
    if (i % 2 === 1) {
      dataRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } }
      })
    }
  }

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer)
}
