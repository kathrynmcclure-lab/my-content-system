# Skill: Content Audit

Exports all copy from a Figma file into a Google Sheet — organised by full design path, with screen images and duplicate detection.

---

## How to invoke

In the web app, select the **Content Audit** tab, paste a full Figma file URL, and click **Export to Excel**. The `.xlsx` file downloads automatically.

---

## What it does

1. **Extracts all text** from every page, frame, and component in the Figma file using the Figma REST API
2. **Builds the full path** for each piece of copy: `Page > Frame > Component > Element`
3. **Renders each top-level frame** as a PNG image using the Figma image export API
4. **Deduplicates** — any text that appears in multiple locations is collapsed into one row, with all locations listed in the All Paths column
5. **Creates a Google Sheet** with the audit data, images, and formatting

---

## Output columns

| Column | Content |
|--------|---------|
| Flow / Path | Full hierarchy: `Page > Frame > Component > Element` |
| Copy | The text content |
| Context | Screen image showing the copy in context |
| Occurrences | How many times this exact text appears in the file |
| All Paths | All locations if duplicated (separated by \|) |

---

## Setup required

No additional setup needed beyond the existing `FIGMA_TOKEN`. The audit exports a self-contained `.xlsx` file with embedded screen images — no Google account or cloud credentials required.

---

## Notes
- The `.xlsx` file opens in Excel, Google Sheets, or Numbers.
- Screen images are embedded directly in the file — no links to expire.
- Large files (hundreds of frames) may take 30-60 seconds to process.
- The Figma file must be accessible with your `FIGMA_TOKEN`.
