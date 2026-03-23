'use client'

import { useState, useRef } from 'react'

type InputMode = 'paste' | 'screenshot' | 'figma'
type Tool = 'tone' | 'pipeline'

interface InputPanelProps {
  onRun: (text: string, tool: Tool, brief?: string) => void
  isRunning: boolean
}

export default function InputPanel({ onRun, isRunning }: InputPanelProps) {
  const [inputMode, setInputMode] = useState<InputMode>('paste')
  const [tool, setTool] = useState<Tool>('tone')
  const [pasteText, setPasteText] = useState('')
  const [figmaUrl, setFigmaUrl] = useState('')
  const [brief, setBrief] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageData, setImageData] = useState<{ base64: string; mediaType: string } | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(file: File) {
    setExtractError('')
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64 = result.split(',')[1]
      setImagePreview(result)
      setImageData({ base64, mediaType })
    }
    reader.readAsDataURL(file)
  }

  async function extractAndRun() {
    setExtractError('')

    if (inputMode === 'paste') {
      if (!pasteText.trim()) return
      onRun(pasteText, tool, tool === 'pipeline' ? brief : undefined)
      return
    }

    if (inputMode === 'screenshot') {
      if (!imageData) return
      setExtracting(true)
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'screenshot', ...imageData }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        onRun(data.text, tool, tool === 'pipeline' ? brief : undefined)
      } catch (err) {
        setExtractError(err instanceof Error ? err.message : 'Extraction failed')
      } finally {
        setExtracting(false)
      }
      return
    }

    if (inputMode === 'figma') {
      if (!figmaUrl.trim()) return
      setExtracting(true)
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'figma', url: figmaUrl }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        onRun(data.text, tool, tool === 'pipeline' ? brief : undefined)
      } catch (err) {
        setExtractError(err instanceof Error ? err.message : 'Extraction failed')
      } finally {
        setExtracting(false)
      }
      return
    }
  }

  const canRun =
    !isRunning &&
    !extracting &&
    (inputMode === 'paste' ? !!pasteText.trim() :
     inputMode === 'screenshot' ? !!imageData :
     !!figmaUrl.trim())

  const buttonLabel = extracting ? 'Extracting text…' : isRunning ? 'Running…' : 'Run'

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
      {/* Tool selector */}
      <div className="flex gap-2">
        {(['tone', 'pipeline'] as Tool[]).map(t => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tool === t
                ? 'bg-brand-red text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'tone' ? 'Tone Checker' : 'Content Pipeline'}
          </button>
        ))}
      </div>

      {/* Input mode tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {(['paste', 'screenshot', 'figma'] as InputMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => { setInputMode(mode); setExtractError('') }}
            className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${
              inputMode === mode
                ? 'border-brand-red text-brand-dark font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {mode === 'screenshot' ? 'Screenshot' : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Input area */}
      {inputMode === 'paste' && (
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder="Paste your copy here…"
          rows={6}
          className="w-full px-4 py-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
        />
      )}

      {inputMode === 'screenshot' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleImageUpload(file)
          }}
          className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-brand-red transition-colors"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded object-contain" />
          ) : (
            <div className="text-gray-400 text-sm">
              <p className="font-medium text-gray-600 mb-1">Drop a screenshot here</p>
              <p>or click to upload — PNG, JPG, GIF, WebP</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
          />
        </div>
      )}

      {inputMode === 'figma' && (
        <input
          type="url"
          value={figmaUrl}
          onChange={e => setFigmaUrl(e.target.value)}
          placeholder="https://www.figma.com/file/…?node-id=…"
          className="w-full px-4 py-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red"
        />
      )}

      {/* Brief field for pipeline */}
      {tool === 'pipeline' && (
        <textarea
          value={brief}
          onChange={e => setBrief(e.target.value)}
          placeholder="Optional: add a brief (audience, goal, content type, requirements)…"
          rows={3}
          className="w-full px-4 py-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
        />
      )}

      {extractError && (
        <p className="text-sm text-red-500">{extractError}</p>
      )}

      <button
        onClick={extractAndRun}
        disabled={!canRun}
        className="w-full py-3 bg-brand-red text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {buttonLabel}
      </button>
    </div>
  )
}
