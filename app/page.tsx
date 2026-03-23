'use client'

import { useState } from 'react'
import InputPanel from '@/components/InputPanel'
import ResultsPanel from '@/components/ResultsPanel'

type Tool = 'tone' | 'pipeline' | 'audit'

interface AuditResult {
  url: string
  rowCount: number
  fileName: string
}

export default function Home() {
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [activeTool, setActiveTool] = useState<Tool>('tone')
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)

  async function handleRun(text: string, tool: Tool, brief?: string) {
    setActiveTool(tool)
    setOutput('')
    setAuditResult(null)
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

  function handleAuditComplete(result: AuditResult) {
    setActiveTool('audit')
    setAuditResult(result)
    setOutput('')
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
          <button
            onClick={async () => {
              await fetch('/api/logout', { method: 'POST' })
              window.location.href = '/login'
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <InputPanel
            onRun={handleRun}
            onAuditComplete={handleAuditComplete}
            isRunning={isRunning}
          />

          {/* Audit result card */}
          {activeTool === 'audit' && auditResult ? (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Audit complete</h2>
              <div className="bg-brand-gray rounded-xl p-4 space-y-1">
                <p className="text-sm font-medium text-brand-dark">{auditResult.fileName}</p>
                <p className="text-xs text-gray-500">{auditResult.rowCount} unique pieces of copy exported</p>
              </div>
              <a
                href={auditResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-brand-red text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Open Google Sheet →
              </a>
            </div>
          ) : (
            <ResultsPanel output={output} isRunning={isRunning} tool={activeTool as 'tone' | 'pipeline'} />
          )}
        </div>
      </main>
    </div>
  )
}
