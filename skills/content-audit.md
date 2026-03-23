# Skill: Content Audit

Exports all copy from a Figma file into a Google Sheet — organised by full design path, with screen images and duplicate detection.

---

## How to invoke

In the web app, select the **Content Audit** tab, paste a full Figma file URL, and click **Export to Google Sheets**.

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

## Setup required (one-time)

The audit feature requires a Google Cloud service account to create and write Google Sheets.

### 1. Create a Google Cloud project and enable APIs
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google Sheets API** and **Google Drive API**

### 2. Create a service account
1. IAM & Admin → Service Accounts → Create Service Account
2. Give it a name (e.g. "content-audit")
3. Click through to the Keys tab → Add Key → JSON
4. Download the JSON file

### 3. Set environment variables
From the downloaded JSON file, copy:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

Add to `.env.local` and to the Vercel dashboard:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=audit@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
GOOGLE_SHARE_EMAIL=your-email@company.com   # optional: auto-shares each sheet with you
```

---

## Notes
- Figma image URLs in the sheet are signed and expire after ~14 days. Re-run the audit to refresh them.
- The Figma file must be accessible with your `FIGMA_TOKEN`. Make sure the token has read access to the file.
- Large files (hundreds of frames) may take 30-60 seconds to process.
