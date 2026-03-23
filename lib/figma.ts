interface FigmaNode {
  type: string
  characters?: string
  children?: FigmaNode[]
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
