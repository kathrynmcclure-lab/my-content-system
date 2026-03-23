import { NextRequest } from 'next/server'
import { anthropic } from '@/lib/claude'
import { TONE_CHECKER_PROMPT } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  const { text } = await req.json()

  if (!text?.trim()) {
    return new Response('No text provided', { status: 400 })
  }

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: TONE_CHECKER_PROMPT,
    messages: [{ role: 'user', content: `Check the tone of this content:\n\n${text}` }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
