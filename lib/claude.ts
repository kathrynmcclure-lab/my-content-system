import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function streamText(
  systemPrompt: string,
  userMessage: string,
  onChunk: (text: string) => void
): Promise<void> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  })

  const result = await model.generateContentStream(userMessage)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) onChunk(text)
  }
}

export async function extractTextFromImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Image,
        mimeType: mediaType,
      },
    },
    'Extract all visible text from this image exactly as written. Return only the text content, preserving line breaks. Do not add any commentary or formatting.',
  ])

  return result.response.text()
}
