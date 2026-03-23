'use client'

import { useState } from 'react'
import InputPanel from '@/components/InputPanel'
import ResultsPanel from '@/components/ResultsPanel'

type Tool = 'tone' | 'pipeline'

export default function Home() {
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [activeTool, setActiveTool] = useState<Tool>('tone')

  async function handleRun(text: string, tool: Tool, brief?: string) {
    setActiveTool(tool)
    setOutput('')
    setIsRunning(true)

    try {
      const endpoint = tool === 'tone' ? '/api/tone' : '/api/pipeline'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, brief }),
      })

      if (!res.ok || !res.body) {
        const err = await res.text()
        setOutput(`Error: ${err}`)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setOutput(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch (err) {
      setOutput(`Something went wrong: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center">
              <span className="text-white text-sm font-bold">O</span>
            </div>
            <span className="font-semibold text-brand-dark">Ox & Adder Content Tools</span>
          </div>
          <form action="/api/logout" method="POST">
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/logout', { method: 'POST' })
                window.location.href = '/login'
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <InputPanel onRun={handleRun} isRunning={isRunning} />
          <ResultsPanel output={output} isRunning={isRunning} tool={activeTool} />
        </div>
      </main>
    </div>
  )
}
