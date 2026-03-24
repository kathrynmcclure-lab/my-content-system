interface FigmaNode {
  type: string
  id: string
  name: string
  characters?: string
  children?: FigmaNode[]
}

export interface AuditTextEntry {
  text: string
  path: string
  frameId: string
  frameName: string
}

interface FigmaApiResponse {
  nodes: {
    [nodeId: string]: {
      document: FigmaNode
    }
  }
}

export function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  try {
    const parsed = new URL(url)

    // Support both /file/ and /design/ URL formats
    const fileMatch = parsed.pathname.match(/\/(file|design)\/([^/]+)/)
    if (!fileMatch) return null
    const fileKey = fileMatch[2]

    const nodeId = parsed.searchParams.get('node-id')
    if (!nodeId) return null

    // Normalize node-id: Figma URLs use - but API uses :
    const normalizedNodeId = nodeId.replace('-', ':')

    return { fileKey, nodeId: normalizedNodeId }
  } catch {
    return null
  }
}

function collectTextNodes(node: FigmaNode): string[] {
  const texts: string[] = []

  if (node.type === 'TEXT' && node.characters) {
    texts.push(node.characters)
  }

  if (node.children) {
    for (const child of node.children) {
      texts.push(...collectTextNodes(child))
    }
  }

  return texts
}

export function parseFigmaFileKey(url: string): string | null {
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/\/(file|design)\/([^/]+)/)
    return match ? match[2] : null
  } catch {
    return null
  }
}

function collectAuditNodes(
  node: FigmaNode,
  ancestors: string[],
  frameId: string,
  frameName: string,
  results: AuditTextEntry[]
) {
  const currentPath = [...ancestors, node.name]

  if (node.type === 'TEXT' && node.characters?.trim()) {
    results.push({
      text: node.characters.trim(),
      path: currentPath.join(' > '),
      frameId,
      frameName,
    })
  }

  if (node.children) {
    for (const child of node.children) {
      collectAuditNodes(child, currentPath, frameId, frameName, results)
    }
  }
}

export async function extractFullFile(fileKey: string): Promise<{ entries: AuditTextEntry[]; fileName: string }> {
  const token = process.env.FIGMA_TOKEN
  if (!token) throw new Error('FIGMA_TOKEN is not configured.')

  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=10`, {
    headers: { 'X-Figma-Token': token },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Figma API error: ${response.status} — ${error}`)
  }

  const data = await response.json()
  const fileName: string = data.name || 'Untitled'
  const entries: AuditTextEntry[] = []

  for (const page of data.document.children) {
    if (!page.children) continue
    for (const frame of page.children) {
      // Only top-level frames (screens)
      if (!['FRAME', 'COMPONENT', 'COMPONENT_SET', 'GROUP'].includes(frame.type)) continue
      const ancestors = [page.name, frame.name]
      collectAuditNodes(frame, ancestors, frame.id, frame.name, entries)
    }
  }

  return { entries, fileName }
}

export async function renderFrameImages(
  fileKey: string,
  frameIds: string[]
): Promise<Map<string, string>> {
  const token = process.env.FIGMA_TOKEN
  if (!token) throw new Error('FIGMA_TOKEN is not configured.')

  // Figma API accepts max 100 ids per request
  const chunks: string[][] = []
  for (let i = 0; i < frameIds.length; i += 100) {
    chunks.push(frameIds.slice(i, i + 100))
  }

  const imageMap = new Map<string, string>()

  for (const chunk of chunks) {
    const ids = chunk.map(id => encodeURIComponent(id)).join(',')
    const response = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=png&scale=1`,
      { headers: { 'X-Figma-Token': token } }
    )

    if (!response.ok) continue

    const data = await response.json()
    if (data.images) {
      for (const [id, url] of Object.entries(data.images)) {
        if (url) imageMap.set(id, url as string)
      }
    }
  }

  return imageMap
}

export async function extractTextFromFigma(url: string): Promise<string> {
  const parsed = parseFigmaUrl(url)
  if (!parsed) {
    throw new Error('Invalid Figma URL. Paste a frame or component link that includes a node-id parameter.')
  }

  const { fileKey, nodeId } = parsed
  const token = process.env.FIGMA_TOKEN
  if (!token) throw new Error('FIGMA_TOKEN is not configured.')

  const apiUrl = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`

  const response = await fetch(apiUrl, {
    headers: { 'X-Figma-Token': token },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Figma API error: ${response.status} — ${error}`)
  }

  const data: FigmaApiResponse = await response.json()
  const nodeEntry = data.nodes[nodeId] || data.nodes[Object.keys(data.nodes)[0]]

  if (!nodeEntry) throw new Error('Node not found in Figma response.')

  const texts = collectTextNodes(nodeEntry.document)
  if (texts.length === 0) throw new Error('No text found in this Figma frame.')

  return texts.join('\n')
}
