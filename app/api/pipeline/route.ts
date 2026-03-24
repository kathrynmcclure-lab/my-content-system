import { NextRequest } from 'next/server'
import { streamText } from '@/lib/claude'
import { PIPELINE_PROMPT } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  const { text, brief } = await req.json()

  if (!text?.trim()) {
    return new Response('No text provided', { status: 400 })
  }

  const userMessage = brief
    ? `Brief: ${brief}\n\nContent to pipeline:\n\n${text}`
    : `Run the full content pipeline on this content:\n\n${text}`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      await streamText(
        PIPELINE_PROMPT,
        userMessage,
        (chunk) => controller.enqueue(encoder.encode(chunk))
      )
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
