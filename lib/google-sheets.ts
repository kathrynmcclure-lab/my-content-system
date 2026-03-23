import { google } from 'googleapis'

export interface AuditRow {
  path: string
  text: string
  imageUrl: string
  occurrences: number
  allPaths: string
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY must be set.')
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })
}

export async function createAuditSheet(
  rows: AuditRow[],
  fileName: string
): Promise<string> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const drive = google.drive({ version: 'v3', auth })

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const title = `Content Audit — ${fileName} — ${today}`

  // Create the spreadsheet
  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: 'Audit', gridProperties: { frozenRowCount: 1 } } }],
    },
  })

  const spreadsheetId = created.data.spreadsheetId!
  const sheetId = created.data.sheets![0].properties!.sheetId!

  // Build row data: header + content rows
  const headerRow = ['Flow / Path', 'Copy', 'Context', 'Occurrences', 'All Paths']
  const dataRows = rows.map(row => [
    row.path,
    row.text,
    row.imageUrl ? `=IMAGE("${row.imageUrl}")` : '',
    row.occurrences,
    row.allPaths,
  ])

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Audit!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headerRow, ...dataRows] },
  })

  // Format: bold header, column widths, row heights, text wrap
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Bold header row
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 } } },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        },
        // Column widths (pixels)
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 300 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 350 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 220 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 110 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, properties: { pixelSize: 400 }, fields: 'pixelSize' } },
        // Row heights for data rows (150px for images)
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: rows.length + 1 },
            properties: { pixelSize: 150 },
            fields: 'pixelSize',
          },
        },
        // Wrap text for path and copy columns
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 2 },
            cell: { userEnteredFormat: { wrapStrategy: 'WRAP', verticalAlignment: 'TOP' } },
            fields: 'userEnteredFormat(wrapStrategy,verticalAlignment)',
          },
        },
      ],
    },
  })

  // Share with user email if configured
  const shareEmail = process.env.GOOGLE_SHARE_EMAIL
  if (shareEmail) {
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: { type: 'user', role: 'writer', emailAddress: shareEmail },
      sendNotificationEmail: false,
    })
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
}
