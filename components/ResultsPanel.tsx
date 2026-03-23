'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface ResultsPanelProps {
  output: string
  isRunning: boolean
  tool: 'tone' | 'pipeline'
}

export default function ResultsPanel({ output, isRunning, tool }: ResultsPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  if (!output && !isRunning) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-400 text-sm">Results will appear here</p>
      </div>
    )
  }

  // Extract review packet content for copy button
  function extractReviewPacket(): string {
    const match = output.match(/---\n## Content Review Packet[\s\S]+?---/)
    return match ? match[0] : output
  }

  async function copyReviewPacket() {
    await navigator.clipboard.writeText(extractReviewPacket())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Color-code FAIL/WARN/PASS inline
  function colorizeOutput(text: string): string {
    return text
      .replace(/^- FAIL\s/gm, '- 🔴 **FAIL** ')
      .replace(/^- WARN\s/gm, '- 🟡 **WARN** ')
      .replace(/✓ No issues found/g, '✅ No issues found')
      .replace(/PASS ✓/g, '**PASS ✓**')
      .replace(/FAIL ✗/g, '**FAIL ✗**')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          {tool === 'tone' ? 'Tone Check Results' : 'Pipeline Results'}
        </h2>
        {tool === 'pipeline' && output.includes('Review Packet') && (
          <button
            onClick={copyReviewPacket}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy review packet'}
          </button>
        )}
      </div>

      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
        <ReactMarkdown>{colorizeOutput(output)}</ReactMarkdown>
        {isRunning && (
          <span className="inline-block w-1.5 h-4 bg-brand-red ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  )
}
