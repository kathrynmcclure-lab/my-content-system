import { NextRequest } from 'next/server'
import { streamText } from '@/lib/claude'
import { TONE_CHECKER_PROMPT } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  const { text } = await req.json()

  if (!text?.trim()) {
    return new Response('No text provided', { status: 400 })
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      await streamText(
        TONE_CHECKER_PROMPT,
        `Check the tone of this content:\n\n${text}`,
        (chunk) => controller.enqueue(encoder.encode(chunk))
      )
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
