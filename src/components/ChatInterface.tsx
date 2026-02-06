'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  FileText,
  Table2,
  ChevronDown,
  ChevronRight,
  X,
  User,
} from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import type { Message, Source } from '@/types'

/* ── Theme definitions (from evrlock-layout.jsx) ── */

const THEMES = {
  interpro: {
    accent: '#EE842F',
    accentDark: '#c96d1e',
    accentDim: 'rgba(238, 132, 47, 0.08)',
    accentMid: 'rgba(238, 132, 47, 0.19)',
    bgHero: '#133446',
    logo: '/interpro-logo.svg',
    swapLabel: 'ROCKY MTN',
  },
  rocky: {
    accent: '#FCB53F',
    accentDark: '#d9982e',
    accentDim: 'rgba(252, 181, 63, 0.08)',
    accentMid: 'rgba(252, 181, 63, 0.19)',
    bgHero: '#123549',
    logo: '/rocky-logo.svg',
    swapLabel: 'INTERPRO',
  },
} as const

const SUGGESTION_CHIPS = [
  'What are the EVRlock QB2 running procedures?',
  'Show me EB performance data for 7" casing',
  'What torque values for QB1-HT?',
  'Heavy wall vs light wall compatibility?',
]

const INDEXED_DOCUMENTS = [
  { name: 'EVRlock EB Running Procedure', type: 'document' as const, chunks: 8 },
  { name: 'EVRlock EB Gen2 Running Procedure', type: 'document' as const, chunks: 8 },
  { name: 'EVRlock QB2 Running Procedure', type: 'document' as const, chunks: 7 },
  { name: 'EVRlock QB1-HT Running Procedure', type: 'document' as const, chunks: 7 },
  { name: 'EB Gen2 Coupling Dimensions', type: 'document' as const, chunks: 2 },
  { name: 'QB2 Coupling Dimensions', type: 'document' as const, chunks: 2 },
  { name: 'QB2 TWCCEP Qualification', type: 'document' as const, chunks: 6 },
  { name: 'QB2 Thermal Compression Test', type: 'document' as const, chunks: 6 },
  { name: 'Technical Bulletin — HW/LW Compatibility', type: 'document' as const, chunks: 4 },
  { name: 'Technical Bulletin — Making-Up Accessories', type: 'document' as const, chunks: 2 },
  { name: 'USC Compatibility Bulletin', type: 'document' as const, chunks: 2 },
  { name: 'QB2 Field Bulletin — Stabbing Guide', type: 'document' as const, chunks: 2 },
  { name: 'QB2 Memorandum — Cross-Coupling', type: 'document' as const, chunks: 2 },
  { name: 'ENADATE HC L80 193.68mm BC+SCC', type: 'document' as const, chunks: 1 },
  { name: 'ENADATE MS P110 139.7mm EB', type: 'document' as const, chunks: 1 },
  { name: 'Performance Data — EB Gen2', type: 'spreadsheet' as const, chunks: 5 },
  { name: 'Performance Data — EB', type: 'spreadsheet' as const, chunks: 4 },
  { name: 'Performance Data — QB1-HT', type: 'spreadsheet' as const, chunks: 4 },
  { name: 'Performance Data — QB2', type: 'spreadsheet' as const, chunks: 4 },
  { name: 'Performance Data — QB2-XL', type: 'spreadsheet' as const, chunks: 4 },
]

/* ── 80/20 chat height calculation (from portfolio page.tsx) ── */

function getChatHeight() {
  if (typeof window === 'undefined') return 400
  return Math.floor((window.innerHeight - 150) * 0.8)
}

/* ── Component ── */

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [expandedSources, setExpandedSources] = useState<number | null>(null)
  const [skin, setSkin] = useState<'interpro' | 'rocky'>('interpro')
  const [chatHeight, setChatHeight] = useState(400)
  const [isMobile, setIsMobile] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const theme = THEMES[skin]

  /* ── Layout: resize + mobile detect ── */
  useEffect(() => {
    const update = () => {
      setChatHeight(getChatHeight())
      setIsMobile(window.innerWidth < 768)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  /* ── Theme swap: update CSS custom properties ── */
  useEffect(() => {
    const r = document.documentElement.style
    r.setProperty('--accent', theme.accent)
    r.setProperty('--accent-dark', theme.accentDark)
    r.setProperty('--accent-dim', theme.accentDim)
    r.setProperty('--accent-mid', theme.accentMid)
    r.setProperty('--bg-hero', theme.bgHero)
  }, [theme])

  /* ── Scroll to bottom ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  /* ── Auto-resize textarea ── */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  /* ── Send message ── */
  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let sources: Source[] = []

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulated += parsed.content
                  setStreamingContent(accumulated)
                }
                if (parsed.sources) {
                  sources = parsed.sources
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: accumulated,
        sources,
      }
      setMessages(prev => [...prev, assistantMessage])
      setStreamingContent('')
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setStreamingContent('')
    setInput('')
    setExpandedSources(null)
  }

  const totalChunks = INDEXED_DOCUMENTS.reduce((sum, d) => sum + d.chunks, 0)
  const hasMessages = messages.length > 0

  /* ── Inline sub-sections ── */

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto pb-4 min-h-0">
      <div className="chat-container py-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex gap-3.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Assistant avatar — accent circle with "E" */}
              {message.role === 'assistant' && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--accent)' }}
                >
                  <span className="text-[13px] text-white font-bold font-display">E</span>
                </div>
              )}

              <div className={`flex-1 max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div
                  className={
                    message.role === 'user'
                      ? 'message-user'
                      : 'message-assistant'
                  }
                >
                  {message.role === 'user' ? (
                    <span className="text-sm" style={{ fontFamily: 'var(--font-body)', color: 'var(--text-on-dark)' }}>
                      {message.content}
                    </span>
                  ) : (
                    <div className="prose-chat">
                      <MarkdownRenderer content={message.content} />
                    </div>
                  )}
                </div>

                {/* Sources — reference pills */}
                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() =>
                        setExpandedSources(expandedSources === index ? null : index)
                      }
                      className="flex items-center gap-1.5 text-xs mb-2"
                      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-label)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, fontSize: 10, fontWeight: 500 }}
                    >
                      {expandedSources === index ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      References
                    </button>

                    {/* Always show pills */}
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source, si) => (
                        <span key={si} className="reference-pill">
                          [{si + 1}] {source.name}
                        </span>
                      ))}
                    </div>

                    {/* Expanded source details */}
                    <AnimatePresence>
                      {expandedSources === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 space-y-2 overflow-hidden"
                        >
                          {message.sources.map((source, si) => (
                            <div
                              key={si}
                              className="p-3 rounded-xl text-xs"
                              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                                  {source.name}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-label)' }}>
                                  p.{source.page} &middot; {source.score}
                                </span>
                              </div>
                              <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                                {source.snippet}
                              </p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* User avatar — hero circle with user icon */}
              {message.role === 'user' && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-hero)' }}
                >
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming message */}
        {streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3.5 justify-start"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'var(--accent)' }}
            >
              <span className="text-[13px] text-white font-bold font-display">E</span>
            </div>
            <div className="flex-1 max-w-[85%] sm:max-w-[75%]">
              <div className="message-assistant">
                <div className="prose-chat">
                  <MarkdownRenderer content={streamingContent} />
                  <span className="streaming-cursor" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Typing indicator */}
        {isLoading && !streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3.5 justify-start"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              <span className="text-[13px] text-white font-bold font-display">E</span>
            </div>
            <div className="flex items-center gap-1.5 py-3">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )

  const renderInput = () => (
    <div style={{ background: 'var(--bg)' }}>
      <form onSubmit={handleSubmit} className="chat-container py-4">
        {/* Suggestion chips — shown after messages, before input */}
        {messages.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 mb-4" style={{ paddingLeft: 46 }}>
            {SUGGESTION_CHIPS.slice(0, 3).map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="suggestion-chip"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input wrapper — pill with border and shadow */}
        <div className="chat-input-wrapper" style={{ marginLeft: 46 }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Thinking...' : 'Ask about EVRlock connections...'}
            disabled={isLoading}
            rows={1}
            className="chat-input flex-1 resize-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: 'var(--accent)' }}
            aria-label="Send message"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </form>
    </div>
  )

  const renderSpecsGallery = () => (
    <div className="w-full">
      {/* Gallery header */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <h2
          className="text-xs font-medium uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-label)', color: 'var(--text-muted)', letterSpacing: '0.15em' }}
        >
          Indexed Specifications
        </h2>
      </div>

      {/* Specs cards */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Technical Documents card */}
          <div className="specs-card">
            <div className="specs-card-header">
              <span
                className="text-base font-bold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-on-dark)', letterSpacing: '-0.03em' }}
              >
                Technical Documents
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ fontFamily: 'var(--font-label)', color: 'var(--accent)', letterSpacing: '0.05em' }}
              >
                {INDEXED_DOCUMENTS.filter(d => d.type === 'document').length} docs
              </span>
            </div>
            <div className="p-3">
              {INDEXED_DOCUMENTS.filter(d => d.type === 'document').map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-2"
                  style={{ borderBottom: i < INDEXED_DOCUMENTS.filter(d => d.type === 'document').length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="specs-data-cell w-7 h-7 flex items-center justify-center flex-shrink-0 rounded-md">
                      <FileText className="w-3 h-3" style={{ color: 'var(--accent)' }} />
                    </div>
                    <span
                      className="text-[13px] truncate"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
                    >
                      {doc.name}
                    </span>
                  </div>
                  <span
                    className="text-[11px] flex-shrink-0 ml-2"
                    style={{ fontFamily: 'var(--font-label)', color: 'var(--text-muted)' }}
                  >
                    {doc.chunks} chunks
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Data card */}
          <div className="specs-card">
            <div className="specs-card-header">
              <span
                className="text-base font-bold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-on-dark)', letterSpacing: '-0.03em' }}
              >
                Performance Data
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ fontFamily: 'var(--font-label)', color: 'var(--accent)', letterSpacing: '0.05em' }}
              >
                {INDEXED_DOCUMENTS.filter(d => d.type === 'spreadsheet').length} sheets
              </span>
            </div>
            <div className="p-3">
              {INDEXED_DOCUMENTS.filter(d => d.type === 'spreadsheet').map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-2"
                  style={{ borderBottom: i < INDEXED_DOCUMENTS.filter(d => d.type === 'spreadsheet').length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="specs-data-cell w-7 h-7 flex items-center justify-center flex-shrink-0 rounded-md">
                      <Table2 className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span
                      className="text-[13px] truncate"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
                    >
                      {doc.name}
                    </span>
                  </div>
                  <span
                    className="text-[11px] flex-shrink-0 ml-2"
                    style={{ fontFamily: 'var(--font-label)', color: 'var(--text-muted)' }}
                  >
                    {doc.chunks} chunks
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary footer */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px]" style={{ fontFamily: 'var(--font-label)', color: 'var(--text-muted)' }}>
            {INDEXED_DOCUMENTS.length} documents &middot; {totalChunks} total chunks indexed
          </p>
          <p className="text-[11px]" style={{ fontFamily: 'var(--font-label)', color: 'var(--text-muted)' }}>
            BM25 retrieval &middot; Claude Sonnet
          </p>
        </div>
      </div>
    </div>
  )

  /* ── Main render ── */

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence mode="wait">
        {!hasMessages ? (
          /* ═══════════════════════════════════════════════
             WELCOME SCREEN — no header, centered content
             ═══════════════════════════════════════════════ */
          <motion.div
            key="welcome"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex items-center justify-center min-h-screen"
          >
            <div className="max-w-7xl w-full mx-auto py-12 px-6" style={{ background: 'var(--bg)' }}>
              {/* Logo badge — hero-colored pill with white SVG */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex justify-center mb-8"
              >
                <div
                  className="rounded-full px-6 py-3 inline-flex items-center"
                  style={{ background: 'var(--bg-hero)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={theme.logo} alt="Logo" className="h-[28px]" />
                </div>
              </motion.div>

              {/* Hero banner — 16:9 steel mill image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="max-w-4xl mx-auto mb-10 rounded-2xl overflow-hidden"
                style={{ aspectRatio: '16 / 9' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero-banner.jpg"
                  alt="Steel mill furnace"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-center mb-10"
              >
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-medium mb-6 tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                >
                  Your connection data.{' '}
                  <span style={{ color: 'var(--accent)' }}>Answered instantly.</span>
                </h1>
                <p
                  className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
                >
                  AI-powered technical assistant for EVRlock premium OCTG
                  connections — running procedures, performance data, torque
                  specs, and more.
                </p>
              </motion.div>

              {/* Input */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                onSubmit={handleSubmit}
                className="max-w-2xl mx-auto mb-10"
              >
                <div className="chat-input-wrapper">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about EVRlock connections..."
                    rows={1}
                    className="chat-input flex-1 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ background: 'var(--accent)' }}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </motion.form>

              {/* Suggestion chips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="max-w-2xl mx-auto"
              >
                <p
                  className="text-[10px] mb-4 text-center uppercase"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--text-muted)', letterSpacing: '0.15em', fontWeight: 500 }}
                >
                  Or try one of these
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTION_CHIPS.map((question, index) => (
                    <motion.button
                      key={question}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.45 + index * 0.05 }}
                      onClick={() => handleSend(question)}
                      className="suggestion-chip"
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Footer stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.65 }}
                className="mt-16 text-center"
              >
                <p
                  className="text-[11px]"
                  style={{ fontFamily: 'var(--font-label)', color: 'var(--text-muted)' }}
                >
                  {totalChunks} indexed chunks &middot; {INDEXED_DOCUMENTS.length} documents &middot; BM25 + Claude
                </p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════
             CHAT LAYOUT — header + 80/20 chat/specs split
             ═══════════════════════════════════════════════ */
          <motion.div
            key="chat-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            {/* ─── Header — 150px, hero bg ─── */}
            <header className="h-[150px] flex-shrink-0 header-hero">
              <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo — clickable to reset */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={handleNewChat}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  aria-label="Return to home"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={theme.logo} alt="Logo" className="h-[38px]" />
                </motion.button>

                {/* Right controls */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  {/* Skin swap pill */}
                  <button
                    onClick={() => setSkin(s => (s === 'interpro' ? 'rocky' : 'interpro'))}
                    className="flex items-center gap-2 px-5 py-2 rounded-full transition-colors"
                    style={{
                      border: '1px solid rgba(255,255,255,0.25)',
                      fontFamily: 'var(--font-label)',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text-on-dark)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                    {theme.swapLabel}
                  </button>

                  {/* Contact label */}
                  <span
                    className="hidden sm:inline cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-label)',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.7)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    CONTACT
                  </span>

                  {/* Resources button */}
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center transition-colors"
                    style={{
                      background: showSidebar ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                      border: `1px solid ${showSidebar ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                    }}
                    title="Resources"
                  >
                    {showSidebar ? (
                      <X className="w-[18px] h-[18px]" style={{ color: 'var(--bg-hero)' }} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    )}
                  </button>
                </motion.div>
              </div>
            </header>

            {/* ─── Content — max-w-7xl, 80/20 split ─── */}
            <div className="max-w-7xl mx-auto min-h-[calc(100vh-150px)]" style={{ background: 'var(--bg)' }}>
              {isMobile ? (
                /* Mobile: single column */
                <div className="flex flex-col">
                  <div className="flex flex-col">
                    {renderMessages()}
                    {renderInput()}
                  </div>
                  <div className="specs-panel">
                    {renderSpecsGallery()}
                  </div>
                </div>
              ) : (
                /* Desktop: 80/20 split */
                <>
                  <div className="flex flex-col" style={{ height: `${chatHeight}px` }}>
                    {renderMessages()}
                    {renderInput()}
                  </div>
                  <div className="specs-panel">
                    {renderSpecsGallery()}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Resources Sidebar Overlay ─── */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            />

            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[360px] sidebar-glass flex flex-col overflow-y-auto"
            >
              {/* Sidebar edge glow */}
              <div className="absolute left-0 top-0 bottom-0 sidebar-edge-glow" />

              {/* Sidebar header */}
              <div className="sidebar-header flex justify-between items-center">
                <div>
                  <div
                    className="mb-0.5"
                    style={{ fontFamily: 'var(--font-label)', fontSize: 11, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.15em' }}
                  >
                    RESOURCES
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)' }}>
                    All connection documents
                  </div>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.6)' }} />
                </button>
              </div>

              {/* Document list */}
              <div className="flex-1 px-5 py-4 space-y-1">
                {/* Technical Documents */}
                <p
                  className="pb-2"
                  style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.1em' }}
                >
                  TECHNICAL DOCUMENTS
                </p>
                {INDEXED_DOCUMENTS.filter(d => d.type === 'document').map((doc, i) => (
                  <div
                    key={i}
                    className="sidebar-doc-item flex items-center gap-2.5 px-2 py-2 rounded-lg"
                  >
                    <div
                      className="w-[26px] h-[26px] rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-card)' }}
                    >
                      <FileText className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <span
                      className="text-[13px] leading-snug truncate"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
                    >
                      {doc.name}
                    </span>
                  </div>
                ))}

                <div className="my-3 h-px" style={{ background: 'var(--border)' }} />

                {/* Performance Data */}
                <p
                  className="pb-2"
                  style={{ fontFamily: 'var(--font-label)', fontSize: 10, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.1em' }}
                >
                  PERFORMANCE DATA
                </p>
                {INDEXED_DOCUMENTS.filter(d => d.type === 'spreadsheet').map((doc, i) => (
                  <div
                    key={i}
                    className="sidebar-doc-item flex items-center gap-2.5 px-2 py-2 rounded-lg"
                  >
                    <div
                      className="w-[26px] h-[26px] rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-card)' }}
                    >
                      <Table2 className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span
                      className="text-[13px] leading-snug truncate"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
                    >
                      {doc.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Sidebar footer */}
              <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p
                  className="text-center"
                  style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--text-muted)' }}
                >
                  {totalChunks} chunks &middot; {INDEXED_DOCUMENTS.length} docs &middot; RAG-powered
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
